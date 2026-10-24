# No Achievement can be missed

An Achievement gives Heynstones one time, and Heynstones come only from one-time sources (ADR-0008). If the Player can lose the chance to complete an Achievement, the Player loses a part of the fixed Heynstone supply for ever, and that breaks Pillar 1 ("The player never loses progress because of luck"). We decided that the Player must always be able to complete each Achievement later, from any Profile. A Feat never needs a Battle that the Player cannot play again, and a goal never uses a value that only goes one way and can pass the goal ([15 — Achievements, 1.4](../game/15-achievements.md#14-no-achievement-can-be-missed)).

## Considered Options

- **Feats on a specific Heynspire Floor**, for example "Win Floor 30 with only Elf Units". Rejected: a won Floor cannot be played again (GDD 8.2), so a Player who wins the Floor first in a different way can never complete the Feat. A Feat that counts "in a Boss Stage or a Dungeon" gives the same kind of challenge, and the Player can play both again.
- **Goals on the Player level or the Gear**, for example "Win while you are below the Recommended level" or "Win with Gear at level 0". Rejected: the Player level and the Gear levels only go up, so a Player who passes the value can never complete the goal.
- **Missable Achievements that give no Heynstones.** Rejected: two kinds of Achievement make the rules and the screen harder, and v1 has no reward for a missable goal.

## Consequences

- Each new Achievement must pass this check before it goes into the list. A content review checks it. Code cannot check it.
- Heynspire has no Feats. Its Achievements are Profile goals on the won Floors.
- Earlier progress counts for Profile goals: the game checks them when the Profile loads. A Feat counts only Battles after the Feat exists. That is not a miss, because the Player can play the Battle again.
