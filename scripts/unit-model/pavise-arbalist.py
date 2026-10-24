"""
Pavise Arbalist (`human.paviseArbalist`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a patient old arbalist with grey
hair and a grey moustache, a blue surcoat with gold trim over mail sleeves,
leather gloves, a bolt case on the right hip and a heavy windlass crossbow
with barbed bolts. A tall blue pavise with a gold fleur stands in front of
him, and a stool with a tea cup waits behind. In the walk the stool hops
after him. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/pavise-arbalist.glb`; then
`bun unit-model:pack pavise-arbalist` packs it for the game.

At rest he kneels behind the pavise and aims over it. The pavise turns its
face to the camera side, so the camera sees the fleur. The left hand always
holds the crossbow (IK to the `grip.L` bone). The aim uses IK for the right
hand and the `Aim` constraint for the crossbow, and the shot leaves at 20% of
the attack. In the walk he stands and carries the pavise in front of him.
He has no Keyword that he uses by his own action, so he has no cast clip.
"""

import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#d9a07c")
HAIR = hex_color("#c9c3b8")
HAIR_DARK = hex_color("#9c958a")
EYES = hex_color("#1e1a16")
BLUE = hex_color("#2c4a8c")
BLUE_DARK = hex_color("#1c2f5c")
GOLD = hex_color("#d9a83e")
GOLD_DARK = hex_color("#9c7426")
MAIL = hex_color("#8a8a86")
MAIL_DARK = hex_color("#62625e")
LEATHER = hex_color("#7a4a28")
GLOVE = hex_color("#6a3f22")
BOOT = hex_color("#5a3a22")
TROUSERS = hex_color("#5b4a3c")
WOOD = hex_color("#8a5a32")
WOOD_DARK = hex_color("#5a3a20")
STEEL = hex_color("#b9bcbf")
IRON = hex_color("#4a4a48")
STRING = hex_color("#e8dcc0")
CUP = hex_color("#f1ece0")
TEA = hex_color("#7a4a22")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.42
WAIST_Z = 0.5
CHEST_Z = 0.6
SHOULDER_Z = 0.69
NECK_Z = 0.72
HEAD_C = Vector((0, -0.008, 0.83))
KNEE_Z = 0.23
ANKLE_Z = 0.055
LEG_X = 0.065
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


# At rest the right hand holds the crossbow at the hip, pointing forward, up
# and across the body, and the left hand holds its fore-end.
XBOW = Vector((0.35, -0.8, 0.45)).normalized()
XBOW_SIDE = XBOW.cross(Z).normalized()
XBOW_UP = XBOW_SIDE.cross(XBOW).normalized()
SR = Vector((-0.135, 0, SHOULDER_Z))
WR = Vector((-0.075, -0.06, 0.465))
ER = bend(SR, WR, (-1, 0.5, -0.3))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
GRIP_R = WR + DR * 0.025
FORE_END = 0.12
GRIP_L = GRIP_R + XBOW * FORE_END
SL = Vector((0.135, 0, SHOULDER_Z))
WL = GRIP_L
EL = bend(SL, WL, (1, 0.3, -1))
TL = WL + (WL - EL).normalized() * 0.04
# The nut holds the drawn string; the prod is at the front.
NUT = 0.03
PROD = 0.27


def xb(a, b=0.0, c=0.0):
    """A point on the crossbow at rest: `a` along it, `b` to its side, `c` up."""
    return GRIP_R + XBOW * a + XBOW_SIDE * b + XBOW_UP * c


# The pavise stands in front, its face turned 40 degrees to the camera side
# (-X). `u` goes across it, `v` up it.
PAVISE_FOOT = Vector((-0.03, -0.27, 0))
PAVISE_TURN = math.radians(40)
PAVISE_N = Vector((-math.sin(PAVISE_TURN), -math.cos(PAVISE_TURN), 0))
PAVISE_W = Z.cross(PAVISE_N).normalized()
PAVISE_HALF = 0.15
PAVISE_HEIGHT = 0.58
PAVISE_BULGE = 0.02
PAVISE_THICK = 0.018

