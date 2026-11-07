"""
Thornline Archer (`elf.thornlineArcher`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a calm elf man archer with
golden hair swept back to a short tail, a green tunic under a mantle of
leaves, a brown leather jerkin with straps, a green coat skirt with an
amber hem and a ragged leaf edge, brown trousers, tall brown boots with
amber knee guards, a quiver of green-fletched arrows at the right hip and a
recurved bow of dark thorn wood with amber tips and hooked ends. His arrow
has a head wet with green sap (Poison). Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/thornline-archer.glb`;
then `bun unit-model:pack thornline-archer` packs it for the game.

He holds the bow low in the left hand and the poisoned arrow in the right
hand, its head down, so the camera sees the green sap. His attack is a
composed standing shot: he turns side-on, nocks, draws to the cheek and
lets go. He has no Keyword that he uses by his own action, so he has no
cast clip.
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

import body_plans  # noqa: E402
import clips  # noqa: E402
import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)
importlib.reload(body_plans.shared)
importlib.reload(body_plans.biped)
importlib.reload(body_plans.biped_medium)
importlib.reload(clips.base)
importlib.reload(clips.overrides)
importlib.reload(clips.biped)
importlib.reload(clips.biped_medium)

from clips.base import Beat  # noqa: E402
from clips.overrides import Fall, Patch  # noqa: E402

from unit_model_kit import X, Y, Z, Part, blend, clamp01, faces_of, hex_color, lerp  # noqa: E402

plan = body_plans.BODY_PLANS["biped-medium"]

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#e6b48e")
HAIR = hex_color("#d0a65e")
HAIR_LIGHT = hex_color("#ead08e")
HAIR_DARK = hex_color("#a27a3c")
EYES = hex_color("#333516")
BROW = hex_color("#94703a")
TUNIC = hex_color("#656931")
TUNIC_DARK = hex_color("#52572b")
LEAF = hex_color("#6f9a40")
LEAF_LIGHT = hex_color("#9cbc5a")
LEAF_DARK = hex_color("#3f6228")
AMBER = hex_color("#dd9a38")
AMBER_DARK = hex_color("#a86a22")
CREAM = hex_color("#ece0c2")
LEATHER = hex_color("#7a4e2c")
LEATHER_DARK = hex_color("#4a2e1a")
TROUSERS = hex_color("#5c4232")
BOOT = hex_color("#6a4329")
WOOD = hex_color("#4a2d1a")
WOOD_DARK = hex_color("#2e1b0f")
THORN = hex_color("#7a5a36")
SHAFT = hex_color("#b88a52")
SAP = hex_color("#9ee04a")
SAP_DARK = hex_color("#5fa02a")
FLETCH = hex_color("#4f9a3e")

# --- Proportions ---------------------------------------------------------------

TABLE = plan.Proportions(shoulder_width=0.208, shoulder_root_x=0.02, hip_x=0.054, knee_x=0.054)
HIP_Z = TABLE.hip_z
WAIST_Z = TABLE.waist_z
CHEST_Z = TABLE.chest_z
SHOULDER_Z = TABLE.shoulder_z
NECK_Z = TABLE.neck_z
HEAD_C = Vector((0, -0.004, 0.872))
LEG_X = TABLE.hip_x

# The arms hang in an A-pose, 22 degrees from the body.
ARM_DIR = Vector((math.sin(math.radians(22)), 0, -math.cos(math.radians(22))))


def arm_points(sign):
    shoulder = Vector((0.104 * sign, 0, SHOULDER_Z))
    direction = Vector((ARM_DIR.x * sign, 0, ARM_DIR.z))
    elbow = shoulder + direction * 0.15
    wrist = elbow + direction * 0.14
    tip = wrist + direction * 0.055
    return shoulder, elbow, wrist, tip, direction


SL, EL, WL, TL, DL = arm_points(1)
SR, ER, WR, TR, DR = arm_points(-1)
GRIP_L = WL + DL * 0.025
HAND_R = WR + DR * 0.025

# A recurved bow: the limbs bend back to the string, and the tips hook
# forward again.
BOW_HALF = 0.3
BOW_SAG = 0.075
BOW_RECURVE = 0.2
# The string sits behind the grip by the brace height.
BRACE = BOW_SAG - (1 - 0.78) * BOW_RECURVE
STRING_P = GRIP_L + Vector((0, BRACE, 0))
ARROW_LENGTH = 0.32

TRUNK_BONES = [
    ("hair", (0, 0.07, 0.86), (0, 0.1, 0.74), "head"),
    ("coat.B", (0, 0.07, 0.5), (0, 0.11, 0.16), "hips"),
]
PROP_BONES = [
    ("bow", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("string", tuple(STRING_P), tuple(STRING_P + Vector((0, 0, 0.05))), "bow"),
    # At rest the arrow hangs along the right hand, head down. The attack aims it at the bow.
    ("arrow", tuple(HAND_R), tuple(HAND_R + DR * 0.1), "hand.R"),
]
ARMS = {"L": (EL, WL, TL), "R": (ER, WR, TR)}

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def hair_weights(co):
    back = clamp01((co.y - 0.04) / 0.04) * clamp01((0.85 - co.z) / 0.05)
    return {"head": 1 - back, "hair": back}


def skirt_weights(co):
    """The coat skirt follows the hips at the top, and the legs and its back panel lower."""
    t = clamp01((0.5 - co.z) / 0.3)
    back = clamp01((co.y - 0.0) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "coat.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side),
        "thigh.R": (1 - back) * t * clamp01(-side),
    }


def string_weights(co):
    near = 1 - clamp01(abs(co.z - STRING_P.z) / BOW_HALF)
    return {"string": near, "bow": 1 - near}


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
    kit.sphere(head.bm, HEAD_C, (0.06, 0.066, 0.079), 14, 10)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.06, -0.004)), HEAD_C + Vector((0, -0.078, -0.016)), 0.011, 0.002, 5)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.03, -0.05)), HEAD_C + Vector((0, -0.048, -0.078)), 0.03, 0.01, 6)
    for sign in (1, -1):
        # Elf ears: long points that go up and back.
        kit.cone(head.bm, HEAD_C + Vector((0.055 * sign, 0.006, -0.002)), HEAD_C + Vector((0.125 * sign, 0.042, 0.05)), 0.016, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.056, 0.006)), (0.011, 0.007, 0.007), 8, 6)
        # Calm, level brows: a composed shot.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.059, 0.024)), (0.016, 0, 0.002 * sign), (0, 0.005, 0), (0, 0, 0.004))
        face.paint(faces_of(brow), BROW)
    parts.append(face)

    neck = Part("neck", SKIN, plan.neck_weights(TABLE))
    rings = kit.shares(0.74, 0.81, NECK_Z, NECK_Z + 0.01)
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.025, 0.023, 8, loops=rings)
    parts.append(neck)

    # Golden hair swept back from the brow, to a short tail at the nape.
    hair = Part("hair", HAIR, hair_weights, shade=0.12)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.068, 0.075, 0.082), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.03 or (v.co.y < HEAD_C.y - 0.035 and v.co.z < HEAD_C.z + 0.05)]
    kit.bmesh.ops.delete(hair.bm, geom=face_verts, context="VERTS")
    for index, x in enumerate((-0.045, -0.015, 0.015, 0.045)):
        # Waves swept back over the top.
        wave = kit.cone(hair.bm, HEAD_C + Vector((x, -0.052, 0.058)), HEAD_C + Vector((x * 1.3, 0.06, 0.05)), 0.018, 0.012, 5, squash=0.6)
        hair.paint(faces_of(wave), (HAIR_LIGHT, HAIR)[index % 2])
    for sign in (1, -1):
        # The hair over the ears falls a little lower, behind the ears.
        side = kit.tube(hair.bm, [HEAD_C + Vector((0.06 * sign, 0.02, 0.02)), HEAD_C + Vector((0.066 * sign, 0.04, -0.04)), HEAD_C + Vector((0.058 * sign, 0.05, -0.08))], [0.02, 0.016, 0.004], 5)
        hair.paint(faces_of(side), HAIR_DARK)
    tie = kit.torus(hair.bm, HEAD_C + Vector((0, 0.078, -0.03)), (0, 0.6, 1), 0.016, 0.005, 10, 3)
    hair.paint(faces_of(tie), LEATHER_DARK)
    tail = kit.tube(hair.bm, [HEAD_C + Vector((0, 0.08, -0.03)), HEAD_C + Vector((0, 0.1, -0.08)), HEAD_C + Vector((0, 0.1, -0.13))], [0.02, 0.018, 0.004], 6)
    hair.paint(faces_of(tail), HAIR)
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", TUNIC, torso_weights, shade=0.14)
    rings = kit.shares(0.48, 0.735, WAIST_Z - 0.025, WAIST_Z, WAIST_Z + 0.025)
    kit.cone(tunic.bm, (0, 0, 0.48), (0, 0, 0.735), 0.068, 0.082, 12, squash=0.76, loops=rings)
    parts.append(tunic)

    # The leather jerkin over the tunic, laced at the front.
    jerkin = Part("jerkin", LEATHER, torso_weights, shade=0.1)
    kit.cone(jerkin.bm, (0, -0.002, 0.53), (0, -0.002, 0.68), 0.073, 0.082, 12, caps=False, squash=0.78)
    for z in (0.56, 0.6, 0.64):
        lace = kit.slab(jerkin.bm, (0, -0.066, z), (0.018, 0, 0), (0, 0.004, 0), (0, 0, 0.003))
        jerkin.paint(faces_of(lace), AMBER)
    # The quiver strap across the chest, from the left shoulder to the right hip.
    strap = kit.tube(jerkin.bm, [(0.075, -0.045, 0.73), (0.0, -0.074, 0.63), (-0.075, -0.05, 0.52)], [0.008] * 3, 4)
    jerkin.paint(faces_of(strap), LEATHER_DARK)
    buckle = kit.box(jerkin.bm, (0.035, -0.07, 0.68), (0.016, 0.006, 0.016))
    jerkin.paint(faces_of(buckle), AMBER)
    parts.append(jerkin)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.47), (0, 0, 0.5), 0.08, 0.078, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.065, 0.485), (0.022, 0.008, 0.022))
    belt.paint(faces_of(buckle), AMBER)
    parts.append(belt)

    hips = Part("hips", TROUSERS, plan.hips_weights(TABLE))
    rings = kit.shares(0.41, 0.49, HIP_Z - 0.02, HIP_Z)
    kit.cone(hips.bm, (0, 0, 0.41), (0, 0, 0.49), 0.068, 0.066, 12, squash=0.8, loops=rings)
    parts.append(hips)

    def skirt_color(row, column):
        if row == 4 or column in (0, 13):
            return AMBER
        return TUNIC_DARK if column % 4 == 2 else TUNIC

    # The coat skirt to the knees, open at the front, with a ragged leaf hem.
    skirt = Part("skirt", TUNIC, skirt_weights)
    kit.ragged_cone(skirt, 0.49, 0.26, 0.078, 0.13, 14, 5, 0.8, 0.05, skirt_color, CREAM, gap=math.radians(36), y_push=0.025)
    for index in range(8):
        angle = math.radians(-140 + index * 40)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0.01, 0.3)) + out * 0.12
        leaf(skirt, base, out * 0.4 + Vector((0, 0.1, -1)), 0.075, 0.026, (LEAF, LEAF_DARK, AMBER_DARK)[index % 3])
    parts.append(skirt)

    # The mantle: a short cape of big leaves over the shoulders.
    mantle = Part("mantle", LEAF, "chest", shade=0.06)
    kit.cone(mantle.bm, (0, 0.004, 0.7), (0, 0.004, 0.755), 0.092, 0.06, 12, caps=False, squash=0.82)
    for index in range(12):
        angle = math.radians(-140 + index * 25.5)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0, 0.74)) + out * 0.075
        leaf(mantle, base, out * 0.9 + Vector((0, 0, -0.75)), 0.095, 0.032, (LEAF_LIGHT, LEAF, LEAF_DARK)[index % 3])
    clasp = kit.sphere(mantle.bm, (0, -0.064, 0.735), (0.014, 0.01, 0.014), 8, 5)
    mantle.paint(faces_of(clasp), AMBER)
    parts.append(mantle)

    # The quiver at the right hip, a little back, so the camera sees it.
    quiver = Part("quiver", LEATHER, "hips", shade=0.1)
    bottom = Vector((-0.09, 0.06, 0.3))
    top = Vector((-0.118, 0.1, 0.56))
    kit.cone(quiver.bm, bottom, top, 0.026, 0.03, 8)
    rim = kit.torus(quiver.bm, top, (top - bottom), 0.03, 0.005, 10, 3)
    quiver.paint(faces_of(rim), AMBER)
    band = kit.cone(quiver.bm, bottom.lerp(top, 0.4), bottom.lerp(top, 0.48), 0.028, 0.029, 8)
    quiver.paint(faces_of(band), LEATHER_DARK)
    up = (top - bottom).normalized()
    for dx, dy, color in ((0.0, 0.0, FLETCH), (0.014, 0.008, CREAM), (-0.01, 0.014, FLETCH), (0.006, -0.012, FLETCH)):
        foot = top + Vector((dx, dy, -0.01))
        tip = foot + up * 0.06
        kit.cone(quiver.bm, foot, tip, 0.003, 0.003, 4)
        fletch = kit.cone(quiver.bm, tip - up * 0.024, tip + up * 0.01, 0.009, 0.002, 4)
        quiver.paint(faces_of(fletch), color)
    parts.append(quiver)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t, d) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
        sleeve = Part(f"sleeve.{side}", TUNIC, f"upperarm.{side}")
        kit.sphere(sleeve.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.032, 0.032, 0.03), 8, 6)
        kit.cone(sleeve.bm, s, e, 0.027, 0.023, 8)
        parts.append(sleeve)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}")
        verts = kit.cone(bracer.bm, e + d * 0.01, w, 0.024, 0.02, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.014 for f in v.link_faces}, AMBER)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.025, (0.017, 0.016, 0.024), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, 0.27))
        ankle = Vector((LEG_X * sign, 0, 0.05))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.041, 0.032, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        verts = kit.cone(boot.bm, knee + Vector((0, 0, 0.02)), ankle, 0.039, 0.031, 8)
        boot.paint({f for v in verts if v.co.z > 0.27 for f in v.link_faces}, LEATHER_DARK)
        guard = kit.cone(boot.bm, knee + Vector((0, -0.024, -0.03)), knee + Vector((0, -0.044, 0.04)), 0.022, 0.003, 5, squash=0.6)
        boot.paint(faces_of(guard), AMBER)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.025), (0.056, 0.11, 0.05))
        parts.append(foot)
    return parts


def bow_point(s):
    """A point on the bow at s = -1 (bottom tip) to 1 (top tip)."""
    hook = max(0.0, abs(s) - 0.78) / 0.22
    y = BOW_SAG * s * s - hook * hook * BOW_RECURVE * 0.22
    return GRIP_L + Vector((0, y, s * BOW_HALF * (1 - 0.06 * hook)))


def bow_parts():
    parts = []
    bow = Part("bow", WOOD, "bow", shade=0.05)
    steps = 16
    points = [bow_point(lerp(-1, 1, i / steps)) for i in range(steps + 1)]
    radii = [lerp(0.014, 0.006, abs(lerp(-1, 1, i / steps)) ** 1.5) for i in range(steps + 1)]
    verts = kit.tube(bow.bm, points, radii, 6)
    for face in faces_of(verts):
        s = (face.calc_center_median().z - GRIP_L.z) / BOW_HALF
        if abs(s) < 0.12:
            bow.paint([face], WOOD_DARK)
        elif abs(s) > 0.8:
            bow.paint([face], AMBER)
    # Thorns on the back of the limbs, and the hooked tips.
    for index, s in enumerate((-0.68, -0.5, -0.32, 0.32, 0.5, 0.68)):
        base = bow_point(s)
        out = Vector((0.4 * (1 if index % 2 else -1), -1, 0.4 * (1 if s > 0 else -1))).normalized()
        thorn = kit.cone(bow.bm, base, base + out * 0.03, 0.007, 0.001, 4)
        bow.paint(faces_of(thorn), THORN)
    for sign in (1, -1):
        tip = bow_point(sign)
        hook = kit.cone(bow.bm, tip, tip + Vector((0, -0.03, 0.012 * sign)), 0.006, 0.001, 4)
        bow.paint(faces_of(hook), AMBER_DARK)
    # A vine with two leaves wound on the bow above the grip.
    for s, x in ((0.18, 1), (-0.16, -1)):
        leaf(bow, bow_point(s), Vector((0.8 * x, -0.4, 0.6 * (1 if s > 0 else -1))), 0.045, 0.016, LEAF)
    parts.append(bow)

    string = Part("string", CREAM, string_weights, shade=0)
    top, bottom = bow_point(0.98), bow_point(-0.98)
    kit.tube(string.bm, [top, STRING_P, bottom], [0.0034] * 3, 4, caps=False)
    parts.append(string)

    arrow = Part("arrow", SHAFT, "arrow", shade=0)
    tip = HAND_R + DR * ARROW_LENGTH
    kit.tube(arrow.bm, [HAND_R - DR * 0.02, tip], [0.0038, 0.0038], 4)
    # The head is wet with green sap, and a drop hangs from it.
    head = kit.cone(arrow.bm, tip - DR * 0.01, tip + DR * 0.045, 0.013, 0.001, 4)
    arrow.paint(faces_of(head), SAP_DARK)
    coat = kit.cone(arrow.bm, tip - DR * 0.05, tip + DR * 0.0, 0.0065, 0.008, 5)
    arrow.paint(faces_of(coat), SAP)
    drop = kit.sphere(arrow.bm, tip + DR * 0.02 + Vector((0.0, 0.0, -0.016)), (0.006, 0.006, 0.01), 6, 4)
    arrow.paint(faces_of(drop), SAP)
    fletch = kit.cone(arrow.bm, HAND_R - DR * 0.015, HAND_R + DR * 0.04, 0.003, 0.013, 3)
    arrow.paint(faces_of(fletch), FLETCH)
    parts.append(arrow)
    return parts


def build_figure():
    kit.reset_scene()
    rig, _ = plan.build_rig("ThornlineArcher", TABLE, TRUNK_BONES, PROP_BONES, ARMS)
    parts = head_parts() + body_parts() + limb_parts() + bow_parts()
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "ThornlineArcherMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole target.


def add_controls(rig):
    """IK for the arms, and the constraints of the bow, the string and the arrow."""
    empties = plan.add_arm_ik(rig, TABLE, ARMS)
    empties["bow_aim"] = kit.add_empty("bow_aim")
    bones = rig.pose.bones
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


# Where the right hand goes as he nocks, draws, lets go and follows through.
NOCKED = (0.03, -0.3, 0.78)
DRAWN = (0.035, -0.06, 0.8)
LOOSE = (0.04, 0.0, 0.82)
FOLLOW = (0.045, 0.02, 0.8)

PATCHES = (
    # A composed standing shot. He takes the next arrow from the quiver as he
    # lowers the bow.
    Patch(
        "attack",
        "bow-draw",
        beats=(
            Beat(0),
            Beat(2, "aiming", (NOCKED, 1.0)),
            Beat(6, "aiming", (DRAWN, 1.0)),
            Beat(7, "aiming", (LOOSE, 0.0, 0.0)),
            Beat(14, "aiming", (FOLLOW, 0.0, 0.0)),
            Beat(21, "next_arrow"),
            Beat(26),
            Beat(30),
        ),
    ),
)


class Poses(clips.biped_medium.Poses):
    fall = Fall(X, -86, (0, 0, 0.1))

    def __init__(self, rig):
        super().__init__(*kit.pose_tools(rig))
        self.bow_rest = rig.data.bones["bow"].matrix_local.to_quaternion()
        # At rest the bow stands nearly upright, its top a little forward.
        self.rest_aim = Quaternion(X, math.radians(12)) @ self.bow_rest
        self.aim_q = Quaternion(Y, math.radians(-8)) @ self.bow_rest
        self.bow_wrist = Vector((0.03, -0.34, 0.78))

    def stance(self, breath=0.0, sway=0.0):
        """
        The idle stance: calm and upright, the bow low in the left hand, and
        the poisoned arrow in the right hand, its head down and a little
        forward, so the camera sees the sap.
        """
        t = self.t
        return {
            "hips": t("hips", (Z, -6)),
            "spine": t("spine", (X, 2 + breath * 0.5)),
            "chest": t("chest", (X, -2 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, 2)),
            "head": t("head", (X, 2 + breath), (Z, 6 + sway * 4)),
            "hair": t("hair", (X, -breath * 3), (Y, sway * 4)),
            "upperarm.L": t("upperarm.L", (Y, 10 + breath), (X, -10)),
            "forearm.L": t("forearm.L", (X, -30)),
            "hand.L": t("hand.L", (X, 12)),
            "upperarm.R": t("upperarm.R", (Y, -6 - breath), (X, -8)),
            "forearm.R": t("forearm.R", (X, -24)),
            "hand.R": t("hand.R", (X, 70), (Z, 10)),
            "coat.B": t("coat.B", (X, 2 + breath * 2)),
            "thigh.L": t("thigh.L", (X, -6), (Y, -3)),
            "shin.L": t("shin.L", (X, 6)),
            "thigh.R": t("thigh.R", (X, 4), (Y, 3)),
            "foot.R": t("foot.R", (Z, 10)),
            "arrow@scale": 1.0,
            "arrow/Nock": 0.0,
            "bow/Aim": 1.0,
            "bow_aim@rot": self.rest_aim,
        }

    def crouch(self, base):
        """Down on both knees bent, as a summon starts and a Rebirth gets up."""
        t, at = self.t, self.at
        return self.pose(
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
            hair=t("hair", (X, -30)),
            upperarm__L=t("upperarm.L", (Y, 18), (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, -20)),
            forearm__R=t("forearm.R", (X, -30)),
            coat__B=t("coat.B", (X, -25)),
        )

    def slump(self, base, breath=0.0):
        """Low HP: bent over, the right hand on the side, the bow low."""
        t, at = self.t, self.at
        return self.pose(
            self.stance(),
            bow_slash_Aim=0.0,
            hips_at_loc=at("hips", (0, 0, -0.02)),
            spine=t("spine", (X, 12 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2), (Z, 6)),
            neck=t("neck", (X, 8)),
            head=t("head", (X, 4 + breath * 4), (Y, -6)),
            hair=t("hair", (X, -20)),
            upperarm__L=t("upperarm.L", (Y, 16), (X, 6)),
            forearm__L=t("forearm.L", (X, -8)),
            hand__L=t("hand.L", (X, 30)),
            upperarm__R=t("upperarm.R", (X, -12), (Y, -22)),
            forearm__R=t("forearm.R", (X, -85), (Z, 65)),
            hand__R=t("hand.R", (X, 0)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 26)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -8), (Y, 4)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -10)),
        )

    def recoil(self, base, amount=1.0):
        """The hit pushes the upper body back."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -14 * amount), (Z, 8 * amount)),
            hair=t("hair", (X, 14 * amount)),
            upperarm__L=t("upperarm.L", (Y, -10 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, 18 * amount), (X, 10 * amount)),
            forearm__R=t("forearm.R", (X, -40 * amount)),
            coat__B=t("coat.B", (X, 10 * amount)),
        )

    def fallen(self, base, bounce=0.0):
        """Flat on the back, the bow flat on the ground beside him."""
        t, at = self.t, self.at
        return self.pose(
            base,
            bow_slash_Aim=1.0,
            bow_aim_at_rot=Quaternion(X, math.radians(-90)) @ self.bow_rest,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.05)),
            # The arrow falls from his hand, so it does not go through the ground.
            arrow_at_scale=0.0,
            spine=t("spine", (X, -6)),
            head=t("head", (X, -12), (Z, -25)),
            hair=t("hair", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, -35), (X, 20)),
            upperarm__R=t("upperarm.R", (Y, 35), (X, 20)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 8)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 30)),
            coat__B=t("coat.B", (X, -50)),
        )

    def stagger(self, base):
        t, at = self.t, self.at
        return self.pose(
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
            hair=t("hair", (X, -24)),
            upperarm__L=t("upperarm.L", (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -10)),
            hand__L=t("hand.L", (X, 30)),
        )

    def heroic(self, base):
        """Up again, the bow high in salute: the end of a summon and a Rebirth."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.008)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -10)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, 6)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -20)),
            hair=t("hair", (X, 10)),
            coat__B=t("coat.B", (X, 10)),
        )

    def step(self, base, front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        t, at = self.t, self.at
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return self.pose(
            self.stance(),
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
                "upperarm__R": t("upperarm.R", (Y, -6), (X, -8 - 12 * front)),
                "upperarm__L": t("upperarm.L", (Y, 10), (X, -10 + 6 * front)),
                "hair": t("hair", (X, -6), (Y, 4 * front)),
                "coat__B": t("coat.B", (X, 8), (Y, 4 * front)),
            },
        )

    def passing(self, base, lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        t, at = self.t, self.at
        planted = "R" if lifted == "L" else "L"
        return self.pose(
            self.stance(),
            hips_at_loc=at("hips", (0, 0, 0.008)),
            spine=t("spine", (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "hair": t("hair", (X, -4)),
                "coat__B": t("coat.B", (X, 4)),
            },
        )

    def side_on(self, base):
        t = self.t
        return self.pose(
            base,
            hips=t("hips", (Z, -40)),
            spine=t("spine", (Z, -20)),
            chest=t("chest", (Z, -15), (X, -4)),
            head=t("head", (Z, 58), (X, -4)),
            hair=t("hair", (Y, -10)),
            thigh__L=t("thigh.L", (Z, 30), (Y, -8)),
            thigh__R=t("thigh.R", (Z, 30), (Y, 8)),
            foot__R=t("foot.R", (Z, 0)),
        )

    def aiming(self, base, right, draw, arrow=1.0):
        return self.pose(
            self.side_on(base),
            **{
                "forearm__L_slash_IK": 1.0,
                "forearm__R_slash_IK": 1.0,
                "bow_slash_Aim": 1.0,
                "string_slash_Draw": draw,
                "arrow_slash_Nock": 1.0,
                "arrow_at_scale": arrow,
                "ik_hand__L_at_pos": self.bow_wrist,
                "ik_hand__R_at_pos": Vector(right),
                "bow_aim_at_rot": self.aim_q,
            },
        )

    def next_arrow(self, base):
        t = self.t
        return self.pose(base, arrow_at_scale=0.0, upperarm__R=t("upperarm.R", (X, 20), (Y, -16)), forearm__R=t("forearm.R", (X, -60)))

    def rising(self, base):
        return self.pose(self.crouch(base), hips_at_loc=self.at("hips", (0, 0, -0.06)))


def build_clips(rig):
    return clips.overrides.build(clips.biped_medium.CLIPS, Poses(rig), PATCHES, without=("cast",))


def build(export=True):
    rig, mesh = build_figure()
    empties = add_controls(rig)
    baked = [kit.bake_clip(rig, empties, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, empties)
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "thornline-archer.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
