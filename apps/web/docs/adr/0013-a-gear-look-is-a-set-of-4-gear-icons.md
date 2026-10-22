# A Gear look is a set of 4 Gear icons

The Bazaar sells 6 Gear looks for 100 Heynstones each (Economy 3.5). But the game draws Gear in one place only: the 4 painted icons on the Gear plates of the Hero screen. The Battle, the Top Bar and the Board show no Gear. Thus a Gear look had no surface, and the Bazaar sold it with a family glyph and no Use, the same problem that the Board skins had before web ADR-0012.

## Decision

- **A Gear look is one painted icon for each of the 4 Gear items.** The Weapon, the Armor, the Trinket and the Banner, all in one material: copper, iron, leather, inlaid steel, moonstone or plate. The icons replace the 4 icons on the Gear plates of the Hero screen.
- **One look for all 4 items.** One Active Gear look changes the 4 icons together (ADR-0054: one Active Cosmetic for each family).
- **Each look keeps the 4 objects.** The Weapon is always a short broad sword, the Armor a breastplate, the Trinket a round amulet and the Banner a swallowtail pennant. Only the material, the color and the ornament change, so the Player knows each item at once and no look shows a Class.
- **The Standard kit is the current 4 icons** in royal blue, gold and steel. It is the look when no Gear look is Active.
- **A Gear look with fewer than 4 painted icons is not in the Bazaar,** the same as a Hero portrait with no face (ADR-0054) and a Board skin with no sheet (web ADR-0012).
- **The Handbook, the Hints and the unpainted fallback keep the Gear glyphs.** A Gear look changes only the painted icons.

## Considered Options

- **The icons, and also a mark in the Battle**, for example a Banner pennant on the Player's Hero banner. Rejected for now. More marks on the Battle screen go against Units first (Pillar 5), and the layout needs its own design. It can come later on top of this decision, with the same icons.
- **A Hero figure that wears the Gear.** Rejected. The game has no Hero figure, the Hero screen refuses a paper doll (its Gear Rack thesis), and each look then needs a full body painting.
- **One look for each Gear item.** Rejected. It needs 4 families or a change to the selection model of ADR-0054, for a look that shows on one screen.

## Consequences

- The Bazaar adds the shelf, the Standard kit plate and the Use to the Gear looks section. The shelf shows the 4 icons in a 2 × 2 grid.
- The Hero screen shows the icons of the Active Gear look. Its constraint "no Gear looks" ends.
- The rules do not change: `activeCosmetics.gearLook` was already in Profile version 14.
- The brief of the icons is [Gear Look Concepts](../../../../docs/game/19-gear-look-concepts.md).
