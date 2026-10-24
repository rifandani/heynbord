"""
Crag Lizard (`feral.cragLizard`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a large, low, wide grey-brown
lizard with a back of rock plates that have snow on their tops, a broad
blunt head with plates over the eyes, yellow eyes, an open mouth in a hiss
with a pink tongue, thick legs that sprawl to the sides with dark claws, and
a short thick tail. A small blue and white bird sits on its back, and the
lizard does not know. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/crag-lizard.glb`; then
`bun unit-model:pack crag-lizard` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). The bird
sits on the `bird` bone, so it hops and looks round on its own. It is Heavy,
so its walk is a slow plod, and it has Bulwark (the rock plates), so a hit
only makes it duck behind its plates. Its attack is a low lunge and a bite.
In the death clip it falls on its left side (`(Y, +84)` on the root), so the
belly and the legs turn to the camera side (-X), and the bird flies up. It
has no Keyword that it uses by its own action, so it has no cast clip.
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

HIDE = hex_color("#7e705e")
HIDE_LIGHT = hex_color("#a69680")
HIDE_DARK = hex_color("#5c4f42")
BELLY = hex_color("#c9b89c")
ROCK = hex_color("#8f8577")
ROCK_DARK = hex_color("#665d53")
SNOW = hex_color("#eef2f6")
EYE = hex_color("#e3b232")
PUPIL = hex_color("#1a1208")
MOUTH = hex_color("#a8424a")
TONGUE = hex_color("#d8707c")
TOOTH = hex_color("#f0e8d6")
CLAW = hex_color("#2e2a26")
BIRD_BLUE = hex_color("#4a6c9e")
BIRD_WHITE = hex_color("#f2f2ee")
BIRD_CAP = hex_color("#22232a")
BEAK = hex_color("#3a3530")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.19, 0.2))
MID = Vector((0, 0.02, 0.215))
CHEST = Vector((0, -0.15, 0.22))
NECK = Vector((0, -0.27, 0.22))
HEAD_A = Vector((0, -0.33, 0.23))
SNOUT = Vector((0, -0.52, 0.19))
HEAD_C = Vector((0, -0.39, 0.23))
JAW_A = Vector((0, -0.36, 0.18))
JAW_B = Vector((0, -0.51, 0.13))

# A short, thick tail that lies on the ground and tapers.
TAIL = [Vector((0, 0.29, 0.19)), Vector((0, 0.41, 0.14)), Vector((0, 0.52, 0.09)), Vector((0, 0.62, 0.06))]

# The bird sits high on the back, a little to the camera side.
BIRD_FOOT = Vector((-0.03, -0.02, 0.365))

LEGS = {
    # name: (shoulder, elbow, wrist, toe, parent)
    "FL": (Vector((0.1, -0.15, 0.2)), Vector((0.22, -0.17, 0.16)), Vector((0.24, -0.2, 0.04)), Vector((0.26, -0.28, 0.01)), "chest"),
    "FR": (Vector((-0.1, -0.15, 0.2)), Vector((-0.22, -0.17, 0.16)), Vector((-0.24, -0.2, 0.04)), Vector((-0.26, -0.28, 0.01)), "chest"),
    "BL": (Vector((0.1, 0.19, 0.19)), Vector((0.22, 0.21, 0.16)), Vector((0.24, 0.24, 0.04)), Vector((0.26, 0.16, 0.01)), "hips"),
    "BR": (Vector((-0.1, 0.19, 0.19)), Vector((-0.22, 0.21, 0.16)), Vector((-0.24, 0.24, 0.04)), Vector((-0.26, 0.16, 0.01)), "hips"),
}

TAIL_BONES = ["tail.1", "tail.2", "tail.3"]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("neck", tuple(NECK), tuple(HEAD_A), "chest"),
    ("head", tuple(HEAD_A), tuple(SNOUT), "neck"),
    ("jaw", tuple(JAW_A), tuple(JAW_B), "head"),
    ("tail.1", tuple(TAIL[0]), tuple(TAIL[1]), "hips"),
    ("tail.2", tuple(TAIL[1]), tuple(TAIL[2]), "tail.1"),
    ("tail.3", tuple(TAIL[2]), tuple(TAIL[3]), "tail.2"),
    ("bird", tuple(BIRD_FOOT), tuple(BIRD_FOOT + Vector((0, 0, 0.05))), "spine"),
]
for leg, (shoulder, elbow, wrist, toe, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(shoulder), tuple(elbow), parent),
        (f"lower.{leg}", tuple(elbow), tuple(wrist), f"upper.{leg}"),
        (f"foot.{leg}", tuple(wrist), tuple(toe), f"lower.{leg}"),
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


SPINE_POINTS = [SNOUT, HEAD_A, NECK, CHEST, MID, HIP, TAIL[0], TAIL[1]]
SPINE_NAMES = ["head", "neck", "chest", "spine", "hips", "tail.1", "tail.1"]
body_weights = chain_weights(list(reversed(SPINE_POINTS)), list(reversed(SPINE_NAMES)))
tail_weights = chain_weights([HIP] + TAIL, ["hips"] + TAIL_BONES)


def leg_weights(leg):
    shoulder, _elbow, _wrist, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((abs(co.x) - abs(shoulder.x) - 0.02) / 0.05)
        return {f"upper.{leg}": t, parent: 1 - t}

    return weights


# --- Parts ---------------------------------------------------------------------


def hide_color(face, center):
    """Rough grey-brown hide in patches, and a pale belly."""
    if face.normal.z < -0.35:
        return BELLY
    tone = (int(center.x * 91) * 7 + int(center.y * 87) * 11 + int(center.z * 79) * 3) % 6
    if tone == 0:
        return HIDE_DARK
    if tone == 1 and face.normal.z > 0.3:
        return HIDE_LIGHT
    return HIDE


def rock_plates(part, center, radii, count, size, seed=0, only=None):
    """
    Rock plates on an ellipsoid (Bulwark): low pyramids of stone that lean
    back, some with snow on their tops.
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
        normal = Vector((direction.x / radii[0], direction.y / radii[1], direction.z / radii[2])).normalized()
        base = center + Vector((direction.x * radii[0], direction.y * radii[1], direction.z * radii[2])) * 0.96
        scale = size * (0.75 + 0.5 * ((index * 5) % 4) / 3)
        tip = base + (normal + Y * 0.45).normalized() * scale * 0.9
        verts = kit.cone(part.bm, base - normal * 0.01, tip, scale, 0.004, 4, caps=False)
        snowy = index % 3 != 1
        for face in faces_of(verts):
            facing = face.normal.dot(Z)
            if snowy and facing > 0.55:
                part.paint([face], SNOW)
            elif facing > 0.0:
                part.paint([face], ROCK)
            else:
                part.paint([face], ROCK_DARK)


