"""
Dawn Cleric (`human.dawnCleric`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a cheerful, round-faced woman
priest with brown hair in a bun, a long white robe with blue panels and a
gold trim, wide white sleeves with blue cuffs, a gold sun pendant, a small
hymn book on a cord at the belt and a staff with a gold sun disc on top. Run
it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/dawn-cleric.glb`; then
`bun unit-model:pack dawn-cleric` packs it for the game.

The staff is in the right hand, on the camera side, and the face of the sun
disc turns to the camera. She sings all the time: her mouth is open, and it
opens wider (the mouth bone scales). She attacks at Mid Range: she points the
staff, and the sun disc flares (the glow bone scales) when the Holy light
leaves, at 20% of the attack. Her cast (Regenerate) throws the left arm up,
and gold sparks turn round her (the sparks bone scales up and turns).
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

SKIN = hex_color("#efbe9c")
CHEEK = hex_color("#e89a86")
HAIR = hex_color("#6e4428")
HAIR_LIGHT = hex_color("#8f5c36")
EYES = hex_color("#2a1d16")
MOUTH = hex_color("#7a2a26")
WHITE = hex_color("#f2ecdc")
WHITE_SHADE = hex_color("#d8cfba")
BLUE = hex_color("#2c4c9e")
BLUE_DARK = hex_color("#1d3470")
GOLD = hex_color("#e2b046")
GOLD_DARK = hex_color("#a37a2a")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4e301c")
BOOK = hex_color("#7a3a24")
SHAFT = hex_color("#5e3c22")
GLOW = hex_color("#fff1b0")
SPARK = hex_color("#ffd65a")

# --- Proportions ---------------------------------------------------------------

# A round, stout figure with a large round head.
HIP_Z = 0.45
WAIST_Z = 0.53
CHEST_Z = 0.62
SHOULDER_Z = 0.71
NECK_Z = 0.74
HEAD_C = Vector((0, -0.006, 0.855))
KNEE_Z = 0.26
ANKLE_Z = 0.05
LEG_X = 0.056
MOUTH_C = HEAD_C + Vector((0, -0.066, -0.032))

# The right forearm points forward and holds the staff upright. The left arm
# hangs in an A-pose. These are the rest (bind) positions.
SR = Vector((-0.125, 0, SHOULDER_Z))
ER = Vector((-0.17, 0.03, 0.575))
WR = Vector((-0.165, -0.1, 0.565))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.026
SL = Vector((0.125, 0, SHOULDER_Z))
ARM_DIR = Vector((math.sin(math.radians(20)), 0, -math.cos(math.radians(20))))
EL = SL + ARM_DIR * 0.15
WL = EL + ARM_DIR * 0.14
TL = WL + ARM_DIR * 0.05

STAFF_BOTTOM = 0.02
DISC = Vector((HAND_R.x, HAND_R.y, 1.02))
DISC_R = 0.062

SPARKS = Vector((0, 0, 0.3))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.78), "chest"),
    ("head", (0, 0, 0.78), (0, 0, 0.96), "neck"),
    ("mouth", tuple(MOUTH_C), tuple(MOUTH_C + Vector((0, -0.03, 0))), "head"),
    ("robe.B", (0, 0.09, 0.45), (0, 0.13, 0.08), "hips"),
    ("book", (-0.03, -0.09, 0.47), (-0.03, -0.1, 0.38), "hips"),
    ("sparks", tuple(SPARKS), tuple(SPARKS + Vector((0, 0, 0.1))), "root"),
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
    ("staff", tuple(HAND_R), tuple(HAND_R + Z * 0.1), "hand.R"),
    # The Holy light of the sun disc: scale 0 hides it.
    ("glow", tuple(DISC), tuple(DISC + Z * 0.05), "staff"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.49, 0.57)
    return blend("spine", "chest", co.z, 0.59, 0.66)


def robe_weights(co):
    """The long robe follows the hips at the top, and the legs and its back lower."""
    t = clamp01((0.48 - co.z) / 0.4)
    back = clamp01((co.y - 0.02) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t * 0.8,
        "robe.B": back * t * 0.8,
        "thigh.L": (1 - back) * t * clamp01(side + 0.2) * 0.6,
        "thigh.R": (1 - back) * t * clamp01(-side + 0.2) * 0.6,
    }


# --- Parts ---------------------------------------------------------------------


def sun(part, center, normal, radius, color, rays=8, ray_length=0.6):
    """A gold sun: a disc with rays."""
    normal = Vector(normal).normalized()
    side = normal.cross(Z if abs(normal.z) < 0.9 else X).normalized()
    up = side.cross(normal).normalized()
    center = Vector(center)
    disc = kit.cone(part.bm, center - normal * 0.003, center + normal * 0.003, radius * 0.55, radius * 0.55, 10)
    part.paint(faces_of(disc), color)
    for index in range(rays):
        a = 2 * math.pi * index / rays
        out = side * math.cos(a) + up * math.sin(a)
        ray = kit.cone(part.bm, center + out * radius * 0.5, center + out * radius * (0.5 + ray_length), radius * 0.16, 0.0008, 4, squash=0.4)
        part.paint(faces_of(ray), color)


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.07, 0.07, 0.078), 14, 10)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.07, -0.002)), (0.012, 0.01, 0.011), 6, 4)
    for sign in (1, -1):
        kit.sphere(head.bm, HEAD_C + Vector((0.068 * sign, 0.006, -0.004)), (0.012, 0.016, 0.02), 6, 4)
        cheek = kit.sphere(head.bm, HEAD_C + Vector((0.038 * sign, -0.056, -0.018)), (0.018, 0.012, 0.014), 6, 4)
        head.paint(faces_of(cheek), CHEEK)
    parts.append(head)

    # Happy eyes: closed arcs, as she sings.
    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.cone(eyes.bm, HEAD_C + Vector((0.012 * sign, -0.066, 0.01)), HEAD_C + Vector((0.038 * sign, -0.06, 0.012)), 0.004, 0.003, 4)
        kit.cone(eyes.bm, HEAD_C + Vector((0.016 * sign, -0.065, 0.036)), HEAD_C + Vector((0.042 * sign, -0.058, 0.04)), 0.003, 0.002, 4)
    parts.append(eyes)

    # The wide open mouth of the singer.
    mouth = Part("mouth", MOUTH, "mouth", shade=0)
    kit.sphere(mouth.bm, MOUTH_C, (0.02, 0.01, 0.018), 8, 6)
    parts.append(mouth)

    # Brown hair with curls at the temples, up in a bun.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.075, 0.076, 0.082), 14, 10)
    face = [v for v in verts if v.co.z < HEAD_C.z - 0.02 or (v.co.y < -0.03 and v.co.z < HEAD_C.z + 0.04)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    for sign in (1, -1):
        for dz in (0.0, -0.034):
            curl = kit.sphere(hair.bm, HEAD_C + Vector((0.066 * sign, -0.026, 0.026 + dz)), (0.016, 0.016, 0.018), 6, 5)
            hair.paint(faces_of(curl), HAIR_LIGHT)
    bun = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.05, 0.075)), (0.042, 0.038, 0.034), 10, 7)
    for f in faces_of(bun):
        if int(f.calc_center_median().x * 140) % 2:
            hair.paint([f], HAIR_LIGHT)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, NECK_Z - 0.01), (0, 0, 0.8), 0.03, 0.028, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The robe over the round body: white with a blue panel each side of the front.
    body = Part("body", WHITE, torso_weights, shade=0.12)
    verts = kit.cone(body.bm, (0, 0, 0.47), (0, 0, 0.725), 0.098, 0.09, 14, squash=0.82)
    for f in faces_of(verts):
        c = f.calc_center_median()
        if c.y < -0.04 and 0.012 < abs(c.x) < 0.05:
            body.paint([f], BLUE)
    kit.sphere(body.bm, (0, -0.012, 0.6), (0.1, 0.085, 0.09), 12, 8)
    parts.append(body)

    # A wide blue collar with a gold edge, and the sun pendant.
    collar = Part("collar", BLUE, "chest", shade=0.06)
    verts = kit.cone(collar.bm, (0, 0.004, 0.69), (0, 0.006, 0.76), 0.1, 0.05, 14, caps=False, squash=0.82)
    collar.paint({f for v in verts if v.co.z < 0.7 for f in v.link_faces}, GOLD)
    sun(collar, (0, -0.094, 0.645), (0, -1, 0.2), 0.026, GOLD)
    kit.tube(collar.bm, [(-0.035, -0.06, 0.73), (0, -0.092, 0.665), (0.035, -0.06, 0.73)], [0.003] * 3, 4)
    parts.append(collar)

    belt = Part("belt", GOLD, "hips", shade=0.05)
    kit.torus(belt.bm, (0, 0, 0.5), (0, 0, 1), 0.098, 0.008, 16, 4)
    # The ends of the gold cord with tassels, at her left front.
    for x in (0.03, 0.045):
        kit.tube(belt.bm, [(x, -0.088, 0.495), (x + 0.004, -0.096, 0.42), (x + 0.006, -0.1, 0.36)], [0.004] * 3, 4)
        kit.cone(belt.bm, (x + 0.006, -0.1, 0.37), (x + 0.006, -0.1, 0.33), 0.004, 0.011, 6)
    parts.append(belt)

    # The hymn book on its cord.
    book = Part("book", BOOK, "book", shade=0.05)
    kit.tube(book.bm, [(-0.03, -0.088, 0.495), (-0.03, -0.1, 0.45)], [0.0025] * 2, 4)
    kit.box(book.bm, (-0.03, -0.104, 0.42), (0.05, 0.016, 0.06))
    pages = kit.box(book.bm, (-0.03, -0.104, 0.42), (0.046, 0.018, 0.054))
    book.paint(faces_of(pages), WHITE)
    star = kit.box(book.bm, (-0.03, -0.114, 0.422), (0.014, 0.003, 0.014))
    book.paint(faces_of(star), GOLD)
    parts.append(book)

    def robe_color(row, column):
        if row == 6:
            return GOLD
        if column in (1, 14):
            return BLUE
        if row == 5 and column in (0, 15):
            return GOLD
        return WHITE if column % 4 else WHITE_SHADE

    # The long robe to the ground, a little wider at the hem.
    robe = Part("robe", WHITE, robe_weights, shade=0.14)
    kit.ragged_cone(robe, 0.5, 0.045, 0.098, 0.165, 16, 7, 0.86, 0.006, robe_color, WHITE_SHADE, y_push=0.03)
    for sign in (1, -1):
        sun(robe, (0.05 * sign, -0.15, 0.2), (0.25 * sign, -1, 0.15), 0.022, GOLD)
    parts.append(robe)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        shoulder = Part(f"shoulder.{side}", WHITE, f"upperarm.{side}", shade=0.1)
        kit.sphere(shoulder.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.036, 0.036, 0.034), 10, 7)
        parts.append(shoulder)

        sleeve = Part(f"sleeve.{side}", WHITE, f"upperarm.{side}", shade=0.08)
        kit.cone(sleeve.bm, s, e, 0.032, 0.03, 8)
        parts.append(sleeve)

        # A wide bell sleeve with a blue cuff and a gold rim.
        bell = Part(f"bell.{side}", WHITE, f"forearm.{side}", shade=0.1)
        kit.cone(bell.bm, e - d * 0.01, w - d * 0.01, 0.031, 0.05, 8)
        cuff = kit.cone(bell.bm, w - d * 0.035, w + d * 0.004, 0.047, 0.054, 8)
        bell.paint(faces_of(cuff), BLUE)
        rim = kit.torus(bell.bm, w + d * 0.004, d, 0.053, 0.004, 10, 3)
        bell.paint(faces_of(rim), GOLD)
        parts.append(bell)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.026, (0.02, 0.018, 0.025), 8, 6)
        parts.append(hand)

        # Short legs under the robe, and boots that show at the hem.
        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        leg = Part(f"leg.{side}", WHITE_SHADE, f"thigh.{side}")
        kit.cone(leg.bm, hip, knee, 0.042, 0.034, 8)
        parts.append(leg)
        boot = Part(f"boot.{side}", LEATHER, f"shin.{side}")
        kit.cone(boot.bm, knee, ankle, 0.034, 0.031, 8)
        parts.append(boot)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.024), (0.054, 0.104, 0.048))
        sole = kit.box(foot.bm, (LEG_X * sign, -0.03, 0.006), (0.056, 0.106, 0.012))
        foot.paint(faces_of(sole), LEATHER_DARK)
        parts.append(foot)
    return parts


def staff_parts():
    parts = []
    staff = Part("staff", SHAFT, "staff", shade=0.04)
    bottom = Vector((HAND_R.x, HAND_R.y, STAFF_BOTTOM))
    kit.cone(staff.bm, bottom, DISC - Z * DISC_R * 0.6, 0.01, 0.011, 6)
    foot = kit.cone(staff.bm, bottom - Z * 0.005, bottom + Z * 0.03, 0.012, 0.012, 6)
    staff.paint(faces_of(foot), GOLD_DARK)
    for z in (0.3, 0.75):
        band = kit.cone(staff.bm, (HAND_R.x, HAND_R.y, z), (HAND_R.x, HAND_R.y, z + 0.02), 0.013, 0.013, 6)
        staff.paint(faces_of(band), GOLD)
    # Blue ribbons tied under the disc.
    knot = DISC - Z * (DISC_R + 0.01)
    for dy, dx in ((0.02, 0.0), (-0.01, 0.008)):
        ribbon = kit.tube(staff.bm, [knot, knot + Vector((dx, 0.02 + dy, -0.05)), knot + Vector((dx * 2, 0.04 + dy, -0.13))], [0.007, 0.006, 0.003], 4)
        staff.paint(faces_of(ribbon), BLUE)

    # The sun disc: its face turns to the side, to the camera.
    ring = kit.torus(staff.bm, DISC, (1, 0, 0), DISC_R, 0.008, 18, 4)
    staff.paint(faces_of(ring), GOLD)
    inner = kit.cone(staff.bm, DISC - X * 0.006, DISC + X * 0.006, DISC_R * 0.62, DISC_R * 0.62, 12)
    staff.paint(faces_of(inner), hex_color("#ffd877"))
    for index in range(12):
        a = 2 * math.pi * index / 12
        out = Vector((0, math.cos(a), math.sin(a)))
        long = index % 2 == 0
        ray = kit.cone(staff.bm, DISC + out * DISC_R * 0.95, DISC + out * DISC_R * (1.55 if long else 1.3), 0.009, 0.001, 4, squash=0.5)
        staff.paint(faces_of(ray), GOLD if long else GOLD_DARK)
    parts.append(staff)

    glow = Part("glow", GLOW, "glow", shade=0)
    kit.sphere(glow.bm, DISC, (0.024, 0.07, 0.07), 10, 8)
    for index in range(8):
        a = 2 * math.pi * index / 8 + 0.2
        out = Vector((0, math.cos(a), math.sin(a)))
        flare = kit.cone(glow.bm, DISC + out * 0.06, DISC + out * 0.16, 0.022, 0.001, 4, squash=0.4)
        glow.paint(faces_of(flare), SPARK)
    parts.append(glow)
    return parts


def spark_parts():
    """Gold sparks on a ring round her, for Regenerate. The sparks bone scales them from 0."""
    sparks = Part("sparks", SPARK, "sparks", shade=0)
    for index in range(9):
        a = 2 * math.pi * index / 9
        r = 0.2 + 0.03 * (index % 2)
        z = SPARKS.z + 0.05 + 0.5 * ((index * 4) % 9) / 9
        c = Vector((r * math.cos(a), r * math.sin(a), z))
        size = 0.016 + 0.006 * (index % 3)
        kit.sphere(sparks.bm, c, (size * 0.6, size * 0.6, size * 1.4), 4, 3)
        kit.sphere(sparks.bm, c, (size * 1.3, size * 0.4, size * 0.5), 4, 3)
    return [sparks]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("DawnCleric", BONES)
    parts = head_parts() + body_parts() + limb_parts() + staff_parts() + spark_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "DawnClericMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """The staff aims with `Aim`, so it stays upright when the arm moves."""
    empties = {"staff_aim": kit.add_empty("staff_aim")}
    aim = rig.pose.bones["staff"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["staff_aim"]
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

    staff_rest = rig.data.bones["staff"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the staff that points it along `direction`."""
        return Z.rotation_difference(Vector(direction).normalized()) @ staff_rest

    def stand(breath=0.0, sway=0.0, sing=0.5):
        """She stands and sings, the staff upright, and sways from side to side."""
        return {
            "hips@loc": at("hips", (0, 0, -0.006 - breath * 0.004)),
            "hips": t("hips", (Y, sway * 3)),
            "spine": t("spine", (X, 2 + breath), (Y, sway * 2)),
            "chest": t("chest", (X, -6 - breath * 3), (Z, 4)),
            "neck": t("neck", (X, -4)),
            "head": t("head", (X, -10 - sing * 6), (Y, -sway * 6), (Z, 8)),
            "mouth@scale": 0.7 + sing * 0.4,
            "upperarm.L": t("upperarm.L", (X, -8 - breath * 4), (Y, 6 + sing * 8)),
            "forearm.L": t("forearm.L", (X, -30 - sing * 20)),
            "hand.L": t("hand.L", (X, -10)),
            # The staff stands forward, in front of the line of her face.
            "upperarm.R": t("upperarm.R", (X, -36 - breath * 2)),
            "thigh.L": t("thigh.L", (X, -4), (Y, -3)),
            "thigh.R": t("thigh.R", (X, 4), (Y, 3)),
            "foot.R": t("foot.R", (X, -4)),
            "robe.B": t("robe.B", (X, 2 + breath * 2), (Y, sway * 3)),
            "book": t("book", (Y, -sway * 8)),
            "staff/Aim": 1.0,
            "staff_aim@rot": aimed((0.0, -0.02 + breath * 0.01, 1)),
            "glow@scale": 0.0,
            "sparks@scale": 0.0,
        }

    def tired(breath=0.0):
        """Low HP: bent, she leans on the staff with both hands and hums, the mouth small."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.04)),
            spine=t("spine", (X, 20 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 3)),
            neck=t("neck", (X, 4)),
            head=t("head", (X, 10 + breath * 4), (Y, -8)),
            mouth_at_scale=0.35,
            upperarm__L=t("upperarm.L", (X, -50), (Z, 30), (Y, -20)),
            forearm__L=t("forearm.L", (X, -60)),
            hand__L=t("hand.L", (X, 0)),
            upperarm__R=t("upperarm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 18)),
            thigh__R=t("thigh.R", (X, -6), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, -8)),
            robe__B=t("robe.B", (X, -4)),
            book=t("book", (X, -20)),
            staff_aim_at_rot=aimed((0.03, -0.12, 1)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the song stops."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012)),
            spine=t("spine", (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, -6 * amount)),
            head=t("head", (X, -18 * amount), (Z, -8 * amount)),
            mouth_at_scale=lerp(0.9, 0.4, amount),
            upperarm__L=t("upperarm.L", (Y, 24 * amount), (X, 10 * amount)),
            forearm__L=t("forearm.L", (X, -40 * amount)),
            robe__B=t("robe.B", (X, 10 * amount)),
            book=t("book", (X, -30 * amount)),
            staff_aim_at_rot=aimed((0.0, 0.2 * amount, 1)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.04)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 20)),
            mouth_at_scale=0.5,
            thigh__L=t("thigh.L", (X, -22)),
            shin__L=t("shin.L", (X, 34)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 24)),
            foot__R=t("foot.R", (X, -16)),
            upperarm__L=t("upperarm.L", (Y, 30)),
            robe__B=t("robe.B", (X, -12)),
            book=t("book", (X, 30)),
            staff_aim_at_rot=aimed((0.2, -0.6, 1)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the arms out, the staff flat beside her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.14)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Y, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -26)),
            mouth_at_scale=0.3,
            upperarm__L=t("upperarm.L", (Y, -60), (X, 20)),
            forearm__L=t("forearm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, -20)),
            forearm__R=t("forearm.R", (X, 20)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 20)),
            robe__B=t("robe.B", (X, -40)),
            book=t("book", (X, -80)),
            staff_aim_at_rot=aimed((0.2, -1, -0.02)),
        )

    def kneel(base):
        """On both knees, the head down, the staff upright: as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.16)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 6)),
            head=t("head", (X, 16)),
            mouth_at_scale=0.3,
            thigh__L=t("thigh.L", (X, -60), (Y, -4)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -56), (Y, 4)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -40), (Z, 30)),
            forearm__L=t("forearm.L", (X, -70)),
            upperarm__R=t("upperarm.R", (X, -86)),
            forearm__R=t("forearm.R", (X, -30)),
            robe__B=t("robe.B", (X, 30)),
            staff_aim_at_rot=aimed((0.0, -0.25, 1)),
            sparks_at_scale=0.3,
        )

    def hymn(base, swirl=0.0, power=1.0):
        """The left arm thrown up, the head back, the mouth wide: the cast and the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, 0.0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -12), (Z, 6)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -26), (Z, 12)),
            mouth_at_scale=1.25,
            upperarm__L=t("upperarm.L", (X, -150), (Y, 24)),
            forearm__L=t("forearm.L", (X, -16)),
            hand__L=t("hand.L", (X, -20)),
            upperarm__R=t("upperarm.R", (X, -14), (Y, -8)),
            robe__B=t("robe.B", (X, 8)),
            book=t("book", (Y, 14)),
            staff_aim_at_rot=aimed((-0.08, -0.06, 1)),
            glow_at_scale=0.55 * power,
            sparks_at_scale=1.0 * power,
            sparks=t("sparks", (Z, swirl)),
        )

    def step(front):
        """A happy walk, the staff upright. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(sing=0.8),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            hips=t("hips", (Z, 6 * front), (Y, 4 * front)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (Z, -6 * front)),
            head=t("head", (X, -14), (Y, -6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -28)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 14)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 20)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "upperarm__L": t("upperarm.L", (X, -20 * front), (Y, 10)),
                "upperarm__R": t("upperarm.R", (X, -36 + 10 * front)),
                "robe__B": t("robe.B", (X, 8), (Y, 6 * front)),
                "book": t("book", (X, 20 * front)),
                "staff_aim_at_rot": aimed((0.0, 0.1 * front, 1)),
            },
        )

    def passing(lifted):
        """One foot passes the other, up on the toes. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(sing=1.0),
            hips_at_loc=at("hips", (0, 0, 0.008)),
            spine=t("spine", (X, 2)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -24)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 46)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -12)),
                "robe__B": t("robe.B", (X, 4)),
                "book": t("book", (X, 0)),
            },
        )

    # The attack: she lifts the staff and points the sun disc at the foe. The
    # Holy light leaves at 20% of the attack (`FLIGHT_START` in fx.ts), so the
    # disc flares at frame 6 of 30.
    def point(base, flare=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.02, -0.02)),
            hips=t("hips", (Z, -6)),
            spine=t("spine", (X, 8)),
            chest=t("chest", (X, 4), (Z, -8)),
            head=t("head", (X, -8), (Z, 14)),
            mouth_at_scale=1.1,
            upperarm__R=t("upperarm.R", (X, -60)),
            forearm__R=t("forearm.R", (X, -8)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 30)),
            forearm__L=t("forearm.L", (X, -40)),
            thigh__L=t("thigh.L", (X, -22), (Y, -4)),
            shin__L=t("shin.L", (X, 14)),
            thigh__R=t("thigh.R", (X, 10), (Y, 4)),
            foot__R=t("foot.R", (X, -16)),
            robe__B=t("robe.B", (X, 10)),
            staff_aim_at_rot=aimed((0.0, -1, 0.75)),
            glow_at_scale=flare,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, sing in ((0, 0, 0, 0.4), (12, 0.5, 1, 1), (24, 1, 0, 0.5), (36, 0.5, -1, 1), (48, 0, 0, 0.4)):
        idle.key(frame, stand(breath, sway, sing))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, tired(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, point(stand(), 0.3)).key(6, point(stand(), 1.15)).key(10, point(stand(), 0.6))
    attack.key(18, point(stand(), 0.0)).key(26, stand()).key(30, stand())
    clips.append(attack)

    # Regenerate: the hymn and the turning sparks.
    cast = Clip("cast", 24)
    cast.key(0, stand()).key(5, hymn(stand(), 0, 0.4)).key(12, hymn(stand(), 60)).key(18, hymn(stand(), 120))
    cast.key(24, hymn(stand(), 180, 0.0))
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
    rebirth.key(32, kneel(stand())).key(41, hymn(stand(), 90, 0.6)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, kneel(stand())).key(9, pose(kneel(stand()), hips_at_loc=at("hips", (0, 0.02, -0.18))))
    summon.key(17, hymn(stand(), 90, 0.6)).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "dawn-cleric.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
