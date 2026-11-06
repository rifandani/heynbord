"""Run with python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'."""

import ast
import json
from pathlib import Path
import unittest

from body_plans import BODY_PLANS
from clips import CLIP_LIBRARY, biped_medium, machine
from clips.base import Beat, X, Y, Z
from clips.overrides import Fall, Patch, build


def tools():
    """Plain `t` and `at`, so a pose can be read with no Blender."""

    def t(bone, *rotations):
        return ("turn", bone, rotations)

    def at(bone, offset):
        return ("shift", bone, offset)

    return t, at


def clips_by_name(poses_type, base_clips, patches=(), without=()):
    return {clip.name: clip for clip in build(base_clips, poses_type(*tools()), patches, without)}


def frames(clip):
    return [frame for frame, _ in clip.keys]


def rounded_tools():
    """Tools that make 2 equal poses equal: a turn of 360 degrees is no turn."""

    def t(bone, *rotations):
        return (bone, tuple((axis, round(degrees, 9) % 360) for axis, degrees in rotations))

    def at(bone, offset):
        return (bone, tuple(round(value, 9) + 0.0 for value in offset))

    return t, at


DIRECTORY = Path(__file__).resolve().parent
# The Unit Specs of the moved units. The other 3 moved units have no Unit Spec yet.
MOVED_WITH_SPECS = ("warden-saelith", "crag-rhino", "amberwing-dart", "bone-rampart")


class BaseClips(unittest.TestCase):
    def setUp(self):
        self.clips = clips_by_name(biped_medium.Poses, biped_medium.CLIPS)

    def test_a_plan_builds_its_nine_clips_in_slot_order(self):
        self.assertEqual(list(self.clips), ["idle", "lowHp", "walk", "attack", "cast", "hurt", "death", "rebirth", "summon"])

    def test_the_base_clip_owns_the_timing_of_a_hit(self):
        self.assertEqual(self.clips["hurt"].frames, 16)
        self.assertEqual(frames(self.clips["hurt"]), [0, 3, 8, 16])

    def test_the_base_clip_owns_the_weight_of_a_hit(self):
        _, first = self.clips["hurt"].keys[1]
        _, second = self.clips["hurt"].keys[2]
        self.assertEqual(first["spine"], ("turn", "spine", ((X, -10.0),)))
        self.assertEqual(second["spine"], ("turn", "spine", ((X, -4.0),)))

    def test_a_loop_keeps_its_loop_flag(self):
        self.assertTrue(self.clips["idle"].loop)
        self.assertFalse(self.clips["death"].loop)


class EachPlan(unittest.TestCase):
    def each_clip(self, tools_of=tools):
        """Each (plan, clip) of the library."""
        for name, library in CLIP_LIBRARY.items():
            for clip in build(library.CLIPS, library.Poses(*tools_of())):
                yield name, clip

    def test_each_body_plan_has_a_clip_set(self):
        self.assertEqual(set(CLIP_LIBRARY), set(BODY_PLANS))

    def test_each_plan_has_the_nine_base_clips(self):
        for name, library in CLIP_LIBRARY.items():
            self.assertEqual(list(library.CLIPS), ["idle", "lowHp", "walk", "attack", "cast", "hurt", "death", "rebirth", "summon"], name)

    def test_each_clip_has_the_length_and_the_loop_of_its_slot(self):
        for name, clip in self.each_clip():
            self.assertEqual((clip.name, clip.frames, clip.loop), BODY_PLANS[name].CLIP_SLOTS[clip.name], name)

    def test_each_clip_starts_at_frame_0_ends_at_its_last_frame_and_goes_forward(self):
        for name, clip in self.each_clip():
            keys = frames(clip)
            self.assertEqual((keys[0], keys[-1]), (0, clip.frames), (name, clip.name))
            self.assertEqual(keys, sorted(set(keys)), (name, clip.name))

    def test_each_loop_ends_with_the_pose_that_it_starts_with(self):
        for name, clip in self.each_clip(rounded_tools):
            if clip.loop:
                self.assertEqual(clip.keys[0][1], clip.keys[-1][1], (name, clip.name))

    def test_each_clip_moves_a_bone(self):
        for name, clip in self.each_clip():
            self.assertGreater(len({repr(pose) for _, pose in clip.keys}), 1, (name, clip.name))

    def test_a_base_clip_keys_only_bones_of_its_plan(self):
        for name, library in CLIP_LIBRARY.items():
            plan = BODY_PLANS[name]
            known = {bone[0] for bone in plan.bones(plan.Proportions())}
            used = set()

            def t(bone, *rotations):
                used.add(bone)

            def at(bone, offset):
                used.add(bone)

            build(library.CLIPS, library.Poses(t, at))
            self.assertLessEqual(used, known, name)


class Machine(unittest.TestCase):
    def test_a_walk_ends_with_the_gear_at_a_full_turn(self):
        gears = []

        class Unit(machine.Poses):
            def stance(self, rumble=0.0, gear=0.0, bob=0.0, look=0.0):
                gears.append(gear)
                return super().stance(rumble, gear, bob, look)

        build({"walk": machine.CLIPS["walk"]}, Unit(*tools()))
        self.assertEqual(gears[-1] % 360, 0)


