"""
Badland Runt (`orc.badlandRunt`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a young orc boy, the smallest of
the warband, with big ears, small new tusks and a mouth open in a war cry.
He wears an adult iron helmet with spikes that is too big for him: it tips
to his right and falls over his right eye, on the camera side. He has
orange war paint stripes, a fang necklace, a ragged hide kilt, leather
bracers and big boots with bone spikes. He holds a short bone knife up in
his right hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/badland-runt.glb`; then
`bun unit-model:pack badland-runt` packs it for the game.

He is very small, but he acts very fierce: his idle bounces on his toes and
yells, and the helmet slips down until he shakes it up again. The `jaw` bone
opens his mouth for the war cry. He has Swift, so his walk is a fast
scamper with small hops. His attack is a jump forward with a stab of the
knife. The spare knife in his right boot shows Last Breath. He has no
Keyword that he uses by his own action, so he has no cast clip. The helmet
falls off in the death clip.
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

SKIN = hex_color("#b0b24a")
SKIN_DARK = hex_color("#7e8034")
EYE_WHITE = hex_color("#efe6c4")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#3e1410")
TONGUE = hex_color("#b8443a")
TUSK = hex_color("#f0e6c8")
PAINT = hex_color("#de6a26")
IRON = hex_color("#7a6656")
IRON_DARK = hex_color("#4e4038")
RUST = hex_color("#a8552e")
BONE = hex_color("#e6dbbe")
BONE_DARK = hex_color("#a99a78")
LEATHER = hex_color("#6a4630")
LEATHER_DARK = hex_color("#3e2a1c")
HIDE = hex_color("#8c6a48")
HIDE_DARK = hex_color("#5e4630")
CLOTH = hex_color("#b03a26")

# --- Proportions ---------------------------------------------------------------

# A child: short legs, a round belly and a big head.
HIP_Z = 0.29
WAIST_Z = 0.34
CHEST_Z = 0.39
SHOULDER_Z = 0.44
NECK_Z = 0.46
HEAD_C = Vector((0, -0.015, 0.555))
KNEE_Z = 0.165
ANKLE_Z = 0.05
LEG_X = 0.05

# The arms hang out to the sides at rest (the bind pose). The clips lift them.
SR = Vector((-0.1, 0, SHOULDER_Z))
ER = Vector((-0.145, -0.005, 0.36))
WR = Vector((-0.172, -0.02, 0.285))
TR = WR + (WR - ER).normalized() * 0.04
SL = Vector((0.1, 0, SHOULDER_Z))
EL = Vector((0.145, -0.005, 0.36))
WL = Vector((0.172, -0.02, 0.285))
TL = WL + (WL - EL).normalized() * 0.04

# The knife sticks out of the thumb side of the right fist, to the front.
GRIP_R = WR + (WR - ER).normalized() * 0.03
BLADE = Vector((0, -1, 0.2)).normalized()

# The helmet tips to his right, over his right eye.
HELMET_C = HEAD_C + Vector((-0.006, 0.004, 0.026))
HELMET_TILT = math.radians(-15)

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.005, NECK_Z), (0, -0.01, 0.49), "chest"),
    ("head", (0, -0.01, 0.49), (0, -0.015, 0.63), "neck"),
    ("jaw", tuple(HEAD_C + Vector((0, 0.0, -0.03))), tuple(HEAD_C + Vector((0, -0.06, -0.07))), "head"),
    ("helmet", tuple(HELMET_C), tuple(HELMET_C + Z * 0.08), "head"),
    ("kilt.F", (0, -0.07, 0.3), (0, -0.08, 0.17), "hips"),
    ("kilt.B", (0, 0.07, 0.3), (0, 0.08, 0.17), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.025 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.31, 0.37)
    return blend("spine", "chest", co.z, 0.37, 0.42)


def kilt_weights(co):
    bone = "kilt.F" if co.y < 0 else "kilt.B"
    return blend(bone, "hips", co.z, 0.25, 0.29)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.068, 0.066, 0.07), 12, 9)
    # The upper muzzle with a wide nose.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.042, -0.018)), (0.048, 0.034, 0.026), 10, 6)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.07, -0.004)), (0.016, 0.012, 0.011), 6, 4)
    # Big ears that stick out under the helmet, a little up.
    for sign in (1, -1):
        ear = kit.cone(head.bm, HEAD_C + Vector((0.06 * sign, 0.006, 0.0)), HEAD_C + Vector((0.165 * sign, 0.035, 0.045)), 0.03, 0.002, 6, squash=0.4)
        head.paint(faces_of(ear), SKIN)
        inner = kit.cone(head.bm, HEAD_C + Vector((0.07 * sign, 0.0, 0.0)), HEAD_C + Vector((0.14 * sign, 0.022, 0.034)), 0.018, 0.002, 5, squash=0.2)
        head.paint(faces_of(inner), SKIN_DARK)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        white = kit.sphere(face.bm, HEAD_C + Vector((0.026 * sign, -0.058, 0.016)), (0.014, 0.008, 0.011), 8, 5)
        face.paint(faces_of(white), EYE_WHITE)
        kit.sphere(face.bm, HEAD_C + Vector((0.024 * sign, -0.065, 0.014)), (0.006, 0.004, 0.006), 6, 4)
        # Fierce brows, low at the middle.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.064, 0.032)), (0.02, 0.0, 0.007 * sign), (0, 0.006, 0), (0.0, 0.0, 0.005))
        face.paint(faces_of(brow), SKIN_DARK)
        # Two orange paint stripes on each cheek.
        for k, dz in enumerate((-0.006, -0.022)):
            stripe = kit.slab(face.bm, HEAD_C + Vector((0.046 * sign, -0.048 + k * 0.004, dz)), (0.016, 0.006 * sign, 0.006), (0, 0.004, 0), (0, 0, 0.004))
            face.paint(faces_of(stripe), PAINT)
    # A paint stripe down the brow and nose.
    stripe = kit.slab(face.bm, HEAD_C + Vector((0.0, -0.066, 0.024)), (0.005, 0, 0), (0, 0.004, 0), (0, 0, 0.02))
    face.paint(faces_of(stripe), PAINT)
    # The open mouth: the dark inside, and a row of small upper teeth.
    kit.sphere(face.bm, HEAD_C + Vector((0, -0.05, -0.046)), (0.036, 0.026, 0.026), 10, 6)
    teeth = kit.slab(face.bm, HEAD_C + Vector((0, -0.072, -0.034)), (0.026, 0, 0), (0, 0.004, 0), (0, 0, 0.004))
    face.paint(faces_of(teeth), TUSK)
    parts.append(face)

    # The lower jaw, with the tongue and two small new tusks.
    jaw = Part("jaw", SKIN, "jaw", shade=0.08)
    kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.036, -0.072)), (0.046, 0.04, 0.02), 10, 6)
    tongue = kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.05, -0.062)), (0.022, 0.018, 0.008), 8, 4)
    jaw.paint(faces_of(tongue), TONGUE)
    for sign in (1, -1):
        tusk = kit.cone(jaw.bm, HEAD_C + Vector((0.024 * sign, -0.068, -0.064)), HEAD_C + Vector((0.027 * sign, -0.074, -0.038)), 0.007, 0.001, 5)
        jaw.paint(faces_of(tusk), TUSK)
    parts.append(jaw)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.005, 0.43), (0, -0.01, 0.51), 0.034, 0.032, 8)
    parts.append(neck)
    return parts


def helmet_part():
    """The adult helmet: a dome with a brim, rivets, rust and a ring of spikes."""
    part = Part("helmet", IRON, "helmet", shade=0.16)
    bm = part.bm
    dome = kit.sphere(bm, HELMET_C, (0.1, 0.102, 0.082), 14, 10)
    kit.bmesh.ops.delete(bm, geom=[v for v in dome if v.co.z < HELMET_C.z - 0.004], context="VERTS")
    for face in bm.faces:
        c = face.calc_center_median()
        if int(c.x * 70 + c.y * 50 + c.z * 90) % 4 == 0:
            part.paint([face], RUST)
    brim = kit.torus(bm, HELMET_C + Z * 0.002, Z, 0.104, 0.013, 18, 4)
    part.paint(faces_of(brim), IRON_DARK)
    # A band of rivets round the dome.
    for k in range(12):
        a = 2 * math.pi * k / 12
        rivet = kit.sphere(bm, HELMET_C + Vector((0.098 * math.cos(a), 0.1 * math.sin(a), 0.016)), (0.006, 0.006, 0.006), 4, 3)
        part.paint(faces_of(rivet), IRON_DARK)
    # A ring of short spikes, and a tall one on the top.
    for k in range(6):
        a = 2 * math.pi * (k + 0.5) / 6
        out = Vector((math.cos(a), math.sin(a), 0))
        foot = HELMET_C + out * 0.066 + Z * 0.055
        spike = kit.cone(bm, foot, foot + (out * 0.6 + Z).normalized() * 0.045, 0.012, 0.001, 5)
        part.paint(faces_of(spike), IRON_DARK if k % 2 else IRON)
    top = kit.cone(bm, HELMET_C + Z * 0.076, HELMET_C + Z * 0.14, 0.017, 0.001, 6)
    part.paint(faces_of(top), IRON_DARK)
    # The helmet tips to his right (the -X side goes down), over his right eye.
    pivot = HELMET_C + Vector((0.04, 0, 0))
    bmesh_rotate = Matrix.Translation(pivot) @ Matrix.Rotation(HELMET_TILT, 4, "Y") @ Matrix.Translation(-pivot)
    kit.bmesh.ops.transform(bm, matrix=bmesh_rotate, verts=list(bm.verts))
    return [part]


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    kit.sphere(torso.bm, (0, 0.0, 0.405), (0.09, 0.062, 0.06), 12, 8)
    # A round belly.
    kit.sphere(torso.bm, (0, -0.012, 0.335), (0.082, 0.07, 0.07), 12, 8)
    for z in (0.39, 0.415):
        stripe = kit.slab(torso.bm, (0.03, -0.058, z), (0.026, 0, -0.006), (0, 0.004, 0), (0, 0, 0.005))
        torso.paint(faces_of(stripe), PAINT)
    parts.append(torso)

    # The fang necklace, a strap across the chest, the belt and a red rag.
    harness = Part("harness", LEATHER, torso_weights, shade=0.05)
    kit.torus(harness.bm, (0, -0.005, 0.44), (0, 0.25, 1), 0.05, 0.006, 14, 4)
    for k in range(5):
        a = math.radians(-60 + 30 * k)
        p = Vector((0.05 * math.sin(a), -0.005 - 0.05 * math.cos(a), 0.44 - 0.012))
        fang = kit.cone(harness.bm, p, p + Vector((0, -0.006, -0.03)), 0.007, 0.001, 4)
        harness.paint(faces_of(fang), BONE if k % 2 == 0 else BONE_DARK)
    kit.tube(harness.bm, [(0.075, 0.03, 0.44), (0.07, -0.05, 0.42), (0.0, -0.075, 0.37), (-0.07, -0.06, 0.3)], [0.009] * 4, 4)
    belt = kit.cone(harness.bm, (0, -0.006, 0.28), (0, -0.006, 0.305), 0.083, 0.084, 12, squash=0.86)
    harness.paint(faces_of(belt), LEATHER_DARK)
    ring = kit.torus(harness.bm, (0.0, -0.078, 0.29), (0, -1, 0), 0.016, 0.004, 10, 4)
    harness.paint(faces_of(ring), IRON)
    rag = kit.cone(harness.bm, (0.06, 0.05, 0.3), (0.08, 0.1, 0.2), 0.022, 0.006, 5, squash=0.3)
    harness.paint(faces_of(rag), CLOTH)
    parts.append(harness)

    # The ragged hide kilt, in a front flap and a back flap.
    def kilt_color(face_side, row, column):
        if face_side == "back":
            return HIDE_DARK
        return HIDE_DARK if row == 2 or column % 3 == 1 else HIDE

    for name, sign in (("kilt.F", -1), ("kilt.B", 1)):
        kilt = Part(name, HIDE, kilt_weights, shade=0.1)

        def grid(inset, sign=sign):
            result = []
            for row in range(4):
                v = row / 3
                line = []
                for c in range(7):
                    u = lerp(-1, 1, c / 6)
                    angle = u * math.radians(80)
                    radius = lerp(0.085, 0.1, v) - inset
                    tear = 0.035 * v * ((c * 5) % 3) / 2
                    line.append((radius * math.sin(angle), sign * radius * math.cos(angle) * 0.86, lerp(0.3, 0.19 + tear, v)))
                result.append(line)
            return result

        kit.panel(kilt, grid(0.0), grid(0.006), kilt_color)
        parts.append(kilt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.006 * sign, 0, -0.006)), (0.034, 0.032, 0.034), 8, 6)
        kit.cone(upper.bm, s, e, 0.03, 0.025, 8)
        stripe = kit.cone(upper.bm, s + (e - s) * 0.5, s + (e - s) * 0.6, 0.031, 0.03, 8)
        upper.paint(faces_of(stripe), PAINT)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.025, 0.022, 8)
        parts.append(forearm)

        # Leather bracers with straps and a fur cuff.
        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        verts = kit.cone(bracer.bm, e + d * 0.025, w - d * 0.004, 0.03, 0.027, 8)
        for face in faces_of(verts):
            if int(((face.calc_center_median() - e).dot(d)) * 110) % 3 == 0:
                bracer.paint([face], LEATHER_DARK)
        cuff = kit.torus(bracer.bm, e + d * 0.025, d, 0.03, 0.008, 10, 4)
        bracer.paint(faces_of(cuff), HIDE)
        parts.append(bracer)

        # Big hands for a small boy.
        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.026, 0.024, 0.028), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.042, 0.032, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", SKIN, f"shin.{side}", shade=0.1)
        kit.sphere(shin.bm, knee, (0.032, 0.032, 0.03), 8, 6)
        kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.06)), 0.03, 0.028, 8)
        parts.append(shin)

        # Big boots with straps and a bone spike on the outside.
        boot = Part(f"boot.{side}", LEATHER, f"foot.{side}", shade=0.08)
        verts = kit.cone(boot.bm, ankle + Vector((0, 0, 0.075)), ankle - Vector((0, 0, 0.03)), 0.04, 0.044, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 70) % 2 == 0:
                boot.paint([face], LEATHER_DARK)
        top = kit.torus(boot.bm, ankle + Vector((0, 0, 0.075)), Z, 0.042, 0.008, 10, 4)
        boot.paint(faces_of(top), HIDE)
        toe = kit.box(boot.bm, (LEG_X * sign, -0.032, 0.022), (0.068, 0.13, 0.044))
        boot.paint(faces_of(toe), LEATHER_DARK)
        spike = kit.cone(boot.bm, ankle + Vector((0.038 * sign, 0, 0.04)), ankle + Vector((0.07 * sign, 0.015, 0.07)), 0.01, 0.001, 4)
        boot.paint(faces_of(spike), BONE)
        if side == "R":
            # The spare knife in his right boot, on the camera side (Last Breath).
            handle = kit.cone(boot.bm, ankle + Vector((-0.036, 0.01, 0.05)), ankle + Vector((-0.044, 0.012, 0.11)), 0.008, 0.008, 5)
            boot.paint(faces_of(handle), LEATHER_DARK)
            pommel = kit.sphere(boot.bm, ankle + Vector((-0.045, 0.012, 0.115)), (0.011, 0.011, 0.009), 5, 4)
            boot.paint(faces_of(pommel), BONE)
        parts.append(boot)
    return parts


def knife_part():
    """A short bone knife with a jagged back, a leather grip and a pommel."""
    part = Part("knife", BONE, "hand.R", shade=0.06)
    base = GRIP_R + BLADE * 0.022
    kit.cone(part.bm, base, base + BLADE * 0.14, 0.02, 0.002, 6, squash=0.3)
    # Notches on the back edge.
    up = BLADE.cross(X).normalized()
    if up.z < 0:
        up = -up
    for k in range(3):
        p = base + BLADE * (0.03 + k * 0.03) + up * 0.012
        notch = kit.cone(part.bm, p, p + up * 0.012 - BLADE * 0.008, 0.006, 0.001, 4)
        part.paint(faces_of(notch), BONE_DARK)
    guard = kit.sphere(part.bm, base, (0.016, 0.012, 0.016), 6, 4)
    part.paint(faces_of(guard), BONE_DARK)
    grip = kit.cone(part.bm, base, GRIP_R - BLADE * 0.035, 0.009, 0.008, 6)
    part.paint(faces_of(grip), LEATHER_DARK)
    pommel = kit.sphere(part.bm, GRIP_R - BLADE * 0.038, (0.01, 0.01, 0.01), 5, 4)
    part.paint(faces_of(pommel), BONE)
    return [part]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BadlandRunt", BONES)
    parts = head_parts() + helmet_part() + body_parts() + limb_parts() + knife_part()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BadlandRuntMesh")
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

    def stand(cry=0.5, bounce=0.0, slip=0.0, shake=0.0):
        """
        The idle: a wide, low stance on his toes, the knife up in his right
        hand and the left hand out as a claw. `cry` opens the mouth,
        `bounce` lifts him, `slip` tips the helmet further over his eye and
        `shake` turns his head.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.03 + bounce * 0.03)),
            "hips": t("hips", (Z, -8), (X, 4)),
            "spine": t("spine", (X, 10 - bounce * 4)),
            "chest": t("chest", (X, -4 - cry * 6), (Z, -6)),
            "neck": t("neck", (X, -8)),
            "head": t("head", (X, -12 - cry * 8), (Z, -16 + shake * 18), (Y, shake * 6)),
            "jaw": t("jaw", (X, 6 + cry * 22)),
            "helmet": t("helmet", (Y, -5 * slip), (X, 4 * slip)),
            "helmet@loc": at("helmet", (0, -0.003 * slip, -0.006 * slip)),
            "upperarm.R": t("upperarm.R", (X, -60 - bounce * 8), (Y, 80)),
            "forearm.R": t("forearm.R", (X, -80 + bounce * 10)),
            "hand.R": t("hand.R", (Z, -100)),
            "upperarm.L": t("upperarm.L", (X, -50), (Y, -24)),
            "forearm.L": t("forearm.L", (X, -40)),
            "hand.L": t("hand.L", (X, -20)),
            "thigh.L": t("thigh.L", (X, -34), (Y, -10)),
            "shin.L": t("shin.L", (X, 36)),
            "foot.L": t("foot.L", (X, -2 - bounce * 10)),
            "thigh.R": t("thigh.R", (X, 14), (Y, 10)),
            "shin.R": t("shin.R", (X, 26)),
            "foot.R": t("foot.R", (X, -34 - bounce * 10)),
            "kilt.F": t("kilt.F", (X, -16 + bounce * 8)),
            "kilt.B": t("kilt.B", (X, 10 - bounce * 6)),
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, the helmet over both eyes, the knife still up."""
        return pose(
            stand(cry=0.2 + breath * 0.3, slip=2.0),
            hips_at_loc=at("hips", (0, 0.02, -0.1 - breath * 0.004)),
            spine=t("spine", (X, 24 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2)),
            head=t("head", (X, 10 + breath * 4), (Z, 4)),
            upperarm__R=t("upperarm.R", (X, -100 + breath * 6), (Y, 24)),
            forearm__R=t("forearm.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, 4), (Y, -10)),
            forearm__L=t("forearm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, -74), (Y, -6)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 10), (Y, 8)),
            shin__R=t("shin.R", (X, 98)),
            foot__R=t("foot.R", (X, -40)),
            kilt__F=t("kilt.F", (X, -40)),
        )

    def recoil(base, amount=1.0):
        """A hit knocks him back, and the helmet jumps on his head."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04 * amount, -0.02)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (X, -20 * amount), (Z, -10 * amount)),
            jaw=t("jaw", (X, 30 * amount)),
            helmet=t("helmet", (X, -16 * amount), (Y, 10 * amount)),
            helmet_at_loc=at("helmet", (0, 0, 0.02 * amount)),
            upperarm__R=t("upperarm.R", (X, -110), (Y, 50 * amount)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, -50 * amount)),
            kilt__F=t("kilt.F", (X, -30 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.03)),
            hips=t("hips", (Z, -14)),
            spine=t("spine", (X, -12)),
            head=t("head", (X, -26)),
            helmet=t("helmet", (X, -30), (Y, 20)),
            helmet_at_loc=at("helmet", (0, 0.02, 0.03)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 20)),
            shin__R=t("shin.R", (X, 26)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 60)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, -60)),
        )

    def fallen(base, bounce=0.0, helmet_off=1.0):
        """Flat on his back, arms and legs out, and the helmet on the ground by his head."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.05)),
            hips_at_loc=at("hips", (0, 0, 0)),
            hips=t("hips", (Z, 0), (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, -24)),
            jaw=t("jaw", (X, 24)),
            helmet=t("helmet", (X, -70 * helmet_off), (Y, 30 * helmet_off)),
            helmet_at_loc=at("helmet", Vector((-0.06, -0.02, 0.1)) * helmet_off),
            upperarm__R=t("upperarm.R", (Y, 70), (X, 14)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, 0)),
            upperarm__L=t("upperarm.L", (Y, -70), (X, 14)),
            forearm__L=t("forearm.L", (X, -20)),
            thigh__L=t("thigh.L", (X, -20), (Y, -14)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -34), (Y, 14)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            kilt__F=t("kilt.F", (X, -50)),
            kilt__B=t("kilt.B", (X, 30)),
        )

    def crouch(base):
        """Very low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.11)),
            spine=t("spine", (X, 34)),
            chest=t("chest", (X, 12)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -12)),
            jaw=t("jaw", (X, 4)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -30)),
            thigh__R=t("thigh.R", (X, -56), (Y, 8)),
            shin__R=t("shin.R", (X, 106)),
            foot__R=t("foot.R", (X, -50)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, 20)),
            forearm__R=t("forearm.R", (X, -30)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, -20)),
            forearm__L=t("forearm.L", (X, -30)),
            kilt__F=t("kilt.F", (X, -50)),
        )

    def cry_out(base):
        """Up on his toes, both arms high and the mouth wide: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.0, 0.0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -12)),
            head=t("head", (X, -24)),
            jaw=t("jaw", (X, 34)),
            upperarm__R=t("upperarm.R", (X, -160), (Y, 40)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (X, -150), (Y, -40)),
            forearm__L=t("forearm.L", (X, -10)),
            thigh__L=t("thigh.L", (X, -10), (Y, -8)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, -20)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -30)),
        )

    def step(front, lift=0.0):
        """A fast scamper. `front` is 1 for the left foot, -1 for the right; `lift` is a small hop."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(cry=0.7, slip=0.5),
            hips_at_loc=at("hips", (0, 0.0, -0.025 + lift * 0.035)),
            hips=t("hips", (Z, -6 * front), (X, 8)),
            spine=t("spine", (X, 18), (Y, -4 * front)),
            chest=t("chest", (X, 0), (Z, -8 * front)),
            head=t("head", (X, -16), (Z, 6 * front)),
            upperarm__R=t("upperarm.R", (X, -60 + 14 * front), (Y, 80)),
            upperarm__L=t("upperarm.L", (X, -40 - 30 * front), (Y, -24)),
            kilt__F=t("kilt.F", (X, -34)),
            kilt__B=t("kilt.B", (X, 30)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -64 + lift * 10)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 50 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 20 - lift * 10)),
                f"shin__{back}": t(f"shin.{back}", (X, 40 + lift * 30)),
                f"foot__{back}": t(f"foot.{back}", (X, -16)),
            },
        )

    # The attack: he crouches, jumps forward with a yell and stabs down with
    # the knife. The slash effect starts at 50% of the attack (`MELEE_IMPACT`
    # in fx.ts), so the stab lands at frame 15 of 30.
    def wind_up(base):
        return pose(
            crouch(base),
            jaw=t("jaw", (X, 20)),
            upperarm__R=t("upperarm.R", (X, -170), (Y, 20)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, -20)),
        )

    def leap(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.08, 0.08)),
            hips=t("hips", (X, 10)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -20)),
            jaw=t("jaw", (X, 36)),
            upperarm__R=t("upperarm.R", (X, -175), (Y, 14)),
            forearm__R=t("forearm.R", (X, -20)),
            upperarm__L=t("upperarm.L", (X, -90), (Y, -30)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 70)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, 30), (Y, 8)),
            shin__R=t("shin.R", (X, 60)),
            foot__R=t("foot.R", (X, -30)),
            kilt__F=t("kilt.F", (X, -10)),
            kilt__B=t("kilt.B", (X, 40)),
        )

    def stab(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.12, -0.04)),
            hips=t("hips", (X, 10), (Z, 6)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 12), (Z, 6)),
            head=t("head", (X, -18)),
            jaw=t("jaw", (X, 26)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 60)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, -40)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 70)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 44)),
            foot__R=t("foot.R", (X, -30)),
            kilt__F=t("kilt.F", (X, -40)),
            kilt__B=t("kilt.B", (X, 20)),
        )

    clips = []
    # The idle: he bounces and yells, the helmet slips down, and he shakes it up again.
    idle = Clip("idle", 48, loop=True)
    for frame, cry, bounce, slip, shake in (
        (0, 0.5, 0, 0, 0),
        (6, 1, 1, 0.2, 0),
        (12, 0.4, 0, 0.4, 0),
        (18, 1, 1, 0.7, 0),
        (24, 0.3, 0, 1.4, 0),
        (30, 0.2, 0, 1.6, 0),
        (34, 0.6, 0, 0.8, 1),
        (38, 0.6, 0, 0.2, -1),
        (42, 0.8, 0.4, 0, 0.4),
        (48, 0.5, 0, 0, 0),
    ):
        idle.key(frame, stand(cry, bounce, slip, shake))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    # Swift: a fast scamper.
    walk = Clip("walk", 12, loop=True)
    walk.key(0, step(1)).key(3, step(1, 1)).key(6, step(-1)).key(9, step(-1, 1)).key(12, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(7, wind_up(stand())).key(11, leap(stand())).key(15, stab(stand())).key(19, stab(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up
    # and puts the helmet on again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand(cry=0, slip=1.5))).key(41, cry_out(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(cry=0))).key(10, pose(crouch(stand(cry=0)), hips_at_loc=at("hips", (0, 0.03, -0.1))))
    summon.key(17, cry_out(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "badland-runt.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
