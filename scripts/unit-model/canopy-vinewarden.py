"""
Canopy Vinewarden (`elf.canopyVinewarden`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a tall elf with long auburn hair
under a crown of gold leaves, a bodice of green leaf scales, a long ragged
leaf cloak, brown leggings and tall boots. A living vine coils round her
right arm and hangs from her hand. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/canopy-vinewarden.glb`;
then `bun unit-model:pack canopy-vinewarden` packs it for the game.

The Battle camera sees the right side of a player Unit, so the vine is on the
right arm. Her attack (Long Range) is a lash of the vine: the arm throws it
forward and the vine bones straighten. She has no Keyword that she uses by
her own action, so she has no cast clip.
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

SKIN = hex_color("#e8b892")
HAIR = hex_color("#b4542a")
HAIR_LIGHT = hex_color("#d77c3e")
EYES = hex_color("#1f2a1a")
LEAF = hex_color("#5f8a3a")
LEAF_DARK = hex_color("#3f6128")
LEAF_LIGHT = hex_color("#93b55a")
GOLD = hex_color("#dcab42")
LEATHER = hex_color("#6a4426")
LEGGINGS = hex_color("#4f3522")
BOOT = hex_color("#7a5232")
VINE = hex_color("#6b5530")
VINE_DARK = hex_color("#4a3a20")

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

# The arms hang in an A-pose, 20 degrees from the body.
ARM_DIR = Vector((math.sin(math.radians(20)), 0, -math.cos(math.radians(20))))


def arm_points(sign):
    shoulder = Vector((0.1 * sign, 0, SHOULDER_Z))
    direction = Vector((ARM_DIR.x * sign, 0, ARM_DIR.z))
    elbow = shoulder + direction * 0.15
    wrist = elbow + direction * 0.14
    tip = wrist + direction * 0.055
    return shoulder, elbow, wrist, tip, direction


SL, EL, WL, TL, DL = arm_points(1)
SR, ER, WR, TR, DR = arm_points(-1)

# The vine hangs from the right hand in three bones, a little forward.
VINE_DIR = Vector((-0.12, -0.22, -1)).normalized()
VINE_BONE = 0.115
VINE_POINTS = [TR + VINE_DIR * VINE_BONE * index for index in range(4)]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("hair", (0, 0.07, 0.86), (0, 0.1, 0.7), "head"),
    ("hair.2", (0, 0.1, 0.7), (0, 0.12, 0.52), "hair"),
    ("cloak", (0, 0.08, 0.7), (0, 0.15, 0.3), "chest"),
    ("cloak.2", (0, 0.15, 0.3), (0, 0.19, 0.06), "cloak"),
]
for side, sign, (s, e, w, t, _) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
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
    ("vine", tuple(VINE_POINTS[0]), tuple(VINE_POINTS[1]), "hand.R"),
    ("vine.2", tuple(VINE_POINTS[1]), tuple(VINE_POINTS[2]), "vine"),
    ("vine.3", tuple(VINE_POINTS[2]), tuple(VINE_POINTS[3]), "vine.2"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    t = clamp01((0.53 - co.z) / 0.3)
    side = co.x / 0.12
    return {
        "hips": 1 - t * 0.8,
        "thigh.L": t * clamp01(side) * 0.8,
        "thigh.R": t * clamp01(-side) * 0.8,
    }


def hair_weights(co):
    if co.z > 0.72:
        return blend("hair", "head", co.z, 0.78, 0.84)
    return blend("hair.2", "hair", co.z, 0.6, 0.7)


def cloak_weights(co):
    if co.z > 0.62:
        return blend("cloak", "chest", co.z, 0.64, 0.7)
    return blend("cloak.2", "cloak", co.z, 0.25, 0.36)


def vine_weights(co):
    """Along the chain of the vine: each bone takes its own length."""
    s = (co - VINE_POINTS[0]).dot(VINE_DIR) / VINE_BONE
    if s < 1:
        return blend("vine", "vine.2", s, 0.8, 1.1) if s > 0.8 else {"vine": 1.0}
    if s < 2:
        return blend("vine.2", "vine.3", s, 1.8, 2.1)
    return {"vine.3": 1.0}


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
    kit.sphere(head.bm, HEAD_C, (0.064, 0.068, 0.081), 14, 10)
    kit.cone(head.bm, (0, -0.064, 0.87), (0, -0.08, 0.862), 0.011, 0.002, 5)
    for sign in (1, -1):
        # Elf ears: long points that go up and back.
        kit.cone(head.bm, (0.056 * sign, 0.004, 0.872), (0.122 * sign, 0.035, 0.93), 0.016, 0.001, 5, squash=0.45)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.025 * sign, -0.059, 0.883), (0.011, 0.008, 0.012), 8, 6)
    parts.append(eyes)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.025, 0.023, 8)
    parts.append(neck)

    # The hair: a cap over the head, wild locks round the face and down to the shoulders.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.01, 0.89), (0.078, 0.084, 0.09), 14, 10)
    face = [v for v in verts if v.co.z < 0.82 or (v.co.y < -0.035 and v.co.z < 0.9)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    for sign in (1, -1):
        for dx, dz, color in ((0.0, 0.0, HAIR), (0.02, -0.02, HAIR_LIGHT)):
            lock = kit.cone(hair.bm, ((0.062 + dx) * sign, -0.03, 0.9 + dz), ((0.085 + dx) * sign, -0.01, 0.74 + dz), 0.024, 0.008, 6, squash=0.7)
            hair.paint(faces_of(lock), color)
    parts.append(hair)

    # The long mane down the back, wide and full.
    mane = Part("mane", HAIR, hair_weights)
    kit.tube(mane.bm, [(0, 0.05, 0.93), (0, 0.09, 0.82), (0, 0.11, 0.68), (0, 0.125, 0.56), (0, 0.13, 0.48)], [0.07, 0.078, 0.07, 0.055, 0.02], 9)
    for sign in (1, -1):
        strand = kit.tube(mane.bm, [(0.05 * sign, 0.07, 0.88), (0.07 * sign, 0.1, 0.74), (0.065 * sign, 0.11, 0.6), (0.05 * sign, 0.115, 0.52)], [0.035, 0.035, 0.028, 0.008], 6)
        mane.paint(faces_of(strand), HAIR_LIGHT)
    parts.append(mane)

    # The crown of gold leaves.
    crown = Part("crown", GOLD, "head", shade=0.05)
    kit.torus(crown.bm, (0, 0.005, 0.925), (0, 0.3, 1), 0.08, 0.005, 18, 4)
    for index in range(9):
        angle = math.radians(-80 + index * 20)
        base = Vector((0.08 * math.sin(angle), -0.08 * math.cos(angle) * 0.95 + 0.01, 0.93 + 0.012 * abs(math.sin(angle))))
        out = Vector((math.sin(angle) * 0.6, -math.cos(angle) * 0.4, 1))
        leaf(crown, base, out, 0.05 if index != 4 else 0.065, 0.016, LEAF_LIGHT if index % 2 else GOLD)
    parts.append(crown)
    return parts


def body_parts():
    parts = []

    def scales(face, center):
        # Rows of leaf scales on the bodice.
        return LEAF_DARK if int(center.z * 70) % 2 else LEAF

    bodice = Part("bodice", scales, torso_weights, smooth=False)
    kit.cone(bodice.bm, (0, 0, 0.5), (0, 0, 0.735), 0.062, 0.08, 12, squash=0.72)
    parts.append(bodice)

    collar = Part("collar", GOLD, "chest", shade=0.05)
    kit.torus(collar.bm, (0, 0.004, 0.735), (0, 0.1, 1), 0.058, 0.007, 12, 4)
    gem = kit.sphere(collar.bm, (0, -0.058, 0.715), (0.012, 0.008, 0.014), 6, 4)
    collar.paint(faces_of(gem), LEAF_LIGHT)
    parts.append(collar)

    belt = Part("belt", LEATHER, "hips")
    kit.cone(belt.bm, (0, 0, 0.488), (0, 0, 0.512), 0.07, 0.069, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.057, 0.5), (0.022, 0.008, 0.022))
    belt.paint(faces_of(buckle), GOLD)
    parts.append(belt)

    hips = Part("hips", LEGGINGS, "hips")
    kit.cone(hips.bm, (0, 0, 0.42), (0, 0, 0.5), 0.068, 0.066, 12, squash=0.8)
    parts.append(hips)

    # A short skirt of long leaves, overlapping round the hips.
    skirt = Part("skirt", LEAF, skirt_weights, shade=0.12)
    for index in range(14):
        angle = 2 * math.pi * index / 14
        out = Vector((math.sin(angle), -math.cos(angle) * 0.82, 0))
        base = Vector((0, 0, 0.5)) + out * 0.066
        leaf(skirt, base, out * 0.45 + Vector((0, 0, -1)), 0.17 + 0.03 * (index % 2), 0.034, LEAF_DARK if index % 2 else LEAF)
    parts.append(skirt)

    def cloak_color(row, column):
        return LEAF_DARK if column % 3 == 1 else LEAF

    # The long leaf cloak from the shoulders, open at the front, ragged at the hem.
    cloak = Part("cloak", LEAF, cloak_weights)
    kit.ragged_cone(cloak, 0.725, 0.04, 0.09, 0.2, 16, 6, 0.75, 0.1, cloak_color, LEAF_LIGHT, gap=math.radians(80), y_push=0.08)
    parts.append(cloak)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t, d) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
        # Shoulder guards of three big leaves.
        guard = Part(f"guard.{side}", LEAF, f"upperarm.{side}", shade=0.1)
        for index, (dy, color) in enumerate(((-0.025, LEAF), (0.0, LEAF_LIGHT), (0.025, LEAF_DARK))):
            leaf(guard, s + Vector((-0.005 * sign, dy, 0.02)), Vector((0.9 * sign, dy * 4, -0.5)), 0.075, 0.03, color)
        parts.append(guard)

        sleeve = Part(f"sleeve.{side}", SKIN, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.025, 0.021, 8)
        parts.append(sleeve)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}")
        verts = kit.cone(bracer.bm, e, w, 0.023, 0.019, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.012 for f in v.link_faces}, GOLD)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.025, (0.017, 0.015, 0.024), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", LEGGINGS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.04, 0.031, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        verts = kit.cone(boot.bm, knee + Vector((0, 0, 0.02)), ankle, 0.038, 0.03, 8)
        boot.paint({f for v in verts if v.co.z > 0.27 for f in v.link_faces}, LEATHER)
        cuff = leaf(boot, knee + Vector((0, -0.03, -0.02)), (0, -0.4, 1), 0.05, 0.025, LEAF)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.025), (0.054, 0.11, 0.05))
        parts.append(foot)
    return parts


def vine_parts():
    parts = []
    # The vine coils round the right forearm.
    coil = Part("coil", VINE, "forearm.R", shade=0.08)
    side = DR.cross(Y).normalized()
    up = DR.cross(side).normalized()
    points = []
    for step in range(15):
        s = step / 14
        angle = s * 2.5 * 2 * math.pi
        points.append(ER + DR * (0.01 + s * 0.135) + (side * math.cos(angle) + up * math.sin(angle)) * 0.03)
    kit.tube(coil.bm, points, [0.007] * len(points), 5)
    for index in (3, 7, 11):
        leaf(coil, points[index], points[index] - ER - DR * (points[index] - ER).dot(DR), 0.035, 0.014, LEAF_LIGHT)
    parts.append(coil)

    # The free vine hangs from the hand with a light curl and a few leaves.
    vine = Part("vine", VINE, vine_weights, shade=0.08)
    swing = VINE_DIR.cross(X).normalized()
    path = []
    steps = 12
    length = VINE_BONE * 3
    for step in range(steps + 1):
        s = step / steps
        path.append(TR + VINE_DIR * (length * s) + X * (0.018 * math.sin(s * 9)) + swing * (0.015 * math.sin(s * 7)))
    radii = [lerp(0.016, 0.005, step / steps) for step in range(steps + 1)]
    verts = kit.tube(vine.bm, path, radii, 5)
    for face in faces_of(verts):
        if int(face.calc_center_median().z * 80) % 3 == 0:
            vine.paint([face], VINE_DARK)
    for index in (2, 5, 8, 11):
        out = X * (1 if index % 2 else -1) + VINE_DIR * 0.4
        leaf(vine, path[index], out, 0.04, 0.016, LEAF if index % 2 else LEAF_LIGHT)
    # A small curl of thorns at the tip.
    tip = path[-1]
    kit.cone(vine.bm, tip, tip + VINE_DIR * 0.025 - Y * 0.015, 0.005, 0.001, 4)
    parts.append(vine)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CanopyVinewarden", BONES)
    parts = head_parts() + body_parts() + limb_parts() + vine_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CanopyVinewardenMesh")
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

    def vine(curl=0.0, wave=0.0):
        """The vine curls forward (`curl`) and waves to the side (`wave`)."""
        return {
            "vine": t("vine", (X, -10 * curl), (Y, 6 * wave)),
            "vine.2": t("vine.2", (X, -22 * curl), (Y, -10 * wave)),
            "vine.3": t("vine.3", (X, -34 * curl), (Y, 14 * wave)),
        }

    def stand(breath=0.0, sway=0.0):
        """The idle stance: the weight on one hip, the left hand open, the vine alive in the right hand."""
        return {
            "hips": t("hips", (Y, -3), (Z, -8)),
            "spine": t("spine", (X, 1 + breath * 0.5), (Y, 3)),
            "chest": t("chest", (X, -3 - breath * 2), (Z, 4)),
            "neck": t("neck", (X, 2)),
            "head": t("head", (X, 2 + breath), (Z, 6 + sway * 4)),
            "upperarm.L": t("upperarm.L", (Y, 6 + breath), (X, -6)),
            "forearm.L": t("forearm.L", (X, -20)),
            "upperarm.R": t("upperarm.R", (Y, -10 - breath), (X, -12)),
            "forearm.R": t("forearm.R", (X, -30)),
            "hair": t("hair", (X, -breath * 2), (Y, sway * 3)),
            "hair.2": t("hair.2", (Y, sway * 4)),
            "cloak": t("cloak", (X, -2 - breath * 2), (Y, sway * 2)),
            "cloak.2": t("cloak.2", (X, -breath * 3)),
            "thigh.L": t("thigh.L", (Y, -3), (X, -4)),
            "shin.L": t("shin.L", (X, 6)),
            "thigh.R": t("thigh.R", (Y, 3), (X, 3)),
            **vine(0.2 + 0.25 * breath, sway),
        }

    def crouch(base):
        """Down on both knees bent, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.135)),
            thigh__L=t("thigh.L", (X, -50), (Y, -4)),
            shin__L=t("shin.L", (X, 95)),
            foot__L=t("foot.L", (X, -45)),
            thigh__R=t("thigh.R", (X, -50), (Y, 4)),
            shin__R=t("shin.R", (X, 95)),
            foot__R=t("foot.R", (X, -45)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 22)),
            hair=t("hair", (X, -40)),
            hair__2=t("hair.2", (X, -12)),
            upperarm__L=t("upperarm.L", (Y, 18), (X, -20)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, -20)),
            forearm__R=t("forearm.R", (X, -30)),
            cloak=t("cloak", (X, 30)),
            cloak__2=t("cloak.2", (X, 20)),
            **vine(1.4),
        )

    def slump(breath=0.0):
        """Low HP: bent over, the left hand on the side, the vine limp on the ground."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            spine=t("spine", (X, 12 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2), (Z, -6)),
            neck=t("neck", (X, 8)),
            head=t("head", (X, 4 + breath * 4), (Y, 6)),
            upperarm__L=t("upperarm.L", (X, -12), (Y, 22)),
            forearm__L=t("forearm.L", (X, -85), (Z, -65)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, 4)),
            forearm__R=t("forearm.R", (X, -6)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 26)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -8), (Y, 4)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -10)),
            hair=t("hair", (X, -24)),
            hair__2=t("hair.2", (X, -8)),
            **vine(-0.6 - 0.2 * breath),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -14 * amount), (Z, 8 * amount)),
            upperarm__L=t("upperarm.L", (Y, -14 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, 18 * amount), (X, 10 * amount)),
            forearm__R=t("forearm.R", (X, -40 * amount)),
            hair=t("hair", (X, 14 * amount)),
            cloak=t("cloak", (X, 12 * amount)),
            **vine(-0.8 * amount, amount),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            thigh__L=t("thigh.L", (X, -18)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -12)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 20)),
            hair=t("hair", (X, -30)),
            upperarm__L=t("upperarm.L", (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -10)),
            **vine(-0.4),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the vine loose beside her."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, 0)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (Y, -35), (X, 20)),
            upperarm__R=t("upperarm.R", (Y, 35), (X, 20)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 8)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 30)),
            hair=t("hair", (X, -50)),
            hair__2=t("hair.2", (X, -20)),
            cloak=t("cloak", (X, -60)),
            cloak__2=t("cloak.2", (X, -20)),
            **vine(-1.0, 1.5),
        )

    def heroic(base):
        """Up, the vine hand high: the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.008)),
            chest=t("chest", (X, -12)),
            head=t("head", (X, -12)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, 30)),
            hair=t("hair", (X, 12)),
            cloak=t("cloak", (X, 14)),
            **vine(-0.5, 1),
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.012)),
            hips=t("hips", (Z, -4 * front)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (Z, -5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -10), (X, -12 * front)),
                "upperarm__L": t("upperarm.L", (Y, 8), (X, 12 * front)),
                "hair": t("hair", (X, -8), (Y, 4 * front)),
                "cloak": t("cloak", (X, -14)),
                "cloak__2": t("cloak.2", (X, -6)),
                **vine(0.5, front),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.008)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "hair": t("hair", (X, -4)),
                "cloak": t("cloak", (X, -10)),
                **vine(0.35),
            },
        )

    # The attack (Long Range): she pulls the vine back, then throws the arm
    # forward and the vine lashes out straight. The projectile leaves at 20%
    # of the attack (`FLIGHT_START` in fx.ts), so the lash is out at frame 6 of 30.
    def draw(base):
        return pose(
            base,
            hips=t("hips", (Z, -12)),
            spine=t("spine", (Z, -8), (X, -4)),
            chest=t("chest", (Z, -10), (X, -6)),
            head=t("head", (Z, 22)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, -40)),
            forearm__R=t("forearm.R", (X, -70)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 20)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__L=t("thigh.L", (X, -20), (Y, -4)),
            shin__L=t("shin.L", (X, 14)),
            thigh__R=t("thigh.R", (X, 12), (Y, 4)),
            shin__R=t("shin.R", (X, 10)),
            cloak=t("cloak", (X, -8)),
            **vine(1.6, -1),
        )

    def lash(base, curl=-0.3):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.02, -0.02)),
            hips=t("hips", (Z, 12)),
            spine=t("spine", (Z, 8), (X, 8)),
            chest=t("chest", (Z, 10), (X, 4)),
            head=t("head", (Z, -24)),
            upperarm__R=t("upperarm.R", (X, -88), (Y, -6)),
            forearm__R=t("forearm.R", (X, -4)),
            hand__R=t("hand.R", (X, 6)),
            upperarm__L=t("upperarm.L", (X, 26), (Y, -30)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__L=t("thigh.L", (X, -30), (Y, -4)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 6)),
            thigh__R=t("thigh.R", (X, 22), (Y, 4)),
            shin__R=t("shin.R", (X, 12)),
            foot__R=t("foot.R", (X, -18)),
            hair=t("hair", (X, 18)),
            hair__2=t("hair.2", (X, 10)),
            cloak=t("cloak", (X, 20)),
            cloak__2=t("cloak.2", (X, 10)),
            **vine(curl),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, draw(stand())).key(6, lash(stand(), 0.4)).key(8, lash(stand()))
    attack.key(13, lash(stand(), 0.3)).key(22, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0, -0.06))))
    summon.key(17, heroic(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "canopy-vinewarden.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
