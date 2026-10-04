# A Routed Side loses

A **Side** is **Routed** when it has no Units on the Board and no Cards in the Hands and Decks of its Heroes that are not Defeated. A Routed Side loses at once, also when its Heroes still have HP. The rule is the same for the Player's Side and the enemy Side. The check occurs after the current action is fully complete, also its death effects (Last Breath, Rebirth, Tokens) and the Recall roll.

We did this because Stage enemy Decks are small. When the enemy has no Units and no Cards, it cannot act again, but the Player must wait many Turns while Units walk the Lanes. Those Turns have no decisions in them.

## Considered Options

- **No Units and no Cards in the Hand, and the Deck does not matter.** Rejected. The enemy draws 1 card in each Start Step, so it can still act. The rule then ends Battles early when the enemy has played its last Hand card and has no Units.
- **Only the enemy Side can be Routed.** Rejected. One rule for each Side is easier to learn, and it works for PvP and 2v2. A Player with no Units and no Cards can only wait for Sudden Death.
- **Compare Hero HP when both Sides become Routed by the same action.** Rejected. It adds a new rule for a rare case. The defender wins, the same as at the Turn limit.

## Consequences

- The Battle result has a third reason, `routed`, next to `heroDefeated` and `turnLimit`. A Routed win gives the same Stars, rewards and XP as a `heroDefeated` win. The Stars use the Hero HP and the Turn number at that time.
- A card in the Hand counts, also when its Countdown is above 0 or it has no legal target now.
- The cards of a Defeated Hero do not count, because it plays no more cards.
- Field Effects do not count.
- A Hero with a rule that can still put a Unit on the Board stops its Side from being Routed. Boss content must keep this in mind.
- If both Sides become Routed by the same action, the defender wins. In PvE, the defender is the enemy.
