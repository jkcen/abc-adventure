// Dialogue — small hand-drawn speech bubbles anchored to the speaker.
// Deliberately NOT a full-width panel: the world stays visible and the
// conversation reads as something the birds are doing, not a UI screen.

import { blobPath } from '../render/brush.js';
import { charName } from '../core/names.js';

export class Dialogue {
  constructor() {
    this.lines = [];
    this.i = 0;
    this.active = false;
    this.charT = 0;
    this.onDone = null;
  }

  // lines: [{speaker:'A'|'B'|'C'|'owl', text, anchor:()=>({x,y})}]
  play(lines, onDone) {
    this.lines = lines; this.i = 0; this.charT = 0;
    this.active = true; this.onDone = onDone;
    this._stale = true;
  }

  get current() { return this.lines[this.i]; }

  update(dt, input) {
    if (!this.active) return;
    const line = this.current;
    if (!line) return this._finish();
    // Every jump also counts as a confirm, and nothing takes it during play.
    // Drop whatever was pressed before the bubble appeared, or the jump that
    // carried her into the cutscene would skip its first line.
    if (this._stale) { input.consumeConfirm(); input.consumeJump(); this._stale = false; }
    this.charT += dt * 38;

    // Up jumps without confirming, so take the jump buffer too: a child who
    // jumps with ↑ can still read on with it. Both are consumed, or one press
    // of space would advance twice.
    const confirm = input.consumeConfirm();
    const jump = input.consumeJump();
    if (confirm || jump) {
      if (this.charT < line.text.length) this.charT = line.text.length; // reveal all
      else {
        this.i++; this.charT = 0;
        if (this.i >= this.lines.length) this._finish();
      }
    }
  }

  _finish() {
    this.active = false;
    const cb = this.onDone; this.onDone = null;
    cb?.();
  }

  // Drawn in WORLD space so bubbles sit next to the birds.
  draw(ctx, t) {
    if (!this.active) return;
    const line = this.current;
    if (!line) return;
    const at = line.anchor();
    const shown = line.text.slice(0, Math.floor(this.charT));

    ctx.save();
    ctx.font = '17px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
    // Own every piece of text state we depend on. Canvas text settings are
    // global and persist across frames, so inheriting them silently misplaces
    // the whole bubble the moment another scene changes one.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const words = line.text.split(' ');
    const maxW = 210;
    const rows = [];
    let row = '';
    for (const wd of words) {
      const test = row ? row + ' ' + wd : wd;
      if (ctx.measureText(test).width > maxW && row) { rows.push(row); row = wd; }
      else row = test;
    }
    if (row) rows.push(row);

    const padX = 15, padY = 12, lh = 22;
    // Fit the widest row as measured. Clamping to maxW here would let a single
    // unbreakable word render past the bubble edge.
    const bw = Math.max(...rows.map(r => ctx.measureText(r).width)) + padX * 2;
    const bh = rows.length * lh + padY * 2;
    const bx = at.x - bw / 2;
    const by = at.y - bh - 26 + Math.sin(t * 2) * 1.5;

    // tail
    ctx.beginPath();
    ctx.moveTo(at.x - 9, by + bh - 4);
    ctx.lineTo(at.x + 2, by + bh + 16);
    ctx.lineTo(at.x + 11, by + bh - 4);
    ctx.closePath();
    ctx.fillStyle = '#fffaf0'; ctx.fill();
    ctx.strokeStyle = '#3a2b21'; ctx.lineWidth = 2.4; ctx.stroke();

    // wobbly bubble
    blobPath(ctx, bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 42, 14, 0.045);
    ctx.fillStyle = '#fffaf0'; ctx.fill();
    ctx.strokeStyle = '#3a2b21'; ctx.lineWidth = 2.6; ctx.stroke();

    // speaker name — canonical id resolved to a display name
    ctx.fillStyle = '#8a6f57';
    ctx.font = '13px "Bradley Hand", cursive';
    ctx.fillText(charName(line.speaker), bx + padX, by + 11);

    ctx.fillStyle = '#33261c';
    ctx.font = '17px "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
    let cut = 0;
    rows.forEach((r, i) => {
      const vis = shown.slice(cut, cut + r.length);
      cut += r.length + 1;
      ctx.fillText(vis, bx + padX, by + padY + lh * i + lh / 2 + 4);
    });

    // continue nudge, only once the line is fully revealed
    if (this.charT >= line.text.length) {
      ctx.globalAlpha = 0.4 + Math.sin(t * 5) * 0.3;
      ctx.fillStyle = '#7a6350';
      ctx.beginPath();
      ctx.moveTo(bx + bw - 20, by + bh - 12);
      ctx.lineTo(bx + bw - 10, by + bh - 12);
      ctx.lineTo(bx + bw - 15, by + bh - 6);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}
