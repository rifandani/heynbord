---
version: 1
slug: "heynspire-components-heynspire-screen-tsx-b33624b8"
primary_target: "src/features/heynspire/components/heynspire-screen.tsx"
related_targets: ["src/features/town/town.ts","src/features/battle/components/overlays.tsx"]
---

# Heynspire screen (the tower)

Scope: the Heynspire state of `/play` (GDD 8.2, 11.1, 11.4, issue #99). Mode: Operate. The Player sees the climb, reads the Current Floor, selects a Deck and starts the Floor Battle.

- Audience: the returning fan and the strategy card player after the first win of Stage 5-10, between Battles. Desktop first, phone in landscape.
- Task: see "Floor 12 of 50" and the next Boss at a glance; Town, tower or shortcut, Enter (panel), Enter (Fight).
- Content: `getFloor(n)`, `floorFirstWinReward(n)`, `currentFloor(profile)` and `heynspireFloorsWon` (0 to 50). Boss Floors 10, 20, 30, 40, 50 bring back the 5 Campaign Bosses. No card reward, no Stars, no replay, no Sweep.
- Constraints: no Boss portraits; the earn-only Cosmetic does not show. Background: a zoomed, softened crop of the Town painting on the hill castle, until Heynspire art exists. Locked until the first win of 5-10: the Lock Plate shows the lock, "5-10" and a crown. "Next Floor" opens the Floor Panel of the next Floor. "Flight" is a web-only term.
- Adaptations: the Floor stones are arched tower doors (step blocks read as treasure chests in round 1). The stair steps are painted ashlar cut from the Barracks inside painting. On a phone in landscape, the summit cap shows only after the climb, so that all 5 Flights fit above the Town Bar.
- Unresolved: the Heynspire painting (brief in 11 — Town Concepts 14) and Battle Painting (13 — Battlefield Concepts 1.7, temporary copy of the Hollow Marches); draft enemy names.

## Direction contract

THESIS: Five Flights. The tower is 5 flights of 10 Floors stacked bottom to top; the open flight climbs as a stair to its crowned Boss landing, and the other flights fold to slim bands. It refuses the category default of a 50-row level list or a grid of numbered tiles.

OWN-WORLD: Inherited Painted Tabletop. Floor stones in the Stage Marker state paints (gold face for Current, bronze and Tavern Wood with a cream check for Won, pewter and stone with a lock for Locked), Night Plate flight bands with a 10-cell state strip, a ready-gold crown and an enemy-deep Class seal on each Boss landing, Rare and Epic Forge Stone marks, a summit flag, one gold Fight in a parchment Floor Panel.

STORY: The Player sees which flight they are on and how far the Boss landing is, presses the gold Current stone, reads the enemy and the reward in the Floor Panel, and presses Fight. After a win they come back to the next stone, which wakes; after a Boss win the flight folds with a check and the next one opens.

FIRST VIEWPORT: Castle crop covers the screen. Top left: a HUD plate with a tower glyph, "Heynspire" and "Floor 12 of 50". Top right: the Balance Plate. Center, above the Town Bar, at most 960px wide: the summit cap, 3 folded locked bands, the open flight (Floors 11 to 19 rising left to right to the large Boss landing of Floor 20 at the right), then the folded won band of Floors 1 to 10. The Current stone has the focus.

FORM: Five Flights, position 4 of 7 on the shape round (dealt lead). Seed key: 02622c35.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
