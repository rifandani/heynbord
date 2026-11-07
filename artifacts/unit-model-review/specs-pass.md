# Unit Spec and Review Gate fixes

Date: 2026-11-07. PR #194. Branch: `feat/192-flat-first-combine`.

The five units now have Unit Specs and pass the ten Review Gates that do not need a Turnaround. Each unit passes the spec, pack, Source Contract, clip and capture checks. Each capture has 19 images and no recorded error. The records are in `<unit>/2026-11-07/` beside this file.

`interior-difference` gives an error for each unit: no admitted Turnaround. The five reference folders were absent at the last check. No CI run is recorded here.

## Results

| Unit | First local gates with the new spec | Final local gates | Fixes |
| --- | --- | --- | --- |
| rimebreath-drake | 6 pass, 4 fail, 1 error | 10 pass, 1 error | Palette; straight wing membrane strips; snow on the ground; designed gaps |
| fuse-runner | 7 pass, 3 fail, 1 error | 10 pass, 1 error | Palette; separate bomb band vertices; designed gaps |
| elderreed-dartmaster | 8 pass, 2 fail, 1 error | 10 pass, 1 error | Palette; prop anchors; designed gaps |
| tailsweep-basilisk | 7 pass, 3 fail, 1 error | 10 pass, 1 error | Palette; continuous toes and claws; blended head joint core |
| tusk-brute | 6 pass, 4 fail, 1 error | 10 pass, 1 error | Palette; waist rings; matched bracer bases; separate right bracer spikes; designed gaps |

CI stopped before the gates because these five Unit Specs did not exist. The first local column uses the new specs with the first unchanged builds. It is not a CI gate record.

## Gate values

The values below come from each final `gates.json`. The region value is the largest box edge difference. The joint value is the smallest band count. The palette value is the largest delta-E. Ground and foot gates pass with `applies: false` when their Body Plan does not apply.

### rimebreath-drake

| Gate                  | Result | Value                                   |
| --------------------- | ------ | --------------------------------------- |
| `turntable`           | pass   | 4 views; 0 missing; 0 blocked holes     |
| `interior-difference` | error  | no admitted Turnaround                  |
| `self-intersection`   | pass   | 0 inside vertices                       |
| `joint-loops`         | pass   | 3 bands; 0 failed joints                |
| `attachment-anchor`   | pass   | 0 props                                 |
| `region-coverage`     | pass   | 0.0084 / 0.04                           |
| `chirality`           | pass   | 7 pairs; 0 failures                     |
| `palette`             | pass   | 3.92 / 5                                |
| `part-coverage`       | pass   | 17 built; 17 specified; 0 errors        |
| `ground-contact`      | pass   | lowest snow at 0.000000; 0 below ground |
| `foot-bones`          | pass   | applies: false                          |

### fuse-runner

| Gate                  | Result | Value                               |
| --------------------- | ------ | ----------------------------------- |
| `turntable`           | pass   | 4 views; 0 missing; 0 blocked holes |
| `interior-difference` | error  | no admitted Turnaround              |
| `self-intersection`   | pass   | 0 inside vertices                   |
| `joint-loops`         | pass   | 7 bands; 0 failed joints            |
| `attachment-anchor`   | pass   | bomb 0.050553 / 0.103500            |
| `region-coverage`     | pass   | 0.0049 / 0.04                       |
| `chirality`           | pass   | 13 pairs; 0 failures                |
| `palette`             | pass   | 4.43 / 5                            |
| `part-coverage`       | pass   | 24 built; 24 specified; 0 errors    |
| `ground-contact`      | pass   | applies: false                      |
| `foot-bones`          | pass   | applies: false                      |

### elderreed-dartmaster

| Gate | Result | Value |
| --- | --- | --- |
| `turntable` | pass | 4 views; 0 missing; 0 blocked holes |
| `interior-difference` | error | no admitted Turnaround |
| `self-intersection` | pass | 0 inside vertices |
| `joint-loops` | pass | 6 bands; 0 failed joints |
| `attachment-anchor` | pass | pipe 0.001555 / 0.145200; case 0.080826 / 0.145200 |
| `region-coverage` | pass | 0.0048 / 0.04 |
| `chirality` | pass | 14 pairs; 0 failures |
| `palette` | pass | 4.50 / 5 |
| `part-coverage` | pass | 23 built; 23 specified; 0 errors |
| `ground-contact` | pass | applies: false |
| `foot-bones` | pass | applies: false |

