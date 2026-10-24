"""
Winter Maw (`undead.winterMaw`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a large spectral grave hound with
pale frosted fur over bare ribs, a mane of ice-blue shards, glowing ice-blue
eyes, open jaws with long fangs and frost on the chin, and an ornate broken
collar with a short rusted chain. A second, smaller hound of the pack (Swarm)
runs behind it with a frozen stick in its mouth. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/winter-maw.glb`; then
`bun unit-model:pack winter-maw` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y.
The legs are named FL, FR, BL and BR (front and back, left and right). The
pup stands behind on the camera side (-X), so the Battle camera sees it; it
stands on the `ground` bone, so it does not fall with the root. The attack
(First Strike) is a fast leap and a bite. It has no Keyword that it uses by
its own action, so it has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, clamp01, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

FUR = hex_color("#e3e6e4")
FUR_DARK = hex_color("#b4bcc0")
FUR_SHADOW = hex_color("#7d8e96")
RIB = hex_color("#4a5c66")
ICE = hex_color("#c9ecff")
ICE_DEEP = hex_color("#7fc4ef")
EYE = hex_color("#8ff0ff")
MOUTH = hex_color("#3a4652")
FANG = hex_color("#f3eee0")
CLAW = hex_color("#3e3a3a")
BRASS = hex_color("#a8743a")
GOLD = hex_color("#d4a640")
RUST = hex_color("#7a4a2c")
STICK = hex_color("#9fd6f2")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.22, 0.4))
MID = Vector((0, 0.04, 0.42))
CHEST = Vector((0, -0.12, 0.45))
NECK = Vector((0, -0.19, 0.5))
HEAD = Vector((0, -0.27, 0.6))
HEAD_C = Vector((0, -0.32, 0.62))

LEGS = {
    # name: (top, joint, ankle, toe, parent)
    "FL": (Vector((0.08, -0.13, 0.4)), Vector((0.085, -0.11, 0.23)), Vector((0.085, -0.13, 0.06)), Vector((0.085, -0.2, 0.02)), "chest"),
    "FR": (Vector((-0.08, -0.13, 0.4)), Vector((-0.085, -0.11, 0.23)), Vector((-0.085, -0.13, 0.06)), Vector((-0.085, -0.2, 0.02)), "chest"),
    "BL": (Vector((0.08, 0.22, 0.38)), Vector((0.085, 0.3, 0.22)), Vector((0.085, 0.27, 0.06)), Vector((0.085, 0.2, 0.02)), "hips"),
    "BR": (Vector((-0.08, 0.22, 0.38)), Vector((-0.085, 0.3, 0.22)), Vector((-0.085, 0.27, 0.06)), Vector((-0.085, 0.2, 0.02)), "hips"),
}

TAIL = [Vector((0, 0.3, 0.45)), Vector((0, 0.39, 0.5)), Vector((0, 0.47, 0.54))]

# The pup: a small hound behind on the camera side, at its own size.
PUP = Vector((-0.19, 0.29, 0))
PUP_SCALE = 0.55


def pup_point(point):
    """A point of the pup, made at the size of a big hound and scaled down about its feet."""
    return PUP + Vector(point) * PUP_SCALE


PUP_BODY_Z = 0.36
PUP_NECK = pup_point((0, -0.16, 0.44))
PUP_HEAD_C = pup_point((0, -0.25, 0.56))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("neck", tuple(NECK), tuple(HEAD), "chest"),
    ("head", tuple(HEAD), (0, -0.48, 0.6), "neck"),
    ("jaw", (0, -0.31, 0.58), (0, -0.47, 0.54), "head"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[1]), "hips"),
    ("tail.2", tuple(TAIL[1]), tuple(TAIL[2]), "tail"),
]
for leg, (top, joint, ankle, toe, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(top), tuple(joint), parent),
        (f"lower.{leg}", tuple(joint), tuple(ankle), f"upper.{leg}"),
        (f"paw.{leg}", tuple(ankle), tuple(toe), f"lower.{leg}"),
    ]
BONES += [
    # The pup stands on the ground: it does not fall with the root.
    ("ground", (0, 0.2, 0), (0, 0.2, 0.1), None),
    ("pup", tuple(pup_point((0, 0.04, PUP_BODY_Z))), tuple(pup_point((0, -0.12, PUP_BODY_Z + 0.02))), "ground"),
    ("pup.head", tuple(PUP_NECK), tuple(pup_point((0, -0.4, 0.56))), "pup"),
    ("pup.legs.F", tuple(pup_point((0, -0.1, 0.32))), tuple(pup_point((0, -0.1, 0.04))), "pup"),
    ("pup.legs.B", tuple(pup_point((0, 0.16, 0.32))), tuple(pup_point((0, 0.16, 0.04))), "pup"),
    ("pup.tail", tuple(pup_point((0, 0.22, 0.4))), tuple(pup_point((0, 0.36, 0.52))), "pup"),
]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front."""
    if co.y > 0.1:
        t = clamp01((co.y - 0.1) / 0.1)
        return {"spine": 1 - t, "hips": t}
    if co.y > -0.16:
        t = clamp01((co.y + 0.08) / 0.12)
        return {"chest": 1 - t, "spine": t}
    t = clamp01((co.y + 0.24) / 0.07)
    return {"neck": 1 - t, "chest": t}


