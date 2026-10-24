"""
Ossuary Piper (`undead.ossuaryPiper`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a cheerful, broad skeleton
musician with glowing pale eyes, a ragged teal hood, a rusty breastplate, a
teal sash, a ragged tunic, big wrapped boots, a small drum at the hip and a
fan of crooked bone pipes that he plays. A frog sits at his feet and tries to
sing the tune. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/ossuary-piper.glb`; then
`bun unit-model:pack ossuary-piper` packs it for the game.

He holds the pipes with both hands in front of his right shoulder, and the
fan of pipes rises on his right side, in the plane of his side and his
front, so the camera sees the fan. The drum hangs at his right hip, and its
head turns to the camera side. The frog has a bone with no parent, so it
stays on the ground on the camera side. His idle sways to the tune, and his
walk is a proud march. His cast (Rally) plays loudly: he leans back, music
notes rise from the pipes (a bone that scales), and the throat of the frog
swells as it sings. His attack swings the pipes over his head down onto the
target.
"""

import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
CAVITY = hex_color("#2c2a28")
RUST = hex_color("#8f5f3a")
RUST_DARK = hex_color("#62402a")
TEAL = hex_color("#5f837d")
TEAL_DARK = hex_color("#3f5a56")
TUNIC = hex_color("#8a7a62")
TUNIC_DARK = hex_color("#63574a")
LEATHER = hex_color("#6a4a2e")
LEATHER_DARK = hex_color("#45301e")
BRASS = hex_color("#b08440")
SKIN = hex_color("#e3d2a8")
ROPE = hex_color("#cdb98c")
FROG = hex_color("#7d8c4a")
FROG_DARK = hex_color("#55602f")
FROG_BELLY = hex_color("#d8cf8a")
FROG_EYE = hex_color("#e3c04a")
NOTE = hex_color("#c4f6ff")

# --- Proportions ---------------------------------------------------------------

# A broad, sturdy figure.
HIP_Z = 0.44
WAIST_Z = 0.52
CHEST_Z = 0.61
SHOULDER_Z = 0.71
NECK_Z = 0.74
HEAD_C = Vector((0, -0.012, 0.84))
KNEE_Z = 0.25
ANKLE_Z = 0.06
LEG_X = 0.075
UPPER_ARM = 0.16
FOREARM = 0.15


def bend(shoulder, wrist, out):
    """The elbow between `shoulder` and `wrist`, bent toward `out`."""
    d = wrist - shoulder
    length = d.length
    along = (UPPER_ARM**2 - FOREARM**2 + length**2) / (2 * length)
    height = math.sqrt(max(UPPER_ARM**2 - along**2, 0.0))
    side = Vector(out) - d.normalized() * Vector(out).dot(d.normalized())
    return shoulder + d.normalized() * along + side.normalized() * height


# Both hands hold the pipes in front of the right shoulder. These are the
# rest (bind) positions.
SR = Vector((-0.15, 0, SHOULDER_Z))
WR = Vector((-0.11, -0.15, 0.63))
ER = bend(SR, WR, (-1, 0.4, -1))
TR = WR + (WR - ER).normalized() * 0.04
SL = Vector((0.15, 0, SHOULDER_Z))
WL = Vector((-0.04, -0.16, 0.66))
EL = bend(SL, WL, (1, -0.2, -1))
TL = WL + (WL - EL).normalized() * 0.04

# The binding of the pipes, just above the right hand, and the mouth.
BUNDLE = Vector((-0.1, -0.16, 0.69))
MOUTH = HEAD_C + Vector((-0.014, -0.058, -0.04))

