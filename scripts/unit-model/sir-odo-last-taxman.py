"""
Sir Odo, the Last Taxman (`undead.sirOdoLastTaxman`), a Unit Model (art
direction 2.2).

A tabletop miniature of the card painting: a skeleton knight in rusty plate,
an open helmet with a small gold crown, glowing pale eyes in the skull and a
big white moustache, a ragged teal cloak, a teal tabard with the gold scales
of the tax office, a coin pouch at the belt, a giant quill for a spear in the
right hand and a heavy ledger for a shield on the left arm. Run it in Blender
(see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/sir-odo-last-taxman.glb`; then
`bun unit-model:pack sir-odo-last-taxman` packs it for the game.

The Battle camera sees the right side of a player Unit, so at rest he turns
to his right: the ledger and the quill then both face the camera. His attack
(Charge) is a run and a stab of the quill. His Rebirth rises stiffly from the
feet, as the dead do. He has no Keyword that he uses by his own action, so he
has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
MOUSTACHE = hex_color("#f4f1e8")
STEEL = hex_color("#958f83")
STEEL_DARK = hex_color("#615c53")
RUST = hex_color("#8a6040")
GOLD = hex_color("#d4a640")
TEAL = hex_color("#4d6e6b")
TEAL_DARK = hex_color("#334a48")
LEATHER = hex_color("#5a3a22")
BOOK = hex_color("#6b4a2e")
PAGES = hex_color("#efe5c8")
QUILL = hex_color("#f0ebdc")
QUILL_DARK = hex_color("#c5bca5")
INK = hex_color("#25212a")

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

# The left arm holds the ledger across the body; the right hand holds the
# quill upright in front. These are the rest (bind) positions.
SL = Vector((0.135, 0, SHOULDER_Z))
EL = Vector((0.2, -0.07, 0.56))
WL = Vector((0.09, -0.12, 0.5))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.135, 0, SHOULDER_Z))
ER = Vector((-0.17, 0.02, 0.55))
WR = Vector((-0.17, -0.1, 0.52))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.03
GRIP_L = WL + (WL - EL).normalized() * 0.026

# The ledger stands upright in front of the left arm, its cover to the front.
BOOK_C = Vector((0.1, -0.19, 0.48))
BOOK_SIZE = Vector((0.17, 0.05, 0.24))

# The quill: the feather goes up and a little back, the steel nib down and forward.
QUILL_UP = Vector((0, 0.3, 1)).normalized()
QUILL_SIDE = QUILL_UP.cross(X).normalized()

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.77), "chest"),
    ("head", (0, 0, 0.77), (0, 0, 0.95), "neck"),
    ("jaw", (0, -0.01, 0.81), (0, -0.07, 0.79), "head"),
    ("tabard.F", (0, -0.09, 0.42), (0, -0.1, 0.22), "hips"),
    ("cape", (0, 0.09, 0.68), (0, 0.13, 0.28), "chest"),
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
    ("book", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("quill", tuple(HAND_R), tuple(HAND_R + QUILL_UP * 0.1), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.46, 0.54)
    return blend("spine", "chest", co.z, 0.57, 0.64)


def tabard_weights(co):
    return blend("tabard.F", "hips", co.z, 0.36, 0.43)


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.52, 0.64)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.064, 0.07, 0.074), 12, 9)
    # The cheek bones and the bony brow.
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

    # The pale spirit light in each eye.
    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.026 * sign, -0.07, 0.004)), (0.009, 0.005, 0.009), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.04, 0.785), (0.05, 0.04, 0.026), 10, 6)
    teeth = kit.box(jaw.bm, (0, -0.072, 0.8), (0.06, 0.008, 0.014))
    jaw.paint(faces_of(teeth), BONE_DARK)
    parts.append(jaw)

    # The big white moustache, curled up at the ends.
    moustache = Part("moustache", MOUSTACHE, "head", shade=0.08)
    for sign in (1, -1):
        kit.tube(
            moustache.bm,
            [HEAD_C + Vector((0.004 * sign, -0.074, -0.03)), HEAD_C + Vector((0.045 * sign, -0.072, -0.04)), HEAD_C + Vector((0.085 * sign, -0.06, -0.03)), HEAD_C + Vector((0.105 * sign, -0.05, -0.005))],
            [0.016, 0.017, 0.011, 0.004],
            6,
        )
    parts.append(moustache)

    # The open helmet with a gold rim, and the small gold crown on top.
    helmet = Part("helmet", STEEL, "head", shade=0.12)
    verts = kit.sphere(helmet.bm, HEAD_C + Vector((0, 0.004, 0.01)), (0.076, 0.08, 0.082), 14, 10)
    face = [v for v in verts if v.co.y < -0.02 and HEAD_C.z - 0.08 < v.co.z < HEAD_C.z + 0.035 and abs(v.co.x) < 0.065]
    kit.bmesh.ops.delete(helmet.bm, geom=face, context="VERTS")
    for face_ in list(helmet.bm.faces):
        c = face_.calc_center_median()
        # Rust at the back of the helmet, low down.
        if c.y > 0.02 and c.z < HEAD_C.z + 0.01:
            helmet.paint([face_], RUST)
    rim = kit.torus(helmet.bm, HEAD_C + Vector((0, 0.002, 0.036)), (0, 0.12, 1), 0.079, 0.007, 16, 4)
    helmet.paint(faces_of(rim), GOLD)
    parts.append(helmet)

    crown = Part("crown", GOLD, "head", shade=0.05)
    top = HEAD_C + Vector((0, 0.01, 0.075))
    kit.cone(crown.bm, top, top + Vector((0, 0, 0.03)), 0.04, 0.042, 10)
    for index in range(5):
        a = 2 * math.pi * index / 5
        base = top + Vector((0.04 * math.sin(a), -0.04 * math.cos(a), 0.03))
        kit.cone(crown.bm, base, base + Vector((0, 0, 0.03)), 0.012, 0.001, 4)
    parts.append(crown)
    return parts


def body_parts():
    parts = []
    cuirass = Part("cuirass", STEEL, torso_weights)
    verts = kit.cone(cuirass.bm, (0, 0, 0.44), (0, 0, 0.7), 0.1, 0.115, 12, squash=0.78)
    for face in faces_of(verts):
        c = face.calc_center_median()
        if int((c.x * 3 + c.z) * 40) % 5 == 0:
            cuirass.paint([face], RUST)
    parts.append(cuirass)

    gorget = Part("gorget", STEEL_DARK, "chest")
    kit.cone(gorget.bm, (0, 0, 0.68), (0, 0, 0.77), 0.09, 0.035, 12, squash=0.85)
    # The neck bones show above it.
    kit.cone(gorget.bm, (0, 0, 0.74), (0, 0, 0.8), 0.018, 0.018, 6)
    parts.append(gorget)

    # The teal tabard over the chest, with the gold scales.
    tabard = Part("tabard", TEAL, torso_weights, shade=0.08)
    kit.box(tabard.bm, (0, -0.093, 0.55), (0.1, 0.012, 0.16))
    scales = set()
    scales |= set(kit.box(tabard.bm, (0, -0.1, 0.56), (0.006, 0.006, 0.09)))
    scales |= set(kit.box(tabard.bm, (0, -0.1, 0.6), (0.08, 0.006, 0.006)))
    for sign in (1, -1):
        scales |= set(kit.cone(tabard.bm, (0.036 * sign, -0.102, 0.575), (0.036 * sign, -0.102, 0.555), 0.006, 0.02, 6, squash=0.3))
    tabard.paint(faces_of(scales), GOLD)
    parts.append(tabard)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.43), (0, 0, 0.46), 0.108, 0.106, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.088, 0.445), (0.034, 0.012, 0.03))
    belt.paint(faces_of(buckle), GOLD)
    # The coin pouch at the right hip, with coins spilling at its mouth.
    pouch = kit.sphere(belt.bm, (-0.09, -0.06, 0.405), (0.032, 0.026, 0.038), 8, 6)
    belt.paint(faces_of(pouch), BOOK)
    for index, (dx, dz) in enumerate(((0.0, 0.0), (0.012, 0.006), (-0.01, 0.01))):
        coin = kit.cone(belt.bm, (-0.09 + dx, -0.082, 0.43 + dz), (-0.09 + dx, -0.088, 0.43 + dz), 0.011, 0.011, 8)
        belt.paint(faces_of(coin), GOLD)
    parts.append(belt)

    fauld = Part("fauld", STEEL_DARK, "hips")
    kit.cone(fauld.bm, (0, 0, 0.32), (0, 0, 0.43), 0.115, 0.106, 12, squash=0.8)
    parts.append(fauld)

    def tabard_color(face_side, row, column):
        if face_side == "back":
            return TEAL_DARK
        return GOLD if row == 4 else TEAL

    part = Part("tabard.front", TEAL, tabard_weights)

    def grid(inset):
        result = []
        for row in range(6):
            v = row / 5
            result.append([(lerp(-1, 1, c / 6) * lerp(0.055, 0.07, v), -(lerp(0.09, 0.11, v) - inset), lerp(0.43, 0.2 + 0.02 * (c % 2), v)) for c in range(7)])
        return result

    panel(part, grid(0.0), grid(0.007), tabard_color)
    parts.append(part)

    def cape_color(row, column):
        return TEAL_DARK if column % 3 == 1 or row >= 4 else TEAL

    # The ragged teal cloak, torn at the hem.
    cape = Part("cape", TEAL, cape_weights)
    kit.ragged_cone(cape, 0.7, 0.08, 0.1, 0.2, 14, 5, 0.75, 0.14, cape_color, TEAL_DARK, gap=math.radians(95), y_push=0.08)
    parts.append(cape)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(pauldron.bm, s + Vector((0.012 * sign, 0, 0.01)), (0.06, 0.056, 0.048), 10, 7)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.02 for f in v.link_faces}, RUST)
        parts.append(pauldron)

        # Bare arm bones between the plates.
        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.018, 0.016, 6)
        parts.append(upper)

        elbow = Part(f"elbow.{side}", STEEL_DARK, f"forearm.{side}", shade=0.05)
        kit.sphere(elbow.bm, e, (0.03, 0.03, 0.03), 8, 6)
        parts.append(elbow)

        vambrace = Part(f"vambrace.{side}", STEEL, f"forearm.{side}")
        verts = kit.cone(vambrace.bm, e + d * 0.02, w, 0.032, 0.028, 8)
        vambrace.paint({f for v in verts if (v.co - w).length < 0.014 for f in v.link_faces}, GOLD)
        parts.append(vambrace)

        # A bony hand: a palm and three long finger bones.
        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.022, (0.02, 0.016, 0.022), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.008 * index, -0.006, 0))
            kit.cone(hand.bm, w + d * 0.03 + offset, w + d * 0.06 + offset, 0.005, 0.003, 4)
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

        poleyn = Part(f"poleyn.{side}", GOLD, f"shin.{side}", shade=0.05)
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


def book_parts():
    book = Part("book", BOOK, "book", shade=0.06)
    half = BOOK_SIZE / 2
    covers = kit.box(book.bm, BOOK_C, BOOK_SIZE)
    for face in faces_of(covers):
        n = face.normal
        # The pages show on the open edges: the top, the bottom and the right side.
        if abs(n.z) > 0.9 or n.x < -0.9:
            book.paint([face], PAGES)
    # The leather covers stand a little proud of the pages.
    for dy in (-half.y, half.y):
        plate = kit.box(book.bm, BOOK_C + Vector((0.004, dy, 0)), (BOOK_SIZE.x + 0.008, 0.008, BOOK_SIZE.z + 0.012))
        book.paint(faces_of(plate), BOOK)
    spine = kit.cone(book.bm, BOOK_C + Vector((half.x, 0, -half.z - 0.006)), BOOK_C + Vector((half.x, 0, half.z + 0.006)), 0.03, 0.03, 8, squash=1.0)
    book.paint(faces_of(spine), LEATHER)
    front = BOOK_C.y - half.y - 0.006
    gold = set()
    # Gold corners and the gold scales on the cover.
    for sx in (-1, 1):
        for sz in (-1, 1):
            gold |= set(kit.box(book.bm, BOOK_C + Vector((sx * (half.x - 0.012), -half.y - 0.006, sz * (half.z - 0.015))), (0.026, 0.006, 0.03)))
    gold |= set(kit.box(book.bm, Vector((BOOK_C.x, front - 0.002, BOOK_C.z)), (0.008, 0.004, 0.11)))
    gold |= set(kit.box(book.bm, Vector((BOOK_C.x, front - 0.002, BOOK_C.z + 0.045)), (0.09, 0.004, 0.008)))
    for sx in (-1, 1):
        gold |= set(kit.cone(book.bm, Vector((BOOK_C.x + sx * 0.04, front - 0.003, BOOK_C.z + 0.02)), Vector((BOOK_C.x + sx * 0.04, front - 0.003, BOOK_C.z - 0.005)), 0.006, 0.024, 6, squash=0.25))
    # Two straps round the book.
    for dz in (-0.06, 0.06):
        strap = kit.box(book.bm, BOOK_C + Vector((0, 0, dz)), (BOOK_SIZE.x + 0.012, BOOK_SIZE.y + 0.02, 0.016))
        book.paint(faces_of(strap), LEATHER)
    book.paint(faces_of(gold), GOLD)
    return [book]


def quill_point(s, offset=0.0):
    """A point on the quill at `s` along it from the hand; `offset` goes across the vane."""
    return HAND_R + QUILL_UP * s + QUILL_SIDE * offset


def quill_parts():
    quill = Part("quill", QUILL, "quill", shade=0.04)
    # The shaft through the hand, and the steel nib below it.
    shaft = kit.cone(quill.bm, quill_point(-0.1), quill_point(0.5), 0.011, 0.004, 6)
    quill.paint(faces_of(shaft), QUILL_DARK)
    nib = kit.cone(quill.bm, quill_point(-0.1), quill_point(-0.19), 0.013, 0.001, 5)
    quill.paint(faces_of(nib), STEEL)
    tip = kit.cone(quill.bm, quill_point(-0.16), quill_point(-0.19), 0.006, 0.001, 4)
    quill.paint(faces_of(tip), INK)

    # The vane: a long feather on both sides of the shaft. It lies across Y, so
    # the camera on the right side sees its face.
    rows = 10

    def width(v):
        return 0.055 * math.sin(math.pi * min(1.0, v * 1.15)) ** 0.7 + 0.004

    def grid(inset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            s = lerp(0.06, 0.5, v)
            w = width(v)
            # The barbs sweep down a little away from the shaft.
            result.append([quill_point(s - 0.02 * abs(c - 2) / 2, w * (c - 2) / 2) + X * inset for c in range(5)])
        return result

    def color_of(face_side, row, column):
        if row % 3 == 2:
            return QUILL_DARK
        return QUILL

    edges = panel(quill, grid(-0.004), grid(0.004), color_of)
    quill.paint(edges, QUILL_DARK)
    return [quill]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("SirOdoLastTaxman", BONES)
    parts = head_parts() + body_parts() + limb_parts() + book_parts() + quill_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "SirOdoLastTaxmanMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def pose(base, **changes):
        result = dict(base)
        for key, value in changes.items():
            result[key.replace("__", ".").replace("_at_", "@")] = value
        return result

    def stand(breath=0.0, sway=0.0, guard=1.0):
        """
        Turned to his right with the ledger up and the quill ready, the jaw
        a little loose. The dead do not breathe, so the idle is a slow sway
        and a click of the jaw.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.01)),
            "hips": t("hips", (Z, -20 * guard)),
            "spine": t("spine", (Z, -4 * guard), (X, 4)),
            "chest": t("chest", (X, -2), (Y, sway * 2)),
            "neck": t("neck", (Z, 10 * guard)),
            "head": t("head", (Z, 12 * guard + sway * 5), (Y, sway * 4), (X, -2)),
            "jaw": t("jaw", (X, -4 - breath * 10)),
            "upperarm.L": t("upperarm.L", (X, -4)),
            "upperarm.R": t("upperarm.R", (X, -4 - breath * 2)),
            "thigh.L": t("thigh.L", (X, -12), (Y, -4)),
            "shin.L": t("shin.L", (X, 14)),
            "foot.L": t("foot.L", (X, -2)),
            "thigh.R": t("thigh.R", (X, 10), (Y, 4)),
            "shin.R": t("shin.R", (X, 6)),
            "foot.R": t("foot.R", (X, -16)),
            "tabard.F": t("tabard.F", (X, -8)),
            "cape": t("cape", (X, -4), (Y, sway * 4)),
        }

    def sag(breath=0.0):
        """Low HP: the bones sag, the head hangs to one side, the ledger low."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.01, -0.012)),
            spine=t("spine", (Z, -4), (X, 16 + breath * 3)),
            chest=t("chest", (X, 8), (Y, -6)),
            neck=t("neck", (Z, 8), (X, 10)),
            head=t("head", (Z, 6), (Y, -22 - breath * 4), (X, 10)),
            jaw=t("jaw", (X, -22 - breath * 6)),
            upperarm__L=t("upperarm.L", (X, 14), (Y, 6)),
            forearm__L=t("forearm.L", (X, 30)),
            upperarm__R=t("upperarm.R", (X, 8), (Y, -4)),
            forearm__R=t("forearm.R", (X, 20)),
            thigh__L=t("thigh.L", (X, -24), (Y, -4)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, -2), (Y, 4)),
            shin__R=t("shin.R", (X, 24)),
            foot__R=t("foot.R", (X, -20)),
            cape=t("cape", (X, 10)),
        )

    def recoil(base, amount=1.0):
        """A hit rattles the bones back; the skull snaps up and the jaw drops."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012)),
            spine=t("spine", (Z, -4), (X, -8 * amount)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 12), (X, -18 * amount), (Y, 8 * amount)),
            jaw=t("jaw", (X, -26 * amount)),
            upperarm__L=t("upperarm.L", (X, -14 * amount), (Y, -6 * amount)),
            upperarm__R=t("upperarm.R", (Y, 20 * amount), (X, 10 * amount)),
            cape=t("cape", (X, 14 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.012)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 26), (Y, -14)),
            jaw=t("jaw", (X, -24)),
            thigh__L=t("thigh.L", (X, -24)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 28)),
            foot__R=t("foot.R", (X, -20)),
            upperarm__L=t("upperarm.L", (X, 26), (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -16), (X, 10)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back and straight, the ledger on his chest, the quill beside him."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.07)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -25)),
            jaw=t("jaw", (X, -20)),
            upperarm__L=t("upperarm.L", (X, 14)),
            upperarm__R=t("upperarm.R", (Y, 40), (X, 10)),
            forearm__R=t("forearm.R", (X, 20)),
            thigh__L=t("thigh.L", (X, 0)),
            shin__L=t("shin.L", (X, 0)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 0)),
            shin__R=t("shin.R", (X, 0)),
            foot__R=t("foot.R", (X, 0)),
            tabard__F=t("tabard.F", (X, 20)),
            cape=t("cape", (X, -20)),
        )

    def risen(base, lean):
        """The stiff rise of the dead: straight, turning up about the feet."""
        return pose(
            fallen(base),
            root=t("root", (X, -lean)),
            root_at_loc=at("root", (0, 0, 0.07 * lean / 86)),
            head=t("head", (X, 10)),
            jaw=t("jaw", (X, -30)),
            cape=t("cape", (X, lerp(-4, -20, lean / 86))),
        )

    def crouch(base):
        """Down on one knee, the ledger planted: the start of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.15)),
            spine=t("spine", (Z, -4), (X, 20)),
            head=t("head", (Z, 10), (X, 20)),
            thigh__L=t("thigh.L", (X, -76), (Y, -5)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4), (Y, 5)),
            shin__R=t("shin.R", (X, 92)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -16)),
            cape=t("cape", (X, 24)),
        )

    def salute(base):
        """Up again with the quill raised high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.004)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 8), (X, -14)),
            jaw=t("jaw", (X, -26)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -12)),
            forearm__R=t("forearm.R", (X, -10)),
            quill=t("quill", (X, 150)),
            cape=t("cape", (X, 12)),
        )

    def step(front):
        """A stiff march. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(guard=0.6),
            hips_at_loc=at("hips", (0, 0, 0.014)),
            spine=t("spine", (Z, -3), (X, 6), (Y, 3 * front)),
            chest=t("chest", (Z, -4 * front)),
            jaw=t("jaw", (X, -10)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 12)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "upperarm__R": t("upperarm.R", (X, -4 - 10 * front)),
                "tabard__F": t("tabard.F", (X, -4 - 6 * front)),
                "cape": t("cape", (X, 8), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(guard=0.6),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (Z, -3), (X, 6)),
            jaw=t("jaw", (X, -2)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -16)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "tabard__F": t("tabard.F", (X, -6)),
                "cape": t("cape", (X, 6)),
            },
        )

    # The attack (Charge): he pulls the quill back, then runs in and stabs
    # with the nib. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the nib lands at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.03)),
            hips=t("hips", (Z, -30)),
            spine=t("spine", (Z, -10), (X, 6)),
            chest=t("chest", (Z, -8)),
            head=t("head", (Z, 28)),
            jaw=t("jaw", (X, -20)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, -30)),
            forearm__R=t("forearm.R", (X, -40)),
            quill=t("quill", (X, -60)),
            thigh__L=t("thigh.L", (X, -30), (Y, -5)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, 20), (Y, 5)),
            shin__R=t("shin.R", (X, 26)),
            foot__R=t("foot.R", (X, -30)),
            cape=t("cape", (X, 6)),
        )

    def stab(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.12, -0.04)),
            hips=t("hips", (Z, 4)),
            spine=t("spine", (Z, 8), (X, 16)),
            chest=t("chest", (Z, 6), (X, 4)),
            head=t("head", (Z, -6), (X, -10)),
            jaw=t("jaw", (X, -30)),
            upperarm__R=t("upperarm.R", (X, -80), (Y, -4)),
            forearm__R=t("forearm.R", (X, 0)),
            quill=t("quill", (X, 0)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 6)),
            thigh__L=t("thigh.L", (X, -44), (Y, -5)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 6)),
            thigh__R=t("thigh.R", (X, 30), (Y, 5)),
            shin__R=t("shin.R", (X, 14)),
            foot__R=t("foot.R", (X, -30)),
            tabard__F=t("tabard.F", (X, -10)),
            cape=t("cape", (X, 34)),
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
    attack.key(0, stand()).key(9, windup(stand())).key(15, stab(stand())).key(20, stab(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then rises
    # stiffly about the feet, and raises the quill.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(24, fallen(stand(), 2))
    rebirth.key(33, risen(stand(), 50)).key(40, risen(stand(), 0)).key(44, salute(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.12))))
    summon.key(17, salute(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "sir-odo-last-taxman.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
