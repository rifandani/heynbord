# A Boss Front is a code-drawn Bracket on the ground

In a Dungeon (GDD 8.4), each Boss holds some of the 4 Lanes: its Front. The Player must see which Lanes each Boss holds, and see a Front move to another Boss when a Boss is Defeated (GDD 11.2). The Board shows it with a **Front Bracket**: a rounded frame on the ground in the enemy Side color, under the Boss and across the Lanes of its Front. A shader draws it from its distance field, so its line keeps its width when it grows over more Lanes. Each Boss stands at the middle of its Front, on its Bracket. The Top Bar repeats the same fact as a Lane strip on each Boss plate.

We did this because the Battle Painting cannot know the Fronts: one painting is for all the Battles of a Region (web ADR-0007), and a Front changes in the Battle. A mark in code can move and grow with a `FrontMoved` event, as the Stage Markers on the Region Map are code-drawn on a fixed painting (web ADR-0008).

## Considered Options

- **Only the Lane strip in the Top Bar.** Rejected. The Player then reads the HUD and then the Board, and the change of a Front has no place on the Board.
- **Tint the Lanes of each Front.** Rejected. A tint over whole Lanes covers the Squares and the Units (the Clear Board Rule in DESIGN.md), and the Squares are not drawn (web ADR-0007).
- **A painted decal for each Front.** Rejected for now. A Front can be 1, 2 or 3 Lanes and it grows in the Battle, so a fixed image must stretch. A painted decal can replace the shader later, with the same place and size.

## Consequences

- The Bracket stays outside the Board: it ends before the last Column, so it never covers a Square.
- In a Dungeon, the Boss figures are 70% of their Stage size, because a full figure is wider than one Lane.
- A Stage shows no Bracket, and its Battle looks the same as before.
