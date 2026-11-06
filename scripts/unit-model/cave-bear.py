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

import body_plans  # noqa: E402
import clips  # noqa: E402
import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from clips.base import Beat  # noqa: E402
from clips.overrides import Fall, Patch  # noqa: E402

plan = body_plans.BODY_PLANS["quadruped"]

from unit_model_kit import X, Y, Z, Part, blend, clamp01, faces_of, hex_color, lerp  # noqa: E402

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


TABLE = plan.Proportions(
    hip_y=HIP.y,
    hip_z=HIP.z,
    mid_y=MID.y,
    mid_z=MID.z,
    chest_y=CHEST.y,
    chest_z=CHEST.z,
    neck_y=NECK.y,
    neck_z=NECK.z,
    necks=(),
    head_tip_y=(grown(SNOUT)).y,
    head_tip_z=(grown(SNOUT)).z,
    front_top_x=0.12,
    front_top_y=-0.14,
    front_top_z=0.42,
    front_knee_x=0.12,
    front_knee_y=-0.15,
    front_knee_z=0.23,
    front_ankle_x=0.12,
    front_ankle_y=-0.15,
    front_ankle_z=0.07,
    front_toe_x=0.12,
    front_toe_y=-0.24,
    front_toe_z=0.03,
    back_top_x=0.11,
    back_top_y=0.25,
    back_top_z=0.4,
    back_knee_x=0.11,
    back_knee_y=0.21,
    back_knee_z=0.22,
    back_ankle_x=0.11,
    back_ankle_y=0.27,
    back_ankle_z=0.07,
    back_toe_x=0.11,
    back_toe_y=0.17,
    back_toe_z=0.03,
)

LEGS = {
    leg: (*map(Vector, plan.leg_points(TABLE, leg)), plan.leg_parent(leg))
    for leg in plan.LEGS
}

