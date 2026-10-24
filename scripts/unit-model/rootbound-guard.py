"""
Rootbound Guard (`elf.rootboundGuard`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a broad old plant guardian with a
square trunk, layered bark armor, rooted feet, long elf ears and a moss beard.
A huge leaf shield with a twisted branch frame covers his left side. He holds
a crooked branch spear in his right hand. A small snail sits on his right
shoulder. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/rootbound-guard.glb`; then
`bun unit-model:pack rootbound-guard` packs it for the game.

The Battle camera sees the right side of a player Unit, so he turns to his
right and the shield shows its face. He is Heavy: his steps are slow and his
attack drives the shield forward at frame 15 of 30. The branch spear stays
back during the bash. His beard, shield and spear have restrained follow-through.
The `regrow` bone scales fresh roots and bright shoots from zero in the cast
clip (Regenerate).
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

BARK = hex_color("#765333")
BARK_LIGHT = hex_color("#a17b4d")
BARK_PALE = hex_color("#bd9864")
BARK_DARK = hex_color("#49321f")
BARK_DEEP = hex_color("#302419")
CUT_WOOD = hex_color("#d0ad72")
MOSS = hex_color("#667d32")
MOSS_DARK = hex_color("#405626")
MOSS_LIGHT = hex_color("#91a94c")
LEAF = hex_color("#5f842f")
LEAF_DARK = hex_color("#385b29")
LEAF_LIGHT = hex_color("#88a845")
LEAF_VEIN = hex_color("#b2bd62")
SHOOT = hex_color("#b9dc59")
ROOT_NEW = hex_color("#d0df83")
EYES = hex_color("#211f13")
EYE_GOLD = hex_color("#d8b957")
SNAIL = hex_color("#b99a5d")
SHELL = hex_color("#b87332")
SHELL_DARK = hex_color("#75451f")

# --- Proportions ---------------------------------------------------------------

# A broad, short-legged body and a square trunk make the Lane anchor.
HIP_Z = 0.43
WAIST_Z = 0.51
CHEST_Z = 0.62
SHOULDER_Z = 0.70
NECK_Z = 0.75
HEAD_C = Vector((0, -0.012, 0.855))
KNEE_Z = 0.24
ANKLE_Z = 0.055
LEG_X = 0.074

# The left arm carries the shield across the body. The right hand holds the
# spear low, with its shaft upright. These are the rest (bind) positions.
SL = Vector((0.145, 0, SHOULDER_Z))
EL = Vector((0.205, -0.05, 0.555))
WL = Vector((0.11, -0.12, 0.5))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.145, 0, SHOULDER_Z))
ER = Vector((-0.2, 0.015, 0.545))
WR = Vector((-0.21, -0.055, 0.435))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.028

# The shield is a pointed, broad leaf. Its front faces -Y at rest.
SHIELD_C = Vector((0.08, -0.18, 0.43))
SHIELD_BOTTOM = 0.14
SHIELD_HEIGHT = 0.58
SHIELD_HALF = 0.175
SHIELD_BULGE = 0.025
SHIELD_THICK = 0.016
GRIP_L = WL + (WL - EL).normalized() * 0.025

SNAIL_C = SR + Vector((-0.028, -0.005, 0.046))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.795), "chest"),
    ("head", (0, 0, 0.795), (0, 0, 0.955), "neck"),
    ("beard", (0, -0.07, 0.79), (0, -0.095, 0.61), "head"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.035 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.1, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("shield", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("spear", tuple(HAND_R), tuple(HAND_R + Vector((0, 0, 0.12))), "hand.R"),
    # All new growth scales from this low point, so it rises from the roots.
    ("regrow", (0, 0, 0.015), (0, 0, 0.14), "root"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.46, 0.54)
    return blend("spine", "chest", co.z, 0.58, 0.66)


def beard_weights(co):
    return blend("beard", "head", co.z, 0.67, 0.78)


# --- Parts ---------------------------------------------------------------------


def leaf(part, base, direction, length, width, color):
    """A thick, pointed leaf, made as a squashed four-sided cone."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.001, 4, squash=0.25)
    part.paint(faces_of(verts), color)
    return verts


