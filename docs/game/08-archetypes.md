# 08 — Archetypes

This document gives the **Archetypes** and the results of their **Matchups** (GDD 13, steps 4 and 5). An Archetype is a named reference Deck for one style of play. Balance simulations use Archetypes. A Player never sees an Archetype. The data is in `packages/rules/src/content/archetypes.ts`.

## 1. Rules for the Matchups

- **The AI plays both Sides.** Both Sides use the enemy AI (GDD 9).
- **Both Sides start equal.** Both Heroes have the same player level, the same Hero HP and the same Gear. The Board has 3 Lanes, as in a Stage (ADR-0010), with no Closed Lanes and no Start Units.
- **Each seed plays both ways.** The first Side always takes the first Turn. Thus each seed plays 2 Battles, with the Sides swapped. Then the first-Turn advantage does not change the win rate of an Archetype. A mirror Matchup (an Archetype against itself) always gives exactly 50%.
- **Win-rate target.** Each main Archetype must win 45% to 55% of its Matchups against each other main Archetype (GDD 13, PRD 7). Diagnostic Decks expose mixed-Race combinations, but they do not gate release.
- **First-Side win rate.** The table also shows the win rate of the Side that takes the first Turn. If it is far from 50%, the first Turn gives too much advantage, and no Deck change can fix it.

## 2. Archetypes

