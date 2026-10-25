# Sabotage and Hobble are Goblin, and Trample is Feral

The two new Races of [ADR-0013](0013-v1-has-90-creature-cards.md) each get one new signature Keyword. **Sabotage** is the Goblin signature: it makes a Card in the enemy Hand later. Hobble moves from Human to Goblin as a Main Keyword, and Human keeps its one Hobble card as a borrowed Keyword, in the same way as [ADR-0015](0015-poison-is-elf-summon-is-undead-and-last-breath-is-orc.md). **Trample** is the Feral signature: a kill lets the damage that is left hit the next enemy Unit. We added only one new Keyword for each Race, because each new Keyword needs rules, tests and balance data.

Sabotage has the same N at each Rank, and N is at most 2. Knockback that grows with Rank already made a lock at Legendary (58% in the Matchup), and a Sabotage that grows can lock the enemy Hand. Trample is melee only, and it hits only the next Square, so that a Player can see it on the Board.

## Considered Options

- **A Goblin Blast Keyword that damages all Units next to it, also friendly Units.** Rejected. It doubles the rules work, and it is the first effect that damages friendly Units.
- **Goblin with only existing Keywords.** Rejected. The Goblin plan is then not different from Orc.
- **Feral Devour (+1 Attack and +1 HP for each kill).** Rejected. It snowballs, and it is difficult to balance.
