"""Quadruped geometry checks. Run this file in Blender; plain Python skips it."""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import bmesh
    from mathutils import Vector
except ImportError as error:
    raise unittest.SkipTest("needs Blender") from error

from body_plans import quadruped
import unit_model_kit as kit


class MirroredParts(unittest.TestCase):
    def test_a_right_leg_reflects_the_left_geometry_and_keeps_its_own_bone(self):
        left = kit.Part("upper.FL", (0.3, 0.2, 0.1), "upper.FL", shade=0)
        right = kit.Part("upper.FR", (0.1, 0.2, 0.3), "upper.FR", shade=0)
        kit.box(left.bm, (0.2, 0.1, 0.5), (0.1, 0.2, 0.3))
        kit.box(right.bm, (-0.3, 0.2, 0.6), (0.2, 0.3, 0.4))
        left.bm.normal_update()
        left.paint([list(left.bm.faces)[0]], (0.8, 0.4, 0.2))
        volume = left.bm.calc_volume(signed=True)
        self.addCleanup(left.bm.free)

        quadruped.mirror_parts([left, right])

        self.addCleanup(right.bm.free)
        self.assertEqual(right.weights, "upper.FR")
        center = sum((vertex.co for vertex in right.bm.verts), Vector()) / len(right.bm.verts)
        self.assertAlmostEqual(center.x, -0.2, places=6)
        self.assertAlmostEqual(center.y, 0.1, places=6)
        self.assertAlmostEqual(center.z, 0.5, places=6)
        self.assertAlmostEqual(right.bm.calc_volume(signed=True), volume, places=6)
        self.assertIn((0.8, 0.4, 0.2), right.face_colors.values())


if __name__ == "__main__":
    result = unittest.main(argv=["test_beast_geometry"], exit=False).result
    if not result.wasSuccessful():
        sys.exit(1)
