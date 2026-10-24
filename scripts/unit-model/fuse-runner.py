"""
Fuse Runner (`goblin.fuseRunner`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a skinny pale goblin man with
wild white hair, very large ears, big worried amber eyes, a long pointed
nose, crooked teeth and soot on his face, brass goggles on his forehead, a
long striped scarf, a cream shirt, a leather belt with a brass vial, torn
brown trousers, leather wraps at the ankles and bare feet. He hugs a round
black bomb with brass bands that is bigger than his head. Run it in Blender
(see `unit_model_kit.py`). It writes `apps/web/art/units/raw/fuse-runner.glb`;
then `bun unit-model:pack fuse-runner` packs it for the game.

The `bomb` bone is a child of the chest, and his arms hug it. The fuse sparks
(the `spark` bone scales), and he looks at the fuse, not where he goes. The
`scarf` bone streams the end of the scarf back. He has Swift, so his walk is
a fast run on his toes. His attack bonks the target with the bomb. His death
is his Last Breath: the bomb blows up (it scales down, and the `blast` bone,
which has no parent, scales up where the bomb was), and the blast throws him
onto his back. In his Rebirth the fuse goes out with no blast, he faints, and
then he gets up and the fuse lights again. He has no Keyword that he uses by
his own action, so he has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#c0bcb6")
SKIN_DARK = hex_color("#8a867e")
SOOT = hex_color("#6a6662")
EAR = hex_color("#e4a08a")
NOSE = hex_color("#d88e7e")
HAIR = hex_color("#eee6d6")
HAIR_DARK = hex_color("#cfc4a8")
EYES = hex_color("#f2a838")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a1e1a")
TEETH = hex_color("#ece2c4")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
LENS = hex_color("#3a2e24")
SCARF = hex_color("#3c4a68")
SCARF_LIGHT = hex_color("#d8c49a")
SHIRT = hex_color("#ddd0b2")
SHIRT_DARK = hex_color("#b4a684")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
TROUSERS = hex_color("#6e5640")
TROUSERS_DARK = hex_color("#4c3a2a")
WRAP = hex_color("#8a6038")
BOMB = hex_color("#2e2a28")
BOMB_LIGHT = hex_color("#4e4844")
RUST = hex_color("#7a5236")
FUSE = hex_color("#c8b88a")
SPARK = hex_color("#ffd040")
SPARK_HOT = hex_color("#b8f048")
FIRE = hex_color("#ffb030")
FIRE_HOT = hex_color("#fff0a0")
FIRE_DARK = hex_color("#e05a1a")
SMOKE = hex_color("#7a726c")

# --- Proportions ---------------------------------------------------------------

# He is skinny: narrow hips, and long, thin arms and legs.
HIP_Z = 0.3
WAIST_Z = 0.36
CHEST_Z = 0.42
SHOULDER_Z = 0.48
NECK_Z = 0.5
HEAD_C = Vector((0, -0.03, 0.6))
KNEE_Z = 0.17
ANKLE_Z = 0.04
LEG_X = 0.042

# The bomb is in front of his chest, and his arms hug it from the sides.
BOMB_C = Vector((0, -0.15, 0.38))
BOMB_R = 0.085
FUSE_DIR = Vector((0.1, 0.25, 1)).normalized()
SPARK_C = BOMB_C + FUSE_DIR * (BOMB_R + 0.04)

SR = Vector((-0.08, 0, SHOULDER_Z))
ER = Vector((-0.13, -0.06, 0.41))
WR = Vector((-0.084, -0.152, 0.35))
TR = WR + (WR - ER).normalized() * 0.035
SL = Vector((0.08, 0, SHOULDER_Z))
EL = Vector((0.13, -0.06, 0.41))
WL = Vector((0.084, -0.152, 0.35))
TL = WL + (WL - EL).normalized() * 0.035

SCARF_ROOT = Vector((0, 0.04, 0.5))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.006, 0.51), "chest"),
    ("head", (0, -0.006, 0.51), (0, -0.012, 0.69), "neck"),
    ("scarf", tuple(SCARF_ROOT), tuple(SCARF_ROOT + Y * 0.08), "chest"),
    ("bomb", tuple(BOMB_C), tuple(BOMB_C + Z * 0.06), "chest"),
    ("spark", tuple(SPARK_C), tuple(SPARK_C + Z * 0.03), "bomb"),
    # The blast stays where the bomb was: it has no parent.
    ("blast", tuple(BOMB_C), tuple(BOMB_C + Z * 0.08), None),
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

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.3, 0.37)
    return blend("spine", "chest", co.z, 0.38, 0.44)


def scarf_weights(co):
    """The wrap round the neck stays on the chest, and the end streams back."""
    t = kit.clamp01((co.y - 0.03) / 0.06)
    return {"chest": 1 - t, "scarf": t}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.072, 0.07, 0.072), 14, 10)
    # A narrow chin and a long, pointed nose, with soot on the cheeks.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.05)), (0.04, 0.034, 0.03), 10, 6)
    nose = kit.tube(head.bm, [HEAD_C + Vector((0, -0.064, 0.0)), HEAD_C + Vector((0, -0.1, -0.01)), HEAD_C + Vector((0, -0.126, -0.028))], [0.016, 0.011, 0.005], 6)
    head.paint(faces_of(nose), NOSE)
    for sign, at in ((1, (0.04, -0.05, -0.022)), (-1, (-0.044, -0.046, -0.016))):
        soot = kit.sphere(head.bm, HEAD_C + Vector(at), (0.018, 0.012, 0.014), 6, 4)
        head.paint(faces_of(soot), SOOT)
    for sign in (1, -1):
        # Very large goblin ears that stream back. Each ear is a flat leaf
        # with its face to the side, so the camera sees it.
        base = HEAD_C + Vector((0.058 * sign, 0.02, 0.008))
        tip = HEAD_C + Vector((0.15 * sign, 0.17, 0.045))
        ear = kit.cone(head.bm, base, tip, 0.048, 0.003, 8)
        thin = Z.cross((tip - base).normalized()).normalized()
        for vert in ear:
            vert.co -= thin * (vert.co - base).dot(thin) * 0.7
        for face in faces_of(ear):
            face.normal_update()
            if face.normal.x * sign > 0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A nervous open mouth with crooked top teeth.
    mouth_c = HEAD_C + Vector((0, -0.056, -0.038))
    kit.sphere(face.bm, mouth_c, (0.03, 0.014, 0.014), 10, 6)
    for index, x in enumerate((-0.016, -0.004, 0.009, 0.019)):
        tooth = kit.box(face.bm, mouth_c + Vector((x, -0.011, 0.006 - 0.002 * (index % 2))), (0.009, 0.006, 0.01 + 0.003 * (index % 2)))
        face.paint(faces_of(tooth), TEETH)
    # Big worried eyes that look down at the fuse.
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.058, 0.016))
        eye = kit.sphere(face.bm, center, (0.022, 0.014, 0.023), 10, 6)
        face.paint(faces_of(eye), EYES)
        pupil = kit.sphere(face.bm, center + Vector((-0.004 * sign, -0.012, -0.007)), (0.008, 0.004, 0.009), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
        brow = kit.tube(face.bm, [center + Vector((0.016 * sign, -0.006, 0.022)), center + Vector((-0.012 * sign, -0.012, 0.03))], [0.004, 0.004], 3)
        face.paint(faces_of(brow), SKIN_DARK)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.08)
    # Wild white hair that sticks out in all directions.
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.02, 0.04)), (0.078, 0.078, 0.05), 12, 7)
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.05, -0.01)), (0.07, 0.05, 0.06), 10, 6)
    for index in range(10):
        a = math.radians(-135 + index * 30)
        root = HEAD_C + Vector((0.05 * math.sin(a), 0.03 + 0.04 * math.cos(a), 0.052))
        reach = 0.05 + 0.02 * ((index * 5) % 3)
        tip = root + Vector((reach * 0.9 * math.sin(a), 0.04 + reach * 0.6 * math.cos(a), 0.022 - 0.022 * (index % 3)))
        tuft = kit.cone(hair.bm, root, tip, 0.028, 0.005, 5)
        if index % 2:
            hair.paint(faces_of(tuft), HAIR_DARK)
    parts.append(hair)

    # Brass goggles with smoked lenses up on the forehead.
    goggles = Part("goggles", BRASS, "head", shade=0.05)
    band = kit.torus(goggles.bm, HEAD_C + Vector((0, 0.004, 0.036)), (0, 0.25, 1), 0.077, 0.007, 16, 4)
    goggles.paint(faces_of(band), LEATHER_DARK)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.029 * sign, -0.068, 0.054))
        out = Vector((0.15 * sign, -1, 0.35)).normalized()
        kit.cone(goggles.bm, center - out * 0.006, center + out * 0.02, 0.022, 0.02, 12)
        rim = kit.torus(goggles.bm, center + out * 0.02, out, 0.019, 0.005, 12, 3)
        goggles.paint(faces_of(rim), BRASS_DARK)
        lens = kit.cone(goggles.bm, center + out * 0.018, center + out * 0.022, 0.016, 0.016, 12)
        goggles.paint(faces_of(lens), LENS)
    parts.append(goggles)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.48), (0, -0.004, 0.56), 0.02, 0.018, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    shirt = Part("shirt", SHIRT, torso_weights)
    kit.cone(shirt.bm, (0, 0, 0.26), (0, 0, 0.49), 0.064, 0.058, 12, squash=0.78)
    for index in range(10):
        a = math.radians(index * 36 + 10)
        top = Vector((0.064 * math.sin(a), -0.05 * math.cos(a), 0.28))
        rag = kit.cone(shirt.bm, top, top + Vector((0.008 * math.sin(a), -0.008 * math.cos(a), -0.03 - 0.01 * (index % 3))), 0.017, 0.004, 4, squash=0.5)
        shirt.paint(faces_of(rag), SHIRT_DARK if index % 2 else SHIRT)
    parts.append(shirt)

    # The striped scarf: a wrap round the neck, and a long end that streams back.
    scarf = Part("scarf", SCARF, scarf_weights, shade=0.05)
    wrap = kit.torus(scarf.bm, (0, -0.004, 0.49), (0, 0.15, 1), 0.04, 0.016, 12, 5)
    for face in faces_of(wrap):
        if int((math.atan2(face.calc_center_median().y, face.calc_center_median().x) + math.pi) / (math.pi / 4)) % 2:
            scarf.paint([face], SCARF_LIGHT)
    tail = [SCARF_ROOT + Vector((0.01 * math.sin(i), 0.03 * i, -0.012 * i - 0.004 * i * i)) for i in range(6)]
    for index, (a, b) in enumerate(zip(tail, tail[1:])):
        along = (b - a) * 0.56
        width = Vector((0.024 - 0.002 * index, 0, 0))
        thick = width.cross(along).normalized() * 0.005
        band = kit.slab(scarf.bm, (a + b) / 2, width, along, thick)
        scarf.paint(faces_of(band), SCARF_LIGHT if index % 2 else SCARF)
    fringe = tail[-1]
    for x in (-0.012, 0.0, 0.012):
        tassel = kit.cone(scarf.bm, fringe + Vector((x, 0.008, 0)), fringe + Vector((x, 0.03, -0.012)), 0.004, 0.002, 4)
        scarf.paint(faces_of(tassel), SCARF_LIGHT)
    parts.append(scarf)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, -0.004, 0.285), (0, -0.004, 0.31), 0.068, 0.068, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.058, 0.297), (0.02, 0.008, 0.02))
    belt.paint(faces_of(buckle), BRASS)
    # A brass vial at the right hip, on the camera side.
    vial = Vector((-0.07, -0.02, 0.255))
    body = kit.cone(belt.bm, vial - Z * 0.03, vial + Z * 0.025, 0.013, 0.013, 8)
    belt.paint(faces_of(body), BRASS)
    cap = kit.cone(belt.bm, vial + Z * 0.025, vial + Z * 0.036, 0.008, 0.007, 6)
    belt.paint(faces_of(cap), BRASS_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.22), (0, 0, 0.29), 0.062, 0.062, 12, squash=0.8)
    parts.append(hips)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"upperarm.{side}", SKIN, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.019, 0.016, 8)
        sleeve = kit.cone(upper.bm, s - (e - s) * 0.1, s + (e - s) * 0.6, 0.027, 0.023, 8)
        upper.paint(faces_of(sleeve), SHIRT)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.015, 0.012, 8)
        wrap = kit.torus(forearm.bm, w - d * 0.012, d, 0.014, 0.004, 8, 3)
        forearm.paint(faces_of(wrap), LEATHER)
        parts.append(forearm)

        # Long goblin fingers spread over the bomb.
        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.012, (0.012, 0.018, 0.02), 8, 6)
        for finger in (-1, 0, 1):
            tip = w + d * 0.02 + Vector((-0.012 * sign, -0.008 + finger * 0.012, 0.012 + finger * 0.004))
            kit.cone(hand.bm, w + d * 0.012 + Vector((0, finger * 0.008, 0.004)), tip, 0.005, 0.0035, 4)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.034, 0.028, 8)
        patch = kit.sphere(thigh.bm, knee + Vector((-0.004 * sign, -0.024, 0.04)), (0.014, 0.008, 0.014), 6, 4)
        thigh.paint(faces_of(patch), TROUSERS_DARK)
        parts.append(thigh)

        # Thin shins: the trousers end in a torn hem below the knee.
        shin = Part(f"shin.{side}", SKIN, f"shin.{side}")
        hem = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.04)), 0.03, 0.032, 8)
        for face in faces_of(hem):
            shin.paint([face], TROUSERS_DARK if face.calc_center_median().y < 0 else TROUSERS)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.035)), ankle, 0.016, 0.014, 8)
        for z in (0.012, 0.03):
            wrap = kit.torus(shin.bm, ankle + Vector((0, 0, z)), (0, 0, 1), 0.017, 0.0042, 8, 3)
            shin.paint(faces_of(wrap), WRAP)
        parts.append(shin)

        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.016), (0.024, 0.054, 0.016), 8, 6)
        for toe in (-1, 0, 1):
            kit.sphere(foot.bm, (LEG_X * sign + toe * 0.012, -0.078, 0.01), (0.008, 0.01, 0.008), 5, 4)
        parts.append(foot)
    return parts


def bomb_parts():
    bomb = Part("bomb", BOMB, "bomb", shade=0.06)
    kit.sphere(bomb.bm, BOMB_C, (BOMB_R, BOMB_R, BOMB_R), 16, 10)
    shine = kit.sphere(bomb.bm, BOMB_C + Vector((-0.5, -0.6, 0.5)).normalized() * BOMB_R * 0.86, (0.026, 0.022, 0.026), 6, 4)
    bomb.paint(faces_of(shine), BOMB_LIGHT)
    # Riveted brass bands, and patches of rust.
    for normal in ((0, 0, 1), (1, 0, 0.15)):
        band = kit.torus(bomb.bm, BOMB_C, normal, BOMB_R + 0.002, 0.005, 20, 4)
        bomb.paint(faces_of(band), BRASS_DARK)
    for at in ((-0.6, -0.7, -0.3), (0.4, -0.8, 0.4), (-0.8, 0.2, 0.5)):
        rust = kit.sphere(bomb.bm, BOMB_C + Vector(at).normalized() * BOMB_R * 0.95, (0.018, 0.018, 0.018), 6, 4)
        bomb.paint(faces_of(rust), RUST)
    collar = kit.cone(bomb.bm, BOMB_C + FUSE_DIR * BOMB_R * 0.86, BOMB_C + FUSE_DIR * (BOMB_R + 0.014), 0.022, 0.018, 10)
    bomb.paint(faces_of(collar), BRASS)
    rim = kit.torus(bomb.bm, BOMB_C + FUSE_DIR * (BOMB_R + 0.014), FUSE_DIR, 0.018, 0.004, 10, 3)
    bomb.paint(faces_of(rim), BRASS_DARK)
    # A short, twisted fuse.
    start = BOMB_C + FUSE_DIR * (BOMB_R + 0.012)
    fuse = kit.tube(bomb.bm, [start, start + FUSE_DIR * 0.012 + X * 0.006, start + FUSE_DIR * 0.024 - X * 0.003, SPARK_C - FUSE_DIR * 0.004], [0.0045, 0.0045, 0.004, 0.0035], 5)
    bomb.paint(faces_of(fuse), FUSE)

    spark = Part("spark", SPARK, "spark", shade=0)
    kit.sphere(spark.bm, SPARK_C, (0.011, 0.011, 0.013), 6, 4)
    for index in range(7):
        a = 2 * math.pi * index / 7
        ray = kit.cone(spark.bm, SPARK_C, SPARK_C + Vector((math.cos(a) * 0.026, math.sin(a) * 0.026, 0.008 + 0.01 * (index % 3))), 0.004, 0.001, 3)
        spark.paint(faces_of(ray), SPARK_HOT if index % 2 else SPARK)
    return [bomb, spark]


def blast_parts():
    """The blast of the Last Breath: a ball of fire with rays and puffs of smoke."""
    blast = Part("blast", FIRE, "blast", shade=0)
    kit.sphere(blast.bm, BOMB_C, (0.075, 0.075, 0.075), 10, 7)
    core = kit.sphere(blast.bm, BOMB_C + Vector((0, -0.024, 0.006)), (0.056, 0.056, 0.056), 8, 6)
    blast.paint(faces_of(core), FIRE_HOT)
    for index in range(10):
        a = 2 * math.pi * index / 10
        b = math.radians(-30 + 60 * ((index * 3) % 4) / 3)
        out = Vector((math.cos(a) * math.cos(b), math.sin(a) * math.cos(b), math.sin(b)))
        ray = kit.cone(blast.bm, BOMB_C + out * 0.05, BOMB_C + out * 0.125, 0.028, 0.003, 5)
        blast.paint(faces_of(ray), FIRE_DARK if index % 2 else FIRE)
    for index in range(5):
        a = 2 * math.pi * index / 5 + 0.4
        puff = kit.sphere(blast.bm, BOMB_C + Vector((math.cos(a) * 0.07, math.sin(a) * 0.07, 0.05 + 0.01 * (index % 2))), (0.036, 0.036, 0.03), 7, 5)
        blast.paint(faces_of(puff), SMOKE)
    return [blast]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("FuseRunner", BONES)
    parts = head_parts() + body_parts() + limb_parts() + bomb_parts() + blast_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "FuseRunnerMesh")
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

    def stand(breath=0.0, look=1.0, spark=1.0, tap=0.0):
        """
        The idle stance: on his toes, hugging the bomb. `look` is 1 when he
        looks down at the fuse and 0 when he looks ahead, `spark` is the size
        of the spark, and `tap` lifts the right heel.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -6)),
            "spine": t("spine", (X, 6 + breath)),
            "chest": t("chest", (X, 2 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, 6 + look * 8)),
            "head": t("head", (X, -4 + look * 18), (Z, 4 - look * 6), (Y, -6 * look)),
            "scarf": t("scarf", (X, -6 + breath * 8), (Z, breath * 6)),
            "thigh.L": t("thigh.L", (X, -12), (Y, -6)),
            "shin.L": t("shin.L", (X, 18)),
            "foot.L": t("foot.L", (X, -14)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 6)),
            "shin.R": t("shin.R", (X, 14 + tap * 10)),
            "foot.R": t("foot.R", (X, -24 - tap * 16)),
            "spark@scale": spark,
            "blast@scale": 0.01,
        }

    def slump(breath=0.0, spark=1.4):
        """Low HP: the fuse is short. He sits down hard and stares at it, and the spark flares."""
        return pose(
            stand(look=1.0, spark=spark),
            hips_at_loc=at("hips", (0, 0.05, -0.16 - breath * 0.004)),
            hips=t("hips", (Z, -6), (X, -20)),
            spine=t("spine", (X, 28 + breath * 3)),
            chest=t("chest", (X, 14 + breath * 2)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20 + breath * 4), (Y, -8 + breath * 10)),
            scarf=t("scarf", (X, -34)),
            thigh__L=t("thigh.L", (X, -84), (Y, -16)),
            shin__L=t("shin.L", (X, 56)),
            foot__L=t("foot.L", (X, 6)),
            thigh__R=t("thigh.R", (X, -80), (Y, 16)),
            shin__R=t("shin.R", (X, 64)),
            foot__R=t("foot.R", (X, 0)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the spark jumps."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.016)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -12 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 8), (X, -20 * amount)),
            scarf=t("scarf", (X, 30 * amount)),
            spark_at_scale=1 + 0.8 * amount,
        )

    def flung(base, bounce=0.0, rise=0.0):
        """
        Flat on the back with the arms and legs out. `rise` lifts him in the
        air, as the blast throws him.
        """
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0.04, 0.07 + rise)),
            hips_at_loc=at("hips", (0, 0, 0)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20), (Z, -30)),
            scarf=t("scarf", (X, 120)),
            upperarm__R=t("upperarm.R", (Y, -70), (X, 20)),
            forearm__R=t("forearm.R", (X, -20)),
            upperarm__L=t("upperarm.L", (Y, 70), (X, 20)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__L=t("thigh.L", (X, -40), (Y, -16)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 16)),
            shin__R=t("shin.R", (X, 50)),
            foot__R=t("foot.R", (X, 0)),
        )

    def fainted(base, bounce=0.0):
        """Flat on the back, still with the bomb: the fuse is out."""
        return pose(
            flung(base, bounce),
            upperarm__R=t("upperarm.R", (X, 0)),
            forearm__R=t("forearm.R", (X, 0)),
            upperarm__L=t("upperarm.L", (X, 0)),
            forearm__L=t("forearm.L", (X, 0)),
            spark_at_scale=0.01,
        )

    def crouch(base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.1)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 20)),
            thigh__L=t("thigh.L", (X, -64), (Y, -8)),
            shin__L=t("shin.L", (X, 104)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -54), (Y, 8)),
            shin__R=t("shin.R", (X, 104)),
            foot__R=t("foot.R", (X, -50)),
            spark_at_scale=0.3,
        )

    def proud(base):
        """Up again on his toes, the spark bright: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.01)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -12)),
            foot__L=t("foot.L", (X, -30)),
            foot__R=t("foot.R", (X, -30)),
            spark_at_scale=1.6,
        )

    def stride(front, lift=0.0):
        """
        A fast run on his toes, leaned forward, his eyes on the fuse. `front`
        is 1 for the left foot, -1 for the right; `lift` is 1 as the back
        foot passes.
        """
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(look=1.0, spark=1.0 + 0.3 * lift),
            hips_at_loc=at("hips", (0, -0.01, -0.03 + lift * 0.02)),
            hips=t("hips", (X, 14), (Z, -6 + 6 * front)),
            spine=t("spine", (X, 14)),
            chest=t("chest", (X, 4), (Z, -4 - 6 * front)),
            neck=t("neck", (X, 6)),
            head=t("head", (X, 6), (Z, -2), (Y, -6)),
            scarf=t("scarf", (X, -24 - 10 * lift), (Z, 8 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -66 + lift * 30)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 30 + lift * 50)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -20)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14 - lift * 40)),
                f"shin__{back}": t(f"shin.{back}", (X, 40 + lift * 60)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
            },
        )

    # The attack: he leans back with the bomb, then bonks the target with it.
    # The hit lands at 50% of the clip (frame 15). Then he sees what he hit
    # with, and jumps back.
    def wind(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.02)),
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -16)),
            neck=t("neck", (X, -4)),
            head=t("head", (X, -6)),
            scarf=t("scarf", (X, 10)),
            thigh__L=t("thigh.L", (X, -24), (Y, -6)),
            shin__L=t("shin.L", (X, 24)),
            thigh__R=t("thigh.R", (X, 16), (Y, 6)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -30)),
        )

    def bonk(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.08, -0.03)),
            hips=t("hips", (X, 6)),
            spine=t("spine", (X, 12)),
            chest=t("chest", (X, 6)),
            neck=t("neck", (X, -8)),
            head=t("head", (X, -10)),
            scarf=t("scarf", (X, -30)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 60)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 20), (Y, 6)),
            shin__R=t("shin.R", (X, 24)),
            foot__R=t("foot.R", (X, 10)),
            spark_at_scale=1.5,
        )

    def startled(base):
        """He sees what he hit with: he jumps back, the bomb held out."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, 0.02)),
            spine=t("spine", (X, -10)),
            chest=t("chest", (X, -10)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 16), (Y, 10)),
            scarf=t("scarf", (X, 30)),
            thigh__L=t("thigh.L", (X, -30), (Y, -6)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -30)),
            thigh__R=t("thigh.R", (X, 10), (Y, 6)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, -40)),
            spark_at_scale=1.3,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, look, spark, tap in ((0, 0, 1, 1, 0), (6, 0.5, 1, 0.6, 1), (12, 1, 1, 1.3, 0), (18, 0.5, 0.2, 0.7, 1), (24, 0, 0, 1.2, 0), (30, 0.5, 0.1, 0.6, 1), (36, 1, 1, 1.4, 0), (42, 0.5, 1, 0.7, 1), (48, 0, 1, 1, 0)):
        idle.key(frame, stand(breath, look, spark, tap))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath, spark in ((0, 0, 1.4), (6, 0.25, 0.9), (12, 0.5, 1.7), (18, 0.75, 1.0), (24, 1, 1.6), (30, 0.75, 0.9), (36, 0.5, 1.7), (42, 0.25, 1.0), (48, 0, 1.4)):
        low.key(frame, slump(breath, spark))
    clips.append(low)

    # Swift: two fast strides in each cycle.
    walk = Clip("walk", 24, loop=True)
    for start in (0, 12):
        walk.key(start, stride(1)).key(start + 3, stride(1, 1)).key(start + 6, stride(-1)).key(start + 9, stride(-1, 1))
    walk.key(24, stride(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(8, wind(stand())).key(13, bonk(stand())).key(16, bonk(stand()))
    attack.key(21, startled(stand())).key(25, startled(stand())).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    # The death is the Last Breath: the spark flares, the bomb blows up at
    # frame 10, and the blast throws him onto his back.
    death = Clip("death", 36)
    death.key(0, stand()).key(4, recoil(stand())).key(8, pose(stand(look=1.0), spark_at_scale=2.2))
    death.key(9, pose(stand(look=1.0), spark_at_scale=2.4, blast_at_scale=0.01))
    death.key(10, pose(stand(look=1.0), bomb_at_scale=0.01, spark_at_scale=0.01, blast_at_scale=1.0))
    death.key(14, pose(flung(stand(), 30, 0.12), bomb_at_scale=0.01, spark_at_scale=0.01, blast_at_scale=1.7))
    death.key(19, pose(flung(stand(), 10, 0.04), bomb_at_scale=0.01, spark_at_scale=0.01, blast_at_scale=1.2))
    death.key(23, pose(flung(stand()), bomb_at_scale=0.01, spark_at_scale=0.01, blast_at_scale=0.01))
    death.key(27, pose(flung(stand(), 6), bomb_at_scale=0.01, spark_at_scale=0.01, blast_at_scale=0.01))
    death.key(36, pose(flung(stand()), bomb_at_scale=0.01, spark_at_scale=0.01, blast_at_scale=0.01))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    # The fuse goes out with no blast, and lights again at the end.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(8, pose(stand(), spark_at_scale=0.01))
    rebirth.key(20, fainted(stand())).key(22, fainted(stand(), 3)).key(30, fainted(stand()))
    rebirth.key(36, crouch(stand())).key(42, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.02, -0.08))))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "fuse-runner.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
