"""
Cave Bear (`feral.caveBear`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a huge shaggy brown cave bear
with a big hump over the shoulders, a round head with small round ears, a
tan muzzle and a black nose, big paws with long claws, patches of moss on
its back and old pink scars on its flank (Regenerate). A dripping
honeycomb, the bait that called it, is in its mouth. It still has not opened
both eyes: the right eye is shut and the left eye is half open. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/cave-bear.glb`; then
`bun unit-model:pack cave-bear` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). The Battle
camera sees the right side of a player Unit, so the scars and the fresh cut
are on the right shoulder. The cut has a bone that scales: it closes in the
cast clip (Regenerate). It is Heavy, so its walk is a slow amble, and its
attack swipes the right fore paw up and down. In the death clip it falls on
its left side (`(Y, +84)` on the root), so the legs turn to the camera side
(-X).
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

FUR = hex_color("#7c4f2c")
FUR_DARK = hex_color("#4f3119")
FUR_LIGHT = hex_color("#a9764a")
MUZZLE = hex_color("#c79e6e")
NOSE = hex_color("#1e1612")
EYE = hex_color("#3a2414")
LID = hex_color("#5a3a20")
MOUTH = hex_color("#a0444c")
TOOTH = hex_color("#efe4cc")
CLAW = hex_color("#3a3028")
CLAW_TIP = hex_color("#cfc2a8")
MOSS = hex_color("#7d8d38")
MOSS_DARK = hex_color("#566426")
SCAR = hex_color("#c98a84")
WOUND = hex_color("#b8323a")
WOUND_DARK = hex_color("#6e1c20")
HONEY = hex_color("#e9a52a")
HONEY_DARK = hex_color("#b67412")
HONEY_DRIP = hex_color("#f2bd4a")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.24, 0.44))
MID = Vector((0, 0.06, 0.48))
CHEST = Vector((0, -0.12, 0.5))
NECK = Vector((0, -0.26, 0.47))
HEAD_C = Vector((0, -0.36, 0.44))
SNOUT = Vector((0, -0.5, 0.39))
JAW_A = Vector((0, -0.38, 0.37))
JAW_B = Vector((0, -0.48, 0.33))
# The head is big, so it reads on the Board: the parts are made at a small
# size and then scaled about the top of the neck.
HEAD_SCALE = 1.3
# The head parts are made low, then lifted to sit up in front of the hump.
HEAD_LIFT = Vector((0, -0.01, 0.05))

# The fresh cut on the right shoulder (the camera side), that closes in the cast.
CUT = Vector((-0.19, -0.08, 0.53))


def grown(point):
    return NECK + (Vector(point) + HEAD_LIFT - NECK) * HEAD_SCALE


LEGS = {
    # name: (top, joint, ankle, toe, parent)
    "FL": (Vector((0.12, -0.14, 0.42)), Vector((0.12, -0.15, 0.23)), Vector((0.12, -0.15, 0.07)), Vector((0.12, -0.24, 0.03)), "chest"),
    "FR": (Vector((-0.12, -0.14, 0.42)), Vector((-0.12, -0.15, 0.23)), Vector((-0.12, -0.15, 0.07)), Vector((-0.12, -0.24, 0.03)), "chest"),
    "BL": (Vector((0.11, 0.25, 0.4)), Vector((0.11, 0.21, 0.22)), Vector((0.11, 0.27, 0.07)), Vector((0.11, 0.17, 0.03)), "hips"),
    "BR": (Vector((-0.11, 0.25, 0.4)), Vector((-0.11, 0.21, 0.22)), Vector((-0.11, 0.27, 0.07)), Vector((-0.11, 0.17, 0.03)), "hips"),
}

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("head", tuple(NECK), tuple(grown(SNOUT)), "chest"),
    ("jaw", tuple(grown(JAW_A)), tuple(grown(JAW_B)), "head"),
    ("ear.L", tuple(grown((0.08, -0.32, 0.52))), tuple(grown((0.1, -0.31, 0.57))), "head"),
    ("ear.R", tuple(grown((-0.08, -0.32, 0.52))), tuple(grown((-0.1, -0.31, 0.57))), "head"),
    ("cut", tuple(CUT), tuple(CUT + Vector((-0.04, 0, 0))), "chest"),
]
for leg, (top, joint, ankle, toe, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(top), tuple(joint), parent),
        (f"lower.{leg}", tuple(joint), tuple(ankle), f"upper.{leg}"),
        (f"foot.{leg}", tuple(ankle), tuple(toe), f"lower.{leg}"),
    ]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front, the head in front of it."""
    if co.y > 0.14:
        return blend("spine", "hips", co.y, 0.1, 0.2)
    if co.y > -0.06:
        return blend("chest", "spine", co.y, -0.06, 0.06)
    return blend("chest", "head", co.y, -0.24, -0.31)


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.06)) / 0.08)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def head_color(face, center):
    """The head: brown fur, lighter on the brow and the crown."""
    if face.normal.z > 0.82:
        return FUR_LIGHT
    return FUR