def neck_weights(co):
    t = clamp01((co.z - NECK.z + 0.03) / 0.07)
    return {"neck": t, "chest": 1 - t}


def tail_weights(co):
    t = clamp01((co.y - 0.4) / 0.06)
    return {"tail": 1 - t, "tail.2": t}


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.05)) / 0.07)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def fur_color(face, center):
    """Frosted fur: light on the top, grey on the sides and blue-grey underneath."""
    if face.normal.z < -0.35:
        return FUR_SHADOW
    if face.normal.z < 0.1:
        return FUR_DARK
    return FUR


def barrel_color(face, center):
    """The bare ribs show on the sides of the barrel: dark gaps between pale ribs."""
    if abs(face.normal.x) > 0.45 and -0.08 < center.y < 0.16 and center.z < 0.46:
        return RIB if int((center.y + 0.2) * 40) % 2 else FUR_DARK
    return fur_color(face, center)


def shards(part, points, direction, length, radius, deep_every=2, sides=4):
    """Ice shards from `points`, light and deep blue in turn."""
    direction = Vector(direction).normalized()
    for index, point in enumerate(points):
        point = Vector(point)
        reach = length * (0.75 + 0.5 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, point - direction * 0.01, point + direction * reach, radius, 0.002, sides)
        part.paint(faces_of(verts), ICE_DEEP if index % deep_every == 1 else ICE)


