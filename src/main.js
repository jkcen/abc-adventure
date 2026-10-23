// Entry point + scene manager.
// Scenes: title → chapter → map → next chapter. Chapters are pure data,
// so adding Level 3 means one more starter below.

import { Input, KEYS, IS_TOUCH } from './core/input.js';
import { Camera } from './core/camera.js';
import { assets } from './core/assets.js';
import { audio } from './core/audio.js';
import { save } from './core/save.js';
import { charName } from './core/names.js';
import { registerCharacterArt } from './render/characters.js';
import { LEVEL_1 } from './levels/level-1.js';
import { LEVEL_2 } from './levels/level-2.js';
import { LEVEL_3 } from './levels/level-3.js';
import { Level } from './game/level.js';
import { WorldMap } from './game/worldmap.js';
import { Ending } from './game/ending.js';
import { blob } from './render/brush.js';

const DESIGN_H = 640;          // logical height; width follows the aspect ratio

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const hintEl = document.getElementById('hint');
const soundBtn = document.getElementById('soundBtn');

const input = new Input();
const camera = new Camera(1000, DESIGN_H);
const map = new WorldMap();

registerCharacterArt();

// ---- Real artwork goes here. -----------------------------------------------
// Wild, Stuffy and Peter already run on Katherine's drawn sheet — registerCharacterArt()
// wires assets/characters/<id>/{side,front,back,fly}.png over the painters.
// Everything else still falls back to procedural art; each line below overrides
// one more painter with a PNG, and nothing else in the game needs to change.
//
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

// The chapters that exist, in journey order. Each one is a map destination.
const CHAPTERS = [
  { node: 'level-1', cfg: LEVEL_1, label: LEVEL_1.title, arriveAt: 'level-2', requires: null },
  { node: 'level-2', cfg: LEVEL_2, label: LEVEL_2.title, arriveAt: 'level-3', requires: 'level-1' },
  { node: 'level-3', cfg: LEVEL_3, label: LEVEL_3.title, arriveAt: 'c-island', requires: 'level-2' },
];

const chapterOpen = (c) => !c.requires || save.data.completed.includes(c.requires);
const chapterFor = (id) => CHAPTERS.find(c => c.cfg.id === id);

// The map cursor starts where the save file left the journey, not at the top.
map.current = (CHAPTERS.find(c => c.cfg.id === save.data.level) ?? CHAPTERS[0]).node;

function startChapter(c, opts = {}) {
  input.flush();
  level = new Level(c.cfg, camera, hintEl, opts);
  level.onComplete = () => {
    map.current = c.arriveAt;
    // The last chapter doesn't hand you back to the map — it ends the story.
    const last = c === CHAPTERS[CHAPTERS.length - 1];
    fadeTo(() => { last ? showEnding() : openMap('level'); });
  };
  map.current = c.node;
  scene = 'level';
}

// Where "continue" goes: the chapter in progress, else the first unfinished one.
function nextChapter() {
  const inProgress = chapterFor(save.data.level);
  if (inProgress && chapterOpen(inProgress) && !save.data.completed.includes(inProgress.cfg.id)) {
    return inProgress;
  }
  return CHAPTERS.find(c => chapterOpen(c) && !save.data.completed.includes(c.cfg.id))
      ?? CHAPTERS.filter(chapterOpen).pop() ?? null;
}

// Is there anything to come back to?
function hasProgress() {
  return save.data.completed.length > 0 || Object.keys(save.data.checkpoints).length > 0;
}

// One line on the title screen, so the save file is visible rather than implied.
function progressLine() {
  const c = chapterFor(save.data.level) ?? CHAPTERS[0];
  const done = save.data.completed.includes(c.cfg.id);
  const where = done ? 'finished' : (save.checkpointIn(c.cfg.id) ? 'partway through' : 'just begun');
  const friends = save.data.metCharacters.filter(id => id !== 'A').length;
  return `last time — ${c.label}, ${where}` +
         (friends ? `   ·   ${friends} friend${friends > 1 ? 's' : ''} found` : '');
}

// ------------------------------------------------------------------- map ---
let mapFrom = 'title';
let ending = null;
const titleArt = new Ending();   // the home page painting (no words of its own)

