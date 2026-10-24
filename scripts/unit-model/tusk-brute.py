"""
Tusk Brute (`orc.tuskBrute`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a very big, very strong orc
woman with large tusks and a roar. She has long dark hair, rough iron
shoulder plates with spikes, a brown leather top, a fur belt, a ragged red
loincloth, leather wraps on her shins and a spiked iron bracer on her right
arm. She holds a big wooden club with iron bands and spikes in her right
hand, on the camera side. Run it in Blender (see `unit_model_kit.py`). It
writes `apps/web/art/units/raw/tusk-brute.glb`; then
`bun unit-model:pack tusk-brute` packs it for the game.

She walks through doors: the broken door is still round her, as a collar of
planks with a hole where she went through. The collar tilts down to her
right, so the camera sees its face, the iron hinges and the splinters. The
`door` bone carries it: it bounces in each clip, and it slides off in the
death clip. The `jaw` bone opens her mouth for the roar. Her walk is a
heavy stomp. Heroic: at rest she leans forward, ready for the next fight.
Her attack is a big overhead smash with the club. She has no Keyword that
she uses by her own action, so she has no cast clip.
"""

import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#a6ac48")
SKIN_DARK = hex_color("#767c32")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#4a1612")
TUSK = hex_color("#f2e8ca")
TUSK_DARK = hex_color("#c4b690")
HAIR = hex_color("#3a2618")
HAIR_DARK = hex_color("#22160e")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#3e2818")
IRON = hex_color("#5c5650")
IRON_DARK = hex_color("#38342f")
RUST = hex_color("#8a4e30")
FUR = hex_color("#a8906c")
FUR_DARK = hex_color("#76644a")
CLOTH = hex_color("#9e3024")
CLOTH_DARK = hex_color("#661c16")
WOOD = hex_color("#8c6440")
WOOD_DARK = hex_color("#5e4028")
WOOD_LIGHT = hex_color("#c4a070")

# --- Proportions ---------------------------------------------------------------

# She is very big: wide shoulders, thick arms and legs, a small head.
HIP_Z = 0.5
WAIST_Z = 0.6
CHEST_Z = 0.7
SHOULDER_Z = 0.8
NECK_Z = 0.83
HEAD_C = Vector((0, -0.045, 0.92))
KNEE_Z = 0.28
ANKLE_Z = 0.06
LEG_X = 0.09

# The arms hang out from the wide shoulders at rest (the bind pose).
SR = Vector((-0.19, 0, SHOULDER_Z))
ER = Vector((-0.255, -0.01, 0.63))
WR = Vector((-0.275, -0.05, 0.48))
TR = WR + (WR - ER).normalized() * 0.06
SL = Vector((0.19, 0, SHOULDER_Z))
EL = Vector((0.255, -0.01, 0.63))
WL = Vector((0.275, -0.05, 0.48))
TL = WL + (WL - EL).normalized() * 0.06

# The club hangs from the right fist, its head to the front and down.
GRIP_R = WR + (WR - ER).normalized() * 0.035
CLUB = Vector((0, -0.55, -0.83)).normalized()
CLUB_LENGTH = 0.44

# The broken door round her chest: its middle, and the tilt of its face.
DOOR_C = Vector((0, -0.01, 0.66))
DOOR_TURN = Matrix.Rotation(math.radians(-20), 3, "Y") @ Matrix.Rotation(math.radians(46), 3, "X")
DOOR_U = DOOR_TURN @ X
DOOR_V = DOOR_TURN @ Z
DOOR_N = DOOR_TURN @ -Y

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.015, NECK_Z), (0, -0.025, 0.86), "chest"),
    ("head", (0, -0.025, 0.86), (0, -0.04, 1.0), "neck"),
    ("jaw", tuple(HEAD_C + Vector((0, 0.0, -0.025))), tuple(HEAD_C + Vector((0, -0.065, -0.07))), "head"),
    ("hair", tuple(HEAD_C + Vector((0, 0.05, 0.02))), tuple(HEAD_C + Vector((0, 0.12, -0.2))), "head"),
    ("door", tuple(DOOR_C), tuple(DOOR_C + DOOR_V * 0.1), "spine"),
    ("cloth.F", (0, -0.11, 0.5), (0, -0.12, 0.3), "hips"),
    ("cloth.B", (0, 0.11, 0.5), (0, 0.12, 0.3), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.04 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.11, 0.02), f"shin.{side}"),
    ]
