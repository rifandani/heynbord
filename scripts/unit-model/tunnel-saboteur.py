"""
Tunnel Saboteur (`goblin.tunnelSaboteur`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a round pale goblin man in a
rusty miner's helmet that is too big for him, with a brass lamp and a green
lens on its front. He has white tufts of hair under the helmet, very large
ears, a long nose, a wide grin and one eye shut in a wink, a cream shirt, a
leather apron with straps and a tool belt, a cut rope across his chest,
patched brown trousers, leather wraps at the ankles and bare feet. He holds
big pliers with red grips up in his right hand, and a brass hourglass up in
his left hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/tunnel-saboteur.glb`; then
`bun unit-model:pack tunnel-saboteur` packs it for the game.

The pliers are on the camera side. The `jaw` bone opens and shuts the
pliers, and the `hourglass` bone turns the hourglass (Sabotage: the enemy
card comes later). The `helmet` bone tips the helmet over his eyes with Low
HP. Sabotage acts when he comes from his Card, so his summon shows it: he
climbs out with his arms, and then he turns the hourglass. His walk is a
waddle. His attack snips the target with the pliers. His death drops him
back down his tunnel: the `hole` bone, which has no parent, opens the hole
at his feet, he sinks through it, and it closes. In his Rebirth he drops
down the hole and climbs back out. He has no Keyword that he uses by his own
action, so he has no cast clip.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#c2beb6")
SKIN_DARK = hex_color("#8c8880")
EAR = hex_color("#e6a28c")
NOSE = hex_color("#de927e")
CHEEK = hex_color("#d6aaa0")
HAIR = hex_color("#ece4d2")
EYES = hex_color("#f2a838")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a1e1a")
TEETH = hex_color("#f0e8d0")
HELMET = hex_color("#8a6440")
HELMET_DARK = hex_color("#5e4028")
RUST = hex_color("#a2683a")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
LAMP = hex_color("#c4f060")
SHIRT = hex_color("#dccfb0")
APRON = hex_color("#7e5434")
APRON_DARK = hex_color("#583a22")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
TROUSERS = hex_color("#6a5040")
TROUSERS_DARK = hex_color("#4a3628")
PATCH = hex_color("#9a7a52")
WRAP = hex_color("#8a6038")
ROPE = hex_color("#c8a062")
ROPE_DARK = hex_color("#94723e")
IRON = hex_color("#6a625a")
IRON_LIGHT = hex_color("#a09890")
GRIP_RED = hex_color("#a83a28")
GLASS = hex_color("#dfe8e4")
SAND = hex_color("#e8b64a")
HOLE = hex_color("#1c1410")
DIRT = hex_color("#7a5a3a")
DIRT_DARK = hex_color("#5a4028")
COBBLE = hex_color("#a09a90")

# --- Proportions ---------------------------------------------------------------

# He is round: a round body and short, thick legs.
HIP_Z = 0.28
WAIST_Z = 0.34
CHEST_Z = 0.41
SHOULDER_Z = 0.47
NECK_Z = 0.49
HEAD_C = Vector((0, -0.02, 0.585))
KNEE_Z = 0.155
ANKLE_Z = 0.04
LEG_X = 0.052

# The right hand holds the pliers up in front of the chest, and the left hand
# holds the hourglass up beside the head.
SR = Vector((-0.088, 0, SHOULDER_Z))
ER = Vector((-0.135, -0.02, 0.38))
WR = Vector((-0.11, -0.09, 0.35))
TR = WR + (WR - ER).normalized() * 0.035
SL = Vector((0.088, 0, SHOULDER_Z))
EL = Vector((0.16, -0.02, 0.5))
WL = Vector((0.17, -0.05, 0.6))
TL = WL + (WL - EL).normalized() * 0.035

GRIP = WR + (WR - ER).normalized() * 0.018
PLIERS = Vector((-0.15, -0.35, 1)).normalized()
# The pliers lie in the plane that faces the camera: `ACROSS` is in that plane.
ACROSS = PLIERS.cross(X).normalized()
PIVOT = GRIP + PLIERS * 0.06
GLASS_C = TL + Vector((0, 0, 0.045))
HELMET_C = HEAD_C + Vector((0, 0.004, 0.03))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.004, 0.51), "chest"),
    ("head", (0, -0.004, 0.51), (0, -0.01, 0.69), "neck"),
    ("helmet", tuple(HELMET_C), tuple(HELMET_C + Z * 0.08), "head"),
    # The hole stays on the ground: it has no parent.
    ("hole", (0, 0, 0), (0, 0, 0.05), None),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.016), f"shin.{side}"),
    ]
BONES += [
    ("pliers", tuple(GRIP), tuple(GRIP + PLIERS * 0.06), "hand.R"),
    ("jaw", tuple(PIVOT), tuple(PIVOT + PLIERS * 0.05), "pliers"),
    ("hourglass", tuple(GLASS_C), tuple(GLASS_C + Z * 0.05), "hand.L"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.3, 0.37)
    return blend("spine", "chest", co.z, 0.39, 0.45)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.076, 0.072, 0.072), 14, 10)
    # Round cheeks, a round chin and a long nose.
    for sign in (1, -1):
        cheek = kit.sphere(head.bm, HEAD_C + Vector((0.036 * sign, -0.044, -0.026)), (0.028, 0.024, 0.024), 8, 6)
        head.paint(faces_of(cheek), CHEEK)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.03, -0.05)), (0.044, 0.036, 0.03), 10, 6)
    nose = kit.tube(head.bm, [HEAD_C + Vector((0, -0.066, -0.004)), HEAD_C + Vector((0, -0.1, -0.014)), HEAD_C + Vector((0, -0.12, -0.03))], [0.017, 0.012, 0.006], 6)
    head.paint(faces_of(nose), NOSE)
    for sign in (1, -1):
        # Very large goblin ears out under the brim of the helmet. Each ear is
        # a flat leaf with its face to the side, so the camera sees it.
        base = HEAD_C + Vector((0.062 * sign, 0.016, -0.006))
        tip = HEAD_C + Vector((0.19 * sign, 0.09, -0.03))
        ear = kit.cone(head.bm, base, tip, 0.046, 0.003, 8)
        thin = Z.cross((tip - base).normalized()).normalized()
        for vert in ear:
            vert.co -= thin * (vert.co - base).dot(thin) * 0.7
        for face in faces_of(ear):
            face.normal_update()
            if face.normal.x * sign > 0.3:
                head.paint([face], EAR)
    # White tufts of hair under the helmet.
    for index in range(7):
        a = math.radians(40 + index * 47)
        root = HEAD_C + Vector((0.07 * math.sin(a), 0.07 * math.cos(a) * 0.9, 0.012))
        tip = root + Vector((0.03 * math.sin(a), 0.03 * math.cos(a), -0.03))
        tuft = kit.cone(head.bm, root, tip, 0.016, 0.004, 5)
        head.paint(faces_of(tuft), HAIR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A wide grin, a little up on the right.
    grin = [HEAD_C + Vector((0.036, -0.056, -0.03)), HEAD_C + Vector((0.0, -0.068, -0.044)), HEAD_C + Vector((-0.038, -0.056, -0.024))]
    kit.tube(face.bm, grin, [0.006, 0.01, 0.006], 5)
    teeth = kit.tube(face.bm, [p + Vector((0, -0.005, 0.004)) for p in grin], [0.003, 0.0045, 0.003], 4)
    face.paint(faces_of(teeth), TEETH)
    # The left eye is open, and the right eye, on the camera side, is shut in a wink.
    center = HEAD_C + Vector((0.031, -0.06, 0.012))
    eye = kit.sphere(face.bm, center, (0.021, 0.013, 0.02), 10, 6)
    face.paint(faces_of(eye), EYES)
    pupil = kit.sphere(face.bm, center + Vector((-0.004, -0.011, 0)), (0.008, 0.004, 0.009), 6, 4)
    face.paint(faces_of(pupil), PUPIL)
    wink = HEAD_C + Vector((-0.031, -0.062, 0.01))
    shut = kit.tube(face.bm, [wink + Vector((0.016, 0.002, -0.004)), wink + Vector((0, -0.004, 0.004)), wink + Vector((-0.016, 0.002, -0.002))], [0.0035, 0.004, 0.0035], 4)
    face.paint(faces_of(shut), PUPIL)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.47), (0, -0.004, 0.55), 0.028, 0.026, 8)
    parts.append(neck)
    return parts


def helmet_parts():
    """The rusty miner's helmet, too big for him, with a brass lamp on its front."""
    helmet = Part("helmet", HELMET, "helmet", shade=0.08)
    c = HELMET_C
    dome = kit.sphere(helmet.bm, c, (0.096, 0.094, 0.082), 16, 10)
    low = [v for v in dome if v.co.z < c.z - 0.004]
    bmesh.ops.delete(helmet.bm, geom=low, context="VERTS")
    # A wide brim, a ridge over the top, rivets and spots of rust.
    brim = kit.torus(helmet.bm, c + Vector((0, 0, -0.002)), (0, 0.06, 1), 0.1, 0.012, 20, 4)
    helmet.paint(faces_of(brim), HELMET_DARK)
    ridge = kit.torus(helmet.bm, c, (1, 0, 0), 0.084, 0.008, 16, 4)
    helmet.paint([f for f in faces_of(ridge) if f.calc_center_median().z > c.z + 0.004], HELMET_DARK)
    for index in range(8):
        a = 2 * math.pi * index / 8
        rivet = kit.sphere(helmet.bm, c + Vector((math.cos(a) * 0.092, math.sin(a) * 0.09, 0.012)), (0.006, 0.006, 0.006), 4, 3)
        helmet.paint(faces_of(rivet), BRASS_DARK)
    for at in ((0.05, -0.05, 0.05), (-0.06, 0.03, 0.05), (0.02, 0.06, 0.06)):
        rust = kit.sphere(helmet.bm, c + Vector(at), (0.022, 0.022, 0.014), 6, 4)
        helmet.paint(faces_of(rust), RUST)
    # The lamp: a brass can with a green lens, on the front of the helmet.
    lamp = c + Vector((0, -0.08, 0.04))
    can = kit.cone(helmet.bm, lamp + Y * 0.02, lamp - Y * 0.02, 0.024, 0.028, 12)
    helmet.paint(faces_of(can), BRASS)
    rim = kit.torus(helmet.bm, lamp - Y * 0.02, (0, 1, 0), 0.027, 0.005, 12, 3)
    helmet.paint(faces_of(rim), BRASS_DARK)
    lens = kit.cone(helmet.bm, lamp - Y * 0.019, lamp - Y * 0.026, 0.023, 0.02, 12)
    helmet.paint(faces_of(lens), LAMP)
    return [helmet]


