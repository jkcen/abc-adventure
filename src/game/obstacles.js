// Obstacles — the child's canonical vocabulary, each as a real mechanic.
// Every one is data-driven from the level config; none kill instantly.

import { circleHitsBox, aabb } from './physics.js';
import { fireRing, rock, dragonfly, windTrails, smallPlatform, waterfall, bug, goldSeed, lilyPad,
         hangingCrate, bigMoth, boat } from '../render/world-art.js';
import { hash, wob } from '../core/rng.js';
import { tumblingBranch } from '../render/world-art.js';
import { paintCharacter } from '../render/characters.js';

let uid = 0;

// --------------------------------------------------------- moving platform ---
// Small green platform. Moves between two points with an ease and a pause at
// each end, so children can read the pattern before committing to a jump.
export class MovingPlatform {
  constructor(c) {
    this.type = 'platform';
    this.x = c.x; this.y = c.y; this.w = c.w ?? 96; this.h = c.h ?? 22;
    this.ax = c.x; this.ay = c.y;
    this.bx = c.toX ?? c.x; this.by = c.toY ?? c.y;
    this.period = c.period ?? 3.2;
    this.pause = c.pause ?? 0.6;
    this.phase = c.phase ?? 0;
    this.seed = ++uid * 7;
    this.dx = 0; this.dy = 0;
    this.solid = true;
    this.passthrough = false;
  }
  update(dt, t) {
    const cycle = this.period * 2 + this.pause * 2;
    let u = ((t + this.phase) % cycle);
    let k;
    if (u < this.period) k = u / this.period;
    else if (u < this.period + this.pause) k = 1;
    else if (u < this.period * 2 + this.pause) k = 1 - (u - this.period - this.pause) / this.period;
    else k = 0;
    const e = k * k * (3 - 2 * k); // smoothstep — no jerky reversals
    const nx = this.ax + (this.bx - this.ax) * e;
    const ny = this.ay + (this.by - this.ay) * e;
    this.dx = nx - this.x; this.dy = ny - this.y;
    this.x = nx; this.y = ny;
  }
  draw(ctx, theme, t) { smallPlatform(ctx, this.x, this.y, this.w, this.h, this.seed, theme, t); }
}

// ----------------------------------------------------------------- fire ring ---
// The hole in the middle is SAFE — the player aims through it or goes around.
// Touching the burning band is a gentle knockback, never a death.
export class FireRing {
  constructor(c) {
    this.type = 'fire';
    this.x0 = c.x; this.y0 = c.y;
    this.x = c.x; this.y = c.y;
    this.r = c.r ?? 62;
    this.band = c.band ?? 20;
    this.moveX = c.moveX ?? 0;
    this.moveY = c.moveY ?? 0;
    this.speed = c.speed ?? 0.7;
    this.phase = c.phase ?? 0;
    this.seed = ++uid * 3;
  }
  update(dt, t) {
    const s = Math.sin((t + this.phase) * this.speed);
    this.x = this.x0 + this.moveX * s;
    this.y = this.y0 + this.moveY * Math.sin((t + this.phase) * this.speed * 1.3);
  }
  hits(body) {
    const cx = body.x + body.w / 2, cy = body.y + body.h / 2;
    const d = Math.hypot(cx - this.x, cy - this.y);
    // Only the ring itself burns.
    return d > this.r - this.band && d < this.r + this.band;
  }
  draw(ctx, theme, t) { fireRing(ctx, this.x, this.y, this.r, t, this.seed); }
}

