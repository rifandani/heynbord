"""
Boss Snikkit (`goblin.bossSnikkit`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an old goblin boss in a mine cart
of riveted iron on four small wheels, full of black bombs with lit fuses. He
has a tall gold crown with red and green gems, very large ears, a long white
beard and a wide grin, a red ragged collar, gold chains, a burning brass
torch in the right hand and an hourglass on a chain over the front of the
cart. A red cloth with a gold crown hangs on the side of the cart. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/boss-snikkit.glb`; then
`bun unit-model:pack boss-snikkit` packs it for the game.

The cart is a machine, not a figure: the cart bone carries the body and the
wheels turn. He sits on the camera side of the cart, and the torch is in the
right hand, on the camera side. He attacks in melee with Fire: the cart
jumps forward and the torch comes down at 50% of the attack.
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

from clips.base import Beat  # noqa: E402
from clips.overrides import Fall, Patch  # noqa: E402
from unit_model_kit import X, Y, Z, Part, faces_of, hex_color, lerp  # noqa: E402

plan = body_plans.BODY_PLANS["machine"]

# --- Palette (the card painting) ----------------------------------------------

IRON = hex_color("#59493e")
IRON_DARK = hex_color("#2c1e18")
RUST = hex_color("#8a5232")
BRASS = hex_color("#e4a75a")
BRASS_DARK = hex_color("#97642a")
GOLD = hex_color("#f7c15c")
GOLD_DARK = hex_color("#c28943")
RUBY = hex_color("#c4202a")
EMERALD = hex_color("#2aa860")
BOMB = hex_color("#241a1c")
FUSE = hex_color("#c8a878")
SPARK = hex_color("#ffb43a")
SKIN = hex_color("#c9a68b")
SKIN_DARK = hex_color("#90735a")
EAR = hex_color("#e0a08e")
BEARD = hex_color("#efece4")
BEARD_DARK = hex_color("#a9987b")
EYES = hex_color("#f4e2a6")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a1e1c")
TEETH = hex_color("#f4ecd2")
RED = hex_color("#b3322a")
RED_DARK = hex_color("#741e1a")
ROBE = hex_color("#6a3a2a")
GLASS = hex_color("#f2c46a")
SAND = hex_color("#c4823a")
FLAME = hex_color("#ffa22b")
FLAME_CORE = hex_color("#ffe7a0")
EMBER = hex_color("#ec692a")

# --- Proportions ---------------------------------------------------------------

# The cart rocks about the middle of its floor. The small wheels turn twice for
# each Square (`STEPS_PER_SQUARE`).
TABLE = plan.Proportions(
    carrier_y=0.0,
    carrier_z=0.075,
    carrier_tip_y=-0.1,
    carrier_tip_z=0.075,
    axle_z=0.075,
    wheel_x=0.15,
    front_y=-0.17,
    back_y=0.17,
    wheel_tip_z=0.05,
    wheel_turns=2,
)
# The wheel touches the ground.
WHEEL_R = TABLE.axle_z
RIM_Z = 0.37

WHEELS = {name: Vector(center) for name, center in plan.wheel_centers(TABLE).items()}

# The boss sits a little to the camera side, with the bombs in front of him.
SEAT = Vector((-0.02, 0.05, 0.3))
NECK = Vector((-0.02, 0.04, 0.5))
HEAD_C = Vector((-0.02, 0.025, 0.57))
SL = Vector((0.065, 0.04, 0.47))
HAND_L = Vector((0.15, -0.04, 0.39))
SR = Vector((-0.105, 0.04, 0.47))
ER = Vector((-0.18, 0.02, 0.52))
WR = Vector((-0.18, -0.01, 0.61))
TORCH_TOP = WR + Vector((0, -0.01, 0.2))

TRUNK_BONES = [
    ("cloth", (-0.2, 0.0, 0.35), (-0.21, 0.0, 0.2), "cart"),
    ("body", tuple(SEAT), tuple(NECK), "cart"),
    ("head", tuple(NECK), tuple(NECK + Vector((0, 0, 0.16))), "body"),
    ("arm.L", tuple(SL), tuple(HAND_L), "body"),
    ("upperarm.R", tuple(SR), tuple(ER), "body"),
    ("forearm.R", tuple(ER), tuple(WR), "upperarm.R"),
    ("torch", tuple(WR), tuple(WR + Vector((0, 0, 0.08))), "forearm.R"),
    ("flame", tuple(TORCH_TOP - Vector((0, 0, 0.03))), tuple(TORCH_TOP + Vector((0, 0, 0.06))), "torch"),
]


def cart_point(u, v, w):
    """A point on the cart box: `u` across (-1 is the right side), `v` along (-1 is the front), `w` up (0 is the floor)."""
    half_x = lerp(0.15, 0.19, w)
    half_y = lerp(0.2, 0.25, w)
    return Vector((u * half_x, v * half_y, lerp(0.11, RIM_Z, w)))


# The bomb pile stands on the floor of the cart, and the hourglass hangs from the front rim.
# Each prop has its own bone, so each prop is near the bone that holds it.
BOMB_PILE = Vector((0.0, -0.03, 0.31))
CHAIN_TOP = cart_point(-0.45, -1, 1.0) + Vector((0, -0.005, 0))
GLASS_C = cart_point(-0.45, -1, 0.55) + Vector((0, -0.03, 0))

PROP_BONES = [
    ("bombs", tuple(BOMB_PILE), tuple(BOMB_PILE + Vector((0, 0, 0.1))), "cart"),
    ("hourglass", tuple(CHAIN_TOP), tuple(GLASS_C), "cart"),
]

# --- Parts ---------------------------------------------------------------------


def cart_parts():
    parts = []
    cart = Part("cart", IRON, "cart", shade=0.14)
    # Each iron wall is a closed plate. The plates overlap at the corners.
    # A single hollow shell has concave floor corners with no outward hemisphere.
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    kit.box(cart.bm, (0, 0, 0.13), (0.3, 0.4, 0.04))
    for index, (u, v) in enumerate(corners):
        u2, v2 = corners[(index + 1) % 4]
        along = Vector((u2 - u, v2 - v, 0)).normalized() * 0.002
        outer = [cart_point(u, v, 0) - along, cart_point(u2, v2, 0) + along,
                 cart_point(u2, v2, 1) + along, cart_point(u, v, 1) - along]
        inward = Vector((-(u + u2), -(v + v2), 0)).normalized() * 0.018
        vertices = [cart.bm.verts.new(point) for point in outer + [point + inward for point in outer]]
        for face_indices in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)):
            face = cart.bm.faces.new([vertices[i] for i in face_indices])
            if face_indices != (0, 1, 2, 3):
                cart.paint([face], IRON_DARK)
    kit.bmesh.ops.recalc_face_normals(cart.bm, faces=list(cart.bm.faces))
    # Brass straps at the corners and across the walls, with rivets.
    for u, v in corners:
        strap = kit.tube(cart.bm, [cart_point(u, v, 0) + Vector((0, 0, 0.0)), cart_point(u, v, 1)], [0.016, 0.016], 4)
        cart.paint(faces_of(strap), BRASS)
    for w in (0.25, 0.75):
        for u, v, u2, v2 in ((-1, -1, -1, 1), (1, -1, 1, 1), (-1, -1, 1, -1), (-1, 1, 1, 1)):
            band = kit.tube(cart.bm, [cart_point(u, v, w) * 1.0 + Vector((0.006 * u, 0.006 * v, 0)), cart_point(u2, v2, w) + Vector((0.006 * u2, 0.006 * v2, 0))], [0.007, 0.007], 4)
            cart.paint(faces_of(band), BRASS_DARK if w < 0.5 else RUST)
    # Separate straight bars keep the corner rings from turning into each other.
    for (u, v), (u2, v2) in zip(corners, corners[1:] + corners[:1]):
        rim = kit.cone(cart.bm, cart_point(u, v, 1.0), cart_point(u2, v2, 1.0), 0.014, 0.014, 4)
        cart.paint(faces_of(rim), BRASS)
    # The gold crown on the front wall.
    front = cart_point(0, -1, 0.55) + Vector((0, -0.012, 0))
    crown = set(kit.box(cart.bm, front + Vector((0, 0, -0.03)), (0.1, 0.012, 0.03)))
    for dx, h in ((-0.04, 0.06), (0.0, 0.08), (0.04, 0.06)):
        crown |= set(kit.cone(cart.bm, front + Vector((dx, 0, -0.02)), front + Vector((dx, -0.002, -0.02 + h)), 0.018, 0.002, 4, squash=0.4))
    cart.paint(faces_of(crown), GOLD)
    # The axles.
    for y in (TABLE.front_y, TABLE.back_y):
        axle = kit.cone(cart.bm, (TABLE.wheel_x, y, TABLE.axle_z), (-TABLE.wheel_x, y, TABLE.axle_z), 0.012, 0.012, 6)
        cart.paint(faces_of(axle), IRON_DARK)
    parts.append(cart)

    # Bombs with lit fuses, in the front of the cart and on the rim.
    bombs = Part("bombs", BOMB, "bombs", shade=0.12)
    for x, y, z, r in ((0.08, -0.14, 0.36, 0.055), (-0.06, -0.16, 0.355, 0.05), (0.01, -0.07, 0.37, 0.05), (0.12, 0.02, 0.37, 0.05), (0.1, 0.14, 0.36, 0.045), (-0.13, -0.06, 0.35, 0.045)):
        c = Vector((x, y, z))
        kit.sphere(bombs.bm, c, (r, r, r), 10, 7)
        cap = kit.cone(bombs.bm, c + Vector((0, 0, r * 0.85)), c + Vector((0, 0, r * 1.15)), r * 0.35, r * 0.32, 6)
        bombs.paint(faces_of(cap), IRON)
        fuse = kit.tube(bombs.bm, [c + Vector((0, 0, r * 1.1)), c + Vector((0.01, -0.01, r * 1.5)), c + Vector((0.02, -0.005, r * 1.75))], [0.005] * 3, 4)
        bombs.paint(faces_of(fuse), FUSE)
        spark = kit.sphere(bombs.bm, c + Vector((0.02, -0.005, r * 1.82)), (0.013, 0.013, 0.013), 5, 3)
        bombs.paint(faces_of(spark), SPARK)
    parts.append(bombs)

    # The red cloth with a gold crown on the camera side of the cart.
    cloth = Part("cloth", RED, "cloth", shade=0.1)
    columns, rows = 4, 5

    def grid(offset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = lerp(-1, 1, column / columns)
                torn = 0.025 * v * (((column * 7) % 5) / 4) if row == rows else 0.0
                base = cart_point(-1, u * 0.6, lerp(1.0, 0.25, v))
                line.append((base.x - 0.012 - offset, base.y, base.z + torn))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if 1 <= row <= 2 and 1 <= column <= 2:
            return GOLD
        return RED_DARK if row == rows - 1 else RED

    kit.panel(cloth, grid(0.0), grid(0.006), color_of)
    parts.append(cloth)
    return parts


def wheel_parts():
    parts = []
    for name, c in WHEELS.items():
        side = 1 if c.x > 0 else -1
        wheel = Part(f"wheel.{name}", IRON_DARK, f"wheel.{name}", shade=0.04)
        kit.cone(wheel.bm, c - Vector((0.018 * side, 0, 0)), c + Vector((0.018 * side, 0, 0)), WHEEL_R, WHEEL_R, 12)
        # The flange on the inside, as on a rail wheel.
        flange = kit.cone(wheel.bm, c - Vector((0.026 * side, 0, 0)), c - Vector((0.016 * side, 0, 0)), WHEEL_R + 0.012, WHEEL_R + 0.012, 12)
        wheel.paint(faces_of(flange), IRON)
        hub = kit.cone(wheel.bm, c + Vector((0.018 * side, 0, 0)), c + Vector((0.03 * side, 0, 0)), 0.03, 0.022, 8)
        wheel.paint(faces_of(hub), BRASS)
        # Holes in the wheel, so that the turn shows.
        for step in range(4):
            a = 2 * math.pi * step / 4
            hole = kit.sphere(wheel.bm, c + Vector((0.019 * side, math.cos(a) * 0.045, math.sin(a) * 0.045)), (0.004, 0.014, 0.014), 6, 4)
            wheel.paint(faces_of(hole), RUST)
        parts.append(wheel)
    return parts


def boss_parts():
    parts = []
    body = Part("body", ROBE, "body", shade=0.12)
    kit.cone(body.bm, SEAT, NECK - Vector((0, 0, 0.01)), 0.1, 0.07, 10, squash=0.85)
    # A red ragged collar over the shoulders, and gold chains.
    collar = kit.cone(body.bm, NECK - Vector((0, -0.005, 0.07)), NECK + Vector((0, 0.01, 0.005)), 0.115, 0.05, 12, caps=False, squash=0.85)
    body.paint(faces_of(collar), RED)
    for index in range(10):
        a = math.radians(-180 + index * 36)
        tip = NECK + Vector((0.13 * math.sin(a), 0.11 * math.cos(a) * -1 + 0.01, -0.1 - 0.02 * (index % 2)))
        flap = kit.cone(body.bm, NECK + Vector((0.08 * math.sin(a), -0.07 * math.cos(a), -0.045)), tip, 0.03, 0.002, 4, squash=0.4)
        body.paint(faces_of(flap), RED_DARK if index % 2 else RED)
    for drop, radius in ((0.07, 0.07), (0.1, 0.085)):
        chain = kit.torus(body.bm, NECK - Vector((0, 0.03, drop)), (0, 0.6, 1), radius, 0.006, 14, 3)
        body.paint(faces_of(chain), GOLD)
    medal = kit.cone(body.bm, NECK + Vector((0, -0.1, -0.13)), NECK + Vector((0, -0.11, -0.13)), 0.024, 0.024, 8)
    body.paint(faces_of(medal), GOLD_DARK)
    parts.append(body)

    head = Part("head", SKIN, "head", shade=0.1)
    c = HEAD_C
    kit.sphere(head.bm, c, (0.072, 0.07, 0.068), 12, 9)
    kit.cone(head.bm, c + Vector((0, -0.064, 0.0)), c + Vector((0, -0.11, -0.025)), 0.018, 0.003, 6)
    for sign in (1, -1):
        # Very large ears, out to the sides and up.
        ear = kit.cone(head.bm, c + Vector((0.064 * sign, 0.0, 0.005)), c + Vector((0.23 * sign, 0.04, 0.06)), 0.05, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
        eye = kit.sphere(head.bm, c + Vector((0.03 * sign, -0.058, 0.014)), (0.022, 0.012, 0.02), 8, 6)
        head.paint(faces_of(eye), EYES)
        pupil = kit.sphere(head.bm, c + Vector((0.028 * sign, -0.07, 0.012)), (0.009, 0.004, 0.01), 6, 4)
        head.paint(faces_of(pupil), PUPIL)
        brow = kit.box(head.bm, c + Vector((0.032 * sign, -0.062, 0.04)), (0.034, 0.012, 0.008))
        head.paint(faces_of(brow), SKIN_DARK)
    # The wide grin with teeth.
    mouth = kit.sphere(head.bm, c + Vector((0, -0.058, -0.035)), (0.044, 0.014, 0.018), 10, 5)
    head.paint(faces_of(mouth), MOUTH)
    teeth = kit.box(head.bm, c + Vector((0, -0.07, -0.028)), (0.06, 0.008, 0.01))
    head.paint(faces_of(teeth), TEETH)
    parts.append(head)

    beard = Part("beard", BEARD_DARK, "head", shade=0.12)
    # A long white beard from the cheeks, down over the chest.
    # Separate shaded locks replace the flat white beard panel.
    for index in range(3):
        x = (index - 1) * 0.032
        root = c + Vector((x, -0.05, -0.045))
        tip = c + Vector((x * 0.7, -0.09, -0.2 + abs(index - 1) * 0.025))
        lock = kit.cone(beard.bm, root, tip, 0.027, 0.004, 7, squash=0.7)
        beard.paint([face for face in faces_of(lock) if face.normal.x < -0.4], BEARD)
        cuff = kit.cone(beard.bm, root.lerp(tip, 0.65), root.lerp(tip, 0.71), 0.014, 0.012, 7)
        beard.paint(faces_of(cuff), GOLD_DARK)
    for sign in (1, -1):
        strand = kit.cone(beard.bm, c + Vector((0.05 * sign, -0.03, -0.03)), c + Vector((0.07 * sign, -0.07, -0.17)), 0.03, 0.004, 6, squash=0.6)
        beard.paint(faces_of(strand), BEARD_DARK)
        tuft = kit.cone(beard.bm, c + Vector((0.06 * sign, 0.0, 0.03)), c + Vector((0.1 * sign, 0.03, 0.05)), 0.02, 0.003, 5)
        beard.paint(faces_of(tuft), BEARD)
    parts.append(beard)

    # The tall gold crown with gems.
    crown = Part("crown", GOLD, "head", shade=0.08)
    band_c = c + Vector((0, 0.005, 0.045))
    band = kit.cone(crown.bm, band_c, band_c + Vector((0, 0, 0.105)), 0.07, 0.08, 12)
    # Dark brass on the back gives the crown the metal shade of the card.
    crown.paint([face for face in faces_of(band) if face.normal.y > 0.2], GOLD_DARK)
    for index in range(8):
        a = 2 * math.pi * index / 8
        out = Vector((math.sin(a), -math.cos(a), 0))
        base = band_c + out * 0.074 + Vector((0, 0, 0.1))
        height = 0.18 if index % 2 == 0 else 0.14
        point = kit.cone(crown.bm, base, base + out * 0.03 + Vector((0, 0, height)), 0.024, 0.003, 4)
        for face in faces_of(point):
            crown.paint([face], GOLD_DARK if face.normal.y > 0.2 else (GOLD if index % 2 == 0 else GOLD_DARK))
        knob = kit.sphere(crown.bm, base + out * 0.031 + Vector((0, 0, height + 0.006)), (0.009, 0.009, 0.009), 5, 3)
        crown.paint(faces_of(knob), GOLD)
    for index, (angle, gem) in enumerate(((0, RUBY), (45, EMERALD), (-45, EMERALD), (90, RUBY), (-90, RUBY))):
        a = math.radians(angle)
        out = Vector((math.sin(a), -math.cos(a), 0))
        stone = kit.sphere(crown.bm, band_c + out * 0.08 + Vector((0, 0, 0.025)), (0.016 if index == 0 else 0.011,) * 3, 6, 4)
        crown.paint(faces_of(stone), gem)
    parts.append(crown)

    # The left arm rests on the rim of the cart.
    arm = Part("arm.L", ROBE, "arm.L", shade=0.06)
    elbow = SL.lerp(HAND_L, 0.5) + Vector((0.025, 0.02, 0.01))
    kit.tube(arm.bm, [SL, elbow, HAND_L], [0.026, 0.022, 0.018], 6)
    hand = kit.sphere(arm.bm, HAND_L + Vector((0, -0.01, 0)), (0.022, 0.02, 0.02), 6, 4)
    arm.paint(faces_of(hand), SKIN)
    cuff = kit.torus(arm.bm, HAND_L - (HAND_L - elbow).normalized() * 0.02, (HAND_L - elbow).normalized(), 0.022, 0.006, 8, 3)
    arm.paint(faces_of(cuff), GOLD)
    parts.append(arm)

    upper = Part("upperarm.R", ROBE, "upperarm.R", shade=0.06)
    kit.tube(upper.bm, [SR, ER], [0.026, 0.022], 6)
    parts.append(upper)
    forearm = Part("forearm.R", ROBE, "forearm.R", shade=0.06)
    kit.tube(forearm.bm, [ER, WR - Vector((0, 0, 0.02))], [0.022, 0.018], 6)
    hand = kit.sphere(forearm.bm, WR, (0.024, 0.022, 0.024), 6, 4)
    forearm.paint(faces_of(hand), SKIN)
    cuff = kit.torus(forearm.bm, WR - Vector((0, 0, 0.025)), (0, 0, 1), 0.022, 0.006, 8, 3)
    forearm.paint(faces_of(cuff), GOLD)
    parts.append(forearm)

    # The hourglass on a chain, over the front of the cart (Last Breath).
    glass = Part("hourglass", BRASS, "hourglass", shade=0.06)
    gc = GLASS_C
    chain = kit.tube(glass.bm, [CHAIN_TOP, gc + Vector((0, 0, 0.05))], [0.003, 0.003], 4)
    glass.paint(faces_of(chain), GOLD)
    for dz in (0.042, -0.042):
        kit.cone(glass.bm, gc + Vector((0, 0, dz - 0.006)), gc + Vector((0, 0, dz + 0.006)), 0.026, 0.026, 8)
    for dx, dy in ((0.018, 0.018), (-0.018, 0.018), (0.018, -0.018), (-0.018, -0.018)):
        kit.tube(glass.bm, [gc + Vector((dx, dy, -0.04)), gc + Vector((dx, dy, 0.04))], [0.003, 0.003], 4)
    bulb = set(kit.cone(glass.bm, gc + Vector((0, 0, -0.036)), gc, 0.02, 0.004, 8))
    bulb |= set(kit.cone(glass.bm, gc, gc + Vector((0, 0, 0.036)), 0.004, 0.02, 8))
    glass.paint(faces_of(bulb), GLASS)
    sand = kit.cone(glass.bm, gc + Vector((0, 0, -0.036)), gc + Vector((0, 0, -0.016)), 0.018, 0.008, 8)
    glass.paint(faces_of(sand), SAND)
    parts.append(glass)
    return parts


def torch_parts():
    parts = []
    torch = Part("torch", BRASS, "torch", shade=0.06)
    bottom = WR - Vector((0, 0, 0.07))
    kit.cone(torch.bm, bottom, TORCH_TOP - Vector((0, 0, 0.06)), 0.012, 0.014, 6)
    knob = kit.sphere(torch.bm, bottom, (0.016, 0.016, 0.016), 6, 4)
    torch.paint(faces_of(knob), BRASS_DARK)
    # The cage at the top that holds the fire.
    cup = kit.cone(torch.bm, TORCH_TOP - Vector((0, 0, 0.065)), TORCH_TOP - Vector((0, 0, 0.03)), 0.016, 0.034, 8)
    torch.paint(faces_of(cup), BRASS_DARK)
    for step in range(4):
        a = 2 * math.pi * step / 4 + 0.4
        out = Vector((math.cos(a), math.sin(a), 0))
        kit.tube(torch.bm, [TORCH_TOP - Vector((0, 0, 0.03)) + out * 0.032, TORCH_TOP + Vector((0, 0, 0.02)) + out * 0.03, TORCH_TOP + Vector((0, 0, 0.04)) + out * 0.012], [0.004] * 3, 3)
    parts.append(torch)

    flame = Part("flame", FLAME, "flame", shade=0)
    base = TORCH_TOP - Vector((0, 0, 0.03))
    kit.cone(flame.bm, base, base + Vector((0, 0, 0.17)), 0.05, 0.002, 8)
    for dx, dy, dz in ((0.026, 0.0, 0.1), (-0.022, 0.01, 0.09), (0.0, -0.024, 0.08)):
        tongue = kit.cone(flame.bm, base + Vector((dx * 0.5, dy * 0.5, 0.02)), base + Vector((dx * 1.6, dy * 1.6, dz)), 0.016, 0.001, 5)
        flame.paint(faces_of(tongue), EMBER)
    core = kit.sphere(flame.bm, base + Vector((0, 0, 0.035)), (0.026, 0.026, 0.034), 8, 6)
    flame.paint(faces_of(core), FLAME_CORE)
    parts.append(flame)
    return parts


def build_figure():
    kit.reset_scene()
    rig, _ = plan.build_rig("BossSnikkit", TABLE, TRUNK_BONES, PROP_BONES)
    parts = cart_parts() + wheel_parts() + boss_parts() + torch_parts()
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "BossSnikkitMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------

LOOP = clips.machine.LOOP
WALK = clips.machine.WALK


def _idle(frame):
    """He laughs three times in each loop, and the flame flickers."""
    phase = frame / LOOP * 2 * math.pi
    laugh = abs(math.sin(phase * 3)) if frame not in (0, LOOP) else 0.0
    fire = 1.0 + 0.12 * math.sin(phase * 5)
    return Beat(frame, "stance", (laugh, math.sin(phase), fire))


PATCHES = (
    Patch("idle", "cackle", beats=tuple(_idle(frame) for frame in range(0, LOOP + 1, 4))),
    Patch("lowHp", "slump", beats=tuple(Beat(frame, "broken", (math.sin(frame / LOOP * 2 * math.pi),)) for frame in range(0, LOOP + 1, 8))),
    # The small wheels turn fast, so the walk has a key on each second frame.
    Patch("walk", "small-wheels", beats=tuple(Beat(frame, "rolling", (frame, math.sin(frame / WALK * 4 * math.pi))) for frame in range(0, WALK + 1, 2))),
    # The attack: he pulls the torch back, then the cart jumps forward and the
    # torch comes down. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the blow lands at frame 15 of 30.
    Patch(
        "attack",
        "torch-strike",
        beats=(Beat(0), Beat(9, "windup", (), (0, 0, 1.2)), Beat(15, "strike", (), (0, 0, 1.6)), Beat(19, "strike", (), (0, 0, 1.2)), Beat(26), Beat(30)),
    ),
)


class Poses(clips.machine.Poses):
    fall = Fall(Y, -84, (-0.04, 0, 0.21))
    table = TABLE

    def stance(self, laugh=0.0, sway=0.0, fire=1.0):
        """
        At rest: he sits in the cart with the torch up, and laughs. The
        flame flickers with `fire`.
        """
        t, at = self.t, self.at
        return {
            "cart": t("cart", (Y, sway * 1.5)),
            "body": t("body", (Z, -10 + sway * 4), (X, -2 + laugh * 3)),
            "body@loc": at("body", (0, 0, 0.004 * laugh)),
            "head": t("head", (Z, 12 + sway * 6), (X, -6 - laugh * 8)),
            "arm.L": t("arm.L", (X, 0)),
            "upperarm.R": t("upperarm.R", (X, -sway * 4)),
            "forearm.R": t("forearm.R", (X, -6 + laugh * 4)),
            "torch": t("torch", (X, 0)),
            "flame@scale": fire,
            "flame": t("flame", (Y, sway * 6)),
            "cloth": t("cloth", (Y, sway * 4)),
            **self.wheels(0),
        }

    def broken(self, base, breath=0.0):
        """Low HP: he slumps over the rim of the cart, the torch low and the flame small."""
        t = self.t
        return {
            **self.stance(0, 0, 0.55 + 0.1 * breath),
            "body": t("body", (Z, -10), (X, 26 + breath * 3), (Y, -8)),
            "head": t("head", (Z, 6), (X, 20 + breath * 5), (Y, -12)),
            "upperarm.R": t("upperarm.R", (X, 40), (Y, -20)),
            "forearm.R": t("forearm.R", (X, 60)),
            "torch": t("torch", (X, -50)),
            "flame": t("flame", (X, -40)),
            "arm.L": t("arm.L", (X, 10)),
            "cart": t("cart", (Y, -3)),
        }

    def rolling(self, base, frame, bump=0.0):
        """The cart rolls on its small wheels: they turn fast, and he holds on."""
        t, at = self.t, self.at
        return {
            **self.stance(0, bump * 0.5, 1.1),
            **self.wheels(plan.rolling_angle(self.table, frame, WALK)),
            "cart@loc": at("cart", (0, 0, 0.008 * abs(bump))),
            "cart": t("cart", (X, 2 * bump), (Y, bump)),
            "body": t("body", (Z, -10), (X, 10)),
            "head": t("head", (Z, 8), (X, -8)),
            "upperarm.R": t("upperarm.R", (X, -20)),
            "forearm.R": t("forearm.R", (X, -30)),
            "flame": t("flame", (X, 30)),
        }

    def windup(self, base):
        """He pulls the torch back, and the cart rolls back a little."""
        t, at = self.t, self.at
        return {
            **base,
            "root@loc": at("root", (0, 0.03, 0)),
            "cart": t("cart", (X, -4)),
            "body": t("body", (Z, -16), (X, -10)),
            "head": t("head", (Z, 14), (X, -10)),
            "upperarm.R": t("upperarm.R", (X, -40), (Y, -10)),
            "forearm.R": t("forearm.R", (X, 40)),
            "flame": t("flame", (X, -20)),
        }

    def strike(self, base):
        """The cart jumps forward and the torch comes down."""
        t, at = self.t, self.at
        return {
            **base,
            "root@loc": at("root", (0, -0.1, 0)),
            "cart": t("cart", (X, 5)),
            "body": t("body", (Z, -4), (X, 22)),
            "head": t("head", (Z, 4), (X, -12)),
            "upperarm.R": t("upperarm.R", (X, -50), (Y, -10)),
            "forearm.R": t("forearm.R", (X, -80)),
            "torch": t("torch", (X, -20)),
            "flame": t("flame", (X, 70)),
            **self.wheels(-60),
        }

    def jolt(self, base, amount=1.0):
        """A hit shakes the cart and throws him back. The flame becomes small."""
        t = self.t
        return {
            **super().jolt(self.stance(0, 0, 1.0 - 0.3 * amount), amount),
            "cart": t("cart", (Y, 6 * amount), (X, -4 * amount)),
            "body": t("body", (Z, -10), (X, -16 * amount)),
            "head": t("head", (Z, 12), (X, -20 * amount)),
            "upperarm.R": t("upperarm.R", (X, 20 * amount), (Y, -20 * amount)),
            "arm.L": t("arm.L", (X, -40 * amount)),
            "cloth": t("cloth", (X, -20 * amount)),
        }

    def tilting(self, base):
        """Halfway over, on two wheels. The small cart stays lower."""
        t, at = self.t, self.at
        return {
            **super().tilting(self.stance(0, 0, 0.6)),
            "root@loc": at("root", (-0.05, 0, 0.08)),
            "body": t("body", (Z, -10), (Y, 20)),
            "arm.L": t("arm.L", (X, -80)),
            "upperarm.R": t("upperarm.R", (Y, -30)),
            "cloth": t("cloth", (Y, 30)),
        }

    def tipped(self, base, bounce=0.0):
        """He tumbles out, and the fire goes out."""
        t = self.t
        return {
            **super().tipped(self.stance(0, 0, 0.0), bounce),
            # He hangs out of the cart: a lean to his left keeps him above the ground.
            "body": t("body", (Y, 24), (X, 20)),
            "head": t("head", (X, -10), (Z, 30), (Y, 20)),
            "arm.L": t("arm.L", (X, -120)),
            "upperarm.R": t("upperarm.R", (Y, -40), (X, 30)),
            "forearm.R": t("forearm.R", (X, 30)),
            "wheel.FR": t("wheel.FR", (X, 40)),
            "wheel.BL": t("wheel.BL", (X, -60)),
            "cloth": t("cloth", (X, 30)),
        }

    def landing(self, base, height=0.0, squash=0.0):
        """A summon: the cart drops onto the Square and bounces, and he sinks into it."""
        at = self.at
        return {
            **self.stance(0, 0, 1.0),
            "root@loc": at("root", (0, 0, height)),
            "cart@loc": at("cart", (0, 0, -0.012 * squash)),
            "body@loc": at("body", (0, 0, -0.02 * squash)),
        }

    def cheer(self, base):
        """The torch high and a big laugh."""
        t = self.t
        return {
            **base,
            "body": t("body", (Z, -10), (X, -10)),
            "head": t("head", (Z, 10), (X, -24)),
            "upperarm.R": t("upperarm.R", (X, -30), (Y, 20)),
            "forearm.R": t("forearm.R", (X, -10)),
            "flame@scale": 1.4,
        }


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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "boss-snikkit.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
