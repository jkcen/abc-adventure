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
export function bug(ctx, cx, cy, scale, dir, t, seed, color = null) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(dir * scale, scale);
  const step = Math.sin(t * 14 + seed);
  for (let i = -1; i <= 1; i++) {
    stroke(ctx, i * 5, 5, i * 5 + step * 3, 11, '#15100c', 2, seed + i, 0.6);
  }
  blob(ctx, 0, 0, 11, 8, color || '#c4342a', seed, { stroke: '#15100c', lw: 2 });
  stroke(ctx, -8, 0, 8, 0, '#15100c', 1.8, seed + 4, 0.5);
  blob(ctx, 9, -1, 5.5, 5, '#15100c', seed + 2);
  stroke(ctx, 11, -4, 16, -10, '#15100c', 1.6, seed + 6, 0.6);
  stroke(ctx, 11, -2, 17, -6, '#15100c', 1.6, seed + 7, 0.6);
  ctx.restore();
}

// ============================================================ LEVEL 2 ART ===
// Everything below is painted from Katherine's second drawing: long green
// weed bands floating over a teal sea, cloud-shaped lily pads, golden seeds,
// a yellow slide, and the BOAT.

// A long floating weed band — flat green top with dark wavy currents running
// through it. This is the level's main ground.
export function weedBand(ctx, x, y, w, h, seed, theme) {
  const wv = theme.weed || theme.grass;
  const dk = theme.weedDark || theme.grassDark;
  ctx.save();

  // body
  ctx.beginPath();
  ctx.moveTo(x, y + 4);
  const steps = Math.max(4, Math.round(w / 90));
  for (let i = 0; i <= steps; i++) ctx.lineTo(x + w * (i / steps), y + 3 + wob(seed + i * 3) * 4);
  ctx.lineTo(x + w, y + h - 3);
  for (let i = steps; i >= 0; i--) ctx.lineTo(x + w * (i / steps), y + h - 2 + wob(seed + i * 5) * 5);
  ctx.closePath();
  ctx.fillStyle = wv; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();

  // the dark wavy strokes that give the band its water-weed feel
  ctx.strokeStyle = dk; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const rows = Math.max(2, Math.round(h / 9));
  for (let r = 0; r < rows; r++) {
    const ry = y + h * ((r + 0.6) / (rows + 0.4));
    let sx = x + 6 + hash(seed + r * 7) * 40;
    while (sx < x + w - 20) {
      const len = 40 + hash(seed + r * 13 + sx) * 90;
      ctx.beginPath();
      ctx.moveTo(sx, ry);
      ctx.quadraticCurveTo(sx + len * 0.5, ry + wob(seed + r + sx) * 5, Math.min(x + w - 6, sx + len), ry);
      ctx.stroke();
      sx += len + 18 + hash(seed + sx) * 26;
    }
  }
  ctx.restore();
}

