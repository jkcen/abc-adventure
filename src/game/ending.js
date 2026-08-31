// THE ENDING — painted from Katherine's canvas: a red-and-orange sunset, the
// yellow sun setting behind dark mountains, green hills with stamped pine
// forests, the big teal pine on the right, the brown path winding down to the
// river — and A, B and C flying home together over all of it.
//
// It is a still painting that breathes: the sun sinks a hair, the birds glide,
// the flowers nod. Nothing here is interactive except "press space".

import { blob, blobPath, stroke, washBlob, glow } from '../render/brush.js';
import { paintCharacter } from '../render/characters.js';
import { hash, wob, noise1 } from '../core/rng.js';
import { charName } from '../core/names.js';

const PAL = {
  skyTop: '#a51616', skyMid: '#e2571a', skyLow: '#f59a10', skyHaze: '#f6c02a',
  sun: '#f7e21c', sunGlow: 'rgba(250,226,60,ALPHA)',
  mountain: '#4d332c', mountainLit: '#a98455', mountainFar: '#7a4f42',
  snow: '#ffffff',
  hillFar: '#7ab52a', hill: '#3fa22a', hillLit: '#63c247',
  forest: '#1f6b4a', trunk: '#8b5a2b',
  pineBig: '#1a6a5e', pineTrunk: '#8a5a30',
  path: '#8a5a30', pathDark: '#6d4522',
  river: '#1f6fc4', riverLight: '#5aa3e8',
  flower: '#d02020', flowerHeart: '#f2d21c', stem: '#2f7a2b',
  ink: 'rgba(40,28,20,.55)',
};

export class Ending {
  constructor() {
    this.t = 0;
    this.done = false;      // set once the player asks to leave
    this.hold = 0;          // a beat before "press space" appears
  }

  update(dt, input) {
    this.t += dt;
    this.hold += dt;
    // The ending is meant to be sat with — the words arrive one at a time and
    // only after they have all landed can the player leave.
    if (this.hold > 16 && (input.consumeConfirm() || input.consumeMap())) this.done = true;
  }

  draw(ctx, w, h) {
    this.paint(ctx, w, h, this.t);
    this._words(ctx, w, h, this.t);
  }

  // The painting on its own, with no words over it. The title screen borrows
  // this: the home page IS the ending picture, with the menu on top of it.
  paint(ctx, w, h, t) {
    // the sun settles a little lower over the first few seconds, then rests
    const set = Math.min(1, t / 14);
    const horizon = h * 0.56;

    this._sky(ctx, w, h, horizon);
    this._sun(ctx, w, h, horizon, set);
    this._mountains(ctx, w, h, horizon);
    this._hills(ctx, w, h, horizon, t);
    this._bigPine(ctx, w * 0.79, horizon + h * 0.02, h * 0.30, t);
    this._river(ctx, w, h, horizon, t);
    this._path(ctx, w, h, horizon);
    this._flowers(ctx, w, h, t);
    this._birds(ctx, w, h, t);
  }

  // ------------------------------------------------------------------ sky ---
  _sky(ctx, w, h, horizon) {
    const g = ctx.createLinearGradient(0, 0, 0, horizon + 40);
    g.addColorStop(0, PAL.skyTop);
    g.addColorStop(0.38, '#c9351a');
    g.addColorStop(0.66, PAL.skyMid);
    g.addColorStop(0.88, PAL.skyLow);
    g.addColorStop(1, PAL.skyHaze);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, horizon + 44);

