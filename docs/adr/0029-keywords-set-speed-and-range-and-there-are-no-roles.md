# Keywords set Speed and Range, and there are no Roles

Each Creature Card had a **Role** before: Frontliner, Striker, Runner, Shooter, Support or Wall. No Battle rule used it, but the Role set the Speed and the Range of a card ([ADR-0022](./0022-no-range-above-3-and-entangle-only-on-epic-ranged-units.md)). A Unit had Speed 1 unless its Role or a written reason gave more. Thus a Player had to learn the Roles and then remember which number each Role gave. Many cards also broke the Role pattern with a written reason. Now there are no Roles. Six Keywords tell the Speed and the Range of a card. This ADR replaces the Role rule of Speed and the Range limit of ADR-0022. The Entangle limit of ADR-0022 stays.

We decided:

- **Each Unit has Base Speed 2 and Base Range 1.** This includes each Token, each Wall and each Flying Unit. A card has no Speed or Range number of its own. Only Keywords, Statuses and Skill Cards change the numbers.
- **A Melee Unit has Range 1, and a Ranged Unit has Range 2 or more.** A Melee Unit had no Range before (Range 0 in the data). Retaliate, Knockback, Trample, First Strike and Pivot use the same Melee and Ranged difference as before.
- **Six Keywords change the base:**

  | Keyword | Change | Result | Power Points |
  | --- | --- | --- | --- |
  | Swift | +1 Speed | Speed 3 | 2 |
  | Fleet | +2 Speed | Speed 4 | 4 |
  | Heavy | −1 Speed | Speed 1 | −2 |
  | Mid-range | +1 Range | Range 2 | 1 |
  | Long-range | +2 Range | Range 3 | 2 |
  | Extreme-range | +3 Range | Range 4 | 3 |

- **The values are the same at each Rank.** A Range change of 1 Square changes the win rate much more than its Power Points ([ADR-0022](./0022-no-range-above-3-and-entangle-only-on-epic-ranged-units.md)), so Combine must not add Range or Speed.
- **A card has at most 1 Speed Keyword and at most 1 Range Keyword.** It can have one of each, for example Heavy and Long-range (Speed 1, Range 3).
- **Only a card with Base Rank Epic or higher has Extreme-range.** This is the one guard that stays from the Range 4 problem of issue #23.
- **There is no maximum Range.** A Skill Card such as Hunter's Focus can add Bonus Range to a card with Extreme-range.
- **No guard stops a fast Ranged Unit or a fast Flying Unit.** A Ranged card can have Swift or Fleet, and a Flying card can have Swift or Fleet. The simulator and the Power Budget control them.
- **The base is free in the Power Points.** Only the six Keywords cost points. The Power Budget goes down by 2, the old cost of Speed 1: `budget = 19 + 3 × (Countdown − 3)`. Thus a card that had Speed 1 keeps its Attack and HP, and it becomes Speed 2. All cards get faster together.
- **Swift is an Orc Main Keyword, Long-range is an Elf Main Keyword, and Heavy is a Human Main Keyword.** Other Races can borrow them. They replace the Role profile of each Race (GDD 12).
- **The card icon shows a rules fact:** a sword for a Melee Unit, an arrow for a Ranged Unit, a wall for Wall and wings for Flying. A Wall card shows no Speed and no Range.

The 90 cards change as follows. The balance pass then changes the cards one at a time.

| Before | Keywords | Result |
| --- | --- | --- |
| 14 Shooters, Range 3 | Long-range | Range 3, Speed 2 |
| 7 Ranged Supports, Range 2 | Mid-range | Range 2, Speed 2 |
| 16 Frontliners, Speed 1 | Heavy | Speed 1 |
| 13 Runners, Speed 2 or 3 | Swift | Speed 3 |
| King's Courier, Speed 4 | Fleet | Speed 4 |
| 3 Orc Strikers, Speed 2 | Swift | Speed 3 |
| All other cards, Speed 1 | none | Speed 2 |
| 7 Walls | none | no Movement |
| Tokens Skeleton and Restless Wisp, Speed 2 | none | Speed 2 |

## Considered Options

- **Keep the Roles.** Rejected. No Battle rule used them, and a Player could not read a stat from a Role without a table. Keywords show the same information on the card itself.
- **Each card keeps a printed Speed and Range, and the Keywords are only labels.** Rejected. Then the data can have Speed 4 with Swift by mistake. With Keywords as the only source, the number and the Keyword always agree.
- **One value Keyword, as Charge N: Swift N and Ranged N.** Rejected. "Ranged 2" means Range 3, which confuses a Player. Three fixed names for each type are easier to read.
- **Values that increase with the Rank, as Charge N and Knockback N.** Rejected. Combine would make the Ranks hard to balance, for the reason above.
- **Keep "No Unit has a Range of more than 3".** Rejected. Skill Cards already give Range 4, and the Epic guard on Extreme-range keeps the known risk small.
- **Guards on fast Ranged Units and fast Flying Units (the old Role-era guards).** Rejected. The Keywords must be the only card rule for Speed and Range. The simulator and the Power Budget find a card that is too strong.
- **Count the base Speed from 0 in the Power Points.** Rejected. Base Speed 2 then costs 4 points on each card, and each card that had Speed 1 loses 1 Attack or 2 HP. The speed-up is the same for all cards, so it is not a cost for one card.
- **"Sprint", "Cavalry" and "Hindered" as names.** Rejected. "Sprint" is on the _Avoid_ list of Charge. "Hindered" sounds like Hobbled. "Cavalry" is a type of soldier, not a trait, and a Feral or Goblin card with it reads strangely.

## Consequences

- A Wall card gains about 2 points against the lower budget, because its Speed 0 cost 0 points before and its base is free now. The cards with Heavy and the cards with Long-range go below their budget, because Heavy costs −2 points and Long-range costs 1 point less than Range 3 did.
- Hunter's Focus on a Melee Unit now gives Range 2, not Range 1. On a card with Long-range it gives Range 4.
- The Token Power goes down by 4, because the Base Speed is free. The Summon points of the cards that summon a Token go down by 2.
- The balance pass of 2026-10-14 changed only HP ([08 — Archetypes, 3.1](../game/08-archetypes.md#31-balance-changes)). 24 cards got the smallest HP change that puts them within ±10% of the new budget. The Orc melee cards of Raiders got +1 HP each, to exactly their budget. With only the budget fit, Vanguard won 74.6% against Raiders. With the Raiders HP, it wins 56.5%. Before this ADR, it won 58.7%.
- Stages 1-7 and 1-8 got less Gear, and their Rare copies became Uncommon ([14 — Campaign Stages](../game/14-campaign-stages.md)). Stages 1-5 (55.9%), 1-7 (57.1%) and 1-8 (47.0%) with Raiders still miss the 60% to 80% target. Before this ADR, 3 Stages also missed their target. Thus the CI balance gate fails as it did before: 3 Stage misses, and the main Matchup at 56.5% for the target of 45% to 55%.
- The faster Long-range Units made Thornwatch stronger, but it stays below 45% against both main Archetypes: 40.0% against Vanguard and 40.8% against Raiders (25.3% and 29.0% before this change). The diagnostic Archetypes do not block.
- A Runner had Speed 2 before. With Swift, it has Speed 3, also a Flying Runner.