def body_parts():
    parts = []
    shirt = Part("shirt", SHIRT, torso_weights)
    kit.cone(shirt.bm, (0, 0, 0.24), (0, 0, 0.47), 0.08, 0.07, 12, squash=0.85)
    belly = kit.sphere(shirt.bm, (0, -0.026, 0.33), (0.08, 0.07, 0.074), 12, 8)
    # The leather apron over the belly, with straps over the shoulders.
    for face in faces_of(belly):
        if face.calc_center_median().y < -0.04:
            shirt.paint([face], APRON)
    for sign in (1, -1):
        strap = kit.tube(shirt.bm, [Vector((0.04 * sign, -0.07, 0.38)), Vector((0.045 * sign, -0.05, 0.46)), Vector((0.04 * sign, 0.04, 0.47)), Vector((0.035 * sign, 0.07, 0.34))], [0.007] * 4, 4)
        shirt.paint(faces_of(strap), APRON_DARK)
    for sign in (1, -1):
        button = kit.sphere(shirt.bm, (0.04 * sign, -0.075, 0.385), (0.006, 0.004, 0.006), 4, 3)
        shirt.paint(faces_of(button), BRASS)
    # The cut rope: across the chest from the left shoulder, and its frayed end hangs at the right hip.
    path = [Vector((0.07, 0.03, 0.47)), Vector((0.04, -0.07, 0.43)), Vector((-0.04, -0.09, 0.34)), Vector((-0.085, -0.04, 0.27)), Vector((-0.095, -0.03, 0.22))]
    rope = kit.tube(shirt.bm, path, [0.009] * len(path), 6)
    shirt.paint(faces_of(rope), ROPE)
    for index in range(4):
        a = 2 * math.pi * index / 4
        fray = kit.cone(shirt.bm, path[-1], path[-1] + Vector((math.cos(a) * 0.014, math.sin(a) * 0.014, -0.022)), 0.004, 0.0015, 3)
        shirt.paint(faces_of(fray), ROPE_DARK)
    back = kit.tube(shirt.bm, [Vector((0.07, 0.03, 0.47)), Vector((0.02, 0.08, 0.4)), Vector((-0.06, 0.06, 0.3))], [0.009] * 3, 6)
    shirt.paint(faces_of(back), ROPE)
    parts.append(shirt)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, -0.004, 0.265), (0, -0.004, 0.295), 0.086, 0.086, 12, squash=0.86)
    buckle = kit.box(belt.bm, (0, -0.078, 0.28), (0.026, 0.008, 0.024))
    belt.paint(faces_of(buckle), BRASS)
    # Tool pouches, and a wrench in one of them.
    for x in (-0.06, 0.06):
        pouch = kit.box(belt.bm, (x, -0.066, 0.25), (0.03, 0.02, 0.034))
        belt.paint(faces_of(pouch), LEATHER_DARK)
    wrench = kit.cone(belt.bm, (0.06, -0.07, 0.26), (0.064, -0.074, 0.31), 0.005, 0.005, 5)
    belt.paint(faces_of(wrench), IRON_LIGHT)
    ring = kit.torus(belt.bm, (0.064, -0.074, 0.318), (0, 1, 0), 0.01, 0.004, 8, 3)
    belt.paint(faces_of(ring), IRON_LIGHT)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.2), (0, 0, 0.27), 0.08, 0.08, 12, squash=0.86)
    parts.append(hips)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"upperarm.{side}", SKIN, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.028, 0.022, 8)
        sleeve = kit.cone(upper.bm, s - (e - s) * 0.1, s + (e - s) * 0.5, 0.034, 0.03, 8)
        upper.paint(faces_of(sleeve), SHIRT)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.02, 0.017, 8)
        cuff = kit.torus(forearm.bm, e + (w - e) * 0.2, d, 0.021, 0.005, 8, 3)
        forearm.paint(faces_of(cuff), SHIRT)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.016, (0.018, 0.016, 0.021), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.045, 0.037, 8)
        patch = kit.box(thigh.bm, knee + Vector((-0.01 * sign, -0.036, 0.05)), (0.026, 0.008, 0.026))
        thigh.paint(faces_of(patch), PATCH)
        parts.append(thigh)

        shin = Part(f"shin.{side}", WRAP, f"shin.{side}")
        hem = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.05)), 0.038, 0.04, 8)
        for face in faces_of(hem):
            shin.paint([face], TROUSERS_DARK if face.calc_center_median().y < 0 else TROUSERS)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.045)), ankle, 0.026, 0.02, 8)
        for z in (0.03, 0.06):
            wrap = kit.torus(shin.bm, ankle + Vector((0, 0, z)), (0, 0, 1), 0.024, 0.004, 8, 3)
            shin.paint(faces_of(wrap), LEATHER_DARK)
        parts.append(shin)

        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.017), (0.028, 0.056, 0.018), 8, 6)
        for toe in (-1, 0, 1):
            kit.sphere(foot.bm, (LEG_X * sign + toe * 0.013, -0.082, 0.011), (0.009, 0.011, 0.009), 5, 4)
        parts.append(foot)
    return parts


