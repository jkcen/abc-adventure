// Level runtime — takes a level config and plays it.
// Nothing here is Level-1-specific; Level 2 will be another config object.

import { Player } from './player.js';
import { buildObstacle } from './obstacles.js';
import { Particles } from './particles.js';
import { Dialogue } from './dialogue.js';
import { aabb } from './physics.js';
import { THEMES } from '../levels/theme.js';
import { floatingIsland, pineTree, roundTree, waterfall, mountainRange,
         weedBand, riverBand, lilyPad, rootIsland, boat, slide, waterWheel,
         forestGround, forestTree, autumnBranch, plank, dripCliff,
         ropeLadder, arrowSign, bigButterfly } from '../render/world-art.js';
import { drawSky, drawBackground, drawMidground, drawForeground, drawCloudSea } from '../render/parallax.js';
import { paintCharacter } from '../render/characters.js';
import { save } from '../core/save.js';
import { audio } from '../core/audio.js';
import { blob, stroke } from '../render/brush.js';

export class Level {
  // opts.resume — continue from the checkpoint stored in the save file.
  constructor(cfg, camera, hintEl, opts = {}) {
    this.cfg = cfg;
    this.theme = THEMES[cfg.theme];
    this.cam = camera;
    this.hintEl = hintEl;
    this.t = 0;

    this.player = new Player(cfg.player.id, cfg.player.x, cfg.player.y - 44);
    this.obstacles = cfg.obstacles.map(buildObstacle).filter(Boolean);
    this.particles = new Particles();
    this.dialogue = new Dialogue();

    // Where this run begins: the start of the chapter, or the last checkpoint
    // the player reached in it if they asked to continue.
    this.checkpoint = cfg.checkpoints[0];
    if (opts.resume && save.data.level === cfg.id && save.data.checkpoint) {
      const c = cfg.checkpoints.find(k => k.id === save.data.checkpoint);
      if (c) { this.checkpoint = c; this.player.respawn(c.x + 40, c.y); }
    } else {
      save.data.checkpoint = null;
    }
    save.data.level = cfg.id;
    save.write();

    this.activeHint = null;
    this.phase = 'play';        // intro | play | arrival | done
    this.arrivalStep = 0;
    this.arrivalT = 0;
    this.onComplete = null;

    // The partner of this chapter. In Level 1 B waits on her island; in
    // Level 2 she travels with A and is a companion instead.
    this.partnerId = cfg.arrival.partner ?? 'B';
    this.B = {
      id: this.partnerId, x: cfg.arrival.bStandX, y: cfg.arrival.bY - 44,
      w: 40, h: 44, facing: -1, state: 'idle', animT: 0, vx: 0,
    };
    // The companion starts right beside A. (Without this she'd be spawned at
    // the partner's standing spot — the far end of the level — and come
    // streaking across the map on the first frame.)
    this.companion = cfg.companion
      ? { ...this.B, id: cfg.companion.id, facing: 1,
          x: this.player.x - (cfg.companion.offset ?? 56), y: this.player.y }
      : null;
    this._trail = [];
    this.sail = 0;              // 0→1 as the boat leaves the island
    this._aboard = false;       // A and B are standing in the boat, not beside it
    this.seeds = { got: 0, total: cfg.obstacles.filter(o => o.kind === 'seed').length };

    // An opening beat, if this chapter has one: A arrives somewhere and gets
    // off whatever brought her there before the player takes over.
    // The owl encounter: she talks, then she chases. Purely data-driven.
    this.chaseCfg = cfg.chase ?? null;
    this.owl = null;          // {x, y, state, t} once she lifts off
    this.chasing = false;
    this._chaseDone = false;

    this.intro = cfg.intro ?? null;
    this.introStep = 0;
    this.introT = 0;
    if (this.intro) {
      this.phase = 'intro';
      this.player.control = false;
    }

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
    if (cfg.mapLocation) save.visit(cfg.mapLocation);   // the map opens as you arrive
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

    // The driveable boat needs to know who is aboard and what they're pressing.
    this.fx.player = p;
    this.fx.input = input;
    p.steering = false;
    for (const o of this.obstacles) o.update(dt, this.t, this.fx);

    if (this.phase === 'intro') this._updateIntro(dt, input);
    if (this.phase === 'encounter') this._updateEncounter(dt);
    if (this.phase === 'rescue') this._updateRescue(dt);
    if (this.phase === 'arrival') this._updateArrival(dt, input);
    if (this.owl) this._updateOwl(dt);

    if (this.phase === 'rescue') {
      // The boat owns her position while it carries her; physics would only
      // drag her back off the deck.
      p.animT += dt; p.vx = 0; p.vy = 0; p.onGround = true;
      if (p.forcedState) p.state = p.forcedState;
    } else {
      p.update(dt, input, this.solids, this.fx);
    }

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
      this._checkChaseTrigger();
      this._checkFall();
      this._checkCheckpoints();
      this._checkRoute();
      this._checkHints();
      this._checkArrivalTrigger();
      for (const o of this.obstacles) o.track?.(p, this.fx);
    }

