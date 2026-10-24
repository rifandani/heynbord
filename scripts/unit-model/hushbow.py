"""
Hushbow (`undead.hushbow`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a thin skeleton archer with dim
pale eyes, a ragged teal-grey hood and a short ragged cape over the
shoulders, a layered ragged tunic of grey-brown and teal rags, leather
straps and a belt, wrapped shins, bare bone feet and a big wrapped bow hung
with small bronze bells. The bells are wrapped in cloth, so they do not ring
(the "hush" bow). On his back a quiver full of bones (not arrows) goes up
over his right shoulder, and a small extra skull, a little skeleton friend,
peeks out of it. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/hushbow.glb`; then `bun unit-model:pack hushbow`
packs it for the game.

He holds the bow low in the left hand and an arrow in the right hand, its
head down, and he turns a little to his right, so the camera sees his chest,
the bow and the top of the quiver with the small skull. His idle is still:
he listens, with the skull tilted, and only the bells sway. His attack is a
standing shot as Thornline Archer does: he turns side-on, draws and lets go,
then takes the next arrow from the quiver on his back. His cast (Summon):
he takes a bone from the quiver, throws it down in front of him and shakes
the bow, and the small skull on his back pops up and chatters. He falls on
his front in the death, so the quiver does not go into the ground.
"""

import math
import os
import sys

from mathutils import Quaternion, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib

import unit_model_kit as kit

importlib.reload(kit)

from unit_model_kit import (
    Clip,
    Part,
    X,
    Y,
    Z,
    blend,
    clamp01,
    faces_of,
    hex_color,
    lerp,
    turn,
)

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e4d4b0")
BONE_DARK = hex_color("#ad9670")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#b8e6e8")
CAVITY = hex_color("#2c2a28")
HOOD = hex_color("#6c827c")
HOOD_DARK = hex_color("#4a5c58")
TUNIC = hex_color("#867d68")
TUNIC_DARK = hex_color("#575142")
RAG = hex_color("#5d7a69")
RAG_DARK = hex_color("#3e5346")
LEATHER = hex_color("#6e4628")
LEATHER_DARK = hex_color("#432a18")
WRAP = hex_color("#8c6c4a")
WRAP_DARK = hex_color("#644a32")
WOOD = hex_color("#5e3e24")
CLOTH = hex_color("#b9a684")
BRONZE = hex_color("#d8a042")
BRONZE_DARK = hex_color("#7e5824")
IRON = hex_color("#57524c")
SHAFT = hex_color("#b8a07a")
FLETCH = hex_color("#7e8c86")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.008, 0.86))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.054

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
GRIP_L = WL + DL * 0.025
HAND_R = WR + DR * 0.025

# A big bow with a deep, plain curve.
BOW_HALF = 0.33
BOW_SAG = 0.085
BOW_RECURVE = 0.12
# The string sits behind the grip by the brace height.
BRACE = BOW_SAG - (1 - 0.8) * BOW_RECURVE
STRING_P = GRIP_L + Vector((0, BRACE, 0))
ARROW_LENGTH = 0.32

# The quiver of bones goes across the back, from the left hip up over the
# right shoulder, so the camera sees its top and the small skull in it.
QUIVER_LOW = Vector((0.06, 0.085, 0.47))
QUIVER_TOP = Vector((-0.085, 0.1, 0.84))
QUIVER_UP = (QUIVER_TOP - QUIVER_LOW).normalized()
BUDDY_C = QUIVER_TOP + QUIVER_UP * 0.03 + Vector((-0.012, -0.022, 0))

