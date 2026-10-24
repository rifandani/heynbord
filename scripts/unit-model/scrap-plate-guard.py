"""
Scrap-Plate Guard (`goblin.scrapPlateGuard`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a small, round pale goblin woman
in armor made from stove plates that is much too big for her. A pot helmet
with a visor grill and a bent stove pipe on its top, a stove door on her
chest, round shoulder plates with a small kettle on the right one, plates
round her hips, iron greaves and big iron-capped boots. Her face shows under
the visor: big amber eyes, a long nose, a small grin, and very large ears out
under the helmet. She holds a shield made from a cart wheel on her left arm
and a short pick in her right hand. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/scrap-plate-guard.glb`;
then `bun unit-model:pack scrap-plate-guard` packs it for the game.

At rest she turns to her right and braces behind the wheel, so the face of
the wheel turns to the camera, and the pick is ready on her right side. The
kettle steams (the `steam` bone scales) and the stove pipe puffs (the
`smoke` bone scales). She has Heavy, so her walk is a slow stomp. Her attack
swings the pick down over the wheel. Bulwark has no event, so her `hurt`
clip shows it: she takes the hit on the wheel and holds. She falls on her
back in the death clip, and the wheel falls across her. She has no Keyword
that she uses by her own action, so she has no cast clip.
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
EAR = hex_color("#e4a08a")
NOSE = hex_color("#d88e7e")
HAIR = hex_color("#ece4d2")
EYES = hex_color("#f2a838")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a1e1a")
TEETH = hex_color("#f0e8d0")
PLATE = hex_color("#9a7448")
PLATE_LIGHT = hex_color("#b88e5a")
PLATE_DARK = hex_color("#6a4c30")
RUST = hex_color("#a8643a")
IRON = hex_color("#5e5852")
IRON_LIGHT = hex_color("#8e8780")
BRASS = hex_color("#d0a048")
KETTLE = hex_color("#e0b050")
BRASS_DARK = hex_color("#93692a")
SLOT = hex_color("#241a14")
CLOTH = hex_color("#4e5868")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
TROUSERS = hex_color("#5a4434")
WOOD = hex_color("#a07a4e")
WOOD_DARK = hex_color("#6e5032")
WOOD_BLUE = hex_color("#5e6a7a")
STEAM = hex_color("#f2f0ec")
SMOKE = hex_color("#9a948e")

# --- Proportions ---------------------------------------------------------------

# She is small and round, with short, thick legs in iron greaves.
HIP_Z = 0.28
WAIST_Z = 0.34
CHEST_Z = 0.41
SHOULDER_Z = 0.47
NECK_Z = 0.49
HEAD_C = Vector((0, -0.02, 0.585))
KNEE_Z = 0.155
ANKLE_Z = 0.045
LEG_X = 0.056

# The left forearm holds the wheel in front of her body. The right hand holds
# the pick on her right side, with its head up and forward.
SL = Vector((0.092, 0, SHOULDER_Z))
EL = Vector((0.14, -0.05, 0.38))
WL = Vector((0.08, -0.13, 0.36))
TL = WL + (WL - EL).normalized() * 0.035
SR = Vector((-0.092, 0, SHOULDER_Z))
ER = Vector((-0.145, 0.0, 0.37))
WR = Vector((-0.13, -0.05, 0.3))
TR = WR + (WR - ER).normalized() * 0.035

WHEEL_C = Vector((0.05, -0.2, 0.33))
WHEEL_N = Vector((-0.65, -1, 0)).normalized()
WHEEL_R = 0.15
GRIP = WR + (WR - ER).normalized() * 0.018
PICK = Vector((-0.08, -0.3, 1)).normalized()
PICK_LENGTH = 0.22
PICK_TOP = GRIP + PICK * PICK_LENGTH
KETTLE_C = Vector((-0.115, 0.01, 0.545))
STEAM_C = KETTLE_C + Vector((0.0, -0.056, 0.034))
HELMET_C = HEAD_C + Vector((0, 0.006, 0.028))
PIPE_TOP = HELMET_C + Vector((0.0, 0.07, 0.16))
SMOKE_C = PIPE_TOP + Vector((0, 0.03, 0.03))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.004, 0.51), "chest"),
    ("head", (0, -0.004, 0.51), (0, -0.01, 0.69), "neck"),
    ("smoke", tuple(SMOKE_C), tuple(SMOKE_C + Z * 0.04), "head"),
    ("kettle", tuple(KETTLE_C), tuple(KETTLE_C + Z * 0.04), "chest"),
    ("steam", tuple(STEAM_C), tuple(STEAM_C + Z * 0.04), "kettle"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.018), f"shin.{side}"),
    ]
BONES += [
    ("wheel", tuple(WHEEL_C), tuple(WHEEL_C + WHEEL_N * 0.06), "forearm.L"),
    ("pick", tuple(GRIP), tuple(GRIP + PICK * 0.08), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.3, 0.37)
    return blend("spine", "chest", co.z, 0.39, 0.45)


# --- Parts ---------------------------------------------------------------------


def rivets(part, points, color=BRASS_DARK, size=0.005):
    for point in points:
        rivet = kit.sphere(part.bm, point, (size, size, size), 4, 3)
        part.paint(faces_of(rivet), color)


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.074, 0.07, 0.07), 14, 10)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.03, -0.048)), (0.046, 0.036, 0.03), 10, 6)
    nose = kit.tube(head.bm, [HEAD_C + Vector((0, -0.066, -0.006)), HEAD_C + Vector((0, -0.096, -0.016)), HEAD_C + Vector((0, -0.11, -0.03))], [0.016, 0.011, 0.006], 6)
    head.paint(faces_of(nose), NOSE)
    for sign in (1, -1):
        # Very large goblin ears out under the helmet. Each ear is a flat leaf
        # with its face to the side, so the camera sees it.
        base = HEAD_C + Vector((0.06 * sign, 0.016, -0.01))
        tip = HEAD_C + Vector((0.17 * sign, 0.1, -0.05))
        ear = kit.cone(head.bm, base, tip, 0.044, 0.003, 8)
        thin = Z.cross((tip - base).normalized()).normalized()
        for vert in ear:
            vert.co -= thin * (vert.co - base).dot(thin) * 0.7
        for face in faces_of(ear):
            face.normal_update()
            if face.normal.x * sign > 0.3:
                head.paint([face], EAR)
    for index in range(5):
        a = math.radians(70 + index * 55)
        root = HEAD_C + Vector((0.068 * math.sin(a), 0.064 * math.cos(a), -0.004))
        tuft = kit.cone(head.bm, root, root + Vector((0.026 * math.sin(a), 0.026 * math.cos(a), -0.03)), 0.015, 0.004, 5)
        head.paint(faces_of(tuft), HAIR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A small, firm grin with a row of teeth.
    grin = [HEAD_C + Vector((0.028, -0.058, -0.034)), HEAD_C + Vector((0.0, -0.066, -0.04)), HEAD_C + Vector((-0.028, -0.058, -0.032))]
    kit.tube(face.bm, grin, [0.004, 0.006, 0.004], 5)
    teeth = kit.tube(face.bm, [p + Vector((0, -0.004, 0.002)) for p in grin], [0.0025, 0.0035, 0.0025], 4)
    face.paint(faces_of(teeth), TEETH)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.06, 0.006))
        eye = kit.sphere(face.bm, center, (0.02, 0.013, 0.018), 10, 6)
        face.paint(faces_of(eye), EYES)
        pupil = kit.sphere(face.bm, center + Vector((-0.005 * sign, -0.011, 0.002)), (0.008, 0.004, 0.009), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.47), (0, -0.004, 0.55), 0.028, 0.026, 8)
    parts.append(neck)
    return parts


def helmet_parts():
    """A pot helmet with a visor grill over the brow, and a bent stove pipe on its top."""
    helmet = Part("helmet", PLATE, "head", shade=0.08)
    c = HELMET_C
    dome = kit.sphere(helmet.bm, c, (0.094, 0.092, 0.084), 16, 10)
    low = [v for v in dome if v.co.z < c.z - 0.006]
    bmesh.ops.delete(helmet.bm, geom=low, context="VERTS")
    band = kit.torus(helmet.bm, c + Vector((0, 0, -0.004)), (0, 0, 1), 0.094, 0.01, 20, 4)
    helmet.paint(faces_of(band), PLATE_DARK)
    rivets(helmet, [c + Vector((math.cos(a) * 0.1, math.sin(a) * 0.098, -0.004)) for a in [i * math.pi / 5 for i in range(10)]])
    # The visor: a curved plate with slots, over the brow.
    visor_c = c + Vector((0, -0.07, 0.012))
    visor = kit.slab(helmet.bm, visor_c, (0.07, 0, 0), (0, 0.016, 0.006), (0, -0.006, 0.026))
    helmet.paint(faces_of(visor), PLATE_LIGHT)
    for index in range(5):
        x = -0.044 + index * 0.022
        slot = kit.box(helmet.bm, visor_c + Vector((x, -0.016, 0.0)), (0.01, 0.006, 0.03))
        helmet.paint(faces_of(slot), SLOT)
    for sign in (1, -1):
        hinge = kit.cone(helmet.bm, visor_c + Vector((0.074 * sign, 0.0, 0.0)), visor_c + Vector((0.088 * sign, 0.01, 0.0)), 0.01, 0.01, 6)
        helmet.paint(faces_of(hinge), IRON)
    for at in ((0.05, -0.04, 0.06), (-0.05, 0.05, 0.05)):
        rust = kit.sphere(helmet.bm, c + Vector(at), (0.024, 0.024, 0.016), 6, 4)
        helmet.paint(faces_of(rust), RUST)
    # The stove pipe: up from the top of the helmet, with a bend to the back.
    path = [c + Vector((0, 0.01, 0.07)), c + Vector((0, 0.014, 0.12)), c + Vector((0, 0.036, 0.15)), PIPE_TOP]
    pipe = kit.tube(helmet.bm, path, [0.026, 0.025, 0.025, 0.024], 10)
    helmet.paint(faces_of(pipe), IRON)
    for point in (path[0] + Z * 0.008, path[1]):
        ring = kit.torus(helmet.bm, point, (0, 0.1, 1), 0.027, 0.004, 10, 3)
        helmet.paint(faces_of(ring), IRON_LIGHT)
    mouth = kit.torus(helmet.bm, PIPE_TOP, (path[-1] - path[-2]).normalized(), 0.024, 0.005, 10, 3)
    helmet.paint(faces_of(mouth), SLOT)
    return [helmet]


def body_parts():
    parts = []
    armor = Part("armor", PLATE, torso_weights, shade=0.1)
    kit.cone(armor.bm, (0, 0, 0.24), (0, 0, 0.48), 0.092, 0.084, 12, squash=0.86)
    kit.sphere(armor.bm, (0, -0.02, 0.36), (0.092, 0.08, 0.09), 12, 8)
    # The stove door on her chest: a riveted plate with a latch and hinges.
    door_c = Vector((0, -0.098, 0.37))
    door = kit.box(armor.bm, door_c, (0.11, 0.014, 0.11))
    armor.paint(faces_of(door), PLATE_LIGHT)
    frame = kit.box(armor.bm, door_c + Vector((0, 0.004, 0)), (0.124, 0.01, 0.124))
    armor.paint(faces_of(frame), PLATE_DARK)
    latch = kit.box(armor.bm, door_c + Vector((-0.04, -0.012, 0.0)), (0.012, 0.012, 0.03))
    armor.paint(faces_of(latch), BRASS)
    for z in (-0.04, 0.04):
        hinge = kit.cone(armor.bm, door_c + Vector((0.058, -0.008, z - 0.012)), door_c + Vector((0.058, -0.008, z + 0.012)), 0.008, 0.008, 6)
        armor.paint(faces_of(hinge), IRON)
    rivets(armor, [door_c + Vector((x, -0.008, z)) for x in (-0.048, 0.048) for z in (-0.048, 0.048)], BRASS)
    gauge = kit.cone(armor.bm, door_c + Vector((0.018, -0.008, 0.022)), door_c + Vector((0.018, -0.016, 0.022)), 0.014, 0.014, 10)
    armor.paint(faces_of(gauge), BRASS)
    # A blue cloth at the neck.
    collar = kit.torus(armor.bm, (0, -0.004, 0.48), (0, 0.15, 1), 0.046, 0.016, 12, 5)
    armor.paint(faces_of(collar), CLOTH)
    parts.append(armor)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, -0.004, 0.255), (0, -0.004, 0.285), 0.094, 0.094, 12, squash=0.86)
    buckle = kit.box(belt.bm, (0, -0.086, 0.27), (0.028, 0.008, 0.026))
    belt.paint(faces_of(buckle), BRASS)
    # Plates round her hips.
    for index in range(5):
        a = math.radians(-60 + index * 60)
        plate = kit.slab(belt.bm, Vector((0.09 * math.sin(a), -0.078 * math.cos(a), 0.215)), (0.032 * math.cos(a), 0.032 * math.sin(a), 0), (0.006 * math.sin(a), -0.006 * math.cos(a), 0), (0, 0, 0.036))
        belt.paint(faces_of(plate), PLATE if index % 2 else PLATE_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.19), (0, 0, 0.26), 0.084, 0.084, 12, squash=0.86)
    parts.append(hips)
    return parts


def kettle_parts():
    """The small kettle on her right shoulder plate, and its puff of steam."""
    kettle = Part("kettle", KETTLE, "kettle", shade=0.08)
    c = KETTLE_C
    kit.sphere(kettle.bm, c, (0.04, 0.038, 0.032), 10, 7)
    lid = kit.cone(kettle.bm, c + Z * 0.026, c + Z * 0.038, 0.024, 0.014, 10)
    kettle.paint(faces_of(lid), BRASS_DARK)
    knob = kit.sphere(kettle.bm, c + Z * 0.042, (0.007, 0.007, 0.007), 5, 4)
    kettle.paint(faces_of(knob), PLATE_DARK)
    kit.tube(kettle.bm, [c + Vector((0, -0.026, 0.0)), c + Vector((0, -0.046, 0.014)), STEAM_C - Vector((0, -0.006, 0.012))], [0.009, 0.007, 0.005], 6)
    handle = kit.torus(kettle.bm, c + Vector((0, 0.0, 0.034)), (1, 0, 0), 0.03, 0.004, 10, 3)
    kettle.paint([f for f in faces_of(handle) if f.calc_center_median().z > c.z + 0.036], BRASS_DARK)

    steam = Part("steam", STEAM, "steam", shade=0)
    for index, (dy, dz, r) in enumerate(((0, 0, 0.012), (-0.008, 0.018, 0.015), (0.004, 0.038, 0.018))):
        kit.sphere(steam.bm, STEAM_C + Vector((0.004 * (index % 2), dy, dz)), (r, r, r), 7, 5)
    smoke = Part("smoke", SMOKE, "smoke", shade=0)
    for index, (dy, dz, r) in enumerate(((0, 0, 0.016), (0.012, 0.022, 0.02), (0.006, 0.048, 0.024))):
        kit.sphere(smoke.bm, SMOKE_C + Vector((0, dy, dz)), (r, r, r), 7, 5)
    return [kettle, steam, smoke]


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"upperarm.{side}", CLOTH, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.03, 0.026, 8)
        # A round shoulder plate, as a pot lid.
        pauldron = kit.sphere(upper.bm, s + Vector((0.012 * sign, 0, 0.012)), (0.058, 0.056, 0.042), 10, 6)
        upper.paint(faces_of(pauldron), PLATE)
        rim = kit.torus(upper.bm, s + Vector((0.012 * sign, 0, 0.002)), (0.3 * sign, 0, 1), 0.056, 0.006, 12, 3)
        upper.paint(faces_of(rim), PLATE_DARK)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", PLATE, f"forearm.{side}", shade=0.06)
        kit.cone(forearm.bm, e, w, 0.028, 0.025, 8)
        cuff = kit.torus(forearm.bm, w - d * 0.012, d, 0.027, 0.005, 8, 3)
        forearm.paint(faces_of(cuff), PLATE_DARK)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.016, (0.018, 0.016, 0.021), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.046, 0.038, 8)
        cop = kit.sphere(thigh.bm, knee + Vector((0, -0.024, 0.0)), (0.032, 0.024, 0.03), 8, 5)
        thigh.paint(faces_of(cop), IRON_LIGHT)
        parts.append(thigh)

        # An iron greave over the shin.
        shin = Part(f"shin.{side}", IRON, f"shin.{side}", shade=0.06)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.01)), ankle + Vector((0, 0, 0.01)), 0.036, 0.032, 8)
        for z in (0.04, 0.09):
            ring = kit.torus(shin.bm, ankle + Vector((0, 0, z)), (0, 0, 1), 0.036, 0.004, 8, 3)
            shin.paint(faces_of(ring), IRON_LIGHT)
        parts.append(shin)

        # A big iron-capped boot.
        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}", shade=0.05)
        kit.cone(foot.bm, ankle + Vector((0, 0.004, 0.02)), ankle - Vector((0, 0, 0.03)), 0.036, 0.036, 8)
        kit.sphere(foot.bm, (LEG_X * sign, -0.032, 0.02), (0.034, 0.062, 0.02), 8, 6)
        cap = kit.sphere(foot.bm, (LEG_X * sign, -0.07, 0.022), (0.03, 0.03, 0.02), 8, 5)
        foot.paint(faces_of(cap), IRON_LIGHT)
        sole = kit.box(foot.bm, (LEG_X * sign, -0.03, 0.005), (0.07, 0.13, 0.01))
        foot.paint(faces_of(sole), LEATHER_DARK)
        parts.append(foot)
    return parts


def wheel_parts():
    """The cart-wheel shield: an iron tire, a wooden rim, eight spokes and a hub."""
    wheel = Part("wheel", WOOD, "wheel", shade=0.05)
    c, n = WHEEL_C, WHEEL_N
    across = n.cross(Z).normalized()
    up = across.cross(n).normalized()
    tire = kit.torus(wheel.bm, c, n, WHEEL_R, 0.014, 24, 5)
    wheel.paint(faces_of(tire), IRON)
    felloe = kit.torus(wheel.bm, c, n, WHEEL_R - 0.022, 0.016, 24, 5)
    for face in faces_of(felloe):
        wheel.paint([face], WOOD_DARK if face.calc_center_median().z < c.z - 0.06 else WOOD)
    for index in range(8):
        a = 2 * math.pi * index / 8 + 0.2
        out = across * math.cos(a) + up * math.sin(a)
        spoke = kit.cone(wheel.bm, c + out * 0.03, c + out * (WHEEL_R - 0.03), 0.011, 0.008, 5)
        wheel.paint(faces_of(spoke), WOOD_BLUE if index % 3 == 0 else WOOD)
        rivet = kit.sphere(wheel.bm, c + out * WHEEL_R - n * 0.012, (0.006, 0.006, 0.006), 4, 3)
        wheel.paint(faces_of(rivet), IRON_LIGHT)
    hub = kit.cone(wheel.bm, c + n * 0.035, c - n * 0.03, 0.034, 0.036, 12)
    wheel.paint(faces_of(hub), WOOD_DARK)
    cap = kit.cone(wheel.bm, c + n * 0.035, c + n * 0.05, 0.026, 0.018, 12)
    wheel.paint(faces_of(cap), IRON)
    for ring_at in (0.025, -0.02):
        ring = kit.torus(wheel.bm, c + n * ring_at, n, 0.036, 0.004, 12, 3)
        wheel.paint(faces_of(ring), IRON_LIGHT)
    return [wheel]


def pick_parts():
    """A short pick: a wooden handle and an iron head in the plane of the swing."""
    pick = Part("pick", WOOD, "pick", shade=0.04)
    kit.cone(pick.bm, GRIP - PICK * 0.05, PICK_TOP, 0.009, 0.01, 6)
    wrap = kit.cone(pick.bm, GRIP - PICK * 0.03, GRIP + PICK * 0.03, 0.011, 0.011, 6)
    pick.paint(faces_of(wrap), LEATHER_DARK)
    forward = (-Y - PICK * (-Y).dot(PICK)).normalized()
    head = [PICK_TOP + forward * 0.11 - PICK * 0.04, PICK_TOP + forward * 0.06, PICK_TOP, PICK_TOP - forward * 0.05, PICK_TOP - forward * 0.075 - PICK * 0.01]
    blade = kit.tube(pick.bm, head, [0.003, 0.011, 0.014, 0.011, 0.008], 6)
    pick.paint(faces_of(blade), IRON_LIGHT)
    socket = kit.cone(pick.bm, PICK_TOP - PICK * 0.02, PICK_TOP + PICK * 0.018, 0.016, 0.016, 8)
    pick.paint(faces_of(socket), IRON)
    return [pick]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("ScrapPlateGuard", BONES)
    parts = head_parts() + helmet_parts() + body_parts() + kettle_parts() + limb_parts() + wheel_parts() + pick_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "ScrapPlateGuardMesh")
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

    def stand(breath=0.0, peek=0.0, steam=1.0, smoke=1.0):
        """
        The idle stance: turned to her right and braced behind the wheel.
        `peek` lifts her head over the wheel, and `steam` and `smoke` are
        the sizes of the puffs.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.02 - breath * 0.003)),
            "hips": t("hips", (Z, -26)),
            "spine": t("spine", (X, 6 + breath)),
            "chest": t("chest", (X, 2 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, -4), (Z, 10)),
            "head": t("head", (X, -4 - peek * 10 + breath * 2), (Z, 10 - peek * 6)),
            "upperarm.R": t("upperarm.R", (X, -10 - breath * 3)),
            "forearm.R": t("forearm.R", (X, -10)),
            "upperarm.L": t("upperarm.L", (X, -breath * 2)),
            "thigh.L": t("thigh.L", (X, -26), (Y, -8)),
            "shin.L": t("shin.L", (X, 30)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 14), (Y, 10)),
            "shin.R": t("shin.R", (X, 22)),
            "foot.R": t("foot.R", (X, -34)),
            "steam@scale": steam,
            "smoke@scale": smoke,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee behind the wheel, which rests on the ground."""
        return pose(
            stand(steam=0.4 + 0.3 * breath, smoke=0.3),
            hips_at_loc=at("hips", (0, 0.02, -0.11 - breath * 0.004)),
            spine=t("spine", (X, 22 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2), (Z, -4)),
            head=t("head", (Z, 4), (X, 16 + breath * 4), (Y, -10)),
            upperarm__L=t("upperarm.L", (X, 20)),
            forearm__L=t("forearm.L", (X, 10)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, -10)),
            forearm__R=t("forearm.R", (X, -30)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 10), (Y, 6)),
            shin__R=t("shin.R", (X, 110)),
            foot__R=t("foot.R", (X, -20)),
        )

    def brace(base, amount=1.0):
        """Bulwark: the hit lands on the wheel, she slides back a little and holds."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, -0.015 * amount - 0.012)),
            spine=t("spine", (X, 14 * amount + 6)),
            chest=t("chest", (X, 6 * amount), (Z, -4)),
            head=t("head", (X, 8 * amount), (Z, 10)),
            upperarm__L=t("upperarm.L", (X, 14 * amount)),
            forearm__L=t("forearm.L", (X, 10 * amount)),
            thigh__L=t("thigh.L", (X, -36), (Y, -8)),
            shin__L=t("shin.L", (X, 44)),
            thigh__R=t("thigh.R", (X, 24), (Y, 10)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -40)),
            steam_at_scale=1 + 0.8 * amount,
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.008)),
            spine=t("spine", (X, -10)),
            chest=t("chest", (X, -14)),
            head=t("head", (X, -20)),
            upperarm__R=t("upperarm.R", (X, 16), (Y, -24)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 20)),
            thigh__L=t("thigh.L", (X, -10)),
            shin__L=t("shin.L", (X, 20)),
            thigh__R=t("thigh.R", (X, 20)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, and the wheel falls across her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20), (Z, -24)),
            upperarm__R=t("upperarm.R", (Y, -70), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, 80)),
            forearm__L=t("forearm.L", (X, 0)),
            thigh__L=t("thigh.L", (X, -30), (Y, -10)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -40), (Y, 10)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            steam_at_scale=0.01,
            smoke_at_scale=0.01,
        )

    def crouch(base):
        """Low behind the wheel, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.09)),
            spine=t("spine", (X, 24)),
            head=t("head", (X, 16)),
            thigh__L=t("thigh.L", (X, -60), (Y, -8)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -36)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -46)),
            steam_at_scale=0.3,
            smoke_at_scale=0.3,
        )

    def proud(base):
        """Up again, the pick raised high and the pipe puffing: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -8)),
            head=t("head", (Z, 6), (X, -12)),
            upperarm__R=t("upperarm.R", (X, -140), (Y, -20)),
            forearm__R=t("forearm.R", (X, -10)),
            steam_at_scale=1.6,
            smoke_at_scale=1.6,
        )

    def stomp(front, lift=0.0):
        """Heavy: a slow stomp, and the body rocks. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(steam=1.0 + 0.4 * lift, smoke=0.8 + 0.6 * (1 - lift)),
            hips_at_loc=at("hips", (0.014 * front, 0, -0.002 + lift * 0.016)),
            hips=t("hips", (Z, -20), (Y, 8 * front)),
            spine=t("spine", (X, 8), (Y, -5 * front)),
            chest=t("chest", (Z, -4 - 4 * front)),
            head=t("head", (Z, 10), (Y, -6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34 - lift * 16)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 20 + lift * 40)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14)),
                f"shin__{back}": t(f"shin.{back}", (X, 18)),
                f"foot__{back}": t(f"foot.{back}", (X, 6)),
            },
        )

    # The attack: she raises the pick and swings it down over the wheel. The
    # hit lands at 50% of the clip (frame 15).
    def raise_pick(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.02)),
            hips=t("hips", (Z, -30)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10), (Z, -8)),
            head=t("head", (X, -12), (Z, 12)),
            upperarm__R=t("upperarm.R", (X, -160), (Y, -20)),
            forearm__R=t("forearm.R", (X, -30)),
            hand__R=t("hand.R", (X, 20)),
            steam_at_scale=1.4,
        )

    def chop(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.05, -0.04)),
            hips=t("hips", (Z, -14)),
            spine=t("spine", (X, 20)),
            chest=t("chest", (X, 10), (Z, 4)),
            head=t("head", (X, -16), (Z, 6)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 50)),
            upperarm__L=t("upperarm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, -50), (Y, -8)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 26), (Y, 10)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -30)),
            smoke_at_scale=1.6,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, peek, steam, smoke in ((0, 0, 0, 1, 1), (6, 0.25, 0.3, 0.6, 1.3), (12, 0.5, 1, 1.3, 0.7), (18, 0.75, 1, 0.7, 1.2), (24, 1, 0.5, 1.2, 0.8), (30, 0.75, 0, 0.6, 1.4), (36, 0.5, 0, 1.3, 0.7), (42, 0.25, 0, 0.7, 1.2), (48, 0, 0, 1, 1)):
        idle.key(frame, stand(breath, peek, steam, smoke))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 0.5), (24, 1), (36, 0.5), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    # Heavy: a slow walk of two stomps.
    walk = Clip("walk", 24, loop=True)
    walk.key(0, stomp(1)).key(7, stomp(1, 1)).key(12, stomp(-1)).key(19, stomp(-1, 1)).key(24, stomp(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, raise_pick(stand())).key(14, chop(stand())).key(18, chop(stand()))
    attack.key(25, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, brace(stand())).key(8, brace(stand(), 0.5)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, brace(stand())).key(12, stagger(stand()))
    death.key(24, fallen(stand())).key(28, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, brace(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.01, -0.07))))
    summon.key(17, proud(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "scrap-plate-guard.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
