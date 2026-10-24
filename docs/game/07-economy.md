# 07 — Economy

This document defines the currencies, the sources and sinks, the Pack tables and the costs for v1. It also gives the rules for monetization after v1. All numbers are start values. Tune them with playtests and simulations.

Pillar 1 ("Fair to the player") controls all decisions in this document.

## 1. Currencies and resources

| Resource | Type | How the player gets it | What it is for |
| --- | --- | --- | --- |
| **Coin** | Soft currency | Battles, Star chests, Heynspire, Achievements, Seaport Expeditions | Packs, Combine, Gear upgrades, Deck slots |
| **Heynstones** | Rare currency | 10th Heynspire Floors, Achievements (one time each) | Cosmetics and Conveniences in the Bazaar |
| **Essence** | Craft resource | Extract, Heynspire Boss Floors, Achievements, Seaport Expeditions | Craft and Fuse |
| **XP** | Progress | Battles, Seaport Expeditions | Player level |
| **Stars** | Progress | Stage wins | Star chests |
| **Forge Stones** | Gear resource, 5 tiers | Stage wins, 10-Star chests, Sweeps, Dungeons, Heynspire, the Forge Stone Cargo of the Seaport | Gear upgrades |

- Coin, Heynstones and Essence never change into each other. See [ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md).
- Forge Stones are earn-only. The Bazaar never sells them, and they never change into Coin, Heynstones or Essence. See [ADR-0036](../adr/0036-gear-upgrades-need-earn-only-forge-stones.md).
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

A loss gives up to 25% of the XP of a win (its Loss share). A Stage Repeat win and a Campaign Sweep give no XP (section 2.1, [ADR-0047](../adr/0047-a-stage-repeat-win-gives-no-xp.md)). Thus a real Player is at or above the level of the First-try Path, and a Player who plays Stages again for 3 Stars does not get far above it. The Recommended level is a floor.

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

| Region | Coin of a win | XP of a win | First win | Repeat win |
| --- | --- | --- | --- | --- |
| 1 Hearthvale | 60 | 40 | ×3 Coin, ×2 XP, and a fixed card | 20 Coin, no XP |
| 2 The Red Mesas | 100 | 70 | ×3 Coin, ×2 XP, and a fixed card | 33 Coin, no XP |
| 3 The Glowcap Hollows | 150 | 100 | ×3 Coin, ×2 XP, and a fixed card | 50 Coin, no XP |
| 4 The Thornwood | 200 | 130 | ×3 Coin, ×2 XP, and a fixed card | 66 Coin, no XP |
| 5 The Hollow Marches | 250 | 160 | ×3 Coin, ×2 XP, and a fixed card | 83 Coin, no XP |

- A Boss Stage gives ×2 of the Coin and the XP of a win. Its first win, its Repeat win and its loss use these doubled values.
- A **Repeat win** of a Stage gives ⅓ of the Coin of a win, rounded down, and **no XP** ([ADR-0047](../adr/0047-a-stage-repeat-win-gives-no-xp.md)). Thus XP comes from new content: first wins, losses, Floors and Dungeons. A Repeat win gives Coin, Forge Stones and cards. The ⅓ Coin is a tuning value of issue #105, not part of ADR-0047.
- A first win also gives 1 Forge Stone of the tier of the Region: Common in Regions 1 and 2, Uncommon in Regions 3 and 4, and Rare in Region 5. A Boss Stage gives the same Forge Stone.
- A repeat win has a 10% chance to give 1 Forge Stone of the tier of the Region. A Campaign Sweep uses the same rule for each Campaign Sweep Ticket. A loss gives no Forge Stone.
- A loss gives 10% of the Coin and 25% of the XP of a win, but only its **Loss share**: these values × the share of the total HP of the enemy Heroes that they lost in the Battle, rounded down. A loss with no lost enemy Hero HP gives nothing. Thus a Player cannot get Coin and XP from fast losses where they only end the Turns ([ADR-0041](../adr/0041-a-loss-gives-only-the-share-of-the-lost-enemy-hero-hp.md)).
- A Campaign Sweep (GDD 4.12) gives one repeat-win reward for each Campaign Sweep Ticket, with no Battle: the same reward as a manual Repeat win, so no XP. A Stage win and a Floor win give 2 Campaign Sweep Tickets. A loss and an Abandon give none.
- A repeat win has a 20% chance to give one card from the Stage card pool, in its Base Rank. The Stage card pool is the different cards of the enemy Deck of the Stage, but not a Skill Card of a Class that is not the Class of the player's Deck. Each card in the pool has the same chance.

The rules are `stageCoin` in `packages/rules/src/content/stage-coin.ts` and `stageXp` in `packages/rules/src/content/player-levels.ts`. Keep the code and the table above the same.

### 2.2 Star chests

Each Region has 3 Star chests.

| Stars in the Region | Reward |
| --- | --- |
| 10 | 300 Coin, 1 Merchant Pack and 2 Forge Stones of the tier of the Region |
| 20 | 30 Essence and 1 Merchant Race Pack. The player selects the Race, as for a Race Pack bought with Coin. |
| 30 | 500 Coin, 100 Essence and 1 Royal Pack |

Star chests give no Heynstones [ADR-0042](../adr/0042-star-chests-give-no-heynstones.md).

The data is `STAR_CHESTS` in `packages/rules/src/content/star-chests.ts`. Keep the code and this table the same.

### 2.3 Heynspire

| Floor | Reward for the first win |
| --- | --- |
| Each Floor *n* | 100 + 10 × *n* Coin, and 50 + 5 × *n* XP |
| Each 5th Floor that is not a 10th Floor | Also 2 Rare Forge Stones |
| Each 10th Floor | Also 1 earn-only Cosmetic, 150 Essence, 50 Heynstones, 2 Epic Forge Stones and 1 Legendary Forge Stone |

- **No replay.** The player fights only the Current Floor, and a won Floor cannot be played again. Thus a Floor win is always a first win. A Floor has no repeat-win reward and no Sweep.
- A win also gives 2 Campaign Sweep Tickets, as a Stage win ([ADR-0039](../adr/0039-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)). A Floor win gives no Stars and no card.
- A loss uses the rule of a Stage loss (section 2.1): 10% of the Coin and 25% of the XP of the win, and only the Loss share of them. The Loss share uses the HP of the enemy Hero. A loss gives no Essence, no Heynstones, no Forge Stones and no Tickets. An Abandon gives nothing.
- A Boss Floor win grants its earn-only Cosmetic at once, in Floor order (`BOSS_FLOOR_COSMETICS` in `packages/rules/src/content/cosmetics.ts`). The migration of Profile version 10 pays the Cosmetics that an old Profile won before the list existed, so the player loses nothing.

The rule is `floorFirstWinReward` in `packages/rules/src/content/heynspire.ts`, and the result action is `applyFloorResult` in `packages/rules/src/profile/floor-result.ts`. Keep the code and this table the same.

### 2.4 Dungeons

| Dungeon | Coin per win | XP per win | First win bonus |
| --- | --- | --- | --- |
| 1 (player level 10) | 200 | 140 | ×3 Coin, ×2 XP, and a fixed card |
| 2 (player level 20) | 300 | 200 | ×3 Coin, ×2 XP, and a fixed card |
| 3 (player level 30) | 400 | — (15 Essence) | ×3 Coin, 100 Essence, and a fixed card |

