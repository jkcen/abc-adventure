// Audio — procedural WebAudio so the game is never silent before real assets
// arrive. Drop files into /assets/audio and register them here to override.
// Music is a slow generative motif whose scale/tempo changes per chapter.

const MUTE_KEY = 'abc-adventure-muted';
const VOLUME = 0.28;

const SCALES = {
  'level-1': [0, 2, 4, 7, 9, 12, 14],       // curious / magical (major pentatonic-ish)
  'level-2': [0, 2, 5, 7, 9, 12],           // warm / adventurous
  'level-3': [0, 2, 4, 7, 11, 12],           // golden / hopeful — the sunset climb
  'level-4': [0, 3, 5, 7, 10, 12],          // the forest — quiet, a little wary
  'forest':  [0, 3, 5, 7, 10, 12],          // quiet / mysterious
  'owl':     [0, 1, 5, 6, 8, 11],           // suspenseful
  'c-island':[0, 4, 7, 9, 11, 12],          // peaceful / emotional
};

export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.mood = 'level-1';
    this._next = 0;
    this._step = 0;
    // Its own key, not the save file: "start over" must not turn the sound back on.
    try { this.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { this.muted = false; }
  }

  // Browsers require a gesture before audio starts, and Safari only counts
  // one if this runs inside the event handler itself. A context made too
  // early starts suspended, so later gestures resume it.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : VOLUME;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);

      this._startAmbience();
    } catch { this.enabled = false; }
  }

  setMood(m) { if (SCALES[m]) this.mood = m; }
  setMasterVolume(v) { if (this.master) this.master.gain.value = v; }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : VOLUME;
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* play on */ }
  }

  // Filtered noise = wind. One long-lived node, modulated over time.
  _startAmbience() {
    const c = this.ctx;
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;

    const filt = c.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 460; filt.Q.value = 0.6;

    this.windGain = c.createGain();
    this.windGain.gain.value = 0.08;

    src.connect(filt); filt.connect(this.windGain); this.windGain.connect(this.master);
    src.start();

    // slow LFO so the wind breathes
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = c.createGain(); lfoGain.gain.value = 0.045;
    lfo.connect(lfoGain); lfoGain.connect(this.windGain.gain);
    lfo.start();
    this.wind = filt;
  }

  setWind(amount) {
    if (this.windGain) this.windGain.gain.value = 0.05 + amount * 0.16;
  }

  _tone(freq, dur, type = 'sine', vol = 0.2, dest = null) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(); o.stop(c.currentTime + dur + 0.05);
    return o;
  }

  // --- sfx ---
  jump()      { this._tone(520, 0.16, 'triangle', 0.16); }
  land()      { this._tone(150, 0.13, 'sine', 0.2); }
  flap()      { this._tone(240, 0.09, 'sine', 0.08); }
  hurt()      { this._tone(200, 0.26, 'sawtooth', 0.13); this._tone(140, 0.3, 'sine', 0.1); }
  checkpoint(){ [660, 880].forEach((f, i) => setTimeout(() => this._tone(f, 0.3, 'sine', 0.14), i * 110)); }
  discover()  { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.5, 'sine', 0.13), i * 130)); }
  rockHit()   { this._tone(90, 0.22, 'square', 0.1); }
  fire()      { this._tone(320, 0.12, 'sawtooth', 0.05); }

  // Generative motif — a note every so often, drifting through the mood scale.
  updateMusic(dt, t) {
    if (!this.ctx || !this.enabled) return;
    if (t < this._next) return;
    const scale = SCALES[this.mood] || SCALES['level-1'];
    const deg = scale[Math.floor(Math.random() * scale.length)];
    const oct = Math.random() < 0.3 ? 12 : 0;
    const freq = 261.6 * Math.pow(2, (deg + oct) / 12);
    this._tone(freq, 1.6, 'sine', 0.075, this.musicGain);
    if (this._step % 4 === 0) this._tone(freq / 2, 2.4, 'triangle', 0.05, this.musicGain);
    this._step++;
    this._next = t + 0.72 + Math.random() * 0.7;
  }
}

export const audio = new Audio();
