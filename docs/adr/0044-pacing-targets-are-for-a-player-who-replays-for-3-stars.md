# Pacing targets are for a Player who replays for 3 Stars

The economy sim Player never played a won Stage again. Thus it never got 3 Stars, never opened a 30-Star chest and never used a Campaign Sweep, and the hour, Legendary and Gear targets of Economy 4 missed (issue #105). We decided that the Pacing targets of Economy 4 are for the median Player of a Play Style who plays each Stage of a Region again until the Stage has 3 Stars, and then goes to the next Region. The Player uses its Campaign Sweep Tickets and its Dungeon Sweep Tickets. A real Player who wants the Star chests and the Sweeps plays this way. The Player level targets still use the First-try run, because the Recommended level comes from the First-try Path.

## Considered Options

- **A Player who never replays.** Rejected: the 30-Star chest and the Campaign Sweep are then never part of the economy, and the targets must go down to fit a Player who is not realistic.
- **Two Players, with a target set for each.** Rejected: it doubles the targets for little gain.

## Consequences

- With the Star rule of GDD 4.11 on 2026-10-16, the AI pilot gets 3 Stars in 1.5% to 13% of the normal-Stage wins and in 0.6% or less of the Boss-Stage wins from Region 2. A Player cannot replay to 3 Stars at these rates. Thus the Star rule changes first, and GDD 13 gets a target for the share of 3-Star wins.
- The sim does not take the 3-Star chance from the AI pilot. It uses the middle of the GDD 13 3-Star target, as it uses the middle of the win-rate target for the win chance (Economy 7.1).
- "End of Region N" is the point when the Player leaves Region N, after its replays.
- A Sweep takes no Battle and no time in the sim.
