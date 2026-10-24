"""
Town Barricade (`human.townBarricade`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a rough timber barricade made by
town guards, on a patch of cobbles. Two frames of crossed beams with rope and
iron brackets, rows of sandbags behind them, a log at the foot, a dented
round shield with a gold star, blue cloths with a gold fringe, a crate, and a
cooking pot as a helmet on the top of a beam. The passage permit waits under
the sandbags. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/town-barricade.glb`; then
`bun unit-model:pack town-barricade` packs it for the game.

It is a Wall, not a figure. The pieces stand on an arc round the front, as
the shields of Bone Rampart do, so the Battle camera, which sees the side of
a Unit, sees the curve of the barricade and not only its edge. The shield,
the pot and the permit are on the camera side. Each big piece has a bone at
its foot: it rattles, leans out with Low HP and falls out in the death clip.
It has no Attack, but it has the `attack` clip: the heap lurches forward and
the beams jab. Its walk is a hop. The Rebirth and the summon build it again,
the sandbags first.
"""

import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

WOOD = hex_color("#8a6442")
WOOD_DARK = hex_color("#5e4129")
WOOD_LIGHT = hex_color("#b08a5e")
WOOD_END = hex_color("#c9a878")
IRON = hex_color("#4f5052")
ROPE = hex_color("#b49a6c")
SACK = hex_color("#c4a97c")
SACK_DARK = hex_color("#9c845c")
BLUE = hex_color("#2c4a9a")
BLUE_DARK = hex_color("#1d336e")
GOLD = hex_color("#dcaa42")
GOLD_DARK = hex_color("#9e7428")
STEEL = hex_color("#9a9ea3")
STEEL_DARK = hex_color("#62666b")
STONE = hex_color("#b4ab9c")
STONE_DARK = hex_color("#8c8476")
PAPER = hex_color("#f1ead6")
INK = hex_color("#3a3028")
SEAL = hex_color("#a8322a")

# --- Proportions ---------------------------------------------------------------

# The pieces stand on an arc round the front of the Square.
ARC_Y = 0.06
BEAM_RADIUS = 0.3
BAG_RADIUS = 0.2
FRAME_ANGLES = {"R": math.radians(-66), "L": math.radians(18)}
LOG_ANGLES = (math.radians(-72), math.radians(14))
SHIELD_ANGLE = math.radians(-100)
CRATE_ANGLE = math.radians(78)
PAPER_ANGLE = math.radians(-84)
# Rows of sandbags: the height of each row and the angles of its bags.
BAG_ROWS = [
    (0.06, [-78, -52, -26, 0, 26, 52, 78]),
    (0.15, [-65, -39, -13, 13, 39, 65]),
    (0.24, [-52, -26, 0, 26, 52]),
    (0.33, [-30, 0, 30]),
]


def arc_point(angle, radius):
    return Vector((radius * math.sin(angle), -radius * math.cos(angle) + ARC_Y, 0))


def outward(angle):
    return Vector((math.sin(angle), -math.cos(angle), 0))


def along(angle):
    """The direction along the arc, to the left of the barricade."""
    return Z.cross(outward(angle)).normalized()


def frame_points(angle):
    """The ends of the two crossed beams of a frame: (foot, top) for each."""
    p = arc_point(angle, BEAM_RADIUS)
    u = along(angle)
    n = outward(angle)
    tall = (p - u * 0.15, p + u * 0.1 + Z * 0.74 + n * 0.06)
    short = (p + u * 0.15, p - u * 0.12 + Z * 0.62 + n * 0.05)
    return tall, short


def crossing(angle):
    """About where the two beams of a frame cross."""
    (a0, a1), (b0, b1) = frame_points(angle)
    return (a0.lerp(a1, 0.47) + b0.lerp(b1, 0.47)) / 2


POT_SPOT = frame_points(FRAME_ANGLES["R"])[0][1]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("base", (0, 0, 0.02), (0, 0, 0.14), "root"),
]
for index, (z, _angles) in enumerate(BAG_ROWS):
    spot = arc_point(0, BAG_RADIUS) + Z * (z - 0.03)
    BONES.append((f"bags.{index}", tuple(spot), tuple(spot + Z * 0.08), "base"))
