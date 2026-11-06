# Clip Library

The Clip Library has the Base Clips of each Body Plan, and a small override for each unit. The 9 Base Clips are `idle`, `lowHp`, `walk`, `attack`, `cast`, `hurt`, `death`, `rebirth` and `summon`.

```sh
python3 -m unittest discover -s scripts/unit-model -p 'test_clip_library.py'
bun unit-model:clips:check warden-saelith [name...]   # or --all. It reads the Raw Exports.
rtk bun run web:test:unit clip-checks
```

## What a plan gives

A plan module, for example `biped_medium.py`, gives 2 things:

- `CLIPS`: a `BaseClip` for each slot. Each Base Clip is a list of `Beat` values. A beat gives the frame, a role, and the arguments of the role. So the beats own the timing and the weight. For example, the `recoil` of `hurt` has an amount of 1.0 at frame 3 and 0.4 at frame 8.
- `Poses`: a class with one method for each role. The poses own the ground contact, for example the drop of the hips in a `crouch` and the `Fall` of a `death`.

A Base Clip keys only the bones of its plan, so it plays on each unit of the plan. `flyer` keys only `root` and `body`. `machine` keys only `root`, the carrier and the wheels. `structure` keys only `base`, because the pieces of a wall are bones of each unit.

`clips/` does not need Blender. `kit.pose_tools(rig)` gives `Poses` its `t` and `at` functions.

## How a unit moves

A unit subclasses the `Poses` of its plan. A method calls `super()` and changes only what is different. `self.unchanged(posed, base, "hips")` keeps a bone at the stance, for a bone that the base role moves and the unit does not.

```python
PATCHES = (Patch("attack", "bow-draw", beats=(Beat(0), Beat(2, "aiming", (NOCKED, 1.0)), Beat(30))),)


class Poses(clips.biped_medium.Poses):
    fall = Fall(X, -86, (0, 0, 0.045))  # the fall direction, and the height that keeps the body on the ground

    def recoil(self, base, amount=1.0):
        return self.pose(super().recoil(base, amount), braid1=self.t("braid1", (X, 14 * amount)))


def build_clips(rig):
    return clips.overrides.build(clips.biped_medium.CLIPS, Poses(*kit.pose_tools(rig)), PATCHES, without=("cast",))
```

A `Patch` names a Base Clip and an override. Its `name` is the `override` of the Unit Spec, and `test_clip_library.py` compares them. With no `beats`, a `Patch` changes nothing: it only records the override, and the change is in `Poses`. `beats` and `frames` replace the timing. `without` names the optional clips that the unit does not have.

After a move, build the Raw Export and run `bun unit-model:contract:check <name>`. A difference of one bit fails. On 2026-11-06 we put a wrong beat in `biped.py` as a test, and this check failed. So the check does read the clips.

## The survey

The survey read all 98 build scripts with the Python `ast` module. It found the plan of each script in the lists of `body_plans/README.md`.

No two scripts have the same pose code: `recoil`, `fallen` and `stagger` have 38 different texts in the 38 biped-medium scripts. So the survey counted each pose entry of a role. A default is the most common value of an entry that at least half of the scripts have. For a tie, the default is the value of the moved unit. `flyer` and `machine` have 3 and 4 scripts and almost no common value, so most defaults are the values of Amberwing Dart and Grand Gearjammer.

The stance has the weakest count. For example, the most common `spine` of the biped-medium stance has a count of 2 of 34. So each moved biped keeps its own stance.

This table gives the count of scripts with the base timing of each clip:

| Clip | biped-medium | biped-small | biped-large | quadruped | flyer | machine | structure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| idle | 17 of 38 | 0 of 12 | 2 of 15 | 6 of 11 | 1 of 3 | 3 of 4 | 3 of 6 |
| lowHp | 20 of 38 | 6 of 12 | 12 of 15 | 10 of 11 | 2 of 3 | 2 of 4 | 5 of 6 |
| walk | 23 of 38 | 5 of 12 | 7 of 15 | 3 of 11 | 1 of 3 | 1 of 4 | 6 of 6 |
| attack | 4 of 38 | 2 of 12 | 9 of 15 | 3 of 11 | 1 of 3 | 1 of 4 | 6 of 6 |
| cast | 4 of 14 | 0 of 0 | 1 of 4 | 1 of 2 | 0 of 0 | 0 of 0 | 1 of 1 |
| hurt | 37 of 38 | 12 of 12 | 14 of 15 | 11 of 11 | 1 of 3 | 4 of 4 | 6 of 6 |
| death | 32 of 38 | 4 of 12 | 11 of 15 | 11 of 11 | 1 of 3 | 2 of 4 | 3 of 6 |
| rebirth | 23 of 33 | 9 of 12 | 9 of 14 | 1 of 1 | 1 of 1 | 2 of 4 | 5 of 6 |
| summon | 29 of 38 | 11 of 12 | 10 of 15 | 8 of 11 | 1 of 3 | 3 of 4 | 3 of 6 |

