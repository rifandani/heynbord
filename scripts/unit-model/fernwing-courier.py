"""
Fernwing Courier (`elf.fernwingCourier`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a small, elegant leaf-spirit elf
with a determined face, pointed ears, leaf hair and layered leaf clothing.
She carries a worn leather satchel and holds an official, twine-tied parcel
forward in her right hand, on the camera side. A red wax seal marks the
parcel, and a bread, lettuce and cheese sandwich corner shows through its
opened corner. Her two large fern wings have twig midribs and rows of separate,
overlapping leaflets. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/fernwing-courier.glb`; then
`bun unit-model:pack fernwing-courier` packs it for the game.

She is Flying: the game puts the rest pose on the ground, so the normal clips
lift the `root` and her feet hang with the toes down. Her wings rise in a
narrow V and are long from front to back, so the camera sees their broad fern
surfaces. The `wing.L` and `wing.R` bones beat and sweep the wings, then fold
them when she falls. She is Swift: her 16-frame walk is a fast glide. Her
attack is a parcel-led diving ram, with its melee impact at frame 15 of 30.
The parcel is skinned to `hand.R` and stays in her grasp in every clip. She
has no Keyword that she uses by her own action, so she has no cast clip.
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

SKIN = hex_color("#e7b68f")
SKIN_SHADE = hex_color("#c98f6d")
HAIR = hex_color("#617638")
HAIR_LIGHT = hex_color("#91a74c")
HAIR_DARK = hex_color("#40552b")
EYES = hex_color("#23311e")
EYE_LIGHT = hex_color("#d9e6ae")
MOUTH = hex_color("#844f43")
LEAF = hex_color("#527638")
LEAF_LIGHT = hex_color("#7f9d48")
LEAF_DARK = hex_color("#354f2c")
LEAF_EDGE = hex_color("#b2ae54")
LEATHER = hex_color("#765036")
LEATHER_DARK = hex_color("#493322")
LEATHER_WORN = hex_color("#9b7048")
BRASS = hex_color("#d3a14b")
LEG_wrap = hex_color("#6d7c3d")
BOOT = hex_color("#59412c")
WING = hex_color("#98aa48")
WING_LIGHT = hex_color("#ced06b")
WING_DARK = hex_color("#627e35")
WING_EDGE = hex_color("#b5a94d")
WING_VEIN = hex_color("#65703a")
TWIG = hex_color("#685037")
PAPER = hex_color("#d8b989")
PAPER_LIGHT = hex_color("#ecd5a7")
PAPER_DARK = hex_color("#a9855e")
TWINE = hex_color("#826443")
SEAL = hex_color("#a93632")
SEAL_DARK = hex_color("#702a28")
SEAL_LIGHT = hex_color("#d56851")
BREAD = hex_color("#f0d79c")
CRUST = hex_color("#b57b3f")
LETTUCE = hex_color("#76a844")
CHEESE = hex_color("#edc34e")
FLOWER = hex_color("#f1e8ce")

# --- Proportions ---------------------------------------------------------------

# A small, light elf. Her feet just touch the ground in the rest pose.
HIP_Z = 0.43
WAIST_Z = 0.5
CHEST_Z = 0.585
SHOULDER_Z = 0.665
NECK_Z = 0.7
HEAD_C = Vector((0, -0.012, 0.805))
KNEE_Z = 0.245
ANKLE_Z = 0.05
LEG_X = 0.047

# The right arm carries the parcel forward on the camera side (-X). The left
# arm reaches out and back for balance.
SR = Vector((-0.095, 0, SHOULDER_Z))
ER = Vector((-0.14, -0.055, 0.59))
WR = Vector((-0.145, -0.16, 0.575))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
SL = Vector((0.095, 0, SHOULDER_Z))
EL = Vector((0.16, 0.005, 0.59))
WL = Vector((0.205, -0.02, 0.52))
DL = (WL - EL).normalized()
TL = WL + DL * 0.05

PARCEL_C = Vector((-0.17, -0.218, 0.62))
PARCEL_SIZE = Vector((0.105, 0.075, 0.09))
SATCHEL_C = Vector((-0.092, 0.018, 0.445))

# Each fern is in a side-facing plane, not across the Lane. Its central rachis
# rises out and up; the long back leaflets make the front-to-back silhouette.
WING_ROOT = Vector((0, 0.085, 0.635))
WING_FLARE = math.radians(14)
WING_TIP = 0.5
WING_BACK = 0.43

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.004, NECK_Z), (0, -0.008, 0.742), "chest"),
    ("head", (0, -0.008, 0.742), (0, -0.012, 0.895), "neck"),
    ("hair", (0, 0.052, 0.82), (0, 0.13, 0.68), "head"),
    ("satchel", tuple(SATCHEL_C), tuple(SATCHEL_C - Z * 0.1), "hips"),
]
for side, sign in (("L", 1), ("R", -1)):
    root = WING_ROOT + Vector((0.022 * sign, 0, 0))
    out = Vector((math.sin(WING_FLARE) * sign, 0, math.cos(WING_FLARE)))
    BONES.append((f"wing.{side}", tuple(root), tuple(root + out * 0.2 + Y * 0.06), "chest"))
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.028 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.085, 0.02), f"shin.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.46, 0.54)
    return blend("spine", "chest", co.z, 0.56, 0.63)


def hair_weights(co):
    back = clamp01((co.y - 0.025) / 0.05) * clamp01((0.83 - co.z) / 0.06)
    return {"head": 1 - back, "hair": back}


def wing_weights(sign):
    side = "L" if sign > 0 else "R"

    def weights(co):
        t = clamp01(((co - WING_ROOT).length - 0.025) / 0.06)
        return {"chest": 1 - t, f"wing.{side}": t}

    return weights


# --- Parts ---------------------------------------------------------------------


def leaf(part, base, direction, length, width, color):
    """A thick, pointed leaf for the clothing, hair and small leather wraps."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.001, 4, squash=0.24)
    part.paint(faces_of(verts), color)
    return verts


