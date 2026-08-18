// Collision — axis-separated AABB sweep against solids.
// Solids may move (platforms); a body standing on one is carried with it.

export const GRAVITY = 1750;
export const MAX_FALL = 900;

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleHitsBox(cx, cy, r, b) {
  const nx = Math.max(b.x, Math.min(cx, b.x + b.w));
  const ny = Math.max(b.y, Math.min(cy, b.y + b.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

// Moves `body` by its velocity, resolving against `solids`.
// body: {x,y,w,h,vx,vy, onGround, ground}
export function moveAndCollide(body, solids, dt) {
  body.onGround = false;
  const prevGround = body.ground;
  body.ground = null;

  // Carry with the platform we were standing on BEFORE integrating.
  if (prevGround && prevGround.dx !== undefined) {
    body.x += prevGround.dx;
    body.y += prevGround.dy;
  }

  // --- horizontal ---
  body.x += body.vx * dt;
  for (const s of solids) {
    if (s.passthrough) continue;
    if (!aabb(body, s)) continue;
    if (body.vx > 0) body.x = s.x - body.w;
    else if (body.vx < 0) body.x = s.x + s.w;
    body.vx = 0;
  }

  // --- vertical ---
  body.y += body.vy * dt;
  for (const s of solids) {
    if (!aabb(body, s)) continue;
    if (s.passthrough) {
      // One-way: only land on it when falling and already above its lip.
      const wasAbove = body.y + body.h - body.vy * dt <= s.y + 6;
      if (!(body.vy > 0 && wasAbove)) continue;
    }
    if (body.vy > 0) {
      body.y = s.y - body.h;
      body.vy = 0;
      body.onGround = true;
      body.ground = s;
    } else if (body.vy < 0) {
      if (s.passthrough) continue;
      body.y = s.y + s.h;
      body.vy = 0;
    }
  }
}

export function applyGravity(body, dt, scale = 1) {
  body.vy = Math.min(MAX_FALL, body.vy + GRAVITY * scale * dt);
}
