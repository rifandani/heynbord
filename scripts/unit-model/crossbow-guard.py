"""
Crossbow Guard (`human.crossbowGuard`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a sleepy woman town guard with
brown hair in a short tail under a crooked kettle hat, a long blue tabard with
gold trim and a gold lily, a padded cream coat, steel shoulder guards, dark
gloves, a quiver of bolts on the right hip, brown trousers, tall boots and a
crossbow. One eye is shut, the other half open, and a small yawn shows. Run
it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/crossbow-guard.glb`; then
`bun unit-model:pack crossbow-guard` packs it for the game.

She stands and aims the crossbow at shoulder height, steady and correct: the
right hand at the stock, the butt at her right shoulder, and the left hand
under the fore-end with IK to a grip bone. The right hand drives the
crossbow with IK and a Copy Rotation. Her body is perfect for the shot, but
her face is half asleep: in the idle her head nods slowly and the crossbow
dips, then she snaps awake. The shut eye is on the camera side. The shot
leaves at 20% of the attack (Long-range); then she lowers the crossbow, draws
the string and sets a new bolt. She has no Keyword that she uses by her own
action, so she has no cast clip.
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

SKIN = hex_color("#e6ae8c")
LID = hex_color("#d99c7c")
HAIR = hex_color("#7a4a2a")
HAIR_LIGHT = hex_color("#986036")
EYES = hex_color("#2a1d16")
MOUTH = hex_color("#6e2a24")
STEEL = hex_color("#b9bdc1")
STEEL_DARK = hex_color("#777d83")
HAT = hex_color("#7f848a")
COAT = hex_color("#e1d6bf")
COAT_DARK = hex_color("#bfb299")
BLUE = hex_color("#2c4a9a")
BLUE_DARK = hex_color("#1d336e")
GOLD = hex_color("#dcaa42")
GOLD_DARK = hex_color("#9e7428")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#4a2e1c")
GLOVE = hex_color("#3c2a20")
TROUSERS = hex_color("#5a4434")
BOOT = hex_color("#5a3a22")
WOOD = hex_color("#7a5030")
IRON = hex_color("#55575a")
STRING = hex_color("#d8cfba")
FLETCH = hex_color("#e8e0cc")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.72
NECK_Z = 0.745
HEAD_C = Vector((0, -0.004, 0.866))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.055

UPPER_ARM = 0.155
FOREARM = 0.15


def bend(shoulder, wrist, out):
    """The elbow between `shoulder` and `wrist`, bent toward `out`."""
    d = wrist - shoulder
    length = d.length
    along = (UPPER_ARM**2 - FOREARM**2 + length**2) / (2 * length)
    height = math.sqrt(max(UPPER_ARM**2 - along**2, 0.0))
    side = Vector(out) - d.normalized() * Vector(out).dot(d.normalized())
    return shoulder + d.normalized() * along + side.normalized() * height


# The bind pose is the aim: the right hand at the stock in front of the right
# shoulder, the crossbow level and forward, and the left hand under the
# fore-end.
XBOW = Vector((0.04, -1, 0)).normalized()
XBOW_SIDE = XBOW.cross(Z).normalized()
XBOW_UP = XBOW_SIDE.cross(XBOW).normalized()
SR = Vector((-0.112, 0, SHOULDER_Z))
WR = Vector((-0.07, -0.1, 0.745))
ER = bend(SR, WR, (-1, 0.4, -1))
DR = (WR - ER).normalized()
TR = WR + DR * 0.04
GRIP_R = WR + DR * 0.02
FORE_END = 0.1
GRIP_L = GRIP_R + XBOW * FORE_END + XBOW_UP * -0.012
SL = Vector((0.112, 0, SHOULDER_Z))
WL = GRIP_L
EL = bend(SL, WL, (1, 0.3, -1))
TL = WL + (WL - EL).normalized() * 0.04
# The nut holds the drawn string; the prod is at the front.
NUT = 0.03
PROD = 0.22


def xb(a, b=0.0, c=0.0):
    """A point on the crossbow at rest: `a` along it, `b` to its side, `c` up."""
    return GRIP_R + XBOW * a + XBOW_SIDE * b + XBOW_UP * c


BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.785), "chest"),
    ("head", (0, 0, 0.785), (0, 0, 0.96), "neck"),
    ("hat", (0, 0, 0.9), (0, 0, 0.99), "head"),
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
    ("crossbow", tuple(GRIP_R), tuple(GRIP_R + XBOW * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + XBOW * 0.05), "crossbow"),
    ("string", tuple(xb(NUT, 0, 0.018)), tuple(xb(NUT, 0, 0.018) + XBOW_UP * 0.04), "crossbow"),
    ("bolt", tuple(xb(NUT, 0, 0.026)), tuple(xb(NUT + 0.1, 0, 0.026)), "crossbow"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The coat skirt follows the hips at the top and the thighs lower."""
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