# The bone that he throws in his cast lands here, in front of him on the
# camera side. At rest it is there with a scale of 0.
TOSS_P = Vector((-0.12, -0.22, 0.012))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("jaw", (0, -0.01, 0.825), (0, -0.07, 0.805), "head"),
    ("coat.B", (0, 0.07, 0.5), (0, 0.11, 0.18), "hips"),
    ("buddy", tuple(QUIVER_TOP - QUIVER_UP * 0.02), tuple(QUIVER_TOP + QUIVER_UP * 0.07), "chest"),
    ("buddy.jaw", tuple(BUDDY_C + Vector((0, -0.004, -0.012))), tuple(BUDDY_C + Vector((0, -0.04, -0.02))), "buddy"),
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
    ("bow", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("string", tuple(STRING_P), tuple(STRING_P + Vector((0, 0, 0.05))), "bow"),
    # The bells hang from the bow. The bone moves them a little, so they sway.
    ("bells", tuple(GRIP_L + Vector((0, -0.02, 0))), tuple(GRIP_L + Vector((0, -0.02, -0.08))), "bow"),
    # At rest the arrow hangs along the right hand. The attack aims it at the bow.
    ("arrow", tuple(HAND_R), tuple(HAND_R + DR * 0.1), "hand.R"),
    # The thrown bone has no parent but the root: a Copy Location puts it in
    # the right hand, and it falls free when he throws it.
    ("toss", tuple(TOSS_P), tuple(TOSS_P + Vector((0, 0, 0.05))), "root"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The ragged skirt follows the hips at the top, and the legs and its back panel lower."""
    t = clamp01((0.5 - co.z) / 0.28)
    back = clamp01((co.y - 0.0) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "coat.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.3),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.3),
    }


def string_weights(co):
    near = 1 - clamp01(abs(co.z - STRING_P.z) / BOW_HALF)
    return {"string": near, "bow": 1 - near}


# --- Parts ---------------------------------------------------------------------


def rag(part, base, direction, length, width, color):
    """A flat strip of rag: a cone squashed thin."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.002, 4, squash=0.3)
    part.paint(faces_of(verts), color)
    return verts


def long_bone(part, start, end, radius, color, knob_color=None):
    """A bone: a thin shaft with a knob at each end."""
    start, end = Vector(start), Vector(end)
    shaft = kit.cone(part.bm, start, end, radius, radius * 0.9, 5)
    part.paint(faces_of(shaft), color)
    across = (end - start).cross(Z if abs((end - start).normalized().z) < 0.9 else X).normalized()
    for point in (start, end):
        for sign in (1, -1):
            knob = kit.sphere(part.bm, point + across * radius * 0.9 * sign, (radius * 1.5,) * 3, 5, 3)
            part.paint(faces_of(knob), knob_color or color)


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.058, 0.064, 0.068), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.036 * sign, -0.048, -0.024)), (0.019, 0.017, 0.014), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.057, 0.02)), (0.09, 0.014, 0.012))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    sockets = Part("sockets", SOCKET, "head", shade=0)
    for sign in (1, -1):
        # Deep, calm sockets: he listens.
        kit.sphere(sockets.bm, HEAD_C + Vector((0.024 * sign, -0.055, 0.0)), (0.019, 0.012, 0.017), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.062, -0.024)), HEAD_C + Vector((0, -0.064, -0.008)), 0.01, 0.002, 4)
    teeth = kit.box(sockets.bm, HEAD_C + Vector((0, -0.057, -0.04)), (0.05, 0.01, 0.012))
    sockets.paint(faces_of(teeth), BONE_DARK)
    parts.append(sockets)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.024 * sign, -0.064, 0.0)), (0.006, 0.004, 0.006), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.034, 0.8), (0.044, 0.036, 0.02), 10, 6)
    lower = kit.box(jaw.bm, (0, -0.064, 0.812), (0.048, 0.008, 0.012))
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    # The ragged teal-grey hood: over the top and the back of the skull,
    # open at the face, with a point that falls back and torn flaps.
    hood = Part("hood", HOOD, "head", shade=0.14)
    verts = kit.sphere(hood.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.074, 0.08, 0.082), 12, 9)
    kit.bmesh.ops.delete(hood.bm, geom=[v for v in verts if v.co.y < -0.026 and v.co.z < HEAD_C.z + 0.05], context="VERTS")
    rim = kit.torus(hood.bm, HEAD_C + Vector((0, -0.032, 0.004)), (0, 1, -0.4), 0.07, 0.011, 14, 4)
    hood.paint(faces_of(rim), HOOD_DARK)
    tip = kit.cone(hood.bm, HEAD_C + Vector((0, 0.06, 0.05)), HEAD_C + Vector((0, 0.13, -0.02)), 0.04, 0.006, 6, squash=0.6)
    hood.paint(faces_of(tip), HOOD_DARK)
    # A soft peak on the top of the hood, bent back.
    peak = kit.cone(hood.bm, HEAD_C + Vector((0, 0.012, 0.07)), HEAD_C + Vector((0, 0.06, 0.125)), 0.042, 0.004, 8)
    hood.paint(faces_of(peak), HOOD)
    for index in range(6):
        a = math.radians(-90 + index * 36)
        top = HEAD_C + Vector((0.07 * math.sin(a), 0.06 * math.cos(a) + 0.02, -0.03))
        flap = kit.cone(hood.bm, top, top + Vector((0.025 * math.sin(a), 0.02, -0.09 - 0.03 * (index % 2))), 0.028, 0.004, 4, squash=0.45)
        hood.paint(faces_of(flap), HOOD_DARK if index % 2 else HOOD)
    parts.append(hood)
    return parts


