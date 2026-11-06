# Body Plans

A Body Plan is the shared skeleton, proportions, IK and clip slots of a group of Unit Models. A build script gives its parts, its palette and its overrides. `BODY_PLANS` maps the `bodyPlan` name of a Unit Spec to its module.

| Plan | Module | Figures | Height |
| --- | --- | --- | --- |
| `biped-small` | `biped_small.py` | goblins | 0.660 to 0.720 |
| `biped-medium` | `biped_medium.py` | humans, elves and undead | 0.720 to 0.980 |
| `biped-large` | `biped_large.py` | big orcs and trolls | 0.870 to 1.000 |

## Shared code

The three plans have the same 20 core bones, the same order and the same parents. `biped.py` holds the shared code. Each plan module gives its name and the defaults of its proportion table, and it exports the shared code. Blender is necessary only for `build_rig` and `add_arm_ik`. The other code runs in plain Python:

```sh
python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'
```

| The plan owns | Code |
| --- | --- |
| The bone list and the bone order | `bones(table, trunk, props, arms)` |
| The proportion table | `Proportions(**overrides)` |
| The IK and constraint setup | `add_arm_ik(rig, table, arms)` |
| The skinning rule | `SKIN_RULES`, `skin_problems`, `check_skin` |
| The clip slots | `CLIP_SLOTS` |

`build_rig(name, table, trunk, props, arms)` returns the rig and its proportion table. In Warden Saelith, the arm and leg joints of the geometry come from `arm_points` and `leg_points`. The bones and these joints cannot have different positions. The head and torso geometry has its own values, so a script that overrides a head or torso height must also change that geometry.

A build script adds bones in two positions, and these positions keep the bone order of the existing scripts. `trunk` bones come after the head, for hair, cloth and tails. `props` bones come after the limbs.

Most arms bend, and their left and right sides are not always mirrors. One `arm_angle` cannot give this shape, so `arms` is an override. It maps `"L"` and `"R"` to the elbow, wrist and fingertip of each arm.

The table keeps the shoulder, and `shoulder_point` gives it. With `arms`, `arm_angle`, `upper_arm`, `forearm` and `hand` do not apply. Fuse Runner and Tusk Brute show this use. Give the same `arms` to `add_arm_ik`, so that its targets start at the correct wrists.

`neck_y`, `head_base_y` and `head_top_y` give the forward lean of the neck and the head. The chest stays on the center line.

A part has one Body Region, and `SKIN_RULES` lists the core bones of each region. A unit's bone belongs to the nearest core bone above it, so a braid on the head is in the `head` region. A prop, a base and an effect can use any bone. `kit.part_object` keeps the bones of a part in `part.bones`, and `check_skin` stops a build that breaks the rule.

`arm_points` rounds to 32 bits after each step, as a Blender `Vector` does. If you remove this, the bounds and the keyframe digest of Warden Saelith change. Do not round the points of `arms`. They come from a `Vector`, so they are already 32-bit values.

`CLIP_SLOTS` is the same for the three plans. The surveys agree on the most common frame count of each clip, with one exception. No goblin script has a cast clip, and 24 and 30 have the same count in the biped-large survey. The cast slot keeps the 24 of biped-medium.

`ARM_POLES` are the poles of the human archers, so they are not correct for each plan. For example, 0.7 and 0.85 are above the head of a goblin. No goblin or orc script uses empties as poles, and neither moved unit has arm IK. A script that moves with `add_arm_ik` must check the poles first.

## biped-medium

`biped_medium.py` holds the plan for the human, elf and undead figures.

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

`neck_y`, `head_base_y` and `head_top_y` have a default of 0, the value of Warden Saelith.

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

Only Warden Saelith has moved. For each other script, the survey put the script's own values in the proportion table and `arms`, then compared the bones with its `BONES`. All the scripts below give the same bones.

These 24 scripts can move now. Their arm IK agrees with `add_arm_ik`, or they have no arm IK:

