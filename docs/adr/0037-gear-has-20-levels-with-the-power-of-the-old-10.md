# Gear has 20 levels with the power of the old 10

The game director wants a Gear item to go to level 20. The economy sim shows that at Player level 30 the mean Gear level is only about 4 of 10 in each Play Style, so levels above the old maximum would be content that no v1 Player sees. We decided to **rescale** Gear: an item has levels 0 to 20, and level 20 gives the same stats as the old level 10 (10% Unit Crit, +20 Hero HP, 15% Skill Crit, 10% Unit Block). Each level adds half of the old step, and an upgrade to level *n* costs 5 × *n* × (*n* + 1) Coin. Thus levels 2*n* − 1 and 2*n* together cost the same as the old level *n* (40 × *n*²), and one item from 0 to 20 costs 15,400 Coin, as the old 0 to 10. The Player upgrades 2 times as often, and the stats of each old level do not change.

## Considered Options

- **Extend: levels 11 to 20 add the old step.** Rejected: the Gear power at the top doubles (20% Crit, 30% Skill Crit, 20% Block), and with today's Coin no v1 Player gets there.
- **Extend at half power: levels 11 to 20 add half of the old step.** Rejected: it is only a long Coin sink, and no v1 Player gets there.
- **Cost 5 × *n*².** Rejected: the early levels are 20% to 25% cheaper than the old levels, and the Expected Gear of Region 1 goes up. A migrated Player also paid more than a new Player.
- **Cost 20 × ⌈*n*/2⌉².** Rejected: each pair has the old cost, but two levels with the same cost look like an error to the Player.

## Consequences

- A Profile migration doubles each saved Gear level, and the Stage data doubles each enemy Gear level. A migrated Player has the same stats and paid the same Coin.
- Each number that counts Gear levels doubles: the "Gear mostly at level 7 or higher" pacing target becomes 14, the win-chance bonus of the economy sim becomes 1.25 points for each mean Gear level, and the Upgrader Play Style upgrades Gear up to the Player level × 2 ÷ 3.
- With smaller steps, the Coin that stays after Packs and Combine can buy a Gear level. So the Gear goes up a little: in the economy sim, the mean Gear at Heynspire Floor 50 went from old level 4.0 to about 6 for the Collector and the Upgrader, and from 3.8 to 4.7 for the Balanced Player. The "level 14 or higher" target still fails. The Expected Gear (ADR-0034) goes up by about half of an old level, and `sim stage 1000 --check` still passes.

## Update: a Gear upgrade costs half of the Coin and a Forge Stone

[ADR-0038](./0038-gear-upgrades-need-earn-only-forge-stones.md) adds 1 Forge Stone to each Gear upgrade and makes the Coin cost half: 2.5 × *n* × (*n* + 1). Levels 2*n* − 1 and 2*n* together now cost 20 × *n*², and one item from 0 to 20 costs 7,700 Coin. The 20 levels, the stats of each level and the migration of the Gear levels above do not change. A Profile that upgraded Gear at the cost of this ADR gets no Coin back and pays no Forge Stones for its levels.
