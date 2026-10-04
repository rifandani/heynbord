# The type of Battle sets the number of Lanes

The number of **Lanes** comes from the type of Battle, not from each Stage. A **Stage** has 3 Lanes. A **Dungeon**, a Heynspire **Floor** and a Battle with 2 or more **Players** (co-op and PvP, after v1) have 4 Lanes. Content data cannot set the number of Lanes. A Stage or a Dungeon can make the Board smaller only with **Closed Lanes**. Stage 1-1 (the **Tutorial**) and Stages 1-2 and 1-3 have no Closed Lanes: all 3 Lanes are open.

We did this so that the Board has one shape for each type of Battle. The Player sees immediately that 4 Lanes means a special mode. The 3D Board, the camera and the phone layout need to support only two Board sizes. Content cannot break the rule.

## Considered Options

- **Each Stage sets its number of Lanes (1 to 4).** This was the old GDD rule, and it is how the original games worked. Rejected. The Board changes shape from Stage to Stage, and the camera and layout must support every size.
- **Each Stage keeps a Lane value, and a content test checks it.** Rejected. The data then has a value that can only be one number.
- **The tutorial is an exception with 1 and 2 Lanes.** Rejected. The Board must keep one shape.
- **The tutorial closes Lanes for the full Battle (1-1 opens only Lane 2, 1-2 and 1-3 open Lanes 1 and 2).** This was the first version of this decision. Rejected. A Board with 1 or 2 usable Lanes teaches the player that the Board shape changes from Stage to Stage, and a dead Lane can look like a bug or a locked feature. In place of Closed Lanes, the Tutorial uses arrows and highlights (GDD 8.3).
- **Heynspire starts with 3 Lanes and uses 4 from a later Floor.** Rejected. Heynspire unlocks after the Region 3 Boss Stage, so the Player already knows Lanes. Rank and Hero HP make the Floors more difficult.

## Consequences

- Region difficulty no longer increases with more Lanes. It increases through enemy Decks, Hero HP, Units at the start and special rules.
- The Dungeon Fronts change to 2+2 (Dungeon 1), 3+1 (Dungeon 2) and 1+2+1 (Dungeon 3, where the Old Bramble holds the 2 center Lanes).
- A Side can have at most 4 Heroes ([ADR-0009](./0009-a-side-has-one-or-more-heroes.md)). v1 Dungeons still have at most 3 Bosses, and each v1 Floor has 1 enemy Hero.