def triangle_slice(part, points, normal, thickness, color, edge_color):
    """A triangular prism, used for the visible layers of the sandwich."""
    normal = Vector(normal).normalized()
    front = [part.bm.verts.new(Vector(p) + normal * thickness / 2) for p in points]
    back = [part.bm.verts.new(Vector(p) - normal * thickness / 2) for p in points]
    part.paint([part.bm.faces.new(front)], color)
    part.paint([part.bm.faces.new(list(reversed(back)))], color)
    edges = []
    for index in range(3):
        following = (index + 1) % 3
        edges.append(part.bm.faces.new((front[index], back[index], back[following], front[following])))
    part.paint(edges, edge_color)


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.056, 0.061, 0.07), 14, 10)
    nose = kit.cone(head.bm, HEAD_C + Vector((0, -0.056, -0.004)), HEAD_C + Vector((0, -0.075, -0.012)), 0.009, 0.0015, 5)
    head.paint(faces_of(nose), SKIN_SHADE)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.05 * sign, 0.006, -0.003)), HEAD_C + Vector((0.112 * sign, 0.035, 0.043)), 0.014, 0.001, 5, squash=0.4)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.021 * sign, -0.055, 0.007)), (0.01, 0.006, 0.007), 8, 6)
        glint = kit.sphere(face.bm, HEAD_C + Vector((0.019 * sign, -0.060, 0.01)), (0.0025, 0.0015, 0.0025), 5, 4)
        face.paint(faces_of(glint), EYE_LIGHT)
        # The inner ends of the brows are low: a keen, determined expression.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.023 * sign, -0.058, 0.024)), (0.014, 0, 0.004 * sign), (0, 0.004, 0), (0, 0, 0.003))
        face.paint(faces_of(brow), HAIR_DARK)
    mouth = kit.slab(face.bm, HEAD_C + Vector((0, -0.059, -0.027)), (0.012, 0, -0.0015), (0, 0.002, 0), (0, 0, 0.0014))
    face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.004, 0.675), (0, -0.008, 0.755), 0.022, 0.02, 8)
    parts.append(neck)

    # A close cap and swept-back leaves make the hair part of the leaf spirit.
    hair = Part("hair", HAIR, hair_weights, shade=0.1)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.009, 0.013)), (0.063, 0.068, 0.075), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.032 or (v.co.y < HEAD_C.y - 0.034 and v.co.z < HEAD_C.z + 0.043)]
    kit.bmesh.ops.delete(hair.bm, geom=face_verts, context="VERTS")
    for index, angle in enumerate(range(-135, 136, 30)):
        a = math.radians(angle)
        base = HEAD_C + Vector((0.052 * math.sin(a), 0.052 * math.cos(a) + 0.012, 0.04))
        direction = Vector((0.32 * math.sin(a), 0.75, -0.65 if abs(angle) < 90 else -0.4))
        leaf(hair, base, direction, 0.12 if abs(angle) < 90 else 0.09, 0.019, (HAIR_LIGHT, HAIR, HAIR_DARK)[index % 3])
    for x, direction in ((-0.025, (-0.25, -0.2, 1)), (0.0, (0.1, 0.2, 1)), (0.025, (0.4, 0.25, 1))):
        leaf(hair, HEAD_C + Vector((x, -0.005, 0.065)), direction, 0.05, 0.014, HAIR_LIGHT)
    # One small cream flower above the camera-side ear.
    flower_c = HEAD_C + Vector((-0.047, -0.012, 0.061))
    for index in range(5):
        a = index * 2 * math.pi / 5
        petal = kit.sphere(hair.bm, flower_c + Vector((0.009 * math.cos(a), -0.003, 0.009 * math.sin(a))), (0.006, 0.003, 0.006), 6, 4)
        hair.paint(faces_of(petal), FLOWER)
    center = kit.sphere(hair.bm, flower_c + Vector((0, -0.006, 0)), (0.004, 0.003, 0.004), 6, 4)
    hair.paint(faces_of(center), BRASS)
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", LEAF_DARK, torso_weights, shade=0.14)
    kit.cone(tunic.bm, (0, 0, 0.42), (0, 0, 0.695), 0.061, 0.074, 12, squash=0.74)
    parts.append(tunic)

    # Overlapping leaves make a fitted vest and a deep collar, not cloth with
    # a leaf print. Their large pointed ends remain clear at game scale.
    vest = Part("leaf-vest", LEAF, torso_weights, shade=0.1)
    for sign in (1, -1):
        leaf(vest, (0.042 * sign, -0.046, 0.675), (0.08 * sign, -0.12, -1), 0.18, 0.027, LEAF_LIGHT)
        leaf(vest, (0.024 * sign, -0.058, 0.58), (0.12 * sign, -0.08, -1), 0.13, 0.024, LEAF)
    for index, angle in enumerate(range(0, 360, 45)):
        a = math.radians(angle)
        base = Vector((0.026 * math.sin(a), -0.026 * math.cos(a), 0.695))
        direction = Vector((0.85 * math.sin(a), -0.85 * math.cos(a), -0.5))
        leaf(vest, base, direction, 0.095, 0.024, (LEAF_LIGHT, LEAF, LEAF_DARK)[index % 3])
    parts.append(vest)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.06)
    kit.cone(belt.bm, (0, 0, 0.425), (0, 0, 0.455), 0.071, 0.068, 12, squash=0.78)
    buckle = kit.box(belt.bm, (0, -0.056, 0.44), (0.02, 0.007, 0.018))
    belt.paint(faces_of(buckle), BRASS)
    parts.append(belt)

    def skirt_color(row, column):
        if row == 2:
            return LEAF_EDGE
        return LEAF_DARK if column % 3 == 1 else LEAF

    skirt = Part("leaf-skirt", LEAF, "hips")
    kit.ragged_cone(skirt, 0.435, 0.335, 0.068, 0.092, 12, 3, 0.78, 0.038, skirt_color, LEAF_DARK)
    for index, angle in enumerate(range(0, 360, 45)):
        a = math.radians(angle)
        base = Vector((0.064 * math.sin(a), -0.052 * math.cos(a), 0.425))
        direction = Vector((0.42 * math.sin(a), -0.42 * math.cos(a), -1))
        leaf(skirt, base, direction, 0.115, 0.026, (LEAF, LEAF_LIGHT, LEAF_DARK)[index % 3])
    parts.append(skirt)

    # The diagonal strap goes to the satchel on the camera-side hip.
    strap = Part("satchel-strap", LEATHER, torso_weights, shade=0.05)
    kit.tube(strap.bm, [(0.065, -0.035, 0.675), (0.025, -0.06, 0.595), (-0.04, -0.059, 0.51), (-0.084, -0.02, 0.46)], [0.007] * 4, 4)
    kit.tube(strap.bm, [(0.065, 0.035, 0.675), (0.025, 0.065, 0.59), (-0.04, 0.06, 0.51), (-0.084, 0.045, 0.46)], [0.006] * 4, 4)
    clasp = kit.box(strap.bm, (-0.02, -0.065, 0.54), (0.015, 0.006, 0.017))
    strap.paint(faces_of(clasp), BRASS)
    parts.append(strap)

    satchel = Part("satchel", LEATHER, "satchel", shade=0.1)
    kit.sphere(satchel.bm, SATCHEL_C, (0.034, 0.063, 0.059), 10, 7)
    flap = kit.slab(satchel.bm, SATCHEL_C + Vector((-0.03, 0, 0.025)), (0.008, 0, 0), (0, 0.058, 0), (0, 0, 0.025))
    satchel.paint(faces_of(flap), LEATHER_DARK)
    # A rubbed patch, a buckle and uneven stitches show that the bag is old.
    patch = kit.box(satchel.bm, SATCHEL_C + Vector((-0.035, 0.024, -0.022)), (0.005, 0.031, 0.025))
    satchel.paint(faces_of(patch), LEATHER_WORN)
    buckle = kit.box(satchel.bm, SATCHEL_C + Vector((-0.041, -0.016, 0.0)), (0.006, 0.018, 0.022))
    satchel.paint(faces_of(buckle), BRASS)
    for y in (-0.047, 0.047):
        kit.tube(satchel.bm, [SATCHEL_C + Vector((-0.039, y, 0.04)), SATCHEL_C + Vector((-0.04, y, -0.005))], [0.0018, 0.0018], 3)
    for index in range(4):
        y = -0.038 + index * 0.023
        kit.tube(satchel.bm, [SATCHEL_C + Vector((-0.04, y, -0.035)), SATCHEL_C + Vector((-0.041, y + 0.009, -0.029))], [0.0016, 0.0016], 3)
    parts.append(satchel)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, d) in (("L", 1, (SL, EL, WL, DL)), ("R", -1, (SR, ER, WR, DR))):
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}", shade=0.1)
        kit.sphere(upper.bm, s + Vector((0.003 * sign, 0, -0.003)), (0.027, 0.027, 0.026), 8, 6)
        kit.cone(upper.bm, s, e, 0.022, 0.019, 8)
        leaf(upper, s + Vector((0, 0.005, 0.012)), e - s, 0.075, 0.026, LEAF)
        parts.append(upper)

        bracer = Part(f"bracer.{side}", LEAF_DARK, f"forearm.{side}", shade=0.08)
        kit.cone(bracer.bm, e + d * 0.012, w, 0.021, 0.017, 8)
        leaf(bracer, (e + w) / 2 + Vector((0.008 * sign, 0, 0.014)), -d, 0.052, 0.016, LEAF_LIGHT)
        band = kit.cone(bracer.bm, w - d * 0.018, w - d * 0.008, 0.019, 0.019, 8)
        bracer.paint(faces_of(band), LEATHER)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        hand_c = w + d * 0.023
        kit.sphere(hand.bm, hand_c, (0.016, 0.016, 0.019), 8, 6)
        if side == "R":
            # The thumb closes over the lower back edge of the parcel.
            kit.tube(hand.bm, [hand_c + Vector((0.01, 0, 0.004)), PARCEL_C + Vector((0.046, 0.035, -0.028))], [0.006, 0.004], 5)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}", shade=0.1)
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.018)), knee, 0.034, 0.026, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", LEG_wrap, f"shin.{side}", shade=0.1)
        kit.cone(boot.bm, knee + Vector((0, 0, 0.015)), ankle, 0.032, 0.024, 8)
        for z in (0.1, 0.17, 0.225):
            strap = kit.torus(boot.bm, (LEG_X * sign, 0, z), (0, 0.25, 1), 0.029, 0.0035, 10, 3)
            boot.paint(faces_of(strap), LEATHER_DARK)
        leaf(boot, knee + Vector((0, -0.026, 0.0)), (0, -0.25, -1), 0.11, 0.023, LEAF)
        leaf(boot, knee + Vector((0.01 * sign, 0.015, -0.03)), (0.25 * sign, 0.2, -1), 0.09, 0.019, LEAF_LIGHT)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.024), (0.046, 0.105, 0.046))
        leaf(foot, (LEG_X * sign, 0.005, 0.047), (0, -1, -0.15), 0.085, 0.022, LEAF_DARK)
        parts.append(foot)
    return parts