def pliers_parts():
    """Big pliers in the plane that faces the camera: a fixed half, and the half that the `jaw` bone opens."""
    parts = []
    for name, bone, sign in (("pliers", "pliers", 1), ("jaw", "jaw", -1)):
        half = Part(name, IRON, bone, shade=0.04)
        tip = PIVOT + PLIERS * 0.085 + ACROSS * 0.004 * sign
        kit.tube(half.bm, [PIVOT, PIVOT + PLIERS * 0.04 + ACROSS * 0.012 * sign, tip], [0.008, 0.009, 0.004], 5)
        end = GRIP - PLIERS * 0.07 - ACROSS * 0.022 * sign
        kit.tube(half.bm, [PIVOT, GRIP - ACROSS * 0.008 * sign, end], [0.006, 0.006, 0.006], 5)
        grip = kit.tube(half.bm, [GRIP - PLIERS * 0.01 - ACROSS * 0.01 * sign, end - PLIERS * 0.006], [0.0085, 0.009], 6)
        half.paint(faces_of(grip), GRIP_RED)
        parts.append(half)
    bolt = kit.cone(parts[0].bm, PIVOT - X * 0.012, PIVOT + X * 0.012, 0.009, 0.009, 8)
    parts[0].paint(faces_of(bolt), IRON_LIGHT)
    return parts