// A floating river — a band of water hanging in the air, with a wooden board
// laid along it. The board is the part you actually stand on; the water runs
// under it and drips off the bottom edge into the sky.
export function riverBand(ctx, x, y, w, h, seed, theme, t) {
  const water = theme.water || '#9adcd0';
  const light = theme.waterLight || '#eafbf6';
  const wood = theme.boatWood || '#a9782e';
  const dark = theme.boatDark || '#5a3a1b';
  const steps = Math.max(6, Math.round(w / 70));
  const surf = (i) => y + 7 + Math.sin(t * 1.5 + i * 0.8 + seed) * 2.5 + wob(seed + i * 3) * 2;

  ctx.save();

  // the water body
  ctx.beginPath();
  ctx.moveTo(x, surf(0));
  for (let i = 1; i <= steps; i++) ctx.lineTo(x + w * (i / steps), surf(i));
  ctx.lineTo(x + w, y + h - 3);
  for (let i = steps; i >= 0; i--) ctx.lineTo(x + w * (i / steps), y + h - 2 + wob(seed + i * 5) * 5);
  ctx.closePath();
  ctx.fillStyle = water; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();

  // current: pale streaks drifting along the flow
  ctx.strokeStyle = light; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.globalAlpha = 0.8;
  const rows = Math.max(2, Math.round(h / 12));
  for (let r = 0; r < rows; r++) {
    const ry = y + 12 + (h - 16) * ((r + 0.5) / rows);
    const drift = (t * (26 + r * 9)) % (w + 120);
    for (let k = -1; k < Math.ceil(w / 150) + 1; k++) {
      const sx = x + k * 150 + drift - 120 + hash(seed + r * 7) * 30;
      const len = 44 + hash(seed + r * 13 + k) * 46;
      if (sx > x + w - 8 || sx + len < x + 8) continue;
      ctx.beginPath();
      ctx.moveTo(Math.max(x + 6, sx), ry);
      ctx.quadraticCurveTo(sx + len * 0.5, ry + Math.sin(t * 2 + k + r) * 2.5,
                           Math.min(x + w - 6, sx + len), ry);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // drips falling off the underside, so it reads as water in mid-air
  ctx.strokeStyle = water; ctx.lineWidth = 2.4;
  for (let i = 0; i < Math.max(2, Math.round(w / 150)); i++) {
    const dx = x + 24 + hash(seed + i * 17) * (w - 48);
    const fall = ((t * (60 + hash(seed + i) * 50)) + hash(seed + i * 5) * 40) % 46;
    ctx.beginPath();
    ctx.moveTo(dx, y + h - 4);
    ctx.lineTo(dx, y + h - 4 + fall);
    ctx.stroke();
  }

  ctx.restore();
}

// A cloud-shaped lily pad — the small green stepping platforms in the drawing.
export function lilyPad(ctx, x, y, w, h, seed, theme, t) {
  const bob = Math.sin(t * 1.6 + seed) * 2;
  const cx = x + w / 2, cy = y + h / 2 + bob;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, cy + h * 0.42);
  const bumps = Math.max(3, Math.round(w / 46));
  for (let i = 0; i < bumps; i++) {
    const bx = x + (w / bumps) * i, bw = w / bumps;
    ctx.quadraticCurveTo(bx + bw * 0.5, cy - h * (0.55 + hash(seed + i) * 0.35),
                         bx + bw, cy + h * 0.1 + wob(seed + i * 3) * 3);
  }
  ctx.lineTo(x + w, cy + h * 0.42);
  ctx.closePath();
  ctx.fillStyle = theme.lily || theme.grass; ctx.fill();
  ctx.strokeStyle = theme.lilyInk || theme.ink; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(x + 8, cy + h * 0.2);
  ctx.lineTo(x + w - 8, cy + h * 0.2);
  ctx.strokeStyle = theme.leafLight; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

// A golden seed with its little shine marks — the level's collectible.
export function goldSeed(ctx, cx, cy, r, seed, theme, t, taken = 0) {
  ctx.save();
  ctx.globalAlpha = 1 - taken;
  ctx.translate(cx, cy + Math.sin(t * 2 + seed) * 3 - taken * 26);
  ctx.scale(1 + taken * 0.6, 1 + taken * 0.6);
  glow(ctx, 0, 0, r * 3, 'rgba(255,226,120,ALPHA)', 0.3);
  blob(ctx, 0, 0, r * 0.82, r, theme.gold || '#c9a52a', seed, { stroke: theme.ink, lw: 2 });
  blob(ctx, -r * 0.25, -r * 0.3, r * 0.3, r * 0.34, theme.goldLight || '#ecd45a', seed + 3);
  // the drawn shine ticks
  ctx.strokeStyle = 'rgba(80,70,40,.8)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI * 0.85 + i * (Math.PI * 0.23);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35);
    ctx.lineTo(Math.cos(a) * r * 1.9, Math.sin(a) * r * 1.9);
    ctx.stroke();
  }
  ctx.restore();
}

// The yellow slide/ramp that runs down to the lower boat.
export function slide(ctx, x1, y1, x2, y2, w, seed, theme) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * w, ny = dx / len * w;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 + nx, y2 + ny);
  ctx.lineTo(x1 + nx, y1 + ny);
  ctx.closePath();
  ctx.fillStyle = theme.slide || '#f2d21c'; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.globalAlpha = 0.3;
  stroke(ctx, x1 + nx * 0.4, y1 + ny * 0.4, x2 + nx * 0.4, y2 + ny * 0.4, '#fff8c0', 3, seed, 2);
  ctx.restore();
}

