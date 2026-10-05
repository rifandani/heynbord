# 14 — Campaign Stages

This document gives the design of each Stage of the Campaign: its place, its enemy, the new thing that it teaches, its enemy Deck and its first-win card. The rules for all Stages are in [GDD 8.1](./03-game-design.md#81-campaign). The data is in `packages/rules/src/content/stages.ts`. The Stage names and the enemy names are in the Message Catalogs (`apps/web/src/core/libs/i18n/locales/`). The landmark of each Stage is on its Region Map ([12 — Region Concepts](./12-region-concepts.md)).

Now only Region 1 has Stages. All names are draft names (README, "Status of names").

## 1. Rules for the Stages

- **One new thing for each Stage.** Each Stage after the Tutorial teaches one new thing. Stage 9 tests all of them, and the Boss Stage tests them with the Boss rule.
- **The place is the landmark.** The name of a Stage is a place on the Trail. The Region Map shows that place as the landmark next to the Stage Marker.
- **Only the current tools.** A Stage uses only the cards that exist and the fields of the Stage data: enemy Class, Hero HP, Gear, Deck, Closed Lanes and Start Units. A new rule type needs its own design.
- **The Boss is the largest.** The Boss Stage has the largest enemy Hero HP and the largest Deck of its Region (GDD 8.1).
- **First-win card.** Each Stage gives one fixed card on its first win: a card of the enemy Deck of that Stage, in its Base Rank. The cards are mixed, so that they help each Starter Deck. The data is the `firstWinCard` field of each Stage. The reward code does not exist yet.
- **Deck size of a new Player.** An enemy Deck has the same size as the expected Deck of a new Player at the Recommended level (see 1.1), or 1 card less. The Boss Deck is the exception: it is larger than all other Decks of its Region. The enemy gets stronger with Rank, Gear and Start Units, not with more cards. A side that has more cards keeps summoning after the other side has no cards, and that decides the Battle more than Hero HP.
- **Win-rate target.** The target is for a new player Deck on the first try (GDD 13): Stage 1-1 ≥ 95%, 1-2 ≥ 85%, 1-3 ≥ 75%, other Stages 60% to 80%, Boss Stages 30% to 50%.

### 1.1 Recommended level

Each Stage has a **Recommended level**: the Player level that the **First-try Path** gives before the Stage ([Economy 1.2](./07-economy.md#12-player-levels)). The First-try Path is the first win of each earlier Stage, in Stage order, with no losses and no repeats. The Player sees the Recommended level. It is the `recommendedLevel` field of each Stage in `stages.ts`.

The simulation (`bun run sim stage` in `packages/rules`) plays each Stage with the **expected Deck** of each Starter Deck, at the Recommended level of the Stage, with no Gear. Gear unlocks at player level 5 (GDD 7.1), so a new player has no Gear in Region 1.

The expected Deck is the Starter Deck (10 cards), then the first-win cards of the earlier Stages, in Stage order, up to the maximum Deck size at the Recommended level (GDD 6). It skips a fourth copy of a card and a Skill Card of another Class. For example, at Stage 1-5 (level 3, maximum 12 cards) it is the Starter Deck, Militia Recruit and Scrap Raider.

A content test checks that each Recommended level is the level of the First-try Path. A Player who loses or plays again has more XP, so the Recommended level is a floor. When the XP table, a first-win XP reward (Economy 2.1) or the Stage order changes, update the `recommendedLevel` values in `stages.ts`. Then run `bun run sim stage` again.

## 2. Region 1: Hearthvale

The band of **Baron Brassbelly**: Human outlaws and the Orc sellswords that he pays (GDD 3.3). They hold the roads of the valley, from the ford near the Town to the Baron's hall on the hill.

### 2.1 Stages

| Stage | Name | Enemy (Class) | Landmark | New thing |
| --- | --- | --- | --- | --- |
| 1-1 | The Muddy Ford | Bandit Scout (Warrior) | A shallow, muddy river ford with stepping stones | **The Tutorial** (GDD 8.3). A small, weak Deck. |
| 1-2 | Two Bridges | Bandit Twins (Warrior) | Two small wooden bridges side by side over a stream | **Fast enemies:** Runners, Charge and a ranged Unit. |
| 1-3 | The Burning Mill | Hedge Witch (Mage) | A water mill with a burning roof | **Enemy spells:** the first Mage spells that hit Units, and Flying. |
| 1-4 | The Toll Gate | Toll Sergeant (Warrior) | A wooden toll gate across the road | **Walls:** Armor, Pivot and Retaliation. The Player learns to attack in another Lane, or to use Fire and Frost. |
| 1-5 | The Outlaw Camp | Camp Cook (Warrior) | Tents, a campfire and a very big pot | **Start Units:** 2 outlaw Units are on the Board at the start. This prepares the Player for the Boss bodyguard. |
| 1-6 | The Old Watchtower | Watchtower Hexer (Mage) | A ruined stone watchtower | **Ranged enemies:** Crossbow Guards and Ember Shamans behind a front line, with Mage spells. |
| 1-7 | The Sellsword Camp | Sellsword Captain (Warrior) | An Orc camp with war drums | **Rush:** Charge, Flying and fast Runners. A race to the enemy Hero. |
| 1-8 | The Rockfall Pass | Pass Warden (Warrior) | A narrow rocky pass with fallen rocks | **The first Closed Lane:** Lane 1 is closed until Turn 5, while the outlaws clear the rocks. |
| 1-9 | The Great Oak | The Baron's Lookout (Mage) | A very large oak with a lookout platform | **The final test:** walls, ranged Units, Flying and spells together. |
| 1-10 | Brassbelly Hall | Baron Brassbelly (Warrior) — **Boss** | A fortified hall on a hill, with a roof in the shape of a very large hat | **The Boss rule:** the Baron's bodyguard, an Epic Shieldbearer, is a Start Unit in the center Lane. |

### 2.2 Numbers

Lane numbers are from the top, 1 to 3. A Start Unit position is its Column for the Player (1 is next to the Player's Hero). Gear is weapon / armor / trinket / banner.

| Stage | Hero HP | Gear | Deck size | Closed Lanes | Start Units | First-win card | Recommended level | Win rate (Vanguard / Raiders) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1-1 | 12 | 0 / 0 / 0 / 0 | 10 | — | — | Militia Recruit (Common) | 1 | 99% / 100% |
| 1-2 | 32 | 2 / 0 / 0 / 2 | 9 | — | — | Scrap Raider (Common) | 1 | 89% / 93% |
| 1-3 | 38 | 3 / 0 / 3 / 3 | 10 | — | — | Ember Shaman (Common) | 2 | 76% / 83% |
| 1-4 | 34 | 3 / 0 / 2 / 3 | 10 | — | — | Shieldbearer (Common) | 2 | 62% / 76% |
| 1-5 | 38 | 3 / 0 / 3 / 3 | 11 | — | Militia Recruit (Uncommon), Lane 1, Column 10 · Crossbow Guard (Uncommon), Lane 3, Column 11 | Crossbow Guard (Common) | 3 | 61% / 73% |
| 1-6 | 38 | 3 / 0 / 3 / 3 | 11 | — | — | Dawn Cleric (Uncommon) | 3 | 62% / 72% |
| 1-7 | 34 | 3 / 0 / 2 / 3 | 12 | — | — | Howling Charger (Uncommon) | 4 | 70% / 76% |
| 1-8 | 40 | 3 / 0 / 3 / 3 | 12 | Lane 1, opens on Turn 5 | — | Gate Warden (Uncommon) | 4 | 67% / 76% |
| 1-9 | 34 | 3 / 0 / 3 / 3 | 13 | — | — | River Knight (Uncommon) | 5 | 70% / 77% |
| 1-10 | 44 | 1 / 0 / 0 / 1 | 14 | — | Shieldbearer (Epic), Lane 2, Column 11 | Iron Bulwark (Epic) | 5 | 40% / 36% |

The win rates come from `bun run sim stage 1000` on 2026-10-05.

### 2.3 Enemy Decks

C, U, R and E are the Ranks Common, Uncommon, Rare and Epic.

| Stage | Deck |
| --- | --- |
| 1-1 | 3× Militia Recruit (C), 2× Badland Pup (C), 2× Shieldbearer (C), 2× Scrap Raider (C), 1× Halberdier (C) |
| 1-2 | 2× Badland Pup (C), 2× Scrap Raider (C), 1× Militia Recruit (C), 1× Crossbow Guard (R), 2× Howling Charger (U), 1× War Drums (C) |
| 1-3 | 1× Badland Pup (C), 1× Ember Shaman (C), 1× Ember Shaman (U), 1× Shieldbearer (U), 2× Skyreaver (U), 2× Frost Bolt (C), 1× Fireball (C), 1× Flame Wave (U) |
| 1-4 | 3× Shieldbearer (U), 1× Gate Warden (R), 1× Gate Warden (E), 1× Halberdier (C), 1× Halberdier (U), 1× Tusk Brute (C), 2× Crossbow Guard (U) |
| 1-5 | 2× Militia Recruit (C), 1× Scrap Raider (R), 1× Badland Pup (R), 2× Crossbow Guard (C), 2× Halberdier (C), 1× Tusk Brute (C), 1× Shieldbearer (C), 1× Spear Throw (R) |
| 1-6 | 2× Crossbow Guard (U), 2× Ember Shaman (U), 2× Shieldbearer (R), 1× Dawn Cleric (U), 1× Militia Recruit (U), 2× Frost Bolt (C), 1× Fireball (C) |
| 1-7 | 1× Badland Pup (C), 1× Badland Pup (U), 2× Scrap Raider (U), 1× Pack Stalker (R), 2× Howling Charger (U), 3× Skyreaver (U), 1× Tusk Brute (U), 1× Spear Throw (U) |
| 1-8 | 1× Shieldbearer (C), 1× Shieldbearer (R), 1× Halberdier (C), 1× Halberdier (R), 2× Crossbow Guard (U), 1× Gate Warden (U), 1× Scrap Raider (C), 2× Howling Charger (U), 1× Tusk Brute (C), 1× Shield Wall (C) |
| 1-9 | 2× Crossbow Guard (C), 1× Ember Shaman (C), 1× Gate Warden (U), 1× Shieldbearer (C), 2× Skyreaver (U), 1× Scrap Raider (C), 1× Militia Recruit (C), 1× Dawn Cleric (U), 1× River Knight (U), 1× Frost Bolt (C), 1× Fireball (C) |
| 1-10 | 2× Militia Recruit (C), 1× Gate Warden (U), 2× Shieldbearer (C), 2× Crossbow Guard (C), 1× Halberdier (C), 1× Halberdier (U), 1× River Knight (U), 1× Iron Bulwark (E), 1× Spear Throw (U), 1× Shield Wall (U), 1× War Drums (C) |

## 3. When a Stage changes

1. Change the data in `stages.ts`.
2. Run `bun run sim stage 1000` in `packages/rules`. Each Stage must be in its target with each Starter Deck. CI runs `bun run rules:sim:check`, and it fails when a Stage is not on its target.
3. Update the tables in section 2.
4. If the name or the place changes, update the Message Catalogs and the landmark on the Region Map (12 — Region Concepts, section 2).
