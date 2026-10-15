# 07 — Economy

This document defines the currencies, the sources and sinks, the Pack tables and the costs for v1. It also gives the rules for monetization after v1. All numbers are start values. Tune them with playtests and simulations.

Pillar 1 ("Fair to the player") controls all decisions in this document.

## 1. Currencies and resources

| Resource | Type | How the player gets it | What it is for |
| --- | --- | --- | --- |
| **Coin** | Soft currency | Battles, Star chests, Heynspire, Achievements | Packs, Combine, Gear upgrades, Deck slots |
| **Heynstones** | Rare currency | 30-Star chests, 10th Heynspire Floors, Achievements (one time each) | Cosmetics and Conveniences in the Bazaar |
| **Essence** | Craft resource | Extract, Heynspire milestones, Achievements | Craft |
| **XP** | Progress | Battles | Player level |
| **Stars** | Progress | Stage wins | Star chests |
| **Forge Stones** | Gear resource, 5 tiers | Stage wins, 10-Star chests, Sweeps, Dungeons, Heynspire | Gear upgrades |

- Coin, Heynstones and Essence never change into each other. See [ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md).
- Forge Stones are earn-only. The Bazaar never sells them, and they never change into Coin, Heynstones or Essence. See [ADR-0038](../adr/0038-gear-upgrades-need-earn-only-forge-stones.md).
- In v1, the player can only earn Heynstones. From v2, the player can also buy them with real money (section 5).

### 1.1 Coin denominations

Coin has three denominations: 100 Copper = 1 Silver, and 100 Silver = 1 Gold. The game keeps one Coin balance as a number of Copper. All numbers in this document are in Copper.

The game shows only the denominations that are not zero. Each one has an icon and its own color, not only a letter.

| Copper | Shown as |
| --- | --- |
| 60 | 60c |
| 520 | 5s 20c |
| 15,400 | 1g 54s |

- No resource has a time limit or a daily cap.
- There is no Energy. The player can do as many Battles as they want.

### 1.2 Player levels

XP sets the Player level, from 1 to 30 (GDD 7.1). The table has three bands:

| Levels | XP to the next level | Reason |
| --- | --- | --- |
| 1 → 6 | 160 each | Region 1 is fast, so Packs, Workshop and Gear come early. 160 XP is 2 first wins in Region 1. |
| 6 → 20 | 340, then +20 for each level (340 … 600) | Campaign Regions 2 to 4. |
| 20 → 30 | 1,000, then +150 for each level (1,000 … 2,350) | Campaign Region 5, then the long loop: Heynspire and Dungeon wins. |

The jump from 160 to 340 XP at level 6 is intentional, because Region 1 is the fast start.

| Level | XP to the next level | Total XP |
| --- | --- | --- |
| 1 | 160 | 0 |
| 2 | 160 | 160 |
| 3 | 160 | 320 |
| 4 | 160 | 480 |
| 5 | 160 | 640 |
| 6 | 340 | 800 |
| 7 | 360 | 1,140 |
| 8 | 380 | 1,500 |
| 9 | 400 | 1,880 |
| 10 | 420 | 2,280 |
| 11 | 440 | 2,700 |
| 12 | 460 | 3,140 |
| 13 | 480 | 3,600 |
| 14 | 500 | 4,080 |
| 15 | 520 | 4,580 |
| 16 | 540 | 5,100 |
| 17 | 560 | 5,640 |
| 18 | 580 | 6,200 |
| 19 | 600 | 6,780 |
| 20 | 1,000 | 7,380 |
| 21 | 1,150 | 8,380 |
| 22 | 1,300 | 9,530 |
| 23 | 1,450 | 10,830 |
| 24 | 1,600 | 12,280 |
| 25 | 1,750 | 13,880 |
| 26 | 1,900 | 15,630 |
| 27 | 2,050 | 17,530 |
| 28 | 2,200 | 19,580 |
| 29 | 2,350 | 21,780 |
| 30 | — | 24,130 |

- The Player level is the highest level whose total XP is at or below the XP of the Player. 24,130 XP or more is level 30. There is no level 31.
- The band rules made the table, but the table is a fixed list. You can change one value by hand. The data is `PLAYER_LEVEL_XP` in `packages/rules/src/content/player-levels.ts`. Keep the code and this table the same.

