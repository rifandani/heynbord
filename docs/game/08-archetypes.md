# 08 — Archetypes

This document gives the **Archetypes** and the results of their **Matchups** (GDD 13, steps 4 and 5). An Archetype is a named reference Deck for one style of play. Balance simulations use Archetypes. A Player never sees an Archetype. The data is in `packages/rules/src/content/archetypes.ts`.

## 1. Rules for the Matchups

- **The AI plays both Sides.** Both Sides use the enemy AI (GDD 9).
- **Both Sides start equal.** Both Heroes have the same player level, the same Hero HP and the same Gear. The Board has 3 Lanes, as in a Stage (ADR-0010), with no Closed Lanes and no Start Units.
- **Each seed plays both ways.** The first Side always takes the first Turn. Thus each seed plays 2 Battles, with the Sides swapped. Then the first-Turn advantage does not change the win rate of an Archetype. A mirror Matchup (an Archetype against itself) always gives exactly 50%.
- **Win-rate target.** Each main Archetype must win 45% to 55% of its Matchups against each other main Archetype (GDD 13, PRD 7). Diagnostic Decks expose mixed-Race combinations, but they do not gate release.
- **First-Side win rate.** The table also shows the win rate of the Side that takes the first Turn. If it is far from 50%, the first Turn gives too much advantage, and no Deck change can fix it.

## 2. Archetypes

C, U, R and E are the Ranks Common, Uncommon, Rare and Epic. Each Archetype has 14 cards: the maximum Deck size at player level 5, the level of a Matchup (GDD 6). An Archetype is not a Starter Deck. It is a full Deck of the same style as a Starter Deck.

| Archetype | Class | Style | Deck |
| --- | --- | --- | --- |
| Vanguard | Warrior | Human: hold the line. Walls and Armor in front, Shooters behind, with Warrior buffs. The full Deck of the Vanguard Starter Deck. | 1× Militia Recruit (C), 1× Gate Warden (U), 1× Shieldbearer (C), 2× Crossbow Guard (C), 2× Halberdier (C), 1× Dawn Cleric (U), 2× River Knight (U), 1× Iron Bulwark (E), 1× War Drums (C), 1× Shield Wall (C), 1× Spear Throw (U) |
| Raiders | Mage | Orc: rush the enemy Hero. Charge, Flying and high attack, with Mage Fire and Frost spells. The full Deck of the Raiders Starter Deck. | 1× Badland Pup (C), 1× Pack Stalker (U), 2× Scrap Raider (C), 2× Ember Shaman (C), 1× Howling Charger (U), 2× Skyreaver (U), 1× Tusk Brute (C), 1× Warchief Grukka (E), 1× Fireball (C), 1× Frost Bolt (C), 1× Flame Wave (U) |

### 2.1 Full-set plan

The 90-Creature-Card set adds four main Archetypes and two diagnostic Decks. Their exact 14-card lists stay provisional until the missing Keywords (Sabotage, Trample, Entangle, Rally, Rebirth, Summon, Swarm), Ranger Skill Cards and Priest Skill Cards work in the rules package. Goblin and Feral have no Starter Deck in v1.

| Deck | Kind | Class | Purpose |
| --- | --- | --- | --- |
| Vanguard | Main | Warrior | Human hold-line reference |
| Thornwatch | Main | Ranger | Elf range-control and Poison reference |
| Deathless Host | Main | Priest | Undead Swarm, Rebirth and Summon reference |
| Raiders | Main | Mage | Orc rush reference |
| Tunnel Rats | Main | Ranger | Goblin Sabotage, trap and bomb reference |
| Wild Hunt | Main | Priest | Feral few-and-huge reference: Trample and Regeneration, kept alive with Priest healing |
| Accord Line | Diagnostic | Warrior | Mixed Human and Elf control; tests Armor, Rally, Entangle and ranged Units |
| Breakneck Company | Diagnostic | Mage | Mixed Undead and Orc tempo; tests cheap Units, Swarm, Charge, Fire and Frost |

The six main Archetypes form the release-gated Matchup matrix: 15 different pairs, and each pair must be in 45% to 55%. Ranger and Priest each lead two main Archetypes. Accord Line and Breakneck Company run with the same seeds and report their results, but a diagnostic result outside 45% to 55% is evidence for review, not an automatic failure.