def body_parts():
    parts = []
    body = Part("body", hide_color, body_weights, shade=0.2)
    # A low, wide body: wide shoulders, a broad barrel and wide hips.
    kit.sphere(body.bm, (0, -0.13, 0.22), (0.15, 0.15, 0.11), 12, 8)
    kit.sphere(body.bm, (0, 0.03, 0.22), (0.17, 0.17, 0.115), 12, 8)
    kit.sphere(body.bm, (0, 0.19, 0.205), (0.14, 0.13, 0.1), 12, 8)
    kit.tube(body.bm, [CHEST + Vector((0, 0.02, 0.0)), NECK, HEAD_A], [0.11, 0.095, 0.085], 10)
    # Rough knobs on the flanks.
    for index in range(14):
        y = lerp(-0.2, 0.24, index / 13)
        for sign in (1, -1):
            verts = kit.sphere(body.bm, (0.15 * sign, y, 0.19 + 0.02 * ((index % 3) - 1)), (0.02, 0.024, 0.016), 5, 3)
            body.paint(faces_of(verts), HIDE_DARK if index % 2 else HIDE_LIGHT)
    parts.append(body)

    plates = Part("plates", ROCK, body_weights, smooth=False, shade=0.1)
    rock_plates(plates, (0, -0.12, 0.23), (0.14, 0.14, 0.1), 26, 0.065, 0, lambda d: d.z > 0.3)
    rock_plates(plates, (0, 0.04, 0.23), (0.16, 0.16, 0.11), 32, 0.075, 2, lambda d: d.z > 0.25)
    rock_plates(plates, (0, 0.19, 0.21), (0.13, 0.12, 0.095), 20, 0.062, 4, lambda d: d.z > 0.3)
    rock_plates(plates, (0, -0.26, 0.23), (0.09, 0.07, 0.08), 12, 0.035, 1, lambda d: d.z > 0.4)
    parts.append(plates)

    tail = Part("tail", hide_color, tail_weights, shade=0.15)
    steps = 10
    path, radii = [], []
    for step in range(steps + 1):
        s = step / steps * (len(TAIL) - 1)
        index = min(int(s), len(TAIL) - 2)
        path.append(TAIL[index].lerp(TAIL[index + 1], s - index))
        radii.append(lerp(0.1, 0.018, (step / steps) ** 0.8))
    kit.tube(tail.bm, path, radii, 8)
    parts.append(tail)

    tail_plates = Part("tail.plates", ROCK, tail_weights, smooth=False, shade=0.1)
    for index in range(1, steps - 2, 2):
        ahead = (path[index + 1] - path[index - 1]).normalized()
        up = (Z - ahead * ahead.dot(Z)).normalized()
        base = path[index] + up * radii[index] * 0.85
        size = radii[index] * 0.65
        verts = kit.cone(tail_plates.bm, base - up * 0.01, base + (up + ahead * 0.5).normalized() * size, size * 0.9, 0.003, 4, caps=False)
        for face in faces_of(verts):
            tail_plates.paint([face], SNOW if face.normal.z > 0.6 and index % 4 == 1 else ROCK)
    parts.append(tail_plates)

    # The small bird on its back: a round blue body, a white belly and face,
    # a black cap and a short beak. It looks to the camera side.
    bird = Part("bird", BIRD_BLUE, "bird", shade=0.12)
    body_c = BIRD_FOOT + Vector((0, 0.005, 0.03))
    kit.sphere(bird.bm, body_c, (0.024, 0.032, 0.024), 8, 6)
    belly = kit.sphere(bird.bm, body_c + Vector((0, -0.01, -0.006)), (0.02, 0.022, 0.018), 7, 5)
    bird.paint(faces_of(belly), BIRD_WHITE)
    head_c = body_c + Vector((-0.004, -0.026, 0.022))
    head = kit.sphere(bird.bm, head_c, (0.017, 0.017, 0.017), 8, 6)
    bird.paint(faces_of(head), BIRD_WHITE)
    cap = kit.sphere(bird.bm, head_c + Vector((0, 0.003, 0.008)), (0.016, 0.016, 0.01), 7, 4)
    bird.paint(faces_of(cap), BIRD_CAP)
    beak = kit.cone(bird.bm, head_c + Vector((-0.004, -0.014, 0.0)), head_c + Vector((-0.006, -0.03, -0.002)), 0.005, 0.001, 4)
    bird.paint(faces_of(beak), BEAK)
    for sign in (1, -1):
        eye = kit.sphere(bird.bm, head_c + Vector((0.013 * sign, -0.007, 0.004)), (0.004, 0.004, 0.004), 4, 3)
        bird.paint(faces_of(eye), BIRD_CAP)
        wing = kit.slab(bird.bm, body_c + Vector((0.02 * sign, 0.008, 0.004)), Vector((0.004 * sign, 0, 0.01)), Vector((0, 0.028, -0.006)), Vector((0.006 * sign, 0, -0.004)))
        bird.paint(faces_of(wing), BIRD_BLUE)
        leg = kit.cone(bird.bm, BIRD_FOOT + Vector((0.008 * sign, 0, 0.012)), BIRD_FOOT + Vector((0.008 * sign, -0.004, -0.002)), 0.002, 0.002, 3)
        bird.paint(faces_of(leg), BEAK)
    tail_feathers = kit.slab(bird.bm, body_c + Vector((0, 0.04, 0.006)), Vector((0.01, 0, 0)), Vector((0, 0.018, 0.006)), Vector((0, 0, 0.003)))
    bird.paint(faces_of(tail_feathers), BIRD_CAP)
    # A little big for a real bird, so it reads on the Board.
    grow = kit.Matrix.Translation(BIRD_FOOT) @ kit.Matrix.Scale(1.5, 4) @ kit.Matrix.Translation(-BIRD_FOOT)
    kit.bmesh.ops.transform(bird.bm, matrix=grow, verts=list(bird.bm.verts))
    parts.append(bird)
    return parts


