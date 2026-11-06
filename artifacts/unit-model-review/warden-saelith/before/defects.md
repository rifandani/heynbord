# Warden Saelith: Review Gate defects

Capture of 2026-11-06. Record: `gates.json`. Exit code 1: 6 Review Gates pass and 3 fail.

| # | Review Gate | Defect | Evidence | Layer | Fix plan |
| --- | --- | --- | --- | --- | --- |
| 1 | `self-intersection` | The `bow` surface is reversed. `kit.tube` winds each face inward. | 73 of 114 `bow` vertices measure inside their own island. Its signed volume is -0.000204. The faces and the vertex normals agree with each other. | Kit | Reverse the face order in `kit.tube`. Build the model again, then compare it with its Source Contract. |
| 2 | `joint-loops` | The `chest` joint has 1 band of vertices. It needs 3. | 12 vertices in 1 band, within 0.0385 of the joint. | Build script | Add rings to the torso parts near `chest_z`. |
| 3 | `joint-loops` | The `neck` joint has 1 band of vertices. It needs 3. | 8 vertices in 1 band, within 0.014 of the joint. | Build script | Add rings to the `neck` part near `neck_z`. |
| 4 | `joint-loops` | The `hips` joint has 1 ring, and its corners read as 3 bands. | 3 bands in a span of 0.000737, within 0.028 of the joint. | Build script | Add rings to the `hips` part near `hip_z`. |
| 5 | `palette` | The `torso` coat is too saturated for the card painting. | Worst delta-E 15.06 on 23% of the vertices of the region. | Unit Spec and build script | Change `COAT` and `COAT_DARK` to the olive of the painting. Change `palette` of the Unit Spec to match. |
| 6 | `palette` | The `arm.L` and `arm.R` sleeves have the same coat color. | Worst delta-E 12.74 on 25% of the vertices of each region. | Unit Spec and build script | The fix of defect 5. |

#179 owns these fixes.

## Other results of the kit defect

`kit.tube` also builds the `string` and the shaft of the `arrow`. The signed volume of `arrow#0` is -0.00000784, so it is reversed too. No Review Gate fails on them: `string` is an open island, and the shaft has no vertex that reads as inside. The fix changes 93 other build scripts, so each Migration issue must build its models again.

## Notes on the passes

- `turntable`: The full silhouette encloses background in all 4 views, and `gates.json` keeps this result in `holed`. These gaps need a prop: the left arm, the skirt and the bow, and the bow and its string. The silhouette of the body has no hole. The only hole through one part is the `tiara`, which is a ring. The Unit Spec lists it in `holedParts`.
- `interior-difference`: The values are 0.215 to 0.273, and the limit is 0.28. The model is much darker than its Turnaround. Calibrate the limit again after #179.
- `self-intersection` does not read 5 open islands: `hair#0`, `collar`, `skirt#0`, `skirt#1` and `string`.
- `joint-loops` has no tip for 6 bones: `braid3`, `hand.L`, `hand.R`, `tail2`, `foot.L` and `foot.R`.
