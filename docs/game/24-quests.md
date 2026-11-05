# 24 — Quests

This document gives the rules of Daily Quests and Activity, their rewards, the Objectives dialog and the economy sim. The terms **Daily Quest**, **Activity**, **Activity checkpoint**, **Daily reset** and **Weekly reset** are in the [rules glossary](../../packages/rules/GLOSSARY.md). **Objectives dialog**, **Objectives badge** and **Activity bar** are in the [web glossary](../../apps/web/GLOSSARY.md). Daily Quests are different from [Achievements](./15-achievements.md): an Achievement is one fixed list that the Player can see from the start, and a Daily Quest is a goal that the game offers for one day.

Status: **draft** (2026-11-04). The code follows this design (issue 190). The final goal counts are not set (section 6).

## 1. Rules

### 1.1 Daily Quests

- The game offers **5 Daily Quests** each day. They expire at the next Daily reset, and 5 new ones come.
- A Daily Quest is **In progress**, then **Completed**, then **Claimed**, as an Achievement is.
- The Player claims each reward in the Objectives dialog. At the Daily reset, the game claims each Completed Daily Quest that the Player did not claim, and its reward goes into the Profile. Only an incomplete Daily Quest expires ([ADR-0056](../adr/0056-daily-quests-expire-at-a-0000-utc-reset.md)).

### 1.2 Activity

- Each Daily Quest gives **20 Activity** at its Claim, with its Coin and Essence. A day gives at most 100 Activity.
- A Daily Quest that the game claims at the Daily reset also gives its Activity.
- The Activity adds up over the week and goes to 0 at the Weekly reset.
- The week has **5 Activity checkpoints**, at 100, 200, 300, 400 and 500 Activity. The last one is the weekly goal.
- A day can reach at most 1 checkpoint. A Player who does all Daily Quests reaches the last checkpoint on the fifth day, so a Player can miss 2 days of a week and still reach all 5.
- The Player claims all reached checkpoints with one Claim button beside the Activity bar. A press on the icon of a reached checkpoint claims it and each reached checkpoint below it, and no checkpoint above it. At the Weekly reset, the game claims each reached checkpoint that the Player did not claim.

### 1.3 Progress

