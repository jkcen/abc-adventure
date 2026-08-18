// Character rendering.
//
// CANONICAL MAPPING — do not change without asking:
//   A    = fully brown eagle          (brown head, brown body)
//   B    = white-headed brown eagle
//   C    = small all-white bird
//   owl  = forest owl
//
// Each (character, state) pair is registered in the asset registry as
// "char/<id>/<state>". Drop a real PNG at that key and it replaces the
// procedural painter with zero changes to gameplay code.

import { assets } from '../core/assets.js';
import { blob, stroke, washBlob } from './brush.js';
import { noise1 } from '../core/rng.js';

export const PALETTE = {
  A: {
    head: '#7b4a24', body: '#7b4a24', wing: '#5f3719', bellyShade: '#8d5a2e',
    beak: '#f0a029', foot: '#f0a029', talon: '#1d1712', eye: '#221a12',
    brow: true,  // the determined/fierce expression
    scale: 1.0,
  },
  B: {
    head: '#f6f1e6', body: '#7b4a24', wing: '#5f3719', bellyShade: '#8d5a2e',
    beak: '#f2bb3c', foot: '#f2bb3c', talon: '#1d1712', eye: '#221a12',
    brow: false, // kind, softer face
    scale: 1.0,
  },
  C: {
    head: '#fdfaf2', body: '#fdfaf2', wing: '#eee6d6', bellyShade: '#ffffff',
    beak: '#f5a83a', foot: '#f5a83a', talon: '#c98527', eye: '#2a2119',
    brow: false,
    scale: 0.78, // smaller, softer silhouette than A and B
  },
  owl: {
    head: '#6a5b48', body: '#6a5b48', wing: '#4c4033', bellyShade: '#8a7a63',
    beak: '#e0a33c', foot: '#d9993a', talon: '#1d1712', eye: '#f4d67a',
    brow: true, scale: 1.25, owl: true,
  },
};

// Per-state animation shaping. Everything the birds do routes through here,
// so a new state is a data change, not new drawing code.
function pose(state, t) {
  const breathe = Math.sin(t * 2.4) * 0.5;
  switch (state) {
    case 'walk':  return { wing: -0.12, tilt: 0.04, bob: Math.sin(t * 11) * 1.8, leg: Math.sin(t * 11), eye: 1 };
    case 'run':   return { wing: -0.3,  tilt: 0.14, bob: Math.sin(t * 15) * 2.4, leg: Math.sin(t * 15), eye: 1 };
    case 'jump':  return { wing: -1.05, tilt: -0.12, bob: -1, leg: -0.6, eye: 1 };
    case 'fall':  return { wing: -0.55 + Math.sin(t * 9) * 0.25, tilt: 0.1, bob: 0, leg: 0.3, eye: 1.15 };
    case 'fly':   return { wing: Math.sin(t * 8) * 1.15, tilt: -0.05, bob: Math.sin(t * 8) * 3, leg: 0.5, eye: 1 };
    case 'land':  return { wing: -0.2, tilt: 0.05, bob: 3.5, leg: 1.1, eye: 0.7 };
    case 'hurt':  return { wing: 0.9, tilt: -0.3, bob: -1, leg: -0.8, eye: 0.35 };
    case 'surprised': return { wing: 0.5, tilt: -0.16, bob: -2, leg: -0.3, eye: 1.5 };
    case 'tired': return { wing: 0.06, tilt: 0.18, bob: breathe * 1.6, leg: 0, eye: 0.45 };
    case 'sleep': return { wing: 0.02, tilt: 0.3, bob: Math.sin(t * 1.3) * 1.6, leg: 0, eye: 0 };
    case 'happy':
    case 'celebrate': return { wing: -0.75 + Math.sin(t * 12) * 0.5, tilt: -0.08, bob: -Math.abs(Math.sin(t * 6)) * 5, leg: 0, eye: 1 };
    default:      return { wing: -0.04 + Math.sin(t * 2.2) * 0.06, tilt: 0, bob: breathe, leg: 0, eye: 1 };
  }
}

