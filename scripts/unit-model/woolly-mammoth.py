"""
Woolly Mammoth (`feral.woollyMammoth`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a woolly mammoth with a high dome
head, a back that slopes down to the hips, thick matted brown fur that hangs
almost to the ground, icicles and snow in the fur, long ivory tusks that curve
down, forward and up, and the planks of a fence that broke over its tusks. A
bird's nest with a small bird sits in the fur on top of its head. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/woolly-mammoth.glb`; then
`bun unit-model:pack woolly-mammoth` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). The Battle
camera sees the right side of a player Unit, so the broken fence hangs on the
right tusk. It is Heavy, so its walk is slow, one leg at a time. It has
Trample, so its attack is a charge that tosses the tusks up through the enemy.
In the death clip it falls on its left side (`(Y, +84)` on the root), so the
legs turn to the camera side (-X), and the bird flies off. It has no Keyword
that it uses by its own action, so it has no cast clip.
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

import body_plans  # noqa: E402
import clips  # noqa: E402
import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from clips.base import Beat  # noqa: E402
from clips.overrides import Fall, Patch  # noqa: E402

plan = body_plans.BODY_PLANS["quadruped"]

from unit_model_kit import X, Y, Z, Part, blend, clamp01, faces_of, hex_color, lerp  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

FUR = hex_color("#8a5a34")
FUR_LIGHT = hex_color("#b07a48")
FUR_DARK = hex_color("#5e3a20")
SKIN = hex_color("#6e4a32")
SKIN_DARK = hex_color("#4a3022")
EYE = hex_color("#1e140e")
EYE_RIM = hex_color("#c99a5a")
TUSK = hex_color("#efe4cc")
TUSK_DARK = hex_color("#c9b894")
SNOW = hex_color("#f2f4f6")
ICE = hex_color("#cfeeff")
WOOD = hex_color("#7a5636")
WOOD_DARK = hex_color("#4e3420")
ROPE = hex_color("#b49a6a")
NEST = hex_color("#9d764e")
BIRD = hex_color("#e9e4db")
BIRD_DARK = hex_color("#40393d")
BEAK = hex_color("#e09a2a")
TOE = hex_color("#ecd5c7")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.24, 0.46))
MID = Vector((0, 0.06, 0.52))
CHEST = Vector((0, -0.12, 0.56))
NECK = Vector((0, -0.24, 0.6))
HEAD = Vector((0, -0.3, 0.64))
HEAD_C = Vector((0, -0.34, 0.72))

# The trunk hangs from the face and curls forward at its tip.
TRUNK = [Vector((0, -0.45, 0.6)), Vector((0, -0.5, 0.46)), Vector((0, -0.5, 0.32)), Vector((0, -0.46, 0.2))]

# Each tusk: from the lip down and forward, then up, the tip in toward the other.
TUSKS = {
    sign: [Vector((0.07 * sign, -0.43, 0.53)), Vector((0.11 * sign, -0.52, 0.4)), Vector((0.13 * sign, -0.65, 0.33)), Vector((0.12 * sign, -0.78, 0.38)), Vector((0.07 * sign, -0.85, 0.48)), Vector((0.03 * sign, -0.84, 0.55))]
    for sign in (1, -1)
}

TABLE = plan.Proportions(
    hip_y=HIP.y,
    hip_z=HIP.z,
    mid_y=MID.y,
    mid_z=MID.z,
    chest_y=CHEST.y,
    chest_z=CHEST.z,
    neck_y=NECK.y,
    neck_z=NECK.z,
    necks=(),
    head_tip_y=(HEAD_C + Vector((0, -0.12, 0.0))).y,
    head_tip_z=(HEAD_C + Vector((0, -0.12, 0.0))).z,
    front_top_x=0.13,
    front_top_y=-0.13,
    front_top_z=0.42,
    front_knee_x=0.13,
    front_knee_y=-0.14,
    front_knee_z=0.24,
    front_ankle_x=0.13,
    front_ankle_y=-0.14,
    front_ankle_z=0.07,
    front_toe_x=0.13,
    front_toe_y=-0.22,
    front_toe_z=0.03,
    back_top_x=0.12,
    back_top_y=0.25,
    back_top_z=0.38,
    back_knee_x=0.12,
    back_knee_y=0.27,
    back_knee_z=0.22,
    back_ankle_x=0.12,
    back_ankle_y=0.26,
    back_ankle_z=0.07,
    back_toe_x=0.12,
    back_toe_y=0.18,
    back_toe_z=0.03,
)

LEGS = {
    leg: (*map(Vector, plan.leg_points(TABLE, leg)), plan.leg_parent(leg))
    for leg in plan.LEGS
}

TAIL = [Vector((0, 0.42, 0.5)), Vector((0, 0.47, 0.36))]
NEST_C = Vector((0.0, -0.31, 0.95))
BIRD_C = NEST_C + Vector((0.0, 0.0, 0.05))

TRUNK_BONES = [
    ('trunk', tuple(TRUNK[0]), tuple(TRUNK[1]), 'head'),
    ('trunk.2', tuple(TRUNK[1]), tuple(TRUNK[2]), 'trunk'),
    ('trunk.3', tuple(TRUNK[2]), tuple(TRUNK[3]), 'trunk.2'),
    ('ear.L', (0.12, -0.3, 0.7), (0.17, -0.27, 0.62), 'head'),
    ('ear.R', (-0.12, -0.3, 0.7), (-0.17, -0.27, 0.62), 'head'),
    ('tail', tuple(TAIL[0]), tuple(TAIL[1]), 'hips'),
    ('bird', tuple(BIRD_C), tuple(BIRD_C + Vector((0, -0.05, 0))), 'head'),
]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front, the head in front of it."""
    if co.y > 0.14:
        return blend("spine", "hips", co.y, 0.1, 0.2)
    if co.y > -0.06:
        return blend("chest", "spine", co.y, -0.06, 0.06)
    return blend("head", "chest", co.y, -0.3, -0.2) if co.z > 0.55 else {"chest": 1.0}


