"""
Amberwing Dart (`elf.amberwingDart`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a dragonfly plant spirit with a
green body of leaf scales, big amber eyes, a long banded tail, four leaf
wings with amber veins and a thorn lance at its head, with a drop of poison
at the tip. One wing has a window-shaped repair. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/amberwing-dart.glb`;
then `bun unit-model:pack amberwing-dart` packs it for the game.

It is a creature, not a figure, and it is Flying. Two thorny vines trail from
its body down to the ground, as the flight stand of a miniature: the game
puts the rest pose on the ground, so the vines keep the body in the air. The
wings flap in each clip. Its attack (melee, Swift) is a steep dive with the
lance. In the death clip the wings fold and it falls on its left side
(`(Y, +84)` on the root), so the legs turn to the camera side (-X). It has no
Keyword that it uses by its own action, so it has no cast clip.
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

BODY = hex_color("#6f8a3a")
BODY_DARK = hex_color("#4a6128")
BODY_LIGHT = hex_color("#9cb455")
AMBER = hex_color("#e8a83a")
AMBER_LIGHT = hex_color("#f6cf62")
EYE = hex_color("#f0a52e")
EYE_DARK = hex_color("#8a4a14")
WING = hex_color("#d9c45a")
WING_EDGE = hex_color("#e89a34")
WING_VEIN = hex_color("#8a6a26")
WING_GREEN = hex_color("#b8c060")
REPAIR = hex_color("#f2e6c4")
BARK = hex_color("#6b4a2a")
BARK_DARK = hex_color("#4a321c")
VINE = hex_color("#5d6e2c")
VINE_DARK = hex_color("#3f4c1e")
LEAF = hex_color("#7da040")
LEAF_LIGHT = hex_color("#a8c45a")
POISON = hex_color("#9ee04a")

# --- Proportions ---------------------------------------------------------------

# The body hovers at this height, and faces -Y.
BODY_Z = 0.55
THORAX = Vector((0, 0, BODY_Z))
HEAD_C = Vector((0, -0.088, 0.565))
LANCE_ROOT = Vector((0, -0.122, 0.56))
LANCE_TIP = Vector((0, -0.27, 0.53))

# The tail: a banded tube from the back of the thorax, a little down.
TAIL = [Vector((0, 0.05, 0.55)), Vector((0, 0.16, 0.54)), Vector((0, 0.27, 0.515)), Vector((0, 0.37, 0.49))]

# The wings: a root on the thorax, a length and a width, and the direction
# of the wing (out, a little back and up).
WINGS = {
    "FL": (Vector((0.03, -0.02, 0.6)), Vector((1, 0.08, 0.16)), 0.36, 0.05),
    "FR": (Vector((-0.03, -0.02, 0.6)), Vector((-1, 0.08, 0.16)), 0.36, 0.05),
    "BL": (Vector((0.03, 0.035, 0.595)), Vector((1, 0.3, 0.12)), 0.32, 0.056),
    "BR": (Vector((-0.03, 0.035, 0.595)), Vector((-1, 0.3, 0.12)), 0.32, 0.056),
}



def vine_path(s):
    """The main vine: a loose spiral from under the thorax down to the ground. `s` is 0..1."""
    angle = s * 1.6 * 2 * math.pi
    radius = 0.012 + 0.05 * s
    return Vector((radius * math.sin(angle), 0.01 - radius * math.cos(angle) - 0.03 * s, lerp(0.5, 0.012, s ** 0.92)))


def tendril_path(s):
    """A thin tendril from the base of the tail: it trails back and curls up at its end."""
    curl = max(0.0, s - 0.6) / 0.4
    return Vector((0.02 + 0.03 * math.sin(s * 3), 0.08 + 0.15 * s - 0.04 * math.sin(curl * math.pi), 0.515 - 0.27 * s + 0.07 * (1 - math.cos(curl * math.pi * 0.9))))


# The vines that trail from the body: the main vine to the ground, the
# tendril in the air. Each has three bones along it.
VINE_POINTS = [vine_path(index / 3) for index in range(4)]
TENDRIL_POINTS = [tendril_path(index / 3) for index in range(4)]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("body", tuple(THORAX + Vector((0, 0.04, 0))), tuple(THORAX + Vector((0, -0.05, 0))), "root"),
    ("head", tuple(HEAD_C + Vector((0, 0.03, 0))), tuple(HEAD_C + Vector((0, -0.04, 0))), "body"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[1]), "body"),
    ("tail.2", tuple(TAIL[1]), tuple(TAIL[2]), "tail"),
    ("tail.3", tuple(TAIL[2]), tuple(TAIL[3]), "tail.2"),
]
for name, (root, direction, _length, _width) in WINGS.items():
    BONES.append((f"wing.{name}", tuple(root), tuple(root + direction.normalized() * 0.1), "body"))
for chain, points in (("vine", VINE_POINTS), ("tendril", TENDRIL_POINTS)):
    for index in range(3):
        name = chain if index == 0 else f"{chain}.{index + 1}"
        parent = "body" if index == 0 else (chain if index == 1 else f"{chain}.{index}")
        BONES.append((name, tuple(points[index]), tuple(points[index + 1]), parent))

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
        if best_t > 0.85 and best_index + 1 < len(names):
            return blend(names[best_index], names[best_index + 1], best_t, 0.85, 1.15)
        return {names[best_index]: 1.0}

    return weights


def tail_weights(co):
    if co.y < TAIL[1].y:
        return blend("body", "tail", co.y, TAIL[0].y - 0.01, TAIL[0].y + 0.03)
    if co.y < TAIL[2].y:
        return blend("tail", "tail.2", co.y, TAIL[1].y - 0.015, TAIL[1].y + 0.015)
    return blend("tail.2", "tail.3", co.y, TAIL[2].y - 0.015, TAIL[2].y + 0.015)


# --- Parts ---------------------------------------------------------------------


def leaf(part, base, direction, length, width, color):
    """A flat leaf: a cone squashed thin."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.001, 4, squash=0.3)
    part.paint(faces_of(verts), color)
    return verts


