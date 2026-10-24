"""
Warden Saelith (`elf.wardenSaelith`), the first Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an elf woman with a long dark
braid, a green coat with amber trim and cream lining, and a longbow. Run it
in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/warden-saelith.glb`; then
`bun unit-model:pack warden-saelith` packs it for the game.
"""

import math
import os
import sys

import bpy
from mathutils import Quaternion, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, clamp01, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#eab68c")
HAIR = hex_color("#3a2316")
HAIR_LIGHT = hex_color("#5b3822")
COAT = hex_color("#2f6a35")
COAT_DARK = hex_color("#24502a")
AMBER = hex_color("#e3a336")
CREAM = hex_color("#efe1bd")
LEATHER = hex_color("#5c3921")
LEGGINGS = hex_color("#4a3020")
BOOT = hex_color("#6b4126")
GOLD = hex_color("#ecb546")
WOOD = hex_color("#4a2b17")
GRIP = hex_color("#2c1b0f")
EYES = hex_color("#1f2a1a")
FLETCH = hex_color("#3f8f3e")
STEEL = hex_color("#c9ccc8")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.875))

# The arms hang in an A-pose, 25 degrees from the body.
ARM_DIR = Vector((math.sin(math.radians(25)), 0, -math.cos(math.radians(25))))


def arm_points(sign):
    shoulder = Vector((0.1 * sign, 0, SHOULDER_Z))
    direction = Vector((ARM_DIR.x * sign, 0, ARM_DIR.z))
    elbow = shoulder + direction * 0.15
    wrist = elbow + direction * 0.14
    tip = wrist + direction * 0.055
    return shoulder, elbow, wrist, tip, direction


SL, EL, WL, TL, DL = arm_points(1)
SR, ER, WR, TR, DR = arm_points(-1)
GRIP_L = WL + DL * 0.025
HAND_R = WR + DR * 0.025