def hourglass_parts():
    glass = Part("hourglass", GLASS, "hourglass", shade=0.03)
    c = GLASS_C
    # Two bulbs of glass, with sand in both halves, so a turn looks the same at the end.
    kit.cone(glass.bm, c, c + Z * 0.036, 0.004, 0.02, 10)
    kit.cone(glass.bm, c, c - Z * 0.036, 0.004, 0.02, 10)
    for direction in (1, -1):
        sand = kit.cone(glass.bm, c + Z * 0.02 * direction, c + Z * 0.034 * direction, 0.012, 0.018, 8)
        glass.paint(faces_of(sand), SAND)
    stream = kit.cone(glass.bm, c - Z * 0.02, c + Z * 0.02, 0.0025, 0.0025, 4)
    glass.paint(faces_of(stream), SAND)
    # The brass frame: two plates and three posts.
    for direction in (1, -1):
        plate = kit.cone(glass.bm, c + Z * 0.036 * direction, c + Z * 0.044 * direction, 0.026, 0.026, 10)
        glass.paint(faces_of(plate), BRASS)
    for index in range(3):
        a = 2 * math.pi * index / 3 + 0.5
        post = kit.cone(glass.bm, c + Vector((math.cos(a) * 0.022, math.sin(a) * 0.022, -0.038)), c + Vector((math.cos(a) * 0.022, math.sin(a) * 0.022, 0.038)), 0.0035, 0.0035, 4)
        glass.paint(faces_of(post), BRASS_DARK)
    return [glass]


