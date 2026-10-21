# Each Specialist has a second Keyword, and more Power Points than the Epic cards of its Race

[ADR-0050](0050-a-base-rank-legendary-creature-card-is-a-specialist.md) gave each Race 1 **Specialist**: a Base Rank Legendary Creature Card with Unique, one Class and 1 new Keyword. The 6 Specialists were weak in the Battle: each one had 1 Keyword and 2 or 3 stats, and the Specialist Decks of [08 — Archetypes](../game/08-archetypes.md) 2.4 had 1 to 3 Matchups outside the 45% to 55% band. Now each Specialist has 2 more Keywords, and each Specialist has more Power Points than the 2 Epic cards of its Race.

## The new Keywords

Each new Keyword is a Main Keyword of its Race, not a Race Keyword ([ADR-0026](0026-each-race-has-one-race-keyword.md)). The full rules are in GDD 5.4 and in the CONTEXT file of the rules package.

- **Wallbreaker** (Human): the damage that the Unit deals to a Unit with Wall is doubled. The doubling comes before Bulwark, Exposed, Crit, Block and Ward. A Wall is a small part of the Card pool, so the Keyword is strong in a few Matchups only.
- **Resistance N** (Orc): reduces Fire, Frost, Holy and Lightning damage to the Unit by N. It is the twin of Bulwark N, which reduces only Physical damage.
- **Quick Study** (Goblin): when an enemy Hero plays a Skill Card, the card with the highest Countdown in the Hand of the Hero of the Unit goes down by 1. It gives the Deck of the Unit tempo against a Deck that plays many Skill Cards.
- **Piercing** (Feral): the damage that the Unit deals cannot be reduced. It ignores Bulwark, Resistance, Ward, Block and the Iron Guard cap. It keeps its Crit and its Exposed bonus, so it is not True Damage.
- **Heal N** (Elf): in each Start Phase of its owner, the friendly Unit with the lowest HP that is not at its maximum HP heals N HP. A Bleeding Unit gets half of the heal, rounded down.
- **Dispel** (Undead): in each Start Phase of its owner, the Unit has a 20% chance to remove 1 Debuff from a random friendly Unit. The Battle seed sets the chance and the Unit.

## The Specialists

Each Specialist also gets 1 more Keyword of the set of ADR-0050: Ser Aldric Stonewall gets Rally 2, Ashcaller Grosh and Grix Ratwhistle get Mid-range, Gorehorn Red Maw gets Bleed 2 and Pale Cantor Ysolde gets Rebirth. The stats go down, because the Power Points of a card stay within 10% of its Power Budget.

| Card | Race | Class | Countdown | Attack / HP | Damage Type | Keywords | Power | Budget |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ser Aldric Stonewall | Human | Warrior | 6 | 2 / 4 | Physical | Unique, Iron Guard, Rally 2, Wallbreaker | 30 | 28 (+7.1%) |
| Ashcaller Grosh | Orc | Mage | 6 | 2 / 4 | Fire | Unique, Bolt 2, Mid-range, Resistance 2 | 30 | 28 (+7.1%) |
| Grix Ratwhistle | Goblin | Ranger | 6 | 3 / 4 | Physical | Unique, Hero's Bane, Mid-range, Quick Study | 28 | 28 (0%) |
| Gorehorn Red Maw | Feral | Priest | 6 | 2 / 5 | Physical | Unique, Vampirism, Bleed 2, Piercing | 30 | 28 (+7.1%) |
| Warden Saelith | Elf | Ranger | 5 | 2 / 4 | Physical | Unique, Long-range, Spawnbane 2, Heal 2 | 26 | 25 (+4%) |
| Pale Cantor Ysolde | Undead | Priest | 6 | 2 / 4 | Physical | Unique, Soul Harvest, Rebirth, Dispel | 29 | 28 (+3.6%) |

The Power Points of a card count at its Base Rank ([ADR-0020](0020-the-power-budget-measures-a-card-at-its-base-rank.md)), so a Specialist at Legendary is compared with an Epic card at Epic. A Specialist has more Power Points than the 2 Epic cards of its Race:

