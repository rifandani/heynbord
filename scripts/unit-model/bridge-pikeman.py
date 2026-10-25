"""
Bridge Pikeman (`human.bridgePikeman`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a focused woman soldier with brown
hair in a bun, a mail coat and a mail skirt, a blue tabard with gold trim and
a gold lily, a blue sash, brass shoulder guards, leather bracers, brown
trousers, tall boots with steel knee guards and a long pike. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/bridge-pikeman.glb`; then
`bun unit-model:pack bridge-pikeman` packs it for the game.

She holds the pike low and level with both hands: the right hand at the
right hip, on the camera side, and the left hand in front. The left hand
stays on the pike with IK to a grip bone of the pike. Her attack is a
forward thrust that pushes the foe back (Knockback): the right hand drives
the pike with IK and a Copy Rotation. She has no Keyword that she uses by
her own action, so she has no cast clip.
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

SKIN = hex_color("#e3ad88")
HAIR = hex_color("#6b4026")
HAIR_LIGHT = hex_color("#8c5634")
EYES = hex_color("#2a1d16")
BROW = hex_color("#4a2c1a")
MAIL = hex_color("#9aa0a6")
MAIL_DARK = hex_color("#6c7178")
BLUE = hex_color("#2c4a9a")
BLUE_DARK = hex_color("#1d336e")
GOLD = hex_color("#dcaa42")
GOLD_DARK = hex_color("#9e7428")
BRASS = hex_color("#c99a45")
BRASS_DARK = hex_color("#8d6a2c")
CREAM = hex_color("#efe6d2")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#4a2e1c")
TROUSERS = hex_color("#4b382c")
BOOT = hex_color("#5a3a22")
STEEL = hex_color("#c9ccd0")
STEEL_DARK = hex_color("#8d9298")
SHAFT = hex_color("#7a5432")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.872))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.055

# The right hand holds the back of the pike at the right hip, and the pike
# points forward, a little across the body. The left hand holds it in front.
# These are the rest (bind) positions.
SL = Vector((0.112, 0, SHOULDER_Z))
SR = Vector((-0.112, 0, SHOULDER_Z))
ER = Vector((-0.19, 0.1, 0.62))
WR = Vector((-0.085, 0.05, 0.545))
TR = WR + (WR - ER).normalized() * 0.04
GRIP_R = WR + (WR - ER).normalized() * 0.022
PIKE = Vector((0.15, -1, 0.08)).normalized()
FRONT_GRIP = 0.2
GRIP_L = GRIP_R + PIKE * FRONT_GRIP
WL = GRIP_L
EL = Vector((0.1, -0.1, 0.6))
TL = WL + (WL - EL).normalized() * 0.04
PIKE_BACK = 0.22
PIKE_FRONT = 0.56

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    # The tabard hangs below the belt, at the front and at the back.
    ("tabard.F", (0, -0.08, 0.5), (0, -0.1, 0.27), "hips"),
    ("tabard.B", (0, 0.08, 0.5), (0, 0.1, 0.27), "hips"),
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
    ("pike", tuple(GRIP_R), tuple(GRIP_R + PIKE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + PIKE * 0.05), "pike"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The mail skirt follows the hips at the top and the thighs lower."""
    t = clamp01((0.5 - co.z) / 0.2)
    side = co.x / 0.1
    return {
        "hips": 1 - t * 0.85,
        "thigh.L": t * clamp01(side + 0.3) * 0.85,
        "thigh.R": t * clamp01(-side + 0.3) * 0.85,
    }


