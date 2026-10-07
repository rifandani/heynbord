# 08 — Archetypes

This document gives the **Archetypes** and the results of their **Matchups** (GDD 13, steps 4 and 5). An Archetype is a named reference Deck for one style of play. Balance simulations use Archetypes. A Player never sees an Archetype. The data is in `packages/rules/src/content/archetypes.ts`.

## 1. Rules for the Matchups

- **The AI plays both Sides.** Both Sides use the enemy AI (GDD 9).
- **Both Sides start equal.** Both Heroes have the same player level, the same Hero HP and the same Gear. The Board has 3 Lanes, as in a Stage (ADR-0010), with no Closed Lanes and no Start Units.
- **Each seed plays both ways.** The first Side always takes the first Turn. Thus each seed plays 2 Battles, with the Sides swapped. Then the first-Turn advantage does not change the win rate of an Archetype. A mirror Matchup (an Archetype against itself) always gives exactly 50%.
- **Win-rate target.** Each main Archetype must win 45% to 55% of its Matchups against each other main Archetype (GDD 13, PRD 7). Diagnostic Decks expose mixed-Race combinations, but they do not gate release.
- **First-Side win rate.** The table also shows the win rate of the Side that takes the first Turn. If it is far from 50%, the first Turn gives too much advantage, and no Deck change can fix it.

## 2. Archetypes

C, U, R and E are the Ranks Common, Uncommon, Rare and Epic. Each Archetype has 14 cards: the maximum Deck size at player level 5, the level of a Matchup (GDD 6). An Archetype is not a Starter Deck. It is a full, built Deck of the same style as a Starter Deck, with an Epic card. A Starter Deck has only Common and Uncommon copies ([GDD 6.1](./03-game-design.md#61-starter-decks)).

| Archetype | Class | Style | Deck |
| --- | --- | --- | --- |
| Vanguard | Warrior | Human: hold the line. Walls and Armor in front, Shooters behind, with Warrior buffs. The style of the Vanguard Starter Deck. | 1× Militia Recruit (C), 1× Gate Warden (U), 1× Shieldbearer (C), 2× Crossbow Guard (C), 2× Halberdier (C), 1× Dawn Cleric (U), 2× River Knight (U), 1× Iron Bulwark (E), 1× War Drums (C), 1× Shield Wall (C), 1× Spear Throw (U) |
| Raiders | Mage | Orc: rush the enemy Hero. Charge, Flying and high attack, with Mage Fire and Frost spells. The style of the Raiders Starter Deck. | 1× Badland Pup (C), 1× Pack Stalker (U), 2× Scrap Raider (C), 2× Ember Shaman (C), 1× Howling Charger (U), 2× Skyreaver (U), 1× Tusk Brute (C), 1× Warchief Grukka (E), 1× Fireball (C), 1× Frost Bolt (C), 1× Flame Wave (U) |

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

**Provisional Tunnel Rats and Wild Hunt.** The rules package has the Goblin and Feral cards, but not the Ranger and Priest Skill Cards. Until those Skill Cards exist, Tunnel Rats and Wild Hunt are **diagnostic** Decks in `archetypes.ts`, with 14 Creature Cards and no Skill Cards. Each card is at its Base Rank, and each Deck has 1 Epic, as in Vanguard and Raiders. They become main Archetypes when they get their Skill Cards.

**Vanguard Full and Raiders Full.** These diagnostic Decks use the full 15-card Human and Orc sets, so that the Matchups test each Human and Orc card. Each card is at its Base Rank. Each Deck has 11 Creature Cards, 3 Skill Cards of its Class and 1 Epic. Vanguard and Raiders do not change, so the release-gated results do not change. When Vanguard and Raiders change to the full sets, remove Vanguard Full and Raiders Full.

**Human Heavy and Human Light.** These diagnostic Decks test the Power Budget for each Countdown ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)). Both Decks are Human and Warrior, with 14 Creature Cards and no Skill Cards. Each card is at its Base Rank. Thus the Countdown is the main difference. When the budget is correct, each Deck wins 40% to 60% against the other.

