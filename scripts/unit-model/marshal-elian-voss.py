"""
Marshal Elian Voss (`human.marshalElianVoss`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an older commander with swept-back
grey hair and a short grey beard, steel pauldrons and arms, a long blue coat
with gold trim and a gold sun on the chest, a row of brass cartridges on the
belt, a blue cape, a sword in the right hand and a blue banner with a gold sun
on a pole in the left hand. Run it in Blender (see `unit_model_kit.py`). It
writes `apps/web/art/units/raw/marshal-elian-voss.glb`; then
`bun unit-model:pack marshal-elian-voss` packs it for the game.

The Battle camera sees the right side of a player Unit, so the sword is in
the right hand, and the banner stands behind him on the left. The banner
hangs in the plane of the pole and his front, so the camera sees its face.
He attacks at Mid Range: he points the sword, and the Holy light leaves at
20% of the attack. His cast (Rally) raises the sword and waves the banner.
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

SKIN = hex_color("#d49c78")
HAIR = hex_color("#c9c3b8")
HAIR_DARK = hex_color("#958f85")
EYES = hex_color("#1e1a16")
STEEL = hex_color("#a9adb2")
STEEL_DARK = hex_color("#6d7278")
BLUE = hex_color("#27449a")
BLUE_DARK = hex_color("#182c66")
GOLD = hex_color("#e0ae45")
GOLD_DARK = hex_color("#a37a2a")
BRASS = hex_color("#d9a24a")
LEATHER = hex_color("#6a3f25")
BOOT = hex_color("#4a3022")
TROUSERS = hex_color("#2a2a33")
WOOD = hex_color("#5a3a22")
GLOW = hex_color("#fff1b0")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.46
WAIST_Z = 0.54
CHEST_Z = 0.64
SHOULDER_Z = 0.73
NECK_Z = 0.77
HEAD_C = Vector((0, -0.006, 0.872))
KNEE_Z = 0.26
ANKLE_Z = 0.055
LEG_X = 0.066

# The left hand holds the banner pole by the hip; the right arm hangs with
# the sword. These are the rest (bind) positions.
SL = Vector((0.135, 0, SHOULDER_Z))
EL = Vector((0.2, 0.02, 0.585))
WL = Vector((0.205, -0.07, 0.5))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.135, 0, SHOULDER_Z))
ER = Vector((-0.175, 0.01, 0.57))
WR = Vector((-0.19, -0.04, 0.44))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.028
GRIP_L = WL + (WL - EL).normalized() * 0.028

POLE_BOTTOM = 0.02
POLE_TOP = 1.15
# The crossbar of the banner, and the cloth that hangs from it, to the front.
BAR_Z = 1.1
FLAG_LENGTH = 0.22
FLAG_DROP = 0.34

# At rest the sword points forward and down by the right leg.
BLADE = Vector((0.0, -0.4, -1.0)).normalized()
SWORD_LENGTH = 0.32

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.8), "chest"),
    ("head", (0, 0, 0.8), (0, 0, 0.97), "neck"),
    ("coat.B", (0, 0.08, 0.5), (0, 0.12, 0.14), "hips"),
    ("cape", (0, 0.09, 0.72), (0, 0.14, 0.3), "chest"),
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
    ("flag", (GRIP_L.x, GRIP_L.y, BAR_Z), (GRIP_L.x, GRIP_L.y - FLAG_LENGTH, BAR_Z), "pole"),
    ("sword", tuple(HAND_R), tuple(HAND_R + BLADE * 0.1), "hand.R"),
    # The Holy light of the blade: scale 0 hides it.
    ("glow", tuple(HAND_R), tuple(HAND_R + BLADE * 0.1), "sword"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def coat_weights(co):
    """The long coat follows the hips at the top, and the legs and its back panel lower."""
    t = clamp01((0.5 - co.z) / 0.36)
    back = clamp01((co.y - 0.0) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "coat.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side),
        "thigh.R": (1 - back) * t * clamp01(-side),
    }


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.6, 0.7)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.064, 0.07, 0.08), 12, 9)
    kit.cone(head.bm, (0, -0.068, 0.874), (0, -0.088, 0.856), 0.014, 0.004, 5)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.063 * sign, 0.004, 0.866), (0.012, 0.016, 0.02), 6, 4)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.025 * sign, -0.064, 0.878), (0.008, 0.006, 0.007), 6, 4)
        kit.box(eyes.bm, (0.027 * sign, -0.066, 0.893), (0.026, 0.01, 0.007))
    parts.append(eyes)

    # Grey hair swept back, with locks that stand up at the back.
    hair = Part("hair", HAIR, "head", shade=0.1)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.012, 0.012)), (0.07, 0.076, 0.082), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.z < 0.85 or (v.co.y < -0.035 and v.co.z < 0.92)], context="VERTS")
    for index, x in enumerate((-0.04, -0.015, 0.015, 0.04)):
        lock = kit.cone(hair.bm, HEAD_C + Vector((x, -0.03, 0.07)), HEAD_C + Vector((x * 1.4, 0.1, 0.06 - 0.01 * (index % 2))), 0.022, 0.004, 5)
        if index % 2:
            hair.paint(faces_of(lock), HAIR_DARK)
    parts.append(hair)

    beard = Part("beard", HAIR, "head", shade=0.1)
    verts = kit.sphere(beard.bm, (0, -0.03, 0.824), (0.06, 0.052, 0.052), 12, 7)
    kit.bmesh.ops.delete(beard.bm, geom=[v for v in verts if v.co.z > 0.855], context="VERTS")
    kit.cone(beard.bm, (0.036, -0.064, 0.842), (-0.036, -0.064, 0.842), 0.009, 0.009, 6, squash=0.7)
    parts.append(beard)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.75), (0, 0, 0.82), 0.031, 0.029, 8)
    parts.append(neck)
    return parts


def sun(part, center, normal, radius, color):
    """A gold sun: a disk and eight rays, on a face that looks along `normal`."""
    normal = Vector(normal).normalized()
    side = normal.cross(Z).normalized()
    up = side.cross(normal).normalized()
    gold = set(kit.cone(part.bm, center, center + normal * 0.006, radius * 0.45, radius * 0.45, 8))
    for index in range(8):
        a = 2 * math.pi * index / 8
        out = side * math.cos(a) + up * math.sin(a)
        reach = radius if index % 2 == 0 else radius * 0.7
        gold |= set(kit.cone(part.bm, center + out * radius * 0.3 + normal * 0.002, center + out * reach + normal * 0.002, radius * 0.16, 0.001, 3, squash=0.4))
    part.paint(faces_of(gold), color)


def body_parts():
    parts = []
    coat = Part("coat", BLUE, torso_weights)
    verts = kit.cone(coat.bm, (0, 0, 0.5), (0, 0, 0.73), 0.098, 0.114, 14, squash=0.76)
    # Gold trim down the front edge of the coat.
    for face in faces_of(verts):
        c = face.calc_center_median()
        if c.y < -0.06 and abs(c.x) < 0.014:
            coat.paint([face], GOLD)
    sun(coat, Vector((0, -0.088, 0.645)), (0, -1, 0), 0.04, GOLD)
    parts.append(coat)

    mantle = Part("mantle", BLUE_DARK, "chest")
    verts = kit.cone(mantle.bm, (0, 0.004, 0.69), (0, 0.004, 0.78), 0.12, 0.05, 14, caps=False, squash=0.8)
    mantle.paint({f for v in verts if v.co.z < 0.7 for f in v.link_faces}, GOLD)
    kit.torus(mantle.bm, (0, 0.002, 0.775), (0, 0.15, 1), 0.046, 0.016, 12, 5)
    parts.append(mantle)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.525), 0.104, 0.102, 14, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.084, 0.507), (0.03, 0.01, 0.026))
    belt.paint(faces_of(buckle), GOLD)
    # The brass cartridges on the belt, on his left front.
    for index in range(5):
        a = math.radians(18 + index * 15)
        x, y = 0.102 * math.sin(a), -0.084 * math.cos(a)
        tube = kit.cone(belt.bm, (x, y, 0.47), (x, y, 0.53), 0.011, 0.011, 6)
        belt.paint(faces_of(tube), BRASS)
    parts.append(belt)

    def coat_color(row, column):
        if row == 5:
            return GOLD
        return BLUE_DARK if column % 6 == 3 else BLUE

    # The skirt of the coat to the shins, open at the front.
    skirt = Part("skirt", BLUE, coat_weights)
    kit.ragged_cone(skirt, 0.5, 0.15, 0.104, 0.17, 16, 6, 0.8, 0.012, coat_color, BLUE_DARK, gap=math.radians(26), y_push=0.04)
    sun(skirt, Vector((0.0, 0.17, 0.28)), (0, 1, 0), 0.035, GOLD_DARK)
    parts.append(skirt)

    def cape_color(row, column):
        return GOLD if row == 4 else (BLUE_DARK if column % 3 == 1 else BLUE)

    cape = Part("cape", BLUE, cape_weights)
    kit.ragged_cone(cape, 0.76, 0.24, 0.1, 0.17, 12, 5, 0.75, 0.03, cape_color, BLUE_DARK, gap=math.radians(110), y_push=0.05)
    parts.append(cape)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(pauldron.bm, s + Vector((0.012 * sign, 0, 0.008)), (0.062, 0.058, 0.048), 12, 8)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.02 for f in v.link_faces}, GOLD)
        parts.append(pauldron)

        upper = Part(f"sleeve.{side}", BLUE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.036, 0.032, 8)
        parts.append(upper)

        vambrace = Part(f"vambrace.{side}", STEEL, f"forearm.{side}")
        verts = kit.cone(vambrace.bm, e, w, 0.034, 0.029, 8)
        vambrace.paint({f for v in verts if (v.co - w).length < 0.015 or (v.co - e).length < 0.01 for f in v.link_faces}, GOLD)
        parts.append(vambrace)

        gauntlet = Part(f"gauntlet.{side}", STEEL_DARK, f"hand.{side}", shade=0.05)
        kit.sphere(gauntlet.bm, w + d * 0.026, (0.024, 0.022, 0.028), 8, 6)
        parts.append(gauntlet)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.05, 0.04, 8)
        parts.append(thigh)

        poleyn = Part(f"poleyn.{side}", STEEL, f"shin.{side}", shade=0.05)
        kit.sphere(poleyn.bm, knee + Vector((0, -0.014, 0)), (0.04, 0.036, 0.034), 8, 6)
        parts.append(poleyn)

        greave = Part(f"greave.{side}", STEEL, f"shin.{side}")
        kit.cone(greave.bm, knee, ankle + Vector((0, 0, 0.06)), 0.042, 0.036, 8)
        parts.append(greave)

        boot = Part(f"boot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.07)), ankle - Vector((0, 0, 0.02)), 0.04, 0.042, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.032, 0.026), (0.066, 0.13, 0.052))
        cuff = kit.torus(boot.bm, ankle + Vector((0, 0, 0.07)), (0, 0, 1), 0.042, 0.006, 10, 4)
        boot.paint(faces_of(cuff), GOLD)
        parts.append(boot)
    return parts


def banner_parts():
    parts = []
    gx, gy = GRIP_L.x, GRIP_L.y
    pole = Part("pole", WOOD, "pole", shade=0.04)
    kit.cone(pole.bm, (gx, gy, POLE_BOTTOM), (gx, gy, POLE_TOP), 0.012, 0.011, 6)
    # The gold finial: a spear point over a ball.
    finial = set(kit.sphere(pole.bm, (gx, gy, POLE_TOP + 0.01), (0.02, 0.02, 0.02), 8, 6))
    finial |= set(kit.cone(pole.bm, (gx, gy, POLE_TOP + 0.02), (gx, gy, POLE_TOP + 0.09), 0.018, 0.001, 4, squash=0.4))
    pole.paint(faces_of(finial), GOLD)
    parts.append(pole)

    # The crossbar and the cloth turn around the pole together (the flag bone).
    flag = Part("flag", BLUE, "flag", shade=0.1)
    bar = kit.cone(flag.bm, (gx, gy + 0.02, BAR_Z), (gx, gy - FLAG_LENGTH - 0.02, BAR_Z), 0.008, 0.008, 6)
    flag.paint(faces_of(bar), GOLD_DARK)
    for end in (gy + 0.02, gy - FLAG_LENGTH - 0.02):
        knob = kit.sphere(flag.bm, (gx, end, BAR_Z), (0.012, 0.012, 0.012), 6, 4)
        flag.paint(faces_of(knob), GOLD)
    columns, rows = 6, 8

    def grid(offset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = column / columns
                # A swallowtail: the middle of the hem is higher.
                notch = 0.07 * (1 - abs(u - 0.5) * 2) * v
                z = BAR_Z - 0.01 - FLAG_DROP * v + notch
                ripple = 0.012 * math.sin(u * math.pi * 2 + v)
                line.append((gx + offset + ripple, gy - 0.01 - FLAG_LENGTH * u, z))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if row in (0, rows - 1) or column in (0, columns - 1):
            return GOLD
        return BLUE

    edges = panel(flag, grid(-0.004), grid(0.004), color_of)
    flag.paint(edges, GOLD)
    center = Vector((gx, gy - 0.01 - FLAG_LENGTH / 2, BAR_Z - 0.14))
    for sign in (1, -1):
        sun(flag, center + Vector((-0.008 * sign, 0, 0)), (-sign, 0, 0), 0.085, GOLD)
    parts.append(flag)
    return parts


def sword_parts():
    sword = Part("sword", STEEL, "sword", shade=0.04)
    guard_dir = DR.cross(BLADE).normalized()
    if guard_dir.length < 0.5:
        guard_dir = X
    guard = HAND_R + BLADE * 0.034
    tip = HAND_R + BLADE * SWORD_LENGTH
    kit.cone(sword.bm, guard, tip - BLADE * 0.03, 0.014, 0.011, 4, squash=0.22)
    kit.cone(sword.bm, tip - BLADE * 0.03, tip, 0.011, 0.001, 4, squash=0.22)
    cross = kit.cone(sword.bm, guard - guard_dir * 0.045, guard + guard_dir * 0.045, 0.008, 0.008, 6)
    sword.paint(faces_of(cross), GOLD)
    grip = kit.cone(sword.bm, HAND_R - BLADE * 0.045, guard, 0.009, 0.009, 6)
    sword.paint(faces_of(grip), BLUE_DARK)
    pommel = kit.sphere(sword.bm, HAND_R - BLADE * 0.052, (0.013, 0.013, 0.013), 8, 6)
    sword.paint(faces_of(pommel), GOLD)
    parts = [sword]

    # The Holy light along the blade, for the attack and the Rally.
    glow = Part("glow", GLOW, "glow", shade=0)
    kit.cone(glow.bm, guard + BLADE * 0.02, tip + BLADE * 0.04, 0.022, 0.002, 6)
    parts.append(glow)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("MarshalElianVoss", BONES)
    parts = head_parts() + body_parts() + limb_parts() + banner_parts() + sword_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "MarshalElianVossMesh")
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

    def stand(breath=0.0, sway=0.0, wave=0.0):
        """
        The command stance: turned to his right with the left foot forward,
        the banner upright at his left and the sword low and ready. The
        light of the blade is off.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -18)),
            "spine": t("spine", (Z, -4), (X, 3 + breath)),
            "chest": t("chest", (X, -3 - breath * 2)),
            "neck": t("neck", (Z, 10)),
            "head": t("head", (Z, 10 + sway * 3), (X, -2 + breath)),
            "upperarm.L": t("upperarm.L", (X, -breath * 2)),
            "hand.L": t("hand.L", (Z, 10)),
            "upperarm.R": t("upperarm.R", (Y, -8), (X, -10 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -20)),
            "hand.R": t("hand.R", (X, -30)),
            "thigh.L": t("thigh.L", (X, -14), (Y, -3)),
            "shin.L": t("shin.L", (X, 16)),
            "foot.L": t("foot.L", (X, -2)),
            "thigh.R": t("thigh.R", (X, 12), (Y, 3)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -20)),
            "coat.B": t("coat.B", (X, -6 - breath * 2), (Y, sway * 3)),
            "cape": t("cape", (X, -4 - breath * 3), (Y, sway * 3)),
            "flag": t("flag", (Z, 8 + sway * 6 + wave * 25)),
            "glow@scale": 0.0,
        }

    def slump(breath=0.0):
        """Low HP: down on the right knee, he holds himself up on the banner pole."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.2 - breath * 0.004)),
            hips=t("hips", (Z, -20)),
            spine=t("spine", (Z, -4), (X, 16 + breath * 3)),
            chest=t("chest", (X, 6 + breath * 2)),
            neck=t("neck", (Z, 8), (X, 6)),
            head=t("head", (Z, 8), (X, 10 + breath * 4), (Y, -5)),
            thigh__L=t("thigh.L", (X, -78), (Y, -4)),
            shin__L=t("shin.L", (X, 78)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4), (Y, 4)),
            shin__R=t("shin.R", (X, 92)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -30)),
            forearm__L=t("forearm.L", (X, -20)),
            hand__L=t("hand.L", (Z, 10), (X, 34)),
            upperarm__R=t("upperarm.R", (Y, -12), (X, 10)),
            forearm__R=t("forearm.R", (X, -30)),
            hand__R=t("hand.R", (X, -70)),
            coat__B=t("coat.B", (X, 50)),
            cape=t("cape", (X, 20)),
            flag=t("flag", (Z, -10)),
        )

    def recoil(base, amount=1.0):
        """A hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -4), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 10), (X, -14 * amount)),
            upperarm__L=t("upperarm.L", (X, -10 * amount), (Y, 6 * amount)),
            upperarm__R=t("upperarm.R", (Y, -24 * amount), (X, 12 * amount)),
            coat__B=t("coat.B", (X, 10 * amount)),
            cape=t("cape", (X, 16 * amount)),
            flag=t("flag", (Z, 30 * amount)),
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
            hand__R=t("hand.R", (X, 10)),
            flag=t("flag", (Z, -20)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the banner across the ground beside him."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.05)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (Y, 50), (X, 10)),
            hand__L=t("hand.L", (Z, 10), (Y, 30)),
            upperarm__R=t("upperarm.R", (Y, -50), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 50)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -22), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            coat__B=t("coat.B", (X, -20)),
            cape=t("cape", (X, -30)),
            # The cloth turns around the pole, so it lies flat on the ground.
            flag=t("flag", (Z, 90)),
        )

    def crouch(base):
        """Down on one knee, as a summon starts and a Rebirth gets up."""
        return pose(
            slump(),
            spine=t("spine", (Z, -4), (X, 22)),
            head=t("head", (Z, 10), (X, 18)),
        )

    def rally(base, wave=0.0):
        """The sword high and the banner up: a call to the Lane. The blade shines."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.004)),
            hips=t("hips", (Z, -12)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 6), (X, -16)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -16)),
            forearm__R=t("forearm.R", (X, -12)),
            hand__R=t("hand.R", (X, 40)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 10)),
            forearm__L=t("forearm.L", (X, -40)),
            hand__L=t("hand.L", (Z, 10), (X, 50)),
            cape=t("cape", (X, 10)),
            flag=t("flag", (Z, 8 + wave * 30)),
            glow_at_scale=1.0,
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.018)),
            spine=t("spine", (Z, -3), (X, 5)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -26)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -8), (X, -10 - 12 * front)),
                "coat__B": t("coat.B", (X, 12), (Y, 3 * front)),
                "cape": t("cape", (X, 10), (Y, 3 * front)),
                "flag": t("flag", (Z, 20 + 8 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (Z, -3), (X, 5)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -14)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 44)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "coat__B": t("coat.B", (X, 8)),
                "cape": t("cape", (X, 8)),
                "flag": t("flag", (Z, 24)),
            },
        )

    # The attack (Mid Range): he points the sword at the enemy, and the Holy
    # light leaves the blade at 20% of the attack (`FLIGHT_START` in fx.ts),
    # so the point is out at frame 6 of 30.
    def point(base, shine=1.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.015, -0.02)),
            hips=t("hips", (Z, -30)),
            spine=t("spine", (Z, -10), (X, 4)),
            chest=t("chest", (Z, -6)),
            neck=t("neck", (Z, 16)),
            head=t("head", (Z, 22), (X, 2)),
            upperarm__R=t("upperarm.R", (X, -86), (Z, 38)),
            forearm__R=t("forearm.R", (X, -6)),
            hand__R=t("hand.R", (X, -14)),
            thigh__L=t("thigh.L", (X, -30), (Y, -3)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 18), (Y, 3)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -28)),
            cape=t("cape", (X, 14)),
            flag=t("flag", (Z, 30)),
            glow_at_scale=shine,
        )

    def draw_back(base):
        return pose(
            base,
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -6), (X, -2)),
            head=t("head", (Z, 18)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -30)),
            forearm__R=t("forearm.R", (X, -70)),
            hand__R=t("hand.R", (X, 30)),
            glow_at_scale=0.6,
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

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, draw_back(stand())).key(6, point(stand(), 1.4)).key(10, point(stand(), 0.8))
    attack.key(16, point(stand(), 0.0)).key(24, stand()).key(30, stand())
    clips.append(attack)

    # Rally: the sword high, the banner waves, the blade shines.
    cast = Clip("cast", 24)
    cast.key(0, stand()).key(6, rally(stand(), 0)).key(10, rally(stand(), 1)).key(14, rally(stand(), -0.6)).key(18, rally(stand(), 0.4)).key(24, stand())
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
    rebirth.key(32, crouch(stand())).key(41, rally(stand(), 0.5)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.17))))
    summon.key(17, rally(stand(), 0.5)).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "marshal-elian-voss.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
