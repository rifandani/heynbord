"""
Pack Stalker (`orc.packStalker`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a lean orc tracker with a hunched
back and a sly grin, a hood of rust hide with orange paint stripes that
hangs over his shoulders, orange stripes on his arms, a leather harness with
small bone charms and a spare blade, leather bracers, a ragged red sash,
brown trousers with leather wraps and soft boots. He has a hooked hand axe
in each hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/pack-stalker.glb`; then
`bun unit-model:pack pack-stalker` packs it for the game.

He stays low in a crouch, his chest to the front. He has Pivot, so he
watches behind him: his idle looks back over his right shoulder, on the
camera side, with a grin. The right axe is ready in front, and the left axe
guards his back. He has Swift, so his walk is a fast, low prowl. His attack
is a quick hooked slash with the right axe, then a back cut. The spare blade
on the harness shows Last Breath. He has no Keyword that he uses by his own
action, so he has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#aeae4e")
SKIN_DARK = hex_color("#7e8036")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#4e1a16")
TUSK = hex_color("#f0e6c8")
PAINT = hex_color("#d8682a")
HOOD = hex_color("#94563a")
HOOD_DARK = hex_color("#643624")
BONE = hex_color("#e6dbbe")
BONE_DARK = hex_color("#a99a78")
LEATHER = hex_color("#5c3a26")
LEATHER_DARK = hex_color("#382418")
TROUSERS = hex_color("#6e4c34")
CLOTH = hex_color("#a83226")
CLOTH_DARK = hex_color("#6a1e18")
WOOD = hex_color("#5a3a24")
STEEL = hex_color("#b4b0a6")
STEEL_DARK = hex_color("#77736c")

# --- Proportions ---------------------------------------------------------------

# He is lean: narrow hips and long arms.
HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.635
SHOULDER_Z = 0.715
NECK_Z = 0.745
HEAD_C = Vector((0, -0.03, 0.835))
KNEE_Z = 0.265
ANKLE_Z = 0.055
LEG_X = 0.068

# The right arm reaches to the front with its axe up; the left arm hangs back
# with its axe down behind him. These are the rest (bind) positions.
SR = Vector((-0.145, 0, SHOULDER_Z))
ER = Vector((-0.2, -0.03, 0.575))
WR = Vector((-0.195, -0.13, 0.5))
TR = WR + (WR - ER).normalized() * 0.05
SL = Vector((0.145, 0, SHOULDER_Z))
EL = Vector((0.2, 0.05, 0.575))
WL = Vector((0.21, 0.1, 0.45))
TL = WL + (WL - EL).normalized() * 0.05

GRIP_R = WR + (WR - ER).normalized() * 0.03
HAFT_R = Vector((0, -0.35, 1)).normalized()
BLADE_R = Vector((0, -1, -0.35)).normalized()
GRIP_L = WL + (WL - EL).normalized() * 0.03
HAFT_L = Vector((0, 0.3, -1)).normalized()
BLADE_L = Vector((0, 1, 0.3)).normalized()

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.01, NECK_Z), (0, -0.02, 0.78), "chest"),
    ("head", (0, -0.02, 0.78), (0, -0.03, 0.94), "neck"),
    ("sash.F", (0, -0.09, 0.47), (0, -0.1, 0.28), "hips"),
    ("sash.B", (0, 0.08, 0.47), (0, 0.1, 0.28), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.09, 0.02), f"shin.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def hood_weights(co):
    """The hood follows the head, and its cape follows the chest."""
    return blend("chest", "head", co.z, 0.75, 0.8)


def sash_weights(co):
    bone = "sash.F" if co.y < 0 else "sash.B"
    return blend(bone, "hips", co.z, 0.4, 0.46)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.06, 0.064, 0.066), 12, 9)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.04)), (0.052, 0.044, 0.034), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.06, 0.004)), HEAD_C + Vector((0, -0.078, -0.012)), 0.015, 0.006, 5)
    # Long ears that poke out of the hood.
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.058 * sign, 0.006, 0.006)), HEAD_C + Vector((0.14 * sign, 0.04, 0.05)), 0.02, 0.002, 5, squash=0.4)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        # Narrow, sly eyes.
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.058, 0.014)), (0.01, 0.005, 0.005), 6, 4)
        brow = kit.slab(face.bm, HEAD_C + Vector((0.024 * sign, -0.062, 0.026)), (0.016, 0.0, 0.003 * sign), (0, 0.006, 0), (0.0, 0.0, 0.004))
        face.paint(faces_of(brow), SKIN_DARK)
        stripe = kit.slab(face.bm, HEAD_C + Vector((0.04 * sign, -0.05, -0.008)), (0.012, 0.004 * sign, 0), (0, 0.004, 0), (0, 0, 0.004))
        face.paint(faces_of(stripe), PAINT)
    # A wide, sly grin, higher on the right side.
    grin = kit.slab(face.bm, HEAD_C + Vector((-0.004, -0.066, -0.036)), (0.03, 0, 0.007), (0, 0.006, 0), (0, 0, 0.008))
    face.paint(faces_of(grin), MOUTH)
    teeth = kit.slab(face.bm, HEAD_C + Vector((-0.004, -0.071, -0.033)), (0.024, 0, 0.006), (0, 0.003, 0), (0, 0, 0.004))
    face.paint(faces_of(teeth), TUSK)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.026 * sign, -0.064, -0.05)), HEAD_C + Vector((0.032 * sign, -0.072, -0.02)), 0.008, 0.001, 5)
    parts.append(tusks)

    # The hood of rust hide with orange stripes, with a point at the back,
    # and its short cape over the shoulders.
    hood = Part("hood", HOOD, hood_weights, shade=0.12)
    verts = kit.sphere(hood.bm, HEAD_C + Vector((0, 0.012, 0.01)), (0.074, 0.08, 0.08), 12, 8)
    kit.bmesh.ops.delete(hood.bm, geom=[v for v in verts if v.co.y < HEAD_C.y - 0.02 and v.co.z < HEAD_C.z + 0.045], context="VERTS")
    # Orange stripes from the brow over the top of the hood.
    for face in hood.bm.faces:
        offset = face.calc_center_median() - HEAD_C
        if offset.z > 0.02 and (abs(offset.x) < 0.012 or abs(abs(offset.x) - 0.04) < 0.008):
            hood.paint([face], PAINT)
    point = kit.cone(hood.bm, HEAD_C + Vector((0, 0.05, 0.05)), HEAD_C + Vector((0, 0.13, 0.02)), 0.045, 0.004, 8)
    hood.paint(faces_of(point), HOOD_DARK)
    # The rim of the hood over the brow.
    rim = kit.torus(hood.bm, HEAD_C + Vector((0, -0.04, 0.012)), (0, -1, 0.35), 0.07, 0.012, 14, 4)
    hood.paint(faces_of(rim), HOOD_DARK)

    def cape_color(row, column):
        if row == 2:
            return HOOD_DARK
        return PAINT if column % 4 == 1 else HOOD

    kit.ragged_cone(hood, 0.79, 0.6, 0.06, 0.2, 14, 3, 0.85, 0.05, cape_color, HOOD_DARK, gap=math.radians(40), y_push=0.03)
    parts.append(hood)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.01, 0.71), (0, -0.02, 0.8), 0.04, 0.036, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    kit.sphere(torso.bm, (0, 0.0, 0.66), (0.13, 0.085, 0.09), 14, 8)
    kit.cone(torso.bm, (0, 0, 0.48), (0, 0, 0.64), 0.09, 0.115, 12, squash=0.75)
    for z in (0.6, 0.64):
        stripe = kit.slab(torso.bm, (-0.03, -0.082, z), (0.035, 0, 0.01), (0, 0.004, 0), (0, 0, 0.006))
        torso.paint(faces_of(stripe), PAINT)
    parts.append(torso)

    # The harness: two crossed straps with bone charms, a skull and a spare blade.
    harness = Part("harness", LEATHER, torso_weights, shade=0.05)
    for sign in (1, -1):
        kit.tube(harness.bm, [(0.1 * sign, 0.07, 0.74), (0.1 * sign, -0.06, 0.73), (0.0, -0.1, 0.62), (-0.09 * sign, -0.08, 0.5)], [0.012] * 4, 4)
    for index, p in enumerate(((0.05, -0.095, 0.66), (-0.05, -0.095, 0.66), (0.075, -0.088, 0.7), (-0.075, -0.088, 0.7))):
        charm = kit.cone(harness.bm, Vector(p), Vector(p) + Vector((0, -0.008, -0.035)), 0.009, 0.001, 4)
        harness.paint(faces_of(charm), BONE if index % 2 == 0 else BONE_DARK)
    skull = kit.sphere(harness.bm, (0, -0.108, 0.62), (0.022, 0.013, 0.024), 8, 6)
    harness.paint(faces_of(skull), BONE)
    for dx in (0.008, -0.008):
        eye = kit.sphere(harness.bm, (dx, -0.12, 0.625), (0.005, 0.003, 0.005), 4, 3)
        harness.paint(faces_of(eye), EYES)
    belt = kit.cone(harness.bm, (0, 0, 0.455), (0, 0, 0.49), 0.1, 0.098, 12, squash=0.8)
    harness.paint(faces_of(belt), LEATHER_DARK)
    # The spare blade: a hooked blade in a sheath on the right hip.
    sheath = kit.slab(harness.bm, (-0.1, -0.03, 0.43), (0.006, 0, 0), (0, -0.026, 0.01), (0.008, 0, 0.05))
    harness.paint(faces_of(sheath), LEATHER_DARK)
    blade = kit.cone(harness.bm, (-0.106, -0.05, 0.47), (-0.112, -0.1, 0.5), 0.016, 0.002, 4, squash=0.3)
    harness.paint(faces_of(blade), STEEL)
    parts.append(harness)

    def sash_color(face_side, row, column):
        return CLOTH_DARK if face_side == "back" or row == 3 else CLOTH

    for name, sign in (("sash.F", -1), ("sash.B", 1)):
        sash = Part(name, CLOTH, sash_weights)

        def grid(inset, sign=sign):
            result = []
            for row in range(5):
                v = row / 4
                result.append([(lerp(-1, 1, c / 4) * lerp(0.045, 0.06, v) + 0.02 * sign, sign * (lerp(0.092, 0.11, v) - inset), lerp(0.47, 0.25 + 0.05 * (c % 2), v)) for c in range(5)])
            return result

        kit.panel(sash, grid(0.0), grid(0.007), sash_color)
        parts.append(sash)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.008 * sign, 0, -0.01)), (0.046, 0.044, 0.046), 10, 7)
        kit.cone(upper.bm, s, e, 0.042, 0.035, 8)
        for along in (0.4, 0.6):
            stripe = kit.cone(upper.bm, s + (e - s) * along, s + (e - s) * (along + 0.07), 0.043, 0.042, 8)
            upper.paint(faces_of(stripe), PAINT)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.036, 0.03, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        verts = kit.cone(bracer.bm, e + d * 0.04, w - d * 0.004, 0.04, 0.035, 8)
        for face in faces_of(verts):
            if int(((face.calc_center_median() - e).dot(d)) * 90) % 3 == 0:
                bracer.paint([face], LEATHER_DARK)
        claw = kit.cone(bracer.bm, e + d * 0.07 + Vector((0.03 * sign, 0, 0.01)), e + d * 0.07 + Vector((0.06 * sign, 0.02, 0.03)), 0.008, 0.001, 4)
        bracer.paint(faces_of(claw), BONE)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.026, (0.028, 0.026, 0.03), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.058, 0.046, 8)
        parts.append(thigh)

        # Leather wraps on the shins, soft boots.
        shin = Part(f"shin.{side}", TROUSERS, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.04)), 0.048, 0.042, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 45) % 2 == 0:
                shin.paint([face], LEATHER)
        knee_pad = kit.sphere(shin.bm, knee + Vector((0, -0.024, 0.004)), (0.036, 0.022, 0.034), 8, 6)
        shin.paint(faces_of(knee_pad), LEATHER_DARK)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.045)), ankle - Vector((0, 0, 0.02)), 0.046, 0.05, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.034, 0.024), (0.072, 0.14, 0.048))
        parts.append(boot)
    return parts


def hand_axe(part, grip, haft, blade_dir):
    """A hooked hand axe: a short haft with a red wrap, a curved blade and a hook at its foot."""
    top = grip + haft * 0.16
    kit.cone(part.bm, grip - haft * 0.05, top, 0.012, 0.011, 6)
    wrap = kit.cone(part.bm, grip - haft * 0.045, grip + haft * 0.03, 0.015, 0.015, 6)
    part.paint(faces_of(wrap), CLOTH)
    tassel = kit.cone(part.bm, grip - haft * 0.05, grip - haft * 0.05 + Vector((0, 0.01, -0.06)), 0.01, 0.002, 4)
    part.paint(faces_of(tassel), CLOTH)
    thick = haft.cross(blade_dir).normalized()
    columns, rows = 6, 3

    def grid(depth):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = lerp(-1, 1, column / columns)
                reach = 0.015 + v * 0.06 + 0.02 * (1 - u * u) * v
                # The blade curves down at the foot into a hook.
                along = u * lerp(0.025, 0.05, v) - 0.04 * max(0.0, -u) ** 2 * v
                line.append(top - haft * 0.02 + haft * along + blade_dir * reach + thick * depth * lerp(1.0, 0.3, v))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        return STEEL if row == rows - 1 else STEEL_DARK

    edges = kit.panel(part, grid(0.008), grid(-0.008), color_of)
    part.paint(edges, STEEL)
    hook = kit.cone(part.bm, top - haft * 0.06 + blade_dir * 0.07, top - haft * 0.09 + blade_dir * 0.04, 0.012, 0.002, 4, squash=0.4)
    part.paint(faces_of(hook), STEEL)
    spike = kit.cone(part.bm, top - blade_dir * 0.005, top - blade_dir * 0.04, 0.01, 0.001, 4)
    part.paint(faces_of(spike), STEEL_DARK)


def axe_parts():
    right = Part("axe.R", WOOD, "hand.R", shade=0.04)
    hand_axe(right, GRIP_R, HAFT_R, BLADE_R)
    left = Part("axe.L", WOOD, "hand.L", shade=0.04)
    hand_axe(left, GRIP_L, HAFT_L, BLADE_L)
    return [right, left]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("PackStalker", BONES)
    parts = head_parts() + body_parts() + limb_parts() + axe_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "PackStalkerMesh")
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

    def stand(breath=0.0, look=1.0, sway=0.0):
        """
        The idle crouch: low on bent knees, the back hunched and the chest to
        the front. `look` turns the head back over the right shoulder.
        """
        return {
            "hips@loc": at("hips", (0, 0.02, -0.07 - breath * 0.004)),
            "hips": t("hips", (Z, -6), (X, 6)),
            "spine": t("spine", (X, 18 + breath)),
            "chest": t("chest", (X, 12 - breath * 2)),
            "neck": t("neck", (X, -18), (Z, -26 * look)),
            "head": t("head", (Z, -44 * look + sway * 4), (X, -10 + breath * 2), (Y, 8 * look)),
            "upperarm.R": t("upperarm.R", (X, -20 - breath * 2), (Y, -6)),
            "forearm.R": t("forearm.R", (X, -10)),
            "hand.R": t("hand.R", (X, 10 + sway * 4)),
            "upperarm.L": t("upperarm.L", (X, 26 + breath * 2), (Y, 10)),
            "forearm.L": t("forearm.L", (X, -14)),
            "thigh.L": t("thigh.L", (X, -40), (Y, -6)),
            "shin.L": t("shin.L", (X, 52)),
            "foot.L": t("foot.L", (X, -12)),
            "thigh.R": t("thigh.R", (X, -6), (Y, 8)),
            "shin.R": t("shin.R", (X, 46)),
            "foot.R": t("foot.R", (X, -40)),
            "sash.F": t("sash.F", (X, -20)),
            "sash.B": t("sash.B", (X, 10 + sway * 4)),
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, one hand on the ground, still watching behind him."""
        return pose(
            stand(look=0.6),
            hips_at_loc=at("hips", (0, 0.03, -0.17 - breath * 0.004)),
            spine=t("spine", (X, 30 + breath * 3)),
            chest=t("chest", (X, 12 + breath * 2)),
            head=t("head", (Z, -26), (X, 4 + breath * 4), (Y, 6)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, -10)),
            forearm__R=t("forearm.R", (X, 30)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 16)),
            thigh__L=t("thigh.L", (X, -78), (Y, -6)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -40)),
            sash__F=t("sash.F", (X, -40)),
        )

    def recoil(base, amount=1.0):
        """A hit jolts him back, and his head snaps to the front."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04 * amount, -0.07 - 0.01 * amount)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (X, -6 * amount), (Z, 8 * amount)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -18 * amount)),
            upperarm__R=t("upperarm.R", (X, -40 * amount), (Y, -24 * amount)),
            upperarm__L=t("upperarm.L", (X, 40 * amount), (Y, 20 * amount)),
            sash__F=t("sash.F", (X, -30 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.06)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -6)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -22)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, 12)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -30)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the axes out to the sides."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0), (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -12), (Z, -30)),
            upperarm__R=t("upperarm.R", (Y, -60), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 0)),
            upperarm__L=t("upperarm.L", (Y, 60), (X, -10)),
            forearm__L=t("forearm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, -10), (Y, -6)),
            shin__L=t("shin.L", (X, 12)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            sash__F=t("sash.F", (X, -60)),
            sash__B=t("sash.B", (X, 30)),
        )

    def crouch(base):
        """Very low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.16)),
            spine=t("spine", (X, 34)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -10)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -24)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 106)),
            foot__R=t("foot.R", (X, -52)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, -10)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 10)),
            sash__F=t("sash.F", (X, -50)),
        )

    def spread(base):
        """Up again, both axes out to the sides, and a grin back over the shoulder: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 10)),
            chest=t("chest", (X, -4)),
            upperarm__R=t("upperarm.R", (Y, -70), (X, -10)),
            forearm__R=t("forearm.R", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, 70), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
        )

    def step(front, lift=0.0):
        """A low, fast prowl. `front` is 1 for the left foot, -1 for the right; `lift` is in the air."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(look=0.35),
            hips_at_loc=at("hips", (0, 0.02, -0.08 + lift * 0.03)),
            hips=t("hips", (Z, -4 * front), (X, 6)),
            spine=t("spine", (X, 24), (Y, -3 * front)),
            chest=t("chest", (X, 10), (Z, -6 * front)),
            upperarm__R=t("upperarm.R", (X, -20 + 16 * front), (Y, -6)),
            upperarm__L=t("upperarm.L", (X, 26 + 16 * front), (Y, 10)),
            sash__F=t("sash.F", (X, -36)),
            sash__B=t("sash.B", (X, 30)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -60 + lift * 10)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 50 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 10 - lift * 10)),
                f"shin__{back}": t(f"shin.{back}", (X, 50 + lift * 30)),
                f"foot__{back}": t(f"foot.{back}", (X, -6)),
            },
        )

    # The attack: he turns his head to the front, lunges and hooks the right
    # axe down across the target. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the hook lands at frame 15 of 30.
    def ready(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.09)),
            hips=t("hips", (Z, -18), (X, 6)),
            spine=t("spine", (X, 14), (Z, -8)),
            chest=t("chest", (X, 6), (Z, -10)),
            neck=t("neck", (X, -16), (Z, 4)),
            head=t("head", (Z, 10), (X, -8)),
            upperarm__R=t("upperarm.R", (X, -130), (Y, -30)),
            forearm__R=t("forearm.R", (X, -60)),
            hand__R=t("hand.R", (X, 150)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 20)),
        )

    def hook(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.09, -0.1)),
            hips=t("hips", (Z, 8), (X, 6)),
            spine=t("spine", (X, 30), (Z, 8)),
            chest=t("chest", (X, 10), (Z, 10)),
            neck=t("neck", (X, -26)),
            head=t("head", (X, -14)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 70)),
            upperarm__L=t("upperarm.L", (X, 26), (Y, 16)),
            forearm__L=t("forearm.L", (X, -40)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 60)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
            sash__F=t("sash.F", (X, -40)),
            sash__B=t("sash.B", (X, 40)),
        )

    clips = []
    # The idle: he looks back over his shoulder, glances to the front, and looks back again.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, look, sway in ((0, 0, 1, 0), (10, 0.5, 1, 1), (18, 0.8, 0.1, 0), (26, 1, 0.1, 0), (32, 0.6, 1, -1), (40, 0.3, 1, 0), (48, 0, 1, 0)):
        idle.key(frame, stand(breath, look, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    # Swift: a fast prowl.
    walk = Clip("walk", 16, loop=True)
    walk.key(0, step(1)).key(4, step(1, 1)).key(8, step(-1)).key(12, step(-1, 1)).key(16, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, ready(stand())).key(15, hook(stand())).key(19, hook(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand(look=0))).key(41, spread(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(look=0))).key(10, pose(crouch(stand(look=0)), hips_at_loc=at("hips", (0, 0.04, -0.14))))
    summon.key(17, spread(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "pack-stalker.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
