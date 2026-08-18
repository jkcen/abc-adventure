// World art — floating islands, waterfalls, trees, mountains, obstacles.
// Painted in the same wobbly-brush language as the characters.

import { blob, blobPath, stroke, hatch, glow, washBlob } from './brush.js';
import { hash, wob, noise1 } from '../core/rng.js';

// ---------------------------------------------------------------- islands ---
// A floating island: flat-ish grassy top over a tapering rocky underside.
export function floatingIsland(ctx, x, y, w, h, seed, theme) {
  const bottom = y + h;
  ctx.save();

  // rock body — widest at the top, narrowing to a ragged point
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  const steps = Math.max(4, Math.round(w / 70));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ctx.lineTo(x + w * t, y + 4 + wob(seed + i * 3) * 5);
  }
  // right shoulder down to the tip
  ctx.lineTo(x + w, y + h * 0.22);
  for (let i = 1; i <= 5; i++) {
    const t = i / 5;
    const half = (w / 2) * (1 - t) * (1 - t * 0.35);
    ctx.lineTo(x + w / 2 + half + wob(seed + i * 7) * 9, y + h * 0.22 + (h * 0.78) * t);
  }
  for (let i = 5; i >= 1; i--) {
    const t = i / 5;
    const half = (w / 2) * (1 - t) * (1 - t * 0.35);
    ctx.lineTo(x + w / 2 - half + wob(seed + i * 11) * 9, y + h * 0.22 + (h * 0.78) * t);
  }
  ctx.lineTo(x, y + h * 0.22);
  ctx.closePath();

  ctx.fillStyle = theme.rock;
  ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
  ctx.stroke();

  hatch(ctx, x + w * 0.12, y + h * 0.25, w * 0.7, h * 0.55, theme.rockDark, seed, 6, 0.22);

  // grass cap
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 6);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ctx.lineTo(x + w * t, y + 3 + wob(seed + i * 3) * 5);
  }
  ctx.lineTo(x + w + 2, y + 6);
  ctx.lineTo(x + w + 2, y + 16 + wob(seed + 2) * 3);
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    ctx.lineTo(x + w * t, y + 15 + wob(seed + i * 5) * 6);
  }
  ctx.closePath();
  ctx.fillStyle = theme.grass; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.2; ctx.stroke();

  // grass tufts
  for (let i = 0; i < Math.max(2, w / 55); i++) {
    const gx = x + 12 + hash(seed + i * 17) * (w - 24);
    stroke(ctx, gx, y + 6, gx + wob(seed + i) * 5, y - 7 - hash(seed + i * 3) * 6, theme.grassDark, 2, seed + i, 1);
  }
  ctx.restore();
}

// Small green moving platform from the child's drawing.
export function smallPlatform(ctx, x, y, w, h, seed, theme, t) {
  ctx.save();
  const bob = Math.sin(t * 2 + seed) * 1.5;
  ctx.translate(0, bob);
  blob(ctx, x + w / 2, y + h * 0.62, w * 0.5, h * 0.55, theme.rock, seed,
       { stroke: theme.ink, lw: 2.4, rough: 0.1 });
  blob(ctx, x + w / 2, y + h * 0.30, w * 0.5, h * 0.34, theme.grass, seed + 5,
       { stroke: theme.ink, lw: 2.2, rough: 0.1 });
  ctx.restore();
}

