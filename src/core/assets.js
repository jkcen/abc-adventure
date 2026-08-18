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
  image(key, src) {
    this.pending++;
    const img = new Image();
    img.onload = () => { this.images.set(key, img); this.pending--; };
    img.onerror = () => { console.warn(`[assets] missing ${src}, using painter for "${key}"`); this.pending--; };
    img.src = src;
    return this;
  }

  has(key) { return this.images.has(key) || this.painters.has(key); }

  // Draw asset `key` into a w*h box whose top-left is the current origin.
  draw(ctx, key, w, h, t = 0) {
    const img = this.images.get(key);
    if (img) { ctx.drawImage(img, 0, 0, w, h); return true; }
    const fn = this.painters.get(key);
    if (fn) { fn(ctx, w, h, t); return true; }
    return false;
  }

  get ready() { return this.pending === 0; }
}

export const assets = new AssetRegistry();