def string_weights(co):
    reach = (co - xb(NUT)).length
    near = 1 - clamp01((reach - 0.04) / 0.12)
    return {"string": near, "crossbow": 1 - near}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.06, 0.065, 0.077), 14, 10)
    kit.cone(head.bm, (0, -0.062, 0.864), (0, -0.077, 0.854), 0.011, 0.003, 5)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    # The left eye is half open, under a heavy lid.
    kit.sphere(face.bm, (0.024, -0.055, 0.872), (0.009, 0.007, 0.008), 8, 6)
    lid = kit.sphere(face.bm, (0.024, -0.057, 0.877), (0.0105, 0.0075, 0.0065), 8, 6)
    face.paint(faces_of(lid), LID)
    # The right eye, on the camera side, is shut: a curved line.
    shut = kit.tube(face.bm, [(-0.034, -0.054, 0.874), (-0.024, -0.059, 0.871), (-0.014, -0.057, 0.874)], [0.0025] * 3, 4)
    face.paint(faces_of(shut), EYES)
    for sign in (1, -1):
        brow = kit.slab(face.bm, (0.025 * sign, -0.06, 0.894), (0.015, 0, -0.004 * sign), (0, 0.004, 0), (0, 0, 0.0035))
        face.paint(faces_of(brow), HAIR)
    # A small yawn.
    yawn = kit.sphere(face.bm, (0, -0.058, 0.833), (0.011, 0.008, 0.013), 8, 6)
    face.paint(faces_of(yawn), MOUTH)
    parts.append(face)

    # Brown hair: a fringe under the hat and a short tail at the back.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.008, 0.876), (0.066, 0.072, 0.074), 14, 10)
    front = [v for v in verts if v.co.z < 0.81 or (v.co.y < -0.03 and v.co.z < 0.895)]
    kit.bmesh.ops.delete(hair.bm, geom=front, context="VERTS")
    tail = kit.cone(hair.bm, (0, 0.06, 0.85), (0, 0.085, 0.77), 0.03, 0.01, 7, squash=0.8)
    hair.paint(faces_of(tail), HAIR_LIGHT)
    tie = kit.torus(hair.bm, (0, 0.065, 0.84), (0, 0.4, -1), 0.024, 0.006, 8, 3)
    hair.paint(faces_of(tie), BLUE)
    for sign in (1, -1):
        lock = kit.cone(hair.bm, (0.055 * sign, -0.024, 0.88), (0.064 * sign, -0.02, 0.8), 0.016, 0.006, 6, squash=0.7)
        hair.paint(faces_of(lock), HAIR_LIGHT)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.73), (0, 0, 0.81), 0.023, 0.021, 8)
    parts.append(neck)
    return parts


