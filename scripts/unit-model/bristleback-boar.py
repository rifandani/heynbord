"""
Bristleback Boar (`feral.bristlebackBoar`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a wild mountain boar with shaggy
dark brown fur, a tall ridge of stiff bristles from its head to its hips, a
long low head with a pink snout, small angry amber eyes, pointed ears, an
open mouth and two curved ivory tusks. A red apple, the bait that called it,
is stuck on its right tusk. A broken fence board is caught in its bristles
(Trample). Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/bristleback-boar.glb`; then
`bun unit-model:pack bristleback-boar` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). The Battle
camera sees the right side of a player Unit, so the apple is on the right
tusk. It has Swift, so its walk is a fast gallop with the tail up, and it has
Trample, so its attack is a charge with the head low that hooks the tusks up
through the enemy. In the death clip it falls on its left side (`(Y, +84)` on
the root), so the legs turn to the camera side (-X). It has no Keyword that
it uses by its own action, so it has no cast clip.
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

FUR = hex_color("#5e432d")
FUR_DARK = hex_color("#3c2a1c")
FUR_LIGHT = hex_color("#9c7650")
FUR_GRIZZLE = hex_color("#7a5a3c")
BRISTLE = hex_color("#2e2016")
BRISTLE_TIP = hex_color("#a88660")
SNOUT = hex_color("#b9857a")
SNOUT_DARK = hex_color("#8a5a52")
NOSTRIL = hex_color("#3a2420")
MOUTH = hex_color("#9c3a40")
TOOTH = hex_color("#efe6d2")
TUSK = hex_color("#ece2c8")
TUSK_DARK = hex_color("#b3a284")
EYE = hex_color("#d39a3a")
PUPIL = hex_color("#1c120c")
HOOF = hex_color("#2c221a")
APPLE = hex_color("#c8302a")
APPLE_LIGHT = hex_color("#e8603c")
STEM = hex_color("#5a3a20")
LEAF = hex_color("#5e8a32")
BOARD = hex_color("#a7845c")
BOARD_DARK = hex_color("#6e5236")
SPLINTER = hex_color("#d0b088")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.22, 0.34))
MID = Vector((0, 0.04, 0.37))
CHEST = Vector((0, -0.12, 0.39))
NECK = Vector((0, -0.23, 0.36))
# The head hangs low and forward, down to the snout.
SNOUT_TIP = Vector((0, -0.5, 0.2))
HEAD_C = Vector((0, -0.32, 0.31))
JAW_ROOT = Vector((0, -0.34, 0.24))
JAW_TIP = Vector((0, -0.46, 0.17))
# The head is big, so it reads on the Board: the parts are made at a small
# size and then scaled about the top of the neck.
HEAD_SCALE = 1.25


def grown(point):
    return NECK + (Vector(point) - NECK) * HEAD_SCALE


# The tusks come out of the corners of the mouth and curl up and back.
TUSKS = {
    sign: [Vector((0.035 * sign, -0.44, 0.205)), Vector((0.07 * sign, -0.47, 0.21)), Vector((0.092 * sign, -0.475, 0.245)), Vector((0.09 * sign, -0.455, 0.285)), Vector((0.072 * sign, -0.425, 0.305))]
    for sign in (1, -1)
}

LEGS = {
    # name: (top, joint, ankle, toe, parent)
    "FL": (Vector((0.085, -0.13, 0.3)), Vector((0.085, -0.14, 0.17)), Vector((0.085, -0.14, 0.06)), Vector((0.085, -0.19, 0.02)), "chest"),
    "FR": (Vector((-0.085, -0.13, 0.3)), Vector((-0.085, -0.14, 0.17)), Vector((-0.085, -0.14, 0.06)), Vector((-0.085, -0.19, 0.02)), "chest"),
    "BL": (Vector((0.08, 0.22, 0.28)), Vector((0.08, 0.25, 0.16)), Vector((0.08, 0.24, 0.06)), Vector((0.08, 0.19, 0.02)), "hips"),
    "BR": (Vector((-0.08, 0.22, 0.28)), Vector((-0.08, 0.25, 0.16)), Vector((-0.08, 0.24, 0.06)), Vector((-0.08, 0.19, 0.02)), "hips"),
}

TAIL = [Vector((0, 0.34, 0.39)), Vector((0, 0.37, 0.47))]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("head", tuple(NECK), tuple(grown(SNOUT_TIP)), "chest"),
    ("jaw", tuple(grown(JAW_ROOT)), tuple(grown(JAW_TIP)), "head"),
    ("ear.L", tuple(grown((0.06, -0.27, 0.39))), tuple(grown((0.1, -0.25, 0.46))), "head"),
    ("ear.R", tuple(grown((-0.06, -0.27, 0.39))), tuple(grown((-0.1, -0.25, 0.46))), "head"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[1]), "hips"),
]
for leg, (top, joint, ankle, toe, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(top), tuple(joint), parent),
        (f"lower.{leg}", tuple(joint), tuple(ankle), f"upper.{leg}"),
        (f"foot.{leg}", tuple(ankle), tuple(toe), f"lower.{leg}"),
    ]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front, the head in front of it."""
    if co.y > 0.12:
        return blend("spine", "hips", co.y, 0.08, 0.18)
    if co.y > -0.06:
        return blend("chest", "spine", co.y, -0.06, 0.06)
    return blend("chest", "head", co.y, -0.21, -0.29)


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.05)) / 0.07)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def grizzle(face, center):
    """Shaggy fur in patches: darker underneath, a grizzled light on the shoulders."""
    if face.normal.z < -0.35:
        return FUR_DARK
    tone = (int(center.x * 97) * 7 + int(center.y * 89) * 13 + int(center.z * 83) * 5) % 5
    if tone == 0 and center.z > 0.36:
        return FUR_GRIZZLE
    return FUR


