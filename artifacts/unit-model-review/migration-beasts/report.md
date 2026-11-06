# Beast Migration: batch 1

Issue [#186](https://github.com/rifandani/heynbord/issues/186). Date: 2026-11-06.

**Status: batch 1 stopped. Issue 186 is not complete.** Four scripts moved to the quadruped Body Plan and the Clip Library. Crag Rhino was already on both. The batch has model gate failures, and four Turnarounds need a person's approval. No later batch started.

## Inventory

The lists come from the surveys in `scripts/unit-model/body_plans/README.md`. They describe the current skeleton, not only the animal's appearance.

| Batch | Unit | Body Plan | Status |
| --- | --- | --- | --- |
| 1 | Crag Rhino | quadruped | Already on the plan and library; region boxes added |
| 1 | Gorehorn Red Maw | quadruped | Moved; gates fail |
| 1 | Old Frostmaw | quadruped | Moved; gates fail |
| 1 | Woolly Mammoth | quadruped | Moved; gates fail |
| 1 | Cave Bear | quadruped | Moved; gates fail |
| 2 | Bristleback Boar | quadruped | Pending |
| 2 | Crag Lizard | quadruped | Pending |
| 2 | Frost Elk Matriarch | quadruped | Pending |
| 2 | Frostfang Lynx | quadruped | Pending |
| 2 | Tailsweep Basilisk | quadruped | Pending |
| 3 | Winter Maw | quadruped | Pending |
| 3 | Amberwing Dart | flyer | Already on the plan and library; Migration pending |
| 3 | Rimebreath Drake | flyer | Pending; survey finds snow below the ground at rest |
| 3 | Restless Wisp | flyer | Pending |

The last batch has four units. These three four-legged models need a plan extension before they can move: Boulder Tortoise has no hips, spine or lower-leg chain; River Knight and Pale Galloper have a mount and rider. Do not assign them to `quadruped` merely to pass the Unit Spec validator.

Four Flying figures have biped skeletons. Their scripts belong to humanoid Migration [#185](https://github.com/rifandani/heynbord/issues/185): Skyreaver (`biped-large`), Canopy Skirmisher, Fernwing Courier and Seedwind Shepherd (`biped-medium`). Their Unit Specs must set `flying: true`, and their clips must use the flyer root-lift rule. Their ground-contact results remain pending. Web Spitter has eight legs and is outside the quadruped and flyer scope.

## Turnaround intake

[#174](https://github.com/rifandani/heynbord/issues/174) supplies the tools. Its maintainer comment moves pilot art and approval to [#195](https://github.com/rifandani/heynbord/issues/195). That issue covers Warden Saelith, Crag Rhino and Bone Rampart only. The other beast Turnarounds remain a requirement of #186.

`turnarounds.png` shows each card painting and the five draft views. The four new folders are `apps/web/art/units/reference/<name>/`. Each has five 600 by 800 WebP files and a pending `turnaround.json`. The approval name, date and prop list are empty. No approval was invented.

The built-in imagegen tool made the drafts from the card paintings. `prompts/` keeps the repository prompt set. The generation added these instructions: preserve each card's subject and colors; use a large-headed tabletop miniature; infer hidden sides conservatively; show no scene items. The detail-sheet correction gives each of four isolated details a grey margin, with no rectangular crop at an image edge. Cave Bear's honey appears only at the mouth. Old Frostmaw's scales stay near white. Gorehorn's last correction reduces the bright red fur highlights to the front draft's palette.

All twenty images pass the admission image checks: size, flat background, palette and fill. The admission command still exits 1 for each new set because a person must approve it and list its props. Crag Rhino keeps its existing approved Turnaround.

A person must check the inferred sides, the size of the head, the props and cross-view consistency. These drafts do not prove unseen anatomy. In the Mammoth reference the nest is on the upper back; the current model has it on the head. This is still an art difference.

## Changes

- The quadruped plan supplies the spine, neck chain, leg order, mirrored joints and skin checks. Per-unit values remain explicit. Jaw, ear, tail, trunk, bird and effect bones stay with their unit.
- The Clip Library supplies construction, base timing and common roles. Unit patches keep each action's timing and pose values. Old Frostmaw keeps a 28-frame sparse walk, Mammoth a 32-frame walk, and Cave Bear a 28-frame walk.
- Four new Unit Specs list the current parts, colors, clip overrides and measured region boxes. Crag Rhino gets region boxes. These boxes detect a later change; they do not approve the present art.
- Raw Exports are retained for the four new specs, so CI can check them without rebuilding on Linux.

## Defects fixed

| Defect | Owner | Change | Regression check |
| --- | --- | --- | --- |
| Mammoth's legs do not walk | Unit clip | The old `result.update(legs(...))` put names such as `upper__FL` into the pose. The baker ignored them. The library gives valid bone names, so all four legs now step | The game loader plays the published walk and requires each upper leg to turn by more than 5 degrees |
| Gorehorn sinks during death | Unit clip | The buckle moves the hips down by 0.01 instead of 0.12 | The published model must pass the existing clip checks, including ground depth |
| A prop and bone with the same name fail as a cycle | Review Gate adapter | Bone IDs have a `bone:` prefix in the source gate's ID map and measured positions. Part IDs stay separate | A part named `staff`, bound to bone `staff`, passes the attachment gate; wrong attachments still fail |

The Mammoth test failed on the old published walk before the corrected pack. The Gorehorn clip test failed at death frame 14, at 0.18265 of model height against the unchanged limit of 0.06. The attachment test failed before the adapter fix.

## Source Contract

The initial commit was `8b2edc31bcf462b4ebe5b8a0758afeaeabbb9432`. The baseline uses its four build scripts with the current kit, so its Raw Exports have the part data that the Review Gates need. Each baseline build matched its original Source Contract before packing.

Only two intentional animation changes refresh a Source Contract: Gorehorn `death` and Mammoth `walk`. Bones, rest bounds, durations and the other clip digests must stay unchanged. Cave Bear and Old Frostmaw must retain their full Source Contracts.

## Batch gate record

The before and after folders are `artifacts/unit-model-review/<name>/issue-186-before/` and `issue-186-after/`. Each has the captures, manifest and gate records. The before adapter is the version from before the bone-name fix. The before Crag Rhino spec has no region boxes. The four other specs are new and their measured boxes apply to the baseline too.

The table below gives the final local results.

| Unit | Plan | Before | After | Defects fixed |
| --- | --- | --- | --- | --- |
| crag-rhino | quadruped | 6 pass, 4 fail, 1 error | 7 pass, 4 fail, 0 error | Region boxes supplied |
| gorehorn-red-maw | quadruped | 7 pass, 3 fail, 1 error | 7 pass, 3 fail, 1 error | Death ground contact fixed; clip checks pass |
| old-frostmaw | quadruped | 7 pass, 3 fail, 1 error | 7 pass, 3 fail, 1 error | Contract preserved; prop art still differs |
| woolly-mammoth | quadruped | 7 pass, 3 fail, 1 error | 8 pass, 2 fail, 1 error | Leg movement fixed; false attachment cycle fixed |
| cave-bear | quadruped | 7 pass, 3 fail, 1 error | 7 pass, 3 fail, 1 error | Contract preserved |

All eleven gates ran for each unit. `ground-contact` and `foot-bones` pass with `applies: false` for this quadruped batch; these are not flyer or structure results. All ten capture runs passed the manifest check. There are no source-input mismatches in the final gate records. `batch.json` keeps the per-gate statuses.

The repeated `palette` failures and the repeated `chirality` failures stop the batch. Joint-loop failures repeat on Gorehorn and Old Frostmaw. Their owning unit geometry and palette need correction against approved targets before batch 2. The shared attachment-name defect is fixed. A pass on the clip tests does not pass the model Review Gates.

Remaining model failures:

- Crag Rhino: gaps within the plates, fur and shield; the shield is too far from its head anchor; asymmetry; palette. Its region boxes now pass.
- Gorehorn: too few bands at the spine and head joints; asymmetry; head palette.
- Old Frostmaw: too few bands at neck and head joints; its hanging prop is too far from the jaw anchor; palette. The current model calls the prop a bell, while the card brief calls for a small hunting horn. The draft Turnaround has been corrected to the horn.
- Mammoth: asymmetry and palette. The attachment gate now passes. The nest is still on the head of the model, rather than the upper back of the painting.
- Cave Bear: self-intersection, asymmetry and palette.
- The four new units: `interior-difference` is an error until their Turnarounds are approved and admitted. An error is not a pass.

## Validation

- `bun run typecheck`: passed.
- `bun run test:unit:cov`: 214 files passed; 3,625 tests passed, one skipped. Coverage passed its floors.
- Python Unit Model suite: 174 tests, 173 passed, one skipped because it needs Blender. The first run found the Unit Spec command test's old inventory; the expected list now includes the four new specs.
- The five Unit Specs validate. The five pack checks pass. The five published models pass all clip checks.
- Source Contract comparison: Old Frostmaw and Cave Bear unchanged; only Gorehorn `death` and Mammoth `walk` changed. Bounds, bone counts and clip durations stayed the same.
- The first full `bun test scripts` run hit five 5-second timeouts while other CPU-heavy checks ran. The rerun uses `--timeout 30000`; its result is recorded below.
- `code-review.md`: Standards has no findings. Spec has two known incomplete requirements: human approvals, and passing gates plus the later batches.

These local checks do not supply a green CI run. No PR was created or pushed in this task, and no issue was closed. Model Review Gates will still block the batch in CI.

## Next decision

A person must review all five views of each of the four new Turnarounds, approve or reject each set, and list the visible props using the card brief's words. Candidate prop lists for review are `red light threads` for Gorehorn, `hunting horn` for Old Frostmaw, `fence` for Mammoth, and `honeycomb` for Cave Bear. These are proposals only; the approval records and prop lists remain empty.

After admission, correct the remaining model defects at their owning layer and run this batch again. Start no later batch until this one passes. The flyer Migration and its ground-contact results remain pending.

Final script suite: `bun test scripts --timeout 30000` passed all 171 tests across 12 files. `tests-scripts.log` has the output. All four final Turnaround sets pass the image checks; only human approval and the human prop lists block admission.

The evidence was captured in the shared working tree, which also had other in-progress changes. This commit includes only the beast Migration and its attachment adapter fix. It does not include the other task's humanoid, design or gate changes.

Final lint: `bun run lint` passed. `git diff --check` and the staged diff check passed.

A check of the staged files alone found that the original schema enum lacked 22 part names used by the new beasts. The commit adds only those names to the enum. It leaves the other task's general part-name pattern change outside this commit. The staged Python suite then passed 168 tests, with one Blender-only test skipped. `tests-staged-python.log` keeps that result.
