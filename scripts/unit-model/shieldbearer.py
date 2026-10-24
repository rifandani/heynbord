"""
Shieldbearer (`human.shieldbearer`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a strong, calm woman soldier with
dark hair under a simple steel cap, a mail shirt, a blue skirt with gold trim,
a short blue cape, leather bracers, tall boots, a short sword low in the
right hand and a large round shield on the left arm. The shield has a faded
blue and gold paint, a steel boss and many dents. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/shieldbearer.glb`;
then `bun unit-model:pack shieldbearer` packs it for the game.

The Battle camera sees the right side of a player Unit, so at rest she turns
to her right and crouches a little behind the shield: the face of the shield
then turns to the camera, and the sword is low beside it. Her attack is a
shield bash that pushes the foe back (Knockback). She is Heavy, so her walk
is slow. She has no Keyword that she uses by her own action, so she has no
cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#d9a17f")
HAIR = hex_color("#3a2418")
HAIR_LIGHT = hex_color("#55361f")
EYES = hex_color("#231a14")
BROW = hex_color("#2e1c12")
STEEL = hex_color("#b6babe")
STEEL_DARK = hex_color("#767c82")
MAIL = hex_color("#8a8f95")
MAIL_DARK = hex_color("#5c6168")
BLUE = hex_color("#2f4c92")
BLUE_FADED = hex_color("#4f6aa6")
BLUE_DARK = hex_color("#1e3264")
GOLD = hex_color("#d6a443")
GOLD_DARK = hex_color("#98722b")
CREAM = hex_color("#e6dcc6")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#4a2e1c")
TROUSERS = hex_color("#4e3c30")
BOOT = hex_color("#5c3b22")
WOOD = hex_color("#6b4a2c")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.72
NECK_Z = 0.745
HEAD_C = Vector((0, -0.004, 0.866))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.062

# The left arm holds the shield across the body; the right arm holds the
# sword low. These are the rest (bind) positions.
SL = Vector((0.118, 0, SHOULDER_Z))
EL = Vector((0.19, -0.05, 0.575))
WL = Vector((0.08, -0.11, 0.53))
TL = WL + (WL - EL).normalized() * 0.04
SR = Vector((-0.118, 0, SHOULDER_Z))
ER = Vector((-0.16, 0.02, 0.575))
WR = Vector((-0.165, -0.04, 0.45))
DR = (WR - ER).normalized()
TR = WR + DR * 0.04
HAND_R = WR + DR * 0.022

# The round shield: its front faces -Y at rest.
SHIELD_C = Vector((0.07, -0.175, 0.5))
SHIELD_R = 0.2
SHIELD_DOME = 0.03
GRIP_L = WL + (WL - EL).normalized() * 0.02

# At rest the short sword points forward and down by the right leg.
SWORD = Vector((0.1, -0.7, -0.7)).normalized()
BLADE = 0.21

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.785), "chest"),
    ("head", (0, 0, 0.785), (0, 0, 0.96), "neck"),
    ("skirt.F", (0, -0.08, 0.47), (0, -0.1, 0.28), "hips"),
    ("cape", (0, 0.08, 0.71), (0, 0.12, 0.36), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("shield", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("sword", tuple(HAND_R), tuple(HAND_R + SWORD * 0.1), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The mail and the skirt follow the hips at the top and the thighs lower; the front panel swings."""
    if co.z > 0.5:
        return torso_weights(co)
    t = clamp01((0.5 - co.z) / 0.18)
    side = co.x / 0.1
    weights = {
        "hips": 1 - t * 0.85,
        "thigh.L": t * clamp01(side + 0.3) * 0.85,
        "thigh.R": t * clamp01(-side + 0.3) * 0.85,
    }
    if co.y < -0.05 and abs(co.x) < 0.06:
        front = t * clamp01((-0.05 - co.y) / 0.03)
        weights = {bone: weight * (1 - front) for bone, weight in weights.items()}
        weights["skirt.F"] = front
    return weights