BONES.append(("club", tuple(GRIP_R), tuple(GRIP_R + CLUB * 0.12), "hand.R"))

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.52, 0.62)
    return blend("spine", "chest", co.z, 0.64, 0.73)


def cloth_weights(co):
    bone = "cloth.F" if co.y < 0 else "cloth.B"
    return blend(bone, "hips", co.z, 0.45, 0.5)


def hair_weights(co):
    return blend("head", "hair", co.y, HEAD_C.y + 0.05, HEAD_C.y + 0.1)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.062, 0.062, 0.066), 12, 9)
    # A heavy brow and a wide muzzle.
    brow = kit.sphere(head.bm, HEAD_C + Vector((0, -0.044, 0.024)), (0.056, 0.024, 0.016), 10, 5)
    head.paint(faces_of(brow), SKIN_DARK)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.034, -0.02)), (0.054, 0.042, 0.026), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.064, 0.004)), HEAD_C + Vector((0, -0.084, -0.012)), 0.018, 0.008, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.058 * sign, 0.004, 0.0)), HEAD_C + Vector((0.13 * sign, 0.03, 0.036)), 0.022, 0.002, 5, squash=0.4)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.06, 0.012)), (0.009, 0.005, 0.006), 6, 4)
        # Angry brows, low at the middle.
        line = kit.slab(face.bm, HEAD_C + Vector((0.025 * sign, -0.066, 0.026)), (0.02, 0.0, 0.007 * sign), (0, 0.006, 0), (0.0, 0.0, 0.005))
        face.paint(faces_of(line), HAIR_DARK)
    # The roaring mouth: the dark inside and the upper teeth.
    kit.sphere(face.bm, HEAD_C + Vector((0, -0.05, -0.05)), (0.038, 0.026, 0.026), 10, 6)
    teeth = kit.slab(face.bm, HEAD_C + Vector((0, -0.074, -0.036)), (0.028, 0, 0), (0, 0.004, 0), (0, 0, 0.005))
    face.paint(faces_of(teeth), TUSK)
    parts.append(face)

    # The heavy lower jaw with two large tusks that rise past the upper lip.
    jaw = Part("jaw", SKIN, "jaw", shade=0.08)
    kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.036, -0.075)), (0.052, 0.044, 0.024), 10, 6)
    for sign in (1, -1):
        base = HEAD_C + Vector((0.032 * sign, -0.07, -0.07))
        tusk = kit.tube(jaw.bm, [base, base + Vector((0.006 * sign, -0.012, 0.03)), base + Vector((0.016 * sign, -0.008, 0.062))], [0.013, 0.009, 0.002], 6)
        jaw.paint(faces_of(tusk), TUSK)
        ring = kit.torus(jaw.bm, base + Vector((0.003 * sign, -0.006, 0.014)), (0.1 * sign, -0.3, 1), 0.012, 0.003, 8, 3)
        jaw.paint(faces_of(ring), TUSK_DARK)
    parts.append(jaw)

    # Long dark hair, wild, down her back.
    hair = Part("hair", HAIR, hair_weights, shade=0.12)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.012, 0.014)), (0.068, 0.07, 0.068), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.y < HEAD_C.y - 0.02 and v.co.z < HEAD_C.z + 0.05], context="VERTS")
    for k in range(7):
        a = math.radians(-60 + 20 * k)
        foot = HEAD_C + Vector((0.05 * math.sin(a), 0.04 + 0.02 * math.cos(a), 0.02))
        tip = foot + Vector((0.05 * math.sin(a), 0.07 + 0.03 * (k % 2), -0.2 - 0.03 * (k % 3)))
        lock = kit.cone(hair.bm, foot, tip, 0.03, 0.006, 6)
        hair.paint(faces_of(lock), HAIR_DARK if k % 2 else HAIR)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.015, 0.78), (0, -0.025, 0.88), 0.06, 0.05, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    # A broad chest and a hard, bare stomach.
    kit.sphere(torso.bm, (0, 0.0, 0.73), (0.17, 0.105, 0.105), 14, 8)
    kit.cone(torso.bm, (0, 0, 0.49), (0, 0, 0.7), 0.13, 0.15, 12, squash=0.75)
    parts.append(torso)

    # The brown leather top, the fur belt and its iron buckle.
    top = Part("top", LEATHER, torso_weights, shade=0.08)
    band = kit.sphere(top.bm, (0, -0.008, 0.73), (0.174, 0.11, 0.06), 14, 6)
    for face in faces_of(band):
        if abs(face.calc_center_median().x) < 0.02:
            top.paint([face], LEATHER_DARK)
    for sign in (1, -1):
        kit.tube(top.bm, [(0.08 * sign, -0.08, 0.77), (0.1 * sign, -0.03, 0.82), (0.1 * sign, 0.06, 0.8)], [0.012] * 3, 4)
    belt = kit.cone(top.bm, (0, 0, 0.47), (0, 0, 0.53), 0.142, 0.138, 14, squash=0.8)
    for face in faces_of(belt):
        top.paint([face], FUR if int(face.calc_center_median().x * 60) % 2 else FUR_DARK)
    buckle = kit.slab(top.bm, (0, -0.118, 0.5), (0.034, 0, 0), (0, 0.008, 0), (0, 0, 0.026))
    top.paint(faces_of(buckle), IRON)
    parts.append(top)

    def cloth_color(face_side, row, column):
        if face_side == "back" or row == 2:
            return CLOTH_DARK
        return FUR_DARK if column in (0, 6) else CLOTH

    for name, sign in (("cloth.F", -1), ("cloth.B", 1)):
        cloth = Part(name, CLOTH, cloth_weights)

        def grid(inset, sign=sign):
            result = []
            for row in range(4):
                v = row / 3
                line = []
                for c in range(7):
                    u = lerp(-1, 1, c / 6)
                    angle = u * math.radians(70)
                    radius = lerp(0.14, 0.16, v) - inset
                    tear = 0.05 * v * ((c * 5) % 3) / 2
                    line.append((radius * math.sin(angle), sign * radius * math.cos(angle) * 0.8, lerp(0.5, 0.3 + tear, v)))
                result.append(line)
            return result

        kit.panel(cloth, grid(0.0), grid(0.008), cloth_color)
        parts.append(cloth)
    return parts