def parcel_parts():
    """The official parcel and its impossible-to-resist sandwich corner."""
    parcel = Part("parcel", PAPER, "hand.R", smooth=False, shade=0.05)
    kit.box(parcel.bm, PARCEL_C, PARCEL_SIZE)
    hx, hy, hz = PARCEL_SIZE / 2
    camera_x = PARCEL_C.x - hx - 0.002
    front_y = PARCEL_C.y - hy - 0.002

    # Fold lines on the paper, then twine round both visible faces.
    fold = kit.box(parcel.bm, (camera_x - 0.001, PARCEL_C.y + 0.018, PARCEL_C.z), (0.002, 0.002, 0.081))
    parcel.paint(faces_of(fold), PAPER_DARK)
    for z in (PARCEL_C.z - 0.026, PARCEL_C.z + 0.026):
        line = kit.box(parcel.bm, (PARCEL_C.x, front_y, z), (0.096, 0.002, 0.002))
        parcel.paint(faces_of(line), PAPER_LIGHT)
    band = kit.box(parcel.bm, (camera_x - 0.002, PARCEL_C.y, PARCEL_C.z), (0.004, 0.075, 0.006))
    parcel.paint(faces_of(band), TWINE)
    band = kit.box(parcel.bm, (camera_x - 0.002, PARCEL_C.y, PARCEL_C.z), (0.004, 0.006, 0.09))
    parcel.paint(faces_of(band), TWINE)
    band = kit.box(parcel.bm, (PARCEL_C.x, front_y - 0.001, PARCEL_C.z), (0.006, 0.003, 0.09))
    parcel.paint(faces_of(band), TWINE)
    band = kit.box(parcel.bm, (PARCEL_C.x, front_y - 0.001, PARCEL_C.z), (0.105, 0.003, 0.006))
    parcel.paint(faces_of(band), TWINE)

    # The red wax seal sits on the camera face, clear of the sandwich corner.
    seal_c = Vector((camera_x - 0.004, PARCEL_C.y - 0.006, PARCEL_C.z + 0.003))
    seal = kit.cone(parcel.bm, seal_c, seal_c - X * 0.006, 0.014, 0.013, 10)
    parcel.paint(faces_of(seal), SEAL)
    stamp = kit.cone(parcel.bm, seal_c - X * 0.006, seal_c - X * 0.007, 0.006, 0.006, 8)
    parcel.paint(faces_of(stamp), SEAL_DARK)
    mark = kit.box(parcel.bm, seal_c - X * 0.008, (0.002, 0.009, 0.0025))
    parcel.paint(faces_of(mark), SEAL_LIGHT)

    # A peeled corner reveals a triangular sandwich. Its face points between
    # the front and the camera, so the bread and filling remain readable.
    normal = Vector((-0.72, -0.69, 0.08)).normalized()
    across = Z.cross(normal).normalized()
    up = normal.cross(across).normalized()
    if up.z < 0:
        up = -up
    center = PARCEL_C + Vector((-0.047, -0.043, 0.052))
    a = center - across * 0.027 - up * 0.018
    b = center + across * 0.029 - up * 0.018
    c = center - across * 0.027 + up * 0.03
    opening = [a - across * 0.004 - up * 0.003, b + across * 0.004 - up * 0.003, c - across * 0.004 + up * 0.003]
    triangle_slice(parcel, [p - normal * 0.012 for p in opening], normal, 0.003, PAPER_DARK, PAPER_DARK)
    triangle_slice(parcel, [p - normal * 0.006 for p in (a, b, c)], normal, 0.005, BREAD, CRUST)
    cheese = [a - up * 0.005, b + across * 0.003 - up * 0.005, c + up * 0.002]
    triangle_slice(parcel, [p + normal * 0.001 for p in cheese], normal, 0.003, CHEESE, CHEESE)
    # A ruffled strip of lettuce projects below the cheese.
    grid = []
    for row in range(2):
        line = []
        for index in range(7):
            u = index / 6
            point = a.lerp(b, u) + normal * 0.004 - up * (0.003 + row * (0.006 + 0.003 * (index % 2)))
            line.append(point)
        grid.append(line)
    _, lettuce = kit.sheet(parcel.bm, grid)
    for face, _row, _column in lettuce:
        parcel.paint([face], LETTUCE)
    triangle_slice(parcel, [p + normal * 0.009 for p in (a, b, c)], normal, 0.005, BREAD, CRUST)
    return [parcel]