def body_parts():
    parts = []

    def scales(face, center):
        # Rows of leaf scales on the thorax.
        return BODY_DARK if int(center.y * 90) % 2 else BODY

    thorax = Part("thorax", scales, "body", smooth=False, shade=0.2)
    kit.sphere(thorax.bm, THORAX, (0.05, 0.075, 0.056), 12, 8)
    parts.append(thorax)

    # A collar of small leaves over the back of the thorax.
    collar = Part("collar", LEAF, "body", shade=0.1)
    for index in range(5):
        x = (index - 2) * 0.022
        leaf(collar, THORAX + Vector((x, -0.03, 0.045)), (x * 4, 0.6, 0.5), 0.07, 0.02, (LEAF_LIGHT, LEAF, AMBER)[index % 3])
    parts.append(collar)

    # Six thin legs, curled under the thorax.
    legs = Part("legs", BARK, "body", shade=0.05)
    for y in (-0.035, 0.0, 0.035):
        for sign in (1, -1):
            hip = THORAX + Vector((0.03 * sign, y, -0.035))
            knee = hip + Vector((0.035 * sign, -0.01, -0.03))
            foot = knee + Vector((0.005 * sign, -0.025, -0.035))
            kit.tube(legs.bm, [hip, knee, foot], [0.006, 0.005, 0.002], 4)
    parts.append(legs)

    head = Part("head", BODY_LIGHT, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.04, 0.038, 0.04), 10, 8)
    # A small crest of leaves on the head.
    for index, sign in enumerate((1, -1)):
        leaf(head, HEAD_C + Vector((0.01 * sign, 0.0, 0.035)), (0.4 * sign, 0.8, 1), 0.05, 0.014, LEAF_LIGHT if index else AMBER)
    # Two thin feelers.
    for sign in (1, -1):
        kit.tube(head.bm, [HEAD_C + Vector((0.012 * sign, -0.03, 0.03)), HEAD_C + Vector((0.03 * sign, -0.06, 0.07)), HEAD_C + Vector((0.05 * sign, -0.07, 0.09))], [0.003, 0.0025, 0.0015], 4)
    parts.append(head)

    eyes = Part("eyes", EYE, "head", shade=0.0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.03 * sign, -0.012, 0.012)), (0.03, 0.032, 0.032), 10, 7)
        glint = kit.sphere(eyes.bm, HEAD_C + Vector((0.05 * sign, -0.032, 0.026)), (0.008, 0.008, 0.008), 5, 4)
        eyes.paint(faces_of(glint), AMBER_LIGHT)
        pupil = kit.sphere(eyes.bm, HEAD_C + Vector((0.054 * sign, -0.02, 0.008)), (0.006, 0.009, 0.01), 5, 4)
        eyes.paint(faces_of(pupil), EYE_DARK)
    parts.append(eyes)

    # The thorn lance, with thorns along it and a drop of poison at the tip.
    lance = Part("lance", BARK, "head", shade=0.05)
    kit.cone(lance.bm, LANCE_ROOT + Vector((0, 0.02, 0)), LANCE_TIP, 0.016, 0.002, 7)
    axis = (LANCE_TIP - LANCE_ROOT).normalized()
    for along, direction in ((0.25, Vector((0.6, 0, 1))), (0.45, Vector((-0.6, 0, 1))), (0.62, Vector((0, 0, -1))), (0.35, Vector((0, 0, -1)))):
        base = LANCE_ROOT + (LANCE_TIP - LANCE_ROOT) * along
        thorn = kit.cone(lance.bm, base, base + (direction.normalized() + axis * 0.8).normalized() * 0.022, 0.005, 0.001, 4)
        lance.paint(faces_of(thorn), BARK_DARK)
    drop = kit.sphere(lance.bm, LANCE_TIP + Vector((0, 0.004, -0.012)), (0.008, 0.008, 0.012), 6, 4)
    lance.paint(faces_of(drop), POISON)
    band = kit.cone(lance.bm, LANCE_ROOT + Vector((0, 0.01, 0)), LANCE_ROOT - Vector((0, 0.01, 0)), 0.02, 0.019, 7)
    lance.paint(faces_of(band), AMBER)
    parts.append(lance)

    # The tail, in short rings for the bands.
    tail = Part("tail", BODY, tail_weights, shade=0.08)
    path = []
    steps = 12
    for step in range(steps + 1):
        s = step / steps * (len(TAIL) - 1)
        index = min(int(s), len(TAIL) - 2)
        f = s - index
        path.append(TAIL[index].lerp(TAIL[index + 1], f))
    ring_radii = [lerp(0.03, 0.01, step / steps) for step in range(steps + 1)]
    verts = kit.tube(tail.bm, path, ring_radii, 8)
    for face in faces_of(verts):
        band = int((face.calc_center_median().y - TAIL[0].y) / (TAIL[-1].y - TAIL[0].y) * steps)
        tail.paint([face], AMBER if band % 3 == 2 else (BODY_DARK if band % 3 == 1 else BODY))
    # Two small leaf fins at the end.
    for sign in (1, -1):
        leaf(tail, TAIL[-1], (0.5 * sign, 1, 0.1), 0.05, 0.016, LEAF_LIGHT)
    parts.append(tail)
    return parts


