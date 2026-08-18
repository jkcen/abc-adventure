// Level runtime — takes a level config and plays it.
// Nothing here is Level-1-specific; Level 2 will be another config object.

import { Player } from './player.js';
import { buildObstacle } from './obstacles.js';
import { Particles } from './particles.js';
import { Dialogue } from './dialogue.js';
import { aabb } from './physics.js';
import { THEMES } from '../levels/theme.js';
import { floatingIsland, pineTree, roundTree, waterfall, mountainRange } from '../render/world-art.js';
import { drawSky, drawBackground, drawMidground, drawForeground, drawCloudSea } from '../render/parallax.js';
import { paintCharacter } from '../render/characters.js';
import { save } from '../core/save.js';
import { audio } from '../core/audio.js';
import { blob, stroke } from '../render/brush.js';

export class Level {
  constructor(cfg, camera, hintEl) {
    this.cfg = cfg;
    this.theme = THEMES[cfg.theme];
    this.cam = camera;
    this.hintEl = hintEl;
    this.t = 0;

    this.player = new Player(cfg.player.id, cfg.player.x, cfg.player.y - 44);
    this.obstacles = cfg.obstacles.map(buildObstacle).filter(Boolean);
    this.particles = new Particles();
    this.dialogue = new Dialogue();

    this.checkpoint = cfg.checkpoints[0];
    this.activeHint = null;
    this.phase = 'play';        // play | arrival | done
    this.arrivalStep = 0;
    this.arrivalT = 0;
    this.onComplete = null;

    // B waits on her island; she is only rendered once the camera nears her.
    this.B = {
      id: 'B', x: cfg.arrival.bStandX, y: cfg.arrival.bY - 44,
      w: 40, h: 44, facing: -1, state: 'idle', animT: 0, vx: 0,
    };

    this.cam.bounds = cfg.bounds;
    this.cam.snapTo(this.player.cx, this.player.cy);

    // fx bridge handed to systems that need feedback without importing each other
    this.fx = {
      particles: this.particles,
      shake: (a) => this.cam.kick(a),
      onJump: () => { audio.jump(); this._dust(6, -1); },
      onLand: (p, v) => { audio.land(); this._dust(Math.min(12, v / 40), 1); },
      onPlayerHurt: () => {
        audio.hurt(); this.cam.kick(0.5);
        this.particles.burst(this.player.cx, this.player.cy, 10,
          { color: '#ffd08a', life: 0.5, r: 3 });
      },
    };

    audio.setMood(cfg.mood);
  }

  _dust(n, dir) {
    const p = this.player;
    this.particles.burst(p.cx, p.y + p.h, n, {
      color: '#e8dff5', vy: dir > 0 ? -110 : -40, g: 500, life: 0.42, r: 3,
    });
  }

  // ---------------------------------------------------------------- solids ---
  get solids() {
    const out = [];
    for (const g of this.cfg.ground) out.push({ x: g.x, y: g.y, w: g.w, h: g.h });
    for (const o of this.obstacles) if (o.type === 'platform') out.push(o);
    return out;
  }

  // ---------------------------------------------------------------- update ---
  update(dt, input) {
    this.t += dt;
    const p = this.player;

    for (const o of this.obstacles) o.update(dt, this.t, this.fx);

    if (this.phase === 'arrival') this._updateArrival(dt, input);

    p.update(dt, input, this.solids, this.fx);

    // environmental forces (wind, waterfall) act after movement integration
    let windy = 0;
    for (const o of this.obstacles) {
      if (o.applyTo && o.applyTo(p, dt, this.fx)) {
        if (o.type === 'wind') windy = o.strength;
      }
    }
    audio.setWind(windy);

    // damage (never instant death — knockback + brief invulnerability)
    if (this.phase === 'play') {
      for (const o of this.obstacles) {
        if (!o.hits || !o.hits(p)) continue;
        const hx = o.x ?? p.cx, hy = o.y ?? p.cy;
        if (p.hurt(hx, hy, this.fx)) {
          if (o.type === 'fire') audio.fire();
          if (o.type === 'rock') audio.rockHit();
        }
      }
      this._checkFall();
      this._checkCheckpoints();
      this._checkRoute();
      this._checkHints();
      this._checkArrivalTrigger();
    }

    this.particles.update(dt);
    this.dialogue.update(dt, input);

    // camera: the dialogue/cutscene owns framing during arrival
    this.cam.update(dt, this.phase === 'arrival' ? { x: p.cx, y: p.cy, vx: 0 } : p);

    this.B.animT += dt;
    audio.updateMusic(dt, this.t);
  }

