"""
Pale Cantor Ysolde (`undead.paleCantorYsolde`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a pale undead priestess with
silver hair in a gold circlet, a black gown under a ragged teal coat with a
cream lining, a teal stole with gold stars, an amber gem on the chest with
green spirit wisps, and an open gold book. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/pale-cantor-ysolde.glb`;
then `bun unit-model:pack pale-cantor-ysolde` packs it for the game.

The Battle camera sees the right side of a player Unit, so the book is in her
right hand, and she raises the left hand to cast. Her Rebirth rises stiffly
from the feet, as the dead do.
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

SKIN = hex_color("#e2dbd0")
SHADOW = hex_color("#8f8090")
HAIR = hex_color("#dcc690")
HAIR_DARK = hex_color("#b39b62")
LIPS = hex_color("#9a3f4a")
EYES = hex_color("#3a2e3a")
GOWN = hex_color("#262427")
GOWN_LIGHT = hex_color("#3b383d")
TEAL = hex_color("#2f7d77")
TEAL_DARK = hex_color("#1f5552")
CREAM = hex_color("#ddd5bf")
GOLD = hex_color("#cfa64c")
AMBER = hex_color("#ff9526")
COVER = hex_color("#bfa264")
PAGES = hex_color("#f1e8cf")
SPIRIT = hex_color("#9be8c2")
BOOT = hex_color("#3a3434")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.875))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.052

# The left arm hangs in an A-pose; the right hand holds the open book in front.
ARM_DIR = Vector((math.sin(math.radians(20)), 0, -math.cos(math.radians(20))))
SL = Vector((0.1, 0, SHOULDER_Z))
EL = SL + ARM_DIR * 0.15
WL = EL + ARM_DIR * 0.14
TL = WL + ARM_DIR * 0.055
SR = Vector((-0.1, 0, SHOULDER_Z))
ER = Vector((-0.145, 0.01, 0.585))
WR = Vector((-0.12, -0.1, 0.555))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05

# The book lies open on the right palm, its far edge up, so the pages face her.
BOOK_C = WR + DR * 0.035 + Vector((0, 0, 0.03))
BOOK_TILT = math.radians(28)
SPINE = Vector((0, -math.cos(BOOK_TILT), math.sin(BOOK_TILT)))
BOOK_UP = Vector((0, math.sin(BOOK_TILT), math.cos(BOOK_TILT)))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("coat.B", (0, 0.07, 0.52), (0, 0.13, 0.12), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("book", tuple(BOOK_C), tuple(BOOK_C + Vector((0, 0, 0.08))), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The gown and the coat follow the hips at the top, and the legs and the coat tail lower."""
    t = clamp01((0.53 - co.z) / 0.45)
    back = clamp01((co.y - 0.01) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "coat.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side) * 0.9,
        "thigh.R": (1 - back) * t * clamp01(-side) * 0.9,
    }


