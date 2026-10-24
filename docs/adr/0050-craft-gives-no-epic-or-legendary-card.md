# Craft gives no Epic or Legendary Base Rank card

Before, Craft gave one copy of any Discovered Card in its Base Rank, at a cost for each Rank of the Economy table: Common 40, Uncommon 120, Rare 400, Epic 1,400 and Legendary 4,800 Essence. [ADR-0048](0048-a-base-rank-legendary-creature-card-is-a-specialist.md) set the Specialist, a Base Rank Legendary Creature Card, at 4,800 Essence, 8 times its Extract value. Now Craft makes only a Card with Base Rank Common, Uncommon or Rare. A Card with Base Rank Epic or Legendary has no Craft cost.

The Epic and Legendary Base Ranks are the chase of the Collection: an Epic Card comes from a Merchant or a Royal Pack, a Specialist only from a Royal Pack, and the Combine path to a Legendary copy is the long-term chase (Economy 3.1, 3.2). A Craft cost made each of these Cards a purchase with a fixed price, which a Player with enough Coin could always make through Combine and then Extract (Economy 3.3). The top two Ranks stay with the Packs and with the Combine; Craft keeps the Common, Uncommon and Rare Cards, where the Essence from Extract has a sure use.

The rules of the change:

- `CRAFT_ESSENCE` has 3 entries: Common 40, Uncommon 120 and Rare 400 Essence. `craftEssence` gives `null` for a Card with Base Rank Epic or Legendary, and `craft` then returns `null` (Economy 3.3).
- The Craft station shows the reason in place of the recipe and its Craft: an Epic card comes from a Merchant or a Royal Pack, or from a Fuse; a Specialist comes from a Royal Pack only ([ADR-0048](0048-a-base-rank-legendary-creature-card-is-a-specialist.md)).
- The Essence cost of a Fuse stays 20, 60, 200 and 700 for Common, Uncommon, Rare and Epic (Economy 3.7): half of the Craft cost of the Rank for the first three, and 700 for Epic, as before. The Epic Fuse is now the only Essence path to a new Epic card.

## Considered Options

- **Craft keeps a cost for each Rank.** Rejected. The top two Ranks would stay a purchase with a fixed price, next to the Pack tables and the long-term Combine chase (Economy 3.1, 3.2).
- **Only the Specialist loses its Craft.** Rejected. A Craft of an Epic Base Rank copy makes a Combine pair toward a Legendary copy (Economy 7.1), so it is the same second path to the top Rank that this decision closes.
- **The Craft costs of Epic and Legendary rise (for example to 4,200 and 14,400).** Rejected. A higher price only makes the purchase longer; it does not take the fixed price away. The Epic Fuse already sets the Essence value of that Rank at 700 (Economy 3.7).

## Consequences

- A Specialist comes from a Royal Pack only, and an Epic Card from a Merchant or a Royal Pack or a Fuse.
- An Extract of an Epic or a Legendary copy keeps its confirmation, because these copies cost much to get again (GDD 7.4).
- The Craft station and its "Can Craft" filter never count an Epic or a Legendary card: `craftState` gives `none` for them.
- The economy sim Crafts only a Rare Base Rank Card, to make a Combine pair toward an Epic copy (Economy 7.1). In a run of 1,000 seeds for each Play Style on 2026-10-18, this change moved no Pacing target of Economy 4, and the check gave the same verdict as before the change: the Discovered share of the Collector at Floor 50 (96.2% against 100%) stays the one gated miss.
- This decision changes a consequence of ADR-0048: a Specialist cannot be Crafted.
