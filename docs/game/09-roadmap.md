# 09 — Roadmap

## 1. Overview

| Milestone | Weeks | Result |
| --- | --- | --- |
| M0 — Foundation | 1–2 | Documents, rules package, empty 3D scene in `apps/web` |
| M2 — Meta loop (**Playable alpha**) | 7–12 | Deck builder, Packs, Workshop, save, first Region |
| M3 — Content | 13–19 | 136 cards, 50 Stages, 5 bosses, 3 Dungeons, both languages |
| M4 — Polish and release (**v1.0**) | 20–26 | Heynspire, Achievements, mobile landscape, audio, performance, playtests |

The schedule is for one developer. If a Milestone is late, cut **C** requirements, then **S** requirements (see the PRD). Do not move the end date of a Milestone more than 2 weeks before you cut scope.

## 2. Milestones

### M2 — Meta loop and playable alpha (weeks 7–12)

- [ ] All v1 Keywords, Damage Types, Skill Cards, Recall and Field Effects.
- [ ] Show "Recalled!" animations when a Skill Card returns to the Hand after a successful Recall roll.
- [ ] Profile model, IndexedDB save, export and import, migrations.
- [ ] Deck builder with validation, Packs, and the Workshop. In the Workshop the player can Combine, Extract, and Craft cards, so a weak card is never useless.
- [ ] Player level, unlocks, Gear.
- [ ] Region 1 (10 Stages) with the tutorial and the first boss.
- [ ] The Town is the first screen of the game. The player selects a Building to open a screen. The Town Gate and the Card shop can be selected.
- [ ] Message Catalog structure for game text (`en-us` first).
- [ ] Style bible and first 30 final card art images.

**Exit (Playable alpha):** A new player can play Region 1 from the tutorial to the boss, and can open Packs and change the Deck. Do the first external playtest.

**Order of the M2 work that is left** (decided 2026-10-10):

1. **Profile.** The Profile model, IndexedDB save, migrations, export and import. The slice Player (level 10, Gear 3) goes away, and a new Player starts at level 1 with no Gear. Each later feature adds its part to the Profile.
2. **Region 1 rewards.** XP and level ups, the first-win card, the repeat-win card, Star chests and the level locks on Buildings and shortcuts.
3. **Workshop.** Combine and Extract, then Craft.
4. **Hero screen.** Class, Gear upgrades and portrait. Then check the Region 1 margins again with real Gear.
5. **First external playtest** (the M2 exit).

Regions 2 to 5 (M3) come after the playtest, because their tuning needs the Workshop and Gear: the pacing target for the end of Region 2 has an Epic card, and Combine makes it. Achievements and the Bazaar stay in M4, after the Heynspire, so that their goals and the Heynstone total are planned one time.

### M3 — Content (weeks 13–19)

- [ ] All 136 cards: 96 Creature Cards and 40 Skill Cards. Final art is ready for 130; the 6 Specialists show their emblem until their art is done.
- [ ] Regions 2 to 5 (40 Stages), with bosses and story scenes ([ADR-0036](../adr/0036-the-campaign-has-5-regions-and-each-region-adds-one-race.md)). Region 2 (The Red Mesas): the Stage design is done ([14 — Campaign Stages, 3](./14-campaign-stages.md#3-region-2-the-red-mesas)), and its Stage data and tuning are in progress. Region 3 (The Glowcap Hollows): the Stage design, the Stage data and the tuning are done ([14 — Campaign Stages, 4](./14-campaign-stages.md#4-region-3-the-glowcap-hollows)).
- [ ] Region Map and Battle Painting images for Regions 2, 3 and 5 ([12 — Region Concepts](./12-region-concepts.md), [13 — Battlefield Concepts](./13-battlefield-concepts.md)). Until a Region has its Battle Painting, it uses the Hearthvale painting.
- [x] Enemy AI scores for Sabotage, Hobble and Last Breath when it selects a card to summon (issue [#84](https://github.com/rifandani/heynbord/issues/84), GDD 9).
- [ ] Hints for each Race and Keyword when the Player meets them for the first time.
- [ ] Battles with 1 to 4 Heroes on a Side ([ADR-0009](../adr/0009-a-side-has-one-or-more-heroes.md)).
- [ ] 3 Dungeons with their Bosses (GDD section 8.4). Dungeons use 4 Lanes ([ADR-0010](../adr/0010-the-type-of-battle-sets-the-number-of-lanes.md)). Dungeon 1 (The Rootdeep Mine), Dungeon 2 (The Rimebarrow) and Dungeon 3 (The Broken Vault) are done, with their sim results ([14 — Campaign Stages, 7](./14-campaign-stages.md#7-dungeons)).
- [ ] Balance simulation script. Tune cards to the targets in GDD section 13.
- [ ] Economy simulation script. Tune rewards to the targets in the Economy document.
- [ ] `id-id` translation of all text.
- [ ] Final names for Regions, Bosses, Dungeons and the 4 new Dungeon Bosses, Heynspire and the lore names.

**Schedule risk.** The Campaign has 50 Stages, so M3 has 40 new Stages ([ADR-0036](../adr/0036-the-campaign-has-5-regions-and-each-region-adds-one-race.md)). If M3 is late, apply the cut rule of section 1. Do not cut a Region: each Region adds one Debut Race.

**Exit:** A player can finish the full Campaign. Balance and economy reports meet their targets. Dungeon 1 (4 Lanes) is easy to read on a phone in landscape (screenshot check).

### M4 — Polish and release v1.0 (weeks 20–26)

- [ ] Heynspire (50 Floors). All Floors use 4 Lanes ([ADR-0010](../adr/0010-the-type-of-battle-sets-the-number-of-lanes.md)). Heynspire unlocks after the Region 5 Boss Stage, so the strength of Floor 1 starts at the values of the Region 5 Boss.
- [ ] Achievements and Cosmetics.
- [ ] Heynstones and the Bazaar (Cosmetics). Check the Heynstone total again: Star chests give no Heynstones, so the supply is about 1,250 ([07 — Economy, 2.6](./07-economy.md)).
- [ ] Dungeon Sweep (BAT-12, [ADR-0041](../adr/0041-dungeons-have-a-dungeon-sweep-with-their-own-tickets.md)), Battle Log (BAT-13: #73, #74, #76).
- [ ] Mobile landscape layout and touch input. Portrait warning.
- [ ] Sound effects and music.
- [ ] Accessibility options and keyboard play.
- [ ] Performance work to meet the budgets.
- [ ] PWA offline mode.
- [ ] Playtest with 5 to 10 people through the full Campaign.
- [ ] Trademark check and licence record.

**Exit:** The release criteria in PRD section 7 pass. Release v1.0.

## 3. After v1

The order of the versions after v1 can change after player feedback.

| Version | Content |
| --- | --- |
| **v1.x** | Bug fixes, balance updates, new Cosmetics, a few new cards |
| **v2 — Online** | Accounts, server, Profile on the server, asynchronous PvP against defense Decks, leaderboards and seasons, Heynstones for real money in the Bazaar |
| **v2.x — Social** | Guilds, guild bosses, friends, weekly Heynspire reset, events |
| **v3 — Co-op** | 2v2 and co-op bosses, real-time Turns with a 30-second timer |
| **v3.x — Expansion** | New Races, Hybrid Units, a sixth Rank, new Keywords and Damage Types |
| **To be decided** | Return rewards: a free Merchant Pack each day, a login streak bonus, event rewards. They need their own economy design. They also give a path back to a valid Deck for a player who Extracted too many cards (GDD 7.4) |
| **To be decided** | Trading between players (needs a separate design review, see Economy section 6) |
