"""Run with python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'."""

import json
from pathlib import Path
from types import SimpleNamespace
import unittest

from body_plans import BODY_PLANS
from body_plans import flyer, quadruped
from unit_regions import region_id
from unit_spec import load_spec, validate_spec

DIRECTORY = Path(__file__).resolve().parent


def bones_of(table=None, **options):
    table = table or quadruped.Proportions()
    return {bone[0]: bone for bone in quadruped.bones(table, **options)}


class QuadrupedTable(unittest.TestCase):
    def test_the_table_has_the_most_common_values_of_the_beast_survey(self):
        table = quadruped.Proportions()
        self.assertEqual(table.root_tip_z, 0.1)
        self.assertEqual((table.hip_y, table.hip_z), (0.24, 0.4))
        self.assertEqual(table.chest_y, -0.12)
        self.assertEqual(table.front_ankle_z, 0.07)
        self.assertEqual(table.back_toe_z, 0.02)

    def test_a_unit_overrides_only_the_values_that_it_names(self):
        table = quadruped.Proportions(hip_z=0.42)
        self.assertEqual(table.hip_z, 0.42)
        self.assertEqual(table.chest_y, quadruped.Proportions().chest_y)

    def test_a_spine_that_does_not_run_forward_is_refused(self):
        with self.assertRaisesRegex(ValueError, "mid_y"):
            quadruped.Proportions(mid_y=0.3)

    def test_a_leg_that_does_not_fall_to_the_ground_is_refused(self):
        with self.assertRaisesRegex(ValueError, "back_ankle_z"):
            quadruped.Proportions(back_ankle_z=0.25)


class QuadrupedSkeleton(unittest.TestCase):
    def test_the_core_bones_have_a_fixed_order(self):
        names = [bone[0] for bone in quadruped.bones(quadruped.Proportions(necks=()))]
        legs = [f"{bone}.{leg}" for leg in ("FL", "FR", "BL", "BR") for bone in ("upper", "lower", "foot")]
        self.assertEqual(names, ["root", "hips", "spine", "chest", "head", *legs])

    def test_the_spine_is_one_chain_from_the_hips_to_the_head(self):
        bones = bones_of(quadruped.Proportions(necks=()))
        self.assertEqual(bones["hips"][1:], ((0, 0.24, 0.4), (0, 0.05, 0.42), "root"))
        self.assertEqual(bones["spine"][1:], ((0, 0.05, 0.42), (0, -0.12, 0.45), "hips"))
        self.assertEqual(bones["chest"][1:], ((0, -0.12, 0.45), (0, -0.26, 0.44), "spine"))
        self.assertEqual(bones["head"][1:], ((0, -0.26, 0.44), (0, -0.52, 0.34), "chest"))

    def test_each_neck_joint_adds_a_bone_before_the_head(self):
        table = quadruped.Proportions(necks=((-0.3, 0.56), (-0.36, 0.61)))
        bones = bones_of(table)
        self.assertEqual(bones["neck"][1:], ((0, -0.26, 0.44), (0, -0.3, 0.56), "chest"))
        self.assertEqual(bones["neck.2"][1:], ((0, -0.3, 0.56), (0, -0.36, 0.61), "neck"))
        self.assertEqual(bones["head"][1:], ((0, -0.36, 0.61), (0, -0.52, 0.34), "neck.2"))

    def test_the_front_legs_hang_from_the_chest_and_the_back_legs_from_the_hips(self):
        bones = bones_of()
        self.assertEqual(bones["upper.FL"][3], "chest")
        self.assertEqual(bones["upper.BR"][3], "hips")

    def test_a_right_leg_is_the_mirror_of_its_left_leg(self):
        bones = bones_of()
        self.assertEqual(bones["lower.BL"][1:3], ((0.11, 0.27, 0.2), (0.11, 0.24, 0.07)))
        self.assertEqual(bones["lower.BR"][1:3], ((-0.11, 0.27, 0.2), (-0.11, 0.24, 0.07)))

    def test_the_leg_joints_are_those_of_the_bones(self):
        top, knee, ankle, toe = quadruped.leg_points(quadruped.Proportions(), "FR")
        bones = bones_of()
        self.assertEqual(bones["upper.FR"][1:3], (top, knee))
        self.assertEqual(bones["foot.FR"][1:3], (ankle, toe))

    def test_a_front_leg_has_the_chest_as_parent(self):
        self.assertEqual(quadruped.leg_parent("FR"), "chest")
        self.assertEqual(quadruped.leg_parent("BL"), "hips")

    def test_a_beast_names_its_last_leg_bone(self):
        self.assertIn("hoof.FL", bones_of(foot="hoof"))
        self.assertIn("paw.BR", bones_of(foot="paw"))

    def test_a_unit_adds_bones_after_the_head_and_after_the_legs(self):
        tail = ("tail", (0, 0.41, 0.46), (0, 0.45, 0.33), "hips")
        pup = ("pup", (0.2, 0, 0.1), (0.2, 0, 0.2), None)
        table = quadruped.Proportions(necks=())
        names = [bone[0] for bone in quadruped.bones(table, trunk=[tail], props=[pup])]
        self.assertEqual(names[4:6], ["head", "tail"])
        self.assertEqual(names[-1], "pup")