def body_parts():
    parts = []
    body = Part("body", barrel_color, body_weights, shade=0.22)
    # The deep chest, the lean barrel and the hindquarters.
    kit.sphere(body.bm, (0, -0.1, 0.44), (0.11, 0.15, 0.13), 12, 9)
    kit.sphere(body.bm, (0, 0.05, 0.43), (0.095, 0.15, 0.1), 12, 8)
    kit.sphere(body.bm, (0, 0.22, 0.42), (0.1, 0.1, 0.1), 10, 8)
    # The icy mane down the back, longest over the shoulders, swept back.
    ridge = [(0, y, 0.55 - abs(y + 0.12) * 0.3) for y in (-0.16, -0.08, 0.0, 0.1)]
    shards(body, ridge, (0, 1, 0.45), 0.12, 0.026)
    for sign in (1, -1):
        flank = [(0.08 * sign, y, 0.5) for y in (-0.14, -0.05)]
        shards(body, flank, (0.5 * sign, 0.8, 0.3), 0.07, 0.018)
    # Frost tufts hang under the chest.
    shards(body, [(x, -0.12, 0.33) for x in (-0.05, 0.0, 0.05)], (0, 0.3, -1), 0.06, 0.018)
    parts.append(body)

    neck = Part("neck", fur_color, neck_weights, shade=0.18)
    kit.tube(neck.bm, [NECK + Vector((0, 0.05, -0.04)), NECK, HEAD + Vector((0, 0.02, -0.02))], [0.1, 0.085, 0.07], 10)
    # A thick ruff of ice shards round the neck.
    for sign in (1, -1):
        shards(neck, [NECK + Vector((0.07 * sign, 0.02, 0.06)), HEAD + Vector((0.06 * sign, 0.04, 0.0)), NECK + Vector((0.08 * sign, 0.04, -0.02))], (0.7 * sign, 0.7, 0.3), 0.12, 0.03)
    shards(neck, [HEAD + Vector((0, 0.04, 0.06)), NECK + Vector((0, 0.03, 0.09))], (0, 0.8, 0.6), 0.14, 0.032)
    parts.append(neck)

    # The ornate broken collar: brass with a gold medallion and studs.
    collar = Part("collar", BRASS, "neck", shade=0.08)
    ring = kit.torus(collar.bm, NECK + Vector((0, -0.02, 0.03)), (0, -0.5, 0.85), 0.095, 0.016, 16, 5)
    collar.paint({f for f in faces_of(ring) if f.calc_center_median().y > NECK.y + 0.02}, RUST)
    medallion = kit.cone(collar.bm, NECK + Vector((0, -0.1, -0.03)), NECK + Vector((0, -0.115, -0.04)), 0.03, 0.03, 10)
    collar.paint(faces_of(medallion), GOLD)
    for index in range(5):
        a = math.radians(-60 + 30 * index)
        stud_at = NECK + Vector((0.09 * math.sin(a), -0.02 - 0.08 * math.cos(a), 0.03 + 0.045 * math.cos(a)))
        stud = kit.cone(collar.bm, stud_at, stud_at + Vector((math.sin(a), -math.cos(a), 0.3)) * 0.03, 0.01, 0.002, 4)
        collar.paint(faces_of(stud), GOLD)
    # The short rusted chain hangs on the camera side, broken at its end.
    link_at = NECK + Vector((-0.1, -0.02, 0.0))
    for index in range(3):
        normal = X if index % 2 else Y
        link = kit.torus(collar.bm, link_at + Vector((-0.01 * index, 0.005 * index, -0.035 * index)), normal, 0.018, 0.005, 8, 3)
        collar.paint(faces_of(link), RUST)
    parts.append(collar)

    tail = Part("tail", fur_color, tail_weights, shade=0.15)
    kit.tube(tail.bm, [TAIL[0] - Vector((0, 0.04, 0.02)), TAIL[0], TAIL[1], TAIL[2], TAIL[2] + Vector((0, 0.05, 0.02))], [0.05, 0.045, 0.04, 0.03, 0.006], 7)
    shards(tail, [TAIL[1] + Vector((0, 0.02, 0.02)), TAIL[2] + Vector((0, 0.02, 0.0)), TAIL[2] + Vector((0, 0.0, 0.04))], (0, 0.5, 0.9), 0.08, 0.02)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", fur_color, "head", shade=0.15)
    kit.sphere(head.bm, HEAD_C, (0.065, 0.075, 0.06), 12, 8)
    # The long snout, the brow over the eyes and a black nose.
    kit.cone(head.bm, (0, -0.35, 0.625), (0, -0.48, 0.6), 0.045, 0.028, 10)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.032 * sign, -0.37, 0.66), (0.026, 0.04, 0.016), 8, 5)
    nose = kit.sphere(head.bm, (0, -0.485, 0.607), (0.018, 0.014, 0.014), 6, 4)
    head.paint(faces_of(nose), CLAW)
    lip = kit.box(head.bm, (0, -0.42, 0.585), (0.06, 0.12, 0.01))
    head.paint(faces_of(lip), MOUTH)
    # Tall pointed ears, laid back.
    for sign in (1, -1):
        ear = kit.cone(head.bm, (0.04 * sign, -0.3, 0.66), (0.055 * sign, -0.25, 0.76), 0.026, 0.003, 5, squash=0.55)
        head.paint({f for f in faces_of(ear) if f.normal.y < -0.3}, FUR_SHADOW)
    parts.append(head)

    fangs = Part("fangs", FANG, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(fangs.bm, (0.024 * sign, -0.455, 0.588), (0.026 * sign, -0.465, 0.53), 0.009, 0.001, 4)
        for y in (-0.38, -0.41, -0.435):
            kit.cone(fangs.bm, (0.027 * sign, y, 0.588), (0.027 * sign, y, 0.565), 0.005, 0.001, 4)
    parts.append(fangs)

    eyes = Part("eyes", EYE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.042 * sign, -0.385, 0.645), (0.013, 0.014, 0.009), 6, 5)
    parts.append(eyes)

    jaw = Part("jaw", FUR_DARK, "jaw", shade=0.08)
    kit.cone(jaw.bm, (0, -0.32, 0.58), (0, -0.47, 0.555), 0.038, 0.022, 10)
    mouth = kit.box(jaw.bm, (0, -0.4, 0.584), (0.05, 0.12, 0.01))
    jaw.paint(faces_of(mouth), MOUTH)
    for sign in (1, -1):
        for y in (-0.4, -0.44):
            tooth = kit.cone(jaw.bm, (0.024 * sign, y, 0.585), (0.024 * sign, y, 0.61), 0.006, 0.001, 4)
            jaw.paint(faces_of(tooth), FANG)
    # Frost on the chin: icicles, and frost shards at the corners of the mouth.
    for index, y in enumerate((-0.36, -0.41, -0.45)):
        drop = kit.cone(jaw.bm, (0, y, 0.55), (0, y + 0.01, 0.49 + 0.015 * index), 0.012, 0.002, 4)
        jaw.paint(faces_of(drop), ICE)
    for sign in (1, -1):
        frost = kit.cone(jaw.bm, (0.03 * sign, -0.34, 0.585), (0.07 * sign, -0.31, 0.6), 0.012, 0.002, 4)
        jaw.paint(faces_of(frost), ICE_DEEP)
    parts.append(jaw)
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", fur_color, leg_weights(leg))
        kit.cone(upper.bm, top + Vector((0, 0, 0.04)), joint, 0.06, 0.038, 8)
        parts.append(upper)

        lower = Part(f"lower.{leg}", fur_color, f"lower.{leg}")
        kit.cone(lower.bm, joint, ankle, 0.034, 0.026, 7)
        # A frost tuft at the back of each joint.
        tuft = kit.cone(lower.bm, joint + Vector((0, 0.015, 0.0)), joint + Vector((0, 0.07, -0.04)), 0.016, 0.002, 4)
        lower.paint(faces_of(tuft), ICE)
        parts.append(lower)

        paw = Part(f"paw.{leg}", FUR_DARK, f"paw.{leg}", shade=0.1)
        kit.sphere(paw.bm, Vector((ankle.x, ankle.y - 0.02, 0.03)), (0.036, 0.048, 0.03), 8, 6)
        for side in (-1, 0, 1):
            base = Vector((ankle.x + side * 0.02, ankle.y - 0.06, 0.02))
            claw = kit.cone(paw.bm, base, base + Vector((0, -0.03, -0.012)), 0.008, 0.001, 4)
            paw.paint(faces_of(claw), CLAW)
        parts.append(paw)
    return parts


