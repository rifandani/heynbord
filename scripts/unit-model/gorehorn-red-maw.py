"""
Gorehorn Red Maw (`feral.gorehornRedMaw`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a huge four-legged beast with
shaggy red fur, two long ivory horns with glowing red veins, a scaly grey
snout with tusks, glowing red eyes and heavy grey hooves. It charges with the
head low. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/gorehorn-red-maw.glb`; then
`bun unit-model:pack gorehorn-red-maw` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y.
The legs are named FL, FR, BL and BR (front and back, left and right).
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

FUR = hex_color("#b3221d")
FUR_DARK = hex_color("#7a1512")
FUR_LIGHT = hex_color("#d6432c")
SNOUT = hex_color("#ab9d84")
SNOUT_DARK = hex_color("#7e715e")
HORN = hex_color("#e4d7b5")
HORN_DARK = hex_color("#bfae88")
VEIN = hex_color("#ff3b24")
EYE = hex_color("#ffb43a")
TUSK = hex_color("#eee2c4")
HOOF = hex_color("#6c665f")
HOOF_DARK = hex_color("#3d3935")
MOUTH = hex_color("#4a1a18")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.27, 0.43))
MID = Vector((0, 0.05, 0.48))
CHEST = Vector((0, -0.13, 0.5))
NECK = Vector((0, -0.25, 0.44))
HEAD = Vector((0, -0.33, 0.39))
HEAD_C = Vector((0, -0.39, 0.37))

TABLE = plan.Proportions(
    hip_y=HIP.y,
    hip_z=HIP.z,
    mid_y=MID.y,
    mid_z=MID.z,
    chest_y=CHEST.y,
    chest_z=CHEST.z,
    neck_y=NECK.y,
    neck_z=NECK.z,
    necks=((HEAD.y, HEAD.z),),
    head_tip_y=-0.52,
    head_tip_z=0.34,
    front_top_x=0.13,
    front_top_y=-0.11,
    front_top_z=0.4,
    front_knee_x=0.145,
    front_knee_y=-0.13,
    front_knee_z=0.22,
    front_ankle_x=0.145,
    front_ankle_y=-0.14,
    front_ankle_z=0.07,
    front_toe_x=0.145,
    front_toe_y=-0.2,
    front_toe_z=0.02,
    back_top_x=0.12,
    back_top_y=0.27,
    back_top_z=0.38,
    back_knee_x=0.125,
    back_knee_y=0.33,
    back_knee_z=0.2,
    back_ankle_x=0.125,
    back_ankle_y=0.3,
    back_ankle_z=0.07,
    back_toe_x=0.125,
    back_toe_y=0.24,
    back_toe_z=0.02,
)

LEGS = {
    leg: (*map(Vector, plan.leg_points(TABLE, leg)), plan.leg_parent(leg))
    for leg in plan.LEGS
}

TRUNK_BONES = [
    ('jaw', (0, -0.38, 0.33), (0, -0.5, 0.29), 'head'),
    ('tail', (0, 0.42, 0.47), (0, 0.5, 0.36), 'hips'),
]

# --- Weights -------------------------------------------------------------------


def body_weights(co):
    """Along the body: the hips at the back, the spine in the middle, the chest at the front."""
    if co.y > 0.1:
        t = clamp01((co.y - 0.1) / 0.12)
        return {"spine": 1 - t, "hips": t}
    if co.y > -0.2:
        t = clamp01((co.y + 0.1) / 0.14)
        return {"chest": 1 - t, "spine": t}
    t = clamp01((co.y + 0.3) / 0.08)
    return {"neck": 1 - t, "chest": t}


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.06)) / 0.08)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def fur_color(face, center):
    """
    Fur in large shapes: dark under the body and light on the top. The toon
    light bands already break up the faces, so a finer pattern looks noisy.
    """
    if face.normal.z < -0.35:
        return FUR_DARK
    if face.normal.z > 0.8:
        return FUR_LIGHT
    return FUR


def tufts(part, points, length, radius, direction=(0, 0.3, -1)):
    """Fur tufts that hang from `points`."""
    direction = Vector(direction).normalized()
    for index, point in enumerate(points):
        point = Vector(point)
        reach = length * (0.8 + 0.4 * ((index * 7) % 5) / 4)
        kit.cone(part.bm, point, point + direction * reach, radius, 0.003, 5)


def body_parts():
    parts = []
    body = Part("body", fur_color, body_weights, shade=0.22)
    # The shoulder hump, the barrel and the hindquarters.
    kit.sphere(body.bm, (0, -0.08, 0.5), (0.22, 0.23, 0.24), 14, 10)
    kit.sphere(body.bm, (0, 0.1, 0.46), (0.2, 0.2, 0.19), 12, 8)
    kit.sphere(body.bm, (0, 0.27, 0.44), (0.16, 0.16, 0.17), 12, 8)
    # The mane over the neck.
    kit.sphere(body.bm, (0, -0.25, 0.47), (0.15, 0.13, 0.15), 12, 8)
    # Shaggy fur hangs along the belly, the flanks and the hump.
    belly = [(x, y, 0.32) for y in (-0.2, -0.08, 0.04, 0.16, 0.28) for x in (-0.12, -0.04, 0.04, 0.12)]
    tufts(body, belly, 0.09, 0.05)
    for sign in (1, -1):
        # The flank fur hangs close along the sides.
        flank = [(0.2 * sign, y, z) for y in (-0.16, -0.02, 0.12) for z in (0.4, 0.54)]
        tufts(body, flank, 0.1, 0.055, (0.12 * sign, 0.35, -1))
    # The mane flows back over the hump.
    hump = [(x, y, 0.7) for x in (-0.09, 0.0, 0.09) for y in (-0.2, -0.06)]
    tufts(body, hump, 0.11, 0.06, (0, 1, -0.25))
    parts.append(body)

    tail = Part("tail", FUR_DARK, "tail")
    kit.cone(tail.bm, (0, 0.41, 0.48), (0, 0.5, 0.34), 0.03, 0.012, 6)
    kit.sphere(tail.bm, (0, 0.51, 0.32), (0.035, 0.035, 0.05), 8, 6)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", fur_color, "head", shade=0.15)
    kit.sphere(head.bm, HEAD_C + Vector((0, 0.02, 0.03)), (0.13, 0.12, 0.11), 12, 8)
    # The brow fur, low over the eyes.
    tufts(head, [(x, -0.43, 0.43) for x in (-0.07, 0.0, 0.07)], 0.05, 0.035, (0, -0.6, -0.5))
    parts.append(head)

    snout = Part("snout", SNOUT, "head", shade=0.12)
    verts = kit.sphere(snout.bm, (0, -0.47, 0.35), (0.085, 0.09, 0.07), 12, 8)
    # Scales: a darker plate on every other face.
    for index, face in enumerate(sorted(faces_of(verts), key=lambda f: f.index)):
        if index % 3 == 0:
            snout.paint([face], SNOUT_DARK)
    nose = kit.cone(snout.bm, (0, -0.53, 0.36), (0, -0.565, 0.36), 0.05, 0.04, 8)
    snout.paint(faces_of(nose), SNOUT_DARK)
    for sign in (1, -1):
        nostril = kit.sphere(snout.bm, (0.02 * sign, -0.567, 0.365), (0.011, 0.005, 0.009), 6, 4)
        snout.paint(faces_of(nostril), MOUTH)
    parts.append(snout)

    jaw = Part("jaw", SNOUT_DARK, "jaw", shade=0.08)
    kit.sphere(jaw.bm, (0, -0.45, 0.3), (0.07, 0.08, 0.035), 10, 6)
    mouth = kit.box(jaw.bm, (0, -0.48, 0.325), (0.09, 0.08, 0.01))
    jaw.paint(faces_of(mouth), MOUTH)
    parts.append(jaw)

    tusks = Part("tusks", TUSK, "jaw", shade=0.05)
    for sign in (1, -1):
        kit.tube(tusks.bm, [(0.055 * sign, -0.5, 0.31), (0.07 * sign, -0.53, 0.35), (0.065 * sign, -0.55, 0.39)], [0.014, 0.009, 0.002], 5)
        kit.cone(tusks.bm, (0.025 * sign, -0.52, 0.32), (0.025 * sign, -0.535, 0.35), 0.008, 0.001, 4)
    parts.append(tusks)

    eyes = Part("eyes", EYE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, (0.072 * sign, -0.46, 0.41), (0.02, 0.012, 0.014), 6, 5)
    parts.append(eyes)

    horns = Part("horns", HORN, "head", shade=0.1)
    for sign in (1, -1):
        path = [
            (0.08 * sign, -0.38, 0.44),
            (0.15 * sign, -0.39, 0.47),
            (0.21 * sign, -0.44, 0.53),
            (0.23 * sign, -0.52, 0.61),
            (0.21 * sign, -0.58, 0.69),
        ]
        verts = kit.tube(horns.bm, path, [0.052, 0.045, 0.034, 0.019, 0.003], 7)
        for face in faces_of(verts):
            c = face.calc_center_median()
            # Ridges round the horn, and a glowing red vein along its top.
            if int(c.z * 70) % 3 == 0:
                horns.paint([face], HORN_DARK)
            if face.normal.z > 0.75 and c.z < 0.62:
                horns.paint([face], VEIN)
    parts.append(horns)
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", fur_color, leg_weights(leg))
        kit.cone(upper.bm, top + Vector((0, 0, 0.04)), joint, 0.085, 0.06, 9)
        tufts(upper, [joint + Vector((0.03 * sign, 0.02, 0.02)) for sign in (1, -1)], 0.07, 0.035, (0, 0.2, -1))
        parts.append(upper)

        lower = Part(f"lower.{leg}", FUR_DARK, f"lower.{leg}")
        kit.cone(lower.bm, joint, ankle, 0.055, 0.045, 8)
        parts.append(lower)

        hoof = Part(f"hoof.{leg}", HOOF, f"hoof.{leg}", shade=0.1)
        forward = (toe - ankle) * Vector((1, 1, 0))
        forward = forward.normalized() if forward.length > 1e-4 else -Y
        kit.cone(hoof.bm, ankle + Vector((0, 0, 0.02)), Vector((ankle.x, ankle.y, 0.0)), 0.055, 0.065, 8)
        # Three heavy claws at the front of the hoof.
        for side in (-1, 0, 1):
            base = Vector((ankle.x + side * 0.03, ankle.y, 0.02)) + forward * 0.04
            claw = kit.cone(hoof.bm, base, base + forward * 0.04 - Vector((0, 0, 0.012)), 0.018, 0.003, 5)
            hoof.paint(faces_of(claw), HOOF_DARK)
        parts.append(hoof)
    return parts


def build_figure():
    kit.reset_scene()
    rig, _ = plan.build_rig("GorehornRedMaw", TABLE, TRUNK_BONES, foot="hoof")
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    plan.check_skin(parts, rig)
    mesh = kit.join_parts(objects, "GorehornRedMawMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


PATCHES = (
    Patch(
        "walk",
        "heavy-trot",
        beats=(
            Beat(0, "stride", (0.0,)),
            Beat(6, "stride", (0.25,)),
            Beat(12, "stride", (0.5,)),
            Beat(18, "stride", (0.75,)),
            Beat(24, "stride", (1.0,)),
        ),
    ),
    Patch(
        "attack",
        "horn-gore",
        beats=(
            Beat(0),
            Beat(8, "paw"),
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
    foot = "hoof"
    fall = Fall(Y, 84, (-0.32, 0, 0.21))

    def stance(self, breath=0.0, sway=0.0):
        """The idle stance: the head low and the horns forward, the body heaving as it breathes."""
        return {
            **super().stance(breath, sway),
            "spine": self.t("spine", (X, -breath * 2)),
            "chest": self.t("chest", (X, breath * 2), (Z, sway * 3)),
            "neck": self.t("neck", (Z, 6 + sway * 4), (X, 4)),
            "head": self.t("head", (Z, 6 + sway * 6), (X, -breath * 4), (Y, sway * 4)),
            "jaw": self.t("jaw", (X, -breath * 6)),
            "tail": self.t("tail", (Y, sway * 20), (X, -breath * 6)),
        }

    def gasp(self, base, breath=0.0):
        """Low HP: the legs give a little, the head hangs, the jaw open."""
        return self.pose(
            super().gasp(base, breath),
            hips_at_loc=self.at("hips", (0, 0, -0.05 - breath * 0.008)),
            spine=self.t("spine", (X, 4)),
            chest=self.t("chest", (X, 8 + breath * 3)),
            neck=self.t("neck", (X, 18 + breath * 4)),
            head=self.t("head", (X, 14), (Y, -10)),
            jaw=self.t("jaw", (X, -14 - breath * 8)),
            tail=self.t("tail", (X, 30)),
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
            neck=self.t("neck", (X, -16 * amount)),
            jaw=self.t("jaw", (X, -18 * amount)),
            tail=self.t("tail", (X, -30 * amount)),
        )

    def buckle(self, base):
        """The legs give way."""
        return self.pose(
            super().buckle(base),
            hips_at_loc=self.at("hips", (0, 0, -0.01)),
            chest=self.t("chest", (X, 14)),
            neck=self.t("neck", (X, 20)),
            head=self.t("head", (X, 10)),
            jaw=self.t("jaw", (X, -20)),
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
            neck=self.t("neck", (X, 10), (Y, 10)),
            head=self.t("head", (X, -6), (Y, 14)),
            jaw=self.t("jaw", (X, -24)),
            tail=self.t("tail", (X, 20), (Y, 30)),
            **self.legs(
                FL=(-16, 14, -10), FR=(-24, 10, -10), BL=(18, 6, 0), BR=(10, 10, 0)
            ),
        )

    def low(self, base):
        """Down low with the legs folded, as a summon starts and a Rebirth gets up."""
        return self.pose(
            super().low(base),
            hips_at_loc=self.at("hips", (0, 0, -0.2)),
            neck=self.t("neck", (X, 24)),
            tail=self.t("tail", (X, 30)),
            **self.legs(
                FL=(-60, 120, -50),
                FR=(-60, 120, -50),
                BL=(-70, 110, -40),
                BR=(-70, 110, -40),
            ),
        )

    def snort(self, base):
        """Up on the hind legs a little, the head high and the jaw wide: the end of a summon and a Rebirth."""
        return self.pose(
            super().snort(base),
            hips=self.t("hips", (Z, -8), (X, -14)),
            hips_at_loc=self.at("hips", (0, 0.03, 0.0)),
            chest=self.t("chest", (X, -6)),
            neck=self.t("neck", (X, -26)),
            head=self.t("head", (X, -20)),
            jaw=self.t("jaw", (X, -34)),
            tail=self.t("tail", (X, -30)),
            **self.legs(
                FL=(-30, 40, -10), FR=(-10, 30, -10), BL=(10, 10, -10), BR=(14, 6, -10)
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
                "hips", (0, 0, -0.008 + 0.008 * abs(math.sin(phase * 4 * math.pi)))
            ),
            chest=self.t("chest", (Z, 3 * swing)),
            head=self.t("head", (Z, 6), (X, 3 * swing)),
            tail=self.t("tail", (Y, 14 * swing)),
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
            hips_at_loc=self.at("hips", (0, 0.06, -0.03)),
            hips=self.t("hips", (Z, -8), (X, -8)),
            chest=self.t("chest", (X, -6)),
            neck=self.t("neck", (X, -12)),
            head=self.t("head", (X, -10)),
            jaw=self.t("jaw", (X, -20)),
            tail=self.t("tail", (X, -30)),
            **self.legs(
                FL=(-20, 30, -10), FR=(-30, 50, -20), BL=(-14, 24, -8), BR=(-14, 24, -8)
            ),
        )

    def toss(self, base):
        return self.pose(
            super().toss(base),
            hips_at_loc=self.at("hips", (0, -0.14, -0.02)),
            hips=self.t("hips", (Z, -4), (X, 6)),
            chest=self.t("chest", (X, 8)),
            neck=self.t("neck", (X, 14)),
            head=self.t("head", (X, -30), (Y, -12)),
            jaw=self.t("jaw", (X, -12)),
            tail=self.t("tail", (X, -40)),
            **self.legs(
                FL=(-34, 10, 0), FR=(-20, 20, 0), BL=(28, 0, 10), BR=(34, -4, 14)
            ),
        )

    def rising(self, base):
        return self.pose(self.low(base), hips_at_loc=self.at("hips", (0, 0, -0.16)))


def build_clips(rig):
    return clips.overrides.build(
        clips.quadruped.CLIPS,
        Poses(*kit.pose_tools(rig)),
        PATCHES,
        without=("cast",),
    )


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "gorehorn-red-maw.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
