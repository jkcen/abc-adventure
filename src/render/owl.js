// OWL — rebuilt from Katherine's drawing.
//
// Canonical details from her artwork, none of which may drift:
//   * rust / orange-red body, painted with visible streaky marker strokes
//   * ONE dark brown wing folded across the front of the body
//   * long grey-blue EAR TUFTS that sweep up and outward, then cross back
//     down over the eyes to form the brow — this is her signature shape
//   * a rust crown patch on top of the head, speckled with black dots
//   * big round eyes: white sclera, large black pupil, white highlight
//   * heavy black eyebrows, angled inward — stern, watchful, not monstrous
//   * a small downward YELLOW triangle beak
//   * dark brown feet with thick talons
//   * a heart-shaped facial disc outlined inside the head
//
// She is drawn FRONT-ON, the way Katherine drew her. That is exactly right for
// a character whose job is to watch you from a tree.

import { blob, blobPath, stroke, washBlob } from './brush.js';
import { wob, hash } from '../core/rng.js';

export const OWL = {
  body:      '#c0512a',
  bodyDark:  '#a33d1c',
  bodyLight: '#d2673a',
  wing:      '#5e3a22',
  wingDark:  '#452714',
  tuft:      '#a3b3ae',
  tuftDark:  '#8b9c98',
  crown:     '#c0512a',
  beak:      '#e8d44a',
  foot:      '#6b4526',
  talon:     '#3a2416',
  eyeWhite:  '#ffffff',
  pupil:     '#141010',
  ink:       '#141010',
};

// Per-state shaping. The owl reads through her eyes and tufts, so those are
// what the states move.
function pose(state, t) {
  const breathe = Math.sin(t * 1.6) * 0.6;
  switch (state) {
    // Watching from a branch: eyes wide open, almost no movement. Stillness is
    // what makes her unsettling — do not add idle bounce here.
    case 'watch':     return { eye: 1.15, brow: 1.15, tuft: 0, tilt: 0, bob: breathe * 0.4, wings: 0, beak: 0 };
    case 'fly':
    case 'swoop':     return { eye: 1, brow: 1, tuft: -0.5, tilt: 0.12, bob: 0, wings: Math.sin(t * 9) * 0.9 + 0.4, beak: 0.3 };
    case 'screech':
    case 'surprised': return { eye: 1.45, brow: 0.6, tuft: 0.35, tilt: -0.05, bob: -1.5, wings: 0.55, beak: 1 };
    case 'hurt':      return { eye: 0.4, brow: 1, tuft: 0.2, tilt: -0.25, bob: -1, wings: 0.3, beak: 0.5 };
    case 'sleep':     return { eye: 0, brow: 0.7, tuft: 0.15, tilt: 0.18, bob: breathe, wings: 0, beak: 0 };
    default:          return { eye: 1, brow: 1, tuft: 0, tilt: 0, bob: breathe, wings: 0, beak: 0 };
  }
}

// One swept ear tuft: wide and jagged at the outer top, tapering inward and
// down to a point just above the eye.
function earTuft(ctx, x0, y0, x1, y1, width, dir, seed) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);                                   // inner point (at brow)
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - width * 0.7,
                       x0, y0);                          // outer top edge
  // jagged feather tips at the outer end
  ctx.lineTo(x0 + dir * width * 0.55, y0 - width * 0.25);
  ctx.lineTo(x0 + dir * width * 0.15, y0 + width * 0.30);
  ctx.lineTo(x0 + dir * width * 0.62, y0 + width * 0.42);
  ctx.lineTo(x0 - dir * width * 0.05, y0 + width * 0.72);
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + width * 0.55, x1, y1);
  ctx.closePath();
  ctx.fillStyle = OWL.tuft; ctx.fill();
  ctx.strokeStyle = OWL.ink; ctx.lineWidth = width * 0.16; ctx.lineJoin = 'round';
  ctx.stroke();
}

