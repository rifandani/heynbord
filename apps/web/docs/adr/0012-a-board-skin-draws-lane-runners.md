# A Board skin draws Lane runners

The Bazaar sells Board skins for 200 Heynstones each, the highest price of a family (Economy 3.5). GDD 10 says that a Board skin is the "Lane and Square look". But the Board has no Lane and no Square to change: web ADR-0006 removed the 3D Board, and the Squares are not drawn. Thus a Board skin had no surface, and the Bazaar sold it with a family glyph and no Use.

## Decision

- **A Board skin puts a Lane runner under each Lane.** A Lane runner is a painted strip on the ground plane, with one tile for each Square and a joint between two Squares. The Battle Painting of the Region stays around the Board. The gaps between the Lanes and the Hero places stay bare.
- **The Standard ground is the look of web ADR-0006.** When no Board skin is Active, the Board has no runner and no drawn Square. Only a Player who selects a Board skin sees the Squares at rest.
- **The art is a Square sheet.** Each Board skin is one top-view painting at 1536 × 1024: 6 × 4 separate tiles of 256 px, one Square each. The game selects one of the 24 tiles for each Square with a fixed hash, and 2 Squares next to each other never get the same tile. Code adds the soft Lane edge and the contact shade.
- **The whole Board shows the Player's Board skin.** The Board is shared, so the enemy half shows it too. The enemy Side has no Board skin. Every Battle shows it: a Stage, a Dungeon, a Heynspire Floor, the tutorial, the Battle Log and Watching a Replay. A Replay shows the Board skin of the viewer.
- **Units first.** There is no tint over the screen. The time of day of a skin (dawn, dusk, night, moon) stays in its tiles. The Closed Lane band, the Field Effect tiles, the Front Brackets and the target markers draw on top of the runners.
- **A skin with no painted sheet is not in the Bazaar,** the same as a Hero portrait with no face (ADR-0052).

## Considered Options

- **A Board skin replaces the Battle Painting.** Rejected. It is the most visible option, but every Region then looks the same, and the web glossary keeps the Battle Painting and the Board skin separate.
- **A time-of-day tint and props at the Lane ends.** Rejected. A tint over the painting makes the Units harder to read (Pillar 5).
- **The marker look only.** Rejected. The legal-Square markers show only when a card is selected: too small a change for the highest price in the Bazaar.
- **One painted strip for each Lane.** Rejected. A Lane is 12 Squares, and the AI image tool cannot make a 12:1 image.
- **One seamless tile for all Squares.** Rejected. 12 copies in a row look like a grid.
- **Tiles drawn in code.** Rejected for the same reason as the 3D Board in web ADR-0006: code art looks like a toy beside the painted art.

## Consequences

- This changes a part of web ADR-0006: "The Player sees no Square at rest" is true only for the Standard ground.
- The Battlefield Concepts rule "No Lanes and no Squares" stays for the Battle Painting. A Board skin is a layer on top of it, not a part of it.
- The Bazaar adds the shelf, the Standard ground plate and the Use to the Board skins section. Until the first sheet is painted, the section shows only the Standard ground.
- The rules do not change: `activeCosmetics.boardSkin` was already in Profile version 14.
- The brief of the sheets is [Board Skin Concepts](../../../../docs/game/18-board-skin-concepts.md).
