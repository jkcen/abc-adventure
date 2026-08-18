# A, B & C's Adventure

A 2D adventure game built from Katherine's original game design.

## Play it

**▶ <https://cherlidesign.github.io/abc-adventure/>**

Or run it locally:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (It needs a server, not `file://` — the game uses ES modules.)

**Controls** — ← → to move, **space** to jump, hold space while falling to glide,
**m** for the world map, **enter/space** to advance dialogue.
On a phone or tablet, the bottom third of the screen is left / jump / right.

## The characters — canonical, never to be swapped

| id | who | look |
|----|-----|------|
| **A** | brave & determined | fully brown eagle, yellow beak & feet, black talons |
| **B** | kind & clever | **white head**, brown body, yellow beak & feet |
| **C** | friendly & warm | small all-white bird, soft silhouette |
| **owl** | mysterious | forest owl, ear tufts, yellow eyes |

This mapping is hard-coded in `src/render/characters.js` (`PALETTE`) and used by
gameplay, dialogue, the map, and save data. Nothing should ever infer a character
from "a bird that looks brownish" — always the id.

## What's playable now

**Level 1 — A's Journey** is complete, start to finish:

- A alone on her island; a lavender floating-island world with waterfalls falling into the clouds
- The **fork**: it exists physically in the level. Walk up-right for the **upper path**, or off the ledge into the **waterfall** for the **lower path**. No buttons.
- **Upper path** — fire rings to aim through, moving platforms, timed jumps
- **Lower path** — the waterfall drop, the Wind Dragonfly's current, falling rocks with shadow warnings, then a climb back up
- Both rejoin before **B's Island**, which has mountains, a forest, and its own waterfall so it reads as a real destination
- **Arrival**: A lands, B notices her and hops, they walk toward each other, *then* they speak. B joins the journey.
- World map showing the route taken, who's been met, and what's still unknown

Not yet built: Levels 2–5 (Phases 3–5 of the plan). The map already shows them locked.

## Architecture

Every system is separate and levels are pure data.

```
src/
  core/     input, camera, assets (registry), audio, save, rng
  render/   brush (the hand-drawn look), characters, world-art, parallax
  game/     player, physics, obstacles, particles, dialogue, level, worldmap
  levels/   level-1.js (data only), theme.js (palettes per chapter)
```

`src/levels/level-1.js` is the whole level: islands, obstacles, checkpoints,
hints, deco, and the arrival beat. **Level 2 is a second file of the same shape** —
`src/game/level.js` plays any config without changes.

## Adding Katherine's real artwork

The asset registry falls back to a procedural painter for every key. Registering
a real PNG replaces it, and nothing else changes:

```js
// in src/main.js, in the marked block
assets.image('char/A/idle',  './assets/characters/A/idle.png');
assets.image('char/A/walk',  './assets/characters/A/walk.png');
assets.image('char/B/idle',  './assets/characters/B/idle.png');
```

Keys follow `char/<A|B|C|owl>/<state>` for characters. States supported:
`idle walk run jump fall fly land hurt surprised tired sleep happy celebrate`.
A missing file logs a warning and keeps the painter, so a half-filled
`/assets` folder still runs.

The `/assets` folders are already laid out (characters, levels, obstacles,
environment, audio) and empty, ready for drops.

## Placeholder art — read this

All current visuals are **procedurally painted stand-ins**, written to imitate the
watercolor/acrylic feel: seeded wobble on every outline, layered translucent
washes, crayon hatching, hand-drawn ink. They are *not* a substitute for the real
drawings — they're scaffolding so the game is playable and correctly laid out
while the scans are prepared. When the artwork arrives it goes in as above, and
the level geometry, pacing, and camera work stay exactly as they are.
