# Each Stage has its own Star Turn

3 Stars needed a win with 50% or more of the Hero HP before Turn number 15 on all Stages (GDD 4.11). The Battles get longer from Region to Region: on 2026-10-16 the median win Turn of a normal Stage was 13, 17, 22, 25 and 28 in Regions 1 to 5, and the Boss Stage was 2 to 5 Turns later. Thus from Region 2 the AI pilot got 3 Stars in only 1.5% to 13% of the normal-Stage wins and in 0.6% or less of the Boss-Stage wins, and the Player of ADR-0044 could not replay to 3 Stars (issue #106). The HP condition was not the cause: about 88% of the wins had 50% or more HP in each Region. We decided that each Stage has its own **Star Turn** in its data, and that `sim stage` tunes it to a 3-Star target in GDD 13: 30% to 50% of the wins for normal Stages, and 20% to 40% for Boss Stages. Only a value for each Stage follows both the step between Regions and the differences between the Stages of one Region.

## Considered Options

- **One later Turn number for all Stages**, for example 22. Rejected: no single number puts all Regions on the target. At Turn 22, normal Stages were at 89% in Region 1 and 18% in Region 5.
- **A Turn number for each Region.** Rejected: the Stages of one Region are too different. At Turn 20, the Stages of Region 3 were at 10.8% to 38.4%.
- **Only a higher HP condition, with no Turn condition.** Rejected: at 75% HP, normal Stages were at 70% to 83% in all Regions, and the Region 1 wins mostly keep 100% HP, so HP does not separate them.
- **Shorter Battles in the late Regions, with the Turn 15 rule unchanged.** Rejected for now: it removes the cause, but it re-tunes the enemy strength and the win rates of all 40 Stages from Region 2.

## Consequences

- The 3-Star target uses the AI pilot and the setup of the win-rate target: the Recommended level, with no Gear and with the Expected Gear (ADR-0033). One Star Turn must hit the target on both rows. A human can win faster, so the pilot gives a lower limit.
- The ramp Stages 1-1 to 1-3 have only a lower limit: 3 Stars in 30% or more of the wins.
- Some Region 1 Stages get a Star Turn below 15, so 3 Stars there are harder than before. A saved Profile keeps its best Stars.
- When a change makes the Battles of a Stage longer or shorter, its Star Turn must change too. Run `sim stage --check` again.
- The Player cannot know the Star Turn from a rule, so the Stage Panel shows it.
- "Turn limit" is not the name of the Star Turn. The Turn limit is Turn number 60, when the Defender wins (GDD 4.10).