def tabard_weights(bone, top=0.5):
    def weights(co):
        if co.z > top:
            return torso_weights(co)
        return blend(bone, "hips", co.z, top - 0.12, top)

    return weights


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.063, 0.067, 0.08), 14, 10)
    kit.cone(head.bm, (0, -0.063, 0.868), (0, -0.078, 0.86), 0.011, 0.002, 5)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.061 * sign, 0.004, 0.868), (0.012, 0.016, 0.02), 6, 4)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.025 * sign, -0.057, 0.878), (0.01, 0.008, 0.011), 8, 6)
    # Focused: the brows are low and straight.
    for sign in (1, -1):
        brow = kit.slab(eyes.bm, (0.026 * sign, -0.061, 0.896), (0.016, 0, -0.003 * sign), (0, 0.004, 0), (0, 0, 0.004))
        eyes.paint(faces_of(brow), BROW)
    parts.append(eyes)

    # Brown hair pulled back to a bun at the back of the head, with a loose lock.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.008, 0.884), (0.07, 0.076, 0.085), 14, 10)
    face = [v for v in verts if v.co.z < 0.84 or (v.co.y < -0.03 and v.co.z < 0.905)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    bun = kit.sphere(hair.bm, (0, 0.07, 0.925), (0.04, 0.036, 0.038), 10, 7)
    for f in faces_of(bun):
        if int(f.calc_center_median().z * 120) % 2:
            hair.paint([f], HAIR_LIGHT)
    tie = kit.torus(hair.bm, (0, 0.045, 0.92), (0, 1, 0.3), 0.026, 0.006, 10, 4)
    hair.paint(faces_of(tie), BLUE)
    for sign in (1, -1):
        lock = kit.cone(hair.bm, (0.052 * sign, -0.036, 0.91), (0.064 * sign, -0.03, 0.81), 0.016, 0.005, 6, squash=0.7)
        hair.paint(faces_of(lock), HAIR_LIGHT)
    kit.cone(hair.bm, (0, 0.05, 0.87), (0, 0.055, 0.8), 0.048, 0.03, 8, squash=0.6)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.025, 0.023, 8)
    parts.append(neck)
    return parts


def lily(part, center, normal, size, color):
    """A small gold lily: three petals and a band."""
    normal = Vector(normal).normalized()
    side = normal.cross(Z).normalized()
    out = normal * 0.004
    c = Vector(center)
    parts = [
        kit.cone(part.bm, c + out, c + out + Z * size, size * 0.3, 0.001, 4, squash=0.5),
        kit.cone(part.bm, c + out, c + out + (side * 0.7 + Z * 0.6) * size * 0.8, size * 0.24, 0.001, 4, squash=0.5),
        kit.cone(part.bm, c + out, c + out + (-side * 0.7 + Z * 0.6) * size * 0.8, size * 0.24, 0.001, 4, squash=0.5),
        kit.cone(part.bm, c + out - Z * size * 0.1, c + out - Z * size * 0.55, size * 0.16, size * 0.05, 4, squash=0.5),
        kit.slab(part.bm, c + out * 1.4 - Z * size * 0.08, side * size * 0.38, normal * 0.003, Z * size * 0.07),
    ]
    for verts in parts:
        part.paint(faces_of(verts), color)