def cape_weights(co):
    return blend("cape", "chest", co.z, 0.56, 0.68)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.06, 0.065, 0.077), 14, 10)
    kit.cone(head.bm, (0, -0.062, 0.864), (0, -0.077, 0.854), 0.011, 0.003, 5)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    # Calm: level eyes and straight brows.
    for sign in (1, -1):
        kit.sphere(face.bm, (0.024 * sign, -0.055, 0.874), (0.009, 0.007, 0.009), 8, 6)
        brow = kit.slab(face.bm, (0.025 * sign, -0.06, 0.892), (0.016, 0, 0.001 * sign), (0, 0.004, 0), (0, 0, 0.0035))
        face.paint(faces_of(brow), BROW)
    mouth = kit.slab(face.bm, (0, -0.06, 0.836), (0.012, 0, 0), (0, 0.003, 0), (0, 0, 0.0025))
    face.paint(faces_of(mouth), hex_color("#9a4a3c"))
    parts.append(face)

    # Dark hair: a fringe under the cap and loose locks down to the shoulders.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.008, 0.874), (0.066, 0.072, 0.074), 14, 10)
    front = [v for v in verts if v.co.z < 0.79 or (v.co.y < -0.03 and v.co.z < 0.892)]
    kit.bmesh.ops.delete(hair.bm, geom=front, context="VERTS")
    for x in (-0.05, -0.02, 0.02, 0.05):
        lock = kit.cone(hair.bm, (x, 0.045, 0.85), (x * 1.5, 0.07, 0.75), 0.026, 0.008, 6, squash=0.7)
        if int(x * 100) % 2:
            hair.paint(faces_of(lock), HAIR_LIGHT)
    for sign in (1, -1):
        lock = kit.cone(hair.bm, (0.056 * sign, -0.02, 0.87), (0.068 * sign, -0.012, 0.78), 0.018, 0.006, 6, squash=0.7)
        hair.paint(faces_of(lock), HAIR_LIGHT)
    parts.append(hair)

    # The simple steel cap: a round skull with a ridge, a narrow brim and rivets.
    cap = Part("cap", STEEL, "head", shade=0.16)
    c = HEAD_C + Vector((0, 0.004, 0.012))
    verts = kit.sphere(cap.bm, c, (0.072, 0.077, 0.078), 14, 10)
    low = [v for v in verts if v.co.z < c.z - 0.006]
    kit.bmesh.ops.delete(cap.bm, geom=low, context="VERTS")
    brim = kit.torus(cap.bm, c + Vector((0, 0, -0.002)), (0, 0.05, 1), 0.078, 0.009, 16, 4)
    cap.paint(faces_of(brim), STEEL_DARK)
    ridge = kit.tube(cap.bm, [c + Vector((0, -0.07, 0.02)), c + Vector((0, -0.04, 0.068)), c + Vector((0, 0.02, 0.078)), c + Vector((0, 0.07, 0.035))], [0.006] * 4, 4)
    cap.paint(faces_of(ridge), STEEL_DARK)
    for angle in range(0, 360, 45):
        a = math.radians(angle)
        rivet = kit.sphere(cap.bm, c + Vector((math.sin(a) * 0.072, -math.cos(a) * 0.077, 0.012)), (0.005, 0.005, 0.005), 4, 3)
        cap.paint(faces_of(rivet), STEEL_DARK)
    parts.append(cap)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.73), (0, 0, 0.81), 0.024, 0.022, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The mail shirt: grey rings in rows, from the neck to mid thigh.
    mail = Part("mail", MAIL, skirt_weights, shade=0.12)
    verts = kit.cone(mail.bm, (0, 0, 0.42), (0, 0, 0.73), 0.088, 0.088, 14, squash=0.8)
    for f in faces_of(verts):
        if int(f.calc_center_median().z * 90) % 2:
            mail.paint([f], MAIL_DARK)
    parts.append(mail)

    # A cream padded collar and a blue hood round the neck.
    collar = Part("collar", BLUE_DARK, "chest", shade=0.06)
    kit.torus(collar.bm, (0, 0.006, 0.738), (0, 0.15, 1), 0.056, 0.02, 12, 5)
    parts.append(collar)

    # The blue skirt under the mail, with a gold hem.
    skirt = Part("skirt", BLUE, skirt_weights, shade=0.1)

    def skirt_color(row, column):
        return GOLD if row == 2 else (BLUE_FADED if column % 4 == 1 else BLUE)

    kit.ragged_cone(skirt, 0.46, 0.28, 0.092, 0.118, 16, 3, 0.8, 0.0, skirt_color, BLUE_DARK)
    parts.append(skirt)

    mail_hem = Part("mailHem", MAIL_DARK, skirt_weights, shade=0.08)
    kit.torus(mail_hem.bm, (0, 0, 0.425), (0, 0, 1), 0.09, 0.008, 14, 4)
    parts.append(mail_hem)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.5), (0, 0, 0.53), 0.09, 0.089, 14, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.074, 0.515), (0.024, 0.008, 0.022))
    belt.paint(faces_of(buckle), GOLD)
    scabbard = kit.cone(belt.bm, (-0.09, 0.02, 0.5), (-0.1, 0.1, 0.33), 0.016, 0.012, 6, squash=0.5)
    belt.paint(faces_of(scabbard), LEATHER_DARK)
    pouch = kit.box(belt.bm, (0.085, 0.04, 0.48), (0.026, 0.032, 0.04))
    belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    # The short blue cape on her back, with a gold edge.
    cape = Part("cape", BLUE, cape_weights, shade=0.12)

    def cape_color(row, column):
        return GOLD if row == 3 else (BLUE_DARK if column % 3 == 1 else BLUE)

    kit.ragged_cone(cape, 0.73, 0.34, 0.112, 0.17, 12, 4, 0.86, 0.04, cape_color, BLUE_DARK, gap=math.radians(110), y_push=0.06)
    parts.append(cape)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", MAIL, f"upperarm.{side}", shade=0.08)
        verts = kit.cone(sleeve.bm, s + Vector((0, 0, 0.012)), e, 0.034, 0.027, 8)
        for f in faces_of(verts):
            if int(f.calc_center_median().z * 70) % 2:
                sleeve.paint([f], MAIL_DARK)
        parts.append(sleeve)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.06)
        kit.cone(bracer.bm, e - d * 0.005, w - d * 0.012, 0.026, 0.023, 8)
        for along in (0.05, 0.1):
            strap = kit.torus(bracer.bm, w - d * along, d, 0.026, 0.0035, 10, 3)
            bracer.paint(faces_of(strap), LEATHER_DARK)
        parts.append(bracer)

        glove = Part(f"glove.{side}", LEATHER_DARK, f"hand.{side}")
        kit.sphere(glove.bm, w + d * 0.02, (0.019, 0.018, 0.024), 8, 6)
        parts.append(glove)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.043, 0.033, 8)
        parts.append(thigh)

        # Tall boots with a turned-down top.
        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        kit.cone(boot.bm, knee - Vector((0, 0, 0.01)), ankle, 0.036, 0.031, 8)
        top = kit.cone(boot.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.04)), 0.043, 0.039, 8)
        boot.paint(faces_of(top), LEATHER)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.028, 0.024), (0.054, 0.11, 0.048))
        heel = kit.box(foot.bm, (LEG_X * sign, 0.012, 0.012), (0.052, 0.03, 0.024))
        foot.paint(faces_of(heel), LEATHER_DARK)
        parts.append(foot)
    return parts


