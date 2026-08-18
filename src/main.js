// Entry point + scene manager.
// Scenes: title → level-1 → map. Level 2 slots in at the marked TODO.

import { Input } from './core/input.js';
import { Camera } from './core/camera.js';
import { assets } from './core/assets.js';
import { audio } from './core/audio.js';
import { save } from './core/save.js';
import { registerCharacterArt, paintCharacter } from './render/characters.js';
import { drawSky, drawBackground, drawMidground, drawForeground } from './render/parallax.js';
import { THEMES } from './levels/theme.js';
import { LEVEL_1 } from './levels/level-1.js';
import { Level } from './game/level.js';
import { WorldMap } from './game/worldmap.js';
import { blob } from './render/brush.js';

const DESIGN_H = 640;          // logical height; width follows the aspect ratio

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');

const input = new Input();
const camera = new Camera(1000, DESIGN_H);
const map = new WorldMap();

registerCharacterArt();

// ---- Real artwork goes here. -----------------------------------------------
// Each line overrides one procedural painter with Katherine's PNG. Nothing
// else in the game needs to change when these are filled in.
//
//   assets.image('char/A/idle', './assets/characters/A/idle.png');
//   assets.image('char/B/walk', './assets/characters/B/walk.png');
//   assets.image('obstacle/fire-ring', './assets/obstacles/fire-ring/ring.png');
// ----------------------------------------------------------------------------

let scale = 1;
function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  scale = h / DESIGN_H;
  camera.resize(w / scale, DESIGN_H);
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
}
addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ scenes ---
let scene = 'title';
let level = null;
let titleT = 0;
let fade = { a: 0, dir: 0, then: null };

function fadeTo(fn) { fade = { a: 0, dir: 1, then: fn }; }

function startLevel1() {
  level = new Level(LEVEL_1, camera, hintEl);
  level.onComplete = () => {
    map.current = 'b-island';
    fadeTo(() => { scene = 'map'; });
  };
  scene = 'level';
}

function update(dt) {
  input.update(dt);

  if (fade.dir === 1) {
    fade.a = Math.min(1, fade.a + dt * 1.8);
    if (fade.a >= 1) { fade.then?.(); fade = { a: 1, dir: -1, then: null }; }
    return;
  }
  if (fade.dir === -1) {
    fade.a = Math.max(0, fade.a - dt * 1.6);
    if (fade.a <= 0) fade.dir = 0;
  }

  switch (scene) {
    case 'title':
      titleT += dt;
      camera.x += dt * 22;   // slow drift so the title screen isn't a still image
      if (input.consumeAnyKey() || input.consumeConfirm()) {
        audio.unlock();
        fadeTo(startLevel1);
      }
      break;

    case 'level':
      level.update(dt, input);
      if (input.consumeMap()) { map.current = 'a-island'; scene = 'map'; }
      break;

    case 'map':
      map.update(dt);
      if (input.consumeConfirm() || input.consumeMap()) {
        // TODO(Level 2): when 'level-2' is built, route here based on
        // save.data.completed and load the next config.
        scene = level && level.phase !== 'done' ? 'level' : 'title';
        if (scene === 'title') titleT = 0;
      }
      break;
  }
}

function draw() {
  const w = camera.viewW, h = camera.viewH;
  ctx.clearRect(0, 0, w, h);

  if (scene === 'title') {
    const th = THEMES['level-1'];
    drawSky(ctx, camera, th);
    drawBackground(ctx, camera, th, titleT);
    drawMidground(ctx, camera, th, titleT);

    // A alone on a small island — the game's first image is its whole premise
    const bx = w * 0.5, by = h * 0.62;
    ctx.save();
    blob(ctx, bx, by + 44, 116, 26, th.grass, 3, { stroke: th.ink, lw: 2.4 });
    blob(ctx, bx, by + 74, 74, 40, th.rock, 4, { stroke: th.ink, lw: 2.4 });
    paintCharacter(ctx, 'A', 'idle', bx - 26, by - 10, 52, 56, titleT, 1);
    ctx.restore();

    drawForeground(ctx, camera, th, titleT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#3b2c50';
    ctx.font = `${Math.round(h * 0.085)}px "Bradley Hand", "Segoe Print", cursive`;
    ctx.fillText('A, B & C’s Adventure', w / 2, h * 0.22);
    ctx.font = `${Math.round(h * 0.032)}px "Bradley Hand", cursive`;
    ctx.globalAlpha = 0.75;
    ctx.fillText('a game by Katherine', w / 2, h * 0.29);
    ctx.globalAlpha = 0.5 + Math.sin(titleT * 3) * 0.3;
    ctx.fillText('press space to begin', w / 2, h * 0.87);
    ctx.globalAlpha = 1;
  } else if (scene === 'level') {
    level.draw(ctx);
  } else if (scene === 'map') {
    map.draw(ctx, w, h);
  }

  if (fade.a > 0) {
    ctx.fillStyle = `rgba(24,18,34,${fade.a})`;
    ctx.fillRect(0, 0, w, h);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);  // clamp so tab-switches don't teleport anyone
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener('pointerdown', () => audio.unlock(), { once: true });