def head_parts():
    parts = []
    head = Part("head", hide_color, "head", shade=0.14)
    # A broad, blunt head, as wide as the neck.
    kit.sphere(head.bm, HEAD_C + Vector((0, 0.0, 0.01)), (0.09, 0.09, 0.06), 12, 8)
    kit.sphere(head.bm, (0, -0.47, 0.215), (0.072, 0.07, 0.04), 10, 6)
    for sign in (1, -1):
        eye = kit.sphere(head.bm, (0.072 * sign, -0.42, 0.255), (0.02, 0.022, 0.018), 7, 5)
        head.paint(faces_of(eye), EYE)
        pupil = kit.sphere(head.bm, (0.089 * sign, -0.425, 0.255), (0.005, 0.012, 0.01), 5, 3)
        head.paint(faces_of(pupil), PUPIL)
        nostril = kit.sphere(head.bm, (0.025 * sign, -0.535, 0.215), (0.008, 0.006, 0.006), 4, 3)
        head.paint(faces_of(nostril), PUPIL)
        # Upper teeth along the edge of the mouth.
        for step in range(4):
            y = lerp(-0.42, -0.51, step / 3)
            tooth = kit.cone(head.bm, (0.052 * sign * (1 - step * 0.12), y, 0.19), (0.05 * sign * (1 - step * 0.12), y, 0.168), 0.007, 0.001, 4)
            head.paint(faces_of(tooth), TOOTH)
    upper = kit.sphere(head.bm, (0, -0.46, 0.195), (0.06, 0.06, 0.012), 8, 4)
    head.paint(faces_of(upper), MOUTH)
    parts.append(head)

    # Rock plates over the eyes and on the top of the head.
    crown = Part("crown", ROCK, "head", smooth=False, shade=0.1)
    rock_plates(crown, HEAD_C + Vector((0, 0.01, 0.015)), (0.085, 0.085, 0.055), 18, 0.03, 3, lambda d: d.z > 0.35)
    for sign in (1, -1):
        brow = kit.cone(crown.bm, (0.07 * sign, -0.41, 0.265), (0.085 * sign, -0.38, 0.3), 0.024, 0.004, 4, caps=False)
        crown.paint(faces_of(brow), ROCK_DARK)
    parts.append(crown)

    # The open lower jaw (the hiss) with a pink tongue and teeth.
    jaw = Part("jaw", BELLY, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.44, 0.15), (0.068, 0.08, 0.028), 10, 5)
    mouth = kit.sphere(jaw.bm, (0, -0.445, 0.165), (0.056, 0.068, 0.012), 8, 3)
    jaw.paint(faces_of(mouth), MOUTH)
    tongue = kit.tube(jaw.bm, [Vector((0, -0.39, 0.168)), Vector((0, -0.45, 0.178)), Vector((0, -0.5, 0.188))], [0.026, 0.022, 0.014], 6)
    jaw.paint(faces_of(tongue), TONGUE)
    for sign in (1, -1):
        for step in range(3):
            y = lerp(-0.42, -0.5, step / 2)
            tooth = kit.cone(jaw.bm, (0.05 * sign * (1 - step * 0.15), y, 0.165), (0.05 * sign * (1 - step * 0.15), y, 0.188), 0.007, 0.001, 4)
            jaw.paint(faces_of(tooth), TOOTH)
    parts.append(jaw)
    return parts


