"""
Skyreaver (`orc.skyreaver`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a lean orc woman with a wild
grin, wild dark hair, brass flying goggles and a stolen hat with a gold
badge and a red and white feather. She has a leather vest with brass
buckles, a red scarf, orange paint stripes on her arms and legs, leather
shorts and fur boots. She hangs under a glider: wide wings of cream hide
on a bone frame, with orange-red tribal paint and a scalloped edge. Her
right hand holds a long snatching hook, and a second stolen hat hangs on
it. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/skyreaver.glb`; then `bun unit-model:pack skyreaver`
packs it for the game.

She is Flying: her feet hang above the ground, with the toes down. The game
puts the rest pose on the ground, so the clips lift the `root`. The glider
banks a little to the camera side, so the camera sees the paint on its
wings. The left hand always holds a strut of the glider (IK to the `grip.L`
bone). The `wing.L` and `wing.R` bones flex the wings, and the `glider` bone
scales the glider: it folds onto her back when she falls. She is Swift and
Heroic: her attack is a dive with a swing of the hook. She has no Keyword
that she uses by her own action, so she has no cast clip.
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

SKIN = hex_color("#a8a64a")
SKIN_DARK = hex_color("#7a7a34")
HAIR = hex_color("#3a2a20")
HAIR_LIGHT = hex_color("#56402e")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#4e1a16")
TUSK = hex_color("#f0e6c8")
PAINT = hex_color("#d0602a")
BRASS = hex_color("#c89a46")
LENS = hex_color("#e8c070")
HAT = hex_color("#2c3550")
HAT_DARK = hex_color("#1c2236")
GOLD = hex_color("#dcae4a")
FEATHER = hex_color("#c0302a")
FEATHER_LIGHT = hex_color("#efe6d6")
LEATHER = hex_color("#6a4428")
LEATHER_DARK = hex_color("#402818")
SCARF = hex_color("#b8342a")
SCARF_DARK = hex_color("#741e18")
FUR = hex_color("#cdb894")
HIDE = hex_color("#ead4a4")
HIDE_DARK = hex_color("#c9ae7c")
TRIBAL = hex_color("#c84826")
BONE = hex_color("#e2d6b6")
BONE_DARK = hex_color("#ab9c7a")
WOOD = hex_color("#6a4a30")
STEEL = hex_color("#b4b0a6")

# --- Proportions ---------------------------------------------------------------

# She is lean and a little small.
HIP_Z = 0.45
WAIST_Z = 0.53
CHEST_Z = 0.61
SHOULDER_Z = 0.69
NECK_Z = 0.72
HEAD_C = Vector((0, -0.016, 0.81))
KNEE_Z = 0.255
ANKLE_Z = 0.055
LEG_X = 0.062

# The glider is above her head. These are the rest (bind) positions.
# The Battle camera sees her side, so the wings are long from front to back,
# as a kite, and not very wide: from the side they still show as a big sail.
GLIDER_Z = 1.06
NOSE = Vector((0, -0.26, GLIDER_Z - 0.03))
TAIL = Vector((0, 0.32, GLIDER_Z))
SPAN = 0.33
TIP_Y = 0.2
TIP_RISE = 0.05

# The left hand holds a strut of the glider over her left shoulder; the
# right arm holds the hook to the front.
GRIP_L = Vector((0.13, -0.07, 0.94))
SL = Vector((0.135, 0, SHOULDER_Z))
EL = Vector((0.21, 0.01, 0.81))
WL = GRIP_L
TL = WL + (WL - EL).normalized() * 0.05
SR = Vector((-0.135, 0, SHOULDER_Z))
ER = Vector((-0.19, -0.05, 0.58))
WR = Vector((-0.19, -0.17, 0.55))
TR = WR + (WR - ER).normalized() * 0.05
GRIP_R = WR + (WR - ER).normalized() * 0.028
HOOK = Vector((0, -0.9, -0.22)).normalized()
HOOK_LENGTH = 0.34

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.006, NECK_Z), (0, -0.01, 0.755), "chest"),
    ("head", (0, -0.01, 0.755), (0, -0.016, 0.9), "neck"),
    ("hair", (0, 0.06, 0.83), (0, 0.14, 0.66), "head"),
    ("scarf", (0, 0.05, 0.72), (0, 0.2, 0.66), "chest"),
    # The glider hangs from her harness: it scales round her shoulders.
    ("glider", (0, 0.05, 0.72), (0, 0.0, GLIDER_Z), "root"),
    ("wing.L", (0.05, -0.01, GLIDER_Z), (SPAN, TIP_Y, GLIDER_Z + TIP_RISE), "glider"),
    ("wing.R", (-0.05, -0.01, GLIDER_Z), (-SPAN, TIP_Y, GLIDER_Z + TIP_RISE), "glider"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + Vector((0, 0, 0.05))), "glider"),
    # The pole that the left elbow points to: out and back.
    ("pole.L", (0.4, 0.2, 0.7), (0.4, 0.2, 0.75), "chest"),
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
        return blend("hips", "spine", co.z, 0.48, 0.56)
    return blend("spine", "chest", co.z, 0.58, 0.65)


def hair_weights(co):
    return blend("hair", "head", co.z, 0.76, 0.83)


def scarf_weights(co):
    return {"scarf": clamp01((co.y - 0.04) / 0.06), "chest": 1 - clamp01((co.y - 0.04) / 0.06)}


def sail_weights(co):
    """The middle of the glider follows the frame, and each wing bends further out."""
    t = clamp01((abs(co.x) - 0.06) / 0.22)
    wing = "wing.L" if co.x > 0 else "wing.R"
    return {"glider": 1 - t, wing: t}


def harness_weights(co):
    """The cords go from her back to the glider."""
    return blend("chest", "glider", co.z, 0.76, 0.9)


# --- Parts ---------------------------------------------------------------------


def hat(part, center, up, front, size=1.0):
    """A stolen hat: a wide dark brim turned up at the sides, a crown, a gold band, a gold badge and a feather."""
    up = Vector(up).normalized()
    front = Vector(front).normalized()
    side = front.cross(up).normalized()
    brim = kit.cone(part.bm, center - up * 0.006 * size, center + up * 0.006 * size, 0.1 * size, 0.096 * size, 14)
    part.paint(faces_of(brim), HAT_DARK)
    # The sides of the brim turn up.
    for sign in (1, -1):
        flap = kit.slab(part.bm, center + side * sign * 0.075 * size + up * 0.03 * size, side * sign * 0.008 * size + up * -0.004 * size, front * 0.06 * size, up * 0.03 * size + side * sign * 0.012 * size)
        part.paint(faces_of(flap), HAT)
    crown = kit.cone(part.bm, center, center + up * 0.07 * size, 0.06 * size, 0.05 * size, 10)
    part.paint(faces_of(crown), HAT)
    band = kit.cone(part.bm, center + up * 0.006 * size, center + up * 0.022 * size, 0.062 * size, 0.06 * size, 10)
    part.paint(faces_of(band), GOLD)
    badge = kit.sphere(part.bm, center + up * 0.03 * size + front * 0.06 * size, (0.02 * size, 0.02 * size, 0.02 * size), 8, 5)
    part.paint(faces_of(badge), GOLD)
    for index, (color, lean) in enumerate(((FEATHER, 0.0), (FEATHER_LIGHT, 0.4))):
        root = center + up * 0.05 * size - side * 0.04 * size
        tip = root + (up * 0.08 - front * 0.08 - side * (0.04 + lean * 0.04)) * size
        feather = kit.tube(part.bm, [root, (root + tip) / 2 + up * 0.02 * size, tip], [0.016 * size, 0.018 * size, 0.003 * size], 5)
        part.paint(faces_of(feather), color)


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.062, 0.066, 0.068), 12, 9)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.042)), (0.054, 0.045, 0.034), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.062, 0.002)), HEAD_C + Vector((0, -0.078, -0.014)), 0.015, 0.006, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.058 * sign, 0.008, 0.004)), HEAD_C + Vector((0.125 * sign, 0.04, 0.03)), 0.019, 0.002, 5, squash=0.4)
        ring = kit.torus(head.bm, HEAD_C + Vector((0.07 * sign, 0.012, -0.03)), (0, 1, 0), 0.012, 0.003, 8, 3)
        head.paint(faces_of(ring), GOLD)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        # Brass flying goggles over wide eyes.
        rim = kit.torus(face.bm, HEAD_C + Vector((0.025 * sign, -0.06, 0.016)), (0.25 * sign, -1, 0), 0.016, 0.005, 10, 4)
        face.paint(faces_of(rim), BRASS)
        lens = kit.sphere(face.bm, HEAD_C + Vector((0.025 * sign, -0.059, 0.016)), (0.014, 0.006, 0.014), 8, 4)
        face.paint(faces_of(lens), LENS)
        kit.sphere(face.bm, HEAD_C + Vector((0.025 * sign, -0.066, 0.016)), (0.006, 0.003, 0.007), 6, 4)
        strap = kit.slab(face.bm, HEAD_C + Vector((0.056 * sign, -0.03, 0.018)), (0.004, 0, 0), (0, 0.022, 0), (0, 0, 0.006))
        face.paint(faces_of(strap), LEATHER_DARK)
        stripe = kit.slab(face.bm, HEAD_C + Vector((0.042 * sign, -0.05, -0.016)), (0.012, 0.004 * sign, 0), (0, 0.004, 0), (0, 0, 0.004))
        face.paint(faces_of(stripe), PAINT)
    # A wild, happy grin.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.064, -0.038)), (0.03, 0.012, 0.016), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    teeth = kit.slab(face.bm, HEAD_C + Vector((0, -0.074, -0.03)), (0.022, 0, 0), (0, 0.004, 0), (0, 0, 0.004))
    face.paint(faces_of(teeth), TUSK)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.026 * sign, -0.064, -0.054)), HEAD_C + Vector((0.032 * sign, -0.074, -0.02)), 0.008, 0.001, 5)
    parts.append(tusks)

    # Wild dark hair that flies back.
    hair = Part("hair", HAIR, hair_weights, shade=0.1)
    for index, angle in enumerate(range(-130, 131, 26)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.06 * math.sin(a), 0.06 * math.cos(a) + 0.01, 0.0))
        length = 0.16 if abs(angle) < 80 else 0.12
        bottom = top + Vector((0.04 * math.sin(a), 0.12, -length))
        middle = (top + bottom) / 2 + Vector((0.02 * math.sin(a), 0.03, 0.02))
        lock = kit.tube(hair.bm, [top, middle, bottom], [0.02, 0.016, 0.004], 5)
        if index % 2:
            hair.paint(faces_of(lock), HAIR_LIGHT)
    parts.append(hair)

    # The stolen hat on her head, tilted back.
    worn = Part("hat", HAT, "head", shade=0.08)
    hat(worn, HEAD_C + Vector((0, 0.008, 0.052)), (0, 0.22, 1), (0, -1, 0.22))
    parts.append(worn)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.006, 0.68), (0, -0.01, 0.77), 0.04, 0.036, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    kit.sphere(torso.bm, (0, 0.0, 0.625), (0.125, 0.08, 0.085), 12, 8)
    kit.cone(torso.bm, (0, 0, 0.45), (0, 0, 0.6), 0.09, 0.106, 12, squash=0.76)
    parts.append(torso)

    # A leather vest with brass buckles, and the harness of the glider.
    vest = Part("vest", LEATHER, "chest", shade=0.1)
    kit.sphere(vest.bm, (0, -0.004, 0.63), (0.118, 0.082, 0.058), 12, 6)
    for z in (0.6, 0.65):
        buckle = kit.box(vest.bm, (0.0, -0.086, z), (0.022, 0.008, 0.016))
        vest.paint(faces_of(buckle), BRASS)
    parts.append(vest)

    harness = Part("harness", LEATHER_DARK, harness_weights, shade=0.04)
    for sign in (1, -1):
        kit.tube(harness.bm, [(0.08 * sign, 0.05, 0.7), (0.05 * sign, 0.04, 0.85), (0.02 * sign, 0.0, GLIDER_Z - 0.02)], [0.006] * 3, 4)
    parts.append(harness)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.43), (0, 0, 0.47), 0.1, 0.098, 12, squash=0.8)
    buckle = kit.box(belt.bm, (0, -0.08, 0.45), (0.03, 0.01, 0.026))
    belt.paint(faces_of(buckle), BRASS)
    # Leather shorts.
    shorts = kit.cone(belt.bm, (0, 0, 0.43), (0, 0, 0.36), 0.1, 0.11, 12, squash=0.8)
    belt.paint(faces_of(shorts), LEATHER)
    parts.append(belt)

    # The red scarf, its ends flying back in the wind.
    scarf = Part("scarf", SCARF, scarf_weights, shade=0.06)
    kit.torus(scarf.bm, (0, -0.006, 0.715), (0, 0, 1), 0.048, 0.016, 12, 4)
    for dz, color in ((0.0, SCARF), (-0.03, SCARF_DARK)):
        end = kit.tube(scarf.bm, [(0.01, 0.04, 0.71 + dz), (0.02, 0.12, 0.7 + dz), (0.0, 0.2, 0.68 + dz)], [0.016, 0.014, 0.004], 4)
        scarf.paint(faces_of(end), color)
    parts.append(scarf)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.008 * sign, 0, -0.01)), (0.044, 0.042, 0.044), 10, 7)
        kit.cone(upper.bm, s, e, 0.04, 0.034, 8)
        for along in (0.45, 0.62):
            stripe = kit.cone(upper.bm, s + (e - s) * along, s + (e - s) * (along + 0.07), 0.041, 0.04, 8)
            upper.paint(faces_of(stripe), PAINT)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.034, 0.028, 8)
        parts.append(forearm)

        glove = Part(f"glove.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        kit.cone(glove.bm, e + d * 0.06, w - d * 0.004, 0.038, 0.034, 8)
        parts.append(glove)

        hand = Part(f"hand.{side}", LEATHER_DARK, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.024, (0.027, 0.025, 0.028), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.056, 0.044, 8)
        stripe = kit.cone(thigh.bm, (hip + knee) / 2 - Vector((0, 0, 0.012)), (hip + knee) / 2 + Vector((0, 0, 0.01)), 0.052, 0.053, 8)
        thigh.paint(faces_of(stripe), PAINT)
        parts.append(thigh)

        # Fur boots, tied with straps.
        shin = Part(f"shin.{side}", LEATHER, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee - Vector((0, 0, 0.02)), ankle + Vector((0, 0, 0.04)), 0.046, 0.042, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 45) % 3 == 0:
                shin.paint([face], LEATHER_DARK)
        cuff = kit.torus(shin.bm, knee - Vector((0, 0, 0.02)), (0, 0, 1), 0.046, 0.018, 10, 4)
        shin.paint(faces_of(cuff), FUR)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.045)), ankle - Vector((0, 0, 0.02)), 0.046, 0.048, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.034, 0.024), (0.07, 0.13, 0.048))
        parts.append(boot)
    return parts


def hook_parts():
    hook = Part("hook", WOOD, "hand.R", shade=0.04)
    end = GRIP_R + HOOK * HOOK_LENGTH
    kit.cone(hook.bm, GRIP_R - HOOK * 0.05, end, 0.01, 0.009, 6)
    for along in (-0.04, 0.03):
        wrap = kit.cone(hook.bm, GRIP_R + HOOK * along, GRIP_R + HOOK * (along + 0.03), 0.013, 0.013, 6)
        hook.paint(faces_of(wrap), LEATHER_DARK)
    # The hook of steel curls up and back at the end.
    points = [end + HOOK * 0.0]
    for index in range(1, 6):
        a = math.radians(index * 40)
        points.append(end + HOOK * (0.04 * math.sin(a)) + Z * (0.04 * (1 - math.cos(a))))
    curl = kit.tube(hook.bm, points, [0.011, 0.01, 0.009, 0.008, 0.006, 0.002], 5)
    hook.paint(faces_of(curl), STEEL)
    # The second stolen hat hangs on the hook, tipped toward the camera.
    hung = Part("hat.hook", HAT, "hand.R", shade=0.08)
    hat(hung, end + HOOK * 0.03 + Vector((-0.01, 0, -0.07)), (-0.5, -0.6, 0.6), (-0.6, 0.3, 0.5), size=0.85)
    return [hook, hung]


def glider_parts():
    parts = []
    sail = Part("sail", HIDE, sail_weights, shade=0.0)
    columns, rows = 10, 4
    ribs = 4

    def edges(u, sign):
        """The front and back edges of the wing, `u` from the middle to the tip."""
        tip = Vector((SPAN * sign, TIP_Y, GLIDER_Z + TIP_RISE))
        front = NOSE.lerp(tip, u) + Z * 0.02 * math.sin(math.pi * u)
        # The back edge is scalloped between the ribs.
        back = TAIL.lerp(tip, u)
        scallop = abs(math.sin(math.pi * u * ribs)) * 0.05 * (1 - u * 0.5)
        back = back.lerp(front, scallop / max((back - front).length, 1e-4))
        return front, back

    def grid(sign, depth):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                u = column / columns
                front, back = edges(u, sign)
                camber = 0.025 * math.sin(math.pi * v) * (1 - u * 0.6)
                line.append(front.lerp(back, v) + Z * (camber + depth))
            result.append(line)
        return result

    def color_of(face_side, row, column):
        if face_side == "back":
            return HIDE_DARK
        u = (column + 0.5) / columns
        v = (row + 0.5) / rows
        # Tribal paint: a hooked swirl near the tip and a band near the middle.
        if 0.55 < u < 0.85 and (v < 0.5 or column % 3 == 1):
            return TRIBAL
        if 0.15 < u < 0.3 and row in (1, 2):
            return TRIBAL
        return HIDE if (row + column) % 4 else HIDE_DARK

    for sign in (1, -1):
        top = grid(sign, 0.004)
        bottom = grid(sign, -0.004)
        if sign < 0:
            top = [list(reversed(line)) for line in top]
            bottom = [list(reversed(line)) for line in bottom]

            def mirrored(face_side, row, column):
                return color_of(face_side, row, columns - 1 - column)

            kit.panel(sail, top, bottom, mirrored)
        else:
            kit.panel(sail, top, bottom, color_of)
    parts.append(sail)

    # The bone frame: a keel, the front spars and the ribs to the back edge.
    frame = Part("frame", BONE, sail_weights, shade=0.06)
    kit.tube(frame.bm, [NOSE + Vector((0, -0.03, 0.01)), (NOSE + TAIL) / 2 + Z * 0.03, TAIL + Vector((0, 0.03, 0))], [0.012, 0.014, 0.008], 6)
    for sign in (1, -1):
        spar = [edges(u, sign)[0] + Z * 0.012 for u in (0.0, 0.25, 0.5, 0.75, 1.0)]
        tip = spar[-1] + Vector((0.04 * sign, 0.02, 0.03))
        kit.tube(frame.bm, spar + [tip], [0.014, 0.013, 0.012, 0.01, 0.008, 0.002], 6)
        for index in range(1, ribs + 1):
            u = index / ribs
            rib_end = edges(u, sign)[1] + Z * 0.008
            rib_start = edges(u * 0.3, sign)[0].lerp(edges(u * 0.3, sign)[1], 0.3) + Z * 0.012
            rib = kit.tube(frame.bm, [rib_start, rib_start.lerp(rib_end, 0.5) + Z * 0.012, rib_end + Vector((0, 0.025, -0.005))], [0.008, 0.007, 0.002], 5)
            frame.paint(faces_of(rib), BONE_DARK if index % 2 else BONE)
        # Leather lashings at the joints.
        joint = kit.sphere(frame.bm, spar[2], (0.016, 0.016, 0.016), 6, 4)
        frame.paint(faces_of(joint), LEATHER_DARK)
    # The strut that the left hand holds, from the frame down over her shoulder.
    strut = kit.tube(frame.bm, [Vector((0.06, -0.06, GLIDER_Z)), GRIP_L + Vector((0, 0, 0.03)), GRIP_L - Vector((0.004, 0, 0.04))], [0.01, 0.009, 0.008], 5)
    frame.paint(faces_of(strut), BONE_DARK)
    wrap = kit.cone(frame.bm, GRIP_L - Vector((0, 0, 0.03)), GRIP_L + Vector((0, 0, 0.03)), 0.012, 0.012, 6)
    frame.paint(faces_of(wrap), LEATHER)
    parts.append(frame)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("Skyreaver", BONES)
    parts = head_parts() + body_parts() + limb_parts() + hook_parts() + glider_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "SkyreaverMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends the left elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the left arm: the hand stays on the strut of the glider."""
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