| Deck | Class | Style | Deck |
| --- | --- | --- | --- |
| Tunnel Rats (diagnostic) | Ranger | Goblin: make the enemy plan slower. 6 copies with Sabotage, 5 with Hobble and 4 with Last Breath. | 1× Ankle Snatcher (C), 2× Fuse Runner (C), 2× Junk Slinger (C), 2× Tunnel Saboteur (C), 1× Scrap-Plate Guard (C), 1× Junk Barricade (U), 2× Grease Trapper (U), 1× Rocket Barrel Rider (U), 1× Mine Sapper (R), 1× Grand Gearjammer (E) |
| Wild Hunt (diagnostic) | Priest | Feral: few and huge. 7 copies with Trample and 4 with Regeneration, with Web Spitter (Entangle), Frost Elk Matriarch (Rally) and Frostfang Lynx (Bleed 1). | 2× Bristleback Boar (C), 1× Crag Lizard (C), 1× Frostfang Lynx (C), 2× Cave Bear (C), 1× Web Spitter (C), 1× Cave Troll (U), 2× Crag Rhino (U), 1× Frost Elk Matriarch (U), 1× Avalanche Yeti (R), 1× Woolly Mammoth (R), 1× Mountain Colossus (E) |
| Vanguard Full (diagnostic) | Warrior | Human: hold the line, with the full Human set. 2 Walls, 2 copies with Rally and 2 with Knockback. | 1× Town Barricade (C), 1× Militia Recruit (C), 1× Shieldbearer (C), 2× Crossbow Guard (C), 1× Halberdier (C), 1× Bridge Pikeman (U), 1× Banner Chaplain (U), 1× King's Courier (R), 1× Dawn Reliquary (R), 1× Marshal Elian Voss (E), 1× War Drums (C), 1× Shield Wall (C), 1× Spear Throw (U) |
| Raiders Full (diagnostic) | Mage | Orc: rush the enemy Hero, with the full Orc set. 2 copies with Rally, 2 with Charge and 3 Fire Units. | 1× Badland Pup (C), 2× Scrap Raider (C), 1× Dusthide Brawler (C), 1× Cinderhorn Ram (U), 1× Warhowler Drummer (U), 1× Skyreaver (U), 1× Ashspit Hunter (R), 1× Mesa Pit-Fighter (R), 1× Pyreaxe Ravager (R), 1× Warband Standard-Bearer (E), 1× Fireball (C), 1× Frost Bolt (C), 1× Flame Wave (U) |
| Human Heavy (diagnostic) | Warrior | Human, Countdown 3 to 6. The average Countdown is 3.9. | 2× Halberdier (C), 1× Gate Warden (U), 1× Bridge Pikeman (U), 1× Dawn Cleric (U), 2× River Knight (U), 2× King's Courier (R), 2× Pavise Arbalist (R), 1× Dawn Reliquary (R), 1× Iron Bulwark (E), 1× Marshal Elian Voss (E) |
| Human Light (diagnostic) | Warrior | Human, Countdown 1 to 3. The average Countdown is 2.0. | 3× Militia Recruit (C), 1× Town Barricade (C), 3× Shieldbearer (C), 3× Crossbow Guard (C), 2× Halberdier (C), 1× Banner Chaplain (U), 1× Dawn Cleric (U) |

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
| Vanguard | Vanguard | 50.0% | 46.7% | 23.4 | 13.3 | Mirror |
| Vanguard | Raiders | 48.4% | 44.9% | 21.2 | 11.3 | 45%–55% |
| Vanguard | Tunnel Rats | 96.3% | 50.9% | 21.3 | 12.6 | Review |
| Vanguard | Wild Hunt | 6.9% | 50.7% | 23.0 | 12.8 | Review |
| Vanguard | Vanguard Full | 85.0% | 49.1% | 23.0 | 13.1 | Review |
| Vanguard | Raiders Full | 25.6% | 49.3% | 21.5 | 11.4 | Review |
| Vanguard | Human Heavy | 0.3% | 50.0% | 18.3 | 8.3 | Review |
| Vanguard | Human Light | 97.7% | 49.5% | 20.8 | 11.2 | Review |
| Raiders | Raiders | 50.0% | 46.7% | 20.8 | 10.8 | Mirror |
| Raiders | Tunnel Rats | 97.4% | 50.1% | 18.5 | 9.8 | Review |
| Raiders | Wild Hunt | 16.6% | 50.3% | 21.9 | 11.9 | Review |
| Raiders | Vanguard Full | 92.8% | 51.2% | 19.1 | 9.5 | Review |
| Raiders | Raiders Full | 37.0% | 46.0% | 20.9 | 11.0 | Review |
| Raiders | Human Heavy | 2.7% | 51.3% | 17.5 | 7.6 | Review |
| Raiders | Human Light | 99.6% | 50.3% | 17.1 | 7.7 | Review |
| Tunnel Rats | Tunnel Rats | 50.0% | 46.7% | 24.8 | 16.1 | Mirror |
| Tunnel Rats | Wild Hunt | 1.6% | 51.0% | 20.7 | 11.1 | Review |
| Tunnel Rats | Vanguard Full | 25.9% | 49.9% | 24.7 | 15.1 | Review |
| Tunnel Rats | Raiders Full | 2.5% | 50.7% | 19.0 | 9.4 | Review |
| Tunnel Rats | Human Heavy | 0.2% | 50.2% | 17.0 | 7.4 | Review |
| Tunnel Rats | Human Light | 50.7% | 48.6% | 24.9 | 15.4 | 45%–55% |
| Wild Hunt | Wild Hunt | 50.0% | 50.3% | 27.3 | 17.8 | Mirror |
| Wild Hunt | Vanguard Full | 98.0% | 50.5% | 22.2 | 12.9 | Review |
| Wild Hunt | Raiders Full | 67.0% | 51.1% | 22.8 | 13.3 | Review |
| Wild Hunt | Human Heavy | 13.4% | 49.9% | 23.2 | 13.5 | Review |
| Wild Hunt | Human Light | 98.6% | 51.1% | 20.9 | 11.6 | Review |
| Vanguard Full | Vanguard Full | 50.0% | 49.1% | 25.0 | 14.7 | Mirror |
| Vanguard Full | Raiders Full | 6.5% | 51.6% | 19.7 | 9.6 | Review |
| Vanguard Full | Human Heavy | 0.4% | 50.2% | 17.1 | 7.3 | Review |
| Vanguard Full | Human Light | 80.2% | 50.1% | 24.7 | 14.7 | Review |
| Raiders Full | Raiders Full | 50.0% | 47.6% | 21.7 | 11.8 | Mirror |
| Raiders Full | Human Heavy | 5.4% | 50.7% | 19.0 | 9.1 | Review |
| Raiders Full | Human Light | 99.2% | 50.6% | 17.9 | 8.5 | Review |
| Human Heavy | Human Heavy | 50.0% | 41.7% | 23.5 | 14.1 | Mirror |
| Human Heavy | Human Light | 100.0% | 50.0% | 16.0 | 7.0 | Review |
| Human Light | Human Light | 50.0% | 48.7% | 26.0 | 16.6 | Mirror |

