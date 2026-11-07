# Warden Saelith pilot report

Issue #179. Date: 2026-11-06. Status: **go decision recorded. The sign-off of the render, the Turnaround, the report and the `regions` boxes is pending**.

## Result

The pilot had two passes. The gate pass fixed what the Review Gates report. The art pass is an intentional art change for the mantle, the cape and the bow, and it also removed the quiver.

| Measure | Before | After the gate pass | After the art pass |
| --- | --- | --- | --- |
| Review Gates passed | 6 of 9 | 8 of 9 | 9 of 9 |
| Defects that a Review Gate reports | 7 | 1 | 0 |
| Differences that a person sees (not in any Review Gate) | 11 | 10 | 6 |
| My estimate on the scale of `self_correction.md` | 0.4 to 0.5 | 0.4 to 0.5 | 0.55 to 0.6 |
| Published Model (`sha256`) | `9c2e7540…` | `b80bb72e…` | `29aac266…` |

The model is now closer to the Turnaround, and it is not a match. See "Still wrong" and "What 9 of 9 does not prove".

Evidence: `before/`, `after/`, `art-pass/`, `compare-views.png`, `compare-attack-20.png`, `after-walk-frames.png` and `art-pass-poses.png`.

The move onto `biped-medium` (step 3 of the issue) was done in `64bf0276` and did not change the model. The baseline has that move, so this report does not measure it.

## Decisions

On 2026-11-06 rifandani told the agent to use its recommendations for the open decisions.

| Decision | Result |
| --- | --- |
| Art target | One art pass for the mantle, the cape and the bow. Done |
| Defect 7 (arm color) | Accept it if it stays. It did not stay: the art pass removed its cause |
| Quiver | Removed. The card and the Turnaround do not show it |
| Checklist deviation | Accepted. See "Decisions after each pass" |
| Sign-off | **Not delegated.** The issue requires a person, so the boxes below stay empty |

## Defects from the Review Gates

The numbers 1 to 6 are from `before/defects.md`. Defect 7 was in the baseline too: `before/gates.json` has the same two values, but `defects.md` does not list them, because the coat value of 12.74 was the worst value of those regions.

| # | Review Gate | Defect | Layer | Before | Final | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `self-intersection` | `bow` surface reversed: `kit.tube` wound each face inward | Kit | 73 vertices inside | 0 inside | Fixed |
| 2 | `joint-loops` | `chest`: too few rings | Kit (`cone` `loops`), build script | 1 band | 4 bands | Fixed |
| 3 | `joint-loops` | `neck`: too few rings, and one bone only | Kit, build script | 1 band | 3 bands | Fixed |
| 4 | `joint-loops` | `hips`: one ring, and one bone only | Kit, build script | span 0.000737 | 3 bands, span 0.04 | Fixed |
| 5 | `palette` | `torso` coat too saturated | Unit Spec, build script | delta-E 15.06 | 4.68 | Fixed |
| 6 | `palette` | `arm.L`, `arm.R` coat too saturated | Unit Spec, build script | delta-E 12.74 | 4.88 | Fixed |
| 7 | `palette` | `arm.L`, `arm.R`: amber trim and hand skin outside the painting | Unit Spec, build script | delta-E 5.29 | 4.88 | Fixed by the art pass |

Other results of the fixes:

- Defect 1 had a visible result that no Review Gate described. The bow had no ink outline, and its string showed black. Both are correct now. See `compare-attack-20.png`. The `arrow` shaft had the same defect.
- The outer sheet of the `skirt` was reversed too, so the coat also had no correct ink outline. I found this in the code, not with a Review Gate: `self-intersection` does not read open sheets. It is fixed in the build script.
- Rings alone do not bend a joint. `neck` and `hips` had one bone only, so a ring there passes `joint-loops` and changes nothing. `neck_weights` and `hips_weights` now blend two bones.

### Defect 7

In the gate pass I stopped after 3 attempts, and I did not change the limit of the Review Gate.

| Attempt | Change | Arms | Torso | Decision |
| --- | --- | --- | --- | --- |
| 1 | Coat color only | 5.29 | 4.75 | Kept |
| 2 | Less `shade` on the pauldrons and hands | 6.08 | 4.75 | Reverted: the cause was wrong |
| 3 | `AMBER` `#dba240` and `SKIN` `#dcab86` | 5.26 | 5.24 | Reverted: `torso` failed too |
| Art pass | Leaves replace the amber pauldron trim | 4.88 | 4.68 | Kept |

## The art pass

