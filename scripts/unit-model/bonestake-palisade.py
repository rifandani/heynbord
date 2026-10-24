"""
Bonestake Palisade (`orc.bonestakePalisade`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a rough palisade of sharpened
stakes made by orcs, on a patch of dusty red ground. Bundles of stakes with
rope lashings, iron bands and rough iron spikes lean forward to the enemy.
Hide panels with red and white marks hang between them, and a horned bone
totem stands in the middle, above the stakes. The orcs keep their lunch on
the stakes: strings of sausages hang from two tips. Run it in Blender (see
`unit_model_kit.py`). It writes
`apps/web/art/units/raw/bonestake-palisade.glb`; then
`bun unit-model:pack bonestake-palisade` packs it for the game.

It is a Wall, not a figure. The bundles stand on an arc round the front, as
the shields of Bone Rampart do, so the Battle camera, which sees the side of
a Unit, sees the curve of the palisade and not only its edge. Each bundle
has a bone at its foot: it rattles, leans out with Low HP and falls in the
death clip. The death is its Last Breath: the stakes fall forward onto the
enemy in front, and the totem falls back. It has no Attack, but it has the
`attack` clip: the palisade lurches forward and the stakes jab. Its walk is
a hop. The Rebirth and the summon put the stakes up again, the middle first,
and then the totem.
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

from unit_model_kit import X, Y, Z, Clip, Part, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

WOOD = hex_color("#7a5434")
WOOD_DARK = hex_color("#523620")
WOOD_TIP = hex_color("#c8a274")
ROPE = hex_color("#b09468")
IRON = hex_color("#5a5450")
IRON_DARK = hex_color("#3a3532")
HIDE = hex_color("#b0402c")
HIDE_DARK = hex_color("#7a2a1e")
PAINT = hex_color("#ece0c4")
BONE = hex_color("#eee4c8")
BONE_DARK = hex_color("#b4a684")
SOCKET = hex_color("#2a1c16")
HORN = hex_color("#d8c8a4")
HORN_DARK = hex_color("#8a7a5c")
RAG = hex_color("#a8301f")
SAUSAGE = hex_color("#a84a2e")
SAUSAGE_DARK = hex_color("#7a3020")
STRING = hex_color("#d8c8a0")
DIRT = hex_color("#b0603a")
DIRT_DARK = hex_color("#8a4428")
ROCK = hex_color("#9a5a3c")

# --- Proportions ---------------------------------------------------------------

# The bundles of stakes stand on an arc round the front of the Square.
ARC_Y = 0.07
STAKE_RADIUS = 0.27
BUNDLE_ANGLES = [math.radians(a) for a in (-76, -38, 0, 38, 76)]
# Each bundle: the side offset, the height and the lean of each of its stakes.
BUNDLE_STAKES = [
    ((-0.045, 0.5, 4), (0.0, 0.6, 0), (0.045, 0.46, -6)),
    ((-0.045, 0.56, 3), (0.0, 0.66, -2), (0.045, 0.52, 5)),
    ((-0.05, 0.6, 4), (0.0, 0.7, 0), (0.05, 0.58, -4)),
    ((-0.045, 0.54, 5), (0.0, 0.64, 1), (0.045, 0.5, -3)),
    ((-0.045, 0.46, 6), (0.0, 0.56, -2), (0.045, 0.44, -5)),
]
# The stakes lean forward, out from the arc.
STAKE_LEAN = math.radians(16)
STAKE_R = 0.024
# The hide panels hang between these pairs of bundles. Each is a grid of rows and columns.
HIDE_PAIRS = [(0, 1), (3, 4)]
HIDE_ROWS, HIDE_COLUMNS = 4, 4
# The bundles with a string of sausages on a tip, and the stake that holds it.
SAUSAGE_STAKES = [(1, 1), (3, 1)]
TOTEM_FOOT = Vector((0, ARC_Y + 0.05, 0))
TOTEM_TOP = TOTEM_FOOT + Z * 0.8
# The totem turns its skull to the camera side.
TOTEM_TURN = math.radians(-35)


def arc_point(angle, radius):
    return Vector((radius * math.sin(angle), -radius * math.cos(angle) + ARC_Y, 0))


def outward(angle):
    return Vector((math.sin(angle), -math.cos(angle), 0))


def along(angle):
    """The direction along the arc, to the left of the palisade."""
    return Z.cross(outward(angle)).normalized()


def stake_line(bundle, index):
    """The foot and the tip of one stake."""
    angle = BUNDLE_ANGLES[bundle]
    side, height, tilt = BUNDLE_STAKES[bundle][index]
    foot = arc_point(angle, STAKE_RADIUS) + along(angle) * side
    lean = outward(angle) * math.sin(STAKE_LEAN) + along(angle) * math.sin(math.radians(tilt))
    direction = (Z * math.cos(STAKE_LEAN) + lean).normalized()
    return foot, foot + direction * height


BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("base", (0, 0, 0.02), (0, 0, 0.14), "root"),
]
for bundle, angle in enumerate(BUNDLE_ANGLES):
    foot = arc_point(angle, STAKE_RADIUS)
    BONES.append((f"stakes.{bundle}", tuple(foot), tuple(foot + Z * 0.15), "base"))
for index, (a, b) in enumerate(HIDE_PAIRS):
    top = (stake_line(a, 1)[0].lerp(stake_line(a, 1)[1], 0.75) + stake_line(b, 1)[0].lerp(stake_line(b, 1)[1], 0.75)) / 2
    BONES.append((f"hide.{index}", tuple(top), tuple(top - Z * 0.15), "base"))
for index, (bundle, stake) in enumerate(SAUSAGE_STAKES):
    tip = stake_line(bundle, stake)[1]
    BONES.append((f"sausage.{index}", tuple(tip - Z * 0.03), tuple(tip - Z * 0.15), f"stakes.{bundle}"))
BONES += [
    ("totem", tuple(TOTEM_FOOT), tuple(TOTEM_FOOT + Z * 0.2), "base"),
    ("skull", tuple(TOTEM_TOP - Z * 0.04), tuple(TOTEM_TOP + Z * 0.1), "totem"),
]

# --- Parts ---------------------------------------------------------------------


def stake(part, foot, tip, radius, tone):
    """A rough log with a sharpened, pale tip."""
    direction = (tip - foot).normalized()
    neck = tip - direction * 0.08
    verts = kit.cone(part.bm, foot - Z * 0.02, neck, radius, radius * 0.9, 7)
    part.paint(faces_of(verts), tone)
    point = kit.cone(part.bm, neck, tip, radius * 0.9, 0.002, 7)
    part.paint(faces_of(point), WOOD_TIP)


def bundle_parts():
    parts = []
    for bundle, angle in enumerate(BUNDLE_ANGLES):
        part = Part(f"stakes.{bundle}", WOOD, f"stakes.{bundle}", smooth=False, shade=0.16)
        lines = [stake_line(bundle, k) for k in range(3)]
        for k, (foot, tip) in enumerate(lines):
            stake(part, foot, tip, STAKE_R * (1.1 if k == 1 else 0.9), WOOD if (k + bundle) % 2 else WOOD_DARK)
        # Rope lashings round the bundle, low and high.
        for t in (0.25, 0.6):
            middle = sum((foot.lerp(tip, t) for foot, tip in lines), Vector()) / 3
            rope = kit.torus(part.bm, middle, (lines[1][1] - lines[1][0]).normalized(), 0.058, 0.008, 12, 4)
            part.paint(faces_of(rope), ROPE)
        # An iron band on the middle stake, and rough iron spikes out to the front.
        foot, tip = lines[1]
        band = kit.torus(part.bm, foot.lerp(tip, 0.45), (tip - foot).normalized(), STAKE_R * 1.15, 0.007, 8, 3)
        part.paint(faces_of(band), IRON)
        n = outward(angle)
        for k, t in enumerate((0.38, 0.52)):
            base = lines[k * 2][0].lerp(lines[k * 2][1], t) + n * 0.018
            spike = kit.cone(part.bm, base, base + (n + Z * 0.15).normalized() * 0.07, 0.014, 0.001, 4)
            part.paint(faces_of(spike), IRON_DARK)
        # Bones tied to some bundles.
        if bundle in (0, 2, 4):
            spot = foot.lerp(tip, 0.7) + n * 0.03
            skull = kit.sphere(part.bm, spot, (0.026, 0.022, 0.028), 6, 5)
            part.paint(faces_of(skull), BONE)
            for sign in (1, -1):
                eye = kit.sphere(part.bm, spot + n * 0.02 + along(angle) * 0.009 * sign + Z * 0.004, (0.006, 0.004, 0.006), 4, 3)
                part.paint(faces_of(eye), SOCKET)
        parts.append(part)
    return parts


def hide_parts():
    parts = []
    for index, (a, b) in enumerate(HIDE_PAIRS):
        part = Part(f"hide.{index}", HIDE, f"hide.{index}", shade=0.1)
        top_a = stake_line(a, 1)[0].lerp(stake_line(a, 1)[1], 0.75)
        top_b = stake_line(b, 1)[0].lerp(stake_line(b, 1)[1], 0.75)
        angle = (BUNDLE_ANGLES[a] + BUNDLE_ANGLES[b]) / 2
        n = outward(angle)
        def grid(depth, top_a=top_a, top_b=top_b, n=n):
            result = []
            for r in range(HIDE_ROWS + 1):
                v = r / HIDE_ROWS
                row = []
                for c in range(HIDE_COLUMNS + 1):
                    h = c / HIDE_COLUMNS
                    ragged = 0.04 * v * ((c * 7) % 3) / 2
                    sag = 0.03 * math.sin(math.pi * h)
                    row.append(top_a.lerp(top_b, h) + n * (0.035 + depth + 0.01 * v) - Z * (0.3 * v + sag - ragged))
                result.append(row)
            return result

        def color_of(face_side, row, column):
            if face_side == "back":
                return HIDE_DARK
            # A white tribal mark: a horned shape in the middle.
            if (row == 1 and column in (0, 3)) or (row in (1, 2) and column in (1, 2)):
                return PAINT
            return HIDE_DARK if row == HIDE_ROWS - 1 else HIDE

        edges = panel(part, grid(0.004), grid(-0.004), color_of)
        part.paint(edges, HIDE_DARK)
        # The rope that ties the hide to the two bundles.
        rope = kit.tube(part.bm, [top_a + n * 0.03, top_a.lerp(top_b, 0.5) + n * 0.045 - Z * 0.02, top_b + n * 0.03], [0.007] * 3, 4)
        part.paint(faces_of(rope), ROPE)
        parts.append(part)
    return parts


def sausage_parts():
    """Strings of sausages that hang from two tips: the orcs keep their lunch there."""
    parts = []
    for index, (bundle, stake_index) in enumerate(SAUSAGE_STAKES):
        part = Part(f"sausage.{index}", SAUSAGE, f"sausage.{index}", shade=0.12)
        tip = stake_line(bundle, stake_index)[1] - Z * 0.04
        n = outward(BUNDLE_ANGLES[bundle])
        knot = kit.torus(part.bm, tip, Z, 0.022, 0.005, 8, 3)
        part.paint(faces_of(knot), STRING)
        point = tip + n * 0.01
        for k in range(3):
            top = point - Z * (0.012 + 0.064 * k)
            link = kit.cone(part.bm, top, top - Z * 0.012, 0.003, 0.003, 4)
            part.paint(faces_of(link), STRING)
            sausage = kit.sphere(part.bm, top - Z * 0.036 + n * 0.004 * k, (0.021, 0.021, 0.03), 6, 5)
            part.paint(faces_of(sausage), SAUSAGE if k % 2 == 0 else SAUSAGE_DARK)
        parts.append(part)
    return parts


def totem_parts():
    """The horned bone totem: a thick pole, a crossbar with bone charms, and a bull skull with horns and red rags."""
    totem = Part("totem", WOOD_DARK, "totem", smooth=False, shade=0.16)
    kit.cone(totem.bm, TOTEM_FOOT - Z * 0.02, TOTEM_TOP, 0.04, 0.032, 8)
    for z in (0.2, 0.42, 0.6):
        rope = kit.torus(totem.bm, TOTEM_FOOT + Z * z, Z, 0.04, 0.008, 10, 3)
        totem.paint(faces_of(rope), ROPE)
    bar_z = TOTEM_TOP.z - 0.16
    bar = kit.cone(totem.bm, Vector((-0.15, TOTEM_FOOT.y, bar_z)), Vector((0.15, TOTEM_FOOT.y, bar_z + 0.02)), 0.016, 0.014, 6)
    totem.paint(faces_of(bar), WOOD)
    for k, x in enumerate((-0.13, -0.07, 0.07, 0.13)):
        string = kit.cone(totem.bm, Vector((x, TOTEM_FOOT.y - 0.01, bar_z)), Vector((x, TOTEM_FOOT.y - 0.01, bar_z - 0.06)), 0.003, 0.003, 4)
        totem.paint(faces_of(string), STRING)
        charm = kit.cone(totem.bm, Vector((x, TOTEM_FOOT.y - 0.012, bar_z - 0.05)), Vector((x, TOTEM_FOOT.y - 0.016, bar_z - 0.1 - 0.01 * (k % 2))), 0.011, 0.001, 4)
        totem.paint(faces_of(charm), BONE if k % 2 else BONE_DARK)

    skull = Part("skull", BONE, "skull", shade=0.12)
    c = TOTEM_TOP + Z * 0.02
    front = Vector((0, -1, 0))
    kit.sphere(skull.bm, c, (0.07, 0.06, 0.07), 10, 7)
    # The long snout, down and to the front.
    kit.cone(skull.bm, c + front * 0.02 - Z * 0.01, c + front * 0.09 - Z * 0.08, 0.05, 0.03, 8)
    for sign in (1, -1):
        socket = kit.sphere(skull.bm, c + front * 0.05 + X * 0.03 * sign + Z * 0.01, (0.018, 0.012, 0.016), 6, 4)
        skull.paint(faces_of(socket), SOCKET)
        nostril = kit.sphere(skull.bm, c + front * 0.105 + X * 0.012 * sign - Z * 0.08, (0.007, 0.005, 0.007), 4, 3)
        skull.paint(faces_of(nostril), SOCKET)
        # A big horn that curves out and up.
        horn = kit.tube(
            skull.bm,
            [c + X * 0.05 * sign + Z * 0.03, c + X * 0.13 * sign + Z * 0.04 + front * 0.02, c + X * 0.19 * sign + Z * 0.1 + front * 0.03, c + X * 0.2 * sign + Z * 0.18],
            [0.03, 0.022, 0.014, 0.002],
            7,
        )
        skull.paint(faces_of(horn), HORN)
        tip = kit.torus(skull.bm, c + X * 0.13 * sign + Z * 0.04 + front * 0.02, X, 0.024, 0.005, 8, 3)
        skull.paint(faces_of(tip), HORN_DARK)
        # A red rag tied to each horn.
        rag = kit.cone(skull.bm, c + X * 0.16 * sign + Z * 0.06, c + X * 0.17 * sign - Z * 0.08 + front * 0.01, 0.024, 0.008, 4, squash=0.25)
        skull.paint(faces_of(rag), RAG)
    teeth = kit.slab(skull.bm, c + front * 0.1 - Z * 0.1, (0.022, 0, 0), (0, 0.004, 0), (0, 0, 0.008))
    skull.paint(faces_of(teeth), BONE_DARK)
    for part in (totem, skull):
        kit.bmesh.ops.rotate(part.bm, cent=TOTEM_FOOT, matrix=Matrix.Rotation(TOTEM_TURN, 3, "Z"), verts=list(part.bm.verts))
    return [totem, skull]


def ground_parts():
    """A patch of dusty red ground with a few rocks, under the palisade."""
    part = Part("ground", DIRT, "base", smooth=False, shade=0.06)
    verts = kit.cone(part.bm, (0, 0.03, 0.0), (0, 0.03, 0.02), 0.42, 0.4, 14, squash=0.85)
    for f in faces_of(verts):
        if f.normal.z < 0.9:
            part.paint([f], DIRT_DARK)
    for x, y, r in ((0.22, -0.3, 0.04), (-0.16, -0.33, 0.032), (0.32, -0.08, 0.03), (-0.33, -0.14, 0.04), (0.26, 0.22, 0.034), (-0.24, 0.24, 0.03)):
        rock = kit.sphere(part.bm, (x, y, 0.024), (r, r * 0.85, r * 0.6), 6, 4)
        part.paint(faces_of(rock), ROCK)
    return [part]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BonestakePalisade", BONES)
    parts = ground_parts() + bundle_parts() + hide_parts() + sausage_parts() + totem_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BonestakePalisadeMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def lean(bone, angle, degrees, side=0.0):
        """A piece leans out (positive) or in, and turns a little along the arc."""
        n = outward(angle)
        return t(bone, (Z.cross(n), degrees), (n, side))

    def pose(base, changes):
        result = dict(base)
        result.update(changes)
        return result

    def bundles(degrees, side=0.0, lift=0.0):
        """Each bundle leans by its own amount: `degrees`, `side` and `lift` are a value or a list."""
        result = {}
        for k, angle in enumerate(BUNDLE_ANGLES):
            d = degrees[k] if isinstance(degrees, (list, tuple)) else degrees
            s = side[k] if isinstance(side, (list, tuple)) else side
            h = lift[k] if isinstance(lift, (list, tuple)) else lift
            result[f"stakes.{k}"] = lean(f"stakes.{k}", angle, d, s)
            result[f"stakes.{k}@loc"] = at(f"stakes.{k}", Z * h)
        return result

    def rest(sway=0.0, rattle=0.0):
        """The palisade stands. The hides stir, the sausages swing and the skull nods."""
        result = bundles([1.2 * rattle * (1 if k % 2 else -1) for k in range(5)])
        result.update(
            {
                "hide.0": lean("hide.0", sum(BUNDLE_ANGLES[:2]) / 2, 6 + 6 * sway, 3 * sway),
                "hide.1": lean("hide.1", sum(BUNDLE_ANGLES[3:]) / 2, 6 - 6 * sway, -3 * sway),
                "sausage.0": t("sausage.0", (X, 8 * sway), (Y, 6 * sway)),
                "sausage.1": t("sausage.1", (X, -8 * sway), (Y, -6 * sway)),
                "totem": t("totem", (X, 1.0 * rattle)),
                "skull": t("skull", (X, 4 * sway), (Z, 3 * rattle)),
            }
        )
        return result

    def battered(breath=0.0):
        """Low HP: the stakes lean out at odd angles, one hide hangs from one end, the totem tilts and a sausage is gone."""
        return pose(
            rest(),
            {
                **bundles([18 + breath * 2, 6, -4, 22, 10], [-8, 4, 0, 6, -4], [0.02, 0.0, 0.0, 0.025, 0.01]),
                "hide.0": lean("hide.0", sum(BUNDLE_ANGLES[:2]) / 2, -10, 30),
                "hide.1": lean("hide.1", sum(BUNDLE_ANGLES[3:]) / 2, 16),
                "sausage.0@loc": at("sausage.0", (0, 0, -0.04)),
                "sausage.0": t("sausage.0", (X, 30)),
                "sausage.1@scale": 0.01,
                "totem": t("totem", (X, -10 - breath * 2), (Y, 8)),
                "skull": t("skull", (X, 14), (Z, -10)),
            },
        )

    def jolt(base, amount=1.0, forward=False):
        """A blow shakes the palisade: the stakes knock and the sausages jump."""
        direction = -1 if forward else 1
        return pose(
            base,
            {
                "base@loc": at("base", (0, 0.02 * amount * direction, 0.014 * amount)),
                "base": t("base", (X, -4 * amount * direction)),
                **bundles([(-6 if k % 2 else 5) * amount * direction for k in range(5)], [3 * amount * (1 if k % 2 else -1) for k in range(5)]),
                "hide.0": lean("hide.0", sum(BUNDLE_ANGLES[:2]) / 2, 24 * amount),
                "hide.1": lean("hide.1", sum(BUNDLE_ANGLES[3:]) / 2, 24 * amount),
                "sausage.0": t("sausage.0", (X, -30 * amount)),
                "sausage.1": t("sausage.1", (X, -30 * amount)),
                "totem": t("totem", (X, 4 * amount * direction)),
                "skull": t("skull", (X, -14 * amount), (Z, 8 * amount)),
            },
        )

    def topple(degrees, side, lift):
        """
        The bundles fall forward (round X), to the enemy in front, each by
        its own amount. Each hide falls with the two bundles that hold it: its
        top turns round their feet, and the hide turns with them.
        """
        result = {}
        for k in range(5):
            result[f"stakes.{k}"] = t(f"stakes.{k}", (X, degrees[k]), (Y, side[k]))
            result[f"stakes.{k}@loc"] = at(f"stakes.{k}", Z * lift[k])
        for index, (a, b) in enumerate(HIDE_PAIRS):
            name = f"hide.{index}"
            fall = (degrees[a] + degrees[b]) / 2
            foot = (arc_point(BUNDLE_ANGLES[a], STAKE_RADIUS) + arc_point(BUNDLE_ANGLES[b], STAKE_RADIUS)) / 2
            top = rig.data.bones[name].head_local
            moved = foot + Matrix.Rotation(math.radians(fall), 3, "X") @ (top - foot)
            result[name] = t(name, (X, fall * 1.1 + 6))
            result[f"{name}@loc"] = at(name, moved - top + Z * (lift[a] + lift[b]) / 2)
        return result

    def fallen(base, bounce=0.0, rise=0.0):
        """
        The Last Breath: the stakes fall forward onto the enemy, the hides
        fall with them and the totem falls back. A piece that lies down turns
        round its foot, so it is lifted by its thickness. `rise` (0 to 1) puts
        it up again: the middle stakes first, then the sides, then the totem.
        """

        def up(start, end):
            return max(0.0, min(1.0, (rise - start) / (end - start)))

        order = [up(0.3, 0.6), up(0.15, 0.45), up(0.0, 0.3), up(0.15, 0.45), up(0.3, 0.6)]
        totem = up(0.6, 1.0)
        return pose(
            base,
            {
                **topple(
                    [lerp(70 - bounce * (1 if k % 2 else 0.5), 0, order[k]) for k in range(5)],
                    [lerp((-12, 6, 0, -6, 12)[k], 0, order[k]) for k in range(5)],
                    [0.035 * (1 - order[k]) for k in range(5)],
                ),
                "sausage.0": t("sausage.0", (X, lerp(-10, 0, order[1]))),
                "sausage.1": t("sausage.1", (X, lerp(-10, 0, order[3]))),
                "totem@loc": at("totem", Vector((0, 0, 0.035)) * (1 - totem)),
                "totem": t("totem", (X, lerp(-80 + bounce * 0.5, 0, totem)), (Y, lerp(10, 0, totem))),
                "skull": t("skull", (X, lerp(-20, 0, totem)), (Z, lerp(30, 0, totem))),
            },
        )

    def falling(base):
        """Part way into the death: the stakes tip forward, and the totem rocks."""
        return pose(
            base,
            {
                **topple([30, 38, 42, 36, 28], [-4, 2, 0, -2, 4], [0.015] * 5),
                "sausage.0": t("sausage.0", (X, -30)),
                "sausage.1": t("sausage.1", (X, -30)),
                "totem": t("totem", (X, -24)),
                "skull": t("skull", (X, -10), (Z, 14)),
            },
        )

    def hop(lift, tilt):
        """A walk pose: the whole palisade hops and rocks, and the loose pieces lag."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, 0.035 * lift)),
                "base": t("base", (X, 4 * tilt), (Y, 3 * tilt)),
                **bundles([3 * tilt * (1 if k % 2 else -1) for k in range(5)]),
                "hide.0": lean("hide.0", sum(BUNDLE_ANGLES[:2]) / 2, 6 - 16 * lift),
                "hide.1": lean("hide.1", sum(BUNDLE_ANGLES[3:]) / 2, 6 - 16 * lift),
                "sausage.0": t("sausage.0", (X, 20 * lift * tilt)),
                "sausage.1": t("sausage.1", (X, -20 * lift * tilt)),
                "totem": t("totem", (X, -3 * tilt)),
                "skull": t("skull", (X, 10 * lift)),
            },
        )

    # The attack: the palisade rocks back, then lurches forward and the
    # stakes jab. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the lurch lands at frame 15 of 30.
    def rock_back(base):
        return pose(
            base,
            {
                "base@loc": at("base", (0, 0.03, 0.01)),
                "base": t("base", (X, -5)),
                **bundles(-8),
                "hide.0": lean("hide.0", sum(BUNDLE_ANGLES[:2]) / 2, 16),
                "hide.1": lean("hide.1", sum(BUNDLE_ANGLES[3:]) / 2, 16),
                "totem": t("totem", (X, 5)),
            },
        )

    def lurch(base):
        return pose(
            jolt(base, 0.6, forward=True),
            {
                "base@loc": at("base", (0, -0.06, 0.04)),
                "base": t("base", (X, 6)),
                **bundles(16, 0.0, 0.02),
                "hide.0": lean("hide.0", sum(BUNDLE_ANGLES[:2]) / 2, -18),
                "hide.1": lean("hide.1", sum(BUNDLE_ANGLES[3:]) / 2, -18),
                "totem": t("totem", (X, -8)),
                "skull": t("skull", (X, 20)),
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, sway, rattle in ((0, 0, 0), (12, 1, 1), (24, 0, 0), (36, -1, 1), (48, 0, 0)):
        idle.key(frame, rest(sway, rattle))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, battered(breath))
    clips.append(low)

    # A Wall does not walk, but it can hop on.
    walk = Clip("walk", 24, loop=True)
    walk.key(0, hop(0, 0)).key(6, hop(1, 1)).key(12, hop(0, 0)).key(18, hop(1, -1)).key(24, hop(0, 0))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, rest()).key(10, rock_back(rest())).key(15, lurch(rest())).key(19, lurch(rest()))
    attack.key(26, rest()).key(30, rest())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt(rest())).key(8, jolt(rest(), 0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(4, jolt(rest())).key(14, falling(rest()))
    death.key(24, fallen(rest())).key(29, fallen(rest(), 6)).key(36, fallen(rest()))
    clips.append(death)

    # Rebirth: the palisade falls (45% of the event, `REBORN_FALL`), then the
    # orcs put it up again: the middle stakes first, then the totem.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest())).key(20, fallen(rest())).key(24, fallen(rest(), 3))
    rebirth.key(30, fallen(rest(), 0, 0.35)).key(36, fallen(rest(), 0, 0.75)).key(41, jolt(rest(), 0.5)).key(48, rest())
    clips.append(rebirth)

    # The summon: the stakes go up one by one, and the totem last.
    summon = Clip("summon", 24)
    summon.key(0, fallen(rest())).key(6, fallen(rest(), 0, 0.35)).key(12, fallen(rest(), 0, 0.8)).key(16, jolt(rest(), 0.6)).key(24, rest())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "bonestake-palisade.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
