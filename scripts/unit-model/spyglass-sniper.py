"""
Spyglass Sniper (`goblin.spyglassSniper`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an old pale goblin woman with a
big mass of wild white hair, very large ears and brass goggles with many
lenses, a red cloak, a cream shirt under a leather vest with brass buckles,
dark trousers with white fur at the knees, tall boots, a notebook of stolen
plans and two small brass spyglasses at her right hip, and a long crossbow
with a big brass spyglass on top. A small bird sits on the front of the
crossbow. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/spyglass-sniper.glb`; then
`bun unit-model:pack spyglass-sniper` packs it for the game.

The left hand always holds the crossbow (IK to the `grip.L` bone). The attack
puts her eye to the spyglass with IK and the `Aim` constraint, and shoots at
20% of the clip, when the projectile leaves: the `bolt` bone scales the
loaded bolt down, and the bird hops up in fright. Sabotage has no clip of
its own, so she has no cast clip.
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

SKIN = hex_color("#aeaaa0")
SKIN_DARK = hex_color("#827e76")
EAR = hex_color("#d89a92")
HAIR = hex_color("#efede8")
HAIR_DARK = hex_color("#cfcac0")
EYES = hex_color("#f0a43a")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a2a26")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
LENS = hex_color("#2c3a46")
LENS_LIGHT = hex_color("#7a96a8")
CLOAK = hex_color("#9a2c24")
CLOAK_DARK = hex_color("#6a1c18")
SHIRT = hex_color("#ddd2b8")
VEST = hex_color("#6a4228")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
TROUSERS = hex_color("#4e4038")
FUR = hex_color("#ece6da")
BOOT = hex_color("#6a4026")
PAGE = hex_color("#e6d8b4")
INK = hex_color("#6a5a44")
WOOD = hex_color("#6a3c20")
WOOD_DARK = hex_color("#4a2a16")
IRON = hex_color("#3e3c3a")
STRING = hex_color("#d8ccb0")
FLETCH = hex_color("#b23a2c")
BIRD = hex_color("#8a8a86")
BIRD_LIGHT = hex_color("#f2eee6")
BIRD_CAP = hex_color("#1e1c1c")
BIRD_BELLY = hex_color("#d8b88a")
BEAK = hex_color("#3a3530")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.3
WAIST_Z = 0.36
CHEST_Z = 0.42
SHOULDER_Z = 0.48
NECK_Z = 0.5
HEAD_C = Vector((0, -0.02, 0.6))
KNEE_Z = 0.17
ANKLE_Z = 0.04
LEG_X = 0.048

# The right hand holds the crossbow at the grip, at the hip; the crossbow
# points up across the body, and the left hand holds its fore-stock. These
# are the rest positions.
SL = Vector((0.092, 0, SHOULDER_Z))
EL = Vector((0.135, -0.035, 0.36))
SR = Vector((-0.092, 0, SHOULDER_Z))
ER = Vector((-0.13, 0.03, 0.36))
WR = Vector((-0.085, -0.075, 0.28))
TR = WR + (WR - ER).normalized() * 0.04

BOW = Vector((0.5, -0.4, 0.77)).normalized()
GRIP_R = WR + (WR - ER).normalized() * 0.022
FORE_END = 0.14
GRIP_L = GRIP_R + BOW * FORE_END
WL = GRIP_L
TL = WL + (WL - EL).normalized() * 0.04
# The prod (the bow) is near the front, and the bird sits at the very front.
PROD_AT = 0.3
FRONT_AT = 0.36
BOW_SIDE = BOW.cross(Z).normalized()
BOW_UP = BOW_SIDE.cross(BOW).normalized()
BIRD_C = GRIP_R + BOW * (FRONT_AT - 0.02) + BOW_UP * 0.03
BOLT_C = GRIP_R + BOW * 0.12 + BOW_UP * 0.016

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.53), "chest"),
    ("head", (0, 0, 0.53), (0, 0, 0.71), "neck"),
    ("cape", (0, 0.06, 0.45), (0, 0.1, 0.2), "chest"),
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
    ("crossbow", tuple(GRIP_R), tuple(GRIP_R + BOW * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + BOW * 0.05), "crossbow"),
    ("bolt", tuple(BOLT_C), tuple(BOLT_C + BOW * 0.05), "crossbow"),
    ("bird", tuple(BIRD_C), tuple(BIRD_C + BOW_UP * 0.04), "crossbow"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.32, 0.39)
    return blend("spine", "chest", co.z, 0.4, 0.46)


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.38, 0.47)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.076, 0.074, 0.078), 14, 10)
    # A narrow chin and a long, droopy nose.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.055)), (0.044, 0.038, 0.03), 10, 6)
    kit.tube(head.bm, [HEAD_C + Vector((0, -0.066, -0.005)), HEAD_C + Vector((0, -0.098, -0.02)), HEAD_C + Vector((0, -0.106, -0.04))], [0.017, 0.012, 0.006], 6)
    for sign in (1, -1):
        # Goblin ears: very large, out to the sides and a little down with age.
        ear = kit.cone(head.bm, HEAD_C + Vector((0.068 * sign, 0.01, 0.0)), HEAD_C + Vector((0.205 * sign, 0.05, 0.03)), 0.042, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A thin, knowing smile and two creases on the cheeks.
    kit.tube(face.bm, [HEAD_C + Vector((0.026, -0.058, -0.044)), HEAD_C + Vector((0.0, -0.066, -0.05)), HEAD_C + Vector((-0.03, -0.058, -0.04))], [0.004] * 3, 4)
    for sign in (1, -1):
        crease = kit.tube(face.bm, [HEAD_C + Vector((0.04 * sign, -0.056, -0.012)), HEAD_C + Vector((0.044 * sign, -0.054, -0.036))], [0.003, 0.002], 3)
        face.paint(faces_of(crease), SKIN_DARK)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.08)
    # A big mass of wild white hair, with tufts that stick out everywhere.
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.03, 0.05)), (0.09, 0.085, 0.06), 12, 7)
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.06, 0.0)), (0.078, 0.055, 0.07), 10, 6)
    for index in range(11):
        a = math.radians(-150 + index * 30)
        root = HEAD_C + Vector((0.06 * math.sin(a), 0.035 + 0.045 * math.cos(a), 0.06))
        reach = 0.055 + 0.025 * ((index * 5) % 3)
        tip = root + Vector((reach * math.sin(a), 0.02 + reach * math.cos(a), 0.05 - 0.02 * (index % 3)))
        tuft = kit.cone(hair.bm, root, tip, 0.034, 0.006, 5)
        if index % 2:
            hair.paint(faces_of(tuft), HAIR_DARK)
    parts.append(hair)

    # The goggles with many lenses: two big lenses over the eyes and a small
    # one on an arm at the right, the camera side.
    goggles = Part("goggles", BRASS, "head", shade=0.05)
    kit.torus(goggles.bm, HEAD_C + Vector((0, 0.004, 0.022)), (0, 0.2, 1), 0.079, 0.007, 16, 4)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.032 * sign, -0.064, 0.016))
        out = Vector((0.15 * sign, -1, 0.05)).normalized()
        kit.cone(goggles.bm, center - out * 0.008, center + out * 0.03, 0.03, 0.027, 12)
        rim = kit.torus(goggles.bm, center + out * 0.03, out, 0.025, 0.005, 12, 3)
        goggles.paint(faces_of(rim), BRASS_DARK)
        lens = kit.cone(goggles.bm, center + out * 0.028, center + out * 0.032, 0.022, 0.022, 12)
        goggles.paint(faces_of(lens), EYES)
        pupil = kit.sphere(goggles.bm, center + out * 0.033 + Vector((-0.004 * sign, 0, 0)), (0.009, 0.003, 0.01), 6, 4)
        goggles.paint(faces_of(pupil), PUPIL)
    arm = kit.tube(goggles.bm, [HEAD_C + Vector((-0.07, -0.03, 0.02)), HEAD_C + Vector((-0.085, -0.06, 0.04)), HEAD_C + Vector((-0.07, -0.09, 0.05))], [0.005] * 3, 4)
    goggles.paint(faces_of(arm), BRASS_DARK)
    small = HEAD_C + Vector((-0.064, -0.098, 0.05))
    kit.cone(goggles.bm, small, small + Vector((0.01, -0.025, 0)), 0.016, 0.015, 8)
    lens = kit.cone(goggles.bm, small + Vector((0.01, -0.025, 0)), small + Vector((0.011, -0.028, 0)), 0.012, 0.012, 8)
    goggles.paint(faces_of(lens), LENS_LIGHT)
    parts.append(goggles)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.48), (0, -0.004, 0.56), 0.025, 0.023, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    shirt = Part("shirt", SHIRT, torso_weights)
    kit.cone(shirt.bm, (0, 0, 0.3), (0, 0, 0.48), 0.066, 0.072, 12, squash=0.82)
    parts.append(shirt)

    vest = Part("vest", VEST, torso_weights)
    verts = kit.cone(vest.bm, (0, 0, 0.32), (0, 0, 0.48), 0.071, 0.077, 12, squash=0.82)
    # The vest is open at the front, so the shirt shows.
    open_front = [v for v in verts if v.co.y < -0.05 and abs(v.co.x) < 0.02]
    vest.paint(faces_of(open_front), SHIRT)
    for z in (0.36, 0.42):
        for sign in (1, -1):
            buckle = kit.box(vest.bm, (0.032 * sign, -0.062, z), (0.016, 0.008, 0.012))
            vest.paint(faces_of(buckle), BRASS)
    parts.append(vest)

    # Torn cloth at the shoulders, under the cloak.
    rags = Part("rags", SHIRT, "chest", shade=0.06)
    for sign in (1, -1):
        for index in range(3):
            top = Vector((0.075 * sign, -0.02 + 0.02 * index, 0.47))
            kit.cone(rags.bm, top, top + Vector((0.025 * sign, 0.0, -0.07 - 0.012 * (index % 2))), 0.02, 0.004, 4, squash=0.5)
    parts.append(rags)

    def cloak_color(row, column):
        return CLOAK_DARK if column % 3 == 1 or row == 3 else CLOAK

    cloak = Part("cloak", CLOAK, cape_weights)
    kit.ragged_cone(cloak, 0.51, 0.12, 0.05, 0.14, 14, 4, 0.85, 0.07, cloak_color, CLOAK_DARK, gap=math.radians(80), y_push=0.05)
    collar = kit.torus(cloak.bm, (0, 0.02, 0.495), (0, 0.35, 1), 0.058, 0.018, 12, 5)
    cloak.paint(faces_of(collar), CLOAK_DARK)
    clasp = kit.sphere(cloak.bm, (0, -0.05, 0.49), (0.012, 0.008, 0.012), 6, 4)
    cloak.paint(faces_of(clasp), BRASS)
    parts.append(cloak)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, 0, 0.3), (0, 0, 0.33), 0.07, 0.069, 12, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.057, 0.315), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), BRASS)
    # A brass compass on the belt at the front.
    compass = kit.cone(belt.bm, (0.035, -0.058, 0.3), (0.035, -0.066, 0.3), 0.018, 0.018, 10)
    belt.paint(faces_of(compass), BRASS)
    # Two small brass spyglasses at the right hip.
    for x, y in ((-0.072, -0.025), (-0.074, 0.012)):
        glass = kit.cone(belt.bm, (x, y, 0.32), (x - 0.005, y, 0.23), 0.012, 0.014, 8)
        belt.paint(faces_of(glass), BRASS)
        end = kit.cone(belt.bm, (x - 0.005, y, 0.23), (x - 0.005, y, 0.225), 0.012, 0.012, 8)
        belt.paint(faces_of(end), LENS)
    parts.append(belt)

    # The notebook of stolen plans hangs at the front of the right hip.
    book = Part("book", PAGE, "hips", shade=0.03)
    corner = Vector((-0.07, -0.06, 0.29))
    across = Vector((0.4, -1, 0)).normalized()
    face_out = across.cross(Z).normalized()
    kit.slab(book.bm, corner, face_out * 0.008, across * 0.034, Z * 0.045)
    # Drawings with no letters on the open page.
    for u, v, length in ((0.008, 0.02, 0.04), (-0.008, 0.0, 0.03), (0.004, -0.022, 0.044)):
        line = kit.slab(book.bm, corner + face_out * 0.009 + across * u + Z * v, face_out * 0.0015, across * length / 2, Z * 0.0025)
        book.paint(faces_of(line), INK)
    spine = kit.slab(book.bm, corner - face_out * 0.009, face_out * 0.003, across * 0.036, Z * 0.047)
    book.paint(faces_of(spine), LEATHER_DARK)
    strap = kit.tube(book.bm, [corner + Z * 0.046, (-0.066, -0.05, 0.33)], [0.004, 0.004], 4)
    book.paint(faces_of(strap), LEATHER_DARK)
    parts.append(book)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.25), (0, 0, 0.31), 0.066, 0.066, 12, squash=0.84)
    parts.append(hips)
    return parts


def bird_parts():
    """A small chickadee: grey back, white cheeks, black cap and bib."""
    bird = Part("bird", BIRD, "bird", shade=0.05)
    c = BIRD_C
    fwd = BOW
    up = BOW_UP
    side = BOW_SIDE
    body = kit.sphere(bird.bm, c + up * 0.016, (0.017, 0.017, 0.017), 8, 6)
    for face in faces_of(body):
        if (face.calc_center_median() - c).dot(up) < 0.012:
            bird.paint([face], BIRD_BELLY)
    head = c + up * 0.034 + fwd * 0.012
    cap = kit.sphere(bird.bm, head, (0.012, 0.012, 0.012), 8, 6)
    for face in faces_of(cap):
        rel = face.calc_center_median() - head
        bird.paint([face], BIRD_CAP if rel.dot(up) > 0.002 or rel.dot(fwd) < -0.006 else BIRD_LIGHT)
    beak = kit.cone(bird.bm, head + fwd * 0.01, head + fwd * 0.02, 0.003, 0.0005, 4)
    bird.paint(faces_of(beak), BEAK)
    tail = kit.cone(bird.bm, c + up * 0.014 - fwd * 0.012, c + up * 0.02 - fwd * 0.04, 0.008, 0.002, 4, squash=0.4)
    bird.paint(faces_of(tail), BIRD_CAP)
    for sign in (1, -1):
        wing = kit.cone(bird.bm, c + up * 0.02 + side * 0.014 * sign, c + up * 0.016 + side * 0.016 * sign - fwd * 0.026, 0.009, 0.002, 4, squash=0.5)
        bird.paint(faces_of(wing), BIRD)
        eye = kit.sphere(bird.bm, head + fwd * 0.006 + side * 0.009 * sign, (0.0025, 0.0025, 0.0025), 4, 3)
        bird.paint(faces_of(eye), BIRD_CAP)
    return [bird]


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", SHIRT, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.025, 0.021, 8)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.017, 0.014, 8)
        parts.append(forearm)

        glove = Part(f"glove.{side}", LEATHER, f"forearm.{side}", shade=0.04)
        verts = kit.cone(glove.bm, e + (w - e) * 0.4, w - d * 0.004, 0.022, 0.02, 8)
        glove.paint({f for v in verts if (v.co - w).length < 0.015 for f in v.link_faces}, BRASS)
        parts.append(glove)

        hand = Part(f"hand.{side}", LEATHER, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.018, (0.018, 0.016, 0.022), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.042, 0.033, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", TROUSERS, f"shin.{side}")
        kit.cone(shin.bm, knee, knee - Vector((0, 0, 0.05)), 0.034, 0.032, 8)
        # A ruff of white fur around the knee.
        fur = kit.sphere(shin.bm, knee + Vector((0, -0.004, -0.004)), (0.046, 0.044, 0.03), 8, 5)
        shin.paint(faces_of(fur), FUR)
        parts.append(shin)

        boot = Part(f"boot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.1)), ankle - Vector((0, 0, 0.02)), 0.036, 0.034, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.03, 0.02), (0.056, 0.11, 0.04))
        cuff = kit.torus(boot.bm, ankle + Vector((0, 0, 0.1)), (0, 0, 1), 0.037, 0.008, 10, 4)
        boot.paint(faces_of(cuff), LEATHER_DARK)
        for z in (0.05, 0.085):
            strap = kit.torus(boot.bm, ankle + Vector((0, 0, z - 0.04)), (0, 0, 1), 0.036, 0.004, 10, 3)
            boot.paint(faces_of(strap), BRASS)
        parts.append(boot)
    return parts


def crossbow_parts():
    bow = Part("crossbow", WOOD, "crossbow", shade=0.03)
    side, up = BOW_SIDE, BOW_UP
    butt = GRIP_R - BOW * 0.12
    # The stock, the grip and the long fore-stock.
    kit.cone(bow.bm, butt - up * 0.014, GRIP_R - up * 0.004, 0.026, 0.014, 6, squash=0.6)
    kit.cone(bow.bm, GRIP_R, GRIP_R + BOW * FRONT_AT, 0.014, 0.012, 6)
    plate = kit.cone(bow.bm, butt - up * 0.014 - BOW * 0.004, butt - up * 0.014 + BOW * 0.006, 0.027, 0.027, 6, squash=0.6)
    bow.paint(faces_of(plate), BRASS)
    for along in (0.06, 0.2, FRONT_AT - 0.01):
        band = kit.cone(bow.bm, GRIP_R + BOW * along, GRIP_R + BOW * (along + 0.012), 0.016, 0.016, 6)
        bow.paint(faces_of(band), BRASS)
    trigger = kit.cone(bow.bm, GRIP_R - up * 0.012 + BOW * 0.02, GRIP_R - up * 0.05 + BOW * 0.0, 0.004, 0.003, 4)
    bow.paint(faces_of(trigger), IRON)
    # The steel prod, bent forward at the tips, and the string to the nut.
    prod = GRIP_R + BOW * PROD_AT + up * 0.006
    left_tip = prod + side * 0.14 - BOW * 0.045
    right_tip = prod - side * 0.14 - BOW * 0.045
    arms = kit.tube(bow.bm, [left_tip, prod + side * 0.07 + BOW * 0.006, prod, prod - side * 0.07 + BOW * 0.006, right_tip], [0.005, 0.009, 0.011, 0.009, 0.005], 5)
    bow.paint(faces_of(arms), IRON)
    for tip in (left_tip, right_tip):
        cap = kit.sphere(bow.bm, tip, (0.007, 0.007, 0.007), 4, 3)
        bow.paint(faces_of(cap), BRASS)
    nut = GRIP_R + BOW * 0.07 + up * 0.012
    string = kit.tube(bow.bm, [left_tip, nut, right_tip], [0.002, 0.002, 0.002], 3)
    bow.paint(faces_of(string), STRING)
    # A hooked brass claw under the front.
    claw = kit.tube(bow.bm, [GRIP_R + BOW * (FRONT_AT - 0.03) - up * 0.01, GRIP_R + BOW * (FRONT_AT - 0.01) - up * 0.04, GRIP_R + BOW * (FRONT_AT - 0.04) - up * 0.06], [0.006, 0.005, 0.002], 4)
    bow.paint(faces_of(claw), BRASS_DARK)

    # The big brass spyglass on top, in two sections, on two mounts.
    base = GRIP_R + up * 0.045
    glass = kit.cone(bow.bm, base - BOW * 0.02, base + BOW * 0.1, 0.015, 0.017, 10)
    bow.paint(faces_of(glass), BRASS)
    glass = kit.cone(bow.bm, base + BOW * 0.1, base + BOW * 0.21, 0.02, 0.024, 10)
    bow.paint(faces_of(glass), BRASS)
    for along in (0.1, 0.205):
        ring = kit.torus(bow.bm, base + BOW * along, BOW, 0.022 if along < 0.15 else 0.025, 0.004, 10, 3)
        bow.paint(faces_of(ring), BRASS_DARK)
    lens = kit.cone(bow.bm, base + BOW * 0.21, base + BOW * 0.214, 0.021, 0.021, 10)
    bow.paint(faces_of(lens), LENS_LIGHT)
    eyepiece = kit.cone(bow.bm, base - BOW * 0.02, base - BOW * 0.035, 0.012, 0.014, 8)
    bow.paint(faces_of(eyepiece), LEATHER_DARK)
    for along in (0.02, 0.16):
        mount = kit.cone(bow.bm, GRIP_R + up * 0.012 + BOW * along, GRIP_R + up * 0.032 + BOW * along, 0.005, 0.005, 4)
        bow.paint(faces_of(mount), BRASS_DARK)
    parts = [bow]

    # The loaded bolt in the groove, with red fletches.
    bolt = Part("bolt", WOOD_DARK, "bolt", shade=0.02)
    tail = GRIP_R + BOW * 0.07 + up * 0.016
    head = GRIP_R + BOW * (FRONT_AT + 0.05) + up * 0.016
    kit.cone(bolt.bm, tail, head - BOW * 0.02, 0.004, 0.004, 4)
    point = kit.cone(bolt.bm, head - BOW * 0.022, head, 0.008, 0.001, 4)
    bolt.paint(faces_of(point), IRON)
    for sign in (1, -1):
        fletch = kit.cone(bolt.bm, tail + BOW * 0.03, tail + side * 0.012 * sign + up * 0.006, 0.006, 0.001, 3, squash=0.3)
        bolt.paint(faces_of(fletch), FLETCH)
    parts.append(bolt)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("SpyglassSniper", BONES)
    parts = head_parts() + body_parts() + limb_parts() + crossbow_parts() + bird_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "SpyglassSniperMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the crossbow, the right hand to aim. The crossbow aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "bow_aim": kit.add_empty("bow_aim"),
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
    aim = bones["crossbow"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["bow_aim"]
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

    bow_rest = rig.data.bones["crossbow"].matrix_local.to_quaternion()

    def aimed(direction, roll=0.0):
        """
        The world rotation of the crossbow that points it along `direction`,
        with the prod level and the spyglass on top, turned `roll` degrees.
        """
        direction = Vector(direction).normalized()
        level = Vector(direction).cross(Z).normalized()
        up = level.cross(direction).normalized()
        rest = kit.Matrix((BOW_SIDE, BOW, BOW_UP)).transposed()
        want = kit.Matrix((level, direction, up)).transposed()
        spin = kit.Quaternion(direction, math.radians(roll))
        return spin @ (want @ rest.inverted()).to_quaternion() @ bow_rest

    def stand(breath=0.0, sway=0.0, bird=0.0):
        """
        The idle stance: low on bent knees and turned a little to her right,
        the crossbow across the body. The bird looks about.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -14)),
            "spine": t("spine", (Z, -4), (X, 10 + breath)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (Z, 10), (X, 6)),
            "head": t("head", (Z, 8 + sway * 5), (X, -4 + breath * 2), (Y, -6)),
            "upperarm.R": t("upperarm.R", (X, -breath * 3)),
            "thigh.L": t("thigh.L", (X, -22), (Y, -6)),
            "shin.L": t("shin.L", (X, 32)),
            "foot.L": t("foot.L", (X, -10)),
            "thigh.R": t("thigh.R", (X, 2), (Y, 6)),
            "shin.R": t("shin.R", (X, 24)),
            "foot.R": t("foot.R", (X, -26)),
            "cape": t("cape", (X, -4 - breath * 2), (Y, sway * 3)),
            "bird": t("bird", (Z, bird * 40), (X, -abs(bird) * 12)),
            "forearm.L/IK": 1.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, leaning on the crossbow."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.1 - breath * 0.004)),
            spine=t("spine", (Z, -4), (X, 20 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2)),
            head=t("head", (Z, 6), (X, 14 + breath * 4), (Y, -10)),
            upperarm__R=t("upperarm.R", (X, -30)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, 30)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 70)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 10), (Y, 6)),
            shin__R=t("shin.R", (X, 90)),
            foot__R=t("foot.R", (X, -40)),
            cape=t("cape", (X, 20)),
            bird=t("bird", (Z, -60 + breath * 30), (X, 20)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the bird hops."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -4), (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            upperarm__R=t("upperarm.R", (X, 14 * amount), (Y, 10 * amount)),
            cape=t("cape", (X, 14 * amount)),
            bird=t("bird", (X, -30 * amount)),
            bird_at_loc=at("bird", BOW_UP * 0.03 * amount),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.04)),
            spine=t("spine", (X, 22)),
            head=t("head", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 44)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, 16)),
            cape=t("cape", (X, -20)),
            bird_at_loc=at("bird", BOW_UP * 0.08),
        )

    def fallen(base, bounce=0.0, bird=1.0):
        """Flat on the back, the crossbow across the chest. The bird flies away."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.075)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            neck=t("neck", (X, 16)),
            head=t("head", (X, 26), (Z, 30)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, 10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            cape=t("cape", (X, -28)),
            bird_at_loc=at("bird", BOW_UP * 0.2 * bird),
            bird_at_scale=max(1.0 - bird, 0.0),
        )

    def crouch(base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.1)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 16)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -50), (Y, 6)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            cape=t("cape", (X, 30)),
        )

    def proud(base):
        """Up again, the crossbow raised high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -120), (Y, 20)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 6)),
            thigh__R=t("thigh.R", (X, 4), (Y, 6)),
            shin__R=t("shin.R", (X, 6)),
            foot__R=t("foot.R", (X, -10)),
            bird=t("bird", (X, -20)),
            bird_at_loc=at("bird", BOW_UP * 0.02),
        )

    def step(front):
        """A quick, careful step. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.016)),
            spine=t("spine", (Z, -4), (X, 14)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 20)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 26)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "upperarm__R": t("upperarm.R", (X, -6 * front)),
                "cape": t("cape", (X, 12), (Y, 4 * front)),
                "bird": t("bird", (Y, 10 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.004)),
            spine=t("spine", (Z, -4), (X, 14)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -24)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, -2)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 14)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                "cape": t("cape", (X, 8)),
            },
        )

    # The attack: she shoulders the crossbow, puts her eye to the spyglass
    # and shoots. The bolt leaves at 20% of the attack (`FLIGHT_START` in
    # fx.ts), so the loaded bolt goes at frame 6 of 30, the crossbow jumps
    # and the bird hops up. A new bolt is in the groove at the end.
    def aiming(base, kick=0.0, bolt=1.0, hop=0.0):
        hand = Vector((-0.04, -0.12 + kick * 0.02, 0.47 + kick * 0.01))
        return pose(
            base,
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -12), (X, 12)),
            chest=t("chest", (Z, -10), (X, -kick * 5)),
            neck=t("neck", (Z, 16), (X, 8)),
            head=t("head", (Z, 22), (X, 12 - kick * 8), (Y, -14)),
            thigh__L=t("thigh.L", (X, -30), (Y, -6)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, -6)),
            thigh__R=t("thigh.R", (X, 12), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -40)),
            bird=t("bird", (X, -40 * hop), (Z, 30 * hop)),
            **{
                "bird_at_loc": at("bird", BOW_UP * 0.07 * hop),
                "forearm__R_slash_IK": 1.0,
                "crossbow_slash_Aim": 1.0,
                "ik_hand__R_at_pos": hand,
                "bow_aim_at_rot": aimed((0, -1, 0.03 + kick * 0.25)),
                "bolt_at_scale": bolt,
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, bird in ((0, 0, 0, 0), (12, 0.5, 1, 0.7), (24, 1, 0, 0.7), (36, 0.5, -1, -0.6), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, bird))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, aiming(stand())).key(5, aiming(stand()))
    attack.key(6, aiming(stand(), 0.3, 0.0, 0.3)).key(8, aiming(stand(), 1.0, 0.0, 1.0)).key(11, aiming(stand(), 0.5, 0.0, 1.0))
    attack.key(16, aiming(stand(), 0.0, 0.0, 0.3)).key(22, pose(stand(), bolt_at_scale=0.0)).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(22, fallen(stand(), 0, 0.6)).key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up,
    # and the bird comes back.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, pose(crouch(stand()), bird_at_loc=at("bird", BOW_UP * 0.12), bird_at_scale=0.6)).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.01, -0.08))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "spyglass-sniper.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
