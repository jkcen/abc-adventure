// LEVEL 3 — The Sunset Cliffs.  A and B go and find C.
//
// Painted from Katherine's third drawing: a deep orange sunset over a blue
// wavy sea. A brown cliff on the left with purple mountains and two big
// butterflies over it; flat yellow-green planks stepping up through the air;
// a fire ring to aim through; the big brown
// moth hanging in the middle, whose wind carries you across the widest gap;
// and on the right the tall dripping cliffs, the crate on its rope, the rope
// ladder, and the grey arrow pointing up — to where C has been all along.
//
// This is the chapter the whole journey was for: at the top, A and B find C.
//
// New data keys, all drawn straight from the picture:
//   ground.art 'plank' | 'cliff'
//   obstacle 'crate'   the hanging box, used as a lift up the cliff face
//   obstacle 'wind' with art:'moth'  the big brown moth
//   deco 'ladder' | 'arrow' | 'butterfly'

export const LEVEL_3 = {
  id: 'level-3',
  title: 'The Sunset Cliffs',
  subtitle: 'to find C',
  theme: 'level-3',
  mood: 'level-3',
  mapLocation: 'level-3',
  player: { id: 'A', x: -80, y: 506 },   // standing on the boat's deck
  companion: { id: 'B', offset: 58 },
  bounds: { minX: -260, maxX: 5320, minY: -460, maxY: 1120 },
  fallY: 1060,
  cloudSeaY: 900,          // the blue wavy sea along the bottom of the drawing

  ground: [
    // ---- the cliff they set out from ------------------------------------
    { x: -260, y: 540, w: 820, h: 360, seed: 1 },
    // the boat's deck: solid, but the boat itself is what you see
    { x: -140, y: 506, w: 120, h: 18, art: 'none' },

    // ---- the yellow-green planks, stepping up through the sunset ---------
    { x: 700,  y: 520, w: 200, h: 26, art: 'plank', seed: 2 },
    { x: 1000, y: 452, w: 220, h: 26, art: 'plank', seed: 3 },
    { x: 1340, y: 520, w: 200, h: 26, art: 'plank', seed: 4 },
    { x: 1640, y: 430, w: 230, h: 26, art: 'plank', seed: 5 },
    { x: 1980, y: 370, w: 210, h: 26, art: 'plank', seed: 6 },
    { x: 2300, y: 430, w: 200, h: 26, art: 'plank', seed: 7 },   // under the fire ring
    { x: 2600, y: 360, w: 220, h: 26, art: 'plank', seed: 8 },
    { x: 2940, y: 470, w: 200, h: 26, art: 'plank', seed: 9 },   // the moth's crossing starts here
    { x: 3300, y: 500, w: 160, h: 26, art: 'plank', seed: 10 },
    { x: 3560, y: 560, w: 280, h: 26, art: 'plank', seed: 11 },

    // ---- the tall dripping cliffs on the right ---------------------------
    { x: 3900, y: 600, w: 420, h: 320, art: 'cliff', seed: 12 },
    { x: 4520, y: 300, w: 700, h: 360, art: 'cliff', seed: 13 },  // C's cliff
  ],

  obstacles: [
    // (no ants on the planks — this chapter is about the climb, not dodging)

    // --- the fire ring, hung between two planks: aim for the hole ---------
    { kind: 'fire', x: 2550, y: 312, r: 64, moveY: 30, speed: 0.7 },

    // --- OWL. She hangs over the widest gap and her wingbeats are the wind
    //     that carries them across. On the far side she stops helping.
    { kind: 'wind', art: 'owl', scale: 1.25, x: 3230, y: 330, dir: 1,
      force: 640, gust: 3.2,
      zoneX: 3120, zoneY: 300, zoneW: 500, zoneH: 300 },

    // --- the crate on its rope: the lift up the cliff face ----------------
    // the lift runs quicker than it used to — nobody should be standing still
    // waiting for a box with Owl coming up behind them
    { kind: 'crate', x: 4330, y: 556, w: 120, h: 24, toY: 300, period: 2.2, pause: 0.5 },
  ],

  deco: [
    // the boat that brought them here, run aground on the cliff's edge
    { kind: 'boat', x: -80, y: 540, scale: 1.0, label: 'BAOT' },

    // the two big butterflies hanging over the first cliff
    { kind: 'butterfly', variant: 'purple', x: 300, y: 330, scale: 1.25 },
    { kind: 'butterfly', variant: 'holo',   x: 452, y: 404, scale: 0.85 },

    { kind: 'mountains', x: 60,  y: 540, w: 430, h: 240, seed: 31 },
    { kind: 'tree', variant: 'pine',  x: -110, y: 540, scale: 1.1 },
    { kind: 'tree', variant: 'round', x: 20,   y: 540, scale: 0.95 },

    // the rope ladder up the cliff, and the grey arrow that says: up
    { kind: 'ladder', x: 4472, y: 312, h: 292 },
    { kind: 'arrow',  x: 4130, y: 600, w: 180, h: 138 },

    // C's cliff, where the journey ends
    { kind: 'waterfall', x: 5110, y: 322, w: 92, h: 430 },
    { kind: 'tree', variant: 'round', x: 4680, y: 300, scale: 1.35 },
    { kind: 'tree', variant: 'pine',  x: 4830, y: 300, scale: 1.15 },
    { kind: 'tree', variant: 'round', x: 5240, y: 300, scale: 1.0 },
  ],

  checkpoints: [
    { id: 'set-out',    x: 180,  y: 540 },
    { id: 'planks',     x: 1040, y: 452 },
    { id: 'high-plank', x: 2020, y: 370 },
    { id: 'past-ring',  x: 2640, y: 360 },
    { id: 'moth',       x: 2980, y: 470 },
    { id: 'cliff-foot', x: 3960, y: 600 },
  ],

  hints: [
    { id: 'l3-boat',  x: 420,  w: 320, text: 'if you fall, the boat will catch you' },
    { id: 'l3-ring',  x: 2480, w: 300, text: 'the middle of the ring is still safe' },
    { id: 'l3-owl',   x: 3040, w: 340, text: 'Owl’s wingbeats come in gusts — jump with them' },
    { id: 'l3-crate', x: 4260, w: 300, text: 'ride the crate up' },
  ],

  routeMarkers: [],

  // FALLING IS NOT FAILURE. The boat that carried them here is still down on
  // the water: it slides under whoever falls, holds them for a beat, sails
  // back along the sea, and lets them fly up to the last ledge they stood on.
  rescue: {
    y: 980,          // the waterline the boat rides on
    deck: 34,        // how far above that line the deck sits
    hold: 0.9,       // a beat on the deck, so the catch reads as a rescue
    speed: 520,      // how fast she sails back
    lift: 560,       // how fast they climb back out of the boat
    scale: 1.15,
    label: 'BAOT',
  },

  // THE OWL CHASE. She lands in front of them on the far side of her own gust,
  // has her say, and then comes after them — the rest of the chapter is a run
  // to Peter. She never kills: catching them knocks them forward and she falls
  // back, so a child can lose ground and still finish.
  chase: {
    triggerX: 3620,        // just after they land on the long plank
    fromX: 3230, fromY: 330,
    standAhead: 200,       // she drops in ahead of them, blocking the way on
    standY: 470,
    startBehind: 380,      // then swings around behind for the chase
    // She flies at a walking-away pace: well under a full sprint (245), so a
    // child who keeps moving is never actually in danger of being caught.
    speed: 120, accel: 9, maxSpeed: 190,
    leash: 820, recoil: 340,
    runText: 'RUN! — get to Peter',
    lines: [
      { speaker: 'owl', text: 'My wind carried you. Nobody told you it was free.' },
      { speaker: 'A',   text: 'We only want to reach our friend.' },
      { speaker: 'owl', text: 'Then reach him. If you can keep ahead of me.' },
      { speaker: 'B',   text: 'Wild — don’t stop for anything!' },
    ],
  },

  // They arrive by sea. Before the player takes over, A steps off the boat
  // that carried them out of Level 2 and onto the sunset cliff.
  intro: {
    stepX: 120,
    lines: [
      { speaker: 'A', text: 'This is as far as the boat goes.' },
      { speaker: 'B', text: 'Look at the light. The whole sky is on fire.' },
      { speaker: 'A', text: 'C is up there somewhere. Come on.' },
    ],
  },

  // The end of the whole journey: C is on the cliff top.
  arrival: {
    partner: 'C',
    triggerX: 4640,
    bStandX: 5010,
    bY: 300,
    visit: 'c-island',
    lines: [
      { speaker: 'C', text: 'You came all this way?' },
      { speaker: 'A', text: 'We followed the arrow. And the wind. And each other.' },
      { speaker: 'B', text: 'A never once turned back.' },
      { speaker: 'C', text: 'Then let’s watch the sun go down together.' },
    ],
  },
};
