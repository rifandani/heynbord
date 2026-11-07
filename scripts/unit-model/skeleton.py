"""
Skeleton (`token.skeleton`), a Token Unit Model (art direction 2.2).

A tabletop miniature of the Token painting: a small, eager skeleton soldier
with thin bones, a rusted bucket helmet that tips over his right eye socket,
a pale teal neck cloth, a ragged brown kilt on a leather belt, leather
wraps on the shins and old boots. He holds a chipped sword too high in his
right hand and a round wooden lid as a shield on his left arm. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/skeleton.glb`; then `bun unit-model:pack skeleton`
packs it for the game.

The Battle camera sees the right side of a player Unit, so the sword is in
the right hand, the flat of its blade faces the camera, and the helmet tips
over the right eye socket. The lid turns its face 25 degrees to the camera
side. He has Swarm, so he looks back over his right shoulder for an ally:
he is brave only while his friends follow him. Swarm is a passive Keyword,
so he has no cast clip. His walk is an eager march, and his attack is a wild
chop from high above his head. In the death he falls on his back and the
bucket helmet rolls off.
"""

import math
import os
import sys

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
importlib.reload(body_plans.biped_medium)
importlib.reload(clips.base)
importlib.reload(clips.overrides)
importlib.reload(clips.biped)
importlib.reload(clips.biped_medium)

from clips.base import Beat  # noqa: E402
from clips.overrides import Fall, Patch  # noqa: E402

from unit_model_kit import X, Y, Z, Part, blend, clamp01, faces_of, hex_color  # noqa: E402

plan = body_plans.BODY_PLANS["biped-medium"]

# --- Palette (the Token painting) ---------------------------------------------

BONE = hex_color("#e9ddc5")
BONE_DARK = hex_color("#afa288")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
TEAL = hex_color("#617874")
TEAL_DARK = hex_color("#48584f")
KILT = hex_color("#7a5a3c")
KILT_DARK = hex_color("#54402c")
LEATHER = hex_color("#6a4a2e")
LEATHER_DARK = hex_color("#45301e")
RUST = hex_color("#8a5a34")
RUST_DARK = hex_color("#5c3a22")
IRON = hex_color("#6f6a62")
BRASS = hex_color("#c49448")
WOOD = hex_color("#8a6a48")
WOOD_DARK = hex_color("#644a32")
LICHEN = hex_color("#7d8f6a")
STEEL = hex_color("#a9a49a")
STEEL_LIGHT = hex_color("#d6d1c4")

# --- Proportions ---------------------------------------------------------------

# A small, thin skeleton: thin bones and narrow hips show his low HP.
TABLE = plan.Proportions(
    hip_z=0.33,
    waist_z=0.39,
    chest_z=0.45,
    shoulder_z=0.53,
    neck_z=0.55,
    head_base_z=0.585,
    head_top_z=0.73,
    knee_z=0.175,
    ankle_z=0.045,
    head_base_y=-0.005,
    head_top_y=-0.01,
    shoulder_width=0.17,
    shoulder_root_x=0.02,
    hip_x=0.042,
    knee_x=0.042,
    root_tip_z=0.1,
    foot_tip_z=0.014,
)
HIP_Z = TABLE.hip_z
WAIST_Z = TABLE.waist_z
CHEST_Z = TABLE.chest_z
SHOULDER_Z = TABLE.shoulder_z
NECK_Z = TABLE.neck_z
HEAD_C = Vector((0, -0.015, 0.635))
KNEE_Z = TABLE.knee_z
ANKLE_Z = TABLE.ankle_z
LEG_X = TABLE.hip_x
THIGH = HIP_Z - KNEE_Z
SHIN = KNEE_Z - ANKLE_Z
UPPER_ARM = 0.1
FOREARM = 0.095


def bend(shoulder, wrist, out):
    """The elbow between `shoulder` and `wrist`, bent toward `out`."""
    d = wrist - shoulder
    length = d.length
    along = (UPPER_ARM**2 - FOREARM**2 + length**2) / (2 * length)
    height = math.sqrt(max(UPPER_ARM**2 - along**2, 0.0))
    side = Vector(out) - d.normalized() * Vector(out).dot(d.normalized())
    return shoulder + d.normalized() * along + side.normalized() * height


