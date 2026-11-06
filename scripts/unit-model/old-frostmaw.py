"""
Old Frostmaw (`feral.oldFrostmaw`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a huge four-legged frost beast
with white-grey scales, rows of blue ice spikes down the neck and the back,
long jaws with ivory fangs, glowing ice-blue eyes, dark claws and a small
brass bell that hangs from the jaw. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/old-frostmaw.glb`;
then `bun unit-model:pack old-frostmaw` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y.
The legs are named FL, FR, BL and BR (front and back, left and right). The
bell hangs on the right side of the jaw, so the Battle camera sees it.
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

from unit_model_kit import X, Y, Z, Part, clamp01, faces_of, hex_color  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SCALE = hex_color("#dde1e3")
SCALE_DARK = hex_color("#a7b0b8")
SCALE_SHADOW = hex_color("#7a8794")
ICE = hex_color("#c4e9ff")
ICE_DEEP = hex_color("#79bfee")
EYE = hex_color("#8ff0ff")
MOUTH = hex_color("#8c3444")
TONGUE = hex_color("#c45a6a")
FANG = hex_color("#f3eee0")
CLAW = hex_color("#3e3a3a")
BELL = hex_color("#c9963f")
BELL_DARK = hex_color("#8a6326")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.27, 0.38))
MID = Vector((0, 0.07, 0.42))
CHEST = Vector((0, -0.12, 0.45))
NECK = Vector((0, -0.22, 0.48))
NECK_MID = Vector((0, -0.3, 0.56))
HEAD = Vector((0, -0.36, 0.61))
HEAD_C = Vector((0, -0.42, 0.62))
# The head is big, as the card painting has: the parts are made at a small
# size and then scaled about the base of the head.
HEAD_SCALE = 1.3


def big(point):
    return HEAD + (Vector(point) - HEAD) * HEAD_SCALE


TABLE = plan.Proportions(
    hip_y=HIP.y,
    hip_z=HIP.z,
    mid_y=MID.y,
    mid_z=MID.z,
    chest_y=CHEST.y,
    chest_z=CHEST.z,
    neck_y=NECK.y,
    neck_z=NECK.z,
    necks=((NECK_MID.y, NECK_MID.z), (HEAD.y, HEAD.z)),
    head_tip_y=(big((0, -0.62, 0.6))).y,
    head_tip_z=(big((0, -0.62, 0.6))).z,
    front_top_x=0.15,
    front_top_y=-0.1,
    front_top_z=0.38,
    front_knee_x=0.17,
    front_knee_y=-0.12,
    front_knee_z=0.2,
    front_ankle_x=0.17,
    front_ankle_y=-0.13,
    front_ankle_z=0.06,
    front_toe_x=0.17,
    front_toe_y=-0.2,
    front_toe_z=0.02,
    back_top_x=0.14,
    back_top_y=0.27,
    back_top_z=0.34,
    back_knee_x=0.15,
    back_knee_y=0.33,
    back_knee_z=0.19,
    back_ankle_x=0.15,
    back_ankle_y=0.3,
    back_ankle_z=0.06,
    back_toe_x=0.15,
    back_toe_y=0.23,
    back_toe_z=0.02,
)

LEGS = {
    leg: (*map(Vector, plan.leg_points(TABLE, leg)), plan.leg_parent(leg))
    for leg in plan.LEGS
}

TAIL = [Vector((0, 0.4, 0.38)), Vector((0, 0.52, 0.3)), Vector((-0.06, 0.62, 0.14))]

TRUNK_BONES = [
    ('jaw', tuple(big((0, -0.41, 0.575))), tuple(big((0, -0.6, 0.53))), 'head'),
    ('tail', tuple(TAIL[0]), tuple(TAIL[1]), 'hips'),
    ('tail.2', tuple(TAIL[1]), tuple(TAIL[2]), 'tail'),
]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front."""
    if co.y > 0.12:
        t = clamp01((co.y - 0.12) / 0.12)
        return {"spine": 1 - t, "hips": t}
    if co.y > -0.18:
        t = clamp01((co.y + 0.08) / 0.14)
        return {"chest": 1 - t, "spine": t}
    t = clamp01((co.y + 0.28) / 0.08)
    return {"neck": 1 - t, "chest": t}