def chain_weights(points, names):
    """Along a chain of bones: each bone takes its own length, with a blend at each joint."""

    def weights(co):
        best, best_index, best_t = None, 0, 0.0
        for index in range(len(points) - 1):
            a, b = points[index], points[index + 1]
            ab = b - a
            t = clamp01((co - a).dot(ab) / ab.length_squared)
            distance = (a + ab * t - co).length
            if best is None or distance < best:
                best, best_index, best_t = distance, index, t
        if best_t > 0.82 and best_index + 1 < len(names):
            return blend(names[best_index], names[best_index + 1], best_t, 0.82, 1.18)
        return {names[best_index]: 1.0}

    return weights


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.06)) / 0.08)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def fur_color(face, center):
    """Matted fur in large shapes: snow on the top, light on the back, dark low on the sides."""
    if face.normal.z > 0.82 and center.z > 0.6:
        return SNOW
    if face.normal.z < -0.3:
        return FUR_DARK
    if face.normal.z > 0.45:
        return FUR_LIGHT
    return FUR


def locks(part, center, radii, count, length, seed=0, only=None):
    """Long matted locks of fur that hang down from an ellipsoid, with an icicle at some tips."""
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
        out = (direction * 0.35 + down.normalized()).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        tip = base + out * reach
        verts = kit.cone(part.bm, base, tip, length * 0.4, 0.004, 4)
        part.paint(faces_of(verts), FUR_LIGHT if direction.z > 0.5 else (FUR if index % 3 else FUR_DARK))
        if index % 5 == 0 and direction.z < 0.6:
            icicle = kit.cone(part.bm, tip + Vector((0, 0, 0.01)), tip + Vector((0, 0, -0.045)), 0.008, 0.001, 4)
            part.paint(faces_of(icicle), ICE)