BOW_HALF = 0.3
BOW_SAG = 0.07
BOW_RECURVE = 0.15
# The string sits behind the grip by the brace height.
BRACE = BOW_SAG - (1 - 0.8) * BOW_RECURVE
STRING_P = GRIP_L + Vector((0, BRACE, 0))
ARROW_LENGTH = 0.32

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("braid1", (0, 0.075, 0.88), (0, 0.105, 0.75), "head"),
    ("braid2", (0, 0.105, 0.75), (0, 0.115, 0.61), "braid1"),
    ("braid3", (0, 0.115, 0.61), (0, 0.112, 0.45), "braid2"),
    ("tail1", (0, 0.07, 0.5), (0, 0.11, 0.32), "hips"),
    ("tail2", (0, 0.11, 0.32), (0, 0.15, 0.12), "tail1"),
]
for side, sign, (s, e, w, t, _) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (0.05 * sign, 0, HIP_Z), (0.052 * sign, 0, 0.27), "hips"),
        (f"shin.{side}", (0.052 * sign, 0, 0.27), (0.052 * sign, 0, 0.05), f"thigh.{side}"),
        (f"foot.{side}", (0.052 * sign, 0, 0.05), (0.052 * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("bow", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("string", tuple(STRING_P), tuple(STRING_P + Vector((0, 0, 0.05))), "bow"),
    # At rest the arrow hangs along the right hand. The attack aims it at the bow.
    ("arrow", tuple(HAND_R), tuple(HAND_R + DR * 0.1), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def blend(low_bone, high_bone, z, low, high):
    t = clamp01((z - low) / (high - low))
    return {low_bone: 1 - t, high_bone: t}


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    t = clamp01((0.53 - co.z) / 0.41)
    back = clamp01((co.y - 0.02) / 0.1)
    side = co.x / 0.15
    upper = 1 - clamp01((t - 0.5) * 2)
    return {
        "hips": 1 - t,
        "tail1": back * t * upper,
        "tail2": back * t * (1 - upper),
        "thigh.L": (1 - back) * t * clamp01(side) * 0.8,
        "thigh.R": (1 - back) * t * clamp01(-side) * 0.8,
    }


def braid_weights(co):
    if co.z > 0.75:
        return blend("braid1", "head", co.z, 0.8, 0.86)
    if co.z > 0.61:
        return blend("braid2", "braid1", co.z, 0.66, 0.75)
    return blend("braid3", "braid2", co.z, 0.55, 0.61)


def string_weights(co):
    reach = BOW_HALF
    near = 1 - clamp01(abs(co.z - STRING_P.z) / reach)
    return {"string": near, "bow": 1 - near}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.066, 0.07, 0.083), 14, 10)
    kit.cone(head.bm, (0, -0.066, 0.87), (0, -0.082, 0.862), 0.011, 0.002, 5)
    for sign in (1, -1):
        # Elf ears: long points that go up and back.
        kit.cone(
            head.bm,
            (0.058 * sign, 0.004, 0.872),
            (0.125 * sign, 0.035, 0.93),
            0.016,
            0.001,
            5,
            squash=0.45,
        )
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.026 * sign, -0.06, 0.883), (0.011, 0.008, 0.013), 8, 6)
    parts.append(eyes)

    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.008, 0.886), (0.073, 0.079, 0.088), 14, 10)
    face = [v for v in verts if v.co.z < 0.83 or (v.co.y < -0.035 and v.co.z < 0.895)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    # Two locks frame the face.
    for sign in (1, -1):
        kit.cone(hair.bm, (0.052 * sign, -0.036, 0.915), (0.06 * sign, -0.04, 0.8), 0.017, 0.006, 6, squash=0.7)
    # The knot at the crown, where the braid starts.
    kit.sphere(hair.bm, (0, 0.05, 0.955), (0.034, 0.034, 0.03), 10, 7)
    parts.append(hair)

    braid = Part("braid", HAIR, braid_weights)
    path = [
        (0, 0.075, 0.88),
        (0.004, 0.096, 0.82),
        (-0.004, 0.106, 0.76),
        (0.004, 0.11, 0.7),
        (-0.004, 0.114, 0.64),
        (0.004, 0.115, 0.585),
        (-0.003, 0.114, 0.535),
        (0, 0.112, 0.49),
    ]
    for index, point in enumerate(path):
        radius = lerp(0.03, 0.019, index / (len(path) - 1))
        kit.sphere(braid.bm, point, (radius, radius * 0.9, radius * 1.15), 8, 6)
    # A light strand on each bead, so the braid reads as woven.
    for face in braid.bm.faces:
        if face.calc_center_median().x * (1 if int(face.calc_center_median().z * 60) % 2 else -1) > 0.008:
            braid.paint([face], HAIR_LIGHT)
    tie = kit.torus(braid.bm, (0, 0.112, 0.468), (0, 0.1, 1), 0.017, 0.006, 10, 4)
    braid.paint({f for v in tie for f in v.link_faces}, AMBER)
    kit.cone(braid.bm, (0, 0.112, 0.465), (0, 0.112, 0.41), 0.02, 0.004, 6)
    parts.append(braid)

    tiara = Part("tiara", GOLD, "head", shade=0.05)
    kit.torus(tiara.bm, (0, 0.0, 0.912), (0, 0.32, 1), 0.075, 0.005, 18, 4)
    kit.cone(tiara.bm, (0, -0.074, 0.9), (0, -0.07, 0.95), 0.012, 0.001, 4, squash=0.5)
    parts.append(tiara)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.026, 0.024, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    chest = Part("chest", COAT, torso_weights)
    kit.cone(chest.bm, (0, 0, 0.55), (0, 0, 0.735), 0.062, 0.082, 12, squash=0.72)
    parts.append(chest)

    collar = Part("collar", CREAM, "chest")
    verts = kit.cone(collar.bm, (0, 0.004, 0.722), (0, 0.006, 0.775), 0.062, 0.052, 12, caps=False, squash=0.85)
    collar.paint({f for v in verts if v.co.z > 0.77 for f in v.link_faces}, AMBER)
    parts.append(collar)

    corset = Part("corset", LEATHER, torso_weights)
    kit.cone(corset.bm, (0, 0, 0.5), (0, 0, 0.61), 0.067, 0.06, 12, squash=0.76)
    # Two gold leaf clasps on the front of the corset.
    for z in (0.565, 0.595):
        clasp = kit.box(corset.bm, (0, -0.049, z), (0.022, 0.008, 0.012))
        corset.paint({f for v in clasp for f in v.link_faces}, GOLD)
    parts.append(corset)

    belt = Part("belt", hex_color("#7a4a26"), "hips")
    kit.cone(belt.bm, (0, 0, 0.488), (0, 0, 0.512), 0.071, 0.07, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.058, 0.5), (0.024, 0.008, 0.022))
    belt.paint({f for v in buckle for f in v.link_faces}, GOLD)
    parts.append(belt)

    hips = Part("hips", LEGGINGS, "hips")
    kit.cone(hips.bm, (0, 0, 0.42), (0, 0, 0.5), 0.07, 0.068, 12, squash=0.8)
    parts.append(hips)

    parts.append(skirt())

    quiver = Part("quiver", LEATHER, "hips")
    kit.cone(quiver.bm, (-0.09, 0.05, 0.38), (-0.115, 0.1, 0.6), 0.024, 0.028, 8)
    rim = kit.torus(quiver.bm, (-0.115, 0.1, 0.6), (-0.11, 0.22, 1), 0.028, 0.005, 10, 4)
    quiver.paint({f for v in rim for f in v.link_faces}, GOLD)
    for dx, dy, color in ((0.0, 0.0, FLETCH), (0.012, 0.01, CREAM), (-0.01, 0.012, FLETCH)):
        base = Vector((-0.118 + dx, 0.104 + dy, 0.6))
        fletch = kit.cone(quiver.bm, base, base + Vector((-0.012, 0.024, 0.06)), 0.009, 0.001, 4)
        quiver.paint({f for v in fletch for f in v.link_faces}, color)
    parts.append(quiver)
    return parts


