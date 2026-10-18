---
version: 1
slug: "s-workshop-components-workshop-screen-tsx-fbd140a0"
primary_target: "src/features/workshop/components/workshop-screen.tsx"
related_targets: ["src/features/workshop/components/station-tabs.tsx","src/features/workshop/components/craft-panel.tsx","src/features/workshop/components/extract-panel.tsx","src/features/workshop/components/combine-panel.tsx"]
---

# Workshop screen (three stations)

Scope: the Workshop state of `/play` (GDD 7.4, 11.1). Mode: Operate. The Player does single Combine, Craft and Extract actions on Discovered cards.

- Audience: the returning fan at the end of a 10 to 30 minute session, between Battles; desktop first, phone in landscape.
- Task: arrive with one goal ("join my pairs", "make the card I lack", "melt my spare copies"), pick that station, find a card that the station marks, act, and act again.
- Content: up to 118 Discovered cards; 1 to 5 Rank rows for each card (from its Base Rank); Coin, Essence, Player level, saved Decks.
- Problems it fixes (shape round): no action had a name, Craft and Extract were the same wood button with the Essence icon on the same row, and the intent is mode-first, not card-first.
- Constraints: single actions only (no bulk); the Extract dialog and its rules stay; the station names are the glossary terms Combine, Craft, Extract; no new palette colors; the painting has no new art.
- Unresolved: none. Decisions confirmed in the shape round: a ready filter for each station (off by default); a spare copy is a copy that no saved Deck uses; the Workshop always opens on Combine (on Craft while the Craft Hint shows); new `forge` and `melt` glyphs.

## Direction contract

THESIS: One room, three stations, three directions. Each action is its own station with its own glyph, panel with a lit edge on the side that faces the station, and motion: Combine goes UP a ladder, Craft comes IN from the Essence balance, Extract goes OUT to it. It refuses the category default of one card panel with every action button on every row.

OWN-WORLD: Inherited Painted Tabletop. Night Plate HUD plates with gold-trim borders over the dim painted Workshop; a tab strip with a sliding gold plate for the selected station; Cinzel station names with an Inter recipe line ("2 copies → next Rank", "Essence → 1 copy", "1 copy → Essence") and an Inter 900 count chip; gold chips under the card tiles; the anvil, forge and melt glyphs.

STORY: The Player reads the three stations and what each one costs and gives, picks the one that matches the goal, sees which cards it can act on (bright, with a gold chip) and which it cannot (dark), selects a card, and acts in the panel of that station.

FIRST VIEWPORT: Painting covers the screen. Left column of the work area: the vertical station rail (Combine selected, gold), with the ready filter at its foot; top right, alone: the Balance Plate. Beside the rail, the grid plate (filters, the tiles with a mark strip under each frame), then the station panel (380px) at the right: the Anvil Ladder for Combine, the recipe strip and one gold Craft for Craft, the Rank rows with gold Extract +Essence for Extract.

FORM: Three stations (station tabs over a shared grid), position 1 of 3 in the shape round (the recommended option, selected by the user). Seed key: none; no concept-seed roll ran, because this extends an established surface and the user locked the form in the shape round.

Signature interaction: a Craft is the opposite of an Extract. The Essence drops leave the balance and fly on a curve into the panel card, and the new copy forms from the bottom up behind a bright line in its Rank light, then the Rank burst and the anvil sound. Motion grammar: 520ms drop flight, a 380ms to 660ms form by Rank, the 700ms balance count; reduced motion changes the values at once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