def skirt(part, center, radius, squash, top_z, bottom_z, columns=16):
    """The long fur that hangs from the body like a skirt, with a ragged hem and icicles."""
    rows = 3

    def grid(inset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                theta = 2 * math.pi * column / columns
                tear = 0.05 * v * (((column * 7) % 5) / 4)
                z = lerp(top_z, bottom_z + tear, v)
                r = lerp(radius * 0.92, radius * 1.08, v) - inset
                line.append(Vector((center.x + r * math.sin(theta), center.y - r * math.cos(theta) * squash, z)))
            result.append(line)
        return result

    outer_grid = grid(0.0)
    _, outer = kit.sheet(part.bm, outer_grid)
    _, inner = kit.sheet(part.bm, grid(0.01))
    for face, row, column in outer:
        part.paint([face], FUR_DARK if row == rows - 1 and column % 2 else FUR)
    for face, _row, _column in inner:
        part.paint([face], FUR_DARK)
    for column in range(0, columns, 3):
        tip = outer_grid[rows][column]
        icicle = kit.cone(part.bm, tip + Vector((0, 0, 0.01)), tip + Vector((0, 0, -0.05)), 0.01, 0.001, 4)
        part.paint(faces_of(icicle), ICE)


def body_parts():
    parts = []
    body = Part("body", fur_color, body_weights, shade=0.22)
    # The high shoulders, the barrel and the low hindquarters.
    kit.sphere(body.bm, (0, -0.1, 0.56), (0.24, 0.24, 0.24), 14, 10)
    kit.sphere(body.bm, (0, 0.08, 0.5), (0.22, 0.22, 0.2), 12, 8)
    kit.sphere(body.bm, (0, 0.26, 0.46), (0.19, 0.17, 0.17), 12, 8)
    # The shoulder hump.
    kit.sphere(body.bm, (0, -0.1, 0.72), (0.15, 0.17, 0.1), 10, 6)
    locks(body, (0, -0.06, 0.58), (0.24, 0.26, 0.22), 46, 0.13, 0, lambda d: d.z < 0.75)
    locks(body, (0, 0.24, 0.48), (0.19, 0.18, 0.17), 24, 0.11, 3, lambda d: d.y > 0.0 and d.z < 0.75)
    parts.append(body)

    hem = Part("skirt", FUR, body_weights, shade=0.15)
    skirt(hem, Vector((0, 0.07, 0)), 0.22, 1.7, 0.42, 0.17)
    parts.append(hem)

    tail = Part("tail", FUR_DARK, chain_weights(TAIL, ["tail"]), shade=0.1)
    kit.tube(tail.bm, [TAIL[0], TAIL[1], TAIL[1] + Vector((0, 0.01, -0.04))], [0.022, 0.016, 0.004], 5)
    kit.sphere(tail.bm, TAIL[1] + Vector((0, 0.01, -0.03)), (0.025, 0.025, 0.04), 6, 4)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", fur_color, "head", shade=0.15)
    # The high dome of the head and the broad face.
    kit.sphere(head.bm, HEAD_C, (0.13, 0.13, 0.13), 12, 8)
    kit.sphere(head.bm, HEAD_C + Vector((0, 0.02, 0.1)), (0.105, 0.11, 0.13), 10, 8)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.08, -0.04)), (0.1, 0.07, 0.1), 10, 6)
    # A shaggy fringe that falls over the brow, and a beard of fur under the jaw.
    locks(head, HEAD_C + Vector((0, 0.0, 0.06)), (0.13, 0.13, 0.17), 30, 0.09, 1, lambda d: d.y > -0.5 or d.z > 0.6)
    locks(head, HEAD_C + Vector((0, -0.04, -0.08)), (0.09, 0.07, 0.06), 10, 0.1, 4, lambda d: d.z < 0.0)
    parts.append(head)

    face = Part("face", SKIN, "head", shade=0.1)
    for sign in (1, -1):
        # A small deep-set eye under a heavy brow.
        rim = kit.sphere(face.bm, HEAD_C + Vector((0.095 * sign, -0.1, 0.02)), (0.022, 0.016, 0.018), 6, 4)
        face.paint(faces_of(rim), EYE_RIM)
        eye = kit.sphere(face.bm, HEAD_C + Vector((0.104 * sign, -0.108, 0.02)), (0.012, 0.01, 0.011), 6, 4)
        face.paint(faces_of(eye), EYE)
        brow = kit.sphere(face.bm, HEAD_C + Vector((0.09 * sign, -0.1, 0.045)), (0.035, 0.022, 0.014), 6, 4)
        face.paint(faces_of(brow), FUR_DARK)
        # The sockets of the tusks.
        kit.cone(face.bm, TUSKS[sign][0] + Vector((0, 0.05, 0.03)), TUSKS[sign][0], 0.035, 0.03, 8)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.06)
    for sign, points in TUSKS.items():
        verts = kit.tube(tusks.bm, points, [0.026, 0.026, 0.023, 0.019, 0.013, 0.003], 8)
        for face in faces_of(verts):
            if face.calc_center_median().z < 0.36:
                tusks.paint([face], TUSK_DARK)
    parts.append(tusks)

    # The fence that broke over its tusks: planks at angles, tied with rope,
    # hanging on the right tusk (the camera side).
    fence = Part("fence", WOOD, "head", smooth=False, shade=0.1)
    tusk = TUSKS[-1]
    for center, axis_x, axis_z, length in (
        (tusk[2] + Vector((-0.02, 0.0, 0.03)), Vector((0.3, 0.2, 1.0)), Vector((1, 0, -0.3)), 0.2),
        (tusk[3] + Vector((-0.03, 0.02, 0.0)), Vector((0.1, -0.1, 1.0)), Vector((1, 0.2, 0)), 0.17),
        (tusk[2].lerp(tusk[3], 0.5) + Vector((-0.04, 0.0, 0.0)), Vector((1.0, -0.15, -0.3)), Vector((0, 0, 1)), 0.2),
    ):
        axis_x, axis_z = axis_x.normalized(), axis_z.normalized()
        axis_y = axis_z.cross(axis_x).normalized()
        axis_z = axis_x.cross(axis_y).normalized()
        verts = kit.slab(fence.bm, center, axis_x * length * 0.65, axis_y * 0.012, axis_z * 0.03)
        fence.paint([f for f in faces_of(verts) if f.normal.dot(axis_x) > 0.9 or f.normal.dot(axis_x) < -0.9], WOOD_DARK)
        # A broken, pointed end.
        tip = center + axis_x * length * 0.65
        splinter = kit.cone(fence.bm, tip, tip + axis_x * 0.04, 0.016, 0.002, 4, squash=0.4)
        fence.paint(faces_of(splinter), WOOD)
    rope = kit.torus(fence.bm, tusk[2].lerp(tusk[3], 0.4), (tusk[3] - tusk[2]), 0.03, 0.006, 8, 3)
    fence.paint(faces_of(rope), ROPE)
    parts.append(fence)

    # The trunk, in rings, and its tip.
    trunk = Part("trunk", SKIN, chain_weights(TRUNK, ["trunk", "trunk.2", "trunk.3"]), shade=0.1)
    steps = 12
    path = []
    for step in range(steps + 1):
        s = step / steps * (len(TRUNK) - 1)
        index = min(int(s), len(TRUNK) - 2)
        path.append(TRUNK[index].lerp(TRUNK[index + 1], s - index))
    verts = kit.tube(trunk.bm, path, [lerp(0.055, 0.025, step / steps) for step in range(steps + 1)], 8)
    for face in faces_of(verts):
        if int(face.calc_center_median().z * 55) % 2:
            trunk.paint([face], SKIN_DARK)
    # Fur on the top of the trunk, near the face.
    locks(trunk, TRUNK[0].lerp(TRUNK[1], 0.4), (0.05, 0.05, 0.05), 8, 0.05, 2, lambda d: d.y > -0.3)
    parts.append(trunk)

    for side, sign in (("L", 1), ("R", -1)):
        ear = Part(f"ear.{side}", FUR_DARK, f"ear.{side}", shade=0.12)
        kit.sphere(ear.bm, (0.14 * sign, -0.28, 0.66), (0.025, 0.06, 0.07), 8, 6)
        locks(ear, (0.15 * sign, -0.28, 0.64), (0.025, 0.06, 0.07), 6, 0.05, 2)
        parts.append(ear)

    # The bird's nest in the fur on the top of the head, and the bird in it.
    nest = Part("nest", NEST, "head", smooth=False, shade=0.12)
    kit.torus(nest.bm, NEST_C, (0, 0, 1), 0.045, 0.018, 10, 4)
    kit.sphere(nest.bm, NEST_C + Vector((0, 0, -0.012)), (0.045, 0.045, 0.014), 8, 4)
    for index in range(6):
        angle = index * 1.1
        twig = kit.cone(nest.bm, NEST_C + Vector((0.05 * math.cos(angle), 0.05 * math.sin(angle), 0.01)), NEST_C + Vector((0.08 * math.cos(angle + 0.4), 0.08 * math.sin(angle + 0.4), 0.02)), 0.004, 0.001, 3)
        nest.paint(faces_of(twig), WOOD_DARK)
    parts.append(nest)

    bird = Part("bird", BIRD, "bird", shade=0.1)
    kit.sphere(bird.bm, BIRD_C, (0.024, 0.032, 0.024), 8, 6)
    kit.sphere(bird.bm, BIRD_C + Vector((0, -0.028, 0.022)), (0.017, 0.017, 0.017), 8, 6)
    beak = kit.cone(bird.bm, BIRD_C + Vector((0, -0.042, 0.022)), BIRD_C + Vector((0, -0.06, 0.018)), 0.006, 0.001, 4)
    bird.paint(faces_of(beak), BEAK)
    cap = kit.sphere(bird.bm, BIRD_C + Vector((0, -0.026, 0.034)), (0.014, 0.014, 0.008), 6, 4)
    bird.paint(faces_of(cap), BIRD_DARK)
    for sign in (1, -1):
        wing = kit.sphere(bird.bm, BIRD_C + Vector((0.02 * sign, 0.006, 0.004)), (0.008, 0.026, 0.014), 6, 4)
        bird.paint(faces_of(wing), BIRD_DARK)
        eye = kit.sphere(bird.bm, BIRD_C + Vector((0.012 * sign, -0.038, 0.027)), (0.003, 0.003, 0.003), 4, 3)
        bird.paint(faces_of(eye), BIRD_DARK)
    tail = kit.cone(bird.bm, BIRD_C + Vector((0, 0.025, 0.004)), BIRD_C + Vector((0, 0.06, 0.02)), 0.012, 0.004, 4, squash=0.3)
    bird.paint(faces_of(tail), BIRD_DARK)
    parts.append(bird)
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, _toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", FUR, leg_weights(leg), shade=0.15)
        kit.cone(upper.bm, top + Vector((0, 0, 0.05)), joint, 0.1, 0.085, 9)
        parts.append(upper)

        lower = Part(f"lower.{leg}", FUR_DARK, f"lower.{leg}", shade=0.15)
        kit.cone(lower.bm, joint, ankle, 0.085, 0.08, 9)
        # Shaggy fur round the shin, over the top of the foot.
        locks(lower, joint.lerp(ankle, 0.45), (0.085, 0.085, 0.07), 12, 0.07, 5, lambda d: d.z > -0.4)
        parts.append(lower)

        foot = Part(f"foot.{leg}", SKIN_DARK, f"foot.{leg}", shade=0.1)
        kit.cone(foot.bm, Vector((ankle.x, ankle.y, 0.08)), Vector((ankle.x, ankle.y, 0.0)), 0.08, 0.09, 10)
        # Three broad toenails at the front of the foot.
        for spread in (-1, 0, 1):
            angle = spread * 0.55
            nail = kit.sphere(foot.bm, Vector((ankle.x + 0.08 * math.sin(angle), ankle.y - 0.08 * math.cos(angle), 0.025)), (0.022, 0.014, 0.02), 6, 4)
            foot.paint(faces_of(nail), TOE)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig, _ = plan.build_rig("WoollyMammoth", TABLE, TRUNK_BONES, foot="foot")
    parts = body_parts() + head_parts() + leg_parts()
    plan.mirror_parts(parts)
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "WoollyMammothMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


