"""
Pyreaxe Ravager (`orc.pyreaxeRavager`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a fierce orc woman with a high red
crest and a long red mane, a gold band, red war paint, a spiked iron plate
with fur on the right shoulder, a leather corset with gold studs, a red
loincloth, a scorched red cloak, spiked greaves with fur, and a burning
two-handed axe with ember grooves. A mushroom roasts on the top spike of the
axe. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/pyreaxe-ravager.glb`; then
`bun unit-model:pack pyreaxe-ravager` packs it for the game.

She carries the axe on her right shoulder, so the blade faces the camera.
The left hand always holds the haft (IK to the `grip.L` bone). The chop uses
IK for the right hand and the `Aim` constraint for the axe. The `flame` bone
carries the flames on the blade: they flicker at rest, flare in the summon
and go out in the death. She is Heroic, so she looks to the front. She has
no Keyword that she uses by her own action, so she has no cast clip.
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

SKIN = hex_color("#a6aa4e")
SKIN_DARK = hex_color("#7a7e36")
HAIR = hex_color("#cc302a")
HAIR_DARK = hex_color("#8c1e1a")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#4e1a16")
TUSK = hex_color("#f0e6c8")
PAINT = hex_color("#b8342a")
GOLD = hex_color("#d8a846")
GOLD_DARK = hex_color("#946e2a")
LEATHER = hex_color("#5c3a26")
LEATHER_DARK = hex_color("#3a2418")
IRON = hex_color("#6e6a64")
IRON_DARK = hex_color("#45423d")
STEEL = hex_color("#b2aea4")
FUR = hex_color("#8a6a50")
FUR_LIGHT = hex_color("#dccfb6")
CLOAK = hex_color("#8e2a22")
CLOAK_DARK = hex_color("#561a16")
SCORCH = hex_color("#2c1c16")
WOOD = hex_color("#4a3020")
EMBER = hex_color("#ff7a26")
FLAME = hex_color("#ffae34")
FLAME_HOT = hex_color("#fff0a0")
CAP = hex_color("#8a5232")
CAP_DARK = hex_color("#5a321e")
STEM = hex_color("#ecdec2")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.755
HEAD_C = Vector((0, -0.014, 0.848))
KNEE_Z = 0.265
ANKLE_Z = 0.055
LEG_X = 0.07

# She carries the axe on her right shoulder: the right hand holds the haft at
# the shoulder, and the left hand holds it lower, in front of the belly. The
# haft points up and back, so the head is behind the right shoulder. These
# are the rest (bind) positions.
SL = Vector((0.155, 0, SHOULDER_Z))
SR = Vector((-0.155, 0, SHOULDER_Z))
ER = Vector((-0.24, 0.05, 0.6))
WR = Vector((-0.1, -0.04, 0.6))
GRIP_R = WR + (WR - ER).normalized() * 0.025
TR = WR + (WR - ER).normalized() * 0.05
GRIP_L = Vector((0.0, -0.15, 0.5))
WL = GRIP_L
EL = Vector((0.2, -0.06, 0.56))
TL = WL + (WL - EL).normalized() * 0.05

AXE = (GRIP_R - GRIP_L).normalized()
# The head of the axe, along the haft from the right hand.
HEAD_AT = 0.3
AXE_HEAD = GRIP_R + AXE * HEAD_AT
# The blade reaches to the front and up, so its face turns to the camera side.
_EDGE = Vector((0, -0.6, 0.8))
BLADE_OUT = (_EDGE - AXE * _EDGE.dot(AXE)).normalized()

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.006, NECK_Z), (0, -0.01, 0.79), "chest"),
    ("head", (0, -0.01, 0.79), (0, -0.014, 0.95), "neck"),
    # The long red mane hangs down the back.
    ("hair", (0, 0.07, 0.86), (0, 0.12, 0.66), "head"),
    ("cape", (0, 0.1, 0.71), (0, 0.16, 0.3), "chest"),
    ("cloth.F", (0, -0.1, 0.46), (0, -0.11, 0.26), "hips"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.35, 0.25, 0.4), (0.35, 0.25, 0.45), "chest"),
    ("pole.R", (-0.35, 0.25, 0.4), (-0.35, 0.25, 0.45), "chest"),
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
    ("axe", tuple(GRIP_R), tuple(GRIP_R + AXE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + AXE * 0.05), "axe"),
    ("flame", tuple(AXE_HEAD), tuple(AXE_HEAD + BLADE_OUT * 0.08), "axe"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z + 0.01:
        return blend("hips", "spine", co.z, 0.5, 0.6)
    return blend("spine", "chest", co.z, 0.62, 0.69)


def hair_weights(co):
    return blend("hair", "head", co.z, 0.74, 0.83)


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.56, 0.68)


def cloth_weights(co):
    return blend("cloth.F", "hips", co.z, 0.4, 0.46)


def skirt_weights(co):
    """The leather strips follow the hips at the top, and the thighs lower."""
    t = clamp01((0.46 - co.z) / 0.16)
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
    kit.sphere(head.bm, HEAD_C, (0.064, 0.068, 0.07), 12, 9)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.042)), (0.056, 0.046, 0.036), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.064, 0.002)), HEAD_C + Vector((0, -0.08, -0.016)), 0.016, 0.007, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.06 * sign, 0.008, 0.004)), HEAD_C + Vector((0.13 * sign, 0.04, 0.045)), 0.02, 0.002, 5, squash=0.4)
        ring = kit.torus(head.bm, HEAD_C + Vector((0.076 * sign, 0.014, -0.014)), (1, 0, 0), 0.012, 0.003, 8, 3)
        head.paint(faces_of(ring), GOLD)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.026 * sign, -0.062, 0.014)), (0.009, 0.006, 0.007), 6, 4)
        # Angry brows, down at the middle.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.066, 0.03)), (0.016, 0.0, -0.006 * sign), (0, 0.006, 0), (0.0, 0.0, 0.005))
        face.paint(faces_of(brow), HAIR_DARK)
        # A war paint stripe down each cheek.
        stripe = kit.slab(face.bm, HEAD_C + Vector((0.042 * sign, -0.054, -0.012)), (0.006, 0.003 * sign, 0), (0, 0.004, 0), (0.002 * sign, 0, 0.024))
        face.paint(faces_of(stripe), PAINT)
    # She roars: an open mouth.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.066, -0.04)), (0.028, 0.014, 0.02), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.026 * sign, -0.07, -0.054)), HEAD_C + Vector((0.034 * sign, -0.078, -0.016)), 0.009, 0.001, 5)
    parts.append(tusks)

    # The high red crest from the brow to the back of the head, and the mane.
    hair = Part("hair", HAIR, hair_weights, shade=0.14)
    for index in range(7):
        a = math.radians(-50 + index * 25)
        root = HEAD_C + Vector((0, 0.07 * math.sin(a) + 0.004, 0.07 * math.cos(a)))
        height = 0.07 + 0.05 * math.sin(math.radians(index * 30))
        tip = root + Vector((0, 0.03 + 0.012 * index, height))
        lock = kit.cone(hair.bm, root, tip, 0.03, 0.003, 5, squash=0.5)
        if index % 2:
            hair.paint(faces_of(lock), HAIR_DARK)
    mane = kit.tube(
        hair.bm,
        [HEAD_C + Vector((0, 0.06, 0.04)), HEAD_C + Vector((0, 0.1, -0.04)), HEAD_C + Vector((0.01, 0.12, -0.13)), HEAD_C + Vector((0.02, 0.14, -0.22))],
        [0.05, 0.058, 0.045, 0.01],
        7,
    )
    for face in faces_of(mane):
        if int(face.calc_center_median().z * 60) % 3 == 0:
            hair.paint([face], HAIR_DARK)
    for sign in (1, -1):
        braid = kit.tube(
            hair.bm,
            [HEAD_C + Vector((0.05 * sign, 0.03, 0.02)), HEAD_C + Vector((0.07 * sign, 0.06, -0.08)), HEAD_C + Vector((0.07 * sign, 0.09, -0.17))],
            [0.02, 0.018, 0.004],
            5,
        )
        hair.paint(faces_of(braid), HAIR_DARK)
    parts.append(hair)

    # A gold band at the foot of the crest.
    band = Part("band", GOLD, "head", shade=0.06)
    kit.torus(band.bm, HEAD_C + Vector((0, 0.004, 0.034)), (0, 0.15, 1), 0.067, 0.008, 14, 4)
    gem = kit.sphere(band.bm, HEAD_C + Vector((0, -0.066, 0.046)), (0.012, 0.008, 0.012), 6, 4)
    band.paint(faces_of(gem), PAINT)
    parts.append(band)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.006, 0.72), (0, -0.01, 0.8), 0.044, 0.04, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    body = Part("body", LEATHER, torso_weights, shade=0.14)
    kit.cone(body.bm, (0, 0.0, 0.46), (0, -0.004, 0.62), 0.104, 0.098, 12, squash=0.74)
    kit.sphere(body.bm, (0, 0.0, 0.665), (0.135, 0.082, 0.085), 12, 8)
    # Gold studs on the corset.
    for z in (0.5, 0.56, 0.62):
        for sign in (1, -1):
            stud = kit.sphere(body.bm, (0.04 * sign, -0.076, z), (0.009, 0.006, 0.009), 5, 3)
            body.paint(faces_of(stud), GOLD)
    parts.append(body)

    # Skin shows at the top of the chest, with a stripe of war paint.
    chest = Part("chest", SKIN, "chest", shade=0.08)
    kit.sphere(chest.bm, (0, -0.042, 0.7), (0.1, 0.05, 0.05), 10, 6)
    for sign in (1, -1):
        kit.sphere(chest.bm, (0.1 * sign, 0.005, 0.715), (0.06, 0.058, 0.05), 8, 6)
    stripe = kit.slab(chest.bm, (0.03, -0.088, 0.71), (0.04, 0, -0.02), (0, 0.004, 0), (0, 0, 0.006))
    chest.paint(faces_of(stripe), PAINT)
    parts.append(chest)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, -0.004, 0.445), (0, -0.004, 0.49), 0.112, 0.108, 14, squash=0.86)
    for index in range(5):
        a = math.radians(-60 + index * 30)
        plate = kit.sphere(belt.bm, (0.11 * math.sin(a), -0.094 * math.cos(a), 0.467), (0.018, 0.012, 0.018), 6, 4)
        belt.paint(faces_of(plate), GOLD if index % 2 == 0 else GOLD_DARK)
    parts.append(belt)

    def skirt_color(row, column):
        return LEATHER_DARK if row == 2 or column % 3 == 0 else LEATHER

    skirt = Part("skirt", LEATHER, skirt_weights)
    kit.ragged_cone(skirt, 0.46, 0.3, 0.112, 0.15, 16, 3, 0.85, 0.05, skirt_color, LEATHER_DARK, gap=math.radians(28))
    parts.append(skirt)

    cloth = Part("cloth.F", CLOAK, cloth_weights)

    def grid(inset):
        result = []
        for row in range(5):
            v = row / 4
            result.append([(lerp(-1, 1, c / 4) * lerp(0.05, 0.065, v), -(lerp(0.1, 0.118, v) - inset), lerp(0.46, 0.21 + 0.04 * (c % 2), v)) for c in range(5)])
        return result

    def cloth_color(face_side, row, column):
        return CLOAK_DARK if face_side == "back" or row == 3 else CLOAK

    panel(cloth, grid(0.0), grid(0.007), cloth_color)
    parts.append(cloth)

    def cape_color(row, column):
        if row == 4:
            return SCORCH
        return CLOAK_DARK if column % 4 == 1 or row == 3 else CLOAK

    cape = Part("cape", CLOAK, cape_weights)
    kit.ragged_cone(cape, 0.73, 0.14, 0.14, 0.24, 14, 5, 0.75, 0.1, cape_color, CLOAK_DARK, gap=math.radians(110), y_push=0.1)
    parts.append(cape)

    # A spiked iron plate with fur on the right shoulder, and fur on the left.
    plate = Part("plate.R", IRON, "upperarm.R", shade=0.08)
    kit.sphere(plate.bm, SR + Vector((-0.02, 0, 0.03)), (0.07, 0.066, 0.038), 10, 6)
    for dx, dy in ((0.0, -0.03), (0.025, 0.02), (0.045, -0.005), (0.015, 0.045)):
        spike = kit.cone(plate.bm, SR + Vector((-0.02 - dx, dy, 0.055)), SR + Vector((-0.03 - dx * 1.4, dy * 1.3, 0.12)), 0.013, 0.001, 4)
        plate.paint(faces_of(spike), STEEL)
    trim = kit.torus(plate.bm, SR + Vector((-0.02, 0, 0.0)), (0.3, 0, 1), 0.062, 0.016, 12, 4)
    plate.paint(faces_of(trim), FUR_LIGHT)
    parts.append(plate)
    fur = Part("fur.L", FUR, "upperarm.L", shade=0.1)
    kit.sphere(fur.bm, SL + Vector((0.015, 0, 0.022)), (0.06, 0.06, 0.036), 8, 6)
    parts.append(fur)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.046, 0.04, 8)
        stripe = kit.cone(upper.bm, s + (e - s) * 0.45, s + (e - s) * 0.55, 0.047, 0.046, 8)
        upper.paint(faces_of(stripe), PAINT)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.04, 0.034, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        kit.cone(bracer.bm, e + d * 0.05, w - d * 0.005, 0.044, 0.04, 8)
        for along in (0.08, 0.13):
            spike = kit.cone(bracer.bm, e + d * along + Vector((0.035 * sign, 0, 0)), e + d * along + Vector((0.07 * sign, 0.02, 0)), 0.01, 0.001, 4)
            bracer.paint(faces_of(spike), STEEL)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.026, (0.03, 0.028, 0.032), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.064, 0.048, 8)
        stripe = kit.cone(thigh.bm, (hip + knee) / 2 + Vector((0, 0, -0.01)), (hip + knee) / 2 + Vector((0, 0, 0.012)), 0.06, 0.061, 8)
        thigh.paint(faces_of(stripe), PAINT)
        parts.append(thigh)

        # Spiked iron greaves with a fur cuff at the knee, and iron boots.
        shin = Part(f"shin.{side}", IRON, f"shin.{side}", shade=0.1)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.02)), ankle + Vector((0, 0, 0.04)), 0.05, 0.046, 8)
        cuff = kit.torus(shin.bm, knee, (0, 0, 1), 0.05, 0.02, 10, 4)
        shin.paint(faces_of(cuff), FUR_LIGHT)
        for z in (0.2, 0.13):
            spike = kit.cone(shin.bm, Vector((LEG_X * sign, -0.04, z)), Vector((LEG_X * sign, -0.085, z + 0.02)), 0.012, 0.001, 4)
            shin.paint(faces_of(spike), STEEL)
        parts.append(shin)

        boot = Part(f"boot.{side}", IRON_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.05)), ankle - Vector((0, 0, 0.02)), 0.054, 0.056, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.036, 0.026), (0.08, 0.15, 0.052))
        cap = kit.cone(boot.bm, (LEG_X * sign, -0.1, 0.028), (LEG_X * sign, -0.12, 0.02), 0.032, 0.012, 6, squash=0.6)
        boot.paint(faces_of(cap), IRON)
        parts.append(boot)
    return parts


def axe_parts():
    axe = Part("axe", WOOD, "axe", shade=0.04)
    thick = AXE.cross(BLADE_OUT).normalized()
    top = GRIP_R + AXE * (HEAD_AT + 0.11)
    kit.cone(axe.bm, GRIP_L - AXE * 0.1, top, 0.014, 0.012, 6)
    for along in (-0.05, 0.03):
        wrap = kit.cone(axe.bm, GRIP_R + AXE * along, GRIP_R + AXE * (along + 0.03), 0.017, 0.017, 6)
        axe.paint(faces_of(wrap), LEATHER)
    pommel = kit.sphere(axe.bm, GRIP_L - AXE * 0.105, (0.02, 0.02, 0.02), 6, 4)
    axe.paint(faces_of(pommel), GOLD)
    collar = kit.cone(axe.bm, AXE_HEAD - AXE * 0.06, AXE_HEAD + AXE * 0.06, 0.028, 0.028, 6)
    axe.paint(faces_of(collar), IRON_DARK)
    spike = kit.cone(axe.bm, top, top + AXE * 0.07, 0.016, 0.001, 4)
    axe.paint(faces_of(spike), STEEL)

    # One broad crescent blade with a jagged edge and glowing ember grooves.
    columns, rows = 8, 4

    def grid(depth):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = lerp(-1, 1, column / columns)
                reach = 0.025 + v * 0.13 + 0.045 * (1 - u * u) * v
                if row == rows:
                    reach += 0.012 * (column % 2)
                # The tips of the crescent flare out along the haft.
                along = u * lerp(0.05, 0.13, v) + 0.06 * u**3 * v
                line.append(AXE_HEAD + AXE * along + BLADE_OUT * reach + thick * depth * lerp(1.0, 0.3, v))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if row == rows - 1:
            return STEEL
        if row == 1 and column % 3 != 0:
            return EMBER
        return IRON_DARK if row == 0 else IRON

    edges = panel(axe, grid(0.014), grid(-0.014), color_of)
    axe.paint(edges, STEEL)
    # A short spike at the back of the head.
    back = kit.cone(axe.bm, AXE_HEAD - BLADE_OUT * 0.02, AXE_HEAD - BLADE_OUT * 0.09, 0.02, 0.002, 4)
    axe.paint(faces_of(back), IRON)

    # The mushroom on the top spike.
    shroom = top + AXE * 0.04
    stem = kit.cone(axe.bm, shroom - AXE * 0.02, shroom + AXE * 0.016, 0.015, 0.013, 6)
    axe.paint(faces_of(stem), STEM)
    cap = kit.cone(axe.bm, shroom + AXE * 0.012, shroom + AXE * 0.05, 0.042, 0.006, 10)
    for face in faces_of(cap):
        center = face.calc_center_median()
        axe.paint([face], CAP_DARK if (center - shroom).dot(AXE) < 0.016 else CAP)

    # The flames along the edge of the blade: curved tongues, orange at the
    # foot and pale yellow at the tip.
    flames = Part("flames", FLAME, "flame", shade=0.0)
    for index, (u, height, lean) in enumerate(((-0.8, 0.07, -0.02), (-0.4, 0.11, 0.01), (0.0, 0.14, -0.01), (0.4, 0.1, 0.02), (0.8, 0.065, 0.0))):
        base = AXE_HEAD + AXE * (u * 0.16 + 0.04 * u**3) + BLADE_OUT * (0.16 + 0.04 * (1 - u * u))
        side = AXE * (lean + 0.02 * u)
        points = [base, base + Z * height * 0.4 + BLADE_OUT * 0.02 + side * 0.4, base + Z * height * 0.75 + side, base + Z * height + side * 2.2]
        tongue = kit.tube(flames.bm, points, [0.032, 0.03, 0.018, 0.002], 6)
        for face in faces_of(tongue):
            rise = (face.calc_center_median() - base).dot(Z) / height
            flames.paint([face], EMBER if rise < 0.3 else (FLAME if rise < 0.7 else FLAME_HOT))
    core = kit.cone(flames.bm, AXE_HEAD + BLADE_OUT * 0.17 - AXE * 0.1, AXE_HEAD + BLADE_OUT * 0.17 + AXE * 0.1, 0.022, 0.022, 6)
    flames.paint(faces_of(core), EMBER)
    return [axe, flames]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("PyreaxeRavager", BONES)
    parts = head_parts() + body_parts() + limb_parts() + axe_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "PyreaxeRavagerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the haft, the right hand to swing. The axe aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "axe_aim": kit.add_empty("axe_aim"),
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
    aim = bones["axe"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["axe_aim"]
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

    axe_rest = rig.data.bones["axe"].matrix_local.to_quaternion()

    def aimed(direction, roll=0.0):
        """The world rotation of the axe that points the haft along `direction`, turned `roll` degrees about it."""
        direction = Vector(direction).normalized()
        spin = kit.Quaternion(direction, math.radians(roll))
        return spin @ AXE.rotation_difference(direction) @ axe_rest

    def swing(base, hand, direction, roll=0.0):
        """The right hand and the axe by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "axe_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "axe_aim_at_rot": aimed(direction, roll),
            },
        )

    def stand(breath=0.0, sway=0.0, flicker=0.0):
        """
        The idle stance: the feet wide, the left foot in front, turned a little
        to her right, the axe on the right shoulder. She looks to the front.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.016 - breath * 0.004)),
            "hips": t("hips", (Z, -16), (Y, sway * 2)),
            "spine": t("spine", (Z, -2), (X, 4 + breath)),
            "chest": t("chest", (X, -3 - breath * 2)),
            "neck": t("neck", (Z, 8)),
            "head": t("head", (Z, 8 + sway * 3), (X, -2 + breath * 2)),
            "hair": t("hair", (X, -4 - breath * 4), (Y, sway * 4)),
            "upperarm.R": t("upperarm.R", (X, -breath * 2)),
            "thigh.L": t("thigh.L", (X, -20), (Y, -8)),
            "shin.L": t("shin.L", (X, 20)),
            "foot.L": t("foot.L", (X, 0)),
            "thigh.R": t("thigh.R", (X, 12), (Y, 8)),
            "shin.R": t("shin.R", (X, 10)),
            "foot.R": t("foot.R", (X, -22)),
            "cloth.F": t("cloth.F", (X, -6)),
            "cape": t("cape", (X, -4 - breath * 3), (Y, sway * 3)),
            "flame@scale": 1.0 + flicker * 0.14,
            "forearm.L/IK": 1.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, she leans on the axe, its head on the ground. The flames are low."""
        return swing(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.02, -0.15 - breath * 0.005)),
                spine=t("spine", (Z, -2), (X, 18 + breath * 3)),
                chest=t("chest", (X, 8 + breath * 3)),
                neck=t("neck", (Z, 8), (X, -6)),
                head=t("head", (Z, 6), (X, -4 - breath * 3)),
                hair=t("hair", (X, 8)),
                thigh__L=t("thigh.L", (X, -76), (Y, -8)),
                shin__L=t("shin.L", (X, 78)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 14), (Y, 8)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -50)),
                cloth__F=t("cloth.F", (X, -30)),
                cape=t("cape", (X, 20)),
                flame_at_scale=0.6 + breath * 0.1,
            ),
            (-0.1, -0.2, 0.42 - breath * 0.005),
            (-0.15, -0.25, -1),
            -90,
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.016 - 0.008 * amount)),
            spine=t("spine", (Z, -2), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -16 * amount)),
            hair=t("hair", (X, 16 * amount)),
            upperarm__R=t("upperarm.R", (X, 12 * amount), (Y, 8 * amount)),
            cape=t("cape", (X, 14 * amount)),
            flame_at_scale=1.0 - 0.2 * amount,
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.05)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -12)),
            head=t("head", (X, -22)),
            hair=t("hair", (X, 24)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, 12)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, 20)),
            cape=t("cape", (X, 20)),
            flame_at_scale=0.5,
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the axe still in her hands. The flames are out."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, 30)),
            hair=t("hair", (X, -50)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, -20)),
            thigh__L=t("thigh.L", (X, -30), (Y, -12)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -10), (Y, 12)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, 0)),
            cloth__F=t("cloth.F", (X, -60)),
            cape=t("cape", (X, -50)),
            flame_at_scale=0.0,
        )

    def crouch(base, flame=0.3):
        """Low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.13)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, -4)),
            thigh__L=t("thigh.L", (X, -62), (Y, -8)),
            shin__L=t("shin.L", (X, 84)),
            foot__L=t("foot.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -46)),
            cloth__F=t("cloth.F", (X, -40)),
            cape=t("cape", (X, 30)),
            flame_at_scale=flame,
        )

    def roar(base):
        """Up again, the axe high over her head, the flames big: the end of a summon and a Rebirth."""
        return swing(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, 0.0)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, -8)),
                chest=t("chest", (X, -12)),
                head=t("head", (Z, 6), (X, -20)),
                hair=t("hair", (X, -16)),
                cape=t("cape", (X, 12)),
                flame_at_scale=1.45,
            ),
            (-0.08, -0.04, 1.02),
            (-0.3, 0.4, 0.85),
        )

    def step(front):
        """A steady advance, the axe on the shoulder. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            hips=t("hips", (Z, -14), (Y, 5 * front)),
            spine=t("spine", (Z, -2), (X, 10), (Y, -4 * front)),
            chest=t("chest", (Z, -5 * front)),
            hair=t("hair", (X, 10)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32), (Y, 4 * front)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 12)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 20), (Y, -4 * front)),
                f"shin__{back}": t(f"shin.{back}", (X, 16)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "cloth__F": t("cloth.F", (X, -8 - 10 * front)),
                "cape": t("cape", (X, 18), (Y, 4 * front)),
                "flame_at_scale": 1.0 + 0.1 * front,
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.012)),
            hips=t("hips", (Z, -14)),
            spine=t("spine", (Z, -2), (X, 10)),
            hair=t("hair", (X, 4)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -30)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 54)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 6)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "cloth__F": t("cloth.F", (X, -12)),
                "cape": t("cape", (X, 14)),
            },
        )

    # The attack: the axe goes up over her head, then a big two-handed chop.
    # The slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts),
    # so the chop lands at frame 15 of 30.
    def windup(base):
        return swing(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.02, -0.01)),
                hips=t("hips", (Z, -24)),
                spine=t("spine", (Z, -6), (X, -10)),
                chest=t("chest", (X, -10)),
                head=t("head", (Z, 14), (X, -6)),
                hair=t("hair", (X, -6)),
                thigh__L=t("thigh.L", (X, -26), (Y, -8)),
                shin__L=t("shin.L", (X, 22)),
                thigh__R=t("thigh.R", (X, 14), (Y, 8)),
                shin__R=t("shin.R", (X, 16)),
                foot__R=t("foot.R", (X, -26)),
                cape=t("cape", (X, 4)),
                flame_at_scale=1.25,
            ),
            (-0.07, 0.06, 0.98),
            (-0.1, 0.75, 0.35),
        )

    def chop(base):
        return swing(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.05, -0.06)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (Z, 2), (X, 24)),
                chest=t("chest", (X, 10)),
                neck=t("neck", (X, -10)),
                head=t("head", (Z, 4), (X, -12)),
                hair=t("hair", (X, -24)),
                thigh__L=t("thigh.L", (X, -46), (Y, -8)),
                shin__L=t("shin.L", (X, 40)),
                foot__L=t("foot.L", (X, 6)),
                thigh__R=t("thigh.R", (X, 26), (Y, 8)),
                shin__R=t("shin.R", (X, 14)),
                foot__R=t("foot.R", (X, -30)),
                cloth__F=t("cloth.F", (X, -16)),
                cape=t("cape", (X, -14)),
                flame_at_scale=1.3,
            ),
            (-0.06, -0.3, 0.42),
            (-0.05, -1, -0.4),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, flicker in ((0, 0, 0, 0), (6, 0.2, 0.4, 1), (12, 0.5, 1, -0.6), (18, 0.7, 0.6, 0.8), (24, 1, 0, -1), (30, 0.7, -0.6, 0.6), (36, 0.5, -1, -0.4), (42, 0.2, -0.4, 1), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, flicker))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, windup(stand())).key(15, chop(stand())).key(19, chop(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up,
    # and the flames light again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand(), 0.2)).key(41, roar(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(), 0.0)).key(10, pose(crouch(stand(), 0.4), hips_at_loc=at("hips", (0, 0.03, -0.11))))
    summon.key(17, roar(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "pyreaxe-ravager.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
