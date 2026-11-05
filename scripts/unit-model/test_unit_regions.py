"""Run with python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'."""

import unittest

from unit_regions import REGIONS, part_region, region_id, region_name


class RegionName(unittest.TestCase):
    def test_an_id_gives_its_name(self):
        self.assertEqual(region_name(1), "head")
        self.assertEqual(region_name(region_id("effect")), "effect")


class PartRegion(unittest.TestCase):
    def test_a_name_decides_before_its_bone(self):
        self.assertEqual(part_region("sword", "hand.R", -0.2), "prop")

    def test_a_bone_decides_for_a_name_with_no_known_word(self):
        self.assertEqual(part_region("plate.L", "upperarm.L", 0.2), "arm.L")

    def test_a_bone_gives_the_side_when_the_name_has_none(self):
        self.assertEqual(part_region("sashEnd", "thigh.R", 0.0), "leg.R")

    def test_a_beast_leg_uses_the_side_of_its_front_or_back_token(self):
        self.assertEqual(part_region("upper.FL", "chest", 0.0), "leg.L")
        self.assertEqual(part_region("lower.BR", "lower.BR", 0.0), "leg.R")

    def test_upper_with_no_side_is_not_a_leg(self):
        self.assertEqual(part_region("upper", "chest", 0.0), "torso")

    def test_the_center_gives_the_side_of_a_limb_with_no_side_token(self):
        self.assertEqual(part_region("gob.arms", "gob.arms", 0.1), "arm.L")
        self.assertEqual(part_region("gob.arms", "gob.arms", -0.1), "arm.R")

    def test_a_clothing_part_gets_the_torso(self):
        self.assertEqual(part_region("belt", "hips", 0.0), "torso")

    def test_a_flame_is_an_effect_and_the_ground_is_a_base(self):
        self.assertEqual(part_region("flames", "flame", 0.0), "effect")
        self.assertEqual(part_region("ground", "base", 0.0), "base")

    def test_each_result_is_in_the_fixed_list(self):
        names = ("head", "belt", "hand.L", "hand.R", "foot.L", "foot.R", "sword", "ground", "glow")
        self.assertEqual(sorted(REGIONS), sorted(part_region(n, n, 0.0) for n in names))


class RegionId(unittest.TestCase):
    def test_ids_start_at_1_and_end_at_9(self):
        self.assertEqual((region_id("head"), region_id("effect")), (1, 9))

    def test_rejects_a_name_that_is_not_in_the_list(self):
        with self.assertRaisesRegex(ValueError, "unknown Body Region: wing"):
            region_id("wing")


if __name__ == "__main__":
    unittest.main()
