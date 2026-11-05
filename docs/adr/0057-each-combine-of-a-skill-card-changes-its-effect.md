# Each Combine of a Skill Card changes its effect

After the rebalance of [ADR-0055](0055-a-higher-base-rank-gives-a-power-budget-bonus.md), 36 of the 120 Rank steps on the 40 Skill Cards changed only Recall, and 17 cards had no effect change from Epic to Legendary. For example, Shield Wall had Bulwark 2 from Uncommon to Legendary. A Combine costs copies and Coin, so a Player had no reason to pay for a change that the card text did not show. Now each Combine of a Skill Card changes its effect, and no value of the effect goes down at a higher Rank (grill on 2026-11-05).

## The rules

- **A change on each step.** A Recall gain alone is not sufficient. A change to any value of the effect counts, for example more turns or more push Squares.
- **Rank Growth.** The Rank Growth of a Skill Card is its Power Points at Legendary divided by its Power Points at its Base Rank. The maximum is the Stat scale of Legendary divided by the Stat scale of the Base Rank. The minimum is 75% of the maximum. For a Common card, the range is ×1.58 to ×2.1. A Legendary Unit has ×2.1 HP, so a Skill Card with less growth becomes weaker against Units of the same Rank.
- **The nearest step.** A card can go over the maximum when no smaller rising line of whole numbers exists. This uses the idea of the nearest step in [ADR-0031](0031-a-skill-card-uses-the-power-budget-of-a-creature-card.md). The rule has priority over the maximum, because a card with a flat step is the problem that this ADR fixes.
- **The sim wins.** Power Points are a model. The swap rule also runs with all copies at Rare, Epic and Legendary, because the content Decks have no Legendary Skill copy.

## Considered Options

- **Only the Epic to Legendary Combine must change the effect.** Rejected. It leaves Rare and Epic steps with no effect change.
- **Keep the flat steps and show the Recall gain better.** Rejected. The ADR-0031 fit gives Recall weight 0. That fit used Base Rank cards only, so it does not prove the value of Recall at 35%, but no sim shows that Recall alone is a sufficient reward.
- **Use the Stat scale exactly.** Rejected. Small values cannot hit one exact number.
- **Restore Shield Wall to Bulwark 1/2/3/4/5.** Rejected. It is more than 2 times the maximum. Shield Wall gets more Turns.

## Consequences

- Each Skill Card effect value can be a Rank table, also `turns` on Shield Wall.
- Penance, Unbroken Vow and Onslaught had no Rank value, so each one gets a new part. The Onslaught change adds a value at its Base Rank, and the Power Points now count it. An Archetype has an Epic Onslaught, so this can move a Main Matchup.
- Some high-Rank values go down, for example Rain of Arrows at Legendary goes from 10 to 7.
- Common and Uncommon values do not change in this work, because the sim checks are sensitive to them (issue #189). Thus Fireball, Frost Bolt, Frost Shards and Spark keep a flat step from Common to Uncommon until issue #192.
- The first lines for Penance (+2/+4/+6) and Unbroken Vow (Ward 3/6) moved Stages 4-8 and 5-5 below their targets. Now Penance has +1/+2/+4, Unbroken Vow has Ward 2/5, and 1 of the 2 Penance copies in Stage 4-8 is Uncommon. With these changes, `sim:check` has 0 misses.
- Penance still fails the swap rule against Vanguard at Rare, Epic and Legendary (+11.5 to +14.3 points at 500 seeds, with `--rank`). The swap rule at high Ranks is advisory, and the old lines also failed on 12 to 16 cards at those Ranks.
- War Drums lowers 5 cards at Legendary, so its Hold Rule waits for 2 cards that are not Ready, not for all the cards that it lowers. Without this cap, the AI seldom plays the card.
