"""
Rime-Eye Reaper (`undead.rimeEyeReaper`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a skeletal woman reaper with long
grey hair, a silver circlet with pale teal stones, one dark, closed socket and
one eye that glows with frost, a frozen moth that rests over that eye, a
rusty scale vest with a silver-teal clasp, a ragged dark teal cloak and a
grey skirt with frost on the hems, and a grave scythe with ice on the blade.
Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/rime-eye-reaper.glb`; then
`bun unit-model:pack rime-eye-reaper` packs it for the game.

The frost eye and the moth are on her right side, on the camera side. She
holds the scythe low in front of her, the blade down near the ground: the
right hand drives it with IK, the scythe aims with a Copy Rotation, and the
left hand stays on the snath with IK to a grip bone. The blade is flat in the
plane of the snath and the up axis, so the camera sees its face. Her attack
is a low sweep with the right hand: the left hand lets go, and the blade goes
from behind her, round her right side, to the front. A burst of ice on the
blade (a bone that scales) flares at the hit. She has no Keyword that she
uses by her own action, so she has no cast clip.
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

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
HAIR = hex_color("#bdb8ad")
HAIR_DARK = hex_color("#8c877d")
SILVER = hex_color("#c9c7bd")
GEM = hex_color("#7fd0cc")
RUST = hex_color("#8a5a36")
RUST_DARK = hex_color("#5e3c24")
TEAL = hex_color("#4d6e6b")
TEAL_DARK = hex_color("#304644")
CLOTH = hex_color("#7d7468")
CLOTH_DARK = hex_color("#5a5249")
WRAP = hex_color("#9a8f7c")
LEATHER = hex_color("#5a3a22")
LEATHER_DARK = hex_color("#3c2616")
WOOD = hex_color("#6b4a30")
WOOD_DARK = hex_color("#4a3220")
STEEL = hex_color("#a7aaa8")
STEEL_DARK = hex_color("#6e7272")
ICE = hex_color("#d2f3ff")
ICE_DEEP = hex_color("#86d0f0")
MOTH = hex_color("#cfe9f2")
MOTH_DARK = hex_color("#7fa9bc")

# --- Proportions ---------------------------------------------------------------

# A tall, slender figure.
HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.63
SHOULDER_Z = 0.715
NECK_Z = 0.74
HEAD_C = Vector((0, -0.008, 0.845))
KNEE_Z = 0.27
ANKLE_Z = 0.055
LEG_X = 0.05
UPPER_ARM = 0.17
FOREARM = 0.16


def bend(shoulder, wrist, out):
    """The elbow between `shoulder` and `wrist`, bent toward `out`."""
    d = wrist - shoulder
    length = d.length
    along = (UPPER_ARM**2 - FOREARM**2 + length**2) / (2 * length)
    height = math.sqrt(max(UPPER_ARM**2 - along**2, 0.0))
    side = Vector(out) - d.normalized() * Vector(out).dot(d.normalized())
    return shoulder + d.normalized() * along + side.normalized() * height


# The right hand holds the end of the snath at the right hip, and the snath
# goes forward and a little down. The left hand holds it in front. These are
# the rest (bind) positions.
SCYTHE = Vector((0.0, -1, -0.2)).normalized()
SR = Vector((-0.11, 0, SHOULDER_Z))
WR = Vector((-0.07, 0.04, 0.52))
ER = bend(SR, WR, (-1, 0.5, 0))
DR = (WR - ER).normalized()
TR = WR + DR * 0.04
GRIP_R = WR + DR * 0.02
FRONT_GRIP = 0.12
GRIP_L = GRIP_R + SCYTHE * FRONT_GRIP
SL = Vector((0.11, 0, SHOULDER_Z))
WL = GRIP_L
EL = bend(SL, WL, (1, 0.3, -0.5))
TL = WL + (WL - EL).normalized() * 0.04
SNATH_BACK = 0.08
SNATH_FRONT = 0.56
SCYTHE_SIDE = SCYTHE.cross(Z).normalized()
SCYTHE_DOWN = SCYTHE_SIDE.cross(SCYTHE).normalized()
if SCYTHE_DOWN.z > 0:
    SCYTHE_DOWN = -SCYTHE_DOWN
TIP = GRIP_R + SCYTHE * SNATH_FRONT


def blade_point(u, across=0.0):
    """A point on the spine of the blade: `u` 0 at the snath to 1 at the point, `across` toward the edge."""
    spine = TIP + SCYTHE_DOWN * (0.3 * u) - SCYTHE * (0.03 * u + 0.13 * u * u) + SCYTHE * 0.012
    return spine - SCYTHE * across


FROST = blade_point(0.55, 0.02)

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.78), "chest"),
    ("head", (0, 0, 0.78), (0, 0, 0.95), "neck"),
    ("jaw", (0, -0.01, 0.81), (0, -0.065, 0.79), "head"),
    ("hair", (0, 0.05, 0.82), (0, 0.07, 0.62), "head"),
    ("cloak", (0, 0.08, 0.7), (0, 0.13, 0.25), "chest"),
    ("skirt.B", (0, 0.07, 0.46), (0, 0.1, 0.22), "hips"),
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
    ("scythe", tuple(GRIP_R), tuple(GRIP_R + SCYTHE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + SCYTHE * 0.05), "scythe"),
    # The burst of ice on the blade: small at rest, it flares at the hit.
    ("frost", tuple(FROST), tuple(FROST - SCYTHE * 0.06), "scythe"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def skirt_weights(co):
    """The skirt follows the hips at the top, the thighs in front and its back panel behind."""
    t = clamp01((0.47 - co.z) / 0.22)
    back = clamp01((co.y - 0.0) / 0.08)
    side = co.x / 0.1
    return {
        "hips": 1 - t,
        "skirt.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.4),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.4),
    }


def cloak_weights(co):
    return blend("cloak", "chest", co.z, 0.58, 0.68)


def hair_weights(co):
    return blend("hair", "head", co.z, 0.76, 0.83)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    # A narrow skull with high cheekbones.
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.054, 0.062, 0.066), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.034 * sign, -0.046, -0.02)), (0.017, 0.016, 0.013), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.054, 0.018)), (0.08, 0.012, 0.011))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    # The left socket is dark and narrow, as a closed eye. The right socket is
    # wide open, with the frost eye.
    sockets = Part("sockets", SOCKET, "head", shade=0)
    kit.sphere(sockets.bm, HEAD_C + Vector((0.023, -0.052, 0.0)), (0.016, 0.01, 0.009), 8, 5)
    kit.sphere(sockets.bm, HEAD_C + Vector((-0.023, -0.052, 0.002)), (0.019, 0.011, 0.019), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.059, -0.022)), HEAD_C + Vector((0, -0.061, -0.006)), 0.009, 0.002, 4)
    teeth = kit.box(sockets.bm, HEAD_C + Vector((0, -0.054, -0.036)), (0.046, 0.008, 0.01))
    sockets.paint(faces_of(teeth), BONE_DARK)
    parts.append(sockets)

    eye = Part("eye", GLOW, "head", shade=0)
    kit.sphere(eye.bm, HEAD_C + Vector((-0.023, -0.062, 0.002)), (0.011, 0.006, 0.011), 8, 5)
    ring = kit.torus(eye.bm, HEAD_C + Vector((-0.023, -0.06, 0.002)), (0, 1, 0), 0.017, 0.0025, 10, 3)
    eye.paint(faces_of(ring), ICE)
    parts.append(eye)

    # The frozen moth over the frost eye: four pale wings turned to the
    # front and the camera side.
    moth = Part("moth", MOTH, "head", shade=0)
    normal = Vector((-0.5, -0.86, 0.1)).normalized()
    across = Z.cross(normal).normalized()
    up = normal.cross(across).normalized()
    body = HEAD_C + Vector((-0.028, -0.064, 0.024))
    kit.cone(moth.bm, body + up * 0.008, body - up * 0.01, 0.004, 0.002, 4)
    for sign in (1, -1):
        for lift, size, color in ((0.004, 0.015, MOTH), (-0.007, 0.011, MOTH_DARK)):
            center = body + across * (sign * size * 0.75) + up * lift
            wing = kit.slab(moth.bm, center + normal * 0.001, across * size * 0.7 + up * (0.004 * sign * (1 if lift > 0 else -1)), normal * 0.0015, up * size * 0.55)
            moth.paint(faces_of(wing), color)
    parts.append(moth)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.032, 0.79), (0.04, 0.034, 0.02), 10, 6)
    lower = kit.box(jaw.bm, (0, -0.058, 0.8), (0.042, 0.008, 0.01))
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    # Long grey hair from under the circlet, down her back to the shoulder blades.
    hair = Part("hair", HAIR, hair_weights, shade=0.14)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.008, 0.012)), (0.06, 0.067, 0.068), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.y < -0.012 or v.co.z < HEAD_C.z - 0.02], context="VERTS")
    for index in range(7):
        a = math.radians(-80 + index * 160 / 6)
        top = HEAD_C + Vector((0.05 * math.sin(a), 0.045 * math.cos(a) + 0.01, 0.02))
        mid = top + Vector((0.016 * math.sin(a), 0.03, -0.1))
        tip = mid + Vector((0.01 * math.sin(a), 0.02, -0.09 - 0.02 * (index % 2)))
        strand = kit.tube(hair.bm, [top, mid, tip], [0.016, 0.014, 0.003], 5)
        hair.paint(faces_of(strand), HAIR_DARK if index % 2 else HAIR)
    # Two thin locks fall in front of the shoulders, beside the face.
    for sign in (1, -1):
        top = HEAD_C + Vector((0.054 * sign, -0.01, 0.0))
        lock = kit.tube(hair.bm, [top, top + Vector((0.008 * sign, -0.006, -0.07)), top + Vector((0.014 * sign, -0.012, -0.15))], [0.01, 0.008, 0.002], 4)
        hair.paint(faces_of(lock), HAIR_DARK)
    parts.append(hair)

    circlet = Part("circlet", SILVER, "head", shade=0.05)
    kit.torus(circlet.bm, HEAD_C + Vector((0, 0.0, 0.038)), (0, 0.25, 1), 0.058, 0.005, 16, 4)
    for index, a in enumerate((-30, 0, 30)):
        r = math.radians(a)
        stone = kit.sphere(circlet.bm, HEAD_C + Vector((0.058 * math.sin(r), -0.056 * math.cos(r), 0.026)), (0.009, 0.006, 0.01), 6, 4)
        circlet.paint(faces_of(stone), GEM if index != 1 else ICE_DEEP)
    parts.append(circlet)
    return parts


def body_parts():
    parts = []
    neck = Part("vertebrae", BONE_DARK, "neck")
    kit.cone(neck.bm, (0, 0.005, NECK_Z - 0.02), (0, 0.005, 0.8), 0.014, 0.012, 6)
    parts.append(neck)

    # A rusty scale vest, row on row of small plates, with a silver-teal clasp.
    vest = Part("vest", RUST, torso_weights, shade=0.12)
    verts = kit.cone(vest.bm, (0, 0, 0.47), (0, 0, 0.73), 0.07, 0.078, 12, squash=0.76)
    for face in faces_of(verts):
        c = face.calc_center_median()
        if (int(c.z * 90) + int((math.atan2(c.x, -c.y) + 4) * 4)) % 2:
            vest.paint([face], RUST_DARK)
    clasp = kit.cone(vest.bm, (0.026, -0.058, 0.67), (0.03, -0.072, 0.67), 0.018, 0.016, 10)
    vest.paint(faces_of(clasp), SILVER)
    stone = kit.sphere(vest.bm, (0.03, -0.074, 0.67), (0.009, 0.004, 0.009), 6, 4)
    vest.paint(faces_of(stone), GEM)
    parts.append(vest)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.47), (0, 0, 0.5), 0.074, 0.073, 12, squash=0.8)
    for index in range(3):
        link = kit.torus(belt.bm, (-0.03 + 0.03 * index, -0.062, 0.462 - 0.01 * (index % 2)), (0, 1, 0), 0.008, 0.002, 6, 3)
        belt.paint(faces_of(link), SILVER)
    parts.append(belt)

    # A ragged grey skirt with frost on the hem.
    def skirt_color(row, column):
        if row >= 4:
            return ICE if column % 3 == 0 else HAIR
        return CLOTH_DARK if column % 3 == 1 else CLOTH

    skirt = Part("skirt", CLOTH, skirt_weights, shade=0.1)
    kit.ragged_cone(skirt, 0.49, 0.18, 0.074, 0.13, 14, 5, 0.8, 0.07, skirt_color, CLOTH_DARK, gap=math.radians(14))
    parts.append(skirt)

    # A dark teal shawl over the shoulders, and a long cloak with a frosted hem.
    def shawl_color(row, column):
        return TEAL_DARK if column % 3 == 1 else TEAL

    shawl = Part("shawl", TEAL, torso_weights, shade=0.1)
    kit.ragged_cone(shawl, 0.775, 0.6, 0.05, 0.11, 14, 3, 0.85, 0.05, shawl_color, TEAL_DARK, gap=math.radians(34))
    parts.append(shawl)

    def cloak_color(row, column):
        if row >= 5:
            return ICE if column % 2 == 0 else TEAL
        return TEAL if column % 3 == 1 else TEAL_DARK

    cloak = Part("cloak", TEAL_DARK, cloak_weights)
    kit.ragged_cone(cloak, 0.72, 0.1, 0.09, 0.17, 14, 6, 0.75, 0.14, cloak_color, TEAL_DARK, gap=math.radians(100), y_push=0.09)
    parts.append(cloak)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        guard = Part(f"guard.{side}", RUST, f"upperarm.{side}", shade=0.1)
        top = kit.sphere(guard.bm, s + Vector((0.008 * sign, 0, 0.01)), (0.038, 0.038, 0.028), 10, 6)
        guard.paint({f for v in top if v.co.z < s.z - 0.006 for f in v.link_faces}, RUST_DARK)
        parts.append(guard)

        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.014, 0.012, 6)
        elbow = kit.sphere(upper.bm, e, (0.016, 0.016, 0.016), 6, 4)
        upper.paint(faces_of(elbow), BONE_DARK)
        parts.append(upper)

        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.012, 0.011, 6)
        wrap = kit.cone(forearm.bm, e + d * 0.05, w - d * 0.01, 0.02, 0.018, 8)
        forearm.paint(faces_of(wrap), WRAP)
        parts.append(forearm)

        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.016, (0.015, 0.013, 0.017), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.005 * index, -0.004, 0.004 * index))
            finger = kit.cone(hand.bm, w + d * 0.024 + offset, w + d * 0.05 + offset, 0.004, 0.0025, 4)
            hand.paint(faces_of(finger), BONE_DARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.016, 0.014, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.01, 0.004)), (0.02, 0.018, 0.02), 6, 4)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        # Grey wraps on the shins, and pointed boots.
        shin = Part(f"shin.{side}", WRAP, f"shin.{side}", shade=0.12)
        verts = kit.cone(shin.bm, knee - Vector((0, 0, 0.03)), ankle, 0.026, 0.024, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 60) % 2:
                shin.paint([face], CLOTH)
        parts.append(shin)

        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.024, 0.024), (0.046, 0.1, 0.044))
        toe = kit.cone(foot.bm, (LEG_X * sign, -0.07, 0.02), (LEG_X * sign, -0.1, 0.012), 0.022, 0.006, 6, squash=0.6)
        foot.paint(faces_of(toe), LEATHER_DARK)
        parts.append(foot)
    return parts


def scythe_parts():
    scythe = Part("scythe", WOOD, "scythe", shade=0.04)
    butt = GRIP_R - SCYTHE * SNATH_BACK
    kit.tube(scythe.bm, [butt, GRIP_R + SCYTHE * 0.2 + SCYTHE_DOWN * 0.006, TIP], [0.009, 0.01, 0.009], 6)
    cap = kit.cone(scythe.bm, butt - SCYTHE * 0.01, butt + SCYTHE * 0.02, 0.012, 0.011, 6)
    scythe.paint(faces_of(cap), STEEL_DARK)
    for along in (-0.02, FRONT_GRIP - 0.02):
        wrap = kit.cone(scythe.bm, GRIP_R + SCYTHE * along, GRIP_R + SCYTHE * (along + 0.045), 0.011, 0.011, 6)
        scythe.paint(faces_of(wrap), LEATHER_DARK)
    # A frosted band and the socket of the blade at the end of the snath.
    socket = kit.cone(scythe.bm, TIP - SCYTHE * 0.04, TIP + SCYTHE * 0.016, 0.013, 0.012, 6)
    scythe.paint(faces_of(socket), STEEL_DARK)
    frost = kit.cone(scythe.bm, TIP - SCYTHE * 0.12, TIP - SCYTHE * 0.06, 0.012, 0.012, 6)
    scythe.paint(faces_of(frost), ICE)

    # The blade: a long curved blade that hangs from the end of the snath and
    # curves back toward her, with the edge on the inside.
    steps = 6

    def grid(offset):
        rows = []
        for index in range(steps + 1):
            u = index / steps
            width = lerp(0.05, 0.005, u**1.4)
            spine = blade_point(u)
            rows.append([spine + SCYTHE_SIDE * offset, blade_point(u, width * 0.55) + SCYTHE_SIDE * offset, blade_point(u, width) + SCYTHE_SIDE * offset])
        return rows

    def color_of(face_side, row, column):
        if column == 1:
            return ICE if row in (2, 4) else STEEL
        return STEEL_DARK

    edges = panel(scythe, grid(0.003), grid(-0.003), color_of)
    scythe.paint(edges, ICE_DEEP)
    # Small ice crystals that grow from the edge.
    for u, size in ((0.25, 0.03), (0.45, 0.04), (0.7, 0.028)):
        root = blade_point(u, 0.03)
        out = (-SCYTHE + SCYTHE_DOWN * 0.3).normalized()
        crystal = kit.cone(scythe.bm, root, root + out * size, 0.007, 0.001, 4)
        scythe.paint(faces_of(crystal), ICE)

    # The burst of ice that flares at the hit.
    burst = Part("frost", ICE, "frost", shade=0)
    for index in range(7):
        a = 2 * math.pi * index / 7
        out = (-SCYTHE * 0.8 + SCYTHE_DOWN * math.cos(a) + SCYTHE_SIDE * math.sin(a) * 0.9).normalized()
        shard = kit.cone(burst.bm, FROST, FROST + out * (0.07 + 0.025 * (index % 3)), 0.012, 0.001, 4)
        burst.paint(faces_of(shard), ICE if index % 2 else ICE_DEEP)
    return [scythe, burst]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("RimeEyeReaper", BONES)
    parts = head_parts() + body_parts() + limb_parts() + scythe_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "RimeEyeReaperMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the snath, the right hand to drive it. The scythe aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "scythe_aim": kit.add_empty("scythe_aim"),
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
    aim = bones["scythe"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["scythe_aim"]
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

    scythe_rest = rig.data.bones["scythe"].matrix_local.to_quaternion()

    def aimed(direction, roll=0.0):
        """The world rotation of the scythe that points the snath along `direction`. `roll` turns the blade from down (degrees)."""
        direction = Vector(direction).normalized()
        return Quaternion(direction, math.radians(roll)) @ SCYTHE.rotation_difference(direction) @ scythe_rest

    def held(base, hand, direction):
        """The right hand and the scythe by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "scythe_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "scythe_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, tilt=0.0):
        """
        Ready: the left foot forward, the body low and leaning in, the scythe
        low in front with the blade near the ground. `tilt` cocks her head,
        so the frost eye looks at the camera.
        """
        return held(
            {
                "hips@loc": at("hips", (0, 0, -0.02 - breath * 0.004)),
                "hips": t("hips", (Z, 6)),
                "spine": t("spine", (Z, -2), (X, 8 + breath)),
                "chest": t("chest", (Z, -4), (X, 2 - breath * 2)),
                "neck": t("neck", (Z, -6 - tilt * 10), (X, -4)),
                "head": t("head", (Z, -8 - tilt * 14), (X, -6 + breath * 2), (Y, -8 - tilt * 10)),
                "jaw": t("jaw", (X, 3 + breath * 4)),
                "hair": t("hair", (X, -4 - breath * 3), (Y, tilt * 6)),
                "cloak": t("cloak", (X, 6 + breath * 3)),
                "skirt.B": t("skirt.B", (X, 4)),
                "thigh.L": t("thigh.L", (X, -22), (Y, -6)),
                "shin.L": t("shin.L", (X, 18)),
                "foot.L": t("foot.L", (X, 4)),
                "thigh.R": t("thigh.R", (X, 14), (Y, 6)),
                "shin.R": t("shin.R", (X, 12)),
                "foot.R": t("foot.R", (X, -22)),
                "forearm.L/IK": 1.0,
                "frost@scale": 0.05,
            },
            (-0.07, 0.03 - breath * 0.004, 0.5 - breath * 0.008),
            (0.0, -1, -0.22 - breath * 0.03),
        )

    def winded(breath=0.0):
        """Low HP: down on one knee, bent over the scythe, the blade on the ground."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.03, -0.15 - breath * 0.005)),
                spine=t("spine", (X, 22 + breath * 4)),
                chest=t("chest", (X, 10 + breath * 3)),
                neck=t("neck", (X, 6)),
                head=t("head", (Z, -10), (X, 6 + breath * 4), (Y, -14)),
                jaw=t("jaw", (X, 14)),
                hair=t("hair", (X, 14)),
                cloak=t("cloak", (X, 20)),
                thigh__L=t("thigh.L", (X, -76), (Y, -6)),
                shin__L=t("shin.L", (X, 78)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 12), (Y, 8)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -50)),
            ),
            (-0.07, -0.08, 0.4 - breath * 0.008),
            (0.0, -1, -0.12),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the hair flies."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.026)),
            spine=t("spine", (Z, -2), (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 6), (X, -18 * amount)),
            jaw=t("jaw", (X, 22 * amount)),
            hair=t("hair", (X, -26 * amount)),
            cloak=t("cloak", (X, 16 * amount)),
            ik_hand__R_at_pos=Vector((-0.07, 0.06 * amount + 0.03, 0.52 + 0.02 * amount)),
            scythe_aim_at_rot=aimed((0.0, -1, -0.22 + 0.4 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.06)),
            spine=t("spine", (X, 22)),
            head=t("head", (X, 22), (Y, -10)),
            jaw=t("jaw", (X, 26)),
            hair=t("hair", (X, 20)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            cloak=t("cloak", (X, -16)),
            ik_hand__R_at_pos=Vector((-0.08, -0.02, 0.4)),
            scythe_aim_at_rot=aimed((0.1, -1, -0.15), 30),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back. The hands let go, and the scythe lies beside her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.04)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (Z, 0), (X, -4)),
            chest=t("chest", (Z, 0), (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -30)),
            jaw=t("jaw", (X, 24)),
            hair=t("hair", (X, -50)),
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
            cloak=t("cloak", (X, -50)),
            skirt__B=t("skirt.B", (X, -30)),
            forearm__L_slash_IK=0.0,
            forearm__R_slash_IK=0.0,
            scythe_slash_Aim=1.0,
            scythe_aim_at_rot=aimed((0.35, -1, 0.0), 90),
        )

    def crouch(base):
        """Low on one knee, as a summon starts and a Rebirth gets up."""
        return pose(winded(), spine=t("spine", (X, 26)), head=t("head", (X, -10), (Y, -10)), hips_at_loc=at("hips", (0, 0.03, -0.17)))

    def risen(base):
        """Up again, tall, the scythe raised beside her: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, 0.0)),
                hips=t("hips", (Z, 0)),
                spine=t("spine", (Z, 0), (X, -2)),
                chest=t("chest", (Z, 0), (X, -8)),
                neck=t("neck", (Z, -6)),
                head=t("head", (Z, -10), (X, -12), (Y, -6)),
                jaw=t("jaw", (X, 16)),
                hair=t("hair", (X, -16)),
                thigh__L=t("thigh.L", (X, -4), (Y, -4)),
                shin__L=t("shin.L", (X, 4)),
                thigh__R=t("thigh.R", (X, 2), (Y, 4)),
                shin__R=t("shin.R", (X, 4)),
                foot__R=t("foot.R", (X, -6)),
                frost_at_scale=0.6,
            ),
            (-0.1, -0.02, 0.6),
            (0.0, -0.4, 1),
        )

    def step(front):
        """A long, gliding stride, the blade low. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03)),
            hips=t("hips", (Z, 6 - 6 * front), (Y, 3 * front)),
            spine=t("spine", (Z, -2), (X, 10)),
            chest=t("chest", (Z, 4 * front)),
            hair=t("hair", (X, -12), (Y, 6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 12)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 20)),
                f"shin__{back}": t(f"shin.{back}", (X, 20)),
                f"foot__{back}": t(f"foot.{back}", (X, 8)),
                "cloak": t("cloak", (X, 20), (Y, 6 * front)),
                "skirt__B": t("skirt.B", (X, 10)),
                "ik_hand__R_at_pos": Vector((-0.07, 0.02, 0.5)),
                "scythe_aim_at_rot": aimed((0.0, -1, -0.26)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            spine=t("spine", (Z, -2), (X, 10)),
            hair=t("hair", (X, -16)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -26)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 50)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 8)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "cloak": t("cloak", (X, 24)),
                "ik_hand__R_at_pos": Vector((-0.07, 0.03, 0.52)),
                "scythe_aim_at_rot": aimed((0.0, -1, -0.2)),
            },
        )

    # The attack: she turns to her right and draws the blade back behind her,
    # then steps in and sweeps it low, round her right side, to the front.
    # The left hand lets go for the sweep. The slash effect starts at 50% of
    # the attack (`MELEE_IMPACT` in fx.ts), so the blade passes her front at
    # frame 15 of 30, and the ice flares there.
    def sweep(base, through, hand, direction, frost=0.05):
        """The body turns from her right (`through` -1) to her left (1). `hand` and `direction` drive the scythe."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.03 * (through + 1), -0.06 - 0.02 * (through + 1))),
                hips=t("hips", (Z, 6 + through * 22)),
                spine=t("spine", (Z, through * 14), (X, 14)),
                chest=t("chest", (Z, through * 10)),
                neck=t("neck", (Z, -6 - through * 6)),
                head=t("head", (Z, -10 - through * 8), (X, -4), (Y, -8)),
                jaw=t("jaw", (X, 10 + 10 * (through > -1))),
                hair=t("hair", (X, -10), (Y, -20 * through)),
                thigh__L=t("thigh.L", (X, -40 - 10 * (through + 1)), (Y, -8)),
                shin__L=t("shin.L", (X, 40 + 10 * (through + 1))),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 22), (Y, 8)),
                shin__R=t("shin.R", (X, 16)),
                foot__R=t("foot.R", (X, -16)),
                cloak=t("cloak", (X, 24), (Y, -20 * through)),
                skirt__B=t("skirt.B", (Y, -12 * through)),
                upperarm__L=t("upperarm.L", (Y, -40), (X, 30)),
                forearm__L=t("forearm.L", (X, -20)),
                forearm__L_slash_IK=0.0,
                frost_at_scale=frost,
            ),
            hand,
            direction,
        )

    clips = []
    idle = Clip("idle", 72, loop=True)
    for frame, breath, tilt in ((0, 0, 0), (12, 0.5, 0), (24, 1, 0), (32, 0.8, 1), (44, 0.5, 1), (52, 0.3, 0), (60, 0.5, 0), (72, 0, 0)):
        idle.key(frame, stand(breath, tilt))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    walk = Clip("walk", 28, loop=True)
    walk.key(0, step(1)).key(7, passing("R")).key(14, step(-1)).key(21, passing("L")).key(28, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand())
    attack.key(9, sweep(stand(), -1, (-0.17, 0.1, 0.56), (-0.6, 0.8, -0.1)))
    attack.key(12, sweep(stand(), -0.5, (-0.24, -0.04, 0.5), (-1, -0.1, -0.25), 0.3))
    attack.key(15, sweep(stand(), 0, (-0.12, -0.2, 0.45), (0.1, -1, -0.3), 1.2))
    attack.key(19, sweep(stand(), 0.6, (0.0, -0.18, 0.46), (0.75, -0.65, -0.25), 0.7))
    attack.key(24, sweep(stand(), 0.2, (-0.08, -0.04, 0.5), (0.2, -1, -0.2), 0.05))
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
    rebirth.key(32, crouch(stand())).key(41, risen(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.19))))
    summon.key(17, risen(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "rime-eye-reaper.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