// Draws the owl facing the viewer inside a w*h box; origin is its top-left.
export function drawOwl(ctx, state, w, h, t) {
  const q = pose(state, t);
  const cx = w * 0.5;
  const S = w / 100;                    // everything scales off box width
  const seed = 91;

  ctx.save();
  ctx.translate(cx, h * 0.5 + q.bob);
  ctx.rotate(q.tilt);
  ctx.translate(-cx, -h * 0.5);

  const headY = h * 0.30, headRx = w * 0.35, headRy = h * 0.25;
  const bodyY = h * 0.70, bodyRx = w * 0.40, bodyRy = h * 0.29;

  // ---- spread wings, only while flying (behind the body) ----
  if (q.wings > 0) {
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(cx + dir * bodyRx * 0.55, bodyY - bodyRy * 0.35);
      ctx.rotate(dir * (0.35 + q.wings * 0.55));
      blob(ctx, dir * bodyRx * 0.75, 0, bodyRx * 0.85, bodyRy * 0.36, OWL.wing, seed + dir * 7,
           { stroke: OWL.ink, lw: 2.6 * S, rough: 0.12 });
      // flight feathers
      for (let i = 0; i < 3; i++) {
        stroke(ctx, dir * bodyRx * (0.55 + i * 0.25), -bodyRy * 0.06,
               dir * bodyRx * (1.15 + i * 0.22), bodyRy * (0.22 + i * 0.08),
               OWL.wingDark, 2 * S, seed + i * 5 + dir, 1);
      }
      ctx.restore();
    }
  }

  // ---- feet gripping the branch (behind the body) ----
  if (q.wings === 0) {
    for (const dir of [-1, 1]) {
      const fx = cx + dir * bodyRx * 0.32;
      const fy = bodyY + bodyRy * 0.86;
      stroke(ctx, fx, fy - h * 0.05, fx, fy + h * 0.06, OWL.foot, 5.5 * S, seed + dir * 3, 1);
      for (let k = -1; k <= 1; k++) {
        stroke(ctx, fx, fy + h * 0.05, fx + k * w * 0.055, fy + h * 0.10,
               OWL.foot, 4 * S, seed + k * 4 + dir, 0.8);
      }
    }
  }

  // ---- body ----
  washBlob(ctx, cx, bodyY, bodyRx * 1.03, bodyRy * 1.03, OWL.body, seed + 1);
  blob(ctx, cx, bodyY, bodyRx, bodyRy, OWL.body, seed + 1,
       { stroke: OWL.ink, lw: 3.2 * S, rough: 0.07 });
  // her streaky marker shading
  for (let i = 0; i < 7; i++) {
    const sx = cx - bodyRx * 0.6 + (i / 6) * bodyRx * 0.8;
    ctx.globalAlpha = 0.22;
    stroke(ctx, sx, bodyY - bodyRy * 0.5, sx + wob(seed + i) * 6, bodyY + bodyRy * 0.55,
           OWL.bodyDark, 5 * S, seed + i * 9, 2);
    ctx.globalAlpha = 1;
  }

  // ---- the single folded brown wing across the front ----
  if (q.wings === 0) {
    ctx.save();
    ctx.translate(cx + bodyRx * 0.34, bodyY + bodyRy * 0.04);
    ctx.rotate(0.10);
    blob(ctx, 0, 0, bodyRx * 0.48, bodyRy * 0.86, OWL.wing, seed + 11,
         { stroke: OWL.ink, lw: 3 * S, rough: 0.07 });
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.3;
      stroke(ctx, -bodyRx * 0.2, -bodyRy * 0.5 + i * bodyRy * 0.28,
             bodyRx * 0.26, -bodyRy * 0.3 + i * bodyRy * 0.28, OWL.wingDark, 4 * S, seed + i * 6, 2);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ---- head ----
  washBlob(ctx, cx, headY, headRx * 1.03, headRy * 1.03, OWL.body, seed + 2);
  blob(ctx, cx, headY, headRx, headRy, OWL.body, seed + 2,
       { stroke: OWL.ink, lw: 3.2 * S, rough: 0.06 });

  // facial disc — the heart-shaped outline she drew inside the head
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(cx, headY + headRy * 0.72);
  ctx.quadraticCurveTo(cx - headRx * 0.92, headY + headRy * 0.30, cx - headRx * 0.66, headY - headRy * 0.50);
  ctx.moveTo(cx, headY + headRy * 0.72);
  ctx.quadraticCurveTo(cx + headRx * 0.92, headY + headRy * 0.30, cx + headRx * 0.66, headY - headRy * 0.50);
  ctx.strokeStyle = OWL.ink; ctx.lineWidth = 2.2 * S; ctx.stroke();
  ctx.restore();

  // ---- speckled crown patch ----
  const crownY = headY - headRy * 0.72;
  blob(ctx, cx, crownY, headRx * 0.46, headRy * 0.30, OWL.crown, seed + 3,
       { stroke: OWL.ink, lw: 2.6 * S, rough: 0.09 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + seed;
    const rr = 0.28 + hash(seed + i * 7) * 0.55;
    blob(ctx, cx + Math.cos(a) * headRx * 0.30 * rr * 1.4,
         crownY + Math.sin(a) * headRy * 0.20 * rr * 1.4,
         2.2 * S, 2.2 * S, OWL.ink, seed + i * 3);
  }

  // ---- ear tufts: out and up, then back down into the brow ----
  const tuftLift = q.tuft;
  for (const dir of [-1, 1]) {
    earTuft(ctx,
      cx + dir * headRx * 1.02, headY - headRy * (1.30 + tuftLift),  // outer top
      cx + dir * headRx * 0.10, headY - headRy * 0.12,               // inner, at the brow
      w * 0.11, dir, seed + dir * 13);
  }

  // ---- eyes ----
  const eyeDX = headRx * 0.44, eyeY = headY + headRy * 0.06;
  const eyeR = headRx * 0.30;
  for (const dir of [-1, 1]) {
    const ex = cx + dir * eyeDX;
    if (q.eye <= 0.02) {
      stroke(ctx, ex - eyeR * 0.8, eyeY, ex + eyeR * 0.8, eyeY, OWL.ink, 2.6 * S, seed + dir, 0.6);
      continue;
    }
    blob(ctx, ex, eyeY, eyeR, eyeR * q.eye, OWL.eyeWhite, seed + dir * 17,
         { stroke: OWL.ink, lw: 2.6 * S, rough: 0.07 });
    blob(ctx, ex + dir * eyeR * 0.06, eyeY, eyeR * 0.70, eyeR * 0.70 * q.eye, OWL.pupil, seed + dir * 19);
    ctx.globalAlpha = 0.9;
    blob(ctx, ex - dir * eyeR * 0.22, eyeY - eyeR * 0.28, eyeR * 0.18, eyeR * 0.18, '#ffffff', seed + dir * 23);
    ctx.globalAlpha = 1;
  }

  // ---- heavy angled eyebrows ----
  if (q.brow > 0.05) {
    for (const dir of [-1, 1]) {
      const ex = cx + dir * eyeDX;
      ctx.beginPath();
      ctx.moveTo(ex - dir * eyeR * 1.15, eyeY - eyeR * (0.72 + q.brow * 0.30));
      ctx.quadraticCurveTo(ex, eyeY - eyeR * (1.30 + q.brow * 0.25),
                           ex + dir * eyeR * 1.05, eyeY - eyeR * 0.30);
      ctx.lineTo(ex + dir * eyeR * 0.80, eyeY - eyeR * 0.62);
      ctx.quadraticCurveTo(ex, eyeY - eyeR * 0.95, ex - dir * eyeR * 1.10, eyeY - eyeR * 0.52);
      ctx.closePath();
      ctx.fillStyle = OWL.ink; ctx.fill();
    }
  }

  // ---- beak: a small yellow triangle pointing down ----
  const bkY = eyeY + eyeR * 0.55;
  const bkW = headRx * 0.17, bkH = headRy * (0.34 + q.beak * 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - bkW, bkY);
  ctx.lineTo(cx + bkW, bkY);
  ctx.lineTo(cx, bkY + bkH);
  ctx.closePath();
  ctx.fillStyle = OWL.beak; ctx.fill();
  ctx.strokeStyle = OWL.ink; ctx.lineWidth = 2.2 * S; ctx.lineJoin = 'round'; ctx.stroke();

  ctx.restore();
}