**First-try Path.** The First-try Path is the first win of each earlier Stage, in Stage order (Region, then Stage number), with no losses and no repeats. The **Recommended level** of a Stage is the Player level that the First-try Path gives before that Stage. A content test checks each Stage. When this table, a reward in section 2.1 or a Stage changes, update the Recommended levels. Then run `sim stage` again ([14 — Campaign Stages](./14-campaign-stages.md#11-recommended-level)).

A loss gives 25% of the XP of a win, and a repeat win gives the normal XP (section 2.1). Thus a real Player is at or above the level of the First-try Path. The Recommended level is a floor.

**Anchor check.** The first wins of a Region give 880 XP (Region 1), 1,540 XP (Region 2), 2,200 XP (Region 3), 2,860 XP (Region 4) and 3,520 XP (Region 5). On the First-try Path:

| After | Total XP | Player level | Target |
| --- | --- | --- | --- |
| Region 1 Boss Stage | 880 | 6 | 6: Gear near the Region 1 Boss, Craft right after it |
| Region 2 Boss Stage | 2,420 | 10 | 10: Dungeon 1 opens when the Player starts Region 3 |
| Region 3 Boss Stage | 4,620 | 15 | — |
| Region 4 Boss Stage | 7,480 | 20 | 20: Dungeon 2 opens when the Player starts Region 5 |
| Region 5 Boss Stage | 11,000 | 23 | 23: Heynspire opens at the same time |
| All 50 Heynspire Floors | 19,875 | 28 | — |
| About 22 more Dungeon 2 wins | 24,130 | 30 | 30: Dungeon 3, the final challenge, after 1 to 2 weeks |

The Heynspire and Dungeon rows use the first-win XP of each Floor (section 2.3) and the XP of a Dungeon 2 win (section 2.4).

On the First-try Path, the Region 1 Stages get the Player levels 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, and the Stages of Region 2 get 6, 6, 7, 7, 7, 8, 8, 8, 9, 9. The Stages of Region 3 get 10, 10, 11, 11, 12, 12, 13, 13, 13, 14, the Stages of Region 4 get 15, 15, 16, 16, 17, 17, 17, 18, 18, 19, and the Stages of Region 5 get 20, 20, 20, 21, 21, 21, 21, 22, 22, 22.

## 2. Sources (faucets)

### 2.1 Campaign Stages

| Region | Coin per win | XP per win | First win bonus |
| --- | --- | --- | --- |
| 1 Hearthvale | 60 | 40 | ×3 Coin, ×2 XP, and a fixed card |
| 2 The Red Mesas | 100 | 70 | ×3 Coin, ×2 XP, and a fixed card |
| 3 The Glowcap Hollows | 150 | 100 | ×3 Coin, ×2 XP, and a fixed card |
| 4 The Thornwood | 200 | 130 | ×3 Coin, ×2 XP, and a fixed card |
| 5 The Hollow Marches | 250 | 160 | ×3 Coin, ×2 XP, and a fixed card |

- A Boss Stage gives ×2 of the values above.
- A first win also gives 1 Forge Stone of the tier of the Region: Common in Regions 1 and 2, Uncommon in Regions 3 and 4, and Rare in Region 5. A Boss Stage gives the same Forge Stone.
- A repeat win has a 10% chance to give 1 Forge Stone of the tier of the Region. A Sweep uses the same rule for each Sweep Ticket. A loss gives no Forge Stone.
- A loss gives 10% of the Coin and 25% of the XP of a win.
- A Sweep (GDD 4.12) gives one repeat-win reward for each Sweep Ticket, with no Battle. Each win that the player plays gives 2 Sweep Tickets.
- A repeat win has a 20% chance to give one card from the Stage card pool, in its Base Rank. The Stage card pool is the different cards of the enemy Deck of the Stage, but not a Skill Card of a Class that is not the Class of the player's Deck. Each card in the pool has the same chance.

### 2.2 Star chests

Each Region has 3 Star chests.

| Stars in the Region | Reward |
| --- | --- |
| 10 | 300 Coin, 1 Merchant Pack and 2 Forge Stones of the tier of the Region |
| 20 | 30 Essence and 1 Merchant Race Pack. The player selects the Race, as for a Race Pack bought with Coin. |
| 30 | 150 Heynstones and 100 Essence |

The data is `STAR_CHESTS` in `packages/rules/src/content/star-chests.ts`. Keep the code and this table the same.

### 2.3 Heynspire

| Floor | Reward for the first win |
| --- | --- |
| Each Floor *n* | 100 + 10 × *n* Coin, and 50 + 5 × *n* XP |
| Each 5th Floor that is not a 10th Floor | Also 2 Rare Forge Stones |
| Each 10th Floor | Also 1 earn-only Cosmetic, 150 Essence, 50 Heynstones, 2 Epic Forge Stones and 1 Legendary Forge Stone |

The rule is `floorFirstWinReward` in `packages/rules/src/content/heynspire.ts`. Keep the code and this table the same.

### 2.4 Dungeons

| Dungeon | Coin per win | XP per win | First win bonus |
| --- | --- | --- | --- |
| 1 (player level 10) | 200 | 140 | ×3 Coin, ×2 XP, and a fixed card |
| 2 (player level 20) | 300 | 200 | ×3 Coin, ×2 XP, and a fixed card |
| 3 (player level 30) | 400 | — (15 Essence) | ×3 Coin, 100 Essence, and a fixed card |

- The values start at the Boss Stage values of the Region that the player usually plays at the unlock level.
- A loss and a repeat win use the same rules as a Campaign Stage (section 2.1). The card pool is the Dungeon card pool.
- A win has a 25% chance to give 1 Forge Stone: Uncommon in Dungeon 1, Rare in Dungeon 2 and Epic in Dungeon 3. The first win gives 3 Forge Stones in place of the chance. A loss gives none.
- Dungeon 3 also gives Legendary Forge Stones ([ADR-0039](../adr/0039-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)): 1 for the first win, and a 10% chance of 1 for a repeat win. This roll is separate from the Epic roll.
- Dungeons give no Heynstones, so the v1 Heynstone supply (section 2.6) does not change.
- At player level 30, XP has no use. Thus Dungeon 3 gives Essence in place of XP.
- A loss in Dungeon 3 gives 25% of the Essence of a win, as for XP. The 100 Essence of the first win is in place of × 2 Essence.
- The data is `DUNGEON_REWARDS` in `packages/rules/src/content/dungeons.ts`. Keep the code and this table the same.

### 2.5 Achievements

Most Achievements give 10 to 50 Heynstones. Achievements can also give 50 to 500 Coin or 10 to 100 Essence. 3 hard Achievements give an earn-only Cosmetic.

### 2.6 Heynstone supply in v1

All Heynstone sources are one-time rewards. The player cannot farm Heynstones.

| Source | Heynstones |
| --- | --- |
| Achievements (about 40) | About 1,000 |
| 30-Star chests (5) | 750 |
| 10th Heynspire Floors (5) | 250 |
| **Total** | **About 2,000** |

The total is about 83% of the Bazaar catalog cost (section 3.5). The player must choose what to unlock. With 5 Regions, the 30-Star chests give 750 Heynstones (it was 450 with 3 Regions). Check the total again when the Bazaar is planned in M4.

The data is `HEYNSTONE_SOURCES` in `packages/rules/src/content/heynstones.ts`. The Achievements value and the Bazaar catalog cost are estimates until their lists exist. Keep the code and this table the same.

### 2.7 Forge Stone supply

A Gear upgrade uses 1 Forge Stone of the tier of the new level (section 3.4). All 4 Gear items need 20 Forge Stones of each tier. The one-time sources give:

| Source | Common | Uncommon | Rare | Epic | Legendary |
| --- | --- | --- | --- | --- | --- |
| Stage first wins (10 for each Region) | 20 | 20 | 10 | — | — |
| 10-Star chests (5) | 4 | 4 | 2 | — | — |
| Dungeon first wins (3) | — | 3 | 3 | 3 | 1 |
| Heynspire Floors (5th and 10th) | — | — | 10 | 10 | 5 |
| **Total** | **24** | **27** | **25** | **13** | **6** |

The repeat wins, the Sweeps and the Dungeon wins give the rest. The Epic Forge Stones come mostly from Dungeon 3, so Gear levels 16 to 20 are the endgame. The Legendary Forge Stones come only from Dungeon 3 and the 10th Heynspire Floors, so Gear levels 21 to 25 are the last goal of the endgame ([ADR-0039](../adr/0039-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)). These numbers are a start: the economy sim tunes them ([ADR-0038](../adr/0038-gear-upgrades-need-earn-only-forge-stones.md)).

The rules are `stageForgeStones` and `regionForgeStoneTier` in `packages/rules/src/content/forge-stones.ts`, `STAR_CHESTS`, `floorFirstWinReward` and `dungeonForgeStones` with `DUNGEON_REWARDS`. Keep the code and these tables the same.

## 3. Sinks

### 3.1 Packs

There are three Packs. Each Pack has its own Drop Rates, price and Pack Guarantee. Each Pack also has a **Race Pack** version with only the Creature Cards of one Race, and a **Class Pack** version with only the Skill Cards of one Class. The player selects the Race or the Class. The player can select any Class that has Skill Cards, not only the current Hero Class. A Race Pack and a Class Pack cost 1.4 × the price of the same Pack with all cards.

| Pack | Cost | Race or Class Pack cost | Cards | Job |
| --- | ---: | ---: | ---: | --- |
| **Peddler Pack** | 350 Coin | 490 Coin | 5 | The most cards for each Coin. Fuel for Combine. Discovers Common and Uncommon Base Rank cards. |
| **Merchant Pack** | 500 Coin | 700 Coin | 5 | The middle Pack. It replaces the Standard Pack. |
| **Royal Pack** | 1,000 Coin | 1,400 Coin | 5 | Saves Combine Coin. Discovers Rare and Epic Base Rank cards. The only Pack with Legendary. |

**Drop rates for each card in a Pack:**

| Rank | Peddler | Merchant | Royal |
| --- | ---: | ---: | ---: |
| Common | 80% | 62% | — |
| Uncommon | 17% | 27% | 55% |
| Rare | 3% | 9% | 35% |
| Epic | — | 2% | 9% |
| Legendary | — | — | 1% |

**Value for each Coin.** On the Combine scale (Common 1, Uncommon 2, Rare 4, Epic 8, Legendary 16), the three Packs give about the same value for each Coin: 6.3, 8.4 and 16.9 for each Pack. A more expensive Pack is not a better deal, it does a different job. See [ADR-0027](../adr/0027-the-three-packs-give-equal-value-for-each-coin.md).

**Pack rules:**

1. For each card, roll a Rank with the table of the Pack.
2. Select one card from the cards in the Pack pool with a Base Rank equal to or lower than the rolled Rank. The Peddler Pack selects at random.
3. **New Card First.** The Merchant Pack and the Royal Pack select a card that the player has not Discovered, when step 2 permits one. If there are more such cards, select one at random. If the player has Discovered all of them, select at random.
4. The card comes in the rolled Rank.
5. A Peddler Pack and a Merchant Pack have at least 1 card of Uncommon or higher. If the first 4 cards are all Common, the fifth card is at least Uncommon.
6. All cards has only the Skill Cards of the current Hero Class. A Class Pack has only the Skill Cards of the selected Class. A Race Pack has no Skill Cards.
7. A Pack roll uses a random state in the player data that moves forward after each Pack. Thus a reload never gives a new roll.
8. The Packs screen shows the Drop Rates, the Pack Guarantees and these rules before the player opens a Pack.

**Rank changes.** A Pack rolls its 5 Ranks first. When a rule gives a Rank (rule 5, the Pack Guarantee or the ×10 bonus), the lowest Rank of the Pack changes to that Rank. If two or more Ranks are the lowest, the last one changes. Then the Pack selects a card for each Rank (rules 2 to 4). The reveal shows the 5 cards from the lowest Rank to the highest.

**Pack Guarantee.** Each Pack has its own counter. All versions of a Pack (all cards, the Race Packs and the Class Packs) share one counter. The counter counts the Packs in a row without a card of the Guarantee Rank or higher. For a Guarantee "in N Packs", if N − 1 Packs in a row have no such card, Pack N has one. Any card of that Rank or higher sets the counter back to 0. The Packs screen shows how many Packs are left.

| Pack | Pack Guarantee |
| --- | --- |
| Peddler | Rare or higher in 8 Packs |
| Merchant | Epic or higher in 12 Packs |
| Royal | Legendary in 20 Packs |

**Open ×10.** The player can buy 10 Packs of one kind in one action, for 10 × the price. Each Pack counts for the Pack Guarantee.

| Pack | ×10 bonus |
| --- | --- |
| Peddler | The 10 Packs have at least 1 Rare or higher. |
| Merchant | The 10 Packs have at least 1 Epic or higher. |
| Royal | The player opens 11 Packs. |

A Royal ×10 does not guarantee a Legendary, because then a single Royal Pack is a bad choice: a single Pack needs up to 20 Packs for its Guarantee.

**First Pack.** When Packs unlock at player level 2, the player gets one Peddler Pack as an Unopened Pack. A Pack from a Star chest is also an Unopened Pack. The Packs screen shows each Unopened Pack with a free "Open" button. A bought Pack opens at once, so it is never an Unopened Pack.

The data is `PACKS` in `packages/rules/src/content/packs.ts`. Keep the code and the tables of this section the same. `bun run sim packs` reports, for all cards, a Race Pack and the Class Pack of each Class, the real rate of each Rank, how often each Pack Guarantee gives a card, the value for each Coin and the number of Packs to Discover all cards of each Base Rank. It also reports the mean number of Legendary Skill Card copies in 100 Royal Class Packs.

### 3.2 Combine

| Target Rank | Copies needed | Coin |
| --- | --- | --- |
| Uncommon | 2 Common | 50 |
| Rare | 2 Uncommon | 200 |
| Epic | 2 Rare | 800 |
| Legendary | 2 Epic | 3,200 |

- Combine never fails.
- From Common to Legendary, a card needs 16 Common copies and 6,000 Coin in total (8 × 50 + 4 × 200 + 2 × 800 + 1 × 3,200). This is the long-term chase.
- The data is `COMBINE_COIN` in `packages/rules/src/content/workshop.ts`. Keep the code and this table the same.

### 3.3 Extract and Craft

| Rank | Essence from Extract | Essence cost to Craft (Base Rank) |
| --- | --- | --- |
| Common | 5 | 40 |
| Uncommon | 15 | 120 |
| Rare | 50 | 400 |
| Epic | 175 | 1,400 |
| Legendary | 600 | — (no v1 card has Base Rank Legendary) |

- Craft gives one copy in the card's Base Rank.
- The player can Craft only Discovered cards.
- Combine and then Extract changes Coin into Essence at about 10 to 13 Coin per Essence. This is intended. It gives players with much Coin a slow path to the card that they want.
- The data is `EXTRACT_ESSENCE` and `CRAFT_ESSENCE` in `packages/rules/src/content/workshop.ts`. Keep the code and this table the same.

### 3.4 Gear upgrades

The cost to upgrade an item to level *n* is 2.5 × *n* × (*n* + 1) Coin and 1 Forge Stone of the tier of level *n* ([ADR-0038](../adr/0038-gear-upgrades-need-earn-only-forge-stones.md)). *n* × (*n* + 1) is always even, so the Coin is a whole number. The Coin is half of the cost of [ADR-0037](../adr/0037-gear-has-20-levels-with-the-power-of-the-old-10.md).

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coin | 5 | 15 | 30 | 50 | 75 | 105 | 140 | 180 | 225 | 275 |
| Forge Stone | Common | Common | Common | Common | Common | Uncommon | Uncommon | Uncommon | Uncommon | Uncommon |

| Level | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coin | 330 | 390 | 455 | 525 | 600 | 680 | 765 | 855 | 950 | 1,050 |
| Forge Stone | Rare | Rare | Rare | Rare | Rare | Epic | Epic | Epic | Epic | Epic |

| Level | 21 | 22 | 23 | 24 | 25 |
| --- | --- | --- | --- | --- | --- |
| Coin | 1,155 | 1,265 | 1,380 | 1,500 | 1,625 |
| Forge Stone | Legendary | Legendary | Legendary | Legendary | Legendary |

One item from level 0 to 25 costs 14,625 Coin (1g 46s 25c) and 5 Forge Stones of each tier. All 4 items cost 58,500 Coin (5g 85s) and 20 Forge Stones of each tier. Levels 0 to 20 are 7,700 Coin of this for each item ([ADR-0039](../adr/0039-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)). The Forge Stone supply (section 2.7), not the Coin, is the main limit of the Gear pace.

The rules are `gearUpgradeCoin` and `gearUpgradeForgeStone` in `packages/rules/src/content/gear.ts`. Keep the code and this table the same.

### 3.5 Bazaar

The Bazaar sells Cosmetics and Conveniences for Heynstones. Earn-only Cosmetics are never in the Bazaar. In v1 the Bazaar has no Convenience: a Deck slot costs Coin (section 3.6).

| Item | Price (Heynstones) |
| --- | --- |
| Card back | 60 |
| Hero portrait | 100 |
| Gear look | 100 |
| Board skin | 200 |

- v1 has about 22 Bazaar Cosmetics. The full catalog costs about 2,400 Heynstones.
- A **Convenience** changes comfort or organization. It never changes the result of a Battle, the speed of progress or the content of the Collection. XP or Coin boosts, Battle skips, Packs, cards, Essence and Gear levels are never Conveniences.
- Each new Convenience must pass the Pillar 1 test before it goes into the Bazaar.

### 3.6 Deck slots

A new player has 3 Deck slots: one for each Starter Deck and one empty. The player buys more with Coin in the Deck builder, up to 10. Each slot costs more than the one before.

| Deck slot | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Coin | 500 | 1,000 | 1,500 | 2,000 | 3,000 | 4,000 | 5,000 |

- All 7 slots cost 17,000 Coin (1g 70s), a bit more than the Coin of two Gear items from level 0 to 20.
- The 4th slot costs the same as a Merchant Pack, so the player can buy it in Region 1. The last slots are a small Coin sink for the endgame.
- A Deck slot is a Convenience: it gives no power. It costs Coin and not Heynstones, so in v2 nobody pays real money for it.
- A purchase is permanent. The player cannot sell or remove a Deck slot.
- The data is `DECK_SLOT_PRICES` in `packages/rules/src/content/deck-slots.ts`. Keep the code and this table the same.

## 4. Pacing targets

Use these targets to tune the numbers. Check them with an economy simulation and with playtests.

| Point in the game | Target |
| --- | --- |
| End of Region 1 (about 2 hours) | Player level 6. 3 to 5 Packs opened. First Combine done. |
| End of Region 2 (about 6 hours) | Player level 10. 12 to 18 Packs opened. 1 Epic card. |
| End of Region 3 (8 to 15 hours) | Player level 15. 25 to 35 Packs opened. 60% to 75% of cards Discovered. |
| End of Region 4 (10 to 18 hours) | Player level 20. Dungeon 2 opens. |
| End of Region 5 (13 to 22 hours) | Player level 23. Heynspire opens. |
| Heynspire Floor 50 (about 35 hours) | Player level 28. All cards Discovered. 3 to 6 Legendary cards. Gear mostly at level 14 or higher. |
| About 22 more Dungeon 2 wins (1 to 2 weeks) | Player level 30. |

- The Player levels are the First-try Path levels of section 1.2. A Player who loses or plays again is at a higher level.
- **5 Regions ([ADR-0036](../adr/0036-the-campaign-has-5-regions-and-each-region-adds-one-race.md)).** The hours of the Region 4 and Region 5 rows and of Heynspire Floor 50 are draft targets. Check them with the economy sim.
- **Forge Stones ([ADR-0038](../adr/0038-gear-upgrades-need-earn-only-forge-stones.md)).** The Gear Coin is half, and each level needs a Forge Stone. The economy sim (7.1, 200 seeds) models Forge Stones since 2026-10-15. At Heynspire Floor 50, the mean Gear level is 15.5 (Collector), 15.3 (Upgrader) and 13.0 (Balanced). With the Coin-only cost of ADR-0037, it was 12.8, 12.0 and 9.3. The lowest Gear level is 15, 15 and 13. Thus the "Gear mostly at level 14 or higher" row passes for the Collector and the Upgrader, and it fails for the Balanced Player. The Balanced Player has about 10 Rare and 10 Epic Forge Stones that it did not use, and only 28 Coin: the Coin that it spends on Merchant Packs is its limit, not the Forge Stones. The Gear of all Play Styles stops at level 5 in Region 2 and at level 10 in Region 4, because Regions 1 and 2 give only Common and Regions 3 and 4 only Uncommon Forge Stones. The hours do not move by more than 0.5. **M3 re-tune:** the Balanced row still fails. Do not change the target. Check it again when the sim uses repeat wins and Sweeps, then change the supply of section 2.7.
- **Re-tune needed.** The Pack counts above were set for 88 cards. v1 now has 118 cards ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)). The "Discovered" targets stay the same. Tune the Coin rewards again with the economy simulation in M3, so that the Player can reach these targets with 118 cards.
- **Skill Cards of issue #57.** The 14 Common and Uncommon Skill Cards (116 cards in `cards.ts`) move no "Discovered" median of the economy sim (7.1) by more than 1 point, because the simulated Player Discovers only the Warrior Skill Cards (4 of the 14). At Heynspire Floor 50, the Player has Discovered 96% (Collector), 63% (Upgrader) and 91% (Balanced) of the cards. It was 96%, 63% and 90% (2026-10-11). The milestone does not move.
- **Ranger Skill Cards of issue #59.** Venom Arrow, Heartseeker (Rare) and Rain of Arrows (Epic) make 119 cards in `cards.ts`. The economy sim gives the same result as before (2026-10-11), because its Player Discovers only the Warrior Skill Cards. The milestone does not move. The Ranger Class Pack pool now has 10 cards (`bun run sim packs`, mean of 100 Players). A Peddler Pack never rolls an Epic card, so it cannot give Rain of Arrows. It needs 76.0 Packs to Discover the 9 Ranger cards from Common to Rare (it was 9.3 Packs for the 7 Common and Uncommon cards), because only 4.17% of its cards are Rare. A Merchant Class Pack needs 9.8 Packs for all 10 cards (it was 2.3), and a Royal Class Pack 4.0 (it was 2.0). On 2026-10-13, Hunter's Focus (Rare) replaced Heartseeker: the pool keeps 10 cards and the same Ranks, so these results do not change.
- **Priest Skill Cards of issue #61.** Unbroken Vow, Cleanse (Rare) and Aegis of Dawn (Epic) make 122 cards in `cards.ts`. The milestone does not move, for the same reason as #59: the simulated Player Discovers only the Warrior Skill Cards, and the all-cards Pack rows do not change. The Priest Class Pack pool now has 10 cards, the same as the Ranger pool, with the same results (`bun run sim packs`, 2026-10-12): 76.0 Peddler Packs for the 9 cards from Common to Rare, 9.8 Merchant Packs and 4.0 Royal Packs for all 10 cards (it was 9.3, 2.3 and 2.0).
- **Warrior Skill Cards of issue #63.** Expose Weakness, Call to Arms (Rare) and Onslaught (Epic) make 125 cards in `cards.ts`. The simulated Player Discovers the Warrior Skill Cards, so the "Discovered" medians of the economy sim (7.1, 200 seeds) go down by 1 to 2 points. At the end of Region 3, the Player has Discovered 73% (Collector), 54% (Upgrader) and 73% (Balanced) of the cards (it was 75%, 56% and 74%). At Heynspire Floor 50, it is 95%, 61% and 89% (it was 96%, 63% and 91%, 2026-10-12). The targets do not change: they wait for the re-tune in M3. In `bun run sim packs`, the all-cards Pack of a Warrior needs 1544.3 Peddler Packs for all cards from Common to Rare (it was 1408.3), 117.5 Merchant Packs (107.7) and 38.8 Royal Packs (36.3). The Warrior Class Pack pool now has 10 cards, with the same results as the Ranger and Priest pools: 76.0 Peddler Packs for the 9 cards from Common to Rare, 9.8 Merchant Packs and 4.0 Royal Packs for all 10 cards (it was 9.3, 2.3 and 2.0).
- **Mage Skill Cards of issue #65.** Spark (Common), Arc Lightning (Uncommon), Wildfire, Thunderstorm (Rare) and Blizzard (Epic) make 130 cards in `cards.ts`. The milestone does not move, for the same reason as #59: the simulated Player Discovers only the Warrior Skill Cards, and the all-cards Pack rows do not change. The Mage Class Pack pool now has 10 cards, with the same results as the other Class pools (`bun run sim packs`, 2026-10-12): 76.1 Peddler Packs for the 9 cards from Common to Rare, 9.4 Merchant Packs and 4.0 Royal Packs for all 10 cards (it was 6.1, 1.8 and 1.0 for the 5 Common and Uncommon cards).
- **Sweep ([ADR-0035](../adr/0035-a-sweep-uses-sweep-tickets-and-always-wins.md)).** With 2 Sweep Tickets for each played win, the Player can get 3 repeat-win rewards for the time of 1 Battle. The First-try Path and the targets that use its levels do not change. A Player who repeats Stages gets to the late targets (for example Player level 30) faster. The M3 re-tune must check the number of Tickets for each win and the repeat-win rewards with the Sweep. The economy sim does not use the Sweep yet.
- Total XP to level 21 (Deck size 30) is 8,380. Total XP to level 30 is 24,130.

