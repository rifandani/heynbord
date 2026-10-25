"""
Warchief Grukka (`orc.warchiefGrukka`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a big, fat green orc with a laugh
and tusks, long white braids under a horned bull skull, a fur mantle with a
necklace of fangs, a leather harness over the belly with a big brass boss, a
red loincloth and a ragged red cape, fur on the legs, iron knee guards and
boots, a double axe in the right hand and a roast drumstick in the left. Run
it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/warchief-grukka.glb`; then
`bun unit-model:pack warchief-grukka` packs it for the game.

The Battle camera sees the right side of a player Unit, so the axe is in the
right hand, and its blades face the camera. He is Swift, so his walk is a
quick waddle. He has no Keyword that he uses by his own action, so he has no
cast clip.
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

SKIN = hex_color("#8f9a4a")
SKIN_DARK = hex_color("#6a7334")
HAIR = hex_color("#e8e2d4")
HAIR_DARK = hex_color("#bdb4a2")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#5a1c18")
TUSK = hex_color("#efe4c6")
BONE = hex_color("#e2d6b6")
BONE_DARK = hex_color("#a8997a")
HORN = hex_color("#d8c7a0")
HORN_TIP = hex_color("#5a4632")
FUR = hex_color("#7d6450")
FUR_LIGHT = hex_color("#e6dccb")
LEATHER = hex_color("#5c3a24")
LEATHER_DARK = hex_color("#3c2618")
BRASS = hex_color("#d0a046")
BRASS_DARK = hex_color("#8f6a2a")
RED = hex_color("#b0322a")
RED_DARK = hex_color("#6e1d1a")
IRON = hex_color("#6f6c68")
IRON_DARK = hex_color("#45433f")
STEEL = hex_color("#b9b6ae")
WOOD = hex_color("#4a3020")
MEAT = hex_color("#9a4a26")
MEAT_DARK = hex_color("#6a2c16")

# --- Proportions ---------------------------------------------------------------

# A big, fat figure: a large belly, broad shoulders and a head set low and forward.
HIP_Z = 0.42
WAIST_Z = 0.5
CHEST_Z = 0.6
SHOULDER_Z = 0.69
NECK_Z = 0.72
HEAD_C = Vector((0, -0.04, 0.8))
KNEE_Z = 0.23
ANKLE_Z = 0.055
LEG_X = 0.085

# The right arm hangs with the axe upright beside it; the left hand holds the
# drumstick up in front. These are the rest (bind) positions.
SL = Vector((0.185, 0, SHOULDER_Z))
EL = Vector((0.255, 0.0, 0.55))
WL = Vector((0.22, -0.11, 0.48))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.185, 0, SHOULDER_Z))
ER = Vector((-0.25, 0.01, 0.55))
WR = Vector((-0.255, -0.04, 0.42))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.032
HAND_L = WL + (WL - EL).normalized() * 0.032

# The axe stands up from the right hand, a little back and out.
AXE = Vector((-0.12, 0.3, 1.0)).normalized()
AXE_HEAD = 0.37
MEAT_DIR = Vector((0.1, -0.25, 1.0)).normalized()

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.02, NECK_Z), (0, -0.035, 0.75), "chest"),
    ("head", (0, -0.035, 0.75), (0, -0.04, 0.92), "neck"),
    ("cape", (0, 0.12, 0.7), (0, 0.17, 0.3), "chest"),
    ("cloth.F", (0, -0.15, 0.4), (0, -0.16, 0.2), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.04 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.1, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("axe", tuple(HAND_R), tuple(HAND_R + AXE * 0.1), "hand.R"),
    ("meat", tuple(HAND_L), tuple(HAND_L + MEAT_DIR * 0.08), "hand.L"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z + 0.02:
        return blend("hips", "spine", co.z, 0.44, 0.56)
    return blend("spine", "chest", co.z, 0.58, 0.66)


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.55, 0.67)


def cloth_weights(co):
    return blend("cloth.F", "hips", co.z, 0.36, 0.42)


def kilt_weights(co):
    """The fur kilt follows the hips at the top, and the thighs lower."""
    t = clamp01((0.42 - co.z) / 0.16)
    side = co.x / 0.12
    return {
        "hips": 1 - t * 0.8,
        "thigh.L": t * clamp01(side) * 0.8,
        "thigh.R": t * clamp01(-side) * 0.8,
    }


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.075, 0.074, 0.074), 12, 9)
    # A heavy jaw, a broad nose and orc ears.
    jaw = kit.sphere(head.bm, HEAD_C + Vector((0, -0.03, -0.045)), (0.07, 0.056, 0.042), 12, 6)
    head.paint(faces_of(jaw), SKIN)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.07, 0.0)), HEAD_C + Vector((0, -0.088, -0.018)), 0.02, 0.008, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.07 * sign, 0.006, 0.0)), HEAD_C + Vector((0.14 * sign, 0.03, 0.03)), 0.022, 0.002, 5, squash=0.4)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.028 * sign, -0.068, 0.012)), (0.009, 0.006, 0.007), 6, 4)
        brow = kit.box(face.bm, HEAD_C + Vector((0.03 * sign, -0.07, 0.03)), (0.034, 0.014, 0.012))
        face.paint(faces_of(brow), SKIN_DARK)
    # A wide open laugh.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.074, -0.04)), (0.042, 0.016, 0.022), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.034 * sign, -0.074, -0.06)), HEAD_C + Vector((0.044 * sign, -0.084, -0.01)), 0.01, 0.001, 5)
    parts.append(tusks)

    # Long white hair and braids from under the skull.
    hair = Part("hair", HAIR, "head", shade=0.1)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.012, 0.01)), (0.08, 0.078, 0.078), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.y < -0.035 and v.co.z < HEAD_C.z + 0.04], context="VERTS")
    for index, angle in enumerate((-110, -75, 75, 110, 150, -150)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.074 * math.sin(a), -0.074 * math.cos(a), -0.01))
        bottom = top + Vector((0.02 * math.sin(a), 0.03, -0.2))
        braid = kit.tube(hair.bm, [top, (top + bottom) / 2 + Vector((0.01 * math.sin(a), 0.01, 0)), bottom], [0.018, 0.015, 0.008], 5)
        if index % 2:
            hair.paint(faces_of(braid), HAIR_DARK)
    parts.append(hair)

    # The bull skull on his head: the cranium, dark eye holes, a snout over the brow, and horns.
    skull = Part("skull", BONE, "head", shade=0.1)
    verts = kit.sphere(skull.bm, HEAD_C + Vector((0, 0.004, 0.05)), (0.086, 0.084, 0.06), 12, 7)
    kit.bmesh.ops.delete(skull.bm, geom=[v for v in verts if v.co.z < HEAD_C.z + 0.02], context="VERTS")
    kit.cone(skull.bm, HEAD_C + Vector((0, -0.06, 0.07)), HEAD_C + Vector((0, -0.105, 0.04)), 0.04, 0.026, 6, squash=0.7)
    for sign in (1, -1):
        hole = kit.sphere(skull.bm, HEAD_C + Vector((0.03 * sign, -0.078, 0.062)), (0.016, 0.01, 0.014), 6, 4)
        skull.paint(faces_of(hole), EYES)
        horn = kit.tube(
            skull.bm,
            [
                HEAD_C + Vector((0.07 * sign, 0.0, 0.07)),
                HEAD_C + Vector((0.14 * sign, 0.01, 0.08)),
                HEAD_C + Vector((0.19 * sign, -0.02, 0.13)),
                HEAD_C + Vector((0.19 * sign, -0.07, 0.19)),
            ],
            [0.026, 0.02, 0.012, 0.002],
            6,
        )
        skull.paint({f for f in faces_of(horn) if abs(f.calc_center_median().x) > 0.17 and f.calc_center_median().z > HEAD_C.z + 0.14}, HORN_TIP)
        skull.paint({f for f in faces_of(horn) if abs(f.calc_center_median().x) <= 0.17 or f.calc_center_median().z <= HEAD_C.z + 0.14}, HORN)
    rim = kit.torus(skull.bm, HEAD_C + Vector((0, 0.004, 0.024)), (0, 0, 1), 0.084, 0.008, 14, 4)
    skull.paint(faces_of(rim), BONE_DARK)
    parts.append(skull)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.01, 0.7), (0, -0.03, 0.78), 0.05, 0.048, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The big belly and the chest, in a leather harness.
    body = Part("body", LEATHER, torso_weights, shade=0.16)
    kit.sphere(body.bm, (0, -0.035, 0.52), (0.16, 0.155, 0.15), 14, 10)
    kit.sphere(body.bm, (0, 0.0, 0.63), (0.175, 0.13, 0.11), 14, 8)
    parts.append(body)

    # Skin shows at the top of the chest.
    chest = Part("chest", SKIN, "chest", shade=0.08)
    kit.sphere(chest.bm, (0, -0.06, 0.67), (0.11, 0.08, 0.06), 10, 6)
    parts.append(chest)

    harness = Part("harness", LEATHER_DARK, torso_weights, shade=0.05)
    for sign in (1, -1):
        kit.tube(harness.bm, [(0.12 * sign, -0.06, 0.7), (0.05 * sign, -0.16, 0.6), (-0.06 * sign, -0.185, 0.5)], [0.012] * 3, 4)
    # The belt with the big brass boss.
    kit.cone(harness.bm, (0, -0.02, 0.4), (0, -0.02, 0.445), 0.158, 0.155, 14, squash=0.92)
    boss = kit.cone(harness.bm, (0, -0.16, 0.425), (0, -0.19, 0.425), 0.06, 0.05, 12)
    harness.paint(faces_of(boss), BRASS)
    knob = kit.sphere(harness.bm, (0, -0.19, 0.425), (0.024, 0.014, 0.024), 8, 5)
    harness.paint(faces_of(knob), BRASS_DARK)
    parts.append(harness)

    # The fur mantle over the shoulders, with a light fur edge.
    mantle = Part("mantle", FUR, "chest", shade=0.12)
    kit.cone(mantle.bm, (0, 0.02, 0.66), (0, 0.0, 0.77), 0.18, 0.07, 14, caps=False, squash=0.8)
    # The edge dips at the front, over the chest.
    trim = kit.torus(mantle.bm, (0, 0.01, 0.675), (0, 0.4, 1), 0.165, 0.024, 16, 5)
    mantle.paint(faces_of(trim), FUR_LIGHT)
    parts.append(mantle)

    # The necklace of fangs.
    fangs = Part("fangs", TUSK, "chest", shade=0.05)
    for index in range(9):
        a = math.radians(-60 + index * 15)
        root = Vector((0.1 * math.sin(a), -0.08 * math.cos(a) - 0.03, 0.7 - 0.03 * math.cos(a)))
        length = 0.06 if index % 2 == 0 else 0.04
        kit.cone(fangs.bm, root, root + Vector((0.01 * math.sin(a), -0.012, -length)), 0.012, 0.001, 4)
    cord = kit.torus(fangs.bm, (0, -0.03, 0.69), (0, 0.45, 1), 0.1, 0.005, 14, 3)
    fangs.paint(faces_of(cord), LEATHER_DARK)
    parts.append(fangs)

    def kilt_color(row, column):
        return FUR_LIGHT if row == 2 else (FUR if column % 3 else LEATHER)

    kilt = Part("kilt", FUR, kilt_weights)
    kit.ragged_cone(kilt, 0.44, 0.27, 0.155, 0.17, 16, 3, 0.86, 0.04, kilt_color, LEATHER_DARK, gap=math.radians(28))
    parts.append(kilt)

    def cloth_color(face_side, row, column):
        if face_side == "back":
            return RED_DARK
        return RED_DARK if row == 3 else RED

    # The red loincloth at the front, with a ragged hem.
    cloth = Part("cloth.F", RED, cloth_weights)

    def grid(inset):
        result = []
        for row in range(5):
            v = row / 4
            result.append([(lerp(-1, 1, c / 4) * lerp(0.06, 0.075, v), -(lerp(0.165, 0.175, v) - inset), lerp(0.4, 0.17 + 0.03 * (c % 2), v)) for c in range(5)])
        return result

    panel(cloth, grid(0.0), grid(0.007), cloth_color)
    parts.append(cloth)

    def cape_color(row, column):
        return RED_DARK if column % 4 == 1 or row == 4 else RED

    cape = Part("cape", RED, cape_weights)
    kit.ragged_cone(cape, 0.72, 0.12, 0.15, 0.25, 14, 5, 0.75, 0.09, cape_color, RED_DARK, gap=math.radians(105), y_push=0.08)
    parts.append(cape)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.01 * sign, 0, -0.01)), (0.06, 0.058, 0.058), 10, 7)
        kit.cone(upper.bm, s, e, 0.054, 0.046, 8)
        parts.append(upper)

        # A spiked iron shoulder plate on the fur.
        plate = Part(f"plate.{side}", IRON, f"upperarm.{side}", shade=0.08)
        kit.sphere(plate.bm, s + Vector((0.02 * sign, 0, 0.03)), (0.06, 0.058, 0.032), 10, 6)
        for dx, dy in ((0.0, -0.025), (0.02, 0.02), (0.035, -0.0)):
            spike = kit.cone(plate.bm, s + Vector(((0.02 + dx) * sign, dy, 0.05)), s + Vector(((0.03 + dx * 1.3) * sign, dy * 1.2, 0.1)), 0.012, 0.001, 4)
            plate.paint(faces_of(spike), STEEL)
        parts.append(plate)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.046, 0.04, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        verts = kit.cone(bracer.bm, e + d * 0.05, w - d * 0.004, 0.048, 0.043, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.02 or (v.co - (e + d * 0.05)).length < 0.015 for f in v.link_faces}, BRASS)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.03, (0.034, 0.03, 0.036), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", LEATHER_DARK, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.07, 0.054, 8)
        parts.append(thigh)

        # Fur on the shins, an iron knee guard and iron boots with spikes.
        shin = Part(f"shin.{side}", FUR, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.05)), 0.06, 0.056, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 50) % 2:
                shin.paint([face], FUR_LIGHT)
        guard = kit.sphere(shin.bm, knee + Vector((0, -0.03, 0.005)), (0.05, 0.03, 0.045), 8, 6)
        shin.paint(faces_of(guard), IRON)
        spike = kit.cone(shin.bm, knee + Vector((0, -0.055, 0.005)), knee + Vector((0, -0.09, 0.015)), 0.014, 0.001, 4)
        shin.paint(faces_of(spike), STEEL)
        parts.append(shin)

        boot = Part(f"boot.{side}", IRON_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.06)), ankle - Vector((0, 0, 0.02)), 0.054, 0.056, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.04, 0.028), (0.09, 0.16, 0.056))
        cap = kit.cone(boot.bm, (LEG_X * sign, -0.11, 0.03), (LEG_X * sign, -0.135, 0.022), 0.034, 0.012, 6, squash=0.6)
        boot.paint(faces_of(cap), IRON)
        parts.append(boot)
    return parts


def axe_parts():
    axe = Part("axe", WOOD, "axe", shade=0.04)
    out = AXE.cross(X).normalized()
    thick = out.cross(AXE).normalized()
    top = HAND_R + AXE * (AXE_HEAD + 0.08)
    kit.cone(axe.bm, HAND_R - AXE * 0.08, top, 0.014, 0.012, 6)
    # Leather wraps on the haft.
    for along in (-0.04, 0.02, 0.15):
        wrap = kit.cone(axe.bm, HAND_R + AXE * along, HAND_R + AXE * (along + 0.03), 0.017, 0.017, 6)
        axe.paint(faces_of(wrap), LEATHER)
    pommel = kit.sphere(axe.bm, HAND_R - AXE * 0.085, (0.018, 0.018, 0.018), 6, 4)
    axe.paint(faces_of(pommel), BRASS)
    # The spike on top.
    spike = kit.cone(axe.bm, top, top + AXE * 0.07, 0.016, 0.001, 4)
    axe.paint(faces_of(spike), STEEL)
    head = HAND_R + AXE * AXE_HEAD
    collar = kit.cone(axe.bm, head - AXE * 0.05, head + AXE * 0.05, 0.026, 0.026, 6)
    axe.paint(faces_of(collar), IRON_DARK)

    # Two crescent blades, to the front and to the back of the haft.
    columns, rows = 6, 4
    for sign in (1, -1):

        def grid(depth, sign=sign):
            result = []
            for row in range(rows + 1):
                v = row / rows
                line = []
                for column in range(columns + 1):
                    u = lerp(-1, 1, column / columns)
                    reach = 0.02 + v * 0.13 + 0.03 * (1 - u * u) * v
                    # The tips of the crescent flare out along the haft.
                    along = u * lerp(0.04, 0.12, v) + 0.02 * u**3 * v
                    line.append(head + AXE * along + out * sign * reach + thick * depth * lerp(1.0, 0.3, v))
                result.append(line)
            return result

        def color_of(face_side, row, column):
            if row == rows - 1:
                return STEEL
            if row == 0:
                return IRON_DARK
            return IRON

        edges = panel(axe, grid(0.012), grid(-0.012), color_of)
        axe.paint(edges, STEEL)
        # A brass skull stud on the blade.
        stud = kit.sphere(axe.bm, head + out * sign * 0.07 + thick * 0.014, (0.016, 0.008, 0.016), 6, 4)
        axe.paint(faces_of(stud), BRASS)
        stud = kit.sphere(axe.bm, head + out * sign * 0.07 - thick * 0.014, (0.016, 0.008, 0.016), 6, 4)
        axe.paint(faces_of(stud), BRASS)
    return [axe]


def meat_parts():
    meat = Part("meat", MEAT, "meat", shade=0.1)
    base = HAND_L + MEAT_DIR * 0.02
    verts = kit.sphere(meat.bm, base + MEAT_DIR * 0.09, (0.05, 0.05, 0.07), 10, 7)
    for face in faces_of(verts):
        if face.calc_center_median().z > base.z + 0.11 or face.normal.x < -0.4:
            meat.paint([face], MEAT_DARK)
    bone = kit.cone(meat.bm, base - MEAT_DIR * 0.05, base + MEAT_DIR * 0.04, 0.012, 0.014, 6)
    knob = kit.sphere(meat.bm, base - MEAT_DIR * 0.055, (0.018, 0.016, 0.016), 6, 4)
    meat.paint(faces_of(bone) | faces_of(knob), BONE)
    return [meat]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("WarchiefGrukka", BONES)
    parts = head_parts() + body_parts() + limb_parts() + axe_parts() + meat_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "WarchiefGrukkaMesh")
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

    def stand(breath=0.0, sway=0.0, laugh=0.0):
        """
        The idle stance: feet wide, turned a little to his right, the axe up
        at his side and the drumstick in front of the belly. He laughs.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.014 - breath * 0.004)),
            "hips": t("hips", (Z, -16), (Y, sway * 2)),
            "spine": t("spine", (Z, -4), (X, -2 + breath)),
            "chest": t("chest", (X, -4 - breath * 3 - laugh * 4)),
            "neck": t("neck", (Z, 8)),
            "head": t("head", (Z, 8 + sway * 4), (X, -6 + breath * 2 - laugh * 6)),
            "upperarm.L": t("upperarm.L", (X, -6 - breath * 2)),
            "forearm.L": t("forearm.L", (X, -16)),
            "upperarm.R": t("upperarm.R", (Y, -8), (X, -breath * 2)),
            "thigh.L": t("thigh.L", (X, -12), (Y, -8)),
            "shin.L": t("shin.L", (X, 16)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 8), (Y, 8)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -16)),
            "cloth.F": t("cloth.F", (X, -6)),
            "cape": t("cape", (X, -4 - breath * 3), (Y, sway * 3)),
        }

    def slump(breath=0.0):
        """Low HP: bent over, he leans on the axe head down on the ground."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.06 - breath * 0.004)),
            spine=t("spine", (Z, -4), (X, 18 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 3)),
            head=t("head", (Z, 6), (X, 6 + breath * 4), (Y, -6)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -14)),
            forearm__R=t("forearm.R", (X, -30)),
            hand__R=t("hand.R", (X, 182)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 10)),
            forearm__L=t("forearm.L", (X, -6)),
            thigh__L=t("thigh.L", (X, -34), (Y, -8)),
            shin__L=t("shin.L", (X, 44)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, 0), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -30)),
            cloth__F=t("cloth.F", (X, -24)),
            cape=t("cape", (X, -20)),
        )

    def recoil(base, amount=1.0):
        """A hit pushes the upper body back, and the belly shakes."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.014 - 0.008 * amount)),
            spine=t("spine", (Z, -4), (X, -10 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -16 * amount)),
            upperarm__L=t("upperarm.L", (X, 10 * amount), (Y, 20 * amount)),
            upperarm__R=t("upperarm.R", (Y, -26 * amount), (X, 10 * amount)),
            cape=t("cape", (X, 16 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.04)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -12)),
            head=t("head", (X, -20)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, 10)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 40)),
            upperarm__R=t("upperarm.R", (Y, -40), (X, -20)),
            cape=t("cape", (X, 20)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the belly up, the arms out wide."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.12)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            head=t("head", (X, -10), (Z, 30)),
            upperarm__L=t("upperarm.L", (Y, 70)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -70)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 90)),
            thigh__L=t("thigh.L", (X, -30), (Y, -14)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -14), (Y, 14)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, 0)),
            cloth__F=t("cloth.F", (X, -50)),
            cape=t("cape", (X, -30)),
        )

    def crouch(base):
        """Low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.12)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 8)),
            thigh__L=t("thigh.L", (X, -60), (Y, -10)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -50), (Y, 10)),
            shin__R=t("shin.R", (X, 90)),
            foot__R=t("foot.R", (X, -40)),
            cape=t("cape", (X, 30)),
        )

    def roar(base):
        """Up again with a roar, the axe and the drumstick high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.0)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -12)),
            head=t("head", (Z, 6), (X, -24)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -30)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, 160)),
            upperarm__L=t("upperarm.L", (X, -140), (Y, 30)),
            forearm__L=t("forearm.L", (X, -30)),
            cape=t("cape", (X, 12)),
        )

    def step(front):
        """A quick, swaggering waddle (Swift). `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            hips=t("hips", (Z, -16), (Y, 6 * front)),
            spine=t("spine", (Z, -4), (X, 10), (Y, -4 * front)),
            chest=t("chest", (Z, -6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -30), (Y, 4 * front)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 10)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18), (Y, -4 * front)),
                f"shin__{back}": t(f"shin.{back}", (X, 16)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -10), (X, -12 * front)),
                "upperarm__L": t("upperarm.L", (X, 10 * front)),
                "cloth__F": t("cloth.F", (X, -6 - 8 * front)),
                "cape": t("cape", (X, 14), (Y, 4 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.02)),
            spine=t("spine", (Z, -4), (X, 10)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -24)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 50)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 6)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "cloth__F": t("cloth.F", (X, -10)),
                "cape": t("cape", (X, 10)),
            },
        )

    # The attack: the axe goes up behind his head, then a big chop down. The
    # slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so
    # the chop lands at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015, -0.01)),
            hips=t("hips", (Z, -26)),
            spine=t("spine", (Z, -10), (X, -8)),
            chest=t("chest", (Z, -8), (X, -10)),
            head=t("head", (Z, 22), (X, -8)),
            upperarm__R=t("upperarm.R", (X, -160), (Y, -20)),
            forearm__R=t("forearm.R", (X, -60)),
            hand__R=t("hand.R", (X, 160)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 20)),
            thigh__L=t("thigh.L", (X, -26), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, -2)),
            thigh__R=t("thigh.R", (X, 14), (Y, 8)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, -26)),
            cape=t("cape", (X, 4)),
        )

    def chop(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.04, -0.05)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (Z, 0), (X, 22)),
            chest=t("chest", (Z, 4), (X, 8)),
            head=t("head", (Z, 10), (X, -12)),
            upperarm__R=t("upperarm.R", (X, -56), (Y, -8)),
            forearm__R=t("forearm.R", (X, -6)),
            # The axe points up from the hand at rest: the wrist turns it to the front.
            hand__R=t("hand.R", (X, 170)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 26)),
            thigh__L=t("thigh.L", (X, -44), (Y, -8)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 6)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 14)),
            foot__R=t("foot.R", (X, -30)),
            cloth__F=t("cloth.F", (X, -14)),
            cape=t("cape", (X, -10)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, laugh in ((0, 0, 0, 0), (8, 0.3, 0.6, 1), (14, 0.5, 1, 0), (20, 0.7, 0.6, 1), (28, 1, 0, 0), (36, 0.5, -1, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, laugh))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 18, loop=True)
    walk.key(0, step(1)).key(4, passing("R")).key(9, step(-1)).key(13, passing("L")).key(18, step(1))
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

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, roar(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.1))))
    summon.key(17, roar(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "warchief-grukka.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