def fern_leaflet(part, base, tip, width, normal, color):
    """One pointed, cambered fern leaflet with a raised central vein."""
    base, tip, normal = Vector(base), Vector(tip), Vector(normal)
    direction = (tip - base).normalized()
    across = direction.cross(normal).normalized()
    rows, columns = 3, 2

    def grid(depth):
        result = []
        for row in range(rows + 1):
            u = row / rows
            half = width * math.sin(math.pi * u) ** 0.7 * (1 - 0.18 * u)
            center = base.lerp(tip, u)
            line = []
            for column in range(columns + 1):
                v = column - 1
                camber = 0.005 * math.sin(math.pi * u) * (1 - v * v)
                line.append(center + across * (v * half) + normal * (camber + depth))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if face_side == "back":
            return WING_DARK
        if column == 0:
            return WING_LIGHT
        return color

    edges = panel(part, grid(0.002), grid(-0.002), color_of)
    part.paint(edges, WING_EDGE)
    vein = kit.tube(part.bm, [base + normal * 0.004, base.lerp(tip, 0.55) + normal * 0.008, tip + normal * 0.003], [0.0024, 0.0018, 0.0007], 3)
    part.paint(faces_of(vein), WING_VEIN)


def wing_parts():
    parts = []
    for sign in (1, -1):
        side = "L" if sign > 0 else "R"
        out = Vector((math.sin(WING_FLARE) * sign, 0, math.cos(WING_FLARE)))
        normal = Vector((math.cos(WING_FLARE) * sign, 0, -math.sin(WING_FLARE)))
        root = WING_ROOT + Vector((0.022 * sign, 0, 0))
        tip = root + out * WING_TIP + Y * 0.02
        fern = Part(f"fern.{side}", WING, wing_weights(sign), smooth=False, shade=0.0)

        def rachis(u):
            return root.lerp(tip, u) - Y * (0.025 * math.sin(math.pi * u))

        # Separate paired leaflets overlap along the midrib. Their decreasing
        # lengths make a long triangular fern, never a round butterfly wing.
        for index in range(10):
            u = 0.08 + index * 0.088
            base = rachis(u) + normal * (0.002 * (index % 2))
            factor = (1 - u) ** 0.72
            back_tip = base + Y * (WING_BACK * factor) + out * (0.09 * (1 - u))
            # Short front leaflets: the wing stays behind her face in the game view.
            front_tip = base - Y * (0.06 * factor) + out * (0.06 * (1 - u))
            color = (WING, WING_DARK, WING_LIGHT)[index % 3]
            fern_leaflet(fern, base, back_tip, 0.026 * factor + 0.005, normal, color)
            fern_leaflet(fern, base, front_tip, 0.02 * factor + 0.004, normal, WING if index % 2 else WING_LIGHT)
        fern_leaflet(fern, rachis(0.82), tip + out * 0.035, 0.018, normal, WING_LIGHT)
        spar = kit.tube(fern.bm, [rachis(u) + normal * 0.006 for u in (0.0, 0.25, 0.5, 0.75, 1.0)] + [tip + out * 0.04], [0.009, 0.008, 0.006, 0.004, 0.002, 0.0008], 5)
        fern.paint(faces_of(spar), TWIG)
        parts.append(fern)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("FernwingCourier", BONES)
    parts = head_parts() + body_parts() + limb_parts() + parcel_parts() + wing_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "FernwingCourierMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------