- acorn-tender, banner-chaplain, canopy-skirmisher, canopy-vinewarden, dawn-cleric, dewkeeper, fernwing-courier, grave-bell-tender, hushbow, iron-bulwark, kings-courier, lantern-widow, lethiel-first-gardener, marshal-elian-voss, ossuary-piper, pale-cantor-ysolde, rattleknife, rootbound-guard, seedwind-shepherd, ser-aldric-stonewall, shieldbearer, sir-odo-last-taxman, skeleton and thornline-archer.

lantern-widow also needs the `region="prop"` fix on its `door` part.

These 13 scripts need pole bones, because their IK poles are bones and not empties. `add_arm_ik` does not make this setup yet:

- backwatch-bailiff, bramble-duelist, bridge-pikeman, coffin-lancer, crossbow-guard, elderreed-dartmaster, gate-warden, glade-turnblade, graveyard-drudge, halberdier, militia-recruit, pavise-arbalist and rime-eye-reaper.

12 human, elf, undead and token scripts are not on this plan, because they do not have the 20 core bones: amberwing-dart, bone-rampart, bramble-nest, chattering-cohort, coffin-lid-skater, dawn-reliquary, mosspitcher-lookout, pale-galloper, restless-wisp, river-knight, town-barricade and winter-maw.

A script with a different clip length keeps a plain `Clip(name, frames)` for that clip.

## biped-small

`biped_small.py` holds the plan for the goblins.

### Proportion table

The survey used the 12 goblin scripts that have all 20 core bones. All 12 have the same order and the same parents of these bones. It uses the method of the biped-medium survey, and the plan does not use the canon table of `humanoid_proportions.py`. These values are measurements.

| Proportion              | Default | Count | Lowest | Highest | Fuse Runner |
| ----------------------- | ------- | ----- | ------ | ------- | ----------- |
| Head units              | 3.833   | 5     | 3.833  | 4.125   | 3.833       |
| Shoulder width          | 0.184   | 3     | 0.156  | 0.190   | 0.160       |
| Hip height              | 0.300   | 7     | 0.280  | 0.300   | 0.300       |
| Arm length              | 0.230   | 0     | 0.220  | 0.355   | 0.259       |
| Leg length              | 0.260   | 6     | 0.150  | 0.260   | 0.260       |
| Waist height            | 0.360   | 7     | 0.340  | 0.360   | 0.360       |
| Chest height            | 0.420   | 6     | 0.400  | 0.420   | 0.420       |
| Shoulder height         | 0.480   | 4     | 0.450  | 0.490   | 0.480       |
| Neck height             | 0.500   | 4     | 0.470  | 0.510   | 0.500       |
| Head base height        | 0.510   | 5     | 0.500  | 0.540   | 0.510       |
| Head top height         | 0.690   | 5     | 0.660  | 0.720   | 0.690       |
| Knee height             | 0.170   | 6     | 0.155  | 0.260   | 0.170       |
| Ankle height            | 0.040   | 10    | 0.040  | 0.150   | 0.040       |
| Neck Y                  | 0.000   | 11    | -0.035 | 0.000   | 0.000       |
| Head base Y             | -0.006  | 3     | -0.050 | 0.000   | -0.006      |
| Head top Y              | -0.010  | 4     | -0.070 | 0.000   | -0.012      |
| Upper arm               | 0.105   | 3     | 0.081  | 0.140   | 0.105       |
| Forearm                 | 0.090   | 2     | 0.090  | 0.183   | 0.119       |
| Hand                    | 0.035   | 8     | 0.030  | 0.040   | 0.035       |
| Arm angle (degrees)     | 25      | 3     | 18.0   | 111.9   | 48.1        |
| Shoulder bone start (X) | 0.020   | 12    | 0.020  | 0.020   | 0.020       |
| Hip X                   | 0.048   | 3     | 0.042  | 0.056   | 0.042       |
| Knee X                  | 0.048   | 3     | 0.042  | 0.098   | 0.042       |

