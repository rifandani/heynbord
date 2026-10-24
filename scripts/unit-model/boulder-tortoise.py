"""
Boulder Tortoise (`feral.boulderTortoise`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a giant mountain tortoise asleep,
with a high dome of a shell made of boulders, moss on the top and in the
cracks, three small pine trees on its back and a mountain goat that stands on
the top. Its wrinkled grey-brown skin has stone-like scales, its thick legs
have big dark claws, and its eyes are shut. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/boulder-tortoise.glb`;
then `bun unit-model:pack boulder-tortoise` packs it for the game.

It is a Wall, but a beast, so its body lies along Y as the other beasts do:
the camera sees the side of the dome, the head and the goat. It turns a
little to its right at rest. The bright new moss that grows over the cracks
(Regenerate) is on its right side, on the camera side, and has a bone that
scales: it swells in the cast clip. A Wall does not move, but the base clips
need `walk`: a slow plod. It has no Attack, but it has the `attack` clip: the
shell lurches forward and the head snaps. In the death clip the goat jumps
off, the head and the legs go into the shell, and the shell settles to its
left side.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

STONE = hex_color("#a99c84")
STONE_LIGHT = hex_color("#c4b89e")
STONE_DARK = hex_color("#6f6553")
MOSS = hex_color("#879a3c")
MOSS_DARK = hex_color("#5d7030")
MOSS_NEW = hex_color("#b3d24a")
SKIN = hex_color("#9a8a6e")
SKIN_DARK = hex_color("#6a5d4a")
SKIN_LIGHT = hex_color("#b8a888")
LID = hex_color("#3a3026")
CLAW = hex_color("#3a3530")
PINE = hex_color("#2f5a34")
PINE_LIGHT = hex_color("#467a40")
BARK = hex_color("#5a4030")
GOAT = hex_color("#efebe2")
GOAT_SHADE = hex_color("#cfc8ba")
GOAT_HORN = hex_color("#9c8462")
GOAT_DARK = hex_color("#2e2a26")

# --- Proportions ---------------------------------------------------------------

# The dome of the shell: an ellipsoid cut flat at its rim.
SHELL_C = Vector((0, 0.05, 0.16))
SHELL_R = Vector((0.3, 0.4, 0.38))
RIM_Z = 0.14


def on_shell(x, y, lift=0.0):
    """The point on the top of the dome above (x, y)."""
    u = 1 - (x / SHELL_R.x) ** 2 - ((y - SHELL_C.y) / SHELL_R.y) ** 2
    return Vector((x, y, SHELL_C.z + SHELL_R.z * math.sqrt(max(0.0, u)) + lift))


NECK_A = Vector((0, -0.24, 0.2))
NECK_B = Vector((0, -0.42, 0.19))
HEAD_C = Vector((0, -0.5, 0.17))
SNOUT = Vector((0, -0.62, 0.15))

LEGS = {
    # name: (x, y)
    "FL": (0.22, -0.2),
    "FR": (-0.22, -0.2),
    "BL": (0.21, 0.3),
    "BR": (-0.21, 0.3),
}
LEG_TOP = 0.2
ANKLE = 0.07

TAIL = [Vector((0, 0.44, 0.15)), Vector((0, 0.53, 0.09))]

GOAT_FEET = on_shell(0, -0.07)
GOAT_C = GOAT_FEET + Vector((0, 0, 0.11))
GOAT_NECK = GOAT_C + Vector((0, -0.055, 0.025))
GOAT_HEAD = GOAT_C + Vector((0, -0.085, 0.07))

# The bright new moss over the cracks, on the camera side (-X).
MOSS_C = Vector((-0.22, 0.02, 0.38))

TREES = [
    # (x, y, height)
    (0.11, 0.17, 0.3),
    (-0.13, 0.26, 0.22),
    (0.15, -0.12, 0.18),
]

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("body", (0, 0.3, 0.22), (0, -0.2, 0.22), "root"),
    ("neck", tuple(NECK_A), tuple(NECK_B), "body"),
    ("head", tuple(NECK_B), tuple(SNOUT), "neck"),
    ("jaw", (0, -0.46, 0.14), (0, -0.6, 0.11), "head"),
    ("tail", tuple(TAIL[0]), tuple(TAIL[1]), "body"),
    ("moss", tuple(MOSS_C), tuple(MOSS_C + Vector((-0.06, 0, 0.06))), "body"),
    ("goat", tuple(GOAT_FEET), tuple(GOAT_C), "body"),
    ("goat.head", tuple(GOAT_NECK), tuple(GOAT_HEAD), "goat"),
]
for leg, (x, y) in LEGS.items():
    BONES += [
        (f"upper.{leg}", (x, y, LEG_TOP), (x, y, ANKLE), "body"),
        (f"foot.{leg}", (x, y, ANKLE), (x, y - 0.08, 0.02), f"upper.{leg}"),
    ]

# --- Weights -------------------------------------------------------------------


def neck_weights(co):
    if co.y > -0.3:
        return blend("neck", "body", co.y, -0.3, -0.22)
    return blend("head", "neck", co.y, -0.46, -0.4)


def leg_weights(leg):
    def weights(co):
        # The top of the leg goes up under the shell, so it follows the body there.
        t = clamp01((co.z - (LEG_TOP - 0.05)) / 0.07)
        return {f"upper.{leg}": 1 - t, "body": t}

    return weights


# --- Parts ---------------------------------------------------------------------


def stone(bm, center, normal, size, squash=0.45, segments=7, rings=4):
    """A rounded boulder that lies on a surface with this `normal`."""
    geom = bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=1.0)
    shape = Matrix.Diagonal((size, size * 0.85, size * squash, 1.0))
    place = Matrix.Translation(center) @ kit._frame(Vector(normal))
    bmesh.ops.transform(bm, matrix=place @ shape, verts=geom["verts"])
    return geom["verts"]


def dome_points(count, seed, keep):
    """Points spread over the dome by a golden spiral, with the surface normal at each."""
    golden = math.pi * (3 - math.sqrt(5))
    for index in range(count):
        z = 1 - 2 * (index + 0.5) / count
        r = math.sqrt(max(0.0, 1 - z * z))
        angle = golden * (index + seed)
        direction = Vector((math.cos(angle) * r, math.sin(angle) * r, z))
        if not keep(direction):
            continue
        point = SHELL_C + Vector((direction.x * SHELL_R.x, direction.y * SHELL_R.y, direction.z * SHELL_R.z))
        normal = Vector((direction.x / SHELL_R.x, direction.y / SHELL_R.y, direction.z / SHELL_R.z)).normalized()
        yield index, direction, point, normal


def shell_parts():
    parts = []
    shell = Part("shell", STONE_DARK, "body", shade=0.25)
    verts = kit.sphere(shell.bm, SHELL_C, SHELL_R * 0.97, 16, 10)
    for vert in verts:
        vert.co.z = max(vert.co.z, RIM_Z)
    parts.append(shell)

    # The boulders of the shell: big round stones on the dome, moss on the top ones.
    stones = Part("stones", STONE, "body", shade=0.2)
    for index, direction, point, normal in dome_points(46, 0, lambda d: d.z > 0.05):
        size = 0.1 if direction.z > 0.35 else 0.085
        verts = stone(stones.bm, point, normal, size * (0.85 + 0.3 * ((index * 7) % 4) / 3))
        for face in faces_of(verts):
            up = face.normal.z
            if up > 0.75 and direction.z > 0.55 and index % 3:
                stones.paint([face], MOSS if index % 2 else MOSS_DARK)
            elif up > 0.3:
                stones.paint([face], STONE_LIGHT if index % 4 == 0 else STONE)
            else:
                stones.paint([face], STONE_DARK)
    # A ring of smaller stones round the rim.
    for step in range(18):
        angle = 2 * math.pi * step / 18
        point = Vector((SHELL_C.x + SHELL_R.x * 0.97 * math.sin(angle), SHELL_C.y - SHELL_R.y * 0.97 * math.cos(angle), RIM_Z + 0.025))
        normal = Vector((math.sin(angle), -math.cos(angle), 0.4))
        verts = stone(stones.bm, point, normal, 0.065, 0.5, 6, 4)
        stones.paint([f for f in faces_of(verts) if f.normal.z < 0.2], STONE_DARK)
    parts.append(stones)

    # Moss that hangs over the stones, and grass on the top.
    moss = Part("moss", MOSS, "body", shade=0.12)
    for index, direction, point, normal in dome_points(30, 5, lambda d: d.z > 0.45):
        verts = stone(moss.bm, point + normal * 0.03, normal, 0.06, 0.25, 6, 3)
        moss.paint(faces_of(verts), MOSS_DARK if index % 3 == 0 else MOSS)
    parts.append(moss)

    # The new moss over the cracks (Regenerate), on the camera side.
    new_moss = Part("moss.new", MOSS_NEW, "moss", shade=0.1)
    for offset in (Vector((0, 0, 0)), Vector((0.02, -0.07, 0.05)), Vector((0.03, 0.07, 0.04)), Vector((-0.02, 0.03, -0.07)), Vector((-0.01, -0.05, -0.06))):
        point = MOSS_C + offset
        normal = (point - SHELL_C)
        normal = Vector((normal.x / SHELL_R.x, normal.y / SHELL_R.y, normal.z / SHELL_R.z)).normalized()
        stone(new_moss.bm, point, normal, 0.04, 0.4, 6, 3)
        for blade in range(3):
            tip = point + normal * 0.045 + Vector((0, 0.015 * (blade - 1), 0.01))
            verts = kit.cone(new_moss.bm, point + normal * 0.01, tip, 0.008, 0.001, 3)
    parts.append(new_moss)

    # Small pine trees on the back.
    trees = Part("trees", PINE, "body", smooth=False, shade=0.25)
    for x, y, height in TREES:
        base = on_shell(x, y, -0.02)
        trunk = kit.cone(trees.bm, base, base + Vector((0, 0, height * 0.35)), 0.014, 0.01, 5)
        trees.paint(faces_of(trunk), BARK)
        for layer in range(3):
            low = base + Vector((0, 0, height * (0.22 + 0.24 * layer)))
            top = low + Vector((0, 0, height * 0.42))
            verts = kit.cone(trees.bm, low, top, height * (0.3 - 0.07 * layer), 0.002, 7)
            trees.paint([f for f in faces_of(verts) if f.normal.z > 0.6 or layer == 2], PINE_LIGHT)
    parts.append(trees)
    return parts


def body_parts():
    parts = []
    belly = Part("belly", SKIN_DARK, "body", shade=0.1)
    verts = kit.sphere(belly.bm, SHELL_C + Vector((0, 0, -0.02)), (0.27, 0.37, 0.1), 14, 6)
    for vert in verts:
        vert.co.z = max(vert.co.z, 0.07)
    parts.append(belly)

    neck = Part("neck", SKIN, neck_weights, shade=0.12)
    path = [NECK_A + Vector((0, 0.06, 0.0)), NECK_A, NECK_A.lerp(NECK_B, 0.5) + Vector((0, 0, 0.01)), NECK_B]
    verts = kit.tube(neck.bm, path, [0.1, 0.095, 0.085, 0.078], 10)
    # The thick folds of the neck.
    for along in (0.25, 0.5, 0.75):
        ring = kit.torus(neck.bm, NECK_A.lerp(NECK_B, along), NECK_B - NECK_A, 0.088 - 0.012 * along, 0.012, 12, 4)
        neck.paint(faces_of(ring), SKIN_DARK)
    parts.append(neck)

    tail = Part("tail", SKIN, "tail", shade=0.1)
    kit.cone(tail.bm, TAIL[0], TAIL[1], 0.035, 0.006, 6)
    parts.append(tail)
    return parts


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.15)
    kit.sphere(head.bm, HEAD_C, (0.09, 0.11, 0.08), 12, 8)
    kit.sphere(head.bm, SNOUT + Vector((0, 0.03, 0.01)), (0.07, 0.055, 0.055), 10, 6)
    # Big stone-like scales on the crown and the cheek, and a patch of moss.
    for center, size in (((0, -0.48, 0.245), 0.04), ((0.03, -0.53, 0.235), 0.03), ((-0.03, -0.53, 0.235), 0.03), ((0, -0.42, 0.25), 0.035)):
        verts = stone(head.bm, Vector(center), (0, -0.2, 1), size, 0.35, 6, 3)
        head.paint(faces_of(verts), SKIN_LIGHT)
    patch = stone(head.bm, Vector((-0.075, -0.46, 0.2)), (-1, 0, 0.4), 0.04, 0.3, 6, 3)
    head.paint(faces_of(patch), MOSS)
    for sign in (1, -1):
        # The heavy lid of a shut eye: a fold with a dark line under it.
        lid = kit.sphere(head.bm, HEAD_C + Vector((0.068 * sign, -0.045, 0.03)), (0.028, 0.035, 0.022), 8, 5)
        head.paint(faces_of(lid), SKIN_LIGHT)
        line = kit.cone(head.bm, HEAD_C + Vector((0.08 * sign, -0.02, 0.022)), HEAD_C + Vector((0.08 * sign, -0.075, 0.018)), 0.006, 0.004, 4)
        head.paint(faces_of(line), LID)
        nostril = kit.sphere(head.bm, SNOUT + Vector((0.022 * sign, -0.02, 0.03)), (0.008, 0.006, 0.006), 4, 3)
        head.paint(faces_of(nostril), LID)
    # The hooked beak on the upper lip.
    beak = kit.cone(head.bm, SNOUT + Vector((0, -0.01, 0.0)), SNOUT + Vector((0, -0.04, -0.03)), 0.025, 0.004, 6, squash=0.6)
    head.paint(faces_of(beak), SKIN_DARK)
    parts.append(head)

    jaw = Part("jaw", SKIN_DARK, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.54, 0.115), (0.065, 0.08, 0.03), 10, 5)
    parts.append(jaw)
    return parts


def goat_parts():
    parts = []
    goat = Part("goat", GOAT, "goat", shade=0.15)
    kit.sphere(goat.bm, GOAT_C, (0.035, 0.065, 0.04), 8, 6)
    # A shaggy coat that hangs under the belly.
    for step in range(8):
        angle = 2 * math.pi * step / 8
        base = GOAT_C + Vector((0.032 * math.cos(angle), 0.055 * math.sin(angle), -0.015))
        verts = kit.cone(goat.bm, base, base + Vector((0, 0, -0.035)), 0.013, 0.003, 4)
        goat.paint(faces_of(verts), GOAT_SHADE)
    for fx, fy in ((1, -1), (-1, -1), (1, 1), (-1, 1)):
        hip = GOAT_C + Vector((0.02 * fx, 0.045 * fy, -0.015))
        foot = GOAT_FEET + Vector((0.022 * fx, 0.045 * fy, 0.005))
        kit.cone(goat.bm, hip, foot, 0.009, 0.006, 5)
        hoof = kit.sphere(goat.bm, foot, (0.008, 0.009, 0.006), 5, 3)
        goat.paint(faces_of(hoof), GOAT_DARK)
    kit.cone(goat.bm, GOAT_C + Vector((0, 0.06, 0.02)), GOAT_C + Vector((0, 0.075, 0.035)), 0.008, 0.002, 4)
    parts.append(goat)

    head = Part("goat.head", GOAT, "goat.head", shade=0.12)
    kit.cone(head.bm, GOAT_NECK, GOAT_HEAD, 0.02, 0.016, 6)
    kit.sphere(head.bm, GOAT_HEAD + Vector((0, -0.012, 0.0)), (0.017, 0.03, 0.018), 8, 5)
    for sign in (1, -1):
        horn = kit.tube(head.bm, [GOAT_HEAD + Vector((0.008 * sign, 0.0, 0.015)), GOAT_HEAD + Vector((0.014 * sign, 0.025, 0.04)), GOAT_HEAD + Vector((0.02 * sign, 0.06, 0.035)), GOAT_HEAD + Vector((0.022 * sign, 0.07, 0.015))], [0.007, 0.006, 0.004, 0.001], 5)
        head.paint(faces_of(horn), GOAT_HORN)
        kit.cone(head.bm, GOAT_HEAD + Vector((0.012 * sign, 0.005, 0.008)), GOAT_HEAD + Vector((0.035 * sign, 0.01, 0.0)), 0.006, 0.002, 4)
        eye = kit.sphere(head.bm, GOAT_HEAD + Vector((0.015 * sign, -0.015, 0.006)), (0.003, 0.003, 0.003), 4, 3)
        head.paint(faces_of(eye), GOAT_DARK)
    beard = kit.cone(head.bm, GOAT_HEAD + Vector((0, -0.03, -0.012)), GOAT_HEAD + Vector((0, -0.028, -0.04)), 0.007, 0.001, 4)
    head.paint(faces_of(beard), GOAT_SHADE)
    nose = kit.sphere(head.bm, GOAT_HEAD + Vector((0, -0.042, -0.002)), (0.006, 0.004, 0.005), 4, 3)
    head.paint(faces_of(nose), GOAT_DARK)
    parts.append(head)
    return parts


def leg_parts():
    parts = []
    for leg, (x, y) in LEGS.items():
        out = 1 if x > 0 else -1
        upper = Part(f"upper.{leg}", SKIN, leg_weights(leg), shade=0.18)
        kit.cone(upper.bm, (x, y, LEG_TOP + 0.04), (x, y, ANKLE), 0.075, 0.085, 10)
        # Stone-like scales on the outside of the leg.
        for row in range(2):
            for column in range(3):
                angle = (column - 1) * 0.6 + (math.pi / 2 if out > 0 else -math.pi / 2)
                z = lerp(0.15, 0.1, row / 1)
                radius = lerp(0.079, 0.083, row / 1)
                point = Vector((x + radius * math.sin(angle), y - radius * math.cos(angle), z))
                verts = stone(upper.bm, point, (math.sin(angle), -math.cos(angle), 0), 0.02, 0.3, 6, 3)
                upper.paint(faces_of(verts), SKIN_LIGHT if (row + column) % 2 else SKIN_DARK)
        parts.append(upper)

        foot = Part(f"foot.{leg}", SKIN_DARK, f"foot.{leg}", shade=0.1)
        kit.cone(foot.bm, (x, y, ANKLE + 0.02), (x, y, 0.0), 0.088, 0.1, 10)
        # Big dark claws at the front of the foot.
        for spread in (-2, -1, 0, 1, 2):
            angle = spread * 0.4
            base = Vector((x + 0.09 * math.sin(angle), y - 0.09 * math.cos(angle), 0.03))
            tip = base + Vector((0.03 * math.sin(angle), -0.03 * math.cos(angle), -0.025))
            claw = kit.cone(foot.bm, base, tip, 0.016, 0.002, 5)
            foot.paint(faces_of(claw), CLAW)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("BoulderTortoise", BONES)
    parts = shell_parts() + body_parts() + head_parts() + goat_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "BoulderTortoiseMesh")
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

    def legs(**steps):
        """Leg steps: `FL=(swing, lift)`. A negative swing reaches forward; `lift` raises the foot."""
        result = {}
        for leg, (swing, lift) in steps.items():
            result[f"upper__{leg}"] = t(f"upper.{leg}", (X, swing))
            result[f"upper__{leg}_at_loc"] = at(f"upper.{leg}", (0, 0, lift))
            result[f"foot__{leg}"] = t(f"foot.{leg}", (X, -swing - 30 * lift / 0.04))
        return result

    def tucked(amount=1.0):
        """The head and the legs pulled into the shell."""
        result = {
            "neck@loc": at("neck", (0, 0.13 * amount, -0.01 * amount)),
            "neck@scale": lerp(1.0, 0.5, amount),
            "head": t("head", (X, 10 * amount)),
        }
        for leg in LEGS:
            result[f"upper.{leg}@scale"] = lerp(1.0, 0.45, amount)
        return result

    def stand(breath=0.0, sway=0.0):
        """
        Asleep: turned a little to its right, the head low near the ground.
        The shell rises and falls with each slow breath, and the goat on the
        top looks round and chews.
        """
        return {
            "body@loc": at("body", (0, 0, breath * 0.006)),
            "body": t("body", (Z, -10)),
            "neck": t("neck", (X, 4 - breath * 3)),
            "head": t("head", (X, 6 - breath * 3), (Z, sway * 3)),
            "jaw": t("jaw", (X, breath * 2)),
            "tail": t("tail", (Z, sway * 10)),
            "goat": t("goat", (Z, -10 + sway * 8)),
            "goat.head": t("goat.head", (Z, -35 + sway * 35), (X, 6 * abs(sway))),
        }

    def slump(breath=0.0):
        """Low HP: the shell sags, the chin on the ground; the goat lies down."""
        return pose(
            stand(breath * 0.6),
            body_at_loc=at("body", (0, 0, -0.025 + breath * 0.004)),
            neck=t("neck", (X, 6)),
            head=t("head", (X, 6), (Y, -6)),
            goat_at_loc=at("goat", (0, 0, -0.035)),
            goat__head=t("goat.head", (X, 30), (Z, -20)),
            # The feet stay on the ground while the shell sags.
            **legs(FL=(0, 0.03), FR=(0, 0.03), BL=(0, 0.03), BR=(0, 0.03)),
        )

    def recoil(base, amount=1.0):
        """The hit jolts the shell back; the head pulls in a little, and the goat hops."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0.03 * amount, 0.01 * amount)),
            body=t("body", (Z, -10), (X, -4 * amount), (Y, 3 * amount)),
            neck_at_loc=at("neck", (0, 0.05 * amount, 0)),
            head=t("head", (X, -14 * amount)),
            jaw=t("jaw", (X, 14 * amount)),
            goat_at_loc=at("goat", (0, 0.01 * amount, 0.07 * amount)),
            goat__head=t("goat.head", (X, -20 * amount)),
        )

    def stride(phase):
        """
        The slow plod: the legs move in diagonal pairs, FL with BR and FR with
        BL. The shell rocks from side to side, and the goat keeps its balance.
        """
        rock = math.sin(phase * 2 * math.pi)
        result = pose(
            stand(),
            body_at_loc=at("body", (0, 0, 0.008 * abs(rock))),
            body=t("body", (Z, -10), (Y, 3 * rock)),
            neck=t("neck", (X, -4), (Z, 4 * rock)),
            head=t("head", (X, 0)),
            goat=t("goat", (Z, -10), (Y, -6 * rock)),
            goat__head=t("goat.head", (Z, -20), (X, -6)),
        )
        steps = {}
        for leg, offset in (("FL", 0.0), ("BR", 0.0), ("FR", 0.5), ("BL", 0.5)):
            local = (phase - offset) % 1.0
            if local < 0.5:
                u = local / 0.5
                steps[leg] = (lerp(12, -12, u), 0.04 * math.sin(u * math.pi))
            else:
                u = (local - 0.5) / 0.5
                steps[leg] = (lerp(-12, 12, u), 0.0)
        result = pose(result, **legs(**steps))
        return result

    # The attack: it has no Attack, but the clip is there. The shell lurches
    # forward and the head snaps out at frame 15 of 30, as `MELEE_IMPACT`.
    def gather(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.04, 0.01)),
            body=t("body", (Z, -10), (X, -5)),
            neck_at_loc=at("neck", (0, 0.06, 0)),
            head=t("head", (X, -10)),
            goat_at_loc=at("goat", (0, 0.0, 0.02)),
            goat__head=t("goat.head", (X, -16), (Z, -10)),
        )

    def lurch(base, bite=1.0):
        return pose(
            base,
            body_at_loc=at("body", (0, -0.09, 0.012)),
            body=t("body", (Z, -10), (X, 3)),
            neck_at_loc=at("neck", (0, -0.06, 0.02)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -6)),
            jaw=t("jaw", (X, 30 * (1 - bite))),
            goat=t("goat", (Z, -10), (X, -18)),
            goat_at_loc=at("goat", (0, 0.03, 0.03)),
            goat__head=t("goat.head", (X, 24), (Z, -20)),
            **legs(FL=(-10, 0.045), FR=(-10, 0.045), BL=(16, 0.0), BR=(16, 0.0)),
        )

    def wake(base, amount=1.0):
        """Regenerate: a long yawn, the head up, while the new moss swells."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0, 0.01 * amount)),
            neck=t("neck", (X, -12 * amount)),
            head=t("head", (X, -16 * amount), (Z, -8 * amount)),
            jaw=t("jaw", (X, 34 * amount)),
            moss_at_scale=1.0 + 0.8 * amount,
            goat__head=t("goat.head", (Z, -60), (X, 34 * amount)),
        )

    clips = []
    idle = Clip("idle", 72, loop=True)
    for frame, breath, sway in ((0, 0, 0), (18, 0.5, 1), (36, 1, 0), (54, 0.5, -1), (72, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low_hp = Clip("lowHp", 72, loop=True)
    for frame, breath in ((0, 0), (36, 1), (72, 0)):
        low_hp.key(frame, slump(breath))
    clips.append(low_hp)

    walk = Clip("walk", 36, loop=True)
    for frame in range(0, 37, 3):
        walk.key(frame, stride(frame / 36))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(8, gather(stand())).key(12, lurch(stand(), 0.0))
    attack.key(15, lurch(stand())).key(19, lurch(stand())).key(26, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 30)
    cast.key(0, stand()).key(8, wake(stand(), 0.7)).key(13, wake(stand()))
    cast.key(18, wake(stand(), 0.6)).key(22, wake(stand(), 0.9)).key(30, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    # The goat leaps off the back and goes; the head and the legs go in; the
    # shell settles onto its rim and tips to its left side.
    def gone_goat(base, leap):
        return pose(
            base,
            goat_at_loc=at("goat", (0.02 * leap, 0.3 * leap, 0.25 * leap * (2 - leap))),
            goat=t("goat", (Z, -10), (X, -40 * leap)),
            goat_at_scale=lerp(1.0, 0.02, clamp01((leap - 0.6) / 0.4)),
        )

    def settled(base, tip=1.0):
        return pose(
            base,
            **tucked(),
            body_at_loc=at("body", (0, 0, -0.055)),
            root=t("root", (Y, 10 * tip)),
        )

    death = Clip("death", 36)
    death.key(0, stand()).key(4, recoil(stand()))
    death.key(10, gone_goat(pose(recoil(stand(), 0.5), **tucked(0.6)), 0.4))
    death.key(18, gone_goat(settled(stand(), 0.0), 0.9))
    death.key(22, gone_goat(settled(stand(), 0.0), 1.0))
    death.key(30, gone_goat(settled(stand(), 1.2), 1.0)).key(36, gone_goat(settled(stand()), 1.0))
    clips.append(death)

    # The summon: it rises tucked in, the head comes out, and the goat lands on the top.
    def dropped_goat(base, drop):
        return pose(base, goat_at_loc=at("goat", (0, 0, 0.3 * drop)), goat_at_scale=lerp(1.0, 0.02, clamp01((drop - 0.6) / 0.4)))

    summon = Clip("summon", 24)
    summon.key(0, dropped_goat(settled(stand(), 0.0), 1.0)).key(8, dropped_goat(pose(stand(), **tucked()), 0.8))
    summon.key(13, dropped_goat(wake(stand(), 0.5), 0.4)).key(16, wake(stand(), 0.4))
    summon.key(18, pose(wake(stand(), 0.2), goat_at_loc=at("goat", (0, 0, -0.012)))).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "boulder-tortoise.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