### tailsweep-basilisk

| Gate                  | Result | Value                               |
| --------------------- | ------ | ----------------------------------- |
| `turntable`           | pass   | 4 views; 0 missing; 0 blocked holes |
| `interior-difference` | error  | no admitted Turnaround              |
| `self-intersection`   | pass   | 0 inside vertices                   |
| `joint-loops`         | pass   | 4 bands; 0 failed joints            |
| `attachment-anchor`   | pass   | 0 props                             |
| `region-coverage`     | pass   | 0.0046 / 0.04                       |
| `chirality`           | pass   | 12 pairs; 0 failures                |
| `palette`             | pass   | 3.93 / 5                            |
| `part-coverage`       | pass   | 19 built; 19 specified; 0 errors    |
| `ground-contact`      | pass   | applies: false                      |
| `foot-bones`          | pass   | applies: false                      |

### tusk-brute

| Gate | Result | Value |
| --- | --- | --- |
| `turntable` | pass | 4 views; 0 missing; 0 blocked holes |
| `interior-difference` | error | no admitted Turnaround |
| `self-intersection` | pass | 0 inside vertices |
| `joint-loops` | pass | 5 bands; 0 failed joints |
| `attachment-anchor` | pass | club 0.001308 / 0.150300; door 0.150230 / 0.150300 |
| `region-coverage` | pass | 0.0046 / 0.04 |
| `chirality` | pass | 15 pairs; 0 failures |
| `palette` | pass | 4.28 / 5 |
| `part-coverage` | pass | 28 built; 28 specified; 0 errors |
| `ground-contact` | pass | applies: false |
| `foot-bones` | pass | applies: false |

## Palette

Each failed main color moved toward a near color of its card painting. The build script and Unit Spec use the same colors. Small colors that passed stay unchanged.

| Unit | Changes |
| --- | --- |
| rimebreath-drake | `belly_band` #d9d1bc → #d9c6bc; `claw` #4a4f5a → #534f5a |
| fuse-runner | `skin` #c0bcb6 → #c0b0a7; `eyes` #f2a838 → #f2a846; `scarf` #3c4a68 → #3c4a64; `scarf_light` #d8c49a → #dcc49a; `shirt` #ddd0b2 → #e8d0b2; `shirt_dark` #b4a684 → #bea684; `spark` #ffd040 → #ffbb50; `fire` #ffb030 → #ffb048; `fire_hot` #fff0a0 → #ffeca0; `fire_dark` #e05a1a → #d2762a; `smoke` #7a726c → #7c726c |
| elderreed-dartmaster | `eyes` #1f2a1a → #2d1a1a; `leaf` #5d7a34 → #6b6434; `leaf_dark` #3d5424 → #595424; `leaf_light` #8aa452 → #9a8e52; `tunic` #6f7f36 → #7b6f36; `reed_dark` #62652f → #6d652f; `sap` #9ee04a → #aea056; `sap_dark` #5fa02a → #6f732a |
| tailsweep-basilisk | `scale` #b8925a → #c1925a; `belly` #ddc58e → #e4c58e; `eye` #e3b232 → #e39b42 |
| tusk-brute | `skin` #a6ac48 → #b68c50; `eyes` #1a120c → #1b120c; `iron` #5c5650 → #6f5650; `iron_dark` #38342f → #43342f; `fur` #a8906c → #b1906c |

## Geometry and Unit Specs

- Rimebreath Drake has one straight strip across each wing section. The old curved panel crossed itself near the wrist. The wing outline, bones, ice spikes and icicles stay in place. The snow mound moved up 0.006, so its lowest point is 0.
- Fuse Runner has a second bomb band with a radius 0.001 larger. The two bands no longer weld at their crossing points.
- Tailsweep Basilisk has one tube through each toe and claw. The old two cones had internal caps at their shared ring. A thin core under the neck has three rings and a blend from `neck` to `head`.
- Tusk Brute has three new rings around the waist joint. The two bracer bases now have the same shape. The right iron spikes have their own part, `bracer.spikes`, so the two different costumes do not make the bracer pair fail.
- Elderreed Dartmaster keeps its rig and pole bones. Pole bones block a move to the shared biped builder. They do not block a `biped-medium` Unit Spec. The spec names `hand.R` for the pipe and `hips` for the dart case.
- Fuse Runner uses the `bomb` bone for the bomb held in both arms. The schema has no `both` hand value, so this mounted prop uses `hand: none`. Tusk Brute names `hand.R` for the club and `door` for the broken door.