def body_parts():
    parts = []
    # The open chest: a dark hollow behind bone ribs and a sternum.
    chest = Part("ribcage", CAVITY, torso_weights, shade=0.0)
    kit.cone(chest.bm, (0, 0.004, 0.5), (0, 0.004, 0.75), 0.058, 0.072, 10, squash=0.8)
    for index, z in enumerate((0.59, 0.63, 0.67)):
        width = 0.054 + 0.006 * index
        rib = kit.tube(chest.bm, [(-width, -0.03, z - 0.012), (-width * 0.55, -0.056, z), (0, -0.061, z + 0.006), (width * 0.55, -0.056, z), (width, -0.03, z - 0.012)], [0.006] * 5, 4)
        chest.paint(faces_of(rib), BONE)
    sternum = kit.cone(chest.bm, (0, -0.062, 0.58), (0, -0.064, 0.71), 0.008, 0.009, 5)
    chest.paint(faces_of(sternum), BONE_DARK)
    spine = kit.cone(chest.bm, (0, -0.028, 0.48), (0, -0.028, 0.57), 0.013, 0.013, 6)
    chest.paint(faces_of(spine), BONE)
    parts.append(chest)

    # The ragged tunic over the chest: grey-brown, open at the front.
    tunic = Part("tunic", TUNIC, torso_weights, shade=0.12)

    def tunic_color(row, column):
        if column in (0, 13):
            return TUNIC_DARK
        return TUNIC_DARK if (row + column) % 5 == 2 else TUNIC

    kit.ragged_cone(tunic, 0.76, 0.5, 0.084, 0.08, 14, 3, 0.8, 0.0, tunic_color, TUNIC_DARK, gap=math.radians(46))
    parts.append(tunic)

    # A short ragged cape over the shoulders, of the hood cloth.
    cape = Part("cape", HOOD, "chest", shade=0.1)

    def cape_color(row, column):
        return HOOD_DARK if column % 3 == 1 or row == 1 else HOOD

    kit.ragged_cone(cape, 0.79, 0.65, 0.05, 0.118, 16, 2, 0.84, 0.05, cape_color, HOOD_DARK, gap=math.radians(28))
    parts.append(cape)

    # The leather straps: the quiver strap from the right shoulder to the
    # left hip, a belt with a bronze buckle, and a lower belt with a pouch.
    straps = Part("straps", LEATHER, torso_weights, shade=0.05)
    strap = kit.tube(straps.bm, [(-0.08, -0.04, 0.74), (-0.04, -0.07, 0.66), (0.02, -0.074, 0.58), (0.07, -0.05, 0.51)], [0.008] * 4, 4)
    straps.paint(faces_of(strap), LEATHER_DARK)
    buckle = kit.box(straps.bm, (-0.03, -0.074, 0.645), (0.016, 0.006, 0.016))
    straps.paint(faces_of(buckle), BRONZE)
    parts.append(straps)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.52), 0.082, 0.08, 12, squash=0.8)
    lower = kit.cone(belt.bm, (0, 0, 0.45), (0, 0, 0.47), 0.086, 0.086, 12, squash=0.8)
    belt.paint(faces_of(lower), LEATHER_DARK)
    buckle = kit.box(belt.bm, (0.0, -0.068, 0.505), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), BRONZE)
    pouch = kit.box(belt.bm, (-0.074, -0.03, 0.44), (0.028, 0.032, 0.04))
    belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    pelvis = Part("pelvis", BONE, "hips")
    kit.cone(pelvis.bm, (0, 0, 0.43), (0, 0, 0.5), 0.058, 0.068, 10, squash=0.75)
    parts.append(pelvis)

    def skirt_color(row, column):
        if row >= 3:
            return RAG_DARK if column % 3 == 0 else RAG
        return TUNIC_DARK if column % 4 == 1 else TUNIC

    # The layered skirt to the knees: grey-brown at the top, teal rags lower,
    # open a little at the front, with a ragged hem.
    skirt = Part("skirt", TUNIC, skirt_weights)
    kit.ragged_cone(skirt, 0.5, 0.24, 0.086, 0.15, 16, 5, 0.8, 0.07, skirt_color, TUNIC_DARK, gap=math.radians(22), y_push=0.03)
    for index in range(7):
        angle = math.radians(-150 + index * 50)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0.01, 0.4)) + out * 0.11
        rag(skirt, base, out * 0.3 + Vector((0, 0.05, -1)), 0.13 + 0.03 * (index % 2), 0.026, (RAG, RAG_DARK, TUNIC_DARK)[index % 3])
    parts.append(skirt)
    return parts