def hat_parts():
    """The kettle hat: a round crown with a ridge and a wide, sloped brim."""
    hat = Part("hat", HAT, "hat", shade=0.16)
    c = HEAD_C + Vector((0, 0.004, 0.022))
    verts = kit.sphere(hat.bm, c, (0.077, 0.081, 0.076), 14, 9)
    kit.bmesh.ops.delete(hat.bm, geom=[v for v in verts if v.co.z < c.z - 0.004], context="VERTS")
    brim = kit.cone(hat.bm, c + Vector((0, 0, 0.002)), c + Vector((0, 0, -0.03)), 0.074, 0.122, 18, caps=False)
    hat.paint(faces_of(brim), STEEL)
    under = kit.cone(hat.bm, c + Vector((0, 0, -0.004)), c + Vector((0, 0, -0.034)), 0.072, 0.12, 18, caps=False)
    hat.paint(faces_of(under), STEEL_DARK)
    lip = kit.torus(hat.bm, c + Vector((0, 0, -0.032)), (0, 0, 1), 0.121, 0.005, 18, 3)
    hat.paint(faces_of(lip), STEEL_DARK)
    ridge = kit.tube(hat.bm, [c + Vector((0, -0.068, 0.012)), c + Vector((0, -0.03, 0.064)), c + Vector((0, 0.03, 0.064)), c + Vector((0, 0.07, 0.012))], [0.005] * 4, 4)
    hat.paint(faces_of(ridge), STEEL_DARK)
    return [hat]


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
    # The padded cream coat under the tabard.
    coat = Part("coat", COAT, torso_weights, shade=0.12)
    verts = kit.cone(coat.bm, (0, 0, 0.5), (0, 0, 0.73), 0.066, 0.084, 12, squash=0.78)
    for f in faces_of(verts):
        if int(f.calc_center_median().z * 60) % 2:
            coat.paint([f], COAT_DARK)
    parts.append(coat)

    collar = Part("collar", COAT, "chest", shade=0.06)
    kit.cone(collar.bm, (0, 0.006, 0.722), (0, 0.01, 0.772), 0.058, 0.048, 12, squash=0.85)
    parts.append(collar)

    # The long tabard: blue panels at the front and the back, gold edges,
    # and a gold lily on the chest.
    def tabard_grid(sign, offset):
        rows = []
        for z in (0.73, 0.64, 0.55, 0.47, 0.38, 0.31, 0.27):
            half = 0.052 if z > 0.6 else lerp(0.062, 0.078, clamp01((0.55 - z) / 0.28))
            depth = 0.074 if z > 0.5 else lerp(0.074, 0.106, clamp01((0.5 - z) / 0.23))
            if z > 0.68:
                depth = 0.066
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
            if row == 5 or column in (0, 5):
                return GOLD
            return BLUE

        edges = panel(tabard, tabard_grid(sign, 0.004), tabard_grid(sign, -0.002), color_of)
        tabard.paint(edges, GOLD_DARK)
        if sign < 0:
            lily(tabard, (0, -0.08, 0.6), (0, -1, 0), 0.05, GOLD)
        parts.append(tabard)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.49), (0, 0, 0.515), 0.083, 0.082, 12, squash=0.86)
    buckle = kit.box(belt.bm, (0, -0.074, 0.502), (0.022, 0.008, 0.02))
    belt.paint(faces_of(buckle), GOLD)
    pouch = kit.box(belt.bm, (0.08, -0.02, 0.47), (0.026, 0.032, 0.04))
    belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    # The quiver of bolts on the right hip, the camera side.
    quiver = Part("quiver", LEATHER, "hips", shade=0.08)
    top = Vector((-0.1, 0.03, 0.5))
    down = Vector((0.0, 0.25, -1)).normalized()
    kit.cone(quiver.bm, top, top + down * 0.15, 0.028, 0.024, 8, squash=0.8)
    rim = kit.torus(quiver.bm, top, down, 0.028, 0.004, 10, 3)
    quiver.paint(faces_of(rim), LEATHER_DARK)
    for dx, dy in ((0.0, 0.0), (0.012, 0.008), (-0.012, 0.008), (0.004, -0.012)):
        start = top + Vector((dx, dy, 0))
        shaft = kit.cone(quiver.bm, start - down * 0.0, start - down * 0.035, 0.003, 0.003, 4)
        quiver.paint(faces_of(shaft), WOOD)
        fletch = kit.cone(quiver.bm, start - down * 0.02, start - down * 0.05, 0.009, 0.002, 3)
        quiver.paint(faces_of(fletch), FLETCH)
    parts.append(quiver)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.42), (0, 0, 0.5), 0.066, 0.064, 12, squash=0.8)
    parts.append(hips)

    skirt = Part("skirt", COAT, skirt_weights, shade=0.1)

    def skirt_color(row, column):
        return COAT_DARK if column % 2 else COAT

    kit.ragged_cone(skirt, 0.5, 0.33, 0.07, 0.092, 16, 3, 0.8, 0.0, skirt_color, COAT_DARK)
    parts.append(skirt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        guard = Part(f"spaulder.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        top = kit.sphere(guard.bm, s + Vector((0.006 * sign, 0, 0.01)), (0.042, 0.04, 0.032), 10, 7)
        guard.paint({f for v in top if v.co.z < s.z - 0.006 for f in v.link_faces}, STEEL_DARK)
        parts.append(guard)

        sleeve = Part(f"sleeve.{side}", COAT, f"upperarm.{side}", shade=0.08)
        verts = kit.cone(sleeve.bm, s, e, 0.028, 0.024, 8)
        for f in faces_of(verts):
            if int((f.calc_center_median() - s).length * 60) % 2:
                sleeve.paint([f], COAT_DARK)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", COAT, f"forearm.{side}", shade=0.06)
        kit.cone(forearm.bm, e, w - d * 0.03, 0.024, 0.022, 8)
        parts.append(forearm)

        glove = Part(f"glove.{side}", GLOVE, f"hand.{side}")
        kit.cone(glove.bm, w - d * 0.055, w + d * 0.004, 0.026, 0.028, 8)
        kit.sphere(glove.bm, w + d * 0.02, (0.019, 0.018, 0.023), 8, 6)
        parts.append(glove)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.04, 0.031, 8)
        parts.append(thigh)

        # Tall boots with a turned-down top.
        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        kit.cone(boot.bm, knee - Vector((0, 0, 0.01)), ankle, 0.034, 0.03, 8)
        top = kit.cone(boot.bm, knee + Vector((0, 0, 0.012)), knee - Vector((0, 0, 0.04)), 0.042, 0.038, 8)
        boot.paint(faces_of(top), LEATHER)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.028, 0.024), (0.052, 0.108, 0.048))
        heel = kit.box(foot.bm, (LEG_X * sign, 0.012, 0.012), (0.05, 0.03, 0.024))
        foot.paint(faces_of(heel), LEATHER_DARK)
        parts.append(foot)
    return parts


