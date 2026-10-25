"""
Militia Recruit (`human.militiaRecruit`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a thin young farm man with a big
eager smile, messy brown hair under a cooking pot that is his helmet, a
padded tan jacket that is too large for him, with patches, a satchel strap,
a small blue arm band, patched brown trousers, leg wraps, old boots and his
own pitchfork. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/militia-recruit.glb`; then
`bun unit-model:pack militia-recruit` packs it for the game.

At rest he holds the pitchfork upright in the right hand, on the camera side,
and points forward with the left hand, very proud. The right hand drives the
pitchfork with IK and a Copy Rotation. His attack is a jab with the
pitchfork held as a spear: the left hand takes the shaft with IK to a grip
bone. He is Heavy, so his walk is slow. The pot has its own bone: it rattles
when he is hit and tips over his eyes when he falls. He has no Keyword that he
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#e2a882")
HAIR = hex_color("#5e3a22")
HAIR_LIGHT = hex_color("#7d5130")
EYES = hex_color("#2a1d16")
MOUTH = hex_color("#7a2e24")
TEETH = hex_color("#f4efe4")
POT = hex_color("#8d9196")
POT_DARK = hex_color("#55595e")
JACKET = hex_color("#c9b38c")
JACKET_DARK = hex_color("#a08b67")
PATCH = hex_color("#8f7a58")
BLUE = hex_color("#2c4a9a")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#4a2e1c")
TROUSERS = hex_color("#5b4632")
TROUSERS_PATCH = hex_color("#7a6247")
WRAP = hex_color("#d8ccb4")
WRAP_DARK = hex_color("#b5a88e")
BOOT = hex_color("#5a3a22")
SHAFT = hex_color("#8a6238")
IRON = hex_color("#6f6c68")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.72
NECK_Z = 0.745
HEAD_C = Vector((0, -0.004, 0.866))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.05

# The right hand holds the pitchfork upright at his side, and the left arm
# hangs. These are the rest (bind) positions.
SL = Vector((0.104, 0, SHOULDER_Z))
EL = Vector((0.13, 0.0, 0.575))
WL = Vector((0.134, -0.02, 0.445))
TL = WL + (WL - EL).normalized() * 0.04
SR = Vector((-0.104, 0, SHOULDER_Z))
ER = Vector((-0.18, 0.0, 0.61))
WR = Vector((-0.15, -0.1, 0.53))
TR = WR + (WR - ER).normalized() * 0.04
GRIP_R = WR + (WR - ER).normalized() * 0.02
FORK = Vector((0, -0.12, 1)).normalized()
FRONT_GRIP = 0.22
GRIP_L = GRIP_R + FORK * FRONT_GRIP
FORK_BACK = 0.46
FORK_FRONT = 0.46
# The tines spread across the shaft in the plane of the shaft and the side
# of the figure, so the camera sees the fork from its side.
TINES = FORK.cross(Y).normalized()

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.785), "chest"),
    ("head", (0, 0, 0.785), (0, 0, 0.96), "neck"),
    ("pot", (0, 0, 0.9), (0, 0, 0.99), "head"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
    ("pole.R", (-0.3, 0.2, 0.3), (-0.3, 0.2, 0.35), "chest"),
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
    ("fork", tuple(GRIP_R), tuple(GRIP_R + FORK * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + FORK * 0.05), "fork"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The long jacket follows the hips at the top and the thighs lower."""
    if co.z > 0.5:
        return torso_weights(co)
    t = clamp01((0.5 - co.z) / 0.14)
    side = co.x / 0.1
    return {
        "hips": 1 - t * 0.8,
        "thigh.L": t * clamp01(side + 0.3) * 0.8,
        "thigh.R": t * clamp01(-side + 0.3) * 0.8,
    }


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.062, 0.066, 0.078), 14, 10)
    kit.cone(head.bm, (0, -0.062, 0.864), (0, -0.078, 0.854), 0.012, 0.003, 5)
    # Big ears that stick out under the pot.
    for sign in (1, -1):
        kit.sphere(head.bm, (0.064 * sign, 0.004, 0.866), (0.016, 0.012, 0.022), 6, 4)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    # Big, happy eyes and raised brows.
    for sign in (1, -1):
        kit.sphere(face.bm, (0.024 * sign, -0.056, 0.874), (0.01, 0.008, 0.012), 8, 6)
        brow = kit.slab(face.bm, (0.026 * sign, -0.06, 0.898), (0.015, 0, -0.004 * sign), (0, 0.004, 0), (0, 0, 0.004))
        face.paint(faces_of(brow), HAIR)
    # A big grin: a dark mouth with a row of teeth, the ends up.
    mouth = kit.tube(
        face.bm,
        [(0.03, -0.05, 0.836), (0.014, -0.06, 0.828), (-0.014, -0.06, 0.828), (-0.03, -0.05, 0.836)],
        [0.004, 0.008, 0.008, 0.004],
        5,
    )
    face.paint(faces_of(mouth), MOUTH)
    teeth = kit.slab(face.bm, (0, -0.066, 0.832), (0.016, 0, 0), (0, 0.003, 0), (0, 0, 0.003))
    face.paint(faces_of(teeth), TEETH)
    for sign in (1, -1):
        cheek = kit.sphere(face.bm, (0.036 * sign, -0.05, 0.846), (0.012, 0.006, 0.009), 6, 4)
        face.paint(faces_of(cheek), hex_color("#e89a80"))
    parts.append(face)

    # Messy hair that pokes out under the pot, at the front and the sides.
    hair = Part("hair", HAIR, "head")
    tufts = ((0.0, -0.054, 0.902), (0.032, -0.05, 0.897), (-0.032, -0.05, 0.897), (0.058, -0.012, 0.888), (-0.058, -0.012, 0.888), (0.04, 0.045, 0.875), (-0.04, 0.045, 0.875), (0.0, 0.06, 0.87))
    for index, (x, y, z) in enumerate(tufts):
        tip = Vector((x * 1.25, y * 1.2, z - 0.035))
        verts = kit.cone(hair.bm, (x, y, z + 0.01), tip, 0.022, 0.004, 5)
        if index % 2:
            hair.paint(faces_of(verts), HAIR_LIGHT)
    kit.sphere(hair.bm, (0, 0.012, 0.892), (0.064, 0.066, 0.05), 10, 6)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.73), (0, 0, 0.81), 0.022, 0.021, 8)
    parts.append(neck)
    return parts