for side, angle in FRAME_ANGLES.items():
    foot = arc_point(angle, BEAM_RADIUS)
    BONES.append((f"beam.{side}", tuple(foot), tuple(foot + Z * 0.15), "base"))
    top = crossing(angle) + outward(angle) * 0.03 + Z * 0.06
    BONES.append((f"cloth.{side}", tuple(top), tuple(top - Z * 0.12), f"beam.{side}"))
log_foot = (arc_point(LOG_ANGLES[0], BEAM_RADIUS + 0.04) + arc_point(LOG_ANGLES[1], BEAM_RADIUS + 0.04)) / 2
shield_foot = arc_point(SHIELD_ANGLE, BEAM_RADIUS + 0.06)
crate_foot = arc_point(CRATE_ANGLE, BAG_RADIUS + 0.04)
paper_foot = arc_point(PAPER_ANGLE, BAG_RADIUS + 0.08)
BONES += [
    ("log", tuple(log_foot), tuple(log_foot + Z * 0.1), "base"),
    ("shield", tuple(shield_foot), tuple(shield_foot + Z * 0.12), "base"),
    ("crate", tuple(crate_foot), tuple(crate_foot + Z * 0.1), "base"),
    ("paper", tuple(paper_foot), tuple(paper_foot + outward(PAPER_ANGLE) * 0.08), "base"),
    ("pot", tuple(POT_SPOT), tuple(POT_SPOT + Z * 0.08), "beam.R"),
]

# --- Weights -------------------------------------------------------------------


def cloth_weights(side):
    top = crossing(FRAME_ANGLES[side]).z + 0.06

    def weights(co):
        return blend(f"cloth.{side}", f"beam.{side}", co.z, top - 0.06, top - 0.01)

    return weights


# --- Parts ---------------------------------------------------------------------


def timber(part, a, b, width, color=None):
    """A square beam from `a` to `b`, with a light end grain at each end."""
    a, b = Vector(a), Vector(b)
    axis = (b - a) / 2
    side = axis.cross(Z if abs(axis.normalized().z) < 0.95 else X).normalized() * width
    depth = axis.normalized().cross(side).normalized() * width
    verts = kit.slab(part.bm, (a + b) / 2, axis, side, depth)
    faces = faces_of(verts)
    if color:
        part.paint(faces, color)
    for face in faces:
        if abs(face.normal.normalized().dot(axis.normalized())) > 0.9:
            part.paint([face], WOOD_END)
    return verts


def bag(part, center, angle, tone):
    """A sandbag lying along the arc, tied at both ends."""
    verts = kit.sphere(part.bm, center, (0.088, 0.058, 0.05), 8, 6)
    kit.bmesh.ops.rotate(part.bm, cent=center, matrix=Matrix.Rotation(angle, 3, "Z"), verts=verts)
    part.paint(faces_of(verts), tone)
    u = along(angle)
    for sign in (1, -1):
        tie = kit.cone(part.bm, center + u * (0.078 * sign), center + u * (0.104 * sign), 0.018, 0.006, 5)
        part.paint(faces_of(tie), SACK_DARK)


def bag_parts():
    parts = []
    for index, (z, angles) in enumerate(BAG_ROWS):
        part = Part(f"bags.{index}", SACK, f"bags.{index}", shade=0.1)
        for count, degrees in enumerate(angles):
            angle = math.radians(degrees)
            # Each row sits a little further back than the row under it.
            center = arc_point(angle, BAG_RADIUS - index * 0.018) + Z * z
            bag(part, center, angle, SACK if (count + index) % 2 else SACK_DARK)
        parts.append(part)
    return parts