class QuadrupedRules(unittest.TestCase):
    parents = {bone[0]: bone[3] for bone in quadruped.bones(quadruped.Proportions(), foot="paw")}

    def test_a_body_part_may_follow_the_head(self):
        hide = SimpleNamespace(name="body", region=region_id("torso"), bones={"hips", "chest", "head"})
        self.assertEqual(quadruped.skin_problems([hide], self.parents), [])

    def test_a_leg_may_use_the_body_that_holds_it(self):
        leg = SimpleNamespace(name="upper.FL", region=region_id("leg.L"), bones={"upper.FL", "chest"})
        self.assertEqual(quadruped.skin_problems([leg], self.parents), [])

    def test_a_part_must_not_use_a_leg_of_the_other_side(self):
        leg = SimpleNamespace(name="paw.BL", region=region_id("leg.L"), bones={"paw.BR"})
        self.assertEqual(
            quadruped.skin_problems([leg], self.parents),
            ["paw.BL: leg.L part must not use bone 'paw.BR'"],
        )

    def test_a_head_part_must_not_use_the_hips(self):
        horn = SimpleNamespace(name="horns", region=region_id("head"), bones={"hips"})
        self.assertEqual(
            quadruped.skin_problems([horn], self.parents),
            ["horns: head part must not use bone 'hips'"],
        )

    def test_a_beast_casts_for_30_frames_and_has_the_other_shared_slots(self):
        self.assertEqual(
            {slot.name: (slot.frames, slot.loop) for slot in quadruped.CLIP_SLOTS.values()},
            {
                "idle": (48, True),
                "lowHp": (48, True),
                "walk": (24, True),
                "attack": (30, False),
                "cast": (30, False),
                "hurt": (16, False),
                "death": (36, False),
                "rebirth": (48, False),
                "summon": (24, False),
            },
        )


class FlyingField(unittest.TestCase):
    def test_a_figure_on_a_biped_plan_can_be_flying(self):
        spec = load_spec(DIRECTORY / "specs/warden-saelith.json")
        self.assertEqual(validate_spec({**spec, "flying": True}), [])

    def test_the_flying_field_is_true_or_false(self):
        spec = load_spec(DIRECTORY / "specs/warden-saelith.json")
        self.assertEqual(len(validate_spec({**spec, "flying": "yes"})), 1)


class FlyerSkeleton(unittest.TestCase):
    def test_the_body_of_a_flyer_is_in_the_air_above_its_root(self):
        names = {bone[0]: bone for bone in flyer.bones(flyer.Proportions())}
        self.assertEqual(names["root"], ("root", (0, 0, 0), (0, 0, 0.12), None))
        self.assertEqual(names["body"], ("body", (0, 0.04, 0.55), (0, -0.05, 0.55), "root"))

    def test_a_unit_adds_bones_after_the_body_and_a_stand_after_them(self):
        head = ("head", (0, -0.05, 0.56), (0, -0.12, 0.56), "body")
        stand = ("stand", (0, 0, 0.5), (0, 0, 0.3), "body")
        names = [bone[0] for bone in flyer.bones(flyer.Proportions(), trunk=[head], props=[stand])]
        self.assertEqual(names, ["root", "body", "head", "stand"])

    def test_a_stand_may_have_no_parent_so_that_it_stays_on_the_ground(self):
        helmet = ("helmet", (0, 0.15, 0.01), (0, 0.15, 0.09), None)
        self.assertEqual(flyer.bones(flyer.Proportions(), props=[helmet])[-1], helmet)

    def test_a_wing_pair_is_a_left_wing_and_its_mirror(self):
        root, tip = (0.03, -0.02, 0.6), (0.128, -0.012, 0.616)
        self.assertEqual(
            flyer.wing_pair("F", root, tip),
            [
                ("wing.FL", root, tip, "body"),
                ("wing.FR", (-0.03, -0.02, 0.6), (-0.128, -0.012, 0.616), "body"),
            ],
        )


