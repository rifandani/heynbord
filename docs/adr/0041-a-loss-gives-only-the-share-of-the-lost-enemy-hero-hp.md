# A loss gives only the share of the lost enemy Hero HP

A loss gave 10% of the Coin and 25% of the XP of a win (Economy 2.1). A Player could end each Turn and skip, lose in a short time, and do this again and again. Many fast losses gave more XP in one hour than real wins, and Pillar 1 forbids Energy and daily caps, so no limit stopped it. We decided that a loss gives only its **Loss share**: the loss reward × the share of the total HP of the enemy Heroes that they lost in the Battle, rounded down. A Dungeon uses the HP of all its Bosses. A Player who only ends the Turns takes no HP, so they get nothing. A Player who loses a close Battle gets nearly the full loss reward, so the loss reward is still a catch-up for a real try.

## Considered Options

- **Remove the loss reward.** Rejected: a Player who is stuck on a hard Stage gets nothing from a real try.
- **A minimum Turn number for the loss reward.** Rejected: a Player can play slow, defensive cards until the minimum, with no real try.
- **A loss reward only before the first win of the Stage or Dungeon.** Not selected for now: it stops the farming of easy Stages, but not of a Stage that the Player did not win yet. It can be added on top of the Loss share later.
- **A cooldown or a daily count of loss rewards.** Rejected: Pillar 1 and Economy 1.1 forbid limits on Battles and daily caps.

## Consequences

- All damage to the enemy Heroes counts, also Burn, Poison and Sudden Death.
- The Dungeons screen and the Handbook say "up to" for the loss reward.
- The economy simulation plays no Battle, so it still gives the full loss reward. It is an upper limit for the loss income.
