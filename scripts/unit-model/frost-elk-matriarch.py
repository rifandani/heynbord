"""
Frost Elk Matriarch (`feral.frostElkMatriarch`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a tall old elk cow with a
grey-brown coat, a thick cream mane on the neck and the chest, long dark legs
and wide antlers of blue ice. She walks with her head high and calls, and her
breath makes a cloud of frost. A young elk with small ice antlers copies her
pose behind her. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/frost-elk-matriarch.glb`; then
`bun unit-model:pack frost-elk-matriarch` packs it for the game.

The figure faces -Y like the other Unit Models, so her body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). The Battle
camera sees the right side of a player Unit, so the antlers spread more back
and up than across the Lane: the camera sees their branches. The young elk
stands behind her, on her right (-X), so her body does not hide it from the
camera. Its bone
has no parent, so it stays on its feet when she falls. The breath has a bone
that scales: it is small at rest and blows out in her call. Her cast clip is
the call of Rally, and the young elk copies it. Her attack is a butt with the
antlers. In the death clip she falls on her left side (`(Y, +84)` on the
root), so the legs turn to the camera side (-X), and the young elk hangs its
head.
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

COAT = hex_color("#9a7c5c")
COAT_LIGHT = hex_color("#c4ad8e")
COAT_DARK = hex_color("#6e553e")
MANE = hex_color("#ece2cc")
MANE_SHADE = hex_color("#cdbfa4")
LEG = hex_color("#4e3a2a")
HOOF = hex_color("#2a2420")
NOSE = hex_color("#2e2622")
EYE = hex_color("#1a1410")
MOUTH = hex_color("#6a3a3a")
ICE = hex_color("#d4f0ff")
ICE_DEEP = hex_color("#8cc6ee")
MIST = hex_color("#eef6ff")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.24, 0.63))
MID = Vector((0, 0.05, 0.65))
CHEST = Vector((0, -0.14, 0.67))
NECK = Vector((0, -0.22, 0.74))
NECK2 = Vector((0, -0.3, 0.9))
POLL = Vector((0, -0.34, 1.0))
SNOUT = Vector((0, -0.52, 0.95))
HEAD_C = Vector((0, -0.39, 0.99))

LEGS = {
    # name: (top, joint, ankle, toe, parent)
    "FL": (Vector((0.08, -0.16, 0.6)), Vector((0.08, -0.14, 0.36)), Vector((0.08, -0.16, 0.12)), Vector((0.08, -0.21, 0.02)), "chest"),
    "FR": (Vector((-0.08, -0.16, 0.6)), Vector((-0.08, -0.14, 0.36)), Vector((-0.08, -0.16, 0.12)), Vector((-0.08, -0.21, 0.02)), "chest"),
    "BL": (Vector((0.08, 0.25, 0.58)), Vector((0.08, 0.31, 0.32)), Vector((0.08, 0.27, 0.12)), Vector((0.08, 0.23, 0.02)), "hips"),
    "BR": (Vector((-0.08, 0.25, 0.58)), Vector((-0.08, 0.31, 0.32)), Vector((-0.08, 0.27, 0.12)), Vector((-0.08, 0.23, 0.02)), "hips"),
}

TAIL = [Vector((0, 0.38, 0.7)), Vector((0, 0.42, 0.62))]
MOUTH_C = SNOUT + Vector((0, 0.02, -0.03))

# The young elk: behind her and on her right, about half her size.
CALF_C = Vector((-0.13, 0.54, 0.33))
CALF_NECK = CALF_C + Vector((0, -0.09, 0.05))
CALF_HEAD = CALF_C + Vector((0, -0.15, 0.2))
CALF_LEGS = {"front": -0.07, "back": 0.07}

# How the neck and the head turn when she lies on her left side.
NECK_FALLEN = 5
HEAD_FALLEN = -90
NECK_LIFT = 0

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("neck", tuple(NECK), tuple(NECK2), "chest"),
    ("neck.2", tuple(NECK2), tuple(POLL), "neck"),
    ("head", tuple(POLL), tuple(SNOUT), "neck.2"),
    ("jaw", (0, -0.4, 0.95), (0, -0.52, 0.91), "head"),
    ("breath", tuple(MOUTH_C), tuple(MOUTH_C + Vector((0, -0.08, 0.02))), "head"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[1]), "hips"),
    ("calf", tuple(CALF_C + Vector((0, 0.04, 0))), tuple(CALF_C + Vector((0, -0.06, 0))), None),
    ("calf.head", tuple(CALF_NECK), tuple(CALF_HEAD), "calf"),
    ("calf.front", tuple(CALF_C + Vector((0, -0.07, -0.02))), tuple(Vector((CALF_C.x, CALF_C.y - 0.07, 0.02))), "calf"),
    ("calf.back", tuple(CALF_C + Vector((0, 0.07, -0.02))), tuple(Vector((CALF_C.x, CALF_C.y + 0.07, 0.02))), "calf"),
]
for leg, (top, joint, ankle, toe, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(top), tuple(joint), parent),
        (f"lower.{leg}", tuple(joint), tuple(ankle), f"upper.{leg}"),
        (f"foot.{leg}", tuple(ankle), tuple(toe), f"lower.{leg}"),
    ]

# --- Weights -------------------------------------------------------------------


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


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front."""
    if co.y > 0.14:
        return blend("spine", "hips", co.y, 0.1, 0.2)
    if co.y > -0.06:
        return blend("chest", "spine", co.y, -0.06, 0.06)
    return {"chest": 1.0}