`holedParts` records these gaps by design. No gate limit changed.

| Unit | Parts | Reason |
| --- | --- | --- |
| rimebreath-drake | `body`, `stand` | Space between the folded limbs and body; two strands of frozen mist |
| fuse-runner | `body`, `goggles` | Space within the held arms; closed goggle strap |
| elderreed-dartmaster | `body`, `hair`, `case` | Space beside the cloak and arms; hair tie; separate darts |
| tailsweep-basilisk | none | No designed hole needs an exception |
| tusk-brute | `body`, `door` | Space within the arms; broken door frame |

The specs describe the current models. The gates do not approve the art. For example, Elderreed stands with the pipe down at rest, while the card shows a crouched aim with a longer pipe. Tusk Brute keeps the door across the upper back.

## Source Contracts

No clip digest, clip duration or bone count changed for these five units.

| Unit | Change | Reason |
| --- | --- | --- |
| rimebreath-drake | Minimum Y: -0.006000000983476639 → 0 | Snow mound is on the ground |
| fuse-runner | None | The band radius change stays inside the old bounds |
| elderreed-dartmaster | None | Palette and Unit Spec only |
| tailsweep-basilisk | Minimum and maximum differ by at most 2.3e-9 | The continuous toe surfaces give slightly different float bounds |
| tusk-brute | None | Rings and bracer changes stay inside the old bounds |

## Margins and remaining work

The largest palette delta-E is 4.50 against a limit of 5. Rimebreath has at least three joint bands. Tusk Brute has five at the waist. Its door anchor is 0.150230 from the surface against a limit of 0.150300; the Raw Export supplies both values.

