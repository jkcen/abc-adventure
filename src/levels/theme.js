// Palettes per chapter. Level 1 is Katherine's pale-lavender floating-island
// world; the later chapters are stubbed with their intended direction so the
// transition already reads correctly on the world map.

export const THEMES = {
  'level-1': {
    sky: ['#cfc0e8', '#ded1f0', '#efe3f6', '#f7ecf3'],
    sun: { x: 0.76, y: 0.16, r: 40, color: '#fff2c4', glow: 'rgba(255,238,190,ALPHA)' },
    cloudFar: '#f3ebfa',
    mountainFar: '#b6a5d4',
    mountainNear: '#9d8ac4',
    mountainInk: 'rgba(70,52,102,.35)',
    islandFar: '#a894cd', islandFarRock: '#8d78b8',
    cloudSeaTop: 'rgba(240,234,250,.85)', cloudSeaBottom: '#e6dcf6',
    rock: '#8f7bb3', rockDark: '#6d5a90',
    grass: '#8fc98a', grassDark: '#5f9c62',
    ink: 'rgba(58,42,86,.75)',
    trunk: '#7b5a3f', leaf: '#7cbd82', leafLight: '#a3d6a0',
    water: '#bcd9f2', waterLight: '#eaf6ff',
    mote: '#ffffff',
  },
  // LEVEL 2 — painted straight from Katherine's second drawing: a pale pink
  // sky, long dark-green weed bands floating over a teal sea, golden seeds
  // hanging in the air, and the BOAT waiting at the far edge.
  'level-2': {
    sky: ['#fbe7ee', '#f8e8ef', '#f5edf0', '#f3f1ef'],
    sun: null,
    cloudFar: '#ffffff',
    mountainFar: '#f0d7e0', mountainNear: '#e5c4d2',
    mountainInk: 'rgba(120,90,105,.25)',
    islandFar: '#a9dba2', islandFarRock: '#9c7a3c',
    cloudSeaTop: 'rgba(150,214,206,.55)', cloudSeaBottom: '#8ed0c6',
    rock: '#9c7a3c', rockDark: '#5d3f2b',
    grass: '#8ed492', grassDark: '#2f8f4a',
    ink: 'rgba(70,74,62,.7)',
    trunk: '#8a6a3a', leaf: '#8ed492', leafLight: '#bbe8b4',
    water: '#9adcd0', waterLight: '#eafbf6',
    mote: '#ffffff',
    // level-2 only — the drawing's own colours
    weed: '#3aa35c', weedDark: '#12703a',
    gold: '#c9a52a', goldLight: '#ecd45a',
    boatWood: '#a9782e', boatDark: '#5a3a1b',
    slide: '#f2d21c',
    lily: '#8ed492', lilyInk: 'rgba(70,90,70,.75)',
  },
  // LEVEL 4 — the forest, painted from Katherine's owl drawing: cream paper
  // light through the trees, rust branches, pointed orange leaves, and a
  // deep green canopy that closes in as Owl's territory begins.
  // (Level 3 is the sunset, below — this palette waits for the owl chapter.)
  'level-4': {
    sky: ['#f3ead6', '#eddfc0', '#e3c99c', '#d8ab74'],
    sun: { x: 0.2, y: 0.24, r: 44, color: '#ffe9a8', glow: 'rgba(255,214,140,ALPHA)' },
    cloudFar: '#f6ecd8',
    mountainFar: '#b9a184', mountainNear: '#8f7756',
    mountainInk: 'rgba(60,44,26,.35)',
    islandFar: '#7d9257', islandFarRock: '#6b5334',
    cloudSeaTop: 'rgba(80,70,45,.35)', cloudSeaBottom: '#3f3a24',
    rock: '#8b6f4a', rockDark: '#5f4529',
    grass: '#6ea850', grassDark: '#3f7a35',
    earth: '#8a6239', earthDark: '#5d3f22',
    ink: '#141010',
    trunk: '#6b4526', leaf: '#3f7a45', leafLight: '#6aa85c',
    water: '#9fc4d8', waterLight: '#e6f3fb',
    mote: '#ffe3ae',
    // owl territory — her own colours, straight off the drawing
    branch: '#b8552a', leafWarm: '#e8912f',
    owlBody: '#c0512a', owlTuft: '#a3b3ae',
  },
  // LEVEL 3 — Katherine's third drawing: a deep orange sunset over a blue
  // wavy sea, flat yellow-green planks stepping through the air, and the tall
  // dripping cliffs on the right where C is waiting.
  'level-3': {
    sky: ['#e0651f', '#ee8244', '#f4a077', '#f6bda2'],
    sun: { x: 0.82, y: 0.22, r: 34, color: '#ffe6b0', glow: 'rgba(255,196,120,ALPHA)' },
    cloudFar: '#ffffff',
    mountainFar: '#e3a184',
    mountainNear: '#cf8f76',
    mountainInk: 'rgba(70,40,24,.3)',
    islandFar: '#b98a5e', islandFarRock: '#8d6440',
    cloudSeaTop: 'rgba(72,124,208,.7)', cloudSeaBottom: '#2f6fd0',
    rock: '#7d5433', rockDark: '#4e3320',
    grass: '#c9d94b', grassDark: '#8fa22f',
    ink: 'rgba(38,24,14,.8)',
    trunk: '#8a5a33', leaf: '#6fae6a', leafLight: '#9bd08f',
    water: '#cfe6ff', waterLight: '#f4fbff',
    mote: '#ffe6c2',
    // level-3 only — the drawing's own colours
    plank: '#c9d94b', plankDark: '#8fa22f',
    cliff: '#7d5433', cliffDrip: '#221407',
    crate: '#a87b3c',
    arrow: '#9aa0a6',
    moth: '#6b4327', mothDark: '#3a2415',
    wingPurple: '#5b2140', wingPink: '#f2b9c8',
  },
};
