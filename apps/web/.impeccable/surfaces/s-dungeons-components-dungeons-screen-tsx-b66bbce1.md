---
version: 1
slug: "s-dungeons-components-dungeons-screen-tsx-b66bbce1"
primary_target: "src/features/dungeons/components/dungeons-screen.tsx"
related_targets: ["src/features/town/town.ts","src/features/battle/components/overlays.tsx"]
---

# Dungeons screen (the cave)

Scope: the Dungeons state of `/play` (GDD 8.4, 11.4, issue #94). Mode: Operate. The Player reads the Bosses of a Dungeon and their Fronts, selects a Deck, and starts the Dungeon Battle. Later visits are for repeat wins (Forge Stones).

- Audience: the returning fan and the strategy card player at Player level 10 or more, between Battles. Desktop first, phone in landscape.
- Task: before the first win, learn which Boss holds which Lanes and what each Boss Rule does, then Fight. After a win: Town, cave or shortcut, Fight, in two presses.
- Content: `DUNGEONS` and `DUNGEON_REWARDS` from the rules; `dungeonResults` (win count only) from the Profile. 1 to 4 Bosses; v1 has Dungeon 1 with 2 Bosses. Dungeons 2 and 3 are "Coming later" until their data exists.
- Constraints: no Sweep (no Stars), no Auto-play, no Boss portraits. The cave inside painting (`public/town/cave-inside.webp`, brief in 11 — Town Concepts 13) covers the screen; a calm rock and timber scene in code is its fallback. Below level 10, the cave and the shortcut are locked; the screen does not open. A 4:3 screen crops the cave Building, so the shortcut is the sure way in.
- Unresolved: Boss portraits; draft names and the draft "Wanted" lines.

## Direction contract

THESIS: The Wanted Board. Each Boss is a parchment wanted poster pinned on the mine notice board, over a Front strip of the 4 Lanes, so who holds which Lanes reads at a glance. It refuses the category default of a level-select list with a detail page, and a Stage Panel dialog that hides the briefing.

OWN-WORLD: Inherited Painted Tabletop. Parchment posters with bronze tacks on a frame-wood board, red Front Brackets and numbered pins (the Boss number, never color alone), Night Plate HUD plates with gold-trim, the Boss Rule notch of the Battle Boss plates on each poster HP bar, a blood-banner "Bounty claimed" stamp, one gold Fight.

STORY: The Player reads the posters (name, Class, HP, Boss Rule, Lanes), sees on the strip where each Boss stands, checks the rewards and the Deck, and presses Fight. After a win, the posters fold into slips with the "Bounty claimed" stamp (not "Defeated": a Routed win does not take each Boss to 0 HP, and the Profile keeps only the win count); the rewards and Fight lead.

FIRST VIEWPORT: Code scene covers the screen. Top left: Dungeon tabs (1 open, 2 and 3 boarded "Coming later"). Top right: Balance Plate. Body, centered above the Town Bar: at the left, about 2/3 wide, the notice board with one poster per Boss in a row and the Front strip under them; at the right, a parchment rail with the Dungeon name, Recommended level, rewards, the Deck radio group with Edit Decks, and the full-width gold Fight, which has the focus.

FORM: Wanted Board, position 6 of 7 on the shape round (dealt lead). Seed key: 4b0fb0f4.

Signature interaction: focus or hover on a poster lights its Front Bracket and the Squares of its Lanes on the strip, and hover on a Bracket lights its poster (the Brackets take no focus: the posters carry the keyboard path). The posters ink in one after the other; after a win, the "Bounty claimed" stamp stamps on each slip (`pack-stamp`). Motion grammar: 300ms screen fade, `stage-panel-ink` stagger, `stage-panel-deal` for the reward card; reduced motion shows all at once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