def pot_parts():
    """The cooking pot: a steel pot upside down, a rim and a handle on his right."""
    pot = Part("pot", POT, "pot", shade=0.16)
    c = HEAD_C + Vector((0, 0.006, 0.038))
    kit.cone(pot.bm, c, c + Vector((0, 0, 0.07)), 0.077, 0.07, 14)
    rim = kit.torus(pot.bm, c + Vector((0, 0, 0.002)), (0, 0, 1), 0.08, 0.008, 14, 4)
    pot.paint(faces_of(rim), POT_DARK)
    band = kit.torus(pot.bm, c + Vector((0, 0, 0.05)), (0, 0, 1), 0.073, 0.004, 14, 3)
    pot.paint(faces_of(band), POT_DARK)
    # The bottom of the pot, now the top of the helmet, with a dent.
    dent = kit.sphere(pot.bm, c + Vector((0.02, -0.02, 0.07)), (0.03, 0.03, 0.008), 8, 4)
    pot.paint(faces_of(dent), POT_DARK)
    handle = kit.tube(
        pot.bm,
        [c + Vector((-0.07, -0.02, 0.04)), c + Vector((-0.11, -0.015, 0.05)), c + Vector((-0.11, 0.025, 0.05)), c + Vector((-0.07, 0.03, 0.04))],
        [0.006, 0.006, 0.006, 0.006],
        4,
    )
    pot.paint(faces_of(handle), POT_DARK)
    return [pot]