def locks(part, center, radii, count, length, seed=0, only=None, colors=(FUR, FUR_LIGHT, FUR_DARK)):
    """Shaggy locks of fur that hang down from an ellipsoid."""
    center = Vector(center)
    golden = math.pi * (3 - math.sqrt(5))
    for index in range(count):
        z = 1 - 2 * (index + 0.5) / count
        r = math.sqrt(max(0.0, 1 - z * z))
        angle = golden * (index + seed)
        direction = Vector((math.cos(angle) * r, math.sin(angle) * r, z))
        if only and not only(direction):
            continue
        base = center + Vector((direction.x * radii[0], direction.y * radii[1], direction.z * radii[2])) * 0.92
        down = -Z - direction * direction.dot(-Z)
        if down.length < 0.25:
            down = Y - direction * direction.dot(Y)
        out = (direction * 0.3 + down.normalized() + Y * 0.2).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.4, 0.004, 4)
        part.paint(faces_of(verts), colors[1] if direction.z > 0.55 and index % 2 else (colors[0] if index % 3 else colors[2]))


def ridge(part, points, heights, rows=3):
    """
    The bristle ridge: rows of stiff spikes along the spine that stand up and
    lean back, tallest over the shoulders. Each spike has a light tip.
    """
    count = len(points)
    for index, (point, height) in enumerate(zip(points, heights)):
        for row in range(rows):
            spread = (row - (rows - 1) / 2) * 0.03
            jitter = ((index * 7 + row * 3) % 5 - 2) * 0.006
            base = Vector(point) + Vector((spread, jitter, -abs(spread) * 0.9))
            reach = height * (1.0 - abs(spread) * 6) * (0.8 + 0.4 * ((index * 5 + row) % 4) / 3)
            lean = Vector((spread * 2.2, 0.55 + 0.25 * index / count, 1.0)).normalized()
            tip = base + lean * reach
            body = kit.cone(part.bm, base, base.lerp(tip, 0.7), 0.028, 0.014, 4)
            part.paint(faces_of(body), BRISTLE)
            end = kit.cone(part.bm, base.lerp(tip, 0.7), tip, 0.014, 0.002, 4)
            part.paint(faces_of(end), BRISTLE_TIP)


