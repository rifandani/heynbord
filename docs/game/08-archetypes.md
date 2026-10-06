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

The 60-Creature-Card set adds two main Archetypes and two diagnostic Decks. Their exact 14-card lists stay provisional until the missing Keywords, Ranger Skill Cards and Priest Skill Cards work in the rules package.

| Deck | Kind | Class | Purpose |
| --- | --- | --- | --- |
| Vanguard | Main | Warrior | Human hold-line reference |
| Thornwatch | Main | Ranger | Elf range-control and Poison reference |
| Deathless Host | Main | Priest | Undead Swarm, Rebirth and Summon reference |
| Raiders | Main | Mage | Orc rush reference |
| Accord Line | Diagnostic | Warrior | Mixed Human and Elf control; tests Armor, Rally, Entangle and ranged Units |
| Breakneck Company | Diagnostic | Mage | Mixed Undead and Orc tempo; tests cheap Units, Swarm, Charge, Fire and Frost |

The four main Archetypes form the release-gated Matchup matrix. Accord Line and Breakneck Company run with the same seeds and report their results, but a diagnostic result outside 45% to 55% is evidence for review, not an automatic failure.

## 3. Matchup results

Player level 5 and no Gear on both Sides. 2000 Battles for each Matchup (1000 seeds, both ways). The win rate is for the Archetype in the row.

| Archetype | Opponent | Win rate | First-Side win rate | Average Turn |
| --- | --- | --- | --- | --- |
| Vanguard | Vanguard | 50.0% | 49.3% | 22.0 |
| Vanguard | Raiders | 50.6% | 51.0% | 19.7 |
| Raiders | Raiders | 50.0% | 51.4% | 19.1 |

The results come from `bun run sim matchup 1000` on 2026-10-06.

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