**Provisional Tunnel Rats and Wild Hunt.** The rules package has the Goblin and Feral cards, but not the Ranger and Priest Skill Cards. Until those Skill Cards exist, Tunnel Rats and Wild Hunt are **diagnostic** Decks in `archetypes.ts`, with 14 Creature Cards and no Skill Cards. Each card is at its Base Rank, and each Deck has 1 Epic, as in Vanguard and Raiders. They become main Archetypes when they get their Skill Cards.

| Deck | Class | Style | Deck |
| --- | --- | --- | --- |
| Tunnel Rats (diagnostic) | Ranger | Goblin: make the enemy plan slower. 6 copies with Sabotage, 5 with Hobble and 4 with Last Breath. | 1× Ankle Snatcher (C), 2× Fuse Runner (C), 2× Junk Slinger (C), 2× Tunnel Saboteur (C), 1× Scrap-Plate Guard (C), 1× Junk Barricade (U), 2× Grease Trapper (U), 1× Rocket Barrel Rider (U), 1× Mine Sapper (R), 1× Grand Gearjammer (E) |
| Wild Hunt (diagnostic) | Priest | Feral: few and huge. 7 copies with Trample and 4 with Regeneration, with Web Spitter (Entangle) and Frost Elk Matriarch (Rally). | 2× Bristleback Boar (C), 1× Crag Lizard (C), 1× Frostfang Lynx (C), 2× Cave Bear (C), 1× Web Spitter (C), 1× Cave Troll (U), 2× Crag Rhino (U), 1× Frost Elk Matriarch (U), 1× Avalanche Yeti (R), 1× Woolly Mammoth (R), 1× Mountain Colossus (E) |

### 2.2 Risks to test for Goblin and Feral

The power budget checks one card. It does not see these risks. Test each one in the Matchups when the cards are in the rules package.

| Risk | Matchup that shows it | What to look at |
| --- | --- | --- |
| **Sabotage lock.** Many Sabotage Units in a row keep the enemy's next card late for many Turns. Grand Gearjammer has Sabotage 2. | Tunnel Rats against each other main Archetype | The number of Turns in which the enemy has no Ready card. If a lock occurs, add a rule, for example a maximum extra Countdown for one card. Do not make Sabotage N grow with Rank (ADR-0017). |
| **Feral slow start.** Feral has no Countdown 1 card, so it plays nothing in Turn 1. | Wild Hunt against Raiders | Raiders wins above 55%, or Wild Hunt is Routed early. |
| **Trample against cheap Units.** Trample is strongest against a Lane full of small Units. | Wild Hunt against Deathless Host | Deathless Host wins below 45%. |
| **Hobble and Sabotage against slow Units.** Feral Units already have Speed 1. Hobble does almost nothing to them, but Sabotage delays their big cards. | Tunnel Rats against Wild Hunt | One side wins above 55%. |

## 3. Matchup results

Player level 5 and no Gear on both Sides. 2000 Battles for each Matchup (1000 seeds, both ways). The win rate is for the Archetype in the row. **No Ready** is the average number of Turns of the Archetype in the row with no Ready card in the Hand at the start of its Play Phase. It is for review only. A pair with a diagnostic Deck shows "review" when it is outside 45% to 55%, and it does not fail the check.

| Archetype | Opponent | Win rate | First-Side win rate | Average Turn | No Ready | Target |
| --- | --- | --- | --- | --- | --- | --- |
| Vanguard | Vanguard | 50.0% | 49.3% | 22.0 | 12.0 | Mirror |
| Vanguard | Raiders | 50.6% | 51.0% | 19.7 | 9.9 | 45%–55% |
| Vanguard | Tunnel Rats | 86.8% | 50.4% | 21.2 | 12.5 | Review |
| Vanguard | Wild Hunt | 5.4% | 50.6% | 21.8 | 11.6 | Review |
| Raiders | Raiders | 50.0% | 51.4% | 19.1 | 9.2 | Mirror |
| Raiders | Tunnel Rats | 92.5% | 50.7% | 18.5 | 9.8 | Review |
| Raiders | Wild Hunt | 15.8% | 53.6% | 20.4 | 10.5 | Review |
| Tunnel Rats | Tunnel Rats | 50.0% | 47.8% | 23.4 | 14.7 | Mirror |
| Tunnel Rats | Wild Hunt | 1.9% | 51.1% | 20.6 | 10.9 | Review |
| Wild Hunt | Wild Hunt | 50.0% | 49.1% | 27.1 | 17.5 | Mirror |