- **A Daily Quest counts only progress after the game offers it.** Its goal is about Battles, not about the state of the Profile.
- **Which Battles count.** A Battle that the Player plays adds progress: a Stage, a Dungeon or a Floor, also a repeat win, and also with **Auto-play**. A **Sweep**, a **Replay** (also from a Replay Link) and the **Tutorial** add no progress. A Battle that the dev panel changed does not count.
- **A loss and an Abandon** add progress only to a goal that says "play". A goal that says "win" needs a win.
- **Deck rules** are the same as for a Feat ([15 — Achievements 1.3](./15-achievements.md#13-what-counts-for-a-feat)): the game reads the Deck at the start of the Battle, Tokens do not count, and Skill Cards have no Race.

### 1.4 Resets

- The **Daily reset** is at **00:00 UTC** for all Players (07:00 in Jakarta, WIB). The day number is `floor(now / 1 day)` from the Unix epoch.
- The **Weekly reset** is on **Monday at 00:00 UTC** (Monday 07:00 in Jakarta). The week number is `floor((day + 3) / 7)`, because day 4 of the epoch is a Monday.
- Until the server comes, the clock is the device clock, with the Seaport rules ([ADR-0051](../adr/0051-the-seaport-gathers-coin-on-the-device-clock.md)): the web sends `now` with each Command, and the rules stay pure.
- The Profile keeps the day number and the week number of its last resets. When the numbers of `now` are higher, the game does the resets in this order:
  1. The Daily reset claims the Completed Daily Quests. Their Activity counts for the old week.
  2. The Weekly reset claims the reached checkpoints and sets the Activity to 0.
  3. The game offers 5 new Daily Quests.
- When `now` is before the last reset (the clock moved back), nothing changes.
- A Player who is away for some days gets only the Daily Quests of the current day. A Player who is away for some weeks gets only the current week.

### 1.5 Goal selection

- A fixed pool has 8 **goal templates**, for example "Win {n} Battles with a {Race} Creature Card in the Deck" (section 2).
- The game offers only goals that the Player can do now: the Collection must permit the Deck rule, and the content of the goal (for example Dungeons) must be open.
- The selection uses a seed, so the rules stay deterministic (ADR-0006). Each Profile keeps a **Quest seed**: a fixed random value from the creation of the Profile, or from its migration for an old Profile. The day number and the Quest seed make the seed of the day.
- Thus the same Profile at the same moment always gets the same Daily Quests, and a page load never rolls them again.
- All Daily Quests give the same reward. Thus the luck of the selection gives no advantage (Pillar 1).
- The 5 active Daily Quests never use the same template at the same time.
- No goal of the pool repeats another goal or is a harder form of it. All Daily Quests give the same reward, so a harder form would be more work for no more reward.
- The 5 active Daily Quests show in the order of the goal pool: the win goals first, then the goals of a Battle.

### 1.6 Locks

- **Daily Quests open at Player level 3**, with the Workshop. The unlock gives the first 5 Daily Quests, so the Player does not wait for 00:00 UTC.
- A Player who unlocks them late in a week gets no extra Activity. On a Friday, for example, that Player can reach 3 checkpoints.

### 1.7 IDs

Each goal template has a fixed ID, for example `daily.win`. The Profile keeps the IDs, so an ID never changes after release. A name can change.

### 1.8 Rewards

- A Daily Quest gives **Coin, Essence and Activity**. An Activity checkpoint gives **Coin and Essence**, and the last one gives the most. They give no Heynstones, no XP, no cards, no Forge Stones and no Tickets ([ADR-0008](../adr/0008-heynstones-buy-only-cosmetics-and-conveniences.md), [ADR-0047](../adr/0047-a-stage-repeat-win-gives-no-xp.md)).
- **Cap.** Daily Quests and Activity checkpoints together give at most **10% of the Coin** and **15% of the Essence** of the median Player at Heynspire Floor 50. The economy sim checks it (section 4).
- **Values.** A Daily Quest gives 15 Copper and 2 Essence. The tables of [Economy 2.9](./07-economy.md#29-quests) give the values of the checkpoints. The economy sim sets them (section 4). The Pacing targets of [Economy 4](./07-economy.md) keep the Coin low: more Quest Coin in the first Regions gives the Collector too many Packs.

## 2. Goal pool (draft)

The final `{n}` values come with the tuning. The table is in the order of the pool.

| ID | Goal | Opens |
| --- | --- | --- |
| `daily.win` | Win {3} Battles | Level 3 |
| `daily.raceWins` | Win {2} Battles with a {Race} Creature Card in the Deck | Level 3 |
| `daily.boss` | Win {1} Boss Stage | Level 3 |
| `daily.dungeon` | Win {1} Dungeon | Dungeons open (level 10) |
| `daily.skillCards` | Play {5} Skill Cards | Level 3 |
| `daily.damageType` | Your Units and Skill Cards deal {30} {Damage Type} damage | Level 3 |
| `daily.kills` | Kill {15} enemy Units | Level 3 |
| `daily.keyword` | Units with {Keyword} activate it {6} times | Level 3 |

- `daily.kills` counts each enemy Unit that dies in the Battle, also from a Skill Card, and a death with Rebirth. The Battle Events do not tell which Unit made a kill.
- A goal with a slot gets a value that the Collection permits: a Race of an owned Creature Card, a Damage Type of an owned Creature Card or damage Skill Card, or a Keyword that activates on an owned Creature Card.
- Each Starter Deck at level 3 must always get 5 Daily Quests.

## 3. Objectives dialog

- **Entry.** One **Objectives shortcut** on the Town Bar opens the dialog over the current screen. It has no Building: the Hall of banners is decoration. It is open at level 1, and it does not open in a Battle. It reuses the painted Achievements icon.
- **Form.** A green leather ledger, the third book of the game box after the Deck dialog and the Handbook. It opens and closes on its spine. The title is "Objective", and 2 ribbons are beside it: **Daily Quests** and **Achievements**. The left page shows the Activity of the week or the page of seals of an Achievement category, and the right page shows the list. Bookmarks at the side of the book select the Achievement category. It has no painted background, no Town art and no portraits. On a smaller screen and on a phone in landscape it shows one page.
- **Daily Quests tab, left page.** On one page, this is a plaque at the top of the tab. The Activity count, the Activity bar with the 5 checkpoints, the time to the next Daily reset and to the next Weekly reset, and one Claim button for the reached checkpoints. A tooltip shows the reward of each checkpoint. The icon of a reached checkpoint also claims it (section 1.2). The Claim button is off when no checkpoint is ready.
- **Daily Quests tab, rows.** Each row is a card. It shows a game icon for its goal, the name, the goal, a progress bar with the count (for example "2 / 3"), the Coin, the Essence, the Activity, and one of these.
  - In progress: a **Go to** button. It closes the dialog and opens the screen of the goal: the Dungeons for a Dungeon goal while they are open, else the Campaign. Thus it never opens a locked screen.
  - Completed: a **Claim** button.
  - Claimed: a check mark. A claimed Daily Quest stays until the reset.
- **Achievements tab.** See [15 — Achievements 4](./15-achievements.md#4-achievements-tab).
- **Claim all.** Each tab has its own Claim all. On the Daily Quests tab, it claims the Completed Daily Quests and the reached checkpoints. It is off when nothing on its tab is ready.
- **Lock.** Below level 3, the Daily Quests tab has a Lock Plate and cannot be selected.
- **Default tab.** The dialog opens on the first tab with a reward to claim. If neither tab has one, it opens on Daily Quests. Below level 3, it opens on Achievements.
- **Badge.** The Objectives badge counts the Completed Daily Quests, the Completed Achievements and the reached checkpoints that are not claimed. It does not show at 0. Each tab shows its own gold count.
- **Notice.** After a Battle, the Battle result shows the Daily Quest progress of that Battle, under the rewards, also "Daily Quest completed". A Daily Quest that becomes Completed with no Battle result (an Abandon) gets a toast with "Daily Quest completed: {name}", as an Achievement does ([15 — Achievements 4](./15-achievements.md#4-achievements-tab)). A reached checkpoint gets no toast.
- **Hint.** The Quests Hint shows at level 3 and points at the Objectives shortcut.

## 4. Economy sim

The economy sim plays no Battle ([Economy 7.1](./07-economy.md#71-economy-simulation)). Thus it cannot read a goal about a Deck or a Battle Event. It uses a **count model**:

- Each goal template has a Battle count, for example "Win 3 Battles..." counts as 3 wins. Deck rules always pass, because the game offers only goals that the Collection permits (section 1.5). A goal that is not a count of wins uses a high guess of the amount of one Battle: 3 Skill Cards, 20 damage, 6 enemy Units killed and 4 Keyword activations. A high guess gives more Quest income, so it is safe.
- At each session of the play calendar (1 hour of play, then 1 day away), the sim does a Daily reset and does the 5 Daily Quests when it has enough wins in that session. It claims them at once.
- The sim does a Weekly reset each 7 sessions, and it claims each reached checkpoint at once. For this, it counts sessions as days from a Monday, because a session cycle of the play calendar has 25 hours.
- This is the maximum income. A real Player does less. Thus a pass of the targets with it is safe, as for the Seaport.
- The sim report shows the share of Daily Quests and checkpoints in the Coin and the Essence at Floor 50. `sim:check` fails when they give more than 10% of the Coin or 15% of the Essence of the median Player of any Play Style.

## 5. Checks before release

- **Each goal template can be done** with the content that opens it and with each Starter Deck.
- **`sim:check` passes**: the targets of Economy 4 and the cap of section 1.8.
- **The Profile migration** adds the Quest state to an old Profile.

## 6. Open items

- The final `{n}` values of the goal pool.
- The server clock for the resets (ADR-0056).