def frame_parts():
    parts = []
    for side, angle in FRAME_ANGLES.items():
        part = Part(f"beam.{side}", WOOD, f"beam.{side}", smooth=False, shade=0.14)
        (a0, a1), (b0, b1) = frame_points(angle)
        timber(part, a0, a1, 0.034)
        timber(part, b0, b1, 0.031, WOOD_LIGHT)
        # A short brace along the foot.
        timber(part, a0 + Z * 0.05, b0 + Z * 0.05, 0.018, WOOD_DARK)
        # Rope round the crossing and an iron bracket on each beam.
        c = crossing(angle)
        rope = kit.torus(part.bm, c, (a1 - a0).normalized(), 0.05, 0.009, 10, 4)
        part.paint(faces_of(rope), ROPE)
        rope = kit.torus(part.bm, c, (b1 - b0).normalized(), 0.05, 0.009, 10, 4)
        part.paint(faces_of(rope), ROPE)
        n = outward(angle)
        for start, end in ((a0, a1), (b0, b1)):
            spot = start.lerp(end, 0.78) + n * 0.035
            bracket = kit.slab(part.bm, spot, (end - start).normalized() * 0.03, along(angle) * 0.03, n * 0.004)
            part.paint(faces_of(bracket), IRON)
            nail = kit.sphere(part.bm, spot + n * 0.005, (0.006, 0.006, 0.006), 4, 3)
            part.paint(faces_of(nail), STEEL_DARK)
        # A sharp tip on the tall beam of the left frame; the pot sits on the right one.
        if side == "L":
            tip = kit.cone(part.bm, a1, a1 + (a1 - a0).normalized() * 0.08, 0.04, 0.002, 4)
            part.paint(faces_of(tip), WOOD_LIGHT)
        parts.append(part)
    return parts


# The size of each cloth: rows and columns of its grid, its width and its drop.
CLOTH_ROWS, CLOTH_COLUMNS = 4, 3
CLOTH_WIDTH, CLOTH_DROP = 0.09, 0.24


def cloth_part(side, angle):
    """A blue cloth with a gold fringe hangs over a frame, its face to the outside."""
    part = Part(f"cloth.{side}", BLUE, cloth_weights(side), shade=0.12)
    top = crossing(angle) + Z * 0.06
    n = outward(angle)
    u = along(angle)
    # The right cloth hangs to the camera side of its crossing.
    offset = -0.03 if side == "R" else 0.03

    def grid(depth):
        result = []
        for r in range(CLOTH_ROWS + 1):
            v = r / CLOTH_ROWS
            row = []
            for c in range(CLOTH_COLUMNS + 1):
                h = c / CLOTH_COLUMNS
                ragged = 0.03 * v * ((c * 7) % 3) / 2
                across = offset + lerp(-CLOTH_WIDTH / 2, CLOTH_WIDTH / 2, h)
                row.append(top + u * across + n * (0.035 + depth + 0.02 * v) - Z * (CLOTH_DROP * v - ragged))
            result.append(row)
        return result

    def color_of(face_side, row, column):
        if row == CLOTH_ROWS - 1:
            return GOLD
        return BLUE if face_side == "front" else BLUE_DARK

    edges = panel(part, grid(0.003), grid(-0.003), color_of)
    part.paint(edges, GOLD_DARK)
    # The gold fringe: little tassels at the foot.
    for c in range(4):
        h = (c + 0.5) / 4
        foot = top + u * (offset + lerp(-CLOTH_WIDTH / 2, CLOTH_WIDTH / 2, h)) + n * 0.058 - Z * (CLOTH_DROP - 0.01)
        tassel = kit.cone(part.bm, foot, foot - Z * 0.04, 0.006, 0.002, 4)
        part.paint(faces_of(tassel), GOLD)
    return part


def cloth_parts():
    return [cloth_part(side, angle) for side, angle in FRAME_ANGLES.items()]


def log_parts():
    part = Part("log", WOOD, "log", shade=0.12)
    a = arc_point(LOG_ANGLES[0], BEAM_RADIUS + 0.04) + Z * 0.05
    b = arc_point(LOG_ANGLES[1], BEAM_RADIUS + 0.04) + Z * 0.05
    verts = kit.cone(part.bm, a, b, 0.045, 0.04, 8)
    for f in faces_of(verts):
        if abs(f.normal.normalized().dot((b - a).normalized())) > 0.9:
            part.paint([f], WOOD_END)
        elif int(f.calc_center_median().z * 200) % 3 == 0:
            part.paint([f], WOOD_DARK)
    for t in (0.2, 0.8):
        band = kit.torus(part.bm, a.lerp(b, t), (b - a).normalized(), 0.046, 0.006, 10, 3)
        part.paint(faces_of(band), ROPE)
    return [part]


