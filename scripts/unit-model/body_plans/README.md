# Body Plans

A Body Plan is the shared skeleton, proportions, IK and clip slots of a group of Unit Models. A build script gives its parts, its palette and its overrides. `BODY_PLANS` maps the `bodyPlan` name of a Unit Spec to its module.

| Plan | Module | Figures | Height |
| --- | --- | --- | --- |
| `biped-small` | `biped_small.py` | goblins | 0.660 to 0.720 |
| `biped-medium` | `biped_medium.py` | humans, elves and undead | 0.720 to 0.980 |
| `biped-large` | `biped_large.py` | big orcs and trolls | 0.870 to 1.000 |
| `quadruped` | `quadruped.py` | beasts with four legs on the ground | 0.470 to 1.455 |
| `flyer` | `flyer.py` | creatures and figures that float | 0.660 to 1.308 |
| `machine` | `machine.py` | carts and walkers | 0.677 to 0.966 |
| `structure` | `structure.py` | walls and heaps | 0.707 to 1.130 |

## Shared code

`shared.py` holds the code of all plans: `ClipSlot`, `CLIP_SLOTS`, the bone order check, the skinning checks, and `float32` and `offset_point`, which round as a Blender `Vector` does.

The three biped plans have the same 20 core bones, the same order and the same parents. `biped.py` holds the shared code. Each plan module gives its name and the defaults of its proportion table, and it exports the shared code. Blender is necessary only for `build_rig` and `add_arm_ik`. The other code runs in plain Python:

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

A part has one Body Region, and `SKIN_RULES` lists the core bones of each region. A unit's bone belongs to the nearest core bone above it, so a braid on the head is in the `head` region. A prop, a base and an effect can use any bone on a biped plan. `kit.part_object` keeps the bones of a part in `part.bones`, and `check_skin` stops a build that breaks the rule.

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
- rocket-barrel-rider cannot move to this plan. Its barrel bones come before the hips, and it sits, so its legs and shoulders do not agree with the plan. Its plan is `machine`.

The four other goblin scripts do not have the 20 core bones. boss-snikkit, grand-gearjammer and junk-walker use `machine`, and junk-barricade uses `structure`.

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

## quadruped

`quadruped.py` holds the plan for the beasts with four legs on the ground. The beast faces -Y, so its body lies along Y.

### Bones

The survey read `BONES` from 11 scripts in Blender: Crag Rhino, Gorehorn Red Maw, Old Frostmaw, Woolly Mammoth, Cave Bear, Bristleback Boar, Crag Lizard, Frost Elk Matriarch, Frostfang Lynx, Tailsweep Basilisk and Winter Maw. All 11 have the same skeleton:

- The spine is one chain: `root`, `hips`, `spine`, `chest`, 0 to 2 neck bones, `head`.
- The hips start at the back. The spine runs forward along -Y.
- Each leg has 3 bones: `upper.<leg>`, `lower.<leg>` and a foot. `<leg>` is `FL`, `FR`, `BL` or `BR`. The order is always FL, FR, BL, BR.
- The front legs hang from `chest`, and the back legs hang from `hips`.
- Each right leg is the exact mirror of its left leg.

`bones(table, trunk, props, foot)` gives this list. `trunk` bones come after the head, for jaws, ears and tails. `props` bones come after the legs.

`foot` names the last bone of a leg. 8 scripts use `foot`, 2 use `paw` (Old Frostmaw, Winter Maw) and 1 uses `hoof` (Gorehorn Red Maw).

`leg_points(table, leg)` gives the joints of one leg, and `leg_parent(leg)` gives its body bone. The geometry and the bones cannot have different positions.

`necks` gives the end of each neck bone as (y, z), and the last one is the base of the head. 5 scripts have 1 neck bone, 4 have none and 2 have 2.

### Proportion table

The table shows values to 3 places. A default is the most common value. "Count" is the number of scripts that have that value. A row for a leg is for the left leg. These values are measurements. The plan does not use a canon table.