- The values start at the Boss Stage values of the Region that the player usually plays at the unlock level.
- A loss uses the same rule as a Campaign Stage (section 2.1). The Loss share uses the HP of all the Bosses, and it also applies to the Essence of Dungeon 3. A Repeat win gives the full Coin and the full XP (Essence in Dungeon 3) of a win, not the ⅓ Coin and no XP of a Stage Repeat win: Dungeon wins are the loop from Player level 23 to 30 ([ADR-0047](../adr/0047-a-stage-repeat-win-gives-no-xp.md)). Its card chance is the rule of section 2.1, with the Dungeon card pool.
- A win gives 1 Dungeon Sweep Ticket and no Campaign Sweep Tickets. A loss and an Abandon give none. A Dungeon Sweep (GDD 4.12) gives one repeat-win reward for each Dungeon Sweep Ticket, with no Battle: the Coin, the XP or the Essence, the card chance, and the Forge Stone rolls with the Legendary roll of Dungeon 3. The Class of the Active Deck sets the card pool. A Dungeon Sweep does not add to the wins of the Dungeon ([ADR-0039](../adr/0039-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)).
- A win has a 25% chance to give 1 Forge Stone: Uncommon in Dungeon 1, Rare in Dungeon 2 and Epic in Dungeon 3. The first win gives 3 Forge Stones in place of the chance. A loss gives none.
- Dungeon 3 also gives Legendary Forge Stones ([ADR-0037](../adr/0037-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)): 1 for the first win, and a 10% chance of 1 for a repeat win. This roll is separate from the Epic roll.
- Dungeons give no Heynstones, so the v1 Heynstone supply (section 2.6) does not change.
- At player level 30, XP has no use. Thus Dungeon 3 gives Essence in place of XP.
- A loss in Dungeon 3 gives 25% of the Essence of a win, as for XP. The 100 Essence of the first win is in place of × 2 Essence.
- The data is `DUNGEON_REWARDS` in `packages/rules/src/content/dungeons.ts`. Keep the code and this table the same.

### 2.5 Achievements

Most Achievements give 10 to 50 Heynstones. Achievements can also give 50 to 500 Coin or 10 to 100 Essence. 3 hard Achievements give an earn-only Cosmetic. The 40 Achievements give 1,000 Heynstones, 500 Coin and 50 Essence. The list is in [15 — Achievements](./15-achievements.md).

### 2.6 Heynstone supply in v1

All Heynstone sources are one-time rewards. The player cannot farm Heynstones.

| Source | Heynstones |
| --- | --- |
| Achievements (40) | 1,000 |
| 10th Heynspire Floors (5) | 250 |
| **Total** | **1,250** |

The total is about 40% of the Bazaar catalog cost (section 3.5). The player must choose what to unlock. The 30-Star chests gave 750 Heynstones before [ADR-0042](../adr/0042-star-chests-give-no-heynstones.md). Check the total again when the Bazaar is planned in M4.

The data is `HEYNSTONE_SOURCES` in `packages/rules/src/content/heynstones.ts`, and the catalog cost is `BAZAAR_CATALOG_HEYNSTONES` in `packages/rules/src/content/cosmetics.ts`. Keep the code and this table the same.

### 2.7 Forge Stone supply

A Gear upgrade uses 1 Forge Stone of the tier of the new level (section 3.4). All 4 Gear items need 20 Forge Stones of each tier. The one-time sources give:

| Source | Common | Uncommon | Rare | Epic | Legendary |
| --- | --- | --- | --- | --- | --- |
| Stage first wins (10 for each Region) | 20 | 20 | 10 | — | — |
| 10-Star chests (5) | 4 | 4 | 2 | — | — |
| Dungeon first wins (3) | — | 3 | 3 | 3 | 1 |
| Heynspire Floors (5th and 10th) | — | — | 10 | 10 | 5 |
| **Total** | **24** | **27** | **25** | **13** | **6** |
| Forge Stone Cargoes to Floor 50 (not one-time: the median of the economy sim) | — | — | — | 1 | — |

The total is of the one-time sources only. The repeat wins, the Sweeps and the Dungeon wins give the rest. The Epic Forge Stones come mostly from Dungeon 3, so Gear levels 16 to 20 are the endgame. The Legendary Forge Stones come only from Dungeon 3 and the 10th Heynspire Floors, so Gear levels 21 to 25 are the last goal of the endgame ([ADR-0037](../adr/0037-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)). These numbers are a start: the economy sim tunes them ([ADR-0036](../adr/0036-gear-upgrades-need-earn-only-forge-stones.md)).

The Forge Stone Cargo of the Seaport (section 2.8) gives 1 Epic Forge Stone for each full 48-hour voyage. The economy sim counts it with its play calendar (7.1). It opens at level 24, at about the end of Region 5, and the median Player of the sim sends it 1 time in 4, so it gets 1 Epic Forge Stone (1 to 2) from it before the Floor 50 win: 9% of its Epic Forge Stones at that point (section 4). A Player who sends only the Forge Stone Cargo gets up to 3 to 4 for each week. The "Gear mostly at level 14 or higher" target of Floor 50 passes for all Play Styles.

The rules are `stageForgeStones` and `regionForgeStoneTier` in `packages/rules/src/content/forge-stones.ts`, `STAR_CHESTS`, `floorFirstWinReward` and `dungeonForgeStones` with `DUNGEON_REWARDS`. Keep the code and these tables the same.

### 2.8 Seaport Expeditions

The Seaport gives a reward while the Player is away ([ADR-0051](../adr/0051-the-seaport-gathers-coin-on-the-device-clock.md)). The Player selects a **Cargo** and a duration, Dispatches the ship, closes the game, and Collects the reward later. One ship, one berth: the ship is on one Expedition at a time. The Seaport opens at Player level 8 (GDD 7.1). Each Cargo and each duration has its own unlock level, as a Dungeon does. An Expedition is open when the Player level opens both its Cargo and its duration.

Each Cargo gives only its own resource:

| Cargo | Opens at | For each hour, before the bonus | 6 h | 12 h | 24 h | 48 h |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `coin` — Coin | level 8 | 60 Coin | 360 | 756 | 1,584 | 3,312 |
| `xp` — XP | level 12 | 3 XP | 18 | 37 | 79 | 165 |
| `essence` — Essence | level 18 | 6 Essence | 36 | 75 | 158 | 331 |
| `forgeStones` — Forge Stones | level 24 | — | 1 Uncommon | 1 Rare | 2 Rare | 1 Epic |

The durations:

| Duration | Opens at | Bonus for each hour |
| --- | --- | ---: |
| 6 h | level 8 | — |
| 12 h | level 12 | +5% |
| 24 h | level 18 | +10% |
| 48 h | level 24 | +15% |

The cells of the first table are the full voyage: `rate × (100% + bonus) × hours`, rounded down. Thus the Seaport opens with Coin for 6 hours only, and each later level opens a Cargo and a longer voyage together (levels 12, 18 and 24).