STOOL = Vector((-0.1, 0.26, 0))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.75), "chest"),
    ("head", (0, 0, 0.75), (0, 0, 0.92), "neck"),
    ("skirt.B", (0, 0.08, 0.44), (0, 0.11, 0.24), "hips"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.35, 0.05, 0.35), (0.35, 0.05, 0.4), "chest"),
    ("pole.R", (-0.4, 0.2, 0.35), (-0.4, 0.2, 0.4), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.1, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("crossbow", tuple(GRIP_R), tuple(GRIP_R + XBOW * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + XBOW * 0.05), "crossbow"),
    ("string", tuple(xb(NUT, 0, 0.018)), tuple(xb(NUT, 0, 0.018) + XBOW_UP * 0.04), "crossbow"),
    ("bolt", tuple(xb(NUT, 0, 0.026)), tuple(xb(NUT + 0.1, 0, 0.026)), "crossbow"),
    # The pavise and the stool stand on the ground: they do not fall with the root.
    ("ground", (0, 0.2, 0), (0, 0.2, 0.1), None),
    ("pavise", tuple(PAVISE_FOOT), tuple(PAVISE_FOOT + Z * 0.15), "ground"),
    # The stool hops after him in the walk.
    ("stool", tuple(STOOL), tuple(STOOL + Z * 0.1), "ground"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.46, 0.54)
    return blend("spine", "chest", co.z, 0.57, 0.64)


def skirt_weights(co):
    t = clamp01((0.46 - co.z) / 0.2)
    back = clamp01((co.y - 0.02) / 0.08)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "skirt.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.5),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.5),
    }


