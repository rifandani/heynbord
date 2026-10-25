"""
Graveyard Drudge (`undead.graveyardDrudge`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a big, hunched skeleton
gravedigger with a bare skull, a rusty shoulder guard on his right shoulder,
a ragged teal hood down on his back and a teal scarf, a ragged brown tunic
and skirt with pale rags, a belt with pouches and a ring of keys, wrapped
boots and a big spade with a long handle. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/graveyard-drudge.glb`;
then `bun unit-model:pack graveyard-drudge` packs it for the game.

He leans on the spade with both hands. The spade is on his right side, on
the camera side, and its blade digs into the ground in front of his right
foot. The face of the blade turns to the sides, so the camera sees it, and
the edge cuts down when he chops. The right hand holds the shaft low and
drives the spade with IK and a Copy Rotation. The left hand stays on the top
of the handle with IK to a grip bone of the spade. A clod of mud has a bone
on the blade: in the idle he digs, and he flicks the clod up and away. He has
Heavy, so he is broad, and his walk is a slow trudge. His attack lifts the
spade up over his right shoulder and chops it down on the target. In the
death he falls on his back, and the spade falls beside him. Heavy and Swarm
do not need his own action, so he has no cast clip.
"""

import math
import os
import sys

from mathutils import Matrix, Vector

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
    panel,
    turn,
)

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
CAVITY = hex_color("#2c2a28")
RUST = hex_color("#94603a")
RUST_DARK = hex_color("#5e3c24")
TEAL = hex_color("#5f837d")
TEAL_DARK = hex_color("#3f5a56")
TUNIC = hex_color("#7a5a3c")
TUNIC_DARK = hex_color("#54402c")
RAG = hex_color("#b9a27a")
RAG_DARK = hex_color("#8c7a5a")
LEATHER = hex_color("#5c3c24")
LEATHER_DARK = hex_color("#3c2616")
WRAP = hex_color("#cdb98c")
IRON = hex_color("#4f4b47")
IRON_DARK = hex_color("#33302d")
STEEL = hex_color("#a59d8e")
IRON_BLADE = hex_color("#6f6a63")
BRASS = hex_color("#b08440")
WOOD = hex_color("#7a5636")
WOOD_DARK = hex_color("#573c24")
MUD = hex_color("#5a3c26")
MUD_DARK = hex_color("#3e2a1a")

# --- Proportions ---------------------------------------------------------------

# A big, broad figure with short, thick legs.
HIP_Z = 0.44
WAIST_Z = 0.52
CHEST_Z = 0.61
SHOULDER_Z = 0.71
NECK_Z = 0.745
HEAD_C = Vector((0, -0.016, 0.85))
KNEE_Z = 0.25
ANKLE_Z = 0.06
LEG_X = 0.078
UPPER_ARM = 0.17
FOREARM = 0.16


def bend(shoulder, wrist, out):
    """The elbow between `shoulder` and `wrist`, bent toward `out`."""
    d = wrist - shoulder
    length = d.length
    along = (UPPER_ARM**2 - FOREARM**2 + length**2) / (2 * length)
    height = math.sqrt(max(UPPER_ARM**2 - along**2, 0.0))
    side = Vector(out) - d.normalized() * Vector(out).dot(d.normalized())
    return shoulder + d.normalized() * along + side.normalized() * height


# The spade points down and forward, its blade in the ground in front of the
# right foot. The right hand holds the shaft low, and the left hand holds the
# top of the handle. These are the rest (bind) positions.
SPADE = Vector((-0.03, -0.3, -1)).normalized()
SR = Vector((-0.16, 0, SHOULDER_Z))
WR = Vector((-0.13, -0.15, 0.49))
ER = bend(SR, WR, (-1, 0.6, -0.2))
DR = (WR - ER).normalized()
TR = WR + DR * 0.04
GRIP_R = WR + DR * 0.022
# The left hand is up the shaft from the right hand.
TOP_GRIP = 0.17
GRIP_L = GRIP_R - SPADE * TOP_GRIP
SL = Vector((0.16, 0, SHOULDER_Z))
WL = GRIP_L
EL = bend(SL, WL, (0.3, -0.3, -1))
TL = WL + (WL - EL).normalized() * 0.04
# Along the shaft from the right hand: the top of the handle, the socket of
# the blade and the tip of the blade.
SHAFT_TOP = 0.25
SOCKET_AT = 0.31
BLADE = 0.17
# Across the shaft, in the plane of the shaft and the up axis: the blade is
# flat in this plane, so its face turns to the sides (to the camera).
SIDE = SPADE.cross(X).normalized()
FACE = SPADE.cross(SIDE).normalized()
# The clod of mud sits on the camera side of the blade face.
CLOD = GRIP_R + SPADE * (SOCKET_AT + 0.07) + FACE * 0.026

