"""
Coffin Lancer (`undead.coffinLancer`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a skeleton knight in rusty plate
with tarnished silver trim, an open sallet with a ragged teal crest, glowing
pale eyes in the skull, a ragged teal cloak and tabard, and a long ornate
rusted lance. An upright coffin stands in front of him as a shield (Bulwark),
its lid to the enemy with a gold fleur, and a pillow still tied inside. Run it
in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/coffin-lancer.glb`; then
`bun unit-model:pack coffin-lancer` packs it for the game.

At rest he kneels behind the coffin with the lance level beside it. The
coffin turns its lid to the camera side, so the camera sees the fleur. The
left hand always holds the coffin (IK to the `grip.L` bone). The right hand
holds the lance with IK, and the lance aims with the `Aim` constraint. In
the walk he stands and carries the coffin in front of him. In the death the
coffin falls on top of him like a lid; in his Rebirth it stands up again and
he rises stiffly, as the dead do. He has no Keyword that he uses by his own
action, so he has no cast clip.
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

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
STEEL = hex_color("#a39a88")
STEEL_DARK = hex_color("#6a6357")
RUST = hex_color("#8f5f3a")
SILVER = hex_color("#c9c7bd")
GOLD = hex_color("#c9a24a")
TEAL = hex_color("#4d6e6b")
TEAL_DARK = hex_color("#334a48")
LEATHER = hex_color("#5a3a22")
WOOD = hex_color("#7a5c40")
WOOD_DARK = hex_color("#4e3a28")
LINING = hex_color("#3a4a50")
PILLOW = hex_color("#ece3cc")
PILLOW_DARK = hex_color("#c9bea2")
IRON = hex_color("#4a4744")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.42
WAIST_Z = 0.5
CHEST_Z = 0.6
SHOULDER_Z = 0.7
NECK_Z = 0.74
HEAD_C = Vector((0, -0.01, 0.84))
KNEE_Z = 0.24
ANKLE_Z = 0.055
LEG_X = 0.07
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


# The coffin stands on its foot in front, its lid turned 35 degrees to the
# camera side (-X). `u` goes across it (-1 to 1), `v` up it (0 to 1).
COFFIN_FOOT = Vector((-0.01, -0.25, 0))
COFFIN_TURN = math.radians(35)
COFFIN_N = Vector((-math.sin(COFFIN_TURN), -math.cos(COFFIN_TURN), 0))
COFFIN_W = Z.cross(COFFIN_N).normalized()
COFFIN_HEIGHT = 0.6
COFFIN_DEPTH = 0.075
COFFIN_LID = 0.016
# The outline of a coffin: narrow at the foot, widest at the shoulders.
COFFIN_OUTLINE = ((0.0, 0.075), (0.7, 0.135), (1.0, 0.09))


def coffin_half(v):
    """The half width of the coffin at `v`."""
    (v0, w0), (v1, w1), (v2, w2) = COFFIN_OUTLINE
    if v <= v1:
        return lerp(w0, w1, (v - v0) / (v1 - v0))
    return lerp(w1, w2, (v - v1) / (v2 - v1))


def coffin_point(u, v, depth=0.0):
    """A point on the lid of the coffin; `depth` goes back from the lid, toward him."""
    return COFFIN_FOOT + COFFIN_W * (u * coffin_half(v)) + Z * (0.01 + v * COFFIN_HEIGHT) - COFFIN_N * depth


# The left hand holds the inside edge of the coffin. The right hand holds the
# lance under the arm, level, beside the camera-side edge of the coffin.
SL = Vector((0.135, 0, SHOULDER_Z))
WL = coffin_point(0.45, 0.72, COFFIN_DEPTH + 0.02)
EL = bend(SL, WL, (1, 0.3, -1))
TL = WL + (WL - EL).normalized() * 0.04
SR = Vector((-0.135, 0, SHOULDER_Z))
WR = Vector((-0.13, -0.1, 0.5))
ER = bend(SR, WR, (-1, 0.5, -0.3))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
GRIP_R = WR + DR * 0.025

LANCE = Vector((-0.12, -1, 0)).normalized()
LANCE_SIDE = LANCE.cross(Z).normalized()
LANCE_UP = LANCE_SIDE.cross(LANCE).normalized()
LANCE_BUTT = -0.22
LANCE_TIP = 0.66


def la(a, b=0.0, c=0.0):
    """A point on the lance at rest: `a` along it from the grip, `b` to its side, `c` up."""
    return GRIP_R + LANCE * a + LANCE_SIDE * b + LANCE_UP * c


BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.77), "chest"),
    ("head", (0, 0, 0.77), (0, 0, 0.95), "neck"),
    ("jaw", (0, -0.01, 0.81), (0, -0.07, 0.79), "head"),
    ("cape", (0, 0.09, 0.68), (0, 0.13, 0.28), "chest"),
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
    ("lance", tuple(GRIP_R), tuple(GRIP_R + LANCE * 0.1), "hand.R"),
    # The coffin stands on the ground: it does not fall with the root.
    ("ground", (0, 0.2, 0), (0, 0.2, 0.1), None),
    ("coffin", tuple(COFFIN_FOOT), tuple(COFFIN_FOOT + Z * 0.15), "ground"),
    ("grip.L", tuple(WL), tuple(WL + Z * 0.05), "coffin"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.46, 0.54)
    return blend("spine", "chest", co.z, 0.57, 0.64)


def skirt_weights(co):
    """The rags at the waist follow the hips at the top, the thighs in front and the back flap behind."""
    t = clamp01((0.46 - co.z) / 0.2)
    back = clamp01((co.y - 0.02) / 0.08)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "skirt.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side + 0.5),
        "thigh.R": (1 - back) * t * clamp01(-side + 0.5),
    }


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.52, 0.64)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.064, 0.07, 0.074), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.04 * sign, -0.05, -0.022)), (0.022, 0.02, 0.016), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.062, 0.022)), (0.1, 0.014, 0.016))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    sockets = Part("sockets", SOCKET, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(sockets.bm, HEAD_C + Vector((0.026 * sign, -0.06, 0.004)), (0.02, 0.012, 0.018), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.067, -0.02)), HEAD_C + Vector((0, -0.069, -0.004)), 0.01, 0.002, 4)
    parts.append(sockets)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.026 * sign, -0.07, 0.004)), (0.009, 0.005, 0.009), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.04, 0.785), (0.05, 0.04, 0.026), 10, 6)
    teeth = kit.box(jaw.bm, (0, -0.072, 0.8), (0.06, 0.008, 0.014))
    jaw.paint(faces_of(teeth), BONE_DARK)
    parts.append(jaw)

    # The sallet: an open steel helmet with a silver rim, a brim that sweeps
    # down at the back, and a ragged teal crest.
    helmet = Part("helmet", STEEL, "head", shade=0.12)
    verts = kit.sphere(helmet.bm, HEAD_C + Vector((0, 0.006, 0.012)), (0.077, 0.082, 0.082), 14, 10)
    face = [v for v in verts if v.co.y < -0.02 and HEAD_C.z - 0.08 < v.co.z < HEAD_C.z + 0.035 and abs(v.co.x) < 0.066]
    kit.bmesh.ops.delete(helmet.bm, geom=face, context="VERTS")
    for face_ in list(helmet.bm.faces):
        c = face_.calc_center_median()
        if c.y > 0.02 and c.z < HEAD_C.z:
            helmet.paint([face_], RUST)
    tail = kit.cone(helmet.bm, HEAD_C + Vector((0, 0.05, -0.01)), HEAD_C + Vector((0, 0.12, -0.06)), 0.06, 0.03, 10, squash=0.5)
    helmet.paint(faces_of(tail), STEEL_DARK)
    rim = kit.torus(helmet.bm, HEAD_C + Vector((0, 0.004, 0.036)), (0, 0.12, 1), 0.08, 0.007, 16, 4)
    helmet.paint(faces_of(rim), SILVER)
    ridge = kit.tube(helmet.bm, [HEAD_C + Vector((0, -0.07, 0.05)), HEAD_C + Vector((0, -0.02, 0.095)), HEAD_C + Vector((0, 0.05, 0.085)), HEAD_C + Vector((0, 0.09, 0.04))], [0.008] * 4, 4)
    helmet.paint(faces_of(ridge), SILVER)
    parts.append(helmet)

    crest = Part("crest", TEAL, "head", shade=0.1)
    for index in range(4):
        base = HEAD_C + Vector((0, -0.01 + 0.03 * index, 0.09 - 0.008 * index))
        tip = base + Vector((0.01 * ((index % 2) * 2 - 1), 0.1 + 0.02 * index, 0.04 - 0.035 * index))
        verts = kit.cone(crest.bm, base, tip, 0.018, 0.003, 5, squash=0.45)
        crest.paint(faces_of(verts), TEAL_DARK if index % 2 else TEAL)
    parts.append(crest)
    return parts


def body_parts():
    parts = []
    cuirass = Part("cuirass", STEEL, torso_weights)
    verts = kit.cone(cuirass.bm, (0, 0, 0.44), (0, 0, 0.7), 0.1, 0.115, 12, squash=0.78)
    for face in faces_of(verts):
        c = face.calc_center_median()
        if int((c.x * 3 + c.z) * 40) % 5 == 0:
            cuirass.paint([face], RUST)
    # A silver ridge down the breastplate.
    keel = kit.tube(cuirass.bm, [(0, -0.088, 0.47), (0, -0.094, 0.6), (0, -0.088, 0.68)], [0.008] * 3, 4)
    cuirass.paint(faces_of(keel), SILVER)
    parts.append(cuirass)

    gorget = Part("gorget", STEEL_DARK, "chest")
    kit.cone(gorget.bm, (0, 0, 0.68), (0, 0, 0.77), 0.09, 0.035, 12, squash=0.85)
    kit.cone(gorget.bm, (0, 0, 0.74), (0, 0, 0.8), 0.018, 0.018, 6)
    parts.append(gorget)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.43), (0, 0, 0.46), 0.108, 0.106, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.088, 0.445), (0.03, 0.012, 0.028))
    belt.paint(faces_of(buckle), SILVER)
    parts.append(belt)

    fauld = Part("fauld", STEEL_DARK, "hips")
    kit.cone(fauld.bm, (0, 0, 0.34), (0, 0, 0.43), 0.112, 0.104, 12, squash=0.8)
    parts.append(fauld)

    # Ragged teal cloth at the waist, open at the sides, to the knees.
    def rag_color(row, column):
        return TEAL_DARK if column % 3 == 1 or row >= 3 else TEAL

    skirt = Part("skirt", TEAL, skirt_weights, shade=0.1)
    kit.ragged_cone(skirt, 0.44, 0.22, 0.11, 0.15, 12, 4, 0.8, 0.07, rag_color, TEAL_DARK, gap=math.radians(18))
    parts.append(skirt)

    def cape_color(row, column):
        return TEAL_DARK if column % 3 == 1 or row >= 4 else TEAL

    cape = Part("cape", TEAL, cape_weights)
    kit.ragged_cone(cape, 0.7, 0.1, 0.1, 0.19, 14, 5, 0.75, 0.14, cape_color, TEAL_DARK, gap=math.radians(95), y_push=0.08)
    parts.append(cape)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(pauldron.bm, s + Vector((0.012 * sign, 0, 0.01)), (0.062, 0.058, 0.05), 10, 7)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.02 for f in v.link_faces}, SILVER)
        parts.append(pauldron)

        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.018, 0.016, 6)
        parts.append(upper)

        elbow = Part(f"elbow.{side}", STEEL_DARK, f"forearm.{side}", shade=0.05)
        kit.sphere(elbow.bm, e, (0.03, 0.03, 0.03), 8, 6)
        parts.append(elbow)

        vambrace = Part(f"vambrace.{side}", STEEL, f"forearm.{side}")
        verts = kit.cone(vambrace.bm, e + d * 0.02, w, 0.032, 0.028, 8)
        vambrace.paint({f for v in verts if (v.co - w).length < 0.014 for f in v.link_faces}, SILVER)
        parts.append(vambrace)

        # A gauntlet with bony fingers.
        hand = Part(f"hand.{side}", STEEL_DARK, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.022, (0.022, 0.018, 0.024), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.008 * index, -0.006, 0))
            finger = kit.cone(hand.bm, w + d * 0.03 + offset, w + d * 0.058 + offset, 0.005, 0.003, 4)
            hand.paint(faces_of(finger), BONE)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.022, 0.02, 6)
        parts.append(femur)

        cuisse = Part(f"cuisse.{side}", STEEL, f"thigh.{side}")
        kit.cone(cuisse.bm, hip + Vector((0, -0.01, -0.06)), knee + Vector((0, -0.01, 0.04)), 0.046, 0.04, 8)
        parts.append(cuisse)

        poleyn = Part(f"poleyn.{side}", SILVER, f"shin.{side}", shade=0.05)
        kit.sphere(poleyn.bm, knee + Vector((0, -0.014, 0)), (0.04, 0.036, 0.034), 8, 6)
        parts.append(poleyn)

        greave = Part(f"greave.{side}", STEEL, f"shin.{side}")
        verts = kit.cone(greave.bm, knee, ankle, 0.042, 0.036, 8)
        greave.paint({f for v in verts if v.co.z < 0.12 for f in v.link_faces}, RUST)
        parts.append(greave)

        sabaton = Part(f"sabaton.{side}", STEEL_DARK, f"foot.{side}", shade=0.05)
        kit.box(sabaton.bm, (LEG_X * sign, -0.035, 0.03), (0.07, 0.14, 0.06))
        toe = kit.cone(sabaton.bm, (LEG_X * sign, -0.1, 0.022), (LEG_X * sign, -0.13, 0.018), 0.03, 0.012, 6, squash=0.5)
        sabaton.paint(faces_of(toe), RUST)
        parts.append(sabaton)
    return parts


def lance_parts():
    lance = Part("lance", WOOD, "lance", shade=0.04)
    # The shaft: thick at the butt, thin at the head, with rusty bands.
    shaft = kit.cone(lance.bm, la(LANCE_BUTT), la(LANCE_TIP - 0.1), 0.02, 0.011, 8)
    lance.paint(faces_of(shaft), RUST)
    for along in (-0.15, 0.2, 0.32, 0.44):
        band = kit.cone(lance.bm, la(along), la(along + 0.016), 0.021 - along * 0.012, 0.021 - along * 0.012, 8)
        lance.paint(faces_of(band), GOLD)
    # The vamplate: a cone guard in front of the hand.
    vamplate = kit.cone(lance.bm, la(0.03), la(0.13), 0.05, 0.014, 10)
    lance.paint(faces_of(vamplate), STEEL)
    rim = kit.torus(lance.bm, la(0.03), LANCE, 0.05, 0.006, 12, 4)
    lance.paint(faces_of(rim), SILVER)
    # The steel head: a long leaf blade with two barbs at its base.
    socket = kit.cone(lance.bm, la(LANCE_TIP - 0.12), la(LANCE_TIP - 0.08), 0.012, 0.014, 6)
    lance.paint(faces_of(socket), GOLD)
    blade = kit.cone(lance.bm, la(LANCE_TIP - 0.08), la(LANCE_TIP), 0.022, 0.001, 4, squash=0.4)
    lance.paint(faces_of(blade), SILVER)
    for b in (-1, 1):
        barb = kit.cone(lance.bm, la(LANCE_TIP - 0.07), la(LANCE_TIP - 0.1, 0.03 * b, 0.0), 0.006, 0.001, 3)
        lance.paint(faces_of(barb), SILVER)
    # A ragged teal pennon below the head.
    pennon = kit.cone(lance.bm, la(LANCE_TIP - 0.16, 0, -0.005), la(LANCE_TIP - 0.3, 0, -0.06), 0.03, 0.004, 4, squash=0.2)
    lance.paint(faces_of(pennon), TEAL)
    return [lance]


def coffin_parts():
    coffin = Part("coffin", WOOD, "coffin", shade=0.06)
    columns, rows = 6, 10
    vs = (0.0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.7, 0.8, 0.9, 1.0, 1.0)

    def grid(depth):
        return [[coffin_point(lerp(-1, 1, c / columns), vs[r], depth) for c in range(columns + 1)] for r in range(rows + 1)]

    def lid_color(face_side, row, column):
        if face_side == "back":
            return LINING
        if column in (0, columns - 1) or row in (0, rows - 2):
            return SILVER
        return WOOD_DARK if (row + column) % 4 == 0 else WOOD

    # The lid (the bottom of the coffin) faces the enemy; the coffin is open at the back.
    edges = panel(coffin, grid(0.0), grid(COFFIN_LID), lid_color)
    coffin.paint(edges, SILVER)

    # The side walls go back toward him, around the outline.
    outline = [(-1, v) for v in vs[:-1]] + [(1, v) for v in reversed(vs[:-1])]
    for (u0, v0), (u1, v1) in zip(outline, outline[1:] + outline[:1]):
        if u0 != u1 and v0 != v1:
            continue
        a, b = coffin_point(u0, v0, COFFIN_LID), coffin_point(u1, v1, COFFIN_LID)
        if (a - b).length < 1e-4:
            continue
        mid = (a + b) / 2 - COFFIN_N * (COFFIN_DEPTH / 2)
        along = (b - a) / 2
        out = along.cross(COFFIN_N).normalized() * 0.007
        if out.dot(mid - coffin_point(0, 0.5, COFFIN_DEPTH / 2)) < 0:
            out = -out
        wall = kit.slab(coffin.bm, mid, along * 1.06, -COFFIN_N * (COFFIN_DEPTH / 2), out)
        coffin.paint(faces_of(wall), WOOD_DARK)
    # The top and the foot of the coffin close it.
    for v in (0.0, 1.0):
        a, b = coffin_point(-1, v, COFFIN_LID), coffin_point(1, v, COFFIN_LID)
        mid = (a + b) / 2 - COFFIN_N * (COFFIN_DEPTH / 2)
        cap = kit.slab(coffin.bm, mid, (b - a) / 2, -COFFIN_N * (COFFIN_DEPTH / 2), Z * 0.007)
        coffin.paint(faces_of(cap), WOOD_DARK)

    def on_lid(u, v, lift=0.004):
        return coffin_point(u, v) + COFFIN_N * lift

    # The big gold fleur on the lid, and a gold cross below it.
    gold = set()
    center = on_lid(0, 0.6, 0.008)
    gold |= set(kit.cone(coffin.bm, center - Z * 0.04, center + Z * 0.11, 0.026, 0.002, 4, squash=0.35))
    for sign in (1, -1):
        side = COFFIN_W * sign
        gold |= set(kit.tube(coffin.bm, [center - Z * 0.005 + side * 0.01, center + Z * 0.045 + side * 0.04, center + Z * 0.05 + side * 0.07, center + Z * 0.02 + side * 0.08, center + side * 0.072], [0.012, 0.012, 0.009, 0.006, 0.003], 4))
    gold |= set(kit.slab(coffin.bm, center - Z * 0.02, COFFIN_W * 0.045, COFFIN_N * 0.005, Z * 0.01))
    gold |= set(kit.cone(coffin.bm, center - Z * 0.03, center - Z * 0.09, 0.02, 0.003, 4, squash=0.35))
    cross = on_lid(0, 0.26, 0.006)
    gold |= set(kit.slab(coffin.bm, cross, COFFIN_W * 0.008, COFFIN_N * 0.004, Z * 0.07))
    gold |= set(kit.slab(coffin.bm, cross + Z * 0.025, COFFIN_W * 0.04, COFFIN_N * 0.004, Z * 0.008))
    coffin.paint(faces_of(gold), GOLD)
    # Iron studs down both edges.
    for v in (0.1, 0.3, 0.5, 0.82):
        for sign in (1, -1):
            stud = kit.sphere(coffin.bm, on_lid(0.78 * sign, v, 0.004), (0.009, 0.009, 0.009), 5, 3)
            coffin.paint(faces_of(stud), IRON)

    # The pillow, still tied in at the head end, peeks over the top.
    pillow = Part("pillow", PILLOW, "coffin", shade=0.08)
    head = coffin_point(0, 0.9, COFFIN_LID + 0.028)
    kit.sphere(pillow.bm, head, (0.07, 0.024, 0.045), 10, 6)
    for sign in (1, -1):
        tie = kit.tube(pillow.bm, [head + COFFIN_W * (0.06 * sign), head + COFFIN_W * (0.09 * sign) + Z * 0.02, head + COFFIN_W * (0.1 * sign) - Z * 0.02], [0.005] * 3, 4)
        pillow.paint(faces_of(tie), TEAL)
    seam = kit.torus(pillow.bm, head, COFFIN_N, 0.05, 0.003, 10, 3)
    pillow.paint(faces_of(seam), PILLOW_DARK)
    return [coffin, pillow]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CoffinLancer", BONES)
    parts = head_parts() + body_parts() + limb_parts() + lance_parts() + coffin_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CoffinLancerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the coffin, the right hand on the lance. The lance aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "lance_aim": kit.add_empty("lance_aim"),
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
    aim = bones["lance"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["lance_aim"]
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

    lance_rest = rig.data.bones["lance"].matrix_local.to_quaternion()
    rest_frame = Matrix((LANCE, LANCE_SIDE, LANCE_UP)).transposed()

    def aimed(direction):
        """The world rotation of the lance that points it along `direction`, the side level."""
        forward = Vector(direction).normalized()
        side = forward.cross(Z).normalized()
        frame = Matrix((forward, side, side.cross(forward))).transposed()
        return (frame @ rest_frame.transposed()).to_quaternion() @ lance_rest

    # The couch: the right hand at the hip, the lance level past the coffin.
    COUCH = Vector((-0.14, -0.03, 0.36))
    LEVEL = (-0.12, -1, 0.0)

    def kneel(breath=0.0, sway=0.0):
        """Down on the right knee behind the coffin, the left knee up, the jaw a little loose."""
        return {
            "hips@loc": at("hips", (0, 0.06, -0.2 - breath * 0.004)),
            "hips": t("hips", (Z, -8)),
            "spine": t("spine", (X, 12)),
            "chest": t("chest", (X, 2), (Y, sway * 2)),
            "neck": t("neck", (X, -4)),
            "head": t("head", (X, -4), (Z, 10 + sway * 6), (Y, -6)),
            "jaw": t("jaw", (X, -4 - breath * 10)),
            "thigh.L": t("thigh.L", (X, -80), (Y, -4)),
            "shin.L": t("shin.L", (X, 80)),
            "foot.L": t("foot.L", (X, 0)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 4)),
            "shin.R": t("shin.R", (X, 94)),
            "foot.R": t("foot.R", (X, -44)),
            "skirt.B": t("skirt.B", (X, 30)),
            "cape": t("cape", (X, 10), (Y, sway * 4)),
            "forearm.L/IK": 1.0,
        }

    def couched(base, hand=None, direction=LEVEL):
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "lance_slash_Aim": 1.0,
                "ik_hand__R_at_pos": hand or COUCH,
                "lance_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, sway=0.0):
        """The idle: he kneels behind the coffin, the lance level and ready."""
        return couched(kneel(breath, sway), COUCH + Vector((0, 0, -breath * 0.004)))

    def sag(breath=0.0):
        """Low HP: the bones sag, the skull hangs to one side and the lance tip droops."""
        return couched(
            pose(
                kneel(),
                hips_at_loc=at("hips", (0, 0.08, -0.24 - breath * 0.006)),
                spine=t("spine", (X, 26 + breath * 3)),
                chest=t("chest", (X, 8), (Y, -6)),
                neck=t("neck", (X, 10)),
                head=t("head", (Z, 6), (Y, -22 - breath * 4), (X, 10)),
                jaw=t("jaw", (X, -22 - breath * 6)),
                cape=t("cape", (X, 20)),
                coffin=t("coffin", (COFFIN_W, -4)),
            ),
            COUCH + Vector((0, 0.02, -0.04)),
            (-0.12, -1, -0.32 - breath * 0.05),
        )

    def recoil(base, amount=1.0):
        """The hit lands on the coffin: it rocks back, and the bones rattle."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.06 + 0.025 * amount, -0.2)),
            spine=t("spine", (X, 12 - 14 * amount)),
            head=t("head", (X, -16 * amount), (Z, 12 * amount)),
            jaw=t("jaw", (X, -26 * amount)),
            coffin=t("coffin", (COFFIN_W, -9 * amount)),
            cape=t("cape", (X, 10 + 14 * amount)),
            ik_hand__R_at_pos=COUCH + Vector((0, 0.04 * amount, 0.03 * amount)),
            lance_aim_at_rot=aimed((-0.12, -1, 0.22 * amount)),
        )

    def topple(base):
        """Part way into the death: he lets go of the lance and tips back; the coffin tips after him."""
        return pose(
            base,
            forearm__R_slash_IK=0.0,
            lance_slash_Aim=0.0,
            forearm__L_slash_IK=0.0,
            hips_at_loc=at("hips", (0, 0.1, -0.24)),
            spine=t("spine", (X, -18)),
            head=t("head", (X, -24)),
            jaw=t("jaw", (X, -26)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -20)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 20)),
            coffin=t("coffin", (COFFIN_W, -30), (Z, 10)),
            coffin_at_loc=at("coffin", (0.0, 0.08, 0.04)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the lance at his side; the coffin lies on top of him like a lid."""
        return pose(
            base,
            forearm__R_slash_IK=0.0,
            lance_slash_Aim=0.0,
            forearm__L_slash_IK=0.0,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.07)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -25)),
            jaw=t("jaw", (X, -24)),
            upperarm__R=t("upperarm.R", (Y, 30), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, -30), (X, 10)),
            forearm__L=t("forearm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, 0)),
            shin__L=t("shin.L", (X, 0)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 0)),
            shin__R=t("shin.R", (X, 0)),
            foot__R=t("foot.R", (X, 0)),
            skirt__B=t("skirt.B", (X, -40)),
            cape=t("cape", (X, -20)),
            lance=t("lance", (X, -80)),
            # The coffin tips back, turns along him and covers him from the knees to the chest.
            coffin=t("coffin", (COFFIN_W, -86 + bounce), (Z, 35)),
            coffin_at_loc=at("coffin", (0.0, 0.3, 0.15)),
        )

    def hop(base):
        """He is down; the coffin hops onto his shins, still upright, before it slams shut on him."""
        return pose(
            fallen(base),
            coffin=t("coffin", (COFFIN_W, -24), (Z, 35)),
            coffin_at_loc=at("coffin", (0.0, 0.3, 0.16)),
        )

    def risen(base, lean):
        """The stiff rise of the dead: straight, turning up about the feet. The coffin stands up first."""
        rise = lean / 86
        return pose(
            fallen(base),
            root=t("root", (X, -lean)),
            root_at_loc=at("root", (0, 0, 0.07 * rise)),
            head=t("head", (X, 10)),
            jaw=t("jaw", (X, -30)),
            cape=t("cape", (X, lerp(-4, -20, rise))),
            coffin=t("coffin", (COFFIN_W, 0)),
            coffin_at_loc=Vector(),
        )

    def upright(breath=0.0):
        """Standing, the lance level at the hip: the walk."""
        return couched(
            {
                "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
                "hips": t("hips", (Z, -10)),
                "spine": t("spine", (X, 6 + breath)),
                "chest": t("chest", (X, -2)),
                "head": t("head", (X, 2), (Z, 8)),
                "jaw": t("jaw", (X, -8)),
                "thigh.L": t("thigh.L", (X, -8), (Y, -3)),
                "shin.L": t("shin.L", (X, 12)),
                "thigh.R": t("thigh.R", (X, 6), (Y, 3)),
                "shin.R": t("shin.R", (X, 8)),
                "foot.R": t("foot.R", (X, -12)),
                "forearm.L/IK": 1.0,
                # The coffin comes up off the ground and leans back on him.
                "coffin@loc": at("coffin", (0.0, 0.08, 0.1)),
                "coffin": t("coffin", (COFFIN_W, -8)),
            },
            Vector((-0.15, -0.05, 0.5)),
        )

    def step(front):
        """A stiff march with the coffin carried in front. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            upright(),
            hips_at_loc=at("hips", (0, 0, -0.018)),
            spine=t("spine", (X, 8), (Y, 3 * front)),
            jaw=t("jaw", (X, -12)),
            coffin_at_loc=at("coffin", (0.0, 0.08, 0.085)),
            coffin=t("coffin", (COFFIN_W, -8), (Z, 3 * front)),
            ik_hand__R_at_pos=Vector((-0.15, -0.05, 0.49)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "skirt__B": t("skirt.B", (X, 8)),
                "cape": t("cape", (X, 8), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            upright(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (X, 8)),
            jaw=t("jaw", (X, -2)),
            coffin_at_loc=at("coffin", (0.0, 0.08, 0.11)),
            ik_hand__R_at_pos=Vector((-0.15, -0.05, 0.51)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -14)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "skirt__B": t("skirt.B", (X, 4)),
                "cape": t("cape", (X, 6)),
            },
        )

    # The attack: he draws the lance back, then thrusts it past the coffin.
    # The slash effect starts at 50% of the attack (`MELEE_IMPACT` in
    # fx.ts), so the lance head lands at frame 15 of 30.
    def draw(base):
        return couched(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.09, -0.2)),
                hips=t("hips", (Z, -18)),
                spine=t("spine", (X, 8), (Z, -8)),
                head=t("head", (Z, 18), (X, -4)),
                jaw=t("jaw", (X, -14)),
            ),
            COUCH + Vector((-0.01, 0.14, 0.03)),
            (-0.1, -1, 0.04),
        )

    def thrust(base):
        return couched(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.02, -0.19)),
                hips=t("hips", (Z, 6)),
                spine=t("spine", (X, 22), (Z, 6)),
                chest=t("chest", (X, 6)),
                head=t("head", (Z, 2), (X, -16)),
                jaw=t("jaw", (X, -30)),
                cape=t("cape", (X, 30)),
            ),
            COUCH + Vector((-0.02, -0.28, 0.07)),
            (-0.1, -1, -0.04),
        )

    def crouch(base):
        """Down low with the coffin flat in front: a summon starts."""
        return pose(
            kneel(),
            forearm__R_slash_IK=0.0,
            lance_slash_Aim=0.0,
            forearm__L_slash_IK=0.0,
            hips_at_loc=at("hips", (0, 0.08, -0.24)),
            spine=t("spine", (X, 34)),
            head=t("head", (X, 20)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, -10)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 10)),
            coffin=t("coffin", (COFFIN_W, 80)),
            coffin_at_loc=at("coffin", (0, 0, 0.01)),
        )

    def plant(base):
        """He stands the coffin up again, and the jaw clacks."""
        return pose(
            base,
            jaw=t("jaw", (X, -26)),
            coffin=t("coffin", (COFFIN_W, 6)),
            coffin_at_loc=at("coffin", (0, 0, 0.03)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (20, 1, 0.4), (24, 0, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, sag(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, draw(kneel())).key(15, thrust(kneel())).key(20, thrust(kneel()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, topple(stand())).key(20, hop(stand()))
    death.key(27, fallen(stand())).key(31, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls and the coffin shuts on him (45% of the event,
    # `REBORN_FALL`). Then the coffin stands up, and he rises stiffly about
    # the feet and kneels again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(10, topple(stand())).key(16, hop(stand()))
    rebirth.key(21, fallen(stand())).key(24, fallen(stand(), 3))
    rebirth.key(30, risen(stand(), 80)).key(37, risen(stand(), 0)).key(42, plant(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, crouch(stand())).key(17, plant(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "coffin-lancer.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
