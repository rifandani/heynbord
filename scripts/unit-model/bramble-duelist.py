"""
Bramble Duelist (`elf.brambleDuelist`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a young elf woman with long golden
hair, a worn green coat with pale lining and split tails, brown trousers and
tall brown boots. Her right hand, on the camera side, holds a slender thorn
rapier with a swept guard, small thorns and leaves. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/bramble-duelist.glb`;
then `bun unit-model:pack bramble-duelist` packs it for the game.

She has a narrow fencing stance, with little protection and a long rapier
line. Her attack is a quick wind-up and lunge: the point hits at frame 15 of
30. Two hair bones and a coat bone give secondary motion. She has no Keyword
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#e8b48c")
SKIN_DARK = hex_color("#c98f70")
LIPS = hex_color("#a96055")
HAIR = hex_color("#d2a856")
HAIR_LIGHT = hex_color("#ecd083")
HAIR_DARK = hex_color("#9e7537")
EYES = hex_color("#26351f")
BROW = hex_color("#967037")
COAT = hex_color("#506f38")
COAT_DARK = hex_color("#354d2b")
COAT_LIGHT = hex_color("#71894b")
COAT_WORN = hex_color("#64704a")
CREAM = hex_color("#e9ddbc")
LEAF = hex_color("#7d9949")
LEAF_DARK = hex_color("#45632e")
LEATHER = hex_color("#754b2d")
LEATHER_DARK = hex_color("#472d1c")
TROUSERS = hex_color("#65503a")
BOOT = hex_color("#68432a")
AMBER = hex_color("#c99b47")
WOOD = hex_color("#4c3421")
THORN = hex_color("#89683d")
STEEL = hex_color("#bdc3b8")
STEEL_LIGHT = hex_color("#e0e4d8")
STEEL_DARK = hex_color("#727b70")

# --- Proportions ---------------------------------------------------------------

# A lean young elf woman.
HIP_Z = 0.46
WAIST_Z = 0.54
CHEST_Z = 0.625
SHOULDER_Z = 0.705
NECK_Z = 0.73
HEAD_C = Vector((0, -0.008, 0.845))
KNEE_Z = 0.26
ANKLE_Z = 0.05
LEG_X = 0.052

# The right hand is forward on the camera side. The left hand is back for
# balance. These are the rest (bind) positions.
SR = Vector((-0.098, 0, SHOULDER_Z))
ER = Vector((-0.15, -0.035, 0.61))
WR = Vector((-0.145, -0.18, 0.63))
TR = WR + (WR - ER).normalized() * 0.045
GRIP_R = WR + (WR - ER).normalized() * 0.022
RAPIER = Vector((0, -1, 0.035)).normalized()

SL = Vector((0.098, 0, SHOULDER_Z))
EL = Vector((0.145, 0.07, 0.62))
WL = Vector((0.175, 0.16, 0.675))
TL = WL + (WL - EL).normalized() * 0.045

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.004, NECK_Z), (0, -0.008, 0.765), "chest"),
    ("head", (0, -0.008, 0.765), (0, -0.008, 0.94), "neck"),
    # The long back hair swings in two sections.
    ("hair1", (0, 0.06, 0.85), (0, 0.105, 0.72), "head"),
    ("hair2", (0, 0.105, 0.72), (0, 0.14, 0.56), "hair1"),
    ("coat.B", (0, 0.07, 0.48), (0, 0.13, 0.18), "hips"),
    # The pole keeps the right elbow out, down and back during the lunge.
    ("pole.R", (-0.28, 0.16, 0.5), (-0.28, 0.16, 0.55), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.025 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.085, 0.02), f"shin.{side}"),
    ]
BONES.append(("rapier", tuple(GRIP_R), tuple(GRIP_R + RAPIER * 0.1), "hand.R"))

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.49, 0.57)
    return blend("spine", "chest", co.z, 0.59, 0.66)


def hair_weights(co):
    """The front locks follow the head; the long back hair follows two bones."""
    if co.y < 0.015:
        return {"head": 1.0}
    if co.z > 0.8:
        return blend("hair1", "head", co.z, 0.81, 0.87)
    if co.z > 0.66:
        return blend("hair2", "hair1", co.z, 0.67, 0.79)
    return {"hair2": 1.0}


def coat_weights(co):
    """The tails follow the hips at the top, then the legs and back panel."""
    t = clamp01((0.49 - co.z) / 0.32)
    back = clamp01(co.y / 0.11)
    side = co.x / 0.14
    return {
        "hips": 1 - t,
        "coat.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side),
        "thigh.R": (1 - back) * t * clamp01(-side),
    }


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
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.057, 0.063, 0.075), 14, 10)
    # A small rounded chin and a fine nose.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.018, -0.051)), (0.039, 0.041, 0.027), 10, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.058, -0.003)), HEAD_C + Vector((0, -0.075, -0.014)), 0.009, 0.0015, 5)
    for sign in (1, -1):
        # Long elf ears go out and up through the hair.
        kit.cone(head.bm, HEAD_C + Vector((0.052 * sign, 0.006, -0.002)), HEAD_C + Vector((0.121 * sign, 0.043, 0.047)), 0.014, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.022 * sign, -0.054, 0.008)), (0.01, 0.0065, 0.0075), 8, 6)
        # Keen level brows and a small smile: young, but sure of the point.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.024 * sign, -0.057, 0.024)), (0.015, 0, 0.002 * sign), (0, 0.004, 0), (0, 0, 0.003))
        face.paint(faces_of(brow), BROW)
    mouth = kit.tube(face.bm, [HEAD_C + Vector((-0.014, -0.058, -0.031)), HEAD_C + Vector((0, -0.062, -0.033)), HEAD_C + Vector((0.014, -0.058, -0.03))], [0.0022, 0.0028, 0.0022], 4)
    face.paint(faces_of(mouth), LIPS)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.004, 0.71), (0, -0.008, 0.79), 0.023, 0.021, 8)
    parts.append(neck)

    # The scalp and face-framing locks stay close to the head.
    scalp = Part("scalp", HAIR, "head", shade=0.1)
    verts = kit.sphere(scalp.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.065, 0.072, 0.08), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.03 or (v.co.y < HEAD_C.y - 0.034 and v.co.z < HEAD_C.z + 0.045)]
    kit.bmesh.ops.delete(scalp.bm, geom=face_verts, context="VERTS")
    for index, x in enumerate((-0.042, -0.014, 0.014, 0.042)):
        wave = kit.tube(scalp.bm, [HEAD_C + Vector((x * 0.7, -0.052, 0.052)), HEAD_C + Vector((x, 0.005, 0.077)), HEAD_C + Vector((x * 1.2, 0.06, 0.045))], [0.012, 0.016, 0.009], 5)
        scalp.paint(faces_of(wave), (HAIR_LIGHT, HAIR)[index % 2])
    for sign in (1, -1):
        lock = kit.tube(scalp.bm, [HEAD_C + Vector((0.052 * sign, -0.029, 0.025)), HEAD_C + Vector((0.066 * sign, -0.035, -0.055)), HEAD_C + Vector((0.052 * sign, -0.025, -0.13)), HEAD_C + Vector((0.04 * sign, -0.005, -0.19))], [0.016, 0.015, 0.009, 0.0025], 5)
        scalp.paint(faces_of(lock), HAIR_LIGHT)
    parts.append(scalp)

    # Long golden locks fall to the middle of her back. Their narrow shape
    # keeps the rapier and the open stance clear.
    hair = Part("hair", HAIR, hair_weights, shade=0.1)
    for index, angle in enumerate(range(-130, 131, 26)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.058 * math.sin(a), 0.06 * math.cos(a) + 0.01, 0.02))
        length = 0.27 if abs(angle) < 80 else 0.21
        bottom = top + Vector((0.025 * math.sin(a), 0.055 + 0.015 * math.cos(a), -length))
        middle = top.lerp(bottom, 0.42) + Vector((0.012 * math.sin(a), 0.012 * math.cos(a), 0.014))
        low = top.lerp(bottom, 0.76) + Vector((-0.009 * math.sin(a), 0.008, 0.0))
        lock = kit.tube(hair.bm, [top, middle, low, bottom], [0.021, 0.019, 0.011, 0.003], 5)
        hair.paint(faces_of(lock), (HAIR_LIGHT, HAIR, HAIR_DARK)[index % 3])
    tie = kit.torus(hair.bm, HEAD_C + Vector((0, 0.078, -0.035)), (0, 0.5, 1), 0.018, 0.004, 10, 3)
    hair.paint(faces_of(tie), LEATHER_DARK)
    # A small spray of leaves holds the hair at one side.
    for x, z, color in ((0.043, 0.066, LEAF), (0.056, 0.048, LEAF_DARK), (-0.045, 0.063, LEAF)):
        leaf(hair, HEAD_C + Vector((x, 0.035, z)), (x * 8, 0.5, 0.7), 0.036, 0.012, color)
    parts.append(hair)
    return parts


def coat_tails():
    """An open worn skirt, with pale lining and two long split back tails."""
    part = Part("coat.tails", COAT, coat_weights, shade=0.12)
    columns, rows = 16, 5
    gap = math.radians(36)

    def grid(inset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                theta = lerp(gap, 2 * math.pi - gap, column / columns)
                back = (1 - math.cos(theta)) / 2
                # A raised notch at the back makes two separate long tails.
                notch = 0.045 * math.exp(-((theta - math.pi) / 0.32) ** 2) * back
                tear = 0.022 * (((column * 7) % 5) / 4)
                hem = 0.3 - 0.13 * back + notch + tear
                z = lerp(0.49, hem, v)
                radius = lerp(0.075, 0.135 + 0.025 * back, v**0.85) - inset
                y_push = 0.035 * v * back
                line.append((radius * math.sin(theta), -radius * math.cos(theta) * 0.78 + y_push, z))
            result.append(line)
        return result

    _, outer = kit.sheet(part.bm, grid(0.0))
    _, inner = kit.sheet(part.bm, grid(0.006))
    for face, row, column in outer:
        if column in (0, columns - 1):
            part.paint([face], CREAM)
        elif row == rows - 1:
            part.paint([face], COAT_DARK)
        elif (row * 5 + column) % 13 == 4:
            part.paint([face], COAT_WORN)
        else:
            part.paint([face], COAT)
    for face, _row, _column in inner:
        part.paint([face], CREAM)
    for index, angle in enumerate((-140, -92, -44, 44, 92, 140)):
        a = math.radians(angle)
        back = (1 - math.cos(a)) / 2
        out = Vector((math.sin(a), -math.cos(a) * 0.78, 0))
        base = Vector((0, 0.035 * back, 0.29 - 0.1 * back)) + out * (0.13 + 0.02 * back)
        leaf(part, base, out * 0.35 + Vector((0, 0.08, -1)), 0.055, 0.018, (LEAF, COAT_LIGHT, LEAF_DARK)[index % 3])
    return part


def body_parts():
    parts = []
    blouse = Part("blouse", CREAM, torso_weights, shade=0.12)
    kit.cone(blouse.bm, (0, 0, 0.46), (0, 0, 0.715), 0.059, 0.075, 12, squash=0.72)
    for z in (0.56, 0.6, 0.64):
        lace = kit.slab(blouse.bm, (0, -0.055, z), (0.014, 0, 0), (0, 0.003, 0), (0, 0, 0.0025))
        blouse.paint(faces_of(lace), LEATHER)
    parts.append(blouse)

    def coat_color(row, column):
        if row == 0:
            return COAT_LIGHT
        return COAT_WORN if (row * 5 + column) % 11 == 3 else COAT

    # The fitted coat opens at the front, showing the pale blouse and lining.
    coat = Part("coat", COAT, torso_weights, shade=0.12)
    kit.ragged_cone(coat, 0.725, 0.47, 0.083, 0.068, 12, 3, 0.76, 0.0, coat_color, CREAM, gap=math.radians(25))
    for sign in (1, -1):
        lapel = kit.tube(coat.bm, [(0.055 * sign, -0.041, 0.715), (0.043 * sign, -0.058, 0.655), (0.022 * sign, -0.058, 0.575)], [0.009, 0.008, 0.004], 4)
        coat.paint(faces_of(lapel), COAT_LIGHT)
        lining = kit.tube(coat.bm, [(0.046 * sign, -0.046, 0.705), (0.035 * sign, -0.062, 0.65), (0.017 * sign, -0.061, 0.58)], [0.004, 0.004, 0.002], 4)
        coat.paint(faces_of(lining), CREAM)
    # Small worn leaves on the shoulders, not a large mantle.
    for index, (x, y) in enumerate(((-0.072, -0.025), (-0.078, 0.015), (-0.055, 0.045), (0.072, -0.025), (0.078, 0.015), (0.055, 0.045))):
        sign = 1 if x > 0 else -1
        leaf(coat, (x, y, 0.72), (0.65 * sign, 0.25, -0.8), 0.065, 0.022, (COAT_LIGHT, LEAF, COAT_DARK)[index % 3])
    parts.append(coat)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.47), (0, 0, 0.502), 0.077, 0.074, 12, squash=0.78)
    buckle = kit.box(belt.bm, (0, -0.06, 0.486), (0.022, 0.007, 0.02))
    belt.paint(faces_of(buckle), AMBER)
    tongue = kit.box(belt.bm, (0.026, -0.059, 0.486), (0.026, 0.005, 0.009))
    belt.paint(faces_of(tongue), LEATHER)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.405), (0, 0, 0.48), 0.066, 0.065, 12, squash=0.78)
    parts.append(hips)
    parts.append(coat_tails())
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", COAT, f"upperarm.{side}", shade=0.1)
        kit.sphere(sleeve.bm, s + Vector((0.004 * sign, 0, -0.003)), (0.03, 0.03, 0.028), 8, 6)
        verts = kit.cone(sleeve.bm, s, e, 0.026, 0.022, 8)
        sleeve.paint({f for f in faces_of(verts) if f.calc_center_median().y > e.y + 0.025}, COAT_WORN)
        parts.append(sleeve)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.08)
        cuff = kit.cone(bracer.bm, e - d * 0.008, e + d * 0.026, 0.025, 0.023, 8)
        bracer.paint(faces_of(cuff), CREAM)
        verts = kit.cone(bracer.bm, e + d * 0.026, w - d * 0.008, 0.022, 0.017, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.014 for f in v.link_faces}, LEATHER_DARK)
        leaf(bracer, (e + w) / 2 + Vector((0.006 * sign, -0.012, 0.01)), -d, 0.042, 0.013, LEAF)
        parts.append(bracer)

        hand = Part(f"hand.{side}", LEATHER_DARK if side == "R" else SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.023, (0.015, 0.014, 0.021), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.018)), knee, 0.038, 0.03, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}", shade=0.1)
        kit.cone(boot.bm, knee + Vector((0, 0, 0.018)), ankle, 0.036, 0.027, 8)
        cuff = kit.cone(boot.bm, knee + Vector((0, 0, 0.026)), knee - Vector((0, 0, 0.018)), 0.04, 0.036, 8)
        boot.paint(faces_of(cuff), LEATHER_DARK)
        for z in (0.11, 0.19):
            strap = kit.torus(boot.bm, (LEG_X * sign, 0, z), (0, 0.15, 1), 0.031, 0.0035, 8, 3)
            boot.paint(faces_of(strap), LEATHER_DARK)
        leaf(boot, knee + Vector((0.018 * sign, -0.02, -0.025)), (0.25 * sign, -0.3, -1), 0.05, 0.017, COAT_LIGHT)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.032, 0.024), (0.05, 0.112, 0.047))
        heel = kit.box(foot.bm, (LEG_X * sign, 0.014, 0.012), (0.048, 0.028, 0.023))
        foot.paint(faces_of(heel), LEATHER_DARK)
        parts.append(foot)
    return parts


def rapier_parts():
    rapier = Part("rapier", STEEL, "rapier", shade=0.025)
    side = X
    edge = RAPIER.cross(side).normalized()
    guard = GRIP_R + RAPIER * 0.026

    handle = kit.cone(rapier.bm, GRIP_R - RAPIER * 0.052, GRIP_R + RAPIER * 0.018, 0.0075, 0.008, 6)
    rapier.paint(faces_of(handle), LEATHER_DARK)
    pommel = kit.sphere(rapier.bm, GRIP_R - RAPIER * 0.055, (0.011, 0.011, 0.011), 6, 4)
    rapier.paint(faces_of(pommel), AMBER)
    # A dark vine wraps the grip.
    wrap = []
    for index in range(8):
        along = lerp(-0.046, 0.012, index / 7)
        angle = index * 1.8
        wrap.append(GRIP_R + RAPIER * along + (side * math.cos(angle) + edge * math.sin(angle)) * 0.008)
    vine = kit.tube(rapier.bm, wrap, [0.002] * len(wrap), 3, caps=False)
    rapier.paint(faces_of(vine), WOOD)

    # The swept thorn guard has back-curved quillons and a knuckle bow.
    quillons = kit.tube(rapier.bm, [guard - side * 0.048 - RAPIER * 0.015, guard - side * 0.03, guard, guard + side * 0.03, guard + side * 0.048 - RAPIER * 0.015], [0.003, 0.0045, 0.005, 0.0045, 0.003], 5)
    rapier.paint(faces_of(quillons), THORN)
    bow = kit.tube(rapier.bm, [guard + side * 0.018, guard + side * 0.035 - RAPIER * 0.02, GRIP_R + side * 0.031 - RAPIER * 0.045, GRIP_R + side * 0.014 - RAPIER * 0.06, GRIP_R - RAPIER * 0.052], [0.004, 0.004, 0.0035, 0.003, 0.003], 4)
    rapier.paint(faces_of(bow), WOOD)
    ring = kit.torus(rapier.bm, guard, RAPIER, 0.019, 0.003, 12, 3)
    rapier.paint(faces_of(ring), AMBER)

    # A long diamond-section blade: the center ridge catches the light.
    start = guard + RAPIER * 0.005
    length = 0.49
    rows = 8

    def grid(offset):
        result = []
        for row in range(rows + 1):
            s = row / rows
            center = start + RAPIER * (length * s) + side * offset
            width = lerp(0.009, 0.0007, s**0.8)
            result.append([center - edge * width, center, center + edge * width])
        return result

    def color_of(_face_side, _row, column):
        return STEEL_LIGHT if column == 0 else STEEL

    edges = panel(rapier, grid(0.0022), grid(-0.0022), color_of)
    rapier.paint(edges, STEEL_DARK)

    # A vine and short hooked thorns stay near the forte, so the point is clean.
    points = []
    for index in range(7):
        along = 0.015 + index * 0.025
        angle = index * 1.65
        points.append(start + RAPIER * along + (side * math.cos(angle) + edge * math.sin(angle)) * 0.006)
    vine = kit.tube(rapier.bm, points, [0.0028] * len(points), 4, caps=False)
    rapier.paint(faces_of(vine), WOOD)
    for index, along in enumerate((0.025, 0.065, 0.11, 0.16)):
        sign = 1 if index % 2 else -1
        base = start + RAPIER * along
        out = (side * (0.8 * sign) + edge * 0.3 - RAPIER * 0.55).normalized()
        thorn = kit.cone(rapier.bm, base, base + out * 0.024, 0.005, 0.0008, 4)
        rapier.paint(faces_of(thorn), THORN)
    for sign, color in ((1, LEAF), (-1, LEAF_DARK)):
        leaf(rapier, guard + side * (0.014 * sign), side * (0.8 * sign) - RAPIER * 0.5 + edge * 0.3, 0.036, 0.012, color)
    return [rapier]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BrambleDuelist", BONES)
    parts = head_parts() + body_parts() + limb_parts() + rapier_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BrambleDuelistMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

POLE_ANGLE = -90


def add_controls(rig):
    """Right-arm IK places the hand; Aim keeps the rapier on its fencing line."""
    empties = {"ik_hand.R": kit.add_empty("ik_hand.R", WR)}
    bones = rig.pose.bones
    ik = bones["forearm.R"].constraints.new("IK")
    ik.name = "IK"
    ik.target = empties["ik_hand.R"]
    ik.pole_target = rig
    ik.pole_subtarget = "pole.R"
    ik.pole_angle = math.radians(POLE_ANGLE)
    ik.chain_count = 2
    aim = bones["rapier"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = kit.add_empty("rapier_aim")
    empties["rapier_aim"] = aim.target
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

    rapier_rest = rig.data.bones["rapier"].matrix_local.to_quaternion()

    def aimed(direction):
        return RAPIER.rotation_difference(Vector(direction).normalized()) @ rapier_rest

    def held(base, hand, direction):
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "rapier_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "rapier_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, sway=0.0):
        """A narrow en-garde stance, right foot and rapier toward the target."""
        return held(
            {
                "hips@loc": at("hips", (0, 0.005, -0.025 - breath * 0.003)),
                "hips": t("hips", (Z, 24), (X, 3)),
                "spine": t("spine", (Z, 12), (X, 4 + breath)),
                "chest": t("chest", (Z, 8), (X, -3 - breath)),
                "neck": t("neck", (Z, -18)),
                "head": t("head", (Z, -22), (X, -3 + breath), (Y, sway * 2)),
                "hair1": t("hair1", (X, -4 - breath * 3), (Y, sway * 5)),
                "hair2": t("hair2", (X, 3 + breath * 4), (Y, sway * 7)),
                "coat.B": t("coat.B", (X, 4 + breath * 2), (Y, sway * 3)),
                "upperarm.L": t("upperarm.L", (X, -8 - breath * 2), (Y, 8)),
                "forearm.L": t("forearm.L", (X, -10)),
                "hand.L": t("hand.L", (Z, sway * 6)),
                "thigh.R": t("thigh.R", (X, -30), (Y, 4)),
                "shin.R": t("shin.R", (X, 22)),
                "foot.R": t("foot.R", (X, -10)),
                "thigh.L": t("thigh.L", (X, 18), (Y, -4)),
                "shin.L": t("shin.L", (X, 18)),
                "foot.L": t("foot.L", (X, -22)),
            },
            WR + Vector((0, -0.005 * breath, 0.003 * breath)),
            (0.015 * sway, -1, 0.035 + 0.015 * breath),
        )

    def winded(breath=0.0):
        """Low HP: down on one knee, with the point low but still ready."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.035, -0.14 - breath * 0.005)),
                hips=t("hips", (Z, 14), (X, 8)),
                spine=t("spine", (Z, 8), (X, 22 + breath * 3)),
                chest=t("chest", (Z, 6), (X, 9 + breath * 2)),
                neck=t("neck", (X, -8)),
                head=t("head", (Z, -20), (X, 10 + breath * 4), (Y, -6)),
                hair1=t("hair1", (X, 14)),
                hair2=t("hair2", (X, 20 + breath * 4)),
                coat__B=t("coat.B", (X, 26)),
                thigh__R=t("thigh.R", (X, -70), (Y, 5)),
                shin__R=t("shin.R", (X, 66)),
                foot__R=t("foot.R", (X, 0)),
                thigh__L=t("thigh.L", (X, 8), (Y, -6)),
                shin__L=t("shin.L", (X, 96)),
                foot__L=t("foot.L", (X, -46)),
                upperarm__L=t("upperarm.L", (X, 4), (Y, 12)),
            ),
            (-0.135, -0.14, 0.4 - breath * 0.006),
            (0, -1, -0.35),
        )

    def recoil(base, amount=1.0):
        """A hit pushes her upper body back and lifts the rapier."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.025 * amount, -0.025 - 0.008 * amount)),
                spine=t("spine", (Z, 10), (X, -9 * amount)),
                chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
                neck=t("neck", (Z, -12)),
                head=t("head", (Z, -12), (X, -18 * amount)),
                hair1=t("hair1", (X, 18 * amount)),
                hair2=t("hair2", (X, 26 * amount)),
                coat__B=t("coat.B", (X, 18 * amount)),
                upperarm__L=t("upperarm.L", (X, 24 * amount), (Y, 20 * amount)),
            ),
            (-0.145, -0.18 + 0.055 * amount, 0.63 + 0.025 * amount),
            (0.03, -1, 0.08 + 0.24 * amount),
        )

    def stagger(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.06)),
                spine=t("spine", (X, 20), (Z, 4)),
                chest=t("chest", (X, 8)),
                head=t("head", (X, 20), (Z, -14)),
                hair1=t("hair1", (X, -18)),
                hair2=t("hair2", (X, -24)),
                coat__B=t("coat.B", (X, -14)),
                thigh__R=t("thigh.R", (X, -24)),
                shin__R=t("shin.R", (X, 34)),
                thigh__L=t("thigh.L", (X, 8)),
                shin__L=t("shin.L", (X, 28)),
            ),
            (-0.15, -0.09, 0.47),
            (0.15, -1, -0.3),
        )

    def fallen(base, bounce=0.0):
        """Flat on her back, with the rapier on the ground beside her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0), (X, 0)),
            spine=t("spine", (Z, 0), (X, -4)),
            chest=t("chest", (Z, 0), (X, -3)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -26)),
            hair1=t("hair1", (X, -38)),
            hair2=t("hair2", (X, -46)),
            coat__B=t("coat.B", (X, -48)),
            upperarm__R=t("upperarm.R", (Y, -42), (X, 10)),
            forearm__R=t("forearm.R", (X, -18)),
            upperarm__L=t("upperarm.L", (Y, 46), (X, 8)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -18), (Y, 6)),
            shin__R=t("shin.R", (X, 28)),
            foot__R=t("foot.R", (X, 0)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 12)),
            foot__L=t("foot.L", (X, 0)),
            forearm__R_slash_IK=0.0,
            rapier_aim_at_rot=aimed((-0.35, -1, 0.02)),
        )

    def crouch(base):
        """Low on bent knees, the point down: the start of a summon."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.035, -0.145)),
                hips=t("hips", (Z, 12), (X, 6)),
                spine=t("spine", (Z, 8), (X, 26)),
                chest=t("chest", (X, 10)),
                head=t("head", (Z, -18), (X, 8)),
                hair1=t("hair1", (X, 18)),
                hair2=t("hair2", (X, 24)),
                coat__B=t("coat.B", (X, 28)),
                upperarm__L=t("upperarm.L", (X, 4), (Y, 10)),
                thigh__R=t("thigh.R", (X, -68), (Y, 5)),
                shin__R=t("shin.R", (X, 68)),
                foot__R=t("foot.R", (X, -2)),
                thigh__L=t("thigh.L", (X, 6), (Y, -5)),
                shin__L=t("shin.L", (X, 98)),
                foot__L=t("foot.L", (X, -46)),
            ),
            (-0.135, -0.12, 0.39),
            (0, -0.3, -1),
        )

    def ready(base):
        """Up again, with a compact fencing salute."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.012)),
                chest=t("chest", (X, -9), (Z, 6)),
                neck=t("neck", (X, -4)),
                head=t("head", (X, -9), (Z, -20)),
                hair1=t("hair1", (X, 10)),
                hair2=t("hair2", (X, 14)),
                coat__B=t("coat.B", (X, 12)),
                upperarm__L=t("upperarm.L", (X, -14), (Y, 14)),
            ),
            (-0.14, -0.12, 0.81),
            (0, -0.15, 1),
        )

    def step(front):
        """A light fencing step. `front` is 1 for left and -1 for right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(0.2, front * 0.4),
            hips_at_loc=at("hips", (0, 0, -0.03)),
            spine=t("spine", (Z, 12), (X, 7), (Y, -2 * front)),
            chest=t("chest", (Z, 8 - 3 * front), (X, -3)),
            hair1=t("hair1", (X, 7), (Y, 5 * front)),
            hair2=t("hair2", (X, 12), (Y, 8 * front)),
            coat__B=t("coat.B", (X, 13), (Y, 6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 18)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 20)),
                f"shin__{back}": t(f"shin.{back}", (X, 22)),
                f"foot__{back}": t(f"foot.{back}", (X, -16)),
            },
        )

    def passing(lifted):
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(0.5),
            hips_at_loc=at("hips", (0, 0, -0.014)),
            spine=t("spine", (Z, 12), (X, 7)),
            hair1=t("hair1", (X, 5)),
            hair2=t("hair2", (X, 9)),
            coat__B=t("coat.B", (X, 9)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -20)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 50)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -12)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 12)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -12)),
            },
        )

    # The attack: a short draw back, then a direct fencing lunge. The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # rapier is at full reach and its point hits at frame 15 of 30.
    def wind(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.035, -0.04)),
                hips=t("hips", (Z, 30), (X, 2)),
                spine=t("spine", (Z, 14), (X, 1)),
                chest=t("chest", (Z, 10), (X, -5)),
                neck=t("neck", (Z, -22)),
                head=t("head", (Z, -28), (X, -5)),
                hair1=t("hair1", (X, -14), (Y, -8)),
                hair2=t("hair2", (X, -18), (Y, -12)),
                coat__B=t("coat.B", (X, -10), (Y, -8)),
                upperarm__L=t("upperarm.L", (X, -20), (Y, 16)),
                forearm__L=t("forearm.L", (X, -18)),
                thigh__R=t("thigh.R", (X, -12), (Y, 5)),
                shin__R=t("shin.R", (X, 24)),
                thigh__L=t("thigh.L", (X, 26), (Y, -5)),
                shin__L=t("shin.L", (X, 26)),
            ),
            (-0.15, -0.075, 0.61),
            (0.05, -1, 0.025),
        )

    def lunge(base, depth=1.0):
        hand = WR.lerp(Vector((-0.13, -0.43, 0.63)), depth)
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.12 * depth, -0.025 - 0.055 * depth)),
                hips=t("hips", (Z, 24 + 18 * depth), (X, 3 + 5 * depth)),
                spine=t("spine", (Z, 12 + 5 * depth), (X, 4 + 14 * depth)),
                chest=t("chest", (Z, 8 + 3 * depth), (X, -3 + 10 * depth)),
                neck=t("neck", (Z, -18 - 12 * depth), (X, -10 * depth)),
                head=t("head", (Z, -22 - 14 * depth), (X, -3 - 11 * depth)),
                hair1=t("hair1", (X, -4 + 25 * depth), (Y, -10 * depth)),
                hair2=t("hair2", (X, 3 + 32 * depth), (Y, -15 * depth)),
                coat__B=t("coat.B", (X, 4 + 32 * depth), (Y, -12 * depth)),
                upperarm__L=t("upperarm.L", (X, -8 - 28 * depth), (Y, 8 + 16 * depth)),
                forearm__L=t("forearm.L", (X, -10 - 16 * depth)),
                thigh__R=t("thigh.R", (X, -30 - 34 * depth), (Y, 4)),
                shin__R=t("shin.R", (X, 22 + 22 * depth)),
                foot__R=t("foot.R", (X, -10 + 10 * depth)),
                thigh__L=t("thigh.L", (X, 18 + 14 * depth), (Y, -4)),
                shin__L=t("shin.L", (X, 18 + 4 * depth)),
                foot__L=t("foot.L", (X, -22 - 8 * depth)),
            ),
            hand,
            (0, -1, 0.01),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.6, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, wind(stand())).key(12, lunge(stand(), 0.45))
    attack.key(15, lunge(stand())).key(18, lunge(stand(), 0.88)).key(24, stand(0.5)).key(30, stand())
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
    rebirth.key(32, crouch(stand())).key(41, ready(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.035, -0.16))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "bramble-duelist.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