def wing_part(name, root, direction, length, width):
    """A leaf wing: two thin layers with a vein down the middle and amber edges."""
    direction = direction.normalized()
    across = (Vector((0, -1, 0)) - direction * direction.dot(Vector((0, -1, 0)))).normalized()
    normal = direction.cross(across).normalized()
    if normal.z < 0:
        normal = -normal
    rows, columns = 6, 4

    def grid(offset):
        result = []
        for row in range(rows + 1):
            u = row / rows
            # Wide near the root third, then to a point.
            w = width * (math.sin(math.pi * min(1.0, u * 0.9 + 0.08)) ** 0.7) * (1 - 0.15 * u)
            line = []
            for column in range(columns + 1):
                v = column / columns * 2 - 1
                camber = 0.012 * (1 - v * v) * math.sin(math.pi * u)
                line.append(root + direction * (u * length) + across * (v * w + 0.012 * u) + normal * (camber + offset))
            result.append(line)
        return result

    repair = name == "FR"

    def color_of(side, row, column):
        if repair and row in (2, 3) and column in (1, 2):
            return REPAIR
        if column in (0, columns - 1) or row == rows - 1:
            return WING_EDGE
        if row == 0:
            return WING_GREEN
        return WING

    part = Part(f"wing.{name}", WING, f"wing.{name}", shade=0.0)
    kit.panel(part, grid(0.003), grid(-0.003), color_of)
    # The veins: one down the middle, and short ones to the edges.
    vein = kit.tube(part.bm, [root, root + direction * length * 0.95 + across * 0.012], [0.004, 0.0015], 4)
    part.paint(faces_of(vein), WING_VEIN)
    for u in (0.3, 0.55, 0.75):
        base = root + direction * (u * length) + across * (0.012 * u)
        for sign in (1, -1):
            w = width * (math.sin(math.pi * min(1.0, u * 0.9 + 0.08)) ** 0.7) * (1 - 0.15 * u)
            branch = kit.tube(part.bm, [base + normal * 0.004, base + direction * 0.04 + across * (sign * w * 0.8) + normal * 0.004], [0.0025, 0.0012], 3)
            part.paint(faces_of(branch), WING_VEIN)
    if repair:
        # The window of the repair: a frame and a cross of thin twigs.
        middle = root + direction * (length * 2.5 / 6) + across * 0.004
        span_u = direction * (length / 6)
        span_v = across * (width * 0.45)
        for side in (1, -1):
            for a, b in ((middle + span_u * side - span_v, middle + span_u * side + span_v), (middle - span_u + span_v * side, middle + span_u + span_v * side)):
                for offset in (0.005, -0.005):
                    twig = kit.tube(part.bm, [a + normal * offset, b + normal * offset], [0.003, 0.003], 3)
                    part.paint(faces_of(twig), BARK)
        for offset in (0.005, -0.005):
            for a, b in ((middle - span_u, middle + span_u), (middle - span_v, middle + span_v)):
                twig = kit.tube(part.bm, [a + normal * offset, b + normal * offset], [0.0022, 0.0022], 3)
                part.paint(faces_of(twig), BARK)
    return part


