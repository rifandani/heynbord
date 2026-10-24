# The three Packs give equal value for each Coin

There was one Pack with one Drop Rate table, the Standard Pack, and a Race Pack with the same table. Now there are three Packs: the **Peddler Pack** (350 Coin), the **Merchant Pack** (500 Coin) and the **Royal Pack** (1,000 Coin). Each one has its own Drop Rates ([Economy 3.1](../game/07-economy.md#31-packs)).

In most gacha games, a more expensive pull gives more value for each unit of currency. We decided the opposite: on the Combine scale (Common 1, Uncommon 2, Rare 4, Epic 8, Legendary 16), the three Packs give about the same value for each Coin. A more expensive Pack is not a better deal. It does a different job:

- The **Peddler Pack** gives the most cards for each Coin. Its cards are fuel for Combine, and it has no **New Card First**, because duplicates are its job.
- The **Royal Pack** gives no Common cards. It saves the Coin of Combine, and it Discovers the Rare and Epic Base Rank cards. It is the only Pack that can give a Legendary card.

We did this for [Pillar 1](../game/01-design-pillars.md) and [Pillar 4](../game/01-design-pillars.md). If a higher Pack gives more value, the Peddler Pack is a trap for new players, who have little Coin, and a player who saves Coin for a long time gets ahead. If a lower Pack gives more value, nobody buys the Royal Pack.

## Considered Options

- **One Drop Rate table, and Packs that change only the pool (Standard and Race).** Rejected. The player wanted a choice between cheap Packs and Packs with better cards, and the Combine scale lets each Pack do a different job.
- **More value for each Coin in a higher Pack.** Rejected, for the reasons above.
- **Legendary in the Merchant Pack (0.2%).** Rejected. If only the Royal Pack can give a Legendary card, the Royal Pack has a clear job, and its Pack Guarantee can be "Legendary in 20 Packs".
- **The Royal ×10 guarantees a Legendary card.** Rejected. Then 10 Packs always give a Legendary card, but single Packs need up to 20. Thus a single Royal Pack is a bad choice. A Royal ×10 opens 11 Packs, a bonus of 10%. The Peddler ×10 and the Merchant ×10 guarantee a card of their Guarantee Rank, because there the gap to a single Pack is small.

## Consequences

- When a Drop Rate or a price changes, check the value for each Coin of all three Packs. The economy simulation reports it.
- The ×10 bonus breaks the equal value a little: a ×10 is better than 10 single Packs. This is intended, because the bonus is small and the player sees it before buying.
- The Merchant Pack replaces the Standard Pack in each reward, for example the Star chests ([Economy 2.2](../game/07-economy.md#22-star-chests)).
