// Particles — a small fixed pool. Feedback for landing, hits, dust, sparks.

const POOL = 260;

export class Particles {
  constructor() {
    this.items = Array.from({ length: POOL }, () => ({ life: 0 }));
    this.next = 0;
  }

  spawn(x, y, opts = {}) {
    const p = this.items[this.next];
    this.next = (this.next + 1) % POOL;
    p.x = x; p.y = y;
    p.vx = opts.vx ?? (Math.random() * 2 - 1) * 60;
    p.vy = opts.vy ?? -Math.random() * 90;
    p.g = opts.g ?? 420;
    p.life = p.max = opts.life ?? 0.6;
    p.r = opts.r ?? 3;
    p.color = opts.color ?? '#ffffff';
    p.shrink = opts.shrink ?? true;
    return p;
  }

  burst(x, y, n, opts = {}) { for (let i = 0; i < n; i++) this.spawn(x, y, opts); }

  update(dt) {
    for (const p of this.items) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx) {
    for (const p of this.items) {
      if (p.life <= 0) continue;
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.4);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.shrink ? p.r * k : p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
