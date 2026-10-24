"""
Rimebreath Drake (`feral.rimebreathDrake`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a slim young ice drake with silver-
white scales, a cream belly, rows of blue ice spikes down the neck and the
back, swept-back ice horns, a long neck and tail, and wide wings with pale
blue membranes and icicles on the trailing edge. Its own breath froze an
icicle onto its nose. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/rimebreath-drake.glb`; then
`bun unit-model:pack rimebreath-drake` packs it for the game.

It is Flying. A twisted column of frozen mist rises from a mound of snow to
its belly, as the flight stand of a miniature: the game puts the rest pose on
the ground, so the column keeps the body in the air. The wings beat in each
clip. Its attack (melee, Frost) is a lunge with a blast of frost breath: the
breath is small inside the mouth at rest, and its bone scales up. In the
death clip the column breaks (its bone scales down), the wings fold and it
falls on its left side (`(Y, +84)` on the root), so the legs turn to the
camera side (-X). It has no Keyword that it uses by its own action, so it has
no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SCALE = hex_color("#e6eaee")
SCALE_SHADE = hex_color("#b3bfcb")
SCALE_DARK = hex_color("#8794a3")
BELLY = hex_color("#f3eedf")
BELLY_BAND = hex_color("#d9d1bc")
ICE = hex_color("#c4e9ff")
ICE_DEEP = hex_color("#6fb3e6")
MEMBRANE = hex_color("#cfe7f6")
MEMBRANE_DEEP = hex_color("#9cc9e8")
EYE = hex_color("#8ff0ff")
MOUTH = hex_color("#b45a6c")
FANG = hex_color("#f6f2e6")
CLAW = hex_color("#4a4f5a")
FROST = hex_color("#f4fbff")
SNOW = hex_color("#eef2f5")
SNOW_SHADE = hex_color("#c3ccd6")

# --- Proportions ---------------------------------------------------------------

# The body hovers at this height, and faces -Y.
BODY = Vector((0, 0.02, 0.55))
CHEST = Vector((0, -0.1, 0.57))
# The head is made at HEAD, then lifted by HEAD_LIFT on the long neck.
HEAD = Vector((0, -0.3, 0.8))
SNOUT = Vector((0, -0.47, 0.775))
MOUTH_AT = Vector((0, -0.45, 0.765))
HEAD_LIFT = Vector((0, -0.03, 0.1))
NECK = [Vector((0, -0.15, 0.6)), Vector((0, -0.23, 0.72)), Vector((0, -0.3, 0.86))]


def lifted(point):
    return Vector(point) + HEAD_LIFT


TAIL = [Vector((0, 0.14, 0.54)), Vector((0, 0.3, 0.5)), Vector((0, 0.46, 0.47)), Vector((0, 0.62, 0.5))]

# Each wing: the root on the shoulder, the wrist and the tip. The left wing is +X.
WING_ROOT = Vector((0.06, -0.06, 0.63))
WRIST = Vector((0.31, 0.0, 0.75))
WING_TIP = Vector((0.57, 0.18, 0.67))

# The breath is made at full size, then this small inside the mouth; its bone
# scales up by 1 / BREATH_SMALL in the attack.
BREATH_SMALL = 0.06


def mirror(point, sign):
    return Vector((point.x * sign, point.y, point.z))


def stand_path(s):
    """The column of frozen mist: a twist from under the belly down to the snow. `s` is 0..1."""
    angle = s * 1.4 * 2 * math.pi
    radius = 0.015 + 0.03 * s
    return Vector((radius * math.sin(angle), 0.03 - radius * math.cos(angle) + 0.02 * s, lerp(0.5, 0.03, s ** 0.95)))


STAND_POINTS = [stand_path(index / 3) for index in range(4)]
# The mound of snow under the column: it stays on the ground, so its bone has
# no parent, and the column reaches it with IK.
SNOW_AT = STAND_POINTS[-1]

LEGS = {
    # name: (hip, foot, parent)
    "FL": (Vector((0.06, -0.1, 0.52)), Vector((0.08, -0.13, 0.4)), "chest"),
    "FR": (Vector((-0.06, -0.1, 0.52)), Vector((-0.08, -0.13, 0.4)), "chest"),
    "BL": (Vector((0.07, 0.09, 0.5)), Vector((0.09, 0.14, 0.38)), "body"),
    "BR": (Vector((-0.07, 0.09, 0.5)), Vector((-0.09, 0.14, 0.38)), "body"),
}

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("body", tuple(BODY + Vector((0, 0.06, 0))), tuple(CHEST), "root"),
    ("chest", tuple(CHEST), tuple(NECK[0]), "body"),
    ("neck", tuple(NECK[0]), tuple(NECK[1]), "chest"),
    ("neck.2", tuple(NECK[1]), tuple(NECK[2]), "neck"),
    ("head", tuple(NECK[2]), tuple(lifted(SNOUT)), "neck.2"),
    ("jaw", tuple(lifted(HEAD + Vector((0, -0.02, -0.03)))), tuple(lifted(SNOUT + Vector((0, 0.01, -0.035)))), "head"),
    ("breath", tuple(lifted(MOUTH_AT)), tuple(lifted(MOUTH_AT + Vector((0, -0.1, -0.02)))), "head"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[1]), "body"),
    ("tail.2", tuple(TAIL[1]), tuple(TAIL[2]), "tail"),
    ("tail.3", tuple(TAIL[2]), tuple(TAIL[3]), "tail.2"),
]
for side, sign in (("L", 1), ("R", -1)):
    BONES += [
        (f"wing.{side}", tuple(mirror(WING_ROOT, sign)), tuple(mirror(WRIST, sign)), "chest"),
        (f"wingtip.{side}", tuple(mirror(WRIST, sign)), tuple(mirror(WING_TIP, sign)), f"wing.{side}"),
    ]
for leg, (hip, foot, parent) in LEGS.items():
    BONES.append((f"leg.{leg}", tuple(hip), tuple(foot), parent))
for index in range(3):
    name = "stand" if index == 0 else f"stand.{index + 1}"
    parent = "body" if index == 0 else ("stand" if index == 1 else f"stand.{index}")
    BONES.append((name, tuple(STAND_POINTS[index]), tuple(STAND_POINTS[index + 1]), parent))
BONES.append(("snow", tuple(SNOW_AT), tuple(SNOW_AT + Vector((0, 0, 0.06))), None))

# --- Weights -------------------------------------------------------------------


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
        if best_t < 0.18 and best_index > 0:
            return blend(names[best_index - 1], names[best_index], best_t, -0.18, 0.18)
        return {names[best_index]: 1.0}

    return weights


def body_weights(co):
    """The body, the chest in front of it, the tail behind it and the neck in front."""
    if co.y > TAIL[0].y - 0.03:
        return blend("body", "tail", co.y, TAIL[0].y - 0.03, TAIL[0].y + 0.04)
    if co.y > CHEST.y:
        return blend("chest", "body", co.y, CHEST.y, BODY.y)
    return blend("neck", "chest", co.y, NECK[0].y - 0.03, CHEST.y + 0.02)


NECK_CHAIN = chain_weights([CHEST, NECK[0], NECK[1], NECK[2], lifted(HEAD)], ["chest", "neck", "neck.2", "head"])
TAIL_CHAIN = chain_weights(TAIL, ["tail", "tail.2", "tail.3"])


def wing_weights(side):
    sign = 1 if side == "L" else -1

    def weights(co):
        x = co.x * sign
        if x < WING_ROOT.x + 0.04:
            return blend("chest", f"wing.{side}", x, WING_ROOT.x - 0.02, WING_ROOT.x + 0.04)
        return blend(f"wing.{side}", f"wingtip.{side}", x, WRIST.x - 0.04, WRIST.x + 0.04)

    return weights


# --- Parts ---------------------------------------------------------------------


def scale_color(face, center):
    """Silver scales: light on the top, grey on the sides, the cream belly underneath."""
    if face.normal.z < -0.45:
        return BELLY
    if face.normal.z < 0.05:
        return SCALE_SHADE
    return SCALE


def spikes(part, points, direction, length, radius):
    """Ice spikes from `points`, light and deep blue in turn."""
    direction = Vector(direction).normalized()
    for index, point in enumerate(points):
        point = Vector(point)
        reach = length * (0.75 + 0.5 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, point - direction * 0.008, point + direction * reach, radius, 0.002, 5)
        part.paint(faces_of(verts), ICE_DEEP if index % 2 else ICE)


def path_of(points, steps):
    result = []
    for step in range(steps + 1):
        s = step / steps * (len(points) - 1)
        index = min(int(s), len(points) - 2)
        result.append(points[index].lerp(points[index + 1], s - index))
    return result


def body_parts():
    parts = []
    body = Part("body", scale_color, body_weights, shade=0.2)
    # A slim body: the chest and the belly.
    kit.sphere(body.bm, BODY, (0.075, 0.13, 0.065), 12, 8)
    kit.sphere(body.bm, CHEST, (0.07, 0.085, 0.07), 12, 8)
    # Bands of belly scales.
    for y in (-0.12, -0.06, 0.0, 0.06, 0.12):
        band = kit.sphere(body.bm, (0, y, 0.5 + abs(y + 0.04) * 0.12), (0.05, 0.016, 0.02), 8, 4)
        body.paint(faces_of(band), BELLY_BAND)
    ridge = [(0, y, 0.62 - abs(y + 0.04) * 0.25) for y in (-0.12, -0.06, 0.0, 0.06, 0.12)]
    spikes(body, ridge, (0, 0.7, 1), 0.08, 0.022)
    parts.append(body)

    neck = Part("neck", scale_color, NECK_CHAIN, shade=0.15)
    points = [CHEST + Vector((0, 0.01, 0.0))] + NECK + [lifted(HEAD) + Vector((0, 0.01, 0))]
    kit.tube(neck.bm, path_of(points, 10), [lerp(0.06, 0.035, step / 10) for step in range(11)], 8)
    spikes(neck, [p + Vector((0, 0.02, 0.035)) for p in path_of(NECK, 4)], (0, 0.9, 0.6), 0.07, 0.016)
    parts.append(neck)

    tail = Part("tail", scale_color, TAIL_CHAIN, shade=0.12)
    path = path_of(TAIL, 12)
    kit.tube(tail.bm, path, [lerp(0.05, 0.012, step / 12) for step in range(13)], 7)
    spikes(tail, [p + Vector((0, 0, 0.03 - 0.02 * index / 6)) for index, p in enumerate(path[1:12:2])], (0, 0.8, 0.7), 0.05, 0.012)
    # An ice blade at the tip of the tail.
    tip = TAIL[-1]
    blade = kit.cone(tail.bm, tip - Vector((0, 0.03, 0)), tip + Vector((0, 0.08, 0.03)), 0.04, 0.002, 4, squash=0.25)
    tail.paint(faces_of(blade), ICE_DEEP)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", scale_color, "head", shade=0.12)
    kit.sphere(head.bm, HEAD + Vector((0, -0.03, 0.005)), (0.05, 0.065, 0.045), 10, 8)
    kit.cone(head.bm, HEAD + Vector((0, -0.06, 0.0)), SNOUT, 0.042, 0.02, 8, squash=1.0)
    lip = kit.box(head.bm, (0, -0.4, 0.758), (0.06, 0.12, 0.008))
    head.paint(faces_of(lip), MOUTH)
    parts.append(head)

    horns = Part("horns", ICE, "head", shade=0.08)
    for sign in (1, -1):
        # Two long horns swept back, and a crest of short spikes.
        base = HEAD + Vector((0.03 * sign, 0.0, 0.03))
        verts = kit.cone(horns.bm, base, base + Vector((0.05 * sign, 0.15, 0.06)), 0.016, 0.002, 6)
        horns.paint(faces_of(verts), ICE_DEEP)
        for index, (dy, dz) in enumerate(((-0.02, 0.0), (0.03, -0.02))):
            point = HEAD + Vector((0.045 * sign, dy, dz))
            verts = kit.cone(horns.bm, point, point + Vector((0.07 * sign, 0.06, 0.01)), 0.01, 0.001, 5)
            horns.paint(faces_of(verts), ICE if index else ICE_DEEP)
    spikes(horns, [HEAD + Vector((0, 0.02, 0.045)), HEAD + Vector((0, -0.03, 0.045))], (0, 0.7, 0.8), 0.05, 0.012)
    # The icicle that its own breath froze onto its nose.
    verts = kit.cone(horns.bm, SNOUT + Vector((0, 0.01, 0.0)), SNOUT + Vector((0, -0.012, -0.075)), 0.011, 0.001, 5)
    horns.paint(faces_of(verts), ICE)
    parts.append(horns)

    eyes = Part("eyes", EYE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD + Vector((0.038 * sign, -0.06, 0.02)), (0.012, 0.016, 0.008), 6, 4)
    parts.append(eyes)

    fangs = Part("fangs", FANG, "head", shade=0.04)
    for sign in (1, -1):
        for index, y in enumerate((-0.36, -0.4, -0.44)):
            length = 0.03 if index == 1 else 0.018
            kit.cone(fangs.bm, (0.022 * sign, y, 0.76), (0.022 * sign, y, 0.76 - length), 0.006, 0.001, 4)
    parts.append(fangs)

    jaw = Part("jaw", SCALE_SHADE, "jaw", shade=0.08)
    kit.cone(jaw.bm, HEAD + Vector((0, -0.04, -0.035)), SNOUT + Vector((0, 0.015, -0.03)), 0.032, 0.016, 8)
    tongue = kit.box(jaw.bm, (0, -0.39, 0.752), (0.04, 0.1, 0.008))
    jaw.paint(faces_of(tongue), MOUTH)
    for sign in (1, -1):
        for y in (-0.38, -0.43):
            tooth = kit.cone(jaw.bm, (0.018 * sign, y, 0.754), (0.018 * sign, y, 0.772), 0.005, 0.001, 4)
            jaw.paint(faces_of(tooth), FANG)
    parts.append(jaw)

    # The frost breath: puffs of frost and shards of ice in a cone, made at
    # full size and then shrunk inside the mouth.
    breath = Part("breath", FROST, "breath", shade=0.0)
    direction = Vector((0, -1, -0.22)).normalized()
    blast = kit.cone(breath.bm, MOUTH_AT, MOUTH_AT + direction * 0.5, 0.015, 0.1, 10)
    breath.paint(faces_of(blast), ICE)
    for index, s in enumerate((0.05, 0.12, 0.2, 0.28, 0.36, 0.44, 0.52)):
        center = MOUTH_AT + direction * s
        radius = 0.025 + 0.16 * s
        kit.sphere(breath.bm, center, (radius, radius * 0.9, radius), 8, 6)
        for k in range(3):
            angle = k * 2.1 + index
            out = Vector((math.cos(angle), 0, math.sin(angle))) * radius
            shard = kit.cone(breath.bm, center + out * 0.6, center + out * 1.25 + direction * 0.05, radius * 0.25, 0.002, 4)
            breath.paint(faces_of(shard), ICE if k % 2 else ICE_DEEP)
    small = Matrix.Translation(MOUTH_AT) @ Matrix.Scale(BREATH_SMALL, 4) @ Matrix.Translation(-MOUTH_AT)
    kit.bmesh.ops.transform(breath.bm, matrix=small, verts=list(breath.bm.verts))
    parts.append(breath)
    for part in parts:
        kit.bmesh.ops.translate(part.bm, vec=HEAD_LIFT, verts=list(part.bm.verts))
    return parts


def wing_part(side, sign):
    """A wing: an arm along the leading edge and a pale membrane with icicles on its trailing edge."""
    root, wrist, tip = (mirror(p, sign) for p in (WING_ROOT, WRIST, WING_TIP))
    back_root = mirror(Vector((0.06, 0.15, 0.57)), sign)
    back_mid = mirror(Vector((0.3, 0.26, 0.62)), sign)
    rows, columns = 6, 3

    def leading(u):
        return root.lerp(wrist, u / 0.5) if u < 0.5 else wrist.lerp(tip, (u - 0.5) / 0.5)

    def trailing(u):
        # Scallops between the fingers of the wing.
        point = back_root.lerp(back_mid, u / 0.5) if u < 0.5 else back_mid.lerp(tip, (u - 0.5) / 0.5)
        return point + Vector((0, -0.03 * math.sin(u * rows * math.pi) ** 2, 0.02 * math.sin(u * rows * math.pi) ** 2))

    def grid(offset):
        result = []
        for row in range(rows + 1):
            u = row / rows
            a, b = leading(u), trailing(u)
            line = []
            for column in range(columns + 1):
                v = column / columns
                sag = 0.025 * math.sin(v * math.pi) * (1 - u)
                line.append(a.lerp(b, v) + Vector((0, 0, offset - sag)))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if face_side == "back":
            return MEMBRANE_DEEP
        # Light near the arm, deeper toward the trailing edge.
        return MEMBRANE if column < columns - 1 else MEMBRANE_DEEP

    part = Part(f"wing.{side}", MEMBRANE, wing_weights(side), shade=0.0)
    kit.panel(part, grid(0.004), grid(-0.004), color_of)
    # The arm bones of the wing, along the leading edge, and the fingers.
    arm = kit.tube(part.bm, [root, wrist, tip], [0.022, 0.015, 0.004], 6)
    part.paint(faces_of(arm), SCALE)
    for u in (0.68, 0.84):
        finger = kit.tube(part.bm, [wrist, trailing(u) + Vector((0, 0, 0.004))], [0.008, 0.003], 4)
        part.paint(faces_of(finger), SCALE_SHADE)
    claw = kit.cone(part.bm, wrist, wrist + Vector((0.02 * sign, -0.04, 0.03)), 0.01, 0.001, 4)
    part.paint(faces_of(claw), ICE_DEEP)
    # Ice spikes along the arm and icicles that hang from the trailing edge.
    spikes(part, [root.lerp(wrist, 0.5), wrist, wrist.lerp(tip, 0.5)], (0.3 * sign, -0.3, 1), 0.05, 0.012)
    for row in range(1, rows):
        u = row / rows
        drop = trailing(u)
        icicle = kit.cone(part.bm, drop + Vector((0, 0, 0.005)), drop + Vector((0, 0.01, -0.06 - 0.02 * (row % 2))), 0.009, 0.001, 4)
        part.paint(faces_of(icicle), ICE)
    return part


def leg_parts():
    parts = []
    for leg, (hip, foot, _parent) in LEGS.items():
        part = Part(f"leg.{leg}", SCALE_SHADE, f"leg.{leg}", shade=0.1)
        knee = hip.lerp(foot, 0.5) + Vector((0, -0.03 if leg.startswith("B") else 0.02, 0))
        kit.tube(part.bm, [hip, knee, foot], [0.03 if leg.startswith("B") else 0.024, 0.018, 0.013], 6)
        # Three dark claws, curled.
        for spread in (-1, 0, 1):
            base = foot + Vector((spread * 0.012, -0.005, 0))
            claw = kit.cone(part.bm, base, base + Vector((spread * 0.01, -0.025, -0.02)), 0.007, 0.001, 4)
            part.paint(faces_of(claw), CLAW)
        parts.append(part)
    return parts


def stand_part():
    """The flight stand: a twisted column of frozen mist with ice shards, on a mound of snow."""
    part = Part("stand", ICE, chain_weights(STAND_POINTS, ["stand", "stand.2", "stand.3"]), shade=0.08)
    steps = 18
    path = [stand_path(step / steps) for step in range(steps + 1)]
    verts = kit.tube(part.bm, path, [lerp(0.022, 0.032, step / steps) for step in range(steps + 1)], 6)
    for face in faces_of(verts):
        if int(face.calc_center_median().z * 40) % 3 == 0:
            part.paint([face], FROST)
    # A thin second strand of mist round the column.
    strand = [stand_path(step / steps) + Vector((0.04 * math.cos(step * 0.9), 0.04 * math.sin(step * 0.9), 0)) for step in range(2, steps)]
    verts = kit.tube(part.bm, strand, [0.008] * len(strand), 4)
    part.paint(faces_of(verts), FROST)
    for index in range(3, steps - 1, 3):
        a = path[index]
        out = Vector((math.cos(index * 1.3), math.sin(index * 1.3), 0.4)).normalized()
        shard = kit.cone(part.bm, a, a + out * 0.05, 0.01, 0.001, 4)
        part.paint(faces_of(shard), ICE_DEEP)
    # The mound of snow, with shards of ice in it.
    snow = Part("snow", SNOW, "snow", shade=0.1)
    base = path[-1] * Vector((1, 1, 0))
    mound = kit.sphere(snow.bm, base + Vector((0, 0, 0.022)), (0.09, 0.09, 0.028), 10, 5)
    snow.paint([f for f in faces_of(mound) if f.normal.z < 0.5], SNOW_SHADE)
    for index in range(4):
        angle = index * 1.7
        point = base + Vector((0.06 * math.cos(angle), 0.06 * math.sin(angle), 0.015))
        shard = kit.cone(snow.bm, point, point + Vector((0.02 * math.cos(angle), 0.02 * math.sin(angle), 0.05)), 0.012, 0.001, 4)
        snow.paint(faces_of(shard), ICE if index % 2 else ICE_DEEP)
    return [part, snow]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("RimebreathDrake", BONES)
    parts = body_parts() + head_parts() + leg_parts()
    parts += [wing_part(side, sign) for side, sign in (("L", 1), ("R", -1))]
    parts += stand_part()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "RimebreathDrakeMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """IK for the column of mist: its foot reaches the mound of snow, so it bends when the body moves."""
    ik = rig.pose.bones["stand.3"].constraints.new("IK")
    ik.name = "IK"
    ik.target = rig
    ik.subtarget = "snow"
    ik.chain_count = 3
    ik.use_tail = True
    return {}


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

    def wings(lift=0.0, tip=0.0, sweep=0.0):
        """The wings: `lift` raises each arm (degrees), `tip` bends the tip up, `sweep` takes them back."""
        return {
            "wing.L": t("wing.L", (Y, -lift), (Z, sweep)),
            "wing.R": t("wing.R", (Y, lift), (Z, -sweep)),
            "wingtip.L": t("wingtip.L", (Y, -tip)),
            "wingtip.R": t("wingtip.R", (Y, tip)),
        }

    def beat(flap):
        """A wing beat: `flap` 1 is the top of the stroke, -1 the bottom. The tips lag."""
        return wings(8 + 36 * flap, 6 + 16 * flap, 0)

    def legs(front=0.0, back=0.0):
        """The legs hang under the body; a positive value tucks them back."""
        return {
            "leg.FL": t("leg.FL", (X, front)),
            "leg.FR": t("leg.FR", (X, front)),
            "leg.BL": t("leg.BL", (X, back)),
            "leg.BR": t("leg.BR", (X, back)),
        }

    def column(trail=0.0, sway=0.0):
        """The column of mist: `trail` > 0 bends it back, `sway` to the side, so its foot stays near the snow."""
        result = {}
        for index, name in enumerate(("stand", "stand.2", "stand.3")):
            result[name] = t(name, (X, -8 * trail * (index + 1)), (Y, 5 * sway * (index + 1)))
        return result

    def hover(flap=0.0, bob=0.0, sway=0.0):
        """
        The idle: it hovers with the neck up in an S, the head turned a little
        to the camera, the tail swings and the wings beat.
        """
        return {
            "root@loc": at("root", (0, 0, 0.015 * bob)),
            "body": t("body", (X, -3 + 2 * bob), (Y, 3 * sway)),
            "chest": t("chest", (X, -2)),
            "neck": t("neck", (X, -6), (Z, -4 + 3 * sway)),
            "neck.2": t("neck.2", (X, 4), (Z, -4)),
            "head": t("head", (X, 10 - 3 * bob), (Z, -6 + 4 * sway)),
            "jaw": t("jaw", (X, 4 + 3 * max(0.0, bob))),
            "breath@scale": 1.0,
            "tail": t("tail", (X, 4 + 3 * bob), (Z, 6 * sway)),
            "tail.2": t("tail.2", (X, 4 + 3 * bob), (Z, 10 * sway)),
            "tail.3": t("tail.3", (X, -6 + 4 * bob), (Z, 14 * sway)),
            **beat(flap),
            **legs(10 + 4 * bob, 16 + 4 * bob),
            **column(0.2 * bob, -sway * 0.4),
            "stand.3/IK": 1.0,
        }

    def droop(flap=0.0, bob=0.0):
        """Low HP: it hangs lower and tilts, the neck sags and the wings beat weakly."""
        return pose(
            hover(0, bob, 0),
            root_at_loc=at("root", (0, 0, -0.05 + 0.008 * bob)),
            body=t("body", (X, 8 + 2 * bob), (Y, -12)),
            neck=t("neck", (X, 16)),
            neck__2=t("neck.2", (X, 14)),
            head=t("head", (X, 10), (Y, -8)),
            jaw=t("jaw", (X, 14)),
            tail=t("tail", (X, -10)),
            tail__2=t("tail.2", (X, -12)),
            tail__3=t("tail.3", (X, -8)),
            **wings(-6 + 18 * flap, 2 + 10 * flap, 10),
            **legs(-10, 0),
            **column(1.2, 0.4),
        )

    def glide(flap=0.0, bob=0.0, sway=0.0):
        """The walk: it flies forward low, the neck out and the tail straight, with big beats."""
        return pose(
            hover(flap, bob, sway),
            root_at_loc=at("root", (0, 0, 0.02 * bob)),
            body=t("body", (X, 8), (Y, 4 * sway)),
            neck=t("neck", (X, 18)),
            neck__2=t("neck.2", (X, 10)),
            head=t("head", (X, -6)),
            tail=t("tail", (X, -6)),
            tail__2=t("tail.2", (X, -2), (Z, 8 * sway)),
            tail__3=t("tail.3", (X, 4), (Z, 12 * sway)),
            **wings(4 + 44 * flap, 4 + 22 * flap, 6),
            **legs(36, 40),
            **column(1.0, sway * 0.5),
        )

    # The attack (melee, Frost): it rears up with the wings high and draws a
    # breath, then lunges and blasts frost. The slash effect starts at 50% of
    # the attack (`MELEE_IMPACT` in fx.ts), so the blast is full at frame 15
    # of 30.
    def rear(base):
        return pose(
            base,
            root_at_loc=at("root", (0, 0.06, 0.05)),
            body=t("body", (X, -18)),
            neck=t("neck", (X, -18)),
            neck__2=t("neck.2", (X, -10)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 4)),
            tail=t("tail", (X, 12)),
            tail__2=t("tail.2", (X, 14)),
            **wings(58, 30, -8),
            **legs(-10, 6),
            **column(-0.6),
        )

    def blast(base, power=1.0, open_jaw=36):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.12, -0.02)),
            body=t("body", (X, 10)),
            neck=t("neck", (X, 20)),
            neck__2=t("neck.2", (X, 8)),
            head=t("head", (X, -18)),
            jaw=t("jaw", (X, open_jaw)),
            breath_at_scale=max(1.0, power / BREATH_SMALL),
            tail=t("tail", (X, -10)),
            tail__2=t("tail.2", (X, -6)),
            **wings(-14, -6, 20),
            **legs(30, 36),
            **column(1.2),
        )

    def knocked(base, amount=1.0):
        """The hit knocks it back and up, and the wings jolt."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.05 * amount, 0.025 * amount)),
            body=t("body", (X, -14 * amount), (Y, 10 * amount)),
            neck=t("neck", (X, -14 * amount)),
            head=t("head", (X, -12 * amount), (Z, 10 * amount)),
            jaw=t("jaw", (X, 24 * amount)),
            tail=t("tail", (X, 16 * amount)),
            tail__2=t("tail.2", (X, 12 * amount)),
            **wings(46 * amount, 30 * amount, -10 * amount),
            **column(-0.6 * amount, -amount),
        )

    def falling(base):
        """The column breaks and it drops, the wings up."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.02, -0.2)),
            body=t("body", (X, 18), (Y, 26)),
            neck=t("neck", (X, 20)),
            head=t("head", (X, 16)),
            jaw=t("jaw", (X, 20)),
            tail=t("tail", (X, -14)),
            **wings(50, 40, 20),
            **column(1.6, 1),
            stand_at_scale=0.04,
            **{"stand.3/IK": 0.0},
        )

    def fallen(base, bounce=0.0):
        """On its left side on the ground, the wings folded back, the neck and the tail curled."""
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.46, 0, 0.08)),
            body=t("body", (X, 0)),
            neck=t("neck", (X, 18), (Y, -10)),
            neck__2=t("neck.2", (X, 10)),
            head=t("head", (X, 8)),
            jaw=t("jaw", (X, 22)),
            tail=t("tail", (Z, 10)),
            tail__2=t("tail.2", (Z, 16)),
            tail__3=t("tail.3", (Z, 20)),
            **wings(16, 50, 64),
            **legs(-20, -10),
            **column(1.6, 1),
            stand_at_scale=0.04,
            **{"stand.3/IK": 0.0},
        )

    def folded(base):
        """The wings up and closed over the back, low over the snow, as a summon starts."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, -0.08)),
            body=t("body", (X, 6)),
            neck=t("neck", (X, 24)),
            head=t("head", (X, 18)),
            tail=t("tail", (X, -10)),
            **wings(80, 40, 18),
            **column(0.6),
        )

    def cry(base):
        """The neck up, the jaw open and the wings spread: the end of a summon."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, 0.03)),
            body=t("body", (X, -10)),
            neck=t("neck", (X, -16)),
            neck__2=t("neck.2", (X, -8)),
            head=t("head", (X, -8)),
            jaw=t("jaw", (X, 34)),
            breath_at_scale=0.5 / BREATH_SMALL,
            **wings(30, 24, -6),
            **column(-0.4),
        )

    clips = []
    # Two slow beats in the idle loop.
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 4):
        a = frame / 48 * 2 * math.pi
        idle.key(frame, hover(math.cos(a * 2), math.sin(a * 2 - 0.8), math.sin(a) * 0.6))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame in range(0, 49, 4):
        a = frame / 48 * 2 * math.pi
        low.key(frame, droop(math.cos(a * 2), math.sin(a * 2 - 0.8)))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    for frame in range(0, 25, 2):
        a = frame / 24 * 2 * math.pi
        walk.key(frame, glide(math.cos(a), math.sin(a - 0.8), math.sin(a) * 0.5))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, hover(1)).key(6, rear(hover(1))).key(10, rear(hover(1)))
    attack.key(13, blast(hover(), 0.7)).key(15, blast(hover())).key(19, blast(hover(), 0.9))
    attack.key(22, pose(blast(hover(), 0.2, 12), **beat(1))).key(26, hover(-1)).key(30, hover(1))
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, hover(1)).key(3, knocked(hover())).key(7, knocked(hover(-1), 0.5)).key(11, hover(0.5)).key(16, hover(1))
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, hover(1)).key(4, knocked(hover())).key(8, knocked(hover(-1), 0.6)).key(15, falling(hover()))
    death.key(24, fallen(hover())).key(28, fallen(hover(), 8)).key(36, fallen(hover()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, folded(hover())).key(8, folded(hover())).key(13, pose(hover(-1), **wings(-20, -10, -10)))
    summon.key(17, cry(hover(1))).key(20, cry(hover(-0.5))).key(24, hover(1))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "rimebreath-drake.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
