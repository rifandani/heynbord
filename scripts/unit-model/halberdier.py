"""
Halberdier (`human.halberdier`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a stern veteran with short grey
hair, a grey moustache, a steel breastplate over a padded tan coat, steel
shoulder guards and gauntlets, a blue tabard with gold trim and a gold lily
below the belt, tall boots with steel knee guards and a halberd with a small
blue and gold banner below the blade. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/halberdier.glb`;
then `bun unit-model:pack halberdier` packs it for the game.

He holds the halberd high in a guard: the right hand at the right hip, on the
camera side, the left hand in front, and the blade up and forward above his
head. The left hand stays on the shaft with IK to a grip bone of the
halberd, and the right hand drives the halberd with IK and a Copy Rotation.
The blade and the banner are in the plane of the shaft and the up axis, so
the camera sees their face. His attack is a chop. Retaliate has no attack
event, so his `hurt` clip shows it: he takes the hit and chops back. He has
no Keyword that he uses by his own action, so he has no cast clip.
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

SKIN = hex_color("#d9a07e")
HAIR = hex_color("#a29d95")
HAIR_LIGHT = hex_color("#c8c3ba")
EYES = hex_color("#231a14")
BROW = hex_color("#8a857d")
STEEL = hex_color("#c3c7cb")
STEEL_DARK = hex_color("#7f858b")
COAT = hex_color("#c4ad86")
COAT_DARK = hex_color("#9c8763")
BLUE = hex_color("#2c4a9a")
BLUE_DARK = hex_color("#1d336e")
GOLD = hex_color("#dcaa42")
GOLD_DARK = hex_color("#9e7428")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#4a2e1c")
TROUSERS = hex_color("#4b382c")
BOOT = hex_color("#5a3a22")
SHAFT = hex_color("#7a5432")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.872))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.058

# The right hand holds the halberd at the right hip, and the halberd points
# up and forward. The left hand holds it in front. These are the rest (bind)
# positions.
SL = Vector((0.118, 0, SHOULDER_Z))
SR = Vector((-0.118, 0, SHOULDER_Z))
ER = Vector((-0.18, 0.08, 0.6))
WR = Vector((-0.09, 0.0, 0.53))
TR = WR + (WR - ER).normalized() * 0.04
GRIP_R = WR + (WR - ER).normalized() * 0.022
HALBERD = Vector((-0.04, -0.7, 1)).normalized()
FRONT_GRIP = 0.26
GRIP_L = GRIP_R + HALBERD * FRONT_GRIP
WL = GRIP_L
EL = Vector((0.1, -0.12, 0.62))
TL = WL + (WL - EL).normalized() * 0.04
SHAFT_BACK = 0.26
SHAFT_FRONT = 0.6
# Across the shaft, in the plane of the shaft and the up axis: the blade is
# on the -SIDE side (forward and down), the hook on the +SIDE side.
SIDE = HALBERD.cross(X).normalized()
FACE = HALBERD.cross(SIDE).normalized()
# The banner hangs from the shaft below the blade.
BANNER_TOP = GRIP_R + HALBERD * (SHAFT_FRONT - 0.09)

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    # The tabard hangs below the belt, at the front and at the back.
    ("tabard.F", (0, -0.08, 0.5), (0, -0.1, 0.27), "hips"),
    ("tabard.B", (0, 0.08, 0.5), (0, 0.1, 0.27), "hips"),
    # The poles that the elbows point to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
    ("pole.R", (-0.3, 0.2, 0.3), (-0.3, 0.2, 0.35), "chest"),
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
    ("halberd", tuple(GRIP_R), tuple(GRIP_R + HALBERD * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + HALBERD * 0.05), "halberd"),
    ("banner", tuple(BANNER_TOP), tuple(BANNER_TOP - Z * 0.12), "halberd"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The coat skirt follows the hips at the top and the thighs lower."""
    t = clamp01((0.5 - co.z) / 0.2)
    side = co.x / 0.1
    return {
        "hips": 1 - t * 0.85,
        "thigh.L": t * clamp01(side + 0.3) * 0.85,
        "thigh.R": t * clamp01(-side + 0.3) * 0.85,
    }