def twisted_branch(part, points, radius, color=BARK, sides=5):
    """Two wood strands wind round a polyline, as on the shield and spear."""
    points = [Vector(p) for p in points]
    result = set()
    for strand in (0, 1):
        strand_points = []
        for index, point in enumerate(points):
            ahead = points[min(index + 1, len(points) - 1)] - points[max(index - 1, 0)]
            direction = ahead.normalized()
            side = direction.cross(Z if abs(direction.z) < 0.95 else X).normalized()
            up = side.cross(direction).normalized()
            angle = index * 1.35 + strand * math.pi
            offset = (side * math.cos(angle) + up * math.sin(angle)) * radius * 0.52
            strand_points.append(point + offset)
        radii = [radius * lerp(0.72, 0.5, abs(i / (len(points) - 1) - 0.5) * 2) for i in range(len(points))]
        verts = kit.tube(part.bm, strand_points, radii, sides, caps=False)
        strand_faces = faces_of(verts)
        part.paint(strand_faces, color if strand == 0 else BARK_DARK)
        result |= strand_faces
    return result


def head_parts():
    parts = []
    head = Part("head", BARK_PALE, "head", shade=0.16)
    kit.sphere(head.bm, HEAD_C, (0.064, 0.061, 0.078), 12, 8)
    # A long wooden nose and a heavy chin keep the face old and plain.
    kit.cone(head.bm, (0, -0.065, 0.858), (0, -0.091, 0.837), 0.016, 0.004, 5)
    for sign in (1, -1):
        ear = kit.cone(
            head.bm,
            (0.055 * sign, 0.002, 0.865),
            (0.154 * sign, 0.032, 0.935),
            0.021,
            0.001,
            5,
            squash=0.35,
        )
        for face in faces_of(ear):
            if face.calc_center_median().y < 0.015:
                head.paint([face], BARK_LIGHT)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, (0.024 * sign, -0.064, 0.867), (0.009, 0.005, 0.007), 6, 4)
        glint = kit.sphere(face.bm, (0.023 * sign, -0.068, 0.869), (0.003, 0.002, 0.003), 4, 3)
        face.paint(faces_of(glint), EYE_GOLD)
        brow = kit.tube(
            face.bm,
            [(0.009 * sign, -0.067, 0.884), (0.029 * sign, -0.066, 0.89), (0.049 * sign, -0.056, 0.883)],
            [0.006, 0.008, 0.003],
            4,
        )
        face.paint(faces_of(brow), MOSS_DARK)
    # A small, level mouth is mostly hidden by the moss moustache.
    mouth = kit.slab(face.bm, (0, -0.071, 0.818), (0.014, 0, 0), (0, 0.003, 0), (0, 0, 0.002))
    face.paint(faces_of(mouth), BARK_DEEP)
    parts.append(face)

    beard = Part("beard", MOSS, beard_weights, shade=0.18)
    kit.sphere(beard.bm, (0, -0.052, 0.8), (0.057, 0.043, 0.038), 8, 5)
    for index, (x, length, width) in enumerate(((-0.032, 0.16, 0.024), (0.0, 0.205, 0.032), (0.032, 0.17, 0.024))):
        strand = kit.cone(
            beard.bm,
            (x, -0.069, 0.792),
            (x * 0.55, -0.098, 0.792 - length),
            width,
            0.003,
            6,
            squash=0.55,
        )
        beard.paint(faces_of(strand), (MOSS, MOSS_DARK, MOSS_LIGHT)[index])
    moustache = kit.tube(
        beard.bm,
        [(-0.052, -0.071, 0.825), (-0.022, -0.083, 0.82), (0, -0.085, 0.823), (0.022, -0.083, 0.82), (0.052, -0.071, 0.825)],
        [0.003, 0.011, 0.013, 0.011, 0.003],
        5,
    )
    beard.paint(faces_of(moustache), MOSS_DARK)
    parts.append(beard)

    crown = Part("crown", MOSS_DARK, "head", shade=0.1)
    for index, (x, y, size) in enumerate(((-0.035, 0.005, 0.038), (0.02, 0.016, 0.045), (0.0, -0.025, 0.032))):
        clump = kit.sphere(crown.bm, HEAD_C + Vector((x, y, 0.068)), (size, size * 0.8, size * 0.4), 6, 4)
        crown.paint(faces_of(clump), MOSS if index % 2 else MOSS_DARK)
    for index, angle in enumerate((-100, -45, 10, 65, 125)):
        a = math.radians(angle)
        base = HEAD_C + Vector((0.05 * math.sin(a), -0.05 * math.cos(a), 0.065))
        direction = Vector((math.sin(a) * 0.65, -math.cos(a) * 0.45, 0.8))
        leaf(crown, base, direction, 0.052, 0.016, MOSS_LIGHT if index % 2 else LEAF)
    for sign in (1, -1):
        twig = kit.tube(
            crown.bm,
            [(0.035 * sign, 0.025, 0.91), (0.055 * sign, 0.035, 0.96), (0.074 * sign, 0.04, 0.985)],
            [0.006, 0.004, 0.0015],
            4,
        )
        crown.paint(faces_of(twig), BARK_DARK)
    parts.append(crown)

    neck = Part("neck", BARK_DARK, "neck")
    kit.cone(neck.bm, (0, 0, 0.725), (0, 0, 0.81), 0.043, 0.033, 7)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    trunk = Part("trunk", BARK_DARK, torso_weights, smooth=False, shade=0.22)
    core = kit.box(trunk.bm, (0, 0, 0.59), (0.25, 0.16, 0.28))
    for face in faces_of(core):
        center = face.calc_center_median()
        trunk.paint([face], BARK if center.y < -0.06 else BARK_DARK)
    parts.append(trunk)

    cuirass = Part("cuirass", BARK, torso_weights, smooth=False, shade=0.2)
    # Six thick, uneven plates make a square bark cuirass, not a metal shell.
    for row, z in enumerate((0.505, 0.59, 0.675)):
        for column, sign in enumerate((-1, 1)):
            center = Vector((0.058 * sign, -0.088 - row * 0.003, z))
            plate = kit.slab(
                cuirass.bm,
                center,
                (0.052, 0, 0.003 * sign * (row - 1)),
                (0, 0.01, 0),
                (0, 0, 0.051),
            )
            cuirass.paint(faces_of(plate), (BARK_LIGHT, BARK, BARK_PALE)[(row + column) % 3])
            groove = kit.tube(
                cuirass.bm,
                [center + Vector((0.012 * sign, -0.012, -0.037)), center + Vector((0.005 * sign, -0.014, 0)), center + Vector((0.014 * sign, -0.012, 0.038))],
                [0.003, 0.004, 0.002],
                4,
            )
            cuirass.paint(faces_of(groove), BARK_DARK)
    parts.append(cuirass)

    collar = Part("collar", BARK_DARK, "chest", shade=0.12)
    verts = kit.cone(collar.bm, (0, 0, 0.69), (0, 0, 0.765), 0.13, 0.052, 8, squash=0.72)
    for face in faces_of(verts):
        if face.calc_center_median().z > 0.735:
            collar.paint([face], MOSS)
    parts.append(collar)

    belt = Part("belt", BARK_DARK, "hips", shade=0.1)
    vine = kit.torus(belt.bm, (0, 0, 0.46), (0, 0, 1), 0.128, 0.012, 14, 4)
    belt.paint(faces_of(vine), BARK_DARK)
    knot = kit.sphere(belt.bm, (0, -0.105, 0.46), (0.032, 0.017, 0.028), 7, 4)
    belt.paint(faces_of(knot), BARK_LIGHT)
    parts.append(belt)

    # Separate bark and leaf tassets keep the square trunk readable.
    skirt = Part("skirt", BARK, "hips", shade=0.16)
    for index, angle in enumerate((-150, -90, -30, 30, 90, 150, 210)):
        a = math.radians(angle)
        base = Vector((0.115 * math.sin(a), -0.09 * math.cos(a), 0.455))
        direction = Vector((math.sin(a) * 0.35, -math.cos(a) * 0.25, -1))
        color = (BARK, BARK_LIGHT, LEAF_DARK, LEAF)[index % 4]
        leaf(skirt, base, direction, 0.17 + 0.025 * (index % 2), 0.043, color)
    parts.append(skirt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", BARK, f"upperarm.{side}", shade=0.18)
        cap = kit.sphere(pauldron.bm, s + Vector((0.012 * sign, 0, 0.012)), (0.071, 0.065, 0.047), 8, 5)
        for face in faces_of(cap):
            if face.calc_center_median().z < s.z - 0.01:
                pauldron.paint([face], BARK_DARK)
        for index in range(3):
            base = s + Vector((-0.025 * sign, (index - 1) * 0.028, 0.028 - index * 0.006))
            leaf(pauldron, base, Vector((0.65 * sign, 0, -0.75)), 0.12, 0.037, BARK_LIGHT if index == 1 else BARK)
        parts.append(pauldron)

        upper = Part(f"upperarm.{side}", BARK_DARK, f"upperarm.{side}", shade=0.14)
        kit.cone(upper.bm, s, e, 0.05, 0.038, 7)
        ridge = kit.tube(upper.bm, [s + Vector((0, -0.042, 0)), (s + e) / 2 + Vector((0, -0.043, 0)), e + Vector((0, -0.032, 0))], [0.008, 0.01, 0.005], 4)
        upper.paint(faces_of(ridge), BARK)
        parts.append(upper)

        elbow = Part(f"elbow.{side}", BARK, f"forearm.{side}", shade=0.12)
        kit.cone(elbow.bm, e - d * 0.025, e + d * 0.025, 0.043, 0.041, 7)
        parts.append(elbow)

        forearm = Part(f"forearm.{side}", BARK, f"forearm.{side}", shade=0.16)
        verts = kit.cone(forearm.bm, e + d * 0.015, w, 0.042, 0.031, 7)
        for face in faces_of(verts):
            if face.calc_center_median().y < e.y - 0.025:
                forearm.paint([face], BARK_LIGHT)
        parts.append(forearm)

        hand = Part(f"hand.{side}", BARK_DARK, f"hand.{side}", shade=0.12)
        fist = w + d * 0.026
        kit.sphere(hand.bm, fist, (0.032, 0.029, 0.035), 8, 5)
        for spread in (-1.5, -0.5, 0.5, 1.5):
            knuckle = kit.sphere(hand.bm, fist + Vector((spread * 0.014, -0.024, -0.006)), (0.009, 0.009, 0.012), 5, 3)
            hand.paint(faces_of(knuckle), BARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", BARK_DARK, f"thigh.{side}", shade=0.16)
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.025)), knee, 0.061, 0.047, 7)
        plate = kit.slab(thigh.bm, hip.lerp(knee, 0.52) + Vector((0, -0.044, 0)), (0.039, 0, 0), (0, 0.009, 0), (0, 0, 0.068))
        thigh.paint(faces_of(plate), BARK)
        parts.append(thigh)

        knee_part = Part(f"knee.{side}", BARK, f"shin.{side}", shade=0.14)
        kit.cone(knee_part.bm, knee + Vector((0, 0, 0.027)), knee - Vector((0, 0, 0.027)), 0.052, 0.05, 7)
        parts.append(knee_part)

        shin = Part(f"shin.{side}", BARK, f"shin.{side}", shade=0.18)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.015)), ankle, 0.048, 0.037, 7)
        vine_points = []
        for index in range(9):
            v = index / 8
            a = v * math.pi * 3.2
            vine_points.append(ankle.lerp(knee, v) + Vector((0.042 * math.cos(a), 0.042 * math.sin(a), 0)))
        vine = kit.tube(shin.bm, vine_points, [0.006] * len(vine_points), 4)
        shin.paint(faces_of(vine), BARK_DARK)
        parts.append(shin)

        foot = Part(f"foot.{side}", BARK_DARK, f"foot.{side}", shade=0.16)
        kit.sphere(foot.bm, (LEG_X * sign, -0.024, 0.043), (0.066, 0.083, 0.042), 8, 4)
        # Thick toes divide into roots. They are part of the feet, not a ground plane.
        for index, (dx, dy) in enumerate(((0.0, -0.14), (0.075 * sign, -0.1), (-0.065 * sign, -0.09), (0.055 * sign, 0.085))):
            start = Vector((LEG_X * sign, -0.015, 0.052))
            points = [
                start,
                start + Vector((dx * 0.35, dy * 0.35, -0.013)),
                start + Vector((dx * 0.72, dy * 0.72, -0.029)),
                start + Vector((dx, dy, -0.037)),
            ]
            root = kit.tube(foot.bm, points, [0.024, 0.019, 0.011, 0.002], 5)
            foot.paint(faces_of(root), BARK if index % 2 else BARK_LIGHT)
        parts.append(foot)
    return parts