The table shows each pair one time. The reverse row has the other win rate (100% minus this one) and the No Ready value of the other Archetype. The table rounds each win rate to 0.1%. Thus a reverse win rate can be 0.1 percentage points different from 100% minus this one. The results come from `bun run sim matchup 1000` on 2026-10-07, after ADR-0020 (3.1).

**Goblin and Feral risks (2.2).** The diagnostic Decks have no Skill Cards, and the AI ignores Sabotage, Trample, Entangle and Rally when it selects a play. Thus these results are evidence for review, not a balance approval.

| Risk | Result | Finding |
| --- | --- | --- |
| Sabotage lock | The share of Turns with no Ready card (No Ready ÷ Average Turn). Vanguard: 59% against Tunnel Rats, 45% to 57% against the other Decks. Raiders: 53%, against 43% to 54%. Wild Hunt: 60%, against 56% to 65%. | No lock. Sabotage adds at most about 5 percentage points. Do not add an anti-lock rule now. |
| Feral slow start | Raiders wins 16.6% against Wild Hunt. | The slow start does not occur. Raiders does not win above 55%. |
| Trample against cheap Units | Deathless Host is not in the rules package. Wild Hunt wins 98.5% against Tunnel Rats, a Deck of cheap Units. | Not tested. Test it when Deathless Host exists. |
| Hobble and Sabotage against slow Units | Tunnel Rats wins 1.6% against Wild Hunt. | The risk occurs in the other direction: Hobble and Sabotage do not stop Feral. |

