# 14 — Campaign Stages

This document gives the design of each Stage of the Campaign: its place, its enemy, the new thing that it teaches, its enemy Deck and its first-win card. The rules for all Stages are in [GDD 8.1](./03-game-design.md#81-campaign). The data is in `packages/rules/src/content/stages.ts`. The Stage names and the enemy names are in the Message Catalogs (`apps/web/src/core/libs/i18n/locales/`). The landmark of each Stage is on its Region Map ([12 — Region Concepts](./12-region-concepts.md)).

Now only Regions 1 to 3 have Stages. All names are draft names (README, "Status of names").

## 1. Rules for the Stages

- **One new thing for each Stage.** Each Stage after the Tutorial teaches one new thing. Stage 9 tests all of them, and the Boss Stage tests them with the Boss rule.
- **The place is the landmark.** The name of a Stage is a place on the Trail. The Region Map shows that place as the landmark next to the Stage Marker. The Battle does not show the landmark: all Stages of a Region use the one Battle Painting of the Region ([13 — Battlefield Concepts](./13-battlefield-concepts.md)).
- **Only the current tools.** A Stage uses only the cards that exist and the fields of the Stage data: enemy Class, Hero HP, Gear, Deck, Closed Lanes and Start Units. A new rule type needs its own design.
- **The Boss is the largest.** The Boss Stage has the largest enemy Hero HP and the largest Deck of its Region (GDD 8.1).
- **The Boss is of a Debut Race.** The Boss is of a Debut Race of its Region (GDD 3.3, [ADR-0036](../adr/0036-the-campaign-has-5-regions-and-each-region-adds-one-race.md)).
- **First-win card.** Each Stage gives one fixed card on its first win: a card of the enemy Deck of that Stage, in its Base Rank. The cards are mixed, so that they help each Starter Deck. The data is the `firstWinCard` field of each Stage. The rules Profile action `applyStageResult` gives it, and it also gives the repeat-win card from the Stage card pool (Economy 2.1).
- **Deck size of a new Player.** An enemy Deck has the same size as the expected Deck of a new Player at the Recommended level (see 1.1), or 1 card less. The Boss Deck is the exception: it is larger than all other Decks of its Region. The enemy gets stronger with Rank, Gear and Start Units, not with more cards. A side that has more cards keeps summoning after the other side has no cards, and that decides the Battle more than Hero HP.
- **Win-rate target.** The target is for a new player Deck on the first try (GDD 13): Stage 1-1 ≥ 95%, 1-2 ≥ 85%, 1-3 ≥ 75%, other Stages 60% to 80%, Boss Stages 30% to 50%. Each Stage must hit its target two times, both at the Recommended level: with no Gear, and with the **Expected Gear** (see 1.1 and [ADR-0034](../adr/0034-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
- **Tuned for the Starter Decks.** Each copy in a Starter Deck has the Rank Common or Uncommon ([GDD 6.1](./03-game-design.md#61-starter-decks)). Thus a new player has no Epic card in Region 1, and the first win of the Boss Stage gives the first Epic. The Starter Deck guides are also in GDD 6.1: 10 cards, each copy at its Base Rank, Common Creature Cards in pairs or triples, and at least 1 Skill Card of the Class.
- **Skill Cards of each Region.** The Region 1 enemy Decks keep the Warrior and Mage Skill Cards that they have. The enemy Decks of Regions 2 to 5 can use all 40 Skill Cards, of all 4 Classes. Then a Ranger or Priest Player can also get a Skill Card from a Stage card pool ([Archetypes 2.3](./08-archetypes.md#23-skill-cards-and-the-gate)).
- **Tune the enemy strength first.** To change the difficulty of a Stage, first change Hero HP, Gear, the Ranks of the enemy cards and Start Units. Change an enemy Deck card or a first-win card only when the Stage cannot reach its target in another way, because these cards are the identity of the Stage.

### 1.1 Recommended level

Each Stage has a **Recommended level**: the Player level that the **First-try Path** gives before the Stage ([Economy 1.2](./07-economy.md#12-player-levels)). The First-try Path is the first win of each earlier Stage, in Stage order, with no losses and no repeats. The Player sees the Recommended level. It is the `recommendedLevel` field of each Stage in `stages.ts`.

The simulation (`bun run sim stage` in `packages/rules`) plays each Stage with the **expected Deck** of each Starter Deck, at the Recommended level of the Stage, with no Gear. Then it plays each Stage that has Expected Gear a second time, at that Gear.

The **Expected Gear** of a Stage is the highest Gear that a Player on the First-try Path has before the Stage, over all Play Styles ([ADR-0034](../adr/0034-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)). The sim calculates it from the First-try run of each Play Style of the economy simulation ([Economy 7.1](./07-economy.md#71-economy-simulation)). It reads the level of each Gear slot before the first Battle of the Stage, and it takes the Play Style with the highest mean level. If two Play Styles have the same mean, it takes the first one in the order Collector, Upgrader, Balanced. Thus nobody writes the Expected Gear by hand, and it does not go out of date. Gear unlocks at player level 5 (GDD 7.1), so the Expected Gear is 0 / 0 / 0 / 0 for Stages 1-1 to 1-8. Before Stage 1-9 it is 3 / 2 / 2 / 2, and before Stage 1-10 it is 3 / 3 / 3 / 3. A Player who loses gets Gear sooner. That is a catch-up, not a miss.

With `--check`, the sim fails when a row with no Gear or a row with Expected Gear is not on its target. `--level N` plays N levels above the Recommended level, and `--gear N` sets all 4 Gear items to level N, with the same Deck. They measure the win-chance bonuses of the economy simulation, so with these flags the sim plays no Expected Gear rows.

The expected Deck is the Starter Deck (10 cards), then the first-win cards of the earlier Stages, in Stage order, up to the maximum Deck size at the Recommended level (GDD 6). It skips a fourth copy of a card, a Skill Card of another Class and a card that puts the Deck over the Countdown Limit of the Recommended level ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md)). For example, at Stage 1-5 (level 3, maximum 12 cards) the expected Vanguard Deck is the Starter Deck, Militia Recruit and Scrap Raider. The expected Raiders Deck already has 3 Scrap Raiders and 3 Ember Shamans, so it skips the first-win cards of Stages 1-2 and 1-3, and it gets Militia Recruit and Shieldbearer.

A content test checks that each Recommended level is the level of the First-try Path. A Player who loses or plays again has more XP, so the Recommended level is a floor. When the XP table, a first-win XP reward (Economy 2.1) or the Stage order changes, update the `recommendedLevel` values in `stages.ts`. Then run `bun run sim stage` again.

## 2. Region 1: Hearthvale

The band of **Baron Brassbelly**: Human outlaws and the Orc sellswords that he pays (GDD 3.3). They hold the roads of the valley, from the ford near the Town to the Baron's hall on the hill.

### 2.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 1-1 | The Muddy Ford | Bandit Scout (Warrior) | A shallow, muddy river ford with stepping stones | **The Tutorial** (GDD 8.3). A small, weak Deck. |
| 1-2 | Two Bridges | Bandit Twins (Warrior) | Two small wooden bridges side by side over a stream | **Fast enemies:** Swift Units, Charge and a Ranged Unit. |
| 1-3 | The Burning Mill | Hedge Witch (Mage) | A water mill with a burning roof | **Enemy spells:** the first Mage spells that hit Units, and Flying. |
| 1-4 | The Toll Gate | Toll Sergeant (Warrior) | A wooden toll gate across the road | **Walls:** Bulwark, Pivot and Retaliate. The Player learns to attack in another Lane, or to use Fire and Frost. |
| 1-5 | The Outlaw Camp | Camp Cook (Warrior) | Tents, a campfire and a very big pot | **Start Units:** 3 outlaw Units are on the Board at the start. A Shieldbearer holds the middle Lane. This prepares the Player for the Boss bodyguard. |
| 1-6 | The Old Watchtower | Watchtower Hexer (Mage) | A ruined stone watchtower | **Ranged enemies:** Ember Shamans behind a front line of Halberdiers and Shieldbearers, with Mage spells. |
| 1-7 | The Sellsword Camp | Sellsword Captain (Warrior) | An Orc camp with war drums | **Rush:** Charge, Flying and Swift Units. A race to the enemy Hero. |
| 1-8 | The Rockfall Pass | Pass Warden (Warrior) | A narrow rocky pass with fallen rocks | **The first Closed Lane:** Lane 1 is closed until Turn 5, while the outlaws clear the rocks. |
| 1-9 | The Great Oak | The Baron's Lookout (Mage) | A very large oak with a lookout platform | **The final test:** walls, ranged Units, Flying and spells together. |
| 1-10 | Brassbelly Hall | Baron Brassbelly (Warrior) — **Boss** | A fortified hall on a hill, with a roof in the shape of a very large hat | **The Boss rule:** the Baron's bodyguard, an Epic Shieldbearer, is a Start Unit in the center Lane. |

### 2.2 Numbers

Lane numbers are from the top, 1 to 3. A Start Unit position is its Column for the Player (1 is next to the Player's Hero). Gear is weapon / armor / trinket / banner, with levels 0 to 25 ([ADR-0037](../adr/0037-gear-has-20-levels-with-the-power-of-the-old-10.md), [ADR-0039](../adr/0039-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)). The Stages use levels 0 to 20 only. The notes from before 2026-10-15 give Gear levels on the old scale of 0 to 10: an old level is 2 levels now.

The Gear column is the enemy Gear. The Expected Gear column is the Gear of the Player (see 1.1). A Stage with Expected Gear 0 / 0 / 0 / 0 has no second row, so its win rate at Expected Gear is "—".

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1-1 | 6 | 0 / 0 / 0 / 0 | 10 | — | — | Militia Recruit (Common) | 1 | 100% / 100% | 0 / 0 / 0 / 0 | — |
| 1-2 | 32 | 4 / 0 / 0 / 4 | 9 | — | — | Scrap Raider (Common) | 1 | 90% / 89% | 0 / 0 / 0 / 0 | — |
| 1-3 | 38 | 6 / 0 / 6 / 6 | 10 | — | — | Ember Shaman (Common) | 2 | 88% / 90% | 0 / 0 / 0 / 0 | — |
| 1-4 | 38 | 0 / 0 / 0 / 0 | 10 | — | — | Shieldbearer (Common) | 2 | 66% / 72% | 0 / 0 / 0 / 0 | — |
| 1-5 | 42 | 6 / 0 / 6 / 6 | 11 | — | Militia Recruit (Common), Lane 1, Column 10 · Shieldbearer (Common), Lane 2, Column 10 · Crossbow Guard (Common), Lane 3, Column 11 | Crossbow Guard (Common) | 3 | 70% / 73% | 0 / 0 / 0 / 0 | — |
| 1-6 | 42 | 2 / 0 / 2 / 2 | 11 | — | — | Dawn Cleric (Uncommon) | 3 | 62% / 64% | 0 / 0 / 0 / 0 | — |
| 1-7 | 32 | 2 / 0 / 2 / 2 | 12 | — | — | Howling Charger (Uncommon) | 4 | 75% / 64% | 0 / 0 / 0 / 0 | — |
| 1-8 | 40 | 2 / 0 / 2 / 2 | 12 | Lane 1, opens on Turn 5 | Militia Recruit (Common), Lane 2, Column 11 | Gate Warden (Uncommon) | 4 | 71% / 65% | 0 / 0 / 0 / 0 | — |
| 1-9 | 36 | 0 / 0 / 0 / 0 | 13 | — | — | River Knight (Uncommon) | 5 | 64% / 71% | 3 / 3 / 2 / 2 | 69% / 76% |
| 1-10 | 44 | 2 / 0 / 0 / 2 | 14 | — | Shieldbearer (Epic), Lane 2, Column 11 | Iron Bulwark (Epic) | 5 | 36% / 39% | 3 / 3 / 3 / 2 | 37% / 46% |

All win rates come from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-14, after the re-tune of Stages 1-5, 1-7 and 1-8 (issue #79). All rows are on their target, with no Gear and with the Expected Gear, so the CI balance gate passes. On 2026-10-15, the Gear got 20 levels ([ADR-0037](../adr/0037-gear-has-20-levels-with-the-power-of-the-old-10.md)). The enemy Gear doubled, so the enemy stats did not change. The Expected Gear and its win rates come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. The rows with no Gear did not change. On 2026-10-15, a Gear upgrade started to need a Forge Stone ([ADR-0038](../adr/0038-gear-upgrades-need-earn-only-forge-stones.md)). The Expected Gear of 1-9 and 1-10 and its win rates come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. Before, the win rates came from the re-tune of Stage 1-10 for the Expected Gear (issue #78, [ADR-0034](../adr/0034-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)), from `bun scripts/simulate.ts 1000 --check` on 2026-10-14, after the balance pass of [ADR-0030](../adr/0030-keywords-set-speed-and-range-and-there-are-no-roles.md), and from `bun run sim stage 1000` on 2026-10-11, after the re-tune of the Skill Cards (issue #56, [08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). Some rows with no change to their Stage are different from the earlier table, for example Raiders on 1-4 (72%, it was 67%).

On 2026-10-14, Stages 1-5, 1-7 and 1-8 got a re-tune for Raiders with no Gear (issue #79). Before, Vanguard and Raiders won 68% / 59% of 1-5, 73% / 57% of 1-7 and 67% / 49% of 1-8 (1000 Battles). The target is 60% to 80%. These Stages have no Expected Gear, so only the row with no Gear applies. The first-win cards, the Start Units of 1-5, the rush of 1-7 and the Closed Lane of 1-8 do not change. No enemy Deck card changes, and the Deck sizes do not change. Stage 1-10 keeps the largest enemy Hero HP of Region 1 (44). These Stages changed:

- **1-5:** Spear Throw is Common (it was Uncommon), its Base Rank. Now Vanguard and Raiders win 70% / 73%. Over 2000 Battles, they win 69% / 72%.
- **1-7:** Hero HP 32 (it was 34). Both Scrap Raiders are Common (they were Uncommon), and the Pack Stalker is Rare (it was Uncommon). Now Vanguard and Raiders win 75% / 64%. Over 2000 Battles, they win 76% / 63%.
- **1-8:** 1 Halberdier, the Scrap Raider and the Tusk Brute are Common (they were Uncommon). The Militia Recruit Start Unit is in Column 11 (it was in Column 12). Now Vanguard and Raiders win 71% / 65%. Over 2000 Battles, they win 71% / 65%.

On 1-7 and 1-8, Raiders had to go up by more points than Vanguard. Most changes of Hero HP, Gear and Rank moved both Decks up together, or moved Vanguard above 80%. On 1-7, the Pack Stalker at a higher Rank lowers Raiders more than Vanguard (70% / 50% alone). Thus the Rare Pack Stalker takes back some of the Vanguard gain. On 1-8, the Militia Recruit Start Unit one Column nearer to the Player hits Vanguard the most (54.5% / 51% alone). Thus it takes back the Vanguard gain of the Common copies. The other tests (1000 Battles, Vanguard and Raiders, with no Gear):

- **1-5:** Hero HP 38: 69% / 61%. Enemy Gear 1 / 0 / 1 / 1: 71% / 63%. The Badland Runt at Common: 74.5% / 60.5%. The Crossbow Guard Start Unit in Column 12: 64% / 62%. These put Raiders near the bottom of the target.
- **1-7:** Hero HP 32 only: 75% / 60%. Both Scrap Raiders Common only: 76% / 63%. Spear Throw Common: 78% / 63%. Hero HP 32 and both Scrap Raiders Common: 77% / 65%, but over 2000 Battles Vanguard won 78.5%. The same change and an Uncommon Halberdier: 74% / 61%.
- **1-8:** Hero HP 32: 69% / 53%. No Gear: 69% / 50%. The Crossbow Guard at Common: 82.5% / 60%, and with the Start Unit in Column 11: 76.5% / 64%. The Halberdier, the Scrap Raider and the Tusk Brute at Common, with the Start Unit in Column 12: 78% / 66%. No Start Unit: 72.6% / 61.5%.

On 2026-10-14, each Stage got a second win-rate check, at the Expected Gear (issue #78, [ADR-0034](../adr/0034-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)). Only Stages 1-9 and 1-10 of Region 1 have Expected Gear. Before this pass, Vanguard and Raiders won 64% / 71% of 1-9 and 40% / 53% of 1-10 with no Gear, and 68% / 75% and 43% / 59% with the Expected Gear (1000 Battles). The old 1-10 row of the table (35% / 36%) was wrong: the sim did not give these values when the row was written. Stage 1-9 is on its target in all four rows, so it did not change. Stage 1-10 changed:

- **1-10:** both Crossbow Guards are Common (one was Uncommon), and both Halberdiers are Rare (they were Uncommon). Now Vanguard and Raiders win 36% / 39% with no Gear and 38% / 46% with the Expected Gear. Over 2000 Battles, they win 35% / 39% and 37% / 44%. Hero HP stays 44, so the Boss still has the largest Hero HP of Region 1. The Epic Shieldbearer bodyguard, the Iron Bulwark first-win card and all enemy Deck cards stay.

Raiders had to go down by more points than Vanguard. But most single changes of Rank, Start Units, Hero HP and Gear lowered Vanguard by more points than Raiders, or by about the same number. Only Uncommon Shieldbearers lowered Raiders a little more (4 points, and Vanguard 3 points). The Raiders Starter Deck has no Skyreavers now, so a Crossbow Guard at a higher Rank does not hit Raiders more. The Crossbow Guards hit Vanguard the most: with both Uncommon, Vanguard won 24% and Raiders 46%. With both Common, Vanguard won 57% and Raiders 63%. Thus Common Crossbow Guards close most of the gap, and the Rare Halberdiers then lower both Decks. The other tests (1000 Battles, Vanguard and Raiders, with no Gear and then with the Expected Gear):

- Both Crossbow Guards Common and 1 Halberdier Rare: 45% / 52%, then 48% / 55%. Raiders was above the target.
- The same change and Uncommon Shieldbearers: 44% / 47%, then 46% / 50%. Over 2000 Battles, Raiders won 50.8% with the Expected Gear.
- Both Crossbow Guards Common, both Halberdiers Rare and Uncommon Shieldbearers: 32% / 36%, then 36% / 42%. Vanguard was near the bottom of the target.
- Hero HP 47 only: 39% / 52%, then 41% / 57%. Enemy Gear 2 / 0 / 0 / 1 only: 40% / 52%, then 42% / 58%.
- A Common Crossbow Guard Start Unit in Lane 3: 24% / 41%, then 29% / 46%.

On 2026-10-14, each Unit got Base Speed 2, and the Keywords Swift, Fleet, Heavy, Mid-range, Long-range and Extreme-range replaced the Roles ([ADR-0030](../adr/0030-keywords-set-speed-and-range-and-there-are-no-roles.md)). The cards got new HP (see [08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). Mild Stage changes made Stages 1-7 and 1-8 easier:

- **1-7:** Gear 1 / 0 / 1 / 1 (it was 3 / 0 / 2 / 3). All Rare copies are Uncommon: the Pack Stalker, 1 Howling Charger, 1 Skyreaver and the Tusk Brute.
- **1-8:** Gear 1 / 0 / 1 / 1 (it was 3 / 0 / 3 / 3). The Shieldbearer, the Scrap Raider and the Tusk Brute are Uncommon (they were Rare).

Raiders still won less than the target in 1-5, 1-7 and 1-8. A stronger change to these Stages was not part of this pass (see issue #79 above).

Stage 1-1 has Hero HP 6. Knockback on the enemy Shieldbearers put the Tutorial under 95%. More Militia Recruits were not a legal replacement then: the Deck had 3 copies, and that swap won less often in the Tutorial. Now the Deck has 2 (see the change of 2026-10-08 below). Hero HP 6 puts the Tutorial back on the target. The Shieldbearers stay, so the Player still meets Knockback.

The Starter Decks lost their Epic cards (Iron Bulwark and Warchief Grukka) on 2026-10-06. Without them, Vanguard won only 23% of Stage 1-4, and most Stages were under their target. The enemy strength went down:

- **1-3:** the Ember Shaman and the Shieldbearer are Common (they were Uncommon).
- **1-4:** no Gear (it was 3 / 0 / 2 / 3). The Shieldbearers (Uncommon) are Common. 1 Halberdier stays Uncommon: with 2 Common Halberdiers, both Decks won 80% or more (81% / 80%). The Gate Wardens (Rare and Epic) are Uncommon. The Crossbow Guards stay Uncommon: they hit the Flying Skyreavers, so Raiders does not win much more often than Vanguard.
- **1-6:** 1 Crossbow Guard and both Ember Shamans are Common (they were Uncommon).
- **1-7:** Spear Throw is Rare (it was Uncommon). This makes the Stage harder for Raiders, which won 82%.
- **1-8:** the Halberdiers are Common (one was Rare). A Halberdier at a higher Rank hits Vanguard the most, so this helps Vanguard more than Raiders.
- **1-9:** Hero HP 34 (it was 38) and no Gear (it was 3 / 0 / 3 / 3). Each copy in this Deck is at its Base Rank, so only Hero HP and Gear can change.
- **1-10:** the Halberdiers are Common (one was Uncommon), and a third Militia Recruit (Common) replaces the River Knight (Uncommon). This is the only change to an enemy Deck card. Without it, the Boss stayed under its target. With each card at its Base Rank and no Gear, the Boss won 26% / 28%. Hero HP 43 (the lowest value above Stages 1-5 and 1-6) gave 27% / 29%. A Rare bodyguard gave 31% / 31%, at the edge of the target. But the Boss rule needs an Epic bodyguard, so the bodyguard stays Epic. The Epic Shieldbearer and Iron Bulwark stay, so the Boss rule and the first-win card do not change.

On 2026-10-07, the Power Points started to measure Attack and HP at the Base Rank ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)). The Common Attack and HP of the Uncommon, Rare and Epic Creature Cards went down ([08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). This changed both the Starter Decks and the enemy Decks. Stages 1-7 to 1-10 became too easy. Raiders won 82% to 86% of Stages 1-7 to 1-9, and 77% of the Boss Stage. Vanguard won only 55% of Stage 1-4. These enemy Decks changed:

- **1-4:** both Halberdiers are Common (one was Uncommon), and 1 Crossbow Guard is Rare (both were Uncommon). Hero HP stays 38. A Gate Warden hits Vanguard the most. A Crossbow Guard hits the Flying Skyreavers of Raiders. In each test, Raiders won about 18 percentage points more than Vanguard. Thus the Stage is near both edges of its target (62% and 80%).
- **1-7:** 1 Howling Charger, 1 Skyreaver and the Tusk Brute are Rare (they were Uncommon). With all of them Rare, both Decks won under 70%.
- **1-8:** 1 Crossbow Guard is Rare (both were Uncommon). Hero HP 44 alone left Raiders at 81.5%.
- **1-9:** Hero HP 36 (it was 34). 1 Crossbow Guard is Uncommon (both were Common), and a Halberdier (Common) replaces the Gate Warden (Uncommon). With both Crossbow Guards Uncommon and the Gate Warden, Vanguard won only 50%.
- **1-10:** the Gate Warden is Rare (it was Uncommon), and the Crossbow Guards and Halberdiers are Uncommon (they were Common). The Epic Iron Bulwark is weaker than before, so the Boss Deck needs the higher Ranks. The bodyguard and the first-win card do not change.

On 2026-10-08, the rules package got the 3 Ticking Cards (removed later the same day, see below), the Countdown Limit and the Power Budget `12 + 3 × Countdown` ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md), issue #21). Most Common Human cards got more Attack and HP. The Starter Decks changed to fit the Countdown Limit of level 1 (25) ([GDD 6.1](./03-game-design.md#61-starter-decks)):

- **Vanguard** (it was 27): 1 River Knight (U, Countdown 4) became a third Crossbow Guard (C, Countdown 2). Countdown 25.
- **Raiders** (it was 30): the 2 Tusk Brutes (Countdown 4) and the 2 Skyreavers (Countdown 3) became a third Scrap Raider, a third Ember Shaman and 2 Badland Runts. Countdown 23. Of the Raiders Decks that fit the limit, this one had the best Stage results. It wins 51.6% against the new Vanguard Starter Deck at level 1 (500 seeds).

With these Decks, most Stages were too hard, and Raiders won much less than Vanguard: Vanguard 25% to 96%, Raiders 12% to 86% (Stages 1-2 to 1-10, 500 seeds). In Stages 1-5 and 1-6, Raiders won 12% and 27%. Crossbow Guards hurt Raiders the most: Raiders now has no Tusk Brute in front. Changes of Rank, Hero HP and Gear moved both Decks together, so they did not close the gap. Thus some enemy Deck cards changed too. These enemy Decks changed:

- **1-2:** the Crossbow Guard is Uncommon (it was Rare).
- **1-4:** the Rare Crossbow Guard is Uncommon.
- **1-5:** the Scrap Raider is Common (it was Rare), and Spear Throw is Uncommon (it was Rare). 1 Crossbow Guard and the Tusk Brute became 2 Shieldbearers (C). The Shieldbearer Start Unit is Common (it was Uncommon). With 2 Crossbow Guards in the Deck, the best test gave Vanguard 64% and Raiders 54%.
- **1-6:** the 2 Crossbow Guards became 2 Halberdiers (C), and the Gear is 1 / 0 / 1 / 1 (it was 3 / 0 / 3 / 3). With 1 Crossbow Guard, Raiders won about 20 percentage points less than Vanguard in each test, and at most 57%. The Ember Shamans stay the ranged enemies. Hero HP 46 also worked, but the Boss must have the largest Hero HP.
- **1-7:** the 2 Badland Runts (C and U) became a Halberdier (C) and an Ember Shaman (C). Vanguard won 94% to 96% of this Orc rush with each Rank, Hero HP and Gear change. A Halberdier and an Ember Shaman hit Vanguard more.
- **1-8:** the Rare Crossbow Guard became a Halberdier (C), 1 Halberdier is Uncommon and the Tusk Brute is Rare. The Gate Warden stays Uncommon, because it is the first-win card.
- **1-10:** 1 Crossbow Guard is Common (both were Uncommon). Before, Vanguard and Raiders won only 26% and 29%.

On 2026-10-08, Speed 1 became the default, and the Role set more Speed ([ADR-0024](../adr/0024-speed-1-is-the-default.md)). On 2026-10-14, [ADR-0030](../adr/0030-keywords-set-speed-and-range-and-there-are-no-roles.md) replaced this rule: each Unit has Base Speed 2, and there are no Roles. The numbers in this paragraph are from before that change. Militia Recruit became 3/8 with Speed 1 (it was 3/6 with Speed 2). The Starter Decks and many enemy Decks have Militia Recruits. After the change, Raiders won 57% of Stage 1-5, and Vanguard won 60% of Stage 1-4. The bot of the Tutorial simulation in the web app won 92.5% of Stage 1-1. These enemy Decks changed:

- **1-1:** 1 Militia Recruit became a third Shieldbearer (C). The Militia Recruits stay, because one is the first-win card. A third Scrap Raider also worked, but the Tutorial bot won less often with it (96.8% and 94.5% over 400 seeds, against 98.0% and 95.0%).
- **1-4:** the Tusk Brute became a Scrap Raider (C). Vanguard wins 65% and Raiders 79%. Each Rank change on the Crossbow Guards put Raiders at 80% or more. Gate Warden is already at its Base Rank.
- **1-5:** the Militia Recruit Start Unit is Common (it was Uncommon). The Common 3/8 has almost the stats of the old Uncommon 4/7.

On 2026-10-08, the Ticking Cards were removed, and all Cards in the Hand count down again ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md), issue #26). The Power Budget stays `21 + 3 × (Countdown − 3)`, so no card changed. Raiders then won 58% of Stage 1-6 and 49% of 1-7, and Vanguard won 81% of 1-8 (1000 seeds). These enemy Decks changed:

- **1-6:** the Militia Recruit is Common (it was Uncommon). Both Shieldbearers at Uncommon also worked (71% / 65%), but this change gives both Decks more margin.
- **1-7:** Spear Throw is Uncommon (it was Rare), its Base Rank at that time. The other Rank, Hero HP and Gear changes left Raiders at 56% or less, or put Vanguard above 80%.
- **1-8:** the Scrap Raider is Rare (it was Common). With an Uncommon Scrap Raider, Vanguard won 77%. A Rare Crossbow Guard put Raiders at 48%.

Before 2026-10-14, some margins were thin: Raiders won 79% of Stage 1-4, and the Tutorial bot won 95.0% of Stage 1-1 with Raiders over 400 seeds.

### 2.3 Enemy Decks

C, U, R and E are the Ranks Common, Uncommon, Rare and Epic.

| Stage | Deck |
| --- | --- |
| 1-1 | 2× Militia Recruit (C), 2× Badland Runt (C), 3× Shieldbearer (C), 2× Scrap Raider (C), 1× Halberdier (C) |
| 1-2 | 2× Badland Runt (C), 2× Scrap Raider (C), 1× Militia Recruit (C), 1× Crossbow Guard (U), 2× Howling Charger (U), 1× War Drums (U) |
| 1-3 | 1× Badland Runt (C), 2× Ember Shaman (C), 1× Shieldbearer (C), 2× Skyreaver (U), 2× Frost Bolt (C), 1× Fireball (C), 1× Flame Wave (U) |
| 1-4 | 3× Shieldbearer (C), 2× Gate Warden (U), 2× Halberdier (C), 1× Scrap Raider (C), 2× Crossbow Guard (U) |
| 1-5 | 2× Militia Recruit (C), 1× Scrap Raider (C), 1× Badland Runt (U), 1× Crossbow Guard (C), 2× Halberdier (C), 3× Shieldbearer (C), 1× Spear Throw (C) |
| 1-6 | 2× Halberdier (C), 2× Ember Shaman (C), 2× Shieldbearer (R), 1× Dawn Cleric (U), 1× Militia Recruit (C), 2× Frost Bolt (C), 1× Fireball (C) |
| 1-7 | 1× Halberdier (C), 1× Ember Shaman (C), 2× Scrap Raider (C), 1× Pack Stalker (R), 2× Howling Charger (U), 3× Skyreaver (U), 1× Tusk Brute (U), 1× Spear Throw (U) |
| 1-8 | 1× Shieldbearer (C), 1× Shieldbearer (U), 3× Halberdier (C), 1× Crossbow Guard (U), 1× Gate Warden (U), 1× Scrap Raider (C), 2× Howling Charger (U), 1× Tusk Brute (C), 1× Shield Wall (C) |
| 1-9 | 1× Crossbow Guard (U), 1× Crossbow Guard (C), 1× Ember Shaman (C), 1× Halberdier (C), 1× Shieldbearer (C), 2× Skyreaver (U), 1× Scrap Raider (C), 1× Militia Recruit (C), 1× Dawn Cleric (U), 1× River Knight (U), 1× Frost Bolt (C), 1× Fireball (C) |
| 1-10 | 3× Militia Recruit (C), 1× Gate Warden (R), 2× Shieldbearer (C), 2× Crossbow Guard (C), 2× Halberdier (R), 1× Iron Bulwark (E), 1× Spear Throw (U), 1× Shield Wall (U), 1× War Drums (U) |

## 3. Region 2: The Red Mesas

The Orc tribes of the mesas and the Goblin mines under them (GDD 3.3). **Boss Snikkit**, the goblin mine king, pays the Orcs with rocks that he paints gold. The Orcs think that it is real gold, so they fight for him. Region 2 is the Debut of the Goblins: Sabotage and Hobble are new, because no Region 1 Deck has them.

- **No ramp.** The ramp of Stages 1-1 to 1-3 is only in Region 1. The target of each normal Stage is 60% to 80%, and of the Boss Stage 30% to 50%, with no Gear and with the Expected Gear ([ADR-0034](../adr/0034-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
- **Skill Cards.** The enemy Decks can use the Skill Cards of all 4 Classes (see 1).
- **First-win cards.** The cards are mixed, so that they help both Starter Decks: 2-1 Ankle Snatcher (C), 2-2 Tunnel Saboteur (C), 2-3 Fuse Runner (C), 2-4 Scrap Plate Guard (C), 2-5 Junk Slinger (C), 2-6 Mesa Pit Fighter (R), 2-7 Warhowler Drummer (U), 2-8 Grease Trapper (U), 2-9 Spyglass Sniper (R) and 2-10 Warchief Grukka (E). With Grukka, the Orc warchief shows that he respects the Player.
- **No Boss card in the Boss Deck.** The Boss Snikkit card is not in the Deck of Stage 2-10. Thus the Boss Hero and a Unit of the same person are never on the Board together.

### 3.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 2-1 | The Dust Road | Mesa Outrider (Warrior) | A dusty road between two red mesas, with an orc lookout post | **Hobble:** Ankle Snatchers make the front Units slow. |
| 2-2 | The Scrap Market | Junk Haggler (Warrior) | Goblin market stalls of scrap under awnings | **Sabotage:** Tunnel Saboteurs delay a card in the Hand. |
| 2-3 | The Powder Shed | Fuse Mistress (Mage) | A small shed with powder barrels and a smoking roof | **Goblin bombs:** Last Breath 3 on Fuse Runner and Rocket Barrel Rider. |
| 2-4 | The Junk Wall | Gatefixer Grub (Warrior) | A wall of scrap, carts and bones across a canyon | **Walls that sabotage or explode:** Junk Barricade and Bonestake Palisade. |
| 2-5 | Sniper's Ridge | Spyglass Sniper (Ranger) | A high ledge with a big brass spyglass | **Enemy Ranger Skill Cards** for the first time, and Goblin Long-range Units: Junk Slinger and Bomb Lobber. |
| 2-6 | The Fighting Pit | Pit Boss (Warrior) | An orc fighting pit with a crowd fence | **Fire goes through Armor** ([ADR-0031](../adr/0031-armor-reduces-only-physical-damage.md)): Pyreaxe Ravager, Cinderhorn Breakers, Ember Shamans and a Bomb Lobber. The Player now has Armor Gear. |
| 2-7 | The War Drum Camp | Drum Shaman (Priest) | An orc camp with very big war drums | **Enemy Priest Skill Cards** for the first time, and Rally: the enemy heals and wards its Units. |
| 2-8 | The Cave-in | Tunnel Foreman (Ranger) | A collapsed mine tunnel with rubble and props | **The middle Lane is closed:** Lane 2 opens on Turn 5. |
| 2-9 | The Mine Mouth | Snikkit's Lookout (Mage) | A big mine entrance with rail tracks and smoke | **The final test:** all of the above together. |
| 2-10 | Snikkit's Throne Hall | Boss Snikkit (Ranger) — **Boss** | A mine hall cut into the largest mesa, with a gate of scrap and a huge bucket crown on top | **The Boss rule:** Warchief Grukka (Epic), whom Snikkit pays in painted-rock "gold", is a Start Unit in the middle Lane. Junk Barricades are Start Units in Lanes 1 and 3. |

### 3.2 Numbers

The columns are the same as in 2.2.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2-1 | 40 | 0 / 0 / 0 / 0 | 15 | — | — | Ankle Snatcher (Common) | 6 | 66% / 70% | 3 / 3 / 3 / 3 | 70% / 72% |
| 2-2 | 40 | 0 / 0 / 0 / 0 | 15 | — | — | Tunnel Saboteur (Common) | 6 | 70% / 69% | 4 / 3 / 3 / 3 | 74% / 69% |
| 2-3 | 42 | 0 / 0 / 0 / 0 | 16 | — | — | Fuse Runner (Common) | 7 | 68% / 67% | 4 / 4 / 3 / 3 | 70% / 71% |
| 2-4 | 42 | 0 / 0 / 0 / 0 | 15 | — | — | Scrap Plate Guard (Common) | 7 | 63% / 73% | 4 / 4 / 4 / 3 | 67% / 78% |
| 2-5 | 42 | 0 / 0 / 0 / 0 | 16 | — | — | Junk Slinger (Common) | 7 | 63% / 72% | 4 / 4 / 4 / 4 | 71% / 75% |
| 2-6 | 44 | 0 / 0 / 0 / 0 | 16 | — | — | Mesa Pit Fighter (Rare) | 8 | 66% / 73% | 5 / 5 / 5 / 4 | 69% / 78% |
| 2-7 | 44 | 0 / 0 / 0 / 0 | 17 | — | — | Warhowler Drummer (Uncommon) | 8 | 64% / 66% | 5 / 5 / 5 / 5 | 69% / 71% |
| 2-8 | 44 | 0 / 0 / 0 / 0 | 16 | Lane 2, opens on Turn 5 | — | Grease Trapper (Uncommon) | 8 | 68% / 68% | 5 / 5 / 5 / 5 | 73% / 71% |
| 2-9 | 46 | 0 / 0 / 0 / 0 | 17 | — | — | Spyglass Sniper (Rare) | 9 | 69% / 63% | 5 / 5 / 5 / 5 | 75% / 70% |
| 2-10 | 54 | 0 / 0 / 0 / 0 | 19 | — | Warchief Grukka (Epic), Lane 2, Column 11 · Junk Barricade (Uncommon), Lane 1, Column 11 · Junk Barricade (Uncommon), Lane 3, Column 11 | Warchief Grukka (Epic) | 9 | 38% / 33% | 5 / 5 / 5 / 5 | 45% / 39% |

All win rates come from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-14, when the Region 2 Stages were added ([ADR-0036](../adr/0036-the-campaign-has-5-regions-and-each-region-adds-one-race.md)). All rows of Regions 1 and 2 are on their target, with no Gear and with the Expected Gear. The Region 1 rows did not change. On 2026-10-15, the Gear got 20 levels ([ADR-0037](../adr/0037-gear-has-20-levels-with-the-power-of-the-old-10.md)). The enemy Gear doubled, so the enemy stats did not change. The Expected Gear and its win rates come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. The rows with no Gear did not change. On 2026-10-15, the enemy AI started to give a value to Sabotage, Hobble and Last Breath when it summons (issue [#84](https://github.com/rifandani/heynbord/issues/84), GDD 9). The Region 2 win rates in the table come from a new run of `bun scripts/simulate.ts stage 1000 --check`. Each row moved by 4 points or less, and all rows are still on their target, so Region 2 was not tuned again. The Region 1 rows did not change. On 2026-10-15, a Gear upgrade started to need a Forge Stone ([ADR-0038](../adr/0038-gear-upgrades-need-earn-only-forge-stones.md)). Regions 1 and 2 give only Common Forge Stones, so the Expected Gear stops at level 5 (it was up to 7). The Expected Gear and all win rates of the table come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. The rows with no Gear moved by 4 points or less, because the sim gives the Battle seeds in row order and the Expected Gear rows of Region 1 changed.

Notes from the first tuning:

- **The expected Deck is full.** At level 6, the expected Deck of each Starter Deck already has 15 of 15 cards: the Starter Deck and the Region 1 first-win cards. Thus the Region 2 first-win cards do not go into the expected Deck, and they do not change the win rates of the later Region 2 Stages. When the expected Deck rule changes, tune Region 2 again.
- **Rank is the strong tool.** In Region 2, Hero HP and enemy Gear move the win rate by only a few points. Rank +1 on each copy took Stage 2-1 from 93% to 49%. Thus each Stage raises the Rank of only some copies. The enemy Gear stays 0 / 0 / 0 / 0, and it is a reserve for a later re-tune.
- **No Epic card in a normal Stage.** No copy of a normal Stage goes above Rare. The only Epic cards of Region 2 are Warchief Grukka in the Boss Stage.
- **2-6 (Fire).** The first Deck had 2 Pyreaxe Ravagers and 2 Ashspit Hunters (Rare), and Vanguard won only 24%. Now 1 Pyreaxe Ravager stays, and the other became a Tusk Brute. The Ashspit Hunters became a Cinderhorn Breaker and an Ember Shaman, and a second War Drums replaces the Spear Throw. The Spear Throw hit Vanguard the most: with it, Vanguard won only 53% with no Gear (500 Battles).
- **2-8 (The Cave-in).** The Closed middle Lane makes the Stage easy (97% with each copy at its Base Rank). Thus almost each copy is one Rank above its Base Rank.
- **2-10 (Boss).** Hero HP 54 (the first value was 50) keeps the Boss the largest of Region 2. The Grukka card of the Deck cannot come to the Board while the Grukka Start Unit is on it, because Grukka is Unique.

### 3.3 Enemy Decks

| Stage | Deck |
| --- | --- |
| 2-1 | 3× Ankle Snatcher (C), 2× Badland Runt (U), 2× Scrap Raider (U), 2× Tusk Brute (U), 2× Howling Charger (R), 1× Ember Shaman (U), 1× Junk Slinger (C), 1× War Drums (U), 1× Spear Throw (C) |
| 2-2 | 3× Tunnel Saboteur (C), 2× Ankle Snatcher (U), 2× Scrap Raider (U), 2× Scrap Plate Guard (U), 1× Ember Shaman (U), 1× Howling Charger (R), 1× Howling Charger (U), 1× Tusk Brute (C), 1× Shield Bash (C), 1× War Drums (U) |
| 2-3 | 3× Fuse Runner (C), 2× Rocket Barrel Rider (R), 1× Mine Sapper (R), 2× Badland Runt (U), 2× Scrap Raider (U), 1× Tunnel Saboteur (U), 2× Ember Shaman (U), 1× Fireball (C), 1× Spark (C), 1× Frost Bolt (C) |
| 2-4 | 2× Junk Barricade (R), 1× Bonestake Palisade (C), 3× Scrap Plate Guard (C), 2× Junk Slinger (U), 2× Ember Shaman (U), 1× Tunnel Saboteur (C), 2× Scrap Raider (C), 1× Shield Wall (C), 1× Spear Throw (C) |
| 2-5 | 2× Junk Slinger (C), 2× Bomb Lobber (U), 1× Spyglass Sniper (R), 2× Scrap Plate Guard (U), 2× Ankle Snatcher (C), 2× Scrap Raider (C), 1× Tunnel Saboteur (C), 1× Quick Shot (C), 1× Harrying Shot (C), 1× Long Shot (U), 1× Warning Shot (C) |
| 2-6 | 1× Mesa Pit Fighter (R), 1× Pyreaxe Ravager (R), 3× Cinderhorn Breaker (U), 3× Ember Shaman (C), 1× Tusk Brute (C), 2× Scrap Raider (C), 1× Bomb Lobber (U), 2× Fuse Runner (C), 2× War Drums (U) |
| 2-7 | 2× Warhowler Drummer (U), 2× Scrap Plate Guard (U), 2× Tusk Brute (C), 2× Scrap Raider (C), 2× Ember Shaman (C), 1× Junk Slinger (C), 1× Howling Charger (U), 2× Mend (C), 1× Blessing of Light (C), 1× Radiant Strike (C), 1× Sanctuary (U) |
| 2-8 | 1× Grease Trapper (R), 1× Grease Trapper (U), 2× Tunnel Saboteur (U), 2× Ankle Snatcher (U), 2× Junk Slinger (U), 2× Scrap Plate Guard (U), 1× Junk Barricade (R), 2× Fuse Runner (U), 1× Tusk Brute (U), 1× Quick Shot (U), 1× Pinning Shot (U) |
| 2-9 | 1× Spyglass Sniper (R), 1× Grease Trapper (R), 1× Tunnel Saboteur (U), 1× Ankle Snatcher (U), 1× Fuse Runner (C), 1× Junk Barricade (R), 1× Scrap Plate Guard (U), 1× Junk Slinger (U), 1× Bomb Lobber (U), 1× Cinderhorn Breaker (U), 1× Warhowler Drummer (U), 1× Ember Shaman (C), 1× Scrap Raider (C), 1× Tusk Brute (C), 1× Fireball (C), 1× Frost Bolt (C), 1× Arc Lightning (U) |
| 2-10 | 1× Warchief Grukka (E), 2× Junk Barricade (U), 2× Grease Trapper (U), 2× Tunnel Saboteur (C), 1× Spyglass Sniper (R), 2× Junk Slinger (C), 2× Bomb Lobber (U), 1× Mine Sapper (R), 2× Fuse Runner (C), 1× Scrap Plate Guard (C), 1× Howling Charger (U), 1× Quick Shot (C), 1× Harrying Shot (C) |

## 4. Region 3: The Glowcap Hollows

The Goblin tunnels from the Red Mesas break out into an old Elf grove of giant glowing mushrooms (GDD 3.3). **Lady Glimmerbough**, the grove warden, did not chase the goblin diggers out. She hired them. They build walls and set traps for the grove, and she pays them with glowcaps. The goblins sell the glowcaps in the Red Mesas as lamps. The Player comes out of the goblin tunnels, so the Elves think that the Player is one more digger. Region 3 is the Debut of the Elves: Regenerate, Poison and Entangle are new to the enemies. The first Stages have mostly Goblins, and the Stages near the grove hall have mostly Elves.

- **No ramp.** The target of each normal Stage is 60% to 80%, and of the Boss Stage 30% to 50%, with no Gear and with the Expected Gear ([ADR-0034](../adr/0034-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
- **Skill Cards.** The enemy Decks can use the Skill Cards of all 4 Classes (see 1).
- **The landmarks were painted first.** The Region Map was made before the Stages, with the proposed landmarks of [12 — Region Concepts, 2.3](./12-region-concepts.md#23-the-glowcap-hollows). Each Stage takes the place of its painted landmark, so the painting does not change.
- **First-win cards.** The cards are mixed, so that they help both Starter Decks: 3-1 Rootbound Guard (C), 3-2 Bramble Nest (U), 3-3 Acorn Tender (C), 3-4 Fernwing Courier (C), 3-5 Mosspitcher Lookout (C), 3-6 Sidestep Shiv (U), 3-7 Seedwind Shepherd (R), 3-8 Canopy Skirmisher (U), 3-9 Elderreed Dartmaster (R) and 3-10 Lethiel, First Gardener (E). Lady Glimmerbough sees that the Player is not a digger, and she lets Lethiel go with the Player.
- **No Boss card.** Lady Glimmerbough has no card. Each Race has 15 cards ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)), and the Elf Epic cards are Canopy Vinewarden and Lethiel. Thus she is only a Hero, as Baron Brassbelly is.

### 4.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 3-1 | The Tunnel Exit | Mossfoot Sentry (Warrior) | A goblin tunnel exit with a broken mine cart | **Regenerate:** Rootbound Guards and Dewkeepers heal in each Start Phase. Kill a Unit in one Turn, or it heals. |
| 3-2 | The Stuck Drill | Drillboss Nub (Warrior) | A goblin drill stuck in the stem of a giant mushroom | **Walls that heal:** Bramble Nests (Wall, Regenerate) with Dewkeepers behind them. |
| 3-3 | The Glowing Pool | Dewdrop Alchemist (Mage) | A pool that glows, with stepping stones | **Poison:** Acorn Tenders and Thornline Archers. Each hit adds a stack, and the stacks hurt in each End Phase. |
| 3-4 | The Rope Bridge | Bridgewarden Fennick (Ranger) | A rope bridge between two giant mushroom caps | **Elf Flying:** Fernwing Couriers, Canopy Skirmishers and an Amberwing Dart (Flying and Poison). |
| 3-5 | The Lantern Post | Lantern Lookout (Ranger) | An elf watch post on a mushroom cap, with lanterns | **Elf Long-range:** Mosspitcher Lookouts (Regenerate) and Thornline Archers behind Bramble Nests, with Venom Arrow. |
| 3-6 | The Goblin Camp | Gig the Hired (Warrior) | A goblin camp with scrap tents under the mushrooms | **Pivot:** Sidestep Shivs and Glade Turnblades hit the Unit behind or next to them first. |
| 3-7 | The Mushroom Ring | Ring Singer (Priest) | A ring of small glowing mushrooms around an old stone | **The grove heals:** Regenerate Units with Prayer of Healing and Cleanse, both for the first time. |
| 3-8 | The Glowing Falls | Falls Warden (Mage) | A small waterfall of glowing water into a cave | **A Lane that stays closed:** the water covers Lane 3 for the full Battle. The Battle has only 2 Lanes. |
| 3-9 | The Root Gate | Glimmerbough's Gatekeeper (Ranger) | An elf gate of woven roots, with a hole that the goblins dug under it | **The final test:** all of the above together. |
| 3-10 | Glimmerbough's Grove Hall | Lady Glimmerbough (Priest) — **Boss** | An elf hall in a ring of giant mushrooms, with a roof of mushroom caps | **The Boss rule and Entangle:** her bodyguard, a Canopy Vinewarden (Epic, Long-range, First Strike, Entangle), is a Start Unit in the middle Lane, behind a Bramble Nest Start Unit. |

### 4.2 Numbers

The columns are the same as in 2.2.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3-1 | 48 | 0 / 0 / 0 / 0 | 18 | — | — | Rootbound Guard (Common) | 10 | 64% / 73% | 5 / 5 / 5 / 5 | 70% / 79% |
| 3-2 | 48 | 0 / 0 / 0 / 0 | 18 | — | — | Bramble Nest (Uncommon) | 10 | 66% / 72% | 6 / 5 / 5 / 5 | 72% / 77% |
| 3-3 | 50 | 0 / 0 / 0 / 0 | 19 | — | — | Acorn Tender (Common) | 11 | 63% / 75% | 6 / 6 / 5 / 5 | 70% / 79% |
| 3-4 | 50 | 0 / 0 / 0 / 0 | 20 | — | — | Fernwing Courier (Common) | 11 | 65% / 70% | 6 / 6 / 6 / 5 | 72% / 76% |
| 3-5 | 48 | 0 / 0 / 0 / 0 | 20 | — | — | Mosspitcher Lookout (Common) | 12 | 62% / 66% | 6 / 6 / 6 / 6 | 71% / 73% |
| 3-6 | 52 | 0 / 0 / 0 / 0 | 20 | — | — | Sidestep Shiv (Uncommon) | 12 | 70% / 70% | 7 / 7 / 7 / 6 | 77% / 75% |
| 3-7 | 54 | 0 / 0 / 0 / 0 | 21 | — | — | Seedwind Shepherd (Rare) | 13 | 64% / 67% | 7 / 7 / 7 / 7 | 71% / 73% |
| 3-8 | 54 | 0 / 0 / 0 / 0 | 21 | Lane 3, closed for the full Battle | — | Canopy Skirmisher (Uncommon) | 13 | 66% / 68% | 8 / 7 / 7 / 7 | 75% / 76% |
| 3-9 | 56 | 0 / 0 / 0 / 0 | 22 | — | — | Elderreed Dartmaster (Rare) | 13 | 64% / 63% | 8 / 8 / 7 / 7 | 74% / 73% |
| 3-10 | 64 | 0 / 0 / 0 / 0 | 23 | — | Canopy Vinewarden (Epic), Lane 2, Column 11 · Bramble Nest (Uncommon), Lane 2, Column 10 | Lethiel, First Gardener (Epic) | 14 | 35% / 38% | 8 / 8 / 8 / 7 | 45% / 49% |

All win rates come from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-15, when the Region 3 Stages were added. All rows of Regions 1 to 3 are on their target, with no Gear and with the Expected Gear. Over 2000 Battles, Vanguard and Raiders win 63% / 74% and 70% / 79% of 3-1, and 35% / 39% and 45% / 49% of 3-10. The economy sim (Economy 7.1) gives the same result as before, because the Coin, XP and Forge Stones of a Stage come only from its Region and its Boss flag.

Notes from the first tuning:

- **The expected Deck takes Region 3 cards.** At level 10, the expected Deck has 18 or 19 cards, and its Countdown is almost at the Countdown Limit. The Region 3 first-win cards go into it when there is space. Thus a change to a Region 3 first-win card changes the win rates of the later Region 3 Stages.
- **Gear adds more.** Region 3 gives Uncommon Forge Stones (Economy 2.1), so the Expected Gear is 5 to 8 (Region 2: 3 to 5). It adds about 6 to 10 points. Raiders gets more from Gear than Vanguard. Thus each normal Stage must stay at about 62% to 72% with no Gear.
- **Rank is the strong tool.** The first Decks had each copy at its Base Rank. Vanguard and Raiders won 96% / 97% of 3-1 and 96% / 91% of 3-6 (300 Battles). Thus these Stages raise the Rank of most copies.
- **The Long-range Stages were too hard.** At the Base Rank, 3-5 gave 24% / 42%, 3-9 gave 46% / 56% and 3-10 gave 6% / 11% (300 Battles). Hero HP moved them only a few points. Thus some Rare and Epic copies became cheaper cards. 3-5 lost the Elderreed Dartmaster, the Spyglass Sniper and the Long Shot. 3-9 lost the Amberwing Dart, the Junk Walker and the Venom Arrow. Each kept its first-win card.
- **3-2 (The Stuck Drill).** Raiders won 81% with the Expected Gear, and Vanguard won only 62% with no Gear. Each Rank change moved both Decks together. The Junk Walker (Bulwark 2) hit Vanguard the most, so a second Dewkeeper replaces it.
- **3-1 (The Tunnel Exit).** One Rare Scrap Plate Guard took Raiders with the Expected Gear from 81% to 79%.
- **3-10 (Boss).** The first Boss Deck had a Canopy Vinewarden, Bramble Nests, Thornline Archers, a Cleanse and a Prayer of Healing. The Canopy Vinewarden is now only the Start Unit, so the Boss rule stays. The Deck has 23 cards: 1 more than 3-9, and the same size as the expected Deck at level 14. Hero HP 64 keeps the Boss the largest of Region 3.

### 4.3 Enemy Decks

| Stage | Deck |
| --- | --- |
| 3-1 | 3× Rootbound Guard (U), 2× Dewkeeper (U), 2× Bramble Duelist (U), 1× Ankle Snatcher (U), 1× Ankle Snatcher (C), 2× Tunnel Saboteur (C), 1× Scrap Plate Guard (R), 1× Scrap Plate Guard (U), 1× Junk Slinger (U), 1× Junk Slinger (C), 1× Fuse Runner (C), 1× Shield Bash (C), 1× War Drums (U) |
| 3-2 | 2× Bramble Nest (U), 2× Rootbound Guard (U), 2× Junk Slinger (U), 2× Bomb Lobber (U), 2× Tunnel Saboteur (C), 1× Bramble Duelist (U), 1× Bramble Duelist (C), 1× Junk Barricade (U), 2× Dewkeeper (U), 2× Ankle Snatcher (C), 1× Shield Wall (C) |
| 3-3 | 3× Acorn Tender (C), 2× Thornline Archer (U), 2× Rootbound Guard (C), 2× Bramble Duelist (C), 2× Scrap Plate Guard (C), 2× Ankle Snatcher (U), 1× Tunnel Saboteur (C), 1× Fuse Runner (C), 1× Dewkeeper (U), 1× Frost Bolt (C), 1× Fireball (C), 1× Frost Shards (C) |
| 3-4 | 3× Fernwing Courier (U), 2× Canopy Skirmisher (U), 1× Amberwing Dart (R), 2× Rootbound Guard (C), 2× Bramble Duelist (C), 2× Acorn Tender (U), 2× Ankle Snatcher (C), 1× Junk Slinger (U), 1× Junk Slinger (C), 1× Scrap Plate Guard (U), 1× Warning Shot (C), 1× Harrying Shot (C), 1× Pinning Shot (C) |
| 3-5 | 3× Mosspitcher Lookout (C), 3× Bramble Duelist (C), 2× Thornline Archer (U), 2× Bramble Nest (U), 2× Rootbound Guard (C), 2× Scrap Plate Guard (C), 1× Ankle Snatcher (C), 1× Tunnel Saboteur (C), 1× Venom Arrow (R), 1× Pinning Shot (C), 1× Warning Shot (C), 1× Quick Shot (C) |
| 3-6 | 3× Sidestep Shiv (R), 2× Glade Turnblade (R), 2× Scrap Plate Guard (U), 2× Ankle Snatcher (U), 2× Tunnel Saboteur (U), 2× Fuse Runner (U), 1× Grease Trapper (U), 1× Junk Walker (R), 1× Bomb Lobber (U), 1× Rocket Barrel Rider (U), 1× Mosspitcher Lookout (C), 1× Spear Throw (C), 1× War Drums (U) |
| 3-7 | 1× Seedwind Shepherd (R), 2× Dewkeeper (U), 2× Rootbound Guard (U), 1× Rootbound Guard (C), 2× Mosspitcher Lookout (C), 2× Bramble Duelist (C), 2× Acorn Tender (C), 1× Bramble Nest (U), 2× Scrap Plate Guard (C), 1× Junk Slinger (C), 1× Prayer of Healing (U), 1× Cleanse (R), 2× Mend (C), 1× Smite (C) |
| 3-8 | 2× Canopy Skirmisher (U), 2× Fernwing Courier (U), 2× Thornline Archer (U), 2× Rootbound Guard (U), 2× Bramble Duelist (U), 1× Glade Turnblade (U), 2× Scrap Plate Guard (C), 2× Tunnel Saboteur (C), 1× Grease Trapper (U), 1× Bomb Lobber (U), 1× Junk Walker (R), 1× Frost Bolt (C), 1× Arc Lightning (U), 1× Spark (C) |
| 3-9 | 1× Elderreed Dartmaster (R), 1× Fernwing Courier (C), 1× Seedwind Shepherd (R), 1× Canopy Skirmisher (U), 1× Thornline Archer (U), 1× Mosspitcher Lookout (C), 1× Acorn Tender (C), 1× Dewkeeper (U), 2× Rootbound Guard (C), 1× Bramble Nest (U), 1× Glade Turnblade (U), 1× Bramble Duelist (C), 1× Sidestep Shiv (U), 2× Scrap Plate Guard (C), 1× Tunnel Saboteur (C), 1× Ankle Snatcher (C), 1× Grease Trapper (U), 1× Harrying Shot (C), 1× Pinning Shot (C), 1× Quick Shot (C) |
| 3-10 | 1× Lethiel, First Gardener (E), 3× Bramble Duelist (C), 1× Fernwing Courier (C), 2× Ankle Snatcher (C), 3× Mosspitcher Lookout (C), 2× Rootbound Guard (C), 2× Acorn Tender (C), 1× Glade Turnblade (U), 1× Junk Walker (R), 1× Grease Trapper (U), 1× Tunnel Saboteur (C), 2× Mend (C), 1× Smite (C), 1× Bramble Nest (U), 1× Dewkeeper (U) |

## 5. When a Stage changes

1. Change the data in `stages.ts`.
2. Run `bun run sim stage 1000` in `packages/rules`. Each Stage must be in its target with each Starter Deck, with no Gear and with its Expected Gear. CI runs `bun run rules:sim:check`, and it fails when a Stage is not on its target.
3. Update the tables of the Region (sections 2 to 4).
4. If the name or the place changes, update the Message Catalogs and the landmark on the Region Map (12 — Region Concepts, section 2).