def shield_width(v):
    return 0.018 + SHIELD_HALF * math.sin(math.pi * clamp01(v)) ** 0.72


def shield_point(u, v, depth=0.0):
    """A point on the leaf shield; `u` crosses it and `v` goes from 0 to 1."""
    curve = max(0.0, 1 - u * u)
    return Vector(
        (
            SHIELD_C.x + u * shield_width(v),
            SHIELD_C.y - SHIELD_BULGE * math.sqrt(curve) + depth,
            SHIELD_BOTTOM + v * SHIELD_HEIGHT,
        )
    )


def shield_parts():
    shield = Part("shield", LEAF, "shield", shade=0.08)
    columns, rows = 8, 10

    def grid(depth):
        return [
            [shield_point(lerp(-1, 1, c / columns), r / rows, depth) for c in range(columns + 1)]
            for r in range(rows + 1)
        ]

    def color_of(face_side, row, column):
        if face_side == "back":
            return BARK_DARK if row % 3 else BARK
        if column in (0, columns - 1):
            return LEAF_DARK
        return (LEAF, LEAF_LIGHT, LEAF, LEAF_DARK)[(row + column * 2) % 4]

    edges = kit.panel(shield, grid(0.0), grid(SHIELD_THICK), color_of)
    shield.paint(edges, LEAF_DARK)

    # One continuous, twisted frame follows the pointed leaf outline.
    bottom = shield_point(0, 0, -0.009) - Z * 0.022
    top = shield_point(0, 1, -0.009) + Z * 0.022
    outline = [bottom]
    outline += [shield_point(-1, i / 12, -0.009) for i in range(1, 12)]
    outline += [top]
    outline += [shield_point(1, i / 12, -0.009) for i in range(11, 0, -1)]
    outline += [bottom]
    twisted_branch(shield, outline, 0.014, BARK, 5)

    midrib = []
    for index in range(9):
        v = index / 8
        midrib.append(shield_point(0, v, -0.016) + Vector((0.005 * math.sin(v * math.pi * 2), 0, 0)))
    rib = kit.tube(shield.bm, midrib, [lerp(0.012, 0.003, i / 8) for i in range(9)], 5)
    shield.paint(faces_of(rib), BARK_LIGHT)

    # The side veins point towards the tip, as on a real leaf.
    for row, v in enumerate((0.22, 0.4, 0.59, 0.77)):
        for sign in (1, -1):
            points = [
                shield_point(sign * u, v + 0.07 * u, -0.014) for u in (0.0, 0.32, 0.65, 0.91)
            ]
            vein = kit.tube(shield.bm, points, [0.005, 0.004, 0.003, 0.0015], 4)
            shield.paint(faces_of(vein), LEAF_VEIN if row % 2 else BARK_LIGHT)

    # The grip and two straps are on the wood back of the shield.
    strap = kit.box(shield.bm, shield_point(0, 0.5, SHIELD_THICK + 0.012), (0.12, 0.014, 0.025))
    shield.paint(faces_of(strap), BARK_DEEP)
    return [shield]


