"""
Frostfang Lynx (`feral.frostfangLynx`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a white mountain lynx with grey
spots, long legs and big paws, a short bobtail with a black tip, tall ears
with long black tufts, a ruff of fur round its face, ice-blue eyes, ice-blue
fangs and long ice-blue claws. A lump of snow sits on its head after a jump
through a snowbank. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/frostfang-lynx.glb`; then
`bun unit-model:pack frostfang-lynx` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). It does
Frost damage, so its breath is a cloud of frost: the `breath` bone scales the
cloud up in front of its mouth in the attack. Its attack is a long jump with
the claws out (Bleed), and the claws rake down at the impact. In the death
clip it falls on its left side (`(Y, +84)` on the root), so the legs turn to
the camera side (-X). It has no Keyword that it uses by its own action, so it
has no cast clip.
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

FUR = hex_color("#d9d4cb")
FUR_LIGHT = hex_color("#f0ece4")
FUR_GREY = hex_color("#a9a297")
FUR_BACK = hex_color("#bfb5a6")
SPOT = hex_color("#6a6056")
TUFT = hex_color("#211e1b")
EAR_INSIDE = hex_color("#c9a8a0")
EYE = hex_color("#7cc6ee")
PUPIL = hex_color("#141418")
NOSE = hex_color("#b97c7a")
MOUTH = hex_color("#8c3a46")
FANG = hex_color("#a6e2fa")
CLAW = hex_color("#8fd6f6")
SNOW = hex_color("#f6f9fc")
FROST = hex_color("#cfeaf8")
FROST_DEEP = hex_color("#9fd2f0")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.2, 0.34))
MID = Vector((0, 0.04, 0.35))
CHEST = Vector((0, -0.12, 0.37))
NECK = Vector((0, -0.2, 0.42))
HEAD_A = Vector((0, -0.25, 0.46))
HEAD_C = Vector((0, -0.29, 0.47))
SNOUT = Vector((0, -0.37, 0.44))
JAW_A = Vector((0, -0.29, 0.42))
JAW_B = Vector((0, -0.36, 0.405))
# The head is big, so it reads on the Board: the parts are made at a small
# size and then scaled about the top of the neck.
HEAD_SCALE = 1.3

# The frost cloud of the breath sits in front of the mouth.
BREATH = Vector((0, -0.43, 0.42))


def grown(point):
    return HEAD_A + (Vector(point) - HEAD_A) * HEAD_SCALE


LEGS = {
    # name: (top, joint, ankle, toe, parent)
    "FL": (Vector((0.07, -0.13, 0.32)), Vector((0.07, -0.11, 0.18)), Vector((0.07, -0.13, 0.05)), Vector((0.07, -0.19, 0.025)), "chest"),
    "FR": (Vector((-0.07, -0.13, 0.32)), Vector((-0.07, -0.11, 0.18)), Vector((-0.07, -0.13, 0.05)), Vector((-0.07, -0.19, 0.025)), "chest"),
    "BL": (Vector((0.075, 0.19, 0.32)), Vector((0.075, 0.13, 0.2)), Vector((0.075, 0.24, 0.08)), Vector((0.075, 0.18, 0.025)), "hips"),
    "BR": (Vector((-0.075, 0.19, 0.32)), Vector((-0.075, 0.13, 0.2)), Vector((-0.075, 0.24, 0.08)), Vector((-0.075, 0.18, 0.025)), "hips"),
}

TAIL = [Vector((0, 0.3, 0.38)), Vector((0, 0.37, 0.36))]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("neck", tuple(NECK), tuple(HEAD_A), "chest"),
    ("head", tuple(HEAD_A), tuple(grown(SNOUT)), "neck"),
    ("jaw", tuple(grown(JAW_A)), tuple(grown(JAW_B)), "head"),
    ("ear.L", tuple(grown((0.05, -0.27, 0.51))), tuple(grown((0.07, -0.26, 0.6))), "head"),
    ("ear.R", tuple(grown((-0.05, -0.27, 0.51))), tuple(grown((-0.07, -0.26, 0.6))), "head"),
    ("breath", tuple(grown(BREATH)), tuple(grown(BREATH + Vector((0, -0.05, 0)))), "head"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[1]), "hips"),
]
for leg, (top, joint, ankle, toe, parent) in LEGS.items():
    BONES += [
        (f"upper.{leg}", tuple(top), tuple(joint), parent),
        (f"lower.{leg}", tuple(joint), tuple(ankle), f"upper.{leg}"),
        (f"foot.{leg}", tuple(ankle), tuple(toe), f"lower.{leg}"),
    ]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front, the neck in front of it."""
    if co.y > 0.12:
        return blend("spine", "hips", co.y, 0.08, 0.18)
    if co.y > -0.06:
        return blend("chest", "spine", co.y, -0.06, 0.06)
    return blend("chest", "neck", co.y, -0.17, -0.22)


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.05)) / 0.07)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def spotted(face, center):
    """White fur with grey spots on the back and the flanks, and a pale belly."""
    if face.normal.z < -0.35:
        return FUR_LIGHT
    spot = (int(center.x * 70) * 7 + int(center.y * 64) * 11 + int(center.z * 58) * 5) % 5
    if spot == 0 and face.normal.z > -0.1:
        return SPOT
    if spot == 3:
        return FUR_GREY
    if face.normal.z > 0.45:
        return FUR_BACK
    return FUR