| Item | Change |
| --- | --- |
| V1 mantle | 25 leaves in 3 tiers on the chest, and 10 leaves on each upper arm. The arm leaves follow the arm |
| V2 cape | A cream `cape` from the shoulders to the waist. The back of the `skirt` is now a green panel between two cream panels, with gold borders |
| V4 bow | Half length from 0.3 to 0.4, a stronger recurve, a thicker limb and 6 amber thorns. The thorns stand out to each side, so the front view shows them |
| V8 quiver | Removed |

At the Battle camera, the cream cape separates the figure from the green ground. I looked at frames of `walk`, `attack`, `cast`, `lowHp`, `summon`, `hurt` and `death`, and I found no large clip. These frames are not a Review Gate. See `art-pass-poses.png`.

The Source Contract is refreshed for this intentional art change, and only the `max` bounds changed: X from 0.250 to 0.288 for a thorn, and Z from 0.0946 to 0.0987. The bones and the 9 clip digests did not change. The first version of the bow changed all 9 digests, because it moved the string bone. The new curve keeps the brace height at 0.04, so the string bone stays in its position.

## Still wrong

These are my observations, not measurements.

| # | Difference | Turnaround or card | Model | Layer |
| --- | --- | --- | --- | --- |
| V3 | Hem | Leaf points and gold patterns | One smooth edge | Build script |
| V5 | Braid | From a high crown, with leaf ribbons at its end. The card names it as a silhouette hook | Beads on the back, no ribbons | Build script |
| V6 | Feet | Heeled boots | Block feet | Build script |
| V7 | Torso and sleeves | Leather bodice, cream sleeves | Green chest, green sleeves | Unit Spec, build script |
| V9 | Crown | Gold leaf crown at the hair knot | Ring around the head, large ears | Build script |
| V10 | Waist | Not applicable | Jagged corset edge through the coat when the torso turns. The baseline has it too | Build script |

The mantle is a simple version. Its leaves have no gold veins, and it has 3 tiers, where the Turnaround has more.

Two more items are not defects:

- Proportions: the Turnaround figure is about 7 heads tall, by eye. The Body Plan has 5.389. The prompts of #174 do not state the miniature proportions, so each Turnaround will have this difference.
- The arrow is hidden at rest, and the Turnaround front view shows it in the right hand. The Unit Spec records this as intentional.

## What 9 of 9 does not prove

- `region-coverage` passes because I measured its boxes again from the new model. The thorns made the frame wider. This finds a later change. `test_unit_spec.py` compares the head, arm and leg edges with the Body Plan, and they agree. It does not prove that the new shape is good, so a person must approve the boxes.
- `turntable` passes because `holedParts` now has `mantle`. The mantle is a ring around the chest, as the tiara is around the head. The body with no props has no hole.
- `palette` passes with a thin margin: 4.95 against 5 on the bow.
- `interior-difference` is 0.270 against a limit of 0.28, and the limit stays at 0.28. The worst band is now the front head, at 0.242 before, and the head did not change. The cause is probably the wider frame of the crop. I did not prove this. With a margin of 0.01, this Review Gate is not a strong signal, and the first version of the model passed it with no mantle and no cape.
- `self-intersection` does not read open sheets, and it reports 6: `hair#0`, `collar`, `skirt#0`, `skirt#1`, `cape` and `string`. The reversed `skirt` passed for this reason. I do not know how many of the other 97 models have a reversed sheet.
- `part-coverage` and `region-coverage` compare the model with the Unit Spec, and I changed the Unit Spec in the same pass.

## Decisions after each pass

| Pass | Finding | Decision (`self_correction.md`) |
| --- | --- | --- |
| Kit | Reversed tube | `refine-code` |
| Joints | Too few rings, one bone | `refine-code` |
| Palette | Coat color | `refine-spec` |
| Palette | Amber and skin, 3 attempts | `stop` |
| Whole model | The differences need new parts and an art change | `request-input`, then the decisions above |
| Art pass | Mantle, cape, bow, quiver | `refine-spec` and `refine-code` |
| Art pass, mantle | Thin leaves read as a fringe | `refine-code`, one time |
| Final | 9 of 9, and the differences above | `stop`: a person decides |

**Accepted deviation:** the issue says that the checklist of `forge/next.py --state` is the authority. It is not the authority here. Its state is in `workflow-state.json`. It raised no hard stop. It reads a sculpt spec, so it set the build steps back to pending, and its next command writes a Three.js factory, which this pipeline does not use. The steps before the build have a status: `done` with evidence, or `skipped` with a reason. The other steps stay `pending`, and it has no record of the passes. This report has that record.

