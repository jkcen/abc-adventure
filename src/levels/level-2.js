// LEVEL 2 — The Floating River.
// Painted from Katherine's second drawing: a pale pink sky, a long teal river
// floating in mid-air with pale currents running through it and water dripping
// off its underside, golden seeds hanging above it, the little water cart, and
// the BOAT moored at the far end.
//
// The river is ONE PATH, and the boat is how you travel it. A steps aboard and
// steers it herself — left and right drive the boat, not her feet; it never
// moves on its own. She can jump off whenever she likes, and the water surface
// itself is solid, so falling off is never a punishment, only slower.
//
// The story turn: A is no longer alone. B travels WITH her as a companion, and
// nobody is waiting at the end — the moored boat is the destination.

export const LEVEL_2 = {
  id: 'level-2',
  title: 'The Floating River',
  subtitle: 'downstream, to the boat',
  theme: 'level-2',
  mood: 'level-2',
  mapLocation: 'level-2',
  player: { id: 'A', x: 120, y: 520 },
  companion: { id: 'B', offset: 58 },
  bounds: { minX: -260, maxX: 5320, minY: -420, maxY: 1180 },
  fallY: 1120,
  cloudSeaY: 940,

  ground: [
    // ---- leaving B's island ---------------------------------------------
    { x: -260, y: 520, w: 880, h: 320, art: 'root', seed: 1 },

    // ---- the river: one long path, the whole middle of the level ---------
    { x: 640, y: 560, w: 3800, h: 44, art: 'river', seed: 2 },

    // ---- the far shore, where the BOAT is moored -------------------------
    { x: 4460, y: 600, w: 860, h: 340, art: 'root', seed: 9 },
  ],

  obstacles: [
    // --- the boat you drive. The one thing this level is about. -----------
    // Its deck rides 40px above the water, so boarding is one clear hop.
    { kind: 'boat', x: 720, y: 520, w: 120, minX: 660, maxX: 4310,
      speed: 300, label: 'BAOT' },

    // --- bugs standing in the river. Stop, jump them, carry on. -----------
    { kind: 'bug', minX: 1180, maxX: 1420, y: 550, speed: 46 },
    { kind: 'bug', minX: 2160, maxX: 2400, y: 550, speed: 58 },
    { kind: 'bug', minX: 3080, maxX: 3300, y: 550, speed: 40 },
    { kind: 'bug', minX: 3860, maxX: 4080, y: 550, speed: 62 },

    // --- the golden seeds, hung within a jump of the deck ------------------
    { kind: 'seed', x: 560,  y: 470 },
    { kind: 'seed', x: 900,  y: 484 },
    { kind: 'seed', x: 1300, y: 466 },
    { kind: 'seed', x: 1680, y: 492 },
    { kind: 'seed', x: 2040, y: 470 },
    { kind: 'seed', x: 2420, y: 486 },
    { kind: 'seed', x: 2760, y: 462 },
    { kind: 'seed', x: 3120, y: 490 },
    { kind: 'seed', x: 3480, y: 468 },
    { kind: 'seed', x: 3820, y: 488 },
    { kind: 'seed', x: 4160, y: 470 },
    { kind: 'seed', x: 4380, y: 500 },
  ],

  deco: [
    // the little wheeled water cart, parked out in the river
    { kind: 'wheel', x: 2620, y: 560, scale: 1.0 },
    // the BOAT moored at the far shore — the end of the journey
    { kind: 'boat', x: 4980, y: 600, scale: 1.2, sails: true, label: 'BAOT' },

    { kind: 'tree', variant: 'pine',  x: 60,   y: 520, scale: 1.1 },
    { kind: 'tree', variant: 'round', x: 250,  y: 520, scale: 1.3 },
    { kind: 'tree', variant: 'pine',  x: 430,  y: 520, scale: 0.95 },
    { kind: 'tree', variant: 'round', x: 4560, y: 600, scale: 1.25 },
    { kind: 'tree', variant: 'pine',  x: 4720, y: 600, scale: 1.4 },
    { kind: 'tree', variant: 'round', x: 5180, y: 600, scale: 1.1 },
    { kind: 'mountains', x: 4520, y: 600, w: 800, h: 260, seed: 55 },
  ],

  checkpoints: [
    { id: 'shore',      x: 160,  y: 520 },
    { id: 'set-off',    x: 760,  y: 560 },
    { id: 'midstream',  x: 1900, y: 560 },
    { id: 'the-cart',   x: 2700, y: 560 },
    { id: 'downstream', x: 3600, y: 560 },
    { id: 'far-shore',  x: 4520, y: 600 },
  ],

  hints: [
    { id: 'l2-board', x: 700,  w: 320, text: 'step onto the boat' },
    { id: 'l2-steer', x: 1000, w: 340, text: '← →  steer the boat   (space to hop off)' },
    { id: 'l2-seeds', x: 1700, w: 300, text: 'jump from the deck for the golden seeds' },
    { id: 'l2-bugs',  x: 2200, w: 300, text: 'a bug in the water — jump it' },
  ],

  routeMarkers: [],

  // The ending: A and B step ashore, walk to the moored boat, and sail on.
  arrival: {
    mode: 'boat',
    triggerX: 4620,
    boardX: 4930,
    boardY: 600,
    bStandX: 4930,
    bY: 600,
    visit: 'level-2',
    lines: [
      { speaker: 'A', text: 'The river ends here.' },
      { speaker: 'B', text: 'And someone left us a bigger boat. It says BAOT too.' },
      { speaker: 'A', text: 'Then BAOT takes us the rest of the way. To C.' },
      { speaker: 'B', text: 'Push off — she’s out there.' },
    ],
  },
};