def quiver_parts():
    """The quiver of bones on the back, and the small skull that peeks out of it."""
    parts = []
    quiver = Part("quiver", LEATHER, "chest", shade=0.1)
    kit.cone(quiver.bm, QUIVER_LOW, QUIVER_TOP, 0.03, 0.038, 8)
    rim = kit.torus(quiver.bm, QUIVER_TOP, QUIVER_UP, 0.038, 0.006, 10, 3)
    quiver.paint(faces_of(rim), LEATHER_DARK)
    for t in (0.25, 0.62):
        band = kit.cone(quiver.bm, QUIVER_LOW.lerp(QUIVER_TOP, t), QUIVER_LOW.lerp(QUIVER_TOP, t + 0.07), 0.035, 0.036, 8)
        quiver.paint(faces_of(band), WRAP)
    side = QUIVER_UP.cross(Y).normalized()
    # The bones stick up out of the quiver, behind the small skull.
    for dx, dy, length, lean in ((0.016, 0.014, 0.1, 0.2), (-0.012, 0.018, 0.12, -0.15), (0.0, 0.0, 0.085, 0.05), (0.02, -0.006, 0.075, 0.35)):
        foot = QUIVER_TOP + side * dx + Vector((0, dy, -0.02))
        direction = (QUIVER_UP + side * lean).normalized()
        long_bone(quiver, foot, foot + direction * length, 0.0055, BONE, BONE_DARK)
    parts.append(quiver)

    buddy = Part("buddy", BONE, "buddy", shade=0.1)
    kit.sphere(buddy.bm, BUDDY_C, (0.027, 0.029, 0.03), 10, 7)
    for sign in (1, -1):
        socket = kit.sphere(buddy.bm, BUDDY_C + Vector((0.011 * sign, -0.024, 0.002)), (0.009, 0.006, 0.009), 6, 4)
        buddy.paint(faces_of(socket), SOCKET)
        eye = kit.sphere(buddy.bm, BUDDY_C + Vector((0.011 * sign, -0.029, 0.002)), (0.003, 0.002, 0.003), 4, 3)
        buddy.paint(faces_of(eye), GLOW)
    parts.append(buddy)

    jaw = Part("buddy.jaw", BONE_DARK, "buddy.jaw", shade=0.05)
    kit.sphere(jaw.bm, BUDDY_C + Vector((0, -0.014, -0.022)), (0.019, 0.016, 0.009), 8, 4)
    parts.append(jaw)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, _t, d) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
        # A ragged sleeve over the shoulder, and bare bone arms.
        sleeve = Part(f"sleeve.{side}", HOOD, f"upperarm.{side}", shade=0.08)
        kit.sphere(sleeve.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.032, 0.032, 0.03), 8, 6)
        cuff = kit.cone(sleeve.bm, s, s + (e - s) * 0.45, 0.032, 0.03, 8)
        sleeve.paint(faces_of(cuff), HOOD_DARK)
        kit.cone(sleeve.bm, s, e, 0.013, 0.011, 6)
        knob = kit.sphere(sleeve.bm, e, (0.016, 0.016, 0.016), 6, 4)
        sleeve.paint(faces_of(knob), BONE_DARK)
        sleeve.paint([f for f in sleeve.bm.faces if f not in sleeve.face_colors and (f.calc_center_median() - s).length > 0.06], BONE)
        parts.append(sleeve)

        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.012, 0.011, 6)
        bracer = kit.cone(forearm.bm, e + d * 0.06, w - d * 0.006, 0.02, 0.018, 8)
        forearm.paint(faces_of(bracer), WRAP)
        for f in faces_of(bracer):
            if int(((f.calc_center_median() - e).length) * 120) % 2 == 0:
                forearm.paint([f], WRAP_DARK)
        parts.append(forearm)

        # A bony hand: a palm and three long fingers.
        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.018, (0.016, 0.013, 0.018), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.006 * index, -0.004, 0.004 * index))
            finger = kit.cone(hand.bm, w + d * 0.026 + offset, w + d * 0.05 + offset, 0.0045, 0.003, 4)
            hand.paint(faces_of(finger), BONE_DARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.017, 0.015, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.012, 0.006)), (0.022, 0.019, 0.022), 6, 5)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        # The shins are wrapped in brown cloth strips, from below the knee to the ankle.
        shin = Part(f"shin.{side}", WRAP, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee - Vector((0, 0, 0.02)), ankle + Vector((0, 0, 0.005)), 0.03, 0.026, 8)
        for f in faces_of(verts):
            if int(f.calc_center_median().z * 60) % 2 == 0:
                shin.paint([f], WRAP_DARK)
        end = rag(shin, knee + Vector((0.02 * sign, -0.018, -0.03)), (0.3 * sign, -0.2, -1), 0.07, 0.012, WRAP)
        shin.paint(faces_of(end), WRAP_DARK)
        parts.append(shin)

        # Bare bone feet, wrapped at the ankle, with long toes.
        foot = Part(f"foot.{side}", BONE, f"foot.{side}", shade=0.08)
        kit.box(foot.bm, (LEG_X * sign, -0.024, 0.02), (0.044, 0.072, 0.032))
        wrap = kit.box(foot.bm, (LEG_X * sign, -0.004, 0.034), (0.05, 0.04, 0.03))
        foot.paint(faces_of(wrap), WRAP_DARK)
        for index in (-1, 0, 1):
            toe = kit.cone(foot.bm, (LEG_X * sign + 0.013 * index, -0.056, 0.014), (LEG_X * sign + 0.016 * index, -0.09, 0.008), 0.0065, 0.005, 4)
            foot.paint(faces_of(toe), BONE_DARK)
        parts.append(foot)
    return parts


def bow_point(s):
    """A point on the bow at s = -1 (bottom tip) to 1 (top tip)."""
    hook = max(0.0, abs(s) - 0.8) / 0.2
    y = BOW_SAG * s * s - hook * hook * BOW_RECURVE * 0.2
    return GRIP_L + Vector((0, y, s * BOW_HALF * (1 - 0.05 * hook)))


BELLS = (0.36, 0.56, 0.76, -0.4, -0.62)


def bell_weights(top_z, length):
    def weights(co):
        down = clamp01((top_z - co.z) / length)
        return {"bow": 1 - down, "bells": down}

    return weights