neck_weights = chain_weights([CHEST, NECK, NECK2, POLL], ["chest", "neck", "neck.2"])


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.06)) / 0.08)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def coat_color(face, center):
    """A grey-brown coat: lighter on the back, darker underneath."""
    if face.normal.z < -0.35:
        return COAT_DARK
    if face.normal.z > 0.6:
        return COAT_LIGHT
    return COAT


def locks(part, center, radii, count, length, seed=0, only=None, colors=(MANE, MANE_SHADE)):
    """Long shaggy locks that hang down from an ellipsoid."""
    center = Vector(center)
    golden = math.pi * (3 - math.sqrt(5))
    for index in range(count):
        z = 1 - 2 * (index + 0.5) / count
        r = math.sqrt(max(0.0, 1 - z * z))
        angle = golden * (index + seed)
        direction = Vector((math.cos(angle) * r, math.sin(angle) * r, z))
        if only and not only(direction):
            continue
        base = center + Vector((direction.x * radii[0], direction.y * radii[1], direction.z * radii[2])) * 0.92
        down = -Z - direction * direction.dot(-Z)
        if down.length < 0.25:
            down = Y - direction * direction.dot(Y)
        out = (direction * 0.35 + down.normalized()).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.4, 0.003, 4)
        part.paint(faces_of(verts), colors[index % len(colors)])


def antler(part, points, tines, scale=1.0):
    """A branch of ice: a beam through `points`, and tines from some points."""
    radii = [lerp(0.032, 0.01, index / (len(points) - 1)) * scale for index in range(len(points))]
    verts = kit.tube(part.bm, points, radii, 5)
    part.paint(faces_of(verts), ICE)
    for index, direction, length in tines:
        base = points[index]
        tip = base + Vector(direction).normalized() * length * scale
        verts = kit.cone(part.bm, base, tip, radii[index] * 1.1, 0.002, 5)
        part.paint(faces_of(verts), ICE_DEEP if index % 2 else ICE)


