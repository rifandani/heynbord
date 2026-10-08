# Countdown is a real cost: a Countdown Limit

A Hero draws a 14-card Deck fully by about Turn 11, and a Battle lasts 16 to 27 Turns. All Cards in the Hand count down at the same time. Thus a Hero plays almost every card in the Deck, at about 1 card each Turn, at any Countdown. The Deck size limits the cards, not the time, and a long Countdown is only a delay. A Deck of slow, large cards won 100% against a Deck of fast, small cards of the same Race. The only Power Budget that matched these rules was almost flat (about `18 + 1 × Countdown`). Then a Countdown 6 card is only 1.2× the size of a Countdown 2 card, and Pillar 3 ("Strong cards have a long countdown") and the Feral "few and huge" identity fail.

We keep Countdown as a real cost with a **Countdown Limit**. The sum of the Countdowns of the Cards in a Deck is at most 2.5 × the maximum Deck size of the player level. Each Card counts its printed Countdown, at each Rank, also a Skill Card. A Stage enemy Deck does not have the limit. A Deck of slow cards thus has fewer cards.

All Cards in the Hand count down in each Start Step. The Player does not track a Hand order.

The Power Budget is `21 + s × (Countdown − 3)`. The budget at Countdown 3 stays 21. The fit selects the steepest slope `s` that passes the criteria below, with a floor of `budget(6) ≥ 1.3 × budget(2)`. If no slope at or above the floor passes, we decide again. We do not go to a flat budget silently. The factor 2.5 stays fixed, and only the slope is tuned. The factor changes only if no slope passes. The fit selected `s = 3` (issue #26), so the budget is the same as `12 + 3 × Countdown`.

## Considered Options

All results use Matchups with 1000 seeds (2000 Battles), with each Creature Card fitted to the budget by `packages/rules/scripts/fit-budget.ts` (issue #20). A result passes when Human Heavy against Human Light is 40% to 60%, Wild Hunt against Tunnel Rats, Vanguard and Raiders is 35% to 65%, and Vanguard against Raiders is 45% to 55%.

- **A flat slope, with no rule change.** Rejected. Slope 1 almost meets the win rates (Human Heavy 61.3% against Human Light, 200 seeds), but slow cards are only a bit larger than fast cards.
- **3 Ticking Cards with the Countdown Limit and `12 + 3 × Countdown`.** Used first, then removed (2026-10-08). In each Start Step, only the 3 oldest Cards in the Hand that were not Ready counted down, and the other Cards waited. With the Countdown Limit, it gave Human Heavy 51.8% against Human Light and a 1.67× slope (issue #21). But it made Battles slow, and the Player had to track the Hand order and which Cards waited. Players found it frustrating and too complex. We expected a flatter slope for simpler rules, but the fit kept slope 3.
- **Only Ticking Cards.** Rejected. With 2 Ticking Cards, cheap cards and Sabotage gained the most, and Wild Hunt won only 31.3% against Tunnel Rats. With 3 or 4, the heavy Decks won 84% to 95% against Human Light (200 seeds).
- **Only a Countdown Limit at the slope `12 + 3 × Countdown`.** Measured during issue #20 and failed at that slope. With a factor of 3, Human Heavy keeps 11 cards and wins 93.5% against Human Light. With a factor of 2.5, Vanguard and Raiders also lose their Epic card, and Vanguard against Raiders falls to 34% (200 seeds). This is the selected rule, at slope 3. It passes now with the Archetypes and the cards of issue #21 and later (issue #26).
- **A play limit for each Turn, smaller Decks or an earlier Sudden Death.** Not measured. A play limit adds a new rule to track, and the other two only change late draws.

## Consequences

- Countdown stays the same cost as with the Ticking Cards: a Countdown 6 card is 1.67 × a Countdown 2 card. A flatter slope made the heavy Decks too weak, because the Countdown Limit gives them fewer cards. At the floor (1.47), Human Heavy won only 8.5% against Human Light ([08 — Archetypes, 3.2](../game/08-archetypes.md#32-countdown-slope-search)).
- The Battle rules, the cards, the Starter Decks, the Archetypes and the Stages change together, because `rules:sim:check` gates the Matchups and the Stages. Each Creature Card is fitted again. The hand changes after issue #21 (for example the Elf cards of #23, Charge N and Speed 1 by default) are done again only where the sim shows a need. The slope did not change, and the cards passed each criterion, so no card changed. Only 3 Stage enemy Decks changed.
- Sabotage still uses the Hand order for a tie: if two Cards have the same Countdown, the oldest Card in the Hand gets it. This is a rules fact, and the Player does not need to track it.