| Proportion      | Default | Count | Lowest | Highest | Crag Rhino |
| --------------- | ------- | ----- | ------ | ------- | ---------- |
| `root_tip_z`    | 0.100   | 11    | 0.100  | 0.100   | 0.100      |
| `hip_y`         | 0.240   | 4     | 0.190  | 0.270   | 0.240      |
| `hip_z`         | 0.400   | 2     | 0.200  | 0.630   | 0.400      |
| `mid_y`         | 0.050   | 3     | 0.020  | 0.070   | 0.050      |
| `mid_z`         | 0.420   | 2     | 0.210  | 0.650   | 0.440      |
| `chest_y`       | -0.120  | 6     | -0.160 | -0.120  | -0.130     |
| `chest_z`       | 0.450   | 2     | 0.220  | 0.670   | 0.460      |
| `neck_y`        | -0.260  | 2     | -0.300 | -0.190  | -0.260     |
| `neck_z`        | 0.440   | 2     | 0.220  | 0.740   | 0.440      |
| `head_tip_y`    | -0.520  | 3     | -0.698 | -0.406  | -0.611     |
| `head_tip_z`    | 0.340   | 1     | 0.160  | 0.950   | 0.193      |
| `front_top_x`   | 0.080   | 3     | 0.070  | 0.150   | 0.120      |
| `front_top_y`   | -0.130  | 4     | -0.160 | -0.100  | -0.140     |
| `front_top_z`   | 0.380   | 2     | 0.200  | 0.600   | 0.380      |
| `front_knee_x`  | 0.120   | 2     | 0.070  | 0.220   | 0.120      |
| `front_knee_y`  | -0.140  | 3     | -0.180 | -0.110  | -0.150     |
| `front_knee_z`  | 0.230   | 2     | 0.160  | 0.360   | 0.210      |
| `front_ankle_x` | 0.120   | 2     | 0.070  | 0.240   | 0.120      |
| `front_ankle_y` | -0.140  | 3     | -0.210 | -0.130  | -0.150     |
| `front_ankle_z` | 0.070   | 4     | 0.040  | 0.120   | 0.070      |
| `front_toe_x`   | 0.120   | 2     | 0.070  | 0.260   | 0.120      |
| `front_toe_y`   | -0.200  | 3     | -0.290 | -0.190  | -0.220     |
| `front_toe_z`   | 0.020   | 5     | 0.010  | 0.030   | 0.030      |
| `back_top_x`    | 0.080   | 4     | 0.075  | 0.140   | 0.110      |
| `back_top_y`    | 0.250   | 4     | 0.190  | 0.270   | 0.250      |
| `back_top_z`    | 0.380   | 3     | 0.190  | 0.580   | 0.360      |
| `back_knee_x`   | 0.110   | 2     | 0.075  | 0.220   | 0.110      |
| `back_knee_y`   | 0.270   | 2     | 0.130  | 0.330   | 0.270      |
| `back_knee_z`   | 0.200   | 3     | 0.160  | 0.320   | 0.200      |
| `back_ankle_x`  | 0.110   | 2     | 0.075  | 0.240   | 0.110      |
| `back_ankle_y`  | 0.240   | 4     | 0.240  | 0.300   | 0.260      |
| `back_ankle_z`  | 0.070   | 4     | 0.040  | 0.120   | 0.070      |
| `back_toe_x`    | 0.110   | 2     | 0.075  | 0.260   | 0.110      |
| `back_toe_y`    | 0.190   | 2     | 0.160  | 0.240   | 0.190      |
| `back_toe_z`    | 0.020   | 5     | 0.010  | 0.030   | 0.030      |

The spread is wide because the survey has a lizard of 0.47 and an elk of 1.455. For two values with the same count, the default is the value of Crag Rhino. There are these exceptions:

- `mid_z`, `chest_z`, `front_knee_z` and `front_ankle_y`: Crag Rhino has none of the tied values. The default is the tied value that is nearest to Crag Rhino.
- `necks`: 1 neck bone is the most common count. The default joint is that of Gorehorn Red Maw, the first script of the survey with 1 neck bone.
- `head_tip_z`: each script has a different value. The default is that of Gorehorn Red Maw, because the default neck is its neck.

Crag Rhino has no neck bones, so it does not test the default neck. It overrides 19 of the 36 values.

### Skinning rule and clip slots

The skinning rule passes 240 of the 240 parts. A `torso` part may use `head` and the neck bones, because the hide of 14 parts blends into the head. A leg part may use the body bone that holds it. The rule cannot separate a front leg from a back leg, because the Body Regions are `leg.L` and `leg.R`.

The clip lengths agree with the shared slots, with these differences:

- cast: 2 of 2 scripts have 30 frames, so this plan has a cast slot of 30.
- walk: 24 and 28 have a count of 3 each, 20 has 2, and 14, 18 and 32 have 1 each. The slot stays 24.
- idle and lowHp: 10 of 11 scripts have 48. Bristleback Boar has 40.

No script of the survey has a constraint, so this plan has no IK.

### Crag Rhino

The Source Contract did not change. After the move, `bun unit-model:contract:check crag-rhino` passes: the bounds, 20 bones, 7 clip durations and 7 keyframe digests are the same to the last bit. We did not pack the Published Model again. Its walk has 20 frames, so its `Patch` gives `frames`.

We also compared the data of a new Raw Export with an export of the old script. Positions, normals, colors, joints, weights, parts, regions and bind matrices are the same. Only the triangle index bytes are different, and they also change when you run one script two times. So the bytes of a Raw Export are not a useful check.

### Scripts that can move

The survey put each script's own values in the proportion table, then compared the bones with its `BONES`. All 11 scripts give the same bones, so 10 more scripts can move now: bristleback-boar, cave-bear, crag-lizard, frost-elk-matriarch, frostfang-lynx, gorehorn-red-maw, old-frostmaw, tailsweep-basilisk, winter-maw and woolly-mammoth.

A script with a different clip length gives `frames` in a `Patch` when it moves to the Clip Library.

These beast scripts are not on this plan, because they do not have this skeleton:

- boulder-tortoise has no `hips`, `spine` or `lower` bones.
- web-spitter has eight legs.
- pale-galloper and river-knight are mounts with riders.

## flyer

`flyer.py` holds the bones of the creatures that float, and the root-lift rule of each flyer.

### Bones

The survey read `BONES` from 7 scripts in Blender: Amberwing Dart, Rimebreath Drake, Restless Wisp, Skyreaver, Canopy Skirmisher, Fernwing Courier and Seedwind Shepherd. Fernwing Courier is not in the issue, but it has the Flying Keyword.

These scripts have 2 kinds of skeleton:

- The 3 creatures share only `root` and `body`. Amberwing Dart has 4 wings. Rimebreath Drake has 2 wings with tips, and a chest, a neck and legs. Restless Wisp has no wings and no `head` bone. So `bones(table, trunk, props)` makes only `root` and `body`, and the script adds the rest.
- The 4 figures have the 20 core bones of a biped, so a biped plan is their Body Plan. See the biped lists of scripts that can move. They read only `ROOT_LIFT` from this module. Their Unit Specs must set `flying`, so that the `ground-contact` Review Gate reads them.

`wing_pair(position, root, tip)` gives a left wing bone and its mirror, so the 2 bones cannot have different positions. Rimebreath Drake does not use it, because its wing tips come between its wings in the bone order. A flight stand goes in `props`. A stand bone with no parent stays on the ground when the root moves, as the helmet of Restless Wisp does.

### Proportion table

The survey of the creature body has 3 scripts and almost no common value, so a default is the value of Amberwing Dart.

| Proportion   | Default | Count | Lowest | Highest | Amberwing Dart |
| ------------ | ------- | ----- | ------ | ------- | -------------- |
| Root tip     | 0.120   | 2     | 0.100  | 0.120   | 0.120          |
| Body back Y  | 0.040   | 1     | 0.000  | 0.080   | 0.040          |
| Body back Z  | 0.550   | 2     | 0.380  | 0.550   | 0.550          |
| Body front Y | -0.050  | 1     | -0.100 | 0.000   | -0.050         |
| Body front Z | 0.550   | 1     | 0.550  | 0.570   | 0.550          |

### Root-lift rule

The game puts the lowest point of the rest pose on the ground (`unit-rig.ts`). So a flyer cannot float in its rest pose, and it gets its height in one of 2 ways:

- `STAND_LIFT`: a flight stand reaches from the body to the ground, and it keeps the body in the air in the rest pose. A hover pose only bobs the root, so `float_z` is 0.
- `ROOT_LIFT`: the figure stands on the ground in the rest pose, with the toes down. Each clip in the air lifts the root by `float_z`.

Only the `root` bone gets the lift. `Lift.height(bob)` gives the value of the `root@loc` key of a hover pose. `bob` is -1 to 1.

The other poses are not in the rule, because they do not agree:

- A `lowHp` pose of a figure keeps 0.45 to 0.48 of the float on 3 figures, and 0.15 on Seedwind Shepherd. Its bob is different from the hover bob.
- A `lowHp` pose of a creature drops the root by 0.05 or 0.06.
- A summon of a figure starts at a height of 0 or lower.

