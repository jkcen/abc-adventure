// Deterministic pseudo-random helpers.
// The hand-drawn look depends on wobble that stays PUT between frames —
// Math.random() would make every outline crawl. Everything here is seeded.

export function hash(n) {
  let x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

// Signed wobble in [-1,1] for seed n.
export function wob(n) { return hash(n) * 2 - 1; }

// Smooth 1-D value noise, for things that SHOULD drift (fire, water, leaves).
export function noise1(x) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}
