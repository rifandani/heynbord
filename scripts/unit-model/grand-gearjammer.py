"""
Grand Gearjammer (`goblin.grandGearjammer`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a goblin war cart of patched wood
and iron on four spoked wheels with brass gear hubs, an iron plow of teeth
at the front, green lanterns at the corners, a big brass cannon on top, a
big brass gear with a red flag at the back, and a crew of three goblins: the
gunner with an alarm clock, the driver with a lever and a small one at the
front. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/grand-gearjammer.glb`; then
`bun unit-model:pack grand-gearjammer` packs it for the game.

The cart is a machine, not a figure: the cart bone carries the body, the
wheels and the gear turn, and each goblin has a body, a head and two arms.
The cart faces -Y like the other Unit Models, and the crew sits on the camera
side (-X). It attacks at Mid Range: the cannon fires at 20% of the attack,
when the projectile leaves.
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

WOOD = hex_color("#6a4428")
WOOD_DARK = hex_color("#4a2e1a")
IRON = hex_color("#5a5650")
IRON_DARK = hex_color("#3a3733")
RUST = hex_color("#8a5a34")
BRASS = hex_color("#d2a046")
BRASS_DARK = hex_color("#93692a")
GLOW = hex_color("#a8ff3e")
GLOW_DARK = hex_color("#5fae22")
RED = hex_color("#b0362c")
SKIN = hex_color("#8fa25a")
SKIN_DARK = hex_color("#687a3c")
EAR = hex_color("#d79a8a")
HAIR = hex_color("#ecebe6")
EYES = hex_color("#f2c040")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a2a26")
LENS = hex_color("#2c3a46")
CLOTH = hex_color("#6a4a30")
VEST = hex_color("#8a3a2a")
CANVAS = hex_color("#b8a47c")
CLOCK = hex_color("#f2ead6")
FLASH = hex_color("#ffd36a")
FLASH_HOT = hex_color("#fff3c4")

# --- Proportions ---------------------------------------------------------------

AXLE_Z = 0.13
WHEEL_R = 0.13
WHEEL_X = 0.21
FRONT_Y = -0.24
BACK_Y = 0.22
DECK_Z = 0.34
CANNON_Z = 0.47
CANNON_BACK = 0.12
CANNON_FRONT = -0.44
GEAR_C = Vector((0.14, 0.26, 0.6))
GEAR_R = 0.13

WHEELS = {
    "FL": Vector((WHEEL_X, FRONT_Y, AXLE_Z)),
    "FR": Vector((-WHEEL_X, FRONT_Y, AXLE_Z)),
    "BL": Vector((WHEEL_X, BACK_Y, AXLE_Z)),
    "BR": Vector((-WHEEL_X, BACK_Y, AXLE_Z)),
}

# The crew: where each goblin sits on the deck, and which way it looks (degrees to its left).
GOBLINS = {
    "gunner": (Vector((-0.08, 0.14, DECK_Z)), 0, 1.25),
    "driver": (Vector((0.03, 0.28, DECK_Z + 0.02)), 10, 1.3),
    "scout": (Vector((-0.12, -0.17, DECK_Z)), -20, 1.1),
}

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    # The cart pitches about the rear axle.
    ("cart", (0, BACK_Y, AXLE_Z), (0, FRONT_Y, AXLE_Z), "root"),
    ("cannon", (0, CANNON_BACK, CANNON_Z), (0, CANNON_BACK - 0.1, CANNON_Z), "cart"),
    ("flash", (0, CANNON_FRONT, CANNON_Z), (0, CANNON_FRONT - 0.05, CANNON_Z), "cannon"),
    ("gear", tuple(GEAR_C), tuple(GEAR_C + Vector((0, 0, 0.08))), "cart"),
    ("flag", tuple(GEAR_C + Vector((0, 0, GEAR_R))), tuple(GEAR_C + Vector((0, 0, GEAR_R + 0.1))), "cart"),
]
for name, center in WHEELS.items():
    BONES.append((f"wheel.{name}", tuple(center), tuple(center + Vector((0, 0, 0.06))), "cart"))
for name, (base, _yaw, size) in GOBLINS.items():
    neck = base + Vector((0, 0, 0.11 * size))
    BONES += [
        (f"{name}.body", tuple(base), tuple(neck), "cart"),
        (f"{name}.head", tuple(neck), tuple(neck + Vector((0, 0, 0.1 * size))), f"{name}.body"),
    ]
    for side, sign in (("L", 1), ("R", -1)):
        shoulder = base + Vector((0.05 * sign * size, 0, 0.095 * size))
        BONES.append((f"{name}.arm.{side}", tuple(shoulder), tuple(shoulder + Vector((0.02 * sign, -0.03, -0.07))), f"{name}.body"))

# --- Parts ---------------------------------------------------------------------


def wheel_parts():
    parts = []
    for name, c in WHEELS.items():
        wheel = Part(f"wheel.{name}", WOOD_DARK, f"wheel.{name}", shade=0.04)
        side = 1 if c.x > 0 else -1
        rim = kit.torus(wheel.bm, c, (1, 0, 0), WHEEL_R - 0.014, 0.018, 16, 4)
        wheel.paint(faces_of(rim), IRON)
        # Iron studs on the tread.
        for step in range(8):
            a = 2 * math.pi * step / 8
            p = c + Vector((0, math.cos(a), math.sin(a))) * WHEEL_R
            stud = kit.box(wheel.bm, p, (0.034, 0.02, 0.02))
            wheel.paint(faces_of(stud), IRON_DARK)
        for step in range(6):
            a = 2 * math.pi * step / 6 + 0.3
            kit.tube(wheel.bm, [c, c + Vector((0, math.cos(a), math.sin(a))) * (WHEEL_R - 0.02)], [0.009, 0.007], 4)
        # The brass gear hub on the outside.
        hub = kit.cone(wheel.bm, c - Vector((0.02 * side, 0, 0)), c + Vector((0.03 * side, 0, 0)), 0.045, 0.04, 10)
        wheel.paint(faces_of(hub), BRASS)
        for step in range(8):
            a = 2 * math.pi * step / 8
            tooth = kit.box(wheel.bm, c + Vector((0.01 * side, math.cos(a) * 0.05, math.sin(a) * 0.05)), (0.03, 0.018, 0.018))
            wheel.paint(faces_of(tooth), BRASS_DARK)
        cap = kit.sphere(wheel.bm, c + Vector((0.032 * side, 0, 0)), (0.014, 0.02, 0.02), 6, 4)
        wheel.paint(faces_of(cap), BRASS_DARK)
        parts.append(wheel)
    return parts


def cart_parts():
    parts = []
    cart = Part("cart", WOOD, "cart", shade=0.12)
    # The chassis and the deck.
    kit.box(cart.bm, (0, -0.01, 0.2), (0.36, 0.6, 0.1))
    deck = kit.box(cart.bm, (0, 0.0, 0.28), (0.4, 0.58, 0.1))
    cart.paint(faces_of(deck), WOOD)
    # Iron rails and straps on the sides.
    for x in (0.2, -0.2):
        rail = kit.box(cart.bm, (x, 0.0, DECK_Z - 0.005), (0.02, 0.6, 0.03))
        cart.paint(faces_of(rail), IRON)
        for y in (-0.2, 0.0, 0.2):
            strap = kit.box(cart.bm, (x * 1.02, y, 0.26), (0.012, 0.03, 0.14))
            cart.paint(faces_of(strap), IRON_DARK)
            rivet = kit.sphere(cart.bm, (x * 1.06, y, 0.3), (0.008, 0.008, 0.008), 4, 3)
            cart.paint(faces_of(rivet), BRASS)
    # A patch of rusty plate on the camera side.
    patch = kit.box(cart.bm, (-0.205, 0.1, 0.22), (0.01, 0.12, 0.08))
    cart.paint(faces_of(patch), RUST)
    # The axles.
    for y in (FRONT_Y, BACK_Y):
        axle = kit.cone(cart.bm, (WHEEL_X, y, AXLE_Z), (-WHEEL_X, y, AXLE_Z), 0.014, 0.014, 6)
        cart.paint(faces_of(axle), IRON_DARK)

    # The plow: a row of iron teeth at the front.
    plow = kit.box(cart.bm, (0, -0.33, 0.2), (0.4, 0.04, 0.1))
    cart.paint(faces_of(plow), IRON)
    for step in range(6):
        x = -0.17 + step * 0.068
        tooth = kit.cone(cart.bm, (x, -0.34, 0.2), (x, -0.42, 0.07), 0.024, 0.002, 4)
        cart.paint(faces_of(tooth), IRON_DARK)

    # The cannon mount.
    mount = kit.box(cart.bm, (0, 0.02, 0.39), (0.14, 0.2, 0.1))
    cart.paint(faces_of(mount), IRON)

    # Green lanterns on posts at the corners.
    for x, y in ((0.19, -0.27), (-0.19, -0.27), (-0.19, 0.27), (0.19, 0.27)):
        post = kit.cone(cart.bm, (x, y, DECK_Z), (x, y, DECK_Z + 0.08), 0.008, 0.008, 4)
        cart.paint(faces_of(post), IRON_DARK)
        glass = kit.cone(cart.bm, (x, y, DECK_Z + 0.08), (x, y, DECK_Z + 0.15), 0.026, 0.026, 6)
        cart.paint(faces_of(glass), GLOW)
        for z in (DECK_Z + 0.075, DECK_Z + 0.15):
            cap = kit.cone(cart.bm, (x, y, z), (x, y, z + 0.016), 0.032, 0.02, 6)
            cart.paint(faces_of(cap), BRASS)

    # A canvas sack and a box of junk on the deck.
    sack = kit.sphere(cart.bm, (0.12, -0.12, DECK_Z + 0.04), (0.06, 0.07, 0.05), 8, 6)
    cart.paint(faces_of(sack), CANVAS)
    crate = kit.box(cart.bm, (0.1, 0.12, DECK_Z + 0.04), (0.1, 0.1, 0.08))
    cart.paint(faces_of(crate), WOOD_DARK)
    parts.append(cart)
    return parts


def cannon_parts():
    parts = []
    cannon = Part("cannon", BRASS, "cannon", shade=0.08)
    kit.cone(cannon.bm, (0, CANNON_BACK, CANNON_Z), (0, CANNON_FRONT + 0.06, CANNON_Z), 0.068, 0.054, 12)
    muzzle = kit.cone(cannon.bm, (0, CANNON_FRONT + 0.06, CANNON_Z), (0, CANNON_FRONT, CANNON_Z), 0.07, 0.074, 12)
    cannon.paint(faces_of(muzzle), BRASS_DARK)
    bore = kit.cone(cannon.bm, (0, CANNON_FRONT + 0.004, CANNON_Z), (0, CANNON_FRONT - 0.002, CANNON_Z), 0.044, 0.044, 10)
    cannon.paint(faces_of(bore), IRON_DARK)
    for y in (0.06, -0.08, -0.22):
        band = kit.cone(cannon.bm, (0, y, CANNON_Z), (0, y - 0.022, CANNON_Z), 0.074, 0.072, 12)
        cannon.paint(faces_of(band), IRON)
    breech = kit.sphere(cannon.bm, (0, CANNON_BACK, CANNON_Z), (0.064, 0.05, 0.064), 10, 6)
    cannon.paint(faces_of(breech), BRASS_DARK)
    knob = kit.sphere(cannon.bm, (0, CANNON_BACK + 0.06, CANNON_Z), (0.02, 0.02, 0.02), 6, 4)
    cannon.paint(faces_of(knob), IRON_DARK)
    # Gears on the side of the barrel.
    for x in (0.07, -0.07):
        gear = kit.cone(cannon.bm, (x, 0.0, CANNON_Z), (x * 1.25, 0.0, CANNON_Z), 0.04, 0.04, 8)
        cannon.paint(faces_of(gear), BRASS_DARK)
    parts.append(cannon)

    flash = Part("flash", FLASH, "flash", shade=0)
    tip = Vector((0, CANNON_FRONT, CANNON_Z))
    kit.cone(flash.bm, tip, tip + Vector((0, -0.16, 0)), 0.07, 0.004, 8)
    for angle in range(0, 360, 60):
        a = math.radians(angle)
        out = Vector((math.cos(a), 0, math.sin(a))) * 0.08
        spike = kit.cone(flash.bm, tip, tip + Vector((0, -0.05, 0)) + out, 0.024, 0.002, 4)
        flash.paint(faces_of(spike), FLASH_HOT)
    parts.append(flash)
    return parts


def gear_parts():
    gear = Part("gear", BRASS, "gear", shade=0.06)
    c = GEAR_C
    rim = kit.torus(gear.bm, c, (1, 0, 0), GEAR_R - 0.018, 0.02, 20, 4)
    gear.paint(faces_of(rim), BRASS)
    for step in range(12):
        a = 2 * math.pi * step / 12
        tooth = kit.box(gear.bm, c + Vector((0, math.cos(a), math.sin(a))) * (GEAR_R + 0.01) - Vector((0, 0, 0)), (0.026, 0.03, 0.03))
        gear.paint(faces_of(tooth), BRASS_DARK)
    for step in range(5):
        a = 2 * math.pi * step / 5
        kit.tube(gear.bm, [c, c + Vector((0, math.cos(a), math.sin(a))) * (GEAR_R - 0.02)], [0.014, 0.01], 4)
    hub = kit.cone(gear.bm, c - Vector((0.025, 0, 0)), c + Vector((0.025, 0, 0)), 0.03, 0.03, 8)
    gear.paint(faces_of(hub), IRON_DARK)
    # The post that holds the gear up.
    post = kit.cone(gear.bm, c + Vector((0.03, 0, 0)), Vector((c.x + 0.03, c.y, DECK_Z)), 0.012, 0.016, 6)
    gear.paint(faces_of(post), IRON_DARK)
    parts = [gear]

    flag = Part("flag", RED, "flag", shade=0.08)
    top = c + Vector((0.03, 0, GEAR_R))
    pole = kit.cone(flag.bm, Vector((c.x + 0.03, c.y + 0.02, c.z)), top + Vector((0, 0.02, 0.2)), 0.007, 0.006, 4)
    flag.paint(faces_of(pole), WOOD_DARK)
    grid_front = []
    grid_back = []
    for row in range(3):
        z = top.z + 0.19 - row * 0.06
        line_f, line_b = [], []
        for column in range(4):
            y = c.y + 0.02 + column * 0.05
            wave = 0.012 * math.sin(column * 1.7)
            line_f.append((top.x + wave - 0.003, y, z - 0.02 * column * row / 2))
            line_b.append((top.x + wave + 0.003, y, z - 0.02 * column * row / 2))
        grid_front.append(line_f)
        grid_back.append(line_b)
    kit.panel(flag, grid_front, grid_back, lambda face_side, row, column: RED)
    parts.append(flag)
    return parts


def goblin_parts(name, base, yaw, size):
    """A small goblin from the waist up: the legs are down in the cart."""
    parts = []
    s = size
    look = Vector((-math.sin(math.radians(yaw)), -math.cos(math.radians(yaw)), 0))
    side = Vector((-look.y, look.x, 0))
    neck = base + Vector((0, 0, 0.11 * s))
    head_c = neck + Vector((0, 0, 0.055 * s)) + look * 0.006

    body = Part(f"{name}.body", VEST, f"{name}.body", shade=0.1)
    kit.cone(body.bm, base, neck, 0.05 * s, 0.04 * s, 8, squash=0.85)
    belt = kit.cone(body.bm, base + Vector((0, 0, 0.01 * s)), base + Vector((0, 0, 0.025 * s)), 0.052 * s, 0.051 * s, 8)
    body.paint(faces_of(belt), CLOTH)
    collar = kit.torus(body.bm, neck - Vector((0, 0, 0.005)), (0, 0, 1), 0.035 * s, 0.01 * s, 8, 4)
    body.paint(faces_of(collar), CLOTH)
    parts.append(body)

    head = Part(f"{name}.head", SKIN, f"{name}.head", shade=0.1)
    kit.sphere(head.bm, head_c, (0.05 * s, 0.05 * s, 0.05 * s), 10, 7)
    kit.cone(head.bm, head_c + look * 0.045 * s, head_c + look * 0.075 * s - Vector((0, 0, 0.01 * s)), 0.011 * s, 0.002, 5)
    for sign in (1, -1):
        ear = kit.cone(head.bm, head_c + side * 0.045 * s * sign, head_c + side * 0.13 * s * sign + Vector((0, 0, 0.035 * s)) - look * 0.02, 0.026 * s, 0.002, 6, squash=0.3)
        for face in faces_of(ear):
            if face.normal.dot(look) > 0.3:
                head.paint([face], EAR)
        eye = kit.sphere(head.bm, head_c + look * 0.044 * s + side * 0.02 * s * sign + Vector((0, 0, 0.008 * s)), (0.012 * s, 0.012 * s, 0.012 * s), 6, 4)
        head.paint(faces_of(eye), EYES)
        pupil = kit.sphere(head.bm, head_c + look * 0.054 * s + side * 0.02 * s * sign + Vector((0, 0, 0.008 * s)), (0.005 * s, 0.005 * s, 0.006 * s), 4, 3)
        head.paint(faces_of(pupil), PUPIL)
    grin = kit.tube(head.bm, [head_c + look * 0.042 * s + side * 0.022 * s - Vector((0, 0, 0.02 * s)), head_c + look * 0.05 * s - Vector((0, 0, 0.027 * s)), head_c + look * 0.042 * s - side * 0.022 * s - Vector((0, 0, 0.02 * s))], [0.004 * s] * 3, 4)
    head.paint(faces_of(grin), MOUTH)
    # Wild white hair and brass goggles on the brow.
    hair = kit.sphere(head.bm, head_c + Vector((0, 0, 0.035 * s)) - look * 0.012, (0.045 * s, 0.045 * s, 0.03 * s), 8, 5)
    head.paint(faces_of(hair), HAIR)
    for index in range(4):
        a = math.radians(-60 + index * 40)
        out = side * math.sin(a) - look * math.cos(a)
        tuft = kit.cone(head.bm, head_c + Vector((0, 0, 0.04 * s)) + out * 0.02, head_c + Vector((0, 0, 0.06 * s)) + out * 0.06 * s, 0.016 * s, 0.002, 4)
        head.paint(faces_of(tuft), HAIR)
    band = kit.torus(head.bm, head_c + Vector((0, 0, 0.025 * s)), (0, 0, 1), 0.051 * s, 0.006 * s, 12, 3)
    head.paint(faces_of(band), BRASS)
    for sign in (1, -1):
        lens = kit.cone(head.bm, head_c + look * 0.04 * s + side * 0.02 * s * sign + Vector((0, 0, 0.032 * s)), head_c + look * 0.056 * s + side * 0.02 * s * sign + Vector((0, 0, 0.036 * s)), 0.014 * s, 0.014 * s, 8)
        head.paint(faces_of(lens), BRASS)
    parts.append(head)

    for arm_side, sign in (("L", 1), ("R", -1)):
        shoulder = base + Vector((0.05 * sign * s, 0, 0.095 * s))
        elbow = shoulder + side * 0.012 * sign + Vector((0, 0, -0.045 * s)) + look * 0.01
        hand = elbow + look * 0.05 * s + Vector((0, 0, 0.005))
        arm = Part(f"{name}.arm.{arm_side}", SKIN, f"{name}.arm.{arm_side}", shade=0.05)
        sleeve = kit.tube(arm.bm, [shoulder, elbow], [0.016 * s, 0.014 * s], 6)
        arm.paint(faces_of(sleeve), VEST)
        kit.tube(arm.bm, [elbow, hand], [0.013 * s, 0.011 * s], 6)
        kit.sphere(arm.bm, hand, (0.015 * s, 0.015 * s, 0.015 * s), 6, 4)
        if name == "gunner" and arm_side == "R":
            # The alarm clock: a brass case, a white face and two bells.
            clock_c = hand + Vector((0, 0, 0.03))
            case = kit.cone(arm.bm, clock_c - side * 0.012, clock_c + side * 0.012, 0.03, 0.03, 10)
            arm.paint(faces_of(case), BRASS)
            dial = kit.cone(arm.bm, clock_c - side * 0.014, clock_c - side * 0.017, 0.024, 0.024, 10)
            arm.paint(faces_of(dial), CLOCK)
            for bell in (1, -1):
                knob = kit.sphere(arm.bm, clock_c + Vector((0, 0.018 * bell, 0.03)), (0.012, 0.012, 0.01), 6, 4)
                arm.paint(faces_of(knob), BRASS_DARK)
        if name == "driver" and arm_side == "R":
            # The lever: an iron rod with a red knob.
            lever = kit.cone(arm.bm, hand - Vector((0, 0, 0.1)), hand + Vector((0, 0, 0.08)), 0.008, 0.008, 4)
            arm.paint(faces_of(lever), IRON_DARK)
            knob = kit.sphere(arm.bm, hand + Vector((0, 0, 0.09)), (0.016, 0.016, 0.016), 6, 4)
            arm.paint(faces_of(knob), RED)
        parts.append(arm)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("GrandGearjammer", BONES)
    parts = cart_parts() + wheel_parts() + cannon_parts() + gear_parts()
    for name, (base, yaw, size) in GOBLINS.items():
        parts += goblin_parts(name, base, yaw, size)
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "GrandGearjammerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def crew(bob=0.0, look=0.0, arms=0.0):
        """The goblins: a small bob, the heads turn about, the arms move a little."""
        result = {}
        for index, name in enumerate(GOBLINS):
            phase = (index * 0.7) % 1
            b = bob * (1 if index % 2 else -1)
            result[f"{name}.body@loc"] = at(f"{name}.body", (0, 0, 0.006 * b))
            result[f"{name}.body"] = t(f"{name}.body", (Y, 3 * b))
            result[f"{name}.head"] = t(f"{name}.head", (Z, 25 * look * (1 if phase < 0.5 else -1)), (X, -4 * b))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -10 * arms))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -10 * arms))
        return result

    def wheels(angle):
        """The wheels turn forward by `angle` degrees."""
        return {f"wheel.{name}": t(f"wheel.{name}", (X, angle)) for name in WHEELS}

    def rest(rumble=0.0, gear=0.0, bob=0.0, look=0.0):
        """The cart at rest: the engine rumbles, the gear turns, the crew looks about."""
        result = {
            "cart@loc": at("cart", (0, 0, 0.003 * rumble)),
            "cart": t("cart", (X, 0.6 * rumble)),
            "gear": t("gear", (X, gear)),
            "flag": t("flag", (Z, 6 * look)),
            "flash@scale": 0.0,
        }
        result.update(wheels(0))
        result.update(crew(bob, look))
        return result

    def broken(rumble=0.0):
        """Low HP: the cart sags on a loose wheel, and the crew slumps."""
        result = rest(rumble)
        result.update(
            {
                "cart": t("cart", (Y, -6), (X, 2)),
                "wheel.FR": t("wheel.FR", (Y, 12)),
                "cannon": t("cannon", (X, 10)),
                "flag": t("flag", (X, 30)),
            }
        )
        for name in GOBLINS:
            result[f"{name}.body"] = t(f"{name}.body", (X, 24))
            result[f"{name}.head"] = t(f"{name}.head", (X, 20 + 4 * rumble), (Y, -10))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, 20))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, 20))
        return result

    def rolling(angle, bump=0.0):
        """The cart rolls: the wheels turn, the cart bumps, the crew holds on."""
        result = rest(0, angle * 0.5, bump, 0)
        result.update(wheels(angle))
        result["cart@loc"] = at("cart", (0, 0, 0.012 * abs(bump)))
        result["cart"] = t("cart", (X, 2 * bump))
        result["flag"] = t("flag", (Z, 20))
        return result

    def fire(kick=0.0, flash=0.0):
        """The cannon fires: it kicks back, the cart rocks, the crew covers its ears."""
        result = rest()
        result.update(
            {
                "cannon@loc": at("cannon", (0, 0.07 * kick, 0)),
                "cannon": t("cannon", (X, -8 * kick)),
                "cart": t("cart", (X, -4 * kick)),
                "flash@scale": flash,
                "flag": t("flag", (Z, 30 * kick)),
            }
        )
        for name in GOBLINS:
            result[f"{name}.body"] = t(f"{name}.body", (X, -12 * kick))
            result[f"{name}.head"] = t(f"{name}.head", (X, -16 * kick))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -110 * min(kick * 2, 1)), (Y, 30 * min(kick * 2, 1)))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -110 * min(kick * 2, 1)), (Y, -30 * min(kick * 2, 1)))
        return result

    def aim():
        """The gunner takes aim: the cannon tips up a little."""
        result = rest()
        result["cannon"] = t("cannon", (X, -4))
        result["gunner.body"] = t("gunner.body", (X, 12))
        result["gunner.head"] = t("gunner.head", (X, -10))
        return result

    def jolt(amount=1.0):
        """A hit shakes the cart, and the crew jumps."""
        result = rest()
        result.update(
            {
                "cart": t("cart", (Y, 6 * amount), (X, -3 * amount)),
                "cart@loc": at("cart", (0, 0.02 * amount, 0.01 * amount)),
                "flag": t("flag", (X, -20 * amount)),
            }
        )
        for name in GOBLINS:
            result[f"{name}.body@loc"] = at(f"{name}.body", (0, 0, 0.02 * amount))
            result[f"{name}.body"] = t(f"{name}.body", (X, -14 * amount))
            result[f"{name}.head"] = t(f"{name}.head", (X, -20 * amount))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -60 * amount), (Y, 30 * amount))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -60 * amount), (Y, -30 * amount))
        return result

    def tipped(bounce=0.0):
        """The cart falls on its right side, toward the camera, and the crew tumbles out."""
        result = rest()
        result.update(
            {
                "root": t("root", (Y, -84 + bounce)),
                "root@loc": at("root", (-0.04, 0, 0.33)),
                "wheel.FR": t("wheel.FR", (X, 40)),
                "wheel.BL": t("wheel.BL", (X, -30)),
                "cannon": t("cannon", (Z, 14)),
                "gear": t("gear", (X, 40)),
                "flag": t("flag", (X, 40)),
            }
        )
        for index, name in enumerate(GOBLINS):
            result[f"{name}.body"] = t(f"{name}.body", (Y, -50 - 10 * index), (X, 20))
            result[f"{name}.head"] = t(f"{name}.head", (X, -20), (Z, 30))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -140), (Y, 20))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -100), (Y, -40))
        return result

    def tilting():
        """Halfway over, on two wheels."""
        result = rest()
        result.update({"root": t("root", (Y, -30)), "root@loc": at("root", (-0.06, 0, 0.12)), "flag": t("flag", (X, -20))})
        for name in GOBLINS:
            result[f"{name}.body"] = t(f"{name}.body", (Y, 20))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -120))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -120))
        return result

    def landing(height=0.0, squash=0.0):
        """A summon: the cart drops onto the Square, bounces, and the crew cheers."""
        result = rest()
        result["root@loc"] = at("root", (0, 0, height))
        result["cart@loc"] = at("cart", (0, 0, -0.02 * squash))
        result["cart"] = t("cart", (X, 3 * squash))
        return result

    def cheer(base):
        result = dict(base)
        for name in GOBLINS:
            result[f"{name}.body@loc"] = at(f"{name}.body", (0, 0, 0.015))
            result[f"{name}.head"] = t(f"{name}.head", (X, -18))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -160), (Y, 20))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -160), (Y, -20))
        return result

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 4):
        rumble = 1 if (frame // 4) % 2 else -1
        idle.key(frame, rest(rumble if frame not in (0, 48) else 0, frame / 48 * 360, math.sin(frame / 48 * 2 * math.pi), math.sin(frame / 48 * 2 * math.pi)))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame in range(0, 49, 6):
        low.key(frame, broken(math.sin(frame / 48 * 2 * math.pi)))
    clips.append(low)

    # One turn of the wheels for each Square (`STEPS_PER_SQUARE`), with four bumps.
    walk = Clip("walk", 24, loop=True)
    for frame in range(0, 25, 3):
        walk.key(frame, rolling(frame / 24 * 360, math.sin(frame / 24 * 4 * math.pi)))
    clips.append(walk)

    # The shot leaves at 20% of the attack (`FLIGHT_START` in fx.ts): frame 6 of 30.
    attack = Clip("attack", 30)
    attack.key(0, rest()).key(4, aim()).key(5, aim()).key(6, fire(0.3, 1.4)).key(8, fire(1.0, 0.8))
    attack.key(11, fire(0.7, 0.0)).key(18, fire(0.2, 0.0)).key(24, rest()).key(30, rest())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt()).key(8, jolt(0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(5, jolt()).key(14, tilting())
    death.key(24, tipped()).key(28, tipped(6)).key(36, tipped())
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then rights itself.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt()).key(12, tilting()).key(20, tipped()).key(22, tipped(3))
    rebirth.key(32, tilting()).key(38, landing(0.0, 1.0)).key(42, cheer(rest())).key(48, rest())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, landing(0.16)).key(8, landing(0.0, 1.0)).key(12, landing(0.03)).key(15, landing(0.0, 0.5))
    summon.key(19, cheer(rest())).key(24, rest())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "grand-gearjammer.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