# How high her feet hang above the ground at rest.
FLOAT = 0.14


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

    def wings(beat, fold=0.0, sweep=0.0):
        """Beat the narrow V, sweep it above a dive, or fold it for a fall."""
        return {
            "wing.L": t("wing.L", (Y, -12 * beat - 36 * fold), (X, 20 * fold - sweep)),
            "wing.R": t("wing.R", (Y, 12 * beat + 36 * fold), (X, 20 * fold - sweep)),
            "wing.L@scale": lerp(1.0, 0.28, fold),
            "wing.R@scale": lerp(1.0, 0.28, fold),
        }

    def stand(bob=0.0, beat=0.0, sway=0.0):
        """The hover: toes down, parcel forward, eyes on the destination."""
        return {
            "root@loc": at("root", (0, 0, FLOAT + 0.018 * bob)),
            "hips": t("hips", (X, 9), (Y, sway * 2)),
            "spine": t("spine", (X, 5)),
            "chest": t("chest", (X, -5), (Z, -8)),
            "neck": t("neck", (X, -4), (Z, -3)),
            "head": t("head", (Z, -7 + sway * 3), (X, -7 + bob * 2)),
            "hair": t("hair", (X, -8 - bob * 4), (Y, sway * 4)),
            "satchel": t("satchel", (X, -5 + bob * 5), (Y, sway * 5)),
            **wings(beat),
            "upperarm.R": t("upperarm.R", (X, -9 - bob * 2), (Y, -4)),
            "forearm.R": t("forearm.R", (X, -5)),
            "upperarm.L": t("upperarm.L", (Y, 13 + bob * 3), (X, 14)),
            "forearm.L": t("forearm.L", (X, -18)),
            "thigh.L": t("thigh.L", (X, -24 + sway * 4), (Y, -4)),
            "shin.L": t("shin.L", (X, 52)),
            "foot.L": t("foot.L", (X, 40)),
            "thigh.R": t("thigh.R", (X, 3 - sway * 4), (Y, 4)),
            "shin.R": t("shin.R", (X, 35)),
            "foot.R": t("foot.R", (X, 45)),
        }

    def slump(bob=0.0):
        """Low HP: she sinks, clutching the parcel while the ferns droop."""
        return pose(
            stand(),
            root_at_loc=at("root", (0, 0, FLOAT * 0.48 + 0.012 * bob)),
            hips=t("hips", (X, 3)),
            spine=t("spine", (X, 15 + bob * 3)),
            chest=t("chest", (X, 8), (Z, -8)),
            head=t("head", (Z, -7), (X, 16 + bob * 3), (Y, 8)),
            hair=t("hair", (X, 14)),
            satchel=t("satchel", (X, 10)),
            **wings(-0.8 + bob * 0.35, 0.16),
            upperarm__R=t("upperarm.R", (X, 20), (Y, -8)),
            forearm__R=t("forearm.R", (X, -12)),
            upperarm__L=t("upperarm.L", (Y, 5), (X, 5)),
            thigh__L=t("thigh.L", (X, -5), (Y, -4)),
            shin__L=t("shin.L", (X, 20)),
            thigh__R=t("thigh.R", (X, 5), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
        )

    def recoil(base, amount=1.0):
        """A hit knocks her back; the wings jolt open and the satchel swings."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.05 * amount, FLOAT + 0.03 * amount)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, -4)),
            head=t("head", (Z, -7), (X, -17 * amount)),
            hair=t("hair", (X, 16 * amount)),
            satchel=t("satchel", (X, 30 * amount)),
            **wings(1.25 * amount),
            upperarm__R=t("upperarm.R", (X, 18 * amount), (Y, -18 * amount)),
            upperarm__L=t("upperarm.L", (Y, 30 * amount), (X, 10)),
            thigh__L=t("thigh.L", (X, -38 * amount)),
            thigh__R=t("thigh.R", (X, -18 * amount)),
        )

    def tumble(base):
        """The ferns fold, and she drops without releasing the parcel."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.04, FLOAT * 0.5)),
            root=t("root", (X, -20)),
            spine=t("spine", (X, -10)),
            head=t("head", (X, -24)),
            hair=t("hair", (X, 30)),
            satchel=t("satchel", (X, 38)),
            **wings(-0.5, 0.65),
            upperarm__R=t("upperarm.R", (X, -58), (Y, -38)),
            upperarm__L=t("upperarm.L", (X, -38), (Y, 38)),
            thigh__L=t("thigh.L", (X, -48)),
            shin__L=t("shin.L", (X, 68)),
            thigh__R=t("thigh.R", (X, -28)),
            shin__R=t("shin.R", (X, 58)),
        )

    def fallen(base, bounce=0.0):
        """On her back on the ground, the folded ferns beneath her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4), (Z, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -28)),
            hair=t("hair", (X, -38)),
            satchel=t("satchel", (X, -35)),
            **wings(0.0, 1.0),
            upperarm__R=t("upperarm.R", (X, -145), (Y, -20)),
            forearm__R=t("forearm.R", (X, 0)),
            upperarm__L=t("upperarm.L", (Y, 40), (X, -20)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -6), (Y, 6)),
            shin__R=t("thigh.R", (X, 12)),
            foot__R=t("foot.R", (X, 10)),
        )

    def crouch(base, open_amount=0.3):
        """A ground crouch starts a summon and lets a Rebirth stand up."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, 0.0)),
            hips=t("hips", (X, 0)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, -8)),
            **wings(-0.6, 1 - open_amount),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -10)),
            thigh__L=t("thigh.L", (X, -68), (Y, -6)),
            shin__L=t("shin.L", (X, 108)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -58), (Y, 6)),
            shin__R=t("shin.R", (X, 116)),
            foot__R=t("foot.R", (X, -48)),
        )

    def leap(base):
        """The ferns open and lift her, with the official parcel held high."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, FLOAT + 0.065)),
            chest=t("chest", (X, -12), (Z, -8)),
            head=t("head", (Z, -9), (X, -15)),
            **wings(1.4),
            upperarm__R=t("upperarm.R", (X, -92), (Y, -18)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, 48)),
            thigh__L=t("thigh.L", (X, -48)),
            shin__L=t("shin.L", (X, 78)),
        )

    def glide(phase):
        """Swift: a 16-frame glide, with fast wing beats and small leg kicks."""
        a = 2 * math.pi * phase
        return pose(
            stand(math.sin(a), math.sin(2 * a), math.sin(a + 1)),
            root_at_loc=at("root", (0, 0, FLOAT + 0.025 * math.sin(2 * a))),
            hips=t("hips", (X, 25)),
            spine=t("spine", (X, 14)),
            chest=t("chest", (X, -4), (Z, -8)),
            head=t("head", (X, -23), (Z, -7)),
            hair=t("hair", (X, 22)),
            satchel=t("satchel", (X, 28 + 10 * math.sin(a)), (Y, 8 * math.sin(a))),
            **wings(math.sin(2 * a), 0.0, 35),
            upperarm__L=t("upperarm.L", (Y, 28), (X, 24)),
            thigh__L=t("thigh.L", (X, -12 + 20 * math.sin(a)), (Y, -4)),
            shin__L=t("shin.L", (X, 48 - 10 * math.sin(a))),
            thigh__R=t("thigh.R", (X, -12 - 20 * math.sin(a)), (Y, 4)),
            shin__R=t("shin.R", (X, 48 + 10 * math.sin(a))),
        )

    # The melee effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts).
    # The parcel-led ram therefore reaches the target at frame 15 of 30.
    def rise(base):
        return pose(
            base,
            root_at_loc=at("root", (0, 0.06, FLOAT + 0.09)),
            root=t("root", (X, -10)),
            chest=t("chest", (X, -12), (Z, -14)),
            head=t("head", (Z, -4), (X, -6)),
            hair=t("hair", (X, -12)),
            **wings(1.35),
            upperarm__R=t("upperarm.R", (X, 38), (Y, -22)),
            forearm__R=t("forearm.R", (X, -38)),
            upperarm__L=t("upperarm.L", (Y, 30), (X, -20)),
            thigh__L=t("thigh.L", (X, -38)),
            shin__L=t("shin.L", (X, 68)),
            thigh__R=t("thigh.R", (X, -18)),
            shin__R=t("shin.R", (X, 58)),
        )

    def ram(base, amount=1.0):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.25 * amount, FLOAT - 0.065 * amount)),
            root=t("root", (X, 28 * amount)),
            hips=t("hips", (X, 0)),
            chest=t("chest", (X, 4), (Z, 5)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -23), (Z, -4)),
            hair=t("hair", (X, 32)),
            satchel=t("satchel", (X, 45)),
            **wings(-1.0, 0.24, 32),
            upperarm__R=t("upperarm.R", (X, -58 * amount), (Y, -5)),
            forearm__R=t("forearm.R", (X, 28 * amount)),
            upperarm__L=t("upperarm.L", (Y, 22), (X, 40)),
            thigh__L=t("thigh.L", (X, 20)),
            shin__L=t("shin.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 30)),
            shin__R=t("shin.R", (X, 20)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 4):
        a = 2 * math.pi * frame / 48
        idle.key(frame, stand(math.sin(a), math.sin(4 * a), math.sin(a + 1.2)))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame in range(0, 49, 8):
        a = 2 * math.pi * frame / 48
        low.key(frame, slump(math.sin(a)))
    clips.append(low)

    walk = Clip("walk", 16, loop=True)
    for frame in range(0, 17, 2):
        walk.key(frame, glide(frame / 16))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(7, rise(stand())).key(11, rise(stand()))
    attack.key(15, ram(stand())).key(18, ram(stand(), 0.82))
    attack.key(25, stand(0.5, 0.8)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, tumble(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls, then the ferns open and lift her again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(12, tumble(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand(), 0.3)).key(41, leap(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(), 0.0)).key(8, crouch(stand(), 0.6)).key(16, leap(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "fernwing-courier.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