def shaggy(face, center):
    """Shaggy brown fur in patches: darker underneath and lighter on the hump."""
    if face.normal.z < -0.35:
        return FUR_DARK
    tone = (int(center.x * 61) * 7 + int(center.y * 57) * 11 + int(center.z * 53) * 5) % 6
    if tone == 0:
        return FUR_DARK
    if tone == 1 and face.normal.z > 0.3:
        return FUR_LIGHT
    return FUR


def locks(part, center, radii, count, length, seed=0, only=None, colors=(FUR, FUR_LIGHT, FUR_DARK)):
    """Shaggy locks of fur that hang down from an ellipsoid."""
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
        out = (direction * 0.3 + down.normalized()).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.45, 0.004, 4)
        part.paint(faces_of(verts), colors[1] if direction.z > 0.6 and index % 2 else (colors[0] if index % 3 else colors[2]))


def moss(part, center, radii, count, seed=0, only=None):
    """Flat patches of moss on an ellipsoid."""
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
        base = center + Vector((direction.x * radii[0], direction.y * radii[1], direction.z * radii[2])) * 1.0
        size = 0.03 + 0.012 * ((index * 3) % 4)
        verts = kit.sphere(part.bm, base, (size, size, size * 0.35), 6, 4)
        frame = normal.to_track_quat("Z", "Y").to_matrix().to_4x4()
        kit.bmesh.ops.transform(part.bm, matrix=kit.Matrix.Translation(base) @ frame @ kit.Matrix.Translation(-base), verts=verts)
        part.paint(faces_of(verts), MOSS if index % 3 else MOSS_DARK)


