"""
Dewkeeper (`elf.dewkeeper`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a serene elf woman healer with
long, wavy golden hair and a circlet of leaves, a green robe with amber
trim over a cream dress, wide green sleeves with cream linings, a shawl of
leaves, a leather belt with a row of small bottles (one of them, at the
end, leans away from the others), a tall, twisted reed staff with a curled
top and leaves, and a crystal bowl of glowing dew. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/dewkeeper.glb`; then
`bun unit-model:pack dewkeeper` packs it for the game.

The staff is in the right hand, on the camera side, and the bowl is in the
left hand. The staff and the bowl aim with a Copy Rotation, so the staff
stays upright and the bowl stays level when the arm moves. She attacks at
Mid Range: she thrusts the bowl forward, and the dew in it flares (the glow
bone scales) when the Holy light leaves, at 20% of the attack. Her cast
(Regenerate) lifts the bowl high, and drops of dew fall and turn round her
(the dew bone scales up and turns).
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

SKIN = hex_color("#ecbc98")
HAIR = hex_color("#cf9a52")
HAIR_LIGHT = hex_color("#e8c27c")
HAIR_DARK = hex_color("#a0703a")
EYES = hex_color("#2a3020")
BROW = hex_color("#9a6c38")
MOUTH = hex_color("#b8645a")
ROBE = hex_color("#557f38")
ROBE_DARK = hex_color("#3c5e2a")
LEAF = hex_color("#76a044")
LEAF_LIGHT = hex_color("#a2c25e")
CREAM = hex_color("#efe3c4")
CREAM_SHADE = hex_color("#d6c8a4")
AMBER = hex_color("#d99a3a")
AMBER_DARK = hex_color("#a66a24")
LEATHER = hex_color("#7a4e2c")
LEATHER_DARK = hex_color("#4a2e1a")
REED = hex_color("#6b4a2c")
REED_DARK = hex_color("#47301c")
CRYSTAL = hex_color("#cdeef2")
CRYSTAL_DARK = hex_color("#8fc8d4")
DEW = hex_color("#e9fff4")
DROP = hex_color("#a6e6ff")
POTION = hex_color("#d8b04a")
POTION_GREEN = hex_color("#9cc85a")

# --- Proportions ---------------------------------------------------------------

# A slender, tall elf woman.
HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.872))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.05

# The right forearm points forward and holds the staff upright. The left
# forearm points forward too, and holds the bowl in front of her. These are
# the rest (bind) positions.
SR = Vector((-0.105, 0, SHOULDER_Z))
ER = Vector((-0.15, 0.03, 0.59))
WR = Vector((-0.148, -0.1, 0.58))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.026
SL = Vector((0.105, 0, SHOULDER_Z))
EL = Vector((0.15, 0.03, 0.59))
WL = Vector((0.12, -0.1, 0.6))
DL = (WL - EL).normalized()
TL = WL + DL * 0.05
BOWL = WL + DL * 0.03 + Z * 0.03

STAFF_BOTTOM = 0.02
STAFF_TOP = 1.0
CURL = Vector((HAND_R.x, HAND_R.y, STAFF_TOP))

DEW_RING = Vector((0, 0, 0.3))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    # The long hair down her back.
    ("hair", (0, 0.07, 0.86), (0, 0.1, 0.66), "head"),
    ("robe.B", (0, 0.09, 0.47), (0, 0.13, 0.08), "hips"),
    # The drops of dew that turn round her in her cast: scale 0 hides them.
    ("dew", tuple(DEW_RING), tuple(DEW_RING + Vector((0, 0, 0.1))), "root"),
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
    ("staff", tuple(HAND_R), tuple(HAND_R + Z * 0.1), "hand.R"),
    ("bowl", tuple(BOWL), tuple(BOWL + Z * 0.06), "hand.L"),
    # The Holy light of the dew in the bowl: scale 0 hides it.
    ("glow", tuple(BOWL + Z * 0.03), tuple(BOWL + Z * 0.08), "bowl"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def hair_weights(co):
    back = clamp01((co.y - 0.035) / 0.04) * clamp01((0.84 - co.z) / 0.06)
    return {"head": 1 - back, "hair": back}


def robe_weights(co):
    """The long robe follows the hips at the top, and the legs and its back lower."""
    t = clamp01((0.5 - co.z) / 0.4)
    back = clamp01((co.y - 0.02) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t * 0.8,
        "robe.B": back * t * 0.8,
        "thigh.L": (1 - back) * t * clamp01(side + 0.2) * 0.6,
        "thigh.R": (1 - back) * t * clamp01(-side + 0.2) * 0.6,
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
    kit.sphere(head.bm, HEAD_C, (0.06, 0.066, 0.078), 14, 10)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.06, -0.004)), HEAD_C + Vector((0, -0.074, -0.014)), 0.01, 0.002, 5)
    for sign in (1, -1):
        # Elf ears: long points that go up and back, out through the hair.
        kit.cone(head.bm, HEAD_C + Vector((0.055 * sign, 0.006, -0.002)), HEAD_C + Vector((0.12 * sign, 0.04, 0.046)), 0.015, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        # Serene eyes, a little closed.
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.056, 0.004)), (0.011, 0.006, 0.006), 8, 6)
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.059, 0.024)), (0.015, 0, -0.002 * sign), (0, 0.005, 0), (0, 0, 0.0035))
        face.paint(faces_of(brow), BROW)
    smile = kit.slab(face.bm, HEAD_C + Vector((0, -0.062, -0.034)), (0.012, 0, 0), (0, 0.004, 0), (0, 0, 0.003))
    face.paint(faces_of(smile), MOUTH)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.024, 0.022, 8)
    parts.append(neck)

    # Long, wavy golden hair from a middle part, down her back to the waist.
    hair = Part("hair", HAIR, hair_weights, shade=0.12)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.068, 0.075, 0.082), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.035 or (v.co.y < HEAD_C.y - 0.035 and v.co.z < HEAD_C.z + 0.045)]
    kit.bmesh.ops.delete(hair.bm, geom=face_verts, context="VERTS")
    for index, angle in enumerate(range(-120, 121, 20)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.064 * math.sin(a), 0.066 * math.cos(a) + 0.01, 0.02))
        length = 0.28 if abs(angle) < 70 else 0.2
        bottom = top + Vector((0.035 * math.sin(a), 0.03 + 0.02 * math.cos(a), -length))
        wave = Vector((0.02 * math.sin(a), 0.02 * math.cos(a), 0.0))
        lock = kit.tube(hair.bm, [top, top.lerp(bottom, 0.33) + wave, top.lerp(bottom, 0.66) - wave * 0.5, bottom], [0.022, 0.021, 0.016, 0.004], 5)
        hair.paint(faces_of(lock), (HAIR_LIGHT, HAIR, HAIR_DARK)[index % 3])
    # Two locks in front of the shoulders.
    for sign in (1, -1):
        top = HEAD_C + Vector((0.054 * sign, -0.03, 0.02))
        lock = kit.tube(hair.bm, [top, top + Vector((0.018 * sign, 0.0, -0.08)), top + Vector((0.012 * sign, 0.006, -0.17))], [0.016, 0.014, 0.003], 5)
        hair.paint(faces_of(lock), HAIR_LIGHT)
    # The circlet of leaves round her brow.
    ring = kit.torus(hair.bm, HEAD_C + Vector((0, 0.004, 0.03)), (0, 0.15, 1), 0.071, 0.004, 16, 3)
    hair.paint(faces_of(ring), AMBER_DARK)
    for index in range(10):
        a = math.radians(-110 + index * 24)
        base = HEAD_C + Vector((0.072 * math.sin(a), -0.072 * math.cos(a) + 0.004, 0.03 + 0.008 * math.cos(a)))
        out = Vector((math.sin(a), -math.cos(a), 0.9))
        leaf(hair, base, out, 0.04, 0.014, (LEAF, LEAF_LIGHT)[index % 2])
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    # The cream dress over the body, and the green robe over it, open at the front.
    body = Part("body", CREAM, torso_weights, shade=0.12)
    kit.cone(body.bm, (0, 0, 0.48), (0, 0, 0.735), 0.072, 0.08, 12, squash=0.78)
    parts.append(body)

    def bodice_color(row, column):
        return AMBER if column in (0, 13) else ROBE

    bodice = Part("bodice", ROBE, torso_weights, shade=0.1)
    kit.ragged_cone(bodice, 0.745, 0.5, 0.086, 0.08, 14, 3, 0.8, 0.0, bodice_color, CREAM, gap=math.radians(26))
    parts.append(bodice)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.52), 0.086, 0.085, 12, squash=0.8)
    buckle = kit.sphere(belt.bm, (0, -0.07, 0.505), (0.016, 0.008, 0.016), 8, 5)
    belt.paint(faces_of(buckle), AMBER)
    # A row of small bottles on the belt at her right hip, in a neat order.
    # The last one leans away from the others: the one that she ignores.
    for index, (x, y) in enumerate(((-0.05, -0.06), (-0.07, -0.042), (-0.084, -0.018), (-0.09, 0.008))):
        lean = Vector((0, 0, 1)) if index < 3 else Vector((-0.5, 0.2, 1)).normalized()
        base = Vector((x - 0.012, y - 0.008, 0.45))
        color = (POTION, POTION_GREEN, CRYSTAL_DARK, LEATHER)[index]
        bottle = kit.cone(belt.bm, base, base + lean * 0.045, 0.012, 0.011, 6)
        belt.paint(faces_of(bottle), color)
        neck = kit.cone(belt.bm, base + lean * 0.045, base + lean * 0.062, 0.005, 0.005, 5)
        belt.paint(faces_of(neck), CREAM_SHADE)
        cork = kit.cone(belt.bm, base + lean * 0.062, base + lean * 0.072, 0.006, 0.006, 5)
        belt.paint(faces_of(cork), LEATHER_DARK)
    parts.append(belt)

    def dress_color(row, column):
        return CREAM if column % 4 else CREAM_SHADE

    # The cream dress to the ground, at the front.
    dress = Part("dress", CREAM, robe_weights, shade=0.12)
    kit.ragged_cone(dress, 0.5, 0.04, 0.078, 0.13, 14, 6, 0.82, 0.004, dress_color, CREAM_SHADE)
    parts.append(dress)

    def robe_color(row, column):
        if row == 6 or column in (0, 15):
            return AMBER
        if row == 5 and column % 3 == 1:
            return AMBER_DARK
        return ROBE_DARK if column % 5 == 2 else ROBE

    # The green robe, open at the front, to the ground, with a ragged leaf hem.
    robe = Part("robe", ROBE, robe_weights, shade=0.14)
    kit.ragged_cone(robe, 0.51, 0.05, 0.09, 0.17, 16, 7, 0.86, 0.04, robe_color, CREAM, gap=math.radians(30), y_push=0.035)
    parts.append(robe)

    # A shawl of leaves over the shoulders, and its clasp.
    shawl = Part("shawl", LEAF, "chest", shade=0.06)
    kit.cone(shawl.bm, (0, 0.004, 0.7), (0, 0.004, 0.755), 0.09, 0.058, 12, caps=False, squash=0.82)
    for index in range(13):
        angle = math.radians(-150 + index * 25)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0, 0.74)) + out * 0.072
        leaf(shawl, base, out * 0.9 + Vector((0, 0, -0.8)), 0.1, 0.032, (LEAF_LIGHT, LEAF, ROBE_DARK)[index % 3])
    clasp = kit.sphere(shawl.bm, (0, -0.064, 0.73), (0.014, 0.01, 0.014), 8, 5)
    shawl.paint(faces_of(clasp), CRYSTAL)
    parts.append(shawl)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", ROBE, f"upperarm.{side}", shade=0.08)
        kit.sphere(sleeve.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.032, 0.032, 0.03), 8, 6)
        kit.cone(sleeve.bm, s, e, 0.028, 0.027, 8)
        parts.append(sleeve)

        # A wide bell sleeve, cream inside, with an amber rim.
        bell = Part(f"bell.{side}", ROBE, f"forearm.{side}", shade=0.1)
        kit.cone(bell.bm, e - d * 0.01, w - d * 0.006, 0.028, 0.05, 8)
        lining = kit.cone(bell.bm, w - d * 0.012, w - d * 0.004, 0.044, 0.046, 8, caps=False)
        bell.paint(faces_of(lining), CREAM)
        rim = kit.torus(bell.bm, w - d * 0.004, d, 0.05, 0.004, 10, 3)
        bell.paint(faces_of(rim), AMBER)
        # The bell hangs down from the forearm.
        drape = kit.cone(bell.bm, (e + w) / 2 + Vector((0, 0.0, -0.01)), (e + w) / 2 + Vector((0, 0.03, -0.11)), 0.034, 0.008, 6, squash=0.5)
        bell.paint(faces_of(drape), ROBE_DARK)
        parts.append(bell)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.016, 0.015, 0.022), 8, 6)
        parts.append(hand)

        # Legs under the robe, and boots that show at the hem.
        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        leg = Part(f"leg.{side}", CREAM_SHADE, f"thigh.{side}")
        kit.cone(leg.bm, hip, knee, 0.04, 0.032, 8)
        parts.append(leg)
        boot = Part(f"boot.{side}", LEATHER, f"shin.{side}")
        kit.cone(boot.bm, knee, ankle, 0.032, 0.029, 8)
        parts.append(boot)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.024), (0.05, 0.1, 0.046))
        sole = kit.box(foot.bm, (LEG_X * sign, -0.03, 0.006), (0.052, 0.102, 0.012))
        foot.paint(faces_of(sole), LEATHER_DARK)
        parts.append(foot)
    return parts


def staff_parts():
    staff = Part("staff", REED, "staff", shade=0.04)
    x, y = HAND_R.x, HAND_R.y
    # A twisted reed staff: the shaft wanders a little from side to side.
    points = [Vector((x + 0.008 * math.sin(i * 1.7), y + 0.006 * math.cos(i * 1.3), lerp(STAFF_BOTTOM, STAFF_TOP - 0.06, i / 8))) for i in range(9)]
    kit.tube(staff.bm, points, [0.011, 0.01, 0.011, 0.01, 0.011, 0.01, 0.011, 0.01, 0.01], 6)
    # A second, thin stem winds round the shaft.
    twist = [Vector((x + 0.014 * math.cos(i * 1.1), y + 0.014 * math.sin(i * 1.1), lerp(0.2, STAFF_TOP - 0.05, i / 14))) for i in range(15)]
    stem = kit.tube(staff.bm, twist, [0.0045] * 15, 4)
    staff.paint(faces_of(stem), REED_DARK)
    # The curled top: a hook that turns back over itself, in the plane of the camera side.
    curl = [Vector((x, y, STAFF_TOP - 0.07))]
    for index in range(1, 9):
        a = math.radians(index * 38)
        curl.append(CURL + Vector((0, -0.045 * math.sin(a), 0.045 * (1 - math.cos(a)) - 0.02)))
    hook = kit.tube(staff.bm, curl, [0.011, 0.011, 0.01, 0.009, 0.008, 0.007, 0.006, 0.005, 0.002], 6)
    staff.paint(faces_of(hook), REED)
    # Leaves at the top, and a dew drop that hangs in the curl.
    for index, (dx, dz, color) in enumerate(((1, 0.0, LEAF), (-1, -0.03, LEAF_LIGHT), (1, -0.06, ROBE_DARK), (-1, -0.1, LEAF))):
        leaf(staff, Vector((x, y, STAFF_TOP - 0.06 + dz)), Vector((0.8 * dx, 0.3, 0.5)), 0.05, 0.016, color)
    drop = kit.sphere(staff.bm, CURL + Vector((0, -0.022, 0.012)), (0.01, 0.01, 0.013), 8, 6)
    staff.paint(faces_of(drop), DROP)
    foot = kit.cone(staff.bm, (x, y, STAFF_BOTTOM - 0.004), (x, y, STAFF_BOTTOM + 0.03), 0.012, 0.012, 6)
    staff.paint(faces_of(foot), AMBER_DARK)
    for z in (0.4, 0.75):
        band = kit.cone(staff.bm, (x, y, z), (x, y, z + 0.018), 0.014, 0.014, 6)
        staff.paint(faces_of(band), AMBER)
    return [staff]


def bowl_parts():
    parts = []
    bowl = Part("bowl", CRYSTAL, "bowl", shade=0.0)
    # A wide, shallow crystal bowl on a short foot, with facets of two colors.
    verts = kit.cone(bowl.bm, BOWL, BOWL + Z * 0.032, 0.022, 0.055, 10, caps=False)
    for f in faces_of(verts):
        c = f.calc_center_median() - BOWL
        if int((math.atan2(c.y, c.x) + math.pi) / (2 * math.pi) * 10) % 2:
            bowl.paint([f], CRYSTAL_DARK)
    kit.cone(bowl.bm, BOWL - Z * 0.012, BOWL + Z * 0.002, 0.016, 0.02, 8)
    rim = kit.torus(bowl.bm, BOWL + Z * 0.032, Z, 0.055, 0.004, 14, 3)
    bowl.paint(faces_of(rim), AMBER)
    # The dew in the bowl: a pale, bright pool with a few drops on the rim.
    pool = kit.cone(bowl.bm, BOWL + Z * 0.02, BOWL + Z * 0.026, 0.044, 0.05, 12)
    bowl.paint(faces_of(pool), DEW)
    for index in range(4):
        a = 2 * math.pi * index / 4 + 0.4
        drop = kit.sphere(bowl.bm, BOWL + Vector((0.056 * math.cos(a), 0.056 * math.sin(a), 0.024)), (0.006, 0.006, 0.009), 6, 4)
        bowl.paint(faces_of(drop), DROP)
    parts.append(bowl)

    # The flare of Holy light over the bowl.
    glow = Part("glow", DEW, "glow", shade=0)
    c = BOWL + Z * 0.06
    kit.sphere(glow.bm, c, (0.05, 0.05, 0.05), 10, 8)
    for index in range(8):
        a = 2 * math.pi * index / 8 + 0.2
        out = Vector((math.cos(a) * 0.7, math.sin(a) * 0.7, 0.7 + 0.3 * (index % 2)))
        flare = kit.cone(glow.bm, c + out * 0.04, c + out * 0.13, 0.018, 0.001, 4, squash=0.4)
        glow.paint(faces_of(flare), DROP)
    parts.append(glow)
    return parts


def dew_parts():
    """Drops of dew on a ring round her, for Regenerate. The dew bone scales them from 0."""
    dew = Part("dew", DROP, "dew", shade=0)
    for index in range(10):
        a = 2 * math.pi * index / 10
        r = 0.19 + 0.03 * (index % 2)
        z = DEW_RING.z + 0.05 + 0.55 * ((index * 3) % 10) / 10
        c = Vector((r * math.cos(a), r * math.sin(a), z))
        size = 0.012 + 0.005 * (index % 3)
        drop = kit.sphere(dew.bm, c, (size, size, size * 1.6), 6, 4)
        dew.paint(faces_of(drop), DROP if index % 3 else DEW)
        # A small sparkle beside each drop.
        kit.sphere(dew.bm, c + Vector((0, 0, size * 2.4)), (size * 0.9, size * 0.3, size * 0.3), 4, 3)
    return [dew]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("Dewkeeper", BONES)
    parts = head_parts() + body_parts() + limb_parts() + staff_parts() + bowl_parts() + dew_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "DewkeeperMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """The staff and the bowl aim with `Aim`, so the staff stays upright and the bowl level."""
    empties = {"staff_aim": kit.add_empty("staff_aim"), "bowl_aim": kit.add_empty("bowl_aim")}
    for bone, empty in (("staff", "staff_aim"), ("bowl", "bowl_aim")):
        aim = rig.pose.bones[bone].constraints.new("COPY_ROTATION")
        aim.name = "Aim"
        aim.target = empties[empty]
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

    staff_rest = rig.data.bones["staff"].matrix_local.to_quaternion()
    bowl_rest = rig.data.bones["bowl"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the staff that points it along `direction`."""
        return Z.rotation_difference(Vector(direction).normalized()) @ staff_rest

    def tipped(direction):
        """The world rotation of the bowl with its mouth toward `direction`."""
        return Z.rotation_difference(Vector(direction).normalized()) @ bowl_rest

    def stand(breath=0.0, sway=0.0):
        """She stands still and calm, the staff upright and the bowl level in front of her."""
        return {
            "hips@loc": at("hips", (0, 0, -0.004 - breath * 0.004)),
            "hips": t("hips", (Y, sway * 2), (Z, -6)),
            "spine": t("spine", (X, 2 + breath), (Y, sway * 2)),
            "chest": t("chest", (X, -4 - breath * 2), (Z, 2)),
            "neck": t("neck", (X, 2)),
            "head": t("head", (X, 6 + breath * 2), (Y, -sway * 5), (Z, 6)),
            "hair": t("hair", (X, -breath * 3), (Y, sway * 4)),
            "upperarm.L": t("upperarm.L", (X, -6 - breath * 3)),
            "forearm.L": t("forearm.L", (X, -6)),
            # The staff stands forward, in front of the line of her face.
            "upperarm.R": t("upperarm.R", (X, -30 - breath * 2)),
            "thigh.L": t("thigh.L", (X, -4), (Y, -3)),
            "thigh.R": t("thigh.R", (X, 4), (Y, 3)),
            "foot.R": t("foot.R", (X, -4)),
            "robe.B": t("robe.B", (X, 2 + breath * 2), (Y, sway * 3)),
            "staff/Aim": 1.0,
            "staff_aim@rot": aimed((0.0, -0.02 + breath * 0.01, 1)),
            "bowl/Aim": 1.0,
            "bowl_aim@rot": tipped((0, 0, 1)),
            "glow@scale": 0.0,
            "dew@scale": 0.0,
        }

    def tired(breath=0.0):
        """Low HP: bent, she leans on the staff, and the bowl sinks to her hip."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.04)),
            spine=t("spine", (X, 18 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 3)),
            neck=t("neck", (X, 4)),
            head=t("head", (X, 12 + breath * 4), (Y, -8)),
            hair=t("hair", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 8)),
            forearm__L=t("forearm.L", (X, 10)),
            upperarm__R=t("upperarm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 18)),
            thigh__R=t("thigh.R", (X, -6), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, -8)),
            robe__B=t("robe.B", (X, -4)),
            staff_aim_at_rot=aimed((0.03, -0.12, 1)),
            bowl_aim_at_rot=tipped((0.0, -0.3, 1)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back; she guards the bowl."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012)),
            spine=t("spine", (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, -6 * amount)),
            head=t("head", (X, -16 * amount), (Z, -8 * amount)),
            hair=t("hair", (X, 18 * amount)),
            upperarm__L=t("upperarm.L", (X, -20 * amount), (Y, -10 * amount)),
            forearm__L=t("forearm.L", (X, -30 * amount)),
            robe__B=t("robe.B", (X, 10 * amount)),
            staff_aim_at_rot=aimed((0.0, 0.2 * amount, 1)),
            bowl_aim_at_rot=tipped((0.0, 0.25 * amount, 1)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.04)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 20)),
            hair=t("hair", (X, -20)),
            thigh__L=t("thigh.L", (X, -22)),
            shin__L=t("shin.L", (X, 34)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 24)),
            foot__R=t("foot.R", (X, -16)),
            upperarm__L=t("upperarm.L", (Y, 30)),
            robe__B=t("robe.B", (X, -12)),
            staff_aim_at_rot=aimed((0.2, -0.6, 1)),
            bowl_aim_at_rot=tipped((0.6, -0.6, 0.5)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the arms out, the staff flat beside her and the bowl tipped over."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.13)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Y, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -26)),
            hair=t("hair", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, -60), (X, 20)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, -20)),
            forearm__R=t("forearm.R", (X, 20)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 20)),
            robe__B=t("robe.B", (X, -40)),
            staff_aim_at_rot=aimed((0.2, -1, -0.02)),
            bowl_aim_at_rot=tipped((1, 0.2, 0.1)),
        )

    def kneel(base):
        """On both knees, the head down, the bowl held to her chest: as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.16)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 6)),
            head=t("head", (X, 18)),
            hair=t("hair", (X, -24)),
            thigh__L=t("thigh.L", (X, -60), (Y, -4)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -56), (Y, 4)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -20), (Z, 20)),
            forearm__L=t("forearm.L", (X, -40)),
            upperarm__R=t("upperarm.R", (X, -80)),
            forearm__R=t("forearm.R", (X, -30)),
            robe__B=t("robe.B", (X, 30)),
            staff_aim_at_rot=aimed((0.0, -0.25, 1)),
            dew_at_scale=0.3,
        )

    def offering(base, swirl=0.0, power=1.0):
        """The bowl lifted high, the head back and the eyes on it: the cast and the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, 0.004)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10), (Z, 4)),
            neck=t("neck", (X, -8)),
            head=t("head", (X, -24), (Z, 8)),
            hair=t("hair", (X, 10)),
            upperarm__L=t("upperarm.L", (X, -140), (Y, 10)),
            forearm__L=t("forearm.L", (X, 72)),
            upperarm__R=t("upperarm.R", (X, -24), (Y, -6)),
            robe__B=t("robe.B", (X, 6)),
            staff_aim_at_rot=aimed((-0.06, -0.06, 1)),
            glow_at_scale=0.55 * power,
            dew_at_scale=1.0 * power,
            dew=t("dew", (Z, swirl)),
        )

    def step(front):
        """A calm, gliding walk. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.016)),
            hips=t("hips", (Z, -6 + 4 * front), (Y, 2 * front)),
            spine=t("spine", (X, 3)),
            chest=t("chest", (Z, -4 * front)),
            hair=t("hair", (X, 6), (Y, 4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 10)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14)),
                f"shin__{back}": t(f"shin.{back}", (X, 18)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "upperarm__R": t("upperarm.R", (X, -30 + 8 * front)),
                "robe__B": t("robe.B", (X, 8), (Y, 5 * front)),
                "staff_aim_at_rot": aimed((0.0, 0.08 * front, 1)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, 3)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -20)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "robe__B": t("robe.B", (X, 4)),
            },
        )

    # The attack: she thrusts the bowl forward, its mouth to the foe. The Holy
    # light leaves at 20% of the attack (`FLIGHT_START` in fx.ts), so the dew
    # flares at frame 6 of 30.
    def offer(base, flare=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.02, -0.02)),
            hips=t("hips", (Z, 8)),
            spine=t("spine", (X, 8), (Z, 6)),
            chest=t("chest", (X, 4), (Z, 10)),
            head=t("head", (X, -6), (Z, -10)),
            hair=t("hair", (X, 14)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, -10)),
            forearm__L=t("forearm.L", (X, 20)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, -10)),
            thigh__L=t("thigh.L", (X, -22), (Y, -4)),
            shin__L=t("shin.L", (X, 14)),
            thigh__R=t("thigh.R", (X, 10), (Y, 4)),
            foot__R=t("foot.R", (X, -16)),
            robe__B=t("robe.B", (X, 10)),
            staff_aim_at_rot=aimed((0.0, 0.1, 1)),
            bowl_aim_at_rot=tipped((0, -1, 0.9)),
            glow_at_scale=flare,
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

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, offer(stand(), 0.3)).key(6, offer(stand(), 1.15)).key(10, offer(stand(), 0.6))
    attack.key(18, offer(stand(), 0.0)).key(26, stand()).key(30, stand())
    clips.append(attack)

    # Regenerate: she lifts the bowl, and the dew falls and turns round her.
    cast = Clip("cast", 24)
    cast.key(0, stand()).key(5, offering(stand(), 0, 0.4)).key(12, offering(stand(), 60)).key(18, offering(stand(), 120))
    cast.key(24, offering(stand(), 180, 0.0))
    clips.append(cast)

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
    rebirth.key(32, kneel(stand())).key(41, offering(stand(), 90, 0.6)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, kneel(stand())).key(9, pose(kneel(stand()), hips_at_loc=at("hips", (0, 0.02, -0.18))))
    summon.key(17, offering(stand(), 90, 0.6)).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "dewkeeper.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