The Turnarounds are now approved. See [interior-difference: resumed model pass](#interior-difference-resumed-model-pass) for the final values. The largest band of the five units is 0.265, against a limit of 0.28.

## Files

Each unit changes these files:

- `scripts/unit-model/<unit>.py`
- `scripts/unit-model/specs/<unit>.json` (new)
- `apps/web/art/units/raw/<unit>.glb` (new, allowed by `.gitignore`)
- `apps/web/public/models/units/<unit>.glb`
- `artifacts/unit-model-review/<unit>/2026-11-07/` (19 captures, manifest and gate records)

| Unit | Build script | Unit Spec | Raw Export | Published Model | Review |
| --- | --- | --- | --- | --- | --- |
| rimebreath-drake | [script](../../scripts/unit-model/rimebreath-drake.py) | [spec](../../scripts/unit-model/specs/rimebreath-drake.json) | [raw](../../apps/web/art/units/raw/rimebreath-drake.glb) | [packed](../../apps/web/public/models/units/rimebreath-drake.glb) | [gates](rimebreath-drake/2026-11-07/gates.json) |
| fuse-runner | [script](../../scripts/unit-model/fuse-runner.py) | [spec](../../scripts/unit-model/specs/fuse-runner.json) | [raw](../../apps/web/art/units/raw/fuse-runner.glb) | [packed](../../apps/web/public/models/units/fuse-runner.glb) | [gates](fuse-runner/2026-11-07/gates.json) |
| elderreed-dartmaster | [script](../../scripts/unit-model/elderreed-dartmaster.py) | [spec](../../scripts/unit-model/specs/elderreed-dartmaster.json) | [raw](../../apps/web/art/units/raw/elderreed-dartmaster.glb) | [packed](../../apps/web/public/models/units/elderreed-dartmaster.glb) | [gates](elderreed-dartmaster/2026-11-07/gates.json) |
| tailsweep-basilisk | [script](../../scripts/unit-model/tailsweep-basilisk.py) | [spec](../../scripts/unit-model/specs/tailsweep-basilisk.json) | [raw](../../apps/web/art/units/raw/tailsweep-basilisk.glb) | [packed](../../apps/web/public/models/units/tailsweep-basilisk.glb) | [gates](tailsweep-basilisk/2026-11-07/gates.json) |
| tusk-brute | [script](../../scripts/unit-model/tusk-brute.py) | [spec](../../scripts/unit-model/specs/tusk-brute.json) | [raw](../../apps/web/art/units/raw/tusk-brute.glb) | [packed](../../apps/web/public/models/units/tusk-brute.glb) | [gates](tusk-brute/2026-11-07/gates.json) |

The shared changes are five Raw Export exceptions in `.gitignore`, the two changed entries in `source-contracts.json`, the README status and the link in `gates-pass.md`. `migrations/humanoids.md` records the new specs. `test_unit_spec.py` includes the five new specs in its expected command output.

## Validation

- Five Blender builds: pass.
- Unit Spec check: all 22 specs pass.
- Five pack checks, Source Contract checks and clip checks: pass.
- Five captures: 19 images each; no capture validation error.
- Ten Review Gates per unit: pass. `interior-difference`: error, no admitted Turnaround.
- Python suite: 175 tests run; 173 pass and 2 Blender-only tests skip.
- `bun test scripts --timeout 30000`: 184 pass.
- `bun run web:test:unit unit-model`: 129 pass.
- `bun run lint`: fails on formatting in the other agents' active files. The five units and their records pass their format checks. The shared Source Contract was formatted under the lock. The remaining paths are the other five units' review records, Amberwing Dart's Turnaround record, and the specs of Amberwing Dart, Boss Snikkit, Grand Gearjammer and Rocket Barrel Rider. Those files were left for their owners.

No commit or push was made. Other agents worked in this checkout. Their files are outside this record.

## interior-difference: resumed model pass

This section replaces the earlier missing-Turnaround status for Fuse Runner, Rimebreath Drake and Elderreed Dartmaster. Each now has an admitted Turnaround and a local pass of all 11 Review Gates. The approved view images, `turnaround.json` files and admission data did not change. No CI run is recorded here.

Before is the local report at the start of the resumed task on 2026-11-07. After is the final capture of that date. Each value is a mean luminance difference. The gate limit stays at 0.28. All six final bands of each of the two changed units are below 0.27. Fuse Runner has one band above 0.26, at 0.2648. Rimebreath Drake has one, at 0.2625.

| Unit | View | Head before → after | Torso before → after | Legs before → after |
| --- | --- | --- | --- | --- |
| fuse-runner | front | 0.3038 → 0.2470 | 0.2644 → 0.2425 | 0.1963 → 0.1798 |
| fuse-runner | back | 0.2735 → 0.2594 | 0.2803 → 0.2648 | 0.1670 → 0.2036 |
| rimebreath-drake | front | 0.2474 → 0.2489 | 0.1997 → 0.1979 | 0.2500 → 0.2529 |
| rimebreath-drake | back | 0.2357 → 0.2371 | 0.2296 → 0.2274 | 0.2878 → 0.2625 |

Elderreed Dartmaster was already complete at the start of this task. Its script, model, spec and capture were left unchanged. Its existing local report gives these six values:

| Unit                 | View  | Head   | Torso  | Legs   |
| -------------------- | ----- | ------ | ------ | ------ |
| elderreed-dartmaster | front | 0.2382 | 0.1791 | 0.1795 |
| elderreed-dartmaster | back  | 0.2652 | 0.1487 | 0.1391 |

Tailsweep Basilisk and Tusk Brute needed no model change for this gate. The person rejected the first back view of Tailsweep Basilisk, because its spine spikes left the center line of the tail. The new back view has one row of spikes on the center line of the back and the tail. Both units pass all 11 Review Gates with these values:

| Unit               | View  | Head  | Torso | Legs  |
| ------------------ | ----- | ----- | ----- | ----- |
| tailsweep-basilisk | front | 0.206 | 0.249 | 0.178 |
| tailsweep-basilisk | back  | 0.240 | 0.221 | 0.192 |
| tusk-brute         | front | 0.175 | 0.170 | 0.173 |
| tusk-brute         | back  | 0.191 | 0.192 | 0.189 |

### All 11 gates

| Gate | fuse-runner | rimebreath-drake | elderreed-dartmaster |
| --- | --- | --- | --- |
| `turntable` | pass | pass | pass |
| `interior-difference` | pass | pass | pass |
| `self-intersection` | pass | pass | pass |
| `joint-loops` | pass | pass | pass |
| `attachment-anchor` | pass | pass | pass |
| `region-coverage` | pass | pass | pass |
| `chirality` | pass | pass | pass |
| `palette` | pass | pass | pass |
| `part-coverage` | pass | pass | pass |
| `ground-contact` | pass | pass | pass |
| `foot-bones` | pass | pass | pass |

The largest palette delta-E is 4.41 for Fuse Runner, 4.22 for Rimebreath Drake and 4.50 for Elderreed Dartmaster, against the limit of 5.

### Model changes in this pass

- **Fuse Runner:** longer ears slope down from the temples. The face has a shorter nose, a visible mouth and round eyes. Each eye has one connected surface with white, iris and pupil bands. Each goggle has a connected brass rim and lens. Layered hair has a broad crown above the goggles. The idle neck and head turn less far down, so the face stays visible while it looks toward the fuse. The striped scarf extends to the side, and the back strap follows the approved diagonal. The shirt has warmer, darker cloth and less vertex shading. The Unit Spec gives the final height and region boxes.
- **Rimebreath Drake:** the long tail hangs down and curves beside the mist stand. The stand has a broad, continuous core with horizontal rings. These rings remove the abrupt folds of the old tangent frames and keep the stand above the ground. The earlier pale feet, short dark claws, wing fixes and snow position remain. The Unit Spec boxes include the low tail and wider stand.

The palette changes below are relative to the start of this resumed task. Each changed color is in both the build script and Unit Spec. Rimebreath Drake has no further palette change.

| Unit        | Color        | Before    | After     |
| ----------- | ------------ | --------- | --------- |
| fuse-runner | `hair`       | `#eee6d6` | `#fff4e4` |
| fuse-runner | `hair_dark`  | `#cfc4a8` | `#b99f87` |
| fuse-runner | `shirt`      | `#e8d0b2` | `#ccb092` |
| fuse-runner | `shirt_dark` | `#bea684` | `#b19474` |

### Source Contract changes in this pass

Only the `fuse-runner.glb` and `rimebreath-drake.glb` entries changed. Both pass `unit-model:contract:check` after packing. Bone counts remain 24 and 23. All clip names and durations stay the same.

| Unit             | Field     | Before       | After        |
| ---------------- | --------- | ------------ | ------------ |
| fuse-runner      | Minimum X | -0.151800811 | -0.335120022 |
| fuse-runner      | Maximum X | 0.151800811  | 0.206518412  |
| fuse-runner      | Minimum Z | -0.220957696 | -0.250957700 |
| fuse-runner      | Maximum Y | 0.719836625  | 0.725000050  |
| rimebreath-drake | Minimum Z | -0.700131317 | -0.700131464 |

Fuse Runner bounds include the longer scarf, ears and crown. Its idle head pose changes the keyframe digests of `idle`, `attack`, `hurt`, `death`, `rebirth` and `summon`. The `walk` and `lowHp` digests stay the same. Rimebreath Drake has seven new keyframe digests because the tail bones have new rest directions. Its minimum Z differs by about 0.000000148 from float arithmetic. No clip timing changed.

### Files changed in this pass

For each of `fuse-runner` and `rimebreath-drake`:

- `scripts/unit-model/<unit>.py`
- `scripts/unit-model/specs/<unit>.json`
- `apps/web/art/units/raw/<unit>.glb`
- `apps/web/public/models/units/<unit>.glb`
- `artifacts/unit-model-review/<unit>/2026-11-07/`: 19 captures, `manifest.json`, `review-gate.json` and `gates.json`.

The shared files changed in this pass are `scripts/unit-model/source-contracts.json` and this report. Each pack and shared write used `/tmp/heynbord-shared.lock`. The changes from earlier agents remain. No other unit file was edited. No commit or push was made.

### Final validation

- Both Blender builds, pack checks, Source Contract checks, clip checks, Unit Spec checks and Turnaround checks pass.
- Both captures have 19 images and no capture error. Front and back captures were compared with the approved views.
- Both units pass all 11 Review Gates. Elderreed Dartmaster retains its existing 11 passes.
- `python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'`: 175 tests run; 173 pass and 2 Blender-only tests skip.
- `bun test scripts --timeout 30000`: 184 pass; 0 fail.
- `bun run web:test:unit unit-model`: 129 pass; 0 fail.
- Format checks of the two Unit Specs and their review JSON files pass.
