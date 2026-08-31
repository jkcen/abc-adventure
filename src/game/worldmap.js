// World map — an illustrated page from inside this world, not a dashboard.
// Shows the real journey: A's Island → the fork → B's Island → the road ahead.
// Locked places are drawn faintly, the way an unfinished drawing looks.

import { blob, stroke, blobPath, washBlob } from '../render/brush.js';
import { paintCharacter } from '../render/characters.js';
import { hash } from '../core/rng.js';
import { save } from '../core/save.js';

// Positions are fractions of the map card, so it scales with the window.
const NODES = [
  { id: 'a-island',  name: 'A’s Island',    x: 0.09, y: 0.62, char: 'A' },
  { id: 'level-1-upper', name: 'Upper Path', x: 0.21, y: 0.34, small: true },
  { id: 'level-1-lower', name: 'Lower Path', x: 0.21, y: 0.82, small: true },
  { id: 'b-island',  name: 'B’s Island',    x: 0.34, y: 0.55, char: 'B' },
  { id: 'level-2',   name: 'Sunset Islands', x: 0.47, y: 0.35 },
  { id: 'valley',    name: 'Mountain Valley', x: 0.58, y: 0.62 },
  { id: 'forest',    name: 'The Forest',    x: 0.69, y: 0.44 },
  { id: 'owl',       name: 'Owl’s Woods',   x: 0.79, y: 0.70, char: 'owl' },
  { id: 'c-island',  name: 'C’s Island',    x: 0.91, y: 0.40, char: 'C' },
];

const EDGES = [
  ['a-island', 'level-1-upper'], ['a-island', 'level-1-lower'],
  ['level-1-upper', 'b-island'], ['level-1-lower', 'b-island'],
  ['b-island', 'level-2'], ['level-2', 'valley'], ['valley', 'forest'],
  ['forest', 'owl'], ['owl', 'c-island'],
];

export class WorldMap {
  constructor() { this.t = 0; this.current = 'a-island'; }

  unlocked(id) {
    if (id === 'a-island') return true;
    if (save.data.visited.includes(id)) return true;
    // Route nodes use the level-scoped ids the level writes.
    if (id === 'level-1-upper') return save.data.visited.includes('level-1-upper');
    if (id === 'level-1-lower') return save.data.visited.includes('level-1-lower');
    return false;
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
    washBlob(ctx, cx + cw * 0.2, cy + ch * 0.6, cw * 0.22, ch * 0.3, '#c9bde4', 3);
    washBlob(ctx, cx + cw * 0.5, cy + ch * 0.45, cw * 0.2, ch * 0.28, '#f2c193', 9);
    washBlob(ctx, cx + cw * 0.72, cy + ch * 0.55, cw * 0.18, ch * 0.3, '#a9cf9c', 12);
    washBlob(ctx, cx + cw * 0.9, cy + ch * 0.42, cw * 0.12, ch * 0.22, '#bfe3f2', 15);
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
      const r = n.small ? 13 : 20;

      ctx.globalAlpha = open ? 1 : 0.3;
      if (here) {
        ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.15;
        blob(ctx, p.x, p.y, r + 16, r + 13, '#ffdf9a', 21);
        ctx.globalAlpha = 1;
      }
      blob(ctx, p.x, p.y + 4, r * 1.05, r * 0.55, 'rgba(90,70,50,.25)', 7); // cast shadow
      blob(ctx, p.x, p.y, r, r * 0.8, open ? '#9d84c4' : '#c3b8ce', n.x * 100,
           { stroke: 'rgba(60,44,30,.6)', lw: 2 });
      blob(ctx, p.x, p.y - r * 0.35, r * 0.9, r * 0.42, open ? '#8fc98a' : '#cfd6c8', n.x * 130);

      // a discovered character stands on their own island
      if (n.char && save.data.metCharacters.includes(n.char)) {
        paintCharacter(ctx, n.char, 'idle', p.x - 15, p.y - r - 30, 30, 33, t, 1);
      }

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
    ctx.fillText('space — continue the journey     m — close map', w / 2, h - pad * 0.35);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