The `droop` and `folded` roles of `clips/flyer.py` have the root drop of a creature. Each figure overrides its own poses. See `clips/README.md`.

| Unit | Lift | `float_z` | `bob_z` | Lowest part | Lowest Z | Parts below 0 |
| --- | --- | --- | --- | --- | --- | --- |
| Amberwing Dart | stand | 0 | 0.012 | `vine` | 0.0082 | 0 of 13 |
| Rimebreath Drake | stand | 0 | 0.015 | `snow` | -0.0060 | 1 of 17 |
| Restless Wisp | stand | 0 | 0.018 | `helmet` | 0.0000 | 0 of 9 |
| Skyreaver | root | 0.14 | 0.025 | `boot.L` | 0.0000 | 0 of 29 |
| Canopy Skirmisher | root | 0.15 | 0.025 | `foot.L` | 0.0010 | 0 of 25 |
| Fernwing Courier | root | 0.14 | 0.018 | `foot.L` | 0.0010 | 0 of 25 |
| Seedwind Shepherd | root | 0.08 | 0.025 | `foot.L` | 0.0000 | 0 of 27 |

`ROOT_LIFT` has the most common values: `float_z` 0.14 (2 of 4) and `bob_z` 0.025 (3 of 4). The 3 stand values have a count of 1 each, so `STAND_LIFT` has the middle value, 0.015. Amberwing Dart overrides it with 0.012.

### Ground-contact record

The table above reads the rest-pose mesh of each script in Blender. Only Amberwing Dart has a Unit Spec, so only it has a record of the Review Gate.

`bun unit-model:gates amberwing-dart` gives `ground-contact` a pass on 2026-11-06. The lowest part is `vine` at 0.0082, and no part is below the ground. `artifacts/unit-model-review/amberwing-dart/2026-11-06/gates.json` is the record.

This run does not pass as a whole:

- `ground-contact`, `joint-loops`, `attachment-anchor` and `part-coverage` pass.
- `turntable`, `self-intersection`, `chirality` and `palette` fail.
- `interior-difference` and `region-coverage` give an error, because Amberwing Dart has no Turnaround and no `regions`.
- The input check reports 2,435 vertices in the Raw Export and 2,427 in the Published Model.

The move did not cause these results, because the mesh data of the Raw Export did not change. #186 owns them.

Rimebreath Drake will fail this Review Gate. Its `snow` mound is 0.006 below the ground, so the game lifts the whole model by this distance. Fix the mound when the script moves.

### Skinning rule and clip slots

The core bones of a creature are `root`, `body` and the wing bones, so the rule separates only the wings. The skinning rule passes 39 of the 39 parts of the 3 creatures.

The plan uses the shared slots. All clips of Amberwing Dart and Rimebreath Drake agree with them. Restless Wisp has a `lowHp` of 40 frames and a `walk` of 20. The figures have a `walk` of 16 frames, except Seedwind Shepherd with 24. Seedwind Shepherd is the only flyer with a cast clip, and it has 36 frames. So one script is not enough to change the slot.

### Amberwing Dart

The Source Contract did not change. After the move, `bun unit-model:contract:check amberwing-dart` passes: the bounds, 16 bones, 7 clip durations and 7 keyframe digests are the same to the last bit. We did not pack the Published Model again. The comparison of the Raw Export data has the same result as for Crag Rhino.

Its `hover` pose uses `Lift.height`. Its `dart` and `droop` poses keep their own root values.

### Scripts that can move

The survey put each script's own values in the table, then compared the bones with its `BONES`. rimebreath-drake and restless-wisp give the same bones, so they can move now. Rimebreath Drake also needs the fix of its `snow` mound.

## machine

`machine.py` holds the plan for the carts and the walkers.

### Layout

The survey read `BONES`, the parts and the clips from 4 scripts in Blender: Grand Gearjammer, Boss Snikkit, Junk Walker and Rocket Barrel Rider. These scripts share one rule: one carrier bone is below `root`, and it carries the machine.

| Layout | Scripts | Carrier | Pivot | Other bones |
| --- | --- | --- | --- | --- |
| Cart | Grand Gearjammer, Boss Snikkit | `cart` | rear axle, or the middle of the floor | all bones hang from `cart`, and 4 wheels |
| Walker | Junk Walker | `body` | the top of the legs | the feet hang from `root` |
| Barrel | Rocket Barrel Rider | `barrel` | the barrel | the rider hangs from `root` |

