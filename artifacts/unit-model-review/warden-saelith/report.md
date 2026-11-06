# Warden Saelith pilot report

Issue #179. Date: 2026-11-06. Status: **sign-off of a person is pending**.

## Result

The defect count decreased from 7 to 1, and the Review Gates went from 6 of 9 to 8 of 9. The model still does not match its approved Turnaround. The largest differences are in the costume and the bow, and no Review Gate reports them.

| Measure | Before | After |
| --- | --- | --- |
| Review Gates passed | 6 of 9 | 8 of 9 |
| Review Gates failed | 3 | 1 (`palette`) |
| Defects that a Review Gate reports | 7 | 1 |
| Differences that a person sees (not in any Review Gate) | 11 | 10 |
| Published Model (`sha256`) | `9c2e7540…` | `b80bb72e…` |

The Source Contract did not change. The file has the same content after the pack, because the bounds, the bones and the clips are the same. The change to the art is only color and rings on the old surface.

Evidence: `before/`, `after/`, `compare-views.png`, `compare-attack-20.png` and `after-walk-frames.png`.

The move onto `biped-medium` (step 3 of the issue) was done in `64bf0276` and did not change the model. The baseline has that move, so this before and after does not measure it.

## Defects from the Review Gates

The numbers 1 to 6 are from `before/defects.md`. Defect 7 was in the baseline too: `before/gates.json` has the same two values, but `defects.md` does not list them, because the coat value of 12.74 was the worst value of those regions.

| # | Review Gate | Defect | Layer | Before | After | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `self-intersection` | `bow` surface reversed: `kit.tube` wound each face inward | Kit | 73 vertices inside | 0 inside | Fixed |
| 2 | `joint-loops` | `chest`: too few rings | Kit (`cone` `loops`), build script | 1 band | 4 bands, span 0.055 | Fixed |
| 3 | `joint-loops` | `neck`: too few rings, and one bone only | Kit, build script | 1 band | 3 bands, span 0.02 | Fixed |
| 4 | `joint-loops` | `hips`: one ring, and one bone only | Kit, build script | span 0.000737 | 3 bands, span 0.04 | Fixed |
| 5 | `palette` | `torso` coat too saturated | Unit Spec, build script | delta-E 15.06 | 4.75 | Fixed |
| 6 | `palette` | `arm.L`, `arm.R` coat too saturated | Unit Spec, build script | delta-E 12.74 | 4.14 | Fixed |
| 7 | `palette` | `arm.L`, `arm.R`: amber trim and hand skin are outside the painting | Unit Spec | delta-E 5.29 | delta-E 5.29 (limit 5) | **Open** |

Other results of the fixes:

- Defect 1 had a visible result that no Review Gate described. The bow had no ink outline, and its string showed black. Both are correct now. See `compare-attack-20.png`.
- The `arrow` shaft had the same reversed surface, and it is fixed.
- Rings alone do not bend a joint. `neck` and `hips` had one bone only, so a ring there passes `joint-loops` and changes nothing. `neck_weights` and `hips_weights` now blend two bones. `walk` is not in the capture set, so I captured `walk` frames by hand: `after-walk-frames.png`. They show no tear.

### Why defect 7 is open

I stopped after 3 attempts, the limit of the correction loop. I did not change the limit of the Review Gate.

| Attempt | Change | Arms | Torso | Decision |
| --- | --- | --- | --- | --- |
| 1 | Coat color only | 5.29 | 4.75 | Kept |
| 2 | Less `shade` on the pauldrons and hands | 6.08 | 4.75 | Reverted: the cause was wrong |
| 3 | `AMBER` `#dba240` and `SKIN` `#dcab86` | 5.26 | 5.24 | Reverted: `torso` failed too |

The nearest painting colors are cells of 0.1% to 0.3% of the pixels, so a small change near the limit of `palette` can give a large change in its result. The painting has a less saturated gold than the model, so the difference is real but small. A person must accept this value or give the colors.

## Differences that no Review Gate finds

I compared the renders with the Turnaround. These are my observations, not measurements. My estimate on the scale of `self_correction.md` is 0.4 to 0.5, before and after: a person can identify the silhouette, and the structure is not complete.

| # | Difference | Turnaround or card | Model | Layer | Source Contract |
| --- | --- | --- | --- | --- | --- |
| V1 | Shoulders | Layered leaf mantle | Two round pauldrons | Unit Spec, build script | Changes |
| V2 | Back | Long cream cape with a green center panel | Green skirt with a gold hem | Unit Spec, build script | Changes |
| V3 | Hem | Leaf points and gold patterns | One smooth edge | Build script | Changes |
| V4 | Bow | Large recurve with thorns and gold tips. This is the identity feature | Thin bow, nearly straight from the front | Build script | Changes |
| V5 | Braid | From a high crown, with leaf ribbons at its end. The card names it as a silhouette hook | Beads on the back, no ribbons | Build script | Changes |
| V6 | Feet | Heeled boots | Block feet | Build script | Changes |
| V7 | Torso and sleeves | Leather bodice, cream sleeves | Green chest, green sleeves | Unit Spec, build script | No change |
| V8 | Quiver | Not on the card or in the Turnaround | Present: an invented prop | Unit Spec, build script | May change |
| V9 | Crown | Gold leaf crown at the hair knot | Ring around the head, large ears | Build script | May change |
| V10 | Waist | Not applicable | Jagged corset edge through the coat when the torso turns. The baseline has it too | Build script | No change |