def body_parts():
    parts = []
    body = Part("body", grizzle, body_weights, shade=0.22)
    # A wedge of a body: high heavy shoulders, a barrel and a small rump.
    kit.sphere(body.bm, (0, -0.1, 0.38), (0.15, 0.16, 0.17), 14, 10)
    kit.sphere(body.bm, (0, 0.06, 0.36), (0.14, 0.17, 0.14), 12, 8)
    kit.sphere(body.bm, (0, 0.22, 0.35), (0.12, 0.12, 0.12), 12, 8)
    kit.sphere(body.bm, (0, -0.22, 0.33), (0.11, 0.1, 0.12), 10, 8)
    parts.append(body)

    fur = Part("fur", FUR, body_weights, shade=0.12)
    # Shaggy locks on the flanks and the belly, and a thick ruff on the neck.
    locks(fur, (0, 0.04, 0.36), (0.15, 0.24, 0.14), 44, 0.06, 3, lambda d: -0.7 < d.z < 0.3, (FUR, FUR_GRIZZLE, FUR_DARK))
    locks(fur, (0, -0.17, 0.37), (0.14, 0.11, 0.15), 28, 0.07, 1, lambda d: d.z > -0.5 and d.y < 0.3, (FUR, FUR_LIGHT, FUR_DARK))
    parts.append(fur)

    bristles = Part("bristles", BRISTLE, body_weights, smooth=False, shade=0.1)
    # From the back of the head to the rump, tallest over the shoulders.
    spine = [(0, y, lerp(0.49, 0.44, (y + 0.2) / 0.5) + 0.04 * math.exp(-((y + 0.1) / 0.12) ** 2)) for y in (-0.21, -0.16, -0.11, -0.06, -0.01, 0.04, 0.09, 0.14, 0.19, 0.24, 0.28)]
    heights = [0.13, 0.17, 0.21, 0.22, 0.2, 0.17, 0.14, 0.12, 0.1, 0.08, 0.06]
    ridge(bristles, spine, heights, rows=4)
    parts.append(bristles)

    # A broken fence board, caught in the bristles over the hips (Trample).
    board = Part("board", BOARD, body_weights, smooth=False, shade=0.08)
    center = Vector((-0.03, 0.2, 0.47))
    along = Vector((0.75, 0.25, -0.6)).normalized()
    across = Vector((0, 0.3, 1)).cross(along).normalized()
    normal = along.cross(across).normalized()
    verts = kit.slab(board.bm, center, along * 0.16, across * 0.034, normal * 0.009)
    for face in faces_of(verts):
        if abs(face.normal.dot(normal)) < 0.5:
            board.paint([face], BOARD_DARK)
    # Splinters at the broken end, toward the camera side.
    end = center - along * 0.16
    for spread, length in ((-0.018, 0.05), (0.0, 0.07), (0.016, 0.04)):
        root = end + across * spread
        splinter = kit.cone(board.bm, root, root - along * length + across * spread * 0.8, 0.01, 0.002, 4, squash=0.4)
        board.paint(faces_of(splinter), SPLINTER)
    nail = kit.cone(board.bm, center + along * 0.12 + normal * 0.006, center + along * 0.12 + normal * 0.02, 0.006, 0.006, 4)
    board.paint(faces_of(nail), HOOF)
    parts.append(board)

    tail = Part("tail", FUR_DARK, "tail", shade=0.1)
    kit.tube(tail.bm, [TAIL[0], TAIL[1]], [0.014, 0.009], 5)
    tuft = Part("tail.tuft", BRISTLE, "tail", shade=0.1)
    for spread in (-1, 0, 1):
        kit.cone(tuft.bm, TAIL[1], TAIL[1] + Vector((0.025 * spread, 0.02, 0.05)), 0.012, 0.002, 4)
    parts += [tail, tuft]
    return parts