def hole_parts():
    """
    The hole of his tunnel: a dark pit with a rim of dirt and broken cobbles.
    Nothing goes below the ground, because the game puts the lowest point of
    the rest pose on the ground.
    """
    hole = Part("hole", HOLE, "hole", shade=0)
    kit.cone(hole.bm, Vector((0, 0, 0.0)), Vector((0, 0, 0.004)), 0.13, 0.13, 16)
    for index in range(12):
        a = 2 * math.pi * index / 12
        height = 0.02 + 0.006 * (index % 2)
        clump = kit.sphere(hole.bm, Vector((math.cos(a) * 0.145, math.sin(a) * 0.145, height)), (0.04, 0.034, height), 7, 4)
        hole.paint(faces_of(clump), DIRT_DARK if index % 3 == 0 else DIRT)
    for index, a in enumerate((0.4, 2.2, 3.9, 5.2)):
        height = 0.022 - 0.004 * index
        cobble = kit.box(hole.bm, Vector((math.cos(a) * 0.19, math.sin(a) * 0.19, height / 2)), (0.05, 0.04, height))
        hole.paint(faces_of(cobble), COBBLE)
    return [hole]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("TunnelSaboteur", BONES)
    parts = head_parts() + helmet_parts() + body_parts() + limb_parts() + pliers_parts() + hourglass_parts() + hole_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "TunnelSaboteurMesh")
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

    def stand(breath=0.0, sway=0.0, glass=0.0, snip=0.0):
        """
        The idle stance: feet apart, the pliers and the hourglass up. `glass`
        turns the hourglass (degrees), and `snip` opens the pliers.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.008 - breath * 0.003)),
            "hips": t("hips", (Z, -10), (Y, sway * 2)),
            "spine": t("spine", (X, 2 + breath)),
            "chest": t("chest", (X, -4 - breath * 2), (Z, -4)),
            "neck": t("neck", (Z, 6)),
            "head": t("head", (Z, 6 + sway * 4), (X, -2 + breath * 2), (Y, -8 + sway * 4)),
            "upperarm.R": t("upperarm.R", (X, -breath * 3)),
            "upperarm.L": t("upperarm.L", (X, -breath * 2), (Y, sway * 3)),
            "jaw": t("jaw", (X, -24 * snip)),
            "hourglass": t("hourglass", (X, glass)),
            "thigh.L": t("thigh.L", (X, -10), (Y, -8)),
            "shin.L": t("shin.L", (X, 14)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 8), (Y, 8)),
            "shin.R": t("shin.R", (X, 10)),
            "foot.R": t("foot.R", (X, -18)),
            "hole@scale": 0.01,
        }

    def slump(breath=0.0):
        """Low HP: he sits down hard, and the helmet tips over his eyes."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.04, -0.15 - breath * 0.004)),
            hips=t("hips", (Z, -10), (X, -20)),
            spine=t("spine", (X, 26 + breath * 3)),
            chest=t("chest", (X, 12 + breath * 2)),
            head=t("head", (Z, 4), (X, 14 + breath * 4), (Y, -10)),
            helmet=t("helmet", (X, 26)),
            helmet_at_loc=at("helmet", (0, -0.02, -0.02)),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -10)),
            forearm__R=t("forearm.R", (X, 50)),
            upperarm__L=t("upperarm.L", (X, 40), (Y, -30)),
            forearm__L=t("forearm.L", (X, 60)),
            thigh__L=t("thigh.L", (X, -80), (Y, -14)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -76), (Y, 14)),
            shin__R=t("shin.R", (X, 50)),
            foot__R=t("foot.R", (X, 0)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.014)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -12 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            helmet=t("helmet", (X, -10 * amount)),
            upperarm__R=t("upperarm.R", (X, 10 * amount), (Y, -12 * amount)),
            upperarm__L=t("upperarm.L", (X, 10 * amount), (Y, 16 * amount)),
        )

    def sink(base, depth=0.0, arms=1.0):
        """
        He drops down the hole: `depth` lowers him into it, and `arms` throws
        the arms up, with the pliers and the hourglass.
        """
        return pose(
            base,
            root_at_loc=at("root", (0, 0, -depth)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, -6)),
            head=t("head", (X, -16 * arms), (Z, 4)),
            helmet=t("helmet", (X, -16 * arms)),
            upperarm__R=t("upperarm.R", (X, -150 * arms), (Y, -20 * arms)),
            forearm__R=t("forearm.R", (X, -10 * arms)),
            upperarm__L=t("upperarm.L", (X, -60 * arms), (Y, 20 * arms)),
            thigh__L=t("thigh.L", (X, -10)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 0)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, 30)),
            hole_at_scale=1.0,
        )

    def climb(base, pull=0.0):
        """The summon: he pulls himself up out of his tunnel. `pull` is 0 with the arms up, 1 with the arms down."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.04 * (1 - pull))),
            spine=t("spine", (X, 20 - 10 * pull)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, -20 + 20 * pull)),
            upperarm__R=t("upperarm.R", (X, -110 + 80 * pull), (Y, -20)),
            forearm__R=t("forearm.R", (X, -20 + 40 * pull)),
            hand__R=t("hand.R", (X, 80 * (1 - pull))),
            upperarm__L=t("upperarm.L", (X, -20 + 30 * pull), (Y, -10 * pull)),
            thigh__L=t("thigh.L", (X, -70 * (1 - pull))),
            shin__L=t("shin.L", (X, 90 * (1 - pull))),
            foot__L=t("foot.L", (X, -10)),
        )

    def step(front, lift=0.0):
        """A waddle: the body rocks from side to side. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0.012 * front, 0, -0.002 + lift * 0.012)),
            hips=t("hips", (Z, -8), (Y, 7 * front)),
            spine=t("spine", (X, 6), (Y, -4 * front)),
            chest=t("chest", (Z, -5 * front)),
            head=t("head", (Z, 6), (Y, -6 * front)),
            upperarm__L=t("upperarm.L", (X, -6 * front), (Y, 6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -30 - lift * 8)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 16 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 8)),
            },
        )

    # The attack: he opens the pliers wide and lunges, and the pliers snap
    # shut on the target at 50% of the clip (frame 15).
    def reach(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.025, -0.02)),
            hips=t("hips", (Z, -20)),
            chest=t("chest", (X, -10), (Z, -12)),
            head=t("head", (Z, 12), (X, -10)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, -30)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, 90), (Z, 40)),
            jaw=t("jaw", (X, -40)),
            thigh__L=t("thigh.L", (X, -20), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            thigh__R=t("thigh.R", (X, 14), (Y, 8)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -30)),
        )

    def snip(base, shut=1.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.06, -0.03)),
            hips=t("hips", (Z, 6)),
            spine=t("spine", (X, 18)),
            chest=t("chest", (X, 8), (Z, 6)),
            neck=t("neck", (X, -10)),
            head=t("head", (Z, -4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -80), (Y, -6)),
            forearm__R=t("forearm.R", (X, 10)),
            hand__R=t("hand.R", (X, 90)),
            jaw=t("jaw", (X, -40 * (1 - shut))),
            thigh__L=t("thigh.L", (X, -44), (Y, -8)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 24), (Y, 8)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -30)),
        )

    clips = []
    # The idle turns the hourglass once (a full turn, so the loop meets its
    # start) and snips the pliers twice.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, glass, snap in ((0, 0, 0, 0, 0), (6, 0.5, 0.5, 0, 1), (9, 0.6, 0.6, 0, 0), (12, 1, 1, 0, 0), (18, 0.5, 0.5, 0, 0), (24, 0, 0, 0, 0), (27, 0.2, -0.2, 90, 0), (30, 0.4, -0.4, 180, 0), (33, 0.6, -0.6, 270, 0), (36, 0.8, -1, 360, 0), (42, 0.5, -0.5, 360, 1), (45, 0.25, -0.2, 360, 0), (48, 0, 0, 360, 0)):
        idle.key(frame, stand(breath, sway, glass, snap))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 0.5), (24, 1), (36, 0.5), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, step(1, 1)).key(12, step(-1)).key(18, step(-1, 1)).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, reach(stand())).key(13, snip(stand(), 0.2)).key(15, snip(stand()))
    attack.key(19, snip(stand())).key(23, pose(stand(), jaw=t("jaw", (X, -20)))).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    # The death: the hole opens at his feet, he drops down it with his arms
    # up, and the hole closes after him.
    death = Clip("death", 36)
    death.key(0, stand()).key(4, recoil(stand())).key(7, pose(recoil(stand()), hole_at_scale=0.01))
    death.key(10, sink(stand(), 0.0)).key(14, sink(stand(), 0.12)).key(20, sink(stand(), 0.45)).key(24, sink(stand(), 0.75, 0.6))
    death.key(28, sink(stand(), 0.8, 0.6)).key(34, pose(sink(stand(), 0.8, 0.6), hole_at_scale=0.01)).key(36, pose(sink(stand(), 0.8, 0.6), hole_at_scale=0.01))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets
    # up. He drops down the hole and climbs back out of it.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(7, pose(recoil(stand()), hole_at_scale=0.01))
    rebirth.key(10, sink(stand(), 0.0)).key(16, sink(stand(), 0.3)).key(21, sink(stand(), 0.75, 0.6)).key(25, sink(stand(), 0.75, 0.6))
    rebirth.key(31, sink(stand(), 0.3)).key(36, pose(climb(sink(stand(), 0.0)), hole_at_scale=1.0)).key(40, pose(climb(stand(), 1.0), hole_at_scale=1.0))
    rebirth.key(45, stand()).key(48, stand())
    clips.append(rebirth)

    # The summon: the game raises him from the ground, and he climbs out with
    # his arms. Then he turns the hourglass (Sabotage).
    summon = Clip("summon", 24)
    summon.key(0, climb(stand())).key(6, climb(stand(), 0.4)).key(11, climb(stand(), 1.0))
    for frame, glass in ((14, 0), (16, 90), (18, 180), (20, 270), (22, 360)):
        summon.key(frame, stand(0.5, 0, glass))
    summon.key(24, stand(0, 0, 360))
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "tunnel-saboteur.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
