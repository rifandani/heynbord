"""
River Knight (`human.riverKnight`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a young, nervous knight on a big,
bold white horse. The knight has light steel plate, a blue cloak, a steel
helmet with the visor up and a blue plume, wide eyes, the reins in the left
hand and a long blue and gold lance in the right hand. The happy horse has a
cream mane, a grin, a bridle with gold studs, a saddle and a blue cloth with
a gold trim and a gold shield on each side. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/river-knight.glb`;
then `bun unit-model:pack river-knight` packs it for the game.

A mount: the root carries the horse, and the seat bone of the knight is a
child of the horse body, so he moves with it. The lance is in the right
hand, on the camera side, and it aims with a Copy Rotation, so it stays level
when the horse bobs. He has Swift, so his walk is a gallop. His attack is the
Charge: the horse surges forward and the knight drives the lance. The horse
is brave and the knight is not: at rest the horse paws the ground and the
knight looks round. It falls on its left side (`(Y, +84)` on the root), so
the belly and the legs turn to the camera side. He has no Keyword that he
uses by his own action, so he has no cast clip.
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

COAT = hex_color("#f1ece2")
COAT_SHADE = hex_color("#cfc6b8")
MANE = hex_color("#ead9b0")
MANE_DARK = hex_color("#cdb784")
MUZZLE = hex_color("#d9cfc4")
HOOF = hex_color("#4a4440")
HORSE_EYE = hex_color("#2a1d16")
EYE_WHITE = hex_color("#fbf8f0")
MOUTH = hex_color("#7a2a2a")
TEETH = hex_color("#fbf6e6")
SKIN = hex_color("#e6b08c")
HAIR = hex_color("#6e4428")
STEEL = hex_color("#c3c8ce")
STEEL_DARK = hex_color("#868c94")
BLUE = hex_color("#2c4c9e")
BLUE_DARK = hex_color("#1d3470")
GOLD = hex_color("#e0ae45")
GOLD_DARK = hex_color("#a37a2a")
LEATHER = hex_color("#6e4428")
LEATHER_DARK = hex_color("#46291a")
WOOD = hex_color("#7a5432")

# --- Proportions: the horse ------------------------------------------------------

# A chunky miniature horse: a short barrel and short legs.
BACK = Vector((0, 0.2, 0.45))
MID = Vector((0, 0.0, 0.46))
CHEST = Vector((0, -0.17, 0.49))
NECK = Vector((0, -0.19, 0.55))
POLL = Vector((0, -0.29, 0.72))
NOSE = Vector((0, -0.45, 0.63))
HEAD_C = Vector((0, -0.34, 0.69))

LEGS = {
    # name: (top, joint, hoof, parent)
    "FL": (Vector((0.075, -0.16, 0.4)), Vector((0.08, -0.16, 0.2)), Vector((0.08, -0.16, 0.035)), "chest"),
    "FR": (Vector((-0.075, -0.16, 0.4)), Vector((-0.08, -0.16, 0.2)), Vector((-0.08, -0.16, 0.035)), "chest"),
    "BL": (Vector((0.075, 0.2, 0.4)), Vector((0.08, 0.24, 0.2)), Vector((0.08, 0.21, 0.035)), "body"),
    "BR": (Vector((-0.075, 0.2, 0.4)), Vector((-0.08, 0.24, 0.2)), Vector((-0.08, 0.21, 0.035)), "body"),
}

TAIL = [Vector((0, 0.3, 0.5)), Vector((0, 0.38, 0.38)), Vector((0, 0.4, 0.2))]

# --- Proportions: the knight -------------------------------------------------------

SEAT_Z = 0.6
WAIST_Z = 0.67
NECK_Z = 0.79
R_HEAD_C = Vector((0, -0.004, 0.85))
SL = Vector((0.078, 0.01, 0.775))
SR = Vector((-0.078, 0.01, 0.775))
# The right hand holds the lance at the hip, and the left hand holds the reins.
ER = Vector((-0.115, 0.06, 0.69))
WR = Vector((-0.1, -0.035, 0.64))
EL = Vector((0.11, 0.02, 0.685))
WL = Vector((0.05, -0.085, 0.655))
HAND_R = WR + (WR - ER).normalized() * 0.02
HAND_L = WL + (WL - EL).normalized() * 0.02
LANCE = Vector((0.04, -1, 0.14)).normalized()
LANCE_BACK = 0.16
LANCE_FRONT = 0.5
HIP_X = 0.05
KNEE = Vector((0.14, -0.06, 0.5))
FOOT = Vector((0.14, -0.02, 0.34))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("body", tuple(BACK), tuple(MID), "root"),
    ("chest", tuple(MID), tuple(CHEST), "body"),
    ("neck", tuple(NECK), tuple(POLL), "chest"),
    ("head", tuple(POLL), tuple(NOSE), "neck"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[2]), "body"),
]
for leg, (top, joint, hoof, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(top), tuple(joint), parent),
        (f"lower.{leg}", tuple(joint), tuple(hoof), f"upper.{leg}"),
    ]
BONES += [
    ("seat", (0, 0.01, SEAT_Z), (0, 0.01, WAIST_Z), "body"),
    ("torso", (0, 0.01, WAIST_Z), (0, 0.01, NECK_Z), "seat"),
    ("rhead", (0, 0.0, NECK_Z), (0, 0.0, 0.93), "torso"),
    ("cape", (0, 0.05, 0.77), (0, 0.13, 0.58), "torso"),
]
for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
    knee = Vector((KNEE.x * sign, KNEE.y, KNEE.z))
    foot = Vector((FOOT.x * sign, FOOT.y, FOOT.z))
    BONES += [
        (f"upperarm.{side}", tuple(s), tuple(e), "torso"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"thigh.{side}", (HIP_X * sign, 0.01, SEAT_Z), tuple(knee), "seat"),
        (f"shin.{side}", tuple(knee), tuple(foot), f"thigh.{side}"),
    ]
BONES += [
    ("lance", tuple(HAND_R), tuple(HAND_R + LANCE * 0.1), "forearm.R"),
]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the horse: the body at the back, the chest at the front."""
    t = clamp01((co.y + 0.02) / 0.12)
    return {"chest": 1 - t, "body": t}