// ------------------------------------------------------------- waterfalls ---
export function waterfall(ctx, x, y, w, h, seed, theme, t) {
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = theme.water;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  for (let i = 0; i <= 6; i++) {
    const p = i / 6;
    ctx.lineTo(x + w + Math.sin(t * 1.5 + p * 5 + seed) * 5 + p * 8, y + h * p);
  }
  for (let i = 6; i >= 0; i--) {
    const p = i / 6;
    ctx.lineTo(x + Math.sin(t * 1.7 + p * 4 + seed) * 5 - p * 8, y + h * p);
  }
  ctx.closePath();
  ctx.fill();

  // falling streaks
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = theme.waterLight; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const sx = x + 6 + hash(seed + i * 9) * (w - 12);
    const off = ((t * (180 + hash(seed + i) * 120)) + hash(seed + i * 3) * h) % h;
    ctx.beginPath();
    ctx.moveTo(sx, y + off);
    ctx.lineTo(sx + Math.sin(t * 3 + i) * 3, y + Math.min(h, off + 34));
    ctx.stroke();
  }

  // mist at the base, dissolving into cloud
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 5; i++) {
    const r = 16 + hash(seed + i * 5) * 20;
    blob(ctx, x + w / 2 + wob(seed + i * 7) * w * 0.8,
         y + h - 6 + Math.sin(t * 1.2 + i) * 4, r, r * 0.6, '#ffffff', seed + i * 3);
  }
  ctx.restore();
}

// ----------------------------------------------------------------- nature ---
export function pineTree(ctx, x, groundY, scale, seed, theme, t) {
  const sway = Math.sin(t * 1.1 + seed) * 0.02;
  ctx.save();
  ctx.translate(x, groundY);
  ctx.rotate(sway);
  ctx.scale(scale, scale);
  stroke(ctx, 0, 0, 0, -34, theme.trunk, 6, seed, 1.2);
  for (let i = 0; i < 3; i++) {
    const yy = -28 - i * 22;
    const ww = 30 - i * 7;
    ctx.beginPath();
    ctx.moveTo(-ww, yy);
    ctx.quadraticCurveTo(wob(seed + i) * 5, yy - 34, ww, yy);
    ctx.closePath();
    ctx.fillStyle = i === 2 ? theme.leafLight : theme.leaf;
    ctx.fill();
    ctx.strokeStyle = theme.ink; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }
  ctx.restore();
}

export function roundTree(ctx, x, groundY, scale, seed, theme, t) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  stroke(ctx, 0, 0, wob(seed) * 4, -40, theme.trunk, 7, seed, 1.5);
  const sway = Math.sin(t * 1.3 + seed) * 2;
  washBlob(ctx, sway, -58, 34, 30, theme.leaf, seed + 2);
  blob(ctx, sway, -58, 32, 28, theme.leaf, seed + 2, { stroke: theme.ink, lw: 2.3 });
  blob(ctx, sway - 10, -66, 16, 13, theme.leafLight, seed + 8);
  ctx.restore();
}

export function mountainRange(ctx, x, baseY, w, h, seed, color, ink, peaks = 3) {
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  for (let i = 0; i < peaks; i++) {
    const px = x + (w / peaks) * (i + 0.5);
    const ph = h * (0.6 + hash(seed + i) * 0.4);
    ctx.lineTo(px - w / peaks * 0.5, baseY);
    ctx.lineTo(px + wob(seed + i * 3) * 12, baseY - ph);
    ctx.lineTo(px + w / peaks * 0.5, baseY);
  }
  ctx.lineTo(x + w, baseY);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  if (ink) { ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke(); }
}

// -------------------------------------------------------------- obstacles ---
export function fireRing(ctx, cx, cy, r, t, seed) {
  ctx.save();
  glow(ctx, cx, cy, r * 1.9, 'rgba(255,150,40,ALPHA)', 0.28);
  const bands = [
    { rr: r * 1.16, c: '#ffd24a', a: 0.55, sp: 1.0 },
    { rr: r * 1.0,  c: '#ff8b25', a: 0.95, sp: -1.4 },
    { rr: r * 0.86, c: '#ff5a1f', a: 0.9,  sp: 1.8 },
  ];
  for (const b of bands) {
    ctx.globalAlpha = b.a;
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      // flames lick outward; noise drifts so the fire is alive, not spinning art
      const f = 1 + noise1(i * 0.8 + t * 3 * b.sp + seed) * 0.22;
      const px = cx + Math.cos(a) * b.rr * f;
      const py = cy + Math.sin(a) * b.rr * f;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = b.c;
    ctx.lineWidth = r * 0.26;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  // the safe hole in the middle
  ctx.globalAlpha = 0.16;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff3d0'; ctx.fill();

  // sparks
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 0.7;
    const rr = r * (1.2 + noise1(i + t * 2) * 0.5);
    blob(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr - t * 4 % 10, 2.5, 2.5, '#ffcf6a', seed + i);
  }
  ctx.restore();
}