def body_parts():
    parts = []
    body = Part("body", coat_color, body_weights, shade=0.22)
    kit.sphere(body.bm, (0, -0.13, 0.67), (0.13, 0.13, 0.15), 12, 8)
    kit.sphere(body.bm, (0, 0.05, 0.65), (0.13, 0.22, 0.14), 12, 8)
    kit.sphere(body.bm, (0, 0.23, 0.66), (0.12, 0.12, 0.13), 12, 8)
    # The hump at the withers.
    kit.sphere(body.bm, (0, -0.12, 0.78), (0.09, 0.11, 0.06), 8, 6)
    # A shaggy winter coat that hangs from the flanks and the belly.
    locks(body, (0, 0.05, 0.64), (0.13, 0.24, 0.14), 40, 0.07, 2, lambda d: -0.7 < d.z < 0.1, (COAT, COAT_LIGHT, COAT_DARK))
    parts.append(body)

    neck = Part("neck", coat_color, neck_weights, shade=0.15)
    kit.tube(neck.bm, [CHEST + Vector((0, 0.0, 0.04)), NECK, NECK2, POLL + Vector((0, 0.02, -0.02))], [0.1, 0.085, 0.065, 0.055], 10)
    parts.append(neck)

    # The thick cream mane: a ruff on the chest and long locks down the throat.
    mane = Part("mane", MANE, neck_weights, shade=0.15)
    locks(mane, (0, -0.24, 0.76), (0.11, 0.1, 0.1), 40, 0.12, 0, lambda d: d.y < 0.3)
    locks(mane, (0, -0.3, 0.88), (0.07, 0.07, 0.08), 24, 0.1, 3, lambda d: d.y < 0.2)
    locks(mane, (0, -0.17, 0.62), (0.12, 0.08, 0.08), 18, 0.1, 5, lambda d: d.y < 0.0)
    parts.append(mane)

    tail = Part("tail", COAT_LIGHT, "tail", shade=0.1)
    kit.cone(tail.bm, TAIL[0], TAIL[1], 0.03, 0.01, 6)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", coat_color, "head", shade=0.14)
    # A long head with a broad, soft muzzle.
    kit.sphere(head.bm, HEAD_C, (0.06, 0.08, 0.06), 10, 8)
    kit.sphere(head.bm, SNOUT + Vector((0, 0.04, 0.0)), (0.045, 0.06, 0.045), 10, 6)
    nose = kit.sphere(head.bm, SNOUT + Vector((0, 0.0, 0.01)), (0.035, 0.025, 0.028), 8, 5)
    head.paint(faces_of(nose), NOSE)
    for sign in (1, -1):
        eye = kit.sphere(head.bm, HEAD_C + Vector((0.052 * sign, -0.02, 0.025)), (0.012, 0.015, 0.012), 6, 4)
        head.paint(faces_of(eye), EYE)
        ear = kit.cone(head.bm, POLL + Vector((0.04 * sign, 0.0, 0.0)), POLL + Vector((0.13 * sign, 0.03, 0.03)), 0.025, 0.004, 6, squash=0.45)
        head.paint(faces_of(ear), COAT_LIGHT)
    parts.append(head)

    jaw = Part("jaw", COAT_LIGHT, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.47, 0.93), (0.035, 0.06, 0.02), 8, 5)
    mouth = kit.sphere(jaw.bm, (0, -0.48, 0.942), (0.03, 0.05, 0.008), 8, 3)
    jaw.paint(faces_of(mouth), MOUTH)
    # The pale beard under the jaw.
    locks(jaw, (0, -0.42, 0.92), (0.03, 0.03, 0.02), 8, 0.06, 1, lambda d: d.z < 0.2)
    parts.append(jaw)

    # The antlers of ice: they spread back and up more than across the Lane.
    ice = Part("antlers", ICE, "head", smooth=False, shade=0.12)
    for sign in (1, -1):
        beam = [
            Vector((0.035 * sign, -0.36, 1.04)),
            Vector((0.09 * sign, -0.33, 1.12)),
            Vector((0.15 * sign, -0.26, 1.21)),
            Vector((0.2 * sign, -0.17, 1.29)),
            Vector((0.23 * sign, -0.07, 1.35)),
            Vector((0.24 * sign, 0.02, 1.37)),
        ]
        antler(ice, beam, [
            (1, (0.2 * sign, -1.0, 0.4), 0.09),
            (2, (0.3 * sign, -0.6, 1.0), 0.12),
            (3, (0.2 * sign, -0.3, 1.0), 0.13),
            (4, (0.3 * sign, 0.1, 1.0), 0.11),
            (4, (0.6 * sign, 0.4, 0.3), 0.08),
        ], 1.0)
    parts.append(ice)

    # The cloud of frost breath, small at rest (its bone scales).
    mist = Part("breath", MIST, "breath", shade=0.08)
    for index, (offset, size) in enumerate(((Vector((0, -0.04, 0.0)), 0.035), (Vector((0, -0.09, 0.02)), 0.05), (Vector((0.01, -0.15, 0.05)), 0.06), (Vector((-0.01, -0.2, 0.09)), 0.055))):
        kit.sphere(mist.bm, MOUTH_C + offset, (size, size, size * 0.85), 7, 5)
    parts.append(mist)
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", COAT, leg_weights(leg), shade=0.15)
        kit.cone(upper.bm, top + Vector((0, 0, 0.06)), joint, 0.065, 0.04, 8)
        parts.append(upper)

        lower = Part(f"lower.{leg}", LEG, f"lower.{leg}", shade=0.12)
        kit.cone(lower.bm, joint, ankle, 0.035, 0.025, 7)
        parts.append(lower)

        foot = Part(f"foot.{leg}", LEG, f"foot.{leg}", shade=0.1)
        kit.cone(foot.bm, ankle, Vector((ankle.x, ankle.y - 0.02, 0.04)), 0.025, 0.026, 7)
        # The split hoof.
        for sign in (1, -1):
            hoof = kit.cone(foot.bm, Vector((ankle.x + 0.012 * sign, ankle.y - 0.025, 0.045)), Vector((ankle.x + 0.014 * sign, ankle.y - 0.055, 0.0)), 0.016, 0.01, 5)
            foot.paint(faces_of(hoof), HOOF)
        parts.append(foot)
    return parts