def shield_front(x, z):
    """A point on the domed front of the shield, from an offset across its face."""
    t = clamp01(1 - (x * x + z * z) / (SHIELD_R * SHIELD_R))
    return SHIELD_C + Vector((x, -SHIELD_DOME * math.sqrt(t), z))


def shield_parts():
    shield = Part("shield", BLUE, "shield", shade=0.06)
    # The board: a flat dome at the front and a wood back.
    verts = kit.sphere(shield.bm, SHIELD_C, (SHIELD_R, SHIELD_DOME, SHIELD_R), 20, 14)
    for f in faces_of(verts):
        c = f.calc_center_median() - SHIELD_C
        if c.y > 0.002:
            shield.paint([f], WOOD)
            continue
        # The gold cross, and paint worn pale on the upper left, where the
        # hits land.
        worn = c.x * 0.6 + c.z * 0.8 > 0.1
        if abs(c.x) < 0.032 or abs(c.z) < 0.032:
            shield.paint([f], GOLD_DARK if worn else GOLD)
        elif worn:
            shield.paint([f], BLUE_FADED)
    back = kit.cone(shield.bm, SHIELD_C + Vector((0, -0.004, 0)), SHIELD_C + Vector((0, 0.012, 0)), SHIELD_R, SHIELD_R * 0.96, 20)
    shield.paint(faces_of(back), WOOD)
    rim = kit.torus(shield.bm, SHIELD_C + Vector((0, -0.002, 0)), (0, 1, 0), SHIELD_R, 0.011, 22, 4)
    shield.paint(faces_of(rim), STEEL_DARK)
    boss = kit.sphere(shield.bm, shield_front(0, 0) + Vector((0, 0.006, 0)), (0.046, 0.03, 0.046), 10, 6)
    shield.paint(faces_of(boss), STEEL)
    ring = kit.torus(shield.bm, shield_front(0, 0) + Vector((0, 0.004, 0)), (0, 1, 0), 0.048, 0.006, 12, 3)
    shield.paint(faces_of(ring), STEEL_DARK)
    # Dents: bare steel where the paint is chipped, each with a dark middle.
    for x, z, r in ((0.11, 0.08, 0.016), (-0.09, 0.11, 0.014), (0.13, -0.07, 0.018), (-0.06, -0.12, 0.015), (0.05, 0.14, 0.012), (-0.13, -0.02, 0.013), (0.08, -0.14, 0.012)):
        p = shield_front(x, z)
        spot = kit.sphere(shield.bm, p, (r, 0.004, r), 6, 4)
        shield.paint(faces_of(spot), STEEL)
        pit = kit.sphere(shield.bm, p + Vector((0, -0.003, 0)), (r * 0.45, 0.002, r * 0.45), 5, 3)
        shield.paint(faces_of(pit), STEEL_DARK)
    # The strap that the forearm goes through.
    strap = kit.box(shield.bm, SHIELD_C + Vector((0, 0.02, 0.02)), (0.12, 0.008, 0.02))
    shield.paint(faces_of(strap), LEATHER_DARK)
    return [shield]


