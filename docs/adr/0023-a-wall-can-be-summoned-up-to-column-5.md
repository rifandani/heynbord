# A Wall can be summoned up to Column 5

A Hero can summon a Unit with the **Wall** Keyword into any empty Square of Columns 1 to 5 of an open Lane, also past an enemy Unit. All other Units still use the **Summon Zone**, Columns 1 to 3 ([ADR-0011](./0011-the-summon-zone-is-3-columns-deep.md)). Columns 4 and 5 are not part of the Summon Zone: the Wall Keyword gives the exception. The rule is the same for both Sides and for all Heroes, also AI Heroes and Bosses.

We did this because a Wall has Speed 0. Other Units act in the Turn when they are summoned, so a Speed 2 Unit summoned into Column 3 is at Column 5 after its first Turn. A Wall stays where it is summoned for the full Battle, so its only control is the Square that it goes into. At Column 3 it stopped enemies near its own Hero and left only 2 Squares behind it for friendly Ranged Units. A barricade that sits next to the Hero also looks wrong. Column 5 gives a Wall the same reach as a typical Unit after its first Turn, and it leaves Columns 6 to 9 free before the enemy Summon Zone.

## Considered Options

- **Keep Columns 1 to 3 for all Units.** Rejected. A Wall cannot take ground, and its placement is not a real choice.
- **Columns 1 to 4.** Rejected. A smaller change, but it has no reason to stop at that Column.
- **Up to 1 Square in front of the farthest friendly Unit in the Lane.** Rejected. It fits the story, but it is a new kind of rule that is harder to read on the Board and for the AI to use.
- **The Wall Role or Base Speed 0 gets the exception.** Rejected. No Battle rule uses the Role, and a future Unit with Speed 0 that is not a Wall would get the rule as a surprise. The Wall Keyword and the Wall Role always go together.
- **A Wall must be nearer its Hero than the nearest enemy Unit.** Rejected for the same reason as in ADR-0011.
- **Give the Wall Keyword Power Points now.** Rejected. We do not know the size of the buff yet. The Keyword stays at 0 points, and the simulator decides if it must change.

## Consequences

- The deeper zone is a buff for the 5 Wall Cards and for Decks with Shooters behind a Wall. The change is accepted only if no Archetype goes past the Matchup limit and no Stage loses its margin.
- The AI already prefers the deepest Square that blocks the enemy, so an AI Wall usually goes into Column 5. The AI code does not change.
- Two Walls that face each other in a Lane can have only 2 Squares between them.
