"""
Howling Charger (`orc.howlingCharger`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a big, heavy orc with a low head
and a wide howl, large tusks with iron caps, a wild dark mane, a fur mantle,
leather straps with iron rings, a red loincloth, spiked bracers and fur leg
wraps. A spiked round shield is on his left arm: a red face, an iron rim with
spikes and a big spike at the boss. An orc war banner is tied to his back: a
pole with horn tips and a ragged red banner with a cream sign. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/howling-charger.glb`; then
`bun unit-model:pack howling-charger` packs it for the game.

He holds the shield in front of him like a ram, and he turns to his right at
rest, so the face of the shield turns to the camera. The banner on his back
hangs in the plane of the pole and his front, so the camera sees its face.
The `jaw` bone opens his mouth: he howls at rest, and wider in the attack
and the summon. He has Swift and Charge, so his walk is a heavy run with the
head low, and his attack is a charge that drives the shield into the
target. He has no Keyword that he uses by his own action, so he has no cast
clip.
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

SKIN = hex_color("#a6a848")
SKIN_DARK = hex_color("#787c32")
HAIR = hex_color("#2a1e18")
HAIR_LIGHT = hex_color("#46342a")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#5a1c18")
TUSK = hex_color("#efe4c6")
PAINT = hex_color("#b8342a")
FUR = hex_color("#6a4c36")
FUR_LIGHT = hex_color("#cdb894")
LEATHER = hex_color("#5c3a26")
LEATHER_DARK = hex_color("#382418")
IRON = hex_color("#77736c")
IRON_DARK = hex_color("#4a4743")
STEEL = hex_color("#c2beb4")
RED = hex_color("#ac302a")
RED_DARK = hex_color("#6c1c18")
CLOTH = hex_color("#e6d6b4")
WOOD = hex_color("#5a3c26")
ROPE = hex_color("#c4a676")
HORN = hex_color("#ddd0ae")

# --- Proportions ---------------------------------------------------------------

# He is big and heavy: wide shoulders, a thick body and a low head.
HIP_Z = 0.44
WAIST_Z = 0.53
CHEST_Z = 0.625
SHOULDER_Z = 0.715
NECK_Z = 0.74
HEAD_C = Vector((0, -0.06, 0.8))
KNEE_Z = 0.25
ANKLE_Z = 0.055
LEG_X = 0.08

# The left forearm goes across the front with the shield on it; the right
# arm hangs with a fist. These are the rest (bind) positions.
SL = Vector((0.175, 0, SHOULDER_Z))
EL = Vector((0.24, -0.05, 0.58))
WL = Vector((0.11, -0.17, 0.56))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.175, 0, SHOULDER_Z))
ER = Vector((-0.255, 0.02, 0.58))
WR = Vector((-0.27, -0.05, 0.46))
TR = WR + (WR - ER).normalized() * 0.05

# The shield faces to the front and a little to the camera side.
SHIELD_N = Vector((-0.4, -1, 0.05)).normalized()
SHIELD_C = (EL + WL) / 2 + SHIELD_N * 0.06 + Vector((-0.02, 0, 0.0))
SHIELD_R = 0.19

# The banner pole is tied to his back.
POLE_X, POLE_Y = 0.02, 0.15
POLE_BOTTOM = 0.36
POLE_TOP = 1.28
BAR_Z = 1.2
BANNER_HALF = 0.13
BANNER_DROP = 0.34

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.02, NECK_Z), (0, -0.045, 0.765), "chest"),
    ("head", (0, -0.045, 0.765), (0, -0.06, 0.92), "neck"),
    ("jaw", (0, -0.04, HEAD_C.z - 0.012), (0, -0.1, HEAD_C.z - 0.05), "head"),
    ("mane", (0, 0.02, 0.84), (0, 0.08, 0.64), "head"),
    ("loin.F", (0, -0.11, 0.44), (0, -0.12, 0.24), "hips"),
    ("pole", (POLE_X, POLE_Y, 0.6), (POLE_X, POLE_Y, 0.8), "chest"),
    ("banner", (POLE_X, POLE_Y, BAR_Z), (POLE_X, POLE_Y, BAR_Z - 0.2), "pole"),
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

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.48, 0.57)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def mane_weights(co):
    return blend("mane", "head", co.z, 0.74, 0.8)


def loin_weights(co):
    return blend("loin.F", "hips", co.z, 0.38, 0.44)


def banner_weights(co):
    """The cloth hangs from the crossbar: its top stays, and its hem swings."""
    t = clamp01((BAR_Z - 0.04 - co.z) / 0.16)
    return {"banner": t, "pole": 1 - t}


def skirt_weights(co):
    """The fur strips follow the hips at the top, and the thighs lower."""
    t = clamp01((0.44 - co.z) / 0.16)
    side = co.x / 0.1
    return {
        "hips": 1 - t * 0.8,
        "thigh.L": t * clamp01(side) * 0.8,
        "thigh.R": t * clamp01(-side) * 0.8,
    }


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.07, 0.072, 0.07), 12, 9)
    # A heavy brow and a wide nose.
    brow = kit.sphere(head.bm, HEAD_C + Vector((0, -0.05, 0.022)), (0.062, 0.03, 0.018), 10, 5)
    head.paint(faces_of(brow), SKIN_DARK)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.068, 0.004)), HEAD_C + Vector((0, -0.088, -0.014)), 0.02, 0.009, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.064 * sign, 0.0, 0.004)), HEAD_C + Vector((0.13 * sign, 0.04, 0.04)), 0.022, 0.002, 5, squash=0.4)
        ring = kit.torus(head.bm, HEAD_C + Vector((0.08 * sign, 0.008, 0.012)), (1, 0, 0), 0.012, 0.003, 8, 3)
        head.paint(faces_of(ring), IRON)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.026 * sign, -0.066, 0.008)), (0.01, 0.006, 0.007), 6, 4)
        stripe = kit.slab(face.bm, HEAD_C + Vector((0.046 * sign, -0.054, -0.006)), (0.012, 0.004 * sign, 0), (0, 0.004, 0), (0, 0, 0.005))
        face.paint(faces_of(stripe), PAINT)
    # The inside of the howl, under the upper teeth.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.05, -0.036)), (0.04, 0.03, 0.026), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    teeth = kit.slab(face.bm, HEAD_C + Vector((0, -0.074, -0.02)), (0.03, 0, 0), (0, 0.006, 0), (0, 0, 0.005))
    face.paint(faces_of(teeth), TUSK)
    parts.append(face)

    # The lower jaw, with the big tusks and their iron caps.
    jaw = Part("jaw", SKIN, "jaw", shade=0.1)
    kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.036, -0.06)), (0.064, 0.05, 0.03), 12, 6)
    tongue = kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.056, -0.048)), (0.03, 0.022, 0.01), 8, 4)
    jaw.paint(faces_of(tongue), RED)
    for sign in (1, -1):
        tusk = kit.cone(jaw.bm, HEAD_C + Vector((0.034 * sign, -0.07, -0.058)), HEAD_C + Vector((0.05 * sign, -0.09, 0.0)), 0.014, 0.006, 6)
        jaw.paint(faces_of(tusk), TUSK)
        cap = kit.cone(jaw.bm, HEAD_C + Vector((0.048 * sign, -0.088, -0.008)), HEAD_C + Vector((0.054 * sign, -0.096, 0.024)), 0.01, 0.001, 5)
        jaw.paint(faces_of(cap), IRON)
    parts.append(jaw)

    # A wild dark mane, down the back of the head and the neck.
    mane = Part("mane", HAIR, mane_weights, shade=0.1)
    verts = kit.sphere(mane.bm, HEAD_C + Vector((0, 0.012, 0.014)), (0.074, 0.076, 0.074), 12, 8)
    kit.bmesh.ops.delete(mane.bm, geom=[v for v in verts if v.co.z < HEAD_C.z - 0.01 or (v.co.y < -0.03 and v.co.z < HEAD_C.z + 0.05)], context="VERTS")
    for index, angle in enumerate(range(-130, 131, 26)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.064 * math.sin(a), 0.064 * math.cos(a) + 0.01, 0.045))
        bottom = top + Vector((0.03 * math.sin(a), 0.11, -0.14 if abs(angle) < 80 else -0.1))
        middle = (top + bottom) / 2 + Vector((0.01 * math.sin(a), 0.03, 0.04))
        lock = kit.tube(mane.bm, [top, middle, bottom], [0.022, 0.018, 0.004], 5)
        if index % 2:
            mane.paint(faces_of(lock), HAIR_LIGHT)
    parts.append(mane)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.01, 0.69), (0, -0.05, 0.79), 0.06, 0.05, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    kit.sphere(torso.bm, (0, 0.0, 0.65), (0.17, 0.11, 0.105), 14, 8)
    kit.cone(torso.bm, (0, 0, 0.45), (0, 0, 0.62), 0.13, 0.15, 12, squash=0.8)
    # A big belly.
    kit.sphere(torso.bm, (0, -0.03, 0.52), (0.12, 0.1, 0.09), 12, 7)
    parts.append(torso)

    # Leather straps with iron rings across the chest.
    straps = Part("straps", LEATHER, torso_weights, shade=0.05)
    for sign in (1, -1):
        kit.tube(straps.bm, [(0.13 * sign, 0.08, 0.74), (0.12 * sign, -0.08, 0.72), (0.0, -0.12, 0.62), (-0.11 * sign, -0.12, 0.52), (-0.13 * sign, 0.0, 0.48)], [0.014] * 5, 4)
    for point in ((0.0, -0.124, 0.62), (0.08, -0.105, 0.69), (-0.08, -0.105, 0.69)):
        ring = kit.torus(straps.bm, point, (0, 1, 0), 0.02, 0.006, 10, 4)
        straps.paint(faces_of(ring), IRON)
    belt = kit.cone(straps.bm, (0, -0.01, 0.43), (0, -0.01, 0.48), 0.14, 0.136, 14, squash=0.86)
    straps.paint(faces_of(belt), LEATHER_DARK)
    buckle = kit.sphere(straps.bm, (0, -0.13, 0.455), (0.026, 0.012, 0.024), 8, 4)
    straps.paint(faces_of(buckle), IRON)
    # Ropes that tie the banner pole to his back.
    for z in (0.5, 0.68):
        rope = kit.torus(straps.bm, (POLE_X * 0.5, 0.02, z), (0, 0, 1), 0.14, 0.008, 14, 3)
        straps.paint(faces_of(rope), ROPE)
    parts.append(straps)

    # The fur mantle on the shoulders.
    def mantle_color(row, column):
        return FUR_LIGHT if column % 3 == 1 else FUR

    mantle = Part("mantle", FUR, "chest", shade=0.12)
    kit.ragged_cone(mantle, 0.79, 0.6, 0.09, 0.22, 14, 3, 0.8, 0.06, mantle_color, FUR, gap=math.radians(60), y_push=0.03)
    parts.append(mantle)

    def skirt_color(row, column):
        return FUR_LIGHT if column % 3 == 0 else (FUR if row < 2 else LEATHER_DARK)

    skirt = Part("skirt", FUR, skirt_weights)
    kit.ragged_cone(skirt, 0.44, 0.27, 0.138, 0.17, 16, 3, 0.86, 0.05, skirt_color, LEATHER_DARK, gap=math.radians(26))
    parts.append(skirt)

    loin = Part("loin.F", RED, loin_weights)

    def grid(inset):
        result = []
        for row in range(5):
            v = row / 4
            result.append([(lerp(-1, 1, c / 4) * lerp(0.055, 0.07, v), -(lerp(0.13, 0.15, v) - inset), lerp(0.44, 0.22 + 0.04 * (c % 2), v)) for c in range(5)])
        return result

    def loin_color(face_side, row, column):
        return RED_DARK if face_side == "back" or row == 3 else RED

    panel(loin, grid(0.0), grid(0.007), loin_color)
    parts.append(loin)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.012 * sign, 0, -0.01)), (0.062, 0.06, 0.06), 10, 7)
        kit.cone(upper.bm, s, e, 0.056, 0.046, 8)
        parts.append(upper)

        # A spiked iron shoulder plate.
        plate = Part(f"plate.{side}", IRON, f"upperarm.{side}", shade=0.08)
        verts = kit.sphere(plate.bm, s + Vector((0.02 * sign, 0, 0.028)), (0.07, 0.066, 0.042), 10, 6)
        plate.paint({f for v in verts if v.co.z < s.z for f in v.link_faces}, IRON_DARK)
        for dx, dy in ((0.0, -0.03), (0.0, 0.03), (0.035, 0.0)):
            spike = kit.cone(plate.bm, s + Vector(((0.022 + dx) * sign, dy, 0.055)), s + Vector(((0.032 + dx * 1.3) * sign, dy * 1.2, 0.12)), 0.014, 0.001, 4)
            plate.paint(faces_of(spike), STEEL)
        parts.append(plate)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.048, 0.04, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        verts = kit.cone(bracer.bm, e + d * 0.04, w - d * 0.004, 0.052, 0.046, 8)
        for face in faces_of(verts):
            if int(((face.calc_center_median() - e).dot(d)) * 80) % 3 == 0:
                bracer.paint([face], LEATHER_DARK)
        out = Vector((sign, 0, 0)) if side == "R" else Vector((0, 0, 1))
        for along in (0.06, 0.11):
            spike = kit.cone(bracer.bm, e + d * along + out * 0.045, e + d * along + out * 0.08, 0.011, 0.001, 4)
            bracer.paint(faces_of(spike), STEEL)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.03, (0.036, 0.033, 0.036), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.074, 0.056, 8)
        parts.append(thigh)

        # Fur wraps on the shins with leather straps, and an iron knee guard.
        shin = Part(f"shin.{side}", FUR, f"shin.{side}", shade=0.12)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.05)), 0.062, 0.054, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 45) % 3 == 0:
                shin.paint([face], LEATHER_DARK)
        cuff = kit.torus(shin.bm, ankle + Vector((0, 0, 0.06)), (0, 0, 1), 0.058, 0.018, 10, 4)
        shin.paint(faces_of(cuff), FUR_LIGHT)
        guard = kit.sphere(shin.bm, knee + Vector((0, -0.03, 0.006)), (0.048, 0.028, 0.044), 8, 6)
        shin.paint(faces_of(guard), IRON)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.055)), ankle - Vector((0, 0, 0.02)), 0.058, 0.06, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.038, 0.026), (0.088, 0.16, 0.052))
        parts.append(boot)
    return parts


def shield_parts():
    shield = Part("shield", RED, "forearm.L", shade=0.04)
    side = SHIELD_N.cross(Z).normalized()
    up = side.cross(SHIELD_N).normalized()
    back = SHIELD_C - SHIELD_N * 0.012
    front = SHIELD_C + SHIELD_N * 0.012
    disc = kit.cone(shield.bm, back, front, SHIELD_R, SHIELD_R * 0.97, 16)
    for face in faces_of(disc):
        if (face.calc_center_median() - SHIELD_C).dot(SHIELD_N) < -0.008:
            shield.paint([face], WOOD)
    # Iron bands across the face, from the rim to the boss.
    for index in range(4):
        a = math.pi / 4 + index * math.pi / 2
        out = side * math.cos(a) + up * math.sin(a)
        band = kit.cone(shield.bm, front + out * 0.03, front + out * SHIELD_R * 0.92, 0.01, 0.01, 4, squash=0.5)
        shield.paint(faces_of(band), IRON_DARK)
    rim = kit.torus(shield.bm, SHIELD_C, SHIELD_N, SHIELD_R, 0.016, 18, 5)
    shield.paint(faces_of(rim), IRON)
    # Spikes round the rim, and a big spike at the boss.
    for index in range(8):
        a = 2 * math.pi * index / 8 + math.pi / 8
        out = side * math.cos(a) + up * math.sin(a)
        base = SHIELD_C + out * SHIELD_R
        spike = kit.cone(shield.bm, base, base + out * 0.045 + SHIELD_N * 0.03, 0.016, 0.001, 5)
        shield.paint(faces_of(spike), STEEL)
    boss = kit.sphere(shield.bm, front, (0.045, 0.045, 0.045), 10, 6)
    shield.paint(faces_of(boss), IRON)
    big = kit.cone(shield.bm, front + SHIELD_N * 0.02, front + SHIELD_N * 0.11, 0.032, 0.002, 6)
    shield.paint(faces_of(big), STEEL)
    return [shield]


def banner_parts():
    parts = []
    pole = Part("pole", WOOD, "pole", shade=0.04)
    kit.cone(pole.bm, (POLE_X, POLE_Y, POLE_BOTTOM), (POLE_X, POLE_Y, POLE_TOP), 0.014, 0.012, 6)
    # The crossbar, with a horn tip at each end, and a horn on top.
    kit.cone(pole.bm, (POLE_X, POLE_Y + BANNER_HALF + 0.02, BAR_Z), (POLE_X, POLE_Y - BANNER_HALF - 0.02, BAR_Z), 0.011, 0.011, 5)
    for sign in (1, -1):
        tip = kit.tube(pole.bm, [(POLE_X, POLE_Y + sign * (BANNER_HALF + 0.015), BAR_Z), (POLE_X, POLE_Y + sign * (BANNER_HALF + 0.05), BAR_Z + 0.02), (POLE_X, POLE_Y + sign * (BANNER_HALF + 0.06), BAR_Z + 0.07)], [0.016, 0.01, 0.002], 5)
        pole.paint(faces_of(tip), HORN)
    top = kit.cone(pole.bm, (POLE_X, POLE_Y, POLE_TOP - 0.01), (POLE_X, POLE_Y - 0.01, POLE_TOP + 0.08), 0.02, 0.002, 6)
    pole.paint(faces_of(top), HORN)
    for z in (1.02, 1.1):
        wrap = kit.cone(pole.bm, (POLE_X, POLE_Y, z), (POLE_X, POLE_Y, z + 0.03), 0.017, 0.017, 6)
        pole.paint(faces_of(wrap), RED_DARK)
    parts.append(pole)

    # The banner: red, with a cream sign and a ragged hem, on the camera side of the pole.
    banner = Part("banner", RED, banner_weights, shade=0.1)
    columns, rows = 8, 7
    face_x = POLE_X - 0.02

    def grid(offset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = lerp(-1, 1, column / columns)
                torn = 0.07 * v * (((column * 7) % 5) / 4) if row == rows else 0.0
                z = BAR_Z - 0.02 - BANNER_DROP * v + torn
                ripple = 0.014 * math.sin(u * 3 + v * 2)
                line.append((face_x + offset + ripple, POLE_Y + u * lerp(BANNER_HALF, BANNER_HALF * 0.9, v), z))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        u = lerp(-1, 1, (column + 0.5) / columns)
        v = (row + 0.5) / rows
        if row == rows - 1:
            return RED_DARK
        # The cream sign: two crossed bars, as on the card.
        if 0.12 < v < 0.8 and (abs(u - (v - 0.46) * 1.6) < 0.18 or abs(u + (v - 0.46) * 1.6) < 0.18):
            return CLOTH
        return RED if (row + column) % 5 else RED_DARK

    panel(banner, grid(-0.004), grid(0.004), color_of)
    parts.append(banner)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("HowlingCharger", BONES)
    parts = head_parts() + body_parts() + limb_parts() + shield_parts() + banner_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "HowlingChargerMesh")
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

    def stand(breath=0.0, sway=0.0, howl=0.3):
        """
        The idle stance: heavy and low, turned to his right, the shield in
        front and the head low behind it, with a howl. The banner moves in the wind.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.02 - breath * 0.005)),
            "hips": t("hips", (Z, -16), (Y, sway * 2)),
            "spine": t("spine", (Z, -2), (X, 16 + breath)),
            "chest": t("chest", (X, 6 - breath * 2)),
            "neck": t("neck", (Z, 8), (X, 6)),
            "head": t("head", (Z, 10 + sway * 3), (X, -20 + breath * 3)),
            "jaw": t("jaw", (X, 8 + howl * 22)),
            "mane": t("mane", (X, -breath * 4), (Y, sway * 4)),
            "upperarm.R": t("upperarm.R", (Y, -10), (X, -10 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -30)),
            "thigh.L": t("thigh.L", (X, -20), (Y, -8)),
            "shin.L": t("shin.L", (X, 22)),
            "foot.L": t("foot.L", (X, -2)),
            "thigh.R": t("thigh.R", (X, 12), (Y, 8)),
            "shin.R": t("shin.R", (X, 12)),
            "foot.R": t("foot.R", (X, -24)),
            "loin.F": t("loin.F", (X, -8)),
            "banner": t("banner", (Y, sway * 5), (X, 4 + breath * 3)),
        }

    def slump(breath=0.0):
        """Low HP: down on one knee behind the shield, its rim on the ground."""
        return pose(
            stand(howl=0.1),
            hips_at_loc=at("hips", (0, 0.03, -0.17 - breath * 0.004)),
            spine=t("spine", (Z, -2), (X, 22 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2)),
            head=t("head", (Z, 8), (X, 6 + breath * 4)),
            upperarm__L=t("upperarm.L", (X, 30)),
            forearm__L=t("forearm.L", (X, 6)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, -10)),
            forearm__R=t("forearm.R", (X, -50)),
            thigh__L=t("thigh.L", (X, -76), (Y, -8)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 92)),
            foot__R=t("foot.R", (X, -40)),
            mane=t("mane", (X, 14)),
            loin__F=t("loin.F", (X, -30)),
            banner=t("banner", (X, -10)),
        )

    def recoil(base, amount=1.0):
        """A hit on the shield pushes him back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04 * amount, -0.02 - 0.008 * amount)),
            spine=t("spine", (Z, -2), (X, -4 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 10), (X, -20 * amount)),
            jaw=t("jaw", (X, 10)),
            upperarm__L=t("upperarm.L", (X, -10 * amount), (Y, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, -30 * amount), (X, 10 * amount)),
            mane=t("mane", (X, -14 * amount)),
            banner=t("banner", (X, 18 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.05)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -6)),
            head=t("head", (X, -24)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, 12)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 24)),
            upperarm__R=t("upperarm.R", (Y, -30), (X, 10)),
            mane=t("mane", (X, 20)),
            banner=t("banner", (X, -20)),
        )

    def fallen(base, bounce=0.0):
        """Face down on the shield: he falls to the front, and the banner on his back falls with him."""
        return pose(
            base,
            root=t("root", (X, 82 - bounce)),
            root_at_loc=at("root", (0, -0.02, 0.17)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -30), (Z, -30)),
            jaw=t("jaw", (X, 20)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 20)),
            upperarm__R=t("upperarm.R", (Y, -50), (X, -60)),
            forearm__R=t("forearm.R", (X, -30)),
            thigh__L=t("thigh.L", (X, 4), (Y, -6)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 10), (Y, 6)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, 30)),
            mane=t("mane", (X, -20)),
            loin__F=t("loin.F", (X, 30)),
            banner=t("banner", (X, -40)),
        )

    def crouch(base):
        """Down on one knee behind the shield, as a summon starts and a Rebirth gets up."""
        return pose(
            slump(),
            spine=t("spine", (Z, -2), (X, 30)),
            head=t("head", (Z, 8), (X, 16)),
            jaw=t("jaw", (X, 4)),
        )

    def howl(base, shake=0.0):
        """Up, the head back, the right fist high and the mouth wide open in a howl."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -12)),
            neck=t("neck", (X, -10)),
            head=t("head", (Z, 6 + shake * 3), (X, -26)),
            jaw=t("jaw", (X, 40)),
            upperarm__R=t("upperarm.R", (X, -150 + shake * 6), (Y, -16)),
            forearm__R=t("forearm.R", (X, -30)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, 10)),
            mane=t("mane", (X, 16)),
            banner=t("banner", (X, 10 + shake * 16), (Y, shake * 8)),
        )

    def run(front, lift=0.0):
        """A heavy run with the head low behind the shield. `front` is 1 for the left foot, -1 for the right; `lift` is in the air."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(howl=0.6),
            hips_at_loc=at("hips", (0, 0, -0.04 + lift * 0.045)),
            hips=t("hips", (Z, -12 - 4 * front)),
            spine=t("spine", (Z, -2), (X, 20), (Y, -3 * front)),
            chest=t("chest", (X, 6), (Z, -4 * front)),
            neck=t("neck", (Z, 8), (X, -12)),
            head=t("head", (Z, 8), (X, -16)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, -10 + 40 * front)),
            forearm__R=t("forearm.R", (X, -60)),
            mane=t("mane", (X, 20)),
            loin__F=t("loin.F", (X, -34)),
            banner=t("banner", (X, 28), (Y, 6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -52 + lift * 10)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 30 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 30 - lift * 10)),
                f"shin__{back}": t(f"shin.{back}", (X, 30 + lift * 40)),
                f"foot__{back}": t(f"foot.{back}", (X, 20)),
            },
        )

    # The attack: he draws back behind the shield, then charges and drives it
    # into the target with a howl. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the shield hits at frame 15 of 30.
    def brace(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.05, -0.06)),
            hips=t("hips", (Z, -22)),
            spine=t("spine", (Z, -4), (X, 18)),
            chest=t("chest", (X, 8)),
            head=t("head", (Z, 12), (X, 0)),
            jaw=t("jaw", (X, 10)),
            upperarm__L=t("upperarm.L", (X, 6), (Y, 4)),
            upperarm__R=t("upperarm.R", (Y, -20), (X, 30)),
            forearm__R=t("forearm.R", (X, -50)),
            thigh__L=t("thigh.L", (X, -40), (Y, -8)),
            shin__L=t("shin.L", (X, 50)),
            thigh__R=t("thigh.R", (X, 0), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, -30)),
            mane=t("mane", (X, 6)),
            banner=t("banner", (X, -10)),
        )

    def bash(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.15, -0.04)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, 22)),
            chest=t("chest", (X, 6), (Z, 6)),
            neck=t("neck", (X, -16)),
            head=t("head", (Z, 4), (X, -20)),
            jaw=t("jaw", (X, 42)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 6)),
            forearm__L=t("forearm.L", (X, 10)),
            upperarm__R=t("upperarm.R", (Y, -20), (X, 40)),
            forearm__R=t("forearm.R", (X, -40)),
            thigh__L=t("thigh.L", (X, -62), (Y, -8)),
            shin__L=t("shin.L", (X, 50)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, 38), (Y, 8)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -10)),
            mane=t("mane", (X, 30)),
            loin__F=t("loin.F", (X, -40)),
            banner=t("banner", (X, 40)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, howl_open in ((0, 0, 0, 0.3), (12, 0.5, 1, 0.8), (24, 1, 0, 1), (36, 0.5, -1, 0.5), (48, 0, 0, 0.3)):
        idle.key(frame, stand(breath, sway, howl_open))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    # Swift: a fast, heavy run.
    walk = Clip("walk", 16, loop=True)
    walk.key(0, run(1)).key(4, run(1, 1)).key(8, run(-1)).key(12, run(-1, 1)).key(16, run(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, brace(stand())).key(15, bash(stand())).key(19, bash(stand()))
    attack.key(26, stand()).key(30, stand())
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
    rebirth.key(32, crouch(stand())).key(39, howl(stand(), 1)).key(43, howl(stand(), -1)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.15))))
    summon.key(15, howl(stand(), 1)).key(19, howl(stand(), -1)).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "howling-charger.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