`bones(table, trunk, props)` gives `root`, the carrier, `trunk`, the wheels and `props`. On a table with `wheels` set to True, it stops a bone that does not hang from the carrier. Without wheels, a bone can hang from `root`.

- `wheel_centers(table)` gives the center of each wheel, so the geometry and the bones cannot have different positions. A wheel bone starts at the center and points up. The order is always FL, FR, BL, BR.
- `wheel_pose(turn, angle)` gives the pose of the wheels. Give it the `t` function of a script.
- `rolling_angle(table, frame, frames)` gives the wheel angle of one frame of `walk`.
- `crew_bones(name, base, size, parent)` gives a small figure from the waist up: a body, a head and two arms. Grand Gearjammer has 3 and Junk Walker has 1. `crew_neck` and `crew_shoulder` give the joints for the geometry.
- `walker_poles(legs, parent)` and `walker_leg(legs, side, parent)` give the legs of a walker. The foot hangs from `root`, so it stays on the ground. A walker gives these bones in `trunk`, because the bone order of Junk Walker has its lever bones between the legs.

### Proportion table

The survey has 4 scripts and almost no common value, so a default is the value of Grand Gearjammer. The wheel rows have 2 scripts. "Count" is the number of scripts that have the default.

| Proportion | Default | Count | Lowest | Highest | Boss Snikkit | Junk Walker | Rocket Barrel Rider |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `root_tip_z` | 0.120 | 2 | 0.100 | 0.120 | 0.120 | 0.100 | 0.100 |
| `carrier_y` | 0.220 | 1 | 0.000 | 0.220 | 0.000 | 0.000 | 0.020 |
| `carrier_z` | 0.130 | 1 | 0.075 | 0.400 | 0.075 | 0.400 | 0.160 |
| `carrier_tip_y` | -0.240 | 1 | -0.240 | 0.020 | -0.100 | 0.000 | 0.020 |
| `carrier_tip_z` | 0.130 | 1 | 0.075 | 0.600 | 0.075 | 0.600 | 0.260 |
| `axle_z` | 0.130 | 1 | 0.075 | 0.130 | 0.075 | none | none |
| `wheel_x` | 0.210 | 1 | 0.150 | 0.210 | 0.150 | none | none |
| `front_y` | -0.240 | 1 | -0.240 | -0.170 | -0.170 | none | none |
| `back_y` | 0.220 | 1 | 0.170 | 0.220 | 0.170 | none | none |
| `wheel_tip_z` | 0.060 | 1 | 0.050 | 0.060 | 0.050 | none | none |
| `wheel_turns` | 1 | 1 | 1 | 2 | 2 | none | none |

In both carts, the wheel radius is the same as `axle_z`, so a wheel touches the ground. `wheel_turns` is 1 for Grand Gearjammer and 2 for the small wheels of Boss Snikkit, for one Square of movement.

`WalkerLegs` has the values of Junk Walker, the only script with these legs: `x` 0.13, `hip_z` 0.38, `knee_y` -0.075, `knee_z` 0.21, `ankle_z` 0.065, `foot_tip_y` -0.1, `pole_y` -0.5 and `pole_tip_z` 0.26.

### Skinning rule and clip slots

The skinning rule passes 81 of the 81 parts of the 4 scripts. A wheel or a leg may use its own side and the carrier. A head, torso or arm part must not use a wheel or a leg. A `leg.L` part must not use a right wheel. A crew member and a rider belong to the carrier, so the rule does not separate them.

The plan uses the shared slots, and all clips of the survey agree with them, with one exception. Rocket Barrel Rider has a `walk` of 16 frames. No script has a cast clip.

The plan has no IK. Junk Walker keeps `add_controls`, the IK of its legs, until it moves.

### Grand Gearjammer

The Source Contract did not change. After the move, `bun unit-model:contract:check grand-gearjammer` passes: the bounds, 22 bones, 8 clip durations and 8 keyframe digests are the same to the last bit. We did not pack the Published Model again. It overrides no value of the table, so it does not test the defaults. The comparison of the Raw Export data has the same result as for Crag Rhino.

### Scripts that can move

The survey put each script's own values in the table, then compared the bones with its `BONES`. All 3 give the same bones after they round to 32 bits. All 3 moved in issue #187, and `bun unit-model:contract:check` passed after each move.

