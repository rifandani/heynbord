"""
Grave-Bell Tender (`undead.graveBellTender`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a cackling skeleton in a ragged
teal-green hood and a heavy ragged brown robe, a leather satchel at the hip,
a big iron ring of keys and a rope at the belt, and wrapped boots. He holds a
big bronze hand bell high in his raised right hand and points with his left.
A small skeleton crawls up out of a patch of mud at his feet, with a bowl in
its hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/grave-bell-tender.glb`; then
`bun unit-model:pack grave-bell-tender` packs it for the game.

The Battle camera sees the right side of a player Unit, so he raises the bell
in his right hand, and the small skeleton sits in its mud in front of him on
the camera side. The mud has a bone with no parent, so it stays on the
ground, and the small skeleton is a child of the mud. The small skeleton
scales: it sinks into the mud when he falls, and it grows out of the mud in
the summon. His idle swings the bell slowly. His cast (Summon) rings the bell
hard: he leans back and cackles, and the small skeleton rises out of the mud
and lifts its bowl. His attack swings the heavy bell down onto the target as
a mace.
"""

import math
import os
import sys

from mathutils import Matrix, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e8dcc0")
BONE_DARK = hex_color("#b09f7a")
SOCKET = hex_color("#1d1a18")
GLOW = hex_color("#bfe9e0")
CAVITY = hex_color("#2c2622")
ROBE = hex_color("#6e5640")
ROBE_DARK = hex_color("#4a3a2c")
ROBE_LIGHT = hex_color("#8a7055")
TEAL = hex_color("#5f7f6c")
TEAL_DARK = hex_color("#3e574b")
LEATHER = hex_color("#7a5232")
LEATHER_DARK = hex_color("#4e3420")
WRAP = hex_color("#8c7a5e")
WRAP_DARK = hex_color("#5e5040")
ROPE = hex_color("#b89e70")
IRON = hex_color("#4a4a4c")
IRON_LIGHT = hex_color("#76726a")
BRONZE = hex_color("#a8743e")
BRONZE_DARK = hex_color("#6e4626")
BRONZE_LIGHT = hex_color("#cf9a5a")
WOOD = hex_color("#5a3e28")
MUD = hex_color("#5c4432")
MUD_DARK = hex_color("#3d2c20")
MUD_WET = hex_color("#86705a")
BOWL = hex_color("#8a5a32")

# --- Proportions ---------------------------------------------------------------

# A lean, tall skeleton in a heavy robe.
HIP_Z = 0.44
WAIST_Z = 0.52
CHEST_Z = 0.61
SHOULDER_Z = 0.71
NECK_Z = 0.74
HEAD_C = Vector((0, -0.014, 0.84))
KNEE_Z = 0.25
ANKLE_Z = 0.06
LEG_X = 0.07
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


# The right arm holds the bell high, out to his right. The left hand points
# forward. These are the rest (bind) positions.
SR = Vector((-0.14, 0, SHOULDER_Z))
WR = Vector((-0.2, -0.03, 1.03))
ER = bend(SR, WR, (-1, 0.4, -0.2))
TR = WR + (WR - ER).normalized() * 0.04
SL = Vector((0.14, 0, SHOULDER_Z))
WL = Vector((0.15, -0.2, 0.6))
EL = bend(SL, WL, (1, 0.2, -1))
TL = WL + (WL - EL).normalized() * 0.04

# The bell hangs from the fist, out and down from the wrist. Its axis goes
# from the knob of the handle to the mouth.
GRIP = WR + (WR - ER).normalized() * 0.022
BELL_DIR = Vector((-0.8, -0.3, -0.42)).normalized()
CROWN = GRIP + BELL_DIR * 0.05
BELL_LENGTH = 0.13
MOUTH = CROWN + BELL_DIR * BELL_LENGTH

# The keys hang at the front of the belt, a little to the camera side.
KEYS = Vector((-0.04, -0.1, 0.44))

# The small skeleton crawls out of a patch of mud in front of him, on the
# camera side. It faces out and to the camera side.
CRAWL = Vector((-0.24, -0.2, 0.0))
CRAWL_TURN = Matrix.Rotation(math.radians(-50), 3, "Z")
CRAWL_SIDE = CRAWL_TURN @ X
# A big small skeleton, as in the painting: its parts scale up about CRAWL.
CRAWL_SIZE = 1.35


def crawl(x, y, z):
    """A point of the small skeleton, from its own axes (it faces its -Y), before the scale."""
    return CRAWL + CRAWL_TURN @ Vector((x, y, z))


def big(point):
    """A point of the small skeleton after the scale."""
    return CRAWL + (point - CRAWL) * CRAWL_SIZE