def bow_parts():
    parts = []
    bow = Part("bow", WOOD, "bow", shade=0.05)
    steps = 18
    points = [bow_point(lerp(-1, 1, i / steps)) for i in range(steps + 1)]
    radii = [lerp(0.016, 0.007, abs(lerp(-1, 1, i / steps)) ** 1.5) for i in range(steps + 1)]
    verts = kit.tube(bow.bm, points, radii, 6)
    for face in faces_of(verts):
        s = (face.calc_center_median().z - GRIP_L.z) / BOW_HALF
        # The bow is wrapped with cloth in wide bands.
        if abs(s) < 0.14 or int((abs(s) + 0.02) * 9) % 2 == 1:
            bow.paint([face], CLOTH)
    # Rag strips that hang from the wraps.
    for s, x in ((0.18, -1), (-0.2, 1), (0.9, 1)):
        rag(bow, bow_point(s), Vector((0.2 * x, -0.4, -1)), 0.07, 0.012, (RAG, CLOTH, RAG_DARK)[int(s * 10) % 3])
    parts.append(bow)

    string = Part("string", CLOTH, string_weights, shade=0)
    top, bottom = bow_point(0.98), bow_point(-0.98)
    kit.tube(string.bm, [top, STRING_P, bottom], [0.0032] * 3, 4, caps=False)
    parts.append(string)

    # The small bronze bells on short cords, each one muffled with a cloth band.
    for index, s in enumerate(BELLS):
        attach = bow_point(s) + Vector((-0.01, -0.016, 0))
        cord_length = 0.02 + 0.01 * (index % 2)
        part = Part(f"bell{index}", BRONZE, bell_weights(attach.z, cord_length), shade=0.1)
        cord = kit.cone(part.bm, attach, attach - Z * cord_length, 0.0022, 0.0022, 3)
        part.paint(faces_of(cord), LEATHER_DARK)
        top_c = attach - Z * cord_length
        kit.sphere(part.bm, top_c - Z * 0.006, (0.009, 0.009, 0.008), 8, 4)
        kit.cone(part.bm, top_c - Z * 0.004, top_c - Z * 0.032, 0.01, 0.019, 8)
        band = kit.cone(part.bm, top_c - Z * 0.012, top_c - Z * 0.022, 0.0148, 0.0172, 8)
        part.paint(faces_of(band), HOOD_DARK)
        clapper = kit.sphere(part.bm, top_c - Z * 0.034, (0.005, 0.005, 0.005), 4, 3)
        part.paint(faces_of(clapper), BRONZE_DARK)
        parts.append(part)

    arrow = Part("arrow", SHAFT, "arrow", shade=0)
    tip = HAND_R + DR * ARROW_LENGTH
    kit.tube(arrow.bm, [HAND_R - DR * 0.02, tip], [0.0038, 0.0038], 4)
    head = kit.cone(arrow.bm, tip - DR * 0.008, tip + DR * 0.045, 0.013, 0.001, 4)
    arrow.paint(faces_of(head), IRON)
    fletch = kit.cone(arrow.bm, HAND_R - DR * 0.015, HAND_R + DR * 0.04, 0.003, 0.013, 3)
    arrow.paint(faces_of(fletch), FLETCH)
    parts.append(arrow)

    # The bone that he throws in his cast, lying on the ground at rest.
    toss = Part("toss", BONE, "toss", shade=0)
    long_bone(toss, TOSS_P - X * 0.05, TOSS_P + X * 0.05, 0.009, BONE, BONE_DARK)
    parts.append(toss)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("Hushbow", BONES)
    parts = head_parts() + body_parts() + quiver_parts() + limb_parts() + bow_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "HushbowMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole target.
POLE_ANGLE = -90
POLE_R = Vector((-0.05, 0.45, 0.85))


