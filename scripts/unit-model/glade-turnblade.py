"""
Glade Turnblade (`elf.gladeTurnblade`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a lean elf man guard with long,
wavy golden hair and a hard look, a hooded green coat of leaves with amber
trim and leaf prints, a long skirt of the coat with a ragged leaf hem, a
brown leather belt with pouches, brown trousers, tall brown boots with
knee guards and a crescent glaive. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/glade-turnblade.glb`;
then `bun unit-model:pack glade-turnblade` packs it for the game.

He holds the glaive with both hands, the blade up and forward: the right
hand at the right hip, on the camera side, and the left hand in front. The
left hand stays on the shaft with IK to a grip bone of the glaive. The
crescent blade is flat in the plane of the shaft and his side, so the
camera sees its face. He has Pivot, so he watches behind him: his idle
looks back over his right shoulder, and his attack is a full turn with the
glaive held out, so the blade cuts a circle round him. He has no Keyword
that he uses by his own action, so he has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#e6b48e")
HAIR = hex_color("#d2a85a")
HAIR_LIGHT = hex_color("#ebcb82")
HAIR_DARK = hex_color("#a67c3a")
EYES = hex_color("#1f2a1a")
BROW = hex_color("#9a7232")
COAT = hex_color("#4d7a34")
COAT_DARK = hex_color("#365a28")
COAT_LIGHT = hex_color("#6d9442")
AMBER = hex_color("#dd9a38")
AMBER_DARK = hex_color("#a86a22")
CREAM = hex_color("#ece0c2")
LEATHER = hex_color("#6b4528")
LEATHER_DARK = hex_color("#442b19")
TROUSERS = hex_color("#5b4030")
BOOT = hex_color("#6a4329")
SHAFT = hex_color("#5a3a20")
STEEL = hex_color("#c3c6c0")
STEEL_LIGHT = hex_color("#e2e4de")
STEEL_DARK = hex_color("#7f847e")

# --- Proportions ---------------------------------------------------------------

# A lean, tall elf.
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
SL = Vector((0.11, 0, SHOULDER_Z))
SR = Vector((-0.11, 0, SHOULDER_Z))
ER = Vector((-0.185, 0.09, 0.63))
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
GLAIVE_FRONT = 0.42

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.8), "chest"),
    ("head", (0, 0, 0.8), (0, 0, 0.98), "neck"),
    # The long hair down the back swings when he turns.
    ("hair", (0, 0.06, 0.86), (0, 0.1, 0.7), "head"),
    ("coat.B", (0, 0.08, 0.5), (0, 0.12, 0.14), "hips"),
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


def hair_weights(co):
    """The hair on the head follows the head, and the long hair down the back the hair bone."""
    back = clamp01((co.y - 0.03) / 0.04) * clamp01((0.84 - co.z) / 0.06)
    return {"head": 1 - back, "hair": back}


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
    kit.sphere(head.bm, HEAD_C, (0.06, 0.066, 0.08), 14, 10)
    # A fine, straight nose and a firm, narrow chin.
    kit.cone(head.bm, HEAD_C + Vector((0, -0.06, -0.004)), HEAD_C + Vector((0, -0.078, -0.016)), 0.011, 0.002, 5)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.03, -0.05)), HEAD_C + Vector((0, -0.048, -0.08)), 0.03, 0.01, 6)
    for sign in (1, -1):
        # Elf ears: long points that go up and back, out through the hair.
        kit.cone(head.bm, HEAD_C + Vector((0.055 * sign, 0.006, -0.002)), HEAD_C + Vector((0.13 * sign, 0.04, 0.05)), 0.016, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.056, 0.006)), (0.011, 0.007, 0.008), 8, 6)
        # A hard look: the brows slant down to the nose.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.059, 0.024)), (0.017, 0, 0.005 * sign), (0, 0.005, 0), (0, 0, 0.004))
        face.paint(faces_of(brow), BROW)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, NECK_Z - 0.01), (0, 0, 0.82), 0.025, 0.023, 8)
    parts.append(neck)

    # Long, wavy golden hair from a middle part, down over the shoulders and the back.
    hair = Part("hair", HAIR, hair_weights, shade=0.12)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.068, 0.075, 0.083), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.035 or (v.co.y < HEAD_C.y - 0.035 and v.co.z < HEAD_C.z + 0.045)]
    kit.bmesh.ops.delete(hair.bm, geom=face_verts, context="VERTS")
    for index, angle in enumerate(range(-120, 121, 24)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.064 * math.sin(a), 0.066 * math.cos(a) + 0.01, 0.02))
        length = 0.2 if abs(angle) < 70 else 0.15
        bottom = top + Vector((0.03 * math.sin(a), 0.03 + 0.02 * math.cos(a), -length))
        # A wave: each lock bends out and in again.
        middle = (top + bottom) / 2 + Vector((0.018 * math.sin(a), 0.02 * math.cos(a), 0.0))
        lock = kit.tube(hair.bm, [top, middle, bottom + Vector((0.006 * math.sin(a), 0.006, 0.02)), bottom], [0.022, 0.02, 0.014, 0.004], 5)
        hair.paint(faces_of(lock), (HAIR_LIGHT, HAIR, HAIR_DARK)[index % 3])
    # Two locks fall in front of the shoulders, framing the face.
    for sign in (1, -1):
        top = HEAD_C + Vector((0.056 * sign, -0.03, 0.02))
        lock = kit.tube(hair.bm, [top, top + Vector((0.016 * sign, 0.0, -0.07)), top + Vector((0.01 * sign, 0.008, -0.13))], [0.016, 0.013, 0.003], 5)
        hair.paint(faces_of(lock), HAIR_LIGHT)
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    # The green coat over the chest, closed, with an amber trim down the front.
    coat = Part("coat", COAT, torso_weights, shade=0.12)
    kit.cone(coat.bm, (0, 0, 0.49), (0, 0, 0.745), 0.07, 0.086, 12, squash=0.76)
    trim = kit.slab(coat.bm, (0.012, -0.068, 0.63), (0.008, 0, 0), (0, 0.006, 0), (0, 0, 0.11))
    coat.paint(faces_of(trim), AMBER)
    # A leather strap across the chest, from the left shoulder to the right hip.
    strap = kit.tube(coat.bm, [(0.08, -0.04, 0.73), (0.0, -0.072, 0.62), (-0.07, -0.05, 0.51)], [0.008] * 3, 4)
    coat.paint(faces_of(strap), LEATHER_DARK)
    parts.append(coat)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.495), (0, 0, 0.528), 0.084, 0.083, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.07, 0.512), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), AMBER)
    # Pouches at both hips; the right one, on the camera side, is larger.
    for x, size in ((-0.078, 0.034), (0.078, 0.026)):
        pouch = kit.box(belt.bm, (x, -0.034, 0.478), (size * 0.8, 0.03, size * 1.2))
        belt.paint(faces_of(pouch), LEATHER_DARK)
        flap = kit.box(belt.bm, (x, -0.05, 0.494), (size * 0.84, 0.004, size * 0.5))
        belt.paint(faces_of(flap), AMBER_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.43), (0, 0, 0.51), 0.07, 0.068, 12, squash=0.8)
    parts.append(hips)

    def skirt_color(row, column):
        if row == 5 or column in (0, 15):
            return AMBER
        # Leaf prints of darker green.
        if row == 4 and column % 4 == 1:
            return AMBER_DARK
        return COAT_DARK if column % 5 == 2 else COAT

    # The skirt of the coat to the calves, open at the front, with a ragged leaf hem.
    skirt = Part("coatskirt", COAT, coat_weights)
    kit.ragged_cone(skirt, 0.51, 0.18, 0.088, 0.16, 16, 6, 0.8, 0.07, skirt_color, CREAM, gap=math.radians(32), y_push=0.03)
    # Big leaves at the hem: green with amber tips.
    for index in range(9):
        angle = math.radians(-150 + index * 37.5)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0.02, 0.24)) + out * 0.15
        leaf(skirt, base, out * 0.4 + Vector((0, 0.1, -1)), 0.09, 0.03, (AMBER, COAT_LIGHT, COAT_DARK)[index % 3])
    parts.append(skirt)

    def hood_color(row, column):
        return COAT_DARK if column % 3 == 1 else COAT

    # The mantle of leaves over the shoulders, with the hood down on the back.
    mantle = Part("mantle", COAT, "chest", shade=0.08)
    kit.ragged_cone(mantle, 0.775, 0.66, 0.06, 0.135, 14, 2, 0.8, 0.03, hood_color, COAT_DARK)
    hood = kit.sphere(mantle.bm, (0, 0.078, 0.74), (0.07, 0.04, 0.05), 10, 6)
    mantle.paint(faces_of(hood), COAT_DARK)
    for index in range(12):
        angle = math.radians(-140 + index * 25.5)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0, 0.73)) + out * 0.1
        leaf(mantle, base, out * 0.9 + Vector((0, 0, -0.7)), 0.09, 0.03, (COAT_LIGHT, AMBER, COAT, COAT_DARK)[index % 4])
    clasp = kit.sphere(mantle.bm, (0, -0.064, 0.745), (0.015, 0.01, 0.015), 8, 5)
    mantle.paint(faces_of(clasp), AMBER)
    parts.append(mantle)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", COAT, f"upperarm.{side}", shade=0.08)
        kit.sphere(sleeve.bm, s + Vector((0.006 * sign, 0, -0.004)), (0.034, 0.034, 0.032), 8, 6)
        kit.cone(sleeve.bm, s, e, 0.028, 0.024, 8)
        parts.append(sleeve)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.08)
        verts = kit.cone(bracer.bm, e - d * 0.005, w - d * 0.01, 0.026, 0.022, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.02 for f in v.link_faces}, AMBER)
        leaf(bracer, (e + w) / 2 + Vector((0, -0.024, 0.0)), -d, 0.05, 0.016, COAT_LIGHT)
        parts.append(bracer)

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
        kit.cone(boot.bm, knee + Vector((0, 0, 0.02)), ankle, 0.038, 0.031, 8)
        cuff = kit.cone(boot.bm, knee + Vector((0, 0, 0.03)), knee - Vector((0, 0, 0.02)), 0.043, 0.04, 8)
        boot.paint(faces_of(cuff), LEATHER_DARK)
        for z in (0.12, 0.18):
            lace = kit.torus(boot.bm, (LEG_X * sign, 0, z), (0, 0, 1), 0.035, 0.004, 10, 3)
            boot.paint(faces_of(lace), LEATHER_DARK)
        parts.append(boot)

        cop = Part(f"cop.{side}", LEATHER_DARK, f"shin.{side}", shade=0.1)
        kit.sphere(cop.bm, knee + Vector((0, -0.032, 0.0)), (0.028, 0.02, 0.03), 8, 6)
        rim = kit.torus(cop.bm, knee + Vector((0, -0.04, 0.0)), (0, 1, 0), 0.02, 0.004, 10, 3)
        cop.paint(faces_of(rim), AMBER)
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
    glaive.paint(faces_of(cap), AMBER_DARK)
    for along in (-0.03, FRONT_GRIP - 0.03):
        wrap = kit.cone(glaive.bm, GRIP_R + GLAIVE * along, GRIP_R + GLAIVE * (along + 0.06), 0.011, 0.011, 6)
        glaive.paint(faces_of(wrap), LEATHER_DARK)
    # A vine wound round the shaft below the blade, with two leaves.
    vine = kit.tube(glaive.bm, [top - GLAIVE * (0.14 - 0.02 * i) + Vector((0.011 * math.cos(i * 2.1), 0, 0.011 * math.sin(i * 2.1))) for i in range(6)], [0.004] * 6, 4, caps=False)
    glaive.paint(faces_of(vine), COAT_DARK)
    for along, sign in ((0.1, 1), (0.06, -1)):
        leaf(glaive, top - GLAIVE * along, Vector((0.6 * sign, 0, -1)), 0.05, 0.016, COAT_LIGHT)
    collar = kit.cone(glaive.bm, top - GLAIVE * 0.03, top + GLAIVE * 0.012, 0.014, 0.014, 6)
    glaive.paint(faces_of(collar), AMBER)

    # The crescent blade: a moon of steel. Its back sits on the end of the
    # shaft, and its two horns curve forward and taper to points. It is flat
    # in the plane of the shaft and the figure's side, so the camera sees
    # its face.
    side = GLAIVE.cross(Z).normalized()
    edge = side.cross(GLAIVE).normalized()
    if edge.z < 0:
        edge = -edge
    center = top + GLAIVE * 0.11
    radius = 0.12
    horn = math.radians(115)
    rows = 10

    def grid(offset):
        result = []
        for row in range(rows + 1):
            theta = lerp(-horn, horn, row / rows)
            # The blade is widest at its back and tapers to the points of the horns.
            width = 0.06 * (1 - (theta / horn) ** 2) + 0.002
            radial = -GLAIVE * math.cos(theta) + edge * math.sin(theta)
            # The horn on the edge side is a little longer, as on the card.
            reach = radius * (1.08 if theta > 0 else 1.0)
            outer = center + radial * reach + side * offset
            result.append([outer - radial * width, outer - radial * width * 0.45, outer])
        return result

    def color_of(face_side, row, column):
        return STEEL_LIGHT if column == 1 else STEEL

    edges = panel(glaive, grid(0.0035), grid(-0.0035), color_of)
    glaive.paint(edges, STEEL_DARK)
    # An amber leaf etched on each face of the blade.
    for offset in (0.0045, -0.0045):
        mark = kit.slab(glaive.bm, top + GLAIVE * 0.012 + side * offset, GLAIVE * 0.012, side * 0.001, edge * 0.026)
        glaive.paint(faces_of(mark), AMBER)
    return [glaive]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("GladeTurnblade", BONES)
    parts = head_parts() + body_parts() + limb_parts() + glaive_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "GladeTurnbladeMesh")
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

    def aimed(direction, spin=0.0):
        """
        The world rotation of the glaive that points it along `direction`.
        `spin` turns the direction round Z, with the body in the attack: the
        same arc for each key, so the keys do not flip to the long way round.
        """
        spun = Quaternion(Z, math.radians(spin))
        return spun @ GLAIVE.rotation_difference(Vector(direction).normalized()) @ glaive_rest

    def held(base, hand, direction, spin=0.0):
        """The right hand and the glaive by IK and `Aim`."""
        spun = Quaternion(Z, math.radians(spin))
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "glaive_slash_Aim": 1.0,
                "ik_hand__R_at_pos": spun @ Vector(hand),
                "glaive_aim_at_rot": aimed(direction, spin),
            },
        )

    def stand(breath=0.0, look=0.0):
        """
        On guard: the feet apart, the left foot in front, the chest turned a
        little to his right, the glaive up and forward. `look` turns his head
        back over his right shoulder, to the camera side (Pivot).
        """
        return held(
            {
                "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.004)),
                "hips": t("hips", (Z, -14)),
                "spine": t("spine", (Z, -4 - look * 8), (X, 3 + breath)),
                "chest": t("chest", (Z, -look * 12), (X, -2 - breath * 2)),
                "neck": t("neck", (Z, 4 - look * 26)),
                "head": t("head", (Z, 6 - look * 44), (X, -2 + breath * 2 - look * 4)),
                "hair": t("hair", (X, -4 - breath * 3), (Y, look * 10)),
                "thigh.L": t("thigh.L", (X, -16), (Y, -6)),
                "shin.L": t("shin.L", (X, 14)),
                "foot.L": t("foot.L", (X, 0)),
                "thigh.R": t("thigh.R", (X, 10), (Y, 6)),
                "shin.R": t("shin.R", (X, 8)),
                "foot.R": t("foot.R", (X, -16)),
                "coat.B": t("coat.B", (X, 4 + breath * 2)),
                "forearm.L/IK": 1.0,
            },
            (-0.09, 0.03 - breath * 0.004, 0.53 - breath * 0.006),
            (0.12, -1, 0.45),
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
                hair=t("hair", (X, 10)),
                thigh__L=t("thigh.L", (X, -76), (Y, -6)),
                shin__L=t("shin.L", (X, 78)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 12), (Y, 8)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -50)),
                coat__B=t("coat.B", (X, 30)),
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
            hair=t("hair", (X, 16 * amount)),
            coat__B=t("coat.B", (X, 14 * amount)),
            ik_hand__R_at_pos=Vector((-0.09, 0.06 * amount + 0.03, 0.55 + 0.02 * amount)),
            glaive_aim_at_rot=aimed((0.12, -1, 0.45 + 0.5 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            hair=t("hair", (X, -10)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            coat__B=t("coat.B", (X, -16)),
            ik_hand__R_at_pos=Vector((-0.1, -0.02, 0.4)),
            glaive_aim_at_rot=aimed((0.2, -1, -0.4)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back. The hands let go, and the glaive lies flat beside him."""
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
            hair=t("hair", (X, -40)),
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

    def ready(base):
        """Up again, the glaive held level behind him and his eyes to the front: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.03)),
                hips=t("hips", (Z, -24)),
                spine=t("spine", (Z, -8), (X, 4)),
                chest=t("chest", (Z, -6), (X, -6)),
                neck=t("neck", (Z, 14)),
                head=t("head", (Z, 16), (X, -6)),
                hair=t("hair", (Y, -10)),
                thigh__L=t("thigh.L", (X, -30), (Y, -8)),
                shin__L=t("shin.L", (X, 30)),
                thigh__R=t("thigh.R", (X, 18), (Y, 8)),
                shin__R=t("shin.R", (X, 16)),
                foot__R=t("foot.R", (X, -20)),
            ),
            (-0.15, 0.04, 0.52),
            (-0.3, 1, 0.2),
        )

    def step(front):
        """A light, quick step, the glaive up. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.024)),
            hips=t("hips", (Z, -12), (Y, 3 * front)),
            spine=t("spine", (Z, -4), (X, 7)),
            chest=t("chest", (Z, -4 * front)),
            hair=t("hair", (X, 8), (Y, 6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 12)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 20)),
                f"shin__{back}": t(f"shin.{back}", (X, 20)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "coat__B": t("coat.B", (X, 12), (Y, 6 * front)),
                "ik_hand__R_at_pos": Vector((-0.09, 0.01, 0.52)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.002)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (Z, -4), (X, 7)),
            hair=t("hair", (X, 4)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -28)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 8)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "coat__B": t("coat.B", (X, 8)),
                "ik_hand__R_at_pos": Vector((-0.09, 0.02, 0.55)),
            },
        )

    # The attack (Pivot): he turns to his left and draws the glaive across
    # his body, then turns all the way round to his right with the glaive
    # held out level, so the blade cuts a full circle round him. The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # blade passes his front at frame 15 of 30.
    # The turn of the root at each frame. The blade is out at his right
    # front, 16 degrees from his front, so it passes the front at 16.
    SPIN = ((12, 50), (15, 16), (18, -66), (21, -150), (24, -236), (27, -310), (30, -360))

    def spin_at(frame):
        for (f0, a0), (f1, a1) in zip(SPIN, SPIN[1:]):
            if f0 <= frame <= f1:
                return lerp(a0, a1, (frame - f0) / (f1 - f0))
        return SPIN[-1][1]

    def wind(base):
        """The glaive drawn back across his body to his left, the blade low behind him."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.02, -0.045)),
                hips=t("hips", (Z, 10)),
                spine=t("spine", (Z, 12), (X, 6)),
                chest=t("chest", (Z, 10)),
                neck=t("neck", (Z, -10)),
                head=t("head", (Z, -16), (X, 0)),
                hair=t("hair", (Y, -12)),
                thigh__L=t("thigh.L", (X, -12), (Y, -10)),
                shin__L=t("shin.L", (X, 22)),
                thigh__R=t("thigh.R", (X, 12), (Y, 8)),
                shin__R=t("shin.R", (X, 24)),
                foot__R=t("foot.R", (X, -20)),
                coat__B=t("coat.B", (Y, -10)),
            ),
            (0.04, 0.0, 0.6),
            (0.9, 0.3, 0.1),
        )

    def sweep(base, angle, through):
        """
        The turn: the root turns by `angle`, and the glaive is held out level
        at his right front. `through` 0 to 1 opens the turn and closes it.
        """
        lean = math.sin(math.pi * through)
        return held(
            pose(
                base,
                root=t("root", (Z, angle)),
                hips_at_loc=at("hips", (0, 0, -0.06 * lean - 0.02)),
                hips=t("hips", (Z, 0)),
                spine=t("spine", (Z, -6), (X, 8 * lean)),
                chest=t("chest", (Z, -6)),
                neck=t("neck", (Z, 6)),
                head=t("head", (Z, 6), (X, -4)),
                hair=t("hair", (Y, 30 * lean), (X, 20 * lean)),
                thigh__L=t("thigh.L", (X, -30 * lean), (Y, -12 * lean)),
                shin__L=t("shin.L", (X, 34 * lean)),
                foot__L=t("foot.L", (X, -4)),
                thigh__R=t("thigh.R", (X, 10 * lean), (Y, 14 * lean)),
                shin__R=t("shin.R", (X, 20 * lean)),
                foot__R=t("foot.R", (X, -10 * lean)),
                coat__B=t("coat.B", (X, 30 * lean), (Y, 24 * lean)),
            ),
            (-0.12, -0.14, 0.56),
            (-0.28, -1, 0.06),
            spin=angle,
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

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, wind(stand()))
    for frame in range(12, 31):
        attack.key(frame, sweep(stand(), spin_at(frame), clamp01((frame - 11) / 19)))
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
    rebirth.key(32, crouch(stand())).key(41, ready(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.19))))
    summon.key(17, ready(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "glade-turnblade.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
