"""
Pale Galloper (`undead.paleGalloper`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a small, nervous skeleton courier
on a joyful spectral marsh pony. The pony is pale ice blue, with a wispy
white mane and tail, glowing eyes, icicles under its jaw and belly, a big
open grin, a leather bridle and a breast strap with a brass wheel. The rider
has a rusty cap, a teal scarf, a ragged brown coat, wrapped boots, a frosted
saddle and an empty scroll tube on a strap. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/pale-galloper.glb`;
then `bun unit-model:pack pale-galloper` packs it for the game.

A mount: the root carries the pony, and the seat bone of the rider is a child
of the pony body, so he moves with it. The scroll tube hangs at his right
hip, on the camera side. The pony is braver than the rider: at rest the pony
paws the ground and grins, and the rider leans back with both hands on the
reins and his jaw chattering. He has Swift, so the walk is a gallop, and a
spray of ice (a bone that scales) bursts at the front hooves. The attack is
the Charge: the pony surges forward, the ice bursts, and the rider holds on.
It falls on its left side (`(Y, +84)` on the root), so the belly and the
legs turn to the camera side. He has no Keyword that he uses by his own
action, so he has no cast clip.
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

COAT = hex_color("#cfe6f2")
COAT_SHADE = hex_color("#9fc6de")
MANE = hex_color("#eef8ff")
MANE_GLOW = hex_color("#9fe8ff")
ICE = hex_color("#d2f3ff")
ICE_DEEP = hex_color("#86d0f0")
HOOF = hex_color("#7fb3d0")
EYE = hex_color("#9fe8ff")
MOUTH = hex_color("#35506a")
TEETH = hex_color("#f6f8fa")
BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
RUST = hex_color("#8f5f3a")
RUST_DARK = hex_color("#62402a")
TEAL = hex_color("#5f837d")
TEAL_DARK = hex_color("#3f5a56")
COAT_RAG = hex_color("#7a6450")
COAT_RAG_DARK = hex_color("#57473a")
LEATHER = hex_color("#6a4a2e")
LEATHER_DARK = hex_color("#45301e")
BRASS = hex_color("#b08440")
FROST = hex_color("#e9f6fb")

# --- Proportions: the pony -------------------------------------------------------

# A slim pony with long legs.
BACK = Vector((0, 0.19, 0.5))
MID = Vector((0, 0.0, 0.51))
CHEST = Vector((0, -0.16, 0.53))
NECK = Vector((0, -0.18, 0.59))
POLL = Vector((0, -0.29, 0.77))
NOSE = Vector((0, -0.45, 0.68))
HEAD_C = Vector((0, -0.34, 0.74))

LEGS = {
    # name: (top, joint, hoof, parent)
    "FL": (Vector((0.06, -0.15, 0.45)), Vector((0.064, -0.15, 0.23)), Vector((0.064, -0.15, 0.03)), "chest"),
    "FR": (Vector((-0.06, -0.15, 0.45)), Vector((-0.064, -0.15, 0.23)), Vector((-0.064, -0.15, 0.03)), "chest"),
    "BL": (Vector((0.06, 0.19, 0.45)), Vector((0.064, 0.23, 0.23)), Vector((0.064, 0.2, 0.03)), "body"),
    "BR": (Vector((-0.06, 0.19, 0.45)), Vector((-0.064, 0.23, 0.23)), Vector((-0.064, 0.2, 0.03)), "body"),
}

TAIL = [Vector((0, 0.29, 0.55)), Vector((0, 0.38, 0.45)), Vector((0, 0.43, 0.3))]
# The spray of ice at the front hooves.
SPRAY = Vector((0, -0.2, 0.02))

# --- Proportions: the rider -------------------------------------------------------

SEAT_Z = 0.645
WAIST_Z = 0.7
NECK_Z = 0.8
R_HEAD_C = Vector((0, 0.0, 0.865))
SL = Vector((0.066, 0.01, 0.79))
SR = Vector((-0.066, 0.01, 0.79))
# Both hands hold the reins in front of him.
EL = Vector((0.09, -0.02, 0.71))
WL = Vector((0.035, -0.11, 0.72))
ER = Vector((-0.09, -0.02, 0.71))
WR = Vector((-0.035, -0.11, 0.72))
HAND_L = WL + (WL - EL).normalized() * 0.018
HAND_R = WR + (WR - ER).normalized() * 0.018
HIP_X = 0.045
KNEE = Vector((0.12, -0.06, 0.56))
FOOT = Vector((0.12, -0.03, 0.42))
SCROLL = Vector((-0.085, 0.03, 0.66))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("body", tuple(BACK), tuple(MID), "root"),
    ("chest", tuple(MID), tuple(CHEST), "body"),
    ("neck", tuple(NECK), tuple(POLL), "chest"),
    ("head", tuple(POLL), tuple(NOSE), "neck"),
    ("jaw", tuple(HEAD_C + Vector((0, 0.0, -0.03))), tuple(NOSE + Vector((0, 0.0, -0.05))), "head"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[2]), "body"),
    ("spray", tuple(SPRAY), tuple(SPRAY + Vector((0, 0, 0.08))), "root"),
]
for leg, (top, joint, hoof, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(top), tuple(joint), parent),
        (f"lower.{leg}", tuple(joint), tuple(hoof), f"upper.{leg}"),
    ]
BONES += [
    ("seat", (0, 0.01, SEAT_Z), (0, 0.01, WAIST_Z), "body"),
    ("torso", (0, 0.01, WAIST_Z), (0, 0.01, NECK_Z), "seat"),
    ("rhead", (0, 0.0, NECK_Z), (0, 0.0, 0.94), "torso"),
    ("rjaw", (0, -0.008, 0.84), (0, -0.055, 0.825), "rhead"),
    ("scarf", (0, 0.04, 0.8), (0, 0.14, 0.76), "torso"),
]
for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
    knee = Vector((KNEE.x * sign, KNEE.y, KNEE.z))
    foot = Vector((FOOT.x * sign, FOOT.y, FOOT.z))
    BONES += [
        (f"upperarm.{side}", tuple(s), tuple(e), "torso"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"thigh.{side}", (HIP_X * sign, 0.01, SEAT_Z), tuple(knee), "seat"),
        (f"shin.{side}", tuple(knee), tuple(foot), f"thigh.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the pony: the body at the back, the chest at the front."""
    t = clamp01((co.y + 0.02) / 0.12)
    return {"chest": 1 - t, "body": t}