# The arm of the small skeleton that holds the bowl.
C_SHOULDER = crawl(-0.034, 0.0, 0.1)
C_ELBOW = crawl(-0.05, -0.05, 0.075)
C_HAND = crawl(-0.035, -0.095, 0.085)
BOWL_AT = crawl(-0.03, -0.12, 0.09)

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.78), "chest"),
    ("head", (0, 0, 0.78), (0, 0, 0.95), "neck"),
    ("jaw", (0, -0.01, 0.81), (0, -0.07, 0.79), "head"),
    ("hood", (0, 0.07, 0.84), (0, 0.11, 0.66), "head"),
    ("robe.B", (0, 0.09, 0.46), (0, 0.13, 0.2), "hips"),
    ("keys", tuple(KEYS), tuple(KEYS - Vector((0, 0, 0.08))), "hips"),
    # The mud stays on the ground: it does not move with the root.
    ("mud", tuple(CRAWL), tuple(CRAWL + Vector((0, 0, 0.04))), None),
    ("crawler", tuple(CRAWL), tuple(CRAWL + Vector((0, 0, 0.1))), "mud"),
    ("crawler.arm", tuple(big(C_SHOULDER)), tuple(big(C_HAND)), "crawler"),
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
    ("bell", tuple(GRIP), tuple(GRIP + BELL_DIR * 0.12), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.47, 0.55)
    return blend("spine", "chest", co.z, 0.58, 0.65)


def skirt_weights(co):
    """The robe follows the hips at the top, the thighs in front and its back panel behind."""
    t = clamp01((0.48 - co.z) / 0.26)
    back = clamp01((co.y - 0.02) / 0.08)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "robe.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.5),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.5),
    }


def hood_weights(co):
    return blend("chest", "head", co.z, 0.74, 0.8) if co.y < 0.06 else blend("chest", "hood", co.z, 0.7, 0.78)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.062, 0.07, 0.072), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.04 * sign, -0.05, -0.022)), (0.024, 0.02, 0.017), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.062, 0.022)), (0.1, 0.014, 0.014))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    sockets = Part("sockets", SOCKET, "head", shade=0)
    for sign in (1, -1):
        # Wide, deep sockets that tilt in: a mad, glad look.
        kit.sphere(sockets.bm, HEAD_C + Vector((0.026 * sign, -0.06, 0.004)), (0.021, 0.012, 0.018), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.067, -0.022)), HEAD_C + Vector((0, -0.069, -0.006)), 0.01, 0.002, 4)
    teeth = kit.box(sockets.bm, HEAD_C + Vector((0, -0.06, -0.038)), (0.062, 0.012, 0.014))
    sockets.paint(faces_of(teeth), BONE)
    parts.append(sockets)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.026 * sign, -0.07, 0.004)), (0.006, 0.004, 0.006), 6, 4)
    parts.append(eyes)

    # The jaw hangs open in a cackle: it is made open about its hinge.
    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.036, 0.786), (0.05, 0.04, 0.022), 10, 6)
    lower = kit.box(jaw.bm, (0, -0.068, 0.8), (0.056, 0.01, 0.014))
    jaw.paint(faces_of(lower), BONE_DARK)
    mouth = kit.box(jaw.bm, (0, -0.05, 0.806), (0.046, 0.03, 0.006))
    jaw.paint(faces_of(mouth), SOCKET)
    kit.bmesh.ops.rotate(jaw.bm, cent=(0, -0.01, 0.81), matrix=Matrix.Rotation(math.radians(22), 3, "X"), verts=list(jaw.bm.verts))
    parts.append(jaw)

    # A ragged teal-green hood: over the top and the back of the skull, open at the face.
    hood = Part("hood", TEAL, hood_weights, shade=0.14)
    verts = kit.sphere(hood.bm, HEAD_C + Vector((0, 0.012, 0.014)), (0.078, 0.084, 0.084), 12, 9)
    kit.bmesh.ops.delete(hood.bm, geom=[v for v in verts if v.co.y < -0.03 and v.co.z < HEAD_C.z + 0.05], context="VERTS")
    rim = kit.torus(hood.bm, HEAD_C + Vector((0, -0.036, 0.0)), (0, 1, -0.35), 0.072, 0.011, 14, 4)
    hood.paint(faces_of(rim), TEAL_DARK)
    # A short peak at the top of the hood, that falls back.
    peak = kit.cone(hood.bm, HEAD_C + Vector((0, 0.03, 0.06)), HEAD_C + Vector((0.01, 0.11, 0.05)), 0.04, 0.008, 6)
    hood.paint(faces_of(peak), TEAL_DARK)
    for index in range(6):
        a = math.radians(-80 + index * 32)
        top = HEAD_C + Vector((0.072 * math.sin(a), 0.06 * math.cos(a) + 0.02, -0.03))
        flap = kit.cone(hood.bm, top, top + Vector((0.025 * math.sin(a), 0.03, -0.11 - 0.025 * (index % 2))), 0.032, 0.006, 5, squash=0.5)
        hood.paint(faces_of(flap), TEAL_DARK if index % 2 else TEAL)
    parts.append(hood)
    return parts


