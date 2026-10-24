# The Power Budget measures a card at its Base Rank

The printed Attack and HP of a Creature Card are Common values, and a copy plays with the Rank scale of its Rank (GDD 5.3). The Power Points used the printed values, so a Rare card played ×1.45 and an Epic card ×1.75 above its Power Budget. The Keyword points already used the Base Rank value, and GDD 13 already says "a power budget for the Base Rank". Now the Power Points also measure Attack and HP at the Base Rank. The printed Attack and HP of Uncommon, Rare and Epic cards go down to fit. Countdown, Speed, Range, Damage Type and Keywords do not change, so the Countdown curve and the Keyword identity of each Race stay the same. A Rank still makes a copy stronger, from its Base Rank upward.

The Matchups found this. Wild Hunt won 78% to 98% and Tunnel Rats 2% to 14%, but a Goblin Deck of Countdown 3 to 6 cards won 99.5% against Wild Hunt, and a Human Deck of Countdown 3 to 6 cards won 100% against a Human Deck of Countdown 1 to 3 cards. The heavy Decks have the Rare and Epic cards. A flatter Countdown slope alone did not fix it, and the Rank fix alone did not fix it. Only the two together brought the heavy and light Decks near 50% (200-seed tests, 2026-10-07). This ADR is the Rank fix. The Countdown slope (`5` Power Points for each Countdown point) is a separate decision. It waits for the Matchup results after this change.

## Considered Options

- **The printed values are the Base Rank values, and the Rank scale counts from the Base Rank.** Rejected. It changes the Rank and Combine rules and the stats of each copy above its Base Rank.
- **A higher Base Rank is stronger on purpose, with a written budget increase for each Base Rank.** Rejected for now. The current increase (+45% and +75%) is too large, and no one chose it. A small increase can come later as one written number.
- **Lower only the Feral stats and raise the Goblin stats.** Rejected. The heavy Decks of each Race stay too strong.