For two values with the same count, the default is the value of Fuse Runner. This script has the most common value of 9 of the 10 main landmarks. There are two exceptions:

- Forearm: 0.090, 0.105 and 0.183 have the same count. The default is 0.090, because it makes the arm length 0.230, near the most common arm length of 0.233. No script has an arm length of exactly 0.230.
- Arm angle: the count uses steps of 5 degrees. 25 and 40 have the same count, and Fuse Runner has neither. The default is 25, because it is nearer the middle value of the survey. An arm that points up gives a high value, so the spread is wide.

The defaults for bone tips are `root_tip_z` 0.1 (12 of 12 scripts), `foot_tip_y` -0.08 (11 of 12 scripts) and `foot_tip_z` 0.016 (10 of 12 scripts).

Fuse Runner overrides four values: `shoulder_width=0.16`, `hip_x=0.042`, `knee_x=0.042` and `head_top_y=-0.012`. It also gives `arms`.

The clip lengths agree with `CLIP_SLOTS`: idle, lowHp, attack, hurt, death, rebirth and summon in 12 of 12 scripts, and walk in 11 of 12. No goblin script has a cast clip.

The skinning rule passes 306 of the 309 parts. Three parts fail, and each one has a Body Region that is not correct. When a script moves, set `region="prop"` on its part:

- `boot` of Ankle Snatcher, the boot on the hook.
- `wheel` of Scrap-Plate Guard.
- `jaw` of Tunnel Saboteur, the jaw of the pliers.

### Fuse Runner

The Source Contract did not change. After the move, `bun unit-model:contract:check fuse-runner` passes: the bounds, 24 bones, 8 clip durations and 8 keyframe digests are the same to the last bit. We did not pack the Published Model again.

### Scripts that can move

The survey put the script's own values in the proportion table and `arms`, then compared the bones with its `BONES`.

- 6 scripts can move now: bomb-lobber, junk-slinger, scrap-plate-guard, sidestep-shiv, tunnel-saboteur and badland-runt. Badland Runt is an orc, but it has the size of a goblin, so it is not in the survey. It has a walk clip of 12 frames.
- 5 scripts need pole bones: ankle-snatcher, grease-trapper, grix-ratwhistle, mine-sapper and spyglass-sniper.
- rocket-barrel-rider cannot move. Its barrel bones come before the hips, and it sits, so its legs and shoulders do not agree with the plan.

The four other goblin scripts do not have the 20 core bones: boss-snikkit, grand-gearjammer, junk-barricade and junk-walker.

## biped-large

`biped_large.py` holds the plan for the big orcs and the trolls.

### Proportion table

The survey used 15 scripts: the 14 big orc scripts that have all 20 core bones, and Cave Troll. All 15 have the same order and the same parents of these bones. It uses the method of the biped-medium survey, and the plan does not use the canon table of `humanoid_proportions.py`. These values are measurements. Cave Troll gives the highest arm length and many of the lowest heights.

