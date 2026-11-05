# Body Plans

A Body Plan is the shared skeleton, proportions, IK and clip slots of a group of Unit Models. A build script gives its parts, its palette and its overrides. `BODY_PLANS` maps the `bodyPlan` name of a Unit Spec to its module.

## biped-medium

`biped_medium.py` holds the plan for the human, elf and undead figures. Blender is necessary only for `build_rig` and `add_arm_ik`. The other code runs in plain Python:

```sh
python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'
```

| The plan owns | Code |
| --- | --- |
| The bone list and the bone order | `bones(table, trunk, props)` |
| The proportion table | `Proportions(**overrides)` |
| The IK and constraint setup | `add_arm_ik(rig, table)` |
| The skinning rule | `SKIN_RULES`, `skin_problems`, `check_skin` |
| The clip slots | `CLIP_SLOTS` |

`build_rig(name, table, trunk, props)` returns the rig and its proportion table. In Warden Saelith, the arm and leg joints of the geometry come from `arm_points` and `leg_points`. The bones and these joints cannot have different positions. The head and torso geometry has its own values, so a script that overrides a head or torso height must also change that geometry.

A build script adds bones in two positions, and these positions keep the bone order of the existing scripts. `trunk` bones come after the head, for hair, cloth and tails. `props` bones come after the limbs.

A part has one Body Region, and `SKIN_RULES` lists the core bones of each region. A unit's bone belongs to the nearest core bone above it, so a braid on the head is in the `head` region. A prop, a base and an effect can use any bone. `kit.part_object` keeps the bones of a part in `part.bones`, and `check_skin` stops a build that breaks the rule.

`arm_points` rounds to 32 bits after each step, as a Blender `Vector` does. If you remove this, the bounds and the keyframe digest of Warden Saelith change.

### Proportion table

The survey read `BONES` from each script in Blender. It used the 38 human, elf and undead scripts that have all 20 core bones. All 38 have the same parents and the same order of these bones. The table shows values to 3 places. A default is the most common value. "Count" is the number of scripts that have that value. The values are measurements, so the plan does not use the canon table of the img2threejs `humanoid_proportions.py`.

The arm angle is the angle between the left upper arm and the vertical, with no sign.

| Proportion | Default | Count | Lowest | Highest | Warden Saelith |
| --- | --- | --- | --- | --- | --- |
| Head units | 5.389 | 15 | 4.800 | 5.969 | 5.389 |
| Shoulder width | 0.200 | 8 | 0.160 | 0.320 | 0.200 |
| Hip height | 0.470 | 19 | 0.320 | 0.480 | 0.470 |
| Arm length | 0.345 | 11 | 0.230 | 0.420 | 0.345 |
| Leg length | 0.420 | 17 | 0.280 | 0.430 | 0.420 |
| Waist height | 0.550 | 19 | 0.380 | 0.560 | 0.550 |
| Chest height | 0.640 | 19 | 0.450 | 0.650 | 0.640 |
| Shoulder height | 0.725 | 14 | 0.520 | 0.735 | 0.725 |
| Neck height | 0.750 | 15 | 0.540 | 0.770 | 0.750 |
| Head base height | 0.790 | 15 | 0.570 | 0.800 | 0.790 |
| Head top height | 0.970 | 17 | 0.720 | 0.980 | 0.970 |
| Knee height | 0.270 | 19 | 0.170 | 0.275 | 0.270 |
| Ankle height | 0.050 | 24 | 0.040 | 0.060 | 0.050 |
| Upper arm | 0.150 | 11 | 0.099 | 0.188 | 0.150 |
| Forearm | 0.140 | 11 | 0.087 | 0.220 | 0.140 |
| Hand | 0.055 | 9 | 0.035 | 0.055 | 0.055 |
| Arm angle (degrees) | 20 | 5 | 0.0 | 64.4 | 25 |
| Shoulder bone start (X) | 0.030 | 23 | 0.020 | 0.035 | 0.020 |
| Hip X | 0.050 | 6 | 0.042 | 0.078 | 0.050 |
| Knee X | 0.052 | 7 | 0.042 | 0.078 | 0.052 |