def shield_parts():
    """The dented round shield leans on the log, its face out to the camera side."""
    part = Part("shield", BLUE, "shield", shade=0.08)
    radius = 0.105
    n = (outward(SHIELD_ANGLE) + Z * 0.45).normalized()
    center = shield_foot + Z * (radius * 0.95) + outward(SHIELD_ANGLE) * 0.02
    kit.cone(part.bm, center - n * 0.008, center + n * 0.004, radius, radius * 0.97, 16)
    rim = kit.torus(part.bm, center + n * 0.004, n, radius, 0.008, 18, 4)
    part.paint(faces_of(rim), STEEL_DARK)
    face = center + n * 0.006
    boss = kit.sphere(part.bm, face, (0.032, 0.032, 0.032), 8, 5)
    part.paint(faces_of(boss), STEEL)
    # A gold star of five points round the boss.
    side = n.cross(Z).normalized()
    up = side.cross(n).normalized()
    for k in range(5):
        a = math.radians(90 + 72 * k)
        out = side * math.cos(a) + up * math.sin(a)
        point = kit.cone(part.bm, face + out * 0.018, face + out * 0.09, 0.02, 0.002, 4, squash=0.2)
        part.paint(faces_of(point), GOLD)
    # Dents where the paint is gone.
    for a, r in ((20, 0.06), (150, 0.07), (250, 0.05), (320, 0.075)):
        out = side * math.cos(math.radians(a)) + up * math.sin(math.radians(a))
        dent = kit.sphere(part.bm, face + out * r + n * 0.002, (0.012, 0.012, 0.012), 5, 4)
        part.paint(faces_of(dent), STEEL_DARK)
    return [part]


def pot_parts():
    """The cooking-pot helmet, upside down on the top of the tall beam."""
    part = Part("pot", STEEL, "pot", shade=0.16)
    c = POT_SPOT + Z * 0.004
    kit.cone(part.bm, c, c + Z * 0.075, 0.072, 0.066, 14)
    rim = kit.torus(part.bm, c + Z * 0.002, Z, 0.075, 0.008, 14, 4)
    part.paint(faces_of(rim), STEEL_DARK)
    dent = kit.sphere(part.bm, c + Vector((-0.02, -0.01, 0.075)), (0.026, 0.026, 0.006), 8, 4)
    part.paint(faces_of(dent), STEEL_DARK)
    # The handle sticks out to the camera side.
    handle = kit.tube(
        part.bm,
        [c + Vector((-0.066, -0.02, 0.045)), c + Vector((-0.105, -0.016, 0.055)), c + Vector((-0.105, 0.022, 0.055)), c + Vector((-0.066, 0.026, 0.045))],
        [0.0055] * 4,
        4,
    )
    part.paint(faces_of(handle), STEEL_DARK)
    return [part]


def crate_parts():
    part = Part("crate", WOOD_LIGHT, "crate", smooth=False, shade=0.14)
    c = crate_foot + Z * 0.06
    u, n = along(CRATE_ANGLE), outward(CRATE_ANGLE)
    verts = kit.slab(part.bm, c, u * 0.065, n * 0.06, Z * 0.06)
    for f in faces_of(verts):
        if int((f.calc_center_median().z + f.calc_center_median().x) * 60) % 2:
            part.paint([f], WOOD)
    for su in (1, -1):
        for sn in (1, -1):
            corner = kit.slab(part.bm, c + u * (0.062 * su) + n * (0.057 * sn), u * 0.008, n * 0.008, Z * 0.062)
            part.paint(faces_of(corner), IRON)
    return [part]


