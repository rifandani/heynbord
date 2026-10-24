"""
Mine Sapper (`goblin.mineSapper`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a wiry pale goblin with wild white
hair, very large ears and a lit pipe, a red neckerchief, a dark leather
jerkin with a brass plate on the right shoulder, a belt of brass pouches,
torn trousers with brass knee guards, wrapped boots, a long pick with a
red-hot head, and a back frame with a stack of red powder kegs that is
taller than he is. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/mine-sapper.glb`; then
`bun unit-model:pack mine-sapper` packs it for the game.

He holds the pick at the ready on his right side, the camera side. The left
hand always holds the haft (IK to the `grip.L` bone). The chop uses IK for
the right hand and the `Aim` constraint for the pick. The `flame` bone
carries the flames on the pick head, the `sparks` bone the burning fuse on
the top keg, and the `smoke` bone the puff of his pipe. The death is his
Last Breath: the fuse flares, the kegs blow up (the `blast` bone scales up a
fireball that is inside the stack at rest, and the `kegs` bone scales down),
and the blast throws him on his face. He has no Keyword that he uses by his
own action, so he has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#b0aca2")
SKIN_DARK = hex_color("#86827a")
EAR = hex_color("#d89a92")
HAIR = hex_color("#eeece6")
EYES = hex_color("#f2b23a")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a2a26")
TEETH = hex_color("#efe6cc")
SCARF = hex_color("#b0302a")
SCARF_DARK = hex_color("#7e2019")
SHIRT = hex_color("#d2c7ae")
LEATHER = hex_color("#4e3424")
LEATHER_DARK = hex_color("#33221a")
STRAP = hex_color("#7a4a2a")
BRASS = hex_color("#cf9e46")
BRASS_DARK = hex_color("#8e6a2c")
TROUSERS = hex_color("#4c4239")
TROUSERS_DARK = hex_color("#372f28")
BOOT = hex_color("#5a3a26")
WRAP = hex_color("#7e6a52")
WOOD = hex_color("#6a4428")
WOOD_DARK = hex_color("#4a2e1a")
KEG = hex_color("#a03024")
KEG_DARK = hex_color("#6e1e18")
IRON = hex_color("#4a4744")
IRON_DARK = hex_color("#2e2c2a")
FUSE = hex_color("#2a2420")
PIPE = hex_color("#5a3a22")
SMOKE = hex_color("#d6d1c8")
SAND = hex_color("#e8c470")
EMBER = hex_color("#ff6a1e")
FLAME = hex_color("#ffae34")
FLAME_HOT = hex_color("#fff0a0")
SOOT = hex_color("#3a2a22")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.3
WAIST_Z = 0.36
CHEST_Z = 0.42
SHOULDER_Z = 0.49
NECK_Z = 0.51
HEAD_C = Vector((0, -0.016, 0.615))
KNEE_Z = 0.17
ANKLE_Z = 0.04
LEG_X = 0.05

# He holds the pick at the ready on his right side: the right hand low on the
# haft at the hip, the left hand higher, across the body. The haft points up
# and a little forward, so the head is in front of the right shoulder. These
# are the rest (bind) positions.
SL = Vector((0.095, 0, SHOULDER_Z))
EL = Vector((0.075, -0.09, 0.385))
SR = Vector((-0.095, 0, SHOULDER_Z))
ER = Vector((-0.13, 0.01, 0.37))
WR = Vector((-0.095, -0.075, 0.31))
TR = WR + (WR - ER).normalized() * 0.04

PICK = Vector((0.05, -0.26, 1)).normalized()
GRIP_R = WR + (WR - ER).normalized() * 0.022
GRIP_AT = 0.1
GRIP_L = GRIP_R + PICK * GRIP_AT
WL = GRIP_L
TL = WL + (WL - EL).normalized() * 0.04
# The head of the pick, along the haft from the right hand.
HEAD_AT = 0.33
PICK_HEAD = GRIP_R + PICK * HEAD_AT
# The point of the pick reaches to the front.
_FRONT = Vector((0, -1, 0.1))
BLADE = (_FRONT - PICK * _FRONT.dot(PICK)).normalized()

# The keg stack on the back frame.
KEG_Y = 0.16
FRAME_TOP = 0.86
FUSE_TIP = Vector((0.012, KEG_Y + 0.01, 0.955))
BLAST_C = Vector((0, KEG_Y, 0.56))
PIPE_BOWL = Vector((-0.064, -0.118, 0.585))

# Where the right hand and the pick lie when he is flat on his face (world axes).
FALLEN_HAND = (-0.1, -0.4, 0.05)
FALLEN_PICK = (-0.25, -1, 0.02)
FALLEN_ROLL = 90

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.54), "chest"),
    ("head", (0, 0, 0.54), (0, 0, 0.72), "neck"),
    ("kegs", (0, KEG_Y, 0.36), (0, KEG_Y, 0.6), "chest"),
    ("sparks", tuple(FUSE_TIP), tuple(FUSE_TIP + Vector((0, 0, 0.04))), "kegs"),
    ("blast", tuple(BLAST_C), tuple(BLAST_C + Vector((0, 0, 0.06))), "chest"),
    ("smoke", tuple(PIPE_BOWL), tuple(PIPE_BOWL + Vector((0, 0, 0.05))), "head"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
    ("pole.R", (-0.3, 0.2, 0.3), (-0.3, 0.2, 0.35), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.016), f"shin.{side}"),
    ]
BONES += [
    ("pick", tuple(GRIP_R), tuple(GRIP_R + PICK * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + PICK * 0.05), "pick"),
    ("flame", tuple(PICK_HEAD), tuple(PICK_HEAD + BLADE * 0.08), "pick"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.32, 0.39)
    return blend("spine", "chest", co.z, 0.4, 0.46)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.076, 0.076, 0.08), 14, 10)
    # A narrow chin and a long hooked nose.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.028, -0.05)), (0.048, 0.04, 0.032), 10, 6)
    kit.tube(head.bm, [HEAD_C + Vector((0, -0.066, 0.0)), HEAD_C + Vector((0, -0.1, -0.012)), HEAD_C + Vector((0, -0.112, -0.03))], [0.016, 0.01, 0.003], 6)
    for sign in (1, -1):
        # Goblin ears: very large, out to the sides and a little up.
        ear = kit.cone(head.bm, HEAD_C + Vector((0.068 * sign, 0.012, 0.008)), HEAD_C + Vector((0.21 * sign, 0.05, 0.07)), 0.04, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.031 * sign, -0.059, 0.016)), (0.019, 0.01, 0.015), 8, 6)
        pupil = kit.sphere(face.bm, HEAD_C + Vector((0.03 * sign, -0.068, 0.015)), (0.008, 0.004, 0.009), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
        # Sly brows: low at the nose, up at the ears.
        brow = kit.cone(face.bm, HEAD_C + Vector((0.012 * sign, -0.064, 0.03)), HEAD_C + Vector((0.054 * sign, -0.052, 0.048)), 0.006, 0.004, 4)
        face.paint(faces_of(brow), HAIR)
    # A wide grin with teeth, the pipe in the right corner.
    grin = kit.tube(face.bm, [HEAD_C + Vector((0.034, -0.055, -0.028)), HEAD_C + Vector((0.0, -0.068, -0.04)), HEAD_C + Vector((-0.034, -0.055, -0.03))], [0.006] * 3, 4)
    face.paint(faces_of(grin), MOUTH)
    teeth = kit.box(face.bm, HEAD_C + Vector((0.004, -0.068, -0.036)), (0.03, 0.006, 0.006))
    face.paint(faces_of(teeth), TEETH)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.06)
    # Wild white hair from under a leather cap.
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.03, 0.03)), (0.08, 0.07, 0.05), 12, 7)
    for index in range(9):
        a = math.radians(-140 + index * 35)
        root = HEAD_C + Vector((0.055 * math.sin(a), 0.03 + 0.04 * math.cos(a), 0.045))
        reach = 0.045 + 0.02 * ((index * 5) % 3)
        tip = root + Vector((reach * math.sin(a), 0.02 + reach * math.cos(a), 0.02 - 0.014 * (index % 2)))
        kit.cone(hair.bm, root, tip, 0.03, 0.005, 5)
    parts.append(hair)

    cap = Part("cap", LEATHER, "head", shade=0.05)
    kit.sphere(cap.bm, HEAD_C + Vector((0, 0.006, 0.05)), (0.07, 0.07, 0.045), 12, 6)
    band = kit.torus(cap.bm, HEAD_C + Vector((0, 0.004, 0.044)), (0, 0.15, 1), 0.07, 0.008, 14, 4)
    cap.paint(faces_of(band), BRASS)
    lamp = kit.cone(cap.bm, HEAD_C + Vector((0, -0.064, 0.06)), HEAD_C + Vector((0, -0.084, 0.064)), 0.016, 0.018, 8)
    cap.paint(faces_of(lamp), BRASS)
    parts.append(cap)

    # The pipe in the right corner of the grin: the bowl glows.
    pipe = Part("pipe", PIPE, "head", shade=0.04)
    kit.tube(pipe.bm, [HEAD_C + Vector((-0.028, -0.06, -0.034)), HEAD_C + Vector((-0.046, -0.09, -0.042)), PIPE_BOWL + Vector((0, 0, -0.012))], [0.004, 0.004, 0.005], 5)
    kit.cone(pipe.bm, PIPE_BOWL - Vector((0, 0, 0.018)), PIPE_BOWL, 0.009, 0.013, 8)
    ember = kit.cone(pipe.bm, PIPE_BOWL, PIPE_BOWL + Vector((0, 0, 0.003)), 0.011, 0.009, 8)
    pipe.paint(faces_of(ember), EMBER)
    parts.append(pipe)

    smoke = Part("smoke", SMOKE, "smoke", shade=0.05)
    for offset, radius in (((0, 0, 0.016), 0.011), ((-0.006, 0.004, 0.036), 0.015), ((0.002, 0.012, 0.06), 0.018)):
        kit.sphere(smoke.bm, PIPE_BOWL + Vector(offset), (radius, radius, radius * 0.9), 6, 4)
    parts.append(smoke)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.49), (0, -0.004, 0.57), 0.026, 0.024, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    shirt = Part("shirt", SHIRT, torso_weights)
    kit.cone(shirt.bm, (0, 0, 0.3), (0, 0, 0.49), 0.062, 0.072, 12, squash=0.8)
    parts.append(shirt)

    jerkin = Part("jerkin", LEATHER, torso_weights)
    kit.cone(jerkin.bm, (0, 0, 0.32), (0, 0, 0.49), 0.068, 0.078, 12, squash=0.8)
    # Brass studs down the front.
    for z in (0.36, 0.41, 0.46):
        stud = kit.sphere(jerkin.bm, (0.0, -0.064, z), (0.008, 0.005, 0.008), 5, 4)
        jerkin.paint(faces_of(stud), BRASS)
    parts.append(jerkin)

    # A brass plate on the right shoulder, the camera side.
    plate = Part("plate", BRASS, "chest", shade=0.08)
    dome = kit.sphere(plate.bm, (-0.088, 0.0, 0.49), (0.05, 0.05, 0.036), 10, 6)
    for face in faces_of(dome):
        if face.calc_center_median().z < 0.475:
            plate.paint([face], BRASS_DARK)
    rivet = kit.sphere(plate.bm, (-0.112, -0.03, 0.51), (0.007, 0.007, 0.007), 4, 3)
    plate.paint(faces_of(rivet), IRON_DARK)
    parts.append(plate)

    scarf = Part("scarf", SCARF, "chest")
    kit.torus(scarf.bm, (0, 0.0, 0.5), (0, 0.15, 1), 0.042, 0.017, 12, 5)
    knot = kit.cone(scarf.bm, (0.01, -0.05, 0.5), (0.03, -0.07, 0.43), 0.028, 0.004, 4, squash=0.4)
    scarf.paint(faces_of(knot), SCARF_DARK)
    parts.append(scarf)

    # The frame straps over the shoulders.
    straps = Part("straps", STRAP, "chest", shade=0.04)
    for sign in (1, -1):
        kit.tube(straps.bm, [(0.055 * sign, 0.1, 0.52), (0.06 * sign, 0.0, 0.53), (0.064 * sign, -0.06, 0.48), (0.066 * sign, -0.062, 0.38)], [0.008] * 4, 4)
        buckle = kit.box(straps.bm, (0.066 * sign, -0.066, 0.43), (0.018, 0.006, 0.016))
        straps.paint(faces_of(buckle), BRASS)
    parts.append(straps)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.04)
    kit.cone(belt.bm, (0, 0, 0.3), (0, 0, 0.335), 0.07, 0.069, 12, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.058, 0.318), (0.026, 0.008, 0.024))
    belt.paint(faces_of(buckle), BRASS)
    # Brass pouches and an hourglass on the belt.
    for x, y in ((0.06, -0.035), (0.072, 0.02)):
        pouch = kit.box(belt.bm, (x, y, 0.29), (0.024, 0.032, 0.04))
        belt.paint(faces_of(pouch), LEATHER)
        lid = kit.box(belt.bm, (x, y, 0.312), (0.026, 0.034, 0.008))
        belt.paint(faces_of(lid), BRASS)
    for z in (0.25, 0.31):
        end = kit.cone(belt.bm, (-0.062, -0.03, z), (-0.062, -0.03, z + 0.008), 0.017, 0.017, 8)
        belt.paint(faces_of(end), BRASS)
    glass = kit.cone(belt.bm, (-0.062, -0.03, 0.258), (-0.062, -0.03, 0.284), 0.013, 0.004, 8)
    belt.paint(faces_of(glass), SAND)
    glass = kit.cone(belt.bm, (-0.062, -0.03, 0.284), (-0.062, -0.03, 0.31), 0.004, 0.013, 8)
    belt.paint(faces_of(glass), SMOKE)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.24), (0, 0, 0.31), 0.064, 0.066, 12, squash=0.82)
    # Ragged leather tails of the jerkin over the hips.
    for index in range(7):
        a = math.radians(-150 + index * 50)
        top = Vector((0.068 * math.sin(a), -0.056 * math.cos(a), 0.3))
        tail = kit.cone(hips.bm, top, top * 1.12 + Vector((0, 0, -0.07 - 0.015 * (index % 2))), 0.022, 0.004, 4, squash=0.4)
        hips.paint(faces_of(tail), LEATHER)
    parts.append(hips)
    return parts


def keg(part, center, axis, length, radius):
    """A small powder keg: red staves and brass bands."""
    axis = Vector(axis).normalized()
    center = Vector(center)
    a = center - axis * length / 2
    b = center + axis * length / 2
    side = axis.cross(Z if abs(axis.z) < 0.9 else X).normalized()
    up = side.cross(axis)
    verts = []
    verts += kit.cone(part.bm, a, center - axis * length / 4, radius * 0.86, radius, 10)
    verts += kit.cone(part.bm, center - axis * length / 4, center + axis * length / 4, radius, radius, 10)
    verts += kit.cone(part.bm, center + axis * length / 4, b, radius, radius * 0.86, 10)
    for face in faces_of(verts):
        offset = face.calc_center_median() - center
        if abs(offset.dot(axis)) > length / 2 - 0.002:
            part.paint([face], WOOD_DARK)
            continue
        angle = math.atan2(offset.dot(up), offset.dot(side))
        if int((angle + math.pi) / (2 * math.pi / 10)) % 2:
            part.paint([face], KEG_DARK)
    for along in (-0.42, 0.0, 0.42):
        r = radius * (0.93 if along else 1.0) + 0.004
        band = kit.torus(part.bm, center + axis * length * along, axis, r, 0.005, 12, 3)
        part.paint(faces_of(band), BRASS)


def kegs_parts():
    parts = []
    frame = Part("frame", WOOD, "kegs", shade=0.06)
    # Two rails up the back and the bars across.
    for sign in (1, -1):
        kit.cone(frame.bm, (0.08 * sign, KEG_Y - 0.075, 0.27), (0.08 * sign, KEG_Y - 0.075, FRAME_TOP), 0.011, 0.01, 5)
    for z in (0.3, 0.48, 0.64, FRAME_TOP - 0.02):
        bar = kit.cone(frame.bm, (0.085, KEG_Y - 0.075, z), (-0.085, KEG_Y - 0.075, z), 0.008, 0.008, 4)
        frame.paint(faces_of(bar), WOOD_DARK)
    shelf = kit.box(frame.bm, (0, KEG_Y, 0.3), (0.2, 0.15, 0.016))
    frame.paint(faces_of(shelf), WOOD_DARK)
    for sign in (1, -1):
        hook = kit.tube(frame.bm, [(0.08 * sign, KEG_Y - 0.075, FRAME_TOP), (0.08 * sign, KEG_Y - 0.075, FRAME_TOP + 0.02), (0.07 * sign, KEG_Y - 0.06, FRAME_TOP + 0.03)], [0.006] * 3, 4)
        frame.paint(faces_of(hook), BRASS)
    parts.append(frame)

    kegs = Part("kegs", KEG, "kegs", shade=0.1)
    # Two upright kegs on the shelf, one across them, two more on top and a
    # small one at the very top with the lit fuse.
    keg(kegs, (0.06, KEG_Y, 0.39), Z, 0.16, 0.062)
    keg(kegs, (-0.06, KEG_Y + 0.006, 0.39), Z, 0.16, 0.062)
    keg(kegs, (0, KEG_Y, 0.535), X, 0.22, 0.068)
    keg(kegs, (0.048, KEG_Y - 0.004, 0.67), Z, 0.13, 0.054)
    keg(kegs, (-0.052, KEG_Y + 0.01, 0.68), (0.12, 0, 1), 0.13, 0.052)
    keg(kegs, (0.006, KEG_Y + 0.004, 0.8), (-0.15, 0.05, 1), 0.11, 0.044)
    # Ropes around the stack.
    for z in (0.46, 0.61):
        rope = kit.torus(kegs.bm, (0, KEG_Y, z), (0, 0, 1), 0.12, 0.005, 14, 3)
        kegs.paint(faces_of(rope), WRAP)
    # The fuse on the top keg, and a short one on the keg at the right.
    fuse = kit.tube(kegs.bm, [(0.0, KEG_Y + 0.006, 0.85), (-0.006, KEG_Y + 0.02, 0.885), (0.01, KEG_Y + 0.016, 0.92), FUSE_TIP], [0.005, 0.005, 0.004, 0.003], 4)
    kegs.paint(faces_of(fuse), FUSE)
    fuse = kit.tube(kegs.bm, [(-0.05, KEG_Y + 0.012, 0.745), (-0.06, KEG_Y + 0.006, 0.775), (-0.05, KEG_Y - 0.004, 0.795)], [0.004, 0.004, 0.003], 4)
    kegs.paint(faces_of(fuse), FUSE)
    parts.append(kegs)

    sparks = Part("sparks", FLAME, "sparks", shade=0)
    kit.sphere(sparks.bm, FUSE_TIP, (0.012, 0.012, 0.012), 6, 4)
    for index in range(6):
        a = 2 * math.pi * index / 6
        out = Vector((math.cos(a), math.sin(a), 0.7)).normalized()
        spark = kit.cone(sparks.bm, FUSE_TIP, FUSE_TIP + out * (0.035 if index % 2 else 0.025), 0.006, 0.001, 3)
        sparks.paint(faces_of(spark), FLAME_HOT)
    parts.append(sparks)

    # The Last Breath fireball, small inside the middle keg at rest.
    blast = Part("blast", FLAME, "blast", shade=0)
    core = kit.sphere(blast.bm, BLAST_C, (0.04, 0.04, 0.04), 10, 6)
    blast.paint(faces_of(core), FLAME_HOT)
    for index in range(14):
        a = 2 * math.pi * index / 7
        rise = 0.6 if index < 7 else -0.3
        out = Vector((math.cos(a + index * 0.4), math.sin(a + index * 0.4), rise)).normalized()
        puff = kit.sphere(blast.bm, BLAST_C + out * 0.035, (0.024, 0.024, 0.024), 6, 4)
        blast.paint(faces_of(puff), FLAME if index % 3 else EMBER)
    for index in range(8):
        a = 2 * math.pi * index / 8
        out = Vector((math.cos(a), math.sin(a), 0.4 * math.sin(a * 2))).normalized()
        spike = kit.cone(blast.bm, BLAST_C + out * 0.03, BLAST_C + out * 0.07, 0.012, 0.001, 4)
        blast.paint(faces_of(spike), EMBER)
    parts.append(blast)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", SHIRT, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.023, 0.02, 8)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.017, 0.014, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.04)
        kit.cone(bracer.bm, e + (w - e) * 0.4, w - d * 0.004, 0.021, 0.019, 8)
        for along in (0.55, 0.8):
            ring = kit.torus(bracer.bm, e + (w - e) * along, d, 0.021, 0.004, 8, 3)
            bracer.paint(faces_of(ring), BRASS)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.018, (0.018, 0.016, 0.022), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.04, 0.032, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", TROUSERS_DARK, f"shin.{side}")
        kit.cone(shin.bm, knee, knee - Vector((0, 0, 0.05)), 0.033, 0.031, 8)
        guard = kit.sphere(shin.bm, knee + Vector((0, -0.016, 0)), (0.032, 0.022, 0.034), 8, 6)
        shin.paint(faces_of(guard), BRASS)
        rivet = kit.sphere(shin.bm, knee + Vector((0, -0.04, 0.002)), (0.007, 0.004, 0.007), 4, 3)
        shin.paint(faces_of(rivet), BRASS_DARK)
        parts.append(shin)

        boot = Part(f"boot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.09)), ankle - Vector((0, 0, 0.02)), 0.034, 0.034, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.03, 0.02), (0.056, 0.11, 0.04))
        toe = kit.sphere(boot.bm, (LEG_X * sign, -0.08, 0.026), (0.03, 0.026, 0.022), 6, 4)
        boot.paint(faces_of(toe), BRASS_DARK)
        # Cloth wraps around the boots.
        for z in (0.02, 0.045, 0.07):
            wrap = kit.torus(boot.bm, ankle + Vector((0, 0, z)), (0, 0.3 if z == 0.045 else -0.3, 1), 0.035, 0.005, 10, 3)
            boot.paint(faces_of(wrap), WRAP)
        parts.append(boot)
    return parts


def pick_parts():
    pick = Part("pick", WOOD, "pick", shade=0.04)
    top = GRIP_R + PICK * (HEAD_AT + 0.035)
    kit.cone(pick.bm, GRIP_R - PICK * 0.07, top, 0.013, 0.012, 6)
    for along in (-0.06, GRIP_AT - 0.02):
        wrap = kit.cone(pick.bm, GRIP_R + PICK * along, GRIP_R + PICK * (along + 0.035), 0.016, 0.016, 6)
        pick.paint(faces_of(wrap), LEATHER_DARK)
    pommel = kit.cone(pick.bm, GRIP_R - PICK * 0.085, GRIP_R - PICK * 0.065, 0.017, 0.017, 6)
    pick.paint(faces_of(pommel), BRASS)
    for along in (0.17, 0.25):
        band = kit.cone(pick.bm, GRIP_R + PICK * along, GRIP_R + PICK * (along + 0.012), 0.015, 0.015, 6)
        pick.paint(faces_of(band), BRASS)
    # The brass socket of the head.
    socket = kit.cone(pick.bm, PICK_HEAD - PICK * 0.04, top + PICK * 0.008, 0.024, 0.022, 8)
    pick.paint(faces_of(socket), BRASS)
    cap = kit.sphere(pick.bm, top + PICK * 0.01, (0.016, 0.016, 0.016), 6, 4)
    pick.paint(faces_of(cap), BRASS_DARK)
    # The long red-hot point to the front: it curves down at the tip.
    point = kit.tube(
        pick.bm,
        [
            PICK_HEAD,
            PICK_HEAD + BLADE * 0.06 + PICK * 0.004,
            PICK_HEAD + BLADE * 0.12 - PICK * 0.012,
            PICK_HEAD + BLADE * 0.17 - PICK * 0.045,
        ],
        [0.022, 0.018, 0.011, 0.002],
        6,
    )
    for face in faces_of(point):
        reach = (face.calc_center_median() - PICK_HEAD).dot(BLADE)
        pick.paint([face], IRON_DARK if reach < 0.03 else (EMBER if reach < 0.12 else FLAME_HOT))
    # The flat back of the head.
    back = kit.cone(pick.bm, PICK_HEAD, PICK_HEAD - BLADE * 0.065, 0.02, 0.024, 6)
    pick.paint(faces_of(back), IRON)
    face = kit.cone(pick.bm, PICK_HEAD - BLADE * 0.065, PICK_HEAD - BLADE * 0.07, 0.024, 0.02, 6)
    pick.paint(faces_of(face), EMBER)
    parts = [pick]

    # Small flames rise from the red-hot point.
    flames = Part("flames", FLAME, "flame", shade=0)
    for index, (along, height) in enumerate(((0.05, 0.05), (0.09, 0.07), (0.13, 0.055))):
        base = PICK_HEAD + BLADE * along + PICK * (0.008 - along * 0.15)
        points = [base, base + Z * height * 0.45 + BLADE * 0.006, base + Z * height * 0.8 - BLADE * 0.004, base + Z * height + BLADE * 0.01]
        tongue = kit.tube(flames.bm, points, [0.018, 0.016, 0.009, 0.001], 5)
        for face in faces_of(tongue):
            rise = (face.calc_center_median() - base).dot(Z) / height
            flames.paint([face], EMBER if rise < 0.3 else (FLAME if rise < 0.7 else FLAME_HOT))
    parts.append(flames)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("MineSapper", BONES)
    parts = head_parts() + body_parts() + kegs_parts() + limb_parts() + pick_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "MineSapperMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the haft, the right hand to swing. The pick aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "pick_aim": kit.add_empty("pick_aim"),
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
    aim = bones["pick"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["pick_aim"]
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

    pick_rest = rig.data.bones["pick"].matrix_local.to_quaternion()

    def aimed(direction, roll=0.0):
        """The world rotation of the pick that points the haft along `direction`, turned `roll` degrees about it."""
        direction = Vector(direction).normalized()
        spin = kit.Quaternion(direction, math.radians(roll))
        return spin @ PICK.rotation_difference(direction) @ pick_rest

    def swing(base, hand, direction, roll=0.0):
        """The right hand and the pick by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "pick_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "pick_aim_at_rot": aimed(direction, roll),
            },
        )

    def stand(breath=0.0, sway=0.0, flicker=0.0, puff=0.0):
        """
        The idle stance: low on bent knees, the left foot in front, bent a
        little under the kegs. The fuse and the flames flicker, and the pipe
        puffs.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -12)),
            "spine": t("spine", (Z, -2), (X, 10 + breath)),
            "chest": t("chest", (X, -breath * 2)),
            "neck": t("neck", (Z, 8), (X, -6)),
            "head": t("head", (Z, 6 + sway * 4), (X, -6 + breath * 2), (Y, -4)),
            "upperarm.R": t("upperarm.R", (X, -breath * 3)),
            "thigh.L": t("thigh.L", (X, -22), (Y, -6)),
            "shin.L": t("shin.L", (X, 30)),
            "foot.L": t("foot.L", (X, -8)),
            "thigh.R": t("thigh.R", (X, 4), (Y, 6)),
            "shin.R": t("shin.R", (X, 24)),
            "foot.R": t("foot.R", (X, -28)),
            "kegs": t("kegs", (X, -breath * 2), (Y, sway * 1.5)),
            "forearm.L/IK": 1.0,
            "flame@scale": 0.9 + 0.2 * flicker,
            "sparks@scale": 0.8 + 0.4 * flicker,
            "smoke@scale": 0.4 + 0.8 * puff,
            "blast@scale": 0.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, leaning on the pick, with the point on the ground."""
        return swing(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.02, -0.095 - breath * 0.004)),
                spine=t("spine", (Z, -4), (X, 24 + breath * 3)),
                chest=t("chest", (X, 6 + breath * 2)),
                head=t("head", (Z, 4), (X, 10 + breath * 4), (Y, -10)),
                thigh__L=t("thigh.L", (X, -70), (Y, -6)),
                shin__L=t("shin.L", (X, 70)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 10), (Y, 6)),
                shin__R=t("shin.R", (X, 90)),
                foot__R=t("foot.R", (X, -40)),
                kegs=t("kegs", (X, 4), (Y, -6)),
                flame_at_scale=0.5 + 0.1 * breath,
                sparks_at_scale=0.4 + 0.2 * breath,
                smoke_at_scale=0.0,
            ),
            (-0.1, -0.13, 0.34),
            (-0.05, -0.12, -1),
            180,
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -2), (X, -4 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 6), (X, -18 * amount)),
            upperarm__R=t("upperarm.R", (X, 14 * amount), (Y, 10 * amount)),
            kegs=t("kegs", (X, -8 * amount)),
            sparks_at_scale=0.8 + 0.6 * amount,
        )

    def stagger(base):
        """The fuse burns down: he looks back at the kegs."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.03)),
            spine=t("spine", (X, 12), (Z, -10)),
            neck=t("neck", (Z, -30)),
            head=t("head", (Z, -40), (X, -20)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__R=t("upperarm.R", (X, 16), (Y, 16)),
            kegs=t("kegs", (Y, 6)),
            sparks_at_scale=2.2,
            smoke_at_scale=0.0,
        )

    def blown(base, blast=1.0, kegs=1.0, lift=0.0):
        """The Last Breath: the kegs blow up behind him, and the blast throws him forward."""
        return pose(
            base,
            root=t("root", (X, 30 * lift)),
            root_at_loc=at("root", (0, -0.04 * lift, 0.12 * lift)),
            spine=t("spine", (X, -16)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -30)),
            upperarm__R=t("upperarm.R", (X, -80), (Y, 30)),
            thigh__L=t("thigh.L", (X, -40), (Y, -10)),
            shin__L=t("shin.L", (X, 50)),
            thigh__R=t("thigh.R", (X, 20), (Y, 10)),
            shin__R=t("shin.R", (X, 40)),
            kegs=t("kegs", (X, -20)),
            kegs_at_scale=kegs,
            sparks_at_scale=0.0,
            flame_at_scale=0.4,
            blast_at_scale=blast,
        )

    def fallen(base, bounce=0.0, blast=0.0):
        """Flat on his face, in soot, the kegs gone and the pick flat on the ground in front."""
        return swing(
            pose(
            base,
            root=t("root", (X, 86 - bounce)),
            root_at_loc=at("root", (0, 0.24, 0.07)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -10), (Z, -30)),
            thigh__L=t("thigh.L", (X, -6), (Y, -10)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 20)),
            thigh__R=t("thigh.R", (X, 10), (Y, 8)),
            shin__R=t("shin.R", (X, 50)),
            foot__R=t("foot.R", (X, 20)),
            kegs_at_scale=0.001,
            sparks_at_scale=0.0,
            flame_at_scale=0.0,
            smoke_at_scale=0.0,
            blast_at_scale=blast,
            ),
            FALLEN_HAND,
            FALLEN_PICK,
            FALLEN_ROLL,
        )

    def flat(base, bounce=0.0):
        """Flat on his back on the kegs, for the Rebirth: the kegs do not blow up."""
        return pose(
            base,
            root=t("root", (X, -78 + bounce)),
            root_at_loc=at("root", (0, -0.16, 0.2)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, 10), (Z, 30)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, 10)),
            thigh__L=t("thigh.L", (X, -40), (Y, -8)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -30), (Y, 8)),
            shin__R=t("shin.R", (X, 50)),
            foot__R=t("foot.R", (X, 0)),
            sparks_at_scale=0.3,
            smoke_at_scale=0.0,
        )

    def crouch(base, fire=0.3):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.1)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 10)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -50), (Y, 6)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            flame_at_scale=fire,
            sparks_at_scale=fire,
            smoke_at_scale=0.0,
        )

    def proud(base):
        """Up again, the pick raised high and the fuse flaring: the end of a summon and a Rebirth."""
        return swing(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, 0.004)),
                spine=t("spine", (X, -2)),
                chest=t("chest", (X, -8)),
                head=t("head", (Z, 4), (X, -14)),
                thigh__L=t("thigh.L", (X, -8), (Y, -6)),
                shin__L=t("shin.L", (X, 6)),
                thigh__R=t("thigh.R", (X, 4), (Y, 6)),
                shin__R=t("shin.R", (X, 6)),
                foot__R=t("foot.R", (X, -10)),
                flame_at_scale=1.3,
                sparks_at_scale=1.6,
                smoke_at_scale=1.0,
            ),
            (-0.13, -0.02, 0.6),
            (0.0, 0.1, 1),
        )

    def step(front):
        """A quick step under the weight of the kegs. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.012)),
            spine=t("spine", (Z, -2), (X, 16)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 20)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 26)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "upperarm__R": t("upperarm.R", (X, -6 * front)),
                "kegs": t("kegs", (X, 4), (Y, 5 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.004)),
            spine=t("spine", (Z, -2), (X, 16)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -24)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, -2)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 14)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                "kegs": t("kegs", (X, -4)),
            },
        )

    # The attack: the pick goes up over his right shoulder, then he chops it
    # down in front of him. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the chop lands at frame 15 of 30.
    def windup(base):
        return swing(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.02, -0.01)),
                hips=t("hips", (Z, -20)),
                spine=t("spine", (Z, -6), (X, -6)),
                chest=t("chest", (X, -8)),
                head=t("head", (Z, 10), (X, -4)),
                thigh__L=t("thigh.L", (X, -26), (Y, -8)),
                shin__L=t("shin.L", (X, 22)),
                thigh__R=t("thigh.R", (X, 12), (Y, 8)),
                shin__R=t("shin.R", (X, 18)),
                foot__R=t("foot.R", (X, -26)),
                kegs=t("kegs", (X, -6)),
                flame_at_scale=1.25,
            ),
            (-0.07, 0.0, 0.62),
            (-0.05, 0.55, 0.85),
        )

    def chop(base):
        return swing(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.045, -0.06)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (Z, 2), (X, 26)),
                chest=t("chest", (X, 10)),
                neck=t("neck", (X, -10)),
                head=t("head", (Z, 4), (X, -14)),
                thigh__L=t("thigh.L", (X, -46), (Y, -8)),
                shin__L=t("shin.L", (X, 40)),
                foot__L=t("foot.L", (X, 6)),
                thigh__R=t("thigh.R", (X, 26), (Y, 8)),
                shin__R=t("shin.R", (X, 14)),
                foot__R=t("foot.R", (X, -30)),
                kegs=t("kegs", (X, 10)),
                flame_at_scale=1.4,
                sparks_at_scale=1.4,
            ),
            (-0.06, -0.22, 0.3),
            (-0.02, -0.9, -0.42),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, flicker, puff in ((0, 0, 0, 0, 0.5), (12, 0.5, 1, 1, 1), (24, 1, 0, 0, 0.2), (36, 0.5, -1, 1, 0.4), (48, 0, 0, 0, 0.5)):
        idle.key(frame, stand(breath, sway, flicker, puff))
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

    # The death is his Last Breath: the fuse flares, the kegs blow up at
    # frame 12, and the blast throws him on his face.
    death = Clip("death", 36)
    death.key(0, stand()).key(4, recoil(stand())).key(10, stagger(stand()))
    death.key(12, blown(stand(), 0.6, 1.0, 0.0)).key(14, blown(stand(), 4.5, 0.001, 0.4)).key(18, blown(stand(), 5.5, 0.001, 1.0))
    death.key(24, fallen(stand(), 0, 2.0)).key(28, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, flat(stand())).key(22, flat(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(), 0.0)).key(10, pose(crouch(stand(), 0.5), hips_at_loc=at("hips", (0, 0.01, -0.08))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "mine-sapper.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
