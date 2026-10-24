"""
Bramble Nest (`elf.brambleNest`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a dense, living hedge of thick,
twisted bramble vines with pale thorns, green leaves and small white
flowers. A big arch of bramble rises over it, with seed pods and two amber
ribbons that hang from it. A wooden direction sign at the front points into
the hedge. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/bramble-nest.glb`; then
`bun unit-model:pack bramble-nest` packs it for the game.

It is a Wall, not a figure. The Battle camera sees the side of a Unit, so a
straight hedge across the Lane would show only its edge: the loops of
bramble stand on an arc round the front, as the shields of Bone Rampart do,
and the big arch turns 45 degrees to the camera side, as Dawn Reliquary
does. Each loop has a bone at its foot, so it can sway, lash and fall. A cut
in the arch, on the camera side, has fresh green shoots over it: the
`shoots` bone scales them up in the cast (Regenerate). A Wall does not
move, but the base clips need `walk`: the bramble creeps on. It has no
Attack, but it has the `attack` clip: the thorns lash forward.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

VINE = hex_color("#6b4a2c")
VINE_DARK = hex_color("#4a311c")
VINE_LIGHT = hex_color("#8a6440")
THORN = hex_color("#cdb88c")
LEAF = hex_color("#6f9a40")
LEAF_DARK = hex_color("#4a7028")
LEAF_LIGHT = hex_color("#9cbc5a")
MOSS = hex_color("#5d7f30")
FLOWER = hex_color("#f2efe0")
POLLEN = hex_color("#e8c050")
POD = hex_color("#b8662e")
POD_LIGHT = hex_color("#d99a46")
RIBBON = hex_color("#e2a542")
RIBBON_DARK = hex_color("#b07a28")
SIGN = hex_color("#a47a4a")
SIGN_DARK = hex_color("#6e4e2e")
INK = hex_color("#3a2a1c")
CUT = hex_color("#ead4a2")
SHOOT = hex_color("#b6e05a")
STONE = hex_color("#8c8678")

# --- Proportions ---------------------------------------------------------------

# The loops of bramble stand on an arc round the front of the Square.
RADIUS = 0.28
ARC_Y = 0.06
LOOP_ANGLES = [math.radians(a) for a in (-72, -36, 0, 36, 72)]
LOOP_HEIGHTS = (0.34, 0.44, 0.5, 0.42, 0.32)
LOOP_WIDTH = 0.13

# The big arch: its feet are at the front left and the back right, so it
# turns 45 degrees to the camera side (-X), and the camera sees its face.
ARCH_A = Vector((0.2, -0.2, 0.0))
ARCH_B = Vector((-0.2, 0.22, 0.0))
ARCH_TOP = 0.86

# The cut with the new shoots is on the camera side of the arch.
CUT_AT = 0.32

SIGN_POST = Vector((-0.3, -0.3, 0))


def arc_point(angle, radius=RADIUS):
    return Vector((radius * math.sin(angle), -radius * math.cos(angle) + ARC_Y, 0))


def outward(angle):
    return Vector((math.sin(angle), -math.cos(angle), 0))


def arch_point(s):
    """A point on the big arch at s = 0 (front left foot) to 1 (back right foot)."""
    base = ARCH_A.lerp(ARCH_B, s)
    return base + Z * ARCH_TOP * math.sin(math.pi * s) ** 0.8


BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("base", (0, 0, 0.02), (0, 0, 0.14), "root"),
    ("arch", (0, 0, 0.02), (0, 0, 0.4), "base"),
    ("pods", tuple(arch_point(0.5) - Z * 0.02), tuple(arch_point(0.5) - Z * 0.12), "arch"),
    ("ribbons", tuple(arch_point(0.22)), tuple(arch_point(0.22) - Z * 0.15), "arch"),
    ("shoots", tuple(arch_point(CUT_AT)), tuple(arch_point(CUT_AT) + Vector((-0.06, -0.06, 0.04))), "arch"),
    ("sign", tuple(SIGN_POST + Z * 0.02), tuple(SIGN_POST + Z * 0.2), "base"),
]
for index, angle in enumerate(LOOP_ANGLES):
    foot = arc_point(angle) + Z * 0.02
    BONES.append((f"loop.{index}", tuple(foot), tuple(foot + Z * 0.12), "base"))

# --- Weights -------------------------------------------------------------------


def pod_weights(co):
    return blend("pods", "arch", co.z, ARCH_TOP - 0.1, ARCH_TOP - 0.03)


def ribbon_weights(co):
    top = arch_point(0.22).z
    return blend("ribbons", "arch", co.z, top - 0.06, top - 0.01)


# --- Parts ---------------------------------------------------------------------


def leaf(part, base, direction, length, width, color):
    """A flat leaf: a cone squashed thin."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.001, 4, squash=0.3)
    part.paint(faces_of(verts), color)
    return verts


