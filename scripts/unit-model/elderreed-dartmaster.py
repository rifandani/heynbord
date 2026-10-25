"""
Elderreed Dartmaster (`elf.elderreedDartmaster`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an older elf woman with silver
hair tied back in a low knot, a layered green leaf cloak with its hood down,
a green tunic with gold trim, leather bracers, brown leggings and tall boots.
A leather case of thorn darts with green sap hangs at her right hip, and she
carries a very long reed blowpipe with gold bands. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/elderreed-dartmaster.glb`;
then `bun unit-model:pack elderreed-dartmaster` packs it for the game.

At rest she holds the blowpipe in the right hand, the mouth of the pipe on
the ground, as a staff: the camera sees the pipe and the dart case on her
right side. Her attack (Long Range) lifts the pipe to her lips with IK for the
right hand and the `Aim` constraint, and the left hand holds it in front (IK
to the `grip.L` bone). The dart leaves at 20% of the clip, with a puff of
green sap at the mouth of the pipe (the `puff` bone). She has no Keyword that
she uses by her own action, so she has no cast clip.
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

SKIN = hex_color("#e2b28c")
HAIR = hex_color("#c4bfb4")
HAIR_LIGHT = hex_color("#e4e0d6")
HAIR_DARK = hex_color("#9a958a")
EYES = hex_color("#1f2a1a")
BROW = hex_color("#8c877c")
LEAF = hex_color("#5d7a34")
LEAF_DARK = hex_color("#3d5424")
LEAF_LIGHT = hex_color("#8aa452")
TUNIC = hex_color("#6f7f36")
GOLD = hex_color("#d8a843")
LEATHER = hex_color("#6b4528")
LEATHER_DARK = hex_color("#442b19")
LEGGINGS = hex_color("#4f3522")
BOOT = hex_color("#6e4a2c")
CREAM = hex_color("#ece0c2")
REED = hex_color("#8a8c48")
REED_DARK = hex_color("#62652f")
SAP = hex_color("#9ee04a")
SAP_DARK = hex_color("#5fa02a")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.006, 0.872))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.054

# The arms hang in an A-pose, 20 degrees from the body.
ARM_DIR = Vector((math.sin(math.radians(20)), 0, -math.cos(math.radians(20))))


def arm_points(sign):
    shoulder = Vector((0.1 * sign, 0, SHOULDER_Z))
    direction = Vector((ARM_DIR.x * sign, 0, ARM_DIR.z))
    elbow = shoulder + direction * 0.15
    wrist = elbow + direction * 0.14
    tip = wrist + direction * 0.055
    return shoulder, elbow, wrist, tip, direction


SL, EL, WL, TL, DL = arm_points(1)
SR, ER, WR, TR, DR = arm_points(-1)

# The blowpipe: the right hand holds it at the mouthpiece, and at rest its
# mouth stands on the ground a little in front of her. `PIPE` points from the
# mouthpiece to the mouth.
GRIP_R = WR + DR * 0.026
PIPE = Vector((-0.04, -0.16, -1)).normalized()
BACK = 0.06
MUZZLE = 0.41
FRONT_GRIP = 0.1
GRIP_L = GRIP_R + PIPE * FRONT_GRIP

# The lips, where the mouthpiece goes in the attack.
MOUTH = HEAD_C + Vector((0, -0.066, -0.042))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    # The knot of hair and its tail.
    ("hair", (0, 0.07, 0.84), (0, 0.1, 0.7), "head"),
    ("cloak", (0, 0.09, 0.7), (0, 0.14, 0.42), "chest"),
    ("cloak.2", (0, 0.14, 0.42), (0, 0.18, 0.16), "cloak"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
    ("pole.R", (-0.3, 0.2, 0.3), (-0.3, 0.2, 0.35), "chest"),
]
for side, sign, (s, e, w, t, _) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("pipe", tuple(GRIP_R), tuple(GRIP_R + PIPE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + PIPE * 0.05), "pipe"),
    ("puff", tuple(GRIP_R + PIPE * MUZZLE), tuple(GRIP_R + PIPE * (MUZZLE + 0.05)), "pipe"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def tunic_skirt_weights(co):
    t = clamp01((0.47 - co.z) / 0.16)
    side = co.x / 0.1
    return {
        "hips": 1 - t * 0.8,
        "thigh.L": t * clamp01(side) * 0.8,
        "thigh.R": t * clamp01(-side) * 0.8,
    }


def hair_weights(co):
    return blend("hair", "head", co.z, 0.8, 0.85)


def cloak_weights(co):
    if co.z > 0.62:
        return blend("cloak", "chest", co.z, 0.64, 0.7)
    return blend("cloak.2", "cloak", co.z, 0.36, 0.46)


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
    kit.sphere(head.bm, HEAD_C, (0.062, 0.066, 0.079), 14, 10)
    # A fine, long nose and a firm chin.
    kit.cone(head.bm, HEAD_C + Vector((0, -0.062, -0.004)), HEAD_C + Vector((0, -0.08, -0.016)), 0.011, 0.002, 5)
    for sign in (1, -1):
        # Elf ears: long points that go up and back.
        kit.cone(head.bm, HEAD_C + Vector((0.055 * sign, 0.006, -0.002)), HEAD_C + Vector((0.125 * sign, 0.042, 0.05)), 0.016, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.057, 0.008)), (0.011, 0.007, 0.008), 8, 6)
        # Calm, level brows of silver.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.06, 0.026)), (0.015, 0, 0.002 * sign), (0, 0.005, 0), (0, 0, 0.004))
        face.paint(faces_of(brow), BROW)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.025, 0.023, 8)
    parts.append(neck)

    # The silver hair: swept back from the face over the ears, to a low knot.
    hair = Part("hair", HAIR, hair_weights, shade=0.14)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.071, 0.077, 0.082), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.03 or (v.co.y < HEAD_C.y - 0.035 and v.co.z < HEAD_C.z + 0.05)]
    kit.bmesh.ops.delete(hair.bm, geom=face_verts, context="VERTS")
    for sign in (1, -1):
        # Streaks of lighter silver, swept back.
        streak = kit.cone(hair.bm, HEAD_C + Vector((0.035 * sign, -0.05, 0.06)), HEAD_C + Vector((0.065 * sign, 0.05, 0.02)), 0.016, 0.01, 5, squash=0.6)
        hair.paint(faces_of(streak), HAIR_LIGHT)
    knot = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.075, -0.035)), (0.038, 0.032, 0.036), 10, 7)
    hair.paint(faces_of(knot), HAIR_DARK)
    tie = kit.torus(hair.bm, HEAD_C + Vector((0, 0.09, -0.06)), (0, 0.5, 1), 0.02, 0.005, 10, 3)
    hair.paint(faces_of(tie), GOLD)
    # The tail of the knot down the back.
    tail = kit.tube(hair.bm, [HEAD_C + Vector((0, 0.09, -0.07)), HEAD_C + Vector((0, 0.11, -0.13)), HEAD_C + Vector((0, 0.115, -0.2))], [0.02, 0.016, 0.004], 6)
    hair.paint(faces_of(tail), HAIR)
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", TUNIC, torso_weights, shade=0.14)
    kit.cone(tunic.bm, (0, 0, 0.48), (0, 0, 0.735), 0.066, 0.082, 12, squash=0.74)
    # A gold trim down the front.
    trim = kit.box(tunic.bm, (0, -0.06, 0.6), (0.014, 0.012, 0.24))
    tunic.paint(faces_of(trim), GOLD)
    parts.append(tunic)

    # The skirt of the tunic over the hips, a gold hem.
    skirt = Part("skirt", TUNIC, tunic_skirt_weights, shade=0.12)
    kit.cone(skirt.bm, (0, 0, 0.49), (0, 0, 0.35), 0.075, 0.097, 12, caps=False, squash=0.8)
    hem = kit.cone(skirt.bm, (0, 0, 0.352), (0, 0, 0.334), 0.098, 0.101, 12, caps=False, squash=0.8)
    skirt.paint(faces_of(hem), GOLD)
    parts.append(skirt)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.47), (0, 0, 0.5), 0.078, 0.076, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.063, 0.485), (0.022, 0.008, 0.022))
    belt.paint(faces_of(buckle), GOLD)
    parts.append(belt)

    # The dart case at the right hip, a little forward, so the camera sees it.
    case = Part("case", LEATHER, "hips", shade=0.1)
    bottom = Vector((-0.112, -0.02, 0.3))
    top = Vector((-0.105, 0.0, 0.47))
    verts = kit.cone(case.bm, bottom, top, 0.022, 0.026, 8)
    case.paint({f for v in verts if v.co.z > 0.45 for f in v.link_faces}, GOLD)
    strap = kit.cone(case.bm, bottom + (top - bottom) * 0.4, bottom + (top - bottom) * 0.48, 0.025, 0.026, 8)
    case.paint(faces_of(strap), LEATHER_DARK)
    # Thorn darts, fletched with cream down, and green sap on the case.
    for index, (dx, dy) in enumerate(((-0.01, -0.006), (0.008, 0.004), (-0.002, 0.012), (0.01, -0.01))):
        foot = top + Vector((dx, dy, -0.01))
        tip = foot + Vector((dx * 0.6, dy * 0.6 + 0.004, 0.07 + 0.012 * (index % 2)))
        kit.cone(case.bm, foot, tip, 0.003, 0.003, 4)
        fletch = kit.cone(case.bm, tip - Vector((0, 0, 0.016)), tip + Vector((0, 0, 0.008)), 0.008, 0.002, 5)
        case.paint(faces_of(fletch), CREAM)
    for along, size in ((0.25, 0.011), (0.6, 0.009)):
        drip = kit.sphere(case.bm, bottom + (top - bottom) * along + Vector((-0.02, -0.01, 0)), (size * 0.8, size * 0.8, size * 1.4), 6, 4)
        case.paint(faces_of(drip), SAP)
    parts.append(case)

    def cloak_color(row, column):
        return LEAF_DARK if column % 3 == 1 else LEAF

    # The layered leaf cloak from the shoulders, open at the front.
    cloak = Part("cloak", LEAF, cloak_weights)
    kit.ragged_cone(cloak, 0.735, 0.17, 0.088, 0.18, 16, 6, 0.75, 0.08, cloak_color, LEAF_LIGHT, gap=math.radians(78), y_push=0.07)
    # The hood, down on the back.
    hood = kit.sphere(cloak.bm, (0, 0.075, 0.735), (0.07, 0.04, 0.045), 10, 6)
    cloak.paint(faces_of(hood), LEAF_DARK)
    # A short shoulder cape of big leaves over the cloak.
    for index in range(11):
        angle = math.radians(-125 + index * 25)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0, 0.745)) + out * 0.07
        leaf(cloak, base, out * 0.9 + Vector((0, 0, -0.75)), 0.1, 0.034, (LEAF_LIGHT, LEAF, LEAF_DARK)[index % 3])
    clasp = kit.sphere(cloak.bm, (0, -0.06, 0.735), (0.016, 0.01, 0.016), 8, 5)
    cloak.paint(faces_of(clasp), GOLD)
    parts.append(cloak)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t, d) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
        sleeve = Part(f"sleeve.{side}", TUNIC, f"upperarm.{side}")
        kit.sphere(sleeve.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.03, 0.03, 0.03), 8, 6)
        kit.cone(sleeve.bm, s, e, 0.027, 0.023, 8)
        parts.append(sleeve)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}")
        verts = kit.cone(bracer.bm, e, w, 0.024, 0.02, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.012 for f in v.link_faces}, GOLD)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.025, (0.017, 0.016, 0.024), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", LEGGINGS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.041, 0.032, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        verts = kit.cone(boot.bm, knee + Vector((0, 0, 0.03)), ankle, 0.04, 0.031, 8)
        boot.paint({f for v in verts if v.co.z > 0.28 for f in v.link_faces}, LEATHER_DARK)
        leaf(boot, knee + Vector((0, -0.032, -0.01)), (0, -0.4, 1), 0.05, 0.026, LEAF)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.025), (0.056, 0.11, 0.05))
        parts.append(foot)
    return parts


def pipe_parts():
    pipe = Part("pipe", REED, "pipe", shade=0.04)
    mouthpiece = GRIP_R - PIPE * BACK
    muzzle = GRIP_R + PIPE * MUZZLE
    kit.cone(pipe.bm, mouthpiece, muzzle, 0.011, 0.012, 8)
    # The joints of the reed, darker.
    for along in (0.07, 0.17, 0.27):
        node = kit.cone(pipe.bm, GRIP_R + PIPE * along, GRIP_R + PIPE * (along + 0.008), 0.014, 0.014, 8)
        pipe.paint(faces_of(node), REED_DARK)
    # The gold bands, the gold mouthpiece and the gold mouth.
    for along in (0.03, 0.22, 0.34):
        band = kit.cone(pipe.bm, GRIP_R + PIPE * along, GRIP_R + PIPE * (along + 0.016), 0.015, 0.015, 8)
        pipe.paint(faces_of(band), GOLD)
    cap = kit.cone(pipe.bm, mouthpiece - PIPE * 0.012, mouthpiece + PIPE * 0.02, 0.009, 0.015, 8)
    pipe.paint(faces_of(cap), GOLD)
    mouth = kit.cone(pipe.bm, muzzle - PIPE * 0.03, muzzle + PIPE * 0.004, 0.015, 0.019, 8)
    pipe.paint(faces_of(mouth), GOLD)
    # A green tassel of sap-dyed cord below the front band.
    tassel = kit.tube(pipe.bm, [GRIP_R + PIPE * 0.23, GRIP_R + PIPE * 0.25 - X * 0.03 - Y * 0.01, GRIP_R + PIPE * 0.3 - X * 0.04 - Y * 0.012], [0.006, 0.005, 0.002], 4)
    pipe.paint(faces_of(tassel), SAP_DARK)

    # The puff of green sap at the mouth when the dart leaves.
    puff = Part("puff", SAP, "puff", shade=0.0)
    side = PIPE.cross(Y).normalized()
    up = side.cross(PIPE).normalized()
    kit.sphere(puff.bm, muzzle + PIPE * 0.04, (0.03, 0.03, 0.03), 8, 6)
    for direction, size in ((side, 0.022), (-side, 0.02), (up, 0.024), (-up, 0.018)):
        cloud = kit.sphere(puff.bm, muzzle + PIPE * 0.05 + direction * 0.028, (size, size, size), 6, 4)
        puff.paint(faces_of(cloud), SAP_DARK if size < 0.021 else SAP)
    streak = kit.cone(puff.bm, muzzle + PIPE * 0.05, muzzle + PIPE * 0.15, 0.014, 0.002, 6)
    puff.paint(faces_of(streak), CREAM)
    return [pipe, puff]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("ElderreedDartmaster", BONES)
    parts = head_parts() + body_parts() + limb_parts() + pipe_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "ElderreedDartmasterMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the pipe, the right hand to aim. The pipe aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "pipe_aim": kit.add_empty("pipe_aim"),
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
    aim = bones["pipe"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["pipe_aim"]
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

    pipe_rest = rig.data.bones["pipe"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the pipe that points it along `direction`."""
        return PIPE.rotation_difference(Vector(direction).normalized()) @ pipe_rest

    def held(base, hand, direction, left=True):
        """The right hand and the pipe by IK and `Aim`; the left hand on the pipe too, if `left`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "forearm__L_slash_IK": 1.0 if left else 0.0,
                "pipe_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "pipe_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, sway=0.0):
        """
        The idle stance: calm and watchful, the weight on the back foot, the
        pipe planted as a staff in the right hand, the left hand on the hip.
        """
        return {
            "hips": t("hips", (Y, 3), (Z, -10)),
            "spine": t("spine", (X, 2 + breath * 0.5), (Y, -2)),
            "chest": t("chest", (X, -2 - breath * 2), (Z, 2)),
            "neck": t("neck", (X, 3)),
            "head": t("head", (X, 3 + breath), (Z, -4 + sway * 8)),
            "hair": t("hair", (X, -breath * 3), (Y, sway * 2)),
            "upperarm.L": t("upperarm.L", (Y, -18), (X, 10)),
            "forearm.L": t("forearm.L", (X, -70), (Z, -40)),
            "upperarm.R": t("upperarm.R", (X, -6 - breath * 2), (Y, -4)),
            "forearm.R": t("forearm.R", (X, -26)),
            # The hand turns back, so the pipe stands near upright.
            "hand.R": t("hand.R", (X, 26 + breath * 2)),
            "cloak": t("cloak", (X, -2 - breath * 2), (Y, sway * 2)),
            "cloak.2": t("cloak.2", (X, -breath * 3)),
            "thigh.L": t("thigh.L", (Y, -4), (X, -10)),
            "shin.L": t("shin.L", (X, 10)),
            "thigh.R": t("thigh.R", (Y, 4), (X, 6)),
            "shin.R": t("shin.R", (X, 6)),
            "foot.R": t("foot.R", (X, -6)),
            "puff@scale": 0.0,
        }

    def slump(breath=0.0):
        """Low HP: bent over and leaning on the pipe with both hands."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.01, -0.03 - breath * 0.004)),
                hips=t("hips", (Z, -6)),
                spine=t("spine", (X, 14 + breath * 3)),
                chest=t("chest", (X, 10 + breath * 2)),
                neck=t("neck", (X, 6)),
                head=t("head", (X, 6 + breath * 4), (Y, -6)),
                hair=t("hair", (X, 14)),
                thigh__L=t("thigh.L", (X, -18), (Y, -4)),
                shin__L=t("shin.L", (X, 30)),
                foot__L=t("foot.L", (X, -12)),
                thigh__R=t("thigh.R", (X, -6), (Y, 4)),
                shin__R=t("shin.R", (X, 24)),
                foot__R=t("foot.R", (X, -18)),
                cloak=t("cloak", (X, 10)),
            ),
            (-0.07, -0.17, 0.5 - breath * 0.006),
            (0.05, -0.28, -1),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -14 * amount), (Z, -8 * amount)),
            hair=t("hair", (X, 16 * amount)),
            upperarm__L=t("upperarm.L", (Y, -26 * amount), (X, 12 * amount)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (X, 4 * amount), (Y, 10 * amount)),
            cloak=t("cloak", (X, 12 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            thigh__L=t("thigh.L", (X, -18)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -12)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 20)),
            hair=t("hair", (X, -20)),
            upperarm__L=t("upperarm.L", (Y, -10)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, 10), (X, 10)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the pipe still in the right hand."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, 0)),
            head=t("head", (X, -12), (Z, -25)),
            hair=t("hair", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, -35), (X, 20)),
            forearm__L=t("forearm.L", (X, -10)),
            upperarm__R=t("upperarm.R", (Y, 50), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            # The pipe lies on the ground beside her.
            hand__R=t("hand.R", (X, 25)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 8)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 30)),
            cloak=t("cloak", (X, 6)),
            cloak__2=t("cloak.2", (X, 0)),
        )

    def crouch(base):
        """Low on one knee, the pipe across the knee: a summon starts."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.02, -0.15)),
                spine=t("spine", (X, 20)),
                chest=t("chest", (X, 6)),
                head=t("head", (X, 10), (Z, -10)),
                thigh__L=t("thigh.L", (X, -80), (Y, -4)),
                shin__L=t("shin.L", (X, 80)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 14), (Y, 4)),
                shin__R=t("shin.R", (X, 110)),
                foot__R=t("foot.R", (X, -50)),
                hair=t("hair", (X, -20)),
                cloak=t("cloak", (X, -14)),
                cloak__2=t("cloak.2", (X, -8)),
            ),
            (-0.1, -0.12, 0.38),
            (0.2, -1, -0.05),
        )

    def step(front):
        """A heel touches the ground; the pipe swings as a walking staff. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.012)),
            hips=t("hips", (Z, -8 - 4 * front)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -4), (X, -14 - 16 * front)),
                "hair": t("hair", (X, -8), (Y, 4 * front)),
                "cloak": t("cloak", (X, -14)),
                "cloak__2": t("cloak.2", (X, -6)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.008)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "hair": t("hair", (X, -4)),
                "cloak": t("cloak", (X, -10)),
            },
        )

    # The attack (Long Range): she lifts the pipe level to her lips, the left
    # hand in front, and blows. The dart leaves at 20% of the attack
    # (`FLIGHT_START` in fx.ts), so the puff is at frame 6 of 30.
    def aiming(base, blow=0.0, puff=0.0):
        hand = MOUTH + Vector((-0.012, -0.075 - blow * 0.006, -0.012))
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.01, -0.03)),
                hips=t("hips", (Z, -16)),
                spine=t("spine", (Z, 4), (X, 8)),
                chest=t("chest", (Z, 6), (X, 2 + blow * 2)),
                neck=t("neck", (X, -2)),
                head=t("head", (X, -4), (Z, 4)),
                hair=t("hair", (X, 6 + blow * 8)),
                thigh__L=t("thigh.L", (X, -30), (Y, -6)),
                shin__L=t("shin.L", (X, 30)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 14), (Y, 6)),
                shin__R=t("shin.R", (X, 20)),
                foot__R=t("foot.R", (X, -30)),
                cloak=t("cloak", (X, 6 + blow * 6)),
                puff_at_scale=puff,
            ),
            hand,
            (0.02, -1, 0.02 + blow * 0.04),
        )

    def proud(base):
        """Up again, the pipe level in both hands, ready: the end of a summon."""
        return aiming(pose(base, head=t("head", (X, -8), (Z, 4))))

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
    attack.key(0, stand()).key(4, aiming(stand())).key(5, aiming(stand(), 0.4))
    attack.key(6, aiming(stand(), 1.0, 1.3)).key(8, aiming(stand(), 0.6, 0.7)).key(11, aiming(stand(), 0.2, 0.0))
    attack.key(18, aiming(stand())).key(25, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, crouch(stand())).key(17, proud(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "elderreed-dartmaster.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