def tabard_weights(bone, top=0.5):
    def weights(co):
        if co.z > top:
            return torso_weights(co)
        return blend(bone, "hips", co.z, top - 0.12, top)

    return weights


def banner_weights(co):
    """The cloth is stiff at the shaft and sways lower down."""
    t = clamp01((BANNER_TOP.z - co.z) / 0.08)
    return {"halberd": 1 - t, "banner": t}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head")
    kit.sphere(head.bm, HEAD_C, (0.064, 0.068, 0.08), 14, 10)
    kit.cone(head.bm, (0, -0.064, 0.87), (0, -0.081, 0.858), 0.013, 0.003, 5)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.062 * sign, 0.004, 0.868), (0.012, 0.016, 0.02), 6, 4)
    parts.append(head)

    eyes = Part("eyes", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.025 * sign, -0.057, 0.878), (0.009, 0.007, 0.009), 8, 6)
    # Stern: thick brows, low at the inner ends.
    for sign in (1, -1):
        brow = kit.slab(eyes.bm, (0.026 * sign, -0.062, 0.895), (0.019, 0, 0.006 * sign), (0, 0.005, 0), (0, 0, 0.006))
        eyes.paint(faces_of(brow), BROW)
    parts.append(eyes)

    # Short grey hair, swept back, and grey stubble on the jaw.
    hair = Part("hair", HAIR, "head")
    verts = kit.sphere(hair.bm, (0, 0.006, 0.886), (0.069, 0.074, 0.08), 14, 10)
    face = [v for v in verts if v.co.z < 0.85 or (v.co.y < -0.035 and v.co.z < 0.915)]
    kit.bmesh.ops.delete(hair.bm, geom=face, context="VERTS")
    for f in list(hair.bm.faces):
        if int(f.calc_center_median().x * 90) % 2:
            hair.paint([f], HAIR_LIGHT)
    for sign in (1, -1):
        kit.sphere(hair.bm, (0.058 * sign, 0.02, 0.858), (0.016, 0.03, 0.03), 6, 4)
    parts.append(hair)

    # A thick grey moustache that droops to the jaw, and a short beard.
    beard = Part("beard", HAIR_LIGHT, "head", shade=0.1)
    for sign in (1, -1):
        kit.tube(
            beard.bm,
            [(0.004 * sign, -0.072, 0.848), (0.026 * sign, -0.07, 0.842), (0.042 * sign, -0.06, 0.822), (0.046 * sign, -0.052, 0.8)],
            [0.011, 0.012, 0.009, 0.005],
            5,
        )
    chin = kit.sphere(beard.bm, (0, -0.05, 0.808), (0.03, 0.022, 0.024), 8, 5)
    beard.paint(faces_of(chin), HAIR)
    parts.append(beard)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.81), 0.027, 0.025, 8)
    parts.append(neck)
    return parts


def lily(part, center, normal, size, color):
    """A small gold lily: three petals and a band."""
    normal = Vector(normal).normalized()
    side = normal.cross(Z).normalized()
    out = normal * 0.004
    c = Vector(center)
    parts = [
        kit.cone(part.bm, c + out, c + out + Z * size, size * 0.3, 0.001, 4, squash=0.5),
        kit.cone(part.bm, c + out, c + out + (side * 0.7 + Z * 0.6) * size * 0.8, size * 0.24, 0.001, 4, squash=0.5),
        kit.cone(part.bm, c + out, c + out + (-side * 0.7 + Z * 0.6) * size * 0.8, size * 0.24, 0.001, 4, squash=0.5),
        kit.cone(part.bm, c + out - Z * size * 0.1, c + out - Z * size * 0.55, size * 0.16, size * 0.05, 4, squash=0.5),
        kit.slab(part.bm, c + out * 1.4 - Z * size * 0.08, side * size * 0.38, normal * 0.003, Z * size * 0.07),
    ]
    for verts in parts:
        part.paint(faces_of(verts), color)