# The right arm holds the sword too high; the left arm holds the lid in front
# of the chest. These are the rest (bind) positions.
SR = Vector(plan.shoulder_point(TABLE, -1))
WR = Vector((-0.11, -0.03, 0.71))
ER = bend(SR, WR, (-1, 0.3, 0))
TR = WR + (WR - ER).normalized() * 0.035
SL = Vector(plan.shoulder_point(TABLE, 1))
WL = Vector((0.085, -0.125, 0.43))
EL = bend(SL, WL, (1, 0.3, -0.5))
TL = WL + (WL - EL).normalized() * 0.035

# The sword points up and a little back. The flat of the blade faces the
# camera side (-X), so the width of the blade goes along Y.
GRIP = WR + (WR - ER).normalized() * 0.012
BLADE = Vector((-0.04, 0.22, 1)).normalized()
WIDTH = BLADE.cross(X).normalized()
FLAT = WIDTH.cross(BLADE).normalized()

# The lid: in front of the left hand, its face turned 25 degrees to the camera side.
LID_C = WL + Vector((-0.012, -0.03, 0.01))
LID_N = Vector((-math.sin(math.radians(25)), -math.cos(math.radians(25)), 0.06)).normalized()

# The bucket helmet tips to his right and to the front, over the right eye socket.
HELMET_AXIS = Vector((-0.3, -0.12, 1)).normalized()
HELMET_BASE = HEAD_C + Vector((-0.004, 0.006, 0.022))

TRUNK_BONES = [
    ("jaw", (0, -0.012, 0.612), (0, -0.065, 0.594), "head"),
    ("helmet", tuple(HELMET_BASE), tuple(HELMET_BASE + HELMET_AXIS * 0.1), "head"),
    ("cloth", (0, 0.05, 0.54), (0, 0.11, 0.42), "chest"),
]
ARMS = {"L": (EL, WL, TL), "R": (ER, WR, TR)}

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.35, 0.42)
    return blend("spine", "chest", co.z, 0.43, 0.49)


def cloth_weights(co):
    return blend("cloth", "chest", co.z, 0.45, 0.52)


def kilt_weights(co):
    """The kilt follows the hips at the top and the thighs lower down."""
    t = clamp01((HIP_Z + 0.02 - co.z) / 0.12)
    side = co.x / 0.06
    return {
        "hips": 1 - t,
        "thigh.L": t * clamp01(side + 0.5),
        "thigh.R": t * clamp01(-side + 0.5),
    }