# The drum hangs at the right hip; its heads face the sides.
DRUM = Vector((-0.15, -0.01, 0.43))
# The frog sits on the ground in front, on the camera side.
FROG_AT = Vector((-0.21, -0.2, 0.0))
FROG_SIZE = 1.6
# The music notes rise above the pipes, in front of him.
NOTES = Vector((-0.17, -0.44, 0.9))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.78), "chest"),
    ("head", (0, 0, 0.78), (0, 0, 0.95), "neck"),
    ("jaw", (0, -0.01, 0.81), (0, -0.07, 0.79), "head"),
    ("hood", (0, 0.07, 0.84), (0, 0.11, 0.66), "head"),
    ("skirt.B", (0, 0.08, 0.44), (0, 0.11, 0.24), "hips"),
    ("drum", tuple(DRUM + Vector((0.03, 0, 0.08))), tuple(DRUM), "hips"),
    ("notes", tuple(NOTES), tuple(NOTES + Vector((0, 0, 0.06))), "chest"),
    # The frog stays on the ground: it does not move with the root.
    ("frog", tuple(FROG_AT), tuple(FROG_AT + Vector((0, 0, 0.05))), None),
    ("sac", tuple(FROG_AT + Vector((0, -0.05, 0.036))), tuple(FROG_AT + Vector((0, -0.065, 0.036))), "frog"),
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
    ("pipes", tuple(BUNDLE), tuple(BUNDLE + Vector((0, 0, 0.1))), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.47, 0.55)
    return blend("spine", "chest", co.z, 0.58, 0.65)


def skirt_weights(co):
    """The tunic follows the hips at the top, the thighs in front and its back panel behind."""
    t = clamp01((0.44 - co.z) / 0.2)
    back = clamp01((co.y - 0.02) / 0.08)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "skirt.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.5),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.5),
    }


def hood_weights(co):
    return blend("chest", "head", co.z, 0.74, 0.8) if co.y < 0.06 else blend("chest", "hood", co.z, 0.7, 0.78)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.064, 0.07, 0.072), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.042 * sign, -0.05, -0.022)), (0.024, 0.02, 0.017), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.062, 0.022)), (0.1, 0.014, 0.014))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    sockets = Part("sockets", SOCKET, "head", shade=0)
    for sign in (1, -1):
        # Happy eyes: wide sockets that curve up.
        kit.sphere(sockets.bm, HEAD_C + Vector((0.026 * sign, -0.06, 0.006)), (0.02, 0.012, 0.016), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.067, -0.02)), HEAD_C + Vector((0, -0.069, -0.004)), 0.01, 0.002, 4)
    teeth = kit.box(sockets.bm, HEAD_C + Vector((0, -0.062, -0.038)), (0.06, 0.01, 0.014))
    sockets.paint(faces_of(teeth), BONE_DARK)
    parts.append(sockets)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.026 * sign, -0.07, 0.008)), (0.009, 0.005, 0.008), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.036, 0.786), (0.052, 0.04, 0.024), 10, 6)
    lower = kit.box(jaw.bm, (0, -0.07, 0.8), (0.058, 0.008, 0.012))
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    # A ragged teal hood: over the top and the back of the skull, open at the face.
    hood = Part("hood", TEAL, hood_weights, shade=0.14)
    verts = kit.sphere(hood.bm, HEAD_C + Vector((0, 0.01, 0.012)), (0.078, 0.082, 0.082), 12, 9)
    kit.bmesh.ops.delete(hood.bm, geom=[v for v in verts if v.co.y < -0.03 and v.co.z < HEAD_C.z + 0.05], context="VERTS")
    rim = kit.torus(hood.bm, HEAD_C + Vector((0, -0.036, 0.0)), (0, 1, -0.35), 0.072, 0.01, 14, 4)
    hood.paint(faces_of(rim), TEAL_DARK)
    for index in range(5):
        a = math.radians(-70 + index * 35)
        top = HEAD_C + Vector((0.07 * math.sin(a), 0.06 * math.cos(a) + 0.02, -0.03))
        flap = kit.cone(hood.bm, top, top + Vector((0.02 * math.sin(a), 0.03, -0.1 - 0.02 * (index % 2))), 0.03, 0.006, 5, squash=0.5)
        hood.paint(faces_of(flap), TEAL_DARK if index % 2 else TEAL)
    parts.append(hood)
    return parts


