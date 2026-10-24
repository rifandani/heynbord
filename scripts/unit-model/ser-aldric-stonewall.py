"""
Ser Aldric Stonewall (`human.serAldricStonewall`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an older knight with a scarred
bald head and a short grey beard, mended plate under a blue tabard with gold
trim, a blue and gold tower shield on the left arm and a short sword low in
the right hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/ser-aldric-stonewall.glb`; then
`bun unit-model:pack ser-aldric-stonewall` packs it for the game.

The Battle camera sees the right side of a player Unit, so at rest the knight
turns to his right: the shield then faces the camera, and the sword is
visible beside it.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#d9a07a")
SCAR = hex_color("#a4574a")
BEARD = hex_color("#cfcac0")
BROW = hex_color("#9a958b")
EYES = hex_color("#1e1a16")
STEEL = hex_color("#9da2a7")
STEEL_DARK = hex_color("#6b7178")
MAIL = hex_color("#777b80")
BLUE = hex_color("#2d54a3")
BLUE_DARK = hex_color("#1f3b78")
GOLD = hex_color("#e3b54a")
LEATHER = hex_color("#6e4024")
WOOD = hex_color("#5e3d22")
GRIP = hex_color("#2c4c96")
GEM = hex_color("#ff8a1e")
SHAFT = hex_color("#7a5636")
FLETCH = hex_color("#d8cfbb")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.45
WAIST_Z = 0.53
CHEST_Z = 0.63
SHOULDER_Z = 0.72
NECK_Z = 0.76
HEAD_C = Vector((0, -0.006, 0.865))
KNEE_Z = 0.26
ANKLE_Z = 0.055
LEG_X = 0.066

# The left arm holds the shield across the body; the right arm hangs with
# the sword. These are the rest (bind) positions.
SL = Vector((0.135, 0, SHOULDER_Z))
EL = Vector((0.2, -0.085, 0.565))
WL = Vector((0.065, -0.115, 0.56))
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.135, 0, SHOULDER_Z))
ER = Vector((-0.175, 0.01, 0.56))
WR = Vector((-0.185, -0.03, 0.43))
DR = (WR - ER).normalized()
TR = WR + DR * 0.05
HAND_R = WR + DR * 0.028

# The tower shield: its front faces -Y at rest. `u` goes across it (-1 is the
# right edge of the figure), `v` goes up it (0 is the bottom).
SHIELD_X = 0.075
SHIELD_Y = -0.158
SHIELD_BOTTOM = 0.165
SHIELD_HALF = 0.155
SHIELD_HEIGHT = 0.575
SHIELD_ARCH = 0.025
SHIELD_BULGE = 0.018
SHIELD_THICK = 0.016
GRIP_L = WL + (WL - EL).normalized() * 0.026

# At rest the sword hangs nearly straight down by the right leg.
BLADE = Vector((0.0, -0.22, -1.0)).normalized()
SWORD_LENGTH = 0.32

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.8), "chest"),
    ("head", (0, 0, 0.8), (0, 0, 0.97), "neck"),
    ("tabard.F", (0, -0.085, 0.49), (0, -0.09, 0.3), "hips"),
    ("tabard.B", (0, 0.085, 0.49), (0, 0.1, 0.28), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.09, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("shield", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.1))), "hand.L"),
    ("sword", tuple(HAND_R), tuple(HAND_R + BLADE * 0.1), "hand.R"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.49, 0.57)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def tabard_weights(bone):
    def weights(co):
        return blend(bone, "hips", co.z, 0.4, 0.48)

    return weights


# --- Parts ---------------------------------------------------------------------


def on_head(across, up, lift=1.02):
    """A point on the head, `across` degrees to the left of the front and `up` degrees up."""
    a, b = math.radians(across), math.radians(up)
    return HEAD_C + Vector((0.067 * math.sin(a) * math.cos(b), -0.072 * math.cos(a) * math.cos(b), 0.082 * math.sin(b))) * lift


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.067, 0.072, 0.082), 14, 10)
    # A strong nose and small ears.
    kit.cone(head.bm, (0, -0.07, 0.868), (0, -0.088, 0.852), 0.014, 0.004, 5)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.066 * sign, 0.004, 0.86), (0.012, 0.016, 0.02), 6, 5)
    parts.append(head)

    # The scar: a thin line over the left brow, up onto the scalp.
    scar = Part("scar", SCAR, "head", shade=0)
    path = [on_head(lerp(32, 8, i / 4), lerp(8, 52, i / 4)) for i in range(5)]
    kit.tube(scar.bm, path, [0.0035, 0.0045, 0.0045, 0.004, 0.003], 4)
    parts.append(scar)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.026 * sign, -0.064, 0.872), (0.009, 0.006, 0.008), 6, 5)
    parts.append(eyes)

    brows = Part("brows", BROW, "head", shade=0)
    for sign in (1, -1):
        kit.box(brows.bm, (0.028 * sign, -0.064, 0.888), (0.028, 0.012, 0.008))
    parts.append(brows)

    beard = Part("beard", BEARD, "head", shade=0.1)
    verts = kit.sphere(beard.bm, (0, -0.028, 0.818), (0.066, 0.056, 0.056), 12, 8)
    # The upper half of the beard sits inside the face; cut the top away.
    kit.bmesh.ops.delete(beard.bm, geom=[v for v in verts if v.co.z > 0.85], context="VERTS")
    # The beard goes up the jaw to the ears.
    for sign in (1, -1):
        kit.sphere(beard.bm, (0.05 * sign, -0.02, 0.84), (0.022, 0.034, 0.03), 8, 6)
    # The moustache.
    kit.cone(beard.bm, (0.038, -0.062, 0.836), (-0.038, -0.062, 0.836), 0.01, 0.01, 6, squash=0.7)
    parts.append(beard)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.75), (0, 0, 0.82), 0.032, 0.03, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    tabard = Part("tabard", BLUE, torso_weights)
    verts = kit.cone(tabard.bm, (0, 0, 0.5), (0, 0, 0.725), 0.096, 0.112, 14, squash=0.74)
    # The gold lion on the chest, as a simple badge.
    for face in faces_of(verts):
        c = face.calc_center_median()
        if c.y < -0.05 and abs(c.x) < 0.035 and 0.585 < c.z < 0.68:
            tabard.paint([face], GOLD)
    parts.append(tabard)

    mantle = Part("mantle", BLUE_DARK, "chest")
    verts = kit.cone(mantle.bm, (0, 0.004, 0.68), (0, 0.004, 0.78), 0.122, 0.05, 14, caps=False, squash=0.8)
    mantle.paint({f for v in verts if v.co.z < 0.69 for f in v.link_faces}, GOLD)
    kit.torus(mantle.bm, (0, 0.002, 0.775), (0, 0.15, 1), 0.048, 0.017, 12, 5)
    parts.append(mantle)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.485), (0, 0, 0.52), 0.1, 0.098, 14, squash=0.8)
    buckle = kit.cone(belt.bm, (0, -0.077, 0.502), (0, -0.087, 0.502), 0.02, 0.018, 8)
    belt.paint(faces_of(buckle), GOLD)
    gem = kit.sphere(belt.bm, (0, -0.088, 0.502), (0.009, 0.006, 0.009), 6, 4)
    belt.paint(faces_of(gem), GEM)
    parts.append(belt)

    fauld = Part("fauld", STEEL, "hips")
    verts = kit.cone(fauld.bm, (0, 0, 0.4), (0, 0, 0.49), 0.104, 0.096, 14, squash=0.8)
    fauld.paint({f for v in verts if v.co.z < 0.41 for f in v.link_faces}, STEEL_DARK)
    parts.append(fauld)

    parts.append(tabard_panel("tabard.front", "tabard.F", -1))
    parts.append(tabard_panel("tabard.back", "tabard.B", 1))
    return parts


def tabard_panel(name, bone, side):
    """A cloth panel of the tabard below the belt, with a ragged hem. `side` is -1 for the front."""
    part = Part(name, BLUE, tabard_weights(bone))
    columns, rows = 6, 5
    half = 0.07 if side < 0 else 0.085
    hem = 0.2 if side < 0 else 0.17

    def grid(inset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = lerp(-1, 1, column / columns)
                # A ragged hem: every other point is a little higher.
                ragged = 0.025 * (column % 2) * v + 0.012 * abs(u) * v
                z = lerp(0.49, hem + ragged, v)
                x = u * lerp(half, half * 1.25, v)
                y = side * (lerp(0.078, 0.092, v) + 0.012 * (1 - u * u) - inset)
                line.append((x, y, z))
            result.append(line)
        return result

    trim = {0, columns - 1}

    def color_of(face_side, row, column):
        if face_side == "back":
            return BLUE_DARK
        if column in trim or row == rows - 1:
            return GOLD
        return BLUE

    panel(part, grid(0.0), grid(0.007), color_of)
    return part


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        pauldron = Part(f"pauldron.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(pauldron.bm, s + Vector((0.012 * sign, 0, 0.008)), (0.06, 0.056, 0.046), 12, 8)
        pauldron.paint({f for v in verts if v.co.z < s.z - 0.02 for f in v.link_faces}, STEEL_DARK)
        # The gold rosette on the outside of the pauldron.
        rosette = kit.cone(pauldron.bm, s + Vector((0.066 * sign, 0, 0.004)), s + Vector((0.078 * sign, 0, 0.004)), 0.018, 0.012, 8)
        pauldron.paint(faces_of(rosette), GOLD)
        parts.append(pauldron)

        upper = Part(f"rerebrace.{side}", STEEL, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.038, 0.034, 8)
        parts.append(upper)

        elbow = Part(f"elbow.{side}", MAIL, f"forearm.{side}", shade=0.05)
        kit.sphere(elbow.bm, e, (0.035, 0.035, 0.035), 8, 6)
        parts.append(elbow)

        vambrace = Part(f"vambrace.{side}", STEEL, f"forearm.{side}")
        verts = kit.cone(vambrace.bm, e + d * 0.01, w, 0.034, 0.029, 8)
        vambrace.paint({f for v in verts if (v.co - w).length < 0.015 for f in v.link_faces}, STEEL_DARK)
        parts.append(vambrace)

        gauntlet = Part(f"gauntlet.{side}", STEEL_DARK, f"hand.{side}", shade=0.05)
        kit.sphere(gauntlet.bm, w + d * 0.026, (0.024, 0.022, 0.028), 8, 6)
        parts.append(gauntlet)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"cuisse.{side}", STEEL, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.056, 0.044, 10)
        parts.append(thigh)

        poleyn = Part(f"poleyn.{side}", STEEL_DARK, f"shin.{side}", shade=0.05)
        kit.sphere(poleyn.bm, knee + Vector((0, -0.014, 0)), (0.042, 0.038, 0.036), 8, 6)
        parts.append(poleyn)

        greave = Part(f"greave.{side}", STEEL, f"shin.{side}")
        kit.cone(greave.bm, knee, ankle, 0.045, 0.036, 10)
        parts.append(greave)

        sabaton = Part(f"sabaton.{side}", STEEL_DARK, f"foot.{side}", shade=0.05)
        kit.box(sabaton.bm, (LEG_X * sign, -0.03, 0.028), (0.07, 0.13, 0.056))
        kit.cone(sabaton.bm, (LEG_X * sign, -0.09, 0.02), (LEG_X * sign, -0.112, 0.016), 0.03, 0.012, 6, squash=0.5)
        parts.append(sabaton)
    return parts


def shield_point(u, v, depth=0.0):
    """A point on the shield face; `depth` goes back into the shield."""
    curve = 1 - u * u
    z = SHIELD_BOTTOM + v * (SHIELD_HEIGHT + SHIELD_ARCH * curve)
    return Vector((SHIELD_X + u * SHIELD_HALF, SHIELD_Y - SHIELD_BULGE * curve + depth, z))


def shield_parts():
    parts = []
    shield = Part("shield", BLUE, "shield", shade=0.06)
    columns, rows = 12, 20

    def grid(depth):
        return [
            [shield_point(lerp(-1, 1, c / columns), r / rows, depth) for c in range(columns + 1)]
            for r in range(rows + 1)
        ]

    def color_of(face_side, row, column):
        u = lerp(-1, 1, (column + 0.5) / columns)
        v = (row + 0.5) / rows
        if face_side == "back":
            # Wood, with the leather straps of the grip.
            return LEATHER if abs(v - 0.68) < 0.04 or abs(v - 0.5) < 0.03 else WOOD
        if column in (0, columns - 1) or row in (0, rows - 1):
            return GOLD
        # The gold tower: the walls, the battlements and a dark door.
        if abs(u) < 0.36 and 0.42 < v < 0.72:
            return BLUE_DARK if abs(u) < 0.1 and v < 0.53 else GOLD
        if abs(u) < 0.36 and 0.72 < v < 0.8 and column % 2 == 0:
            return GOLD
        return BLUE

    edges = panel(shield, grid(0.0), grid(SHIELD_THICK), color_of)
    shield.paint(edges, GOLD)

    # The lion door knocker that someone painted on the shield, and its ring.
    lion = shield_point(0, 0.25) + Vector((0, -0.012, 0))
    head = kit.sphere(shield.bm, lion, (0.028, 0.014, 0.026), 8, 6)
    ring = kit.torus(shield.bm, lion + Vector((0, -0.006, -0.032)), (0, 1, 0), 0.022, 0.0045, 12, 4)
    shield.paint(faces_of(head) | faces_of(ring), GOLD)
    # A gold fleur under the tower.
    fleur = shield_point(0, 0.37) + Vector((0, -0.004, 0))
    for dx, dz, tip in ((0, 0.0, (0, 0.035)), (0.018, -0.006, (0.024, 0.02)), (-0.018, -0.006, (-0.024, 0.02))):
        base = fleur + Vector((dx, 0, dz))
        verts = kit.cone(shield.bm, base, base + Vector((tip[0], -0.002, tip[1])), 0.008, 0.002, 4, squash=0.5)
        shield.paint(faces_of(verts), GOLD)
    # The orange gem of a Legendary card, at the top of the shield.
    gem = kit.sphere(shield.bm, shield_point(0, 0.9) + Vector((0, -0.01, 0)), (0.016, 0.01, 0.018), 8, 5)
    shield.paint(faces_of(gem), GEM)
    parts.append(shield)

    # Arrows broke on the shield and stuck in it (Iron Guard).
    arrows = Part("arrows", SHAFT, "shield", shade=0)
    for u, v, out in (
        (0.62, 0.84, Vector((0.35, -0.85, 0.4))),
        (-0.55, 0.62, Vector((-0.45, -0.8, 0.3))),
        (0.48, 0.32, Vector((0.4, -0.85, -0.1))),
    ):
        base = shield_point(u, v) + Vector((0, 0.004, 0))
        out = out.normalized()
        tip = base + out * 0.12
        kit.tube(arrows.bm, [base, tip], [0.005, 0.005], 4)
        fletch = kit.cone(arrows.bm, tip - out * 0.045, tip + out * 0.004, 0.015, 0.006, 3)
        arrows.paint(faces_of(fletch), FLETCH)
    parts.append(arrows)
    return parts


def sword_parts():
    sword = Part("sword", STEEL, "sword", shade=0.04)
    guard_dir = DR.cross(BLADE).normalized()
    if guard_dir.length < 0.5:
        guard_dir = X
    guard = HAND_R + BLADE * 0.034
    tip = HAND_R + BLADE * SWORD_LENGTH
    # A broad blade: four sides, flattened.
    kit.cone(sword.bm, guard, tip - BLADE * 0.03, 0.017, 0.014, 4, squash=0.22)
    kit.cone(sword.bm, tip - BLADE * 0.03, tip, 0.014, 0.001, 4, squash=0.22)
    cross = kit.cone(sword.bm, guard - guard_dir * 0.05, guard + guard_dir * 0.05, 0.008, 0.008, 6)
    sword.paint(faces_of(cross), GOLD)
    grip = kit.cone(sword.bm, HAND_R - BLADE * 0.045, guard, 0.009, 0.009, 6)
    sword.paint(faces_of(grip), GRIP)
    pommel = kit.sphere(sword.bm, HAND_R - BLADE * 0.052, (0.013, 0.013, 0.013), 8, 6)
    sword.paint(faces_of(pommel), GOLD)
    return [sword]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("SerAldricStonewall", BONES)
    parts = head_parts() + body_parts() + limb_parts() + shield_parts() + sword_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "SerAldricStonewallMesh")
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
        The guard: turned to his right with the left foot forward, he leans
        a little into the shield. The sword is low and ready.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -22 * guard)),
            "spine": t("spine", (Z, -6 * guard), (X, 4 + breath)),
            "chest": t("chest", (X, -1 - breath * 2)),
            "neck": t("neck", (Z, 12 * guard)),
            "head": t("head", (Z, 12 * guard + sway * 3), (X, 2 + breath)),
            "upperarm.L": t("upperarm.L", (X, -4 - breath * 2)),
            "upperarm.R": t("upperarm.R", (Y, -8), (X, -8 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -22)),
            "hand.R": t("hand.R", (X, -38)),
            "thigh.L": t("thigh.L", (X, -16), (Y, -3)),
            "shin.L": t("shin.L", (X, 20)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 12), (Y, 3)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -20)),
            "tabard.F": t("tabard.F", (X, -10)),
            "tabard.B": t("tabard.B", (X, -4 - breath * 2), (Y, sway * 3)),
        }

    def kneel(breath=0.0):
        """Low HP: down on the right knee behind the planted shield, the sword across the knee."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.2 - breath * 0.004)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -4), (X, 14 + breath * 3)),
            chest=t("chest", (X, 6 + breath * 2)),
            neck=t("neck", (Z, 10), (X, 6)),
            head=t("head", (Z, 10), (X, 10 + breath * 4), (Y, -5)),
            thigh__L=t("thigh.L", (X, -78), (Y, -4)),
            shin__L=t("shin.L", (X, 78)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4), (Y, 4)),
            shin__R=t("shin.R", (X, 92)),
            foot__R=t("foot.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -26)),
            hand__L=t("hand.L", (X, -8)),
            upperarm__R=t("upperarm.R", (Y, -12), (X, 10)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, -70)),
            tabard__F=t("tabard.F", (X, -30)),
            tabard__B=t("tabard.B", (X, 30)),
        )

    def recoil(base, amount=1.0):
        """A hit pushes the shield and the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (Z, -6), (X, -8 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 12), (X, -12 * amount)),
            upperarm__L=t("upperarm.L", (X, -16 * amount), (Y, -6 * amount)),
            upperarm__R=t("upperarm.R", (Y, -22 * amount), (X, 12 * amount)),
            tabard__F=t("tabard.F", (X, -18 * amount)),
            tabard__B=t("tabard.B", (X, 16 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            upperarm__L=t("upperarm.L", (X, 30), (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 6)),
            hand__R=t("hand.R", (X, 10)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the shield on his chest and the sword beside him."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.06)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (X, 14)),
            hand__L=t("hand.L", (X, 10)),
            upperarm__R=t("upperarm.R", (Y, 50), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, -70)),
            thigh__L=t("thigh.L", (X, -8), (Y, -6)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -22), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            tabard__F=t("tabard.F", (X, 30)),
            tabard__B=t("tabard.B", (X, -60)),
        )

    def crouch(base):
        """Down on one knee, as a summon starts and a Rebirth gets up."""
        return pose(
            kneel(),
            spine=t("spine", (Z, -4), (X, 22)),
            head=t("head", (Z, 10), (X, 18)),
        )

    def heroic(base):
        """Up again, the sword high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.004)),
            hips=t("hips", (Z, -14)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 8), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -145), (Y, -16)),
            forearm__R=t("forearm.R", (X, -12)),
            hand__R=t("hand.R", (X, 30)),
            tabard__B=t("tabard.B", (X, 10)),
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(guard=0.5),
            hips_at_loc=at("hips", (0, 0, -0.018)),
            spine=t("spine", (Z, -3), (X, 6)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -26)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
                "upperarm__R": t("upperarm.R", (Y, -8), (X, -8 - 12 * front)),
                "tabard__F": t("tabard.F", (X, -4 - 8 * front)),
                "tabard__B": t("tabard.B", (X, 10), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(guard=0.5),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (Z, -3), (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -14)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 44)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "tabard__F": t("tabard.F", (X, -6)),
                "tabard__B": t("tabard.B", (X, 6)),
            },
        )

    # The attack: the sword goes back to the hip, then a lunge and a thrust
    # past the edge of the shield. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the thrust lands at frame 15 of 30.
    def windup(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.03)),
            hips=t("hips", (Z, -34)),
            spine=t("spine", (Z, -14), (X, 8)),
            chest=t("chest", (Z, -8)),
            head=t("head", (Z, 30), (X, 4)),
            upperarm__L=t("upperarm.L", (X, -14)),
            upperarm__R=t("upperarm.R", (X, 34), (Y, -14)),
            forearm__R=t("forearm.R", (X, -84)),
            hand__R=t("hand.R", (X, -12)),
            thigh__L=t("thigh.L", (X, -24), (Y, -3)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, 16), (Y, 3)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -38)),
        )

    def thrust(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.035, -0.03)),
            hips=t("hips", (Z, -16)),
            spine=t("spine", (Z, -2), (X, 10)),
            chest=t("chest", (Z, 4), (X, 2)),
            head=t("head", (Z, 12), (X, -2)),
            upperarm__L=t("upperarm.L", (X, 8), (Y, 8)),
            upperarm__R=t("upperarm.R", (X, -76), (Y, -10)),
            forearm__R=t("forearm.R", (X, -6)),
            hand__R=t("hand.R", (X, -8)),
            thigh__L=t("thigh.L", (X, -40), (Y, -3)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 24), (Y, 3)),
            shin__R=t("shin.R", (X, 8)),
            foot__R=t("foot.R", (X, -30)),
            tabard__F=t("tabard.F", (X, -8)),
            tabard__B=t("tabard.B", (X, 20)),
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

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, windup(stand())).key(15, thrust(stand())).key(19, thrust(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    # Rally: the sword high, a call to the Lane.
    cast = Clip("cast", 24)
    call = pose(heroic(stand()), head=t("head", (Z, 14), (X, -20)))
    cast.key(0, stand()).key(6, call).key(10, pose(call, hips_at_loc=at("hips", (0, 0, 0.004)))).key(16, call).key(24, stand())
    clips.append(cast)

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
    rebirth.key(32, crouch(stand())).key(41, heroic(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.17))))
    summon.key(17, heroic(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "ser-aldric-stonewall.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
