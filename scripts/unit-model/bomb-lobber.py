"""
Bomb Lobber (`goblin.bombLobber`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a plump pale goblin woman with a
big mass of wild white hair, very large ears, a wide grin and one eye shut
in a wink, smoked brass goggles on her forehead, a blue neckerchief, a torn
tan tunic with leather straps, a brass canteen at her left hip, brown
trousers with a torn hem, leather wraps on the calves and bare feet. She
holds a big racket made from a barrel hoop and wire in her right hand and a
lit bomb in her left hand, and a wicker basket of bombs hangs at her right
hip. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/bomb-lobber.glb`; then
`bun unit-model:pack bomb-lobber` packs it for the game.

At rest the racket lies on her right shoulder, on the camera side, with its
face to the camera, and the fuse of the bomb sparks (the `spark` bone
scales). Her attack tosses the bomb up and hits it forward with the racket,
like a ball. The bomb leaves at 20% of the clip, when the projectile leaves:
the `bomb` bone scales down. Then she covers her left ear with her free hand,
and takes a new bomb from the basket. Her walk is a waddle. She has no
Keyword that she uses by her own action, so she has no cast clip.
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
importlib.reload(body_plans.biped)
importlib.reload(body_plans.biped_small)
importlib.reload(clips.base)
importlib.reload(clips.overrides)
importlib.reload(clips.biped)
importlib.reload(clips.biped_small)

from clips.base import Beat  # noqa: E402
from clips.overrides import Fall, Patch  # noqa: E402

from unit_model_kit import X, Y, Z, Part, blend, faces_of, hex_color  # noqa: E402

plan = body_plans.BODY_PLANS["biped-small"]

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#c2bdb2")
SKIN_DARK = hex_color("#8e887e")
EAR = hex_color("#e8a088")
CHEEK = hex_color("#d8a89a")
HAIR = hex_color("#f0e8d4")
HAIR_DARK = hex_color("#d4c8a8")
EYES = hex_color("#f0a43a")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#5a2422")
TEETH = hex_color("#f4eedc")
TONGUE = hex_color("#c85a50")
BRASS = hex_color("#cc9b55")
BRASS_DARK = hex_color("#946933")
SMOKED = hex_color("#3a2a20")
NECKERCHIEF = hex_color("#494f5c")
TUNIC = hex_color("#c4a476")
TUNIC_DARK = hex_color("#9a7c52")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
TROUSERS = hex_color("#5e4232")
TROUSERS_DARK = hex_color("#43302a")
WRAP = hex_color("#6a4228")
WOOD = hex_color("#a0703a")
WOOD_DARK = hex_color("#6a4422")
WIRE = hex_color("#3e3a36")
WICKER = hex_color("#b08446")
WICKER_DARK = hex_color("#7a5428")
BOMB = hex_color("#322a29")
BOMB_LIGHT = hex_color("#4f433f")
FUSE = hex_color("#c8b88a")
SPARK = hex_color("#fac668")
SPARK_HOT = hex_color("#dd8c53")

# --- Proportions ---------------------------------------------------------------

# She is plump: a round body and short, thick legs.
TABLE = plan.Proportions(
    hip_z=0.28,
    waist_z=0.34,
    chest_z=0.41,
    shoulder_z=0.47,
    neck_z=0.49,
    head_base_z=0.52,
    head_top_z=0.7,
    knee_z=0.155,
    head_base_y=-0.004,
    hip_x=0.052,
    knee_x=0.052,
)
HIP_Z = TABLE.hip_z
WAIST_Z = TABLE.waist_z
CHEST_Z = TABLE.chest_z
SHOULDER_Z = TABLE.shoulder_z
NECK_Z = TABLE.neck_z
HEAD_C = Vector((0, -0.02, 0.59))
KNEE_Z = TABLE.knee_z
ANKLE_Z = TABLE.ankle_z
LEG_X = TABLE.hip_x

# The right hand holds the racket at the chest, and the racket lies on the
# right shoulder. The left hand holds a lit bomb in front of the belly. These
# are the rest (bind) positions.
SR = Vector(plan.shoulder_point(TABLE, -1))
ER = Vector((-0.13, -0.02, 0.37))
WR = Vector((-0.1, -0.075, 0.325))
TR = WR + (WR - ER).normalized() * 0.035
SL = Vector(plan.shoulder_point(TABLE, 1))
EL = Vector((0.13, -0.01, 0.37))
WL = Vector((0.1, -0.085, 0.33))
TL = WL + (WL - EL).normalized() * 0.035

RACKET = Vector((-0.22, 0.38, 0.9)).normalized()
GRIP_R = WR + (WR - ER).normalized() * 0.018
HOOP_AT = 0.235
HOOP_R = 0.075
# The face of the racket turns to the camera side (-X).
HOOP_N = (X - RACKET * X.dot(RACKET)).normalized()
BOMB_C = WL + (WL - EL).normalized() * 0.03 + Vector((0, -0.012, 0.012))
BOMB_R = 0.03
SPARK_C = BOMB_C + Vector((0.006, -0.01, BOMB_R + 0.03))

BASKET_C = Vector((-0.088, 0.045, 0.22))

PROP_BONES = [
    ("bomb", tuple(BOMB_C), tuple(BOMB_C + Z * 0.04), "hand.L"),
    ("spark", tuple(SPARK_C), tuple(SPARK_C + Z * 0.03), "bomb"),
]
ARMS = {"L": (EL, WL, TL), "R": (ER, WR, TR)}

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.3, 0.37)
    return blend("spine", "chest", co.z, 0.39, 0.45)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.078, 0.074, 0.074), 14, 10)
    # Round cheeks, a round chin and a short, round nose.
    for sign in (1, -1):
        cheek = kit.sphere(head.bm, HEAD_C + Vector((0.038 * sign, -0.046, -0.024)), (0.03, 0.026, 0.026), 8, 6)
        head.paint(faces_of(cheek), CHEEK)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.03, -0.05)), (0.046, 0.038, 0.032), 10, 6)
    nose = kit.sphere(head.bm, HEAD_C + Vector((0, -0.08, -0.004)), (0.018, 0.022, 0.018), 8, 6)
    head.paint(faces_of(nose), CHEEK)
    for sign in (1, -1):
        # Very large goblin ears, out to the sides and up.
        ear = kit.cone(head.bm, HEAD_C + Vector((0.068 * sign, 0.012, 0.01)), HEAD_C + Vector((0.21 * sign, 0.04, 0.07)), 0.044, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A wide open grin: the dark mouth, a row of top teeth and the tongue.
    mouth_c = HEAD_C + Vector((0, -0.06, -0.038))
    kit.sphere(face.bm, mouth_c, (0.036, 0.016, 0.018), 10, 6)
    teeth = kit.box(face.bm, mouth_c + Vector((0, -0.01, 0.009)), (0.05, 0.008, 0.009))
    face.paint(faces_of(teeth), TEETH)
    tongue = kit.sphere(face.bm, mouth_c + Vector((0, -0.008, -0.008)), (0.018, 0.008, 0.007), 6, 4)
    face.paint(faces_of(tongue), TONGUE)
    # The left eye is open, and the right eye, on the camera side, is shut in a wink.
    center = HEAD_C + Vector((0.032, -0.062, 0.016))
    eye = kit.sphere(face.bm, center, (0.02, 0.012, 0.02), 10, 6)
    face.paint(faces_of(eye), EYES)
    pupil = kit.sphere(face.bm, center + Vector((-0.004, -0.011, 0)), (0.008, 0.004, 0.009), 6, 4)
    face.paint(faces_of(pupil), PUPIL)
    wink = HEAD_C + Vector((-0.032, -0.064, 0.014))
    shut = kit.tube(face.bm, [wink + Vector((0.016, 0.002, -0.002)), wink + Vector((0, -0.004, 0.006)), wink + Vector((-0.016, 0.002, -0.004))], [0.0035, 0.004, 0.0035], 4)
    face.paint(faces_of(shut), PUPIL)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.08)
    # A big mass of wild white hair, with tufts that stick out everywhere.
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.025, 0.045)), (0.088, 0.084, 0.056), 12, 7)
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.055, -0.005)), (0.08, 0.055, 0.068), 10, 6)
    for index in range(11):
        a = math.radians(-150 + index * 30)
        root = HEAD_C + Vector((0.058 * math.sin(a), 0.03 + 0.045 * math.cos(a), 0.055))
        reach = 0.05 + 0.025 * ((index * 5) % 3)
        tip = root + Vector((reach * math.sin(a), 0.02 + reach * math.cos(a), 0.045 - 0.02 * (index % 3)))
        tuft = kit.cone(hair.bm, root, tip, 0.032, 0.006, 5)
        if index % 2:
            hair.paint(faces_of(tuft), HAIR_DARK)
    parts.append(hair)

    # Smoked brass goggles up on the forehead, on a leather band.
    goggles = Part("goggles", BRASS, "head", shade=0.05)
    band = kit.torus(goggles.bm, HEAD_C + Vector((0, 0.004, 0.036)), (0, 0.25, 1), 0.08, 0.007, 16, 4)
    goggles.paint(faces_of(band), LEATHER_DARK)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.07, 0.056))
        out = Vector((0.15 * sign, -1, 0.35)).normalized()
        kit.cone(goggles.bm, center - out * 0.006, center + out * 0.022, 0.024, 0.022, 12)
        rim = kit.torus(goggles.bm, center + out * 0.022, out, 0.021, 0.005, 12, 3)
        goggles.paint(faces_of(rim), BRASS_DARK)
        lens = kit.cone(goggles.bm, center + out * 0.02, center + out * 0.024, 0.018, 0.018, 12)
        goggles.paint(faces_of(lens), SMOKED)
    parts.append(goggles)

    neck = Part("neck", SKIN, plan.neck_weights(TABLE))
    rings = kit.shares(0.47, 0.55, NECK_Z - 0.01, NECK_Z, NECK_Z + 0.01)
    kit.cone(neck.bm, (0, 0, 0.47), (0, -0.004, 0.55), 0.028, 0.026, 8, loops=rings)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", TUNIC, torso_weights)
    rings = kit.shares(0.24, 0.47, WAIST_Z - 0.02, WAIST_Z, WAIST_Z + 0.02, CHEST_Z - 0.02, CHEST_Z, CHEST_Z + 0.02)
    kit.cone(tunic.bm, (0, 0, 0.24), (0, 0, 0.47), 0.08, 0.07, 12, squash=0.85, loops=rings)
    # A round belly.
    kit.sphere(tunic.bm, (0, -0.026, 0.33), (0.078, 0.068, 0.072), 12, 8)
    # A torn hem.
    for index in range(10):
        a = math.radians(index * 36 + 10)
        top = Vector((0.08 * math.sin(a), -0.068 * math.cos(a), 0.26))
        rag = kit.cone(tunic.bm, top, top + Vector((0.01 * math.sin(a), -0.01 * math.cos(a), -0.04 - 0.012 * (index % 3))), 0.02, 0.004, 4, squash=0.5)
        tunic.paint(faces_of(rag), TUNIC_DARK if index % 2 else TUNIC)
    parts.append(tunic)

    # The blue neckerchief.
    kerchief = Part("kerchief", NECKERCHIEF, "chest", shade=0.06)
    kit.torus(kerchief.bm, (0, -0.004, 0.475), (0, 0.2, 1), 0.05, 0.016, 12, 5)
    kit.cone(kerchief.bm, (0, -0.055, 0.47), (0.006, -0.07, 0.42), 0.022, 0.004, 5, squash=0.4)
    parts.append(kerchief)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, -0.004, 0.27), (0, -0.004, 0.3), 0.084, 0.084, 12, squash=0.86)
    buckle = kit.box(belt.bm, (0, -0.077, 0.285), (0.026, 0.008, 0.024))
    belt.paint(faces_of(buckle), BRASS)
    # A brass canteen at the left hip.
    can = Vector((0.075, -0.04, 0.23))
    body = kit.cone(belt.bm, can + Vector((0, 0, -0.035)), can + Vector((0, 0, 0.03)), 0.022, 0.022, 10)
    belt.paint(faces_of(body), BRASS)
    for z in (-0.02, 0.016):
        ring = kit.torus(belt.bm, can + Vector((0, 0, z)), (0, 0, 1), 0.023, 0.003, 10, 3)
        belt.paint(faces_of(ring), BRASS_DARK)
    cap = kit.cone(belt.bm, can + Vector((0, 0, 0.03)), can + Vector((0, 0, 0.044)), 0.01, 0.008, 6)
    belt.paint(faces_of(cap), BRASS_DARK)
    strap = kit.tube(belt.bm, [can + Vector((0, 0, 0.044)), Vector((0.072, -0.03, 0.285))], [0.004, 0.004], 4)
    belt.paint(faces_of(strap), LEATHER_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.21), (0, 0, 0.28), 0.078, 0.078, 12, squash=0.86)
    parts.append(hips)
    return parts


def round_bomb(part, center, radius, fuse_dir, fuse_length):
    kit.sphere(part.bm, center, (radius, radius, radius), 10, 7)
    shine = kit.sphere(part.bm, center + Vector((-0.3, -0.5, 0.6)).normalized() * radius * 0.82, (radius * 0.3, radius * 0.3, radius * 0.3), 5, 4)
    part.paint(faces_of(shine), BOMB_LIGHT)
    fuse_dir = Vector(fuse_dir).normalized()
    cap = kit.cone(part.bm, center + fuse_dir * radius * 0.85, center + fuse_dir * (radius + 0.008), radius * 0.4, radius * 0.36, 8)
    part.paint(faces_of(cap), BRASS)
    fuse = kit.tube(part.bm, [center + fuse_dir * (radius + 0.006), center + fuse_dir * (radius + fuse_length * 0.6) + Vector((0.004, 0, 0)), center + fuse_dir * (radius + fuse_length)], [0.003, 0.003, 0.0025], 4)
    part.paint(faces_of(fuse), FUSE)


def basket_parts():
    basket = Part("basket", WICKER, "hips", shade=0.06)
    c = BASKET_C
    kit.cone(basket.bm, c + Vector((0, 0, -0.045)), c + Vector((0, 0, 0.04)), 0.04, 0.05, 12, caps=False)
    kit.cone(basket.bm, c + Vector((0, 0, -0.047)), c + Vector((0, 0, -0.043)), 0.04, 0.04, 12)
    for z in (-0.03, 0.0, 0.03):
        band = kit.torus(basket.bm, c + Vector((0, 0, z)), (0, 0, 1), 0.043 + z * 0.12, 0.004, 12, 3)
        basket.paint(faces_of(band), WICKER_DARK)
    rim = kit.torus(basket.bm, c + Vector((0, 0, 0.04)), (0, 0, 1), 0.05, 0.006, 12, 4)
    basket.paint(faces_of(rim), WICKER_DARK)
    # Two short straps hang it from the belt.
    for y in (-0.02, 0.02):
        strap = kit.tube(basket.bm, [c + Vector((0.035, y, 0.035)), Vector((-0.074, c.y + y, 0.285))], [0.004, 0.004], 4)
        basket.paint(faces_of(strap), LEATHER_DARK)
    # Three bombs stick out of the basket.
    for offset, fuse in (((-0.012, 0.0, 0.04), (-0.4, 0.2, 1)), ((0.02, 0.012, 0.035), (0.3, 0.3, 1)), ((0.0, -0.022, 0.03), (0.0, -0.6, 1))):
        bomb = Part("bomb.basket", BOMB, "hips", shade=0.03)
        round_bomb(bomb, c + Vector(offset), 0.022, fuse, 0.02)
        yield bomb
    yield basket


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"upperarm.{side}", SKIN, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.028, 0.022, 8)
        # A short tunic sleeve.
        sleeve = kit.cone(upper.bm, s - (e - s) * 0.1, s + (e - s) * 0.45, 0.034, 0.03, 8)
        upper.paint(faces_of(sleeve), TUNIC)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.02, 0.016, 8)
        bracer = kit.cone(forearm.bm, e + (w - e) * 0.45, w - d * 0.004, 0.022, 0.02, 8)
        forearm.paint(faces_of(bracer), LEATHER)
        for along in (0.55, 0.85):
            strap = kit.torus(forearm.bm, e + (w - e) * along, d, 0.022, 0.003, 8, 3)
            forearm.paint(faces_of(strap), BRASS)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.016, (0.018, 0.016, 0.021), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.045, 0.036, 8)
        parts.append(thigh)

        # The trousers end in a torn hem at the calf, over leather wraps.
        shin = Part(f"shin.{side}", WRAP, f"shin.{side}")
        hem = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.055)), 0.037, 0.04, 8)
        for face in faces_of(hem):
            shin.paint([face], TROUSERS_DARK if face.calc_center_median().y < 0 else TROUSERS)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.05)), ankle, 0.026, 0.02, 8)
        for z in (0.03, 0.06):
            wrap = kit.torus(shin.bm, ankle + Vector((0, 0, z)), (0, 0, 1), 0.024, 0.004, 8, 3)
            shin.paint(faces_of(wrap), LEATHER_DARK)
        parts.append(shin)

        # Big bare goblin feet.
        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.017), (0.028, 0.056, 0.018), 8, 6)
        for toe in (-1, 0, 1):
            kit.sphere(foot.bm, (LEG_X * sign + toe * 0.013, -0.082, 0.011), (0.009, 0.011, 0.009), 5, 4)
        parts.append(foot)
    return parts


def racket_parts():
    racket = Part("racket", WOOD, "hand.R", shade=0.03)
    d = RACKET
    across = d.cross(HOOP_N).normalized()
    # The handle with a leather wrap, and two struts to the hoop.
    kit.cone(racket.bm, GRIP_R - d * 0.035, GRIP_R + d * 0.14, 0.009, 0.008, 6)
    wrap = kit.cone(racket.bm, GRIP_R - d * 0.03, GRIP_R + d * 0.03, 0.011, 0.011, 6)
    racket.paint(faces_of(wrap), LEATHER_DARK)
    knob = kit.sphere(racket.bm, GRIP_R - d * 0.038, (0.012, 0.012, 0.012), 6, 4)
    racket.paint(faces_of(knob), WOOD_DARK)
    hoop = GRIP_R + d * HOOP_AT
    base = hoop - d * HOOP_R
    for sign in (1, -1):
        kit.cone(racket.bm, GRIP_R + d * 0.13, base + across * 0.03 * sign + d * 0.012, 0.006, 0.005, 5)
    # The hoop of a barrel, with iron rivets, and the wire net.
    ring = kit.torus(racket.bm, hoop, HOOP_N, HOOP_R, 0.008, 20, 5)
    racket.paint(faces_of(ring), WOOD_DARK)
    for index in range(6):
        a = 2 * math.pi * index / 6
        rivet = kit.sphere(racket.bm, hoop + (across * math.cos(a) + d * math.sin(a)) * HOOP_R + HOOP_N * 0.007, (0.004, 0.004, 0.004), 4, 3)
        racket.paint(faces_of(rivet), WIRE)
    for step in range(-3, 4):
        u = step / 4
        half = HOOP_R * math.sqrt(max(1 - u * u, 0.0)) * 0.98
        wire = kit.tube(racket.bm, [hoop + across * u * HOOP_R - d * half, hoop + across * u * HOOP_R + d * half], [0.0018, 0.0018], 3)
        racket.paint(faces_of(wire), WIRE)
        wire = kit.tube(racket.bm, [hoop + d * u * HOOP_R - across * half, hoop + d * u * HOOP_R + across * half], [0.0018, 0.0018], 3)
        racket.paint(faces_of(wire), WIRE)
    return [racket]


def bomb_parts():
    bomb = Part("bomb", BOMB, "bomb", shade=0.03)
    round_bomb(bomb, BOMB_C, BOMB_R, SPARK_C - BOMB_C, 0.02)
    spark = Part("spark", SPARK, "spark", shade=0)
    kit.sphere(spark.bm, SPARK_C, (0.01, 0.01, 0.012), 6, 4)
    for index in range(5):
        a = 2 * math.pi * index / 5
        ray = kit.cone(spark.bm, SPARK_C, SPARK_C + Vector((math.cos(a) * 0.022, math.sin(a) * 0.022, 0.012 + 0.006 * (index % 2))), 0.004, 0.001, 3)
        spark.paint(faces_of(ray), SPARK_HOT if index % 2 else SPARK)
    return [bomb, spark]


def build_figure():
    kit.reset_scene()
    rig, _ = plan.build_rig("BombLobber", TABLE, (), PROP_BONES, ARMS)
    parts = head_parts() + body_parts() + list(basket_parts()) + limb_parts() + racket_parts() + bomb_parts()
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "BombLobberMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


PATCHES = (
    # The idle: the fuse of the bomb sparks.
    Patch(
        "idle",
        "fuse-spark",
        beats=tuple(
            Beat(frame, "stance", args)
            for frame, *args in (
                (0, 0, 0, 1),
                (6, 0.25, 0.5, 0.6),
                (12, 0.5, 1, 1.3),
                (18, 0.75, 0.5, 0.7),
                (24, 1, 0, 1.2),
                (30, 0.75, -0.5, 0.6),
                (36, 0.5, -1, 1.3),
                (42, 0.25, -0.5, 0.7),
                (48, 0, 0, 1),
            )
        ),
    ),
    Patch(
        "lowHp",
        "low-fuse",
        beats=tuple(Beat(frame, "slump", args) for frame, *args in ((0, 0, 0.6), (12, 0.5, 0.3), (24, 1, 0.6), (36, 0.5, 0.3), (48, 0, 0.6))),
    ),
    # She tosses the bomb up and hits it forward with the racket. The bomb
    # leaves at 20% of the clip, when the projectile leaves.
    Patch(
        "attack",
        "racket-lob",
        beats=(
            Beat(0),
            Beat(4, "toss"),
            Beat(5, "hit"),
            Beat(6, "smash"),
            Beat(9, "smash"),
            Beat(13, "follow"),
            Beat(20, "follow"),
            Beat(25, "reload"),
            Beat(28, "stance", (0, 0, 0.6)),
            Beat(30),
        ),
    ),
)


class Poses(clips.biped_small.Poses):
    fall = Fall(X, -86, (0, 0, 0.1))

    def stance(self, breath=0.0, sway=0.0, spark=1.0):
        """
        The idle stance: feet apart, turned a little to her right, the racket
        on her shoulder. `spark` is the size of the spark on the fuse.
        """
        t, at = self.t, self.at
        return {
            "hips@loc": at("hips", (0, 0, -0.008 - breath * 0.003)),
            "hips": t("hips", (Z, -12), (Y, sway * 2)),
            "spine": t("spine", (X, 2 + breath)),
            "chest": t("chest", (X, -4 - breath * 2), (Z, -4)),
            "neck": t("neck", (Z, 8)),
            "head": t("head", (Z, 8 + sway * 4), (X, -2 + breath * 2), (Y, -6 + sway * 4)),
            "upperarm.R": t("upperarm.R", (X, -breath * 2)),
            "hand.R": t("hand.R", (X, sway * 3)),
            "upperarm.L": t("upperarm.L", (X, -breath * 3)),
            "thigh.L": t("thigh.L", (X, -10), (Y, -8)),
            "shin.L": t("shin.L", (X, 14)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 8), (Y, 8)),
            "shin.R": t("shin.R", (X, 10)),
            "foot.R": t("foot.R", (X, -18)),
            "spark@scale": spark,
        }

    def slump(self, base, breath=0.0, spark=0.6):
        """Low HP: she sits down hard, the racket across her lap."""
        t, at = self.t, self.at
        return self.pose(
            self.stance(spark=spark),
            hips_at_loc=at("hips", (0, 0.04, -0.15 - breath * 0.004)),
            hips=t("hips", (Z, -12), (X, -20)),
            spine=t("spine", (X, 26 + breath * 3)),
            chest=t("chest", (X, 12 + breath * 2)),
            head=t("head", (Z, 4), (X, 14 + breath * 4), (Y, -10)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, -10)),
            forearm__R=t("forearm.R", (X, 30)),
            hand__R=t("hand.R", (X, 50)),
            upperarm__L=t("upperarm.L", (X, -10), (Y, 6)),
            thigh__L=t("thigh.L", (X, -80), (Y, -14)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -76), (Y, 14)),
            shin__R=t("shin.R", (X, 50)),
            foot__R=t("foot.R", (X, 0)),
        )

    def recoil(self, base, amount=1.0):
        """The hit pushes the upper body back."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.008 - 0.006 * amount)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -12 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            upperarm__R=t("upperarm.R", (X, 10 * amount), (Y, -12 * amount)),
            upperarm__L=t("upperarm.L", (X, 20 * amount), (Y, 20 * amount)),
        )

    def stagger(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.03)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
            upperarm__R=t("upperarm.R", (X, 16), (Y, -20)),
            upperarm__L=t("upperarm.L", (X, 16), (Y, 30)),
        )

    def fallen(self, base, bounce=0.0):
        """Flat on the back, the racket out to the side. The fuse goes out."""
        t, at = self.t, self.at
        return self.pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.09)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20), (Z, 30)),
            upperarm__R=t("upperarm.R", (Y, -60), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, 60), (X, -10)),
            thigh__L=t("thigh.L", (X, -20), (Y, -10)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -30), (Y, 10)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            spark_at_scale=0.0,
        )

    def crouch(self, base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.09)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 16)),
            thigh__L=t("thigh.L", (X, -60), (Y, -8)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
            spark_at_scale=0.3,
        )

    def heroic(self, base):
        """Up again, the racket raised high: the end of a summon and a Rebirth."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -110), (Y, -20)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 20)),
            spark_at_scale=1.4,
        )

    def step(self, base, front, lift=0.0):
        """A waddle: the body rocks from side to side. `front` is 1 for the left foot, -1 for the right."""
        t, at = self.t, self.at
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return self.pose(
            self.stance(),
            hips_at_loc=at("hips", (0.012 * front, 0, -0.01 + lift * 0.012)),
            hips=t("hips", (Z, -10), (Y, 7 * front)),
            spine=t("spine", (X, 6), (Y, -4 * front)),
            chest=t("chest", (Z, -5 * front)),
            head=t("head", (Z, 8), (Y, -6 * front)),
            upperarm__L=t("upperarm.L", (X, -10 * front), (Y, 8)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -30 - lift * 8)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 16 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 8)),
            },
        )

    def toss(self, base):
        t = self.t
        return self.pose(
            base,
            hips=t("hips", (Z, -26)),
            spine=t("spine", (X, -6), (Z, -8)),
            chest=t("chest", (X, -10), (Z, -12)),
            neck=t("neck", (Z, 10), (X, -6)),
            head=t("head", (Z, 14), (X, -16)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -40)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -130), (Y, 10)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__L=t("thigh.L", (X, -22), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            thigh__R=t("thigh.R", (X, 14), (Y, 10)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -30)),
        )

    def smash(self, base, bomb=0.01):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.03, -0.02)),
            hips=t("hips", (Z, 18)),
            spine=t("spine", (X, 14), (Z, 8)),
            chest=t("chest", (X, 10), (Z, 12)),
            neck=t("neck", (Z, -8), (X, -10)),
            head=t("head", (Z, -10), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -120), (Y, -20)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 160)),
            upperarm__L=t("upperarm.L", (X, -60), (Y, 30)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -40), (Y, -8)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -30)),
            bomb_at_scale=bomb,
        )

    def follow(self, base):
        """The racket follows through low across her body, and the left hand covers her left ear."""
        t = self.t
        return self.pose(
            self.smash(base),
            hips=t("hips", (Z, 24)),
            chest=t("chest", (X, 14), (Z, 14)),
            head=t("head", (Z, -6), (X, -6), (Y, 14)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, 20)),
            forearm__R=t("forearm.R", (X, -30)),
            hand__R=t("hand.R", (X, 200)),
            upperarm__L=t("upperarm.L", (Y, -110)),
            forearm__L=t("forearm.L", (Z, 110)),
            hand__L=t("hand.L", (X, 0)),
        )

    def hit(self, base):
        """The racket meets the bomb: the bomb is still there."""
        return self.pose(self.smash(base, 1.0), **{"bomb@scale": 1.0})

    def reload(self, base):
        """She has no bomb yet: she takes a new one from the basket."""
        return self.pose(base, bomb_at_scale=0.01, spark_at_scale=0.0)

    def rising(self, base):
        return self.pose(self.crouch(base), hips_at_loc=self.at("hips", (0, 0.01, -0.07)))


def build_clips(rig):
    return clips.overrides.build(clips.biped_small.CLIPS, Poses(*kit.pose_tools(rig)), PATCHES, without=("cast",))


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "bomb-lobber.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