def ring(part, center, rx, ry, radius, points=12, sides=4):
    """A closed ring of tube round Z: a rib or a band."""
    path = [
        Vector(center) + Vector((rx * math.sin(2 * math.pi * i / points), -ry * math.cos(2 * math.pi * i / points), 0))
        for i in range(points + 1)
    ]
    return kit.tube(part.bm, path, [radius] * len(path), sides, caps=False)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.056, 0.06, 0.06), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.036 * sign, -0.042, -0.02)), (0.019, 0.016, 0.014), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.052, 0.016)), (0.084, 0.012, 0.012))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    face = Part("face", SOCKET, "head", shade=0)
    for sign in (1, -1):
        # Big round sockets: an eager look.
        kit.sphere(face.bm, HEAD_C + Vector((0.022 * sign, -0.05, 0.0)), (0.017, 0.01, 0.018), 8, 5)
    kit.cone(face.bm, HEAD_C + Vector((0, -0.057, -0.022)), HEAD_C + Vector((0, -0.059, -0.008)), 0.009, 0.002, 4)
    grin = [HEAD_C + Vector((0.03, -0.046, -0.03)), HEAD_C + Vector((0, -0.056, -0.036)), HEAD_C + Vector((-0.03, -0.046, -0.03))]
    teeth = kit.tube(face.bm, grin, [0.006, 0.008, 0.006], 5)
    face.paint(faces_of(teeth), BONE_DARK)
    parts.append(face)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.022 * sign, -0.058, 0.001)), (0.006, 0.004, 0.007), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.036, 0.588), (0.042, 0.034, 0.018), 10, 6)
    lower = kit.tube(jaw.bm, [(0.03, -0.054, 0.598), (0, -0.066, 0.594), (-0.03, -0.054, 0.598)], [0.006, 0.007, 0.006], 5)
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    neck = Part("neck", BONE_DARK, "neck")
    for index in range(3):
        z = NECK_Z - 0.01 + index * 0.017
        kit.sphere(neck.bm, (0, 0.004, z), (0.014, 0.013, 0.008), 6, 4)
    kit.cone(neck.bm, (0, 0.006, NECK_Z - 0.02), (0, 0.0, 0.61), 0.008, 0.008, 5)
    parts.append(neck)

    # The bucket helmet: a rusted pail, upside down and too big, with an
    # iron band, rivets, and its handle as a strap under the jaw.
    helmet = Part("helmet", RUST, "helmet", shade=0.16)
    a = HELMET_AXIS
    side = a.cross(Y).normalized()
    front = side.cross(a).normalized()
    bottom = HELMET_BASE - a * 0.02
    top = HELMET_BASE + a * 0.07
    pail = kit.cone(helmet.bm, bottom, top, 0.064, 0.052, 14)
    for face in faces_of(pail):
        c = face.calc_center_median()
        if int((c.x * 7 + c.y * 5) * 60) % 5 == 0:
            helmet.paint([face], RUST_DARK)
    rim = kit.torus(helmet.bm, bottom, a, 0.064, 0.006, 14, 4)
    helmet.paint(faces_of(rim), IRON)
    band = kit.torus(helmet.bm, bottom + a * 0.05, a, 0.058, 0.005, 14, 4)
    helmet.paint(faces_of(band), RUST_DARK)
    for index in range(6):
        angle = 2 * math.pi * index / 6
        radial = side * math.cos(angle) + front * math.sin(angle)
        rivet = kit.sphere(helmet.bm, bottom + a * 0.05 + radial * 0.061, (0.006, 0.006, 0.006), 4, 3)
        helmet.paint(faces_of(rivet), IRON)
    # The handle: an iron loop from one side of the pail down under the jaw.
    handle = []
    for index in range(7):
        t = index / 6
        angle = math.pi * t
        handle.append(bottom + side * (0.066 * math.cos(angle)) - a * (0.075 * math.sin(angle)) + front * (0.02 * math.sin(angle)))
    strap = kit.tube(helmet.bm, handle, [0.004] * len(handle), 4)
    helmet.paint(faces_of(strap), IRON)
    parts.append(helmet)
    return parts