def neck_weights(co):
    t = clamp01((co.z - 0.6) / 0.1)
    return {"neck": t, "chest": 1 - t}


def leg_weights(leg):
    top, _joint, _hoof, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.05)) / 0.07)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


def torso_weights(co):
    return blend("seat", "torso", co.z, 0.69, 0.73)


def rein_weights(side):
    hand = HAND_L if side == "L" else HAND_R

    def weights(co):
        """A rein goes from a hand to the bit, so it stretches between them."""
        t = clamp01((co.y - NOSE.y - 0.06) / (hand.y - NOSE.y - 0.06))
        return {"head": 1 - t, f"forearm.{side}": t}

    return weights


# --- Parts: the pony ---------------------------------------------------------------


def pony_parts():
    parts = []

    def coat_color(face, center):
        # Pale ice, darker on the belly.
        return COAT_SHADE if center.z < 0.45 else COAT

    body = Part("body", coat_color, body_weights, shade=0.22)
    kit.sphere(body.bm, (0, 0.02, 0.51), (0.11, 0.25, 0.11), 14, 10)
    kit.sphere(body.bm, (0, -0.13, 0.53), (0.1, 0.1, 0.115), 12, 8)
    kit.sphere(body.bm, (0, 0.18, 0.52), (0.105, 0.11, 0.105), 12, 8)
    parts.append(body)

    # Icicles hang from the belly and the chest.
    icicles = Part("icicles", ICE, body_weights, shade=0.1)
    for index, (x, y) in enumerate(((-0.06, -0.12), (-0.08, -0.02), (-0.07, 0.08), (-0.05, 0.18), (0.06, -0.06), (0.07, 0.1), (0.0, -0.2))):
        top = Vector((x, y, 0.44 if abs(x) > 0.01 else 0.47))
        length = 0.05 + 0.025 * (index % 3)
        icicle = kit.cone(icicles.bm, top, top - Z * length, 0.012, 0.001, 4)
        icicles.paint(faces_of(icicle), ICE if index % 2 else ICE_DEEP)
    parts.append(icicles)

    neck = Part("neck", COAT, neck_weights, shade=0.16)
    kit.tube(neck.bm, [NECK + Vector((0, 0.05, -0.04)), NECK + Vector((0, -0.02, 0.02)), (NECK + POLL) / 2, POLL + Vector((0, 0.02, -0.01))], [0.085, 0.075, 0.06, 0.048], 10)
    parts.append(neck)

    # A wispy white mane that streams back, with glowing tips.
    mane = Part("mane", MANE, neck_weights, shade=0.08)
    for index in range(7):
        u = index / 6
        base = NECK.lerp(POLL, u) + Vector((0, 0.045 - 0.02 * u, 0.05 - 0.01 * u))
        tip = base + Vector((0.02 * (1 if index % 2 else -1), 0.11, 0.0 + 0.02 * (index % 2)))
        tuft = kit.cone(mane.bm, base, tip, 0.03, 0.004, 6, squash=0.5)
        mane.paint(faces_of(tuft), MANE_GLOW if index % 3 == 2 else MANE)
    parts.append(mane)

    head = Part("head", COAT, "head", shade=0.14)
    kit.sphere(head.bm, HEAD_C, (0.052, 0.07, 0.06), 12, 8)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.04, 0.0)), NOSE + Vector((0, 0.01, 0.0)), 0.046, 0.04, 10)
    kit.sphere(head.bm, NOSE + Vector((0, 0.0, -0.004)), (0.042, 0.036, 0.034), 10, 6)
    for sign in (1, -1):
        ear = kit.cone(head.bm, HEAD_C + Vector((0.026 * sign, 0.04, 0.045)), HEAD_C + Vector((0.036 * sign, 0.07, 0.11)), 0.016, 0.003, 5, squash=0.6)
        head.paint(faces_of(ear), COAT_SHADE)
        nostril = kit.sphere(head.bm, NOSE + Vector((0.018 * sign, -0.032, 0.008)), (0.007, 0.005, 0.009), 5, 4)
        head.paint(faces_of(nostril), MOUTH)
    # A wispy forelock.
    forelock = kit.cone(head.bm, POLL + Vector((0, -0.01, 0.02)), HEAD_C + Vector((0.02, -0.06, 0.05)), 0.02, 0.004, 5, squash=0.5)
    head.paint(faces_of(forelock), MANE)
    parts.append(head)

    # Big round glowing eyes.
    eyes = Part("ponyEyes", EYE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.046 * sign, -0.02, 0.02)), (0.012, 0.019, 0.019), 8, 6)
        pupil = kit.sphere(eyes.bm, HEAD_C + Vector((0.055 * sign, -0.026, 0.022)), (0.005, 0.009, 0.009), 6, 4)
        eyes.paint(faces_of(pupil), MOUTH)
    parts.append(eyes)

    # The grin: the upper teeth on the head, and the open lower jaw with
    # its teeth and a beard of icicles.
    upper = Part("upperTeeth", TEETH, "head", shade=0)
    kit.slab(upper.bm, NOSE + Vector((0, 0.01, -0.03)), (0.036, 0, 0), (0, 0.03, 0), (0, 0, 0.006))
    roof = kit.slab(upper.bm, NOSE + Vector((0, 0.03, -0.024)), (0.032, 0, 0), (0, 0.04, 0), (0, 0, 0.004))
    upper.paint(faces_of(roof), MOUTH)
    parts.append(upper)

    jaw = Part("jaw", COAT, "jaw", shade=0.1)
    kit.cone(jaw.bm, HEAD_C + Vector((0, -0.02, -0.035)), NOSE + Vector((0, 0.01, -0.05)), 0.03, 0.026, 8, squash=0.7)
    inside = kit.slab(jaw.bm, NOSE + Vector((0, 0.03, -0.034)), (0.026, 0, 0), (0, 0.05, 0), (0, 0, 0.006))
    jaw.paint(faces_of(inside), MOUTH)
    teeth = kit.slab(jaw.bm, NOSE + Vector((0, 0.008, -0.03)), (0.03, 0, 0), (0, 0.02, 0), (0, 0, 0.006))
    jaw.paint(faces_of(teeth), TEETH)
    for index, x in enumerate((-0.02, 0.0, 0.02)):
        top = NOSE + Vector((x, 0.03 + 0.02 * index, -0.07))
        icicle = kit.cone(jaw.bm, top, top - Z * (0.04 + 0.015 * (index % 2)), 0.008, 0.001, 4)
        jaw.paint(faces_of(icicle), ICE)
    parts.append(jaw)

    # The bridle and a breast strap with a brass wheel.
    tack = Part("bridle", LEATHER, "head", shade=0.05)
    kit.torus(tack.bm, NOSE + Vector((0, 0.04, 0.006)), (0, 1, 0.4), 0.044, 0.005, 12, 4)
    kit.torus(tack.bm, HEAD_C + Vector((0, 0.02, 0.01)), (0, 0.4, -1), 0.056, 0.005, 12, 4)
    for sign in (1, -1):
        ring = kit.torus(tack.bm, NOSE + Vector((0.045 * sign, 0.05, -0.02)), (1, 0, 0), 0.01, 0.003, 8, 3)
        tack.paint(faces_of(ring), BRASS)
    parts.append(tack)

    strap = Part("breastStrap", LEATHER, body_weights, shade=0.05)
    kit.tube(strap.bm, [(-0.1, -0.05, 0.6), (-0.1, -0.2, 0.5), (0.0, -0.24, 0.47), (0.1, -0.2, 0.5), (0.1, -0.05, 0.6)], [0.008] * 5, 4)
    for sign in (1, -1):
        wheel = kit.torus(strap.bm, (0.105 * sign, -0.16, 0.52), (1, 0, 0), 0.022, 0.005, 12, 3)
        strap.paint(faces_of(wheel), BRASS)
        hub = kit.sphere(strap.bm, (0.108 * sign, -0.16, 0.52), (0.006, 0.008, 0.008), 5, 4)
        strap.paint(faces_of(hub), BRASS)
        for spoke in range(3):
            a = math.pi * spoke / 3
            d = Vector((0, math.cos(a), math.sin(a))) * 0.02
            line = kit.cone(strap.bm, Vector((0.106 * sign, -0.16, 0.52)) - d, Vector((0.106 * sign, -0.16, 0.52)) + d, 0.003, 0.003, 3)
            strap.paint(faces_of(line), BRASS)
    parts.append(strap)

    # A frosted saddle on a ragged blanket.
    saddle = Part("saddle", LEATHER, "body", shade=0.06)
    kit.box(saddle.bm, (0, 0.02, 0.625), (0.1, 0.15, 0.024))
    pommel = kit.cone(saddle.bm, (0, -0.055, 0.625), (0, -0.068, 0.67), 0.034, 0.02, 8, squash=0.6)
    saddle.paint(faces_of(pommel), LEATHER_DARK)
    cantle = kit.cone(saddle.bm, (0, 0.095, 0.625), (0, 0.105, 0.675), 0.046, 0.038, 8, squash=0.5)
    saddle.paint(faces_of(cantle), LEATHER_DARK)
    for sign in (1, -1):
        frost = kit.box(saddle.bm, (0.05 * sign, 0.02, 0.638), (0.012, 0.14, 0.006))
        saddle.paint(faces_of(frost), FROST)
        blanket = kit.slab(saddle.bm, (0.105 * sign, 0.03, 0.56), (0.004 * sign, 0, 0), (0, 0.11, 0), (0.012 * sign, 0, 0.06))
        saddle.paint(faces_of(blanket), TEAL_DARK if sign > 0 else TEAL)
    parts.append(saddle)

    tail = Part("tail", MANE, lambda co: blend("body", "tail", co.y, 0.28, 0.32), shade=0.08)
    # Wispy strands that stream back and down.
    for index, (dx, dy, dz) in enumerate(((0.0, 0.0, 0.0), (0.018, 0.03, 0.03), (-0.018, 0.04, 0.02), (0.0, 0.07, 0.06))):
        bend = Vector((dx, dy, dz))
        strand = kit.tube(tail.bm, [TAIL[0], TAIL[0].lerp(TAIL[1], 0.5) + Vector((dx * 0.5, 0.03 + dy * 0.5, 0.02)), TAIL[1] + bend * 0.7, TAIL[2] + bend], [0.02, 0.022, 0.016, 0.003], 5)
        tail.paint(faces_of(strand), MANE_GLOW if index == 3 else MANE)
    parts.append(tail)

    for leg, (top, joint, hoof, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", COAT, leg_weights(leg), shade=0.18)
        kit.cone(upper.bm, top + Vector((0, 0, 0.05)), joint, 0.046, 0.026, 8)
        kit.sphere(upper.bm, joint, (0.025, 0.027, 0.024), 6, 5)
        parts.append(upper)

        lower = Part(f"lower.{leg}", COAT_SHADE, f"lower.{leg}", shade=0.14)
        kit.cone(lower.bm, joint, hoof + Vector((0, 0, 0.04)), 0.021, 0.019, 8)
        # A wispy tuft of frost at the fetlock, and an ice hoof.
        tuft = kit.cone(lower.bm, hoof + Vector((0, 0, 0.075)), hoof + Vector((0, 0.012, 0.02)), 0.024, 0.034, 8)
        lower.paint(faces_of(tuft), MANE)
        shoe = kit.cone(lower.bm, hoof + Vector((0, -0.005, 0.026)), hoof + Vector((0, -0.005, -0.028)), 0.028, 0.032, 8)
        lower.paint(faces_of(shoe), HOOF)
        parts.append(lower)

    # The spray of ice at the front hooves: shards and splashes that burst out.
    spray = Part("spray", ICE, "spray", shade=0)
    for index in range(9):
        a = 2 * math.pi * index / 9
        base = SPRAY + Vector((0.07 * math.cos(a), 0.05 * math.sin(a), 0.0))
        out = Vector((math.cos(a) * 0.7, math.sin(a) * 0.5 - 0.2, 1)).normalized()
        shard = kit.cone(spray.bm, base, base + out * (0.07 + 0.03 * (index % 3)), 0.018, 0.001, 4)
        spray.paint(faces_of(shard), ICE if index % 2 else ICE_DEEP)
    parts.append(spray)
    return parts


# --- Parts: the rider ---------------------------------------------------------------


def rider_parts():
    parts = []
    skull = Part("rskull", BONE, "rhead", shade=0.12)
    kit.sphere(skull.bm, R_HEAD_C, (0.046, 0.05, 0.052), 10, 8)
    for sign in (1, -1):
        kit.sphere(skull.bm, R_HEAD_C + Vector((0.03 * sign, -0.036, -0.016)), (0.016, 0.014, 0.012), 6, 4)
    parts.append(skull)

    # Wide, worried sockets with small glowing eyes, and a nose hole.
    face = Part("rface", SOCKET, "rhead", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, R_HEAD_C + Vector((0.019 * sign, -0.043, 0.004)), (0.016, 0.01, 0.017), 8, 5)
        eye = kit.sphere(face.bm, R_HEAD_C + Vector((0.019 * sign, -0.051, 0.006)), (0.006, 0.004, 0.006), 6, 4)
        face.paint(faces_of(eye), GLOW)
    kit.cone(face.bm, R_HEAD_C + Vector((0, -0.049, -0.016)), R_HEAD_C + Vector((0, -0.051, -0.004)), 0.007, 0.002, 4)
    teeth = kit.box(face.bm, R_HEAD_C + Vector((0, -0.044, -0.028)), (0.04, 0.008, 0.009))
    face.paint(faces_of(teeth), BONE_DARK)
    parts.append(face)

    jaw = Part("rjaw", BONE, "rjaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.026, 0.83), (0.036, 0.028, 0.016), 8, 5)
    lower = kit.box(jaw.bm, (0, -0.048, 0.838), (0.038, 0.007, 0.009))
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    # A rusty round cap with a short brim.
    cap = Part("cap", RUST, "rhead", shade=0.14)
    top = R_HEAD_C + Vector((0, 0.004, 0.018))
    verts = kit.sphere(cap.bm, top, (0.054, 0.058, 0.046), 12, 7)
    kit.bmesh.ops.delete(cap.bm, geom=[v for v in verts if v.co.z < top.z - 0.004], context="VERTS")
    brim = kit.cone(cap.bm, top + Vector((0, -0.03, -0.002)), top + Vector((0, -0.07, -0.01)), 0.044, 0.03, 8, squash=0.25)
    cap.paint(faces_of(brim), RUST_DARK)
    band = kit.cone(cap.bm, top, top + Vector((0, 0, 0.01)), 0.055, 0.054, 12)
    cap.paint(faces_of(band), LEATHER_DARK)
    parts.append(cap)

    neck = Part("rneck", BONE_DARK, "torso")
    kit.cone(neck.bm, (0, 0.004, NECK_Z - 0.02), (0, 0.004, 0.84), 0.011, 0.01, 5)
    parts.append(neck)

    # A ragged brown coat over the ribs, with a teal scarf that flies back.
    torso = Part("rtorso", COAT_RAG, torso_weights, shade=0.14)
    kit.cone(torso.bm, (0, 0.01, SEAT_Z + 0.02), (0, 0.01, NECK_Z - 0.005), 0.05, 0.058, 10, squash=0.8)
    for z in (0.73, 0.76):
        rib = kit.tube(torso.bm, [(-0.03, -0.042, z), (0, -0.05, z + 0.006), (0.03, -0.042, z)], [0.005] * 3, 4)
        torso.paint(faces_of(rib), BONE)
    belt = kit.torus(torso.bm, (0, 0.01, WAIST_Z), (0, 0, 1), 0.052, 0.006, 10, 3)
    torso.paint(faces_of(belt), LEATHER_DARK)
    parts.append(torso)

    def skirt_color(row, column):
        return COAT_RAG_DARK if column % 3 == 1 or row >= 2 else COAT_RAG

    skirt = Part("rskirt", COAT_RAG, "seat", shade=0.1)
    kit.ragged_cone(skirt, WAIST_Z, SEAT_Z - 0.05, 0.054, 0.085, 12, 3, 0.85, 0.03, skirt_color, COAT_RAG_DARK, gap=math.radians(30), y_push=0.04)
    parts.append(skirt)

    scarf = Part("scarf", TEAL, lambda co: blend("scarf", "torso", co.y, 0.04, 0.02), shade=0.08)
    kit.torus(scarf.bm, (0, 0.004, NECK_Z - 0.004), (0, 0.15, 1), 0.04, 0.012, 10, 4)
    for index, sign in enumerate((1, -1)):
        tail = kit.cone(scarf.bm, (0.01 * sign, 0.04, NECK_Z - 0.01), (0.03 * sign, 0.16 + 0.03 * index, NECK_Z - 0.03 - 0.02 * index), 0.016, 0.004, 4, squash=0.3)
        scarf.paint(faces_of(tail), TEAL_DARK if index else TEAL)
    parts.append(scarf)

    # The empty scroll tube hangs at his right hip, on a strap over his left shoulder.
    tube = Part("scrollTube", LEATHER, torso_weights, shade=0.08)
    kit.cone(tube.bm, SCROLL + Vector((0, 0.06, 0.04)), SCROLL + Vector((0, -0.07, -0.02)), 0.02, 0.02, 8)
    for end in (SCROLL + Vector((0, 0.064, 0.042)), SCROLL + Vector((0, -0.074, -0.022))):
        cap_ = kit.sphere(tube.bm, end, (0.022, 0.012, 0.022), 6, 4)
        tube.paint(faces_of(cap_), RUST)
    strap = kit.tube(tube.bm, [SCROLL + Vector((0.01, 0.0, 0.02)), (-0.04, -0.045, 0.76), (0.05, -0.02, 0.795)], [0.005] * 3, 4)
    tube.paint(faces_of(strap), LEATHER_DARK)
    parts.append(tube)

    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"rupper.{side}", COAT_RAG, f"upperarm.{side}", shade=0.08)
        kit.cone(upper.bm, s, e, 0.02, 0.018, 7)
        parts.append(upper)

        forearm = Part(f"rforearm.{side}", BONE, f"forearm.{side}", shade=0.08)
        kit.cone(forearm.bm, e, w, 0.011, 0.01, 5)
        hand = kit.sphere(forearm.bm, w + d * 0.014, (0.014, 0.013, 0.015), 6, 4)
        forearm.paint(faces_of(hand), BONE)
        cuff = kit.cone(forearm.bm, e - d * 0.006, e + d * 0.03, 0.02, 0.018, 7)
        forearm.paint(faces_of(cuff), COAT_RAG_DARK)
        parts.append(forearm)

        hip = Vector((HIP_X * sign, 0.01, SEAT_Z))
        knee = Vector((KNEE.x * sign, KNEE.y, KNEE.z))
        foot = Vector((FOOT.x * sign, FOOT.y, FOOT.z))
        thigh = Part(f"rthigh.{side}", BONE, f"thigh.{side}", shade=0.1)
        kit.cone(thigh.bm, hip, knee, 0.014, 0.012, 6)
        cap_ = kit.sphere(thigh.bm, knee + Vector((0, -0.01, 0.004)), (0.016, 0.015, 0.016), 6, 4)
        thigh.paint(faces_of(cap_), BONE_DARK)
        parts.append(thigh)

        shin = Part(f"rshin.{side}", LEATHER, f"shin.{side}", shade=0.1)
        kit.cone(shin.bm, knee - (knee - foot).normalized() * 0.02, foot + Vector((0, 0, 0.02)), 0.02, 0.019, 7)
        boot = kit.box(shin.bm, foot + Vector((0, -0.022, 0.0)), (0.03, 0.065, 0.03))
        shin.paint(faces_of(boot), LEATHER_DARK)
        stirrup = kit.torus(shin.bm, foot + Vector((0, -0.016, -0.012)), (0, 1, 0), 0.02, 0.0035, 8, 3)
        shin.paint(faces_of(stirrup), BRASS)
        parts.append(shin)

    # The reins, from each hand to the bit.
    for side, hand in (("L", HAND_L), ("R", HAND_R)):
        sign = 1 if side == "L" else -1
        rein = Part(f"rein.{side}", LEATHER_DARK, rein_weights(side), shade=0.0)
        kit.tube(rein.bm, [hand, hand + Vector((0.01 * sign, -0.07, -0.02)), Vector((0.04 * sign, -0.3, 0.7)), NOSE + Vector((0.045 * sign, 0.05, -0.02))], [0.004] * 4, 4)
        parts.append(rein)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("PaleGalloper", BONES)
    parts = pony_parts() + rider_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "PaleGalloperMesh")
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
            result[key.replace("__", ".").replace("_at_", "@").replace("_slash_", "/")] = value
        return result

    def legs(**angles):
        """Leg swings: `FL=(upper, lower)` in degrees about X. A negative upper swings forward."""
        result = {}
        for leg, (upper, lower) in angles.items():
            result[f"upper__{leg}"] = t(f"upper.{leg}", (X, upper))
            result[f"lower__{leg}"] = t(f"lower.{leg}", (X, lower))
        return result

    def stand(breath=0.0, paw=0.0, chatter=0.0, look=0.0):
        """
        At rest: the pony lifts its head and grins, and paws the ground with
        its right front hoof (`paw`). The rider leans back, stiff, the reins
        tight, and his jaw chatters (`chatter`). `look` turns his skull to
        the camera side.
        """
        return pose(
            {
                "body@loc": at("body", (0, 0, -breath * 0.004)),
                "body": t("body", (Z, -6), (X, -breath)),
                "chest": t("chest", (X, -breath)),
                "neck": t("neck", (X, -8 + breath * 3), (Z, 4)),
                "head": t("head", (X, 6 - breath * 4), (Z, 6)),
                "jaw": t("jaw", (X, 14 + breath * 4)),
                "tail": t("tail", (Z, 10 * paw), (X, -10)),
                "seat": t("seat", (Z, 6), (X, -4)),
                "torso": t("torso", (X, -16 - breath * 2), (Z, -look * 10)),
                "rhead": t("rhead", (X, 6), (Z, -look * 30), (Y, -look * 8)),
                "rjaw": t("rjaw", (X, 4 + chatter * 18)),
                "scarf": t("scarf", (X, 6 + breath * 4)),
                "upperarm.L": t("upperarm.L", (X, -breath * 2)),
                "upperarm.R": t("upperarm.R", (X, -breath * 2)),
                "thigh.L": t("thigh.L", (X, 4)),
                "thigh.R": t("thigh.R", (X, 4)),
                "spray@scale": 0.05,
            },
            **legs(FR=(-34 * paw, 70 * paw), FL=(0, 0), BL=(0, 0), BR=(0, 0)),
        )

    def weary(breath=0.0):
        """Low HP: the pony hangs its head, and the rider hunches on its neck, the jaw open."""
        return pose(
            stand(),
            body=t("body", (Z, -6), (X, 4)),
            neck=t("neck", (X, 30 + breath * 4), (Z, 4)),
            head=t("head", (X, 16 + breath * 4)),
            jaw=t("jaw", (X, 6)),
            tail=t("tail", (X, 14)),
            seat=t("seat", (Z, 6), (X, 10)),
            torso=t("torso", (X, 26 + breath * 4)),
            rhead=t("rhead", (X, -10), (Y, -10)),
            rjaw=t("rjaw", (X, 20)),
            scarf=t("scarf", (X, -20)),
            upperarm__L=t("upperarm.L", (X, 20)),
            upperarm__R=t("upperarm.R", (X, 20)),
            **legs(FL=(-6, 8), FR=(-4, 6), BL=(8, -4), BR=(6, -4)),
        )

    def recoil(base, amount=1.0):
        """The hit: the pony shies back, and the rider almost falls off."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0.03 * amount, 0.0)),
            body=t("body", (Z, -6), (X, -6 * amount)),
            neck=t("neck", (X, -20 * amount), (Z, 10 * amount)),
            head=t("head", (X, -10 * amount)),
            jaw=t("jaw", (X, 24 * amount)),
            tail=t("tail", (X, -30 * amount)),
            torso=t("torso", (X, -30 * amount), (Z, 10 * amount)),
            rhead=t("rhead", (X, -20 * amount)),
            rjaw=t("rjaw", (X, 26 * amount)),
            scarf=t("scarf", (X, 20 * amount)),
            upperarm__L=t("upperarm.L", (X, -40 * amount), (Y, -20 * amount)),
            upperarm__R=t("upperarm.R", (X, -40 * amount), (Y, 20 * amount)),
            **legs(FL=(-20 * amount, 30 * amount), FR=(-30 * amount, 50 * amount), BL=(-10 * amount, 6 * amount), BR=(-10 * amount, 6 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.02, -0.06)),
            body=t("body", (Z, -6), (X, 8), (Y, -8)),
            neck=t("neck", (X, 30)),
            head=t("head", (X, 20)),
            torso=t("torso", (X, 20), (Y, 10)),
            rhead=t("rhead", (X, 16)),
            rjaw=t("rjaw", (X, 24)),
            **legs(FL=(-10, 50), FR=(10, 60), BL=(-20, 40), BR=(-10, 30)),
        )

    def fallen(base, bounce=0.0):
        """On its left side, the legs out to the camera side, the rider still in the saddle."""
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.4, 0, 0.1)),
            body_at_loc=at("body", (0, 0, 0)),
            body=t("body", (Z, -4)),
            neck=t("neck", (X, 10), (Y, 20)),
            head=t("head", (X, -6), (Y, 10)),
            jaw=t("jaw", (X, 20)),
            tail=t("tail", (X, -20), (Y, 20)),
            seat=t("seat", (Z, 0), (Y, -30)),
            torso=t("torso", (X, -20)),
            rhead=t("rhead", (Z, -30)),
            rjaw=t("rjaw", (X, 26)),
            scarf=t("scarf", (X, -30)),
            upperarm__L=t("upperarm.L", (Y, -40)),
            upperarm__R=t("upperarm.R", (Y, 50)),
            thigh__L=t("thigh.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -40), (Y, 30)),
            **legs(FL=(-40, 20), FR=(-20, 10), BL=(30, 10), BR=(10, 6)),
        )

    def rear(base, height=1.0):
        """The pony rears up on its back legs, happy, and the rider clings on: a summon and a Rebirth."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0.02 * height, 0.0)),
            body=t("body", (Z, -6), (X, -34 * height)),
            neck=t("neck", (X, 10 * height)),
            head=t("head", (X, 10 * height)),
            jaw=t("jaw", (X, 24)),
            tail=t("tail", (X, 40 * height)),
            seat=t("seat", (Z, 6), (X, 24 * height)),
            torso=t("torso", (X, 16 * height)),
            rhead=t("rhead", (X, -10 * height)),
            rjaw=t("rjaw", (X, 24)),
            scarf=t("scarf", (X, 30 * height)),
            spray_at_scale=0.6 * height,
            **legs(FL=(-60 * height, 100 * height), FR=(-40 * height, 80 * height), BL=(34 * height, -10 * height), BR=(30 * height, -6 * height)),
        )

    def low(base):
        """Down low with the legs folded, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0, -0.18)),
            neck=t("neck", (X, 20)),
            head=t("head", (X, 10)),
            tail=t("tail", (X, 20)),
            torso=t("torso", (X, 10)),
            rhead=t("rhead", (X, 10), (Z, -20)),
            **legs(FL=(-70, 130), FR=(-70, 130), BL=(-80, 120), BR=(-80, 120)),
        )

    def gallop(phase):
        """
        A gallop pose for Swift. `phase` 0 has the legs stretched out, 0.5 has
        them gathered under the body; the rider bounces and leans far back,
        and the ice bursts when the front hooves land.
        """
        a = phase * 2 * math.pi
        reach = math.cos(a)
        lift = math.sin(a)
        return pose(
            stand(),
            body_at_loc=at("body", (0, 0, 0.02 + 0.03 * max(0.0, -reach))),
            body=t("body", (Z, -6), (X, 6 * lift)),
            neck=t("neck", (X, 10 - 12 * lift)),
            head=t("head", (X, 4 * lift)),
            jaw=t("jaw", (X, 20 + 6 * lift)),
            tail=t("tail", (X, -40 + 8 * lift)),
            seat=t("seat", (Z, 6), (X, -8)),
            seat_at_loc=at("seat", (0, 0, 0.025 * max(0.0, reach))),
            torso=t("torso", (X, -24 + 6 * lift)),
            rhead=t("rhead", (X, -4 - 8 * lift), (Z, -10)),
            rjaw=t("rjaw", (X, 10 + 14 * max(0.0, lift))),
            scarf=t("scarf", (X, 50 + 10 * lift)),
            spray_at_scale=0.05 + 0.9 * max(0.0, reach),
            **legs(
                FL=(-40 * reach + 6, 50 + 40 * max(0.0, -reach)),
                FR=(-34 * reach + 14, 40 + 50 * max(0.0, -lift)),
                BL=(34 * reach - 6, 20 + 30 * max(0.0, -reach)),
                BR=(30 * reach - 14, 20 + 30 * max(0.0, lift)),
            ),
        )

    # The attack is the Charge: the pony gathers, then surges forward, and
    # the ice bursts. The rider holds on, his skull thrown back. The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # pony strikes at frame 15 of 30.
    def gather(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.05, -0.03)),
            body=t("body", (Z, -6), (X, -10)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 4)),
            tail=t("tail", (X, -20)),
            torso=t("torso", (X, -4)),
            rhead=t("rhead", (X, 4), (Z, 10)),
            rjaw=t("rjaw", (X, 22)),
            scarf=t("scarf", (X, 10)),
            spray_at_scale=0.2,
            **legs(FL=(-20, 40), FR=(-50, 90), BL=(-24, 30), BR=(-20, 24)),
        )

    def surge(base, burst=1.6):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.12, 0)),
            body_at_loc=at("body", (0, 0, 0.03)),
            body=t("body", (Z, -4), (X, 6)),
            neck=t("neck", (X, 20)),
            head=t("head", (X, -6)),
            jaw=t("jaw", (X, 26)),
            tail=t("tail", (X, -50)),
            torso=t("torso", (X, -30)),
            rhead=t("rhead", (X, -24)),
            rjaw=t("rjaw", (X, 28)),
            scarf=t("scarf", (X, 60)),
            upperarm__L=t("upperarm.L", (X, -20)),
            upperarm__R=t("upperarm.R", (X, -20)),
            spray_at_loc=at("spray", (0, -0.12, 0)),
            spray_at_scale=burst,
            **legs(FL=(-50, 20), FR=(-40, 30), BL=(40, 10), BR=(30, 20)),
        )

    clips = []
    idle = Clip("idle", 72, loop=True)
    for frame, breath, paw, chatter, look in (
        (0, 0, 0, 0, 0),
        (6, 0.2, 0, 1, 0),
        (10, 0.3, 0, 0, 0),
        (14, 0.4, 0, 1, 0),
        (22, 0.8, 0, 0, 1),
        (30, 1, 0, 1, 1),
        (36, 0.8, 1, 0, 0),
        (42, 0.6, 0, 1, 0),
        (48, 0.4, 1, 0, 0),
        (56, 0.3, 0, 1, 0),
        (72, 0, 0, 0, 0),
    ):
        idle.key(frame, stand(breath, paw, chatter, look))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, weary(breath))
    clips.append(low_hp)

    # A gallop (Swift): a short, fast cycle.
    walk = Clip("walk", 16, loop=True)
    for frame in (0, 4, 8, 12, 16):
        walk.key(frame, gallop(frame / 16))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, gather(stand())).key(15, surge(stand())).key(20, surge(stand(), 0.7))
    attack.key(27, stand()).key(30, stand())
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
    rebirth.key(31, low(stand())).key(40, rear(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, pose(low(stand()), body_at_loc=at("body", (0, 0, -0.2))))
    summon.key(16, rear(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "pale-galloper.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
