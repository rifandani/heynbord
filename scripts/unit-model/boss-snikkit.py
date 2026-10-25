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

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

IRON = hex_color("#54463c")
IRON_DARK = hex_color("#342c28")
RUST = hex_color("#8a5232")
BRASS = hex_color("#d4a24a")
BRASS_DARK = hex_color("#94692a")
GOLD = hex_color("#f0c24a")
GOLD_DARK = hex_color("#b58a2a")
RUBY = hex_color("#c4202a")
EMERALD = hex_color("#2aa860")
BOMB = hex_color("#2e2a2c")
FUSE = hex_color("#c8a878")
SPARK = hex_color("#ffb43a")
SKIN = hex_color("#9aa46a")
SKIN_DARK = hex_color("#727c46")
EAR = hex_color("#e0a08e")
BEARD = hex_color("#efece4")
BEARD_DARK = hex_color("#c4bfb2")
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
EMBER = hex_color("#ff5e1a")

# --- Proportions ---------------------------------------------------------------

AXLE_Z = 0.075
WHEEL_R = 0.075
WHEEL_X = 0.15
FRONT_Y = -0.17
BACK_Y = 0.17
RIM_Z = 0.37

WHEELS = {
    "FL": Vector((WHEEL_X, FRONT_Y, AXLE_Z)),
    "FR": Vector((-WHEEL_X, FRONT_Y, AXLE_Z)),
    "BL": Vector((WHEEL_X, BACK_Y, AXLE_Z)),
    "BR": Vector((-WHEEL_X, BACK_Y, AXLE_Z)),
}

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

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    # The cart rocks about the middle of its floor.
    ("cart", (0, 0, AXLE_Z), (0, -0.1, AXLE_Z), "root"),
    ("cloth", (-0.2, 0.0, 0.35), (-0.21, 0.0, 0.2), "cart"),
    ("body", tuple(SEAT), tuple(NECK), "cart"),
    ("head", tuple(NECK), tuple(NECK + Vector((0, 0, 0.16))), "body"),
    ("arm.L", tuple(SL), tuple(HAND_L), "body"),
    ("upperarm.R", tuple(SR), tuple(ER), "body"),
    ("forearm.R", tuple(ER), tuple(WR), "upperarm.R"),
    ("torch", tuple(WR), tuple(WR + Vector((0, 0, 0.08))), "forearm.R"),
    ("flame", tuple(TORCH_TOP - Vector((0, 0, 0.03))), tuple(TORCH_TOP + Vector((0, 0, 0.06))), "torch"),
]
for name, center in WHEELS.items():
    BONES.append((f"wheel.{name}", tuple(center), tuple(center + Vector((0, 0, 0.05))), "cart"))

# --- Parts ---------------------------------------------------------------------


def cart_point(u, v, w):
    """A point on the cart box: `u` across (-1 is the right side), `v` along (-1 is the front), `w` up (0 is the floor)."""
    half_x = lerp(0.15, 0.19, w)
    half_y = lerp(0.2, 0.25, w)
    return Vector((u * half_x, v * half_y, lerp(0.11, RIM_Z, w)))


