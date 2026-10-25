"""
Tailsweep Basilisk (`feral.tailsweepBasilisk`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a long, low basilisk with sandy
scales and dark brown bands, a pale belly, a ridge of spikes down its back,
a crown of short horns, bored half-shut yellow eyes, legs that sprawl to the
sides with dark claws, and a long tail that curls up behind it to a heavy club
of rock with spikes. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/tailsweep-basilisk.glb`; then
`bun unit-model:pack tailsweep-basilisk` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). It has
Pivot, so it watches behind it: its idle looks back over its right shoulder,
on the camera side, and its attack sweeps the club tail round its right side.
In the death clip it falls on its left side (`(Y, +84)` on the root), so the
belly and the legs turn to the camera side (-X). It has no Keyword that it
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SCALE = hex_color("#b8925a")
SCALE_LIGHT = hex_color("#d2b07a")
SCALE_DARK = hex_color("#6e4e2c")
BELLY = hex_color("#ddc58e")
SPIKE = hex_color("#6a4a2a")
SPIKE_TIP = hex_color("#d8c49a")
EYE = hex_color("#e3b232")
PUPIL = hex_color("#1a1208")
MOUTH = hex_color("#6a2a24")
CLAW = hex_color("#2e2a26")
CLUB = hex_color("#8a6a44")
CLUB_DARK = hex_color("#5a4028")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.2, 0.2))
MID = Vector((0, 0.02, 0.21))
CHEST = Vector((0, -0.16, 0.22))
NECK = Vector((0, -0.3, 0.24))
HEAD_A = Vector((0, -0.37, 0.25))
SNOUT = Vector((0, -0.6, 0.2))
HEAD_C = Vector((0, -0.44, 0.25))

# The tail curls up behind it, and the club sits on the end.
TAIL = [Vector((0, 0.3, 0.2)), Vector((0, 0.44, 0.24)), Vector((0, 0.56, 0.32)), Vector((0, 0.6, 0.43)), Vector((0, 0.56, 0.52))]
CLUB_C = Vector((0, 0.52, 0.56))

LEGS = {
    # name: (shoulder, elbow, wrist, toe, parent)
    "FL": (Vector((0.08, -0.16, 0.2)), Vector((0.2, -0.18, 0.17)), Vector((0.22, -0.21, 0.04)), Vector((0.24, -0.29, 0.01)), "chest"),
    "FR": (Vector((-0.08, -0.16, 0.2)), Vector((-0.2, -0.18, 0.17)), Vector((-0.22, -0.21, 0.04)), Vector((-0.24, -0.29, 0.01)), "chest"),
    "BL": (Vector((0.08, 0.2, 0.19)), Vector((0.2, 0.22, 0.17)), Vector((0.22, 0.24, 0.04)), Vector((0.24, 0.16, 0.01)), "hips"),
    "BR": (Vector((-0.08, 0.2, 0.19)), Vector((-0.2, 0.22, 0.17)), Vector((-0.22, 0.24, 0.04)), Vector((-0.24, 0.16, 0.01)), "hips"),
}

TAIL_BONES = ["tail.1", "tail.2", "tail.3", "tail.4"]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("neck", tuple(NECK), tuple(HEAD_A), "chest"),
    ("head", tuple(HEAD_A), tuple(SNOUT), "neck"),
    ("jaw", (0, -0.42, 0.21), (0, -0.58, 0.18), "head"),
    ("tail.1", tuple(TAIL[0]), tuple(TAIL[1]), "hips"),
    ("tail.2", tuple(TAIL[1]), tuple(TAIL[2]), "tail.1"),
    ("tail.3", tuple(TAIL[2]), tuple(TAIL[3]), "tail.2"),
    ("tail.4", tuple(TAIL[3]), tuple(TAIL[4]), "tail.3"),
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


def scale_color(face, center):
    """Sandy scales with dark bands across the back and a pale belly."""
    if face.normal.z < -0.35:
        return BELLY
    if face.normal.z > 0.45 and int((center.y + 1.0) * 14) % 3 == 0:
        return SCALE_DARK
    if face.normal.z > 0.7:
        return SCALE_LIGHT
    return SCALE


def spikes_along(part, points, heights, step=0.045, lean=0.6):
    """A ridge of spikes along a line of points on the top of the body, leaning back."""
    path = []
    for a, b in zip(points, points[1:]):
        count = max(1, int((b - a).length / step))
        for index in range(count):
            path.append((a.lerp(b, index / count), (b - a).normalized()))
    for index, (point, ahead) in enumerate(path):
        height = lerp(heights[0], heights[1], index / max(1, len(path) - 1)) * (1.0 if index % 2 == 0 else 0.7)
        up = (Z - ahead * ahead.dot(Z)).normalized()
        tip = point + (up + ahead * lean).normalized() * height
        verts = kit.cone(part.bm, point - up * 0.01, tip, height * 0.4, 0.002, 5, squash=0.5)
        for face in faces_of(verts):
            part.paint([face], SPIKE_TIP if face.calc_center_median().dot(up) > (point + up * height * 0.6).dot(up) else SPIKE)


def body_parts():
    parts = []
    body = Part("body", scale_color, body_weights, shade=0.2)
    kit.sphere(body.bm, (0, -0.14, 0.22), (0.13, 0.15, 0.1), 12, 8)
    kit.sphere(body.bm, (0, 0.03, 0.215), (0.145, 0.16, 0.105), 12, 8)
    kit.sphere(body.bm, (0, 0.19, 0.21), (0.12, 0.13, 0.095), 12, 8)
    kit.tube(body.bm, [CHEST + Vector((0, 0.02, 0.0)), NECK, HEAD_A], [0.1, 0.085, 0.072], 10)
    # Rough scales on the flanks.
    for index in range(16):
        y = lerp(-0.22, 0.26, index / 15)
        for sign in (1, -1):
            verts = kit.sphere(body.bm, (0.125 * sign, y, 0.2 + 0.02 * ((index % 3) - 1)), (0.016, 0.022, 0.014), 5, 3)
            body.paint(faces_of(verts), SCALE_DARK if index % 2 else SCALE_LIGHT)
    parts.append(body)

    ridge = Part("ridge", SPIKE, body_weights, shade=0.12)
    spikes_along(ridge, [NECK + Vector((0, 0, 0.07)), CHEST + Vector((0, 0, 0.095)), MID + Vector((0, 0, 0.1)), HIP + Vector((0, 0, 0.09)), TAIL[0] + Vector((0, 0, 0.07))], (0.1, 0.07), 0.05)
    parts.append(ridge)

    tail = Part("tail", scale_color, tail_weights, shade=0.15)
    steps = 12
    path, radii = [], []
    for step in range(steps + 1):
        s = step / steps * (len(TAIL) - 1)
        index = min(int(s), len(TAIL) - 2)
        path.append(TAIL[index].lerp(TAIL[index + 1], s - index))
        radii.append(lerp(0.09, 0.04, step / steps))
    kit.tube(tail.bm, path, radii, 8)
    # The ridge goes on down the top of the tail.
    top = []
    for index in range(1, steps - 1, 2):
        ahead = (path[index + 1] - path[index - 1]).normalized()
        top.append(path[index] + (Z - ahead * ahead.dot(Z)).normalized() * radii[index] * 0.9)
    spikes_along(tail, top, (0.06, 0.035), 0.04, 0.4)
    parts.append(tail)

    # The club: a heavy knot of rock-hard scale with spikes all round.
    club = Part("club", CLUB, "tail.4", smooth=False, shade=0.15)
    kit.sphere(club.bm, CLUB_C, (0.075, 0.07, 0.07), 9, 6)
    golden = math.pi * (3 - math.sqrt(5))
    for index in range(16):
        z = 1 - 2 * (index + 0.5) / 16
        r = math.sqrt(max(0.0, 1 - z * z))
        direction = Vector((math.cos(golden * index) * r, math.sin(golden * index) * r, z))
        base = CLUB_C + direction * 0.06
        spike = kit.cone(club.bm, base, base + direction * (0.05 + 0.02 * (index % 3)), 0.022, 0.002, 5)
        club.paint(faces_of(spike), SPIKE_TIP if index % 2 else CLUB_DARK)
    parts.append(club)
    return parts


def head_parts():
    parts = []
    head = Part("head", scale_color, "head", shade=0.14)
    kit.sphere(head.bm, HEAD_C, (0.085, 0.1, 0.068), 12, 8)
    kit.sphere(head.bm, (0, -0.54, 0.225), (0.062, 0.08, 0.045), 10, 6)
    # A crown of short horns that point back, and a heavy brow over each eye.
    for index, (x, z, length) in enumerate(((0.0, 0.3, 0.07), (0.04, 0.29, 0.06), (-0.04, 0.29, 0.06), (0.065, 0.27, 0.05), (-0.065, 0.27, 0.05))):
        base = Vector((x, -0.41, z))
        horn = kit.cone(head.bm, base, base + Vector((x * 0.5, length, length * 0.45)), 0.017, 0.002, 5)
        head.paint(faces_of(horn), SPIKE if index % 2 else SPIKE_TIP)
    for sign in (1, -1):
        eye = kit.sphere(head.bm, (0.068 * sign, -0.47, 0.268), (0.02, 0.022, 0.018), 7, 5)
        head.paint(faces_of(eye), EYE)
        pupil = kit.sphere(head.bm, (0.085 * sign, -0.475, 0.265), (0.005, 0.012, 0.009), 5, 3)
        head.paint(faces_of(pupil), PUPIL)
        # The heavy lid, half shut: it looks bored.
        lid = kit.sphere(head.bm, (0.068 * sign, -0.47, 0.28), (0.024, 0.026, 0.015), 7, 4)
        head.paint(faces_of(lid), SCALE_DARK)
        nostril = kit.sphere(head.bm, (0.022 * sign, -0.6, 0.235), (0.007, 0.006, 0.005), 4, 3)
        head.paint(faces_of(nostril), PUPIL)
        # Small spikes on the cheek.
        for offset in (0.0, 0.03):
            base = Vector((0.07 * sign, -0.43 + offset, 0.22))
            cheek = kit.cone(head.bm, base, base + Vector((0.035 * sign, 0.025, -0.01)), 0.01, 0.001, 4)
            head.paint(faces_of(cheek), SPIKE)
    parts.append(head)

    jaw = Part("jaw", BELLY, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.5, 0.195), (0.05, 0.085, 0.025), 10, 5)
    mouth = kit.sphere(jaw.bm, (0, -0.51, 0.21), (0.045, 0.075, 0.008), 8, 3)
    jaw.paint(faces_of(mouth), MOUTH)
    parts.append(jaw)
    return parts


def leg_parts():
    parts = []
    for leg, (shoulder, elbow, wrist, toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", scale_color, leg_weights(leg), shade=0.12)
        kit.cone(upper.bm, shoulder, elbow, 0.065, 0.048, 8)
        kit.sphere(upper.bm, elbow, (0.048, 0.048, 0.048), 6, 4)
        parts.append(upper)

        lower = Part(f"lower.{leg}", scale_color, f"lower.{leg}", shade=0.12)
        kit.cone(lower.bm, elbow, wrist, 0.045, 0.034, 8)
        parts.append(lower)

        foot = Part(f"foot.{leg}", SCALE, f"foot.{leg}", shade=0.1)
        ahead = (toe - wrist)
        ahead.z = 0
        ahead.normalize()
        side = ahead.cross(Z).normalized()
        kit.sphere(foot.bm, wrist + ahead * 0.02 + Vector((0, 0, -0.015)), (0.035, 0.035, 0.02), 7, 4)
        # Four spread toes with long dark claws.
        for spread in (-1.5, -0.5, 0.5, 1.5):
            direction = (ahead + side * spread * 0.45).normalized()
            knuckle = wrist + Vector((0, 0, -0.02)) + direction * 0.03
            tip = knuckle + direction * 0.04 + Vector((0, 0, -0.008))
            kit.cone(foot.bm, knuckle, tip, 0.01, 0.008, 4)
            claw = kit.cone(foot.bm, tip, tip + direction * 0.025 + Vector((0, 0, -0.012)), 0.008, 0.001, 4)
            foot.paint(faces_of(claw), CLAW)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("TailsweepBasilisk", BONES)
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "TailsweepBasiliskMesh")
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

    def tail(curl=0.0, sweep=0.0, wave=0.0):
        """
        The tail: `curl` > 0 curls it up more, < 0 lays it down; `sweep` > 0
        swings it to its right (the camera side); `wave` bends it in an S.
        """
        result = {}
        for index, bone in enumerate(TAIL_BONES):
            result[bone] = t(bone, (Z, sweep * (6 + 4 * index) + wave * 10 * (1 if index % 2 == 0 else -1)), (X, -curl * (6 + 3 * index)))
        return result

    def stand(breath=0.0, sway=0.0):
        """
        The idle stance (Pivot): the chest stays to the front, the head looks
        back over its right shoulder, bored, and the club sways.
        """
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.004)),
            "hips": t("hips", (Z, 6)),
            "spine": t("spine", (Z, -6), (X, -breath * 1.5)),
            "chest": t("chest", (Z, -8 + sway * 2), (X, breath * 1.5)),
            "neck": t("neck", (Z, -30 + sway * 6), (X, -6)),
            "head": t("head", (Z, -24 + sway * 8), (Y, 6), (X, -4 + breath * 3)),
            "jaw": t("jaw", (X, breath * 3)),
            **tail(0.0, sway * 0.4, 0.3 + 0.2 * sway),
        }

    def gasp(breath=0.0):
        """Low HP: the belly on the ground, the head down and the tail laid flat."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.022 - breath * 0.004)),
            chest=t("chest", (X, 4 + breath * 2)),
            neck=t("neck", (Z, -10), (X, 10)),
            head=t("head", (X, 10 + breath * 4), (Z, -6)),
            jaw=t("jaw", (X, 6 + breath * 6)),
            **tail(-1.2, 0.0, 0.2),
            **legs(FL=(-6, 20), FR=(6, 20), BL=(-6, 20), BR=(6, 20)),
        )

    def recoil(base, amount=1.0):
        """The hit snaps the head up and the body back; the tail flicks."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, 0.01 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            neck=t("neck", (X, -14 * amount), (Z, 6 * amount)),
            head=t("head", (X, -16 * amount)),
            jaw=t("jaw", (X, 26 * amount)),
            **tail(1.0 * amount, -0.6 * amount, 0.0),
        )

    def buckle(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.025)),
            chest=t("chest", (X, 8), (Y, 10)),
            head=t("head", (X, 14)),
            jaw=t("jaw", (X, 20)),
            **tail(-0.8, 0.4, 0.4),
            **legs(FL=(-10, 30), FR=(10, 30), BL=(-10, 30), BR=(10, 30)),
        )

    def fallen(base, bounce=0.0):
        """
        On its left side, the legs out. The Battle camera sees the right side
        of a player Unit (-X), so it sees the pale belly and the legs.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.2, 0, 0.145)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (Z, 6)),
            chest=t("chest", (X, 2)),
            neck=t("neck", (Z, 10), (X, 8)),
            head=t("head", (X, 6)),
            jaw=t("jaw", (X, 24)),
            **tail(-2.0, -0.5, 0.2),
            **legs(FR=(-20, -20), BR=(30, -20)),
            # The left legs fold up along the body, so they stay out of the ground.
            upper__FL=t("upper.FL", (Z, -40), (Y, -100)),
            lower__FL=t("lower.FL", (Y, -90)),
            upper__BL=t("upper.BL", (Z, 40), (Y, -100)),
            lower__BL=t("lower.BL", (Y, -90)),
        )

    def low(base):
        """Flat on the ground with the tail laid down, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.06)),
            chest=t("chest", (X, 4)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 12)),
            **tail(-1.5, 0.0, 0.0),
            **legs(FL=(-10, 40), FR=(10, 40), BL=(-10, 40), BR=(10, 40)),
        )

    def hiss(base):
        """The front up, the head high and the jaw open, the club raised: the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.01)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -8)),
            neck=t("neck", (X, -16), (Z, -10)),
            head=t("head", (X, -10), (Z, -10)),
            jaw=t("jaw", (X, 34)),
            **tail(1.2, 0.3, 0.0),
            **legs(FL=(-10, -12), FR=(-10, -12)),
        )

    def stride(phase):
        """
        The scuttle: the legs move in diagonal pairs, FL with BR and FR with
        BL, and the body bends in an S from side to side. The tail sways.
        """
        wave = math.sin(phase * 2 * math.pi)
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.006 * abs(math.cos(phase * 2 * math.pi)))),
            hips=t("hips", (Z, 10 * wave)),
            spine=t("spine", (Z, -8 * wave)),
            chest=t("chest", (Z, -8 * wave)),
            neck=t("neck", (Z, 8 * wave), (X, -4)),
            head=t("head", (Z, 4 * wave)),
            **tail(0.0, 0.6 * wave, 0.4 * wave),
        )
        steps = {}
        for leg, offset in (("FL", 0.0), ("BR", 0.0), ("FR", 0.5), ("BL", 0.5)):
            local = (phase - offset) % 1.0
            if local < 0.4:
                u = local / 0.4
                steps[leg] = (lerp(24, -24, u), 22 * math.sin(u * math.pi))
            else:
                u = (local - 0.4) / 0.6
                steps[leg] = (lerp(-24, 24, u), 0.0)
        return pose(result, **legs(**steps))

    # The attack (Pivot): it coils to its left, then whips round and sweeps
    # the club round its right side, across the front. The slash effect starts
    # at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the club comes round
    # at frame 15 of 30. It looks bored the whole time.
    def coil(base):
        return pose(
            base,
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, 10)),
            chest=t("chest", (Z, 12)),
            neck=t("neck", (Z, -8)),
            head=t("head", (Z, -8)),
            **tail(1.0, -1.4, 0.0),
            **legs(FL=(-8, 0), FR=(12, 0), BL=(10, 10), BR=(-10, 0)),
        )

    def sweep(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0.02, -0.04, 0.0)),
            hips=t("hips", (Z, 62 + 10 * follow)),
            spine=t("spine", (Z, -18)),
            chest=t("chest", (Z, -22)),
            neck=t("neck", (Z, -14)),
            head=t("head", (Z, -10)),
            jaw=t("jaw", (X, 2)),
            **tail(-0.6, 1.8 + 0.4 * follow, 0.0),
            **legs(FL=(10, 0), FR=(-14, 6), BL=(-20, 16), BR=(16, 0)),
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

    walk = Clip("walk", 20, loop=True)
    for frame in range(0, 21, 2):
        walk.key(frame, stride(frame / 20))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, coil(stand())).key(12, coil(stand()))
    attack.key(15, sweep(stand())).key(19, sweep(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, buckle(stand()))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "tailsweep-basilisk.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