Two defaults are not the most common value of their own row:

- Hand: 0.040 has a count of 13 and 0.050 has a count of 12. The default is 0.055, because the most common arm length, 0.345, is 0.150 + 0.140 + 0.055.
- Hip X: 0.050 and 0.052 have the same count. The default is 0.050, the value of Warden Saelith.

Warden Saelith overrides two values: `arm_angle=25` and `shoulder_root_x=0.02`.

The defaults for bone tips are `root_tip_z` 0.12 (36 of 38 scripts), `foot_tip_y` -0.08 and `foot_tip_z` 0.02 (23 of 38 scripts).

The slot lengths are the most common clip lengths:

| Clip    | Frames | Scripts  |
| ------- | ------ | -------- |
| idle    | 48     | 32       |
| lowHp   | 48     | 37       |
| walk    | 24     | 24       |
| attack  | 30     | 38       |
| cast    | 24     | 10 of 14 |
| hurt    | 16     | 37       |
| death   | 36     | 38       |
| rebirth | 48     | 33 of 33 |
| summon  | 24     | 38       |

The skinning rule passes 1,097 of the 1,098 parts of the 38 scripts. The one failure is `door` of Lantern Widow. It is in the `torso` region, but it uses a prop bone on the right hand. Set `region="prop"` on this part when the script moves.

### Warden Saelith

The Source Contract did not change. After the move, `bun unit-model:contract:check warden-saelith` passes: the bounds, 28 bones, 9 clip durations and 9 keyframe digests are the same to the last bit. We did not pack the Published Model again.

### Scripts that can move

Only Warden Saelith has moved. For each other script, the survey put the script's own values in the proportion table and compared the bones with its `BONES`.

These 5 scripts can move now with proportion overrides. Their arm IK agrees with `add_arm_ik`, or they have no arm IK:

- canopy-vinewarden
- hushbow
- kings-courier
- seedwind-shepherd
- thornline-archer

One script needs pole bones. elderreed-dartmaster fits the table, but its IK poles are bones and not empties. `add_arm_ik` does not make this setup yet.

31 scripts need an arm override. Their arms bend, and their left and right arms are not mirrors. The table gives one straight arm for both sides, so the plan needs an override for each arm first:

- 12 also have arm IK with pole bones: backwatch-bailiff, bramble-duelist, bridge-pikeman, coffin-lancer, crossbow-guard, gate-warden, glade-turnblade, graveyard-drudge, halberdier, militia-recruit, pavise-arbalist and rime-eye-reaper.
- 5 also have a head or a neck that is off the center line: bramble-duelist, canopy-skirmisher, fernwing-courier, rattleknife and skeleton.
- The other scripts need only the arm override.

The full list: acorn-tender, backwatch-bailiff, banner-chaplain, bramble-duelist, bridge-pikeman, canopy-skirmisher, coffin-lancer, crossbow-guard, dawn-cleric, dewkeeper, fernwing-courier, gate-warden, glade-turnblade, grave-bell-tender, graveyard-drudge, halberdier, iron-bulwark, lantern-widow, lethiel-first-gardener, marshal-elian-voss, militia-recruit, ossuary-piper, pale-cantor-ysolde, pavise-arbalist, rattleknife, rime-eye-reaper, rootbound-guard, ser-aldric-stonewall, shieldbearer, sir-odo-last-taxman and skeleton.

12 human, elf, undead and token scripts are not on this plan, because they do not have the 20 core bones: amberwing-dart, bone-rampart, bramble-nest, chattering-cohort, coffin-lid-skater, dawn-reliquary, mosspitcher-lookout, pale-galloper, restless-wisp, river-knight, town-barricade and winter-maw.

A script with a different clip length keeps a plain `Clip(name, frames)` for that clip.
