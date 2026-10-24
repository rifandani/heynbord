"""
Junk Slinger (`goblin.junkSlinger`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an old pale goblin woman with a
big mass of frizzy white hair, very large ears, a long nose, big amber eyes
and a wide grin with one tooth gone, brass goggles on her forehead, a long
patched cream coat with a leather belt, baggy brown trousers, leather wraps
at the ankles and bare feet. A big leather bag of bent nails, bolts and small
gears hangs at her left hip, with a small trap spring on top (Hobble). She
holds a sling in her right hand: two cords and a leather pouch with a gear
in it. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/junk-slinger.glb`; then
`bun unit-model:pack junk-slinger` packs it for the game.

At rest the sling hangs from her right hand, on the camera side, and swings
a little. Her attack whirls the sling above her head: the `sling` bone
points at the `aim` control with a Damped Track, and the control goes round
in a circle. The gear leaves at 20% of the clip, when the projectile leaves:
the `stone` bone scales down. Then she takes a new piece of junk from her
bag. Her walk is a hobble. She has no Keyword that she uses by her own
action, so she has no cast clip.
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

SKIN = hex_color("#c4c0b8")
SKIN_DARK = hex_color("#8c8880")
EAR = hex_color("#e8a48e")
NOSE = hex_color("#de927e")
HAIR = hex_color("#f2ecdc")
HAIR_DARK = hex_color("#d2c8ae")
EYES = hex_color("#f2a838")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a1e1a")
TEETH = hex_color("#f0e8d0")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
LENS = hex_color("#3a2e24")
COAT = hex_color("#dccfae")
COAT_DARK = hex_color("#b2a27e")
PATCH = hex_color("#8a6a48")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
BAG = hex_color("#8a5a32")
BAG_DARK = hex_color("#5e3a1e")
TROUSERS = hex_color("#5e4434")
TROUSERS_DARK = hex_color("#432f24")
WRAP = hex_color("#8a6038")
CORD = hex_color("#b88a52")
IRON = hex_color("#6a625a")
IRON_LIGHT = hex_color("#9a928a")
SPRING = hex_color("#b8b4ac")

# --- Proportions ---------------------------------------------------------------

# She is old: a little bent, with a round back.
HIP_Z = 0.29
WAIST_Z = 0.35
CHEST_Z = 0.41
SHOULDER_Z = 0.47
NECK_Z = 0.49
HEAD_C = Vector((0, -0.035, 0.585))
KNEE_Z = 0.165
ANKLE_Z = 0.04
LEG_X = 0.048

# The right hand hangs at her side and holds the sling, which hangs down to
# the pouch.
SR = Vector((-0.084, 0, SHOULDER_Z))
ER = Vector((-0.118, 0.01, 0.37))
WR = Vector((-0.12, -0.03, 0.29))
TR = WR + (WR - ER).normalized() * 0.035
GRIP = TR
SLING_LENGTH = 0.2
POUCH_C = GRIP - Z * SLING_LENGTH
SL = Vector((0.084, 0, SHOULDER_Z))
EL = Vector((0.115, 0.01, 0.37))
WL = Vector((0.108, -0.035, 0.29))
TL = WL + (WL - EL).normalized() * 0.035

BAG_C = Vector((0.08, -0.05, 0.22))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.01, 0.505), "chest"),
    ("head", (0, -0.01, 0.505), (0, -0.02, 0.68), "neck"),
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
    # The sling points from the hand to the pouch.
    ("sling", tuple(GRIP), tuple(POUCH_C), "hand.R"),
    ("stone", tuple(POUCH_C), tuple(POUCH_C - Z * 0.03), "sling"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.29, 0.36)
    return blend("spine", "chest", co.z, 0.37, 0.43)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.072, 0.07, 0.07), 14, 10)
    # A round chin, a long nose and wrinkles under the eyes.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.028, -0.048)), (0.044, 0.036, 0.03), 10, 6)
    nose = kit.tube(head.bm, [HEAD_C + Vector((0, -0.064, 0.0)), HEAD_C + Vector((0, -0.098, -0.012)), HEAD_C + Vector((0, -0.116, -0.03))], [0.017, 0.012, 0.007], 6)
    head.paint(faces_of(nose), NOSE)
    for sign in (1, -1):
        # Very large goblin ears out to the sides and back. Each ear is a
        # flat leaf with its face to the side, so the camera sees it.
        base = HEAD_C + Vector((0.058 * sign, 0.018, 0.0))
        tip = HEAD_C + Vector((0.17 * sign, 0.13, -0.01))
        ear = kit.cone(head.bm, base, tip, 0.05, 0.003, 8)
        thin = Z.cross((tip - base).normalized()).normalized()
        for vert in ear:
            vert.co -= thin * (vert.co - base).dot(thin) * 0.7
        for face in faces_of(ear):
            face.normal_update()
            if face.normal.x * sign > 0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A wide grin with a gap where one tooth is gone.
    mouth_c = HEAD_C + Vector((0, -0.058, -0.034))
    kit.sphere(face.bm, mouth_c, (0.034, 0.015, 0.014), 10, 6)
    for x in (-0.022, -0.011, 0.012, 0.023):
        tooth = kit.box(face.bm, mouth_c + Vector((x, -0.011, 0.007)), (0.009, 0.006, 0.01))
        face.paint(faces_of(tooth), TEETH)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.058, 0.014))
        eye = kit.sphere(face.bm, center, (0.02, 0.013, 0.019), 10, 6)
        face.paint(faces_of(eye), EYES)
        pupil = kit.sphere(face.bm, center + Vector((-0.006 * sign, -0.011, 0)), (0.008, 0.004, 0.009), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
        wrinkle = kit.tube(face.bm, [center + Vector((0.016 * sign, -0.004, -0.022)), center + Vector((-0.004 * sign, -0.012, -0.026))], [0.0025, 0.0025], 3)
        face.paint(faces_of(wrinkle), SKIN_DARK)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.08)
    # A big mass of frizzy white hair.
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.025, 0.04)), (0.088, 0.085, 0.058), 12, 7)
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.06, -0.015)), (0.08, 0.055, 0.07), 10, 6)
    for index in range(12):
        a = math.radians(-150 + index * 27)
        root = HEAD_C + Vector((0.06 * math.sin(a), 0.035 + 0.045 * math.cos(a), 0.04 - 0.012 * (index % 2)))
        reach = 0.045 + 0.02 * ((index * 5) % 3)
        tip = root + Vector((reach * math.sin(a), 0.02 + reach * math.cos(a), 0.035 - 0.03 * (index % 3)))
        tuft = kit.cone(hair.bm, root, tip, 0.03, 0.006, 5)
        if index % 2:
            hair.paint(faces_of(tuft), HAIR_DARK)
    parts.append(hair)

    goggles = Part("goggles", BRASS, "head", shade=0.05)
    band = kit.torus(goggles.bm, HEAD_C + Vector((0, 0.004, 0.034)), (0, 0.25, 1), 0.077, 0.007, 16, 4)
    goggles.paint(faces_of(band), LEATHER_DARK)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.029 * sign, -0.068, 0.052))
        out = Vector((0.15 * sign, -1, 0.35)).normalized()
        kit.cone(goggles.bm, center - out * 0.006, center + out * 0.02, 0.022, 0.02, 12)
        rim = kit.torus(goggles.bm, center + out * 0.02, out, 0.019, 0.005, 12, 3)
        goggles.paint(faces_of(rim), BRASS_DARK)
        lens = kit.cone(goggles.bm, center + out * 0.018, center + out * 0.022, 0.016, 0.016, 12)
        goggles.paint(faces_of(lens), LENS)
    parts.append(goggles)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.47), (0, -0.008, 0.55), 0.022, 0.02, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    coat = Part("coat", COAT, torso_weights)
    kit.cone(coat.bm, (0, 0, 0.2), (0, 0, 0.48), 0.082, 0.066, 12, squash=0.82)
    # A round back, as an old woman has.
    kit.sphere(coat.bm, (0, 0.02, 0.43), (0.064, 0.05, 0.05), 10, 6)
    # A long, torn hem to the knees.
    for index in range(12):
        a = math.radians(index * 30 + 8)
        top = Vector((0.082 * math.sin(a), -0.067 * math.cos(a), 0.215))
        rag = kit.cone(coat.bm, top, top + Vector((0.01 * math.sin(a), -0.01 * math.cos(a), -0.035 - 0.014 * (index % 3))), 0.022, 0.004, 4, squash=0.5)
        coat.paint(faces_of(rag), COAT_DARK if index % 2 else COAT)
    # Square patches.
    for at, size in (((-0.07, -0.04, 0.26), (0.01, 0.03, 0.035)), ((0.03, -0.068, 0.4), (0.03, 0.01, 0.028)), ((0.05, 0.06, 0.3), (0.03, 0.01, 0.03))):
        patch = kit.box(coat.bm, at, size)
        coat.paint(faces_of(patch), PATCH)
    parts.append(coat)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, -0.004, 0.29), (0, -0.004, 0.315), 0.08, 0.08, 12, squash=0.84)
    buckle = kit.box(belt.bm, (0, -0.072, 0.302), (0.022, 0.008, 0.02))
    belt.paint(faces_of(buckle), BRASS)
    # A small pouch at the right hip.
    pouch = kit.box(belt.bm, (-0.075, -0.03, 0.27), (0.016, 0.03, 0.032))
    belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.2), (0, 0, 0.28), 0.074, 0.074, 12, squash=0.84)
    parts.append(hips)
    return parts


def bag_parts():
    """The bag of junk at her left hip, with nails, bolts and gears, and a trap spring on top."""
    bag = Part("bag", BAG, "hips", shade=0.08)
    c = BAG_C
    kit.sphere(bag.bm, c, (0.04, 0.042, 0.044), 10, 7)
    rim = kit.torus(bag.bm, c + Z * 0.036, (0, 0, 1), 0.034, 0.006, 12, 4)
    bag.paint(faces_of(rim), BAG_DARK)
    strap = kit.tube(bag.bm, [c + Vector((0.0, 0.02, 0.04)), Vector((0.075, 0.0, 0.3))], [0.005, 0.005], 4)
    bag.paint(faces_of(strap), LEATHER_DARK)
    # Junk sticks out of the top.
    for index, (x, y, lean) in enumerate(((-0.012, -0.01, -0.3), (0.012, 0.006, 0.4), (0.0, 0.016, 0.1), (0.018, -0.014, 0.6))):
        base = c + Vector((x, y, 0.03))
        tip = base + Vector((lean * 0.03, 0.0, 0.045))
        nail = kit.cone(bag.bm, base, tip, 0.004, 0.0025, 4)
        bag.paint(faces_of(nail), IRON_LIGHT if index % 2 else IRON)
        head = kit.cone(bag.bm, tip, tip + (tip - base).normalized() * 0.005, 0.008, 0.008, 6)
        bag.paint(faces_of(head), IRON)
    gear = kit.torus(bag.bm, c + Vector((-0.016, 0.0, 0.05)), (0.3, 1, 0.2), 0.013, 0.005, 8, 4)
    bag.paint(faces_of(gear), BRASS_DARK)
    # The trap spring: a coil on the top of the bag.
    coil = [c + Vector((0.016 + 0.012 * math.cos(a), -0.02 + 0.012 * math.sin(a), 0.044 + 0.004 * a)) for a in [i * math.pi / 4 for i in range(17)]]
    spring = kit.tube(bag.bm, coil, [0.0025] * len(coil), 4, caps=False)
    bag.paint(faces_of(spring), SPRING)
    return [bag]


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"upperarm.{side}", COAT, f"upperarm.{side}")
        kit.cone(upper.bm, s - (e - s) * 0.1, e, 0.03, 0.024, 8)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.018, 0.015, 8)
        cuff = kit.cone(forearm.bm, e - d * 0.01, e + d * 0.03, 0.026, 0.024, 8)
        forearm.paint(faces_of(cuff), COAT_DARK)
        wrap = kit.torus(forearm.bm, w - d * 0.012, d, 0.017, 0.004, 8, 3)
        forearm.paint(faces_of(wrap), LEATHER)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.016, (0.016, 0.015, 0.02), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.04, 0.036, 8)
        parts.append(thigh)

        # Baggy trousers to the calf, over leather wraps.
        shin = Part(f"shin.{side}", WRAP, f"shin.{side}")
        hem = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.06)), 0.037, 0.04, 8)
        for face in faces_of(hem):
            shin.paint([face], TROUSERS_DARK if face.calc_center_median().y < 0 else TROUSERS)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.055)), ankle, 0.022, 0.018, 8)
        for z in (0.02, 0.045):
            wrap = kit.torus(shin.bm, ankle + Vector((0, 0, z)), (0, 0, 1), 0.021, 0.004, 8, 3)
            shin.paint(faces_of(wrap), LEATHER_DARK)
        parts.append(shin)

        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.016), (0.026, 0.055, 0.016), 8, 6)
        for toe in (-1, 0, 1):
            kit.sphere(foot.bm, (LEG_X * sign + toe * 0.012, -0.08, 0.01), (0.008, 0.01, 0.008), 5, 4)
        parts.append(foot)
    return parts


def sling_parts():
    sling = Part("sling", CORD, "sling", shade=0.04)
    # Two cords from the hand to the sides of the pouch.
    for sign in (1, -1):
        kit.tube(sling.bm, [GRIP, POUCH_C + Vector((0.026 * sign, 0, 0.01))], [0.0025, 0.0025], 4)
    knot = kit.sphere(sling.bm, GRIP, (0.007, 0.007, 0.007), 5, 4)
    sling.paint(faces_of(knot), LEATHER_DARK)
    # The leather pouch: a shallow cup.
    pouch = kit.sphere(sling.bm, POUCH_C, (0.03, 0.02, 0.016), 8, 5)
    sling.paint(faces_of(pouch), LEATHER)

    stone = Part("stone", BRASS_DARK, "stone", shade=0.04)
    # The shot: a small gear.
    kit.torus(stone.bm, POUCH_C + Z * 0.012, (0, 1, 0), 0.012, 0.005, 8, 4)
    for index in range(6):
        a = 2 * math.pi * index / 6
        kit.box(stone.bm, POUCH_C + Z * 0.012 + Vector((math.cos(a) * 0.018, 0, math.sin(a) * 0.018)), (0.007, 0.007, 0.007))
    return [sling, stone]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("JunkSlinger", BONES)
    parts = head_parts() + body_parts() + bag_parts() + limb_parts() + sling_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "JunkSlingerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """The sling points at the `aim` control with a Damped Track, for the whirl."""
    aim = kit.add_empty("aim", POUCH_C)
    track = rig.pose.bones["sling"].constraints.new("DAMPED_TRACK")
    track.name = "Track"
    track.target = aim
    track.track_axis = "TRACK_Y"
    return {"aim": aim}


# --- Clips -----------------------------------------------------------------------

# The hand is about here when she whirls the sling above her head. The aim
# circle is wide, so that a small error in this place does not change the
# direction of the sling much.
WHIRL_C = Vector((-0.05, 0.0, 0.9))
WHIRL_R = 0.8


def whirl_at(degrees):
    """A point on the whirl circle: 0 is in front of her (-Y), and 90 is on her left (+X)."""
    a = math.radians(degrees)
    return WHIRL_C + Vector((math.sin(a) * WHIRL_R, -math.cos(a) * WHIRL_R, 0.12))


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

    def stand(breath=0.0, swing=0.0):
        """
        The idle stance: a little bent, with a wide grin. `swing` swings the
        sling at her side.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.01 - breath * 0.003)),
            "hips": t("hips", (Z, -8)),
            "spine": t("spine", (X, 10 + breath)),
            "chest": t("chest", (X, 6 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, -10)),
            "head": t("head", (X, -6 + breath * 2), (Z, 6), (Y, -4 + swing * 3)),
            "upperarm.R": t("upperarm.R", (X, -6 + swing * 4), (Y, -6)),
            "forearm.R": t("forearm.R", (X, -10)),
            "sling": t("sling", (X, swing * 22), (Y, -6)),
            "upperarm.L": t("upperarm.L", (X, 4), (Y, 8)),
            "forearm.L": t("forearm.L", (X, -30)),
            "thigh.L": t("thigh.L", (X, -14), (Y, -6)),
            "shin.L": t("shin.L", (X, 18)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 8), (Y, 6)),
            "shin.R": t("shin.R", (X, 12)),
            "foot.R": t("foot.R", (X, -18)),
            "aim@pos": POUCH_C,
        }

    def slump(breath=0.0):
        """Low HP: she sits down on her bag and catches her breath."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.04, -0.15 - breath * 0.004)),
            hips=t("hips", (Z, -8), (X, -16)),
            spine=t("spine", (X, 30 + breath * 3)),
            chest=t("chest", (X, 12 + breath * 2)),
            head=t("head", (Z, 4), (X, 18 + breath * 4), (Y, -10)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, -12)),
            forearm__R=t("forearm.R", (X, -50)),
            sling=t("sling", (X, 90)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 10)),
            forearm__L=t("forearm.L", (X, -50)),
            thigh__L=t("thigh.L", (X, -80), (Y, -14)),
            shin__L=t("shin.L", (X, 60)),
            foot__L=t("foot.L", (X, 6)),
            thigh__R=t("thigh.R", (X, -76), (Y, 14)),
            shin__R=t("shin.R", (X, 66)),
            foot__R=t("foot.R", (X, 0)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the sling flies out."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.014)),
            spine=t("spine", (X, -4 * amount)),
            chest=t("chest", (X, -12 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            upperarm__R=t("upperarm.R", (X, 10 * amount), (Y, -16 * amount)),
            upperarm__L=t("upperarm.L", (X, 16 * amount), (Y, 20 * amount)),
            sling=t("sling", (X, 40 * amount), (Y, -20 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.03)),
            spine=t("spine", (X, 22)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
            upperarm__R=t("upperarm.R", (X, 16), (Y, -24)),
            upperarm__L=t("upperarm.L", (X, 16), (Y, 30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the sling out at her side."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.08)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20), (Z, 30)),
            upperarm__R=t("upperarm.R", (Y, -70), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            sling=t("sling", (Y, -60)),
            upperarm__L=t("upperarm.L", (Y, 60), (X, -10)),
            forearm__L=t("forearm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, -20), (Y, -10)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -30), (Y, 10)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
        )

    def crouch(base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
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
            upperarm__R=t("upperarm.R", (X, -30), (Y, -16)),
            sling=t("sling", (X, 64)),
        )

    def proud(base):
        """Up again, the sling raised high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -20)),
            forearm__R=t("forearm.R", (X, -10)),
            sling=t("sling", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, 20)),
        )

    def step(front, lift=0.0):
        """A hobble: a short step, and the body bobs. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(swing=-0.6 * front),
            hips_at_loc=at("hips", (0.01 * front, 0, -0.006 + lift * 0.012)),
            hips=t("hips", (Z, -8), (Y, 5 * front)),
            spine=t("spine", (X, 14), (Y, -4 * front)),
            head=t("head", (X, -8), (Z, 6), (Y, -5 * front)),
            upperarm__L=t("upperarm.L", (X, -10 * front), (Y, 8)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -28 - lift * 8)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 16 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14)),
                f"shin__{back}": t(f"shin.{back}", (X, 16)),
                f"foot__{back}": t(f"foot.{back}", (X, 8)),
            },
        )

    # The attack: she raises the sling above her head and whirls it. The gear
    # leaves at 20% of the attack (`FLIGHT_START` in fx.ts), at frame 6 of 30,
    # with the sling in front of her, and the `stone` bone scales down. Then
    # she takes a new piece of junk from her bag.
    def whirl(base, degrees, stone=1.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.016)),
            hips=t("hips", (Z, -14)),
            spine=t("spine", (X, 2)),
            chest=t("chest", (X, -8), (Z, -8)),
            neck=t("neck", (X, -6)),
            head=t("head", (X, -16), (Z, 10)),
            upperarm__R=t("upperarm.R", (X, -172), (Y, -12)),
            forearm__R=t("forearm.R", (X, -4)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, 30)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -24), (Y, -8)),
            shin__L=t("shin.L", (X, 22)),
            thigh__R=t("thigh.R", (X, 14), (Y, 8)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -26)),
            stone_at_scale=stone,
            aim_at_pos=whirl_at(degrees),
            **{"sling/Track": 1.0},
        )

    def release(base):
        """The release: she leans in, and the sling flies out in front of her."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.03, -0.02)),
            hips=t("hips", (Z, 6)),
            spine=t("spine", (X, 16)),
            chest=t("chest", (X, 8), (Z, 6)),
            head=t("head", (X, -12), (Z, -4)),
            upperarm__R=t("upperarm.R", (X, -100), (Y, -10)),
            forearm__R=t("forearm.R", (X, -6)),
            sling=t("sling", (X, 10)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 26)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__L=t("thigh.L", (X, -36), (Y, -8)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 22), (Y, 8)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -26)),
            stone_at_scale=0.01,
        )

    def reload(base, stone=0.01):
        """She takes a new gear from the bag at her left hip and puts it in the pouch."""
        return pose(
            base,
            spine=t("spine", (X, 18)),
            chest=t("chest", (X, 8), (Z, 10)),
            head=t("head", (X, 14), (Z, 14)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 10)),
            forearm__R=t("forearm.R", (X, -50)),
            sling=t("sling", (X, 20)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, -6)),
            forearm__L=t("forearm.L", (X, -40), (Z, 30)),
            stone_at_scale=stone,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, swing in ((0, 0, 0), (6, 0.25, 0.7), (12, 0.5, 1), (18, 0.75, 0.7), (24, 1, 0), (30, 0.75, -0.7), (36, 0.5, -1), (42, 0.25, -0.7), (48, 0, 0)):
        idle.key(frame, stand(breath, swing))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 0.5), (24, 1), (36, 0.5), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, step(1, 1)).key(12, step(-1)).key(18, step(-1, 1)).key(24, step(1))
    clips.append(walk)

    # A whirl of one and a half turns, from behind her to the front: 0 is in
    # front of her, and the turn goes from her right (the camera side) round
    # the back to her left.
    attack = Clip("attack", 30)
    attack.key(0, stand())
    for frame in range(1, 6):
        attack.key(frame, whirl(stand(), -72 - 108 * frame))
    attack.key(6, pose(release(stand()), aim_at_pos=whirl_at(-720), **{"sling/Track": 1.0}))
    attack.key(8, release(stand())).key(12, release(stand()))
    attack.key(18, reload(stand())).key(22, reload(stand())).key(23, reload(stand(), 1.0)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(24, fallen(stand())).key(28, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.01, -0.07))))
    summon.key(17, proud(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "junk-slinger.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