def flower(part, center, normal):
    """A small white flower of five petals with a yellow heart."""
    normal = Vector(normal).normalized()
    side = normal.cross(Z if abs(normal.z) < 0.9 else X).normalized()
    up = side.cross(normal).normalized()
    center = Vector(center)
    for index in range(5):
        a = 2 * math.pi * index / 5
        out = side * math.cos(a) + up * math.sin(a)
        petal = kit.cone(part.bm, center, center + out * 0.02, 0.008, 0.004, 3, squash=0.4)
        part.paint(faces_of(petal), FLOWER)
    heart = kit.sphere(part.bm, center + normal * 0.002, (0.005, 0.005, 0.005), 5, 3)
    part.paint(faces_of(heart), POLLEN)


def clump(part, center, size, index):
    """A clump of foliage: a squashed ball of leaves in three greens."""
    verts = kit.sphere(part.bm, center, (size, size * 0.85, size * 0.7), 8, 5)
    for face in faces_of(verts):
        c = face.calc_center_median()
        part.paint([face], (LEAF, LEAF_DARK, LEAF_LIGHT)[(index + int(c.z * 90) + int(c.x * 60)) % 3])


def bramble(part, points, radius, thorn_every=2, seed=0):
    """
    A twisted vine of two strands along `points`, with thorns that point out
    from it. Returns the faces of the strands.
    """
    points = [Vector(p) for p in points]
    count = len(points)
    radii = [radius * lerp(1.0, 0.7, abs(i / (count - 1) - 0.5) * 2) for i in range(count)]
    faces = set()
    for strand in (0, 1):
        twisted = []
        for index, point in enumerate(points):
            ahead = points[min(index + 1, count - 1)] - points[max(index - 1, 0)]
            side = ahead.cross(Z if abs(ahead.normalized().z) < 0.95 else X).normalized()
            up = side.cross(ahead).normalized()
            a = index * 1.4 + strand * math.pi
            twisted.append(point + (side * math.cos(a) + up * math.sin(a)) * radius * 0.55)
        verts = kit.tube(part.bm, twisted, [r * 0.75 for r in radii], 5)
        strand_faces = faces_of(verts)
        part.paint(strand_faces, VINE if strand == 0 else VINE_DARK)
        faces |= strand_faces
    for index in range(1, count - 1):
        if (index + seed) % thorn_every:
            continue
        point = points[index]
        ahead = (points[index + 1] - points[index - 1]).normalized()
        side = ahead.cross(Z if abs(ahead.z) < 0.95 else X).normalized()
        a = (index + seed) * 2.3
        out = (side * math.cos(a) + ahead.cross(side) * math.sin(a)).normalized()
        thorn = kit.cone(part.bm, point + out * radius * 0.8, point + out * (radius + 0.035) + ahead * 0.012, 0.007, 0.001, 4)
        part.paint(faces_of(thorn), THORN)
    return faces