// ---------------------------------------------------------- falling rocks ---
// Always telegraphed: shadow grows, dust puffs, small shake — THEN it falls.
export class FallingRock {
  constructor(c) {
    this.type = 'rock';
    this.x = c.x; this.startY = c.y; this.groundY = c.groundY;
    this.r = c.r ?? 20;
    this.period = c.period ?? 3.0;
    this.warn = c.warn ?? 0.9;
    this.phase = c.phase ?? 0;
    this.seed = ++uid * 11;
    this.y = c.y;
    this.state = 'wait';
    this.t = 0;
  }
  update(dt, t, fx) {
    const u = ((t + this.phase) % this.period);
    const prev = this.state;
    if (u < this.warn) {
      this.state = 'warn';
      this.y = this.startY;
      this.warnK = u / this.warn;
      if (prev !== 'warn') fx?.particles.burst(this.x, this.startY + 10, 4,
        { color: '#d9cbe6', vy: 40, g: 120, life: 0.5, r: 2 });
    } else {
      this.state = 'fall';
      const ft = u - this.warn;
      this.y = this.startY + 0.5 * 1500 * ft * ft;
      if (this.y >= this.groundY - this.r) {
        this.y = this.groundY - this.r;
        if (prev === 'fall' && !this.landed) {
          this.landed = true;
          fx?.particles.burst(this.x, this.groundY, 10,
            { color: '#cfc0dd', vy: -140, g: 700, life: 0.5, r: 3 });
          fx?.shake(0.22);
        }
      } else this.landed = false;
    }
    if (u < this.warn) this.landed = false;
  }
  hits(body) {
    if (this.state !== 'fall') return false;
    return circleHitsBox(this.x, this.y, this.r * 0.85, body);
  }
  draw(ctx, theme, t) {
    // warning shadow on the ground below
    ctx.save();
    ctx.globalAlpha = this.state === 'warn' ? 0.15 + this.warnK * 0.4 : 0.32;
    ctx.fillStyle = '#2b1f3a';
    ctx.beginPath();
    ctx.ellipse(this.x, this.groundY - 2, this.r * (this.state === 'warn' ? 0.7 + this.warnK * 0.5 : 1.1),
                this.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const shakeX = this.state === 'warn' ? Math.sin(t * 40) * this.warnK * 2.5 : 0;
    rock(ctx, this.x + shakeX, this.y, this.r, this.seed, theme);
  }
}

// --------------------------------------------------------- wind dragonfly ---
// The dragonfly IS the wind source — it hovers, and the current it makes is a
// zone that pushes A. Used both to hinder and to help her reach far platforms.
export class WindDragonfly {
  constructor(c) {
    this.type = 'wind';
    this.x = c.x; this.y = c.y;
    this.zone = { x: c.zoneX, y: c.zoneY, w: c.zoneW, h: c.zoneH };
    this.dir = c.dir ?? 1;
    this.force = c.force ?? 620;
    this.gust = c.gust ?? 0;      // 0 = constant; >0 = pulses with this period
    this.seed = ++uid * 5;
    this.strength = 1;
    this.art = c.art ?? 'dragonfly';   // level 3's wind comes from the big brown moth
    this.scale = c.scale ?? 1;
  }
  update(dt, t) {
    this.strength = this.gust > 0
      ? Math.max(0, Math.sin((t / this.gust) * Math.PI * 2)) // long calm, clear gust
      : 1;
  }
  applyTo(body, dt) {
    if (this.strength <= 0.02) return false;
    if (!aabb(body, this.zone)) return false;
    body.vx += this.dir * this.force * this.strength * dt;
    return true;
  }
  draw(ctx, theme, t) {
    if (this.strength > 0.05) {
      ctx.globalAlpha = this.strength;
      windTrails(ctx, this.zone.x, this.zone.y, this.zone.w, this.zone.h, this.dir, t, this.seed);
      ctx.globalAlpha = 1;
    }
    if (this.art === 'owl') {
      // Owl herself is the wind here: her wingbeats are what carry them across.
      const w = 92 * this.scale, h = 100 * this.scale;
      paintCharacter(ctx, 'owl', 'fly', this.x - w / 2, this.y - h / 2, w, h, t, this.dir);
    }
    else if (this.art === 'moth') bigMoth(ctx, this.x, this.y, this.scale, this.dir, t, this.seed, theme);
    else dragonfly(ctx, this.x, this.y, this.scale * 1.5, this.dir, t, this.seed);
  }
}

// ------------------------------------------------------------- waterfall ----
// Scenery AND mechanic: falling inside one is a safe, slowed descent.
export class Waterfall {
  constructor(c) {
    this.type = 'waterfall';
    this.x = c.x; this.y = c.y; this.w = c.w; this.h = c.h;
    this.seed = ++uid * 13;
  }
  update() {}
  applyTo(body, dt, fx) {
    if (!aabb(body, this)) return false;
    body.vy = Math.min(body.vy, 210);      // feather the fall
    body.vx *= 0.94;
    if (Math.random() < 0.4) fx?.particles.spawn(body.x + body.w / 2, body.y + body.h,
      { color: '#dff1fb', vy: 120, g: 200, life: 0.45, r: 2.4 });
    return true;
  }
  draw(ctx, theme, t) { waterfall(ctx, this.x, this.y, this.w, this.h, this.seed, theme, t); }
}

// ------------------------------------------------------------------ bugs ----
// Patrols a platform. No combat — jump it, wait it out, or route around.
export class Bug {
  constructor(c) {
    this.type = 'bug';
    this.minX = c.minX; this.maxX = c.maxX;
    this.y = c.y;
    this.x = c.x ?? c.minX;
    this.dir = 1;
    this.speed = c.speed ?? 52;
    this.seed = ++uid * 17;
    this.w = 22; this.h = 16;
    this.color = c.color ?? null;   // level 3's ants are black, not ladybird red
  }
  update(dt) {
    this.x += this.dir * this.speed * dt;
    if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
    if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
  }
  hits(body) {
    return aabb(body, { x: this.x - 11, y: this.y - 10, w: 22, h: 18 });
  }
  draw(ctx, theme, t) { bug(ctx, this.x, this.y, 1, this.dir, t, this.seed, this.color); }
}

// ------------------------------------------------------------ gold seeds ----
// Level 2's collectible: the golden seeds hanging in a row over the weed sea.
// Purely a reward — missing one never blocks the journey.
export class GoldSeed {
  constructor(c) {
    this.type = 'seed';
    this.x = c.x; this.y = c.y;
    this.r = c.r ?? 13;
    this.seed = ++uid * 19;
    this.taken = 0;          // 0 → 1 pop animation
    this.collected = false;
  }
  update(dt) { if (this.collected && this.taken < 1) this.taken = Math.min(1, this.taken + dt * 3); }
  pickup(body) {
    if (this.collected) return false;
    if (!circleHitsBox(this.x, this.y, this.r + 10, body)) return false;
    this.collected = true;
    return true;
  }
  draw(ctx, theme, t) {
    if (this.taken >= 1) return;
    goldSeed(ctx, this.x, this.y, this.r, this.seed, theme, t, this.taken);
  }
}

// A lily pad that drifts — same mechanic as MovingPlatform, drawn as the
// cloud-shaped pad from the drawing.
// The boat you drive. The whole river is one path: A steps aboard and steers
// it forward and back herself — it never moves on its own. She can jump off at
// any time, and the water surface below is solid, so falling off is never a
// punishment.
export class RiverBoat {
  constructor(c) {
    this.type = 'platform';
    this.w = c.w ?? 118;
    this.h = c.h ?? 22;
    this.x = c.x; this.y = c.y;
    this.minX = c.minX ?? c.x;
    this.maxX = c.maxX ?? c.x;
    this.speed = c.speed ?? 190;
    this.label = c.label ?? 'BAOT';
    this.scale = c.scale ?? 1;
    this.isBoat = true;   // the companion perches on this instead of trailing in mid-air
    this.seed = ++uid * 23;
    this.vx = 0;
    this.dx = 0; this.dy = 0;
    this.solid = true;
    // One-way, like every deck: she hops up onto it from the water and can
    // jump straight back off, and never gets blocked by walking into its side.
    this.passthrough = c.passthrough ?? true;
  }