# The ring of keys hangs at the right hip, on the camera side.
KEYS = Vector((-0.1, -0.06, 0.44))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.78), "chest"),
    ("head", (0, 0, 0.78), (0, 0, 0.95), "neck"),
    ("jaw", (0, -0.01, 0.81), (0, -0.07, 0.79), "head"),
    ("hood", (0, 0.07, 0.76), (0, 0.11, 0.6), "chest"),
    ("skirt.B", (0, 0.08, 0.44), (0, 0.11, 0.22), "hips"),
    ("keys", tuple(KEYS), tuple(KEYS - Vector((0, 0, 0.06))), "hips"),
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
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.09, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("spade", tuple(GRIP_R), tuple(GRIP_R + SPADE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L - SPADE * 0.05), "spade"),
    ("clod", tuple(CLOD), tuple(CLOD + Z * 0.04), "spade"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.47, 0.55)
    return blend("spine", "chest", co.z, 0.58, 0.65)


def skirt_weights(co):
    """The skirt follows the hips at the top, the thighs in front and its back panel behind."""
    t = clamp01((0.45 - co.z) / 0.22)
    back = clamp01((co.y - 0.02) / 0.08)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "skirt.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.5),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.5),
    }


def hood_weights(co):
    """The hood hangs down his back: the chest holds its top, its own bone the rest."""
    return blend("hood", "chest", co.z, 0.62, 0.74)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    # A big, bare skull with a heavy brow and wide cheek bones.
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.068, 0.074, 0.074), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.044 * sign, -0.052, -0.024)), (0.024, 0.02, 0.017), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.064, 0.02)), (0.106, 0.016, 0.016))
    skull.paint(faces_of(brow), BONE_DARK)
    # A crack on the top of the skull, on the camera side.
    crack = kit.tube(skull.bm, [HEAD_C + Vector((-0.02, -0.03, 0.07)), HEAD_C + Vector((-0.04, 0.0, 0.064)), HEAD_C + Vector((-0.05, 0.03, 0.05))], [0.004, 0.004, 0.003], 4)
    skull.paint(faces_of(crack), BONE_DARK)
    parts.append(skull)

    sockets = Part("sockets", SOCKET, "head", shade=0)
    for sign in (1, -1):
        # Deep, tired sockets.
        kit.sphere(sockets.bm, HEAD_C + Vector((0.027 * sign, -0.062, 0.0)), (0.021, 0.012, 0.019), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.07, -0.024)), HEAD_C + Vector((0, -0.072, -0.008)), 0.011, 0.002, 4)
    teeth = kit.box(sockets.bm, HEAD_C + Vector((0, -0.064, -0.042)), (0.062, 0.01, 0.014))
    sockets.paint(faces_of(teeth), BONE_DARK)
    parts.append(sockets)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.027 * sign, -0.072, 0.0)), (0.007, 0.004, 0.007), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.038, 0.79), (0.054, 0.042, 0.024), 10, 6)
    lower = kit.box(jaw.bm, (0, -0.074, 0.802), (0.06, 0.008, 0.012))
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)
    return parts