class MovedUnits(unittest.TestCase):
    def test_each_override_of_a_unit_spec_is_a_patch_of_its_script(self):
        for unit in MOVED_WITH_SPECS:
            with self.subTest(unit=unit):
                spec = json.loads((DIRECTORY / "specs" / f"{unit}.json").read_text(encoding="utf-8"))
                expected = {(clip, slot["override"]) for clip, slot in spec["clips"].items() if "override" in slot}
                tree = ast.parse((DIRECTORY / f"{unit}.py").read_text(encoding="utf-8"))
                patches = {
                    (node.args[0].value, node.args[1].value)
                    for node in ast.walk(tree)
                    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "Patch"
                }
                self.assertEqual(patches, expected)


class Overrides(unittest.TestCase):
    def test_a_unit_changes_a_role_and_keeps_the_rest_of_its_base_pose(self):
        class Unit(biped_medium.Poses):
            def recoil(self, base, amount=1.0):
                return self.pose(super().recoil(base, amount), spine=self.t("spine", (X, 99)))

        clips = clips_by_name(Unit, biped_medium.CLIPS)
        _, hit = clips["hurt"].keys[1]
        self.assertEqual(hit["spine"], ("turn", "spine", ((X, 99),)))
        self.assertEqual(hit["head"], ("turn", "head", ((X, -14.0), (Z, 8.0))))

    def test_the_stance_of_a_unit_is_under_each_role(self):
        class Unit(biped_medium.Poses):
            def stance(self, *args):
                return {"quiver": "held"}

        _, hit = clips_by_name(Unit, biped_medium.CLIPS)["hurt"].keys[1]
        self.assertEqual(hit["quiver"], "held")

    def test_a_role_can_keep_a_bone_at_the_stance(self):
        class Unit(biped_medium.Poses):
            def stance(self, *args):
                return {"chest": "stance chest"}

            def recoil(self, base, amount=1.0):
                return self.unchanged(super().recoil(base, amount), base, "chest", "spine")

        _, hit = clips_by_name(Unit, biped_medium.CLIPS)["hurt"].keys[1]
        self.assertEqual(hit["chest"], "stance chest")
        self.assertNotIn("spine", hit)

    def test_the_fall_direction_sets_the_root_of_each_fallen_key(self):
        class Unit(biped_medium.Poses):
            fall = Fall(Y, 84, (-0.36, 0, 0.2))

        clips = clips_by_name(Unit, biped_medium.CLIPS)
        _, down = clips["death"].keys[3]
        _, bounce = clips["death"].keys[4]
        self.assertEqual(down["root"], ("turn", "root", ((Y, 84.0),)))
        self.assertEqual(down["root@loc"], ("shift", "root", (-0.36, 0, 0.2)))
        self.assertEqual(bounce["root"], ("turn", "root", ((Y, 78.0),)))

    def test_a_bounce_turns_a_fall_on_the_back_toward_upright(self):
        clips = clips_by_name(biped_medium.Poses, biped_medium.CLIPS)
        _, bounce = clips["death"].keys[4]
        self.assertEqual(bounce["root"], ("turn", "root", ((X, -80.0),)))

    def test_a_patch_replaces_the_timing_of_one_clip_only(self):
        patch = Patch("walk", "swift-stride", beats=(Beat(0), Beat(20)), frames=20)
        clips = clips_by_name(biped_medium.Poses, biped_medium.CLIPS, [patch])
        self.assertEqual((clips["walk"].frames, frames(clips["walk"])), (20, [0, 20]))
        self.assertTrue(clips["walk"].loop)
        self.assertEqual(frames(clips["hurt"]), [0, 3, 8, 16])

    def test_a_patch_with_no_beats_keeps_the_base_timing(self):
        clips = clips_by_name(biped_medium.Poses, biped_medium.CLIPS, [Patch("death", "fall-left")])
        self.assertEqual(frames(clips["death"]), [0, 5, 12, 26, 30, 36])

    def test_a_unit_leaves_out_the_optional_clips_that_it_does_not_have(self):
        clips = clips_by_name(biped_medium.Poses, biped_medium.CLIPS, without=("cast", "rebirth"))
        self.assertEqual(list(clips), ["idle", "lowHp", "walk", "attack", "hurt", "death", "summon"])

    def test_a_patch_must_name_a_base_clip(self):
        with self.assertRaisesRegex(ValueError, "no base clip \\['dance'\\]"):
            clips_by_name(biped_medium.Poses, biped_medium.CLIPS, [Patch("dance", "jig")])

    def test_a_left_out_clip_must_name_a_base_clip(self):
        with self.assertRaisesRegex(ValueError, "no base clip \\['dance'\\]"):
            clips_by_name(biped_medium.Poses, biped_medium.CLIPS, without=("dance",))


if __name__ == "__main__":
    unittest.main()