// The BOAT — brown hull with the word the child lettered on its side, a mast
// and two dark sails. Used both as scenery and as the end of the journey.
export function boat(ctx, cx, baseY, scale, seed, theme, t, label = 'BAOT') {
  ctx.save();
  ctx.translate(cx, baseY + Math.sin(t * 1.4 + seed) * 3);
  ctx.scale(scale, scale);

  const wood = theme.boatWood || '#a9782e';
  const dark = theme.boatDark || '#5a3a1b';

  // mast + sails, behind the hull
  stroke(ctx, 6, -6, 10, -66, dark, 5, seed + 2, 1.2);
  blob(ctx, -8, -58, 16, 11, dark, seed + 5, { stroke: '#2e1c0c', lw: 2 });
  blob(ctx, 26, -50, 15, 10, dark, seed + 6, { stroke: '#2e1c0c', lw: 2 });

  // hull
  ctx.beginPath();
  ctx.moveTo(-52, -34);
  ctx.lineTo(52, -34);
  ctx.quadraticCurveTo(46, 6, 0, 8);
  ctx.quadraticCurveTo(-46, 6, -52, -34);
  ctx.closePath();
  ctx.fillStyle = wood; ctx.fill();
  ctx.strokeStyle = '#4a2f14'; ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.stroke();
  hatch(ctx, -40, -28, 80, 28, dark, seed + 9, 4, 0.16);

  // the lettering, in the child's hand
  ctx.fillStyle = '#3a230d';
  ctx.font = '22px "Bradley Hand", "Segoe Print", cursive';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, -12);

  // oar
  stroke(ctx, -44, -18, -70, 4, dark, 5, seed + 11, 1);
  blob(ctx, -74, 8, 9, 6, dark, seed + 12, { stroke: '#2e1c0c', lw: 1.8 });
  ctx.restore();
}

// The little wheeled cart parked on the middle weed band in the drawing.
export function waterWheel(ctx, x, groundY, scale, seed, theme, t) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  const dark = theme.boatDark || '#5a3a1b';
  // wheel
  ctx.save();
  ctx.translate(0, -34);
  ctx.rotate(t * 0.8);
  ctx.strokeStyle = theme.rock; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    stroke(ctx, 0, 0, Math.cos(a) * 15, Math.sin(a) * 15, theme.rock, 2, seed + i, 0.5);
  }
  ctx.restore();
  stroke(ctx, 0, -20, 0, 0, dark, 4, seed + 3, 0.8);
  // yellow trough
  ctx.beginPath();
  ctx.moveTo(-56, -22); ctx.lineTo(-6, -22); ctx.lineTo(-10, -4); ctx.lineTo(-52, -4);
  ctx.closePath();
  ctx.fillStyle = theme.slide || '#f2d21c'; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.restore();
}

// The rooted island on the left of the drawing: a dirt cap on long tapering
// roots, with a little green mountain sitting on top.
export function rootIsland(ctx, x, y, w, h, seed, theme) {
  ctx.save();
  // dirt cap
  blob(ctx, x + w / 2, y + 22, w * 0.5, 26, theme.rockDark, seed, { stroke: theme.ink, lw: 2.6 });
  blob(ctx, x + w / 2, y + 8, w * 0.5, 14, theme.grass, seed + 4, { stroke: theme.ink, lw: 2.2 });
  // roots
  const roots = Math.max(3, Math.round(w / 90));
  for (let i = 0; i < roots; i++) {
    const rx = x + w * (0.16 + (i / Math.max(1, roots - 1)) * 0.68);
    const rw = w * 0.11;
    const rh = h * (0.55 + hash(seed + i * 5) * 0.45);
    ctx.beginPath();
    ctx.moveTo(rx - rw, y + 34);
    ctx.quadraticCurveTo(rx + wob(seed + i) * 10, y + 34 + rh * 0.7, rx + wob(seed + i * 3) * 6, y + 34 + rh);
    ctx.quadraticCurveTo(rx + rw * 0.6, y + 34 + rh * 0.6, rx + rw, y + 34);
    ctx.closePath();
    ctx.fillStyle = theme.rock; ctx.fill();
    ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  }
  // green mountain on top
  mountainRange(ctx, x + w * 0.22, y + 8, w * 0.56, 92, seed + 7, theme.grass, theme.ink, 2);
  ctx.restore();
}

// ------------------------------------------------- forest / owl territory ---
// The branch Katherine's owl perches on: a thick rust limb with thin side
// stems carrying pointed orange leaves, each leaf veined in black.

