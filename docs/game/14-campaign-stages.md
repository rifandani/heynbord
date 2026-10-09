# 14 — Campaign Stages

This document gives the design of each Stage of the Campaign: its place, its enemy, the new thing that it teaches, its enemy Deck and its first-win card. The rules for all Stages are in [GDD 8.1](./03-game-design.md#81-campaign). The data is in `packages/rules/src/content/stages.ts`. The Stage names and the enemy names are in the Message Catalogs (`apps/web/src/core/libs/i18n/locales/`). The landmark of each Stage is on its Region Map ([12 — Region Concepts](./12-region-concepts.md)).

Now only Region 1 has Stages. All names are draft names (README, "Status of names").

## 1. Rules for the Stages

- **One new thing for each Stage.** Each Stage after the Tutorial teaches one new thing. Stage 9 tests all of them, and the Boss Stage tests them with the Boss rule.
- **The place is the landmark.** The name of a Stage is a place on the Trail. The Region Map shows that place as the landmark next to the Stage Marker. The Battle does not show the landmark: all Stages of a Region use the one Battle Painting of the Region ([13 — Battlefield Concepts](./13-battlefield-concepts.md)).
- **Only the current tools.** A Stage uses only the cards that exist and the fields of the Stage data: enemy Class, Hero HP, Gear, Deck, Closed Lanes and Start Units. A new rule type needs its own design.
- **The Boss is the largest.** The Boss Stage has the largest enemy Hero HP and the largest Deck of its Region (GDD 8.1).
- **First-win card.** Each Stage gives one fixed card on its first win: a card of the enemy Deck of that Stage, in its Base Rank. The cards are mixed, so that they help each Starter Deck. The data is the `firstWinCard` field of each Stage. The reward code does not exist yet.
- **Deck size of a new Player.** An enemy Deck has the same size as the expected Deck of a new Player at the Recommended level (see 1.1), or 1 card less. The Boss Deck is the exception: it is larger than all other Decks of its Region. The enemy gets stronger with Rank, Gear and Start Units, not with more cards. A side that has more cards keeps summoning after the other side has no cards, and that decides the Battle more than Hero HP.
- **Win-rate target.** The target is for a new player Deck on the first try (GDD 13): Stage 1-1 ≥ 95%, 1-2 ≥ 85%, 1-3 ≥ 75%, other Stages 60% to 80%, Boss Stages 30% to 50%.
- **Tuned for the Starter Decks.** Each copy in a Starter Deck has the Rank Common or Uncommon ([GDD 6.1](./03-game-design.md#61-starter-decks)). Thus a new player has no Epic card in Region 1, and the first win of the Boss Stage gives the first Epic. The Starter Deck guides are also in GDD 6.1: 10 cards, each copy at its Base Rank, Common Creature Cards in pairs or triples, and at least 1 Skill Card of the Class.
- **Tune the enemy strength first.** To change the difficulty of a Stage, first change Hero HP, Gear, the Ranks of the enemy cards and Start Units. Change an enemy Deck card or a first-win card only when the Stage cannot reach its target in another way, because these cards are the identity of the Stage.

### 1.1 Recommended level

Each Stage has a **Recommended level**: the Player level that the **First-try Path** gives before the Stage ([Economy 1.2](./07-economy.md#12-player-levels)). The First-try Path is the first win of each earlier Stage, in Stage order, with no losses and no repeats. The Player sees the Recommended level. It is the `recommendedLevel` field of each Stage in `stages.ts`.

The simulation (`bun run sim stage` in `packages/rules`) plays each Stage with the **expected Deck** of each Starter Deck, at the Recommended level of the Stage, with no Gear. Gear unlocks at player level 5 (GDD 7.1), so a new player has no Gear in Region 1.

The expected Deck is the Starter Deck (10 cards), then the first-win cards of the earlier Stages, in Stage order, up to the maximum Deck size at the Recommended level (GDD 6). It skips a fourth copy of a card, a Skill Card of another Class and a card that puts the Deck over the Countdown Limit of the Recommended level ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md)). For example, at Stage 1-5 (level 3, maximum 12 cards) the expected Vanguard Deck is the Starter Deck, Militia Recruit and Scrap Raider. The expected Raiders Deck already has 3 Scrap Raiders and 3 Ember Shamans, so it skips the first-win cards of Stages 1-2 and 1-3, and it gets Militia Recruit and Shieldbearer.

A content test checks that each Recommended level is the level of the First-try Path. A Player who loses or plays again has more XP, so the Recommended level is a floor. When the XP table, a first-win XP reward (Economy 2.1) or the Stage order changes, update the `recommendedLevel` values in `stages.ts`. Then run `bun run sim stage` again.

## 2. Region 1: Hearthvale

The band of **Baron Brassbelly**: Human outlaws and the Orc sellswords that he pays (GDD 3.3). They hold the roads of the valley, from the ford near the Town to the Baron's hall on the hill.

### 2.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 1-1 | The Muddy Ford | Bandit Scout (Warrior) | A shallow, muddy river ford with stepping stones | **The Tutorial** (GDD 8.3). A small, weak Deck. |
| 1-2 | Two Bridges | Bandit Twins (Warrior) | Two small wooden bridges side by side over a stream | **Fast enemies:** Runners, Charge and a ranged Unit. |
| 1-3 | The Burning Mill | Hedge Witch (Mage) | A water mill with a burning roof | **Enemy spells:** the first Mage spells that hit Units, and Flying. |
| 1-4 | The Toll Gate | Toll Sergeant (Warrior) | A wooden toll gate across the road | **Walls:** Armor, Pivot and Retaliate. The Player learns to attack in another Lane, or to use Fire and Frost. |
| 1-5 | The Outlaw Camp | Camp Cook (Warrior) | Tents, a campfire and a very big pot | **Start Units:** 3 outlaw Units are on the Board at the start. A Shieldbearer holds the middle Lane. This prepares the Player for the Boss bodyguard. |
| 1-6 | The Old Watchtower | Watchtower Hexer (Mage) | A ruined stone watchtower | **Ranged enemies:** Ember Shamans behind a front line of Halberdiers and Shieldbearers, with Mage spells. |
| 1-7 | The Sellsword Camp | Sellsword Captain (Warrior) | An Orc camp with war drums | **Rush:** Charge, Flying and fast Runners. A race to the enemy Hero. |
| 1-8 | The Rockfall Pass | Pass Warden (Warrior) | A narrow rocky pass with fallen rocks | **The first Closed Lane:** Lane 1 is closed until Turn 5, while the outlaws clear the rocks. |
| 1-9 | The Great Oak | The Baron's Lookout (Mage) | A very large oak with a lookout platform | **The final test:** walls, ranged Units, Flying and spells together. |
| 1-10 | Brassbelly Hall | Baron Brassbelly (Warrior) — **Boss** | A fortified hall on a hill, with a roof in the shape of a very large hat | **The Boss rule:** the Baron's bodyguard, an Epic Shieldbearer, is a Start Unit in the center Lane. |

### 2.2 Numbers

Lane numbers are from the top, 1 to 3. A Start Unit position is its Column for the Player (1 is next to the Player's Hero). Gear is weapon / armor / trinket / banner.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1-1 | 6 | 0 / 0 / 0 / 0 | 10 | — | — | Militia Recruit (Common) | 1 | 100% / 100% |
| 1-2 | 32 | 2 / 0 / 0 / 2 | 9 | — | — | Scrap Raider (Common) | 1 | 94% / 94% |
| 1-3 | 38 | 3 / 0 / 3 / 3 | 10 | — | — | Ember Shaman (Common) | 2 | 85% / 85% |
| 1-4 | 38 | 0 / 0 / 0 / 0 | 10 | — | — | Shieldbearer (Common) | 2 | 70% / 79% |
| 1-5 | 42 | 3 / 0 / 3 / 3 | 11 | — | Militia Recruit (Common), Lane 1, Column 10 · Shieldbearer (Common), Lane 2, Column 10 · Crossbow Guard (Common), Lane 3, Column 11 | Crossbow Guard (Common) | 3 | 73% / 66% |
| 1-6 | 42 | 1 / 0 / 1 / 1 | 11 | — | — | Dawn Cleric (Uncommon) | 3 | 74% / 68% |
| 1-7 | 34 | 3 / 0 / 2 / 3 | 12 | — | — | Howling Charger (Uncommon) | 4 | 74% / 65% |
| 1-8 | 40 | 3 / 0 / 3 / 3 | 12 | Lane 1, opens on Turn 5 | Militia Recruit (Common), Lane 2, Column 12 | Gate Warden (Uncommon) | 4 | 74% / 66% |
| 1-9 | 36 | 0 / 0 / 0 / 0 | 13 | — | — | River Knight (Uncommon) | 5 | 68% / 70% |
| 1-10 | 44 | 1 / 0 / 0 / 1 | 14 | — | Shieldbearer (Epic), Lane 2, Column 11 | Iron Bulwark (Epic) | 5 | 40% / 40% |

The win rates come from `bun run sim stage 1000` on 2026-10-08, after the Ticking Cards were removed (issue #26).

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

On 2026-10-08, Speed 1 became the default, and the Role sets more Speed ([ADR-0024](../adr/0024-speed-1-is-the-default.md)). Militia Recruit became 3/8 with Speed 1 (it was 3/6 with Speed 2). The Starter Decks and many enemy Decks have Militia Recruits. After the change, Raiders won 57% of Stage 1-5, and Vanguard won 60% of Stage 1-4. The bot of the Tutorial simulation in the web app won 92.5% of Stage 1-1. These enemy Decks changed:

- **1-1:** 1 Militia Recruit became a third Shieldbearer (C). The Militia Recruits stay, because one is the first-win card. A third Scrap Raider also worked, but the Tutorial bot won less often with it (96.8% and 94.5% over 400 seeds, against 98.0% and 95.0%).
- **1-4:** the Tusk Brute became a Scrap Raider (C). Vanguard wins 65% and Raiders 79%. Each Rank change on the Crossbow Guards put Raiders at 80% or more. Gate Warden is already at its Base Rank.
- **1-5:** the Militia Recruit Start Unit is Common (it was Uncommon). The Common 3/8 has almost the stats of the old Uncommon 4/7.

On 2026-10-08, the Ticking Cards were removed, and all Cards in the Hand count down again ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md), issue #26). The Power Budget stays `21 + 3 × (Countdown − 3)`, so no card changed. Raiders then won 58% of Stage 1-6 and 49% of 1-7, and Vanguard won 81% of 1-8 (1000 seeds). These enemy Decks changed:

- **1-6:** the Militia Recruit is Common (it was Uncommon). Both Shieldbearers at Uncommon also worked (71% / 65%), but this change gives both Decks more margin.
- **1-7:** Spear Throw is Uncommon (it was Rare), its Base Rank. The other Rank, Hero HP and Gear changes left Raiders at 56% or less, or put Vanguard above 80%.
- **1-8:** the Scrap Raider is Rare (it was Common). With an Uncommon Scrap Raider, Vanguard won 77%. A Rare Crossbow Guard put Raiders at 48%.

Some margins are thin: Raiders wins 79% of Stage 1-4. The Tutorial bot wins 95.0% of Stage 1-1 with Raiders over 400 seeds.

### 2.3 Enemy Decks

C, U, R and E are the Ranks Common, Uncommon, Rare and Epic.

| Stage | Deck |
| --- | --- |
| 1-1 | 2× Militia Recruit (C), 2× Badland Runt (C), 3× Shieldbearer (C), 2× Scrap Raider (C), 1× Halberdier (C) |
| 1-2 | 2× Badland Runt (C), 2× Scrap Raider (C), 1× Militia Recruit (C), 1× Crossbow Guard (U), 2× Howling Charger (U), 1× War Drums (C) |
| 1-3 | 1× Badland Runt (C), 2× Ember Shaman (C), 1× Shieldbearer (C), 2× Skyreaver (U), 2× Frost Bolt (C), 1× Fireball (C), 1× Flame Wave (U) |
| 1-4 | 3× Shieldbearer (C), 2× Gate Warden (U), 2× Halberdier (C), 1× Scrap Raider (C), 2× Crossbow Guard (U) |
| 1-5 | 2× Militia Recruit (C), 1× Scrap Raider (C), 1× Badland Runt (U), 1× Crossbow Guard (C), 2× Halberdier (C), 3× Shieldbearer (C), 1× Spear Throw (U) |
| 1-6 | 2× Halberdier (C), 2× Ember Shaman (C), 2× Shieldbearer (R), 1× Dawn Cleric (U), 1× Militia Recruit (C), 2× Frost Bolt (C), 1× Fireball (C) |
| 1-7 | 1× Halberdier (C), 1× Ember Shaman (C), 2× Scrap Raider (U), 1× Pack Stalker (R), 1× Howling Charger (U), 1× Howling Charger (R), 2× Skyreaver (U), 1× Skyreaver (R), 1× Tusk Brute (R), 1× Spear Throw (U) |
| 1-8 | 1× Shieldbearer (C), 1× Shieldbearer (R), 2× Halberdier (C), 1× Halberdier (U), 1× Crossbow Guard (U), 1× Gate Warden (U), 1× Scrap Raider (R), 2× Howling Charger (U), 1× Tusk Brute (R), 1× Shield Wall (C) |
| 1-9 | 1× Crossbow Guard (U), 1× Crossbow Guard (C), 1× Ember Shaman (C), 1× Halberdier (C), 1× Shieldbearer (C), 2× Skyreaver (U), 1× Scrap Raider (C), 1× Militia Recruit (C), 1× Dawn Cleric (U), 1× River Knight (U), 1× Frost Bolt (C), 1× Fireball (C) |
| 1-10 | 3× Militia Recruit (C), 1× Gate Warden (R), 2× Shieldbearer (C), 1× Crossbow Guard (C), 1× Crossbow Guard (U), 2× Halberdier (U), 1× Iron Bulwark (E), 1× Spear Throw (U), 1× Shield Wall (U), 1× War Drums (C) |

## 3. When a Stage changes

1. Change the data in `stages.ts`.
2. Run `bun run sim stage 1000` in `packages/rules`. Each Stage must be in its target with each Starter Deck. CI runs `bun run rules:sim:check`, and it fails when a Stage is not on its target.
3. Update the tables in section 2.
4. If the name or the place changes, update the Message Catalogs and the landmark on the Region Map (12 — Region Concepts, section 2).