def body_parts():
    parts = []
    hollow = Part("hollow", CAVITY, torso_weights, shade=0.0)
    kit.cone(hollow.bm, (0, 0.006, 0.44), (0, 0.006, 0.72), 0.08, 0.092, 10, squash=0.8)
    spine = kit.cone(hollow.bm, (0, -0.04, 0.44), (0, -0.04, 0.55), 0.016, 0.016, 6)
    hollow.paint(faces_of(spine), BONE)
    parts.append(hollow)

    # A big rusty breastplate, round at the front, with two rivets.
    plate = Part("breastplate", RUST, torso_weights, shade=0.16)
    verts = kit.sphere(plate.bm, (0, -0.02, 0.62), (0.112, 0.09, 0.11), 12, 9)
    kit.bmesh.ops.delete(plate.bm, geom=[v for v in verts if v.co.z < 0.53], context="VERTS")
    for face in faces_of([v for v in plate.bm.verts]):
        c = face.calc_center_median()
        if int((c.x * 2 + c.z) * 30) % 4 == 0:
            plate.paint([face], RUST_DARK)
    for sign in (1, -1):
        rivet = kit.sphere(plate.bm, (0.055 * sign, -0.1, 0.66), (0.008, 0.006, 0.008), 4, 3)
        plate.paint(faces_of(rivet), BRASS)
    parts.append(plate)

    # A teal sash from the left shoulder to the right hip, with a scarf at the neck.
    sash = Part("sash", TEAL, torso_weights, shade=0.08)
    kit.torus(sash.bm, (0, 0.004, 0.735), (0, 0.15, 1), 0.07, 0.018, 12, 5)
    band = kit.tube(sash.bm, [(0.1, -0.05, 0.72), (0.06, -0.106, 0.64), (0.0, -0.112, 0.57), (-0.06, -0.1, 0.5), (-0.1, -0.06, 0.46)], [0.016, 0.018, 0.018, 0.018, 0.016], 5)
    sash.paint(faces_of(band), TEAL_DARK)
    parts.append(sash)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.45), (0, 0, 0.49), 0.11, 0.108, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.09, 0.47), (0.034, 0.01, 0.03))
    belt.paint(faces_of(buckle), BRASS)
    parts.append(belt)

    def tunic_color(row, column):
        if row >= 3:
            return TUNIC_DARK
        return TEAL if column % 5 == 2 else (TUNIC_DARK if column % 3 == 1 else TUNIC)

    tunic = Part("tunic", TUNIC, skirt_weights, shade=0.1)
    kit.ragged_cone(tunic, 0.46, 0.22, 0.106, 0.15, 14, 4, 0.8, 0.07, tunic_color, TUNIC_DARK)
    parts.append(tunic)

    # The drum: a short wooden shell with two skin heads, on a strap from the
    # left shoulder. Its heads face the sides, so the camera sees one.
    drum = Part("drum", LEATHER, "drum", shade=0.08)
    shell = kit.cone(drum.bm, DRUM + Vector((0.03, 0, 0)), DRUM + Vector((-0.03, 0, 0)), 0.07, 0.07, 12)
    drum.paint(faces_of(shell), RUST)
    for sign in (1, -1):
        head = kit.cone(drum.bm, DRUM + Vector((0.032 * sign, 0, 0)), DRUM + Vector((0.036 * sign, 0, 0)), 0.066, 0.066, 12)
        drum.paint(faces_of(head), SKIN)
        hoop = kit.torus(drum.bm, DRUM + Vector((0.03 * sign, 0, 0)), (1, 0, 0), 0.07, 0.006, 12, 3)
        drum.paint(faces_of(hoop), LEATHER_DARK)
    for index in range(6):
        a = 2 * math.pi * index / 6
        b = 2 * math.pi * (index + 0.5) / 6
        rope = kit.cone(drum.bm, DRUM + Vector((0.026, 0.072 * math.sin(a), 0.072 * math.cos(a))), DRUM + Vector((-0.026, 0.072 * math.sin(b), 0.072 * math.cos(b))), 0.003, 0.003, 3)
        drum.paint(faces_of(rope), ROPE)
    strap = kit.tube(drum.bm, [DRUM + Vector((0.02, 0, 0.07)), (-0.09, -0.04, 0.56)], [0.008, 0.008], 4)
    drum.paint(faces_of(strap), LEATHER_DARK)
    parts.append(drum)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        guard = Part(f"guard.{side}", RUST, f"upperarm.{side}", shade=0.1)
        top = kit.sphere(guard.bm, s + Vector((0.01 * sign, 0, 0.012)), (0.05, 0.05, 0.036), 10, 7)
        guard.paint({f for v in top if v.co.z < s.z - 0.008 for f in v.link_faces}, RUST_DARK)
        parts.append(guard)

        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.02, 0.017, 6)
        elbow = kit.sphere(upper.bm, e, (0.022, 0.022, 0.022), 6, 4)
        upper.paint(faces_of(elbow), BONE_DARK)
        parts.append(upper)

        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.016, 0.014, 6)
        cuff = kit.cone(forearm.bm, w - d * 0.05, w - d * 0.01, 0.024, 0.024, 8)
        forearm.paint(faces_of(cuff), LEATHER)
        parts.append(forearm)

        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.018, (0.018, 0.016, 0.02), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.007 * index, -0.005, 0.005 * index))
            finger = kit.cone(hand.bm, w + d * 0.028 + offset, w + d * 0.05 + offset, 0.005, 0.0035, 4)
            hand.paint(faces_of(finger), BONE_DARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.022, 0.019, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.014, 0.004)), (0.028, 0.024, 0.026), 6, 5)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        # Big wrapped boots with a wide cuff.
        boot = Part(f"boot.{side}", LEATHER, f"shin.{side}", shade=0.12)
        verts = kit.cone(boot.bm, knee - Vector((0, 0, 0.05)), ankle, 0.044, 0.042, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 45) % 2:
                boot.paint([face], LEATHER_DARK)
        cuff = kit.cone(boot.bm, knee - Vector((0, 0, 0.03)), knee - Vector((0, 0, 0.08)), 0.054, 0.05, 8)
        boot.paint(faces_of(cuff), RUST_DARK)
        parts.append(boot)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.03), (0.072, 0.13, 0.06))
        toe = kit.sphere(foot.bm, (LEG_X * sign, -0.09, 0.03), (0.036, 0.03, 0.03), 8, 5)
        foot.paint(faces_of(toe), LEATHER_DARK)
        parts.append(foot)
    return parts


