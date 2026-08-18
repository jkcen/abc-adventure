// Brush — primitives that look painted rather than vector-drawn.
// Every shape gets seeded wobble so it reads as a hand-made outline that
// stays still between frames. This is the game's visual signature; keep it.

import { hash, wob } from '../core/rng.js';

// A closed blob: roughly an ellipse, but with each vertex nudged off-circle.
export function blobPath(ctx, cx, cy, rx, ry, seed = 1, points = 11, rough = 0.13) {
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const j = 1 + wob(seed * 31.7 + i * 5.3) * rough;
    const x = cx + Math.cos(a) * rx * j;
    const y = cy + Math.sin(a) * ry * j;
    if (i === 0) ctx.moveTo(x, y);
    else {
      // Quadratic through a jittered midpoint keeps edges soft, not faceted.
      const pa = ((i - 1) / points) * Math.PI * 2;
      const pj = 1 + wob(seed * 31.7 + (i - 1) * 5.3) * rough;
      const px = cx + Math.cos(pa) * rx * pj;
      const py = cy + Math.sin(pa) * ry * pj;
      const ma = (a + pa) / 2;
      const mj = 1 + wob(seed * 17.3 + i * 3.1) * rough * 1.2;
      ctx.quadraticCurveTo(
        cx + Math.cos(ma) * rx * mj * 1.06,
        cy + Math.sin(ma) * ry * mj * 1.06, x, y);
    }
  }
  ctx.closePath();
}

export function blob(ctx, cx, cy, rx, ry, fill, seed = 1, opts = {}) {
  const { stroke = null, lw = 2.4, rough = 0.13, points = 11 } = opts;
  blobPath(ctx, cx, cy, rx, ry, seed, points, rough);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}

// A wobbling line from (x1,y1) to (x2,y2).
export function stroke(ctx, x1, y1, x2, y2, color, lw = 2.5, seed = 1, rough = 4) {
  const segs = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const nx = x1 + (x2 - x1) * t + wob(seed + i * 7.7) * rough;
    const ny = y1 + (y2 - y1) * t + wob(seed + i * 3.3 + 50) * rough;
    ctx.lineTo(nx, ny);
  }
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke();
}

// Paper-grain wash: a few translucent offset copies of a blob, like layered
// watercolor. Cheap, and it kills the "flat vector fill" feeling.
export function washBlob(ctx, cx, cy, rx, ry, fill, seed = 1, layers = 3) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  for (let i = 0; i < layers; i++) {
    const ox = wob(seed + i * 11) * rx * 0.06;
    const oy = wob(seed + i * 19) * ry * 0.06;
    blob(ctx, cx + ox, cy + oy, rx * (1 - i * 0.03), ry * (1 - i * 0.03), fill, seed + i * 3);
  }
  ctx.restore();
}

// Crayon-ish scribble fill inside a rect — used for rock and cliff texture.
export function hatch(ctx, x, y, w, h, color, seed = 1, count = 7, alpha = 0.18) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const sy = y + h * t + wob(seed + i) * h * 0.05;
    ctx.beginPath();
    ctx.moveTo(x + w * (0.08 + hash(seed + i * 3) * 0.15), sy);
    ctx.lineTo(x + w * (0.7 + hash(seed + i * 5) * 0.22), sy + wob(seed + i * 7) * 4);
    ctx.stroke();
  }
  ctx.restore();
}

// Soft radial glow — sun, fire light, magic.
export function glow(ctx, cx, cy, r, color, inner = 0.55) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
  g.addColorStop(0, color.replace('ALPHA', inner));
  g.addColorStop(1, color.replace('ALPHA', '0'));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
}
