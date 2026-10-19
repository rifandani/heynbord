---
version: 1
slug: "heynspire-components-heynspire-screen-tsx-b33624b8"
primary_target: "src/features/heynspire/components/heynspire-screen.tsx"
related_targets: ["src/features/town/town.ts","src/features/battle/components/overlays.tsx"]
---

# Heynspire screen (the tower)

Scope: the Heynspire state of `/play` (GDD 8.2, 11.1, 11.4, issue #99). Mode: Operate. The Player sees the climb, reads the selected Floor, selects a Deck and starts the Floor Battle.

- Audience: the returning fan and the strategy card player after the first win of Stage 5-10, between Battles. Desktop first, phone in landscape.
- Task: see the Current Floor and its next storeys at a glance, read the enemy and the reward at once; Town, tower or shortcut, Enter (focus to Fight), Enter (Fight).
- Content: `getFloor(n)`, `floorFirstWinReward(n)`, `climb(floorsWon)` and `heynspireFloorsWon` (0 to 50). Boss Floors 10, 20, 30, 40, 50 bring back the 5 Campaign Bosses. No card reward, no Stars, no replay, no Sweep.
- Constraints: no Boss portraits; the earn-only Cosmetic does not show. From the reference (a scrolling painted tower with a docked side panel), these parts stay out: Difficulty Reduction, the boost dial, companion portraits, the Monster Info tab and a close button (the Town Bar closes the screen).
- Adaptations: a locked Floor can be selected, and the panel shows a preview with "Win Floor N first.". The storeys, the Boss storey, the summit, the base and the sky are to be painted (11 — Town Concepts 14); until then, CSS and SVG storeys of cream stone (a patch of the Heynspire inside painting) and the softened Heynspire inside painting hold their places. A short screen shows one compact column of panel parts, not two columns.
- Unresolved: the 5 Heynspire paintings (brief in 11 — Town Concepts 14) and the Battle Painting (13 — Battlefield Concepts 1.7); draft enemy names.

## Direction contract

THESIS: The Painted Tower. The 50 Floors are the 50 storeys of one tower that scrolls, Floor 1 over the clouds and Floor 50 under the royal blue roof; each storey has its door and a status ribbon, and the selected Floor is always open in a parchment sheet at the right. It refuses a 50-row level list, a grid of numbered tiles, and a modal over the tower.

OWN-WORLD: Inherited Painted Tabletop. Cream stone storeys lit from the upper left; door faces in the Floor state (open gold light for Current, Tavern Wood for Won, dark oak with pewter bands for Locked); Night Plate and gold ribbons with icons; Boss balconies with a ready-gold crown and enemy-deep banners; a spine of bronze progress with Boss crowns; one gold Fight in a docked parchment Floor Panel.

STORY: The Player opens the tower on the lit door of the Current Floor, reads the enemy, the reward and the level next to it, and presses Enter twice. They can scroll up to read a locked Boss, or jump to it from the spine. After a win they come back to the stamped ribbon and the next door, which wakes.

FIRST VIEWPORT: The sky covers the screen. Left: the tower column, centered on the Current storey, with about 4 storeys in view, ribbons at both sides, and the spine at the left edge. Top right: the Balance Plate. Right: the docked Floor Panel of the Current Floor with Fight at its foot. The Current storey has the focus.

FORM: The Painted Tower, from the user's reference image (shape round 2, confirmed). Replaces Five Flights.

FINISH: the code and the CSS fallback are built and verified (desktop 1440 × 900, 1280 × 720, phone 844 × 390; e2e green). The 5 paintings are open: each needs its provenance record when it ships.