| Proportion              | Default | Count | Lowest | Highest | Tusk Brute |
| ----------------------- | ------- | ----- | ------ | ------- | ---------- |
| Head units              | 5.875   | 3     | 5.412  | 7.143   | 7.143      |
| Shoulder width          | 0.310   | 3     | 0.260  | 0.480   | 0.380      |
| Hip height              | 0.460   | 3     | 0.360  | 0.500   | 0.500      |
| Arm length              | 0.344   | 1     | 0.308  | 0.680   | 0.399      |
| Leg length              | 0.405   | 2     | 0.300  | 0.440   | 0.440      |
| Waist height            | 0.540   | 3     | 0.460  | 0.600   | 0.600      |
| Chest height            | 0.630   | 3     | 0.600  | 0.700   | 0.700      |
| Shoulder height         | 0.715   | 4     | 0.685  | 0.800   | 0.800      |
| Neck height             | 0.745   | 3     | 0.700  | 0.830   | 0.830      |
| Head base height        | 0.780   | 4     | 0.720  | 0.860   | 0.860      |
| Head top height         | 0.940   | 3     | 0.870  | 1.000   | 1.000      |
| Knee height             | 0.260   | 4     | 0.200  | 0.280   | 0.280      |
| Ankle height            | 0.055   | 11    | 0.050  | 0.060   | 0.060      |
| Neck Y                  | -0.010  | 5     | -0.100 | 0.000   | -0.015     |
| Head base Y             | -0.020  | 4     | -0.170 | 0.000   | -0.025     |
| Head top Y              | -0.030  | 4     | -0.282 | 0.000   | -0.040     |
| Upper arm               | 0.159   | 2     | 0.141  | 0.269   | 0.182      |
| Forearm                 | 0.135   | 2     | 0.114  | 0.285   | 0.157      |
| Hand                    | 0.050   | 10    | 0.040  | 0.126   | 0.060      |
| Arm angle (degrees)     | 25      | 7     | 20.3   | 147.8   | 21.1       |
| Shoulder bone start (X) | 0.030   | 12    | 0.030  | 0.060   | 0.040      |
| Hip X                   | 0.062   | 3     | 0.062  | 0.120   | 0.090      |
| Knee X                  | 0.062   | 3     | 0.062  | 0.120   | 0.090      |

For two values with the same count, the default is the value of Cinderhorn Breaker. This script has the most common value of 9 of the 10 main landmarks. There are two exceptions:

- Forearm: 0.117 and 0.135 have the same count, and Cinderhorn Breaker has neither. The default is 0.135, because 0.159 + 0.135 + 0.050 is the arm length of Pack Stalker. Each arm length of the survey has a count of 1, so there is no most common arm length.
- Arm angle: the count uses steps of 5 degrees.

Tusk Brute is the largest figure of the survey, so it is at the top of most rows. All its clips agree with the slots, and it has no arm IK. It overrides 17 of the 23 values and gives `arms`, so it does not test most defaults. Ashcaller Grosh needs only 11 overrides, so it is a better test of the table when it moves.

The defaults for bone tips are `root_tip_z` 0.12 (14 of 15 scripts), `foot_tip_y` -0.09 (7 of 15 scripts) and `foot_tip_z` 0.02 (14 of 15 scripts).

The clip lengths agree with `CLIP_SLOTS`. Each length has a count of at least 14, with two exceptions:

- walk: 24 in 7 scripts, 16 in 5, and 18, 22 and 32 in 1 each.
- cast: 4 scripts have this clip. 2 have 24 frames and 2 have 30.

The skinning rule passes 406 of the 408 parts. Two parts in the `torso` region use the `neck` bone: `collar` of Ember Shaman and `body` of Cave Troll. Set `region="head"` on the collar when the script moves.

### Tusk Brute

The Source Contract did not change. After the move, `bun unit-model:contract:check tusk-brute` passes: the bounds, 26 bones, 8 clip durations and 8 keyframe digests are the same to the last bit. We did not pack the Published Model again.

### Scripts that can move

The survey put the script's own values in the proportion table and `arms`, then compared the bones with its `BONES`.

- 7 scripts can move now: ashcaller-grosh, howling-charger, mesa-pit-fighter, pack-stalker, warband-standard-bearer, warchief-grukka and warhowler-drummer.
- 6 scripts need pole bones: ashspit-hunter, cinderhorn-breaker, ember-shaman, pyreaxe-ravager, scrap-raider and skyreaver.
- cave-troll cannot move. Its body bends forward, so its spine, shoulders and legs are off the center line. The table does not have these values. The same is true of avalanche-yeti and mountain-colossus, two feral scripts with the 20 core bones that are not in the survey.

bonestake-palisade is an orc script that does not have the 20 core bones.
