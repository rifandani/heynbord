# 14 — Campaign Stages

This document gives the design of each Stage of the Campaign: its place, its enemy, the new thing that it teaches, its enemy Deck and its first-win card. Section 7 gives the design of the Dungeons, and section 8 gives the design of the Heynspire Floors. The rules for all Stages are in [GDD 8.1](./03-game-design.md#81-campaign). The data is in `packages/rules/src/content/stages.ts`. The Stage names and the enemy names are in the Message Catalogs (`apps/web/src/core/libs/i18n/locales/`). The landmark of each Stage is on its Region Map ([12 — Region Concepts](./12-region-concepts.md)).

All 5 Regions have Stages. All names are draft names (README, "Status of names").

## 1. Rules for the Stages

- **One new thing for each Stage.** Each Stage after the Tutorial teaches one new thing. Stage 9 tests all of them, and the Boss Stage tests them with the Boss rule.
- **The place is the landmark.** The name of a Stage is a place on the Trail. The Region Map shows that place as the landmark next to the Stage Marker. The Battle does not show the landmark: all Stages of a Region use the one Battle Painting of the Region ([13 — Battlefield Concepts](./13-battlefield-concepts.md)).
- **Only the current tools.** A Stage uses only the cards that exist and the fields of the Stage data: enemy Class, Hero HP, Gear, Deck, Closed Lanes and Start Units. A new rule type needs its own design.
- **The Boss is the largest.** The Boss Stage has the largest enemy Hero HP and the largest Deck of its Region (GDD 8.1).
- **The Boss is of a Debut Race.** The Boss is of a Debut Race of its Region (GDD 3.3, [ADR-0034](../adr/0034-the-campaign-has-5-regions-and-each-region-adds-one-race.md)).
- **First-win card.** Each Stage gives one fixed card on its first win: a card of the enemy Deck of that Stage, in its Base Rank. The cards are mixed, so that they help each Starter Deck. The data is the `firstWinCard` field of each Stage. The rules Profile action `applyStageResult` gives it, and it also gives the repeat-win card from the Stage card pool (Economy 2.1).
- **Deck size of a new Player.** An enemy Deck has the same size as the expected Deck of a new Player at the Recommended level (see 1.1), or 1 card less. The Boss Deck is the exception: it is larger than all other Decks of its Region. The enemy gets stronger with Rank, Gear and Start Units, not with more cards. A side that has more cards keeps summoning after the other side has no cards, and that decides the Battle more than Hero HP.
- **Win-rate target.** The target is for a new player Deck on the first try (GDD 13): Stage 1-1 ≥ 95%, 1-2 ≥ 85%, 1-3 ≥ 75%, other Stages 60% to 80%, Boss Stages 30% to 50%. Each Stage must hit its target two times, both at the Recommended level: with no Gear, and with the **Expected Gear** (see 1.1 and [ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
- **Tuned for the Starter Decks.** Each copy in a Starter Deck has the Rank Common or Uncommon ([GDD 6.1](./03-game-design.md#61-starter-decks)). Thus a new player has no Epic card in Region 1, and the first win of the Boss Stage gives the first Epic. The Starter Deck guides are also in GDD 6.1: 10 cards, each copy at its Base Rank, Common Creature Cards in pairs or triples, and at least 1 Skill Card of the Class.
- **Skill Cards of each Region.** The Region 1 enemy Decks keep the Warrior and Mage Skill Cards that they have. The enemy Decks of Regions 2 to 5 can use all 40 Skill Cards, of all 4 Classes. Then a Ranger or Priest Player can also get a Skill Card from a Stage card pool ([Archetypes 2.3](./08-archetypes.md#23-skill-cards-and-the-gate)).
- **Tune the enemy strength first.** To change the difficulty of a Stage, first change Hero HP, Gear, the Ranks of the enemy cards and Start Units. Change an enemy Deck card or a first-win card only when the Stage cannot reach its target in another way, because these cards are the identity of the Stage.

### 1.1 Recommended level

Each Stage has a **Recommended level**: the Player level that the **First-try Path** gives before the Stage ([Economy 1.2](./07-economy.md#12-player-levels)). The First-try Path is the first win of each earlier Stage, in Stage order, with no losses and no repeats. The Player sees the Recommended level. It is the `recommendedLevel` field of each Stage in `stages.ts`.

The simulation (`bun run sim stage` in `packages/rules`) plays each Stage with the **expected Deck** of each Starter Deck, at the Recommended level of the Stage, with no Gear. Then it plays each Stage that has Expected Gear a second time, at that Gear.

The **Expected Gear** of a Stage is the highest Gear that a Player on the First-try Path has before the Stage, over all Play Styles ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)). The sim calculates it from the First-try run of each Play Style of the economy simulation ([Economy 7.1](./07-economy.md#71-economy-simulation)). It reads the level of each Gear slot before the first Battle of the Stage, and it takes the Play Style with the highest mean level. If two Play Styles have the same mean, it takes the first one in the order Collector, Upgrader, Balanced. Thus nobody writes the Expected Gear by hand, and it does not go out of date. Gear unlocks at player level 5 (GDD 7.1), so the Expected Gear is 0 / 0 / 0 / 0 for Stages 1-1 to 1-8. Before Stage 1-9 it is 3 / 2 / 2 / 2, and before Stage 1-10 it is 3 / 3 / 3 / 3. A Player who loses gets Gear sooner. That is a catch-up, not a miss.

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

Lane numbers are from the top, 1 to 3. A Start Unit position is its Column for the Player (1 is next to the Player's Hero). Gear is weapon / armor / trinket / banner, with levels 0 to 25 ([ADR-0035](../adr/0035-gear-levels-are-rescaled-to-half-steps.md), [ADR-0037](../adr/0037-gear-has-25-levels-and-a-legendary-forge-stone-tier.md)). The Stages use levels 0 to 20 only. The notes from before 2026-10-15 give Gear levels on the old scale of 0 to 10: an old level is 2 levels now.

The Gear column is the enemy Gear. The Expected Gear column is the Gear of the Player (see 1.1). A Stage with Expected Gear 0 / 0 / 0 / 0 has no second row, so its win rate at Expected Gear is "—".

The Star Turn is the Turn number that a 3-Star win must come before (GDD 4.11, [ADR-0045](../adr/0045-each-stage-has-its-own-star-turn.md)). The 3★ share is the share of the wins of both starter Decks that give 3 Stars, from `bun run sim stage 1000`. The target is 30% to 50% for a normal Stage, 20% to 40% for a Boss Stage, and 30% or more for the ramp Stages 1-1 to 1-3 (GDD 13, step 7).

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) | Star Turn | 3★ share (no Gear / Expected Gear) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1-1 | 6 | 0 / 0 / 0 / 0 | 10 | — | — | Militia Recruit (Common) | 1 | 100% / 100% | 0 / 0 / 0 / 0 | — | 15 | 99% / — |
| 1-2 | 32 | 4 / 0 / 0 / 4 | 9 | — | — | Scrap Raider (Common) | 1 | 91% / 90% | 0 / 0 / 0 / 0 | — | 15 | 88% / — |
| 1-3 | 38 | 6 / 0 / 6 / 6 | 10 | — | — | Ember Shaman (Common) | 2 | 86% / 90% | 0 / 0 / 0 / 0 | — | 15 | 85% / — |
| 1-4 | 38 | 0 / 0 / 0 / 0 | 10 | — | — | Shieldbearer (Common) | 2 | 65% / 73% | 0 / 0 / 0 / 0 | — | 13 | 40% / — |
| 1-5 | 42 | 6 / 0 / 6 / 6 | 11 | — | Militia Recruit (Common), Lane 1, Column 10 · Shieldbearer (Common), Lane 2, Column 10 · Crossbow Guard (Common), Lane 3, Column 11 | Crossbow Guard (Common) | 3 | 71% / 78% | 0 / 0 / 0 / 0 | — | 16 | 41% / — |
| 1-6 | 42 | 2 / 0 / 2 / 2 | 11 | — | — | Dawn Cleric (Uncommon) | 3 | 66% / 77% | 0 / 0 / 0 / 0 | — | 14 | 45% / — |
| 1-7 | 32 | 2 / 0 / 2 / 2 | 12 | — | — | Howling Charger (Uncommon) | 4 | 74% / 66% | 0 / 0 / 0 / 0 | — | 13 | 40% / — |
| 1-8 | 40 | 2 / 0 / 2 / 2 | 12 | Lane 1, opens on Turn 5 | Militia Recruit (Common), Lane 2, Column 11 | Gate Warden (Uncommon) | 4 | 68% / 63% | 0 / 0 / 0 / 0 | — | 15 | 46% / — |
| 1-9 | 32 | 0 / 0 / 0 / 0 | 13 | — | — | River Knight (Uncommon) | 5 | 63% / 74% | 3 / 3 / 2 / 2 | 68% / 76% | 15 | 45% / 47% |
| 1-10 | 48 | 6 / 0 / 0 / 4 | 14 | — | Shieldbearer (Epic), Lane 2, Column 11 | Iron Bulwark (Epic) | 5 | 32% / 45% | 3 / 3 / 3 / 2 | 37% / 48% | 18 | 34% / 35% |


**Retune of 2026-10-24.** The 1-7 row comes from a run of `bun rules:sim:check` on 2026-10-24. Pack Stalker has 4 HP (it had 5) and Thornline Archer has 5 HP (it had 4), for the Raiders Matchups ([08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). Stage 1-7 has a Pack Stalker, and its rows moved by 1 point or less. No Region 1 Deck changes.

On 2026-10-17, Heroic changed: after a Unit attacks an enemy Unit, it gets +N Attack ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)). Then the AI started to count the Heroic bonus (issue [#109](https://github.com/rifandani/heynbord/issues/109)). Before the retune of 2026-10-24, the win rates in the table came from a new run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` after issue #109. All rows are on their target. The next paragraphs tell the earlier runs. Stage 1-7: the Tusk Brute is Common (it was Uncommon).

**Issue #109 (2026-10-17).** The AI now counts the Heroic bonus in the value of a Unit and in the threat and the defense of a Lane (GDD 9). The AI plays both Sides in the sim, so this change moved all rows. The values "before" are after the AI change and before the content changes (1000 Battles). Vanguard and Raiders, with no Gear and then with the Expected Gear. Each change is to the enemy only. No first-win card, Start Unit or Closed Lane changes.

- **1-5:** 1 Shieldbearer is Uncommon (the 3 Shieldbearers were Common). Before: 73% / 80% (Raiders 80.4%, above the target). Now: 71% / 78%. Other tests (Vanguard / Raiders): Spear Throw Uncommon: 72.6% / 68.5%. 1 Halberdier Uncommon: 68.9% / 74.1%. 1 Militia Recruit Uncommon: 63.4% / 72.6%. Weapon 10: 70.4% / 78.1%. Armor 2: 72.6% / 80.1%.
- **1-10:** Hero HP 48 (it was 44), Gear 6 / 0 / 0 / 4 (it was 2 / 0 / 0 / 2), and Spear Throw is Rare (it was Uncommon). Before: 39% / 50%, then 42% / 55%. Now: 32% / 45%, then 37% / 48%. Stage 1-10 keeps the largest enemy Hero HP of Region 1. Other tests: Weapon 6, Banner 4 and a Rare Spear Throw with Hero HP 44: 34.1% / 46.9%, then 39.3% / 49.7%. 1 Militia Recruit Uncommon and Weapon 4: 31.2% / 45.3%, then 35.5% / 48.5%. 1 Militia Recruit Uncommon only: Vanguard with no Gear 32.7%, Raiders with the Expected Gear 49.4%. 1 Halberdier Epic: 30.3% and 48.2% (the same two rows). 1 Crossbow Guard Uncommon: 25.1% and 48.3%.

All win rates come from one run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` on 2026-10-15, after the rule for Ranged Unit Movement and its retune (issue [#96](https://github.com/rifandani/heynbord/issues/96)): a Ranged Unit now stops in the first empty Square from which it has a target in its Range. All rows are on their target, with no Gear and with the Expected Gear, so the CI balance gate passes.

The rule changed the win rates of each Stage. These Stages missed their target after the rule and changed (1000 Battles, Vanguard and Raiders, with no Gear and then with the Expected Gear). Each change is to the enemy strength only (see 1): no enemy Deck card, first-win card, Start Unit or Closed Lane changes, and the Deck sizes do not change.

- **1-6:** 1 Shieldbearer is Common (both were Rare). Before: 57.8% / 66.5%. Now: 65% / 73%. Other tests: Hero HP 40, 38 and 36 gave Vanguard 58.9%, 60.0% and 60.9%. 1 Uncommon Shieldbearer gave 61.1% / 68.7%.
- **1-9:** Hero HP 32 (it was 36). Before: 59.7% / 70.8%, then 64.8% / 74.2%. Now: 61% / 73%, then 67% / 76%. Other tests: Hero HP 34 gave Vanguard 60.0%, at the edge. Hero HP 30 gave 62.3% / 73.9%, then 67.4% / 76.2%. Banner 2 gave Vanguard 60.0%. A Common Crossbow Guard gave 74.4% / 80.5%, then 77.8% / 82.5%.

Stage 1-10 keeps the largest enemy Hero HP of Region 1 (44).

Before issue #96, the win rates came from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-14, after the re-tune of Stages 1-5, 1-7 and 1-8 (issue #79). All rows are on their target, with no Gear and with the Expected Gear, so the CI balance gate passes. On 2026-10-15, the Gear got 20 levels ([ADR-0035](../adr/0035-gear-levels-are-rescaled-to-half-steps.md)). The enemy Gear doubled, so the enemy stats did not change. The Expected Gear and its win rates come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. The rows with no Gear did not change. On 2026-10-15, a Gear upgrade started to need a Forge Stone ([ADR-0036](../adr/0036-gear-upgrades-need-earn-only-forge-stones.md)). The Expected Gear of 1-9 and 1-10 and its win rates come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. Before, the win rates came from the re-tune of Stage 1-10 for the Expected Gear (issue #78, [ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)), from `bun scripts/simulate.ts 1000 --check` on 2026-10-14, after the balance pass of [ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md), and from `bun run sim stage 1000` on 2026-10-11, after the re-tune of the Skill Cards (issue #56, [08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). Some rows with no change to their Stage are different from the earlier table, for example Raiders on 1-4 (72%, it was 67%).

On 2026-10-14, Stages 1-5, 1-7 and 1-8 got a re-tune for Raiders with no Gear (issue #79). Before, Vanguard and Raiders won 68% / 59% of 1-5, 73% / 57% of 1-7 and 67% / 49% of 1-8 (1000 Battles). The target is 60% to 80%. These Stages have no Expected Gear, so only the row with no Gear applies. The first-win cards, the Start Units of 1-5, the rush of 1-7 and the Closed Lane of 1-8 do not change. No enemy Deck card changes, and the Deck sizes do not change. Stage 1-10 keeps the largest enemy Hero HP of Region 1 (44). These Stages changed:

- **1-5:** Spear Throw is Common (it was Uncommon), its Base Rank. Now Vanguard and Raiders win 70% / 73%. Over 2000 Battles, they win 69% / 72%.
- **1-7:** Hero HP 32 (it was 34). Both Scrap Raiders are Common (they were Uncommon), and the Pack Stalker is Rare (it was Uncommon). Now Vanguard and Raiders win 75% / 64%. Over 2000 Battles, they win 76% / 63%.
- **1-8:** 1 Halberdier, the Scrap Raider and the Tusk Brute are Common (they were Uncommon). The Militia Recruit Start Unit is in Column 11 (it was in Column 12). Now Vanguard and Raiders win 71% / 65%. Over 2000 Battles, they win 71% / 65%.

On 1-7 and 1-8, Raiders had to go up by more points than Vanguard. Most changes of Hero HP, Gear and Rank moved both Decks up together, or moved Vanguard above 80%. On 1-7, the Pack Stalker at a higher Rank lowers Raiders more than Vanguard (70% / 50% alone). Thus the Rare Pack Stalker takes back some of the Vanguard gain. On 1-8, the Militia Recruit Start Unit one Column nearer to the Player hits Vanguard the most (54.5% / 51% alone). Thus it takes back the Vanguard gain of the Common copies. The other tests (1000 Battles, Vanguard and Raiders, with no Gear):

- **1-5:** Hero HP 38: 69% / 61%. Enemy Gear 1 / 0 / 1 / 1: 71% / 63%. The Badland Runt at Common: 74.5% / 60.5%. The Crossbow Guard Start Unit in Column 12: 64% / 62%. These put Raiders near the bottom of the target.
- **1-7:** Hero HP 32 only: 75% / 60%. Both Scrap Raiders Common only: 76% / 63%. Spear Throw Common: 78% / 63%. Hero HP 32 and both Scrap Raiders Common: 77% / 65%, but over 2000 Battles Vanguard won 78.5%. The same change and an Uncommon Halberdier: 74% / 61%.
- **1-8:** Hero HP 32: 69% / 53%. No Gear: 69% / 50%. The Crossbow Guard at Common: 82.5% / 60%, and with the Start Unit in Column 11: 76.5% / 64%. The Halberdier, the Scrap Raider and the Tusk Brute at Common, with the Start Unit in Column 12: 78% / 66%. No Start Unit: 72.6% / 61.5%.

On 2026-10-14, each Stage got a second win-rate check, at the Expected Gear (issue #78, [ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)). Only Stages 1-9 and 1-10 of Region 1 have Expected Gear. Before this pass, Vanguard and Raiders won 64% / 71% of 1-9 and 40% / 53% of 1-10 with no Gear, and 68% / 75% and 43% / 59% with the Expected Gear (1000 Battles). The old 1-10 row of the table (35% / 36%) was wrong: the sim did not give these values when the row was written. Stage 1-9 is on its target in all four rows, so it did not change. Stage 1-10 changed:

- **1-10:** both Crossbow Guards are Common (one was Uncommon), and both Halberdiers are Rare (they were Uncommon). Now Vanguard and Raiders win 36% / 39% with no Gear and 38% / 46% with the Expected Gear. Over 2000 Battles, they win 35% / 39% and 37% / 44%. Hero HP stays 44, so the Boss still has the largest Hero HP of Region 1. The Epic Shieldbearer bodyguard, the Iron Bulwark first-win card and all enemy Deck cards stay.

Raiders had to go down by more points than Vanguard. But most single changes of Rank, Start Units, Hero HP and Gear lowered Vanguard by more points than Raiders, or by about the same number. Only Uncommon Shieldbearers lowered Raiders a little more (4 points, and Vanguard 3 points). The Raiders Starter Deck has no Skyreavers now, so a Crossbow Guard at a higher Rank does not hit Raiders more. The Crossbow Guards hit Vanguard the most: with both Uncommon, Vanguard won 24% and Raiders 46%. With both Common, Vanguard won 57% and Raiders 63%. Thus Common Crossbow Guards close most of the gap, and the Rare Halberdiers then lower both Decks. The other tests (1000 Battles, Vanguard and Raiders, with no Gear and then with the Expected Gear):

- Both Crossbow Guards Common and 1 Halberdier Rare: 45% / 52%, then 48% / 55%. Raiders was above the target.
- The same change and Uncommon Shieldbearers: 44% / 47%, then 46% / 50%. Over 2000 Battles, Raiders won 50.8% with the Expected Gear.
- Both Crossbow Guards Common, both Halberdiers Rare and Uncommon Shieldbearers: 32% / 36%, then 36% / 42%. Vanguard was near the bottom of the target.
- Hero HP 47 only: 39% / 52%, then 41% / 57%. Enemy Gear 2 / 0 / 0 / 1 only: 40% / 52%, then 42% / 58%.
- A Common Crossbow Guard Start Unit in Lane 3: 24% / 41%, then 29% / 46%.

On 2026-10-14, each Unit got Base Speed 2, and the Keywords Swift, Fleet, Heavy, Mid-range, Long-range and Extreme-range replaced the Roles ([ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md)). The cards got new HP (see [08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). Mild Stage changes made Stages 1-7 and 1-8 easier:

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

On 2026-10-08, Speed 1 became the default, and the Role set more Speed. On 2026-10-14, [ADR-0029](../adr/0029-keywords-set-speed-and-range-and-there-are-no-roles.md) replaced this rule: each Unit has Base Speed 2, and there are no Roles. The numbers in this paragraph are from before that change. Militia Recruit became 3/8 with Speed 1 (it was 3/6 with Speed 2). The Starter Decks and many enemy Decks have Militia Recruits. After the change, Raiders won 57% of Stage 1-5, and Vanguard won 60% of Stage 1-4. The bot of the Tutorial simulation in the web app won 92.5% of Stage 1-1. These enemy Decks changed:

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
| 1-5 | 2× Militia Recruit (C), 1× Scrap Raider (C), 1× Badland Runt (U), 1× Crossbow Guard (C), 2× Halberdier (C), 1× Shieldbearer (U), 2× Shieldbearer (C), 1× Spear Throw (C) |
| 1-6 | 2× Halberdier (C), 2× Ember Shaman (C), 1× Shieldbearer (C), 1× Shieldbearer (R), 1× Dawn Cleric (U), 1× Militia Recruit (C), 2× Frost Bolt (C), 1× Fireball (C) |
| 1-7 | 1× Halberdier (C), 1× Ember Shaman (C), 2× Scrap Raider (C), 1× Pack Stalker (R), 2× Howling Charger (U), 3× Skyreaver (U), 1× Tusk Brute (C), 1× Spear Throw (U) |
| 1-8 | 1× Shieldbearer (C), 1× Shieldbearer (U), 3× Halberdier (C), 1× Crossbow Guard (U), 1× Gate Warden (U), 1× Scrap Raider (C), 2× Howling Charger (U), 1× Tusk Brute (C), 1× Shield Wall (C) |
| 1-9 | 1× Crossbow Guard (U), 1× Crossbow Guard (C), 1× Ember Shaman (C), 1× Halberdier (C), 1× Shieldbearer (C), 2× Skyreaver (U), 1× Scrap Raider (C), 1× Militia Recruit (C), 1× Dawn Cleric (U), 1× River Knight (U), 1× Frost Bolt (C), 1× Fireball (C) |
| 1-10 | 3× Militia Recruit (C), 1× Gate Warden (R), 2× Shieldbearer (C), 2× Crossbow Guard (C), 2× Halberdier (R), 1× Iron Bulwark (E), 1× Spear Throw (R), 1× Shield Wall (U), 1× War Drums (U) |

## 3. Region 2: The Red Mesas

The Orc tribes of the mesas and the Goblin mines under them (GDD 3.3). **Boss Snikkit**, the goblin mine king, pays the Orcs with rocks that he paints gold. The Orcs think that it is real gold, so they fight for him. Region 2 is the Debut of the Goblins: Sabotage and Hobble are new, because no Region 1 Deck has them.

- **No ramp.** The ramp of Stages 1-1 to 1-3 is only in Region 1. The target of each normal Stage is 60% to 80%, and of the Boss Stage 30% to 50%, with no Gear and with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
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
| 2-6 | The Fighting Pit | Pit Boss (Warrior) | An orc fighting pit with a crowd fence | **Fire goes through Armor** ([ADR-0030](../adr/0030-armor-reduces-only-physical-damage.md)): Pyreaxe Ravager, Cinderhorn Breakers, Ember Shamans and a Bomb Lobber. The Player now has Armor Gear. |
| 2-7 | The War Drum Camp | Drum Shaman (Priest) | An orc camp with very big war drums | **Enemy Priest Skill Cards** for the first time, and Rally: the enemy heals and wards its Units. |
| 2-8 | The Cave-in | Tunnel Foreman (Ranger) | A collapsed mine tunnel with rubble and props | **The middle Lane is closed:** Lane 2 opens on Turn 5. |
| 2-9 | The Mine Mouth | Snikkit's Lookout (Mage) | A big mine entrance with rail tracks and smoke | **The final test:** all of the above together. |
| 2-10 | Snikkit's Throne Hall | Boss Snikkit (Ranger) — **Boss** | A mine hall cut into the largest mesa, with a gate of scrap and a huge bucket crown on top | **The Boss rule:** Warchief Grukka (Epic), whom Snikkit pays in painted-rock "gold", is a Start Unit in the middle Lane. Junk Barricades are Start Units in Lanes 1 and 3. |

### 3.2 Numbers

The columns are the same as in 2.2.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) | Star Turn | 3★ share (no Gear / Expected Gear) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2-1 | 40 | 0 / 0 / 0 / 0 | 15 | — | — | Ankle Snatcher (Common) | 6 | 65% / 68% | 3 / 3 / 3 / 3 | 67% / 69% | 16 | 48% / 48% |
| 2-2 | 40 | 0 / 0 / 0 / 0 | 15 | — | — | Tunnel Saboteur (Common) | 6 | 67% / 68% | 4 / 3 / 3 / 3 | 73% / 72% | 16 | 33% / 33% |
| 2-3 | 40 | 0 / 0 / 0 / 0 | 16 | — | — | Fuse Runner (Common) | 7 | 70% / 71% | 4 / 4 / 3 / 3 | 70% / 75% | 16 | 31% / 32% |
| 2-4 | 42 | 0 / 0 / 0 / 0 | 15 | — | — | Scrap Plate Guard (Common) | 7 | 61% / 76% | 4 / 4 / 4 / 3 | 65% / 78% | 18 | 35% / 37% |
| 2-5 | 42 | 0 / 0 / 0 / 0 | 16 | — | — | Junk Slinger (Common) | 7 | 62% / 73% | 4 / 4 / 4 / 4 | 69% / 78% | 17 | 42% / 43% |
| 2-6 | 44 | 0 / 0 / 0 / 0 | 16 | — | — | Mesa Pit Fighter (Rare) | 8 | 64% / 73% | 5 / 5 / 5 / 4 | 66% / 78% | 17 | 40% / 42% |
| 2-7 | 44 | 0 / 0 / 0 / 0 | 17 | — | — | Warhowler Drummer (Uncommon) | 8 | 62% / 71% | 5 / 5 / 5 / 5 | 68% / 74% | 17 | 33% / 33% |
| 2-8 | 44 | 0 / 0 / 0 / 0 | 16 | Lane 2, opens on Turn 5 | — | Grease Trapper (Uncommon) | 8 | 67% / 77% | 5 / 5 / 5 / 5 | 75% / 79% | 18 | 36% / 36% |
| 2-9 | 46 | 0 / 0 / 0 / 0 | 17 | — | — | Spyglass Sniper (Rare) | 9 | 66% / 64% | 5 / 5 / 5 / 5 | 71% / 70% | 19 | 38% / 41% |
| 2-10 | 54 | 0 / 0 / 0 / 0 | 19 | — | Warchief Grukka (Epic), Lane 2, Column 11 · Junk Barricade (Uncommon), Lane 1, Column 11 · Junk Barricade (Uncommon), Lane 3, Column 11 | Warchief Grukka (Epic) | 9 | 36% / 31% | 5 / 5 / 5 / 5 | 43% / 37% | 22 | 32% / 36% |

On 2026-10-17, Heroic changed: after a Unit attacks an enemy Unit, it gets +N Attack ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)). Then the AI started to count the Heroic bonus (issue [#109](https://github.com/rifandani/heynbord/issues/109)). The win rates in the table come from a new run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` after issue #109. All rows are on their target. The next paragraphs tell the earlier runs. The enemy Heroic cards were too strong, so these Decks changed. 2-1: the 2 Tusk Brutes are Common (they were Uncommon), Vanguard 41% → 63%. 2-3: the 2 Scrap Raiders are Common (they were Uncommon). 2-6: a Badland Runt replaces the Tusk Brute. 2-7: a Badland Runt replaces 1 Tusk Brute, and another replaces 1 Scrap Raider. 2-8: the Tusk Brute is Common (it was Uncommon). A lower enemy Hero HP moved these Stages by only 1 to 3 points, so no Hero HP changed.

**Issue #109 (2026-10-17).** The AI now counts the Heroic bonus in the value of a Unit and in the threat and the defense of a Lane (GDD 9). The AI plays both Sides in the sim, so this change moved all rows. The values "before" are after the AI change and before the content changes (1000 Battles). Vanguard and Raiders, with no Gear and then with the Expected Gear. Each change is to the enemy only.

- **2-6:** the Mesa Pit Fighter is Epic (it was Rare). Before: 69% / 79%, then 72% / 83%. Now: 64% / 73%, then 66% / 78%. Other tests (Vanguard with no Gear, Raiders with the Expected Gear): 1 Ember Shaman Uncommon: 60.6%, 76.3%. Pyreaxe Ravager Epic: 59.8%, 77.7%. 1 Scrap Raider Uncommon: 65.0%, 80.5%. Hero HP 48: 67.9%, 81.8%. Hero HP 52: 66.5%, 81.4%.

All win rates come from one run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` on 2026-10-15, after the rule for Ranged Unit Movement and its retune (issue [#96](https://github.com/rifandani/heynbord/issues/96)): a Ranged Unit now stops in the first empty Square from which it has a target in its Range. All rows are on their target, with no Gear and with the Expected Gear, so the CI balance gate passes. No Stage of this Region changed for it.

Before issue #96, the win rates came from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-14, when the Region 2 Stages were added ([ADR-0034](../adr/0034-the-campaign-has-5-regions-and-each-region-adds-one-race.md)). All rows of Regions 1 and 2 are on their target, with no Gear and with the Expected Gear. The Region 1 rows did not change. On 2026-10-15, the Gear got 20 levels ([ADR-0035](../adr/0035-gear-levels-are-rescaled-to-half-steps.md)). The enemy Gear doubled, so the enemy stats did not change. The Expected Gear and its win rates come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. The rows with no Gear did not change. On 2026-10-15, the enemy AI started to give a value to Sabotage, Hobble and Last Breath when it summons (issue [#84](https://github.com/rifandani/heynbord/issues/84), GDD 9). The Region 2 win rates in the table come from a new run of `bun scripts/simulate.ts stage 1000 --check`. Each row moved by 4 points or less, and all rows are still on their target, so Region 2 was not tuned again. The Region 1 rows did not change. On 2026-10-15, a Gear upgrade started to need a Forge Stone ([ADR-0036](../adr/0036-gear-upgrades-need-earn-only-forge-stones.md)). Regions 1 and 2 give only Common Forge Stones, so the Expected Gear stops at level 5 (it was up to 7). The Expected Gear and all win rates of the table come from a new run of `bun scripts/simulate.ts stage 1000 --check`, and all rows are still on their target. The rows with no Gear moved by 4 points or less, because the sim gives the Battle seeds in row order and the Expected Gear rows of Region 1 changed. On 2026-10-16, each Stage got its own Star Turn (issue [#106](https://github.com/rifandani/heynbord/issues/106), [ADR-0045](../adr/0045-each-stage-has-its-own-star-turn.md)). The Hero HP of Stage 2-3 went from 42 to 40: at 42, most of its high-HP wins came on Turns 16 and 17, so no whole Star Turn put its 3★ share between 30% and 50% (28% at Turn 16, 53% at Turn 17). Its win rates moved by 1 point or less.

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
| 2-1 | 3× Ankle Snatcher (C), 2× Badland Runt (U), 2× Scrap Raider (U), 2× Tusk Brute (C), 2× Howling Charger (R), 1× Ember Shaman (U), 1× Junk Slinger (C), 1× War Drums (U), 1× Spear Throw (C) |
| 2-2 | 3× Tunnel Saboteur (C), 2× Ankle Snatcher (U), 2× Scrap Raider (U), 2× Scrap Plate Guard (U), 1× Ember Shaman (U), 1× Howling Charger (R), 1× Howling Charger (U), 1× Tusk Brute (C), 1× Shield Bash (C), 1× War Drums (U) |
| 2-3 | 3× Fuse Runner (C), 2× Rocket Barrel Rider (R), 1× Mine Sapper (R), 2× Badland Runt (U), 2× Scrap Raider (C), 1× Tunnel Saboteur (U), 2× Ember Shaman (U), 1× Fireball (C), 1× Spark (C), 1× Frost Bolt (C) |
| 2-4 | 2× Junk Barricade (R), 1× Bonestake Palisade (C), 3× Scrap Plate Guard (C), 2× Junk Slinger (U), 2× Ember Shaman (U), 1× Tunnel Saboteur (C), 2× Scrap Raider (C), 1× Shield Wall (C), 1× Spear Throw (C) |
| 2-5 | 2× Junk Slinger (C), 2× Bomb Lobber (U), 1× Spyglass Sniper (R), 2× Scrap Plate Guard (U), 2× Ankle Snatcher (C), 2× Scrap Raider (C), 1× Tunnel Saboteur (C), 1× Quick Shot (C), 1× Harrying Shot (C), 1× Long Shot (U), 1× Warning Shot (C) |
| 2-6 | 1× Mesa Pit Fighter (E), 1× Pyreaxe Ravager (R), 3× Cinderhorn Breaker (U), 3× Ember Shaman (C), 1× Badland Runt (C), 2× Scrap Raider (C), 1× Bomb Lobber (U), 2× Fuse Runner (C), 2× War Drums (U) |
| 2-7 | 2× Warhowler Drummer (U), 2× Scrap Plate Guard (U), 1× Tusk Brute (C), 1× Scrap Raider (C), 2× Badland Runt (C), 2× Ember Shaman (C), 1× Junk Slinger (C), 1× Howling Charger (U), 2× Mend (C), 1× Blessing of Light (C), 1× Radiant Strike (C), 1× Sanctuary (U) |
| 2-8 | 1× Grease Trapper (R), 1× Grease Trapper (U), 2× Tunnel Saboteur (U), 2× Ankle Snatcher (U), 2× Junk Slinger (U), 2× Scrap Plate Guard (U), 1× Junk Barricade (R), 2× Fuse Runner (U), 1× Tusk Brute (C), 1× Quick Shot (U), 1× Pinning Shot (U) |
| 2-9 | 1× Spyglass Sniper (R), 1× Grease Trapper (R), 1× Tunnel Saboteur (U), 1× Ankle Snatcher (U), 1× Fuse Runner (C), 1× Junk Barricade (R), 1× Scrap Plate Guard (U), 1× Junk Slinger (U), 1× Bomb Lobber (U), 1× Cinderhorn Breaker (U), 1× Warhowler Drummer (U), 1× Ember Shaman (C), 1× Scrap Raider (C), 1× Tusk Brute (C), 1× Fireball (C), 1× Frost Bolt (C), 1× Arc Lightning (U) |
| 2-10 | 1× Warchief Grukka (E), 2× Junk Barricade (U), 2× Grease Trapper (U), 2× Tunnel Saboteur (C), 1× Spyglass Sniper (R), 2× Junk Slinger (C), 2× Bomb Lobber (U), 1× Mine Sapper (R), 2× Fuse Runner (C), 1× Scrap Plate Guard (C), 1× Howling Charger (U), 1× Quick Shot (C), 1× Harrying Shot (C) |

## 4. Region 3: The Glowcap Hollows

The Goblin tunnels from the Red Mesas break out into an old Elf grove of giant glowing mushrooms (GDD 3.3). **Lady Glimmerbough**, the grove warden, did not chase the goblin diggers out. She hired them. They build walls and set traps for the grove, and she pays them with glowcaps. The goblins sell the glowcaps in the Red Mesas as lamps. The Player comes out of the goblin tunnels, so the Elves think that the Player is one more digger. Region 3 is the Debut of the Elves: Regenerate, Poison and Entangle are new to the enemies. The first Stages have mostly Goblins, and the Stages near the grove hall have mostly Elves.

- **No ramp.** The target of each normal Stage is 60% to 80%, and of the Boss Stage 30% to 50%, with no Gear and with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
- **Skill Cards.** The enemy Decks can use the Skill Cards of all 4 Classes (see 1).
- **The landmarks were painted first.** The Region Map was made before the Stages, with the proposed landmarks of [12 — Region Concepts, 2.3](./12-region-concepts.md#23-the-glowcap-hollows). Each Stage takes the place of its painted landmark, so the painting does not change.
- **First-win cards.** The cards are mixed, so that they help both Starter Decks: 3-1 Rootbound Guard (C), 3-2 Bramble Nest (U), 3-3 Acorn Tender (C), 3-4 Fernwing Courier (C), 3-5 Mosspitcher Lookout (C), 3-6 Sidestep Shiv (U), 3-7 Seedwind Shepherd (R), 3-8 Canopy Skirmisher (U), 3-9 Elderreed Dartmaster (R) and 3-10 Lethiel, First Gardener (E). Lady Glimmerbough sees that the Player is not a digger, and she lets Lethiel go with the Player.
- **No Boss card.** Lady Glimmerbough has no card. Each Race has 15 cards ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)), and the Elf Epic cards are Canopy Vinewarden and Lethiel. Thus she is only a Hero, as Baron Brassbelly is.

### 4.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 3-1 | The Tunnel Exit | Mossfoot Sentry (Warrior) | A goblin tunnel exit with a broken mine cart | **Regenerate:** Rootbound Guards and Dewkeepers heal in each Start Phase. Kill a Unit in one Turn, or it heals. |
| 3-2 | The Stuck Drill | Drillboss Nub (Warrior) | A goblin drill stuck in the stem of a giant mushroom | **Walls that heal:** Bramble Nests (Wall, Regenerate) with Dewkeepers behind them. |
| 3-3 | The Glowing Pool | Dewdrop Alchemist (Mage) | A pool that glows, with stepping stones | **Poison:** Acorn Tenders, with Mosspitcher Lookouts behind them. Each hit adds a stack, and the stacks hurt in each End Phase. |
| 3-4 | The Rope Bridge | Bridgewarden Fennick (Ranger) | A rope bridge between two giant mushroom caps | **Elf Flying:** Fernwing Couriers, Canopy Skirmishers and an Amberwing Dart (Flying and Poison). |
| 3-5 | The Lantern Post | Lantern Lookout (Ranger) | An elf watch post on a mushroom cap, with lanterns | **Elf Long-range:** Mosspitcher Lookouts (Regenerate) and Thornline Archers behind Bramble Nests, with Venom Arrow. |
| 3-6 | The Goblin Camp | Gig the Hired (Warrior) | A goblin camp with scrap tents under the mushrooms | **Pivot:** Sidestep Shivs and Glade Turnblades hit the Unit behind or next to them first. |
| 3-7 | The Mushroom Ring | Ring Singer (Priest) | A ring of small glowing mushrooms around an old stone | **The grove heals:** Regenerate Units with Prayer of Healing and Cleanse, both for the first time. |
| 3-8 | The Glowing Falls | Falls Warden (Mage) | A small waterfall of glowing water into a cave | **A Lane that stays closed:** the water covers Lane 3 for the full Battle. The Battle has only 2 Lanes. |
| 3-9 | The Root Gate | Glimmerbough's Gatekeeper (Ranger) | An elf gate of woven roots, with a hole that the goblins dug under it | **The final test:** all of the above together. |
| 3-10 | Glimmerbough's Grove Hall | Lady Glimmerbough (Priest) — **Boss** | An elf hall in a ring of giant mushrooms, with a roof of mushroom caps | **The Boss rule and Entangle:** her bodyguard, a Canopy Vinewarden (Epic, Long-range, First Strike, Entangle), is a Start Unit in the middle Lane, behind a Bramble Nest Start Unit. |

### 4.2 Numbers

The columns are the same as in 2.2.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) | Star Turn | 3★ share (no Gear / Expected Gear) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3-1 | 48 | 0 / 0 / 0 / 0 | 18 | — | — | Rootbound Guard (Common) | 10 | 64% / 74% | 5 / 5 / 5 / 5 | 72% / 78% | 21 | 43% / 47% |
| 3-2 | 48 | 0 / 0 / 0 / 0 | 18 | — | — | Bramble Nest (Uncommon) | 10 | 65% / 73% | 6 / 5 / 5 / 5 | 69% / 79% | 21 | 42% / 45% |
| 3-3 | 48 | 0 / 0 / 0 / 0 | 19 | — | — | Acorn Tender (Common) | 11 | 62% / 74% | 6 / 6 / 5 / 5 | 69% / 80% | 21 | 42% / 44% |
| 3-4 | 50 | 0 / 0 / 0 / 0 | 20 | — | — | Fernwing Courier (Common) | 11 | 62% / 71% | 6 / 6 / 6 / 5 | 68% / 77% | 20 | 37% / 38% |
| 3-5 | 48 | 0 / 0 / 0 / 0 | 20 | — | — | Mosspitcher Lookout (Common) | 12 | 62% / 69% | 6 / 6 / 6 / 6 | 70% / 77% | 24 | 42% / 46% |
| 3-6 | 52 | 0 / 0 / 0 / 0 | 20 | — | — | Sidestep Shiv (Uncommon) | 12 | 70% / 70% | 7 / 7 / 7 / 6 | 74% / 78% | 22 | 48% / 49% |
| 3-7 | 54 | 0 / 0 / 0 / 0 | 21 | — | — | Seedwind Shepherd (Rare) | 13 | 65% / 71% | 7 / 7 / 7 / 7 | 72% / 78% | 22 | 35% / 38% |
| 3-8 | 54 | 0 / 0 / 0 / 0 | 21 | Lane 3, closed for the full Battle | — | Canopy Skirmisher (Uncommon) | 13 | 62% / 68% | 8 / 7 / 7 / 7 | 69% / 75% | 23 | 42% / 45% |
| 3-9 | 56 | 0 / 0 / 0 / 0 | 22 | — | — | Elderreed Dartmaster (Rare) | 13 | 60% / 66% | 8 / 8 / 7 / 7 | 70% / 76% | 24 | 37% / 39% |
| 3-10 | 60 | 0 / 0 / 0 / 0 | 23 | — | Canopy Vinewarden (Epic), Lane 2, Column 11 · Bramble Nest (Uncommon), Lane 2, Column 10 | Lethiel, First Gardener (Epic) | 14 | 32% / 36% | 8 / 8 / 8 / 7 | 41% / 49% | 26 | 32% / 32% |


**Retune of 2026-10-24.** The win rates in the table come from a run of `bun rules:sim:check` on 2026-10-24. All rows are on their target. Pack Stalker has 4 HP (it had 5) and Thornline Archer has 5 HP (it had 4), for the Raiders Matchups ([08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). Thornline Archer is in the enemy Decks of 3-3 and 3-5. Changes, Vanguard and Raiders with no Gear, then with the Expected Gear (1000 Battles):

- **3-3:** 2 Mosspitcher Lookouts (C) replace the 2 Thornline Archers. The 3 Acorn Tenders still teach Poison. Before: 54.9% / 69%, then 64% / 77% (a gap of 22 points). Now: 62% / 74%, then 69% / 80%. A Deck may hold only 3 copies of a card, and Dewkeeper cannot be Common (its Base Rank is Uncommon), so other single changes were not possible. Hero HP and Banner tries did not make the gap smaller.
- **3-5:** an Acorn Tender (C) replaces 1 Thornline Archer. Before: 57.7% / 69.1%, then 65.5% / 75.6%. Now: 62% / 69%, then 70% / 77%.

On 2026-10-17, Heroic changed: after a Unit attacks an enemy Unit, it gets +N Attack ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)). Then the AI started to count the Heroic bonus (issue [#109](https://github.com/rifandani/heynbord/issues/109)). Before the retune of 2026-10-24, the win rates in the table came from a new run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` after issue #109. All rows are on their target. The next paragraphs tell the earlier runs.

**Issue #109 (2026-10-17).** The AI now counts the Heroic bonus in the value of a Unit and in the threat and the defense of a Lane (GDD 9). The AI plays both Sides in the sim, so this change moved all rows. The values "before" are after the AI change and before the content changes (1000 Battles). Vanguard and Raiders, with no Gear and then with the Expected Gear. Each change is to the enemy only.

- **3-1:** War Drums is Rare (it was Uncommon), and 1 Bramble Duelist is Rare (both were Uncommon). The Star Turn is 21 (it was 20): with Star Turn 20, the 3-Star share with no Gear was 29.7% (target 30% to 50%). Before: 67% / 77%, then 73% / 82%. Now: 64% / 74%, then 72% / 78%. Other tests: War Drums Rare and 1 Ankle Snatcher Uncommon: 63.9% / 73.2%, then 71.6% / 78.7%. 1 Rootbound Guard Rare and Hero HP 44: 64.3% / 75.2%, then 72.2% / 79.7%. 1 Rootbound Guard Rare only: Vanguard with no Gear 62.0%, Raiders with the Expected Gear 78.7%. Hero HP 56: 62.7% and 79.7% (the same two rows).
- **3-3:** Hero HP 48 (it was 50), and 1 Bramble Duelist is Uncommon (both were Common). Before: 64% / 76%, then 72% / 82%. Now: 62% / 72%, then 69% / 79%. Other tests (Vanguard with no Gear, Raiders with the Expected Gear): 1 Bramble Duelist Uncommon only: 60.7%, 78.3%. Fireball Uncommon: 60.7%, 78.5%. Hero HP 58: 62.3%, 80.5%.
- **3-6:** 1 Fuse Runner is Rare (both were Uncommon). Before: 71% / 74%, then 77% / 80%, and the 3-Star share with the Expected Gear was 50.2%. Now: 70% / 70%, then 74% / 78%. Other tests: Armor 2: 70.3% / 73.2%, then 76.8% / 79.9%. Spear Throw Uncommon: Vanguard with no Gear 67.7%, Raiders with the Expected Gear 76.2%. 1 Sidestep Shiv Epic: 66.2% and 77.6%.
- **3-10:** Hero HP 60 (it was 64), and the Fernwing Courier is Uncommon (it was Common). Before: 33% / 39%, then 41% / 54%. Now: 32% / 36%, then 41% / 49%. Stage 3-10 keeps the largest enemy Hero HP of Region 3. Other tests: Weapon 4: 30.8% / 36.4%, then 39.7% / 48.0%. Weapon 4 and Hero HP 60: 31.9% / 37.2%, then 41.2% / 49.4%. 1 Mosspitcher Lookout Uncommon: Vanguard with no Gear 26.8%, Raiders with the Expected Gear 43.3%.

All win rates come from one run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` on 2026-10-15, after the rule for Ranged Unit Movement and its retune (issue [#96](https://github.com/rifandani/heynbord/issues/96)): a Ranged Unit now stops in the first empty Square from which it has a target in its Range. All rows are on their target, with no Gear and with the Expected Gear, so the CI balance gate passes. No Stage of this Region changed for it.

Before issue #96, the win rates came from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-15, when the Region 3 Stages were added. All rows of Regions 1 to 3 are on their target, with no Gear and with the Expected Gear. Over 2000 Battles, Vanguard and Raiders win 63% / 74% and 70% / 79% of 3-1, and 35% / 39% and 45% / 49% of 3-10. The economy sim (Economy 7.1) gives the same result as before, because the Coin, XP and Forge Stones of a Stage come only from its Region and its Boss flag.

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
| 3-1 | 3× Rootbound Guard (U), 2× Dewkeeper (U), 1× Bramble Duelist (R), 1× Bramble Duelist (U), 1× Ankle Snatcher (U), 1× Ankle Snatcher (C), 2× Tunnel Saboteur (C), 1× Scrap Plate Guard (R), 1× Scrap Plate Guard (U), 1× Junk Slinger (U), 1× Junk Slinger (C), 1× Fuse Runner (C), 1× Shield Bash (C), 1× War Drums (R) |
| 3-2 | 2× Bramble Nest (U), 2× Rootbound Guard (U), 2× Junk Slinger (U), 2× Bomb Lobber (U), 2× Tunnel Saboteur (C), 1× Bramble Duelist (U), 1× Bramble Duelist (C), 1× Junk Barricade (U), 2× Dewkeeper (U), 2× Ankle Snatcher (C), 1× Shield Wall (C) |
| 3-3 | 3× Acorn Tender (C), 2× Mosspitcher Lookout (C), 2× Rootbound Guard (C), 1× Bramble Duelist (U), 1× Bramble Duelist (C), 2× Scrap Plate Guard (C), 2× Ankle Snatcher (U), 1× Tunnel Saboteur (C), 1× Fuse Runner (C), 1× Dewkeeper (U), 1× Frost Bolt (C), 1× Fireball (C), 1× Frost Shards (C) |
| 3-4 | 3× Fernwing Courier (U), 2× Canopy Skirmisher (U), 1× Amberwing Dart (R), 2× Rootbound Guard (C), 2× Bramble Duelist (C), 2× Acorn Tender (U), 2× Ankle Snatcher (C), 1× Junk Slinger (U), 1× Junk Slinger (C), 1× Scrap Plate Guard (U), 1× Warning Shot (C), 1× Harrying Shot (C), 1× Pinning Shot (C) |
| 3-5 | 3× Mosspitcher Lookout (C), 3× Bramble Duelist (C), 1× Thornline Archer (U), 1× Acorn Tender (C), 2× Bramble Nest (U), 2× Rootbound Guard (C), 2× Scrap Plate Guard (C), 1× Ankle Snatcher (C), 1× Tunnel Saboteur (C), 1× Venom Arrow (R), 1× Pinning Shot (C), 1× Warning Shot (C), 1× Quick Shot (C) |
| 3-6 | 3× Sidestep Shiv (R), 2× Glade Turnblade (R), 2× Scrap Plate Guard (U), 2× Ankle Snatcher (U), 2× Tunnel Saboteur (U), 1× Fuse Runner (R), 1× Fuse Runner (U), 1× Grease Trapper (U), 1× Junk Walker (R), 1× Bomb Lobber (U), 1× Rocket Barrel Rider (U), 1× Mosspitcher Lookout (C), 1× Spear Throw (C), 1× War Drums (U) |
| 3-7 | 1× Seedwind Shepherd (R), 2× Dewkeeper (U), 2× Rootbound Guard (U), 1× Rootbound Guard (C), 2× Mosspitcher Lookout (C), 2× Bramble Duelist (C), 2× Acorn Tender (C), 1× Bramble Nest (U), 2× Scrap Plate Guard (C), 1× Junk Slinger (C), 1× Prayer of Healing (U), 1× Cleanse (R), 2× Mend (C), 1× Smite (C) |
| 3-8 | 2× Canopy Skirmisher (U), 2× Fernwing Courier (U), 2× Thornline Archer (U), 2× Rootbound Guard (U), 2× Bramble Duelist (U), 1× Glade Turnblade (U), 2× Scrap Plate Guard (C), 2× Tunnel Saboteur (C), 1× Grease Trapper (U), 1× Bomb Lobber (U), 1× Junk Walker (R), 1× Frost Bolt (C), 1× Arc Lightning (U), 1× Spark (C) |
| 3-9 | 1× Elderreed Dartmaster (R), 1× Fernwing Courier (C), 1× Seedwind Shepherd (R), 1× Canopy Skirmisher (U), 1× Thornline Archer (U), 1× Mosspitcher Lookout (C), 1× Acorn Tender (C), 1× Dewkeeper (U), 2× Rootbound Guard (C), 1× Bramble Nest (U), 1× Glade Turnblade (U), 1× Bramble Duelist (C), 1× Sidestep Shiv (U), 2× Scrap Plate Guard (C), 1× Tunnel Saboteur (C), 1× Ankle Snatcher (C), 1× Grease Trapper (U), 1× Harrying Shot (C), 1× Pinning Shot (C), 1× Quick Shot (C) |
| 3-10 | 1× Lethiel, First Gardener (E), 3× Bramble Duelist (C), 1× Fernwing Courier (U), 2× Ankle Snatcher (C), 3× Mosspitcher Lookout (C), 2× Rootbound Guard (C), 2× Acorn Tender (C), 1× Glade Turnblade (U), 1× Junk Walker (R), 1× Grease Trapper (U), 1× Tunnel Saboteur (C), 2× Mend (C), 1× Smite (C), 1× Bramble Nest (U), 1× Dewkeeper (U) |

## 5. Region 4: The Thornwood

A deep, old forest of giant trees and thorn hedges (GDD 3.3). The Elves of the Thornwood keep **the Old Bramble** asleep: a forest giant that sleeps on a hill of brambles. When it wakes, the Feral creatures of the caves under the roots wake with it. Then the Player comes out of the Glowcap Hollows with Lethiel, First Gardener. The Thornwood Elves think that the Player took her, so they block the forest road and call the Feral creatures to fight. The noise of the Battles wakes the Old Bramble, and it wakes up angry. Region 4 is the Debut of the Feral: Trample is new to the enemies.

- **No ramp.** The target of each normal Stage is 60% to 80%, and of the Boss Stage 30% to 50%, with no Gear and with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
- **Only Elves and the forest Feral.** The enemy Decks use Elf cards, Feral cards and Skill Cards, and no Human, Orc or Goblin card. Region 4 uses only the 9 Feral cards of the forest and the caves: Bristleback Boar, Crag Lizard, Cave Bear, Web Spitter, Boulder Tortoise, Tailsweep Basilisk, Cave Troll, Crag Rhino and Mountain Colossus. The 6 Feral cards of the cold (Frostfang Lynx, Frost Elk Matriarch, Avalanche Yeti, Woolly Mammoth, Rimebreath Drake and Old Frostmaw) are for Region 5, where the frost beasts live ([12 — Region Concepts, 2.5](./12-region-concepts.md#25-the-hollow-marches)). Thus Bleed is not in Region 4.
- **Skill Cards.** The enemy Decks can use the Skill Cards of all 4 Classes (see 1). Region 4 shows 4 Skill Cards to the enemies for the first time: Expose Weakness, Call to Arms, Penance and Cleave.
- **The landmarks were painted first.** The Region Map was made before the Stages, with the proposed landmarks of [12 — Region Concepts, 2.4](./12-region-concepts.md#24-the-thornwood). Each Stage takes the place of its painted landmark, so the painting does not change. The Stage names are not the same as the names of Region 3, also when the landmark is of the same type (a rope bridge, a ring of mushrooms, a waterfall).
- **First-win cards.** The cards are mixed, so that they help both Starter Decks: 4-1 Bristleback Boar (C), 4-2 Cave Bear (C), 4-3 Crag Lizard (C), 4-4 Crag Rhino (U), 4-5 Web Spitter (C), 4-6 Boulder Tortoise (U), 4-7 Tailsweep Basilisk (U), 4-8 Cave Troll (U), 4-9 Amberwing Dart (R) and 4-10 Mountain Colossus (E). Each forest Feral card is a first-win card. When the Old Bramble goes back to sleep, its Mountain Colossus goes with the Player.
- **No Boss card.** The Old Bramble has no card. Each Race has 15 cards ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)), and the Feral Epic cards are Mountain Colossus and Old Frostmaw. Thus the Old Bramble is only a Hero, as Baron Brassbelly and Lady Glimmerbough are.

### 5.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 4-1 | The Leaning Gate | Hedgewarden Sorrel (Warrior) | A forest gate of two leaning trees | **Trample:** Bristleback Boars and Crag Rhinos. When a Trample Unit kills a Unit, the damage that is left hits the Unit behind it. Do not put Units in a line in front of them. |
| 4-2 | The Lantern Tree | Lamplighter Teasel (Priest) | An elf tree with lanterns | **The cave beasts:** Cave Bears and Cave Trolls (Heavy, Regenerate 2) with Mend behind them. A large Unit that heals 2 in each Start Phase. |
| 4-3 | The Toadstool Ring | Puffcap Vetch (Warrior) | A ring of large mushrooms | **Exposed:** Expose Weakness for the first time. Each Physical hit on an Exposed Unit deals more damage, also Trample damage. |
| 4-4 | The Ravine Bridge | Ropewarden Alder (Ranger) | A rope bridge over a ravine | **Two Closed Lanes:** only the middle Lane crosses the ravine. Lanes 1 and 3 open on Turn 5. All Units fight in one Lane, where Trample is strong. |
| 4-5 | The Web Cave | Old Silkmother (Ranger), a giant spider | A dark cave mouth under giant roots, with a big web across it | **Feral Long-range:** Web Spitters (Long-range, Regenerate), with Pinning Shot. |
| 4-6 | The Standing Stones | Stonesinger Bryony (Mage) | A ring of mossy standing stones | **Feral Walls:** Boulder Tortoises (Wall, Bulwark 1, Regenerate 2). Physical damage does little to them. Use Fire, Frost or another Lane. |
| 4-7 | The Treetop Village | Elder Hawthorn (Warrior) | An elf village of tree houses | **Call to Arms** for the first time: all enemy Units in a Lane get +4 Attack for one Turn. |
| 4-8 | The Still Pool | Poolkeeper Willow (Priest) | A waterfall and a pool | **Penance** for the first time: Holy damage to a Unit, equal to the Attack of that Unit. A Unit with a high Attack is a target. |
| 4-9 | The Broken Hedge | The Old Bramble's Hedgekeeper (Ranger) | A thorn hedge wall with a hole broken in it | **The final test:** Trample, the cave beasts, Web Spitters and Pivot together, with Ranger Skill Cards. |
| 4-10 | The Bramble Hill | The Old Bramble (Warrior) — **Boss** | The Old Bramble: a forest giant that sleeps on a hill of brambles. It looks like a huge old tree with a face in the bark. One eye is half open. | **The bodyguard and Cleave:** a Mountain Colossus (Epic, Heavy, Regenerate 2, Trample) is a Start Unit in Lane 3, next to a Bramble Nest Start Unit in Lane 1. A Heavy Unit does not start behind a Wall, because a Wall never moves and the Heavy Unit could never pass it. The Old Bramble plays Cleave for the first time. |

### 5.2 Numbers

The columns are the same as in 2.2.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) | Star Turn | 3★ share (no Gear / Expected Gear) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4-1 | 58 | 0 / 0 / 0 / 0 | 23 | — | — | Bristleback Boar (Common) | 15 | 63% / 65% | 8 / 8 / 8 / 8 | 73% / 74% | 25 | 43% / 47% |
| 4-2 | 52 | 0 / 0 / 0 / 0 | 23 | — | — | Cave Bear (Common) | 15 | 63% / 64% | 9 / 8 / 8 / 8 | 71% / 76% | 24 | 39% / 43% |
| 4-3 | 60 | 0 / 0 / 0 / 0 | 24 | — | — | Crag Lizard (Common) | 16 | 65% / 66% | 9 / 9 / 8 / 8 | 75% / 77% | 26 | 40% / 45% |
| 4-4 | 64 | 0 / 0 / 0 / 0 | 24 | Lane 1, opens on Turn 5 · Lane 3, opens on Turn 5 | — | Crag Rhino (Uncommon) | 16 | 60% / 66% | 9 / 9 / 9 / 8 | 73% / 76% | 25 | 33% / 38% |
| 4-5 | 62 | 0 / 0 / 0 / 0 | 25 | — | — | Web Spitter (Common) | 17 | 62% / 62% | 9 / 9 / 9 / 9 | 74% / 75% | 26 | 45% / 44% |
| 4-6 | 46 | 0 / 0 / 0 / 0 | 25 | — | — | Boulder Tortoise (Uncommon) | 17 | 62% / 66% | 10 / 10 / 10 / 9 | 75% / 78% | 25 | 42% / 45% |
| 4-7 | 62 | 0 / 0 / 0 / 0 | 25 | — | — | Tailsweep Basilisk (Uncommon) | 17 | 66% / 66% | 10 / 10 / 10 / 10 | 79% / 79% | 26 | 38% / 42% |
| 4-8 | 50 | 0 / 0 / 0 / 2 | 27 | — | — | Cave Troll (Uncommon) | 18 | 61% / 71% | 10 / 10 / 10 / 10 | 72% / 79% | 24 | 40% / 43% |
| 4-9 | 54 | 0 / 0 / 0 / 0 | 26 | — | — | Amberwing Dart (Rare) | 18 | 62% / 68% | 10 / 10 / 10 / 10 | 73% / 78% | 26 | 36% / 42% |
| 4-10 | 66 | 2 / 0 / 0 / 0 | 28 | — | Mountain Colossus (Epic), Lane 3, Column 11 · Bramble Nest (Uncommon), Lane 1, Column 10 | Mountain Colossus (Epic) | 19 | 29% / 41% | 10 / 10 / 10 / 10 | 42% / 54% | 28 | 24% / 26% |


**Retune of 2026-10-24.** The win rates in the table come from a run of `bun rules:sim:check` on 2026-10-24. All rows are on their target. Pack Stalker has 4 HP (it had 5) and Thornline Archer has 5 HP (it had 4), for the Raiders Matchups ([08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). Thornline Archer is in the enemy Decks of 4-5, 4-6 and 4-10, and a Boss Stage now has a window for each Gear row: 25% to 50% with no Gear, and 30% to 55% with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)). Changes, Vanguard and Raiders with no Gear, then with the Expected Gear (1000 Battles):

- **4-5:** an Acorn Tender (C) and a Mosspitcher Lookout (C) replace the 2 Thornline Archers. Before: 58.0% / 57.1%, then 70.2% / 70.1%. Now: 62% / 62%, then 74% / 75%. A lower Hero HP alone put the 3-Star share above 50%.
- **4-6:** an Acorn Tender (C) replaces 1 Thornline Archer, and Hero HP 46 (it was 50). Before: 56.8% / 63.4%, then 68.7% / 73.9%. Now: 62% / 66%, then 75% / 78%.
- **4-10 (Boss):** the 2 Cave Bears are Common (they were Uncommon). Before: 22.7% / 33.1%, then 33.8% / 46.1%. Now: 29% / 41%, then 42% / 54%. The Boss must keep the largest Hero HP of the Region (64 on 4-4), so the Hero HP cannot go down. A Common Boulder Tortoise pair, a Rare Colossus, or Weapon 0 did not put all rows on target. This closes the open row of the Heavy bodyguard fix.

On 2026-10-17, Heroic changed: after a Unit attacks an enemy Unit, it gets +N Attack ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)). Then the AI started to count the Heroic bonus (issue [#109](https://github.com/rifandani/heynbord/issues/109)). Before the retune of 2026-10-24, the win rates in the table came from a new run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` after issue #109. All rows are on their target, except the Vanguard row of 4-10 with no Gear after the Heavy bodyguard fix (see below). The next paragraphs tell the earlier runs.

**The Heavy bodyguard (2026-10-20).** A Heavy Unit has Speed 1, so it cannot pass a friendly Wall: a Wall never moves, and the Unit needs 2 steps to pass its Square. The Mountain Colossus of 4-10 started behind the Bramble Nest, so it could not move until the Player killed the Wall. The Colossus now starts in Lane 3, and the Bramble Nest is in Lane 1. The Colossus is active from the first Turn, so the Stage is harder: Vanguard with no Gear wins 27.5% (target 30%), and the other 3 rows are on target. A retune or a decision is open for this row. A content test now checks every Start Unit of every Stage, Floor and Dungeon against this rule.

**Issue #109 (2026-10-17).** The AI now counts the Heroic bonus in the value of a Unit and in the threat and the defense of a Lane (GDD 9). The AI plays both Sides in the sim, so this change moved all rows. The values "before" are after the AI change and before the content changes (1000 Battles). Vanguard and Raiders, with no Gear and then with the Expected Gear. Each change is to the enemy only.

- **4-2:** 1 Crag Lizard is Uncommon (both were Common). Before: 70% / 70%, then 78% / 80%. Now: 70% / 69%, then 77% / 78%. Other tests: Armor 2: 69.5% / 68.9%, then 76.9% / 79.4%. 1 Dewkeeper Rare: Vanguard with no Gear 64.1%, Raiders with the Expected Gear 72.8%. Weapon 4: 67.7% and 77.1%.
- **4-8:** Hero HP 50 (it was 54), and 1 Fernwing Courier is Uncommon (the 3 were Common). Before: 61% / 71%, then 73% / 80%. Now: 61% / 71%, then 72% / 79%. Other tests: the Uncommon Fernwing Courier and Hero HP 52: 60.6% / 69.5%, then 71.9% / 78.4%. Banner 6 and Hero HP 52: 61.6% / 70.3%, then 72.6% / 79.3%. Armor 2: 60.6% / 69.5%, then 72.9% / 79.4%.
- **4-10:** 1 Bristleback Boar is Uncommon (the 3 were Common). Before: 34% / 39%, then 42% / 52%. Now: 31% / 37%, then 42% / 48%. Other tests: 1 Fernwing Courier Uncommon: Vanguard with no Gear 31.6%, Raiders with the Expected Gear 49.0%. Hero HP 68, Armor 2, a Rare Boulder Tortoise and an Uncommon Shield Bash: 31.1% / 36.1%, then 41.4% / 48.8%.

All win rates come from one run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` on 2026-10-15, after the rule for Ranged Unit Movement and its retune (issue [#96](https://github.com/rifandani/heynbord/issues/96)): a Ranged Unit now stops in the first empty Square from which it has a target in its Range. All rows are on their target, with no Gear and with the Expected Gear, so the CI balance gate passes.

The rule changed the win rates of each Stage. These Stages missed their target after the rule and changed (1000 Battles, Vanguard and Raiders, with no Gear and then with the Expected Gear). Each change is to the enemy strength only (see 1): no enemy Deck card, first-win card, Start Unit or Closed Lane changes, and the Deck sizes do not change.

- **4-1:** 1 Rootbound Guard is Uncommon (both were Common). Before: 70.2% / 71.8%, then 80.2% / 78.4%. Now: 65% / 66%, then 74% / 74%. Other tests: Hero HP 59 to 61 lowered Vanguard with the Expected Gear only to 80.1% to 79.8%.
- **4-3:** 1 Crag Lizard is Rare (all 3 were Uncommon). Before: 72.7% / 68.9%, then 81.7% / 79.4%. Now: 64% / 65%, then 76% / 76%. Other tests: Hero HP 61 to 63 gave Vanguard 81.5% to 81.3% with the Expected Gear.
- **4-8:** Hero HP 54 (it was 56) and Gear 0 / 0 / 0 / 2 (it was 0 / 0 / 0 / 0). Before: 59.7% / 68.0%, then 72.2% / 79.4%. Now: 61% / 70%, then 73% / 79%. Other tests: Hero HP 55 gave 60.3% / 68.6%, then 72.5% / 79.9%. Hero HP 53 gave Raiders 80.7% with the Expected Gear. The Banner Gear alone gave 60.5% / 68.4%, then 72.0% / 78.6%.
- **4-10 (Boss):** Gear 2 / 0 / 0 / 0 (it was 0 / 0 / 0 / 0), and the Uncommon Bristleback Boar is Common. Before: 30.6% / 39.4%, then 42.3% / 50.6%. Now: 33% / 39%, then 42% / 49%. The Weapon Gear lowers Raiders with the Expected Gear more than Vanguard with no Gear. The Common Boar then gives both Decks back some points. Other tests: Hero HP 65, 67 and 68 gave Raiders 50.8%, 50.3% and 50.1% with the Expected Gear. The Weapon Gear alone gave 30.6% / 37.3%, then 39.7% / 46.6%. Hero HP stays 66, so the Boss keeps the largest Hero HP of Region 4.

Before issue #96, the win rates came from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-15, when the Region 4 Stages were added. All rows of Regions 1 to 4 are on their target, with no Gear and with the Expected Gear. Over 2000 Battles, Vanguard and Raiders win 31% / 37% and 42% / 49% of 4-10. Over 3000 Battles, they win 31% / 36% and 42% / 49%.

Notes from the first tuning:

- **The expected Deck is full.** From level 15, the expected Deck is at the maximum Deck size with the Starter Deck and the first-win cards of Regions 1 to 3. Thus no Region 4 first-win card goes into it, and a change to a Region 4 first-win card does not change the later Region 4 win rates.
- **Gear adds more.** The Expected Gear is 8 to 10 (Region 3: 5 to 8). It adds about 9 to 13 points to a normal Stage. Thus each normal Stage must stay at about 62% to 70% with no Gear.
- **The first Decks were too hard.** With most copies one Rank above the Base Rank, Vanguard and Raiders won 2% to 39% of the normal Stages (100 Battles). With each copy at its Base Rank, they won 93% / 86% of 4-1, but only 35% / 40% of 4-5 and 25% / 36% of 4-9 (200 Battles). The Feral Units with Regenerate 2 and the Web Spitters made the late Stages hard. Thus these Decks have fewer Cave Trolls and Web Spitters, and more Bramble Duelists and Fernwing Couriers. Each Stage kept its new thing and its first-win card.
- **Hero HP does little.** As in Region 2, a change of Hero HP moves the win rate by only a few points. The enemy Gear stays 0 / 0 / 0 / 0, and it is a reserve for a later re-tune.
- **More cards make a Stage harder.** A copy that goes into a Deck to reach the Deck size can move the win rate more than a Rank change. 4-5 had 23 cards. A third Crag Lizard and a Mosspitcher Lookout took Vanguard from 64% to 45% (200 Battles). Thus weak cards (Fernwing Couriers and Ranger Skill Cards) filled the Deck.
- **4-8 (The Still Pool).** Raiders won about 6 points more than Vanguard. With Mend, Raiders won 80% with the Expected Gear (2000 Battles). Sanctuary in place of Mend gave 77% (1000 Battles).
- **4-10 (Boss).** The Boss target is 20 points wide. Gear added 10 to 16 points to the Boss Stage, and Raiders won about 7 points more than Vanguard in most tests. Thus the first Boss Decks could not hit the target with both Decks. Three changes closed the gap:
  - The Bramble Nest Start Unit is in the middle Lane in front of the Colossus, as in Region 3. With Bramble Nests in Lanes 1 and 3, Raiders won 5 to 7 points more than Vanguard. With the Nest in the middle Lane, Raiders won 3 to 4 points more (3000 Battles). (The Colossus moved out from behind the Nest on 2026-10-20; see 5.2.)
  - 2 Acorn Tenders (Holy damage) replace the Mosspitcher Lookouts. Then the Expected Gear added 12 points to Vanguard (it was 14), and 13 points to Raiders (3000 Battles). A possible reason: a Unit cannot Block Holy damage, so the Banner Gear adds less.
  - Shield Bash replaces Ground Slam. Ground Slam hit Vanguard more than Raiders: without it, Vanguard won 6 points more and Raiders 3 points more (1000 Battles).
  
  Hero HP 66 keeps the Boss the largest of Region 4. The margins of the Boss are small: Vanguard wins 31% with no Gear, and Raiders 48% with the Expected Gear.

### 5.3 Enemy Decks

| Stage | Deck |
| --- | --- |
| 4-1 | 3× Bristleback Boar (U), 2× Crag Rhino (U), 2× Cave Bear (U), 2× Crag Lizard (C), 3× Bramble Duelist (U), 1× Rootbound Guard (U), 1× Rootbound Guard (C), 2× Mosspitcher Lookout (C), 2× Fernwing Courier (C), 1× Thornline Archer (U), 1× Glade Turnblade (U), 1× Shield Bash (C), 1× Spear Throw (C), 1× War Drums (U) |
| 4-2 | 3× Cave Bear (C), 2× Cave Troll (U), 1× Crag Lizard (U), 1× Crag Lizard (C), 1× Bristleback Boar (C), 2× Mosspitcher Lookout (C), 2× Thornline Archer (U), 2× Dewkeeper (U), 2× Bramble Duelist (C), 2× Acorn Tender (C), 2× Mend (C), 1× Blessing of Light (C), 1× Radiant Strike (C), 1× Smite (C) |
| 4-3 | 2× Expose Weakness (R), 1× Crag Lizard (R), 2× Crag Lizard (U), 2× Bristleback Boar (U), 2× Crag Rhino (U), 2× Cave Bear (C), 3× Bramble Duelist (U), 1× Glade Turnblade (U), 1× Glade Turnblade (R), 2× Rootbound Guard (C), 2× Acorn Tender (C), 2× Mosspitcher Lookout (C), 1× Shield Bash (C), 1× Shoulder Charge (C) |
| 4-4 | 2× Crag Rhino (U), 1× Crag Rhino (R), 2× Bristleback Boar (C), 2× Cave Troll (U), 2× Crag Lizard (C), 2× Canopy Skirmisher (U), 2× Fernwing Courier (C), 2× Thornline Archer (U), 2× Mosspitcher Lookout (C), 1× Rootbound Guard (C), 1× Quick Shot (C), 1× Warning Shot (C), 1× Harrying Shot (C), 1× Skybreaker (U), 2× Bramble Duelist (U) |
| 4-5 | 3× Web Spitter (C), 1× Tailsweep Basilisk (U), 2× Bristleback Boar (C), 1× Crag Rhino (U), 1× Acorn Tender (C), 1× Mosspitcher Lookout (C), 1× Dewkeeper (U), 1× Pinning Shot (C), 2× Quick Shot (C), 3× Bramble Duelist (C), 1× Rootbound Guard (C), 3× Fernwing Courier (C), 2× Warning Shot (C), 1× Crag Lizard (C), 2× Harrying Shot (C) |
| 4-6 | 3× Boulder Tortoise (U), 2× Crag Rhino (U), 2× Bristleback Boar (C), 2× Mosspitcher Lookout (C), 1× Thornline Archer (U), 3× Acorn Tender (C), 1× Dewkeeper (U), 1× Frost Bolt (C), 1× Fireball (C), 1× Frost Shards (C), 1× Arc Lightning (U), 1× Frost Wave (U), 1× Web Spitter (C), 3× Bramble Duelist (C), 2× Fernwing Courier (C) |
| 4-7 | 2× Call to Arms (R), 2× Tailsweep Basilisk (U), 1× Tailsweep Basilisk (R), 2× Bristleback Boar (U), 2× Crag Rhino (U), 2× Cave Bear (U), 2× Glade Turnblade (U), 2× Canopy Skirmisher (U), 2× Rootbound Guard (C), 2× Mosspitcher Lookout (C), 1× Seedwind Shepherd (R), 1× Shield Bash (C), 1× War Drums (U), 1× Spear Throw (C), 1× Bramble Duelist (C), 1× Bramble Duelist (U) |
| 4-8 | 2× Penance (U), 2× Cave Bear (C), 2× Crag Rhino (U), 2× Dewkeeper (U), 2× Acorn Tender (C), 2× Mosspitcher Lookout (C), 1× Rootbound Guard (U), 2× Rootbound Guard (C), 1× Seedwind Shepherd (R), 1× Prayer of Healing (U), 1× Smite (C), 1× Boulder Tortoise (U), 2× Bramble Duelist (C), 1× Cave Troll (U), 1× Web Spitter (C), 1× Fernwing Courier (U), 2× Fernwing Courier (C), 1× Sanctuary (U) |
| 4-9 | 2× Bristleback Boar (C), 2× Crag Rhino (U), 1× Cave Bear (C), 1× Cave Troll (U), 1× Crag Lizard (C), 1× Tailsweep Basilisk (U), 1× Amberwing Dart (R), 2× Mosspitcher Lookout (C), 1× Rootbound Guard (C), 1× Canopy Skirmisher (U), 1× Glade Turnblade (U), 1× Dewkeeper (U), 1× Pinning Shot (C), 1× Quick Shot (C), 1× Harrying Shot (C), 1× Warning Shot (C), 1× Web Spitter (C), 3× Bramble Duelist (C), 1× Thornline Archer (U), 2× Fernwing Courier (C) |
| 4-10 | 1× Mountain Colossus (E), 2× Crag Rhino (U), 1× Crag Rhino (R), 1× Bristleback Boar (U), 2× Bristleback Boar (C), 2× Cave Bear (C), 2× Boulder Tortoise (U), 2× Crag Lizard (C), 1× Tailsweep Basilisk (U), 2× Thornline Archer (U), 1× Rootbound Guard (C), 3× Bramble Duelist (C), 1× Fernwing Courier (C), 1× Cleave (U), 1× Call to Arms (R), 1× Expose Weakness (R), 1× Shield Wall (C), 1× Shield Bash (C), 1× Acorn Tender (C), 1× Acorn Tender (U) |

## 6. Region 5: The Hollow Marches

Wide marshes with mist, reeds and old dead trees (GDD 3.3). **Queen Marrow** rules the Undead here from her castle on an island. When the Old Bramble woke up, the noise woke the frost beasts in the ice caves of the hills, and they came down into the marsh. Then the Player comes out of the Thornwood with a Mountain Colossus. Queen Marrow thinks that the Player sent the beasts, so her court stops the Player at each crossing of the marsh. Region 5 is the Debut of the Undead: Swarm, Summon and Rebirth are new to the enemies. Bleed is also new: it comes with the frost beasts. Region 5 is the last Region of the Campaign. The first win of its Boss Stage unlocks Heynspire ([ADR-0034](../adr/0034-the-campaign-has-5-regions-and-each-region-adds-one-race.md)).

- **No ramp.** The target of each normal Stage is 60% to 80%, and of the Boss Stage 30% to 50%, with no Gear and with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).
- **Only Undead and Feral.** The enemy Decks use Undead cards, Feral cards and Skill Cards, and no Human, Orc, Goblin or Elf card. Feral is the newest Race of Region 4, so the first Stages also use the Feral cards of the forest. The 6 Feral cards of the cold (Frostfang Lynx, Frost Elk Matriarch, Avalanche Yeti, Woolly Mammoth, Rimebreath Drake and Old Frostmaw) are the frost beasts of the marsh. A Cave Troll is the bog troll of 5-3. Each of the 15 Undead cards and each Feral card of the cold is in an enemy Deck, so each one is in a Stage card pool.
- **Skill Cards.** The enemy Decks can use the Skill Cards of all 4 Classes (see 1). Region 5 shows 7 Skill Cards to the enemies for the first time: Barbed Arrow, Unbroken Vow, Ground Slam, Wildfire, Thunderstorm, Hunter's Focus and Blizzard. Aegis of Dawn, Rain of Arrows and Onslaught are in no enemy Deck. They are Epic, and an Epic Skill Card in an enemy Hand changes a win rate by too much for a fine tune.
- **The landmarks were painted first.** The Region Map was made before the Stages, with the proposed landmarks of [12 — Region Concepts, 2.5](./12-region-concepts.md#25-the-hollow-marches). Each Stage takes the place of its painted landmark, so the painting does not change. The Stage names are not the same as the names of the earlier Regions (3-5 is the Lantern Post, so 5-1 is the Crooked Post).
- **First-win cards.** The cards are mixed, so that they help both Starter Decks: 5-1 Rattleknife (C), 5-2 Grave Bell Tender (C), 5-3 Frostfang Lynx (C), 5-4 Coffin-Lid Skater (C), 5-5 Coffin Lancer (R), 5-6 Rime-Eye Reaper (U), 5-7 Lantern Widow (R), 5-8 Frost Elk Matriarch (U), 5-9 Ossuary Piper (U) and 5-10 Bone Rampart (E). Queen Marrow sees that the frost beasts came down on their own. After 300 quiet years in her castle, she likes a good fight. She gives the Player a Bone Rampart from her castle wall, and she points to Heynspire.
- **No Boss card.** Queen Marrow has no card. Each Race has 15 cards ([ADR-0013](../adr/0013-v1-has-90-creature-cards.md)), and the Undead Epic cards are Sir Odo, the Last Taxman and Bone Rampart. Thus Queen Marrow is only a Hero, as the Old Bramble is.
- **No Boss Rule.** Queen Marrow is the last Boss of the Campaign, but she has no Boss Rule. In v1, only Dungeon Bosses use Boss Rules, and the Campaign Boss Stages use the Stage data only ([ADR-0038](../adr/0038-a-boss-rule-is-a-one-time-hp-threshold-with-a-fixed-effect-list.md)).

### 6.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 5-1 | The Crooked Post | Postwarden Grimsby (Warrior) | A crooked sign post with a lantern (no letters) | **Swarm:** Rattleknives, Graveyard Drudges and Chattering Cohorts get more Attack while another friendly Unit is in their Lane. Many cheap Units hit harder together. |
| 5-2 | The Sunken Chapel | Sexton Mildew (Priest) | A sunken chapel | **Summon:** each Grave Bell Tender and Hushbow (Long-range) brings a Skeleton Token. Kill the Tokens, or they fill the Lane. |
| 5-3 | The Frozen Bog | Bogtrapper Shiver (Ranger) | A frozen bog pool, with a bog troll asleep in the ice | **Bleed:** Frostfang Lynxes and Barbed Arrow make a Unit Bleeding. A Bleeding Unit gets half of each heal. |
| 5-4 | The Long Boardwalk | Captain Creakbones (Warrior) | A long boardwalk over a bog | **Ground Slam** for the first time: damage to all Units in a Lane, while the Undead riders (Pale Gallopers and Coffin-Lid Skaters) charge along the boardwalk. Do not put many small Units in one Lane. |
| 5-5 | The Leaning Graves | Gravekeeper Mould (Priest) | A small graveyard with leaning stones | **Rebirth:** Coffin Lancers come back the first time that they die. **Unbroken Vow** for the first time: Steadfast keeps a Unit at 1 HP. |
| 5-6 | The Broken Windmill | Miller Dustwhistle (Mage) | A broken windmill on a mound | **Wildfire** and **Thunderstorm** for the first time: Fire damage on an area for 2 Turns, and Lightning on 3 random Units. Do not put all Units close together. |
| 5-7 | The Bone Ferry | Ferryman Charn (Ranger) | A ferry with a skeleton ferryman | **Frost from the air:** Lantern Widows bring Restless Wisps (Flying, Frost), with Rimebreath Drakes. **Hunter's Focus** for the first time: a Melee Unit attacks as a Ranged Unit for a short time. |
| 5-8 | The Ice Cave | Rimeherd Ulla (Warrior) | An ice cave in a hill, with a frost beast at its mouth and frost on the rocks | **The great frost beasts:** Woolly Mammoths, Avalanche Yetis and Old Frostmaw (Epic, Trample, Bleed 2), with the Rally of Frost Elk Matriarchs. |
| 5-9 | The Witchfire Bridge | The Queen's Tollkeeper (Ranger) | An old stone bridge with green fire bowls | **The final test:** Swarm, Summon, Rebirth, Bleed and the frost beasts together, with Ranger Skill Cards. Sir Odo, the Last Taxman, takes the toll. |
| 5-10 | Marrow Castle | Queen Marrow (Mage) — **Boss** | The castle of Queen Marrow on an island: pale bone-white stone, thin towers, violet banners, soft green light in the windows | **The bodyguard and Blizzard:** a Bone Rampart (Epic, Wall, Bulwark 2, Rebirth) is a Start Unit in the middle Lane, with a Hushbow Start Unit behind it. Queen Marrow plays Blizzard for the first time. |

### 6.2 Numbers

The columns are the same as in 2.2.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) | Star Turn | 3★ share (no Gear / Expected Gear) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5-1 | 60 | 0 / 0 / 0 / 0 | 28 | — | — | Rattleknife (Common) | 20 | 63% / 68% | 10 / 10 / 10 / 10 | 73% / 79% | 29 | 41% / 49% |
| 5-2 | 56 | 0 / 0 / 0 / 0 | 28 | — | — | Grave Bell Tender (Common) | 20 | 66% / 69% | 10 / 10 / 10 / 10 | 79% / 80% | 28 | 37% / 42% |
| 5-3 | 58 | 0 / 0 / 2 / 0 | 29 | — | — | Frostfang Lynx (Common) | 20 | 62% / 70% | 11 / 10 / 10 / 10 | 75% / 80% | 28 | 35% / 43% |
| 5-4 | 64 | 0 / 0 / 0 / 0 | 29 | — | — | Coffin-Lid Skater (Common) | 21 | 64% / 69% | 11 / 11 / 11 / 10 | 75% / 78% | 26 | 37% / 41% |
| 5-5 | 62 | 0 / 0 / 0 / 0 | 29 | — | — | Coffin Lancer (Rare) | 21 | 63% / 68% | 11 / 11 / 11 / 11 | 78% / 80% | 30 | 40% / 47% |
| 5-6 | 50 | 0 / 0 / 0 / 0 | 29 | — | — | Rime-Eye Reaper (Uncommon) | 21 | 61% / 70% | 12 / 12 / 12 / 11 | 73% / 79% | 26 | 38% / 47% |
| 5-7 | 55 | 0 / 0 / 0 / 0 | 29 | — | — | Lantern Widow (Rare) | 21 | 60% / 70% | 12 / 12 / 12 / 12 | 74% / 79% | 28 | 33% / 40% |
| 5-8 | 58 | 0 / 0 / 0 / 0 | 29 | — | — | Frost Elk Matriarch (Uncommon) | 22 | 62% / 70% | 13 / 12 / 12 / 12 | 73% / 80% | 23 | 35% / 41% |
| 5-9 | 60 | 0 / 0 / 0 / 0 | 29 | — | — | Ossuary Piper (Uncommon) | 22 | 61% / 67% | 13 / 13 / 12 / 12 | 74% / 79% | 28 | 39% / 43% |
| 5-10 | 69 | 0 / 0 / 0 / 4 | 30 | — | Bone Rampart (Epic), Lane 2, Column 10 · Hushbow (Common), Lane 2, Column 11 | Bone Rampart (Epic) | 22 | 33% / 36% | 13 / 13 / 13 / 12 | 46% / 47% | 30 | 29% / 30% |

On 2026-10-17, Heroic changed: after a Unit attacks an enemy Unit, it gets +N Attack ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)). Then the AI started to count the Heroic bonus (issue [#109](https://github.com/rifandani/heynbord/issues/109)). The win rates in the table come from a new run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` after issue #109. All rows are on their target. The next paragraphs tell the earlier runs.

**Issue #109 (2026-10-17).** The AI now counts the Heroic bonus in the value of a Unit and in the threat and the defense of a Lane (GDD 9). The AI plays both Sides in the sim, so this change moved all rows. The values "before" are after the AI change and before the content changes (1000 Battles). Vanguard and Raiders, with no Gear and then with the Expected Gear. Each change is to the enemy only. Stages 5-7 and 5-10 also have a new enemy Deck card, because no change of Rank, Hero HP or Gear made the gap between Vanguard with no Gear and Raiders with the Expected Gear small enough (see 1).

- **5-7:** a Chattering Cohort (Uncommon) replaces 1 Quick Shot (Common). Before: 61% / 72%, then 76% / 82%. Now: 60% / 70%, then 74% / 79%. Each change of Rank, Hero HP and Gear kept a gap of 20 points or more between Vanguard with no Gear and Raiders with the Expected Gear: for example, 1 Rattleknife Uncommon gave 59.2% and 79.5%, and Hero HP 59 gave 59.8% and 80.7%. Other tests: a Hushbow in place of the Quick Shot: 57.6% / 67.5%, then 72.2% / 77.8%. A Pinning Shot in place of the Quick Shot: 61.2% / 70.6%, then 73.7% / 80.6%. The Chattering Cohort and Hero HP 53: 60.9% / 70.5%, then 74.6% / 79.6%. A Cave Troll in place of the Web Spitter made the gap smaller, but the Stage became too easy (71.8% and 86.7%), and Rank and Hero HP changes did not put it back on the target.
- **5-10:** Hero HP 69 (it was 65), the Rimebreath Drake is Epic (it was Rare), and a Grave Bell Tender (Common) replaces the Woolly Mammoth (Rare). Before: 31% / 39%, then 48% / 53%. Now: 33% / 36%, then 46% / 47%. Stage 5-10 keeps the largest enemy Hero HP of Region 5. The Woolly Mammoth hit Vanguard much more than Raiders. It stays in the Campaign card pool (Stages 5-8 and 5-9). Other tests: the Epic Rimebreath Drake only: Vanguard with no Gear 29.9%, Raiders with the Expected Gear 48.9%. The Epic Drake and Banner 2: 30.2% / 34.7%, then 45.5% / 49.0%. The Epic Drake and the Grave Bell Tender with Hero HP 65: 34.2% / 37.5%, then 46.7% / 48.4%. The Epic Drake, a Rare Chattering Cohort and Banner 0: 25.6% / 30.8%, then 40.9% / 47.9%.

All win rates come from one run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` on 2026-10-15, after the rule for Ranged Unit Movement and its retune (issue [#96](https://github.com/rifandani/heynbord/issues/96)): a Ranged Unit now stops in the first empty Square from which it has a target in its Range. All rows are on their target, with no Gear and with the Expected Gear, so the CI balance gate passes.

The rule changed the win rates of each Stage. These Stages missed their target after the rule and changed (1000 Battles, Vanguard and Raiders, with no Gear and then with the Expected Gear). Each change is to the enemy strength only (see 1): no enemy Deck card, first-win card, Start Unit or Closed Lane changes, and the Deck sizes do not change.

- **5-1:** 1 Crag Lizard is Rare (both were Uncommon). Before: 63.9% / 70.4%, then 76.0% / 81.2%. Now: 62% / 66%, then 73% / 78%. Other tests: Hero HP 61 to 63 gave Raiders 81.1% to 80.9% with the Expected Gear.
- **5-3:** Hero HP 58 (it was 62) and Gear 0 / 0 / 2 / 0 (it was 0 / 0 / 0 / 0). Before: 58.7% / 68.5%, then 74.3% / 78.6%. Now: 62% / 68%, then 75% / 79%. Other tests: Hero HP 61 to 59 gave Vanguard 58.8% to 59.2%. The Trinket Gear alone gave 61.0% / 67.0%, then 73.5% / 78.2%.
- **5-5:** 1 Rattleknife is Rare (both were Uncommon). Before: 64.2% / 65.9%, then 80.2% / 79.0%. Now: 63% / 65%, then 77% / 75%. Other tests: Hero HP 64 gave 64.0% / 65.8%, then 79.7% / 78.9%.
- **5-8:** Spear Throw is Uncommon (it was Common). Before: 63.8% / 72.0%, then 75.4% / 80.8%. Now: 62% / 68%, then 73% / 78%. Other tests: Hero HP 59 and 60 gave Raiders 80.7% and 80.4% with the Expected Gear.
- **5-9:** 1 Rattleknife is Uncommon (both were Common). Before: 62.1% / 67.8%, then 76.1% / 80.5%. Now: 61% / 63%, then 73% / 79%. Other tests: Hero HP 61 and 62 gave Raiders 80.4% and 80.3% with the Expected Gear.
- **5-10 (Boss):** Hero HP 65 (it was 70) and Gear 0 / 0 / 0 / 4 (it was 0 / 0 / 0 / 0). Before: 28.1% / 32.1%, then 42.8% / 49.3%. Now: 31% / 33%, then 47% / 49%. The Banner Gear lowers Raiders with the Expected Gear more than Vanguard with no Gear. Other tests: Hero HP 66 alone gave 30.0% / 33.6%, then 44.0% / 50.1%. Hero HP 66 and Banner 4 gave 30.5% and 49.2% at the edges. Banner 6 and 8 gave 30.4% and 28.6% to Vanguard with no Gear, and Weapon 2 with Banner 4 gave 27.7%. No single Rank change put all four rows on the target. Hero HP 65 keeps the Boss the largest of Region 5 (5-4 has 64). The margins of the Boss are small: Vanguard wins 30.6% with no Gear, and Raiders 49.4% with the Expected Gear.

Before issue #96, the win rates came from one run of `bun scripts/simulate.ts stage 1000 --check` in `packages/rules` on 2026-10-15, when the Region 5 Stages were added. All rows of Regions 1 to 5 are on their target, with no Gear and with the Expected Gear. Over 2000 Battles, Vanguard and Raiders win 31.6% / 33.1% and 45.8% / 48.8% of 5-10. Over 3000 Battles, they win 31.6% / 33.9% and 46.4% / 49.6%.

Notes from the first tuning:

- **The Deck sizes.** At levels 21 and 22 the maximum Deck size is 30, and the Boss Deck must be larger than all other Decks of its Region. Thus Stages 5-4 to 5-9 have 29 cards (1 card less than the maximum), and the Boss has 30.
- **The Undead Commons are weak at their Base Rank.** With each copy at its Base Rank, Vanguard and Raiders won 88% to 99% of 5-1, 5-2, 5-4 and 5-5 (200 Battles). One Rank up on all Creature Cards moved a Stage down by 20 to 40 points, and two Ranks up gave 4% to 35%. Thus the Rank is a coarse lever in Region 5. The fine steps came from a few copies, Hero HP and enemy Gear.
- **Gear adds more.** The Expected Gear is 10 to 13 (Region 4: 8 to 10). It adds about 9 to 16 points to a normal Stage.
- **Raiders and the Expected Gear.** In most Stages, Raiders with the Expected Gear won about 18 to 20 points more than Vanguard with no Gear. The target window is 20 points wide, so some margins are small: Vanguard wins 60.8% of 5-7 with no Gear, and Raiders 79.7% with the Expected Gear. Some swaps changed the two Decks by different amounts (1000 Battles, Vanguard with no Gear / Raiders with the Expected Gear, in 5-6): Winter Maw to Chattering Cohort +8.1 / +1.9, Frostfang Lynx to Rimebreath Drake −2.4 / −3.1, Spark to Frost Shards −1.4 / −1.6. In 5-7, Hero HP 58 to 50 gave +3.0 / +2.1.
- **Web Spitters hit Vanguard.** In 5-3 and 5-7, one Web Spitter less gave Vanguard 10 to 13 more points and Raiders about 5 (200 Battles). Thus each of these Decks has 1 Web Spitter.
- **The order of the Deck changes the result.** The sim uses the seeds 1 to 1000, and the order of the copies in a Deck changes each shuffle. A new order of the same cards moved some win rates by 3 to 4 points (1000 Battles). Thus the tables come from the data as it is in `stages.ts`, and a new order of a Deck needs a new run of the sim.
- **A card is never below its Base Rank.** The content test does not let a Stage Deck have a copy below its Base Rank. Thus a Lantern Widow (Rare) cannot be Uncommon to make 5-7 easier.
- **5-10 (Boss).** The Expected Gear added 14 to 20 points to the Boss Stage in each test, and the Boss target is 20 points wide. A Hushbow Start Unit behind the Bone Rampart closed the gap between Vanguard and Raiders: with a Rare Hushbow, they won 17% / 18.5% with no Gear (200 Battles). A Common Hushbow, 1 Frost Bolt in place of 1 Frostfang Lynx, no enemy Gear and Hero HP 70 put all four rows on the target. Hero HP 70 keeps the Boss the largest of Region 5. The margins of the Boss are small: Vanguard wins 31.6% with no Gear, and Raiders 48.5% with the Expected Gear.

### 6.3 Enemy Decks

| Stage | Deck |
| --- | --- |
| 5-1 | 3× Rattleknife (R), 1× Graveyard Drudge (R), 2× Graveyard Drudge (U), 2× Chattering Cohort (R), 2× Bristleback Boar (U), 2× Crag Rhino (R), 2× Cave Bear (U), 1× Crag Lizard (R), 1× Crag Lizard (U), 2× Backwatch Bailiff (R), 2× Rime-Eye Reaper (R), 1× Tailsweep Basilisk (R), 2× Spear Throw (U), 2× Shield Bash (U), 1× War Drums (R), 1× Shield Wall (U), 1× Shoulder Charge (U) |
| 5-2 | 3× Grave Bell Tender (U), 3× Hushbow (U), 2× Rattleknife (U), 2× Graveyard Drudge (U), 1× Cave Bear (U), 1× Cave Bear (C), 2× Cave Troll (U), 2× Crag Lizard (C), 1× Bristleback Boar (C), 2× Backwatch Bailiff (R), 2× Rime-Eye Reaper (R), 2× Mend (U), 2× Smite (U), 1× Blessing of Light (U), 1× Radiant Strike (U), 1× Prayer of Healing (R) |
| 5-3 | 3× Frostfang Lynx (C), 2× Barbed Arrow (U), 2× Cave Troll (R), 1× Crag Rhino (R), 1× Crag Rhino (U), 2× Bristleback Boar (C), 3× Graveyard Drudge (C), 1× Web Spitter (C), 2× Rattleknife (C), 1× Chattering Cohort (R), 1× Chattering Cohort (U), 2× Hushbow (C), 1× Grave Bell Tender (C), 2× Quick Shot (C), 2× Harrying Shot (C), 1× Pinning Shot (C), 2× Warning Shot (C) |
| 5-4 | 2× Ground Slam (U), 3× Pale Galloper (R), 1× Coffin-Lid Skater (C), 2× Coffin-Lid Skater (U), 2× Bristleback Boar (C), 2× Crag Rhino (U), 2× Frostfang Lynx (C), 2× Rattleknife (U), 2× Graveyard Drudge (U), 2× Backwatch Bailiff (R), 2× Chattering Cohort (R), 1× Ossuary Piper (R), 2× Rime-Eye Reaper (R), 2× Spear Throw (C), 1× War Drums (U), 1× Shield Bash (C) |
| 5-5 | 3× Coffin Lancer (E), 2× Unbroken Vow (E), 3× Graveyard Drudge (U), 2× Grave Bell Tender (U), 2× Hushbow (U), 1× Rattleknife (R), 1× Rattleknife (U), 2× Backwatch Bailiff (R), 2× Chattering Cohort (R), 2× Rime-Eye Reaper (R), 2× Cave Bear (U), 1× Cave Troll (R), 2× Mend (U), 2× Smite (U), 1× Sanctuary (R), 1× Penance (R) |
| 5-6 | 2× Wildfire (R), 2× Thunderstorm (R), 1× Winter Maw (R), 3× Rime-Eye Reaper (U), 1× Rimebreath Drake (R), 1× Frostfang Lynx (C), 3× Backwatch Bailiff (U), 3× Graveyard Drudge (C), 2× Rattleknife (C), 2× Hushbow (C), 3× Chattering Cohort (U), 2× Frost Bolt (C), 2× Fireball (C), 2× Frost Shards (C) |
| 5-7 | 3× Lantern Widow (R), 2× Rimebreath Drake (R), 2× Hunter's Focus (R), 2× Hushbow (C), 3× Rattleknife (C), 1× Pale Galloper (U), 2× Frostfang Lynx (C), 3× Graveyard Drudge (C), 1× Web Spitter (C), 2× Chattering Cohort (U), 2× Backwatch Bailiff (U), 1× Chattering Cohort (U), 1× Quick Shot (C), 3× Warning Shot (C), 1× Skybreaker (U) |
| 5-8 | 2× Woolly Mammoth (R), 2× Avalanche Yeti (R), 1× Old Frostmaw (E), 2× Frost Elk Matriarch (U), 3× Frostfang Lynx (C), 2× Cave Troll (U), 2× Crag Rhino (U), 2× Rattleknife (C), 2× Graveyard Drudge (C), 2× Rime-Eye Reaper (U), 2× Coffin-Lid Skater (C), 2× Ground Slam (U), 1× Call to Arms (R), 2× Cleave (U), 1× War Drums (U), 1× Spear Throw (U) |
| 5-9 | 1× Sir Odo, the Last Taxman (E), 2× Winter Maw (R), 1× Coffin Lancer (R), 1× Lantern Widow (R), 1× Frostfang Lynx (U), 1× Frostfang Lynx (C), 1× Woolly Mammoth (R), 1× Avalanche Yeti (R), 2× Grave Bell Tender (C), 2× Hushbow (C), 1× Rattleknife (U), 1× Rattleknife (C), 2× Graveyard Drudge (C), 2× Chattering Cohort (U), 2× Ossuary Piper (U), 1× Pale Galloper (U), 1× Barbed Arrow (U), 1× Hunter's Focus (R), 2× Quick Shot (C), 2× Harrying Shot (C), 1× Pinning Shot (C) |
| 5-10 | 1× Bone Rampart (E), 1× Blizzard (E), 2× Winter Maw (R), 1× Lantern Widow (R), 1× Rimebreath Drake (E), 1× Grave Bell Tender (C), 1× Coffin Lancer (R), 2× Rime-Eye Reaper (U), 2× Pale Galloper (U), 2× Hushbow (C), 2× Grave Bell Tender (C), 2× Graveyard Drudge (C), 2× Rattleknife (C), 2× Chattering Cohort (U), 2× Frost Bolt (C), 1× Frostfang Lynx (C), 1× Backwatch Bailiff (U), 1× Thunderstorm (R), 1× Wildfire (R), 1× Frost Wave (U), 1× Frost Shards (C) |

## 7. Dungeons

A Dungeon is not a Stage of the Campaign ([GDD 8.4](./03-game-design.md#84-dungeons)), but its design and its simulation use the same tools. The data is `DUNGEONS` in `packages/rules/src/content/dungeons.ts`, with the rewards (`DUNGEON_REWARDS`, Economy 2.4). The Dungeon names and the Boss names are draft names in the Message Catalogs (`dungeons.<id>.name` and `dungeons.<id>.bosses.<boss>`).

### 7.1 Rules for the Dungeons

- **One Battle, 4 Lanes, 1 Hero for each Boss.** Each Boss has its own Front, Hero HP, Class, Gear, Deck, Start Units and Boss Rules. A content test checks that each Lane is in exactly one Front, that each Front is a block of Lanes next to each other, and that each Start Unit and each Boss Rule Summon is in the Front of its Boss.
- **Small and cheap Boss Decks.** Each Boss has its own Hand, so the enemy Side draws 1 card for each Boss in each Turn. With 2 Bosses, the enemy gets 2 cards for each card of the Player. Thus a Boss Deck is smaller than the Deck of a Stage enemy, and most of its cards are Common, with a low Countdown. A Boss Deck has at least 4 cards, the start Hand. With 3 Bosses, the enemy gets 3 cards for each card of the Player, so each Dungeon 3 Boss has only 4 cards. A Wall does not hit the Player, so a Boss with many Walls makes the Battle longer, not harder. Hero HP is a weak lever: in Dungeon 1, 4 more HP for each Boss changes the win rate by about 2 points.
- **First-win card.** The first win gives an Epic copy of a card of a Boss Deck. A content test checks it.
- **Use a Summon Boss Rule.** A Boss draws 4 cards at the start and 1 in each Turn, so a small Boss Deck is empty by about Turn 5 to 9. A Boss usually goes to 50% HP after Turn 17, and then its Hand is also empty. A Draw or a Countdown Boss Rule then changes nothing. The sim measured this: at activation, the Deck and the Hand of the Boss were empty in each Battle, in Dungeons 1 and 2. Thus Dungeon 2 uses only Summon Boss Rules. The Countdown rule of Rootwarden Sylla (7.3) has the same problem.
- **Win-rate target.** 30% to 50%, the same as a Boss Stage (GDD 13). The Dungeon must hit it two times, at its unlock level: with no Gear, and with the Expected Gear of the first Stage at that level.

### 7.2 Simulation

`bun run sim dungeon` in `packages/rules` plays each Dungeon with each Starter Deck at its unlock level (its Recommended level). The Deck is typical at that level: the Starter Deck, then the first-win cards of all Stages below that level, in Stage order, at the Deck limits of that level (as the expected Deck of 1.1). For Dungeons 1 and 2, it is the expected Deck at the first Stage with that Recommended level. Dungeon 3 unlocks at level 30, above all Stages, so its Deck has the first-win cards of all Stages that it can hold. The second row of each Deck plays the Expected Gear at the unlock level (ADR-0033). After the Campaign, the First-try Path wins the Floors and then Dungeons until level 30, so the Expected Gear at level 30 is 16 / 16 / 16 / 16. `defeated` is the average number of Bosses that the Player Defeated in a Battle, also in a loss. With `--check`, the sim fails when a row is not on its target. CI runs it with the Stages.

On 2026-10-17, Heroic changed ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)), and then the AI started to count the Heroic bonus (issue [#109](https://github.com/rifandani/heynbord/issues/109), GDD 9). The Dungeon win rates come from a new run of `bun scripts/simulate.ts 1000 --check` after issue #109. All rows are on their target.

**Issue #109 (2026-10-17).** After the AI change, Dungeon 1 was on its target with no change (Raiders with the Expected Gear: 50.0%, it was 51.8% before the AI change). Raiders won 50.4% of Dungeon 2 with the Expected Gear. Abbot Knell of Dungeon 2 now has 20 Hero HP (it was 18). Before (Vanguard / Raiders, with no Gear and then with the Expected Gear): 32% / 33%, then 47% / 50%. Now: 31% / 32%, then 45% / 49%. Other tests: Seer Vell 14 HP: 31.1% / 31.9%, then 45.9% / 49.7%. Abbot Knell 20 HP and Seer Vell 14 HP: 30.3% / 31.5%, then 44.8% / 49.1%. Abbot Knell 22 HP: 28.9% / 31.6%, then 43.4% / 47.7%. 1 Frostfang Lynx Uncommon: 28.5% / 29.5%, then 42.6% / 44.3%. 1 Rattleknife Uncommon: 26.5% / 27.8%, then 43.3% / 45.5%.

### 7.3 Dungeon 1: The Rootdeep Mine

The Goblin diggers of the Red Mesas dug into the roots of the Glowcap Hollows. The Orc foreman of the mine and the Elf warden of the roots each hold one half of the tunnel. Dungeon 1 teaches the multi-Boss rules in the simplest form: 2 Bosses with 2 Lanes each. It unlocks at Player level 10, when the Player starts Region 3, so it uses the Races of Regions 2 and 3: Orc, Goblin and Elf.

| Boss | Front | Class | Hero HP | Gear | Deck size | Start Units | Boss Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Foreman Gritjaw (Orc) | Lanes 1 and 2 | Warrior | 24 | 0 / 0 / 0 / 0 | 11 | Bonestake Palisade (Common), Lane 1, Column 11 | At 50% HP: Summon a Mesa Pit Fighter (Rare) in Lane 2, Column 11. |
| Rootwarden Sylla (Elf) | Lanes 3 and 4 | Ranger | 24 | 0 / 0 / 0 / 0 | 13 | — | At 50% HP: Countdown −2 on the 2 cards with the highest Countdown in her Hand. |

| Boss | Deck |
| --- | --- |
| Foreman Gritjaw | 1× Grand Gearjammer (E), 3× Bonestake Palisade (C), 2× Junk Barricade (U), 2× Scrap Plate Guard (C), 2× Fuse Runner (C), 1× Scrap Raider (C) |
| Rootwarden Sylla | 2× Fernwing Courier (C), 2× Rootbound Guard (C), 2× Acorn Tender (C), 2× Ankle Snatcher (C), 2× Junk Slinger (C), 2× Fuse Runner (C), 1× Quick Shot (C) |

- **The two Bosses.** Gritjaw builds walls of junk and bone in front of him, and his Grand Gearjammer (Sabotage 2) makes the Player's next card late. Sylla sends many cheap Units into her 2 Lanes. Gritjaw starts with a Bonestake Palisade in Lane 1, Column 11. Thus the Player must find the weaker Front, and then fight one Boss after the other.
- **First-win card:** Grand Gearjammer (Epic), the Goblin Epic. No Stage gives it.
- **Results** (`bun run sim dungeon 1000`, level 10, no Closed Lanes):

| Gear | Win rate (Vanguard / Raiders) | Average Turn (Vanguard / Raiders) | Bosses Defeated (Vanguard / Raiders) |
| --- | --- | --- | --- |
| 0 / 0 / 0 / 0 | 37% / 41% | 19.3 / 18.7 | 0.67 / 0.72 |
| 5 / 5 / 5 / 5 (Expected Gear at level 10) | 44% / 50% | 19.8 / 19.5 | 0.78 / 0.88 |

The expected Deck at Stage 3-1 has 19 cards for Vanguard and 18 cards for Raiders. About 2 of 3 wins Defeat both Bosses. In the other wins, the enemy Side is Routed. The first draft had Boss Decks of 14 cards with Rare and Epic cards and 30 HP for each Boss, and it won 0% to 1%: the 2 Hands of the enemy filled all 4 Lanes before a Player Unit got to a Boss.

### 7.4 Dungeon 2: The Rimebarrow

A frozen grave mound where the Hollow Marches meet the cold hills. The Undead abbot of the barrow and an Elf frost seer with her cold beasts hold it. Dungeon 2 teaches Fronts of different sizes. It unlocks at Player level 20, when the Player starts Region 5, so it uses the Races of Regions 4 and 5: Elf, Feral and Undead. It uses the 2 Classes that Dungeon 1 does not use.

| Boss | Front | Class | Hero HP | Gear | Deck size | Start Units | Boss Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Abbot Knell (Undead), the wide Boss | Lanes 1, 2 and 3 | Priest | 20 | 0 / 0 / 0 / 0 | 9 | Bone Rampart (Epic), Lane 3, Column 11 | At 50% HP: Summon a Chattering Cohort (Uncommon) in Lane 2, Column 11. |
| Seer Vell (Elf), the narrow Boss | Lane 4 | Mage | 12 | 0 / 0 / 0 / 0 | 9 | Boulder Tortoise (Uncommon), Lane 4, Column 10 | At 50% HP: Summon an Avalanche Yeti (Rare) in Lane 4, Column 11. |

| Boss | Deck |
| --- | --- |
| Abbot Knell | 2× Rattleknife (C), 2× Graveyard Drudge (C), 2× Grave Bell Tender (C), 1× Hushbow (C), 1× Smite (C), 1× Mend (C) |
| Seer Vell | 1× Old Frostmaw (E), 2× Frostfang Lynx (C), 1× Frost Elk Matriarch (U), 2× Frost Bolt (C), 1× Frost Shards (C), 2× Spark (C) |

- **The two Bosses.** The Player can hit Abbot Knell in 3 Lanes, so he has more HP. A Bone Rampart from the barrow wall holds Lane 3 at the start. In the sim, the Rampart in Column 10 made Dungeon 2 easier (53% to 59% with the Expected Gear), and in Column 11 with 22 HP it made Dungeon 2 harder (24% to 29% with no Gear). Thus the Rampart is in Column 11, and Abbot Knell has 20 HP, not 22 (18 before issue [#109](https://github.com/rifandani/heynbord/issues/109)). The Player can hit Seer Vell only in Lane 4, behind a Wall at the start and a Yeti at 50% HP, so she has less HP. Thus the Player must select which Boss to attack first. When Seer Vell is Defeated, Abbot Knell gets Lane 4.
- **First-win card:** Old Frostmaw (Epic), the Feral Epic. No Stage gives it. Sir Odo and Canopy Vinewarden stay free for Dungeon 3.
- **Results** (`bun run sim dungeon 1000`, level 20, no Closed Lanes):

| Gear | Win rate (Vanguard / Raiders) | Average Turn (Vanguard / Raiders) | Bosses Defeated (Vanguard / Raiders) |
| --- | --- | --- | --- |
| 0 / 0 / 0 / 0 | 31% / 32% | 17.3 / 17.0 | 0.64 / 0.68 |
| 10 / 10 / 10 / 10 (Expected Gear at level 20) | 45% / 49% | 18.3 / 18.1 | 0.94 / 1.01 |

The Expected Gear at level 20 is 10, not 5 as in Dungeon 1. It adds about 15 to 17 points to the win rate, so the margin to the target is small: the rows with no Gear are near the bottom of the target, and the rows with Expected Gear are near the top. The first draft had Boss Decks of 11 and 14 cards at Uncommon and Rare, Hero HP 32 and 20, and it won 0%: the Player lost at about Turn 13.


### 7.5 Dungeon 3: The Broken Vault

An old Lanekeeper vault under the hills, where 3 Bosses of the Campaign join to take revenge on the Player. It is the final challenge, and it unlocks at Player level 30. Each Boss keeps its Campaign bodyguard (Stages 1-10, 4-10 and 5-10), and the Old Bramble holds the 2 center Lanes. The 3 Bosses have 3 different Classes. The Old Bramble and Queen Marrow keep their Campaign Classes, but Baron Brassbelly is a Ranger here: he leads his crossbows, not a sword.

| Boss | Front | Class | Hero HP | Gear | Deck size | Start Units | Boss Rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Baron Brassbelly (Human) | Lane 1 | Ranger | 20 | 25 / 0 / 25 / 25 | 4 | Shieldbearer (Epic), Lane 1, Column 10 | At 50% HP: Summon a Gate Warden (Epic) in Lane 1, Column 11. |
| The Old Bramble, the wide Boss | Lanes 2 and 3 | Warrior | 34 | 25 / 0 / 25 / 25 | 4 | Bramble Nest (Uncommon), Lane 2, Column 9 | At 50% HP: Summon a Mountain Colossus (Epic) in Lane 3, Column 11. |
| Queen Marrow (Undead) | Lane 4 | Mage | 20 | 25 / 0 / 25 / 25 | 4 | Bone Rampart (Epic), Lane 4, Column 9 | At 50% HP: Summon a Winter Maw (Epic) in Lane 4, Column 11. |

| Boss | Deck |
| --- | --- |
| Baron Brassbelly | 2× Crossbow Guard (C), 1× Militia Recruit (C), 1× Pinning Shot (C) |
| The Old Bramble | 1× Canopy Vinewarden (E), 1× Cave Bear (C), 1× Bramble Duelist (C), 1× Cleave (U) |
| Queen Marrow | 1× Sir Odo, the Last Taxman (E), 2× Rattleknife (C), 1× Graveyard Drudge (C) |

- **Higher power than in the Campaign.** Each Boss Deck is only its start Hand of 4 cards, because 3 Hands fill the Board fast. The power comes from Gear 25 on Weapon, Trinket and Banner, the Epic bodyguards and the Epic Boss Rule Summons. The first draft had Boss Decks of 10 cards at Uncommon and Rare, with Gear 10, and it won 0%.
- **The Gear gap.** The Expected Gear at level 30 (16) adds about 13 to 21 points to the win rate, and the target is 20 points wide. With 5 cards in each Boss Deck, the Vanguard row with Expected Gear was always about 21 points above the Raiders row with no Gear, so no setting was on target. Thus a Dungeon Boss Deck can have 4 cards. The Pinning Shot of Baron Brassbelly makes the gap smaller in the sim.
- **The Ranger card of the Baron.** The Warrior draft of the Baron had a Spear Throw (U). In the sim, each other Ranger card made the Raiders row with no Gear go below 30%: Quick Shot (U and C), Harrying Shot, Warning Shot, Long Shot and Barbed Arrow. Hunter's Focus made the Vanguard row with Expected Gear go above 50%. A lower Hero HP (18) did not help, because the Player loses when its Hero falls, not when the Baron lives. Pinning Shot (C) keeps all 4 rows on target.
- **The Bramble Nest holds Lane 2.** A Wall in front of the enemy Summon Zone stops the Units of its own Boss in that Lane, and a Heavy Unit cannot pass a Wall, because a Wall never moves. A Bramble Nest in both center Lanes made the Battle much easier, so only Lane 2 has one. The Mountain Colossus comes in Lane 3, next to the Wall, so it can move.
- **First-win card:** Sir Odo, the Last Taxman (Epic), the Undead Epic. No Stage gives it. Canopy Vinewarden is in the Deck of the Old Bramble, but it is not a reward.
- **Results** (`bun run sim dungeon 1000`, level 30, no Closed Lanes):

| Gear | Win rate (Vanguard / Raiders) | Average Turn (Vanguard / Raiders) | Bosses Defeated (Vanguard / Raiders) |
| --- | --- | --- | --- |
| 0 / 0 / 0 / 0 | 33% / 32% | 18.8 / 17.5 | 0.96 / 0.96 |
| 16 / 16 / 16 / 16 (Expected Gear at level 30) | 49% / 47% | 20.8 / 19.3 | 1.47 / 1.38 |

The Deck at level 30 has 29 cards: the Countdown Limit (75) stops it before 30. Most of its cards are the first-win cards of Regions 1 and 2, because the Deck is full before the later Stages. A real Player at level 30 has better cards, so the Dungeon is easier for that Player than the target. That is the same floor as for the Stages (1.1).

## 8. Heynspire

Heynspire is not a part of the Campaign ([GDD 8.2](./03-game-design.md#82-heynspire-draft-name)), but its design and its simulation use the same tools. A pure function makes each of the 50 Floors from a **Floor template** and a **strength curve** ([ADR-0040](../adr/0040-heynspire-floors-come-from-templates-and-a-strength-curve.md)). The data is `FLOOR_TEMPLATES`, `BOSS_FLOOR_TEMPLATES` and the curve in `packages/rules/src/content/floors.ts`. `getFloor(n)` gives the definition of Floor *n*, and `createBattle` takes it as it takes a Stage or a Dungeon. The rewards are `floorFirstWinReward` (Economy 2.3). The enemy names of the templates are draft names in the Message Catalogs (`heynspire.enemies.<id>`). A Boss Floor uses the name of the Boss of its Boss Stage.

### 8.1 Rules for the Floors

- **One Battle, 4 Lanes, 1 enemy Hero.** The enemy Hero has a Front of all 4 Lanes, and a Floor has no Closed Lanes ([ADR-0010](../adr/0010-the-type-of-battle-sets-the-number-of-lanes.md)).
- **Floor *n* is always the same Floor.** There is no random content at run time. The Battle seed shuffles the Decks, as in a Stage.
- **9 Floor templates.** Floors 1 to 9 use templates 1 to 9. Floors 11 to 19 use them again, and so on. Each template has a draft enemy name, a Race theme, a Class and a Deck of 30 Base Rank copies. Its Skill Cards are of its Class.
- **5 Boss Floors.** On Floors 10, 20, 30, 40 and 50, the 5 Campaign Bosses come back in Region order. Each Boss has a new Floor Deck. It keeps the Class and the Start Units of its Boss Stage, and a content test compares them with the Boss Stage. A Boss Floor has no Boss Rules ([ADR-0038](../adr/0038-a-boss-rule-is-a-one-time-hp-threshold-with-a-fixed-effect-list.md)).
- **Cards.** A template uses only cards of the Campaign card pool: the cards in the enemy Decks of all Stages. No enemy Deck has a Skill Card with Base Rank Epic: an Epic Skill Card in an enemy Hand changes a win rate by too much for a fine tune (see 6). A Rare Skill Card can get an Epic copy from a Rank step, as Unbroken Vow in 5-5. A template has its own cards, so a change to a Stage Deck does not change a Floor. A Start Unit of a Boss Floor is not in the Deck, so it can be a card that no Stage Deck has (Canopy Vinewarden).
- **The order of a template Deck.** The curve gives 1 Rank step to the first copies of the Deck. The Battle seed shuffles the Deck in its order. Thus the order changes the win rates, and the order is part of the template.
- **Content tests.** A content test checks each generated Floor: each copy is at its Base Rank or higher and never above Legendary, each card is in the Campaign card pool, there is no Epic Skill Card, a Deck has at most 3 copies of a card, the Deck size is the largest at the Recommended level, and each Start Unit is in the Front.
- **Recommended level and Expected Gear.** They come from the First-try Path: all Stages, then the earlier Floors (`floorRecommendedLevels`). Floors 1 to 15 have Recommended level 23, and Floors 43 to 50 have level 27. The maximum Deck size is 30 at all these levels, so each Floor Deck has 30 cards. The Expected Gear goes from 13 / 13 / 13 / 13 before Floor 1 to 16 / 16 / 15 / 15 before Floor 50.
- **Win-rate target.** The difficulty does not go up. A normal Floor has the target of a normal Stage (60% to 80%), and a Boss Floor has the target of a Boss Stage (30% to 50%; in `sim:check`, 25% to 50% with no Gear and 30% to 55% with the Expected Gear, [ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)). Each Floor must hit its target at its Recommended level, with no Gear and with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)).

### 8.2 Simulation

`bun run sim floor` in `packages/rules` plays each Floor with each Starter Deck, at the Recommended level of the Floor and with no Gear. Then it plays each Floor again with the Expected Gear of the Floor. The Deck is the expected Deck after all Stages: the Starter Deck, then the first-win cards of all Stages, in Stage order, at the Deck limits of the Recommended level (see 1.1). A Floor win gives no card, so each Floor has the same expected Deck: 29 cards, because the Countdown Limit (75) stops it before 30. The Expected Gear comes from the First-try runs of the economy simulation, as for a Stage (`expectedFloorGear`). With `--check`, the sim fails when a row is not on its target. CI runs it with the Stages, the Dungeons and the Matchups (`bun run rules:sim:check`).

The economy simulation (Economy 7.1) gives a Boss Floor the base chance of a Boss Stage (40%), and a normal Floor the base chance of a normal Stage (70%).

### 8.3 Strength curve

| Floors | Rank steps on each copy | Copies with 1 more Rank step | Hero HP | Gear | Deck size |
| --- | --- | --- | --- | --- | --- |
| 1 to 9 | 0 | The first 12 | 50 | 0 / 0 / 0 / 0 | 30 |
| 11 to 19 | 0 | The first 12 | 52 | 0 / 0 / 0 / 0 | 30 |
| 21 to 29 | 0 | The first 12 | 54 | 0 / 0 / 0 / 0 | 30 |
| 31 to 39 | 0 | The first 12 | 56 | 0 / 0 / 0 / 0 | 30 |
| 41 to 49 | 0 | The first 12 | 58 | 0 / 0 / 0 / 0 | 30 |

Each Boss Floor has its own row, in 8.5. The Deck size is the largest at the Recommended level (GDD 6). No copy goes above Legendary.

Notes from the first tuning (Vanguard and Raiders, 200 to 1000 Battles):

- **A Rank step is a coarse lever.** One Rank step on all copies moved a Floor by 40 to 80 points. For example, Vanguard with no Gear won 93% of the first draft of Floor 1 at Base Rank (Hero HP 55), and 11% with 1 Rank step on each copy (Hero HP 60). Thus the curve gives 1 Rank step only to the first copies. Hero HP is a weak lever: 15 more HP changed a Floor by about 5 points.
- **The Player gets only a little stronger.** From Floors 1 to 9 to Floors 41 to 49, the Player gets about 4 levels and 2 or 3 Gear levels. With the same enemy, this gave 0 to 3 more points (Floors 2, 6 and 8 against Floors 42, 46 and 48). A first curve gave 1 more stepped copy and 1 more Hero HP to each tier, and Floors 41 to 49 were then 6 to 18 points harder than Floors 1 to 9. Thus each tier only adds 2 Hero HP. Each tier is stronger, and the win rates of a template stay within about 2 points on its 5 Floors.
- **The 20-point window.** The Expected Gear adds about 10 to 18 points to a normal Floor, so Vanguard and Raiders must be within a few points of each other. In the results (8.6), they are within about 6 points. Vanguard has only Physical damage, and Raiders has Fire. The first templates with many Bulwark cards (Shieldbearer, Crag Lizard, Rootbound Guard, Scrap-Plate Guard) gave Vanguard 10 to 16 points less than Raiders.
- **No enemy Gear.** Banner 6 on the enemy lowered Vanguard with no Gear by 7 to 10 points, but not the rows with the Expected Gear (Floors 6 and 8). Weapon 6, Trinket 6 and Armor 10 made the gap 1 to 6 points larger. Thus the curve gives no Gear.
- **A search for each template.** A local search with the sim (1000 Battles for each row) tuned each template Deck: it changed the order of 2 copies, or it put another card of the Races or the Class of the template in place of a copy, and it kept a change that put the 4 rows nearer to the target. The search used only the Campaign card pool, at most 3 copies of a card, and no Epic Creature Card in a normal template. Then it checked all 5 Floors of the template.

### 8.4 Floor templates

| Template | Floors | Enemy | Class | Race theme | Cards |
| --- | --- | --- | --- | --- | --- |
| 1 | 1, 11, 21, 31, 41 | Spire Warden Holt | Warrior | Human | 4 Orc, 15 Human, 11 Skill Cards |
| 2 | 2, 12, 22, 32, 42 | Emberchief Razka | Mage | Orc | 23 Orc, 7 Skill Cards |
| 3 | 3, 13, 23, 33, 43 | Trapmaster Krink | Ranger | Goblin | 24 Goblin, 6 Skill Cards |
| 4 | 4, 14, 24, 34, 44 | Grove Sister Myrra | Priest | Elf | 23 Elf, 7 Skill Cards |
| 5 | 5, 15, 25, 35, 45 | Beastmaster Brokk | Ranger | Feral | 19 Feral, 11 Skill Cards |
| 6 | 6, 16, 26, 36, 46 | Bonecaptain Rusk | Warrior | Undead | 24 Undead, 6 Skill Cards |
| 7 | 7, 17, 27, 37, 47 | Lightbearer Anselm | Priest | Human | 12 Elf, 10 Human, 8 Skill Cards |
| 8 | 8, 18, 28, 38, 48 | Warboss Gnash | Warrior | Orc | 12 Orc, 12 Goblin, 6 Skill Cards |
| 9 | 9, 19, 29, 39, 49 | Rimecaller Isolde | Mage | Undead | 14 Undead, 7 Feral, 9 Skill Cards |

The Deck of each template is in its order. The first 12 copies (in **bold**) get 1 Rank step. Each card is at its Base Rank in the list.

| Template | Deck |
| --- | --- |
| 1. Spire Warden Holt | **1× Shoulder Charge (C)**, **2× River Knight (U)**, **1× Call to Arms (R)**, **1× Dawn Cleric (U)**, **1× Gate Warden (U)**, **1× Howling Charger (U)**, **1× Call to Arms (R)**, **1× Halberdier (C)**, **1× Crossbow Guard (C)**, **1× War Drums (U)**, **1× Crossbow Guard (C)**, 3× Militia Recruit (C), 1× Ground Slam (U), 2× Dawn Cleric (U), 2× Scrap Raider (C), 1× River Knight (U), 1× Ground Slam (U), 1× Spear Throw (C), 1× Shoulder Charge (C), 1× Howling Charger (U), 1× Expose Weakness (R), 1× War Drums (U), 1× Cleave (U), 1× Halberdier (C), 1× Gate Warden (U) |
| 2. Emberchief Razka | **1× Scrap Raider (C)**, **1× Warhowler Drummer (U)**, **1× Howling Charger (U)**, **3× Ember Shaman (C)**, **1× Cinderhorn Breaker (U)**, **1× Spark (C)**, **1× Howling Charger (U)**, **1× Bonestake Palisade (C)**, **2× Skyreaver (U)**, 1× Mesa Pit-Fighter (R), 1× Fireball (C), 1× Tusk Brute (C), 1× Bonestake Palisade (C), 1× Cinderhorn Breaker (U), 1× Badland Runt (C), 1× Pack Stalker (U), 1× Warhowler Drummer (U), 1× Mesa Pit-Fighter (R), 1× Howling Charger (U), 2× Fireball (C), 1× Spark (C), 1× Badland Runt (C), 1× Pack Stalker (U), 1× Wildfire (R), 1× Pack Stalker (U), 1× Frost Bolt (C) |
| 3. Trapmaster Krink | **3× Ankle Snatcher (C)**, **1× Sidestep Shiv (U)**, **1× Junk Slinger (C)**, **1× Scrap-Plate Guard (C)**, **2× Tunnel Saboteur (C)**, **1× Grease Trapper (U)**, **1× Bomb Lobber (U)**, **1× Fuse Runner (C)**, **1× Grease Trapper (U)**, 1× Tunnel Saboteur (C), 1× Rocket Barrel Rider (U), 1× Harrying Shot (C), 1× Pinning Shot (C), 1× Bomb Lobber (U), 1× Fuse Runner (C), 1× Grease Trapper (U), 1× Spyglass Sniper (R), 1× Junk Slinger (C), 2× Sidestep Shiv (U), 1× Rocket Barrel Rider (U), 1× Quick Shot (C), 1× Barbed Arrow (U), 1× Harrying Shot (C), 1× Mine Sapper (R), 1× Rocket Barrel Rider (U), 1× Venom Arrow (R) |
| 4. Grove Sister Myrra | **2× Bramble Duelist (C)**, **1× Fernwing Courier (C)**, **2× Acorn Tender (C)**, **1× Thornline Archer (U)**, **1× Blessing of Light (C)**, **1× Bramble Duelist (C)**, **1× Smite (C)**, **3× Canopy Skirmisher (U)**, 1× Mosspitcher Lookout (C), 1× Amberwing Dart (R), 1× Glade Turnblade (U), 1× Mosspitcher Lookout (C), 1× Glade Turnblade (U), 1× Fernwing Courier (C), 1× Rootbound Guard (C), 1× Elderreed Dartmaster (R), 1× Dewkeeper (U), 1× Mosspitcher Lookout (C), 1× Penance (U), 1× Bramble Nest (U), 1× Prayer of Healing (U), 1× Cleanse (R), 1× Fernwing Courier (C), 1× Dewkeeper (U), 1× Radiant Strike (C), 1× Prayer of Healing (U) |
| 5. Beastmaster Brokk | **1× Long Shot (U)**, **2× Bristleback Boar (C)**, **1× Cave Troll (U)**, **1× Crag Rhino (U)**, **1× Warning Shot (C)**, **1× Frostfang Lynx (C)**, **1× Bristleback Boar (C)**, **1× Crag Lizard (C)**, **1× Hunter's Focus (R)**, **1× Frost Elk Matriarch (U)**, **1× Warning Shot (C)**, 2× Crag Lizard (C), 1× Cave Bear (C), 1× Frostfang Lynx (C), 1× Cave Bear (C), 1× Frostfang Lynx (C), 1× Hunter's Focus (R), 1× Avalanche Yeti (R), 1× Boulder Tortoise (U), 1× Skybreaker (U), 1× Crag Rhino (U), 1× Cave Bear (C), 1× Barbed Arrow (U), 1× Venom Arrow (R), 1× Barbed Arrow (U), 1× Frost Elk Matriarch (U), 1× Skybreaker (U), 1× Hunter's Focus (R) |
| 6. Bonecaptain Rusk | **1× Rattleknife (C)**, **1× Winter Maw (R)**, **1× Chattering Cohort (U)**, **2× Graveyard Drudge (C)**, **1× Spear Throw (C)**, **1× Rattleknife (C)**, **1× Rime-Eye Reaper (U)**, **1× Spear Throw (C)**, **1× Chattering Cohort (U)**, **1× Ossuary Piper (U)**, **1× Grave Bell Tender (C)**, 1× Backwatch Bailiff (U), 1× Chattering Cohort (U), 1× Hushbow (C), 1× Ossuary Piper (U), 1× Graveyard Drudge (C), 1× Rime-Eye Reaper (U), 1× Coffin-Lid Skater (C), 1× Shield Bash (C), 1× Hushbow (C), 1× Coffin Lancer (R), 1× Grave Bell Tender (C), 2× Pale Galloper (U), 1× Ground Slam (U), 1× War Drums (U), 1× Rattleknife (C), 1× Call to Arms (R), 1× Hushbow (C) |
| 7. Lightbearer Anselm | **1× Seedwind Shepherd (R)**, **1× Bramble Nest (U)**, **1× Seedwind Shepherd (R)**, **1× Halberdier (C)**, **1× Dawn Cleric (U)**, **1× Gate Warden (U)**, **1× Dawn Cleric (U)**, **1× Amberwing Dart (R)**, **1× Militia Recruit (C)**, **1× Bramble Duelist (C)**, **1× Blessing of Light (C)**, **1× Glade Turnblade (U)**, 1× Crossbow Guard (C), 1× Bramble Nest (U), 1× Mosspitcher Lookout (C), 1× Sanctuary (U), 1× Acorn Tender (C), 1× Blessing of Light (C), 1× Mosspitcher Lookout (C), 1× Sanctuary (U), 1× Halberdier (C), 1× Militia Recruit (C), 1× Radiant Strike (C), 1× Smite (C), 1× Bramble Duelist (C), 1× Radiant Strike (C), 1× Smite (C), 1× Crossbow Guard (C), 1× Militia Recruit (C), 1× Acorn Tender (C) |
| 8. Warboss Gnash | **1× Scrap Raider (C)**, **1× Scrap-Plate Guard (C)**, **1× Badland Runt (C)**, **1× Scrap-Plate Guard (C)**, **1× Badland Runt (C)**, **1× Pack Stalker (U)**, **1× Spear Throw (C)**, **1× Mine Sapper (R)**, **1× Howling Charger (U)**, **1× Bomb Lobber (U)**, **1× Mine Sapper (R)**, **1× Howling Charger (U)**, 1× Ankle Snatcher (C), 1× Pack Stalker (U), 1× Ground Slam (U), 1× Mesa Pit-Fighter (R), 1× Scrap-Plate Guard (C), 1× Badland Runt (C), 1× Bomb Lobber (U), 1× Shield Bash (C), 1× Warhowler Drummer (U), 1× Mine Sapper (R), 1× Spear Throw (C), 1× Tusk Brute (C), 1× Warhowler Drummer (U), 1× Shoulder Charge (C), 1× Shield Bash (C), 1× Rocket Barrel Rider (U), 2× Junk Slinger (C) |
| 9. Rimecaller Isolde | **1× Frost Bolt (C)**, **1× Rime-Eye Reaper (U)**, **1× Crag Lizard (C)**, **1× Lantern Widow (R)**, **1× Winter Maw (R)**, **1× Frost Shards (C)**, **1× Rattleknife (C)**, **1× Thunderstorm (R)**, **1× Chattering Cohort (U)**, **1× Graveyard Drudge (C)**, **1× Bristleback Boar (C)**, **1× Spark (C)**, 1× Rattleknife (C), 1× Chattering Cohort (U), 1× Pale Galloper (U), 1× Arc Lightning (U), 1× Hushbow (C), 1× Spark (C), 1× Wildfire (R), 1× Rimebreath Drake (R), 1× Coffin-Lid Skater (C), 1× Spark (C), 1× Frost Bolt (C), 1× Frost Elk Matriarch (U), 1× Ossuary Piper (U), 1× Boulder Tortoise (U), 1× Rattleknife (C), 1× Frostfang Lynx (C), 1× Backwatch Bailiff (U), 1× Rimebreath Drake (R) |

### 8.5 Boss Floors

| Floor | Boss (Class) | Boss Stage | Start Units | Hero HP | Copies with 1 more Rank step |
| --- | --- | --- | --- | --- | --- |
| 10 | Baron Brassbelly (Warrior) | 1-10 | Shieldbearer (Epic), Lane 2, Column 11 | 64 | 13 |
| 20 | Boss Snikkit (Ranger) | 2-10 | Warchief Grukka (Epic), Lane 2, Column 11 · Junk Barricade (Uncommon), Lane 1, Column 11 · Junk Barricade (Uncommon), Lane 3, Column 11 | 62 | 15 |
| 30 | Lady Glimmerbough (Priest) | 3-10 | Canopy Vinewarden (Epic), Lane 2, Column 11 · Bramble Nest (Uncommon), Lane 2, Column 10 | 41 | 10 |
| 40 | The Old Bramble (Warrior) | 4-10 | Mountain Colossus (Epic), Lane 3, Column 11 · Bramble Nest (Uncommon), Lane 1, Column 10 | 50 | 6 |
| 50 | Queen Marrow (Mage) | 5-10 | Bone Rampart (Epic), Lane 2, Column 10 · Hushbow (Common), Lane 2, Column 11 | 56 | 12 |

- **Gear on a Boss Floor.** The Old Bramble of Floor 40 has Gear 0 / 0 / 0 / 10 (Banner 10: Unit Block chance 5%). The other Boss Floors have no Gear. Her Mountain Colossus in Lane 3 is strong against Vanguard, so fewer stepped copies alone made a gap of about 30 points between Vanguard with no Gear and Raiders with the Expected Gear. The Banner makes the gap smaller (2026-10-24, 8.6).

- **The Start Units are the power of a Boss.** Lady Glimmerbough has an Epic Canopy Vinewarden behind a Bramble Nest. With Hero HP 60 and 12 stepped copies, she won 3% to 10% of Battles. Thus she has the lowest Hero HP and the fewest stepped copies of the Boss Floors. A Boss Floor can have less Hero HP than the normal Floors of its tier.
- **Rank steps on Epic cards.** The first copies of a Boss Deck can be Epic cards. A step makes them Legendary. Since issue [#109](https://github.com/rifandani/heynbord/issues/109), the Iron Bulwark of Floor 10 is the last copy of its Deck, so it stays Epic, and a Mesa Pit-Fighter (Rare) is the first copy. Warchief Grukka is only a Start Unit on Floor 20: since Heroic gives Attack after each attack on a Unit ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)), a Mine Sapper replaces the Grukka copy of the Deck.

| Boss | Deck |
| --- | --- |
| 10. Baron Brassbelly | **1× Mesa Pit-Fighter (R)**, **2× Howling Charger (U)**, **1× Halberdier (C)**, **1× Shieldbearer (C)**, **1× Badland Runt (C)**, **1× River Knight (U)**, **1× Halberdier (C)**, **1× Crossbow Guard (C)**, **1× River Knight (U)**, **1× Shieldbearer (C)**, **1× Halberdier (C)**, **1× Tusk Brute (C)**, 1× Militia Recruit (C), 1× Crossbow Guard (C), 1× Militia Recruit (C), 1× Shieldbearer (C), 1× Shield Wall (C), 1× Dawn Cleric (U), 1× Gate Warden (U), 2× Scrap Raider (C), 1× Dawn Cleric (U), 1× War Drums (U), 1× Militia Recruit (C), 1× Scrap Raider (C), 1× Crossbow Guard (C), 1× Gate Warden (U), 1× Tusk Brute (C), 1× Iron Bulwark (E) |
| 20. Boss Snikkit | **1× Tunnel Saboteur (C)**, **1× Pack Stalker (U)**, **1× Mine Sapper (R)**, **1× Rocket Barrel Rider (U)**, **1× Ember Shaman (C)**, **1× Junk Slinger (C)**, **1× Ankle Snatcher (C)**, **1× Mine Sapper (R)**, **2× Ankle Snatcher (C)**, **1× Pinning Shot (C)**, **1× Hunter's Focus (R)**, **1× Sidestep Shiv (U)**, **1× Skybreaker (U)**, **1× Grease Trapper (U)**, 1× Bomb Lobber (U), 1× Rocket Barrel Rider (U), 1× Junk Slinger (C), 2× Scrap-Plate Guard (C), 2× Howling Charger (U), 1× Sidestep Shiv (U), 1× Tunnel Saboteur (C), 1× Quick Shot (C), 2× Harrying Shot (C), 1× Sidestep Shiv (U), 1× Grease Trapper (U), 1× Long Shot (U) |
| 30. Lady Glimmerbough | **1× Fuse Runner (C)**, **1× Elderreed Dartmaster (R)**, **1× Ankle Snatcher (C)**, **1× Amberwing Dart (R)**, **3× Bramble Duelist (C)**, **1× Mosspitcher Lookout (C)**, **1× Junk Slinger (C)**, **1× Cleanse (R)**, 2× Radiant Strike (C), 1× Acorn Tender (C), 1× Dewkeeper (U), 1× Junk Walker (R), 1× Bomb Lobber (U), 1× Glade Turnblade (U), 1× Unbroken Vow (R), 1× Dewkeeper (U), 1× Mosspitcher Lookout (C), 1× Seedwind Shepherd (R), 1× Bramble Nest (U), 1× Glade Turnblade (U), 1× Bramble Nest (U), 1× Blessing of Light (C), 1× Fuse Runner (C), 1× Glade Turnblade (U), 1× Fernwing Courier (C), 1× Canopy Skirmisher (U), 1× Penance (U) |
| 40. The Old Bramble | **1× Woolly Mammoth (R)**, **1× Avalanche Yeti (R)**, **1× Crag Rhino (U)**, **1× Amberwing Dart (R)**, **1× Cave Bear (C)**, **1× Rimebreath Drake (R)**, **2× Bristleback Boar (C)**, **1× Boulder Tortoise (U)**, **1× Crag Rhino (U)**, **1× Boulder Tortoise (U)**, **1× Cave Bear (C)**, **1× Shield Wall (C)**, 1× Crag Lizard (C), 1× Call to Arms (R), 1× Tailsweep Basilisk (U), 2× Cave Troll (U), 2× Bramble Duelist (C), 2× Thornline Archer (U), 2× Cleave (U), 1× Call to Arms (R), 1× Expose Weakness (R), 1× Crag Rhino (U), 1× Shield Bash (C), 1× Ground Slam (U), 1× Web Spitter (C) |
| 50. Queen Marrow | **1× Pale Galloper (U)**, **1× Winter Maw (R)**, **1× Rime-Eye Reaper (U)**, **2× Lantern Widow (R)**, **2× Coffin Lancer (R)**, **1× Rimebreath Drake (R)**, **1× Woolly Mammoth (R)**, **1× Rime-Eye Reaper (U)**, **1× Winter Maw (R)**, **1× Rimebreath Drake (R)**, 1× Pale Galloper (U), 1× Grave Bell Tender (C), 1× Wildfire (R), 2× Graveyard Drudge (C), 2× Rattleknife (C), 2× Chattering Cohort (U), 1× Ossuary Piper (U), 2× Frost Bolt (C), 1× Frost Shards (C), 1× Arc Lightning (U), 1× Thunderstorm (R), 1× Rattleknife (C), 1× Arc Lightning (U), 1× Spark (C) |

### 8.6 Results

| Floor | Enemy | Recommended level | Hero HP | Win rate (Vanguard / Raiders) | Expected Gear | Win rate at Expected Gear (Vanguard / Raiders) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Spire Warden Holt | 23 | 50 | 62% / 68% | 13 / 13 / 13 / 13 | 76% / 79% |
| 2 | Emberchief Razka | 23 | 50 | 63% / 65% | 13 / 13 / 13 / 13 | 76% / 78% |
| 3 | Trapmaster Krink | 23 | 50 | 61% / 65% | 13 / 13 / 13 / 13 | 78% / 77% |
| 4 | Grove Sister Myrra | 23 | 50 | 63% / 67% | 13 / 13 / 13 / 13 | 76% / 78% |
| 5 | Beastmaster Brokk | 23 | 50 | 63% / 65% | 13 / 13 / 13 / 13 | 76% / 78% |
| 6 | Bonecaptain Rusk | 23 | 50 | 63% / 67% | 13 / 13 / 13 / 13 | 77% / 78% |
| 7 | Lightbearer Anselm | 23 | 50 | 61% / 66% | 13 / 13 / 13 / 13 | 75% / 78% |
| 8 | Warboss Gnash | 23 | 50 | 64% / 64% | 13 / 13 / 13 / 13 | 78% / 79% |
| 9 | Rimecaller Isolde | 23 | 50 | 61% / 68% | 13 / 13 / 13 / 13 | 73% / 77% |
| 10 | Baron Brassbelly (Boss) | 23 | 64 | 28% / 34% | 13 / 13 / 13 / 13 | 45% / 50% |
| 11 | Spire Warden Holt | 23 | 52 | 62% / 67% | 13 / 13 / 13 / 13 | 75% / 79% |
| 12 | Emberchief Razka | 23 | 52 | 62% / 64% | 13 / 13 / 13 / 13 | 76% / 77% |
| 13 | Trapmaster Krink | 23 | 52 | 61% / 64% | 13 / 13 / 13 / 13 | 78% / 77% |
| 14 | Grove Sister Myrra | 23 | 52 | 62% / 66% | 13 / 13 / 13 / 13 | 76% / 77% |
| 15 | Beastmaster Brokk | 23 | 52 | 62% / 65% | 13 / 13 / 13 / 13 | 76% / 78% |
| 16 | Bonecaptain Rusk | 24 | 52 | 63% / 66% | 14 / 13 / 13 / 13 | 77% / 78% |
| 17 | Lightbearer Anselm | 24 | 52 | 61% / 65% | 14 / 13 / 13 / 13 | 76% / 79% |
| 18 | Warboss Gnash | 24 | 52 | 64% / 64% | 14 / 14 / 13 / 13 | 78% / 79% |
| 19 | Rimecaller Isolde | 24 | 52 | 60% / 67% | 14 / 14 / 13 / 13 | 74% / 77% |
| 20 | Boss Snikkit (Boss) | 24 | 62 | 31% / 33% | 14 / 14 / 14 / 13 | 50% / 51% |
| 21 | Spire Warden Holt | 24 | 54 | 61% / 67% | 14 / 14 / 14 / 13 | 76% / 79% |
| 22 | Emberchief Razka | 24 | 54 | 62% / 64% | 14 / 14 / 14 / 13 | 76% / 77% |
| 23 | Trapmaster Krink | 24 | 54 | 60% / 64% | 14 / 14 / 14 / 13 | 78% / 77% |
| 24 | Grove Sister Myrra | 24 | 54 | 62% / 66% | 14 / 14 / 14 / 14 | 76% / 79% |
| 25 | Beastmaster Brokk | 24 | 54 | 62% / 64% | 14 / 14 / 14 / 14 | 77% / 78% |
| 26 | Bonecaptain Rusk | 24 | 54 | 62% / 66% | 15 / 14 / 14 / 14 | 77% / 78% |
| 27 | Lightbearer Anselm | 25 | 54 | 61% / 65% | 15 / 14 / 14 / 14 | 76% / 79% |
| 28 | Warboss Gnash | 25 | 54 | 64% / 64% | 15 / 15 / 14 / 14 | 79% / 80% |
| 29 | Rimecaller Isolde | 25 | 54 | 61% / 67% | 15 / 15 / 14 / 14 | 74% / 77% |
| 30 | Lady Glimmerbough (Boss) | 25 | 41 | 30% / 33% | 15 / 15 / 14 / 14 | 45% / 48% |
| 31 | Spire Warden Holt | 25 | 56 | 61% / 67% | 15 / 15 / 14 / 14 | 77% / 80% |
| 32 | Emberchief Razka | 25 | 56 | 62% / 64% | 15 / 15 / 14 / 14 | 77% / 79% |
| 33 | Trapmaster Krink | 25 | 56 | 60% / 64% | 15 / 15 / 14 / 14 | 79% / 78% |
| 34 | Grove Sister Myrra | 25 | 56 | 61% / 65% | 15 / 15 / 14 / 14 | 76% / 78% |
| 35 | Beastmaster Brokk | 26 | 56 | 62% / 64% | 15 / 15 / 14 / 14 | 78% / 78% |
| 36 | Bonecaptain Rusk | 26 | 56 | 62% / 67% | 15 / 15 / 14 / 14 | 78% / 78% |
| 37 | Lightbearer Anselm | 26 | 56 | 60% / 64% | 15 / 15 / 14 / 14 | 76% / 79% |
| 38 | Warboss Gnash | 26 | 56 | 64% / 63% | 15 / 15 / 14 / 14 | 79% / 80% |
| 39 | Rimecaller Isolde | 26 | 56 | 61% / 67% | 15 / 15 / 14 / 14 | 73% / 77% |
| 40 | The Old Bramble (Boss) | 26 | 50 | 27% / 36% | 15 / 15 / 14 / 14 | 49% / 54% |
| 41 | Spire Warden Holt | 26 | 58 | 61% / 67% | 15 / 15 / 15 / 14 | 76% / 80% |
| 42 | Emberchief Razka | 26 | 58 | 61% / 64% | 15 / 15 / 15 / 14 | 77% / 79% |
| 43 | Trapmaster Krink | 27 | 58 | 60% / 64% | 15 / 15 / 15 / 14 | 80% / 78% |
| 44 | Grove Sister Myrra | 27 | 58 | 61% / 65% | 15 / 15 / 15 / 15 | 76% / 79% |
| 45 | Beastmaster Brokk | 27 | 58 | 61% / 64% | 15 / 15 / 15 / 15 | 78% / 79% |
| 46 | Bonecaptain Rusk | 27 | 58 | 62% / 67% | 15 / 15 / 15 / 15 | 78% / 79% |
| 47 | Lightbearer Anselm | 27 | 58 | 60% / 63% | 16 / 15 / 15 / 15 | 76% / 80% |
| 48 | Warboss Gnash | 27 | 58 | 64% / 63% | 16 / 15 / 15 / 15 | 79% / 80% |
| 49 | Rimecaller Isolde | 27 | 58 | 60% / 66% | 16 / 15 / 15 / 15 | 74% / 77% |
| 50 | Queen Marrow (Boss) | 27 | 56 | 30% / 33% | 16 / 16 / 15 / 15 | 46% / 50% |


**Retune of 2026-10-24.** The win rates in the table come from a run of `bun rules:sim:check` on 2026-10-24. All 200 rows are on their target. Pack Stalker has 4 HP (it had 5) and Thornline Archer has 5 HP (it had 4), for the Raiders Matchups ([08 — Archetypes, 3.1](./08-archetypes.md#31-balance-changes)). These cards are in the Decks of templates 2, 4, 7 and 8 and of Floors 20 and 40. After the card change, templates 4 and 7 had Vanguard with no Gear at 55.7% to 59.7%, and template 2 had Raiders with the Expected Gear at 80.5% to 80.8% (Floors 32 and 42). A Boss Floor now has a window for each Gear row: 25% to 50% with no Gear, and 30% to 55% with the Expected Gear ([ADR-0033](../adr/0033-a-stage-hits-its-target-with-no-gear-and-with-the-expected-gear.md)). A search with the sim (1000 Battles for each row) found these changes, by the copy number in the Deck:

- Template 2: copies 2 (Pack Stalker) and 19 (Warhowler Drummer) change places. 61.2% to 79.2% on its 5 Floors.
- Template 4: 22: Thornline Archer → Mosspitcher Lookout. 27: Radiant Strike → Fernwing Courier. 61.3% to 78.9%.
- Template 7: 19: Thornline Archer → Mosspitcher Lookout. 28: Dewkeeper → Crossbow Guard. 30: Thornline Archer → Acorn Tender. 60.2% to 79.5%. This is the only change of 120 tries that put all 20 rows on target, and its margins are small (0.2 and 0.5 points). The last copies of a Deck change which Hands the seeds deal, so one card can move a row by 5 points.
- Floor 40: Hero HP 50 (it was 58), 6 stepped copies (it was 13), and Banner 10 (8.5). Vanguard and Raiders win 26.9% / 35.8%, then 48.7% / 53.5% with the Expected Gear. With the Banner, other mixes gave a gap of 28 to 31 points.
- Floor 10 does not change. Its rows (28.2% / 34.3%, then 45.0% / 49.5%) are on the new windows.

On 2026-10-17, Heroic changed: after a Unit attacks an enemy Unit, it gets +N Attack ([ADR-0046](../adr/0046-heroic-gives-attack-after-each-attack-on-a-unit.md)). Then the AI started to count the Heroic bonus (issue [#109](https://github.com/rifandani/heynbord/issues/109)). Before the retune of 2026-10-24, the win rates in the table came from a new run of `bun scripts/simulate.ts 1000 --check` in `packages/rules` after issue #109. All rows are on their target, except Floor 10 and the no-Gear rows of Floor 40 (see below). The next paragraphs tell the earlier runs. The first retune for Heroic changed these templates. Template 2 (Emberchief Razka): a Pack Stalker and a Howling Charger replace 2 Scrap Raiders, a Mesa Pit-Fighter replaces the first Tusk Brute, and a Bonestake Palisade replaces 1 of the next 2 Tusk Brutes. Template 8 (Warboss Gnash): a Badland Runt replaces 1 Scrap Raider, a Pack Stalker replaces the Skyreaver, and an Ankle Snatcher replaces the first Tusk Brute. Floor 10: a Shieldbearer replaces the first Tusk Brute. Floor 20: a Mine Sapper replaces the Grukka copy, and 2 Sidestep Shivs replace the Skyreaver and the Pyreaxe Ravager.

**Issue #109 (2026-10-17).** The AI now counts the Heroic bonus in the value of a Unit and in the threat and the defense of a Lane (GDD 9). The AI plays both Sides in the sim, so this change moved all rows. After the AI change and before the content changes (1000 Battles), Raiders with the Expected Gear won 80.2% to 85.4% of 32 normal Floors, and Vanguard with the Expected Gear won 80.1% to 80.7% of Floors 18, 28, 38 and 48 (template 8). Raiders with the Expected Gear won 51.2% to 61.0% of the 5 Boss Floors, and Vanguard with the Expected Gear won 52.9% of Floor 10 and 50.3% of Floor 20. Each change is to the enemy only.

- **The curve of the normal Floors does not change.** It moves all rows of a Floor together. On a normal Floor, the gap between Vanguard with no Gear and Raiders with the Expected Gear was 19 to 21 points, and the window is 20 points. Tests on Floors 7 and 35 (Vanguard with no Gear, Raiders with the Expected Gear): Hero HP +2: 61.3% and 81.0%, then 60.6% and 80.7%. 13 stepped copies: 53.8% and 76.0%, then 60.7% and 81.3%. 11 stepped copies and Hero HP +6: 61.1% and 80.5%, then 60.7% and 81.2%.
- **Templates.** A local search with the sim tuned templates 1 and 3 to 9, as in 8.3: it changed the order of 2 copies, or it put another card of the Races or the Class of the template in place of a copy. It kept a change that put the 4 rows of 2 Floors of the template nearer to 61% to 79% (1000 Battles for each row). Template 2 did not change. The changes, by the copy number in the Deck (1 is the first copy):
  - Template 1: 1: Howling Charger → Shoulder Charge. 7: Halberdier → Howling Charger. 8: Halberdier → Call to Arms. 22: Spear Throw → Ground Slam. 25: Shoulder Charge → Howling Charger. 29: Call to Arms → Halberdier.
  - Template 3: copies 10 (Fuse Runner) and 18 (Bomb Lobber) change places.
  - Template 4: 26: Mend → Cleanse.
  - Template 5: 7: Hunter's Focus → Frostfang Lynx. 9: Venom Arrow → Crag Lizard. 23: Quick Shot → Crag Rhino. 26: Barbed Arrow → Venom Arrow. 27: Crag Lizard → Barbed Arrow. 30: Frostfang Lynx → Hunter's Focus.
  - Template 6: 7: Coffin-Lid Skater → Rattleknife. 9: Grave Bell Tender → Spear Throw. 11: Rime-Eye Reaper → Ossuary Piper. 18: Ossuary Piper → Rime-Eye Reaper. 23: Spear Throw → Grave Bell Tender.
  - Template 7: 2: Militia Recruit → Bramble Nest. 5: Crossbow Guard → Dawn Cleric. 8: Halberdier → Amberwing Dart. 9: Bramble Duelist → Militia Recruit. 13: Dawn Cleric → Crossbow Guard. 16: Prayer of Healing → Sanctuary. 21: Amberwing Dart → Halberdier. 23: Smite → Radiant Strike. 25: Militia Recruit → Bramble Duelist. 27: Mend → Smite. 29: Bramble Nest → Militia Recruit.
  - Template 8: 2: Scrap Raider → Scrap-Plate Guard. 7: Ankle Snatcher → Spear Throw. 8: Warhowler Drummer → Mine Sapper. 11: Pack Stalker → Mine Sapper. 14: Mine Sapper → Pack Stalker. 21: Junk Walker → Warhowler Drummer. Before, template 8 was the easiest template: Vanguard won 66% to 68% with no Gear, and Raiders won 84% to 85% with the Expected Gear.
  - Template 9: 8: Pale Galloper → Thunderstorm. 9: Rattleknife → Chattering Cohort. 11: Spark → Bristleback Boar. 15: Thunderstorm → Pale Galloper. 18: Bristleback Boar → Spark. 21: Frost Bolt → Coffin-Lid Skater. 27: Chattering Cohort → Rattleknife.
- **Boss Floors.** First the search changed only the Hero HP and the stepped copies of each Boss Floor. The gap between Vanguard with no Gear and Raiders with the Expected Gear stayed 20 to 23 points, so the search then changed the Boss Decks too. The Hero HP and the stepped copies are in 8.5. At 2000 Battles, Floors 10 and 30 moved by 1 to 3 points from their 1000-Battle results, so a second search used 2000 Battles for them.
  - Floor 10: Hero HP 64 (it was 68), 13 stepped copies (it was 12). 1: Iron Bulwark → Mesa Pit Fighter. 2 and 3: Gate Warden → Howling Charger. 11: Shield Wall → Shieldbearer. 18: Shieldbearer → Shield Wall. 20 and 28: Howling Charger → Gate Warden. 29: Call to Arms → Tusk Brute. 30: Mesa Pit Fighter → Iron Bulwark.
  - Floor 20: Hero HP 62 (it was 56), 15 stepped copies (it was 10). 2: Spyglass Sniper → Pack Stalker. 5: Junk Slinger → Ember Shaman. 12: Grease Trapper → Hunter's Focus. 14: Hunter's Focus → Skybreaker. 29: Hunter's Focus → Grease Trapper.
  - Floor 30: Hero HP 41 (it was 44), 10 stepped copies (it was 9). 10: Fernwing Courier → Cleanse. 12: Prayer of Healing → Radiant Strike. 23: Mend → Glade Turnblade. 28: Cleanse → Fernwing Courier. 29: Seedwind Shepherd → Canopy Skirmisher. Now 30% / 33%, then 45% / 48% (2000 Battles: 30.4% / 33.5%, then 45.2% / 49.9%).
  - Floor 40: Hero HP 58 (it was 52). 4: Crag Rhino → Amberwing Dart. 13: Crag Lizard → Shield Wall. 27: Shield Wall → Crag Rhino.
  - Floor 50: Hero HP 56 (it was 52). 28: Grave Bell Tender → Rattleknife.
- **Floor 40 is not on its target after the Heavy bodyguard fix.** The Mountain Colossus now starts in Lane 3, next to the Bramble Nest instead of behind it (Stage 4-10, 5.2). It is active from the first Turn. At 1000 Battles, Vanguard and Raiders with no Gear win 21.6% and 29.3%, then 42.7% and 47.3% with the Expected Gear. The 2 no-Gear rows are under the target. The old layout blocked the Heavy Colossus, and that block was part of the tuned difficulty. A retune or a decision is open for this Floor.
- **Floor 10 is not on its target.** At 1000 Battles, Vanguard with no Gear wins 28.2% (1.8 points under the target), and Raiders with the Expected Gear wins 49.5%. At 2000 Battles, they win 28.3% and 51.3% (1.7 and 1.3 points outside the target). The gap between these two rows is about 21 to 23 points, and the Boss window is 20 points. The search put the rows in the middle at 2000 Battles. The Deck before the last change (copies 2 and 28 in the other order) won 29.6% and 50.0% at 1000 Battles, but 30.1% and 52.5% at 2000 Battles. A wider Boss window, or Boss Floors that check only the Expected Gear rows, is a change to ADR-0040, and it needs its own issue and ADR. The maintainer decides (issue #109).

All win rates come from one run of `bun scripts/simulate.ts floor 1000 --check` in `packages/rules` on 2026-10-16 (issue [#97](https://github.com/rifandani/heynbord/issues/97)), before the Heavy bodyguard fix of 2026-10-20. All 200 rows are on their target, with no Gear and with the Expected Gear. The margins are small. On the normal Floors, the lowest row is 61.0% (Floor 47, Vanguard with no Gear) and the highest row is 79.5% (Floors 29 and 39, Raiders with the Expected Gear). On the Boss Floors, the lowest row is 30.2% and the highest row is 49.3% (both on Floor 40, Raiders).

## 9. When a Stage changes

1. Change the data in `stages.ts`.
2. Run `bun run sim stage 1000` in `packages/rules`. Each Stage must be in its target with each Starter Deck, with no Gear and with its Expected Gear. CI runs `bun run rules:sim:check`, and it fails when a Stage is not on its target.
3. Update the tables of the Region (sections 2 to 6).
4. If the name or the place changes, update the Message Catalogs and the landmark on the Region Map (12 — Region Concepts, section 2).

For a Dungeon, change the data in `dungeons.ts`, run `bun run sim dungeon 1000`, and update section 7.

For a Floor, change a template or the curve in `floors.ts`, run `bun run sim floor 1000`, and update section 8. A change to a template changes its 5 Floors, and a change to the order of a template Deck changes the win rates too (8.1).
