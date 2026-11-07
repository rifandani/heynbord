# Machine and Structure Migration: batch 1

Issue [#187](https://github.com/rifandani/heynbord/issues/187). Date: 2026-11-06.

**Status: batch 1 stopped. Issue 187 is not complete.** The four machines are on the `machine` Body Plan and the Clip Library, and each has a Unit Spec. Bone Rampart was on the `structure` plan before this issue, and its Unit Spec now has region boxes. The `palette` gate fails on all five units, and four units have no Turnaround. So the batch stops, and batch 2 did not start.

## Inventory

The lists come from the surveys in `scripts/unit-model/body_plans/README.md`.

| Batch | Unit | Body Plan | Layout | Status |
| --- | --- | --- | --- | --- |
| 1 | Grand Gearjammer | machine | cart | On the plan before this issue; Unit Spec added |
| 1 | Boss Snikkit | machine | cart | Moved; gates fail |
| 1 | Junk Walker | machine | walker | Moved; gates fail |
| 1 | Rocket Barrel Rider | machine | barrel | Moved; gates fail |
| 1 | Bone Rampart | structure | wall | On the plan before this issue; region boxes added |
| 2 | Bramble Nest | structure | wall | Pending |
| 2 | Bonestake Palisade | structure | wall | Pending |
| 2 | Town Barricade | structure | heap | Pending |
| 2 | Junk Barricade | structure | heap | Pending |
| 2 | Dawn Reliquary | structure | shrine | Pending |

Batch 1 has all the machines and the structure pilot, so it tests the cart, walker and barrel layouts. Batch 2 has the other five structures. Each one needs `footBones` in its Unit Spec.

## Turnarounds

Only Bone Rampart has an approved Turnaround (issue #195). The four machines have none, so `interior-difference` gives an error, and an error is not a pass. An external image model makes the views, and a person approves them, so an agent cannot do this step. `prompts/` has the prompt set of each machine. The steps are in `scripts/unit-model/README.md`, section Turnarounds.

## Changes

- **The moves.** Each script gets its bones from `plan.build_rig` and a `Proportions` table, and its clips from `clips.machine.CLIPS`, a `Poses` subclass and its `Patch` list. After each move, `bun unit-model:contract:check` passed to the last bit. The table below has the patches.
- **Unit Specs.** `bun unit-model:spec:draft` made the parts, palette, props and region boxes. A person must check the `details`, `identity`, props and `holedParts`. The region boxes are measures of the current model. They find a later change. They do not approve the present art.
- **Raw Exports.** Git keeps the Raw Export of the four new specs, so CI can check them.

| Unit | Overrides | Patches | Own timing |
| --- | --- | --- | --- |
| Boss Snikkit | 10, with `wheel_turns=2` | `idle` cackle, `lowHp` slump, `walk` small-wheels, `attack` torch-strike | 4 of 8 clips |
| Junk Walker | 7, carrier `body`, no wheels | `idle` engine-thrum, `lowHp` steam-leak, `walk` pipe-stride, `attack` claw-snap, `death` buckle-tip, `rebirth` buckle-rise, `summon` steam-drop | 7 of 8 clips |
| Rocket Barrel Rider | 7, carrier `barrel`, no wheels | `idle` barrel-hover, `lowHp` barrel-sputter, `walk` swift-flight, `attack` barrel-ram, `death` barrel-blast, `rebirth` barrel-crash, `summon` rocket-launch | 7 of 8 clips |

Junk Walker keeps its leg IK, `add_controls`. Its legs come from `plan.walker_poles` and `plan.walker_leg`, and its driver from `plan.crew_bones`. The rider bones of Rocket Barrel Rider are in the `trunk` list of `plan.build_rig`. Neither unit has a cast clip.

## Defects fixed

| Defect | Units | Owner | Change | Regression check |
| --- | --- | --- | --- | --- |
| A long prop fails `attachment-anchor` near its hand | Bone Rampart banner | Review Gate | The gate measured from the bone to the nearest vertex. A pole has vertices at its ends only. It now measures to the nearest point on the triangles of the prop | `gates.test.ts`: a pole ten times as long passes; `nearestOnTriangle` tests |
| The Unit Spec names the wrong bone of a prop | Bone Rampart | Unit Spec | The hammer, the banner and the sign name the bone that moves them | `attachment-anchor` passes |
| No region boxes | Bone Rampart | Unit Spec | `regions` from the draft tool | `region-coverage` passes |
| The bombs and the hourglass are far from the `cart` bone | Boss Snikkit | Unit script | Each prop gets its own bone on the cart. The hourglass bone hangs from the rim. No clip keys them | `attachment-anchor` passes. The 336 old animation tracks are the same; 48 still tracks are new |
| The barrel is a prop, but it is the body of the machine | Rocket Barrel Rider | Unit script | The barrel has the `torso` region, as the cart of Boss Snikkit has | `attachment-anchor` passes |
| A part goes below the ground in `death` | Junk Walker, Rocket Barrel Rider | Unit clip | Junk Walker drops 0.08, not 0.12, when its knees give. The fireball of Rocket Barrel Rider rises as it grows, and she lands 0.01 higher | `bun unit-model:clips:check` passes |
| Holes by design fail `turntable` | Grand Gearjammer, Boss Snikkit, Rocket Barrel Rider, Bone Rampart | Unit Spec | `holedParts`: the spoked wheels and the gear, the hourglass frame, the goggle strap of the cap, the chains | Those parts no longer fail |

The two `death` defects were in the old scripts. Contract and clip checks of the old scripts gave the same values. The gates do not read them, but the clip check does.

## Source Contracts

The change of each contract is intentional:

- Boss Snikkit: 14 to 16 bones. Each clip digest changes because the two new bones have still tracks. The top Z bound changes by 8e-9.
- Junk Walker: `death` and `rebirth`, because both use the `tilting` pose.
- Rocket Barrel Rider: `death`.
- Grand Gearjammer and Bone Rampart: no change.

The Raw Export and the Published Model of Grand Gearjammer and Bone Rampart are new files with the same contract. Each was built again with the current kit before the first capture, and Blender writes the vertices, normals and indices in a different order on each build. The positions, bones and clips do not change. The capture and the gates read these files, so the commit keeps them.

## Results

| Unit | Plan | Before | After | Defects fixed |
| --- | --- | --- | --- | --- |
| grand-gearjammer | machine | 5 pass, 5 fail, 1 error | 5 pass, 5 fail, 1 error | Unit Spec; designed holes listed |
| boss-snikkit | machine | 6 pass, 4 fail, 1 error | 7 pass, 3 fail, 1 error | Prop bones |
| junk-walker | machine | 8 pass, 2 fail, 1 error | 8 pass, 2 fail, 1 error | `death` through the ground |
| rocket-barrel-rider | machine | 7 pass, 3 fail, 1 error | 7 pass, 3 fail, 1 error | Barrel region; `death` through the ground |
| bone-rampart | structure | 6 pass, 4 fail, 1 error | 8 pass, 3 fail, 0 error | Region boxes; prop bones; anchor gate |

Each unit is in `artifacts/unit-model-review/<name>/issue-187-before/` and `issue-187-after/`.

- **Before.** The old scripts, the old anchor gate and the drafted Unit Spec with no fixes: no `holedParts`, no clip overrides, the bombs and the hourglass on `cart`, the barrel as a prop on `barrel`, and the old prop bones and no region boxes of Bone Rampart. This run had the uncommitted gate changes of issue #185 in the working tree.
- **After.** The gate code of this commit only, in a clean worktree, on the same captures. With the issue #185 gate changes, the after run gave the same results, except one: Rocket Barrel Rider passed `joint-loops`. That change accepts a ring of a wide trunk at a share of the height. Without it, the rider's `spine`, `chest` and `neck` fail. So the rocket's change from pass to fail in `joint-loops` comes from the gate code, not from the model. `batch.json` has the status of each gate. All ten captures passed the manifest check. No run had a source-input problem. `ground-contact` passes with `applies` set to false on the machines. `foot-bones` passes on Bone Rampart and with `applies` set to false on the machines.

These failures stay:

| Unit | Failed gates |
| --- | --- |
| grand-gearjammer | `turntable` (cart, body), `self-intersection` (cannon flash), `joint-loops` (cart), `chirality` (crew arms), `palette` |
| boss-snikkit | `turntable` (torch, body), `self-intersection` (cart, cloth), `palette` |
| junk-walker | `self-intersection` (back), `palette` |
| rocket-barrel-rider | `turntable` (scarf, body), `joint-loops` (spine, chest, neck), `palette` |
| bone-rampart | `turntable` (platform), `self-intersection` (shields 3 and 4), `palette` |

The four machines also have the `interior-difference` error.

## Why the batch stops

The issue says to stop when a defect repeats, and to fix the shared layer first. `palette` fails on 5 of 5 units, and the same colors fail in each machine:

- Neutral iron, near Lab (21, 0.5, 3): delta-E 6 to 11 in Grand Gearjammer, Junk Walker and Boss Snikkit. The paintings have warm dark colors.
- Brass, near Lab (67, 9, 51): delta-E 6 to 9 in the same three units.
- Goblin skin, near Lab (61, -17, 34): delta-E 21 to 23 in the two carts.
- Bone, near Lab (83, -1, 13): delta-E 6 to 9 in Bone Rampart.

Each script has its own copy of these colors, so there is no shared layer to fix now. The next step is a person's decision: make one goblin material palette from the card paintings and use it in each goblin script, or correct each unit against its approved Turnaround. A palette change is an art change, so it needs a person's approval. A pass on the clip checks does not pass the model gates.

`self-intersection` repeats on 4 of 5 units, and `turntable` on 4 of 5. Their parts are different in each unit, so they are unit defects. The `body` holes are the gaps under a cart and between an arm and the body. Issue #185 has a local change that lets `holedParts` name `body` and lets a Unit Spec list `posedPairs` for the crew arms. That change is not in this commit, so these specs do not use it. Its `joint-loops` change for a wide trunk would also pass the rider of Rocket Barrel Rider. Commit the issue #185 gate changes before batch 2.

## Validation

- `bun unit-model:spec:check`: all specs pass.
- `bun unit-model:contract:check` and `bun unit-model:clips:check`: pass for the five units.
- `python3 -m unittest test_clip_library`: the four machine specs are in `MOVED_WITH_SPECS`, so the test compares each `override` with its `Patch`.
- `bun test scripts/unit-model/review`: 111 tests pass.
- Type checks: pass.

- `bun run test:unit:cov`: 214 files pass; 3,630 tests pass, one skip. Coverage passes its floors.
- `bun test scripts --timeout 30000`: 174 tests pass. The plain Python suite: 175 tests pass, two Blender-only modules skip.
- `bun run lint`: pass.
- A clean worktree of HEAD with only this commit: the spec, contract, clip and pack checks pass for the five units, and the gate and pack tests pass.

No CI run is claimed: the branch was not pushed.

The work was done in a shared working tree with the uncommitted work of issue #185. The commit has only the files of this issue.
