# A Base Rank Legendary Creature Card is a Specialist for one Class

> Each Specialist has 2 more Keywords and lower stats since 2026-10-21 — see [ADR-0056](0056-each-specialist-has-a-second-keyword.md) and [Amendments](#amendments).

Before, no v1 Creature Card had Base Rank Legendary. [ADR-0013](0013-v1-has-90-creature-cards.md) set 15 Creature Cards for each Race, and GDD 12 said that a later Card could have this Base Rank. Now each Race has one Base Rank Legendary Creature Card, the **Specialist**. It has one Class, and a Hero can put it in a Deck only when the Hero has that Class. Every Specialist has Unique. A Creature Card with Base Rank Legendary is always a Specialist, and only a Specialist has a Class.

The v1 set grows from 90 to 96 Creature Cards, and from 130 to 136 Cards. The 6 Specialists are:

| Card | Race | Class | Countdown | Attack / HP | Damage Type | Keywords |
| --- | --- | --- | --- | --- | --- | --- |
| Ser Aldric Stonewall | Human | Warrior | 6 | 3 / 5 | Physical | Unique, Iron Guard |
| Ashcaller Grosh | Orc | Mage | 5 | 2 / 4 | Fire | Unique, Bolt 2 |
| Grix Ratwhistle | Goblin | Ranger | 6 | 4 / 4 | Physical | Unique, Hero's Bane |
| Gorehorn Red Maw | Feral | Warrior | 6 | 2 / 6 | Physical | Unique, Vampirism |
| Warden Saelith | Elf | Ranger | 5 | 2 / 5 | Physical | Unique, Long-range, Spawnbane 2 |
| Pale Cantor Ysolde | Undead | Priest | 5 | 3 / 4 | Physical | Unique, Soul Harvest |

5 Class choices come from the Main Archetypes ([08 — Archetypes](../game/08-archetypes.md)): Vanguard Warrior, Raiders Mage, Deathless Host Priest, Tunnel Rats Ranger and Thornwatch Ranger. Gorehorn Red Maw is a Warrior Specialist with the Wild Hunt creature style (Amendments). Each Class has at least one Specialist, and no Race has two. Warrior and Ranger have two; Mage and Priest have one.

## Considered Options

- **A Specialist is a Keyword.** Rejected. The Class is a property of the Card, not a rule that occurs in a Battle. A Keyword has a rule and can occur in the Battle Log. The Card Details show "Specialist · Warrior" next to the Race.
- **A Deck can hold a Specialist of another Class if the Deck has a card of that Class.** Rejected. The Class lock must be clear before the Player builds the Deck, and the Deck builder must give one reason: "Warrior only".
- **The Specialist is Legendary but has no Unique.** Rejected. A Specialist is a named figure, and the Board must hold one copy of it. Unique also keeps the Board clear for the second copy of a deck slot.
- **A Specialist can be in a Starter Deck, a Stage enemy Deck, a Dungeon, a Floor or a Main Archetype.** Rejected for v1. A Specialist is in its own Specialist Deck only (Consequences). The Player must find the Specialist in a Royal Pack ([ADR-0052](0052-craft-gives-no-epic-or-legendary-card.md) gives it no Craft). A Stage that puts a Specialist on the Board would show a Card that the Player may not own.
- **A Legendary Base Rank card combines, and has a higher Rank.** Rejected. Base Rank Legendary is the top Rank. The card has no Combine path and no higher copy. This is why it is at its Power Budget exactly, and why the UI hides Combine for it.
- **Each Specialist has its own new Keyword, and no other Keyword.** Rejected. The set uses 6 of the Player's 29 Keyword ideas, and 2 of them (Warband N and Blood Price N) are ready for a later card. The other ideas need engine hooks that v1 does not have.

## The new Keywords

Each Keyword below is a Main Keyword of its Race, not a Race Keyword ([ADR-0026](0026-each-race-has-one-race-keyword.md)). The full rules are in GDD 5.4 and in the CONTEXT file of the rules package.

- **Bolt N**: in each Start Phase of its owner, N damage of the Unit's own Damage Type to one random enemy Unit, or to the enemy Hero of its Front. It applies no Status and has no Crit. A Ward absorbs it.
- **Iron Guard**: each Physical hit on the Unit deals at most 4 damage. The cap applies after Bulwark, Crit, Block and Exposed, and before Ward. True Damage and status damage do not change.
- **Soul Harvest**: when an enemy Unit dies, the Unit gets +1 Attack and +1 HP, also above its maximum HP. A kill by any source counts. Rebirth is not a kill, and Rebirth ends the bonus.
- **Hero's Bane**: in each Start Phase of its owner, 1 Physical damage to the enemy Hero of its Front. It is not an attack and has no Crit.
- **Spawnbane N**: when an enemy Hero summons a Unit from a Creature Card, N damage to that Unit. It comes before the new Unit's Sabotage and Summon. A Token does not trigger it.
- **Vampirism**: when the Unit deals Physical damage, it heals the HP that the hit dealt after Block and Ward, up to its maximum HP. It counts for attacks, Retaliate, First Strike, Trample and Last Breath.

The Power Points of the new Keywords are: Bolt N = N × 3, Iron Guard = 6, Soul Harvest = 5, Hero's Bane = 4, Spawnbane N = N × 2 and Vampirism = 6. The Class lock costs 0 points, the same as Unique. All 6 cards are within 10% of their Power Budget at their Base Rank.

## Consequences

- A Specialist is in the Royal Pack only. Pack rule 2 selects a Card with Base Rank at or below the rolled Rank, so only a Legendary roll can give it. Pack rule 3 (New Card First) makes it Discovered on the first eligible roll.
- A Specialist cannot be Crafted: it comes from a Royal Pack only ([ADR-0052](0052-craft-gives-no-epic-or-legendary-card.md)). It has no Combine, and it is not in a Starter Deck, a Stage, a Dungeon, a Floor or a Main Archetype. It is in its own Specialist Deck only.
- `MAX_COPIES` stays 3. Unique already limits the Board, and a Deck with 2 or 3 copies of a Specialist has no extra rule.
- The Deck builder greys a Specialist of another Class, with the reason "that Class only". A Deck with one is invalid, the same as a Skill Card of another Class.
- The Handbook has 34 Keywords, up from 28.
- The "full Collection" Achievement needs 136 Cards, and "half" needs 68. `collection.half` was 65.
- The 6 Specialists have no card art in v1. They show their Race emblem until the art is in `public/`.
- A Specialist Deck tests each Specialist: one `diagnostic` Archetype for each of the 6 Specialists, in the style of its Race ([08 — Archetypes](../game/08-archetypes.md), [issue #110](https://github.com/rifandani/heynbord/issues/110)). A Specialist Deck never becomes a Main Archetype.

## Deferred Keyword ideas

These ideas from the Player's list are ready for a later card, but no v1 card uses them:

- **Warband N**: a friendly Unit that comes onto the Board next to the Unit gets +N Attack until the end of the Turn.
- **Blood Price N**: the Unit pays N HP when it acts, and gets a bonus.

These ideas need an engine hook that v1 does not have, so they wait: hand and Graveyard movement, Board shape, a new Status and new targeting. They are Soulbound, Frighten, Undead King, Whirlwind, Backstab, Double Strike, Dishearten, Unravel, Elusive, Shrouded, Spell Guard and Spell Vampirism.

## Glossary conflicts

- The Player's list used "Bloodlust" for a Goblins Keyword. Heroic already lists "Bloodlust" as a word to avoid ([ADR-0048](0048-heroic-gives-attack-after-each-attack-on-a-unit.md)). The idea is deferred, and it needs a different name.
- The list used "magic damage". Heynbord has no magic damage: only Physical, Fire, Frost, Holy and Lightning. A Keyword that says "magic damage" must name one of these.
- The list put "Primal Instinct" on Goblins. It belongs to the Feral host, not to the Goblins.
- The list used "Frostbolt". The Skill Card *Frost Bolt* already has this name, so a Keyword with that name would confuse the two. Bolt N replaces the 4 bolt ideas.

## Amendments

- **2026-10-21: each Specialist has 2 more Keywords and lower stats.** [ADR-0056](0056-each-specialist-has-a-second-keyword.md) gives each Specialist 1 more Keyword of the set of this ADR and 1 new Keyword, and its stats go down, because the Power Points stay within 10% of the Power Budget. The table of the 6 Specialists above is the state of that day. The Handbook has 40 Keywords now, and each Specialist has more Power Points than the 2 Epic cards of its Race.
- **2026-10-21: Gorehorn Red Maw is a Warrior Specialist.** The first Class choice came from Wild Hunt. Gorehorn keeps the Wild Hunt creature style and uses Warrior Skill Cards, because Feral has no Warrior Main Archetype. See [08 — Archetypes](../game/08-archetypes.md#24-specialist-decks) for its Deck and Matchup results.
