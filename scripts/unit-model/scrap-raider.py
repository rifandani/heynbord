"""
Scrap Raider (`orc.scrapRaider`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a thin, fast orc man with a big
grin, black spiky hair and a red headband. He carries a full sack of shiny
things over his left shoulder: a pan, spoons, a gold cup and a small bell.
He wears many stolen gold necklaces and bracelets, a spoon as an earring, a
scrap-metal plate on his right shoulder, a ragged red kilt and boots with
wraps. He holds a rusty cleaver low in his right hand, on the camera side.
Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/scrap-raider.glb`; then
`bun unit-model:pack scrap-raider` packs it for the game.

His left hand always holds the neck of the sack (IK to the `grip.L` bone of
the sack). He has Swift, so his walk is a fast run, and the sack bounces on
his back. Heroic: at rest he looks ahead, at a bigger prize, and then back
at his sack with a grin. His attack is a fast chop with the cleaver. The tip
of a hidden blade comes out of the foot of the sack: it shows Last Breath.
He has no Keyword that he uses by his own action, so he has no cast clip. He
falls on his face in the death clip, with the sack on his back.
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

SKIN = hex_color("#aab04c")
SKIN_DARK = hex_color("#7a8034")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#4a1612")
TUSK = hex_color("#f0e6c8")
HAIR = hex_color("#2a201a")
HEADBAND = hex_color("#c0362a")
HEADBAND_DARK = hex_color("#82221a")
GOLD = hex_color("#e0b04a")
GOLD_DARK = hex_color("#a07428")
SILVER = hex_color("#c8c8c4")
STEEL = hex_color("#9a968c")
STEEL_DARK = hex_color("#625e58")
RUST = hex_color("#9c5634")
LEATHER = hex_color("#6a4630")
LEATHER_DARK = hex_color("#3e2a1c")
SACK = hex_color("#9a7a52")
SACK_DARK = hex_color("#6e5638")
TROUSERS = hex_color("#6a5a3a")
CLOTH = hex_color("#b0382a")
CLOTH_DARK = hex_color("#72221a")
WOOD = hex_color("#5a3a24")

# --- Proportions ---------------------------------------------------------------

# He is thin: narrow hips and chest, long legs.
HIP_Z = 0.48
WAIST_Z = 0.56
CHEST_Z = 0.64
SHOULDER_Z = 0.72
NECK_Z = 0.75
HEAD_C = Vector((0, -0.025, 0.84))
KNEE_Z = 0.27
ANKLE_Z = 0.055
LEG_X = 0.062

# The right arm hangs with the cleaver. The left hand holds the neck of the
# sack in front of the left shoulder. These are the rest (bind) positions.
SR = Vector((-0.13, 0, SHOULDER_Z))
ER = Vector((-0.185, -0.01, 0.565))
WR = Vector((-0.205, -0.04, 0.43))
TR = WR + (WR - ER).normalized() * 0.05
GRIP_L = Vector((0.11, -0.085, 0.75))
SL = Vector((0.13, 0, SHOULDER_Z))
EL = Vector((0.2, -0.07, 0.6))
WL = GRIP_L + Vector((0.02, 0.0, -0.03))
TL = GRIP_L + Vector((-0.01, 0.0, 0.015))

# The cleaver sticks out of the right fist to the front and down.
GRIP_R = WR + (WR - ER).normalized() * 0.03
HANDLE = Vector((0, -1, -0.45)).normalized()

# The sack hangs from the left shoulder down the back.
SACK_TOP = Vector((0.12, 0.05, 0.8))
SACK_C = Vector((0.05, 0.2, 0.6))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.01, NECK_Z), (0, -0.02, 0.78), "chest"),
    ("head", (0, -0.02, 0.78), (0, -0.03, 0.95), "neck"),
    # The tails of the headband.
    ("hair", tuple(HEAD_C + Vector((0, 0.06, 0.03))), tuple(HEAD_C + Vector((0, 0.16, -0.04))), "head"),
    ("sack", tuple(SACK_TOP), tuple(SACK_C), "chest"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0.05, 0.03))), "sack"),
    # The pole that the left elbow points to: out and down.
    ("pole.L", (0.4, -0.2, 0.4), (0.4, -0.2, 0.45), "chest"),
    ("kilt.F", (0, -0.08, 0.48), (0, -0.09, 0.3), "hips"),
    ("kilt.B", (0, 0.08, 0.48), (0, 0.09, 0.3), "hips"),
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

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.67)


def kilt_weights(co):
    bone = "kilt.F" if co.y < 0 else "kilt.B"
    return blend(bone, "hips", co.z, 0.42, 0.47)


def hair_weights(co):
    return blend("head", "hair", co.y, HEAD_C.y + 0.06, HEAD_C.y + 0.09)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.058, 0.062, 0.066), 12, 9)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.028, -0.038)), (0.05, 0.042, 0.032), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.058, 0.004)), HEAD_C + Vector((0, -0.08, -0.014)), 0.016, 0.006, 5)
    # Long ears that stick out to the sides.
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.055 * sign, 0.006, 0.0)), HEAD_C + Vector((0.15 * sign, 0.03, 0.04)), 0.022, 0.002, 5, squash=0.4)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.023 * sign, -0.056, 0.014)), (0.009, 0.005, 0.007), 6, 4)
        # High brows: he is pleased with himself.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.024 * sign, -0.058, 0.03)), (0.016, 0.0, -0.003 * sign), (0, 0.006, 0), (0.0, 0.0, 0.004))
        face.paint(faces_of(brow), SKIN_DARK)
    # The big grin: a wide mouth, its corners up, with a row of teeth.
    for k, (dx, dz, ry) in enumerate(((0.0, -0.046, 0.0), (0.026, -0.04, 0.4), (-0.026, -0.04, -0.4))):
        mouth = kit.slab(face.bm, HEAD_C + Vector((dx, -0.064 + abs(dx) * 0.25, dz)), (0.016, 0, 0.012 * ry), (0, 0.006, 0), (0, 0, 0.011))
        face.paint(faces_of(mouth), MOUTH)
        teeth = kit.slab(face.bm, HEAD_C + Vector((dx, -0.069 + abs(dx) * 0.25, dz + 0.006)), (0.015, 0, 0.012 * ry), (0, 0.003, 0), (0, 0, 0.004))
        face.paint(faces_of(teeth), TUSK)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.03 * sign, -0.062, -0.058)), HEAD_C + Vector((0.034 * sign, -0.07, -0.03)), 0.008, 0.001, 5)
    parts.append(tusks)

    # Spiky black hair, the red headband and its tails.
    hair = Part("hair", HAIR, hair_weights, shade=0.1)
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.03)), (0.06, 0.062, 0.048), 10, 6)
    for k in range(9):
        a = math.radians(-70 + 140 * (k % 5) / 4)
        tilt = 0.4 + 0.5 * (k // 5)
        foot = HEAD_C + Vector((0.035 * math.sin(a), 0.03 * math.cos(a) * (1 if k < 5 else -0.4) + 0.01, 0.05))
        tip = foot + Vector((0.05 * math.sin(a), 0.05 + 0.03 * tilt, 0.05 - 0.02 * tilt))
        kit.cone(hair.bm, foot, tip, 0.02, 0.002, 4)
    band = kit.torus(hair.bm, HEAD_C + Vector((0, 0.0, 0.03)), (0, -0.2, 1), 0.062, 0.01, 14, 4)
    hair.paint(faces_of(band), HEADBAND)
    for dz, length in ((0.02, 0.12), (0.0, 0.1)):
        tail = kit.cone(hair.bm, HEAD_C + Vector((0.01, 0.07, dz + 0.02)), HEAD_C + Vector((0.02, 0.07 + length, dz - 0.05)), 0.014, 0.004, 4, squash=0.3)
        hair.paint(faces_of(tail), HEADBAND_DARK)
    parts.append(hair)

    # A spoon as an earring, on the right ear (the camera side), and gold rings on the left ear.
    rings = Part("earrings", SILVER, "head", shade=0.04)
    ear = HEAD_C + Vector((-0.1, 0.016, 0.012))
    kit.cone(rings.bm, ear, ear + Vector((0, -0.004, -0.05)), 0.004, 0.004, 4)
    kit.sphere(rings.bm, ear + Vector((0, -0.006, -0.065)), (0.014, 0.006, 0.02), 6, 4)
    for k in range(2):
        ring = kit.torus(rings.bm, HEAD_C + Vector((0.09 + k * 0.022, 0.014, 0.006 + k * 0.012)), (0, 1, 0), 0.008, 0.002, 8, 3)
        rings.paint(faces_of(ring), GOLD)
    parts.append(rings)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.01, 0.71), (0, -0.02, 0.8), 0.038, 0.034, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    kit.sphere(torso.bm, (0, 0.0, 0.665), (0.115, 0.075, 0.085), 14, 8)
    kit.cone(torso.bm, (0, 0, 0.48), (0, 0, 0.64), 0.082, 0.1, 12, squash=0.75)
    parts.append(torso)

    # Many stolen necklaces with coins, a strap, the belt with a big buckle.
    gear = Part("gear", GOLD, torso_weights, shade=0.05)
    for k, (radius, drop) in enumerate(((0.06, 0.0), (0.075, 0.025), (0.09, 0.05))):
        chain = kit.torus(gear.bm, (0, -0.02 - drop * 0.3, 0.73 - drop), (0, 0.45, 1), radius, 0.004, 16, 3)
        gear.paint(faces_of(chain), GOLD if k != 1 else SILVER)
        coin = kit.cone(gear.bm, (0.01 * (k - 1), -0.07 - drop * 0.5, 0.7 - drop * 1.3), (0.01 * (k - 1), -0.076 - drop * 0.5, 0.7 - drop * 1.3), 0.014, 0.014, 8)
        gear.paint(faces_of(coin), GOLD_DARK if k == 1 else GOLD)
    strap = kit.tube(gear.bm, [(0.1, 0.06, 0.72), (0.08, -0.07, 0.66), (0.0, -0.085, 0.58), (-0.09, -0.06, 0.48)], [0.011] * 4, 4)
    gear.paint(faces_of(strap), LEATHER)
    belt = kit.cone(gear.bm, (0, 0, 0.46), (0, 0, 0.5), 0.092, 0.09, 12, squash=0.8)
    gear.paint(faces_of(belt), LEATHER_DARK)
    buckle = kit.slab(gear.bm, (0, -0.075, 0.48), (0.026, 0, 0), (0, 0.006, 0), (0, 0, 0.02))
    gear.paint(faces_of(buckle), STEEL)
    parts.append(gear)

    # The scrap-metal plate on the right shoulder (the camera side), with rivets and rust.
    plate = Part("plate", STEEL, "upperarm.R", smooth=False, shade=0.12)
    verts = kit.sphere(plate.bm, SR + Vector((-0.012, 0, 0.012)), (0.058, 0.058, 0.05), 8, 5)
    kit.bmesh.ops.delete(plate.bm, geom=[v for v in verts if v.co.z < SR.z - 0.02], context="VERTS")
    for face in plate.bm.faces:
        if int(face.calc_center_median().y * 90) % 3 == 0:
            plate.paint([face], RUST)
    for k in range(3):
        rivet = kit.sphere(plate.bm, SR + Vector((-0.05, -0.03 + 0.03 * k, 0.012)), (0.006, 0.006, 0.006), 4, 3)
        plate.paint(faces_of(rivet), STEEL_DARK)
    parts.append(plate)

    def kilt_color(face_side, row, column):
        if face_side == "back" or row == 2:
            return CLOTH_DARK
        return LEATHER if column % 3 == 0 else CLOTH

    for name, sign in (("kilt.F", -1), ("kilt.B", 1)):
        kilt = Part(name, CLOTH, kilt_weights)

        def grid(inset, sign=sign):
            result = []
            for row in range(4):
                v = row / 3
                line = []
                for c in range(7):
                    u = lerp(-1, 1, c / 6)
                    angle = u * math.radians(75)
                    radius = lerp(0.09, 0.108, v) - inset
                    tear = 0.05 * v * ((c * 5) % 3) / 2
                    line.append((radius * math.sin(angle), sign * radius * math.cos(angle) * 0.82, lerp(0.48, 0.32 + tear, v)))
                result.append(line)
            return result

        kit.panel(kilt, grid(0.0), grid(0.007), kilt_color)
        parts.append(kilt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.006 * sign, 0, -0.01)), (0.04, 0.038, 0.04), 10, 7)
        kit.cone(upper.bm, s, e, 0.036, 0.03, 8)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.031, 0.026, 8)
        parts.append(forearm)

        # A leather bracer on the left arm; a stack of stolen gold bracelets on the right arm.
        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        if side == "R":
            for k in range(5):
                ring = kit.torus(bracer.bm, w - d * (0.012 + k * 0.016), d, 0.031, 0.006, 10, 3)
                bracer.paint(faces_of(ring), GOLD if k % 2 == 0 else SILVER)
        else:
            verts = kit.cone(bracer.bm, e + d * 0.04, w - d * 0.004, 0.034, 0.03, 8)
            for face in faces_of(verts):
                if int(((face.calc_center_median() - e).dot(d)) * 90) % 3 == 0:
                    bracer.paint([face], LEATHER_DARK)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.026, 0.024, 0.028), 8, 6)
        # A stolen ring on each fist.
        ring = kit.torus(hand.bm, w + d * 0.03 + Vector((0, -0.022, 0)), (0, -1, 0), 0.01, 0.003, 8, 3)
        hand.paint(faces_of(ring), GOLD)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.052, 0.04, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", LEATHER, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.04)), 0.042, 0.038, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 45) % 2 == 0:
                shin.paint([face], LEATHER_DARK)
        # A scrap-metal knee plate.
        pad = kit.sphere(shin.bm, knee + Vector((0, -0.026, 0.006)), (0.036, 0.02, 0.036), 8, 6)
        shin.paint(faces_of(pad), STEEL if side == "R" else LEATHER_DARK)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.045)), ankle - Vector((0, 0, 0.02)), 0.044, 0.048, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.034, 0.024), (0.07, 0.14, 0.048))
        parts.append(boot)
    return parts


def cleaver_part():
    """A big, rusty cleaver: a wooden handle and a square blade under it, its face to the side."""
    part = Part("cleaver", WOOD, "hand.R", shade=0.04)
    kit.cone(part.bm, GRIP_R - HANDLE * 0.04, GRIP_R + HANDLE * 0.05, 0.012, 0.012, 6)
    start = GRIP_R + HANDLE * 0.05
    down = HANDLE.cross(X).normalized()
    if down.z > 0:
        down = -down
    length, width = 0.18, 0.09

    def grid(depth):
        result = []
        for row in range(3):
            v = row / 2
            line = []
            for column in range(4):
                u = column / 3
                # The spine of the blade is straight; the edge bulges a little.
                drop = width * v * (1 + 0.15 * math.sin(math.pi * u))
                line.append(start + HANDLE * (length * u) + down * (drop - 0.012) + X * depth)
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if row == 1:
            return STEEL
        return RUST if (column + row) % 2 == 0 else STEEL_DARK

    edges = kit.panel(part, grid(0.006), grid(-0.006), color_of)
    part.paint(edges, STEEL_DARK)
    hole = kit.cone(part.bm, start + HANDLE * 0.15 + down * 0.012 - X * 0.008, start + HANDLE * 0.15 + down * 0.012 + X * 0.008, 0.008, 0.008, 6)
    part.paint(faces_of(hole), LEATHER_DARK)
    return [part]


def sack_part():
    """The full sack of shiny things, its neck over the left shoulder, and the hidden blade."""
    part = Part("sack", SACK, "sack", shade=0.14)
    body = kit.sphere(part.bm, SACK_C, (0.15, 0.125, 0.17), 12, 9)
    for face in faces_of(body):
        c = face.calc_center_median()
        # A few seams and folds.
        if int(c.x * 40 + c.z * 60) % 9 == 0:
            part.paint([face], SACK_DARK)
    # A patch on the side.
    patch = kit.slab(part.bm, SACK_C + Vector((-0.12, 0.04, -0.03)), (0.003, 0, 0), (0, 0.045, 0), (0, 0, 0.04))
    part.paint(faces_of(patch), SACK_DARK)
    neck = kit.tube(part.bm, [GRIP_L + Vector((0, -0.01, -0.02)), GRIP_L + Vector((0.01, 0.04, 0.05)), SACK_TOP + Vector((0, 0.05, 0.0)), SACK_C + Vector((0.04, -0.02, 0.13))], [0.024, 0.03, 0.04, 0.07], 8)
    part.paint(faces_of(neck), SACK_DARK)
    tie = kit.torus(part.bm, GRIP_L + Vector((0.004, 0.02, 0.02)), (0, 0.6, 0.8), 0.026, 0.006, 8, 3)
    part.paint(faces_of(tie), LEATHER_DARK)
    # The shiny things that stick out of a tear in the top: a pan, a cup and spoons.
    top = SACK_C + Vector((-0.02, 0.05, 0.15))
    pan = kit.cone(part.bm, top + Vector((-0.03, 0.04, 0.02)), top + Vector((-0.036, 0.055, 0.03)), 0.06, 0.06, 12)
    part.paint(faces_of(pan), STEEL_DARK)
    handle = kit.cone(part.bm, top + Vector((-0.03, 0.0, 0.0)), top + Vector((-0.06, -0.03, 0.11)), 0.009, 0.008, 5)
    part.paint(faces_of(handle), WOOD)
    cup = kit.cone(part.bm, top + Vector((0.06, 0.0, 0.0)), top + Vector((0.07, 0.0, 0.06)), 0.018, 0.032, 8)
    part.paint(faces_of(cup), GOLD)
    for k, dx in enumerate((0.0, 0.03)):
        spoon = kit.cone(part.bm, top + Vector((dx, -0.02, 0.0)), top + Vector((dx + 0.02, -0.04, 0.08)), 0.004, 0.004, 4)
        part.paint(faces_of(spoon), SILVER)
        bowl = kit.sphere(part.bm, top + Vector((dx + 0.022, -0.042, 0.09)), (0.012, 0.006, 0.016), 6, 4)
        part.paint(faces_of(bowl), SILVER if k == 0 else GOLD)
    # A small bell on a string at the side of the sack, on the camera side.
    bell_at = SACK_C + Vector((-0.13, 0.0, -0.05))
    string = kit.cone(part.bm, bell_at + Vector((0.01, 0, 0.08)), bell_at + Vector((0, 0, 0.02)), 0.003, 0.003, 4)
    part.paint(faces_of(string), LEATHER_DARK)
    bell = kit.cone(part.bm, bell_at + Vector((0, 0, 0.025)), bell_at - Vector((0, 0, 0.012)), 0.012, 0.026, 8)
    part.paint(faces_of(bell), GOLD)
    # The tip of a hidden blade comes out of the foot of the sack (Last Breath).
    blade = kit.cone(part.bm, SACK_C + Vector((-0.04, 0.08, -0.13)), SACK_C + Vector((-0.06, 0.16, -0.2)), 0.02, 0.001, 4, squash=0.3)
    part.paint(faces_of(blade), SILVER)
    return [part]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("ScrapRaider", BONES)
    parts = head_parts() + body_parts() + limb_parts() + cleaver_part() + sack_part()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "ScrapRaiderMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends the left elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the left arm: the hand always holds the neck of the sack."""
    ik = rig.pose.bones["forearm.L"].constraints.new("IK")
    ik.name = "IK"
    ik.target = rig
    ik.subtarget = "grip.L"
    ik.pole_target = rig
    ik.pole_subtarget = "pole.L"
    ik.pole_angle = math.radians(POLE_ANGLE)
    ik.chain_count = 2
    return {}


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

    def stand(breath=0.0, look=0.0, sway=0.0, twirl=0.0):
        """
        The idle: light on his feet, the right foot back, ready to run. The
        cleaver hangs low. `look` turns his head back to the sack, and
        `twirl` turns the cleaver in his hand.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.03 - breath * 0.004)),
            "hips": t("hips", (Z, -6), (Y, sway * 2)),
            "spine": t("spine", (X, 10 + breath)),
            "chest": t("chest", (X, 2 - breath * 2), (Z, -4 + look * 8)),
            "neck": t("neck", (X, -10), (Z, look * 20)),
            "head": t("head", (X, -6 + breath * 2), (Z, -6 + look * 50 + sway * 3), (Y, look * -6)),
            "hair": t("hair", (X, -4 - breath * 4), (Y, sway * 6)),
            "sack": t("sack", (X, -2 * breath), (Y, sway * 2)),
            "upperarm.R": t("upperarm.R", (X, -16), (Y, 14)),
            "forearm.R": t("forearm.R", (X, -30)),
            "hand.R": t("hand.R", (X, 10 + twirl * 40)),
            "thigh.L": t("thigh.L", (X, -24), (Y, -6)),
            "shin.L": t("shin.L", (X, 22)),
            "foot.L": t("foot.L", (X, 0)),
            "thigh.R": t("thigh.R", (X, 14), (Y, 8)),
            "shin.R": t("shin.R", (X, 24)),
            "foot.R": t("foot.R", (X, -34)),
            "kilt.F": t("kilt.F", (X, -10)),
            "kilt.B": t("kilt.B", (X, 8 + sway * 4)),
            "forearm.L/IK": 1.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, bent under the sack, but he does not let go of it."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -0.17 - breath * 0.004)),
            spine=t("spine", (X, 30 + breath * 3)),
            chest=t("chest", (X, 12 + breath * 2)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -2 + breath * 4), (Z, -10)),
            sack=t("sack", (X, -8)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, 10)),
            forearm__R=t("forearm.R", (X, -50)),
            hand__R=t("hand.R", (X, 60)),
            thigh__L=t("thigh.L", (X, -78), (Y, -6)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -40)),
            kilt__F=t("kilt.F", (X, -40)),
        )

    def recoil(base, amount=1.0):
        """A hit jolts him back, and the sack swings."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04 * amount, -0.04)),
            spine=t("spine", (X, -4 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -20 * amount), (Z, -10)),
            sack=t("sack", (X, 16 * amount), (Y, -6 * amount)),
            upperarm__R=t("upperarm.R", (X, -40 * amount), (Y, 40 * amount)),
            kilt__F=t("kilt.F", (X, -30 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.02, -0.06)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 20)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 10)),
            sack=t("sack", (X, -16)),
            thigh__L=t("thigh.L", (X, -40)),
            shin__L=t("shin.L", (X, 40)),
            thigh__R=t("thigh.R", (X, 10)),
            shin__R=t("shin.R", (X, 30)),
            upperarm__R=t("upperarm.R", (X, -50), (Y, 30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on his face, the sack on his back and the cleaver out to the side."""
        return pose(
            base,
            root=t("root", (X, 84 - bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0), (X, 0)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -20), (Z, -40)),
            sack=t("sack", (X, -10 + bounce), (Y, 8)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, 30)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 0)),
            thigh__L=t("thigh.L", (X, 0), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 6), (Y, 6)),
            shin__R=t("shin.R", (X, 50)),
            foot__R=t("foot.R", (X, 30)),
            kilt__F=t("kilt.F", (X, 0)),
            kilt__B=t("kilt.B", (X, 50)),
        )

    def crouch(base):
        """Very low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.17)),
            spine=t("spine", (X, 34)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -10)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -24)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 106)),
            foot__R=t("foot.R", (X, -52)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, 10)),
            kilt__F=t("kilt.F", (X, -50)),
        )

    def show_off(base):
        """Up again with a grin, the cleaver held high: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.02)),
            spine=t("spine", (X, 0)),
            chest=t("chest", (X, -8)),
            head=t("head", (X, -14), (Z, -10)),
            sack=t("sack", (X, 6)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, 30)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, -30)),
        )

    def step(front, lift=0.0):
        """A fast run with long strides. `front` is 1 for the left foot, -1 for the right; `lift` is in the air."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.0, -0.09 + lift * 0.04)),
            hips=t("hips", (Z, -6 * front), (X, 8)),
            spine=t("spine", (X, 20), (Y, -3 * front)),
            chest=t("chest", (X, 6), (Z, -8 * front)),
            head=t("head", (X, -16), (Z, 4 * front)),
            hair=t("hair", (X, 30)),
            sack=t("sack", (X, 10 * lift - 4), (Y, 4 * front)),
            upperarm__R=t("upperarm.R", (X, -10 + 40 * front), (Y, 12)),
            forearm__R=t("forearm.R", (X, -50)),
            kilt__F=t("kilt.F", (X, -40)),
            kilt__B=t("kilt.B", (X, 34)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -64 + lift * 10)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 40 + lift * 40)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 26 - lift * 10)),
                f"shin__{back}": t(f"shin.{back}", (X, 50 + lift * 30)),
                f"foot__{back}": t(f"foot.{back}", (X, -20)),
            },
        )

    # The attack: he lifts the cleaver high and chops down at the target.
    # The slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts),
    # so the chop lands at frame 15 of 30.
    def raise_cleaver(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.04)),
            hips=t("hips", (Z, -14)),
            spine=t("spine", (X, 0), (Z, -10)),
            chest=t("chest", (X, -8), (Z, -12)),
            head=t("head", (X, -10), (Z, 10)),
            sack=t("sack", (X, 6)),
            upperarm__R=t("upperarm.R", (X, -160), (Y, 30)),
            forearm__R=t("forearm.R", (X, -60)),
            hand__R=t("hand.R", (X, -40)),
        )

    def chop(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.1, -0.08)),
            hips=t("hips", (Z, 6), (X, 6)),
            spine=t("spine", (X, 26), (Z, 8)),
            chest=t("chest", (X, 12), (Z, 10)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -16)),
            sack=t("sack", (X, -14)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, 8)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 40)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 60)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
            kilt__F=t("kilt.F", (X, -40)),
            kilt__B=t("kilt.B", (X, 40)),
        )

    clips = []
    # The idle: he looks ahead, then back at his sack with a grin, and twirls the cleaver.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, look, sway, twirl in (
        (0, 0, 0, 0, 0),
        (10, 0.6, 0, 1, 0),
        (18, 1, 1, 0, 0),
        (28, 0.6, 1, -1, 0),
        (34, 0.3, 0, 0, 0),
        (38, 0.2, 0, 0, 1),
        (42, 0.1, 0, 0, -0.2),
        (48, 0, 0, 0, 0),
    ):
        idle.key(frame, stand(breath, look, sway, twirl))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    # Swift: a fast run.
    walk = Clip("walk", 16, loop=True)
    walk.key(0, step(1)).key(4, step(1, 1)).key(8, step(-1)).key(12, step(-1, 1)).key(16, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, raise_cleaver(stand())).key(15, chop(stand())).key(19, chop(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(13, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, show_off(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.04, -0.15))))
    summon.key(17, show_off(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "scrap-raider.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