def pipe_parts():
    """
    A fan of six crooked bone pipes that rises from the binding and leans
    forward, in the plane of his side and his front, so the camera sees the
    fan and his face. A small pipe goes
    from the binding to his teeth.
    """
    pipes = Part("pipes", BONE, "pipes", shade=0.12)
    for index in range(6):
        u = index / 5
        spread = lerp(-0.2, 0.02, u)
        length = 0.22 + 0.08 * math.sin(u * math.pi) + 0.02 * (index % 2)
        base = BUNDLE + Vector((0.0, spread * 0.12, -0.02))
        top = BUNDLE + Vector((-0.02 * (index % 2), spread * 1.1 - 0.04, length))
        kink = base.lerp(top, 0.5) + Vector((0.008 * (1 if index % 2 else -1), 0.012 * (1 if index % 3 else -1), 0))
        r = 0.012 + 0.002 * (index % 2)
        tube = kit.tube(pipes.bm, [base, kink, top], [r, r * 0.9, r], 6)
        pipes.paint(faces_of(tube), BONE if index % 2 else BONE_DARK)
        # A knob of bone at each end, and a dark hole at the top.
        knob = kit.sphere(pipes.bm, top, (r * 1.4, r * 1.4, r * 1.2), 6, 4)
        pipes.paint(faces_of(knob), BONE)
        hole = kit.cone(pipes.bm, top + Vector((0, 0, r * 0.6)), top + Vector((0, 0, r * 1.25)), r * 0.7, r * 0.7, 6)
        pipes.paint(faces_of(hole), SOCKET)
    for z in (0.0, 0.05):
        strap = kit.torus(pipes.bm, BUNDLE + Vector((0, 0.002, z)), (0, 0, 1), 0.026, 0.008, 10, 4)
        pipes.paint(faces_of(strap), LEATHER_DARK)
    # Teal rags and a little brass bell tied to the binding.
    for sign in (1, -1):
        rag = kit.cone(pipes.bm, BUNDLE + Vector((-0.02, 0.03 * sign, 0.02)), BUNDLE + Vector((-0.03, 0.07 * sign, -0.08)), 0.02, 0.004, 4, squash=0.3)
        pipes.paint(faces_of(rag), TEAL if sign > 0 else TEAL_DARK)
    chain = kit.cone(pipes.bm, BUNDLE + Vector((-0.02, 0.0, -0.02)), BUNDLE + Vector((-0.024, 0.0, -0.07)), 0.002, 0.002, 3)
    pipes.paint(faces_of(chain), BRASS)
    bell = kit.sphere(pipes.bm, BUNDLE + Vector((-0.024, 0.0, -0.08)), (0.012, 0.012, 0.012), 6, 4)
    pipes.paint(faces_of(bell), BRASS)

    # It moves with the pipes, so it leaves his teeth when he swings them.
    blowpipe = Part("blowpipe", BONE_DARK, "pipes", shade=0.05)
    kit.tube(blowpipe.bm, [BUNDLE + Vector((0.004, 0.0, 0.03)), BUNDLE.lerp(MOUTH, 0.5) + Vector((0.004, -0.01, 0.0)), MOUTH], [0.006, 0.006, 0.005], 5)
    return [pipes, blowpipe]


