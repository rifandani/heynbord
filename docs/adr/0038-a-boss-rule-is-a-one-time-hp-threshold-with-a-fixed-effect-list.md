# A Boss Rule is a one-time HP threshold with a fixed effect list

GDD 8.4 says that each Dungeon has "special rules", but the Campaign Boss Stages express a Boss only through Start Units, Closed Lanes, the Deck, Hero HP and Gear. We decided that a **Boss** can have **Boss Rules**. A Boss Rule is data: a threshold (a percentage of the maximum HP of the Boss) and one effect from a fixed list. It activates automatically, one time in a Battle, at the moment when damage puts the HP of the Boss at or below the threshold. The effects are:

- **Countdown −X** on the N Cards with the highest Countdown in the Hand of that Boss. On a tie, the Card that is earlier in the Hand goes first.
- **Summon** a copy of a Card, at a Rank, into a Square of the Front of that Boss.
- **Draw N** Cards for that Boss.

We did this because a Dungeon Battle against 2 or 3 Bosses needs a change in the middle of the Battle that the Player can see and plan for, and the existing levers act only at the start or at a fixed Turn. A threshold with a fixed effect list stays deterministic, the AI and the Stage simulation can run it, and the Player can read it before the Battle.

## Considered Options

- **No Boss Rules: only Fronts, Closed Lanes, Start Units, Deck, Hero HP and Gear.** Rejected: a Dungeon Boss is then the same as a strong Stage enemy, and nothing changes after Turn 1 except a Closed Lane that opens.
- **Scripted Boss behavior (code for each Boss).** Rejected: each Boss becomes custom engine code, the content test cannot check it, and the AI cannot score it.
- **More triggers now (a Turn number, another Boss Defeated, a Unit count).** Rejected for now. HP is the trigger that the Player can see on the HP plate. A new trigger is a new entry in the same data shape, and it needs a change to this ADR.
- **A Boss Rule that activates again at each crossing, or in each Turn below the threshold.** Rejected: one activation is easy to read, and repeated Summons can stop the Routed rule (ADR-0012) for a long time.

## Consequences

- The integer check is `hp × 100 ≤ maxHp × percentage`, so the result is the same on each machine.
- A hit that puts the Boss at 0 HP Defeats it, and its Boss Rules do not activate. A hit that crosses two thresholds activates both, the higher threshold first.
- A Battle Event tells the app when a Boss Rule activates. The Dungeons screen lists the Boss Rules, and the HP plate shows a marker at each threshold.
- A Summon Boss Rule that has not activated stops its Side from being Routed (ADR-0012).
- No effect heals a Hero (ADR-0027). An effect that heals a Hero must replace both ADRs.
- The AI does not plan around a threshold on either Side.
- Any Boss can have Boss Rules, but in v1 only Dungeon Bosses use them. The Campaign Boss Stages and their simulation results do not change.
