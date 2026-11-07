"""Run with python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'."""

import json
from pathlib import Path
from types import SimpleNamespace
import unittest

from body_plans import BODY_PLANS
from body_plans import biped_large as large
from body_plans import biped_medium as medium
from body_plans import biped_small as small
from unit_regions import region_id

DIRECTORY = Path(__file__).resolve().parent

# The bent arm of Tusk Brute: the elbow, the wrist and the fingertips.
BENT_L = ((0.255, -0.01, 0.63), (0.275, -0.05, 0.48), (0.2827, -0.0653, 0.4225))
BENT_R = ((-0.255, -0.01, 0.63), (-0.275, -0.05, 0.48), (-0.28, -0.07, 0.43))


def bones_of(plan, **options):
    return {bone[0]: bone for bone in plan.bones(plan.Proportions(), **options)}


class SmallTable(unittest.TestCase):
    def test_the_table_has_the_most_common_values_of_the_goblin_survey(self):
        table = small.Proportions()
        self.assertAlmostEqual(table.head_units, 3.833, places=3)
        self.assertEqual(table.shoulder_width, 0.184)
        self.assertEqual(table.hip_z, 0.3)
        self.assertAlmostEqual(table.leg_length, 0.26)
        self.assertEqual(table.ankle_z, 0.04)
        self.assertEqual(table.head_top_z, 0.69)
        self.assertEqual(table.head_top_y, -0.01)

    def test_the_arm_length_is_near_the_most_common_goblin_arm(self):
        self.assertAlmostEqual(small.Proportions().arm_length, 0.23)


class LargeTable(unittest.TestCase):
    def test_the_table_has_the_most_common_values_of_the_orc_and_troll_survey(self):
        table = large.Proportions()
        self.assertAlmostEqual(table.head_units, 5.875, places=3)
        self.assertEqual(table.shoulder_width, 0.31)
        self.assertEqual(table.hip_z, 0.46)
        self.assertAlmostEqual(table.leg_length, 0.405)
        self.assertEqual(table.ankle_z, 0.055)
        self.assertEqual(table.head_top_z, 0.94)
        self.assertEqual(table.neck_y, -0.01)

    def test_the_arm_length_is_that_of_a_surveyed_orc(self):
        self.assertAlmostEqual(large.Proportions().arm_length, 0.344)

    def test_a_large_figure_is_wider_than_a_medium_figure_and_a_medium_wider_than_a_small(self):
        self.assertLess(small.Proportions().shoulder_width, medium.Proportions().shoulder_width)
        self.assertLess(medium.Proportions().shoulder_width, large.Proportions().shoulder_width)


class JointWeights(unittest.TestCase):
    def test_a_neck_ring_at_the_joint_blends_the_chest_and_the_neck(self):
        weights = medium.neck_weights(medium.Proportions())
        self.assertAlmostEqual(weights(SimpleNamespace(x=0, y=0, z=0.75))["neck"], 0.5)
        self.assertEqual(weights(SimpleNamespace(x=0, y=0, z=0.7)), {"chest": 1, "neck": 0})
        self.assertEqual(weights(SimpleNamespace(x=0, y=0, z=0.8)), {"chest": 0, "neck": 1})

    def test_the_hips_follow_the_thigh_on_their_side_below_the_joint(self):
        weights = medium.hips_weights(medium.Proportions())
        self.assertEqual(weights(SimpleNamespace(x=0.05, y=0, z=0.47)), {"hips": 1, "thigh.L": 0})
        below = weights(SimpleNamespace(x=-0.05, y=0, z=0.42))
        self.assertAlmostEqual(below["hips"], 0.4)
        self.assertAlmostEqual(below["thigh.R"], 0.6)

    def test_a_large_figure_blends_at_its_own_joints(self):
        table = large.Proportions(neck_z=0.77, head_base_z=0.8, head_top_z=0.96)
        self.assertAlmostEqual(large.neck_weights(table)(SimpleNamespace(x=0, y=0, z=0.77))["neck"], 0.5)