## 5. Monetization rules after v1

In v1, the player can only earn Heynstones, and there are no real-money payments. When the online version sells Heynstones for real money in the Bazaar, these rules apply:

1. **Cosmetics and Conveniences only.** Real money buys only Heynstones, and Heynstones buy only Cosmetics and Conveniences. Real money never buys cards, Coin, Essence, XP, Gear, or any boost.
2. **Direct purchase.** The player sees the exact item before they pay. There are no random paid items and no paid Packs.
3. **Clear prices.** Show the price of each Bazaar item in real money too. Sell Heynstones only in bundles that match the Bazaar price points, so that a player can buy exactly the amount for one item. Earned and bought Heynstones share one balance.
4. **No pressure.** No countdown offers, no "only for you" pop-ups, and no ads that block play.
5. **Earnable.** Players can earn Heynstones through play. Earn-only Cosmetics are never for sale.
6. **Minors.** Follow the law for minors in each country of release. Use parental controls where the law requires them.
7. **Refunds.** Follow the refund law of each country and platform.

## 6. Trading (after v1)

Trading between players is a risk for Pillar 1. People can sell cards for real money outside the game. This makes power available for money. A separate design review must decide trading before any work starts. Possible options:

- No trading. Players exchange only Cosmetics or nothing.
- Trading only with Essence and with limits.
- Trading only between guild members, with a daily limit.