def spikes(part, center, normal, count, length, radius, color):
    """A ring of short spikes on a plate, out along `normal`."""
    normal = Vector(normal).normalized()
    side = normal.cross(Y if abs(normal.dot(Y)) < 0.9 else X).normalized()
    other = normal.cross(side)
    for k in range(count):
        a = 2 * math.pi * k / count
        foot = center + (side * math.cos(a) + other * math.sin(a)) * radius
        spike = kit.cone(part.bm, foot, foot + normal * length, 0.012, 0.001, 5)
        part.paint(faces_of(spike), color)


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.01 * sign, 0, -0.012)), (0.066, 0.062, 0.066), 10, 7)
        kit.cone(upper.bm, s, e, 0.062, 0.05, 8)
        parts.append(upper)

        # The rough iron shoulder plate with spikes.
        plate = Part(f"plate.{side}", IRON, f"upperarm.{side}", smooth=False, shade=0.12)
        verts = kit.sphere(plate.bm, s + Vector((0.006 * sign, 0, 0.016)), (0.08, 0.078, 0.064), 10, 6)
        kit.bmesh.ops.delete(plate.bm, geom=[v for v in verts if v.co.z < s.z - 0.026], context="VERTS")
        for face in plate.bm.faces:
            if int(face.calc_center_median().y * 80 + face.calc_center_median().x * 40) % 4 == 0:
                plate.paint([face], RUST)
        spikes(plate, s + Vector((0.03 * sign, 0, 0.05)), (0.6 * sign, 0, 1), 4, 0.05, 0.035, IRON_DARK)
        top_spike = kit.cone(plate.bm, s + Vector((0.04 * sign, 0, 0.07)), s + Vector((0.08 * sign, 0, 0.14)), 0.016, 0.001, 5)
        plate.paint(faces_of(top_spike), IRON_DARK)
        parts.append(plate)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.052, 0.042, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.06)
        if side == "R":
            # A spiked iron bracer on the club arm.
            kit.cone(bracer.bm, e + d * 0.03, w - d * 0.006, 0.058, 0.05, 8)
            bracer.paint(list(bracer.bm.faces), IRON)
            outward = Vector((-1, 0.2, 0)).normalized()
            for along in (0.3, 0.55, 0.8):
                p = e + (w - e) * along + outward * 0.05
                spike = kit.cone(bracer.bm, p, p + outward * 0.04, 0.012, 0.001, 5)
                bracer.paint(faces_of(spike), IRON_DARK)
        else:
            verts = kit.cone(bracer.bm, e + d * 0.05, w - d * 0.006, 0.052, 0.046, 8)
            for face in faces_of(verts):
                if int(((face.calc_center_median() - e).dot(d)) * 70) % 3 == 0:
                    bracer.paint([face], LEATHER_DARK)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.034, (0.04, 0.036, 0.042), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.082, 0.062, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", LEATHER, f"shin.{side}", shade=0.1)
        kit.sphere(shin.bm, knee, (0.06, 0.06, 0.05), 8, 6)
        shin.paint(list(shin.bm.faces), SKIN)
        verts = kit.cone(shin.bm, knee - Vector((0, 0, 0.03)), ankle + Vector((0, 0, 0.04)), 0.058, 0.05, 8)
        for face in faces_of(verts):
            shin.paint([face], LEATHER_DARK if int(face.calc_center_median().z * 40) % 2 == 0 else LEATHER)
        cuff = kit.torus(shin.bm, knee - Vector((0, 0, 0.03)), Z, 0.06, 0.016, 12, 4)
        shin.paint(faces_of(cuff), FUR)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.045)), ankle - Vector((0, 0, 0.025)), 0.056, 0.06, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.04, 0.026), (0.09, 0.16, 0.052))
        parts.append(boot)
    return parts


