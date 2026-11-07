# Migration: humanoids

Issue #185. This record has the units, the batches and what stops the Migration. Status: **Batch 1 is on its plans. No unit of the batch passes CI, because no unit of the batch has a Turnaround.**

## Units

The scope has 65 units. The lists come from the surveys in `../body_plans/README.md`.

| Plan | Status | Count | Units |
| --- | --- | --- | --- |
| `biped-medium` | Moved before this issue | 1 | warden-saelith |
| `biped-medium` | Batch 1 | 3 | shieldbearer, skeleton, thornline-archer |
| `biped-medium` | Can move now | 21 | acorn-tender, banner-chaplain, canopy-skirmisher, canopy-vinewarden, dawn-cleric, dewkeeper, fernwing-courier, grave-bell-tender, hushbow, iron-bulwark, kings-courier, lantern-widow, lethiel-first-gardener, marshal-elian-voss, ossuary-piper, pale-cantor-ysolde, rattleknife, rootbound-guard, seedwind-shepherd, ser-aldric-stonewall, sir-odo-last-taxman |
| `biped-medium` | Needs pole bones | 13 | backwatch-bailiff, bramble-duelist, bridge-pikeman, coffin-lancer, crossbow-guard, elderreed-dartmaster, gate-warden, glade-turnblade, graveyard-drudge, halberdier, militia-recruit, pavise-arbalist, rime-eye-reaper |
| `biped-small` | Moved before this issue | 1 | fuse-runner |
| `biped-small` | Batch 1 | 1 | bomb-lobber |
| `biped-small` | Can move now | 5 | badland-runt, junk-slinger, scrap-plate-guard, sidestep-shiv, tunnel-saboteur |
| `biped-small` | Needs pole bones | 5 | ankle-snatcher, grease-trapper, grix-ratwhistle, mine-sapper, spyglass-sniper |
| `biped-large` | Moved before this issue | 1 | tusk-brute |
| `biped-large` | Batch 1 | 1 | ashcaller-grosh |
| `biped-large` | Can move now | 6 | howling-charger, mesa-pit-fighter, pack-stalker, warband-standard-bearer, warchief-grukka, warhowler-drummer |
| `biped-large` | Needs pole bones | 6 | ashspit-hunter, cinderhorn-breaker, ember-shaman, pyreaxe-ravager, scrap-raider, skyreaver |
| None | Cannot move | 1 | cave-troll: its body bends forward, and the table does not have these values |

Fuse Runner and Tusk Brute are on their plans, but they have no Unit Spec yet.

## What stops the Migration

