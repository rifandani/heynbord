# The Seaport gathers Coin on the device clock

Heynbord had no reward for the time away: nothing happened while the Player was not in the game. The original game has a Seaport, where the Player sends a ship on a voyage, closes the browser and gets resources later. We add the Seaport as a Building at the quay of the Town painting, with 4 Expeditions (Economy 2.8). Heynbord has no server in v1: the Profile is in IndexedDB (technical design 5). Thus the time away comes from the clock of the device.

The rules of the decision:

- **One ship, one berth.** The Player Dispatches the ship on one Expedition and Collects its reward. The Profile keeps only the Expedition and the device time of the Dispatch (`seaport` in Profile version 12). The Seaport opens at Player level 8, and each Expedition has its own unlock level.
- **The reward is pro rata.** `reward = rate × min(now − startedAt, duration)`, in whole units, rounded down. The reward stops at the duration, and the ship waits. The Player never loses anything, so there is no minimum time away: an early Collect gives only the share of the time away. The Forge Stone of the Grand Expedition needs the full voyage, so a Forge Stone is always whole.
- **The rules stay pure.** The web sends `now` with each Command (`startExpedition`, `activeExpedition`, `collectExpedition`). The same Profile and the same `now` always give the same reward, and a page load never rolls a reward again (ADR-0006). The reward uses no random value.
- **The clock can move back.** When `now` is before the Dispatch, the reward is 0, and a Collect does nothing: the ship stays on its Expedition until the clock is correct again.
- **The Seaport is a supplement.** One day of Expeditions gives about one hour of active play, and the Seaport is never the best Coin source. It gives no Heynstones ([ADR-0008](0008-heynstones-buy-only-cosmetics-and-conveniences.md), [ADR-0044](0044-star-chests-give-no-heynstones.md)), no exchange of one resource for another, no Seaport levels, no VIP and no scale with the Power of the Deck. There is no Energy, no daily cap and no punishment for time away (Pillar 1).

## Considered Options

- **A fixed reward with a minimum time away, as in the original game (10 minutes).** Rejected. With the pro-rata rule, a minimum time has no use: an early Collect gives only a small share. A minimum time only adds a wait that the Player cannot see.
- **A reward that the web rolls at each page load.** Rejected. A reload could give a different reward, and the rules package would read the clock. The rules take `now` as an input, as they take a seed.
- **A server timestamp in v1.** Rejected. v1 has no server (technical design 5). A server for one clock adds a network dependency to an offline game.
- **Copy the original rewards: Heynstones, an exchange of resources, Seaport levels, VIP and Power scaling.** Rejected. Heynstones are one-time only (ADR-0008), Forge Stones come from a fixed source list ([ADR-0038](0038-gear-upgrades-need-earn-only-forge-stones.md)), no Building has levels, and Power scaling gives more to the Players who already have more (Pillar 1).

## Consequences

- A Player can move the device clock forward to get a voyage at once. In v1, this is accepted: the Profile is local, the Player can already change it with an export, and the reward is at most about one hour of play for each day. The checksum of the export finds a damaged file, not a cheat.
- **The v2 fix.** With the accounts and the Profile on the server of v2 (technical design 5 and 10, roadmap v2), the server keeps the Dispatch time and sends `now` from its own clock. The rules do not change, because they already take `now` as an input. The `seaport` field keeps its shape.
- The economy sim counts play hours and Battles, not days, so the Seaport income is outside `sim:check` until the sim learns a play calendar. The rates stay low: 48 XP for each day is 2% to 5% of a level from level 20. Dungeon 3 and the Sweeps had the same treatment before.
- Profile version 12 adds the `seaport` field. The migration from version 11 puts the ship of an old Profile at the berth, with no reward for the time before. The export, the import and the Game Dev Panel overlay keep the field.
- The Seaport quay is in the current Town painting, so the Town needs no new painting. The Seaport screen has its own painting (11 — Town Concepts 17), and the Town Bar has a ship icon (11 — Town Concepts 7.3).

## Update: the economy sim has a play calendar

The economy sim now has a play calendar: 1 hour of play each day, then 1 day away ([Economy 4 and 7.1](../game/07-economy.md#71-economy-simulation), issue #114). Its Players send the ship between their sessions, so `sim:check` judges the Seaport income with the other sources. The check found one rate too high: with 2 XP for each hour, too many Players got to level 30 before the Floor 50 win. Thus the Trade Route, the Long Voyage and the Grand Expedition give 1 XP for each hour now, and 24 XP for each day is 1% to 2.4% of a level from level 20. The Coin, the Essence and the Forge Stone do not change. At Floor 50, the Seaport gives the median Player about 21% of its Coin, 2% of its XP and about a third of its Epic Forge Stones. The decision above does not change: the Seaport is a supplement.

## Update: the Player selects a Cargo and a duration

The 4 fixed Expeditions (each later one added a reward line) became 4 **Cargoes** × 4 durations ([Economy 2.8](../game/07-economy.md#28-seaport-expeditions)). The Player selects what it needs: Coin, XP, Essence or Forge Stones, for 6, 12, 24 or 48 hours. Each Cargo gives only its own resource, and a longer voyage gives a small bonus for each hour (+5%, +10%, +15%). The Forge Stone Cargo gives a higher tier for a longer voyage, only after the full voyage. Each Cargo and each duration opens at its own Player level (8, 12, 18 and 24).

- **The decision above does not change.** One ship, one berth, the pro-rata reward, the device clock, the pure rules and no Heynstones stay.
- **The durations open by level.** With all durations open at level 8, the economy sim gave the Collector 28 Packs by the end of Region 2 (target 15 to 25). With the durations open by level, it gives 23.
- **An early Collect of the Forge Stone Cargo gives nothing.** This is the one voyage where the time away gives no share, because a Forge Stone is whole. The screen calls the early Collect "Call back early" and asks again first.
- **Profile version 13** changes the `seaport` field to `{ cargo, hours, startedAt }`. The migration from version 12 keeps a ship at sea and its Dispatch time, on the nearest new voyage: the Coastal Run, the Trade Route and the Long Voyage become Coin for 6, 12 and 24 hours, and the Grand Expedition becomes Forge Stones for 48 hours.
- **Considered and rejected:** all durations open with lower rates (the Seaport gave only about 7% of the Coin), and an accepted miss of the Region 2 Pack target.
