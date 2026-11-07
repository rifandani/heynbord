"""
The geometry of `unit_model_kit.py`. It needs Blender, so plain Python skips it:

    Blender --background --factory-startup --python-exit-code 1 \
        --python scripts/unit-model/test_kit_geometry.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import bmesh
    from mathutils import Vector
except ImportError as error:
    raise unittest.SkipTest("needs Blender") from error

import unit_model_kit as kit  # noqa: E402


def heights(bm):
    return sorted({round(vert.co.z, 5) for vert in bm.verts})


class Tube(unittest.TestCase):
    def setUp(self):
        self.bm = bmesh.new()
        self.addCleanup(self.bm.free)

    def test_a_closed_tube_has_a_positive_volume(self):
        kit.tube(self.bm, [(0, 0, 0), (0, 0, 1), (0, 0.5, 2)], [0.2, 0.2, 0.1], 6)
        self.assertGreater(self.bm.calc_volume(signed=True), 0)

    def test_each_side_face_points_away_from_the_axis(self):
        kit.tube(self.bm, [(0, 0, 0), (0, 0, 1)], [0.2, 0.2], 6, caps=False)
        self.bm.normal_update()
        for face in self.bm.faces:
            center = face.calc_center_median()
            self.assertGreater(face.normal.dot(Vector((center.x, center.y, 0))), 0)


class ConeLoops(unittest.TestCase):
    def setUp(self):
        self.bm = bmesh.new()
        self.addCleanup(self.bm.free)

    def test_adds_a_ring_at_each_share_of_the_length(self):
        kit.cone(self.bm, (0, 0, 0), (0, 0, 1), 0.4, 0.2, 8, loops=(0.25, 0.5))
        self.assertEqual(heights(self.bm), [0, 0.25, 0.5, 1])
        self.assertEqual(len(self.bm.verts), 8 * 4)

    def test_returns_the_verts_of_the_new_rings(self):
        verts = kit.cone(self.bm, (0, 0, 0), (0, 0, 1), 0.4, 0.2, 8, loops=(0.5,))
        self.assertEqual(len(verts), 8 * 3)

    def test_keeps_the_surface(self):
        kit.cone(self.bm, (0, 0, 0), (0, 0, 1), 0.4, 0.2, 8, squash=0.7)
        plain = self.bm.calc_volume(signed=True)
        ringed = bmesh.new()
        self.addCleanup(ringed.free)
        kit.cone(ringed, (0, 0, 0), (0, 0, 1), 0.4, 0.2, 8, squash=0.7, loops=(0.3, 0.6))
        self.assertAlmostEqual(ringed.calc_volume(signed=True), plain, places=5)

    def test_rejects_a_ring_outside_the_cone(self):
        with self.assertRaises(ValueError):
            kit.cone(self.bm, (0, 0, 0), (0, 0, 1), 0.4, 0.2, 8, loops=(1.0,))


if __name__ == "__main__":
    result = unittest.main(argv=["test_kit_geometry"], exit=False).result
    if not result.wasSuccessful():
        sys.exit(1)
