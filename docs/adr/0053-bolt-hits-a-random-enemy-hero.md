# Bolt hits a random enemy Unit or Hero

**Bolt N** was made by [ADR-0048](0048-a-base-rank-legendary-creature-card-is-a-specialist.md). It deals N damage of the Damage Type of its Unit in each Start Phase of its owner, to one random enemy Unit, or to the enemy Hero of its Front. The Player wanted the shorter Card text "In each Start Phase, this Unit deals {value} damage of its Damage Type to a random enemy Unit or Hero." That text has no Hero of the Front, so the rule now changes: the Hero target is a random Hero of the other Side. A Hero that is Defeated is not a target (GDD 4.8).

The rest of the rule stays. The hit applies no Status, so Fire, Frost and Lightning damage do not Burn, Freeze or Paralyze, and it has no Crit. Hero's Bane keeps its Hero of the Front, because its text says so.

## Considered Options

- **Keep the Hero of the Front and keep the old Card text.** Rejected. The Player wants the short Card text, and a text that does not match the rule is worse than a longer text.
- **Hit a random enemy Hero.** Chosen. A Unit with Bolt now threatens every Hero of the other Side, and the Player does not have to build the Board around the Lane of the Unit.
- **Bolt hits a random enemy Unit only.** Rejected. Bolt then never touches a Hero, and the Specialist that has it (Ashcaller Grosh, Bolt 2) loses its punch against a Hero.
- **The Hero target stays in the Lane of the Unit, but the Card text drops it.** Rejected. The text "a random enemy Unit or Hero" reads as one random target from all enemy Units and all enemy Heroes. A text that hides the Lane rule does not tell the Player what happens.
- **The hit applies a Status.** Rejected. The no Status rule is what makes Bolt different from an attack, and it keeps Bolt from Freezing or Paralyzing a Unit that the Player wants to act.

## Consequences

- The engine picks one target at random from all enemy Units and all enemy Heroes of the other Side that are not Defeated. The roll uses the Battle seed, so a replay gives the same target (ADR-0006).
- A Unit with Bolt is stronger in a Dungeon, where the other Side has a Hero for each Boss: the hit can go to any Boss, and not only to the Boss of the Lane of the Unit. Only Ashcaller Grosh has Bolt in v1, and no starter Deck has it. The matchup sim and the Dungeon sim with 30 seeds give the same results before and after the change, because a Stage, a Floor and a matchup have 1 enemy Hero. A balance sim must check the Orc Specialist Deck in a Dungeon before the next release.
- The Card text and the Handbook Entry of Bolt no longer say that the hit applies no Status, and no longer name the Hero of the Front. The rule stays, and GDD 5.4 and the CONTEXT file of the rules package hold the full rule.
- The AI scores a Unit with Bolt at N × 2 in the value of a Card. That score was made for the old rule, and it is low for the new rule.
- ADR-0048 keeps its other decisions: Bolt N costs N × 3 Power Points, and Bolt is a Main Keyword of the Orc Race.