**Wild Hunt is too strong, and Tunnel Rats is too weak.** Before ADR-0020, Wild Hunt won 84% to 98% against Vanguard, Raiders and Tunnel Rats, and Tunnel Rats won 2% to 13% against Vanguard, Raiders and Wild Hunt. A test with Trample removed from all cards gave Wild Hunt 93.5% against Vanguard, and a test with no Feral Regeneration gave 95.0% (200 Battles each). Thus the Feral strength does not come mainly from Trample or Regeneration.

The cause is not the Race. It is the Power Budget (tests on 2026-10-07, 200 seeds each). A Goblin Deck of Countdown 3 to 6 cards won 99.5% against Wild Hunt. A Human Deck of Countdown 3 to 6 cards won 100% against a Human Deck of Countdown 1 to 3 cards. Wild Hunt has the highest average Countdown (3.4) and Tunnel Rats the lowest (2.3). There are two causes:

1. The Power Points used the Common Attack and HP, but a copy plays at its Base Rank: Rare ×1.45 and Epic ×1.75. The heavy Decks have the Rare and Epic cards. [ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md) fixes this (3.1).
2. Each Countdown point gets 5 Power Points. All cards in the Hand count down at the same time, and a Hero draws 1 card each Turn, so a long Countdown is mostly a delay. With the Rank fix, a slope of about 1 Power Point for each Countdown point brought the heavy and light Decks near 50%. These tests used a rough stat fit.

**After ADR-0020, the Rank fix alone does not fix it.** The table above has these results. Each one is outside its target:

| Matchup | Win rate | Target |
| --- | --- | --- |
| Human Heavy against Human Light | 100.0% | 40% to 60% |
| Wild Hunt against Vanguard | 93.1% | 35% to 65% |
| Wild Hunt against Raiders | 83.5% | 35% to 65% |
| Tunnel Rats against Vanguard | 3.8% | 35% to 65% |
| Tunnel Rats against Raiders | 2.6% | 35% to 65% |

Wild Hunt and Tunnel Rats are almost the same as before the change. Before it, Wild Hunt won 93.8% against Vanguard and 85.0% against Raiders (200 seeds). Human Heavy wins 94.6% to 100% against each Deck except Wild Hunt (86.6%). Human Light wins 49.3% against Tunnel Rats and 19.9% or less against each other Deck. Thus the Countdown slope is the remaining cause. The slope search starts from these results. Do not change only the Feral and Goblin values.

**Knockback 2 and 3.** This was measured before ADR-0020. The Matchup uses the Common Shieldbearer (Knockback 1). The same Vanguard Deck with that one copy at Epic (Knockback 2) wins 54.3% against Raiders. At Legendary (Knockback 3) it wins 58.0%. 58% is above the 55% band. Knockback 2 and 3 can lock a melee Unit whose Speed is lower than N: the Unit never reaches the Shieldbearer to attack it. Only Combine makes these copies. The power points use the Base Rank value, so the budget check does not see this lock.