def neck_weights(co):
    if co.z < NECK_MID.z:
        t = clamp01((co.z - NECK.z + 0.02) / 0.06)
        return {"neck": t, "chest": 1 - t}
    t = clamp01((co.z - NECK_MID.z + 0.02) / 0.05)
    return {"neck.2": t, "neck": 1 - t}


def tail_weights(co):
    t = clamp01((co.y - 0.47) / 0.08)
    return {"tail": 1 - t, "tail.2": t}


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.06)) / 0.08)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def scale_color(face, center):
    """Scales in large shapes: light on the top, grey low on the sides and dark underneath."""
    if face.normal.z < -0.35:
        return SCALE_SHADOW
    if face.normal.z < 0.1:
        return SCALE_DARK
    return SCALE


def spikes(part, points, direction, length, radius, color_every=2):
    """Ice spikes from `points`, light and deep blue in turn."""
    direction = Vector(direction).normalized()
    for index, point in enumerate(points):
        point = Vector(point)
        reach = length * (0.75 + 0.5 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, point - direction * 0.01, point + direction * reach, radius, 0.002, 5)
        part.paint(faces_of(verts), ICE_DEEP if index % color_every == 1 else ICE)


def body_parts():
    parts = []
    body = Part("body", scale_color, body_weights, shade=0.22)
    # The shoulders, the barrel and the hindquarters.
    kit.sphere(body.bm, (0, -0.1, 0.43), (0.21, 0.22, 0.2), 14, 10)
    kit.sphere(body.bm, (0, 0.1, 0.4), (0.2, 0.2, 0.17), 12, 8)
    kit.sphere(body.bm, (0, 0.28, 0.38), (0.17, 0.16, 0.16), 12, 8)
    # Ice spikes down the back, longest over the shoulders.
    ridge = [(0, y, 0.6 - abs(y + 0.08) * 0.35) for y in (-0.2, -0.12, -0.04, 0.04, 0.12, 0.2, 0.28)]
    spikes(body, ridge, (0, 0.6, 1), 0.15, 0.042)
    for sign in (1, -1):
        flank = [(0.14 * sign, y, 0.53) for y in (-0.16, -0.04, 0.08)]
        spikes(body, flank, (0.6 * sign, 0.5, 0.8), 0.07, 0.025)
    # Icicles hang under the belly.
    belly = [(x, y, 0.26) for y in (-0.12, 0.04, 0.2) for x in (-0.08, 0.08)]
    spikes(body, belly, (0, 0.2, -1), 0.06, 0.02)
    parts.append(body)

    neck = Part("neck", scale_color, neck_weights, shade=0.18)
    kit.tube(neck.bm, [NECK + Vector((0, 0.04, -0.03)), NECK, NECK_MID, HEAD + Vector((0, 0.01, 0))], [0.15, 0.13, 0.1, 0.085], 10)
    spikes(neck, [NECK + Vector((0, 0.0, 0.12)), NECK_MID + Vector((0, 0.03, 0.09)), HEAD + Vector((0, 0.05, 0.07))], (0, 0.8, 0.7), 0.15, 0.04)
    # A mane of ice shards on each side of the neck.
    for sign in (1, -1):
        spikes(neck, [NECK_MID + Vector((0.07 * sign, 0.02, 0.02)), NECK + Vector((0.1 * sign, 0.02, 0.04)), HEAD + Vector((0.06 * sign, 0.03, 0.0))], (0.7 * sign, 0.6, 0.3), 0.12, 0.032)
    parts.append(neck)

    tail = Part("tail", scale_color, tail_weights, shade=0.15)
    kit.tube(tail.bm, [TAIL[0] - Vector((0, 0.04, 0)), TAIL[0], TAIL[1], TAIL[2], TAIL[2] + Vector((-0.03, 0.03, -0.08))], [0.1, 0.085, 0.06, 0.035, 0.006], 8)
    spikes(tail, [TAIL[0] + Vector((0, 0.03, 0.08)), TAIL[1] + Vector((0, 0.02, 0.06))], (0, 0.7, 0.7), 0.07, 0.025)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", scale_color, "head", shade=0.15)
    kit.sphere(head.bm, HEAD_C, (0.085, 0.095, 0.075), 12, 8)
    # The long snout and the heavy brow over the eyes.
    kit.cone(head.bm, (0, -0.45, 0.615), (0, -0.62, 0.585), 0.07, 0.045, 10, squash=1.0)
    for sign in (1, -1):
        kit.sphere(head.bm, (0.045 * sign, -0.47, 0.665), (0.035, 0.05, 0.022), 8, 5)
    # The upper lip is red inside.
    lip = kit.box(head.bm, (0, -0.53, 0.56), (0.09, 0.17, 0.012))
    head.paint(faces_of(lip), MOUTH)
    parts.append(head)

    crown = Part("crown", ICE, "head", shade=0.1)
    # The crown of ice spikes that sweeps back from the brow.
    for index, sign in enumerate((1, -1, 1, -1, 0)):
        base = Vector((0.05 * sign, -0.42 + 0.03 * (index // 2), 0.68))
        direction = Vector((0.35 * sign, 0.85, 0.55))
        verts = kit.cone(crown.bm, base, base + direction.normalized() * (0.16 - 0.025 * (index // 2)), 0.028, 0.002, 5)
        crown.paint(faces_of(verts), ICE_DEEP if index % 2 else ICE)
    for sign in (1, -1):
        # The cheek spikes.
        kit.cone(crown.bm, (0.075 * sign, -0.42, 0.59), (0.15 * sign, -0.36, 0.58), 0.02, 0.002, 5)
    parts.append(crown)

    fangs = Part("fangs", FANG, "head", shade=0.05)
    for sign in (1, -1):
        # Two long upper fangs, as the card painting has.
        kit.cone(fangs.bm, (0.035 * sign, -0.57, 0.565), (0.04 * sign, -0.585, 0.49), 0.014, 0.002, 5)
        for y in (-0.5, -0.53, -0.6):
            kit.cone(fangs.bm, (0.04 * sign, y, 0.565), (0.04 * sign, y, 0.54), 0.007, 0.001, 4)
    parts.append(fangs)

    eyes = Part("eyes", EYE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.06 * sign, -0.48, 0.645), (0.016, 0.018, 0.01), 6, 5)
    parts.append(eyes)

    jaw = Part("jaw", SCALE_DARK, "jaw", shade=0.08)
    kit.cone(jaw.bm, (0, -0.42, 0.56), (0, -0.6, 0.535), 0.055, 0.035, 10, squash=1.0)
    mouth = kit.box(jaw.bm, (0, -0.52, 0.575), (0.07, 0.15, 0.012))
    jaw.paint(faces_of(mouth), TONGUE)
    for sign in (1, -1):
        for y in (-0.5, -0.56):
            tooth = kit.cone(jaw.bm, (0.035 * sign, y, 0.575), (0.035 * sign, y, 0.605), 0.008, 0.001, 4)
            jaw.paint(faces_of(tooth), FANG)
    # Icicles under the chin.
    for index, y in enumerate((-0.46, -0.52)):
        drop = kit.cone(jaw.bm, (0, y, 0.52), (0, y + 0.02, 0.45 + 0.02 * index), 0.018, 0.002, 5)
        jaw.paint(faces_of(drop), ICE)
    parts.append(jaw)

    # The brass bell on a short cord at the right side of the jaw.
    bell = Part("bell", BELL, "jaw", shade=0.1)
    cord = kit.cone(bell.bm, (-0.05, -0.5, 0.54), (-0.06, -0.5, 0.49), 0.005, 0.005, 4)
    bell.paint(faces_of(cord), BELL_DARK)
    kit.cone(bell.bm, (-0.06, -0.5, 0.49), (-0.06, -0.5, 0.43), 0.012, 0.03, 8)
    lip = kit.torus(bell.bm, (-0.06, -0.5, 0.43), (0, 0, 1), 0.03, 0.005, 10, 4)
    bell.paint(faces_of(lip), BELL_DARK)
    parts.append(bell)
    grow = kit.Matrix.Translation(HEAD) @ kit.Matrix.Scale(HEAD_SCALE, 4) @ kit.Matrix.Translation(-HEAD)
    for part in parts:
        kit.bmesh.ops.transform(part.bm, matrix=grow, verts=list(part.bm.verts))
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", scale_color, leg_weights(leg))
        kit.cone(upper.bm, top + Vector((0, 0, 0.04)), joint, 0.095, 0.065, 9)
        parts.append(upper)

        lower = Part(f"lower.{leg}", scale_color, f"lower.{leg}")
        kit.cone(lower.bm, joint, ankle, 0.065, 0.05, 8)
        if leg.startswith("F"):
            # An ice spur at the back of each front elbow.
            spur = kit.cone(lower.bm, joint + Vector((0, 0.03, 0.01)), joint + Vector((0, 0.11, 0.05)), 0.02, 0.002, 5)
            lower.paint(faces_of(spur), ICE)
        parts.append(lower)

        paw = Part(f"paw.{leg}", SCALE_DARK, f"paw.{leg}", shade=0.1)
        forward = (toe - ankle) * Vector((1, 1, 0))
        forward = forward.normalized() if forward.length > 1e-4 else -Y
        kit.sphere(paw.bm, Vector((ankle.x, ankle.y, 0.042)) + forward * 0.02, (0.065, 0.075, 0.04), 10, 6)
        # Four heavy dark claws at the front of the paw.
        for side in (-1.5, -0.5, 0.5, 1.5):
            base = Vector((ankle.x + side * 0.027, ankle.y, 0.025)) + forward * 0.07
            claw = kit.cone(paw.bm, base, base + forward * 0.045 - Vector((0, 0, 0.02)), 0.014, 0.002, 5)
            paw.paint(faces_of(claw), CLAW)
        parts.append(paw)
    return parts


def build_figure():
    kit.reset_scene()
    rig, _ = plan.build_rig("OldFrostmaw", TABLE, TRUNK_BONES, foot="paw")
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "OldFrostmawMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


PATCHES = (
    Patch(
        "walk",
        "heavy-trot",
        beats=(
            Beat(0, "stride", (0.0,)),
            Beat(7, "stride", (0.25,)),
            Beat(14, "stride", (0.5,)),
            Beat(21, "stride", (0.75,)),
            Beat(28, "stride", (1.0,)),
        ),
        frames=28,
    ),
    Patch(
        "attack",
        "frost-bite",
        beats=(
            Beat(0),
            Beat(9, "paw"),
            Beat(13, "toss", (-40,)),
            Beat(15, "toss"),
            Beat(19, "toss"),
            Beat(26),
            Beat(30),
        ),
    ),
    Patch("death", "fall-left"),
    Patch(
        "summon",
        "rise-and-roar",
        beats=(
            Beat(0, "low"),
            Beat(10, "rising"),
            Beat(17, "snort"),
            Beat(24),
        ),
    ),
)


class Poses(clips.quadruped.Poses):
    foot = "paw"
    fall = Fall(Y, 84, (-0.32, 0, 0.235))

    def stance(self, breath=0.0, sway=0.0):
        """The idle stance: the neck up and the head turned to the camera, the jaw a little open, a cold breath."""
        return {
            **super().stance(breath, sway),
            "hips": self.t("hips", (Z, -10)),
            "spine": self.t("spine", (X, -breath * 2)),
            "chest": self.t("chest", (X, breath * 2), (Z, sway * 3)),
            "neck": self.t("neck", (Z, 6 + sway * 4), (X, -14)),
            "neck.2": self.t("neck.2", (Z, 4), (X, -4)),
            "head": self.t(
                "head", (Z, 4 + sway * 6), (X, 14 - breath * 3), (Y, sway * 4)
            ),
            "jaw": self.t("jaw", (X, -12 - breath * 8)),
            "tail": self.t("tail", (Z, sway * 8), (X, -breath * 4)),
            "tail.2": self.t("tail.2", (Z, sway * 12)),
        }

    def gasp(self, base, breath=0.0):
        """Low HP: the legs give a little, the neck hangs, the jaw open."""
        return self.pose(
            super().gasp(base, breath),
            hips_at_loc=self.at("hips", (0, 0, 0.02 - breath * 0.008)),
            spine=self.t("spine", (X, 4)),
            chest=self.t("chest", (X, 8 + breath * 3)),
            neck=self.t("neck", (X, 26 + breath * 4)),
            neck__2=self.t("neck.2", (X, 8)),
            head=self.t("head", (X, 10), (Y, -10)),
            jaw=self.t("jaw", (X, -18 - breath * 8)),
            tail=self.t("tail", (X, 20)),
            **self.legs(
                FL=(-6, 24, -16), FR=(4, 16, -18), BL=(-12, 22, -10), BR=(-12, 22, -10)
            ),
        )

    def recoil(self, base, amount=1.0):
        """The hit pushes the head up and the body back."""
        return self.pose(
            super().recoil(base, amount),
            hips_at_loc=self.at("hips", (0, 0.03 * amount, -0.01 * amount)),
            chest=self.t("chest", (X, -10 * amount), (Z, 8 * amount)),
            neck=self.t("neck", (X, -14 * amount)),
            neck__2=self.t("neck.2", (X, -10 * amount)),
            jaw=self.t("jaw", (X, -24 * amount)),
            tail=self.t("tail", (X, 16 * amount)),
        )

    def buckle(self, base):
        """The legs give way."""
        return self.pose(
            super().buckle(base),
            hips_at_loc=self.at("hips", (0, 0, 0.0)),
            chest=self.t("chest", (X, 14)),
            neck=self.t("neck", (X, 24)),
            head=self.t("head", (X, 10)),
            jaw=self.t("jaw", (X, -24)),
            **self.legs(
                FL=(-20, 50, -30),
                FR=(-10, 40, -30),
                BL=(-30, 40, -10),
                BR=(-24, 40, -10),
            ),
        )

    def fallen(self, base, bounce=0.0):
        """
        On its left side, the legs stiff and out. The Battle camera sees the
        right side of a player Unit (-X), so it sees the legs and the belly.
        """
        return self.pose(
            self.unchanged(super().fallen(base, bounce), base, "chest"),
            hips_at_loc=self.at("hips", (0, 0, -0.02)),
            neck=self.t("neck", (X, 10), (Y, 14)),
            neck__2=self.t("neck.2", (X, 6)),
            head=self.t("head", (X, -6), (Y, 14)),
            jaw=self.t("jaw", (X, -26)),
            tail=self.t("tail", (X, 10), (Y, 20)),
            **self.legs(
                FL=(-50, 14, -10), FR=(-24, 10, -10), BL=(44, 6, 0), BR=(10, 10, 0)
            ),
        )

    def low(self, base):
        """Down low with the legs folded, as a summon starts."""
        return self.pose(
            super().low(base),
            hips_at_loc=self.at("hips", (0, 0, -0.05)),
            neck=self.t("neck", (X, 30)),
            jaw=self.t("jaw", (X, 0)),
            tail=self.t("tail", (X, 20)),
            **self.legs(
                FL=(-60, 120, -50),
                FR=(-60, 120, -50),
                BL=(-70, 110, -40),
                BR=(-70, 110, -40),
            ),
        )

    def snort(self, base):
        """The neck high and the jaw wide: the end of a summon."""
        return self.pose(
            super().snort(base),
            hips=self.t("hips", (Z, -10), (X, -10)),
            hips_at_loc=self.at("hips", (0, 0.03, 0.0)),
            chest=self.t("chest", (X, -6)),
            neck=self.t("neck", (X, -24)),
            neck__2=self.t("neck.2", (X, -16)),
            head=self.t("head", (X, -6)),
            jaw=self.t("jaw", (X, -40)),
            tail=self.t("tail", (X, 20)),
            **self.legs(
                FL=(-24, 34, -10), FR=(-10, 26, -10), BL=(8, 10, -10), BR=(12, 6, -10)
            ),
        )

    def stride(self, base, phase):
        """
        A walk pose: the diagonal pairs swing together. `phase` 0 has FL and BR
        forward; 0.5 has FR and BL forward; 0.25 and 0.75 pass with one pair lifted.
        """
        swing = math.cos(phase * 2 * math.pi)
        lift_a = max(0.0, math.sin(phase * 2 * math.pi))
        lift_b = max(0.0, -math.sin(phase * 2 * math.pi))
        return self.pose(
            base,
            hips_at_loc=self.at(
                "hips", (0, 0, 0.014 + 0.008 * abs(math.sin(phase * 4 * math.pi)))
            ),
            chest=self.t("chest", (Z, 3 * swing)),
            neck=self.t("neck", (Z, 4 * swing), (X, -10)),
            head=self.t("head", (Z, 4), (X, 3 * swing)),
            tail=self.t("tail", (Z, -10 * swing)),
            tail__2=self.t("tail.2", (Z, -14 * swing)),
            **self.legs(
                FL=(-18 * swing, 40 * lift_b, -10 * lift_b),
                BR=(-16 * swing, 30 * lift_b, -6 * lift_b),
                FR=(18 * swing, 40 * lift_a, -10 * lift_a),
                BL=(16 * swing, 30 * lift_a, -6 * lift_a),
            ),
        )

    def paw(self, base):
        return self.pose(
            super().paw(base),
            hips_at_loc=self.at("hips", (0, 0.06, 0.012)),
            hips=self.t("hips", (Z, -10), (X, -8)),
            chest=self.t("chest", (X, -6)),
            neck=self.t("neck", (X, -22)),
            neck__2=self.t("neck.2", (X, -10)),
            head=self.t("head", (X, -4)),
            jaw=self.t("jaw", (X, -46)),
            tail=self.t("tail", (X, 24)),
            **self.legs(
                FL=(-20, 30, -10), FR=(-30, 50, -20), BL=(-14, 24, -8), BR=(-14, 24, -8)
            ),
        )

    def toss(self, base, jaw=-4):
        return self.pose(
            super().toss(base, jaw),
            hips_at_loc=self.at("hips", (0, -0.12, 0.03)),
            hips=self.t("hips", (Z, -6), (X, 6)),
            chest=self.t("chest", (X, 8)),
            neck=self.t("neck", (X, 26)),
            neck__2=self.t("neck.2", (X, 4)),
            head=self.t("head", (X, -10), (Y, -10)),
            jaw=self.t("jaw", (X, jaw)),
            tail=self.t("tail", (X, 10)),
            **self.legs(
                FL=(-34, 10, 0), FR=(-20, 20, 0), BL=(28, 0, 10), BR=(34, -4, 14)
            ),
        )

    def rising(self, base):
        return self.pose(self.low(base), hips_at_loc=self.at("hips", (0, 0, -0.055)))


def build_clips(rig):
    return clips.overrides.build(
        clips.quadruped.CLIPS,
        Poses(*kit.pose_tools(rig)),
        PATCHES,
        without=("cast", "rebirth"),
    )


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "old-frostmaw.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
