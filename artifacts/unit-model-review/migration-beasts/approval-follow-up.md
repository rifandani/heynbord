# Approved Turnarounds and paired geometry

On 2026-11-06, rifandani approved all four Turnarounds and the proposed prop lists by a message to the agent. The approval records now have the person, date and visible props. `bun unit-model:turnaround:check gorehorn-red-maw old-frostmaw woolly-mammoth cave-bear` passes.

| Unit             | Approved visible props |
| ---------------- | ---------------------- |
| Gorehorn Red Maw | red light threads      |
| Old Frostmaw     | hunting horn           |
| Woolly Mammoth   | fence                  |
| Cave Bear        | honeycomb              |

The approval covers the five reference views. It does not approve the current 3D model, its region boxes or a failed Review Gate.

## Shared correction

The beast scripts made each side separately. Cone ring orientation and fur details were not exact reflections, so the chirality gate found small differences in the paired ears and legs.

`kit.mirror_part_geometry(source, target)` now reflects the left painted geometry across X, reverses its face winding and preserves the target's right-side skin rule and region. `quadruped.mirror_parts(parts)` applies it only to named pairs `.L/.R`, `.FL/.FR` and `.BL/.BR` that both exist. The five batch scripts call it before converting the parts to objects. Unpaired head details, scars, props and tails keep their shape.

A Blender test first failed because the Body Plan had no reflection function. It now passes: a right foreleg has the expected reflected position, positive volume, copied face paint and its original right-side bone. The existing clip checks pass for all five rebuilt models.

The correction keeps every bone and clip digest. Four Source Contracts do not change. Cave Bear intentionally changes only its lowest X bound, from -0.2184807786 to -0.2256940995, because the right-side fur now reflects the left-side fur. Its other bounds and all clips stay the same.

## Evidence

`artifacts/unit-model-review/<name>/approved-before/` reruns the gates on the admitted references and the earlier model. `approved-after/` has fresh captures after the reflection correction. The original `issue-186-before/` and `issue-186-after/` records remain unchanged.

The results and final checks follow below.

| Unit | Admitted before | After reflection | Remaining failed gates |
| --- | --- | --- | --- |
| crag-rhino | 7 pass, 4 fail, 0 error | 8 pass, 3 fail, 0 error | turntable, attachment-anchor, palette |
| gorehorn-red-maw | 8 pass, 3 fail, 0 error | 9 pass, 2 fail, 0 error | joint-loops, palette |
| old-frostmaw | 7 pass, 4 fail, 0 error | 7 pass, 4 fail, 0 error | interior-difference, joint-loops, attachment-anchor, palette |
| woolly-mammoth | 9 pass, 2 fail, 0 error | 10 pass, 1 fail, 0 error | palette |
| cave-bear | 8 pass, 3 fail, 0 error | 9 pass, 2 fail, 0 error | self-intersection, palette |

All five `chirality` results now pass. All four newly admitted units have a result for `interior-difference`: Gorehorn, Mammoth and Cave Bear pass; Old Frostmaw fails. No gate has a missing-input error. The non-applicable flyer and structure gates remain marked as such.

The repeated palette failures remain, so the batch stays stopped under issue 186. Later batches did not start. Approval of the references does not approve these failures. `approved-models.png` shows the front cutouts, with each figure cropped and scaled for inspection. The geometry remains an approximate miniature of the reference.

## Validation

- Four Turnaround intake checks: pass.
- Five Source Contract comparisons: only the intentional Cave Bear minimum X change before packing; all bones and clip digests retained.
- Five clip checks: pass after packing.
- Body Plan pure Python tests: 35 pass.
- Blender regression: one test passes; the test was red before the shared function existed.
- Type checks: pass.
- Full suite and final lint results are recorded below.

Issue 186 remains incomplete. The next model pass must address the failed gates in this table before the next batch starts.

Final checks: the application suite passed 3,625 tests across 214 files, with one skip and passing coverage floors. The script suite passed all 171 tests with the 30-second test limit. The plain Python suite passed 173 tests, with two Blender-only modules skipped. The new Blender test passed separately. Type checks passed. Both review axes found no new defect; the Spec review retains the overall issue's incomplete gate and migration requirement. No CI run or issue closure is claimed.

Final lint and staged diff checks pass. The staged source files also pass the Python suite and the new Blender test without the other task’s uncommitted kit changes. `approved-staged-tests.log` has this check.