def body_parts():
    parts = []
    hollow = Part("hollow", CAVITY, torso_weights, shade=0.0)
    kit.cone(hollow.bm, (0, 0.006, 0.44), (0, 0.006, 0.72), 0.08, 0.09, 10, squash=0.8)
    parts.append(hollow)

    # The heavy robe over the chest: wide stripes of light and dark cloth.
    def robe_color(face, center):
        stripe = int((math.atan2(center.x, -center.y) + math.pi) * 4) % 3
        return (ROBE, ROBE_DARK, ROBE_LIGHT)[stripe]

    robe = Part("robe", robe_color, torso_weights, shade=0.14)
    kit.cone(robe.bm, (0, 0.006, 0.42), (0, 0.006, 0.735), 0.094, 0.112, 12, squash=0.82)
    # Bare ribs in a V at the neck, under the hood.
    for index in range(3):
        z = 0.7 - index * 0.026
        rib = kit.cone(robe.bm, (0.03 - index * 0.006, -0.094, z), (-0.03 + index * 0.006, -0.094, z), 0.008, 0.008, 4)
        robe.paint(faces_of(rib), BONE)
    parts.append(robe)

    # A ragged teal-green cape over the shoulders.
    def cape_color(row, column):
        return TEAL_DARK if (column % 3 == 1 or row >= 2) else TEAL

    cape = Part("cape", TEAL, torso_weights, shade=0.12)
    kit.ragged_cone(cape, 0.765, 0.58, 0.07, 0.155, 12, 3, 0.85, 0.07, cape_color, TEAL_DARK)
    parts.append(cape)

    # A rope belt, the satchel at the right hip and its strap from the left shoulder.
    belt = Part("belt", ROPE, "hips", shade=0.05)
    kit.torus(belt.bm, (0, 0.006, 0.47), (0, 0, 1), 0.112, 0.012, 14, 4)
    knot = kit.sphere(belt.bm, (0.04, -0.1, 0.47), (0.016, 0.012, 0.016), 6, 4)
    belt.paint(faces_of(knot), ROPE)
    for sign in (1, -1):
        end = kit.cone(belt.bm, (0.04, -0.1, 0.465), (0.04 + 0.016 * sign, -0.106, 0.38), 0.006, 0.005, 4)
        belt.paint(faces_of(end), ROPE)
    # A coil of rope at the left hip.
    coil = kit.torus(belt.bm, (0.11, -0.03, 0.4), (1, -0.3, 0), 0.04, 0.01, 10, 4)
    belt.paint(faces_of(coil), ROPE)
    satchel = kit.box(belt.bm, (-0.13, -0.03, 0.39), (0.05, 0.1, 0.08))
    belt.paint(faces_of(satchel), LEATHER)
    flap = kit.box(belt.bm, (-0.157, -0.03, 0.415), (0.008, 0.104, 0.05))
    belt.paint(faces_of(flap), LEATHER_DARK)
    clasp = kit.box(belt.bm, (-0.162, -0.03, 0.398), (0.006, 0.018, 0.016))
    belt.paint(faces_of(clasp), IRON_LIGHT)
    strap = kit.tube(belt.bm, [(-0.12, -0.04, 0.43), (-0.06, -0.1, 0.56), (0.04, -0.1, 0.68), (0.1, -0.04, 0.74)], [0.008, 0.009, 0.009, 0.008], 4)
    belt.paint(faces_of(strap), LEATHER_DARK)
    parts.append(belt)

    def skirt_color(row, column):
        if row >= 3:
            return ROBE_DARK
        return TEAL_DARK if column % 6 == 4 else (ROBE_DARK if column % 3 == 1 else ROBE)

    # The heavy robe falls to the shins, open at the front, so the camera sees the bony legs.
    skirt = Part("skirt", ROBE, skirt_weights, shade=0.12)
    kit.ragged_cone(skirt, 0.48, 0.16, 0.108, 0.18, 14, 4, 0.85, 0.09, skirt_color, ROBE_DARK, gap=0.55, y_push=0.04)
    parts.append(skirt)

    # The big iron ring of keys. Its face turns to the camera side.
    keys = Part("keys", IRON, "keys", shade=0.08)
    ring_c = KEYS - Vector((0, 0, 0.04))
    kit.torus(keys.bm, ring_c, (-0.6, -1, 0), 0.036, 0.006, 12, 4)
    for index in range(4):
        a = math.radians(-60 + index * 40)
        top = ring_c + Vector((0.03 * math.sin(a) * 0.5, -0.03 * math.sin(a) * 0.3, -0.03 * math.cos(a)))
        tip = top + Vector((0.01 * (index - 1.5), -0.004, -0.06 - 0.008 * (index % 2)))
        shaft = kit.cone(keys.bm, top, tip, 0.004, 0.004, 4)
        keys.paint(faces_of(shaft), IRON_LIGHT if index % 2 else IRON)
        bit = kit.box(keys.bm, tip + Vector((-0.006, -0.004, 0.008)), (0.012, 0.006, 0.014))
        keys.paint(faces_of(bit), IRON)
        bow = kit.torus(keys.bm, top, (-0.6, -1, 0), 0.008, 0.003, 6, 3)
        keys.paint(faces_of(bow), IRON_LIGHT)
    parts.append(keys)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        up = (e - s).normalized()
        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.019, 0.016, 6)
        elbow = kit.sphere(upper.bm, e, (0.021, 0.021, 0.021), 6, 4)
        upper.paint(faces_of(elbow), BONE_DARK)
        parts.append(upper)

        # A ragged brown sleeve over the upper arm, wide at the elbow.
        sleeve = Part(f"sleeve.{side}", ROBE, f"upperarm.{side}", shade=0.1)
        kit.cone(sleeve.bm, s - up * 0.01, s + up * 0.12, 0.042, 0.05, 8)
        for index in range(4):
            a = 2 * math.pi * index / 4
            side_axis = up.cross(Y if abs(up.y) < 0.9 else X).normalized()
            other = up.cross(side_axis).normalized()
            base = s + up * 0.11 + (side_axis * math.cos(a) + other * math.sin(a)) * 0.04
            rag = kit.cone(sleeve.bm, base, base + up * 0.06 + Vector((0, 0, -0.03)), 0.02, 0.004, 4, squash=0.4)
            sleeve.paint(faces_of(rag), ROBE_DARK if index % 2 else ROBE)
        shoulder = kit.sphere(sleeve.bm, s + Vector((0.006 * sign, 0, 0.01)), (0.05, 0.048, 0.04), 8, 5)
        sleeve.paint(faces_of(shoulder), TEAL_DARK)
        parts.append(sleeve)

        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.015, 0.013, 6)
        cuff = kit.cone(forearm.bm, w - d * 0.05, w - d * 0.015, 0.02, 0.02, 6)
        forearm.paint(faces_of(cuff), WRAP)
        parts.append(forearm)

        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        if side == "R":
            # A fist round the handle of the bell.
            kit.sphere(hand.bm, GRIP, (0.022, 0.02, 0.022), 6, 5)
            for index in (-1, 0, 1):
                knuckle = kit.sphere(hand.bm, GRIP + Vector((0.006 * index, -0.016, 0.012 * index)), (0.008, 0.008, 0.008), 4, 3)
                hand.paint(faces_of(knuckle), BONE_DARK)
        else:
            # An open hand that points: long fingers spread forward.
            kit.sphere(hand.bm, w + d * 0.018, (0.02, 0.016, 0.018), 6, 5)
            for index in (-2, -1, 0, 1):
                offset = Vector((0.009 * index, 0, 0.004 * index))
                finger = kit.cone(hand.bm, w + d * 0.026 + offset, w + d * (0.062 - 0.006 * abs(index)) + offset * 1.6, 0.0045, 0.003, 4)
                hand.paint(faces_of(finger), BONE_DARK if index % 2 else BONE)
            thumb = kit.cone(hand.bm, w + d * 0.016, w + d * 0.03 + Vector((-0.024, 0, 0.01)), 0.005, 0.0035, 4)
            hand.paint(faces_of(thumb), BONE)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.02, 0.017, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.012, 0.004)), (0.026, 0.024, 0.026), 6, 5)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        # Bony shins with wrapped boots to the middle of the shin.
        shin = Part(f"tibia.{side}", BONE, f"shin.{side}")
        kit.cone(shin.bm, knee, knee - Vector((0, 0, 0.1)), 0.016, 0.014, 6)
        parts.append(shin)

        boot = Part(f"boot.{side}", WRAP, f"shin.{side}", shade=0.12)
        verts = kit.cone(boot.bm, knee - Vector((0, 0, 0.08)), ankle, 0.034, 0.042, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 60) % 2:
                boot.paint([face], WRAP_DARK)
        cuff = kit.cone(boot.bm, knee - Vector((0, 0, 0.07)), knee - Vector((0, 0, 0.1)), 0.04, 0.038, 8)
        boot.paint(faces_of(cuff), LEATHER_DARK)
        # A loose end of the wrapping.
        tail = kit.cone(boot.bm, knee - Vector((0.03 * sign, 0, 0.08)), knee - Vector((0.04 * sign, -0.01, 0.15)), 0.01, 0.003, 4, squash=0.4)
        boot.paint(faces_of(tail), WRAP)
        parts.append(boot)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.03), (0.07, 0.13, 0.06))
        toe = kit.sphere(foot.bm, (LEG_X * sign, -0.09, 0.03), (0.035, 0.03, 0.03), 8, 5)
        foot.paint(faces_of(toe), LEATHER_DARK)
        parts.append(foot)
    return parts


