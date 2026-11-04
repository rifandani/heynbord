# Daily Quests expire at a 00:00 UTC reset

Economy 1.1 had the rule "No resource has a time limit or a daily cap". The Seaport also said that there is no punishment for time away. We add **Daily Quests** ([24 — Quests](../game/24-quests.md)). They give the Player a reason to come back each day. We decided that a Daily Quest expires at the next **Daily reset**, 00:00 UTC for all Players, and that **Activity** goes to 0 at the **Weekly reset**, Monday 00:00 UTC. Thus we removed the rule of Economy 1.1. We will add a server and a database soon, and a daily reset with one time for all Players is necessary for the events and seasons of v2. Thus we accept the time limits now and do not move the Players to a new reset later.

The rules of the decision:

- **Only Daily Quests and Activity have a time limit.** No other resource gets a time limit or a daily cap. There is still no Energy (Pillar 1).
- **A missed day is not a lost week.** The week has 7 days and 5 Activity checkpoints, and a day can reach at most 1. A Player can miss 2 days and still reach all 5.
- **An earned reward is never lost.** At the Daily reset, the game claims each Completed Daily Quest that the Player did not claim, and its Activity counts for that week. At the Weekly reset, the game claims each reached Activity checkpoint. Only an incomplete Daily Quest and the Activity above the last reached checkpoint expire.
- **The reward is small and gives no power that the Player cannot get in a different way.** A Daily Quest gives only Coin, Essence and Activity, and an Activity checkpoint gives only Coin and Essence: no Heynstones, no XP, no cards, no Forge Stones and no Tickets. Thus a Player who misses a day or a week loses only a small supplement, and the fixed Heynstone supply does not change ([ADR-0008](0008-heynstones-buy-only-cosmetics-and-conveniences.md), [ADR-0043](0043-no-achievement-can-be-missed.md)).
- **The device clock comes first, then the server clock.** Until the server comes, the reset uses the device clock, with the Seaport rules ([ADR-0051](0051-the-seaport-gathers-coin-on-the-device-clock.md)): the web sends `now` with each Command, and the rules stay pure. The day number is `floor(now / 1 day)` from the Unix epoch, so 00:00 UTC is the reset with no time zone. The week number is `floor((day + 3) / 7)`, so a week starts on a Monday. When `now` is before the last reset of the Profile (the clock moved back), nothing changes.

## Considered Options

- **Daily Quests that accumulate and never expire.** Each day adds 1 Daily Quest to a slot, up to a cap. Rejected. It keeps the old rule of Economy 1.1, but a Daily Quest then has no daily rhythm.
- **No clock: goals that never expire.** Rejected. The game then has no reason to come back each day.
- **Reset at the local midnight of the Player.** Rejected. A change of the time zone gives an extra reset, and v2 events and seasons need one time for all Players. 00:00 UTC is 07:00 in Jakarta (WIB).
- **An Activity bar that resets each day.** Rejected. A Player can reach all checkpoints in one day, and nothing gives a reason to come back during the week.
- **7 checkpoints, one for each day of the week.** Rejected. One missed day loses the last checkpoint, and that is a punishment for time away.

## Consequences

- A Player can move the device clock forward to get more Daily Quests and Activity. Until the server comes, this is accepted, for the same reasons as the Seaport: the Profile is local, and the reward is small.
- **The server fix.** With the Profile on the server, the server sends `now` from its own clock. The rules do not change, because they already take `now` as an input.
- The economy sim does the 5 Daily Quests of each day of its play calendar (1 hour of play, then 1 day away), so each session is a new day, and each 7 sessions are a new week ([Economy 7.1](../game/07-economy.md#71-economy-simulation)).
- A Player who unlocks Daily Quests late in a week gets no extra Activity.
- The roadmap row "Return rewards" (a login streak, a free Pack each day) is still to be decided. Daily Quests do not decide it.