def spear_parts():
    spear = Part("spear", BARK, "spear", shade=0.1)
    x, y = HAND_R.x, HAND_R.y
    points = []
    for index in range(12):
        v = index / 11
        points.append(Vector((x + 0.012 * math.sin(v * math.pi * 3), y + 0.008 * math.sin(v * math.pi * 2), lerp(0.025, 1.045, v))))
    twisted_branch(spear, points, 0.015, BARK, 5)

    # A long split-wood point, with one short natural barb.
    tip = kit.cone(spear.bm, (x, y, 1.0), (x - 0.006, y, 1.17), 0.031, 0.001, 5, squash=0.45)
    spear.paint(faces_of(tip), CUT_WOOD)
    barb = kit.cone(spear.bm, (x, y, 0.985), (x + 0.052, y + 0.006, 1.07), 0.015, 0.001, 4, squash=0.5)
    spear.paint(faces_of(barb), BARK_LIGHT)
    grip = kit.cone(spear.bm, (x, y, HAND_R.z - 0.055), (x, y, HAND_R.z + 0.055), 0.02, 0.019, 7)
    spear.paint(faces_of(grip), BARK_DEEP)
    for index, z in enumerate((0.77, 0.88, 0.95)):
        direction = Vector(((-1) ** index * 0.75, -0.25, 0.55))
        leaf(spear, (x, y, z), direction, 0.065, 0.018, LEAF_LIGHT if index == 1 else LEAF)
    return [spear]


