# A Stage hits its target with no Gear and with the Expected Gear

The win-rate target of a Stage (GDD 13) is for a new Player on the first try, and the Stages were tuned with no Gear. Gear unlocks at Player level 5, so a Player can upgrade Gear before the late Stages of Region 1, and Gear makes the win margins larger (issue #78). We decided that each Stage must hit its target two times, both at the **Recommended level**: with no Gear, and with the **Expected Gear**. The Expected Gear is the highest Gear that a Player on the **First-try Path** has before the Stage, over all Play Styles. `sim stage` calculates it from the economy simulation, so the value does not go out of date.

We did this because a Player who never opens the Hero screen and a Player who upgrades Gear must both get a Stage on its target. Gear adds only 3 to 7 points in Region 1, so both windows can be met. The Recommended level stays "with no Gear", so the win-chance model of the economy simulation (Economy 7.1) does not change.

## Considered Options

- **Gear 0 only.** This was the rule before. Rejected: Gear is a bonus with no limit, so a Player with Gear can go above the target, and that is the problem of issue #78.
- **Expected Gear only.** The Recommended level includes Gear. Rejected: a Player who does not upgrade Gear finds the Stage harder than its target.
- **The Expected Gear of a typical Player, with losses.** Rejected: a Player who loses gets XP and Gear sooner. The Recommended level and the expected Deck come from the First-try Path, so the Expected Gear comes from it too. The extra Gear of a Player who loses is a catch-up, not a miss.
- **A "Gear first" Play Style that puts all Coin into Gear.** Rejected: no Player uses it, so it makes the windows too narrow for no reason.

## Consequences

- A Stage with Expected Gear has a narrower window at Gear 0. For example, if Gear adds 6 points, a normal Stage must be at 60% to 74% with no Gear.
- In Region 1, only Stages 1-9 and 1-10 have Expected Gear. In Regions 2 and 3, all Stages have it, and the gap can be larger. A larger gap can need a new rule, for example a larger target window or enemy Gear that grows with the Player.
- When a Gear stat, a Gear cost, the Coin rewards or a Play Style changes, the Expected Gear changes too. Run `sim stage --check` again.
