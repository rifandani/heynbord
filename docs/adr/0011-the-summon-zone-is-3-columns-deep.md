# The Summon Zone is 3 Columns deep

A Hero summons a Unit into an empty Square of its Side's **Summon Zone**: Columns 1, 2 and 3 of each open Lane. Before, the Hero summoned only into Column 1 (the Summon Column). The rule is the same for both Sides and for all Heroes, also AI Heroes and Bosses. Content data cannot change it. A Hero can summon **past an enemy Unit** that is in the zone.

We did this because a Unit in Column 1 blocked the Lane. Then the Player had no place to put Ready Cards. Also, there were few placement choices, and Units needed too many Turns to reach the enemy. Summoning past an enemy Unit opens new strategy. To support it, the v1 Keywords include **Pivot**: a melee Unit with Pivot can attack an enemy Unit behind it or next to it.

## Considered Options

- **Keep Column 1 only.** Rejected. The Lane gets blocked, and placement is not a real choice.
- **A Hero can summon only into Squares nearer its Hero than the nearest enemy Unit.** Rejected. It is safer, but a Unit can then never go behind the enemy. Pivot gives an answer to the Units that go past.
- **Each Stage or Boss sets the depth of its zone.** Rejected for the same reason as [ADR-0010](./0010-the-type-of-battle-sets-the-number-of-lanes.md): one Board shape, and content cannot break the rule.

## Consequences

- A melee Unit attacks only forward. So a Unit summoned past an enemy Unit does not fight it, unless one of them has Pivot. Ranged Units also attack only forward.
- A Unit summoned into Column 3 still acts in the same Turn, so it gets a 2-Square start. **Charge** has less relative value, and the balance process must check its Keyword points.
- A Creature Card targets a Square, not a Lane. The AI and Auto-play select a Column too.
- The 3D Board gives the side color to all 3 Columns of each Summon Zone.
