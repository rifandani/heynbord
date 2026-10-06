---
version: 1
slug: "s-campaign-components-campaign-screen-tsx-e775ae4c"
primary_target: "apps/web/src/features/campaign/components/campaign-screen.tsx"
related_targets: ["apps/web/src/features/battle/components/stage-select.tsx"]
---

# Campaign screen (Region Map)

Scope: the Campaign state of `/play` (GDD 11.5, 12 — Region Concepts, web ADR-0008). Mode: Operate. The Player picks the next Stage, sees progress, and starts a Battle.

- Audience: the returning fan and the strategy card player, desktop first, phone in landscape.
- Task: find the Open Stage at a glance, read Done / Open / Locked and best Stars, open the Stage Panel, choose a Deck, Fight.
- Content: Region 1 Hearthvale painting (`/battle/hearthvale-region.webp`), 10 Stages from `STAGES`, the Starter Decks, first-win cards.
- Constraints: the painting is not 1.1 of doc 12. The user chose measured, per-Region positions. Progress is in memory (user choice), with a QA state that opens all Stages. Stage names are not on this screen (GDD 11.5).
- Unresolved: Star chest rewards (no reward code); Regions 2 and 3 (no painting, no Stages).

## Direction contract

THESIS: The map is the menu. The Campaign is the painted valley itself, and each Stage is a heraldic shield planted on its clearing; the game refuses the category default of a list or a grid of Stage cards over a blurred backdrop.

OWN-WORLD: Inherited Painted Tabletop. Bronze-rimmed shields in card metal: gold face for Open (the one gold thing on the map), weathered wood-and-bronze face with a cream check for Done, cold stone face with a lock for Locked. Night Plate ID plates in Inter 900. A cream dashed trail with an ink under-stroke. Parchment Stage Panel with a 4px frame-wood border.

STORY: The Player sees the whole valley, sees how far the trail is walked, sees the one glowing shield, taps it, reads who waits there and what the first win gives, picks a Deck, and presses Fight.

FIRST VIEWPORT: The painting fills the screen; the frame keeps all 10 clearings between the top HUD band and the Town Bar on every shape from 4:3 to 21:9 and on a 844×390 phone. Top left: a Night Plate banner with the Region number, "Hearthvale" in Cinzel, and back / next arrows. Top right: the Star chest plate (Stars "n / 30", a bronze track, chests at 10, 20, 30). On the trail: 10 shields, the Boss shield 1.3× with a crown at Brassbelly Hall. The primary action is the pulsing gold Open shield.

FORM: Painted map with code-drawn pieces, the form pinned by GDD 11.5 and ADR-0008 (position 1 of 1; precisely specified request, no concept roll). Seed key: none (pinned by the brief). The user pinned it in words: "build a region map UI, i already put the illustration in @apps/web/public/battle/hearthvale-region.webp, follow the guideline in @docs/game/12-region-concepts.md and @docs/game/13-battlefield-concepts.md". Doc 12 and GDD 11.5 fix the composition: the painting with code-drawn Stage Markers, the progress line, the Region name with arrows in the top band, the Star chest plate in the top-right corner, and a modal Stage Panel.

Signature interaction: a selected shield lifts and the map dims behind the Stage Panel; on a new win the next shield wakes with its first pulse. Motion grammar: 100ms piece press, 200ms dialog zoom from 95%, a 2.4s Open pulse; reduced motion stops all of it.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
