// Save data — small, versioned, forgiving. Never blocks play if storage fails.

const KEY = 'abc-adventure-save-v1';

const BLANK = {
  version: 1,
  level: 'level-1',
  checkpoint: null,      // checkpoint id within the level
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
    if (!this.data.completed.includes(id)) { this.data.completed.push(id); this.write(); }
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
    return { ...structuredClone(BLANK), ...parsed };
  } catch { return structuredClone(BLANK); }
}
