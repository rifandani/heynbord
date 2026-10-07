# Countdown is a real cost: a Countdown Limit and 3 Ticking Cards

A Hero draws a 14-card Deck fully by about Turn 11, and a Battle lasts 16 to 27 Turns. Before this change, all cards in the Hand counted down at the same time. Thus a Hero played almost every card in the Deck, at about 1 card each Turn, at any Countdown. The Deck size limited the cards, not the time, and a long Countdown was only a delay. A Deck of slow, large cards won 100% against a Deck of fast, small cards of the same Race. The only Power Budget that matched these rules was almost flat (about `18 + 1 × Countdown`). Then a Countdown 6 card is only 1.2× the size of a Countdown 2 card, and Pillar 3 ("Strong cards have a long countdown") and the Feral "few and huge" identity fail.

We keep Countdown as a real cost, with two rules that work together:

- **Countdown Limit.** The sum of the Countdowns of the Cards in a Deck is at most 2.5 × the maximum Deck size of the player level. Each Card counts its printed Countdown, at each Rank, also a Skill Card. A Stage enemy Deck does not have the limit. A Deck of slow cards thus has fewer cards.
- **3 Ticking Cards.** In each Start Step, only the 3 oldest Cards in the Hand that are not Ready count down. The oldest Card is the Card that came into the Hand first. A Ready Card does not use one of the 3. A slow card thus uses Turns that other cards cannot use.

The Power Budget becomes `12 + 3 × Countdown`. The budget at Countdown 3 stays 21, and a Countdown 6 card is 1.67× a Countdown 2 card.

## Considered Options

All results use Matchups with 1000 seeds (2000 Battles), with each Creature Card fitted to the budget by `packages/rules/scripts/fit-budget.ts` (issue #20). A result passes when Human Heavy against Human Light is 40% to 60%, Wild Hunt against Tunnel Rats, Vanguard and Raiders is 35% to 65%, Vanguard against Raiders is 45% to 55%, and `budget(6) ≥ 1.6 × budget(2)`.

- **A flat slope, with no rule change.** Rejected. Slope 1 almost meets the win rates (Human Heavy 61.3% against Human Light, 200 seeds), but slow cards are only a bit larger than fast cards.
- **Only a Countdown Limit.** Rejected. With a factor of 3, Human Heavy keeps 11 cards and wins 93.5% against Human Light. With a factor of 2.5, Vanguard and Raiders also lose their Epic card, and Vanguard against Raiders falls to 34% (200 seeds).
- **Only Ticking Cards.** Rejected. With 2 Ticking Cards, cheap cards and Sabotage gain the most, and Wild Hunt wins only 31.3% against Tunnel Rats. With 3 or 4, the heavy Decks win 84% to 95% against Human Light (200 seeds).
- **A play limit for each Turn, smaller Decks or an earlier Sudden Death.** Not measured. A play limit punishes cheap cards most, and the other two only change late draws.

The selected rules give Human Heavy 51.8% against Human Light, and Wild Hunt 41.3%, 55.4% and 48.5% against Tunnel Rats, Vanguard and Raiders. Vanguard against Raiders is 44.5%, 0.5 points below its target. We accept this, because Vanguard against Raiders changes by up to 15 points when only the fit of a few Human and Orc cards changes. The card changes tune it.

## Consequences

- "All Countdowns tick together" is no longer true. The Hand has an order, and the Player must see which 3 Cards are Ticking Cards.
- Sabotage and Countdown effects such as War Drums become stronger or weaker with the order of the Hand. Their Keyword points do not change now.
- The Starter Decks are over the Countdown Limit of player level 1 (25): Vanguard has 27 and Raiders 30. They must change.
- The Battle rules, the Deck rules, the cards, the Starter Decks, the Archetypes and the Stages change together, because `rules:sim:check` gates the Matchups and the Stages.
