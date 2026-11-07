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

import body_plans  # noqa: E402
import clips  # noqa: E402
import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)
importlib.reload(body_plans.shared)
importlib.reload(body_plans.machine)
importlib.reload(clips.base)
importlib.reload(clips.overrides)
importlib.reload(clips.machine)

from clips.overrides import Patch  # noqa: E402
from unit_model_kit import X, Y, Z, Part, faces_of, hex_color  # noqa: E402

plan = body_plans.BODY_PLANS["machine"]

# --- Palette (the card painting) ----------------------------------------------

WOOD = hex_color("#6a4428")
WOOD_DARK = hex_color("#4a2e1a")
IRON = hex_color("#61544f")
IRON_DARK = hex_color("#423935")
RUST = hex_color("#8a5a34")
BRASS = hex_color("#dca759")
BRASS_DARK = hex_color("#946930")
GLOW = hex_color("#a8ff3e")
GLOW_DARK = hex_color("#5fae22")
RED = hex_color("#984b36")
SKIN = hex_color("#d2af90")
SKIN_DARK = hex_color("#687a3c")
EAR = hex_color("#d79a8a")
HAIR = hex_color("#f9f7e5")
EYES = hex_color("#f2c040")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a2a26")
LENS = hex_color("#2c3a46")
CLOTH = hex_color("#6a4a30")
VEST = hex_color("#883c2a")
CANVAS = hex_color("#b8a47c")
CLOCK = hex_color("#f2ead6")
FLASH = hex_color("#ffd36a")
FLASH_HOT = hex_color("#fff3c4")

# --- Proportions ---------------------------------------------------------------

# The cart pitches about the rear axle.
TABLE = plan.Proportions()
# The wheel touches the ground.
WHEEL_R = TABLE.axle_z
DECK_Z = 0.34
CANNON_Z = 0.47
CANNON_BACK = 0.12
CANNON_FRONT = -0.44
GEAR_C = Vector((0.14, 0.26, 0.6))
GEAR_R = 0.13

WHEELS = {name: Vector(center) for name, center in plan.wheel_centers(TABLE).items()}

# The crew: where each goblin sits on the deck, and which way it looks (degrees to its left).
GOBLINS = {
    "gunner": (Vector((-0.08, 0.14, DECK_Z)), 0, 1.25),
    "driver": (Vector((0.03, 0.28, DECK_Z + 0.02)), 10, 1.3),
    "scout": (Vector((-0.12, -0.17, DECK_Z)), -20, 1.1),
}

TRUNK_BONES = [
    ("cannon", (0, CANNON_BACK, CANNON_Z), (0, CANNON_BACK - 0.1, CANNON_Z), "cart"),
    ("flash", (0, CANNON_FRONT, CANNON_Z), (0, CANNON_FRONT - 0.05, CANNON_Z), "cannon"),
    ("gear", tuple(GEAR_C), tuple(GEAR_C + Vector((0, 0, 0.08))), "cart"),
    ("flag", tuple(GEAR_C + Vector((0, 0, GEAR_R))), tuple(GEAR_C + Vector((0, 0, GEAR_R + 0.1))), "cart"),
]
CREW_BONES = [bone for name, (base, _yaw, size) in GOBLINS.items() for bone in plan.crew_bones(name, base, size, "cart")]

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
    # The rear pivot has a sleeve with three rings. Its top is inside the chassis.
    pivot = Vector((0, TABLE.carrier_y, TABLE.carrier_z))
    kit.tube(cart.bm, [pivot + Z * step for step in (-0.025, 0, 0.025)], [0.022] * 3, 8)
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
    for y in (TABLE.front_y, TABLE.back_y):
        axle = kit.cone(cart.bm, (TABLE.wheel_x, y, TABLE.axle_z), (-TABLE.wheel_x, y, TABLE.axle_z), 0.014, 0.014, 6)
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
        spike = kit.cone(flash.bm, tip + out * 0.025, tip + Vector((0, -0.05, 0)) + out, 0.024, 0.002, 4)
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
    # The rear standard faces front and back, as in the approved views.
    top = Vector((0, c.y + 0.02, c.z + GEAR_R + 0.18))
    pole = kit.cone(flag.bm, (0, top.y, DECK_Z), top + Z * 0.02, 0.008, 0.006, 6)
    flag.paint(faces_of(pole), BRASS_DARK)
    bar = kit.cone(flag.bm, top + Vector((-0.145, 0, -0.035)), top + Vector((0.145, 0, -0.035)), 0.007, 0.007, 6)
    flag.paint(faces_of(bar), BRASS)
    for sign in (1, -1):
        grid_front, grid_back = [], []
        for row in range(4):
            line_f, line_b = [], []
            for column in range(4):
                x = sign * (0.025 + column * 0.035)
                wave = 0.008 * math.sin(column * 1.3 + row)
                z = top.z - 0.04 - row * 0.06 - (0.012 * (column % 2) if row == 3 else 0)
                line_f.append((x, top.y + wave - 0.003, z))
                line_b.append((x, top.y + wave + 0.003, z))
            # A right-handed panel on either side of the mast.
            grid_front.append(line_f if sign > 0 else list(reversed(line_f)))
            grid_back.append(line_b if sign > 0 else list(reversed(line_b)))
        kit.panel(flag, grid_front, grid_back, lambda face_side, row, column: RED)
    parts.append(flag)
    return parts