export function autumnLeaf(ctx, x, y, len, angle, seed, theme) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.42, -len * 0.34, len, 0);
  ctx.quadraticCurveTo(len * 0.42, len * 0.34, 0, 0);
  ctx.closePath();
  ctx.fillStyle = theme.leafWarm; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  // the black veins she inks into every leaf
  ctx.beginPath();
  ctx.moveTo(len * 0.08, 0); ctx.lineTo(len * 0.9, 0);
  for (let i = 1; i <= 2; i++) {
    const t = i / 3;
    ctx.moveTo(len * t, 0); ctx.lineTo(len * (t + 0.16), -len * 0.17);
    ctx.moveTo(len * t, 0); ctx.lineTo(len * (t + 0.16), len * 0.17);
  }
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.restore();
}

export function autumnBranch(ctx, x, y, w, seed, theme, t) {
  ctx.save();
  const sway = Math.sin(t * 0.7 + seed) * 0.012;
  ctx.translate(x, y);
  ctx.rotate(sway);

  // the thick limb
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 1; i <= 6; i++) {
    const p = i / 6;
    ctx.lineTo(w * p, wob(seed + i * 5) * 5);
  }
  ctx.strokeStyle = theme.branch; ctx.lineWidth = 17; ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 21; ctx.globalAlpha = 0;
  ctx.globalAlpha = 1;
  // ink outline drawn as two edge lines, the way a marker outlines a shape
  for (const off of [-8.5, 8.5]) {
    ctx.beginPath();
    ctx.moveTo(0, off);
    for (let i = 1; i <= 6; i++) {
      const p = i / 6;
      ctx.lineTo(w * p, wob(seed + i * 5) * 5 + off);
    }
    ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.4; ctx.stroke();
  }

  // side stems with leaves
  for (let i = 0; i < 4; i++) {
    const sx = w * (0.16 + i * 0.22) + wob(seed + i) * 12;
    const up = i % 2 === 0 ? -1 : 1;
    const sl = 30 + hash(seed + i * 3) * 26;
    stroke(ctx, sx, up * 8, sx + up * 10, up * (8 + sl), theme.branch, 2.6, seed + i * 7, 1.4);
    autumnLeaf(ctx, sx + up * 10, up * (8 + sl), 20 + hash(seed + i * 5) * 10,
               up * (0.5 + hash(seed + i) * 0.7), seed + i, theme);
  }
  ctx.restore();
}

// A branch the owl knocks loose — drawn mid-air, tumbling.
export function tumblingBranch(ctx, cx, cy, len, spin, seed, theme) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  stroke(ctx, -len / 2, 0, len / 2, 0, theme.branch, 8, seed, 1.5);
  stroke(ctx, -len / 2, 0, len / 2, 0, theme.ink, 2, seed + 3, 1.5);
  autumnLeaf(ctx, len * 0.32, -2, 16, -0.5, seed + 1, theme);
  autumnLeaf(ctx, -len * 0.18, 3, 14, 2.4, seed + 2, theme);
  ctx.restore();
}

// A dense forest tree for the owl's woods — rounder and darker than Level 1's.
export function forestTree(ctx, x, groundY, scale, seed, theme, t) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  const sway = Math.sin(t * 0.9 + seed) * 2.2;
  stroke(ctx, 0, 0, wob(seed) * 5, -66, theme.trunk, 11, seed, 2);
  stroke(ctx, 0, -40, -22, -62, theme.trunk, 5, seed + 4, 1.5);
  stroke(ctx, 0, -46, 20, -68, theme.trunk, 5, seed + 6, 1.5);
  for (const [ox, oy, r] of [[-26, -80, 30], [24, -86, 32], [0, -104, 36]]) {
    washBlob(ctx, ox + sway, oy, r, r * 0.86, theme.leaf, seed + ox);
    blob(ctx, ox + sway, oy, r, r * 0.86, theme.leaf, seed + ox,
         { stroke: theme.ink, lw: 2.4, rough: 0.14 });
  }
  blob(ctx, -14 + sway, -104, 15, 12, theme.leafLight, seed + 9);
  ctx.restore();
}

