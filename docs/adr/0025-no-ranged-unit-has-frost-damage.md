# No Ranged Unit has Frost damage

Frost damage gives Freeze, and a Frozen Unit skips its next action. A Ranged Unit hits the nearest enemy in each of its Turns, so it can Freeze the same enemy before each action of that enemy, and that enemy almost never acts (issue #24). This is the Entangle lock of [ADR-0022](0022-no-range-above-3-and-entangle-only-on-epic-ranged-units.md), but stronger, because a Frozen Unit also does not attack. Rimebreath Drake (Rare Shooter, 2/6, Range 3, Flying, Frost) was the only such card. With 1 copy in place of a Cave Bear, Wild Hunt went from 50.9% to 70.8% on average against the 8 other Archetypes. In 23.5% of Battles, the Drake made one enemy skip 3 or more actions in a row.

We decided:

- **No Ranged Unit has Frost damage, at any Rank.** A content test checks it.
- **Rimebreath Drake becomes a Rare Flying melee Frost Striker, 3/6 at Countdown 5** (Power 26 of 27). Its name and art stay. With it, Wild Hunt is at 51.1%, and the Drake gives a run of 3 or more skips in 2.5% of Battles.
- **The melee Frost lock stays.** A Frozen defender does not retaliate, so a melee Frost Unit can also Freeze the Unit in front of it again. But it must stand next to its target, and it gives a run of 3 or more skips in only about 4% of Battles (Frostfang Lynx and Frost Elk Matriarch).
- **Freeze rules do not change.** Fire and Frost still give their Status also at 0 damage.

## Considered Options

All results are the Wild Hunt average against the 8 other Archetypes, with 1 Drake in place of 1 Cave Bear and 500 seeds (1000 Battles) for each Matchup. "Lock" is the percent of Battles with a run of 3 or more skipped actions.

- **Only a Ranged Unit with Base Rank Epic or higher has Frost, as for Entangle.** Rejected. An Epic Frost Shooter locks longer than the Rare one: lock 31% to 39%, and the 95th percentile run is 8 skips. Its low Attack does not kill the Frozen target, so the lock does not end.
- **Freeze immunity: a Unit that skipped an action because of Freeze cannot become Frozen until its next action ends.** Rejected. It stops each long lock, also the melee one (lock 0%), but it keeps most of the power: 73.0% with 2 Drakes, against 75.9% without the rule. Denying every second action is most of the value. It also adds a state that the Player must see.
- **A Ranged attack does not give Freeze.** Rejected. It gives the same results as Physical damage, but a card then says Frost and its attack does not Freeze.
- **A Physical or Fire Shooter.** Rejected. A Physical Drake within its budget gives 60.6% (2/7) to 67.3% (3/6). A Fire Drake at 2/6 gives 64.3%. The lock ends, but a Rare Shooter at Countdown 5 is still too strong in Wild Hunt.

## Consequences

- Feral has 1 Shooter and 6 Strikers.
- Frost Bolt and other Skill Cards keep Frost. They Freeze one time and do not lock.