def body_parts():
    parts = []
    # The padded coat: tan, with quilted rows.
    coat = Part("coat", COAT, torso_weights, shade=0.12)
    verts = kit.cone(coat.bm, (0, 0, 0.5), (0, 0, 0.73), 0.07, 0.088, 12, squash=0.78)
    for f in faces_of(verts):
        if int(f.calc_center_median().z * 60) % 2:
            coat.paint([f], COAT_DARK)
    parts.append(coat)

    # The steel breastplate with a ridge down the middle and a rolled top.
    plate = Part("breastplate", STEEL, torso_weights, shade=0.14)
    verts = kit.cone(plate.bm, (0, -0.002, 0.53), (0, -0.002, 0.712), 0.082, 0.095, 14, squash=0.8)
    for f in faces_of(verts):
        c = f.calc_center_median()
        if abs(c.x) < 0.012 and c.y < 0:
            plate.paint([f], STEEL_DARK)
    roll = kit.torus(plate.bm, (0, -0.004, 0.71), (0, 0.15, 1), 0.088, 0.008, 14, 4)
    plate.paint(faces_of(roll), STEEL_DARK)
    lip = kit.torus(plate.bm, (0, -0.002, 0.535), (0, 0, 1), 0.08, 0.008, 14, 4)
    plate.paint(faces_of(lip), STEEL_DARK)
    parts.append(plate)

    # A padded collar and a steel gorget.
    collar = Part("collar", STEEL_DARK, "chest", shade=0.08)
    kit.cone(collar.bm, (0, 0.004, 0.72), (0, 0.008, 0.775), 0.066, 0.05, 12, squash=0.88)
    parts.append(collar)

    # The tabard below the belt: blue panels at the front and the back, gold
    # edges, and a gold lily at the front.
    def tabard_grid(sign, offset):
        rows = []
        for z in (0.52, 0.47, 0.38, 0.3, 0.27):
            half = lerp(0.062, 0.078, clamp01((0.52 - z) / 0.25))
            depth = lerp(0.08, 0.11, clamp01((0.52 - z) / 0.25))
            row = []
            for u in (-1, -0.82, -0.4, 0, 0.4, 0.82, 1):
                x = u * half
                y = sign * (depth + offset - abs(u) * 0.016)
                row.append((x, y, z))
            rows.append(row)
        return rows

    for sign, bone, name in ((-1, "tabard.F", "tabardF"), (1, "tabard.B", "tabardB")):
        tabard = Part(name, BLUE, tabard_weights(bone), shade=0.12)

        def color_of(face_side, row, column):
            if row == 3 or column in (0, 5):
                return GOLD
            return BLUE

        edges = panel(tabard, tabard_grid(sign, 0.004), tabard_grid(sign, -0.002), color_of)
        tabard.paint(edges, GOLD_DARK)
        if sign < 0:
            lily(tabard, (0, -0.1, 0.4), (0, -1, -0.12), 0.05, GOLD)
        parts.append(tabard)

    belt = Part("belt", LEATHER, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.5), (0, 0, 0.53), 0.08, 0.08, 12, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.07, 0.515), (0.026, 0.008, 0.024))
    belt.paint(faces_of(buckle), GOLD)
    for x, y in ((0.075, -0.02), (-0.074, 0.03)):
        pouch = kit.box(belt.bm, (x, y, 0.48), (0.026, 0.032, 0.042))
        belt.paint(faces_of(pouch), LEATHER_DARK)
    parts.append(belt)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.42), (0, 0, 0.5), 0.07, 0.068, 12, squash=0.8)
    parts.append(hips)

    # The skirt of the padded coat, to mid thigh.
    skirt = Part("skirt", COAT, skirt_weights, shade=0.1)

    def skirt_color(row, column):
        return COAT_DARK if column % 2 else COAT

    kit.ragged_cone(skirt, 0.51, 0.31, 0.076, 0.1, 16, 3, 0.8, 0.0, skirt_color, COAT_DARK)
    parts.append(skirt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        # Round steel shoulder guards in two plates.
        guard = Part(f"pauldron.{side}", STEEL, f"upperarm.{side}", shade=0.1)
        top = kit.sphere(guard.bm, s + Vector((0.008 * sign, 0, 0.012)), (0.048, 0.046, 0.036), 10, 7)
        guard.paint({f for v in top if v.co.z < s.z - 0.008 for f in v.link_faces}, STEEL_DARK)
        kit.sphere(guard.bm, s + Vector((0.018 * sign, 0, -0.02)), (0.04, 0.04, 0.024), 10, 6)
        parts.append(guard)

        sleeve = Part(f"sleeve.{side}", COAT, f"upperarm.{side}", shade=0.08)
        verts = kit.cone(sleeve.bm, s, e, 0.029, 0.025, 8)
        for f in faces_of(verts):
            if int(f.calc_center_median().z * 60) % 2:
                sleeve.paint([f], COAT_DARK)
        parts.append(sleeve)

        couter = Part(f"couter.{side}", STEEL, f"forearm.{side}", shade=0.06)
        kit.sphere(couter.bm, e, (0.028, 0.028, 0.028), 8, 6)
        parts.append(couter)

        vambrace = Part(f"vambrace.{side}", STEEL, f"forearm.{side}", shade=0.08)
        verts = kit.cone(vambrace.bm, e + d * 0.01, w - d * 0.012, 0.025, 0.023, 8)
        vambrace.paint({f for v in verts if (v.co - w).length < 0.03 for f in v.link_faces}, STEEL_DARK)
        parts.append(vambrace)

        gauntlet = Part(f"gauntlet.{side}", STEEL_DARK, f"hand.{side}", shade=0.05)
        kit.sphere(gauntlet.bm, w + d * 0.022, (0.021, 0.02, 0.026), 8, 6)
        cuff = kit.cone(gauntlet.bm, w - d * 0.01, w + d * 0.012, 0.03, 0.026, 8)
        gauntlet.paint(faces_of(cuff), STEEL)
        parts.append(gauntlet)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.042, 0.032, 8)
        parts.append(thigh)

        # Tall boots with a steel knee guard.
        boot = Part(f"boot.{side}", BOOT, f"shin.{side}")
        kit.cone(boot.bm, knee - Vector((0, 0, 0.02)), ankle, 0.035, 0.031, 8)
        top = kit.cone(boot.bm, knee, knee - Vector((0, 0, 0.05)), 0.041, 0.037, 8)
        boot.paint(faces_of(top), LEATHER)
        parts.append(boot)

        cop = Part(f"cop.{side}", STEEL_DARK, f"shin.{side}", shade=0.1)
        verts = kit.sphere(cop.bm, knee + Vector((0, -0.03, 0.004)), (0.032, 0.024, 0.036), 8, 6)
        cop.paint({f for v in verts if v.co.z > knee.z + 0.01 for f in v.link_faces}, STEEL)
        parts.append(cop)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}")
        kit.box(foot.bm, (LEG_X * sign, -0.028, 0.024), (0.054, 0.11, 0.048))
        heel = kit.box(foot.bm, (LEG_X * sign, 0.012, 0.012), (0.052, 0.03, 0.024))
        foot.paint(faces_of(heel), LEATHER_DARK)
        parts.append(foot)
    return parts