def body_parts():
    parts = []
    hollow = Part("hollow", CAVITY, torso_weights, shade=0.0)
    kit.cone(hollow.bm, (0, 0.006, 0.44), (0, 0.006, 0.74), 0.08, 0.09, 10, squash=0.8)
    # Two ribs and the sternum show at the open neck of the tunic.
    for index, z in enumerate((0.69, 0.72)):
        width = 0.07 + 0.006 * index
        rib = kit.tube(hollow.bm, [(-width, -0.04, z - 0.014), (-width * 0.55, -0.084, z), (0, -0.09, z + 0.006), (width * 0.55, -0.084, z), (width, -0.04, z - 0.014)], [0.007] * 5, 4)
        hollow.paint(faces_of(rib), BONE)
    sternum = kit.cone(hollow.bm, (0, -0.09, 0.66), (0, -0.092, 0.74), 0.009, 0.01, 5)
    hollow.paint(faces_of(sternum), BONE_DARK)
    parts.append(hollow)

    # The ragged brown tunic over a broad chest, open in a V at the neck,
    # with pale rags sewn on.
    tunic = Part("tunic", TUNIC, torso_weights, shade=0.14)

    def tunic_color(row, column):
        if column in (0, 13):
            return TUNIC_DARK
        if (row + column * 3) % 7 == 2:
            return RAG
        return TUNIC_DARK if (row + column) % 5 == 1 else TUNIC

    kit.ragged_cone(tunic, 0.7, 0.44, 0.104, 0.118, 14, 3, 0.82, 0.0, tunic_color, TUNIC_DARK, gap=math.radians(22))
    parts.append(tunic)

    # The teal scarf round the neck, with a long ragged end down the front.
    scarf = Part("scarf", TEAL, torso_weights, shade=0.08)
    kit.torus(scarf.bm, (0, 0.0, 0.73), (0, 0.2, 1), 0.08, 0.022, 12, 5)
    end = kit.tube(scarf.bm, [(-0.05, -0.08, 0.72), (-0.062, -0.104, 0.64), (-0.058, -0.112, 0.56), (-0.07, -0.106, 0.5)], [0.022, 0.024, 0.02, 0.012], 5)
    scarf.paint(faces_of(end), TEAL_DARK)
    for index in range(3):
        rag = kit.cone(scarf.bm, (-0.06 + 0.012 * index, -0.11, 0.53), (-0.07 + 0.02 * index, -0.12, 0.47 - 0.012 * index), 0.008, 0.002, 4, squash=0.5)
        scarf.paint(faces_of(rag), TEAL_DARK if index % 2 else TEAL)
    parts.append(scarf)

    # The hood, down on his back: a heap of teal cloth with ragged ends.
    hood = Part("hood", TEAL, hood_weights, shade=0.16)
    verts = kit.sphere(hood.bm, (0, 0.07, 0.71), (0.085, 0.05, 0.06), 10, 7)
    for face in faces_of(verts):
        if face.calc_center_median().z < 0.69:
            hood.paint([face], TEAL_DARK)
    for index in range(5):
        a = math.radians(-60 + index * 30)
        top = Vector((0.075 * math.sin(a), 0.09 + 0.02 * math.cos(a), 0.69))
        flap = kit.cone(hood.bm, top, top + Vector((0.02 * math.sin(a), 0.02, -0.14 - 0.03 * (index % 2))), 0.032, 0.006, 5, squash=0.45)
        hood.paint(faces_of(flap), TEAL_DARK if index % 2 else TEAL)
    parts.append(hood)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.45), (0, 0, 0.49), 0.118, 0.116, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0.02, -0.096, 0.47), (0.034, 0.01, 0.03))
    belt.paint(faces_of(buckle), IRON)
    # Pouches: a big one at the front, one at each side.
    for center, size in (((0.06, -0.09, 0.43), (0.04, 0.03, 0.05)), ((-0.115, 0.0, 0.43), (0.03, 0.05, 0.052)), ((0.11, 0.03, 0.43), (0.03, 0.044, 0.044))):
        pouch = kit.box(belt.bm, center, size)
        belt.paint(faces_of(pouch), LEATHER_DARK)
        flap = kit.box(belt.bm, Vector(center) + Vector((0, 0, size[2] * 0.4)), (size[0] * 1.08, size[1] * 1.08, size[2] * 0.24))
        belt.paint(faces_of(flap), LEATHER)
    parts.append(belt)

    pelvis = Part("pelvis", BONE, "hips")
    kit.cone(pelvis.bm, (0, 0, 0.4), (0, 0, 0.46), 0.075, 0.09, 10, squash=0.75)
    parts.append(pelvis)

    def skirt_color(row, column):
        if row >= 4:
            return RAG if column % 3 == 0 else TUNIC_DARK
        if column % 5 == 3:
            return RAG
        return TUNIC_DARK if column % 3 == 1 else TUNIC

    # The ragged skirt to the knees, wide, with long torn strips.
    skirt = Part("skirt", TUNIC, skirt_weights, shade=0.12)
    kit.ragged_cone(skirt, 0.47, 0.2, 0.116, 0.17, 16, 5, 0.8, 0.08, skirt_color, TUNIC_DARK, y_push=0.03)
    parts.append(skirt)

    # A large iron ring of keys at the right hip, its face to the camera.
    keys = Part("keys", IRON, "keys", shade=0.05)
    ring_c = KEYS + Vector((-0.02, 0, -0.03))
    kit.torus(keys.bm, ring_c, (1, -0.3, 0), 0.032, 0.005, 14, 4)
    for index, angle in enumerate((-50, -15, 20, 55)):
        a = math.radians(angle)
        top = ring_c + Vector((-0.004, 0.032 * math.sin(a) * 0.95, -0.032 * math.cos(a)))
        down = Vector((-0.05, 0.3 * math.sin(a), -1)).normalized()
        length = 0.048 + 0.012 * (index % 2)
        shank = kit.cone(keys.bm, top, top + down * length, 0.0045, 0.0045, 4)
        keys.paint(faces_of(shank), IRON_DARK if index % 2 else IRON)
        bit = kit.box(keys.bm, top + down * (length - 0.008) + Vector((0, -0.008, 0)), (0.004, 0.012, 0.012))
        keys.paint(faces_of(bit), IRON_DARK)
        bow = kit.torus(keys.bm, top + down * 0.007, (1, -0.3, 0), 0.009, 0.003, 8, 3)
        keys.paint(faces_of(bow), BRASS if index == 1 else IRON)
    hook = kit.cone(keys.bm, KEYS + Vector((0, 0, 0.02)), ring_c + Vector((0, 0, 0.03)), 0.006, 0.006, 4)
    keys.paint(faces_of(hook), LEATHER_DARK)
    parts.append(keys)
    return parts