class SharedRules(unittest.TestCase):
    def test_a_unit_overrides_only_the_values_that_it_names(self):
        for plan in (small, large):
            with self.subTest(plan.NAME):
                table = plan.Proportions(head_top_y=-0.012)
                self.assertEqual(table.head_top_y, -0.012)
                self.assertEqual(table.hip_z, plan.Proportions().hip_z)

    def test_landmarks_in_the_wrong_order_are_refused(self):
        for plan in (small, large):
            with self.subTest(plan.NAME), self.assertRaisesRegex(ValueError, "hip_z"):
                plan.Proportions(hip_z=plan.Proportions().waist_z)

    def test_each_plan_has_the_core_bones_in_the_fixed_order(self):
        sides = ("shoulder", "upperarm", "forearm", "hand", "thigh", "shin", "foot")
        names = (
            ["root", "hips", "spine", "chest", "neck", "head"]
            + [f"{bone}.L" for bone in sides]
            + [f"{bone}.R" for bone in sides]
        )
        for plan in (small, large):
            with self.subTest(plan.NAME):
                self.assertEqual([bone[0] for bone in plan.bones(plan.Proportions())], names)

    def test_each_plan_gives_the_skinning_rule(self):
        for plan in (small, large):
            with self.subTest(plan.NAME):
                self.assertEqual(plan.SKIN_RULES["head"], {"chest", "neck", "head"})

    def test_a_part_must_not_use_the_bones_of_another_limb(self):
        parents = {bone[0]: bone[3] for bone in small.bones(small.Proportions())}
        sleeve = SimpleNamespace(name="sleeve.L", region=region_id("arm.L"), bones={"hand.R"})
        for plan in (small, large):
            with self.subTest(plan.NAME):
                self.assertEqual(
                    plan.skin_problems([sleeve], parents),
                    ["sleeve.L: arm.L part must not use bone 'hand.R'"],
                )

    def test_each_plan_has_the_shared_clip_slots(self):
        for plan in (small, large):
            with self.subTest(plan.NAME):
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


class HeadLean(unittest.TestCase):
    def test_a_medium_head_stays_on_the_center_line(self):
        bones = bones_of(medium)
        self.assertEqual(bones["neck"][1:], ((0, 0.0, 0.75), (0, 0.0, 0.79), "chest"))
        self.assertEqual(bones["head"][1:], ((0, 0.0, 0.79), (0, 0.0, 0.97), "neck"))

    def test_the_neck_and_the_head_lean_as_the_table_says(self):
        table = large.Proportions(neck_y=-0.015, head_base_y=-0.025, head_top_y=-0.04)
        bones = {bone[0]: bone for bone in large.bones(table)}
        self.assertEqual(bones["neck"][1:3], ((0, -0.015, 0.745), (0, -0.025, 0.78)))
        self.assertEqual(bones["head"][1:3], ((0, -0.025, 0.78), (0, -0.04, 0.94)))

    def test_the_chest_stays_on_the_center_line_when_the_neck_leans(self):
        self.assertEqual(bones_of(large)["chest"][2], (0, 0, 0.745))


class BentArm(unittest.TestCase):
    arms = {"L": BENT_L, "R": BENT_R}

    def test_the_arm_bones_follow_the_override(self):
        bones = bones_of(large, arms=self.arms)
        self.assertEqual(bones["upperarm.L"][2], BENT_L[0])
        self.assertEqual(bones["forearm.L"][1:3], (BENT_L[0], BENT_L[1]))
        self.assertEqual(bones["hand.L"][1:3], (BENT_L[1], BENT_L[2]))

    def test_the_left_and_the_right_arm_need_not_be_mirrors(self):
        self.assertEqual(bones_of(large, arms=self.arms)["hand.R"][2], BENT_R[2])

    def test_the_table_keeps_the_shoulder(self):
        bones = bones_of(large, arms=self.arms)
        self.assertEqual(bones["upperarm.L"][1], (0.155, 0, 0.715))
        self.assertEqual(bones["shoulder.R"][2], (-0.155, 0, 0.715))

    def test_a_script_reads_the_shoulder_from_the_table(self):
        self.assertEqual(large.shoulder_point(large.Proportions(), -1), (-0.155, 0, 0.715))

    def test_blender_points_become_plain_tuples(self):
        joints = tuple(list(point) for point in BENT_L)
        self.assertEqual(bones_of(large, arms={"L": joints, "R": BENT_R})["hand.L"][1], BENT_L[1])


class Registry(unittest.TestCase):
    def test_the_body_plan_names_find_the_plans(self):
        self.assertIs(BODY_PLANS["biped-small"], small)
        self.assertIs(BODY_PLANS["biped-large"], large)

    def test_the_schema_knows_the_plans(self):
        schema = json.loads((DIRECTORY / "unit-spec.schema.json").read_text(encoding="utf-8"))
        self.assertLessEqual({"biped-small", "biped-medium", "biped-large"}, set(schema["properties"]["bodyPlan"]["enum"]))


if __name__ == "__main__":
    unittest.main()
