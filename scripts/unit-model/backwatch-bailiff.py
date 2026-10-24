"""
Backwatch Bailiff (`undead.backwatchBailiff`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a tall skeletal road bailiff with
glowing pale eyes, a rusty kettle hat with a wide brim, rusty shoulder
guards, a ragged rust-brown coat with pale teal trim and a teal sash, a large
iron ring of keys at the belt, tall wrapped boots and a hooked polearm with a
small bell. He offers a blank permit to the crow on his right shoulder. Run it
in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/backwatch-bailiff.glb`; then
`bun unit-model:pack backwatch-bailiff` packs it for the game.

He holds the polearm in the right hand, on the camera side, with the hook
behind him: the hand moves with IK, and the polearm aims with a Copy
Rotation. The left hand holds the permit out in front of him. He has Pivot,
so he watches behind him: his chest and feet go forward, his skull turns back
over his right shoulder, and his attack swings the hook from behind him,
round his right side, to the front. He has Heavy, so his walk is a slow,
stiff march. In the death the crow flies off and his hat falls. He has no
Keyword that he uses by his own action, so he has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
CAVITY = hex_color("#2c2a28")
RUST = hex_color("#8a5a36")
RUST_DARK = hex_color("#5e3c24")
COAT = hex_color("#7a5e44")
COAT_DARK = hex_color("#57412e")
TEAL = hex_color("#6a8f88")
TEAL_DARK = hex_color("#46625e")
IRON = hex_color("#4f4b47")
IRON_DARK = hex_color("#33302d")
STEEL = hex_color("#9a958a")
LEATHER = hex_color("#5c3c24")
LEATHER_DARK = hex_color("#3c2616")
WOOD = hex_color("#6e4e32")
BRASS = hex_color("#b08440")
PAPER = hex_color("#efe5c8")
PAPER_DARK = hex_color("#cdbf9c")
SEAL = hex_color("#8e3a2e")
CROW = hex_color("#25272d")
CROW_LIGHT = hex_color("#3f4554")
BEAK = hex_color("#4a4540")
CROW_EYE = hex_color("#d9c27a")

# --- Proportions ---------------------------------------------------------------

# A tall, thin figure with long legs.
HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.73
NECK_Z = 0.755
HEAD_C = Vector((0, -0.01, 0.86))
KNEE_Z = 0.27
ANKLE_Z = 0.055
LEG_X = 0.058
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


# The right hand holds the polearm low at the right hip, and the shaft goes
# back and up, so the hook is behind him. The left hand holds the permit out
# in front. These are the rest (bind) positions.
SR = Vector((-0.12, 0, SHOULDER_Z))
WR = Vector((-0.15, -0.02, 0.5))
ER = bend(SR, WR, (-1, 0.6, 0))
DR = (WR - ER).normalized()
TR = WR + DR * 0.045
GRIP_R = WR + DR * 0.022
SL = Vector((0.12, 0, SHOULDER_Z))
WL = Vector((0.05, -0.24, 0.64))
EL = bend(SL, WL, (1, 0.2, -1))
DL = (WL - EL).normalized()
TL = WL + DL * 0.045

POLE = Vector((-0.12, 1, 0.32)).normalized()
POLE_BACK = 0.22
POLE_FRONT = 0.52
POLE_SIDE = POLE.cross(Z).normalized()
POLE_UP = POLE_SIDE.cross(POLE).normalized()
if POLE_UP.z < 0:
    POLE_UP = -POLE_UP

# The ring of keys hangs at the front of the belt, a little to his right.
KEYS = Vector((-0.045, -0.075, 0.47))
# The crow sits on the right shoulder guard.
CROW_C = Vector((-0.135, 0.0, 0.8))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("jaw", (0, -0.01, 0.825), (0, -0.07, 0.805), "head"),
    ("hat", tuple(HEAD_C + Vector((0, 0, 0.04))), tuple(HEAD_C + Vector((0, 0, 0.12))), "head"),
    ("coat.B", (0, 0.08, 0.5), (0, 0.12, 0.2), "hips"),
    ("keys", tuple(KEYS), tuple(KEYS - Vector((0, 0, 0.06))), "hips"),
    ("crow", tuple(CROW_C), tuple(CROW_C + Vector((0, 0, 0.06))), "chest"),
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
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("polearm", tuple(GRIP_R), tuple(GRIP_R + POLE * 0.1), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def coat_weights(co):
    """The long coat follows the hips at the top, and the legs and its back panel lower."""
    t = clamp01((0.49 - co.z) / 0.26)
    back = clamp01((co.y - 0.0) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "coat.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.3),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.3),
    }


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.06, 0.066, 0.07), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.038 * sign, -0.048, -0.022)), (0.02, 0.018, 0.015), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.058, 0.02)), (0.094, 0.014, 0.014))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    sockets = Part("sockets", SOCKET, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(sockets.bm, HEAD_C + Vector((0.025 * sign, -0.056, 0.002)), (0.019, 0.012, 0.018), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.063, -0.022)), HEAD_C + Vector((0, -0.065, -0.006)), 0.01, 0.002, 4)
    parts.append(sockets)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.025 * sign, -0.066, 0.002)), (0.008, 0.005, 0.008), 6, 4)
    parts.append(eyes)

    # A wide grin: the upper teeth on the skull, the lower teeth on the jaw.
    teeth = Part("teeth", BONE_DARK, "head", shade=0)
    kit.box(teeth.bm, HEAD_C + Vector((0, -0.058, -0.038)), (0.054, 0.01, 0.012))
    parts.append(teeth)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.036, 0.8), (0.046, 0.038, 0.022), 10, 6)
    lower = kit.box(jaw.bm, (0, -0.066, 0.812), (0.05, 0.008, 0.012))
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    # The kettle hat: a rusty dome with a wide brim that dips a little, a dent
    # and a teal band.
    hat = Part("hat", RUST, "hat", shade=0.14)
    top = HEAD_C + Vector((0, 0.004, 0.04))
    dome = kit.sphere(hat.bm, top, (0.07, 0.074, 0.06), 12, 7)
    kit.bmesh.ops.delete(hat.bm, geom=[v for v in dome if v.co.z < top.z - 0.006], context="VERTS")
    for face in faces_of([v for v in hat.bm.verts]):
        c = face.calc_center_median()
        if c.y > 0.03 and c.x > 0.01:
            hat.paint([face], RUST_DARK)
    brim = kit.cone(hat.bm, top + Vector((0, 0, -0.004)), top + Vector((0, 0, -0.022)), 0.074, 0.108, 16, caps=True)
    hat.paint(faces_of(brim), STEEL)
    band = kit.cone(hat.bm, top + Vector((0, 0, 0.0)), top + Vector((0, 0, 0.014)), 0.072, 0.07, 12)
    hat.paint(faces_of(band), TEAL)
    tail = kit.cone(hat.bm, top + Vector((0.05, 0.05, 0.006)), top + Vector((0.08, 0.13, -0.04)), 0.014, 0.003, 4, squash=0.3)
    hat.paint(faces_of(tail), TEAL_DARK)
    parts.append(hat)
    return parts


def body_parts():
    parts = []
    # The open chest: a dark hollow behind bone ribs and a sternum.
    chest = Part("ribcage", CAVITY, torso_weights, shade=0.0)
    kit.cone(chest.bm, (0, 0.004, 0.5), (0, 0.004, 0.75), 0.06, 0.074, 10, squash=0.8)
    for index, z in enumerate((0.6, 0.64, 0.68)):
        width = 0.056 + 0.006 * index
        rib = kit.tube(chest.bm, [(-width, -0.03, z - 0.012), (-width * 0.55, -0.058, z), (0, -0.063, z + 0.006), (width * 0.55, -0.058, z), (width, -0.03, z - 0.012)], [0.006] * 5, 4)
        chest.paint(faces_of(rib), BONE)
    sternum = kit.cone(chest.bm, (0, -0.064, 0.58), (0, -0.066, 0.72), 0.008, 0.009, 5)
    chest.paint(faces_of(sternum), BONE_DARK)
    spine = kit.cone(chest.bm, (0, -0.03, 0.48), (0, -0.03, 0.58), 0.014, 0.014, 6)
    chest.paint(faces_of(spine), BONE)
    parts.append(chest)

    # The coat over the chest: rust-brown, open at the front, with teal edges.
    coat = Part("coat", COAT, torso_weights, shade=0.12)

    def coat_color(row, column):
        if column in (0, 13):
            return TEAL
        return COAT_DARK if (row + column) % 5 == 2 else COAT

    kit.ragged_cone(coat, 0.765, 0.5, 0.088, 0.08, 14, 3, 0.8, 0.0, coat_color, COAT_DARK, gap=math.radians(40))
    parts.append(coat)

    # A teal scarf at the neck, and a sash from the right shoulder to the left hip.
    scarf = Part("scarf", TEAL, torso_weights, shade=0.08)
    kit.torus(scarf.bm, (0, 0.004, 0.755), (0, 0.15, 1), 0.06, 0.016, 12, 5)
    sash = kit.tube(scarf.bm, [(-0.085, -0.03, 0.74), (-0.06, -0.072, 0.67), (0.0, -0.08, 0.6), (0.06, -0.072, 0.53), (0.085, -0.04, 0.5)], [0.016, 0.018, 0.018, 0.018, 0.016], 5)
    scarf.paint(faces_of(sash), TEAL_DARK)
    knot = kit.sphere(scarf.bm, (0.08, -0.05, 0.5), (0.022, 0.018, 0.022), 6, 4)
    scarf.paint(faces_of(knot), TEAL)
    parts.append(scarf)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.52), 0.084, 0.083, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0.03, -0.07, 0.505), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), BRASS)
    pouch = kit.box(belt.bm, (0.075, -0.02, 0.47), (0.026, 0.034, 0.042))
    belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    pelvis = Part("pelvis", BONE, "hips")
    kit.cone(pelvis.bm, (0, 0, 0.43), (0, 0, 0.5), 0.06, 0.07, 10, squash=0.75)
    parts.append(pelvis)

    def coat_skirt_color(row, column):
        if column in (0, 15):
            return TEAL
        if row >= 4:
            return COAT_DARK
        return COAT_DARK if column % 4 == 1 else COAT

    # The skirt of the coat to the knees, open at the front, with a ragged hem.
    coat_skirt = Part("coatskirt", COAT, coat_weights)
    kit.ragged_cone(coat_skirt, 0.51, 0.22, 0.088, 0.15, 16, 5, 0.8, 0.07, coat_skirt_color, COAT_DARK, gap=math.radians(30), y_push=0.03)
    parts.append(coat_skirt)

    # A large iron ring of keys at the front of the belt.
    keys = Part("keys", IRON, "keys", shade=0.05)
    ring_c = KEYS + Vector((0, -0.006, -0.03))
    kit.torus(keys.bm, ring_c, (0.4, 1, 0), 0.034, 0.005, 14, 4)
    for index, angle in enumerate((-55, -25, 5, 35, 60)):
        a = math.radians(angle)
        top = ring_c + Vector((0.034 * math.sin(a) * 0.93, -0.004, -0.034 * math.cos(a)))
        down = Vector((0.3 * math.sin(a), -0.05, -1)).normalized()
        length = 0.05 + 0.014 * (index % 2)
        shank = kit.cone(keys.bm, top, top + down * length, 0.0045, 0.0045, 4)
        keys.paint(faces_of(shank), IRON_DARK if index % 2 else IRON)
        bit = kit.box(keys.bm, top + down * (length - 0.008) + Vector((0.008, 0, 0)), (0.012, 0.004, 0.012))
        keys.paint(faces_of(bit), IRON_DARK)
        bow = kit.torus(keys.bm, top + down * 0.007, (0.4, 1, 0), 0.009, 0.003, 8, 3)
        keys.paint(faces_of(bow), BRASS if index == 2 else IRON)
    parts.append(keys)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        guard = Part(f"guard.{side}", RUST, f"upperarm.{side}", shade=0.1)
        top = kit.sphere(guard.bm, s + Vector((0.01 * sign, 0, 0.012)), (0.044, 0.044, 0.032), 10, 7)
        guard.paint({f for v in top if v.co.z < s.z - 0.008 for f in v.link_faces}, RUST_DARK)
        rivet = kit.sphere(guard.bm, s + Vector((0.04 * sign, -0.02, 0.03)), (0.007, 0.007, 0.007), 4, 3)
        guard.paint(faces_of(rivet), STEEL)
        parts.append(guard)

        # A ragged coat sleeve over the upper arm, and a bare bone forearm.
        sleeve = Part(f"sleeve.{side}", COAT, f"upperarm.{side}", shade=0.08)
        kit.cone(sleeve.bm, s, e + (e - s).normalized() * 0.01, 0.03, 0.03, 8)
        cuff = kit.cone(sleeve.bm, e - (e - s).normalized() * 0.03, e + (e - s).normalized() * 0.014, 0.034, 0.036, 8)
        sleeve.paint(faces_of(cuff), COAT_DARK)
        parts.append(sleeve)

        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.014, 0.012, 6)
        bracer = kit.cone(forearm.bm, e + d * 0.05, w - d * 0.01, 0.022, 0.02, 8)
        forearm.paint(faces_of(bracer), LEATHER)
        parts.append(forearm)

        # A bony hand: a palm and three long fingers.
        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.018, (0.017, 0.014, 0.019), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.006 * index, -0.004, 0.004 * index))
            finger = kit.cone(hand.bm, w + d * 0.028 + offset, w + d * 0.054 + offset, 0.0045, 0.003, 4)
            hand.paint(faces_of(finger), BONE_DARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.018, 0.016, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.012, 0.006)), (0.024, 0.02, 0.024), 6, 5)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        # Tall boots wrapped with straps, to just below the knee.
        boot = Part(f"boot.{side}", LEATHER, f"shin.{side}", shade=0.1)
        kit.cone(boot.bm, knee - Vector((0, 0, 0.03)), ankle, 0.034, 0.03, 8)
        cuff = kit.cone(boot.bm, knee - Vector((0, 0, 0.012)), knee - Vector((0, 0, 0.05)), 0.04, 0.037, 8)
        boot.paint(faces_of(cuff), LEATHER_DARK)
        for z in (0.12, 0.17):
            strap = kit.torus(boot.bm, (LEG_X * sign, 0, z), (0, 0.15, 1), 0.033, 0.004, 8, 3)
            boot.paint(faces_of(strap), LEATHER_DARK)
        parts.append(boot)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.028, 0.024), (0.054, 0.112, 0.048))
        sole = kit.box(foot.bm, (LEG_X * sign, -0.028, 0.004), (0.058, 0.116, 0.01))
        foot.paint(faces_of(sole), LEATHER_DARK)
        parts.append(foot)
    return parts


def permit_parts():
    """The blank permit in the left hand, turned to the front and the camera side, with a red seal."""
    permit = Part("permit", PAPER, "hand.L", shade=0.04)
    normal = Vector((-0.55, -0.83, 0.1)).normalized()
    across = Z.cross(normal).normalized()
    up = normal.cross(across).normalized()
    if up.z < 0:
        up = -up
    base = TL + up * 0.004
    rows = []
    for v in (0.0, 0.5, 1.0):
        rows.append([base + across * lerp(-0.034, 0.034, u) + up * (v * 0.09) + normal * (0.006 * math.sin(u * math.pi)) for u in (0.0, 0.5, 1.0)])

    def color_of(face_side, row, column):
        return PAPER if face_side == "front" else PAPER_DARK

    edges = panel(permit, rows, [[p - normal * 0.002 for p in row] for row in rows], color_of)
    permit.paint(edges, PAPER_DARK)
    # The top edge curls back.
    curl = kit.cone(permit.bm, base + up * 0.09 - across * 0.036, base + up * 0.09 + across * 0.036, 0.006, 0.006, 6)
    permit.paint(faces_of(curl), PAPER_DARK)
    seal = kit.cone(permit.bm, base + up * 0.02 + across * 0.016 + normal * 0.001, base + up * 0.02 + across * 0.016 + normal * 0.006, 0.011, 0.01, 8)
    permit.paint(faces_of(seal), SEAL)
    return [permit]


def crow_parts():
    """The crow on his right shoulder: it looks at the permit."""
    crow = Part("crow", CROW, "crow", shade=0.1)
    body = CROW_C + Vector((0, 0.005, 0.028))
    kit.sphere(crow.bm, body, (0.02, 0.032, 0.022), 8, 6)
    head = body + Vector((0.004, -0.028, 0.022))
    kit.sphere(crow.bm, head, (0.016, 0.017, 0.016), 8, 6)
    beak = kit.cone(crow.bm, head + Vector((0.002, -0.012, -0.002)), head + Vector((0.012, -0.04, -0.008)), 0.007, 0.001, 4)
    crow.paint(faces_of(beak), BEAK)
    for sign in (1, -1):
        eye = kit.sphere(crow.bm, head + Vector((0.013 * sign, -0.006, 0.004)), (0.0035, 0.0035, 0.0035), 4, 3)
        crow.paint(faces_of(eye), CROW_EYE)
        wing = kit.cone(crow.bm, body + Vector((0.018 * sign, -0.016, 0.004)), body + Vector((0.02 * sign, 0.04, -0.004)), 0.016, 0.004, 5, squash=0.5)
        crow.paint(faces_of(wing), CROW_LIGHT)
        leg = kit.cone(crow.bm, body + Vector((0.008 * sign, 0, -0.016)), CROW_C + Vector((0.008 * sign, -0.004, -0.004)), 0.003, 0.003, 3)
        crow.paint(faces_of(leg), BEAK)
    tail = kit.cone(crow.bm, body + Vector((0, 0.024, 0.002)), body + Vector((0, 0.06, -0.014)), 0.014, 0.004, 5, squash=0.35)
    crow.paint(faces_of(tail), CROW_LIGHT)
    return [crow]


def polearm_parts():
    polearm = Part("polearm", WOOD, "polearm", shade=0.04)
    butt = GRIP_R - POLE * POLE_BACK
    head = GRIP_R + POLE * POLE_FRONT
    kit.cone(polearm.bm, butt, head, 0.0105, 0.0095, 6)
    cap = kit.cone(polearm.bm, butt - POLE * 0.012, butt + POLE * 0.03, 0.013, 0.012, 6)
    polearm.paint(faces_of(cap), IRON)
    wrap = kit.cone(polearm.bm, GRIP_R - POLE * 0.03, GRIP_R + POLE * 0.04, 0.012, 0.012, 6)
    polearm.paint(faces_of(wrap), LEATHER_DARK)
    socket = kit.cone(polearm.bm, head - POLE * 0.05, head + POLE * 0.01, 0.014, 0.013, 6)
    polearm.paint(faces_of(socket), IRON_DARK)

    def p(a, h=0.0, s=0.0):
        """A point at the head: `a` along the shaft, `h` up from it, `s` to its side."""
        return head + POLE * a + POLE_UP * h + POLE_SIDE * s

    # The bill: a wide crescent blade above the shaft, flat in the plane of
    # the shaft and up, so the camera sees its face.
    outline = [(-0.01, 0.0, 0.012), (0.02, 0.0, 0.06), (0.05, 0.0, 0.088), (0.08, 0.0, 0.094), (0.11, 0.0, 0.07), (0.13, 0.0, 0.028)]

    def grid(offset):
        rows = []
        for a, low, high in outline:
            rows.append([p(a, low, offset), p(a, (low + high) * 0.6, offset), p(a, high, offset)])
        return rows

    def color_of(face_side, row, column):
        return STEEL if column == 1 else RUST

    edges = panel(polearm, grid(0.003), grid(-0.003), color_of)
    polearm.paint(edges, RUST_DARK)
    # A spike past the head, and a hook that curls down and forward under it.
    spike = kit.cone(polearm.bm, p(0.0), p(0.16), 0.01, 0.001, 4)
    polearm.paint(faces_of(spike), STEEL)
    hook = kit.tube(polearm.bm, [p(0.06, -0.004), p(0.07, -0.04), p(0.05, -0.07), p(0.02, -0.075)], [0.01, 0.008, 0.005, 0.002], 4)
    polearm.paint(faces_of(hook), RUST)
    # A small brass bell under the head, and a teal rag.
    bell_top = p(-0.03, -0.012)
    chain = kit.cone(polearm.bm, bell_top, bell_top - Z * 0.02, 0.002, 0.002, 3)
    polearm.paint(faces_of(chain), IRON)
    bell = kit.cone(polearm.bm, bell_top - Z * 0.02, bell_top - Z * 0.05, 0.008, 0.018, 8)
    polearm.paint(faces_of(bell), BRASS)
    rag = kit.cone(polearm.bm, p(-0.07, 0.0, 0.0), p(-0.12, -0.08, -0.01), 0.02, 0.004, 4, squash=0.25)
    polearm.paint(faces_of(rag), TEAL)
    return [polearm]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BackwatchBailiff", BONES)
    parts = head_parts() + body_parts() + limb_parts() + permit_parts() + crow_parts() + polearm_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BackwatchBailiffMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the right arm, to drive the polearm. The polearm aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "polearm_aim": kit.add_empty("polearm_aim"),
    }
    bones = rig.pose.bones
    ik = bones["forearm.R"].constraints.new("IK")
    ik.name = "IK"
    ik.target = empties["ik_hand.R"]
    ik.pole_target = rig
    ik.pole_subtarget = "pole.R"
    ik.pole_angle = math.radians(POLE_ANGLE)
    ik.chain_count = 2
    aim = bones["polearm"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["polearm_aim"]
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

    polearm_rest = rig.data.bones["polearm"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the polearm that points its head along `direction`."""
        return POLE.rotation_difference(Vector(direction).normalized()) @ polearm_rest

    def held(base, hand, direction):
        """The right hand and the polearm by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "polearm_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "polearm_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, look=0.0, chat=0.0):
        """
        On watch: the left foot forward, the chest to the front and the skull
        turned back over his right shoulder, to the camera side (Pivot).
        `look` turns it further back. `chat` opens the jaw and turns the crow
        to him.
        """
        return held(
            {
                "hips@loc": at("hips", (0, 0, -0.01 - breath * 0.004)),
                "hips": t("hips", (Z, -4)),
                "spine": t("spine", (Z, -2 - look * 4), (X, 3 + breath)),
                "chest": t("chest", (Z, -look * 8), (X, -2 - breath * 2)),
                "neck": t("neck", (Z, -14 - look * 24), (X, -2)),
                "head": t("head", (Z, -18 - look * 34), (X, -4 + breath * 3), (Y, -6)),
                "jaw": t("jaw", (X, 4 + chat * 16)),
                "hat": t("hat", (X, -14), (Y, -4)),
                "thigh.L": t("thigh.L", (X, -16), (Y, -4)),
                "shin.L": t("shin.L", (X, 12)),
                "foot.L": t("foot.L", (X, 2)),
                "thigh.R": t("thigh.R", (X, 12), (Y, 4)),
                "shin.R": t("shin.R", (X, 8)),
                "foot.R": t("foot.R", (X, -18)),
                "coat.B": t("coat.B", (X, 4 + breath * 2)),
                "keys": t("keys", (X, -breath * 3)),
                "upperarm.L": t("upperarm.L", (X, -breath * 3)),
                "forearm.L": t("forearm.L", (X, -breath * 2)),
                "crow": t("crow", (Z, -10 + chat * 40), (X, -chat * 10)),
                "crow@loc": at("crow", (0, 0, chat * 0.01)),
            },
            (-0.15, -0.02, 0.5 - breath * 0.006),
            (-0.12, 1, 0.32 + breath * 0.03),
        )

    def winded(breath=0.0):
        """Low HP: bent over, the polearm planted beside him, the skull and the hat low."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.02, -0.06 - breath * 0.005)),
                hips=t("hips", (Z, -6)),
                spine=t("spine", (X, 20 + breath * 4)),
                chest=t("chest", (X, 12 + breath * 3), (Y, 4)),
                neck=t("neck", (Z, -10), (X, 8)),
                head=t("head", (Z, -16), (X, 12 + breath * 4), (Y, -12)),
                jaw=t("jaw", (X, 18)),
                hat=t("hat", (Y, -14), (X, 8)),
                thigh__L=t("thigh.L", (X, -30), (Y, -6)),
                shin__L=t("shin.L", (X, 40)),
                foot__L=t("foot.L", (X, -8)),
                thigh__R=t("thigh.R", (X, 6), (Y, 6)),
                shin__R=t("shin.R", (X, 34)),
                foot__R=t("foot.R", (X, -30)),
                coat__B=t("coat.B", (X, 16)),
                keys=t("keys", (X, 16)),
                upperarm__L=t("upperarm.L", (X, 30), (Y, 10)),
                forearm__L=t("forearm.L", (X, 20)),
                crow=t("crow", (Z, 30), (X, 20)),
            ),
            (-0.17, -0.14, 0.36 - breath * 0.01),
            (-0.05, -0.25, 1),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the crow flaps up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.016 - 0.006 * amount)),
            spine=t("spine", (Z, -2), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            neck=t("neck", (Z, -6)),
            head=t("head", (Z, -6), (X, -18 * amount)),
            jaw=t("jaw", (X, 24 * amount)),
            hat=t("hat", (X, -16 * amount)),
            coat__B=t("coat.B", (X, 14 * amount)),
            keys=t("keys", (X, -24 * amount)),
            upperarm__L=t("upperarm.L", (X, -30 * amount), (Y, 20 * amount)),
            crow=t("crow", (X, -30 * amount)),
            crow_at_loc=at("crow", (0, 0.02 * amount, 0.05 * amount)),
            ik_hand__R_at_pos=Vector((-0.16, 0.04 * amount, 0.52 + 0.02 * amount)),
            polearm_aim_at_rot=aimed((-0.12, 1, 0.32 + 0.5 * amount)),
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
            coat__B=t("coat.B", (X, -16)),
            keys=t("keys", (X, 20)),
            crow_at_loc=at("crow", (0, 0.08, 0.16)),
            crow=t("crow", (X, -40)),
            ik_hand__R_at_pos=Vector((-0.16, -0.02, 0.4)),
            polearm_aim_at_rot=aimed((-0.2, 1, -0.3)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the polearm flat beside him, the hat off. The crow is gone."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.05)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (Z, 0), (X, -4)),
            chest=t("chest", (Z, 0), (X, 0)),
            neck=t("neck", (Z, -10)),
            head=t("head", (X, -10), (Z, -30)),
            jaw=t("jaw", (X, 26)),
            hat=t("hat", (X, -50), (Y, -20)),
            hat_at_loc=at("hat", (-0.04, 0.06, 0.1)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            coat__B=t("coat.B", (X, -50)),
            keys=t("keys", (X, -60)),
            # On his back, his front is up: the crow flies up and away.
            crow_at_loc=at("crow", (0, -0.5, 0.2)),
            crow_at_scale=0.02,
            forearm__R_slash_IK=0.0,
            upperarm__R=t("upperarm.R", (Y, 30), (X, -10)),
            polearm_slash_Aim=1.0,
            polearm_aim_at_rot=aimed((-0.3, 1, -0.02)),
        )

    def crouch(base):
        """Low on one knee, the polearm upright, as a summon starts and a Rebirth gets up."""
        return pose(
            winded(),
            hips_at_loc=at("hips", (0, 0.03, -0.17)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, -14)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 78)),
            foot__L=t("foot.L", (X, -2)),
            thigh__R=t("thigh.R", (X, 12), (Y, 8)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            crow_at_loc=at("crow", (0, 0, 0.12)),
            crow_at_scale=0.5,
        )

    def proud(base):
        """Up again, the polearm upright and the permit high: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, 0.0)),
                spine=t("spine", (Z, 0), (X, -2)),
                chest=t("chest", (Z, 0), (X, -8)),
                neck=t("neck", (Z, 0)),
                head=t("head", (Z, 0), (X, -10)),
                jaw=t("jaw", (X, 14)),
                thigh__L=t("thigh.L", (X, -4), (Y, -4)),
                shin__L=t("shin.L", (X, 4)),
                thigh__R=t("thigh.R", (X, 2), (Y, 4)),
                shin__R=t("shin.R", (X, 4)),
                foot__R=t("foot.R", (X, -6)),
                upperarm__L=t("upperarm.L", (X, -40)),
                crow_at_loc=at("crow", (0, 0, 0.03)),
            ),
            (-0.16, -0.06, 0.58),
            (-0.04, -0.1, 1),
        )

    def step(front):
        """A slow, stiff march (Heavy), the hook trailing. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03)),
            hips=t("hips", (Z, -4 * front), (Y, 4 * front)),
            spine=t("spine", (Z, -2), (X, 6)),
            chest=t("chest", (Z, 4 * front)),
            head=t("head", (Z, -18), (X, -4), (Y, 6 * front)),
            jaw=t("jaw", (X, 4 + 8 * (front > 0))),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -30)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 10)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 18)),
                f"foot__{back}": t(f"foot.{back}", (X, 8)),
                "coat__B": t("coat.B", (X, 10), (Y, 6 * front)),
                "keys": t("keys", (Y, 14 * front), (X, -6)),
                "crow": t("crow", (Y, -10 * front)),
                "ik_hand__R_at_pos": Vector((-0.15, 0.0, 0.5)),
                "polearm_aim_at_rot": aimed((-0.12, 1, 0.24)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.008)),
            spine=t("spine", (Z, -2), (X, 6)),
            head=t("head", (Z, -18), (X, -4)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -24)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 46)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 6)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -6)),
                "coat__B": t("coat.B", (X, 6)),
                "keys": t("keys", (X, 6)),
                "crow@loc": at("crow", (0, 0, 0.012)),
                "ik_hand__R_at_pos": Vector((-0.15, 0.01, 0.52)),
                "polearm_aim_at_rot": aimed((-0.12, 1, 0.3)),
            },
        )

    # The attack: he turns to his right and pulls the hook up behind him,
    # then swings it round his right side to the front (Pivot). The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # hook passes his front at frame 15 of 30.
    def wind(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.02, -0.03)),
                hips=t("hips", (Z, -22)),
                spine=t("spine", (Z, -14), (X, -2)),
                chest=t("chest", (Z, -14), (X, -6)),
                neck=t("neck", (Z, -10)),
                head=t("head", (Z, -10), (X, -6)),
                jaw=t("jaw", (X, 20)),
                thigh__L=t("thigh.L", (X, -14), (Y, -8)),
                shin__L=t("shin.L", (X, 16)),
                thigh__R=t("thigh.R", (X, 14), (Y, 8)),
                shin__R=t("shin.R", (X, 18)),
                foot__R=t("foot.R", (X, -22)),
                coat__B=t("coat.B", (Y, 10)),
                keys=t("keys", (Y, -16)),
                upperarm__L=t("upperarm.L", (X, -30), (Y, 10)),
                crow_at_loc=at("crow", (0, 0.02, 0.06)),
                crow=t("crow", (X, -20)),
            ),
            (-0.2, 0.08, 0.62),
            (-0.25, 1, 0.7),
        )

    def swing(base, through, hand, direction):
        """The body turns from his right (`through` -1) to his left (1). `hand` and `direction` drive the polearm."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.04, -0.06)),
                hips=t("hips", (Z, 4 + through * 18)),
                spine=t("spine", (Z, 4 + through * 12), (X, 10)),
                chest=t("chest", (Z, 4 + through * 10)),
                neck=t("neck", (Z, -4)),
                head=t("head", (Z, -6), (X, -2)),
                jaw=t("jaw", (X, 26)),
                thigh__L=t("thigh.L", (X, -46), (Y, -8)),
                shin__L=t("shin.L", (X, 46)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 24), (Y, 8)),
                shin__R=t("shin.R", (X, 14)),
                foot__R=t("foot.R", (X, -14)),
                coat__B=t("coat.B", (X, 20), (Y, -16 * through)),
                keys=t("keys", (Y, 24 * through), (X, -10)),
                upperarm__L=t("upperarm.L", (X, -30), (Y, 10)),
                crow_at_loc=at("crow", (0, 0.03, 0.08)),
                crow=t("crow", (X, -30)),
            ),
            hand,
            direction,
        )

    clips = []
    # The idle has a look further back over the shoulder (Pivot), and he
    # chats with the crow.
    idle = Clip("idle", 72, loop=True)
    for frame, breath, look, chat in ((0, 0, 0, 0), (12, 0.5, 0, 0), (22, 1, 1, 0), (32, 0.8, 1, 0), (40, 0.6, 0, 1), (46, 0.5, 0, 0), (52, 0.4, 0, 1), (60, 0.3, 0, 0), (72, 0, 0, 0)):
        idle.key(frame, stand(breath, look, chat))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    walk = Clip("walk", 32, loop=True)
    walk.key(0, step(1)).key(8, passing("R")).key(16, step(-1)).key(24, passing("L")).key(32, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, wind(stand()))
    attack.key(12, swing(stand(), -1, (-0.22, -0.06, 0.56), (-1, 0.1, 0.25)))
    attack.key(15, swing(stand(), 0, (-0.12, -0.18, 0.55), (0.05, -1, 0.08)))
    attack.key(19, swing(stand(), 1, (0.0, -0.14, 0.53), (0.7, -0.7, -0.05)))
    attack.key(23, swing(stand(), 0, (-0.14, -0.12, 0.54), (-0.6, -0.7, 0.2)))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up,
    # and the crow comes back.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.19))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "backwatch-bailiff.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
