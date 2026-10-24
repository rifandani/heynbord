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
- A Dungeon hits its target with no Gear and with the Expected Gear at its unlock level. Dungeon 3 unlocks at level 30, above all Stages, so the First-try Path goes on after the Campaign to get it (Gear 16). There, Gear adds about 13 to 21 points. Thus the Dungeon 3 Bosses get a Skill Card that makes the gap smaller in the sim (Pinning Shot), and Boss Decks of 4 cards ([14 — Campaign Stages, 7.5](../game/14-campaign-stages.md#75-dungeon-3-the-broken-vault)).

## Amendment

- **2026-10-24: a Boss row has a window for each Gear row.** A Boss Stage, a Boss Floor and a Dungeon must hit **25% to 50% with no Gear** and **30% to 55% with the Expected Gear** (or with the Gear of `--gear`). The other Stages and Floors keep one window for both rows. On the late Bosses, the spread from Vanguard with no Gear to Raiders with the Expected Gear was 21 to 26 points, and the window was 20 points: Gear adds about 17 points there, and the 2 starter Decks are 6 to 13 points apart. No change of the enemy Hero HP, Rank steps, enemy Gear or start Units put all 4 rows in 30% to 50% at Stage 4-10, Floor 10 and Floor 40. This is the "larger target window" of the Consequences above.
  - The window keeps 30% to 50% as the Boss target. A Player with no Gear can find a Boss up to 5 points harder, and a Player with the Expected Gear up to 5 points easier.
  - The economy simulation does not change: its base win chance for a Boss is still the middle of 30% to 50% (Economy 7.1). Only `sim:check` uses the 2 windows (`stageTarget`, `floorTarget` and `dungeonTarget` with a Gear row).
  - Rejected: a target on the mean of the 2 starter Decks. Then a Deck can be far out of the window, and the Player does not select the mean.
  - Rejected: the Boss rows show "review" and do not fail the check. Then no check stops a Boss that is too hard or too easy.
