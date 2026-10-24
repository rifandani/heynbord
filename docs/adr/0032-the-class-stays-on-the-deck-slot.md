# The Class stays on the Deck Slot

GDD 5.5 says that the Player can change the Hero **Class** at any time outside a Battle, at no cost. The first Profile put the Class on each **Deck Slot**, with a note to move it to the Hero when the Hero screen came. We decided to keep the Class on the Deck Slot. The Player's Hero has the Class of the **Active Deck**, and the Player changes the Class when the Player selects a Deck of another Class. The Hero screen shows the Class, and it does not set it.

We did this because a Deck holds Skill Cards of one Class only. With the Class on the Hero, each change of Class makes each Deck of the old Class invalid. A Player with a Warrior Deck and a Mage Deck then must change two things to change Decks, and gets invalid Decks often. With the Class on the Deck Slot, "change the Class at no cost" is true with no extra rule, and no Class change makes a Deck invalid.

## Considered Options

- **The Class moves to the Hero (one field on the Profile).** Rejected, for the reasons above. It also needs a Profile migration.
- **The Class moves to the Hero, and a change of Deck also changes the Class.** Rejected. The Class on the Hero then only copies the Class of the Active Deck, and two places keep the same fact.

## Consequences

- The Profile keeps `classId` on each Deck Slot. There is no Hero Class field and no migration.
- The Deck builder is the only place that sets the Class of a Deck. A Deck that has Skill Cards of another Class is not valid until the Player removes them. This occurs only when the Player changes the Class of a Deck in the Deck builder.
- The Deck dialog is the only place that selects the Active Deck. The Hero screen opens it to change the Class.
- 2v2 and 4v4 modes give each Hero the Class of its own Deck. This rule does not block them.
