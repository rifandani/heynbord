"""
Ember Shaman (`orc.emberShaman`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a big, kind-faced orc woman with
a big bun of dark hair, a fur robe with a pale fur collar, a cream apron
with red marks, a red sash with bone charms, a long necklace of bone beads
and fur boots. She holds a large wooden ladle as a staff in her right hand,
on the camera side, and a ball of fire burns in its bowl. A black cooking
pot sits on a fire next to her, on her right. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/ember-shaman.glb`;
then `bun unit-model:pack ember-shaman` packs it for the game.

The right hand moves by IK to the `ik_hand.R` target, and the ladle aims
with a Copy Rotation (`Aim`), so the ladle stays upright at rest. She uses
the same ladle for soup and for fire: her idle stirs the pot. Her attack is
ranged: she swings the ladle back and flings the fire ball forward, and the
ball leaves the bowl at 20% of the clip. The `flame` bone of the ladle
scales the fire in the bowl, and the `fire` bone the fire under the pot. The
pot has a bone with no parent, so it stays on the ground; in her walk it
hops after her. Both fires go out in the death clip. She has no Keyword
that she uses by her own action, so she has no cast clip.
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

SKIN = hex_color("#a8b04e")
SKIN_DARK = hex_color("#78803a")
CHEEK = hex_color("#c0a052")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#5a2018")
TUSK = hex_color("#f0e6c8")
HAIR = hex_color("#3a2418")
HAIR_DARK = hex_color("#24160e")
ROBE = hex_color("#5e4632")
ROBE_DARK = hex_color("#3e2e22")
FUR = hex_color("#d8ccb0")
FUR_DARK = hex_color("#a89a80")
APRON = hex_color("#e2d2b0")
APRON_DARK = hex_color("#b8a684")
RED = hex_color("#a83424")
RED_DARK = hex_color("#6e2018")
BONE = hex_color("#ece2c6")
BONE_DARK = hex_color("#b0a282")
LEATHER = hex_color("#5c3a26")
LEATHER_DARK = hex_color("#382418")
WOOD = hex_color("#8a5e38")
WOOD_DARK = hex_color("#5a3a22")
IRON = hex_color("#3a3634")
IRON_DARK = hex_color("#24201e")
SOUP = hex_color("#b2642a")
STONE = hex_color("#8c7e6c")
FLAME = hex_color("#ff9a2a")
FLAME_HOT = hex_color("#ffe27a")
FLAME_DARK = hex_color("#e04a18")

# --- Proportions ---------------------------------------------------------------

# She is big: wide hips and shoulders, a round body.
HIP_Z = 0.48
WAIST_Z = 0.57
CHEST_Z = 0.66
SHOULDER_Z = 0.75
NECK_Z = 0.78
HEAD_C = Vector((0, -0.03, 0.875))
KNEE_Z = 0.27
ANKLE_Z = 0.06
LEG_X = 0.076

# The arms hang a little out to the sides at rest (the bind pose).
SR = Vector((-0.155, 0, SHOULDER_Z))
ER = Vector((-0.215, -0.02, 0.6))
WR = Vector((-0.235, -0.06, 0.47))
TR = WR + (WR - ER).normalized() * 0.05
SL = Vector((0.155, 0, SHOULDER_Z))
EL = Vector((0.215, -0.02, 0.6))
WL = Vector((0.235, -0.06, 0.47))
TL = WL + (WL - EL).normalized() * 0.05

# The ladle stands upright in the right fist, its bowl beside her head.
GRIP_R = WR + (WR - ER).normalized() * 0.03
LADLE = Vector((0, -0.1, 1)).normalized()
LADLE_LENGTH = 0.48
LADLE_TOP = GRIP_R + LADLE * LADLE_LENGTH
FORWARD = Vector((0, -1, 0))
BOWL_C = LADLE_TOP + FORWARD * 0.07 + LADLE * 0.01
FLAME_C = BOWL_C + LADLE * 0.05

# The pot on its fire, on her right and a little in front of her.
POT = Vector((-0.3, -0.12, 0))
POT_C = POT + Z * 0.15

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.01, NECK_Z), (0, -0.02, 0.81), "chest"),
    ("head", (0, -0.02, 0.81), (0, -0.03, 0.97), "neck"),
    ("hair", tuple(HEAD_C + Vector((0, 0.05, 0.0))), tuple(HEAD_C + Vector((0, 0.1, -0.16))), "head"),
    ("robe.F", (0, -0.1, 0.5), (0, -0.12, 0.26), "hips"),
    ("robe.B", (0, 0.1, 0.5), (0, 0.12, 0.26), "hips"),
    # The pole that the right elbow points to: out and back.
    ("pole.R", (-0.45, 0.25, 0.5), (-0.45, 0.25, 0.55), "chest"),
    ("pot", tuple(POT), tuple(POT + Z * 0.1), None),
    ("fire", tuple(POT + Z * 0.02), tuple(POT + Z * 0.1), "pot"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.1, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("ladle", tuple(GRIP_R), tuple(GRIP_R + LADLE * 0.12), "hand.R"),
    ("flame", tuple(FLAME_C - LADLE * 0.03), tuple(FLAME_C + LADLE * 0.06), "ladle"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.6)
    return blend("spine", "chest", co.z, 0.62, 0.7)


def collar_weights(co):
    return blend("chest", "neck", co.z, 0.8, 0.84)


def robe_weights(co):
    bone = "robe.F" if co.y < 0 else "robe.B"
    return blend(bone, "hips", co.z, 0.44, 0.5)


def hair_weights(co):
    return blend("head", "hair", co.y, HEAD_C.y + 0.05, HEAD_C.y + 0.09)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.066, 0.066, 0.07), 12, 9)
    # Full, round cheeks and a wide jaw.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.028, -0.036)), (0.058, 0.046, 0.036), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.062, 0.002)), HEAD_C + Vector((0, -0.08, -0.014)), 0.016, 0.007, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.062 * sign, 0.006, 0.0)), HEAD_C + Vector((0.13 * sign, 0.03, 0.03)), 0.022, 0.002, 5, squash=0.4)
        cheek = kit.sphere(head.bm, HEAD_C + Vector((0.034 * sign, -0.056, -0.018)), (0.016, 0.008, 0.012), 6, 4)
        head.paint(faces_of(cheek), CHEEK)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        # Kind eyes, half closed with a smile.
        kit.slab(face.bm, HEAD_C + Vector((0.025 * sign, -0.063, 0.012)), (0.011, 0, 0.002), (0, 0.004, 0), (0, 0, 0.004))
        brow = kit.slab(face.bm, HEAD_C + Vector((0.025 * sign, -0.063, 0.03)), (0.016, 0.0, -0.004 * sign), (0, 0.005, 0), (0.0, 0.0, 0.004))
        face.paint(faces_of(brow), HAIR)
        # A dot of red paint on each cheek.
        dot = kit.sphere(face.bm, HEAD_C + Vector((0.046 * sign, -0.052, -0.004)), (0.007, 0.004, 0.007), 5, 3)
        face.paint(faces_of(dot), RED)
    # A wide, warm smile with its corners up.
    for dx, dz, tilt in ((0.0, -0.05, 0.0), (0.024, -0.044, 0.45), (-0.024, -0.044, -0.45)):
        mouth = kit.slab(face.bm, HEAD_C + Vector((dx, -0.072 + abs(dx) * 0.3, dz)), (0.014, 0, 0.012 * tilt), (0, 0.005, 0), (0, 0, 0.008))
        face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.026 * sign, -0.068, -0.062)), HEAD_C + Vector((0.03 * sign, -0.076, -0.036)), 0.008, 0.001, 5)
    parts.append(tusks)

    # A big bun of dark hair with a bone pin, and thick locks down the back.
    hair = Part("hair", HAIR, hair_weights, shade=0.12)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.012, 0.016)), (0.072, 0.074, 0.07), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.y < HEAD_C.y - 0.03 and v.co.z < HEAD_C.z + 0.04], context="VERTS")
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.03, 0.09)), (0.052, 0.05, 0.044), 10, 6)
    pin = kit.cone(hair.bm, HEAD_C + Vector((-0.07, 0.03, 0.1)), HEAD_C + Vector((0.07, 0.03, 0.12)), 0.006, 0.004, 4)
    hair.paint(faces_of(pin), BONE)
    for k, sign in enumerate((1, -1, 0.4, -0.4)):
        lock = kit.cone(hair.bm, HEAD_C + Vector((0.05 * sign, 0.04, -0.01)), HEAD_C + Vector((0.07 * sign, 0.08, -0.18 + 0.02 * k)), 0.026, 0.01, 6)
        hair.paint(faces_of(lock), HAIR_DARK if k % 2 else HAIR)
    for sign in (1, -1):
        bead = kit.sphere(hair.bm, HEAD_C + Vector((0.07 * sign, 0.08, -0.16)), (0.012, 0.012, 0.012), 5, 4)
        hair.paint(faces_of(bead), BONE)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.01, 0.74), (0, -0.02, 0.83), 0.044, 0.04, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The fur robe over a round body.
    torso = Part("torso", ROBE, torso_weights, shade=0.14)
    kit.sphere(torso.bm, (0, 0.0, 0.68), (0.15, 0.1, 0.1), 14, 8)
    kit.cone(torso.bm, (0, 0, 0.47), (0, 0, 0.67), 0.14, 0.14, 12, squash=0.78)
    parts.append(torso)

    # The pale fur collar round her shoulders.
    collar = Part("collar", FUR, collar_weights, shade=0.1)
    verts = kit.torus(collar.bm, (0, 0.0, 0.77), (0, 0.15, 1), 0.105, 0.032, 16, 6)
    for face in faces_of(verts):
        if int(face.calc_center_median().x * 80) % 3 == 0:
            collar.paint([face], FUR_DARK)
    parts.append(collar)

    # The long necklace of bone beads, the red sash and its charms.
    beads = Part("beads", BONE, torso_weights, shade=0.05)
    for k in range(11):
        a = math.radians(-75 + 15 * k)
        drop = 0.07 * math.cos(math.radians(-75 + 15 * k) * 1.1)
        p = Vector((0.09 * math.sin(a), -0.1 * math.cos(a) + 0.02, 0.75 - drop))
        if k % 2:
            kit.sphere(beads.bm, p, (0.011, 0.011, 0.011), 5, 4)
        else:
            fang = kit.cone(beads.bm, p, p + Vector((0, -0.006, -0.03)), 0.009, 0.001, 4)
            beads.paint(faces_of(fang), BONE_DARK)
    sash = kit.cone(beads.bm, (0, 0, 0.53), (0, 0, 0.58), 0.146, 0.144, 14, squash=0.8)
    beads.paint(faces_of(sash), RED)
    knot = kit.sphere(beads.bm, (0.09, -0.1, 0.55), (0.026, 0.02, 0.022), 6, 4)
    beads.paint(faces_of(knot), RED_DARK)
    for k, dx in enumerate((0.06, 0.1, 0.13)):
        charm = kit.cone(beads.bm, (dx, -0.1 + k * 0.01, 0.53), (dx, -0.106 + k * 0.01, 0.48 - 0.02 * k), 0.01, 0.002, 4)
        beads.paint(faces_of(charm), BONE if k % 2 == 0 else BONE_DARK)
    # A small spoon and a tin cup hang on the sash.
    cup = kit.cone(beads.bm, (-0.12, -0.08, 0.5), (-0.13, -0.08, 0.46), 0.02, 0.024, 8)
    beads.paint(faces_of(cup), IRON)
    parts.append(beads)

    # The robe below the sash, in a front flap with the apron and a back flap, with a fur hem.
    def robe_color(face_side, row, column):
        if face_side == "back":
            return ROBE_DARK
        if row == 3:
            return FUR
        return ROBE_DARK if column % 3 == 1 else ROBE

    for name, sign in (("robe.F", -1), ("robe.B", 1)):
        robe = Part(name, ROBE, robe_weights, shade=0.12)

        def grid(inset, sign=sign):
            result = []
            for row in range(5):
                v = row / 4
                line = []
                for c in range(9):
                    u = lerp(-1, 1, c / 8)
                    angle = u * math.radians(86)
                    radius = lerp(0.145, 0.19, v) - inset
                    tear = 0.03 * v * ((c * 5) % 3) / 2
                    line.append((radius * math.sin(angle), sign * radius * math.cos(angle) * 0.8, lerp(0.53, 0.22 + tear, v)))
                result.append(line)
            return result

        kit.panel(robe, grid(0.0), grid(0.008), robe_color)
        parts.append(robe)

    # The apron over the front flap, with red marks.
    apron = Part("apron", APRON, lambda co: robe_weights(Vector((co.x, -1, co.z))), shade=0.08)

    def apron_grid(inset):
        result = []
        for row in range(5):
            v = row / 4
            line = []
            for c in range(5):
                u = lerp(-1, 1, c / 4)
                angle = u * math.radians(34)
                radius = lerp(0.15, 0.192, v) + 0.012 - inset
                line.append((radius * math.sin(angle), -radius * math.cos(angle) * 0.8, lerp(0.56, 0.26, v)))
            result.append(line)
        return result

    def apron_color(face_side, row, column):
        if face_side == "back":
            return APRON_DARK
        # A red band across, and a red mark under it.
        if row == 1 or (row == 2 and column in (1, 2)):
            return RED
        return APRON_DARK if row == 3 else APRON

    kit.panel(apron, apron_grid(0.0), apron_grid(0.005), apron_color)
    parts.append(apron)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.008 * sign, 0, -0.01)), (0.054, 0.05, 0.054), 10, 7)
        kit.cone(upper.bm, s, e, 0.05, 0.042, 8)
        fur = kit.sphere(upper.bm, s + Vector((0.01 * sign, 0, 0.02)), (0.058, 0.055, 0.036), 8, 5)
        upper.paint(faces_of(fur), FUR)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.042, 0.034, 8)
        wrap = kit.cone(forearm.bm, w - d * 0.07, w - d * 0.004, 0.04, 0.036, 8)
        forearm.paint(faces_of(wrap), LEATHER)
        bead = kit.torus(forearm.bm, w - d * 0.075, d, 0.04, 0.007, 10, 3)
        forearm.paint(faces_of(bead), BONE)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.028, (0.032, 0.028, 0.034), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.066, 0.05, 8)
        parts.append(thigh)

        # Fur boots up to the knee.
        shin = Part(f"shin.{side}", LEATHER, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.04)), 0.052, 0.048, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 40) % 2 == 0:
                shin.paint([face], LEATHER_DARK)
        cuff = kit.torus(shin.bm, knee - Vector((0, 0, 0.02)), Z, 0.054, 0.018, 12, 4)
        shin.paint(faces_of(cuff), FUR)
        charm = kit.cone(shin.bm, knee + Vector((-0.055 * (1 if side == "L" else -1) * -1, -0.01, -0.06)), knee + Vector((-0.055 * (1 if side == "L" else -1) * -1, -0.014, -0.1)), 0.009, 0.001, 4)
        shin.paint(faces_of(charm), BONE)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.045)), ankle - Vector((0, 0, 0.025)), 0.05, 0.054, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.036, 0.026), (0.08, 0.15, 0.052))
        parts.append(boot)
    return parts


def flame_ball(part, center, up, radius, colors=(FLAME, FLAME_HOT, FLAME_DARK)):
    """A ball of fire: a hot core, a round flame and tongues that lick up."""
    core = kit.sphere(part.bm, center, (radius * 0.6,) * 3, 8, 6)
    part.paint(faces_of(core), colors[1])
    ball = kit.sphere(part.bm, center - up * radius * 0.1, (radius,) * 3, 10, 7)
    part.paint(faces_of(ball), colors[0])
    side = up.cross(X if abs(up.dot(X)) < 0.9 else Y).normalized()
    other = up.cross(side).normalized()
    for k in range(5):
        a = 2 * math.pi * k / 5
        out = side * math.cos(a) + other * math.sin(a)
        foot = center + out * radius * 0.6
        tongue = kit.cone(part.bm, foot, foot + up * radius * (1.5 + 0.4 * (k % 2)) + out * radius * 0.2, radius * 0.45, 0.002, 5)
        part.paint(faces_of(tongue), colors[0] if k % 2 else colors[2])
    tip = kit.cone(part.bm, center + up * radius * 0.5, center + up * radius * 2.2, radius * 0.5, 0.002, 6)
    part.paint(faces_of(tip), colors[1])


def ladle_parts():
    """The big wooden ladle and the fire ball in its bowl."""
    ladle = Part("ladle", WOOD, "ladle", shade=0.06)
    kit.cone(ladle.bm, GRIP_R - LADLE * 0.12, LADLE_TOP, 0.018, 0.015, 6)
    for along in (-0.02, 0.04):
        wrap = kit.cone(ladle.bm, GRIP_R + LADLE * along, GRIP_R + LADLE * (along + 0.03), 0.021, 0.021, 6)
        ladle.paint(faces_of(wrap), LEATHER)
    knob = kit.sphere(ladle.bm, GRIP_R - LADLE * 0.125, (0.018, 0.018, 0.018), 6, 4)
    ladle.paint(faces_of(knob), WOOD_DARK)
    # The neck bends forward into the round bowl, its mouth up.
    kit.tube(ladle.bm, [LADLE_TOP - LADLE * 0.01, LADLE_TOP + LADLE * 0.02 + FORWARD * 0.02, BOWL_C - FORWARD * 0.06], [0.015, 0.014, 0.013], 6)
    bowl = kit.sphere(ladle.bm, BOWL_C, (0.075, 0.075, 0.052), 12, 8)
    kit.bmesh.ops.delete(ladle.bm, geom=[v for v in bowl if (v.co - BOWL_C).dot(LADLE) > 0.012], context="VERTS")
    for face in ladle.bm.faces:
        if (face.calc_center_median() - BOWL_C).length < 0.08 and face.calc_center_median().z < BOWL_C.z - 0.025:
            ladle.paint([face], WOOD_DARK)
    rim = kit.torus(ladle.bm, BOWL_C + LADLE * 0.012, LADLE, 0.074, 0.007, 14, 3)
    ladle.paint(faces_of(rim), WOOD_DARK)
    # Bone charms tied under the bowl.
    for sign in (1, -1):
        charm = kit.cone(ladle.bm, LADLE_TOP + X * 0.012 * sign, LADLE_TOP + X * 0.02 * sign - LADLE * 0.06, 0.008, 0.001, 4)
        ladle.paint(faces_of(charm), BONE)

    flame = Part("flame", FLAME, "flame", smooth=True, shade=0.0)
    flame_ball(flame, FLAME_C, LADLE, 0.042)
    return [ladle, flame]


def pot_parts():
    """The black pot of soup on three stones over a fire of crossed logs."""
    pot = Part("pot", IRON, "pot", shade=0.14)
    verts = kit.sphere(pot.bm, POT_C, (0.1, 0.1, 0.085), 12, 8)
    kit.bmesh.ops.delete(pot.bm, geom=[v for v in verts if v.co.z > POT_C.z + 0.05], context="VERTS")
    rim = kit.torus(pot.bm, POT_C + Z * 0.05, Z, 0.08, 0.012, 14, 4)
    pot.paint(faces_of(rim), IRON_DARK)
    soup = kit.cone(pot.bm, POT_C + Z * 0.035, POT_C + Z * 0.042, 0.078, 0.076, 12)
    pot.paint(faces_of(soup), SOUP)
    for k, (dx, dy) in enumerate(((0.02, 0.01), (-0.03, -0.02), (0.0, 0.035))):
        bubble = kit.sphere(pot.bm, POT_C + Vector((dx, dy, 0.045)), (0.012 - k * 0.002,) * 3, 5, 4)
        pot.paint(faces_of(bubble), FLAME_HOT if k == 0 else SOUP)
    for sign in (1, -1):
        handle = kit.torus(pot.bm, POT_C + Vector((0.1 * sign, 0, 0.03)), (1, 0, 0), 0.02, 0.005, 8, 3)
        pot.paint(faces_of(handle), IRON_DARK)
    # A bone sticks out of the soup.
    bone = kit.cone(pot.bm, POT_C + Vector((-0.02, 0.02, 0.03)), POT_C + Vector((-0.05, 0.05, 0.12)), 0.009, 0.008, 5)
    pot.paint(faces_of(bone), BONE)
    knob = kit.sphere(pot.bm, POT_C + Vector((-0.052, 0.052, 0.125)), (0.014, 0.014, 0.014), 5, 4)
    pot.paint(faces_of(knob), BONE)
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.3
        stone = kit.sphere(pot.bm, POT + Vector((0.1 * math.cos(a), 0.1 * math.sin(a), 0.03)), (0.04, 0.036, 0.03), 6, 4)
        pot.paint(faces_of(stone), STONE)
    for a in (0.4, 2.0):
        log = kit.cone(pot.bm, POT + Vector((0.13 * math.cos(a), 0.13 * math.sin(a), 0.02)), POT - Vector((0.13 * math.cos(a), 0.13 * math.sin(a), -0.02)), 0.018, 0.016, 6)
        pot.paint(faces_of(log), WOOD_DARK)

    fire = Part("fire", FLAME, "fire", shade=0.0)
    for k in range(6):
        a = 2 * math.pi * k / 6
        foot = POT + Vector((0.07 * math.cos(a), 0.07 * math.sin(a), 0.02))
        tongue = kit.cone(fire.bm, foot, foot + Vector((0.02 * math.cos(a), 0.02 * math.sin(a), 0.09 + 0.03 * (k % 2))), 0.024, 0.002, 5)
        fire.paint(faces_of(tongue), FLAME if k % 2 else FLAME_DARK)
    core = kit.sphere(fire.bm, POT + Z * 0.04, (0.05, 0.05, 0.02), 8, 4)
    fire.paint(faces_of(core), FLAME_HOT)
    return [pot, fire]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("EmberShaman", BONES)
    parts = head_parts() + body_parts() + limb_parts() + ladle_parts() + pot_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "EmberShamanMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends the right elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the right hand, and `Aim` for the ladle."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "ladle_aim": kit.add_empty("ladle_aim"),
    }
    bones = rig.pose.bones
    ik = bones["forearm.R"].constraints.new("IK")
    ik.name = "IK"
    ik.target = empties["ik_hand.R"]
    ik.pole_target = rig
    ik.pole_subtarget = "pole.R"
    ik.pole_angle = math.radians(POLE_ANGLE)
    ik.chain_count = 2
    aim = bones["ladle"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["ladle_aim"]
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

    ladle_rest = rig.data.bones["ladle"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the ladle that points it along `direction`."""
        direction = Vector(direction).normalized()
        return LADLE.rotation_difference(direction) @ ladle_rest

    def hold(base, hand, direction):
        """The right hand and the ladle by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "ladle_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "ladle_aim_at_rot": aimed(direction),
            },
        )

    def body(breath=0.0, sway=0.0, flicker=0.0, fire=0.0):
        """Her body at rest, without the right arm: she stands wide and hums. The left hand is open at her side."""
        return {
            "hips@loc": at("hips", (0, 0, -0.02 - breath * 0.005)),
            "hips": t("hips", (Z, -8), (Y, sway * 2)),
            "spine": t("spine", (X, 2 + breath), (Y, -sway * 2)),
            "chest": t("chest", (X, -2 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, -4)),
            "head": t("head", (X, -4 + breath * 2), (Z, -10 + sway * 4), (Y, sway * 6)),
            "hair": t("hair", (X, -4 - breath * 4), (Y, sway * 4)),
            "upperarm.L": t("upperarm.L", (X, -20), (Y, -10)),
            "forearm.L": t("forearm.L", (X, -70), (Z, 30)),
            "hand.L": t("hand.L", (X, -10)),
            "thigh.L": t("thigh.L", (X, -14), (Y, -8)),
            "shin.L": t("shin.L", (X, 10)),
            "foot.L": t("foot.L", (X, 4)),
            "thigh.R": t("thigh.R", (X, 10), (Y, 8)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -18)),
            "robe.F": t("robe.F", (X, -6)),
            "robe.B": t("robe.B", (X, 4 + sway * 3)),
            "flame@scale": 1.0 + flicker * 0.15,
            "fire@scale": 1.0 + fire * 0.15,
        }

    def stand(breath=0.0, sway=0.0, flicker=0.0, fire=0.0):
        """The ladle stands upright beside her, its fire at the height of her head."""
        return hold(
            body(breath, sway, flicker, fire),
            WR + Vector((0.0, -0.02, 0.01 + breath * 0.006)),
            LADLE + Vector((-0.02, 0, 0)),
        )

    def stir(phase, breath=0.0):
        """The ladle down in the pot: `phase` turns it round the pot. The fire of the bowl goes into the soup."""
        a = 2 * math.pi * phase
        hand = POT_C + Vector((0.04 + 0.03 * math.cos(a), 0.03 * math.sin(a), 0.47))
        tip = Vector((0.03 * math.cos(a + 1), 0.03 * math.sin(a + 1), 0))
        return hold(
            pose(
                body(breath, 0, 0, 1),
                hips=t("hips", (Z, -16)),
                spine=t("spine", (X, 10), (Y, 6)),
                chest=t("chest", (X, 6), (Z, -10)),
                head=t("head", (X, 10), (Z, -26)),
                flame_at_scale=0.2,
            ),
            hand,
            Vector((tip.x, tip.y, -1)) - Vector((0.05, 0, 0)),
        )

    def slump(breath=0.0):
        """Low HP: down on one knee, she leans on the ladle as on a staff. Both fires are low."""
        return hold(
            pose(
                body(breath),
                hips_at_loc=at("hips", (0, 0.03, -0.17 - breath * 0.005)),
                spine=t("spine", (X, 24 + breath * 3)),
                chest=t("chest", (X, 8 + breath * 2)),
                neck=t("neck", (X, -8)),
                head=t("head", (X, 4 + breath * 3), (Z, -10)),
                upperarm__L=t("upperarm.L", (X, -30), (Y, -14)),
                forearm__L=t("forearm.L", (X, -60)),
                thigh__L=t("thigh.L", (X, -78), (Y, -6)),
                shin__L=t("shin.L", (X, 80)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 6), (Y, 8)),
                shin__R=t("shin.R", (X, 96)),
                foot__R=t("foot.R", (X, -40)),
                robe__F=t("robe.F", (X, -30)),
                flame_at_scale=0.55 + breath * 0.1,
                fire_at_scale=0.5,
            ),
            Vector((-0.22, -0.16, 0.42 - breath * 0.005)),
            Vector((-0.04, 0.1, 1)),
        )

    def recoil(base, amount=1.0):
        """A hit jolts her back, and the fire of the ladle flares."""
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.035 * amount, -0.03)),
                spine=t("spine", (X, -6 * amount)),
                chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
                neck=t("neck", (X, -10)),
                head=t("head", (X, -18 * amount), (Z, -6)),
                upperarm__L=t("upperarm.L", (X, -40 * amount), (Y, -40 * amount)),
                forearm__L=t("forearm.L", (X, -30)),
                robe__F=t("robe.F", (X, -24 * amount)),
                flame_at_scale=1.0 + 0.4 * amount,
            ),
            WR + Vector((0.0, 0.06 * amount, 0.06 * amount)),
            LADLE + Vector((0, 0.3 * amount, 0)),
        )

    def stagger(base):
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.05)),
                hips=t("hips", (Z, -12)),
                spine=t("spine", (X, -8)),
                neck=t("neck", (X, 0)),
                head=t("head", (X, -22)),
                thigh__L=t("thigh.L", (X, -30)),
                shin__L=t("shin.L", (X, 34)),
                thigh__R=t("thigh.R", (X, 12)),
                shin__R=t("shin.R", (X, 30)),
                upperarm__L=t("upperarm.L", (X, -20), (Y, -40)),
                flame_at_scale=0.6,
                fire_at_scale=0.7,
            ),
            Vector((-0.3, 0.06, 0.6)),
            Vector((-0.4, 0.4, 1)),
        )

    def fallen(base, bounce=0.0, fires=0.0):
        """Flat on her back, the ladle on the ground beside her. `fires` (0 to 1) lights the fires again."""
        return hold(
            pose(
                base,
                root=t("root", (X, -86 + bounce)),
                root_at_loc=at("root", (0, 0, 0.14)),
                hips_at_loc=at("hips", (0, 0, -0.01)),
                hips=t("hips", (Z, 0), (X, 0)),
                spine=t("spine", (X, -4)),
                chest=t("chest", (X, -4)),
                neck=t("neck", (X, 0)),
                head=t("head", (X, -12), (Z, -30)),
                hand__R=t("hand.R", (X, 0)),
                upperarm__L=t("upperarm.L", (Y, -60), (X, 10)),
                forearm__L=t("forearm.L", (X, -10)),
                thigh__L=t("thigh.L", (X, -10), (Y, -6)),
                shin__L=t("shin.L", (X, 12)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, -24), (Y, 6)),
                shin__R=t("shin.R", (X, 36)),
                foot__R=t("foot.R", (X, 0)),
                robe__F=t("robe.F", (X, 16)),
                robe__B=t("robe.B", (X, -8)),
                flame_at_scale=lerp(0.01, 1.0, fires),
                fire_at_scale=lerp(0.05, 1.0, fires),
            ),
            Vector((-0.36, 0.56, 0.09 + bounce * 0.004)),
            Vector((-0.3, -1, 0)),
        )

    def crouch(base, fires=1.0):
        """Low on bent knees, as a summon starts and a Rebirth gets up."""
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.04, -0.17)),
                spine=t("spine", (X, 30)),
                chest=t("chest", (X, 12)),
                neck=t("neck", (X, -16)),
                head=t("head", (X, -10)),
                thigh__L=t("thigh.L", (X, -70), (Y, -6)),
                shin__L=t("shin.L", (X, 96)),
                foot__L=t("foot.L", (X, -24)),
                thigh__R=t("thigh.R", (X, -50), (Y, 8)),
                shin__R=t("shin.R", (X, 106)),
                foot__R=t("foot.R", (X, -52)),
                upperarm__L=t("upperarm.L", (X, -10), (Y, -10)),
                robe__F=t("robe.F", (X, -40)),
                flame_at_scale=0.3 * fires,
                fire_at_scale=0.4 * fires,
            ),
            Vector((-0.2, -0.16, 0.36)),
            Vector((0, -0.3, 1)),
        )

    def raise_ladle(base):
        """Up again with the ladle high, and the fires blaze: the end of a summon and a Rebirth."""
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.01)),
                spine=t("spine", (X, -4)),
                chest=t("chest", (X, -8)),
                head=t("head", (X, -16), (Z, -10)),
                upperarm__L=t("upperarm.L", (X, -40), (Y, -50)),
                forearm__L=t("forearm.L", (X, -30)),
                flame_at_scale=1.4,
                fire_at_scale=1.3,
            ),
            Vector((-0.24, -0.06, 0.98)),
            Vector((0, -0.15, 1)),
        )

    def step(front, lift=0.0):
        """A heavy, rolling walk with the ladle as a staff; the pot hops after her."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return hold(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0.0, -0.035 + lift * 0.025)),
                hips=t("hips", (Z, -6 * front), (Y, 4 * front)),
                spine=t("spine", (X, 8), (Y, -5 * front)),
                chest=t("chest", (X, 0), (Z, -6 * front)),
                upperarm__L=t("upperarm.L", (X, -14 - 20 * front), (Y, -10)),
                robe__F=t("robe.F", (X, -20)),
                robe__B=t("robe.B", (X, 16)),
                pot_at_loc=at("pot", (0, 0, 0.04 * lift)),
                pot=t("pot", (Y, 8 * front * lift)),
                **{
                    f"thigh__{lead}": t(f"thigh.{lead}", (X, -40 + lift * 10)),
                    f"shin__{lead}": t(f"shin.{lead}", (X, 26 + lift * 30)),
                    f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                    f"thigh__{back}": t(f"thigh.{back}", (X, 18 - lift * 10)),
                    f"shin__{back}": t(f"shin.{back}", (X, 26 + lift * 20)),
                    f"foot__{back}": t(f"foot.{back}", (X, -14)),
                },
            ),
            Vector((-0.24, -0.12 + 0.06 * front, 0.5 + lift * 0.02)),
            Vector((0, -0.1 * front, 1)),
        )

    # The attack is ranged: she swings the ladle back over her shoulder and
    # flings the fire ball forward. The projectile leaves at 20% of the clip
    # (frame 6 of 30), so the bowl is empty from frame 6.
    def swing_back(base):
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.04)),
                hips=t("hips", (Z, -18)),
                spine=t("spine", (X, -8), (Z, -10)),
                chest=t("chest", (X, -10), (Z, -14)),
                head=t("head", (X, -8), (Z, 4)),
                upperarm__L=t("upperarm.L", (X, -70), (Y, -30)),
                forearm__L=t("forearm.L", (X, -20)),
                thigh__L=t("thigh.L", (X, -30), (Y, -8)),
                shin__L=t("shin.L", (X, 20)),
                flame_at_scale=1.5,
            ),
            Vector((-0.22, 0.14, 0.86)),
            Vector((0, 0.9, 0.5)),
        )

    def fling(base, flame=0.01):
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.06, -0.05)),
                hips=t("hips", (Z, 8)),
                spine=t("spine", (X, 16), (Z, 8)),
                chest=t("chest", (X, 8), (Z, 10)),
                neck=t("neck", (X, -14)),
                head=t("head", (X, -12)),
                upperarm__L=t("upperarm.L", (X, 20), (Y, -30)),
                forearm__L=t("forearm.L", (X, -30)),
                thigh__L=t("thigh.L", (X, -50), (Y, -8)),
                shin__L=t("shin.L", (X, 40)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 22), (Y, 8)),
                shin__R=t("shin.R", (X, 20)),
                foot__R=t("foot.R", (X, -24)),
                robe__F=t("robe.F", (X, -30)),
                robe__B=t("robe.B", (X, 30)),
                flame_at_scale=flame,
            ),
            Vector((-0.2, -0.27, 0.8)),
            Vector((0, -1, 0.35)),
        )

    def follow(base):
        return hold(
            pose(fling(base), flame_at_scale=0.01),
            Vector((-0.17, -0.27, 0.6)),
            Vector((0, -1, -0.2)),
        )

    clips = []
    # The idle: she hums and sways, and then stirs the pot twice round.
    idle = Clip("idle", 72, loop=True)
    idle.key(0, stand()).key(8, stand(0.6, 1, 1, 0.5)).key(16, stand(1, 0, -1, 1))
    idle.key(26, stir(0.0, 0.6))
    for frame, phase in ((32, 0.25), (38, 0.5), (44, 0.75), (50, 1.0), (54, 1.25)):
        idle.key(frame, stir(phase, 0.6))
    idle.key(62, stand(0.4, -1, 1, 0)).key(72, stand())
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, step(1, 1)).key(12, step(-1)).key(18, step(-1, 1)).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, swing_back(stand())).key(6, fling(stand(), 0.3)).key(7, fling(stand()))
    attack.key(11, follow(stand())).key(20, stand(flicker=-1)).key(24, pose(stand(), flame_at_scale=0.6)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(body()))
    death.key(26, fallen(body())).key(30, fallen(body(), 5)).key(36, fallen(body()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up
    # and the fires light again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(12, stagger(body())).key(20, fallen(body())).key(22, fallen(body(), 3))
    rebirth.key(32, crouch(body(), 0.3)).key(41, raise_ladle(body())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(body(), 0.0)).key(10, crouch(body(), 0.5))
    summon.key(17, raise_ladle(body())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "ember-shaman.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