def body_parts():
    parts = []
    body = Part("body", shaggy, body_weights, shade=0.22)
    # Big shoulders with a hump, a deep barrel and a round rump.
    kit.sphere(body.bm, (0, -0.1, 0.49), (0.2, 0.2, 0.2), 14, 10)
    kit.sphere(body.bm, (0, -0.05, 0.6), (0.15, 0.15, 0.1), 12, 8)
    kit.sphere(body.bm, (0, 0.08, 0.46), (0.19, 0.2, 0.17), 12, 8)
    kit.sphere(body.bm, (0, 0.24, 0.44), (0.17, 0.14, 0.16), 12, 8)
    kit.sphere(body.bm, (0, -0.24, 0.45), (0.14, 0.1, 0.14), 10, 8)
    # A small stub of a tail.
    kit.sphere(body.bm, (0, 0.38, 0.46), (0.03, 0.03, 0.03), 6, 4)
    # Old healed scars on the right flank: pink lines.
    for offset, length in ((0.0, 0.07), (0.035, 0.09), (0.07, 0.06)):
        center = Vector((-0.195, 0.02 + offset, 0.5 - offset * 0.3))
        scar = kit.slab(body.bm, center, Vector((0, 0.008, 0.008)), Vector((0, 0.3, -0.95)).normalized() * length * 0.5, Vector((-0.012, 0, 0)))
        body.paint(faces_of(scar), SCAR)
    parts.append(body)

    fur = Part("fur", FUR, body_weights, shade=0.12)
    # A shaggy ruff on the hump and the neck, and long fur on the flanks and the belly.
    locks(fur, (0, -0.12, 0.54), (0.18, 0.16, 0.17), 34, 0.08, 0, lambda d: d.z > -0.2 and d.y < 0.4 and not (d.x < -0.6 and d.z < 0.5), (FUR, FUR_LIGHT, FUR_DARK))
    locks(fur, (0, 0.08, 0.45), (0.19, 0.24, 0.16), 44, 0.08, 3, lambda d: -0.7 < d.z < 0.3 and not (d.x < -0.7 and d.y < -0.3), (FUR_DARK, FUR, FUR_DARK))
    parts.append(fur)

    mossy = Part("moss", MOSS, body_weights, shade=0.1)
    moss(mossy, (0, -0.06, 0.58), (0.15, 0.15, 0.11), 22, 0, lambda d: d.z > 0.45)
    moss(mossy, (0, 0.2, 0.44), (0.17, 0.14, 0.16), 14, 2, lambda d: d.z > 0.6)
    parts.append(mossy)

    # The fresh cut (Regenerate): a red gash with dark edges over the scars.
    cut = Part("cut", WOUND, "cut", smooth=False, shade=0.05)
    along = Vector((0, 0.45, -0.9)).normalized()
    for offset, width in ((0.0, 0.012), (0.014, 0.006), (-0.014, 0.006)):
        center = CUT + Vector((0, offset, 0))
        kit.slab(cut.bm, center, along * 0.06, Vector((0, 1, 0)) * width, Vector((-1, 0, 0)) * 0.012)
    cut.color = lambda face, center: WOUND if abs(center.y - CUT.y) < 0.008 else WOUND_DARK
    parts.append(cut)
    return parts