def cart_parts():
    parts = []
    cart = Part("cart", IRON, "cart", shade=0.14)
    # The tapered box: four walls and a floor, from quads between the corners.
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    bottom = [cart.bm.verts.new(cart_point(u, v, 0)) for u, v in corners]
    top = [cart.bm.verts.new(cart_point(u, v, 1)) for u, v in corners]
    inner = [cart.bm.verts.new(cart_point(u * 0.9, v * 0.92, 1) - Vector((0, 0, 0.0))) for u, v in corners]
    floor_in = [cart.bm.verts.new(cart_point(u * 0.88, v * 0.9, 0.15)) for u, v in corners]
    cart.bm.faces.new(list(reversed(bottom)))
    for i in range(4):
        n = (i + 1) % 4
        cart.bm.faces.new((bottom[i], bottom[n], top[n], top[i]))
        rim = cart.bm.faces.new((top[i], top[n], inner[n], inner[i]))
        cart.paint([rim], IRON_DARK)
        wall = cart.bm.faces.new((inner[i], inner[n], floor_in[n], floor_in[i]))
        cart.paint([wall], IRON_DARK)
    cart.bm.faces.new(floor_in)
    kit.bmesh.ops.recalc_face_normals(cart.bm, faces=list(cart.bm.faces))
    # Brass straps at the corners and across the walls, with rivets.
    for u, v in corners:
        strap = kit.tube(cart.bm, [cart_point(u, v, 0) + Vector((0, 0, 0.0)), cart_point(u, v, 1)], [0.016, 0.016], 4)
        cart.paint(faces_of(strap), BRASS)
    for w in (0.25, 0.75):
        for u, v, u2, v2 in ((-1, -1, -1, 1), (1, -1, 1, 1), (-1, -1, 1, -1), (-1, 1, 1, 1)):
            band = kit.tube(cart.bm, [cart_point(u, v, w) * 1.0 + Vector((0.006 * u, 0.006 * v, 0)), cart_point(u2, v2, w) + Vector((0.006 * u2, 0.006 * v2, 0))], [0.007, 0.007], 4)
            cart.paint(faces_of(band), BRASS_DARK if w < 0.5 else RUST)
    rim = kit.tube(cart.bm, [cart_point(u, v, 1.0) for u, v in corners + corners[:1]], [0.014] * 5, 4)
    cart.paint(faces_of(rim), BRASS)
    # The gold crown on the front wall.
    front = cart_point(0, -1, 0.55) + Vector((0, -0.012, 0))
    crown = set(kit.box(cart.bm, front + Vector((0, 0, -0.03)), (0.1, 0.012, 0.03)))
    for dx, h in ((-0.04, 0.06), (0.0, 0.08), (0.04, 0.06)):
        crown |= set(kit.cone(cart.bm, front + Vector((dx, 0, -0.02)), front + Vector((dx, -0.002, -0.02 + h)), 0.018, 0.002, 4, squash=0.4))
    cart.paint(faces_of(crown), GOLD)
    # The axles.
    for y in (FRONT_Y, BACK_Y):
        axle = kit.cone(cart.bm, (WHEEL_X, y, AXLE_Z), (-WHEEL_X, y, AXLE_Z), 0.012, 0.012, 6)
        cart.paint(faces_of(axle), IRON_DARK)
    parts.append(cart)

    # Bombs with lit fuses, in the front of the cart and on the rim.
    bombs = Part("bombs", BOMB, "cart", shade=0.12)
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
                torn = 0.04 * v * (((column * 7) % 5) / 4) if row == rows else 0.0
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

    beard = Part("beard", BEARD, "head", shade=0.12)
    # A long white beard from the cheeks, down over the chest.
    kit.cone(beard.bm, c + Vector((0, -0.04, -0.045)), c + Vector((0, -0.09, -0.2)), 0.06, 0.008, 8, squash=0.6)
    for sign in (1, -1):
        strand = kit.cone(beard.bm, c + Vector((0.05 * sign, -0.03, -0.03)), c + Vector((0.07 * sign, -0.07, -0.17)), 0.03, 0.004, 6, squash=0.6)
        beard.paint(faces_of(strand), BEARD_DARK)
        tuft = kit.cone(beard.bm, c + Vector((0.06 * sign, 0.0, 0.03)), c + Vector((0.1 * sign, 0.03, 0.05)), 0.02, 0.003, 5)
        beard.paint(faces_of(tuft), BEARD)
    parts.append(beard)

    # The tall gold crown with gems.
    crown = Part("crown", GOLD, "head", shade=0.08)
    band_c = c + Vector((0, 0.005, 0.045))
    kit.cone(crown.bm, band_c, band_c + Vector((0, 0, 0.05)), 0.07, 0.08, 12)
    for index in range(8):
        a = 2 * math.pi * index / 8
        out = Vector((math.sin(a), -math.cos(a), 0))
        base = band_c + out * 0.074 + Vector((0, 0, 0.045))
        height = 0.1 if index % 2 == 0 else 0.07
        point = kit.cone(crown.bm, base, base + out * 0.03 + Vector((0, 0, height)), 0.024, 0.003, 4)
        crown.paint(faces_of(point), GOLD if index % 2 == 0 else GOLD_DARK)
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
    glass = Part("hourglass", BRASS, "cart", shade=0.06)
    gc = cart_point(-0.45, -1, 0.55) + Vector((0, -0.03, 0))
    chain = kit.tube(glass.bm, [cart_point(-0.45, -1, 1.0) + Vector((0, -0.005, 0)), gc + Vector((0, 0, 0.05))], [0.003, 0.003], 4)
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
    rig = kit.build_armature("BossSnikkit", BONES)
    parts = cart_parts() + wheel_parts() + boss_parts() + torch_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BossSnikkitMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def wheels(angle):
        """The wheels turn forward by `angle` degrees."""
        return {f"wheel.{name}": t(f"wheel.{name}", (X, angle)) for name in WHEELS}

    def rest(laugh=0.0, sway=0.0, fire=1.0):
        """
        At rest: he sits in the cart with the torch up, and laughs. The
        flame flickers with `fire`.
        """
        result = {
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
        }
        result.update(wheels(0))
        return result

    def slumped(breath=0.0):
        """Low HP: he slumps over the rim of the cart, the torch low and the flame small."""
        result = rest(0, 0, 0.55 + 0.1 * breath)
        result.update(
            {
                "body": t("body", (Z, -10), (X, 26 + breath * 3), (Y, -8)),
                "head": t("head", (Z, 6), (X, 20 + breath * 5), (Y, -12)),
                "upperarm.R": t("upperarm.R", (X, 40), (Y, -20)),
                "forearm.R": t("forearm.R", (X, 60)),
                "torch": t("torch", (X, -50)),
                "flame": t("flame", (X, -40)),
                "arm.L": t("arm.L", (X, 10)),
                "cart": t("cart", (Y, -3)),
            }
        )
        return result

    def rolling(angle, bump=0.0):
        """The cart rolls on its small wheels: they turn fast, and he holds on."""
        result = rest(0, bump * 0.5, 1.1)
        result.update(wheels(angle))
        result["cart@loc"] = at("cart", (0, 0, 0.008 * abs(bump)))
        result["cart"] = t("cart", (X, 2 * bump), (Y, bump))
        result["body"] = t("body", (Z, -10), (X, 10))
        result["head"] = t("head", (Z, 8), (X, -8))
        result["upperarm.R"] = t("upperarm.R", (X, -20))
        result["forearm.R"] = t("forearm.R", (X, -30))
        result["flame"] = t("flame", (X, 30))
        return result

    # The attack: he pulls the torch back, then the cart jumps forward and the
    # torch comes down. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the blow lands at frame 15 of 30.
    def windup():
        result = rest(0, 0, 1.2)
        result.update(
            {
                "root@loc": at("root", (0, 0.03, 0)),
                "cart": t("cart", (X, -4)),
                "body": t("body", (Z, -16), (X, -10)),
                "head": t("head", (Z, 14), (X, -10)),
                "upperarm.R": t("upperarm.R", (X, -40), (Y, -10)),
                "forearm.R": t("forearm.R", (X, 40)),
                "flame": t("flame", (X, -20)),
            }
        )
        return result

    def strike(fire=1.6):
        result = rest(0, 0, fire)
        result.update(
            {
                "root@loc": at("root", (0, -0.1, 0)),
                "cart": t("cart", (X, 5)),
                "body": t("body", (Z, -4), (X, 22)),
                "head": t("head", (Z, 4), (X, -12)),
                "upperarm.R": t("upperarm.R", (X, -50), (Y, -10)),
                "forearm.R": t("forearm.R", (X, -80)),
                "torch": t("torch", (X, -20)),
                "flame": t("flame", (X, 70)),
            }
        )
        result.update(wheels(-60))
        return result

    def jolt(amount=1.0):
        """A hit shakes the cart and throws him back."""
        result = rest(0, 0, 1.0 - 0.3 * amount)
        result.update(
            {
                "cart": t("cart", (Y, 6 * amount), (X, -4 * amount)),
                "cart@loc": at("cart", (0, 0.02 * amount, 0.01 * amount)),
                "body": t("body", (Z, -10), (X, -16 * amount)),
                "head": t("head", (Z, 12), (X, -20 * amount)),
                "upperarm.R": t("upperarm.R", (X, 20 * amount), (Y, -20 * amount)),
                "arm.L": t("arm.L", (X, -40 * amount)),
                "cloth": t("cloth", (X, -20 * amount)),
            }
        )
        return result

    def tilting():
        """Halfway over, on two wheels."""
        result = rest(0, 0, 0.6)
        result.update(
            {
                "root": t("root", (Y, -30)),
                "root@loc": at("root", (-0.05, 0, 0.08)),
                "body": t("body", (Z, -10), (Y, 20)),
                "arm.L": t("arm.L", (X, -80)),
                "upperarm.R": t("upperarm.R", (Y, -30)),
                "cloth": t("cloth", (Y, 30)),
            }
        )
        return result

    def tipped(bounce=0.0):
        """The cart lies on its right side, toward the camera; he tumbles out, and the fire goes out."""
        result = rest(0, 0, 0.0)
        result.update(
            {
                "root": t("root", (Y, -84 + bounce)),
                "root@loc": at("root", (-0.04, 0, 0.21)),
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
        )
        return result

    def landing(height=0.0, squash=0.0):
        """A summon: the cart drops onto the Square and bounces."""
        result = rest(0, 0, 1.0)
        result["root@loc"] = at("root", (0, 0, height))
        result["cart@loc"] = at("cart", (0, 0, -0.012 * squash))
        result["body@loc"] = at("body", (0, 0, -0.02 * squash))
        return result

    def cackle(base):
        """The torch high and a big laugh."""
        result = dict(base)
        result.update(
            {
                "body": t("body", (Z, -10), (X, -10)),
                "head": t("head", (Z, 10), (X, -24)),
                "upperarm.R": t("upperarm.R", (X, -30), (Y, 20)),
                "forearm.R": t("forearm.R", (X, -10)),
                "flame@scale": 1.4,
            }
        )
        return result

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 4):
        phase = frame / 48 * 2 * math.pi
        laugh = abs(math.sin(phase * 3)) if frame not in (0, 48) else 0.0
        fire = 1.0 + 0.12 * math.sin(phase * 5)
        idle.key(frame, rest(laugh, math.sin(phase), fire))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame in range(0, 49, 8):
        low.key(frame, slumped(math.sin(frame / 48 * 2 * math.pi)))
    clips.append(low)

    # The small wheels turn twice for each Square (`STEPS_PER_SQUARE`).
    walk = Clip("walk", 24, loop=True)
    for frame in range(0, 25, 2):
        walk.key(frame, rolling(frame / 24 * 720, math.sin(frame / 24 * 4 * math.pi)))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, rest()).key(9, windup()).key(15, strike()).key(19, strike(1.2))
    attack.key(26, rest()).key(30, rest())
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
    rebirth.key(32, tilting()).key(38, landing(0.0, 1.0)).key(42, cackle(rest())).key(48, rest())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, landing(0.16)).key(8, landing(0.0, 1.0)).key(12, landing(0.03)).key(15, landing(0.0, 0.5))
    summon.key(19, cackle(rest())).key(24, rest())
    clips.append(summon)
    return clips


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