def limb_parts():
    parts = []
    # A big rusty shoulder guard on the right shoulder (the camera side),
    # in two plates, with a strap across the chest.
    guard = Part("pauldron", RUST, "upperarm.R", shade=0.12)
    top = kit.sphere(guard.bm, SR + Vector((-0.012, 0, 0.016)), (0.066, 0.064, 0.044), 12, 7)
    guard.paint({f for v in top if v.co.z < SR.z - 0.004 for f in v.link_faces}, RUST_DARK)
    lower = kit.sphere(guard.bm, SR + Vector((-0.03, 0, -0.024)), (0.054, 0.056, 0.03), 10, 6)
    guard.paint({f for v in lower if v.co.z < SR.z - 0.034 for f in v.link_faces}, RUST_DARK)
    for offset in ((-0.04, -0.044, 0.04), (-0.062, 0.02, 0.03), (-0.03, 0.05, 0.044)):
        rivet = kit.sphere(guard.bm, SR + Vector(offset), (0.008, 0.008, 0.008), 4, 3)
        guard.paint(faces_of(rivet), STEEL)
    parts.append(guard)
    strap = Part("strap", LEATHER_DARK, "chest", shade=0.05)
    kit.tube(strap.bm, [(-0.11, -0.07, 0.71), (-0.04, -0.106, 0.66), (0.05, -0.1, 0.6), (0.1, -0.04, 0.58)], [0.009, 0.01, 0.01, 0.009], 4)
    parts.append(strap)

    # A teal rag over the left shoulder.
    # It follows the shoulder, not the arm, as the arm crosses the chest.
    drape = Part("drape", TEAL, "shoulder.L", shade=0.12)
    kit.sphere(drape.bm, SL + Vector((0.01, 0.004, 0.012)), (0.05, 0.05, 0.03), 8, 6)
    for index, (dx, dy) in enumerate(((0.03, -0.03), (0.04, 0.01), (0.03, 0.04))):
        rag = kit.cone(drape.bm, SL + Vector((dx, dy, 0.0)), SL + Vector((dx + 0.012, dy, -0.09 - 0.02 * (index % 2))), 0.02, 0.004, 4, squash=0.5)
        drape.paint(faces_of(rag), TEAL_DARK if index % 2 else TEAL)
    parts.append(drape)

    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.022, 0.018, 6)
        elbow = kit.sphere(upper.bm, e, (0.024, 0.024, 0.024), 6, 4)
        upper.paint(faces_of(elbow), BONE_DARK)
        parts.append(upper)

        # A thick bone forearm, wrapped in pale rags at the wrist.
        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.017, 0.015, 6)
        wrap = kit.cone(forearm.bm, w - d * 0.07, w - d * 0.008, 0.026, 0.024, 8)
        forearm.paint(faces_of(wrap), WRAP)
        band = kit.cone(forearm.bm, w - d * 0.05, w - d * 0.036, 0.028, 0.028, 8)
        forearm.paint(faces_of(band), RAG_DARK)
        parts.append(forearm)

        # A big bony hand: a palm and four long fingers round the shaft.
        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.02, (0.021, 0.018, 0.023), 6, 5)
        for index in (-1.5, -0.5, 0.5, 1.5):
            offset = Vector((0.0, -0.005, 0.0)) + SPADE * (0.009 * index)
            finger = kit.cone(hand.bm, w + d * 0.03 + offset, w + d * 0.056 + offset, 0.0055, 0.004, 4)
            hand.paint(faces_of(finger), BONE_DARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.025, 0.021, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.016, 0.004)), (0.031, 0.026, 0.029), 6, 5)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        # Big boots, wrapped with pale rags from the ankle to the knee.
        boot = Part(f"boot.{side}", WRAP, f"shin.{side}", shade=0.12)
        verts = kit.cone(boot.bm, knee - Vector((0, 0, 0.03)), ankle, 0.046, 0.046, 8)
        for face in faces_of(verts):
            if int((face.calc_center_median().z + face.calc_center_median().x * 0.3) * 50) % 2:
                boot.paint([face], RAG_DARK)
        cuff = kit.cone(boot.bm, knee - Vector((0, 0, 0.02)), knee - Vector((0, 0, 0.056)), 0.054, 0.05, 8)
        boot.paint(faces_of(cuff), RAG)
        for z in (0.1, 0.16):
            tie = kit.torus(boot.bm, (LEG_X * sign, 0, z), (0, 0.2, 1), 0.047, 0.005, 8, 3)
            boot.paint(faces_of(tie), LEATHER_DARK)
        parts.append(boot)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.032), (0.08, 0.14, 0.064))
        toe = kit.sphere(foot.bm, (LEG_X * sign, -0.096, 0.03), (0.04, 0.034, 0.03), 8, 5)
        foot.paint(faces_of(toe), LEATHER_DARK)
        sole = kit.box(foot.bm, (LEG_X * sign, -0.03, 0.005), (0.084, 0.144, 0.01))
        foot.paint(faces_of(sole), MUD_DARK)
        parts.append(foot)
    return parts


