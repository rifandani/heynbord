# Heynbord Battle slice: design artifacts

The source of truth is [`docs/game/`](../../../docs/game/README.md). This file gives the short design artifacts for this build (threejs-gameplay-systems). Scope: roadmap milestones M0 and M1 (the Battle slice).

## Design brief

| Item | Value |
| --- | --- |
| Player promise | "I plan when and where my cards go. Then my army fights by itself, and I can see why I won." |
| Target feeling | Tension while Countdowns tick, then satisfaction when a plan works (GDD vision: "I planned that."). |
| Primary verb | Play a Ready card into a Lane (or onto a target). |
| Secondary verbs | Wait (do not play), End Turn, change speed, Skip, inspect a card. |
| Repeated every 5 to 30 s | One Turn: Countdowns tick, play 0 to 3 Ready cards, End Turn, watch the Resolution Phase. |
| Change over 1 to 5 min | The Board fills. Strong cards with long Countdowns arrive. Sudden Death from Turn 20 forces an end. |
| Lose, learn, restart | The Hero reaches 0 HP. The result screen shows Victory or Defeat and the Stars. "Play Again" restarts at once with a new seed. |
| Rewarded | Lane choice that blocks threats, timing (hold a big card for an open Lane), killing enemy Units before they reach the Hero. |
| Risk | Empty Lanes let enemy runners hit the Hero. Playing everything at once leaves no answer for the next threat. |
| A better player | Blocks fast Units with high-HP Frontliners, keeps Skill Cards for the right target, and pushes in the Lane with less enemy defense. |
| Next decision shown by | Large Countdown numbers on each card, a gold glow on Ready cards, legal targets glowing on the Board, the enemy's Hand Countdowns in the top bar. |
| Non-goals | Save, Workshop, Packs, Gear UI, Heynspire, Achievements, replays, Auto-play UI, generated art. These are milestones M2 to M4. |

## Core loop contract

> The player **plays Ready cards into Lanes** to **bring the enemy Hero to 0 HP** while **enemy Units march toward the player's Hero and Sudden Death starts at Turn 20**. Success gives **Victory and 1 to 3 Stars**. Failure gives **Defeat and a one-click retry**.

| Clause | Proof in code |
| --- | --- |
| Verb on real input | Click or tap a card, then a glowing target. Drag and drop. Keyboard: arrows, Enter, E, S, Esc. The E2E bot (`e2e/battle.spec.ts`) uses all of them. |
| Objective visible | Both Hero HP bars in the top bar, and the Hero standees at the ends of the Lanes. |
| Pressure in the first minute | The enemy AI summons into its Summon Column on Turn 1 or 2. Its Units walk toward the player's Hero. |
| Reward changes state | Kills move Cards to the Graveyard, and Hero damage lowers HP. The result screen gives Stars (GDD 4.11). |
| Failure teaches | Each attack, hit, Crit, Block, Burn and Freeze has its own animation, number and sound. The rules are deterministic (Pillar 2). |
| Restart is fast | "Play Again" starts a new Battle in less than 1 second, with no reload. |

## Encounter plan (the Stages of the slice)

| Stage | Lanes | Enemy | What it teaches | Pressure |
| --- | --- | --- | --- | --- |
| 1-1 The Muddy Ford | 1 | Bandit Scout, 18 HP, cheap Units | Countdown, summon, watch the Units act | One Lane: every enemy Unit comes at you. |
| 1-2 Two Bridges | 2 | Bandit Twins, 32 HP, fast Units with Heroic | Lane choice: block the fast Units | Runners in the open Lane hit the Hero. |
| 1-3 The Burning Mill | 2 | Hedge Witch (Mage), 38 HP, Frost and Fire Skill Cards | Skill Cards, Burn, Freeze, Recall | Area damage punishes Units in a line. |
| 1-10 Brassbelly Hall (Boss) | 2 | Baron Brassbelly, 40 HP, Jade cards | Plan around a Unit that starts on the Board | The Iron Bulwark guards Lane 1 from Turn 1 (GDD 8.1 boss rule). |

- Camera: a fixed 3/4 view at 45°. It shows all Squares and both Heroes for any landscape aspect.
- Escalation: Countdowns bring stronger cards over Turns 3 to 6. Sudden Death from Turn 20 (GDD 4.10).
- Telegraphs: the enemy Hand Countdowns are visible. A ranged attack shows a projectile. A Frozen Unit has a blue tint, and a burning Unit has an orange tint.
- Difficulty (headless simulation, AI on both sides, 200 Battles each, `bun run rules:sim`): 1-1 100%, 1-2 98 to 99%, 1-3 88 to 92%, Boss 1-10 35 to 39% player wins. GDD 13 targets 60 to 80% for normal Stages and 30 to 50% for Boss Stages. 1-1 is the Tutorial (GDD 8.3). 1-1 to 1-3 make a ramp on purpose (GDD 13): 1-1 ≥ 95%, 1-2 ≥ 85%, 1-3 ≥ 75%.
