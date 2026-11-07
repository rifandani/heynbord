"""Run with python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'."""

import json
import math
from pathlib import Path
from types import SimpleNamespace
import unittest

from body_plans import BODY_PLANS
from body_plans import machine, structure
from unit_regions import region_id
from unit_spec import load_spec, validate_spec

DIRECTORY = Path(__file__).resolve().parent


def bones_of(table=None, **options):
    table = table or machine.Proportions()
    return {bone[0]: bone for bone in machine.bones(table, **options)}


def part(name, region, *used):
    return SimpleNamespace(name=name, region=region_id(region), bones=set(used))


class CartLayout(unittest.TestCase):
    def test_the_cart_bone_comes_after_the_root(self):
        names = [bone[0] for bone in machine.bones(machine.Proportions())]
        self.assertEqual(names[:2], ["root", "cart"])

    def test_the_cart_bone_lies_along_the_cart_at_the_axle(self):
        self.assertEqual(bones_of()["cart"], ("cart", (0, 0.22, 0.13), (0, -0.24, 0.13), "root"))

    def test_a_unit_adds_bones_before_the_wheels_and_after_them(self):
        cannon = ("cannon", (0, 0.12, 0.47), (0, 0.02, 0.47), "cart")
        crew = ("crew.body", (0, 0, 0.34), (0, 0, 0.45), "cart")
        names = [bone[0] for bone in machine.bones(machine.Proportions(), trunk=[cannon], props=[crew])]
        self.assertEqual(names, ["root", "cart", "cannon", "wheel.FL", "wheel.FR", "wheel.BL", "wheel.BR", "crew.body"])

    def test_the_wheels_are_at_the_corners_of_the_cart(self):
        centers = machine.wheel_centers(machine.Proportions())
        self.assertEqual(centers["FL"], (0.21, -0.24, 0.13))
        self.assertEqual(centers["BR"], (-0.21, 0.22, 0.13))

    def test_a_wheel_bone_points_up_from_its_center_and_hangs_from_the_cart(self):
        _, head, tail, parent = bones_of()["wheel.FL"]
        self.assertEqual(head, (0.21, -0.24, 0.13))
        for value, expected in zip(tail, (0.21, -0.24, 0.19)):
            self.assertAlmostEqual(value, expected, places=6)
        self.assertEqual(parent, "cart")

    def test_the_cart_must_carry_each_bone(self):
        loose = ("loose", (0, 0, 0), (0, 0, 0.1), "root")
        with self.assertRaisesRegex(ValueError, "'loose' must hang from 'cart'"):
            machine.bones(machine.Proportions(), trunk=[loose])


class WheelTurn(unittest.TestCase):
    def test_each_wheel_turns_about_its_axle(self):
        pose = machine.wheel_pose(lambda bone, *rotations: (bone, rotations), 90)
        self.assertEqual(sorted(pose), ["wheel.BL", "wheel.BR", "wheel.FL", "wheel.FR"])
        self.assertEqual(pose["wheel.BR"], ("wheel.BR", (((1, 0, 0), 90),)))

    def test_the_wheels_of_a_walk_end_at_the_angle_that_they_start(self):
        table = machine.Proportions()
        self.assertEqual(machine.rolling_angle(table, 0, 24), 0)
        self.assertEqual(machine.rolling_angle(table, 24, 24) % 360, 0)

    def test_a_small_wheel_can_turn_two_times_in_a_walk(self):
        table = machine.Proportions(wheel_turns=2)
        self.assertEqual(machine.rolling_angle(table, 6, 24), 180)


