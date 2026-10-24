"""
Junk Barricade (`goblin.junkBarricade`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a tall heap of junk across a mine
road: an old plank door with iron bands and spikes, barrels, stacked crates
with a broken mine cart on top, a copper pot and a kettle, a shovel, two
lanterns of green glass, iron stakes that point out, and a rope wound round
it all. A sign on a post shows a pointing hand that says "stop", and the
hand is upside down. A small goblin sits on the top and pulls a long rope
that runs off to the enemy side: Sabotage. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/junk-barricade.glb`;
then `bun unit-model:pack junk-barricade` packs it for the game.

It is a Wall, not a figure. The junk stands on an arc round the front, so the
Battle camera, which sees the side of a Unit, sees the curve of the heap and
not only its edge. The sign and the crates are on the camera side, and the
door on the far side. Each big
piece has a bone at its foot, so it can rattle, lean out and fall. The
goblin tugs the rope at rest. A Wall does not walk, but the base clips need
`walk`: the heap hops on, and the goblin holds on. It has no Attack, but it
has the `attack` clip: the goblin yanks the rope and the heap lurches
forward. In the death the heap falls apart and the goblin tumbles off the
back. Sabotage has no clip of its own, so it has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

WOOD = hex_color("#7a5434")
WOOD_DARK = hex_color("#55391f")
WOOD_LIGHT = hex_color("#9a7448")
PLANK = hex_color("#86643e")
IRON = hex_color("#4a4440")
IRON_DARK = hex_color("#2e2a28")
RUST = hex_color("#8a5232")
RIVET = hex_color("#9a9086")
COPPER = hex_color("#b8743a")
COPPER_DARK = hex_color("#86502a")
GLASS = hex_color("#b8dc5a")
GLOW = hex_color("#e6ff9a")
ROPE = hex_color("#c8a46a")
ROPE_DARK = hex_color("#9a7a48")
SIGN = hex_color("#cdb88c")
HAND = hex_color("#f2ead8")
INK = hex_color("#3a2a20")
STEEL = hex_color("#9a968e")
SKIN = hex_color("#c0bab0")
EAR = hex_color("#e0a08c")
HAIR = hex_color("#f0ead8")
EYES = hex_color("#f0a43a")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a2022")
TEETH = hex_color("#f2ecd8")
CAP = hex_color("#6a4a30")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
SHIRT = hex_color("#d4c6a6")
VEST = hex_color("#5e4028")
TROUSERS = hex_color("#5a4434")

# --- Proportions ---------------------------------------------------------------

# The junk stands on an arc round the front of the Square.
RADIUS = 0.27
ARC_Y = 0.06
# The piece at each angle, from the camera side (-X) to the far side.
PIECES = {
    "sign": math.radians(-84),
    "crates": math.radians(-42),
    "barrels": math.radians(-4),
    "door": math.radians(36),
    "pots": math.radians(72),
}


# How far each piece falls out in the death, so that it lies on the ground.
FALL = {"sign": 56, "crates": 72, "barrels": 74, "door": 64, "pots": 72}


def arc_point(angle, radius=RADIUS):
    return Vector((radius * math.sin(angle), -radius * math.cos(angle) + ARC_Y, 0))


def outward(angle):
    return Vector((math.sin(angle), -math.cos(angle), 0))


def along(angle):
    """The direction along the arc, from the camera side to the far side."""
    return Vector((math.cos(angle), math.sin(angle), 0))


# The goblin sits on the upright barrel at the top, behind the front, and
# pulls a rope that runs over the top and off to the enemy side.
SEAT = Vector((0.0, 0.08, 0.47))
GOB_HEAD = SEAT + Vector((0, -0.01, 0.17))
HANDS = SEAT + Vector((0, -0.08, 0.06))
# The rope ends on the ground ahead. The game centers the model on its box, so it is not long.
ROPE_END = Vector((-0.03, -0.44, 0.0))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("base", (0, 0, 0.02), (0, 0, 0.14), "root"),
]
for name, angle in PIECES.items():
    foot = arc_point(angle)
    BONES.append((name, tuple(foot), tuple(foot + Z * 0.12), "base"))
BONES += [
    # The mine cart sits on the crates, and the upright barrel on the barrels.
    ("cart", tuple(arc_point(PIECES["crates"], RADIUS - 0.04) + Z * 0.34), tuple(arc_point(PIECES["crates"], RADIUS - 0.04) + Z * 0.46), "crates"),
    # The goblin is not a child of the barrels, so he can tumble off on his own.
    ("gob", tuple(SEAT), tuple(SEAT + Z * 0.1), "base"),
    ("gob.head", tuple(SEAT + Z * 0.11), tuple(GOB_HEAD + Z * 0.08), "gob"),
    ("gob.arms", tuple(SEAT + Z * 0.09), tuple(HANDS), "gob"),
]

# --- Weights -------------------------------------------------------------------


def nearest_piece(co):
    angle = math.atan2(co.x, -(co.y - ARC_Y))
    return min(PIECES, key=lambda name: abs(PIECES[name] - angle))


def piece_weights(co):
    return {nearest_piece(co): 1.0}


def rope_weights(co):
    """
    The pull rope stretches from his hands to the ground ahead: the part in
    the hands follows the arms, and the end on the ground stays with the base.
    """
    return blend("gob.arms", "base", -co.y, -HANDS.y + 0.02, -ROPE_END.y - 0.08)


# --- Parts ---------------------------------------------------------------------


def barrel(part, center, axis, length, radius, color=WOOD, band=IRON):
    axis = Vector(axis).normalized()
    ts = [-0.5, -0.3, 0, 0.3, 0.5]
    radii = [radius * 0.86, radius * 0.96, radius, radius * 0.96, radius * 0.86]
    verts = kit.tube(part.bm, [center + axis * length * s for s in ts], radii, 12)
    part.paint(faces_of(verts), color)
    for s in (-0.38, 0.38):
        ring = kit.torus(part.bm, center + axis * length * s, axis, radius * 0.95 + 0.004, 0.005, 12, 3)
        part.paint(faces_of(ring), band)


def crate(part, center, across, depth_dir, size):
    """A crate of planks with dark edges, turned to `across` and `depth_dir`."""
    w, d, h = size
    verts = kit.slab(part.bm, center, across * w / 2, depth_dir * d / 2, Z * h / 2)
    part.paint(faces_of(verts), PLANK)
    for sign in (1, -1):
        edge = kit.slab(part.bm, center + across * (w / 2 - 0.008) * sign + depth_dir * 0.002, across * 0.009, depth_dir * (d / 2 + 0.004), Z * (h / 2 + 0.002))
        part.paint(faces_of(edge), WOOD_DARK)
    plank = kit.slab(part.bm, center, across * (w / 2 + 0.002), depth_dir * (d / 2 + 0.003), Z * 0.008)
    part.paint(faces_of(plank), WOOD_DARK)


def sign_parts():
    sign = Part("sign", WOOD, "sign", shade=0.05)
    angle = PIECES["sign"]
    foot = arc_point(angle) + outward(angle) * 0.02
    n, a = outward(angle), along(angle)
    kit.cone(sign.bm, foot, foot + Z * 0.4, 0.014, 0.012, 6)
    # The board points out to the side, and its face turns to the camera.
    face_dir = (n * 0.6 - a * 0.8).normalized()
    side = Z.cross(face_dir).normalized()
    board_c = foot + Z * 0.33 + side * 0.03
    board = kit.slab(sign.bm, board_c, side * 0.09, face_dir * 0.01, Z * 0.06)
    sign.paint(faces_of(board), SIGN)
    tip = kit.cone(sign.bm, board_c + side * 0.09, board_c + side * 0.13, 0.06, 0.004, 4, squash=0.16)
    sign.paint(faces_of(tip), SIGN)
    # The painted hand that says "stop": a palm and fingers, upside down.
    hand_c = board_c + face_dir * 0.012
    palm = kit.slab(sign.bm, hand_c + Z * 0.01, side * 0.026, face_dir * 0.002, Z * 0.022)
    sign.paint(faces_of(palm), HAND)
    for index in range(4):
        finger = kit.slab(sign.bm, hand_c + side * (-0.018 + 0.012 * index) - Z * 0.03, side * 0.005, face_dir * 0.002, Z * 0.018)
        sign.paint(faces_of(finger), HAND)
    thumb = kit.slab(sign.bm, hand_c + side * 0.034 + Z * 0.0, side * 0.012, face_dir * 0.002, Z * 0.005)
    sign.paint(faces_of(thumb), HAND)
    for z in (0.01, -0.014):
        line = kit.slab(sign.bm, hand_c + Z * z + face_dir * 0.001, side * 0.02, face_dir * 0.002, Z * 0.0015)
        sign.paint(faces_of(line), INK)
    for offset in (0.06, -0.06):
        nail = kit.sphere(sign.bm, board_c + side * offset + face_dir * 0.012, (0.005, 0.005, 0.005), 4, 3)
        sign.paint(faces_of(nail), IRON)
    return [sign]


def door_parts():
    door = Part("door", PLANK, "door", shade=0.12)
    angle = PIECES["door"]
    n, a = outward(angle), along(angle)
    # The door leans back a little against the heap.
    up = (Z - n * 0.14).normalized()
    foot = arc_point(angle)
    height, half_w = 0.54, 0.1
    center = foot + up * height / 2
    for index in range(4):
        x = -half_w + half_w / 4 + index * half_w / 2
        plank = kit.slab(door.bm, center + a * x, a * (half_w / 4 - 0.004), n * 0.02, up * (height / 2 - 0.006 * (index % 2)))
        door.paint(faces_of(plank), PLANK if index % 2 else WOOD_LIGHT)
    for z in (0.1, 0.42):
        band = kit.slab(door.bm, foot + up * z + n * 0.022, a * (half_w + 0.004), n * 0.005, up * 0.018)
        door.paint(faces_of(band), IRON)
        for x in (-0.065, 0.0, 0.065):
            rivet = kit.sphere(door.bm, foot + up * z + n * 0.03 + a * x, (0.007, 0.006, 0.007), 4, 3)
            door.paint(faces_of(rivet), RIVET)
    ring = kit.torus(door.bm, foot + up * 0.26 + n * 0.03 - a * 0.06, n, 0.02, 0.004, 10, 3)
    door.paint(faces_of(ring), IRON_DARK)
    # Iron spikes along the top edge and out of the side.
    for index, x in enumerate((-0.08, -0.027, 0.027, 0.08)):
        base = foot + up * (height - 0.01) + a * x
        spike = kit.cone(door.bm, base, base + up * 0.07 + n * 0.03, 0.014, 0.001, 5)
        door.paint(faces_of(spike), IRON if index % 2 else RUST)
    for z in (0.18, 0.36):
        base = foot + up * z + a * half_w
        spike = kit.cone(door.bm, base, base + a * 0.07 + n * 0.04, 0.016, 0.001, 5)
        door.paint(faces_of(spike), IRON)
    return [door]


def barrel_parts():
    parts = []
    angle = PIECES["barrels"]
    n, a = outward(angle), along(angle)
    foot = arc_point(angle)
    part = Part("barrels", WOOD, "barrels", shade=0.1)
    # A barrel on its side at the front, two upright behind it, and the
    # goblin's seat barrel on top.
    barrel(part, foot - n * 0.1 + Z * 0.1, a, 0.24, 0.1)
    for x, color in ((-0.09, WOOD_DARK), (0.1, WOOD)):
        barrel(part, foot - n * 0.25 + a * x + Z * 0.13, Z, 0.26, 0.095, color)
    barrel(part, Vector((SEAT.x, SEAT.y, 0)) + Z * 0.37, Z, 0.2, 0.085, WOOD_LIGHT)
    lid = kit.cone(part.bm, Vector((SEAT.x, SEAT.y, 0.465)), Vector((SEAT.x, SEAT.y, 0.472)), 0.075, 0.075, 12)
    part.paint(faces_of(lid), WOOD_DARK)
    # A green glass lantern on the barrel at the front.
    lamp = foot - n * 0.13 + a * 0.09 + Z * 0.2
    body = kit.cone(part.bm, lamp, lamp + Z * 0.07, 0.03, 0.03, 8)
    part.paint(faces_of(body), GLASS)
    glow = kit.sphere(part.bm, lamp + Z * 0.035, (0.016, 0.016, 0.022), 6, 4)
    part.paint(faces_of(glow), GLOW)
    for z in (0.0, 0.07):
        cap = kit.cone(part.bm, lamp + Z * z - Z * 0.004, lamp + Z * z + Z * 0.008, 0.034, 0.03, 8)
        part.paint(faces_of(cap), IRON)
    handle = kit.torus(part.bm, lamp + Z * 0.09, a, 0.018, 0.003, 8, 3)
    part.paint(faces_of(handle), IRON)
    parts.append(part)
    return parts


def crate_parts():
    angle = PIECES["crates"]
    n, a = outward(angle), along(angle)
    foot = arc_point(angle)
    crates = Part("crates", PLANK, "crates", shade=0.1)
    crate(crates, foot - n * 0.1 + Z * 0.09, a, n, (0.2, 0.18, 0.18))
    crate(crates, foot - n * 0.13 + a * 0.02 + Z * 0.26, (a * 0.95 + n * 0.3).normalized(), (n * 0.95 - a * 0.3).normalized(), (0.17, 0.16, 0.16))
    # A second green lantern hangs on the side of the crates.
    lamp = foot - n * 0.0 + a * 0.1 + Z * 0.2
    body = kit.cone(crates.bm, lamp, lamp + Z * 0.06, 0.026, 0.026, 8)
    crates.paint(faces_of(body), GLASS)
    glow = kit.sphere(crates.bm, lamp + Z * 0.03, (0.014, 0.014, 0.018), 6, 4)
    crates.paint(faces_of(glow), GLOW)
    cap = kit.cone(crates.bm, lamp + Z * 0.06, lamp + Z * 0.075, 0.03, 0.02, 8)
    crates.paint(faces_of(cap), IRON)

    # The broken mine cart on top, tipped toward the front, with one wheel off.
    cart = Part("cart", RUST, "cart", shade=0.1)
    c = arc_point(angle, RADIUS - 0.04) + Z * 0.4
    tilt = (Z + n * 0.35).normalized()
    side = a
    depth = tilt.cross(side).normalized()
    walls = [
        (c - tilt * 0.05, side * 0.11, depth * 0.08, tilt * 0.008),
        (c + side * 0.11, side * 0.008, depth * 0.08, tilt * 0.05),
        (c - side * 0.11, side * 0.008, depth * 0.08, tilt * 0.05),
        (c + depth * 0.08, side * 0.11, depth * 0.008, tilt * 0.05),
        (c - depth * 0.08, side * 0.11, depth * 0.008, tilt * 0.05),
    ]
    for index, (center, ax, ay, az) in enumerate(walls):
        wall = kit.slab(cart.bm, center, ax, ay, az)
        cart.paint(faces_of(wall), RUST if index % 2 else IRON)
    for sign in (1, -1):
        rim = kit.slab(cart.bm, c + tilt * 0.05 + depth * 0.082 * sign, side * 0.115, depth * 0.01, tilt * 0.008)
        cart.paint(faces_of(rim), IRON_DARK)
    wheel = kit.torus(cart.bm, c - tilt * 0.06 + side * 0.07 + depth * 0.09, depth, 0.035, 0.008, 12, 4)
    cart.paint(faces_of(wheel), IRON_DARK)
    hub = kit.sphere(cart.bm, c - tilt * 0.06 + side * 0.07 + depth * 0.09, (0.01, 0.01, 0.01), 4, 3)
    cart.paint(faces_of(hub), RIVET)
    # The loose wheel leans against the crates.
    loose = foot + n * 0.03 - a * 0.07 + Z * 0.05
    wheel = kit.torus(crates.bm, loose, (n + a * 0.3).normalized(), 0.045, 0.009, 12, 4)
    crates.paint(faces_of(wheel), IRON_DARK)
    for index in range(4):
        spoke_a = math.pi * index / 4
        spoke_dir = (a * math.cos(spoke_a) + Z * math.sin(spoke_a)).normalized()
        spoke = kit.cone(crates.bm, loose - spoke_dir * 0.04, loose + spoke_dir * 0.04, 0.004, 0.004, 4)
        crates.paint(faces_of(spoke), IRON)
    return [crates, cart]


def pot_parts():
    angle = PIECES["pots"]
    n, a = outward(angle), along(angle)
    foot = arc_point(angle)
    pots = Part("pots", COPPER, "pots", shade=0.1)
    # A big copper pot on its side, a kettle on a short barrel, and a shovel.
    pot_c = foot - n * 0.04 + Z * 0.08
    verts = kit.sphere(pots.bm, pot_c, (0.08, 0.08, 0.075), 10, 7)
    pots.paint(faces_of(verts), COPPER)
    lip = kit.torus(pots.bm, pot_c + n * 0.06, n, 0.055, 0.008, 12, 3)
    pots.paint(faces_of(lip), COPPER_DARK)
    inside = kit.cone(pots.bm, pot_c + n * 0.05, pot_c + n * 0.062, 0.05, 0.05, 10)
    pots.paint(faces_of(inside), IRON_DARK)
    barrel(pots, foot - n * 0.17 + Z * 0.09, Z, 0.18, 0.07, WOOD_DARK)
    kettle_c = foot - n * 0.17 + Z * 0.22
    verts = kit.sphere(pots.bm, kettle_c, (0.045, 0.045, 0.038), 8, 6)
    pots.paint(faces_of(verts), IRON)
    spout = kit.cone(pots.bm, kettle_c + n * 0.03, kettle_c + n * 0.075 + Z * 0.03, 0.012, 0.006, 5)
    pots.paint(faces_of(spout), IRON)
    handle = kit.torus(pots.bm, kettle_c + Z * 0.04, a, 0.03, 0.004, 10, 3)
    pots.paint(faces_of(handle), IRON_DARK)
    # The shovel stuck in the heap, its blade up and out.
    grip = foot - n * 0.1 + a * 0.09 + Z * 0.02
    blade_c = grip + (Z * 0.9 + n * 0.3).normalized() * 0.42
    shaft = kit.cone(pots.bm, grip, blade_c, 0.009, 0.009, 6)
    pots.paint(faces_of(shaft), WOOD)
    blade = kit.slab(pots.bm, blade_c + Z * 0.05, a * 0.04, n * 0.006, Z * 0.055)
    pots.paint(faces_of(blade), STEEL)
    return [pots]


def binding_parts():
    """The rope round the heap and the iron stakes that point out. Each bit follows its nearest piece."""
    parts = []
    rope = Part("binding", ROPE, piece_weights, shade=0.06)
    for z, inset in ((0.16, 0.02), (0.3, 0.07)):
        points = []
        for index in range(13):
            angle = lerp(PIECES["sign"] + 0.25, PIECES["pots"], index / 12)
            points.append(arc_point(angle, RADIUS - inset) + Z * (z + 0.02 * math.sin(index * 1.7)))
        verts = kit.tube(rope.bm, points, [0.008] * len(points), 4)
        if z > 0.2:
            rope.paint(faces_of(verts), ROPE_DARK)
    parts.append(rope)

    stakes = Part("stakes", WOOD_DARK, piece_weights, shade=0.04)
    for angle_deg, z, length in ((-24, 0.08, 0.15), (12, 0.22, 0.13), (46, 0.06, 0.14), (-62, 0.12, 0.12), (78, 0.18, 0.12)):
        angle = math.radians(angle_deg)
        start = arc_point(angle, RADIUS - 0.05) + Z * z
        tip = start + (outward(angle) + Z * 0.35).normalized() * length
        shaft = kit.cone(stakes.bm, start, tip - (tip - start).normalized() * 0.03, 0.012, 0.01, 5)
        stakes.paint(faces_of(shaft), WOOD_DARK)
        point = kit.cone(stakes.bm, tip - (tip - start).normalized() * 0.03, tip, 0.012, 0.001, 5)
        stakes.paint(faces_of(point), IRON)
    parts.append(stakes)
    return parts


def goblin_parts():
    parts = []
    body = Part("gob.body", VEST, "gob", shade=0.08)
    kit.cone(body.bm, SEAT + Z * 0.0, SEAT + Z * 0.11, 0.045, 0.04, 10, squash=0.85)
    collar = kit.torus(body.bm, SEAT + Z * 0.108, Z, 0.03, 0.008, 10, 3)
    body.paint(faces_of(collar), SHIRT)
    belt = kit.torus(body.bm, SEAT + Z * 0.015, Z, 0.044, 0.006, 10, 3)
    body.paint(faces_of(belt), BRASS_DARK)
    # The legs sit on the barrel lid and hang over its front.
    for sign in (1, -1):
        hip = SEAT + Vector((0.025 * sign, 0, 0.0))
        knee = SEAT + Vector((0.03 * sign, -0.07, 0.0))
        foot = SEAT + Vector((0.034 * sign, -0.085, -0.07))
        thigh = kit.cone(body.bm, hip, knee, 0.02, 0.017, 6)
        body.paint(faces_of(thigh), TROUSERS)
        shin = kit.cone(body.bm, knee, foot, 0.015, 0.012, 6)
        body.paint(faces_of(shin), SKIN)
        toes = kit.sphere(body.bm, foot + Vector((0, -0.015, -0.006)), (0.014, 0.024, 0.01), 6, 4)
        body.paint(faces_of(toes), SKIN)
    parts.append(body)

    head = Part("gob.head", SKIN, "gob.head", shade=0.08)
    c = GOB_HEAD
    kit.sphere(head.bm, c, (0.05, 0.048, 0.05), 12, 8)
    nose = kit.cone(head.bm, c + Vector((0, -0.045, -0.004)), c + Vector((0, -0.07, -0.016)), 0.011, 0.003, 5)
    head.paint(faces_of(nose), SKIN)
    for sign in (1, -1):
        ear = kit.cone(head.bm, c + Vector((0.044 * sign, 0.008, 0.004)), c + Vector((0.15 * sign, 0.03, 0.04)), 0.03, 0.002, 6, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
        eye = kit.sphere(head.bm, c + Vector((0.02 * sign, -0.04, 0.012)), (0.013, 0.008, 0.013), 8, 5)
        head.paint(faces_of(eye), EYES)
        pupil = kit.sphere(head.bm, c + Vector((0.018 * sign, -0.047, 0.012)), (0.005, 0.003, 0.006), 4, 3)
        head.paint(faces_of(pupil), PUPIL)
    mouth = kit.sphere(head.bm, c + Vector((0, -0.04, -0.026)), (0.022, 0.008, 0.008), 8, 4)
    head.paint(faces_of(mouth), MOUTH)
    teeth = kit.box(head.bm, c + Vector((0, -0.047, -0.022)), (0.03, 0.004, 0.006))
    head.paint(faces_of(teeth), TEETH)
    # A cap with goggles, and wild white hair at the back.
    cap = kit.sphere(head.bm, c + Vector((0, 0.006, 0.022)), (0.053, 0.052, 0.04), 10, 6)
    head.paint(faces_of(cap), CAP)
    for sign in (1, -1):
        goggle = kit.cone(head.bm, c + Vector((0.02 * sign, -0.045, 0.048)), c + Vector((0.022 * sign, -0.06, 0.054)), 0.015, 0.014, 8)
        head.paint(faces_of(goggle), BRASS)
    for index in range(5):
        a = math.radians(-60 + index * 30)
        root = c + Vector((0.035 * math.sin(a), 0.03 + 0.012 * math.cos(a), 0.0))
        tuft = kit.cone(head.bm, root, root + Vector((0.03 * math.sin(a), 0.04, -0.02)), 0.016, 0.003, 4)
        head.paint(faces_of(tuft), HAIR)
    parts.append(head)

    # Both arms reach forward to the rope.
    arms = Part("gob.arms", SHIRT, "gob.arms", shade=0.05)
    for sign in (1, -1):
        shoulder = SEAT + Vector((0.04 * sign, 0, 0.1))
        elbow = SEAT + Vector((0.05 * sign, -0.045, 0.075))
        hand = HANDS + Vector((0.012 * sign, 0.012 * (1 if sign > 0 else 0), 0))
        kit.cone(arms.bm, shoulder, elbow, 0.014, 0.012, 6)
        forearm = kit.cone(arms.bm, elbow, hand, 0.012, 0.01, 6)
        arms.paint(faces_of(forearm), SKIN)
        fist = kit.sphere(arms.bm, hand, (0.013, 0.013, 0.013), 6, 4)
        arms.paint(faces_of(fist), SKIN)
    parts.append(arms)

    # The long rope runs from his hands over the top of the heap and off to the enemy side.
    pull = Part("rope", ROPE, rope_weights, shade=0.04)
    top = HANDS + Vector((0, -0.16, -0.02))
    edge = arc_point(PIECES["barrels"], RADIUS + 0.03) + Z * 0.27
    kit.tube(pull.bm, [HANDS + Vector((0, 0.03, 0.0)), HANDS, top, edge, edge.lerp(ROPE_END, 0.5) + Z * 0.02, ROPE_END + Z * 0.01], [0.006] * 6, 4)
    parts.append(pull)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("JunkBarricade", BONES)
    parts = sign_parts() + door_parts() + barrel_parts() + crate_parts() + pot_parts() + binding_parts() + goblin_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "JunkBarricadeMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def lean(name, degrees, side=0.0):
        """A piece leans out (positive) or in, and turns a little along the arc."""
        n = outward(PIECES[name])
        return t(name, (Z.cross(n), degrees), (n, side))

    def pose(base, changes):
        result = dict(base)
        result.update(changes)
        return result

    def rest(tug=0.0, rattle=0.0):
        """
        The heap stands. The goblin tugs the rope (`tug` 0 to 1), and the
        pieces rattle a little.
        """
        result = {
            "gob": t("gob", (X, -14 * tug)),
            "gob.head": t("gob.head", (X, 8 * tug), (Z, -12 + 6 * tug)),
            "gob.arms": t("gob.arms", (X, 20 * tug)),
            "cart": t("cart", (Y, 3 * rattle)),
        }
        for index, name in enumerate(PIECES):
            phase = (index * 0.37) % 1
            result[name] = lean(name, 1.5 * rattle * math.sin((phase + tug) * math.pi), 0)
        return result

    def battered(breath=0.0):
        """Low HP: the door and the sign lean out, the cart slides, and the goblin hangs on, tired."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, -0.006)),
                "base": t("base", (Y, -2), (X, 1)),
                "sign": lean("sign", 22 + breath * 3, -6),
                "door": lean("door", 14 + breath * 2, 4),
                "barrels": lean("barrels", -4),
                "crates": lean("crates", 8, -4),
                "pots": lean("pots", 16),
                "cart": t("cart", (Y, -12), (X, 10)),
                "gob": t("gob", (X, 16 + breath * 3), (Y, -10)),
                "gob.head": t("gob.head", (X, 20 + breath * 6), (Z, -10)),
                "gob.arms": t("gob.arms", (X, -20)),
            },
        )

    def jolt(base, amount=1.0, forward=False):
        """A blow shakes the heap: the pieces knock, and the goblin ducks."""
        direction = -1 if forward else 1
        changes = {
            "base@loc": at("base", (0, 0.02 * amount * direction, 0.016 * amount)),
            "base": t("base", (X, -4 * amount * direction)),
            "gob": t("gob", (X, 16 * amount)),
            "gob.head": t("gob.head", (X, 24 * amount), (Z, -14 * amount)),
            "cart": t("cart", (Y, 10 * amount), (X, -6 * amount)),
        }
        for index, name in enumerate(PIECES):
            changes[name] = lean(name, (-8 if index % 2 else 6) * amount * direction, 3 * amount)
        return pose(base, changes)

    def fallen(base, bounce=0.0, rise=0.0):
        """
        The heap falls apart: each piece falls flat out, and the goblin
        tumbles off the back. `rise` (0 to 1 for each piece, in turn) stands
        the pieces up again, for a Rebirth.
        """
        changes = {
            "base@loc": at("base", (0, 0, 0.03)),
            "base": t("base", (X, 2), (Y, -2)),
            "cart": t("cart", (X, 40), (Y, 30)),
        }
        for index, name in enumerate(PIECES):
            # The end pieces fall first in a death and stand up last in a Rebirth.
            up = max(0.0, min(1.0, rise * len(PIECES) - index))
            changes[name] = lean(name, lerp(FALL[name] - bounce * (index % 2), 0, up), 0)
        # The goblin tumbles off the back: he lies on his back behind the heap.
        down = 1 - max(0.0, min(1.0, rise * 2 - 0.6))
        changes.update(
            {
                "gob@loc": at("gob", (0, 0.12 * down, -0.42 * down)),
                "gob": t("gob", (X, -80 * down + bounce * down)),
                "gob.head": t("gob.head", (X, -20 * down), (Z, 30 * down)),
                "gob.arms": t("gob.arms", (X, -60 * down)),
            }
        )
        return pose(base, changes)

    def falling(base, at_names):
        """The first pieces are down and the others lean, part way into the death."""
        changes = {
            "gob": t("gob", (X, -30)),
            "gob.head": t("gob.head", (X, 20), (Z, 20)),
            "gob.arms": t("gob.arms", (X, -50)),
            "cart": t("cart", (X, 20), (Y, 20)),
        }
        for name in PIECES:
            changes[name] = lean(name, 50 if name in at_names else 14, 4)
        return pose(base, changes)

    def heave(lift, tilt):
        """A walk pose: the whole heap hops and rocks, and the goblin holds on."""
        return pose(
            rest(),
            {
                "base@loc": at("base", (0, 0, 0.03 * lift)),
                "base": t("base", (X, 4 * tilt), (Y, 3 * tilt)),
                "gob": t("gob", (X, 10 * lift), (Y, -6 * tilt)),
                "gob.head": t("gob.head", (X, -10 * lift), (Z, -10)),
                "cart": t("cart", (Y, 6 * tilt)),
                **{name: lean(name, 3 * tilt * (1 if index % 2 else -1)) for index, name in enumerate(PIECES)},
            },
        )

    # The attack: a Wall has no Attack, but the base clips need it. The goblin
    # leans back, yanks the rope, and the heap lurches forward. The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # lurch is at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            {
                "gob": t("gob", (X, 14)),
                "gob.head": t("gob.head", (X, 10)),
                "gob.arms": t("gob.arms", (X, -30)),
            },
        )

    def yank(base):
        return pose(
            jolt(base, 0.8, forward=True),
            {
                "base@loc": at("base", (0, -0.05, 0.02)),
                "gob": t("gob", (X, -30)),
                "gob.head": t("gob.head", (X, -10), (Z, -10)),
                "gob.arms": t("gob.arms", (X, 40)),
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, tug, rattle in ((0, 0, 0), (8, 1, 0.5), (14, 0.2, 1), (24, 0, 0), (32, 1, 0.5), (38, 0.2, 1), (48, 0, 0)):
        idle.key(frame, rest(tug, rattle))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, battered(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, heave(0, 0)).key(6, heave(1, 1)).key(12, heave(0, 0)).key(18, heave(1, -1)).key(24, heave(0, 0))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, rest()).key(10, windup(rest())).key(15, yank(rest())).key(19, yank(rest()))
    attack.key(26, rest()).key(30, rest())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, rest()).key(3, jolt(rest())).key(8, jolt(rest(), 0.4)).key(16, rest())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest(), ("sign", "pots"))).key(18, falling(rest(), ("sign", "door", "crates", "pots")))
    death.key(26, fallen(rest())).key(30, fallen(rest(), 6)).key(36, fallen(rest()))
    clips.append(death)

    # Rebirth: the heap falls (45% of the event, `REBORN_FALL`), then the
    # pieces stand up one by one and the goblin climbs back on top.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, rest()).key(4, jolt(rest())).key(12, falling(rest(), ("sign", "pots"))).key(20, fallen(rest())).key(24, fallen(rest(), 3))
    rebirth.key(30, fallen(rest(), 0, 0.35)).key(36, fallen(rest(), 0, 0.7)).key(41, jolt(rest(), 0.6)).key(48, rest())
    clips.append(rebirth)

    # The summon: the heap goes up piece by piece, and the goblin climbs on top.
    summon = Clip("summon", 24)
    summon.key(0, fallen(rest())).key(8, fallen(rest(), 0, 0.5)).key(14, jolt(rest(), 0.7)).key(24, rest())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "junk-barricade.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