**Bleed (ADR-0019).** Bleed changes no Wild Hunt win rate by more than 0.2 percentage points. This was measured on 2026-10-07 with `bun run sim matchup 1000`, against the same rules with no Bleed. Wild Hunt has 1 Frostfang Lynx (Bleed 1), and no Archetype has Old Frostmaw. The other Archetypes heal little: only Vanguard has a heal, 1 Dawn Cleric (Regeneration 1). Wild Hunt has 4 Regeneration copies, so Bleed matters most in the Wild Hunt mirror. Thus Bleed does not make Wild Hunt stronger. Test Bleed again when an Elf Archetype with healers exists. The other results on that branch changed for other reasons, so the table did not change at that time.

**Vanguard Full is weak, and Raiders Full is strong (for review).** Vanguard Full wins 14.9% against Vanguard, 7.2% against Raiders and 6.5% against Raiders Full. Raiders Full wins 74.5% against Vanguard and 63.0% against Raiders. Each new card is in its ±10% budget, and the values are the card concepts values. The AI ignores Rally when it selects a play. Thus these results are evidence for review, not a balance approval. Possible causes, not tested: Vanguard Full has 2 Walls with Attack 0 in place of attacking Units, and Raiders Full has more Charge and Fire. Review the Human and Orc values in a separate issue.

### 3.1 Balance changes

| Date | Change | Reason |
| --- | --- | --- |
| 2026-10-05 | Scrap Raider HP 3 → 4. Ember Shaman Attack 3 → 4 and HP 5 → 6. Skyreaver HP 4 → 5. Howling Charger HP 5 → 6. Iron Bulwark HP 17 → 15. | Vanguard won 66.8% against Raiders. Most Orc cards were below their power budget, and Iron Bulwark was 8% above it. After the change, all 5 cards are within ±10% of their budget, and Vanguard wins 50.5%. |
| 2026-10-07 | Old Frostmaw HP 14 → 13, and it gets Bleed 2. Frostfang Lynx gets Bleed 1 with no other change. | Bleed N costs N × 1 power points ([ADR-0019](../adr/0019-bleed-is-a-feral-keyword-on-two-cards.md)). With Bleed 2 and HP 14, Old Frostmaw was 11.1% above its budget. With HP 13 it is 8.3% above. The Frostfang Lynx is 6.3% above its budget. |
| 2026-10-07 | The Power Points measure Attack and HP at the Base Rank ([ADR-0020](../adr/0020-the-power-budget-measures-a-card-at-its-base-rank.md)). The Common Attack and HP of the 40 Uncommon, Rare and Epic Creature Cards go down, so that each card is within ±10% of its Power Budget again. The new values are in `cards.ts` and [10 — Card Concepts](./10-card-concepts.md). Countdown, Speed, Range, Damage Type and Keywords do not change. A Wall changes only its HP. Each card fits, so no card needs a written reason. | A Rare copy played ×1.45 and an Epic copy ×1.75 above its budget. Most fits keep the old power of the card. Each fit keeps the Attack-to-HP shape as near as the whole numbers let it. Pack Stalker, Sidestep Shiv and Warhowler Drummer have no fit with a nearer shape. Three fits are for the Matchup and the Stages. River Knight is 5/7 (+3.8%): the first fit had River Knight 4/7 and Skyreaver 2/5, and Vanguard won only 36.5% against Raiders and 39% of Stage 1-4 (200 seeds). Skyreaver is 3/4 (+9.5%): with 2/5, Raiders won only 54% of Stages 1-5 and 1-6. Warchief Grukka is 4/7 (+2.8%): with 4/8, Vanguard won 44.5% against Raiders. Now Vanguard wins 48.4%. Some Stage enemy Decks changed too ([14 — Campaign Stages](./14-campaign-stages.md)). |

## 4. When an Archetype or a card changes

1. Change the data in `archetypes.ts`, `decks.ts` or `cards.ts`.
2. Run `bun run sim matchup 1000` in `packages/rules`. Use `--level N` and `--gear N` to check other levels. CI runs `bun run rules:sim:check`, and it fails when a Matchup is not on its target.
3. Update the tables in sections 2 and 3.
4. A new Archetype does not have to be a Starter Deck. Give it a name, a Class and a style, and add it to section 2.
