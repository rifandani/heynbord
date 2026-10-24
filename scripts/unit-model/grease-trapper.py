"""
Grease Trapper (`goblin.greaseTrapper`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a short pale goblin man with big,
scared yellow eyes, an open mouth with crooked teeth, very large ears and
grey wisps of hair under a patched leather cap with brass goggles. A ragged
brown tunic, a leather belt with a small brass hourglass at his right hip,
torn brown trousers and bare feet. He mops black grease onto the ground: a
mop in both hands, a bucket of black grease and a puddle of grease at his
feet, and a big round spring trap with no teeth on his back. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/grease-trapper.glb`; then
`bun unit-model:pack grease-trapper` packs it for the game.

The right hand holds the mop low, and the left hand holds it higher (IK to
the `grip.L` bone of the mop). The head of the mop is on the ground at his
right, on the camera side. The bucket and the puddle have bones with no
parent, so they stay on the ground. His idle mops from side to side, and he
slips a little on his own grease. His attack slaps the greasy mop down on
the target. His death is a slip: his feet fly up and he falls on his back.
He has no Keyword that he uses by his own action, so he has no cast clip.
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

SKIN = hex_color("#b6b2a8")
SKIN_DARK = hex_color("#86827a")
EAR = hex_color("#e0a08c")
HAIR = hex_color("#d8d6d0")
EYES = hex_color("#f2c040")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#3e1a18")
TEETH = hex_color("#ece2c4")
CAP = hex_color("#6a4a30")
CAP_DARK = hex_color("#4a3220")
PATCH = hex_color("#8a6a48")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
LENS = hex_color("#e8c060")
TUNIC = hex_color("#7a5838")
TUNIC_DARK = hex_color("#5a3e26")
SHIRT = hex_color("#d4c6a6")
LEATHER = hex_color("#6a4026")
LEATHER_DARK = hex_color("#40261a")
TROUSERS = hex_color("#6a5038")
TROUSERS_DARK = hex_color("#4a3826")
SAND = hex_color("#e6cf8a")
GLASS = hex_color("#c8d4d0")
WOOD = hex_color("#a0703e")
WOOD_DARK = hex_color("#6a4422")
STRAND = hex_color("#4a3a2a")
GREASE = hex_color("#1c1714")
GREASE_SHINE = hex_color("#4a4038")
IRON = hex_color("#6a5a4a")
IRON_DARK = hex_color("#3e342c")
RUST = hex_color("#8a5232")

# --- Proportions ---------------------------------------------------------------

# He is short and a little hunched.
HIP_Z = 0.28
WAIST_Z = 0.34
CHEST_Z = 0.4
SHOULDER_Z = 0.46
NECK_Z = 0.48
HEAD_C = Vector((0, -0.03, 0.58))
KNEE_Z = 0.16
ANKLE_Z = 0.04
LEG_X = 0.05

# The right hand holds the mop low at the right hip, and the left hand holds
# it higher, across the body. The head of the mop is on the ground at his
# right. These are the rest (bind) positions.
GRIP_R = Vector((-0.08, -0.095, 0.29))
GRIP_L = Vector((-0.025, -0.07, 0.4))
MOP = (GRIP_L - GRIP_R).normalized()
MOP_FOOT = GRIP_R - MOP * 0.3
MOP_TOP = GRIP_L + MOP * 0.07

SL = Vector((0.085, 0, SHOULDER_Z))
EL = Vector((0.1, -0.04, 0.37))
WL = GRIP_L + Vector((0.01, 0.0, -0.012))
TL = WL + (WL - EL).normalized() * 0.035
SR = Vector((-0.085, 0, SHOULDER_Z))
ER = Vector((-0.125, 0.0, 0.365))
WR = GRIP_R + Vector((0.0, 0.0, 0.012))
TR = WR + (WR - ER).normalized() * 0.035

BUCKET_C = Vector((0.1, -0.15, 0.0))
# The puddle is under the head of the mop in the idle pose.
PUDDLE_C = Vector((-0.235, -0.16, 0.0))
TRAP_C = Vector((0, 0.1, 0.42))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.006, 0.51), "chest"),
    ("head", (0, -0.006, 0.51), (0, -0.012, 0.69), "neck"),
    ("trap", tuple(TRAP_C), tuple(TRAP_C + Z * 0.08), "chest"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
    ("pole.R", (-0.3, 0.2, 0.3), (-0.3, 0.2, 0.35), "chest"),
    # The bucket and the puddle stay on the ground: they have no parent.
    ("bucket", tuple(BUCKET_C), tuple(BUCKET_C + Z * 0.08), None),
    ("puddle", tuple(PUDDLE_C), tuple(PUDDLE_C + Z * 0.04), None),
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
    ("mop", tuple(GRIP_R), tuple(GRIP_R + MOP * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + MOP * 0.05), "mop"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.3, 0.37)
    return blend("spine", "chest", co.z, 0.38, 0.44)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.072, 0.07, 0.072), 14, 10)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.024, -0.05)), (0.044, 0.036, 0.032), 10, 6)
    # A short, pointed nose.
    kit.cone(head.bm, HEAD_C + Vector((0, -0.064, -0.006)), HEAD_C + Vector((0, -0.094, -0.022)), 0.016, 0.004, 6)
    for sign in (1, -1):
        # Very large goblin ears that droop a little.
        ear = kit.cone(head.bm, HEAD_C + Vector((0.064 * sign, 0.012, -0.004)), HEAD_C + Vector((0.2 * sign, 0.05, -0.045)), 0.042, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # An open, worried mouth with crooked teeth.
    mouth_c = HEAD_C + Vector((0, -0.058, -0.04))
    kit.sphere(face.bm, mouth_c, (0.028, 0.014, 0.014), 10, 6)
    for x, z, h in ((-0.014, 0.008, 0.012), (0.0, 0.009, 0.01), (0.013, 0.007, 0.013), (-0.006, -0.009, 0.008), (0.009, -0.009, 0.009)):
        tooth = kit.box(face.bm, mouth_c + Vector((x, -0.01, z)), (0.008, 0.005, h))
        face.paint(faces_of(tooth), TEETH)
    # Big, scared eyes with small pupils, and brows up high.
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.056, 0.016))
        eye = kit.sphere(face.bm, center, (0.024, 0.015, 0.024), 10, 6)
        face.paint(faces_of(eye), EYES)
        pupil = kit.sphere(face.bm, center + Vector((-0.003 * sign, -0.014, 0.002)), (0.005, 0.003, 0.006), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
        brow = kit.tube(face.bm, [center + Vector((0.018 * sign, -0.004, 0.024)), center + Vector((-0.012 * sign, -0.01, 0.034))], [0.0035, 0.0035], 3)
        face.paint(faces_of(brow), SKIN_DARK)
    parts.append(face)

    # Grey wisps of hair at the sides, under the cap.
    hair = Part("hair", HAIR, "head", shade=0.05)
    for sign in (1, -1):
        for index in range(3):
            root = HEAD_C + Vector((0.055 * sign, 0.02 + 0.02 * index, 0.03))
            kit.cone(hair.bm, root, root + Vector((0.03 * sign, 0.02, -0.05 - 0.01 * index)), 0.014, 0.003, 4)
    parts.append(hair)

    # A patched leather cap with a short brim, and brass goggles with yellow lenses.
    cap = Part("cap", CAP, "head", shade=0.06)
    kit.sphere(cap.bm, HEAD_C + Vector((0, 0.008, 0.028)), (0.078, 0.076, 0.062), 12, 8)
    brim = kit.cone(cap.bm, HEAD_C + Vector((0, -0.05, 0.03)), HEAD_C + Vector((0, -0.09, 0.024)), 0.05, 0.046, 10, squash=0.25)
    cap.paint(faces_of(brim), CAP_DARK)
    for at, size in (((0.05, 0.02, 0.64), (0.02, 0.03, 0.025)), ((-0.03, 0.06, 0.63), (0.03, 0.02, 0.025))):
        patch = kit.box(cap.bm, at, size)
        cap.paint(faces_of(patch), PATCH)
    band = kit.torus(cap.bm, HEAD_C + Vector((0, 0.006, 0.042)), (0, 0.1, 1), 0.077, 0.006, 16, 4)
    cap.paint(faces_of(band), LEATHER_DARK)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.032 * sign, -0.07, 0.07))
        out = Vector((0.15 * sign, -1, 0.5)).normalized()
        goggle = kit.cone(cap.bm, center - out * 0.006, center + out * 0.02, 0.022, 0.02, 10)
        cap.paint(faces_of(goggle), BRASS)
        rim = kit.torus(cap.bm, center + out * 0.02, out, 0.019, 0.004, 10, 3)
        cap.paint(faces_of(rim), BRASS_DARK)
        lens = kit.cone(cap.bm, center + out * 0.018, center + out * 0.022, 0.016, 0.016, 10)
        cap.paint(faces_of(lens), LENS)
    parts.append(cap)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.46), (0, -0.006, 0.54), 0.024, 0.022, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", TUNIC, torso_weights)
    kit.cone(tunic.bm, (0, 0, 0.24), (0, 0, 0.46), 0.072, 0.066, 12, squash=0.84)
    # A ragged hem and a shirt collar.
    for index in range(10):
        a = math.radians(index * 36 + 18)
        top = Vector((0.072 * math.sin(a), -0.06 * math.cos(a), 0.26))
        rag = kit.cone(tunic.bm, top, top + Vector((0.008 * math.sin(a), -0.008 * math.cos(a), -0.045 - 0.01 * (index % 3))), 0.02, 0.004, 4, squash=0.5)
        tunic.paint(faces_of(rag), TUNIC_DARK if index % 2 else TUNIC)
    collar = kit.torus(tunic.bm, (0, -0.004, 0.465), (0, 0.2, 1), 0.045, 0.012, 12, 4)
    tunic.paint(faces_of(collar), SHIRT)
    # A leather strap across the chest holds the trap.
    strap = kit.tube(tunic.bm, [(0.07, 0.02, 0.46), (0.03, -0.062, 0.42), (-0.05, -0.05, 0.33), (-0.075, 0.0, 0.3)], [0.006] * 4, 4)
    tunic.paint(faces_of(strap), LEATHER_DARK)
    parts.append(tunic)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, 0, 0.27), (0, 0, 0.3), 0.075, 0.075, 12, squash=0.86)
    buckle = kit.box(belt.bm, (0, -0.067, 0.285), (0.022, 0.008, 0.02))
    belt.paint(faces_of(buckle), BRASS)
    # The small brass hourglass at the right hip: Sabotage.
    glass = Vector((-0.08, -0.025, 0.24))
    for z in (-0.03, 0.03):
        plate = kit.cone(belt.bm, glass + Vector((0, 0, z - 0.003)), glass + Vector((0, 0, z + 0.003)), 0.016, 0.016, 8)
        belt.paint(faces_of(plate), BRASS)
    for angle in (0, 120, 240):
        a = math.radians(angle)
        post = kit.cone(belt.bm, glass + Vector((math.cos(a) * 0.013, math.sin(a) * 0.013, -0.03)), glass + Vector((math.cos(a) * 0.013, math.sin(a) * 0.013, 0.03)), 0.0025, 0.0025, 4)
        belt.paint(faces_of(post), BRASS_DARK)
    for sign in (1, -1):
        bulb = kit.cone(belt.bm, glass + Vector((0, 0, 0.027 * sign)), glass + Vector((0, 0, 0.002 * sign)), 0.011, 0.003, 8)
        belt.paint(faces_of(bulb), GLASS)
    sand = kit.cone(belt.bm, glass + Vector((0, 0, -0.027)), glass + Vector((0, 0, -0.012)), 0.01, 0.005, 8)
    belt.paint(faces_of(sand), SAND)
    hook = kit.tube(belt.bm, [glass + Vector((0, 0, 0.033)), Vector((-0.073, -0.025, 0.28))], [0.003, 0.003], 4)
    belt.paint(faces_of(hook), LEATHER_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.21), (0, 0, 0.28), 0.07, 0.07, 12, squash=0.86)
    parts.append(hips)
    return parts


def trap_parts():
    """The big round spring trap with no teeth, on his back: two jaws, a coil spring and a plate."""
    trap = Part("trap", IRON, "trap", shade=0.05)
    c = TRAP_C
    jaw = kit.torus(trap.bm, c, (0, 1, 0), 0.085, 0.009, 20, 5)
    trap.paint(faces_of(jaw), IRON)
    inner = kit.torus(trap.bm, c + Vector((0, 0.012, 0)), (0, 1, 0), 0.074, 0.007, 20, 4)
    trap.paint(faces_of(inner), RUST)
    plate = kit.cone(trap.bm, c + Vector((0, -0.002, 0)), c + Vector((0, 0.008, 0)), 0.035, 0.035, 12)
    trap.paint(faces_of(plate), IRON_DARK)
    # The coil spring, out to the side of the jaws.
    points = []
    radii = []
    for step in range(25):
        a = step * math.pi / 4
        points.append(c + Vector((0.085 + 0.012 * step / 4, 0.014 + 0.012 * math.cos(a), 0.012 * math.sin(a))))
        radii.append(0.003)
    coil = kit.tube(trap.bm, points, radii, 4)
    trap.paint(faces_of(coil), IRON_DARK)
    for sign in (1, -1):
        hinge = kit.sphere(trap.bm, c + Vector((0.085 * sign, 0.004, 0)), (0.012, 0.012, 0.012), 6, 4)
        trap.paint(faces_of(hinge), RUST)
    return [trap]


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", TUNIC, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.026, 0.022, 8)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", SHIRT, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.02, 0.017, 8)
        cuff = kit.cone(forearm.bm, e + (w - e) * 0.6, w - d * 0.004, 0.021, 0.019, 8)
        forearm.paint(faces_of(cuff), LEATHER)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.012, (0.018, 0.017, 0.02), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.04, 0.033, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", SKIN, f"shin.{side}")
        kit.cone(shin.bm, knee, ankle, 0.02, 0.017, 8)
        hem = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.055)), 0.035, 0.039, 8)
        for face in faces_of(hem):
            shin.paint([face], TROUSERS_DARK if face.calc_center_median().x * sign > 0.04 else TROUSERS)
        wrap = kit.torus(shin.bm, ankle + Vector((0, 0, 0.03)), (0, 0, 1), 0.019, 0.005, 8, 3)
        shin.paint(faces_of(wrap), LEATHER)
        parts.append(shin)

        # Big bare goblin feet, black with grease at the toes.
        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.016), (0.026, 0.055, 0.017), 8, 6)
        for toe in (-1, 0, 1):
            nail = kit.sphere(foot.bm, (LEG_X * sign + toe * 0.012, -0.08, 0.01), (0.008, 0.01, 0.008), 5, 4)
            if side == "R":
                foot.paint(faces_of(nail), GREASE)
        parts.append(foot)
    return parts


def mop_parts():
    mop = Part("mop", WOOD, "mop", shade=0.03)
    d = MOP
    kit.cone(mop.bm, MOP_FOOT, MOP_TOP, 0.008, 0.007, 6)
    knob = kit.sphere(mop.bm, MOP_TOP, (0.011, 0.011, 0.011), 6, 4)
    mop.paint(faces_of(knob), WOOD_DARK)
    collar = kit.cone(mop.bm, MOP_FOOT - d * 0.005, MOP_FOOT + d * 0.03, 0.016, 0.012, 8)
    mop.paint(faces_of(collar), IRON)
    # The strands of the mop, black with grease, spread on the ground.
    for index in range(10):
        a = 2 * math.pi * index / 10
        out = Vector((math.cos(a), math.sin(a) * 0.8 - 0.2, 0))
        tip = Vector((MOP_FOOT.x, MOP_FOOT.y, 0.006)) + out * (0.05 + 0.012 * (index % 3))
        strand = kit.tube(mop.bm, [MOP_FOOT, MOP_FOOT.lerp(tip, 0.5) + Vector((0, 0, -0.004)) + out * 0.006, tip], [0.007, 0.006, 0.004], 4)
        mop.paint(faces_of(strand), GREASE if index % 3 else STRAND)
    return [mop]


def ground_parts():
    bucket = Part("bucket", IRON, "bucket", shade=0.1)
    c = BUCKET_C
    kit.cone(bucket.bm, c, c + Vector((0, 0, 0.085)), 0.042, 0.05, 12, caps=False)
    kit.cone(bucket.bm, c, c + Vector((0, 0, 0.004)), 0.042, 0.042, 12)
    for z in (0.02, 0.07):
        band = kit.torus(bucket.bm, c + Vector((0, 0, z)), (0, 0, 1), 0.044 + z * 0.09, 0.004, 12, 3)
        bucket.paint(faces_of(band), IRON_DARK)
    rim = kit.torus(bucket.bm, c + Vector((0, 0, 0.085)), (0, 0, 1), 0.05, 0.005, 12, 3)
    bucket.paint(faces_of(rim), RUST)
    # Black grease up to the rim, and drips down the side.
    grease = kit.cone(bucket.bm, c + Vector((0, 0, 0.075)), c + Vector((0, 0, 0.08)), 0.048, 0.048, 12)
    bucket.paint(faces_of(grease), GREASE)
    for angle in (-120, -80, -40, 200):
        a = math.radians(angle)
        top = c + Vector((math.cos(a) * 0.05, math.sin(a) * 0.05, 0.085))
        drip = kit.cone(bucket.bm, top, top + Vector((math.cos(a) * -0.004, math.sin(a) * -0.004, -0.03 - 0.012 * (angle % 3))), 0.006, 0.004, 4)
        bucket.paint(faces_of(drip), GREASE)
    handle = kit.tube(bucket.bm, [c + Vector((0.05, 0, 0.075)), c + Vector((0.045, -0.03, 0.12)), c + Vector((0, -0.045, 0.135)), c + Vector((-0.045, -0.03, 0.12)), c + Vector((-0.05, 0, 0.075))], [0.003] * 5, 4)
    bucket.paint(faces_of(handle), IRON_DARK)

    puddle = Part("puddle", GREASE, "puddle", shade=0)
    p = PUDDLE_C
    kit.cone(puddle.bm, p + Vector((0, 0, 0.001)), p + Vector((0, 0, 0.004)), 0.085, 0.08, 14, squash=0.8)
    blob = kit.cone(puddle.bm, p + Vector((0.07, 0.06, 0.001)), p + Vector((0.07, 0.06, 0.004)), 0.03, 0.028, 8)
    puddle.paint(faces_of(blob), GREASE)
    for offset in ((0.02, -0.02), (-0.03, 0.025), (0.08, 0.05)):
        shine = kit.cone(puddle.bm, p + Vector((*offset, 0.003)), p + Vector((*offset, 0.005)), 0.01, 0.008, 6, squash=0.6)
        puddle.paint(faces_of(shine), GREASE_SHINE)
    return [bucket, puddle]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("GreaseTrapper", BONES)
    parts = head_parts() + body_parts() + trap_parts() + limb_parts() + mop_parts() + ground_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "GreaseTrapperMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the left arm: the left hand stays on the mop."""
    ik = rig.pose.bones["forearm.L"].constraints.new("IK")
    ik.name = "IK"
    ik.target = rig
    ik.subtarget = "grip.L"
    ik.pole_target = rig
    ik.pole_subtarget = "pole.L"
    ik.pole_angle = math.radians(POLE_ANGLE)
    ik.chain_count = 2
    return {}


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

    def stand(breath=0.0, sweep=0.0, slip=0.0):
        """
        The idle stance: hunched over the mop. `sweep` swings the mop from
        side to side, and `slip` slides the right foot forward on the grease.
        """
        return {
            "hips@loc": at("hips", (0, 0.01 + slip * 0.01, -0.02 - breath * 0.003 - slip * 0.02)),
            "hips": t("hips", (Z, -8 + sweep * 6), (Y, -slip * 6)),
            "spine": t("spine", (X, 12 + breath), (Z, sweep * 4)),
            "chest": t("chest", (X, 6 - breath * 2), (Z, sweep * 6)),
            "neck": t("neck", (X, -6), (Z, -6)),
            "head": t("head", (Z, -10 - sweep * 4 + slip * 20), (X, -2 + breath * 2 - slip * 14), (Y, slip * 8)),
            "upperarm.R": t("upperarm.R", (X, -8 + sweep * 10), (Y, sweep * 4)),
            "forearm.R": t("forearm.R", (X, -16 - breath * 2)),
            "thigh.L": t("thigh.L", (X, -20), (Y, -6)),
            "shin.L": t("shin.L", (X, 30 + slip * 10)),
            "foot.L": t("foot.L", (X, -10)),
            "thigh.R": t("thigh.R", (X, 4 - slip * 34), (Y, 8)),
            "shin.R": t("shin.R", (X, 22 - slip * 18)),
            "foot.R": t("foot.R", (X, -24 + slip * 10)),
            "trap": t("trap", (X, breath * 2), (Y, sweep * 3)),
            "forearm.L/IK": 1.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, leaning on the mop."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.1 - breath * 0.004)),
            spine=t("spine", (X, 22 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            head=t("head", (Z, -6), (X, 14 + breath * 4), (Y, -8)),
            upperarm__R=t("upperarm.R", (X, -24)),
            forearm__R=t("forearm.R", (X, -33)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 70)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 10), (Y, 8)),
            shin__R=t("shin.R", (X, 90)),
            foot__R=t("foot.R", (X, -40)),
            trap=t("trap", (X, 10)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the trap rattles."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.02 - 0.006 * amount)),
            spine=t("spine", (X, -4 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, -6), (X, -20 * amount)),
            upperarm__R=t("upperarm.R", (X, 14 * amount), (Y, -10 * amount)),
            trap=t("trap", (X, -12 * amount), (Y, 8 * amount)),
        )

    def slipping(base):
        """Both feet go out on the grease, the arms fly up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.03)),
            spine=t("spine", (X, -16)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -10)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, -30)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 20)),
            thigh__R=t("thigh.R", (X, -40), (Y, 8)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, 20)),
            trap=t("trap", (X, -20)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the feet still up, the mop across his chest."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            neck=t("neck", (X, 12)),
            head=t("head", (X, 18), (Z, -30)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, -20)),
            thigh__L=t("thigh.L", (X, -40), (Y, -10)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -60), (Y, 10)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, 10)),
            trap=t("trap", (X, -10)),
        )

    def crouch(base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.09)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 16)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            trap=t("trap", (X, 16)),
        )

    def proud(base):
        """Up again, the mop raised high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, -4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -100), (Y, -20)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 6)),
            thigh__R=t("thigh.R", (X, 4), (Y, 8)),
            shin__R=t("shin.R", (X, 6)),
        )

    def step(front, lift=0.0):
        """A careful step, the mop pushed along. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(sweep=0.6 * front),
            hips_at_loc=at("hips", (0, 0, -0.024 + lift * 0.012)),
            spine=t("spine", (X, 16), (Z, 4 * front)),
            trap=t("trap", (Y, 6 * front), (X, lift * 4)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34 - lift * 8)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 24 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 24)),
                f"foot__{back}": t(f"foot.{back}", (X, 0)),
            },
        )

    # The attack: he lifts the greasy mop high and slaps it down on the
    # target. The slash effect starts at 50% of the attack (`MELEE_IMPACT` in
    # fx.ts), so the mop lands at frame 15 of 30.
    def lift(base):
        return pose(
            base,
            hips=t("hips", (Z, -20)),
            spine=t("spine", (X, -8), (Z, -10)),
            chest=t("chest", (X, -12), (Z, -10)),
            head=t("head", (Z, 4), (X, -16)),
            upperarm__R=t("upperarm.R", (X, -140), (Y, -10)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -14), (Y, -6)),
            shin__L=t("shin.L", (X, 16)),
            thigh__R=t("thigh.R", (X, 14), (Y, 8)),
            shin__R=t("shin.R", (X, 18)),
            trap=t("trap", (X, -10)),
        )

    def slap(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.05, -0.05)),
            hips=t("hips", (Z, 6)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 16), (Z, 6)),
            head=t("head", (X, -16)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, -6)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 20)),
            thigh__L=t("thigh.L", (X, -54), (Y, -6)),
            shin__L=t("shin.L", (X, 50)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 22), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
            trap=t("trap", (X, 16)),
        )

    clips = []
    # The idle: he mops from side to side, and slips a little on his own grease.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sweep, slip in ((0, 0, 0, 0), (8, 0.3, 1, 0), (16, 0.6, -1, 0), (24, 1, 0, 0), (28, 0.8, 0, 1), (31, 0.7, 0, 0.6), (36, 0.5, 0, 0), (42, 0.3, -0.6, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sweep, slip))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, step(1, 1)).key(12, step(-1)).key(18, step(-1, 1)).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, lift(stand())).key(15, slap(stand())).key(19, slap(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    # The death: he slips on his own grease, the feet fly up, and he falls on his back.
    death = Clip("death", 36)
    death.key(0, stand()).key(4, recoil(stand())).key(10, slipping(stand()))
    death.key(20, fallen(stand())).key(25, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(10, slipping(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.01, -0.07))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "grease-trapper.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