def body_parts():
    parts = []
    # The spine and the ribs: a bare rib cage.
    spine = Part("spine", BONE_DARK, torso_weights, shade=0.1)
    kit.cone(spine.bm, (0, 0.03, HIP_Z), (0, 0.022, NECK_Z), 0.012, 0.01, 6)
    for index in range(5):
        z = HIP_Z + 0.02 + index * 0.025
        disc = kit.sphere(spine.bm, (0, 0.03, z), (0.014, 0.013, 0.006), 6, 3)
        spine.paint(faces_of(disc), BONE)
    parts.append(spine)

    ribs = Part("ribs", BONE, "chest", shade=0.1)
    for index in range(5):
        z = 0.525 - index * 0.022
        rx = 0.05 - abs(index - 1.5) * 0.004
        verts = ring(ribs, (0, 0.006, z), rx, 0.04, 0.0055, 12, 4)
        if index % 2:
            ribs.paint(faces_of(verts), BONE_DARK)
    kit.box(ribs.bm, (0, -0.042, 0.49), (0.012, 0.008, 0.08))
    # Collar bones to the shoulders.
    for sign in (1, -1):
        kit.cone(ribs.bm, (0, -0.03, 0.535), (0.08 * sign, 0, SHOULDER_Z + 0.004), 0.007, 0.007, 5)
    parts.append(ribs)

    pelvis = Part("pelvis", BONE_DARK, "hips", shade=0.1)
    kit.sphere(pelvis.bm, (0, 0.006, HIP_Z - 0.004), (0.05, 0.036, 0.024), 10, 6)
    parts.append(pelvis)

    # The pale teal neck cloth: round the neck, a knot on the chest, and two
    # torn tails behind on their own bone.
    cloth = Part("cloth", TEAL, cloth_weights, shade=0.08)
    kit.torus(cloth.bm, (0, 0.004, NECK_Z - 0.004), (0, 0.2, 1), 0.05, 0.017, 12, 5)
    knot = kit.sphere(cloth.bm, (-0.012, -0.05, 0.53), (0.016, 0.012, 0.014), 6, 4)
    cloth.paint(faces_of(knot), TEAL_DARK)
    hang = kit.cone(cloth.bm, (-0.012, -0.054, 0.525), (-0.024, -0.064, 0.46), 0.022, 0.01, 5, squash=0.35)
    cloth.paint(faces_of(hang), TEAL)
    for x, length in ((0.022, 0.15), (-0.018, 0.12)):
        tail = kit.cone(cloth.bm, (x, 0.05, 0.535), (x * 1.8, 0.11, 0.535 - length), 0.024, 0.006, 5, squash=0.35)
        cloth.paint(faces_of(tail), TEAL_DARK if x > 0 else TEAL)
    parts.append(cloth)

    # A leather belt with a brass buckle at the front.
    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.torus(belt.bm, (0, 0.004, HIP_Z + 0.012), (0, 0.12, 1), 0.058, 0.009, 12, 4)
    buckle = kit.box(belt.bm, (0, -0.058, HIP_Z + 0.012), (0.024, 0.008, 0.02))
    belt.paint(faces_of(buckle), BRASS)
    parts.append(belt)

    def kilt_color(row, column):
        if row >= 2:
            return KILT_DARK
        return LEATHER_DARK if column % 4 == 1 else (KILT_DARK if column % 3 == 2 else KILT)

    kilt = Part("kilt", KILT, kilt_weights, shade=0.1)
    kit.ragged_cone(kilt, HIP_Z + 0.014, 0.19, 0.056, 0.084, 12, 3, 0.8, 0.05, kilt_color, KILT_DARK)
    parts.append(kilt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.012, 0.01, 6)
        knob = kit.sphere(upper.bm, e, (0.014, 0.014, 0.014), 6, 4)
        upper.paint(faces_of(knob), BONE_DARK)
        ball = kit.sphere(upper.bm, s, (0.016, 0.016, 0.016), 6, 4)
        upper.paint(faces_of(ball), BONE_DARK)
        parts.append(upper)

        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.01, 0.008, 6)
        if side == "R":
            # A leather bracer on the sword arm.
            bracer = kit.cone(forearm.bm, w - d * 0.06, w - d * 0.008, 0.017, 0.015, 7)
            forearm.paint(faces_of(bracer), LEATHER)
            strap = kit.torus(forearm.bm, w - d * 0.035, d, 0.017, 0.003, 8, 3)
            forearm.paint(faces_of(strap), LEATHER_DARK)
        parts.append(forearm)

        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.016, (0.016, 0.015, 0.018), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.006 * index, 0.004 * index, 0.0))
            finger = kit.cone(hand.bm, w + d * 0.026 + offset, w + d * 0.04 + offset, 0.005, 0.004, 4)
            hand.paint(faces_of(finger), BONE_DARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.013, 0.011, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.012, 0.004)), (0.02, 0.016, 0.02), 6, 4)
        femur.paint(faces_of(cap), LEATHER_DARK)
        parts.append(femur)

        # Leather wraps from below the knee to the boot.
        shin = Part(f"shin.{side}", LEATHER, f"shin.{side}", shade=0.12)
        verts = kit.cone(shin.bm, knee - Vector((0, 0, 0.02)), ankle + Vector((0, 0, 0.004)), 0.019, 0.017, 7)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 90) % 2:
                shin.paint([face], LEATHER_DARK)
        bone = kit.cone(shin.bm, knee, knee - Vector((0, 0, 0.03)), 0.01, 0.01, 5)
        shin.paint(faces_of(bone), BONE)
        parts.append(shin)

        # Old boots with a turned-up toe.
        foot = Part(f"foot.{side}", LEATHER, f"foot.{side}", shade=0.08)
        kit.sphere(foot.bm, (LEG_X * sign, 0.004, 0.026), (0.022, 0.026, 0.026), 7, 5)
        toe = kit.cone(foot.bm, (LEG_X * sign, -0.006, 0.02), (LEG_X * sign, -0.066, 0.018), 0.02, 0.014, 7)
        foot.paint(faces_of(toe), LEATHER_DARK)
        sole = kit.box(foot.bm, (LEG_X * sign, -0.02, 0.005), (0.04, 0.09, 0.01))
        foot.paint(faces_of(sole), RUST_DARK)
        parts.append(foot)
    return parts


