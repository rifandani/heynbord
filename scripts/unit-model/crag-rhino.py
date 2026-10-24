"""
Crag Rhino (`feral.cragRhino`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a woolly mountain rhino with
grey-brown hide, plates of stone along its back, a shaggy brown mane, a low
heavy head with a small second horn and a big stone-grey horn that curves
up and back. A broken blue shield with a gold boss is stuck on the big horn.
Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/crag-rhino.glb`; then
`bun unit-model:pack crag-rhino` packs it for the game.

The figure faces -Y like the other Unit Models, so its body lies along Y. The
legs are named FL, FR, BL and BR (front and back, left and right). The Battle
camera sees the right side of a player Unit, so the face of the shield turns
to its right. It has Trample, so its walk is a heavy trot and its attack is a
charge with the head low that tosses the horn up through the enemy. In the
death clip it falls on its left side (`(Y, +84)` on the root), so the legs
turn to the camera side (-X). It has no Keyword that it uses by its own
action, so it has no cast clip.
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

HIDE = hex_color("#7d6d5c")
HIDE_DARK = hex_color("#56493d")
STONE = hex_color("#9b958a")
STONE_DARK = hex_color("#6c675f")
MOSS = hex_color("#7d8a3c")
FUR = hex_color("#8a5e3c")
FUR_LIGHT = hex_color("#b98c5e")
FUR_DARK = hex_color("#5c3a22")
HORN = hex_color("#c2b9a6")
HORN_DARK = hex_color("#7f776a")
EYE = hex_color("#1c140e")
EYE_RIM = hex_color("#b08a5a")
NOSE = hex_color("#3a302a")
HOOF = hex_color("#3e352c")
SHIELD = hex_color("#30528c")
SHIELD_DARK = hex_color("#1f3560")
RIM = hex_color("#6e6656")
BOSS = hex_color("#c99d4a")
WOOD = hex_color("#8a6440")

# --- Proportions ---------------------------------------------------------------

HIP = Vector((0, 0.24, 0.4))
MID = Vector((0, 0.05, 0.44))
CHEST = Vector((0, -0.13, 0.46))
NECK = Vector((0, -0.26, 0.44))
# The head hangs low and forward: from the top of the neck down to the snout.
SNOUT = Vector((0, -0.53, 0.25))
HEAD_C = Vector((0, -0.37, 0.36))

# The big horn: from the snout up and forward, the tip curves back.
HORN_PATH = [Vector((0, -0.49, 0.3)), Vector((0, -0.53, 0.38)), Vector((0, -0.56, 0.48)), Vector((0, -0.55, 0.58)), Vector((0, -0.5, 0.66))]
SMALL_HORN = [Vector((0, -0.41, 0.4)), Vector((0, -0.425, 0.45)), Vector((0, -0.42, 0.49))]
# The broken shield, pierced through its boss by the horn, its face to the camera side.
SHIELD_C = Vector((-0.02, -0.555, 0.47))
SHIELD_N = Vector((-1.0, -0.35, 0.15)).normalized()
# The head is big, so it reads on the Board: the parts are made at a small
# size and then scaled about the top of the neck.
HEAD_SCALE = 1.3


def grown(point):
    return NECK + (Vector(point) - NECK) * HEAD_SCALE


LEGS = {
    # name: (top, joint, ankle, toe, parent)
    "FL": (Vector((0.12, -0.14, 0.38)), Vector((0.12, -0.15, 0.21)), Vector((0.12, -0.15, 0.07)), Vector((0.12, -0.22, 0.03)), "chest"),
    "FR": (Vector((-0.12, -0.14, 0.38)), Vector((-0.12, -0.15, 0.21)), Vector((-0.12, -0.15, 0.07)), Vector((-0.12, -0.22, 0.03)), "chest"),
    "BL": (Vector((0.11, 0.25, 0.36)), Vector((0.11, 0.27, 0.2)), Vector((0.11, 0.26, 0.07)), Vector((0.11, 0.19, 0.03)), "hips"),
    "BR": (Vector((-0.11, 0.25, 0.36)), Vector((-0.11, 0.27, 0.2)), Vector((-0.11, 0.26, 0.07)), Vector((-0.11, 0.19, 0.03)), "hips"),
}

TAIL = [Vector((0, 0.41, 0.46)), Vector((0, 0.45, 0.33))]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", tuple(HIP), tuple(MID), "root"),
    ("spine", tuple(MID), tuple(CHEST), "hips"),
    ("chest", tuple(CHEST), tuple(NECK), "spine"),
    ("head", tuple(NECK), tuple(grown(SNOUT)), "chest"),
    ("ear.L", tuple(grown((0.075, -0.29, 0.5))), tuple(grown((0.1, -0.26, 0.56))), "head"),
    ("ear.R", tuple(grown((-0.075, -0.29, 0.5))), tuple(grown((-0.1, -0.26, 0.56))), "head"),
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
    """Along the body: the hips at the back, the spine in the middle, the chest at the front, the head in front of it."""
    if co.y > 0.14:
        return blend("spine", "hips", co.y, 0.1, 0.2)
    if co.y > -0.06:
        return blend("chest", "spine", co.y, -0.06, 0.06)
    return blend("chest", "head", co.y, -0.22, -0.32)


def leg_weights(leg):
    top, _joint, _ankle, _toe, parent = LEGS[leg]

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01((co.z - (top.z - 0.06)) / 0.08)
        return {f"upper.{leg}": 1 - t, parent: t}

    return weights


# --- Parts ---------------------------------------------------------------------


def hide_color(face, center):
    """Thick hide in large shapes: light on the top, dark underneath."""
    if face.normal.z < -0.3:
        return HIDE_DARK
    return HIDE


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
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.42, 0.004, 4)
        part.paint(faces_of(verts), colors[1] if direction.z > 0.6 and index % 2 else (colors[0] if index % 3 else colors[2]))


def plates(part, center, radii, count, size, seed=0, only=None):
    """Plates of stone that lie on an ellipsoid, as the rocky back of the painting; some have moss."""
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
        base = center + Vector((direction.x * radii[0], direction.y * radii[1], direction.z * radii[2])) * 0.99
        side = normal.cross(Y if abs(normal.dot(Y)) < 0.9 else X).normalized()
        along = side.cross(normal).normalized()
        scale = size * (0.75 + 0.5 * ((index * 5) % 4) / 3)
        verts = kit.slab(part.bm, base, side * scale, along * scale * 0.85, normal * scale * 0.22)
        for face in faces_of(verts):
            if face.normal.dot(normal) > 0.7:
                part.paint([face], MOSS if index % 4 == 0 else STONE)
            else:
                part.paint([face], STONE_DARK)


def body_parts():
    parts = []
    body = Part("body", hide_color, body_weights, shade=0.22)
    # The high shoulders, the barrel and the hindquarters, and a thick neck.
    kit.sphere(body.bm, (0, -0.1, 0.46), (0.22, 0.22, 0.22), 14, 10)
    kit.sphere(body.bm, (0, 0.08, 0.43), (0.21, 0.22, 0.19), 12, 8)
    kit.sphere(body.bm, (0, 0.25, 0.41), (0.18, 0.16, 0.17), 12, 8)
    kit.sphere(body.bm, (0, -0.25, 0.43), (0.15, 0.12, 0.15), 10, 8)
    parts.append(body)

    rocks = Part("plates", STONE, body_weights, smooth=False, shade=0.12)
    plates(rocks, (0, -0.05, 0.47), (0.21, 0.2, 0.21), 30, 0.055, 0, lambda d: d.z > 0.35 and d.y > -0.4)
    plates(rocks, (0, 0.12, 0.44), (0.2, 0.21, 0.18), 26, 0.055, 2, lambda d: d.z > 0.35)
    plates(rocks, (0, 0.27, 0.42), (0.17, 0.15, 0.16), 16, 0.05, 4, lambda d: d.z > 0.35)
    parts.append(rocks)

    fur = Part("fur", FUR, body_weights, shade=0.12)
    # The shaggy mane on the neck and the shoulders, in front of the plates.
    locks(fur, (0, -0.2, 0.5), (0.15, 0.13, 0.14), 56, 0.13, 0, lambda d: d.z > -0.3, (FUR, FUR_LIGHT, FUR_DARK))
    # Long fur hangs from the flanks and the belly, a fringe under the plates.
    locks(fur, (0, 0.04, 0.44), (0.21, 0.26, 0.18), 70, 0.11, 3, lambda d: -0.6 < d.z < 0.35, (FUR_DARK, FUR, FUR_DARK))
    parts.append(fur)

    tail = Part("tail", HIDE_DARK, "tail", shade=0.1)
    kit.tube(tail.bm, [TAIL[0], TAIL[1]], [0.018, 0.012], 5)
    tuft = Part("tail.tuft", FUR_DARK, "tail", shade=0.1)
    locks(tuft, TAIL[1], (0.015, 0.015, 0.02), 8, 0.05, 1)
    parts += [tail, tuft]
    return parts


def head_parts():
    parts = []
    head = Part("head", hide_color, "head", shade=0.14)
    # A long, heavy wedge of a head that tapers to a broad snout.
    kit.sphere(head.bm, HEAD_C + Vector((0, 0.04, 0.03)), (0.1, 0.1, 0.1), 12, 8)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.07, -0.04)), (0.085, 0.09, 0.08), 12, 8)
    kit.sphere(head.bm, SNOUT + Vector((0, 0.05, 0.03)), (0.075, 0.06, 0.06), 10, 6)
    # Fur on the cheeks and the jaw, as the painting has.
    locks(head, HEAD_C + Vector((0, 0.02, -0.02)), (0.1, 0.1, 0.09), 20, 0.06, 2, lambda d: abs(d.x) > 0.4 and d.z < 0.4)
    for sign in (1, -1):
        rim = kit.sphere(head.bm, HEAD_C + Vector((0.083 * sign, -0.04, 0.02)), (0.02, 0.022, 0.018), 6, 4)
        head.paint(faces_of(rim), EYE_RIM)
        eye = kit.sphere(head.bm, HEAD_C + Vector((0.093 * sign, -0.045, 0.02)), (0.011, 0.012, 0.011), 6, 4)
        head.paint(faces_of(eye), EYE)
        brow = kit.sphere(head.bm, HEAD_C + Vector((0.08 * sign, -0.04, 0.045)), (0.03, 0.03, 0.012), 6, 4)
        head.paint(faces_of(brow), HIDE_DARK)
        nostril = kit.sphere(head.bm, SNOUT + Vector((0.04 * sign, -0.0, 0.02)), (0.014, 0.012, 0.014), 6, 4)
        head.paint(faces_of(nostril), NOSE)
    lip = kit.sphere(head.bm, SNOUT + Vector((0, 0.01, -0.025)), (0.06, 0.04, 0.02), 8, 4)
    head.paint(faces_of(lip), HIDE_DARK)
    parts.append(head)

    horns = Part("horns", HORN, "head", shade=0.16)
    verts = kit.tube(horns.bm, HORN_PATH, [0.055, 0.045, 0.033, 0.019, 0.003], 9)
    for face in faces_of(verts):
        if face.calc_center_median().z < 0.36:
            horns.paint([face], HORN_DARK)
    verts = kit.tube(horns.bm, SMALL_HORN, [0.028, 0.018, 0.003], 7)
    parts.append(horns)

    # The broken shield on the horn: a round board with an iron rim, a gold
    # boss pierced by the horn, and planks that broke off at the bottom.
    shield = Part("shield", SHIELD, "head", smooth=False, shade=0.08)
    face_dir = SHIELD_N
    up = (Z - face_dir * face_dir.dot(Z)).normalized()
    side = up.cross(face_dir).normalized()
    radius = 0.1
    segments = 12
    front, back = [], []
    for step in range(segments):
        angle = 2 * math.pi * step / segments
        # A bite out of the lower rim: the shield broke there.
        bite = 0.55 if step in (7, 8) else 1.0
        offset = (side * math.cos(angle) + up * math.sin(angle)) * radius * bite
        front.append(shield.bm.verts.new(SHIELD_C + offset + face_dir * 0.008))
        back.append(shield.bm.verts.new(SHIELD_C + offset - face_dir * 0.008))
    center_front = shield.bm.verts.new(SHIELD_C + face_dir * 0.014)
    center_back = shield.bm.verts.new(SHIELD_C - face_dir * 0.008)
    for step in range(segments):
        n = (step + 1) % segments
        face = shield.bm.faces.new((center_front, front[step], front[n]))
        shield.paint([face], SHIELD if step % 3 else SHIELD_DARK)
        shield.bm.faces.new((center_back, back[n], back[step]))
        rim = shield.bm.faces.new((front[n], front[step], back[step], back[n]))
        shield.paint([rim], RIM)
    kit.bmesh.ops.recalc_face_normals(shield.bm, faces=list(shield.bm.faces))
    rim_ring = kit.torus(shield.bm, SHIELD_C + face_dir * 0.01, face_dir, radius * 0.94, 0.008, 12, 3)
    shield.paint(faces_of(rim_ring), RIM)
    boss = kit.sphere(shield.bm, SHIELD_C + face_dir * 0.016, (0.03, 0.03, 0.03), 8, 5)
    shield.paint(faces_of(boss), BOSS)
    # Splinters where it broke.
    for angle, length in ((3.9, 0.06), (4.4, 0.05), (4.9, 0.07)):
        root = SHIELD_C + (side * math.cos(angle) + up * math.sin(angle)) * radius * 0.6
        tip = root + (side * math.cos(angle) + up * math.sin(angle)) * length
        splinter = kit.cone(shield.bm, root, tip, 0.012, 0.002, 4, squash=0.4)
        shield.paint(faces_of(splinter), WOOD)
    parts.append(shield)

    for side_name, sign in (("L", 1), ("R", -1)):
        ear = Part(f"ear.{side_name}", HIDE, f"ear.{side_name}", shade=0.12)
        kit.cone(ear.bm, (0.075 * sign, -0.29, 0.48), (0.105 * sign, -0.25, 0.57), 0.028, 0.004, 6, squash=0.5)
        locks(ear, (0.085 * sign, -0.28, 0.51), (0.02, 0.02, 0.03), 5, 0.035, 2)
        parts.append(ear)
    grow = kit.Matrix.Translation(NECK) @ kit.Matrix.Scale(HEAD_SCALE, 4) @ kit.Matrix.Translation(-NECK)
    for part in parts:
        kit.bmesh.ops.transform(part.bm, matrix=grow, verts=list(part.bm.verts))
    return parts


def leg_parts():
    parts = []
    for leg, (top, joint, ankle, _toe, _parent) in LEGS.items():
        upper = Part(f"upper.{leg}", HIDE, leg_weights(leg), shade=0.15)
        kit.cone(upper.bm, top + Vector((0, 0, 0.05)), joint, 0.095, 0.072, 9)
        locks(upper, top.lerp(joint, 0.4), (0.09, 0.09, 0.08), 12, 0.08, 1, lambda d: d.z < 0.4, (FUR_DARK, FUR, FUR_DARK))
        parts.append(upper)

        lower = Part(f"lower.{leg}", HIDE_DARK, f"lower.{leg}", shade=0.15)
        kit.cone(lower.bm, joint, ankle, 0.07, 0.065, 9)
        # Shaggy fur round the top of the shin.
        locks(lower, joint.lerp(ankle, 0.2), (0.07, 0.07, 0.05), 10, 0.06, 5, lambda d: d.z > -0.3)
        parts.append(lower)

        foot = Part(f"foot.{leg}", HIDE_DARK, f"foot.{leg}", shade=0.1)
        kit.cone(foot.bm, Vector((ankle.x, ankle.y, 0.08)), Vector((ankle.x, ankle.y, 0.0)), 0.066, 0.074, 10)
        # Three broad hoof toes at the front of the foot.
        for spread in (-1, 0, 1):
            angle = spread * 0.6
            toe = kit.sphere(foot.bm, Vector((ankle.x + 0.068 * math.sin(angle), ankle.y - 0.068 * math.cos(angle), 0.022)), (0.022, 0.016, 0.022), 6, 4)
            foot.paint(faces_of(toe), HOOF)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CragRhino", BONES)
    parts = body_parts() + head_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CragRhinoMesh")
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
            "ear.L": t("ear.L", (Z, 25 * flick)),
            "ear.R": t("ear.R", (Z, -25 * flick)),
        }

    def stand(breath=0.0, sway=0.0):
        """The idle stance: turned a little to the camera, the head low, it snorts and the ears flick."""
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.004)),
            "hips": t("hips", (Z, -8)),
            "spine": t("spine", (X, -breath * 1.5)),
            "chest": t("chest", (X, breath * 1.5), (Z, sway * 2)),
            "head": t("head", (Z, -6 + sway * 5), (X, -2 + breath * 4), (Y, sway * 3)),
            **ears(0.2 + 0.6 * max(0.0, sway)),
            "tail": t("tail", (Z, sway * 25), (X, -breath * 6)),
        }

    def gasp(breath=0.0):
        """Low HP: the legs give a little, and the heavy head hangs to the ground."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.003 - breath * 0.003)),
            spine=t("spine", (X, 3)),
            chest=t("chest", (X, 4 + breath * 2)),
            head=t("head", (X, 8 + breath * 3), (Y, -6)),
            **ears(-0.4),
            tail=t("tail", (X, 10)),
            **legs(FL=(-4, 14, -10), FR=(4, 12, -16), BL=(-6, 12, -6), BR=(-6, 12, -6)),
        )

    def recoil(base, amount=1.0):
        """The hit throws the head up and the body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, 0.0)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (X, -16 * amount), (Z, 10 * amount)),
            **ears(amount),
            tail=t("tail", (X, -20 * amount)),
        )

    def buckle(base):
        """The front legs give way first."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.005)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 6)),
            **ears(0.5),
            **legs(FL=(-20, 50, -30), FR=(-10, 44, -30), BL=(-24, 36, -10), BR=(-20, 36, -10)),
        )

    def fallen(base, bounce=0.0):
        """
        On its left side, the legs stiff and out. The Battle camera sees the
        right side of a player Unit (-X), so it sees the legs and the belly.
        """
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            root_at_loc=at("root", (-0.36, 0, 0.2)),
            chest=t("chest", (X, 4)),
            head=t("head", (X, 8), (Y, 10)),
            **ears(-0.4),
            tail=t("tail", (X, -10)),
            **legs(FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)),
        )

    def low(base):
        """Down low with the legs folded, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.06)),
            chest=t("chest", (X, 2)),
            head=t("head", (X, -6)),
            **ears(-0.4),
            **legs(FL=(-50, 100, -50), FR=(-50, 100, -50), BL=(-60, 90, -30), BR=(-60, 90, -30)),
        )

    def snort(base, rear=1.0):
        """The head tossed up: a snort. The front lifts a little with `rear`."""
        return pose(
            base,
            hips=t("hips", (Z, -8), (X, -8 * rear)),
            hips_at_loc=at("hips", (0, 0.02 * rear, 0.0)),
            chest=t("chest", (X, -4 * rear)),
            head=t("head", (Z, -4), (X, -24)),
            **ears(1.0),
            tail=t("tail", (X, -24)),
            **legs(FL=(-20 * rear, 36 * rear, -14 * rear), FR=(-6 * rear, 20 * rear, -14 * rear), BL=(6 * rear, 0, 0), BR=(8 * rear, 0, 0)),
        )

    def stride(phase):
        """
        The trot: the legs move in diagonal pairs, FL with BR and FR with BL.
        `phase` 0 to 1 is one cycle. The body bobs at each step.
        """
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.012 * abs(math.sin(phase * 2 * math.pi)) - 0.006)),
            chest=t("chest", (Y, 2 * math.sin(phase * 2 * math.pi))),
            head=t("head", (Z, -6), (X, 2 + 4 * math.sin(phase * 4 * math.pi))),
            tail=t("tail", (Z, 16 * math.sin(phase * 2 * math.pi)), (X, -10)),
        )
        for leg, offset in (("FL", 0.0), ("BR", 0.0), ("FR", 0.5), ("BL", 0.5)):
            local = (phase - offset) % 1.0
            # The first 40% of the cycle in the air, the rest on the ground, pushed back.
            if local < 0.4:
                u = local / 0.4
                swing = lerp(20, -20, u)
                lift = math.sin(u * math.pi)
            else:
                u = (local - 0.4) / 0.6
                swing = lerp(-20, 20, u)
                lift = 0.0
            back = leg.startswith("B")
            bend = (36 if back else 48) * lift
            result = pose(result, **legs(**{leg: (swing - 10 * lift, bend, 10 * lift - swing - bend)}))
        return result

    # The attack (Trample): it paws, lowers its head and charges, then tosses
    # the horn up through the enemy. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the horn hooks up at frame 15 of 30.
    def paw(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, 0.0)),
            chest=t("chest", (X, 4)),
            head=t("head", (Z, -4), (X, 10)),
            **ears(1.0),
            tail=t("tail", (X, -20)),
            **legs(FL=(-10, 16, -6), FR=(-30, 60, -10), BL=(-12, 18, -6), BR=(-10, 16, -6)),
        )

    def charge(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.1, 0.02)),
            hips=t("hips", (Z, -8), (X, 2)),
            chest=t("chest", (X, 4)),
            head=t("head", (Z, -4), (X, 12)),
            **ears(1.0),
            tail=t("tail", (X, -40)),
            **legs(FL=(-34, 30, 0), FR=(-20, 24, -4), BL=(30, 0, -26), BR=(24, -4, -24)),
        )

    def toss(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.17 - 0.02 * follow, 0.04)),
            hips=t("hips", (Z, -8), (X, -6)),
            chest=t("chest", (X, -6)),
            head=t("head", (Z, -4), (X, -28 - 6 * follow)),
            **ears(1.0),
            tail=t("tail", (X, -30)),
            **legs(FL=(-30, 30, 0), FR=(-16, 20, -4), BL=(24, 0, -24), BR=(30, -4, -26)),
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
    attack.key(0, stand()).key(5, paw(stand())).key(10, charge(stand()))
    attack.key(15, toss(stand())).key(19, toss(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(14, buckle(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, low(stand())).key(8, low(stand())).key(15, snort(stand())).key(19, snort(stand(), 0.6))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "crag-rhino.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