def body_parts():
    parts = []
    # The padded jacket: too large, quilted, with patches. It hangs to the
    # thighs.
    jacket = Part("jacket", JACKET, skirt_weights, shade=0.12)
    verts = kit.cone(jacket.bm, (0, 0, 0.36), (0, 0, 0.73), 0.098, 0.084, 14, squash=0.82)
    for f in faces_of(verts):
        c = f.calc_center_median()
        if int(c.z * 50) % 2:
            jacket.paint([f], JACKET_DARK)
    for center in ((0.05, -0.08, 0.6), (-0.06, 0.07, 0.48), (0.07, 0.04, 0.42)):
        patch = kit.box(jacket.bm, center, (0.04, 0.012 if abs(center[1]) > 0.05 else 0.04, 0.04))
        jacket.paint(faces_of(patch), PATCH)
    hem = kit.torus(jacket.bm, (0, 0, 0.365), (0, 0, 1), 0.098, 0.008, 14, 4)
    jacket.paint(faces_of(hem), JACKET_DARK)
    parts.append(jacket)

    # A loose collar, open at the throat.
    collar = Part("collar", JACKET_DARK, "chest", shade=0.08)
    kit.torus(collar.bm, (0, 0.006, 0.735), (0, 0.2, 1), 0.05, 0.014, 12, 5)
    parts.append(collar)

    # The satchel strap, from the right shoulder to the left hip.
    strap = Part("strap", LEATHER, torso_weights, shade=0.05)
    kit.tube(strap.bm, [(-0.075, -0.05, 0.725), (-0.02, -0.088, 0.64), (0.04, -0.09, 0.55), (0.088, -0.05, 0.47)], [0.009] * 4, 4)
    kit.tube(strap.bm, [(-0.08, 0.03, 0.725), (-0.03, 0.085, 0.64), (0.04, 0.088, 0.55), (0.088, 0.04, 0.47)], [0.009] * 4, 4)
    parts.append(strap)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.495), (0, 0, 0.52), 0.088, 0.087, 14, squash=0.84)
    buckle = kit.box(belt.bm, (0, -0.076, 0.507), (0.022, 0.008, 0.02))
    belt.paint(faces_of(buckle), IRON)
    parts.append(belt)

    satchel = Part("satchel", LEATHER, "hips", shade=0.08)
    kit.box(satchel.bm, (0.098, -0.01, 0.45), (0.03, 0.07, 0.06))
    flap = kit.box(satchel.bm, (0.1, -0.01, 0.47), (0.034, 0.074, 0.022))
    satchel.paint(faces_of(flap), LEATHER_DARK)
    parts.append(satchel)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.4), (0, 0, 0.49), 0.064, 0.062, 12, squash=0.8)
    parts.append(hips)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        # Baggy sleeves, too long, rolled at the cuff.
        sleeve = Part(f"sleeve.{side}", JACKET, f"upperarm.{side}", shade=0.08)
        verts = kit.cone(sleeve.bm, s + Vector((0, 0, 0.01)), e, 0.034, 0.03, 8)
        for f in faces_of(verts):
            if int(f.calc_center_median().z * 50) % 2:
                sleeve.paint([f], JACKET_DARK)
        if side == "R":
            # The small blue arm band.
            mid = s.lerp(e, 0.5)
            band = kit.torus(sleeve.bm, mid, (e - s).normalized(), 0.033, 0.008, 10, 4)
            sleeve.paint(faces_of(band), BLUE)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", JACKET, f"forearm.{side}", shade=0.08)
        kit.cone(forearm.bm, e, w - d * 0.02, 0.028, 0.026, 8)
        cuff = kit.torus(forearm.bm, w - d * 0.026, d, 0.028, 0.008, 10, 4)
        forearm.paint(faces_of(cuff), JACKET_DARK)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.018, (0.017, 0.016, 0.022), 8, 6)
        if side == "L":
            # The pointing finger.
            kit.cone(hand.bm, w + d * 0.03, w + d * 0.064, 0.006, 0.004, 5)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.037, 0.029, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", TROUSERS, f"shin.{side}")
        kit.cone(shin.bm, knee + Vector((0, 0, 0.02)), ankle + Vector((0, 0, 0.08)), 0.03, 0.027, 8)
        # A patch on the knee.
        patch = kit.box(shin.bm, knee + Vector((0, -0.026, 0)), (0.034, 0.012, 0.036))
        shin.paint(faces_of(patch), TROUSERS_PATCH)
        # Cloth wraps round the shins.
        wrap = kit.cone(shin.bm, (LEG_X * sign, 0, 0.07), (LEG_X * sign, 0, 0.2), 0.033, 0.031, 8)
        for f in faces_of(wrap):
            c = f.calc_center_median()
            shin.paint([f], WRAP if int((c.z - c.x * 0.4) * 55) % 2 else WRAP_DARK)
        parts.append(shin)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.cone(foot.bm, ankle + Vector((0, 0, 0.04)), ankle - Vector((0, 0, 0.02)), 0.03, 0.032, 8)
        kit.box(foot.bm, (LEG_X * sign, -0.026, 0.022), (0.05, 0.104, 0.044))
        sole = kit.box(foot.bm, (LEG_X * sign, -0.026, 0.004), (0.052, 0.108, 0.008))
        foot.paint(faces_of(sole), LEATHER_DARK)
        parts.append(foot)
    return parts


