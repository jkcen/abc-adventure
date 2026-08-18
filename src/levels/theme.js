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
  'level-2': {
    sky: ['#ffd9a8', '#ffc48e', '#ffab7d', '#f9927a'],
    sun: { x: 0.7, y: 0.22, r: 52, color: '#ffe89a', glow: 'rgba(255,214,120,ALPHA)' },
    cloudFar: '#ffe6cd',
    mountainFar: '#d99a80', mountainNear: '#c07f69',
    mountainInk: 'rgba(96,52,40,.35)',
    islandFar: '#cf8f75', islandFarRock: '#b3745e',
    cloudSeaTop: 'rgba(120,170,205,.6)', cloudSeaBottom: '#4f8fbe',
    rock: '#b07a5e', rockDark: '#8b5b43',
    grass: '#84c07a', grassDark: '#568f57',
    ink: 'rgba(74,44,30,.75)',
    trunk: '#6f4b33', leaf: '#6fae74', leafLight: '#9bcd93',
    water: '#9ccbe8', waterLight: '#e6f5ff',
    mote: '#fff0d8',
  },
};
