"""
Avalanche Yeti (`feral.avalancheYeti`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a big white yeti with long shaggy
fur, huge shoulders and long arms, a grey-blue face with a roaring mouth and
fangs, dark claws, blue ice crystals in the fur of the shoulders and the back,
and a stolen red scarf that is much too small for it. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/avalanche-yeti.glb`;
then `bun unit-model:pack avalanche-yeti` packs it for the game.

The Battle camera sees the right side of a player Unit, so the yeti turns a
little to its right at rest, and the knot of the scarf is on its right side.
It has Trample, so its attack is a double-fist slam down through the enemy
and its walk is a heavy charge with the arms wide. It has no Keyword that it
uses by its own action, so it has no cast clip.
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

FUR = hex_color("#eef0f0")
FUR_SHADE = hex_color("#c9d0d6")
FUR_DEEP = hex_color("#9aa6b2")
SKIN = hex_color("#8094a6")
SKIN_DARK = hex_color("#5c6c7c")
EYE = hex_color("#cfe8f4")
PUPIL = hex_color("#1c2430")
MOUTH = hex_color("#7a2a34")
TONGUE = hex_color("#c45a68")
FANG = hex_color("#f4efe2")
CLAW = hex_color("#34363c")
ICE = hex_color("#c4e9ff")
ICE_DEEP = hex_color("#79bfee")
SCARF = hex_color("#c0282c")
SCARF_DARK = hex_color("#7e1a1e")

# --- Proportions ---------------------------------------------------------------

# A hunched giant: the shoulders are high and wide, the head sits low and
# forward between them, the legs are short and thick and the arms are long.
HIP_Z = 0.4
WAIST_Z = 0.5
CHEST_Z = 0.62
NECK_Z = 0.74
HEAD_C = Vector((0, -0.1, 0.8))
# The head is big, so the face reads on the Board: the parts are made at a
# small size and then scaled about the base of the neck.
HEAD_BASE = Vector((0, -0.06, 0.74))
HEAD_SCALE = 1.25
KNEE_Z = 0.22
ANKLE_Z = 0.06
LEG_X = 0.11

# The arms hang wide, with the big hands low beside the knees.
SL = Vector((0.25, 0.0, 0.73))
EL = Vector((0.36, -0.02, 0.5))
WL = Vector((0.4, -0.07, 0.29))
TL = Vector((0.41, -0.1, 0.19))
SR, ER, WR, TR = (Vector((-v.x, v.y, v.z)) for v in (SL, EL, WL, TL))

# The knot of the scarf, on the front of the throat to its right.
KNOT = Vector((-0.07, -0.2, 0.73))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0.02, HIP_Z), (0, 0.02, WAIST_Z), "root"),
    ("spine", (0, 0.02, WAIST_Z), (0, 0.02, CHEST_Z), "hips"),
    ("chest", (0, 0.02, CHEST_Z), (0, -0.02, NECK_Z), "spine"),
    ("neck", (0, -0.02, NECK_Z), (0, -0.06, 0.77), "chest"),
    ("head", (0, -0.06, 0.77), (0, -0.12, 0.94), "neck"),
    ("jaw", tuple(HEAD_BASE + (Vector((0, -0.1, 0.78)) - HEAD_BASE) * HEAD_SCALE), tuple(HEAD_BASE + (Vector((0, -0.2, 0.74)) - HEAD_BASE) * HEAD_SCALE), "head"),
    ("scarf", tuple(KNOT), tuple(KNOT + Vector((-0.03, -0.05, -0.14))), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.06 * sign, 0.02, 0.7), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0.02, HIP_Z), (LEG_X * sign, 0.0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0.0, KNEE_Z), (LEG_X * sign, 0.02, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0.02, ANKLE_Z), (LEG_X * sign, -0.1, 0.02), f"shin.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z + 0.02:
        return blend("hips", "spine", co.z, 0.44, 0.56)
    if co.z < NECK_Z:
        return blend("spine", "chest", co.z, 0.56, 0.66)
    return blend("chest", "neck", co.z, 0.76, 0.82)


def chain_weights(points, names):
    """Along a chain of bones: each bone takes its own length, with a blend at each joint."""

    def weights(co):
        best, best_index, best_t = None, 0, 0.0
        for index in range(len(points) - 1):
            a, b = points[index], points[index + 1]
            ab = b - a
            t = clamp01((co - a).dot(ab) / ab.length_squared)
            distance = (a + ab * t - co).length
            if best is None or distance < best:
                best, best_index, best_t = distance, index, t
        if best_t > 0.82 and best_index + 1 < len(names):
            return blend(names[best_index], names[best_index + 1], best_t, 0.82, 1.18)
        if best_t < 0.18 and best_index > 0:
            return blend(names[best_index - 1], names[best_index], best_t, -0.18, 0.18)
        return {names[best_index]: 1.0}

    return weights


def arm_weights(side, s, e, w, t):
    sign = 1 if side == "L" else -1
    chain = chain_weights([Vector((0.06 * sign, 0.02, 0.7)), s, e, w, t], [f"shoulder.{side}", f"upperarm.{side}", f"forearm.{side}", f"hand.{side}"])

    def weights(co):
        # The top of the shoulder goes into the hump, so it follows the chest there.
        result = chain(co)
        inside = clamp01((abs(co.x) - (abs(s.x) - 0.1)) / 0.08)
        if inside < 1:
            result = {bone: weight * inside for bone, weight in result.items()}
            result["chest"] = result.get("chest", 0) + 1 - inside
        return result

    return weights


def leg_weights(side):
    sign = 1 if side == "L" else -1
    chain = chain_weights([Vector((LEG_X * sign, 0.02, HIP_Z)), Vector((LEG_X * sign, 0, KNEE_Z)), Vector((LEG_X * sign, 0.02, ANKLE_Z))], [f"thigh.{side}", f"shin.{side}"])

    def weights(co):
        if co.z > HIP_Z - 0.02:
            return blend(f"thigh.{side}", "hips", co.z, HIP_Z - 0.02, HIP_Z + 0.05)
        return chain(co)

    return weights


# --- Parts ---------------------------------------------------------------------


def fur_color(face, center):
    """Large shapes of fur: white on the top, grey on the sides and blue-grey underneath."""
    if face.normal.z < -0.4:
        return FUR_DEEP
    if face.normal.z < 0.15:
        return FUR_SHADE
    return FUR


def tufts(part, center, radii, count, length, droop=0.7, seed=0, only=None):
    """
    Shaggy locks of fur on an ellipsoid: each one a cone that lies along the
    surface and hangs down. A larger `droop` lays it flatter. `only(direction)`
    can skip some places, for example the face.
    """
    center = Vector(center)
    golden = math.pi * (3 - math.sqrt(5))
    for index in range(count):
        z = 1 - 2 * (index + 0.5) / count
        r = math.sqrt(max(0.0, 1 - z * z))
        angle = golden * (index + seed)
        direction = Vector((math.cos(angle) * r, math.sin(angle) * r, z))
        if only and not only(direction):
            continue
        base = center + Vector((direction.x * radii[0], direction.y * radii[1], direction.z * radii[2])) * 0.9
        # Down along the surface; on the top, back along it.
        down = -Z - direction * direction.dot(-Z)
        if down.length < 0.25:
            down = Y - direction * direction.dot(Y)
        out = (direction * (0.5 / max(droop, 0.3)) + down.normalized()).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.55, 0.003, 4)
        shade = FUR if direction.z > 0.2 else (FUR_SHADE if direction.z > -0.4 else FUR_DEEP)
        part.paint(faces_of(verts), FUR_SHADE if index % 4 == 1 and shade == FUR else shade)


def crystals(part, base, direction, size, count=3):
    """A cluster of ice crystals: a long one in the middle and short ones round it."""
    base, direction = Vector(base), Vector(direction).normalized()
    side = direction.cross(Y if abs(direction.dot(Y)) < 0.9 else X).normalized()
    for index in range(count):
        tilt = (index - (count - 1) / 2) * 0.45
        axis = (direction + side * tilt).normalized()
        reach = size * (1.0 if index == count // 2 else 0.65)
        verts = kit.cone(part.bm, base, base + axis * reach, size * 0.22, 0.003, 5)
        part.paint(faces_of(verts), ICE_DEEP if index % 2 else ICE)


def body_parts():
    parts = []
    body = Part("body", fur_color, torso_weights, shade=0.2)
    # The hump of the shoulders, the deep chest, the belly and the hips.
    kit.sphere(body.bm, (0, 0.05, 0.72), (0.27, 0.2, 0.13), 14, 8)
    kit.sphere(body.bm, (0, -0.01, 0.62), (0.24, 0.2, 0.18), 14, 10)
    kit.sphere(body.bm, (0, -0.02, 0.48), (0.19, 0.17, 0.13), 12, 8)
    kit.sphere(body.bm, (0, 0.03, 0.41), (0.17, 0.15, 0.09), 12, 6)
    # Long locks hang from the chest and the belly, more on the back.
    tufts(body, (0, 0.04, 0.71), (0.27, 0.2, 0.13), 46, 0.07, 0.5, 0)
    tufts(body, (0, -0.01, 0.6), (0.24, 0.2, 0.18), 40, 0.08, 1.0, 3, lambda d: d.z < 0.5)
    tufts(body, (0, -0.02, 0.47), (0.19, 0.17, 0.13), 24, 0.07, 1.4, 5, lambda d: d.z < 0.3)
    # A pale patch of bare skin on the chest.
    patch = kit.sphere(body.bm, (0, -0.17, 0.62), (0.1, 0.05, 0.09), 8, 6)
    body.paint(faces_of(patch), FUR_SHADE)
    # Ice crystals in the fur of the shoulders and the back, as the card painting has.
    for sign in (1, -1):
        crystals(body, (0.17 * sign, 0.06, 0.8), (0.4 * sign, 0.3, 1), 0.11)
        crystals(body, (0.08 * sign, 0.16, 0.74), (0.3 * sign, 0.8, 0.7), 0.08)
    crystals(body, (0, 0.18, 0.62), (0, 1, 0.4), 0.07, 2)
    parts.append(body)

    # The stolen red scarf: a tight band round the neck, much too small for
    # it, with the knot and the two fringed ends on its right side.
    scarf = Part("scarf", SCARF, "chest", shade=0.12)
    band = []
    for step in range(15):
        angle = 2 * math.pi * step / 14
        band.append(Vector((0.11 * math.sin(angle), -0.1 - 0.12 * math.cos(angle), 0.71 + 0.03 * math.cos(angle))))
    kit.tube(scarf.bm, band, [0.026] * len(band), 6, caps=False)
    for index in range(len(band) - 1):
        if index % 3 == 0:
            stripe = kit.tube(scarf.bm, [band[index], band[index] + (band[index + 1] - band[index]) * 0.35], [0.028, 0.028], 6)
            scarf.paint(faces_of(stripe), SCARF_DARK)
    kit.sphere(scarf.bm, KNOT, (0.034, 0.03, 0.032), 8, 6)
    parts.append(scarf)

    ends = Part("scarf.ends", SCARF, "scarf", shade=0.1)
    for offset, tip in ((Vector((0.0, 0, 0)), KNOT + Vector((-0.06, -0.06, -0.15))), (Vector((0.01, 0.0, 0)), KNOT + Vector((0.0, -0.05, -0.13)))):
        start = KNOT + Vector((0, -0.01, -0.01)) + offset
        mid = start.lerp(tip, 0.5) + Vector((-0.01, -0.02, 0))
        front = [[start + Vector((0.018, 0, 0)), start + Vector((-0.018, 0, 0))], [mid + Vector((0.02, 0, 0)), mid + Vector((-0.02, 0, 0))], [tip + Vector((0.022, 0, 0)), tip + Vector((-0.022, 0, 0))]]
        back = [[p + Vector((0, 0.008, 0)) for p in row] for row in front]
        panel(ends, front, back, lambda side, row, column: SCARF_DARK if row == 1 else SCARF)
        # The fringe at the end.
        for f in range(4):
            x = lerp(-0.018, 0.018, f / 3)
            fringe = kit.cone(ends.bm, tip + Vector((x, 0.004, 0.004)), tip + Vector((x, 0.004, -0.035)), 0.004, 0.002, 3)
            ends.paint(faces_of(fringe), SCARF)
    parts.append(ends)
    return parts


def head_parts():
    parts = []
    head = Part("head", fur_color, "head", shade=0.15)
    kit.sphere(head.bm, HEAD_C + Vector((0, 0.03, 0.02)), (0.1, 0.1, 0.1), 12, 8)
    # A mane of fur round the face.
    tufts(head, HEAD_C + Vector((0, 0.03, 0.02)), (0.1, 0.1, 0.1), 30, 0.055, 0.3, 2, lambda d: d.y > -0.35)
    parts.append(head)

    face = Part("face", SKIN, "head", shade=0.12)
    # The grey-blue face, the heavy brow and the broad nose.
    kit.sphere(face.bm, HEAD_C + Vector((0, -0.065, 0.0)), (0.07, 0.045, 0.065), 10, 8)
    brow = kit.sphere(face.bm, HEAD_C + Vector((0, -0.095, 0.04)), (0.07, 0.03, 0.022), 10, 5)
    face.paint(faces_of(brow), SKIN_DARK)
    nose = kit.sphere(face.bm, HEAD_C + Vector((0, -0.115, 0.01)), (0.028, 0.02, 0.018), 8, 5)
    face.paint(faces_of(nose), SKIN_DARK)
    # The upper lip and the open mouth.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.095, -0.035)), (0.045, 0.025, 0.022), 10, 6)
    face.paint(faces_of(mouth), MOUTH)
    for sign in (1, -1):
        # Small ears in the fur.
        ear = kit.sphere(face.bm, HEAD_C + Vector((0.095 * sign, -0.0, 0.03)), (0.015, 0.025, 0.03), 6, 4)
        face.paint(faces_of(ear), SKIN_DARK)
    parts.append(face)

    eyes = Part("eyes", EYE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.032 * sign, -0.1, 0.022)), (0.014, 0.008, 0.01), 6, 4)
        pupil = kit.sphere(eyes.bm, HEAD_C + Vector((0.032 * sign, -0.107, 0.022)), (0.006, 0.004, 0.006), 5, 3)
        eyes.paint(faces_of(pupil), PUPIL)
    parts.append(eyes)

    fangs = Part("fangs", FANG, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(fangs.bm, HEAD_C + Vector((0.03 * sign, -0.11, -0.035)), HEAD_C + Vector((0.03 * sign, -0.115, -0.07)), 0.009, 0.001, 5)
        kit.cone(fangs.bm, HEAD_C + Vector((0.012 * sign, -0.115, -0.04)), HEAD_C + Vector((0.012 * sign, -0.118, -0.055)), 0.005, 0.001, 4)
    parts.append(fangs)

    jaw = Part("jaw", SKIN, "jaw", shade=0.1)
    kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.085, -0.06)), (0.05, 0.035, 0.022), 10, 6)
    tongue = kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.085, -0.045)), (0.035, 0.025, 0.008), 8, 4)
    jaw.paint(faces_of(tongue), TONGUE)
    for sign in (1, -1):
        tusk = kit.cone(jaw.bm, HEAD_C + Vector((0.03 * sign, -0.11, -0.055)), HEAD_C + Vector((0.032 * sign, -0.115, -0.022)), 0.009, 0.001, 5)
        jaw.paint(faces_of(tusk), FANG)
    # A beard of fur under the chin.
    tufts(jaw, HEAD_C + Vector((0, -0.07, -0.075)), (0.05, 0.03, 0.02), 10, 0.04, 1.6, 1, lambda d: d.z < 0.2)
    parts.append(jaw)
    grow = kit.Matrix.Translation(HEAD_BASE) @ kit.Matrix.Scale(HEAD_SCALE, 4) @ kit.Matrix.Translation(-HEAD_BASE)
    for part in parts:
        kit.bmesh.ops.transform(part.bm, matrix=grow, verts=list(part.bm.verts))
    return parts


def arm_parts():
    parts = []
    for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
        arm = Part(f"arm.{side}", fur_color, arm_weights(side, s, e, w, t), shade=0.18)
        kit.sphere(arm.bm, s + Vector((0.01 * sign, 0.01, 0.0)), (0.11, 0.11, 0.11), 10, 8)
        kit.cone(arm.bm, s, e, 0.1, 0.085, 10)
        kit.sphere(arm.bm, e, (0.085, 0.085, 0.085), 8, 6)
        kit.cone(arm.bm, e, w + (w - e).normalized() * 0.01, 0.09, 0.07, 10)
        # Long locks of fur down the arm, longest at the elbow.
        for along, length in ((0.3, 0.06), (0.65, 0.08), (1.0, 0.09)):
            tufts(arm, s.lerp(e, along), (0.1, 0.1, 0.1), 12, length, 1.2, int(along * 10), lambda d: d.z < 0.4)
        for along in (0.4, 0.85):
            tufts(arm, e.lerp(w, along), (0.085, 0.085, 0.07), 10, 0.065, 1.3, int(along * 10) + 4, lambda d: d.z < 0.3)
        parts.append(arm)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}", shade=0.15)
        down = (t - w).normalized()
        palm = w + down * 0.05
        kit.sphere(hand.bm, palm, (0.06, 0.05, 0.06), 8, 6)
        # Four thick fingers, curled, with long dark claws.
        for index, spread in enumerate((-1.5, -0.5, 0.5, 1.5)):
            knuckle = palm + Vector((spread * 0.024 * sign * 0.3, -0.035 + abs(spread) * 0.008, -0.03)) + Vector((0, spread * 0.02, 0))
            tip = knuckle + down * 0.05 + Vector((0, -0.02, 0))
            kit.cone(hand.bm, knuckle, tip, 0.017, 0.013, 6)
            claw = kit.cone(hand.bm, tip, tip + Vector((0, -0.03, -0.012)), 0.011, 0.001, 5)
            hand.paint(faces_of(claw), CLAW)
        thumb = palm + Vector((-0.04 * sign, -0.03, 0.0))
        kit.cone(hand.bm, palm, thumb, 0.016, 0.013, 5)
        claw = kit.cone(hand.bm, thumb, thumb + Vector((-0.012 * sign, -0.025, -0.01)), 0.01, 0.001, 5)
        hand.paint(faces_of(claw), CLAW)
        # Fur over the back of the wrist.
        cuff = Part(f"cuff.{side}", FUR_SHADE, f"hand.{side}", shade=0.1)
        tufts(cuff, w + down * 0.01, (0.07, 0.07, 0.04), 10, 0.04, 1.2, 9, lambda d: d.z > -0.2)
        parts += [hand, cuff]
    return parts


def leg_parts():
    parts = []
    for side, sign in (("L", 1), ("R", -1)):
        hip = Vector((LEG_X * sign, 0.02, HIP_Z))
        knee = Vector((LEG_X * sign, 0.0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0.02, ANKLE_Z))
        leg = Part(f"leg.{side}", fur_color, leg_weights(side), shade=0.2)
        kit.cone(leg.bm, hip + Vector((0, 0, 0.04)), knee, 0.12, 0.095, 10)
        kit.cone(leg.bm, knee, ankle + Vector((0, 0, 0.01)), 0.095, 0.08, 10)
        # Shaggy fur over the thigh and down to the feet.
        tufts(leg, hip.lerp(knee, 0.45), (0.12, 0.12, 0.1), 16, 0.07, 1.0, 2, lambda d: d.z < 0.5)
        tufts(leg, knee.lerp(ankle, 0.5), (0.095, 0.095, 0.08), 14, 0.06, 1.4, 6, lambda d: d.z < 0.5)
        parts.append(leg)

        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.1)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.04), (0.07, 0.1, 0.04), 10, 6)
        for spread in (-1, 0, 1):
            base = Vector((LEG_X * sign + spread * 0.035, -0.12, 0.03))
            claw = kit.cone(foot.bm, base, base + Vector((0, -0.03, -0.02)), 0.012, 0.001, 5)
            foot.paint(faces_of(claw), CLAW)
        tufts(foot, (LEG_X * sign, 0.0, 0.07), (0.075, 0.08, 0.03), 10, 0.04, 1.4, 4, lambda d: d.z > -0.1)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("AvalancheYeti", BONES)
    parts = body_parts() + head_parts() + arm_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "AvalancheYetiMesh")
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

    def arms(left=(0, 0, 0), right=(0, 0, 0), elbows=(0, 0), hands=(0, 0)):
        """
        The arms: `left` and `right` are (out, forward, twist) for the upper
        arm in degrees, `elbows` bend each forearm forward and `hands` curl
        each hand.
        """
        result = {}
        for side, sign, (out, forward, twist), elbow, hand in (("L", 1, left, elbows[0], hands[0]), ("R", -1, right, elbows[1], hands[1])):
            result[f"upperarm.{side}"] = t(f"upperarm.{side}", (Z, twist * sign), (X, -forward), (Y, -out * sign))
            result[f"forearm.{side}"] = t(f"forearm.{side}", (X, -elbow))
            result[f"hand.{side}"] = t(f"hand.{side}", (X, -hand))
        return result

    def legs(left=(0, 0, 0), right=(0, 0, 0)):
        """Leg swings: (thigh, shin, foot) in degrees about X. A negative thigh swings forward."""
        result = {}
        for side, (thigh, shin, foot) in (("L", left), ("R", right)):
            result[f"thigh.{side}"] = t(f"thigh.{side}", (X, thigh))
            result[f"shin.{side}"] = t(f"shin.{side}", (X, shin))
            result[f"foot.{side}"] = t(f"foot.{side}", (X, foot))
        return result

    def flat(thigh, shin, toe=0.0):
        """A leg with the sole flat on the ground, or the toe `toe` degrees down."""
        return (thigh, shin, toe - thigh - shin)

    def stand(breath=0.0, sway=0.0):
        """
        The idle stance: hunched, the knees bent, turned a little to its right,
        the arms out wide and the jaw a little open. The chest heaves.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.02 - breath * 0.005)),
            "hips": t("hips", (Z, -14), (Y, sway * 2)),
            "spine": t("spine", (X, 8 - breath * 2)),
            "chest": t("chest", (X, 4 - breath * 3), (Z, sway * 3)),
            "neck": t("neck", (X, -10), (Z, 4)),
            "head": t("head", (X, -4 + breath * 3), (Z, -4 + sway * 6)),
            "jaw": t("jaw", (X, 8 + breath * 6)),
            "scarf": t("scarf", (X, -4 - breath * 4), (Y, sway * 6)),
            **arms((30 + breath * 4, 16, 0), (34 + breath * 4, 18, 0), (24, 24), (10, 10)),
            **legs((-20, 30, -10), (-8, 22, -14)),
        }

    def slump(breath=0.0):
        """Low HP: bent low, its right fist down on the ground, it pants."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.055 - breath * 0.006)),
            spine=t("spine", (X, 22 + breath * 3)),
            chest=t("chest", (X, 12 + breath * 3), (Y, -6)),
            neck=t("neck", (X, -18)),
            head=t("head", (X, -6 + breath * 4), (Z, 4), (Y, -8)),
            jaw=t("jaw", (X, 14 + breath * 8)),
            scarf=t("scarf", (X, 10)),
            **arms((8, 30, 0), (6, 34, 0), (4, 20), (-10, -20)),
            **legs(flat(-46, 56), flat(-30, 50)),
        )

    def stride(phase):
        """
        The charge: heavy steps with the arms out wide, the body rolls from
        side to side. `phase` 0 has the left foot forward, 0.5 the right.
        """
        swing = math.cos(phase * 2 * math.pi)
        lift_l = max(0.0, -math.sin(phase * 2 * math.pi))
        lift_r = max(0.0, math.sin(phase * 2 * math.pi))
        bob = abs(math.sin(phase * 2 * math.pi))
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03 + 0.02 * bob)),
            hips=t("hips", (Z, -10 + 8 * swing), (Y, 5 * swing)),
            spine=t("spine", (X, 18)),
            chest=t("chest", (X, 8), (Z, -8 * swing), (Y, -4 * swing)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -2), (Z, 4 + 4 * swing)),
            jaw=t("jaw", (X, 16)),
            scarf=t("scarf", (X, -24), (Y, 8 * swing)),
            **arms((40, 18 - 26 * swing, 0), (40, 18 + 26 * swing, 0), (20, 20), (14, 14)),
            **legs(flat(-28 * swing - 10, 20 + 50 * lift_l, 10 * lift_l), flat(28 * swing - 10, 20 + 50 * lift_r, 10 * lift_r)),
        )

    def recoil(base, amount=1.0):
        """A hit knocks the chest and the head back, and the arms fly out."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, -0.02 - 0.01 * amount)),
            spine=t("spine", (X, 8 - 14 * amount)),
            chest=t("chest", (X, 4 - 12 * amount), (Z, 10 * amount)),
            head=t("head", (X, -4 - 20 * amount), (Z, 12 * amount)),
            jaw=t("jaw", (X, 6 + 24 * amount)),
            scarf=t("scarf", (X, -30 * amount)),
            **arms((14 + 30 * amount, 10 - 20 * amount, 0), (14 + 36 * amount, 10 - 26 * amount, 0), (14, 14 + 20 * amount), (10, 10)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.05)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, -10)),
            chest=t("chest", (X, -10), (Y, 8)),
            head=t("head", (X, -24), (Z, 10)),
            jaw=t("jaw", (X, 30)),
            scarf=t("scarf", (X, -40)),
            **arms((60, -10, 0), (70, -30, 0), (30, 40), (10, 10)),
            **legs(flat(-34, 40), flat(6, 30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on its back, the arms out wide and the legs up a little."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, -0.36, 0.22)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 4)),
            head=t("head", (X, -10), (Z, -34)),
            jaw=t("jaw", (X, 26)),
            scarf=t("scarf", (X, -50), (Y, -20)),
            **arms((82, 4, 0), (78, -6, 0), (20, 10), (20, 20)),
            **legs((-36, 30, 0), (-20, 16, 0)),
        )

    def crouch(base):
        """Down low with the fists on the ground, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.11)),
            spine=t("spine", (X, 34)),
            chest=t("chest", (X, 16)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, 0)),
            scarf=t("scarf", (X, 20)),
            **arms((6, 8, 0), (6, 8, 0), (10, 10), (-20, -20)),
            **legs((-64, 92, -26), (-54, 92, -36)),
        )

    def roar(base):
        """Up tall with the arms flung wide and the jaw open: the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.01)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -12)),
            neck=t("neck", (X, -6)),
            head=t("head", (X, -16), (Z, 6)),
            jaw=t("jaw", (X, 34)),
            scarf=t("scarf", (X, -16), (Y, 10)),
            **arms((74, 6, 0), (74, 6, 0), (30, 30), (20, 20)),
        )

    # The attack (Trample): both fists go up over its head, then it lunges and
    # slams them down. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the fists come down at frame 15 of 30.
    def wind_up(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.05, -0.0)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, -10)),
            chest=t("chest", (X, -14)),
            neck=t("neck", (X, -4)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, 36)),
            scarf=t("scarf", (X, -10)),
            **arms((40, 150, 0), (40, 150, 0), (50, 50), (30, 30)),
            **legs((-10, 20, -10), (4, 20, -20)),
        )

    def slam(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.14 - 0.02 * follow, -0.06)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 18 + 4 * follow)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -8)),
            jaw=t("jaw", (X, 30)),
            scarf=t("scarf", (X, 24)),
            **arms((16, 64 + 4 * follow, 0), (16, 64 + 4 * follow, 0), (10, 10), (-10, -10)),
            **legs(flat(-56, 50), flat(26, 30, 10)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low_hp.key(frame, slump(breath))
    clips.append(low_hp)

    walk = Clip("walk", 24, loop=True)
    for frame in (0, 6, 12, 18, 24):
        walk.key(frame, stride(frame / 24))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, wind_up(stand())).key(12, wind_up(stand()))
    attack.key(15, slam(stand())).key(19, slam(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(13, stagger(stand()))
    death.key(25, fallen(stand())).key(29, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(8, crouch(stand())).key(15, roar(stand())).key(19, roar(stand()))
    summon.key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "avalanche-yeti.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