// Solid forest floor — earth with a mossy top, for ground you walk on rather
// than islands you hop between.
export function forestGround(ctx, x, y, w, h, seed, theme) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  const steps = Math.max(3, Math.round(w / 60));
  for (let i = 0; i <= steps; i++) {
    ctx.lineTo(x + (w * i) / steps, y + 5 + wob(seed + i * 3) * 6);
  }
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = theme.earth; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
  hatch(ctx, x + 8, y + h * 0.22, w - 16, h * 0.6, theme.earthDark, seed, 7, 0.22);

  // mossy cap
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 6);
  for (let i = 0; i <= steps; i++) ctx.lineTo(x + (w * i) / steps, y + 4 + wob(seed + i * 3) * 6);
  ctx.lineTo(x + w + 2, y + 6);
  ctx.lineTo(x + w + 2, y + 19 + wob(seed + 2) * 3);
  for (let i = steps; i >= 0; i--) ctx.lineTo(x + (w * i) / steps, y + 18 + wob(seed + i * 5) * 6);
  ctx.closePath();
  ctx.fillStyle = theme.grass; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.2; ctx.stroke();

  for (let i = 0; i < Math.max(2, w / 60); i++) {
    const gx = x + 10 + hash(seed + i * 17) * (w - 20);
    stroke(ctx, gx, y + 7, gx + wob(seed + i) * 5, y - 8 - hash(seed + i * 3) * 7,
           theme.grassDark, 2, seed + i, 1);
  }
  ctx.restore();
}

// ============================================================ LEVEL 3 ART ===
// Painted from Katherine's third drawing: an orange sunset over a blue sea,
// flat yellow-green planks stepping up through the air, black ants walking on
// them, a fire ring with a bird already through it, a big brown moth, and on
// the right a tall cliff with long black drips, a hanging crate and a rope
// ladder climbing to where C is waiting.

// The flat yellow-green platform slabs — the drawing's simplest shape, so it
// is drawn simply: one wobbling rectangle, one ink outline, one light edge.
export function plank(ctx, x, y, w, h, seed, theme) {
  const face = theme.plank || theme.grass;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + wob(seed) * 2);
  ctx.lineTo(x + w, y + wob(seed + 2) * 2);
  ctx.lineTo(x + w + wob(seed + 4) * 2, y + h);
  ctx.lineTo(x + wob(seed + 6) * 2, y + h);
  ctx.closePath();
  ctx.fillStyle = face; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.globalAlpha = 0.45;
  stroke(ctx, x + 5, y + h * 0.34, x + w - 5, y + h * 0.34, theme.plankDark || theme.grassDark, 2.4, seed + 9, 1.2);
  ctx.restore();
}

// The tall cliffs on the right of the drawing: a flat brown table with a pale
// water sheen on top and long tapering black drips hanging underneath.
export function dripCliff(ctx, x, y, w, h, seed, theme) {
  const body = theme.cliff || theme.rock;
  ctx.save();

  // the table itself
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x + w, y + 4);
  ctx.lineTo(x + w - 6, y + h * 0.42);
  ctx.lineTo(x + 6, y + h * 0.44);
  ctx.closePath();
  ctx.fillStyle = body; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();

  // the pale water lying on top
  blob(ctx, x + w * 0.5, y + 8, w * 0.42, 9, theme.waterLight || '#ffffff', seed + 3,
       { stroke: theme.ink, lw: 2 });

  // the long drips — the drawing's signature edge
  const drips = Math.max(4, Math.round(w / 62));
  for (let i = 0; i < drips; i++) {
    const dx = x + 14 + (w - 28) * (i / Math.max(1, drips - 1));
    const dw = 10 + hash(seed + i * 7) * 12;
    const dh = h * (0.32 + hash(seed + i * 11) * 0.5);
    ctx.beginPath();
    ctx.moveTo(dx - dw / 2, y + h * 0.40);
    ctx.lineTo(dx + wob(seed + i) * 6, y + h * 0.40 + dh);
    ctx.lineTo(dx + dw / 2, y + h * 0.40);
    ctx.closePath();
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = theme.cliffDrip || theme.ink; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
  }
  ctx.restore();
}

// The crate hanging on its rope — used as a lift up the cliff face. The rope
// is drawn from the crate up past the top of the screen, so it always reads
// as hanging from something above.
export function hangingCrate(ctx, x, y, w, h, seed, theme, t) {
  const cx = x + w / 2;
  ctx.save();
  stroke(ctx, cx, y - 4, cx + wob(seed) * 3, y - 460, theme.ink, 3, seed, 1.4);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + wob(seed + 2) * 2);
  ctx.lineTo(x + w - 3, y + h + 16);
  ctx.lineTo(x + 3, y + h + 16 + wob(seed + 5) * 2);
  ctx.closePath();
  ctx.fillStyle = theme.crate || theme.boatWood || '#a87b3c'; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.stroke();
  hatch(ctx, x + 4, y + 4, w - 8, h + 8, theme.rockDark, seed + 8, 3, 0.2);
  ctx.restore();
}

