// LEVEL 1 — Wild's Journey.
// Wild starts alone on her island and travels the floating-island world to reach
// Stuffy's Island. Partway across, the world forks: an UPPER aerial timing route
// and a LOWER exploratory route. Both physically exist in the level — the
// player discovers the fork by walking into it — and both rejoin before Stuffy.
//
// Layout is pure data. Geometry keys:
//   ground : solid island the player stands on (also painted as a floating isle)
//   deco   : painted only, no collision
//   obstacle/trigger/checkpoint as named.

export const LEVEL_1 = {
  id: 'level-1',
  title: "Wild's Journey",
  subtitle: 'to Stuffy’s Island',
  theme: 'level-1',
  mood: 'level-1',
  mapLocation: 'level-1',
  player: { id: 'A', x: 140, y: 470 },
  bounds: { minX: -260, maxX: 4900, minY: -420, maxY: 1240 },
  fallY: 1180,            // below this, respawn at the last checkpoint
  cloudSeaY: 1000,

  ground: [
    // ---- Wild's island (intro: walk, then the first small jump) -------------
    { x: -260, y: 520, w: 900, h: 320, seed: 1 },
    { x: 740,  y: 545, w: 190, h: 190, seed: 2 },
    { x: 1030, y: 505, w: 210, h: 220, seed: 3 },

    // ---- the fork island -------------------------------------------------
    { x: 1310, y: 470, w: 300, h: 260, seed: 4 },

    // ---- UPPER ROUTE: aerial, timing-focused -----------------------------
    { x: 1690, y: 396, w: 150, h: 130, seed: 10 },
    { x: 2140, y: 306, w: 200, h: 140, seed: 11 },
    { x: 2660, y: 246, w: 190, h: 150, seed: 12 },
    { x: 3060, y: 288, w: 185, h: 150, seed: 13 },
    // last upper stepping stone; it hangs above the lower route's final ledge,
    // so the junction reads as two levels of the same place
    { x: 3280, y: 372, w: 100, h: 56, seed: 14 },

    // ---- LOWER ROUTE: exploratory, obstacle-focused ----------------------
    { x: 1580, y: 790, w: 330, h: 260, seed: 20 },
    { x: 2040, y: 762, w: 130, h: 150, seed: 21 },
    { x: 2250, y: 742, w: 130, h: 150, seed: 22 },
    { x: 2400, y: 768, w: 420, h: 230, seed: 23 },   // falling-rock corridor
    // climb back up: each step is a ~74px rise with a clear gap, so the ledges
    // never overlap and trap the player against a wall
    { x: 2910, y: 700, w: 150, h: 160, seed: 24 },
    { x: 3090, y: 626, w: 140, h: 160, seed: 25 },
    { x: 3260, y: 552, w: 130, h: 160, seed: 26 },

    // ---- rejoin, then B's Island ----------------------------------------
    { x: 3430, y: 478, w: 300, h: 300, seed: 30 },
    { x: 3820, y: 470, w: 1000, h: 420, seed: 31, big: true },
  ],

  obstacles: [
    // --- UPPER: fire rings the player aims through, plus timed platforms ---
    { kind: 'platform', x: 1880, y: 372, w: 104, toX: 2040, period: 2.4, pause: 0.7 },
    { kind: 'fire', x: 2030, y: 268, r: 64, moveY: 40, speed: 0.8 },
    { kind: 'fire', x: 2420, y: 250, r: 60, moveX: 70, speed: 0.6, phase: 1.4 },
    { kind: 'platform', x: 2450, y: 330, w: 96, toY: 208, period: 2.6, pause: 0.6, phase: 1.1 },
    { kind: 'fire', x: 2930, y: 218, r: 66, moveX: 90, speed: 0.75, phase: 0.5 },
    { kind: 'platform', x: 2900, y: 330, w: 96, toX: 3020, period: 2.2, pause: 0.5, phase: 0.4 },

    // --- LOWER: the waterfall drop, the dragonfly's wind, falling rocks ----
    { kind: 'waterfall', x: 1596, y: 470, w: 96, h: 330 },       // the safe way down
    { kind: 'wind', x: 2160, y: 640, dir: 1, force: 700, gust: 3.4,
      zoneX: 1960, zoneY: 640, zoneW: 420, zoneH: 220 },
    { kind: 'platform', x: 2170, y: 700, w: 90, toY: 640, period: 2.8, pause: 0.8 },
    { kind: 'rock', x: 2500, groundY: 768, y: 420, r: 22, period: 2.8, warn: 1.0, phase: 0 },
    { kind: 'rock', x: 2620, groundY: 768, y: 400, r: 26, period: 3.2, warn: 1.0, phase: 1.5 },
    { kind: 'rock', x: 2740, groundY: 768, y: 430, r: 20, period: 2.6, warn: 0.9, phase: 0.8 },
    { kind: 'platform', x: 3010, y: 660, w: 90, toY: 560, period: 2.4, pause: 0.7, phase: 0.9 },
  ],

  // Decorative painting — waterfalls into the clouds, forests, mountains.
  deco: [
    { kind: 'waterfall', x: 300,  y: 560, w: 70,  h: 440 },
    { kind: 'waterfall', x: 4180, y: 520, w: 110, h: 470 },
    { kind: 'tree', variant: 'round', x: 60,   y: 520, scale: 1.0 },
    { kind: 'tree', variant: 'pine',  x: 200,  y: 520, scale: 0.9 },
    { kind: 'tree', variant: 'pine',  x: 470,  y: 520, scale: 1.15 },
    { kind: 'tree', variant: 'round', x: 1400, y: 470, scale: 0.85 },
    { kind: 'tree', variant: 'pine',  x: 1700, y: 790, scale: 0.8 },
    // B's Island gets a forest and mountains — it must read as a destination.
    { kind: 'mountains', x: 3860, y: 470, w: 900, h: 300, seed: 77 },
    { kind: 'tree', variant: 'pine',  x: 3960, y: 470, scale: 1.3 },
    { kind: 'tree', variant: 'round', x: 4090, y: 470, scale: 1.5 },
    { kind: 'tree', variant: 'pine',  x: 4400, y: 470, scale: 1.2 },
    { kind: 'tree', variant: 'round', x: 4560, y: 470, scale: 1.1 },
    { kind: 'tree', variant: 'pine',  x: 4700, y: 470, scale: 1.35 },
  ],

  checkpoints: [
    { id: 'start',      x: 180,  y: 520 },
    { id: 'fork',       x: 1380, y: 470 },
    { id: 'upper-mid',  x: 2200, y: 306, route: 'upper' },
    { id: 'upper-end',  x: 3120, y: 288, route: 'upper' },
    { id: 'lower-mid',  x: 2100, y: 762, route: 'lower' },
    { id: 'lower-end',  x: 3320, y: 552, route: 'lower' },
    { id: 'rejoin',     x: 3560, y: 478 },
  ],

  // Contextual, self-erasing hints — no persistent tutorial panel.
  hints: [
    { id: 'move',  x: 300,  w: 260, text: '← →  move' },
    { id: 'jump',  x: 660,  w: 240, text: 'space  jump   (hold to glide)' },
    { id: 'fork',  x: 1400, w: 300, text: 'two ways from here — up, or down past the waterfall' },
    { id: 'fire',  x: 2000, w: 260, text: 'the middle of the ring is safe' },
    { id: 'wind',  x: 2000, w: 300, text: 'the dragonfly’s wind can carry you across' },
    { id: 'rocks', x: 2480, w: 300, text: 'watch the shadow before you run' },
  ],

  // Route tracking — purely for the world map and save data.
  routeMarkers: [
    { route: 'upper', x: 1690, w: 200 },
    { route: 'lower', x: 1580, w: 200 },
  ],

  // The reward for finishing Level 1: A lands, B notices, they approach.
  arrival: {
    triggerX: 3900,
    bStandX: 4290,
    bY: 470,
  },
};
