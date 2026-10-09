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

- Coin, Heynstones and Essence never change into each other. See [ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md).
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
| 6 → 20 | 340, then +20 for each level (340 … 600) | Campaign Regions 2 and 3, and the first half of Heynspire. |
| 20 → 30 | 1,000, then +150 for each level (1,000 … 2,350) | The long loop: the rest of Heynspire and many Dungeon wins. |

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

**Anchor check.** The first wins of a Region give 880 XP (Region 1), 1,540 XP (Region 2) and 2,200 XP (Region 3). On the First-try Path:

| After | Total XP | Player level | Target |
| --- | --- | --- | --- |
| Region 1 Boss Stage | 880 | 6 | 6: Gear near the Region 1 Boss, Craft right after it |
| Region 2 Boss Stage | 2,420 | 10 | 10: Dungeon 1 opens when the Player starts Region 3 |
| Region 3 Boss Stage | 4,620 | 15 | 15: Heynspire opens at the same time |
| About Heynspire Floor 24 | 7,380 | 20 | 20: Dungeon 2, about halfway up Heynspire |
| All 50 Heynspire Floors | 13,495 | 24 | — |
| About 53 more Dungeon 2 wins | 24,130 | 30 | 30: Dungeon 3, the final challenge, after 1 to 2 weeks |

The Heynspire and Dungeon rows use the first-win XP of each Floor (section 2.3) and the XP of a Dungeon 2 win (section 2.4).

On the First-try Path, the Region 1 Stages get the Player levels 1, 1, 2, 2, 3, 3, 4, 4, 5, 5. The Stages of Region 2 will get 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, and the Stages of Region 3 will get 10, 10, 11, 11, 12, 12, 13, 13, 13, 14.

## 2. Sources (faucets)

### 2.1 Campaign Stages

| Region | Coin per win | XP per win | First win bonus |
| --- | --- | --- | --- |
| 1 Hearthvale | 60 | 40 | ×3 Coin, ×2 XP, and a fixed card |
| 2 The Thornwood | 100 | 70 | ×3 Coin, ×2 XP, and a fixed card |
| 3 The Hollow Marches | 150 | 100 | ×3 Coin, ×2 XP, and a fixed card |

- A Boss Stage gives ×2 of the values above.
- A loss gives 10% of the Coin and 25% of the XP of a win.
- A repeat win has a 20% chance to give one card from the Stage card pool, in its Base Rank.

### 2.2 Star chests

Each Region has 3 Star chests.

| Stars in the Region | Reward |
| --- | --- |
| 10 | 300 Coin and 1 Merchant Pack |
| 20 | 30 Essence and 1 Merchant Race Pack. The player selects the Race, as for a Race Pack bought with Coin. |
| 30 | 150 Heynstones and 100 Essence |

### 2.3 Heynspire

| Floor | Reward for the first win |
| --- | --- |
| Each Floor *n* | 100 + 10 × *n* Coin, and 50 + 5 × *n* XP |
| Each 10th Floor | Also 1 earn-only Cosmetic, 150 Essence and 50 Heynstones |

### 2.4 Dungeons

| Dungeon | Coin per win | XP per win | First win bonus |
| --- | --- | --- | --- |
| 1 (player level 10) | 200 | 140 | ×3 Coin, ×2 XP, and a fixed card |
| 2 (player level 20) | 300 | 200 | ×3 Coin, ×2 XP, and a fixed card |
| 3 (player level 30) | 400 | — (15 Essence) | ×3 Coin, 100 Essence, and a fixed card |

- The values start at the Boss Stage values of the Region that the player usually plays at the unlock level.
- A loss and a repeat win use the same rules as a Campaign Stage (section 2.1). The card pool is the Dungeon card pool.
- Dungeons give no Heynstones, so the v1 Heynstone supply (section 2.6) does not change.
- At player level 30, XP has no use. Thus Dungeon 3 gives Essence in place of XP.

### 2.5 Achievements

Most Achievements give 10 to 50 Heynstones. Achievements can also give 50 to 500 Coin or 10 to 100 Essence. 3 hard Achievements give an earn-only Cosmetic.

### 2.6 Heynstone supply in v1

All Heynstone sources are one-time rewards. The player cannot farm Heynstones.

| Source | Heynstones |
| --- | --- |
| Achievements (about 40) | About 1,000 |
| 30-Star chests (3) | 450 |
| 10th Heynspire Floors (5) | 250 |
| **Total** | **About 1,700** |

The total is about 71% of the Bazaar catalog cost (section 3.5). The player must choose what to unlock.

## 3. Sinks

### 3.1 Packs

There are three Packs. Each Pack has its own Drop Rates, price and Pack Guarantee. Each Pack also has a **Race Pack** version with only the Creature Cards of one Race. The player selects the Race. A Race Pack costs 1.4 × the price of the same Pack with all cards.

| Pack | Cost | Race Pack cost | Cards | Job |
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
6. Skill Cards come only for the current Hero Class. This keeps the Pack useful. A Race Pack has no Skill Cards.
7. A Pack roll uses a random state in the player data that moves forward after each Pack. Thus a reload never gives a new roll.
8. The Packs screen shows the Drop Rates, the Pack Guarantees and these rules before the player opens a Pack.

**Pack Guarantee.** Each Pack has its own counter. A Pack and its Race Pack version share one counter. The counter counts the Packs in a row without a card of the Guarantee Rank or higher. For a Guarantee "in N Packs", if N − 1 Packs in a row have no such card, Pack N has one. Any card of that Rank or higher sets the counter back to 0. The Packs screen shows how many Packs are left.

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

**First Pack.** The first time that the player opens the Packs screen, one Peddler Pack is free.

### 3.2 Combine

| Target Rank | Copies needed | Coin |
| --- | --- | --- |
| Uncommon | 2 Common | 50 |
| Rare | 2 Uncommon | 200 |
| Epic | 2 Rare | 800 |
| Legendary | 2 Epic | 3,200 |

- Combine never fails.
- From Common to Legendary, a card needs 16 Common copies and 6,000 Coin in total (8 × 50 + 4 × 200 + 2 × 800 + 1 × 3,200). This is the long-term chase.

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

### 3.4 Gear upgrades

The cost to upgrade an item to level *n* is 40 × *n*² Coin.

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Coin | 40 | 160 | 360 | 640 | 1,000 | 1,440 | 1,960 | 2,560 | 3,240 | 4,000 |

One item from level 0 to 10 costs 15,400 Coin (1g 54s). All 4 items cost 61,600 Coin (6g 16s). This is the main Coin sink for the endgame.

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

- All 7 slots cost 17,000 Coin (1g 70s), a bit more than one Gear item from level 0 to 10.
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
| Heynspire Floor 50 (about 30 hours) | Player level 24. All cards Discovered. 3 to 6 Legendary cards. Gear mostly at level 7 or higher. |
| About 53 more Dungeon 2 wins (1 to 2 weeks) | Player level 30. |

- The Player levels are the First-try Path levels of section 1.2. A Player who loses or plays again is at a higher level.
- **Re-tune needed.** The Pack counts above were set for 88 cards. v1 now has 118 cards ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)). The "Discovered" targets stay the same. Tune the Coin rewards again with the economy simulation in M3, so that the Player can reach these targets with 118 cards.
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

- An **economy simulation** script uses the rules package and the reward tables. It simulates a player through the Campaign and Heynspire, and it reports the values in section 4.
- During playtests, the game writes a local log of rewards and spending. The player can export the log and send it to the developer. The game never sends data automatically in v1.