- **The reward is pro rata.** `reward = rate × (100% + bonus) × min(elapsed, duration)`, in whole units, rounded down, where `elapsed = now − startedAt` and `startedAt` is the time of the Dispatch. The reward stops at the duration. The ship then waits, and the Player never loses anything.
- **No minimum time away.** The Player can Collect at any time. An early Collect gives only the share of the time away, and the ship is at the berth again.
- **The Forge Stones need the full voyage.** A longer voyage gives a higher tier, or more stones of the same tier. An early Collect of the Forge Stone Cargo gives nothing, so a Forge Stone is always a whole number. The screen calls it "Call back early" and asks again before it gives nothing.
- **The clock is the device clock.** The rules stay pure: the web sends `now` with each Command, so the same Profile and the same `now` always give the same reward, and a page load never rolls a reward again. When `now` is before `startedAt` (the clock moved back), the reward is 0 and the ship stays.
- **The rates are a supplement.** The Seaport is never the best source of a resource: at Floor 50, it gives the median Player 10% of its Coin and 2% of its XP (see "In the sim" below). The economy sim checks each rate with the targets of section 4. A longer voyage pays a little more for each hour, so patience pays without a punishment for a short time away.
- **The durations open by level.** With all durations open at level 8, a 48-hour Coin voyage gave 1,656 Coin for each day of the play calendar, and the Collector opened 28 Packs by the end of Region 2 (target 15 to 25, section 4). The Seaport income grows with the Player, as the other sources do.
- **Pillar 1.** No Energy, no daily cap and no punishment for time away.
- **What stays out.** No Heynstones ([ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md), [ADR-0042](../adr/0042-star-chests-give-no-heynstones.md)). No exchange of one resource for another (ADR-0008). No Seaport levels and no VIP: no Building has levels. No scale with the Power of the Deck.
- **In the sim.** The economy sim sends the ship with its play calendar: 1 hour of play each day, then 1 day away (7.1). The median Player needs all the resources, so it takes each open Cargo in turn, on the longest open duration. Thus `sim:check` judges the targets of section 4 with the Seaport income. At Heynspire Floor 50, the Seaport gives the median Player about 10,000 Coin (10% of its Coin), 430 XP (2%), 650 Essence (12% Collector, 31% Upgrader, 23% Balanced) and 1 Epic Forge Stone (9%). The Seaport stays a supplement: Battles give the rest.
- Coin is in Copper (section 1.1). The names of the Cargoes are in the Message Catalogs, so a rename changes no rule. Epic is the Forge Stone tier of the 48-hour voyage: it opens at level 24, where Gear levels 16 to 20 need Epic Forge Stones, 6 levels before Dungeon 3.
- **Re-tune of issue #114 (2026-10-18).** The economy sim checked the first values with its play calendar. With 2 XP for each hour on 3 of the 4 Expeditions, 11% to 13% of the Players got to level 30 before they won Floor 50 (target: at most 10%, section 4). Thus the XP was 1 for each hour.
- **Cargoes (2026-10-18).** The 4 fixed Expeditions (the Coastal Run, the Trade Route, the Long Voyage and the Grand Expedition, each with more reward lines) became 4 Cargoes × 4 durations, so that the Player selects what it needs. An XP Cargo gives only XP, so its rate is 3 for each hour: the XP for each day of the median Player is the same as before (2% of its XP at Floor 50), and 8% to 9% of the Players get to level 30 before Floor 50. The Coin and the Epic Forge Stones of the Seaport are less than before, because the median Player now sends each Cargo in turn (section 4).

The data is `EXPEDITION_CARGOES`, `EXPEDITION_DURATIONS` and `expeditionReward` in `packages/rules/src/content/expeditions.ts`, and the actions are `startExpedition`, `activeExpedition` and `collectExpedition` in `packages/rules/src/profile/seaport.ts`. Keep the code and these tables the same.

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

**Value for each Coin.** On the Combine scale (Common 1, Uncommon 2, Rare 4, Epic 8, Legendary 16), the three Packs give about the same value for each Coin: 6.3, 8.4 and 16.9 for each Pack. A more expensive Pack is not a better deal, it does a different job. See [ADR-0026](../adr/0026-the-three-packs-give-equal-value-for-each-coin.md).

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
| Epic | 175 | — |
| Legendary | 600 | — |

- Craft gives one copy in the card's Base Rank. Only a card with Base Rank Common, Uncommon or Rare can be Crafted: an Epic or a Legendary card has no Craft ([ADR-0050](../adr/0050-craft-gives-no-epic-or-legendary-card.md)).
- The player can Craft only Discovered cards.
- An Epic card comes from a Merchant or a Royal Pack, or from a Fuse (section 3.7). A Specialist (Base Rank Legendary) comes from a Royal Pack only ([ADR-0048](../adr/0048-a-base-rank-legendary-creature-card-is-a-specialist.md)).
- Combine and then Extract changes Coin into Essence at about 10 to 13 Coin per Essence. This is intended. It gives players with much Coin a slow path to the Common, Uncommon and Rare cards that they want.
- The data is `EXTRACT_ESSENCE` and `CRAFT_ESSENCE` in `packages/rules/src/content/workshop.ts`. Keep the code and this table the same.

### 3.4 Gear upgrades

The cost to upgrade an item to level *n* is 2.5 × *n* × (*n* + 1) Coin and 1 Forge Stone of the tier of level *n* ([ADR-0036](../adr/0036-gear-upgrades-need-earn-only-forge-stones.md)). *n* × (*n* + 1) is always even, so the Coin is a whole number. The Coin is half of the cost of [ADR-0035](../adr/0035-gear-levels-are-rescaled-to-half-steps.md).

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

One item from level 0 to 25 costs 14,625 Coin (1g 46s 25c) and 5 Forge Stones of each tier. All 4 items cost 58,500 Coin (5g 85s) and 20 Forge Stones of each tier. Levels 0 to 20 are 7,700 Coin of this for each item ([ADR-0037](../adr/0037-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)). The Forge Stone supply (section 2.7), not the Coin, is the main limit of the Gear pace.

The rules are `gearUpgradeCoin` and `gearUpgradeForgeStone` in `packages/rules/src/content/gear.ts`. Keep the code and this table the same.

### 3.5 Bazaar

The Bazaar sells Cosmetics and Conveniences for Heynstones. Earn-only Cosmetics are never in the Bazaar. In v1 the Bazaar has no Convenience: a Deck slot costs Coin (section 3.6).

| Item | Price (Heynstones) |
| --- | --- |
| Card back | 60 |
| Premium card back | 120 |
| Hero portrait | 100 |
| Gear look | 100 |
| Board skin | 200 |

- v1 has 27 Bazaar Cosmetics: 8 card backs, 7 Hero portraits, 6 Gear looks and 6 Board skins. The full catalog costs exactly 3,160 Heynstones. 2 Board skins have the look of a place that is not a Region: Spire Noon (the Heynspire) and Deep Crystal (the Dungeons).
- A **Premium card back** costs twice a normal card back: 120 Heynstones. 3 card backs are Premium: Duel Monster, Duel Monster V2 and Vanguard. Each other Bazaar item of a family has the price of the family. A purchase is permanent: the player cannot sell or lose a Cosmetic (ADR-0008).
- The player uses one **Active Cosmetic** of each family at a time, and selects it from the Cosmetics that the player owns ([ADR-0052](../adr/0052-a-player-uses-one-cosmetic-for-each-family.md)). The **Standard look** of a family costs nothing and is not a Cosmetic, so a player can always go back to it. The Standard look of the card backs is the **Standard Back**, the Standard look of the Gear looks is the **Standard kit**, and the Standard look of the Board skins is the **Standard ground**.
- The Bazaar shows each family with a preview: a shelf with the look, and a thumbnail on each item. The Board skin shelf shows the Lane runners of 3 Lanes on the Hearthvale meadow, and the Gear look shelf shows the 4 Gear icons of the look. The player sees a look before the purchase and before the Use.
- The data is `BAZAAR_COSMETICS` in `packages/rules/src/content/cosmetics.ts`. Keep the code and this table the same.
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

