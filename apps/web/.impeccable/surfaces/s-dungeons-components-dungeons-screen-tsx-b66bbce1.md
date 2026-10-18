---
version: 1
slug: "s-dungeons-components-dungeons-screen-tsx-b66bbce1"
primary_target: "src/features/dungeons/components/dungeons-screen.tsx"
related_targets: ["src/features/dungeons/components/dungeon-panel.tsx","src/features/town/town.ts","src/features/battle/components/overlays.tsx"]
---

# Dungeons screen (the cave)

Scope: the Dungeons state of `/play` (GDD 8.4, 11.4, issue #94). Mode: Operate. The Player reads the Bosses of a Dungeon and their Fronts, selects a Deck, and starts the Dungeon Battle. Later visits are for repeat wins (Forge Stones).

- Audience: the returning fan and the strategy card player at Player level 10 or more, between Battles. Desktop first, phone in landscape.
- Task: before the first win, learn which Boss holds which Lanes and what each Boss Rule does, then Fight. After a win: Town, cave or shortcut, Enter (the Dungeon Panel), Enter (Fight).
- Content: `DUNGEONS` and `DUNGEON_REWARDS` from the rules; `dungeonResults` (win count only) from the Profile. 1 to 4 Bosses. Dungeon 1 has 2 Bosses and opens at Player level 10, Dungeon 2 (3 and 1 Lanes) at level 20, and Dungeon 3 (3 Bosses) at level 30.
- Constraints: no Auto-play, no Boss portraits. The Dungeon Sweep (ADR-0041) uses Dungeon Sweep Tickets and never the Campaign ones, and it comes with a win. The cave inside painting (`public/town/cave-inside.webp`, brief in 11 — Town Concepts 13) covers the screen; a calm rock and timber scene in code is its fallback. Below level 10, the cave and the shortcut are locked; the screen does not open. A 4:3 screen crops the cave Building, so the shortcut is the sure way in.
- Unresolved: Boss portraits; draft names and the draft "Wanted" lines.

## Direction contract

THESIS: The Wanted Board. Each Boss is a parchment wanted poster pinned on the mine notice board, over a Front strip of the 4 Lanes, so who holds which Lanes reads at a glance. It refuses the category default of a level-select list with a detail page, and a Stage Panel dialog that hides the briefing.

OWN-WORLD: Inherited Painted Tabletop. Parchment posters with bronze tacks on a frame-wood board, red Front Brackets and numbered pins (the Boss number, never color alone), Night Plate HUD plates with gold-trim, the Boss Rule notch of the Battle Boss plates on each poster HP bar, a blood-banner "Bounty claimed" stamp, one gold Fight.

STORY: The Player reads the posters (name, Class, HP, Boss Rule, Lanes), sees on the strip where each Boss stands, and opens the Fight bar. The Dungeon Panel has the rewards, the Deck choice with Edit Decks, and its own gold Fight. After a win, the posters stay full with the "Bounty claimed" stamp (not "Defeated": a Routed win does not take each Boss to 0 HP, and the Profile keeps only the win count); the rewards, the repeat-win chances, the Dungeon Sweep and Fight lead.

FIRST VIEWPORT: Code scene covers the screen. Top left: Dungeon tabs (1 open, 2 and 3 locked with their level). Top right: Balance Plate. Body, one column centered above the Town Bar and only as wide as its posters: the notice board with one poster per Boss in a row and the Front strip under them, and directly under the board, centered and only as wide as its label, the gold Fight, which has the focus. The board takes the height that is left and scrolls.

FORM: Wanted Board, position 6 of 7 on the shape round (dealt lead). Seed key: 4b0fb0f4.

Second viewport, the Dungeon Panel: a parchment sheet (460px, 720px on a short screen) out of the Fight bar, on a 55% scrim, as the Stage Panel and the Floor Panel. The cave seal, the Dungeon name as the title, "Dungeon 1 · Recommended level 10", "Not won yet" or the "Wins: N" chip, and the close button. Then the Reward row and the Deck row (2 columns, the `wide` form), and, on a won Dungeon, the Sweep row. Its rows scroll and its actions (the gold Fight, and the gold Sweep beside it on a won Dungeon; the Sweep Result's Close and Sweep Again after a Sweep) stay at the bottom of the sheet. A locked Dungeon has no panel: its plate takes the place of the bar.

Signature interaction: focus or hover on a poster lights its Front Bracket and the Squares of its Lanes on the strip, and hover on a Bracket lights its poster (the Brackets take no focus: the posters carry the keyboard path). The posters ink in one after the other; after a win, the "Bounty claimed" stamp stamps on each poster (`pack-stamp`). Motion grammar: 300ms screen fade, the panel out of the Fight bar (`settings-sheet-x`, `settings-sheet-y`), `stage-panel-ink` stagger, `stage-panel-deal` for the reward card; reduced motion shows all at once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
