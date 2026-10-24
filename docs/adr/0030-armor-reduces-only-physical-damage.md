# Armor reduces only Physical damage, and Holy cannot be Blocked

**Armor N** reduced all damage except Holy before. Now it reduces only Physical damage, also bonus Armor from a Skill Card. Fire, Frost, Lightning and Holy damage all go through Armor. Thus Armor is a counter to Physical damage only, and a later Keyword, Resistance N, can be the counter to the other Damage Types.

> Changed on 2026-10-14: the Keyword **Armor N** has the new name **Bulwark N**. The rule of this ADR does not change. "Armor" is now only the name of a Gear slot. The text below keeps the old name.

This took away the only special rule of **Holy**. Its new rule: the Hero of the target cannot **Block** Holy damage. A Ward still absorbs it. Block comes only from the Banner Gear (0% to 10%), so this rule is small. Holy costs 1 Power Point, not 2. Fire, Frost and Lightning stay at 3 points, and Armor N stays at N × 3, until the simulation shows that they must change.

## Considered Options

- **Change only the card text, and keep the rule.** Rejected. The text then says something different from the rule.
- **Holy goes through Ward and Block.** Rejected. A stronger rule, but the user wanted the smallest special rule for Holy.
- **Holy stops Rebirth, or deals double damage to Undead, or removes Buffs.** Rejected. Each one is useful only against one Race or against Priest decks.
- **Holy costs 0 or 2 points.** Rejected. 2 points is too much for a rule this small, and 0 points says that Holy is the same as Physical. It is not: Armor does not reduce it, and it cannot be Blocked.

## Consequences

- Fire, Frost and Lightning Units are stronger against Units with Armor than before, and Armor is weaker. The simulation must show if the win rates change too much. If they do, the next step is to change the points of Armor N or of the Damage Types. At 400 Battles, Vanguard against Raiders went from 58.5% to 55.8% (target 45% to 55%).
- With Holy at 1 point, two Holy cards went below −10% of their budget. Banner Chaplain went from 2/7 to 2/8, and Acorn Tender from 3/5 to 3/6.
- The card text "Armor does not reduce it." on Holy Skill Cards goes away, because it is true for all damage that is not Physical. The Holy rule shows in the Card Details, the same as the rules of the other Damage Types.
- Retaliate, First Strike, Trample and Last Breath damage use their Damage Type, so a Fire Retaliate now goes through the Armor of the attacker.
- When Resistance N comes, we must decide if it reduces Holy damage.