def skirt():
    """The coat below the waist: open at the front, long tails at the back."""
    part = Part("skirt", COAT, skirt_weights)
    columns, rows = 16, 6
    gap = math.radians(38)

    def grid(inset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                theta = lerp(gap, 2 * math.pi - gap, column / columns)
                front = (1 + math.cos(theta)) / 2
                back = 1 - front
                hem = 0.12 + 0.18 * front**1.2
                z = lerp(0.53, hem, v)
                radius = lerp(0.072, 0.15 + 0.035 * back, v**0.85) - inset
                y_push = 0.045 * v * back
                line.append(
                    (radius * math.sin(theta), -radius * math.cos(theta) * 0.82 + y_push, z)
                )
            result.append(line)
        return result

    _, outer = kit.sheet(part.bm, grid(0.0))
    _, inner = kit.sheet(part.bm, grid(0.006))
    for face, row, column in outer:
        if row == rows - 1 or column in (0, columns - 1):
            part.paint([face], AMBER)
    for face, row, column in inner:
        part.paint([face], CREAM)
    return part


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t, d) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
        pauldron = Part(f"pauldron.{side}", COAT_DARK, f"upperarm.{side}")
        verts = kit.sphere(pauldron.bm, s + Vector((0.004 * sign, 0, 0.004)), (0.038, 0.036, 0.032), 10, 7)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.008 for f in v.link_faces}, AMBER)
        parts.append(pauldron)

        sleeve = Part(f"sleeve.{side}", COAT, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.028, 0.023, 8)
        parts.append(sleeve)

        cuff = Part(f"cuff.{side}", CREAM, f"forearm.{side}")
        kit.cone(cuff.bm, e - d * 0.012, e + d * 0.03, 0.026, 0.024, 8)
        parts.append(cuff)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}")
        verts = kit.cone(bracer.bm, e + d * 0.03, w, 0.022, 0.019, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.012 for f in v.link_faces}, AMBER)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.025, (0.017, 0.015, 0.024), 8, 6)
        parts.append(hand)

        hip = Vector((0.05 * sign, 0, HIP_Z))
        knee = Vector((0.052 * sign, 0, 0.27))
        ankle = Vector((0.052 * sign, 0, 0.05))
        thigh = Part(f"thigh.{side}", LEGGINGS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.041, 0.032, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        verts = kit.cone(boot.bm, knee + Vector((0, 0, 0.015)), ankle, 0.039, 0.031, 8)
        boot.paint({f for v in verts if v.co.z > 0.28 for f in v.link_faces}, LEATHER)
        guard = kit.cone(boot.bm, knee + Vector((0, -0.024, -0.03)), knee + Vector((0, -0.044, 0.04)), 0.022, 0.003, 5, squash=0.6)
        boot.paint({f for v in guard for f in v.link_faces}, GOLD)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (0.052 * sign, -0.03, 0.025), (0.056, 0.11, 0.05))
        parts.append(foot)
    return parts


