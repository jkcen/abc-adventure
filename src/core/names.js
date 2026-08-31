// Display names — the canonical ids stay 'A' / 'B' / 'C' everywhere in the
// engine (save files, art lookups, level data); only what the player READS
// comes from here. Renaming a bird is a one-line change in this table.

export const CHAR_NAMES = {
  A: 'Wild',
  B: 'Stuffy',
  C: 'Peter',
  owl: 'Owl',
};

export function charName(id) {
  return CHAR_NAMES[id] ?? id;
}