export function rock(ctx, cx, cy, r, seed, theme) {
  blob(ctx, cx, cy, r, r * 0.9, theme.rock, seed, { stroke: theme.ink, lw: 2.4, rough: 0.2 });
  hatch(ctx, cx - r * 0.6, cy - r * 0.4, r * 1.2, r * 0.9, theme.rockDark, seed + 3, 4, 0.3);
}

// Wind Dragonfly — straight from the child's artwork. Long body, four wings.
export function dragonfly(ctx, cx, cy, scale, dir, t, seed) {
  ctx.save();
  ctx.translate(cx, cy + Math.sin(t * 2.2 + seed) * 4);
  ctx.scale(dir * scale, scale);

  // wings blur — fast flap, drawn translucent
  const flap = Math.sin(t * 26 + seed) * 0.5;
  for (const [ox, sgn] of [[-6, -1], [-6, 1], [7, -1], [7, 1]]) {
    ctx.save();
    ctx.translate(ox, -2);
    ctx.rotate(sgn * (0.5 + flap) * 0.7);
    ctx.globalAlpha = 0.45;
    blob(ctx, 10, 0, 17, 4.5, '#cfe9f7', seed + ox + sgn, { stroke: 'rgba(90,130,160,.6)', lw: 1.2 });
    ctx.restore();
  }
  // body
  blob(ctx, 0, 0, 8, 5.5, '#5fa8c9', seed, { stroke: '#27506b', lw: 1.8 });
  for (let i = 1; i <= 4; i++) {
    blob(ctx, -8 - i * 6, 0.6, 4.2 - i * 0.4, 3.4 - i * 0.3,
         i % 2 ? '#4b93b5' : '#68b4d3', seed + i, { stroke: '#27506b', lw: 1.2 });
  }
  blob(ctx, 9, -1, 6, 5.5, '#3f7f9e', seed + 9, { stroke: '#27506b', lw: 1.6 });
  blob(ctx, 11.5, -2.5, 2, 2, '#0e2734', seed + 10);
  ctx.restore();
}

// Curved air trails showing where the wind pushes.
export function windTrails(ctx, x, y, w, h, dir, t, seed) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const ly = y + ((i + 0.5) / 9) * h;
    const phase = (t * 0.5 + hash(seed + i)) % 1;
    const sx = dir > 0 ? x + phase * w : x + w - phase * w;
    const len = 40 + hash(seed + i * 3) * 40;
    ctx.globalAlpha = 0.45 * Math.sin(phase * Math.PI);
    ctx.beginPath();
    ctx.moveTo(sx, ly);
    ctx.quadraticCurveTo(sx + dir * len * 0.5, ly - 9 + wob(seed + i) * 8, sx + dir * len, ly);
    ctx.stroke();
  }
  ctx.restore();
}

// Small patrolling bug (black body, red back) — Level 2 enemy, drawn here so
// the whole obstacle vocabulary lives in one place.
export function bug(ctx, cx, cy, scale, dir, t, seed) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(dir * scale, scale);
  const step = Math.sin(t * 14 + seed);
  for (let i = -1; i <= 1; i++) {
    stroke(ctx, i * 5, 5, i * 5 + step * 3, 11, '#15100c', 2, seed + i, 0.6);
  }
  blob(ctx, 0, 0, 11, 8, '#c4342a', seed, { stroke: '#15100c', lw: 2 });
  stroke(ctx, -8, 0, 8, 0, '#15100c', 1.8, seed + 4, 0.5);
  blob(ctx, 9, -1, 5.5, 5, '#15100c', seed + 2);
  stroke(ctx, 11, -4, 16, -10, '#15100c', 1.6, seed + 6, 0.6);
  stroke(ctx, 11, -2, 17, -6, '#15100c', 1.6, seed + 7, 0.6);
  ctx.restore();
}
