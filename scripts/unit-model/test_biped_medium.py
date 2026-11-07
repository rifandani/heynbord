"""Run with python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'."""

import json
from pathlib import Path
from types import SimpleNamespace
import unittest

from body_plans import BODY_PLANS
from body_plans import biped_medium as plan
from unit_regions import region_id
from unit_spec import load_spec

DIRECTORY = Path(__file__).resolve().parent


class ProportionTable(unittest.TestCase):
    def test_the_table_has_the_most_common_values_of_the_survey(self):
        table = plan.Proportions()
        self.assertAlmostEqual(table.head_units, 5.389, places=3)
        self.assertEqual(table.shoulder_width, 0.2)
        self.assertEqual(table.hip_z, 0.47)
        self.assertAlmostEqual(table.arm_length, 0.345)
        self.assertAlmostEqual(table.leg_length, 0.42)

    def test_a_unit_overrides_only_the_values_that_it_names(self):
        table = plan.Proportions(arm_angle=25)
        self.assertEqual(table.arm_angle, 25)
        self.assertEqual(table.hip_z, plan.Proportions().hip_z)

    def test_an_unknown_value_is_refused(self):
        with self.assertRaises(TypeError):
            plan.Proportions(tail_length=0.2)

    def test_landmarks_in_the_wrong_order_are_refused(self):
        with self.assertRaisesRegex(ValueError, "hip_z"):
            plan.Proportions(hip_z=0.6)


class Skeleton(unittest.TestCase):
    def test_the_core_bones_have_a_fixed_order(self):
        names = [bone[0] for bone in plan.bones(plan.Proportions())]
        sides = ("shoulder", "upperarm", "forearm", "hand", "thigh", "shin", "foot")
        self.assertEqual(
            names,
            ["root", "hips", "spine", "chest", "neck", "head"]
            + [f"{bone}.L" for bone in sides]
            + [f"{bone}.R" for bone in sides],
        )

    def test_a_unit_adds_bones_after_the_head_and_after_the_limbs(self):
        braid = ("braid", (0, 0.07, 0.88), (0, 0.1, 0.75), "head")
        bow = ("bow", (0.2, 0, 0.4), (0.2, 0, 0.5), "hand.L")
        names = [bone[0] for bone in plan.bones(plan.Proportions(), trunk=[braid], props=[bow])]
        self.assertEqual(names[5:8], ["head", "braid", "shoulder.L"])
        self.assertEqual(names[-1], "bow")

    def test_a_bone_gets_its_position_from_the_table(self):
        table = plan.Proportions(hip_z=0.46, waist_z=0.54)
        bones = {bone[0]: bone for bone in plan.bones(table)}
        self.assertEqual(bones["hips"], ("hips", (0, 0, 0.46), (0, 0, 0.54), "root"))

    def test_the_right_side_mirrors_the_left_side(self):
        bones = {bone[0]: bone for bone in plan.bones(plan.Proportions())}
        for name in ("shoulder", "upperarm", "forearm", "hand", "thigh", "shin", "foot"):
            left, right = bones[f"{name}.L"], bones[f"{name}.R"]
            self.assertEqual((-right[1][0], right[1][2]), (left[1][0], left[1][2]))
            self.assertEqual((-right[2][0], right[2][2]), (left[2][0], left[2][2]))

    def test_an_arm_goes_straight_down_at_angle_zero(self):
        shoulder, elbow, wrist, tip, direction = plan.arm_points(plan.Proportions(arm_angle=0), 1)
        self.assertEqual(shoulder, (0.1, 0, 0.725))
        self.assertAlmostEqual(elbow[2], 0.575, places=6)
        self.assertAlmostEqual(wrist[2], 0.435, places=6)
        self.assertAlmostEqual(tip[2], 0.38, places=6)
        self.assertEqual(direction, (0.0, 0, -1.0))

    def test_an_arm_keeps_the_32_bit_values_of_the_warden_saelith_rig(self):
        # A Blender Vector rounds at each step, and the keyframe digest sees the last bit.
        _, elbow, wrist, tip, _ = plan.arm_points(plan.Proportions(arm_angle=25), 1)
        self.assertEqual(elbow, (0.16339275240898132, 0, 0.5890538692474365))
        self.assertEqual(wrist, (0.22255930304527283, 0, 0.4621707797050476))
        self.assertEqual(tip, (0.24580331146717072, 0, 0.41232386231422424))

    def test_a_duplicate_bone_is_refused(self):
        with self.assertRaisesRegex(ValueError, "duplicate bone 'head'"):
            plan.bones(plan.Proportions(), trunk=[("head", (0, 0, 0), (0, 0, 1), "neck")])

    def test_a_bone_needs_a_parent_that_is_before_it(self):
        with self.assertRaisesRegex(ValueError, "'bow' has no parent 'grip'"):
            plan.bones(plan.Proportions(), props=[("bow", (0, 0, 0), (0, 0, 1), "grip")])