def leg_parts():
    parts = []
    for leg, (shoulder, elbow, wrist, toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", hide_color, leg_weights(leg), shade=0.12)
        kit.cone(upper.bm, shoulder, elbow, 0.075, 0.056, 8)
        kit.sphere(upper.bm, elbow, (0.056, 0.056, 0.056), 6, 4)
        parts.append(upper)

        lower = Part(f"lower.{leg}", hide_color, f"lower.{leg}", shade=0.12)
        kit.cone(lower.bm, elbow, wrist, 0.052, 0.04, 8)
        parts.append(lower)

        foot = Part(f"foot.{leg}", HIDE, f"foot.{leg}", shade=0.1)
        ahead = toe - wrist
        ahead.z = 0
        ahead.normalize()
        side = ahead.cross(Z).normalized()
        kit.sphere(foot.bm, wrist + ahead * 0.02 + Vector((0, 0, -0.015)), (0.042, 0.042, 0.022), 7, 4)
        # Four thick toes with long dark claws.
        for spread in (-1.5, -0.5, 0.5, 1.5):
            direction = (ahead + side * spread * 0.42).normalized()
            knuckle = wrist + Vector((0, 0, -0.02)) + direction * 0.032
            tip = knuckle + direction * 0.038 + Vector((0, 0, -0.008))
            kit.cone(foot.bm, knuckle, tip, 0.013, 0.01, 4)
            claw = kit.cone(foot.bm, tip, tip + direction * 0.03 + Vector((0, 0, -0.014)), 0.01, 0.001, 4)
            foot.paint(faces_of(claw), CLAW)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CragLizard", BONES)
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CragLizardMesh")
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
        """
        Leg moves: `FL=(swing, lift)`. A negative swing reaches the foot
        forward (about Z, as the legs sprawl); `lift` raises the elbow.
        """
        result = {}
        for leg, (swing, lift) in angles.items():
            sign = 1 if LEGS[leg][0].x > 0 else -1
            result[f"upper__{leg}"] = t(f"upper.{leg}", (Z, swing * sign), (Y, -lift * sign))
            result[f"lower__{leg}"] = t(f"lower.{leg}", (Y, lift * 0.6 * sign))
            result[f"foot__{leg}"] = t(f"foot.{leg}", (Z, -swing * sign))
        return result

    def tail(curl=0.0, sweep=0.0):
        """The tail: `curl` > 0 lifts it; `sweep` > 0 swings it to its right (the camera side)."""
        result = {}
        for index, bone in enumerate(TAIL_BONES):
            result[bone] = t(bone, (Z, sweep * (6 + 4 * index)), (X, -curl * (6 + 3 * index)))
        return result

    def bird(look=0.0, hop=0.0, lean=0.0):
        """The bird: `look` turns its head to its right (the camera), `hop` lifts it off the back."""
        return {
            "bird": t("bird", (Z, -40 * look), (X, lean * 20)),
            "bird@loc": at("bird", (0, 0, 0.04 * hop)),
        }

    def stand(breath=0.0, sway=0.0, look=0.0):
        """The idle stance: low and wide, turned a little to the camera, a slow hiss. The bird looks round."""
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.004)),
            "hips": t("hips", (Z, -6)),
            "spine": t("spine", (X, -breath * 1.5)),
            "chest": t("chest", (Z, sway * 2), (X, breath * 1.5)),
            "neck": t("neck", (Z, -4 + sway * 4), (X, -4)),
            "head": t("head", (Z, -4 + sway * 4), (X, -breath * 4)),
            "jaw": t("jaw", (X, 14 + breath * 8)),
            **tail(0.0, sway * 0.4),
            **bird(look),
        }

    def gasp(breath=0.0):
        """Low HP: the belly on the ground, the head down and the mouth half open."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.022 - breath * 0.004)),
            chest=t("chest", (X, 4 + breath * 2)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 8 + breath * 4), (Z, -6)),
            jaw=t("jaw", (X, 8 + breath * 6)),
            **tail(-0.4, 0.0),
            **legs(FL=(-6, 20), FR=(6, 20), BL=(-6, 20), BR=(6, 20)),
            **bird(-0.5, 0.0, 0.3),
        )

    def duck(base, amount=1.0):
        """Bulwark: the hit makes it duck low behind its plates, the head pulled in. The bird hops up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.03 * amount)),
            chest=t("chest", (X, 6 * amount), (Z, 6 * amount)),
            neck=t("neck", (X, 14 * amount), (Z, 6 * amount)),
            head=t("head", (X, -10 * amount)),
            jaw=t("jaw", (X, 30 * amount)),
            **tail(-0.4 * amount, -0.8 * amount),
            **legs(FL=(-4, 18 * amount), FR=(4, 18 * amount), BL=(-4, 18 * amount), BR=(4, 18 * amount)),
            **bird(0.6, 1.0 * amount, -0.5 * amount),
        )

    def buckle(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.012)),
            chest=t("chest", (X, 8), (Y, 10)),
            head=t("head", (X, 14)),
            jaw=t("jaw", (X, 20)),
            **tail(-0.6, 0.4),
            **legs(FL=(-10, 30), FR=(10, 30), BL=(-10, 30), BR=(10, 30)),
            **bird(1.0, 2.5, -1.0),
        )

    def fallen(base, bounce=0.0):
        """
        On its left side, the legs out. The Battle camera sees the right side
        of a player Unit (-X), so it sees the pale belly and the legs. The bird
        has flown up over it.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.2, 0, 0.16)),
            spine=t("spine", (Z, 6)),
            chest=t("chest", (X, 2)),
            neck=t("neck", (Z, 10), (X, 8)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 24)),
            **tail(-1.0, -0.5),
            **legs(FR=(-20, -20), BR=(30, -20)),
            # The left legs fold up along the body, so they stay out of the ground.
            upper__FL=t("upper.FL", (Z, -40), (Y, -100)),
            lower__FL=t("lower.FL", (Y, -90)),
            upper__BL=t("upper.BL", (Z, 40), (Y, -100)),
            lower__BL=t("lower.BL", (Y, -90)),
            # The bird bone turns with the body, so it is lifted back to stand above it.
            bird=t("bird", (Y, -84 + bounce), (Z, -30)),
            bird_at_loc=at("bird", (-0.14, 0, 0.1)),
        )

    def low(base):
        """Flat on the ground, as a summon starts. The bird is not there yet."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.05)),
            chest=t("chest", (X, 4)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 12)),
            jaw=t("jaw", (X, 0)),
            **tail(-0.6, 0.0),
            **legs(FL=(-10, 40), FR=(10, 40), BL=(-10, 40), BR=(10, 40)),
            bird_at_scale=0.01,
        )

    def hiss(base):
        """The front up, the head high and the jaw wide open: the end of a summon. The bird lands."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.01)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -8)),
            neck=t("neck", (X, -16), (Z, -8)),
            head=t("head", (X, -10), (Z, -8)),
            jaw=t("jaw", (X, 36)),
            **tail(0.6, 0.3),
            **legs(FL=(-10, -12), FR=(-10, -12)),
            **bird(0.5, 0.6, 0.4),
        )

    def stride(phase):
        """
        The plod (Heavy): the legs move in diagonal pairs, FL with BR and FR
        with BL, slow and low, and the body rolls from side to side. The bird
        rides it.
        """
        wave = math.sin(phase * 2 * math.pi)
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.005 * abs(math.cos(phase * 2 * math.pi)))),
            hips=t("hips", (Z, -6 + 8 * wave)),
            spine=t("spine", (Z, -6 * wave), (Y, 3 * wave)),
            chest=t("chest", (Z, -6 * wave)),
            neck=t("neck", (Z, 6 * wave), (X, -4)),
            head=t("head", (Z, 3 * wave)),
            jaw=t("jaw", (X, 8)),
            **tail(0.0, 0.5 * wave),
            **bird(0.3 * wave, 0.0, 0.2 * wave),
        )
        steps = {}
        for leg, offset in (("FL", 0.0), ("BR", 0.0), ("FR", 0.5), ("BL", 0.5)):
            local = (phase - offset) % 1.0
            if local < 0.4:
                u = local / 0.4
                steps[leg] = (lerp(20, -20, u), 20 * math.sin(u * math.pi))
            else:
                u = (local - 0.4) / 0.6
                steps[leg] = (lerp(-20, 20, u), 0.0)
        return pose(result, **legs(**steps))

    # The attack: it draws back low with the jaw wide, then lunges and bites.
    # The slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts),
    # so the jaw snaps shut at frame 15 of 30.
    def draw_back(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.01)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -6)),
            jaw=t("jaw", (X, 40)),
            **tail(0.4, -0.4),
            **legs(FL=(14, 4), FR=(14, 4), BL=(10, 0), BR=(10, 0)),
            **bird(0.8, 0.2, -0.2),
        )

    def bite(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.12 - 0.02 * follow, 0.0)),
            chest=t("chest", (X, 4)),
            neck=t("neck", (X, 8), (Z, -4)),
            head=t("head", (X, 6 + 4 * follow)),
            jaw=t("jaw", (X, 2)),
            **tail(0.2, 0.6),
            **legs(FL=(-24, 6), FR=(-24, 6), BL=(16, 0), BR=(16, 0)),
            **bird(-0.4, 0.8 - 0.8 * follow, 0.6),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, look in ((0, 0, 0, 0), (12, 0.5, 1, 0), (16, 0.6, 0.8, 1), (24, 1, 0, 1), (30, 0.8, -0.5, -0.6), (36, 0.5, -1, -0.6), (42, 0.2, -0.5, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, look))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, gasp(breath))
    clips.append(low_hp)

    walk = Clip("walk", 28, loop=True)
    for frame in range(0, 29, 2):
        walk.key(frame, stride(frame / 28))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, draw_back(stand())).key(12, draw_back(stand()))
    attack.key(15, bite(stand())).key(19, bite(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, duck(stand())).key(8, duck(stand(), 0.5)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, duck(stand())).key(14, buckle(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, low(stand())).key(15, hiss(stand())).key(19, hiss(stand()))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "crag-lizard.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