def bow_point(s):
    """A point on the bow at s = -1 (bottom tip) to 1 (top tip)."""
    y = BOW_SAG * s * s - max(0.0, abs(s) - 0.8) * BOW_RECURVE
    return GRIP_L + Vector((0, y, s * BOW_HALF))


def bow_parts():
    parts = []
    bow = Part("bow", WOOD, "bow", shade=0.05)
    steps = 14
    points = [bow_point(lerp(-1, 1, i / steps)) for i in range(steps + 1)]
    radii = [lerp(0.014, 0.007, abs(lerp(-1, 1, i / steps)) ** 1.5) for i in range(steps + 1)]
    verts = kit.tube(bow.bm, points, radii, 6)
    for face in {f for v in verts for f in v.link_faces}:
        s = (face.calc_center_median().z - GRIP_L.z) / BOW_HALF
        if abs(s) < 0.12:
            bow.paint([face], GRIP)
        elif abs(s) > 0.78:
            bow.paint([face], GOLD)
    parts.append(bow)

    string = Part("string", CREAM, string_weights, shade=0)
    top, bottom = bow_point(1), bow_point(-1)
    kit.tube(string.bm, [top, STRING_P, bottom], [0.0036] * 3, 4, caps=False)
    parts.append(string)

    arrow = Part("arrow", hex_color("#b88a52"), "arrow", shade=0)
    tip = HAND_R + DR * ARROW_LENGTH
    kit.tube(arrow.bm, [HAND_R, tip], [0.0035, 0.0035], 4)
    head = kit.cone(arrow.bm, tip, tip + DR * 0.035, 0.01, 0.001, 4)
    arrow.paint({f for v in head for f in v.link_faces}, STEEL)
    fletch = kit.cone(arrow.bm, HAND_R + DR * 0.005, HAND_R + DR * 0.05, 0.003, 0.012, 3)
    arrow.paint({f for v in fletch for f in v.link_faces}, FLETCH)
    parts.append(arrow)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("WardenSaelith", BONES)
    parts = head_parts() + body_parts() + limb_parts() + bow_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "WardenSaelithMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole target.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms, and the constraints of the bow, the string and the arrow."""
    empties = {
        "ik_hand.L": kit.add_empty("ik_hand.L", WL),
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "pole.L": kit.add_empty("pole.L", (0.25, -0.15, 0.7)),
        "pole.R": kit.add_empty("pole.R", (-0.05, 0.45, 0.85)),
        "bow_aim": kit.add_empty("bow_aim"),
    }
    bones = rig.pose.bones
    for side in ("L", "R"):
        ik = bones[f"forearm.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = empties[f"ik_hand.{side}"]
        ik.pole_target = empties[f"pole.{side}"]
        ik.pole_angle = math.radians(POLE_ANGLE)
        ik.chain_count = 2
    aim = bones["bow"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["bow_aim"]
    draw = bones["string"].constraints.new("COPY_LOCATION")
    draw.name = "Draw"
    draw.target = rig
    draw.subtarget = "hand.R"
    draw.head_tail = 0.5
    nock = bones["arrow"].constraints.new("DAMPED_TRACK")
    nock.name = "Nock"
    nock.target = rig
    nock.subtarget = "bow"
    nock.head_tail = 0.0
    return empties


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    bow_rest = rig.data.bones["bow"].matrix_local.to_quaternion()
    # At rest the bow stands nearly upright, its top a little forward.
    rest_aim = Quaternion(X, math.radians(10)) @ bow_rest

    def stand(breath=0.0, sway=0.0):
        """The idle stance: the bow low and a little forward in the left hand."""
        return {
            "spine": t("spine", (X, 2 + breath * 0.5)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (X, 2)),
            "head": t("head", (X, 2 + breath), (Z, sway * 4)),
            "upperarm.L": t("upperarm.L", (Y, 12 + breath), (X, -8)),
            "forearm.L": t("forearm.L", (X, -28)),
            "hand.L": t("hand.L", (X, 10)),
            "upperarm.R": t("upperarm.R", (Y, -12 - breath), (X, 4)),
            "forearm.R": t("forearm.R", (X, -14)),
            "braid1": t("braid1", (X, -breath * 2), (Y, sway * 3)),
            "braid2": t("braid2", (Y, sway * 4)),
            "braid3": t("braid3", (Y, sway * 5)),
            "tail1": t("tail1", (X, -breath)),
            "thigh.L": t("thigh.L", (Y, -2)),
            "thigh.R": t("thigh.R", (Y, 2)),
            "arrow@scale": 0.0,
            "arrow/Nock": 1.0,
            "bow/Aim": 1.0,
            "bow_aim@rot": rest_aim,
        }

    def pose(base, **changes):
        result = dict(base)
        for key, value in changes.items():
            result[key.replace("__", ".").replace("_at_", "@").replace("_slash_", "/")] = value
        return result

    def crouch(base):
        """Down on both knees bent, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.135)),
            thigh__L=t("thigh.L", (X, -50), (Y, -4)),
            shin__L=t("shin.L", (X, 95)),
            foot__L=t("foot.L", (X, -45)),
            thigh__R=t("thigh.R", (X, -50), (Y, 4)),
            shin__R=t("shin.R", (X, 95)),
            foot__R=t("foot.R", (X, -45)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 22)),
            braid1=t("braid1", (X, -48)),
            braid2=t("braid2", (X, -12)),
            upperarm__L=t("upperarm.L", (Y, 18), (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, -20)),
            forearm__R=t("forearm.R", (X, -30)),
            tail1=t("tail1", (X, -25)),
            tail2=t("tail2", (X, -20)),
        )

    def slump(breath=0.0):
        """Low HP: bent over, the right hand on the side, the bow low."""
        return pose(
            stand(),
            bow_slash_Aim=0.0,
            hips_at_loc=at("hips", (0, 0, -0.02)),
            spine=t("spine", (X, 12 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2), (Z, 6)),
            neck=t("neck", (X, 8)),
            head=t("head", (X, 4 + breath * 4), (Y, -6)),
            upperarm__L=t("upperarm.L", (Y, 16), (X, 6)),
            forearm__L=t("forearm.L", (X, -8)),
            hand__L=t("hand.L", (X, 30)),
            upperarm__R=t("upperarm.R", (X, -12), (Y, -22)),
            forearm__R=t("forearm.R", (X, -85), (Z, 65)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 26)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -8), (Y, 4)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -10)),
            braid1=t("braid1", (X, -28)),
            braid2=t("braid2", (X, -8)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -14 * amount), (Z, 8 * amount)),
            upperarm__L=t("upperarm.L", (Y, -10 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, 18 * amount), (X, 10 * amount)),
            forearm__R=t("forearm.R", (X, -40 * amount)),
            braid1=t("braid1", (X, 14 * amount)),
            tail1=t("tail1", (X, 10 * amount)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the bow flat on the ground beside her."""
        return pose(
            base,
            bow_slash_Aim=1.0,
            bow_aim_at_rot=Quaternion(X, math.radians(-90)) @ bow_rest,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.045)),
            spine=t("spine", (X, -6)),
            head=t("head", (X, -12), (Z, 25)),
            upperarm__L=t("upperarm.L", (Y, -35), (X, 20)),
            upperarm__R=t("upperarm.R", (Y, 35), (X, 20)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 8)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 30)),
            braid1=t("braid1", (X, -40)),
            tail1=t("tail1", (X, -50)),
        )

    def stagger(base):
        return pose(
            base,
            bow_slash_Aim=0.0,
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            thigh__L=t("thigh.L", (X, -18)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -12)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 20)),
            braid1=t("braid1", (X, -34)),
            braid2=t("braid2", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -10)),
            hand__L=t("hand.L", (X, 30)),
        )

    def heroic(base):
        """Up again, the bow high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.008)),
            chest=t("chest", (X, -12)),
            head=t("head", (X, -12)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, 6)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -30)),
            braid1=t("braid1", (X, 12)),
            tail1=t("tail1", (X, 12)),
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.012)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -12), (X, -14 * front)),
                "upperarm__L": t("upperarm.L", (Y, 12), (X, -8 + 6 * front)),
                "braid1": t("braid1", (X, -6), (Y, 4 * front)),
                "tail1": t("tail1", (X, -8)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        sign = 1 if lifted == "L" else -1
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.008)),
            spine=t("spine", (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "braid1": t("braid1", (X, -4), (Y, -2 * sign)),
                "tail1": t("tail1", (X, -4)),
            },
        )

    # The attack: the figure turns side-on, aims, draws and shoots. The arrow
    # effect leaves at 20% of the attack (`FLIGHT_START` in fx.ts), so the
    # string is released at frame 6 of 30.
    def stance(base):
        return pose(
            base,
            hips=t("hips", (Z, -40)),
            spine=t("spine", (Z, -20)),
            chest=t("chest", (Z, -15), (X, -4)),
            head=t("head", (Z, 58), (X, -4)),
            thigh__L=t("thigh.L", (Z, 30), (Y, -8)),
            thigh__R=t("thigh.R", (Z, 30), (Y, 8)),
            braid1=t("braid1", (Y, -10)),
        )

    aim_q = Quaternion(Y, math.radians(-8)) @ bow_rest
    bow_wrist = Vector((0.03, -0.34, 0.78))

    def aiming(base, right, draw):
        return pose(
            stance(base),
            **{
                "forearm__L_slash_IK": 1.0,
                "forearm__R_slash_IK": 1.0,
                "bow_slash_Aim": 1.0,
                "string_slash_Draw": draw,
                "arrow_at_scale": 1.0 if draw > 0 else 0.0,
                "ik_hand__L_at_pos": bow_wrist,
                "ik_hand__R_at_pos": Vector(right),
                "bow_aim_at_rot": aim_q,
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    nocked = (0.03, -0.3, 0.78)
    drawn = (0.035, -0.06, 0.8)
    loose = (0.04, 0.0, 0.82)
    attack.key(0, stand())
    attack.key(2, aiming(stand(), nocked, 1.0))
    attack.key(6, aiming(stand(), drawn, 1.0))
    attack.key(7, aiming(stand(), loose, 0.0))
    attack.key(14, aiming(stand(), (0.045, 0.02, 0.8), 0.0))
    attack.key(22, stand())
    attack.key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 24)
    call = pose(
        stand(),
        hips_at_loc=at("hips", (0, 0, 0.006)),
        chest=t("chest", (X, -10)),
        head=t("head", (X, -18)),
        upperarm__R=t("upperarm.R", (X, -160), (Y, -8)),
        forearm__R=t("forearm.R", (X, -10)),
        upperarm__L=t("upperarm.L", (Y, -20)),
        braid1=t("braid1", (X, 8)),
    )
    cast.key(0, stand()).key(6, call).key(10, pose(call, hips_at_loc=at("hips", (0, 0, 0.014)))).key(16, call).key(24, stand())
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
    rebirth.key(32, crouch(stand())).key(41, heroic(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0, -0.06))))
    summon.key(17, heroic(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "warden-saelith.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