def club_part():
    """The big wooden club: a thick head with iron bands and spikes, a leather grip."""
    part = Part("club", WOOD, "club", shade=0.08)
    start = GRIP_R - CLUB * 0.06
    end = GRIP_R + CLUB * CLUB_LENGTH
    verts = kit.cone(part.bm, start, end, 0.026, 0.07, 10)
    for face in faces_of(verts):
        if int((face.calc_center_median() - start).length * 60) % 4 == 0:
            part.paint([face], WOOD_DARK)
    grip = kit.cone(part.bm, start, GRIP_R + CLUB * 0.06, 0.03, 0.031, 8)
    part.paint(faces_of(grip), LEATHER_DARK)
    knob = kit.sphere(part.bm, start, (0.032, 0.032, 0.032), 6, 4)
    part.paint(faces_of(knob), WOOD_DARK)
    cap = kit.sphere(part.bm, end, (0.07, 0.07, 0.07), 10, 6)
    part.paint(faces_of(cap), WOOD)
    for along in (0.5, 0.8):
        p = GRIP_R + CLUB * (CLUB_LENGTH * along)
        r = lerp(0.026, 0.07, (along * CLUB_LENGTH + 0.06) / (CLUB_LENGTH + 0.06))
        band = kit.torus(part.bm, p, CLUB, r + 0.004, 0.008, 12, 3)
        part.paint(faces_of(band), IRON)
    side = CLUB.cross(X).normalized()
    other = CLUB.cross(side)
    for k in range(10):
        along = 0.6 + 0.16 * (k // 5)
        a = 2 * math.pi * (k % 5) / 5 + 0.6 * (k // 5)
        out = side * math.cos(a) + other * math.sin(a)
        r = lerp(0.026, 0.07, (along * CLUB_LENGTH + 0.06) / (CLUB_LENGTH + 0.06))
        foot = GRIP_R + CLUB * (CLUB_LENGTH * along) + out * r
        spike = kit.cone(part.bm, foot, foot + out * 0.04, 0.012, 0.001, 4)
        part.paint(faces_of(spike), IRON_DARK)
    tip = kit.cone(part.bm, end + CLUB * 0.05, end + CLUB * 0.1, 0.014, 0.001, 4)
    part.paint(faces_of(tip), IRON_DARK)
    return [part]


def door_part():
    """
    The broken door round her chest: five planks with a hole where she went
    through, two iron hinge straps, splinters and a ring handle.
    """
    part = Part("door", WOOD_LIGHT, "door", smooth=False, shade=0.08)
    width, height, thick = 0.115, 0.62, 0.022
    hole_r = 0.2

    def point(u, v, n=0.0):
        return DOOR_C + DOOR_U * u + DOOR_V * v + DOOR_N * n

    def plank(u0, u1, v0, v1, tone):
        center = point((u0 + u1) / 2, (v0 + v1) / 2)
        verts = kit.slab(part.bm, center, DOOR_U * ((u1 - u0) / 2 - 0.004), DOOR_V * ((v1 - v0) / 2), DOOR_N * thick)
        part.paint(faces_of(verts), tone)

    def splinter(u, v, toward):
        foot = point(u, v)
        tip = foot + DOOR_V * (0.05 * toward) + DOOR_U * 0.012
        cone = kit.cone(part.bm, foot, tip, 0.014, 0.001, 4, squash=0.4)
        part.paint(faces_of(cone), WOOD_LIGHT)

    for k in range(5):
        u0 = (k - 2.5) * width
        u1 = u0 + width
        tone = (WOOD, WOOD_LIGHT, WOOD, WOOD_DARK, WOOD)[k]
        u_mid = (u0 + u1) / 2
        if abs(u_mid) + width / 2 < hole_r + 0.06 and abs(u_mid) < hole_r:
            # A plank broken by the hole: a piece above and a piece below it, with ragged ends.
            gap = math.sqrt(max(hole_r * hole_r - u_mid * u_mid, 0.0)) + 0.01 * (k % 2)
            plank(u0, u1, gap, height / 2, tone)
            plank(u0, u1, -height / 2, -gap - 0.02, tone)
            splinter(u_mid, gap, -1)
            splinter(u_mid - 0.03, -gap - 0.02, 1)
        else:
            # The planks at the sides: one is shorter, as it broke off.
            top = height / 2 - (0.07 if k == 0 else 0.0)
            plank(u0, u1, -height / 2, top, tone)
    # The iron hinge straps, broken at the hole, with nails.
    for v in (0.21, -0.21):
        for u0, u1 in ((-2.5 * width, -hole_r * 0.6), (hole_r * 0.6, 2.5 * width)):
            if abs(v) < hole_r and u1 > -hole_r * 0.6 and u0 < hole_r * 0.6:
                continue
            strap = kit.slab(part.bm, point((u0 + u1) / 2, v, thick + 0.004), DOOR_U * ((u1 - u0) / 2), DOOR_V * 0.018, DOOR_N * 0.005)
            part.paint(faces_of(strap), IRON)
            for u in (u0 + 0.03, u1 - 0.03):
                nail = kit.sphere(part.bm, point(u, v, thick + 0.01), (0.007, 0.007, 0.007), 4, 3)
                part.paint(faces_of(nail), IRON_DARK)
    # The hinge pins on the left edge, and the ring handle on the right edge.
    for v in (0.21, -0.21):
        pin = kit.cone(part.bm, point(2.5 * width + 0.008, v - 0.035), point(2.5 * width + 0.008, v + 0.035), 0.012, 0.012, 6)
        part.paint(faces_of(pin), IRON_DARK)
    ring = kit.torus(part.bm, point(-2.5 * width + 0.05, 0.0, thick + 0.012), DOOR_N, 0.026, 0.005, 10, 3)
    part.paint(faces_of(ring), IRON_DARK)
    return [part]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("TuskBrute", BONES)
    parts = head_parts() + body_parts() + limb_parts() + club_part() + door_part()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "TuskBruteMesh")
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

    def stand(breath=0.0, roar=0.0, sway=0.0):
        """
        The idle: wide and heavy, leaning forward, ready for the next fight.
        The club hangs in her right hand and the left fist is ready. `roar`
        throws her head back and opens her mouth.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.03 - breath * 0.006)),
            "hips": t("hips", (Z, -8), (Y, sway * 2)),
            "spine": t("spine", (X, 10 + breath - roar * 8)),
            "chest": t("chest", (X, 4 - breath * 2 - roar * 8), (Z, -4)),
            "neck": t("neck", (X, -8 - roar * 6)),
            "head": t("head", (X, -6 + breath * 2 - roar * 16), (Z, -6 + sway * 3)),
            "jaw": t("jaw", (X, 8 + roar * 22)),
            "hair": t("hair", (X, -4 - breath * 4 + roar * 10), (Y, sway * 4)),
            "door": t("door", (X, breath * 2 - roar * 3), (Y, sway * 2)),
            "upperarm.R": t("upperarm.R", (X, -10 + roar * 6), (Y, 12 + roar * 16)),
            "forearm.R": t("forearm.R", (X, -24 - roar * 30)),
            "hand.R": t("hand.R", (X, 14)),
            "upperarm.L": t("upperarm.L", (X, -24 + roar * 10), (Y, -14 - roar * 20)),
            "forearm.L": t("forearm.L", (X, -50 - roar * 30)),
            "hand.L": t("hand.L", (X, -10)),
            "thigh.L": t("thigh.L", (X, -22), (Y, -8)),
            "shin.L": t("shin.L", (X, 20)),
            "foot.L": t("foot.L", (X, 2)),
            "thigh.R": t("thigh.R", (X, 14), (Y, 8)),
            "shin.R": t("shin.R", (X, 16)),
            "foot.R": t("foot.R", (X, -30)),
            "cloth.F": t("cloth.F", (X, -8)),
            "cloth.B": t("cloth.B", (X, 6 + sway * 3)),
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, she leans on the club, its head on the ground."""
        return pose(
            stand(breath),
            hips_at_loc=at("hips", (0, 0.03, -0.18 - breath * 0.005)),
            spine=t("spine", (X, 28 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, 0 + breath * 3), (Z, -10)),
            jaw=t("jaw", (X, 12 + breath * 6)),
            door=t("door", (X, 10), (Y, -8)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 10)),
            forearm__R=t("forearm.R", (X, -30)),
            hand__R=t("hand.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -10), (Y, -6)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -40)),
            cloth__F=t("cloth.F", (X, -36)),
        )

    def recoil(base, amount=1.0):
        """A hit jolts her a little: she is big. The door rattles."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.025 * amount, -0.03)),
            spine=t("spine", (X, 2)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            neck=t("neck", (X, -8)),
            head=t("head", (X, -14 * amount), (Z, -8)),
            jaw=t("jaw", (X, 24 * amount)),
            door=t("door", (X, -8 * amount), (Y, 6 * amount)),
            door_at_loc=at("door", (0, 0, 0.02 * amount)),
            upperarm__L=t("upperarm.L", (X, -40 * amount), (Y, -30 * amount)),
            cloth__F=t("cloth.F", (X, -20 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.05)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -8)),
            head=t("head", (X, -22)),
            jaw=t("jaw", (X, 26)),
            door=t("door", (X, -14), (Y, 10)),
            door_at_loc=at("door", (0, 0.02, 0.06)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 34)),
            thigh__R=t("thigh.R", (X, 12)),
            shin__R=t("shin.R", (X, 30)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, 40)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, -40)),
        )

    def fallen(base, bounce=0.0, door_on=0.0):
        """
        Flat on her back, the club out to the side. The door slid off over her
        head and lies on the ground behind her. `door_on` (0 to 1) puts it on again.
        """
        off = 1 - door_on
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.09)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0), (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -26)),
            jaw=t("jaw", (X, 20)),
            door=t("door", (X, -60 * off), (Y, 10 * off)),
            door_at_loc=at("door", Vector((0.0, -0.06, 0.36)) * off),
            upperarm__R=t("upperarm.R", (Y, 70), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 40)),
            upperarm__L=t("upperarm.L", (Y, -60), (X, 10)),
            forearm__L=t("forearm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, -10), (Y, -6)),
            shin__L=t("shin.L", (X, 12)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
            cloth__F=t("cloth.F", (X, 10)),
            cloth__B=t("cloth.B", (X, -6)),
        )

    def crouch(base):
        """Low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.18)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 12)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -10)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -24)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 106)),
            foot__R=t("foot.R", (X, -52)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, 10)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, -50)),
            upperarm__L=t("upperarm.L", (X, -10), (Y, -10)),
            cloth__F=t("cloth.F", (X, -40)),
        )

    def flex(base):
        """Up again with a roar, the club high and the left fist up: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.02)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -24)),
            jaw=t("jaw", (X, 34)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 80)),
            forearm__R=t("forearm.R", (X, -90)),
            hand__R=t("hand.R", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, -80)),
            forearm__L=t("forearm.L", (X, -90)),
        )

    def step(front, lift=0.0):
        """A heavy stomp. `front` is 1 for the left foot, -1 for the right; `lift` is the foot in the air."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.0, -0.045 + lift * 0.02)),
            hips=t("hips", (Z, -8 * front), (Y, 5 * front)),
            spine=t("spine", (X, 14), (Y, -5 * front)),
            chest=t("chest", (X, 4), (Z, -8 * front)),
            door=t("door", (Y, 4 * front), (X, -4 * lift)),
            upperarm__R=t("upperarm.R", (X, -10 + 24 * front), (Y, 12)),
            hand__R=t("hand.R", (X, -24)),
            upperarm__L=t("upperarm.L", (X, -24 - 24 * front), (Y, -14)),
            cloth__F=t("cloth.F", (X, -24)),
            cloth__B=t("cloth.B", (X, 18)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -44 + lift * 10)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 24 + lift * 40)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -2)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18 - lift * 10)),
                f"shin__{back}": t(f"shin.{back}", (X, 24 + lift * 20)),
                f"foot__{back}": t(f"foot.{back}", (X, -14)),
            },
        )

    # The attack: she lifts the club high over her head and smashes it down.
    # The slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts),
    # so the smash lands at frame 15 of 30.
    def lift_club(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.03)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, -10), (Z, -6)),
            chest=t("chest", (X, -10), (Z, -8)),
            head=t("head", (X, -12)),
            jaw=t("jaw", (X, 26)),
            door=t("door", (X, -6)),
            upperarm__R=t("upperarm.R", (X, -170), (Y, 16)),
            forearm__R=t("forearm.R", (X, -60)),
            hand__R=t("hand.R", (X, -30)),
            upperarm__L=t("upperarm.L", (X, -60), (Y, -30)),
            forearm__L=t("forearm.L", (X, -40)),
        )

    def smash(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.08, -0.1)),
            hips=t("hips", (Z, 6), (X, 8)),
            spine=t("spine", (X, 30), (Z, 6)),
            chest=t("chest", (X, 12), (Z, 8)),
            neck=t("neck", (X, -22)),
            head=t("head", (X, -16)),
            jaw=t("jaw", (X, 30)),
            door=t("door", (X, 8), (Y, -4)),
            door_at_loc=at("door", (0, 0, 0.03)),
            upperarm__R=t("upperarm.R", (X, -64), (Y, 6)),
            forearm__R=t("forearm.R", (X, -8)),
            hand__R=t("hand.R", (X, 4)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, -30)),
            forearm__L=t("forearm.L", (X, -40)),
            thigh__L=t("thigh.L", (X, -66), (Y, -8)),
            shin__L=t("shin.L", (X, 56)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 24), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
            cloth__F=t("cloth.F", (X, -36)),
            cloth__B=t("cloth.B", (X, 30)),
        )

    clips = []
    # The idle: heavy breaths, then a roar that shakes the door.
    idle = Clip("idle", 48, loop=True)
    for frame, breath, roar, sway in ((0, 0, 0, 0), (12, 1, 0, 1), (20, 0.5, 0.6, 0), (26, 0.8, 1, 0), (32, 0.6, 1, -1), (38, 0.3, 0.2, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, roar, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, step(1, 1)).key(12, step(-1)).key(18, step(-1, 1)).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, lift_club(stand())).key(15, smash(stand())).key(20, smash(stand()))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(13, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 4)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    # The door stays on the ground, so it comes back with her as she rises.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, flex(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.04, -0.16))))
    summon.key(17, flex(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "tusk-brute.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
