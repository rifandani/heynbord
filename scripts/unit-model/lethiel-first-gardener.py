"""
Lethiel, First Gardener (`elf.lethielFirstGardener`), a Unit Model (art
direction 2.2).

A tabletop miniature of the card painting: an old elf with long white hair and
a long white beard under a crown of leaves and twigs, a cream robe to the
ground, a long green mantle with a collar of leaves, a silver sickle at the
belt, and a tall twisted staff with a cage of branches round a glowing gold
orb. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/lethiel-first-gardener.glb`; then
`bun unit-model:pack lethiel-first-gardener` packs it for the game.

The Battle camera sees the right side of a player Unit, so the staff is in
his right hand. His attack (Mid Range) points the orb at the enemy, and he
uses Regenerate by his own action, so he has a cast clip: the staff goes up
and the left hand opens.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#e2b896")
HAIR = hex_color("#ece8de")
HAIR_DARK = hex_color("#c6bfae")
EYES = hex_color("#2a2a22")
ROBE = hex_color("#e6dcc3")
ROBE_DARK = hex_color("#bfb291")
MANTLE = hex_color("#5e7d3a")
MANTLE_DARK = hex_color("#41592a")
LEAF_LIGHT = hex_color("#9cb75f")
GOLD = hex_color("#d9b04a")
LEATHER = hex_color("#6a4426")
WOOD = hex_color("#6a4a2c")
WOOD_DARK = hex_color("#47301b")
ORB = hex_color("#ffd66e")
ORB_CORE = hex_color("#fff3c4")
SILVER = hex_color("#d3d6d8")
FLOWER = hex_color("#f4f0e2")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.875))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.05

# The left arm hangs in an A-pose; the right hand holds the staff in front.
ARM_DIR = Vector((math.sin(math.radians(16)), 0, -math.cos(math.radians(16))))
SL = Vector((0.1, 0, SHOULDER_Z))
EL = SL + ARM_DIR * 0.15
WL = EL + ARM_DIR * 0.14
TL = WL + ARM_DIR * 0.055
SR = Vector((-0.1, 0, SHOULDER_Z))
ER = Vector((-0.15, 0.02, 0.585))
WR = Vector((-0.2, -0.03, 0.56))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
GRIP_R = WR + DR * 0.03

# The staff stands upright through the right hand, from the ground to above the head.
STAFF_LOW = 0.02
STAFF_HIGH = 1.08
ORB_C = Vector((GRIP_R.x, GRIP_R.y, STAFF_HIGH + 0.045))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("mantle.B", (0, 0.08, 0.55), (0, 0.15, 0.1), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("staff", tuple(GRIP_R), tuple(GRIP_R + Vector((0, 0, 0.12))), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The robe and the mantle follow the hips at the top, and the legs and the mantle tail lower."""
    t = clamp01((0.53 - co.z) / 0.45)
    back = clamp01((co.y - 0.01) / 0.1)
    # At the middle of the front, each leg takes half.
    side = clamp01(0.5 + co.x / 0.12)
    return {
        "hips": 1 - t,
        "mantle.B": back * t,
        "thigh.L": (1 - back) * t * side * 0.9,
        "thigh.R": (1 - back) * t * (1 - side) * 0.9,
    }


def mantle_weights(co):
    """The mantle hangs from the shoulders: the chest at the top, then the robe weights."""
    if co.z > 0.56:
        return blend("spine", "chest", co.z, 0.58, 0.66)
    return skirt_weights(co)


# --- Parts ---------------------------------------------------------------------