def stole_weights(co):
    if co.z > 0.6:
        return blend("spine", "chest", co.z, 0.6, 0.68)
    return blend("hips", "spine", co.z, 0.45, 0.56)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.062, 0.068, 0.08), 14, 10)
    kit.cone(head.bm, (0, -0.064, 0.872), (0, -0.079, 0.862), 0.01, 0.002, 5)
    kit.sphere(head.bm, (0, -0.03, 0.825), (0.044, 0.04, 0.03), 10, 6)
    parts.append(head)

    # Closed eyes under dark lids, and red lips that smile.
    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        lid = kit.sphere(face.bm, (0.025 * sign, -0.06, 0.878), (0.016, 0.008, 0.009), 8, 5)
        face.paint(faces_of(lid), SHADOW)
        kit.box(face.bm, (0.025 * sign, -0.066, 0.874), (0.02, 0.006, 0.003))
    lips = kit.box(face.bm, (0, -0.064, 0.836), (0.026, 0.008, 0.007))
    face.paint(faces_of(lips), LIPS)
    parts.append(face)

    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.008, 0.888), (0.069, 0.075, 0.086), 14, 10)
    cut = [v for v in verts if v.co.z < 0.84 or (v.co.y < -0.03 and v.co.z < 0.905)]
    kit.bmesh.ops.delete(hair.bm, geom=cut, context="VERTS")
    # The bun at the back of the crown.
    bun = kit.sphere(hair.bm, (0, 0.06, 0.93), (0.04, 0.034, 0.036), 10, 7)
    for face_ in faces_of(bun):
        if int(face_.calc_center_median().x * 120) % 2:
            hair.paint([face_], HAIR_DARK)
    # Loose locks frame the face down to the jaw.
    for sign in (1, -1):
        kit.cone(hair.bm, (0.054 * sign, -0.034, 0.915), (0.062 * sign, -0.03, 0.8), 0.016, 0.006, 6, squash=0.7)
        kit.cone(hair.bm, (0.06 * sign, 0.01, 0.9), (0.07 * sign, 0.03, 0.76), 0.02, 0.006, 6, squash=0.7)
    parts.append(hair)

    circlet = Part("circlet", GOLD, "head", shade=0.05)
    kit.torus(circlet.bm, (0, 0.002, 0.912), (0, 0.3, 1), 0.071, 0.005, 18, 4)
    gem = kit.sphere(circlet.bm, (0, -0.072, 0.902), (0.011, 0.007, 0.013), 8, 5)
    circlet.paint(faces_of(gem), AMBER)
    parts.append(circlet)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.026, 0.024, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    bodice = Part("bodice", GOWN, torso_weights)
    kit.cone(bodice.bm, (0, 0, 0.5), (0, 0, 0.74), 0.064, 0.082, 12, squash=0.74)
    parts.append(bodice)

    # A high collar behind the neck, black outside and teal inside.
    collar = Part("collar", GOWN, "chest")
    kit.ragged_cone(collar, 0.725, 0.84, 0.07, 0.088, 12, 2, 0.85, 0.0, lambda r, c: GOWN_LIGHT if r else GOWN, TEAL, gap=math.radians(62))
    parts.append(collar)

    def coat_top_color(row, column):
        return TEAL if row == 0 else GOWN

    # The coat over the shoulders and chest, open at the front.
    coat_top = Part("coat.top", GOWN, "chest")
    kit.ragged_cone(coat_top, 0.75, 0.6, 0.05, 0.088, 14, 2, 0.8, 0.0, coat_top_color, GOWN_LIGHT, gap=math.radians(42))
    parts.append(coat_top)

    # The amber gem on a gold chain, and the spirit wisps that leave it.
    gem = Part("gem", GOLD, "chest", shade=0.05)
    kit.tube(gem.bm, [(-0.05, -0.05, 0.73), (-0.02, -0.07, 0.69), (0, -0.074, 0.68)], [0.003] * 3, 4)
    kit.tube(gem.bm, [(0.05, -0.05, 0.73), (0.02, -0.07, 0.69), (0, -0.074, 0.68)], [0.003] * 3, 4)
    kit.cone(gem.bm, (0, -0.068, 0.672), (0, -0.078, 0.672), 0.018, 0.016, 8)
    stone = kit.sphere(gem.bm, (0, -0.08, 0.672), (0.011, 0.007, 0.014), 8, 5)
    gem.paint(faces_of(stone), AMBER)
    parts.append(gem)

    wisps = Part("wisps", SPIRIT, stole_weights, shade=0)
    for sign, phase in ((1, 0.0), (-1, 1.4)):
        path = []
        for index in range(7):
            v = index / 6
            angle = phase + v * 4.2
            path.append((sign * (0.02 + 0.07 * v) + 0.02 * math.cos(angle), -0.09 - 0.05 * v + 0.015 * math.sin(angle), lerp(0.665, 0.33, v)))
        kit.tube(wisps.bm, path, [lerp(0.007, 0.002, i / 6) for i in range(7)], 4)
    parts.append(wisps)

    belt = Part("belt", GOWN_LIGHT, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.515), (0, 0, 0.545), 0.069, 0.067, 12, squash=0.78)
    buckle = kit.box(belt.bm, (0, -0.054, 0.53), (0.022, 0.008, 0.022))
    belt.paint(faces_of(buckle), GOLD)
    parts.append(belt)

    gown = Part("gown", GOWN, skirt_weights)
    kit.ragged_cone(gown, 0.54, 0.02, 0.068, 0.14, 16, 6, 0.85, 0.03, lambda r, c: GOWN_LIGHT if c % 4 == 0 else GOWN, GOWN)
    parts.append(gown)

    def coat_color(row, column):
        if row >= 5 and column % 3 == 1:
            return CREAM
        if column in (0, 15):
            return GOLD
        return TEAL_DARK if column % 4 == 2 else TEAL

    coat = Part("coat", TEAL, skirt_weights)
    kit.ragged_cone(coat, 0.6, 0.06, 0.088, 0.17, 16, 7, 0.82, 0.09, coat_color, CREAM, gap=math.radians(44), y_push=0.05)
    parts.append(coat)

    # The stole: two teal bands down the front, with a gold star near each end.
    stole = Part("stole", TEAL, stole_weights)
    for sign in (1, -1):
        def grid(inset, sign=sign):
            rows = []
            for row in range(7):
                v = row / 6
                z = lerp(0.74, 0.3, v)
                y = -lerp(0.06, 0.106, min(v * 2.2, 1)) + inset
                x = sign * lerp(0.032, 0.05, v)
                rows.append([(x - 0.02, y, z), (x + 0.02, y, z)])
            return rows

        def color_of(face_side, row, column):
            if face_side == "back":
                return TEAL_DARK
            return GOLD if row == 4 else TEAL

        kit.panel(stole, grid(0.0), grid(0.006), color_of)
    parts.append(stole)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", GOWN, f"upperarm.{side}")
        verts = kit.sphere(pauldron.bm, s + Vector((0.006 * sign, 0, 0.006)), (0.036, 0.036, 0.03), 10, 7)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.006 for f in v.link_faces}, GOLD)
        parts.append(pauldron)

        upper = Part(f"sleeve.{side}", GOWN, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.027, 0.024, 8)
        parts.append(upper)

        # A wide bell sleeve from the elbow, teal with a cream edge.
        bell = Part(f"bell.{side}", TEAL, f"forearm.{side}")
        verts = kit.cone(bell.bm, e - d * 0.01, w - d * 0.005, 0.026, 0.052, 10, caps=False)
        bell.paint({f for v in verts if (v.co - w).length < 0.03 for f in v.link_faces}, CREAM)
        parts.append(bell)

        forearm = Part(f"forearm.{side}", GOWN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.022, 0.019, 8)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.016, 0.014, 0.024), 8, 6)
        # Long dark nails.
        kit.cone(hand.bm, w + d * 0.04, w + d * 0.06, 0.012, 0.002, 5, squash=0.5)
        parts.append(hand)

        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        boot = Part(f"boot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.1)), ankle - Vector((0, 0, 0.02)), 0.034, 0.036, 8)
        kit.cone(boot.bm, (LEG_X * sign, 0.01, 0.024), (LEG_X * sign, -0.1, 0.014), 0.03, 0.006, 8, squash=0.7)
        toe = kit.cone(boot.bm, (LEG_X * sign, -0.07, 0.018), (LEG_X * sign, -0.1, 0.014), 0.016, 0.006, 6, squash=0.7)
        boot.paint(faces_of(toe), GOLD)
        parts.append(boot)

        # The legs, under the gown.
        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        leg = Part(f"leg.{side}", GOWN, f"thigh.{side}")
        kit.cone(leg.bm, hip, knee, 0.045, 0.034, 8)
        parts.append(leg)
        shin = Part(f"shin.{side}", GOWN, f"shin.{side}")
        kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.05)), 0.034, 0.03, 8)
        parts.append(shin)
    return parts


