// OWL'S WOODS — the forest chapter, built around Katherine's owl drawing.
//
// In her story the forest and Owl come BEFORE they reach C: A and B travel a
// long way, rest in the woods, and Owl decides to stop them. So this chapter
// belongs between the sea crossing and the final cliffs.
//
// Its pacing is deliberately the reverse of the sea chapter — it starts QUIET,
// with no obstacles at all, so that the first sight of Owl lands:
//
//   1. quiet forest walk          (nothing to dodge; the rest beat)
//   2. Owl watching from a tree   (no collision — only her eyes following you)
//   3. she knocks branches loose  (telegraphed by a shadow)
//   4. she swoops across the path (a shadow sweeps the ground first)
//   5. branches AND swoops together, over a ravine
//   6. the clearing — she breaks off, and the way onward opens
//
// She is never lethal and never invisible. Everything she does is announced
// before it can touch you.
//
// Uses the 'level-4' palette (the forest colours pulled from her owl drawing).

export const LEVEL_OWL = {
  id: 'level-owl',
  title: 'Owl’s Woods',
  subtitle: 'someone is watching',
  theme: 'level-4',
  mood: 'forest',
  mapLocation: 'forest',
  player: { id: 'A', x: 80, y: 620 },
  companion: { id: 'B', offset: 58 },
  bounds: { minX: -300, maxX: 5000, minY: -300, maxY: 1200 },
  fallY: 1100,
  cloudSeaY: 980,

  ground: [
    { x: -300, y: 620, w: 1240, h: 300, seed: 1, art: 'forest' },
    { x: 1010, y: 620, w: 700,  h: 300, seed: 2, art: 'forest' },
    { x: 1800, y: 620, w: 620,  h: 300, seed: 3, art: 'forest' },
    { x: 2500, y: 596, w: 300,  h: 300, seed: 4, art: 'forest' },
    { x: 2880, y: 640, w: 900,  h: 300, seed: 5, art: 'forest' },
    // stepping ledges over a ravine, so a swoop can catch you mid-jump
    { x: 3860, y: 574, w: 150,  h: 40,  seed: 6, art: 'forest' },
    { x: 4090, y: 542, w: 150,  h: 40,  seed: 7, art: 'forest' },
    { x: 4300, y: 600, w: 800,  h: 320, seed: 8, art: 'forest' },
  ],

  obstacles: [
    // 2. the introduction. No damage. She watches, then leaves.
    { kind: 'owlwatch', x: 1290, y: 300, w: 92, h: 102, leaveX: 1560 },

    // 3. branches she knocks loose
    { kind: 'branch', x: 1980, groundY: 620, y: 300, len: 76, period: 3.0, warn: 1.1, phase: 0 },
    { kind: 'branch', x: 2180, groundY: 620, y: 280, len: 68, period: 3.4, warn: 1.1, phase: 1.6 },
    { kind: 'branch', x: 2360, groundY: 620, y: 310, len: 80, period: 2.8, warn: 1.0, phase: 0.8 },

    // 4. the first swoop, alone, with a long calm between passes
    { kind: 'owl', fromX: 3760, toX: 2940, y: 380, dipY: 592, groundY: 640,
      period: 5.0, warn: 1.3, dive: 1.7, phase: 0 },

    // 5. the combination: a second swoop plus branches over the ravine
    { kind: 'owl', fromX: 3820, toX: 4260, y: 360, dipY: 520, groundY: 600,
      period: 4.6, warn: 1.2, dive: 1.5, phase: 2.3 },
    { kind: 'branch', x: 3930, groundY: 574, y: 250, len: 64, period: 3.2, warn: 1.1, phase: 0.5 },
    { kind: 'branch', x: 4160, groundY: 542, y: 230, len: 64, period: 3.0, warn: 1.1, phase: 1.9 },
  ],

  deco: [
    { kind: 'mountains', x: -300, y: 640, w: 1400, h: 250, seed: 61 },
    { kind: 'mountains', x: 2600, y: 660, w: 1600, h: 220, seed: 62 },

    // the quiet opening stretch — dense, calm, nothing to dodge
    { kind: 'forestTree', x: -140, y: 620, scale: 1.35 },
    { kind: 'forestTree', x: 60,   y: 620, scale: 1.1 },
    { kind: 'forestTree', x: 300,  y: 620, scale: 1.45 },
    { kind: 'forestTree', x: 520,  y: 620, scale: 1.15 },
    { kind: 'forestTree', x: 760,  y: 620, scale: 1.3 },

    // her tree, and the branch she is sitting on
    { kind: 'forestTree', x: 1330, y: 620, scale: 2.1 },
    { kind: 'branch', x: 1180, y: 400, w: 300, seed: 5 },

    { kind: 'forestTree', x: 1620, y: 620, scale: 1.2 },
    { kind: 'branch', x: 1900, y: 320, w: 260, seed: 7 },
    { kind: 'forestTree', x: 2260, y: 620, scale: 1.35 },
    { kind: 'branch', x: 2280, y: 300, w: 240, seed: 9 },
    { kind: 'forestTree', x: 2700, y: 596, scale: 1.25 },
    { kind: 'forestTree', x: 3020, y: 640, scale: 1.5 },
    { kind: 'forestTree', x: 3420, y: 640, scale: 1.2 },
    { kind: 'branch', x: 3840, y: 260, w: 300, seed: 11 },
    { kind: 'forestTree', x: 4230, y: 600, scale: 1.1 },

    // the clearing opens out — fewer, lighter trees
    { kind: 'forestTree', x: 4560, y: 600, scale: 1.0 },
    { kind: 'forestTree', x: 4900, y: 600, scale: 1.25 },
  ],

  checkpoints: [
    { id: 'wood-entrance', x: 120,  y: 620 },
    { id: 'watched',       x: 1400, y: 620 },
    { id: 'branches',      x: 2000, y: 620 },
    { id: 'the-swoop',     x: 2960, y: 640 },
    { id: 'the-ravine',    x: 3900, y: 574 },
    { id: 'clearing',      x: 4360, y: 600 },
  ],

  hints: [
    { id: 'forest-quiet', x: 300,  w: 340, text: 'the forest is very quiet here' },
    { id: 'owl-seen',     x: 1300, w: 300, text: 'something is watching from the tree' },
    { id: 'owl-branch',   x: 1980, w: 320, text: 'watch the shadow before you run' },
    { id: 'owl-swoop',    x: 3000, w: 340, text: 'she dives along the shadow — wait, then go' },
  ],

  routeMarkers: [],

  arrival: {
    mode: 'talk',
    partner: 'B',
    triggerX: 4700,
    bStandX: 4880,
    bY: 600,
    visit: 'owl',
    lines: [
      { speaker: 'B', text: 'She stopped following us.' },
      { speaker: 'A', text: 'She was not trying to hurt us. She was keeping us away from something.' },
      { speaker: 'B', text: 'Away from Peter?' },
      { speaker: 'A', text: 'Then we are going the right way.' },
    ],
  },
};
