// World map — an illustrated page from inside this world, not a dashboard.
// The whole journey, and nothing more: the Purple Sky where Wild starts →
// the Weed Sea → the Sunset Cliffs → Peter's Island, where the story ends.
// Locked places are drawn faintly, the way an unfinished drawing looks.

import { blob, stroke, blobPath, washBlob } from '../render/brush.js';
import { paintCharacter } from '../render/characters.js';
import { hash } from '../core/rng.js';
import { save } from '../core/save.js';
import { KEYS } from '../core/input.js';

// Positions are fractions of the map card, so it scales with the window.
const NODES = [
  // One node per chapter, plus the island the whole journey is aimed at.
  { id: 'level-1',  name: 'Purple Sky',     x: 0.13, y: 0.56, chars: ['A', 'B'] },
  { id: 'level-2',  name: 'The Weed Sea',   x: 0.39, y: 0.32 },
  { id: 'level-3',  name: 'Sunset Cliffs',  x: 0.65, y: 0.64 },
  { id: 'c-island', name: 'Peter’s Island', x: 0.88, y: 0.38, chars: ['C'] },
];

const EDGES = [
  ['level-1', 'level-2'], ['level-2', 'level-3'], ['level-3', 'c-island'],
];

export class WorldMap {
  constructor() {
    this.t = 0;
    this.current = 'level-1';
    this.chapters = [];     // [{node, label, open}] — the levels you may travel to
    this.sel = 0;
  }

  // main.js refreshes this each time the map opens, from the save file.
  setChapters(list, preferred = null) {
    this.chapters = list;
    const open = list.filter(c => c.open);
    if (!open.length) { this.sel = 0; return; }
    // The cursor lands on the chapter you are meant to play next — never on
    // one you have just finished. Failing that, on where you are standing.
    const want = list.findIndex(c => c.node === preferred && c.open);
    const here = list.findIndex(c => c.node === this.current && c.open);
    this.sel = want >= 0 ? want : (here >= 0 ? here : list.lastIndexOf(open[open.length - 1]));
  }

  get selected() { return this.chapters[this.sel]; }

  move(dir) {
    if (!this.chapters.some(c => c.open)) return;
    let i = this.sel;
    for (let n = 0; n < this.chapters.length; n++) {
      i = (i + dir + this.chapters.length) % this.chapters.length;
      if (this.chapters[i].open) { this.sel = i; return; }
    }
  }

  unlocked(id) {
    if (id === 'level-1') return true;
    if (save.data.visited.includes(id)) return true;
    // A chapter you have earned the right to travel to reads as open, even if
    // you have not set foot in it yet.
    const ch = this.chapters.find(c => c.node === id);
    return !!(ch && ch.open);
  }

  update(dt) { this.t += dt; }

  draw(ctx, w, h) {
    const t = this.t;
    // parchment card
    const pad = Math.min(w, h) * 0.06;
    const cx = pad, cy = pad, cw = w - pad * 2, ch = h - pad * 2;

    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a2138'); g.addColorStop(1, '#1c1626');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    blobPath(ctx, cx + cw / 2, cy + ch / 2, cw / 2, ch / 2, 5, 22, 0.012);
    ctx.fillStyle = '#f6ecd8'; ctx.fill();
    ctx.strokeStyle = '#8a7150'; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.save(); ctx.clip();

    // painted terrain wash so the page feels like part of the world
    ctx.globalAlpha = 0.3;
    // one wash per chapter, in that chapter's own colours
    washBlob(ctx, cx + cw * 0.13, cy + ch * 0.56, cw * 0.19, ch * 0.34, '#c9bde4', 3);  // the purple sky
    washBlob(ctx, cx + cw * 0.39, cy + ch * 0.34, cw * 0.19, ch * 0.30, '#8fd3cf', 9);  // the teal weed sea
    washBlob(ctx, cx + cw * 0.65, cy + ch * 0.62, cw * 0.19, ch * 0.30, '#f0a878', 12); // the sunset cliffs
    washBlob(ctx, cx + cw * 0.88, cy + ch * 0.38, cw * 0.11, ch * 0.20, '#ffe2a8', 15); // Peter's island
    ctx.globalAlpha = 1;

    const pos = (n) => ({ x: cx + cw * n.x, y: cy + ch * n.y });
    const byId = Object.fromEntries(NODES.map(n => [n.id, n]));

    // --- dotted travel routes ---
    for (const [aId, bId] of EDGES) {
      const a = pos(byId[aId]), b = pos(byId[bId]);
      const open = this.unlocked(aId) && this.unlocked(bId);
      ctx.save();
      ctx.setLineDash([7, 9]);
      ctx.lineDashOffset = open ? -t * 18 : 0;
      ctx.strokeStyle = open ? 'rgba(120,86,52,.85)' : 'rgba(120,100,80,.22)';
      ctx.lineWidth = open ? 3 : 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 26, b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }

    // --- locations ---
    ctx.save();
    ctx.textAlign = 'center';
    for (const n of NODES) {
      const p = pos(n);
      const open = this.unlocked(n.id);
      const here = n.id === this.current;
      const picked = this.selected && this.selected.open && this.selected.node === n.id;
      const r = n.small ? 13 : 20;

      ctx.globalAlpha = open ? 1 : 0.3;
      if (here) {
        ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.15;
        blob(ctx, p.x, p.y, r + 16, r + 13, '#ffdf9a', 21);
        ctx.globalAlpha = 1;
      }
      if (picked) {
        // the travel cursor: a hand-drawn ring around the chapter you'd enter
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -t * 26;
        ctx.strokeStyle = '#c2452f';
        ctx.lineWidth = 3;
        blobPath(ctx, p.x, p.y, r + 15 + Math.sin(t * 3) * 1.5, r + 12, 4, 16, 0.05);
        ctx.stroke();
        ctx.restore();
      }
      blob(ctx, p.x, p.y + 4, r * 1.05, r * 0.55, 'rgba(90,70,50,.25)', 7); // cast shadow
      blob(ctx, p.x, p.y, r, r * 0.8, open ? '#9d84c4' : '#c3b8ce', n.x * 100,
           { stroke: 'rgba(60,44,30,.6)', lw: 2 });
      blob(ctx, p.x, p.y - r * 0.35, r * 0.9, r * 0.42, open ? '#8fc98a' : '#cfd6c8', n.x * 130);

      // everyone you have met so far stands on the chapter where you met them
      const folks = (n.chars ?? []).filter(id => save.data.metCharacters.includes(id));
      folks.forEach((id, i) => {
        const off = (i - (folks.length - 1) / 2) * 30;
        paintCharacter(ctx, id, 'idle', p.x - 15 + off, p.y - r - 30, 30, 33, t, 1);
      });

      ctx.globalAlpha = open ? 0.95 : 0.35;
      ctx.fillStyle = '#3d2f22';
      ctx.font = `${n.small ? 13 : 16}px "Bradley Hand", "Segoe Print", cursive`;
      ctx.fillText(open ? n.name : '? ? ?', p.x, p.y + r + 20);
      ctx.globalAlpha = 1;
    }
    ctx.restore(); // node label text state

    ctx.restore(); // clip
    ctx.fillStyle = '#f6ecd8';
    ctx.font = '15px "Bradley Hand", cursive';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.75;
    const sel = this.selected;
    ctx.fillText(sel && sel.open
      ? `${KEYS.choose}  choose      ${KEYS.go} — travel to ${sel.label}      ${KEYS.map} — back`
      : `${KEYS.go} — continue the journey     ${KEYS.map} — back`, w / 2, h - pad * 0.35);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
