// Player controller — A.
// Tuned for children: forgiving jump (coyote time + input buffer), variable
// jump height, a short glide on held jump (she IS a bird), and hits that
// knock you back rather than kill you.

import { applyGravity, moveAndCollide } from './physics.js';
import { paintCharacter } from '../render/characters.js';

const RUN_SPEED   = 245;
const ACCEL       = 2100;
const FRICTION    = 1900;
const AIR_ACCEL   = 1250;
const JUMP_VEL    = -600;
const COYOTE      = 0.13;   // still jumpable this long after leaving a ledge
const GLIDE_GRAV  = 0.42;   // holding jump while falling = feathered descent
const INVULN      = 1.25;

export class Player {
  constructor(id, x, y) {
    this.id = id;              // 'A' — canonical
    this.x = x; this.y = y;
    this.w = 40; this.h = 44;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.ground = null;
    this.state = 'idle';
    this.animT = 0;
    this._coyote = 0;
    this._landTimer = 0;
    this.invuln = 0;
    this.hurtTimer = 0;
    this.control = true;       // cutscenes take this away
    this.scripted = null;      // {targetX, state} for cutscene walking
    this.frozen = false;       // cutscene owns the position outright (riding the boat)
    this.emote = null;         // {text, time}
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  hurt(fromX, fromY, fx) {
    if (this.invuln > 0) return false;
    this.invuln = INVULN;
    this.hurtTimer = 0.42;
    const dx = this.cx - fromX, dy = this.cy - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * 300;
    this.vy = Math.min(-260, (dy / len) * 300);
    fx?.onPlayerHurt?.(this);
    return true;
  }

  update(dt, input, solids, fx) {
    this.animT += dt;
    // Riding something the cutscene moves: no gravity, no collision, no input.
    if (this.frozen) {
      this.vx = this.vy = 0;
      if (this.forcedState) this.state = this.forcedState;
      return;
    }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this._landTimer > 0) this._landTimer -= dt;

    let want = 0;
    let holdJump = false;

    if (this.scripted) {
      // Cutscene walk: steer toward a target and hand control back on arrival.
      const d = this.scripted.targetX - this.cx;
      if (Math.abs(d) < 8) { this.vx = 0; this.scripted.done = true; }
      else want = Math.sign(d) * 0.62;
    } else if (this.control && this.hurtTimer <= 0) {
      want = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      holdJump = input.jumpHeld;
    }

    // Standing on a boat, left/right steer the BOAT, not her feet — otherwise
    // she'd walk the deck and sail at the same time. Jumping still works, so
    // she can always get off.
    if (this.steering) { want = 0; this.vx = 0; }

    // horizontal
    const a = this.onGround ? ACCEL : AIR_ACCEL;
    if (want !== 0) {
      this.vx += want * a * dt;
      this.vx = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, this.vx));
      this.facing = want > 0 ? 1 : -1;
    } else if (this.onGround) {
      const f = FRICTION * dt;
      this.vx = Math.abs(this.vx) <= f ? 0 : this.vx - Math.sign(this.vx) * f;
    }

    // jump
    this._coyote = this.onGround ? COYOTE : Math.max(0, this._coyote - dt);
    if (this.control && !this.scripted && input.consumeJump() && this._coyote > 0) {
      this.vy = JUMP_VEL;
      this._coyote = 0;
      this.onGround = false;
      fx?.onJump?.(this);
    }
    // Variable height: releasing early cuts the rise short.
    if (this.vy < 0 && !holdJump) this.vy += 1500 * dt;

    const gliding = this.vy > 60 && holdJump && !this.onGround;
    applyGravity(this, dt, gliding ? GLIDE_GRAV : 1);

    const wasAir = !this.onGround;
    const fallSpeed = this.vy;
    moveAndCollide(this, solids, dt);

    if (wasAir && this.onGround && fallSpeed > 240) {
      this._landTimer = 0.16;
      fx?.onLand?.(this, fallSpeed);
    }

    // animation state
    if (this.hurtTimer > 0) this.state = 'hurt';
    else if (this._landTimer > 0) this.state = 'land';
    else if (!this.onGround) this.state = gliding ? 'fly' : (this.vy < 0 ? 'jump' : 'fall');
    else if (Math.abs(this.vx) > RUN_SPEED * 0.75) this.state = 'run';
    else if (Math.abs(this.vx) > 12) this.state = 'walk';
    else this.state = 'idle';

    if (this.forcedState) this.state = this.forcedState;
  }

  respawn(x, y) {
    this.x = x - this.w / 2; this.y = y - this.h;
    this.vx = this.vy = 0;
    this.invuln = 0.9;
    this.hurtTimer = 0;
  }

  draw(ctx, t) {
    // Invulnerability blink — visible but never strobing harshly.
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    // squash/stretch sells the jump without new art
    const sy = this._landTimer > 0 ? 0.86 : (this.state === 'jump' ? 1.08 : 1);
    const sx = this._landTimer > 0 ? 1.14 : (this.state === 'jump' ? 0.94 : 1);
    const w = this.w * sx, h = this.h * sy;
    paintCharacter(ctx, this.id, this.state,
      this.x - (w - this.w) / 2, this.y + (this.h - h),
      w, h, this.animT, this.facing);
    ctx.globalAlpha = 1;
  }
}
