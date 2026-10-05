# 09 — Roadmap

## 1. Overview

| Milestone | Weeks | Result |
| --- | --- | --- |
| M0 — Foundation | 1–2 | Documents, rules package, empty 3D scene in `apps/web` |
| M2 — Meta loop (**Playable alpha**) | 7–12 | Collection, Deck builder, Packs, Workshop, save, first Region |
| M3 — Content | 13–19 | 88 cards, 30 Stages, 3 bosses, 3 Dungeons, both languages |
| M4 — Polish and release (**v1.0**) | 20–26 | Heynspire, Achievements, mobile landscape, audio, performance, playtests |

The schedule is for one developer. If a Milestone is late, cut **C** requirements, then **S** requirements (see the PRD). Do not move the end date of a Milestone more than 2 weeks before you cut scope.

## 2. Milestones

### M2 — Meta loop and playable alpha (weeks 7–12)

- [ ] All v1 Keywords, Damage Types, Skill Cards, Recall and Field Effects.
- [ ] Show "Recalled!" animations when a Skill Card returns to the Hand after a successful Recall roll.
- [ ] Profile model, IndexedDB save, export and import, migrations.
- [ ] Collection, Deck builder with validation, Packs, and the Workshop. In the Workshop the player can Combine, Extract, and Craft cards, so a weak card is never useless.
- [ ] Player level, unlocks, Gear.
- [ ] Region 1 (10 Stages) with the tutorial and the first boss.
- [ ] The Town is the first screen of the game. The player selects a Building to open a screen. In v1, only the Town Gate can be selected.
- [ ] Message Catalog structure for game text (`en-us` first).
- [ ] Style bible and first 30 final card art images.

**Exit (Playable alpha):** A new player can play Region 1 from the tutorial to the boss, and can open Packs and change the Deck. Do the first external playtest.

### M3 — Content (weeks 13–19)

- [ ] All 88 cards with final art: 60 Creature Cards and 28 Skill Cards.
- [ ] Regions 2 and 3, with bosses and story scenes.
- [ ] Battles with 1 to 4 Heroes on a Side ([ADR-0009](../adr/0009-a-side-has-one-or-more-heroes.md)).
- [ ] 3 Dungeons with their Bosses (GDD section 8.4). Dungeons use 4 Lanes ([ADR-0010](../adr/0010-the-type-of-battle-sets-the-number-of-lanes.md)).
- [ ] Balance simulation script. Tune cards to the targets in GDD section 13.
- [ ] Economy simulation script. Tune rewards to the targets in the Economy document.
- [ ] `id-id` translation of all text.
- [ ] Final names for Regions, Bosses, Dungeons and the 4 new Dungeon Bosses, Heynspire and the lore names.

**Exit:** A player can finish the full Campaign. Balance and economy reports meet their targets. Dungeon 1 (4 Lanes) is easy to read on a phone in landscape (screenshot check).

### M4 — Polish and release v1.0 (weeks 20–26)

- [ ] Heynspire (50 Floors). All Floors use 4 Lanes ([ADR-0010](../adr/0010-the-type-of-battle-sets-the-number-of-lanes.md)).
- [ ] Achievements and Cosmetics.
- [ ] Heynstones and the Bazaar (Cosmetics and extra Deck slots).
- [ ] Auto-play, Battle log.
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
| **To be decided** | Trading between players (needs a separate design review, see Economy section 6) |