def add_controls(rig):
    """IK for the arms, and the constraints of the bow, the string, the arrow and the thrown bone."""
    empties = {
        "ik_hand.L": kit.add_empty("ik_hand.L", WL),
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "pole.L": kit.add_empty("pole.L", (0.25, -0.15, 0.7)),
        "pole.R": kit.add_empty("pole.R", POLE_R),
        "bow_aim": kit.add_empty("bow_aim"),
    }
    bones = rig.pose.bones
    for side in ("L", "R"):
        ik = bones[f"forearm.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = empties[f"ik_hand.{side}"]
        ik.pole_target = empties[f"pole.{side}"]
        ik.pole_angle = math.radians(POLE_ANGLE)
        ik.chain_count = 2
    aim = bones["bow"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["bow_aim"]
    draw = bones["string"].constraints.new("COPY_LOCATION")
    draw.name = "Draw"
    draw.target = rig
    draw.subtarget = "hand.R"
    draw.head_tail = 0.5
    nock = bones["arrow"].constraints.new("DAMPED_TRACK")
    nock.name = "Nock"
    nock.target = rig
    nock.subtarget = "bow"
    nock.head_tail = 0.0
    hold = bones["toss"].constraints.new("COPY_LOCATION")
    hold.name = "Hold"
    hold.target = rig
    hold.subtarget = "hand.R"
    hold.head_tail = 0.5
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

    bow_rest = rig.data.bones["bow"].matrix_local.to_quaternion()
    # At rest the bow stands nearly upright, its top a little forward.
    rest_aim = Quaternion(X, math.radians(12)) @ bow_rest

    def stand(breath=0.0, sway=0.0, listen=0.0):
        """
        The idle stance: still and a little turned to his right, the bow low
        in the left hand and the arrow in the right hand, head down. `listen`
        tilts the skull to the camera side, and `sway` swings the bells and
        turns the small skull on his back.
        """
        return {
            "hips": t("hips", (Z, -10)),
            "spine": t("spine", (X, 3 + breath * 0.5)),
            "chest": t("chest", (X, -1 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, 4), (Z, -4 - listen * 4)),
            "head": t("head", (X, 6 + breath), (Z, -6 - listen * 10), (Y, -6 - listen * 10)),
            "jaw": t("jaw", (X, 3)),
            "buddy": t("buddy", (Z, -10 + sway * 22), (X, 4 - listen * 6)),
            "buddy.jaw": t("buddy.jaw", (X, 4)),
            "upperarm.L": t("upperarm.L", (Y, 10 + breath), (X, -10)),
            "forearm.L": t("forearm.L", (X, -30)),
            "hand.L": t("hand.L", (X, 12)),
            "upperarm.R": t("upperarm.R", (Y, -6 - breath), (X, -8)),
            "forearm.R": t("forearm.R", (X, -24)),
            "hand.R": t("hand.R", (X, 70), (Z, 10)),
            "coat.B": t("coat.B", (X, 2 + breath * 2)),
            "thigh.L": t("thigh.L", (X, -6), (Y, -3)),
            "shin.L": t("shin.L", (X, 6)),
            "thigh.R": t("thigh.R", (X, 4), (Y, 3)),
            "foot.R": t("foot.R", (Z, 10)),
            "bells@loc": at("bells", (0.006 * sway, -0.003 * abs(sway), 0)),
            "arrow@scale": 1.0,
            "arrow/Nock": 0.0,
            "toss@scale": 0.0,
            "toss/Hold": 0.0,
            "bow/Aim": 1.0,
            "bow_aim@rot": rest_aim,
            "pole.R@pos": POLE_R,
        }

    def crouch(base):
        """Down on both knees bent, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.135)),
            thigh__L=t("thigh.L", (X, -50), (Y, -4)),
            shin__L=t("shin.L", (X, 95)),
            foot__L=t("foot.L", (X, -45)),
            thigh__R=t("thigh.R", (X, -50), (Y, 4)),
            shin__R=t("shin.R", (X, 95)),
            foot__R=t("foot.R", (X, -45)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 22)),
            jaw=t("jaw", (X, 14)),
            buddy=t("buddy", (X, 20)),
            upperarm__L=t("upperarm.L", (Y, 18), (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, -20)),
            forearm__R=t("forearm.R", (X, -30)),
            coat__B=t("coat.B", (X, -25)),
        )

    def slump(breath=0.0):
        """Low HP: bent over and he leans on the bow, the arrow hangs from the right hand and the small skull sinks in the quiver."""
        return pose(
            stand(),
            bow_aim_at_rot=Quaternion(X, math.radians(26)) @ Quaternion(Y, math.radians(-8)) @ bow_rest,
            hips_at_loc=at("hips", (0, 0, -0.02)),
            spine=t("spine", (X, 12 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2), (Z, 6)),
            neck=t("neck", (X, 8)),
            head=t("head", (X, 6 + breath * 4), (Y, -10)),
            jaw=t("jaw", (X, 10 + breath * 6)),
            buddy=t("buddy", (X, 30), (Z, 10)),
            buddy_at_loc=at("buddy", (0, 0, -0.02)),
            upperarm__L=t("upperarm.L", (Y, 12), (X, -6)),
            forearm__L=t("forearm.L", (X, -40)),
            hand__L=t("hand.L", (X, 20)),
            upperarm__R=t("upperarm.R", (Y, -4), (X, 18)),
            forearm__R=t("forearm.R", (X, -6)),
            hand__R=t("hand.R", (X, -5), (Z, 10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 26)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -8), (Y, 4)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -10)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the jaw drops."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -14 * amount), (Z, 8 * amount)),
            jaw=t("jaw", (X, 22 * amount)),
            buddy=t("buddy", (X, -24 * amount)),
            buddy__jaw=t("buddy.jaw", (X, 30 * amount)),
            upperarm__L=t("upperarm.L", (Y, -10 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, 18 * amount), (X, 10 * amount)),
            forearm__R=t("forearm.R", (X, -40 * amount)),
            coat__B=t("coat.B", (X, 10 * amount)),
            bells_at_loc=at("bells", (-0.008 * amount, 0.006 * amount, 0)),
        )

    def fallen(base, bounce=0.0):
        """Flat on his front, the skull to the camera side, the bow flat on the ground beside him."""
        return pose(
            base,
            bow_slash_Aim=1.0,
            bow_aim_at_rot=Quaternion(X, math.radians(90)) @ bow_rest,
            root=t("root", (X, 84 - bounce)),
            root_at_loc=at("root", (0, 0.16, 0.07)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (Z, 0)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -30), (Z, -60)),
            jaw=t("jaw", (X, 26)),
            buddy=t("buddy", (X, -40), (Z, -30)),
            buddy__jaw=t("buddy.jaw", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, 30)),
            forearm__L=t("forearm.L", (X, -10)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -50)),
            forearm__R=t("forearm.R", (X, -30)),
            thigh__L=t("thigh.L", (X, 4), (Y, -8)),
            shin__L=t("shin.L", (X, 4)),
            foot__L=t("foot.L", (X, 70)),
            thigh__R=t("thigh.R", (X, -2), (Y, 10)),
            shin__R=t("shin.R", (X, 12)),
            foot__R=t("foot.R", (X, 60)),
            coat__B=t("coat.B", (X, -40)),
            arrow_at_scale=0.0,
        )

    def stagger(base):
        """He drops to the knees, and the upper body tips forward."""
        return pose(
            base,
            bow_slash_Aim=0.0,
            hips_at_loc=at("hips", (0, 0.01, -0.1)),
            thigh__L=t("thigh.L", (X, -40)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, -30)),
            thigh__R=t("thigh.R", (X, -30)),
            shin__R=t("shin.R", (X, 70)),
            foot__R=t("foot.R", (X, -30)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 20)),
            jaw=t("jaw", (X, 24)),
            buddy=t("buddy", (X, 30)),
            upperarm__L=t("upperarm.L", (Y, 10), (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, -20)),
            hand__L=t("hand.L", (X, 30)),
        )

    def ready(base):
        """Up again, the bow high, the small skull up: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.008)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, 16)),
            buddy=t("buddy", (X, -10)),
            buddy_at_loc=at("buddy", (0, 0, 0.025)),
            buddy__jaw=t("buddy.jaw", (X, 24)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, 6)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -20)),
            coat__B=t("coat.B", (X, 10)),
            bells_at_loc=at("bells", (0.0, 0.01, 0)),
        )

    def step(front):
        """A quiet, light step. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.012)),
            spine=t("spine", (X, 8)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -6), (X, -8 - 12 * front)),
                "upperarm__L": t("upperarm.L", (Y, 10), (X, -10 + 6 * front)),
                "buddy": t("buddy", (Y, 8 * front), (Z, -10)),
                "coat__B": t("coat.B", (X, 8), (Y, 4 * front)),
                "bells_at_loc": at("bells", (0.006 * front, 0.004, 0)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.008)),
            spine=t("spine", (X, 8)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "buddy_at_loc": at("buddy", (0, 0, 0.006)),
                "coat__B": t("coat.B", (X, 4)),
                "bells_at_loc": at("bells", (0, -0.004, 0)),
            },
        )

    # The attack: he turns side-on, draws to the jaw and lets go. The arrow
    # effect leaves at 20% of the attack (`FLIGHT_START` in fx.ts), so the
    # string is released at frame 6 of 30.
    def stance(base):
        return pose(
            base,
            hips=t("hips", (Z, -40)),
            spine=t("spine", (Z, -20)),
            chest=t("chest", (Z, -15), (X, -4)),
            neck=t("neck", (Z, 0)),
            head=t("head", (Z, 58), (X, -4)),
            buddy=t("buddy", (Z, 40), (X, -6)),
            thigh__L=t("thigh.L", (Z, 30), (Y, -8)),
            thigh__R=t("thigh.R", (Z, 30), (Y, 8)),
            foot__R=t("foot.R", (Z, 0)),
        )

    aim_q = Quaternion(Y, math.radians(-8)) @ bow_rest
    bow_wrist = Vector((0.03, -0.34, 0.78))
    # The right hand at the top of the quiver, over the right shoulder.
    quiver_hand = Vector((-0.1, 0.07, 0.9))
    quiver_pole = Vector((-0.45, -0.2, 0.75))

    def aiming(base, right, draw, arrow=1.0, bells=(0.0, 0.0)):
        return pose(
            stance(base),
            forearm__L_slash_IK=1.0, forearm__R_slash_IK=1.0, bow_slash_Aim=1.0, string_slash_Draw=draw, arrow_slash_Nock=1.0, arrow_at_scale=arrow, ik_hand__L_at_pos=bow_wrist, ik_hand__R_at_pos=Vector(right), bow_aim_at_rot=aim_q, bells_at_loc=at("bells", (bells[0], bells[1], 0)),
        )

    def reach(base, arrow=0.0):
        """The right hand at the top of the quiver, to take an arrow or a bone."""
        return pose(
            base,
            forearm__R_slash_IK=1.0, ik_hand__R_at_pos=quiver_hand, pole__R_at_pos=quiver_pole, arrow_at_scale=arrow, head=t("head", (Z, -24), (X, 2)), buddy=t("buddy", (Z, -30), (X, -16)), buddy_at_loc=at("buddy", (0, 0, 0.012)),
        )

    clips = []
    # The idle is still: he listens, the skull tilts, and only the bells sway.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, listen in ((0, 0, 0, 0), (12, 0.5, 1, 0.6), (24, 1, 0, 1), (36, 0.5, -1, 0.6), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, listen))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    nocked = (0.03, -0.3, 0.78)
    drawn = (0.035, -0.06, 0.8)
    loose = (0.04, 0.0, 0.82)
    attack.key(0, stand())
    attack.key(2, aiming(stand(), nocked, 1.0))
    attack.key(6, aiming(stand(), drawn, 1.0))
    attack.key(7, aiming(stand(), loose, 0.0, 0.0, (0.0, 0.012)))
    attack.key(10, aiming(stand(), (0.045, 0.02, 0.8), 0.0, 0.0, (0.0, -0.01)))
    attack.key(14, aiming(stand(), (0.045, 0.02, 0.8), 0.0, 0.0, (0.0, 0.004)))
    # He takes the next arrow from the quiver on his back as he lowers the bow.
    attack.key(21, reach(stand()))
    attack.key(26, stand())
    attack.key(30, stand())
    clips.append(attack)

    # The cast (Summon): he takes a bone from the quiver, throws it down in
    # front of him and shakes the bow; the small skull pops up and chatters.
    # The bone lies on the ground and sinks as the skeleton rises.
    def lift(base):
        """The bone high in the right hand, the body back, ready to throw."""
        return pose(
            base,
            forearm__R_slash_IK=1.0, ik_hand__R_at_pos=Vector((-0.3, -0.06, 0.86)), pole__R_at_pos=Vector((-0.3, 0.35, 0.4)), arrow_at_scale=0.0, toss_at_scale=1.0, toss_slash_Hold=1.0, hips_at_loc=at("hips", (0, 0.01, 0.004)), spine=t("spine", (X, -6)), chest=t("chest", (X, -8), (Z, -12)), head=t("head", (X, -6), (Z, -20)), jaw=t("jaw", (X, 14)), buddy=t("buddy", (Z, -20), (X, -20)), buddy_at_loc=at("buddy", (0, 0, 0.03)), buddy__jaw=t("buddy.jaw", (X, 30)), thigh__L=t("thigh.L", (X, -14)), thigh__R=t("thigh.R", (X, 10)),
        )

    def throw(base, spin):
        """The arm comes down in front, and the bone flies to the ground."""
        return pose(
            base,
            forearm__R_slash_IK=1.0, ik_hand__R_at_pos=Vector((-0.16, -0.22, 0.48)), pole__R_at_pos=Vector((-0.3, 0.35, 0.4)), arrow_at_scale=0.0, toss_at_scale=1.0, toss=t("toss", (Y, spin), (Z, 30)), hips_at_loc=at("hips", (0, -0.01, -0.03)), spine=t("spine", (X, 18)), chest=t("chest", (X, 10), (Z, -8)), head=t("head", (X, 20), (Z, -16)), jaw=t("jaw", (X, 22)), buddy=t("buddy", (Z, -30), (X, 10)), buddy_at_loc=at("buddy", (0, 0, 0.03)), thigh__L=t("thigh.L", (X, -28)), shin__L=t("shin.L", (X, 26)), thigh__R=t("thigh.R", (X, 14)), shin__R=t("shin.R", (X, 14)),
        )

    def shake(base, beat, sink=0.0):
        """He shakes the bow up in front of him, and the small skull chatters."""
        return pose(
            base,
            forearm__L_slash_IK=1.0, ik_hand__L_at_pos=Vector((0.1, -0.24, 0.72 + 0.02 * beat)), bow_aim_at_rot=Quaternion(Y, math.radians(-14 * beat)) @ Quaternion(X, math.radians(6)) @ bow_rest, bells_at_loc=at("bells", (0.01 * beat, -0.006, 0)), arrow_at_scale=0.0, toss_at_scale=1.0 - sink, toss_at_loc=at("toss", (0, 0, -0.01 * sink)), toss=t("toss", (Y, 180)), hips_at_loc=at("hips", (0, 0, -0.012)), spine=t("spine", (X, 10)), chest=t("chest", (X, 4), (Z, -6)), head=t("head", (X, 18), (Z, -14), (Y, -8 * beat)), jaw=t("jaw", (X, 6 + 14 * abs(beat))), buddy=t("buddy", (Z, -24 + 14 * beat), (X, -10)), buddy_at_loc=at("buddy", (0, 0, 0.032)), buddy__jaw=t("buddy.jaw", (X, 6 + 30 * (beat > 0))), thigh__L=t("thigh.L", (X, -20)), shin__L=t("shin.L", (X, 18)),
        )

    cast = Clip("cast", 36)
    cast.key(0, stand())
    cast.key(5, pose(reach(stand()), toss_slash_Hold=1.0))
    cast.key(7, pose(reach(stand()), toss_at_scale=1.0, toss_slash_Hold=1.0))
    cast.key(11, lift(stand()))
    cast.key(14, pose(throw(stand(), 90), toss_slash_Hold=1.0))
    cast.key(17, throw(stand(), 180))
    cast.key(20, shake(stand(), 1))
    cast.key(23, shake(stand(), -1))
    cast.key(26, shake(stand(), 1, 0.3))
    cast.key(29, shake(stand(), -1, 0.8))
    cast.key(31, pose(shake(stand(), 0, 1.0), toss_at_scale=0.0))
    cast.key(36, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(12, stagger(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, ready(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0, -0.06))))
    summon.key(17, ready(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "hushbow.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
