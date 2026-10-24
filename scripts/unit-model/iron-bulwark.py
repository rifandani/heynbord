"""
Iron Bulwark (`human.ironBulwark`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a stocky old knight in heavy
gold-trimmed plate, an open helmet with a gold crest, a long white beard, a
blue tabard with a gold fleur, a ragged blue cape, a spiked mace in the right
hand and a tall blue tower shield with gold studs on the left arm. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/iron-bulwark.glb`; then
`bun unit-model:pack iron-bulwark` packs it for the game.

The Battle camera sees the right side of a player Unit, so at rest the knight
turns to his right: the shield then faces the camera, and the mace is visible
beside it. He has no Keyword that he uses by his own action, so he has no
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#d39a78")
BEARD = hex_color("#e2ddd2")
BEARD_DARK = hex_color("#b7b0a3")
EYES = hex_color("#1e1a16")
STEEL = hex_color("#a3a29c")
STEEL_DARK = hex_color("#6c6b66")
MAIL = hex_color("#7a7974")
GOLD = hex_color("#d9a83e")
GOLD_DARK = hex_color("#9c7426")
BLUE = hex_color("#2c4a8c")
BLUE_DARK = hex_color("#1c2f5c")
LEATHER = hex_color("#6a4026")
WOOD = hex_color("#4f3420")
IRON = hex_color("#4a4a48")

# --- Proportions ---------------------------------------------------------------

# A stocky figure: short legs, a broad body and a big head in a helmet.
HIP_Z = 0.4
WAIST_Z = 0.48
CHEST_Z = 0.58
SHOULDER_Z = 0.68
NECK_Z = 0.72
HEAD_C = Vector((0, -0.01, 0.82))
KNEE_Z = 0.23
ANKLE_Z = 0.055
LEG_X = 0.075

# The left arm holds the shield across the body; the right arm hangs with
# the mace. These are the rest (bind) positions.
SL = Vector((0.155, 0, SHOULDER_Z))
EL = Vector((0.22, -0.08, 0.53))
WL = Vector((0.09, -0.12, 0.5))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.155, 0, SHOULDER_Z))
ER = Vector((-0.2, 0.01, 0.52))
WR = Vector((-0.205, -0.03, 0.39))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.03

# The tower shield: its front faces -Y at rest. `u` goes across it (-1 is the
# right edge of the figure), `v` goes up it (0 is the bottom).
SHIELD_X = 0.1
SHIELD_Y = -0.18
SHIELD_BOTTOM = 0.07
SHIELD_HALF = 0.165
SHIELD_HEIGHT = 0.6
SHIELD_BULGE = 0.022
SHIELD_THICK = 0.018
GRIP_L = WL + (WL - EL).normalized() * 0.026

# At rest the mace hangs forward and down by the right leg.
MACE = Vector((0.0, -0.45, -1.0)).normalized()
MACE_LENGTH = 0.27

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.75), "chest"),
    ("head", (0, 0, 0.75), (0, 0, 0.93), "neck"),
    ("tabard.F", (0, -0.1, 0.44), (0, -0.11, 0.24), "hips"),
    ("cape", (0, 0.1, 0.66), (0, 0.14, 0.3), "chest"),
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
    ("shield", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("mace", tuple(HAND_R), tuple(HAND_R + MACE * 0.1), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.44, 0.52)
    return blend("spine", "chest", co.z, 0.55, 0.62)


def tabard_weights(co):
    return blend("tabard.F", "hips", co.z, 0.36, 0.43)


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.52, 0.64)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.068, 0.07, 0.078), 12, 9)
    kit.cone(head.bm, (0, -0.068, 0.83), (0, -0.088, 0.812), 0.016, 0.005, 5)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.026 * sign, -0.064, 0.836), (0.009, 0.006, 0.007), 6, 4)
    parts.append(eyes)

    # The open helmet: a dome with a gold crest, a gold rim and a nose guard.
    helmet = Part("helmet", STEEL, "head", shade=0.1)
    verts = kit.sphere(helmet.bm, HEAD_C + Vector((0, 0.004, 0.006)), (0.08, 0.082, 0.088), 14, 10)
    face = [v for v in verts if v.co.y < -0.02 and HEAD_C.z - 0.07 < v.co.z < HEAD_C.z + 0.03 and abs(v.co.x) < 0.07]
    kit.bmesh.ops.delete(helmet.bm, geom=face, context="VERTS")
    # The cheek guards come down on each side of the face.
    for sign in (1, -1):
        kit.box(helmet.bm, (0.068 * sign, -0.03, 0.79), (0.02, 0.07, 0.07))
    rim = kit.torus(helmet.bm, HEAD_C + Vector((0, 0.002, 0.03)), (0, 0.12, 1), 0.083, 0.008, 16, 4)
    helmet.paint(faces_of(rim), GOLD)
    guard = kit.box(helmet.bm, (0, -0.086, 0.835), (0.014, 0.01, 0.06))
    helmet.paint(faces_of(guard), GOLD)
    crest = kit.tube(
        helmet.bm,
        [HEAD_C + Vector((0, -0.07, 0.06)), HEAD_C + Vector((0, -0.02, 0.1)), HEAD_C + Vector((0, 0.04, 0.095)), HEAD_C + Vector((0, 0.085, 0.04))],
        [0.01, 0.016, 0.016, 0.01],
        5,
    )
    helmet.paint(faces_of(crest), GOLD)
    parts.append(helmet)

    beard = Part("beard", BEARD, "head", shade=0.14)
    # A long beard from the cheeks down over the chest plate.
    kit.sphere(beard.bm, (0, -0.042, 0.78), (0.062, 0.05, 0.05), 10, 7)
    kit.cone(beard.bm, (0, -0.06, 0.77), (0, -0.1, 0.6), 0.055, 0.012, 8, squash=0.6)
    for sign in (1, -1):
        strand = kit.cone(beard.bm, (0.03 * sign, -0.07, 0.75), (0.02 * sign, -0.11, 0.63), 0.022, 0.006, 6, squash=0.6)
        beard.paint(faces_of(strand), BEARD_DARK)
    # The moustache.
    kit.cone(beard.bm, (0.045, -0.068, 0.8), (-0.045, -0.068, 0.8), 0.012, 0.012, 6, squash=0.7)
    parts.append(beard)
    return parts


def body_parts():
    parts = []
    cuirass = Part("cuirass", STEEL, torso_weights)
    verts = kit.cone(cuirass.bm, (0, 0, 0.45), (0, 0, 0.7), 0.118, 0.128, 14, squash=0.8)
    # Gold bands across the breastplate.
    for face in faces_of(verts):
        c = face.calc_center_median()
        if abs(c.z - 0.66) < 0.018 or abs(c.z - 0.47) < 0.015:
            cuirass.paint([face], GOLD)
    parts.append(cuirass)

    # The blue tabard over the chest, with the gold fleur.
    tabard = Part("tabard", BLUE, torso_weights, shade=0.08)
    front = kit.box(tabard.bm, (0, -0.104, 0.55), (0.11, 0.012, 0.15))
    for face in faces_of(front):
        c = face.calc_center_median()
        if abs(c.x) > 0.045 or c.z > 0.615:
            tabard.paint([face], GOLD)
    fleur = kit.cone(tabard.bm, (0, -0.112, 0.52), (0, -0.112, 0.585), 0.014, 0.002, 4, squash=0.4)
    tabard.paint(faces_of(fleur), GOLD)
    parts.append(tabard)

    gorget = Part("gorget", STEEL_DARK, "chest")
    kit.cone(gorget.bm, (0, 0, 0.68), (0, 0, 0.76), 0.1, 0.05, 12, squash=0.85)
    parts.append(gorget)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.43), (0, 0, 0.47), 0.122, 0.12, 14, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.1, 0.45), (0.04, 0.012, 0.034))
    belt.paint(faces_of(buckle), GOLD)
    parts.append(belt)

    # Mail under the fauld, the scales of the painting.
    fauld = Part("fauld", MAIL, "hips")
    verts = kit.cone(fauld.bm, (0, 0, 0.32), (0, 0, 0.44), 0.128, 0.118, 14, squash=0.82)
    fauld.paint({f for v in verts if v.co.z > 0.43 for f in v.link_faces}, STEEL)
    parts.append(fauld)

    def tabard_color(face_side, row, column):
        if face_side == "back":
            return BLUE_DARK
        if column in (0, 5) or row == 4:
            return GOLD
        return BLUE

    # The front panel of the tabard below the belt.
    part = Part("tabard.front", BLUE, tabard_weights)

    def grid(inset):
        result = []
        for row in range(6):
            v = row / 5
            result.append([(lerp(-1, 1, c / 6) * lerp(0.06, 0.075, v), -(lerp(0.1, 0.116, v) - inset), lerp(0.44, 0.2, v)) for c in range(7)])
        return result

    panel(part, grid(0.0), grid(0.007), tabard_color)
    # A gold fleur on the panel.
    fleur = kit.cone(part.bm, (0, -0.118, 0.27), (0, -0.12, 0.36), 0.018, 0.002, 4, squash=0.4)
    part.paint(faces_of(fleur), GOLD)
    parts.append(part)

    def cape_color(row, column):
        return BLUE_DARK if column % 3 == 1 or row == 4 else BLUE

    cape = Part("cape", BLUE, cape_weights)
    kit.ragged_cone(cape, 0.68, 0.1, 0.11, 0.2, 14, 5, 0.75, 0.08, cape_color, BLUE_DARK, gap=math.radians(100), y_push=0.06)
    parts.append(cape)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(pauldron.bm, s + Vector((0.014 * sign, 0, 0.012)), (0.072, 0.066, 0.056), 12, 8)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.025 for f in v.link_faces}, GOLD)
        # A second plate below the first.
        lame = kit.cone(pauldron.bm, s + Vector((0.02 * sign, 0, -0.02)), s + Vector((0.03 * sign, 0, -0.06)), 0.066, 0.056, 10)
        pauldron.paint(faces_of(lame), STEEL_DARK)
        parts.append(pauldron)

        upper = Part(f"rerebrace.{side}", STEEL, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.042, 0.038, 8)
        parts.append(upper)

        elbow = Part(f"elbow.{side}", GOLD, f"forearm.{side}", shade=0.05)
        kit.sphere(elbow.bm, e, (0.04, 0.04, 0.04), 8, 6)
        parts.append(elbow)

        vambrace = Part(f"vambrace.{side}", STEEL, f"forearm.{side}")
        verts = kit.cone(vambrace.bm, e + d * 0.01, w, 0.039, 0.034, 8)
        vambrace.paint({f for v in verts if (v.co - w).length < 0.015 for f in v.link_faces}, GOLD)
        parts.append(vambrace)

        gauntlet = Part(f"gauntlet.{side}", STEEL_DARK, f"hand.{side}", shade=0.05)
        kit.sphere(gauntlet.bm, w + d * 0.028, (0.028, 0.025, 0.032), 8, 6)
        parts.append(gauntlet)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"cuisse.{side}", STEEL, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.062, 0.05, 10)
        parts.append(thigh)

        poleyn = Part(f"poleyn.{side}", GOLD, f"shin.{side}", shade=0.05)
        kit.sphere(poleyn.bm, knee + Vector((0, -0.016, 0)), (0.046, 0.042, 0.04), 8, 6)
        parts.append(poleyn)

        greave = Part(f"greave.{side}", STEEL, f"shin.{side}")
        kit.cone(greave.bm, knee, ankle, 0.05, 0.042, 10)
        parts.append(greave)

        sabaton = Part(f"sabaton.{side}", STEEL_DARK, f"foot.{side}", shade=0.05)
        kit.box(sabaton.bm, (LEG_X * sign, -0.035, 0.03), (0.08, 0.15, 0.06))
        toe = kit.cone(sabaton.bm, (LEG_X * sign, -0.1, 0.022), (LEG_X * sign, -0.13, 0.018), 0.034, 0.014, 6, squash=0.5)
        sabaton.paint(faces_of(toe), GOLD)
        parts.append(sabaton)
    return parts


def shield_point(u, v, depth=0.0):
    """A point on the shield face; `depth` goes back into the shield."""
    curve = 1 - u * u
    z = SHIELD_BOTTOM + v * SHIELD_HEIGHT
    return Vector((SHIELD_X + u * SHIELD_HALF, SHIELD_Y - SHIELD_BULGE * curve + depth, z))


def shield_parts():
    shield = Part("shield", BLUE, "shield", shade=0.06)
    columns, rows = 10, 16

    def grid(depth):
        return [
            [shield_point(lerp(-1, 1, c / columns), r / rows, depth) for c in range(columns + 1)]
            for r in range(rows + 1)
        ]

    def color_of(face_side, row, column):
        v = (row + 0.5) / rows
        if face_side == "back":
            return LEATHER if abs(v - 0.62) < 0.04 or abs(v - 0.45) < 0.03 else WOOD
        if column in (0, columns - 1) or row in (0, rows - 1):
            return GOLD
        return BLUE

    edges = panel(shield, grid(0.0), grid(SHIELD_THICK), color_of)
    shield.paint(edges, GOLD_DARK)

    # The big gold fleur: a tall middle leaf, two curled side leaves and a band.
    center = shield_point(0, 0.5) + Vector((0, -0.006, 0))
    gold = set()
    gold |= set(kit.cone(shield.bm, center + Vector((0, 0, -0.05)), center + Vector((0, -0.004, 0.17)), 0.032, 0.002, 4, squash=0.35))
    for sign in (1, -1):
        gold |= set(kit.tube(shield.bm, [center + Vector((0.01 * sign, -0.002, -0.02)), center + Vector((0.07 * sign, -0.004, 0.05)), center + Vector((0.09 * sign, -0.004, 0.11)), center + Vector((0.06 * sign, -0.004, 0.13))], [0.016, 0.014, 0.01, 0.004], 4))
    gold |= set(kit.box(shield.bm, center + Vector((0, -0.002, -0.03)), (0.12, 0.008, 0.02)))
    gold |= set(kit.cone(shield.bm, center + Vector((0, 0, -0.04)), center + Vector((0, -0.004, -0.13)), 0.026, 0.004, 4, squash=0.35))
    shield.paint(faces_of(gold), GOLD)

    # Gold pyramid studs on the rim.
    studs = set()
    for u, v in ((1, 0.1), (1, 0.37), (1, 0.63), (1, 0.9), (-1, 0.1), (-1, 0.37), (-1, 0.63), (-1, 0.9), (0, 1), (0, 0)):
        base = shield_point(u * 0.92, min(max(v, 0.03), 0.97))
        studs |= set(kit.cone(shield.bm, base, base + Vector((0, -0.04, 0)), 0.026, 0.002, 4))
    shield.paint(faces_of(studs), GOLD)
    return [shield]


def mace_parts():
    mace = Part("mace", WOOD, "mace", shade=0.04)
    head = HAND_R + MACE * MACE_LENGTH
    kit.cone(mace.bm, HAND_R - MACE * 0.05, head, 0.012, 0.012, 6)
    pommel = kit.sphere(mace.bm, HAND_R - MACE * 0.055, (0.014, 0.014, 0.014), 6, 4)
    mace.paint(faces_of(pommel), GOLD)
    collar = kit.cone(mace.bm, head - MACE * 0.04, head - MACE * 0.02, 0.02, 0.02, 8)
    mace.paint(faces_of(collar), GOLD)
    # The spiked iron head: a ball with spikes all around and one at the tip.
    ball = set(kit.sphere(mace.bm, head + MACE * 0.03, (0.045, 0.045, 0.05), 10, 7))
    side = MACE.cross(X).normalized()
    other = MACE.cross(side).normalized()
    for index in range(8):
        a = 2 * math.pi * index / 8
        out = side * math.cos(a) + other * math.sin(a)
        offset = MACE * (0.015 if index % 2 else 0.045)
        ball |= set(kit.cone(mace.bm, head + offset + out * 0.035, head + offset + out * 0.08, 0.014, 0.001, 4))
    ball |= set(kit.cone(mace.bm, head + MACE * 0.07, head + MACE * 0.11, 0.014, 0.001, 4))
    mace.paint(faces_of(ball), IRON)
    return [mace]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("IronBulwark", BONES)
    parts = head_parts() + body_parts() + limb_parts() + shield_parts() + mace_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "IronBulwarkMesh")
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
        """
        The wall: turned to his right with the feet wide, he leans into the
        shield. The mace hangs low and ready.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.014 - breath * 0.003)),
            "hips": t("hips", (Z, -24 * guard)),
            "spine": t("spine", (Z, -6 * guard), (X, 5 + breath)),
            "chest": t("chest", (X, -1 - breath * 2)),
            "neck": t("neck", (Z, 12 * guard)),
            "head": t("head", (Z, 14 * guard + sway * 3), (X, 2 + breath)),
            "upperarm.L": t("upperarm.L", (X, -4 - breath * 2)),
            "upperarm.R": t("upperarm.R", (Y, -6), (X, -6 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -18)),
            "hand.R": t("hand.R", (X, -20)),
            "thigh.L": t("thigh.L", (X, -16), (Y, -5)),
            "shin.L": t("shin.L", (X, 20)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 12), (Y, 5)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -20)),
            "tabard.F": t("tabard.F", (X, -10)),
            "cape": t("cape", (X, -4 - breath * 3), (Y, sway * 3)),
        }

    def kneel(breath=0.0):
        """Low HP: down on the right knee behind the planted shield, the mace on the ground."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.16 - breath * 0.004)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -4), (X, 14 + breath * 3)),
            chest=t("chest", (X, 6 + breath * 2)),
            neck=t("neck", (Z, 10), (X, 6)),
            head=t("head", (Z, 10), (X, 10 + breath * 4), (Y, -5)),
            thigh__L=t("thigh.L", (X, -76), (Y, -5)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4), (Y, 5)),
            shin__R=t("shin.R", (X, 92)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -20)),
            hand__L=t("hand.L", (X, -6)),
            upperarm__R=t("upperarm.R", (Y, -12), (X, 4)),
            forearm__R=t("forearm.R", (X, -30)),
            hand__R=t("hand.R", (X, -10)),
            tabard__F=t("tabard.F", (X, -30)),
            cape=t("cape", (X, 26)),
        )

    def recoil(base, amount=1.0):
        """A hit pushes the shield and the upper body back, but the feet stay."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.016 * amount, -0.014 - 0.006 * amount)),
            spine=t("spine", (Z, -6), (X, -6 * amount)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 14), (X, -10 * amount)),
            upperarm__L=t("upperarm.L", (X, -14 * amount), (Y, -6 * amount)),
            upperarm__R=t("upperarm.R", (Y, -20 * amount), (X, 10 * amount)),
            cape=t("cape", (X, 14 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 26), (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 6)),
            hand__R=t("hand.R", (X, 10)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the shield on his chest and the mace beside him."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.07)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (X, 14)),
            hand__L=t("hand.L", (X, 10)),
            upperarm__R=t("upperarm.R", (Y, 50), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, -50)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -22), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            tabard__F=t("tabard.F", (X, 30)),
            cape=t("cape", (X, -30)),
        )

    def crouch(base):
        """Down on one knee, as a summon starts and a Rebirth gets up."""
        return pose(
            kneel(),
            spine=t("spine", (Z, -4), (X, 22)),
            head=t("head", (Z, 10), (X, 18)),
        )

    def raised(base):
        """Up again, the mace high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.006)),
            hips=t("hips", (Z, -16)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 8), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -14)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 50)),
            cape=t("cape", (X, 12)),
        )

    def step(front):
        """A heavy step. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(guard=0.6),
            hips_at_loc=at("hips", (0, 0, -0.022)),
            spine=t("spine", (Z, -3), (X, 6), (Y, 3 * front)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -22)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 12)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "upperarm__R": t("upperarm.R", (Y, -6), (X, -6 - 10 * front)),
                "tabard__F": t("tabard.F", (X, -4 - 6 * front)),
                "cape": t("cape", (X, 8), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(guard=0.6),
            hips_at_loc=at("hips", (0, 0, -0.004)),
            spine=t("spine", (Z, -3), (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -14)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "tabard__F": t("tabard.F", (X, -6)),
                "cape": t("cape", (X, 6)),
            },
        )

    # The attack: the mace goes up over the right shoulder, then a smash
    # past the edge of the shield. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the smash lands at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.024)),
            hips=t("hips", (Z, -32)),
            spine=t("spine", (Z, -12), (X, -4)),
            chest=t("chest", (Z, -8), (X, -6)),
            head=t("head", (Z, 28), (X, 0)),
            upperarm__L=t("upperarm.L", (X, -12)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -20)),
            forearm__R=t("forearm.R", (X, -70)),
            hand__R=t("hand.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -20), (Y, -5)),
            shin__L=t("shin.L", (X, 28)),
            foot__L=t("foot.L", (X, -8)),
            thigh__R=t("thigh.R", (X, 14), (Y, 5)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -34)),
            cape=t("cape", (X, 6)),
        )

    def smash(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.03, -0.04)),
            hips=t("hips", (Z, -16)),
            spine=t("spine", (Z, -2), (X, 16)),
            chest=t("chest", (Z, 4), (X, 6)),
            head=t("head", (Z, 12), (X, -4)),
            upperarm__L=t("upperarm.L", (X, 6), (Y, 6)),
            upperarm__R=t("upperarm.R", (X, -64), (Y, -10)),
            forearm__R=t("forearm.R", (X, -4)),
            hand__R=t("hand.R", (X, 12)),
            thigh__L=t("thigh.L", (X, -36), (Y, -5)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 22), (Y, 5)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -30)),
            tabard__F=t("tabard.F", (X, -6)),
            cape=t("cape", (X, 12)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, kneel(breath))
    clips.append(low)

    # A slow, heavy walk (Heavy).
    walk = Clip("walk", 28, loop=True)
    walk.key(0, step(1)).key(7, passing("R")).key(14, step(-1)).key(21, passing("L")).key(28, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, windup(stand())).key(15, smash(stand())).key(19, smash(stand()))
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
    rebirth.key(32, crouch(stand())).key(41, raised(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.14))))
    summon.key(17, raised(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "iron-bulwark.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