def snail_parts():
    """A small shoulder passenger: the guardian is its milestone."""
    snail = Part("snail", SNAIL, "shoulder.R", shade=0.06)
    body = kit.tube(
        snail.bm,
        [SNAIL_C + Vector((0, 0.024, 0)), SNAIL_C, SNAIL_C + Vector((0, -0.042, 0.006))],
        [0.008, 0.011, 0.007],
        6,
    )
    snail.paint(faces_of(body), SNAIL)
    shell_c = SNAIL_C + Vector((0, 0.002, 0.022))
    shell = kit.sphere(snail.bm, shell_c, (0.024, 0.014, 0.025), 8, 5)
    snail.paint(faces_of(shell), SHELL)
    spiral = []
    for index in range(15):
        v = index / 14
        a = v * math.pi * 4.5
        r = lerp(0.019, 0.002, v)
        spiral.append(shell_c + Vector((r * math.cos(a), -0.014, r * math.sin(a))))
    mark = kit.tube(snail.bm, spiral, [0.0025] * len(spiral), 4)
    snail.paint(faces_of(mark), SHELL_DARK)
    for sign in (1, -1):
        base = SNAIL_C + Vector((0.005 * sign, -0.04, 0.008))
        tip = base + Vector((0.008 * sign, -0.014, 0.022))
        kit.cone(snail.bm, base, tip, 0.0025, 0.0015, 4)
        eye = kit.sphere(snail.bm, tip, (0.003, 0.003, 0.003), 4, 3)
        snail.paint(faces_of(eye), EYES)
    return [snail]