PATCHES = (
    Patch("walk", "heavy-walk", beats=clips.quadruped.walk_beats(32), frames=32),
    Patch(
        "attack",
        "tusk-toss",
        beats=(
            Beat(0),
            Beat(5, "snort", (0.4,)),
            Beat(10, "charge"),
            Beat(15, "toss"),
            Beat(19, "toss", (1,)),
            Beat(26),
            Beat(30),
        ),
    ),
    Patch("death", "fall-left"),
)


class Poses(clips.quadruped.Poses):
    foot = "foot"
    fall = Fall(Y, 84, (-0.4, 0, 0.26))

    def trunk(self, curl=0.0, swing=0.0, lift=0.0):
        """
        The trunk: `curl` > 0 curls the tip forward and up, < 0 tucks it back
        under the chin; `swing` turns it to the side; `lift` raises the whole
        trunk forward and up from its base, as in a trumpet call.
        """
        return {
            "trunk": self.t("trunk", (X, -6 * curl - 80 * lift), (Z, swing * 6)),
            "trunk.2": self.t("trunk.2", (X, -16 * curl - 40 * lift), (Z, swing * 8)),
            "trunk.3": self.t("trunk.3", (X, -26 * curl - 20 * lift), (Z, swing * 10)),
        }

    def ears(self, flap=0.0):
        return {
            "ear.L": self.t("ear.L", (Z, 20 * flap)),
            "ear.R": self.t("ear.R", (Z, -20 * flap)),
        }

    def stance(self, breath=0.0, sway=0.0):
        """The idle stance: the head turned a little to the camera, the trunk swings and the ears flap."""
        return {
            **super().stance(breath, sway),
            "head": self.t(
                "head", (Z, -6 + sway * 4), (X, 2 - breath * 3), (Y, sway * 3)
            ),
            **self.trunk(0.4 + 0.3 * breath, sway),
            **self.ears(0.2 + 0.6 * max(0.0, sway)),
            "tail": self.t("tail", (Z, sway * 20), (X, -breath * 6)),
            "bird": self.t("bird", (Z, sway * 30)),
        }

    def gasp(self, base, breath=0.0):
        """Low HP: the legs give a little, the head hangs, the trunk on the ground."""
        return self.pose(
            super().gasp(base, breath),
            hips_at_loc=self.at("hips", (0, 0, -0.008 - breath * 0.004)),
            chest=self.t("chest", (X, 6 + breath * 2)),
            head=self.t("head", (X, 16 + breath * 3), (Y, -6)),
            **self.trunk(-0.4 + 0.2 * breath),
            **self.ears(-0.3),
            tail=self.t("tail", (X, 10)),
            bird=self.t("bird", (Z, 0)),
            **self.legs(
                FL=(-4, 14, -10), FR=(4, 10, -14), BL=(-6, 12, -6), BR=(-6, 12, -6)
            ),
        )

    def recoil(self, base, amount=1.0):
        """The hit pushes the head up and the body back, and the bird hops."""
        return self.pose(
            super().recoil(base, amount),
            hips_at_loc=self.at("hips", (0, 0.03 * amount, -0.01 * amount)),
            head=self.t("head", (X, -14 * amount), (Z, 8 * amount)),
            **self.trunk(1.2 * amount, -amount),
            **self.ears(amount),
            tail=self.t("tail", (X, -20 * amount)),
            bird_at_loc=self.at("bird", (0, 0, 0.06 * amount)),
        )

    def buckle(self, base):
        """The legs give way, and the bird flies up."""
        return self.pose(
            super().buckle(base),
            hips_at_loc=self.at("hips", (0, 0, -0.03)),
            chest=self.t("chest", (X, 12)),
            head=self.t("head", (X, 16)),
            **self.trunk(-0.5),
            **self.ears(0.5),
            bird_at_loc=self.at("bird", (0.0, 0.1, 0.22)),
            **self.legs(
                FL=(-20, 50, -30),
                FR=(-10, 40, -30),
                BL=(-30, 40, -10),
                BR=(-24, 40, -10),
            ),
        )

    def fallen(self, base, bounce=0.0):
        """
        On its left side, the legs stiff and out. The Battle camera sees the
        right side of a player Unit (-X), so it sees the legs and the belly.
        The bird is gone.
        """
        return self.pose(
            super().fallen(base, bounce),
            head=self.t("head", (X, 6), (Y, 10)),
            **self.trunk(-0.2, 1.5),
            **self.ears(-0.4),
            tail=self.t("tail", (X, -10)),
            bird_at_loc=self.at("bird", (0.0, 0.3, 0.6)),
            bird_at_scale=0.02,
            **self.legs(
                FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)
            ),
        )

    def low(self, base):
        """Down low with the legs folded, as a summon starts."""
        return self.pose(
            super().low(base),
            hips_at_loc=self.at("hips", (0, 0, -0.08)),
            head=self.t("head", (X, 18)),
            **self.trunk(-0.6),
            **self.ears(-0.4),
            **self.legs(
                FL=(-50, 100, -50),
                FR=(-50, 100, -50),
                BL=(-60, 90, -30),
                BR=(-60, 90, -30),
            ),
        )

    def snort(self, base, rear=1.0):
        """The head up and the trunk high: a call. The front lifts a little with `rear`."""
        return self.pose(
            super().snort(base, rear),
            head=self.t("head", (Z, -4), (X, -18)),
            **self.trunk(0, 0, 1.0),
            **self.ears(1.0),
            tail=self.t("tail", (X, -20)),
            bird_at_loc=self.at("bird", (0, 0, 0.05)),
            **self.legs(
                FL=(-18 * rear, 30 * rear, -12 * rear),
                FR=(-6 * rear, 20 * rear, -14 * rear),
                BL=(6 * rear, 0, 0),
                BR=(8 * rear, 0, 0),
            ),
        )

    def stride(self, base, phase):
        """
        The Heavy walk: one leg at a time, BL, FL, BR, FR. `phase` 0 to 1 is
        one cycle. The body rolls toward the leg that stands.
        """
        result = self.pose(
            base,
            hips_at_loc=self.at("hips", (0, 0, 0.006 * math.sin(phase * 4 * math.pi))),
            chest=self.t("chest", (Y, 3 * math.sin(phase * 2 * math.pi))),
            head=self.t("head", (Z, -6), (X, 2 + 3 * math.sin(phase * 4 * math.pi))),
            **self.trunk(0.3, math.sin(phase * 2 * math.pi)),
            tail=self.t("tail", (Z, 14 * math.sin(phase * 2 * math.pi))),
        )
        for leg, offset in (("BL", 0.0), ("FL", 0.25), ("BR", 0.5), ("FR", 0.75)):
            local = (phase - offset) % 1.0
            if local < 0.25:
                u = local / 0.25
                swing = lerp(18, -18, u)
                lift = math.sin(u * math.pi)
            else:
                u = (local - 0.25) / 0.75
                swing = lerp(-18, 18, u)
                lift = 0.0
            back = leg.startswith("B")
            bend = (34 if back else 44) * lift
            result.update(
                self.legs(**{leg: (swing - 10 * lift, bend, 10 * lift - swing - bend)})
            )
        return result

    def charge(self, base):
        return self.pose(
            self.unchanged(super().charge(base), base, "hips"),
            hips_at_loc=self.at("hips", (0, 0.05, -0.01)),
            chest=self.t("chest", (X, 6)),
            head=self.t("head", (Z, -4), (X, 24)),
            **self.trunk(1.2),
            **self.ears(1.0),
            tail=self.t("tail", (X, -20)),
            **self.legs(
                FL=(-10, 16, -6), FR=(6, 10, -16), BL=(-14, 20, -6), BR=(-10, 16, -6)
            ),
        )

    def toss(self, base, follow=0.0):
        return self.pose(
            super().toss(base, follow),
            hips_at_loc=self.at("hips", (0, -0.16 - 0.02 * follow, 0.02)),
            hips=self.t("hips", (Z, -8), (X, -4)),
            head=self.t("head", (Z, -4), (X, -22 - 4 * follow)),
            **self.trunk(0, 0, 0.6),
            **self.ears(1.0),
            tail=self.t("tail", (X, -30)),
            bird_at_loc=self.at("bird", (0, 0.02, 0.07)),
            **self.legs(
                FL=(-30, 30, 0), FR=(-16, 20, -4), BL=(24, 0, -24), BR=(30, -4, -26)
            ),
        )


def build_clips(rig):
    return clips.overrides.build(
        clips.quadruped.CLIPS,
        Poses(*kit.pose_tools(rig)),
        PATCHES,
        without=("cast", "rebirth"),
    )


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "woolly-mammoth.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