class WalkerLayout(unittest.TestCase):
    table = machine.Proportions(
        root_tip_z=0.1,
        carrier="body",
        carrier_y=0,
        carrier_z=0.4,
        carrier_tip_y=0,
        carrier_tip_z=0.6,
        wheels=False,
    )

    def test_a_walker_has_a_body_and_no_wheels(self):
        self.assertEqual(
            machine.bones(self.table),
            [("root", (0, 0, 0), (0, 0, 0.1), None), ("body", (0, 0, 0.4), (0, 0, 0.6), "root")],
        )

    def test_a_walker_may_have_a_bone_on_the_root(self):
        foot = ("foot.L", (0.13, 0, 0.065), (0.13, -0.1, 0.065), "root")
        self.assertIn(foot, machine.bones(self.table, props=[foot]))

    def test_each_foot_hangs_from_the_root_so_that_it_stays_on_the_ground(self):
        bones = {bone[0]: bone for bone in machine.walker_leg(machine.WalkerLegs(), "R", "body")}
        self.assertEqual(bones["foot.R"][3], "root")
        self.assertEqual(bones["thigh.R"][1:], ((-0.13, 0, 0.38), (-0.13, -0.075, 0.21), "body"))
        self.assertEqual(bones["shin.R"][1:], ((-0.13, -0.075, 0.21), (-0.13, 0, 0.065), "thigh.R"))

    def test_the_poles_are_in_front_of_the_legs(self):
        self.assertEqual(
            machine.walker_poles(machine.WalkerLegs(), "body"),
            [
                ("pole.L", (0.13, -0.5, 0.21), (0.13, -0.5, 0.26), "body"),
                ("pole.R", (-0.13, -0.5, 0.21), (-0.13, -0.5, 0.26), "body"),
            ],
        )


class Crew(unittest.TestCase):
    def test_a_crew_member_has_a_body_a_head_and_two_arms(self):
        names = [bone[0] for bone in machine.crew_bones("gunner", (0, 0, 0.34), 1, "cart")]
        self.assertEqual(names, ["gunner.body", "gunner.head", "gunner.arm.L", "gunner.arm.R"])

    def test_the_size_scales_a_crew_member(self):
        bones = {bone[0]: bone for bone in machine.crew_bones("gunner", (0, 0, 0.5), 2, "cart")}
        self.assertAlmostEqual(bones["gunner.body"][2][2], 0.72, places=6)
        self.assertAlmostEqual(bones["gunner.arm.L"][1][0], 0.1, places=6)

    def test_an_arm_is_the_mirror_of_the_other_arm(self):
        bones = {bone[0]: bone for bone in machine.crew_bones("gunner", (0, 0, 0.5), 1, "cart")}
        self.assertAlmostEqual(bones["gunner.arm.L"][2][0], -bones["gunner.arm.R"][2][0])

    def test_the_geometry_can_read_the_joints_of_the_bones(self):
        bones = {bone[0]: bone for bone in machine.crew_bones("gunner", (0, 0, 0.5), 1, "cart")}
        self.assertEqual(machine.crew_neck((0, 0, 0.5), 1), bones["gunner.body"][2])
        self.assertEqual(machine.crew_shoulder((0, 0, 0.5), 1, -1), bones["gunner.arm.R"][1])


class MachineRules(unittest.TestCase):
    parents = {
        bone[0]: bone[3]
        for bone in machine.bones(
            machine.Proportions(), props=machine.crew_bones("gunner", (0, 0, 0.34), 1, "cart")
        )
    }

    def problems(self, *parts):
        return machine.skin_problems(parts, self.parents)

    def test_a_crew_part_belongs_to_the_cart(self):
        self.assertEqual(self.problems(part("gunner.arm.L", "arm.L", "gunner.arm.L")), [])

    def test_a_wheel_may_use_the_cart_that_holds_it(self):
        self.assertEqual(self.problems(part("wheel.FL", "leg.L", "wheel.FL", "cart")), [])

    def test_a_wheel_must_not_use_a_wheel_of_the_other_side(self):
        self.assertEqual(
            self.problems(part("wheel.FL", "leg.L", "wheel.FR")),
            ["wheel.FL: leg.L part must not use bone 'wheel.FR'"],
        )

    def test_the_body_of_the_cart_must_not_use_a_wheel(self):
        self.assertEqual(
            self.problems(part("cart", "torso", "wheel.BL")),
            ["cart: torso part must not use bone 'wheel.BL'"],
        )

    def test_a_machine_has_the_shared_clip_slots(self):
        self.assertEqual(machine.CLIP_SLOTS["walk"].frames, 24)
        self.assertEqual(machine.CLIP_SLOTS["rebirth"].frames, 48)


