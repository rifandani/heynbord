# A higher Base Rank gives a Power Budget bonus

[ADR-0020](0020-the-power-budget-measures-a-card-at-its-base-rank.md) measures a Card at its Base Rank, but it gives every Base Rank the same Power Budget. A copy of a Base Rank Common card at Rare is stronger than a Rare copy of a Base Rank Rare card of the same Countdown, because the Common card gets the Rare scale on a printed line that was fitted to the flat budget. This ADR gives each higher Base Rank a written budget bonus, and it adds a pairwise check at the same copy Rank. It supersedes ADR-0020.

## The rule

The Power Budget is:

```text
budget = (19 + 3 × (Countdown − 3)) × baseRankBonus
```

The table is:

| Base Rank | Bonus |
| --- | --- |
| Common | ×1.0 |
| Uncommon | ×1.25 |
| Rare | ×1.4463 |
| Epic | ×1.6529 |
| Legendary | ×1.7 |

`powerBudget(countdown, baseRank)` returns the budget with the bonus. A Common Base Rank card keeps the old budget. `creaturePower` and `skillPower` still measure a Card at its Base Rank, and they take an optional Rank so that a copy can be measured at another Rank.

## The pairwise rule

For each card kind, Countdown and playable Rank, a copy of a higher Base Rank card must have at least the power of the strongest Base Rank Common copy of the same kind and Countdown at that Rank. A Countdown with no Base Rank Common card uses the Power Budget of that Rank as the reference.

The content test checks the rule and names the card ID, the Rank and the reference card. The rule covers Creature Cards and Skill Cards. The Skill Card check keeps the nearest-step rule and the ±25% cap, applied at the new budget.

## The fitted table

`packages/rules/scripts/fit-base-rank-budget.ts` fits the smallest table for the Creature Cards that passes the pairwise rule. With the current card lines it prints:

| Base Rank | Fitted bonus |
| --- | --- |
| Common | ×1.0 |
| Uncommon | ×1.25 |
| Rare | ×1.4463 |
| Epic | ×1.6529 |
| Legendary | ×1.5636 |

The Legendary cards have no Base Rank Common card of their Countdown, so the pairwise reference is the Power Budget of the copy Rank. The script fits ×1.5636 for Legendary. The fit is below Epic, so the table keeps the first-fit ×1.7 for Legendary and the bonus never falls as the Base Rank rises. A Legendary card still passes the pairwise rule at ×1.7. The first fit is lower than the fitted table for Uncommon, Rare and Epic. That is on purpose: the fitted table is the smallest table that lets every Creature Card meet the ±10% band and the pairwise rule with a legal Attack and HP line. The script fits the Creature Cards. The Skill Cards use the same table and the content test.

## The full rebalance

Issue #189 applies the fitted table to every card. The printed Attack and HP of each Uncommon, Rare, Epic and Legendary Creature Card change, and the Skill Cards change with them. The change moves the Main Matchups and the campaign, so the same issue gives the game:

- new lists for the 6 Main Archetypes, each at its Base Rank, within the Countdown Limit of level 5;
- a new Raiders Starter Deck, with 2 Howling Chargers, so that the 2 Starter Decks gain the same from the rebalance;
- new enemy Decks and strength numbers for the Stages, the Dungeons and the Floors.

The content test checks the budget and the pairwise rule for every card. The simulation is the gate for the Matchups, the Stages, the Dungeons, the Floors and the economy.

### The written exceptions

There are no written exceptions. Every Creature Card and every Skill Card passes the fitted budget, the pairwise rule and the simulation gate. The content test still fails if a card leaves the budget or the pairwise rule, and the simulation check is the gate. A card that fails in a later change goes back to the tuning pass, not to an exception list.

## Considered Options

- **Check every Rank that a copy can have, and change the cards.** Chosen for the full rebalance of issue #189, together with the new Decks and the campaign retune.
- **Give each Base Rank a budget bonus, and keep the old lines as exceptions.** Rejected for v1.0. The exception list is empty, so the cards use the fitted table.
- **Change the comparison rule to the Base Rank line.** Rejected. The deck builder shows each copy at its own Rank, so the comparison must use that Rank.

## Consequences

- `powerBudget` takes a Countdown and a Base Rank. Every caller passes the Base Rank.
- `creaturePower` and `skillPower` take an optional Rank. The content test and the fit script use it to measure a copy at another Rank.
- The Specialist stays stronger than the 2 Epic cards of its Race (ADR-0054).
- The UI does not change. The deck builder already shows the copy at its Rank.
- The `Power Budget` glossary entry uses the new rule and links to this ADR.
- There is no written exception list. The content test fails when a card leaves the budget or the pairwise rule.
- The tuning log in [08 — Archetypes](../game/08-archetypes.md) records the change and the simulation result.