### 3.7 Fuse

A Fuse changes 2 to 4 copies of one Rank and Essence into one copy of a card that the player has not Discovered ([ADR-0049](../adr/0049-fuse-gives-a-card-that-is-not-discovered.md), GDD 7.4).

| Rank of the copies | Copies | Essence cost | New card |
| --- | --- | --- | --- |
| Common | 2 | 20 | 1 copy of a Common card |
| Uncommon | 2 | 60 | 1 copy of an Uncommon card |
| Rare | 3 | 200 | 1 copy of a Rare card |
| Epic | 4 | 700 | 1 copy of an Epic card |

- The Essence cost is 20, 60 and 200 Essence for Common, Uncommon and Rare, half of the Craft cost of the Rank (section 3.3), and 700 Essence for Epic. The Epic Fuse is the only Essence path to a new Epic card ([ADR-0050](../adr/0050-craft-gives-no-epic-or-legendary-card.md)).
- The Rank is the Rank of each copy, not its Base Rank. A Common card at Rank Rare is a Rare copy.
- A Legendary copy is never an input. Thus a Fuse never gives a Specialist.
- All copies are Creature Cards, or all are Skill Cards. The new card has the Race (or the Class) of an input copy. Each input copy gives its Race or Class one equal share of the chance. A Race or Class with no card that is not Discovered has no share.
- When no card can be given, the player cannot Fuse. A Fuse always gives a new card, so luck never takes copies or Essence for nothing (Pillar 1).
- The Fuse uses the random state of the reward rolls of the Profile, so the same Profile always gives the same card.
- A Fuse unlocks at player level 6, the same as Craft (GDD 7.1).
- Craft is the path to the card that the player selects. Fuse is the Workshop path to a card that the player does not have yet. It is a use for spare copies other than Extract (Pillar 4).
- The data is `FUSE_COPIES` and `FUSE_ESSENCE` in `packages/rules/src/content/workshop.ts`. Keep the code and this table the same.

## 4. Pacing targets

Use these targets to tune the numbers. Check them with an economy simulation and with playtests.

| Point in the game | Target |
| --- | --- |
| End of Region 1 (3 to 5 hours) | Player level 6. 6 to 10 Packs opened. First Combine done. |
| End of Region 2 (6.5 to 11 hours) | Player level 10. 15 to 25 Packs opened. 1 Epic card. |
| End of Region 3 (8 to 15 hours) | Player level 15. 60% or more of cards Discovered. |
| End of Region 4 (13 to 22 hours) | Player level 20. Dungeon 2 opens. |
| End of Region 5 (16 to 27 hours) | Player level 23. Heynspire opens. |
| Heynspire Floor 50 (about 30 hours) | Player level 28. All cards Discovered. 3 to 6 Legendary cards. Gear mostly at level 14 or higher. |
| About 22 more Dungeon 2 wins (1 to 2 weeks) | Player level 30. At most 10% of the Players get to level 30 before they win Floor 50. |