def regrow_parts():
    """Fresh roots and shoots for Regenerate, scaled by their own bone."""
    growth = Part("regrow", SHOOT, "regrow", shade=0.06)
    for sign in (1, -1):
        for index, (dx, dy) in enumerate(((0.15, -0.12), (-0.11, -0.15), (0.06, 0.15))):
            start = Vector((LEG_X * sign, -0.01, 0.027))
            points = [
                start,
                start + Vector((dx * 0.35, dy * 0.35, 0)),
                start + Vector((dx * 0.72, dy * 0.72, -0.009)),
                start + Vector((dx, dy, -0.013)),
            ]
            root = kit.tube(growth.bm, points, [0.012, 0.009, 0.005, 0.001], 5)
            growth.paint(faces_of(root), ROOT_NEW if index % 2 else SHOOT)

    # Three bright climbers join the new roots to the old bark.
    for index, (x, height) in enumerate(((-0.09, 0.34), (0.0, 0.52), (0.09, 0.41))):
        points = [
            Vector((x, -0.075, 0.025)),
            Vector((x * 1.1, -0.09, height * 0.35)),
            Vector((x * 0.85, -0.105, height * 0.7)),
            Vector((x * 0.6, -0.1, height)),
        ]
        stem = kit.tube(growth.bm, points, [0.008, 0.006, 0.004, 0.0015], 4)
        growth.paint(faces_of(stem), SHOOT)
        leaf(growth, points[2], Vector((-0.8 if index % 2 else 0.8, -0.2, 0.5)), 0.055, 0.017, SHOOT)
        leaf(growth, points[1], Vector((0.7 if index % 2 else -0.7, -0.1, 0.6)), 0.045, 0.014, ROOT_NEW)
        bud = kit.sphere(growth.bm, points[-1], (0.009, 0.007, 0.013), 5, 3)
        growth.paint(faces_of(bud), ROOT_NEW)
    return [growth]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("RootboundGuard", BONES)
    parts = head_parts() + body_parts() + limb_parts() + shield_parts() + spear_parts() + snail_parts() + regrow_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "RootboundGuardMesh")
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

    def stand(breath=0.0, sway=0.0, guard=1.0):
        """A wide, rooted stance, turned so that the leaf shield faces the camera."""
        return {
            "regrow@scale": 0.0,
            "hips@loc": at("hips", (0, 0, -0.018 - breath * 0.004)),
            "hips": t("hips", (Z, -24 * guard)),
            "spine": t("spine", (Z, -5 * guard), (X, 5 + breath)),
            "chest": t("chest", (X, -2 - breath * 2), (Y, sway * 1.5)),
            "neck": t("neck", (Z, 10 * guard)),
            "head": t("head", (Z, 15 * guard + sway * 2), (X, -2 + breath)),
            "beard": t("beard", (X, -4 - breath * 2), (Y, sway * 3)),
            "upperarm.L": t("upperarm.L", (X, -6 - breath * 2)),
            "forearm.L": t("forearm.L", (X, 4)),
            "shield": t("shield", (Y, sway * 1.5)),
            "upperarm.R": t("upperarm.R", (Y, -6), (X, -4 - breath)),
            "forearm.R": t("forearm.R", (X, -12)),
            "hand.R": t("hand.R", (X, -8)),
            "spear": t("spear", (Y, sway * 0.8)),
            "thigh.L": t("thigh.L", (X, -14 * guard), (Y, -5)),
            "shin.L": t("shin.L", (X, 18 * guard)),
            "foot.L": t("foot.L", (X, -4 * guard)),
            "thigh.R": t("thigh.R", (X, 10 * guard), (Y, 5)),
            "shin.R": t("shin.R", (X, 10 * guard)),
            "foot.R": t("foot.R", (X, -18 * guard)),
        }

    def tired(breath=0.0):
        """Low HP: the old trunk bows, but the shield and roots stay planted."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.025, -0.09 - breath * 0.005)),
            spine=t("spine", (Z, -4), (X, 18 + breath * 3)),
            chest=t("chest", (X, 9 + breath * 2), (Y, -4)),
            neck=t("neck", (Z, 8), (X, 5)),
            head=t("head", (Z, 10), (X, 12 + breath * 4), (Y, -5)),
            beard=t("beard", (X, -22), (Y, -5)),
            upperarm__L=t("upperarm.L", (X, 12), (Y, 5)),
            forearm__L=t("forearm.L", (X, 10)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 8)),
            forearm__R=t("forearm.R", (X, -25)),
            spear=t("spear", (X, 8)),
            thigh__L=t("thigh.L", (X, -34), (Y, -6)),
            shin__L=t("shin.L", (X, 44)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, 4), (Y, 7)),
            shin__R=t("shin.R", (X, 38)),
            foot__R=t("foot.R", (X, -35)),
        )

    def recoil(base, amount=1.0):
        """A hit lands on the shield; the feet stay and the upper trunk rocks back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.018 - 0.008 * amount)),
            spine=t("spine", (Z, -5), (X, 5 - 10 * amount)),
            chest=t("chest", (X, -2 - 8 * amount), (Z, 5 * amount)),
            head=t("head", (Z, 15), (X, -2 - 12 * amount)),
            beard=t("beard", (X, 16 * amount), (Y, 5 * amount)),
            upperarm__L=t("upperarm.L", (X, -6 + 14 * amount), (Y, -7 * amount)),
            upperarm__R=t("upperarm.R", (Y, -6 - 12 * amount), (X, -4 + 12 * amount)),
            spear=t("spear", (X, -8 * amount)),
        )

    def step(front):
        """A slow heel plant. `front` is 1 for the left foot and -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(guard=0.72),
            hips_at_loc=at("hips", (0, 0, -0.028)),
            spine=t("spine", (Z, -4), (X, 7), (Y, 2 * front)),
            chest=t("chest", (X, -3), (Z, -3 * front)),
            beard=t("beard", (X, -7), (Y, 3 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 8)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -5)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 17)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 11)),
                "upperarm__R": t("upperarm.R", (Y, -6), (X, -4 - 6 * front)),
                "shield": t("shield", (Y, 2 * front)),
            },
        )

    def passing(lifted):
        """One rooted foot passes the planted one, with little vertical bounce."""
        planted = "R" if lifted == "L" else "L"
        sign = 1 if lifted == "L" else -1
        return pose(
            stand(guard=0.72),
            hips_at_loc=at("hips", (0, 0, -0.008)),
            spine=t("spine", (Z, -4), (X, 7)),
            beard=t("beard", (X, -5), (Y, -2 * sign)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -17)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 42)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 3)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 8)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -9)),
                "shield": t("shield", (Y, -2 * sign)),
            },
        )

    # The shield gathers at frame 9 and strikes at frame 15. The spear stays
    # behind the body, so the shield-led impact has one clear line of action.
    def gather(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.045, -0.06)),
            hips=t("hips", (Z, -30)),
            spine=t("spine", (Z, -8), (X, 13)),
            chest=t("chest", (Z, -5), (X, 2)),
            head=t("head", (Z, 18), (X, -8)),
            beard=t("beard", (X, -12)),
            upperarm__L=t("upperarm.L", (X, 12), (Z, -6)),
            forearm__L=t("forearm.L", (X, -6)),
            upperarm__R=t("upperarm.R", (Y, -12), (X, 14)),
            forearm__R=t("forearm.R", (X, -24)),
            thigh__L=t("thigh.L", (X, -34), (Y, -6)),
            shin__L=t("shin.L", (X, 46)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, 14), (Y, 7)),
            shin__R=t("shin.R", (X, 32)),
            foot__R=t("foot.R", (X, -34)),
        )

    def bash(base, amount=1.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.13 * amount, -0.055 * amount)),
            hips=t("hips", (Z, -22)),
            spine=t("spine", (Z, -2), (X, 5 + 17 * amount)),
            chest=t("chest", (Z, 4 * amount), (X, 5 * amount)),
            head=t("head", (Z, 8), (X, -2 - 12 * amount)),
            beard=t("beard", (X, -4 - 14 * amount)),
            upperarm__L=t("upperarm.L", (X, -6 - 38 * amount), (Z, 8 * amount)),
            forearm__L=t("forearm.L", (X, 10 * amount)),
            shield=t("shield", (X, -5 * amount)),
            upperarm__R=t("upperarm.R", (Y, -8), (X, -4 + 24 * amount)),
            forearm__R=t("forearm.R", (X, -12 - 12 * amount)),
            spear=t("spear", (X, 10 * amount)),
            thigh__L=t("thigh.L", (X, -14 - 46 * amount), (Y, -6)),
            shin__L=t("shin.L", (X, 18 + 38 * amount)),
            foot__L=t("foot.L", (X, -4 + 4 * amount)),
            thigh__R=t("thigh.R", (X, 10 + 22 * amount), (Y, 6)),
            shin__R=t("shin.R", (X, 10 + 2 * amount)),
            foot__R=t("foot.R", (X, -18 - 4 * amount)),
        )

    def call(base, grow=1.0, swirl=0.0):
        """Regenerate: the trunk lifts and new growth rises from the roots."""
        return pose(
            stand(),
            regrow_at_scale=grow,
            regrow=t("regrow", (Z, swirl)),
            hips_at_loc=at("hips", (0, 0, -0.008)),
            spine=t("spine", (Z, -5), (X, 0)),
            chest=t("chest", (X, -10), (Z, 3)),
            head=t("head", (Z, 12), (X, -13)),
            beard=t("beard", (X, 8)),
            upperarm__L=t("upperarm.L", (X, 8), (Y, 8)),
            upperarm__R=t("upperarm.R", (X, -36), (Y, -8)),
            forearm__R=t("forearm.R", (X, -18)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.025, -0.07)),
            spine=t("spine", (X, 20), (Z, 4)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 22), (Y, -8)),
            beard=t("beard", (X, -28)),
            thigh__L=t("thigh.L", (X, -32), (Y, -5)),
            shin__L=t("shin.L", (X, 48)),
            foot__L=t("foot.L", (X, -16)),
            thigh__R=t("thigh.R", (X, -4), (Y, 6)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, -30)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -16), (X, 8)),
        )

    def fallen(base, bounce=0.0):
        """The trunk falls on its back, with the shield and spear beside it."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.12)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -12), (Z, -24)),
            beard=t("beard", (X, -38), (Y, 8)),
            upperarm__L=t("upperarm.L", (Y, 48), (X, 18)),
            forearm__L=t("forearm.L", (X, -12)),
            upperarm__R=t("upperarm.R", (Y, -50), (X, 12)),
            forearm__R=t("forearm.R", (X, -18)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -18), (Y, 6)),
            shin__R=t("shin.R", (X, 28)),
            foot__R=t("foot.R", (X, 0)),
        )

    def crouch(base):
        """A low root-ball pose for the start of a summon and a Rebirth."""
        return pose(
            tired(),
            hips_at_loc=at("hips", (0, 0.035, -0.17)),
            spine=t("spine", (X, 25)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 20)),
            thigh__L=t("thigh.L", (X, -64), (Y, -5)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -38)),
            thigh__R=t("thigh.R", (X, -58), (Y, 5)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -38)),
            regrow_at_scale=0.3,
        )

    def raised(base, grow=0.65):
        """The guardian rises with the shield high and new roots bright."""
        return pose(
            base,
            regrow_at_scale=grow,
            regrow=t("regrow", (Z, 35)),
            hips_at_loc=at("hips", (0, 0, -0.006)),
            hips=t("hips", (Z, -20)),
            spine=t("spine", (Z, -3), (X, 0)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 10), (X, -12)),
            beard=t("beard", (X, 10)),
            upperarm__L=t("upperarm.L", (X, -24), (Y, 6)),
            upperarm__R=t("upperarm.R", (X, -55), (Y, -8)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -10), (Y, -5)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, 6), (Y, 5)),
            shin__R=t("shin.R", (X, 6)),
            foot__R=t("foot.R", (X, -12)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, tired(breath))
    clips.append(low)

    # A long cycle and small lifts make the walk heavy, not a run.
    walk = Clip("walk", 32, loop=True)
    walk.key(0, step(1)).key(8, passing("R")).key(16, step(-1)).key(24, passing("L")).key(32, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, gather(stand())).key(15, bash(stand())).key(19, bash(stand(), 0.8))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 24)
    cast.key(0, stand()).key(5, call(stand(), 0.16)).key(12, call(stand(), 1.0, 20))
    cast.key(18, call(stand(), 1.0, 55)).key(24, call(stand(), 0.0, 80))
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then roots and rises.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, raised(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(8, pose(crouch(stand()), regrow_at_scale=0.55))
    summon.key(17, raised(stand(), 0.8)).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "rootbound-guard.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