def string_weights(co):
    reach = (co - xb(NUT)).length
    near = 1 - clamp01((reach - 0.05) / 0.15)
    return {"string": near, "crossbow": 1 - near}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.064, 0.068, 0.076), 12, 9)
    kit.cone(head.bm, (0, -0.064, 0.83), (0, -0.086, 0.81), 0.017, 0.006, 5)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.062 * sign, 0.004, 0.83), (0.012, 0.016, 0.02), 6, 4)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.025 * sign, -0.06, 0.842), (0.009, 0.006, 0.007), 6, 4)
    parts.append(eyes)

    # Grey hair swept back, bushy brows, a heavy moustache and a short beard.
    hair = Part("hair", HAIR, "head", shade=0.14)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.012)), (0.07, 0.074, 0.078), 12, 9)
    face = [v for v in verts if v.co.z < 0.79 or (v.co.y < -0.025 and v.co.z < 0.875)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    for sign in (1, -1):
        brow = kit.cone(hair.bm, (0.012 * sign, -0.066, 0.858), (0.044 * sign, -0.06, 0.862), 0.009, 0.006, 5)
        hair.paint(faces_of(brow), HAIR_DARK)
        kit.cone(hair.bm, (0.058 * sign, 0.0, 0.86), (0.06 * sign, 0.02, 0.79), 0.022, 0.012, 6, squash=0.7)
    for sign in (1, -1):
        kit.cone(hair.bm, (0.004 * sign, -0.074, 0.806), (0.05 * sign, -0.066, 0.784), 0.013, 0.006, 6, squash=0.7)
    beard = kit.sphere(hair.bm, (0, -0.05, 0.775), (0.048, 0.036, 0.034), 10, 6)
    hair.paint(faces_of(beard), HAIR_DARK)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.7), (0, 0, 0.77), 0.03, 0.028, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # Mail under the surcoat.
    mail = Part("mail", MAIL, torso_weights)
    verts = kit.cone(mail.bm, (0, 0, 0.44), (0, 0, 0.69), 0.098, 0.106, 12, squash=0.8)
    for face in faces_of(verts):
        if int(face.calc_center_median().z * 80) % 2:
            mail.paint([face], MAIL_DARK)
    parts.append(mail)

    # The blue surcoat over the chest: gold edges and a gold fleur.
    surcoat = Part("surcoat", BLUE, torso_weights, shade=0.08)
    verts = kit.cone(surcoat.bm, (0, 0, 0.45), (0, 0, 0.67), 0.104, 0.11, 12, caps=False, squash=0.82)
    for face in faces_of(verts):
        c = face.calc_center_median()
        if c.z > 0.655 or abs(c.x) > 0.095:
            surcoat.paint([face], GOLD)
    fleur = kit.cone(surcoat.bm, (0, -0.09, 0.53), (0, -0.092, 0.62), 0.02, 0.002, 4, squash=0.4)
    surcoat.paint(faces_of(fleur), GOLD)
    for sign in (1, -1):
        leaf = kit.cone(surcoat.bm, (0.006 * sign, -0.09, 0.56), (0.03 * sign, -0.088, 0.6), 0.01, 0.002, 4, squash=0.4)
        surcoat.paint(faces_of(leaf), GOLD)
    parts.append(surcoat)

    # A short blue mantle over the shoulders with a gold rim.
    mantle = Part("mantle", BLUE, "chest", shade=0.1)
    verts = kit.cone(mantle.bm, (0, 0.004, 0.735), (0, 0.004, 0.62), 0.07, 0.14, 14, caps=False, squash=0.82)
    mantle.paint({f for v in verts if v.co.z < 0.635 for f in v.link_faces}, GOLD)
    parts.append(mantle)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.44), (0, 0, 0.47), 0.108, 0.106, 12, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.088, 0.455), (0.03, 0.01, 0.026))
    belt.paint(faces_of(buckle), GOLD)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.36), (0, 0, 0.45), 0.09, 0.098, 12, squash=0.8)
    parts.append(hips)

    # The skirt of the surcoat, open at the sides, to the knees.
    skirt = Part("skirt", BLUE, skirt_weights, shade=0.1)

    def lining(row, column):
        return BLUE_DARK

    def color_of(row, column):
        return GOLD if row == 3 or column % 6 == 0 else BLUE

    kit.ragged_cone(skirt, 0.45, 0.25, 0.108, 0.15, 12, 4, 0.8, 0.0, color_of, BLUE_DARK, gap=math.radians(18))
    parts.append(skirt)

    # The bolt case on the right hip, the camera side, with barbed bolts.
    case = Part("bolt.case", LEATHER, "hips", shade=0.06)
    bottom, top = Vector((-0.12, 0.04, 0.27)), Vector((-0.13, 0.08, 0.46))
    kit.cone(case.bm, bottom, top, 0.028, 0.034, 8)
    for along in (0.15, 0.85):
        band = kit.cone(case.bm, bottom.lerp(top, along), bottom.lerp(top, along + 0.06), 0.031, 0.036, 8)
        case.paint(faces_of(band), GOLD)
    up = (top - bottom).normalized()
    for dx, dy in ((0.0, 0.0), (0.014, 0.008), (-0.012, 0.01), (0.004, -0.014)):
        start = top + Vector((dx, dy, 0))
        shaft = kit.cone(case.bm, start - up * 0.02, start + up * 0.06, 0.004, 0.004, 4)
        case.paint(faces_of(shaft), WOOD)
        fletch = kit.cone(case.bm, start + up * 0.03, start + up * 0.07, 0.011, 0.002, 3)
        case.paint(faces_of(fletch), BLUE)
    parts.append(case)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        shoulder = Part(f"pauldron.{side}", BLUE, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(shoulder.bm, s + Vector((0.006 * sign, 0, 0.004)), (0.046, 0.044, 0.04), 10, 7)
        shoulder.paint({f for v in verts if v.co.z < s.z - 0.014 for f in v.link_faces}, GOLD)
        parts.append(shoulder)

        sleeve = Part(f"sleeve.{side}", MAIL, f"upperarm.{side}")
        verts = kit.cone(sleeve.bm, s, e, 0.034, 0.03, 8)
        for face in faces_of(verts):
            if int(((face.calc_center_median() - s).length) * 90) % 2:
                sleeve.paint([face], MAIL_DARK)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", MAIL, f"forearm.{side}")
        kit.cone(forearm.bm, e, w - d * 0.04, 0.03, 0.026, 8)
        kit.sphere(forearm.bm, e, (0.031, 0.031, 0.031), 8, 5)
        parts.append(forearm)

        # Leather gloves with wide cuffs.
        glove = Part(f"glove.{side}", GLOVE, f"hand.{side}")
        kit.cone(glove.bm, w - d * 0.055, w + d * 0.004, 0.032, 0.036, 8)
        kit.sphere(glove.bm, w + d * 0.026, (0.024, 0.021, 0.028), 8, 6)
        parts.append(glove)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.05, 0.04, 8)
        parts.append(thigh)

        knee_pad = Part(f"knee.{side}", LEATHER, f"shin.{side}", shade=0.05)
        kit.sphere(knee_pad.bm, knee + Vector((0, -0.014, 0)), (0.04, 0.036, 0.036), 8, 6)
        parts.append(knee_pad)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        verts = kit.cone(boot.bm, knee - Vector((0, 0, 0.02)), ankle, 0.04, 0.036, 8)
        boot.paint({f for v in verts if v.co.z > KNEE_Z - 0.05 for f in v.link_faces}, LEATHER)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.box(foot.bm, (LEG_X * sign, -0.035, 0.026), (0.066, 0.13, 0.052))
        parts.append(foot)
    return parts