    // the brushed streaks across the top of the canvas
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#ffd9a0';
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const y = h * 0.04 + i * h * 0.045;
      stroke(ctx, -10, y, w + 10, y + wob(i * 7) * 6, '#ffd9a0', 3, i * 13, 3);
    }
    ctx.restore();
  }

  _sun(ctx, w, h, horizon, set) {
    const cx = w * 0.5, cy = horizon - h * 0.10 + set * h * 0.035;
    const r = h * 0.155;
    glow(ctx, cx, cy, r * 2.6, PAL.sunGlow, 0.45);
    blob(ctx, cx, cy, r, r, PAL.sun, 4, { rough: 0.04, points: 18 });
    ctx.save();
    ctx.globalAlpha = 0.5;
    blob(ctx, cx, cy, r * 0.82, r * 0.82, '#fff8a8', 9, { rough: 0.05, points: 16 });
    ctx.restore();
  }

  // ------------------------------------------------------------ mountains ---
  _mountains(ctx, w, h, horizon) {
    // the small snow-capped peak on the far left
    this._peak(ctx, w * 0.02, horizon, w * 0.22, h * 0.24, PAL.mountainFar, 3, true);
    // the two big dark peaks
    this._peak(ctx, w * 0.10, horizon, w * 0.34, h * 0.42, PAL.mountain, 7);
    this._peak(ctx, w * 0.34, horizon, w * 0.38, h * 0.32, PAL.mountain, 11);
    // the tan cut-paper shape leaning against them, straight from the collage
    ctx.save();
    ctx.translate(w * 0.30, horizon - h * 0.02);
    ctx.rotate(-0.06);
    blob(ctx, 0, -h * 0.13, w * 0.048, h * 0.20, PAL.mountainLit, 5,
         { stroke: 'rgba(60,40,28,.35)', lw: 2, rough: 0.06, points: 14 });
    ctx.restore();
  }

  _peak(ctx, x, baseY, w, h, color, seed, snow = false) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + w * 0.5 + wob(seed) * 8, baseY - h);
    ctx.lineTo(x + w, baseY);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    if (snow) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5 - w * 0.13, baseY - h * 0.74);
      ctx.lineTo(x + w * 0.5 + wob(seed) * 8, baseY - h);
      ctx.lineTo(x + w * 0.5 + w * 0.13, baseY - h * 0.72);
      ctx.quadraticCurveTo(x + w * 0.5, baseY - h * 0.84, x + w * 0.5 - w * 0.13, baseY - h * 0.74);
      ctx.closePath();
      ctx.fillStyle = PAL.snow; ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- hills ---
  _hills(ctx, w, h, horizon, t) {
    // right-hand hill, the yellow-green one the big pine stands on
    ctx.beginPath();
    ctx.moveTo(w * 0.60, horizon + 6);
    ctx.quadraticCurveTo(w * 0.82, horizon - h * 0.06, w + 10, horizon + h * 0.02);
    ctx.lineTo(w + 10, h + 10); ctx.lineTo(w * 0.60, h + 10);
    ctx.closePath();
    ctx.fillStyle = PAL.hillFar; ctx.fill();

    // the whole green meadow across the bottom
    ctx.beginPath();
    ctx.moveTo(-10, horizon + h * 0.10);
    ctx.quadraticCurveTo(w * 0.30, horizon - h * 0.01, w * 0.62, horizon + h * 0.08);
    ctx.quadraticCurveTo(w * 0.86, horizon + h * 0.14, w + 10, horizon + h * 0.06);
    ctx.lineTo(w + 10, h + 10); ctx.lineTo(-10, h + 10);
    ctx.closePath();
    ctx.fillStyle = PAL.hill; ctx.fill();

    // brushy lighter grass, the way the canvas is stroked
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 26; i++) {
      const x = (i * 83) % (w + 60) - 30;
      const y = horizon + h * (0.16 + hash(i * 5) * 0.34);
      stroke(ctx, x, y, x + 70 + hash(i) * 60, y + wob(i * 3) * 5, PAL.hillLit, 7, i * 9, 3);
    }
    ctx.restore();

    // the stamped pine forest on the left hill
    this._forestPatch(ctx, -w * 0.01, horizon + h * 0.03, w * 0.26, h * 0.30, t);
  }

  // Rows of little pines, exactly like the ones stamped across her hillside.
  _forestPatch(ctx, x, y, w, h, t) {
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const ry = y + (h / rows) * r;
      const s = 0.7 + r * 0.16;
      const count = 5 - Math.floor(r / 2);
      for (let i = 0; i < count; i++) {
        const px = x + w * ((i + 0.4 + hash(r * 7 + i) * 0.3) / count);
        this._pine(ctx, px, ry, 16 * s, 26 * s, r * 13 + i);
      }
    }
  }

  _pine(ctx, x, baseY, w, h, seed) {
    stroke(ctx, x, baseY, x, baseY - h * 0.28, PAL.trunk, Math.max(1.6, w * 0.14), seed, 0.5);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY - h * 0.22);
    ctx.lineTo(x + wob(seed) * 1.5, baseY - h);
    ctx.lineTo(x + w / 2, baseY - h * 0.22);
    ctx.closePath();
    ctx.fillStyle = PAL.forest; ctx.fill();
  }

  // The big cut-paper pine on the right, with its square brown trunk.
  _bigPine(ctx, x, baseY, h, t) {
    const sway = Math.sin(t * 0.6) * 0.012;
    ctx.save();
    ctx.translate(x, baseY);
    ctx.rotate(sway);
    ctx.fillStyle = PAL.pineTrunk;
    ctx.fillRect(-h * 0.09, -h * 0.46, h * 0.18, h * 0.48);
    ctx.strokeStyle = 'rgba(60,40,20,.3)'; ctx.lineWidth = 2;
    ctx.strokeRect(-h * 0.09, -h * 0.46, h * 0.18, h * 0.48);

    ctx.fillStyle = PAL.pineBig;
    for (let i = 0; i < 4; i++) {
      const k = i / 3;
      const ww = h * (0.46 - k * 0.26);
      const yy = -h * (0.40 + k * 0.52);
      ctx.beginPath();
      ctx.moveTo(-ww, yy);
      for (let s = 0; s <= 6; s++) {          // the scalloped paper edge
        const p = s / 6;
        ctx.lineTo(-ww + ww * 2 * p, yy - (s % 2 ? h * 0.02 : 0));
      }
      ctx.lineTo(ww, yy);
      ctx.lineTo(wob(i) * 4, yy - h * 0.20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------- river and pathway ---
  _river(ctx, w, h, horizon, t) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.40, horizon + h * 0.05);
    ctx.quadraticCurveTo(w * 0.50, horizon + h * 0.13, w * 0.46, horizon + h * 0.26);
    ctx.quadraticCurveTo(w * 0.56, horizon + h * 0.20, w * 0.60, horizon + h * 0.04);
    ctx.closePath();
    ctx.fillStyle = PAL.river; ctx.fill();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = horizon + h * (0.08 + i * 0.045);
      stroke(ctx, w * 0.44, y, w * 0.56, y + Math.sin(t * 1.2 + i) * 2,
             PAL.riverLight, 3, i * 11, 2);
    }
    ctx.restore();
  }

  _path(ctx, w, h, horizon) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, horizon + h * 0.10);
    ctx.quadraticCurveTo(w * 0.34, h * 0.86, w * 0.40, h + 10);
    ctx.lineTo(w * 0.56, h + 10);
    ctx.quadraticCurveTo(w * 0.52, h * 0.84, w * 0.50, horizon + h * 0.10);
    ctx.closePath();
    ctx.fillStyle = PAL.path; ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = PAL.pathDark;
    ctx.fill();
    ctx.restore();
  }

  // The red clay flowers pressed into the grass on the right.
  _flowers(ctx, w, h, t) {
    const spots = [[0.80, 0.60], [0.90, 0.72], [0.72, 0.85], [0.96, 0.55]];
    spots.forEach(([fx, fy], i) => {
      const x = w * fx, y = h * fy + Math.sin(t * 1.1 + i) * 1.5;
      const r = h * 0.022;
      stroke(ctx, x, y + r * 2.6, x + wob(i) * 3, y + r * 0.6, PAL.stem, 3.4, i * 5, 1);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        blob(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.62, r * 0.62,
             PAL.flower, i * 7 + k);
      }
      blob(ctx, x, y, r * 0.42, r * 0.42, PAL.flowerHeart, i + 3);
    });
  }

  // ---------------------------------------------------------------- birds ---
  // A and B fly wide across the middle; C flies just behind them, where she
  // is in the painting — small, white, and no longer alone.
  _birds(ctx, w, h, t) {
    const glideY = (phase, amp) => Math.sin(t * 0.9 + phase) * amp;
    const drift = Math.sin(t * 0.25) * w * 0.02;

    // B, the white-headed one, a little behind and above
    paintCharacter(ctx, 'B', 'fly',
      w * 0.46 + drift, h * 0.46 + glideY(0.6, 10), w * 0.20, h * 0.24, t, -1);
    // A, biggest and closest, leading
    paintCharacter(ctx, 'A', 'fly',
      w * 0.20 + drift * 1.3, h * 0.50 + glideY(0, 12), w * 0.24, h * 0.28, t, -1);
    // C, small and white, coming along with them
    paintCharacter(ctx, 'C', 'fly',
      w * 0.66 + drift * 0.8, h * 0.60 + glideY(1.7, 8), w * 0.15, h * 0.18, t, -1);
  }

  // ---------------------------------------------------------------- words ---
  _words(ctx, w, h, t) {
    ctx.save();
    ctx.textAlign = 'center';

    const fade = (start, dur = 1.6) => Math.min(1, Math.max(0, (t - start) / dur));

    ctx.fillStyle = '#fff6e2';
    ctx.shadowColor = 'rgba(60,20,10,.55)';
    ctx.shadowBlur = 12;

    ctx.globalAlpha = fade(0.8);
    ctx.font = `${Math.round(h * 0.10)}px "Bradley Hand", "Segoe Print", cursive`;
    ctx.fillText('together', w / 2, h * 0.18);

    ctx.font = `${Math.round(h * 0.038)}px "Bradley Hand", cursive`;
    ctx.globalAlpha = fade(0.8) * 0.9;
    ctx.fillText(`${charName('A')}, ${charName('B')} and ${charName('C')} flew home over the sunset`,
                 w / 2, h * 0.245);

    // the closing lines, arriving slowly, one after another
    const lines = [
      ['And they lived happily ever after.', 0.80, 4.5],
      ['The journey is not over —', 0.86, 8.0],
      ['there is always another sky to fly under.', 0.91, 11.0],
    ];
    ctx.font = `${Math.round(h * 0.034)}px "Bradley Hand", cursive`;
    for (const [text, y, at] of lines) {
      ctx.globalAlpha = fade(at, 2.2) * 0.95;
      if (ctx.globalAlpha > 0.01) ctx.fillText(text, w / 2, h * y);
    }

    if (this.hold > 16) {
      ctx.globalAlpha = 0.4 + Math.sin(t * 3) * 0.22;
      ctx.font = `${Math.round(h * 0.026)}px "Bradley Hand", cursive`;
      ctx.fillText('space — back to the map', w / 2, h * 0.975);
    }
    ctx.restore();
  }
}
