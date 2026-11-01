# A higher Base Rank gives a Power Budget bonus

[ADR-0020](0020-the-power-budget-measures-a-card-at-its-base-rank.md) measures a Card at its Base Rank, but it gives every Base Rank the same Power Budget. A copy of a Base Rank Common card at Rare is stronger than a Rare copy of a Base Rank Rare card of the same Countdown, because the Common card gets the Rare scale on a printed line that was fitted to the flat budget. This ADR gives each higher Base Rank a written budget bonus, and it adds a pairwise check at the same copy Rank. It supersedes ADR-0020.

## The rule

The Power Budget is:

```text
budget = (19 + 3 × (Countdown − 3)) × baseRankBonus
```

The first fit is:

| Base Rank | Bonus |
| --- | --- |
| Common | ×1.0 |
| Uncommon | ×1.1 |
| Rare | ×1.4 |
| Epic | ×1.5 |
| Legendary | ×1.7 |

`powerBudget(countdown, baseRank)` returns the budget with the bonus. A Common Base Rank card keeps the old budget. `creaturePower` and `skillPower` still measure a Card at its Base Rank, and they take an optional Rank so that a copy can be measured at another Rank.

## The pairwise rule

For each card kind, Countdown and playable Rank, a copy of a higher Base Rank card must have at least the power of the strongest Base Rank Common copy of the same kind and Countdown at that Rank. A Countdown with no Base Rank Common card uses the Power Budget of that Rank as the reference.

The content test checks the rule and names the card ID, the Rank and the reference card. The rule covers Creature Cards and Skill Cards. The Skill Card check keeps the nearest-step rule and the ±25% cap, applied at the new budget.

## The fitted table

`packages/rules/scripts/fit-base-rank-budget.ts` fits the smallest table that passes the pairwise rule. With the current card lines it prints:

| Base Rank | Fitted bonus |
| --- | --- |
| Common | ×1.0 |
| Uncommon | ×1.25 |
| Rare | ×1.4463 |
| Epic | ×1.6529 |
| Legendary | no Common reference |

The Legendary bonus has no pairwise constraint, because no Base Rank Common card has Countdown 5 or 6. The first fit is lower than the fitted table for Uncommon, Rare and Epic. That is on purpose: the full rebalance to the fitted table is a separate, large change.

## The deferred rebalance

The first-fit table changes the printed line of every Uncommon, Rare, Epic and Legendary card. The full rebalance changes the Stage, Dungeon and Floor enemies and the Main Matchups. It is not in this change. The simulation gate wins over the content test (GDD 13), so the cards that keep their old line are written exceptions in `POWER_BUDGET_EXCEPTIONS` in `packages/rules/src/content/content.unit.test.ts`. A card leaves the list when a tuning pass brings it to the new budget and the pairwise rule.

The Main Matchups, the Stages, the Dungeons, the Floors and the economy simulation pass with the old lines. The full rebalance is a follow-up issue.

## Considered Options

- **Check every Rank that a copy can have, and change the cards.** Rejected for now. Many cards fail at higher Ranks because the Rank scale gives power on purpose, and the full rebalance moves the Stage, Dungeon and Floor enemies and the Main Matchups. It is the follow-up issue.
- **Give each Base Rank a budget bonus, and keep the old lines as exceptions.** Chosen. The rule is in the content test, the simulation stays the gate, and the exception list shows the work that remains.
- **Change the comparison rule to the Base Rank line.** Rejected. The deck builder shows each copy at its own Rank, so the comparison must use that Rank.

## Consequences

- `powerBudget` takes a Countdown and a Base Rank. Every caller passes the Base Rank.
- `creaturePower` and `skillPower` take an optional Rank. The AI and the pairwise check use it.
- The Specialist stays stronger than the 2 Epic cards of its Race (ADR-0054).
- The UI does not change. The deck builder already shows the copy at its Rank.
- The `Power Budget` glossary entry uses the new rule and links to this ADR.
- The tuning log in [08 — Archetypes](../game/08-archetypes.md) records the change and the simulation result.
