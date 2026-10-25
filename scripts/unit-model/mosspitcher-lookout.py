"""
Mosspitcher Lookout (`elf.mosspitcherLookout`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a squat pitcher-plant spirit with
a tall, open cup, a tilted leaf-lid hat, a shaggy moss coat and broad root
toes. A small cluster of sticky moss balls sits in his roots, and a small
bird perches on the lid to give advice. He has no bow or other weapon, and no
ground or platform. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/mosspitcher-lookout.glb`; then
`bun unit-model:pack mosspitcher-lookout` packs it for the game.

His Long-range attack spits a moss ball from his forward-facing mouth. The
`mossball` bone scales up, and it hides at frame 6 of 30 (20%), when the
projectile leaves, while the cup and lid kick back and the bird flaps. His
cast is Regenerate: bright new moss and leaves grow from the scale-animated
`regrow` bone. Separate foot and toe bones let the roots grip in the walk. The
bird has head and wing bones for secondary motion.
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

PITCHER = hex_color("#86a83d")
PITCHER_LIGHT = hex_color("#b8ca5c")
LEAF = hex_color("#668f32")
LEAF_DARK = hex_color("#3e6428")
LEAF_LIGHT = hex_color("#a4c64e")
MOSS = hex_color("#587b2d")
MOSS_DARK = hex_color("#385324")
MOSS_LIGHT = hex_color("#8db63e")
FRESH = hex_color("#b9e75b")
FRESH_LIGHT = hex_color("#d2ef7a")
ROOT = hex_color("#795332")
ROOT_DARK = hex_color("#4b3422")
ROOT_LIGHT = hex_color("#a07845")
INNER = hex_color("#a95834")
INNER_DARK = hex_color("#583024")
RUST = hex_color("#833c28")
VEIN = hex_color("#c2b35c")
BIRD = hex_color("#817664")
BIRD_DARK = hex_color("#3f4140")
BIRD_BELLY = hex_color("#ddd3b6")
BIRD_CHEEK = hex_color("#eee5ce")
BEAK = hex_color("#d5a142")
EYE = hex_color("#171c18")
SHINE = hex_color("#f7f4dc")

# --- Proportions ---------------------------------------------------------------

BODY_BASE = Vector((0, 0.025, 0.13))
MOUTH_AT = Vector((0, -0.065, 0.68))
BALL_AT = MOUTH_AT + Vector((0, -0.035, 0.018))
REGROW_AT = Vector((0, 0, 0.3))

# The mouth faces forward, toward the target, and the lid is hinged on the
# raised back rim, so that it hoods the mouth as in the painting.
MOUTH_TILT = math.radians(34)
LID_HINGE = Vector((0.025, 0.06, 0.75))
LID_TIP = Vector((-0.08, -0.21, 0.8))


def lid_frame():
    axis = (LID_TIP - LID_HINGE).normalized()
    side = axis.cross(Z).normalized()
    normal = side.cross(axis).normalized()
    return side, normal


def lid_point(s, lateral=0.0, offset=0.0):
    """A point on the cup's curved leaf lid; `lateral` is -1 to 1."""
    side, normal = lid_frame()
    width = 0.004 + 0.125 * max(0.0, math.sin(math.pi * s)) ** 0.7
    center = LID_HINGE.lerp(LID_TIP, s) + normal * (0.025 * math.sin(math.pi * s))
    # The front of the leaf curls down over the mouth in a hook.
    center -= Z * (0.08 * clamp01((s - 0.6) / 0.4) ** 2)
    ridge = 0.012 * (1 - abs(lateral)) * math.sin(math.pi * s)
    return center + side * (width * lateral) + normal * (ridge + offset)


BIRD_AT = lid_point(0.48) + Z * 0.047
BIRD_HEAD = BIRD_AT + Vector((0, -0.037, 0.032))


def foot_points(side):
    sign = 1 if side == "L" else -1
    hip = Vector((0.075 * sign, 0.02, 0.17))
    ankle = Vector((0.105 * sign, -0.005, 0.055))
    ball = Vector((0.11 * sign, -0.035, 0.028))
    return hip, ankle, ball


BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("body", tuple(BODY_BASE), (0, 0, 0.37), "root"),
    ("coat", (0, 0.02, 0.47), (0, 0.03, 0.28), "body"),
    ("lid", tuple(LID_HINGE), tuple(LID_TIP), "body"),
    ("bird", tuple(BIRD_AT), tuple(BIRD_AT + Z * 0.06), "lid"),
    ("bird.head", tuple(BIRD_HEAD), tuple(BIRD_HEAD + Vector((0, -0.035, 0.01))), "bird"),
]
for side, sign in (("L", 1), ("R", -1)):
    BONES.append(
        (
            f"bird.wing.{side}",
            tuple(BIRD_AT + Vector((0.026 * sign, 0, 0.005))),
            tuple(BIRD_AT + Vector((0.055 * sign, 0.015, -0.005))),
            "bird",
        )
    )
for side in ("L", "R"):
    hip, ankle, ball = foot_points(side)
    BONES += [
        (f"foot.{side}", tuple(hip), tuple(ankle), "root"),
        (f"toes.{side}", tuple(ball), tuple(ball + Vector((0, -0.09, -0.008))), f"foot.{side}"),
    ]
BONES += [
    # The projectile is independent of the recoiling cup after release.
    ("mossball", tuple(BALL_AT), tuple(BALL_AT + Vector((0, -0.06, 0.02))), "root"),
    ("regrow", tuple(REGROW_AT), tuple(REGROW_AT + Z * 0.1), "body"),
]

# --- Weights -------------------------------------------------------------------


def root_leg_weights(side):
    def weights(co):
        return blend(f"foot.{side}", "body", co.z, 0.1, 0.17)

    return weights


def grip_weights(co):
    """The twig arm stays on the cup, but its fingers follow the lid."""
    return blend("body", "lid", co.z, 0.58, 0.74)


# --- Parts ---------------------------------------------------------------------


