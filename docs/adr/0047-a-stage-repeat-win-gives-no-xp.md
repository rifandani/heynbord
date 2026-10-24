# A Stage repeat win gives no XP

The economy sim with 3-Star replays and Sweeps (issue #107) showed that the median Player got to Player level 30 in Region 3, not after 1 to 2 weeks. A Player who replays for 3 Stars (ADR-0044) got about 4.5 times the XP of the First-try Path, and the Campaign Sweeps gave more than half of it. We decided that a Stage repeat win and a Campaign Sweep give **no XP**. They still give Coin, the Forge Stone roll and the card roll. A Stage first win, a loss (its Loss share), a Floor win, a Dungeon win and a Dungeon Sweep keep their XP. Thus XP is progress through new content, and replays give Coin, Forge Stones and cards.

A manual repeat win and a Campaign Sweep give the same reward, so this agrees with ADR-0039 ("a smaller reward for a Sweep" stays rejected). Dungeons keep their XP, because Dungeon wins are the loop from Player level 23 to 30 (Economy 1.2).

## Considered Options

- **1 Campaign Sweep Ticket for each win, not 2.** Rejected: in the sim (200 Players for each Play Style, 2026-10-17), the median Player level was 10, 20 and 26 at the end of Regions 1 to 3, and all Players got to level 30 before Floor 50.
- **Campaign Sweep Tickets only from first wins and Floor wins.** Rejected: the median Player level was 10, 19 and 24, and all Players got to level 30 before Floor 50.
- **An XP table that is about 4 times larger.** Rejected: it changes the First-try Path, the Recommended level of each Stage and the Deck-size steps.

## Consequences

- With this rule, the median Player level at the end of Regions 1 to 5 and at Floor 50 was 6, 11, 16, 21, 23 and 28 (First-try Path: 6, 10, 15, 20, 23, 28). About 5% of the Players got to level 30 before they won Floor 50.
- A real Player is still at or above the level of the First-try Path, because a loss gives XP and a repeat win takes none away.
- This rule does not change the Coin of the repeat wins and the Sweeps. In a separate tuning decision of issue #105, a Stage Repeat win and a Campaign Sweep give ⅓ of the Coin of a win (Economy 2.1). This is a tuning value, not part of this decision.
