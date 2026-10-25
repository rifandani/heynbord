---
version: 1
slug: "s-dungeons-components-dungeons-screen-tsx-b66bbce1"
primary_target: "src/features/dungeons/components/dungeons-screen.tsx"
related_targets: ["src/features/dungeons/components/dungeon-panel.tsx","src/features/dungeons/components/mine-shaft.tsx","src/features/dungeons/dungeon-art.ts","src/features/town/town.ts","src/features/battle/components/overlays.tsx"]
---

# Dungeons screen (the mine)

Scope: the Dungeons state of `/play` (GDD 8.4, 11.4, issue #94). Mode: Operate. The Player rides the lift down the mine, reads the Bosses of a Dungeon and their Fronts, selects a Deck, and starts the Dungeon Battle. Later visits are for repeat wins (Forge Stones) and the Dungeon Sweep.

- Audience: the returning fan and the strategy card player at Player level 10 or more, between Battles. Desktop first, phone in landscape.
- Task: before the first win, learn which Boss holds which Lanes and what each Boss Rule does, then Fight. After a win: Town, cave or shortcut, Enter (the stop), Enter (Fight, or Sweep when the Player has Dungeon Sweep Tickets).
- Content: `DUNGEONS` and `DUNGEON_REWARDS` from the rules; `dungeonResults` (win count only) from the Profile. 1 to 4 Bosses on 4 Lanes. Dungeon 1 (2 + 2) opens at Player level 10, Dungeon 2 (3 + 1) at level 20, Dungeon 3 (1 + 2 + 1) at level 30.
- Constraints: no Auto-play, no Boss portraits (Class sigils only). The Dungeon Sweep (ADR-0039) uses Dungeon Sweep Tickets only and comes with a win. Below level 10, the cave and the shortcut are locked; the screen does not open. No close button: the Town Bar closes the screen.
- Adaptations: a locked stop can be selected; the panel shows a preview with "Opens at level N", the lift over it is locked (gate shut, with a padlock) and the lair is dim. The 3 stops, the lift, the locked lift and the shaft rock are painted (11 — Town Concepts 13); a Dungeon whose stop is not painted shows the softened cave inside.
- Unresolved: Boss portraits; draft names and the draft "Wanted" lines.

## Direction contract

THESIS: The Lift. Heynspire climbs into the sky; the Dungeons go down into the earth. The screen is one mine that the Player rides: the painted stop of the selected Dungeon fills the screen — the empty lift well at the left, the lair with its Bosses in the middle, calm rock at the right, under the panel — and the same lift cut-out stands in the well. When the Player selects another Dungeon the lift stays and the world moves: the stop slides away, the shaft rock goes past, and the new stop comes in. It refuses a scroll of small chambers, a Front diagram that the Player must decode, and a modal over the scene.

OWN-WORLD: Inherited Painted Tabletop. One painted lair per Dungeon, cold rock cut from the cave painting, a Tavern Wood lift with iron brackets, a brass lantern and a hemp rope, and a small cheerful Goblin liftkeeper; the seamless shaft-rock tile; the rope, the markers and the iron cage of the Depth Gauge; the red numbered Boss pin; a blood-banner "Bounty claimed" stamp; one gold action in a docked parchment Dungeon Panel.

STORY: The Player opens the mine on the lit stop of the deepest open Dungeon, sees the Bosses in their lair, reads each dossier (HP with the Boss Rule notch, the rules, the Units at the start) in the panel, and presses Enter twice. They ride to a locked stop to read what waits below: the locked lift and a dim lair. After a win they come back to the stamps at the feet of the Bosses; after a level-up, the light of the next stop comes up and its lift unlocks.

FIRST VIEWPORT: The stop painting fills the height of the screen (3:2, anchored at the left; the shaft rock fills what is left at the right). Left: the lift in the empty well, its rope up to the top edge, and the Depth Gauge at the far left, its cage on the selected marker. Top right: the Balance Plate. Right: the docked Dungeon Panel (min(440px, 38vw)) with the gold Fight at its foot. The selected stop has the focus.

FORM: The Lift (one mine, one stop per Dungeon), pinned by the user in the design question (option 1 of 3, confirmed); replaces The Descent (a scroll of chambers with slips). No seed roll: a user-pinned direction beats the roll. Seed key: none (user-pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: focus or hover on a Boss Dossier in the panel lights that Boss on the painting (a warm glow over the box that a person measured on the painting); the lift cage of the Depth Gauge rides its rope to the selected stop. Motion grammar: 300ms screen fade; the panel inks in the new Dungeon (`stage-panel-ink`); the cage slides on the rope (420ms, ease-out); the world slides on a ride (380ms, plus 220ms for each further stop, so a deeper ride takes more time); the light of a newly opened stop comes up (`mine-wake`); `pack-stamp` on the stamps after a new win. Reduced motion shows all at once.