def fork_parts():
    fork = Part("fork", SHAFT, "fork", shade=0.04)
    butt = GRIP_R - FORK * FORK_BACK
    top = GRIP_R + FORK * FORK_FRONT
    # A plain, slightly bent farm shaft.
    kit.tube(fork.bm, [butt, GRIP_R + FORK * 0.0 + TINES * 0.004, top], [0.01, 0.01, 0.009], 6)
    # The iron head: a cross bar, a socket and three long tines.
    head = set()
    head |= set(kit.cone(fork.bm, top - FORK * 0.03, top + FORK * 0.02, 0.012, 0.011, 6))
    head |= set(kit.tube(fork.bm, [top + FORK * 0.02 + TINES * 0.05, top + FORK * 0.02, top + FORK * 0.02 - TINES * 0.05], [0.006, 0.008, 0.006], 4))
    for offset in (-0.05, 0.0, 0.05):
        base = top + FORK * 0.02 + TINES * offset
        head |= set(kit.cone(fork.bm, base, base + FORK * 0.13 + TINES * offset * 0.15, 0.0075, 0.002, 4))
    fork.paint(faces_of(head), IRON)
    return [fork]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("MilitiaRecruit", BONES)
    parts = head_parts() + pot_parts() + body_parts() + limb_parts() + fork_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "MilitiaRecruitMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the right hand drives the fork, and the left hand takes it for the jab. The fork aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "fork_aim": kit.add_empty("fork_aim"),
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
    aim = bones["fork"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["fork_aim"]
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

    fork_rest = rig.data.bones["fork"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the fork that points it along `direction`."""
        return FORK.rotation_difference(Vector(direction).normalized()) @ fork_rest

    def held(base, hand, direction, two_hands=0.0):
        """The right hand and the fork by IK and `Aim`. `two_hands` puts the left hand on the shaft."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "forearm__L_slash_IK": two_hands,
                "fork_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "fork_aim_at_rot": aimed(direction),
            },
        )

    def point(amount=1.0, wag=0.0):
        """The left arm points forward and up."""
        return {
            "upperarm.L": t("upperarm.L", (X, -80 * amount - wag * 4), (Z, 10 * amount)),
            "forearm.L": t("forearm.L", (X, -14 * amount)),
            "hand.L": t("hand.L", (X, -6 * amount + wag * 10)),
        }

    def stand(breath=0.0, sway=0.0):
        """
        Proud: tall, the chest out and the chin up, the fork upright at his
        side and the left hand pointing at the foe. He bounces a little on
        his toes.
        """
        return held(
            {
                "hips@loc": at("hips", (0, 0, -0.006 + breath * 0.006)),
                "hips": t("hips", (Z, -8)),
                "spine": t("spine", (X, -4 - breath)),
                "chest": t("chest", (X, -6 - breath * 2), (Z, 4)),
                "neck": t("neck", (Z, 4)),
                "head": t("head", (Z, 6 + sway * 6), (X, -8 - breath * 2), (Y, sway * 4)),
                "pot": t("pot", (Y, sway * 3)),
                "thigh.L": t("thigh.L", (X, -8), (Y, -4)),
                "shin.L": t("shin.L", (X, 6)),
                "foot.L": t("foot.L", (X, 2)),
                "thigh.R": t("thigh.R", (X, 6), (Y, 6)),
                "shin.R": t("shin.R", (X, 4)),
                "foot.R": t("foot.R", (X, -10)),
                **point(1.0, sway),
            },
            (-0.15, -0.1, 0.53 + breath * 0.006),
            (-0.02, -0.12, 1),
        )

    def winded(breath=0.0):
        """Low HP: bent over, both hands on the fork, the pot down over one eye."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.03, -0.05)),
                hips=t("hips", (Z, -12)),
                spine=t("spine", (X, 22 + breath * 4)),
                chest=t("chest", (X, 10 + breath * 3)),
                neck=t("neck", (X, -10)),
                head=t("head", (X, -6 - breath * 4), (Y, -8)),
                pot=t("pot", (Y, -16), (X, 14)),
                thigh__L=t("thigh.L", (X, -20), (Y, -6)),
                shin__L=t("shin.L", (X, 30)),
                foot__L=t("foot.L", (X, -8)),
                thigh__R=t("thigh.R", (X, -6), (Y, 6)),
                shin__R=t("shin.R", (X, 26)),
                foot__R=t("foot.R", (X, -18)),
                upperarm__L=t("upperarm.L", (X, 0)),
                forearm__L=t("forearm.L", (X, 0)),
                hand__L=t("hand.L", (X, 0)),
            ),
            (-0.1, -0.18, 0.46 - breath * 0.01),
            (0.08, -0.12, 1),
            1.0,
        )

    def recoil(base, amount=1.0):
        """The hit knocks his head back, and the pot rings and tips."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -12 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 10), (X, -20 * amount)),
            pot=t("pot", (Y, 18 * amount), (X, -10 * amount)),
            upperarm__L=t("upperarm.L", (X, -30 * amount), (Y, -40 * amount)),
            forearm__L=t("forearm.L", (X, -40 * amount)),
            ik_hand__R_at_pos=Vector((-0.15, 0.03 * amount - 0.1, 0.55)),
            fork_aim_at_rot=aimed((-0.02, 0.3 * amount - 0.12, 1)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            pot=t("pot", (X, 20)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, -30)),
            forearm__L=t("forearm.L", (X, -20)),
            ik_hand__R_at_pos=Vector((-0.14, -0.06, 0.44)),
            fork_aim_at_rot=aimed((-0.2, -1, 0.6)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the pot over his eyes and the fork beside him."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.12)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0), (Z, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -6), (Z, -20)),
            pot=t("pot", (X, 34)),
            upperarm__L=t("upperarm.L", (Y, -60), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            hand__L=t("hand.L", (X, 0)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, -10)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (Z, -30)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            forearm__L_slash_IK=0.0,
            forearm__R_slash_IK=0.0,
            fork_slash_Aim=1.0,
            fork_aim_at_rot=aimed((0.3, -1, -0.02)),
        )

    def crouch(base):
        """Low on one knee, the fork upright, as a summon starts and a Rebirth gets up."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.17)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, 24)),
                chest=t("chest", (X, 6)),
                neck=t("neck", (X, -10)),
                head=t("head", (X, -10)),
                pot=t("pot", (X, 8)),
                thigh__L=t("thigh.L", (X, -72), (Y, -4)),
                shin__L=t("shin.L", (X, 92)),
                foot__L=t("foot.L", (X, -20)),
                thigh__R=t("thigh.R", (X, -4), (Y, 4)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -44)),
                upperarm__L=t("upperarm.L", (X, -20)),
                forearm__L=t("forearm.L", (X, -40)),
                hand__L=t("hand.L", (X, 0)),
            ),
            (-0.13, -0.1, 0.34),
            (0.02, -0.15, 1),
        )

    def proud(base):
        """Up again, the left fist high: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, 0.01)),
                spine=t("spine", (X, -6)),
                chest=t("chest", (X, -10)),
                head=t("head", (Z, 8), (X, -14)),
                pot=t("pot", (Y, -6)),
                upperarm__L=t("upperarm.L", (X, -160), (Y, -10)),
                forearm__L=t("forearm.L", (X, -20)),
                hand__L=t("hand.L", (X, 0)),
                foot__L=t("foot.L", (X, 10)),
                foot__R=t("foot.R", (X, 0)),
            ),
            (-0.15, -0.1, 0.6),
            (-0.02, -0.12, 1),
        )

    def step(front):
        """A slow, proud march (Heavy). `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.024)),
            hips=t("hips", (Z, -8), (Y, 4 * front)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (Z, -6 * front), (X, -6)),
            head=t("head", (Z, 4), (X, -8), (Y, -3 * front)),
            pot=t("pot", (Y, 6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 12)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -10)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 20)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "upperarm__L": t("upperarm.L", (X, -14 * front), (Y, -6)),
                "forearm__L": t("forearm.L", (X, -20)),
                "hand__L": t("hand.L", (X, 0)),
                "ik_hand__R_at_pos": Vector((-0.15, -0.1, 0.51)),
            },
        )

    def passing(lifted):
        """One knee comes up high, as a proud march. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -50)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 60)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -4)),
                "upperarm__L": t("upperarm.L", (X, 0), (Y, -6)),
                "forearm__L": t("forearm.L", (X, -20)),
                "hand__L": t("hand.L", (X, 0)),
                "ik_hand__R_at_pos": Vector((-0.15, -0.1, 0.55)),
            },
        )

    # The attack: he takes the fork in both hands, draws it back, and jabs it
    # forward as a spear. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the jab lands at frame 15 of 30.
    def draw_back(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.04, -0.03)),
                hips=t("hips", (Z, -24)),
                spine=t("spine", (Z, -8), (X, 2)),
                chest=t("chest", (Z, -8)),
                neck=t("neck", (Z, 12)),
                head=t("head", (Z, 18), (X, -4)),
                pot=t("pot", (Y, 8)),
                thigh__L=t("thigh.L", (X, -20), (Y, -6)),
                shin__L=t("shin.L", (X, 22)),
                foot__L=t("foot.L", (X, -4)),
                thigh__R=t("thigh.R", (X, 20), (Y, 8)),
                shin__R=t("shin.R", (X, 30)),
                foot__R=t("foot.R", (X, -34)),
            ),
            (-0.1, 0.13, 0.6),
            (0.06, -1, 0.12),
            1.0,
        )

    def jab(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.1, -0.07)),
                hips=t("hips", (Z, -6)),
                spine=t("spine", (Z, 4), (X, 20)),
                chest=t("chest", (Z, 6), (X, 6)),
                neck=t("neck", (Z, 0)),
                head=t("head", (Z, 4), (X, -20)),
                pot=t("pot", (X, -14)),
                thigh__L=t("thigh.L", (X, -64), (Y, -6)),
                shin__L=t("shin.L", (X, 64)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 30), (Y, 6)),
                shin__R=t("shin.R", (X, 12)),
                foot__R=t("foot.R", (X, -14)),
            ),
            (-0.06, -0.16, 0.57),
            (0.05, -1, 0.02),
            1.0,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    # A slow march (Heavy).
    walk = Clip("walk", 28, loop=True)
    walk.key(0, step(1)).key(7, passing("R")).key(14, step(-1)).key(21, passing("L")).key(28, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, draw_back(stand())).key(15, jab(stand())).key(21, jab(stand()))
    attack.key(28, stand()).key(30, stand())
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
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.19))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "militia-recruit.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