- The targets are for the median Player of a Play Style who plays each Stage of a Region again until the Stage has 3 Stars, and who uses its Sweep Tickets ([ADR-0044](../adr/0044-pacing-targets-are-for-a-player-who-replays-for-3-stars.md)). The Player also sends the ship of the Seaport (section 2.8) between its sessions.
- **Play calendar.** The hours of this table are hours of play. The median Player plays **1 hour each day**, so an hour of play is also a day of the calendar: Floor 50 is about 30 days. Between two sessions, the Player is away **1 day** (24 hours). The economy sim uses this calendar for the Seaport income (7.1). It is generous: the ship of a 24-hour or a 48-hour voyage is always back at the next session or at the session after it. Thus the sim gives the most Seaport income that a daily Player gets, and a pass of the targets with it is safe. A change of the calendar is a change of this note and of `PLAY_MINUTES_PER_DAY` and `HOURS_AWAY` in `packages/rules/src/simulation/economy.ts` together.
- The Player levels are the First-try Path levels of section 1.2. A Player who loses or plays again is at a higher level. Thus the economy sim judges the Player level targets on its First-try run, not on the medians (7.1). A higher median level is not a miss.
- **First Combine and the Collector.** The Collector Combines only to Epic or higher (7.1), so the "First Combine done" target of Region 1 does not apply to it. The sim report shows no target and no miss for that cell (`notFor` in `PACING_TARGETS`).
- **All cards Discovered and the Upgrader.** The Upgrader buys only Peddler Packs (7.1), and a Peddler Pack never gives an Epic card (section 3.1). Thus the "All cards Discovered" target of Floor 50 does not apply to it (`notFor`).
- **Gated and draft targets.** `bun run sim:check` judges each target of this table for each Play Style (7.1, issue #108). Each target is gated: a miss fails the check. The hours of Region 4, Region 5 and Floor 50 are no longer draft targets. One target is draft for one Play Style: "All cards Discovered" at Floor 50 for the Balanced Player (see the note below). A miss of a draft target shows "review" and does not fail the check (`draftFor` in `PACING_TARGETS`).
- **Re-tune of issue #105 (2026-10-17).** The economy sim with repeat Battles for 3 Stars and Sweeps (issue #107) got the median Player to level 30 in Region 3: a Player who plays each Stage again for 3 Stars got about 4.5 × the XP and 3.3 × the Coin of the First-try Path, and the Campaign Sweeps gave more than half of it. The re-tune made these changes:
  - A Stage Repeat win and a Campaign Sweep give no XP ([ADR-0047](../adr/0047-a-stage-repeat-win-gives-no-xp.md)) and ⅓ of the Coin of a win (section 2.1). First wins do not change. The 2 Campaign Sweep Tickets for each win stay. Dungeon Repeat wins and Dungeon Sweeps keep their full Coin and XP (ADR-0039).
  - **Hours.** The hour targets follow the Battles (7.1: change a target, not the Battle time). The Player plays about 30 Battles in Region 1 and about 33 in each later Region, with its repeat Battles for 3 Stars. The targets are Region 1 3 to 5 hours, Region 2 6.5 to 11, Region 3 8 to 15 (no change), Region 4 13 to 22, Region 5 16 to 27, and Floor 50 about 30 (22.5 to 37.5).
  - **Packs.** The Pack targets of Regions 1 and 2 keep the old rate of about 2 Packs for each hour, with the new hours: 6 to 10 and 15 to 25. Region 3 has no Packs target: the old pair "25 to 35 Packs, 60% to 75% Discovered" was for 88 cards and the Standard Pack, and the Merchant and Royal Packs give more new cards for each Pack. The Discovered target of Region 3 is 60% or more, with no upper limit.
  - **Legendary Combine.** The Upgrader and the Balanced Player keep their Coin for the Legendary Combine (3,200 Coin) when they have an Epic pair (7.1). Without this rule, they had 0 Legendary copies at Floor 50. The Collector does not use the rule: with it, the Collector had 9 Legendary copies (target 3 to 6).
  - A new target: at most 10% of the Players get to level 30 before they win Floor 50. The sim goes on to the Floor 50 win after level 30 (7.1).
- **Result of the re-tune.** `bun run sim economy 1000` on 2026-10-17. Medians, Collector / Upgrader / Balanced:

  | Checkpoint | Battles | Hours | Packs | Discovered | Legendary | Lowest Gear |
  | --- | --- | --- | --- | --- | --- | --- |
  | Region 1 | 30 | 4.0 | 9 / 7 / 7 | 55% / 38% / 46% | 0 | 4 |
  | Region 2 | 65 | 8.7 | 21 / 15 / 15 | 83% / 60% / 72% | 0 | 5 |
  | Region 3 | 98 | 13.1 | 29 / 20 / 23 | 94% / 75% / 85% | 0 / 1 / 1 | 8 |
  | Region 4 | 131 | 17.5 | 40 / 28 / 31 | 99% / 83% / 92% | 1 | 10 |
  | Region 5 | 163–164 | 21.7–21.9 | 54 / 33 / 37 | 100% / 89% / 95% | 2 | 13 |
  | Floor 50 | 223 | 29.7 | 68 / 42 / 48 | 100% / 90% / 96% | 3 / 4 / 3 | 16 / 17 / 17 |

  Each target passes, with one exception (see the next note). The median Player level is 6, 11, 16, 21, 23 and 28 at these checkpoints. The First-try run does not change: levels 6, 10, 15, 20, 23, 28 and 30. The Upgrader and the Balanced Player have the "First Combine done" in Region 1 (100%), and all Play Styles have 4 to 7 Epic copies in Region 2. 51, 60 and 45 of the 1,000 Players get to level 30 before they win Floor 50 (5% to 6%). No Player is stuck. About 70% of the Players get to the repeat cap on one Stage or more.
- **All cards Discovered and the Balanced Player.** At Floor 50, the Balanced Player has Discovered 96% of the cards (10th to 90th percentile: 94% to 100%), not 100%. This miss is accepted. The cause is the Legendary Combine rule: the Balanced Player keeps its Coin for the Legendary Combine, so it opens 48 Packs before Floor 50, not 115. Without the rule, it has 100% Discovered, but 0 Legendary copies and a lowest Gear level of 13. Thus this target is draft for the Balanced Player: `sim:check` shows "review" and does not fail (issue #108).
- **Forge Stones ([ADR-0036](../adr/0036-gear-upgrades-need-earn-only-forge-stones.md)).** At Floor 50, the lowest Gear level is 16 (Collector), 17 (Upgrader) and 17 (Balanced), so the "Gear mostly at level 14 or higher" row passes for all Play Styles. Before the re-tune, the Balanced Player had 13. Thus the supply of section 2.7 and the Gear Coin of section 3.4 do not change. The Gear of all Play Styles stops at level 5 in Region 2 and at level 10 in Region 4, because Regions 1 and 2 give only Common and Regions 3 and 4 only Uncommon Forge Stones. At Floor 50, the median Upgrader and Balanced Player have 2 Epic Forge Stones that they did not use (Collector: 5). Gear levels 16 to 20 need Epic Forge Stones, and they come mostly from Dungeon 3, which is not in the sim.
- **Common Forge Stones that the Player does not use.** The median Player has about 20 Common Forge Stones that it cannot use at Floor 50 (16 at the end of Region 2). Gear levels 1 to 5 need 20 Common Forge Stones for the 4 items, and the repeat wins and the Sweeps of Regions 1 and 2 give more. This is accepted: they are a small part of the Forge Stones, and a Forge Stone never changes into another tier or into Coin (ADR-0036).
- **Skill Cards of issue #57.** The 14 Common and Uncommon Skill Cards (116 cards in `cards.ts`) move no "Discovered" median of the economy sim (7.1) by more than 1 point, because the simulated Player Discovers only the Warrior Skill Cards (4 of the 14). At Heynspire Floor 50, the Player has Discovered 96% (Collector), 63% (Upgrader) and 91% (Balanced) of the cards. It was 96%, 63% and 90% (2026-10-11). The milestone does not move.
- **Ranger Skill Cards of issue #59.** Venom Arrow, Heartseeker (Rare) and Rain of Arrows (Epic) make 119 cards in `cards.ts`. The economy sim gives the same result as before (2026-10-11), because its Player Discovers only the Warrior Skill Cards. The milestone does not move. The Ranger Class Pack pool now has 10 cards (`bun run sim packs`, mean of 100 Players). A Peddler Pack never rolls an Epic card, so it cannot give Rain of Arrows. It needs 76.0 Packs to Discover the 9 Ranger cards from Common to Rare (it was 9.3 Packs for the 7 Common and Uncommon cards), because only 4.17% of its cards are Rare. A Merchant Class Pack needs 9.8 Packs for all 10 cards (it was 2.3), and a Royal Class Pack 4.0 (it was 2.0). On 2026-10-13, Hunter's Focus (Rare) replaced Heartseeker: the pool keeps 10 cards and the same Ranks, so these results do not change.
- **Priest Skill Cards of issue #61.** Unbroken Vow, Cleanse (Rare) and Aegis of Dawn (Epic) make 122 cards in `cards.ts`. The milestone does not move, for the same reason as #59: the simulated Player Discovers only the Warrior Skill Cards, and the all-cards Pack rows do not change. The Priest Class Pack pool now has 10 cards, the same as the Ranger pool, with the same results (`bun run sim packs`, 2026-10-12): 76.0 Peddler Packs for the 9 cards from Common to Rare, 9.8 Merchant Packs and 4.0 Royal Packs for all 10 cards (it was 9.3, 2.3 and 2.0).
- **Warrior Skill Cards of issue #63.** Expose Weakness, Call to Arms (Rare) and Onslaught (Epic) make 125 cards in `cards.ts`. The simulated Player Discovers the Warrior Skill Cards, so the "Discovered" medians of the economy sim (7.1, 200 seeds) go down by 1 to 2 points. At the end of Region 3, the Player has Discovered 73% (Collector), 54% (Upgrader) and 73% (Balanced) of the cards (it was 75%, 56% and 74%). At Heynspire Floor 50, it is 95%, 61% and 89% (it was 96%, 63% and 91%, 2026-10-12). The targets do not change: they wait for the re-tune in M3. In `bun run sim packs`, the all-cards Pack of a Warrior needs 1544.3 Peddler Packs for all cards from Common to Rare (it was 1408.3), 117.5 Merchant Packs (107.7) and 38.8 Royal Packs (36.3). The Warrior Class Pack pool now has 10 cards, with the same results as the Ranger and Priest pools: 76.0 Peddler Packs for the 9 cards from Common to Rare, 9.8 Merchant Packs and 4.0 Royal Packs for all 10 cards (it was 9.3, 2.3 and 2.0).
- **Mage Skill Cards of issue #65.** Spark (Common), Arc Lightning (Uncommon), Wildfire, Thunderstorm (Rare) and Blizzard (Epic) make 130 cards in `cards.ts`. The milestone does not move, for the same reason as #59: the simulated Player Discovers only the Warrior Skill Cards, and the all-cards Pack rows do not change. The Mage Class Pack pool now has 10 cards, with the same results as the other Class pools (`bun run sim packs`, 2026-10-12): 76.1 Peddler Packs for the 9 cards from Common to Rare, 9.4 Merchant Packs and 4.0 Royal Packs for all 10 cards (it was 6.1, 1.8 and 1.0 for the 5 Common and Uncommon cards).
- **Sweep ([ADR-0039](../adr/0039-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)).** With 2 Campaign Sweep Tickets for each Stage or Floor win, the Player can get 3 Stage repeat-win rewards for the time of 1 Battle. With 1 Dungeon Sweep Ticket for each Dungeon win, the Player can get 2 Dungeon repeat-win rewards for the time of 1 Battle. The First-try Path and the targets that use its levels do not change. The economy sim uses both Sweeps since issue #107 (7.1). The re-tune of issue #105 kept 2 Campaign Sweep Tickets for each win: fewer Tickets did not stop the Player from getting to level 30 before Floor 50, so a Stage repeat-win reward gives no XP now (ADR-0047). The sim never plays Dungeon 3, so the Dungeon Sweep Tickets for each win are not checked with the Dungeon 3 rewards (Essence, Epic and Legendary Forge Stones) yet.
- **Boss Floors at the Boss target ([ADR-0040](../adr/0040-heynspire-floors-come-from-templates-and-a-strength-curve.md), issue #97).** The economy sim (7.1, 200 seeds) gives each Boss Floor the base chance of a Boss Stage (40%), not of a normal Stage (70%). At Heynspire Floor 50, the median Battles are 129 (Collector), 128 (Upgrader) and 130 (Balanced), and the hours are 17.2, 17.1 and 17.3. It was 123, 123 and 125 Battles and 16.4, 16.4 and 16.7 hours (2026-10-16). 4, 4 and 9 of the 200 Players get to Player level 30 before they win Floor 50, so the sim stops before Floor 50 for them. The other values at Floor 50 move by 1 or less, but not the unspent Coin (222, 105 and 29 Copper; it was 207, 135 and 25). The mean Gear level is 15.8, 15.3 and 13.0. The Balanced row of "Gear mostly at level 14 or higher" still fails.
- **Fuse of issue #111 ([ADR-0049](../adr/0049-fuse-gives-a-card-that-is-not-discovered.md)).** The economy sim Fuses copies above 2 in place of some Extracts (7.1). `bun run sim economy 1000` on 2026-10-18: the "All cards Discovered" milestone does not move. At Floor 50, the median Player has Discovered 96% (Collector), 85% (Upgrader) and 91% (Balanced) of the cards, the same as before. The Legendary copies are 3 / 4 / 4 (it was 3 / 4 / 3), and the other medians move by 1 or less. The cause: the Upgrader and the Balanced Player Combine each pair, so they almost never have a copy above 2. The Collector has copies above 2, but at Floor 50 the cards that it has not Discovered are only Specialists (Base Rank Legendary), and a Fuse never gives a Specialist (section 3.7). Thus the Collector miss of "All cards Discovered" at Floor 50 stays (96.2%, target 100%). Fuse is not a fix for it.
- **Seaport and the play calendar of issue #114 (2026-10-18).** The economy sim sends the ship of the Seaport with the play calendar (see above, 7.1), and the Trade Route, the Long Voyage and the Grand Expedition give 1 XP for each hour, not 2 (section 2.8). `bun run sim economy 1000` on 2026-10-18. Medians, Collector / Upgrader / Balanced, without the Seaport (before) and with it:

  | Checkpoint | Hours (days) | Packs before | Packs | Discovered | Legendary | Lowest Gear |
  | --- | --- | --- | --- | --- | --- | --- |
  | Region 1 | 4.0 | 9 / 7 / 7 | 9 / 7 / 7 | 52% / 36% / 43% | 0 | 4 |
  | Region 2 | 8.7 | 21 / 15 / 15 | 22 / 15 / 15 | 79% / 57% / 69% | 0 | 5 |
  | Region 3 | 13.1 | 30 / 20 / 22 | 32 / 22 / 25 | 90% / 71% / 81% | 0 / 1 / 1 | 8 |
  | Region 4 | 17.5 | 40 / 28 / 30 | 45 / 33 / 36 | 95% / 78% / 88% | 1 / 2 / 2 | 10 |
  | Region 5 | 21.7 | 54 / 33 / 37 | 64 / 40 / 48 | 96% / 84% / 91% | 3 / 3 / 2 | 13 |
  | Floor 50 | 29.6–29.9 | 68 / 41 / 46 | 87 / 51 / 71 | 98% / 85% / 94% | 4 / 5 / 4 | 16 / 18 / 18 |

  - **The share of the Seaport.** The Seaport opens at level 8, in Region 2. At Floor 50, the median Player has Collected about 23,500 Coin, 430 XP, 960 Essence and 4 to 5 Epic Forge Stones. That is about 21% of all its Coin, 2% of its XP, 14% (Collector), 39% (Upgrader) and 25% (Balanced) of its Essence, and 29% to 33% of its Epic Forge Stones. The Upgrader Extracts few copies, so the Seaport is a large part of its small Essence income. The Seaport is a supplement: Battles, Star chests and Achievements give the rest.
  - **The Battles and the levels.** The Battles and the hours do not move by more than 1 Battle. The median Player level is 6, 11, 16, 21, 24 and 29 at the checkpoints (it was 6, 11, 16, 21, 23 and 28). The First-try run sends no ship, so the First-try Path and its level targets do not change.
  - **Level 30 before Floor 50.** With 2 XP for each hour, 129, 112 and 120 of the 1,000 Players got to level 30 before they won Floor 50 (11% to 13%, target at most 10%). With 1 XP for each hour, it is 78, 76 and 67 (7% to 8%). Without the Seaport, it was 53, 56 and 48.
  - **The other targets.** The Pack targets of Regions 1 and 2 pass: the Seaport gives only 480 Coin in Region 2. The Legendary copies at Floor 50 (4 / 5 / 4, it was 3 / 4 / 4) and the lowest Gear (16 / 18 / 18, it was 16 / 17 / 17) pass. At Floor 50, the median Player has 9 / 3 / 2 Epic Forge Stones that it did not use (it was 5 / 2 / 2). "All cards Discovered" at Floor 50 goes from 96% to 98% (Collector) and from 91% to 94% (Balanced), but the miss of the Collector (see the note of issue #111) and the review of the Balanced Player stay.
- **Seaport Cargoes (2026-10-18).** The 4 fixed Expeditions became 4 Cargoes × 4 durations (section 2.8). The sim Player takes each open Cargo in turn, on the longest open duration. `bun run sim:check` on 2026-10-18. Medians, Collector / Upgrader / Balanced:

  | Checkpoint | Packs | Discovered | Legendary | Lowest Gear |
  | --- | --- | --- | --- | --- |
  | Region 2 | 23 / 16 / 16 | 81% / 58% / 70% | 0 | 5 |
  | Floor 50 | 77 / 47 / 57 | 97% / 85% / 92% | 4 / 4 / 4 | 16 / 17 / 17 |

  - **The first try with all durations open at level 8** gave the Collector 28 Packs by the end of Region 2 (target 15 to 25): 6,624 Coin from the Seaport in Region 2, not 480. With the durations open by level, it is 1,440 Coin and 23 Packs.
  - **The share of the Seaport.** At Floor 50, the median Player has Collected about 10,150 Coin, 430 XP, 650 Essence and 1 Epic Forge Stone: 10% of all its Coin, 2% of its XP, 12% / 31% / 23% of its Essence and 9% of its Epic Forge Stones. Before, it was 21% of the Coin and 29% to 33% of the Epic Forge Stones.
  - **Level 30 before Floor 50.** 80, 84 and 87 of the 1,000 Players (8% to 9%, target at most 10%). Before, it was 78, 76 and 67.
  - **The other targets.** Each target of section 4 passes, or misses as before: the Collector miss of "All cards Discovered" at Floor 50 (97%, see the note of issue #111) and the review of the Balanced Player stay. The 5 other misses of `sim:check` are Battle rows (Floor 10 and 2 Matchups, [08 — Archetypes](./08-archetypes.md)), and the Seaport does not change them.
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

`bun run sim economy [seeds]` simulates Players from a new Profile to Player level 30 and the Floor 50 win. It does not play Battles. A play calendar turns the Battles into days, so the Players also send the ship of the Seaport (see **Time**). The logic is in `packages/rules/src/simulation/economy.ts`. `bun run sim` with no mode does not run it, but `bun run sim:check` does (see **Check**).

**Content.** The sim uses the reward and cost tables of sections 2 and 3 from the rules package. The sim plays the Stages of Regions 1 to 5 (`CAMPAIGN_REGIONS` is 5). All 5 Regions have their Stages. When a Stage does not exist, the sim uses a **planned Stage** in its place, with the last Stage of each Region as the Boss Stage. The Coin and XP of a Stage come only from its Region and its Boss flag, so a planned Stage gives the correct rewards.

**Win chance.** Each Battle is a win or a loss from a win chance:

- The base chance of a Stage is the middle of its win-rate target (GDD 13): 70% for a normal Stage, 40% for a Boss Stage, and 97.5%, 92.5% and 87.5% for Stages 1-1 to 1-3. For a Heynspire Floor, it is the middle of its target: 70% for a normal Floor and 40% for a Boss Floor ([ADR-0040](../adr/0040-heynspire-floors-come-from-templates-and-a-strength-curve.md)). For a Dungeon, it is the middle of the target of a normal Stage (70%).
- The base chance is for a Player at the Recommended level with no Gear. The Recommended level of a Heynspire Floor is the First-try Path level before it (after all Stages and the earlier Floors). The Recommended level of a Dungeon is its unlock level.
- Each Player level above the Recommended level adds **0.5 points**, and each mean Gear level adds **1.25 points**, up to a cap of **95%**. The cap does not lower a base chance above it. `sim stage --level N --gear N` measured the two bonuses one time on 2026-10-10: on Region 1 with Vanguard (600 Battles for each Stage), the mean win rate of the normal Stages 1-4 to 1-9 went from 71.8% to 74.3% at 5 levels above, and to 83.8% at Gear 10 (90.6% at Gear 20). The measurement used the old Gear scale of 0 to 10, at 2.5 points for each old level. One old level is 2 levels now ([ADR-0035](../adr/0035-gear-levels-are-rescaled-to-half-steps.md)). The Boss Stage went from 39.7% to 42.2%, 57.3% and 70.7%. The constants are in the sim. When they change, change this section too.
- **Stars.** A Stage win gives 3 Stars with the **3-Star chance**, else 2 Stars. The 3-Star chance is the middle of the 3-Star target of the Stage (GDD 13, step 7): 40% for a normal Stage, 30% for a Boss Stage, and 65% for Stages 1-1 to 1-3 (their target is 30% or more, so the middle of 30% and 100%). The sim uses it as it uses the middle of the win-rate target for the win chance. It does not take the Stars from the AI pilot ([ADR-0044](../adr/0044-pacing-targets-are-for-a-player-who-replays-for-3-stars.md)). The Player keeps the best Stars of each Stage, and the Star chests of section 2.2 (`STAR_CHESTS`) open from the best Stars of the Region.

**Player actions.**

- After a loss, the Player plays the same Stage again until a win.
- **Repeat Battles.** The Player plays the Stages of a Region in order to the Boss Stage win. Then it plays again each Stage of the Region that has fewer than 3 best Stars, in Stage order, until the Stage has 3 Stars. These are its **repeat Battles**. Then it goes to the next Region. A guard, the **repeat cap**, allows **10 repeat Battles** for each Stage (`MAX_REPEAT_BATTLES`). A Player at the repeat cap goes to the next Stage, and the report shows how many Players got to the repeat cap. Floors have no repeat Battles, because a won Floor cannot be played again (section 2.3).
- **Repeat-win rewards.** A Repeat win of a Stage gives the rules of section 2.1: ⅓ of the Coin of a win, no XP, a 10% chance of 1 Forge Stone of the tier of the Region, and a 20% chance of 1 card from the Stage card pool (`stageCardPool`), in its Base Rank. A Repeat win of a Dungeon gives the rules of section 2.4, with a card from the Dungeon card pool (`dungeonCardPool`). The card can Discover a card. The card roll comes first and then the Forge Stone rolls, as in the game (`repeatWinCard`). A loss in a repeat Battle gives the same loss reward as a first-try loss.
- **Campaign Sweeps.** A Stage win (first or repeat) and a Floor win give 2 Campaign Sweep Tickets. After each Battle, the Player uses all its Campaign Sweep Tickets at once on the 3-Star Stage that gives the most Coin for a repeat win. On a tie, it takes a Boss Stage first, then the highest Region. Each Ticket gives one repeat-win reward of that Stage. A Sweep gives no Tickets and changes no Stars. When no Stage has 3 Stars, the Player keeps its Tickets.
- **Dungeon Sweeps.** A Dungeon win gives 1 Dungeon Sweep Ticket. After each Dungeon win, the Player uses all its Dungeon Sweep Tickets on that Dungeon. Each Ticket gives one repeat-win reward of the Dungeon: the Coin, the XP, the Forge Stone chance and the card chance.
- **Seaport.** All Play Styles use the Seaport (section 2.8), because it costs nothing. The Player has one ship and follows the rules of the game (`activeExpedition`, `startExpedition`). At the end of each session of the play calendar, when the ship is at the berth, the Player Dispatches it (`nextExpedition`): the median Player needs all the resources, so it takes each open Cargo in turn (Coin, XP, Essence, Forge Stones), on the longest duration that its level opens. With the bonus of a long voyage, that duration gives the most for each day of the calendar (`expeditionPerDay`): 360 Coin for each day at 6 hours, 756 at 12 hours, 1,584 at 24 hours and 1,656 at 48 hours (3,312 Coin each 2 days). At the start of the next session, the Player Collects the Expedition when the ship is back. A ship that is not back sails on, so a 48-hour voyage takes 2 days and the Forge Stone Cargo always gives its Epic Forge Stone. The reward stops at the duration, so a late Collect loses nothing. The reward comes from `expeditionReward`, and its XP stops at level 30, as the XP of a Battle. The Player spends the Seaport income at once, and claims the Achievements.
- **The First-try run sends no ship**, as it uses no Sweep. Thus the First-try Path of section 1.2 and the Expected Gear (ADR-0033) come only from Battles.
- After the last Stage, the Player climbs Heynspire. When a Floor fails 3 times in a row, the Player does Dungeon wins until the next Player level, and then tries the Floor again. At level 30 there is no next level, so this Dungeon detour ends after 3 Dungeon Battles. A Floor loss gives 10% of the Coin and 25% of the XP of its first win (GDD 7.1). After Floor 50, the Player does Dungeon wins until level 30. The Player plays the highest Dungeon that gives XP and that its level unlocks.
- The Player uses each action only from its unlock level (GDD 7.1): Packs at level 2, Combine and Extract at level 3, Gear at level 5, and Craft and Fuse at level 6.
- The simulated Player is a **Warrior** and starts with the Warrior Starter Deck cards. The Player buys only Packs with all cards. For the Race Pack from a 20-Star chest, the Player selects the Race with the fewest Discovered cards. "All cards Discovered" means all Creature Cards and the Warrior Skill Cards.
- A Player stops when it is at Player level 30 and won Floor 50, or after 2,000 Battles. A Player at the Battle cap is "stuck", and the report shows it. A Player at level 30 before the Floor 50 win goes on to the Floor 50 win (section 4 has a target for this share).

**Play Styles.** Each simulated Player has one Play Style. All Play Styles first open the free Peddler Pack and buy the 4th Deck slot.

| Play Style | Priority |
| --- | --- |
| **Collector** | Merchant Pack (Royal Pack after Region 2), then Combine only to Epic or higher, then Gear |
| **Upgrader** | The Legendary Combine, then Combine each pair, then Gear up to the Player level × 2 ÷ 3, then Peddler Packs with the Coin that stays |
| **Balanced** | The Legendary Combine, then one Merchant Pack, then two Gear levels, and again. Then Combine each pair that it can pay for |

- Until the Player has the 4th Deck slot, it keeps its Coin for the slot.
- The Player buys Open ×10 when it can pay for 10 Packs. Else it buys one Pack.
- **Legendary Combine first.** The Upgrader and the Balanced Player first Combine each Epic pair to a Legendary copy (3,200 Coin, section 3.2) that they can pay for. While they have an Epic pair, they keep their Coin for that Combine and buy no Packs. Their other priorities do not change. The Collector does not use this rule: it Combines to Epic or higher after its Packs (section 4).
- A Gear upgrade goes to the item with the lowest level. It needs the Coin and the Forge Stone. When the Forge Stone is missing, the Play Style goes to its next priority.
- Combine, Extract, Craft and Fuse use the same rules actions as the game (GDD 7.4). The sim adds only the Play Style choices.
- Combine starts at the lowest Rank.
- **Fuse.** All Play Styles first Fuse the copies above 2 of a card in the same Rank (section 3.7). The Player takes the copies of one Rank and one card type, from the lowest Rank, when the Essence is enough. A copy goes in only when its Race or Class has a card that is not Discovered, so each input copy has a share. The Player Fuses again while it can. The Fuse uses the reward random state, as in the game. The copies above 2 are in no Deck of the sim.
- Then all Play Styles Extract each copy above 2 that stays. From level 6, the Extract keeps the copies above 2 that can go into a Fuse, up to 1 fewer than a Fuse of their Rank uses, for each Rank and card type. The next such copy then makes a Fuse. The copies come one by one, so without this rule the Extract takes each copy before a Fuse can use it.
- When the Essence is enough, they Craft one copy of the cheapest Discovered card with Base Rank Rare that has 1 copy in its Base Rank. The copy makes a Combine pair toward an Epic copy. A card with Base Rank Epic or Legendary has no Craft (section 3.3). Craft never Discovers a card, because the player can Craft only Discovered cards (section 3.3). Fuse is the only Workshop action that Discovers a card.
- **Achievements.** After each Battle and the spending, the Player records the Profile goals and the Tally goals that it meets (`recordAchievements`), and claims each Completed Achievement at once ([15 — Achievements, 1.2](./15-achievements.md)). The Player gets the Coin and the Essence of the Achievement. Only 2 Achievements give Coin or Essence. All Star chests gives 500 Coin when the 15 Star chests are open. The first Craft gives 50 Essence. A run with 1,000 seeds on 2026-10-16 showed that this Essence changes only the unspent Coin of the Collector at Floor 50 and at level 30, by less than 2%.

**Not in the sim.**

- The sim plays no Battle, so it completes no Feat. No Feat gives Coin or Essence now. The sim does not report the Heynstones of the Achievements, because the Heynstone ledger is a sum (see **Report**).
- The Player never plays Dungeon 3, because it plays only the Dungeons that give XP. A Player at level 30 before the Floor 50 win plays Dungeon 2 in its detours. Thus the Epic and Legendary Forge Stones of Dungeon 3 are not in the sim. The Forge Stone results are a floor.
- The Dungeons give no first-win card in the sim. Only Dungeons 1 and 2 have one now (`DUNGEONS`), and the sim does not use it yet.

**Time.** One Battle is **8 minutes**, with the time in menus. A Sweep counts as 0 Battles and 0 minutes. The report shows Battles and hours. If the hour targets of section 4 do not agree with each other, change a target, not this value.

**Play calendar.** The median Player plays **1 hour each day** (`PLAY_MINUTES_PER_DAY` is 60), and is away **24 hours** between two sessions (`HOURS_AWAY`). A session ends after the Battle that gets the play time to the next full hour, so a session has 7 or 8 Battles, and the hours of the report are also the days of the calendar. A Battle is never cut in two. The time of the calendar is the play time and the time away, from the first Battle: the Seaport uses it as `now`. Section 4 gives the reason for this calendar.

**Report.** The sim runs 200 seeds for each Play Style. "End of Region N" is the point when the Player leaves Region N, after its repeat Battles. At each checkpoint of section 4, it shows the median and the 10th to 90th percentile of: Battles, hours, Player level, Packs opened, % Discovered, Epic and Legendary copies, mean Gear level, the lowest Gear level and unspent Coin. It also shows the share of the Players with a Combine done. For an "about" target, the sim uses ± 25%. "Gear mostly at level 14 or higher" is the lowest Gear level. It shows each target next to the values, but not the Player level targets (see the First-try run) and not a target that does not apply to the Play Style. A second table shows the median and the 10th to 90th percentile of the Forge Stones of each tier that the Players did not use. A third table shows the same values of the best Stars, the 3-Star Stages, the repeat Battles, the Stages at the repeat cap, and the Campaign and Dungeon Sweep Tickets that the Players used and did not use. A fourth table shows the Seaport income: the median and the 10th to 90th percentile of the Coin, the XP, the Essence and the Epic Forge Stones that the Players Collected, and the median share of the income of that kind from all sources. The income from all sources counts each reward of a Battle, a Sweep, a Star chest, an Achievement, an Extract and the Seaport, with the XP up to level 30. The spending does not lower it. Then the report gives the number of stuck Players, of Players at level 30 before the Floor 50 win (with its target), and of Players at the repeat cap. It also shows one **First-try** run of each Play Style: it wins each Battle with 2 Stars, and it has no repeat Battles and no Sweeps. This is the floor of Battles and the First-try Path of section 1.2, and the Expected Gear (ADR-0033) comes from it. The report judges the Player level targets of section 4 on this run. Then it shows the **Heynstone ledger**: each one-time source of section 2.6, the total, and the total as a % of the Bazaar catalog cost. The Heynstone sources are all fixed, so the ledger is a sum, not a simulation.

**Check.** `bun run sim:check` (`simulate --check` with no mode) also runs the economy sim, with the same number of seeds as the win-rate check (1,000). `bun run sim` with no mode and no `--check` does not run it. For each Play Style, the check judges each target of section 4 that applies to the Play Style, with the gated and review rules of the win-rate targets (GDD 13):

- It judges the **median** of the Players. The Player level targets use the level of the First-try run. "First Combine done" uses the share of the Players with a Combine done (100%). "At most 10% of the Players get to level 30 before they win Floor 50" uses the share of all Players. The check does not judge percentiles.
- A miss of a gated target fails the check. The check gives one line for each miss: the checkpoint, the target, the Play Style, the value and the target. The report shows "MISS" after the target.
- A miss of a draft target shows "review" after the target and does not fail the check. Section 4 gives the draft targets.
- A target that does not apply to a Play Style (`notFor`) is not judged.
- During playtests, the game writes a local log of rewards and spending. The player can export the log and send it to the developer. The game never sends data automatically in v1.