The table shows each pair one time. The reverse row has the other win rate (100% minus this one) and the No Ready value of the other Archetype. The results come from `bun run sim matchup 1000` on 2026-10-06. The Vanguard and Raiders results did not change when the Goblin and Feral cards and Keywords came into the rules package.

**Goblin and Feral risks (2.2).** The diagnostic Decks have no Skill Cards, and the AI ignores Sabotage, Trample, Entangle and Rally when it selects a play. Thus these results are evidence for review, not a balance approval.

| Risk | Result | Finding |
| --- | --- | --- |
| Sabotage lock | The share of Turns with no Ready card (No Ready ÷ Average Turn). Vanguard: 59% against Tunnel Rats, 50% to 55% against the other Decks. Raiders: 53%, against 48% to 52%. Wild Hunt: 59%, against 55% to 65%. | No lock. Sabotage adds at most about 5 percentage points. Do not add an anti-lock rule now. |
| Feral slow start | Raiders wins 15.8% against Wild Hunt. | The slow start does not occur. Raiders does not win above 55%. |
| Trample against cheap Units | Deathless Host is not in the rules package. Wild Hunt wins 98.1% against Tunnel Rats, a Deck of cheap Units. | Not tested. Test it when Deathless Host exists. |
| Hobble and Sabotage against slow Units | Tunnel Rats wins 1.9% against Wild Hunt. | The risk occurs in the other direction: Hobble and Sabotage do not stop Feral. |

**Wild Hunt is too strong, and Tunnel Rats is too weak.** Wild Hunt wins 84% to 98% against each Deck. Tunnel Rats wins 2% to 13%. A test with Trample removed from all cards gives Wild Hunt 93.5% against Vanguard, and a test with no Feral Regeneration gives 95.0% (200 Battles each). Thus the Feral strength does not come mainly from Trample or Regeneration. Each Feral card is in its ±10% budget. A possible cause: the power points give too few points for high HP and Attack on one Unit. Review the Feral HP values and the Goblin Attack and HP values with the Ranger and Priest Skill Cards. Do this before Tunnel Rats and Wild Hunt become main Archetypes. This issue did not change card values.

**Knockback 2 and 3.** The Matchup above uses the Common Shieldbearer (Knockback 1). The same Vanguard Deck with that one copy at Epic (Knockback 2) wins 54.3% against Raiders. At Legendary (Knockback 3) it wins 58.0%. 58% is above the 55% band. Knockback 2 and 3 can lock a melee Unit whose Speed is lower than N: the Unit never reaches the Shieldbearer to attack it. Only Combine makes these copies. The power points use the Base Rank value, so the budget check does not see this lock.

### 3.1 Balance changes

| Date | Change | Reason |
| --- | --- | --- |
| 2026-10-05 | Scrap Raider HP 3 → 4. Ember Shaman Attack 3 → 4 and HP 5 → 6. Skyreaver HP 4 → 5. Howling Charger HP 5 → 6. Iron Bulwark HP 17 → 15. | Vanguard won 66.8% against Raiders. Most Orc cards were below their power budget, and Iron Bulwark was 8% above it. After the change, all 5 cards are within ±10% of their budget, and Vanguard wins 50.5%. |

## 4. When an Archetype or a card changes

1. Change the data in `archetypes.ts`, `decks.ts` or `cards.ts`.
2. Run `bun run sim matchup 1000` in `packages/rules`. Use `--level N` and `--gear N` to check other levels. CI runs `bun run rules:sim:check`, and it fails when a Matchup is not on its target.
3. Update the tables in sections 2 and 3.
4. A new Archetype does not have to be a Starter Deck. Give it a name, a Class and a style, and add it to section 2.