# How high her feet hang above the ground at rest.
FLOAT = 0.14


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

    def stand(bob=0.0, sway=0.0, flap=0.0):
        """
        The glide: her feet hang with the toes down, the glider banks a little
        to the camera side, and the hat on the hook is held out to the front.
        """
        return {
            "root@loc": at("root", (0, 0, FLOAT + 0.025 * bob)),
            "hips": t("hips", (X, 8), (Y, sway * 2)),
            "spine": t("spine", (X, 4)),
            "chest": t("chest", (X, -4), (Z, -6)),
            "neck": t("neck", (Z, -6)),
            "head": t("head", (Z, -8 + sway * 4), (X, -6 + bob * 2)),
            "hair": t("hair", (X, -10 - bob * 4), (Y, sway * 4)),
            "scarf": t("scarf", (Z, sway * 8), (X, -6 + bob * 6)),
            "glider": t("glider", (Y, -14 + sway * 4), (X, -4)),
            "wing.L": t("wing.L", (Y, -4 - flap * 6)),
            "wing.R": t("wing.R", (Y, 4 + flap * 6)),
            "upperarm.R": t("upperarm.R", (X, -14 - bob * 2), (Y, -8)),
            "forearm.R": t("forearm.R", (X, -6)),
            "thigh.L": t("thigh.L", (X, -24 + sway * 4), (Y, -4)),
            "shin.L": t("shin.L", (X, 50)),
            "foot.L": t("foot.L", (X, 40)),
            "thigh.R": t("thigh.R", (X, 4 - sway * 4), (Y, 4)),
            "shin.R": t("shin.R", (X, 40)),
            "foot.R": t("foot.R", (X, 46)),
            "forearm.L/IK": 1.0,
        }

    def slump(bob=0.0):
        """Low HP: lower, the glider tips and its wings droop; she hangs limp, and the hook points down."""
        return pose(
            stand(),
            root_at_loc=at("root", (0, 0, FLOAT * 0.45 + 0.015 * bob)),
            hips=t("hips", (X, 2)),
            spine=t("spine", (X, 12 + bob * 3)),
            chest=t("chest", (X, 8), (Z, -6)),
            head=t("head", (Z, -8), (X, 18 + bob * 4), (Y, 10)),
            hair=t("hair", (X, 14)),
            scarf=t("scarf", (X, 30)),
            glider=t("glider", (Y, -26), (X, 10)),
            wing__L=t("wing.L", (Y, 14 + bob * 4)),
            wing__R=t("wing.R", (Y, -14 - bob * 4)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, -6)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -6), (Y, -4)),
            shin__L=t("shin.L", (X, 20)),
            thigh__R=t("thigh.R", (X, 6), (Y, 4)),
            shin__R=t("shin.R", (X, 16)),
        )

    def recoil(base, amount=1.0):
        """A hit knocks her back, and the glider wobbles."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.05 * amount, FLOAT + 0.03 * amount)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, -2)),
            head=t("head", (Z, -6), (X, -18 * amount)),
            hair=t("hair", (X, 14 * amount)),
            glider=t("glider", (Y, -14 + 16 * amount), (X, -14 * amount)),
            wing__L=t("wing.L", (Y, -16 * amount)),
            wing__R=t("wing.R", (Y, 4)),
            upperarm__R=t("upperarm.R", (X, 20 * amount), (Y, -24 * amount)),
            thigh__L=t("thigh.L", (X, -40 * amount)),
            thigh__R=t("thigh.R", (X, -20 * amount)),
        )

    def tumble(base):
        """The glider folds, and she drops."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.04, FLOAT * 0.5)),
            root=t("root", (X, -20)),
            spine=t("spine", (X, -10)),
            head=t("head", (X, -24)),
            hair=t("hair", (X, 30)),
            glider=t("glider", (Y, 10), (X, -20)),
            glider_at_scale=0.6,
            wing__L=t("wing.L", (Y, 50)),
            wing__R=t("wing.R", (Y, -50)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, -40)),
            thigh__L=t("thigh.L", (X, -50)),
            shin__L=t("shin.L", (X, 70)),
            thigh__R=t("thigh.R", (X, -30)),
            shin__R=t("shin.R", (X, 60)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back on the ground, the glider folded under her and the hat on the hook beside her."""
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
            glider=t("glider", (Y, 0), (X, 30)),
            glider_at_scale=0.3,
            wing__L=t("wing.L", (Y, 70)),
            wing__R=t("wing.R", (Y, -70)),
            # The arm goes past her head, so the hook lies on the ground.
            upperarm__R=t("upperarm.R", (X, -150), (Y, -20)),
            forearm__R=t("forearm.R", (X, 0)),
            hand__R=t("hand.R", (X, 60)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 10)),
            thigh__R=t("thigh.R", (X, -6), (Y, 6)),
            shin__R=t("shin.R", (X, 12)),
            foot__R=t("foot.R", (X, 10)),
            **{"forearm__L_slash_IK": 0.0},
        )

    def crouch(base, open_amount=0.3):
        """On the ground on bent knees, the glider half closed, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, 0.0)),
            hips=t("hips", (X, 0)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, -8)),
            glider=t("glider", (X, 16)),
            glider_at_scale=lerp(0.35, 1.0, open_amount),
            wing__L=t("wing.L", (Y, 60 * (1 - open_amount))),
            wing__R=t("wing.R", (Y, -60 * (1 - open_amount))),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -10)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 110)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -60), (Y, 6)),
            shin__R=t("shin.R", (X, 120)),
            foot__R=t("foot.R", (X, -50)),
        )

    def show_off(base):
        """Up in the air, the glider wide and the hook high, to show off the stolen hat: the end of a summon and a Rebirth."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, FLOAT + 0.06)),
            chest=t("chest", (X, -10), (Z, -10)),
            head=t("head", (Z, -14), (X, -16)),
            glider=t("glider", (Y, -20), (X, -10)),
            wing__L=t("wing.L", (Y, -12)),
            wing__R=t("wing.R", (Y, 12)),
            upperarm__R=t("upperarm.R", (X, -120), (Y, -20)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, 60)),
            thigh__L=t("thigh.L", (X, -50)),
            shin__L=t("shin.L", (X, 80)),
        )

    def glide(phase):
        """Swift: a fast glide, the legs kick and the glider rocks. `phase` goes round 0..1."""
        a = 2 * math.pi * phase
        return pose(
            stand(math.sin(a), math.sin(a + 1), math.cos(a)),
            root_at_loc=at("root", (0, 0, FLOAT + 0.03 * math.sin(2 * a))),
            hips=t("hips", (X, 18)),
            spine=t("spine", (X, 10)),
            glider=t("glider", (Y, -14 + 5 * math.sin(a)), (X, 4)),
            hair=t("hair", (X, 14)),
            scarf=t("scarf", (X, 20), (Z, 10 * math.sin(a))),
            thigh__L=t("thigh.L", (X, -20 + 22 * math.sin(a)), (Y, -4)),
            shin__L=t("shin.L", (X, 50 - 10 * math.sin(a))),
            thigh__R=t("thigh.R", (X, -20 - 22 * math.sin(a)), (Y, 4)),
            shin__R=t("shin.R", (X, 50 + 10 * math.sin(a))),
        )

    # The attack (Heroic): she lifts the hook high, then dives at the target
    # and swings the hook down through it. The slash effect starts at 50% of
    # the attack (`MELEE_IMPACT` in fx.ts), so the swing lands at frame 15 of 30.
    def rise(base):
        return pose(
            base,
            root_at_loc=at("root", (0, 0.06, FLOAT + 0.08)),
            root=t("root", (X, -10)),
            chest=t("chest", (X, -12), (Z, -14)),
            head=t("head", (Z, -4), (X, -8)),
            glider=t("glider", (Y, -10), (X, -14)),
            wing__L=t("wing.L", (Y, -14)),
            wing__R=t("wing.R", (Y, 14)),
            upperarm__R=t("upperarm.R", (X, -160), (Y, -16)),
            forearm__R=t("forearm.R", (X, -30)),
            hand__R=t("hand.R", (X, -30)),
            thigh__L=t("thigh.L", (X, -40)),
            shin__L=t("shin.L", (X, 70)),
            thigh__R=t("thigh.R", (X, -20)),
            shin__R=t("shin.R", (X, 60)),
        )

    def dive(base):
        return pose(
            base,
            root_at_loc=at("root", (0, -0.22, FLOAT - 0.06)),
            root=t("root", (X, 24)),
            hips=t("hips", (X, 0)),
            chest=t("chest", (X, 6), (Z, 4)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -20)),
            hair=t("hair", (X, 30)),
            scarf=t("scarf", (X, 40)),
            glider=t("glider", (Y, -10), (X, -6)),
            wing__L=t("wing.L", (Y, 20)),
            wing__R=t("wing.R", (Y, -20)),
            upperarm__R=t("upperarm.R", (X, -50), (Y, -8)),
            forearm__R=t("forearm.R", (X, 10)),
            hand__R=t("hand.R", (X, 30)),
            thigh__L=t("thigh.L", (X, 20)),
            shin__L=t("shin.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 30)),
            shin__R=t("shin.R", (X, 20)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 6):
        a = 2 * math.pi * frame / 48
        idle.key(frame, stand(math.sin(a), math.sin(a + 1.2), math.sin(2 * a)))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, bob in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(bob))
    clips.append(low)

    walk = Clip("walk", 16, loop=True)
    for frame in range(0, 17, 4):
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
    # glider opens again and lifts her up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(12, tumble(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand(), 0.3)).key(41, show_off(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(), 0.0)).key(8, crouch(stand(), 0.6)).key(16, show_off(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "skyreaver.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