- Boss Snikkit needs 10 overrides, with `wheel_turns=2`.
- Junk Walker uses `walker_poles`, `walker_leg` and `crew_bones` in `trunk`, and it keeps its IK.
- Rocket Barrel Rider sets `carrier="barrel"` and `wheels=False`, and it gives its rider in `trunk`. It gives `frames` for `walk` in a `Patch`.

## structure

`structure.py` holds the plan for the walls and the heaps.

### Layout

The survey read `BONES`, the parts and the clips from 6 scripts in Blender: Bone Rampart, Bramble Nest, Town Barricade, Bonestake Palisade, Junk Barricade and Dawn Reliquary. The death poses come from their Raw Exports. These scripts share one rule: `root` holds `base`, and `base` holds each big piece.

| Script | Layout | Big pieces | Arc radius | Other bones |
| --- | --- | --- | --- | --- |
| Bone Rampart | wall | 5 shields on an arc, and a sign | 0.30 | 2 skeleton figures |
| Bramble Nest | wall | 5 loops on an arc, an arch and a sign | 0.28 | pods and ribbons on the arch |
| Bonestake Palisade | wall | 5 stake bundles on an arc, and a totem | 0.27 | 2 hanging hides, 2 sausage strings |
| Town Barricade | heap | 2 beam frames, a crate and a shield | 0.30, and 0.20 for the sandbags | 4 sandbag rows, a log and a paper |
| Junk Barricade | heap | a sign, crates, barrels, a door and pots | 0.27 | a mine cart on the crates, and a goblin |
| Dawn Reliquary | shrine | 2 pillars and 2 doors | none | a roof on the pillars, 2 cloths and a candle |

| Proportion       | Default | Count    | Lowest | Highest | Bone Rampart |
| ---------------- | ------- | -------- | ------ | ------- | ------------ |
| `root_tip_z`     | 0.100   | 6 of 6   | 0.100  | 0.100   | 0.100        |
| `base_z`         | 0.020   | 6 of 6   | 0.020  | 0.020   | 0.020        |
| `base_tip_z`     | 0.140   | 6 of 6   | 0.140  | 0.140   | 0.140        |
| `radius`         | 0.300   | 2 of 5   | 0.270  | 0.300   | 0.300        |
| `arc_y`          | 0.060   | 4 of 5   | 0.060  | 0.070   | 0.060        |
| Foot bone height | 0.120   | 16 of 43 | 0.080  | 0.560   | 0.120        |

Dawn Reliquary has no arc, so the last rows have fewer scripts. `radius` has a tie, with 0.270 in 2 scripts. The default is the value of Bone Rampart. Town Barricade has a second `radius` of 0.2 for its sandbags, so `arc_point(table, angle, radius)` can read another radius.

`bones(table, trunk, props)` gives `root`, `base`, `trunk` and `props`. `arc_point` gives a point on the arc and `outward` gives the direction out of the wall. Angle 0 is the front.

`foot_bone(name, foot, height, parent)` gives the bone of one big piece. It starts at the foot of the piece and points up, and its default parent is `base`. A piece on another piece gives that piece as `parent`, as the cart of Junk Barricade does.

A figure on a wall is not a big piece. The skeletons of Bone Rampart have their first bone at a height of 0.3, so they do not have foot bones. The hide panels of Bonestake Palisade hang from their top, and the roof of Dawn Reliquary turns at the top of its pillars.

### Foot bones

The `foot-bones` Review Gate asks 2 questions about each bone in `footBones` of a Unit Spec:

- Is it at the foot of its piece? The lowest point of the piece must be within 0.03 of the bone head. The highest value of the survey is 0.026.
- Does the piece fall out in `death`? The bone must tilt 45 degrees or more at the end of the clip, which is more than half of the way to the ground. The measurement keeps `root` and `base` still, so a wall that tips as one block does not pass. The direction of the fall has no limit, because the totem of Bonestake Palisade falls back. A fall straight down does not pass.

`footBones` is necessary on a `structure` Unit Spec, and other Unit Specs must not have it. The Review Gate passes with `applies` set to false on other plans.

`bun unit-model:gates bone-rampart` gives `foot-bones` a pass on 2026-11-06. `artifacts/unit-model-review/bone-rampart/2026-11-06/gates.json` is the record. This is the record of each foot bone in `death`:

