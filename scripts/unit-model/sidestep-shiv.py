"""
Sidestep Shiv (`goblin.sidestepShiv`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a thin pale goblin man with a
long pink nose, big round amber eyes, a wide grin and very large ears that
come out of a patched brown hood. A torn dark scarf, a cream shirt under a
leather vest, a belt with many pockets and one brass buckle, a ring of
stolen keys at his left hip, torn brown trousers, leather wraps on the shins
and bare feet. He has a small knife in each hand. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/sidestep-shiv.glb`;
then `bun unit-model:pack sidestep-shiv` packs it for the game.

He stays low on bent knees, his chest to the front. He has Pivot, so he
watches behind him: his idle looks back over his right shoulder, on the
camera side, with a grin. The right knife is ready in front, and the left
knife points back. His walk is a sneaky tiptoe. His attack is a quick spin:
he turns, stabs with the right knife and cuts back with the left knife. The
keys jingle on their own bone. He has no Keyword that he uses by his own
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

SKIN = hex_color("#bcb6aa")
SKIN_DARK = hex_color("#8a847a")
EAR = hex_color("#e0a090")
NOSE = hex_color("#d89484")
EYES = hex_color("#f0a83a")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#3a1c18")
TEETH = hex_color("#f2ecd8")
HOOD = hex_color("#7a5a3a")
HOOD_DARK = hex_color("#5a4028")
PATCH = hex_color("#9a7a52")
SCARF = hex_color("#3c4048")
SCARF_DARK = hex_color("#25282e")
SHIRT = hex_color("#ddd0b4")
VEST = hex_color("#5e3e26")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
TROUSERS = hex_color("#6e5038")
TROUSERS_DARK = hex_color("#4e3826")
WRAP = hex_color("#6a4228")
STEEL = hex_color("#c4c2bc")
STEEL_DARK = hex_color("#7c7a74")

# --- Proportions ---------------------------------------------------------------

# He is thin: narrow hips and long, thin arms.
HIP_Z = 0.3
WAIST_Z = 0.36
CHEST_Z = 0.42
SHOULDER_Z = 0.48
NECK_Z = 0.5
HEAD_C = Vector((0, -0.025, 0.6))
KNEE_Z = 0.17
ANKLE_Z = 0.04
LEG_X = 0.044

# The right arm reaches to the front with its knife up; the left arm hangs
# back with its knife pointing back. These are the rest (bind) positions.
SR = Vector((-0.082, 0, SHOULDER_Z))
ER = Vector((-0.118, -0.03, 0.385))
WR = Vector((-0.112, -0.105, 0.33))
TR = WR + (WR - ER).normalized() * 0.035
SL = Vector((0.082, 0, SHOULDER_Z))
EL = Vector((0.12, 0.035, 0.385))
WL = Vector((0.13, 0.075, 0.305))
TL = WL + (WL - EL).normalized() * 0.035

GRIP_R = WR + (WR - ER).normalized() * 0.02
BLADE_R = Vector((0, -0.3, 1)).normalized()
GRIP_L = WL + (WL - EL).normalized() * 0.02
BLADE_L = Vector((0.25, 1, -0.2)).normalized()

KEYS_TOP = Vector((0.05, -0.055, 0.3))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.005, 0.53), "chest"),
    ("head", (0, -0.005, 0.53), (0, -0.01, 0.7), "neck"),
    ("scarf", (0, 0.05, 0.49), (0, 0.1, 0.3), "chest"),
    ("keys", tuple(KEYS_TOP), tuple(KEYS_TOP - Z * 0.06), "hips"),
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
        return blend("hips", "spine", co.z, 0.32, 0.39)
    return blend("spine", "chest", co.z, 0.4, 0.46)


def hood_weights(co):
    """The hood follows the head, and its cape follows the chest."""
    return blend("chest", "head", co.z, 0.5, 0.54)


def scarf_weights(co):
    return blend("scarf", "chest", co.z, 0.4, 0.47)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.07, 0.07, 0.074), 14, 10)
    # A narrow chin and a long nose that hangs down a little.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.024, -0.052)), (0.042, 0.036, 0.03), 10, 6)
    nose = kit.tube(head.bm, [HEAD_C + Vector((0, -0.064, 0.0)), HEAD_C + Vector((0, -0.1, -0.012)), HEAD_C + Vector((0, -0.118, -0.034))], [0.016, 0.012, 0.007], 6)
    head.paint(faces_of(nose), NOSE)
    for sign in (1, -1):
        # Very large goblin ears out through the hood, a little up at the tips.
        ear = kit.cone(head.bm, HEAD_C + Vector((0.062 * sign, 0.012, 0.004)), HEAD_C + Vector((0.215 * sign, 0.05, 0.05)), 0.04, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < -0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A wide grin with a row of teeth.
    grin = [HEAD_C + Vector((0.038, -0.054, -0.03)), HEAD_C + Vector((0.0, -0.068, -0.046)), HEAD_C + Vector((-0.038, -0.054, -0.03))]
    kit.tube(face.bm, grin, [0.006, 0.009, 0.006], 5)
    teeth = kit.tube(face.bm, [p + Vector((0, -0.004, 0.004)) for p in grin], [0.003, 0.004, 0.003], 4)
    face.paint(faces_of(teeth), TEETH)
    # Big round eyes.
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.058, 0.018))
        eye = kit.sphere(face.bm, center, (0.021, 0.014, 0.021), 10, 6)
        face.paint(faces_of(eye), EYES)
        pupil = kit.sphere(face.bm, center + Vector((-0.004 * sign, -0.012, 0)), (0.008, 0.004, 0.009), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
        brow = kit.tube(face.bm, [center + Vector((0.016 * sign, -0.006, 0.02)), center + Vector((-0.012 * sign, -0.012, 0.026))], [0.004, 0.004], 3)
        face.paint(faces_of(brow), SKIN_DARK)
    parts.append(face)

    # The hood: a shell round the back of the head, open at the face, with a
    # point that hangs at the back and a short cape over the shoulders.
    hood = Part("hood", HOOD, hood_weights, shade=0.08)
    center = HEAD_C + Vector((0, 0.01, 0.012))
    verts = kit.sphere(hood.bm, center, (0.084, 0.082, 0.088), 14, 10)
    face_hole = [v for v in verts if (v.co - center).normalized().y < -0.42 and v.co.z < center.z + 0.06]
    bmesh.ops.delete(hood.bm, geom=face_hole, context="VERTS")
    point = kit.cone(hood.bm, center + Vector((0, 0.05, 0.05)), center + Vector((0, 0.13, -0.02)), 0.04, 0.006, 7)
    hood.paint(faces_of(point), HOOD_DARK)
    cape = kit.cone(hood.bm, (0, 0.005, 0.53), (0, 0.01, 0.43), 0.06, 0.1, 12, squash=0.85)
    for face in faces_of(cape):
        c = face.calc_center_median()
        if c.y < -0.05 and abs(c.x) < 0.035:
            hood.paint([face], HOOD_DARK)
    # Square patches.
    for at, size in (((0.06, 0.04, 0.64), (0.012, 0.03, 0.03)), ((-0.045, 0.07, 0.6), (0.025, 0.012, 0.025)), ((0.07, 0.03, 0.47), (0.012, 0.03, 0.025))):
        patch = kit.box(hood.bm, at, size)
        hood.paint(faces_of(patch), PATCH)
    parts.append(hood)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.48), (0, -0.004, 0.56), 0.022, 0.02, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    shirt = Part("shirt", SHIRT, torso_weights)
    kit.cone(shirt.bm, (0, 0, 0.3), (0, 0, 0.47), 0.058, 0.064, 12, squash=0.8)
    parts.append(shirt)

    vest = Part("vest", VEST, torso_weights)
    verts = kit.cone(vest.bm, (0, 0, 0.33), (0, 0, 0.47), 0.063, 0.069, 12, squash=0.8)
    open_front = [v for v in verts if v.co.y < -0.045 and abs(v.co.x) < 0.02]
    vest.paint(faces_of(open_front), SHIRT)
    parts.append(vest)

    # The torn scarf: round the neck, with two long torn ends behind.
    scarf = Part("scarf", SCARF, scarf_weights, shade=0.08)
    kit.torus(scarf.bm, (0, 0.0, 0.485), (0, 0.25, 1), 0.05, 0.016, 12, 5)
    for x, length in ((0.02, 0.17), (-0.025, 0.13)):
        end = kit.cone(scarf.bm, (x, 0.05, 0.48), (x * 1.6, 0.1, 0.48 - length), 0.024, 0.008, 5, squash=0.35)
        scarf.paint(faces_of(end), SCARF_DARK)
    parts.append(scarf)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, 0, 0.3), (0, 0, 0.328), 0.062, 0.061, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.051, 0.314), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), BRASS)
    pin = kit.box(belt.bm, (0, -0.056, 0.314), (0.012, 0.004, 0.012))
    belt.paint(faces_of(pin), LEATHER_DARK)
    # Many pockets round the belt.
    for angle in (-130, -100, -70, 60, 100, 140, 180):
        a = math.radians(angle)
        center = Vector((0.064 * math.sin(a), -0.052 * math.cos(a), 0.3))
        pocket = kit.box(belt.bm, center, (0.026, 0.02, 0.034))
        belt.paint(faces_of(pocket), LEATHER if angle % 20 else LEATHER_DARK)
        flap = kit.box(belt.bm, center + Vector((0, 0, 0.016)), (0.028, 0.022, 0.008))
        belt.paint(faces_of(flap), LEATHER_DARK)
    parts.append(belt)

    # The ring of stolen keys hangs at the left hip.
    keys = Part("keys", BRASS, "keys", shade=0.04)
    kit.torus(keys.bm, KEYS_TOP - Z * 0.012, (0, 1, 0), 0.012, 0.0025, 10, 3)
    for index, angle in enumerate((-30, -10, 10, 30)):
        a = math.radians(angle)
        top = KEYS_TOP - Z * 0.022 + Vector((math.sin(a) * 0.008, 0, 0))
        tip = top + Vector((math.sin(a) * 0.02, -0.002 * index, -0.045))
        shaft = kit.cone(keys.bm, top, tip, 0.0025, 0.0025, 4)
        keys.paint(faces_of(shaft), BRASS if index % 2 else BRASS_DARK)
        bit = kit.box(keys.bm, tip + Vector((0.004, 0, 0.004)), (0.008, 0.003, 0.008))
        keys.paint(faces_of(bit), BRASS_DARK)
    parts.append(keys)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.25), (0, 0, 0.31), 0.06, 0.06, 12, squash=0.82)
    parts.append(hips)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", SHIRT, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.022, 0.019, 8)
        cuff = kit.torus(sleeve.bm, e, (e - s), 0.019, 0.006, 8, 3)
        sleeve.paint(faces_of(cuff), SHIRT)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.015, 0.012, 8)
        # Leather wraps round the wrist.
        for along in (0.55, 0.75):
            wrap = kit.torus(forearm.bm, e + (w - e) * along, d, 0.016, 0.004, 8, 3)
            forearm.paint(faces_of(wrap), WRAP)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.016, (0.016, 0.015, 0.02), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.036, 0.03, 8)
        parts.append(thigh)

        # The trousers end in a torn hem below the knee, with a patch.
        shin = Part(f"shin.{side}", SKIN, f"shin.{side}")
        kit.cone(shin.bm, knee, ankle, 0.018, 0.015, 8)
        hem = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.05)), 0.032, 0.036, 8)
        for face in faces_of(hem):
            shin.paint([face], TROUSERS_DARK if face.calc_center_median().y < 0 else TROUSERS)
        for z in (0.06, 0.08):
            wrap = kit.torus(shin.bm, ankle + Vector((0, 0, z - 0.04)), (0, 0, 1), 0.017, 0.005, 8, 3)
            shin.paint(faces_of(wrap), WRAP)
        parts.append(shin)

        # Big bare goblin feet.
        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.016), (0.026, 0.055, 0.017), 8, 6)
        for toe in (-1, 0, 1):
            kit.sphere(foot.bm, (LEG_X * sign + toe * 0.012, -0.08, 0.01), (0.008, 0.01, 0.008), 5, 4)
        parts.append(foot)
    return parts


def knife(part, grip, blade_dir, length):
    """A small knife: a wrapped grip, a brass guard and a steel blade."""
    blade_dir = blade_dir.normalized()
    handle = kit.cone(part.bm, grip - blade_dir * 0.03, grip + blade_dir * 0.012, 0.007, 0.007, 6)
    part.paint(faces_of(handle), LEATHER_DARK)
    pommel = kit.sphere(part.bm, grip - blade_dir * 0.032, (0.008, 0.008, 0.008), 5, 4)
    part.paint(faces_of(pommel), BRASS)
    guard = kit.cone(part.bm, grip + blade_dir * 0.012, grip + blade_dir * 0.018, 0.016, 0.016, 4, squash=0.4)
    part.paint(faces_of(guard), BRASS)
    blade = kit.cone(part.bm, grip + blade_dir * 0.018, grip + blade_dir * (0.018 + length), 0.015, 0.001, 4, squash=0.3)
    part.paint(faces_of(blade), STEEL)
    edge = kit.cone(part.bm, grip + blade_dir * 0.02, grip + blade_dir * (0.016 + length * 0.7), 0.004, 0.002, 4)
    part.paint(faces_of(edge), STEEL_DARK)


def knife_parts():
    right = Part("knife.R", STEEL, "hand.R", shade=0.02)
    knife(right, GRIP_R, BLADE_R, 0.11)
    left = Part("knife.L", STEEL, "hand.L", shade=0.02)
    knife(left, GRIP_L, BLADE_L, 0.1)
    return [right, left]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("SidestepShiv", BONES)
    parts = head_parts() + body_parts() + limb_parts() + knife_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "SidestepShivMesh")
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

    def stand(breath=0.0, look=1.0, sway=0.0):
        """
        The idle crouch: low on bent knees, the chest to the front. `look`
        turns the head back over the right shoulder.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.035 - breath * 0.003)),
            "hips": t("hips", (Z, -4), (X, 6)),
            "spine": t("spine", (X, 12 + breath)),
            "chest": t("chest", (X, 6 - breath * 2), (Z, -6 * look)),
            "neck": t("neck", (X, -10), (Z, -26 * look)),
            "head": t("head", (Z, -46 * look + sway * 4), (X, -6 + breath * 2), (Y, 8 * look)),
            "upperarm.R": t("upperarm.R", (X, -14 - breath * 2), (Y, -6)),
            "hand.R": t("hand.R", (X, 6 + sway * 6)),
            "upperarm.L": t("upperarm.L", (X, 18 + breath * 2), (Y, 10)),
            "hand.L": t("hand.L", (Z, sway * 6)),
            "thigh.L": t("thigh.L", (X, -34), (Y, -6)),
            "shin.L": t("shin.L", (X, 44)),
            "foot.L": t("foot.L", (X, -10)),
            "thigh.R": t("thigh.R", (X, -2), (Y, 10)),
            "shin.R": t("shin.R", (X, 38)),
            "foot.R": t("foot.R", (X, -34)),
            "scarf": t("scarf", (X, -8 - breath * 2), (Y, sway * 4)),
            "keys": t("keys", (X, sway * 10), (Y, sway * 8)),
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, the right knife still up, still watching behind him."""
        return pose(
            stand(look=0.6),
            hips_at_loc=at("hips", (0, 0.03, -0.1 - breath * 0.004)),
            spine=t("spine", (X, 26 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            head=t("head", (Z, -26), (X, 6 + breath * 4), (Y, 6)),
            upperarm__R=t("upperarm.R", (X, -6), (Y, -10)),
            forearm__R=t("forearm.R", (X, 20)),
            upperarm__L=t("upperarm.L", (X, 6), (Y, 16)),
            thigh__L=t("thigh.L", (X, -72), (Y, -6)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -40)),
            scarf=t("scarf", (X, 14)),
            keys=t("keys", (X, 20)),
        )

    def recoil(base, amount=1.0):
        """A hit jolts him back, and his head snaps to the front."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, -0.035 - 0.008 * amount)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            neck=t("neck", (X, -8)),
            head=t("head", (X, -20 * amount), (Z, -10)),
            upperarm__R=t("upperarm.R", (X, -40 * amount), (Y, -24 * amount)),
            upperarm__L=t("upperarm.L", (X, 36 * amount), (Y, 22 * amount)),
            scarf=t("scarf", (X, -30 * amount)),
            keys=t("keys", (X, -30 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.025, -0.04)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -6)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -22)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, 12)),
            shin__R=t("shin.R", (X, 28)),
            foot__R=t("foot.R", (X, -20)),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -34)),
            upperarm__L=t("upperarm.L", (X, 20), (Y, 34)),
            keys=t("keys", (X, 30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the knives out to the sides."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0), (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -30)),
            upperarm__R=t("upperarm.R", (Y, -64), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 0)),
            upperarm__L=t("upperarm.L", (Y, 64), (X, -10)),
            forearm__L=t("forearm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, -10), (Y, -6)),
            shin__L=t("shin.L", (X, 12)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            scarf=t("scarf", (X, -50)),
            keys=t("keys", (X, -60)),
        )

    def crouch(base):
        """Very low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.1)),
            spine=t("spine", (X, 32)),
            chest=t("chest", (X, 12)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -10)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -24)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 106)),
            foot__R=t("foot.R", (X, -52)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, -10)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 10)),
            scarf=t("scarf", (X, 20)),
        )

    def spread(base):
        """Up again, both knives out to the sides and a grin back over the shoulder: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.02)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (X, -4)),
            upperarm__R=t("upperarm.R", (Y, -70), (X, -10)),
            forearm__R=t("forearm.R", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, 70), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            keys=t("keys", (Y, 20)),
        )

    def step(front, lift=0.0):
        """A sneaky tiptoe. `front` is 1 for the left foot, -1 for the right; `lift` is in the air."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(look=0.5),
            hips_at_loc=at("hips", (0, 0.01, -0.04 + lift * 0.016)),
            hips=t("hips", (Z, -4 * front), (X, 6)),
            spine=t("spine", (X, 18), (Y, -3 * front)),
            chest=t("chest", (X, 6), (Z, -6 * front)),
            upperarm__R=t("upperarm.R", (X, -14 + 10 * front), (Y, -6)),
            upperarm__L=t("upperarm.L", (X, 18 + 10 * front), (Y, 10)),
            scarf=t("scarf", (X, -16)),
            keys=t("keys", (X, 14 * front), (Y, -10 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -44 - lift * 10)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 40 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -16 + lift * 20)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 8)),
                f"shin__{back}": t(f"shin.{back}", (X, 36)),
                f"foot__{back}": t(f"foot.{back}", (X, -30)),
            },
        )

    # The attack: he turns his head to the front, spins on his toes and stabs
    # with the right knife. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the stab lands at frame 15 of 30, and the
    # left knife cuts back just after it.
    def wind(base):
        """He turns to his right and pulls the right knife back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.05)),
            hips=t("hips", (Z, -26), (X, 6)),
            spine=t("spine", (X, 14), (Z, -10)),
            chest=t("chest", (X, 6), (Z, -12)),
            neck=t("neck", (X, -10), (Z, 10)),
            head=t("head", (Z, 14), (X, -8)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, -30)),
            forearm__R=t("forearm.R", (X, -70)),
            hand__R=t("hand.R", (X, 40)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, 20)),
            scarf=t("scarf", (X, -20), (Y, 20)),
            keys=t("keys", (Y, -30)),
        )

    def stab(base):
        """He spins to his left and drives the right knife straight to the front."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.07, -0.06)),
            hips=t("hips", (Z, 20), (X, 6)),
            spine=t("spine", (X, 20)),
            chest=t("chest", (X, 6), (Z, 10)),
            neck=t("neck", (X, -18), (Z, -12)),
            head=t("head", (X, -12), (Z, -14)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 120), (Z, -40)),
            upperarm__L=t("upperarm.L", (X, 34), (Y, 24)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -66), (Y, -6)),
            shin__L=t("shin.L", (X, 56)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
            scarf=t("scarf", (X, 20), (Y, -30)),
            keys=t("keys", (X, -40), (Y, 30)),
        )

    def backcut(base):
        """The left knife cuts back behind him, as he turns back to his right."""
        return pose(
            stab(base),
            hips=t("hips", (Z, -8), (X, 6)),
            chest=t("chest", (X, 8), (Z, -10)),
            upperarm__R=t("upperarm.R", (X, -24), (Y, -16)),
            hand__R=t("hand.R", (X, 60)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 74)),
            forearm__L=t("forearm.L", (X, -10)),
            hand__L=t("hand.L", (Z, 40)),
            keys=t("keys", (X, 30), (Y, -30)),
        )

    clips = []
    # The idle: he looks back over his shoulder, glances to the front, and looks back again.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, look, sway in ((0, 0, 1, 0), (10, 0.5, 1, 1), (18, 0.8, 0.1, 0), (26, 1, 0.1, 0), (32, 0.6, 1, -1), (40, 0.3, 1, 0), (48, 0, 1, 0)):
        idle.key(frame, stand(breath, look, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, step(1, 1)).key(12, step(-1)).key(18, step(-1, 1)).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, wind(stand())).key(15, stab(stand())).key(18, stab(stand()))
    attack.key(21, backcut(stand())).key(26, stand(look=0.4)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand(look=0))).key(41, spread(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(look=0))).key(10, pose(crouch(stand(look=0)), hips_at_loc=at("hips", (0, 0.03, -0.09))))
    summon.key(17, spread(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "sidestep-shiv.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