def halberd_parts():
    halberd = Part("halberd", SHAFT, "halberd", shade=0.04)
    butt = GRIP_R - HALBERD * SHAFT_BACK
    top = GRIP_R + HALBERD * SHAFT_FRONT
    kit.cone(halberd.bm, butt, top, 0.0095, 0.009, 6)
    cap = kit.cone(halberd.bm, butt - HALBERD * 0.01, butt + HALBERD * 0.03, 0.012, 0.011, 6)
    halberd.paint(faces_of(cap), STEEL_DARK)
    # Leather wraps where the hands hold it.
    for along in (-0.03, FRONT_GRIP - 0.03):
        wrap = kit.cone(halberd.bm, GRIP_R + HALBERD * along, GRIP_R + HALBERD * (along + 0.06), 0.011, 0.011, 6)
        halberd.paint(faces_of(wrap), LEATHER_DARK)

    # The head: langets down the shaft, a socket, the top spike, the axe
    # blade (forward and down) and the back hook. Each is flat in the plane
    # of the shaft and the up axis.
    head = set()
    for sign in (1, -1):
        head |= set(kit.slab(halberd.bm, top - HALBERD * 0.07 + FACE * 0.009 * sign, SIDE * 0.006, FACE * 0.002, HALBERD * 0.07))
    head |= set(kit.cone(halberd.bm, top - HALBERD * 0.02, top + HALBERD * 0.06, 0.012, 0.011, 6))
    halberd.paint(faces_of(head), STEEL_DARK)
    spike = kit.cone(halberd.bm, top + HALBERD * 0.06, top + HALBERD * 0.19, 0.016, 0.001, 4, squash=0.35)
    halberd.paint(faces_of(spike), STEEL)

    # The axe blade: a wide crescent on the -SIDE side.
    columns = 6
    blade_low, blade_high = -0.035, 0.07

    def blade_grid(depth):
        inner, outer = [], []
        for c in range(columns + 1):
            s = c / columns
            inner.append(top + HALBERD * lerp(blade_low + 0.02, blade_high - 0.02, s) - SIDE * 0.01 + FACE * depth)
            reach = 0.105 + 0.02 * math.sin(math.pi * s)
            outer.append(top + HALBERD * lerp(blade_low - 0.04, blade_high + 0.03, s) - SIDE * reach + FACE * depth * 0.4)
        return [inner, outer]

    def blade_color(face_side, row, column):
        return STEEL

    edges = panel(halberd, blade_grid(0.004), blade_grid(-0.004), blade_color)
    halberd.paint(edges, STEEL_DARK)

    # The back hook: a short curved spike on the +SIDE side.
    hook = kit.tube(
        halberd.bm,
        [top + HALBERD * 0.02 + SIDE * 0.008, top + HALBERD * 0.015 + SIDE * 0.05, top - HALBERD * 0.01 + SIDE * 0.085],
        [0.011, 0.007, 0.002],
        4,
    )
    halberd.paint(faces_of(hook), STEEL_DARK)
    return [halberd]