| Race | Strongest Epic card | Power at Epic | Specialist | Power |
| --- | --- | --- | --- | --- |
| Human | Iron Bulwark | 27 | Ser Aldric Stonewall | 30 |
| Orc | Warchief Grukka | 29 | Ashcaller Grosh | 30 |
| Goblin | Boss Snikkit | 25 | Grix Ratwhistle | 28 |
| Feral | Old Frostmaw | 29 | Gorehorn Red Maw | 30 |
| Elf | Canopy Vinewarden | 23 | Warden Saelith | 26 |
| Undead | Sir Odo Last Taxman | 22 | Pale Cantor Ysolde | 29 |

Ashcaller Grosh and Pale Cantor Ysolde get Countdown 6, because their Specialist Deck needs the Countdown of the Epic card of their Race to be inside the Deck rules. The 6 Specialist Decks have a Countdown sum of 30 to 35.

## Considered Options

- **A Specialist is more powerful than an Epic card at Legendary Rank.** Rejected. The Power Points of a card count at its Base Rank ([ADR-0020](0020-the-power-budget-measures-a-card-at-its-base-rank.md)), so an Epic card at Legendary is not a card that the Player can compare with a Specialist: it is a copy of an Epic card. The comparison of cards is at their Base Rank.
- **A Specialist has 3 Keywords, and the Power Budget of a Specialist is 20% higher.** Rejected. The Power Budget of a Countdown is the same for every card of that Countdown (GDD 13). A higher budget for the 6 Specialists would make them stronger than every other card of their Countdown, and the budget would lose its meaning.
- **Resistance N reduces the damage of the Damage Types that the Player calls magic.** Rejected. Heynbord has no magic damage: only Physical, Fire, Frost, Holy and Lightning. The Keyword names the 4 Damage Types that Bulwark does not reduce.
- **Piercing is True Damage.** Rejected. True Damage has no Crit and no Exposed bonus. Piercing keeps them, so a Piercing Unit still rolls Crit and still hurts a Unit with Exposed.
- **Wallbreaker doubles the damage after Bulwark, Crit and Block.** Rejected. Then a Wall with high Bulwark would take the same damage as any other Unit. The doubling comes first, so the other rules apply to the doubled damage.
- **Dispel removes a random Debuff of a random friendly Unit.** Rejected. The chance is 20% and the Unit is at random, so the Debuff that ends is also at random.
- **Quick Study lowers the Countdown of the card with the highest Countdown in the Hand of the enemy Hero.** Rejected. The Keyword must help the Unit and its owner, so it uses the Hand of the Hero of the Unit.

## The Keyword points

The Keyword points are provisional, like the other points of GDD 13: Wallbreaker = 2, Resistance N = N × 2, Quick Study = 3, Piercing = 3, Heal N = N × 2 and Dispel = 3. The values come from the simulation of the 6 Specialist Decks: with more points, each Specialist loses stats, and the Matchups move out of the band. The simulation wins over the content test.

## Consequences

- The Handbook has 40 Keywords, up from 34.
- The AI knows the 6 new Keywords: it gives them a value in the score of a Creature Card, and it counts the Resistance of a Unit like its Bulwark.
- Gorehorn Red Maw has a fixed Bleed 2. The Bleed of the Frostfang Lynx and Old Frostmaw still follows the Rank table: 1 up to Rare, 2 at Epic and 3 at Legendary. A content test checks both.
- The Battle Log shows the Keyword Plate of each new Keyword, and a new line for the Debuff that Dispel ends.
- The 6 Specialist Decks of [08 — Archetypes](../game/08-archetypes.md) 2.4 change. The Decks are `diagnostic`, so a Matchup outside the 45% to 55% band is a result for review, and it does not gate release.
- The 15 Matchups between the Main Archetypes do not move: no Main Archetype holds a Specialist.
- The deferred Keyword ideas of ADR-0050 stay deferred. The list of the Player has other ideas, for example Sunder (double damage to a Unit with Bulwark) and Devour N.

## Glossary conflicts

- The list of the Player used "magic damage" for Resistance. Heynbord has no magic damage, so the Keyword names the 4 Damage Types that Bulwark does not reduce.
- The list of the Player used "Heal N" for a heal of the lowest HP friendly Unit. Heal N is not Regenerate N: Regenerate heals its own Unit, and Heal N heals another Unit.
- The list of the Player used "Piercing" for damage that cannot be reduced. That is the rule of this ADR.