def body_parts():
    parts = []
    # The mail coat: grey rings in rows.
    mail = Part("mail", MAIL, torso_weights, shade=0.12)
    verts = kit.cone(mail.bm, (0, 0, 0.5), (0, 0, 0.735), 0.066, 0.086, 12, squash=0.76)
    for f in faces_of(verts):
        if int(f.calc_center_median().z * 70) % 2:
            mail.paint([f], MAIL_DARK)
    parts.append(mail)

    # A cream padded collar.
    collar = Part("collar", CREAM, "chest", shade=0.06)
    kit.cone(collar.bm, (0, 0.006, 0.725), (0, 0.01, 0.775), 0.06, 0.05, 12, squash=0.85)
    parts.append(collar)

    # The tabard: a blue panel at the front and the back, gold edges, a gold lily.
    def tabard_grid(sign, offset):
        rows = []
        for z in (0.73, 0.64, 0.55, 0.47, 0.38, 0.27):
            half = 0.05 if z > 0.6 else lerp(0.06, 0.075, clamp01((0.55 - z) / 0.28))
            depth = 0.075 if z > 0.5 else lerp(0.075, 0.108, clamp01((0.5 - z) / 0.23))
            if z > 0.68:
                depth = 0.068
            row = []
            for u in (-1, -0.82, -0.4, 0, 0.4, 0.82, 1):
                x = u * half
                y = sign * (depth + offset - abs(u) * 0.016)
                row.append((x, y, z))
            rows.append(row)
        return rows

    for sign, bone, name in ((-1, "tabard.F", "tabardF"), (1, "tabard.B", "tabardB")):
        tabard = Part(name, BLUE, tabard_weights(bone), shade=0.12)

        def color_of(face_side, row, column):
            if row == 4 or column in (0, 5):
                return GOLD
            return BLUE

        edges = panel(tabard, tabard_grid(sign, 0.004), tabard_grid(sign, -0.002), color_of)
        tabard.paint(edges, GOLD_DARK)
        if sign < 0:
            lily(tabard, (0, -0.082, 0.6), (0, -1, 0), 0.05, GOLD)
            lily(tabard, (0, -0.106, 0.34), (0, -1, -0.15), 0.036, GOLD)
        parts.append(tabard)

    # The blue sash, from the left shoulder to the right hip, its end at the hip.
    sash = Part("sash", BLUE_DARK, torso_weights, shade=0.06)
    kit.tube(sash.bm, [(0.075, -0.05, 0.72), (0.02, -0.085, 0.64), (-0.04, -0.084, 0.56), (-0.076, -0.04, 0.5)], [0.012] * 4, 4)
    kit.tube(sash.bm, [(0.08, 0.03, 0.72), (0.04, 0.083, 0.64), (-0.03, 0.082, 0.56), (-0.076, 0.03, 0.5)], [0.011] * 4, 4)
    knot = kit.sphere(sash.bm, (-0.08, -0.02, 0.495), (0.02, 0.02, 0.018), 6, 4)
    sash.paint(faces_of(knot), BLUE)
    parts.append(sash)

    sash_end = Part("sashEnd", BLUE_DARK, tabard_weights("thigh.R", 0.48), shade=0.06)
    end = kit.slab(sash_end.bm, (-0.09, -0.024, 0.43), (0.003, 0, 0), (0, 0.016, 0), (0, 0, 0.06))
    sash_end.paint(faces_of(end), BLUE_DARK)
    fringe = kit.slab(sash_end.bm, (-0.09, -0.024, 0.365), (0.0035, 0, 0), (0, 0.017, 0), (0, 0, 0.006))
    sash_end.paint(faces_of(fringe), GOLD)
    parts.append(sash_end)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.515), 0.072, 0.071, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.064, 0.502), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), BRASS)
    for x, y in ((0.07, -0.02), (0.05, 0.05)):
        pouch = kit.box(belt.bm, (x, y, 0.47), (0.026, 0.03, 0.04))
        belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.42), (0, 0, 0.5), 0.068, 0.066, 12, squash=0.8)
    parts.append(hips)

    # The mail skirt below the belt, to mid thigh.
    skirt = Part("skirt", MAIL, skirt_weights, shade=0.1)

    def skirt_color(row, column):
        return MAIL_DARK if row % 2 else MAIL

    kit.ragged_cone(skirt, 0.5, 0.33, 0.072, 0.105, 16, 4, 0.8, 0.0, skirt_color, MAIL_DARK)
    parts.append(skirt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        # Layered brass shoulder guards.
        guard = Part(f"guard.{side}", BRASS, f"upperarm.{side}", shade=0.1)
        top = kit.sphere(guard.bm, s + Vector((0.006 * sign, 0, 0.012)), (0.042, 0.04, 0.032), 10, 7)
        guard.paint({f for v in top if v.co.z < s.z - 0.004 for f in v.link_faces}, BRASS_DARK)
        kit.sphere(guard.bm, s + Vector((0.016 * sign, 0, -0.018)), (0.036, 0.036, 0.022), 10, 6)
        rivet = kit.sphere(guard.bm, s + Vector((0.03 * sign, -0.02, 0.026)), (0.007, 0.007, 0.007), 5, 4)
        guard.paint(faces_of(rivet), GOLD)
        parts.append(guard)

        sleeve = Part(f"sleeve.{side}", MAIL, f"upperarm.{side}", shade=0.08)
        verts = kit.cone(sleeve.bm, s, e, 0.027, 0.023, 8)
        for f in faces_of(verts):
            if int(f.calc_center_median().z * 70) % 2:
                sleeve.paint([f], MAIL_DARK)
        parts.append(sleeve)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.06)
        kit.cone(bracer.bm, e - d * 0.005, w - d * 0.012, 0.024, 0.022, 8)
        cuff = kit.cone(bracer.bm, w - d * 0.07, w - d * 0.01, 0.028, 0.026, 8)
        bracer.paint(faces_of(cuff), LEATHER_DARK)
        for along in (0.06, 0.035):
            strap = kit.torus(bracer.bm, w - d * along, d, 0.028, 0.0035, 10, 3)
            bracer.paint(faces_of(strap), BRASS)
        parts.append(bracer)

        glove = Part(f"glove.{side}", LEATHER_DARK, f"hand.{side}")
        kit.sphere(glove.bm, w + d * 0.022, (0.019, 0.018, 0.024), 8, 6)
        parts.append(glove)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.04, 0.031, 8)
        parts.append(thigh)

        # Tall boots with a steel knee guard.
        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        kit.cone(boot.bm, knee - Vector((0, 0, 0.02)), ankle, 0.034, 0.03, 8)
        top = kit.cone(boot.bm, knee + Vector((0, 0, 0.0)), knee - Vector((0, 0, 0.05)), 0.04, 0.036, 8)
        boot.paint(faces_of(top), LEATHER)
        parts.append(boot)

        cop = Part(f"cop.{side}", STEEL_DARK, f"shin.{side}", shade=0.1)
        verts = kit.sphere(cop.bm, knee + Vector((0, -0.03, 0.004)), (0.03, 0.022, 0.034), 8, 6)
        cop.paint({f for v in verts if v.co.z > knee.z + 0.01 for f in v.link_faces}, STEEL)
        parts.append(cop)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.028, 0.024), (0.052, 0.108, 0.048))
        heel = kit.box(foot.bm, (LEG_X * sign, 0.012, 0.012), (0.05, 0.03, 0.024))
        foot.paint(faces_of(heel), LEATHER_DARK)
        parts.append(foot)
    return parts