  _checkFall() {
    if (this.player.y < this.cfg.fallY) return;
    const c = this.checkpoint;
    this.player.respawn(c.x + 40, c.y);
    this.cam.snapTo(this.player.cx, this.player.cy);
    this.particles.burst(this.player.cx, this.player.cy, 14,
      { color: '#ffffff', life: 0.6, r: 3, g: 200 });
  }

  _checkCheckpoints() {
    for (const c of this.cfg.checkpoints) {
      if (c === this.checkpoint) continue;
      if (Math.abs(this.player.cx - c.x) < 70 && Math.abs(this.player.cy - c.y) < 130) {
        // Never move the checkpoint backwards along the journey.
        if (c.x <= this.checkpoint.x) continue;
        this.checkpoint = c;
        save.data.checkpoint = c.id;
        save.write();
        audio.checkpoint();
        this.particles.burst(c.x, c.y - 10, 12,
          { color: '#fff0b8', life: 0.8, r: 3, vy: -160, g: 300 });
      }
    }
  }

  _checkRoute() {
    if (save.data.routeTaken) return;
    for (const m of this.cfg.routeMarkers) {
      if (this.player.cx > m.x && this.player.cx < m.x + m.w) {
        save.data.routeTaken = m.route;
        save.visit(`${this.cfg.id}-${m.route}`);
        save.write();
      }
    }
  }

  _checkHints() {
    let found = null;
    for (const h of this.cfg.hints) {
      if (save.sawHint(h.id)) continue;
      if (this.player.cx > h.x - h.w / 2 && this.player.cx < h.x + h.w / 2) { found = h; break; }
    }
    if (found !== this.activeHint) {
      this.activeHint = found;
      if (found) {
        this.hintEl.textContent = found.text;
        this.hintEl.classList.add('on');
      } else {
        this.hintEl.classList.remove('on');
      }
    }
    // A hint retires once the player has clearly moved past its lesson.
    if (this.activeHint && this.player.cx > this.activeHint.x + this.activeHint.w / 2) {
      save.markHint(this.activeHint.id);
    }
  }

  // ------------------------------------------------------- arrival at B ------
  _checkArrivalTrigger() {
    if (this.player.cx < this.cfg.arrival.triggerX) return;
    this.phase = 'arrival';
    this.arrivalStep = 0;
    this.arrivalT = 0;
    this.player.control = false;
    this.hintEl.classList.remove('on');
    save.visit('b-island');
    audio.discover();
  }

  _updateArrival(dt, input) {
    this.arrivalT += dt;
    const p = this.player, B = this.B, A = this.cfg.arrival;

    switch (this.arrivalStep) {
      case 0: // A lands and steadies; camera pulls out to show the island
        this.cam.targetZoom = 0.92;
        if (p.onGround && this.arrivalT > 0.6) this._step(1);
        break;

      case 1: // B notices — she turns and hops, before any words appear
        B.state = 'surprised';
        B.facing = -1;
        if (this.arrivalT > 0.9) { B.state = 'happy'; this._step(2); }
        break;

      case 2: { // they walk toward each other
        // The meeting point is fixed the moment this step begins. Recomputing
        // it per-frame makes A chase a target that her own movement moves.
        if (!this._meet) {
          const mid = (p.cx + B.x + B.w / 2) / 2;
          this._meet = { a: mid - 46, b: mid + 46 };
          p.scripted = { targetX: this._meet.a };
        }
        const bCx = B.x + B.w / 2;
        const bDone = bCx <= this._meet.b + 3;
        if (!bDone) { B.x -= 52 * dt; B.state = 'walk'; }
        else { B.state = 'idle'; }
        B.facing = -1;

        this.cam.override = { x: (p.cx + bCx) / 2, y: p.cy - 30, zoom: 1.12 };

        if (bDone && (p.scripted?.done || this.arrivalT > 4)) {
          p.scripted = null; p.vx = 0; B.state = 'idle';
          this._step(3);
        }
        break;
      }

      case 3: { // short dialogue, anchored to the birds themselves
        if (this.dialogue.active) break;
        if (this._spoke) { this._step(4); break; }
        this._spoke = true;
        p.forcedState = 'idle'; p.facing = 1;
        this.dialogue.play([
          { speaker: 'A', text: 'I flew a long way to find you.', anchor: () => ({ x: p.cx, y: p.y }) },
          { speaker: 'B', text: 'All the way across the rings and the falling rocks?', anchor: () => ({ x: B.x + B.w / 2, y: B.y }) },
          { speaker: 'A', text: 'C is out there somewhere. Alone. I want to find her.', anchor: () => ({ x: p.cx, y: p.y }) },
          { speaker: 'B', text: 'Then I’m coming with you.', anchor: () => ({ x: B.x + B.w / 2, y: B.y }) },
        ]);
        break;
      }

      case 4: // celebrate, then hand back to the game
        B.state = 'celebrate';
        p.forcedState = 'celebrate';
        if (this.arrivalT > 0.4 && !this._confetti) {
          this._confetti = true;
          save.meet('B');
          save.complete('level-1');
          audio.discover();
          for (let i = 0; i < 26; i++) {
            this.particles.spawn(p.cx + (Math.random() * 200 - 40), p.y - 20, {
              color: ['#ffd98a', '#ffffff', '#c8f0b8', '#ffc0d8'][i % 4],
              vy: -220 - Math.random() * 120, vx: (Math.random() * 2 - 1) * 130,
              g: 380, life: 1.5, r: 4,
            });
          }
        }
        if (this.arrivalT > 2.6) {
          p.forcedState = null;
          this.phase = 'done';
          this.cam.override = null;
          this.onComplete?.();
        }
        break;
    }
  }