def calf_parts():
    parts = []
    calf = Part("calf", coat_color, "calf", shade=0.15)
    kit.sphere(calf.bm, CALF_C, (0.06, 0.11, 0.065), 10, 6)
    kit.tube(calf.bm, [CALF_C + Vector((0, -0.06, 0.02)), CALF_NECK], [0.04, 0.035], 7)
    locks(calf, CALF_C + Vector((0, -0.08, 0.02)), (0.04, 0.04, 0.04), 10, 0.05, 2, lambda d: d.y < 0.2)
    tail = kit.cone(calf.bm, CALF_C + Vector((0, 0.1, 0.03)), CALF_C + Vector((0, 0.12, -0.01)), 0.015, 0.005, 5)
    calf.paint(faces_of(tail), COAT_LIGHT)
    parts.append(calf)

    head = Part("calf.head", coat_color, "calf.head", shade=0.12)
    kit.tube(head.bm, [CALF_NECK, CALF_HEAD + Vector((0, 0.02, -0.02))], [0.035, 0.03], 7)
    kit.sphere(head.bm, CALF_HEAD, (0.032, 0.045, 0.032), 8, 6)
    nose = kit.sphere(head.bm, CALF_HEAD + Vector((0, -0.05, -0.01)), (0.022, 0.02, 0.02), 6, 4)
    head.paint(faces_of(nose), NOSE)
    for sign in (1, -1):
        eye = kit.sphere(head.bm, CALF_HEAD + Vector((0.028 * sign, -0.012, 0.012)), (0.007, 0.008, 0.007), 5, 3)
        head.paint(faces_of(eye), EYE)
        ear = kit.cone(head.bm, CALF_HEAD + Vector((0.022 * sign, 0.015, 0.015)), CALF_HEAD + Vector((0.07 * sign, 0.03, 0.03)), 0.014, 0.003, 5, squash=0.45)
        head.paint(faces_of(ear), COAT_LIGHT)
        # Small new antlers of ice.
        base = CALF_HEAD + Vector((0.015 * sign, 0.01, 0.025))
        antler(head, [base, base + Vector((0.03 * sign, 0.02, 0.05)), base + Vector((0.05 * sign, 0.05, 0.09))], [(1, (0.1 * sign, -0.6, 1.0), 0.04)], 0.6)
    parts.append(head)

    for name, y in CALF_LEGS.items():
        legs = Part(f"calf.{name}", LEG, f"calf.{name}", shade=0.1)
        for sign in (1, -1):
            top = Vector((CALF_C.x + 0.03 * sign, CALF_C.y + y, CALF_C.z - 0.02))
            hoof = Vector((top.x, top.y, 0.0))
            kit.cone(legs.bm, top, hoof + Vector((0, 0, 0.02)), 0.022, 0.012, 6)
            kit.cone(legs.bm, hoof + Vector((0, 0, 0.02)), hoof, 0.013, 0.014, 6)
        parts.append(legs)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("FrostElkMatriarch", BONES)
    parts = body_parts() + head_parts() + leg_parts() + calf_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "FrostElkMatriarchMesh")
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

    def legs(**angles):
        """Leg swings: `FL=(upper, lower, foot)` in degrees about X. A negative upper swings forward."""
        result = {}
        for leg, (upper, lower, foot) in angles.items():
            result[f"upper__{leg}"] = t(f"upper.{leg}", (X, upper))
            result[f"lower__{leg}"] = t(f"lower.{leg}", (X, lower))
            result[f"foot__{leg}"] = t(f"foot.{leg}", (X, foot))
        return result

    def calf(head=0.0, look=0.0, bob=0.0, step=0.0):
        """
        The young elk: `head` > 0 raises its head as in a call, < 0 lowers it;
        `look` turns it to its right; `bob` lifts its body; `step` swings its
        front and back legs in a trot.
        """
        return {
            "calf@loc": at("calf", (0, 0, 0.02 * bob)),
            "calf.head": t("calf.head", (X, -30 * head), (Z, -30 * look)),
            "calf.front": t("calf.front", (X, -25 * step)),
            "calf.back": t("calf.back", (X, 25 * step)),
        }

    def stand(breath=0.0, sway=0.0):
        """The idle stance: tall, the head high and turned a little to the camera; the ears flick."""
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.004)),
            "hips": t("hips", (Z, -6)),
            "spine": t("spine", (X, -breath * 1.5)),
            "chest": t("chest", (X, breath * 1.5)),
            "neck": t("neck", (X, -2 - breath * 2), (Z, sway * 3)),
            "neck.2": t("neck.2", (X, -breath * 2)),
            "head": t("head", (Z, -10 + sway * 6), (X, breath * 3), (Y, sway * 3)),
            "jaw": t("jaw", (X, breath * 2)),
            "breath@scale": 0.08 + 0.12 * breath,
            "tail": t("tail", (Z, sway * 25)),
            **calf(0.1, sway, 0.0),
        }

    def gasp(breath=0.0):
        """Low HP: the head hangs low, the legs spread; the young elk nuzzles her flank."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.004 - breath * 0.004)),
            chest=t("chest", (X, 6 + breath * 2)),
            neck=t("neck", (X, 34 + breath * 4)),
            neck__2=t("neck.2", (X, 10)),
            head=t("head", (X, 20), (Y, -6)),
            jaw=t("jaw", (X, 6 + breath * 8)),
            breath_at_scale=0.15 + 0.15 * breath,
            tail=t("tail", (X, 10)),
            **calf(-1.0, -0.6, 0.0),
            **legs(FL=(-4, 10, -6), FR=(4, 8, -12), BL=(-4, 10, -6), BR=(-4, 10, -6)),
        )

    def recoil(base, amount=1.0):
        """The hit throws the head back and the body sideways."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, -0.01 * amount)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            neck=t("neck", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (X, -16 * amount), (Z, 10 * amount)),
            jaw=t("jaw", (X, 20 * amount)),
            tail=t("tail", (X, -30 * amount)),
            **calf(0.5 * amount, 0.5, 0.5 * amount),
        )

    def buckle(base):
        """The front legs give way first."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.02)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, 30)),
            head=t("head", (X, 16)),
            jaw=t("jaw", (X, 16)),
            breath_at_scale=0.02,
            **legs(FL=(-20, 70, -40), FR=(-10, 60, -40), BL=(-30, 50, -20), BR=(-24, 50, -20)),
        )

    def fallen(base, bounce=0.0):
        """
        On her left side, the legs stiff and out. The Battle camera sees the
        right side of a player Unit (-X), so it sees the legs and the belly.
        The young elk stands by her and hangs its head.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.52, 0, 0.12)),
            chest=t("chest", (X, 4)),
            # The neck bends up off the ground, and the head turns so the antlers stay out of it.
            neck=t("neck", (X, NECK_LIFT), (Y, NECK_FALLEN)),
            neck__2=t("neck.2", (X, -10), (Y, NECK_FALLEN)),
            head=t("head", (X, 0), (Y, HEAD_FALLEN)),
            jaw=t("jaw", (X, 10)),
            breath_at_scale=0.02,
            tail=t("tail", (X, -10)),
            **calf(-1.2, 0.8, 0.0),
            **legs(FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)),
        )

    def low(base):
        """Down low with the legs folded, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.2)),
            chest=t("chest", (X, 6)),
            neck=t("neck", (X, 20)),
            head=t("head", (X, 20)),
            breath_at_scale=0.02,
            **calf(-0.6, 0.0, 0.0),
            **legs(FL=(-60, 140, -80), FR=(-60, 140, -80), BL=(-80, 130, -50), BR=(-80, 130, -50)),
        )

    def call(base, amount=1.0, copy=1.0):
        """
        The call (Rally): the head up high, the mouth open, the frost breath
        blows out. The young elk copies her with `copy`.
        """
        return pose(
            base,
            hips=t("hips", (Z, -6), (X, -4 * amount)),
            chest=t("chest", (X, -4 * amount)),
            neck=t("neck", (X, -6 * amount)),
            neck__2=t("neck.2", (X, -8 * amount)),
            head=t("head", (Z, -8), (X, -14 * amount)),
            jaw=t("jaw", (X, 30 * amount)),
            breath_at_scale=lerp(0.08, 1.0, amount),
            tail=t("tail", (X, -30 * amount)),
            **calf(1.4 * copy, 0.0, 0.3 * copy),
            **legs(FL=(-10 * amount, 16 * amount, -6 * amount)),
        )

    def stride(phase):
        """
        The walk: one leg at a time, BL, FL, BR, FR, with the head high. `phase`
        0 to 1 is one cycle. The young elk trots behind her.
        """
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.008 * math.sin(phase * 4 * math.pi))),
            chest=t("chest", (Y, 2 * math.sin(phase * 2 * math.pi))),
            neck=t("neck", (X, -2 + 3 * math.sin(phase * 4 * math.pi))),
            head=t("head", (Z, -6), (X, -2 * math.sin(phase * 4 * math.pi))),
            tail=t("tail", (Z, 14 * math.sin(phase * 2 * math.pi))),
            **calf(0.3, 0.0, abs(math.sin(phase * 4 * math.pi)), math.sin(phase * 4 * math.pi)),
        )
        steps = {}
        for leg, offset in (("BL", 0.0), ("FL", 0.25), ("BR", 0.5), ("FR", 0.75)):
            local = (phase - offset) % 1.0
            # A third of the cycle in the air, the rest on the ground, pushed back.
            if local < 0.33:
                u = local / 0.33
                swing = lerp(16, -16, u)
                lift = math.sin(u * math.pi)
            else:
                u = (local - 0.33) / 0.67
                swing = lerp(-16, 16, u)
                lift = 0.0
            back = leg.startswith("B")
            bend = (-40 if back else 50) * lift
            steps[leg] = (swing - 10 * lift, bend, 10 * lift - swing - bend)
        return pose(result, **legs(**steps))

    # The attack: she rears a little, then lowers her head and drives the
    # antlers into the enemy. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the antlers strike at frame 15 of 30. A
    # puff of frost leaves her mouth as she strikes.
    def rear(base):
        return pose(
            base,
            hips=t("hips", (Z, -6), (X, -10)),
            hips_at_loc=at("hips", (0, 0.04, 0.0)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -14)),
            jaw=t("jaw", (X, 10)),
            **calf(0.6, 0.0, 0.3),
            **legs(FL=(-30, 60, -20), FR=(-20, 50, -20), BL=(10, -4, -4), BR=(12, -4, -4)),
        )

    def butt(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.14 - 0.02 * follow, 0.03)),
            hips=t("hips", (Z, -6), (X, 4)),
            chest=t("chest", (X, 6)),
            neck=t("neck", (X, 46 + 4 * follow)),
            neck__2=t("neck.2", (X, 16)),
            head=t("head", (X, 26 + 6 * follow)),
            jaw=t("jaw", (X, 14)),
            breath_at_scale=0.5 - 0.3 * follow,
            tail=t("tail", (X, -30)),
            **calf(0.4, 0.0, 0.0),
            **legs(FL=(-24, 20, 4), FR=(-12, 14, -2), BL=(24, 0, -24), BR=(28, -4, -24)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, gasp(breath))
    clips.append(low_hp)

    walk = Clip("walk", 24, loop=True)
    for frame in range(0, 25, 2):
        walk.key(frame, stride(frame / 24))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(8, rear(stand())).key(12, rear(stand()))
    attack.key(15, butt(stand())).key(19, butt(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 30)
    cast.key(0, stand()).key(6, call(stand(), 0.6, 0.0)).key(10, call(stand(), 1.0, 0.3))
    cast.key(18, call(stand(), 1.0, 1.0)).key(24, call(stand(), 0.5, 1.0)).key(30, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, buckle(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, low(stand())).key(15, call(stand(), 1.0, 1.0)).key(19, call(stand(), 0.8, 1.0))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "frost-elk-matriarch.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
