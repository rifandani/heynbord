"""
Warband Standard Bearer (`orc.warbandStandardBearer`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a lean, strong green orc with a
roar, tusks and long black locks, a red fur mantle with spiked iron
shoulder plates, a leather harness with bone charms, a dark kilt and fur leg
wraps, and a tall war standard in the left hand: a wrapped pole, a crossbar
of two curved horns with a skull, a ragged cream banner with a red sign and
red streamers. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/warband-standard-bearer.glb`; then
`bun unit-model:pack warband-standard-bearer` packs it for the game.

The Battle camera sees the right side of a player Unit, so the standard
stands at his left, behind him, and the banner hangs in the plane of the
pole and his front, so the camera sees its face. He attacks in melee: he
slams the horned top of the standard down in front of him. His cast (Rally)
plants the standard and shakes it with a roar.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#86a046")
SKIN_DARK = hex_color("#5f7430")
HAIR = hex_color("#231a16")
HAIR_LIGHT = hex_color("#3c2c24")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#5a1c18")
TUSK = hex_color("#efe4c6")
BONE = hex_color("#e2d6b6")
BONE_DARK = hex_color("#a8997a")
HORN = hex_color("#d9c8a2")
HORN_DARK = hex_color("#8e7a5a")
FUR = hex_color("#b8322a")
FUR_DARK = hex_color("#7a1e1a")
FUR_LIGHT = hex_color("#e1d3bb")
LEATHER = hex_color("#5c3a24")
LEATHER_DARK = hex_color("#382416")
IRON = hex_color("#77736c")
IRON_DARK = hex_color("#4a4743")
STEEL = hex_color("#bdb9b0")
WOOD = hex_color("#5a3c26")
ROPE = hex_color("#c4a676")
CLOTH = hex_color("#e6d6b4")
CLOTH_DARK = hex_color("#b9a67f")
RED = hex_color("#b3302a")
RED_DARK = hex_color("#6e1d1a")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.45
WAIST_Z = 0.53
CHEST_Z = 0.63
SHOULDER_Z = 0.72
NECK_Z = 0.76
HEAD_C = Vector((0, -0.03, 0.85))
KNEE_Z = 0.26
ANKLE_Z = 0.055
LEG_X = 0.07

# The left hand holds the standard by the hip; the right arm hangs with a
# fist. These are the rest (bind) positions.
SL = Vector((0.16, 0, SHOULDER_Z))
EL = Vector((0.225, 0.02, 0.585))
WL = Vector((0.235, -0.06, 0.5))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.16, 0, SHOULDER_Z))
ER = Vector((-0.215, 0.01, 0.58))
WR = Vector((-0.225, -0.04, 0.45))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
GRIP_L = WL + (WL - EL).normalized() * 0.03

POLE_BOTTOM = 0.02
POLE_TOP = 1.2
# The horned crossbar, and the banner that hangs from it.
BAR_Z = 1.12
BANNER_HALF = 0.16
BANNER_DROP = 0.42

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.01, NECK_Z), (0, -0.02, 0.79), "chest"),
    ("head", (0, -0.02, 0.79), (0, -0.03, 0.96), "neck"),
    ("locks", (0, 0.05, 0.86), (0, 0.1, 0.62), "head"),
    ("kilt.B", (0, 0.08, 0.48), (0, 0.1, 0.24), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.09, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("pole", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("banner", (GRIP_L.x, GRIP_L.y, BAR_Z), (GRIP_L.x, GRIP_L.y, BAR_Z - 0.2), "pole"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.49, 0.57)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def locks_weights(co):
    return blend("locks", "head", co.z, 0.78, 0.84)


def kilt_weights(co):
    """The kilt follows the hips at the top, and the legs and its back panel lower."""
    t = clamp01((0.47 - co.z) / 0.2)
    back = clamp01(co.y / 0.08)
    side = co.x / 0.1
    return {
        "hips": 1 - t,
        "kilt.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side),
        "thigh.R": (1 - back) * t * clamp01(-side),
    }


def banner_weights(co):
    """The cloth hangs from the crossbar: its top stays, and its hem swings."""
    t = clamp01((BAR_Z - 0.04 - co.z) / 0.18)
    return {"banner": t, "pole": 1 - t}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.066, 0.07, 0.074), 12, 9)
    jaw = kit.sphere(head.bm, HEAD_C + Vector((0, -0.028, -0.045)), (0.062, 0.05, 0.04), 12, 6)
    head.paint(faces_of(jaw), SKIN)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.068, 0.002)), HEAD_C + Vector((0, -0.088, -0.016)), 0.017, 0.006, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.062 * sign, 0.004, 0.0)), HEAD_C + Vector((0.13 * sign, 0.03, 0.03)), 0.02, 0.002, 5, squash=0.4)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.026 * sign, -0.064, 0.012)), (0.009, 0.006, 0.007), 6, 4)
        brow = kit.box(face.bm, HEAD_C + Vector((0.028 * sign, -0.066, 0.03)), (0.032, 0.014, 0.012))
        face.paint(faces_of(brow), SKIN_DARK)
    # A roar: the mouth wide open.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.068, -0.042)), (0.034, 0.016, 0.026), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.03 * sign, -0.068, -0.064)), HEAD_C + Vector((0.038 * sign, -0.078, -0.022)), 0.009, 0.001, 5)
    parts.append(tusks)

    hair = Part("hair", HAIR, "head", shade=0.08)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.012, 0.012)), (0.072, 0.076, 0.078), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.z < HEAD_C.z - 0.02 or (v.co.y < -0.035 and v.co.z < HEAD_C.z + 0.05)], context="VERTS")
    parts.append(hair)

    # Long black locks that fly back.
    locks = Part("locks", HAIR, locks_weights)
    for index, angle in enumerate(range(-120, 121, 30)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.066 * math.sin(a), 0.066 * math.cos(a) + 0.01, 0.02))
        length = 0.22 if abs(angle) < 60 else 0.16
        bottom = top + Vector((0.035 * math.sin(a), 0.08 + 0.02 * math.cos(a), -length))
        middle = (top + bottom) / 2 + Vector((0.012 * math.sin(a), 0.03, 0.01))
        verts = kit.tube(locks.bm, [top, middle, bottom], [0.015, 0.012, 0.006], 5)
        if index % 2:
            locks.paint(faces_of(verts), HAIR_LIGHT)
    parts.append(locks)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.01, 0.74), (0, -0.02, 0.82), 0.042, 0.04, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    # A strong chest over a narrower waist.
    kit.sphere(torso.bm, (0, -0.005, 0.66), (0.15, 0.1, 0.1), 14, 8)
    kit.cone(torso.bm, (0, 0, 0.5), (0, 0, 0.64), 0.1, 0.13, 12, squash=0.75)
    parts.append(torso)

    harness = Part("harness", LEATHER, torso_weights, shade=0.05)
    for sign in (1, -1):
        kit.tube(harness.bm, [(0.11 * sign, -0.06, 0.74), (0.02 * sign, -0.105, 0.64), (-0.08 * sign, -0.09, 0.52)], [0.012] * 3, 4)
    # A leather belly guard and the belt with a skull buckle.
    kit.cone(harness.bm, (0, 0, 0.47), (0, 0, 0.56), 0.112, 0.104, 12, squash=0.8)
    belt = kit.cone(harness.bm, (0, 0, 0.455), (0, 0, 0.49), 0.116, 0.114, 12, squash=0.8)
    harness.paint(faces_of(belt), LEATHER_DARK)
    skull = kit.sphere(harness.bm, (0, -0.096, 0.478), (0.026, 0.014, 0.028), 8, 6)
    harness.paint(faces_of(skull), BONE)
    for sign in (1, -1):
        eye = kit.sphere(harness.bm, (0.009 * sign, -0.108, 0.484), (0.006, 0.004, 0.006), 4, 3)
        harness.paint(faces_of(eye), EYES)
    # Bone charms on the chest strap.
    for along in (0.3, 0.6):
        p = Vector((0.11, -0.06, 0.74)).lerp(Vector((0.02, -0.105, 0.64)), along)
        charm = kit.cone(harness.bm, p + Vector((0, -0.012, 0)), p + Vector((0, -0.016, -0.04)), 0.01, 0.001, 4)
        harness.paint(faces_of(charm), BONE)
    parts.append(harness)

    # The red fur mantle, with a pale edge at the front.
    def mantle_color(row, column):
        return FUR_DARK if column % 3 == 1 else FUR

    mantle = Part("mantle", FUR, "chest", shade=0.12)
    kit.ragged_cone(mantle, 0.8, 0.5, 0.07, 0.19, 14, 3, 0.8, 0.06, mantle_color, FUR_DARK, gap=math.radians(55), y_push=0.04)
    trim = kit.torus(mantle.bm, (0, 0.0, 0.77), (0, 0.2, 1), 0.07, 0.022, 12, 5)
    mantle.paint(faces_of(trim), FUR_LIGHT)
    parts.append(mantle)

    def kilt_color(row, column):
        if row == 3:
            return IRON
        return LEATHER_DARK if column % 3 == 0 else LEATHER

    kilt = Part("kilt", LEATHER, kilt_weights)
    kit.ragged_cone(kilt, 0.48, 0.24, 0.112, 0.15, 14, 4, 0.82, 0.04, kilt_color, LEATHER_DARK, gap=math.radians(20))
    parts.append(kilt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.01 * sign, 0, -0.01)), (0.05, 0.05, 0.05), 10, 7)
        kit.cone(upper.bm, s, e, 0.046, 0.038, 8)
        parts.append(upper)

        # A spiked iron shoulder plate.
        plate = Part(f"plate.{side}", IRON, f"upperarm.{side}", shade=0.08)
        verts = kit.sphere(plate.bm, s + Vector((0.018 * sign, 0, 0.026)), (0.062, 0.058, 0.04), 10, 6)
        plate.paint({f for v in verts if v.co.z < s.z + 0.0 for f in v.link_faces}, IRON_DARK)
        for dx, dy in ((0.0, -0.025), (0.0, 0.025), (0.03, 0.0)):
            spike = kit.cone(plate.bm, s + Vector(((0.02 + dx) * sign, dy, 0.05)), s + Vector(((0.03 + dx * 1.3) * sign, dy * 1.2, 0.11)), 0.013, 0.001, 4)
            plate.paint(faces_of(spike), STEEL)
        parts.append(plate)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.038, 0.032, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", IRON, f"forearm.{side}", shade=0.05)
        verts = kit.cone(bracer.bm, e + d * 0.04, w - d * 0.004, 0.041, 0.036, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.02 for f in v.link_faces}, LEATHER)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.028, (0.03, 0.026, 0.032), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", LEATHER_DARK, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.056, 0.044, 8)
        parts.append(thigh)

        # Pale fur wraps on the shins, an iron knee guard.
        shin = Part(f"shin.{side}", FUR_LIGHT, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.05)), 0.05, 0.046, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 50) % 3 == 0:
                shin.paint([face], ROPE)
        guard = kit.sphere(shin.bm, knee + Vector((0, -0.024, 0.005)), (0.042, 0.026, 0.04), 8, 6)
        shin.paint(faces_of(guard), IRON)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.06)), ankle - Vector((0, 0, 0.02)), 0.046, 0.048, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.035, 0.026), (0.075, 0.14, 0.052))
        parts.append(boot)
    return parts


def standard_parts():
    parts = []
    gx, gy = GRIP_L.x, GRIP_L.y
    pole = Part("pole", WOOD, "pole", shade=0.04)
    points = []
    for index in range(7):
        z = lerp(POLE_BOTTOM, POLE_TOP, index / 6)
        points.append(Vector((gx + 0.006 * math.sin(index * 2.1), gy, z)))
    kit.tube(pole.bm, points, [0.014] * 7, 6)
    # Rope wraps on the pole.
    for z in (0.62, 0.78, 0.96):
        wrap = kit.cone(pole.bm, (gx, gy, z), (gx, gy, z + 0.035), 0.018, 0.018, 6)
        pole.paint(faces_of(wrap), ROPE)
    spike = kit.cone(pole.bm, (gx, gy, POLE_BOTTOM + 0.04), (gx, gy, POLE_BOTTOM - 0.02), 0.016, 0.002, 4)
    pole.paint(faces_of(spike), IRON)

    # The crossbar: two horns that go to the front and to the back and curl up.
    horns = set()
    for sign in (1, -1):
        horns |= set(
            kit.tube(
                pole.bm,
                [
                    Vector((gx, gy, BAR_Z + 0.02)),
                    Vector((gx, gy + 0.12 * sign, BAR_Z + 0.0)),
                    Vector((gx, gy + 0.22 * sign, BAR_Z + 0.05)),
                    Vector((gx, gy + 0.25 * sign, BAR_Z + 0.14)),
                ],
                [0.03, 0.024, 0.014, 0.003],
                6,
            )
        )
    pole.paint(faces_of(horns), HORN)
    for face in faces_of(horns):
        if face.calc_center_median().z > BAR_Z + 0.08:
            pole.paint([face], HORN_DARK)

    # The skull on top of the pole.
    skull = set(kit.sphere(pole.bm, (gx, gy - 0.01, POLE_TOP + 0.02), (0.04, 0.042, 0.042), 10, 7))
    skull |= set(kit.cone(pole.bm, (gx, gy - 0.03, POLE_TOP + 0.0), (gx, gy - 0.05, POLE_TOP - 0.03), 0.026, 0.02, 6))
    pole.paint(faces_of(skull), BONE)
    for dx in (0.016, -0.016):
        eye = kit.sphere(pole.bm, (gx + dx, gy - 0.044, POLE_TOP + 0.025), (0.01, 0.006, 0.01), 4, 3)
        pole.paint(faces_of(eye), EYES)
    parts.append(pole)

    # The banner: a cream cloth with a red sign and a ragged hem, on the camera side of the pole.
    banner = Part("banner", CLOTH, banner_weights, shade=0.1)
    columns, rows = 8, 8
    face_x = gx - 0.02

    def grid(offset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = lerp(-1, 1, column / columns)
                torn = 0.06 * v * (((column * 7) % 5) / 4) if row == rows else 0.0
                z = BAR_Z - 0.03 - BANNER_DROP * v + torn
                ripple = 0.014 * math.sin(u * 3 + v * 2)
                line.append((face_x + offset + ripple, gy + u * lerp(BANNER_HALF, BANNER_HALF * 0.92, v), z))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        u = lerp(-1, 1, (column + 0.5) / columns)
        v = (row + 0.5) / rows
        if row == rows - 1 or column in (0, columns - 1):
            return RED_DARK
        # The red sign on the cream field: a bar down the middle and a bar across it.
        if abs(u) < 0.26 and 0.12 < v < 0.82:
            return RED
        if abs(u) < 0.62 and 0.3 < v < 0.44:
            return RED
        return CLOTH if (row + column) % 5 else CLOTH_DARK

    panel(banner, grid(-0.004), grid(0.004), color_of)
    # Red streamers from the ends of the crossbar.
    for sign in (1, -1):
        top = Vector((face_x, gy + 0.2 * sign, BAR_Z + 0.03))
        streamer = kit.tube(banner.bm, [top, top + Vector((0, 0.03 * sign, -0.16)), top + Vector((0, 0.02 * sign, -0.3))], [0.014, 0.012, 0.004], 4)
        banner.paint(faces_of(streamer), RED)
    parts.append(banner)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("WarbandStandardBearer", BONES)
    parts = head_parts() + body_parts() + limb_parts() + standard_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "WarbandStandardBearerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def pose(base, **changes):
        result = dict(base)
        for key, value in changes.items():
            result[key.replace("__", ".").replace("_at_", "@")] = value
        return result

    def stand(breath=0.0, sway=0.0):
        """
        The idle stance: turned to his right, the standard upright at his
        left and the right fist low and ready. The banner moves in the wind.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -16)),
            "spine": t("spine", (Z, -4), (X, 6 + breath)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (Z, 8)),
            "head": t("head", (Z, 8 + sway * 4), (X, -4 + breath * 2)),
            "upperarm.L": t("upperarm.L", (X, -breath * 2)),
            "upperarm.R": t("upperarm.R", (Y, -8), (X, -8 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -24)),
            "thigh.L": t("thigh.L", (X, -14), (Y, -4)),
            "shin.L": t("shin.L", (X, 16)),
            "foot.L": t("foot.L", (X, -2)),
            "thigh.R": t("thigh.R", (X, 12), (Y, 4)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -20)),
            "locks": t("locks", (X, -breath * 4), (Y, sway * 4)),
            "kilt.B": t("kilt.B", (X, -4)),
            "banner": t("banner", (Y, sway * 5), (X, 4 + breath * 3)),
        }

    def slump(breath=0.0):
        """Low HP: down on the right knee, both hands on the pole."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.2 - breath * 0.004)),
            hips=t("hips", (Z, -18)),
            spine=t("spine", (Z, -4), (X, 18 + breath * 3)),
            chest=t("chest", (X, 6 + breath * 2)),
            head=t("head", (Z, 6), (X, 12 + breath * 4), (Y, -6)),
            thigh__L=t("thigh.L", (X, -78), (Y, -4)),
            shin__L=t("shin.L", (X, 78)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4), (Y, 4)),
            shin__R=t("shin.R", (X, 92)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -30)),
            forearm__L=t("forearm.L", (X, -20)),
            hand__L=t("hand.L", (X, 34)),
            # The pole slides up in the hand, so its foot stays on the ground.
            pole_at_loc=at("pole", (0, 0, 0.17)),
            upperarm__R=t("upperarm.R", (X, -40), (Z, 40)),
            forearm__R=t("forearm.R", (X, -50)),
            locks=t("locks", (X, 20)),
            kilt__B=t("kilt.B", (X, 50)),
            banner=t("banner", (X, -12)),
        )

    def recoil(base, amount=1.0):
        """A hit pushes the upper body back, and the banner swings."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -4), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 8), (X, -16 * amount)),
            upperarm__L=t("upperarm.L", (X, -8 * amount), (Y, 6 * amount)),
            upperarm__R=t("upperarm.R", (Y, -24 * amount), (X, 12 * amount)),
            locks=t("locks", (X, -16 * amount)),
            banner=t("banner", (X, 16 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 20)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 6)),
            locks=t("locks", (X, 20)),
            banner=t("banner", (X, -20)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the standard down across the ground beside him."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.05)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, -12), (Z, 25)),
            upperarm__L=t("upperarm.L", (Y, 50), (X, 10)),
            # The pole turns, so the banner lies flat on the ground.
            hand__L=t("hand.L", (Z, 90), (Y, 30)),
            upperarm__R=t("upperarm.R", (Y, -60), (X, 10)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -22), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            locks=t("locks", (X, -40)),
            kilt__B=t("kilt.B", (X, -20)),
            banner=t("banner", (X, 0)),
        )

    def crouch(base):
        """Down on one knee, as a summon starts and a Rebirth gets up."""
        return pose(
            slump(),
            spine=t("spine", (Z, -4), (X, 24)),
            head=t("head", (Z, 6), (X, 18)),
        )

    def rally(base, shake=0.0):
        """The standard high and the right fist up, with a roar: a call to the Lane."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.004)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -12)),
            head=t("head", (Z, 6), (X, -24)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -20)),
            forearm__R=t("forearm.R", (X, -30)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 10)),
            forearm__L=t("forearm.L", (X, -50)),
            hand__L=t("hand.L", (X, 60 + shake * 10)),
            locks=t("locks", (X, 10)),
            banner=t("banner", (X, 10 + shake * 20), (Y, shake * 10)),
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.018)),
            spine=t("spine", (Z, -3), (X, 10)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -28)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -8), (X, -8 - 16 * front)),
                "kilt__B": t("kilt.B", (X, 12)),
                "locks": t("locks", (X, -8), (Y, 4 * front)),
                "banner": t("banner", (X, 20), (Y, 6 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (Z, -3), (X, 10)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -16)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 46)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "kilt__B": t("kilt.B", (X, 8)),
                "locks": t("locks", (X, -4)),
                "banner": t("banner", (X, 24)),
            },
        )

    # The attack: he lifts the standard high, then slams its horned top down
    # in front of him. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the slam lands at frame 15 of 30.
    def lift(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.01)),
            hips=t("hips", (Z, -22)),
            spine=t("spine", (Z, -6), (X, -8)),
            chest=t("chest", (X, -8)),
            head=t("head", (Z, 14), (X, -10)),
            upperarm__L=t("upperarm.L", (X, -110), (Y, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            hand__L=t("hand.L", (X, 90)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -20)),
            forearm__R=t("forearm.R", (X, -60)),
            thigh__L=t("thigh.L", (X, -22), (Y, -4)),
            shin__L=t("shin.L", (X, 22)),
            thigh__R=t("thigh.R", (X, 16), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, -30)),
            locks=t("locks", (X, -10)),
            banner=t("banner", (X, -20)),
        )

    def slam(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.035, -0.04)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (Z, 4), (X, 18)),
            chest=t("chest", (Z, 6), (X, 8)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, -10)),
            forearm__L=t("forearm.L", (X, -10)),
            # The standard leans far forward, so its top lands in front of him.
            hand__L=t("hand.L", (X, 148)),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -30)),
            forearm__R=t("forearm.R", (X, -40)),
            thigh__L=t("thigh.L", (X, -40), (Y, -4)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 24), (Y, 4)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -30)),
            kilt__B=t("kilt.B", (X, 10)),
            locks=t("locks", (X, -20)),
            banner=t("banner", (X, 40)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 22, loop=True)
    walk.key(0, step(1)).key(5, passing("R")).key(11, step(-1)).key(16, passing("L")).key(22, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, lift(stand())).key(15, slam(stand())).key(19, slam(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    # Rally: the standard high and shaking, with a roar.
    cast = Clip("cast", 24)
    cast.key(0, stand()).key(6, rally(stand(), 0)).key(9, rally(stand(), 1)).key(12, rally(stand(), -1)).key(15, rally(stand(), 1)).key(18, rally(stand(), 0)).key(24, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, rally(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.17))))
    summon.key(17, rally(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "warband-standard-bearer.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
