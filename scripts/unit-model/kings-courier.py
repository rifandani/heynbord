"""
King's Courier (`human.kingsCourier`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a lean woman courier with a long
brown ponytail, a blue riding coat with gold trim, gold clasps and a cream
lining, a leather strap across the chest, a blue scroll case with gold caps
and a red seal on her back, brown trousers, tall boots and a short spear in
the right hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/kings-courier.glb`; then
`bun unit-model:pack kings-courier` packs it for the game.

The spear is in the right hand, on the camera side. She has Fleet, so her
walk is a sprint: the coat tails and the ponytail stream back. Her attack is
the Charge: a lunge with the spear. She has no Keyword that she uses by her
own action, so she has no cast clip.
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

SKIN = hex_color("#e8b48e")
HAIR = hex_color("#5a3520")
HAIR_LIGHT = hex_color("#7d4c2c")
EYES = hex_color("#2a1d16")
COAT = hex_color("#2e4c98")
COAT_DARK = hex_color("#1f346c")
GOLD = hex_color("#dcaa42")
GOLD_DARK = hex_color("#9e7428")
CREAM = hex_color("#efe4c8")
SHIRT = hex_color("#f3ecdc")
LEATHER = hex_color("#6e4326")
TROUSERS = hex_color("#4b382c")
BOOT = hex_color("#5c3a22")
GLOVE = hex_color("#4a2e1c")
SEAL = hex_color("#b3302a")
STEEL = hex_color("#c9ccd0")
SHAFT = hex_color("#6b4a2a")

# --- Proportions ---------------------------------------------------------------

# A lean figure with long legs.
HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.872))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.05

# The arms hang in an A-pose, 22 degrees from the body.
ARM_DIR = Vector((math.sin(math.radians(22)), 0, -math.cos(math.radians(22))))


def arm_points(sign):
    shoulder = Vector((0.1 * sign, 0, SHOULDER_Z))
    direction = Vector((ARM_DIR.x * sign, 0, ARM_DIR.z))
    elbow = shoulder + direction * 0.15
    wrist = elbow + direction * 0.14
    tip = wrist + direction * 0.055
    return shoulder, elbow, wrist, tip, direction


SL, EL, WL, TL, DL = arm_points(1)
SR, ER, WR, TR, DR = arm_points(-1)
HAND_R = WR + DR * 0.026

# At rest the spear goes through the right fist, level and to the front. The
# clips turn it with the arm.
SPEAR = Vector((0, -1, 0))
SPEAR_BACK = 0.2
SPEAR_FRONT = 0.38

PONY_TOP = Vector((0, 0.07, 0.93))
PONY_MID = Vector((0, 0.115, 0.8))
PONY_END = Vector((0, 0.13, 0.62))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("pony1", tuple(PONY_TOP), tuple(PONY_MID), "head"),
    ("pony2", tuple(PONY_MID), tuple(PONY_END), "pony1"),
    ("tail1", (0, 0.07, 0.5), (0, 0.11, 0.33), "hips"),
    ("tail2", (0, 0.11, 0.33), (0, 0.15, 0.14), "tail1"),
]
for side, sign, (s, e, w, t, _) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
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
    ("spear", tuple(HAND_R), tuple(HAND_R + SPEAR * 0.1), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    t = clamp01((0.53 - co.z) / 0.41)
    back = clamp01((co.y - 0.02) / 0.1)
    side = co.x / 0.15
    upper = 1 - clamp01((t - 0.5) * 2)
    return {
        "hips": 1 - t,
        "tail1": back * t * upper,
        "tail2": back * t * (1 - upper),
        "thigh.L": (1 - back) * t * clamp01(side) * 0.8,
        "thigh.R": (1 - back) * t * clamp01(-side) * 0.8,
    }


def pony_weights(co):
    if co.z > PONY_MID.z:
        return blend("pony1", "head", co.z, PONY_TOP.z - 0.06, PONY_TOP.z + 0.01)
    return blend("pony2", "pony1", co.z, PONY_MID.z - 0.06, PONY_MID.z)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.064, 0.068, 0.08), 14, 10)
    kit.cone(head.bm, (0, -0.064, 0.868), (0, -0.08, 0.86), 0.011, 0.002, 5)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.062 * sign, 0.004, 0.868), (0.012, 0.016, 0.02), 6, 4)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.025 * sign, -0.058, 0.88), (0.01, 0.008, 0.012), 8, 6)
    parts.append(eyes)

    # Loose brown hair, pulled back to a ponytail, with a lock at each cheek.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.008, 0.884), (0.071, 0.077, 0.086), 14, 10)
    face = [v for v in verts if v.co.z < 0.83 or (v.co.y < -0.03 and v.co.z < 0.9)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    for sign in (1, -1):
        lock = kit.cone(hair.bm, (0.052 * sign, -0.034, 0.912), (0.066 * sign, -0.03, 0.79), 0.018, 0.006, 6, squash=0.7)
        hair.paint(faces_of(lock), HAIR_LIGHT)
    # Hair over the nape.
    kit.cone(hair.bm, (0, 0.05, 0.86), (0, 0.06, 0.78), 0.05, 0.03, 8, squash=0.6)
    tie = kit.torus(hair.bm, PONY_TOP + Vector((0, 0.008, -0.01)), (0, 0.6, 1), 0.02, 0.006, 10, 4)
    hair.paint(faces_of(tie), GOLD)
    parts.append(hair)

    # A thick ponytail that tapers to a point, with light strands.
    pony = Part("pony", HAIR, pony_weights)
    path = [
        PONY_TOP,
        (PONY_TOP + PONY_MID) / 2 + Vector((0, 0.014, 0)),
        PONY_MID,
        (PONY_MID + PONY_END) / 2 + Vector((0, 0.01, 0)),
        PONY_END,
        PONY_END + Vector((0, 0.008, -0.05)),
    ]
    kit.tube(pony.bm, path, [0.026, 0.03, 0.026, 0.02, 0.012, 0.002], 8)
    kit.sphere(pony.bm, PONY_TOP, (0.03, 0.028, 0.03), 8, 6)
    for face in pony.bm.faces:
        c = face.calc_center_median()
        if abs(c.x) > 0.012 and int(c.z * 50) % 2:
            pony.paint([face], HAIR_LIGHT)
    parts.append(pony)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.025, 0.023, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    coat = Part("coat", COAT, torso_weights)
    kit.cone(coat.bm, (0, 0, 0.53), (0, 0, 0.735), 0.064, 0.084, 12, squash=0.74)
    parts.append(coat)

    # The white shirt at the open front of the coat, with cream lapels.
    shirt = Part("shirt", SHIRT, "chest", shade=0.08)
    kit.box(shirt.bm, (0, -0.058, 0.69), (0.05, 0.012, 0.08))
    for sign in (1, -1):
        lapel = kit.slab(shirt.bm, (0.03 * sign, -0.062, 0.7), (0.016, 0, 0.012 * sign), (0, 0.006, 0), (-0.008 * sign, 0, 0.042))
        shirt.paint(faces_of(lapel), CREAM)
    parts.append(shirt)

    collar = Part("collar", COAT_DARK, "chest")
    verts = kit.cone(collar.bm, (0, 0.008, 0.73), (0, 0.012, 0.785), 0.062, 0.058, 12, caps=False, squash=0.85)
    collar.paint({f for v in verts if v.co.z > 0.778 for f in v.link_faces}, GOLD)
    parts.append(collar)

    # Three ornate gold clasps down the front, and the gold edges of the coat.
    clasps = Part("clasps", GOLD, torso_weights, shade=0.04)
    for z in (0.6, 0.645):
        for sign in (1, -1):
            kit.sphere(clasps.bm, (0.03 * sign, -0.062, z), (0.012, 0.007, 0.012), 6, 4)
        bar = kit.box(clasps.bm, (0, -0.064, z), (0.05, 0.005, 0.006))
        clasps.paint(faces_of(bar), GOLD_DARK)
    for sign in (1, -1):
        kit.box(clasps.bm, (0.045 * sign, -0.058, 0.6), (0.008, 0.008, 0.13))
    parts.append(clasps)

    # The leather strap of the scroll case, from the right shoulder to the left hip.
    strap = Part("strap", LEATHER, torso_weights, shade=0.05)
    kit.tube(strap.bm, [(-0.07, -0.05, 0.72), (-0.02, -0.068, 0.64), (0.04, -0.066, 0.56), (0.075, -0.03, 0.5)], [0.008] * 4, 4)
    buckle = kit.box(strap.bm, (-0.022, -0.072, 0.636), (0.016, 0.006, 0.016))
    strap.paint(faces_of(buckle), GOLD)
    kit.tube(strap.bm, [(-0.075, 0.03, 0.72), (-0.04, 0.07, 0.64), (0.02, 0.075, 0.56), (0.075, 0.035, 0.5)], [0.007] * 4, 4)
    parts.append(strap)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.515), 0.07, 0.069, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.057, 0.502), (0.026, 0.008, 0.022))
    belt.paint(faces_of(buckle), GOLD)
    # A belt pouch on the camera side.
    pouch = kit.box(belt.bm, (-0.066, -0.02, 0.47), (0.024, 0.03, 0.04))
    belt.paint(faces_of(pouch), BOOT)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.42), (0, 0, 0.5), 0.068, 0.066, 12, squash=0.8)
    parts.append(hips)

    parts.append(skirt())

    # The scroll case across the small of the back, with gold caps and a red seal.
    scroll = Part("scroll", COAT, "hips", shade=0.06)
    a, b = Vector((0.07, 0.085, 0.47)), Vector((-0.12, 0.1, 0.58))
    d = (b - a).normalized()
    kit.cone(scroll.bm, a, b, 0.026, 0.026, 10)
    for end, out in ((a, -d), (b, d)):
        cap = kit.cone(scroll.bm, end - out * 0.02, end + out * 0.012, 0.03, 0.028, 10)
        scroll.paint(faces_of(cap), GOLD)
    band = kit.cone(scroll.bm, (a + b) / 2 - d * 0.008, (a + b) / 2 + d * 0.008, 0.029, 0.029, 10)
    scroll.paint(faces_of(band), GOLD)
    seal = kit.sphere(scroll.bm, b + d * 0.014 + Vector((0, 0, -0.02)), (0.016, 0.012, 0.016), 6, 4)
    scroll.paint(faces_of(seal), SEAL)
    ribbon = kit.cone(scroll.bm, b + d * 0.014 + Vector((0, 0, -0.03)), b + d * 0.02 + Vector((0, 0.01, -0.08)), 0.008, 0.003, 4, squash=0.4)
    scroll.paint(faces_of(ribbon), SEAL)
    parts.append(scroll)
    return parts


def skirt():
    """The coat below the waist: open at the front, long tails at the back."""
    part = Part("skirt", COAT, skirt_weights)
    columns, rows = 16, 6
    gap = math.radians(34)

    def grid(inset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                theta = lerp(gap, 2 * math.pi - gap, column / columns)
                front = (1 + math.cos(theta)) / 2
                back = 1 - front
                hem = 0.11 + 0.21 * front**1.2
                z = lerp(0.53, hem, v)
                radius = lerp(0.07, 0.14 + 0.04 * back, v**0.85) - inset
                y_push = 0.05 * v * back
                line.append(
                    (radius * math.sin(theta), -radius * math.cos(theta) * 0.82 + y_push, z)
                )
            result.append(line)
        return result

    _, outer = kit.sheet(part.bm, grid(0.0))
    _, inner = kit.sheet(part.bm, grid(0.006))
    for face, row, column in outer:
        if row == rows - 1 or column in (0, columns - 1):
            part.paint([face], GOLD)
        elif row == rows - 2 and column % 2:
            part.paint([face], COAT_DARK)
    for face, row, column in inner:
        part.paint([face], CREAM)
    return part


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t, d) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
        epaulet = Part(f"epaulet.{side}", COAT_DARK, f"upperarm.{side}")
        verts = kit.sphere(epaulet.bm, s + Vector((0.004 * sign, 0, 0.006)), (0.036, 0.034, 0.028), 10, 7)
        epaulet.paint({f for v in verts if v.co.z < s.z - 0.006 for f in v.link_faces}, GOLD)
        parts.append(epaulet)

        sleeve = Part(f"sleeve.{side}", COAT, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.027, 0.023, 8)
        parts.append(sleeve)

        # A wide cream cuff with a gold edge.
        cuff = Part(f"cuff.{side}", COAT, f"forearm.{side}")
        kit.cone(cuff.bm, e - d * 0.01, w - d * 0.03, 0.023, 0.022, 8)
        verts = kit.cone(cuff.bm, w - d * 0.05, w + d * 0.004, 0.03, 0.033, 8)
        cuff.paint(faces_of(verts), CREAM)
        rim = kit.torus(cuff.bm, w + d * 0.004, d, 0.031, 0.004, 10, 3)
        cuff.paint(faces_of(rim), GOLD)
        parts.append(cuff)

        glove = Part(f"glove.{side}", GLOVE, f"hand.{side}")
        kit.sphere(glove.bm, w + d * 0.026, (0.018, 0.016, 0.024), 8, 6)
        parts.append(glove)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.04, 0.031, 8)
        parts.append(thigh)

        # Tall riding boots with a wide turned-down top and a gold buckle.
        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        kit.cone(boot.bm, knee - Vector((0, 0, 0.02)), ankle, 0.034, 0.03, 8)
        top = kit.cone(boot.bm, knee + Vector((0, 0, 0.012)), knee - Vector((0, 0, 0.04)), 0.043, 0.037, 8)
        boot.paint(faces_of(top), LEATHER)
        buckle = kit.box(boot.bm, knee + Vector((-0.03 * sign, -0.02, -0.12)), (0.012, 0.03, 0.016))
        boot.paint(faces_of(buckle), GOLD)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.028, 0.024), (0.052, 0.108, 0.048))
        heel = kit.box(foot.bm, (LEG_X * sign, 0.012, 0.012), (0.05, 0.03, 0.024))
        foot.paint(faces_of(heel), LEATHER)
        parts.append(foot)
    return parts


def spear_parts():
    spear = Part("spear", SHAFT, "spear", shade=0.04)
    butt = HAND_R - SPEAR * SPEAR_BACK
    tip = HAND_R + SPEAR * SPEAR_FRONT
    kit.cone(spear.bm, butt, tip, 0.009, 0.009, 6)
    for along in (-0.15, 0.3):
        band = kit.cone(spear.bm, HAND_R + SPEAR * along, HAND_R + SPEAR * (along + 0.02), 0.012, 0.012, 6)
        spear.paint(faces_of(band), GOLD)
    cap = kit.sphere(spear.bm, butt, (0.012, 0.012, 0.012), 6, 4)
    spear.paint(faces_of(cap), GOLD)
    # A leaf blade with a gold collar and a small blue pennon.
    collar = kit.cone(spear.bm, tip - SPEAR * 0.01, tip + SPEAR * 0.02, 0.014, 0.012, 6)
    spear.paint(faces_of(collar), GOLD)
    blade = kit.cone(spear.bm, tip + SPEAR * 0.02, tip + SPEAR * 0.12, 0.024, 0.001, 4, squash=0.3)
    spear.paint(faces_of(blade), STEEL)
    for side in (1, -1):
        wing = kit.cone(spear.bm, tip + SPEAR * 0.03, tip + SPEAR * 0.0 + Z * (0.024 * side), 0.008, 0.001, 4)
        spear.paint(faces_of(wing), GOLD)
    pennon = kit.slab(spear.bm, tip - SPEAR * 0.035 + Z * 0.025, SPEAR * 0.028, X * 0.003, Z * 0.02)
    spear.paint(faces_of(pennon), COAT)
    return [spear]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("KingsCourier", BONES)
    parts = head_parts() + body_parts() + limb_parts() + spear_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "KingsCourierMesh")
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

    def stand(breath=0.0, bounce=0.0):
        """
        Ready to run: on the balls of the feet, a little forward, the spear
        low in front. She bounces, impatient.
        """
        return {
            "hips@loc": at("hips", (0, -0.006, -0.018 + bounce * 0.008)),
            "hips": t("hips", (Z, -10)),
            "spine": t("spine", (X, 8 + breath)),
            "chest": t("chest", (X, -2 - breath * 2), (Z, 4)),
            "neck": t("neck", (X, -2)),
            "head": t("head", (X, -4 + breath), (Z, 6)),
            "upperarm.L": t("upperarm.L", (X, -10 - breath * 2), (Y, -6)),
            "forearm.L": t("forearm.L", (X, -58)),
            "hand.L": t("hand.L", (X, -10)),
            "upperarm.R": t("upperarm.R", (X, -4 - breath * 2), (Y, 4)),
            "forearm.R": t("forearm.R", (X, -40)),
            "hand.R": t("hand.R", (X, 12)),
            "thigh.L": t("thigh.L", (X, -20), (Y, -3)),
            "shin.L": t("shin.L", (X, 26)),
            "foot.L": t("foot.L", (X, -6)),
            "thigh.R": t("thigh.R", (X, 10), (Y, 3)),
            "shin.R": t("shin.R", (X, 16)),
            "foot.R": t("foot.R", (X, -26)),
            "pony1": t("pony1", (X, 8 - bounce * 6)),
            "pony2": t("pony2", (X, 6 - bounce * 4)),
            "tail1": t("tail1", (X, 6 - breath * 2)),
            "tail2": t("tail2", (X, 4)),
        }

    def winded(breath=0.0):
        """Low HP: bent over, the left hand on the knee, leaning on the spear."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.06)),
            hips=t("hips", (Z, -10), (X, 0)),
            spine=t("spine", (X, 30 + breath * 4)),
            chest=t("chest", (X, 12 + breath * 3)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -14 - breath * 4), (Y, -6)),
            upperarm__L=t("upperarm.L", (X, -36), (Y, -2)),
            forearm__L=t("forearm.L", (X, -18)),
            hand__L=t("hand.L", (X, 10)),
            upperarm__R=t("upperarm.R", (X, -54), (Y, 4)),
            forearm__R=t("forearm.R", (X, -16)),
            # The spear stands blade up, in front of her face, and she leans on it.
            hand__R=t("hand.R", (X, -62)),
            thigh__L=t("thigh.L", (X, -30), (Y, -6)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -4)),
            thigh__R=t("thigh.R", (X, -26), (Y, 6)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, -8)),
            pony1=t("pony1", (X, -28)),
            pony2=t("pony2", (X, -10)),
            tail1=t("tail1", (X, -6)),
            tail2=t("tail2", (X, -6)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.02)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, -8 * amount)),
            head=t("head", (X, -16 * amount), (Z, -8 * amount)),
            upperarm__L=t("upperarm.L", (Y, 16 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, -14 * amount), (X, 6 * amount)),
            pony1=t("pony1", (X, -20 * amount)),
            tail1=t("tail1", (X, -14 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -20)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 26)),
            foot__R=t("foot.R", (X, -14)),
            upperarm__L=t("upperarm.L", (Y, 24)),
            upperarm__R=t("upperarm.R", (Y, -24)),
            hand__R=t("hand.R", (X, 50)),
            pony1=t("pony1", (X, -30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the spear beside her and the coat spread."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.045)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, 0)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (Y, -40), (X, 20)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 60)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 8)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -18), (Y, 6)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, 0)),
            pony1=t("pony1", (X, -70)),
            pony2=t("pony2", (X, -10)),
            tail1=t("tail1", (X, -60)),
            tail2=t("tail2", (X, -10)),
        )

    def crouch(base):
        """A sprint start: down low, one knee near the ground, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.16)),
            hips=t("hips", (Z, -6)),
            spine=t("spine", (X, 34)),
            chest=t("chest", (X, 10)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -16)),
            thigh__L=t("thigh.L", (X, -72), (Y, -4)),
            shin__L=t("shin.L", (X, 92)),
            foot__L=t("foot.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -6), (Y, 4)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -30)),
            forearm__L=t("forearm.L", (X, -10)),
            upperarm__R=t("upperarm.R", (X, -20)),
            pony1=t("pony1", (X, -10)),
            tail1=t("tail1", (X, -20)),
            tail2=t("tail2", (X, -10)),
        )

    def proud(base):
        """Up again, the spear high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.006)),
            spine=t("spine", (X, 0)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -12), (Z, 10)),
            upperarm__R=t("upperarm.R", (X, -160), (Y, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, -70)),
            upperarm__L=t("upperarm.L", (Y, 16)),
            forearm__L=t("forearm.L", (X, -20)),
            pony1=t("pony1", (X, 14)),
            tail1=t("tail1", (X, 14)),
        )

    def stride(front):
        """
        A sprint stride, the front foot reaching out. `front` is 1 for the
        left foot, -1 for the right. The arms pump the other way.
        """
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03)),
            hips=t("hips", (Z, 8 * front)),
            spine=t("spine", (X, 18)),
            chest=t("chest", (Z, -12 * front)),
            head=t("head", (X, -14), (Z, 4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -50)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 22)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 32)),
                f"shin__{back}": t(f"shin.{back}", (X, 44)),
                f"foot__{back}": t(f"foot.{back}", (X, 30)),
                "upperarm__L": t("upperarm.L", (X, -40 * front), (Y, -4)),
                "forearm__L": t("forearm.L", (X, -80)),
                "upperarm__R": t("upperarm.R", (X, 26 * front), (Y, 4)),
                "forearm__R": t("forearm.R", (X, -50)),
                # The hand makes up for the swing of the arm, so the spear stays level.
                "hand__R": t("hand.R", (X, 30 - 26 * front)),
                "pony1": t("pony1", (X, 46), (Y, 6 * front)),
                "pony2": t("pony2", (X, -10)),
                "tail1": t("tail1", (X, 40)),
                "tail2": t("tail2", (X, 10)),
            },
        )

    def flight(lifted):
        """Both feet off the ground: the knee of `lifted` comes through high."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.02)),
            spine=t("spine", (X, 16)),
            head=t("head", (X, -12)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -40)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 90)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 14)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 60)),
                f"foot__{planted}": t(f"foot.{planted}", (X, 20)),
                "upperarm__L": t("upperarm.L", (X, -10), (Y, -4)),
                "forearm__L": t("forearm.L", (X, -80)),
                "upperarm__R": t("upperarm.R", (X, 0), (Y, 4)),
                "forearm__R": t("forearm.R", (X, -50)),
                "hand__R": t("hand.R", (X, 30)),
                "pony1": t("pony1", (X, 54)),
                "pony2": t("pony2", (X, -4)),
                "tail1": t("tail1", (X, 46)),
                "tail2": t("tail2", (X, 14)),
            },
        )

    # The attack is the Charge: she draws the spear back, then lunges and
    # thrusts it level. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the thrust lands at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.04)),
            hips=t("hips", (Z, -26)),
            spine=t("spine", (Z, -12), (X, 10)),
            chest=t("chest", (Z, -10)),
            head=t("head", (Z, 30), (X, -8)),
            upperarm__R=t("upperarm.R", (X, 36), (Y, 10)),
            forearm__R=t("forearm.R", (X, -70)),
            hand__R=t("hand.R", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -50)),
            forearm__L=t("forearm.L", (X, -40)),
            thigh__L=t("thigh.L", (X, -30), (Y, -4)),
            shin__L=t("shin.L", (X, 44)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, 16), (Y, 4)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -30)),
            pony1=t("pony1", (X, -10)),
            tail1=t("tail1", (X, -10)),
        )

    def thrust(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.1, -0.07)),
            hips=t("hips", (Z, 6)),
            spine=t("spine", (Z, 8), (X, 22)),
            chest=t("chest", (Z, 10)),
            head=t("head", (X, -22), (Z, -10)),
            upperarm__R=t("upperarm.R", (X, -76), (Y, -4)),
            forearm__R=t("forearm.R", (X, -6)),
            hand__R=t("hand.R", (X, 80)),
            upperarm__L=t("upperarm.L", (X, 50), (Y, 20)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -70), (Y, -4)),
            shin__L=t("shin.L", (X, 70)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 34), (Y, 4)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -10)),
            pony1=t("pony1", (X, 70)),
            pony2=t("pony2", (X, 20)),
            tail1=t("tail1", (X, 56)),
            tail2=t("tail2", (X, 20)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, bounce in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, 1), (48, 0, 0)):
        idle.key(frame, stand(breath, bounce))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    # A sprint (Fleet): a short, fast cycle with a flight phase.
    walk = Clip("walk", 16, loop=True)
    walk.key(0, stride(1)).key(4, flight("R")).key(8, stride(-1)).key(12, flight("L")).key(16, stride(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, windup(stand())).key(15, thrust(stand())).key(20, thrust(stand()))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.18))))
    summon.key(17, proud(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "kings-courier.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
