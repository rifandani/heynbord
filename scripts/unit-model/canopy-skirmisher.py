"""
Canopy Skirmisher (`elf.canopySkirmisher`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a lean elf woman with wild,
wind-blown auburn hair, a green tunic and a leather harness with amber
trim, a green scarf, bracers and tall boots wrapped with leaves, and a
pair of leaf-glider wings: big leaves of yellow-green on frames of twigs.
Her right hand holds a short spear with a leaf-shaped head. A rope ladder,
rolled up and not used, hangs from her belt at the back. Run it in Blender
(see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/canopy-skirmisher.glb`; then
`bun unit-model:pack canopy-skirmisher` packs it for the game.

She is Flying: her feet hang above the ground, with the toes down. The game
puts the rest pose on the ground, so the clips lift the `root`. Wide wings
across the Lane show only their edge to the camera, so her wings rise from
her back in a narrow V, long from front to back: from the side the camera
sees two big triangles of leaf. The `wing.L` and `wing.R` bones beat the
wings, and they fold (scale down) when she falls. She is Swift: her walk is
a fast glide, and her attack is a dive with a thrust of the spear. She has
no Keyword that she uses by her own action, so she has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#e8b48c")
HAIR = hex_color("#a8703e")
HAIR_LIGHT = hex_color("#c99558")
HAIR_DARK = hex_color("#7c4e2a")
EYES = hex_color("#1f2a1a")
BROW = hex_color("#6e4626")
TUNIC = hex_color("#557c36")
TUNIC_DARK = hex_color("#3c5c28")
SCARF = hex_color("#6f9a40")
LEATHER = hex_color("#7a4e2c")
LEATHER_DARK = hex_color("#4a2e1a")
AMBER = hex_color("#dc9c3a")
LEGGINGS = hex_color("#6a4a32")
BOOT = hex_color("#6a4329")
WING = hex_color("#a6be4c")
WING_LIGHT = hex_color("#d2d070")
WING_DARK = hex_color("#6f8a30")
WING_EDGE = hex_color("#d49a3c")
TWIG = hex_color("#6a4a2c")
SHAFT = hex_color("#5c3c22")
STEEL = hex_color("#c3c6c0")
STEEL_DARK = hex_color("#80857e")
ROPE = hex_color("#c9a46a")
RUNG = hex_color("#8a6238")

# --- Proportions ---------------------------------------------------------------

# A lean elf woman, a little small.
HIP_Z = 0.46
WAIST_Z = 0.54
CHEST_Z = 0.625
SHOULDER_Z = 0.705
NECK_Z = 0.73
HEAD_C = Vector((0, -0.01, 0.845))
KNEE_Z = 0.26
ANKLE_Z = 0.05
LEG_X = 0.052

# The wings rise from her back. These are the rest (bind) positions: each
# wing is a triangle of leaf in a plane that leans out from the middle by
# `WING_FLARE`, so the camera, at her side, sees its face.
WING_ROOT = Vector((0.0, 0.07, 0.68))
WING_FLARE = math.radians(14)
WING_TIP = 0.5
WING_BACK = 0.46

# The right hand holds the spear forward and a little down; the left arm is
# out for balance.
SR = Vector((-0.105, 0, SHOULDER_Z))
ER = Vector((-0.16, -0.03, 0.59))
WR = Vector((-0.16, -0.15, 0.56))
TR = WR + (WR - ER).normalized() * 0.05
GRIP_R = WR + (WR - ER).normalized() * 0.026
SPEAR = Vector((0, -1, -0.12)).normalized()
SPEAR_BACK = 0.14
SPEAR_FRONT = 0.28
ARM_DIR = Vector((math.sin(math.radians(30)), 0, -math.cos(math.radians(30))))
SL = Vector((0.105, 0, SHOULDER_Z))
EL = SL + ARM_DIR * 0.145
WL = EL + ARM_DIR * 0.135
TL = WL + ARM_DIR * 0.05

LADDER = Vector((0.03, 0.09, 0.44))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.004, NECK_Z), (0, -0.008, 0.765), "chest"),
    ("head", (0, -0.008, 0.765), (0, -0.01, 0.94), "neck"),
    ("hair", (0, 0.06, 0.85), (0, 0.14, 0.7), "head"),
    ("scarf", (0, 0.05, 0.71), (0, 0.2, 0.66), "chest"),
    ("ladder", tuple(LADDER), tuple(LADDER - Vector((0, -0.01, 0.12))), "hips"),
]
for side, sign in (("L", 1), ("R", -1)):
    root = WING_ROOT + Vector((0.025 * sign, 0, 0))
    out = Vector((math.sin(WING_FLARE) * sign, 0, math.cos(WING_FLARE)))
    BONES.append((f"wing.{side}", tuple(root), tuple(root + out * 0.2 + Y * 0.06), "chest"))
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
    return blend("spine", "chest", co.z, 0.6, 0.66)


def hair_weights(co):
    back = clamp01((co.y - 0.03) / 0.05) * clamp01((0.84 - co.z) / 0.05)
    return {"head": 1 - back, "hair": back}


def scarf_weights(co):
    t = clamp01((co.y - 0.04) / 0.06)
    return {"scarf": t, "chest": 1 - t}


def wing_weights(sign):
    side = "L" if sign > 0 else "R"

    def weights(co):
        # The root of the wing follows the chest, and the rest the wing bone.
        t = clamp01(((co - WING_ROOT).length - 0.03) / 0.06)
        return {"chest": 1 - t, f"wing.{side}": t}

    return weights


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
    kit.sphere(head.bm, HEAD_C, (0.058, 0.064, 0.075), 14, 10)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.058, -0.004)), HEAD_C + Vector((0, -0.074, -0.014)), 0.01, 0.002, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.053 * sign, 0.006, -0.002)), HEAD_C + Vector((0.12 * sign, 0.045, 0.045)), 0.015, 0.001, 5, squash=0.45)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.023 * sign, -0.054, 0.006)), (0.011, 0.007, 0.008), 8, 6)
        # Keen eyes on the target.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.025 * sign, -0.057, 0.024)), (0.015, 0, 0.004 * sign), (0, 0.005, 0), (0, 0, 0.0035))
        face.paint(faces_of(brow), BROW)
    parts.append(face)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.004, 0.71), (0, -0.008, 0.79), 0.024, 0.022, 8)
    parts.append(neck)

    # Wild auburn hair, blown back by the wind of the dive.
    hair = Part("hair", HAIR, hair_weights, shade=0.1)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.066, 0.073, 0.08), 14, 10)
    face_verts = [v for v in verts if v.co.z < HEAD_C.z - 0.03 or (v.co.y < HEAD_C.y - 0.035 and v.co.z < HEAD_C.z + 0.045)]
    kit.bmesh.ops.delete(hair.bm, geom=face_verts, context="VERTS")
    for index, angle in enumerate(range(-130, 131, 26)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.058 * math.sin(a), 0.058 * math.cos(a) + 0.01, 0.02))
        length = 0.15 if abs(angle) < 80 else 0.11
        bottom = top + Vector((0.035 * math.sin(a), 0.13, -length))
        middle = (top + bottom) / 2 + Vector((0.02 * math.sin(a), 0.02, 0.025))
        lock = kit.tube(hair.bm, [top, middle, bottom], [0.02, 0.016, 0.004], 5)
        hair.paint(faces_of(lock), (HAIR_LIGHT, HAIR, HAIR_DARK)[index % 3])
    # A few leaves caught in her hair.
    for x, color in ((0.04, WING), (-0.05, WING_DARK)):
        leaf(hair, HEAD_C + Vector((x, 0.04, 0.07)), Vector((x * 10, 0.6, 0.6)), 0.04, 0.014, color)
    parts.append(hair)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", TUNIC, torso_weights, shade=0.14)
    kit.cone(tunic.bm, (0, 0, 0.45), (0, 0, 0.72), 0.066, 0.08, 12, squash=0.76)
    parts.append(tunic)

    # The harness of the wings: straps over the shoulders and across the chest, with amber buckles.
    harness = Part("harness", LEATHER, "chest", shade=0.06)
    for sign in (1, -1):
        kit.tube(harness.bm, [(0.05 * sign, -0.062, 0.6), (0.06 * sign, -0.05, 0.7), (0.05 * sign, 0.04, 0.72), (0.03 * sign, 0.07, 0.66)], [0.008] * 4, 4)
    kit.tube(harness.bm, [(-0.07, -0.05, 0.62), (0, -0.075, 0.62), (0.07, -0.05, 0.62)], [0.008] * 3, 4)
    for x in (-0.03, 0.03):
        buckle = kit.box(harness.bm, (x, -0.076, 0.62), (0.016, 0.006, 0.016))
        harness.paint(faces_of(buckle), AMBER)
    # The mount of the wings on her back.
    mount = kit.box(harness.bm, WING_ROOT + Vector((0, 0.0, -0.01)), (0.07, 0.03, 0.08))
    harness.paint(faces_of(mount), LEATHER_DARK)
    parts.append(harness)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.44), (0, 0, 0.47), 0.078, 0.076, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.064, 0.455), (0.022, 0.008, 0.022))
    belt.paint(faces_of(buckle), AMBER)
    pouch = kit.box(belt.bm, (-0.074, -0.026, 0.43), (0.026, 0.028, 0.034))
    belt.paint(faces_of(pouch), LEATHER)
    parts.append(belt)

    def skirt_color(row, column):
        if row == 2:
            return AMBER
        return TUNIC_DARK if column % 3 == 1 else TUNIC

    # A short skirt of leaves over the hips.
    skirt = Part("skirt", TUNIC, "hips")
    kit.ragged_cone(skirt, 0.45, 0.35, 0.074, 0.1, 12, 3, 0.8, 0.04, skirt_color, TUNIC_DARK)
    parts.append(skirt)

    # The green scarf, its ends flying back in the wind.
    scarf = Part("scarf", SCARF, scarf_weights, shade=0.06)
    kit.torus(scarf.bm, (0, -0.006, 0.71), (0, 0, 1), 0.044, 0.014, 12, 4)
    for dz, color in ((0.0, SCARF), (-0.026, TUNIC_DARK)):
        end = kit.tube(scarf.bm, [(0.02, 0.04, 0.705 + dz), (0.03, 0.12, 0.69 + dz), (0.01, 0.2, 0.67 + dz)], [0.014, 0.012, 0.003], 4)
        scarf.paint(faces_of(end), color)
    parts.append(scarf)

    # The rope ladder, rolled up and tied at her back; one end hangs down, unused.
    ladder = Part("ladder", ROPE, "ladder", shade=0.06)
    roll = kit.cone(ladder.bm, LADDER + Vector((-0.06, 0, 0)), LADDER + Vector((0.06, 0, 0)), 0.03, 0.03, 10)
    for f in faces_of(roll):
        if int(f.calc_center_median().x * 120) % 2:
            ladder.paint([f], RUNG)
    for x in (-0.03, 0.03):
        kit.tube(ladder.bm, [LADDER + Vector((x, 0.02, -0.02)), LADDER + Vector((x, 0.03, -0.1)), LADDER + Vector((x, 0.034, -0.2))], [0.0035] * 3, 4)
    for z in (-0.07, -0.13, -0.19):
        rung = kit.cone(ladder.bm, LADDER + Vector((-0.034, 0.03, z)), LADDER + Vector((0.034, 0.03, z)), 0.005, 0.005, 5)
        ladder.paint(faces_of(rung), RUNG)
    parts.append(ladder)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.004 * sign, 0, -0.004)), (0.03, 0.03, 0.028), 8, 6)
        kit.cone(upper.bm, s, e, 0.025, 0.022, 8)
        cap = kit.sphere(upper.bm, s + Vector((0.008 * sign, 0, 0.006)), (0.032, 0.03, 0.022), 8, 5)
        upper.paint(faces_of(cap), LEATHER)
        parts.append(upper)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.08)
        verts = kit.cone(bracer.bm, e + d * 0.01, w, 0.023, 0.02, 8)
        bracer.paint({f for v in verts if (v.co - w).length < 0.014 for f in v.link_faces}, AMBER)
        leaf(bracer, (e + w) / 2 + Vector((0.01 * sign, 0.0, 0.016)), -d, 0.05, 0.016, WING_DARK)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.016, 0.015, 0.022), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", LEGGINGS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.04, 0.031, 8)
        parts.append(thigh)

        # Tall boots wrapped with leaves and straps.
        boot = Part(f"boot.{side}", BOOT, f"shin.{side}", shade=0.1)
        kit.cone(boot.bm, knee + Vector((0, 0, 0.02)), ankle, 0.036, 0.029, 8)
        for z in (0.1, 0.17, 0.24):
            strap = kit.torus(boot.bm, (LEG_X * sign, 0, z), (0, 0.3, 1), 0.033, 0.004, 10, 3)
            boot.paint(faces_of(strap), LEATHER_DARK)
        leaf(boot, knee + Vector((0, -0.03, -0.01)), (0, -0.4, 1), 0.05, 0.022, TUNIC)
        parts.append(boot)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.032, 0.024), (0.05, 0.11, 0.046))
        parts.append(foot)
    return parts


def spear_parts():
    spear = Part("spear", SHAFT, "hand.R", shade=0.04)
    butt = GRIP_R - SPEAR * SPEAR_BACK
    top = GRIP_R + SPEAR * SPEAR_FRONT
    kit.cone(spear.bm, butt, top, 0.009, 0.008, 6)
    wrap = kit.cone(spear.bm, GRIP_R - SPEAR * 0.03, GRIP_R + SPEAR * 0.03, 0.011, 0.011, 6)
    spear.paint(faces_of(wrap), LEATHER_DARK)
    collar = kit.cone(spear.bm, top - SPEAR * 0.02, top + SPEAR * 0.01, 0.012, 0.012, 6)
    spear.paint(faces_of(collar), AMBER)
    # A leaf-shaped head of steel, flat in the side plane, so the camera sees its face.
    side = X
    up = SPEAR.cross(side).normalized()
    rows = 6

    def grid(offset):
        result = []
        for row in range(rows + 1):
            s = row / rows
            width = 0.024 * math.sin(math.pi * s ** 0.7)
            base = top + SPEAR * (0.005 + 0.1 * s) + side * offset
            result.append([base - up * width, base, base + up * width])
        return result

    def color_of(face_side, row, column):
        return STEEL

    edges = panel(spear, grid(0.003), grid(-0.003), color_of)
    spear.paint(edges, STEEL_DARK)
    # A green tassel under the head.
    tassel = kit.tube(spear.bm, [top - SPEAR * 0.01, top - SPEAR * 0.03 - Z * 0.04, top - SPEAR * 0.02 - Z * 0.07], [0.006, 0.005, 0.002], 4)
    spear.paint(faces_of(tassel), SCARF)
    return [spear]


def wing_parts():
    parts = []
    columns, rows = 8, 4

    for sign in (1, -1):
        side = "L" if sign > 0 else "R"
        out = Vector((math.sin(WING_FLARE) * sign, 0, math.cos(WING_FLARE)))
        root = WING_ROOT + Vector((0.025 * sign, 0, 0))
        tip = root + out * WING_TIP - Y * 0.07
        tail = root + out * 0.12 + Y * WING_BACK
        normal = Vector((math.cos(WING_FLARE) * sign, 0, -math.sin(WING_FLARE)))
        sail = Part(f"wing.{side}", WING, wing_weights(sign), shade=0.0)

        def edges(u):
            """The front (spar) and back edges of the wing, `u` from the root to the tip."""
            front = root.lerp(tip, u) - Y * 0.04 * math.sin(math.pi * u)
            back = tail.lerp(tip, u ** 0.8)
            # The back edge is cut in lobes, as a leaf with teeth.
            lobe = abs(math.sin(math.pi * u * 3)) * 0.05 * (1 - u)
            back = back.lerp(front, lobe / max((back - front).length, 1e-4))
            return front, back

        def grid(depth):
            result = []
            for row in range(rows + 1):
                v = row / rows
                line = []
                for column in range(columns + 1):
                    u = column / columns
                    front, back = edges(u)
                    camber = 0.02 * math.sin(math.pi * v) * (1 - u)
                    line.append(front.lerp(back, v) + normal * (camber + depth))
                result.append(line)
            return result

        def color_of(face_side, row, column):
            # The leaf, on both faces: an amber edge at the back, a light
            # midrib and dark veins.
            if row == rows - 1:
                return WING_EDGE
            if row == 1:
                return WING_LIGHT
            return WING_DARK if column % 3 == 2 else WING

        top = grid(0.003 * sign)
        bottom = grid(-0.003 * sign)
        if sign < 0:
            top = [list(reversed(line)) for line in top]
            bottom = [list(reversed(line)) for line in bottom]

            def mirrored(face_side, row, column):
                return color_of(face_side, row, columns - 1 - column)

            edge_faces = panel(sail, top, bottom, mirrored)
        else:
            edge_faces = panel(sail, top, bottom, color_of)
        sail.paint(edge_faces, WING_EDGE)

        # The twig frame: the spar on the front edge and two ribs to the back edge.
        spar = kit.tube(sail.bm, [edges(u)[0] + normal * 0.008 * sign for u in (0.0, 0.33, 0.66, 1.0)] + [tip + out * 0.03], [0.01, 0.009, 0.007, 0.005, 0.002], 5)
        sail.paint(faces_of(spar), TWIG)
        for u in (0.3, 0.6):
            front, back = edges(u)
            rib = kit.tube(sail.bm, [root + normal * 0.006 * sign, front.lerp(back, 0.5) + normal * 0.008 * sign, back + normal * 0.006 * sign], [0.007, 0.006, 0.002], 4)
            sail.paint(faces_of(rib), TWIG)
        parts.append(sail)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CanopySkirmisher", BONES)
    parts = head_parts() + body_parts() + limb_parts() + spear_parts() + wing_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CanopySkirmisherMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------

# How high her feet hang above the ground at rest.
FLOAT = 0.15


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

    def wings(beat, fold=0.0, sweep=0.0):
        """
        `beat` -1 to 1 opens and closes the V of the wings; `fold` folds them
        onto her back. `sweep` turns them back, in degrees, when she leans
        forward, so they stay above her back.
        """
        return {
            "wing.L": t("wing.L", (Y, -10 * beat - 30 * fold), (X, 20 * fold - sweep)),
            "wing.R": t("wing.R", (Y, 10 * beat + 30 * fold), (X, 20 * fold - sweep)),
            "wing.L@scale": lerp(1.0, 0.3, fold),
            "wing.R@scale": lerp(1.0, 0.3, fold),
        }

    def stand(bob=0.0, beat=0.0, sway=0.0):
        """
        The hover: her feet hang with the toes down, the body leans a little
        forward, the spear is held ready to the front and the wings beat.
        """
        return {
            "root@loc": at("root", (0, 0, FLOAT + 0.025 * bob)),
            "hips": t("hips", (X, 10), (Y, sway * 2)),
            "spine": t("spine", (X, 6)),
            "chest": t("chest", (X, -6), (Z, -6)),
            "neck": t("neck", (X, -4), (Z, -4)),
            "head": t("head", (Z, -6 + sway * 4), (X, -8 + bob * 2)),
            "hair": t("hair", (X, -8 - bob * 4), (Y, sway * 4)),
            "scarf": t("scarf", (Z, sway * 8), (X, -6 + bob * 6)),
            "ladder": t("ladder", (X, -4 + bob * 4), (Y, sway * 6)),
            **wings(beat),
            "upperarm.R": t("upperarm.R", (X, -10 - bob * 2), (Y, -4)),
            "forearm.R": t("forearm.R", (X, -4)),
            "upperarm.L": t("upperarm.L", (Y, 14 + bob * 4), (X, 16)),
            "forearm.L": t("forearm.L", (X, -20)),
            "thigh.L": t("thigh.L", (X, -26 + sway * 4), (Y, -4)),
            "shin.L": t("shin.L", (X, 54)),
            "foot.L": t("foot.L", (X, 40)),
            "thigh.R": t("thigh.R", (X, 2 - sway * 4), (Y, 4)),
            "shin.R": t("shin.R", (X, 36)),
            "foot.R": t("foot.R", (X, 46)),
        }

    def slump(bob=0.0):
        """Low HP: lower, the wings droop and beat slowly; she hangs limp, and the spear points down."""
        return pose(
            stand(),
            root_at_loc=at("root", (0, 0, FLOAT * 0.45 + 0.015 * bob)),
            hips=t("hips", (X, 2)),
            spine=t("spine", (X, 14 + bob * 3)),
            chest=t("chest", (X, 8), (Z, -6)),
            head=t("head", (Z, -6), (X, 18 + bob * 4), (Y, 10)),
            hair=t("hair", (X, 14)),
            scarf=t("scarf", (X, 30)),
            ladder=t("ladder", (X, 6)),
            **wings(-0.8 + bob * 0.4, 0.15),
            upperarm__R=t("upperarm.R", (X, 26), (Y, -6)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, 6), (X, 6)),
            thigh__L=t("thigh.L", (X, -6), (Y, -4)),
            shin__L=t("shin.L", (X, 20)),
            thigh__R=t("thigh.R", (X, 6), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
        )

    def recoil(base, amount=1.0):
        """A hit knocks her back, and the wings jolt open."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.05 * amount, FLOAT + 0.03 * amount)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, -2)),
            head=t("head", (Z, -6), (X, -18 * amount)),
            hair=t("hair", (X, 14 * amount)),
            ladder=t("ladder", (X, 30 * amount)),
            **wings(1.2 * amount),
            upperarm__R=t("upperarm.R", (X, 20 * amount), (Y, -20 * amount)),
            upperarm__L=t("upperarm.L", (Y, 30 * amount), (X, 10)),
            thigh__L=t("thigh.L", (X, -40 * amount)),
            thigh__R=t("thigh.R", (X, -20 * amount)),
        )

    def tumble(base):
        """The wings fold, and she drops."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.04, FLOAT * 0.5)),
            root=t("root", (X, -20)),
            spine=t("spine", (X, -10)),
            head=t("head", (X, -24)),
            hair=t("hair", (X, 30)),
            ladder=t("ladder", (X, 40)),
            **wings(-0.5, 0.6),
            upperarm__R=t("upperarm.R", (X, -60), (Y, -40)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 40)),
            thigh__L=t("thigh.L", (X, -50)),
            shin__L=t("shin.L", (X, 70)),
            thigh__R=t("thigh.R", (X, -30)),
            shin__R=t("shin.R", (X, 60)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back on the ground, the wings folded under her and the spear beside her."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4), (Z, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -30)),
            hair=t("hair", (X, -40)),
            scarf=t("scarf", (X, -40)),
            ladder=t("ladder", (X, -50)),
            **wings(0.0, 1.0),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -20)),
            forearm__R=t("forearm.R", (X, 0)),
            upperarm__L=t("upperarm.L", (Y, 40), (X, -20)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -6), (Y, 6)),
            shin__R=t("shin.R", (X, 12)),
            foot__R=t("foot.R", (X, 10)),
        )

    def crouch(base, open_amount=0.3):
        """On the ground on bent knees, the wings half closed, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, 0.0)),
            hips=t("hips", (X, 0)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, -8)),
            **wings(-0.6, 1 - open_amount),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -10)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 110)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -60), (Y, 6)),
            shin__R=t("shin.R", (X, 120)),
            foot__R=t("foot.R", (X, -50)),
        )

    def leap(base):
        """Up in the air, the wings wide open and the spear high: the end of a summon and a Rebirth."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, FLOAT + 0.07)),
            chest=t("chest", (X, -12), (Z, -8)),
            head=t("head", (Z, -10), (X, -16)),
            **wings(1.4),
            upperarm__R=t("upperarm.R", (X, -110), (Y, -20)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, 50)),
            thigh__L=t("thigh.L", (X, -50)),
            shin__L=t("shin.L", (X, 80)),
        )

    def glide(phase):
        """Swift: a fast glide forward, the body level, the legs kick and the wings beat fast. `phase` goes round 0..1."""
        a = 2 * math.pi * phase
        return pose(
            stand(math.sin(a), math.sin(2 * a), math.sin(a + 1)),
            root_at_loc=at("root", (0, 0, FLOAT + 0.03 * math.sin(2 * a))),
            hips=t("hips", (X, 24)),
            spine=t("spine", (X, 14)),
            chest=t("chest", (X, -4), (Z, -6)),
            head=t("head", (X, -24), (Z, -6)),
            hair=t("hair", (X, 20)),
            **wings(math.sin(2 * a), 0.0, 36),
            scarf=t("scarf", (X, 24), (Z, 10 * math.sin(a))),
            ladder=t("ladder", (X, 30 + 10 * math.sin(a))),
            thigh__L=t("thigh.L", (X, -12 + 20 * math.sin(a)), (Y, -4)),
            shin__L=t("shin.L", (X, 50 - 10 * math.sin(a))),
            thigh__R=t("thigh.R", (X, -12 - 20 * math.sin(a)), (Y, 4)),
            shin__R=t("shin.R", (X, 50 + 10 * math.sin(a))),
        )

    # The attack (Swift): she rises with the spear drawn back, then dives at
    # the target and thrusts the spear through it. The slash effect starts at
    # 50% of the attack (`MELEE_IMPACT` in fx.ts), so the thrust lands at
    # frame 15 of 30.
    def rise(base):
        return pose(
            base,
            root_at_loc=at("root", (0, 0.06, FLOAT + 0.09)),
            root=t("root", (X, -10)),
            chest=t("chest", (X, -12), (Z, -14)),
            head=t("head", (Z, -4), (X, -6)),
            **wings(1.3),
            upperarm__R=t("upperarm.R", (X, 40), (Y, -20)),
            forearm__R=t("forearm.R", (X, -40)),
            upperarm__L=t("upperarm.L", (Y, 30), (X, -20)),
            thigh__L=t("thigh.L", (X, -40)),
            shin__L=t("shin.L", (X, 70)),
            thigh__R=t("thigh.R", (X, -20)),
            shin__R=t("shin.R", (X, 60)),
        )

    def dive(base):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.22, FLOAT - 0.07)),
            root=t("root", (X, 26)),
            hips=t("hips", (X, 0)),
            chest=t("chest", (X, 4), (Z, 6)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -22)),
            hair=t("hair", (X, 30)),
            scarf=t("scarf", (X, 40)),
            ladder=t("ladder", (X, 50)),
            **wings(-1.0, 0.25, 30),
            upperarm__R=t("upperarm.R", (X, -50), (Y, -6)),
            forearm__R=t("forearm.R", (X, 30)),
            upperarm__L=t("upperarm.L", (Y, 20), (X, 40)),
            thigh__L=t("thigh.L", (X, 20)),
            shin__L=t("shin.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 30)),
            shin__R=t("shin.R", (X, 20)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 4):
        a = 2 * math.pi * frame / 48
        # The wings beat four times in the loop.
        idle.key(frame, stand(math.sin(a), math.sin(4 * a), math.sin(a + 1.2)))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame in range(0, 49, 8):
        a = 2 * math.pi * frame / 48
        low.key(frame, slump(math.sin(a)))
    clips.append(low)

    walk = Clip("walk", 16, loop=True)
    for frame in range(0, 17, 2):
        walk.key(frame, glide(frame / 16))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, rise(stand())).key(15, dive(stand())).key(19, dive(stand()))
    attack.key(26, stand(0.5)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, tumble(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then the
    # wings open again and lift her up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(12, tumble(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand(), 0.3)).key(41, leap(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(), 0.0)).key(8, crouch(stand(), 0.6)).key(16, leap(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "canopy-skirmisher.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