def book_parts():
    book = Part("book", PAGES, "book", shade=0.03)
    for sign in (1, -1):
        across = (X * sign * math.cos(math.radians(14)) + BOOK_UP * math.sin(math.radians(14))).normalized()
        normal = (BOOK_UP * math.cos(math.radians(14)) - X * sign * math.sin(math.radians(14))).normalized()
        center = BOOK_C + across * 0.042
        kit.slab(book.bm, center + normal * 0.006, across * 0.038, SPINE * 0.05, normal * 0.008)
        cover = kit.slab(book.bm, center - normal * 0.004, across * 0.044, SPINE * 0.056, normal * 0.004)
        book.paint(faces_of(cover), COVER)
        # A line of text on each page.
        for line in (-0.025, -0.008, 0.009, 0.026):
            text = kit.slab(book.bm, center + normal * 0.0145 + SPINE * line, across * 0.026, SPINE * 0.0025, normal * 0.0008)
            book.paint(faces_of(text), SHADOW)
    spine = kit.cone(book.bm, BOOK_C - SPINE * 0.056, BOOK_C + SPINE * 0.056, 0.008, 0.008, 6)
    book.paint(faces_of(spine), COVER)
    gem = kit.sphere(book.bm, BOOK_C - BOOK_UP * 0.008, (0.01, 0.01, 0.01), 6, 4)
    book.paint(faces_of(gem), AMBER)
    return [book]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("PaleCantorYsolde", BONES)
    parts = head_parts() + body_parts() + limb_parts() + book_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "PaleCantorYsoldeMesh")
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

    def stand(breath=0.0, sway=0.0):
        """The idle stance: turned a little to her right, she reads from the open book, her head high."""
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.003)),
            "hips": t("hips", (Z, -12)),
            "spine": t("spine", (Z, -2), (X, 1 + breath * 0.5), (Y, sway * 1.5)),
            "chest": t("chest", (X, -3 - breath * 2)),
            "neck": t("neck", (Z, 6), (X, -2)),
            "head": t("head", (Z, 6 + sway * 4), (X, -8 + breath), (Y, -6)),
            "upperarm.L": t("upperarm.L", (Y, -6 - breath * 2), (X, 6)),
            "forearm.L": t("forearm.L", (X, -22)),
            "hand.L": t("hand.L", (X, -10)),
            "upperarm.R": t("upperarm.R", (X, -6 - breath * 2)),
            "thigh.L": t("thigh.L", (X, -8), (Y, -2)),
            "shin.L": t("shin.L", (X, 8)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 2)),
            "shin.R": t("shin.R", (X, 4)),
            "foot.R": t("foot.R", (X, -10)),
            "coat.B": t("coat.B", (X, -4 - breath * 2), (Y, sway * 3)),
        }

    def wilt(breath=0.0):
        """Low HP: bent over, the left hand on the gem, the book low."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            spine=t("spine", (X, 16 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2), (Z, -6)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 12 + breath * 4), (Y, 8)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 26)),
            forearm__L=t("forearm.L", (X, -96), (Z, -40)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, 6)),
            forearm__R=t("forearm.R", (X, 30)),
            hand__R=t("hand.R", (X, 20)),
            thigh__L=t("thigh.L", (X, -16), (Y, -3)),
            shin__L=t("shin.L", (X, 28)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -6), (Y, 3)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -14)),
            coat__B=t("coat.B", (X, 6)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -16 * amount), (Z, 8 * amount)),
            upperarm__L=t("upperarm.L", (Y, -24 * amount), (X, 14 * amount)),
            upperarm__R=t("upperarm.R", (Y, 10 * amount), (X, 14 * amount)),
            coat__B=t("coat.B", (X, 12 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.04)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -18)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -12)),
            upperarm__L=t("upperarm.L", (Y, -16), (X, 10)),
            upperarm__R=t("upperarm.R", (X, 10)),
            coat__B=t("coat.B", (X, -14)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back and straight, the book on her chest."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.045)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, 0)),
            head=t("head", (X, -8), (Z, -20)),
            upperarm__L=t("upperarm.L", (Y, -20), (X, 10)),
            forearm__L=t("forearm.L", (X, -10)),
            upperarm__R=t("upperarm.R", (X, 4)),
            thigh__L=t("thigh.L", (X, 0)),
            shin__L=t("shin.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 0)),
            shin__R=t("shin.R", (X, 0)),
            foot__R=t("foot.R", (X, 0)),
            coat__B=t("coat.B", (X, -70)),
        )

    def risen(base, lean):
        """The stiff rise of the dead: straight, turning up about the feet."""
        return pose(
            fallen(base),
            root=t("root", (X, -lean)),
            root_at_loc=at("root", (0, 0, 0.045 * lean / 86)),
            head=t("head", (X, 10)),
            coat__B=t("coat.B", (X, lerp(-6, -70, lean / 86))),
        )

    def crouch(base):
        """Low on both knees, the head bowed, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.17)),
            thigh__L=t("thigh.L", (X, -60), (Y, -4)),
            shin__L=t("shin.L", (X, 110)),
            foot__L=t("foot.L", (X, -50)),
            thigh__R=t("thigh.R", (X, -60), (Y, 4)),
            shin__R=t("shin.R", (X, 110)),
            foot__R=t("foot.R", (X, -50)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 30)),
            upperarm__L=t("upperarm.L", (Y, 10), (X, -30)),
            coat__B=t("coat.B", (X, 40)),
        )

    def chant(base, lift=1.0):
        """Dispel: the left hand high, the head back, the book open to the sky."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.006 * lift)),
            chest=t("chest", (X, -10)),
            neck=t("neck", (Z, 6), (X, -8)),
            head=t("head", (Z, 6), (X, -18), (Y, -8)),
            upperarm__L=t("upperarm.L", (X, -150), (Y, 15)),
            forearm__L=t("forearm.L", (X, -14)),
            hand__L=t("hand.L", (X, 20)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            coat__B=t("coat.B", (X, 8)),
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            spine=t("spine", (X, 3)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -20)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14)),
                f"shin__{back}": t(f"shin.{back}", (X, 12)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "upperarm__L": t("upperarm.L", (Y, -6), (X, 10 * front)),
                "coat__B": t("coat.B", (X, 8), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, 3)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 34)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "coat__B": t("coat.B", (X, 4)),
            },
        )

    # The attack: she lifts the heavy book high, then lunges and slams it
    # down. The slash effect starts at 50% of the attack (`MELEE_IMPACT` in
    # fx.ts), so the book lands at frame 15 of 30.
    def lift(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.01)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -8), (X, -6)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 20), (X, -6)),
            upperarm__R=t("upperarm.R", (X, -155), (Y, 8)),
            forearm__R=t("forearm.R", (X, 35)),
            hand__R=t("hand.R", (X, 10)),
            upperarm__L=t("upperarm.L", (Y, -30), (X, 20)),
            thigh__L=t("thigh.L", (X, -16), (Y, -3)),
            shin__L=t("shin.L", (X, 16)),
            thigh__R=t("thigh.R", (X, 12), (Y, 3)),
            shin__R=t("shin.R", (X, 14)),
            coat__B=t("coat.B", (X, -6)),
        )

    def slam(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.04, -0.035)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (Z, 4), (X, 20)),
            chest=t("chest", (Z, 4), (X, 10)),
            head=t("head", (Z, 6), (X, -10)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, 6)),
            forearm__R=t("forearm.R", (X, 30)),
            hand__R=t("hand.R", (X, 50)),
            upperarm__L=t("upperarm.L", (Y, -26), (X, 30)),
            thigh__L=t("thigh.L", (X, -40), (Y, -3)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 22), (Y, 3)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -26)),
            coat__B=t("coat.B", (X, 20)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, wilt(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, lift(stand())).key(15, slam(stand())).key(19, slam(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 24)
    cast.key(0, stand()).key(6, chant(stand())).key(10, chant(stand(), 2.0)).key(16, chant(stand())).key(24, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then rises
    # stiffly about the feet, and opens the book again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(24, fallen(stand(), 2))
    rebirth.key(33, risen(stand(), 50)).key(40, risen(stand(), 0)).key(44, chant(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0, -0.1))))
    summon.key(17, chant(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "pale-cantor-ysolde.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