def leaf(part, base, direction, length, width, color):
    """A flat, pointed leaf with a thick tabletop-miniature silhouette."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.001, 4, squash=0.28)
    part.paint(faces_of(verts), color)
    return verts


def pitcher_point(row, column, inset=0.0):
    profiles = [
        (BODY_BASE, 0.072, 0.058),
        (Vector((0, 0.02, 0.19)), 0.125, 0.1),
        (Vector((0, 0.005, 0.32)), 0.165, 0.133),
        (Vector((0, -0.01, 0.47)), 0.155, 0.125),
        (Vector((0, -0.035, 0.58)), 0.125, 0.105),
        (MOUTH_AT, 0.168, 0.137),
    ]
    center, radius_x, radius_y = profiles[row]
    theta = 2 * math.pi * column / 20
    tilt = MOUTH_TILT * row / (len(profiles) - 1)
    return center + Vector(
        (
            (radius_x - inset) * math.cos(theta),
            (radius_y - inset) * math.sin(theta) * math.cos(tilt),
            (radius_y - inset) * math.sin(theta) * math.sin(tilt),
        )
    )


def pitcher_parts():
    """A thick-walled, open pitcher with a visible warm interior."""
    body = Part("pitcher", PITCHER, "body", shade=0.14)
    segments = 20
    _, outer = kit.sheet(
        body.bm,
        [[pitcher_point(row, column) for column in range(segments + 1)] for row in range(6)],
    )
    for face, row, column in outer:
        if row >= 4:
            color = PITCHER_LIGHT if column % 4 else LEAF
        elif (column + row * 2) % 5 == 0:
            color = LEAF_DARK
        elif (column + row) % 4 == 0:
            color = LEAF
        else:
            color = PITCHER
        body.paint([face], color)

    inner_rows = [5, 4, 3, 2, 1]
    inner_verts, inner = kit.sheet(
        body.bm,
        [[pitcher_point(row, column, 0.018) for column in range(segments + 1)] for row in inner_rows],
    )
    for face, row, column in inner:
        color = INNER_DARK if row > 1 else INNER
        if (column * 3 + row * 5) % 13 == 0:
            color = RUST
        body.paint([face], color)

    # The first 6 * 21 vertices are the outside grid.
    all_verts = list(body.bm.verts)
    outer_verts = all_verts[: 6 * (segments + 1)]
    for column in range(segments):
        following = column + 1
        outer_top = 5 * (segments + 1)
        rim = body.bm.faces.new(
            (
                outer_verts[outer_top + column],
                outer_verts[outer_top + following],
                inner_verts[column + 1],
                inner_verts[column],
            )
        )
        body.paint([rim], PITCHER_LIGHT if column % 3 else RUST)
    bottom = body.bm.faces.new([outer_verts[column] for column in reversed(range(segments))])
    body.paint([bottom], ROOT_DARK)
    inside_bottom = body.bm.faces.new(
        [inner_verts[4 * (segments + 1) + column] for column in range(segments)]
    )
    body.paint([inside_bottom], INNER_DARK)

    lip_verts = kit.tube(
        body.bm,
        [pitcher_point(5, column, -0.002) for column in range(segments + 1)],
        [0.009] * (segments + 1),
        5,
        caps=False,
    )
    body.paint(faces_of(lip_verts), PITCHER_LIGHT)
    leaf(body, pitcher_point(5, 15), (0, -1, 0.12), 0.065, 0.042, PITCHER_LIGHT)
    kit.bmesh.ops.recalc_face_normals(body.bm, faces=list(body.bm.faces))
    return [body]


def moss_parts():
    coat = Part("moss.coat", MOSS, "coat", smooth=False, shade=0.2)
    rows = [
        (0.49, 0.153, 0.123, 0.115, 12),
        (0.385, 0.17, 0.14, 0.135, 14),
        (0.275, 0.15, 0.12, 0.115, 12),
    ]
    colors = (MOSS, MOSS_DARK, LEAF, MOSS_LIGHT, LEAF_DARK)
    for row, (z, radius_x, radius_y, length, count) in enumerate(rows):
        for index in range(count):
            theta = 2 * math.pi * (index + 0.5 * (row % 2)) / count
            out = Vector((math.cos(theta), math.sin(theta), 0))
            base = Vector((radius_x * out.x, radius_y * out.y - 0.002, z))
            direction = out * 0.42 + Vector((0.08 * math.sin(index * 2.1), 0, -1))
            reach = length * (0.85 + 0.25 * ((index * 3 + row) % 4) / 3)
            verts = kit.cone(
                coat.bm,
                base,
                base + direction.normalized() * reach,
                0.027 + 0.006 * (index % 2),
                0.001,
                4,
                squash=0.3,
            )
            coat.paint(faces_of(verts), colors[(index + row * 2) % len(colors)])
            if index % 2 == 0:
                knot = kit.sphere(coat.bm, base, (0.025, 0.023, 0.022), 6, 4)
                coat.paint(faces_of(knot), colors[(index + row + 2) % len(colors)])

    # A few long, ragged strands break up the hem of the shaggy coat.
    for index in range(10):
        theta = 2 * math.pi * (index + 0.25) / 10
        out = Vector((math.cos(theta), math.sin(theta), 0))
        base = Vector((0.15 * out.x, 0.12 * out.y, 0.32))
        points = [base, base + out * 0.025 - Z * 0.055, base + out * 0.04 - Z * 0.13]
        strand = kit.tube(coat.bm, points, [0.013, 0.009, 0.0015], 4)
        coat.paint(faces_of(strand), MOSS_DARK if index % 2 else MOSS)
    return [coat]


def lid_parts():
    lid = Part("leaf.lid", LEAF, "lid", shade=0.1)
    rows = [0.0, 0.15, 0.35, 0.55, 0.75, 0.92, 1.0]
    front, back = [], []
    for s in rows:
        front.append([lid_point(s, lateral, 0.0025) for lateral in (-1, 0, 1)])
        back.append([lid_point(s, lateral, -0.0025) for lateral in (-1, 0, 1)])

    def color_of(side, row, column):
        if side == "back":
            return LEAF_DARK
        if column == 1:
            return LEAF_LIGHT
        return (LEAF, PITCHER, LEAF_DARK)[(row + column) % 3]

    kit.panel(lid, front, back, color_of)
    midrib = kit.tube(
        lid.bm,
        [lid_point(index / 8, 0, 0.007) for index in range(9)],
        [lerp(0.005, 0.0012, index / 8) for index in range(9)],
        5,
    )
    lid.paint(faces_of(midrib), VEIN)
    for s in (0.28, 0.47, 0.66):
        for lateral in (-0.86, 0.86):
            vein = kit.tube(
                lid.bm,
                [lid_point(s, 0, 0.007), lid_point(min(0.94, s + 0.13), lateral, 0.005)],
                [0.0028, 0.001],
                4,
            )
            lid.paint(faces_of(vein), VEIN)
    return [lid]


def grip_parts():
    """A small twig arm holds the lid near the advising bird."""
    arm = Part("lid.grip", ROOT, grip_weights, shade=0.12)
    shoulder = Vector((-0.13, 0.02, 0.46))
    elbow = Vector((-0.2, 0.005, 0.59))
    wrist = lid_point(0.6, 0.75) - Z * 0.008
    kit.tube(arm.bm, [shoulder, elbow, wrist], [0.015, 0.012, 0.008], 6)
    for index in range(3):
        start = wrist + Vector((0, (index - 1) * 0.009, 0))
        middle = lid_point(0.64, 0.63 + index * 0.05) + Z * 0.006
        end = lid_point(0.67, 0.55 + index * 0.05) - Z * 0.003
        finger = kit.tube(arm.bm, [start, middle, end], [0.005, 0.004, 0.0015], 4)
        arm.paint(faces_of(finger), ROOT_LIGHT)
    return [arm]


def root_parts():
    parts = []
    for side, sign in (("L", 1), ("R", -1)):
        hip, ankle, ball = foot_points(side)
        leg = Part(f"root.leg.{side}", ROOT, root_leg_weights(side), shade=0.16)
        middle = hip.lerp(ankle, 0.5) + Vector((0.018 * sign, 0.008, 0))
        verts = kit.tube(leg.bm, [hip, middle, ankle], [0.034, 0.026, 0.022], 7)
        leg.paint({f for f in faces_of(verts) if f.calc_center_median().y > 0.01}, ROOT_DARK)
        foot = kit.sphere(leg.bm, ball + Vector((0, 0.005, 0.002)), (0.044, 0.05, 0.025), 8, 5)
        leg.paint(faces_of(foot), ROOT)
        parts.append(leg)

        toes = Part(f"root.toes.{side}", ROOT_DARK, f"toes.{side}", shade=0.12)
        for index, degrees in enumerate((-62, -24, 18, 55)):
            theta = math.radians(degrees + sign * 8)
            direction = Vector((math.sin(theta) + 0.15 * sign, -math.cos(theta), 0)).normalized()
            start = ball + Vector(((index - 1.5) * 0.014, -0.018, 0.004))
            length = (0.115, 0.15, 0.14, 0.105)[index]
            middle = start + direction * length * 0.55 - Z * 0.008
            end = start + direction * length - Z * 0.021
            root = kit.tube(toes.bm, [start, middle, end], [0.014, 0.009, 0.0015], 5)
            toes.paint(faces_of(root), ROOT if index % 2 else ROOT_DARK)
            if index in (1, 2):
                branch_dir = Vector((direction.y * sign, -direction.x * sign, 0))
                branch = kit.tube(
                    toes.bm,
                    [middle, middle + branch_dir * 0.025 * sign, middle + branch_dir * 0.05 * sign - Z * 0.005],
                    [0.006, 0.0035, 0.0008],
                    4,
                )
                toes.paint(faces_of(branch), ROOT_LIGHT)
        back = Vector((0.75 * sign, 0.65, 0)).normalized()
        kit.tube(
            toes.bm,
            [ball, ball + back * 0.05 - Z * 0.006, ball + back * 0.1 - Z * 0.017],
            [0.012, 0.007, 0.001],
            5,
        )
        parts.append(toes)
    return parts


def moss_ball(part, center, radius, seed=0):
    ball = kit.sphere(part.bm, center, (radius, radius * 0.94, radius * 0.9), 8, 5)
    for face in faces_of(ball):
        center_face = face.calc_center_median()
        tone = (int(center_face.x * 300) + int(center_face.z * 240) + seed) % 4
        part.paint([face], (MOSS, MOSS_LIGHT, LEAF, MOSS_DARK)[tone])
    return ball


def cluster_parts():
    """Three spare sticky moss balls nestled in the roots, not a ground prop."""
    cluster = Part("moss.cluster", MOSS, "root", shade=0.12)
    for index, (center, radius) in enumerate(
        (
            (Vector((-0.2, -0.1, 0.038)), 0.034),
            (Vector((-0.158, -0.125, 0.033)), 0.029),
            (Vector((-0.18, -0.07, 0.074)), 0.03),
        )
    ):
        moss_ball(cluster, center, radius, index)
        leaf(cluster, center + Z * radius * 0.7, (0.3, 0.2, 1), 0.026, 0.009, LEAF_LIGHT)
    return [cluster]


def bird_parts():
    parts = []
    body = Part("bird", BIRD, "bird", shade=0.08)
    kit.sphere(body.bm, BIRD_AT, (0.032, 0.047, 0.035), 10, 7)
    belly = kit.sphere(body.bm, BIRD_AT + Vector((0, -0.025, -0.008)), (0.026, 0.027, 0.028), 8, 5)
    body.paint(faces_of(belly), BIRD_BELLY)
    for index in (-1, 0, 1):
        tail = kit.cone(
            body.bm,
            BIRD_AT + Vector((index * 0.009, 0.034, 0.005)),
            BIRD_AT + Vector((index * 0.016, 0.09, 0.035)),
            0.011,
            0.001,
            4,
            squash=0.25,
        )
        body.paint(faces_of(tail), BIRD_DARK)
    for sign in (1, -1):
        top = BIRD_AT + Vector((0.013 * sign, -0.003, -0.025))
        foot = BIRD_AT + Vector((0.013 * sign, -0.006, -0.046))
        kit.cone(body.bm, top, foot, 0.003, 0.0025, 4)
        kit.tube(body.bm, [foot + Y * 0.008, foot, foot - Y * 0.012], [0.002, 0.0025, 0.001], 4)
    parts.append(body)

    head = Part("bird.head", BIRD_DARK, "bird.head", shade=0.05)
    kit.sphere(head.bm, BIRD_HEAD, (0.025, 0.026, 0.026), 10, 7)
    cheek = kit.sphere(head.bm, BIRD_HEAD + Vector((-0.018, -0.011, -0.005)), (0.009, 0.014, 0.012), 6, 4)
    head.paint(faces_of(cheek), BIRD_CHEEK)
    beak = kit.cone(
        head.bm,
        BIRD_HEAD + Vector((0, -0.022, -0.002)),
        BIRD_HEAD + Vector((0, -0.044, -0.005)),
        0.008,
        0.001,
        5,
    )
    head.paint(faces_of(beak), BEAK)
    for sign in (1, -1):
        eye = BIRD_HEAD + Vector((0.02 * sign, -0.014, 0.007))
        kit.sphere(head.bm, eye, (0.0045, 0.004, 0.0045), 5, 4)
        if sign == -1:
            shine = kit.sphere(head.bm, eye + Vector((-0.002, -0.003, 0.002)), (0.0015, 0.001, 0.0015), 4, 3)
            head.paint(faces_of(shine), SHINE)
    parts.append(head)

    for side, sign in (("L", 1), ("R", -1)):
        wing = Part(f"bird.wing.{side}", BIRD_DARK, f"bird.wing.{side}", shade=0.1)
        center = BIRD_AT + Vector((0.029 * sign, 0.005, 0.002))
        kit.sphere(wing.bm, center, (0.012, 0.036, 0.025), 8, 5)
        leaf(wing, center + Vector((0, 0.015, -0.006)), (0.15 * sign, 0.7, -0.4), 0.045, 0.012, BIRD)
        parts.append(wing)
    return parts


def regrow_parts():
    """Bright new growth, hidden at scale 0 outside Regenerate."""
    growth = Part("regrow", FRESH, "regrow", smooth=False, shade=0.04)
    for index in range(12):
        theta = 2 * math.pi * index / 12
        out = Vector((math.cos(theta), math.sin(theta), 0))
        z = 0.25 + 0.055 * (index % 4)
        base = Vector((0.165 * out.x, 0.135 * out.y, z))
        direction = out * 0.65 + Z * (0.8 + 0.2 * (index % 2))
        leaf(growth, base, direction, 0.07 + 0.015 * (index % 3), 0.021, FRESH if index % 2 else FRESH_LIGHT)
        if index % 3 == 0:
            bud = kit.sphere(growth.bm, base + out * 0.012, (0.019, 0.018, 0.018), 6, 4)
            growth.paint(faces_of(bud), FRESH)
    return [growth]


def projectile_parts():
    ball = Part("mossball", MOSS, "mossball", shade=0.06)
    moss_ball(ball, BALL_AT, 0.035, 2)
    for index in range(8):
        theta = 2 * math.pi * index / 8
        out = Vector((math.cos(theta), math.sin(theta), 0.35 * (-1 if index % 2 else 1))).normalized()
        tuft = kit.cone(ball.bm, BALL_AT + out * 0.029, BALL_AT + out * 0.047, 0.008, 0.001, 4)
        ball.paint(faces_of(tuft), LEAF_LIGHT if index % 2 else MOSS_DARK)
    for index in (-1, 1):
        strand = kit.tube(
            ball.bm,
            [
                BALL_AT + Vector((0.009 * index, 0.02, 0)),
                BALL_AT + Vector((0.006 * index, 0.07, 0.006)),
                BALL_AT + Vector((0, 0.12, 0.012)),
            ],
            [0.005, 0.003, 0.0008],
            4,
        )
        ball.paint(faces_of(strand), MOSS_LIGHT)
    return [ball]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("MosspitcherLookout", BONES)
    parts = (
        pitcher_parts()
        + moss_parts()
        + lid_parts()
        + grip_parts()
        + root_parts()
        + cluster_parts()
        + bird_parts()
        + regrow_parts()
        + projectile_parts()
    )
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "MosspitcherLookoutMesh")
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

    def stand(breath=0.0, sway=0.0, chirp=0.0):
        """The open pitcher breathes, and the bird quietly gives advice."""
        return {
            "root": t("root", (Z, -12)),
            "body@loc": at("body", (0, 0, 0.005 * breath)),
            "body": t("body", (X, 4 + breath * 1.5), (Y, sway * 2)),
            "body@scale": 1.0,
            "coat": t("coat", (X, -2 - breath * 2), (Y, -sway * 3)),
            "coat@scale": 1.0,
            "lid": t("lid", (X, -4 + breath * 2), (Y, -8 + sway * 2)),
            "lid@scale": 1.0,
            "bird": t("bird", (X, -breath * 2), (Y, sway * 4), (Z, chirp * 4)),
            "bird@scale": 1.0,
            "bird.head": t("bird.head", (X, chirp * 8), (Z, 12 + chirp * 18)),
            "bird.wing.L": t("bird.wing.L", (Y, 4)),
            "bird.wing.R": t("bird.wing.R", (Y, -4)),
            "toes.L": t("toes.L", (X, 4)),
            "toes.R": t("toes.R", (X, 4)),
            "foot.L@scale": 1.0,
            "foot.R@scale": 1.0,
            "regrow@scale": 0.0,
            "mossball@scale": 0.0,
        }

    def tired(breath=0.0):
        """Low HP: the cup sags, the coat thins and the lid droops."""
        return pose(
            stand(),
            body_at_loc=at("body", (0, 0.015, -0.025 - breath * 0.004)),
            body=t("body", (X, 18 + breath * 3), (Y, -8)),
            coat=t("coat", (X, 8), (Y, 5)),
            coat_at_scale=0.88 + breath * 0.02,
            lid=t("lid", (X, 20 + breath * 3), (Y, -14)),
            bird=t("bird", (X, -8), (Z, -8)),
            bird__head=t("bird.head", (X, 12 + breath * 4), (Z, -20)),
            toes__L=t("toes.L", (X, 14)),
            toes__R=t("toes.R", (X, 14)),
        )

    def flinch(base, amount=1.0):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.025 * amount, -0.012 * amount)),
            body=t("body", (X, -14 * amount), (Y, -6 * amount)),
            coat=t("coat", (X, 16 * amount), (Y, 8 * amount)),
            lid=t("lid", (X, -22 * amount), (Y, 12 * amount)),
            bird=t("bird", (X, 18 * amount), (Y, -10 * amount)),
            bird__head=t("bird.head", (X, -20 * amount), (Z, -8 * amount)),
            bird__wing__L=t("bird.wing.L", (Y, 38 * amount)),
            bird__wing__R=t("bird.wing.R", (Y, -38 * amount)),
            toes__L=t("toes.L", (X, 18 * amount)),
            toes__R=t("toes.R", (X, 18 * amount)),
        )

    def stagger(base):
        return pose(
            flinch(base, 0.5),
            body_at_loc=at("body", (0, 0.015, -0.03)),
            body=t("body", (X, 28), (Y, 10)),
            coat=t("coat", (X, -8), (Y, -12)),
            lid=t("lid", (X, 24), (Y, -20)),
            bird=t("bird", (X, -16), (Y, 12)),
            bird__wing__L=t("bird.wing.L", (Y, 65)),
            bird__wing__R=t("bird.wing.R", (Y, -65)),
        )

    def fallen(base, bounce=0.0):
        """The empty pitcher wilts forward; the bird has flown clear."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0.015, -0.045)),
            body=t("body", (X, 78 - bounce), (Y, -14)),
            body_at_scale=0.92,
            coat=t("coat", (X, -20), (Y, 12)),
            coat_at_scale=0.72,
            lid=t("lid", (X, -38), (Y, 20)),
            bird_at_loc=at("bird", (0, 0.03, 0.16)),
            # Not 0: the bird bone has child bones, and its matrix must invert.
            bird_at_scale=0.001,
            regrow_at_scale=0.0,
            toes__L=t("toes.L", (X, -8)),
            toes__R=t("toes.R", (X, -8)),
        )

    def rise(base, amount, grow=0.0):
        """The cup rises from its roots during Rebirth."""
        bird = max(0.001, clamp01((amount - 0.6) / 0.4))
        return pose(
            base,
            body_at_loc=at("body", (0, 0.015 * (1 - amount), lerp(-0.045, 0, amount))),
            body=t("body", (X, lerp(78, 0, amount)), (Y, lerp(-14, 0, amount))),
            body_at_scale=lerp(0.82, 1.0, amount),
            coat=t("coat", (X, lerp(-20, 0, amount))),
            coat_at_scale=lerp(0.65, 1.0, amount),
            lid=t("lid", (X, lerp(-38, -4, amount)), (Y, lerp(20, -8, amount))),
            bird_at_scale=bird,
            regrow_at_scale=grow,
            toes__L=t("toes.L", (X, lerp(-8, 4, amount))),
            toes__R=t("toes.R", (X, lerp(-8, 4, amount))),
        )

    def sprout(base, amount):
        """Summon: a small cup grows out of the root toes."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0, -0.02 * (1 - amount))),
            body=t("body", (X, lerp(30, 0, amount))),
            body_at_scale=max(0.05, amount),
            coat_at_scale=lerp(0.2, 1.0, amount),
            bird_at_scale=max(0.001, clamp01((amount - 0.65) / 0.35)),
            regrow_at_scale=0.7 * amount,
            foot__L_at_scale=lerp(0.65, 1.0, amount),
            foot__R_at_scale=lerp(0.65, 1.0, amount),
        )

    def proud(base, grow=0.8):
        return pose(
            base,
            body_at_loc=at("body", (0, 0, 0.015)),
            body=t("body", (X, -10)),
            body_at_scale=1.03,
            coat=t("coat", (X, -8)),
            coat_at_scale=1.08,
            lid=t("lid", (X, -18), (Y, -12)),
            bird=t("bird", (X, 8)),
            bird__head=t("bird.head", (X, -10), (Z, 15)),
            bird__wing__L=t("bird.wing.L", (Y, 25)),
            bird__wing__R=t("bird.wing.R", (Y, -25)),
            regrow_at_scale=grow,
            toes__L=t("toes.L", (X, 16)),
            toes__R=t("toes.R", (X, 16)),
        )

    def step(front, lift=0.0):
        """A root-legged waddle; planted toes curl down and grip."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(sway=0.5 * front),
            body_at_loc=at("body", (0, 0, -0.008 + lift * 0.012)),
            body=t("body", (X, 8), (Y, -4 * front)),
            coat=t("coat", (X, -8), (Y, 6 * front)),
            lid=t("lid", (X, -6), (Y, -8 + 3 * front)),
            bird=t("bird", (X, 8 * lift), (Y, 4 * front)),
            bird__head=t("bird.head", (Z, -12 * front)),
            bird__wing__L=t("bird.wing.L", (Y, 4 + 14 * lift)),
            bird__wing__R=t("bird.wing.R", (Y, -4 - 14 * lift)),
            **{
                f"foot__{lead}": t(f"foot.{lead}", (X, -20 - 8 * lift), (Z, 4 * front)),
                f"foot__{lead}_at_loc": at(f"foot.{lead}", (0, -0.02, 0.025 * lift)),
                f"toes__{lead}": t(f"toes.{lead}", (X, lerp(16, -12, lift))),
                f"foot__{back}": t(f"foot.{back}", (X, 14), (Z, -4 * front)),
                f"toes__{back}": t(f"toes.{back}", (X, 22)),
            },
        )

    # The sticky moss ball grows from scale 0 and leaves at exactly frame 6
    # of 30 (20%, `FLIGHT_START` in fx.ts). It then follows a high forward arc.
    def draw(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.025, 0.015)),
            body=t("body", (X, -14), (Y, -5)),
            coat=t("coat", (X, 12)),
            lid=t("lid", (X, -22), (Y, -14)),
            bird=t("bird", (X, 14)),
            bird__head=t("bird.head", (X, -12)),
            bird__wing__L=t("bird.wing.L", (Y, 18)),
            bird__wing__R=t("bird.wing.R", (Y, -18)),
            toes__L=t("toes.L", (X, 20)),
            toes__R=t("toes.R", (X, 20)),
            mossball_at_scale=0.0,
        )

    def spit(base, follow=0.0, ball=1.0, flight=(0, 0, 0), spin=0.0):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.035 - 0.02 * follow, -0.005)),
            body=t("body", (X, -18 + 8 * follow), (Y, -5)),
            coat=t("coat", (X, 20 - 8 * follow)),
            coat_at_scale=0.94,
            lid=t("lid", (X, -30 + 12 * follow), (Y, 10)),
            bird=t("bird", (X, 24 - 8 * follow), (Y, -10)),
            bird__head=t("bird.head", (X, -18), (Z, -15)),
            bird__wing__L=t("bird.wing.L", (Y, 52 - 20 * follow)),
            bird__wing__R=t("bird.wing.R", (Y, -52 + 20 * follow)),
            toes__L=t("toes.L", (X, 25)),
            toes__R=t("toes.R", (X, 25)),
            mossball_at_loc=at("mossball", flight),
            mossball_at_scale=ball,
            mossball=t("mossball", (X, spin), (Z, spin * 0.3)),
        )

    def regenerate(base, grow=1.0, sway=0.0):
        """Regenerate: fresh, bright moss and leaves grow over the old coat."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0, 0.01 * grow)),
            body=t("body", (X, -6 * grow), (Y, 3 * sway)),
            body_at_scale=1.0 + 0.04 * grow,
            coat=t("coat", (X, -8 * grow), (Y, 6 * sway)),
            coat_at_scale=1.0 + 0.08 * grow,
            lid=t("lid", (X, -12 * grow), (Y, -8 + 4 * sway)),
            bird=t("bird", (X, 6 * grow), (Y, 5 * sway)),
            bird__head=t("bird.head", (X, -8 * grow), (Z, 12 + 10 * sway)),
            bird__wing__L=t("bird.wing.L", (Y, 4 + 14 * grow)),
            bird__wing__R=t("bird.wing.R", (Y, -4 - 14 * grow)),
            regrow=t("regrow", (Z, 8 * sway)),
            regrow_at_scale=grow,
            toes__L=t("toes.L", (X, 12 * grow)),
            toes__R=t("toes.R", (X, 12 * grow)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, chirp in (
        (0, 0, 0, 0),
        (8, 0.3, 0.6, 0.4),
        (16, 0.6, 1, 1),
        (24, 1, 0, 0.2),
        (32, 0.6, -1, -0.8),
        (40, 0.3, -0.6, 0.3),
        (48, 0, 0, 0),
    ):
        idle.key(frame, stand(breath, sway, chirp))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 0.5), (24, 1), (36, 0.5), (48, 0)):
        low.key(frame, tired(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, step(1, 1)).key(12, step(-1)).key(18, step(-1, 1)).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, draw(stand())).key(5, draw(stand()))
    # The game's projectile takes over at the release, so the ball hides then.
    attack.key(6, spit(stand(), 0, 1.0, (0, -0.015, 0.025), 30))
    attack.key(7, spit(stand(), 0.3, 0.0, (0, -0.05, 0.06), 70))
    attack.key(9, spit(stand(), 0.8, 0.0))
    attack.key(13, spit(stand(), 1.0, 0.0))
    attack.key(17, spit(stand(), 0.7, 0.0))
    attack.key(20, spit(stand(), 0.3, 0.0))
    attack.key(25, stand(0.4)).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 30)
    cast.key(0, stand()).key(5, regenerate(stand(), 0.2)).key(11, regenerate(stand(), 0.8, 0.5))
    cast.key(15, regenerate(stand(), 1.2, 1)).key(20, regenerate(stand(), 1.0, 0.4))
    cast.key(26, regenerate(stand(), 0.35)).key(30, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, flinch(stand())).key(8, flinch(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, flinch(stand())).key(12, stagger(stand()))
    death.key(17, pose(stagger(stand()), bird_at_loc=at("bird", (0, 0.02, 0.12)), bird_at_scale=1.0))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then grows up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, flinch(stand())).key(12, stagger(stand())).key(20, fallen(stand()))
    rebirth.key(22, fallen(stand(), 3)).key(30, rise(stand(), 0.3, 0.25))
    rebirth.key(38, rise(stand(), 0.8, 0.8)).key(43, proud(stand(), 1.0)).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, sprout(stand(), 0.05)).key(7, sprout(stand(), 0.35)).key(14, sprout(stand(), 0.9))
    summon.key(18, proud(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "mosspitcher-lookout.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