The attack is the clip of each unit's own action: biped-medium has 29 different timings in 38 scripts. So most units need a `Patch` for `attack`. The biped-small `idle` uses the shared biped beats, because each goblin script has its own idle beats.

No script gives a pose where the count is 0 of 0. The biped-small `call` is the pose of biped-medium. The `flyer`, `machine` and `structure` casts reuse the `rear` and `jolt` roles. These 4 poses have no moved unit, so no Source Contract tests them.

## Override record

Each moved unit keeps its clip durations and its keyframe digests, with one approved exception: the `walk` of Grand Gearjammer. On 2026-11-06, after a new build of each Raw Export, `bun unit-model:contract:check` passed for all 7 units. We packed only Grand Gearjammer again.

"Base timing" is the count of clips that use the beats of the plan. "Lines" compares `build_clips` before the move with `PATCHES`, `Poses` and `build_clips` after the move.

| Unit | Plan | Clips | Base timing | Own timing | Lines |
| --- | --- | --- | --- | --- | --- |
| Warden Saelith | biped-medium | 9 | 8 | `attack` | 298 to 208 |
| Fuse Runner | biped-small | 8 | 2 | `idle`, `lowHp`, `walk`, `attack`, `death`, `rebirth` | 275 to 282 |
| Tusk Brute | biped-large | 8 | 4 | `idle`, `walk`, `attack`, `death` | 293 to 231 |
| Crag Rhino | quadruped | 7 | 6 | `walk`, of 20 frames | 219 to 58 |
| Amberwing Dart | flyer | 7 | 7 | none | 200 to 136 |
| Grand Gearjammer | machine | 8 | 8 | none | 200 to 135 |
| Bone Rampart | structure | 8 | 8 | none | 202 to 152 |
| Boss Snikkit | machine | 8 | 4 | `idle`, `lowHp`, `walk`, `attack` | 220 to 184 |
| Junk Walker | machine | 8 | 1 | `idle`, `lowHp`, `walk`, `attack`, `death`, `rebirth`, `summon` | 279 to 279 |
| Rocket Barrel Rider | machine | 8 | 1 | `idle`, `lowHp`, `walk`, of 16 frames, `attack`, `death`, `rebirth`, `summon` | 228 to 290 |

The 7 scripts have 485 fewer lines (1,687 to 1,202), and the library has 1,492 lines. So the line count goes down only when more units move. Amberwing Dart and Grand Gearjammer have 0 changes of timing. The survey took their values for ties, so they do not test the base timing.

These are the `Patch` names:

| Unit | Patches |
| --- | --- |
| Warden Saelith | `attack` bow-draw |
| Fuse Runner | `idle` spark-flicker, `lowHp` short-fuse, `walk` swift-stride, `attack` bomb-bonk, `death` last-breath-blast, `rebirth` fuse-out |
| Tusk Brute | `idle` roar, `walk` heavy-stomp, `attack` club-smash, `death` slow-fall |
| Crag Rhino | `walk` heavy-trot, `attack` horn-charge, `death` fall-left |
| Amberwing Dart | `walk` hover-dart, `attack` lance-dive, `death` fall-left |
| Grand Gearjammer | `attack` cannon-shot, `death` tip-right |
| Bone Rampart | `walk` wall-heave, `attack` hammer-smash, `death` wall-collapse, `rebirth` wall-rebuild |
| Boss Snikkit | `idle` cackle, `lowHp` slump, `walk` small-wheels, `attack` torch-strike |
| Junk Walker | `idle` engine-thrum, `lowHp` steam-leak, `walk` pipe-stride, `attack` claw-snap, `death` buckle-tip, `rebirth` buckle-rise, `summon` steam-drop |
| Rocket Barrel Rider | `idle` barrel-hover, `lowHp` barrel-sputter, `walk` swift-flight, `attack` barrel-ram, `death` barrel-blast, `rebirth` barrel-crash, `summon` rocket-launch |

These are the roles of each unit. "Fall" is yes if the unit sets its own `fall`:

| Unit | Fall | Roles that the unit changes or adds |
| --- | --- | --- |
| Warden Saelith | yes | `stance`, `slump`, `recoil`, `fallen`, `stagger`, `crouch`, `rising`, `heroic`, `step`, `passing`, `call`, `side_on`, `aiming` |
| Fuse Runner | yes | `stance`, `slump`, `recoil`, `fallen`, `fainted`, `flare`, `bang`, `blown`, `crouch`, `rising`, `heroic`, `stride`, `windup`, `strike`, `startled` |
| Tusk Brute | yes | `stance`, `slump`, `recoil`, `stagger`, `fallen`, `crouch`, `rising`, `heroic`, `step`, `windup`, `strike` |
| Crag Rhino | no | `ears`, `stance`, `gasp`, `recoil`, `buckle`, `fallen`, `low`, `snort`, `stride`, `paw`, `charge`, `toss` |
| Amberwing Dart | no | `wings`, `vines`, `tail`, `stance`, `droop`, `dart`, `rear`, `dive`, `recover`, `knocked`, `falling`, `fallen`, `folded`, `unfold` |
| Grand Gearjammer | no | `crew`, `goblins`, `stance`, `broken`, `rolling`, `aim`, `fire`, `jolt`, `tipped`, `tilting`, `cheer` |
| Bone Rampart | no | `lean`, `stance`, `battered`, `jolt`, `fallen`, `falling`, `heave`, `windup`, `smash` |

