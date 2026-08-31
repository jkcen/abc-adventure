// Asset registry — every drawable is looked up by key.
// Until a real PNG is registered, the key falls back to its procedural painter,
// so dropping in Katherine's art later never requires touching level or game code.

export class AssetRegistry {
  constructor() {
    this.images = new Map();   // key -> HTMLImageElement (loaded)
    this.painters = new Map(); // key -> (ctx, w, h, t) => void
    this.pending = 0;
  }

  // Register a procedural fallback painter.
  paint(key, fn) { this.painters.set(key, fn); return this; }

  // Register a real image. Silently keeps the painter if the file is missing,
  // so a half-populated /assets folder still runs.
  //
  // opts.fit === 'contain' preserves the artwork's aspect ratio inside the box
  // instead of stretching it — hand-drawn sprites are never the same shape as
  // the collision box. opts.scale grows the drawing past the box (wings spread
  // wider than a body), and opts.anchor 'bottom' keeps the feet on the floor.
  image(key, src, opts = null) {
    this.pending++;
    const img = new Image();
    if (opts) img.fitOpts = opts;
    img.onload = () => { this.images.set(key, img); this.pending--; };
    img.onerror = () => { console.warn(`[assets] missing ${src}, using painter for "${key}"`); this.pending--; };
    img.src = src;
    return this;
  }

  has(key) { return this.images.has(key) || this.painters.has(key); }

  // Draw asset `key` into a w*h box whose top-left is the current origin.
  draw(ctx, key, w, h, t = 0) {
    const img = this.images.get(key);
    if (img) { this._drawImage(ctx, img, w, h); return true; }
    const fn = this.painters.get(key);
    if (fn) { fn(ctx, w, h, t); return true; }
    return false;
  }

  _drawImage(ctx, img, w, h) {
    const o = img.fitOpts;
    if (!o || o.fit !== 'contain') { ctx.drawImage(img, 0, 0, w, h); return; }
    const scale = o.scale || 1;
    const k = Math.min((w * scale) / img.width, (h * scale) / img.height);
    const dw = img.width * k, dh = img.height * k;
    const dx = (w - dw) / 2;
    const dy = o.anchor === 'bottom' ? h - dh : (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  get ready() { return this.pending === 0; }
}

export const assets = new AssetRegistry();
