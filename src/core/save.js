// Save data — small, versioned, forgiving. Never blocks play if storage fails.

const KEY = 'abc-adventure-save-v1';

const BLANK = {
  version: 1,
  level: 'level-1',
  // Per chapter, so travelling to another chapter from the map never costs
  // you your place in this one. Both are cleared when the chapter is finished.
  checkpoints: {},       // chapter id → checkpoint id reached
  seeds: {},             // chapter id → indices of the golden seeds picked up
  routeTaken: null,      // 'upper' | 'lower' — the child's fork choice
  metCharacters: ['A'],  // canonical ids: A, B, C, owl — display names live in core/names.js
  visited: ['level-1'],  // world-map location ids
  completed: [],
  hintsSeen: [],
};

export const save = {
  data: load(),
  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
    catch { /* private browsing — play on without persistence */ }
  },
  reset() { this.data = structuredClone(BLANK); this.write(); },
  meet(id) {
    if (!this.data.metCharacters.includes(id)) { this.data.metCharacters.push(id); this.write(); }
  },
  visit(id) {
    if (!this.data.visited.includes(id)) { this.data.visited.push(id); this.write(); }
  },
  complete(id) {
    if (!this.data.completed.includes(id)) this.data.completed.push(id);
    this.clearChapter(id);
  },
  checkpointIn(id) { return this.data.checkpoints[id] ?? null; },
  setCheckpoint(id, cp) { this.data.checkpoints[id] = cp; this.write(); },
  seedsIn(id) { return this.data.seeds[id] ?? []; },
  takeSeed(id, i) {
    const got = this.data.seeds[id] ??= [];
    if (!got.includes(i)) { got.push(i); this.write(); }
  },
  // Forget where you were in a chapter: it starts from the beginning next time.
  clearChapter(id) {
    delete this.data.checkpoints[id];
    delete this.data.seeds[id];
    this.write();
  },
  markHint(id) {
    if (!this.data.hintsSeen.includes(id)) { this.data.hintsSeen.push(id); this.write(); }
  },
  sawHint(id) { return this.data.hintsSeen.includes(id); },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(BLANK);
    const parsed = JSON.parse(raw);
    if (parsed.version !== BLANK.version) return structuredClone(BLANK);
    // Older saves kept a single checkpoint for whichever chapter was last played.
    if (parsed.checkpoint !== undefined) {
      if (parsed.checkpoint && !parsed.checkpoints) parsed.checkpoints = { [parsed.level]: parsed.checkpoint };
      delete parsed.checkpoint;
    }
    return { ...structuredClone(BLANK), ...parsed };
  } catch { return structuredClone(BLANK); }
}