// Draws a bird facing +x inside a w*h box. Origin is the box's top-left.
export function drawBird(ctx, id, state, w, h, t) {
  const p = PALETTE[id];
  if (!p) return;
  const s = p.scale;
  const cx = w * 0.5, cy = h * 0.56 + pose(state, t).bob;
  const q = pose(state, t);
  const bodyRx = w * 0.30 * s, bodyRy = h * 0.25 * s;
  const seed = id.charCodeAt(0);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(q.tilt);

  // --- feet (behind body) ---
  if (state !== 'fly' && state !== 'sleep') {
    const legY = bodyRy * 0.85;
    for (let i = 0; i < 2; i++) {
      const dir = i === 0 ? -1 : 1;
      const swing = q.leg * dir * 7;
      const fx = dir * bodyRx * 0.22 + swing;
      const fy = legY + h * 0.20 * s;
      stroke(ctx, dir * bodyRx * 0.2, legY, fx, fy, p.foot, 3.4 * s, seed + i * 9, 1.2);
      // three talons
      for (let k = -1; k <= 1; k++) {
        stroke(ctx, fx, fy, fx + k * 5 * s + 3 * s, fy + 4 * s, p.talon, 2.1 * s, seed + i * 5 + k, 0.8);
      }
    }
  }

  // --- tail ---
  ctx.save();
  ctx.rotate(state === 'fall' ? 0.25 : 0.08);
  blob(ctx, -bodyRx * 1.25, bodyRy * 0.12, bodyRx * 0.55, bodyRy * 0.34, p.wing, seed + 3,
       { stroke: 'rgba(30,20,12,.45)', lw: 2 * s });
  ctx.restore();

  // --- body ---
  washBlob(ctx, 0, 0, bodyRx * 1.04, bodyRy * 1.04, p.body, seed);
  blob(ctx, 0, 0, bodyRx, bodyRy, p.body, seed, { stroke: 'rgba(28,18,10,.55)', lw: 2.6 * s });
  blob(ctx, bodyRx * 0.05, bodyRy * 0.34, bodyRx * 0.66, bodyRy * 0.42, p.bellyShade, seed + 11);

  // --- far wing (subtle depth) ---
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.rotate(q.wing * 0.7);
  blob(ctx, -bodyRx * 0.1, -bodyRy * 0.1, bodyRx * 0.72, bodyRy * 0.5, p.wing, seed + 21);
  ctx.restore();

  // --- near wing ---
  ctx.save();
  ctx.translate(-bodyRx * 0.05, -bodyRy * 0.12);
  ctx.rotate(q.wing);
  blob(ctx, -bodyRx * 0.18, bodyRy * 0.08, bodyRx * 0.82, bodyRy * 0.46, p.wing, seed + 7,
       { stroke: 'rgba(28,18,10,.5)', lw: 2.2 * s });
  // feather ticks
  for (let i = 0; i < 3; i++) {
    stroke(ctx, -bodyRx * 0.55 - i * 4, bodyRy * 0.1, -bodyRx * 0.9 - i * 5, bodyRy * 0.26,
           'rgba(28,18,10,.35)', 1.6 * s, seed + i * 13, 1);
  }
  ctx.restore();

  // --- head ---
  const hx = bodyRx * 0.80, hy = -bodyRy * 0.80;
  const hr = bodyRx * (p.owl ? 0.78 : 0.60);
  blob(ctx, hx, hy, hr, hr * (p.owl ? 0.95 : 0.88), p.head, seed + 5,
       { stroke: 'rgba(28,18,10,.5)', lw: 2.4 * s });

  if (p.owl) { // ear tufts
    stroke(ctx, hx - hr * 0.5, hy - hr * 0.7, hx - hr * 0.85, hy - hr * 1.5, p.head, 5 * s, seed + 2, 1);
    stroke(ctx, hx + hr * 0.3, hy - hr * 0.8, hx + hr * 0.5, hy - hr * 1.6, p.head, 5 * s, seed + 4, 1);
  }

  // --- beak ---
  const bx = hx + hr * 0.82, by = hy + hr * 0.10;
  ctx.beginPath();
  if (p.owl) {
    ctx.moveTo(bx - 2 * s, by - 5 * s); ctx.lineTo(bx + 8 * s, by); ctx.lineTo(bx - 2 * s, by + 6 * s);
  } else {
    // hooked eagle beak; C gets a small straight one
    const L = (id === 'C' ? 8 : 13) * s;
    ctx.moveTo(bx - 3 * s, by - 6 * s);
    ctx.quadraticCurveTo(bx + L, by - 3 * s, bx + L * 0.75, by + 6 * s);
    ctx.lineTo(bx - 3 * s, by + 5 * s);
  }
  ctx.closePath();
  ctx.fillStyle = p.beak; ctx.fill();
  ctx.strokeStyle = 'rgba(40,25,8,.5)'; ctx.lineWidth = 1.6 * s; ctx.stroke();

  // --- eye ---
  const ex = hx + hr * 0.28, ey = hy - hr * 0.12;
  if (q.eye <= 0.02) {
    stroke(ctx, ex - 4 * s, ey, ex + 4 * s, ey, p.eye, 2 * s, seed, 0.6); // closed
  } else {
    if (p.owl) { blob(ctx, ex, ey, hr * 0.34, hr * 0.34 * q.eye, '#f6e6b0', seed + 31); }
    blob(ctx, ex, ey, (p.owl ? hr * 0.18 : 3.4 * s), (p.owl ? hr * 0.18 : 3.4 * s) * q.eye, p.eye, seed + 9);
    ctx.globalAlpha = 0.85;
    blob(ctx, ex + 1.2 * s, ey - 1.2 * s, 1.2 * s, 1.2 * s, '#fff', seed + 12);
    ctx.globalAlpha = 1;
  }

  // --- brow (A and owl only: the determined look) ---
  if (p.brow && q.eye > 0.1) {
    stroke(ctx, ex - 6 * s, ey - 6 * s, ex + 7 * s, ey - 3.5 * s, 'rgba(30,20,12,.8)', 2.4 * s, seed + 15, 0.8);
  }

  // sleep marks
  if (state === 'sleep') {
    ctx.globalAlpha = 0.6 + Math.sin(t * 2) * 0.25;
    ctx.fillStyle = '#fff';
    ctx.font = `${11 * s}px "Bradley Hand", cursive`;
    ctx.fillText('z', hx + hr + 6, hy - hr - 4 + Math.sin(t * 2) * 3);
    ctx.fillText('z', hx + hr + 14, hy - hr - 16 + Math.sin(t * 2 + 1) * 3);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

const STATES = ['idle','walk','run','jump','fall','fly','land','hurt','surprised','tired','sleep','happy','celebrate'];

export function registerCharacterArt() {
  for (const id of Object.keys(PALETTE)) {
    for (const st of STATES) {
      assets.paint(`char/${id}/${st}`, (ctx, w, h, t) => drawBird(ctx, id, st, w, h, t));
    }
  }
}

// Convenience used by every actor: honors a real PNG if one is registered.
export function paintCharacter(ctx, id, state, x, y, w, h, t, facing = 1) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(facing, 1);
  ctx.translate(-w / 2, -h / 2);
  if (!assets.draw(ctx, `char/${id}/${state}`, w, h, t)) {
    assets.draw(ctx, `char/${id}/idle`, w, h, t);
  }
  ctx.restore();
}