def head_parts():
    parts = []
    head = Part("head", grizzle, "head", shade=0.14)
    # A long wedge of a head that tapers down to the snout.
    kit.sphere(head.bm, HEAD_C + Vector((0, 0.03, 0.02)), (0.085, 0.09, 0.08), 12, 8)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.02, 0.0)), SNOUT_TIP + Vector((0, 0.02, 0.0)), 0.07, 0.042, 10)
    # Shaggy cheeks.
    locks(head, HEAD_C + Vector((0, 0.03, -0.01)), (0.08, 0.08, 0.07), 22, 0.05, 2, lambda d: abs(d.x) > 0.4 and d.z < 0.5)
    # The bristle ridge starts on the top of the head.
    ridge(head, [(0, -0.33, 0.37), (0, -0.29, 0.385), (0, -0.25, 0.395)], [0.06, 0.08, 0.1], rows=3)
    # The pink snout disk with two nostrils.
    disk = kit.cone(head.bm, SNOUT_TIP + Vector((0, 0.02, 0)), SNOUT_TIP - Vector((0, 0.012, 0)), 0.046, 0.044, 12)
    head.paint(faces_of(disk), SNOUT)
    for sign in (1, -1):
        nostril = kit.sphere(head.bm, SNOUT_TIP + Vector((0.016 * sign, -0.014, 0.004)), (0.01, 0.006, 0.013), 6, 4)
        head.paint(faces_of(nostril), NOSTRIL)
        # Small angry eyes under a heavy brow.
        eye = kit.sphere(head.bm, HEAD_C + Vector((0.07 * sign, -0.04, 0.025)), (0.017, 0.016, 0.014), 6, 4)
        head.paint(faces_of(eye), EYE)
        pupil = kit.sphere(head.bm, HEAD_C + Vector((0.08 * sign, -0.048, 0.025)), (0.008, 0.008, 0.008), 6, 4)
        head.paint(faces_of(pupil), PUPIL)
        brow = kit.slab(head.bm, HEAD_C + Vector((0.064 * sign, -0.045, 0.045)), Vector((0.03 * sign, -0.004, -0.012)), Vector((0, 0.022, 0.0)), Vector((0, 0, 0.008)))
        head.paint(faces_of(brow), FUR_DARK)
    # The upper lip and teeth over the open mouth.
    lip = kit.cone(head.bm, Vector((0, -0.37, 0.235)), SNOUT_TIP + Vector((0, 0.02, -0.02)), 0.055, 0.035, 8, squash=0.9)
    head.paint(faces_of(lip), SNOUT_DARK)
    parts.append(head)

    jaw = Part("jaw", FUR, "jaw", shade=0.12)
    jaw_root, jaw_tip = JAW_ROOT, JAW_TIP
    kit.cone(jaw.bm, jaw_root, jaw_tip, 0.05, 0.03, 8, squash=0.8)
    mouth = kit.cone(jaw.bm, jaw_root + Vector((0, -0.01, 0.022)), jaw_tip + Vector((0, 0.005, 0.02)), 0.035, 0.02, 8, squash=0.6)
    jaw.paint(faces_of(mouth), MOUTH)
    for sign in (1, -1):
        tooth = kit.cone(jaw.bm, jaw_tip + Vector((0.016 * sign, 0.012, 0.025)), jaw_tip + Vector((0.016 * sign, 0.01, 0.045)), 0.007, 0.002, 4)
        jaw.paint(faces_of(tooth), TOOTH)
    parts.append(jaw)

    tusks = Part("tusks", TUSK, "head", shade=0.16)
    for sign, path in TUSKS.items():
        verts = kit.tube(tusks.bm, path, [0.022, 0.02, 0.016, 0.01, 0.002], 8)
        for face in faces_of(verts):
            if face.calc_center_median().z < 0.215:
                tusks.paint([face], TUSK_DARK)
    parts.append(tusks)

    # The apple on the right tusk (the camera side), with a stem and a leaf.
    apple = Part("apple", APPLE, "head", shade=0.2)
    at = TUSKS[-1][2] + Vector((-0.012, -0.006, 0.002))
    verts = kit.sphere(apple.bm, at, (0.034, 0.032, 0.03), 10, 7)
    for face in faces_of(verts):
        if face.normal.dot(Vector((-0.6, -0.5, 0.6)).normalized()) > 0.6:
            apple.paint([face], APPLE_LIGHT)
    stem = kit.cone(apple.bm, at + Vector((0, 0, 0.026)), at + Vector((0.004, 0.006, 0.05)), 0.004, 0.003, 4)
    apple.paint(faces_of(stem), STEM)
    leaf = kit.slab(apple.bm, at + Vector((-0.01, 0.01, 0.042)), Vector((-0.018, 0.006, 0.004)), Vector((0, 0.009, 0)), Vector((0, 0, 0.002)))
    apple.paint(faces_of(leaf), LEAF)
    parts.append(apple)

    for side_name, sign in (("L", 1), ("R", -1)):
        ear = Part(f"ear.{side_name}", FUR, f"ear.{side_name}", shade=0.12)
        verts = kit.cone(ear.bm, (0.06 * sign, -0.27, 0.37), (0.105 * sign, -0.245, 0.47), 0.03, 0.003, 6, squash=0.45)
        for face in faces_of(verts):
            if face.normal.y < -0.4:
                ear.paint([face], SNOUT_DARK)
        parts.append(ear)
    grow = kit.Matrix.Translation(NECK) @ kit.Matrix.Scale(HEAD_SCALE, 4) @ kit.Matrix.Translation(-NECK)
    for part in parts:
        kit.bmesh.ops.transform(part.bm, matrix=grow, verts=list(part.bm.verts))
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, _toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", FUR, leg_weights(leg), shade=0.15)
        kit.cone(upper.bm, top + Vector((0, 0, 0.05)), joint, 0.078, 0.048, 8)
        locks(upper, top.lerp(joint, 0.35), (0.06, 0.06, 0.06), 10, 0.06, 1, lambda d: d.z < 0.4, (FUR_DARK, FUR, FUR_DARK))
        parts.append(upper)

        lower = Part(f"lower.{leg}", FUR_DARK, f"lower.{leg}", shade=0.15)
        kit.cone(lower.bm, joint, ankle, 0.046, 0.034, 8)
        parts.append(lower)

        # A split hoof, two dark toes, and a dew claw behind.
        foot = Part(f"foot.{leg}", HOOF, f"foot.{leg}", shade=0.1)
        kit.cone(foot.bm, Vector((ankle.x, ankle.y, 0.075)), Vector((ankle.x, ankle.y, 0.035)), 0.03, 0.034, 8)
        for sign in (1, -1):
            kit.cone(foot.bm, Vector((ankle.x + 0.014 * sign, ankle.y, 0.04)), Vector((ankle.x + 0.016 * sign, ankle.y - 0.04, 0.004)), 0.017, 0.006, 6)
        kit.cone(foot.bm, Vector((ankle.x, ankle.y + 0.02, 0.05)), Vector((ankle.x, ankle.y + 0.04, 0.03)), 0.008, 0.003, 4)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BristlebackBoar", BONES)
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BristlebackBoarMesh")
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

    def legs(**angles):
        """Leg swings: `FL=(upper, lower, foot)` in degrees about X. A negative upper swings forward."""
        result = {}
        for leg, (upper, lower, foot) in angles.items():
            result[f"upper__{leg}"] = t(f"upper.{leg}", (X, upper))
            result[f"lower__{leg}"] = t(f"lower.{leg}", (X, lower))
            result[f"foot__{leg}"] = t(f"foot.{leg}", (X, foot))
        return result

    def ears(flick=0.0):
        return {
            "ear.L": t("ear.L", (Z, 25 * flick), (X, -10 * flick)),
            "ear.R": t("ear.R", (Z, -25 * flick), (X, -10 * flick)),
        }

    def stand(breath=0.0, sway=0.0, snort=0.0):
        """The idle stance: turned a little to the camera, the head low and ready, it snorts and the ears flick."""
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.004)),
            "hips": t("hips", (Z, -8)),
            "spine": t("spine", (X, -breath * 1.5)),
            "chest": t("chest", (X, breath * 1.5), (Z, sway * 2)),
            "head": t("head", (Z, -6 + sway * 5), (X, 2 - breath * 3 - snort * 8), (Y, sway * 3)),
            "jaw": t("jaw", (X, 10 + breath * 4 + snort * 6)),
            **ears(0.2 + 0.6 * max(0.0, sway)),
            "tail": t("tail", (Y, sway * 30), (X, breath * 6)),
        }

    def gasp(breath=0.0):
        """Low HP: the legs give a little, the head hangs, and the mouth pants."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.004 - breath * 0.004)),
            spine=t("spine", (X, 3)),
            chest=t("chest", (X, 4 + breath * 2)),
            head=t("head", (X, 2 + breath * 3), (Y, -6)),
            jaw=t("jaw", (X, 12 + breath * 6)),
            **ears(-0.5),
            tail=t("tail", (X, 50)),
            **legs(FL=(-4, 14, -10), FR=(4, 12, -16), BL=(-6, 12, -6), BR=(-6, 12, -6)),
        )

    def recoil(base, amount=1.0):
        """The hit throws the head up and the body back, with a squeal."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, 0.0)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (X, -18 * amount), (Z, 10 * amount)),
            jaw=t("jaw", (X, 10 + 18 * amount)),
            **ears(amount),
            tail=t("tail", (X, -20 * amount)),
        )

    def buckle(base):
        """The front legs give way first."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.005)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 24)),
            **ears(0.5),
            **legs(FL=(-20, 50, -30), FR=(-10, 44, -30), BL=(-24, 36, -10), BR=(-20, 36, -10)),
        )

    def fallen(base, bounce=0.0):
        """
        On its left side, the legs stiff and out. The Battle camera sees the
        right side of a player Unit (-X), so it sees the legs and the belly.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.3, 0, 0.17)),
            chest=t("chest", (X, 4)),
            head=t("head", (X, 8), (Y, 10)),
            jaw=t("jaw", (X, 22)),
            **ears(-0.4),
            tail=t("tail", (X, 40)),
            **legs(FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)),
        )

    def low(base):
        """Down low with the legs folded, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.045)),
            chest=t("chest", (X, 2)),
            head=t("head", (X, -4)),
            **ears(-0.4),
            **legs(FL=(-50, 100, -50), FR=(-50, 100, -50), BL=(-60, 90, -30), BR=(-60, 90, -30)),
        )

    def squeal(base, rear=1.0):
        """The head tossed up and the mouth open: a squeal. The front lifts a little with `rear`."""
        return pose(
            base,
            hips=t("hips", (Z, -8), (X, -8 * rear)),
            hips_at_loc=at("hips", (0, 0.02 * rear, 0.0)),
            chest=t("chest", (X, -4 * rear)),
            head=t("head", (Z, -4), (X, -26)),
            jaw=t("jaw", (X, 34)),
            **ears(1.0),
            tail=t("tail", (X, -10)),
            **legs(FL=(-20 * rear, 36 * rear, -14 * rear), FR=(-6 * rear, 20 * rear, -14 * rear), BL=(6 * rear, 0, 0), BR=(8 * rear, 0, 0)),
        )

    def stride(phase):
        """
        The gallop (Swift): the front legs and then the back legs, each pair
        a little apart. `phase` 0 to 1 is one cycle. The body rocks and the
        tail stands up.
        """
        wave = math.sin(phase * 2 * math.pi)
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.02 * max(0.0, wave) - 0.006)),
            hips=t("hips", (Z, -8), (X, 6 * wave)),
            chest=t("chest", (X, -6 * wave)),
            head=t("head", (Z, -6), (X, 6 + 6 * wave)),
            jaw=t("jaw", (X, 16)),
            **ears(-0.6),
            tail=t("tail", (X, -14), (Y, 10 * wave)),
        )
        for leg, offset in (("FL", 0.0), ("FR", 0.1), ("BL", 0.5), ("BR", 0.6)):
            local = (phase - offset) % 1.0
            # The first 45% of the cycle in the air, the rest on the ground, pushed back.
            if local < 0.45:
                u = local / 0.45
                swing = lerp(30, -32, u)
                lift = math.sin(u * math.pi)
            else:
                u = (local - 0.45) / 0.55
                swing = lerp(-32, 30, u)
                lift = 0.0
            back = leg.startswith("B")
            bend = (40 if back else 60) * lift
            result = pose(result, **legs(**{leg: (swing - 10 * lift, bend, 10 * lift - swing - bend)}))
        return result

    # The attack (Trample): it paws, lowers its head and charges, then hooks
    # the tusks up through the enemy. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the tusks hook up at frame 15 of 30.
    def paw(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, 0.0)),
            chest=t("chest", (X, 4)),
            head=t("head", (Z, -4), (X, 8)),
            jaw=t("jaw", (X, 18)),
            **ears(-0.6),
            tail=t("tail", (X, -30)),
            **legs(FL=(-10, 16, -6), FR=(-34, 64, -10), BL=(-12, 18, -6), BR=(-10, 16, -6)),
        )

    def charge(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.12, 0.02)),
            hips=t("hips", (Z, -8), (X, 2)),
            chest=t("chest", (X, 4)),
            head=t("head", (Z, -4), (X, 18)),
            jaw=t("jaw", (X, 20)),
            **ears(-0.8),
            tail=t("tail", (X, -40)),
            **legs(FL=(-38, 30, 0), FR=(-24, 24, -4), BL=(34, 0, -26), BR=(28, -4, -24)),
        )

    def hook(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.19 - 0.02 * follow, 0.05)),
            hips=t("hips", (Z, -8), (X, -6)),
            chest=t("chest", (X, -8)),
            head=t("head", (Z, -4), (X, -30 - 6 * follow), (Y, 8)),
            jaw=t("jaw", (X, 30)),
            **ears(1.0),
            tail=t("tail", (X, -30)),
            **legs(FL=(-34, 30, 0), FR=(-20, 20, -4), BL=(26, 0, -24), BR=(32, -4, -26)),
        )

    clips = []
    idle = Clip("idle", 40, loop=True)
    for frame, breath, sway, snort in ((0, 0, 0, 0), (10, 0.5, 1, 0), (16, 0.6, 0.6, 1), (20, 1, 0, 0), (30, 0.5, -1, 0), (40, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, snort))
    clips.append(idle)

    low_hp = Clip("lowHp", 40, loop=True)
    for frame, breath in ((0, 0), (10, 1), (20, 0), (30, 1), (40, 0)):
        low_hp.key(frame, gasp(breath))
    clips.append(low_hp)

    walk = Clip("walk", 14, loop=True)
    for frame in range(15):
        walk.key(frame, stride(frame / 14))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(5, paw(stand())).key(10, charge(stand()))
    attack.key(15, hook(stand())).key(19, hook(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, buckle(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, low(stand())).key(15, squeal(stand())).key(19, squeal(stand(), 0.6))
    summon.key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "bristleback-boar.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
