# A Side has 1 or more Heroes

A **Battle** has two **Sides**, and each Side has 1 or more **Heroes**. Each Hero has its own **Front** (the Lanes behind it), Deck, Hand, Graveyard, Class and Gear. All the Heroes of a Side play in the same Turn. A Hero at 0 HP is **Defeated**: its Units and Field Effects are removed, and its Front goes to the nearest Hero of its Side that is not Defeated (if two Heroes are at the same distance, the Hero with the lower Lane number gets it). A Side loses only when all its Heroes are Defeated.

We did this because v1 **Dungeons** put 1 to 3 **Bosses** in one Battle, and a Boss is a Hero. The same model also supports the 2v2 and 4v4 modes on the roadmap. In v1, the Player's Side always has exactly 1 Hero.

## Considered Options

- **One Battle for each Boss.** Rejected. A Dungeon is then a sequence of 1v1 Battles, and the Player does not fight the Bosses together. It also gives no base for 2v2 and 4v4.
- **One enemy Hero with Boss Units on the Board.** Rejected. A Boss is then a Unit, not a Hero, and the word "Boss" means a different thing in a Boss Stage and in a Dungeon.
- **All the Heroes of a Side stand behind all the Lanes, and a Unit selects a target Hero.** Rejected. The Player cannot see which Boss each Lane threatens, and the Lane is no longer the single route of a Unit.
- **A Side loses when any of its Heroes is Defeated.** Rejected. A Dungeon with 3 Bosses is then easier than a Dungeon with 1 Boss, because the Player only kills the weakest Boss.

## Consequences

- `SideState` in `packages/rules` changes from one `hero` with one `deck`, `hand` and `graveyard` to a list of Heroes. Each Hero has its own Deck, Hand and Graveyard. Commands and Battle Events that name a side must also name a Hero.
- The `heroDefeated` result ends the Battle only when the last Hero of a Side is Defeated. A new Battle Event tells the app when a Hero is Defeated and its Front moves.
- A Unit belongs to the Hero that summoned it, and uses that Hero's Gear for Crit and Block. Any Hero of a Side can summon into the Summon Zone of any Lane of that Side.
- Units of a Defeated Hero do not go to the Graveyard, and Last Breath and Rebirth do not occur. With death effects, Rebirth and Tokens would put Units on the Board for a Hero that is out of the Battle.
- Sudden Death hits each Hero of the active Side that is not Defeated.
- Each Hero needs at least 1 Lane. A Board has 3 or 4 Lanes ([ADR-0010](./0010-the-type-of-battle-sets-the-number-of-lanes.md)), so a Side has at most 4 Heroes. In v1, a Dungeon has at most 3 Bosses.
