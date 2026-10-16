# Star chests give no Heynstones

The 30-Star chest of each Region gave 150 Heynstones and 100 Essence (Economy 2.2), so the 5 Regions gave 750 Heynstones. We decided that Star chests give only gameplay rewards: Coin, Essence, Forge Stones and Packs. The 30-Star chest now gives 500 Coin, 100 Essence and 1 Royal Pack (all cards). Heynstones come only from the 10th Heynspire Floors and Achievements. Thus a full Campaign clear gives cards, and the rare currency comes from the long loop.

## Considered Options

- **Keep 150 Heynstones in the 30-Star chest.** Rejected by the game director.
- **Give a fixed card in place of a Pack.** Not selected: a Star chest has no card field, and a Pack already gives cards with the Pack rules (the guarantee and the new-card-first rule).

## Consequences

- The v1 Heynstone supply is about 1,250, not about 2,000: about 52% of the Bazaar catalog cost, not 83% (Economy 2.6). Check the total again when the Bazaar is planned in M4. This replaces the Heynstone note of ADR-0036.
- `StarChestDefinition` has no `heynstones` field, and `HEYNSTONE_SOURCES` has no `starChests` source.
- The economy sim does not change: the 30-Star chests do not open in the sim.
- The game does not give Heynstones from a chest that was claimed before this change back, and it does not take them back.