  _step(n) { this.arrivalStep = n; this.arrivalT = 0; }

  // ---------------------------------------------------------------- render ---
  draw(ctx) {
    const th = this.theme, t = this.t, cam = this.cam;

    drawSky(ctx, cam, th);
    drawBackground(ctx, cam, th, t);
    drawMidground(ctx, cam, th, t);
    drawCloudSea(ctx, cam, th, this.cfg.cloudSeaY, t);

    ctx.save();
    cam.apply(ctx);

    // --- decorative midground that lives in world space ---
    for (const d of this.cfg.deco) {
      if (d.kind === 'mountains') {
        mountainRange(ctx, d.x, d.y + 4, d.w, d.h, d.seed, th.mountainNear, th.mountainInk, 3);
      }
    }
    for (const d of this.cfg.deco) {
      if (d.kind === 'waterfall') waterfall(ctx, d.x, d.y, d.w, d.h, d.x, th, t);
    }

    // --- islands ---
    for (const g of this.cfg.ground) floatingIsland(ctx, g.x, g.y, g.w, g.h, g.seed, th);

    // --- trees sit on top of the islands ---
    for (const d of this.cfg.deco) {
      if (d.kind !== 'tree') continue;
      if (d.variant === 'pine') pineTree(ctx, d.x, d.y, d.scale, d.x, th, t);
      else roundTree(ctx, d.x, d.y, d.scale, d.x, th, t);
    }

    this._drawCheckpoints(ctx, t);

    // --- obstacles ---
    for (const o of this.obstacles) o.draw(ctx, th, t);

    // --- characters ---
    if (this.phase !== 'play' || this.player.cx > this.cfg.arrival.triggerX - 900) {
      paintCharacter(ctx, 'B', this.B.state, this.B.x, this.B.y, this.B.w, this.B.h, this.B.animT, this.B.facing);
    }
    this.player.draw(ctx, t);

    this.particles.draw(ctx);
    this.dialogue.draw(ctx, t);

    ctx.restore();

    drawForeground(ctx, cam, th, t);
  }

  // A small carved marker; it lights up once it's your respawn point.
  _drawCheckpoints(ctx, t) {
    for (const c of this.cfg.checkpoints) {
      if (c.id === 'start') continue;
      const on = c === this.checkpoint;
      ctx.save();
      ctx.globalAlpha = on ? 1 : 0.5;
      stroke(ctx, c.x, c.y, c.x, c.y - 34, this.theme.trunk, 4, c.x, 1.2);
      const bob = on ? Math.sin(t * 3) * 2 : 0;
      blob(ctx, c.x + 10, c.y - 34 + bob, 13, 10,
           on ? '#ffe28a' : '#cfc3e0', c.x + 3, { stroke: this.theme.ink, lw: 2 });
      if (on) {
        ctx.globalAlpha = 0.35 + Math.sin(t * 3) * 0.15;
        blob(ctx, c.x + 10, c.y - 34 + bob, 22, 18, '#fff3c0', c.x + 9);
      }
      ctx.restore();
    }
  }
}
