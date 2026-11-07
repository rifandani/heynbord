---
version: 1
slug: "src-features-town-components-town-bar-tsx"
primary_target: "src/features/town/components/town-bar.tsx"
related_targets: []
---

# Town Bar (the Royal Sash)

Scope: the Town Bar on each `/play` screen except the Battle (GDD 11.4). Mode: Operate. The Player finds and opens any of the 13 places fast, and can stow the bar to get the full painting back.

- Audience: the returning fan and the strategy card player, many times in each session. Desktop first, phone in landscape.
- Task: read a name, press a shortcut; or press the roller to stow or open the bar. Waiting rewards stay visible on the stowed bar.
- Content: `TOWN_SHORTCUTS` in order, then Settings. Current place, lock, tooltip, count badges and pad focus do not change.
- Constraints: open height 76px (52px on a short screen), stowed height 0. `--town-bar` stays the floor of each docked panel. The wood shelf stays removed. No new art, no second row.
- Unresolved: none.

## Shape round record

- 2026-11-06, `/impeccable shape`, "new UI for collapsible bottom menu", "3 alternatives and ur recommendation at the same time". Structured question "Which Town Bar design do I make the brief for?", options: "A: Royal Sash (Recommended)", "B: Hand of Cards", "C: Token Rail". Selected: "A: Royal Sash (Recommended)". The user confirmed the brief ("confirm"), then said "build it".
- Critique reference: the mock-up `town-bar-options.html` of this session, option A.

## Direction contract

THESIS: A thin royal sash under free icons. A 27px blue cloth gives each name its own ground on every screen, and the painted icons stand on it over the painting. It refuses the old full-height wood shelf, and it refuses names directly on busy art.

OWN-WORLD: Inherited Painted Tabletop. Deep blue woven cloth with a 2px `gold-trim` hem and a swallowtail cut end; a blue roller with bronze caps and the brass plate of the pull; `gold-trim` diamonds between groups; cream Inter 700 names; `cream-dim` for a locked name; the gold current label; gold reward tokens.

STORY: The Player reads the names on the cloth, sees 3 groups of places and Setting, and presses a shortcut. The Player presses the roller, sees the cloth wind away, and sees only the roller and the waiting rewards.

FIRST VIEWPORT: The bar fills the bottom edge. Town is at the left. 12 shortcuts and Setting spread evenly on the cloth, 66px icons stand above it, and the roller stands at the right corner. Diamonds stand before Deck, Objective and Setting. On a short screen the cloth is 11px, the icons are 48px, and names are hidden.

FORM: The Royal Sash, position 1 of 3 on the shape round. Seed key: none. No concept-seed roll ran: the shape-round pick replaces the roll, because this is one part of an established surface and the user chose the form in words. Code-led: no image generation is available.

Signature interaction: the cut end of the cloth moves right onto the roller in 460ms, `cubic-bezier(0.33, 0.9, 0.28, 1)`, and the roller grows from 30px to 40px. Each shortcut sinks 38px and fades in 200ms as the end reaches it, with a delay from the same curve. Open plays in reverse, 20ms apart after 90ms. The reward tokens fade in after 340ms. A saved stowed bar shows at once on load. With reduced motion, the state changes at once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
