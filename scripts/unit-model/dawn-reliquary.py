"""
Dawn Reliquary (`human.dawnReliquary`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a large roadside shrine of pale
stone, with oak double doors under a stone arch, thick steel bands with gold
studs, a gold sun disc over the doors, a small gable roof with a gold finial,
candles with wax drips and blue prayer cloths with gold suns. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/dawn-reliquary.glb`; then
`bun unit-model:pack dawn-reliquary` packs it for the game.

It is a Wall, not a figure. The camera sees the side of a Unit, so the shrine
turns its front 45 degrees to the camera side, and the camera sees the doors
and the sun. The sun turns slowly at rest. With Low HP, gold light shows in
the cracks. The death is its Last Breath: the doors burst open in a flash of
gold light, the pillars lean apart and the roof slides off. One candle stays
upright.
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

from unit_model_kit import Z, Clip, Part, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

STONE = hex_color("#cdbb9c")
STONE_LIGHT = hex_color("#ddd0b4")
STONE_DARK = hex_color("#a08e72")
WOOD = hex_color("#9a6a3c")
WOOD_LIGHT = hex_color("#b07c48")
WOOD_DARK = hex_color("#5e3f22")
STEEL = hex_color("#6e7074")
STEEL_LIGHT = hex_color("#9a9da2")
GOLD = hex_color("#e0b04a")
GOLD_DARK = hex_color("#a87a2c")
BLUE = hex_color("#2d4890")
BLUE_DARK = hex_color("#1d2f60")
CANDLE = hex_color("#f0e6cc")
FLAME = hex_color("#ffc23a")
GLOW = hex_color("#ffd866")
LIGHT = hex_color("#fff0b8")
MOSS = hex_color("#6f8a3c")

# --- Proportions ---------------------------------------------------------------

# The front of the shrine faces 45 degrees to the camera side (-X). `u` goes
# across the front, `d` goes back from it, `z` up.
TURN = math.radians(45)
FRONT = Vector((-math.sin(TURN), -math.cos(TURN), 0))
ACROSS = Z.cross(FRONT).normalized()
CENTER = Vector((0, 0.02, 0))


def p(u, d, z):
    """A point of the shrine: `u` across, `d` back, `z` up."""
    return CENTER + ACROSS * u - FRONT * d + Z * z


def block(bm, u, d, z, half_u, half_d, half_z):
    return kit.slab(bm, p(u, d, z), ACROSS * half_u, FRONT * half_d, Z * half_z)


PLINTH_TOP = 0.06
PILLAR_U = 0.215
PILLAR_HALF_U = 0.06
PILLAR_HALF_D = 0.1
PILLAR_TOP = 0.62
DOOR_HALF = 0.155
DOOR_FRONT = -0.06
DOOR_THICK = 0.03
DOOR_SPRING = 0.46
ARCH_RISE = 0.12
SUN_C = (0, -0.15, 0.71)
SUN_R = 0.085


def arch_z(u):
    """The top of the doors: a round arch."""
    t = min(abs(u) / DOOR_HALF, 1.0)
    return DOOR_SPRING + ARCH_RISE * math.sqrt(1 - t * t)


BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("base", (0, 0, 0.02), (0, 0, 0.14), "root"),
    ("pillar.A", tuple(p(-PILLAR_U, 0, PLINTH_TOP)), tuple(p(-PILLAR_U, 0, PILLAR_TOP)), "base"),
    ("pillar.B", tuple(p(PILLAR_U, 0, PLINTH_TOP)), tuple(p(PILLAR_U, 0, PILLAR_TOP)), "base"),
    # The doors turn on hinges at the pillars.
    ("door.A", tuple(p(-DOOR_HALF, DOOR_FRONT + DOOR_THICK / 2, PLINTH_TOP)), tuple(p(-DOOR_HALF, DOOR_FRONT + DOOR_THICK / 2, 0.3)), "base"),
    ("door.B", tuple(p(DOOR_HALF, DOOR_FRONT + DOOR_THICK / 2, PLINTH_TOP)), tuple(p(DOOR_HALF, DOOR_FRONT + DOOR_THICK / 2, 0.3)), "base"),
    # The roof turns on the back edge of the pillar tops.
    ("top", tuple(p(0, PILLAR_HALF_D, PILLAR_TOP)), tuple(p(0, PILLAR_HALF_D, PILLAR_TOP + 0.1)), "base"),
    ("sun", tuple(p(*SUN_C)), tuple(p(*SUN_C) + FRONT * 0.06), "top"),
    ("cloth.A", tuple(p(-PILLAR_U, -0.11, 0.63)), tuple(p(-PILLAR_U, -0.11, 0.3)), "top"),
    ("cloth.B", tuple(p(PILLAR_U, -0.11, 0.63)), tuple(p(PILLAR_U, -0.11, 0.3)), "top"),
    # The gold light in the cracks (Low HP) and the burst of the Last Breath.
    # Each one hides at scale 0, in a point on the doors.
    ("cracks", tuple(p(0, DOOR_FRONT - 0.004, 0.3)), tuple(p(0, DOOR_FRONT - 0.004, 0.4)), "base"),
    ("light", tuple(p(0, DOOR_FRONT - 0.02, 0.3)), tuple(p(0, DOOR_FRONT - 0.02, 0.4)), "base"),
    ("candle.last", tuple(p(0.1, -0.2, PLINTH_TOP - 0.02)), tuple(p(0.1, -0.2, 0.16)), "root"),
]

# --- Parts ---------------------------------------------------------------------


def stone_color(index):
    return (STONE, STONE_LIGHT, STONE_DARK)[index % 3]


def plinth_parts():
    plinth = Part("plinth", STONE, "base", smooth=False, shade=0.1)
    for index, (u, half) in enumerate(((-0.2, 0.11), (0.0, 0.1), (0.2, 0.11))):
        stone = block(plinth.bm, u, 0, PLINTH_TOP / 2, half, 0.17, PLINTH_TOP / 2)
        plinth.paint(faces_of(stone), stone_color(index))
    # A step in front of the doors, and loose stones and moss at its foot.
    step = block(plinth.bm, 0, -0.2, 0.018, 0.16, 0.04, 0.018)
    plinth.paint(faces_of(step), STONE_DARK)
    for u, d, size in ((-0.3, -0.12, 0.025), (0.31, -0.06, 0.02), (-0.26, 0.16, 0.022)):
        rock = kit.sphere(plinth.bm, p(u, d, size * 0.6), (size, size * 0.9, size * 0.7), 6, 4)
        plinth.paint(faces_of(rock), STONE_DARK)
    for u, d in ((-0.28, -0.17), (0.3, -0.16), (0.12, -0.22)):
        tuft = kit.sphere(plinth.bm, p(u, d, 0.012), (0.03, 0.022, 0.014), 6, 3)
        plinth.paint(faces_of(tuft), MOSS)
    return [plinth]


def pillar_part(name, sign):
    """A pillar of rough blocks with two thick steel bands and a candle on top."""
    u0 = PILLAR_U * sign
    pillar = Part(f"pillar.{name}", STONE, f"pillar.{name}", smooth=False, shade=0.12)
    rows = 5
    height = (PILLAR_TOP - PLINTH_TOP) / rows
    for row in range(rows):
        z = PLINTH_TOP + height * (row + 0.5)
        shift = 0.008 * ((row % 2) * 2 - 1)
        stone = block(pillar.bm, u0 + shift, 0, z, PILLAR_HALF_U, PILLAR_HALF_D, height / 2 - 0.003)
        pillar.paint(faces_of(stone), stone_color(row + (1 if sign > 0 else 0)))
    # The steel bands (Bulwark), with gold studs on the front.
    for z in (0.2, 0.47):
        band = block(pillar.bm, u0, 0, z, PILLAR_HALF_U + 0.012, PILLAR_HALF_D + 0.012, 0.022)
        pillar.paint(faces_of(band), STEEL)
        for du in (-0.035, 0.035):
            stud = kit.sphere(pillar.bm, p(u0 + du, -PILLAR_HALF_D - 0.014, z), (0.01, 0.008, 0.01), 5, 3)
            pillar.paint(faces_of(stud), GOLD)
    # The capital, and a candle with drips of wax down the front.
    cap = block(pillar.bm, u0, 0, PILLAR_TOP + 0.012, PILLAR_HALF_U + 0.014, PILLAR_HALF_D + 0.014, 0.012)
    pillar.paint(faces_of(cap), STONE_DARK)
    for du, tall in ((-0.02, 0.07), (0.025, 0.045)):
        base = p(u0 + du, -0.06, PILLAR_TOP + 0.024)
        wax = kit.cone(pillar.bm, base, base + Z * tall, 0.013, 0.012, 6)
        pillar.paint(faces_of(wax), CANDLE)
        flame = kit.cone(pillar.bm, base + Z * tall, base + Z * (tall + 0.03), 0.008, 0.001, 5)
        pillar.paint(faces_of(flame), FLAME)
    for du, length in ((-0.03, 0.09), (0.01, 0.05), (0.04, 0.12)):
        drip = kit.cone(pillar.bm, p(u0 + du, -PILLAR_HALF_D - 0.012, PILLAR_TOP + 0.02), p(u0 + du, -PILLAR_HALF_D - 0.012, PILLAR_TOP - length), 0.008, 0.004, 4)
        pillar.paint(faces_of(drip), CANDLE)
    return pillar


def door_part(name, sign):
    """One oak door leaf, from the middle to its hinge. `sign` is the side of the hinge."""
    door = Part(f"door.{name}", WOOD, f"door.{name}", smooth=False, shade=0.12)
    columns, rows = 3, 6

    def grid(d):
        result = []
        for row in range(rows + 1):
            line = []
            for column in range(columns + 1):
                u = sign * DOOR_HALF * column / columns
                z = lerp(PLINTH_TOP, arch_z(u) - 0.004, row / rows)
                line.append(p(u - sign * 0.002, d, z))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if face_side == "back":
            return WOOD_DARK
        return WOOD_LIGHT if column % 2 else WOOD

    edges = panel(door, grid(DOOR_FRONT), grid(DOOR_FRONT + DOOR_THICK), color_of)
    door.paint(edges, WOOD_DARK)
    # Three steel bands with gold studs, and a ring pull.
    for z in (0.14, 0.3, 0.45):
        u_mid = sign * DOOR_HALF / 2
        band = block(door.bm, u_mid, DOOR_FRONT - 0.006, z, DOOR_HALF / 2 - 0.006, 0.006, 0.016)
        door.paint(faces_of(band), STEEL)
        for du in (0.3, 0.7):
            stud = kit.sphere(door.bm, p(sign * DOOR_HALF * du, DOOR_FRONT - 0.014, z), (0.008, 0.006, 0.008), 5, 3)
            door.paint(faces_of(stud), GOLD)
    # A diamond plate at the middle of each leaf.
    plate = kit.slab(door.bm, p(sign * DOOR_HALF * 0.5, DOOR_FRONT - 0.01, 0.37), (ACROSS + Z) * 0.02, FRONT * 0.004, (Z - ACROSS) * 0.02)
    door.paint(faces_of(plate), STEEL_LIGHT)
    ring = kit.torus(door.bm, p(sign * 0.03, DOOR_FRONT - 0.014, 0.26), FRONT, 0.016, 0.004, 8, 3)
    door.paint(faces_of(ring), GOLD)
    return door


def top_parts():
    top = Part("top", STONE, "top", smooth=False, shade=0.1)
    # The stone arch over the doors: wedge blocks along the curve.
    steps = 7
    for index in range(steps):
        a0 = math.pi * index / steps
        a1 = math.pi * (index + 1) / steps
        mid = (a0 + a1) / 2
        u = -math.cos(mid) * (DOOR_HALF + 0.03)
        z = DOOR_SPRING + math.sin(mid) * (ARCH_RISE + 0.03)
        out = ACROSS * -math.cos(mid) + Z * math.sin(mid)
        along = ACROSS * math.sin(mid) + Z * math.cos(mid)
        stone = kit.slab(top.bm, p(u, -0.07, z), along * 0.03, FRONT * 0.04, out * 0.028)
        top.paint(faces_of(stone), stone_color(index))
    # The lintel across the pillars, and the gable roof.
    lintel = block(top.bm, 0, 0, PILLAR_TOP + 0.05, 0.3, 0.13, 0.04)
    top.paint(faces_of(lintel), STONE_LIGHT)
    for sign in (1, -1):
        roof = kit.slab(top.bm, p(0.15 * sign, 0, PILLAR_TOP + 0.13), ACROSS * 0.16 * sign + Z * -0.06, FRONT * 0.15, (Z + ACROSS * 0.375 * sign).normalized() * 0.014)
        top.paint(faces_of(roof), STONE_DARK)
    gable = kit.slab(top.bm, p(0, -0.06, PILLAR_TOP + 0.13), ACROSS * 0.12, FRONT * 0.07, Z * 0.05)
    top.paint(faces_of(gable), STONE)
    ridge = kit.cone(top.bm, p(0, -0.14, PILLAR_TOP + 0.19), p(0, 0.14, PILLAR_TOP + 0.19), 0.012, 0.012, 5)
    top.paint(faces_of(ridge), GOLD)
    # The finial: a gold spike with a small sun.
    finial = kit.cone(top.bm, p(0, -0.06, PILLAR_TOP + 0.19), p(0, -0.06, PILLAR_TOP + 0.3), 0.018, 0.002, 6)
    top.paint(faces_of(finial), GOLD)
    knob = kit.sphere(top.bm, p(0, -0.06, PILLAR_TOP + 0.24), (0.022, 0.022, 0.022), 8, 5)
    top.paint(faces_of(knob), GOLD)
    return [top]


def sun_parts():
    """The gold sun disc: a raised boss, a rim and twelve rays."""
    sun = Part("sun", GOLD, "sun", shade=0.04)
    center = p(*SUN_C)
    kit.cone(sun.bm, center + FRONT * 0.002, center - FRONT * 0.022, SUN_R * 0.7, SUN_R * 0.7, 14)
    boss = kit.sphere(sun.bm, center - FRONT * 0.022, (SUN_R * 0.42, SUN_R * 0.42, SUN_R * 0.42), 10, 6)
    sun.paint(faces_of(boss), GOLD_DARK)
    rim = kit.torus(sun.bm, center - FRONT * 0.012, FRONT, SUN_R * 0.72, 0.008, 16, 4)
    sun.paint(faces_of(rim), GOLD_DARK)
    for index in range(12):
        a = 2 * math.pi * index / 12
        out = ACROSS * math.cos(a) + Z * math.sin(a)
        length = SUN_R * (1.5 if index % 2 else 1.25)
        kit.cone(sun.bm, center + out * SUN_R * 0.6 - FRONT * 0.01, center + out * length - FRONT * 0.01, 0.016, 0.001, 4, squash=1.0)
    return [sun]


def cloth_part(name, u, top_z, bottom_z, half, d):
    """A blue prayer cloth with a gold sun and a gold fringe."""
    cloth = Part(f"cloth.{name}", BLUE, f"cloth.{name}", smooth=True, shade=0.12)
    rows, columns = 5, 3

    def grid(depth):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                h = lerp(-1, 1, column / columns)
                # A point at the foot, as on a pennant.
                drop = 0.04 * (1 - abs(h)) * v
                ripple = 0.006 * math.sin(h * 3 + v * 4)
                line.append(p(u + h * half, d + depth + ripple, lerp(top_z, bottom_z - drop, v)))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if row == rows - 1:
            return GOLD
        return BLUE if face_side == "front" else BLUE_DARK

    panel(cloth, grid(-0.003), grid(0.003), color_of)
    mark = p(u, d - 0.008, lerp(top_z, bottom_z, 0.45))
    disc = kit.cone(cloth.bm, mark, mark - FRONT * 0.004, half * 0.4, half * 0.4, 8)
    cloth.paint(faces_of(disc), GOLD)
    rod = kit.cone(cloth.bm, p(u - half - 0.01, d, top_z), p(u + half + 0.01, d, top_z), 0.006, 0.006, 5)
    cloth.paint(faces_of(rod), GOLD_DARK)
    return cloth


def candle_parts():
    """Candles on the step. One of them stays upright in the death."""
    candles = Part("candles", CANDLE, "base", shade=0.06)
    for u, d, tall in ((-0.12, -0.21, 0.06), (-0.05, -0.23, 0.035), (0.17, -0.2, 0.045)):
        base = p(u, d, 0.036)
        kit.cone(candles.bm, base, base + Z * tall, 0.012, 0.011, 6)
        flame = kit.cone(candles.bm, base + Z * tall, base + Z * (tall + 0.028), 0.008, 0.001, 5)
        candles.paint(faces_of(flame), FLAME)
    last = Part("candle.last", CANDLE, "candle.last", shade=0.06)
    base = p(0.1, -0.2, 0.036)
    kit.cone(last.bm, base, base + Z * 0.08, 0.014, 0.013, 6)
    flame = kit.cone(last.bm, base + Z * 0.08, base + Z * 0.115, 0.01, 0.001, 5)
    last.paint(faces_of(flame), FLAME)
    drip = kit.cone(last.bm, base + Z * 0.08 - FRONT * 0.012, base + Z * 0.03 - FRONT * 0.014, 0.005, 0.003, 4)
    last.paint(faces_of(drip), CANDLE)
    return [candles, last]


def glow_parts():
    """The gold cracks on the doors and the burst of light of the Last Breath."""
    cracks = Part("cracks", GLOW, "cracks", shade=0)
    d = DOOR_FRONT - 0.006
    # A jagged crack down the join of the doors, and branches across them.
    kit.tube(cracks.bm, [p(0.004, d, 0.07), p(-0.012, d, 0.16), p(0.01, d, 0.26), p(-0.008, d, 0.36), p(0.006, d, 0.5)], [0.006, 0.008, 0.008, 0.007, 0.004], 4)
    for points in (
        [p(-0.01, d, 0.2), p(-0.05, d, 0.24), p(-0.08, d, 0.22), p(-0.12, d, 0.27)],
        [p(0.01, d, 0.3), p(0.05, d, 0.28), p(0.09, d, 0.34), p(0.12, d, 0.32)],
        [p(-0.008, d, 0.4), p(-0.04, d, 0.44), p(-0.07, d, 0.43)],
    ):
        kit.tube(cracks.bm, points, [0.006, 0.005, 0.004, 0.003][: len(points)], 4)

    light = Part("light", LIGHT, "light", shade=0)
    center = p(0, DOOR_FRONT - 0.02, 0.3)
    core = kit.sphere(light.bm, center, (0.1, 0.1, 0.1), 10, 6)
    light.paint(faces_of(core), GLOW)
    for index in range(10):
        a = 2 * math.pi * (index + 0.5) / 10
        out = (ACROSS * math.cos(a) + Z * math.sin(a) + FRONT * 0.5).normalized()
        length = 0.32 if index % 2 else 0.22
        kit.cone(light.bm, center + out * 0.06, center + out * length, 0.03, 0.001, 4)
    return [cracks, light]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("DawnReliquary", BONES)
    parts = (
        plinth_parts()
        + [pillar_part("A", -1), pillar_part("B", 1), door_part("A", -1), door_part("B", 1)]
        + top_parts()
        + sun_parts()
        + [
            cloth_part("A", -PILLAR_U, 0.63, 0.3, 0.045, -0.115),
            cloth_part("B", PILLAR_U, 0.63, 0.3, 0.045, -0.115),
        ]
        + candle_parts()
        + glow_parts()
    )
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "DawnReliquaryMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def pose(base, changes):
        result = dict(base)
        result.update(changes)
        return result

    def rest(sway=0.0, sun=0.0):
        """The shrine stands. The cloths move a little and the sun turns slowly."""
        return {
            "sun": t("sun", (FRONT, sun)),
            "cloth.A": t("cloth.A", (ACROSS, 3 * sway), (FRONT, 2 * sway)),
            "cloth.B": t("cloth.B", (ACROSS, -3 * sway), (FRONT, 2 * sway)),
            "cracks@scale": 0.0,
            "light@scale": 0.0,
        }

    def cracked(pulse=0.0):
        """Low HP: the shrine sags, the doors spring a little and gold light shows in the cracks."""
        return pose(
            rest(),
            {
                "base": t("base", (ACROSS, -2), (FRONT, 2)),
                "pillar.A": t("pillar.A", (FRONT, -3)),
                "pillar.B": t("pillar.B", (FRONT, 2)),
                "door.A": t("door.A", (Z, 6)),
                "door.B": t("door.B", (Z, -4)),
                "top": t("top", (ACROSS, -4), (FRONT, 2)),
                "sun": t("sun", (FRONT, 14)),
                "cloth.A": t("cloth.A", (ACROSS, 8)),
                "cloth.B": t("cloth.B", (FRONT, -10)),
                "cracks@scale": 1.0 + 0.12 * pulse,
            },
        )

    def jolt(base, amount=1.0, forward=False):
        """A blow shakes the shrine: the doors knock, the cloths swing."""
        direction = -1 if forward else 1
        return pose(
            base,
            {
                "base@loc": at("base", -FRONT * (0.02 * amount * direction) + Z * (0.01 * amount)),
                "base": t("base", (ACROSS, -4 * amount * direction)),
                "door.A": t("door.A", (Z, 5 * amount)),
                "door.B": t("door.B", (Z, -5 * amount)),
                "top": t("top", (ACROSS, -5 * amount * direction)),
                "sun": t("sun", (FRONT, 10 * amount)),
                "cloth.A": t("cloth.A", (ACROSS, 18 * amount * direction)),
                "cloth.B": t("cloth.B", (ACROSS, 18 * amount * direction)),
            },
        )

    def burst(base, light=1.0, open_=1.0):
        """The Last Breath: the doors burst open, and gold light pours out."""
        return pose(
            base,
            {
                "base@loc": at("base", Z * 0.01),
                "door.A": t("door.A", (Z, 100 * open_)),
                "door.B": t("door.B", (Z, -100 * open_)),
                "pillar.A": t("pillar.A", (FRONT, -6 * open_)),
                "pillar.B": t("pillar.B", (FRONT, 6 * open_)),
                "top": t("top", (ACROSS, -10 * open_)),
                "sun": t("sun", (FRONT, 40)),
                "sun@scale": 1.0 + 0.2 * light,
                "cloth.A": t("cloth.A", (ACROSS, 50 * open_)),
                "cloth.B": t("cloth.B", (ACROSS, 50 * open_)),
                "cracks@scale": 1.0,
                "light@scale": 1.3 * light,
            },
        )

    def ruin(base, bounce=0.0, rise=0.0):
        """
        The shrine is broken: the pillars lean apart, the roof lies behind
        them, the doors hang open and the cloths are down. `rise` (0 to 1)
        builds it again, for a Rebirth.
        """
        fall = 1 - rise
        return pose(
            base,
            {
                "base": t("base", (FRONT, 3 * fall)),
                "door.A": t("door.A", (Z, 110 * fall), (FRONT, -10 * fall)),
                "door.B": t("door.B", (Z, -95 * fall), (ACROSS, 8 * fall)),
                "pillar.A": t("pillar.A", (FRONT, -(22 - bounce) * fall)),
                "pillar.B": t("pillar.B", (FRONT, (16 - bounce) * fall), (ACROSS, -6 * fall)),
                "top@loc": at("top", (FRONT * -0.16 + Z * -0.5) * fall),
                "top": t("top", (ACROSS, -(70 - bounce) * fall)),
                "sun": t("sun", (FRONT, 60 * fall)),
                "cloth.A": t("cloth.A", (ACROSS, 30 * fall)),
                "cloth.B": t("cloth.B", (ACROSS, 30 * fall)),
                "cracks@scale": 1.0 * fall,
                "light@scale": 0.0,
            },
        )

    def heave(lift, tilt):
        """A Wall does not walk: it hops on, a little at a time."""
        return pose(
            rest(),
            {
                "base@loc": at("base", Z * (0.035 * lift)),
                "base": t("base", (ACROSS, 4 * tilt), (FRONT, 3 * tilt)),
                "door.A": t("door.A", (Z, 3 * lift)),
                "door.B": t("door.B", (Z, -3 * lift)),
                "cloth.A": t("cloth.A", (ACROSS, -12 * lift), (FRONT, 8 * tilt)),
                "cloth.B": t("cloth.B", (ACROSS, -12 * lift), (FRONT, 8 * tilt)),
                "candle.last": t("candle.last", (FRONT, 6 * tilt)),
            },
        )

    clips = []
    # The sun turns one ray (30 degrees) in each loop. The keys before and
    # after the loop keep its speed even at the join.
    idle = Clip("idle", 48, loop=True)
    for frame, sway in ((-12, -1), (0, 0), (12, 1), (24, 0), (36, -1), (48, 0), (60, 1)):
        idle.key(frame, rest(sway, 30 * frame / 48))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, pulse in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, cracked(pulse))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, heave(0, 0)).key(6, heave(1, 1)).key(12, heave(0, 0)).key(18, heave(1, -1)).key(24, heave(0, 0))
    clips.append(walk)

    # It has no Attack, but each Unit Model has an attack clip: the sun
    # flares and the shrine lurches forward at 50% of the attack.
    flare = pose(jolt(rest(), 0.8, forward=True), {"sun@scale": 1.3, "sun": t("sun", (FRONT, 30))})
    attack = Clip("attack", 30)
    attack.key(0, rest()).key(10, jolt(rest(), -0.3, forward=True)).key(15, flare).key(19, flare)
    attack.key(26, rest()).key(30, rest())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt(rest())).key(8, jolt(rest(), 0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(4, jolt(rest())).key(9, pose(jolt(rest(), 0.6), {"cracks@scale": 1.0}))
    death.key(13, burst(rest(), 1.0, 1.0)).key(18, burst(rest(), 0.8, 1.1)).key(24, pose(ruin(rest()), {"light@scale": 0.4}))
    death.key(30, ruin(rest(), 6)).key(36, ruin(rest()))
    clips.append(death)

    # Rebirth: the shrine falls (45% of the event, `REBORN_FALL`), then it
    # builds itself again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt(rest())).key(10, burst(rest(), 1.0, 1.0)).key(20, ruin(rest())).key(24, ruin(rest(), 4))
    rebirth.key(32, ruin(rest(), 0, 0.5)).key(40, jolt(rest(), 0.6)).key(48, rest())
    clips.append(rebirth)

    # The summon: the shrine grows up out of the ground, with a flash.
    summon = Clip("summon", 24)
    summon.key(0, pose(rest(), {"base@scale": 0.05}))
    summon.key(12, pose(rest(0, 20), {"base@scale": 1.08, "light@scale": 0.5}))
    summon.key(18, pose(rest(0, 30), {"base@scale": 0.97}))
    summon.key(24, rest(0, 30))
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "dawn-reliquary.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