def banner_parts():
    """A small blue banner with a gold edge and a gold lily, under the blade."""
    banner = Part("banner", BLUE, banner_weights, shade=0.1)
    length = 0.13
    drop = 0.19
    columns, rows = 3, 4

    def grid(depth):
        result = []
        for r in range(rows + 1):
            v = r / rows
            row = []
            for c in range(columns + 1):
                u = c / columns
                along = BANNER_TOP - HALBERD * (u * length)
                # A swallowtail: the middle of the bottom edge is cut up.
                cut = 0.045 * (1 - abs(u - 0.5) * 2) * v
                row.append(along - Z * (drop * v - cut) + FACE * depth - SIDE * 0.004)
            result.append(row)
        return result

    def color_of(face_side, row, column):
        if row == rows - 1:
            return GOLD
        return BLUE if face_side == "front" else BLUE_DARK

    edges = panel(banner, grid(0.003), grid(-0.003), color_of)
    banner.paint(edges, GOLD_DARK)
    mid = BANNER_TOP - HALBERD * (length / 2) - Z * 0.08
    for sign in (1, -1):
        lily(banner, mid + FACE * 0.003 * sign, FACE * sign, 0.05, GOLD)
    return [banner]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("Halberdier", BONES)
    parts = head_parts() + body_parts() + limb_parts() + halberd_parts() + banner_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "HalberdierMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the shaft, the right hand to drive it. The halberd aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "halberd_aim": kit.add_empty("halberd_aim"),
    }
    bones = rig.pose.bones
    for side, target, subtarget in (("L", rig, "grip.L"), ("R", empties["ik_hand.R"], "")):
        ik = bones[f"forearm.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = target
        if subtarget:
            ik.subtarget = subtarget
        ik.pole_target = rig
        ik.pole_subtarget = f"pole.{side}"
        ik.pole_angle = math.radians(POLE_ANGLE)
        ik.chain_count = 2
    aim = bones["halberd"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["halberd_aim"]
    return empties


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

    halberd_rest = rig.data.bones["halberd"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the halberd that points it along `direction`."""
        return HALBERD.rotation_difference(Vector(direction).normalized()) @ halberd_rest

    def held(base, hand, direction):
        """The right hand and the halberd by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "halberd_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "halberd_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, sway=0.0):
        """
        On guard: the left foot in front, turned a little to his right, the
        halberd high and ready. He watches along the shaft, and the banner
        stirs.
        """
        return held(
            {
                "hips@loc": at("hips", (0, 0, -0.016 - breath * 0.004)),
                "hips": t("hips", (Z, -14)),
                "spine": t("spine", (Z, -2), (X, 3 + breath)),
                "chest": t("chest", (X, -3 - breath * 2)),
                "neck": t("neck", (Z, 6)),
                "head": t("head", (Z, 8 + sway * 3), (X, 2 + breath * 2)),
                "thigh.L": t("thigh.L", (X, -20), (Y, -6)),
                "shin.L": t("shin.L", (X, 20)),
                "foot.L": t("foot.L", (X, 0)),
                "thigh.R": t("thigh.R", (X, 12), (Y, 8)),
                "shin.R": t("shin.R", (X, 12)),
                "foot.R": t("foot.R", (X, -24)),
                "tabard.F": t("tabard.F", (X, -8 - breath * 2), (Y, sway * 3)),
                "tabard.B": t("tabard.B", (X, 4 + breath * 2)),
                "banner": t("banner", (X, sway * 8), (Y, sway * 4)),
                "forearm.L/IK": 1.0,
            },
            (-0.09, 0.0 - breath * 0.004, 0.53 - breath * 0.006),
            (-0.04 + sway * 0.02, -0.7, 1),
        )

    def winded(breath=0.0):
        """Low HP: bent over, he leans on the halberd, its butt on the ground."""
        return held(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.03, -0.06)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, 24 + breath * 4)),
                chest=t("chest", (X, 10 + breath * 3)),
                neck=t("neck", (X, -14)),
                head=t("head", (X, -12 - breath * 4), (Y, -6)),
                thigh__L=t("thigh.L", (X, -30), (Y, -6)),
                shin__L=t("shin.L", (X, 34)),
                foot__L=t("foot.L", (X, -4)),
                thigh__R=t("thigh.R", (X, -10), (Y, 6)),
                shin__R=t("shin.R", (X, 30)),
                foot__R=t("foot.R", (X, -18)),
                tabard__F=t("tabard.F", (X, 16)),
                tabard__B=t("tabard.B", (X, -6)),
                banner=t("banner", (X, -breath * 4)),
            ),
            (-0.07, -0.2, 0.4 - breath * 0.01),
            (0.02, -0.08, 1),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the halberd tips back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.02 - 0.006 * amount)),
            spine=t("spine", (Z, -2), (X, -8 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -16 * amount)),
            tabard__F=t("tabard.F", (X, -22 * amount)),
            banner=t("banner", (X, 16 * amount)),
            ik_hand__R_at_pos=Vector((-0.09, 0.05 * amount, 0.54 + 0.02 * amount)),
            halberd_aim_at_rot=aimed((-0.04, -0.7 + 0.4 * amount, 1)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            tabard__F=t("tabard.F", (X, 10)),
            tabard__B=t("tabard.B", (X, -16)),
            banner=t("banner", (X, -20)),
            ik_hand__R_at_pos=Vector((-0.1, -0.02, 0.42)),
            halberd_aim_at_rot=aimed((0.3, -1, 0.1)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back. The hands let go, and the halberd lies flat beside him."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.13)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, -28)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (Y, 30), (X, -10)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (Z, -30)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            tabard__F=t("tabard.F", (X, -12)),
            tabard__B=t("tabard.B", (X, 0)),
            banner=t("banner", (X, 0)),
            forearm__L_slash_IK=0.0,
            forearm__R_slash_IK=0.0,
            halberd_slash_Aim=1.0,
            halberd_aim_at_rot=aimed((0.35, -1, -0.02)),
        )

    def crouch(base):
        """Low on one knee, the halberd upright, as a summon starts and a Rebirth gets up."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.17)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, 26)),
                chest=t("chest", (X, 6)),
                neck=t("neck", (X, -10)),
                head=t("head", (X, -10)),
                thigh__L=t("thigh.L", (X, -72), (Y, -4)),
                shin__L=t("shin.L", (X, 92)),
                foot__L=t("foot.L", (X, -20)),
                thigh__R=t("thigh.R", (X, -4), (Y, 4)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -44)),
                tabard__F=t("tabard.F", (X, 36)),
                tabard__B=t("tabard.B", (X, -20)),
            ),
            (-0.1, -0.12, 0.34),
            (0.05, -0.2, 1),
        )

    def proud(base):
        """Up again, the halberd upright beside him: the end of a summon and a Rebirth."""
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.004)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, -2)),
                chest=t("chest", (X, -8)),
                head=t("head", (Z, 8), (X, -10)),
                thigh__L=t("thigh.L", (X, -6), (Y, -4)),
                shin__L=t("shin.L", (X, 6)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 2), (Y, 4)),
                shin__R=t("shin.R", (X, 4)),
                foot__R=t("foot.R", (X, -6)),
                tabard__F=t("tabard.F", (X, 0)),
                banner=t("banner", (X, 6)),
            ),
            (-0.14, -0.06, 0.6),
            (0.02, -0.12, 1),
        )

    def step(front):
        """A march, the halberd high. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03)),
            hips=t("hips", (Z, -12), (Y, 4 * front)),
            spine=t("spine", (Z, -2), (X, 8)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 18)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 22)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "tabard__F": t("tabard.F", (X, -14 * front)),
                "tabard__B": t("tabard.B", (X, 10)),
                "banner": t("banner", (X, 10 * front)),
                "ik_hand__R_at_pos": Vector((-0.09, 0.0, 0.51)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.008)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (Z, -2), (X, 8)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -26)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 56)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 12)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -10)),
                "tabard__F": t("tabard.F", (X, -4)),
                "tabard__B": t("tabard.B", (X, 6)),
                "banner": t("banner", (X, 0)),
                "ik_hand__R_at_pos": Vector((-0.09, 0.0, 0.54)),
            },
        )

    # The attack: the halberd goes up and back, then he steps in and chops
    # down with the axe blade. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the chop lands at frame 15 of 30.
    def raise_up(base, amount=1.0):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03 * amount, -0.03)),
                hips=t("hips", (Z, -22 * amount)),
                spine=t("spine", (Z, -6 * amount), (X, -4 * amount)),
                chest=t("chest", (Z, -6 * amount), (X, -6 * amount)),
                neck=t("neck", (Z, 10)),
                head=t("head", (Z, 14), (X, 0)),
                thigh__L=t("thigh.L", (X, -18), (Y, -6)),
                shin__L=t("shin.L", (X, 22)),
                thigh__R=t("thigh.R", (X, 18), (Y, 8)),
                shin__R=t("shin.R", (X, 28)),
                foot__R=t("foot.R", (X, -32)),
                banner=t("banner", (X, 14 * amount)),
            ),
            (-0.1, lerp(0.0, 0.06, amount), lerp(0.53, 0.66, amount)),
            (0.06, lerp(-0.7, 0.25, amount), 1),
        )

    def chop(base, amount=1.0):
        return held(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.1 * amount, -0.07 * amount)),
                hips=t("hips", (Z, -6)),
                spine=t("spine", (Z, 4), (X, 20 * amount)),
                chest=t("chest", (Z, 6), (X, 8 * amount)),
                neck=t("neck", (Z, 0)),
                head=t("head", (Z, 4), (X, -18 * amount)),
                thigh__L=t("thigh.L", (X, -60 * amount), (Y, -6)),
                shin__L=t("shin.L", (X, 60 * amount)),
                foot__L=t("foot.L", (X, 0)),
                thigh__R=t("thigh.R", (X, 28 * amount), (Y, 6)),
                shin__R=t("shin.R", (X, 12)),
                foot__R=t("foot.R", (X, -14)),
                tabard__F=t("tabard.F", (X, -28 * amount)),
                tabard__B=t("tabard.B", (X, 28 * amount)),
                banner=t("banner", (X, -30 * amount)),
            ),
            (-0.05, lerp(0.0, -0.13, amount), lerp(0.53, 0.52, amount)),
            (0.08, -1, lerp(0.8, -0.3, amount)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, winded(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, raise_up(stand())).key(15, chop(stand())).key(21, chop(stand()))
    attack.key(28, stand()).key(30, stand())
    clips.append(attack)

    # Hurt: the hit pushes him back, then he chops back at once (Retaliate).
    hurt = Clip("hurt", 20)
    hurt.key(0, stand()).key(3, recoil(stand())).key(7, raise_up(recoil(stand(), 0.6), 0.7))
    hurt.key(11, chop(stand(), 0.85)).key(14, chop(stand(), 0.8)).key(20, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.19))))
    summon.key(17, proud(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "halberdier.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
