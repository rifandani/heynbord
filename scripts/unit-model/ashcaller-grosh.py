"""
Ashcaller Grosh (`orc.ashcallerGrosh`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an orc fire mage with white face
paint and long dark locks, a ragged red and brown robe with brass charms, a
burning staff in the left hand and a flame over the open right hand. Run it
in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/ashcaller-grosh.glb`; then
`bun unit-model:pack ashcaller-grosh` packs it for the game.

The Battle camera sees the right side of a player Unit, so the flame hand is
on that side, and the staff stands behind it.
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

SKIN = hex_color("#93915a")
SKIN_DARK = hex_color("#6f6c40")
PAINT = hex_color("#ece6d4")
HAIR = hex_color("#2b1e17")
HAIR_LIGHT = hex_color("#4a3326")
EYES = hex_color("#1a120c")
TUSK = hex_color("#e9dcbc")
RED = hex_color("#a5312a")
RED_DARK = hex_color("#6a1f1b")
RAG = hex_color("#8d6a48")
BROWN = hex_color("#55331f")
CLOTH_DARK = hex_color("#3c2721")
WRAP = hex_color("#7d4a32")
BRASS = hex_color("#c99a42")
BRASS_DARK = hex_color("#8b6528")
LEATHER = hex_color("#5a3622")
WOOD = hex_color("#3d2a1d")
EMBER = hex_color("#ff5e1a")
FLAME = hex_color("#ffa22b")
FLAME_CORE = hex_color("#ffe7a0")
GLASS = hex_color("#f2a743")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.46
WAIST_Z = 0.54
CHEST_Z = 0.64
SHOULDER_Z = 0.73
NECK_Z = 0.77
HEAD_C = Vector((0, -0.012, 0.872))
KNEE_Z = 0.26
ANKLE_Z = 0.055
LEG_X = 0.064

# The left hand holds the staff in front of the hip; the right arm hangs in an
# A-pose. These are the rest (bind) positions.
SL = Vector((0.14, 0, SHOULDER_Z))
EL = Vector((0.205, 0.01, 0.585))
WL = Vector((0.22, -0.1, 0.56))
TL = WL + (WL - EL).normalized() * 0.05
GRIP_L = WL + (WL - EL).normalized() * 0.03

ARM_DIR = Vector((-math.sin(math.radians(22)), 0, -math.cos(math.radians(22))))
SR = Vector((-0.14, 0, SHOULDER_Z))
ER = SR + ARM_DIR * 0.16
WR = ER + ARM_DIR * 0.15
TR = WR + ARM_DIR * 0.055
# The flame sits on the palm.
PALM_R = WR + ARM_DIR * 0.03 + Vector((0, -0.03, 0))

STAFF_BOTTOM = 0.0
STAFF_TOP = 1.02

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.8), "chest"),
    ("head", (0, 0, 0.8), (0, 0, 0.96), "neck"),
    ("locks", (0, 0.06, 0.84), (0, 0.09, 0.62), "head"),
    ("robe.B", (0, 0.07, 0.5), (0, 0.12, 0.12), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.09, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("staff", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    # The flame always points up (the `Up` constraint), as a fire does.
    ("flame", tuple(PALM_R), tuple(PALM_R + Vector((0, 0, 0.06))), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def robe_weights(co):
    """The long robe follows the hips at the top, and the legs and its back panel lower."""
    t = clamp01((0.52 - co.z) / 0.42)
    back = clamp01((co.y - 0.0) / 0.1)
    side = co.x / 0.14
    return {
        "hips": 1 - t,
        "robe.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side) * 0.9,
        "thigh.R": (1 - back) * t * clamp01(-side) * 0.9,
    }


def locks_weights(co):
    return blend("locks", "head", co.z, 0.79, 0.84)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    verts = kit.sphere(head.bm, HEAD_C, (0.07, 0.074, 0.08), 14, 10)
    # The white face paint: the brow, a band over the eyes and lines down the cheeks.
    for face in faces_of(verts):
        c = face.calc_center_median()
        if c.y > -0.035:
            continue
        brow = c.z > 0.89 and (abs(c.x) < 0.01 or 0.022 < abs(c.x) < 0.036)
        cheek = 0.83 < c.z < 0.875 and 0.02 < abs(c.x) < 0.034
        if brow or cheek:
            head.paint([face], PAINT)
    # A heavy jaw and a broad nose.
    jaw = kit.sphere(head.bm, (0, -0.032, 0.83), (0.062, 0.05, 0.04), 12, 6)
    head.paint(faces_of(jaw), SKIN)
    kit.cone(head.bm, (0, -0.074, 0.872), (0, -0.09, 0.85), 0.017, 0.006, 5)
    for sign in (1, -1):
        # Orc ears: long points that go out and a little back.
        kit.cone(head.bm, (0.064 * sign, 0.004, 0.872), (0.14 * sign, 0.03, 0.9), 0.02, 0.002, 5, squash=0.4)
    parts.append(head)

    brows = Part("brows", SKIN_DARK, "head", shade=0)
    for sign in (1, -1):
        kit.box(brows.bm, (0.028 * sign, -0.068, 0.886), (0.032, 0.014, 0.01))
    parts.append(brows)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.026 * sign, -0.068, 0.872), (0.009, 0.006, 0.007), 6, 5)
    parts.append(eyes)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, (0.03 * sign, -0.07, 0.818), (0.036 * sign, -0.078, 0.848), 0.007, 0.001, 5)
    parts.append(tusks)

    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.006, 0.885), (0.075, 0.079, 0.084), 14, 10)
    face = [v for v in verts if v.co.z < 0.84 or (v.co.y < -0.03 and v.co.z < 0.93)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    parts.append(hair)

    locks = Part("locks", HAIR, locks_weights)
    # Long locks hang down the back and over the shoulders.
    for index, angle in enumerate(range(-120, 121, 30)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.07 * math.sin(a), 0.07 * math.cos(a) + 0.01, 0.0))
        length = 0.2 if abs(angle) < 60 else 0.15
        bottom = top + Vector((0.03 * math.sin(a), 0.03 * math.cos(a) + 0.02, -length))
        middle = (top + bottom) / 2 + Vector((0.01 * math.sin(a), 0.012, 0))
        verts = kit.tube(locks.bm, [top, middle, bottom], [0.014, 0.012, 0.007], 5)
        if index % 2:
            locks.paint(faces_of(verts), HAIR_LIGHT)
    parts.append(locks)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.75), (0, 0, 0.83), 0.036, 0.034, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", BROWN, torso_weights)
    kit.cone(tunic.bm, (0, 0, 0.5), (0, 0, 0.75), 0.1, 0.118, 14, squash=0.76)
    parts.append(tunic)

    def mantle_color(row, column):
        if column % 4 == 1:
            return RAG
        return RED if row < 3 else RED_DARK

    # A ragged mantle over the shoulders, down to the belt.
    mantle = Part("mantle", RED, "chest")
    kit.ragged_cone(mantle, 0.79, 0.57, 0.06, 0.15, 16, 4, 0.82, 0.05, mantle_color, CLOTH_DARK)
    parts.append(mantle)

    collar = Part("collar", RED_DARK, "chest")
    kit.torus(collar.bm, (0, 0.004, 0.775), (0, 0.15, 1), 0.052, 0.018, 12, 5)
    parts.append(collar)

    # The brass medallion on the chest, on a cord.
    medallion = Part("medallion", BRASS, "chest", shade=0.05)
    kit.cone(medallion.bm, (0, -0.118, 0.64), (0, -0.128, 0.64), 0.03, 0.03, 12)
    boss = kit.cone(medallion.bm, (0, -0.127, 0.64), (0, -0.133, 0.64), 0.014, 0.01, 8)
    medallion.paint(faces_of(boss), BRASS_DARK)
    kit.tube(medallion.bm, [(0.04, -0.1, 0.76), (0.03, -0.12, 0.69), (0, -0.124, 0.67)], [0.003] * 3, 4)
    kit.tube(medallion.bm, [(-0.04, -0.1, 0.76), (-0.03, -0.12, 0.69), (0, -0.124, 0.67)], [0.003] * 3, 4)
    parts.append(medallion)

    sash = Part("sash", RED, "hips", shade=0.05)
    kit.cone(sash.bm, (0, 0, 0.5), (0, 0, 0.555), 0.112, 0.108, 14, squash=0.8)
    knot = kit.sphere(sash.bm, (0.07, -0.085, 0.52), (0.02, 0.014, 0.018), 8, 6)
    sash.paint(faces_of(knot), RED_DARK)
    kit.cone(sash.bm, (0.07, -0.088, 0.51), (0.085, -0.094, 0.4), 0.014, 0.008, 5, squash=0.5)
    parts.append(sash)

    # Brass charms on the sash, and the hourglass at the right hip.
    charms = Part("charms", BRASS, "hips", shade=0.05)
    for x in (-0.03, 0.02):
        kit.tube(charms.bm, [(x, -0.09, 0.5), (x, -0.094, 0.45)], [0.0025] * 2, 4)
        kit.cone(charms.bm, (x, -0.096, 0.45), (x, -0.096, 0.4), 0.016, 0.001, 4, squash=0.4)
    glass_x, glass_y = -0.105, -0.05
    for z in (0.39, 0.46):
        kit.cone(charms.bm, (glass_x, glass_y, z - 0.006), (glass_x, glass_y, z + 0.006), 0.022, 0.022, 8)
    for dx, dy in ((0.016, 0.016), (-0.016, 0.016), (0.016, -0.016), (-0.016, -0.016)):
        kit.tube(charms.bm, [(glass_x + dx, glass_y + dy, 0.39), (glass_x + dx, glass_y + dy, 0.46)], [0.003] * 2, 4)
    kit.tube(charms.bm, [(glass_x, glass_y, 0.466), (glass_x + 0.005, glass_y - 0.02, 0.51)], [0.003] * 2, 4)
    glass = kit.cone(charms.bm, (glass_x, glass_y, 0.395), (glass_x, glass_y, 0.425), 0.017, 0.004, 8)
    glass += list(kit.cone(charms.bm, (glass_x, glass_y, 0.425), (glass_x, glass_y, 0.455), 0.004, 0.017, 8))
    charms.paint(faces_of(glass), GLASS)
    parts.append(charms)

    def robe_color(row, column):
        if column % 5 == 2:
            return RAG
        if row >= 4:
            return RED_DARK
        return BROWN if column % 3 == 0 else RED

    robe = Part("robe", RED, robe_weights)
    kit.ragged_cone(robe, 0.54, 0.1, 0.106, 0.17, 18, 6, 0.8, 0.07, robe_color, CLOTH_DARK, gap=math.radians(30), y_push=0.04)
    parts.append(robe)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        # A wide ragged sleeve to the elbow.
        sleeve = Part(f"sleeve.{side}", RED, f"upperarm.{side}")
        verts = kit.cone(sleeve.bm, s + Vector((0, 0, 0.01)), e + (e - s).normalized() * 0.01, 0.044, 0.05, 10, caps=False)
        sleeve.paint({f for v in verts if (v.co - e).length < 0.06 for f in v.link_faces}, RED_DARK)
        parts.append(sleeve)

        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.036, 0.03, 8)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.03, 0.026, 8)
        parts.append(forearm)

        # Leather and brass wraps on the forearm.
        wrap = Part(f"wrap.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        verts = kit.cone(wrap.bm, e + d * 0.05, w - d * 0.005, 0.031, 0.028, 8)
        wrap.paint({f for v in verts if (v.co - w).length < 0.02 for f in v.link_faces}, BRASS)
        parts.append(wrap)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.028, (0.022, 0.02, 0.03), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", CLOTH_DARK, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.052, 0.04, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", WRAP, f"shin.{side}")
        verts = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), ankle + Vector((0, 0, 0.04)), 0.042, 0.036, 8)
        # The leg wraps: dark bands.
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 60) % 2:
                shin.paint([face], CLOTH_DARK)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.06)), ankle - Vector((0, 0, 0.02)), 0.042, 0.044, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.035, 0.026), (0.068, 0.12, 0.052))
        ring = kit.torus(boot.bm, ankle + Vector((0, 0, 0.05)), (0, 0, 1), 0.044, 0.006, 10, 4)
        boot.paint(faces_of(ring), BRASS)
        parts.append(boot)
    return parts


def staff_parts():
    parts = []
    staff = Part("staff", WOOD, "staff", shade=0.04)
    gx, gy = GRIP_L.x, GRIP_L.y
    # A gnarled shaft: it bends a little at each knot.
    points = []
    for index in range(9):
        z = lerp(STAFF_BOTTOM, STAFF_TOP - 0.1, index / 8)
        wobble = 0.008 * math.sin(index * 2.3)
        points.append(Vector((gx + wobble, gy + 0.006 * math.cos(index * 1.7), z)))
    kit.tube(staff.bm, points, [lerp(0.011, 0.016, i / 8) for i in range(9)], 6)
    # The crown: three burnt prongs that hold the fire.
    top = points[-1]
    crown = set()
    for angle in (0, 120, 240):
        a = math.radians(angle + 20)
        out = Vector((math.cos(a), math.sin(a), 0))
        tip = top + out * 0.04 + Vector((0, 0, 0.11))
        crown |= set(kit.tube(staff.bm, [top, top + out * 0.035 + Vector((0, 0, 0.05)), tip], [0.012, 0.009, 0.003], 5))
    # Glowing cracks in the crown.
    for face in faces_of(crown):
        if int(face.calc_center_median().z * 90) % 3 == 0:
            staff.paint([face], EMBER)
    # The fire in the crown.
    fire = kit.cone(staff.bm, top + Vector((0, 0, 0.03)), top + Vector((0, 0, 0.13)), 0.028, 0.002, 7)
    staff.paint(faces_of(fire), FLAME)
    core = kit.sphere(staff.bm, top + Vector((0, 0, 0.045)), (0.02, 0.02, 0.026), 8, 6)
    staff.paint(faces_of(core), FLAME_CORE)
    parts.append(staff)

    # Brass charms hang on chains from the crown.
    charms = Part("staff.charms", BRASS, "staff", shade=0.05)
    for dx, dy, length in ((0.04, -0.01, 0.08), (-0.03, -0.03, 0.12), (0.01, 0.04, 0.1)):
        start = top + Vector((dx * 0.6, dy * 0.6, 0.02))
        end = start + Vector((dx * 0.4, dy * 0.4, -length))
        kit.tube(charms.bm, [start, end], [0.0025, 0.0025], 4)
        kit.cone(charms.bm, end + Vector((0, -0.004, 0)), end + Vector((0, 0.004, 0)), 0.016, 0.016, 8)
    parts.append(charms)

    flame = Part("flame", FLAME, "flame", shade=0)
    base = PALM_R
    kit.cone(flame.bm, base, base + Vector((0, 0, 0.11)), 0.034, 0.002, 8)
    for dx, dz in ((0.02, 0.06), (-0.018, 0.05)):
        tongue = kit.cone(flame.bm, base + Vector((dx, 0, 0.01)), base + Vector((dx * 1.6, 0, dz + 0.02)), 0.012, 0.001, 5)
        flame.paint(faces_of(tongue), EMBER)
    core = kit.sphere(flame.bm, base + Vector((0, 0, 0.022)), (0.024, 0.024, 0.03), 8, 6)
    flame.paint(faces_of(core), FLAME_CORE)
    parts.append(flame)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("AshcallerGrosh", BONES)
    parts = head_parts() + body_parts() + limb_parts() + staff_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "AshcallerGroshMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """The flame tracks a point high above the figure, so it always burns up."""
    empties = {"flame_up": kit.add_empty("flame_up", (0, 0, 50))}
    up = rig.pose.bones["flame"].constraints.new("DAMPED_TRACK")
    up.name = "Up"
    up.target = empties["flame_up"]
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

    def stand(breath=0.0, sway=0.0, fire=1.0):
        """
        The idle stance: turned a little to his right, he leans on the staff
        and holds the flame up in the open right hand.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.01 - breath * 0.003)),
            "hips": t("hips", (Z, -14)),
            "spine": t("spine", (Z, -4), (X, 5 + breath)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (Z, 8), (X, 2)),
            "head": t("head", (Z, 8 + sway * 4), (X, -4 + breath)),
            "locks": t("locks", (X, -breath * 2), (Y, sway * 3)),
            "upperarm.L": t("upperarm.L", (X, -2 - breath)),
            "upperarm.R": t("upperarm.R", (Y, -10), (X, -26 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -82)),
            "hand.R": t("hand.R", (X, -20)),
            "thigh.L": t("thigh.L", (X, -10), (Y, -2)),
            "shin.L": t("shin.L", (X, 12)),
            "foot.L": t("foot.L", (X, -2)),
            "thigh.R": t("thigh.R", (X, 8), (Y, 3)),
            "shin.R": t("shin.R", (X, 6)),
            "foot.R": t("foot.R", (X, -14)),
            "robe.B": t("robe.B", (X, -4 - breath * 2), (Y, sway * 2)),
            "flame/Up": 1.0,
            "flame@scale": fire * (1 + breath * 0.12),
        }

    def hunch(breath=0.0):
        """Low HP: bent over the staff, the flame low and small."""
        return pose(
            stand(fire=0.45 + breath * 0.1),
            hips_at_loc=at("hips", (0, 0.02, -0.04 - breath * 0.004)),
            spine=t("spine", (Z, -4), (X, 18 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            neck=t("neck", (Z, 6), (X, 6)),
            head=t("head", (Z, 6), (X, -6 + breath * 4), (Y, -6)),
            upperarm__L=t("upperarm.L", (X, -26), (Y, -6)),
            forearm__L=t("forearm.L", (X, -14)),
            upperarm__R=t("upperarm.R", (X, -6), (Y, 20)),
            forearm__R=t("forearm.R", (X, -80), (Z, 50)),
            thigh__L=t("thigh.L", (X, -22), (Y, -2)),
            shin__L=t("shin.L", (X, 32)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, -2), (Y, 3)),
            shin__R=t("shin.R", (X, 26)),
            foot__R=t("foot.R", (X, -22)),
            locks=t("locks", (X, -20)),
            robe__B=t("robe.B", (X, 8)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.01 - 0.006 * amount)),
            spine=t("spine", (Z, -4), (X, -8 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -16 * amount)),
            upperarm__L=t("upperarm.L", (X, -12 * amount), (Y, -6 * amount)),
            upperarm__R=t("upperarm.R", (X, 10 * amount), (Y, 30 * amount)),
            forearm__R=t("forearm.R", (X, -50)),
            locks=t("locks", (X, 18 * amount)),
            robe__B=t("robe.B", (X, 12 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, -10)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, 14)),
            forearm__R=t("forearm.R", (X, -20)),
            locks=t("locks", (X, -26)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the staff fallen across him and the flame out."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, -12), (Z, 25)),
            upperarm__L=t("upperarm.L", (Y, -30), (X, 20)),
            hand__L=t("hand.L", (X, 40)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, 16)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -18), (Y, 6)),
            shin__R=t("shin.R", (X, 32)),
            locks=t("locks", (X, -50)),
            robe__B=t("robe.B", (X, -70)),
            flame_at_scale=0.0,
        )

    def crouch(base):
        """Down on one knee over the staff, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.19)),
            spine=t("spine", (Z, -4), (X, 24)),
            chest=t("chest", (X, 6)),
            head=t("head", (Z, 6), (X, 16)),
            thigh__L=t("thigh.L", (X, -76), (Y, -4)),
            shin__L=t("shin.L", (X, 78)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4), (Y, 4)),
            shin__R=t("shin.R", (X, 92)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, 16)),
            forearm__R=t("forearm.R", (X, -40)),
            locks=t("locks", (X, -30)),
            robe__B=t("robe.B", (X, 50)),
            flame_at_scale=0.3,
        )

    def exalt(base, fire=1.6):
        """The staff and the flame high: a cast, and the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.002)),
            hips=t("hips", (Z, -8)),
            chest=t("chest", (X, -12)),
            head=t("head", (Z, 4), (X, -20)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, -10)),
            forearm__L=t("forearm.L", (X, -10)),
            # The staff stays upright, high over the head.
            hand__L=t("hand.L", (X, 78)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, 14)),
            forearm__R=t("forearm.R", (X, -14)),
            hand__R=t("hand.R", (X, -30)),
            locks=t("locks", (X, 14)),
            robe__B=t("robe.B", (X, 6)),
            flame_at_scale=fire,
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.018)),
            spine=t("spine", (Z, -3), (X, 7)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -26)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                # The staff swings with the steps, as a walking stick.
                "upperarm__L": t("upperarm.L", (X, -8 + 10 * front)),
                "locks": t("locks", (X, -6), (Y, 3 * front)),
                "robe__B": t("robe.B", (X, 8), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (Z, -3), (X, 7)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -14)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 44)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "locks": t("locks", (X, -4)),
                "robe__B": t("robe.B", (X, 4)),
            },
        )

    # The attack: he pulls the flame back to the shoulder, then throws it.
    # The fire bolt leaves at 20% of the attack (`FLIGHT_START` in fx.ts), so
    # the throw ends at frame 6 of 30, and the flame grows back.
    def windup(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.024)),
            hips=t("hips", (Z, -30)),
            spine=t("spine", (Z, -14), (X, 2)),
            chest=t("chest", (Z, -10), (X, -6)),
            head=t("head", (Z, 34), (X, -4)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, 50)),
            forearm__R=t("forearm.R", (X, -110)),
            hand__R=t("hand.R", (X, -30)),
            thigh__L=t("thigh.L", (X, -22), (Y, -3)),
            shin__L=t("shin.L", (X, 24)),
            thigh__R=t("thigh.R", (X, 16), (Y, 3)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -30)),
            flame_at_scale=1.5,
        )

    def throw(base, fire):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.025, -0.026)),
            hips=t("hips", (Z, -6)),
            spine=t("spine", (Z, 6), (X, 10)),
            chest=t("chest", (Z, 8), (X, 4)),
            head=t("head", (Z, 4), (X, -4)),
            upperarm__R=t("upperarm.R", (X, -82), (Y, 12)),
            forearm__R=t("forearm.R", (X, -8)),
            hand__R=t("hand.R", (X, -50)),
            thigh__L=t("thigh.L", (X, -34), (Y, -3)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 22), (Y, 3)),
            shin__R=t("shin.R", (X, 8)),
            foot__R=t("foot.R", (X, -28)),
            locks=t("locks", (X, 10)),
            robe__B=t("robe.B", (X, 16)),
            flame_at_scale=fire,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, hunch(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, windup(stand())).key(6, throw(stand(), 0.9)).key(7, throw(stand(), 0.0))
    attack.key(14, throw(stand(), 0.0)).key(22, stand(fire=0.5)).key(30, stand())
    clips.append(attack)

    # Bolt: the staff and the flame high, and the fire flares.
    cast = Clip("cast", 24)
    cast.key(0, stand()).key(6, exalt(stand())).key(10, exalt(stand(), 2.0)).key(16, exalt(stand(), 1.4)).key(24, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand(fire=0.4)))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, exalt(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.17))))
    summon.key(17, exalt(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "ashcaller-grosh.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