1. **Turnarounds.** The definition of done needs an approved Turnaround for each unit. Only warden-saelith has one in this scope. An external image model made the images, and a person approved them, so an agent cannot do this step. With no Turnaround, `interior-difference` gives an error, and an error is not a pass. So the Unit Model Review fails for each unit in the batch. The prompts are in `apps/web/art/units/raw/turnaround/<name>/prompts.md`.
2. **A person must approve the art.** The batch changes colors and clips, and no person has looked at the result. See [What a person must check](#what-a-person-must-check).
3. **Pole bones.** 24 units need pole bones that `add_arm_ik` does not make. Add these to `body_plans/biped.py` before these units move.

## Batch 1

The batch has one unit of each race, so that it tests each plan. Skeleton is the undead unit, and it is a Token.

| Unit | Plan | Review Gates before | Review Gates after | Defects fixed |
| --- | --- | --- | --- | --- |
| shieldbearer | `biped-medium` | 6 of 11 | 10 of 11 | Rings at hips, waist, chest and neck. Neck blend. Blue of the skirt and cape |
| thornline-archer | `biped-medium` | 7 of 11 | 10 of 11 | Rings at hips, waist and neck. Neck and hips blends. Green of the tunic. Arrow through the ground in `death` |
| skeleton | `biped-medium` | 7 of 11 | 10 of 11 | Teal cloth and bone colors. Body through the ground in `death` |
| bomb-lobber | `biped-small` | 6 of 11 | 10 of 11 | Rings at waist, chest and neck. Neck blend. Neckerchief, brass, bomb and spark colors |
| ashcaller-grosh | `biped-large` | 5 of 11 | 10 of 11 | New `hips` part. Rings at chest and neck. Neck blend. Skin, brass and rag colors. Staff through the ground in `death`. `staff.charms` is not a prop |

The remaining Review Gate of each unit is `interior-difference`, with an error. The records are in `artifacts/unit-model-review/<name>/before/gates.json` and `artifacts/unit-model-review/<name>/2026-11-06/gates.json`. CI did not run: this branch was not pushed. `batch-1-before.png` and `batch-1-after.png` in `artifacts/unit-model-review/migration-humanoids/` show each painting with the 4 views.

The move alone did not change a bound, a bone or a clip: after the move, `bun unit-model:contract:check` passed for all 5. A Source Contract does not record colors or geometry, so the new colors and rings of the fixes give it no change. The Source Contract then changed for 3 units, as an intentional change: the `death` and `rebirth` digests of thornline-archer, skeleton and ashcaller-grosh. `rebirth` changed because it uses the same `fallen` pose. `bun unit-model:clips:check --all` found these 3 faults. They were in the models before this issue. The Review Gates do not read them.

## Defects that repeat

The issue says to stop when a defect repeats, and to fix the shared layer. Batch 1 found these:

| Defect | Units | Layer | Fix |
| --- | --- | --- | --- |
| The part list of the schema is closed, so each new part fails | 5 of 5 | Unit Spec | `$defs/part` is now a pattern. A wrong name is no longer refused at this step. `part-coverage` finds a listed part that the model does not have, and it does not find a part of the model that the Unit Spec omits |
| `chirality` fails on an arm that a figure holds differently at rest | 4 of 5 | Review Gate | `posedPairs` of the Unit Spec. A listed pair has no test of its shape. It fails only if its centers are an exact rotation, and a posed arm does not have this. So the list can hide a rotated hand |
| `turntable` fails where an arm closes a gap against the body | 3 of 5 | Review Gate | `holedParts` accepts `body` |
| `joint-loops` cannot see a ring on a wide trunk | 3 of 5 | Review Gate | On `hips`, `spine`, `chest` and `neck`, a ring can be 0.12 of the height from the bone |
| Each script needs the same rings and neck blend | 4 of 5 | Kit, Body Plan | `kit.shares`, `plan.neck_weights` and `plan.hips_weights` |
| Each Unit Spec needs measures of the model | 5 of 5 | Tool | `bun unit-model:spec:draft` |
| `palette` fails | 5 of 5 | Build script | Each unit has its own colors, so this has no shared fix. Each next unit will need the same work |
| A figure goes through the ground in `death` | 3 of 5 | Build script | Each unit has its own `fallen` pose, so this has no shared fix. `unit-model:clips:check` is not a CI step, so CI does not find this |

The first 4 fixes make a Review Gate accept more, and each list in a Unit Spec is a claim that a person must check. So "Review Gates after" does not measure only better models:

- The `before` records used the old Review Gates, and the `after` records used the changed ones.
- `chirality` passes for shieldbearer, skeleton, bomb-lobber and ashcaller-grosh only with `posedPairs`.
- `turntable` passes for shieldbearer, skeleton and bomb-lobber only with `body` in `holedParts`.
- `turntable` passes for each of the 5 units only with its own parts in `holedParts`, for example `quiver` and `goggles`.
- `joint-loops` passes for bomb-lobber and ashcaller-grosh only with the wider reach, and each unit also got new rings.

## What a person must check

- **The Turnaround of each unit.** Then `interior-difference` runs for the first time.
- `posedPairs` and `holedParts` of each Unit Spec. I read them from the failures of the Review Gates and from the build script, and I did not check each one against a Turnaround.
- `regions` of each Unit Spec. These are measures of the current model, so they do not prove that the model is good.
- **ashcaller-grosh skin.** The model was green, and the painting has a warm tan skin. The new color passes `palette`, but it is redder than the painting. `palette` rejected `#a57652`, a color that I sampled from the face.
- **thornline-archer leaves.** The tunic is now olive, as in the painting. The leaves and the sap stay green, because `palette` reads only the main colors.
- **bomb-lobber spark.** `SPARK_HOT` is now a dull orange, because the fire of the painting is pale.
- **Thin wires.** A new build has the `kit.tube` fix, so each thin tube gets its ink outline. The net of the racket of bomb-lobber is darker, and the straps of the helmet of skeleton are heavier.
- **Shieldbearer mail.** The new rings let the mail stripes show. The stripes were one color before.

The models are still far from the paintings in ways that no Review Gate reads. For example, ashcaller-grosh has simple cloth panels where the painting has torn layers, and his right hand is not charred as in the painting.

## How to move a unit

```sh
bun unit-model:spec:draft biped-medium <name>
bun unit-model:review <name> --date before    # first pack the current Raw Export
bun unit-model:gates <name> --date before
# Move the script. `contract:check` must pass.
bun unit-model:contract:check <name>
# Fix what the Review Gates report. Then:
bun unit-model:clips:check <name>
bun run unit-model:pack <name>
bunx ultracite fix scripts/unit-model/source-contracts.json
bun unit-model:review <name>
bun unit-model:gates <name>
```

Add a `.gitignore` line for each new Raw Export.

The line count does not go down much. Each moved unit overrides most roles, because the survey found no shared pose values: 1,442 lines of `build_clips` became 1,421 lines in Batch 1.
