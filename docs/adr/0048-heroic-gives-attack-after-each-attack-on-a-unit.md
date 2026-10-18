# Heroic gives Attack after each attack on a Unit

Before, **Heroic N** gave +N damage when its Unit attacked a Hero. Now, after a Unit with Heroic attacks an enemy Unit, it gets +N Attack, the **Heroic bonus**. Each attack on an enemy Unit adds more, with no limit. The bonus stays until the Unit leaves the Board, and Rebirth ends it. The Rank sets N: 1 at Common and Uncommon, 2 at Rare, 3 at Epic and 4 at Legendary. A card does not set its own N. Heroic stays the Orc Race Keyword ([ADR-0026](0026-each-race-has-one-race-keyword.md)).

The name stays "Heroic", although the Keyword no longer has a connection to Heroes. Orcs become strong in the fight, and the fight makes heroes of them.

An attack also counts when it deals 0 damage, for example because of Bulwark or Ward. An attack on a Hero, Retaliate, First Strike, Trample and Last Breath do not count. The Heroic bonus is part of the full Attack, so it also applies to attacks on Heroes and to Retaliate.

## Considered Options

- **Each card sets N, and the Base Rank sets the maximum N.** Rejected. N that goes up with the Rank gives the Player a reason to Combine an Orc card, the same as Charge and Bleed.
- **A limit on the Heroic bonus.** Rejected. Orcs have low HP, so a Unit with Heroic usually does few attacks. Matchups (GDD 13) will show if a limit is necessary.
- **The bonus ends at the end of the Turn, or only the first attack gives it.** Rejected. A Unit attacks one time in each Turn, so the bonus would have almost no effect.
- **Heroic N costs N × 3 Power Points.** Rejected after the sim. To stay in their Power Budget, 5 Heroic cards lost Attack or HP, and Raiders won only 40% to 45% of its Matchups. N × 2 keeps the old stats of all Heroic cards, except Tusk Brute.

## Consequences

- The Orc battle identity is no longer "Rush the enemy Hero". Orcs grow stronger with each fight.
- Heroic N costs N × 2 Power Points, the same as before. Tusk Brute (Common) had Heroic 2, and now it has Heroic 1 at Common. Its HP goes from 7 to 8, so that it stays within 10% of its Power Budget.
- Heroic is stronger against the AI than its Base Rank Power Points show, because the bonus grows with the Rank and with each fight. Thus the enemy Decks of Stage 1-7, the Region 2 Stages and the Floor templates 2 and 8 have fewer Heroic cards or lower Ranks ([14 — Campaign Stages](../game/14-campaign-stages.md)).
- A Raiders Deck with Expected Gear is now 1 to 5 points stronger in the late Stages, the Dungeons and the Floors. Issue [#109](https://github.com/rifandani/heynbord/issues/109) made the AI count the Heroic bonus in the value of a Unit and in the threat and the defense of a Lane (GDD 9), and it retuned the enemy side. All Stage and Dungeon rows and all Floor rows except one row of Floor 10 are on their target. Raiders against Wild Hunt and against Thornwatch are above the Matchup target, and the fix for them is on the player side ([08 — Archetypes, 3.1](../game/08-archetypes.md#31-balance-changes)).