def crossbow_parts():
    bow = Part("crossbow", WOOD, "crossbow", shade=0.04)
    # The stock: a deep butt at the back and a long tiller to the prod.
    kit.slab(bow.bm, xb(-0.07, 0, -0.012), XBOW * 0.06, XBOW_SIDE * 0.02, XBOW_UP * 0.03)
    kit.slab(bow.bm, xb(0.1, 0, 0.004), XBOW * 0.18, XBOW_SIDE * 0.016, XBOW_UP * 0.016)
    plate = kit.slab(bow.bm, xb(-0.13, 0, -0.012), XBOW * 0.006, XBOW_SIDE * 0.022, XBOW_UP * 0.032)
    bow.paint(faces_of(plate), GOLD)
    for along in (0.0, 0.16):
        band = kit.slab(bow.bm, xb(along, 0, 0.004), XBOW * 0.008, XBOW_SIDE * 0.019, XBOW_UP * 0.019)
        bow.paint(faces_of(band), GOLD)
    # The trigger lever under the stock.
    lever = kit.cone(bow.bm, xb(-0.01, 0, -0.012), xb(-0.06, 0, -0.06), 0.006, 0.005, 4)
    bow.paint(faces_of(lever), IRON)
    # The steel prod: a bow across the front, its tips swept forward.
    tips = [xb(PROD - 0.02 * abs(s) ** 2 + 0.02 * abs(s), s * 0.16, 0.004) for s in (-1, -0.6, -0.25, 0, 0.25, 0.6, 1)]
    prod = kit.tube(bow.bm, tips, [0.006, 0.008, 0.01, 0.011, 0.01, 0.008, 0.006], 5)
    bow.paint(faces_of(prod), STEEL)
    # The stirrup at the front, to span it with a foot.
    stirrup = kit.torus(bow.bm, xb(PROD + 0.035, 0, 0.0), XBOW_UP, 0.028, 0.005, 10, 3)
    bow.paint(faces_of(stirrup), IRON)
    # The windlass at the back: a drum and two cranks.
    drum = kit.cone(bow.bm, xb(-0.1, -0.04, 0.02), xb(-0.1, 0.04, 0.02), 0.012, 0.012, 6)
    bow.paint(faces_of(drum), IRON)
    for b in (-0.045, 0.045):
        crank = kit.cone(bow.bm, xb(-0.1, b, 0.02), xb(-0.12, b, -0.02), 0.005, 0.005, 4)
        bow.paint(faces_of(crank), IRON)
        knob = kit.sphere(bow.bm, xb(-0.12, b * 1.25, -0.02), (0.009, 0.009, 0.009), 5, 3)
        bow.paint(faces_of(knob), GOLD)

    string = Part("string", STRING, string_weights, shade=0)
    kit.tube(string.bm, [tips[0], xb(NUT, 0, 0.018), tips[-1]], [0.003] * 3, 4, caps=False)

    # A barbed bolt (Hobble), in the groove.
    bolt = Part("bolt", WOOD, "bolt", shade=0)
    start, end = xb(NUT, 0, 0.026), xb(PROD + 0.06, 0, 0.026)
    kit.tube(bolt.bm, [start, end], [0.004, 0.004], 4)
    head = kit.cone(bolt.bm, end, end + XBOW * 0.04, 0.011, 0.001, 4)
    bolt.paint(faces_of(head), STEEL)
    for b in (-1, 1):
        barb = kit.cone(bolt.bm, end + XBOW * 0.012, end - XBOW * 0.01 + XBOW_SIDE * (0.014 * b), 0.004, 0.001, 3)
        bolt.paint(faces_of(barb), STEEL)
    fletch = kit.slab(bolt.bm, start + XBOW * 0.03 + XBOW_UP * 0.006, XBOW * 0.022, XBOW_SIDE * 0.001, XBOW_UP * 0.008)
    bolt.paint(faces_of(fletch), BLUE)
    return [bow, string, bolt]