def sword_parts():
    sword = Part("sword", STEEL, "sword", shade=0.04)
    side = SWORD.cross(X).normalized()
    tip = HAND_R + SWORD * (0.04 + BLADE)
    kit.cone(sword.bm, HAND_R + SWORD * 0.035, tip - SWORD * 0.04, 0.016, 0.014, 4, squash=0.25)
    point = kit.cone(sword.bm, tip - SWORD * 0.04, tip, 0.014, 0.001, 4, squash=0.25)
    sword.paint(faces_of(point), STEEL)
    guard = kit.cone(sword.bm, HAND_R + SWORD * 0.03 + side * 0.04, HAND_R + SWORD * 0.03 - side * 0.04, 0.007, 0.007, 4)
    sword.paint(faces_of(guard), STEEL_DARK)
    grip = kit.cone(sword.bm, HAND_R - SWORD * 0.03, HAND_R + SWORD * 0.03, 0.009, 0.009, 6)
    sword.paint(faces_of(grip), LEATHER_DARK)
    pommel = kit.sphere(sword.bm, HAND_R - SWORD * 0.038, (0.011, 0.011, 0.011), 6, 4)
    sword.paint(faces_of(pommel), STEEL_DARK)
    return [sword]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("Shieldbearer", BONES)
    parts = head_parts() + body_parts() + limb_parts() + shield_parts() + sword_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "ShieldbearerMesh")
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

    def stand(breath=0.0, sway=0.0, guard=1.0):
        """
        A wide stance, turned to her right, crouched a little behind the
        shield. The sword is low and ready. She is calm: only her eyes move.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.04 * guard - breath * 0.004)),
            "hips": t("hips", (Z, -26 * guard)),
            "spine": t("spine", (Z, -4 * guard), (X, 10 * guard + breath)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (Z, 10 * guard)),
            "head": t("head", (Z, 14 * guard + sway * 4), (X, -6 * guard + breath)),
            "upperarm.L": t("upperarm.L", (X, -6 - breath * 2)),
            "upperarm.R": t("upperarm.R", (Y, -8), (X, -4 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -10)),
            "hand.R": t("hand.R", (X, -6)),
            "thigh.L": t("thigh.L", (X, -30 * guard), (Y, -8)),
            "shin.L": t("shin.L", (X, 36 * guard)),
            "foot.L": t("foot.L", (X, -6 * guard)),
            "thigh.R": t("thigh.R", (X, 10 * guard), (Y, 10)),
            "shin.R": t("shin.R", (X, 26 * guard)),
            "foot.R": t("foot.R", (X, -30 * guard)),
            "skirt.F": t("skirt.F", (X, -14 * guard)),
            "cape": t("cape", (X, -4 - breath * 3), (Y, sway * 3)),
        }

    def kneel(breath=0.0):
        """Low HP: down on the right knee behind the planted shield."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.17 - breath * 0.004)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -4), (X, 16 + breath * 3)),
            chest=t("chest", (X, 6 + breath * 2)),
            neck=t("neck", (Z, 8), (X, 6)),
            head=t("head", (Z, 10), (X, 8 + breath * 4), (Y, -5)),
            thigh__L=t("thigh.L", (X, -78), (Y, -6)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4), (Y, 6)),
            shin__R=t("shin.R", (X, 94)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -14)),
            hand__L=t("hand.L", (X, -4)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 6)),
            forearm__R=t("forearm.R", (X, -26)),
            hand__R=t("hand.R", (X, 30)),
            skirt__F=t("skirt.F", (X, -40)),
            cape=t("cape", (X, 2)),
        )

    def recoil(base, amount=1.0):
        """The hit lands on the shield: it and the upper body go back, but the feet stay."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.04 - 0.006 * amount)),
            spine=t("spine", (Z, -4), (X, 4 - 4 * amount)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 14), (X, -12 * amount)),
            upperarm__L=t("upperarm.L", (X, -2 + 10 * amount), (Y, -6 * amount)),
            upperarm__R=t("upperarm.R", (Y, -20 * amount), (X, 8 * amount)),
            cape=t("cape", (X, 12 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.06)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 26), (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 6)),
            hand__R=t("hand.R", (X, 10)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the shield on her chest and the sword beside her."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.11)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (X, 14)),
            hand__L=t("hand.L", (X, 10)),
            upperarm__R=t("upperarm.R", (Y, 50), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, -40)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -22), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            skirt__F=t("skirt.F", (X, 20)),
            cape=t("cape", (X, -30)),
        )

    def crouch(base):
        """Down on one knee, as a summon starts and a Rebirth gets up."""
        return pose(
            kneel(),
            spine=t("spine", (Z, -4), (X, 22)),
            head=t("head", (Z, 10), (X, 16)),
        )

    def raised(base):
        """Up again, the sword high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, -18)),
            spine=t("spine", (Z, -2), (X, 2)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 8), (X, -12)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -14)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 70)),
            thigh__L=t("thigh.L", (X, -10), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            thigh__R=t("thigh.R", (X, 6), (Y, 6)),
            shin__R=t("shin.R", (X, 6)),
            foot__R=t("foot.R", (X, -12)),
            cape=t("cape", (X, 12)),
        )

    def step(front):
        """A heavy step behind the shield. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(guard=0.6),
            hips_at_loc=at("hips", (0, 0, -0.04)),
            spine=t("spine", (Z, -3), (X, 8), (Y, 3 * front)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -26)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 10)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "upperarm__R": t("upperarm.R", (Y, -8), (X, -4 - 8 * front)),
                "skirt__F": t("skirt.F", (X, -6 - 8 * front)),
                "cape": t("cape", (X, 8), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(guard=0.6),
            hips_at_loc=at("hips", (0, 0, -0.018)),
            spine=t("spine", (Z, -3), (X, 8)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -18)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 44)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 8)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                "skirt__F": t("skirt.F", (X, -8)),
                "cape": t("cape", (X, 6)),
            },
        )

    # The attack: she pulls the shield in and sinks low, then drives it
    # forward with her whole weight to push the foe back (Knockback). The
    # slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so
    # the bash lands at frame 15 of 30.
    def gather(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.07)),
            hips=t("hips", (Z, -32)),
            spine=t("spine", (Z, -8), (X, 14)),
            chest=t("chest", (Z, -6), (X, 2)),
            head=t("head", (Z, 16), (X, -10)),
            upperarm__L=t("upperarm.L", (X, 10), (Z, -6)),
            forearm__L=t("forearm.L", (X, -6)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 14)),
            forearm__R=t("forearm.R", (X, -30)),
            thigh__L=t("thigh.L", (X, -34), (Y, -8)),
            shin__L=t("shin.L", (X, 46)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, 14), (Y, 10)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, -36)),
            skirt__F=t("skirt.F", (X, -20)),
            cape=t("cape", (X, -8)),
        )

    def bash(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.12, -0.06)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -2), (X, 22)),
            chest=t("chest", (Z, 4), (X, 6)),
            head=t("head", (Z, 6), (X, -18)),
            upperarm__L=t("upperarm.L", (X, -40), (Z, 8)),
            forearm__L=t("forearm.L", (X, 10)),
            upperarm__R=t("upperarm.R", (Y, -10), (X, 20)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -64), (Y, -8)),
            shin__L=t("shin.L", (X, 60)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 32), (Y, 8)),
            shin__R=t("shin.R", (X, 12)),
            foot__R=t("foot.R", (X, -20)),
            skirt__F=t("skirt.F", (X, -30)),
            cape=t("cape", (X, -12)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, kneel(breath))
    clips.append(low)

    # A slow, heavy walk (Heavy).
    walk = Clip("walk", 28, loop=True)
    walk.key(0, step(1)).key(7, passing("R")).key(14, step(-1)).key(21, passing("L")).key(28, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, gather(stand())).key(15, bash(stand())).key(20, bash(stand()))
    attack.key(27, stand()).key(30, stand())
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
    rebirth.key(32, crouch(stand())).key(41, raised(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.19))))
    summon.key(17, raised(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "shieldbearer.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