  update(dt, t, fx) {
    const rider = fx?.player;
    const ridden = !!rider && rider.ground === this;

    let want = 0;
    if (ridden && fx.input) {
      want = (fx.input.right ? 1 : 0) - (fx.input.left ? 1 : 0);
      rider.steering = true;
      if (want !== 0) rider.facing = want;
    }

    // Ease in and coast to a stop, so a boat never feels like a keypress.
    const target = want * this.speed;
    const rate = want !== 0 ? 620 : 380;
    const d = target - this.vx;
    this.vx += Math.sign(d) * Math.min(Math.abs(d), rate * dt);

    const nx = Math.max(this.minX, Math.min(this.maxX, this.x + this.vx * dt));
    if (nx === this.minX || nx === this.maxX) this.vx = 0;
    this.dx = nx - this.x;
    this.dy = 0;
    this.x = nx;
  }

  draw(ctx, theme, t) {
    // boat() draws its hull from -34 up to +8 of the given base line, so the
    // deck lands exactly on this platform's top edge.
    boat(ctx, this.x + this.w / 2, this.y + 34 * this.scale, this.scale, this.seed, theme, t, this.label);
  }
}

// The crate on its rope — a lift up the cliff face in Level 3. Same mechanic
// as MovingPlatform, drawn as the hanging box from the drawing.
export class CratePlatform extends MovingPlatform {
  constructor(c) { super(c); this.h = c.h ?? 24; }
  draw(ctx, theme, t) { hangingCrate(ctx, this.x, this.y, this.w, this.h, this.seed, theme, t); }
}

export class LilyPlatform extends MovingPlatform {
  constructor(c) { super(c); this.h = c.h ?? 26; }
  draw(ctx, theme, t) { lilyPad(ctx, this.x, this.y, this.w, this.h, this.seed, theme, t); }
}

export function buildObstacle(cfg) {
  switch (cfg.kind) {
    case 'platform':  return new MovingPlatform(cfg);
    case 'fire':      return new FireRing(cfg);
    case 'rock':      return new FallingRock(cfg);
    case 'wind':      return new WindDragonfly(cfg);
    case 'waterfall': return new Waterfall(cfg);
    case 'bug':       return new Bug(cfg);
    case 'owlwatch':  return new OwlWatcher(cfg);
    case 'owl':       return new OwlSwoop(cfg);
    case 'branch':    return new FallingBranch(cfg);
    case 'seed':      return new GoldSeed(cfg);
    case 'lily':      return new LilyPlatform(cfg);
    case 'crate':     return new CratePlatform(cfg);
    case 'boat':      return new RiverBoat(cfg);
    default: console.warn('[obstacles] unknown kind', cfg.kind); return null;
  }
}

// ------------------------------------------------------------------ OWL -----
// Owl is not a monster and never kills. She interferes: she watches, she
// swoops across the path, she knocks branches loose. Every action is
// telegraphed so a child learns her rhythm and beats it.

// She sits in a tree and simply WATCHES — her eyes follow A across the screen.
// No collision. This is the introduction, and its whole job is unease.
export class OwlWatcher {
  constructor(c) {
    this.type = 'owlwatch';
    this.x = c.x; this.y = c.y;
    this.w = c.w ?? 86; this.h = c.h ?? 96;
    this.leaveX = c.leaveX ?? null;   // once A passes this, she lifts off
    this.state = 'watch';
    this.t = 0;
    this.gone = false;
    this.flyT = 0;
  }
  update(dt, t, fx) {
    this.t += dt;
    if (this.gone) { this.flyT += dt; this.x += 210 * dt; this.y -= 96 * dt; }
  }
  // Called by the level so she can react to where A actually is.
  track(player, fx) {
    if (this.gone || this.leaveX === null) return;
    if (player.cx > this.leaveX) {
      this.gone = true;
      this.state = 'fly';
      fx?.shake(0.18);
      fx?.particles.burst(this.x + this.w / 2, this.y + this.h * 0.4, 10,
        { color: '#c0512a', life: 0.7, r: 3, vy: -90, g: 240 });
    }
  }
  hits() { return false; }
  draw(ctx, theme, t) {
    if (this.flyT > 3) return;
    ctx.save();
    if (this.gone) ctx.globalAlpha = Math.max(0, 1 - this.flyT / 3);
    paintCharacter(ctx, 'owl', this.state, this.x, this.y, this.w, this.h, this.t, 1);
    ctx.restore();
  }
}

// The chase: she dives along an arc across the path on a fixed rhythm.
// A shadow sweeps the ground first, so the dive is always readable.
export class OwlSwoop {
  constructor(c) {
    this.type = 'owl';
    this.fromX = c.fromX; this.toX = c.toX;
    this.y = c.y;                      // height she starts and ends at
    this.dipY = c.dipY ?? c.y + 150;   // lowest point of the dive
    this.groundY = c.groundY ?? this.dipY + 120;
    this.period = c.period ?? 4.2;
    this.warn = c.warn ?? 1.1;
    this.dive = c.dive ?? 1.5;
    this.phase = c.phase ?? 0;
    this.w = 84; this.h = 92;
    this.seed = ++uid * 23;
    this.x = c.fromX; this.k = 0;
    this.state = 'watch';
    this.t = 0;
  }
  update(dt, t, fx) {
    this.t += dt;
    const u = (t + this.phase) % this.period;
    if (u < this.warn) {
      this.state = 'watch';
      this.k = -1;
      this.warnK = u / this.warn;
      this.x = this.fromX;
      this.y0 = this.y;
      if (!this._called && this.warnK > 0.55) { this._called = true; fx?.shake(0.1); }
    } else if (u < this.warn + this.dive) {
      this._called = false;
      this.state = 'swoop';
      this.k = (u - this.warn) / this.dive;
      this.x = this.fromX + (this.toX - this.fromX) * this.k;
      // parabolic dip: down through the middle of the run, back up at the end
      const arc = 4 * this.k * (1 - this.k);
      this.y0 = this.y + (this.dipY - this.y) * arc;
    } else {
      this.state = 'watch';
      this.k = -1;
      this.x = this.fromX;
      this.y0 = this.y;
      this._called = false;
    }
  }
  get cx() { return this.x; }
  get cy() { return this.y0 ?? this.y; }
  hits(body) {
    if (this.k < 0) return false;
    return aabb(body, { x: this.x - 30, y: (this.y0 ?? this.y) - 26, w: 60, h: 52 });
  }
  draw(ctx, theme, t) {
    // the warning shadow sweeping the ground
    if (this.k < 0 && this.warnK !== undefined) {
      ctx.save();
      ctx.globalAlpha = 0.10 + this.warnK * 0.28;
      ctx.fillStyle = '#20160f';
      const sx = this.fromX + (this.toX - this.fromX) * this.warnK;
      ctx.beginPath();
      ctx.ellipse(sx, this.groundY, 46, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (this.k >= 0) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#20160f';
      ctx.beginPath();
      ctx.ellipse(this.x, this.groundY, 40, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const dir = this.toX >= this.fromX ? 1 : -1;
    const y = (this.y0 ?? this.y);
    // perched and waiting she is small in the frame; diving she fills it
    const s = this.k < 0 ? 0.72 : 1;
    paintCharacter(ctx, 'owl', this.state, this.x - this.w * s / 2, y - this.h * s / 2,
                   this.w * s, this.h * s, this.t, dir);
  }
}

// A branch she knocks loose. Same contract as FallingRock — always telegraphed.
export class FallingBranch extends FallingRock {
  constructor(c) {
    super({ ...c, r: c.r ?? 26 });
    this.type = 'branch';
    this.len = c.len ?? 74;
  }
  draw(ctx, theme, t) {
    ctx.save();
    ctx.globalAlpha = this.state === 'warn' ? 0.15 + this.warnK * 0.4 : 0.3;
    ctx.fillStyle = '#20160f';
    ctx.beginPath();
    ctx.ellipse(this.x, this.groundY - 2, this.len * 0.42, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const spin = this.state === 'fall' ? (this.y - this.startY) * 0.012 : 0;
    const shakeX = this.state === 'warn' ? Math.sin(t * 40) * this.warnK * 2.5 : 0;
    tumblingBranch(ctx, this.x + shakeX, this.y, this.len, spin, this.seed, theme);
  }
}