Fixed: the saturated coat, which `palette` also reported.

Two more items need a decision and are not defects:

- Proportions: the Turnaround figure is about 7 heads tall, by eye. The Body Plan has 5.389. The prompts of #174 do not state the miniature proportions, so each Turnaround will have this difference.
- The arrow is hidden at rest, and the Turnaround front view shows it in the right hand. The Unit Spec records this as intentional.

Why the Review Gates pass on V1 to V10:

- `interior-difference` is at 0.262 of a limit of 0.28 with no mantle and no cape. It compares luminance only.
- `part-coverage` and `region-coverage` compare the model with the Unit Spec, and the Unit Spec records the current model.
- `palette` does not find a correct color in the wrong place, so V7 passes.

## Decisions after each pass

| Pass | Finding | Decision (`self_correction.md`) |
| --- | --- | --- |
| Kit | Reversed tube | `refine-code` |
| Joints | Too few rings, one bone | `refine-code` |
| Palette | Coat color | `refine-spec` |
| Palette | Amber and skin, 3 attempts | `stop` |
| Whole model | V1 to V10 need new parts and an art change | `request-input` |

**Deviation:** the issue says that the checklist of `forge/next.py --state` is the authority. I could not use it as the authority, and a person must accept this. Its state is in `workflow-state.json`. It raised no hard stop. It reads a sculpt spec, so it set the build steps back to pending, and its next command writes a Three.js factory, which this pipeline does not use. The steps before the build have a status: `done` with evidence, or `skipped` with a reason. The other steps stay `pending`, and it has no record of the passes. This report has that record.

## Definition of done

| Item | Status |
| --- | --- |
| The Unit Spec exists and validates | Done |
| The Turnaround is approved | Approval recorded: rifandani, 2026-11-06, with the known differences in `turnaround.json`. The sign-off below still includes it |
| The Body Plan owns the skeleton and the proportions | Partly: it owns the bones and the arm and leg joints, and the new rings read its table. The head and torso geometry still has its own numbers |
| All Review Gates pass, or each failure has a reason | Done: 8 pass, and defect 7 has its reason |
| The Source Contract is refreshed only for an intentional art change | Done: no refresh |
| The report names what changed, what is still wrong, and the cost | Done |
| A person signs off | **Pending** |

## What changed

- `unit_model_kit.py`: `tube` winds each face outward, and `cone` has `loops`.
- `warden-saelith.py`: rings at the chest, the neck and the hips, two bones at the neck and the hips, and the olive `COAT` and `COAT_DARK`.
- `specs/warden-saelith.json`: the same two colors.
- `apps/web/public/models/units/warden-saelith.glb`: packed again.
- `test_kit_geometry.py`: new tests of the kit, which run in Blender. `test_unit_spec.py`: the new coat color.
- `unit_gates.py` and `README.md`: notes only. The limit of `interior-difference` stays at 0.28, as `before/defects.md` asked for a new calibration. The head band did not change, so the seed of 0.282 for a head with no face stays valid. Warden Saelith is now at 0.262, so the margin is 0.018.

## Cost

| Cost                              | Before  | After   | Change       |
| --------------------------------- | ------- | ------- | ------------ |
| Triangles (limit 8,000)           | 3,414   | 3,590   | +176 (+5.2%) |
| Raw Export bytes                  | 365,720 | 372,412 | +1.83%       |
| Published bytes (limit 1,572,864) | 203,680 | 205,448 | +0.87%       |

| Step                                               | Measured time    |
| -------------------------------------------------- | ---------------- |
| Build, pack, capture and Review Gates, one model   | 27 s             |
| Build the 98 scripts with the kit fix, 6 processes | 37 s             |
| The fixes of the pilot, agent time                 | about 20 minutes |

The kit fix cost nothing for each model. All 98 scripts build with it, and all 98 Raw Exports match their Source Contracts. A model gets the fix when it is built and packed again.

Not measured: the time of a person for 5 Turnaround images and their approval, and the tokens of the agent. One pilot gives no defect rate for the other 97 models.

## Go/no-go decision

**Recommendation: conditional go. A person must make this decision.**

**Go** for the defect loop. It found real defects, including one that affects 93 scripts, it made no change to a Source Contract, and it is fast.

**No-go** for a Migration with "matches the Turnaround" as its result, until a person decides the art target. The pilot does not prove this result: 8 of 9 Review Gates pass, and the model is still far from the Turnaround.

Conditions before the other 97 models move:

1. Decide the art target. My recommendation is one art pass on Warden Saelith for V1, V2 and V4, as an intentional art change. It is the only way to measure the cost of that target. If the cost is too high, accept the low-detail miniature and record V1 to V6 as accepted.
2. Accept defect 7, or give the amber and skin colors. Accept the checklist deviation.
3. Decide V8: remove the quiver, or add it to the card.
4. Add the miniature proportions to the Turnaround prompts, or accept the difference.
5. Add a Review Gate that compares the silhouette with the Turnaround, if the target is the Turnaround. No current Review Gate finds V1 to V6.
6. #184 must make `unit-model:pack` read `gates.json`. Now only the exit code of the command blocks publication.

## Sign-off

A pass on a metric alone is not sign-off.

- [ ] Render (`compare-views.png`, `compare-attack-20.png`, `after/`)
- [ ] Turnaround (`apps/web/art/units/reference/warden-saelith/`)
- [ ] Report and go/no-go decision

Name: ________ Date: ________