def hedge_parts():
    parts = []
    # The base: a low mound of moss, leaves and stones that fills the road.
    mound = Part("mound", MOSS, "base", shade=0.16)
    for index, angle in enumerate(LOOP_ANGLES + [math.radians(a) for a in (-54, -18, 18, 54)]):
        c = arc_point(angle, RADIUS * (0.9 if index < 5 else 0.7)) + Z * 0.03
        ball = kit.sphere(mound.bm, c, (0.09, 0.08, 0.06), 8, 5)
        mound.paint(faces_of(ball), (MOSS, LEAF_DARK, LEAF)[index % 3])
    for index, c in enumerate(((0.0, -0.06, 0.05), (-0.1, 0.06, 0.05), (0.1, 0.08, 0.05))):
        clump(mound, Vector(c), 0.1, index)
    for c in ((-0.2, -0.22, 0.02), (0.24, 0.0, 0.02), (-0.08, 0.28, 0.02)):
        stone = kit.sphere(mound.bm, c, (0.04, 0.034, 0.024), 6, 4)
        mound.paint(faces_of(stone), STONE)
    parts.append(mound)

    # The loops of bramble on the arc, each in the plane along the arc.
    for index, angle in enumerate(LOOP_ANGLES):
        loop = Part(f"loop.{index}", VINE, f"loop.{index}", shade=0.14)
        center = arc_point(angle)
        along = Vector((math.cos(angle), math.sin(angle), 0))
        out = outward(angle)
        height = LOOP_HEIGHTS[index]
        # Two loops that cross: one leans out, one leans in.
        for lean, shift in ((0.04, -0.03), (-0.03, 0.04)):
            points = []
            for step in range(9):
                theta = math.pi * step / 8
                points.append(center + along * (LOOP_WIDTH * math.cos(theta) + shift) + out * lean * math.sin(theta) + Z * (0.02 + height * math.sin(theta)))
            bramble(loop, points, 0.022, 2, index + int(shift * 100))
        for theta in (math.pi * 0.3, math.pi * 0.7):
            clump(loop, center + along * LOOP_WIDTH * math.cos(theta) + Z * (0.02 + height * math.sin(theta)) + out * 0.02, 0.05, index)
        # Leaves and a flower on the loop.
        for step, side in ((2, 1), (4, -1), (6, 1)):
            theta = math.pi * step / 8
            base = center + along * LOOP_WIDTH * math.cos(theta) + Z * (0.02 + height * math.sin(theta))
            leaf(loop, base, out * 0.8 + along * 0.4 * side + Z * 0.5, 0.06, 0.02, (LEAF, LEAF_LIGHT, LEAF_DARK)[(index + step) % 3])
        flower(loop, center + Z * (0.02 + height) + out * 0.03, out + Z * 0.5)
        parts.append(loop)
    return parts


