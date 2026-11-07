# Each Combine of a Creature Card raises a value

[ADR-0057](0057-each-combine-of-a-skill-card-changes-its-effect.md) gave Skill Cards a change on each Combine, but Creature Cards had no such rule. Ankle Snatcher and Fernwing Courier were the same at Uncommon and Rare: 4/4, with the same Keywords. A printed 3 rounds to 4 at ×1.2 and at ×1.45, so a Player paid copies and Coin for no change. They were the only 2 flat steps in the 258 Combine steps of the 96 Creature Cards. Now each Combine of a Creature Card raises at least 1 of its Attack, its HP or a Keyword value, and no value goes down at a higher Rank (grill on 2026-11-07).

## The rules

- **One value is sufficient.** Attack, HP or a Keyword value can be the change. 53 of the 258 steps change only 1 stat, and a Unit with Base Attack 0 can never raise its Attack.
- **An override is an exception to the Stat scale.** A Creature Card can name an exact Attack or HP for a Rank: `overrides: { rare: { hp: 5 } }`. This adds to [ADR-0020](0020-the-power-budget-measures-a-card-at-its-base-rank.md), where a copy always plays with the Stat scale of its Rank.
- **An override applies only at the Rank that it names.** Each other Rank uses the Stat scale. A Keyword table is different: a missing Rank uses the nearest lower Rank. With that behavior, HP 5 at Rare would also be HP 5 at Legendary.
- **The Rank is first in the data.** One entry holds all the changes for one Rank, the same as the Rank table of a Token. An override has only Attack and HP, because Keywords already have Rank tables.
- **A test holds the rule.** The content test has no list of allowed flat steps, so a new card with a flat step fails.

Ankle Snatcher and Fernwing Courier now have 3/3, 4/4, 4/5, 5/5 and 6/6. The Rare Power Points are 16 and 19, against a Power Budget of 18.8 and 23.1.

## Considered Options

- **Attack and HP must both go up at each Combine.** Rejected. It fails 53 steps, and it can never pass on a card with Attack 0.
- **Uncommon 4/3.** Rejected. It gives 3/3, 4/3, 4/4, 5/5 and 6/6, which has no flat step. But it lowers the copies that Players own, 9 Stage copies and 15 Floor copies, to fix a step that is above Uncommon.
- **Rare 5/4.** Rejected. It moves the small step to Epic, where the card then gets only +1 HP.
- **Printed 3/4.** Rejected. It needs no exception, but it changes all 27 copies of Ankle Snatcher in the Stage, Archetype and Dungeon lists, and the sim checks are sensitive to Common and Uncommon values (issue #189).
- **Hobble 2 at Rare.** Rejected. It fixes only Ankle Snatcher. Swift and Flying have no value, so Fernwing Courier needs a stat change.
- **A rule that gives +1 HP after a flat step.** Rejected. It needs no card data, but neither the card data nor the Stat scale shows the value.
- **Attack and HP as full Rank tables.** Rejected. They repeat the Stat scale, they hide the 1 value that is different, and the fit scripts do math on the printed values.
- **`overrides: { hp: { rare: 5 } }`.** Rejected. It has the shape of a Keyword table, but a missing Rank acts differently.

## Consequences

- The Battle, the Power Points, the AI and the card UI read Attack and HP from 1 function, `creatureStats`. A new reader must not use `scaleForRank` for a Creature Card.
- `overrides` can also take a new stat in a later version. Keywords stay out until a card needs them.
- No Stage, Archetype, Dungeon or Floor list has a Rare copy of these 2 cards, so `sim:check` did not change.
- The Stat scale table in the GDD and the Handbook stays correct for the other 94 Creature Cards. These 2 cards are the written exception.