def crossbow_parts():
    bow = Part("crossbow", WOOD, "crossbow", shade=0.04)
    # The stock: the butt at her shoulder and a long tiller to the prod.
    kit.slab(bow.bm, xb(-0.07, 0, -0.012), XBOW * 0.06, XBOW_SIDE * 0.017, XBOW_UP * 0.026)
    kit.slab(bow.bm, xb(0.09, 0, 0.004), XBOW * 0.15, XBOW_SIDE * 0.014, XBOW_UP * 0.014)
    plate = kit.slab(bow.bm, xb(-0.128, 0, -0.012), XBOW * 0.004, XBOW_SIDE * 0.019, XBOW_UP * 0.028)
    bow.paint(faces_of(plate), IRON)
    band = kit.slab(bow.bm, xb(0.17, 0, 0.004), XBOW * 0.008, XBOW_SIDE * 0.017, XBOW_UP * 0.017)
    bow.paint(faces_of(band), IRON)
    lever = kit.cone(bow.bm, xb(-0.01, 0, -0.012), xb(-0.05, 0, -0.05), 0.005, 0.004, 4)
    bow.paint(faces_of(lever), IRON)
    # The steel prod: a bow across the front, its tips swept back.
    tips = [xb(PROD - 0.03 * abs(s) ** 1.5, s * 0.14, 0.004) for s in (-1, -0.6, -0.25, 0, 0.25, 0.6, 1)]
    prod = kit.tube(bow.bm, tips, [0.005, 0.007, 0.009, 0.01, 0.009, 0.007, 0.005], 5)
    bow.paint(faces_of(prod), STEEL)
    stirrup = kit.torus(bow.bm, xb(PROD + 0.03, 0, 0.0), XBOW_UP, 0.024, 0.0045, 10, 3)
    bow.paint(faces_of(stirrup), IRON)

    string = Part("string", STRING, string_weights, shade=0)
    kit.tube(string.bm, [tips[0], xb(NUT, 0, 0.018), tips[-1]], [0.0028] * 3, 4, caps=False)

    bolt = Part("bolt", WOOD, "bolt", shade=0)
    start, end = xb(NUT, 0, 0.026), xb(PROD + 0.04, 0, 0.026)
    kit.tube(bolt.bm, [start, end], [0.0038, 0.0038], 4)
    head = kit.cone(bolt.bm, end, end + XBOW * 0.035, 0.009, 0.001, 4)
    bolt.paint(faces_of(head), STEEL)
    fletch = kit.slab(bolt.bm, start + XBOW * 0.03 + XBOW_UP * 0.006, XBOW * 0.02, XBOW_SIDE * 0.001, XBOW_UP * 0.008)
    bolt.paint(faces_of(fletch), FLETCH)
    return [bow, string, bolt]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CrossbowGuard", BONES)
    parts = head_parts() + hat_parts() + body_parts() + limb_parts() + crossbow_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CrossbowGuardMesh")
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

    def held(base, hand, direction, loosed=False, bolt=1.0):
        """The right hand and the crossbow by IK and `Aim`. `loosed` lets the string forward."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "forearm__L_slash_IK": 1.0,
                "crossbow_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "xbow_aim_at_rot": aimed(direction),
                "string_at_loc": at("string", XBOW * (PROD - NUT - 0.012)) if loosed else Vector(),
                "bolt_at_scale": bolt,
            },
        )

    def body(breath=0.0, doze=0.0):
        """
        The legs and the body of the shot: the left foot in front, turned a
        little to her right, the cheek on the stock. `doze` lets the head
        nod forward.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.004)),
            "hips": t("hips", (Z, -12)),
            "spine": t("spine", (Z, -2), (X, 2 + breath)),
            "chest": t("chest", (X, -2 - breath * 2), (Z, -4)),
            "neck": t("neck", (Z, 6), (X, 6 * doze)),
            "head": t("head", (Z, 6), (X, 4 + 16 * doze), (Y, -8 + 6 * doze)),
            "hat": t("hat", (Y, -12 - 4 * doze), (X, 8 * doze)),
            "thigh.L": t("thigh.L", (X, -18), (Y, -6)),
            "shin.L": t("shin.L", (X, 14)),
            "foot.L": t("foot.L", (X, 4)),
            "thigh.R": t("thigh.R", (X, 12), (Y, 8)),
            "shin.R": t("shin.R", (X, 6)),
            "foot.R": t("foot.R", (X, -18)),
            "tabard.F": t("tabard.F", (X, -10)),
            "tabard.B": t("tabard.B", (X, 6)),
        }

    # The aim: the stock at the right shoulder, the crossbow level.
    AIM_HAND = WR

    def stand(breath=0.0, doze=0.0):
        """The aim, steady and correct. `doze` lets the crossbow dip as she nods off."""
        return held(
            body(breath, doze),
            AIM_HAND + Vector((0, 0, -0.008 * breath - 0.03 * doze)),
            (0.04, -1, -0.28 * doze),
        )

    def winded(breath=0.0):
        """Low HP: asleep on her feet, bent over, the crossbow hanging low."""
        return held(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0.03, -0.04)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, 18 + breath * 4)),
                chest=t("chest", (X, 8 + breath * 3)),
                neck=t("neck", (X, 14)),
                head=t("head", (X, 20 + breath * 6), (Y, -12)),
                hat=t("hat", (Y, -18), (X, 14)),
                thigh__L=t("thigh.L", (X, -14), (Y, -6)),
                shin__L=t("shin.L", (X, 24)),
                foot__L=t("foot.L", (X, -8)),
                thigh__R=t("thigh.R", (X, -2), (Y, 6)),
                shin__R=t("shin.R", (X, 20)),
                foot__R=t("foot.R", (X, -16)),
                tabard__F=t("tabard.F", (X, 10)),
            ),
            (-0.05, -0.1, 0.5 - breath * 0.01),
            (0.35, -1, -0.45),
        )

    def recoil(base, amount=1.0):
        """The hit jolts her awake: the head snaps back and the crossbow kicks up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -2), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 6 * amount - 4)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            hat=t("hat", (Y, -12 + 14 * amount), (X, -12 * amount)),
            tabard__F=t("tabard.F", (X, -24 * amount)),
            ik_hand__R_at_pos=AIM_HAND + Vector((0, 0.04 * amount, 0.02 * amount)),
            xbow_aim_at_rot=aimed((0.04, -1, 0.5 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            hat=t("hat", (X, 20), (Y, -16)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            tabard__F=t("tabard.F", (X, 10)),
            tabard__B=t("tabard.B", (X, -16)),
            ik_hand__R_at_pos=Vector((-0.1, -0.08, 0.5)),
            xbow_aim_at_rot=aimed((0.2, -1, -0.7)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the hat over her face, the crossbow on her chest."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.12)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0), (Z, 0)),
            neck=t("neck", (Z, 0), (X, 0)),
            head=t("head", (X, -6), (Z, -20)),
            hat=t("hat", (X, 30), (Y, -6)),
            upperarm__L=t("upperarm.L", (Y, -40), (X, 30)),
            forearm__L=t("forearm.L", (X, -60)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, 30)),
            forearm__R=t("forearm.R", (X, -60)),
            hand__R=t("hand.R", (Z, -10)),
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
            crossbow_slash_Aim=0.0,
        )

    def crouch(base):
        """Low on one knee, the crossbow across the knee, as a summon starts and a Rebirth gets up."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.17)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, 24)),
                chest=t("chest", (X, 6)),
                neck=t("neck", (X, -6)),
                head=t("head", (X, -6)),
                thigh__L=t("thigh.L", (X, -72), (Y, -4)),
                shin__L=t("shin.L", (X, 92)),
                foot__L=t("foot.L", (X, -20)),
                thigh__R=t("thigh.R", (X, -4), (Y, 4)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -44)),
                tabard__F=t("tabard.F", (X, 36)),
                tabard__B=t("tabard.B", (X, -20)),
            ),
            (-0.08, -0.12, 0.4),
            (0.1, -1, -0.15),
        )

    def proud(base):
        """Up again, the crossbow up on her shoulder: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.004)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, -2)),
                chest=t("chest", (X, -8)),
                head=t("head", (Z, 6), (X, -8)),
                hat=t("hat", (Y, -10)),
                thigh__L=t("thigh.L", (X, -6), (Y, -4)),
                shin__L=t("shin.L", (X, 6)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 2), (Y, 4)),
                shin__R=t("shin.R", (X, 4)),
                foot__R=t("foot.R", (X, -6)),
                tabard__F=t("tabard.F", (X, 0)),
            ),
            (-0.1, -0.06, 0.66),
            (0.05, -0.5, 1),
        )

    # Carried for the walk: low at the hip, pointing forward and down.
    CARRY_HAND = Vector((-0.09, -0.08, 0.53))
    CARRY_AIM = (0.15, -1, -0.25)

    def step(front):
        """A plain walk, the crossbow at the hip. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return held(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0, -0.026)),
                hips=t("hips", (Z, -8), (Y, 4 * front)),
                spine=t("spine", (X, 6)),
                chest=t("chest", (Z, -4 * front)),
                head=t("head", (Z, 4), (X, 6), (Y, -6)),
                **{
                    f"thigh__{lead}": t(f"thigh.{lead}", (X, -30)),
                    f"shin__{lead}": t(f"shin.{lead}", (X, 16)),
                    f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                    f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                    f"shin__{back}": t(f"shin.{back}", (X, 22)),
                    f"foot__{back}": t(f"foot.{back}", (X, 10)),
                    "tabard__F": t("tabard.F", (X, -12 * front)),
                    "tabard__B": t("tabard.B", (X, 10)),
                },
            ),
            CARRY_HAND + Vector((0, 0, -0.01)),
            CARRY_AIM,
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return held(
            pose(
                body(),
                hips_at_loc=at("hips", (0, 0, -0.006)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, 6)),
                head=t("head", (Z, 4), (X, 6), (Y, -6)),
                **{
                    f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -26)),
                    f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                    f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                    f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                    f"shin__{planted}": t(f"shin.{planted}", (X, 10)),
                    f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                    "tabard__F": t("tabard.F", (X, -4)),
                    "tabard__B": t("tabard.B", (X, 6)),
                },
            ),
            CARRY_HAND + Vector((0, 0, 0.012)),
            CARRY_AIM,
        )

    def shot(kick=0.0, bolt=1.0, loosed=True):
        """The aim after the shot: the kick lifts the crossbow and the head."""
        return held(
            pose(body(), head=t("head", (Z, 6), (X, 4 - 10 * kick), (Y, -8))),
            AIM_HAND + Vector((0, 0.03 * kick, 0.012 * kick)),
            (0.04, -1, 0.3 * kick),
            loosed,
            bolt,
        )

    def reload(base, bolt=0.0, loosed=True):
        """The crossbow down at the hip, nose up, as she draws the string and sets a bolt."""
        return held(
            pose(
                base,
                spine=t("spine", (Z, -2), (X, 12)),
                chest=t("chest", (X, 4), (Z, -4)),
                neck=t("neck", (X, 10)),
                head=t("head", (Z, 2), (X, 16), (Y, -4)),
            ),
            (-0.08, -0.1, 0.55),
            (0.15, -0.6, 0.6),
            loosed,
            bolt,
        )

    clips = []
    # She nods off: the head drops and the crossbow dips, then she snaps awake.
    idle = Clip("idle", 48, loop=True)
    idle.key(0, stand(0, 0)).key(12, stand(0.5, 0.25)).key(24, stand(1, 0.6)).key(32, stand(0.5, 0.85))
    idle.key(36, stand(0, -0.15)).key(40, stand(0, 0.05)).key(48, stand(0, 0))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    # The attack: the bolt leaves at 20% (frame 6 of 30), with a kick. Then
    # she lowers the crossbow, draws the string, sets a new bolt and aims.
    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, stand()).key(5, stand())
    attack.key(6, shot(0.4)).key(8, shot(1.0)).key(11, shot(0.3))
    attack.key(15, reload(body(), 0.0, True)).key(19, reload(body(), 0.0, False)).key(22, reload(body(), 1.0, False))
    attack.key(27, stand()).key(30, stand())
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
    rebirth.key(32, crouch(body())).key(41, proud(body())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(body())).key(10, pose(crouch(body()), hips_at_loc=at("hips", (0, 0.03, -0.19))))
    summon.key(17, proud(body())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "crossbow-guard.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