def arch_parts():
    parts = []
    arch = Part("arch", VINE, "arch", shade=0.12)
    points = [arch_point(i / 14) for i in range(15)]
    bramble(arch, points, 0.04, 2, 3)
    # A second, thinner vine that winds round the arch.
    winding = []
    for i in range(15):
        s = i / 14
        p = arch_point(s)
        winding.append(p + Vector((0.03 * math.cos(i * 1.9), 0.03 * math.sin(i * 1.9), 0.025 * math.cos(i * 1.3))))
    bramble(arch, winding, 0.012, 3, 1)
    # Thinner vines across the opening of the arch, so it is a web of bramble.
    for start, end, sag in ((0.12, 0.7, 0.12), (0.3, 0.9, 0.1), (0.2, 0.55, 0.06)):
        p0, p1 = arch_point(start), arch_point(end)
        web = [p0.lerp(p1, i / 8) - Z * sag * math.sin(math.pi * i / 8) for i in range(9)]
        bramble(arch, web, 0.014, 3, int(start * 10))
    # Leaves and flowers along the arch; their faces turn to the camera side.
    for index, s in enumerate((0.12, 0.2, 0.42, 0.58, 0.66, 0.8, 0.9)):
        base = arch_point(s)
        leaf(arch, base, Vector((-0.8, -0.3 + 0.2 * (index % 2), 0.4)), 0.07, 0.024, (LEAF, LEAF_LIGHT, LEAF_DARK)[index % 3])
    for index, s in enumerate((0.1, 0.4, 0.62, 0.84)):
        clump(arch, arch_point(s) + Vector((0.01, 0.0, 0.02)), 0.065, index)
    for s in (0.3, 0.5, 0.72, 0.18, 0.9):
        flower(arch, arch_point(s) + Vector((-0.03, -0.01, 0.02)), (-1, -0.4, 0.3))
    # The cut in the arch on the camera side: pale, fresh wood.
    cut_at = arch_point(CUT_AT)
    cut = kit.sphere(arch.bm, cut_at + Vector((-0.024, -0.008, 0.0)), (0.012, 0.026, 0.026), 8, 5)
    arch.paint(faces_of(cut), CUT)
    parts.append(arch)

    # The new shoots that close the cut: curls of bright green with buds.
    shoots = Part("shoots", SHOOT, "shoots", shade=0.05)
    for index, (dy, dz) in enumerate(((-0.03, 0.02), (0.02, 0.03), (0.0, -0.02))):
        start = cut_at + Vector((-0.02, dy * 0.5, dz * 0.5))
        points = [start]
        for step in range(1, 5):
            a = step * 0.9
            points.append(start + Vector((-0.012 * step, dy * step * 0.6 + 0.012 * math.sin(a), dz * step * 0.5 + 0.012 * (1 - math.cos(a)))))
        kit.tube(shoots.bm, points, [0.006, 0.005, 0.004, 0.003, 0.002], 4)
        bud = kit.sphere(shoots.bm, points[-1], (0.008, 0.008, 0.01), 6, 4)
        shoots.paint(faces_of(bud), LEAF_LIGHT)
        leaf(shoots, points[2], Vector((-0.6, dy * 10, 0.6)), 0.03, 0.012, SHOOT)
    parts.append(shoots)

    # Seed pods that hang from the top of the arch on short stems.
    pods = Part("pods", POD, pod_weights, shade=0.1)
    for index, s in enumerate((0.42, 0.5, 0.6)):
        top = arch_point(s) - Z * 0.02
        drop = 0.05 + 0.03 * (index % 2)
        kit.tube(pods.bm, [top, top - Z * drop], [0.003, 0.003], 4)
        pod = kit.sphere(pods.bm, top - Z * (drop + 0.025), (0.018, 0.018, 0.028), 8, 5)
        pods.paint(faces_of(pod), POD if index % 2 else POD_LIGHT)
        tip = kit.cone(pods.bm, top - Z * (drop + 0.05), top - Z * (drop + 0.066), 0.008, 0.001, 4)
        pods.paint(faces_of(tip), VINE_DARK)
    parts.append(pods)

    # Two amber ribbons tied on the arch; they hang in the plane of the arch, so the camera sees their faces.
    ribbons = Part("ribbons", RIBBON, ribbon_weights, shade=0.08)
    along = (ARCH_B - ARCH_A).normalized()
    normal = along.cross(Z).normalized()
    for index, s in enumerate((0.2, 0.26)):
        top = arch_point(s) - Z * 0.01
        length = 0.2 + 0.06 * index
        grid_front, grid_back = [], []
        for row in range(5):
            v = row / 4
            center = top - Z * length * v + along * 0.02 * math.sin(v * 3 + index) - normal * 0.01 * v
            width = 0.018 * (1 - 0.2 * v)
            grid_front.append([center - along * width - normal * 0.002, center + along * width - normal * 0.002])
            grid_back.append([center - along * width + normal * 0.002, center + along * width + normal * 0.002])

        def color_of(face_side, row, column, index=index):
            return RIBBON if (row + index) % 3 else RIBBON_DARK

        kit.panel(ribbons, grid_front, grid_back, color_of)
        knot = kit.sphere(ribbons.bm, top + Z * 0.008, (0.014, 0.012, 0.012), 6, 4)
        ribbons.paint(faces_of(knot), RIBBON_DARK)
    parts.append(ribbons)
    return parts


