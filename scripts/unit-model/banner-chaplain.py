"""
Banner Chaplain (`human.bannerChaplain`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a stout, loud man chaplain with
curly grey-brown hair and a full beard, a long white robe with a blue stole
with gold suns, a gold trim, a leather belt with a brass bell, a long speech
scroll in the left hand that trails on the ground, and a banner-staff in the
right hand: a gold sun disc on top and a blue banner below it. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/banner-chaplain.glb`; then
`bun unit-model:pack banner-chaplain` packs it for the game.

The banner-staff is in the right hand, on the camera side. The face of the
sun disc turns to the camera, and the banner hangs in the plane of the staff
and his front, so the camera sees its face. He gives a speech all the time:
his mouth is open (the mouth bone scales). He attacks at Mid Range: he
thrusts the banner at the foe, and the sun disc flares (the glow bone scales)
when the Holy light leaves, at 20% of the attack. His cast (Rally) lifts the
banner high and waves it, and the bell at his belt rings.
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

SKIN = hex_color("#dca07c")
CHEEK = hex_color("#d4846c")
HAIR = hex_color("#7a6656")
HAIR_LIGHT = hex_color("#a08a76")
EYES = hex_color("#22180f")
MOUTH = hex_color("#6a2420")
WHITE = hex_color("#f2ecdc")
WHITE_SHADE = hex_color("#d8cfba")
BLUE = hex_color("#2a4a9c")
BLUE_DARK = hex_color("#1c326c")
GOLD = hex_color("#e2b046")
GOLD_DARK = hex_color("#a37a2a")
BRASS = hex_color("#cf9a3e")
LEATHER = hex_color("#6e4428")
LEATHER_DARK = hex_color("#46291a")
PAPER = hex_color("#efe3c4")
PAPER_SHADE = hex_color("#d6c59e")
INK = hex_color("#6a5a48")
SHAFT = hex_color("#5e3c22")
GLOW = hex_color("#fff1b0")
SPARK = hex_color("#ffd65a")

# --- Proportions ---------------------------------------------------------------

# A stout figure with a broad chest.
HIP_Z = 0.45
WAIST_Z = 0.53
CHEST_Z = 0.62
SHOULDER_Z = 0.715
NECK_Z = 0.745
HEAD_C = Vector((0, -0.008, 0.862))
KNEE_Z = 0.26
ANKLE_Z = 0.05
LEG_X = 0.06
MOUTH_C = HEAD_C + Vector((0, -0.07, -0.03))

# The right forearm points forward and holds the banner-staff upright. The
# left arm hangs in an A-pose with the scroll. These are the rest (bind)
# positions.
SR = Vector((-0.135, 0, SHOULDER_Z))
ER = Vector((-0.18, 0.03, 0.58))
WR = Vector((-0.175, -0.1, 0.57))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.026
SL = Vector((0.135, 0, SHOULDER_Z))
ARM_DIR = Vector((math.sin(math.radians(24)), -0.12, -math.cos(math.radians(24)))).normalized()
EL = SL + ARM_DIR * 0.15
WL = EL + ARM_DIR * 0.14
TL = WL + ARM_DIR * 0.05
HAND_L = WL + ARM_DIR * 0.026

STAFF_BOTTOM = 0.02
DISC = Vector((HAND_R.x, HAND_R.y, 1.19))
DISC_R = 0.055
# The crossbar of the banner, and the cloth that hangs from it, to the front.
BAR_Z = 1.105
FLAG_LENGTH = 0.17
FLAG_DROP = 0.24

BELL = Vector((-0.07, -0.088, 0.49))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.785), "chest"),
    ("head", (0, 0, 0.785), (0, 0, 0.965), "neck"),
    ("mouth", tuple(MOUTH_C), tuple(MOUTH_C + Vector((0, -0.03, 0))), "head"),
    ("robe.B", (0, 0.1, 0.45), (0, 0.14, 0.08), "hips"),
    ("bell", tuple(BELL), tuple(BELL - Vector((0, 0, 0.05))), "hips"),
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
    ("flag", (HAND_R.x, HAND_R.y, BAR_Z), (HAND_R.x, HAND_R.y - FLAG_LENGTH, BAR_Z), "staff"),
    # The Holy light of the sun disc: scale 0 hides it.
    ("glow", tuple(DISC), tuple(DISC + Z * 0.05), "staff"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.49, 0.57)
    return blend("spine", "chest", co.z, 0.59, 0.66)


def scroll_weights(co):
    """The sheet of the scroll stays on the ground at its foot, and follows the hand at its top."""
    return blend("root", "hand.L", co.z, 0.05, HAND_L.z - 0.06)


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
    kit.sphere(head.bm, HEAD_C, (0.068, 0.07, 0.08), 14, 10)
    # A big round nose.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.072, 0.002)), (0.016, 0.014, 0.016), 6, 5)
    for sign in (1, -1):
        kit.sphere(head.bm, HEAD_C + Vector((0.066 * sign, 0.006, -0.002)), (0.012, 0.016, 0.02), 6, 4)
        cheek = kit.sphere(head.bm, HEAD_C + Vector((0.04 * sign, -0.056, -0.006)), (0.016, 0.01, 0.012), 6, 4)
        head.paint(faces_of(cheek), CHEEK)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.026 * sign, -0.062, 0.018)), (0.009, 0.007, 0.01), 8, 6)
    parts.append(eyes)

    # The open mouth of the speaker, inside the beard.
    mouth = Part("mouth", MOUTH, "mouth", shade=0)
    kit.sphere(mouth.bm, MOUTH_C, (0.02, 0.012, 0.016), 8, 6)
    parts.append(mouth)

    # Curly grey-brown hair round the back and the sides, bushy raised brows,
    # a moustache and a full beard.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.012, 0.01)), (0.074, 0.076, 0.084), 14, 10)
    face = [v for v in verts if v.co.y < -0.02 or v.co.z < HEAD_C.z - 0.03]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    for index in range(7):
        a = math.radians(-100 + index * 33)
        c = HEAD_C + Vector((0.074 * math.sin(a), 0.06 * math.cos(a) + 0.012, 0.046 - 0.012 * (index % 2)))
        curl = kit.sphere(hair.bm, c, (0.022, 0.02, 0.022), 6, 5)
        hair.paint(faces_of(curl), HAIR_LIGHT if index % 2 else HAIR)
    for sign in (1, -1):
        brow = kit.slab(hair.bm, HEAD_C + Vector((0.027 * sign, -0.064, 0.04)), (0.018, 0, 0.006 * sign), (0, 0.006, 0), (0, 0, 0.006))
        hair.paint(faces_of(brow), HAIR_LIGHT)
        tash = kit.cone(hair.bm, HEAD_C + Vector((0.004 * sign, -0.078, -0.016)), HEAD_C + Vector((0.042 * sign, -0.068, -0.03)), 0.011, 0.004, 6)
        hair.paint(faces_of(tash), HAIR_LIGHT)
    parts.append(hair)

    beard = Part("beard", HAIR, "head", shade=0.1)
    verts = kit.sphere(beard.bm, HEAD_C + Vector((0, -0.032, -0.06)), (0.064, 0.05, 0.06), 12, 8)
    # Open the beard at the mouth.
    kit.bmesh.ops.delete(beard.bm, geom=[v for v in verts if v.co.y < -0.06 and v.co.z > MOUTH_C.z - 0.012 and abs(v.co.x) < 0.024], context="VERTS")
    tip = kit.cone(beard.bm, HEAD_C + Vector((0, -0.05, -0.09)), HEAD_C + Vector((0, -0.05, -0.135)), 0.03, 0.006, 8)
    beard.paint(faces_of(tip), HAIR_LIGHT)
    for f in faces_of([v for v in verts if v.is_valid]):
        if int(f.calc_center_median().x * 120) % 3 == 0:
            beard.paint([f], HAIR_LIGHT)
    parts.append(beard)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, NECK_Z - 0.01), (0, 0, 0.8), 0.032, 0.03, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The robe over the broad, round chest.
    body = Part("body", WHITE, torso_weights, shade=0.12)
    kit.cone(body.bm, (0, 0, 0.47), (0, 0, 0.73), 0.108, 0.1, 14, squash=0.82)
    kit.sphere(body.bm, (0, -0.014, 0.6), (0.112, 0.092, 0.095), 12, 8)
    parts.append(body)

    # The blue stole: two bands from the neck down the front, with gold suns.
    stole = Part("stole", BLUE, torso_weights, shade=0.08)
    for sign in (1, -1):
        kit.tube(stole.bm, [(0.05 * sign, -0.02, 0.75), (0.044 * sign, -0.086, 0.68), (0.04 * sign, -0.102, 0.58), (0.042 * sign, -0.094, 0.5)], [0.016, 0.017, 0.017, 0.016], 4)
        sun(stole, (0.042 * sign, -0.112, 0.6), (0, -1, 0.1), 0.02, GOLD)
    parts.append(stole)

    collar = Part("collar", BLUE_DARK, "chest", shade=0.06)
    verts = kit.cone(collar.bm, (0, 0.004, 0.7), (0, 0.006, 0.765), 0.108, 0.052, 14, caps=False, squash=0.82)
    collar.paint({f for v in verts if v.co.z < 0.71 for f in v.link_faces}, GOLD)
    parts.append(collar)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.525), 0.108, 0.107, 14, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.09, 0.507), (0.03, 0.01, 0.026))
    belt.paint(faces_of(buckle), GOLD)
    pouch = kit.box(belt.bm, (0.08, -0.05, 0.47), (0.03, 0.03, 0.044))
    belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    # A brass bell on a short strap, at the right front, on the camera side.
    bell = Part("bell", BRASS, "bell", shade=0.08)
    kit.cone(bell.bm, BELL, BELL - Vector((0, 0, 0.018)), 0.004, 0.004, 4)
    kit.cone(bell.bm, BELL - Vector((0, 0, 0.018)), BELL - Vector((0, 0, 0.06)), 0.012, 0.026, 10)
    lip = kit.torus(bell.bm, BELL - Vector((0, 0, 0.06)), (0, 0, 1), 0.026, 0.004, 10, 3)
    bell.paint(faces_of(lip), GOLD_DARK)
    clapper = kit.sphere(bell.bm, BELL - Vector((0, 0, 0.066)), (0.007, 0.007, 0.007), 5, 4)
    bell.paint(faces_of(clapper), GOLD_DARK)
    parts.append(bell)

    def robe_color(row, column):
        if row == 6:
            return GOLD
        if column in (1, 14):
            return BLUE
        if row == 5 and column in (0, 15):
            return GOLD
        return WHITE if column % 4 else WHITE_SHADE

    robe = Part("robe", WHITE, robe_weights, shade=0.14)
    kit.ragged_cone(robe, 0.5, 0.045, 0.108, 0.17, 16, 7, 0.86, 0.006, robe_color, WHITE_SHADE, y_push=0.03)
    for sign in (1, -1):
        sun(robe, (0.052 * sign, -0.152, 0.22), (0.25 * sign, -1, 0.15), 0.024, GOLD)
    parts.append(robe)
    return parts


def ribbon(part, points, width, normal_hint, color_of):
    """A flat strip along a polyline, as a thin closed panel."""
    points = [Vector(p) for p in points]
    front, back = [], []
    for index, point in enumerate(points):
        ahead = points[min(index + 1, len(points) - 1)]
        behind = points[max(index - 1, 0)]
        direction = (ahead - behind).normalized()
        across = direction.cross(Vector(normal_hint)).normalized() * (width / 2)
        normal = across.cross(direction).normalized() * 0.002
        front.append([point - across + normal, point + across + normal])
        back.append([point - across - normal, point + across - normal])
    return panel(part, front, back, color_of)


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        shoulder = Part(f"shoulder.{side}", WHITE, f"upperarm.{side}", shade=0.1)
        kit.sphere(shoulder.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.04, 0.04, 0.036), 10, 7)
        parts.append(shoulder)

        sleeve = Part(f"sleeve.{side}", WHITE, f"upperarm.{side}", shade=0.08)
        kit.cone(sleeve.bm, s, e, 0.034, 0.032, 8)
        parts.append(sleeve)

        bell = Part(f"cuff.{side}", WHITE, f"forearm.{side}", shade=0.1)
        kit.cone(bell.bm, e - d * 0.01, w - d * 0.01, 0.033, 0.05, 8)
        cuff = kit.cone(bell.bm, w - d * 0.035, w + d * 0.004, 0.047, 0.054, 8)
        bell.paint(faces_of(cuff), BLUE)
        rim = kit.torus(bell.bm, w + d * 0.004, d, 0.053, 0.004, 10, 3)
        bell.paint(faces_of(rim), GOLD)
        parts.append(bell)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.026, (0.021, 0.019, 0.026), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        leg = Part(f"leg.{side}", WHITE_SHADE, f"thigh.{side}")
        kit.cone(leg.bm, hip, knee, 0.044, 0.035, 8)
        parts.append(leg)
        boot = Part(f"boot.{side}", LEATHER, f"shin.{side}")
        kit.cone(boot.bm, knee, ankle, 0.035, 0.032, 8)
        parts.append(boot)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.024), (0.058, 0.108, 0.048))
        sole = kit.box(foot.bm, (LEG_X * sign, -0.03, 0.006), (0.06, 0.11, 0.012))
        foot.paint(faces_of(sole), LEATHER_DARK)
        parts.append(foot)

    # The speech scroll: rolled up in the left hand, and the long sheet that
    # falls from it and crosses the ground. The sheet stretches between the
    # hand and the ground (`scroll_weights`).
    scroll = Part("scroll", PAPER, scroll_weights, shade=0.06)
    roll = kit.cone(scroll.bm, HAND_L + Vector((0, 0.03, 0.01)), HAND_L + Vector((0, -0.04, 0.01)), 0.014, 0.014, 8)
    scroll.paint(faces_of(roll), PAPER_SHADE)
    sheet_path = [
        HAND_L + Vector((0.004, -0.004, -0.004)),
        HAND_L + Vector((0.02, -0.02, -0.12)),
        HAND_L + Vector((0.03, -0.03, -0.25)),
        Vector((HAND_L.x + 0.035, HAND_L.y - 0.06, 0.06)),
        Vector((HAND_L.x + 0.035, HAND_L.y - 0.12, 0.008)),
        Vector((HAND_L.x + 0.02, HAND_L.y - 0.24, 0.006)),
        Vector((HAND_L.x - 0.01, HAND_L.y - 0.32, 0.012)),
    ]

    def paper_color(face_side, row, column):
        return INK if face_side == "front" and row % 2 == 1 and row < 5 else PAPER

    ribbon(scroll, sheet_path, 0.06, (0, -1, 0.3), paper_color)
    end = kit.cone(scroll.bm, sheet_path[-1] + Vector((-0.03, 0, 0.008)), sheet_path[-1] + Vector((0.03, 0, 0.008)), 0.008, 0.008, 6)
    scroll.paint(faces_of(end), PAPER_SHADE)
    parts.append(scroll)
    return parts


def staff_parts():
    parts = []
    hx, hy = HAND_R.x, HAND_R.y
    staff = Part("staff", SHAFT, "staff", shade=0.04)
    bottom = Vector((hx, hy, STAFF_BOTTOM))
    kit.cone(staff.bm, bottom, DISC - Z * DISC_R * 0.6, 0.011, 0.012, 6)
    foot = kit.cone(staff.bm, bottom - Z * 0.005, bottom + Z * 0.03, 0.013, 0.013, 6)
    staff.paint(faces_of(foot), GOLD_DARK)
    for z in (0.3, 0.75):
        band = kit.cone(staff.bm, (hx, hy, z), (hx, hy, z + 0.02), 0.014, 0.014, 6)
        staff.paint(faces_of(band), GOLD)
    # Gold tassels under the disc.
    for sign in (1, -1):
        tassel = kit.cone(staff.bm, DISC + Vector((0, 0.05 * sign, -DISC_R * 0.8)), DISC + Vector((0, 0.06 * sign, -DISC_R * 0.8 - 0.06)), 0.004, 0.012, 6)
        staff.paint(faces_of(tassel), GOLD)

    # The sun disc: its face turns to the side, to the camera.
    ring = kit.torus(staff.bm, DISC, (1, 0, 0), DISC_R, 0.008, 18, 4)
    staff.paint(faces_of(ring), GOLD)
    inner = kit.cone(staff.bm, DISC - X * 0.006, DISC + X * 0.006, DISC_R * 0.62, DISC_R * 0.62, 12)
    staff.paint(faces_of(inner), hex_color("#ffd877"))
    for index in range(12):
        a = 2 * math.pi * index / 12
        out = Vector((0, math.cos(a), math.sin(a)))
        long = index % 2 == 0
        ray = kit.cone(staff.bm, DISC + out * DISC_R * 0.95, DISC + out * DISC_R * (1.5 if long else 1.28), 0.009, 0.001, 4, squash=0.5)
        staff.paint(faces_of(ray), GOLD if long else GOLD_DARK)
    parts.append(staff)

    # The crossbar and the banner turn around the staff together (the flag bone).
    flag = Part("flag", BLUE, "flag", shade=0.1)
    bar = kit.cone(flag.bm, (hx, hy + 0.02, BAR_Z), (hx, hy - FLAG_LENGTH - 0.02, BAR_Z), 0.007, 0.007, 6)
    flag.paint(faces_of(bar), GOLD_DARK)
    for end in (hy + 0.02, hy - FLAG_LENGTH - 0.02):
        knob = kit.sphere(flag.bm, (hx, end, BAR_Z), (0.011, 0.011, 0.011), 6, 4)
        flag.paint(faces_of(knob), GOLD)
    columns, rows = 6, 7

    def grid(offset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = column / columns
                # A pointed hem: the middle hangs lowest.
                point = 0.06 * (1 - abs(u - 0.5) * 2) * v
                z = BAR_Z - 0.01 - FLAG_DROP * v - point
                ripple = 0.01 * math.sin(u * math.pi * 2 + v * 2)
                line.append((hx + offset + ripple, hy - 0.01 - FLAG_LENGTH * u, z))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if row in (0, rows - 1) or column in (0, columns - 1):
            return GOLD
        return BLUE

    edges = panel(flag, grid(-0.004), grid(0.004), color_of)
    flag.paint(edges, GOLD)
    center = Vector((hx, hy - 0.01 - FLAG_LENGTH / 2, BAR_Z - 0.13))
    for sign in (1, -1):
        sun(flag, center + Vector((-0.008 * sign, 0, 0)), (-sign, 0, 0), 0.07, GOLD)
    # Two streamers from the ends of the bar.
    for end, sway in ((hy + 0.02, 0.03), (hy - FLAG_LENGTH - 0.02, -0.03)):
        streamer = kit.tube(flag.bm, [(hx, end, BAR_Z), (hx + 0.01, end + sway, BAR_Z - 0.1), (hx + 0.02, end + sway * 2, BAR_Z - 0.2)], [0.006, 0.005, 0.002], 4)
        flag.paint(faces_of(streamer), WHITE)
    parts.append(flag)

    glow = Part("glow", GLOW, "glow", shade=0)
    kit.sphere(glow.bm, DISC, (0.024, 0.065, 0.065), 10, 8)
    for index in range(8):
        a = 2 * math.pi * index / 8 + 0.2
        out = Vector((0, math.cos(a), math.sin(a)))
        flare = kit.cone(glow.bm, DISC + out * 0.055, DISC + out * 0.15, 0.02, 0.001, 4, squash=0.4)
        glow.paint(faces_of(flare), SPARK)
    parts.append(glow)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BannerChaplain", BONES)
    parts = head_parts() + body_parts() + limb_parts() + staff_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BannerChaplainMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """The banner-staff aims with `Aim`, so it stays upright when the arm moves."""
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

    def stand(breath=0.0, sway=0.0, talk=0.5):
        """He preaches: the chest out, the banner upright, the scroll hand up a little."""
        return {
            "hips@loc": at("hips", (0, 0, -0.006 - breath * 0.004)),
            "hips": t("hips", (Y, sway * 2)),
            "spine": t("spine", (X, -2 + breath), (Y, sway * 2)),
            "chest": t("chest", (X, -6 - breath * 3), (Z, 4 + sway * 4)),
            "neck": t("neck", (X, -4)),
            "head": t("head", (X, -6 - talk * 6), (Y, -sway * 5), (Z, 8)),
            "mouth@scale": 0.6 + talk * 0.5,
            "upperarm.L": t("upperarm.L", (X, -14 - talk * 10), (Y, 4)),
            "forearm.L": t("forearm.L", (X, -20 - talk * 16)),
            "hand.L": t("hand.L", (X, 14 + talk * 12)),
            # The banner stands forward, in front of the line of his face.
            "upperarm.R": t("upperarm.R", (X, -36 - breath * 2)),
            "thigh.L": t("thigh.L", (X, -8), (Y, -4)),
            "shin.L": t("shin.L", (X, 4)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 4)),
            "foot.R": t("foot.R", (X, -6)),
            "robe.B": t("robe.B", (X, 2 + breath * 2), (Y, sway * 3)),
            "bell": t("bell", (Y, -sway * 6)),
            "staff/Aim": 1.0,
            "staff_aim@rot": aimed((0.0, -0.02 + breath * 0.01, 1)),
            "flag": t("flag", (Z, sway * 8)),
            "glow@scale": 0.0,
        }

    def tired(breath=0.0):
        """Low HP: bent, he leans on the banner-staff, the mouth small, the scroll hangs."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.04)),
            spine=t("spine", (X, 20 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 3)),
            neck=t("neck", (X, 4)),
            head=t("head", (X, 12 + breath * 4), (Y, -8)),
            mouth_at_scale=0.35,
            upperarm__L=t("upperarm.L", (X, 4), (Y, -4)),
            forearm__L=t("forearm.L", (X, -6)),
            hand__L=t("hand.L", (X, 0)),
            upperarm__R=t("upperarm.R", (X, -12)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 18)),
            thigh__R=t("thigh.R", (X, -6), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, -8)),
            robe__B=t("robe.B", (X, -4)),
            bell=t("bell", (X, -10)),
            staff_aim_at_rot=aimed((0.03, -0.14, 1)),
            flag=t("flag", (Z, -14)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the speech stops."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012)),
            spine=t("spine", (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, -6 * amount)),
            head=t("head", (X, -18 * amount), (Z, -8 * amount)),
            mouth_at_scale=lerp(0.9, 1.3, amount),
            upperarm__L=t("upperarm.L", (Y, 24 * amount), (X, 10 * amount)),
            forearm__L=t("forearm.L", (X, -40 * amount)),
            robe__B=t("robe.B", (X, 10 * amount)),
            bell=t("bell", (X, -30 * amount)),
            staff_aim_at_rot=aimed((0.0, 0.2 * amount, 1)),
            flag=t("flag", (Z, 20 * amount)),
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
            bell=t("bell", (X, 30)),
            staff_aim_at_rot=aimed((0.2, -0.6, 1)),
            flag=t("flag", (Z, -20)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the arms out, the banner flat beside him."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.15)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Y, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0), (Z, 0)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -26)),
            mouth_at_scale=0.3,
            upperarm__L=t("upperarm.L", (Y, -40), (X, 20)),
            forearm__L=t("forearm.L", (X, -20)),
            hand__L=t("hand.L", (X, 0)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, -20)),
            forearm__R=t("forearm.R", (X, 20)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 20)),
            robe__B=t("robe.B", (X, -40)),
            bell=t("bell", (X, -80)),
            staff_aim_at_rot=aimed((0.2, -1, -0.02)),
            flag=t("flag", (Z, 0)),
        )

    def kneel(base):
        """On one knee, the head down, the banner upright: as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.15)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 6)),
            head=t("head", (X, 16)),
            mouth_at_scale=0.3,
            thigh__L=t("thigh.L", (X, -70), (Y, -4)),
            shin__L=t("shin.L", (X, 90)),
            foot__L=t("foot.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -10), (Y, 4)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -44)),
            upperarm__R=t("upperarm.R", (X, -86)),
            forearm__R=t("forearm.R", (X, -30)),
            robe__B=t("robe.B", (X, 30)),
            staff_aim_at_rot=aimed((0.0, -0.25, 1)),
            flag=t("flag", (Z, -10)),
        )

    def rally(base, wave=0.0, power=1.0):
        """The banner high and waving, the bell ringing, the mouth wide: the cast and the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.0, 0.0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -12), (Z, 8)),
            neck=t("neck", (X, -8)),
            head=t("head", (X, -20), (Z, 14)),
            mouth_at_scale=1.35,
            upperarm__R=t("upperarm.R", (X, -140), (Y, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 0)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 30)),
            forearm__L=t("forearm.L", (X, -30)),
            hand__L=t("hand.L", (X, 30)),
            robe__B=t("robe.B", (X, 8)),
            bell=t("bell", (X, 40 * wave), (Y, 20 * wave)),
            staff_aim_at_rot=aimed((-0.1 * wave, -0.25 * wave, 1)),
            flag=t("flag", (Z, 34 * wave)),
            glow_at_scale=0.6 * power,
        )

    def step(front):
        """A proud march, the banner upright. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(talk=0.8),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            hips=t("hips", (Z, 6 * front), (Y, 4 * front)),
            spine=t("spine", (X, 0)),
            chest=t("chest", (X, -8), (Z, -6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -28)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 14)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 20)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "robe__B": t("robe.B", (X, 8), (Y, 6 * front)),
                "bell": t("bell", (X, 26 * front)),
                "staff_aim_at_rot": aimed((0.0, 0.1 * front, 1)),
                "flag": t("flag", (Z, 14 + 6 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(talk=1.0),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -24)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 46)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "robe__B": t("robe.B", (X, 4)),
                "bell": t("bell", (X, 0)),
                "flag": t("flag", (Z, 18)),
            },
        )

    # The attack: he thrusts the banner at the foe. The Holy light leaves at
    # 20% of the attack (`FLIGHT_START` in fx.ts), so the disc flares at
    # frame 6 of 30.
    def thrust(base, flare=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.03, -0.02)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, 8)),
            chest=t("chest", (X, 4), (Z, -8)),
            head=t("head", (X, -8), (Z, 14)),
            mouth_at_scale=1.3,
            upperarm__R=t("upperarm.R", (X, -64)),
            forearm__R=t("forearm.R", (X, -6)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 26)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -26), (Y, -4)),
            shin__L=t("shin.L", (X, 16)),
            thigh__R=t("thigh.R", (X, 12), (Y, 4)),
            foot__R=t("foot.R", (X, -18)),
            robe__B=t("robe.B", (X, 12)),
            bell=t("bell", (X, 30)),
            staff_aim_at_rot=aimed((0.0, -1, 0.8)),
            flag=t("flag", (Z, 30)),
            glow_at_scale=flare,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, talk in ((0, 0, 0, 0.3), (12, 0.5, 1, 1), (24, 1, 0, 0.4), (36, 0.5, -1, 1), (48, 0, 0, 0.3)):
        idle.key(frame, stand(breath, sway, talk))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, tired(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, thrust(stand(), 0.3)).key(6, thrust(stand(), 1.1)).key(10, thrust(stand(), 0.6))
    attack.key(18, thrust(stand(), 0.0)).key(26, stand()).key(30, stand())
    clips.append(attack)

    # Rally: the banner waves left and right, and the bell rings.
    cast = Clip("cast", 24)
    cast.key(0, stand()).key(5, rally(stand(), 1, 0.4)).key(10, rally(stand(), -1)).key(15, rally(stand(), 1))
    cast.key(20, rally(stand(), -0.6, 0.5)).key(24, stand())
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
    rebirth.key(32, kneel(stand())).key(41, rally(stand(), 0.5, 0.5)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, kneel(stand())).key(9, pose(kneel(stand()), hips_at_loc=at("hips", (0, 0.02, -0.17))))
    summon.key(17, rally(stand(), 0.5, 0.5)).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "banner-chaplain.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