## 7. Tuning tools

- An **economy simulation** script uses the rules package and the reward tables. It simulates a player through the Campaign and Heynspire, and it reports the values in section 4. The rules for it are in section 7.1.

### 7.1 Economy simulation

`bun run sim economy [seeds]` simulates Players from a new Profile to Player level 30. It does not play Battles. The logic is in `packages/rules/src/simulation/economy.ts`. `bun run sim` with no mode does not run it.

**Content.** The sim uses the reward and cost tables of sections 2 and 3 from the rules package. The sim plays the Stages of Regions 1 to 5 (`CAMPAIGN_REGIONS` is 5). All 5 Regions have their Stages. When a Stage does not exist, the sim uses a **planned Stage** in its place, with the last Stage of each Region as the Boss Stage. The Coin and XP of a Stage come only from its Region and its Boss flag, so a planned Stage gives the correct rewards.

**Win chance.** Each Battle is a win or a loss from a win chance:

- The base chance of a Stage is the middle of its win-rate target (GDD 13): 70% for a normal Stage, 40% for a Boss Stage, and 97.5%, 92.5% and 87.5% for Stages 1-1 to 1-3. For a Heynspire Floor and a Dungeon, it is the middle of the target of a normal Stage (70%).
- The base chance is for a Player at the Recommended level with no Gear. The Recommended level of a Heynspire Floor is the First-try Path level before it (after all Stages and the earlier Floors). The Recommended level of a Dungeon is its unlock level.
- Each Player level above the Recommended level adds **0.5 points**, and each mean Gear level adds **1.25 points**, up to a cap of **95%**. The cap does not lower a base chance above it. `sim stage --level N --gear N` measured the two bonuses one time on 2026-10-10: on Region 1 with Vanguard (600 Battles for each Stage), the mean win rate of the normal Stages 1-4 to 1-9 went from 71.8% to 74.3% at 5 levels above, and to 83.8% at Gear 10 (90.6% at Gear 20). The measurement used the old Gear scale of 0 to 10, at 2.5 points for each old level. One old level is 2 levels now ([ADR-0037](../adr/0037-gear-has-20-levels-with-the-power-of-the-old-10.md)). The Boss Stage went from 39.7% to 42.2%, 57.3% and 70.7%. The constants are in the sim. When they change, change this section too.
- **Stars.** A Stage win gives **2 Stars**. `sim stage` on Region 1 gives about 2 Stars for each win. The Player does not repeat won Stages, so the 10-Star and the 20-Star chests open, but the 30-Star chest never opens in the sim.

