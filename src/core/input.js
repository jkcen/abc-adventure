// Input — keyboard + touch, normalized to an intent object.
// Buffers jump presses so children's slightly-early taps still register.

const JUMP_BUFFER = 0.14; // seconds

export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.jumpHeld = false;
    this._jumpBufferedAt = -99;
    this._time = 0;
    this.anyKeyPressed = false;
    this.confirmPressed = false;
    this.mapPressed = false;
    this.leftPressed = false;    // edge-triggered, for menus and the map
    this.rightPressed = false;
    this.backPressed = false;

    addEventListener('keydown', (e) => this._key(e, true));
    addEventListener('keyup', (e) => this._key(e, false));
    this._bindTouch();
  }

  _key(e, down) {
    const k = e.key;
    let handled = true;
    switch (k) {
      case 'ArrowLeft': case 'a': case 'A':
        this.left = down; if (down) this.leftPressed = true; break;
      case 'ArrowRight': case 'd': case 'D':
        this.right = down; if (down) this.rightPressed = true; break;
      case 'ArrowUp': case 'w': case 'W': this.up = down; this._jump(down); break;
      case 'ArrowDown': case 's': case 'S': this.down = down; break;
      case ' ': case 'Spacebar': this._jump(down); break;
      case 'Enter': if (down) this.confirmPressed = true; break;
      case 'm': case 'M': if (down) this.mapPressed = true; break;
      case 'Escape': if (down) this.backPressed = true; break;
      default: handled = false;
    }
    if (down) this.anyKeyPressed = true;
    if (handled) e.preventDefault();
  }

  _jump(down) {
    this.jumpHeld = down;
    if (down) {
      this._jumpBufferedAt = this._time;
      this.confirmPressed = true;
    }
  }

  _bindTouch() {
    const wrap = document.getElementById('touch');
    if (!wrap) return;
    if (matchMedia('(pointer: coarse)').matches) wrap.classList.add('on');
    const hold = (id, on, off) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => { e.preventDefault(); on(); };
      const end = (e) => { e.preventDefault(); off(); };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', start);
      addEventListener('mouseup', end);
    };
    hold('leftPad', () => { this.left = true; this.leftPressed = true; }, () => (this.left = false));
    hold('rightPad', () => { this.right = true; this.rightPressed = true; }, () => (this.right = false));
    hold('jumpPad', () => this._jump(true), () => this._jump(false));
  }

  // Consume a buffered jump. Returns true at most once per press.
  consumeJump() {
    if (this._time - this._jumpBufferedAt <= JUMP_BUFFER) {
      this._jumpBufferedAt = -99;
      return true;
    }
    return false;
  }

  consumeConfirm() { const v = this.confirmPressed; this.confirmPressed = false; return v; }
  // Drop every buffered edge. Scene changes call this so a key you were
  // holding during a cutscene doesn't immediately move a menu cursor.
  flush() {
    this.leftPressed = this.rightPressed = false;
    this.confirmPressed = this.mapPressed = this.backPressed = false;
    this.anyKeyPressed = false;
    this._jumpBufferedAt = -99;
  }

  consumeLeft() { const v = this.leftPressed; this.leftPressed = false; return v; }
  consumeRight() { const v = this.rightPressed; this.rightPressed = false; return v; }
  consumeBack() { const v = this.backPressed; this.backPressed = false; return v; }
  consumeMap() { const v = this.mapPressed; this.mapPressed = false; return v; }
  consumeAnyKey() { const v = this.anyKeyPressed; this.anyKeyPressed = false; return v; }

  update(dt) { this._time += dt; }
}
