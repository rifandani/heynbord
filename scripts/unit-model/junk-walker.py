"""
Junk Walker (`goblin.junkWalker`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a goblin walking machine made
from a round boiler of riveted iron with thick brass plates, a brass shield
with a chevron on the front, two pipe legs with big iron feet, a big claw
arm, a tall tank of green glowing fluid and a chimney at the back, brass
gauges, and an open seat on top. The driver, a pale goblin woman with wild
white hair, goggles and a red scarf, sits in the seat with a lever in each
hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/junk-walker.glb`; then
`bun unit-model:pack junk-walker` packs it for the game.

The walker is a machine, not a figure: the `body` bone carries the boiler,
and each pipe leg reaches its foot with IK, so the feet stay on the ground
when the boiler bobs. The claw arm is on the right side, the camera side.
The `steam` bone puffs steam from the chimney, the `leak` bone a jet of steam
from a broken joint (Low HP and a hit), and the `plate` bone swings a loose
plate. The death tips it on its right side, as the carts fall. It has no
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

from unit_model_kit import X, Y, Z, Clip, Part, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BOILER = hex_color("#6e5646")
BOILER_DARK = hex_color("#4a3a30")
RUST = hex_color("#8a5a34")
BRASS = hex_color("#d2a046")
BRASS_DARK = hex_color("#93692a")
IRON = hex_color("#5a5650")
IRON_DARK = hex_color("#3a3733")
GLOW = hex_color("#a8ff3e")
GLOW_DARK = hex_color("#5fae22")
RED = hex_color("#b0362c")
RED_DARK = hex_color("#7a221c")
SKIN = hex_color("#b0aca2")
EAR = hex_color("#d89a92")
HAIR = hex_color("#eeece6")
EYES = hex_color("#f2c040")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a2a26")
TEETH = hex_color("#efe6cc")
LENS = hex_color("#2c3a46")
JACKET = hex_color("#6a4228")
GAUGE = hex_color("#f2ead6")
STEAM = hex_color("#e8e4dc")

# --- Proportions ---------------------------------------------------------------

BOILER_C = Vector((0, 0.0, 0.5))
BOILER_R = Vector((0.2, 0.19, 0.17))
LEG_X = 0.13
HIP_Z = 0.38
KNEE = Vector((0, -0.075, 0.21))
ANKLE_Z = 0.065
TOP_Z = 0.64

# The claw arm on the right side (-X), the camera side.
SHOULDER = Vector((-0.205, -0.03, 0.5))
ELBOW = Vector((-0.28, -0.15, 0.42))
WRIST = Vector((-0.28, -0.31, 0.4))
JAW_TOP = WRIST + Vector((0, -0.13, 0.04))
JAW_LOW = WRIST + Vector((0, -0.13, -0.05))

CHIMNEY = Vector((-0.085, 0.17, 0.0))
CHIMNEY_TOP = 0.9
TANK = Vector((0.075, 0.175, 0.0))
LEAK = Vector((-0.17, 0.08, 0.4))
PLATE_TOP = Vector((-0.185, 0.1, 0.62))

# The driver sits in the open seat, turned a little to her right.
DRIVER = Vector((0, 0.06, 0.62))
DRIVER_SIZE = 1.3
DRIVER_YAW = -12

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("body", (0, 0, 0.4), (0, 0, 0.6), "root"),
    # The poles that the knees point to: to the front.
    ("pole.L", (LEG_X, -0.5, 0.21), (LEG_X, -0.5, 0.26), "body"),
    ("pole.R", (-LEG_X, -0.5, 0.21), (-LEG_X, -0.5, 0.26), "body"),
    ("arm.upper", tuple(SHOULDER), tuple(ELBOW), "body"),
    ("arm.fore", tuple(ELBOW), tuple(WRIST), "arm.upper"),
    ("claw.top", tuple(WRIST), tuple(JAW_TOP), "arm.fore"),
    ("claw.low", tuple(WRIST), tuple(JAW_LOW), "arm.fore"),
    ("steam", tuple(CHIMNEY + Vector((0, 0, CHIMNEY_TOP))), tuple(CHIMNEY + Vector((0, 0, CHIMNEY_TOP + 0.06))), "body"),
    ("leak", tuple(LEAK), tuple(LEAK + Vector((-0.06, 0, 0))), "body"),
    ("plate", tuple(PLATE_TOP), tuple(PLATE_TOP + Vector((-0.01, 0, -0.14))), "body"),
]
for side, sign in (("L", 1), ("R", -1)):
    hip = Vector((LEG_X * sign, 0, HIP_Z))
    knee = Vector((LEG_X * sign, KNEE.y, KNEE.z))
    ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
    BONES += [
        (f"thigh.{side}", tuple(hip), tuple(knee), "body"),
        (f"shin.{side}", tuple(knee), tuple(ankle), f"thigh.{side}"),
        # The foot is not a child of the shin: it stays on the ground, and the shin reaches it with IK.
        (f"foot.{side}", tuple(ankle), tuple(ankle + Vector((0, -0.1, 0))), "root"),
        (f"lever.{side}", (0.075 * sign, -0.03, 0.6), (0.077 * sign, -0.02, 0.69), "body"),
    ]
_d_neck = DRIVER + Vector((0, 0, 0.11 * DRIVER_SIZE))
BONES += [
    ("driver.body", tuple(DRIVER), tuple(_d_neck), "body"),
    ("driver.head", tuple(_d_neck), tuple(_d_neck + Vector((0, 0, 0.1 * DRIVER_SIZE))), "driver.body"),
]
for side, sign in (("L", 1), ("R", -1)):
    shoulder = DRIVER + Vector((0.05 * sign * DRIVER_SIZE, 0, 0.095 * DRIVER_SIZE))
    BONES.append((f"driver.arm.{side}", tuple(shoulder), tuple(shoulder + Vector((0.02 * sign, -0.03, -0.07))), "driver.body"))

# --- Parts ---------------------------------------------------------------------


def rivet(part, center, radius=0.008, color=BRASS):
    verts = kit.sphere(part.bm, center, (radius, radius, radius), 4, 3)
    part.paint(faces_of(verts), color)


def on_boiler(x_angle, z):
    """A point on the boiler surface: `x_angle` in degrees round from the front (0) to the left (90)."""
    a = math.radians(x_angle)
    h = (z - BOILER_C.z) / BOILER_R.z
    ring = math.sqrt(max(0.0, 1 - h * h))
    return Vector((BOILER_R.x * ring * math.sin(a), -BOILER_R.y * ring * math.cos(a), z))


def boiler_parts():
    parts = []
    boiler = Part("boiler", BOILER, "body", shade=0.16)
    shell = kit.sphere(boiler.bm, BOILER_C, BOILER_R, 16, 10)
    for face in faces_of(shell):
        c = face.calc_center_median()
        # Patches of rust and darker plates, and an open top for the seat.
        a = math.degrees(math.atan2(c.x, -c.y)) % 360
        if c.z > TOP_Z - 0.02:
            boiler.paint([face], IRON_DARK)
        elif int(a // 45) % 2 and c.z < BOILER_C.z:
            boiler.paint([face], BOILER_DARK)
        elif 200 < a < 240 and c.z > BOILER_C.z:
            boiler.paint([face], RUST)
    # The brass band round the middle, and the rim of the open seat.
    band = kit.torus(boiler.bm, BOILER_C + Vector((0, 0, 0.02)), (0, 0, 1), 0.198, 0.014, 20, 4)
    boiler.paint(faces_of(band), BRASS)
    rim = kit.torus(boiler.bm, (0, 0.0, TOP_Z), (0, 0, 1), 0.12, 0.016, 16, 4)
    boiler.paint(faces_of(rim), BRASS)
    seat = kit.cone(boiler.bm, (0, 0.04, TOP_Z - 0.06), (0, 0.04, TOP_Z - 0.01), 0.1, 0.11, 12)
    boiler.paint(faces_of(seat), IRON_DARK)
    for index in range(16):
        a = 360 * index / 16 + 11
        rivet(boiler, on_boiler(a, BOILER_C.z + 0.045), 0.009, BRASS_DARK)
    # Thick bolted plates on the sides (Bulwark 2).
    for sign in (1, -1):
        for z0, z1 in ((0.42, 0.5), (0.52, 0.6)):
            center = on_boiler(90 * sign, (z0 + z1) / 2) * 1.04
            plate = kit.slab(boiler.bm, center, (0.014 * sign, 0, 0), (0, 0.085, 0), (0, 0, (z1 - z0) / 2 - 0.004))
            boiler.paint(faces_of(plate), BRASS if z0 > 0.5 else IRON)
            for dy in (-0.07, 0.07):
                rivet(boiler, center + Vector((0.016 * sign, dy, 0)), 0.007, IRON_DARK)
    # The brass shield with a chevron on the front.
    front = on_boiler(0, 0.47)
    shield = kit.slab(boiler.bm, front + Vector((0, -0.006, 0)), (0.075, 0, 0), (0, 0.012, 0), (0, 0, 0.07))
    boiler.paint(faces_of(shield), BRASS)
    point = kit.cone(boiler.bm, front + Vector((0, -0.006, -0.07)), front + Vector((0, -0.006, -0.11)), 0.06, 0.004, 4, squash=0.2)
    boiler.paint(faces_of(point), BRASS)
    for sign in (1, -1):
        bar = kit.slab(boiler.bm, front + Vector((0.026 * sign, -0.02, -0.005)), (0.032, 0, -0.028 * sign), (0, 0.004, 0), (0.008 * sign, 0, 0.01))
        boiler.paint(faces_of(bar), RED_DARK)
    for x, z in ((-0.06, 0.53), (0.06, 0.53), (0, 0.4)):
        rivet(boiler, front + Vector((x, -0.02, z - 0.47)), 0.008, BRASS_DARK)
    # Brass gauges on the front of the rim.
    for x in (-0.07, 0.07):
        c = Vector((x, -0.13, TOP_Z - 0.005))
        out = Vector((0, -0.6, 0.8))
        case = kit.cone(boiler.bm, c, c + out * 0.022, 0.03, 0.03, 10)
        boiler.paint(faces_of(case), BRASS)
        dial = kit.cone(boiler.bm, c + out * 0.022, c + out * 0.025, 0.024, 0.024, 10)
        boiler.paint(faces_of(dial), GAUGE)
        needle = kit.cone(boiler.bm, c + out * 0.026, c + out * 0.026 + Vector((0.014 * (1 if x > 0 else -1), 0, 0.008)), 0.003, 0.001, 3)
        boiler.paint(faces_of(needle), RED)
    # The hips: iron drums where the legs join.
    for sign in (1, -1):
        drum = kit.cone(boiler.bm, (LEG_X * sign * 0.6, 0, HIP_Z), (LEG_X * sign * 1.3, 0, HIP_Z), 0.05, 0.05, 10)
        boiler.paint(faces_of(drum), IRON_DARK)
        cap = kit.cone(boiler.bm, (LEG_X * sign * 1.3, 0, HIP_Z), (LEG_X * sign * 1.36, 0, HIP_Z), 0.04, 0.03, 10)
        boiler.paint(faces_of(cap), BRASS)
    parts.append(boiler)

    back = Part("back", IRON, "body", shade=0.1)
    # The tall tank of green glowing fluid, in a brass cage.
    kit.cone(back.bm, TANK + Vector((0, 0, 0.42)), TANK + Vector((0, 0, 0.8)), 0.06, 0.06, 10)
    for face in list(back.bm.faces):
        back.paint([face], GLOW)
    for z in (0.42, 0.55, 0.68, 0.8):
        ring = kit.cone(back.bm, TANK + Vector((0, 0, z - 0.012)), TANK + Vector((0, 0, z + 0.012)), 0.068, 0.068, 10)
        back.paint(faces_of(ring), BRASS)
    for index in range(4):
        a = 2 * math.pi * index / 4 + 0.4
        bar = kit.cone(back.bm, TANK + Vector((math.cos(a) * 0.064, math.sin(a) * 0.064, 0.42)), TANK + Vector((math.cos(a) * 0.064, math.sin(a) * 0.064, 0.8)), 0.006, 0.006, 4)
        back.paint(faces_of(bar), BRASS_DARK)
    glow = kit.cone(back.bm, TANK + Vector((0.02, -0.055, 0.46)), TANK + Vector((0.02, -0.058, 0.76)), 0.012, 0.012, 4)
    back.paint(faces_of(glow), GLOW_DARK)
    cap = kit.cone(back.bm, TANK + Vector((0, 0, 0.81)), TANK + Vector((0, 0, 0.84)), 0.05, 0.02, 10)
    back.paint(faces_of(cap), BRASS_DARK)
    # The chimney.
    kit.cone(back.bm, CHIMNEY + Vector((0, 0, 0.5)), CHIMNEY + Vector((0, 0, CHIMNEY_TOP - 0.03)), 0.03, 0.034, 8)
    top = kit.cone(back.bm, CHIMNEY + Vector((0, 0, CHIMNEY_TOP - 0.03)), CHIMNEY + Vector((0, 0, CHIMNEY_TOP)), 0.048, 0.044, 8)
    back.paint(faces_of(top), BRASS)
    for z in (0.62, 0.76):
        ring = kit.torus(back.bm, CHIMNEY + Vector((0, 0, z)), (0, 0, 1), 0.034, 0.006, 8, 3)
        back.paint(faces_of(ring), BRASS_DARK)
    # Pipes that bend from the tank into the boiler.
    pipe = kit.tube(back.bm, [TANK + Vector((0.05, -0.02, 0.7)), TANK + Vector((0.11, -0.06, 0.66)), Vector((0.19, -0.02, 0.56))], [0.014, 0.014, 0.014], 6)
    back.paint(faces_of(pipe), BRASS)
    pipe = kit.tube(back.bm, [TANK + Vector((0.02, 0.05, 0.45)), TANK + Vector((0.02, 0.09, 0.38)), Vector((0.05, 0.16, 0.36))], [0.012] * 3, 6)
    back.paint(faces_of(pipe), BRASS_DARK)
    valve = kit.cone(back.bm, TANK + Vector((0.11, -0.06, 0.66)), TANK + Vector((0.11, -0.06, 0.7)), 0.02, 0.02, 6)
    back.paint(faces_of(valve), RED)
    parts.append(back)

    # The loose plate on the right, behind the claw: it swings with Low HP.
    plate = Part("plate", BRASS_DARK, "plate", shade=0.08)
    kit.slab(plate.bm, PLATE_TOP + Vector((-0.012, 0, -0.07)), (0.008, 0, 0), (0, 0.06, 0), (0, 0, 0.07))
    for dz in (-0.02, -0.12):
        rivet(plate, PLATE_TOP + Vector((-0.022, 0.04, dz)), 0.006, IRON_DARK)
    parts.append(plate)

    # The levers in front of the seat.
    for side, sign in (("L", 1), ("R", -1)):
        lever = Part(f"lever.{side}", IRON_DARK, f"lever.{side}", shade=0.04)
        kit.cone(lever.bm, (0.075 * sign, -0.03, 0.6), (0.077 * sign, -0.02, 0.69), 0.006, 0.006, 4)
        knob = kit.sphere(lever.bm, (0.077 * sign, -0.02, 0.695), (0.014, 0.014, 0.014), 6, 4)
        lever.paint(faces_of(knob), RED if sign < 0 else BRASS)
        parts.append(lever)
    return parts


def steam_parts():
    parts = []
    steam = Part("steam", STEAM, "steam", shade=0.08)
    top = CHIMNEY + Vector((0, 0, CHIMNEY_TOP))
    for offset, radius in (((0, 0, 0.02), 0.026), ((0.012, 0.01, 0.04), 0.022), ((-0.01, 0.006, 0.05), 0.018)):
        kit.sphere(steam.bm, top + Vector(offset), (radius, radius, radius * 0.9), 6, 4)
    parts.append(steam)

    # The jet of steam from the broken joint: small inside the boiler at rest.
    leak = Part("leak", STEAM, "leak", shade=0.05)
    for along, radius in ((0.0, 0.012), (0.016, 0.014), (0.032, 0.016)):
        kit.sphere(leak.bm, LEAK + Vector((-along, 0, along * 0.3)), (radius, radius, radius), 6, 4)
    parts.append(leak)
    return parts


def leg_parts():
    parts = []
    for side, sign in (("L", 1), ("R", -1)):
        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, KNEE.y, KNEE.z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", BRASS, f"thigh.{side}", shade=0.08)
        kit.cone(thigh.bm, hip, knee, 0.034, 0.03, 10)
        for t in (0.25, 0.7):
            ring = kit.torus(thigh.bm, hip.lerp(knee, t), knee - hip, 0.036, 0.007, 10, 3)
            thigh.paint(faces_of(ring), IRON_DARK)
        parts.append(thigh)

        shin = Part(f"shin.{side}", IRON, f"shin.{side}", shade=0.08)
        joint = kit.cone(shin.bm, knee + Vector((0.05 * sign, 0, 0)), knee - Vector((0.05 * sign, 0, 0)), 0.042, 0.042, 10)
        shin.paint(faces_of(joint), IRON_DARK)
        hub = kit.cone(shin.bm, knee + Vector((0.05 * sign, 0, 0)), knee + Vector((0.058 * sign, 0, 0)), 0.03, 0.022, 10)
        shin.paint(faces_of(hub), BRASS)
        pipe = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.02)), 0.036, 0.04, 10)
        shin.paint(faces_of(pipe), BRASS_DARK)
        for t in (0.35, 0.75):
            ring = kit.torus(shin.bm, knee.lerp(ankle, t), ankle - knee, 0.042, 0.008, 10, 3)
            shin.paint(faces_of(ring), IRON_DARK)
        # A piston behind the shin.
        piston = kit.cone(shin.bm, knee + Vector((0, 0.04, -0.01)), ankle + Vector((0, 0.04, 0.05)), 0.01, 0.01, 6)
        shin.paint(faces_of(piston), IRON_DARK)
        parts.append(shin)

        foot = Part(f"foot.{side}", IRON, f"foot.{side}", shade=0.1)
        kit.sphere(foot.bm, ankle, (0.04, 0.04, 0.035), 8, 6)
        sole = kit.box(foot.bm, (LEG_X * sign, -0.02, 0.025), (0.12, 0.17, 0.05))
        foot.paint(faces_of(sole), IRON_DARK)
        cap = kit.box(foot.bm, (LEG_X * sign, -0.03, 0.054), (0.1, 0.12, 0.012))
        foot.paint(faces_of(cap), BRASS_DARK)
        for dx in (-0.035, 0.0, 0.035):
            toe = kit.cone(foot.bm, (LEG_X * sign + dx, -0.1, 0.025), (LEG_X * sign + dx * 1.2, -0.14, 0.01), 0.018, 0.004, 4)
            foot.paint(faces_of(toe), IRON)
        for dx in (-0.045, 0.045):
            rivet(foot, Vector((LEG_X * sign + dx, -0.1, 0.05)), 0.007, BRASS)
        parts.append(foot)
    return parts


def claw_parts():
    parts = []
    shoulder = Part("arm.upper", BRASS, "arm.upper", shade=0.08)
    ball = kit.sphere(shoulder.bm, SHOULDER, (0.055, 0.055, 0.055), 10, 6)
    shoulder.paint(faces_of(ball), IRON_DARK)
    kit.cone(shoulder.bm, SHOULDER, ELBOW, 0.036, 0.03, 8)
    for t in (0.45, 0.8):
        ring = kit.torus(shoulder.bm, SHOULDER.lerp(ELBOW, t), ELBOW - SHOULDER, 0.036, 0.007, 8, 3)
        shoulder.paint(faces_of(ring), IRON_DARK)
    # A gear on the shoulder, on the camera side.
    gear = kit.cone(shoulder.bm, SHOULDER - Vector((0.045, 0, 0)), SHOULDER - Vector((0.065, 0, 0)), 0.045, 0.045, 10)
    shoulder.paint(faces_of(gear), BRASS)
    for index in range(8):
        a = 2 * math.pi * index / 8
        tooth = kit.box(shoulder.bm, SHOULDER - Vector((0.055, 0, 0)) + Vector((0, math.cos(a), math.sin(a))) * 0.05, (0.018, 0.018, 0.018))
        shoulder.paint(faces_of(tooth), BRASS_DARK)
    parts.append(shoulder)

    fore = Part("arm.fore", IRON, "arm.fore", shade=0.08)
    joint = kit.sphere(fore.bm, ELBOW, (0.04, 0.04, 0.04), 8, 6)
    fore.paint(faces_of(joint), BRASS)
    kit.cone(fore.bm, ELBOW, WRIST, 0.032, 0.045, 8)
    cuff = kit.cone(fore.bm, WRIST - (WRIST - ELBOW).normalized() * 0.03, WRIST + (WRIST - ELBOW).normalized() * 0.01, 0.055, 0.05, 10)
    fore.paint(faces_of(cuff), BRASS)
    for index in range(5):
        a = 2 * math.pi * index / 5
        rivet(fore, WRIST + Vector((math.cos(a) * 0.056, -0.005, math.sin(a) * 0.056)), 0.007, IRON_DARK)
    hose = kit.tube(fore.bm, [ELBOW + Vector((-0.02, 0.02, 0.03)), ELBOW.lerp(WRIST, 0.5) + Vector((-0.04, 0, 0.05)), WRIST + Vector((-0.03, 0.02, 0.04))], [0.008] * 3, 5)
    fore.paint(faces_of(hose), IRON_DARK)
    parts.append(fore)

    # Two curved jaws: they open up and down, so the camera sees them open.
    for name, tip, bend in (("claw.top", JAW_TOP, 1), ("claw.low", JAW_LOW, -1)):
        jaw = Part(name, BRASS, name, shade=0.06)
        mid = WRIST.lerp(tip, 0.5) + Vector((0, 0, 0.035 * bend))
        hook = tip + Vector((0, -0.01, -0.04 * bend))
        verts = kit.tube(jaw.bm, [WRIST + Vector((0, -0.02, 0)), mid, tip, hook], [0.032, 0.03, 0.02, 0.004], 6)
        for face in faces_of(verts):
            if (face.calc_center_median() - WRIST).length > 0.12:
                jaw.paint([face], IRON)
        for dy in (-0.05, -0.09):
            tooth = kit.cone(jaw.bm, WRIST + Vector((0, dy, 0.02 * bend)), WRIST + Vector((0, dy - 0.006, -0.012 * bend)), 0.01, 0.002, 4)
            jaw.paint(faces_of(tooth), IRON_DARK)
        parts.append(jaw)
    return parts


def driver_parts():
    """The driver from the waist up: her legs are down in the seat."""
    parts = []
    s = DRIVER_SIZE
    base = DRIVER
    look = Vector((-math.sin(math.radians(DRIVER_YAW)), -math.cos(math.radians(DRIVER_YAW)), 0))
    side = Vector((-look.y, look.x, 0))
    neck = base + Vector((0, 0, 0.11 * s))
    head_c = neck + Vector((0, 0, 0.055 * s)) + look * 0.006

    body = Part("driver.body", JACKET, "driver.body", shade=0.1)
    kit.cone(body.bm, base, neck, 0.05 * s, 0.04 * s, 8, squash=0.85)
    scarf = kit.torus(body.bm, neck - Vector((0, 0, 0.004)), (0, 0, 1), 0.035 * s, 0.012 * s, 8, 4)
    body.paint(faces_of(scarf), RED)
    tail = kit.cone(body.bm, neck - look * 0.03 - Vector((0, 0, 0.004)), neck - look * 0.09 + side * 0.03 - Vector((0, 0, 0.02)), 0.018, 0.003, 4, squash=0.4)
    body.paint(faces_of(tail), RED)
    for sign in (1, -1):
        strap = kit.box(body.bm, base + look * 0.05 * s + side * 0.022 * sign + Vector((0, 0, 0.06 * s)), (0.012, 0.012, 0.06 * s))
        body.paint(faces_of(strap), BRASS_DARK)
    parts.append(body)

    head = Part("driver.head", SKIN, "driver.head", shade=0.1)
    kit.sphere(head.bm, head_c, (0.05 * s, 0.05 * s, 0.05 * s), 10, 7)
    kit.cone(head.bm, head_c + look * 0.045 * s, head_c + look * 0.075 * s - Vector((0, 0, 0.012 * s)), 0.011 * s, 0.002, 5)
    for sign in (1, -1):
        ear = kit.cone(head.bm, head_c + side * 0.045 * s * sign, head_c + side * 0.13 * s * sign + Vector((0, 0, 0.035 * s)) - look * 0.02, 0.026 * s, 0.002, 6, squash=0.3)
        for face in faces_of(ear):
            if face.normal.dot(look) > 0.3:
                head.paint([face], EAR)
    # A wide grin with teeth.
    grin = kit.tube(head.bm, [head_c + look * 0.04 * s + side * 0.026 * s - Vector((0, 0, 0.018 * s)), head_c + look * 0.05 * s - Vector((0, 0, 0.028 * s)), head_c + look * 0.04 * s - side * 0.026 * s - Vector((0, 0, 0.018 * s))], [0.005 * s] * 3, 4)
    head.paint(faces_of(grin), MOUTH)
    teeth = kit.box(head.bm, head_c + look * 0.05 * s - Vector((0, 0, 0.022 * s)), (0.026, 0.006, 0.006))
    head.paint(faces_of(teeth), TEETH)
    for sign in (1, -1):
        eye = kit.sphere(head.bm, head_c + look * 0.044 * s + side * 0.02 * s * sign + Vector((0, 0, 0.008 * s)), (0.012 * s, 0.012 * s, 0.012 * s), 6, 4)
        head.paint(faces_of(eye), EYES)
        pupil = kit.sphere(head.bm, head_c + look * 0.054 * s + side * 0.02 * s * sign + Vector((0, 0, 0.008 * s)), (0.005 * s, 0.005 * s, 0.006 * s), 4, 3)
        head.paint(faces_of(pupil), PUPIL)
    # Wild white hair and brass goggles on the brow.
    hair = kit.sphere(head.bm, head_c + Vector((0, 0, 0.03 * s)) - look * 0.015, (0.05 * s, 0.05 * s, 0.035 * s), 8, 5)
    head.paint(faces_of(hair), HAIR)
    for index in range(6):
        a = math.radians(-90 + index * 36)
        out = side * math.sin(a) - look * math.cos(a)
        tuft = kit.cone(head.bm, head_c + Vector((0, 0, 0.035 * s)) + out * 0.025, head_c + Vector((0, 0, 0.05 * s)) + out * 0.075 * s, 0.018 * s, 0.002, 4)
        head.paint(faces_of(tuft), HAIR)
    band = kit.torus(head.bm, head_c + Vector((0, 0, 0.028 * s)), (0, 0, 1), 0.052 * s, 0.006 * s, 12, 3)
    head.paint(faces_of(band), BRASS)
    for sign in (1, -1):
        lens = kit.cone(head.bm, head_c + look * 0.04 * s + side * 0.02 * s * sign + Vector((0, 0, 0.034 * s)), head_c + look * 0.056 * s + side * 0.02 * s * sign + Vector((0, 0, 0.04 * s)), 0.015 * s, 0.014 * s, 8)
        head.paint(faces_of(lens), BRASS)
        glass = kit.cone(head.bm, head_c + look * 0.056 * s + side * 0.02 * s * sign + Vector((0, 0, 0.04 * s)), head_c + look * 0.058 * s + side * 0.02 * s * sign + Vector((0, 0, 0.0405 * s)), 0.011 * s, 0.011 * s, 8)
        head.paint(faces_of(glass), LENS)
    parts.append(head)

    for arm_side, sign in (("L", 1), ("R", -1)):
        shoulder = base + Vector((0.05 * sign * s, 0, 0.095 * s))
        hand = Vector((0.077 * sign, -0.02, 0.695))
        elbow = shoulder.lerp(hand, 0.5) + Vector((0.02 * sign, 0.02, -0.03))
        arm = Part(f"driver.arm.{arm_side}", SKIN, f"driver.arm.{arm_side}", shade=0.05)
        sleeve = kit.tube(arm.bm, [shoulder, elbow], [0.016 * s, 0.014 * s], 6)
        arm.paint(faces_of(sleeve), JACKET)
        kit.tube(arm.bm, [elbow, hand], [0.013 * s, 0.011 * s], 6)
        glove = kit.sphere(arm.bm, hand + Vector((0, 0, 0.004)), (0.016 * s, 0.016 * s, 0.016 * s), 6, 4)
        arm.paint(faces_of(glove), JACKET)
        parts.append(arm)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("JunkWalker", BONES)
    parts = boiler_parts() + steam_parts() + leg_parts() + claw_parts() + driver_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "JunkWalkerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each knee toward its pole bone.
POLE_ANGLE = 90


def add_controls(rig):
    """IK for the legs: each shin reaches its foot bone."""
    bones = rig.pose.bones
    for side in ("L", "R"):
        ik = bones[f"shin.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = rig
        ik.subtarget = f"foot.{side}"
        ik.pole_target = rig
        ik.pole_subtarget = f"pole.{side}"
        ik.pole_angle = math.radians(POLE_ANGLE)
        ik.chain_count = 2
        ik.use_tail = True
    return {}


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

    def driver(bob=0.0, look=0.0, pull=0.0):
        """The driver: a small bob, the head turns about, the hands pull the levers back."""
        return {
            "driver.body@loc": at("driver.body", (0, 0, 0.006 * bob)),
            "driver.body": t("driver.body", (X, -3 * bob)),
            "driver.head": t("driver.head", (Z, 25 * look), (X, -4 * bob)),
            "driver.arm.L": t("driver.arm.L", (X, -20 * pull)),
            "driver.arm.R": t("driver.arm.R", (X, -20 * pull)),
            "lever.L": t("lever.L", (X, -25 * pull)),
            "lever.R": t("lever.R", (X, -25 * pull)),
        }

    def rest(thrum=0.0, puff=0.0, look=0.0, snap=0.0):
        """At rest: the engine thrums, the chimney puffs, the claw opens and closes, the driver looks about."""
        result = {
            "body@loc": at("body", (0, 0, 0.004 * thrum - 0.01)),
            "body": t("body", (X, 0.8 * thrum)),
            "arm.upper": t("arm.upper", (X, -4 * snap)),
            "claw.top": t("claw.top", (X, -8 - 12 * snap)),
            "claw.low": t("claw.low", (X, 8 + 12 * snap)),
            "steam@scale": 0.5 + 0.9 * puff,
            "leak@scale": 0.0,
            "shin.L/IK": 1.0,
            "shin.R/IK": 1.0,
        }
        result.update(driver(thrum, look))
        return result

    def broken(thrum=0.0, hiss=0.0):
        """Low HP: it sags on a bent right knee, steam hisses from a joint, a plate hangs loose and the driver slumps."""
        result = rest(thrum, 0.2)
        result.update(
            {
                "body@loc": at("body", (0.01, 0.01, -0.06 + 0.004 * thrum)),
                "body": t("body", (Y, -7), (X, 4)),
                "foot.R@loc": at("foot.R", (0, 0.02, 0)),
                "arm.upper": t("arm.upper", (X, 20), (Z, 6)),
                "arm.fore": t("arm.fore", (X, 12)),
                "claw.top": t("claw.top", (X, -18)),
                "claw.low": t("claw.low", (X, 22)),
                "leak@scale": 1.0 + 0.8 * hiss,
                "plate": t("plate", (Y, -30 - 6 * hiss), (X, 8)),
                "driver.body": t("driver.body", (X, 22)),
                "driver.head": t("driver.head", (X, 18 + 4 * thrum), (Y, -10)),
                "driver.arm.L": t("driver.arm.L", (X, 16)),
                "driver.arm.R": t("driver.arm.R", (X, 16)),
            }
        )
        return result

    def stride(phase):
        """
        The walk in place, by phase 0..1: the left foot steps at 0, the right
        at 0.5. A lifted foot rises and moves forward, a planted foot slides
        back, and the boiler drops at each step and sways over the planted foot.
        """
        result = rest(0, 0.6 + 0.4 * math.sin(phase * 4 * math.pi))
        for side, offset in (("L", 0.0), ("R", 0.5)):
            p = (phase - offset) % 1.0
            if p < 0.5:
                # Planted: from the front to the back.
                y = -0.06 + 0.24 * p
                z = 0.0
                tip = 0.0
            else:
                # Lifted: from the back to the front.
                q = (p - 0.5) / 0.5
                y = 0.06 - 0.12 * q
                z = 0.07 * math.sin(math.pi * q)
                tip = -12 * math.sin(math.pi * q)
            result[f"foot.{side}@loc"] = at(f"foot.{side}", (0, y, z))
            result[f"foot.{side}"] = t(f"foot.{side}", (X, tip))
        lift = abs(math.sin(phase * 2 * math.pi))
        result["body@loc"] = at("body", (0, 0, -0.03 + 0.03 * lift))
        result["body"] = t("body", (Y, 5 * math.cos(phase * 2 * math.pi)), (X, 3))
        result["arm.upper"] = t("arm.upper", (X, -6 * math.sin(phase * 2 * math.pi)))
        result["plate"] = t("plate", (Y, 6 * math.sin(phase * 4 * math.pi)))
        result.update(
            {
                "driver.body": t("driver.body", (Y, -4 * math.cos(phase * 2 * math.pi))),
                "driver.head": t("driver.head", (Y, -6 * math.cos(phase * 2 * math.pi))),
            }
        )
        return result

    # The attack: the claw goes back and opens wide, then it thrusts forward
    # and snaps shut. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the claw snaps at frame 15 of 30.
    def windup():
        result = rest(0, 1.0)
        result.update(
            {
                "body@loc": at("body", (0, 0.03, -0.01)),
                "body": t("body", (X, -6), (Z, 8)),
                "arm.upper": t("arm.upper", (X, -50), (Z, -10)),
                "arm.fore": t("arm.fore", (X, -40)),
                "claw.top": t("claw.top", (X, -45)),
                "claw.low": t("claw.low", (X, 45)),
            }
        )
        result.update(driver(0.5, -0.4, 1.0))
        return result

    def snap(hold=0.0):
        result = rest(0, 1.6)
        result.update(
            {
                "body@loc": at("body", (0, -0.05, -0.03)),
                "body": t("body", (X, 10), (Z, -6)),
                "arm.upper": t("arm.upper", (X, -28 - 4 * hold), (Z, 8)),
                "arm.fore": t("arm.fore", (X, 10)),
                "claw.top": t("claw.top", (X, 6)),
                "claw.low": t("claw.low", (X, -6)),
                "foot.L@loc": at("foot.L", (0, -0.04, 0)),
            }
        )
        result.update(driver(-0.6, -0.2, -1.0))
        return result

    def jolt(amount=1.0):
        """A hit rocks the boiler back, steam hisses, the plates rattle and the driver jumps."""
        result = rest(0, 1.0)
        result.update(
            {
                "body@loc": at("body", (0, 0.03 * amount, -0.01)),
                "body": t("body", (X, -7 * amount), (Y, 4 * amount)),
                "arm.upper": t("arm.upper", (X, -20 * amount)),
                "claw.top": t("claw.top", (X, -30 * amount)),
                "claw.low": t("claw.low", (X, 30 * amount)),
                "leak@scale": 1.6 * amount,
                "plate": t("plate", (Y, -20 * amount)),
                "driver.body@loc": at("driver.body", (0, 0, 0.03 * amount)),
                "driver.body": t("driver.body", (X, -14 * amount)),
                "driver.head": t("driver.head", (X, -20 * amount)),
                "driver.arm.L": t("driver.arm.L", (X, -80 * amount), (Y, 30 * amount)),
                "driver.arm.R": t("driver.arm.R", (X, -80 * amount), (Y, -30 * amount)),
            }
        )
        return result

    def buckle():
        """The knees give: the boiler drops and leans to its right."""
        result = rest(0, 2.0)
        result.update(
            {
                "body@loc": at("body", (-0.02, 0.02, -0.12)),
                "body": t("body", (Y, -16), (X, 6)),
                "foot.L@loc": at("foot.L", (0.02, 0.02, 0)),
                "foot.R@loc": at("foot.R", (-0.03, -0.02, 0)),
                "arm.upper": t("arm.upper", (X, 30)),
                "claw.top": t("claw.top", (X, -30)),
                "claw.low": t("claw.low", (X, 30)),
                "leak@scale": 2.2,
                "plate": t("plate", (Y, -50)),
                "driver.body": t("driver.body", (Y, 24), (X, -10)),
                "driver.arm.L": t("driver.arm.L", (X, -140)),
                "driver.arm.R": t("driver.arm.R", (X, -140)),
            }
        )
        return result

    def tipped(bounce=0.0):
        """On its right side, toward the camera: the legs stick out, the claw lies open and the driver tumbles out."""
        result = rest()
        result.update(
            {
                "root": t("root", (Y, -84 + bounce)),
                "root@loc": at("root", (-0.06, 0, 0.25)),
                "body@loc": at("body", (0, 0, -0.02)),
                "foot.L@loc": at("foot.L", (0.0, -0.04, 0.12)),
                "foot.R@loc": at("foot.R", (0.0, 0.04, 0.1)),
                "foot.L": t("foot.L", (X, -30)),
                "foot.R": t("foot.R", (X, 20)),
                "arm.upper": t("arm.upper", (X, -20), (Z, 50)),
                "arm.fore": t("arm.fore", (X, 10)),
                "claw.top": t("claw.top", (X, -40)),
                "claw.low": t("claw.low", (X, 40)),
                "steam@scale": 0.0,
                "leak@scale": 0.4,
                "plate": t("plate", (Y, -70)),
                "driver.body@loc": at("driver.body", (0, -0.04, 0.06)),
                "driver.body": t("driver.body", (Y, -60), (X, 30)),
                "driver.head": t("driver.head", (X, -20), (Z, 30)),
                "driver.arm.L": t("driver.arm.L", (X, -150), (Y, 20)),
                "driver.arm.R": t("driver.arm.R", (X, -100), (Y, -40)),
            }
        )
        return result

    def landing(height=0.0, squash=0.0, puff=1.0):
        """A summon: the walker drops onto the Square, the legs take the weight and steam bursts."""
        result = rest(0, puff)
        result["root@loc"] = at("root", (0, 0, height))
        result["body@loc"] = at("body", (0, 0, -0.07 * squash - 0.01))
        result["body"] = t("body", (X, 3 * squash))
        if height > 0:
            # In the air, the legs hang down.
            result["foot.L@loc"] = at("foot.L", (0, 0.0, 0.02))
            result["foot.R@loc"] = at("foot.R", (0, 0.0, 0.02))
        return result

    def cheer(base):
        result = dict(base)
        result.update(
            {
                "driver.body@loc": at("driver.body", (0, 0, 0.02)),
                "driver.head": t("driver.head", (X, -18)),
                "driver.arm.L": t("driver.arm.L", (X, -160), (Y, 20)),
                "driver.arm.R": t("driver.arm.R", (X, -160), (Y, -20)),
                "claw.top": t("claw.top", (X, -40)),
                "claw.low": t("claw.low", (X, 40)),
                "arm.upper": t("arm.upper", (X, -60)),
                "steam@scale": 2.2,
            }
        )
        return result

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 4):
        w = frame / 48 * 2 * math.pi
        thrum = (1 if (frame // 4) % 2 else -1) if frame not in (0, 48) else 0
        idle.key(frame, rest(thrum, 0.5 + 0.5 * math.sin(w * 2), math.sin(w), max(0.0, math.sin(w * 2))))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame in range(0, 49, 6):
        w = frame / 48 * 2 * math.pi
        low.key(frame, broken(math.sin(w), 0.5 + 0.5 * math.sin(w * 3)))
    clips.append(low)

    # One heavy step of each foot for each Square (`STEPS_PER_SQUARE`).
    walk = Clip("walk", 24, loop=True)
    for frame in range(0, 25, 2):
        walk.key(frame, stride(frame / 24))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, rest()).key(9, windup()).key(13, snap()).key(15, snap(1.0)).key(19, snap(1.0))
    attack.key(26, rest()).key(30, rest())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt()).key(8, jolt(0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(4, jolt()).key(12, buckle())
    death.key(24, tipped()).key(28, tipped(5)).key(36, tipped())
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt()).key(10, buckle()).key(20, tipped()).key(22, tipped(3))
    rebirth.key(32, buckle()).key(38, landing(0.0, 1.0, 2.0)).key(42, cheer(rest())).key(48, rest())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, landing(0.2, 0.0, 0.0)).key(8, landing(0.0, 1.0, 2.4)).key(12, landing(0.0, 0.2, 1.6)).key(15, landing(0.0, 0.5, 1.0))
    summon.key(19, cheer(rest())).key(24, rest())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "junk-walker.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