## Definition of done

| Item | Status |
| --- | --- |
| The Unit Spec exists and validates | Done |
| The Turnaround is approved | Approval recorded: rifandani, 2026-11-06, with the known differences in `turnaround.json`. The sign-off below still includes it |
| The Body Plan owns the skeleton and the proportions | Partly: it owns the bones and the arm and leg joints, and the new rings read its table. The head and torso geometry still has its own numbers |
| All Review Gates pass, or each failure has a reason | Done: 9 of 9 |
| The Source Contract is refreshed only for an intentional art change | Done: one refresh, for the art pass |
| The report names what changed, what is still wrong, and the cost | Done |
| A person signs off | **Pending** |

## What changed

- `unit_model_kit.py`: `tube` winds each face outward, and `cone` has `loops`.
- `warden-saelith.py`: the rings, the blends of two bones, the olive coat, the `mantle`, the `cape`, the new `pauldron`, the `skirt` panels and the new bow. The `quiver` is gone.
- `specs/warden-saelith.json` and `unit-spec.schema.json`: the colors, the parts, the props, the details, `regions` and `holedParts`.
- `source-contracts.json`: the `max` bounds.
- `apps/web/public/models/units/warden-saelith.glb`: packed again.
- `test_kit_geometry.py`: new tests of the kit, which run in Blender. `test_unit_spec.py`: the new coat color, parts and props.
- `unit_gates.py` and `README.md`: notes only.

## Cost

| Cost | Before | After the gate pass | After the art pass |
| --- | --- | --- | --- |
| Triangles (limit 8,000) | 3,414 | 3,590 | 3,818 |
| Raw Export bytes | 365,720 | 372,412 | 441,636 |
| Published bytes (limit 1,572,864) | 203,680 | 205,448 | 217,288 |

From the baseline, the Published Model grew by 6.68% and the triangles by 11.8%. The Raw Export grew by 20.8%, but it does not ship.

| Step                                               | Measured time    |
| -------------------------------------------------- | ---------------- |
| Build, pack, capture and Review Gates, one model   | 26 s             |
| Build the 98 scripts with the kit fix, 6 processes | 37 s             |
| The gate pass, agent time                          | about 20 minutes |
| The art pass, agent time                           | about 6 minutes  |

The kit fix cost nothing for each model. All 98 scripts build with it, and all 98 Raw Exports matched their Source Contracts before the art pass. A model gets the fix when it is built and packed again.

Not measured: the time of a person for 5 Turnaround images and their approval, and the tokens of the agent. One pilot gives no defect rate for the other 97 models. If each model grows by 6.68%, the Published Models grow by about 1.25 MB in total. See condition 5.

## Go/no-go decision

**Decision: go, with the limits below.** rifandani accepted this recommendation on 2026-11-06.

Go with this target: the defect loop, then one art pass on the parts that give the silhouette and that the card names. The pilot measured this target, and the cost was small: 26 s for each loop, 6.68% more bytes, and one line in the Source Contract.

No-go for "matches the Turnaround" as a result. This model passes 9 of 9 and has 6 differences that a person sees.

Conditions before the other 97 models move:

1. A person signs off the items that are open below.
2. Done: the Turnaround prompts now ask for a miniature, about 4 to 6 heads tall. The 3 approved pilot Turnarounds came from the old prompts, so they keep this difference.
3. Add a check for a reversed open sheet. The `skirt` passed each Review Gate with this defect.
4. Add a Review Gate that compares the silhouette with the Turnaround. A person found each difference in this report that needed the art pass.
5. Partly done: the Battle budget passes. The largest Battle has 12,404,345 asset bytes, and the limit is 50,000,000. The 3 budget decks do not have Warden Saelith, so this run does not measure her new size. It is a projection: if all of those bytes grew by 6.68%, the total would be about 13.2 MB. Run the budget again after a Migration.
6. #184 must block a failed model from `main`. `unit-model:pack` does not read `gates.json`, because a capture needs a packed model (`52a9b079`). Now only the exit code of `unit-model:gates` reports a failure.

## Sign-off

A pass on a metric alone is not sign-off.

- [ ] Render (`compare-views.png`, `compare-attack-20.png`, `art-pass-poses.png`, `art-pass/`)
- [ ] Turnaround (`apps/web/art/units/reference/warden-saelith/`)
- [x] Go/no-go decision: go, with the limits (rifandani, 2026-11-06, by a message to the agent)
- [ ] Report
- [ ] The `regions` boxes of the Unit Spec

Name: ________ Date: ________
