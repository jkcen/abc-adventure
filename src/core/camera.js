// Camera — smooth follow with look-ahead, soft bounds, cinematic overrides.

export class Camera {
  constructor(viewW, viewH) {
    this.x = 0; this.y = 0;
    this.viewW = viewW; this.viewH = viewH;
    this.zoom = 1;
    this.targetZoom = 1;
    this.bounds = null;          // {minX,maxX,minY,maxY} in world units
    this.shake = 0;
    this._shakeX = 0; this._shakeY = 0;
    this.override = null;        // {x,y,zoom,ease} for story moments
    this._lookAhead = 0;
  }

  resize(w, h) { this.viewW = w; this.viewH = h; }

  snapTo(tx, ty) {
    const p = this._desired(tx, ty, 0);
    this.x = p.x; this.y = p.y;
  }

  _desired(tx, ty, facing) {
    const w = this.viewW / this.zoom, h = this.viewH / this.zoom;
    let x = tx + facing * 90 - w / 2;
    let y = ty - h * 0.55;
    if (this.bounds) {
      const b = this.bounds;
      x = Math.min(Math.max(x, b.minX), Math.max(b.minX, b.maxX - w));
      y = Math.min(Math.max(y, b.minY), Math.max(b.minY, b.maxY - h));
    }
    return { x, y };
  }

  update(dt, target) {
    // Zoom eases first so framing math uses the settled value.
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 3);

    let want;
    if (this.override) {
      want = { x: this.override.x - this.viewW / this.zoom / 2,
               y: this.override.y - this.viewH / this.zoom / 2 };
      if (this.override.zoom) this.targetZoom = this.override.zoom;
    } else {
      // Look-ahead lags behind facing so quick turns don't whip the camera.
      const facing = target.vx > 20 ? 1 : target.vx < -20 ? -1 : 0;
      this._lookAhead += (facing - this._lookAhead) * Math.min(1, dt * 2.2);
      want = this._desired(target.x, target.y, this._lookAhead);
    }

    const k = Math.min(1, dt * (this.override ? 2.2 : 4.5));
    this.x += (want.x - this.x) * k;
    this.y += (want.y - this.y) * k;

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.2);
      const m = this.shake * 10;
      this._shakeX = (Math.random() * 2 - 1) * m;
      this._shakeY = (Math.random() * 2 - 1) * m;
    } else { this._shakeX = this._shakeY = 0; }
  }

  kick(amount = 0.5) { this.shake = Math.min(1.2, this.shake + amount); }

  apply(ctx) {
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-(this.x + this._shakeX), -(this.y + this._shakeY));
  }

  get worldW() { return this.viewW / this.zoom; }
  get worldH() { return this.viewH / this.zoom; }
}