class StructureLayout(unittest.TestCase):
    def test_each_wall_has_a_root_and_a_base(self):
        self.assertEqual(
            structure.bones(structure.Proportions()),
            [("root", (0, 0, 0), (0, 0, 0.1), None), ("base", (0, 0, 0.02), (0, 0, 0.14), "root")],
        )

    def test_a_unit_adds_its_pieces_after_the_base_and_its_props_after_them(self):
        shield = structure.foot_bone("shield.0", (0, -0.24, 0.035))
        sign = structure.foot_bone("sign", (-0.4, -0.12, 0.02))
        names = [bone[0] for bone in structure.bones(structure.Proportions(), trunk=[shield], props=[sign])]
        self.assertEqual(names, ["root", "base", "shield.0", "sign"])

    def test_a_foot_bone_points_up_from_the_foot_of_its_piece(self):
        name, head, tail, parent = structure.foot_bone("shield.0", (0.2, -0.1, 0.035))
        self.assertEqual((name, head, parent), ("shield.0", (0.2, -0.1, 0.035), "base"))
        for value, expected in zip(tail, (0.2, -0.1, 0.155)):
            self.assertAlmostEqual(value, expected, places=6)

    def test_a_piece_can_stand_on_another_piece(self):
        self.assertEqual(structure.foot_bone("pot", (0, 0, 0.7), 0.08, "beam.R")[3], "beam.R")

    def test_the_middle_of_the_arc_is_at_the_front(self):
        self.assertEqual(structure.arc_point(structure.Proportions(), 0), (0, -0.24, 0))

    def test_the_arc_turns_round_the_front(self):
        x, y, z = structure.arc_point(structure.Proportions(), math.radians(90))
        self.assertAlmostEqual(x, 0.3)
        self.assertAlmostEqual(y, 0.06)
        self.assertEqual(z, 0)

    def test_a_row_can_have_its_own_radius(self):
        self.assertEqual(structure.arc_point(structure.Proportions(), 0, 0.2)[1], -0.14)

    def test_outward_points_from_the_wall_to_the_enemy(self):
        self.assertEqual(structure.outward(0), (0, -1, 0))


class StructureRules(unittest.TestCase):
    parents = {
        bone[0]: bone[3]
        for bone in structure.bones(structure.Proportions(), trunk=[structure.foot_bone("shield.0", (0, 0, 0))])
    }

    def test_a_piece_may_use_its_foot_bone(self):
        self.assertEqual(structure.skin_problems([part("shield.0", "prop", "shield.0")], self.parents), [])

    def test_a_base_part_must_stay_when_a_piece_falls(self):
        self.assertEqual(
            structure.skin_problems([part("platform", "base", "base", "shield.0")], self.parents),
            ["platform: base part must not use bone 'shield.0'"],
        )

    def test_the_check_stops_a_build(self):
        rig = SimpleNamespace(
            data=SimpleNamespace(
                bones=[SimpleNamespace(name="shield.0", parent=None), SimpleNamespace(name="base", parent=None)]
            )
        )
        with self.assertRaisesRegex(ValueError, "platform: base part must not use bone 'shield.0'"):
            structure.check_skin([part("platform", "base", "shield.0")], rig)

    def test_a_structure_has_the_shared_clip_slots(self):
        self.assertEqual(structure.CLIP_SLOTS["death"].frames, 36)


class FootBonesField(unittest.TestCase):
    spec = load_spec(DIRECTORY / "specs/bone-rampart.json")

    def test_bone_rampart_lists_its_shields_and_its_sign(self):
        self.assertEqual(
            self.spec["footBones"], ["shield.0", "shield.1", "shield.2", "shield.3", "shield.4", "sign"]
        )

    def test_a_structure_needs_foot_bones(self):
        spec = {key: value for key, value in self.spec.items() if key != "footBones"}
        self.assertEqual(validate_spec(spec), ["spec.footBones: required for a structure"])

    def test_a_unit_on_another_plan_has_no_foot_bones(self):
        self.assertEqual(
            validate_spec({**self.spec, "bodyPlan": "machine"}),
            ["spec.footBones: only a structure has foot bones"],
        )


class Registry(unittest.TestCase):
    def test_the_body_plan_names_find_the_plans(self):
        self.assertIs(BODY_PLANS["machine"], machine)
        self.assertIs(BODY_PLANS["structure"], structure)

    def test_the_schema_knows_the_plans(self):
        schema = json.loads((DIRECTORY / "unit-spec.schema.json").read_text(encoding="utf-8"))
        self.assertLessEqual({"machine", "structure"}, set(schema["properties"]["bodyPlan"]["enum"]))

    def test_a_unit_can_name_the_machine_plan(self):
        spec = load_spec(DIRECTORY / "specs/crag-rhino.json")
        self.assertEqual(validate_spec({**spec, "bodyPlan": "machine"}), [])


if __name__ == "__main__":
    unittest.main()
