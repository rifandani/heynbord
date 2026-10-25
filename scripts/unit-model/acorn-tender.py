"""
Acorn Tender (`elf.acornTender`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an elder elf woman gardener with
white hair swept back to a low knot, a severe, amused expression, a plain green
robe over a cream dress, and a shawl of leaves. A crooked copper watering can
hangs at her left hip. Her right hand, on the camera side, holds a curved
pruning knife with a persistent coat of bright green sap. Run it in Blender
(see `unit_model_kit.py`). It writes `apps/web/art/units/raw/acorn-tender.glb`;
then `bun unit-model:pack acorn-tender` packs it for the game.

The can hangs from its own hip bone, so the left hand can hold the glowing,
sprouting golden acorn above her without moving the can. The acorn and its glow
have separate bones and stay upright with an aim control. Her Holy Long Range
attack raises the acorn, then releases its magic at frame 6 of 30 (20%): the
acorn vanishes and the glow flares. The green sap on the knife shows Poison.
Long Range and Poison both occur in the attack, so she has no cast clip.
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

SKIN = hex_color("#dfb18f")
WRINKLE = hex_color("#b47e68")
MOUTH = hex_color("#995c58")
HAIR = hex_color("#ece9e0")
HAIR_LIGHT = hex_color("#fffdf4")
HAIR_DARK = hex_color("#b8b5ad")
EYES = hex_color("#252b20")
BROW = hex_color("#d4d0c6")
ROBE = hex_color("#55723c")
ROBE_DARK = hex_color("#394f2c")
LEAF = hex_color("#688442")
LEAF_LIGHT = hex_color("#98ae5b")
LEAF_DARK = hex_color("#425c2e")
CREAM = hex_color("#e9ddbf")
CREAM_SHADE = hex_color("#c9bb9b")
LEATHER = hex_color("#6c4930")
LEATHER_DARK = hex_color("#432d20")
BOOT = hex_color("#65452f")
COPPER = hex_color("#aa6c40")
COPPER_LIGHT = hex_color("#cf9359")
COPPER_DARK = hex_color("#6d402b")
STEEL = hex_color("#c7d0d0")
STEEL_DARK = hex_color("#748184")
SAP = hex_color("#a5ec45")
SAP_DARK = hex_color("#609f2d")
ACORN = hex_color("#e3ad3d")
ACORN_CAP = hex_color("#96652e")
ACORN_LIGHT = hex_color("#fff0a6")
GLOW = hex_color("#ffe58a")
SPROUT = hex_color("#91cf50")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.872))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.052

# The left elbow is out and up in the bind pose. Her forearm turns back in and
# up, so the raised acorn is her silhouette hook even before an animation starts.
SL = Vector((0.105, 0, SHOULDER_Z))
EL = Vector((0.23, 0.005, 0.785))
WL = Vector((0.2, -0.075, 0.92))
DL = (WL - EL).normalized()
TL = WL + DL * 0.05
HAND_L = WL + DL * 0.026
ACORN_C = HAND_L + Z * 0.052

# The right forearm comes forward to the hip, with the pruning knife outside
# the robe on the camera side.
SR = Vector((-0.105, 0, SHOULDER_Z))
ER = Vector((-0.15, 0.02, 0.59))
WR = Vector((-0.175, -0.075, 0.5))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.026

# The watering can hangs from this hook at the left belt, not from either hand.
CAN_HOOK = Vector((0.115, 0.025, 0.5))
CAN_BOTTOM = Vector((0.15, 0.015, 0.3))
CAN_TOP = Vector((0.17, 0.015, 0.425))
CAN_AXIS = (CAN_TOP - CAN_BOTTOM).normalized()

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    # The low knot and its tail, and the loose back of the robe.
    ("hair", (0, 0.07, 0.86), (0, 0.1, 0.66), "head"),
    ("robe.B", (0, 0.09, 0.47), (0, 0.13, 0.08), "hips"),
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
    ("can", tuple(CAN_HOOK), tuple(CAN_HOOK - Z * 0.1), "hips"),
    ("knife", tuple(HAND_R), tuple(HAND_R + DR * 0.1), "hand.R"),
    ("acorn", tuple(ACORN_C), tuple(ACORN_C + Z * 0.08), "hand.L"),
    # Separate from the acorn: it can flare after the released acorn vanishes.
    ("glow", tuple(ACORN_C), tuple(ACORN_C + Z * 0.08), "hand.L"),
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
    """The robe follows the hips, the legs at the front, and its loose back."""
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
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.061, 0.066, 0.079), 14, 10)
    # A long nose, a firm chin, and long ears give her an elder-elf profile.
    kit.cone(head.bm, HEAD_C + Vector((0, -0.061, -0.003)), HEAD_C + Vector((0, -0.082, -0.018)), 0.011, 0.002, 5)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.03, -0.048)), HEAD_C + Vector((0, -0.05, -0.075)), 0.027, 0.008, 6, squash=0.8)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.055 * sign, 0.006, -0.002)), HEAD_C + Vector((0.125 * sign, 0.042, 0.048)), 0.015, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        # Narrow eyes and severe brows; one brow lifts with dry amusement.
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.058, 0.006)), (0.011, 0.006, 0.0045), 8, 5)
        brow_z = 0.026 + (0.005 if sign == 1 else 0.0)
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.061, brow_z)), (0.016 * sign, 0, 0.005), (0, 0.005, 0), (0, 0, 0.0035))
        face.paint(faces_of(brow), BROW)
        # Two short crow's-feet at each eye, and one cheek crease.
        for dz in (0.0, -0.008):
            crease = kit.tube(face.bm, [HEAD_C + Vector((0.039 * sign, -0.057, 0.003 + dz)), HEAD_C + Vector((0.052 * sign, -0.049, 0.005 + dz))], [0.0018, 0.001], 3)
            face.paint(faces_of(crease), WRINKLE)
        cheek = kit.tube(face.bm, [HEAD_C + Vector((0.022 * sign, -0.057, -0.02)), HEAD_C + Vector((0.035 * sign, -0.051, -0.035))], [0.0018, 0.001], 3)
        face.paint(faces_of(cheek), WRINKLE)
    # An asymmetric line: a restrained smile under the severe stare.
    smirk = kit.tube(face.bm, [HEAD_C + Vector((-0.018, -0.063, -0.035)), HEAD_C + Vector((0, -0.066, -0.038)), HEAD_C + Vector((0.017, -0.061, -0.03))], [0.0015, 0.003, 0.0025], 4)
    face.paint(faces_of(smirk), MOUTH)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.024, 0.022, 8)
    parts.append(neck)

    # White hair combed back from a middle part to a low knot and a wavy tail.
    hair = Part("hair", HAIR, hair_weights, shade=0.13)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.069, 0.075, 0.082), 14, 10)
    cut = [
        v
        for v in verts
        if v.co.z < HEAD_C.z - 0.03
        or (v.co.y < HEAD_C.y - 0.035 and v.co.z < HEAD_C.z + 0.05)
        or (v.co.y < HEAD_C.y - 0.005 and v.co.z < HEAD_C.z + 0.012)
    ]
    kit.bmesh.ops.delete(hair.bm, geom=cut, context="VERTS")
    for index, x in enumerate((-0.045, -0.015, 0.015, 0.045)):
        wave = kit.cone(hair.bm, HEAD_C + Vector((x, -0.052, 0.058)), HEAD_C + Vector((x * 1.25, 0.06, 0.035)), 0.015, 0.011, 5, squash=0.6)
        hair.paint(faces_of(wave), (HAIR_LIGHT, HAIR)[index % 2])
    knot = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.078, -0.035)), (0.037, 0.031, 0.034), 10, 7)
    hair.paint(faces_of(knot), HAIR_DARK)
    tie = kit.torus(hair.bm, HEAD_C + Vector((0, 0.09, -0.06)), (0, 0.5, 1), 0.019, 0.004, 10, 3)
    hair.paint(faces_of(tie), LEATHER)
    tail_points = [HEAD_C + Vector((0, 0.09, -0.07)), HEAD_C + Vector((0.015, 0.11, -0.13)), HEAD_C + Vector((-0.012, 0.115, -0.19)), HEAD_C + Vector((0.006, 0.11, -0.23))]
    tail = kit.tube(hair.bm, tail_points, [0.02, 0.018, 0.012, 0.003], 6)
    hair.paint(faces_of(tail), HAIR)
    # The side locks are tucked behind the ears, so the profile face stays clear.
    for sign in (1, -1):
        top = HEAD_C + Vector((0.052 * sign, 0.024, 0.025))
        lock = kit.tube(hair.bm, [top, top + Vector((0.014 * sign, 0.008, -0.075)), top + Vector((0.008 * sign, 0.018, -0.15))], [0.015, 0.012, 0.003], 5)
        hair.paint(faces_of(lock), HAIR_LIGHT)
    # A small gardener's leaf pin over the left ear.
    pin_base = HEAD_C + Vector((0.06, 0.005, 0.035))
    for index, direction in enumerate(((0.8, 0.2, 0.6), (0.5, 0.5, -0.2), (0.2, 0.6, 0.8))):
        leaf(hair, pin_base, direction, 0.038, 0.013, (LEAF_LIGHT, LEAF, LEAF_DARK)[index])
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    body = Part("body", CREAM, torso_weights, shade=0.12)
    kit.cone(body.bm, (0, 0, 0.48), (0, 0, 0.735), 0.07, 0.08, 12, squash=0.78)
    parts.append(body)

    def bodice_color(row, column):
        return ROBE_DARK if column % 5 == 2 else ROBE

    # Plain green over the cream dress, with no metal embroidery.
    bodice = Part("bodice", ROBE, torso_weights, shade=0.1)
    kit.ragged_cone(bodice, 0.745, 0.5, 0.086, 0.08, 14, 3, 0.8, 0.0, bodice_color, CREAM, gap=math.radians(28))
    parts.append(bodice)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.52), 0.084, 0.083, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.068, 0.505), (0.019, 0.008, 0.018))
    belt.paint(faces_of(buckle), COPPER_DARK)
    loop = kit.torus(belt.bm, CAN_HOOK, Y, 0.014, 0.0035, 10, 3)
    belt.paint(faces_of(loop), LEATHER_DARK)
    parts.append(belt)

    def dress_color(row, column):
        return CREAM_SHADE if column % 4 == 0 else CREAM

    dress = Part("dress", CREAM, robe_weights, shade=0.12)
    kit.ragged_cone(dress, 0.5, 0.04, 0.078, 0.125, 14, 6, 0.82, 0.003, dress_color, CREAM_SHADE)
    parts.append(dress)

    def robe_color(row, column):
        return ROBE_DARK if column % 5 == 2 else ROBE

    # A clean, plain hem; only a small unevenness keeps the miniature handmade.
    robe = Part("robe", ROBE, robe_weights, shade=0.14)
    kit.ragged_cone(robe, 0.51, 0.05, 0.09, 0.16, 16, 7, 0.86, 0.015, robe_color, CREAM_SHADE, gap=math.radians(30), y_push=0.03)
    parts.append(robe)

    shawl = Part("shawl", LEAF, "chest", shade=0.06)
    kit.cone(shawl.bm, (0, 0.004, 0.7), (0, 0.004, 0.755), 0.09, 0.058, 12, caps=False, squash=0.82)
    for index in range(11):
        angle = math.radians(-150 + index * 30)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0, 0.74)) + out * 0.073
        leaf(shawl, base, out * 0.85 + Vector((0, 0, -0.8)), 0.088, 0.031, (LEAF_LIGHT, LEAF, LEAF_DARK)[index % 3])
    clasp = kit.sphere(shawl.bm, (0, -0.064, 0.73), (0.012, 0.009, 0.014), 8, 5)
    shawl.paint(faces_of(clasp), ACORN_CAP)
    parts.append(shawl)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, d) in (("L", 1, (SL, EL, WL, DL)), ("R", -1, (SR, ER, WR, DR))):
        sleeve = Part(f"sleeve.{side}", ROBE, f"upperarm.{side}", shade=0.08)
        kit.sphere(sleeve.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.032, 0.032, 0.03), 8, 6)
        kit.cone(sleeve.bm, s, e, 0.028, 0.026, 8)
        parts.append(sleeve)

        # A plain bell sleeve with a cream lining, not a decorated cuff.
        bell = Part(f"bell.{side}", ROBE, f"forearm.{side}", shade=0.1)
        kit.cone(bell.bm, e - d * 0.01, w - d * 0.006, 0.027, 0.044, 8)
        lining = kit.cone(bell.bm, w - d * 0.012, w - d * 0.004, 0.039, 0.042, 8, caps=False)
        bell.paint(faces_of(lining), CREAM)
        rim = kit.torus(bell.bm, w - d * 0.004, d, 0.043, 0.0035, 10, 3)
        bell.paint(faces_of(rim), CREAM_SHADE)
        middle = (e + w) / 2
        drape = kit.cone(bell.bm, middle - Z * 0.006, middle + Vector((0, 0.018, -0.075)), 0.03, 0.007, 6, squash=0.5)
        bell.paint(faces_of(drape), ROBE_DARK)
        parts.append(bell)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.016, 0.015, 0.022), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        leg = Part(f"leg.{side}", CREAM_SHADE, f"thigh.{side}")
        kit.cone(leg.bm, hip, knee, 0.039, 0.031, 8)
        parts.append(leg)
        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        verts = kit.cone(boot.bm, knee, ankle, 0.033, 0.029, 8)
        boot.paint({f for v in verts if v.co.z > KNEE_Z - 0.015 for f in v.link_faces}, LEATHER_DARK)
        parts.append(boot)
        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.024), (0.052, 0.105, 0.046))
        sole = kit.box(foot.bm, (LEG_X * sign, -0.03, 0.006), (0.054, 0.107, 0.012))
        foot.paint(faces_of(sole), LEATHER_DARK)
        parts.append(foot)
    return parts


def watering_can_parts():
    can = Part("can", COPPER, "can", shade=0.1)
    # The tilted body, bent spout, and uneven handle make the can crooked.
    body = kit.cone(can.bm, CAN_BOTTOM, CAN_TOP, 0.052, 0.047, 10, squash=0.82)
    for face in faces_of(body):
        if face.calc_center_median().y > CAN_BOTTOM.y + 0.012:
            can.paint([face], COPPER_DARK)
    bottom = kit.cone(can.bm, CAN_BOTTOM - CAN_AXIS * 0.004, CAN_BOTTOM + CAN_AXIS * 0.012, 0.054, 0.053, 10, squash=0.82)
    can.paint(faces_of(bottom), COPPER_DARK)
    rim = kit.torus(can.bm, CAN_TOP, CAN_AXIS, 0.047, 0.004, 12, 3)
    can.paint(faces_of(rim), COPPER_LIGHT)
    opening = kit.cone(can.bm, CAN_TOP + CAN_AXIS * 0.001, CAN_TOP + CAN_AXIS * 0.003, 0.04, 0.04, 10, squash=0.82)
    can.paint(faces_of(opening), COPPER_DARK)

    handle_points = [
        CAN_TOP + Vector((-0.025, 0.018, -0.005)),
        Vector((0.105, 0.05, 0.465)),
        CAN_HOOK,
        Vector((0.102, 0.015, 0.42)),
        CAN_BOTTOM + Vector((-0.025, 0.012, 0.025)),
    ]
    handle = kit.tube(can.bm, handle_points, [0.006, 0.006, 0.0055, 0.006, 0.006], 5)
    can.paint(faces_of(handle), COPPER_DARK)

    spout_start = CAN_BOTTOM.lerp(CAN_TOP, 0.35) + Vector((0.035, -0.012, 0))
    spout_points = [spout_start, Vector((0.225, -0.005, 0.385)), Vector((0.245, -0.015, 0.445)), Vector((0.265, -0.025, 0.49))]
    spout = kit.tube(can.bm, spout_points, [0.014, 0.012, 0.01, 0.009], 6)
    can.paint(faces_of(spout), COPPER)
    nozzle_direction = Vector((0.4, -0.2, 1)).normalized()
    nozzle_end = spout_points[-1] + nozzle_direction * 0.035
    nozzle = kit.cone(can.bm, spout_points[-1], nozzle_end, 0.011, 0.025, 8)
    can.paint(faces_of(nozzle), COPPER_LIGHT)
    rose = kit.cone(can.bm, nozzle_end - nozzle_direction * 0.001, nozzle_end + nozzle_direction * 0.002, 0.021, 0.021, 8)
    can.paint(faces_of(rose), COPPER_DARK)
    return [can]


def knife_parts():
    knife = Part("knife", STEEL, "knife", shade=0.04)
    handle = kit.tube(knife.bm, [HAND_R - DR * 0.025, HAND_R + DR * 0.012, HAND_R + DR * 0.045], [0.009, 0.01, 0.009], 6)
    knife.paint(faces_of(handle), LEATHER_DARK)
    bolster = kit.cone(knife.bm, HAND_R + DR * 0.035, HAND_R + DR * 0.047, 0.013, 0.012, 6)
    knife.paint(faces_of(bolster), COPPER)

    # A hooked pruning blade, outside the right hip where the camera sees it.
    base = HAND_R + DR * 0.045
    blade_points = [
        base,
        base + Vector((-0.025, -0.006, 0.026)),
        base + Vector((-0.055, -0.008, 0.052)),
        base + Vector((-0.085, -0.005, 0.061)),
        base + Vector((-0.105, 0, 0.047)),
    ]
    blade = kit.tube(knife.bm, blade_points, [0.01, 0.013, 0.012, 0.007, 0.001], 4)
    for face in faces_of(blade):
        if face.calc_center_median().y > base.y:
            knife.paint([face], STEEL_DARK)
    # This sap is part of the blade, never an attack flash: Poison is persistent.
    sap_points = [p + Vector((0, -0.009, 0.003)) for p in blade_points[1:]]
    sap = kit.tube(knife.bm, sap_points, [0.005, 0.006, 0.005, 0.001], 4)
    knife.paint(faces_of(sap), SAP)
    drop = kit.sphere(knife.bm, blade_points[3] + Vector((0, -0.006, -0.012)), (0.005, 0.005, 0.009), 6, 4)
    knife.paint(faces_of(drop), SAP)
    return [knife]


def acorn_parts():
    parts = []
    acorn = Part("acorn", ACORN, "acorn", shade=0.04)
    kit.sphere(acorn.bm, ACORN_C, (0.023, 0.022, 0.032), 10, 7)
    cap = kit.sphere(acorn.bm, ACORN_C + Z * 0.018, (0.026, 0.024, 0.012), 10, 5)
    acorn.paint(faces_of(cap), ACORN_CAP)
    rim = kit.torus(acorn.bm, ACORN_C + Z * 0.013, Z, 0.023, 0.003, 12, 3)
    acorn.paint(faces_of(rim), ACORN_CAP)
    highlight = kit.sphere(acorn.bm, ACORN_C + Vector((-0.007, -0.019, 0.003)), (0.007, 0.004, 0.011), 6, 4)
    acorn.paint(faces_of(highlight), ACORN_LIGHT)
    stem_points = [ACORN_C + Z * 0.027, ACORN_C + Vector((0.004, 0, 0.055)), ACORN_C + Vector((-0.002, 0, 0.083))]
    stem = kit.tube(acorn.bm, stem_points, [0.003, 0.0025, 0.0015], 5)
    acorn.paint(faces_of(stem), SPROUT)
    leaf(acorn, stem_points[1], (-0.8, -0.1, 0.5), 0.042, 0.014, SPROUT)
    leaf(acorn, stem_points[2], (0.75, 0.1, 0.65), 0.045, 0.015, LEAF_LIGHT)
    parts.append(acorn)

    # A small Holy star around the acorn. Its separate bone can flare at release.
    glow = Part("glow", GLOW, "glow", shade=0)
    kit.sphere(glow.bm, ACORN_C, (0.032, 0.032, 0.032), 8, 6)
    for index in range(8):
        angle = 2 * math.pi * index / 8
        out = Vector((math.cos(angle), -0.25, math.sin(angle))).normalized()
        ray = kit.cone(glow.bm, ACORN_C + out * 0.038, ACORN_C + out * (0.075 + 0.01 * (index % 2)), 0.008, 0.001, 4, squash=0.5)
        glow.paint(faces_of(ray), ACORN_LIGHT if index % 2 else GLOW)
    parts.append(glow)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("AcornTender", BONES)
    parts = head_parts() + body_parts() + limb_parts() + watering_can_parts() + knife_parts() + acorn_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "AcornTenderMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """Keep the acorn upright and its glow aligned as the left hand moves."""
    empties = {"acorn_aim": kit.add_empty("acorn_aim")}
    for bone in ("acorn", "glow"):
        aim = rig.pose.bones[bone].constraints.new("COPY_ROTATION")
        aim.name = "Aim"
        aim.target = empties["acorn_aim"]
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

    acorn_rest = rig.data.bones["acorn"].matrix_local.to_quaternion()

    def aimed(direction):
        return Z.rotation_difference(Vector(direction).normalized()) @ acorn_rest

    def stand(breath=0.0, sway=0.0):
        """Upright but elderly: she raises the acorn and gives it a dry stare."""
        return {
            "hips@loc": at("hips", (0, 0, -0.004 - breath * 0.003)),
            "hips": t("hips", (Y, sway * 1.5), (Z, -6)),
            "spine": t("spine", (X, 4 + breath), (Y, sway)),
            "chest": t("chest", (X, -2 - breath * 2), (Z, 2)),
            "neck": t("neck", (X, 2)),
            "head": t("head", (X, -4 + breath * 2), (Y, -sway * 3), (Z, 10 + sway * 3)),
            "hair": t("hair", (X, -breath * 3), (Y, sway * 4)),
            "upperarm.L": t("upperarm.L", (X, -4 - breath * 2)),
            "forearm.L": t("forearm.L", (X, breath * 2)),
            "hand.L": t("hand.L", (X, -4 + breath * 2)),
            "upperarm.R": t("upperarm.R", (X, -4 - breath), (Y, -4)),
            "forearm.R": t("forearm.R", (X, -6)),
            "thigh.L": t("thigh.L", (X, -6), (Y, -3)),
            "shin.L": t("shin.L", (X, 6)),
            "thigh.R": t("thigh.R", (X, 5), (Y, 3)),
            "foot.R": t("foot.R", (X, -4)),
            "robe.B": t("robe.B", (X, 2 + breath * 2), (Y, sway * 3)),
            "can": t("can", (X, -2 + sway * 4), (Y, 3 + breath * 2), (Z, -4)),
            "acorn/Aim": 1.0,
            "glow/Aim": 1.0,
            "acorn_aim@rot": aimed((0.08, -0.03, 1)),
            "acorn@scale": 1.0,
            "glow@scale": 0.55,
        }

    def tired(breath=0.0):
        """Low HP: stooped, the acorn lowered and its light weak."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.025, -0.038)),
            spine=t("spine", (X, 17 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            neck=t("neck", (X, 5)),
            head=t("head", (X, 12 + breath * 3), (Y, -7), (Z, 2)),
            hair=t("hair", (X, -20)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 35)),
            forearm__L=t("forearm.L", (X, -15)),
            upperarm__R=t("upperarm.R", (X, 12), (Y, 8)),
            thigh__L=t("thigh.L", (X, -16), (Y, -4)),
            shin__L=t("shin.L", (X, 24)),
            thigh__R=t("thigh.R", (X, -7), (Y, 4)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -10)),
            robe__B=t("robe.B", (X, -5)),
            can=t("can", (X, 12), (Y, -8), (Z, -8)),
            acorn_at_scale=0.7,
            glow_at_scale=0.22,
        )

    def recoil(base, amount=1.0):
        """The hit pushes her back; the can swings and she guards the acorn."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012)),
            spine=t("spine", (X, -9 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, -7 * amount)),
            head=t("head", (X, -15 * amount), (Z, -5 * amount)),
            hair=t("hair", (X, 18 * amount)),
            upperarm__L=t("upperarm.L", (X, 16 * amount), (Y, 20 * amount)),
            forearm__L=t("forearm.L", (X, -22 * amount)),
            upperarm__R=t("upperarm.R", (X, 16 * amount), (Y, -16 * amount)),
            forearm__R=t("forearm.R", (X, -20 * amount)),
            robe__B=t("robe.B", (X, 12 * amount)),
            can=t("can", (X, -20 * amount), (Y, 10 * amount), (Z, 8 * amount)),
            glow_at_scale=0.3,
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.04)),
            spine=t("spine", (X, 20)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 20), (Z, -8)),
            hair=t("hair", (X, -22)),
            thigh__L=t("thigh.L", (X, -22)),
            shin__L=t("shin.L", (X, 34)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 24)),
            foot__R=t("foot.R", (X, -16)),
            upperarm__L=t("upperarm.L", (X, 14), (Y, 45)),
            upperarm__R=t("upperarm.R", (Y, -20), (X, 12)),
            robe__B=t("robe.B", (X, -12)),
            can=t("can", (X, 24), (Y, -16), (Z, 12)),
            acorn_at_scale=0.5,
            glow_at_scale=0.15,
        )

    def fallen(base, bounce=0.0):
        """Flat on her back, the acorn out and the can fallen beside her hip."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.11)),
            hips=t("hips", (Y, 0)),
            spine=t("spine", (X, -5)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -11), (Z, -25)),
            hair=t("hair", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, 48), (X, 20)),
            forearm__L=t("forearm.L", (X, -18)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, -20)),
            forearm__R=t("forearm.R", (X, 18)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 20)),
            robe__B=t("robe.B", (X, -40)),
            can=t("can", (X, 30), (Y, -30), (Z, 15)),
            acorn_at_scale=0.0,
            glow_at_scale=0.0,
        )

    def kneel(base):
        """A gardener's kneel for the start of a summon and the end of a fall."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.16)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 7)),
            head=t("head", (X, 18), (Z, 4)),
            hair=t("hair", (X, -24)),
            thigh__L=t("thigh.L", (X, -60), (Y, -4)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -56), (Y, 4)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -18), (Y, 45)),
            forearm__L=t("forearm.L", (X, -35)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, -8)),
            robe__B=t("robe.B", (X, 30)),
            can=t("can", (X, -16), (Y, 12)),
            acorn_at_scale=0.5,
            glow_at_scale=0.22,
        )

    def offering(base, power=1.0):
        """The acorn high in ceremony: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -3)),
            chest=t("chest", (X, -10), (Z, 4)),
            neck=t("neck", (X, -6)),
            head=t("head", (X, -20), (Z, 12)),
            hair=t("hair", (X, 10)),
            upperarm__L=t("upperarm.L", (X, -12), (Y, -12)),
            forearm__L=t("forearm.L", (X, -8)),
            hand__L=t("hand.L", (X, -10)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, -8)),
            robe__B=t("robe.B", (X, 7)),
            can=t("can", (X, 7), (Y, -5)),
            acorn_at_scale=1.0,
            glow_at_scale=0.9 * power,
        )

    def step(front):
        """A measured walk; the raised acorn stays steady as the can swings."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.015)),
            hips=t("hips", (Z, -6 + 4 * front), (Y, 2 * front)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (Z, -4 * front)),
            hair=t("hair", (X, 6), (Y, 4 * front)),
            upperarm__L=t("upperarm.L", (X, -4 + 4 * front)),
            upperarm__R=t("upperarm.R", (X, -4 - 10 * front), (Y, -4)),
            robe__B=t("robe.B", (X, 9), (Y, 5 * front)),
            can=t("can", (X, 14 * front), (Y, -5 * front), (Z, -4)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 10)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14)),
                f"shin__{back}": t(f"shin.{back}", (X, 18)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
            },
        )

    def passing(lifted):
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, 5)),
            hair=t("hair", (X, -4)),
            robe__B=t("robe.B", (X, 4)),
            can=t("can", (X, -5), (Y, 4)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -20)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
            },
        )

    # Holy Long Range and Poison share this attack. She draws the sprouting
    # acorn back, then snaps it forward and releases its magic at exactly frame
    # 6 of 30 (20%, `FLIGHT_START` in fx.ts). The sap stays on the knife.
    def draw(base):
        return pose(
            base,
            hips=t("hips", (Z, 2)),
            spine=t("spine", (X, 2), (Z, 7)),
            chest=t("chest", (X, -4), (Z, 10)),
            head=t("head", (X, -10), (Z, 16)),
            hair=t("hair", (X, -8)),
            upperarm__L=t("upperarm.L", (X, -14), (Y, 8)),
            forearm__L=t("forearm.L", (X, -18)),
            hand__L=t("hand.L", (X, -20)),
            upperarm__R=t("upperarm.R", (X, -14), (Y, -14)),
            robe__B=t("robe.B", (X, -5)),
            can=t("can", (X, -14), (Y, 8)),
            acorn_at_scale=1.0,
            glow_at_scale=0.8,
        )

    def release(base, follow=0.0, flare=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.02, -0.018)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 9), (Z, -5)),
            chest=t("chest", (X, 4), (Z, -10)),
            head=t("head", (X, -4), (Z, -4)),
            hair=t("hair", (X, 15)),
            upperarm__L=t("upperarm.L", (X, 32 + follow * 8), (Y, -10)),
            forearm__L=t("forearm.L", (X, 20 + follow * 8)),
            hand__L=t("hand.L", (X, 15 + follow * 12)),
            upperarm__R=t("upperarm.R", (X, 18), (Y, -10)),
            thigh__L=t("thigh.L", (X, -20), (Y, -4)),
            shin__L=t("shin.L", (X, 14)),
            thigh__R=t("thigh.R", (X, 10), (Y, 4)),
            foot__R=t("foot.R", (X, -14)),
            robe__B=t("robe.B", (X, 12)),
            can=t("can", (X, 20), (Y, -10), (Z, 6)),
            acorn_at_scale=0.0,
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
    attack.key(0, stand()).key(3, draw(stand())).key(5, draw(stand()))
    attack.key(6, release(stand(), 0.0, 1.3)).key(9, release(stand(), 1.0, 0.0))
    attack.key(15, release(stand(), 0.4, 0.0))
    attack.key(20, pose(stand(), acorn_at_scale=0.0, glow_at_scale=0.0))
    attack.key(25, stand()).key(30, stand())
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
    rebirth.key(32, kneel(stand())).key(41, offering(stand(), 0.9)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, kneel(stand())).key(9, pose(kneel(stand()), hips_at_loc=at("hips", (0, 0.02, -0.18))))
    summon.key(17, offering(stand(), 0.9)).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "acorn-tender.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