def pavise_point(u, v, depth=0.0):
    """A point on the face of the pavise; `depth` goes back into it."""
    curve = 1 - u * u
    return PAVISE_FOOT + PAVISE_W * (u * PAVISE_HALF) + Z * (0.01 + v * PAVISE_HEIGHT) + PAVISE_N * (PAVISE_BULGE * curve - depth)


def pavise_parts():
    pavise = Part("pavise", BLUE, "pavise", shade=0.06)
    columns, rows = 8, 12

    def top(u):
        # A low gable at the top, as in the painting.
        return 1 + 0.05 * (1 - abs(u))

    def grid(depth):
        result = []
        for r in range(rows + 1):
            line = []
            for c in range(columns + 1):
                u = lerp(-1, 1, c / columns)
                line.append(pavise_point(u, r / rows * top(u), depth))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if face_side == "back":
            return LEATHER if abs((row + 0.5) / rows - 0.62) < 0.05 else WOOD_DARK
        if column in (0, columns - 1) or row in (0, rows - 1):
            return GOLD
        return BLUE

    edges = panel(pavise, grid(0.0), grid(PAVISE_THICK), color_of)
    pavise.paint(edges, GOLD_DARK)

    def on_face(u, v, lift=0.004):
        return pavise_point(u, v) + PAVISE_N * lift

    # The ridge down the middle.
    ridge = kit.tube(pavise.bm, [on_face(0, 0.03), on_face(0, 1.03)], [0.012, 0.012], 4)
    pavise.paint(faces_of(ridge), BLUE_DARK)
    # The big gold fleur: a tall middle leaf, two curled side leaves and a band.
    gold = set()
    center = on_face(0, 0.52, 0.016)
    gold |= set(kit.cone(pavise.bm, center - Z * 0.06, center + Z * 0.16, 0.032, 0.002, 4, squash=0.35))
    for sign in (1, -1):
        side = PAVISE_W * sign
        # Each side leaf goes up and out, then curls down at its tip.
        gold |= set(kit.tube(pavise.bm, [center - Z * 0.01 + side * 0.012, center + Z * 0.06 + side * 0.05, center + Z * 0.07 + side * 0.09, center + Z * 0.03 + side * 0.11, center + side * 0.1], [0.016, 0.016, 0.012, 0.008, 0.003], 4))
    gold |= set(kit.slab(pavise.bm, center - Z * 0.03, PAVISE_W * 0.06, PAVISE_N * 0.006, Z * 0.012))
    gold |= set(kit.cone(pavise.bm, center - Z * 0.04, center - Z * 0.13, 0.026, 0.004, 4, squash=0.35))
    pavise.paint(faces_of(gold), GOLD)
    # Iron corner plates with studs.
    for u, v in ((-0.85, 0.06), (0.85, 0.06), (-0.85, 0.94), (0.85, 0.94)):
        plate = kit.slab(pavise.bm, on_face(u, v), PAVISE_W * 0.03, PAVISE_N * 0.004, Z * 0.035)
        pavise.paint(faces_of(plate), IRON)
    # A prop at the back keeps it up.
    back_top = pavise_point(0.3, 0.7, PAVISE_THICK)
    prop = kit.cone(pavise.bm, back_top, PAVISE_FOOT - PAVISE_N * 0.16 + PAVISE_W * 0.06, 0.01, 0.01, 5)
    pavise.paint(faces_of(prop), WOOD_DARK)
    return [pavise]