def locks(part, center, radii, count, length, seed=0, only=None, colors=(FUR, FUR_LIGHT, FUR_GREY), out_push=0.3):
    """Locks of fur that hang down and back from an ellipsoid."""
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
        out = (direction * out_push + down.normalized() + Y * 0.3).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.4, 0.004, 4)
        part.paint(faces_of(verts), colors[1] if direction.z > 0.55 and index % 2 else (colors[0] if index % 3 else colors[2]))


def body_parts():
    parts = []
    body = Part("body", spotted, body_weights, shade=0.2)
    # A lean body: a deep chest, a thin waist and strong haunches.
    kit.sphere(body.bm, (0, -0.1, 0.37), (0.1, 0.12, 0.11), 12, 8)
    kit.sphere(body.bm, (0, 0.05, 0.36), (0.09, 0.14, 0.085), 12, 8)
    kit.sphere(body.bm, (0, 0.2, 0.36), (0.1, 0.11, 0.1), 12, 8)
    kit.tube(body.bm, [CHEST + Vector((0, 0.0, 0.0)), NECK, HEAD_A], [0.085, 0.07, 0.065], 10)
    parts.append(body)

    fur = Part("fur", FUR, body_weights, shade=0.12)
    # A shaggy winter coat: a fringe on the belly and the chest.
    locks(fur, (0, 0.04, 0.35), (0.09, 0.2, 0.09), 30, 0.05, 3, lambda d: d.z < -0.2, (FUR, FUR_LIGHT, FUR_GREY))
    locks(fur, (0, -0.15, 0.37), (0.08, 0.08, 0.09), 16, 0.06, 1, lambda d: d.z < 0.2 and d.y < 0.2, (FUR_LIGHT, FUR, FUR_LIGHT))
    parts.append(fur)

    # A short bobtail with a black tip.
    tail = Part("tail", FUR, "tail", shade=0.12)
    kit.tube(tail.bm, [TAIL[0], TAIL[0].lerp(TAIL[1], 0.6)], [0.032, 0.03], 7)
    tip = kit.tube(tail.bm, [TAIL[0].lerp(TAIL[1], 0.6), TAIL[1]], [0.03, 0.012], 7)
    tail.paint(faces_of(tip), TUFT)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", FUR, "head", shade=0.14)
    # A round head with a short muzzle.
    kit.sphere(head.bm, HEAD_C, (0.07, 0.065, 0.06), 12, 8)
    kit.sphere(head.bm, (0, -0.345, 0.445), (0.042, 0.035, 0.028), 10, 6)
    # The ruff: long locks round the cheeks and under the jaw, as a lynx has.
    locks(head, HEAD_C + Vector((0, 0.012, -0.012)), (0.068, 0.05, 0.058), 34, 0.05, 2, lambda d: abs(d.x) > 0.45 and d.y > -0.4, (FUR_LIGHT, FUR, FUR_GREY), 0.8)
    # Dark stripes on the forehead.
    for sign in (-1, 0, 1):
        stripe = kit.slab(head.bm, HEAD_C + Vector((0.018 * sign, -0.035, 0.05)), Vector((0.004, 0, 0)), Vector((0, 0.02, 0.006)), Vector((0, 0, 0.004)))
        head.paint(faces_of(stripe), SPOT)
    for sign in (1, -1):
        eye = kit.sphere(head.bm, (0.035 * sign, -0.34, 0.48), (0.018, 0.012, 0.013), 7, 5)
        head.paint(faces_of(eye), EYE)
        pupil = kit.sphere(head.bm, (0.037 * sign, -0.35, 0.48), (0.005, 0.006, 0.011), 5, 3)
        head.paint(faces_of(pupil), PUPIL)
        rim = kit.sphere(head.bm, (0.035 * sign, -0.338, 0.493), (0.02, 0.01, 0.006), 6, 3)
        head.paint(faces_of(rim), SPOT)
        # Whisker pads.
        pad = kit.sphere(head.bm, (0.02 * sign, -0.37, 0.438), (0.02, 0.014, 0.014), 6, 4)
        head.paint(faces_of(pad), FUR_LIGHT)
        # The upper fangs, long and ice blue.
        fang = kit.cone(head.bm, (0.017 * sign, -0.375, 0.43), (0.015 * sign, -0.378, 0.395), 0.007, 0.001, 5)
        head.paint(faces_of(fang), FANG)
    nose = kit.sphere(head.bm, (0, -0.383, 0.452), (0.013, 0.008, 0.009), 6, 4)
    head.paint(faces_of(nose), NOSE)
    parts.append(head)

    # The lump of snow on the head.
    snow = Part("snow", SNOW, "head", shade=0.06)
    kit.sphere(snow.bm, HEAD_C + Vector((0.006, 0.006, 0.065)), (0.045, 0.04, 0.025), 9, 6)
    kit.sphere(snow.bm, HEAD_C + Vector((-0.018, 0.0, 0.08)), (0.025, 0.024, 0.02), 7, 5)
    kit.sphere(snow.bm, HEAD_C + Vector((0.022, 0.016, 0.075)), (0.02, 0.02, 0.016), 7, 5)
    parts.append(snow)

    jaw = Part("jaw", FUR_LIGHT, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.335, 0.41), (0.035, 0.035, 0.016), 8, 5)
    mouth = kit.sphere(jaw.bm, (0, -0.34, 0.422), (0.028, 0.028, 0.008), 8, 3)
    jaw.paint(faces_of(mouth), MOUTH)
    for sign in (1, -1):
        fang = kit.cone(jaw.bm, (0.016 * sign, -0.36, 0.418), (0.016 * sign, -0.362, 0.44), 0.006, 0.001, 5)
        jaw.paint(faces_of(fang), FANG)
    parts.append(jaw)

    for side_name, sign in (("L", 1), ("R", -1)):
        ear = Part(f"ear.{side_name}", FUR_GREY, f"ear.{side_name}", smooth=False, shade=0.12)
        base, tip = Vector((0.05 * sign, -0.27, 0.5)), Vector((0.068 * sign, -0.262, 0.585))
        verts = kit.cone(ear.bm, base, tip, 0.028, 0.004, 4, squash=0.4)
        for face in faces_of(verts):
            if face.normal.y < -0.5:
                ear.paint([face], EAR_INSIDE)
        # The long black tuft on the tip: the silhouette hook.
        tuft = kit.cone(ear.bm, tip - Vector((0, 0, 0.012)), tip + Vector((0.006 * sign, 0.006, 0.05)), 0.008, 0.001, 4)
        ear.paint(faces_of(tuft), TUFT)
        rim = kit.cone(ear.bm, base.lerp(tip, 0.55) + Vector((0, 0.004, 0)), tip + Vector((0, 0.003, -0.004)), 0.016, 0.006, 4, squash=0.4)
        ear.paint(faces_of(rim), TUFT)
        parts.append(ear)

    # The cloud of frost breath: puffs that grow out of the mouth.
    breath = Part("breath", FROST, "breath", shade=0.05)
    for index, (offset, size) in enumerate(((0.0, 0.03), (-0.035, 0.034), (-0.07, 0.028), (-0.095, 0.02))):
        center = BREATH + Vector((0.01 * (index % 2), offset, 0.006 * index))
        verts = kit.sphere(breath.bm, center, (size, size * 1.1, size * 0.9), 7, 5)
        if index % 2:
            breath.paint(faces_of(verts), FROST_DEEP)
    parts.append(breath)

    grow = kit.Matrix.Translation(HEAD_A) @ kit.Matrix.Scale(HEAD_SCALE, 4) @ kit.Matrix.Translation(-HEAD_A)
    for part in parts:
        kit.bmesh.ops.transform(part.bm, matrix=grow, verts=list(part.bm.verts))
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, toe, _parent) in LEGS.items():
        back = leg.startswith("B")
        upper = Part(f"upper.{leg}", spotted, leg_weights(leg), shade=0.15)
        kit.cone(upper.bm, top + Vector((0, 0, 0.04)), joint, 0.066 if back else 0.056, 0.04, 8)
        locks(upper, top.lerp(joint, 0.3), (0.05, 0.05, 0.05), 10, 0.045, 1, lambda d: d.z < 0.3 and abs(d.x) > 0.3, (FUR, FUR_LIGHT, FUR_GREY))
        parts.append(upper)

        lower = Part(f"lower.{leg}", FUR, f"lower.{leg}", shade=0.15)
        kit.sphere(lower.bm, joint, (0.038, 0.038, 0.038), 7, 5)
        kit.cone(lower.bm, joint, ankle, 0.036, 0.03, 8)
        parts.append(lower)

        # A big round snowshoe paw with long ice-blue claws.
        foot = Part(f"foot.{leg}", FUR, f"foot.{leg}", shade=0.1)
        kit.cone(foot.bm, ankle, toe + Vector((0, 0.02, 0.0)), 0.028, 0.032, 7)
        paw = toe + Vector((0, 0.008, 0.002))
        kit.sphere(foot.bm, paw, (0.038, 0.042, 0.024), 8, 5)
        for spread in (-1.5, -0.5, 0.5, 1.5):
            knuckle = paw + Vector((0.014 * spread, -0.03, 0.004))
            claw = kit.cone(foot.bm, knuckle, knuckle + Vector((0.004 * spread, -0.026, -0.016)), 0.006, 0.001, 4)
            foot.paint(faces_of(claw), CLAW)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("FrostfangLynx", BONES)
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "FrostfangLynxMesh")
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
        """`flick` > 0 pricks the ears up, < 0 lays them back flat."""
        return {
            "ear.L": t("ear.L", (Z, 20 * flick), (Y, -30 * min(0.0, flick))),
            "ear.R": t("ear.R", (Z, -20 * flick), (Y, 30 * min(0.0, flick))),
        }

    def frost(amount=0.0):
        return {"breath@scale": max(0.01, amount)}

    def stand(breath=0.0, sway=0.0, flick=0.0):
        """The idle stance: low at the front, ready to jump, turned a little to the camera. The tail flicks."""
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.003)),
            "hips": t("hips", (Z, -10)),
            "spine": t("spine", (X, -breath * 1.5)),
            "chest": t("chest", (X, 4 + breath * 1.5), (Z, sway * 2)),
            "neck": t("neck", (X, 2), (Z, -6 + sway * 4)),
            "head": t("head", (Z, -10 + sway * 6), (X, -4 + breath * 2), (Y, sway * 4)),
            "jaw": t("jaw", (X, 6 + breath * 4)),
            **ears(0.3 + 0.6 * flick),
            **frost(0.0),
            "tail": t("tail", (X, -20 - 30 * flick), (Z, sway * 20)),
            **legs(FL=(-4, 6, -2), FR=(4, 8, -10)),
        }

    def gasp(breath=0.0):
        """Low HP: it limps on its right fore paw, the head low, the ears back."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.01 - breath * 0.004)),
            chest=t("chest", (X, 4 + breath * 2)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 8 + breath * 3), (Z, -8)),
            jaw=t("jaw", (X, 14 + breath * 6)),
            **ears(-0.6),
            tail=t("tail", (X, 20)),
            **legs(FL=(-4, 14, -10), FR=(-30, 76, -20), BL=(-6, 12, -6), BR=(-6, 12, -6)),
        )

    def recoil(base, amount=1.0):
        """The hit throws the head back, the ears flat, with a hiss."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, 0.0)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            neck=t("neck", (X, -10 * amount)),
            head=t("head", (X, -14 * amount), (Z, 10 * amount)),
            jaw=t("jaw", (X, 6 + 26 * amount)),
            **ears(-amount),
            tail=t("tail", (X, -40 * amount)),
        )

    def buckle(base):
        """The front legs give way first."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.005)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 24)),
            **ears(-0.6),
            **legs(FL=(-20, 50, -30), FR=(-10, 44, -30), BL=(-24, 36, -10), BR=(-20, 36, -10)),
        )

    def fallen(base, bounce=0.0):
        """
        On its left side, the legs out. The Battle camera sees the right side
        of a player Unit (-X), so it sees the legs and the pale belly.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.3, 0, 0.2)),
            chest=t("chest", (X, 4)),
            neck=t("neck", (X, 6)),
            head=t("head", (X, 8), (Y, 10)),
            jaw=t("jaw", (X, 22)),
            **ears(-0.6),
            tail=t("tail", (X, 10)),
            **legs(FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)),
        )

    def low(base):
        """Down in a crouch, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.06)),
            chest=t("chest", (X, 4)),
            head=t("head", (X, -2)),
            **ears(-0.4),
            tail=t("tail", (X, 10)),
            **legs(FL=(-40, 90, -50), FR=(-40, 90, -50), BL=(-60, 90, -30), BR=(-60, 90, -30)),
        )

    def snarl(base):
        """Up on its hind legs a little, the ears pricked and a hiss of frost: the end of a summon."""
        return pose(
            base,
            hips=t("hips", (Z, -10), (X, -8)),
            chest=t("chest", (X, -6)),
            neck=t("neck", (X, -10)),
            head=t("head", (Z, -10), (X, -6)),
            jaw=t("jaw", (X, 34)),
            **ears(1.0),
            **frost(0.6),
            tail=t("tail", (X, -40)),
            **legs(FL=(-14, 20, -10), FR=(-30, 50, -20)),
        )

    def stride(phase):
        """
        The prowl: a light, quick trot in diagonal pairs, FL with BR and FR
        with BL, the head level and the shoulders rolling.
        """
        wave = math.sin(phase * 2 * math.pi)
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.012 * abs(math.sin(phase * 2 * math.pi)) - 0.006)),
            chest=t("chest", (Y, 3 * wave), (X, 4)),
            neck=t("neck", (X, 4), (Z, -4)),
            head=t("head", (Z, -6), (X, -4 + 3 * math.sin(phase * 4 * math.pi))),
            **ears(0.6),
            tail=t("tail", (X, -30), (Z, 12 * wave)),
        )
        for leg, offset in (("FL", 0.0), ("BR", 0.0), ("FR", 0.5), ("BL", 0.5)):
            local = (phase - offset) % 1.0
            if local < 0.45:
                u = local / 0.45
                swing = lerp(24, -26, u)
                lift = math.sin(u * math.pi)
            else:
                u = (local - 0.45) / 0.55
                swing = lerp(-26, 24, u)
                lift = 0.0
            back = leg.startswith("B")
            bend = (-40 if back else 60) * lift
            result = pose(result, **legs(**{leg: (swing - 10 * lift, bend, 10 * lift - swing - bend * 0.6)}))
        return result

    # The attack (Bleed): it crouches, jumps long with the claws out and a
    # cloud of frost breath, and rakes down with both fore paws. The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # claws come down at frame 15 of 30.
    def crouch(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.05, -0.05)),
            hips=t("hips", (Z, -6)),
            chest=t("chest", (X, 8)),
            head=t("head", (Z, -6), (X, 4)),
            jaw=t("jaw", (X, 14)),
            **ears(-0.8),
            tail=t("tail", (X, -10), (Z, 30)),
            **legs(FL=(-30, 78, -46), FR=(-30, 78, -46), BL=(-54, 84, -28), BR=(-54, 84, -28)),
        )

    def leap(base):
        """In the air, stretched long: the fore paws reach out with the claws, the hind legs push back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.16, 0.08)),
            hips=t("hips", (Z, -6), (X, -10)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -6)),
            neck=t("neck", (X, -4)),
            head=t("head", (Z, -6), (X, 4)),
            jaw=t("jaw", (X, 36)),
            **ears(-0.6),
            **frost(0.8),
            tail=t("tail", (X, -50)),
            **legs(FL=(-62, -6, -20), FR=(-54, -6, -20), BL=(50, -20, 30), BR=(56, -20, 30)),
        )

    def rake(base, follow=0.0):
        """The landing: the claws rake down through the enemy."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.22 - 0.02 * follow, 0.0)),
            hips=t("hips", (Z, -6), (X, -4)),
            chest=t("chest", (X, 12)),
            neck=t("neck", (X, 4)),
            head=t("head", (Z, -6), (X, 10)),
            jaw=t("jaw", (X, 30 - 16 * follow)),
            **ears(-0.6),
            **frost(1.0 - 0.6 * follow),
            tail=t("tail", (X, -30)),
            **legs(FL=(-30 + 20 * follow, 30, -10), FR=(-10 + 10 * follow, 40, -20), BL=(20, -10, 10), BR=(26, -10, 10)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, flick in ((0, 0, 0, 0), (12, 0.5, 1, 0), (18, 0.7, 0.6, 1), (22, 0.9, 0.2, 0), (24, 1, 0, 0), (36, 0.5, -1, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, flick))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, gasp(breath))
    clips.append(low_hp)

    walk = Clip("walk", 18, loop=True)
    for frame in range(0, 19, 2):
        walk.key(frame, stride(frame / 18))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(6, crouch(stand())).key(11, leap(stand()))
    attack.key(15, rake(stand())).key(20, rake(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, buckle(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, low(stand())).key(15, snarl(stand())).key(19, snarl(stand()))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "frostfang-lynx.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