def sign_parts():
    """The direction sign at the front: its arrow points into the hedge."""
    sign = Part("sign", SIGN, "sign", shade=0.08)
    top = SIGN_POST + Z * 0.36
    kit.cone(sign.bm, SIGN_POST, top + Z * 0.02, 0.014, 0.012, 6)
    # The board faces the camera side (-X), and its arrow points back, into the hedge (+Y).
    board_c = top - Z * 0.03 + Y * 0.02
    kit.slab(sign.bm, board_c, (0.008, 0, 0), (0, 0.075, 0), (0, 0, 0.026))
    head = kit.cone(sign.bm, board_c + Y * 0.075, board_c + Y * 0.12, 0.04, 0.001, 4, squash=0.2)
    sign.paint(faces_of(head), SIGN)
    for z in (0.01, -0.01):
        line = kit.slab(sign.bm, board_c + Vector((-0.009, -0.01 + z, z)), (0.001, 0, 0), (0, 0.04, 0), (0, 0, 0.003))
        sign.paint(faces_of(line), INK)
    nail = kit.sphere(sign.bm, board_c + Vector((-0.01, -0.05, 0)), (0.004, 0.004, 0.004), 4, 3)
    sign.paint(faces_of(nail), SIGN_DARK)
    # A vine has started to climb the post.
    leaf(sign, SIGN_POST + Z * 0.12, Vector((-0.6, -0.4, 0.6)), 0.04, 0.014, LEAF)
    leaf(sign, SIGN_POST + Z * 0.2, Vector((-0.6, 0.4, 0.6)), 0.035, 0.012, LEAF_LIGHT)
    return [sign]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BrambleNest", BONES)
    parts = hedge_parts() + arch_parts() + sign_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BrambleNestMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def lean(index, degrees, side=0.0):
        """A loop leans out (positive) or in, and turns a little along the arc."""
        n = outward(LOOP_ANGLES[index])
        return t(f"loop.{index}", (Z.cross(n), degrees), (n, side))

    def pose(base, changes):
        result = dict(base)
        result.update(changes)
        return result

    def rest(sway=0.0, grow=0.0):
        """
        The hedge stands and lives: the loops sway a little each in its own
        time, the pods swing and the ribbons move. `grow` swells it a little.
        """
        result = {
            "arch": t("arch", (Y, 1.5 * sway), (X, -1 * sway)),
            "arch@scale": 1.0 + 0.03 * grow,
            "pods": t("pods", (X, 8 * sway), (Y, -6 * sway)),
            "ribbons": t("ribbons", (X, -10 * sway), (Y, 8 + 6 * sway)),
            "shoots@scale": 0.6,
            "sign": t("sign", (Y, -3)),
        }
        for index in range(len(LOOP_ANGLES)):
            phase = (index * 0.37) % 1
            result[f"loop.{index}"] = lean(index, 3 * math.sin((phase + sway) * math.pi), 2 * sway)
            result[f"loop.{index}@scale"] = 1.0 + 0.04 * grow
        return result

    def battered(breath=0.0):
        """Low HP: the loops sag and lean out, the arch droops to one side, and the sign tips."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, -0.01)),
                "arch": t("arch", (Y, -8 - breath * 2), (X, 6)),
                "arch@scale": 0.96,
                "pods": t("pods", (X, 4), (Y, 14)),
                "ribbons": t("ribbons", (Y, -10)),
                "shoots@scale": 0.25,
                "loop.0": lean(0, 24, -6),
                "loop.1": lean(1, 8 + breath * 2, 4),
                "loop.2": lean(2, -6),
                "loop.3": lean(3, 20 + breath * 3, 6),
                "loop.4": lean(4, 30, -4),
                "loop.0@scale": 0.9,
                "loop.4@scale": 0.85,
                "sign": t("sign", (Y, 16)),
            },
        )

    def jolt(base, amount=1.0, forward=False):
        """A blow shakes the hedge: the loops whip and the arch rocks."""
        direction = -1 if forward else 1
        changes = {
            "base@loc": at("base", (0, 0.02 * amount * direction, 0.012 * amount)),
            "base": t("base", (X, -4 * amount * direction)),
            "arch": t("arch", (X, -10 * amount * direction), (Y, 4 * amount)),
            "pods": t("pods", (X, 30 * amount * direction)),
            "ribbons": t("ribbons", (X, 26 * amount * direction), (Y, 10 * amount)),
            "sign": t("sign", (Y, 8 * amount)),
        }
        for index in range(len(LOOP_ANGLES)):
            changes[f"loop.{index}"] = lean(index, (-10 if index % 2 else 8) * amount * direction, 4 * amount)
        return pose(base, changes)

    def lash(base, amount=1.0):
        """The thorns lash forward: the loops at the front whip out, and the arch leans to the foe."""
        changes = {
            "base@loc": at("base", (0, -0.03 * amount, 0.01 * amount)),
            "arch": t("arch", (X, 14 * amount)),
            "pods": t("pods", (X, -30 * amount)),
            "ribbons": t("ribbons", (X, -30 * amount)),
        }
        for index in range(len(LOOP_ANGLES)):
            front = math.cos(LOOP_ANGLES[index])
            changes[f"loop.{index}"] = lean(index, 30 * amount * front, 6 * amount)
            changes[f"loop.{index}@scale"] = 1.0 + 0.12 * amount * front
        return pose(base, changes)

    def withered(base, bounce=0.0, rise=0.0):
        """
        The hedge dies: each loop falls flat out and shrinks, the arch falls
        and shrinks, and the sign falls. `rise` (0 to 1 for each loop, in
        turn) grows the loops again, for a Rebirth and a summon.
        """
        up_arch = max(0.0, min(1.0, rise * 1.5 - 0.5))
        changes = {
            "base@loc": at("base", (0, 0, -0.012)),
            "arch": t("arch", (X, lerp(-70 + bounce, 0, up_arch)), (Y, lerp(20, 0, up_arch))),
            "arch@scale": lerp(0.35, 1.0, up_arch),
            "pods": t("pods", (X, 40)),
            "ribbons": t("ribbons", (X, 60)),
            "shoots@scale": lerp(0.1, 0.6, up_arch),
            "sign": t("sign", (Y, lerp(-70, -3, up_arch))),
        }
        for index in range(len(LOOP_ANGLES)):
            # The end loops fall first in a death and grow back last.
            up = max(0.0, min(1.0, rise * len(LOOP_ANGLES) - abs(index - 2) * 1.5))
            changes[f"loop.{index}"] = lean(index, lerp(70 - bounce * (index % 2), 0, up), 0)
            changes[f"loop.{index}@scale"] = lerp(0.4, 1.0, up)
        return pose(base, changes)

    def falling(base, at_index):
        """The first loops are down and the others lean, part way into the death."""
        changes = {
            "arch": t("arch", (X, -24), (Y, 10)),
            "pods": t("pods", (X, 20)),
            "sign": t("sign", (Y, -20)),
        }
        for index in range(len(LOOP_ANGLES)):
            changes[f"loop.{index}"] = lean(index, 50 if index in at_index else 14, 4)
            changes[f"loop.{index}@scale"] = 0.7 if index in at_index else 0.95
        return pose(base, changes)

    def creep(lift, tilt):
        """A walk pose: the bramble pulls itself on, the whole hedge hops and rocks."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, 0.024 * lift)),
                "base": t("base", (X, 4 * tilt), (Y, 3 * tilt)),
                "arch": t("arch", (X, 6 * tilt)),
                "pods": t("pods", (X, -18 * lift), (Y, 10 * tilt)),
                "ribbons": t("ribbons", (X, -16 * lift), (Y, 10 * tilt)),
                "sign": t("sign", (Y, 6 * tilt)),
                **{f"loop.{i}": lean(i, 8 * tilt * (1 if i % 2 else -1)) for i in range(len(LOOP_ANGLES))},
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, sway in ((0, 0), (12, 1), (24, 0), (36, -1), (48, 0)):
        idle.key(frame, rest(sway, 0.5 + 0.5 * math.sin(math.pi * frame / 24)))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, battered(breath))
    clips.append(low)

    # A Wall does not walk, but the bramble can creep on.
    walk = Clip("walk", 24, loop=True)
    walk.key(0, creep(0, 0)).key(6, creep(1, 1)).key(12, creep(0, 0)).key(18, creep(1, -1)).key(24, creep(0, 0))
    clips.append(walk)

    # It has no Attack, but it has the clip: the thorns lash forward. The
    # slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so
    # the lash lands at frame 15 of 30.
    attack = Clip("attack", 30)
    attack.key(0, rest()).key(10, jolt(rest(), 0.6)).key(15, lash(rest())).key(19, lash(rest(), 0.8))
    attack.key(26, rest()).key(30, rest())
    clips.append(attack)

    # Regenerate: the hedge swells, and the new shoots grow over the cut.
    cast = Clip("cast", 24)
    cast.key(0, rest()).key(6, pose(rest(0, 1), {"shoots@scale": 1.3})).key(12, pose(rest(0.5, 2), {"shoots@scale": 1.9}))
    cast.key(18, pose(rest(-0.5, 1.5), {"shoots@scale": 1.6})).key(24, rest())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt(rest())).key(8, jolt(rest(), 0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest(), (0, 4))).key(18, falling(rest(), (0, 1, 3, 4)))
    death.key(26, withered(rest())).key(30, withered(rest(), 6)).key(36, withered(rest()))
    clips.append(death)

    # Rebirth: the hedge falls (45% of the event, `REBORN_FALL`), then it
    # grows again: the middle loop first, then the others and the arch.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest(), (0, 4))).key(20, withered(rest())).key(24, withered(rest(), 3))
    rebirth.key(30, withered(rest(), 0, 0.35)).key(36, withered(rest(), 0, 0.75)).key(41, rest(0, 2)).key(48, rest())
    clips.append(rebirth)

    # The summon: the hedge grows up out of the ground.
    summon = Clip("summon", 24)
    summon.key(0, withered(rest())).key(8, withered(rest(), 0, 0.5)).key(14, rest(0, 2)).key(24, rest())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "bramble-nest.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