class RootLift(unittest.TestCase):
    def test_a_stand_holds_the_body_up_so_the_clips_only_bob(self):
        self.assertEqual(flyer.STAND_LIFT.height(), 0)
        self.assertEqual(flyer.STAND_LIFT.height(bob=1), 0.015)

    def test_a_figure_stands_on_the_ground_at_rest_so_the_clips_lift_it(self):
        self.assertEqual(flyer.ROOT_LIFT.height(), 0.14)
        self.assertAlmostEqual(flyer.ROOT_LIFT.height(bob=1), 0.165)

    def test_a_unit_overrides_one_value_of_a_lift(self):
        lift = flyer.ROOT_LIFT._replace(float_z=0.08)
        self.assertEqual((lift.float_z, lift.bob_z), (0.08, 0.025))


class FlyerRules(unittest.TestCase):
    wings = flyer.wing_pair("F", (0.03, 0, 0.6), (0.13, 0, 0.6))
    tail = ("tail", (0, 0.05, 0.55), (0, 0.16, 0.54), "body")
    parents = {bone[0]: bone[3] for bone in flyer.bones(flyer.Proportions(), trunk=[tail, *wings])}

    def test_a_tail_belongs_to_the_body(self):
        tail = SimpleNamespace(name="tail", region=region_id("torso"), bones={"body", "tail"})
        self.assertEqual(flyer.skin_problems([tail], self.parents), [])

    def test_a_wing_may_use_the_body_that_holds_it(self):
        wing = SimpleNamespace(name="wing.FL", region=region_id("arm.L"), bones={"wing.FL", "body"})
        self.assertEqual(flyer.skin_problems([wing], self.parents), [])

    def test_a_wing_must_not_use_the_wing_of_the_other_side(self):
        wing = SimpleNamespace(name="wing.FL", region=region_id("arm.L"), bones={"wing.FR"})
        self.assertEqual(
            flyer.skin_problems([wing], self.parents),
            ["wing.FL: arm.L part must not use bone 'wing.FR'"],
        )

    def test_a_body_part_must_not_use_a_wing(self):
        thorax = SimpleNamespace(name="thorax", region=region_id("torso"), bones={"wing.FL"})
        self.assertEqual(
            flyer.skin_problems([thorax], self.parents),
            ["thorax: torso part must not use bone 'wing.FL'"],
        )

    def test_a_flyer_has_the_shared_clip_slots(self):
        self.assertEqual(flyer.CLIP_SLOTS["walk"].frames, 24)
        self.assertEqual(flyer.CLIP_SLOTS["cast"].frames, 24)


class Registry(unittest.TestCase):
    def test_the_body_plan_names_find_the_plans(self):
        self.assertIs(BODY_PLANS["quadruped"], quadruped)
        self.assertIs(BODY_PLANS["flyer"], flyer)

    def test_the_schema_knows_the_plans(self):
        schema = json.loads((DIRECTORY / "unit-spec.schema.json").read_text(encoding="utf-8"))
        self.assertLessEqual({"quadruped", "flyer"}, set(schema["properties"]["bodyPlan"]["enum"]))

    def test_amberwing_dart_names_the_flyer_plan(self):
        spec = load_spec(DIRECTORY / "specs/amberwing-dart.json")
        self.assertEqual(spec["bodyPlan"], "flyer")
        self.assertEqual([prop["bone"] for prop in spec["props"]], ["head", "body"])


if __name__ == "__main__":
    unittest.main()