def pike_parts():
    pike = Part("pike", SHAFT, "pike", shade=0.04)
    butt = GRIP_R - PIKE * PIKE_BACK
    tip = GRIP_R + PIKE * PIKE_FRONT
    kit.cone(pike.bm, butt, tip, 0.009, 0.0085, 6)
    cap = kit.cone(pike.bm, butt - PIKE * 0.01, butt + PIKE * 0.03, 0.012, 0.011, 6)
    pike.paint(faces_of(cap), BRASS)
    # Leather wraps where the hands hold it.
    for along in (-0.03, FRONT_GRIP - 0.03):
        wrap = kit.cone(pike.bm, GRIP_R + PIKE * along, GRIP_R + PIKE * (along + 0.06), 0.0105, 0.0105, 6)
        pike.paint(faces_of(wrap), LEATHER_DARK)
    # A long steel head with langets, a brass collar and two side lugs.
    collar = kit.cone(pike.bm, tip - PIKE * 0.05, tip + PIKE * 0.012, 0.012, 0.013, 6)
    pike.paint(faces_of(collar), BRASS)
    side = PIKE.cross(Z).normalized()
    for sign in (1, -1):
        lug = kit.cone(pike.bm, tip + PIKE * 0.006, tip + PIKE * 0.0 + side * 0.03 * sign, 0.007, 0.002, 4)
        pike.paint(faces_of(lug), STEEL_DARK)
    socket = kit.cone(pike.bm, tip + PIKE * 0.01, tip + PIKE * 0.035, 0.011, 0.009, 6)
    pike.paint(faces_of(socket), STEEL_DARK)
    blade = kit.cone(pike.bm, tip + PIKE * 0.035, tip + PIKE * 0.16, 0.026, 0.001, 4, squash=0.3)
    pike.paint(faces_of(blade), STEEL)
    return [pike]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BridgePikeman", BONES)
    parts = head_parts() + body_parts() + limb_parts() + pike_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BridgePikemanMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the pike, the right hand to drive it. The pike aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "pike_aim": kit.add_empty("pike_aim"),
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
    aim = bones["pike"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["pike_aim"]
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

    pike_rest = rig.data.bones["pike"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the pike that points it along `direction`."""
        return PIKE.rotation_difference(Vector(direction).normalized()) @ pike_rest

    def held(base, hand, direction):
        """The right hand and the pike by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "pike_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "pike_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, sway=0.0):
        """
        On guard: the left foot in front and the knees bent, turned a little
        to her right, the pike low and level. She watches along the pike.
        """
        return held(
            {
                "hips@loc": at("hips", (0, 0, -0.022 - breath * 0.004)),
                "hips": t("hips", (Z, -16)),
                "spine": t("spine", (Z, -2), (X, 6 + breath)),
                "chest": t("chest", (X, -2 - breath * 2)),
                "neck": t("neck", (Z, 6)),
                "head": t("head", (Z, 10 + sway * 4), (X, 2 + breath * 2)),
                "thigh.L": t("thigh.L", (X, -24), (Y, -6)),
                "shin.L": t("shin.L", (X, 28)),
                "foot.L": t("foot.L", (X, -4)),
                "thigh.R": t("thigh.R", (X, 12), (Y, 8)),
                "shin.R": t("shin.R", (X, 18)),
                "foot.R": t("foot.R", (X, -30)),
                "tabard.F": t("tabard.F", (X, -10 - breath * 2), (Y, sway * 3)),
                "tabard.B": t("tabard.B", (X, 4 + breath * 2)),
                "forearm.L/IK": 1.0,
            },
            (-0.08, 0.02 - breath * 0.004, 0.52 - breath * 0.006),
            (0.1, -1, 0.02 + sway * 0.02),
        )

    def winded(breath=0.0):
        """Low HP: bent over, she leans on the pike, its butt on the ground."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.03, -0.06)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, 24 + breath * 4)),
                chest=t("chest", (X, 10 + breath * 3)),
                neck=t("neck", (X, -14)),
                head=t("head", (X, -12 - breath * 4), (Y, -6)),
                thigh__L=t("thigh.L", (X, -30), (Y, -6)),
                shin__L=t("shin.L", (X, 34)),
                foot__L=t("foot.L", (X, -4)),
                thigh__R=t("thigh.R", (X, -10), (Y, 6)),
                shin__R=t("shin.R", (X, 30)),
                foot__R=t("foot.R", (X, -18)),
                tabard__F=t("tabard.F", (X, 16)),
                tabard__B=t("tabard.B", (X, -6)),
            ),
            (-0.07, -0.2, 0.4 - breath * 0.01),
            (0.02, -0.08, 1),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.026 - 0.006 * amount)),
            spine=t("spine", (Z, -2), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            tabard__F=t("tabard.F", (X, -24 * amount)),
            ik_hand__R_at_pos=Vector((-0.08, 0.06 * amount + 0.02, 0.54 + 0.02 * amount)),
            pike_aim_at_rot=aimed((0.1, -1, 0.25 * amount)),
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
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            tabard__F=t("tabard.F", (X, 10)),
            tabard__B=t("tabard.B", (X, -16)),
            ik_hand__R_at_pos=Vector((-0.1, -0.02, 0.4)),
            pike_aim_at_rot=aimed((0.2, -1, -0.5)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back. The hands let go, and the pike lies flat beside her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.13)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -28)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (Y, 30), (X, -10)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (Z, -30)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            tabard__F=t("tabard.F", (X, -12)),
            tabard__B=t("tabard.B", (X, 0)),
            forearm__L_slash_IK=0.0,
            forearm__R_slash_IK=0.0,
            pike_slash_Aim=1.0,
            pike_aim_at_rot=aimed((0.35, -1, -0.02)),
        )

    def crouch(base):
        """Low on one knee, the pike upright, as a summon starts and a Rebirth gets up."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.17)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, 26)),
                chest=t("chest", (X, 6)),
                neck=t("neck", (X, -10)),
                head=t("head", (X, -10)),
                thigh__L=t("thigh.L", (X, -72), (Y, -4)),
                shin__L=t("shin.L", (X, 92)),
                foot__L=t("foot.L", (X, -20)),
                thigh__R=t("thigh.R", (X, -4), (Y, 4)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -44)),
                tabard__F=t("tabard.F", (X, 36)),
                tabard__B=t("tabard.B", (X, -20)),
            ),
            (-0.1, -0.12, 0.34),
            (0.05, -0.2, 1),
        )

    def proud(base):
        """Up again, the pike upright beside her: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.004)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, -2)),
                chest=t("chest", (X, -8)),
                head=t("head", (Z, 8), (X, -10)),
                thigh__L=t("thigh.L", (X, -6), (Y, -4)),
                shin__L=t("shin.L", (X, 6)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 2), (Y, 4)),
                shin__R=t("shin.R", (X, 4)),
                foot__R=t("foot.R", (X, -6)),
                tabard__F=t("tabard.F", (X, 0)),
            ),
            (-0.14, -0.06, 0.6),
            (0.02, -0.12, 1),
        )

    def step(front):
        """A march, the pike level. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03)),
            hips=t("hips", (Z, -14), (Y, 4 * front)),
            spine=t("spine", (Z, -2), (X, 10)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 18)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 22)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "tabard__F": t("tabard.F", (X, -14 * front)),
                "tabard__B": t("tabard.B", (X, 10)),
                "ik_hand__R_at_pos": Vector((-0.08, 0.0, 0.5)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.008)),
            hips=t("hips", (Z, -14)),
            spine=t("spine", (Z, -2), (X, 10)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -26)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 12)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                "tabard__F": t("tabard.F", (X, -4)),
                "tabard__B": t("tabard.B", (X, 6)),
                "ik_hand__R_at_pos": Vector((-0.08, 0.0, 0.53)),
            },
        )

    # The attack: she draws the pike back, then lunges and drives it forward
    # to push the foe off the bridge (Knockback). The slash effect starts at
    # 50% of the attack (`MELEE_IMPACT` in fx.ts), so the thrust lands at
    # frame 15 of 30.
    def draw_back(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.04, -0.04)),
                hips=t("hips", (Z, -26)),
                spine=t("spine", (Z, -8), (X, 2)),
                chest=t("chest", (Z, -8)),
                neck=t("neck", (Z, 12)),
                head=t("head", (Z, 18), (X, 0)),
                thigh__L=t("thigh.L", (X, -20), (Y, -6)),
                shin__L=t("shin.L", (X, 22)),
                foot__L=t("foot.L", (X, -4)),
                thigh__R=t("thigh.R", (X, 20), (Y, 8)),
                shin__R=t("shin.R", (X, 34)),
                foot__R=t("foot.R", (X, -36)),
                tabard__F=t("tabard.F", (X, -4)),
                tabard__B=t("tabard.B", (X, 10)),
            ),
            (-0.09, 0.15, 0.55),
            (0.08, -1, 0.05),
        )

    def thrust(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.1, -0.08)),
                hips=t("hips", (Z, -6)),
                spine=t("spine", (Z, 4), (X, 20)),
                chest=t("chest", (Z, 6), (X, 6)),
                neck=t("neck", (Z, 0)),
                head=t("head", (Z, 4), (X, -20)),
                thigh__L=t("thigh.L", (X, -66), (Y, -6)),
                shin__L=t("shin.L", (X, 66)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 30), (Y, 6)),
                shin__R=t("shin.R", (X, 12)),
                foot__R=t("foot.R", (X, -14)),
                tabard__F=t("tabard.F", (X, -30)),
                tabard__B=t("tabard.B", (X, 30)),
            ),
            (-0.04, -0.2, 0.5),
            (0.06, -1, 0.0),
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

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, draw_back(stand())).key(15, thrust(stand())).key(21, thrust(stand()))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "bridge-pikeman.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