C, U, R and E are the Ranks Common, Uncommon, Rare and Epic. Each Archetype obeys the Deck rules of player level 5, the level of a Matchup (GDD 6): at most 14 cards, and a sum of Countdowns of at most 35, the Countdown Limit ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md)). A Deck of slow cards thus has fewer cards. When an Archetype was over the limit, the cards with the highest Countdown left it until it fitted. An Archetype is not a Starter Deck. It is a full, built Deck of the same style as a Starter Deck. A Starter Deck has only Common and Uncommon copies ([GDD 6.1](./03-game-design.md#61-starter-decks)).

| Archetype | Class | Style | Deck |
| --- | --- | --- | --- |
| Vanguard | Warrior | Human: hold the line. Walls and Armor in front, Shooters behind, with Warrior buffs. The style of the Vanguard Starter Deck. | 1× Town Barricade (C), 1× Militia Recruit (C), 1× Gate Warden (U), 1× Shieldbearer (C), 2× Crossbow Guard (C), 2× Halberdier (C), 1× Dawn Cleric (U), 2× River Knight (U), 1× War Drums (C), 1× Shield Wall (C), 1× Spear Throw (U). 14 cards, Countdown 35. |
| Raiders | Mage | Orc: rush the enemy Hero. Charge, Flying and high attack, with Mage Fire and Frost spells. The style of the Raiders Starter Deck. | 1× Badland Runt (C), 1× Pack Stalker (U), 2× Scrap Raider (C), 2× Ember Shaman (C), 1× Howling Charger (U), 2× Skyreaver (U), 1× Cinderhorn Breaker (U), 1× Fireball (C), 1× Frost Bolt (C), 1× Flame Wave (U). 13 cards, Countdown 34. |

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
| Vanguard Full | Diagnostic | Warrior | The full Human set; tests Wall, Rally, Unique, Knockback and a Holy Last Breath |
| Raiders Full | Diagnostic | Mage | The full Orc set; tests Rally, Retaliation, Fire, Charge and the Orc Epic pair |

The six main Archetypes form the release-gated Matchup matrix: 15 different pairs, and each pair must be in 45% to 55%. Ranger and Priest each lead two main Archetypes. Accord Line and Breakneck Company run with the same seeds and report their results, but a diagnostic result outside 45% to 55% is evidence for review, not an automatic failure.

**Breakneck Company.** Breakneck Company is a diagnostic Deck in `archetypes.ts` (issue #35): 7 Undead copies, 4 Orc copies and the 3 Mage Skill Cards of Raiders. It has 4 copies with Swarm, 4 with Charge, 3 Frost Units and 3 Fire cards. Its Frost Units are melee only, because no Ranged Unit has Frost damage ([ADR-0025](../adr/0025-no-ranged-unit-has-frost-damage.md)). Each card is at its Base Rank.

**Provisional Tunnel Rats, Wild Hunt, Thornwatch and Deathless Host.** The rules package has the Goblin, Feral, Elf and Undead cards, but not the Ranger and Priest Skill Cards. Until those Skill Cards exist, Tunnel Rats, Wild Hunt, Thornwatch and Deathless Host are **diagnostic** Decks in `archetypes.ts`, with Creature Cards only and no Skill Cards. Thornwatch has 13 cards, all Common and Uncommon, and no Rare or Epic card. Each card is at its Base Rank. Tunnel Rats has 14 cards and 1 Epic. Wild Hunt has 11 cards and no Rare or Epic card: the Countdown Limit removed Mountain Colossus (E), Woolly Mammoth (R) and Avalanche Yeti (R). Deathless Host has 14 cards with Countdown 30: Undead cards are cheap, so the 14-card maximum stops it before the Countdown Limit. It has both Undead Epics, and each card is at its Base Rank. They become main Archetypes when they get their Skill Cards.

**Vanguard Full and Raiders Full.** These diagnostic Decks use most of the 15-card Human and Orc sets, so that the Matchups test the Human and Orc cards. Each card is at its Base Rank, with 3 Skill Cards of its Class. The Countdown Limit removed Marshal Elian Voss (E) from Vanguard Full, and Warband Standard-Bearer (E) and Pyreaxe Ravager (R) from Raiders Full. Vanguard and Raiders do not change, so the release-gated results do not change. When Vanguard and Raiders change to the full sets, remove Vanguard Full and Raiders Full.

**Human Heavy and Human Light.** These diagnostic Decks test the Power Budget for each Countdown ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)). Both Decks are Human and Warrior, with Creature Cards only and no Skill Cards. Each card is at its Base Rank. Thus the Countdown is the main difference. When the budget is correct, each Deck wins 40% to 60% against the other. With the Countdown Limit, Human Heavy has 10 cards: Iron Bulwark (E), Marshal Elian Voss (E), Dawn Reliquary (R) and 1 Pavise Arbalist (R) left it.

| Deck | Class | Style | Deck |
| --- | --- | --- | --- |
| Tunnel Rats (diagnostic) | Ranger | Goblin: make the enemy plan slower. 6 copies with Sabotage, 5 with Hobble and 4 with Last Breath. | 1× Ankle Snatcher (C), 2× Fuse Runner (C), 2× Junk Slinger (C), 2× Tunnel Saboteur (C), 1× Scrap-Plate Guard (C), 1× Junk Barricade (U), 2× Grease Trapper (U), 1× Rocket Barrel Rider (U), 1× Mine Sapper (R), 1× Grand Gearjammer (E) |
| Wild Hunt (diagnostic) | Priest | Feral: few and huge. 4 copies with Trample and 4 with Regeneration, with Frost Elk Matriarch (Rally) and Frostfang Lynx (Bleed 1). | 2× Bristleback Boar (C), 1× Crag Lizard (C), 1× Frostfang Lynx (C), 2× Cave Bear (C), 1× Web Spitter (C), 1× Cave Troll (U), 2× Crag Rhino (U), 1× Frost Elk Matriarch (U). 11 cards, Countdown 33. |
| Deathless Host (diagnostic) | Priest | Undead: many cheap Units that grow stronger together, come back and bring more. 6 copies with Swarm, 4 with Summon, 3 with Rebirth and 2 Frost Units. | 1× Graveyard Drudge (C), 2× Rattleknife (C), 1× Hushbow (C), 2× Grave Bell Tender (C), 2× Chattering Cohort (U), 1× Ossuary Piper (U), 1× Coffin Lancer (R), 1× Winter Maw (R), 1× Lantern Widow (R), 1× Sir Odo, the Last Taxman (E), 1× Bone Rampart (E). 14 cards, Countdown 30. |
| Breakneck Company (diagnostic) | Mage | Mixed Undead and Orc tempo. 4 copies with Swarm, 4 with Charge, 3 melee Frost Units, 1 Fire Unit and the Mage Fire and Frost spells. | 1× Coffin-Lid Skater (C), 1× Rattleknife (C), 2× Chattering Cohort (U), 1× Pale Galloper (U), 1× Rime-Eye Reaper (U), 1× Winter Maw (R), 2× Scrap Raider (C), 1× Howling Charger (U), 1× Cinderhorn Breaker (U), 1× Fireball (C), 1× Frost Bolt (C), 1× Flame Wave (U). 14 cards, Countdown 32. |
| Thornwatch (diagnostic) | Ranger | Elf: control from range. 6 ranged copies, 6 with Regeneration and 3 with Poison. | 2× Rootbound Guard (C), 2× Bramble Duelist (C), 2× Fernwing Courier (C), 2× Mosspitcher Lookout (C), 2× Acorn Tender (C), 1× Thornline Archer (U), 1× Dewkeeper (U), 1× Bramble Nest (U). 13 cards, Countdown 35. |
| Vanguard Full (diagnostic) | Warrior | Human: hold the line, with the Human set. 2 Walls, 1 copy with Rally and 2 with Knockback. | 1× Town Barricade (C), 1× Militia Recruit (C), 1× Shieldbearer (C), 2× Crossbow Guard (C), 1× Halberdier (C), 1× Bridge Pikeman (U), 1× Banner Chaplain (U), 1× King's Courier (R), 1× Dawn Reliquary (R), 1× War Drums (C), 1× Shield Wall (C), 1× Spear Throw (U). 13 cards, Countdown 32. |
| Raiders Full (diagnostic) | Mage | Orc: rush the enemy Hero, with the Orc set. 1 copy with Rally, 1 with Charge and 2 Fire Units. | 1× Badland Runt (C), 2× Scrap Raider (C), 1× Dusthide Brawler (C), 1× Cinderhorn Breaker (U), 1× Warhowler Drummer (U), 1× Skyreaver (U), 1× Ashspit Hunter (R), 1× Mesa Pit-Fighter (R), 1× Fireball (C), 1× Frost Bolt (C), 1× Flame Wave (U). 12 cards, Countdown 32. |
| Human Heavy (diagnostic) | Warrior | Human, Countdown 3 to 4. The average Countdown is 3.5. | 2× Halberdier (C), 1× Gate Warden (U), 1× Bridge Pikeman (U), 1× Dawn Cleric (U), 2× River Knight (U), 2× King's Courier (R), 1× Pavise Arbalist (R). 10 cards, Countdown 35. |
| Human Light (diagnostic) | Warrior | Human, Countdown 1 to 3. The average Countdown is 2.0. | 3× Militia Recruit (C), 1× Town Barricade (C), 3× Shieldbearer (C), 3× Crossbow Guard (C), 2× Halberdier (C), 1× Banner Chaplain (U), 1× Dawn Cleric (U). 14 cards, Countdown 28. |

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
| Vanguard | Vanguard | 50.0% | 46.4% | 23.8 | 12.3 | Mirror |
| Vanguard | Raiders | 49.4% | 47.2% | 18.3 | 7.6 | 45%–55% |
| Vanguard | Tunnel Rats | 66.7% | 47.9% | 22.4 | 12.5 | Review |
| Vanguard | Wild Hunt | 43.2% | 50.2% | 22.5 | 11.0 | Review |
| Vanguard | Thornwatch | 40.7% | 45.2% | 23.0 | 11.8 | Review |
| Vanguard | Deathless Host | 59.7% | 50.1% | 25.1 | 13.7 | Review |
| Vanguard | Breakneck Company | 59.5% | 49.6% | 20.5 | 9.7 | Review |
| Vanguard | Vanguard Full | 80.3% | 46.9% | 24.1 | 12.6 | Review |
| Vanguard | Raiders Full | 54.8% | 47.7% | 18.5 | 7.8 | 45%–55% |
| Vanguard | Human Heavy | 44.5% | 45.9% | 20.5 | 9.0 | Review |
| Vanguard | Human Light | 59.4% | 46.1% | 24.4 | 13.1 | Review |
| Raiders | Raiders | 50.0% | 42.7% | 15.5 | 5.3 | Mirror |
| Raiders | Tunnel Rats | 48.1% | 46.6% | 18.7 | 10.0 | 45%–55% |
| Raiders | Wild Hunt | 40.2% | 47.9% | 18.1 | 8.7 | Review |
| Raiders | Thornwatch | 43.3% | 48.4% | 18.3 | 9.1 | Review |
| Raiders | Deathless Host | 54.6% | 49.5% | 21.0 | 11.9 | 45%–55% |
| Raiders | Breakneck Company | 57.0% | 48.8% | 16.8 | 7.0 | Review |
| Raiders | Vanguard Full | 80.3% | 47.3% | 19.1 | 9.6 | Review |
| Raiders | Raiders Full | 61.7% | 46.7% | 15.8 | 5.5 | Review |
| Raiders | Human Heavy | 30.0% | 43.7% | 16.2 | 6.6 | Review |
| Raiders | Human Light | 50.0% | 49.1% | 19.6 | 10.3 | 45%–55% |
| Tunnel Rats | Tunnel Rats | 50.0% | 47.3% | 22.5 | 13.8 | Mirror |
| Tunnel Rats | Wild Hunt | 41.2% | 48.3% | 21.9 | 12.4 | Review |
| Tunnel Rats | Thornwatch | 31.2% | 51.3% | 22.0 | 12.5 | Review |
| Tunnel Rats | Deathless Host | 63.1% | 48.6% | 25.2 | 15.8 | Review |
| Tunnel Rats | Breakneck Company | 66.3% | 48.6% | 20.3 | 11.0 | Review |
| Tunnel Rats | Vanguard Full | 67.3% | 49.3% | 24.3 | 15.0 | Review |
| Tunnel Rats | Raiders Full | 61.2% | 47.8% | 18.9 | 9.6 | Review |
| Tunnel Rats | Human Heavy | 45.7% | 45.9% | 20.7 | 11.3 | 45%–55% |
| Tunnel Rats | Human Light | 25.4% | 47.9% | 22.9 | 13.4 | Review |
| Wild Hunt | Wild Hunt | 50.0% | 52.8% | 22.1 | 14.8 | Mirror |
| Wild Hunt | Thornwatch | 32.5% | 46.2% | 21.6 | 14.3 | Review |
| Wild Hunt | Deathless Host | 56.5% | 50.0% | 25.5 | 18.2 | Review |
| Wild Hunt | Breakneck Company | 62.4% | 51.9% | 21.8 | 14.5 | Review |
| Wild Hunt | Vanguard Full | 82.5% | 48.3% | 22.9 | 15.7 | Review |
| Wild Hunt | Raiders Full | 63.6% | 47.3% | 18.5 | 11.3 | Review |
| Wild Hunt | Human Heavy | 53.8% | 53.3% | 20.3 | 13.0 | 45%–55% |
| Wild Hunt | Human Light | 46.5% | 50.1% | 23.6 | 16.3 | 45%–55% |
| Thornwatch | Thornwatch | 50.0% | 45.5% | 23.4 | 14.4 | Mirror |
| Thornwatch | Deathless Host | 85.4% | 49.5% | 23.2 | 14.5 | Review |
| Thornwatch | Breakneck Company | 80.6% | 51.2% | 19.1 | 10.3 | Review |
| Thornwatch | Vanguard Full | 85.1% | 47.3% | 23.0 | 14.2 | Review |
| Thornwatch | Raiders Full | 62.5% | 46.6% | 18.5 | 9.6 | Review |
| Thornwatch | Human Heavy | 60.8% | 47.3% | 19.8 | 10.9 | Review |
| Thornwatch | Human Light | 59.8% | 49.0% | 24.2 | 15.3 | Review |
| Deathless Host | Deathless Host | 50.0% | 48.2% | 27.8 | 18.3 | Mirror |
| Deathless Host | Breakneck Company | 61.9% | 49.2% | 23.1 | 13.8 | Review |
| Deathless Host | Vanguard Full | 68.0% | 46.4% | 25.8 | 16.4 | Review |
| Deathless Host | Raiders Full | 45.9% | 51.8% | 21.3 | 11.9 | 45%–55% |
| Deathless Host | Human Heavy | 55.8% | 47.2% | 23.5 | 14.1 | Review |
| Deathless Host | Human Light | 21.4% | 47.0% | 25.4 | 15.8 | Review |
| Breakneck Company | Breakneck Company | 50.0% | 53.9% | 18.3 | 8.4 | Mirror |
| Breakneck Company | Vanguard Full | 68.0% | 49.5% | 22.2 | 12.3 | Review |
| Breakneck Company | Raiders Full | 53.9% | 50.5% | 17.2 | 6.7 | 45%–55% |
| Breakneck Company | Human Heavy | 40.4% | 52.5% | 19.2 | 9.0 | Review |
| Breakneck Company | Human Light | 25.6% | 50.2% | 20.7 | 11.0 | Review |
| Vanguard Full | Vanguard Full | 50.0% | 46.2% | 27.3 | 15.7 | Mirror |
| Vanguard Full | Raiders Full | 27.5% | 49.3% | 19.7 | 9.3 | Review |
| Vanguard Full | Human Heavy | 16.4% | 49.1% | 20.6 | 9.3 | Review |
| Vanguard Full | Human Light | 26.7% | 49.5% | 25.2 | 13.9 | Review |
| Raiders Full | Raiders Full | 50.0% | 47.4% | 16.1 | 6.7 | Mirror |
| Raiders Full | Human Heavy | 30.9% | 50.2% | 16.6 | 7.8 | Review |
| Raiders Full | Human Light | 41.6% | 48.2% | 19.6 | 11.2 | Review |
| Human Heavy | Human Heavy | 50.0% | 50.0% | 18.5 | 12.2 | Mirror |
| Human Heavy | Human Light | 45.3% | 47.4% | 21.4 | 15.0 | 45%–55% |
| Human Light | Human Light | 50.0% | 45.7% | 25.5 | 16.2 | Mirror |

The table shows each pair one time. The reverse row has the other win rate (100% minus this one) and the No Ready value of the other Archetype. The table rounds each win rate to 0.1%. Thus a reverse win rate can be 0.1 percentage points different from 100% minus this one. The results come from `bun run sim matchup 1000` on 2026-10-09, after the Undead cards came in (issue #35, 3.1). The pairs without an Undead Deck have the same results with the first and the final Undead values, so the Undead cards do not change them. Their differences from the table of 2026-10-08 (for example Vanguard against Raiders, 49.1% → 49.4%, and shorter Battles) come from the rules changes after that date (issues #31 to #33).

**Goblin, Feral and Undead risks (2.2).** The diagnostic Decks have no Skill Cards, and the AI ignores Sabotage, Trample, Entangle, Rally, Swarm, Rebirth and Summon when it selects a play. Thus these results are evidence for review, not a balance approval.

| Risk | Result | Finding |
| --- | --- | --- |
| Sabotage lock | The share of Turns with no Ready card (No Ready ÷ Average Turn). Vanguard: 59% against Tunnel Rats, 48% to 55% against the other Decks. Raiders: 60%, against 49% to 59%. Wild Hunt: 71%, against 65% to 70%. | No lock. Sabotage adds at most about 4 percentage points. All Cards in the Hand count down again, so a Sabotaged card is late by N Turns only. Do not add an anti-lock rule now. |
| Feral slow start | Raiders wins 40.1% against Wild Hunt. | The slow start does not occur. Raiders does not win above 55%. |
| Trample against cheap Units | Deathless Host wins 43.5% against Wild Hunt. It wins 40.3% against Vanguard and 45.4% against Raiders, and 43.4% on average against the 10 other Archetypes. | The risk is small. Deathless Host is under 45% against Wild Hunt, but only 0.1 percentage points under its average. Trample does not take much more from it than the other Decks do. Test it again when Deathless Host gets its Priest Skill Cards. |
| Hobble and Sabotage against slow Units | Tunnel Rats wins 41.2% against Wild Hunt. | The risk does not occur: Wild Hunt wins 58.8%, which is above 55%, but in the 35% to 65% band of the ADR-0021 criteria. With the Ticking Cards, Tunnel Rats won 58.7%, because a Sabotaged card waited longer. |

**After ADR-0021 (3.2).** Each criterion of the slope search is on target with the final card values and with all Cards counting down: Human Heavy wins 45.3% against Human Light, and Wild Hunt wins 58.8%, 56.8% and 59.9% against Tunnel Rats, Vanguard and Raiders. Vanguard wins 49.1% against Raiders. The Matchups last 19.5 to 28.0 Turns on average (16.0 to 27.3 before ADR-0021), and the heavy and light Decks are near each other. With the 3 Ticking Cards (issue #21 to #26), Human Heavy won 51.8% against Human Light, and Wild Hunt won 41.3%, 56.0% and 48.5%. Thornwatch wins 65.0% on average against the 8 other Archetypes. The paragraphs below give the results before ADR-0021, as a record.

**Before ADR-0021: Wild Hunt was too strong, and Tunnel Rats was too weak.** Before ADR-0020, Wild Hunt won 84% to 98% against Vanguard, Raiders and Tunnel Rats, and Tunnel Rats won 2% to 13% against Vanguard, Raiders and Wild Hunt. A test with Trample removed from all cards gave Wild Hunt 93.5% against Vanguard, and a test with no Feral Regeneration gave 95.0% (200 Battles each). Thus the Feral strength does not come mainly from Trample or Regeneration.

The cause is not the Race. It is the Power Budget (tests on 2026-10-07, 200 seeds each). A Goblin Deck of Countdown 3 to 6 cards won 99.5% against Wild Hunt. A Human Deck of Countdown 3 to 6 cards won 100% against a Human Deck of Countdown 1 to 3 cards. Wild Hunt has the highest average Countdown (3.4) and Tunnel Rats the lowest (2.3). There are two causes:

1. The Power Points used the Common Attack and HP, but a copy plays at its Base Rank: Rare ×1.45 and Epic ×1.75. The heavy Decks have the Rare and Epic cards. [ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md) fixes this (3.1).
2. Each Countdown point got 5 Power Points. All cards in the Hand counted down at the same time, and a Hero draws 1 card each Turn, so a long Countdown was mostly a delay. With the Rank fix, a slope of about 1 Power Point for each Countdown point brought the heavy and light Decks near 50%. These tests used a rough stat fit.

**After ADR-0020, the Rank fix alone did not fix it.** These are the results after ADR-0020 and before ADR-0021. Each one is outside its target:

| Matchup | Win rate | Target |
| --- | --- | --- |
| Human Heavy against Human Light | 100.0% | 40% to 60% |
| Wild Hunt against Vanguard | 93.1% | 35% to 65% |
| Wild Hunt against Raiders | 83.5% | 35% to 65% |
| Tunnel Rats against Vanguard | 3.8% | 35% to 65% |
| Tunnel Rats against Raiders | 2.6% | 35% to 65% |

Wild Hunt and Tunnel Rats are almost the same as before the change. Before it, Wild Hunt won 93.8% against Vanguard and 85.0% against Raiders (200 seeds). Human Heavy wins 94.6% to 100% against each Deck except Wild Hunt (86.6%). Human Light wins 49.3% against Tunnel Rats and 19.9% or less against each other Deck. Thus the Countdown slope is the remaining cause. The slope search is in 3.2. Do not change only the Feral and Goblin values.

**Knockback 2 and 3.** This was measured before ADR-0020. The Matchup uses the Common Shieldbearer (Knockback 1). The same Vanguard Deck with that one copy at Epic (Knockback 2) wins 54.3% against Raiders. At Legendary (Knockback 3) it wins 58.0%. 58% is above the 55% band. Knockback 2 and 3 can lock a melee Unit whose Speed is lower than N: the Unit never reaches the Shieldbearer to attack it. Only Combine makes these copies. The power points use the Base Rank value, so the budget check does not see this lock.

**Bleed (ADR-0019).** Bleed changes no Wild Hunt win rate by more than 0.2 percentage points. This was measured on 2026-10-07 with `bun run sim matchup 1000`, against the same rules with no Bleed. Wild Hunt has 1 Frostfang Lynx (Bleed 1), and no Archetype has Old Frostmaw. The other Archetypes heal little: only Vanguard has a heal, 1 Dawn Cleric (Regeneration 1). Wild Hunt had 4 Regeneration copies at that time (4 now too: Web Spitter changed Entangle for Regeneration 1), so Bleed matters most in the Wild Hunt mirror. Thus Bleed does not make Wild Hunt stronger. Test Bleed again when an Elf Archetype with healers exists. The other results on that branch changed for other reasons, so the table did not change at that time.

**Vanguard Full and Raiders Full are weak (for review).** Vanguard Full wins 19.7% against Vanguard, 19.4% against Raiders and 27.3% against Raiders Full. Raiders Full wins 45.4% against Vanguard and 37.8% against Raiders. Before ADR-0021, Vanguard Full won 6.5% to 14.9% against these Decks, and Raiders Full won 74.5% against Vanguard and 63.0% against Raiders. Each card is in its ±10% budget. The AI ignores Rally when it selects a play. Thus these results are evidence for review, not a balance approval. Possible causes, not tested: the Countdown Limit removed their Epic cards, so they have only 13 and 12 cards, and Vanguard Full has 2 Walls with Attack 0 in place of attacking Units. Review the Human and Orc values in a separate issue.

### 3.1 Balance changes

| Date | Change | Reason |
| --- | --- | --- |
| 2026-10-05 | Scrap Raider HP 3 → 4. Ember Shaman Attack 3 → 4 and HP 5 → 6. Skyreaver HP 4 → 5. Howling Charger HP 5 → 6. Iron Bulwark HP 17 → 15. | Vanguard won 66.8% against Raiders. Most Orc cards were below their power budget, and Iron Bulwark was 8% above it. After the change, all 5 cards are within ±10% of their budget, and Vanguard wins 50.5%. |
| 2026-10-07 | Old Frostmaw HP 14 → 13, and it gets Bleed 2. Frostfang Lynx gets Bleed 1 with no other change. | Bleed N costs N × 1 power points ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). With Bleed 2 and HP 14, Old Frostmaw was 11.1% above its budget. With HP 13 it is 8.3% above. The Frostfang Lynx is 6.3% above its budget. |
| 2026-10-07 | The Power Points measure Attack and HP at the Base Rank ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)). The Common Attack and HP of the 40 Uncommon, Rare and Epic Creature Cards go down, so that each card is within ±10% of its Power Budget again. The new values are in `cards.ts` and [10 — Card Concepts](./10-card-concepts.md). Countdown, Speed, Range, Damage Type and Keywords do not change. A Wall changes only its HP. Each card fits, so no card needs a written reason. | A Rare copy played ×1.45 and an Epic copy ×1.75 above its budget. Most fits keep the old power of the card. Each fit keeps the Attack-to-HP shape as near as the whole numbers let it. Pack Stalker, Sidestep Shiv and Warhowler Drummer have no fit with a nearer shape. Three fits are for the Matchup and the Stages. River Knight is 5/7 (+3.8%): the first fit had River Knight 4/7 and Skyreaver 2/5, and Vanguard won only 36.5% against Raiders and 39% of Stage 1-4 (200 seeds). Skyreaver is 3/4 (+9.5%): with 2/5, Raiders won only 54% of Stages 1-5 and 1-6. Warchief Grukka is 4/7 (+2.8%): with 4/8, Vanguard won 44.5% against Raiders. Now Vanguard wins 48.4%. Some Stage enemy Decks changed too ([14 — Campaign Stages](./14-campaign-stages.md)). |
| 2026-10-08 | ADR-0021 in the rules package (issue #21): the 3 Ticking Cards, the Countdown Limit and the budget `12 + 3 × Countdown`. `bun scripts/fit-budget.ts 12 3` gives the Common Attack and HP of each Creature Card, and `cards.ts` uses each fit with no hand change. Each card is within ±6.7% of its budget. The Archetypes lose their cards with the highest Countdown until each one fits the limit of level 5 (35), as in the slope search (3.2). Then 1 hand change: Vanguard gets a Town Barricade (C) as its 14th card (Countdown 35). The Starter Decks change to fit the limit of level 1 (25) ([GDD 6.1](./03-game-design.md#61-starter-decks)), and the Stage enemy Decks change ([14 — Campaign Stages](./14-campaign-stages.md)). | Before ADR-0021, Countdown was only a delay (3.2). With only the cards removed, Vanguard won 44.5% against Raiders, under its target. A second Militia Recruit gave 56.4%, and Tunnel Rats then won only 34.3% against Vanguard. A Shieldbearer in place of Shield Wall gave 48.2%. The Town Barricade gives 48.9%, and each other criterion of 3.2 stays on target. |
| 2026-10-08 | Charge becomes Charge N: +N Speed in the Turn of the summon, with N 1 up to Rare, 2 at Epic and 3 at Legendary, and N × 1 power points ([GDD 5.4 and 13](./03-game-design.md#54-keywords-v1)). The 4 Uncommon and Rare Charge cards go from +2 to +1 Speed at their Base Rank. Raiders: Tusk Brute (C) → Cinderhorn Breaker (U). | With Charge 1, Vanguard won only 44.7% against Raiders, under its target. With the old Charge 2 on the same rules it won 47.9%: Raiders got stronger, not weaker. A stat increase on the Charge cards would thus make the miss larger. Of the 1-card changes to Raiders, Cinderhorn Breaker keeps the Charge and Fire style and gives 49.3%. The Charge cards are now 3.3% to 9.5% under their budget (Howling Charger 19/21). All Stages stay on target. |
| 2026-10-08 | No Range above 3, and Entangle only on a Ranged Unit with Base Rank Epic or higher ([ADR-0022](../adr/0022-no-range-above-3-and-entangle-only-on-epic-ranged-units.md), issue #23). Mosspitcher Lookout 3/6, Range 3, Regeneration 1. Acorn Tender 3/3. Thornline Archer 3/3, Range 3. Bramble Duelist Speed 1. Rootbound Guard Regeneration 1 in place of Entangle. Amberwing Dart 2/3, Poison in place of Entangle. Web Spitter Regeneration 1 in place of Entangle. Canopy Vinewarden Range 3. Pavise Arbalist 3/6, Ashspit Hunter 4/4, Spyglass Sniper 3/6 and Elderreed Dartmaster 3/7, all Range 3. | Thornwatch won 82% to 97% against each other Archetype. A Range 4 Shooter hits for many Turns before a melee Unit gets near it, and a Ranged Unit with Entangle keeps the nearest enemy at Speed 0. After the change, Thornwatch wins 57.0% against Vanguard, 49.5% against Raiders and 61.1% on average against the 8 other Archetypes (1000 seeds). Vanguard Full, which loses to almost all Decks, causes most of the 61.1%. The Rare Shooters are 8.3% over their budget, because a Range cut is worth more than its 1 Power Point. Human Heavy is still 4 to 8 points weaker than before. Vanguard wins 49.3% against Raiders, and no Stage changes by more than 1 point. |
| 2026-10-08 | Speed 1 is the default, and the Role sets more Speed ([ADR-0024](../adr/0024-speed-1-is-the-default.md)). Militia Recruit 3/8, Speed 1 (it was 3/6, Speed 2). Sidestep Shiv 3/4, Speed 1 (it was 2/5, Speed 2). Mine Sapper 3/5, Speed 1 (it was 3/4, Speed 2). Boss Snikkit 2/4, Speed 1 (it was 2/3, Speed 2). | No rule gave a Unit Speed 2, and a Frontliner and 3 Goblin Strikers broke the Role text of GDD 5.6. Each card stays within 1 power point of its old power. Vanguard wins 47.2% against Raiders (it was 47.6%). The diagnostic Decks with these cards are weaker: Tunnel Rats wins 37.5% against Vanguard (it was 42.5%) and 53.8% against Raiders (it was 59.9%), and Human Light wins 39.6% against Vanguard (it was 46.7%) and 50.1% against Raiders (it was 56.5%). Militia Recruit has no more room in its budget (16 of 15), so these results stay. Some Stage enemy Decks changed too ([14 — Campaign Stages](./14-campaign-stages.md)). |
| 2026-10-08 | The Ticking Cards are removed, and all Cards in the Hand count down again ([ADR-0021](../adr/0021-countdown-is-a-real-cost.md), issue #26). The Power Budget is written `21 + s × (Countdown − 3)`, and the fit selects `s = 3`, so it does not change (3.2). No card, Archetype or Starter Deck changes. Stage enemy Decks 1-6, 1-7 and 1-8 change ([14 — Campaign Stages](./14-campaign-stages.md)). | The Ticking Cards made Battles slow, and the Player had to track the Hand order and the cards that waited. Each flatter slope fails the criteria (3.2). With the cards of 3.1, each criterion is on target: Human Heavy wins 45.3% against Human Light, Wild Hunt wins 58.8%, 56.8% and 59.9% against Tunnel Rats, Vanguard and Raiders, and Vanguard wins 49.1% against Raiders (1000 seeds). Tunnel Rats wins 33.3% against Vanguard (it was 37.5%). |
| 2026-10-09 | The Undead cards come in (issue #35). Summon X uses 50% of the Token power (it was 80%), and Swarm N uses N × 1 points (it was N × 2) ([GDD 13](./03-game-design.md#13-balance-process)). The Skeleton Token power goes down by 1 at each Rank, because it has Swarm 1. The Undead Attack and HP are the fit of `bun scripts/fit-budget.ts 12 3 --hp-per-attack 2`: 1 Attack for each 2 HP at the Base Rank, not the shapes of the old lines ([10 — Card Concepts, 5](./10-card-concepts.md#5-undead-creature-cards)). Sir Odo is 2/4 (4/7 at Epic). Each Undead card is within ±5.6% of its budget. New diagnostic Decks: Deathless Host and Breakneck Company (2.1). No other card changes, because no other card has Summon or Swarm. | With the plain fit (the old shapes, Summon 80% and Swarm N × 2), Deathless Host won 1.7% to 21.1% against each Deck without Undead cards, and Breakneck Company 6.5% to 33.2% (1000 seeds). Scratch tests (200 seeds, against Vanguard): with no Summon, Swarm and Rebirth on the cards and the points back in Attack and HP, Deathless Host won 23%. Thus the Keyword points were too high, and the stat shapes were the second cause. The old shapes are extreme (4/3, 5/3, 1/8), and the power `Attack × 2 + HP` gives the largest Attack × HP at HP = 2 × Attack. With shape 2 and the old points, Deathless Host won 14%. With shape 2, Summon 50% and Swarm N × 1, it won 39%. Summon 40% gave the same, and Summon 30% gave 59%, so 50% stays. With no Rebirth and its points back in Attack and HP, Deathless Host won about the same as with Rebirth (4.8% and 5.3%), so Rebirth 5 stays. Now Deathless Host wins 40.3% against Vanguard and 45.4% against Raiders, and Breakneck Company 40.5% and 43.0% (1000 seeds). All Stages stay on target, with no change. |

### 3.2 Countdown slope search

Issue #20, 2026-10-07. The result is [ADR-0021](../adr/0021-countdown-is-a-real-cost.md): a Countdown Limit of 2.5 × the maximum Deck size and the budget `21 + s × (Countdown − 3)` with `s = 3` (the same as `12 + 3 × Countdown`). The first result also had 3 Ticking Cards. The rules package had them from issue #21, and issue #26 removed them. The second search, with all Cards counting down, is at the end of this section.

**Why the slope was flat.** A Hero draws 4 cards, then 1 card each Turn, so it draws a 14-card Deck fully by about Turn 11. A Battle lasts 16 to 27 Turns. All cards in the Hand counted down at the same time, so a Hero played almost every card in the Deck at any Countdown. The Deck size limited the cards, and a long Countdown was only a delay.

**Method.** `bun scripts/fit-budget.ts <intercept> <slope>` in `packages/rules` fits each Creature Card to a linear budget. It changes only Attack and HP, at the Base Rank, and it keeps the Attack-to-HP shape nearest to the current card. A power within 5% of the budget (at least 1 point) is a hit. The budget at Countdown 3 stays 21, so the intercept is `21 − 3 × slope`. Countdown is a real cost when `budget(6) ≥ 1.6 × budget(2)`, so the slope must be 2.75 or more. Scratch code added the two rules in memory. For a Countdown Limit, the cards with the highest Countdown leave an Archetype until it fits. The Matchup level is 5, so the maximum Deck size is 14. A 200-seed grid tested slopes 0 to 5, then 1000 seeds tested the best points.

**Criteria.** Human Heavy against Human Light 40% to 60%. Wild Hunt against Tunnel Rats, Vanguard and Raiders 35% to 65%. Vanguard against Raiders 45% to 55%.

| Rules | Slope | Seeds | HH–HL | WH–TR | WH–V | WH–R | V–R | TR–V | TR–R | Ratio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No rule change | 1 | 200 | 61.3% | 55.3% | 46.8% | 58.0% | 50.7% | 37.3% | 58.0% | 1.20 |
| No rule change | 2.75 | 200 | 98.0% | 87.3% | 81.0% | 74.3% | 41.8% | 11.8% | 19.0% | 1.60 |
| Countdown Limit 3 × | 2.75 | 200 | 93.5% | 86.8% | 60.8% | 57.0% | 41.8% | 11.8% | 19.0% | 1.60 |
| Countdown Limit 2.5 × | 2.75 | 200 | 66.0% | 61.3% | 51.0% | 45.3% | 34.3% | 27.8% | 37.0% | 1.60 |
| 2 Ticking Cards | 2.75 | 1000 | 50.7% | 31.3% | 57.6% | 61.4% | 55.3% | 43.0% | 69.0% | 1.60 |
| 3 Ticking Cards | 2.75 | 200 | 83.8% | 44.8% | 71.8% | 65.3% | 43.8% | 23.3% | 38.0% | 1.60 |
| Limit 3 × and 2 Ticking Cards | 2.75 | 1000 | 59.9% | 33.5% | 46.8% | 51.0% | 55.3% | 43.0% | 69.0% | 1.60 |
| **Limit 2.5 × and 3 Ticking Cards** | **3** | **1000** | **51.8%** | **41.3%** | **55.4%** | **48.5%** | **44.5%** | **45.0%** | **60.1%** | **1.67** |

HH is Human Heavy, HL Human Light, WH Wild Hunt, TR Tunnel Rats, V Vanguard and R Raiders. The ratio is `budget(6) ÷ budget(2)`.

- With a Countdown Limit of 2.5 ×, Human Heavy has 10 cards, Wild Hunt 11, Vanguard 13 and Raiders 13. Vanguard and Raiders each lose their Epic card. With 3 ×, Human Heavy has 11 and Wild Hunt 13.
- Only Ticking Cards makes cheap cards and Sabotage strong: with 2, Tunnel Rats wins against Wild Hunt.
- The selected rules miss only Vanguard against Raiders, by 0.5 points. The rules do not change between slopes, but Vanguard against Raiders changes by up to 15 points: 41.5%, 41.8%, 54.3% and 42.8% at slopes 2, 2.75, 3.5 and 4.25 with no rule change. The cause is the fit of a few Human and Orc cards. Thus the card changes tune it.
- The Starter Decks are over the Countdown Limit of player level 1 (25): Vanguard has 27 and Raiders 30.

**Second search: all Cards count down (issue #26, 2026-10-08).** The Ticking Cards made Battles slow, and the Player had to track the Hand order. Thus all Cards in the Hand count down again, and the Countdown Limit of 2.5 × stays. The search used the same method and criteria, with the Archetypes of 3.1. The floor is `budget(6) ≥ 1.3 × budget(2)`, so the slope must be 1.47 or more. The rule was to select the steepest slope that passes.

| Cards | Slope | Seeds | HH–HL | WH–TR | WH–V | WH–R | V–R | TR–V | TR–R | Ratio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fit | 1.47 | 1000 | 8.5% | 18.4% | 29.6% | 27.7% | 43.6% | 46.6% | 55.2% | 1.30 |
| Fit | 2 | 1000 | 28.7% | 40.8% | 42.4% | 33.8% | 33.1% | 41.0% | 39.7% | 1.42 |
| Fit | 2.5 | 1000 | 42.9% | 46.2% | 38.0% | 39.1% | 39.2% | 25.0% | 34.5% | 1.54 |
| Fit | 3 | 1000 | 59.7% | 58.8% | 43.6% | 54.1% | 58.7% | 23.6% | 49.0% | 1.67 |
| Fit | 3.25 | 1000 | 61.2% | 56.6% | 45.5% | 49.9% | 58.4% | 26.6% | 46.2% | 1.73 |
| Fit | 4 | 1000 | 86.5% | 58.1% | 47.6% | 46.4% | 55.0% | 28.6% | 43.1% | 1.94 |
| **`cards.ts`** | **3** | **1000** | **45.3%** | **58.8%** | **56.8%** | **59.9%** | **49.1%** | **33.3%** | **51.8%** | **1.67** |

- "Fit" is `bun scripts/fit-budget.ts <21 − 3s> <s>` on all Creature Cards, with no hand change. "`cards.ts`" is the card values of 3.1, which are the fit at slope 3 plus the hand changes after issue #21.
- A flat slope makes the heavy Decks too weak. The Countdown Limit gives a Deck of slow cards fewer cards, so each slow card needs more power. Human Heavy wins only 8.5% against Human Light at the floor.
- Slope 3 is the steepest that passes. From 3.05 to 3.2, the fit is the same, and Human Heavy wins 60.6%. At 3.25, it wins 61.2%. Thus the budget does not change, and Countdown stays a cost of 1.67 × from Countdown 2 to 6.
- At slope 3, the plain fit misses only Vanguard against Raiders (58.7%). The values in `cards.ts` pass each criterion, so no card changes. 66 of the 75 Creature Cards are the plain fit. The other 9 are the hand changes of ADR-0022 (Range 3 and the Elf cards) and Charge N (3.1), and each one is within ±9.6% of its budget.

## 4. When an Archetype or a card changes

1. Change the data in `archetypes.ts`, `decks.ts` or `cards.ts`.
2. Run `bun run sim matchup 1000` in `packages/rules`. Use `--level N` and `--gear N` to check other levels. CI runs `bun run rules:sim:check`, and it fails when a Matchup is not on its target.
3. Update the tables in sections 2 and 3.
4. A new Archetype does not have to be a Starter Deck. Give it a name, a Class and a style, and add it to section 2.
