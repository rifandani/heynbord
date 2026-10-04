# 07 — Economy

This document defines the currencies, the sources and sinks, the Pack tables and the costs for v1. It also gives the rules for monetization after v1. All numbers are start values. Tune them with playtests and simulations.

Pillar 1 ("Fair to the player") controls all decisions in this document.

## 1. Currencies and resources

| Resource | Type | How the player gets it | What it is for |
| --- | --- | --- | --- |
| **Coin** | Soft currency | Battles, Star chests, Heynspire, Achievements | Packs, Combine, Gear upgrades |
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
| 10 | 300 Coin and 1 Standard Pack |
| 20 | 30 Essence and 1 Race Pack. The player selects the Race, as for a Race Pack bought with Coin. |
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

The total is about 65% of the Bazaar catalog cost (section 3.5). The player must choose what to unlock.

## 3. Sinks

### 3.1 Packs

| Pack | Cost | Cards | Content |
| --- | --- | --- | --- |
| **Standard Pack** | 500 Coin | 5 | All Creature Cards and Skill Cards |
| **Race Pack** | 700 Coin | 5 | Creature Cards of one Race. The player selects the Race. |

**Drop rates for each card in a Pack:**

| Rank | Chance |
| --- | --- |
| Common | 62.0% |
| Uncommon | 27.0% |
| Rare | 9.0% |
| Epic | 1.8% |
| Legendary | 0.2% |

**Pack rules:**

1. For each card, roll a Rank with the table above.
2. Select one card at random from the cards in the Pack pool with a Base Rank equal to or lower than the rolled Rank.
3. The card comes in the rolled Rank.
4. Each Pack has at least 1 card of Uncommon or higher. If the first 4 cards are all Common, the fifth card is at least Uncommon.
5. Skill Cards come only for the current Hero Class. This keeps the Pack useful.
6. The Packs screen shows this table and these rules before the player opens a Pack.

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
| Legendary | 600 | — (no card has Base Rank Legendary) |

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

The Bazaar sells Cosmetics and Conveniences for Heynstones. Earn-only Cosmetics are never in the Bazaar.

| Item | Price (Heynstones) |
| --- | --- |
| Card back | 60 |
| Hero portrait | 100 |
| Gear look | 100 |
| Board skin | 200 |
| Extra Deck slot (+1, up to 10 slots) | 50 |

- v1 has about 22 Bazaar Cosmetics and 5 extra Deck slots. The full catalog costs about 2,650 Heynstones.
- A **Convenience** changes comfort or organization. It never changes the result of a Battle, the speed of progress or the content of the Collection. XP or Coin boosts, Battle skips, Packs, cards, Essence and Gear levels are never Conveniences.
- Each new Convenience must pass the Pillar 1 test before it goes into the Bazaar.

## 4. Pacing targets

Use these targets to tune the numbers. Check them with an economy simulation and with playtests.

| Point in the game | Target |
| --- | --- |
| End of Region 1 (about 2 hours) | Player level 8 to 10. 3 to 5 Packs opened. First Combine done. |
| End of Region 2 (about 6 hours) | Player level 15 to 18. 12 to 18 Packs opened. 1 Epic card. |
| End of Region 3 (8 to 15 hours) | Player level 22 to 26. 25 to 35 Packs opened. 60% to 75% of cards Discovered. |
| Heynspire Floor 50 (about 30 hours) | Player level 30. All cards Discovered. 3 to 6 Legendary cards. Gear mostly at level 7 or higher. |

- The XP for the next level is 50 + 25 × (current level − 1).
- Total XP to level 21 (Deck size 30) is 5,750. Total XP to level 30 is 11,600.

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