def paper_parts():
    """The passage permit, under the bottom sandbags, with a red seal."""
    part = Part("paper", PAPER, "paper", shade=0.04)
    n = outward(PAPER_ANGLE)
    u = along(PAPER_ANGLE)
    c = paper_foot + n * 0.05 + Z * 0.012
    tilt = (n + Z * 0.25).normalized()
    sheet = kit.slab(part.bm, c, tilt * 0.06, u * 0.045, tilt.cross(u).normalized() * 0.002)
    part.paint(faces_of(sheet), PAPER)
    top = tilt.cross(u).normalized()
    if top.z < 0:
        top = -top
    for k in range(3):
        line = kit.slab(part.bm, c + tilt * (0.005 + k * 0.016) + top * 0.0025, tilt * 0.004, u * 0.03, top * 0.001)
        part.paint(faces_of(line), INK)
    seal = kit.sphere(part.bm, c - tilt * 0.03 + u * 0.022 + top * 0.004, (0.011, 0.011, 0.005), 6, 4)
    part.paint(faces_of(seal), SEAL)
    return [part]


def ground_parts():
    """A patch of cobbles under the barricade."""
    part = Part("ground", STONE, "base", smooth=False, shade=0.06)
    verts = kit.cone(part.bm, (0, 0.02, 0.0), (0, 0.02, 0.022), 0.42, 0.41, 14, squash=0.85)
    for f in faces_of(verts):
        if f.normal.z > 0.9:
            continue
        part.paint([f], STONE_DARK)
    for x, y in ((0.2, -0.3), (-0.12, -0.34), (0.05, -0.36), (0.3, -0.12), (-0.33, -0.18), (0.28, 0.2), (-0.26, 0.22), (0.0, 0.3)):
        stone = kit.sphere(part.bm, (x, y, 0.022), (0.04, 0.034, 0.008), 6, 3)
        part.paint(faces_of(stone), STONE_DARK if int((x + y) * 10) % 2 else STONE)
    return [part]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("TownBarricade", BONES)
    parts = (
        ground_parts()
        + bag_parts()
        + frame_parts()
        + cloth_parts()
        + log_parts()
        + shield_parts()
        + pot_parts()
        + crate_parts()
        + paper_parts()
    )
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "TownBarricadeMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def lean(bone, angle, degrees, side=0.0):
        """A piece leans out (positive) or in, and turns a little along the arc."""
        n = outward(angle)
        return t(bone, (Z.cross(n), degrees), (n, side))

    def pose(base, changes):
        result = dict(base)
        result.update(changes)
        return result

    def rest(sway=0.0, rattle=0.0):
        """The barricade stands. The cloths stir, the pot wobbles and the permit flutters."""
        return {
            "beam.R": lean("beam.R", FRAME_ANGLES["R"], 1.2 * rattle),
            "beam.L": lean("beam.L", FRAME_ANGLES["L"], -1.2 * rattle),
            "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], 6 + 6 * sway, 4 * sway),
            "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], 6 - 6 * sway, -4 * sway),
            "pot": t("pot", (Y, 4 * sway), (X, 2 * rattle)),
            "paper": lean("paper", PAPER_ANGLE, -6 * rattle - 2),
            "shield": lean("shield", SHIELD_ANGLE, 0.8 * rattle),
        }

    def battered(breath=0.0):
        """Low HP: the right frame leans out, the top bags slide, the shield slips flat and the pot hangs."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, 0.0)),
                "beam.R@loc": at("beam.R", Z * 0.032),
                "beam.R": lean("beam.R", FRAME_ANGLES["R"], 16 + breath * 2, -6),
                "beam.L@loc": at("beam.L", Z * 0.016),
                "beam.L": lean("beam.L", FRAME_ANGLES["L"], -4, 3),
                "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], -12),
                "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], 20),
                "pot": t("pot", (Y, -30), (X, 20)),
                "bags.3@loc": at("bags.3", (0.03, -0.05, -0.03 - breath * 0.004)),
                "bags.3": t("bags.3", (X, 14), (Y, -10)),
                "bags.2@loc": at("bags.2", (0, -0.015, -0.01)),
                "bags.2": t("bags.2", (X, 5)),
                "shield@loc": at("shield", Z * 0.036),
                "shield": lean("shield", SHIELD_ANGLE, 34),
                "log": t("log", (Z, 6)),
                "crate@loc": at("crate", Z * 0.01),
                "crate": lean("crate", CRATE_ANGLE, 8),
                "paper": lean("paper", PAPER_ANGLE, -12),
            },
        )

    def jolt(base, amount=1.0, forward=False):
        """A blow shakes the barricade: the beams knock and the pot jumps."""
        direction = -1 if forward else 1
        return pose(
            base,
            {
                "base@loc": at("base", (0, 0.02 * amount * direction, 0.014 * amount)),
                "base": t("base", (X, -4 * amount * direction)),
                "beam.R": lean("beam.R", FRAME_ANGLES["R"], -6 * amount * direction, 3 * amount),
                "beam.L": lean("beam.L", FRAME_ANGLES["L"], 5 * amount * direction, -3 * amount),
                "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], 24 * amount),
                "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], 24 * amount),
                "pot@loc": at("pot", (0, 0, 0.04 * amount)),
                "pot": t("pot", (Y, 18 * amount), (X, -12 * amount)),
                "bags.3@loc": at("bags.3", (0, 0, 0.012 * amount)),
                "shield": lean("shield", SHIELD_ANGLE, 8 * amount),
                "paper": lean("paper", PAPER_ANGLE, -20 * amount),
            },
        )

    def fallen(base, bounce=0.0, rise=0.0):
        """
        The barricade falls apart: the frames fall out, the top bags slide
        off, the shield falls flat, the crate tips and the pot rolls away.
        `rise` (0 to 1) builds it again: the bags first, then the frames.
        """
        def up(start, end):
            return max(0.0, min(1.0, (rise - start) / (end - start)))

        bags = up(0.0, 0.35)
        frames_r = up(0.35, 0.65)
        frames_l = up(0.45, 0.75)
        rest_of = up(0.7, 1.0)
        return pose(
            base,
            {
                "base@loc": at("base", (0, 0, 0)),
                # A piece that lies down turns round its foot, so it is lifted by its thickness.
                "beam.R@loc": at("beam.R", Z * (0.06 * (1 - frames_r))),
                "beam.L@loc": at("beam.L", Z * (0.06 * (1 - frames_l))),
                "shield@loc": at("shield", Z * (0.05 * (1 - rest_of))),
                "crate@loc": at("crate", Z * (0.052 * (1 - rest_of))),
                "beam.R": lean("beam.R", FRAME_ANGLES["R"], lerp(70 - bounce, 0, frames_r), lerp(-10, 0, frames_r)),
                "beam.L": lean("beam.L", FRAME_ANGLES["L"], lerp(69 - bounce * 0.5, 0, frames_l), lerp(8, 0, frames_l)),
                "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], lerp(45, 6, frames_r)),
                "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], lerp(45, 6, frames_l)),
                "pot@loc": at("pot", Vector((-0.06, -0.02, 0.0)) * (1 - frames_r)),
                "pot": t("pot", (X, lerp(-70, 0, frames_r)), (Y, lerp(40, 0, frames_r))),
                "bags.3@loc": at("bags.3", Vector((0.0, -0.16, -0.2)) * (1 - bags)),
                "bags.3": t("bags.3", (X, lerp(40, 0, bags))),
                "bags.2@loc": at("bags.2", Vector((0.0, -0.06, -0.12)) * (1 - bags)),
                "bags.2": t("bags.2", (X, lerp(18, 0, bags))),
                "bags.1@loc": at("bags.1", Vector((0.0, -0.02, -0.04)) * (1 - bags)),
                "shield": lean("shield", SHIELD_ANGLE, lerp(46 - bounce, 0, rest_of)),
                "log": t("log", (Z, lerp(14, 0, rest_of))),
                "log@loc": at("log", Vector((0, -0.05, 0)) * (1 - rest_of)),
                "crate": lean("crate", CRATE_ANGLE, lerp(52, 0, rest_of)),
                "paper": lean("paper", PAPER_ANGLE, lerp(-30, -2, rest_of)),
            },
        )

    def falling(base):
        """Part way into the death: the frames lean far out and the top bags slide."""
        return pose(
            base,
            {
                "beam.R@loc": at("beam.R", Z * 0.05),
                "beam.L@loc": at("beam.L", Z * 0.035),
                "shield@loc": at("shield", Z * 0.035),
                "crate@loc": at("crate", Z * 0.03),
                "beam.R": lean("beam.R", FRAME_ANGLES["R"], 40, -6),
                "beam.L": lean("beam.L", FRAME_ANGLES["L"], 24, 4),
                "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], -30),
                "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], -20),
                "pot@loc": at("pot", (0, 0, 0.06)),
                "pot": t("pot", (X, -40), (Y, 30)),
                "bags.3@loc": at("bags.3", (0, -0.08, -0.06)),
                "bags.3": t("bags.3", (X, 26)),
                "shield": lean("shield", SHIELD_ANGLE, 30),
                "crate": lean("crate", CRATE_ANGLE, 24),
            },
        )

    def hop(lift, tilt):
        """A walk pose: the whole heap hops and rocks, and the loose pieces lag."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, 0.035 * lift)),
                "base": t("base", (X, 4 * tilt), (Y, 3 * tilt)),
                "beam.R": lean("beam.R", FRAME_ANGLES["R"], 3 * tilt),
                "beam.L": lean("beam.L", FRAME_ANGLES["L"], -3 * tilt),
                "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], 6 - 16 * lift),
                "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], 6 - 16 * lift),
                "pot@loc": at("pot", (0, 0, 0.02 * lift)),
                "pot": t("pot", (Y, 10 * tilt)),
                "bags.3@loc": at("bags.3", (0, 0, 0.01 * lift)),
                "paper": lean("paper", PAPER_ANGLE, -14 * lift),
            },
        )

    # The attack: the heap rocks back, then lurches forward and the beams
    # jab. The slash effect starts at 50% of the attack (`MELEE_IMPACT` in
    # fx.ts), so the lurch lands at frame 15 of 30.
    def rock_back(base):
        return pose(
            base,
            {
                "base@loc": at("base", (0, 0.03, 0.01)),
                "base": t("base", (X, -5)),
                "beam.R": lean("beam.R", FRAME_ANGLES["R"], -8),
                "beam.L": lean("beam.L", FRAME_ANGLES["L"], -8),
                "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], 16),
                "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], 16),
            },
        )

    def lurch(base):
        return pose(
            jolt(base, 0.6, forward=True),
            {
                "base@loc": at("base", (0, -0.06, 0.04)),
                "base": t("base", (X, 6)),
                "beam.R@loc": at("beam.R", Z * 0.02),
                "beam.L@loc": at("beam.L", Z * 0.02),
                "beam.R": lean("beam.R", FRAME_ANGLES["R"], 14),
                "beam.L": lean("beam.L", FRAME_ANGLES["L"], 14),
                "cloth.R": lean("cloth.R", FRAME_ANGLES["R"], -20),
                "cloth.L": lean("cloth.L", FRAME_ANGLES["L"], -20),
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, sway, rattle in ((0, 0, 0), (12, 1, 1), (24, 0, 0), (36, -1, 1), (48, 0, 0)):
        idle.key(frame, rest(sway, rattle))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, battered(breath))
    clips.append(low)

    # A Wall does not walk, but it can hop on.
    walk = Clip("walk", 24, loop=True)
    walk.key(0, hop(0, 0)).key(6, hop(1, 1)).key(12, hop(0, 0)).key(18, hop(1, -1)).key(24, hop(0, 0))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, rest()).key(10, rock_back(rest())).key(15, lurch(rest())).key(19, lurch(rest()))
    attack.key(26, rest()).key(30, rest())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt(rest())).key(8, jolt(rest(), 0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(4, jolt(rest())).key(14, falling(rest()))
    death.key(26, fallen(rest())).key(30, fallen(rest(), 6)).key(36, fallen(rest()))
    clips.append(death)

    # Rebirth: the barricade falls (45% of the event, `REBORN_FALL`), then
    # the guards build it again: the bags first, then the frames.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest())).key(20, fallen(rest())).key(24, fallen(rest(), 3))
    rebirth.key(30, fallen(rest(), 0, 0.35)).key(36, fallen(rest(), 0, 0.75)).key(41, jolt(rest(), 0.5)).key(48, rest())
    clips.append(rebirth)

    # The summon: the barricade goes up, piece by piece.
    summon = Clip("summon", 24)
    summon.key(0, fallen(rest())).key(6, fallen(rest(), 0, 0.35)).key(12, fallen(rest(), 0, 0.8)).key(16, jolt(rest(), 0.6)).key(24, rest())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "town-barricade.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