def part(name, region, *used):
    return SimpleNamespace(name=name, region=region_id(region), bones=set(used))


class SkinningRule(unittest.TestCase):
    parents = {
        bone[0]: bone[3]
        for bone in plan.bones(
            plan.Proportions(),
            trunk=[("braid1", (0, 0, 0), (0, 0, 1), "head"), ("tail1", (0, 0, 0), (0, 0, 1), "hips")],
            props=[("bow", (0, 0, 0), (0, 0, 1), "hand.L"), ("string", (0, 0, 0), (0, 0, 1), "bow")],
        )
    }

    def problems(self, *parts):
        return plan.skin_problems(parts, self.parents)

    def test_a_part_may_use_the_bones_of_its_region(self):
        self.assertEqual(self.problems(part("sleeve.L", "arm.L", "upperarm.L", "forearm.L")), [])

    def test_a_coat_may_follow_both_thighs(self):
        self.assertEqual(self.problems(part("skirt", "torso", "hips", "thigh.L", "thigh.R")), [])

    def test_a_part_must_not_use_the_bones_of_another_limb(self):
        self.assertEqual(
            self.problems(part("sleeve.L", "arm.L", "upperarm.L", "hand.R")),
            ["sleeve.L: arm.L part must not use bone 'hand.R'"],
        )

    def test_a_leg_must_not_use_the_other_leg(self):
        self.assertEqual(
            self.problems(part("boot.L", "leg.L", "shin.R")),
            ["boot.L: leg.L part must not use bone 'shin.R'"],
        )

    def test_a_unit_bone_belongs_to_the_core_bone_that_holds_it(self):
        self.assertEqual(self.problems(part("braid", "head", "braid1", "head")), [])
        self.assertEqual(
            self.problems(part("braid", "head", "tail1")),
            ["braid: head part must not use bone 'tail1'"],
        )

    def test_a_prop_may_use_any_bone(self):
        self.assertEqual(self.problems(part("quiver", "prop", "hips"), part("string", "prop", "bow", "string")), [])


class ClipSlots(unittest.TestCase):
    def test_each_slot_has_its_most_common_frame_count(self):
        self.assertEqual(
            {slot.name: (slot.frames, slot.loop) for slot in plan.CLIP_SLOTS.values()},
            {
                "idle": (48, True),
                "lowHp": (48, True),
                "walk": (24, True),
                "attack": (30, False),
                "cast": (24, False),
                "hurt": (16, False),
                "death": (36, False),
                "rebirth": (48, False),
                "summon": (24, False),
            },
        )

    def test_a_unit_spec_uses_only_clip_slots_of_its_plan(self):
        spec = load_spec(DIRECTORY / "specs" / "warden-saelith.json")
        self.assertLessEqual(set(spec["clips"]), set(plan.CLIP_SLOTS))


class Registry(unittest.TestCase):
    def test_the_unit_spec_name_finds_the_plan(self):
        spec = load_spec(DIRECTORY / "specs" / "warden-saelith.json")
        self.assertIs(BODY_PLANS[spec["bodyPlan"]], plan)

    def test_the_schema_knows_the_plan(self):
        schema = json.loads((DIRECTORY / "unit-spec.schema.json").read_text(encoding="utf-8"))
        self.assertIn(plan.NAME, schema["properties"]["bodyPlan"]["enum"])


if __name__ == "__main__":
    unittest.main()
