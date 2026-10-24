# Lightning damage gives Paralyzed

The Skill Card set grows to 10 cards for each Class, and the Mage needs new cards that are not more Fire or Frost damage. We added a fifth Damage Type, **Lightning**. Lightning damage makes its target **Paralyzed**: the Unit does not attack in its next action, but it can still move. Lightning is not locked to one Race or one Class. A Creature Card of any Race, a Token, a Keyword and a Skill Card of any Class can have it, the same as Fire, Frost and Holy. The first Lightning cards are the Mage Skill Cards of #65.

We did this because the three control Statuses then each stop a different part of an action: Freeze stops the full action, Entangled stops the Movement, and Paralyzed stops the attack. A Damage Type is a game rule, so it is open to all cards. Which cards get it is a content decision for each card.

## Considered Options

- **Paralyzed: the Unit cannot move.** Rejected. That is Entangled.
- **Lightning jumps to the nearest other enemy Unit, with no Status.** Rejected. It fits the Mage job (area damage) and has no lock risk, but a Paralysis effect gives a control tool that Fire and Frost do not give.
- **Only Mage Skill Cards have Lightning in v1.** Rejected on 2026-10-10. It kept the Power Budget, the creature art and the Ranged rules unchanged, but it locked a Damage Type to one Class. No other Damage Type has such a lock.

## Consequences

- The Power Budget needs a Lightning point value in GDD 5.2 (now Fire = 3, Frost = 3, Holy = 2). #65 sets a provisional value: Lightning = 3, the same as Frost ([GDD 13](../game/03-game-design.md#13-balance-process)).
- A Ranged Unit with a Status on each hit can lock one enemy ([ADR-0024](./0024-no-ranged-unit-has-frost-damage.md)). A Paralyzed Unit can still move, but it does not attack and does not Retaliate. Thus a Ranged Creature Card with Lightning needs a lock check in the sim, the same as ADR-0024, before it goes into the content.
- Lightning needs a Damage Type color and an icon that fit all Races, and a row in the Damage Type table of the GDD.
