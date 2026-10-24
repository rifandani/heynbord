# Gear upgrades need earn-only Forge Stones

The game director wants a Gear upgrade to need more than Coin. Coin is the only cost now, and a Gear level feels like one more Coin sink. But the economy sim shows that Gear is already below its target: the mean Gear at Heynspire Floor 50 is about 6 of 20, and the "level 14 or higher" target fails (ADR-0035). Thus a second cost must not make Gear slower. We decided that each Gear upgrade costs **half of the old Coin and 1 Forge Stone**. There are 4 **Forge Stone tiers**, and the tier of the new level sets the Forge Stone:

| Forge Stone | Gear levels |
| --- | --- |
| Common | 1 to 5 |
| Uncommon | 6 to 10 |
| Rare | 11 to 15 |
| Epic | 16 to 20 |

The Coin cost to level *n* is 2.5 × *n* × (*n* + 1). One item from level 0 to 20 costs 7,700 Coin and 5 Forge Stones of each tier. All 4 items cost 30,800 Coin and 20 Forge Stones of each tier.

The Player earns Forge Stones through play, on a ladder that follows the Player through the game (Economy 2): Stage first wins and 10-Star chests give the tier of the Region (Common in Regions 1 and 2, Uncommon in Regions 3 and 4, Rare in Region 5). A repeat win and a Sweep can give the tier of the Region. Each Dungeon gives one tier (Uncommon, Rare, Epic), and Heynspire Floors give Rare and Epic Forge Stones. Thus Gear has its own reward stream, the Coin that the Player keeps goes to Packs and Combine, and repeat wins and Sweeps get a new reason.

Forge Stones are earn-only, the same as Sweep Tickets. The Bazaar never sells them, and they never change into Coin, Essence or Heynstones. They give power, so money must never buy them ([ADR-0008](./0008-heynstones-buy-only-cosmetics-and-conveniences.md), Pillar 1).

## Considered Options

- **Forge Stones in addition to the full Coin cost.** Rejected: Gear is already below its target, and a second limit makes it slower. The "level 14" target and the Expected Gear of the Stages go down more.
- **Forge Stones only from Dungeons and Heynspire.** Rejected: Gear unlocks at Player level 5, Dungeon 1 at level 10 and Heynspire at level 23. A Player could not upgrade Gear from level 5 to level 10, and the Expected Gear of Regions 1 and 2 becomes 0 (ADR-0033).
- **Only one-time Forge Stones, with a fixed supply.** Rejected: a Player who spends the supply badly, or a Player after a change of the costs, can be blocked permanently. Repeat wins, Sweeps and Dungeons are a farm with a time cost.
- **The name "Enchanting Gem".** Rejected: "gems" is a word to avoid for Heynstones, and a Player can think that money buys them. "Enchant" is a word to avoid for a Gear upgrade.
- **A higher tier can replace a lower tier, or 3 Forge Stones combine into 1 of the next tier.** Rejected for v1: it adds a rule and a screen. The supply of each tier is tuned on its own.

## Consequences

- The Profile keeps a count of each Forge Stone tier. A migration sets the counts to 0. A saved Gear level does not change: a Player who upgraded at the old cost gets no Coin back and pays no Forge Stones.
- The Player gets Forge Stones before Gear unlocks and keeps them. When Gear unlocks at Player level 5, the Player can upgrade some levels at once.
- The enemy Gear of the Stage and Dungeon data does not change.
- In the economy sim, a Gear upgrade needs the Coin and the Forge Stone. When the Forge Stone is missing, the Play Style goes to its next priority. Run `sim stage 1000 --check` again (ADR-0033), because the Expected Gear changes. If the "level 14 or higher" target still fails, the M3 re-tune changes the Forge Stone supply, not the target.
- The Forge Stone numbers in Economy 2 are a start. The economy sim tunes them.
- The Hero screen shows the 4 Forge Stone counts, and the Gear upgrade shows its Coin and Forge Stone cost. There is no Inventory screen (GDD 7.2).

## Update: a 5th tier, Legendary

[ADR-0037](./0037-gear-has-25-levels-and-a-legendary-forge-stone-tier.md) adds Gear levels 21 to 25 and the Legendary Forge Stone tier for them. Only the 10th Heynspire Floors and Dungeon 3 give Legendary Forge Stones. All the rules of this ADR apply to the new tier.