def head_parts():
    parts = []
    head = Part("head", head_color, "head", shade=0.14)
    # A big round head and a short, broad muzzle.
    kit.sphere(head.bm, HEAD_C, (0.11, 0.1, 0.1), 14, 10)
    locks(head, HEAD_C + Vector((0, 0.03, -0.01)), (0.1, 0.08, 0.09), 26, 0.05, 2, lambda d: abs(d.x) > 0.5 and d.z < 0.4)
    muzzle = kit.sphere(head.bm, Vector((0, -0.45, 0.4)), (0.065, 0.075, 0.055), 10, 7)
    head.paint(faces_of(muzzle), MUZZLE)
    nose = kit.sphere(head.bm, Vector((0, -0.515, 0.42)), (0.03, 0.02, 0.02), 8, 5)
    head.paint(faces_of(nose), NOSE)
    # The eyes. The right eye (the camera side) is shut: a dark curve. The
    # left eye is half open under a heavy lid.
    shut = kit.slab(head.bm, Vector((-0.072, -0.43, 0.47)), Vector((-0.004, -0.02, 0.0)), Vector((0, 0, 0.004)), Vector((-0.006, 0, 0)))
    head.paint(faces_of(shut), EYE)
    lid = kit.sphere(head.bm, Vector((-0.07, -0.425, 0.478)), (0.022, 0.016, 0.01), 6, 4)
    head.paint(faces_of(lid), LID)
    eye = kit.sphere(head.bm, Vector((0.07, -0.43, 0.468)), (0.016, 0.012, 0.012), 6, 4)
    head.paint(faces_of(eye), EYE)
    lid = kit.sphere(head.bm, Vector((0.07, -0.428, 0.478)), (0.022, 0.016, 0.011), 6, 4)
    head.paint(faces_of(lid), LID)
    # Upper teeth under the lip.
    for sign in (1, -1):
        tooth = kit.cone(head.bm, Vector((0.035 * sign, -0.48, 0.37)), Vector((0.035 * sign, -0.482, 0.345)), 0.008, 0.002, 4)
        head.paint(faces_of(tooth), TOOTH)
    parts.append(head)

    # The honeycomb in the mouth: a slab of comb with cells on its face and
    # drips of honey.
    # It sticks out of the right side of the mouth, its face to the camera.
    honey = Part("honey", HONEY, "head", smooth=False, shade=0.08)
    comb_c = Vector((-0.055, -0.47, 0.355))
    comb_x = Vector((-0.05, -0.025, 0.0))
    comb_z = Vector((0, 0, 0.032))
    comb_y = comb_z.cross(comb_x).normalized() * -0.016
    verts = kit.slab(honey.bm, comb_c, comb_x, comb_y, comb_z)
    face_dir = -comb_y.normalized()
    for face in faces_of(verts):
        if abs(face.normal.dot(face_dir)) < 0.5:
            honey.paint([face], HONEY_DARK)
    for row in range(2):
        for column in range(3):
            cell = comb_c + comb_x * (-0.45 + column * 0.45 + 0.2 * row) + comb_z * (-0.45 + row * 0.9) + face_dir * 0.016
            hexagon = kit.cone(honey.bm, cell + face_dir * 0.003, cell - face_dir * 0.003, 0.011, 0.009, 6)
            honey.paint(faces_of(hexagon), HONEY_DARK)
    for along, length in ((-0.7, 0.05), (0.1, 0.03), (0.6, 0.04)):
        top = comb_c + comb_x * along - comb_z * 0.9
        drip = kit.tube(honey.bm, [top, top + Vector((0, 0, -length * 0.7)), top + Vector((0, 0, -length))], [0.007, 0.005, 0.008], 5)
        honey.paint(faces_of(drip), HONEY_DRIP)
    parts.append(honey)

    jaw = Part("jaw", MUZZLE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, Vector((0, -0.44, 0.345)), (0.055, 0.065, 0.025), 8, 5)
    mouth = kit.sphere(jaw.bm, Vector((0, -0.44, 0.36)), (0.045, 0.055, 0.01), 8, 3)
    jaw.paint(faces_of(mouth), MOUTH)
    parts.append(jaw)

    for side_name, sign in (("L", 1), ("R", -1)):
        ear = Part(f"ear.{side_name}", FUR, f"ear.{side_name}", shade=0.12)
        kit.sphere(ear.bm, Vector((0.088 * sign, -0.32, 0.535)), (0.032, 0.016, 0.03), 8, 5)
        inner = kit.sphere(ear.bm, Vector((0.088 * sign, -0.334, 0.535)), (0.02, 0.006, 0.019), 6, 4)
        ear.paint(faces_of(inner), FUR_DARK)
        parts.append(ear)
    grow = kit.Matrix.Translation(NECK) @ kit.Matrix.Scale(HEAD_SCALE, 4) @ kit.Matrix.Translation(HEAD_LIFT - NECK)
    for part in parts:
        kit.bmesh.ops.transform(part.bm, matrix=grow, verts=list(part.bm.verts))
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", shaggy, leg_weights(leg), shade=0.15)
        kit.cone(upper.bm, top + Vector((0, 0, 0.06)), joint, 0.1, 0.075, 9)
        locks(upper, top.lerp(joint, 0.45), (0.09, 0.09, 0.08), 12, 0.07, 1, lambda d: d.z < 0.4, (FUR_DARK, FUR, FUR_DARK))
        parts.append(upper)

        lower = Part(f"lower.{leg}", FUR_DARK, f"lower.{leg}", shade=0.15)
        kit.sphere(lower.bm, joint, (0.075, 0.075, 0.075), 8, 5)
        kit.cone(lower.bm, joint, ankle, 0.072, 0.065, 9)
        parts.append(lower)

        # A big flat paw with five long claws.
        foot = Part(f"foot.{leg}", FUR_DARK, f"foot.{leg}", shade=0.1)
        ahead = toe - ankle
        ahead.z = 0
        ahead.normalize()
        pad = Vector((ankle.x, ankle.y, 0.035)) + ahead * 0.04
        kit.sphere(foot.bm, pad, (0.07, 0.085, 0.04), 10, 6)
        for spread in (-2, -1, 0, 1, 2):
            knuckle = pad + ahead * 0.07 + Vector((0.024 * spread, 0, -0.005 - 0.003 * abs(spread)))
            claw = kit.cone(foot.bm, knuckle, knuckle + ahead * 0.045 + Vector((0.004 * spread, 0, -0.02)), 0.01, 0.002, 4)
            for face in faces_of(claw):
                foot.paint([face], CLAW_TIP if face.calc_center_median().z < 0.018 else CLAW)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CaveBear", BONES)
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CaveBearMesh")
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

    def ears(flick=0.0):
        return {
            "ear.L": t("ear.L", (Z, 20 * flick)),
            "ear.R": t("ear.R", (Z, -20 * flick)),
        }

    def stand(breath=0.0, sway=0.0, nod=0.0):
        """The idle stance: turned a little to the camera, sleepy; the head nods off and comes back up."""
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.005)),
            "hips": t("hips", (Z, -10)),
            "spine": t("spine", (X, -breath * 1.5)),
            "chest": t("chest", (X, breath * 1.5), (Z, sway * 2)),
            "head": t("head", (Z, -8 + sway * 4), (X, 2 + nod * 14), (Y, sway * 4 - nod * 6)),
            "jaw": t("jaw", (X, 6 + breath * 3)),
            **ears(0.2 * sway),
        }

    def slump(breath=0.0):
        """Low HP: the belly sinks, the head hangs low and the mouth sags."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.015 - breath * 0.005)),
            spine=t("spine", (X, 3)),
            chest=t("chest", (X, 3 + breath * 2)),
            head=t("head", (X, 16 + breath * 3), (Y, -8)),
            jaw=t("jaw", (X, 14 + breath * 4)),
            **ears(-0.5),
            **legs(FL=(-6, 30, -24), FR=(4, 24, -28), BL=(-10, 18, -8), BR=(-10, 18, -8)),
        )

    def recoil(base, amount=1.0):
        """The hit throws the head up and the body back: a grunt."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, 0.0)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (X, -16 * amount), (Z, 10 * amount)),
            jaw=t("jaw", (X, 6 + 14 * amount)),
            **ears(amount),
        )

    def buckle(base):
        """The front legs give way first."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.005)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 18)),
            **ears(0.5),
            **legs(FL=(-20, 50, -30), FR=(-10, 44, -30), BL=(-24, 36, -10), BR=(-20, 36, -10)),
        )

    def fallen(base, bounce=0.0):
        """
        On its left side, the legs out. The Battle camera sees the right side
        of a player Unit (-X), so it sees the legs and the belly.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.4, 0, 0.24)),
            chest=t("chest", (X, 4)),
            head=t("head", (X, 8), (Y, 10)),
            jaw=t("jaw", (X, 16)),
            **ears(-0.4),
            **legs(FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)),
        )

    def low(base):
        """Curled down low, asleep, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.1)),
            chest=t("chest", (X, 6)),
            head=t("head", (X, 22), (Y, -10)),
            jaw=t("jaw", (X, 0)),
            **ears(-0.4),
            **legs(FL=(-50, 100, -50), FR=(-50, 100, -50), BL=(-60, 90, -30), BR=(-60, 90, -30)),
        )

    def yawn(base, amount=1.0):
        """Up on its front, the head back and the mouth wide: a big yawn, the end of a summon."""
        return pose(
            base,
            hips=t("hips", (Z, -10), (X, -6 * amount)),
            chest=t("chest", (X, -6 * amount)),
            head=t("head", (Z, -6), (X, -26 * amount)),
            jaw=t("jaw", (X, 6 + 30 * amount)),
            **ears(-0.4 * amount),
            **legs(FL=(-10 * amount, 16 * amount, -6), FR=(-6 * amount, 10 * amount, -6)),
        )

    def stride(phase):
        """
        The amble (Heavy): the two legs on one side move nearly together, so
        the big body rolls from side to side. `phase` 0 to 1 is one cycle.
        """
        wave = math.sin(phase * 2 * math.pi)
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.01 * abs(math.sin(phase * 2 * math.pi)) - 0.005)),
            hips=t("hips", (Z, -10), (Y, 3 * wave)),
            chest=t("chest", (Y, -4 * wave), (Z, 3 * wave)),
            head=t("head", (Z, -8 - 6 * wave), (X, 6)),
        )
        for leg, offset in (("FL", 0.0), ("BL", 0.1), ("FR", 0.5), ("BR", 0.6)):
            local = (phase - offset) % 1.0
            if local < 0.42:
                u = local / 0.42
                swing = lerp(20, -20, u)
                lift = math.sin(u * math.pi)
            else:
                u = (local - 0.42) / 0.58
                swing = lerp(-20, 20, u)
                lift = 0.0
            back = leg.startswith("B")
            bend = (-30 if back else 50) * lift
            result = pose(result, **legs(**{leg: (swing - 10 * lift, bend, 10 * lift - swing - bend * 0.8)}))
        return result

    # The attack: it rears its front up with the right fore paw high, then
    # swipes the paw down. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the paw comes down at frame 15 of 30.
    def rear(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.05, 0.0)),
            hips=t("hips", (Z, -14), (X, -10)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -6), (Z, -6)),
            head=t("head", (Z, -4), (X, -8)),
            jaw=t("jaw", (X, 12)),
            **ears(-0.6),
            **{
                **legs(FL=(-6, 20, -10), FR=(-110, 40, 20), BL=(10, -10, 6), BR=(10, -10, 6)),
                # The raised paw goes out to the camera side, so it does not hide the head.
                "upper__FR": t("upper.FR", (X, -110), (Y, -28)),
            },
        )

    def swipe(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.12 - 0.02 * follow, 0.0)),
            hips=t("hips", (Z, -6), (X, 2)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, 8), (Z, 8)),
            head=t("head", (Z, -6), (X, 8)),
            jaw=t("jaw", (X, 14)),
            **ears(-0.6),
            **legs(FL=(-14, 44, -30), FR=(-40 + 14 * follow, 10, -4), BL=(20, -6, 0), BR=(24, -6, 0)),
        )

    # The cast (Regenerate): it turns its head to the cut on its right
    # shoulder and licks it; the cut closes; then it shakes its fur.
    def lick(base, amount=1.0):
        return pose(
            base,
            chest=t("chest", (Z, -12 * amount), (X, 4 * amount)),
            head=t("head", (Z, -50 * amount), (X, 12 * amount), (Y, 14 * amount)),
            jaw=t("jaw", (X, 6 + 10 * amount)),
            **ears(0.4 * amount),
            **legs(FR=(-10 * amount, 16 * amount, -6)),
        )

    def shake(base, side=1.0):
        return pose(
            base,
            hips=t("hips", (Z, -10), (Y, -3 * side)),
            spine=t("spine", (Y, 5 * side)),
            chest=t("chest", (Y, 7 * side)),
            head=t("head", (Z, -8), (Y, 16 * side), (X, -4)),
            jaw=t("jaw", (X, 4)),
            **ears(side),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, nod in ((0, 0, 0, 0), (12, 0.5, 1, 0.3), (20, 0.8, 0.4, 1), (24, 1, 0, 0), (36, 0.5, -1, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, nod))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, slump(breath))
    clips.append(low_hp)

    walk = Clip("walk", 28, loop=True)
    for frame in range(0, 29, 2):
        walk.key(frame, stride(frame / 28))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, rear(stand())).key(12, rear(stand()))
    attack.key(15, swipe(stand())).key(19, swipe(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 30)
    cast.key(0, stand()).key(7, lick(stand()))
    cast.key(12, pose(lick(stand(), 0.85), cut_at_scale=0.6)).key(17, pose(lick(stand()), cut_at_scale=0.05))
    cast.key(21, pose(shake(stand(), 1), cut_at_scale=0.05)).key(24, pose(shake(stand(), -1), cut_at_scale=0.05))
    cast.key(27, pose(stand(), cut_at_scale=0.4)).key(30, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, buckle(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, low(stand())).key(15, yawn(stand())).key(19, yawn(stand(), 0.8))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "cave-bear.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
