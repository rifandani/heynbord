"""
Bone Rampart (`undead.boneRampart`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a barricade of coffin-shaped wooden
shields with gold fleurs, held by chains and sharp stakes, a big skull on the
middle shield, two skeletons that keep watch over the top (one with a bone
hammer, one with a teal banner) and an arrow sign at the side. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/bone-rampart.glb`; then
`bun unit-model:pack bone-rampart` packs it for the game.

It is a Wall, not a figure. The shields stand on an arc round the front, so
the Battle camera, which sees the side of a Unit, sees the curve of the wall
and not only its edge. Each shield has a bone at its foot, so it can rattle,
lean out and fall. The skeleton with the banner stands on the camera side.
Its Rebirth builds the wall again: the shields stand up one by one.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

WOOD = hex_color("#7a6247")
WOOD_DARK = hex_color("#4f3d2b")
WOOD_LIGHT = hex_color("#9a8063")
IRON = hex_color("#4b4a48")
GOLD = hex_color("#d2a548")
BONE = hex_color("#e3d9c0")
BONE_DARK = hex_color("#a99c7c")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
TEAL = hex_color("#4d6e6b")
TEAL_DARK = hex_color("#334a48")
MUD = hex_color("#4a3d30")
SIGN = hex_color("#d8ccb0")
INK = hex_color("#3a3028")
RUST = hex_color("#7a5a3c")

# --- Proportions ---------------------------------------------------------------

# The shields stand on an arc round the front of the Square.
RADIUS = 0.3
ARC_Y = 0.06
SHIELD_ANGLES = [math.radians(a) for a in (-68, -34, 0, 34, 68)]
SHIELD_BOTTOM = 0.035
SHIELD_HEIGHT = 0.52
SHIELD_THICK = 0.03


def arc_point(angle, radius=RADIUS):
    return Vector((radius * math.sin(angle), -radius * math.cos(angle) + ARC_Y, 0))


def outward(angle):
    return Vector((math.sin(angle), -math.cos(angle), 0))


# Skeleton A stands behind the left of the wall with a bone hammer; skeleton B
# stands behind the right (the camera side) with the banner.
SKEL = {"A": Vector((0.12, 0.13, 0)), "B": Vector((-0.13, 0.14, 0))}
SHOULDER_A = Vector((0.18, 0.13, 0.6))
HAND_A = Vector((0.23, 0.08, 0.73))
HAMMER = Vector((0.05, 0.3, 1)).normalized()
SHOULDER_B = Vector((-0.19, 0.14, 0.6))
HAND_B = Vector((-0.25, 0.05, 0.54))
POLE = Vector((HAND_B.x, HAND_B.y, 0))
POLE_TOP = 1.08
FLAG_TOP = 1.04
FLAG_LOW = 0.76
FLAG_FRONT = -0.13

SIGN_POST = Vector((-0.4, -0.12, 0))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("base", (0, 0, 0.02), (0, 0, 0.14), "root"),
]
for index, angle in enumerate(SHIELD_ANGLES):
    foot = arc_point(angle) + Z * SHIELD_BOTTOM
    BONES.append((f"shield.{index}", tuple(foot), tuple(foot + Z * 0.12), "base"))
for name, spot in SKEL.items():
    BONES += [
        (f"skel.{name}", tuple(spot + Z * 0.3), tuple(spot + Z * 0.58), "base"),
        (f"skel.{name}.head", tuple(spot + Z * 0.6), tuple(spot + Z * 0.8), f"skel.{name}"),
    ]
BONES += [
    ("skel.A.arm", tuple(SHOULDER_A), tuple(HAND_A), "skel.A"),
    ("skel.B.arm", tuple(SHOULDER_B), tuple(HAND_B), "skel.B"),
    ("banner", tuple(HAND_B), tuple(HAND_B + Z * 0.15), "skel.B.arm"),
    ("banner.cloth", (POLE.x, (POLE.y + FLAG_FRONT) / 2, FLAG_TOP), (POLE.x, (POLE.y + FLAG_FRONT) / 2, FLAG_LOW), "banner"),
    ("sign", tuple(SIGN_POST + Z * 0.02), tuple(SIGN_POST + Z * 0.2), "base"),
]

# --- Weights -------------------------------------------------------------------


def nearest_shield(co):
    angle = math.atan2(co.x, -(co.y - ARC_Y))
    index = min(range(len(SHIELD_ANGLES)), key=lambda i: abs(SHIELD_ANGLES[i] - angle))
    return f"shield.{index}"


def chain_weights(co):
    return {nearest_shield(co): 1.0}


def flag_weights(co):
    return blend("banner.cloth", "banner", co.z, FLAG_TOP - 0.08, FLAG_TOP - 0.01)


# --- Parts ---------------------------------------------------------------------


def coffin_width(v):
    """The half width of a coffin shield at `v` (0 at the foot, 1 at the top)."""
    if v < 0.72:
        return lerp(0.055, 0.088, v / 0.72)
    return lerp(0.088, 0.06, (v - 0.72) / 0.28)


def shield_part(index, angle):
    part = Part(f"shield.{index}", WOOD, f"shield.{index}", smooth=False, shade=0.12)
    n = outward(angle)
    u = Z.cross(n).normalized()
    base = arc_point(angle) + Z * SHIELD_BOTTOM
    rows = (0, 0.18, 0.36, 0.54, 0.72, 0.86, 1.0)
    columns = 4

    def grid(depth):
        return [
            [base + Z * (v * SHIELD_HEIGHT) + u * (coffin_width(v) * lerp(-1, 1, c / columns)) + n * depth for c in range(columns + 1)]
            for v in rows
        ]

    def color_of(face_side, row, column):
        if face_side == "back":
            return WOOD_DARK
        # Planks: a light and a dark board in turn.
        return WOOD_LIGHT if column % 2 else WOOD

    edges = panel(part, grid(SHIELD_THICK / 2), grid(-SHIELD_THICK / 2), color_of)
    part.paint(edges, IRON)

    face = base + n * (SHIELD_THICK / 2 + 0.004)
    # Two iron bands across each shield.
    for v in (0.2, 0.8):
        band = kit.slab(part.bm, face + Z * (v * SHIELD_HEIGHT), u * (coffin_width(v) + 0.004), n * 0.005, Z * 0.012)
        part.paint(faces_of(band), IRON)
    if index == 2:
        # The big skull on the middle shield.
        center = face + Z * 0.32 + n * 0.02
        skull = kit.sphere(part.bm, center, (0.05, 0.05, 0.05), 10, 7)
        part.paint(faces_of(skull), BONE)
        jaw = kit.slab(part.bm, center - Z * 0.05 + n * 0.012, u * 0.032, n * 0.02, Z * 0.016)
        part.paint(faces_of(jaw), BONE_DARK)
        for sign in (1, -1):
            hole = kit.sphere(part.bm, center + n * 0.042 + u * (0.02 * sign) + Z * 0.006, (0.015, 0.015, 0.016), 6, 4)
            part.paint(faces_of(hole), SOCKET)
    else:
        # A gold fleur: a tall middle leaf, a band and two side leaves.
        center = face + Z * 0.31
        gold = set()
        gold |= set(kit.slab(part.bm, center + Z * 0.02, u * 0.012, n * 0.004, Z * 0.07))
        gold |= set(kit.slab(part.bm, center - Z * 0.01, u * 0.045, n * 0.004, Z * 0.01))
        for sign in (1, -1):
            gold |= set(kit.slab(part.bm, center + u * (0.03 * sign) + Z * 0.03, u * 0.01 + Z * (0.012 * sign), n * 0.004, Z * 0.035 - u * (0.012 * sign)))
        part.paint(faces_of(gold), GOLD)
    return part


def wall_parts():
    parts = [shield_part(index, angle) for index, angle in enumerate(SHIELD_ANGLES)]

    # The low platform of planks and mud under the wall.
    platform = Part("platform", MUD, "base", smooth=False, shade=0.1)
    top = kit.cone(platform.bm, (0, 0.02, 0.0), (0, 0.02, 0.035), 0.4, 0.38, 12, squash=0.85)
    platform.paint({f for f in faces_of(top) if f.normal.z > 0.9}, WOOD_DARK)
    # Loose bones on the ground in front.
    for x, y, a in ((0.12, -0.33, 30), (-0.05, -0.36, -20), (0.25, -0.22, 70)):
        d = Vector((math.cos(math.radians(a)), math.sin(math.radians(a)), 0))
        p = Vector((x, y, 0.045))
        bone = kit.cone(platform.bm, p - d * 0.04, p + d * 0.04, 0.008, 0.008, 5)
        platform.paint(faces_of(bone), BONE)
        for end in (-1, 1):
            knob = kit.sphere(platform.bm, p + d * (0.045 * end), (0.013, 0.013, 0.011), 6, 4)
            platform.paint(faces_of(knob), BONE)
    parts.append(platform)

    # Sharp stakes between the shields, a little behind them.
    stakes = Part("stakes", WOOD_DARK, "base", smooth=False, shade=0.15)
    for angle in [lerp(a, b, 0.5) for a, b in zip(SHIELD_ANGLES, SHIELD_ANGLES[1:])] + [math.radians(-86), math.radians(86)]:
        foot = arc_point(angle, RADIUS - 0.035)
        kit.cone(stakes.bm, foot, foot + Z * 0.55, 0.02, 0.018, 6)
        tip = kit.cone(stakes.bm, foot + Z * 0.55, foot + Z * 0.63, 0.018, 0.001, 6)
        stakes.paint(faces_of(tip), WOOD_LIGHT)
    parts.append(stakes)

    # Chains across the shields at two heights.
    chains = Part("chains", IRON, chain_weights, shade=0.05)
    for z in (0.15, 0.43):
        steps = 22
        for step in range(steps + 1):
            angle = lerp(SHIELD_ANGLES[0], SHIELD_ANGLES[-1], step / steps)
            n = outward(angle)
            center = arc_point(angle, RADIUS + SHIELD_THICK / 2 + 0.012) + Z * (z - 0.02 * math.sin(step / steps * math.pi * 4) ** 2)
            normal = Z.cross(n) if step % 2 else n
            kit.torus(chains.bm, center, normal, 0.014, 0.004, 8, 3)
    parts.append(chains)
    return parts


def skeleton_parts(name, helmet):
    parts = []
    spot = SKEL[name]
    body = Part(f"skel.{name}", BONE, f"skel.{name}", shade=0.12)
    kit.cone(body.bm, spot + Z * 0.04, spot + Z * 0.32, 0.03, 0.035, 6)
    ribs = kit.sphere(body.bm, spot + Z * 0.5, (0.065, 0.045, 0.075), 10, 7)
    for face in faces_of(ribs):
        if int(face.calc_center_median().z * 90) % 2:
            body.paint([face], BONE_DARK)
    kit.cone(body.bm, spot + Z * 0.32, spot + Z * 0.45, 0.014, 0.014, 5)
    kit.sphere(body.bm, spot + Z * 0.34, (0.05, 0.035, 0.03), 8, 5)
    # The other arm hangs on the wall top.
    other = 1 if name == "B" else -1
    shoulder = spot + Vector((0.065 * other, 0, 0.58))
    hand = spot + Vector((0.08 * other, -0.12, 0.62))
    kit.cone(body.bm, shoulder, hand, 0.012, 0.01, 5)
    kit.sphere(body.bm, hand, (0.016, 0.016, 0.014), 6, 4)
    parts.append(body)

    head = Part(f"skel.{name}.head", BONE, f"skel.{name}.head", shade=0.1)
    center = spot + Z * 0.68
    kit.sphere(head.bm, center, (0.045, 0.05, 0.05), 10, 7)
    jaw = kit.slab(head.bm, center + Vector((0, -0.025, -0.045)), X * 0.03, Y * 0.022, Z * 0.012)
    head.paint(faces_of(jaw), BONE_DARK)
    for sign in (1, -1):
        hole = kit.sphere(head.bm, center + Vector((0.018 * sign, -0.042, 0.004)), (0.014, 0.01, 0.014), 6, 4)
        head.paint(faces_of(hole), SOCKET)
        light = kit.sphere(head.bm, center + Vector((0.018 * sign, -0.05, 0.004)), (0.006, 0.004, 0.006), 5, 3)
        head.paint(faces_of(light), GLOW)
    if helmet:
        cap = kit.sphere(head.bm, center + Z * 0.02, (0.056, 0.06, 0.042), 10, 6)
        kit.bmesh.ops.delete(head.bm, geom=[v for v in cap if v.co.z < center.z + 0.012], context="VERTS")
        head.paint(faces_of([v for v in head.bm.verts if v.co.z > center.z + 0.012 and (v.co - center).length > 0.05]), RUST)
        brim = kit.torus(head.bm, center + Z * 0.015, Z, 0.06, 0.006, 12, 3)
        head.paint(faces_of(brim), IRON)
    else:
        hood = kit.sphere(head.bm, center + Vector((0, 0.012, 0.012)), (0.056, 0.06, 0.06), 10, 7)
        kit.bmesh.ops.delete(head.bm, geom=[v for v in hood if v.co.y < center.y - 0.015], context="VERTS")
        head.paint(faces_of([v for v in head.bm.verts if (v.co - center - Vector((0, 0.012, 0.012))).length > 0.053]), TEAL_DARK)
    parts.append(head)
    return parts


def hammer_parts():
    arm = Part("skel.A.arm", BONE, "skel.A.arm", shade=0.08)
    kit.cone(arm.bm, SHOULDER_A, HAND_A, 0.013, 0.011, 5)
    kit.sphere(arm.bm, HAND_A, (0.018, 0.018, 0.016), 6, 4)
    # The hammer: a long bone for a handle and an iron head.
    kit.cone(arm.bm, HAND_A - HAMMER * 0.06, HAND_A + HAMMER * 0.26, 0.011, 0.011, 6)
    for end in (-0.065, 0.26):
        knob = kit.sphere(arm.bm, HAND_A + HAMMER * end, (0.017, 0.017, 0.017), 6, 4)
        arm.paint(faces_of(knob), BONE_DARK)
    head = kit.slab(arm.bm, HAND_A + HAMMER * 0.24, X * 0.035, Y * 0.075, Z * 0.035)
    arm.paint(faces_of(head), IRON)
    return [arm]


def banner_parts():
    arm = Part("skel.B.arm", BONE, "skel.B.arm", shade=0.08)
    kit.cone(arm.bm, SHOULDER_B, HAND_B, 0.013, 0.011, 5)
    kit.sphere(arm.bm, HAND_B, (0.018, 0.018, 0.016), 6, 4)

    pole = Part("banner", WOOD_DARK, "banner", shade=0.05)
    kit.cone(pole.bm, POLE + Z * 0.04, POLE + Z * POLE_TOP, 0.011, 0.009, 6)
    bar = kit.cone(pole.bm, Vector((POLE.x, POLE.y + 0.01, FLAG_TOP)), Vector((POLE.x, FLAG_FRONT - 0.01, FLAG_TOP)), 0.007, 0.007, 5)
    pole.paint(faces_of(bar), WOOD)
    finial = kit.cone(pole.bm, POLE + Z * POLE_TOP, POLE + Z * (POLE_TOP + 0.05), 0.016, 0.001, 5)
    pole.paint(faces_of(finial), GOLD)

    # The flag hangs from the cross bar, its face to the camera side, with a
    # swallowtail at the foot and a gold fleur.
    flag = Part("banner.flag", TEAL, flag_weights, shade=0.1)
    rows, columns = 6, 4

    def grid(depth):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                h = column / columns
                notch = 0.07 * (1 - abs(h - 0.5) * 2) * v ** 4
                z = lerp(FLAG_TOP - 0.01, FLAG_LOW + notch, v)
                y = lerp(POLE.y - 0.01, FLAG_FRONT, h)
                line.append((POLE.x + depth + 0.012 * math.sin(h * 3 + v * 2), y, z))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if row == rows - 1:
            return TEAL_DARK
        return TEAL

    panel(flag, grid(-0.003), grid(0.003), color_of)
    fleur_center = Vector((POLE.x - 0.008, (POLE.y + FLAG_FRONT) / 2, (FLAG_TOP + FLAG_LOW) / 2 + 0.03))
    gold = set()
    gold |= set(kit.slab(flag.bm, fleur_center + Z * 0.012, X * 0.004, Y * 0.01, Z * 0.05))
    gold |= set(kit.slab(flag.bm, fleur_center - Z * 0.012, X * 0.004, Y * 0.035, Z * 0.008))
    flag.paint(faces_of(gold), GOLD)
    return [arm, pole, flag]


def sign_parts():
    sign = Part("sign", WOOD, "sign", smooth=False, shade=0.1)
    kit.cone(sign.bm, SIGN_POST, SIGN_POST + Z * 0.42, 0.016, 0.014, 6)
    # The arrow board points to the side, to the other Lane.
    board = SIGN_POST + Vector((-0.06, 0, 0.36))
    plank = kit.slab(sign.bm, board, X * 0.075, Y * 0.012, Z * 0.035)
    sign.paint(faces_of(plank), SIGN)
    tip = kit.cone(sign.bm, board - X * 0.075, board - X * 0.125, 0.05, 0.001, 4)
    sign.paint(faces_of(tip), SIGN)
    # Lines of writing on both faces.
    for dz in (0.012, -0.01):
        for side in (-1, 1):
            line = kit.slab(sign.bm, board + Vector((0.005, side * 0.0135, dz)), X * 0.055, Y * 0.002, Z * 0.004)
            sign.paint(faces_of(line), INK)
    return [sign]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BoneRampart", BONES)
    parts = wall_parts() + skeleton_parts("A", True) + skeleton_parts("B", False) + hammer_parts() + banner_parts() + sign_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BoneRampartMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def lean(index, degrees, side=0.0):
        """A shield leans out (positive) or in, and turns a little along the wall."""
        n = outward(SHIELD_ANGLES[index])
        return t(f"shield.{index}", (Z.cross(n), degrees), (n, side))

    def rest(sway=0.0, rattle=0.0):
        """
        The wall stands. The skeletons look about over the top, the flag moves
        and the shields rattle a little.
        """
        result = {
            "skel.A": t("skel.A", (Y, -3 * sway)),
            "skel.A.head": t("skel.A.head", (Z, 20 * sway), (X, 6)),
            "skel.A.arm": t("skel.A.arm", (X, 4 * rattle)),
            "skel.B": t("skel.B", (Y, 3 * sway)),
            "skel.B.head": t("skel.B.head", (Z, -24 * sway + 10), (X, -4)),
            "banner.cloth": t("banner.cloth", (X, 8 * sway), (Y, 6 + 6 * rattle)),
            "sign": t("sign", (Y, 2 * sway)),
        }
        for index in range(len(SHIELD_ANGLES)):
            phase = (index * 0.37) % 1
            result[f"shield.{index}"] = lean(index, 1.5 * rattle * math.sin((phase + sway) * math.pi), 0)
        return result

    def pose(base, changes):
        result = dict(base)
        result.update(changes)
        return result

    def battered(breath=0.0):
        """Low HP: two shields lean out, the wall sags, the skeletons slump and the flag hangs."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, 0.014)),
                "base": t("base", (Y, -2), (X, 1)),
                "shield.0": lean(0, 18, -8),
                "shield.1": lean(1, -6, 4),
                "shield.3": lean(3, 24 + breath * 3, 6),
                "shield.4": lean(4, 6),
                "skel.A": t("skel.A", (X, 14), (Y, 6)),
                "skel.A.head": t("skel.A.head", (X, 22 + breath * 6), (Y, 14)),
                "skel.A.arm": t("skel.A.arm", (X, 70)),
                "skel.B": t("skel.B", (X, 10), (Y, -8)),
                "skel.B.head": t("skel.B.head", (X, 20), (Y, -16 - breath * 6)),
                "banner": t("banner", (Y, 12)),
                "banner.cloth": t("banner.cloth", (Y, -8)),
                "sign": t("sign", (Y, 14)),
            },
        )

    def jolt(base, amount=1.0, forward=False):
        """A blow shakes the wall: the shields knock, the skeletons duck."""
        direction = -1 if forward else 1
        changes = {
            "base@loc": at("base", (0, 0.02 * amount * direction, 0.016 * amount)),
            "base": t("base", (X, -4 * amount * direction)),
            "skel.A.head": t("skel.A.head", (X, 24 * amount), (Z, 10 * amount)),
            "skel.B.head": t("skel.B.head", (X, 24 * amount), (Z, -10 * amount)),
            "skel.A": t("skel.A", (X, 10 * amount)),
            "skel.B": t("skel.B", (X, 10 * amount)),
            "banner.cloth": t("banner.cloth", (Y, 20 * amount)),
            "sign": t("sign", (Y, 10 * amount)),
        }
        for index in range(len(SHIELD_ANGLES)):
            changes[f"shield.{index}"] = lean(index, (-8 if index % 2 else 6) * amount * direction, 3 * amount)
        return pose(base, changes)

    def fallen(base, bounce=0.0, rise=0.0):
        """
        The wall falls apart: each shield falls flat out, the skeletons fall
        back, the flag and the sign go down. `rise` (0 to 1 for each shield,
        in turn) stands the shields up again, for a Rebirth.
        """
        changes = {
            "base@loc": at("base", (0, 0, 0.012)),
            "base": t("base", (X, 2), (Y, -2)),
            "skel.A": t("skel.A", (X, -80 + bounce), (Y, 10)),
            "skel.A.head": t("skel.A.head", (X, -20), (Z, 30)),
            "skel.A.arm": t("skel.A.arm", (X, -40)),
            "skel.B": t("skel.B", (X, -78 + bounce), (Y, -12)),
            "skel.B.head": t("skel.B.head", (X, -20), (Z, -30)),
            "skel.B.arm": t("skel.B.arm", (Y, 30)),
            "banner": t("banner", (Y, 60)),
            "banner.cloth": t("banner.cloth", (X, -10)),
            "sign": t("sign", (Y, -58)),
        }
        for index in range(len(SHIELD_ANGLES)):
            # The end shields fall first in a death and stand up last in a Rebirth.
            up = max(0.0, min(1.0, rise * len(SHIELD_ANGLES) - index))
            changes[f"shield.{index}"] = lean(index, lerp(78 - bounce * (index % 2), 0, up), 0)
        return pose(base, changes)

    def falling(base, at_index):
        """The first shields are down and the others lean, part way into the death."""
        changes = {
            "skel.A": t("skel.A", (X, -30)),
            "skel.B": t("skel.B", (X, -30)),
            "skel.A.head": t("skel.A.head", (X, 20)),
            "skel.B.head": t("skel.B.head", (X, 20)),
            "banner": t("banner", (Y, 20)),
            "sign": t("sign", (Y, -20)),
        }
        for index in range(len(SHIELD_ANGLES)):
            changes[f"shield.{index}"] = lean(index, 50 if index in at_index else 14, 4)
        return pose(base, changes)

    def heave(lift, tilt):
        """A walk pose: the skeletons push and the whole wall hops and rocks."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, 0.03 * lift)),
                "base": t("base", (X, 4 * tilt), (Y, 3 * tilt)),
                "skel.A": t("skel.A", (X, 24)),
                "skel.B": t("skel.B", (X, 24)),
                "skel.A.head": t("skel.A.head", (X, -10)),
                "skel.B.head": t("skel.B.head", (X, -10)),
                "banner.cloth": t("banner.cloth", (X, -14 * lift), (Y, 10 * tilt)),
                "sign": t("sign", (Y, 6 * tilt)),
                **{f"shield.{i}": lean(i, 3 * tilt * (1 if i % 2 else -1)) for i in range(len(SHIELD_ANGLES))},
            },
        )

    # The attack: the skeleton with the hammer lifts it, then smashes it down
    # over the wall, and the wall shoves forward. The slash effect starts at
    # 50% of the attack (`MELEE_IMPACT` in fx.ts), so the blow lands at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            {
                "skel.A": t("skel.A", (X, -12)),
                "skel.A.head": t("skel.A.head", (X, -10)),
                "skel.A.arm": t("skel.A.arm", (X, 40)),
                "skel.B.head": t("skel.B.head", (Z, 30)),
            },
        )

    def smash(base):
        return pose(
            jolt(base, 0.8, forward=True),
            {
                "base@loc": at("base", (0, -0.04, 0.016)),
                "skel.A": t("skel.A", (X, 30)),
                "skel.A.head": t("skel.A.head", (X, 10)),
                "skel.A.arm": t("skel.A.arm", (X, -110)),
                "skel.B": t("skel.B", (X, 20)),
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

    # A Wall does not walk, but it can shuffle: the skeletons heave it on.
    walk = Clip("walk", 24, loop=True)
    walk.key(0, heave(0, 0)).key(6, heave(1, 1)).key(12, heave(0, 0)).key(18, heave(1, -1)).key(24, heave(0, 0))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, rest()).key(10, windup(rest())).key(15, smash(rest())).key(19, smash(rest()))
    attack.key(26, rest()).key(30, rest())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt(rest())).key(8, jolt(rest(), 0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest(), (0, 4))).key(18, falling(rest(), (0, 1, 3, 4)))
    death.key(26, fallen(rest())).key(30, fallen(rest(), 6)).key(36, fallen(rest()))
    clips.append(death)

    # Rebirth: the wall falls (45% of the event, `REBORN_FALL`), then the
    # shields stand up one by one and the skeletons climb back.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest(), (0, 4))).key(20, fallen(rest())).key(24, fallen(rest(), 3))
    rebirth.key(30, fallen(rest(), 0, 0.35)).key(36, fallen(rest(), 0, 0.7)).key(41, jolt(rest(), 0.6)).key(48, rest())
    clips.append(rebirth)

    # The summon: the wall comes up out of the ground, shield by shield.
    summon = Clip("summon", 24)
    summon.key(0, fallen(rest())).key(8, fallen(rest(), 0, 0.5)).key(14, jolt(rest(), 0.7)).key(24, rest())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "bone-rampart.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
