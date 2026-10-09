# Each Race has one Race Keyword

A Main Keyword is the signature of a Race, but other Races can borrow it ([ADR-0015](0015-poison-is-elf-summon-is-undead-and-last-breath-is-orc.md)). Thus no Keyword tells a Player "only this Race does this". Now each Race has exactly one **Race Keyword**: Human Knockback, Elf Entangle, Undead Rebirth, Orc Heroic, Goblin Sabotage and Feral Trample. Only a Unit of that Race can have it, from a Card, a Token or any other effect. Each of these Keywords already exists and only its Race uses it, so this decision adds no battle rule.

The lock is on the Keyword, not on its effect. A Skill Card has a Class, not a Race, so a Skill Card of any Class can still make a Unit Entangled or Push it. The other Main Keywords stay open to other Races.

There is no minimum number of cards for a Race Keyword. On 2026-10-09: Sabotage 6, Trample 6, Heroic 6, Rebirth 3, Knockback 2 and Entangle 2, with Lethiel (see below).

Entangle is the Elf Race Keyword, although [ADR-0022](0022-no-range-above-3-and-entangle-only-on-epic-ranged-units.md) permits it only on Ranged Units with Base Rank Epic or higher. Each Race has 2 Epic cards ([ADR-0013](0013-v1-has-90-creature-cards.md)), so Entangle can be on 2 Elf cards at most. To get that maximum, Lethiel, First Gardener gets Entangle, and her Countdown goes from 4 to 5 (Power 27, budget 27). This replaces the sentence "Entangle is not an Elf Main Keyword" of ADR-0022. The ADR-0022 limit stays.

## Considered Options

- **New Keywords for each Race.** Rejected. Each new Keyword needs rules, tests and balance data ([ADR-0017](0017-sabotage-and-hobble-are-goblin-and-trample-is-feral.md)), and each Race already has a Keyword that only it uses.
- **Poison as the Elf Race Keyword.** Rejected, although Poison is on 4 Elf cards and has no Rank limit. Entangle shows the Elf forest better, and the ADR-0022 limit keeps it safe.
- **Swarm or Summon as the Undead Race Keyword.** Rejected. A Goblin or Feral pack can use Swarm, and Summon was an Elf Keyword before ADR-0015. A return from death is clearly Undead.
- **Last Breath as the Orc Race Keyword.** Rejected. Goblin has it on 4 cards and Orc on 3.
- **One or more Race Keywords for each Race.** Rejected. It locks Keywords such as Bleed and Swarm that future cards of other Races can use.
- **Lethiel back into her budget with HP 5 or Regenerate 1.** Rejected. Her concept is a durable healer. Both Elf Epics with Entangle now have Countdown 5.

## Consequences

- A content test checks that each Creature Card and each Token with a Race Keyword has that Race. When an effect first gives a Keyword in a Battle, its rule must check the same table.
- The Elf Race Keyword is on only 2 cards. If Elf does not feel like Entangle in playtests, change the ADR-0022 limit, not this ADR.
- The Entangle Skill Card is Pinning Shot, one of the Ranger Skill Cards of issue #38.
