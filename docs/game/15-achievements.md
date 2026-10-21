# 15 — Achievements

This document gives the list of Achievements in v1: the goal, the kind and the reward of each. The rules for all Achievements are in section 1. The terms **Achievement**, **Feat** and **Tally** are in the [glossary](../../packages/rules/GLOSSARY.md).

Status: **approved** (2026-10-16). The names are drafts. The data is `ACHIEVEMENTS` in `packages/rules/src/content/achievements.ts`. Keep the code and this list the same. The rewards follow [Economy 2.5](./07-economy.md#25-achievements).

## 1. Rules

### 1.1 States

- An Achievement is **In progress**, then **Completed**, then **Claimed**.
- The game records an Achievement as Completed the first time that the Player meets its goal. A Completed Achievement stays Completed, also when the Profile changes later. For example, an Extract after "Discover 68 cards" does not undo it.
- The Player claims the reward on the Achievements screen. Then the reward goes into the Profile. A Star chest works the same way.
- Each Achievement can be Completed and Claimed one time only.

### 1.2 Kinds of goal

| Kind | The game reads it from | Earlier progress counts |
| --- | --- | --- |
| **Profile goal** | The Profile, for example Stage results, the Collection or Gear levels | Yes |
| **Tally goal** | A **Tally** in the Profile | Only from the moment the Tally exists |
| **Feat** | One won Battle: its Deck, its Turns and its Battle Events | Only Battles after the Feat exists |

- The game checks Profile goals and Tally goals after each change to the Profile, and when the Profile loads.
- The game checks Feats one time, when the result of a won Battle shows.

### 1.3 What counts for a Feat

- Only a Battle that the Player plays: a Stage, a Dungeon or a Floor. A repeat win counts.
- A **Sweep**, a **Replay** (also from a Replay Link), **Auto-play** and the **Tutorial** never complete a Feat. A Battle that the dev panel changed does not count.
- A loss and an **Abandon** never complete a Feat.
- A Feat that names a Deck rule ("only Undead") reads the Deck at the start of the Battle, not the Units that the Battle summons. Tokens do not count. Skill Cards have no Race, so they never break a Race rule.

### 1.4 No Achievement can be missed

The Player must always be able to complete each Achievement later (Pillar 1, [ADR-0045](../adr/0045-no-achievement-can-be-missed.md)). Thus:

- A Feat never needs a Battle that the Player cannot play again. A Floor cannot be played again, so no Feat needs a specific Floor. A Feat that counts "in a Boss Stage or a Dungeon" is permitted, because the Player can play both again.
- A goal never needs a value that only goes one way and can pass the goal, for example "Win while you are below the Recommended level" or "Win with Gear at level 0".

### 1.5 Tallies

v1 has 3 Tallies. Each starts at 0 and only goes up. A Sweep never adds to a Tally.

| Tally | +1 for each |
| --- | --- |
| `packsOpened` | Pack opened (bought or Unopened) |
| `combines` | Combine |
| `crafts` | Craft |

### 1.6 Rewards

- Most Achievements give Heynstones. Some give Coin or Essence. 3 hard Achievements give an earn-only Cosmetic (GDD 10).
- No Achievement gives XP, cards, Forge Stones or Tickets.
- **Cosmetic rewards grant at once.** The Claim grants the earn-only Cosmetic of the Achievement (`ACHIEVEMENT_COSMETICS` in `packages/rules/src/content/cosmetics.ts`). The migration of Profile version 10 pays the Cosmetics that an old Profile claimed before the list existed, so the player loses nothing ([Economy 2.3](./07-economy.md)).

### 1.7 IDs

Each Achievement has a fixed ID, for example `feat.onlyUndead`. The Profile keeps the IDs, so an ID never changes after release. A name can change.

## 2. The list

40 Achievements: 18 Feats, 19 Profile goals and 3 Tally goals. The total is **1,000 Heynstones**, 500 Coin, 50 Essence and 3 earn-only Cosmetics.

"Win in a Boss Stage or a Dungeon" means a win of any Boss Stage (1-10 to 5-10) or any Dungeon.

### 2.1 Campaign

| ID | Name (draft) | Goal | Kind | Reward |
| --- | --- | --- | --- | --- |
| `campaign.hearthvale` | Hearthvale Freed | Win Stage 1-10 | Profile | 15 Heynstones |
| `campaign.redMesas` | Over the Mesas | Win Stage 2-10 | Profile | 20 Heynstones |
| `campaign.glowcapHollows` | Light in the Hollows | Win Stage 3-10 | Profile | 25 Heynstones |
| `campaign.thornwood` | Through the Thorns | Win Stage 4-10 | Profile | 30 Heynstones |
| `campaign.hollowMarches` | Marrow Castle Falls | Win Stage 5-10 | Profile | 40 Heynstones |
| `campaign.regionStars` | Starry Road | Get 30 Stars in one Region | Profile | 35 Heynstones |
| `campaign.allStars` | Every Star in Heynbord | Get 150 Stars: 3 Stars in all 50 Stages | Profile | Earn-only Cosmetic (hard) |
| `campaign.allChests` | Chest Hunter | Claim all 15 Star chests | Profile | 500 Coin |

### 2.2 Dungeons and Heynspire

| ID | Name (draft) | Goal | Kind | Reward |
| --- | --- | --- | --- | --- |
| `dungeon.rootdeepMine` | Into the Mine | Win Dungeon 1 (The Rootdeep Mine) | Profile | 25 Heynstones |
| `dungeon.rimebarrow` | Cold Comfort | Win Dungeon 2 (The Rimebarrow) | Profile | 35 Heynstones |
| `dungeon.brokenVault` | Vault Breaker | Win Dungeon 3 (The Broken Vault) | Profile | 50 Heynstones |
| `heynspire.floor25` | Halfway Up | Win Floor 25 | Profile | 30 Heynstones |
| `heynspire.floor50` | Top of the Spire | Win Floor 50 | Profile | 60 Heynstones |

### 2.3 Progress, Collection and Workshop

| ID | Name (draft) | Goal | Kind | Reward |
| --- | --- | --- | --- | --- |
| `level.max` | Veteran | Get Player level 30 | Profile | 40 Heynstones |
| `collection.half` | Half the Book | Discover 68 cards | Profile | 20 Heynstones |
| `collection.all` | The Full Book | Discover all 136 cards | Profile | Earn-only Cosmetic (hard) |
| `packs.fifty` | Regular Customer | Open 50 Packs | Tally | 20 Heynstones |
| `workshop.legendary` | Legend Made | Own a Legendary copy of a card, from a Combine or a Royal Pack | Profile | 40 Heynstones |
| `workshop.combines` | Busy Bench | Do 25 Combines | Tally | 20 Heynstones |
| `workshop.craft` | From Dust | Craft a card | Tally | 50 Essence |
| `gear.ten` | Sharpened | Upgrade one Gear item to level 10 | Profile | 15 Heynstones |
| `gear.max` | Fully Forged | Upgrade all 4 Gear items to level 25 | Profile | 60 Heynstones |

### 2.4 Feats

| ID | Name (draft) | Goal | Reward |
| --- | --- | --- | --- |
| `feat.onlyHuman` | Hearth and Home | Win in a Boss Stage or a Dungeon with a Deck whose Creature Cards are all Human | 25 Heynstones |
| `feat.onlyElf` | Old Wood | The same, all Elf | 25 Heynstones |
| `feat.onlyUndead` | Bone Army | The same, all Undead | 25 Heynstones |
| `feat.onlyOrc` | Warband | The same, all Orc | 25 Heynstones |
| `feat.onlyGoblin` | Mischief | The same, all Goblin | 25 Heynstones |
| `feat.onlyFeral` | Pack Hunt | The same, all Feral | 25 Heynstones |
| `feat.creaturesOnly` | No Tricks | Win in a Boss Stage or a Dungeon with no Skill Card in the Deck | 20 Heynstones |
| `feat.commonOnly` | Humble Ranks | Win a Boss Stage of Region 3 or later with only Common copies in the Deck | 30 Heynstones |
| `feat.untouched` | Not a Scratch | Win a Boss Stage with the Hero at full HP | 30 Heynstones |
| `feat.swiftBoss` | Short Siege | Win a Boss Stage before Turn 10 | 30 Heynstones |
| `feat.lastStand` | By a Thread | Win with the Hero at 3 HP or less | 20 Heynstones |
| `feat.rout` | Nobody Left | Win because the enemy Side is Routed | 15 Heynstones |
| `feat.fullZone` | Packed Lines | Have 9 of your Units on the Board at the same time | 20 Heynstones |
| `feat.allDamageTypes` | Every Element | Your Units and Skill Cards deal damage of all 5 Damage Types in one Battle | 25 Heynstones |
| `feat.fourCards` | Perfect Timing | Play 4 cards in one Turn | 20 Heynstones |
| `feat.keywords` | Many Tricks | 10 different Keywords of your Units activate in one Battle | 20 Heynstones |
| `feat.noLosses` | Shield Wall | Win a Dungeon and none of your Units dies | 40 Heynstones |
| `feat.untouchedVault` | Flawless Vault | Win Dungeon 3 with the Hero at full HP | Earn-only Cosmetic (hard) |

Notes:

- A Feat with no place in its goal counts in any won Stage, Dungeon or Floor.
- A Race Feat needs at least 1 Creature Card in the Deck. A Deck of only Skill Cards completes no Race Feat.
- "Dies" includes a Unit that dies and then comes back with Rebirth (the `UnitReborn` event). A Token is a Unit. A Unit that leaves the Board because its Hero is Defeated (`UnitRemoved`) does not die.
- For "Every Element", only damage above 0 counts. Burn and Poison damage has no dealer, so it does not count.
- Nothing heals a Hero ([ADR-0028](../adr/0028-nothing-heals-a-hero.md)), so "full HP" means that the enemy never damaged the Hero.

### 2.5 Totals

| Category | Achievements | Heynstones | Other |
| --- | ---: | ---: | --- |
| Campaign | 8 | 165 | 500 Coin, 1 Cosmetic |
| Dungeons and Heynspire | 5 | 200 | — |
| Progress, Collection and Workshop | 9 | 215 | 50 Essence, 1 Cosmetic |
| Feats | 18 | 420 | 1 Cosmetic |
| **Total** | **40** | **1,000** | **500 Coin, 50 Essence, 3 Cosmetics** |

With the 250 Heynstones of the 10th Floors, the v1 supply is 1,250 Heynstones. That is about 45% of the Bazaar catalog cost (Economy 2.6), so the Player must still choose.

## 3. Checks before release

- **Each Feat can be done.** Each Feat has a test with a fixed seed and Commands, or a Replay, that completes it. A Feat with no such test does not go into the game. The tests are in `packages/rules/src/profile/feats.unit.test.ts`: the AI makes the Commands of both Sides, so the seed fixes the Commands.
- **The tuning of the counts.** A check on 2026-10-16 kept "before Turn 10", "9 Units" and "4 cards in one Turn". The Player on the First-try Path (all 50 Stages, both starter Decks, 10 seeds) won 637 Battles. 28% of these wins had 9 Units, and 16% had 4 cards in one Turn. No Boss Stage win came before Turn 13. A fast Deck at level 30 wins Stage 1-10 before Turn 10 in most seeds.
- **The totals match.** The Heynstone ledger (`HEYNSTONE_SOURCES` in `packages/rules/src/content/heynstones.ts`) takes the count and the Heynstones of the Achievements from `ACHIEVEMENTS`. A test checks that the list gives 1,000 Heynstones, the value of Economy 2.5 and 2.6.
- **The economy sim.** After each Battle and the spending, a simulated Player records the Profile goals and the Tally goals that it meets, and claims each Completed Achievement at once (`claimAchievements` in `packages/rules/src/simulation/economy.ts`). It gets the Coin and the Essence. In practice, only the first Craft (50 Essence) changes the results, because the sim does not open the 30-Star chests ([Economy 7.1](./07-economy.md#71-economy-simulation)). The sim plays no Battle, so it completes no Feat, and its results are still a floor. The Heynstones of the Achievements are in the Heynstone ledger, not in the sim.

## 4. Achievements screen

- **Town.** The Hall of banners (Town Concepts 2.9) becomes a selectable Building with a label. The Achievements shortcut on the Town Bar opens. There is no level lock.
- **Layout.** The screen lists the categories of section 2 in that order. Each row shows the name, the goal, the reward and one of these:
  - In progress: a progress bar with the count (for example "41 / 65"). A Feat shows no bar, only "Not done".
  - Completed: a **Claim** button.
  - Claimed: a check mark.
- A **Claim all** button claims all Completed Achievements. It is off when no Achievement is Completed.
- **Notice.** When an Achievement becomes Completed outside a Battle, a toast shows "Achievement completed: {name}". A Feat shows on the Battle result, under the rewards. The Achievements shortcut shows a badge with the number of Completed Achievements that are not Claimed.
- **Hint.** The Achievements Hint shows at the first Completed Achievement and points at the shortcut.