def stool_parts():
    """The stool and the tea cup behind him: the humor note of the card."""
    stool = Part("stool", WOOD, "stool", shade=0.12)
    seat = STOOL + Z * 0.15
    kit.cone(stool.bm, seat, seat + Z * 0.02, 0.06, 0.06, 10)
    for index in range(3):
        a = 2 * math.pi * index / 3
        out = Vector((math.cos(a), math.sin(a), 0))
        leg = kit.cone(stool.bm, seat + out * 0.035, STOOL + out * 0.055, 0.008, 0.008, 4)
        stool.paint(faces_of(leg), WOOD_DARK)
    cup_base = seat + Z * 0.02
    saucer = kit.cone(stool.bm, cup_base, cup_base + Z * 0.005, 0.03, 0.03, 10)
    stool.paint(faces_of(saucer), CUP)
    cup = kit.cone(stool.bm, cup_base + Z * 0.005, cup_base + Z * 0.035, 0.015, 0.02, 10)
    stool.paint(faces_of(cup), CUP)
    tea = kit.cone(stool.bm, cup_base + Z * 0.033, cup_base + Z * 0.036, 0.018, 0.018, 10)
    stool.paint(faces_of(tea), TEA)
    handle = kit.torus(stool.bm, cup_base + Vector((-0.022, 0, 0.02)), Y, 0.009, 0.003, 8, 3)
    stool.paint(faces_of(handle), CUP)
    return [stool]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("PaviseArbalist", BONES)
    parts = head_parts() + body_parts() + limb_parts() + crossbow_parts() + pavise_parts() + stool_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "PaviseArbalistMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the crossbow, the right hand to aim. The crossbow aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "xbow_aim": kit.add_empty("xbow_aim"),
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
    aim = bones["crossbow"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["xbow_aim"]
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

    xbow_rest = rig.data.bones["crossbow"].matrix_local.to_quaternion()
    rest_frame = Matrix((XBOW, XBOW_SIDE, XBOW_UP)).transposed()

    def aimed(direction):
        """The world rotation of the crossbow that points it along `direction`, the prod level."""
        forward = Vector(direction).normalized()
        side = forward.cross(Z).normalized()
        frame = Matrix((forward, side, side.cross(forward))).transposed()
        return (frame @ rest_frame.transposed()).to_quaternion() @ xbow_rest

    def kneel(breath=0.0, look=0.0):
        """
        The legs and the body of the firing position: down on the right knee
        behind the pavise, the left knee up.
        """
        return {
            "hips@loc": at("hips", (0, 0.04, -0.2 - breath * 0.004)),
            "hips": t("hips", (Z, -8)),
            "spine": t("spine", (X, 10 + breath)),
            "chest": t("chest", (X, 2 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, 6)),
            "head": t("head", (X, 4 + breath), (Z, 6 + look * 6), (Y, -10)),
            "thigh.L": t("thigh.L", (X, -80), (Y, -4)),
            "shin.L": t("shin.L", (X, 80)),
            "foot.L": t("foot.L", (X, 0)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 4)),
            "shin.R": t("shin.R", (X, 94)),
            "foot.R": t("foot.R", (X, -44)),
            "skirt.B": t("skirt.B", (X, 30)),
            "forearm.L/IK": 1.0,
            "bolt@scale": 1.0,
        }

    # The aim over the pavise: the butt at the right cheek, the crossbow level.
    CHEEK = Vector((-0.05, -0.02, 0.585))

    def aiming(base, kick=0.0, loosed=False, hand=None):
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "crossbow_slash_Aim": 1.0,
                "ik_hand__R_at_pos": hand or CHEEK + Vector((0, 0.01 * kick, 0.004 * kick)),
                "xbow_aim_at_rot": aimed((0, -1, -0.02 + kick * 0.3)),
                "string_at_loc": at("string", XBOW * (PROD - NUT - 0.01)) if loosed else Vector(),
                "bolt_at_scale": 0.0 if loosed else 1.0,
            },
        )

    def stand(breath=0.0, look=0.0):
        """The idle: he kneels behind the pavise and aims over it, patient."""
        return aiming(kneel(breath, look))

    def tired(breath=0.0):
        """Low HP: he sits back on his heels, the crossbow down across his knees."""
        return pose(
            kneel(),
            hips_at_loc=at("hips", (0, 0.08, -0.27 - breath * 0.004)),
            hips=t("hips", (Z, -8), (X, -10)),
            spine=t("spine", (X, 26 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 16 + breath * 4), (Y, -8)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 120)),
            foot__L=t("foot.L", (X, -30)),
            thigh__R=t("thigh.R", (X, -50), (Y, 6)),
            shin__R=t("shin.R", (X, 130)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, -6)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 30), (Z, -20)),
            skirt__B=t("skirt.B", (X, 50)),
        )

    def recoil(base, amount=1.0):
        """The hit lands on the pavise: it rocks back, and he flinches."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.05 + 0.02 * amount, -0.2)),
            spine=t("spine", (X, 10 - 12 * amount)),
            head=t("head", (X, -12 * amount), (Z, 10 * amount)),
            pavise=t("pavise", (PAVISE_W, -8 * amount)),
            ik_hand__R_at_pos=CHEEK + Vector((0, 0.03 * amount, 0.02 * amount)),
            xbow_aim_at_rot=aimed((0, -1, 0.25 * amount)),
        )

    def topple(base):
        """Part way into the death: he lets go of the aim and tips back."""
        return pose(
            base,
            forearm__R_slash_IK=0.0,
            crossbow_slash_Aim=0.0,
            hips_at_loc=at("hips", (0, 0.08, -0.24)),
            spine=t("spine", (X, -16)),
            head=t("head", (X, -20)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -20)),
            pavise=t("pavise", (PAVISE_W, 30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the crossbow on his chest; the pavise lies flat on its face."""
        return pose(
            base,
            forearm__R_slash_IK=0.0,
            crossbow_slash_Aim=0.0,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            head=t("head", (X, -10), (Z, -25)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, 10)),
            forearm__R=t("forearm.R", (X, -50)),
            hand__R=t("hand.R", (X, 0)),
            thigh__L=t("thigh.L", (X, -30), (Y, -6)),
            shin__L=t("shin.L", (X, 50)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -10), (Y, 6)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, 0)),
            skirt__B=t("skirt.B", (X, -30)),
            pavise=t("pavise", (PAVISE_W, 86 - bounce)),
        )

    def upright(breath=0.0):
        """Standing, the crossbow across the chest: the walk, and the end of a summon."""
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -10)),
            "spine": t("spine", (X, 6 + breath)),
            "chest": t("chest", (X, -2)),
            "head": t("head", (X, 2), (Z, 8)),
            "upperarm.R": t("upperarm.R", (X, -10), (Y, -4)),
            "forearm.R": t("forearm.R", (X, -40)),
            "hand.R": t("hand.R", (X, 10)),
            "thigh.L": t("thigh.L", (X, -8), (Y, -3)),
            "shin.L": t("shin.L", (X, 12)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 3)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -12)),
            "forearm.L/IK": 1.0,
            "bolt@scale": 1.0,
            # The pavise comes up off the ground and leans back on him.
            "pavise@loc": at("pavise", (0.0, 0.1, 0.05)),
            "pavise": t("pavise", (PAVISE_W, -8)),
        }

    def step(front):
        """A step with the pavise carried in front. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            upright(),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            spine=t("spine", (X, 8), (Y, 3 * front)),
            pavise_at_loc=at("pavise", (0.0, 0.1, 0.035)),
            pavise=t("pavise", (PAVISE_W, -8), (Z, 3 * front)),
            # The stool lands on its legs.
            stool=t("stool", (Y, 4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "skirt__B": t("skirt.B", (X, 8)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            upright(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (X, 8)),
            pavise_at_loc=at("pavise", (0.0, 0.1, 0.06)),
            # The stool hops up, between the steps.
            stool_at_loc=at("stool", (0, -0.01, 0.05)),
            stool=t("stool", (X, -10)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -14)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "skirt__B": t("skirt.B", (X, 4)),
            },
        )

    def crouch(base):
        """Down low with the pavise flat in front: a summon starts and a Rebirth gets up."""
        return pose(
            kneel(),
            hips_at_loc=at("hips", (0, 0.06, -0.24)),
            spine=t("spine", (X, 34)),
            head=t("head", (X, 20)),
            upperarm__R=t("upperarm.R", (X, -10)),
            forearm__R=t("forearm.R", (X, -30)),
            pavise=t("pavise", (PAVISE_W, -80)),
            pavise_at_loc=at("pavise", (0, 0, 0.01)),
        )

    def plant(base):
        """He slams the pavise down and stands it up."""
        return pose(
            base,
            pavise=t("pavise", (PAVISE_W, -6)),
            pavise_at_loc=at("pavise", (0, 0, 0.03)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, look in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, look))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, tired(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    # The attack: a steady aim, then the shot. The bolt leaves at 20% of the
    # attack (`FLIGHT_START` in fx.ts), so the string is loosed at frame 6 of
    # 30, and the crossbow kicks up. He winds a new bolt in by frame 24.
    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, aiming(kneel(), 0.0)).key(5, aiming(kneel(), 0.0))
    attack.key(6, aiming(kneel(), 0.3, loosed=True)).key(8, aiming(kneel(), 1.0, loosed=True))
    attack.key(12, aiming(kneel(), 0.4, loosed=True)).key(20, aiming(kneel(), 0.0, loosed=True))
    attack.key(21, aiming(kneel())).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, topple(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(40, plant(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, crouch(stand())).key(16, plant(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "pavise-arbalist.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