// The rope ladder up the cliff — scenery the climb happens beside.
export function ropeLadder(ctx, x, yTop, h, seed, theme) {
  ctx.save();
  stroke(ctx, x - 11, yTop, x - 11 + wob(seed) * 5, yTop + h, theme.ink, 3, seed, 1.5);
  stroke(ctx, x + 11, yTop, x + 11 + wob(seed + 3) * 5, yTop + h, theme.ink, 3, seed + 1, 1.5);
  const rungs = Math.max(3, Math.round(h / 26));
  for (let i = 1; i < rungs; i++) {
    const ry = yTop + (h / rungs) * i;
    stroke(ctx, x - 11, ry, x + 11, ry + wob(seed + i) * 2, theme.ink, 2.4, seed + i * 3, 0.8);
  }
  ctx.restore();
}

// The grey slope with the black arrow on it — the drawing's own signpost,
// pointing the way on.
export function arrowSign(ctx, x, baseY, w, h, seed, theme) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x + w * 0.62, baseY - h);
  ctx.lineTo(x + w, baseY - h * 0.92);
  ctx.lineTo(x + w, baseY);
  ctx.closePath();
  ctx.fillStyle = theme.arrow || '#9aa0a6'; ctx.fill();
  ctx.strokeStyle = theme.ink; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();

  // the arrow, drawn in one thick black stroke pointing up-right
  const ax = x + w * 0.42, ay = baseY - h * 0.18;
  const bx = x + w * 0.80, by = baseY - h * 0.72;
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx - 22, by + 3); ctx.lineTo(bx, by); ctx.lineTo(bx - 4, by + 24);
  ctx.stroke();
  ctx.restore();
}

// The two big wings in the drawing's sky. 'purple' is the dark plum moth with
// the pink round body; 'holo' is the little rainbow one beside it.
export function bigButterfly(ctx, cx, cy, scale, seed, theme, t, kind = 'purple') {
  ctx.save();
  ctx.translate(cx, cy + Math.sin(t * 1.1 + seed) * 5);
  ctx.scale(scale, scale);
  const beat = Math.sin(t * 2.4 + seed) * 0.16;

  const holo = kind === 'holo';
  const wings = holo
    ? ['#7ee0a8', '#5fd0e8', '#f6d76a', '#f08a6a']
    : [theme.wingPurple || '#5b2140', '#6d2a4e', theme.wingPurple || '#5b2140', '#6d2a4e'];

  for (let i = 0; i < 4; i++) {
    const up = i < 2 ? -1 : 1;
    const side = i % 2 ? 1 : -1;
    ctx.save();
    ctx.rotate(side * (0.42 + beat) * up * -1);
    blob(ctx, side * 26, up * 9, 27, 14, wings[i], seed + i,
         { stroke: theme.ink, lw: 2.4 });
    ctx.restore();
  }
  blob(ctx, 0, 0, 13, 15, holo ? '#cfe9f7' : (theme.wingPink || '#f2b9c8'), seed + 9,
       { stroke: theme.ink, lw: 2.4 });
  ctx.restore();
}

// The big brown moth hanging in the middle of the drawing — four broad brown
// wings around a dark rounded body. It is the level's wind creature.
export function bigMoth(ctx, cx, cy, scale, dir, t, seed, theme) {
  ctx.save();
  ctx.translate(cx, cy + Math.sin(t * 1.3 + seed) * 6);
  ctx.scale(dir * scale, scale);
  const beat = Math.sin(t * 3.2 + seed) * 0.2;
  const wing = theme?.moth || '#6b4327';
  const dark = theme?.mothDark || '#3a2415';

  for (const [ox, oy, rot] of [[-30, -6, -0.5], [30, -6, 0.5], [-28, 12, 0.55], [28, 12, -0.55]]) {
    ctx.save();
    ctx.rotate(rot * (1 + beat));
    blob(ctx, ox, oy, 34, 17, wing, seed + ox, { stroke: '#1d1109', lw: 2.6 });
    ctx.restore();
  }
  blob(ctx, 0, 2, 15, 34, dark, seed + 3, { stroke: '#1d1109', lw: 3 });
  blob(ctx, 0, -30, 10, 9, dark, seed + 5, { stroke: '#1d1109', lw: 2.6 });
  ctx.restore();
}
