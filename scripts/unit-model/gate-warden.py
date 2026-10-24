"""
Gate Warden (`human.gateWarden`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a tall, sharp-eyed woman guard
with dark hair in a low bun, a long blue coat with gold trim and a cream
lining over a mail shirt, steel shoulder guards and arm guards, a gold gate
badge on the chest, a large iron ring of keys at the belt, brown trousers,
tall boots with steel knee guards and a glaive. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/gate-warden.glb`;
then `bun unit-model:pack gate-warden` packs it for the game.

She holds the glaive with both hands, the blade up and forward: the right
hand at the right hip, on the camera side, and the left hand in front. The
left hand stays on the shaft with IK to a grip bone of the glaive. The ring
of keys hangs at her right hip, on the camera side, and swings when she
walks. She has Pivot, so she watches behind her: her idle looks back over
her shoulder, and her attack sweeps the glaive sideways, from her left to
her right. She has no Keyword that she uses by her own action, so she has
no cast clip.
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

SKIN = hex_color("#dfa985")
HAIR = hex_color("#3a2418")
HAIR_LIGHT = hex_color("#573826")
EYES = hex_color("#22180f")
BROW = hex_color("#2c1a10")
BLUE = hex_color("#2a4596")
BLUE_DARK = hex_color("#1b2f68")
GOLD = hex_color("#dcaa42")
GOLD_DARK = hex_color("#9e7428")
CREAM = hex_color("#ece2c8")
MAIL = hex_color("#8f959b")
MAIL_DARK = hex_color("#62676d")
STEEL = hex_color("#b9bec4")
STEEL_DARK = hex_color("#7c8288")
IRON = hex_color("#5a5550")
IRON_DARK = hex_color("#3c3834")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#46291a")
TROUSERS = hex_color("#4a3a30")
BOOT = hex_color("#4e3220")
SHAFT = hex_color("#5c3c22")

# --- Proportions ---------------------------------------------------------------

# A tall figure with long legs.
HIP_Z = 0.48
WAIST_Z = 0.56
CHEST_Z = 0.65
SHOULDER_Z = 0.735
NECK_Z = 0.76
HEAD_C = Vector((0, -0.004, 0.878))
KNEE_Z = 0.275
ANKLE_Z = 0.05
LEG_X = 0.056

# The right hand holds the glaive at the right hip, and the shaft rises
# forward, a little across the body. The left hand holds it in front. These
# are the rest (bind) positions.
SL = Vector((0.115, 0, SHOULDER_Z))
SR = Vector((-0.115, 0, SHOULDER_Z))
ER = Vector((-0.19, 0.09, 0.63))
WR = Vector((-0.09, 0.04, 0.55))
TR = WR + (WR - ER).normalized() * 0.04
GRIP_R = WR + (WR - ER).normalized() * 0.022
GLAIVE = Vector((0.14, -1, 0.42)).normalized()
FRONT_GRIP = 0.19
GRIP_L = GRIP_R + GLAIVE * FRONT_GRIP
WL = GRIP_L
EL = Vector((0.11, -0.08, 0.62))
TL = WL + (WL - EL).normalized() * 0.04
GLAIVE_BACK = 0.2
GLAIVE_FRONT = 0.46

# The ring of keys hangs at the right hip, on the camera side.
KEYS = Vector((-0.085, -0.03, 0.47))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.8), "chest"),
    ("head", (0, 0, 0.8), (0, 0, 0.98), "neck"),
    ("coat.B", (0, 0.08, 0.5), (0, 0.12, 0.14), "hips"),
    ("keys", tuple(KEYS), tuple(KEYS - Vector((0, 0, 0.06))), "hips"),
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
    ("glaive", tuple(GRIP_R), tuple(GRIP_R + GLAIVE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + GLAIVE * 0.05), "glaive"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.51, 0.59)
    return blend("spine", "chest", co.z, 0.61, 0.67)


def coat_weights(co):
    """The long coat follows the hips at the top, and the legs and its back panel lower."""
    t = clamp01((0.5 - co.z) / 0.3)
    back = clamp01((co.y - 0.0) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "coat.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side),
        "thigh.R": (1 - back) * t * clamp01(-side),
    }


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.06, 0.066, 0.08), 14, 10)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.06, -0.004)), HEAD_C + Vector((0, -0.076, -0.012)), 0.011, 0.002, 5)
    # A firm, pointed chin.
    kit.cone(head.bm, HEAD_C + Vector((0, -0.03, -0.05)), HEAD_C + Vector((0, -0.05, -0.078)), 0.03, 0.01, 6)
    for sign in (1, -1):
        kit.sphere(head.bm, HEAD_C + Vector((0.058 * sign, 0.008, -0.004)), (0.011, 0.015, 0.02), 6, 4)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.024 * sign, -0.054, 0.006)), (0.01, 0.008, 0.009), 8, 6)
    # Sharp eyes: the brows slant down to the nose.
    for sign in (1, -1):
        brow = kit.slab(eyes.bm, HEAD_C + Vector((0.026 * sign, -0.058, 0.024)), (0.017, 0, 0.005 * sign), (0, 0.004, 0), (0, 0, 0.004))
        eyes.paint(faces_of(brow), BROW)
    parts.append(eyes)

    # Dark hair with a side part, pulled back to a low bun at the nape.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.012)), (0.067, 0.074, 0.085), 14, 10)
    face = [v for v in verts if v.co.z < HEAD_C.z - 0.04 or (v.co.y < -0.03 and v.co.z < HEAD_C.z + 0.035)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    fringe = kit.cone(hair.bm, HEAD_C + Vector((-0.03, -0.05, 0.06)), HEAD_C + Vector((0.05, -0.05, 0.03)), 0.022, 0.01, 6, squash=0.6)
    hair.paint(faces_of(fringe), HAIR_LIGHT)
    kit.cone(hair.bm, HEAD_C + Vector((0, 0.05, 0.0)), HEAD_C + Vector((0, 0.058, -0.06)), 0.046, 0.03, 8, squash=0.6)
    bun = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.074, -0.05)), (0.034, 0.028, 0.03), 10, 7)
    for f in faces_of(bun):
        if int(f.calc_center_median().x * 150) % 2:
            hair.paint([f], HAIR_LIGHT)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, NECK_Z - 0.01), (0, 0, 0.82), 0.025, 0.023, 8)
    parts.append(neck)
    return parts


def gate_badge(part, center, normal, size):
    """A gold gate: an arch with three bars."""
    normal = Vector(normal).normalized()
    side = normal.cross(Z).normalized()
    out = normal * 0.004
    c = Vector(center)
    plate = kit.slab(part.bm, c + out, side * size * 0.5, normal * 0.004, Z * size * 0.42)
    part.paint(faces_of(plate), GOLD)
    arch = kit.cone(part.bm, c + out + Z * size * 0.42, c + out + Z * size * 0.62, size * 0.5, size * 0.12, 6, squash=0.15)
    part.paint(faces_of(arch), GOLD)
    for u in (-0.25, 0, 0.25):
        bar = kit.slab(part.bm, c + out * 2 + side * size * u, side * size * 0.04, normal * 0.003, Z * size * 0.4)
        part.paint(faces_of(bar), GOLD_DARK)


def body_parts():
    parts = []
    # The mail shirt shows at the open front of the coat.
    mail = Part("mail", MAIL, torso_weights, shade=0.12)
    verts = kit.cone(mail.bm, (0, 0, 0.5), (0, 0, 0.745), 0.066, 0.084, 12, squash=0.76)
    for f in faces_of(verts):
        if int(f.calc_center_median().z * 70) % 2:
            mail.paint([f], MAIL_DARK)
    parts.append(mail)

    # The coat over the chest: blue, open at the front, with gold edges.
    coat = Part("coat", BLUE, torso_weights, shade=0.12)

    def coat_color(row, column):
        if column in (0, 13):
            return GOLD
        return BLUE

    kit.ragged_cone(coat, 0.755, 0.5, 0.094, 0.076, 14, 3, 0.8, 0.0, coat_color, CREAM, gap=math.radians(30))
    gate_badge(coat, (0.05, -0.064, 0.66), (0.35, -1, 0), 0.04)
    parts.append(coat)

    collar = Part("collar", BLUE_DARK, "chest")
    verts = kit.cone(collar.bm, (0, 0.008, 0.74), (0, 0.012, 0.795), 0.06, 0.056, 12, caps=False, squash=0.85)
    collar.paint({f for v in verts if v.co.z > 0.788 for f in v.link_faces}, GOLD)
    parts.append(collar)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.495), (0, 0, 0.525), 0.084, 0.083, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.07, 0.51), (0.026, 0.008, 0.024))
    belt.paint(faces_of(buckle), GOLD)
    pouch = kit.box(belt.bm, (0.075, -0.03, 0.475), (0.026, 0.03, 0.04))
    belt.paint(faces_of(pouch), LEATHER_DARK)
    # A second belt that hangs low at the right hip, for the keys.
    kit.tube(belt.bm, [(-0.07, -0.05, 0.505), (-0.088, -0.032, 0.485), (-0.088, 0.02, 0.495), (-0.07, 0.05, 0.505)], [0.006] * 4, 4)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.43), (0, 0, 0.51), 0.07, 0.068, 12, squash=0.8)
    parts.append(hips)

    # The mail skirt shows at the open front.
    skirt = Part("mailskirt", MAIL, coat_weights, shade=0.1)

    def mail_color(row, column):
        return MAIL_DARK if row % 2 else MAIL

    kit.ragged_cone(skirt, 0.5, 0.36, 0.074, 0.098, 12, 3, 0.8, 0.0, mail_color, MAIL_DARK)
    parts.append(skirt)

    def coat_skirt_color(row, column):
        if row == 5 or column in (0, 15):
            return GOLD
        return BLUE_DARK if column % 5 == 2 else BLUE

    # The skirt of the coat to the calves, open at the front, with long tails.
    coat_skirt = Part("coatskirt", BLUE, coat_weights)
    kit.ragged_cone(coat_skirt, 0.51, 0.16, 0.088, 0.15, 16, 6, 0.8, 0.0, coat_skirt_color, BLUE_DARK, gap=math.radians(34), y_push=0.025)
    parts.append(coat_skirt)

    # A large iron ring of keys.
    keys = Part("keys", IRON, "keys", shade=0.05)
    ring_c = KEYS + Vector((-0.012, 0, -0.02))
    kit.torus(keys.bm, ring_c, (1, 0, 0), 0.03, 0.005, 12, 4)
    for index, angle in enumerate((-50, -20, 10, 40)):
        a = math.radians(angle)
        top = ring_c + Vector((-0.004, 0.03 * math.sin(a), -0.03 * math.cos(a)))
        down = Vector((0, 0.35 * math.sin(a), -1)).normalized()
        length = 0.05 + 0.012 * (index % 2)
        shank = kit.cone(keys.bm, top, top + down * length, 0.004, 0.004, 4)
        keys.paint(faces_of(shank), IRON_DARK if index % 2 else IRON)
        bit = kit.box(keys.bm, top + down * (length - 0.008) + Vector((0, 0.007, 0)), (0.004, 0.012, 0.012))
        keys.paint(faces_of(bit), IRON_DARK)
        bow = kit.torus(keys.bm, top + down * 0.006, (1, 0, 0), 0.008, 0.0028, 8, 3)
        keys.paint(faces_of(bow), GOLD_DARK if index == 1 else IRON)
    parts.append(keys)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        guard = Part(f"guard.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        top = kit.sphere(guard.bm, s + Vector((0.008 * sign, 0, 0.012)), (0.046, 0.044, 0.034), 10, 7)
        guard.paint({f for v in top if v.co.z < s.z - 0.006 for f in v.link_faces}, GOLD)
        lame = kit.sphere(guard.bm, s + Vector((0.018 * sign, 0, -0.022)), (0.038, 0.038, 0.024), 10, 6)
        guard.paint(faces_of(lame), STEEL_DARK)
        parts.append(guard)

        sleeve = Part(f"sleeve.{side}", BLUE, f"upperarm.{side}", shade=0.08)
        kit.cone(sleeve.bm, s, e, 0.028, 0.024, 8)
        parts.append(sleeve)

        vambrace = Part(f"vambrace.{side}", STEEL, f"forearm.{side}", shade=0.08)
        kit.cone(vambrace.bm, e - d * 0.005, w - d * 0.012, 0.025, 0.022, 8)
        cop = kit.sphere(vambrace.bm, e, (0.024, 0.024, 0.024), 8, 6)
        vambrace.paint(faces_of(cop), STEEL_DARK)
        cuff = kit.torus(vambrace.bm, w - d * 0.016, d, 0.024, 0.004, 10, 3)
        vambrace.paint(faces_of(cuff), GOLD)
        parts.append(vambrace)

        glove = Part(f"glove.{side}", LEATHER_DARK, f"hand.{side}")
        kit.sphere(glove.bm, w + d * 0.022, (0.019, 0.018, 0.024), 8, 6)
        parts.append(glove)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.041, 0.032, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        kit.cone(boot.bm, knee - Vector((0, 0, 0.02)), ankle, 0.035, 0.031, 8)
        top = kit.cone(boot.bm, knee + Vector((0, 0, 0.0)), knee - Vector((0, 0, 0.05)), 0.041, 0.037, 8)
        boot.paint(faces_of(top), LEATHER)
        # A steel greave on the front of the shin.
        greave = kit.slab(boot.bm, (knee + ankle) / 2 + Vector((0, -0.03, 0.02)), (0.026, 0, 0), (0, 0.008, 0), (0, 0, 0.075))
        boot.paint(faces_of(greave), STEEL_DARK)
        parts.append(boot)

        cop = Part(f"cop.{side}", STEEL, f"shin.{side}", shade=0.1)
        kit.sphere(cop.bm, knee + Vector((0, -0.03, 0.004)), (0.03, 0.022, 0.032), 8, 6)
        parts.append(cop)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.028, 0.024), (0.054, 0.11, 0.048))
        heel = kit.box(foot.bm, (LEG_X * sign, 0.012, 0.012), (0.052, 0.03, 0.024))
        foot.paint(faces_of(heel), LEATHER_DARK)
        parts.append(foot)
    return parts


def glaive_parts():
    glaive = Part("glaive", SHAFT, "glaive", shade=0.04)
    butt = GRIP_R - GLAIVE * GLAIVE_BACK
    top = GRIP_R + GLAIVE * GLAIVE_FRONT
    kit.cone(glaive.bm, butt, top, 0.0095, 0.009, 6)
    cap = kit.cone(glaive.bm, butt - GLAIVE * 0.012, butt + GLAIVE * 0.03, 0.013, 0.012, 6)
    glaive.paint(faces_of(cap), STEEL_DARK)
    for along in (-0.03, FRONT_GRIP - 0.03):
        wrap = kit.cone(glaive.bm, GRIP_R + GLAIVE * along, GRIP_R + GLAIVE * (along + 0.06), 0.011, 0.011, 6)
        glaive.paint(faces_of(wrap), LEATHER_DARK)
    collar = kit.cone(glaive.bm, top - GLAIVE * 0.03, top + GLAIVE * 0.01, 0.013, 0.013, 6)
    glaive.paint(faces_of(collar), GOLD)

    # The blade: a long single edge that curves out, with a hook on the back.
    # It is flat in the plane of the shaft and the figure's side, so the
    # camera sees its face.
    side = GLAIVE.cross(Z).normalized()
    edge = side.cross(GLAIVE).normalized()
    if edge.z < 0:
        edge = -edge
    # `edge` points to the cutting edge (up and back from the shaft line).
    outline = [
        (0.0, 0.012, -0.016),
        (0.05, 0.03, -0.014),
        (0.1, 0.038, -0.008),
        (0.15, 0.032, -0.002),
        (0.2, 0.0, 0.0),
    ]

    def grid(offset):
        rows = []
        for along, front, back in outline:
            base = top + GLAIVE * (along + 0.005) + side * offset
            rows.append([base + edge * back, base + edge * (back + front) * 0.5, base + edge * front])
        return rows

    def color_of(face_side, row, column):
        return hex_color("#d6dade") if column == 1 else STEEL

    edges = panel(glaive, grid(0.003), grid(-0.003), color_of)
    glaive.paint(edges, STEEL_DARK)
    hook = kit.cone(glaive.bm, top + GLAIVE * 0.03 - edge * 0.012, top + GLAIVE * 0.06 - edge * 0.05, 0.008, 0.001, 4, squash=0.4)
    glaive.paint(faces_of(hook), STEEL_DARK)
    return [glaive]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("GateWarden", BONES)
    parts = head_parts() + body_parts() + limb_parts() + glaive_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "GateWardenMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the shaft, the right hand to drive it. The glaive aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "glaive_aim": kit.add_empty("glaive_aim"),
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
    aim = bones["glaive"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["glaive_aim"]
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

    glaive_rest = rig.data.bones["glaive"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the glaive that points it along `direction`."""
        return GLAIVE.rotation_difference(Vector(direction).normalized()) @ glaive_rest

    def held(base, hand, direction):
        """The right hand and the glaive by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "glaive_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "glaive_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, look=0.0):
        """
        On watch: the feet apart, the chest turned a little to her right, the
        glaive up and forward. `look` turns her head back over her right
        shoulder, to the camera side (Pivot).
        """
        return held(
            {
                "hips@loc": at("hips", (0, 0, -0.01 - breath * 0.004)),
                "hips": t("hips", (Z, -12)),
                "spine": t("spine", (Z, -4 - look * 6), (X, 2 + breath)),
                "chest": t("chest", (Z, -look * 10), (X, -3 - breath * 2)),
                "neck": t("neck", (Z, 4 - look * 26)),
                "head": t("head", (Z, 6 - look * 40), (X, -2 + breath * 2 - look * 4)),
                "thigh.L": t("thigh.L", (X, -14), (Y, -6)),
                "shin.L": t("shin.L", (X, 12)),
                "foot.L": t("foot.L", (X, 0)),
                "thigh.R": t("thigh.R", (X, 8), (Y, 6)),
                "shin.R": t("shin.R", (X, 6)),
                "foot.R": t("foot.R", (X, -14)),
                "coat.B": t("coat.B", (X, 4 + breath * 2)),
                "keys": t("keys", (Y, -4 - breath * 3)),
                "forearm.L/IK": 1.0,
            },
            (-0.09, 0.03 - breath * 0.004, 0.53 - breath * 0.006),
            (0.12, -1, 0.42),
        )

    def winded(breath=0.0):
        """Low HP: down on one knee, both hands on the shaft of the upright glaive."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.03, -0.15 - breath * 0.005)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, 18 + breath * 4)),
                chest=t("chest", (X, 8 + breath * 3)),
                neck=t("neck", (X, -10)),
                head=t("head", (X, -6 - breath * 4), (Y, -6)),
                thigh__L=t("thigh.L", (X, -76), (Y, -6)),
                shin__L=t("shin.L", (X, 78)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 12), (Y, 8)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -50)),
                coat__B=t("coat.B", (X, 30)),
                keys=t("keys", (X, 10)),
            ),
            (-0.06, -0.16, 0.36 - breath * 0.01),
            (0.02, -0.1, 1),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.016 - 0.006 * amount)),
            spine=t("spine", (Z, -4), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            coat__B=t("coat.B", (X, 14 * amount)),
            keys=t("keys", (Y, -20 * amount), (X, -10 * amount)),
            ik_hand__R_at_pos=Vector((-0.09, 0.06 * amount + 0.03, 0.55 + 0.02 * amount)),
            glaive_aim_at_rot=aimed((0.12, -1, 0.42 + 0.5 * amount)),
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
            coat__B=t("coat.B", (X, -16)),
            keys=t("keys", (Y, 20)),
            ik_hand__R_at_pos=Vector((-0.1, -0.02, 0.4)),
            glaive_aim_at_rot=aimed((0.2, -1, -0.4)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back. The hands let go, and the glaive lies flat beside her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.13)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (Z, 0), (X, -4)),
            chest=t("chest", (Z, 0), (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -28)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (Y, 30), (X, -10)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            coat__B=t("coat.B", (X, -50)),
            keys=t("keys", (X, -60)),
            forearm__L_slash_IK=0.0,
            forearm__R_slash_IK=0.0,
            glaive_slash_Aim=1.0,
            glaive_aim_at_rot=aimed((0.35, -1, -0.02)),
        )

    def crouch(base):
        """Low on one knee, the glaive upright, as a summon starts and a Rebirth gets up."""
        return pose(
            winded(),
            spine=t("spine", (X, 26)),
            head=t("head", (X, -14)),
            hips_at_loc=at("hips", (0, 0.03, -0.17)),
        )

    def proud(base):
        """Up again, the glaive upright beside her: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, 0.0)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (Z, 0), (X, -2)),
                chest=t("chest", (Z, 0), (X, -8)),
                neck=t("neck", (Z, 0)),
                head=t("head", (Z, 8), (X, -10)),
                thigh__L=t("thigh.L", (X, -4), (Y, -4)),
                shin__L=t("shin.L", (X, 4)),
                thigh__R=t("thigh.R", (X, 2), (Y, 4)),
                shin__R=t("shin.R", (X, 4)),
                foot__R=t("foot.R", (X, -6)),
            ),
            (-0.14, -0.06, 0.6),
            (0.02, -0.12, 1),
        )

    def step(front):
        """A heavy march (Heavy), the glaive up. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03)),
            hips=t("hips", (Z, -10), (Y, 4 * front)),
            spine=t("spine", (Z, -4), (X, 6)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -30)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 14)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 18)),
                f"foot__{back}": t(f"foot.{back}", (X, 8)),
                "coat__B": t("coat.B", (X, 10), (Y, 6 * front)),
                "keys": t("keys", (X, 22 * front), (Y, -8)),
                "ik_hand__R_at_pos": Vector((-0.09, 0.01, 0.51)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.006)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (Z, -4), (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -26)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 52)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 8)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "coat__B": t("coat.B", (X, 6)),
                "keys": t("keys", (X, 0), (Y, -4)),
                "ik_hand__R_at_pos": Vector((-0.09, 0.02, 0.54)),
            },
        )

    # The attack: she turns to her left and draws the glaive across her body,
    # then sweeps it level from her left to her right (Pivot). The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # blade passes her front at frame 15 of 30.
    def wind(base):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.02, -0.04)),
                hips=t("hips", (Z, 16)),
                spine=t("spine", (Z, 14), (X, 4)),
                chest=t("chest", (Z, 14)),
                neck=t("neck", (Z, -10)),
                head=t("head", (Z, -16), (X, 0)),
                thigh__L=t("thigh.L", (X, -12), (Y, -10)),
                shin__L=t("shin.L", (X, 20)),
                thigh__R=t("thigh.R", (X, 12), (Y, 8)),
                shin__R=t("shin.R", (X, 22)),
                foot__R=t("foot.R", (X, -20)),
                coat__B=t("coat.B", (Y, -10)),
                keys=t("keys", (Y, 16)),
            ),
            (0.02, 0.0, 0.62),
            (0.9, -0.45, 0.25),
        )

    def sweep(base, through):
        """`through` 0 is the blade at her front, 1 the end of the sweep at her right."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.05, -0.06)),
                hips=t("hips", (Z, -18 - through * 16)),
                spine=t("spine", (Z, -12 - through * 10), (X, 10)),
                chest=t("chest", (Z, -10 - through * 8)),
                neck=t("neck", (Z, 8)),
                head=t("head", (Z, 12), (X, -6)),
                thigh__L=t("thigh.L", (X, -50), (Y, -8)),
                shin__L=t("shin.L", (X, 50)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 24), (Y, 8)),
                shin__R=t("shin.R", (X, 14)),
                foot__R=t("foot.R", (X, -14)),
                coat__B=t("coat.B", (X, 20), (Y, 20)),
                keys=t("keys", (Y, -30), (X, -10)),
            ),
            (lerp(-0.05, -0.16, through), lerp(-0.18, -0.08, through), 0.55),
            (lerp(0.0, -1, through), lerp(-1, -0.25, through), 0.08),
        )

    clips = []
    # The idle has a look back over the shoulder in the middle (Pivot).
    idle = Clip("idle", 72, loop=True)
    for frame, breath, look in ((0, 0, 0), (12, 0.5, 0), (24, 1, 0), (30, 0.8, 1), (42, 0.5, 1), (50, 0.3, 0), (60, 0.5, 0), (72, 0, 0)):
        idle.key(frame, stand(breath, look))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    walk = Clip("walk", 28, loop=True)
    walk.key(0, step(1)).key(7, passing("R")).key(14, step(-1)).key(21, passing("L")).key(28, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, wind(stand())).key(12, sweep(stand(), -0.5)).key(15, sweep(stand(), 0))
    attack.key(18, sweep(stand(), 0.7)).key(21, sweep(stand(), 1)).key(28, stand()).key(30, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "gate-warden.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
