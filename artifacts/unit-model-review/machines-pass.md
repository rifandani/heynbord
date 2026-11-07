# Review Gate fixes: Amberwing Dart and machines

Date: 2026-11-07. Pull request [#194](https://github.com/rifandani/heynbord/pull/194).

Amberwing Dart, Boss Snikkit, Junk Walker, Rocket Barrel Rider and Grand Gearjammer each pass all 11 Review Gates on a local run. Every `interior-difference` band is below 0.26. Each unit has an approved Turnaround. The capture and `gates.json` of each final run are in `<unit>/2026-11-07/` beside this file. Each capture has 19 images and no console error. Each gate run has no input problem.

The first fix pass below had 10 passes and one admission error. The [interior-difference section](#interior-difference) records the later model changes against the approved views. The gate code and limits did not change. The approved view images, `turnaround.json` and `admission.json` did not change. No commit or push was made.

## First fix pass results

| Unit | Local failures before | Local result after | Fixes |
| --- | --- | --- | --- |
| [amberwing-dart](amberwing-dart/2026-11-07/gates.json) | Fail: `turntable`, `self-intersection`, `chirality`, `palette`. Error: `interior-difference`, `region-coverage` | 10 pass, 0 fail, 1 error | Palette; fixed vine frame; reflected wing frame; region boxes; designed gaps and wing repair in the spec; new pack |
| [boss-snikkit](boss-snikkit/2026-11-07/gates.json) | Fail: `turntable`, `self-intersection`, `palette`. Error: `interior-difference` | 10 pass, 0 fail, 1 error | Palette; closed cart plates and straight rim bars; cloth hem; taller crown; designed gaps |
| [junk-walker](junk-walker/2026-11-07/gates.json) | Fail: `self-intersection`, `palette`. Error: `interior-difference` | 10 pass, 0 fail, 1 error | Palette; round return pipe with a fixed frame |
| [rocket-barrel-rider](rocket-barrel-rider/2026-11-07/gates.json) | Fail: `turntable`, `palette`. Error: `interior-difference` | 10 pass, 0 fail, 1 error | Palette; scarf loop and body gaps in the spec |
| [grand-gearjammer](grand-gearjammer/2026-11-07/gates.json) | Fail: `turntable`, `self-intersection`, `joint-loops`, `chirality`, `palette`. Error: `interior-difference` | 10 pass, 0 fail, 1 error | Palette; rear pivot sleeve; separate flash spikes; designed gaps and crew poses in the spec |

## First fix pass gate values

Each cell gives the status and its measured value. `region-coverage` gives the largest box error as a share of the frame. `attachment-anchor` gives the largest distance and its limit in scene units. `joint-loops` gives the smallest band count and the number of joints. The palette value is the largest CIEDE2000 delta-E.

| Gate | amberwing-dart | boss-snikkit | junk-walker | rocket-barrel-rider | grand-gearjammer |
| --- | --- | --- | --- | --- | --- |
| `turntable` | pass: 4 views; 0 blocked holes | pass: 4 views; 0 blocked holes | pass: 4 views; 0 blocked holes | pass: 4 views; 0 blocked holes | pass: 4 views; 0 blocked holes |
| `interior-difference` | error: no admitted Turnaround | error: no admitted Turnaround | error: no admitted Turnaround | error: no admitted Turnaround | error: no admitted Turnaround |
| `self-intersection` | pass: 0 inside vertices | pass: 0 inside vertices | pass: 0 inside vertices | pass: 0 inside vertices | pass: 0 inside vertices |
| `joint-loops` | pass: 8 bands; 3 joints | pass: 10 bands; 3 joints | pass: 12 bands; 6 joints | pass: 6 bands; 12 joints | pass: 3 bands; 4 joints |
| `attachment-anchor` | pass: 0.058226 / 0.098983 | pass: 0.024629 / 0.142500 | pass: 0.000000 / 0.144930 | pass: 0 props | pass: 0.030778 / 0.139500 |
| `region-coverage` | pass: 0.0050 / 0.04 | pass: 0.0050 / 0.04 | pass: 0.0044 / 0.04 | pass: 0.0047 / 0.04 | pass: 0.0049 / 0.04 |
| `chirality` | pass: 4 pairs; 0 failures | pass: 4 pairs; 0 failures | pass: 11 pairs; 0 failures | pass: 13 pairs; 0 failures | pass: 10 pairs; 0 failures |
| `palette` | pass: 4.23 / 5 | pass: 4.37 / 5 | pass: 4.66 / 5 | pass: 4.63 / 5 | pass: 4.31 / 5 |
| `part-coverage` | pass: 13 / 13 parts | pass: 17 / 17 parts | pass: 21 / 21 parts | pass: 22 / 22 parts | pass: 21 / 21 parts |
| `ground-contact` | pass: lowest 0.007402 | pass: does not apply | pass: does not apply | pass: does not apply | pass: does not apply |
| `foot-bones` | pass: does not apply | pass: does not apply | pass: does not apply | pass: does not apply | pass: does not apply |

## Palette

Each script and its Unit Spec use the same new base colors. The neutral iron moved to warm brown metal. The goblin skin moved from green or gray to the warm pale skin of the card paintings. Amberwing Dart moved to olive and gold. Its vine is lighter, as the lit vine of the card. The small green gems and the green fluid stay green.

| Unit | Base color changes |
| --- | --- |
| amberwing-dart | body `#6f8a3a` → `#ac9a52`; body_dark `#4a6128` → `#6c643b`; body_light `#9cb455` → `#c5b76d`; wing `#d9c45a` → `#d9c45c`; vine `#5d6e2c` → `#c1a85f`; vine_dark `#3f4c1e` → `#a58b47`; leaf `#7da040` → `#909973`; leaf_light `#a8c45a` → `#bfb166` |
| boss-snikkit | bomb `#2e2a2c` → `#241a1c`; brass `#d4a24a` → `#e4a75a`; brass_dark `#94692a` → `#97642a`; ember `#ff5e1a` → `#ec692a`; gold `#f0c24a` → `#f7c15c`; gold_dark `#b58a2a` → `#c28943`; iron `#54463c` → `#59493e`; iron_dark `#342c28` → `#2c1e18`; skin `#9aa46a` → `#c9a68b`; skin_dark `#727c46` → `#90735a` |
| junk-walker | boiler `#6e5646` → `#6b5347`; boiler_dark `#4a3a30` → `#57433b`; brass `#d2a046` → `#e5ab61`; brass_dark `#93692a` → `#956325`; iron `#5a5650` → `#715f58`; iron_dark `#3a3733` → `#33241b`; red `#b0362c` → `#984b36`; skin `#b0aca2` → `#d6b89b`; steam `#e8e4dc` → `#fff3ea` |
| rocket-barrel-rider | blast_dark `#e05418` → `#ea6f2d`; iron `#4a4440` → `#4c403c`; skin `#c4bfb4` → `#c6b6ab` |
| grand-gearjammer | brass `#d2a046` → `#dca759`; brass_dark `#93692a` → `#946930`; hair `#ecebe6` → `#f9f7e5`; iron `#5a5650` → `#61544f`; iron_dark `#3a3733` → `#423935`; skin `#8fa25a` → `#d2af90`; vest `#8a3a2a` → `#883c2a` |

## Geometry

- **Amberwing Dart.** The vine and tendril now use a fixed transverse axis. A ring no longer turns where the tangent passes the frame threshold of `kit.tube`. The main vine is slightly thicker. The right wing starts from the left frame and reflects across X. The rear pair is an exact mirror. The front pair has `posedPairs: ["wing.F"]`, because only the right wing has the twig repair and extra vertices. The curls and leaf gaps are in `holedParts`. The spec now has region boxes. A new pack also removes the old Raw Export and Published Model vertex count difference.
- **Boss Snikkit.** The hollow cart is now five closed metal plates that overlap at the corners. Its separate walls give the floor corners clear outward surfaces for the island check. Four straight bars replace the rim tube that met itself with turned end rings. The torn cloth edge is 0.025 high, below the last row spacing, so its last face does not fold back. The crown band and points are taller, as in the card painting. The spec head box includes them. Dark brass on the back keeps the metal shade of the card. The torch cage and gaps under the arms are in `holedParts`.
- **Junk Walker.** The pipes have round bends and a fixed frame. The return pipe no longer folds through itself at its sharp back corner.
- **Rocket Barrel Rider.** The scarf collar is a loop by design. The arm and barrel gaps are also correct. The spec names both. The current gate already passes all 12 joints, so no joint geometry changed.
- **Grand Gearjammer.** A sleeve at the rear pivot has three rings. It stays on `cart`, because this machine part is rigid. The flash spike roots move 0.002 away from the shared root, so the separate cones do not weld into a crossed island. The cart gaps are designed gaps. `posedPairs` names the three crew arm pairs: each crew member sits away from the center of the cart, and two right arms hold different props.

## Source Contracts

- **amberwing-dart.** `min[1]`: 0.008207070124 → 0.007401826599. The fixed vine frame and thicker stem change its ground bound. Bone count: 16. All 7 clip digests and durations stay the same.
- **boss-snikkit.** No value changed. Bone count: 16. All 8 clip digests and durations stay the same.
- **junk-walker.** `min[2]`: -0.274834752083 → -0.247912034392. The round return pipe does not reach as far back. Bone count: 23. All 8 clip digests and durations stay the same.
- **rocket-barrel-rider.** No value changed. Bone count: 24. All 8 clip digests and durations stay the same.
- **grand-gearjammer.** No value changed. Bone count: 22. All 8 clip digests and durations stay the same.

Each pack used the shared file lock. No all-unit pack or contract recording command was run.

## First fix pass margins and pending Turnarounds

The palette limit is 5. All five units have at least 0.3 of delta-E margin. The largest region box error is no larger than 0.005, against a limit of 0.04. All tested closed islands have zero inside vertices. Grand Gearjammer has the required three rings at the rigid cart pivot.

At the first fix pass, the pending Turnarounds were measured without admission. `draft-interior.json` records these checks and the hashes of the two drawing views. These records do not replace `gates.json` or give approval. The interior limit is 0.28, and at least 100 shared cells are required in each band.

| Unit | Draft interior result | Largest difference | Remaining band problems |
| --- | --- | --- | --- |
| [amberwing-dart](amberwing-dart/2026-11-07/draft-interior.json) | pass | 0.278224 | None |
| [boss-snikkit](boss-snikkit/2026-11-07/draft-interior.json) | pass | 0.275179 | None |
| [junk-walker](junk-walker/2026-11-07/draft-interior.json) | fail | 0.286605 | front head: fail, 0.286605, 595 cells |
| [rocket-barrel-rider](rocket-barrel-rider/2026-11-07/draft-interior.json) | pass | 0.272062 | None |
| grand-gearjammer | No views at the time of this check | — | No measurement |

These draft results are from before approval and the later model changes. The interior-difference section below has the final results. No CI pass is claimed here.

## First fix pass validation

- The five Unit Specs, pack checks, Source Contract checks and clip checks pass.
- Each capture check passes: 19 images, no console error.
- All 10 Review Gates that need no admitted Turnaround pass for each unit.
- The Turnaround admission check was called through its read-only `admissionOf` function. The CLI writes `admission.json` in the other agent's folder, so this work did not call it. The same view, palette, size, fill, prop and approval checks were used. No unit had admission at that first pass.
- Python suite: 175 tests, 2 skipped; passes.
- `bun test scripts --timeout 30000`: 184 tests pass.
- `bun run web:test:unit unit-model`: 129 tests pass.
- `bun run lint`: fails only on `apps/web/art/units/reference/amberwing-dart/turnaround.json`. This file belongs to the image agent and was not edited.

## Files changed

For each of the five units, the files are `scripts/unit-model/<unit>.py`, `scripts/unit-model/specs/<unit>.json`, `apps/web/art/units/raw/<unit>.glb`, `apps/web/public/models/units/<unit>.glb`, and `artifacts/unit-model-review/<unit>/2026-11-07/`.

The shared Source Contract has the two bound changes listed above. This record is linked from `gates-pass.md` and the Machine and Structure Migration section of `scripts/unit-model/README.md`. The other agent's changes in the shared checkout are outside this record.

## interior-difference

The approved Turnarounds are the targets for this pass. The limit stays at 0.28, with at least 100 shared cells per band. Every final band is below 0.26. The largest value is Junk Walker front head, at 0.258533, which gives 0.021467 of margin to the gate limit. Linux rendering was not run.

Each cell gives **before → after**. Before is the local run at the start of this pass, after Turnaround approval and before these model edits. After is the final local run on 2026-11-07.

| Unit | Front head | Front torso | Front legs | Back head | Back torso | Back legs | Final Review Gates |
| --- | --- | --- | --- | --- | --- | --- | --- |
| junk-walker | 0.286605 → 0.258533 | 0.208136 → 0.214475 | 0.205937 → 0.190952 | 0.228209 → 0.240454 | 0.194942 → 0.216162 | 0.193416 → 0.186147 | 11 of 11 pass |
| rocket-barrel-rider | 0.229302 → 0.229302 | 0.235838 → 0.235838 | 0.193430 → 0.193430 | 0.283472 → 0.242225 | 0.173978 → 0.178538 | 0.205892 → 0.205892 | 11 of 11 pass |
| grand-gearjammer | error (0 cells) → 0.146681 | 0.223610 → 0.215494 | 0.144931 → 0.144955 | error (0 cells) → 0.149578 | 0.263594 → 0.244635 | 0.143676 → 0.143773 | 11 of 11 pass |
| amberwing-dart | 0.236273 → 0.213932 | 0.278224 → 0.205648 | 0.241544 → 0.217808 | 0.242264 → 0.252839 | 0.229356 → 0.212824 | 0.273447 → 0.228980 | 11 of 11 pass |
| boss-snikkit | 0.257820 → 0.257820 | 0.275179 → 0.242946 | 0.196060 → 0.195821 | 0.257894 → 0.257894 | 0.203132 → 0.200392 | 0.176683 → 0.176683 | 11 of 11 pass |

### Model changes

- **Junk Walker.** The fluid tank moves to Blender X -0.105 and rises above the driver. The chimney moves to X +0.085. These positions follow the approved front and back views. A broad riveted cap and brass lip replace the pointed tank cap. The driver has a raised white forelock. Hair alone did not fix the band: its front head value stayed at 0.2867. The taller tank reached 0.2798. The tank and chimney positions reached 0.2618. The broad cap gives the final 0.2585.
- **Rocket Barrel Rider.** A rounded dark leather panel extends the back of the cap over the hair roots. The approved back view has a broad cap in this area. The front bands do not change. Back head falls from 0.283472 to 0.242225.
- **Grand Gearjammer.** A centered rear mast and brass crossbar hold two red cloth panels. The panels face front and back, as in the approved views. The old flag faced the side and stood at one side of the cart. Its projected top band had no cell in common with either approved view. The full figure defines the bands of a machine, so the band called `head` includes the banner. The new panels give 1,348 shared front cells and 1,693 shared back cells. The error came from the model silhouette. No gate fix or new gate test was needed. The larger cloth area also exposed an old saturated red to `palette`; red changes from `#b0362c` to the muted `#984b36`.
- **Amberwing Dart.** The four wing membranes are wider and turn toward the front and back views. The front wing half-width is 0.075 and the rear half-width is 0.07. The wing repair stays in place. Both trailing vines have more leaves, with broad faces visible from front and back. The main vine radius is 0.018. This gives the leaf surfaces and trailing stand of the approved views. Thin vines alone gave too much dark outline and failed back legs at 0.2895. The final leaves and stem give 0.217808 and 0.228980 in the legs bands.
- **Boss Snikkit.** Three tapered beard locks with gold bands replace the single flat white panel. The shaded beard color changes from `#c4bfb2` to `#a9987b`, with white on the lit faces. The beard now has the shaded locks of the approved front view. Front torso falls from 0.275179 to 0.242946.

The Unit Spec region boxes now record the changed geometry. Heights use the highest rest-pose point, as the spec draft tool does. The spec palettes have the banner and beard colors. The part lists, designed-hole lists, posed-pair lists and clip overrides have no new exception in this pass.

### Intentional Source Contract changes

These changes are relative to the Source Contracts at the start of this interior pass. Each pack held `/tmp/heynbord-shared.lock`. The contract recording command and all-unit pack were not run.

| Unit | Bound changes | Bones and clips |
| --- | --- | --- |
| junk-walker | `min[2]`: -0.247912034392 → -0.249196141958; `max[1]`: 0.966199994087 → 0.999600052834 | 23 bones. All 8 keyframe digests change because the chimney and its steam bone move across X. All durations stay the same. The pose methods do not change. |
| rocket-barrel-rider | None | 24 bones. All 8 digests and durations stay the same. |
| grand-gearjammer | `min[2]`: -0.429999943399 → -0.414999929875; `max[1]`: 0.929999931853 → 0.929999991458 (float rounding) | 22 bones. All 8 digests and durations stay the same. |
| amberwing-dart | `min[0]`: -0.386257918085 → -0.384476097727; `min[1]`: 0.007401826599 → 0.006088069815; `max[0]`: 0.386257866859 → 0.384476045392; `max[1]`: 0.659887758773 → 0.700182243685 | 16 bones. All 7 digests and durations stay the same. |
| boss-snikkit | None | 16 bones. All 8 digests and durations stay the same. |

### Final validation

- All five pack checks, Source Contract checks, clip checks and Unit Spec checks pass.
- All five Turnaround checks pass. The same CLI ran with the admission write blocked. It compared the generated admission JSON with the approved JSON and refused a different result. SHA-256 checks confirm that all approved files stay unchanged.
- All five captures pass: 19 images each, with no console error. One Junk Walker capture stopped when the page reloaded; the completed capture replaces it.
- All five units pass all 11 Review Gates. All 30 interior bands are below 0.26.
- TEST_RESULTS_PENDING

### Files for this pass

For each of the five units, this pass changes `scripts/unit-model/<unit>.py`, `apps/web/art/units/raw/<unit>.glb`, `apps/web/public/models/units/<unit>.glb` and `artifacts/unit-model-review/<unit>/2026-11-07/`. The Unit Specs change for Junk Walker, Grand Gearjammer, Amberwing Dart and Boss Snikkit. Rocket Barrel Rider needs no spec change. The shared Source Contract records the three units with bound changes and the Junk Walker keyframe digests. This file records the results.

The other agent's units and files are outside this pass. No file under `repos/` changed.
