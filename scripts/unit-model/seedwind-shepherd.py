"""
Seedwind Shepherd (`elf.seedwindShepherd`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a broad elf man with long wavy
brown hair, a green robe with gold trim, a mantle of leaves, a cream sash and
tall boots. He floats under a seed sail: a pale dome of leaf skin with veins,
on cords to his shoulders. His right hand holds a seed staff with a glowing
bud, and his left hand a tiny gold baton that guides three seeds round him.
Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/seedwind-shepherd.glb`; then
`bun unit-model:pack seedwind-shepherd` packs it for the game.

He is Flying: at rest his feet hang above the ground, with the toes down. The
game puts the rest pose on the ground, so the clips lift the `root`. The
Battle camera sees the right side of a player Unit, so the staff is in the
right hand. His attack (Mid Range, holy) is a flick of the baton, and the
seed leaves at 20% of the clip. His cast (Regenerate) holds the staff up, and
the bud glows (the `bud` bone scales). The `sail` bone scales the sail, which
closes when he falls. The `seeds` bone turns the seeds round him.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#deaa84")
HAIR = hex_color("#7a4a2a")
HAIR_LIGHT = hex_color("#a8703e")
EYES = hex_color("#1f2a1a")
ROBE = hex_color("#5f7f3a")
ROBE_DARK = hex_color("#3f5a28")
ROBE_LIGHT = hex_color("#8fae58")
GOLD = hex_color("#d9ab46")
CREAM = hex_color("#efe3c4")
LEATHER = hex_color("#6a4a2e")
LEGGINGS = hex_color("#5a4030")
BOOT = hex_color("#6e4c2e")
WOOD = hex_color("#7a5a34")
WOOD_DARK = hex_color("#55401f")
BUD = hex_color("#e3c45a")
GLOW = hex_color("#fff0a0")
SAIL = hex_color("#ecdcaa")
SAIL_LIGHT = hex_color("#f7eecd")
VEIN = hex_color("#a88a4c")
CORD = hex_color("#a08a5a")
SEED = hex_color("#8a5a30")
FLUFF = hex_color("#f6f1e2")

# --- Proportions ---------------------------------------------------------------

# A broad, sturdy figure.
HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.006, 0.872))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.058
SHOULDER_X = 0.115

# The arms hang in an A-pose, 20 degrees from the body.
ARM_DIR = Vector((math.sin(math.radians(20)), 0, -math.cos(math.radians(20))))


def arm_points(sign):
    shoulder = Vector((SHOULDER_X * sign, 0, SHOULDER_Z))
    direction = Vector((ARM_DIR.x * sign, 0, ARM_DIR.z))
    elbow = shoulder + direction * 0.15
    wrist = elbow + direction * 0.14
    tip = wrist + direction * 0.055
    return shoulder, elbow, wrist, tip, direction


SL, EL, WL, TL, DL = arm_points(1)
SR, ER, WR, TR, DR = arm_points(-1)

# The staff stands upright in the right hand.
GRIP_R = WR + DR * 0.026
STAFF_DOWN = 0.3
STAFF_UP = 0.52
BUD_C = GRIP_R + Z * (STAFF_UP + 0.04)

# The baton points on from the left hand.
GRIP_L = WL + DL * 0.03
BATON = 0.1

# The seed sail: a dome over his head, on cords to his shoulders.
SAIL_C = Vector((0, 0.02, 1.16))
SAIL_R = 0.3
SAIL_RISE = 0.12
HARNESS = [Vector((0.08 * sign, 0.04, 0.745)) for sign in (1, -1)]

# The seeds turn round him at these heights and angles.
SEEDS = [(0.3, 0.32, 20), (0.58, 0.3, 140), (0.86, 0.34, 260)]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("hair", (0, 0.07, 0.86), (0, 0.1, 0.66), "head"),
    ("cloak", (0, 0.09, 0.7), (0, 0.15, 0.4), "chest"),
    ("cloak.2", (0, 0.15, 0.4), (0, 0.19, 0.12), "cloak"),
    ("sail", (0, 0.03, 0.76), tuple(SAIL_C), "chest"),
    ("seeds", (0, 0, 0.02), (0, 0, 0.12), "root"),
]
for side, sign, (s, e, w, t, _) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("staff", tuple(GRIP_R), tuple(GRIP_R + Z * 0.1), "hand.R"),
    ("bud", tuple(BUD_C - Z * 0.04), tuple(BUD_C + Z * 0.04), "staff"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def robe_weights(co):
    """The skirt of the robe follows the hips, and the thighs at the front and sides."""
    t = clamp01((0.47 - co.z) / 0.25)
    side = co.x / 0.1
    back = clamp01(co.y / 0.06)
    legs = t * (1 - back) * 0.85
    return {
        "hips": 1 - legs - t * back * 0.5,
        "cloak.2": t * back * 0.5,
        "thigh.L": legs * clamp01(side),
        "thigh.R": legs * clamp01(-side),
    }


def hair_weights(co):
    if co.z > 0.76:
        return blend("hair", "head", co.z, 0.8, 0.85)
    return {"hair": 1.0}


def cloak_weights(co):
    if co.z > 0.62:
        return blend("cloak", "chest", co.z, 0.64, 0.7)
    return blend("cloak.2", "cloak", co.z, 0.34, 0.44)


def cord_weights(co):
    return blend("chest", "sail", co.z, 0.8, 1.05)


# --- Parts ---------------------------------------------------------------------


def leaf(part, base, direction, length, width, color):
    """A flat leaf: a cone squashed thin."""
    base = Vector(base)
    direction = Vector(direction).normalized()
    verts = kit.cone(part.bm, base, base + direction * length, width, 0.001, 4, squash=0.3)
    part.paint(faces_of(verts), color)
    return verts


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.066, 0.068, 0.08), 14, 10)
    # A strong jaw.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.02, -0.042)), (0.05, 0.042, 0.03), 10, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.064, -0.002)), HEAD_C + Vector((0, -0.082, -0.016)), 0.012, 0.002, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.058 * sign, 0.006, -0.002)), HEAD_C + Vector((0.128 * sign, 0.04, 0.048)), 0.017, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.025 * sign, -0.06, 0.008)), (0.011, 0.007, 0.009), 8, 6)
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.063, 0.028)), (0.016, 0, -0.002 * sign), (0, 0.005, 0), (0, 0, 0.0045))
        face.paint(faces_of(brow), HAIR)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.03, 0.028, 8)
    parts.append(neck)

    # Long wavy hair: a cap, locks round the face and a full mane to the shoulders.
    hair = Part("hair", HAIR, hair_weights, shade=0.14)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.075, 0.08, 0.084), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.03 or (v.co.y < HEAD_C.y - 0.035 and v.co.z < HEAD_C.z + 0.05)]
    kit.bmesh.ops.delete(hair.bm, geom=face_verts, context="VERTS")
    for sign in (1, -1):
        for dx, dz, color in ((0.0, 0.0, HAIR), (0.018, -0.03, HAIR_LIGHT)):
            lock = kit.tube(
                hair.bm,
                [
                    HEAD_C + Vector(((0.06 + dx) * sign, -0.02, 0.04 + dz)),
                    HEAD_C + Vector(((0.08 + dx) * sign, -0.004, -0.04 + dz)),
                    HEAD_C + Vector(((0.07 + dx) * sign, 0.01, -0.1 + dz)),
                    HEAD_C + Vector(((0.085 + dx) * sign, 0.02, -0.16 + dz)),
                ],
                [0.024, 0.022, 0.018, 0.006],
                6,
            )
            hair.paint(faces_of(lock), color)
    mane = kit.tube(hair.bm, [HEAD_C + Vector((0, 0.05, 0.05)), HEAD_C + Vector((0, 0.09, -0.04)), HEAD_C + Vector((0, 0.1, -0.14)), HEAD_C + Vector((0.01, 0.11, -0.22))], [0.07, 0.075, 0.06, 0.016], 9)
    hair.paint(faces_of(mane), HAIR)
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    body = Part("body", ROBE, torso_weights, shade=0.14)
    kit.cone(body.bm, (0, 0, 0.48), (0, 0, 0.7), 0.085, 0.095, 12, squash=0.74)
    kit.sphere(body.bm, (0, 0, 0.69), (0.11, 0.07, 0.06), 12, 7)
    trim = kit.box(body.bm, (0, -0.07, 0.6), (0.016, 0.012, 0.22))
    body.paint(faces_of(trim), GOLD)
    parts.append(body)

    # The cream sash, from the right shoulder to the left hip.
    sash = Part("sash", CREAM, torso_weights, shade=0.08)
    kit.tube(sash.bm, [(-0.08, -0.06, 0.72), (-0.02, -0.08, 0.63), (0.05, -0.075, 0.54), (0.09, -0.05, 0.48)], [0.018] * 4, 5)
    parts.append(sash)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.47), (0, 0, 0.505), 0.093, 0.091, 12, squash=0.8)
    buckle = kit.sphere(belt.bm, (0, -0.075, 0.488), (0.02, 0.008, 0.02), 8, 5)
    belt.paint(faces_of(buckle), GOLD)
    # Seed pods on the belt.
    for sign in (1, -1):
        pod = kit.sphere(belt.bm, (0.085 * sign, -0.05, 0.45), (0.018, 0.016, 0.03), 8, 5)
        belt.paint(faces_of(pod), SEED)
    parts.append(belt)

    def robe_color(row, column):
        if row == 4:
            return GOLD
        return ROBE_DARK if column % 4 == 1 else ROBE

    # The skirt of the robe, split at the front.
    robe = Part("robe", ROBE, robe_weights)
    kit.ragged_cone(robe, 0.5, 0.16, 0.092, 0.15, 14, 5, 0.8, 0.04, robe_color, ROBE_DARK, gap=math.radians(22), y_push=0.05)
    parts.append(robe)

    def cloak_color(row, column):
        if row == 5:
            return GOLD
        return ROBE_DARK if column % 3 == 1 else ROBE

    cloak = Part("cloak", ROBE, cloak_weights)
    kit.ragged_cone(cloak, 0.735, 0.12, 0.1, 0.2, 16, 6, 0.75, 0.06, cloak_color, ROBE_LIGHT, gap=math.radians(85), y_push=0.08)
    # The mantle of leaves over the shoulders.
    for index in range(13):
        angle = math.radians(-130 + index * 21.6)
        out = Vector((math.sin(angle), -math.cos(angle) * 0.8, 0))
        base = Vector((0, 0, 0.75)) + out * 0.08
        leaf(cloak, base, out * 0.9 + Vector((0, 0, -0.7)), 0.11, 0.038, (ROBE_LIGHT, ROBE, ROBE_DARK, GOLD)[index % 4])
    # The harness of the sail, a gold ring on each shoulder.
    for point in HARNESS:
        ring = kit.torus(cloak.bm, point, (0, 1, 0.3), 0.016, 0.005, 8, 3)
        cloak.paint(faces_of(ring), GOLD)
    parts.append(cloak)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t, d) in (("L", 1, arm_points(1)), ("R", -1, arm_points(-1))):
        sleeve = Part(f"sleeve.{side}", ROBE, f"upperarm.{side}")
        kit.sphere(sleeve.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.036, 0.036, 0.036), 8, 6)
        kit.cone(sleeve.bm, s, e, 0.033, 0.03, 8)
        parts.append(sleeve)

        # A wide sleeve, with a gold cuff.
        forearm = Part(f"forearm.{side}", ROBE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w - d * 0.02, 0.03, 0.036, 8)
        cuff = kit.cone(forearm.bm, w - d * 0.035, w - d * 0.012, 0.037, 0.038, 8)
        forearm.paint(faces_of(cuff), GOLD)
        parts.append(forearm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.026, (0.02, 0.018, 0.026), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", LEGGINGS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.046, 0.036, 8)
        parts.append(thigh)

        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        verts = kit.cone(boot.bm, knee + Vector((0, 0, 0.03)), ankle, 0.043, 0.033, 8)
        boot.paint({f for v in verts if v.co.z > 0.28 for f in v.link_faces}, LEATHER)
        leaf(boot, knee + Vector((0, -0.035, -0.01)), (0, -0.4, 1), 0.05, 0.028, ROBE_LIGHT)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.03, 0.025), (0.06, 0.11, 0.05))
        kit.cone(foot.bm, (LEG_X * sign, -0.08, 0.02), (LEG_X * sign, -0.105, 0.032), 0.02, 0.004, 5)
        parts.append(foot)
    return parts


def staff_parts():
    staff = Part("staff", WOOD, "staff", shade=0.06)
    bottom = GRIP_R - Z * STAFF_DOWN
    top = GRIP_R + Z * STAFF_UP
    kit.cone(staff.bm, bottom, top, 0.011, 0.013, 7)
    for along in (-0.2, 0.12, 0.3):
        knot = kit.sphere(staff.bm, GRIP_R + Z * along, (0.016, 0.016, 0.012), 7, 4)
        staff.paint(faces_of(knot), WOOD_DARK)
    band = kit.cone(staff.bm, top - Z * 0.03, top, 0.015, 0.015, 7)
    staff.paint(faces_of(band), GOLD)
    # Three gold leaves cradle the bud.
    for index in range(3):
        angle = 2 * math.pi * index / 3
        out = Vector((math.cos(angle), math.sin(angle), 0))
        leaf(staff, top - Z * 0.005, out + Z * 1.4, 0.07, 0.022, GOLD if index else ROBE_LIGHT)
    # A small seed hangs on a cord from the head of the staff.
    cord = kit.tube(staff.bm, [top - Z * 0.01, top - Z * 0.05 - X * 0.03, top - Z * 0.09 - X * 0.035], [0.003] * 3, 4)
    staff.paint(faces_of(cord), CORD)
    pod = kit.sphere(staff.bm, top - Z * 0.11 - X * 0.035, (0.014, 0.014, 0.02), 7, 5)
    staff.paint(faces_of(pod), SEED)

    bud = Part("bud", BUD, "bud", shade=0.0)
    kit.sphere(bud.bm, BUD_C, (0.03, 0.03, 0.045), 10, 7)
    tip = kit.cone(bud.bm, BUD_C + Z * 0.035, BUD_C + Z * 0.075, 0.016, 0.001, 6)
    bud.paint(faces_of(tip), GLOW)
    core = kit.sphere(bud.bm, BUD_C - Vector((0.02, 0.02, 0)), (0.012, 0.012, 0.022), 6, 4)
    bud.paint(faces_of(core), GLOW)

    baton = Part("baton", GOLD, "hand.L", shade=0.04)
    kit.cone(baton.bm, GRIP_L - DL * 0.02, GRIP_L + DL * BATON, 0.005, 0.003, 6)
    star = kit.sphere(baton.bm, GRIP_L + DL * (BATON + 0.008), (0.011, 0.011, 0.011), 6, 4)
    baton.paint(faces_of(star), GLOW)
    return [staff, bud, baton]


def sail_parts():
    """The seed sail: a dome of leaf skin with veins and a scalloped rim, and its cords."""
    sail = Part("sail", SAIL, "sail", shade=0.06)
    segments = 24
    rings = 5

    def point(ring, segment, inset):
        r = ring / rings
        theta = 2 * math.pi * segment / segments
        lobe = 1 + 0.08 * math.cos(theta * 6) * r
        radius = SAIL_R * r * lobe
        z = SAIL_C.z + SAIL_RISE * (1 - r * r) - inset
        return (SAIL_C.x + radius * math.sin(theta), SAIL_C.y - radius * math.cos(theta), z)

    for inset, flip in ((0.0, False), (0.008, True)):
        grid = [[point(max(ring, 0.05), segment, inset) for segment in range(segments + 1)] for ring in range(rings + 1)]
        _, faces = kit.sheet(sail.bm, grid)
        for face, ring, segment in faces:
            if flip:
                face.normal_flip()
            sail.paint([face], SAIL_LIGHT if (segment // 2) % 2 else SAIL)
    # The veins of the sail, from the middle to each lobe.
    for index in range(6):
        theta = 2 * math.pi * index / 6
        path = []
        for ring in range(rings + 1):
            r = max(ring / rings, 0.05)
            radius = SAIL_R * r * (1 + 0.08 * r)
            path.append((SAIL_C.x + radius * math.sin(theta), SAIL_C.y - radius * math.cos(theta), SAIL_C.z + SAIL_RISE * (1 - r * r) + 0.004))
        vein = kit.tube(sail.bm, path, [0.008] * len(path), 4)
        sail.paint(faces_of(vein), VEIN)
    # The knob at the top of the sail.
    knob = kit.sphere(sail.bm, SAIL_C + Z * (SAIL_RISE + 0.008), (0.03, 0.03, 0.02), 8, 5)
    sail.paint(faces_of(knob), SEED)

    cords = Part("cords", CORD, cord_weights, shade=0.0)
    for index in range(6):
        theta = 2 * math.pi * (index + 0.5) / 6
        rim = Vector((SAIL_C.x + SAIL_R * 0.94 * math.sin(theta), SAIL_C.y - SAIL_R * 0.94 * math.cos(theta), SAIL_C.z - 0.004))
        harness = HARNESS[0] if math.sin(theta) > 0 else HARNESS[1]
        kit.tube(cords.bm, [harness, rim], [0.0035, 0.0035], 4)
    return [sail, cords]


def seed_parts():
    """Three seeds that float round him, each under its own tuft."""
    seeds = Part("seeds", SEED, "seeds", shade=0.0)
    for z, radius, degrees in SEEDS:
        angle = math.radians(degrees)
        center = Vector((radius * math.sin(angle), -radius * math.cos(angle), z))
        kit.sphere(seeds.bm, center, (0.022, 0.022, 0.036), 7, 5)
        stem = kit.cone(seeds.bm, center + Z * 0.03, center + Z * 0.08, 0.004, 0.003, 4)
        seeds.paint(faces_of(stem), CORD)
        for spoke in range(6):
            a = 2 * math.pi * spoke / 6
            out = Vector((math.cos(a), math.sin(a), 0.35))
            fluff = kit.cone(seeds.bm, center + Z * 0.08, center + Z * 0.08 + out * 0.055, 0.008, 0.002, 4)
            seeds.paint(faces_of(fluff), FLUFF)
    return [seeds]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("SeedwindShepherd", BONES)
    parts = head_parts() + body_parts() + limb_parts() + staff_parts() + sail_parts() + seed_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "SeedwindShepherdMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------

# He floats this high at rest.
FLOAT = 0.08


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

    def spin(turns):
        """The seeds, `turns` of a full circle round him."""
        return t("seeds", (Z, 360 * turns))

    def stand(breath=0.0, sway=0.0, turns=0.0, beat=0.0):
        """
        The idle: he floats and bobs under the sail, the feet hang with the
        toes down, the staff upright at his right side, and the baton beats
        time for the seeds that turn round him.
        """
        return {
            "root@loc": at("root", (0, 0, FLOAT + 0.025 * breath)),
            "hips": t("hips", (Z, -8), (Y, sway * 2)),
            "spine": t("spine", (X, 2 + breath), (Y, -sway * 2)),
            "chest": t("chest", (X, -3 - breath * 2), (Z, 4)),
            "neck": t("neck", (X, 2)),
            "head": t("head", (X, 4 + breath * 2), (Z, 12 + sway * 4)),
            "hair": t("hair", (X, -breath * 4), (Y, sway * 4)),
            "upperarm.R": t("upperarm.R", (X, -10), (Y, -6)),
            "forearm.R": t("forearm.R", (X, -42 - breath * 4)),
            # The hand turns back, so the staff stands upright.
            "hand.R": t("hand.R", (X, 52 + breath * 4)),
            "upperarm.L": t("upperarm.L", (X, -34 - beat * 6), (Y, -14)),
            "forearm.L": t("forearm.L", (X, -56 - beat * 14), (Z, -20)),
            "hand.L": t("hand.L", (X, -20 - beat * 18)),
            "thigh.L": t("thigh.L", (X, -14 - breath * 3), (Y, -3)),
            "shin.L": t("shin.L", (X, 26 + breath * 4)),
            "foot.L": t("foot.L", (X, 48)),
            "thigh.R": t("thigh.R", (X, 4), (Y, 3)),
            "shin.R": t("shin.R", (X, 12 + breath * 3)),
            "foot.R": t("foot.R", (X, 44)),
            "cloak": t("cloak", (X, 2 - breath * 3), (Y, sway * 3)),
            "cloak.2": t("cloak.2", (X, 4 - breath * 3)),
            "sail": t("sail", (X, breath * 2), (Y, sway * 4)),
            "seeds": spin(turns),
        }

    def slump(breath=0.0, turns=0.0):
        """Low HP: he sinks near the ground, bent over the staff, the sail tilted and slack."""
        return pose(
            stand(breath, 0, turns),
            root_at_loc=at("root", (0, 0, 0.012 + 0.012 * breath)),
            spine=t("spine", (X, 14 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2), (Z, -4)),
            neck=t("neck", (X, 8)),
            head=t("head", (X, 6 + breath * 4), (Y, 8)),
            hair=t("hair", (X, 12)),
            upperarm__L=t("upperarm.L", (X, -6), (Y, 8)),
            forearm__L=t("forearm.L", (X, -20)),
            hand__L=t("hand.L", (X, 10)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 50)),
            foot__L=t("foot.L", (X, 20)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, 10)),
            cloak=t("cloak", (X, 8)),
            sail=t("sail", (X, -6 - breath * 2), (Y, 12)),
            sail_at_scale=0.9,
        )

    def recoil(base, amount=1.0):
        """The hit pushes him back and up, and the sail jolts."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.03 * amount, FLOAT + 0.02 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -16 * amount), (Z, 10)),
            hair=t("hair", (X, 16 * amount)),
            upperarm__L=t("upperarm.L", (Y, -30 * amount), (X, 10 * amount)),
            forearm__L=t("forearm.L", (X, -30)),
            thigh__L=t("thigh.L", (X, -30 * amount)),
            shin__L=t("shin.L", (X, 50 * amount)),
            thigh__R=t("thigh.R", (X, -20 * amount)),
            shin__R=t("shin.R", (X, 40 * amount)),
            cloak=t("cloak", (X, -12 * amount)),
            sail=t("sail", (X, 14 * amount), (Y, -6 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            root_at_loc=at("root", (0, 0.02, 0.03)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 20)),
            hair=t("hair", (X, -16)),
            upperarm__L=t("upperarm.L", (Y, -10)),
            forearm__L=t("forearm.L", (X, -20)),
            sail=t("sail", (X, -24), (Y, 20)),
            sail_at_scale=0.7,
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the sail closed and the seeds gone."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, 0)),
            head=t("head", (X, -12), (Z, -25)),
            hair=t("hair", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, -35), (X, 20)),
            forearm__L=t("forearm.L", (X, -10)),
            hand__L=t("hand.L", (X, 0)),
            upperarm__R=t("upperarm.R", (Y, 50), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            # The staff lies on the ground past his head.
            hand__R=t("hand.R", (X, -5)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 8)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -14), (Y, 6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, 10)),
            cloak=t("cloak", (X, 6)),
            cloak__2=t("cloak.2", (X, 0)),
            sail=t("sail", (X, 20)),
            sail_at_scale=0.25,
            seeds_at_scale=0.0,
        )

    def curled(base):
        """Low and curled under a closed sail, as a summon starts."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, -0.04)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 20)),
            hair=t("hair", (X, -20)),
            thigh__L=t("thigh.L", (X, -80)),
            shin__L=t("shin.L", (X, 110)),
            foot__L=t("foot.L", (X, 30)),
            thigh__R=t("thigh.R", (X, -70)),
            shin__R=t("shin.R", (X, 110)),
            foot__R=t("foot.R", (X, 30)),
            cloak=t("cloak", (X, -10)),
            sail_at_scale=0.2,
            seeds_at_scale=0.0,
        )

    def lifted(base):
        """Up, the arms open and the sail wide: the end of a summon."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, FLOAT + 0.05)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -12), (Z, 8)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, -50)),
            forearm__L=t("forearm.L", (X, -20)),
            hair=t("hair", (X, 10)),
            sail_at_scale=1.08,
            seeds_at_scale=1.0,
        )

    def glide(phase):
        """The walk is a glide: he leans into it, and the feet trail and swing. `phase` is 0..1."""
        swing = math.sin(phase * 2 * math.pi)
        bob = math.cos(phase * 4 * math.pi)
        return pose(
            stand(0, swing * 0.5, phase * 0.25),
            root_at_loc=at("root", (0, 0, FLOAT + 0.012 * bob)),
            hips=t("hips", (Z, -8), (X, -6)),
            spine=t("spine", (X, 10)),
            thigh__L=t("thigh.L", (X, 6 + 12 * swing)),
            shin__L=t("shin.L", (X, 30 - 8 * swing)),
            thigh__R=t("thigh.R", (X, 6 - 12 * swing)),
            shin__R=t("shin.R", (X, 30 + 8 * swing)),
            cloak=t("cloak", (X, -16), (Y, 3 * swing)),
            cloak__2=t("cloak.2", (X, -10)),
            hair=t("hair", (X, -12)),
            sail=t("sail", (X, -10), (Y, 3 * swing)),
        )

    # The attack (Mid Range, holy): he draws the baton back, then flicks it at
    # the enemy, and a seed flies. The seed leaves at 20% of the attack
    # (`FLIGHT_START` in fx.ts), so the flick is at frame 6 of 30.
    def draw(base):
        return pose(
            base,
            chest=t("chest", (Z, 16), (X, -6)),
            head=t("head", (Z, -6), (X, 0)),
            upperarm__L=t("upperarm.L", (X, -110), (Y, -20)),
            forearm__L=t("forearm.L", (X, -70), (Z, -30)),
            hand__L=t("hand.L", (X, -40)),
            sail=t("sail", (X, 4)),
        )

    def flick(base, follow=0.0):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.01, FLOAT + 0.01)),
            chest=t("chest", (Z, -12), (X, 6)),
            head=t("head", (Z, -12), (X, 4)),
            upperarm__L=t("upperarm.L", (X, -100 + follow * 8), (Z, -24)),
            forearm__L=t("forearm.L", (X, -10), (Z, -10)),
            hand__L=t("hand.L", (X, -6 + follow * 14)),
            hair=t("hair", (X, 10)),
            cloak=t("cloak", (X, 8)),
            sail=t("sail", (X, -6)),
            bud_at_scale=1.25,
        )

    # The cast (Regenerate): he holds the staff up and forward, the bud glows,
    # and the seeds turn fast.
    def raised(base, glow=1.0):
        return pose(
            base,
            root_at_loc=at("root", (0, 0, FLOAT + 0.04)),
            chest=t("chest", (X, -10), (Z, 6)),
            head=t("head", (X, -16), (Z, 6)),
            # The staff leans forward, clear of the sail: the hand turns back.
            upperarm__R=t("upperarm.R", (X, -75), (Y, -10)),
            forearm__R=t("forearm.R", (X, -35)),
            hand__R=t("hand.R", (X, 135)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, -40)),
            forearm__L=t("forearm.L", (X, -30)),
            hair=t("hair", (X, 10)),
            sail=t("sail", (X, 4)),
            bud_at_scale=1.0 + 0.8 * glow,
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for index in range(9):
        frame = index * 6
        a = frame / 48 * 2 * math.pi
        idle.key(frame, stand((1 - math.cos(a)) / 2, math.sin(a), frame / 48, math.sin(a * 2)))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for index in range(9):
        frame = index * 6
        a = frame / 48 * 2 * math.pi
        low.key(frame, slump((1 - math.cos(a)) / 2, frame / 48))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    for frame in range(0, 25, 6):
        walk.key(frame, glide(frame / 24))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, draw(stand())).key(6, flick(stand())).key(9, flick(stand(), 1))
    attack.key(14, flick(stand(), 0.6)).key(22, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 36)
    cast.key(0, stand()).key(7, raised(stand(0, 0, 0.1), 0.5))
    for index, frame in enumerate((12, 18, 24)):
        cast.key(frame, raised(stand(0, 0, 0.25 * (index + 1)), 1.0 if index % 2 == 0 else 0.6))
    cast.key(30, raised(stand(0, 0, 1.0), 0.4)).key(36, stand(0, 0, 1.0))
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, curled(stand())).key(8, curled(stand(0, 0, 0.1))).key(17, lifted(stand(0, 0, 0.6))).key(24, stand(0, 0, 1.0))
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "seedwind-shepherd.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