def neck_weights(co):
    t = clamp01((co.z - 0.56) / 0.1)
    return {"neck": t, "chest": 1 - t}


def leg_weights(leg):
    top, _joint, _hoof, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.05)) / 0.07)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


def torso_weights(co):
    return blend("seat", "torso", co.z, 0.66, 0.71)


def cape_weights(co):
    return blend("cape", "torso", co.z, 0.7, 0.77)


def rein_weights(co):
    """The rein goes from the left hand to the bit, so it stretches between them."""
    t = clamp01((co.y - NOSE.y - 0.06) / (HAND_L.y - NOSE.y - 0.06))
    return {"head": 1 - t, "forearm.L": t}


# --- Parts: the horse ---------------------------------------------------------------


def shield(part, center, normal, size):
    """A gold heater shield with a blue sun: the badge on the horse cloth."""
    normal = Vector(normal).normalized()
    side = normal.cross(Z).normalized()
    c = Vector(center)
    top = kit.slab(part.bm, c + normal * 0.004 + Z * size * 0.2, side * size * 0.5, normal * 0.003, Z * size * 0.32)
    part.paint(faces_of(top), GOLD)
    point = kit.cone(part.bm, c + normal * 0.004 - Z * size * 0.1, c + normal * 0.004 - Z * size * 0.65, size * 0.5, 0.002, 4, squash=0.1)
    part.paint(faces_of(point), GOLD)
    disc = kit.cone(part.bm, c + normal * 0.006 + Z * size * 0.1, c + normal * 0.009 + Z * size * 0.1, size * 0.2, size * 0.2, 8)
    part.paint(faces_of(disc), BLUE_DARK)


