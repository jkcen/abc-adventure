// Input — keyboard + touch, normalized to an intent object.
// Buffers jump presses so children's slightly-early taps still register.

const JUMP_BUFFER = 0.14; // seconds

// Phones and tablets get on-screen pads, so prompts name those, not keys.
export const IS_TOUCH = matchMedia('(pointer: coarse)').matches;

// What to call each action in on-screen prompts, for the current device.
export const KEYS = IS_TOUCH
  ? { choose: '◀ ▶', go: 'tap', map: 'map', sound: '♪' }
  : { choose: '← →', go: 'space', map: 'm', sound: 'n' };

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
    this.soundPressed = false;

    addEventListener('keydown', (e) => this._key(e, true));
    addEventListener('keyup', (e) => this._key(e, false));
    // A key released while the window is in the background never sends its
    // keyup here — without this she'd keep running after an alt-tab.
    addEventListener('blur', () => this.release());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.release(); });
    this._bindTouch();
  }

  _key(e, down) {
    const k = e.key;
    // A held key repeats its keydown. Only the first one is a press: repeats
    // would re-buffer jumps (bouncing on every landing while gliding) and
    // race through dialogue.
    const fresh = down && !e.repeat;
    let handled = true;
    switch (k) {
      case 'ArrowLeft': case 'a': case 'A':
        this.left = down; if (fresh) this.leftPressed = true; break;
      case 'ArrowRight': case 'd': case 'D':
        this.right = down; if (fresh) this.rightPressed = true; break;
      // Up jumps, but never picks a menu item — "up" is not "yes".
      case 'ArrowUp': case 'w': case 'W': this.up = down; this._jump(down, fresh, false); break;
      case 'ArrowDown': case 's': case 'S': this.down = down; break;
      case ' ': case 'Spacebar': this._jump(down, fresh, true); break;
      case 'Enter': if (fresh) this.confirmPressed = true; break;
      case 'm': case 'M': if (fresh) this.mapPressed = true; break;
      case 'n': case 'N': if (fresh) this.soundPressed = true; break;
      case 'Escape': if (fresh) this.backPressed = true; break;
      default: handled = false;
    }
    if (fresh) this.anyKeyPressed = true;
    if (handled) e.preventDefault();
  }

  _jump(down, fresh, confirms) {
    this.jumpHeld = down;
    if (fresh) {
      this._jumpBufferedAt = this._time;
      if (confirms) this.confirmPressed = true;
    }
  }

  // Let go of everything that is held.
  release() {
    this.left = this.right = this.up = this.down = this.jumpHeld = false;
  }

  _bindTouch() {
    const wrap = document.getElementById('touch');
    if (!wrap) return;
    if (IS_TOUCH) {
      wrap.classList.add('on');
      document.getElementById('touchTop')?.classList.add('on');
    }
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
    hold('jumpPad', () => this._jump(true, true, true), () => this._jump(false, false, true));
    hold('mapBtn', () => { this.mapPressed = true; }, () => {});
    hold('soundBtn', () => { this.soundPressed = true; }, () => {});
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
  consumeSound() { const v = this.soundPressed; this.soundPressed = false; return v; }
  consumeAnyKey() { const v = this.anyKeyPressed; this.anyKeyPressed = false; return v; }

  update(dt) { this._time += dt; }
}