def vine_part(name, curve, points, names, radius, ground):
    """A thorny vine along `curve` (0..1), with a few leaves, and a curl on the ground if `ground`."""
    part = Part(name, VINE, chain_weights(points, names), shade=0.06)
    steps = 18
    path = [curve(step / steps) for step in range(steps + 1)]
    radii = [lerp(radius, radius * 0.45, step / steps) for step in range(steps + 1)]
    verts = kit.tube(part.bm, path, radii, 5)
    for face in faces_of(verts):
        if int(face.calc_center_median().z * 70) % 3 == 0:
            part.paint([face], VINE_DARK)
    for index in range(2, steps, 2):
        a, b = path[index], path[index + 1]
        out = (b - a).cross(Z if index % 4 else X).normalized()
        thorn = kit.cone(part.bm, a, a + out * radius * 2.2 + (b - a).normalized() * 0.006, radius * 0.5, 0.001, 4)
        part.paint(faces_of(thorn), BARK)
    for index in (3, 7, 11, 15):
        out = Vector((math.cos(index), math.sin(index), 0.3))
        leaf(part, path[index], out, 0.045, 0.016, LEAF if index % 2 else LEAF_LIGHT)
    if ground:
        # A curl at the foot of the vine, on the ground.
        kit.torus(part.bm, path[-1] + Vector((0, 0, 0.004)), (0, 0, 1), 0.02, radius * 0.45, 8, 3)
    return part


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("AmberwingDart", BONES)
    parts = body_parts()
    parts += [wing_part(name, *spec) for name, spec in WINGS.items()]
    parts.append(vine_part("vine", vine_path, VINE_POINTS, ["vine", "vine.2", "vine.3"], 0.011, True))
    parts.append(vine_part("tendril", tendril_path, TENDRIL_POINTS, ["tendril", "tendril.2", "tendril.3"], 0.007, False))
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "AmberwingDartMesh")
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

    def wings(front=0.0, hind=0.0, sweep=0.0):
        """The wings: `front` and `hind` lift each pair (degrees), and `sweep` takes them back."""
        result = {}
        for pair, lift in (("F", front), ("B", hind)):
            # A left wing (+X) goes up with a turn of -Y, and back with +Z.
            result[f"wing.{pair}L"] = t(f"wing.{pair}L", (Y, -lift), (Z, sweep))
            result[f"wing.{pair}R"] = t(f"wing.{pair}R", (Y, lift), (Z, -sweep))
        return result

    def vines(curl=0.0, sway=0.0):
        """The vines trail back (`curl` > 0) or forward, and swing to the side (`sway`)."""
        result = {}
        for chain, sign in (("vine", 1), ("tendril", -1)):
            for index, name in enumerate((chain, f"{chain}.2", f"{chain}.3")):
                result[name] = t(name, (X, 10 * curl * (index + 1)), (Y, 6 * sway * sign * (index + 1)))
        return result

    def hover(flap=0.0, bob=0.0, sway=0.0):
        """
        The idle: it hovers, the body a little nose-up, the tail swings, and
        the wings beat. `flap` is -1..1: the front pair up and the hind pair
        down at 1.
        """
        return {
            "root@loc": at("root", (0, 0, 0.012 * bob)),
            "body": t("body", (X, -4 + 2 * bob), (Y, 3 * sway)),
            "head": t("head", (X, 4), (Z, 6 * sway)),
            "tail": t("tail", (X, 4 + 3 * bob), (Z, 4 * sway)),
            "tail.2": t("tail.2", (X, 4 + 3 * bob), (Z, 6 * sway)),
            "tail.3": t("tail.3", (X, 6 + 4 * bob), (Z, 8 * sway)),
            **wings(10 + 32 * flap, 10 - 32 * flap, 0),
            **vines(-0.3 * bob, sway),
        }

    def droop(flap=0.0, bob=0.0):
        """Low HP: it hangs lower and tilts, the tail drops, and the wings beat weakly."""
        return pose(
            hover(0, bob, 0),
            root_at_loc=at("root", (0, 0, -0.05 + 0.01 * bob)),
            body=t("body", (X, 10 + 3 * bob), (Y, -14)),
            head=t("head", (X, 14), (Y, -8)),
            tail=t("tail", (X, -12)),
            tail__2=t("tail.2", (X, -14)),
            tail__3=t("tail.3", (X, -16)),
            **wings(-4 + 16 * flap, 2 - 14 * flap, 8),
            **vines(1.2, 0.5),
        )

    def dart(flap=0.0, bob=0.0, sway=0.0):
        """The walk: a fast dart, nose down, the tail out straight and the wings a blur."""
        return pose(
            hover(flap, bob, sway),
            root_at_loc=at("root", (0, 0, 0.015 * bob)),
            body=t("body", (X, 12), (Y, 6 * sway)),
            head=t("head", (X, -6)),
            tail=t("tail", (X, -8)),
            tail__2=t("tail.2", (X, -4)),
            tail__3=t("tail.3", (X, -2)),
            **wings(6 + 38 * flap, 6 - 38 * flap, 10),
            **vines(1.0, sway * 0.6),
        )

    # The attack (melee): it rears up and back, then dives at the enemy with
    # the lance and swings back up.
    def rear(base):
        return pose(
            base,
            root_at_loc=at("root", (0, 0.06, 0.05)),
            body=t("body", (X, -26)),
            head=t("head", (X, -6)),
            tail=t("tail", (X, 14)),
            tail__2=t("tail.2", (X, 16)),
            tail__3=t("tail.3", (X, 18)),
            **wings(60, 50, -6),
            **vines(-0.4),
        )

    def dive(base, depth=1.0):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.24 * depth, -0.1 * depth)),
            body=t("body", (X, 34 * depth)),
            head=t("head", (X, 6)),
            tail=t("tail", (X, -14)),
            tail__2=t("tail.2", (X, -8)),
            tail__3=t("tail.3", (X, -6)),
            **wings(-10, -20, 34),
            **vines(1.2 * depth),
        )

    def knocked(base, amount=1.0):
        """The hit knocks it back and up, and the wings jolt."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.06 * amount, 0.03 * amount)),
            body=t("body", (X, -20 * amount), (Y, 12 * amount)),
            head=t("head", (X, -14 * amount)),
            tail=t("tail", (X, 18 * amount)),
            tail__2=t("tail.2", (X, 14 * amount)),
            **wings(50 * amount, -20 * amount, -10 * amount),
            **vines(-0.6 * amount, -amount),
        )

    def falling(base):
        return pose(
            base,
            root_at_loc=at("root", (0, 0.02, -0.18)),
            body=t("body", (X, 26), (Y, 30)),
            tail=t("tail", (X, -20)),
            tail__2=t("tail.2", (X, -16)),
            **wings(30, 40, 30),
            **vines(1.6, 1),
        )

    def fallen(base, bounce=0.0):
        """On its left side on the ground, the wings folded back."""
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.5, 0, 0.05)),
            body=t("body", (X, 0)),
            head=t("head", (X, 10)),
            tail=t("tail", (X, -6), (Z, 6)),
            tail__2=t("tail.2", (X, -6), (Z, 8)),
            tail__3=t("tail.3", (X, -4)),
            **wings(20, 20, 70),
            **vines(2.4, 1.5),
        )

    def folded(base):
        """The wings up and closed over the back, as a summon starts."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, -0.06)),
            body=t("body", (X, -10)),
            tail=t("tail", (X, -10)),
            tail__2=t("tail.2", (X, -12)),
            **wings(84, 84, 16),
            **vines(1.4),
        )

    clips = []
    # Eight beats in the idle loop: a beat is 6 frames.
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 3):
        a = frame / 48 * 2 * math.pi
        idle.key(frame, hover(1 if (frame // 3) % 2 == 0 else -1, math.sin(a), math.sin(a * 2) * 0.6))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame in range(0, 49, 4):
        a = frame / 48 * 2 * math.pi
        low.key(frame, droop(1 if (frame // 4) % 2 == 0 else -1, math.sin(a)))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    for frame in range(0, 25, 2):
        a = frame / 24 * 2 * math.pi
        walk.key(frame, dart(1 if (frame // 2) % 2 == 0 else -1, math.sin(a * 2), math.sin(a)))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, hover(1)).key(3, rear(hover())).key(5, rear(hover(-1)))
    attack.key(8, dive(hover())).key(11, dive(hover(), 0.9)).key(14, pose(hover(1), **wings(50, -10, 0)))
    attack.key(18, hover(-1)).key(21, hover(1)).key(24, hover(-1)).key(27, hover(1)).key(30, hover(1))
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, hover(1)).key(3, knocked(hover())).key(6, knocked(hover(-1), 0.6)).key(9, knocked(hover(1), 0.3))
    hurt.key(12, hover(-1)).key(16, hover(1))
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, hover(1)).key(4, knocked(hover())).key(8, knocked(hover(-1), 0.6)).key(14, falling(hover()))
    death.key(24, fallen(hover())).key(28, fallen(hover(), 8)).key(36, fallen(hover()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, folded(hover())).key(9, folded(hover())).key(13, pose(hover(1), **wings(-20, -10, -10)))
    for frame in (15, 18, 21):
        summon.key(frame, hover(-1 if frame % 2 else 1))
    summon.key(24, hover(1))
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "amberwing-dart.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