def frog_parts():
    """The frog, on the ground in front of him on the camera side. It sings with its throat."""
    frog = Part("frog", FROG, "frog", shade=0.16)
    body = FROG_AT + Vector((0, 0.004, 0.026))
    kit.sphere(frog.bm, body, (0.028, 0.036, 0.024), 8, 6)
    head = FROG_AT + Vector((0, -0.026, 0.042))
    kit.sphere(frog.bm, head, (0.026, 0.022, 0.018), 8, 6)
    spots = [f for f in frog.bm.faces if f.calc_center_median().z > FROG_AT.z + 0.04 and int(f.calc_center_median().x * 300) % 3 == 0]
    frog.paint(spots, FROG_DARK)
    for sign in (1, -1):
        eye = kit.sphere(frog.bm, head + Vector((0.016 * sign, -0.004, 0.014)), (0.009, 0.009, 0.009), 6, 4)
        frog.paint(faces_of(eye), FROG_EYE)
        pupil = kit.sphere(frog.bm, head + Vector((0.02 * sign, -0.008, 0.017)), (0.004, 0.004, 0.005), 4, 3)
        frog.paint(faces_of(pupil), SOCKET)
        leg = kit.sphere(frog.bm, FROG_AT + Vector((0.024 * sign, 0.02, 0.012)), (0.012, 0.022, 0.012), 6, 4)
        frog.paint(faces_of(leg), FROG_DARK)
        hand = kit.cone(frog.bm, FROG_AT + Vector((0.016 * sign, -0.024, 0.02)), FROG_AT + Vector((0.02 * sign, -0.034, 0.002)), 0.005, 0.006, 4)
        frog.paint(faces_of(hand), FROG)
    mouth = kit.box(frog.bm, head + Vector((0, -0.02, -0.002)), (0.03, 0.004, 0.004))
    frog.paint(faces_of(mouth), FROG_DARK)

    sac = Part("sac", FROG_BELLY, "sac", shade=0)
    kit.sphere(sac.bm, FROG_AT + Vector((0, -0.036, 0.024)), (0.016, 0.012, 0.012), 8, 5)
    # A big frog, as in the painting: scale it up about its feet.
    for part in (frog, sac):
        kit.bmesh.ops.scale(part.bm, vec=(FROG_SIZE,) * 3, space=Matrix.Translation(-FROG_AT), verts=list(part.bm.verts))
    return [frog, sac]