def leaf(part, base, direction, length, width, color):
    """A flat leaf: a cone squashed thin."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.001, 4, squash=0.3)
    part.paint(faces_of(verts), color)
    return verts


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.063, 0.068, 0.08), 14, 10)
    kit.cone(head.bm, (0, -0.064, 0.872), (0, -0.084, 0.856), 0.013, 0.003, 5)
    for sign in (1, -1):
        # Long elf ears that go out and back.
        kit.cone(head.bm, (0.056 * sign, 0.004, 0.872), (0.13 * sign, 0.04, 0.915), 0.017, 0.001, 5, squash=0.45)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.025 * sign, -0.06, 0.88), (0.01, 0.007, 0.008), 8, 5)
    # The heavy white brows.
    brows = Part("brows", HAIR, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(brows.bm, (0.012 * sign, -0.064, 0.898), (0.045 * sign, -0.058, 0.902), 0.008, 0.003, 5)
    parts += [eyes, brows]

    hair = Part("hair", HAIR, "head", shade=0.14)
    verts = kit.sphere(hair.bm, (0, 0.008, 0.888), (0.07, 0.077, 0.087), 14, 10)
    cut = [v for v in verts if v.co.z < 0.83 or (v.co.y < -0.03 and v.co.z < 0.91)]
    kit.bmesh.ops.delete(hair.bm, geom=cut, context="VERTS")
    # Long hair down the back and over the shoulders.
    kit.tube(hair.bm, [(0, 0.05, 0.9), (0, 0.08, 0.8), (0, 0.09, 0.68), (0, 0.092, 0.6)], [0.06, 0.065, 0.055, 0.02], 8)
    for sign in (1, -1):
        lock = kit.cone(hair.bm, (0.058 * sign, -0.01, 0.89), (0.075 * sign, -0.02, 0.68), 0.022, 0.006, 6, squash=0.7)
        hair.paint(faces_of(lock), HAIR_DARK)
    parts.append(hair)

    # The long beard to the middle of the chest, and the moustache.
    beard = Part("beard", HAIR, "head", shade=0.14)
    kit.sphere(beard.bm, (0, -0.042, 0.825), (0.055, 0.045, 0.045), 10, 7)
    kit.cone(beard.bm, (0, -0.055, 0.81), (0, -0.09, 0.6), 0.05, 0.008, 8, squash=0.6)
    for sign in (1, -1):
        strand = kit.cone(beard.bm, (0.026 * sign, -0.065, 0.8), (0.016 * sign, -0.095, 0.64), 0.018, 0.005, 6, squash=0.6)
        beard.paint(faces_of(strand), HAIR_DARK)
    kit.cone(beard.bm, (0.045, -0.066, 0.845), (-0.045, -0.066, 0.845), 0.01, 0.01, 6, squash=0.7)
    parts.append(beard)

    # The crown: a ring of leaves, with twigs that branch up like small antlers.
    crown = Part("crown", MANTLE, "head", shade=0.05)
    kit.torus(crown.bm, (0, 0.004, 0.92), (0, 0.3, 1), 0.077, 0.006, 18, 4)
    for index in range(10):
        angle = math.radians(-90 + index * 20)
        base = Vector((0.077 * math.sin(angle), -0.077 * math.cos(angle) + 0.004, 0.925))
        out = Vector((math.sin(angle) * 0.7, -math.cos(angle) * 0.5, 0.9))
        leaf(crown, base, out, 0.045, 0.016, LEAF_LIGHT if index % 2 else MANTLE)
    for sign in (1, -1):
        twig = kit.tube(crown.bm, [(0.05 * sign, 0.02, 0.94), (0.08 * sign, 0.03, 1.0), (0.1 * sign, 0.05, 1.05)], [0.007, 0.005, 0.002], 4)
        crown.paint(faces_of(twig), WOOD)
        fork = kit.tube(crown.bm, [(0.08 * sign, 0.03, 1.0), (0.06 * sign, 0.0, 1.04)], [0.004, 0.002], 4)
        crown.paint(faces_of(fork), WOOD)
    parts.append(crown)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.026, 0.024, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    bodice = Part("bodice", ROBE, torso_weights)
    kit.cone(bodice.bm, (0, 0, 0.5), (0, 0, 0.74), 0.066, 0.082, 12, squash=0.74)
    parts.append(bodice)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.515), (0, 0, 0.545), 0.071, 0.069, 12, squash=0.78)
    buckle = kit.box(belt.bm, (0, -0.056, 0.53), (0.022, 0.008, 0.022))
    belt.paint(faces_of(buckle), GOLD)
    # A pouch on the left hip.
    kit.box(belt.bm, (0.06, -0.035, 0.49), (0.035, 0.025, 0.045))
    parts.append(belt)

    # The silver sickle hangs from the belt at the right hip.
    sickle = Part("sickle", SILVER, "hips", shade=0.05)
    grip = kit.cone(sickle.bm, (-0.05, -0.06, 0.52), (-0.05, -0.065, 0.44), 0.008, 0.008, 5)
    sickle.paint(faces_of(grip), WOOD_DARK)
    blade = []
    for index in range(8):
        a = math.radians(-60 + index * 30)
        blade.append((-0.05 + 0.045 * math.sin(a) * 0.5 - 0.01, -0.07, 0.44 - 0.045 + 0.045 * math.cos(a)))
    kit.tube(sickle.bm, blade, [lerp(0.009, 0.002, i / 7) for i in range(8)], 4)
    parts.append(sickle)

    def robe_color(row, column):
        return ROBE_DARK if column % 4 == 0 else ROBE

    robe = Part("robe", ROBE, skirt_weights)
    kit.ragged_cone(robe, 0.54, 0.02, 0.07, 0.15, 16, 6, 0.85, 0.02, robe_color, ROBE_DARK)
    parts.append(robe)

    def mantle_color(row, column):
        if row >= 6 and column % 3 == 1:
            return LEAF_LIGHT
        if column in (0, 15):
            return GOLD
        return MANTLE_DARK if column % 4 == 2 else MANTLE

    # The long mantle: open at the front, ragged like leaves at the hem.
    mantle = Part("mantle", MANTLE, mantle_weights)
    kit.ragged_cone(mantle, 0.73, 0.04, 0.085, 0.19, 16, 7, 0.82, 0.1, mantle_color, ROBE_DARK, gap=math.radians(40), y_push=0.06)
    parts.append(mantle)

    # Two rings of leaves make the collar of the mantle.
    collar = Part("collar", MANTLE, "chest", shade=0.08)
    for ring, (z, reach, count) in enumerate(((0.74, 0.09, 14), (0.69, 0.1, 12))):
        for index in range(count):
            angle = 2 * math.pi * (index + 0.5 * ring) / count
            if abs(math.sin(angle)) < 0.35 and math.cos(angle) > 0:
                # The front stays open over the beard.
                continue
            out = Vector((math.sin(angle), -math.cos(angle) * 0.82, 0))
            base = Vector((0, 0, z)) + out * 0.088
            leaf(collar, base, out + Vector((0, 0, -0.7)), reach, 0.04, (MANTLE, LEAF_LIGHT, MANTLE_DARK)[(index + ring) % 3])
    # Small white flowers on the collar.
    for x, y, z in ((0.07, -0.05, 0.73), (-0.075, -0.04, 0.71), (0.04, 0.07, 0.74)):
        flower = kit.sphere(collar.bm, (x, y, z), (0.012, 0.012, 0.008), 6, 4)
        collar.paint(faces_of(flower), FLOWER)
    parts.append(collar)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
        d = (w - e).normalized()
        upper = Part(f"sleeve.{side}", ROBE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.03, 0.03, 8)
        parts.append(upper)

        # A wide sleeve that opens toward the wrist.
        sleeve = Part(f"cuff.{side}", ROBE, f"forearm.{side}")
        verts = kit.cone(sleeve.bm, e, w - d * 0.005, 0.03, 0.042, 8)
        sleeve.paint({f for v in verts if (v.co - w).length < 0.03 for f in v.link_faces}, GOLD)
        parts.append(sleeve)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.025, (0.018, 0.016, 0.025), 8, 6)
        parts.append(hand)

        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        shin = Part(f"shin.{side}", ROBE_DARK, f"shin.{side}")
        kit.cone(shin.bm, knee, ankle, 0.03, 0.028, 8)
        parts.append(shin)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.035, 0.025), (0.052, 0.11, 0.05))
        parts.append(foot)
    return parts


def staff_parts():
    parts = []
    staff = Part("staff", WOOD, "staff", shade=0.06)
    # A twisted shaft: a main tube with a thin vine that winds round it.
    x, y = GRIP_R.x, GRIP_R.y
    kit.cone(staff.bm, (x, y, STAFF_LOW), (x, y, STAFF_HIGH), 0.013, 0.016, 7)
    wind = []
    for step in range(41):
        s = step / 40
        a = s * 9 * 2 * math.pi
        wind.append((x + 0.017 * math.cos(a), y + 0.017 * math.sin(a), lerp(STAFF_LOW + 0.1, STAFF_HIGH, s)))
    verts = kit.tube(staff.bm, wind, [0.006] * len(wind), 4)
    staff.paint(faces_of(verts), WOOD_DARK)
    # The cage of branches round the orb.
    for index in range(5):
        a = 2 * math.pi * index / 5
        out = Vector((math.cos(a), math.sin(a), 0))
        path = [
            Vector((x, y, STAFF_HIGH - 0.02)),
            ORB_C + out * 0.05 + Vector((0, 0, -0.03)),
            ORB_C + out * 0.055 + Vector((0, 0, 0.02)),
            ORB_C + out * 0.02 + Vector((0, 0, 0.07)),
        ]
        verts = kit.tube(staff.bm, path, [0.007, 0.006, 0.005, 0.002], 4)
        staff.paint(faces_of(verts), WOOD_DARK if index % 2 else WOOD)
    for index, z in enumerate((0.85, 0.65)):
        leaf(staff, (x - 0.015, y, z), (-1, -0.3, 0.6), 0.05, 0.02, LEAF_LIGHT if index else MANTLE)
    parts.append(staff)

    orb = Part("orb", ORB, "staff", shade=0)
    kit.sphere(orb.bm, ORB_C, (0.04, 0.04, 0.04), 10, 7)
    parts.append(orb)
    glow = Part("orb.core", ORB_CORE, "staff", shade=0)
    kit.sphere(glow.bm, ORB_C + Vector((-0.02, -0.02, 0.012)), (0.016, 0.016, 0.016), 6, 4)
    parts.append(glow)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("LethielFirstGardener", BONES)
    parts = head_parts() + body_parts() + limb_parts() + staff_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "LethielFirstGardenerMesh")
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
        The idle stance: a little stooped, the left hand open, the staff in the
        right hand with its top forward, so the camera sees his face past it.
        """
        return {
            "spine": t("spine", (X, 5 + breath * 0.5)),
            "chest": t("chest", (X, 3 - breath * 2)),
            "neck": t("neck", (X, -2)),
            "head": t("head", (X, -4 + breath), (Z, sway * 4)),
            "upperarm.L": t("upperarm.L", (Y, 4 + breath), (X, -6)),
            "forearm.L": t("forearm.L", (X, -24)),
            "hand.L": t("hand.L", (X, 10)),
            "upperarm.R": t("upperarm.R", (X, -breath * 2)),
            "staff": t("staff", (X, 16), (Y, -3)),
            "mantle.B": t("mantle.B", (X, -2 - breath * 2), (Y, sway * 2)),
            "thigh.L": t("thigh.L", (Y, -2)),
            "thigh.R": t("thigh.R", (Y, 2)),
        }

    def lean(breath=0.0):
        """Low HP: bent over the staff, the left hand on the knee."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            spine=t("spine", (X, 16 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            neck=t("neck", (X, 4)),
            head=t("head", (X, 6 + breath * 4), (Y, -6)),
            upperarm__R=t("upperarm.R", (X, -20)),
            forearm__R=t("forearm.R", (X, 10)),
            staff=t("staff", (X, 20), (Y, -4)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 4)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__L=t("thigh.L", (X, -18), (Y, -2)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -8), (Y, 2)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -12)),
            mantle__B=t("mantle.B", (X, 6)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -8 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, -8 * amount)),
            head=t("head", (X, -14 * amount), (Z, -8 * amount)),
            upperarm__L=t("upperarm.L", (Y, -20 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, 10 * amount), (X, 6 * amount)),
            staff=t("staff", (X, 10 * amount)),
            mantle__B=t("mantle.B", (X, 12 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            thigh__L=t("thigh.L", (X, -18)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -12)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 20)),
            upperarm__L=t("upperarm.L", (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, 20), (X, 10)),
            staff=t("staff", (X, 20), (Y, 20)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the staff fallen beside him."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.105)),
            spine=t("spine", (X, -6)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (Y, -35), (X, 20)),
            upperarm__R=t("upperarm.R", (Y, 50), (X, 20)),
            forearm__R=t("forearm.R", (X, 20)),
            staff=t("staff", (X, 10), (Y, 40)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 8)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 30)),
            mantle__B=t("mantle.B", (X, -50)),
        )

    def kneel(base):
        """Down on one knee, both hands on the staff: the start of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.08)),
            spine=t("spine", (X, 20)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 18)),
            thigh__L=t("thigh.L", (X, -80)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 0)),
            shin__R=t("shin.R", (X, 90)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__R=t("upperarm.R", (X, -24)),
            staff=t("staff", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -50), (Y, -24)),
            forearm__L=t("forearm.L", (X, -50)),
            mantle__B=t("mantle.B", (X, 30)),
        )

    def bless(base, lift=1.0):
        """The staff high and the left hand open over the ground: Regenerate, and the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.006 * lift)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -10 * lift)),
            head=t("head", (X, -16 * lift)),
            upperarm__R=t("upperarm.R", (X, -110 * lift), (Y, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            staff=t("staff", (X, 118 * lift)),
            upperarm__L=t("upperarm.L", (X, -60 * lift), (Y, -30 * lift)),
            forearm__L=t("forearm.L", (X, -10)),
            hand__L=t("hand.L", (X, -30 * lift)),
            mantle__B=t("mantle.B", (X, 10 * lift)),
        )

    def step(front):
        """A slow step with the staff. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.012)),
            spine=t("spine", (X, 8)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -22)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 12)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "upperarm__R": t("upperarm.R", (X, -12 * front)),
                "staff": t("staff", (X, 10 * front + 16), (Y, -3)),
                "upperarm__L": t("upperarm.L", (Y, 4), (X, 10 * front)),
                "mantle__B": t("mantle.B", (X, -12)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.006)),
            spine=t("spine", (X, 8)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 36)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "mantle__B": t("mantle.B", (X, -8)),
            },
        )

    # The attack (Mid Range): he points the orb of the staff at the enemy,
    # and the Holy light leaves it at 20% of the attack (`FLIGHT_START` in
    # fx.ts), so the orb is out at frame 6 of 30. The staff follows the hand,
    # so a raised arm tips it back, and its own turn must make up for that.
    def point(base, reach=1.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.012 * reach, -0.012 * reach)),
            hips=t("hips", (Z, 8 * reach)),
            spine=t("spine", (X, 8), (Z, 6 * reach)),
            chest=t("chest", (X, 2)),
            head=t("head", (Z, -12 * reach), (X, -6)),
            upperarm__R=t("upperarm.R", (X, -70 * reach), (Y, -4)),
            forearm__R=t("forearm.R", (X, -10 * reach)),
            staff=t("staff", (X, 150 * reach)),
            upperarm__L=t("upperarm.L", (X, 20 * reach), (Y, 10)),
            thigh__L=t("thigh.L", (X, -20 * reach)),
            shin__L=t("shin.L", (X, 10 * reach)),
            thigh__R=t("thigh.R", (X, 14 * reach)),
            shin__R=t("shin.R", (X, 8 * reach)),
            foot__R=t("foot.R", (X, -14 * reach)),
            mantle__B=t("mantle.B", (X, 14 * reach)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, lean(breath))
    clips.append(low)

    walk = Clip("walk", 28, loop=True)
    walk.key(0, step(1)).key(7, passing("R")).key(14, step(-1)).key(21, passing("L")).key(28, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(3, point(stand(), 0.4)).key(6, point(stand())).key(12, point(stand(), 0.95))
    attack.key(22, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 24)
    cast.key(0, stand()).key(6, bless(stand(), 0.8)).key(10, bless(stand())).key(16, bless(stand(), 0.9)).key(24, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, kneel(stand())).key(10, pose(kneel(stand()), hips_at_loc=at("hips", (0, 0.02, -0.06))))
    summon.key(17, bless(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "lethiel-first-gardener.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