def sword_part():
    """A chipped short sword: a leather grip, a brass guard and a notched steel blade."""
    sword = Part("sword", STEEL, "hand.R", shade=0.02)
    handle = kit.cone(sword.bm, GRIP - BLADE * 0.034, GRIP + BLADE * 0.012, 0.007, 0.008, 6)
    sword.paint(faces_of(handle), LEATHER_DARK)
    pommel = kit.sphere(sword.bm, GRIP - BLADE * 0.038, (0.009, 0.009, 0.009), 5, 4)
    sword.paint(faces_of(pommel), BRASS)
    guard = kit.slab(sword.bm, GRIP + BLADE * 0.018, BLADE * 0.005, WIDTH * 0.034, FLAT * 0.007)
    sword.paint(faces_of(guard), BRASS)

    front, back = [], []
    steps = 8
    length = 0.17
    # Chips along both edges: (row, side) where the edge has a notch.
    chips = {(2, 0), (5, 0), (3, 2), (6, 2)}
    for index in range(steps + 1):
        s = index / steps
        center = GRIP + BLADE * (0.024 + s * length)
        width = 0.02 if s < 0.8 else 0.02 * (1 - s) / 0.2 + 0.001
        row = []
        for column, offset in enumerate((-1.0, 0.0, 1.0)):
            cut = 0.45 if (index, column) in chips else 1.0
            row.append(center + WIDTH * width * offset * cut)
        front.append([p + FLAT * 0.003 for p in row])
        back.append([p - FLAT * 0.003 for p in row])

    def blade_color(face_side, row, column):
        if row in (2, 5) and column == 0:
            return RUST
        return STEEL_LIGHT if column == 1 else STEEL

    kit.panel(sword, front, back, blade_color)
    return sword


def lid_part():
    """The round wooden lid: planks, an iron rim, a knob, and a patch of lichen."""
    lid = Part("lid", WOOD, "hand.L", shade=0.06)
    n = LID_N
    across = n.cross(Z).normalized()
    up = across.cross(n).normalized()
    disc = kit.cone(lid.bm, LID_C + n * 0.007, LID_C - n * 0.007, 0.086, 0.086, 16)
    for face in faces_of(disc):
        c = face.calc_center_median() - LID_C
        plank = int((c.dot(across) + 0.1) / 0.034)
        if plank % 2:
            lid.paint([face], WOOD_DARK)
        if c.dot(up) < -0.03 and c.dot(across) > 0.02:
            lid.paint([face], LICHEN)
    rim = kit.torus(lid.bm, LID_C, n, 0.086, 0.007, 16, 4)
    lid.paint(faces_of(rim), RUST_DARK)
    knob = kit.sphere(lid.bm, LID_C + n * 0.012, (0.016, 0.016, 0.016), 7, 5)
    lid.paint(faces_of(knob), IRON)
    return lid


def build_figure():
    kit.reset_scene()
    rig, _ = plan.build_rig("Skeleton", TABLE, TRUNK_BONES, arms=ARMS)
    parts = head_parts() + body_parts() + limb_parts() + [sword_part(), lid_part()]
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "SkeletonMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


