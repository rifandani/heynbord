---
version: 1
slug: "src-features-hero-components-hero-screen-tsx"
primary_target: "src/features/hero/components/hero-screen.tsx"
related_targets: ["src/features/hero/components/gear-item.tsx","src/features/town/components/town-screen.tsx"]
---

# Hero screen (Barracks)

Scope: the Hero state of `/play` (GDD 7.3, 11.1, issue #77, ADR-0032). Mode: Operate. The Player reads the Hero (Class, Hero HP and its parts) and does Gear upgrades for Coin, one level for each press.

- Audience: the returning fan and the strategy card player at Player level 5 or higher, between Battles, often with spare Coin after a Region 1 run. Desktop first, phone in landscape.
- Task: see the Class of the Active Deck and the Hero HP sum, compare the 4 Gear items, press an upgrade, see the stat rise and the Coin fall, press again. "Change Deck" opens the Deck dialog.
- Content: 4 Gear slots (Weapon, Armor, Trinket, Banner), levels 0 to 10, cost 40 × n² Copper (40c to 40s), stats from `content/gear.ts`. Class from the Active Deck slot.
- Constraints: no Hero figure, no Class-specific item names, no Deck or Class selector here. Art (Barracks inside painting, 4 Gear icons) comes from the user; until each file exists, a code fallback holds its box. The Gear icons show the Active Gear look, or the Standard kit (web ADR-0013).
- Unresolved: the painted Barracks inside and the 4 painted Gear icons (briefs in 11 — Town Concepts 11 and 12).

## Direction contract

THESIS: The Gear Rack. The 4 Gear items stand side by side on the calm wall of the Barracks like pegs on a rack, each with a notched level groove, so all progress compares at a glance. It refuses the category default of a character paper-doll with equipment slots around a figure, and of a settings-style list of rows.

OWN-WORLD: Inherited Painted Tabletop. Night Plate HUD plates with gold-trim borders over a dim painted Barracks inside; a 10-notch groove cut into each plate (plate-socket well, gold-filled notches); Inter 900 tabular numbers; Cinzel item names; one gold upgrade button per Gear plate; a wood "Change Deck"; the Class seal is the Class glyph in ink on the radial parchment plate of the Skill Card emblem.

STORY: The Player sees what the Hero is now (Class, Deck, Hero HP and why), reads what each item gives now and next and what it costs, presses, watches the notch fill and the Coin count down, and presses again.

FIRST VIEWPORT: The Barracks inside covers the screen, dim at the center. Top left: a title plate (helmet glyph, "Hero" in Cinzel: the name of the Town Bar shortcut and of the Barracks label, as the Workshop titles its screen). Top right: the Balance Plate. Under them, centered on the calm wall: the Hero plate across the width (Class seal, Class name in Cinzel, Deck name, wood Change Deck; the Hero HP number in Inter 900 with its sum line). Under it: 4 tall Gear plates in one row, equal width and height, each with its icon, name, groove, "4 / 10", stat now → next, and the gold upgrade with its Coin price at the bottom edge. The Town Bar at the bottom.

FORM: Gear Rack, position 1 of 3 on the shape round. Seed key: none. No concept-seed roll ran: the user locked the form in the shape round through the structured question ("Gear Rack (Recommended)", selected), then said "just build it".

Signature interaction: one press fills the next notch with a short gold flash, the level number hops, the stat rolls to its new value, an anvil-family sound plays, and the Coin counts down on the Balance Plate in 700ms; an Armor upgrade also counts up the Hero HP. Reaching level 10 stamps a "Max" seal one time. Motion grammar: 100ms press, 700ms counts, 380ms stamp; reduced motion changes the values at once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
