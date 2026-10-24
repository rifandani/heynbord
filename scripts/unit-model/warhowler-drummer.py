"""
Warhowler Drummer (`orc.warhowlerDrummer`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a compact orc woman with a fierce,
happy grin, long dark locks with red feathers, gold hoop earrings, a leather
top with a necklace of teeth, a skirt of red feathers and leather strips,
leather bracers and fur boots. A hide drum hangs from a strap at her right
hip: a wood shell, a cream head with a red sign, a red feather trim and bone
teeth. She holds a bone drum stick in each hand. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/warhowler-drummer.glb`;
then `bun unit-model:pack warhowler-drummer` packs it for the game.

The Battle camera sees the right side of a player Unit, so the drum hangs at
her right hip, and its head turns to the camera side. She beats the drum with
the right stick in each clip, and her walk is a march on the beat. Her attack
is in melee: she swings the right stick high and brings it down hard in front
of her. Her cast (Rally) beats the drum fast, with the left stick high and a
howl.
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

SKIN = hex_color("#a4a84c")
SKIN_DARK = hex_color("#777c34")
HAIR = hex_color("#2a1e18")
HAIR_LIGHT = hex_color("#46342a")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#5a1c18")
TUSK = hex_color("#f0e6c8")
PAINT = hex_color("#b8342a")
GOLD = hex_color("#d8a846")
BONE = hex_color("#e6dbbe")
BONE_DARK = hex_color("#a99a78")
LEATHER = hex_color("#5c3a26")
LEATHER_DARK = hex_color("#382418")
FUR = hex_color("#9a7a5a")
FUR_LIGHT = hex_color("#dccfb6")
FEATHER = hex_color("#c4302a")
FEATHER_DARK = hex_color("#7e1c18")
WOOD = hex_color("#7a4e2e")
WOOD_DARK = hex_color("#4e301c")
HIDE = hex_color("#e8d9b4")
HIDE_DARK = hex_color("#c4b088")
ROPE = hex_color("#c4a676")

# --- Proportions ---------------------------------------------------------------

# She is compact: a little shorter and wider than the other orcs.
HIP_Z = 0.44
WAIST_Z = 0.52
CHEST_Z = 0.6
SHOULDER_Z = 0.685
NECK_Z = 0.715
HEAD_C = Vector((0, -0.018, 0.805))
KNEE_Z = 0.25
ANKLE_Z = 0.055
LEG_X = 0.075

# The drum hangs at the right hip, its head up and to the camera side.
DRUM_C = Vector((-0.2, -0.08, 0.37))
DRUM_N = Vector((-0.62, -0.3, 0.72)).normalized()
DRUM_R = 0.1
DRUM_DEPTH = 0.09
DRUM_FACE = DRUM_C + DRUM_N * (DRUM_DEPTH / 2)

# The right hand holds its stick over the drum head; the left arm hangs with
# its stick forward. These are the rest (bind) positions.
SL = Vector((0.155, 0, SHOULDER_Z))
EL = Vector((0.215, 0.025, 0.56))
WL = Vector((0.22, -0.05, 0.47))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.155, 0, SHOULDER_Z))
ER = Vector((-0.225, 0.04, 0.565))
WR = Vector((-0.235, -0.07, 0.53))
TR = WR + (WR - ER).normalized() * 0.05

GRIP_R = WR + (WR - ER).normalized() * 0.028
STICK_R = (DRUM_FACE + DRUM_N * 0.012 - GRIP_R).normalized()
STICK_R_LENGTH = (DRUM_FACE + DRUM_N * 0.012 - GRIP_R).length + 0.02
GRIP_L = WL + (WL - EL).normalized() * 0.028
STICK_L = Vector((-0.1, -0.75, 0.3)).normalized()
STICK_LENGTH = 0.2

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.008, NECK_Z), (0, -0.012, 0.75), "chest"),
    ("head", (0, -0.012, 0.75), (0, -0.018, 0.9), "neck"),
    ("locks", (0, 0.05, 0.82), (0, 0.1, 0.58), "head"),
    ("skirt.B", (0, 0.08, 0.46), (0, 0.1, 0.24), "hips"),
    ("drum", (-0.15, -0.04, 0.47), tuple(DRUM_C), "hips"),
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

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.48, 0.56)
    return blend("spine", "chest", co.z, 0.58, 0.65)


def locks_weights(co):
    return blend("locks", "head", co.z, 0.74, 0.8)


def skirt_weights(co):
    """The skirt follows the hips at the top, and the legs and its back lower."""
    t = clamp01((0.45 - co.z) / 0.18)
    back = clamp01(co.y / 0.08)
    side = co.x / 0.1
    return {
        "hips": 1 - t,
        "skirt.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side),
        "thigh.R": (1 - back) * t * clamp01(-side),
    }


def strap_weights(co):
    """The strap goes from the left shoulder to the drum."""
    if co.z > 0.5:
        return blend("spine", "chest", co.z, 0.56, 0.62)
    return blend("drum", "hips", co.z, 0.44, 0.5)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.066, 0.068, 0.07), 12, 9)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.044)), (0.06, 0.048, 0.038), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.064, 0.002)), HEAD_C + Vector((0, -0.08, -0.014)), 0.016, 0.007, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.06 * sign, 0.006, 0.004)), HEAD_C + Vector((0.13 * sign, 0.03, 0.04)), 0.02, 0.002, 5, squash=0.4)
        hoop = kit.torus(head.bm, HEAD_C + Vector((0.072 * sign, 0.012, -0.035)), (0, 1, 0), 0.016, 0.003, 10, 3)
        head.paint(faces_of(hoop), GOLD)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.026 * sign, -0.062, 0.014)), (0.009, 0.006, 0.008), 6, 4)
        # Fierce brows, down at the middle.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.066, 0.03)), (0.016, 0.0, -0.005 * sign), (0, 0.006, 0), (0.0, 0.0, 0.005))
        face.paint(faces_of(brow), HAIR)
        # A red stripe on each cheek.
        stripe = kit.slab(face.bm, HEAD_C + Vector((0.044 * sign, -0.052, -0.01)), (0.012, 0.004 * sign, 0), (0, 0.004, 0), (0, 0, 0.005))
        face.paint(faces_of(stripe), PAINT)
    # A wide, happy shout.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.066, -0.04)), (0.032, 0.014, 0.022), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    teeth = kit.slab(face.bm, HEAD_C + Vector((0, -0.076, -0.028)), (0.022, 0, 0), (0, 0.004, 0), (0, 0, 0.004))
    face.paint(faces_of(teeth), TUSK)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.03 * sign, -0.068, -0.058)), HEAD_C + Vector((0.036 * sign, -0.078, -0.02)), 0.009, 0.001, 5)
    parts.append(tusks)

    hair = Part("hair", HAIR, "head", shade=0.08)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.012, 0.012)), (0.072, 0.076, 0.078), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.z < HEAD_C.z - 0.02 or (v.co.y < -0.035 and v.co.z < HEAD_C.z + 0.05)], context="VERTS")
    # A short top knot, tied with red feathers.
    knot = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.03, 0.085)), (0.03, 0.03, 0.026), 8, 5)
    hair.paint(faces_of(knot), HAIR_LIGHT)
    for index, (dx, dy) in enumerate(((0.02, 0.04), (-0.015, 0.05), (0.0, 0.06))):
        root = HEAD_C + Vector((dx, 0.03 + dy * 0.2, 0.09))
        quill = kit.cone(hair.bm, root, root + Vector((dx * 3, dy, 0.08 - index * 0.012)), 0.014, 0.002, 4, squash=0.4)
        hair.paint(faces_of(quill), FEATHER if index % 2 == 0 else FEATHER_DARK)
    parts.append(hair)

    # Long dark locks down the back and over the shoulders.
    locks = Part("locks", HAIR, locks_weights)
    for index, angle in enumerate(range(-120, 121, 30)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.066 * math.sin(a), 0.066 * math.cos(a) + 0.01, 0.02))
        length = 0.2 if abs(angle) < 60 else 0.15
        bottom = top + Vector((0.03 * math.sin(a), 0.06 + 0.02 * math.cos(a), -length))
        middle = (top + bottom) / 2 + Vector((0.012 * math.sin(a), 0.025, 0.01))
        verts = kit.tube(locks.bm, [top, middle, bottom], [0.016, 0.013, 0.005], 5)
        if index % 2:
            locks.paint(faces_of(verts), HAIR_LIGHT)
    # A red feather tied in the locks on the camera side.
    tie = HEAD_C + Vector((-0.07, 0.03, -0.02))
    feather = kit.cone(locks.bm, tie, tie + Vector((-0.02, 0.05, -0.1)), 0.016, 0.002, 4, squash=0.4)
    locks.paint(faces_of(feather), FEATHER)
    parts.append(locks)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.008, 0.67), (0, -0.012, 0.77), 0.046, 0.042, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    kit.sphere(torso.bm, (0, -0.004, 0.625), (0.15, 0.095, 0.095), 14, 8)
    kit.cone(torso.bm, (0, 0, 0.45), (0, 0, 0.6), 0.115, 0.13, 12, squash=0.76)
    parts.append(torso)

    # A leather top with a fur edge, and a necklace of teeth.
    top = Part("top", LEATHER, "chest", shade=0.1)
    kit.sphere(top.bm, (0, -0.012, 0.62), (0.135, 0.093, 0.06), 12, 6)
    edge = kit.torus(top.bm, (0, -0.012, 0.585), (0, 0, 1), 0.122, 0.012, 14, 4)
    top.paint(faces_of(edge), FUR)
    for sign in (1, -1):
        kit.tube(top.bm, [(0.06 * sign, -0.08, 0.65), (0.08 * sign, -0.04, 0.71), (0.09 * sign, 0.04, 0.68)], [0.011] * 3, 4)
    for index in range(7):
        a = math.radians(-60 + index * 20)
        p = Vector((0.075 * math.sin(a), -0.07 * math.cos(a) - 0.03, 0.69 - 0.02 * math.cos(a)))
        tooth = kit.cone(top.bm, p, p + Vector((0, -0.006, -0.03)), 0.008, 0.001, 4)
        top.paint(faces_of(tooth), BONE if index % 2 == 0 else BONE_DARK)
    beads = kit.torus(top.bm, (0, -0.034, 0.705), (0, -0.4, 1), 0.07, 0.005, 12, 3)
    top.paint(faces_of(beads), LEATHER_DARK)
    parts.append(top)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.43), (0, 0, 0.475), 0.124, 0.12, 14, squash=0.82)
    buckle = kit.sphere(belt.bm, (0, -0.102, 0.453), (0.022, 0.01, 0.02), 8, 4)
    belt.paint(faces_of(buckle), BONE)
    parts.append(belt)

    def skirt_color(row, column):
        if column % 2 == 0:
            return FEATHER if row < 2 else FEATHER_DARK
        return LEATHER if row < 2 else LEATHER_DARK

    skirt = Part("skirt", FEATHER, skirt_weights)
    kit.ragged_cone(skirt, 0.45, 0.24, 0.124, 0.17, 16, 3, 0.82, 0.06, skirt_color, LEATHER_DARK, gap=math.radians(14))
    parts.append(skirt)

    # The strap from the left shoulder across the chest to the drum.
    strap = Part("strap", LEATHER_DARK, strap_weights, shade=0.04)
    kit.tube(strap.bm, [(0.12, 0.02, 0.71), (0.06, -0.1, 0.64), (-0.06, -0.11, 0.54), (-0.14, -0.08, 0.47), (-0.17, -0.06, 0.43)], [0.012] * 5, 4)
    kit.tube(strap.bm, [(0.12, 0.02, 0.71), (0.04, 0.1, 0.62), (-0.08, 0.1, 0.52), (-0.15, 0.03, 0.46), (-0.18, -0.02, 0.43)], [0.012] * 5, 4)
    parts.append(strap)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.01 * sign, 0, -0.01)), (0.052, 0.05, 0.05), 10, 7)
        kit.cone(upper.bm, s, e, 0.048, 0.04, 8)
        parts.append(upper)

        # A fur pad on each shoulder.
        pad = Part(f"pad.{side}", FUR, f"upperarm.{side}", shade=0.1)
        kit.sphere(pad.bm, s + Vector((0.012 * sign, 0, 0.022)), (0.058, 0.056, 0.032), 8, 6)
        parts.append(pad)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.04, 0.034, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        verts = kit.cone(bracer.bm, e + d * 0.035, w - d * 0.004, 0.044, 0.039, 8)
        for face in faces_of(verts):
            if int(((face.calc_center_median() - e).dot(d)) * 90) % 3 == 0:
                bracer.paint([face], LEATHER_DARK)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.028, (0.031, 0.028, 0.032), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.066, 0.05, 8)
        parts.append(thigh)

        # Tall leather boots with straps, and a pale fur cuff at the knee.
        shin = Part(f"shin.{side}", LEATHER, f"shin.{side}", shade=0.12)
        verts = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), ankle + Vector((0, 0, 0.04)), 0.056, 0.05, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 40) % 3 == 0:
                shin.paint([face], LEATHER_DARK)
        cuff = kit.torus(shin.bm, knee + Vector((0, 0, 0.01)), (0, 0, 1), 0.056, 0.02, 10, 4)
        shin.paint(faces_of(cuff), FUR_LIGHT)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.05)), ankle - Vector((0, 0, 0.02)), 0.052, 0.054, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.036, 0.026), (0.08, 0.15, 0.052))
        parts.append(boot)
    return parts


def stick(part, grip, direction, length):
    """A bone drum stick: a shaft with a round knob at each end and a red tassel."""
    end = grip + direction * length
    kit.cone(part.bm, grip - direction * 0.04, end, 0.011, 0.01, 6)
    for point, radius in ((grip - direction * 0.045, 0.018), (end, 0.024)):
        knob = kit.sphere(part.bm, point, (radius, radius, radius), 8, 5)
        part.paint(faces_of(knob), BONE)
    tassel = kit.cone(part.bm, grip - direction * 0.04, grip - direction * 0.04 + Vector((0, 0.02, -0.06)), 0.012, 0.002, 4)
    part.paint(faces_of(tassel), FEATHER)


def drum_parts():
    parts = []
    drum = Part("drum", WOOD, "drum", shade=0.06)
    back = DRUM_C - DRUM_N * (DRUM_DEPTH / 2)
    shell = kit.cone(drum.bm, back, DRUM_FACE, DRUM_R * 0.92, DRUM_R, 14)
    for face in faces_of(shell):
        center = face.calc_center_median()
        if abs((center - DRUM_FACE).dot(DRUM_N)) < 0.004:
            drum.paint([face], HIDE)
        elif abs((center - back).dot(DRUM_N)) < 0.004:
            drum.paint([face], HIDE_DARK)
    for along in (0.1, 0.9):
        hoop = kit.torus(drum.bm, back + DRUM_N * DRUM_DEPTH * along, DRUM_N, DRUM_R * lerp(0.93, 1.0, along), 0.008, 14, 4)
        drum.paint(faces_of(hoop), WOOD_DARK)
    # The lacing: zigzag cords from hoop to hoop.
    side = DRUM_N.cross(Z).normalized()
    up = side.cross(DRUM_N).normalized()
    for index in range(8):
        a = 2 * math.pi * index / 8
        b = 2 * math.pi * (index + 0.5) / 8
        p0 = back + DRUM_N * 0.01 + (side * math.cos(a) + up * math.sin(a)) * DRUM_R * 0.95
        p1 = DRUM_FACE - DRUM_N * 0.01 + (side * math.cos(b) + up * math.sin(b)) * DRUM_R * 1.01
        cord = kit.cone(drum.bm, p0, p1, 0.004, 0.004, 3)
        drum.paint(faces_of(cord), ROPE)
    # The red sign on the drum head: a star of four points.
    for index in range(4):
        a = math.pi / 4 + index * math.pi / 2
        out = side * math.cos(a) + up * math.sin(a)
        point = kit.cone(drum.bm, DRUM_FACE + DRUM_N * 0.002, DRUM_FACE + DRUM_N * 0.002 + out * DRUM_R * 0.7, 0.02, 0.002, 3, squash=0.25)
        drum.paint(faces_of(point), PAINT)
    # Bone teeth and red feathers that hang round the shell.
    for index in range(6):
        a = math.radians(140 + index * 26)
        rim = DRUM_C + (side * math.cos(a) + up * math.sin(a)) * DRUM_R * 1.02
        if index % 2 == 0:
            tooth = kit.cone(drum.bm, rim, rim + Vector((0, 0, -0.06)), 0.01, 0.001, 4)
            drum.paint(faces_of(tooth), BONE)
        else:
            feather = kit.cone(drum.bm, rim, rim + Vector((0, 0.01, -0.09)), 0.018, 0.002, 4, squash=0.4)
            drum.paint(faces_of(feather), FEATHER)
    parts.append(drum)

    right = Part("stick.R", BONE_DARK, "hand.R", shade=0.04)
    stick(right, GRIP_R, STICK_R, STICK_R_LENGTH)
    parts.append(right)
    left = Part("stick.L", BONE_DARK, "hand.L", shade=0.04)
    stick(left, GRIP_L, STICK_L, STICK_LENGTH)
    parts.append(left)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("WarhowlerDrummer", BONES)
    parts = head_parts() + body_parts() + limb_parts() + drum_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "WarhowlerDrummerMesh")
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

    def beat(base, lift):
        """The right stick over the drum: `lift` 0 is on the head, 1 is up for the next beat."""
        return pose(
            base,
            upperarm__R=t("upperarm.R", (X, -10 * lift)),
            forearm__R=t("forearm.R", (X, -40 * lift)),
            hand__R=t("hand.R", (X, -20 * lift)),
        )

    def stand(breath=0.0, sway=0.0, lift=0.3):
        """
        The idle stance: the feet wide, the left stick ready, and a light beat
        on the drum.
        """
        return beat(
            {
                "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.004)),
                "hips": t("hips", (Z, -10), (Y, sway * 2)),
                "spine": t("spine", (Z, -3), (X, 4 + breath)),
                "chest": t("chest", (X, -3 - breath * 2)),
                "neck": t("neck", (Z, 6)),
                "head": t("head", (Z, 6 + sway * 4), (X, -4 + breath * 2)),
                "upperarm.L": t("upperarm.L", (X, -20 - breath * 3), (Y, 10)),
                "forearm.L": t("forearm.L", (X, -50)),
                "thigh.L": t("thigh.L", (X, -14), (Y, -6)),
                "shin.L": t("shin.L", (X, 16)),
                "foot.L": t("foot.L", (X, -2)),
                "thigh.R": t("thigh.R", (X, 10), (Y, 6)),
                "shin.R": t("shin.R", (X, 8)),
                "foot.R": t("foot.R", (X, -18)),
                "locks": t("locks", (X, -breath * 4), (Y, sway * 4)),
                "skirt.B": t("skirt.B", (X, -4)),
                "drum": t("drum", (Y, sway * 2)),
            },
            lift,
        )

    def slump(breath=0.0, lift=0.0):
        """Low HP: down on the right knee, and a slow, weak beat."""
        return beat(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.03, -0.17 - breath * 0.004)),
                hips=t("hips", (Z, -12)),
                spine=t("spine", (Z, -3), (X, 20 + breath * 3)),
                chest=t("chest", (X, 6 + breath * 2)),
                head=t("head", (Z, 4), (X, 10 + breath * 4), (Y, -8)),
                upperarm__L=t("upperarm.L", (X, 6), (Y, 4)),
                forearm__L=t("forearm.L", (X, -20)),
                thigh__L=t("thigh.L", (X, -76), (Y, -6)),
                shin__L=t("shin.L", (X, 76)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 6), (Y, 6)),
                shin__R=t("shin.R", (X, 92)),
                foot__R=t("foot.R", (X, -40)),
                locks=t("locks", (X, 20)),
                skirt__B=t("skirt.B", (X, 40)),
                drum=t("drum", (X, -10)),
            ),
            lift,
        )

    def recoil(base, amount=1.0):
        """A hit pushes the upper body back, and the drum swings."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -3), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 6), (X, -16 * amount)),
            upperarm__L=t("upperarm.L", (X, -40 * amount), (Y, 20 * amount)),
            forearm__L=t("forearm.L", (X, -60)),
            upperarm__R=t("upperarm.R", (X, -20 * amount), (Y, -20 * amount)),
            locks=t("locks", (X, -16 * amount)),
            drum=t("drum", (Y, -12 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 20)),
            upperarm__R=t("upperarm.R", (Y, -24), (X, 6)),
            locks=t("locks", (X, 20)),
            drum=t("drum", (Y, -16)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the drum on her belly and the sticks out to the sides."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, -12), (Z, 25)),
            upperarm__L=t("upperarm.L", (Y, 60), (X, 10)),
            forearm__L=t("forearm.L", (X, -10)),
            upperarm__R=t("upperarm.R", (Y, -60), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -10), (Y, -6)),
            shin__L=t("shin.L", (X, 12)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            locks=t("locks", (X, -40)),
            skirt__B=t("skirt.B", (X, -20)),
            drum=t("drum", (Y, -20), (X, 20)),
        )

    def crouch(base):
        """Down on one knee, as a summon starts and a Rebirth gets up."""
        return pose(
            slump(),
            spine=t("spine", (Z, -3), (X, 26)),
            head=t("head", (Z, 4), (X, 18)),
        )

    def howl(base, lift=0.0, shake=0.0):
        """The left stick high, the head back in a howl, and the right stick on the drum."""
        return beat(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.004)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, -4)),
                chest=t("chest", (X, -10)),
                neck=t("neck", (X, -6)),
                head=t("head", (Z, 6), (X, -24)),
                upperarm__L=t("upperarm.L", (X, -150 + shake * 10), (Y, 16)),
                forearm__L=t("forearm.L", (X, -40 - shake * 20)),
                hand__L=t("hand.L", (X, 100)),
                locks=t("locks", (X, 14), (Y, shake * 6)),
                drum=t("drum", (Y, shake * 3)),
            ),
            lift,
        )

    def step(front, lift):
        """A heel touches the ground on the beat. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return beat(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0, -0.018)),
                spine=t("spine", (Z, -3), (X, 8)),
                chest=t("chest", (Z, -5 * front)),
                **{
                    f"thigh__{lead}": t(f"thigh.{lead}", (X, -30)),
                    f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                    f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                    f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                    f"shin__{back}": t(f"shin.{back}", (X, 14)),
                    f"foot__{back}": t(f"foot.{back}", (X, 14)),
                    "upperarm__L": t("upperarm.L", (X, -30 - 30 * front), (Y, 10)),
                    "forearm__L": t("forearm.L", (X, -60)),
                    "skirt__B": t("skirt.B", (X, 12)),
                    "locks": t("locks", (X, -8), (Y, 4 * front)),
                    "drum": t("drum", (Y, 5 * front)),
                },
            ),
            lift,
        )

    def passing(lifted, lift):
        """One foot passes the other, high as in a march. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return beat(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0, 0.004)),
                spine=t("spine", (Z, -3), (X, 8)),
                **{
                    f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -44)),
                    f"shin__{lifted}": t(f"shin.{lifted}", (X, 60)),
                    f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                    f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                    f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                    f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                    "upperarm__L": t("upperarm.L", (X, -30), (Y, 10)),
                    "forearm__L": t("forearm.L", (X, -60)),
                    "skirt__B": t("skirt.B", (X, 8)),
                    "locks": t("locks", (X, -4)),
                },
            ),
            lift,
        )

    # The attack: she swings the right stick up high behind her, then brings
    # it down hard in front of her. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the blow lands at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.01)),
            hips=t("hips", (Z, -22)),
            spine=t("spine", (Z, -6), (X, -8)),
            chest=t("chest", (X, -8), (Z, -8)),
            head=t("head", (Z, 14), (X, -10)),
            upperarm__R=t("upperarm.R", (X, -175), (Y, -14)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 20)),
            forearm__L=t("forearm.L", (X, -40)),
            thigh__L=t("thigh.L", (X, -22), (Y, -4)),
            shin__L=t("shin.L", (X, 22)),
            thigh__R=t("thigh.R", (X, 16), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, -30)),
            locks=t("locks", (X, -10)),
            drum=t("drum", (Y, 8)),
        )

    def smash(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.04, -0.045)),
            hips=t("hips", (Z, -6)),
            spine=t("spine", (Z, 4), (X, 20)),
            chest=t("chest", (Z, 6), (X, 10)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -75), (Y, -6)),
            forearm__R=t("forearm.R", (X, 10)),
            hand__R=t("hand.R", (X, -70)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 30)),
            forearm__L=t("forearm.L", (X, -40)),
            thigh__L=t("thigh.L", (X, -42), (Y, -4)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 24), (Y, 4)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -30)),
            skirt__B=t("skirt.B", (X, 10)),
            locks=t("locks", (X, -20)),
            drum=t("drum", (Y, -10), (X, -10)),
        )

    clips = []
    # Two light beats in each loop of the idle.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, lift in ((0, 0, 0, 0), (6, 0.25, 0.5, 0.6), (12, 0.5, 1, 0), (24, 1, 0, 0.3), (30, 0.75, -0.5, 0.6), (36, 0.5, -1, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, lift))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath, lift in ((0, 0, 0), (16, 0.6, 0.4), (24, 1, 0), (48, 0, 0)):
        low.key(frame, slump(breath, lift))
    clips.append(low)

    # A march: a beat on the drum for each step.
    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1, 0)).key(6, passing("R", 0.8)).key(12, step(-1, 0)).key(18, passing("L", 0.8)).key(24, step(1, 0))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, windup(stand())).key(15, smash(stand())).key(19, smash(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    # Rally: fast beats on the drum, the left stick high, and a howl.
    cast = Clip("cast", 30)
    cast.key(0, stand())
    for index, frame in enumerate(range(5, 26, 3)):
        cast.key(frame, howl(stand(), 0.9 if index % 2 else 0.0, 1 if index % 2 else -1))
    cast.key(30, stand())
    clips.append(cast)

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
    rebirth.key(32, crouch(stand())).key(38, howl(stand(), 0.9)).key(41, howl(stand(), 0.0)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.15))))
    summon.key(14, howl(stand(), 0.9)).key(17, howl(stand(), 0.0)).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "warhowler-drummer.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