PATCHES = (
    # The idle: eager and nervous. He waves the sword, chatters, and keeps
    # looking back over his shoulder for an ally (Swarm).
    Patch(
        "idle",
        "nervous-glance",
        beats=tuple(
            Beat(frame, "stance", args)
            for frame, *args in (
                (0, 0, 0.3, 0, 0),
                (8, 0.5, 0.25, 0.6, 0),
                (14, 0.8, 1.0, 0.2, 0.6),
                (20, 1, 1.0, -0.2, 0),
                (24, 0.8, 0.9, 0, 0.5),
                (30, 0.5, 0.2, -0.6, 0),
                (38, 0.2, 0.3, 0.4, 0),
                (48, 0, 0.3, 0, 0),
            )
        ),
    ),
    Patch(
        "lowHp",
        "cower",
        beats=tuple(
            Beat(frame, "slump", args)
            for frame, *args in ((0, 0, 0), (5, 0.3, 1), (10, 0.5, -1), (20, 1, 0), (25, 0.7, 1), (30, 0.5, -1), (40, 0, 0))
        ),
        frames=40,
    ),
    Patch(
        "walk",
        "eager-march",
        beats=(Beat(0, "step", (1,)), Beat(5, "step", (1, 1)), Beat(10, "step", (-1,)), Beat(15, "step", (-1, 1)), Beat(20, "step", (1,))),
        frames=20,
    ),
    Patch(
        "attack",
        "wild-chop",
        beats=(Beat(0), Beat(8, "windup"), Beat(15, "strike"), Beat(19, "strike"), Beat(25, "stance", (0.3, 0.8, 0.4, 0.6)), Beat(30)),
    ),
    # The helmet rolls off as he lands.
    Patch(
        "death",
        "helmet-roll",
        beats=(Beat(0), Beat(5, "recoil"), Beat(12, "stagger"), Beat(24, "fallen", (0, 0.2)), Beat(28, "fallen", (5, 0.7)), Beat(36, "fallen")),
    ),
    # The helmet goes back on and he gets up with a rattle.
    Patch(
        "rebirth",
        "helmet-back",
        beats=(Beat(0), Beat(4, "recoil"), Beat(16, "fallen", (0, 0.5)), Beat(21, "fallen"), Beat(32, "crouch"), Beat(41, "heroic"), Beat(48)),
    ),
)


