# A Skill Card uses the Power Budget of a Creature Card

A Creature Card has a Power Budget ([ADR-0020](./0020-the-power-budget-measures-a-card-at-its-base-rank.md), [ADR-0021](./0021-countdown-is-a-real-cost.md)). A Skill Card had none. The only check was the swap rule (`bun run sim skill-swap`, issue #56), and the sim showed that a Skill Card was often worth much less than a Creature Card with the same Countdown. Now a Skill Card has **Power Points** and the **same Power Budget** as a Creature Card: `19 + 3 × (Countdown − 3)`. There is no separate Skill scale (issue #50, grill on 2026-10-11).

- **Base Rank.** The Power Points measure a Skill Card at its Base Rank, the same as a Creature Card. A damage value scales with the Rank scale to the Base Rank. A Rank table (heal, Ward, bonus Bulwark, Countdown down) gives its Base Rank value.
- **Points.** Each effect kind has a **rate**: the Power Points for each point of its main amount. Each extra part has flat points (push Squares, Entangle, area length, Field Effect size and turns, bonus Range, Bleed). The Damage Type has its own Skill values. They are not the Creature values. A card with more than one effect adds the points of each one. `skillPower` in `packages/rules/src/content/balance.ts` has the rates.
- **Recall.** The points are multiplied by `1 + w × Recall` at the Base Rank. A Recalled card plays again, so without it a higher Base Rank gets more value for the same budget, and no one chose that number. The fit sets `w`.
- **Crit does not count.** Skill Crit comes from the Hero, not from the Card.
- **Fit.** The rates come from the swap rule on all 40 Skill Cards (`packages/rules/scripts/fit-skill-budget.ts`). A calibration run measures the win-rate change for each Power Point in each swap Deck. The value of a card in the sim is the budget of its Countdown, plus the difference of the removed Creature Card from its own budget, plus the swap delta in Power Points.
- **Tolerance: the nearest step.** A Skill Card passes when no other whole-number value of its main amount at the Base Rank comes nearer to its budget. A hard cap of ±25% catches a broken card. The ±10% band of a Creature Card does not apply, because Skill amounts are small: for Smite 3 at Countdown 2, 1 damage is about ±33%.
- **The sim wins.** The swap rule (±5 points against Vanguard and Raiders, 1000 seeds) stays the true check for each batch of cards. If the content test and the sim do not agree, the sim wins. When a card fails the sim: first check the Hold Rule (if the AI wastes the card, fix the AI and keep the points), then change the rate of an effect kind if many cards of that kind fail in the same direction, and change the values of one card only if it is the only one.

## Considered Options

- **A separate Skill Point scale.** Rejected. Two scales need two budgets and a conversion between them, and the swap rule already measures a Skill Card against a Creature Card.
- **No Recall in the budget.** Rejected. At the same budget, an Epic (Recall 28%) gets about a third more plays than a Common (Recall 7%), and no one chose that.
- **A fixed ±10% or ±20% band.** Rejected. A small amount cannot hit a narrow band: 1 damage of a Countdown 2 card is about ±15% of its budget. A wide band lets weak cards pass.

## Consequences

- `packages/rules/CONTEXT.md`: Power Points and Power Budget apply to all Cards. There is no separate "Skill Power Budget" term.
- The first fit (issue #50, 2026-10-14) gives Recall weight 0: the sim shows no extra value from Recall. The fit error grows from 2.06 Power Points at weight 0 to 2.36 at weight 3. The multiplier stays in the formula, so that a later fit can raise it. The push, Grounded and Cleanse parts also fit to 0 points.
- The sim finds that a Skill Card is often worth 2 to 4 Power Points less than a Creature Card with the same Countdown. The swap rule passes at about ±2 to ±4.5 Power Points (1 Power Point is 1 to 2.9 win-rate points in the swap Decks), but the nearest step is about ±1 to ±2. Thus a card can pass the sim and miss its nearest step. Such a card has a written reason in the content test, and the sim wins.
- One damage rate holds all Classes. In the Warrior Deck a damage point is worth more than in the Ranger Deck, so Spear Throw and Shoulder Charge are far from their points in the test.
- The Damage Type points of a Skill Card also hold the effect of its Class Deck, because in v1 only the Priest has Holy Skill Cards and only the Mage has Lightning Skill Cards.
- For some effects the sim value did not move when the amount went up (Ward, lane heal, bonus Attack on one Unit, Arc Lightning). A linear rate cannot show this. These cards wait for a decision: an AI change, a new effect, or a different Countdown.
- The swap rule found that the AI used Warning Shot to push a Unit when it could kill one. Now a kill scores above a push (GDD 9).
