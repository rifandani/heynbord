"""
Grix Ratwhistle (`goblin.grixRatwhistle`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a small grey goblin with wild
white hair, brass goggles on the brow and very large ears, a ragged green
cloak over a red neckerchief and leather straps, patched olive trousers and
tall boots, a long rifle with a brass scope, and a pet rat with a brass bell
on his shoulder. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/grix-ratwhistle.glb`; then
`bun unit-model:pack grix-ratwhistle` packs it for the game.

The left hand always holds the rifle (IK to the `grip.L` bone). The attack
shoulders the rifle with IK and the `Aim` constraint, and fires at 20% of
the clip, when the projectile leaves.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#a4a29a")
SKIN_DARK = hex_color("#7d7b74")
EAR = hex_color("#d89a92")
HAIR = hex_color("#ecebe6")
EYES = hex_color("#f0a43a")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a2a26")
BRASS = hex_color("#c99a45")
LENS = hex_color("#2c3a46")
CLOAK = hex_color("#6b7a3a")
CLOAK_DARK = hex_color("#4d5a2a")
SCARF = hex_color("#b23a2c")
VEST = hex_color("#5e3a22")
LEATHER = hex_color("#7a4a2a")
SHIRT = hex_color("#c8b48a")
TROUSERS = hex_color("#62683a")
PATCH = hex_color("#8a7a52")
BOOT = hex_color("#5a3420")
WOOD = hex_color("#6a3c20")
IRON = hex_color("#3e3c3a")
RAT = hex_color("#8f8a84")
RAT_PINK = hex_color("#e3a29a")
FLASH = hex_color("#ffd36a")
FLASH_HOT = hex_color("#fff3c4")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.3
WAIST_Z = 0.36
CHEST_Z = 0.42
SHOULDER_Z = 0.49
NECK_Z = 0.51
HEAD_C = Vector((0, -0.012, 0.62))
KNEE_Z = 0.17
ANKLE_Z = 0.04
LEG_X = 0.048

# The right hand holds the rifle at the hip; the rifle points up across the
# body, and the left hand holds its fore-end. These are the rest positions.
SL = Vector((0.095, 0, SHOULDER_Z))
EL = Vector((0.14, -0.03, 0.37))
SR = Vector((-0.095, 0, SHOULDER_Z))
ER = Vector((-0.135, 0.03, 0.37))
WR = Vector((-0.085, -0.075, 0.29))
TR = WR + (WR - ER).normalized() * 0.04

RIFLE = Vector((0.55, -0.35, 0.76)).normalized()
GRIP_R = WR + (WR - ER).normalized() * 0.022
FORE_END = 0.13
GRIP_L = GRIP_R + RIFLE * FORE_END
WL = GRIP_L
TL = WL + (WL - EL).normalized() * 0.04
MUZZLE = 0.4

RAT_C = Vector((0.115, 0.01, 0.53))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.54), "chest"),
    ("head", (0, 0, 0.54), (0, 0, 0.72), "neck"),
    ("cape", (0, 0.06, 0.45), (0, 0.1, 0.2), "chest"),
    ("rat", tuple(RAT_C), tuple(RAT_C + Vector((0, -0.05, 0))), "chest"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
    ("pole.R", (-0.3, 0.2, 0.3), (-0.3, 0.2, 0.35), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.016), f"shin.{side}"),
    ]
BONES += [
    ("rifle", tuple(GRIP_R), tuple(GRIP_R + RIFLE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + RIFLE * 0.05), "rifle"),
    ("flash", tuple(GRIP_R + RIFLE * MUZZLE), tuple(GRIP_R + RIFLE * (MUZZLE + 0.05)), "rifle"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.32, 0.39)
    return blend("spine", "chest", co.z, 0.4, 0.46)


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.38, 0.47)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.078, 0.078, 0.082), 14, 10)
    # A narrow chin and a long pointed nose.
    kit.sphere(head.bm, (0, -0.04, 0.565), (0.048, 0.04, 0.032), 10, 6)
    kit.cone(head.bm, (0, -0.072, 0.615), (0, -0.112, 0.6), 0.016, 0.003, 6)
    for sign in (1, -1):
        # Goblin ears: very large, out to the sides and a little up.
        ear = kit.cone(head.bm, (0.07 * sign, 0.0, 0.625), (0.205 * sign, 0.035, 0.68), 0.04, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, (0.031 * sign, -0.071, 0.63), (0.02, 0.01, 0.018), 8, 6)
        pupil = kit.sphere(face.bm, (0.03 * sign, -0.08, 0.629), (0.009, 0.004, 0.01), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
        brow = kit.box(face.bm, (0.033 * sign, -0.072, 0.654), (0.032, 0.01, 0.007))
        face.paint(faces_of(brow), SKIN_DARK)
    smile = kit.tube(face.bm, [(0.028, -0.068, 0.585), (0.0, -0.078, 0.575), (-0.028, -0.068, 0.585)], [0.004] * 3, 4)
    face.paint(faces_of(smile), MOUTH)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.06)
    # Wild white hair: a fluffy mass with short tufts that stick out.
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.022, 0.05)), (0.082, 0.078, 0.055), 12, 7)
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.05, 0.0)), (0.07, 0.05, 0.06), 10, 6)
    for index in range(9):
        a = math.radians(-140 + index * 35)
        root = HEAD_C + Vector((0.055 * math.sin(a), 0.03 + 0.04 * math.cos(a), 0.07))
        reach = 0.05 + 0.02 * ((index * 5) % 3)
        tip = root + Vector((reach * math.sin(a), 0.02 + reach * math.cos(a), 0.035 - 0.012 * (index % 2)))
        kit.cone(hair.bm, root, tip, 0.032, 0.006, 5)
    parts.append(hair)

    goggles = Part("goggles", BRASS, "head", shade=0.05)
    kit.torus(goggles.bm, HEAD_C + Vector((0, 0.004, 0.04)), (0, 0.35, 1), 0.08, 0.007, 16, 4)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.028 * sign, -0.07, 0.07))
        out = Vector((0, -1, 0.45)).normalized()
        kit.cone(goggles.bm, center - out * 0.01, center + out * 0.02, 0.024, 0.022, 10)
        lens = kit.cone(goggles.bm, center + out * 0.02, center + out * 0.024, 0.017, 0.017, 10)
        goggles.paint(faces_of(lens), LENS)
    parts.append(goggles)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.49), (0, 0, 0.57), 0.026, 0.024, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    shirt = Part("shirt", SHIRT, torso_weights)
    kit.cone(shirt.bm, (0, 0, 0.3), (0, 0, 0.49), 0.064, 0.074, 12, squash=0.8)
    parts.append(shirt)

    vest = Part("vest", VEST, torso_weights)
    verts = kit.cone(vest.bm, (0, 0, 0.32), (0, 0, 0.49), 0.069, 0.079, 12, squash=0.8)
    # The vest is open at the front, so the shirt shows.
    open_front = [v for v in verts if v.co.y < -0.05 and abs(v.co.x) < 0.02]
    vest.paint(faces_of(open_front), SHIRT)
    parts.append(vest)

    # A strap across the chest, with the brass whistle on a chain.
    straps = Part("straps", LEATHER, "chest", shade=0.04)
    kit.tube(straps.bm, [(-0.07, -0.05, 0.49), (-0.02, -0.07, 0.44), (0.05, -0.064, 0.38), (0.072, -0.03, 0.34)], [0.007] * 4, 4)
    whistle = kit.cone(straps.bm, (0.0, -0.077, 0.42), (0.0, -0.08, 0.38), 0.008, 0.01, 6)
    straps.paint(faces_of(whistle), BRASS)
    parts.append(straps)

    scarf = Part("scarf", SCARF, "chest")
    kit.torus(scarf.bm, (0, 0.0, 0.5), (0, 0.15, 1), 0.04, 0.016, 12, 5)
    kit.cone(scarf.bm, (0, -0.05, 0.5), (0.01, -0.07, 0.43), 0.03, 0.003, 4, squash=0.4)
    parts.append(scarf)

    def cloak_color(row, column):
        return CLOAK_DARK if column % 3 == 1 or row == 3 else CLOAK

    cloak = Part("cloak", CLOAK, cape_weights)
    kit.ragged_cone(cloak, 0.52, 0.16, 0.05, 0.13, 14, 4, 0.85, 0.06, cloak_color, CLOAK_DARK, gap=math.radians(80), y_push=0.04)
    hood = kit.torus(cloak.bm, (0, 0.03, 0.505), (0, 0.4, 1), 0.06, 0.02, 12, 5)
    cloak.paint(faces_of(hood), CLOAK_DARK)
    parts.append(cloak)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, 0, 0.3), (0, 0, 0.33), 0.068, 0.067, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.055, 0.315), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), BRASS)
    kit.box(belt.bm, (0.07, -0.02, 0.28), (0.03, 0.04, 0.045))
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.25), (0, 0, 0.31), 0.064, 0.064, 12, squash=0.82)
    parts.append(hips)
    return parts


def rat_parts():
    rat = Part("rat", RAT, "rat", shade=0.08)
    c = RAT_C
    kit.sphere(rat.bm, c + Vector((0, 0.01, 0.018)), (0.026, 0.034, 0.024), 8, 6)
    kit.cone(rat.bm, c + Vector((0, -0.016, 0.026)), c + Vector((0, -0.055, 0.02)), 0.02, 0.004, 6)
    nose = kit.sphere(rat.bm, c + Vector((0, -0.056, 0.02)), (0.004, 0.004, 0.004), 4, 3)
    rat.paint(faces_of(nose), RAT_PINK)
    for sign in (1, -1):
        ear = kit.sphere(rat.bm, c + Vector((0.012 * sign, -0.02, 0.044)), (0.009, 0.003, 0.009), 6, 4)
        rat.paint(faces_of(ear), RAT_PINK)
        eye = kit.sphere(rat.bm, c + Vector((0.01 * sign, -0.038, 0.032)), (0.003, 0.003, 0.003), 4, 3)
        rat.paint(faces_of(eye), PUPIL)
    tail = kit.tube(rat.bm, [c + Vector((0, 0.04, 0.01)), c + Vector((0.01, 0.07, -0.03)), c + Vector((0.0, 0.08, -0.08))], [0.004, 0.003, 0.0015], 4)
    rat.paint(faces_of(tail), RAT_PINK)
    bell = kit.sphere(rat.bm, c + Vector((0, -0.03, 0.006)), (0.007, 0.007, 0.008), 6, 4)
    rat.paint(faces_of(bell), BRASS)
    return [rat]


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", SHIRT, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.024, 0.02, 8)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.018, 0.015, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.04)
        verts = kit.cone(bracer.bm, e + (w - e) * 0.35, w - d * 0.004, 0.022, 0.02, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.015 for f in v.link_faces}, BRASS)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.018, (0.018, 0.016, 0.022), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.042, 0.033, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", TROUSERS, f"shin.{side}")
        verts = kit.cone(shin.bm, knee, knee - Vector((0, 0, 0.05)), 0.034, 0.032, 8)
        # A patch on the knee.
        shin.paint({f for f in faces_of(verts) if f.calc_center_median().y < -0.02}, PATCH)
        knee_cap = kit.sphere(shin.bm, knee + Vector((0, -0.01, 0)), (0.034, 0.032, 0.03), 8, 6)
        shin.paint({f for f in faces_of(knee_cap) if f.calc_center_median().y < -0.02}, PATCH)
        parts.append(shin)

        boot = Part(f"boot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.1)), ankle - Vector((0, 0, 0.02)), 0.036, 0.034, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.03, 0.02), (0.056, 0.11, 0.04))
        cuff = kit.torus(boot.bm, ankle + Vector((0, 0, 0.1)), (0, 0, 1), 0.037, 0.007, 10, 4)
        boot.paint(faces_of(cuff), LEATHER)
        for z in (0.05, 0.085):
            strap = kit.torus(boot.bm, ankle + Vector((0, 0, z - 0.04)), (0, 0, 1), 0.036, 0.004, 10, 3)
            boot.paint(faces_of(strap), BRASS)
        parts.append(boot)
    return parts


def rifle_parts():
    rifle = Part("rifle", WOOD, "rifle", shade=0.03)
    side = RIFLE.cross(Z).normalized()
    up = side.cross(RIFLE).normalized()
    butt = GRIP_R - RIFLE * 0.12
    # The stock, the grip and the long fore-end.
    kit.cone(rifle.bm, butt - up * 0.012, GRIP_R - up * 0.004, 0.026, 0.014, 6, squash=0.6)
    kit.cone(rifle.bm, GRIP_R, GRIP_R + RIFLE * 0.24, 0.014, 0.012, 6)
    barrel = kit.cone(rifle.bm, GRIP_R + up * 0.01, GRIP_R + up * 0.01 + RIFLE * MUZZLE, 0.008, 0.008, 6)
    rifle.paint(faces_of(barrel), IRON)
    # Brass bands and the brass scope on top.
    for along in (0.1, 0.2, 0.3):
        band = kit.cone(rifle.bm, GRIP_R + RIFLE * along, GRIP_R + RIFLE * (along + 0.012), 0.016, 0.016, 6)
        rifle.paint(faces_of(band), BRASS)
    scope = kit.cone(rifle.bm, GRIP_R + up * 0.035 + RIFLE * 0.02, GRIP_R + up * 0.035 + RIFLE * 0.17, 0.011, 0.014, 8)
    rifle.paint(faces_of(scope), BRASS)
    lens = kit.cone(rifle.bm, GRIP_R + up * 0.035 + RIFLE * 0.17, GRIP_R + up * 0.035 + RIFLE * 0.174, 0.012, 0.012, 8)
    rifle.paint(faces_of(lens), LENS)
    for along in (0.05, 0.14):
        mount = kit.cone(rifle.bm, GRIP_R + up * 0.012 + RIFLE * along, GRIP_R + up * 0.03 + RIFLE * along, 0.004, 0.004, 4)
        rifle.paint(faces_of(mount), BRASS)
    trigger = kit.torus(rifle.bm, GRIP_R - up * 0.016 + RIFLE * 0.02, side, 0.012, 0.0025, 8, 3)
    rifle.paint(faces_of(trigger), IRON)
    parts = [rifle]

    flash = Part("flash", FLASH, "flash", shade=0)
    tip = GRIP_R + up * 0.01 + RIFLE * MUZZLE
    kit.cone(flash.bm, tip, tip + RIFLE * 0.08, 0.025, 0.002, 6)
    for angle in (0, 120, 240):
        a = math.radians(angle)
        out = (side * math.cos(a) + up * math.sin(a)) * 0.035
        spike = kit.cone(flash.bm, tip, tip + RIFLE * 0.03 + out, 0.01, 0.001, 4)
        flash.paint(faces_of(spike), FLASH_HOT)
    parts.append(flash)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("GrixRatwhistle", BONES)
    parts = head_parts() + body_parts() + rat_parts() + limb_parts() + rifle_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "GrixRatwhistleMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the rifle, the right hand to aim. The rifle aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "rifle_aim": kit.add_empty("rifle_aim"),
    }
    bones = rig.pose.bones
    for side, target, subtarget in (("L", rig, "grip.L"), ("R", empties["ik_hand.R"], "")):
        ik = bones[f"forearm.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = target
        if subtarget:
            ik.subtarget = subtarget
        ik.pole_target = rig
        ik.pole_subtarget = f"pole.{side}"
        ik.pole_angle = math.radians(POLE_ANGLE)
        ik.chain_count = 2
    aim = bones["rifle"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["rifle_aim"]
    return empties


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def pose(base, **changes):
        result = dict(base)
        for key, value in changes.items():
            result[key.replace("__", ".").replace("_at_", "@").replace("_slash_", "/")] = value
        return result

    rifle_rest = rig.data.bones["rifle"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the rifle that points it along `direction`."""
        return RIFLE.rotation_difference(Vector(direction).normalized()) @ rifle_rest

    def stand(breath=0.0, sway=0.0, rat=0.0):
        """
        The idle stance: low on bent knees and turned a little to his right,
        the rifle across the body. The rat looks about.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -14)),
            "spine": t("spine", (Z, -4), (X, 8 + breath)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (Z, 10)),
            "head": t("head", (Z, 8 + sway * 5), (X, -4 + breath * 2), (Y, -6)),
            "upperarm.R": t("upperarm.R", (X, -breath * 3)),
            "thigh.L": t("thigh.L", (X, -22), (Y, -6)),
            "shin.L": t("shin.L", (X, 32)),
            "foot.L": t("foot.L", (X, -10)),
            "thigh.R": t("thigh.R", (X, 2), (Y, 6)),
            "shin.R": t("shin.R", (X, 24)),
            "foot.R": t("foot.R", (X, -26)),
            "cape": t("cape", (X, -4 - breath * 2), (Y, sway * 3)),
            "rat": t("rat", (Z, rat * 30), (X, -abs(rat) * 10)),
            "forearm.L/IK": 1.0,
            "flash@scale": 0.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, leaning on the rifle."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.12 - breath * 0.004)),
            spine=t("spine", (Z, -4), (X, 20 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2)),
            head=t("head", (Z, 6), (X, 14 + breath * 4), (Y, -10)),
            upperarm__R=t("upperarm.R", (X, -30)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, 30)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 70)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 10), (Y, 6)),
            shin__R=t("shin.R", (X, 90)),
            foot__R=t("foot.R", (X, -40)),
            cape=t("cape", (X, 20)),
            rat=t("rat", (X, 20)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -4), (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            upperarm__R=t("upperarm.R", (X, 14 * amount), (Y, 10 * amount)),
            cape=t("cape", (X, 14 * amount)),
            rat=t("rat", (X, -30 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.04)),
            spine=t("spine", (X, 22)),
            head=t("head", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 44)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, 16)),
            cape=t("cape", (X, -20)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the rifle across the chest."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.045)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, -10), (Z, 30)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, 10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            cape=t("cape", (X, -60)),
            rat=t("rat", (Z, 60), (Y, 20)),
        )

    def crouch(base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.1)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 16)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -50), (Y, 6)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            cape=t("cape", (X, 30)),
        )

    def proud(base):
        """Up again, the rifle raised high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -120), (Y, 20)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 6)),
            thigh__R=t("thigh.R", (X, 4), (Y, 6)),
            shin__R=t("shin.R", (X, 6)),
            foot__R=t("foot.R", (X, -10)),
            rat=t("rat", (X, -20)),
        )

    def step(front):
        """A quick, sneaking step. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.022)),
            spine=t("spine", (Z, -4), (X, 14)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 20)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 26)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "upperarm__R": t("upperarm.R", (X, -6 * front)),
                "cape": t("cape", (X, 12), (Y, 4 * front)),
                "rat": t("rat", (Y, 6 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.006)),
            spine=t("spine", (Z, -4), (X, 14)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -24)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, -2)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 14)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                "cape": t("cape", (X, 8)),
            },
        )

    # The attack: he shoulders the rifle, aims along it and fires. The shot
    # leaves at 20% of the attack (`FLIGHT_START` in fx.ts), so the muzzle
    # flash is at frame 6 of 30, and the rifle kicks up after it.
    def aiming(base, kick=0.0, flash=0.0):
        hand = Vector((-0.05, -0.1 + kick * 0.025, 0.5 + kick * 0.01))
        return pose(
            base,
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -12), (X, 10)),
            chest=t("chest", (Z, -10), (X, -kick * 6)),
            neck=t("neck", (Z, 16)),
            head=t("head", (Z, 22), (X, 8 - kick * 8), (Y, -14)),
            thigh__L=t("thigh.L", (X, -30), (Y, -6)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, -6)),
            thigh__R=t("thigh.R", (X, 12), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -40)),
            rat=t("rat", (X, 20), (Z, -40)),
            **{
                "forearm__R_slash_IK": 1.0,
                "rifle_slash_Aim": 1.0,
                "ik_hand__R_at_pos": hand,
                "rifle_aim_at_rot": aimed((0, -1, 0.04 + kick * 0.35)),
                "flash_at_scale": flash,
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, rat in ((0, 0, 0, 0), (12, 0.5, 1, 0.6), (24, 1, 0, 0.6), (36, 0.5, -1, -0.5), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, rat))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, aiming(stand())).key(5, aiming(stand()))
    attack.key(6, aiming(stand(), 0.2, 1.3)).key(8, aiming(stand(), 1.0, 0.6)).key(10, aiming(stand(), 0.6, 0.0))
    attack.key(16, aiming(stand())).key(24, stand()).key(30, stand())
    clips.append(attack)

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
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.01, -0.08))))
    summon.key(17, proud(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    empties = add_controls(rig)
    baked = [kit.bake_clip(rig, empties, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, empties)
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "grix-ratwhistle.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