| Foot bone  | Bone height | Lowest point | Tilt (degrees) | Drop   |
| ---------- | ----------- | ------------ | -------------- | ------ |
| `shield.0` | 0.035       | 0.035        | 78.0           | -0.000 |
| `shield.1` | 0.035       | 0.035        | 78.0           | 0.000  |
| `shield.2` | 0.035       | 0.035        | 78.0           | -0.004 |
| `shield.3` | 0.035       | 0.035        | 78.0           | -0.011 |
| `shield.4` | 0.035       | 0.035        | 78.0           | -0.020 |
| `sign`     | 0.020       | 0.000        | 58.0           | 0.006  |

This run does not pass as a whole:

- `interior-difference`, `joint-loops`, `chirality`, `part-coverage`, `ground-contact` and `foot-bones` pass.
- `turntable`, `self-intersection`, `attachment-anchor` and `palette` fail.
- `region-coverage` gives an error, because the Unit Spec has no `regions`.

The move did not cause these results, because the mesh data of the Raw Export did not change. #187 owns them.

The same measurement on the other walls:

| Script | Pass | Do not pass |
| --- | --- | --- |
| Bramble Nest | `arch`, `loop.0` to `loop.4` and `sign`: 70 to 71 degrees | none |
| Bonestake Palisade | `stakes.0` to `stakes.4` and `totem`: 70 to 80 degrees | none |
| Junk Barricade | `barrels`, `crates`, `door`, `pots` and `sign`: 56 to 74 degrees | none |
| Town Barricade | `beam.L`, `beam.R`, `crate` and `shield`: 46 to 70 degrees | none |
| Dawn Reliquary | none | `pillar.A`, `pillar.B`: 17 to 22 degrees, `door.A`, `door.B`: 8 to 10 degrees |

The sandbags, the log and the paper of Town Barricade are not big pieces, so they are not in this table. The sandbags lie in rows and fall straight down, by up to 0.2. The paper is flat on the ground, and it tilts 30 degrees.

The death of Dawn Reliquary is a burst: the doors open and the pillars lean apart. So it does not pass this Review Gate today. #187 must change its clip and refresh its Source Contract, or say that a shrine has no big pieces.

The owner of this project has not confirmed the list of big pieces. It comes from the header comment of each script and from the survey.

### Skinning rule and clip slots

The Body Regions cannot separate the pieces, because a wall has no limbs. So the rule is one sentence: a `base` part stays when the pieces fall, so it uses only `root` and `base`. The rule passes 79 of the 79 parts of the 6 scripts.

The plan uses the shared slots, and all clips of the survey agree with them. Bramble Nest is the only structure with a cast clip, and it has 24 frames.

No script of the survey has a constraint, so this plan has no IK.

### Bone Rampart

The Source Contract did not change. After the move, `bun unit-model:contract:check bone-rampart` passes: the bounds, 16 bones, 8 clip durations and 8 keyframe digests are the same to the last bit. We did not pack the Published Model again. It overrides no value of the table.

| Source Contract field   | Grand Gearjammer | Bone Rampart  |
| ----------------------- | ---------------- | ------------- |
| Bounds                  | 0 changes        | 0 changes     |
| Skin bone count         | 22, 0 changes    | 16, 0 changes |
| Clip durations          | 8, 0 changes     | 8, 0 changes  |
| Keyframe digests        | 8, 0 changes     | 8, 0 changes  |
| `source-contracts.json` | no change        | no change     |

This table is the result of the Body Plan move. The later move to the Clip Library changed the `walk` digest of Grand Gearjammer, because its gear made a half turn in a loop. See `clips/README.md`.

We also compared the data of a new Raw Export with an export of the old script. Positions, colors, joints, weights, parts, regions and bind matrices are the same. The triangle index bytes are different, as for Crag Rhino. 2 of 5,230 normals can also change, by 0.00009 at most, but this also occurs when you run the old script two times. An export of the old script can have the same normals as an export of the new script.

### Scripts that can move

The survey put the shared values in the table, then compared the bones with each `BONES`. All 5 give the same bones. A script that moves must set `footBones` in its Unit Spec, and each script needs a Unit Spec before it can run the Review Gates.

- 4 scripts can move now: bonestake-palisade, bramble-nest, junk-barricade and town-barricade.
- dawn-reliquary can use the bones, but it does not pass `foot-bones`. See above.
