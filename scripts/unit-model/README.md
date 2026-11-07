# Unit Model packing

## Unit Specs

The specs are in `specs/`: the three pilots Warden Saelith, Crag Rhino and Bone Rampart, Amberwing Dart, the units that have moved in a Migration, and Rimebreath Drake, Fuse Runner, Elderreed Dartmaster, Tailsweep Basilisk and Tusk Brute. `migrations/humanoids.md` lists these units. Check them with Python 3.11 or later. Blender and Python packages are not required.

```sh
rtk bun unit-model:spec:check
rtk proxy python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'
# This fixture must exit with code 1 and report spec.clips.attack: required.
rtk bun unit-model:spec:check scripts/unit-model/fixtures/missing-clip.json
```

The default command checks every `specs/*.json` file and exits with code 0 when all pass. Pass one or more file paths to check selected specs. Each error includes its file and field path.

`unit-spec.schema.json` defines the fields, Body Plan names, the form of a part name, colors and clip slots. `unit_spec.py` checks those schema rules and the prop references. `load_spec(path)` returns a `UnitSpec` typed dictionary and raises `ValueError` on invalid data. Use it before building geometry. The loader also rejects duplicate JSON members.

The Body Plan names are `biped-small`, `biped-medium`, `biped-large`, `quadruped`, `flyer`, `machine` and `structure`. Each plan has its shared builder in `body_plans/`. The part names match the build script, including suffixes such as `.L`, `.FR` and `.0`. The `part-coverage` Review Gate compares them with the model. A prop ID must name a listed part. `hand` is `left`, `right` or `none` for a mounted prop. The left side is Blender +X. `cameraSide` identifies a prop on the right side that the player Unit camera sees.

The five required clips match `BASE_UNIT_CLIPS` in `apps/web/src/features/battle/scene/unit-clips.ts`: `idle`, `walk`, `attack`, `hurt` and `death`. The optional clips are `lowHp`, `cast`, `rebirth` and `summon`. Each pilot lists only the clips that its script builds. An empty clip object uses the Body Plan slot. An `override` names the unit's specific action, and it is the name of a `Patch` of the Clip Library.

The palettes and parts come from the build scripts. Warden Saelith includes the inline belt and arrow colors, and #179 changed her coat to the olive of the card painting. Bone Rampart's hammer is part of `skel.A.arm`. Heights include props in the rest pose: 0.985 for Warden Saelith, 0.7280354 for Crag Rhino, 1.13 for Bone Rampart and 0.6598878 for Amberwing Dart. These values agree with the bounds in `source-contracts.json`. The specs record the current models.

`bun unit-model:spec:draft <plan> <name> [name...]` writes a new Unit Spec from the build script and the Raw Export: the height, palette, parts, props, clips and `regions`. It does not replace a file. A person writes `details` and `identity`, and checks `props`.

## Packing