def goblin_parts(name, base, yaw, size):
    """A small goblin from the waist up: the legs are down in the cart."""
    parts = []
    s = size
    look = Vector((-math.sin(math.radians(yaw)), -math.cos(math.radians(yaw)), 0))
    side = Vector((-look.y, look.x, 0))
    neck = Vector(plan.crew_neck(base, s))
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
        shoulder = Vector(plan.crew_shoulder(base, s, sign))
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
    rig, _ = plan.build_rig("GrandGearjammer", TABLE, TRUNK_BONES, CREW_BONES)
    parts = cart_parts() + wheel_parts() + cannon_parts() + gear_parts()
    for name, (base, yaw, size) in GOBLINS.items():
        parts += goblin_parts(name, base, yaw, size)
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "GrandGearjammerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


PATCHES = (
    Patch("attack", "cannon-shot"),
    Patch("death", "tip-right"),
)


class Poses(clips.machine.Poses):
    table = TABLE

    def crew(self, bob=0.0, look=0.0, arms=0.0):
        """The goblins: a small bob, the heads turn about, the arms move a little."""
        t, at = self.t, self.at
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

    def goblins(self, body, head, left, right):
        """One pose for each goblin: the rotations of its body, head and arms."""
        t = self.t
        result = {}
        for name in GOBLINS:
            result[f"{name}.body"] = t(f"{name}.body", *body)
            result[f"{name}.head"] = t(f"{name}.head", *head)
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", *left)
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", *right)
        return result

    def stance(self, rumble=0.0, gear=0.0, bob=0.0, look=0.0):
        """The gear turns, the flag moves and the crew looks about."""
        t = self.t
        return {
            **super().stance(rumble, gear, bob, look),
            "gear": t("gear", (X, gear)),
            "flag": t("flag", (Z, 6 * look)),
            "flash@scale": 0.0,
            **self.crew(bob, look),
        }

    def broken(self, base, rumble=0.0):
        """A loose wheel, and the crew slumps."""
        t = self.t
        return {
            **super().broken(base, rumble),
            "wheel.FR": t("wheel.FR", (Y, 12)),
            "cannon": t("cannon", (X, 10)),
            "flag": t("flag", (X, 30)),
            **self.goblins(((X, 24),), ((X, 20 + 4 * rumble), (Y, -10)), ((X, 20),), ((X, 20),)),
        }

    def rolling(self, base, frame, bump=0.0):
        """The crew holds on."""
        return {**super().rolling(base, frame, bump), "flag": self.t("flag", (Z, 20))}

    def aim(self, base):
        """The gunner takes aim: the cannon tips up a little."""
        t = self.t
        return {
            **base,
            "cannon": t("cannon", (X, -4)),
            "gunner.body": t("gunner.body", (X, 12)),
            "gunner.head": t("gunner.head", (X, -10)),
        }

    def fire(self, base, kick=0.0, flash=0.0):
        """The cannon kicks back, and the crew covers its ears."""
        t, at = self.t, self.at
        cover = min(kick * 2, 1)
        return {
            **super().fire(base, kick, flash),
            "cannon@loc": at("cannon", (0, 0.07 * kick, 0)),
            "cannon": t("cannon", (X, -8 * kick)),
            "flash@scale": flash,
            "flag": t("flag", (Z, 30 * kick)),
            **self.goblins(((X, -12 * kick),), ((X, -16 * kick),), ((X, -110 * cover), (Y, 30 * cover)), ((X, -110 * cover), (Y, -30 * cover))),
        }

    def jolt(self, base, amount=1.0):
        """The crew jumps."""
        t, at = self.t, self.at
        return {
            **super().jolt(base, amount),
            "flag": t("flag", (X, -20 * amount)),
            **{f"{name}.body@loc": at(f"{name}.body", (0, 0, 0.02 * amount)) for name in GOBLINS},
            **self.goblins(((X, -14 * amount),), ((X, -20 * amount),), ((X, -60 * amount), (Y, 30 * amount)), ((X, -60 * amount), (Y, -30 * amount))),
        }

    def tipped(self, base, bounce=0.0):
        """The crew tumbles out."""
        t = self.t
        result = {
            **super().tipped(base, bounce),
            "wheel.FR": t("wheel.FR", (X, 40)),
            "wheel.BL": t("wheel.BL", (X, -30)),
            "cannon": t("cannon", (Z, 14)),
            "gear": t("gear", (X, 40)),
            "flag": t("flag", (X, 40)),
        }
        for index, name in enumerate(GOBLINS):
            result[f"{name}.body"] = t(f"{name}.body", (Y, -50 - 10 * index), (X, 20))
            result[f"{name}.head"] = t(f"{name}.head", (X, -20), (Z, 30))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -140), (Y, 20))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -100), (Y, -40))
        return result

    def tilting(self, base):
        t = self.t
        result = {**super().tilting(base), "flag": t("flag", (X, -20))}
        for name in GOBLINS:
            result[f"{name}.body"] = t(f"{name}.body", (Y, 20))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -120))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -120))
        return result

    def cheer(self, base):
        """The crew cheers."""
        t, at = self.t, self.at
        result = dict(base)
        for name in GOBLINS:
            result[f"{name}.body@loc"] = at(f"{name}.body", (0, 0, 0.015))
            result[f"{name}.head"] = t(f"{name}.head", (X, -18))
            result[f"{name}.arm.L"] = t(f"{name}.arm.L", (X, -160), (Y, 20))
            result[f"{name}.arm.R"] = t(f"{name}.arm.R", (X, -160), (Y, -20))
        return result


def build_clips(rig):
    poses = Poses(*kit.pose_tools(rig))
    return clips.overrides.build(clips.machine.CLIPS, poses, PATCHES, without=("cast",))


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