**Player actions.**

- After a loss, the Player plays the same Stage again until a win. The Player does not repeat won Stages in the Campaign.
- After the last Stage, the Player climbs Heynspire. When a Floor fails 3 times in a row, the Player does Dungeon wins until the next Player level, and then tries the Floor again. A Floor loss gives 10% of the Coin and 25% of the XP of its first win (GDD 7.1). After Floor 50, the Player does Dungeon wins until level 30. The Player plays the highest Dungeon that gives XP and that its level unlocks.
- The Player uses each action only from its unlock level (GDD 7.1): Packs at level 2, Combine and Extract at level 3, Gear at level 5 and Craft at level 6.
- The simulated Player is a **Warrior** and starts with the Warrior Starter Deck cards. The Player buys only Packs with all cards. For the Race Pack from a 20-Star chest, the Player selects the Race with the fewest Discovered cards. "All cards Discovered" means all Creature Cards and the Warrior Skill Cards.
- A Player stops at Player level 30, or after 2,000 Battles. A Player at the cap is "stuck", and the report shows it.

**Play Styles.** Each simulated Player has one Play Style. All Play Styles first open the free Peddler Pack and buy the 4th Deck slot.

| Play Style | Priority |
| --- | --- |
| **Collector** | Merchant Pack (Royal Pack after Region 2), then Combine only to Epic or higher, then Gear |
| **Upgrader** | Combine each pair, then Gear up to the Player level × 2 ÷ 3, then Peddler Packs with the Coin that stays |
| **Balanced** | One Merchant Pack, then two Gear levels, and again. Then Combine each pair that it can pay for |