def note_parts():
    """Two music notes that rise from the pipes in his cast (Rally)."""
    notes = Part("notes", NOTE, "notes", shade=0)
    for offset, size in ((Vector((0, 0, 0)), 1.7), (Vector((0, 0.07, 0.05)), 1.3)):
        head = NOTES + offset
        kit.sphere(notes.bm, head, (0.006 * size, 0.014 * size, 0.011 * size), 6, 4)
        stem = head + Vector((0, 0.011 * size, 0.0))
        kit.cone(notes.bm, stem, stem + Vector((0, 0, 0.05 * size)), 0.003, 0.003, 4)
        kit.cone(notes.bm, stem + Vector((0, 0, 0.05 * size)), stem + Vector((0, 0.022 * size, 0.026 * size)), 0.004, 0.002, 4)
    return [notes]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("OssuaryPiper", BONES)
    parts = head_parts() + body_parts() + limb_parts() + pipe_parts() + frog_parts() + note_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "OssuaryPiperMesh")
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

    def arms(lift):
        """Both arms turn by the same angle about X, so the two hands stay on the pipes."""
        return {"upperarm.L": t("upperarm.L", (X, lift)), "upperarm.R": t("upperarm.R", (X, lift))}

    def frog(hop=0.0, sing=0.0, turn_to=35):
        """The frog: `hop` lifts it, `sing` lifts its head and swells its throat."""
        return {
            "frog": t("frog", (Z, turn_to), (X, -16 * sing)),
            "frog@loc": at("frog", (0, 0, 0.04 * hop)),
            "sac@scale": 0.5 + 1.3 * sing,
        }

    def stand(beat=0.0, breath=0.0, sing=0.0):
        """
        Playing: chest out, the feet apart. `beat` (-1 to 1) sways him to the
        tune and taps a foot.
        """
        return pose(
            {
                "hips@loc": at("hips", (0, 0, -0.008 - breath * 0.004 - 0.008 * abs(beat))),
                "hips": t("hips", (Y, 3 * beat)),
                "spine": t("spine", (X, -3 - breath), (Y, -2 * beat)),
                "chest": t("chest", (X, -4 + breath), (Y, -3 * beat)),
                "neck": t("neck", (Y, -4 * beat)),
                "head": t("head", (X, -4), (Y, -6 * beat), (Z, -4)),
                "jaw": t("jaw", (X, 2 + breath * 2)),
                "hood": t("hood", (X, 4 + 2 * breath), (Y, 4 * beat)),
                "skirt.B": t("skirt.B", (X, 4)),
                "drum": t("drum", (Y, -4 * beat)),
                "thigh.L": t("thigh.L", (X, -8), (Y, -4)),
                "shin.L": t("shin.L", (X, 8)),
                "foot.L": t("foot.L", (X, -14 * max(0.0, beat))),
                "thigh.R": t("thigh.R", (X, 4), (Y, 4)),
                "shin.R": t("shin.R", (X, 4)),
                "foot.R": t("foot.R", (X, -8 - 10 * max(0.0, -beat))),
                "notes@scale": 0.02,
                **arms(-2 * breath),
            },
            **frog(0.0, sing),
        )

    def wheeze(breath=0.0):
        """Low HP: bent over, the pipes low, out of breath. The frog looks up at him."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.04 - breath * 0.005)),
            spine=t("spine", (X, 20 + breath * 4)),
            chest=t("chest", (X, 10 + breath * 3)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 6 + breath * 4), (Y, -10)),
            jaw=t("jaw", (X, 16 + breath * 6)),
            hood=t("hood", (X, 16)),
            thigh__L=t("thigh.L", (X, -24), (Y, -6)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, -10), (Y, 6)),
            shin__R=t("shin.R", (X, 28)),
            foot__R=t("foot.R", (X, -18)),
            **arms(26),
            **frog(0.0, 0.0, 70),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the frog jumps."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.02)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 6), (X, -18 * amount)),
            jaw=t("jaw", (X, 24 * amount)),
            hood=t("hood", (X, 20 * amount)),
            drum=t("drum", (X, -20 * amount)),
            **arms(-20 * amount),
            **frog(amount, 0.0),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            jaw=t("jaw", (X, 30)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            drum=t("drum", (X, 20)),
            **arms(40),
            **frog(0.6, 0.0, 120),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the pipes on his chest. The frog hops up beside him."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Y, 0)),
            spine=t("spine", (X, -4), (Y, 0)),
            chest=t("chest", (X, 0), (Y, 0)),
            neck=t("neck", (Y, 0)),
            head=t("head", (X, -10), (Z, -30)),
            jaw=t("jaw", (X, 26)),
            hood=t("hood", (X, -40)),
            drum=t("drum", (Y, -40)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (X, 10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            skirt__B=t("skirt.B", (X, -40)),
            **frog(0.0, 0.0, 100),
        )

    def crouch(base):
        """Low on one knee, as a summon starts and a Rebirth gets up."""
        return pose(
            wheeze(),
            hips_at_loc=at("hips", (0, 0.03, -0.16)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, -14)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 78)),
            foot__L=t("foot.L", (X, -2)),
            thigh__R=t("thigh.R", (X, 12), (Y, 8)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
        )

    def blast(base, loud=1.0, rise=0.0):
        """He leans back and plays loudly: the pipes go up, and the notes rise. `rise` lifts the notes."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.01)),
            spine=t("spine", (X, -8 * loud)),
            chest=t("chest", (X, -10 * loud)),
            neck=t("neck", (X, -6 * loud)),
            head=t("head", (X, -12 * loud), (Z, -4)),
            jaw=t("jaw", (X, 2)),
            hood=t("hood", (X, 16 * loud)),
            thigh__L=t("thigh.L", (X, -14), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, 8), (Y, 6)),
            notes_at_scale=lerp(0.02, 1.0, loud),
            notes_at_loc=at("notes", (0, -0.02 * rise, 0.08 * rise)),
            **arms(-18 * loud),
        )

    def step(front):
        """A proud march, the knees high. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            hips=t("hips", (Y, 4 * front), (Z, 4 * front)),
            spine=t("spine", (X, -2), (Y, -3 * front)),
            chest=t("chest", (X, -6), (Z, -4 * front)),
            head=t("head", (X, -4), (Y, -6 * front)),
            drum=t("drum", (X, 10 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -50)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 46)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -10)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 10)),
                f"shin__{back}": t(f"shin.{back}", (X, 10)),
                f"foot__{back}": t(f"foot.{back}", (X, 6)),
            },
            **frog(0.0, 0.3),
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -20)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 2)),
                f"foot__{planted}": t(f"foot.{planted}", (X, 0)),
            },
            **frog(1.0, 0.0),
        )

    # The attack: he lifts the pipes over his head and brings them down onto
    # the target. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the pipes hit at frame 15 of 30.
    def lift(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.01)),
            spine=t("spine", (X, -12)),
            chest=t("chest", (X, -10), (Z, -10)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, 20)),
            hood=t("hood", (X, 20)),
            # The pipes turn with the whole arm: the elbow and the wrist bend
            # back, so the pipes point up and back over his shoulder.
            upperarm__R=t("upperarm.R", (X, -150), (Y, -10)),
            forearm__R=t("forearm.R", (X, 50)),
            hand__R=t("hand.R", (X, 50)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, -30)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 16)),
            thigh__R=t("thigh.R", (X, 12), (Y, 6)),
        )

    def bonk(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.05, -0.05)),
            spine=t("spine", (X, 18)),
            chest=t("chest", (X, 12), (Z, -4)),
            head=t("head", (X, -6)),
            jaw=t("jaw", (X, 24)),
            hood=t("hood", (X, -10)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, -6)),
            forearm__R=t("forearm.R", (X, 60)),
            hand__R=t("hand.R", (X, 80)),
            upperarm__L=t("upperarm.L", (X, 30), (Y, -40)),
            thigh__L=t("thigh.L", (X, -44), (Y, -6)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 22), (Y, 6)),
            shin__R=t("shin.R", (X, 14)),
            foot__R=t("foot.R", (X, -14)),
            drum=t("drum", (X, 16)),
            **frog(0.5, 0.0),
        )

    clips = []
    # The idle sways to the tune, and the frog joins in now and then.
    idle = Clip("idle", 48, loop=True)
    for frame, beat, breath, sing in ((0, 0, 0, 0), (6, 1, 0.3, 0), (12, 0, 0.6, 0.4), (18, -1, 1, 0), (24, 0, 0.6, 0), (30, 1, 0.3, 0.8), (36, 0, 0, 0.2), (42, -1, 0.3, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(beat, breath, sing))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, wheeze(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, lift(stand())).key(15, bonk(stand())).key(19, bonk(stand()))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    # The cast (Rally): he plays loudly, the notes rise, and the frog sings.
    cast = Clip("cast", 36)
    cast.key(0, stand()).key(6, blast(stand(0.0, 0.0, 0.6), 1.0, 0.0)).key(12, blast(stand(1.0, 0.0, 1.0), 0.8, 0.4))
    cast.key(18, blast(stand(-1.0, 0.0, 1.0), 1.0, 0.7)).key(24, blast(stand(1.0, 0.0, 0.8), 0.8, 1.0))
    cast.key(30, blast(stand(0.0, 0.0, 0.4), 0.4, 1.2)).key(36, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up
    # and plays a short tune.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, blast(stand(0.0, 0.0, 1.0), 1.0, 0.5)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.18))))
    summon.key(17, blast(stand(0.0, 0.0, 1.0), 1.0, 0.5)).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "ossuary-piper.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