def pup_parts():
    """The second hound of the pack, with the frozen stick: the humor note of the card."""
    parts = []
    body = Part("pup.body", fur_color, "pup", shade=0.2)
    kit.sphere(body.bm, pup_point((0, 0.02, PUP_BODY_Z)), (0.1 * PUP_SCALE, 0.2 * PUP_SCALE, 0.1 * PUP_SCALE), 10, 7)
    kit.tube(body.bm, [pup_point((0, -0.1, 0.38)), PUP_NECK, pup_point((0, -0.2, 0.5))], [0.08 * PUP_SCALE, 0.07 * PUP_SCALE, 0.06 * PUP_SCALE], 8)
    shards(body, [pup_point((0, y, 0.45)) for y in (-0.1, 0.0, 0.1)], (0, 0.9, 0.6), 0.1 * PUP_SCALE, 0.03 * PUP_SCALE)
    collar = kit.torus(body.bm, pup_point((0, -0.15, 0.45)), (0, -0.5, 0.85), 0.075 * PUP_SCALE, 0.014 * PUP_SCALE, 12, 4)
    body.paint(faces_of(collar), BRASS)
    parts.append(body)

    head = Part("pup.head", fur_color, "pup.head", shade=0.15)
    kit.sphere(head.bm, PUP_HEAD_C, (0.07 * PUP_SCALE, 0.08 * PUP_SCALE, 0.065 * PUP_SCALE), 10, 7)
    kit.cone(head.bm, pup_point((0, -0.28, 0.56)), pup_point((0, -0.4, 0.54)), 0.045 * PUP_SCALE, 0.03 * PUP_SCALE, 8)
    nose = kit.sphere(head.bm, pup_point((0, -0.405, 0.548)), (0.012, 0.01, 0.01), 5, 3)
    head.paint(faces_of(nose), CLAW)
    for sign in (1, -1):
        ear = kit.cone(head.bm, pup_point((0.04 * sign, -0.24, 0.6)), pup_point((0.06 * sign, -0.2, 0.7)), 0.03 * PUP_SCALE, 0.002, 5, squash=0.55)
        head.paint({f for f in faces_of(ear) if f.normal.y < -0.3}, FUR_SHADOW)
        eye = kit.sphere(head.bm, pup_point((0.04 * sign, -0.31, 0.59)), (0.008, 0.008, 0.006), 5, 3)
        head.paint(faces_of(eye), EYE)
    # The frozen stick, held across the jaws, with icicles under it.
    stick_at = pup_point((0, -0.35, 0.52))
    # It lies across the jaws at a slant, so the camera at the side sees it.
    stick = kit.cone(head.bm, stick_at + Vector((0.11, 0.05, 0.03)), stick_at + Vector((-0.13, -0.06, -0.03)), 0.014, 0.011, 6)
    head.paint(faces_of(stick), STICK)
    for x in (0.08, 0.04, -0.05, -0.09):
        icicle = kit.cone(head.bm, stick_at + Vector((x, 0, -0.006)), stick_at + Vector((x, 0, -0.03)), 0.006, 0.001, 4)
        head.paint(faces_of(icicle), ICE)
    twig = kit.cone(head.bm, stick_at + Vector((-0.07, -0.03, -0.01)), stick_at + Vector((-0.1, -0.05, 0.03)), 0.005, 0.002, 4)
    head.paint(faces_of(twig), STICK)
    parts.append(head)

    for pair, y in (("F", -0.1), ("B", 0.16)):
        legs = Part(f"pup.legs.{pair}", fur_color, f"pup.legs.{pair}", shade=0.1)
        for sign in (1, -1):
            kit.cone(legs.bm, pup_point((0.06 * sign, y, 0.34)), pup_point((0.065 * sign, y, 0.04)), 0.04 * PUP_SCALE, 0.026 * PUP_SCALE, 6)
            paw = kit.sphere(legs.bm, pup_point((0.065 * sign, y - 0.02, 0.03)), (0.035 * PUP_SCALE, 0.05 * PUP_SCALE, 0.03 * PUP_SCALE), 6, 4)
            legs.paint(faces_of(paw), FUR_DARK)
        parts.append(legs)

    tail = Part("pup.tail", fur_color, "pup.tail", shade=0.1)
    kit.tube(tail.bm, [pup_point((0, 0.2, 0.38)), pup_point((0, 0.3, 0.48)), pup_point((0, 0.36, 0.56))], [0.04 * PUP_SCALE, 0.03 * PUP_SCALE, 0.004], 6)
    shards(tail, [pup_point((0, 0.32, 0.52))], (0, 0.5, 0.9), 0.08 * PUP_SCALE, 0.025 * PUP_SCALE)
    parts.append(tail)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("WinterMaw", BONES)
    parts = body_parts() + head_parts() + leg_parts() + pup_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "WinterMawMesh")
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
        """Leg swings: `FL=(upper, lower, paw)` in degrees about X. A negative upper swings forward."""
        result = {}
        for leg, (upper, lower, paw) in angles.items():
            result[f"upper__{leg}"] = t(f"upper.{leg}", (X, upper))
            result[f"lower__{leg}"] = t(f"lower.{leg}", (X, lower))
            result[f"paw__{leg}"] = t(f"paw.{leg}", (X, paw))
        return result

    def pup(wag=0.0, hop=0.0, front=0.0, back=0.0, nod=0.0, turn_=0.0):
        """The pup: a tail wag, a hop, its front and back legs, a nod of the head with the stick."""
        return {
            "pup@loc": at("pup", (0, 0, hop)),
            "pup": t("pup", (Z, turn_), (X, -hop * 120)),
            "pup.head": t("pup.head", (X, nod), (Z, 6)),
            "pup.legs.F": t("pup.legs.F", (X, front)),
            "pup.legs.B": t("pup.legs.B", (X, back)),
            "pup.tail": t("pup.tail", (Z, wag * 30), (X, -10)),
        }

    def stand(breath=0.0, sway=0.0, wag=0.0):
        """The idle: low and ready to spring, the head turned to the camera, the jaws open in a cold breath."""
        return {
            "hips@loc": at("hips", (0, 0, -0.02 - breath * 0.004)),
            "hips": t("hips", (Z, -8)),
            "spine": t("spine", (X, 4 - breath * 2)),
            "chest": t("chest", (X, 6 + breath * 2), (Z, sway * 3)),
            "neck": t("neck", (Z, 8 + sway * 4), (X, 10)),
            "head": t("head", (Z, 6 + sway * 6), (X, -6 - breath * 3), (Y, sway * 4)),
            "jaw": t("jaw", (X, -18 - breath * 10)),
            "tail": t("tail", (Z, sway * 10), (X, 10 - breath * 4)),
            "tail.2": t("tail.2", (Z, sway * 14), (X, 10)),
            **legs(FL=(-6, 14, -8), FR=(4, 10, -10), BL=(-14, 24, -10), BR=(-10, 20, -10)),
            **pup(wag=wag, nod=breath * 6),
        }

    def gasp(breath=0.0):
        """Low HP: the legs shake, the head hangs, the jaws loose; the pup drops its head too."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.04 - breath * 0.008)),
            spine=t("spine", (X, 8)),
            chest=t("chest", (X, 10 + breath * 3)),
            neck=t("neck", (X, 30 + breath * 4)),
            head=t("head", (X, 10), (Y, -12)),
            jaw=t("jaw", (X, -24 - breath * 8)),
            tail=t("tail", (X, 50)),
            tail__2=t("tail.2", (X, 20)),
            **legs(FL=(-8, 30, -20), FR=(6, 22, -22), BL=(-20, 34, -14), BR=(-16, 30, -14)),
            **pup(nod=24 + breath * 6, wag=-0.2),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the head up and the body back; the pup flinches."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04 * amount, -0.02)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            neck=t("neck", (X, -18 * amount)),
            head=t("head", (X, -18 * amount), (Z, 12 * amount)),
            jaw=t("jaw", (X, -30 * amount)),
            tail=t("tail", (X, 30 * amount)),
            **pup(hop=0.03 * amount, nod=-14 * amount, back=10 * amount),
        )

    def buckle(base):
        """The legs give way."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.06)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, 30)),
            head=t("head", (X, 10)),
            jaw=t("jaw", (X, -26)),
            **legs(FL=(-20, 50, -30), FR=(-10, 40, -30), BL=(-30, 40, -10), BR=(-24, 40, -10)),
            **pup(nod=10),
        )

    def fallen(base, bounce=0.0):
        """
        On its left side, the legs stiff and out, so the Battle camera (-X)
        sees the legs and the belly. The pup lies down beside it, its head on
        its paws, the stick still in its mouth.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.3, 0, 0.13)),
            hips_at_loc=at("hips", (0, 0, -0.02)),
            neck=t("neck", (X, 10), (Y, 14)),
            head=t("head", (X, -6), (Y, 14)),
            jaw=t("jaw", (X, -26)),
            tail=t("tail", (X, 40), (Y, 20)),
            **legs(FL=(-50, 14, -10), FR=(-24, 10, -10), BL=(44, 6, 0), BR=(10, 10, 0)),
            **pup(hop=-0.09, front=-70, back=60, nod=30, wag=0.0),
        )

    def low(base):
        """Down low with the legs folded, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.1)),
            chest=t("chest", (X, 6)),
            neck=t("neck", (X, 30)),
            head=t("head", (X, 16)),
            jaw=t("jaw", (X, 0)),
            tail=t("tail", (X, 40)),
            **legs(FL=(-60, 120, -50), FR=(-60, 120, -50), BL=(-70, 110, -40), BR=(-70, 110, -40)),
            **pup(hop=-0.05, front=-40, back=40, nod=20),
        )

    def howl(base):
        """The head high and the jaws wide: the end of a summon. The pup howls round its stick."""
        return pose(
            base,
            hips=t("hips", (Z, -8), (X, -10)),
            hips_at_loc=at("hips", (0, 0.02, 0.0)),
            chest=t("chest", (X, -8)),
            neck=t("neck", (X, -30)),
            head=t("head", (X, -24)),
            jaw=t("jaw", (X, -36)),
            tail=t("tail", (X, -10)),
            **legs(FL=(-20, 30, -10), FR=(-8, 24, -10), BL=(8, 10, -10), BR=(12, 6, -10)),
            **pup(nod=-40, wag=1.0),
        )

    def stride(phase):
        """
        A trot: the diagonal pairs swing together. `phase` 0 has FL and BR
        forward; 0.5 has FR and BL forward. The pup bounds after it.
        """
        swing = math.cos(phase * 2 * math.pi)
        lift_a = max(0.0, math.sin(phase * 2 * math.pi))
        lift_b = max(0.0, -math.sin(phase * 2 * math.pi))
        bound = math.sin(phase * 4 * math.pi)
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.0 + 0.01 * abs(math.sin(phase * 4 * math.pi)))),
            chest=t("chest", (Z, 3 * swing)),
            neck=t("neck", (Z, 4 * swing), (X, 4)),
            head=t("head", (Z, 4), (X, 3 * swing)),
            jaw=t("jaw", (X, -12)),
            tail=t("tail", (Z, -10 * swing), (X, -10)),
            tail__2=t("tail.2", (Z, -14 * swing)),
            **legs(
                FL=(-22 * swing, 50 * lift_b, -14 * lift_b),
                BR=(-20 * swing, 36 * lift_b, -8 * lift_b),
                FR=(22 * swing, 50 * lift_a, -14 * lift_a),
                BL=(20 * swing, 36 * lift_a, -8 * lift_a),
            ),
            **pup(hop=0.02 + 0.02 * bound, front=-30 * bound, back=30 * bound, wag=swing, nod=-6 * bound),
        )

    # The attack (First Strike): it crouches, springs and bites in the air,
    # then lands. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the jaws close at frame 15 of 30.
    def coil(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.05, -0.07)),
            hips=t("hips", (Z, -6), (X, 6)),
            chest=t("chest", (X, 10)),
            neck=t("neck", (X, 16)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, -10)),
            tail=t("tail", (X, 30)),
            **legs(FL=(-30, 70, -30), FR=(-24, 64, -30), BL=(-40, 70, -20), BR=(-36, 66, -20)),
            **pup(hop=0.0, front=-20, back=20, nod=-10, wag=1.0),
        )

    def leap(base, jaw=-48):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.2, 0.08)),
            hips=t("hips", (Z, -4), (X, -8)),
            chest=t("chest", (X, -6)),
            neck=t("neck", (X, -6)),
            head=t("head", (X, 0)),
            jaw=t("jaw", (X, jaw)),
            tail=t("tail", (X, -14)),
            tail__2=t("tail.2", (X, -10)),
            **legs(FL=(-70, 20, 10), FR=(-60, 30, 10), BL=(50, -10, 30), BR=(56, -16, 34)),
            **pup(hop=0.06, front=-40, back=40, nod=-10, wag=-1.0),
        )

    def land(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.16, -0.05)),
            hips=t("hips", (Z, -6), (X, 4)),
            chest=t("chest", (X, 12)),
            neck=t("neck", (X, 18)),
            head=t("head", (X, -16), (Y, -12)),
            jaw=t("jaw", (X, -4)),
            tail=t("tail", (X, 20)),
            **legs(FL=(-24, 40, -20), FR=(-14, 30, -20), BL=(10, 30, -10), BR=(16, 24, -10)),
            **pup(hop=0.0, front=20, back=-20, wag=1.0),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, wag in ((0, 0, 0, 0), (6, 0.25, 0.5, 1), (12, 0.5, 1, -1), (18, 0.75, 0.5, 1), (24, 1, 0, -1), (30, 0.75, -0.5, 1), (36, 0.5, -1, -1), (42, 0.25, -0.5, 1), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, wag))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, gasp(breath))
    clips.append(low_hp)

    walk = Clip("walk", 24, loop=True)
    for frame in (0, 3, 6, 9, 12, 15, 18, 21, 24):
        walk.key(frame, stride(frame / 24))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(8, coil(stand())).key(12, leap(stand())).key(15, leap(stand(), -6))
    attack.key(19, land(stand())).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, buckle(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(10, pose(low(stand()), hips_at_loc=at("hips", (0, 0, -0.105))))
    summon.key(17, howl(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "winter-maw.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