def bell_parts():
    """
    The big bronze hand bell: a wooden handle with a knob through the fist,
    a round crown, a body that flares to a thick lip, and the iron clapper in
    the mouth.
    """
    bell = Part("bell", BRONZE, "bell", shade=0.1)
    handle = kit.cone(bell.bm, GRIP - BELL_DIR * 0.03, CROWN, 0.011, 0.012, 6)
    bell.paint(faces_of(handle), WOOD)
    knob = kit.sphere(bell.bm, GRIP - BELL_DIR * 0.034, (0.016, 0.016, 0.016), 6, 4)
    bell.paint(faces_of(knob), WOOD)
    collar = kit.cone(bell.bm, CROWN - BELL_DIR * 0.008, CROWN + BELL_DIR * 0.008, 0.016, 0.02, 8)
    bell.paint(faces_of(collar), BRONZE_DARK)
    kit.sphere(bell.bm, CROWN + BELL_DIR * 0.03, (0.042, 0.042, 0.042), 12, 6)
    body = kit.cone(bell.bm, CROWN + BELL_DIR * 0.03, MOUTH - BELL_DIR * 0.012, 0.044, 0.07, 12, caps=False)
    for face in faces_of(body):
        if int(face.calc_center_median().dot(Vector((1, 3, 0))) * 80) % 3 == 0:
            bell.paint([face], BRONZE_DARK)
    band = kit.torus(bell.bm, CROWN + BELL_DIR * 0.06, BELL_DIR, 0.05, 0.006, 12, 3)
    bell.paint(faces_of(band), BRONZE_LIGHT)
    lip = kit.torus(bell.bm, MOUTH - BELL_DIR * 0.008, BELL_DIR, 0.072, 0.012, 14, 4)
    bell.paint(faces_of(lip), BRONZE_LIGHT)
    inside = kit.cone(bell.bm, MOUTH - BELL_DIR * 0.004, CROWN + BELL_DIR * 0.05, 0.064, 0.03, 12)
    bell.paint(faces_of(inside), BRONZE_DARK)
    clapper = kit.sphere(bell.bm, MOUTH - BELL_DIR * 0.004, (0.016, 0.016, 0.016), 6, 4)
    bell.paint(faces_of(clapper), IRON)
    return [bell]


