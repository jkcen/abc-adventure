# Wild, Stuffy & Peter's Adventure

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

| id | name | who | look |
|----|------|-----|------|
| **A** | **Wild** | brave & determined | fully brown eagle, yellow beak & feet, black talons |
| **B** | **Stuffy** | kind & clever | **white head**, brown body, yellow beak & feet |
| **C** | **Peter** | friendly & warm | small all-white bird, soft silhouette |
| **owl** | **Owl** | mysterious | forest owl, ear tufts, yellow eyes |

Ids are canonical everywhere in the engine; the display names live in
`src/core/names.js` (`CHAR_NAMES`) and are the only thing the player reads.
The look is hard-coded in `src/render/characters.js` (`PALETTE`) and used by
gameplay, dialogue, the map, and save data. Nothing should ever infer a character
from "a bird that looks brownish" — always the id.

## What's playable now

**Level 1 — Wild's Journey** is complete, start to finish:

- Wild alone on her island; a lavender floating-island world with waterfalls falling into the clouds
- The **fork**: it exists physically in the level. Walk up-right for the **upper path**, or off the ledge into the **waterfall** for the **lower path**. No buttons.
- **Upper path** — fire rings to aim through, moving platforms, timed jumps
- **Lower path** — the waterfall drop, the Wind Dragonfly's current, falling rocks with shadow warnings, then a climb back up
- Both rejoin before **Stuffy's Island**, which has mountains, a forest, and its own waterfall so it reads as a real destination
- **Arrival**: Wild lands, Stuffy notices her and hops, they walk toward each other, *then* they speak. Stuffy joins the journey.
- World map showing the route taken, who's been met, and what's still unknown

**Level 2 — Across the Weed Sea** is playable, painted from Katherine's second
drawing:

- A pale-pink sky over a teal sea, with long dark-green **weed bands** floating
  in the air as the level's ground
- **Stuffy travels with Wild now** — she flies Wild's own path a beat behind, so she never
  blocks a jump
- **Golden seeds** to collect (a reward, never a requirement — the tally is in
  the corner), **black bugs** patrolling the bands, **drifting lily pads** to
  time, the little **water cart**, and the **yellow slide** down to the shore
- **The ending is the BOAT**: nobody is waiting there. Wild and Stuffy walk to it, say
  their piece, and sail out toward Peter.

Finishing Level 1 leads straight into Level 2 through the world map, and the
save file remembers which chapters are done.

**Level 3 — The Sunset Cliffs** is playable, and it is the one the journey was
for: **A and B go and find C.** Painted from Katherine's third drawing:

- A deep orange sunset over a blue wavy sea; two big butterflies over the cliff
  they set out from
- Flat **yellow-green planks** stepping up through the air, with **black ants**
  walking them — no combat, just timing
- A **fire ring** to aim through, and the **big brown moth** whose wind comes in
  gusts and carries them across the widest gap
- On the right, the tall **dripping cliffs**, the **crate on its rope** as a lift,
  the **rope ladder**, and the grey **arrow** that says: up
- At the top, **C is waiting** — the three of them together, and the sun going down

Not yet built: the forest and the owl. The map still shows them locked.

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