function openMap(from) {
  mapFrom = from;
  level?.hideHint();
  input.flush();          // a key held while the chapter ended must not move the cursor
  map.setChapters(
    CHAPTERS.map(c => ({ node: c.node, label: c.label, open: chapterOpen(c) })),
    (nextChapter() ?? CHAPTERS[0]).node);
  scene = 'map';
}

function showEnding() {
  input.flush();
  level?.hideHint();
  ending = new Ending();
  scene = 'ending';
}

const storyFinished = () => save.data.completed.includes(CHAPTERS[CHAPTERS.length - 1].cfg.id);

// ------------------------------------------------------------ title menu ---
let menu = { items: [], i: 0 };

function buildMenu() {
  const items = [];
  if (hasProgress()) items.push({ id: 'continue', label: 'continue' });
  // Starting over wipes the save, so with progress it takes a second press.
  items.push({ id: 'new', label: hasProgress() ? 'start over' : 'begin', confirm: hasProgress() });
  items.push({ id: 'map', label: 'world map' });
  if (storyFinished()) items.push({ id: 'ending', label: 'the ending' });
  menu = { items, i: 0, armed: null };
}

function menuLabel(it) {
  return menu.armed === it.id ? 'sure? press again' : it.label;
}

function chooseMenu(it) {
  const id = it.id;
  if (it.confirm && menu.armed !== id) { menu.armed = id; return; }
  menu.armed = null;
  if (id === 'map') { openMap('title'); return; }
  if (id === 'ending') { fadeTo(showEnding); return; }
  if (id === 'new') {
    save.reset();
    fadeTo(() => startChapter(CHAPTERS[0]));
    return;
  }
  fadeTo(() => startChapter(nextChapter() ?? CHAPTERS[0], { resume: true }));
}

function update(dt) {
  input.update(dt);
  if (input.consumeSound()) {
    audio.toggleMute();
    soundBtn?.classList.toggle('off', audio.muted);
  }

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
      if (!menu.items.length) buildMenu();
      if (input.consumeLeft())  { menu.armed = null; menu.i = (menu.i - 1 + menu.items.length) % menu.items.length; }
      if (input.consumeRight()) { menu.armed = null; menu.i = (menu.i + 1) % menu.items.length; }
      if (input.consumeMap())   { menu.armed = null; openMap('title'); }
      else if (input.consumeConfirm()) chooseMenu(menu.items[menu.i]);
      input.consumeAnyKey();
      break;

    case 'level':
      level.update(dt, input);
      // The map is always one key away, mid-level and all.
      if (input.consumeMap() || input.consumeBack()) {
        map.current = level.cfg.mapLocation ?? 'level-1';
        openMap('level');
      }
      break;

    case 'ending':
      ending.update(dt, input);
      if (ending.done) fadeTo(() => {
        ending = null;
        scene = 'title'; titleT = 0; buildMenu(); input.flush();
      });
      break;

    case 'map':
      map.update(dt);
      if (input.consumeLeft())  map.move(-1);
      if (input.consumeRight()) map.move(1);

      // m / esc — back where you came from, without losing your place.
      if (input.consumeMap() || input.consumeBack()) {
        if (mapFrom === 'level' && level && level.phase !== 'done') scene = 'level';
        else { scene = 'title'; titleT = 0; buildMenu(); input.flush(); }
        break;
      }

      // space — travel to the chapter under the cursor.
      if (input.consumeConfirm()) {
        const pick = map.selected;
        const c = (pick && pick.open ? CHAPTERS.find(k => k.node === pick.node) : null) ?? nextChapter();
        if (!c) { scene = 'title'; titleT = 0; buildMenu(); break; }
        if (level && level.cfg.id === c.cfg.id && level.phase !== 'done') { scene = 'level'; break; }
        // every chapter keeps its own checkpoint, so travelling always resumes
        fadeTo(() => startChapter(c, { resume: true }));
      }
      break;
  }
}

