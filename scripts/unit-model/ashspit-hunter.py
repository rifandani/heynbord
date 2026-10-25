"""
Ashspit Hunter (`orc.ashspitHunter`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a lean orc man with a dark top
knot, one singed eyebrow and a worried look, a long leather coat with red
rags and a fur collar, a belt with pouches, tall strapped boots, an iron
basket of embers on his back and a long iron fire tube with brass rings. A
hose goes from the basket to the back of the tube. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/ashspit-hunter.glb`;
then `bun unit-model:pack ashspit-hunter` packs it for the game.

He holds the tube level at his hip, so the camera sees the tube and the
basket. The right eyebrow, on the camera side, is the one that is left: it
shows his concern. The left hand always holds the tube (IK to the `grip.L`
bone). The attack aims the tube with IK and the `Aim` constraint, and fires
at 20% of the clip, when the projectile leaves. The `embers` bone makes the
embers in the basket glow and flare. He has no Keyword that he uses by his
own action, so he has no cast clip.
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

SKIN = hex_color("#8f9a48")
SKIN_DARK = hex_color("#6a7334")
HAIR = hex_color("#2e221c")
HAIR_LIGHT = hex_color("#4a382c")
EYES = hex_color("#1a120c")
SOOT = hex_color("#7d746a")
MOUTH = hex_color("#4a1c18")
TUSK = hex_color("#efe4c6")
COAT = hex_color("#6a4a32")
COAT_DARK = hex_color("#46301f")
RED = hex_color("#a8342a")
RED_DARK = hex_color("#6a1e1a")
FUR = hex_color("#d8ccb6")
LEATHER = hex_color("#5a3a24")
LEATHER_DARK = hex_color("#3a2618")
IRON = hex_color("#4e4a46")
IRON_DARK = hex_color("#34312e")
BRASS = hex_color("#d2a24a")
BRASS_DARK = hex_color("#946e2c")
EMBER = hex_color("#ff7426")
EMBER_DARK = hex_color("#b8361c")
FLAME = hex_color("#ffb034")
FLASH = hex_color("#ffc23a")
FLASH_HOT = hex_color("#fff2b0")

# --- Proportions ---------------------------------------------------------------

# A lean figure.
HIP_Z = 0.46
WAIST_Z = 0.54
CHEST_Z = 0.63
SHOULDER_Z = 0.715
NECK_Z = 0.745
HEAD_C = Vector((0, -0.02, 0.835))
KNEE_Z = 0.26
ANKLE_Z = 0.05
LEG_X = 0.062

# The right hand holds the back of the tube at the hip, and the tube points
# forward, a little across the body. The left hand holds the front grip.
# These are the rest (bind) positions.
SL = Vector((0.15, 0, SHOULDER_Z))
SR = Vector((-0.15, 0, SHOULDER_Z))
ER = Vector((-0.2, 0.06, 0.57))
WR = Vector((-0.08, -0.04, 0.52))
TR = WR + (WR - ER).normalized() * 0.04
TUBE = Vector((0.24, -0.97, 0.1)).normalized()
GRIP_R = WR + (WR - ER).normalized() * 0.022
FRONT_GRIP = 0.15
GRIP_L = GRIP_R + TUBE * FRONT_GRIP
WL = GRIP_L
EL = Vector((0.17, -0.07, 0.55))
TL = WL + (WL - EL).normalized() * 0.04
MUZZLE = 0.4

# The ember basket on his back.
BASKET = Vector((0.0, 0.15, 0.7))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.01, NECK_Z), (0, -0.015, 0.78), "chest"),
    ("head", (0, -0.015, 0.78), (0, -0.02, 0.94), "neck"),
    # The tail of the top knot.
    ("hair", (0, 0.06, 0.9), (0, 0.1, 0.8), "head"),
    ("coat", (0, 0.08, 0.5), (0, 0.11, 0.2), "hips"),
    ("basket", tuple(BASKET), tuple(BASKET + Vector((0, 0, 0.1))), "chest"),
    ("embers", tuple(BASKET + Vector((0, 0, 0.04))), tuple(BASKET + Vector((0, 0, 0.1))), "basket"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
    ("pole.R", (-0.3, 0.2, 0.3), (-0.3, 0.2, 0.35), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.09, 0.018), f"shin.{side}"),
    ]
BONES += [
    ("tube", tuple(GRIP_R), tuple(GRIP_R + TUBE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + TUBE * 0.05), "tube"),
    ("flash", tuple(GRIP_R + TUBE * MUZZLE), tuple(GRIP_R + TUBE * (MUZZLE + 0.05)), "tube"),
]

# The hose: from the foot of the basket, round the right hip, to the back of the tube.
HOSE = [
    BASKET + Vector((-0.04, -0.01, -0.07)),
    Vector((-0.12, 0.1, 0.55)),
    Vector((-0.15, 0.04, 0.47)),
    Vector((-0.12, 0.0, 0.47)),
    GRIP_R - TUBE * 0.1,
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.68)


def hair_weights(co):
    return blend("hair", "head", co.z, 0.84, 0.88)


def coat_weights(co):
    """The tails of the coat follow the coat bone at the back, and the thighs at the sides."""
    t = clamp01((0.5 - co.z) / 0.2)
    back = clamp01(co.y / 0.08)
    side = co.x / 0.1
    legs = t * (1 - back) * 0.8
    return {
        "hips": 1 - t,
        "coat": t * back,
        "thigh.L": legs * clamp01(side),
        "thigh.R": legs * clamp01(-side),
    }


def coat_top_weights(co):
    if co.z > 0.5:
        return torso_weights(co)
    return coat_weights(co)


def hose_weights(co):
    """The hose follows the chest at the basket and the tube at the other end."""
    to_basket = (co - HOSE[0]).length
    to_tube = (co - HOSE[-1]).length
    t = clamp01(to_basket / (to_basket + to_tube))
    if t < 0.5:
        return {"chest": 1 - t, "hips": t}
    return {"hips": 2 * (1 - t), "tube": 2 * t - 1}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.062, 0.066, 0.068), 12, 9)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.04)), (0.052, 0.044, 0.034), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.062, 0.002)), HEAD_C + Vector((0, -0.08, -0.018)), 0.016, 0.006, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.058 * sign, 0.008, 0.004)), HEAD_C + Vector((0.13 * sign, 0.03, 0.04)), 0.02, 0.002, 5, squash=0.4)
    ring = kit.torus(head.bm, HEAD_C + Vector((-0.074, 0.012, -0.012)), (1, 0, 0), 0.011, 0.003, 8, 3)
    head.paint(faces_of(ring), BRASS)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.025 * sign, -0.06, 0.012)), (0.009, 0.006, 0.008), 6, 4)
    # The right eyebrow is left, and its inner end goes up with concern.
    brow = kit.slab(face.bm, HEAD_C + Vector((-0.026, -0.064, 0.036)), (0.016, 0, 0.011), (0, 0.006, 0), (-0.003, 0, 0.005))
    face.paint(faces_of(brow), HAIR)
    # The left one is singed off: only soot is left.
    soot = kit.sphere(face.bm, HEAD_C + Vector((0.03, -0.059, 0.03)), (0.022, 0.006, 0.009), 6, 4)
    face.paint(faces_of(soot), SOOT)
    # A tight, worried mouth.
    mouth = kit.slab(face.bm, HEAD_C + Vector((0, -0.068, -0.038)), (0.018, 0, -0.003), (0, 0.004, 0), (0, 0, 0.004))
    face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.022 * sign, -0.066, -0.05)), HEAD_C + Vector((0.026 * sign, -0.072, -0.026)), 0.007, 0.001, 5)
    parts.append(tusks)

    # A dark top knot: short hair on the crown, a knot at the back and its tail.
    hair = Part("hair", HAIR, hair_weights, shade=0.14)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.008, 0.012)), (0.066, 0.07, 0.068), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.z < HEAD_C.z + 0.01 or (v.co.y < -0.03 and v.co.z < HEAD_C.z + 0.04)], context="VERTS")
    knot = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.03, 0.08)), (0.03, 0.03, 0.028), 8, 6)
    hair.paint(faces_of(knot), HAIR_LIGHT)
    tie = kit.torus(hair.bm, HEAD_C + Vector((0, 0.04, 0.06)), (0, 0.6, 1), 0.02, 0.005, 8, 3)
    hair.paint(faces_of(tie), RED)
    kit.tube(
        hair.bm,
        [HEAD_C + Vector((0, 0.05, 0.1)), HEAD_C + Vector((0, 0.09, 0.1)), HEAD_C + Vector((0, 0.12, 0.04)), HEAD_C + Vector((0.01, 0.13, -0.04))],
        [0.022, 0.02, 0.014, 0.003],
        6,
    )
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.008, 0.7), (0, -0.015, 0.79), 0.042, 0.038, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The coat, from the shoulders to the knees, open at the front.
    body = Part("body", COAT, torso_weights, shade=0.14)
    kit.cone(body.bm, (0, 0.0, 0.46), (0, -0.004, 0.62), 0.098, 0.096, 12, squash=0.74)
    kit.sphere(body.bm, (0, 0.0, 0.66), (0.128, 0.078, 0.08), 12, 8)
    # A shirt shows in the opening of the coat.
    shirt = kit.box(body.bm, (0, -0.07, 0.6), (0.06, 0.02, 0.14))
    body.paint(faces_of(shirt), RED_DARK)
    parts.append(body)

    def tail_color(row, column):
        if row == 3:
            return RED_DARK if column % 3 == 0 else COAT_DARK
        return RED if column % 5 == 2 else COAT

    tails = Part("coat", COAT, coat_top_weights)
    kit.ragged_cone(tails, 0.5, 0.22, 0.105, 0.16, 14, 4, 0.82, 0.06, tail_color, COAT_DARK, gap=math.radians(40), y_push=0.04)
    parts.append(tails)

    # The fur collar.
    collar = Part("collar", FUR, "chest", shade=0.1)
    kit.torus(collar.bm, (0, 0.006, 0.71), (0, 0.3, 1), 0.105, 0.03, 14, 5)
    parts.append(collar)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, -0.004, 0.45), (0, -0.004, 0.49), 0.106, 0.102, 14, squash=0.82)
    medal = kit.cone(belt.bm, (0, -0.086, 0.47), (0, -0.1, 0.47), 0.026, 0.022, 10)
    belt.paint(faces_of(medal), BRASS)
    for sign in (1, -1):
        pouch = kit.box(belt.bm, (0.085 * sign, -0.06, 0.44), (0.045, 0.035, 0.05))
        belt.paint(faces_of(pouch), LEATHER)
    # Straps of the basket over the shoulders.
    for sign in (1, -1):
        kit.tube(belt.bm, [(0.07 * sign, 0.1, 0.62), (0.08 * sign, -0.02, 0.73), (0.07 * sign, -0.075, 0.64)], [0.009] * 3, 4)
    # The straps follow the chest, and the belt the hips.
    belt.weights = lambda co: {"chest": 1.0} if co.z > 0.56 else {"hips": 1.0}
    parts.append(belt)
    return parts


def basket_parts():
    """An iron basket of embers on his back, and the hose to the tube."""
    basket = Part("basket", IRON, "basket", shade=0.06)
    for z in (-0.08, 0.0, 0.08):
        kit.torus(basket.bm, BASKET + Vector((0, 0, z)), (0, 0, 1), 0.085, 0.008, 12, 4)
    for index in range(8):
        a = 2 * math.pi * index / 8
        foot = BASKET + Vector((0.085 * math.cos(a), 0.085 * math.sin(a), -0.085))
        kit.cone(basket.bm, foot, foot + Vector((0, 0, 0.17)), 0.006, 0.006, 4)
    bottom = kit.cone(basket.bm, BASKET + Vector((0, 0, -0.09)), BASKET + Vector((0, 0, -0.078)), 0.085, 0.085, 10)
    basket.paint(faces_of(bottom), IRON_DARK)

    embers = Part("embers", EMBER, "embers", shade=0.0)
    for index, (x, y, z, r) in enumerate(((0.0, 0.0, 0.0, 0.05), (0.035, 0.025, 0.04, 0.036), (-0.035, -0.01, 0.04, 0.038), (0.0, -0.035, 0.055, 0.034), (0.01, 0.035, 0.065, 0.03))):
        coal = kit.sphere(embers.bm, BASKET + Vector((x, y, z)), (r, r, r * 0.9), 6, 4)
        embers.paint(faces_of(coal), (EMBER, EMBER_DARK, FLAME)[index % 3])
    for dx, height in ((-0.025, 0.09), (0.03, 0.065)):
        foot = BASKET + Vector((dx, 0.0, 0.08))
        tongue = kit.tube(embers.bm, [foot, foot + Vector((dx * 0.3, 0.01, height * 0.6)), foot + Vector((-dx * 0.3, 0.02, height))], [0.02, 0.013, 0.002], 5)
        embers.paint({f for f in faces_of(tongue) if f.calc_center_median().z > foot.z + height * 0.5}, FLASH_HOT)
        embers.paint({f for f in faces_of(tongue) if f.calc_center_median().z <= foot.z + height * 0.5}, FLAME)

    hose = Part("hose", LEATHER_DARK, hose_weights, shade=0.05)
    verts = kit.tube(hose.bm, HOSE, [0.013] * len(HOSE), 6)
    for face in faces_of(verts):
        if int((face.calc_center_median() - HOSE[0]).length * 60) % 2:
            hose.paint([face], LEATHER)
    return [basket, embers, hose]


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", COAT, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.006 * sign, 0, -0.004)), (0.046, 0.046, 0.046), 8, 6)
        kit.cone(upper.bm, s, e, 0.042, 0.036, 8)
        rag = kit.cone(upper.bm, s + (e - s) * 0.55, s + (e - s) * 0.68, 0.043, 0.042, 8)
        upper.paint(faces_of(rag), RED)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", COAT, f"forearm.{side}")
        cuff = kit.cone(forearm.bm, e, e + d * 0.06, 0.04, 0.042, 8)
        forearm.paint(faces_of(cuff), COAT_DARK)
        kit.cone(forearm.bm, e + d * 0.05, w, 0.034, 0.03, 8)
        bracer = kit.cone(forearm.bm, e + d * 0.08, w - d * 0.005, 0.036, 0.033, 8)
        forearm.paint(faces_of(bracer), LEATHER)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.028, 0.026, 0.03), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", LEATHER_DARK, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.056, 0.044, 8)
        parts.append(thigh)

        # Tall boots with straps and buckles.
        shin = Part(f"shin.{side}", LEATHER, f"shin.{side}", shade=0.1)
        kit.cone(shin.bm, knee + Vector((0, 0, 0.02)), ankle + Vector((0, 0, 0.04)), 0.05, 0.044, 8)
        for z in (0.2, 0.14, 0.09):
            strap = kit.cone(shin.bm, Vector((LEG_X * sign, 0, z)), Vector((LEG_X * sign, 0, z + 0.014)), 0.049, 0.048, 8)
            shin.paint(faces_of(strap), LEATHER_DARK)
            buckle = kit.box(shin.bm, Vector(((LEG_X + 0.046) * sign, -0.01, z + 0.007)), (0.012, 0.014, 0.014))
            shin.paint(faces_of(buckle), BRASS)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.05)), ankle - Vector((0, 0, 0.02)), 0.05, 0.052, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.034, 0.024), (0.074, 0.14, 0.048))
        parts.append(boot)
    return parts


def tube_parts():
    tube = Part("tube", IRON, "tube", shade=0.04)
    rear = GRIP_R - TUBE * 0.11
    muzzle = GRIP_R + TUBE * MUZZLE
    kit.cone(tube.bm, rear, muzzle - TUBE * 0.05, 0.026, 0.024, 8)
    # A flared mouth.
    mouth = kit.cone(tube.bm, muzzle - TUBE * 0.05, muzzle, 0.026, 0.04, 8)
    tube.paint(faces_of(mouth), IRON_DARK)
    for along in (-0.08, 0.06, 0.2, 0.32):
        ring = kit.cone(tube.bm, GRIP_R + TUBE * along, GRIP_R + TUBE * (along + 0.018), 0.03, 0.03, 8)
        tube.paint(faces_of(ring), BRASS)
    cap = kit.sphere(tube.bm, rear, (0.03, 0.03, 0.03), 8, 5)
    tube.paint(faces_of(cap), BRASS_DARK)
    # The two grips under the tube: one for each hand.
    for along in (0.0, FRONT_GRIP):
        grip = kit.cone(tube.bm, GRIP_R + TUBE * along + Z * 0.02, GRIP_R + TUBE * along - Z * 0.03, 0.013, 0.012, 6)
        tube.paint(faces_of(grip), LEATHER)
    # Embers glow at the mouth.
    glow = kit.cone(tube.bm, muzzle - TUBE * 0.002, muzzle + TUBE * 0.002, 0.03, 0.03, 8)
    tube.paint(faces_of(glow), EMBER)

    flash = Part("flash", FLASH, "flash", shade=0.0)
    side = TUBE.cross(Z).normalized()
    up = side.cross(TUBE).normalized()
    kit.sphere(flash.bm, muzzle + TUBE * 0.04, (0.04, 0.04, 0.04), 8, 6)
    flare = kit.cone(flash.bm, muzzle + TUBE * 0.02, muzzle + TUBE * 0.16, 0.05, 0.004, 8)
    flash.paint(faces_of(flare), FLASH_HOT)
    for direction in (side, -side, up, -up):
        petal = kit.cone(flash.bm, muzzle + TUBE * 0.03, muzzle + TUBE * 0.07 + direction * 0.07, 0.022, 0.002, 4)
        flash.paint(faces_of(petal), FLAME)
    return [tube, flash]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("AshspitHunter", BONES)
    parts = head_parts() + body_parts() + basket_parts() + limb_parts() + tube_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "AshspitHunterMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the tube, the right hand to aim. The tube aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "tube_aim": kit.add_empty("tube_aim"),
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
    aim = bones["tube"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["tube_aim"]
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

    tube_rest = rig.data.bones["tube"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the tube that points it along `direction`."""
        return TUBE.rotation_difference(Vector(direction).normalized()) @ tube_rest

    def held(base, hand, direction):
        """The right hand and the tube by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "tube_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "tube_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, sway=0.0, glow=0.0):
        """
        The idle stance: the feet wide and the knees bent, turned a little to
        his right, the tube level at the hip. He looks along the tube.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.016 - breath * 0.004)),
            "hips": t("hips", (Z, -14)),
            "spine": t("spine", (Z, -2), (X, 6 + breath)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (Z, 6)),
            "head": t("head", (Z, 6 + sway * 5), (X, 4 + breath * 2), (Y, sway * 3)),
            "hair": t("hair", (X, -breath * 6), (Y, sway * 6)),
            "upperarm.R": t("upperarm.R", (X, -breath * 2)),
            "thigh.L": t("thigh.L", (X, -22), (Y, -6)),
            "shin.L": t("shin.L", (X, 26)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 10), (Y, 8)),
            "shin.R": t("shin.R", (X, 16)),
            "foot.R": t("foot.R", (X, -26)),
            "coat": t("coat", (X, -4 - breath * 3), (Y, sway * 3)),
            "basket": t("basket", (Y, sway * 2)),
            "embers@scale": 1.0 + glow * 0.12,
            "forearm.L/IK": 1.0,
            "flash@scale": 0.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, the mouth of the tube on the ground. The embers are low."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.02, -0.14 - breath * 0.005)),
                spine=t("spine", (Z, -2), (X, 20 + breath * 3)),
                chest=t("chest", (X, 8 + breath * 2)),
                head=t("head", (Z, 6), (X, 12 + breath * 4), (Y, -8)),
                hair=t("hair", (X, 16)),
                thigh__L=t("thigh.L", (X, -74), (Y, -6)),
                shin__L=t("shin.L", (X, 76)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 12), (Y, 8)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -50)),
                coat=t("coat", (X, 24)),
                embers_at_scale=0.55 + breath * 0.1,
            ),
            (-0.06, -0.06, 0.4 - breath * 0.005),
            (0.15, -1, -0.75),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.016 - 0.006 * amount)),
            spine=t("spine", (Z, -2), (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            hair=t("hair", (X, 20 * amount)),
            upperarm__R=t("upperarm.R", (X, 14 * amount), (Y, 8 * amount)),
            coat=t("coat", (X, 14 * amount)),
            basket=t("basket", (X, -10 * amount)),
            embers_at_scale=1.0 + 0.3 * amount,
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.04)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, 16)),
            coat=t("coat", (X, -16)),
            embers_at_scale=0.7,
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the tube across the chest. The embers go out."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.13)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, 30)),
            hair=t("hair", (X, -40)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, 10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            coat=t("coat", (X, -50)),
            basket=t("basket", (X, -20)),
            embers_at_scale=0.0,
        )

    def crouch(base, glow=0.4):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.12)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 10)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -36)),
            thigh__R=t("thigh.R", (X, -50), (Y, 6)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            coat=t("coat", (X, 30)),
            embers_at_scale=glow,
        )

    def proud(base):
        """Up again, the tube up, and a small puff of fire: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, 0.0)),
                spine=t("spine", (X, -4)),
                chest=t("chest", (X, -10)),
                head=t("head", (Z, 4), (X, -14)),
                hair=t("hair", (X, -10)),
                thigh__L=t("thigh.L", (X, -8), (Y, -6)),
                shin__L=t("shin.L", (X, 8)),
                thigh__R=t("thigh.R", (X, 4), (Y, 8)),
                shin__R=t("shin.R", (X, 6)),
                foot__R=t("foot.R", (X, -12)),
                embers_at_scale=1.35,
                flash_at_scale=0.5,
            ),
            (-0.06, -0.08, 0.6),
            (0.1, -0.6, 1),
        )

    def step(front):
        """A careful stride, the tube level. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.024)),
            hips=t("hips", (Z, -12), (Y, 4 * front)),
            spine=t("spine", (Z, -2), (X, 10)),
            chest=t("chest", (Z, -4 * front)),
            hair=t("hair", (X, 8)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 18)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 22)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "coat": t("coat", (X, 16), (Y, 4 * front)),
                "basket": t("basket", (Y, 4 * front)),
                "embers_at_scale": 1.0 + 0.1 * front,
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.004)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (Z, -2), (X, 10)),
            hair=t("hair", (X, -6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -26)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 12)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                "coat": t("coat", (X, 10)),
                "basket": t("basket", (X, 4)),
            },
        )

    # The attack: he braces, lifts the tube to the chest and fires. The shot
    # leaves at 20% of the attack (`FLIGHT_START` in fx.ts), so the fire
    # flash is at frame 6 of 30, and the tube kicks up after it. The basket
    # flares as the fire leaves it.
    def aiming(base, kick=0.0, flash=0.0):
        hand = Vector((-0.07, -0.05 + kick * 0.03, 0.57 + kick * 0.012))
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.01, -0.03)),
                hips=t("hips", (Z, -20)),
                spine=t("spine", (Z, -8), (X, 8 - kick * 6)),
                chest=t("chest", (Z, -6), (X, -kick * 6)),
                neck=t("neck", (Z, 12)),
                head=t("head", (Z, 14), (X, 6 - kick * 10), (Y, -6)),
                hair=t("hair", (X, 10 + kick * 20)),
                thigh__L=t("thigh.L", (X, -32), (Y, -6)),
                shin__L=t("shin.L", (X, 34)),
                foot__L=t("foot.L", (X, -4)),
                thigh__R=t("thigh.R", (X, 14), (Y, 8)),
                shin__R=t("shin.R", (X, 26)),
                foot__R=t("foot.R", (X, -38)),
                coat=t("coat", (X, 8 + kick * 10)),
                basket=t("basket", (X, -kick * 8)),
                embers_at_scale=1.0 + flash * 0.4,
                flash_at_scale=flash,
            ),
            hand,
            (0.05, -1, 0.04 + kick * 0.3),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, glow in ((0, 0, 0, 0), (8, 0.3, 0.6, 1), (16, 0.6, 1, -0.6), (24, 1, 0, 0.8), (32, 0.6, -1, -1), (40, 0.3, -0.6, 0.6), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, glow))
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
    rebirth.key(32, crouch(stand(), 0.3)).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(), 0.0)).key(10, pose(crouch(stand(), 0.5), hips_at_loc=at("hips", (0, 0.02, -0.1))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "ashspit-hunter.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