### A patch is larger than the plan of #183

Issue #183 says that a unit overrides only the prop path, the effect bone or the fall direction. That is not enough if the digests must not change. The units have different pose values and different timing, so a moved unit also overrides these values. Fuse Runner shows the limit. It has an effect in most clips, and its line count did not go down. 6 of its 8 clips have their own timing. A new unit can stay in the small patch. An existing unit can do this only if a person approves a change of its Source Contract.

## Clip checks

`apps/web/scripts/clip-checks.ts` reads a Raw Export with Three.js and the mixer of the game. It is in `apps/web` because only that package has `three`. The command exits 0 clean, 1 fail or 2 error.

| Check | Clips | Measures | Limit |
| --- | --- | --- | --- |
| `binding` | all | each track against its joint, at 5 times of the clip | 2^-23, and each track must find its node |
| `loopClosure` | `idle`, `lowHp` | the largest change of a track value from the first key to the last | 0.0001 |
| `poseReturn` | `idle`, `lowHp`, `walk` | the largest joint rotation from the first key to the last | 0.5 degrees |
| `hipReturn` | `idle`, `lowHp`, `walk` | the distance that `hips` moves, or the first bone under `root` | 0.01 of the height |
| `ground` | `death`, `hurt` | the lowest vertex at each frame, below the lowest vertex at rest | 0.06 of the height |

`binding` is G1 of the img2threejs rig gates, and `poseReturn` and `hipReturn` are its loop rule. The game puts the lowest point of the rest pose on the ground, so `ground` uses that height.

The `ground` limit comes from the moved units, because their digests must not change. The deepest value is 0.053 of the height. The owner of the project accepted this limit for now on 2026-11-06. At 0.01 of the height, 6 of the 7 moved units fail. Tighten the limit when these clips change:

| Unit | Deepest part | Depth (share of the height) | Vertices below 0.01 |
| --- | --- | --- | --- |
| Tusk Brute | `boot.R` in `death` | 0.053 | 6 of 3,610 |
| Warden Saelith | `head`, `hair` and `braid` in `death` | 0.045 | 159 of 3,349 |
| Crag Rhino | `foot.BL` in `death` | 0.035 | 7 of 3,594 |
| Amberwing Dart | `wing.FL` in `death` | 0.020 | 13 of 2,435 |
| Grand Gearjammer | `wheel.BL` in `hurt` and `death` | 0.014 | 3 of 3,582 |
| Fuse Runner | `foot.L` in `hurt` and `death` | 0.011 | 2 of 2,938 |
| Bone Rampart | none | 0.008 | 0 of 5,230 |

The head of Warden Saelith is the one visible fault in this table. The fix changes her `death` digest.

### Result on 2026-11-06

All 7 moved units pass.

The `walk` of Grand Gearjammer failed `poseReturn` after the move. It ended with the `gear` bone at 180 degrees, because the script turned the gear by half of the wheel angle. The gear has 12 teeth and 5 spokes, so a turn of 180 degrees is not a symmetry. So the spokes jumped when the loop started again. The owner of the project approved the fix: the gear now makes a full turn in `walk`. The Source Contract and the Published Model of Grand Gearjammer are new. Only the `walk` digest changed. Its bounds, its bones and its 7 other digests did not change.

Of the 98 models, 63 pass. The failures in the other units are for #185 to #187:

- `ground` in `death`: 35 models, with Tunnel Saboteur the deepest at 1.18 of the height and Thornline Archer at 0.30.
- `ground` in `hurt`: Coffin Lancer at 0.066.
- `loopClosure` and `poseReturn`: `sun` of Dawn Reliquary in `idle`, `motes` of Restless Wisp in `lowHp`, and `seeds` of Seedwind Shepherd in `walk`. These can be correct if the part has the symmetry of its turn. No person has looked at them.

What the clip checks cannot see:

- `ground` reads the Raw Export bones and vertices, so it does not know the height of the ground in a Battle. It does not include the 0.02 lift of `FOOT_Y` in `unit-rig.ts`.
- `poseReturn` cannot see a symmetry, so a correct spin of a round part fails it.
- `loopClosure` and `poseReturn` compare the first and last keys. They do not find a jump between 2 other keys.
- `binding` proves that the mixer drives each joint. It does not prove that the skin follows the joint.
- The checks do not read `cast`, `attack`, `rebirth` or `summon` for the ground.