let shownScene = null;
function draw() {
  const w = camera.viewW, h = camera.viewH;
  // lets the page style itself per scene (the touch pads' labels)
  if (scene !== shownScene) document.body.dataset.scene = shownScene = scene;
  ctx.clearRect(0, 0, w, h);

  if (scene === 'title') {
    // The home page is the ending painting: all three of them flying home
    // over the sunset, with the menu written across it.
    titleArt.paint(ctx, w, h, titleT + 14);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(60,20,10,.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fff6e2';
    // the title follows the name table, so renaming a bird renames the game
    const title = `${charName('A')}, ${charName('B')} & ${charName('C')}’s Adventure`;
    fitFont(ctx, title, h * 0.085, '"Bradley Hand", "Segoe Print", cursive', w * 0.92);
    ctx.fillText(title, w / 2, h * 0.22);
    ctx.font = `${Math.round(h * 0.032)}px "Bradley Hand", cursive`;
    ctx.globalAlpha = 0.75;
    ctx.fillText('a game by Katherine', w / 2, h * 0.29);

    // --- the save file, said out loud ---
    if (hasProgress()) {
      ctx.globalAlpha = 0.6;
      const line = progressLine();
      fitFont(ctx, line, h * 0.028, '"Bradley Hand", cursive', w * 0.92);
      ctx.fillText(line, w / 2, h * 0.74);
    }

    // --- menu: continue / start over / world map ---
    if (!menu.items.length) buildMenu();
    const labels = menu.items.map(menuLabel);
    const fs = fitFont(ctx, labels.join('      '), h * 0.042, '"Bradley Hand", cursive', w * 0.92);
    const gap = fs * 1.4;
    const widths = labels.map(l => ctx.measureText(l).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (menu.items.length - 1);
    let mx = w / 2 - total / 2;
    const my = h * 0.83;
    menu.items.forEach((it, i) => {
      const on = i === menu.i;
      ctx.globalAlpha = on ? 1 : 0.45;
      ctx.textAlign = 'left';
      if (on) {
        // a hand-drawn underline that breathes, so the choice is unmissable
        blob(ctx, mx + widths[i] / 2, my + fs * 0.42,
             widths[i] / 2 + 8, 4 + Math.sin(titleT * 4) * 1.2, '#ffe28a', 3);
      }
      ctx.fillStyle = '#fff6e2';
      ctx.fillText(labels[i], mx, my);
      mx += widths[i] + gap;
    });
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.45 + Math.sin(titleT * 3) * 0.15;
    const keys = `${KEYS.choose}  choose      ${KEYS.go}  go      ${KEYS.map}  world map      ${KEYS.sound}  sound`;
    fitFont(ctx, keys, h * 0.026, '"Bradley Hand", cursive', w * 0.92);
    ctx.fillText(keys, w / 2, h * 0.92);
    ctx.globalAlpha = 1;
    ctx.restore();
  } else if (scene === 'level') {
    level.draw(ctx);
  } else if (scene === 'ending') {
    ending.draw(ctx, w, h);
  } else if (scene === 'map') {
    map.draw(ctx, w, h);
  }

  if (fade.a > 0) {
    ctx.fillStyle = `rgba(24,18,34,${fade.a})`;
    ctx.fillRect(0, 0, w, h);
  }

  // say so when the sound is off, so silence never looks like a bug
  // (touch devices show it on the ♪ button instead)
  if (audio.muted && !IS_TOUCH) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#fff6e2';
    ctx.font = '16px "Bradley Hand", cursive';
    ctx.textAlign = 'right';
    ctx.fillText(`sound off — ${KEYS.sound}`, w - 20, 30);
    ctx.restore();
  }
}

// Set ctx.font at `px`, shrunk if needed so `text` fits in `maxW`. Returns
// the size used. Narrow windows would otherwise cut the title off.
function fitFont(ctx, text, px, family, maxW) {
  let size = Math.round(px);
  ctx.font = `${size}px ${family}`;
  const tw = ctx.measureText(text).width;
  if (tw > maxW) {
    size = Math.max(10, Math.floor(size * maxW / tw));
    ctx.font = `${size}px ${family}`;
  }
  return size;
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

// Audio may only start inside a real gesture, so unlock from the events
// themselves rather than from the game loop. Every gesture, not just the
// first: a suspended context needs resuming again later.
for (const ev of ['keydown', 'pointerdown', 'touchend']) addEventListener(ev, () => audio.unlock());
soundBtn?.classList.toggle('off', audio.muted);