Keep Blender exports in `apps/web/art/units/raw`. Publish only the packed files. Git ignores this folder, except the Raw Export of each unit with a Unit Spec: see [Unit Model Review in CI](#unit-model-review-in-ci).

```sh
rtk bun run unit-model:pack warden-saelith
rtk bun run unit-model:pack --all
rtk bun test scripts/unit-model/model-check.test.ts
rtk bun run web:test:unit unit-model-pack.unit.test.ts
```

The packer applies Meshopt compression at the medium level. It checks the raw model, then checks and decodes the exact compressed bytes before publication. It retains the 1,572,864 byte, 8,000 triangle, 30 bone, one material and one image limits. Embedded images must not exceed 1024 × 1024 px. Every primitive needs compressed geometry. An extension declaration alone does not pass. The required base clips must remain present and unknown clips fail.

The current 98 models (96 cards and 2 Tokens) use vertex colors and no images. Those texture-free models need no external decoder asset. The game uses the Meshopt decoder included in its JavaScript. For a model with KTX2 images, the loader detects device support and loads the local Basis transcoder. If a model has images, its published images must use KTX2 and its textures must use `KHR_texture_basisu`. Convert such images before packing. An opaque PNG or JPEG does not pass publication checks.

On 2026-10-30 the published models decreased from 35,243,464 to 18,456,628 bytes, a reduction of 47.63%. The raw exports did not change. Tests load each published model with the game's Three.js loader and check its vertex colors and skinning attributes, then compare its bounds, skin bone counts and animation data with the committed source contract. All 96 models retained exact clip durations and keyframe data. Bounds changed by less than 0.001 scene units. Each clip produced a finite posed bound.

The packing API follows the [glTF Transform Meshopt documentation](https://gltf-transform.dev/modules/functions/functions/meshopt).

CI uses committed source contracts in `source-contracts.json`, so most checks need no Raw Export. Git has the Raw Exports of the units with a Unit Spec only. The packer refreshes the contract of each model it packs. Each contract has source bounds, skin bone counts, clip durations and a SHA-256 digest of animation track names, interpolation and keyframe data. To refresh all source contracts after an intentional art change, run:

```sh
rtk proxy bun scripts/unit-model/record-contracts.ts
rtk bunx ultracite fix scripts/unit-model/source-contracts.json
```

## Body Plans

`body_plans/` holds the shared builders. See `body_plans/README.md`. Each biped plan gives the bones, the proportion table, the arm IK, the skinning rule and the clip slots of its figures: `biped-small` for the goblins, `biped-medium` for the human, elf and undead figures, and `biped-large` for the big orcs and trolls. Fuse Runner, Warden Saelith and Tusk Brute use them. `quadruped` gives the same data for the beasts with four legs on the ground, and Crag Rhino uses it. `flyer` gives the bones of the creatures that float and the root-lift rule, and Amberwing Dart uses it. `machine` gives the layout of the carts and the walkers, and Grand Gearjammer uses it. `structure` gives the layout of the walls and the heaps, and Bone Rampart uses it.

Compare a new Raw Export with its Source Contract after a change to a build script, a Body Plan or the kit. Do this before you pack, because the packer refreshes the Source Contract. The check exits with code 1 on a difference.

```sh
rtk proxy /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/unit-model/warden-saelith.py
rtk bun unit-model:contract:check warden-saelith
rtk bun unit-model:contract:check --all
rtk bun test scripts/unit-model/source-contract.test.ts
```

## Clip Library

`clips/` holds the 9 base clips of each Body Plan and the override layer. A unit subclasses the `Poses` of its plan and names each change in a `Patch`. See `clips/README.md`. One unit of each plan moved first: Warden Saelith, Fuse Runner, Tusk Brute, Crag Rhino, Amberwing Dart, Grand Gearjammer and Bone Rampart. `migrations/humanoids.md` lists the units that moved after them.

```sh
bun unit-model:clips:check warden-saelith [name...]  # loop closure, pose return, hip return, ground and binding
bun unit-model:clips:check --all
```

## Turnarounds

A Turnaround is the target for every side of a Unit Model: front, three-quarter, side and back views, and a detail sheet. The card painting shows one side only.

```sh
rtk bun unit-model:turnaround:prompts            # 98 prompt files, or give the names
rtk bun unit-model:turnaround:export crag-rhino  # 5 PNG files to 5 WebP files
rtk bun unit-model:turnaround:check              # the reference admission gate
rtk bun test scripts/unit-model/turnaround
```

1. Run the prompt command. Each file is in `apps/web/art/units/raw/turnaround/<name>/prompts.md`. Git ignores this folder.
2. Attach the card painting and send the prompts. Save each image next to its prompt file, with the name in the heading of its prompt.
3. Run the export command. It writes 600 × 800 WebP files to `apps/web/art/units/reference/<name>/`, and it adds a pending `turnaround.json`. Git keeps this folder. A new export does not change an existing record.
4. A person looks at the 5 views against the card painting, then edits `turnaround.json`:
   - Set `approval.status` to `approved` or `rejected`, and set `by`, `date` and `notes`.
   - List in `props` each prop that the views show. Use the words of the Props row of that card in `docs/game/10-card-concepts.md`.
5. Run the gate. It writes `admission.json` in the folder and exits 1 on a failure. A unit with no folder passes until its Migration issue.

The gate fails on a missing view, a view that is not 600 × 800, a background that is not flat, a palette outside the card painting, a figure that does not fill the frame, an approval that is not complete, an empty `props` list, and a prop that is not in the Props row. A pixel check cannot find a prop, so the gate checks the list of the person who approves. The palette check measures the full figure, so it finds a large color change and not one small wrong detail. It also cannot separate two muted palettes: the Crag Rhino views pass against the Bone Rampart painting. The person who approves must find these errors.

## Review Scene

The Review Scene captures a Unit Model from fixed cameras on the Battle light, with the real toon material and ink outline. Every model gets the same distance, FOV, near, far, DPR and canvas size. No camera reads the bounds of a model.

```sh
cd apps/web && bunx vite --port 4100 --strictPort      # /master-design is only in a dev server
rtk bun run unit-model:review warden-saelith [name...] # from the repo root, in a second shell
rtk bun test scripts/unit-model/review
```

The command writes `artifacts/unit-model-review/<name>/<date>/`: 19 PNG files of 1920 × 1080, `manifest.json` and the Review Gate record `review-gate.json`. It exits 1 if the Review Gate fails. The Review Gate requires every capture and no browser console error. Each image must decode at the correct size. Each image, the card painting and the GLB must match the hash in the manifest. `render_bridge.py validate` of the img2threejs skill can read the same manifest.

| Capture | Azimuth | Elevation | Distance |
| --- | --- | --- | --- |
| `front`, `right`, `back`, `left` | 0, 90, 180, 270 | 0 | 4.2 |
| `battle` | the Battle camera | the Battle camera | the Battle camera |
| `close-up` | `identity.azimuthDegrees` of the Unit Spec | the Battle camera | 2.6 |
| `idle`, `attack`, `death` at 0, 50 and 100% of the clip | as `front` | as `front` | as `front` |
| `front-cutout`, `right-cutout`, `back-cutout`, `left-cutout` | as its view | as its view | as its view |

Azimuth 0 is the front of the model, and it does not include the Battle turn of the model. Azimuth 90 is the Blender right view: the camera is on the right side of the viewer, so it sees the left side of the model.

The Unit Spec gives the close-up: `identity.feature` names the feature, and `identity.azimuthDegrees` turns the camera to it. A model needs a Unit Spec and a card painting before it can have a Review Scene. The Unit Spec gives the azimuth as 0 to below 360.

`/master-design?review=<name>` opens the scene with a paused clock. `window.__IMG2THREEJS_CAPTURE__` then has `setCamera` and `capturePass`. This scene has 2 passes, and `capturePass` rejects other passes. `beauty` is the view on the Battle Painting. `cutout` is the same figure with no painting and no shadow, on transparent pixels. A Review Gate cannot find the figure on the painting, because the painting fills the frame.

## Review Gates

A deterministic check blocks a Unit Model from publication. There is one Review Gate for each question, and one record in `gates.json`.

```sh
rtk bun run unit-model:review warden-saelith  # first, with the dev server
rtk bun run unit-model:gates warden-saelith [name...] [--date 2026-11-06]
rtk bun test scripts/unit-model/review
```

Each Review Gate exits 0 clean, 1 fail or 2 error. A fail blocks publication. An error is not a pass: a missing input gives an error. The command exits with the highest code, and it writes `artifacts/unit-model-review/<name>/<date>/gates.json`. It reads the latest capture, or the capture of `--date`. Python 3.11 or later is necessary, with no packages.

| Review Gate | Question | Reads | Limit |
| --- | --- | --- | --- |
| `turntable` | Are all four views present, and is there a hole through a part? | cutouts, parts | no missing view, no collapsed view, no hole through one part or through the body |
| `interior-difference` | What differs from the Turnaround inside the silhouette, banded by height? | front and back cutouts, Turnaround, `bodyPlan`, `_REGION` | 0.28 for the head, the torso and the legs, on 100 cells or more in each band. On a biped, the bands start at the top of the head, not at the top of a raised prop |
| `self-intersection` | Does a closed island of the mesh cross itself? | closed islands | no vertex inside its own island |
| `joint-loops` | Is there enough geometry at each joint? | all vertices, bones | 3 bands of vertices, over 0.25 of the search radius. On `hips`, `spine`, `chest` and `neck`, a band can be 0.12 of the height from the bone |
| `attachment-anchor` | Is each prop on the bone that the Unit Spec names? | parts, skin, `props[].bone` | 0.15 of the height, and the prop follows the bone |
| `region-coverage` | Is each Body Region where the Unit Spec says? | `_REGION`, `regions` | 0.04 of the frame of the model, at azimuth 0 |
| `chirality` | Is each left and right pair a reflection, not a rotation? | parts, bones, `posedPairs` | exact mirror, or a pair in `posedPairs` that is not a rotation |
| `palette` | Is each region within delta-E 5 of the card painting? | vertex colors, card painting | CIEDE2000 of 5 |
| `part-coverage` | Is every part of the Unit Spec present? | `_PART`, `parts` | no missing part |
| `ground-contact` | Is each part of a flyer on or above the ground at rest? | `_PART`, `bodyPlan`, `flying`, rest-pose vertices | no part below 0, with a tolerance of 0.000001 |
| `foot-bones` | Does each big piece of a structure stand on a foot bone and fall in death? | `bodyPlan`, `footBones`, vertices, `death` clip | the bone within 0.03 of the lowest point of its piece, and a tilt of 45 degrees or more |

`ground-contact` reads a Unit Spec with `bodyPlan` `flyer`, or with `flying` set to true. Set `flying` on a figure that has a biped Body Plan and the Flying Keyword. For other Unit Specs it passes with `applies` set to false, because a foot on the ground can sink a small distance. The game puts the lowest point of the rest pose on the ground, so a part below the ground lifts the whole model.

`foot-bones` reads a Unit Spec with `bodyPlan` `structure`. For other Unit Specs it passes with `applies` set to false. `review/death-pose.ts` reads the last key of the `death` clip in the Raw Export. A turn about the bone is not a tilt, so a piece that only spins does not pass. `body_plans/README.md` has the record of each foot bone.

`review/vendor/` has the source of the Review Gates from the img2threejs skill, and `SOURCE.json` records the commit. `gates.ts` makes the input of each Review Gate. `unit_gates.py` has the Review Gates that need more than a source command. `mesh-export.ts` splits the Raw Export into parts and islands, and `gates.ts` writes the result in `gate-inputs/meshes.json`. Git ignores `gate-inputs/`.

The kit writes the id of each part in the `_PART` vertex attribute, and the part names in the `unitParts` extra of the mesh node. The packer removes both, and `checkUnitModel` rejects a Published Model with `_PART`. A Raw Export from before this data gives an error: run its build script again.

The Review Gates of the mesh read the Raw Export, because only it has the part and region data. The cutouts show the Published Model. So the run also checks that they are one model, and a difference gives exit code 2. The manifest gives the hashes. The Source Contract gives the bounds, bones and clips. The run also compares the triangles, the vertices and the mean vertex color of the 2 files, with a limit of 0.001 on each color channel. So it finds a new color on a large part, and not always on a very small part.

`unit-model:pack` does not read `gates.json`. A capture reads the Published Model, so a model must be packed before its Review Gates can run. The Unit Model Review uses the exit code of this command to stop a failed model before it gets to `main`.

No Review Gate has the four-tier review of `divine_eye_microscope.md`. It needs ID, depth and zoom passes that the Review Scene does not have. Its main rule does apply here: there is no global score, so a fail of one Review Gate fails the run.

The Unit Spec gives 3 inputs:

- `props[].bone` is the bone that holds each prop.
- `regions` is a box from 0 to 1 for each region in the frame of the model, with y0 at the top. With no `regions`, `region-coverage` gives an error.
- `holedParts` lists the parts with a hole by design, such as the tiara. `body` is the silhouette with no props: list it for an arm that closes a gap against the torso.
- `posedPairs` lists the pairs that a figure holds differently at rest, with no suffix, for example `forearm`. The shield arm of Shieldbearer is an example.

Each unit of a Migration has `regions`. The values of Warden Saelith are rounded measures of the model. `test_unit_spec.py` compares the heights of her head, arms and legs with her Body Plan table, and the sides of her arms and legs. The table does not give the other edges, for example the braid in the `head` box. They find a change, as a Source Contract does. They do not prove that the first value is good, so a person must approve them.

What each Review Gate cannot see:

- `turntable`: The source hole test reads the full silhouette. It reports correct gaps, such as the space between a bow and its string. So `turntable` tests the silhouette of each part, and the silhouette of the body with no props. It does not find a wrong gap that a prop closes. `gates.json` keeps the source result in `holed`.
- `interior-difference`: The model is compared with a painted target, not with an earlier render, so the value does not go to 0. The limit is thin: Warden Saelith is at 0.270, and a head with no face is at 0.282. It measures luminance only, and it does not find a missing part of the costume: her model passed before it had a mantle and a cape. On a biped, the head top is the highest figure pixel near the median column of the silhouette, and `gates.json` keeps the removed share of each image in `bodies`. The Turnaround always gets this cut, because it has no regions. The render gets it only when a part of the Raw Export is above the `head` region. So a prop directly above the head stays in the bands, and tall hair at the side of a painted head can move its bands by a small distance. Another Body Plan uses the full figure, so a prop on a beast or a structure stays in its bands. The bands stay shares of the height: a head that is larger in the Turnaround than in the model does not align exactly. A band with fewer than 100 cells gives an error, and the record keeps its value.
- `self-intersection`: A ray test needs a closed shape. The record lists the open islands in `openIslandsNotTested`. A reversed surface reads as inside itself, so it also finds this.
- `joint-loops`: A joint needs a child bone, because a glTF bone has no tail. The record lists the other bones in `bonesWithNoTip`. It counts bands of vertices, not true edge loops.
- `chirality`: A pair that is wrong the same way on both sides is still a mirror of itself. A pair in `posedPairs` has no test of its shape.
- `palette`: The card painting has a full scene behind the figure, and no region masks. So it asks if each main color of a region is a color of the painting. A main color has at least 10% of the vertices of the region, so a small detail has no test. It finds a wrong coat color. It does not find a correct color in the wrong place. Browns are in most paintings, so only a saturated color separates well.
- `part-coverage`: It proves that the model has what the Unit Spec lists, and not that the Unit Spec lists enough.

## Unit Model Review in CI

`.github/workflows/unit-model-review.yml` reviews each Unit Model that a pull request changes.

```sh
rtk bun run unit-model:changed --base main       # the names, as a JSON array
rtk bun run unit-model:pack:check warden-saelith # writes nothing
rtk bun test scripts/unit-model/review/changed.test.ts
```

A unit changes when its build script, Unit Spec, Turnaround, Raw Export or Published Model changes. For each unit, one job runs these steps in sequence: the Unit Spec check, the pack check, the Source Contract check, the Turnaround check, the capture and the Review Gates. Any exit code that is not 0 fails the job, so an error is not a pass. The job uploads the `artifacts/unit-model-review/<name>/<date>/` folder of that run as `unit-model-review-<name>`, with no `gate-inputs/`. A step that fails stops the job, so an early failure gives no `gates.json`.

The `Unit Model Review` job gives one result for the full pull request. The workflow has no `paths` filter, so this job also passes when no unit changed. Make this job the required status check of `main`. With no required check, a failed run does not block a merge.

CI does not build a model. A build on Linux gives other float values, about 1e-7 in the bounds, so each clip digest changes. Amberwing Dart also gets another vertex count. So each unit with a Unit Spec has its Raw Export in git, and the Mac of the author makes that file.

- For a new Unit Spec, add an exception for its Raw Export to `.gitignore`.
- After a change to a build script, the kit, a Body Plan or the Clip Library, build each unit again.
- Commit the new Raw Export with the pack.

CI does not find a Raw Export that is older than its build script. The Published Model then does not change either, so the game does not get the change.

A unit with its own change and no Unit Spec fails, because it has no Review Scene. A new pack of such a unit also fails. A unit with a Unit Spec but no `regions` fails, because `region-coverage` gives an error. Warden Saelith and the 6 units of the [gate fix record](../../artifacts/unit-model-review/gates-pass.md) pass all the gates now. The five units of humanoid Batch 1 also pass all 11 Review Gates. Rimebreath Drake, Fuse Runner, Elderreed Dartmaster, Tailsweep Basilisk and Tusk Brute now have Unit Specs and approved Turnarounds, and they pass all 11 Review Gates: see the [Unit Spec fix record](../../artifacts/unit-model-review/specs-pass.md). Amberwing Dart and the four machines also pass all 11: see the [machine gate fix record](../../artifacts/unit-model-review/machines-pass.md). Each other unit needs its Migration before a pull request can change it.

## Warden Saelith rebuild

Warden Saelith is the first model through the full pipeline. `artifacts/unit-model-review/warden-saelith/` has three captures: `before/`, `after/` for the gate pass, and `art-pass/` for the final model. `report.md` has the defect table and the go/no-go decision.

`unit-model:gates` with no `--date` reads only a folder with a date, so run `unit-model:review` first. Do not run the Review Gates with `--date before`: they read the current Raw Export, so they replace the baseline with data of the current model.

## Kit geometry

`kit.tube` now winds each face outward. An earlier Raw Export has a reversed surface, so its ink outline does not show. Each build script gets the fix when it is built again. A rebuild of the 98 scripts changes no Source Contract.

`kit.sheet` faces the side that its grid order gives, and `self-intersection` does not read an open sheet. A grid with its columns in the wrong order has the same fault as the old `kit.tube`. `warden-saelith.py` reverses the columns of the outer `skirt`.

`kit.cone` has `loops`: a ring at each share of its length. `kit.shares` changes heights to these shares. A ring does not change the shape, so it does not change a Source Contract. A ring bends only if its vertices have a blend of two bones. `plan.neck_weights(table)` and `plan.hips_weights(table)` give these blends. The tests of the kit need Blender:

```sh
rtk proxy /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/unit-model/test_kit_geometry.py
```

## Body Regions

`unit_model_kit.py` gives each part one Body Region before the join, so a Review Gate can name an area of the one joined mesh. The fixed list is `head`, `torso`, `arm.L`, `arm.R`, `leg.L`, `leg.R`, `prop`, `base` and `effect`. The list is in `regions.json`, and the Python and TypeScript code read it. An id is a position in the list + 1, so an id of 0 means that a vertex has no region. `unit_regions.py` finds the region of a part, and it does not need Blender.

A part gets its region from the words of its name, then from the words of its main bone, and then it gets `torso`. A part with a wrong result sets it: `Part("club", CLUB, "tail.4", region="torso")`.

The export writes the id in the `_REGION` vertex attribute. The packer stops if a Raw Export has a vertex with no region, and it removes the attribute before compression. `checkUnitModel` rejects a Published Model that has the attribute. After a change to the kit, run the build scripts in Blender again.

```sh
rtk bun test scripts/unit-model/region.test.ts
python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'
```

CI runs these tests on the Raw Exports in git. On 2026-11-05 the 98 Raw Exports grew from 35,765,700 to 36,914,896 bytes (3.21%), and their packed total changed from 18,738,980 to 18,738,092 bytes (-0.005%). The largest change for one model was 0.32%. The 98 Published Models were not published again, because their vertex data and rig do not change. Blender writes the vertices in a different order on each build, so a Raw Export does not repeat byte for byte. The clips and the Source Contracts do repeat.

## Beast Migration

Issue #186 starts with Crag Rhino, Gorehorn Red Maw, Old Frostmaw, Woolly Mammoth and Cave Bear. The [batch report](../../artifacts/unit-model-review/migration-beasts/report.md) has the inventory, before and after gates, intentional clip changes and the [draft Turnarounds](../../artifacts/unit-model-review/migration-beasts/turnarounds.png). The four new Turnarounds have human approval and pass intake. The [gate fix record](../../artifacts/unit-model-review/gates-pass.md) has the fixes after which all 5 units pass the Review Gates on a local run. Later batches stay pending.

## Machine and Structure Migration

Issue #187 starts with the four machines and Bone Rampart. Boss Snikkit, Junk Walker and Rocket Barrel Rider moved to the `machine` plan, and `bun unit-model:contract:check` passed after each move. Then their defect fixes changed some clips and the bones of Boss Snikkit, as the report records. Grand Gearjammer got a Unit Spec. The [batch report](../../artifacts/unit-model-review/migration-machines-structures/report.md) has the inventory, the before and after gates, the intentional clip changes and the reason that the batch stops: `palette` fails on all five units, and the four machines have no Turnaround. Bone Rampart now passes the Review Gates on a local run: see the [gate fix record](../../artifacts/unit-model-review/gates-pass.md). The [machine gate fix record](../../artifacts/unit-model-review/machines-pass.md) has the later fixes for Amberwing Dart and the four machines. Their Turnarounds are approved, and each unit now passes all 11 Review Gates on a local run.

`attachment-anchor` measures from the bone to the nearest point on the triangles of the prop, not to the nearest vertex. A long pole has vertices at its ends only, so the old measure failed a banner held at its middle.