def spade_parts():
    spade = Part("spade", WOOD, "spade", shade=0.04)
    top = GRIP_R - SPADE * SHAFT_TOP
    socket = GRIP_R + SPADE * SOCKET_AT
    kit.cone(spade.bm, top, socket, 0.012, 0.011, 6)
    knob = kit.sphere(spade.bm, top - SPADE * 0.008, (0.017, 0.017, 0.017), 6, 4)
    spade.paint(faces_of(knob), WOOD_DARK)
    # Worn, dark wood where the hands hold it.
    for along in (-0.03, -TOP_GRIP - 0.03):
        wear = kit.cone(spade.bm, GRIP_R + SPADE * along, GRIP_R + SPADE * (along + 0.06), 0.0125, 0.0125, 6)
        spade.paint(faces_of(wear), WOOD_DARK)
    # The iron socket and the two straps down the handle.
    collar = kit.cone(spade.bm, socket - SPADE * 0.05, socket + SPADE * 0.012, 0.015, 0.018, 6)
    spade.paint(faces_of(collar), IRON_DARK)

    def p(a, s=0.0, f=0.0):
        """A point on the blade: `a` along the shaft from the socket, `s` to its side, `f` to its face."""
        return socket + SPADE * a + SIDE * s + FACE * f

    # The blade: wide and a little dished, with a rounded point. Rows go
    # down the blade and columns go across it.
    outline = [(0.0, 0.044), (0.03, 0.056), (0.08, 0.058), (0.12, 0.05), (0.15, 0.03), (BLADE, 0.006)]

    def grid(offset):
        rows = []
        for a, half in outline:
            row = []
            for u in (-1.0, -0.5, 0.0, 0.5, 1.0):
                dish = 0.008 * (1 - u * u) * (1 if a > 0.01 else 0)
                row.append(p(a, half * u, offset + dish))
            rows.append(row)
        return rows

    def color_of(face_side, row, column):
        if row >= 4:
            return MUD_DARK if column in (1, 2) else STEEL
        if row == 0:
            return IRON_DARK
        return IRON_BLADE if (row + column) % 3 == 0 else RUST

    edges = panel(spade, grid(0.003), grid(-0.003), color_of)
    spade.paint(edges, IRON_DARK)
    # The tread: a folded top edge to step on.
    tread = kit.cone(spade.bm, p(0.004, -0.05), p(0.004, 0.05), 0.006, 0.006, 4)
    spade.paint(faces_of(tread), IRON)

    clod = Part("clod", MUD, "clod", shade=0.2)
    lump = kit.sphere(clod.bm, CLOD, (0.024, 0.034, 0.03), 7, 5)
    for face in faces_of(lump):
        if face.calc_center_median().z < CLOD.z - 0.008:
            clod.paint([face], MUD_DARK)
    pebble = kit.sphere(clod.bm, CLOD + Vector((-0.012, -0.012, 0.014)), (0.011, 0.01, 0.01), 5, 3)
    clod.paint(faces_of(pebble), MUD_DARK)
    return [spade, clod]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("GraveyardDrudge", BONES)
    parts = head_parts() + body_parts() + limb_parts() + spade_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "GraveyardDrudgeMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone. The left arm
# crosses the chest at rest, so its bones have a different roll, and it
# needs a different angle.
POLE_ANGLES = {"L": 180, "R": -90}


