// Parallax backdrop — four depth bands, deliberately subtle.
//   background: sky, sun, far clouds, misty mountains
//   midground : nearer mountains, distant islands, far waterfalls
//   (gameplay layer is drawn by the level itself)
//   foreground: cloud wisps and drifting particles over everything

import { blob, glow } from './brush.js';
import { hash, wob, noise1 } from '../core/rng.js';
import { mountainRange } from './world-art.js';

export function drawSky(ctx, cam, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, cam.viewH);
  theme.sky.forEach((c, i) => g.addColorStop(i / (theme.sky.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cam.viewW, cam.viewH);

  if (theme.sun) {
    const sx = cam.viewW * theme.sun.x - cam.x * 0.03;
    const sy = cam.viewH * theme.sun.y - cam.y * 0.03;
    glow(ctx, sx, sy, theme.sun.r * 3.2, theme.sun.glow, 0.4);
    blob(ctx, sx, sy, theme.sun.r, theme.sun.r, theme.sun.color, 7);
  }
}

// Repeating band of clouds/mountains scrolled at `depth` (0 = far, 1 = camera).
function band(ctx, cam, depth, span, drawCell) {
  const ox = cam.x * depth, oy = cam.y * depth * 0.55;
  const first = Math.floor(ox / span) - 1;
  const count = Math.ceil(cam.worldW / span) + 3;
  for (let i = 0; i < count; i++) {
    const idx = first + i;
    ctx.save();
    ctx.translate(idx * span - ox, -oy);
    drawCell(idx);
    ctx.restore();
  }
}

export function drawBackground(ctx, cam, theme, t) {
  // far clouds
  band(ctx, cam, 0.08, 520, (i) => {
    ctx.globalAlpha = 0.5;
    for (let k = 0; k < 3; k++) {
      const s = hash(i * 7 + k * 3);
      const cx = 80 + s * 360;
      const cy = cam.viewH * (0.12 + hash(i * 5 + k) * 0.3) + Math.sin(t * 0.2 + i + k) * 5;
      const r = 34 + s * 40;
      blob(ctx, cx, cy, r * 1.7, r * 0.62, theme.cloudFar, i * 10 + k);
      blob(ctx, cx + r * 0.7, cy - r * 0.22, r * 0.9, r * 0.5, theme.cloudFar, i * 10 + k + 1);
    }
    ctx.globalAlpha = 1;
  });

  // misty far mountains
  band(ctx, cam, 0.16, 760, (i) => {
    ctx.globalAlpha = 0.55;
    mountainRange(ctx, 0, cam.viewH * 0.78, 780, 210, i * 3 + 1, theme.mountainFar, null, 3);
    ctx.globalAlpha = 1;
  });
}

export function drawMidground(ctx, cam, theme, t) {
  band(ctx, cam, 0.34, 700, (i) => {
    ctx.globalAlpha = 0.8;
    mountainRange(ctx, 0, cam.viewH * 0.86, 720, 170, i * 5 + 9, theme.mountainNear, theme.mountainInk, 2);
    ctx.globalAlpha = 1;
  });

  // distant floating islets, so the sky never feels empty
  band(ctx, cam, 0.46, 430, (i) => {
    if (hash(i * 13) < 0.42) return;
    ctx.globalAlpha = 0.62;
    const x = 60 + hash(i * 11) * 240;
    const y = cam.viewH * (0.28 + hash(i * 17) * 0.34) + Math.sin(t * 0.35 + i) * 4;
    const w = 46 + hash(i * 19) * 46;
    blob(ctx, x, y, w, w * 0.28, theme.islandFar, i * 3);
    blob(ctx, x, y + w * 0.22, w * 0.55, w * 0.34, theme.islandFarRock, i * 3 + 2);
    ctx.globalAlpha = 1;
  });
}

// Cloud sea below the world — the bottom of everything in Level 1.
export function drawCloudSea(ctx, cam, theme, worldY, t) {
  const sy = worldY - cam.y * 1.0;
  if (sy > cam.viewH + 200) return;
  ctx.save();
  ctx.translate(0, sy);
  const g = ctx.createLinearGradient(0, -60, 0, 260);
  g.addColorStop(0, theme.cloudSeaTop);
  g.addColorStop(1, theme.cloudSeaBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, -20, cam.viewW, cam.viewH + 300);
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 14; i++) {
    const cx = ((i * 190 - cam.x * 0.8) % (cam.viewW + 420)) - 140;
    const cy = 10 + Math.sin(t * 0.4 + i) * 10 + hash(i) * 40;
    blob(ctx, cx, cy, 120 + hash(i * 3) * 70, 40 + hash(i * 5) * 20, '#ffffff', i * 7);
  }
  ctx.restore();
}

export function drawForeground(ctx, cam, theme, t) {
  // near cloud wisps drifting past the camera
  band(ctx, cam, 1.25, 640, (i) => {
    if (hash(i * 23) < 0.55) return;
    ctx.globalAlpha = 0.22;
    const y = cam.viewH * (0.1 + hash(i * 29) * 0.8) + Math.sin(t * 0.5 + i) * 8;
    blob(ctx, 120 + hash(i * 31) * 300, y, 190, 42, '#ffffff', i * 9);
    ctx.globalAlpha = 1;
  });

  // floating motes — gives the air texture without stealing attention
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = theme.mote || '#ffffff';
  for (let i = 0; i < 26; i++) {
    const px = ((i * 137 - cam.x * 0.9 + noise1(i + t * 0.15) * 120) % (cam.viewW + 60)) - 30;
    const py = ((i * 91 - cam.y * 0.9 + t * (6 + hash(i) * 10)) % (cam.viewH + 60)) - 30;
    ctx.beginPath(); ctx.arc(px, py, 1 + hash(i * 3) * 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