    if (this.phase !== 'done') this._checkSeeds();
    if (this.companion && !this._aboard) this._updateCompanion(dt);

    this.particles.update(dt);
    this.dialogue.update(dt, input);

    // camera: the dialogue/cutscene owns framing during arrival
    this.cam.update(dt, this.phase === 'arrival' ? { x: p.cx, y: p.cy, vx: 0 } : p);

    this.B.animT += dt;
    audio.updateMusic(dt, this.t);
  }

  // Golden seeds — a reward, never a requirement.
  _checkSeeds() {
    for (const o of this.obstacles) {
      if (!o.pickup || !o.pickup(this.player)) continue;
      this.seeds.got++;
      audio.checkpoint();
      this.particles.burst(o.x, o.y, 12,
        { color: '#f6dd7a', life: 0.7, r: 3, vy: -180, g: 320 });
    }
  }

  // The companion flies A's own path a beat behind her, so she never blocks a
  // jump and never needs pathfinding of her own.
  _updateCompanion(dt) {
    const p = this.player, c = this.companion;

    // If A is riding the boat, B rides it too — standing on the deck beside
    // her, on the roomier half of the hull. Trailing her would leave B
    // hanging in mid-air off the stern.
    const b = p.ground?.isBoat ? p.ground : null;
    if (b) {
      const mid = b.x + b.w / 2;
      const side = p.cx <= mid ? 1 : -1;
      const tx = mid + side * 30 - c.w / 2;
      const k = Math.min(1, dt * 9);
      c.x += (tx - c.x) * k;
      c.y += ((b.y - c.h) - c.y) * k;
      c.facing = p.facing;
      c.state = 'idle';
      c.animT += dt;
      return;
    }

    this._trail.push({ x: p.x, y: p.y, facing: p.facing, state: p.state });
    if (this._trail.length > 22) this._trail.shift();
    const at = this._trail[0];
    const back = (this.cfg.companion.offset ?? 56) * (at.facing >= 0 ? 1 : -1);
    c.x += ((at.x - back) - c.x) * Math.min(1, dt * 7);
    c.y += ((at.y - 6) - c.y) * Math.min(1, dt * 7);
    c.facing = at.facing;
    c.state = at.state === 'idle' ? 'idle' : (at.state === 'walk' || at.state === 'run' ? at.state : 'fly');
    c.animT += dt;
  }

  _checkFall() {
    if (this.player.y < this.cfg.fallY) return;

    // A chapter with a rescue boat never bounces you back on its own: the
    // boat sails under you, catches you, and carries you back up.
    if (this.cfg.rescue) { this._startRescue(); return; }

    const c = this.checkpoint;
    this.player.respawn(c.x + 40, c.y);
    this.cam.snapTo(this.player.cx, this.player.cy);
    this.particles.burst(this.player.cx, this.player.cy, 14,
      { color: '#ffffff', life: 0.6, r: 3, g: 200 });
    this._resetChaseAfterFall();
  }

  // ------------------------------------------------------- the rescue boat ---
  // Falling is not failure here. The boat that carried them out of the Weed
  // Sea is still down on the water; it slides under whoever falls, and then
  // sails them back to the last place they stood.
  _startRescue() {
    const R = this.cfg.rescue, p = this.player, c = this.checkpoint;
    this.phase = 'rescue';
    this.rescueT = 0;
    this.rescueStep = 0;
    p.control = false;
    p.vx = 0; p.vy = 0;
    p.invuln = 2.5;
    this.hintEl.classList.remove('on');

    // she lands on the deck exactly where she fell, then the boat turns back
    this.boat = { x: p.cx, y: R.y, from: p.cx, to: (c.x + 30), t: 0 };
    p.x = this.boat.x - p.w / 2;
    p.y = R.y - R.deck - p.h;
    p.forcedState = 'tired';
    this.cam.snapTo(p.cx, p.cy);

    this.particles.burst(p.cx, R.y - R.deck, 16,
      { color: '#ffe6c4', life: 0.7, r: 3, vy: -160, g: 340 });
    audio.land();
  }

  _updateRescue(dt) {
    const R = this.cfg.rescue, p = this.player, b = this.boat, c = this.checkpoint;
    this.rescueT += dt;

    switch (this.rescueStep) {
      case 0:   // a beat to see that she is safe, sitting on the deck
        this.cam.override = { x: p.cx, y: p.cy - 40, zoom: 1.04 };
        if (this.rescueT > (R.hold ?? 0.9)) this._rstep(1);
        break;

      case 1: {  // the boat sails back along the water to under the checkpoint
        const speed = R.speed ?? 460;
        const dir = Math.sign(b.to - b.x) || 1;
        b.x += dir * speed * dt;
        if ((dir > 0 && b.x >= b.to) || (dir < 0 && b.x <= b.to)) { b.x = b.to; this._rstep(2); }
        p.x = b.x - p.w / 2;
        p.y = R.y - R.deck - p.h;
        p.facing = dir;
        this.cam.override = { x: p.cx, y: p.cy - 60, zoom: 1 };
        if (Math.random() < 0.5) this.particles.spawn(b.x - dir * 46, R.y - 6,
          { color: '#ffffff', vy: -40, vx: -dir * 40, g: 120, life: 0.5, r: 2.5 });
        break;
      }

      case 2:   // she flies off the deck and back up to solid ground
        p.forcedState = 'fly';
        p.y -= (R.lift ?? 520) * dt;
        this.cam.override = { x: p.cx, y: p.cy - 30, zoom: 1 };
        if (p.y <= c.y - p.h) {
          p.respawn(c.x + 40, c.y);
          p.forcedState = null;
          p.control = true;
          this.boat = null;
          this.cam.override = null;
          this.cam.snapTo(p.cx, p.cy);
          this.particles.burst(p.cx, p.cy, 12,
            { color: '#ffffff', life: 0.6, r: 3, g: 200 });
          this._resetChaseAfterFall();
          this.phase = 'play';
        }
        break;
    }
  }

  _rstep(n) { this.rescueStep = n; this.rescueT = 0; }

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

  // ----------------------------------------------------- opening cutscene -----
  // A gets off the boat that brought her here. The companion needs no special
  // handling: she flies A's trail, so she steps ashore a beat behind her.
  _updateIntro(dt, input) {
    this.introT += dt;
    const p = this.player, I = this.intro;

    switch (this.introStep) {
      case 0: // a held beat on the deck, so you see where you've arrived
        this.cam.override = { x: p.cx + 40, y: p.cy - 10, zoom: 1.12 };
        if (this.introT > 0.9) { p.scripted = { targetX: I.stepX }; this._istep(1); }
        break;

      case 1: // she walks off the deck and drops onto the land
        this.cam.override = { x: p.cx + 60, y: p.cy - 24, zoom: 1.06 };
        if ((p.scripted?.done && p.onGround) || this.introT > 5) {
          p.scripted = null; p.vx = 0; this._istep(2);
        }
        break;

      case 2: // whatever they say about the place they've landed in
        if (this.dialogue.active) break;
        if (this._introSpoke || !I.lines?.length) { this._istep(3); break; }
        this._introSpoke = true;
        p.forcedState = 'idle'; p.facing = 1;
        this.dialogue.play(I.lines.map(l => ({
          speaker: l.speaker, text: l.text,
          anchor: (this.companion && l.speaker === this.companion.id)
            ? () => ({ x: this.companion.x + this.companion.w / 2, y: this.companion.y })
            : () => ({ x: p.cx, y: p.y }),
        })));
        break;

      case 3: // hand the game over
        p.forcedState = null;
        p.control = true;
        this.cam.override = null;
        this.cam.targetZoom = 1;
        this.phase = 'play';
        break;
    }
  }

  _istep(n) { this.introStep = n; this.introT = 0; }

  // ----------------------------------------------------- the owl chase ------
  // She is the wind that carried them across the gap. On the far side she
  // lands in front of them, says her piece, and then comes after them — so
  // the last stretch of the chapter is a run, not a puzzle. She never kills:
  // catching them is a knockback, and she falls back a little each time.
  _checkChaseTrigger() {
    const C = this.chaseCfg;
    if (!C || this._chaseDone || this.owl) return;
    if (this.player.cx < C.triggerX) return;

    // she stops being scenery and becomes a character
    this.obstacles = this.obstacles.filter(o => !(o.type === 'wind' && o.art === 'owl'));
    this.owl = { x: C.fromX, y: C.fromY ?? C.y, state: 'swoop', t: 0, speed: 0 };
    this.phase = 'encounter';
    this.encounterStep = 0;
    this.encounterT = 0;
    this.player.control = false;
    this.player.vx = 0;
    this.hintEl.classList.remove('on');
    audio.discover();
  }

  _updateEncounter(dt) {
    this.encounterT += dt;
    const p = this.player, C = this.chaseCfg, o = this.owl;

    switch (this.encounterStep) {
      case 0: {  // she sweeps in and lands between them and the way ahead
        const tx = p.cx + (C.standAhead ?? 190), ty = (C.standY ?? p.y - 30);
        o.x += (tx - o.x) * Math.min(1, dt * 2.6);
        o.y += (ty - o.y) * Math.min(1, dt * 2.6);
        o.state = 'swoop';
        this.cam.override = { x: (p.cx + o.x) / 2, y: p.cy - 40, zoom: 1.04 };
        p.forcedState = 'surprised'; p.facing = 1;
        if (Math.abs(o.x - tx) < 12 || this.encounterT > 2.2) {
          o.state = 'screech';
          this.cam.kick(0.4);
          this._estep(1);
        }
        break;
      }

      case 1:  // what she says, and what they say back
        if (this.dialogue.active) break;
        if (this._owlSpoke || !C.lines?.length) { this._estep(2); break; }
        this._owlSpoke = true;
        p.forcedState = 'idle';
        this.dialogue.play(C.lines.map(l => ({
          speaker: l.speaker, text: l.text,
          anchor: l.speaker === 'owl'
            ? () => ({ x: this.owl.x, y: this.owl.y - 20 })
            : (this.companion && l.speaker === this.companion.id)
              ? () => ({ x: this.companion.x + this.companion.w / 2, y: this.companion.y })
              : () => ({ x: p.cx, y: p.y }),
        })));
        break;

      case 2:  // she screeches, drops behind them, and the run begins
        o.state = 'screech';
        if (this.encounterT < 0.7) break;
        o.x = p.cx - (C.startBehind ?? 300);
        o.state = 'swoop';
        p.forcedState = null;
        p.control = true;
        this.cam.override = null;
        this.cam.targetZoom = 1;
        this.phase = 'play';
        this.chasing = true;
        this.hintEl.textContent = C.runText ?? 'RUN!';
        this.hintEl.classList.add('on');
        this._runShown = this.t;
        audio.hurt();
        break;
    }
  }

  _estep(n) { this.encounterStep = n; this.encounterT = 0; }

  _updateOwl(dt) {
    const o = this.owl, p = this.player, C = this.chaseCfg;
    o.t += dt;

    // she gives up the moment they reach C — the chapter's reward
    if (!this.chasing && this._chaseDone) {
      o.x -= 260 * dt; o.y -= 150 * dt; o.fade = (o.fade ?? 1) - dt * 0.5;
      if (o.fade <= 0) this.owl = null;
      return;
    }
    if (this.phase !== 'play' || !this.chasing) return;

    // she accelerates from a lope to just under a full sprint: keep running
    // and you stay ahead; stop, and she is on you.
    o.speed = Math.min(C.maxSpeed ?? 250, (o.speed || (C.speed ?? 170)) + (C.accel ?? 22) * dt);
    o.x += o.speed * dt;
    o.y += ((p.y - 26) - o.y) * Math.min(1, dt * 2.2);
    o.state = 'swoop';

    // she can never be outrun into the scenery: she keeps a leash behind you
    const leash = C.leash ?? 760;
    if (p.cx - o.x > leash) o.x = p.cx - leash;

    if (o.x > p.cx - 26 && p.invuln <= 0) {
      if (p.hurt(o.x, o.y, this.fx)) {
        audio.hurt();
        o.x -= C.recoil ?? 280;
        o.speed = C.speed ?? 170;
        this.cam.kick(0.55);
      }
    }

    // the "RUN!" banner retires itself after a few seconds
    if (this._runShown && this.t - this._runShown > 3.4) {
      this._runShown = 0;
      this.hintEl.classList.remove('on');
    }
  }

  // Called when the player respawns: she is pushed back so a fall is never a
  // death sentence with the owl already on top of you.
  _resetChaseAfterFall() {
    if (!this.owl || !this.chasing) return;
    this.owl.x = this.player.cx - (this.chaseCfg.startBehind ?? 300);
    this.owl.y = this.player.y - 40;
    this.owl.speed = this.chaseCfg.speed ?? 170;
  }

  // ------------------------------------------------------- arrival at B ------
  _checkArrivalTrigger() {
    if (this.player.cx < this.cfg.arrival.triggerX) return;
    this.phase = 'arrival';
    if (this.chasing) {          // safe: she breaks off at the sight of C
      this.chasing = false;
      this._chaseDone = true;
      if (this.owl) this.owl.state = 'fly';
    }
    this.arrivalStep = 0;
    this.arrivalT = 0;
    this.player.control = false;
    this.hintEl.classList.remove('on');
    save.visit(this.cfg.arrival.visit ?? this.cfg.mapLocation);
    audio.discover();
  }

  _updateArrival(dt, input) {
    this.arrivalT += dt;
    if (this.cfg.arrival.mode === 'boat') return this._updateBoarding(dt);
    if (this.cfg.arrival.mode === 'talk') return this._updateTalk(dt);
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
        this.dialogue.play(this.cfg.arrival.lines
          ? this.cfg.arrival.lines.map(l => ({
              speaker: l.speaker, text: l.text,
              anchor: l.speaker === this.partnerId
                ? () => ({ x: B.x + B.w / 2, y: B.y })
                : (this.companion && l.speaker === this.companion.id)
                  ? () => ({ x: this.companion.x + this.companion.w / 2, y: this.companion.y })
                  : () => ({ x: p.cx, y: p.y }),
            }))
          : [
          { speaker: 'A', text: 'I flew a long way to find you.', anchor: () => ({ x: p.cx, y: p.y }) },
          { speaker: 'B', text: 'All the way across the rings and the falling rocks?', anchor: () => ({ x: B.x + B.w / 2, y: B.y }) },
          { speaker: 'A', text: 'Peter is out there somewhere. Alone. I want to find her.', anchor: () => ({ x: p.cx, y: p.y }) },
          { speaker: 'B', text: 'Then I’m coming with you.', anchor: () => ({ x: B.x + B.w / 2, y: B.y }) },
        ]);
        break;
      }

      case 4: // celebrate, then hand back to the game
        B.state = 'celebrate';
        p.forcedState = 'celebrate';
        if (this.arrivalT > 0.4 && !this._confetti) {
          this._confetti = true;
          save.meet(this.partnerId);
          save.complete(this.cfg.id);
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

  // A quiet ending for a chapter whose partner is already at A's side: they
  // simply stop, the camera opens out, and they talk about what just happened.
  _updateTalk(dt) {
    const p = this.player, A = this.cfg.arrival;
    const partnerAt = () => this.companion
      ? { x: this.companion.x + 20, y: this.companion.y - 10 }
      : { x: p.cx + 70, y: p.y - 10 };

    switch (this.arrivalStep) {
      case 0:
        this.cam.targetZoom = 0.92;
        p.vx = 0;
        if (p.onGround && this.arrivalT > 0.7) this._step(1);
        break;

      case 1:
        if (this.dialogue.active) break;
        if (this._spoke) { this._step(2); break; }
        this._spoke = true;
        p.forcedState = 'idle'; p.facing = 1;
        this.cam.override = { x: p.cx + 30, y: p.cy - 30, zoom: 1.05 };
        this.dialogue.play((A.lines ?? []).map(l => ({
          speaker: l.speaker, text: l.text,
          anchor: l.speaker === 'A' ? () => ({ x: p.cx, y: p.y }) : partnerAt,
        })));
        break;

      case 2:
        if (!this._done2) {
          this._done2 = true;
          save.meet(this.partnerId);
          save.complete(this.cfg.id);
          audio.discover();
        }
        if (this.arrivalT > 1.4) {
          p.forcedState = null;
          this.phase = 'done';
          this.cam.override = null;
          this.onComplete?.();
        }
        break;
    }
  }

  // Level 2's ending: A and B walk to the boat, say their piece, and sail off
  // toward C. No one is waiting here — the boat itself is the destination.
  _updateBoarding(dt) {
    const p = this.player, A = this.cfg.arrival;

    switch (this.arrivalStep) {
      case 0:
        this.cam.targetZoom = 0.94;
        if (p.onGround && this.arrivalT > 0.5) {
          p.scripted = { targetX: A.boardX };
          this._step(1);
        }
        break;

      case 1:
        this.cam.override = { x: A.boardX, y: A.boardY - 60, zoom: 1.05 };
        if (p.scripted?.done || this.arrivalT > 5) { p.scripted = null; p.vx = 0; this._step(2); }
        break;

      // Climb in FIRST. Nobody says a word while one of them is still in
      // mid-air behind the boat — they board together, then they talk.
      case 2: {
        const b = this._boatAt();
        if (!b) { this._step(3); break; }
        this._aboard = true;           // stops the follow-the-trail companion
        p.frozen = true;
        p.forcedState = 'fly';
        p.facing = 1;
        this._hopFrom ??= { px: p.x, py: p.y,
                            cx: this.companion?.x ?? p.x, cy: this.companion?.y ?? p.y };
        const k = Math.min(1, this.arrivalT / 0.8);
        const e = k * k * (3 - 2 * k);            // ease, so the hop has weight
        const arc = -26 * Math.sin(Math.PI * e);
        const seat = this._seats(b);
        p.x = this._hopFrom.px + (seat.px - this._hopFrom.px) * e;
        p.y = this._hopFrom.py + (seat.py - this._hopFrom.py) * e + arc;
        if (this.companion) {
          const c = this.companion;
          c.state = 'fly'; c.facing = 1; c.animT += dt;
          c.x = this._hopFrom.cx + (seat.cx - this._hopFrom.cx) * e;
          c.y = this._hopFrom.cy + (seat.cy - this._hopFrom.cy) * e + arc;
        }
        this.cam.override = { x: b.x + 20, y: b.deckY - 40, zoom: 1.05 };
        if (k >= 1) this._step(3);
        break;
      }

      // Both aboard: now they speak, and both stay planted on the deck while
      // the hull bobs underneath them.
      case 3: {
        const b = this._boatAt();
        if (b) this._sit(b, dt);
        if (this.dialogue.active) break;
        if (this._spoke) { this._step(4); break; }
        this._spoke = true;
        p.forcedState = 'idle'; p.facing = 1;
        this.dialogue.play((A.lines ?? []).map(l => ({
          speaker: l.speaker, text: l.text,
          anchor: l.speaker === 'A'
            ? () => ({ x: p.cx, y: p.y })
            : this.companion
              ? () => ({ x: this.companion.x + this.companion.w / 2, y: this.companion.y })
              : () => ({ x: p.cx + 70, y: p.y - 10 }),
        })));
        break;
      }

      // and away: the boat sails, and everyone in it goes with it
      case 4: {
        p.forcedState = 'celebrate';
        if (!this._confetti) {
          this._confetti = true;
          save.complete(this.cfg.id);
          save.visit(A.visit ?? 'level-2');
          audio.discover();
          for (let i = 0; i < 26; i++) {
            this.particles.spawn(p.cx + (Math.random() * 180 - 60), p.y - 20, {
              color: ['#ffd98a', '#ffffff', '#c8f0b8', '#ffc0d8'][i % 4],
              vy: -220 - Math.random() * 120, vx: (Math.random() * 2 - 1) * 130,
              g: 380, life: 1.5, r: 4,
            });
          }
        }
        this.sail = Math.min(1, this.arrivalT / 2.4);
        const b = this._boatAt();
        if (b) {
          this._sit(b, dt);
          this.cam.override = { x: b.x + 40, y: b.deckY - 40, zoom: 1.0 };
        }
        if (this.arrivalT > 3.0) {
          p.forcedState = null;
          p.frozen = false;
          this.phase = 'done';
          this.cam.override = null;
          this.onComplete?.();
        }
        break;
      }
    }
  }

  // Where the boat is this frame. Read from the same numbers the painter uses,
  // so anyone placed here rides along instead of walking behind it.
  _boatAt() {
    const d = this.cfg.deco.find(o => o.kind === 'boat' && o.sails);
    if (!d) return null;
    const s = d.scale ?? 1;
    return {
      x: d.x + this.sail * 260,
      deckY: d.y + Math.sin(this.t * 1.4 + d.x) * 3 - 34 * s,
      scale: s,
    };
  }

  // Plant both birds on the deck for this frame. The boat bobs and sails, so
  // this must run every frame they are aboard, not once when they get in.
  _sit(b, dt) {
    const seat = this._seats(b);
    this.player.x = seat.px; this.player.y = seat.py;
    if (this.companion) {
      const c = this.companion;
      c.x = seat.cx; c.y = seat.cy;
      c.state = 'idle'; c.facing = 1; c.animT += dt;
    }
  }

  // The two standing spots inside the hull, as top-left corners.
  _seats(b) {
    const p = this.player, c = this.companion;
    const s = b.scale ?? 1;
    // Feet a hair below the rim, so they read as standing IN the hull rather
    // than balancing on its edge; offsets scale with the boat.
    const floor = b.deckY + 5 * s;
    return {
      px: b.x - 20 * s - p.w / 2, py: floor - p.h,
      cx: b.x + 22 * s - (c ? c.w / 2 : 0), cy: floor - (c ? c.h : 0),
    };
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
      else if (d.kind === 'forestTree') forestTree(ctx, d.x, d.y, d.scale, d.x, th, t);
      else if (d.kind === 'branch') autumnBranch(ctx, d.x, d.y, d.w, d.seed ?? d.x, th, t);
    }

    // --- the yellow slide runs behind the ground it connects ---
    for (const d of this.cfg.deco) {
      if (d.kind === 'slide') slide(ctx, d.x, d.y, d.toX, d.toY, d.w ?? 22, d.x, th);
      else if (d.kind === 'river') riverBand(ctx, d.x, d.y, d.w, d.h, d.seed ?? d.x, th, t);
    }

    // --- ground: islands, weed bands, lily pads, rooted islands ---
    for (const g of this.cfg.ground) {
      if (g.art === 'none') continue;   // solid, but something else paints it
      else if (g.art === 'river') riverBand(ctx, g.x, g.y, g.w, g.h, g.seed, th, t);
      else if (g.art === 'weed') weedBand(ctx, g.x, g.y, g.w, g.h, g.seed, th);
      else if (g.art === 'lily') lilyPad(ctx, g.x, g.y, g.w, g.h, g.seed, th, t);
      else if (g.art === 'root') rootIsland(ctx, g.x, g.y, g.w, g.h, g.seed, th);
      else if (g.art === 'plank') plank(ctx, g.x, g.y, g.w, g.h, g.seed, th);
      else if (g.art === 'cliff') dripCliff(ctx, g.x, g.y, g.w, g.h, g.seed, th);
      else if (g.art === 'forest') forestGround(ctx, g.x, g.y, g.w, g.h, g.seed, th);
      else floatingIsland(ctx, g.x, g.y, g.w, g.h, g.seed, th);
    }

    // --- boats and the little water cart ---
    for (const d of this.cfg.deco) {
      if (d.kind === 'boat') {
        const sailX = d.sails ? (this.sail ?? 0) * 260 : 0;
        boat(ctx, d.x + sailX, d.y, d.scale ?? 1, d.x, th, t, d.label ?? 'BAOT');
      } else if (d.kind === 'wheel') {
        waterWheel(ctx, d.x, d.y, d.scale ?? 1, d.x, th, t);
      } else if (d.kind === 'ladder') {
        ropeLadder(ctx, d.x, d.y, d.h, d.x, th);
      } else if (d.kind === 'arrow') {
        arrowSign(ctx, d.x, d.y, d.w, d.h, d.x, th);
      } else if (d.kind === 'butterfly') {
        bigButterfly(ctx, d.x, d.y, d.scale ?? 1, d.x, th, t, d.variant ?? 'purple');
      }
    }

    // --- trees sit on top of the islands ---
    for (const d of this.cfg.deco) {
      if (d.kind !== 'tree') continue;
      if (d.variant === 'pine') pineTree(ctx, d.x, d.y, d.scale, d.x, th, t);
      else roundTree(ctx, d.x, d.y, d.scale, d.x, th, t);
    }

    this._drawCheckpoints(ctx, t);

    // --- obstacles ---
    for (const o of this.obstacles) o.draw(ctx, th, t);

    // --- the rescue boat, down on the water ---
    if (this.boat) {
      boat(ctx, this.boat.x, this.boat.y, this.cfg.rescue.scale ?? 1.15,
           7, th, t, this.cfg.rescue.label ?? 'BAOT');
    }

    // --- the owl, once she is a character rather than the wind ---
    if (this.owl) {
      const o = this.owl;
      ctx.save();
      if (o.fade !== undefined) ctx.globalAlpha = Math.max(0, o.fade);
      paintCharacter(ctx, 'owl', o.state, o.x - 46, o.y - 50, 92, 100, o.t, 1);
      ctx.restore();
    }

    // --- characters ---
    if (!this.cfg.arrival.mode &&
        (this.phase !== 'play' || this.player.cx > this.cfg.arrival.triggerX - 900)) {
      paintCharacter(ctx, this.partnerId, this.B.state, this.B.x, this.B.y, this.B.w, this.B.h, this.B.animT, this.B.facing);
    }
    if (this.companion) {
      const c = this.companion;
      paintCharacter(ctx, c.id, c.state, c.x, c.y, c.w, c.h, c.animT, c.facing);
    }
    this.player.draw(ctx, t);

    this.particles.draw(ctx);
    this.dialogue.draw(ctx, t);

    ctx.restore();

    drawForeground(ctx, cam, th, t);
    if (this.seeds.total) this._drawSeedCount(ctx);
  }

  // Seed tally, in the corner and in the drawing's own hand.
  _drawSeedCount(ctx) {
    ctx.save();
    ctx.font = '22px "Bradley Hand", "Segoe Print", cursive';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(60,50,30,.8)';
    ctx.fillText(`seeds  ${this.seeds.got} / ${this.seeds.total}`, 26, 40);
    ctx.restore();
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