def add_controls(rig):
    """IK for the arms: the left hand on the handle, the right hand to drive the spade. The spade aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "spade_aim": kit.add_empty("spade_aim"),
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
        ik.pole_angle = math.radians(POLE_ANGLES[side])
        ik.chain_count = 2
    aim = bones["spade"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["spade_aim"]
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

    spade_rest = rig.data.bones["spade"].matrix_local.to_quaternion()
    rest_frame = Matrix((SPADE, SIDE, FACE)).transposed()

    def aimed(direction):
        """
        The world rotation of the spade that points its blade along
        `direction`. The face of the blade stays to the sides, so the camera
        sees it and the edge leads the chop.
        """
        d = Vector(direction).normalized()
        side = d.cross(X).normalized()
        frame = Matrix((d, side, d.cross(side).normalized())).transposed()
        return (frame @ rest_frame.transposed()).to_quaternion() @ spade_rest

    def held(base, hand, direction):
        """The right hand and the spade by IK and `Aim`. The left hand stays on the handle."""
        return pose(
            base,
            forearm__L_slash_IK=1.0,
            forearm__R_slash_IK=1.0,
            spade_slash_Aim=1.0,
            ik_hand__R_at_pos=Vector(hand),
            spade_aim_at_rot=aimed(direction),
        )

    def body(breath=0.0):
        """Hunched over: the back bent, the skull pushed forward, the feet wide (Heavy)."""
        return {
            "hips@loc": at("hips", (0, 0.01, -0.02 - breath * 0.005)),
            "hips": t("hips", (Z, -6)),
            "spine": t("spine", (X, 18 + breath * 2)),
            "chest": t("chest", (X, 16 + breath), (Z, -4)),
            "neck": t("neck", (X, -6)),
            "head": t("head", (X, -20 - breath * 3), (Z, -6), (Y, -4)),
            "jaw": t("jaw", (X, 6 + breath * 4)),
            "hood": t("hood", (X, -6 - breath * 2)),
            "skirt.B": t("skirt.B", (X, 6)),
            "keys": t("keys", (X, -2)),
            "thigh.L": t("thigh.L", (X, -10), (Y, -6)),
            "shin.L": t("shin.L", (X, 14)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 8), (Y, 6)),
            "shin.R": t("shin.R", (X, 12)),
            "foot.R": t("foot.R", (X, -20)),
        }

    def stand(breath=0.0):
        """He leans on the spade, its blade in the mud in front of his right foot."""
        return held(body(breath), (-0.13, -0.2 - breath * 0.004, 0.47 - breath * 0.008), (-0.03, -0.3, -1))

    def dig_aim(push, lift, flick):
        """The right hand and the direction of the blade as he digs."""
        hand = Vector((-0.13, -0.2, 0.47)) + Vector((0, -0.02, -0.05)) * push + Vector((0, 0.06, 0.08)) * lift + Vector((-0.01, -0.02, 0.06)) * flick
        direction = Vector((-0.03, -0.3, -1)) + Vector((0, 0.08, 0.1)) * push + Vector((0, -0.6, 0.6)) * lift + Vector((0, -0.2, 0.9)) * flick
        return hand, direction

    def dig(push=0.0, lift=0.0, flick=0.0):
        """
        The idle work: `push` drives the blade into the mud, `lift` pries
        the clod up, and `flick` throws it up and forward.
        """
        hand, direction = dig_aim(push, lift, flick)
        return held(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0.01 - 0.01 * push, -0.025 - 0.02 * push + 0.005 * lift)),
                spine=t("spine", (X, 16 + 6 * push - 2 * lift), (Z, -6 * flick)),
                chest=t("chest", (X, 12 + 4 * push), (Z, -4 - 8 * flick)),
                head=t("head", (X, -16 - 4 * lift), (Z, -6 - 14 * flick), (Y, -4)),
                jaw=t("jaw", (X, 6 + 12 * flick)),
                hood=t("hood", (X, -6 + 6 * flick), (Y, 6 * flick)),
                keys=t("keys", (X, -2), (Y, -10 * flick)),
            ),
            hand,
            direction,
        )

    def winded(breath=0.0):
        """Low HP: bent low, he hangs on the spade, its blade planted, the skull low."""
        return held(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0.03, -0.06 - breath * 0.006)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, 26 + breath * 4)),
                chest=t("chest", (X, 16 + breath * 3), (Y, 4)),
                neck=t("neck", (X, 6)),
                head=t("head", (X, -4 + breath * 4), (Y, -12), (Z, -4)),
                jaw=t("jaw", (X, 16 + breath * 6)),
                hood=t("hood", (X, -16)),
                skirt__B=t("skirt.B", (X, 14)),
                thigh__L=t("thigh.L", (X, -26), (Y, -6)),
                shin__L=t("shin.L", (X, 40)),
                foot__L=t("foot.L", (X, -12)),
                thigh__R=t("thigh.R", (X, 4), (Y, 6)),
                shin__R=t("shin.R", (X, 34)),
                foot__R=t("foot.R", (X, -34)),
            ),
            (-0.12, -0.26, 0.45 - breath * 0.01),
            (-0.03, -0.12, -1),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the spade tips back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.02 - 0.006 * amount)),
            spine=t("spine", (X, 6 - 14 * amount)),
            chest=t("chest", (X, 8 - 12 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 6), (X, -10 - 16 * amount)),
            jaw=t("jaw", (X, 26 * amount)),
            hood=t("hood", (X, 20 * amount)),
            keys=t("keys", (X, -24 * amount)),
            ik_hand__R_at_pos=Vector((-0.13, -0.16 + 0.05 * amount, 0.5 + 0.02 * amount)),
            spade_aim_at_rot=aimed((-0.03, -0.3 - 0.3 * amount, -1)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 16)),
            jaw=t("jaw", (X, 30)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            hood=t("hood", (X, 10)),
            keys=t("keys", (X, 20)),
            ik_hand__R_at_pos=Vector((-0.14, -0.1, 0.4)),
            spade_aim_at_rot=aimed((-0.3, -1, -0.2)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back. The hands let go, and the spade lies flat beside him."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.04)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0), (Z, 0)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -30), (Y, 0)),
            jaw=t("jaw", (X, 28)),
            hood=t("hood", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (X, 50), (Y, 16)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            skirt__B=t("skirt.B", (X, -50)),
            keys=t("keys", (X, -60)),
            forearm__L_slash_IK=0.0,
            forearm__R_slash_IK=0.0,
            spade_slash_Aim=1.0,
            spade_aim_at_rot=aimed((-0.35, -1, -0.02)),
        )

    def crouch(base):
        """Low on one knee, the spade upright, as a summon starts and a Rebirth gets up."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.16)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, 30)),
                chest=t("chest", (X, 10)),
                neck=t("neck", (X, -10)),
                head=t("head", (X, -12)),
                hood=t("hood", (X, -10)),
                thigh__L=t("thigh.L", (X, -72), (Y, -4)),
                shin__L=t("shin.L", (X, 90)),
                foot__L=t("foot.L", (X, -18)),
                thigh__R=t("thigh.R", (X, -4), (Y, 4)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -44)),
                skirt__B=t("skirt.B", (X, -16)),
            ),
            (-0.13, -0.22, 0.4),
            (-0.03, -0.45, -1),
        )

    def proud(base):
        """Up again, the spade held up in front of him: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.004)),
                hips=t("hips", (Z, -6)),
                spine=t("spine", (X, 4)),
                chest=t("chest", (X, -4)),
                neck=t("neck", (X, -4)),
                head=t("head", (X, -14), (Z, -6)),
                jaw=t("jaw", (X, 20)),
                hood=t("hood", (X, 6)),
                thigh__L=t("thigh.L", (X, -6), (Y, -4)),
                shin__L=t("shin.L", (X, 6)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 2), (Y, 4)),
                shin__R=t("shin.R", (X, 4)),
                foot__R=t("foot.R", (X, -6)),
            ),
            (-0.14, -0.16, 0.56),
            (-0.03, -0.08, -1),
        )

    def step(front):
        """A slow, heavy trudge, the spade carried low. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return held(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0, -0.04)),
                hips=t("hips", (Z, -6 - 4 * front), (Y, 6 * front)),
                spine=t("spine", (X, 16), (Y, -3 * front)),
                chest=t("chest", (X, 10), (Z, 4 * front)),
                head=t("head", (X, -14), (Z, -6), (Y, -4 * front)),
                jaw=t("jaw", (X, 8)),
                hood=t("hood", (Y, 8 * front)),
                **{
                    f"thigh__{lead}": t(f"thigh.{lead}", (X, -28)),
                    f"shin__{lead}": t(f"shin.{lead}", (X, 14)),
                    f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                    f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                    f"shin__{back}": t(f"shin.{back}", (X, 18)),
                    f"foot__{back}": t(f"foot.{back}", (X, 8)),
                    "skirt__B": t("skirt.B", (X, 12), (Y, 6 * front)),
                    "keys": t("keys", (Y, 16 * front), (X, -6)),
                },
            ),
            (-0.14, -0.12, 0.44),
            (-0.08, -0.7, -0.7),
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return held(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0, -0.012)),
                hips=t("hips", (Z, -6)),
                spine=t("spine", (X, 16)),
                chest=t("chest", (X, 10)),
                head=t("head", (X, -16), (Z, -6)),
                jaw=t("jaw", (X, 4)),
                **{
                    f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -22)),
                    f"shin__{lifted}": t(f"shin.{lifted}", (X, 46)),
                    f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                    f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                    f"shin__{planted}": t(f"shin.{planted}", (X, 6)),
                    f"foot__{planted}": t(f"foot.{planted}", (X, -6)),
                    "skirt__B": t("skirt.B", (X, 6)),
                    "keys": t("keys", (X, 8)),
                },
            ),
            (-0.14, -0.12, 0.47),
            (-0.08, -0.7, -0.66),
        )

    # The attack: he lifts the spade up over his right shoulder, then steps
    # in and chops it down with the edge. The slash effect starts at 50% of
    # the attack (`MELEE_IMPACT` in fx.ts), so the chop lands at frame 15 of 30.
    def raise_up(base, amount=1.0):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03 * amount, -0.02)),
                hips=t("hips", (Z, -6 - 12 * amount)),
                spine=t("spine", (X, lerp(14, -4, amount)), (Z, -6 * amount)),
                chest=t("chest", (X, lerp(12, -6, amount)), (Z, -8 * amount)),
                neck=t("neck", (X, -4)),
                head=t("head", (X, -8), (Z, 4)),
                jaw=t("jaw", (X, 18 * amount)),
                hood=t("hood", (X, 10 * amount)),
                thigh__L=t("thigh.L", (X, -16), (Y, -6)),
                shin__L=t("shin.L", (X, 20)),
                thigh__R=t("thigh.R", (X, 14), (Y, 8)),
                shin__R=t("shin.R", (X, 22)),
                foot__R=t("foot.R", (X, -30)),
                keys=t("keys", (X, -14 * amount)),
            ),
            (lerp(-0.13, -0.13, amount), lerp(-0.2, 0.0, amount), lerp(0.47, 0.78, amount)),
            (lerp(-0.03, -0.12, amount), lerp(-0.3, 0.45, amount), lerp(-1, 1, amount)),
        )

    def chop(base, amount=1.0):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.07 * amount, -0.07 * amount)),
                hips=t("hips", (Z, -4)),
                spine=t("spine", (X, 14 + 18 * amount), (Z, 4)),
                chest=t("chest", (X, 12 + 6 * amount), (Z, 4)),
                neck=t("neck", (X, -4)),
                head=t("head", (X, -24 * amount), (Z, -4)),
                jaw=t("jaw", (X, 28 * amount)),
                hood=t("hood", (X, -20 * amount)),
                thigh__L=t("thigh.L", (X, -56 * amount), (Y, -6)),
                shin__L=t("shin.L", (X, 56 * amount)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 24 * amount), (Y, 6)),
                shin__R=t("shin.R", (X, 14)),
                foot__R=t("foot.R", (X, -14)),
                skirt__B=t("skirt.B", (X, 24 * amount)),
                keys=t("keys", (X, 26 * amount)),
            ),
            (-0.12, lerp(-0.2, -0.3, amount), lerp(0.47, 0.4, amount)),
            (-0.03, lerp(-0.3, -0.75, amount), lerp(-1, -0.66, amount)),
        )

    def swinging(base):
        """The middle of the chop: the spade comes over in front of him."""
        return held(
            pose(
                chop(base, 0.4),
                spine=t("spine", (X, 10), (Z, 2)),
                chest=t("chest", (X, 4)),
            ),
            (-0.13, -0.18, 0.66),
            (-0.06, -1, 0.5),
        )

    def clod_off(base):
        """The clod is gone (thrown off): it waits small on the blade."""
        return pose(base, clod_at_scale=0.02)

    def toss(base, aim, offset, scale):
        """
        The clod flies off the blade. `aim` is the (lift, flick, push) of
        the dig, and `offset` is in the axes of the figure, from the place of
        the clod on the blade.
        """
        lift, flick, push = aim
        _, direction = dig_aim(push, lift, flick)
        turned = aimed(direction) @ spade_rest.inverted()
        return pose(base, clod_at_loc=at("clod", turned.inverted() @ Vector(offset)), clod_at_scale=scale)

    clips = []
    # The idle: he leans and breathes, then he digs, pries the clod up and
    # flicks it away. The clod comes back as he leans on the spade again.
    idle = Clip("idle", 72, loop=True)
    idle.key(0, stand(0)).key(10, stand(1)).key(20, stand(0))
    idle.key(28, dig(push=1)).key(36, dig(lift=1)).key(40, dig(lift=1, flick=0.3))
    idle.key(44, toss(dig(lift=0.8, flick=1), (0.8, 1, 0), (-0.05, -0.1, 0.16), 0.9))
    idle.key(48, toss(dig(lift=0.5, flick=0.6), (0.5, 0.6, 0), (-0.1, -0.26, 0.02), 0.4))
    idle.key(49, clod_off(dig(lift=0.4, flick=0.5)))
    idle.key(56, clod_off(dig(push=0.6)))
    idle.key(62, clod_off(stand(0.5))).key(66, stand(0.5)).key(72, stand(0))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    walk = Clip("walk", 32, loop=True)
    walk.key(0, step(1)).key(8, passing("R")).key(16, step(-1)).key(24, passing("L")).key(32, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, raise_up(body())).key(11, raise_up(body()))
    attack.key(13, swinging(body())).key(15, chop(body())).key(21, chop(body()))
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
    rebirth.key(32, crouch(body())).key(41, proud(body())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(body())).key(10, pose(crouch(body()), hips_at_loc=at("hips", (0, 0.03, -0.18))))
    summon.key(17, proud(body())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "graveyard-drudge.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