def horse_parts():
    parts = []
    body = Part("body", COAT, body_weights, shade=0.2)
    kit.sphere(body.bm, (0, 0.02, 0.46), (0.13, 0.26, 0.125), 14, 10)
    kit.sphere(body.bm, (0, -0.14, 0.48), (0.12, 0.11, 0.13), 12, 8)
    kit.sphere(body.bm, (0, 0.19, 0.47), (0.125, 0.12, 0.12), 12, 8)
    parts.append(body)

    neck = Part("neck", COAT, neck_weights, shade=0.16)
    kit.tube(neck.bm, [NECK + Vector((0, 0.05, -0.04)), NECK + Vector((0, -0.02, 0.02)), (NECK + POLL) / 2 + Vector((0, 0.0, 0.0)), POLL + Vector((0, 0.02, -0.01))], [0.1, 0.09, 0.07, 0.055], 10)
    parts.append(neck)

    # A cream mane in tufts along the crest of the neck, and a forelock.
    mane = Part("mane", MANE, neck_weights, shade=0.12)
    for index in range(6):
        u = index / 5
        base = NECK.lerp(POLL, u) + Vector((0, 0.05 - 0.02 * u, 0.06 - 0.01 * u))
        tip = base + Vector((0.025 * (1 if index % 2 else -1), 0.07, -0.04))
        tuft = kit.cone(mane.bm, base, tip, 0.032, 0.006, 6, squash=0.6)
        mane.paint(faces_of(tuft), MANE_DARK if index % 2 else MANE)
    parts.append(mane)

    head = Part("head", COAT, "head", shade=0.14)
    kit.sphere(head.bm, HEAD_C, (0.058, 0.075, 0.068), 12, 8)
    muzzle = kit.cone(head.bm, HEAD_C + Vector((0, -0.04, -0.01)), NOSE + Vector((0, 0.01, -0.01)), 0.052, 0.046, 10)
    head.paint(faces_of(muzzle), COAT)
    tip = kit.sphere(head.bm, NOSE + Vector((0, 0.0, -0.012)), (0.048, 0.04, 0.042), 10, 6)
    head.paint(faces_of(tip), MUZZLE)
    for sign in (1, -1):
        ear = kit.cone(head.bm, HEAD_C + Vector((0.03 * sign, 0.04, 0.05)), HEAD_C + Vector((0.04 * sign, 0.05, 0.12)), 0.018, 0.003, 5, squash=0.6)
        head.paint(faces_of(ear), COAT_SHADE)
        nostril = kit.sphere(head.bm, NOSE + Vector((0.022 * sign, -0.036, 0.0)), (0.008, 0.006, 0.01), 5, 4)
        head.paint(faces_of(nostril), HOOF)
    parts.append(head)

    # Big happy eyes on the sides of the head.
    eyes = Part("horseEyes", EYE_WHITE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.05 * sign, -0.02, 0.022)), (0.012, 0.02, 0.02), 8, 6)
        pupil = kit.sphere(eyes.bm, HEAD_C + Vector((0.059 * sign, -0.026, 0.022)), (0.006, 0.012, 0.013), 6, 5)
        eyes.paint(faces_of(pupil), HORSE_EYE)
    parts.append(eyes)

    # The grin: an open mouth with a row of big teeth.
    mouth = Part("horseMouth", MOUTH, "head", shade=0)
    kit.slab(mouth.bm, NOSE + Vector((0, 0.02, -0.04)), (0.043, 0, 0), (0, 0.036, 0), (0, 0.004, 0.008))
    teeth = kit.slab(mouth.bm, NOSE + Vector((0, 0.012, -0.032)), (0.044, 0, 0), (0, 0.03, 0), (0, 0, 0.006))
    mouth.paint(faces_of(teeth), TEETH)
    parts.append(mouth)

    # The bridle: a nose band and a brow band, with gold studs, and a blue plume.
    bridle = Part("bridle", LEATHER, "head", shade=0.05)
    kit.torus(bridle.bm, NOSE + Vector((0, 0.05, 0.004)), (0, 1, 0.4), 0.05, 0.006, 12, 4)
    kit.torus(bridle.bm, HEAD_C + Vector((0, 0.02, 0.01)), (0, 0.4, -1), 0.062, 0.006, 12, 4)
    for sign in (1, -1):
        stud = kit.sphere(bridle.bm, NOSE + Vector((0.05 * sign, 0.05, 0.004)), (0.01, 0.01, 0.01), 6, 4)
        bridle.paint(faces_of(stud), GOLD)
    brow = kit.tube(bridle.bm, [HEAD_C + Vector((-0.05, -0.02, 0.05)), HEAD_C + Vector((0, -0.055, 0.06)), HEAD_C + Vector((0.05, -0.02, 0.05))], [0.007] * 3, 4)
    bridle.paint(faces_of(brow), BLUE)
    parts.append(bridle)

    # The horse cloth: blue, over the back and down both sides, with a gold trim.
    cloth = Part("cloth", BLUE, body_weights, shade=0.14)
    ys = [-0.2, -0.1, 0.0, 0.1, 0.2, 0.27]

    def profile(y, grow):
        width = 0.142 * (1 - 0.03 * abs(y - 0.03) / 0.24) + grow
        top = 0.598 + grow
        hem = 0.27 + 0.03 * abs(y - 0.03) / 0.24
        result = []
        for sign in (-1, 1):
            side = [
                (width * sign, y, hem),
                (width * sign, y, hem + 0.035),
                (width * sign, y, 0.44),
                (width * 0.82 * sign, y, 0.53 + grow * 0.5),
                (width * 0.42 * sign, y, top - 0.012),
            ]
            result += side if sign < 0 else list(reversed(side))
        mid = len(result) // 2
        result.insert(mid, (0, y, top))
        return result

    def color_of(face_side, row, column):
        if column in (0, 9) or row in (0, len(ys) - 2):
            return GOLD
        return BLUE

    edges = panel(cloth, [profile(y, 0.008) for y in ys], [profile(y, 0.0) for y in ys], color_of)
    cloth.paint(edges, GOLD_DARK)
    for sign in (1, -1):
        shield(cloth, (0.148 * sign, 0.04, 0.38), (sign, 0, 0), 0.09)
    parts.append(cloth)

    saddle = Part("saddle", LEATHER, "body", shade=0.06)
    kit.box(saddle.bm, (0, 0.02, 0.6), (0.12, 0.16, 0.025))
    pommel = kit.cone(saddle.bm, (0, -0.06, 0.6), (0, -0.075, 0.65), 0.04, 0.025, 8, squash=0.6)
    saddle.paint(faces_of(pommel), LEATHER_DARK)
    cantle = kit.cone(saddle.bm, (0, 0.1, 0.6), (0, 0.11, 0.655), 0.055, 0.045, 8, squash=0.5)
    saddle.paint(faces_of(cantle), LEATHER_DARK)
    for sign in (1, -1):
        trim = kit.box(saddle.bm, (0.06 * sign, 0.02, 0.6), (0.006, 0.16, 0.028))
        saddle.paint(faces_of(trim), GOLD)
    parts.append(saddle)

    tail = Part("tail", MANE, lambda co: blend("body", "tail", co.y, 0.29, 0.33), shade=0.1)
    kit.tube(tail.bm, [TAIL[0], TAIL[0].lerp(TAIL[1], 0.5) + Vector((0, 0.03, 0)), TAIL[1], TAIL[2] + Vector((0, 0.0, 0.04)), TAIL[2]], [0.03, 0.04, 0.045, 0.035, 0.008], 8)
    for f in tail.bm.faces:
        if int(f.calc_center_median().z * 40) % 2:
            tail.paint([f], MANE_DARK)
    parts.append(tail)

    for leg, (top, joint, hoof, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", COAT, leg_weights(leg), shade=0.18)
        kit.cone(upper.bm, top + Vector((0, 0, 0.05)), joint, 0.056, 0.034, 8)
        kit.sphere(upper.bm, joint, (0.032, 0.034, 0.03), 6, 5)
        parts.append(upper)

        lower = Part(f"lower.{leg}", COAT, f"lower.{leg}", shade=0.14)
        kit.cone(lower.bm, joint, hoof + Vector((0, 0, 0.05)), 0.028, 0.026, 8)
        # A cream tuft at the fetlock, and a dark hoof.
        tuft = kit.cone(lower.bm, hoof + Vector((0, 0, 0.08)), hoof + Vector((0, 0.01, 0.025)), 0.03, 0.04, 8)
        lower.paint(faces_of(tuft), MANE)
        shoe = kit.cone(lower.bm, hoof + Vector((0, -0.006, 0.03)), hoof + Vector((0, -0.006, -0.03)), 0.036, 0.04, 8)
        lower.paint(faces_of(shoe), HOOF)
        parts.append(lower)
    return parts


# --- Parts: the knight ---------------------------------------------------------------


def knight_parts():
    parts = []
    head = Part("rhead", SKIN, "rhead")
    kit.sphere(head.bm, R_HEAD_C, (0.05, 0.052, 0.058), 12, 8)
    kit.sphere(head.bm, R_HEAD_C + Vector((0, -0.05, -0.006)), (0.009, 0.008, 0.01), 5, 4)
    parts.append(head)

    # Wide, nervous eyes, high brows and a small round open mouth.
    face = Part("rface", EYE_WHITE, "rhead", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, R_HEAD_C + Vector((0.02 * sign, -0.044, 0.008)), (0.013, 0.008, 0.014), 8, 6)
        pupil = kit.sphere(face.bm, R_HEAD_C + Vector((0.02 * sign, -0.051, 0.008)), (0.006, 0.004, 0.006), 6, 4)
        face.paint(faces_of(pupil), HORSE_EYE)
        brow = kit.slab(face.bm, R_HEAD_C + Vector((0.021 * sign, -0.05, 0.03)), (0.012, 0, -0.004 * sign), (0, 0.003, 0), (0, 0, 0.003))
        face.paint(faces_of(brow), HAIR)
    mouth = kit.sphere(face.bm, R_HEAD_C + Vector((0, -0.048, -0.028)), (0.009, 0.005, 0.009), 6, 4)
    face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    # The steel helmet with the visor up, a brown fringe under it and a blue plume.
    helmet = Part("helmet", STEEL, "rhead", shade=0.12)
    verts = kit.sphere(helmet.bm, R_HEAD_C + Vector((0, 0.006, 0.01)), (0.058, 0.06, 0.064), 12, 8)
    kit.bmesh.ops.delete(helmet.bm, geom=[v for v in verts if v.co.y < -0.02 and v.co.z < R_HEAD_C.z + 0.036], context="VERTS")
    visor = kit.slab(helmet.bm, R_HEAD_C + Vector((0, -0.05, 0.06)), (0.05, 0, 0), (0, 0.008, 0.008), (0, -0.014, 0.012))
    helmet.paint(faces_of(visor), STEEL_DARK)
    for sign in (1, -1):
        pivot = kit.sphere(helmet.bm, R_HEAD_C + Vector((0.058 * sign, 0.0, 0.02)), (0.008, 0.01, 0.01), 5, 4)
        helmet.paint(faces_of(pivot), GOLD)
    crest = kit.box(helmet.bm, R_HEAD_C + Vector((0, 0.01, 0.07)), (0.012, 0.08, 0.012))
    helmet.paint(faces_of(crest), GOLD)
    plume = kit.tube(helmet.bm, [R_HEAD_C + Vector((0, 0.02, 0.07)), R_HEAD_C + Vector((0, 0.06, 0.11)), R_HEAD_C + Vector((0, 0.12, 0.1)), R_HEAD_C + Vector((0, 0.17, 0.06))], [0.016, 0.022, 0.016, 0.003], 6)
    helmet.paint(faces_of(plume), BLUE)
    fringe = kit.cone(helmet.bm, R_HEAD_C + Vector((-0.035, -0.045, 0.04)), R_HEAD_C + Vector((0.035, -0.045, 0.036)), 0.012, 0.008, 6, squash=0.5)
    helmet.paint(faces_of(fringe), HAIR)
    gorget = kit.cone(helmet.bm, (0, 0, NECK_Z - 0.02), (0, 0, R_HEAD_C.z - 0.03), 0.042, 0.036, 10)
    helmet.paint(faces_of(gorget), STEEL_DARK)
    parts.append(helmet)

    torso = Part("rtorso", STEEL, torso_weights, shade=0.14)
    kit.cone(torso.bm, (0, 0.01, SEAT_Z + 0.03), (0, 0.01, NECK_Z - 0.01), 0.055, 0.068, 10, squash=0.8)
    ridge = kit.box(torso.bm, (0, -0.045, 0.73), (0.008, 0.01, 0.08))
    torso.paint(faces_of(ridge), GOLD)
    parts.append(torso)

    # A blue tabard skirt over the saddle.
    tabard = Part("rtabard", BLUE, "seat", shade=0.1)

    def tabard_color(row, column):
        return GOLD if row == 2 else BLUE

    kit.ragged_cone(tabard, WAIST_Z, SEAT_Z - 0.04, 0.06, 0.085, 12, 3, 0.85, 0.0, tabard_color, BLUE_DARK)
    belt = kit.torus(tabard.bm, (0, 0.01, WAIST_Z - 0.004), (0, 0, 1), 0.058, 0.007, 12, 4)
    tabard.paint(faces_of(belt), LEATHER)
    parts.append(tabard)

    def cape_color(row, column):
        return GOLD if row == 4 else (BLUE_DARK if column % 3 == 1 else BLUE)

    cape = Part("rcape", BLUE, cape_weights)
    kit.ragged_cone(cape, 0.78, 0.6, 0.07, 0.11, 10, 5, 0.8, 0.02, cape_color, BLUE_DARK, gap=math.radians(110), y_push=0.07)
    parts.append(cape)

    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(pauldron.bm, s + Vector((0.008 * sign, 0, 0.008)), (0.038, 0.036, 0.028), 10, 7)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.008 for f in v.link_faces}, GOLD)
        kit.cone(pauldron.bm, s, e, 0.021, 0.018, 8)
        parts.append(pauldron)

        forearm = Part(f"rforearm.{side}", STEEL, f"forearm.{side}", shade=0.08)
        kit.cone(forearm.bm, e, w - d * 0.01, 0.019, 0.017, 8)
        cop = kit.sphere(forearm.bm, e, (0.02, 0.02, 0.02), 6, 5)
        forearm.paint(faces_of(cop), STEEL_DARK)
        glove = kit.sphere(forearm.bm, w + d * 0.018, (0.017, 0.016, 0.02), 8, 6)
        forearm.paint(faces_of(glove), LEATHER)
        parts.append(forearm)

        hip = Vector((HIP_X * sign, 0.01, SEAT_Z))
        knee = Vector((KNEE.x * sign, KNEE.y, KNEE.z))
        foot = Vector((FOOT.x * sign, FOOT.y, FOOT.z))
        thigh = Part(f"rthigh.{side}", STEEL, f"thigh.{side}", shade=0.1)
        kit.cone(thigh.bm, hip, knee, 0.03, 0.024, 8)
        cop = kit.sphere(thigh.bm, knee + Vector((0, -0.012, 0.004)), (0.024, 0.022, 0.024), 6, 5)
        thigh.paint(faces_of(cop), STEEL_DARK)
        parts.append(thigh)

        shin = Part(f"rshin.{side}", STEEL, f"shin.{side}", shade=0.1)
        kit.cone(shin.bm, knee, foot + Vector((0, 0, 0.02)), 0.022, 0.02, 8)
        boot = kit.box(shin.bm, foot + Vector((0, -0.025, 0.0)), (0.034, 0.075, 0.034))
        shin.paint(faces_of(boot), LEATHER)
        stirrup = kit.torus(shin.bm, foot + Vector((0, -0.02, -0.012)), (0, 1, 0), 0.024, 0.004, 8, 3)
        shin.paint(faces_of(stirrup), GOLD_DARK)
        parts.append(shin)

    # The rein, from the left hand to the bit, over the neck.
    rein = Part("rein", LEATHER_DARK, rein_weights, shade=0.0)
    kit.tube(rein.bm, [HAND_L, HAND_L + Vector((-0.02, -0.08, 0.0)), Vector((-0.045, -0.3, 0.66)), NOSE + Vector((-0.05, 0.05, 0.004))], [0.005] * 4, 4)
    parts.append(rein)

    # The lance: blue and gold stripes, a steel guard over the hand and a steel point.
    lance = Part("lance", GOLD, "lance", shade=0.04)
    butt = HAND_R - LANCE * LANCE_BACK
    tip = HAND_R + LANCE * LANCE_FRONT
    kit.cone(lance.bm, butt, HAND_R + LANCE * 0.04, 0.012, 0.014, 8)
    stripes = 8
    for index in range(stripes):
        a = HAND_R + LANCE * lerp(0.06, LANCE_FRONT, index / stripes)
        b = HAND_R + LANCE * lerp(0.06, LANCE_FRONT, (index + 1) / stripes)
        r = lerp(0.018, 0.008, index / stripes)
        piece = kit.cone(lance.bm, a, b, r, lerp(0.018, 0.008, (index + 1) / stripes), 8)
        lance.paint(faces_of(piece), BLUE if index % 2 else GOLD)
    guard = kit.cone(lance.bm, HAND_R + LANCE * 0.02, HAND_R + LANCE * 0.09, 0.016, 0.042, 10)
    lance.paint(faces_of(guard), STEEL)
    point = kit.cone(lance.bm, tip - LANCE * 0.01, tip + LANCE * 0.09, 0.014, 0.001, 6)
    lance.paint(faces_of(point), STEEL)
    pennon = kit.slab(lance.bm, tip - LANCE * 0.05 + Z * 0.02, LANCE * 0.035, X * 0.003, Z * 0.018)
    lance.paint(faces_of(pennon), BLUE)
    parts.append(lance)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("RiverKnight", BONES)
    parts = horse_parts() + knight_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "RiverKnightMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """The lance aims with `Aim`, so it stays level when the horse bobs."""
    empties = {"lance_aim": kit.add_empty("lance_aim")}
    aim = rig.pose.bones["lance"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["lance_aim"]
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

    lance_rest = rig.data.bones["lance"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the lance that points it along `direction`."""
        return LANCE.rotation_difference(Vector(direction).normalized()) @ lance_rest

    def legs(**angles):
        """Leg swings: `FL=(upper, lower)` in degrees about X. A negative upper swings forward."""
        result = {}
        for leg, (upper, lower) in angles.items():
            result[f"upper__{leg}"] = t(f"upper.{leg}", (X, upper))
            result[f"lower__{leg}"] = t(f"lower.{leg}", (X, lower))
        return result

    def stand(breath=0.0, look=0.0, paw=0.0):
        """
        At rest: the horse lifts its head, happy, and paws the ground with its
        right front hoof (`paw`). The knight sits stiff and looks round
        (`look`), the lance level.
        """
        return pose(
            {
                "body@loc": at("body", (0, 0, -breath * 0.004)),
                "body": t("body", (Z, -8), (X, -breath)),
                "chest": t("chest", (X, -breath)),
                "neck": t("neck", (X, -6 + breath * 3), (Z, 6)),
                "head": t("head", (X, 4 - breath * 4), (Z, 8)),
                "tail": t("tail", (Z, 12 * look), (X, -6)),
                "seat": t("seat", (Z, 8), (X, -4)),
                "torso": t("torso", (X, -4 - breath * 2), (Z, -look * 6)),
                "rhead": t("rhead", (Z, -look * 40), (X, -look * 6)),
                "cape": t("cape", (X, 4 + breath * 3)),
                "upperarm.L": t("upperarm.L", (X, -breath * 2)),
                "thigh.L": t("thigh.L", (X, 4)),
                "thigh.R": t("thigh.R", (X, 4)),
                "lance/Aim": 1.0,
                "lance_aim@rot": aimed((0.03, -1, 0.16 + breath * 0.02 + look * 0.03)),
            },
            **legs(FR=(-30 * paw, 70 * paw), FL=(0, 0), BL=(0, 0), BR=(0, 0)),
        )

    def nervous(breath=0.0):
        """Low HP: the horse hangs its head, and the knight hunches low on its neck."""
        return pose(
            stand(),
            body=t("body", (Z, -8), (X, 4)),
            body_at_loc=at("body", (0, 0, -0.02)),
            neck=t("neck", (X, 30 + breath * 4), (Z, 4)),
            head=t("head", (X, 16 + breath * 4)),
            tail=t("tail", (X, 10)),
            seat=t("seat", (Z, 8), (X, 10)),
            torso=t("torso", (X, 24 + breath * 4)),
            rhead=t("rhead", (X, -14), (Y, -10)),
            cape=t("cape", (X, -20)),
            upperarm__L=t("upperarm.L", (X, -20)),
            lance_aim_at_rot=aimed((0.08, -1, -0.25)),
            **legs(FL=(-6, 8), FR=(-4, 6), BL=(8, -4), BR=(6, -4)),
        )

    def recoil(base, amount=1.0):
        """The hit: the horse shies back, and the knight leans back with a start."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0.03 * amount, 0.0)),
            body=t("body", (Z, -8), (X, -6 * amount)),
            neck=t("neck", (X, -20 * amount), (Z, 10 * amount)),
            head=t("head", (X, -10 * amount)),
            tail=t("tail", (X, -30 * amount)),
            torso=t("torso", (X, -16 * amount), (Z, 8 * amount)),
            rhead=t("rhead", (X, -20 * amount)),
            cape=t("cape", (X, 20 * amount)),
            lance_aim_at_rot=aimed((0.03, -1, 0.16 + 0.5 * amount)),
            **legs(FL=(-20 * amount, 30 * amount), FR=(-30 * amount, 50 * amount), BL=(-10 * amount, 6 * amount), BR=(-10 * amount, 6 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.02, -0.06)),
            body=t("body", (Z, -8), (X, 8), (Y, -8)),
            neck=t("neck", (X, 30)),
            head=t("head", (X, 20)),
            torso=t("torso", (X, 20), (Y, 10)),
            rhead=t("rhead", (X, 16)),
            lance_aim_at_rot=aimed((0.2, -1, -0.4)),
            **legs(FL=(-10, 50), FR=(10, 60), BL=(-20, 40), BR=(-10, 30)),
        )

    def fallen(base, bounce=0.0):
        """On its left side, the legs out to the camera side, the knight beside it with the lance flat."""
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.4, 0, 0.13)),
            body_at_loc=at("body", (0, 0, 0)),
            body=t("body", (Z, -4)),
            neck=t("neck", (X, 10), (Y, 20)),
            head=t("head", (X, -6), (Y, 10)),
            tail=t("tail", (X, -20), (Y, 20)),
            seat=t("seat", (Z, 0), (Y, -30)),
            torso=t("torso", (X, -20)),
            rhead=t("rhead", (Z, -30)),
            cape=t("cape", (X, -30)),
            upperarm__L=t("upperarm.L", (Y, -40)),
            upperarm__R=t("upperarm.R", (Y, 50)),
            thigh__L=t("thigh.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -40), (Y, 30)),
            lance_aim_at_rot=aimed((0.2, -1, -0.02)),
            **legs(FL=(-40, 20), FR=(-20, 10), BL=(30, 10), BR=(10, 6)),
        )

    def rear(base, height=1.0):
        """The horse rears up on its back legs, and the knight hangs on: a summon and a Rebirth."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0.02 * height, 0.0)),
            body=t("body", (Z, -8), (X, -34 * height)),
            neck=t("neck", (X, 10 * height)),
            head=t("head", (X, 10 * height)),
            tail=t("tail", (X, 40 * height)),
            seat=t("seat", (Z, 8), (X, 20 * height)),
            torso=t("torso", (X, 10 * height)),
            rhead=t("rhead", (X, -10 * height)),
            cape=t("cape", (X, 30 * height)),
            upperarm__R=t("upperarm.R", (X, -50 * height)),
            lance_aim_at_rot=aimed((0.03, -0.6, 1)),
            **legs(FL=(-60 * height, 100 * height), FR=(-40 * height, 80 * height), BL=(34 * height, -10 * height), BR=(30 * height, -6 * height)),
        )

    def low(base):
        """Down low with the legs folded, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0, -0.16)),
            neck=t("neck", (X, 20)),
            head=t("head", (X, 10)),
            tail=t("tail", (X, 20)),
            torso=t("torso", (X, 10)),
            rhead=t("rhead", (X, 10), (Z, -20)),
            **legs(FL=(-70, 130), FR=(-70, 130), BL=(-80, 120), BR=(-80, 120)),
        )

    def gallop(phase):
        """
        A gallop pose for Swift. `phase` 0 has the legs stretched out, 0.5 has
        them gathered under the body; the knight bounces and leans back.
        """
        a = phase * 2 * math.pi
        reach = math.cos(a)
        lift = math.sin(a)
        return pose(
            stand(),
            body_at_loc=at("body", (0, 0, 0.02 + 0.03 * max(0.0, -reach))),
            body=t("body", (Z, -8), (X, 6 * lift)),
            neck=t("neck", (X, 10 - 12 * lift)),
            head=t("head", (X, 4 * lift)),
            tail=t("tail", (X, -40 + 8 * lift)),
            seat=t("seat", (Z, 8), (X, -6)),
            seat_at_loc=at("seat", (0, 0, 0.02 * max(0.0, reach))),
            torso=t("torso", (X, -14 + 6 * lift)),
            rhead=t("rhead", (X, -10 - 6 * lift), (Z, -10)),
            cape=t("cape", (X, 50 + 10 * lift)),
            lance_aim_at_rot=aimed((0.03, -1, 0.14 + 0.06 * lift)),
            **legs(
                FL=(-40 * reach + 6, 50 + 40 * max(0.0, -reach)),
                FR=(-34 * reach + 14, 40 + 50 * max(0.0, -lift)),
                BL=(34 * reach - 6, 20 + 30 * max(0.0, -reach)),
                BR=(30 * reach - 14, 20 + 30 * max(0.0, lift)),
            ),
        )

    # The attack is the Charge: the horse gathers, then surges forward, and
    # the knight drives the lance. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the lance strikes at frame 15 of 30.
    def gather(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.05, -0.03)),
            body=t("body", (Z, -8), (X, -10)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, 6)),
            tail=t("tail", (X, -20)),
            torso=t("torso", (X, -18)),
            rhead=t("rhead", (X, -10), (Z, 10)),
            upperarm__R=t("upperarm.R", (X, 20)),
            cape=t("cape", (X, 10)),
            lance_aim_at_rot=aimed((0.03, -1, 0.3)),
            **legs(FL=(-20, 40), FR=(-50, 90), BL=(-24, 30), BR=(-20, 24)),
        )

    def surge(base):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.12, 0)),
            body_at_loc=at("body", (0, 0, 0.03)),
            body=t("body", (Z, -4), (X, 6)),
            neck=t("neck", (X, 20)),
            head=t("head", (X, -6)),
            tail=t("tail", (X, -50)),
            torso=t("torso", (X, -6)),
            rhead=t("rhead", (X, -14)),
            upperarm__R=t("upperarm.R", (X, -40)),
            forearm__R=t("forearm.R", (X, -10)),
            cape=t("cape", (X, 60)),
            lance_aim_at_rot=aimed((0.0, -1, 0.02)),
            **legs(FL=(-50, 20), FR=(-40, 30), BL=(40, 10), BR=(30, 20)),
        )

    clips = []
    idle = Clip("idle", 72, loop=True)
    for frame, breath, look, paw in (
        (0, 0, 0, 0),
        (12, 0.5, 0, 0),
        (18, 0.7, 1, 0),
        (28, 1, 1, 0),
        (34, 0.8, -0.6, 1),
        (40, 0.6, -0.6, 0),
        (46, 0.4, -0.6, 1),
        (54, 0.3, 0, 0),
        (72, 0, 0, 0),
    ):
        idle.key(frame, stand(breath, look, paw))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, nervous(breath))
    clips.append(low_hp)

    # A gallop (Swift): a short, fast cycle.
    walk = Clip("walk", 16, loop=True)
    for frame in (0, 4, 8, 12, 16):
        walk.key(frame, gallop(frame / 16))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, gather(stand())).key(15, surge(stand())).key(20, surge(stand()))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(13, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(31, low(stand())).key(40, rear(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, pose(low(stand()), body_at_loc=at("body", (0, 0, -0.18))))
    summon.key(16, rear(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "river-knight.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