- Until the Player has the 4th Deck slot, it keeps its Coin for the slot.
- The Player buys Open ×10 when it can pay for 10 Packs. Else it buys one Pack.
- A Gear upgrade goes to the item with the lowest level. It needs the Coin and the Forge Stone. When the Forge Stone is missing, the Play Style goes to its next priority.
- Combine, Extract and Craft use the same rules actions as the game (GDD 7.4). The sim adds only the Play Style choices.
- Combine starts at the lowest Rank.
- All Play Styles Extract each copy above 2 of a card in the same Rank.
- When the Essence is enough, they Craft one copy of the cheapest Discovered card with Base Rank Rare or Epic that has 1 copy in its Base Rank. The copy makes a Combine pair toward an Epic or a Legendary copy. Craft never Discovers a card, because the player can Craft only Discovered cards (section 3.3).

**Not in the sim.**

- Achievements give no Coin or Essence in the sim, because the list of Achievements does not exist. The results are a floor.
- A repeat win gives no card. The Stage card pool exists in the rules (`stageCardPool`), but the sim does not use it yet.
- The Player does not repeat Stages or Sweep, so the repeat-win and the Sweep Forge Stones are not in the sim. The Player never plays Dungeon 3, because it gives no XP, so its Epic and Legendary Forge Stones are not in the sim. The Forge Stone results are a floor.
- The Dungeons give no first-win card in the sim. Only Dungeon 1 has one now (`DUNGEONS`), and the sim does not use it yet.
- The 30-Star chests do not open (see **Stars**). The Heynstone ledger counts them.

**Time.** One Battle is **8 minutes**, with the time in menus. The report shows Battles and hours. If the hour targets of section 4 do not agree with each other, change a target, not this value.

**Report.** The sim runs 200 seeds for each Play Style. At each checkpoint of section 4, it shows the median and the 10th to 90th percentile of: Battles, hours, Player level, Packs opened, % Discovered, Epic and Legendary copies, mean Gear level, the lowest Gear level and unspent Coin. It also shows the share of the Players with a Combine done. For an "about" target, the sim uses ± 25%. "Gear mostly at level 14 or higher" is the lowest Gear level. It shows each target next to the values. A second table shows the median and the 10th to 90th percentile of the Forge Stones of each tier that the Players did not use. It also shows one **First-try** run of each Play Style, with a win chance of 100%: this is the floor of Battles and the First-try Path of section 1.2. Then it shows the **Heynstone ledger**: each one-time source of section 2.6, the total, and the total as a % of the Bazaar catalog cost. The Heynstone sources are all fixed, so the ledger is a sum, not a simulation.

`--check` does not check the economy yet. After the first re-tune, add the section 4 targets to `--check`.
- During playtests, the game writes a local log of rewards and spending. The player can export the log and send it to the developer. The game never sends data automatically in v1.
