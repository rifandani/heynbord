# Gear has 25 levels and a Legendary Forge Stone tier

The game director wants Gear to go to level 25, with a new item that upgrades Gear to levels 21 to 25. ADR-0037 rejected levels above the old maximum, because no v1 Player got there. With Forge Stones (ADR-0038), the economy sim shows a mean Gear level of about 15 at Heynspire Floor 50, and Dungeon 3 (not in the sim) gives the Epic Forge Stones of levels 16 to 20. Thus an endgame Player gets to level 20 and has no Gear goal after it. We decided that an item has **levels 0 to 25**, and that a 5th Forge Stone tier, **Legendary**, upgrades Gear to levels 21 to 25:

| Forge Stone | Gear levels |
| --- | --- |
| Common | 1 to 5 |
| Uncommon | 6 to 10 |
| Rare | 11 to 15 |
| Epic | 16 to 20 |
| Legendary | 21 to 25 |

Each level adds the same step as levels 1 to 20: 0.5% Unit Crit, +1 Hero HP, 0.75% Skill Crit or 0.5% Unit Block. Level 25 gives 12.5% Unit Crit, +25 Hero HP, 18.75% Skill Crit and 12.5% Unit Block. The Coin cost stays 2.5 × *n* × (*n* + 1): levels 21 to 25 cost 1,155, 1,265, 1,380, 1,500 and 1,625 Coin, 6,925 Coin for each item. One item from level 0 to 25 costs 14,625 Coin and 5 Forge Stones of each tier. All 4 items cost 58,500 Coin and 20 Forge Stones of each tier.

Only the endgame gives Legendary Forge Stones (Economy 2):

- The first win of each 10th Heynspire Floor gives 1 Legendary Forge Stone, in addition to its 2 Epic Forge Stones. That is 5 Legendary Forge Stones one time.
- The first win of Dungeon 3 gives 1 Legendary Forge Stone, in addition to its 3 Epic Forge Stones. Each repeat win has a 10% chance to give 1 Legendary Forge Stone, with a roll that is separate from the Epic roll. Repeat wins of Dungeon 3, with watched Auto-play, are the farm.

The rules of ADR-0038 do not change: an upgrade uses 1 Forge Stone of the tier of the new level, a different tier cannot replace it, Forge Stones never combine, and they are earn-only. There is no other lock on levels 21 to 25: the Legendary Forge Stone supply is the lock.

## Considered Options

- **Rescale again, so that level 25 gives the stats of level 20.** Rejected: 20 to 25 is not a whole-number ratio, so a saved level cannot change into a new level with the same stats.
- **A smaller step for levels 21 to 25.** Rejected: each level must be a gain that the Player can see on the Hero screen, and a smaller step gives Crit and Block values that are not whole basis points.
- **The name "Legendary Gem", as a new item.** Rejected for the reasons of ADR-0038: "gems" is a word to avoid for Heynstones, and a Player can think that money buys them. A 5th Forge Stone tier also keeps all the rules of the 4 tiers.
- **New endgame content for the Legendary Forge Stones, for example Dungeon 4 or Heynspire Floors 51 to 60.** Rejected for now: the scope is much larger, and Dungeon 3 is already a farm.
- **3 Epic Forge Stones combine into 1 Legendary Forge Stone.** Rejected: it breaks the "never combine" rule of ADR-0038, and the Epic supply is already short (13 one-time Epic Forge Stones for the 20 that the Player needs).
- **Only the Heynspire Forge Stones.** Rejected: a source that is only one time can block a Player permanently (ADR-0038).

## Consequences

- A Profile migration adds a Legendary Forge Stone count of 0. The saved Gear levels do not change. The Profile has no records of Heynspire or Dungeon wins yet, so no Player loses Legendary Forge Stones of a first win.
- The power of Gear at the top goes up by 25%. Only the endgame gives Legendary Forge Stones, so no Stage gets Expected Gear above 20, and ADR-0034 does not change. The enemy Gear of the Stage and Dungeon data does not change.
- The economy sim never plays Dungeon 3, so it shows only the 5 Legendary Forge Stones of the 10th Floors. That is a floor. The "Gear mostly at level 14 or higher" target and the win-chance bonus of 1.25 points for each mean Gear level do not change.
- The 10% chance is a start. Tune it when the sim plays Dungeon 3.
- The Hero screen shows 5 Forge Stone counts. The Legendary Forge Stone uses the color of the Legendary Rank.