TRUNK_BONES = [
    ('jaw', tuple(grown(JAW_A)), tuple(grown(JAW_B)), 'head'),
    ('ear.L', tuple(grown((0.08, -0.32, 0.52))), tuple(grown((0.1, -0.31, 0.57))), 'head'),
    ('ear.R', tuple(grown((-0.08, -0.32, 0.52))), tuple(grown((-0.1, -0.31, 0.57))), 'head'),
    ('cut', tuple(CUT), tuple(CUT + Vector((-0.04, 0, 0))), 'chest'),
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
    rig, _ = plan.build_rig("CaveBear", TABLE, TRUNK_BONES, foot="foot")
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "CaveBearMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


PATCHES = (
    Patch(
        "idle",
        "head-nod",
        beats=(
            Beat(0, "stance", (0, 0, 0)),
            Beat(12, "stance", (0.5, 1, 0.3)),
            Beat(20, "stance", (0.8, 0.4, 1)),
            Beat(24, "stance", (1, 0, 0)),
            Beat(36, "stance", (0.5, -1, 0)),
            Beat(48, "stance", (0, 0, 0)),
        ),
    ),
    Patch("walk", "heavy-walk", beats=clips.quadruped.walk_beats(28), frames=28),
    Patch(
        "attack",
        "claw-swipe",
        beats=(
            Beat(0),
            Beat(9, "paw"),
            Beat(12, "paw"),
            Beat(15, "toss"),
            Beat(19, "toss", (1,)),
            Beat(26),
            Beat(30),
        ),
    ),
    Patch(
        "cast",
        "wound-lick",
        beats=(
            Beat(0),
            Beat(7, "lick"),
            Beat(12, "licking"),
            Beat(17, "closing"),
            Beat(21, "shake_right"),
            Beat(24, "shake_left"),
            Beat(27, "healed"),
            Beat(30),
        ),
    ),
    Patch("death", "fall-left"),
    Patch(
        "summon",
        "rise-and-roar",
        beats=(
            Beat(0, "low"),
            Beat(8, "low"),
            Beat(15, "snort"),
            Beat(19, "snort", (0.8,)),
            Beat(24),
        ),
    ),
)


class Poses(clips.quadruped.Poses):
    foot = "foot"
    fall = Fall(Y, 84, (-0.4, 0, 0.24))

    def ears(self, flick=0.0):
        return {
            "ear.L": self.t("ear.L", (Z, 20 * flick)),
            "ear.R": self.t("ear.R", (Z, -20 * flick)),
        }

    def stance(self, breath=0.0, sway=0.0, nod=0.0):
        """The idle stance: turned a little to the camera, sleepy; the head nods off and comes back up."""
        return {
            **super().stance(breath, sway),
            "hips@loc": self.at("hips", (0, 0, -breath * 0.005)),
            "hips": self.t("hips", (Z, -10)),
            "head": self.t(
                "head", (Z, -8 + sway * 4), (X, 2 + nod * 14), (Y, sway * 4 - nod * 6)
            ),
            "jaw": self.t("jaw", (X, 6 + breath * 3)),
            **self.ears(0.2 * sway),
        }

    def gasp(self, base, breath=0.0):
        """Low HP: the belly sinks, the head hangs low and the mouth sags."""
        return self.pose(
            super().gasp(base, breath),
            hips_at_loc=self.at("hips", (0, 0, -0.015 - breath * 0.005)),
            chest=self.t("chest", (X, 3 + breath * 2)),
            head=self.t("head", (X, 16 + breath * 3), (Y, -8)),
            jaw=self.t("jaw", (X, 14 + breath * 4)),
            **self.ears(-0.5),
            **self.legs(
                FL=(-6, 30, -24), FR=(4, 24, -28), BL=(-10, 18, -8), BR=(-10, 18, -8)
            ),
        )

    def recoil(self, base, amount=1.0):
        """The hit throws the head up and the body back: a grunt."""
        return self.pose(
            super().recoil(base, amount),
            jaw=self.t("jaw", (X, 6 + 14 * amount)),
            **self.ears(amount),
        )

    def buckle(self, base):
        """The front legs give way first."""
        return self.pose(
            super().buckle(base),
            jaw=self.t("jaw", (X, 18)),
            **self.ears(0.5),
            **self.legs(
                FL=(-20, 50, -30),
                FR=(-10, 44, -30),
                BL=(-24, 36, -10),
                BR=(-20, 36, -10),
            ),
        )

    def fallen(self, base, bounce=0.0):
        """
        On its left side, the legs out. The Battle camera sees the right side
        of a player Unit (-X), so it sees the legs and the belly.
        """
        return self.pose(
            super().fallen(base, bounce),
            jaw=self.t("jaw", (X, 16)),
            **self.ears(-0.4),
            **self.legs(
                FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)
            ),
        )

    def low(self, base):
        """Curled down low, asleep, as a summon starts."""
        return self.pose(
            super().low(base),
            hips_at_loc=self.at("hips", (0, 0, -0.1)),
            head=self.t("head", (X, 22), (Y, -10)),
            jaw=self.t("jaw", (X, 0)),
            **self.ears(-0.4),
            **self.legs(
                FL=(-50, 100, -50),
                FR=(-50, 100, -50),
                BL=(-60, 90, -30),
                BR=(-60, 90, -30),
            ),
        )

    def snort(self, base, amount=1.0):
        """Up on its front, the head back and the mouth wide: a big yawn, the end of a summon."""
        return self.pose(
            self.unchanged(
                super().snort(base, amount), base, "hips@loc",
                "upper.BL", "lower.BL", "foot.BL",
                "upper.BR", "lower.BR", "foot.BR",
            ),
            hips=self.t("hips", (Z, -10), (X, -6 * amount)),
            chest=self.t("chest", (X, -6 * amount)),
            head=self.t("head", (Z, -6), (X, -26 * amount)),
            jaw=self.t("jaw", (X, 6 + 30 * amount)),
            **self.ears(-0.4 * amount),
            **self.legs(
                FL=(-10 * amount, 16 * amount, -6), FR=(-6 * amount, 10 * amount, -6)
            ),
        )

    def stride(self, base, phase):
        """
        The amble (Heavy): the two legs on one side move nearly together, so
        the big body rolls from side to side. `phase` 0 to 1 is one cycle.
        """
        wave = math.sin(phase * 2 * math.pi)
        result = self.pose(
            base,
            hips_at_loc=self.at(
                "hips", (0, 0, 0.01 * abs(math.sin(phase * 2 * math.pi)) - 0.005)
            ),
            hips=self.t("hips", (Z, -10), (Y, 3 * wave)),
            chest=self.t("chest", (Y, -4 * wave), (Z, 3 * wave)),
            head=self.t("head", (Z, -8 - 6 * wave), (X, 6)),
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
            result = self.pose(
                result,
                **self.legs(
                    **{leg: (swing - 10 * lift, bend, 10 * lift - swing - bend * 0.8)}
                ),
            )
        return result

    def paw(self, base):
        return self.pose(
            super().paw(base),
            hips_at_loc=self.at("hips", (0, 0.05, 0.0)),
            hips=self.t("hips", (Z, -14), (X, -10)),
            spine=self.t("spine", (X, -6)),
            chest=self.t("chest", (X, -6), (Z, -6)),
            head=self.t("head", (Z, -4), (X, -8)),
            jaw=self.t("jaw", (X, 12)),
            **self.ears(-0.6),
            **{
                **self.legs(
                    FL=(-6, 20, -10),
                    FR=(-110, 40, 20),
                    BL=(10, -10, 6),
                    BR=(10, -10, 6),
                ),
                "upper__FR": self.t("upper.FR", (X, -110), (Y, -28)),
            },
        )

    def toss(self, base, follow=0.0):
        return self.pose(
            super().toss(base, follow),
            hips_at_loc=self.at("hips", (0, -0.12 - 0.02 * follow, 0.0)),
            hips=self.t("hips", (Z, -6), (X, 2)),
            spine=self.t("spine", (X, 4)),
            chest=self.t("chest", (X, 8), (Z, 8)),
            head=self.t("head", (Z, -6), (X, 8)),
            jaw=self.t("jaw", (X, 14)),
            **self.ears(-0.6),
            **self.legs(
                FL=(-14, 44, -30),
                FR=(-40 + 14 * follow, 10, -4),
                BL=(20, -6, 0),
                BR=(24, -6, 0),
            ),
        )

    def lick(self, base, amount=1.0):
        return self.pose(
            base,
            chest=self.t("chest", (Z, -12 * amount), (X, 4 * amount)),
            head=self.t("head", (Z, -50 * amount), (X, 12 * amount), (Y, 14 * amount)),
            jaw=self.t("jaw", (X, 6 + 10 * amount)),
            **self.ears(0.4 * amount),
            **self.legs(FR=(-10 * amount, 16 * amount, -6)),
        )

    def shake(self, base, side=1.0):
        return self.pose(
            base,
            hips=self.t("hips", (Z, -10), (Y, -3 * side)),
            spine=self.t("spine", (Y, 5 * side)),
            chest=self.t("chest", (Y, 7 * side)),
            head=self.t("head", (Z, -8), (Y, 16 * side), (X, -4)),
            jaw=self.t("jaw", (X, 4)),
            **self.ears(side),
        )

    def licking(self, base):
        return self.pose(self.lick(base, 0.85), cut_at_scale=0.6)

    def closing(self, base):
        return self.pose(self.lick(base), cut_at_scale=0.05)

    def shake_right(self, base):
        return self.pose(self.shake(base, 1), cut_at_scale=0.05)

    def shake_left(self, base):
        return self.pose(self.shake(base, -1), cut_at_scale=0.05)

    def healed(self, base):
        return self.pose(base, cut_at_scale=0.4)


def build_clips(rig):
    return clips.overrides.build(
        clips.quadruped.CLIPS,
        Poses(*kit.pose_tools(rig)),
        PATCHES,
        without=("rebirth",),
    )


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