class Poses(clips.biped_medium.Poses):
    fall = Fall(X, -86, (0, 0, 0.1))

    def leg(self, side, swing, drop, tilt=0.0, splay=0.0):
        """
        One leg with its foot flat on the ground. `swing` is the angle of the
        thigh (negative: the knee goes forward), `drop` is how far the hips
        go down, and `tilt` is the forward tilt of the hips.
        """
        t = self.t
        a = math.radians(swing)
        reach = clamp01((THIGH + SHIN - drop - THIGH * math.cos(a)) / SHIN)
        c = max(math.acos(reach), a)
        shin = math.degrees(c - a)
        return {
            f"thigh.{side}": t(f"thigh.{side}", (X, swing - tilt), (Y, splay)),
            f"shin.{side}": t(f"shin.{side}", (X, shin)),
            f"foot.{side}": t(f"foot.{side}", (X, -math.degrees(c))),
        }

    def stride(self, drop, front=-24.0, back=14.0, tilt=6.0):
        """The left foot forward and the right foot back, both flat: mid-step."""
        return {**self.leg("L", front, drop, tilt, 3), **self.leg("R", back, drop, tilt, -3)}

    def stance(self, breath=0.0, glance=0.4, wave=0.0, chat=0.0):
        """
        He advances, the sword too high and the lid in front. `glance` (0 to 1)
        turns his head back over his right shoulder to look for an ally, `wave`
        (-1 to 1) wobbles the sword and `chat` opens the jaw.
        """
        t, at = self.t, self.at
        drop = 0.025 + breath * 0.005
        return {
            "hips@loc": at("hips", (0, 0.006, -drop)),
            "hips": t("hips", (X, 6), (Z, -4)),
            "spine": t("spine", (X, 6 + breath * 2)),
            "chest": t("chest", (X, 2 - breath * 2), (Z, -6 * glance)),
            "neck": t("neck", (X, -4), (Z, -26 * glance)),
            "head": t("head", (X, -6 + 4 * glance), (Z, -36 * glance), (Y, -6 * glance)),
            "jaw": t("jaw", (X, 4 + chat * 22)),
            "helmet": t("helmet", (X, 3 * wave)),
            "upperarm.R": t("upperarm.R", (Y, 5 * wave), (X, -breath * 4)),
            "forearm.R": t("forearm.R", (X, -6 * wave)),
            "hand.R": t("hand.R", (X, 10 * wave)),
            "upperarm.L": t("upperarm.L", (X, -breath * 3)),
            "cloth": t("cloth", (X, -14 - breath * 4), (Y, 8 * wave)),
            **self.stride(drop),
        }

    def slump(self, base, breath=0.0, shake=0.0):
        """Low HP: low behind the lid, the sword drooping over his shoulder, looking back for friends."""
        t, at = self.t, self.at
        drop = 0.1 + breath * 0.006
        return self.pose(
            self.stance(),
            hips_at_loc=at("hips", (0, 0.03, -drop)),
            hips=t("hips", (X, 10)),
            spine=t("spine", (X, 24 + breath * 3)),
            chest=t("chest", (X, 10), (Z, -10)),
            neck=t("neck", (X, 4), (Z, -34 + 8 * shake)),
            head=t("head", (X, 6), (Z, -40 + 10 * shake), (Y, -10)),
            jaw=t("jaw", (X, 10 + 10 * abs(shake))),
            helmet=t("helmet", (X, 10 + 4 * shake)),
            upperarm__R=t("upperarm.R", (X, 70), (Y, -14 + 6 * shake)),
            forearm__R=t("forearm.R", (X, 30)),
            hand__R=t("hand.R", (X, 20)),
            upperarm__L=t("upperarm.L", (X, -10), (Z, -8)),
            cloth=t("cloth", (X, -6)),
            **self.leg("L", -50, drop, 10, 4),
            **self.leg("R", 4, drop, 10, -4),
        )

    def recoil(self, base, amount=1.0):
        """A hit knocks him back: the head snaps back, the helmet jumps and the sword flails."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, -0.04)),
            spine=t("spine", (X, -4 * amount)),
            chest=t("chest", (X, -14 * amount), (Z, 8 * amount)),
            neck=t("neck", (X, -10 * amount)),
            head=t("head", (X, -22 * amount), (Y, 14 * amount)),
            jaw=t("jaw", (X, 30 * amount)),
            helmet=t("helmet", (X, -24 * amount), (Y, 10 * amount)),
            helmet_at_loc=at("helmet", (0, 0, 0.03 * amount)),
            upperarm__R=t("upperarm.R", (X, -26 * amount), (Y, -24 * amount)),
            upperarm__L=t("upperarm.L", (X, -20 * amount), (Y, 16 * amount)),
            cloth=t("cloth", (X, -36 * amount)),
        )

    def stagger(self, base):
        """He totters, the bones loose, the sword arm limp."""
        t, at = self.t, self.at
        drop = 0.04
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -drop)),
            hips=t("hips", (Z, -10), (Y, 8)),
            spine=t("spine", (X, -8), (Y, -10)),
            chest=t("chest", (X, -6)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 18), (Y, -24)),
            jaw=t("jaw", (X, 34)),
            helmet=t("helmet", (X, 30), (Y, -20)),
            upperarm__R=t("upperarm.R", (X, 100), (Y, -30)),
            forearm__R=t("forearm.R", (X, 20)),
            upperarm__L=t("upperarm.L", (X, 30), (Y, 20)),
            **self.leg("R", -18, drop, 0, -8),
            **self.leg("L", 18, drop, 0, 8),
        )

    def fallen(self, base, bounce=0.0, roll=1.0):
        """Flat on the back, the arms out. `roll` takes the helmet off and rolls it to the camera side."""
        t, at = self.t, self.at
        return self.pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.056)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Y, -30)),
            jaw=t("jaw", (X, 30)),
            helmet=t("helmet", (Y, -100 * roll), (X, -20 * roll)),
            helmet_at_loc=at("helmet", (-0.1 * roll, 0.02 * roll, 0.12 * roll)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, -60)),
            forearm__R=t("forearm.R", (X, 10)),
            upperarm__L=t("upperarm.L", (X, 50), (Y, 70)),
            forearm__L=t("forearm.L", (X, -30)),
            hand__L=t("hand.L", (Y, 30)),
            thigh__L=t("thigh.L", (X, -10), (Y, 8)),
            shin__L=t("shin.L", (X, 14)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -30), (Y, -8)),
            shin__R=t("shin.R", (X, 44)),
            foot__R=t("foot.R", (X, 0)),
            cloth=t("cloth", (X, -50)),
        )

    def crouch(self, base):
        """Very low, as a summon starts and a Rebirth gets up: the helmet slips over his eyes."""
        t, at = self.t, self.at
        drop = 0.14
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -drop)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 4)),
            helmet=t("helmet", (X, 18)),
            upperarm__R=t("upperarm.R", (X, 80), (Y, -10)),
            forearm__R=t("forearm.R", (X, 20)),
            upperarm__L=t("upperarm.L", (X, 10)),
            cloth=t("cloth", (X, 20)),
            **self.stride(drop, -56, 22, 8),
        )

    def heroic(self, base):
        """Up with a rattle: the sword high over his head, the jaw wide, a look back at his friends."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.006, -0.0)),
            spine=t("spine", (X, 0)),
            chest=t("chest", (X, -8), (Z, -10)),
            neck=t("neck", (Z, -20)),
            head=t("head", (X, -18), (Z, -30)),
            jaw=t("jaw", (X, 28)),
            helmet=t("helmet", (X, -10)),
            helmet_at_loc=at("helmet", (0, 0, 0.02)),
            upperarm__R=t("upperarm.R", (X, -12), (Y, 6)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, 14)),
            **self.stride(0.01, -14, 10, 4),
        )

    def step(self, base, front, lift=0.0):
        """An eager march. `front` is 1 for the left foot, -1 for the right; `lift` is in the air."""
        t, at = self.t, self.at
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        drop = 0.03 - lift * 0.012
        result = self.pose(
            self.stance(0.0, 0.0),
            hips_at_loc=at("hips", (0, 0.006, -drop)),
            hips=t("hips", (X, 8), (Z, -6 * front)),
            spine=t("spine", (X, 8), (Y, -3 * front)),
            chest=t("chest", (X, 2), (Z, 6 * front)),
            # He looks back at the ally behind him on each other step.
            neck=t("neck", (Z, -14 - 12 * front)),
            head=t("head", (X, -6), (Z, -18 - 18 * front)),
            jaw=t("jaw", (X, 4 + 14 * lift)),
            helmet=t("helmet", (X, 8 * lift)),
            upperarm__R=t("upperarm.R", (X, -8 * front), (Y, 6 * lift)),
            hand__R=t("hand.R", (X, 12 * front)),
            upperarm__L=t("upperarm.L", (X, -8 * front)),
            cloth=t("cloth", (X, -22), (Y, 8 * front)),
            **self.leg(back, 20, drop, 8),
            **self.leg(lead, -28, drop, 8),
        )
        if lift:
            result.update(
                {
                    f"thigh.{lead}": t(f"thigh.{lead}", (X, -50)),
                    f"shin.{lead}": t(f"shin.{lead}", (X, 64)),
                    f"foot.{lead}": t(f"foot.{lead}", (X, -10)),
                }
            )
        return result

    def windup(self, base):
        """He leans back and swings the sword far behind his head, eyes shut for courage."""
        t, at = self.t, self.at
        drop = 0.03
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -drop)),
            hips=t("hips", (X, 2), (Z, -10)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -10), (Z, -6)),
            neck=t("neck", (X, -6), (Z, 4)),
            head=t("head", (X, -14), (Z, 6)),
            jaw=t("jaw", (X, 24)),
            helmet=t("helmet", (X, -12)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -10)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, -20)),
            upperarm__L=t("upperarm.L", (X, -14)),
            cloth=t("cloth", (X, -20)),
            **self.stride(drop, -20, 18, 0),
        )

    def strike(self, base):
        """He lunges and brings the sword down in front of him."""
        t, at = self.t, self.at
        drop = 0.07
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.05, -drop)),
            hips=t("hips", (X, 12), (Z, 6)),
            spine=t("spine", (X, 18)),
            chest=t("chest", (X, 14), (Z, 4)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -10), (Z, -4)),
            jaw=t("jaw", (X, 30)),
            helmet=t("helmet", (X, 22)),
            helmet_at_loc=at("helmet", (0, 0, 0.012)),
            upperarm__R=t("upperarm.R", (X, 92), (Y, -8)),
            forearm__R=t("forearm.R", (X, 6)),
            hand__R=t("hand.R", (X, 8)),
            upperarm__L=t("upperarm.L", (X, -12), (Y, 8)),
            cloth=t("cloth", (X, -30)),
            **self.stride(drop, -50, 26, 10),
        )

    def rising(self, base):
        return self.pose(self.crouch(base), jaw=self.t("jaw", (X, 24)))


def build_clips(rig):
    return clips.overrides.build(clips.biped_medium.CLIPS, Poses(*kit.pose_tools(rig)), PATCHES, without=("cast",))


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "skeleton.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
