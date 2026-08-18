// Obstacles — the child's canonical vocabulary, each as a real mechanic.
// Every one is data-driven from the level config; none kill instantly.

import { circleHitsBox, aabb } from './physics.js';
import { fireRing, rock, dragonfly, windTrails, smallPlatform, waterfall, bug } from '../render/world-art.js';
import { hash } from '../core/rng.js';

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
    dragonfly(ctx, this.x, this.y, 1.5, this.dir, t, this.seed);
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
  }
  update(dt) {
    this.x += this.dir * this.speed * dt;
    if (this.x > this.maxX) { this.x = this.maxX; this.dir = -1; }
    if (this.x < this.minX) { this.x = this.minX; this.dir = 1; }
  }
  hits(body) {
    return aabb(body, { x: this.x - 11, y: this.y - 10, w: 22, h: 18 });
  }
  draw(ctx, theme, t) { bug(ctx, this.x, this.y, 1, this.dir, t, this.seed); }
}

export function buildObstacle(cfg) {
  switch (cfg.kind) {
    case 'platform':  return new MovingPlatform(cfg);
    case 'fire':      return new FireRing(cfg);
    case 'rock':      return new FallingRock(cfg);
    case 'wind':      return new WindDragonfly(cfg);
    case 'waterfall': return new Waterfall(cfg);
    case 'bug':       return new Bug(cfg);
    default: console.warn('[obstacles] unknown kind', cfg.kind); return null;
  }
}