def crawler_parts():
    """
    The small skeleton that crawls out of the mud. It holds a wooden bowl up
    in one hand, and the other hand pushes on the mud. The mud is a low
    mound with wet spots and lumps; its bone has no parent.
    """
    mud = Part("mud", MUD, "mud", shade=0.0)
    verts = kit.cone(mud.bm, CRAWL + Vector((0, 0, 0.0)), CRAWL + Vector((0, 0, 0.022)), 0.12, 0.085, 14, squash=0.8)
    for face in faces_of(verts):
        c = face.calc_center_median()
        if c.z > 0.02:
            mud.paint([face], MUD)
        elif int((c.x + c.y) * 90) % 3 == 0:
            mud.paint([face], MUD_DARK)
    for index, (x, y, r) in enumerate(((0.07, -0.05, 0.02), (-0.08, 0.02, 0.016), (0.03, 0.07, 0.018), (-0.05, -0.07, 0.014))):
        lump = kit.sphere(mud.bm, crawl(x, y, 0.016), (r, r, r * 0.8), 6, 4)
        mud.paint(faces_of(lump), MUD_WET if index % 2 else MUD_DARK)
    puddle = kit.cone(mud.bm, crawl(0.04, -0.09, 0.0), crawl(0.04, -0.09, 0.012), 0.04, 0.036, 8, squash=0.6)
    mud.paint(faces_of(puddle), MUD_WET)

    crawler = Part("crawler", BONE, "crawler", shade=0.15)
    # The pelvis and the spine stay in the mud; the ribs, the skull and the arms are out.
    kit.cone(crawler.bm, crawl(0, 0.01, 0.004), crawl(0, 0.0, 0.07), 0.012, 0.012, 5)
    ribs = kit.sphere(crawler.bm, crawl(0, 0.0, 0.07), (0.034, 0.026, 0.032), 8, 6)
    for face in faces_of(ribs):
        if int(face.calc_center_median().z * 120) % 2:
            crawler.paint([face], BONE_DARK)
    kit.cone(crawler.bm, crawl(0, 0.0, 0.1), crawl(0, -0.006, 0.12), 0.008, 0.008, 4)
    skull = crawl(0, -0.012, 0.145)
    kit.sphere(crawler.bm, skull, (0.034, 0.036, 0.036), 10, 7)
    jaw = kit.sphere(crawler.bm, crawl(0, -0.03, 0.118), (0.024, 0.018, 0.012), 6, 4)
    crawler.paint(faces_of(jaw), BONE_DARK)
    for sign in (1, -1):
        socket = kit.sphere(crawler.bm, crawl(0.014 * sign, -0.042, 0.148), (0.01, 0.006, 0.011), 6, 4)
        crawler.paint(faces_of(socket), SOCKET)
    teeth = kit.box(crawler.bm, crawl(0, -0.044, 0.126), (0.03, 0.006, 0.008))
    crawler.paint(faces_of(teeth), BONE)
    nose = kit.sphere(crawler.bm, crawl(0, -0.047, 0.136), (0.004, 0.003, 0.005), 4, 3)
    crawler.paint(faces_of(nose), SOCKET)
    # The other arm pushes on the mud.
    shoulder = crawl(0.034, 0.0, 0.095)
    elbow = crawl(0.052, -0.03, 0.05)
    hand = crawl(0.05, -0.065, 0.02)
    kit.tube(crawler.bm, [shoulder, elbow, hand], [0.007, 0.007, 0.006], 5)
    palm = kit.sphere(crawler.bm, hand, (0.012, 0.014, 0.006), 6, 4)
    crawler.paint(faces_of(palm), BONE_DARK)

    # Mud on the ribs, where it comes out of the ground. Its foot stays with
    # the mud and its top goes with the small skeleton, so it stretches when
    # the small skeleton rises.
    def smear_weights(co):
        return blend("mud", "crawler", co.z, 0.004, 0.03)

    smear = Part("smear", MUD_DARK, smear_weights, shade=0.1)
    kit.cone(smear.bm, crawl(0, 0.004, 0.0), crawl(0, 0.004, 0.026), 0.05, 0.03, 8, squash=0.8)

    arm = Part("crawler.arm", BONE, "crawler.arm", shade=0.08)
    kit.tube(arm.bm, [C_SHOULDER, C_ELBOW, C_HAND], [0.007, 0.007, 0.006], 5)
    fingers = kit.sphere(arm.bm, C_HAND, (0.01, 0.01, 0.01), 6, 4)
    arm.paint(faces_of(fingers), BONE_DARK)
    bowl = kit.cone(arm.bm, BOWL_AT - Vector((0, 0, 0.004)), BOWL_AT + Vector((0, 0, 0.024)), 0.018, 0.034, 10)
    arm.paint(faces_of(bowl), BOWL)
    rim = kit.torus(arm.bm, BOWL_AT + Vector((0, 0, 0.024)), Z, 0.033, 0.004, 10, 3)
    arm.paint(faces_of(rim), LEATHER_DARK)
    soup = kit.cone(arm.bm, BOWL_AT + Vector((0, 0, 0.02)), BOWL_AT + Vector((0, 0, 0.026)), 0.03, 0.03, 10)
    arm.paint(faces_of(soup), MUD_DARK)
    for part in (crawler, arm):
        kit.bmesh.ops.scale(part.bm, vec=(CRAWL_SIZE,) * 3, space=Matrix.Translation(-CRAWL), verts=list(part.bm.verts))
    return [mud, smear, crawler, arm]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("GraveBellTender", BONES)
    parts = head_parts() + body_parts() + limb_parts() + bell_parts() + crawler_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "GraveBellTenderMesh")
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
            result[key.replace("__", ".").replace("_at_", "@").replace("_slash_", "/")] = value
        return result

    def crawler(rise=0.0, lift=0.0, size=1.0, look=0.0, sway=0.0):
        """
        The small skeleton: `rise` pulls it up out of the mud, `lift` raises
        its bowl, `size` scales it (it sinks into the mud at 0), `look` tips
        it back to look up at him, and `sway` rocks it from side to side.
        """
        return {
            "crawler": t("crawler", (CRAWL_SIDE, -10 * look), (Z, 6 * sway)),
            "crawler@loc": at("crawler", (0, 0, 0.045 * rise)),
            "crawler@scale": size,
            "crawler.arm": t("crawler.arm", (CRAWL_SIDE, -28 * lift)),
            "mud@scale": 1.0 + 0.08 * rise,
        }

    def stand(swing=0.0, breath=0.0):
        """
        At rest: the bell high in the right hand, the left hand points ahead,
        the left foot forward. `swing` (-1 to 1) swings the bell slowly.
        """
        return pose(
            {
                "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.004)),
                "hips": t("hips", (Z, -6)),
                "spine": t("spine", (X, -2 - breath)),
                "chest": t("chest", (X, -3 + breath), (Z, -4)),
                "neck": t("neck", (Z, -4)),
                "head": t("head", (X, -8), (Z, -16), (Y, 6)),
                "jaw": t("jaw", (X, 4 * breath)),
                "hood": t("hood", (X, 6 + 2 * breath)),
                "robe.B": t("robe.B", (X, 4)),
                "keys": t("keys", (Y, -4 * swing)),
                "thigh.L": t("thigh.L", (X, -16), (Y, -4)),
                "shin.L": t("shin.L", (X, 14)),
                "foot.L": t("foot.L", (X, 2)),
                "thigh.R": t("thigh.R", (X, 8), (Y, 4)),
                "shin.R": t("shin.R", (X, 6)),
                "foot.R": t("foot.R", (X, -12)),
                # The arm leans a little back and out, so the bell does not hide his face.
                "upperarm.R": t("upperarm.R", (X, -12), (Y, -6 + 3 * swing)),
                "forearm.R": t("forearm.R", (Y, 2 * swing)),
                "bell": t("bell", (Y, 12 * swing), (X, -4 * swing)),
                "upperarm.L": t("upperarm.L", (X, -2 * breath)),
            },
            **crawler(0.0, 0.2 * breath, 1.0, 0.5, swing),
        )

    def slump(breath=0.0):
        """Low HP: bent over, the bell arm low and the bell limp. The small skeleton looks up at him."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.04 - breath * 0.005)),
            spine=t("spine", (X, 18 + breath * 4)),
            chest=t("chest", (X, 10 + breath * 3)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 8 + breath * 4), (Z, -10)),
            jaw=t("jaw", (X, 12 + breath * 6)),
            hood=t("hood", (X, 14)),
            thigh__L=t("thigh.L", (X, -26), (Y, -6)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -8)),
            thigh__R=t("thigh.R", (X, -10), (Y, 6)),
            shin__R=t("shin.R", (X, 28)),
            foot__R=t("foot.R", (X, -18)),
            upperarm__R=t("upperarm.R", (X, 110), (Y, 20)),
            forearm__R=t("forearm.R", (X, 30)),
            bell=t("bell", (Y, -30), (X, 40 + 6 * breath)),
            upperarm__L=t("upperarm.L", (X, 30)),
            forearm__L=t("forearm.L", (X, 20)),
            **crawler(0.0, 0.0, 1.0, 1.4, 0.0),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, the bell jerks, and the small skeleton ducks."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.02)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, -10), (X, -20 * amount)),
            jaw=t("jaw", (X, 18 * amount)),
            hood=t("hood", (X, 20 * amount)),
            upperarm__R=t("upperarm.R", (X, -14 * amount), (Y, -10 * amount)),
            bell=t("bell", (Y, 40 * amount), (X, -20 * amount)),
            upperarm__L=t("upperarm.L", (X, -30 * amount), (Y, -20 * amount)),
            **crawler(-0.2 * amount, 0.0, 1.0 - 0.15 * amount, -0.5, 0.0),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22), (Z, -10)),
            jaw=t("jaw", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__R=t("upperarm.R", (X, 60), (Y, 20)),
            forearm__R=t("forearm.R", (X, 20)),
            bell=t("bell", (Y, -40), (X, 50)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, -20)),
            **crawler(-0.1, 0.0, 0.7, 1.0, 0.0),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the bell on the ground beside him. The small skeleton has sunk into the mud."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0), (Z, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -30)),
            jaw=t("jaw", (X, 26)),
            hood=t("hood", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (Y, -30), (X, 20)),
            forearm__R=t("forearm.R", (X, -10)),
            bell=t("bell", (Y, 20)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            robe__B=t("robe.B", (X, -40)),
            keys=t("keys", (X, -40)),
            **crawler(-0.4, 0.0, 0.02, 0.0, 0.0),
        )

    def crouch(base, size=0.02):
        """Low on one knee, as a summon starts and a Rebirth gets up. The bell rests on the ground."""
        return pose(
            slump(),
            hips_at_loc=at("hips", (0, 0.03, -0.16)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, -14), (Z, -10)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 78)),
            foot__L=t("foot.L", (X, -2)),
            thigh__R=t("thigh.R", (X, 12), (Y, 8)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            **crawler(-0.3, 0.0, size, 0.0, 0.0),
        )

    def ring(base, swing=1.0, loud=1.0, rise=0.0):
        """
        The cast (Summon): he leans back and cackles, and rings the bell hard.
        `swing` (-1 to 1) throws the bell from side to side, and `rise`
        pulls the small skeleton up out of the mud.
        """
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * loud, -0.012)),
            spine=t("spine", (X, -8 * loud)),
            chest=t("chest", (X, -10 * loud), (Z, -6)),
            neck=t("neck", (X, -6 * loud)),
            head=t("head", (X, -18 * loud), (Z, -16), (Y, 4 * swing)),
            jaw=t("jaw", (X, 16 * loud)),
            hood=t("hood", (X, 18 * loud)),
            upperarm__R=t("upperarm.R", (X, -10 * loud), (Y, -6 * swing)),
            forearm__R=t("forearm.R", (Y, 10 * swing)),
            bell=t("bell", (Y, 42 * swing), (X, -18 * swing)),
            upperarm__L=t("upperarm.L", (X, -30 * loud), (Y, -30 * loud)),
            forearm__L=t("forearm.L", (X, -10 * loud)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 14)),
            thigh__R=t("thigh.R", (X, 12), (Y, 6)),
            keys=t("keys", (Y, 20 * swing)),
            **crawler(rise, rise, 1.0 + 0.12 * rise, 0.8 + 0.4 * rise, 0.6 * swing),
        )

    def step(front):
        """A long, loose stride. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            hips=t("hips", (Y, 4 * front), (Z, -6 + 4 * front)),
            spine=t("spine", (X, 2), (Y, -3 * front)),
            chest=t("chest", (X, -2), (Z, -4 - 4 * front)),
            head=t("head", (X, -6), (Z, -16), (Y, -6 * front)),
            jaw=t("jaw", (X, 6)),
            bell=t("bell", (Y, 22 * front), (X, -10 * front)),
            keys=t("keys", (X, 16 * front)),
            upperarm__L=t("upperarm.L", (X, 14 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -36)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 20)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
            },
            **crawler(0.1, 0.1, 1.0, 0.3, front),
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, 2)),
            chest=t("chest", (X, -2)),
            bell=t("bell", (Y, 0)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -20)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 2)),
                f"foot__{planted}": t(f"foot.{planted}", (X, 0)),
            },
            **crawler(0.3, 0.1, 1.0, 0.3, 0.0),
        )

    # The attack: he draws the bell back over his head and brings it down
    # onto the target as a mace. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the bell hits at frame 15 of 30.
    def wind(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.01)),
            spine=t("spine", (X, -12)),
            chest=t("chest", (X, -10), (Z, -14)),
            head=t("head", (X, -10), (Z, -10)),
            jaw=t("jaw", (X, 20)),
            hood=t("hood", (X, 20)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 10)),
            forearm__R=t("forearm.R", (X, -20)),
            bell=t("bell", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, -30)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 16)),
            thigh__R=t("thigh.R", (X, 12), (Y, 6)),
            **crawler(-0.2, 0.0, 0.9, 0.0, 0.0),
        )

    def slam(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.06, -0.05)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 12), (Z, 4)),
            head=t("head", (X, -6), (Z, -6)),
            jaw=t("jaw", (X, 22)),
            hood=t("hood", (X, -10)),
            upperarm__R=t("upperarm.R", (X, 105), (Y, 10)),
            forearm__R=t("forearm.R", (X, 10)),
            bell=t("bell", (X, -30)),
            upperarm__L=t("upperarm.L", (X, 30), (Y, -40)),
            thigh__L=t("thigh.L", (X, -44), (Y, -6)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 22), (Y, 6)),
            shin__R=t("shin.R", (X, 14)),
            foot__R=t("foot.R", (X, -14)),
            keys=t("keys", (X, 30)),
            **crawler(-0.3, 0.0, 0.85, -0.5, 0.0),
        )

    clips = []
    # The idle swings the bell slowly, and the small skeleton rocks with it.
    idle = Clip("idle", 48, loop=True)
    for frame, swing, breath in ((0, 0, 0), (12, 1, 0.5), (24, 0, 1), (36, -1, 0.5), (48, 0, 0)):
        idle.key(frame, stand(swing, breath))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, wind(stand())).key(15, slam(stand())).key(19, slam(stand()))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    # The cast (Summon): he rings the bell hard, and the small skeleton
    # rises out of the mud and lifts its bowl, then sinks back.
    cast = Clip("cast", 36)
    cast.key(0, stand()).key(5, ring(stand(), 1.0, 1.0, 0.2)).key(10, ring(stand(), -1.0, 1.0, 0.6))
    cast.key(15, ring(stand(), 1.0, 1.0, 1.0)).key(20, ring(stand(), -1.0, 1.0, 1.0)).key(25, ring(stand(), 1.0, 0.8, 0.9))
    cast.key(30, ring(stand(), -0.4, 0.4, 0.4)).key(36, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up,
    # rings the bell, and the small skeleton comes back out of the mud.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(38, ring(stand(), 1.0, 1.0, 0.6)).key(43, ring(stand(), -1.0, 0.8, 0.4)).key(48, stand())
    clips.append(rebirth)

    # Summon: he gets up from a crouch and rings the bell; the small
    # skeleton grows up out of the mud.
    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand(), 0.4), hips_at_loc=at("hips", (0, 0.03, -0.18))))
    summon.key(17, ring(stand(), 1.0, 1.0, 0.8)).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "grave-bell-tender.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
