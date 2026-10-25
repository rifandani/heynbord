"""
Mesa Pit-Fighter (`orc.mesaPitFighter`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a tall, strong orc woman with a
grin and one broken tusk, a wild black mane under a red headband, a red top
with leather straps, a belt with a brass boss, a ragged red pit sash, brass
trophy bells and a small skull on the right hip, red leg wraps, iron knee
guards and heavy boots. Her fists are in huge iron gauntlets with a large
hook, and tally marks on the gauntlets count her attackers. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/mesa-pit-fighter.glb`; then
`bun unit-model:pack mesa-pit-fighter` packs it for the game.

She stands as a boxer, the left foot in front, so her right fist is on the
camera side, and her attack is a right cross. She is Heavy, so her walk is a
slow stomp. Retaliate has no attack event, so her hurt clip shows it: she
takes the hit on her guard and throws a short counter-punch. She has no
Keyword that she uses by her own action, so she has no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#9aa24a")
SKIN_DARK = hex_color("#737a32")
HAIR = hex_color("#2a201c")
HAIR_LIGHT = hex_color("#46362e")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#4e1a16")
TOOTH = hex_color("#f1e8cc")
RED = hex_color("#b8342a")
RED_DARK = hex_color("#741e1a")
LEATHER = hex_color("#6a4228")
LEATHER_DARK = hex_color("#3e2818")
IRON = hex_color("#77736c")
IRON_DARK = hex_color("#4a4743")
STEEL = hex_color("#b4b0a6")
TALLY = hex_color("#ece4d2")
BRASS = hex_color("#d0a046")
BRASS_DARK = hex_color("#906a2a")
BONE = hex_color("#e4d8b8")

# --- Proportions ---------------------------------------------------------------

# A tall, strong figure: broad shoulders, a narrow waist and long legs.
HIP_Z = 0.48
WAIST_Z = 0.56
CHEST_Z = 0.65
SHOULDER_Z = 0.735
NECK_Z = 0.765
HEAD_C = Vector((0, -0.016, 0.858))
KNEE_Z = 0.27
ANKLE_Z = 0.055
LEG_X = 0.068

# The arms hang a little out from the body. These are the rest (bind) positions.
SL = Vector((0.16, 0, SHOULDER_Z))
EL = Vector((0.215, 0.01, 0.585))
WL = Vector((0.24, -0.01, 0.45))
SR = Vector((-SL.x, SL.y, SL.z))
ER = Vector((-EL.x, EL.y, EL.z))
WR = Vector((-WL.x, WL.y, WL.z))
TL = WL + (WL - EL).normalized() * 0.06
TR = WR + (WR - ER).normalized() * 0.06

BELLS = Vector((-0.12, -0.06, 0.46))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.008, NECK_Z), (0, -0.012, 0.8), "chest"),
    ("head", (0, -0.012, 0.8), (0, -0.016, 0.95), "neck"),
    # The mane and the tails of the headband hang down the back.
    ("hair", (0, 0.06, 0.86), (0, 0.1, 0.68), "head"),
    ("cloth.F", (0, -0.1, 0.47), (0, -0.11, 0.28), "hips"),
    ("cloth.B", (0, 0.1, 0.47), (0, 0.11, 0.28), "hips"),
    ("bells", tuple(BELLS), tuple(BELLS - Vector((0, 0, 0.08))), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.03 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.1, 0.02), f"shin.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z + 0.01:
        return blend("hips", "spine", co.z, 0.5, 0.6)
    return blend("spine", "chest", co.z, 0.62, 0.69)


def hair_weights(co):
    return blend("hair", "head", co.z, 0.76, 0.84)


def sash_weights(bone):
    def weights(co):
        return blend(bone, "hips", co.z, 0.42, 0.47)

    return weights


def skirt_weights(co):
    """The skirt follows the hips at the top, and the thighs lower."""
    t = clamp01((0.47 - co.z) / 0.16)
    side = co.x / 0.1
    return {
        "hips": 1 - t * 0.8,
        "thigh.L": t * clamp01(side) * 0.8,
        "thigh.R": t * clamp01(-side) * 0.8,
    }


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.12)
    kit.sphere(head.bm, HEAD_C, (0.066, 0.068, 0.07), 12, 9)
    # A strong jaw, a broad nose and long orc ears.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.042)), (0.058, 0.048, 0.036), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.064, 0.002)), HEAD_C + Vector((0, -0.08, -0.016)), 0.017, 0.007, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.062 * sign, 0.008, 0.004)), HEAD_C + Vector((0.135 * sign, 0.04, 0.04)), 0.02, 0.002, 5, squash=0.4)
        ring = kit.torus(head.bm, HEAD_C + Vector((0.078 * sign, 0.014, -0.012)), (1, 0, 0), 0.01, 0.003, 8, 3)
        head.paint(faces_of(ring), BRASS)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.026 * sign, -0.062, 0.014)), (0.009, 0.006, 0.007), 6, 4)
        brow = kit.box(face.bm, HEAD_C + Vector((0.028 * sign, -0.066, 0.03)), (0.03, 0.012, 0.009))
        face.paint(faces_of(brow), HAIR)
    # The grin: a wide mouth with a row of teeth.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.068, -0.036)), (0.034, 0.012, 0.014), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    teeth = kit.box(face.bm, HEAD_C + Vector((0, -0.078, -0.03)), (0.044, 0.006, 0.008))
    face.paint(faces_of(teeth), TOOTH)
    parts.append(face)

    # One whole tusk (left), and the broken one on the camera side (right).
    tusks = Part("tusks", TOOTH, "head", shade=0.05)
    kit.cone(tusks.bm, HEAD_C + Vector((0.03, -0.07, -0.05)), HEAD_C + Vector((0.04, -0.08, -0.004)), 0.01, 0.001, 5)
    kit.cone(tusks.bm, HEAD_C + Vector((-0.03, -0.07, -0.05)), HEAD_C + Vector((-0.034, -0.076, -0.03)), 0.01, 0.007, 5)
    parts.append(tusks)

    # A wild black mane: a cap, spiky locks on top, and a mass down the back.
    hair = Part("hair", HAIR, hair_weights, shade=0.14)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.014)), (0.074, 0.074, 0.074), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.y < -0.03 and v.co.z < HEAD_C.z + 0.035], context="VERTS")
    for index, (x, y, lift) in enumerate(((0.0, 0.0, 0.07), (0.04, 0.02, 0.05), (-0.04, 0.02, 0.05), (0.02, 0.05, 0.04), (-0.02, 0.05, 0.04))):
        root = HEAD_C + Vector((x, y, 0.06))
        lock = kit.cone(hair.bm, root, root + Vector((x * 0.8, 0.04 + y, lift)), 0.03, 0.002, 5)
        if index % 2:
            hair.paint(faces_of(lock), HAIR_LIGHT)
    mane = kit.tube(
        hair.bm,
        [HEAD_C + Vector((0, 0.045, 0.03)), HEAD_C + Vector((0, 0.085, -0.04)), HEAD_C + Vector((0, 0.1, -0.13)), HEAD_C + Vector((0, 0.11, -0.2))],
        [0.06, 0.07, 0.05, 0.012],
        8,
    )
    for face in faces_of(mane):
        if int(face.calc_center_median().z * 60) % 3 == 0:
            hair.paint([face], HAIR_LIGHT)
    for sign in (1, -1):
        kit.tube(
            hair.bm,
            [HEAD_C + Vector((0.055 * sign, 0.02, 0.0)), HEAD_C + Vector((0.075 * sign, 0.05, -0.08)), HEAD_C + Vector((0.07 * sign, 0.08, -0.16))],
            [0.025, 0.022, 0.004],
            5,
        )
    parts.append(hair)

    # The red headband, with two tails that hang down the back.
    band = Part("band", RED, hair_weights, shade=0.06)
    kit.torus(band.bm, HEAD_C + Vector((0, 0.004, 0.035)), (0, 0.15, 1), 0.07, 0.011, 14, 4)
    for dx, length in ((0.018, 0.2), (-0.016, 0.16)):
        top = HEAD_C + Vector((dx, 0.075, 0.03))
        tail = kit.tube(band.bm, [top, top + Vector((dx, 0.05, -length * 0.5)), top + Vector((dx * 2, 0.07, -length))], [0.012, 0.011, 0.005], 4)
        band.paint(faces_of(tail), RED_DARK)
    parts.append(band)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.006, 0.73), (0, -0.012, 0.81), 0.044, 0.04, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # Bare skin from the hips to the shoulders: the belly, the chest and the shoulders.
    body = Part("body", SKIN, torso_weights, shade=0.14)
    kit.cone(body.bm, (0, 0.0, 0.47), (0, -0.004, 0.6), 0.1, 0.082, 12, squash=0.72)
    kit.sphere(body.bm, (0, 0.0, 0.67), (0.135, 0.08, 0.085), 12, 8)
    # Strong shoulders.
    for sign in (1, -1):
        kit.sphere(body.bm, (0.1 * sign, 0.005, 0.715), (0.065, 0.06, 0.05), 8, 6)
    # The muscles of the belly.
    abs_ = kit.box(body.bm, (0, -0.058, 0.555), (0.07, 0.02, 0.08))
    body.paint(faces_of(abs_), SKIN_DARK)
    parts.append(body)

    # The red top, with a dark trim.
    top = Part("top", RED, "chest", shade=0.1)
    for sign in (1, -1):
        cup = kit.sphere(top.bm, (0.048 * sign, -0.058, 0.655), (0.058, 0.045, 0.048), 10, 6)
        top.paint({f for f in faces_of(cup) if f.calc_center_median().z < 0.625}, RED_DARK)
    kit.cone(top.bm, (0, -0.005, 0.625), (0, -0.005, 0.66), 0.112, 0.118, 12, squash=0.78)
    parts.append(top)

    harness = Part("harness", LEATHER_DARK, torso_weights, shade=0.05)
    for sign in (1, -1):
        kit.tube(harness.bm, [(0.12 * sign, 0.0, 0.73), (0.06 * sign, -0.085, 0.68), (-0.02 * sign, -0.1, 0.62)], [0.01] * 3, 4)
    ring = kit.torus(harness.bm, (0, -0.1, 0.645), (0, 1, 0), 0.016, 0.005, 8, 3)
    harness.paint(faces_of(ring), IRON)
    # The belt with a brass boss.
    kit.cone(harness.bm, (0, -0.005, 0.455), (0, -0.005, 0.5), 0.112, 0.108, 14, squash=0.86)
    boss = kit.cone(harness.bm, (0, -0.096, 0.478), (0, -0.118, 0.478), 0.034, 0.028, 10)
    harness.paint(faces_of(boss), BRASS)
    knob = kit.sphere(harness.bm, (0, -0.12, 0.478), (0.014, 0.01, 0.014), 6, 4)
    harness.paint(faces_of(knob), BRASS_DARK)
    parts.append(harness)

    def skirt_color(row, column):
        return RED_DARK if row == 2 or column % 4 == 0 else RED

    skirt = Part("skirt", RED, skirt_weights)
    kit.ragged_cone(skirt, 0.47, 0.3, 0.112, 0.15, 16, 3, 0.85, 0.05, skirt_color, RED_DARK, gap=math.radians(30))
    parts.append(skirt)

    # The pit sash: a long ragged cloth at the front and one at the back.
    for bone, sign in (("cloth.F", -1), ("cloth.B", 1)):
        cloth = Part(bone, RED, sash_weights(bone))

        def grid(inset, sign=sign):
            result = []
            for row in range(5):
                v = row / 4
                depth = lerp(0.1, 0.12, v) - inset
                result.append([(lerp(-1, 1, c / 4) * lerp(0.045, 0.06, v), sign * depth, lerp(0.47, 0.2 + 0.04 * (c % 2), v)) for c in range(5)])
            return result

        def cloth_color(face_side, row, column):
            return RED_DARK if face_side == "back" or row == 3 else RED

        panel(cloth, grid(0.0), grid(0.007), cloth_color)
        parts.append(cloth)
    return parts


def bell_parts():
    """Brass trophy bells and a small skull on cords from the belt."""
    bells = Part("bells", BRASS, "bells", shade=0.08)
    for dx, dy, drop in ((0.0, 0.0, 0.07), (-0.03, 0.03, 0.05), (0.025, -0.012, 0.045)):
        hang = BELLS + Vector((dx, dy, -drop))
        cord = kit.cone(bells.bm, BELLS + Vector((dx * 0.4, dy * 0.4, 0.01)), hang + Vector((0, 0, 0.022)), 0.003, 0.003, 4)
        bells.paint(faces_of(cord), LEATHER_DARK)
        bell = kit.cone(bells.bm, hang + Vector((0, 0, 0.024)), hang - Vector((0, 0, 0.012)), 0.01, 0.022, 8)
        bells.paint({f for f in faces_of(bell) if f.calc_center_median().z < hang.z - 0.006}, BRASS_DARK)
    skull = kit.sphere(bells.bm, BELLS + Vector((0.045, 0.045, -0.04)), (0.022, 0.022, 0.024), 8, 6)
    bells.paint(faces_of(skull), BONE)
    for sign in (1, -1):
        hole = kit.sphere(bells.bm, BELLS + Vector((0.034 + 0.008 * sign, 0.029, -0.036)), (0.005, 0.004, 0.005), 5, 3)
        bells.paint(faces_of(hole), EYES)
    return [bells]


def gauntlet(part, e, w, d, sign):
    """A huge iron gauntlet: the cuff, the fist, knuckle spikes and a large hook."""
    # `front` is the knuckle side (-Y at rest), `out` the outside of the arm.
    front = (-Y - d * (-Y).dot(d)).normalized()
    out = d.cross(front).normalized()
    if out.x * sign < 0:
        out = -out
    cuff = kit.cone(part.bm, e + d * 0.02, w + d * 0.01, 0.05, 0.06, 8)
    part.paint({f for f in faces_of(cuff) if (f.calc_center_median() - (e + d * 0.02)).length < 0.03}, IRON_DARK)
    fist = w + d * 0.05
    kit.sphere(part.bm, fist, (0.05, 0.054, 0.054), 8, 6)
    knuckles = kit.box(part.bm, fist + d * 0.03 + front * 0.012, (0.066, 0.06, 0.06))
    part.paint(faces_of(knuckles), IRON_DARK)
    for along in (-0.02, 0.02):
        spike = kit.cone(part.bm, fist + d * 0.055 + front * 0.03 + out * along, fist + d * 0.08 + front * 0.05 + out * along, 0.01, 0.001, 4)
        part.paint(faces_of(spike), STEEL)
    hook = kit.tube(
        part.bm,
        [fist + d * 0.03 + front * 0.04, fist + d * 0.09 + front * 0.08, fist + d * 0.08 + front * 0.14, fist + d * 0.02 + front * 0.16, fist - d * 0.03 + front * 0.135],
        [0.026, 0.024, 0.019, 0.011, 0.002],
        5,
    )
    part.paint({f for f in faces_of(hook) if (f.calc_center_median() - fist).dot(front) > 0.13}, STEEL)
    # Tally marks on the outside of the cuff: four strokes and one across.
    face_at = (e + w) / 2 + d * 0.02 + out * 0.058
    for index in range(4):
        mark = kit.slab(part.bm, face_at + front * (-0.022 + index * 0.014), out * 0.003, front * 0.0025, d * 0.024)
        part.paint(faces_of(mark), TALLY)
    across = kit.slab(part.bm, face_at + out * 0.002, out * 0.003, (front * 0.9 + d * 0.5).normalized() * 0.034, (d - front * 0.5).normalized() * 0.0025)
    part.paint(faces_of(across), TALLY)


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.008 * sign, 0, -0.006)), (0.052, 0.05, 0.052), 10, 7)
        kit.cone(upper.bm, s, e, 0.046, 0.04, 8)
        band = kit.cone(upper.bm, s + (e - s) * 0.55, s + (e - s) * 0.72, 0.045, 0.043, 8)
        upper.paint(faces_of(band), LEATHER)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", IRON, f"forearm.{side}", shade=0.08)
        gauntlet(forearm, e, w, d, sign)
        # The fist and the hook follow the hand bone.
        parts.append(forearm)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.064, 0.048, 8)
        parts.append(thigh)

        # Red wraps on the shins, an iron knee guard and heavy boots.
        shin = Part(f"shin.{side}", RED, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.05)), 0.05, 0.046, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 45) % 2:
                shin.paint([face], RED_DARK)
        guard = kit.sphere(shin.bm, knee + Vector((0, -0.028, 0.008)), (0.044, 0.026, 0.042), 8, 6)
        shin.paint(faces_of(guard), IRON)
        greave = kit.box(shin.bm, knee + Vector((0, -0.04, -0.09)), (0.05, 0.016, 0.1))
        shin.paint(faces_of(greave), IRON_DARK)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.065)), ankle - Vector((0, 0, 0.02)), 0.054, 0.056, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.036, 0.026), (0.08, 0.15, 0.052))
        cuff = kit.cone(boot.bm, ankle + Vector((0, 0, 0.055)), ankle + Vector((0, 0, 0.075)), 0.06, 0.06, 8)
        boot.paint(faces_of(cuff), LEATHER_DARK)
        cap = kit.cone(boot.bm, (LEG_X * sign, -0.1, 0.028), (LEG_X * sign, -0.12, 0.02), 0.032, 0.012, 6, squash=0.6)
        boot.paint(faces_of(cap), IRON)
        parts.append(boot)
    return parts


def gauntlet_weights(side, e, w, d):
    def weights(co):
        along = (co - e).dot(d)
        length = (w - e).length
        return blend(f"forearm.{side}", f"hand.{side}", along, length - 0.01, length + 0.01)

    return weights


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("MesaPitFighter", BONES)
    parts = head_parts() + body_parts() + bell_parts() + limb_parts()
    for part in parts:
        for side, (e, w) in (("L", (EL, WL)), ("R", (ER, WR))):
            if part.name == f"forearm.{side}":
                part.weights = gauntlet_weights(side, e, w, (w - e).normalized())
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "MesaPitFighterMesh")
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

    def stand(breath=0.0, bounce=0.0, sway=0.0):
        """
        The idle stance: a boxer, the left foot in front, turned a little to
        her right, the fists up in a guard. She bounces on her toes.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.022 - bounce * 0.012)),
            "hips": t("hips", (Z, -22), (Y, sway * 2)),
            "spine": t("spine", (Z, -2), (X, 6 + breath)),
            "chest": t("chest", (X, -2 - breath * 2), (Z, sway * 3)),
            "neck": t("neck", (Z, 10)),
            "head": t("head", (Z, 10 + sway * 3), (X, 4 + breath)),
            "hair": t("hair", (X, -6 - bounce * 6)),
            "upperarm.L": t("upperarm.L", (X, -50), (Y, -12)),
            "forearm.L": t("forearm.L", (X, -96)),
            "hand.L": t("hand.L", (X, -10)),
            "upperarm.R": t("upperarm.R", (X, -26 - breath * 3), (Y, 14)),
            "forearm.R": t("forearm.R", (X, -118)),
            "hand.R": t("hand.R", (X, -14)),
            "thigh.L": t("thigh.L", (X, -20 - bounce * 4), (Y, -6)),
            "shin.L": t("shin.L", (X, 22 + bounce * 8)),
            "foot.L": t("foot.L", (X, -2 - bounce * 4)),
            "thigh.R": t("thigh.R", (X, 14 - bounce * 4), (Y, 8)),
            "shin.R": t("shin.R", (X, 16 + bounce * 8)),
            "foot.R": t("foot.R", (X, -24 - bounce * 4)),
            "cloth.F": t("cloth.F", (X, -6 + bounce * 4)),
            "cloth.B": t("cloth.B", (X, 6 - bounce * 4)),
            "bells": t("bells", (X, sway * 10), (Y, bounce * 12)),
        }

    def slump(breath=0.0):
        """Low HP: bent over, the left hand on her knee, the right fist down. She still grins."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.07 - breath * 0.006)),
            spine=t("spine", (Z, -2), (X, 24 + breath * 3)),
            chest=t("chest", (X, 6 + breath * 4)),
            neck=t("neck", (Z, 8), (X, -10)),
            head=t("head", (Z, 6), (X, -10 - breath * 3)),
            hair=t("hair", (X, 10)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 4)),
            forearm__L=t("forearm.L", (X, -30)),
            hand__L=t("hand.L", (X, -20)),
            upperarm__R=t("upperarm.R", (X, -14), (Y, 16)),
            forearm__R=t("forearm.R", (X, -50 - breath * 6)),
            hand__R=t("hand.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -44), (Y, -6)),
            shin__L=t("shin.L", (X, 50)),
            foot__L=t("foot.L", (X, -6)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, -34)),
            cloth__F=t("cloth.F", (X, -26)),
            cloth__B=t("cloth.B", (X, 10)),
            bells=t("bells", (X, -20)),
        )

    def block(base, amount=1.0):
        """She takes the hit on the guard: both forearms up in front of the face, and a slide back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04 * amount, -0.03)),
            spine=t("spine", (Z, -2), (X, -4 * amount)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 10), (X, 14 * amount)),
            hair=t("hair", (X, -20 * amount)),
            upperarm__L=t("upperarm.L", (X, -66), (Y, -4)),
            forearm__L=t("forearm.L", (X, -110)),
            upperarm__R=t("upperarm.R", (X, -56), (Y, 6)),
            forearm__R=t("forearm.R", (X, -120)),
            cloth__F=t("cloth.F", (X, -16 * amount)),
            cloth__B=t("cloth.B", (X, 20 * amount)),
            bells=t("bells", (X, 30 * amount)),
        )

    def cross(base, reach=1.0):
        """
        A straight right: the hips and the shoulders turn, the rear heel comes
        up, and the right arm goes out straight. The hook points down at the end.
        """
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.06 * reach, -0.04 * reach - 0.02)),
            hips=t("hips", (Z, -22 + 30 * reach)),
            spine=t("spine", (Z, 6 * reach), (X, 6 + 12 * reach)),
            chest=t("chest", (Z, 14 * reach), (X, -2)),
            neck=t("neck", (Z, 10 - 8 * reach)),
            head=t("head", (Z, 10 - 16 * reach), (X, 4 - 10 * reach)),
            hair=t("hair", (X, -10 - 16 * reach), (Z, -10 * reach)),
            upperarm__R=t("upperarm.R", (X, lerp(-26, -82, reach)), (Y, lerp(14, -4, reach))),
            forearm__R=t("forearm.R", (X, lerp(-118, -6, reach))),
            hand__R=t("hand.R", (X, lerp(-14, 0, reach))),
            upperarm__L=t("upperarm.L", (X, -40), (Y, -10)),
            forearm__L=t("forearm.L", (X, -124)),
            thigh__L=t("thigh.L", (X, -34 * reach - 20 * (1 - reach)), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 14 + 18 * reach), (Y, 8)),
            shin__R=t("shin.R", (X, 16 - 10 * reach)),
            foot__R=t("foot.R", (X, -24 + 34 * reach)),
            cloth__F=t("cloth.F", (X, -16 * reach)),
            cloth__B=t("cloth.B", (X, 20 * reach)),
            bells=t("bells", (X, 26 * reach), (Y, -10 * reach)),
        )

    def windup(base):
        """The right fist goes back and the body turns away, to load the cross."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.04)),
            hips=t("hips", (Z, -40)),
            spine=t("spine", (Z, -10), (X, 4)),
            chest=t("chest", (Z, -12), (X, -6)),
            neck=t("neck", (Z, 20)),
            head=t("head", (Z, 24), (X, 6)),
            upperarm__R=t("upperarm.R", (X, -6), (Y, 34)),
            forearm__R=t("forearm.R", (X, -130)),
            hand__R=t("hand.R", (X, -20)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, -14)),
            forearm__L=t("forearm.L", (X, -60)),
            thigh__L=t("thigh.L", (X, -26), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 8), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -30)),
            cloth__F=t("cloth.F", (X, 4)),
            cloth__B=t("cloth.B", (X, -6)),
            bells=t("bells", (X, -16)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.06)),
            hips=t("hips", (Z, -14)),
            spine=t("spine", (X, -14)),
            chest=t("chest", (X, -8)),
            head=t("head", (X, -24)),
            hair=t("hair", (X, 20)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, -40)),
            forearm__L=t("forearm.L", (X, -40)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, 40)),
            forearm__R=t("forearm.R", (X, -30)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, 14)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
            cloth__F=t("cloth.F", (X, -20)),
            bells=t("bells", (X, -30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the gauntlets out wide."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, 0, 0.1)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -10), (Z, 30)),
            hair=t("hair", (X, -50)),
            upperarm__L=t("upperarm.L", (Y, -70), (X, -10)),
            forearm__L=t("forearm.L", (X, -30)),
            hand__L=t("hand.L", (X, 0)),
            upperarm__R=t("upperarm.R", (Y, 70), (X, -10)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, 0)),
            thigh__L=t("thigh.L", (X, -30), (Y, -12)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -10), (Y, 12)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, 0)),
            cloth__F=t("cloth.F", (X, -60)),
            cloth__B=t("cloth.B", (X, 0)),
            bells=t("bells", (X, -80)),
        )

    def crouch(base):
        """Low on bent knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.14)),
            spine=t("spine", (X, 28)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, -6)),
            thigh__L=t("thigh.L", (X, -64), (Y, -8)),
            shin__L=t("shin.L", (X, 84)),
            foot__L=t("foot.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -46)),
            cloth__F=t("cloth.F", (X, -40)),
            cloth__B=t("cloth.B", (X, 30)),
        )

    def clang(base):
        """Up again: she knocks the gauntlets together in front of her chest. The end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, -12)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -14)),
            hair=t("hair", (X, -14)),
            upperarm__L=t("upperarm.L", (X, -64), (Z, -30)),
            forearm__L=t("forearm.L", (X, -64)),
            hand__L=t("hand.L", (X, 0)),
            upperarm__R=t("upperarm.R", (X, -64), (Z, 30)),
            forearm__R=t("forearm.R", (X, -64)),
            hand__R=t("hand.R", (X, 0)),
            thigh__L=t("thigh.L", (X, -6), (Y, -10)),
            shin__L=t("shin.L", (X, 8)),
            thigh__R=t("thigh.R", (X, 6), (Y, 10)),
            shin__R=t("shin.R", (X, 8)),
            foot__R=t("foot.R", (X, -14)),
            bells=t("bells", (Y, 20)),
        )

    def step(front):
        """A slow, heavy stomp (Heavy). `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.04)),
            hips=t("hips", (Z, -18), (Y, 5 * front)),
            spine=t("spine", (Z, -2), (X, 12), (Y, -4 * front)),
            chest=t("chest", (Z, -6 * front)),
            head=t("head", (Z, 10), (X, 0)),
            hair=t("hair", (X, 6)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32), (Y, 4 * front)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 14)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 20), (Y, -4 * front)),
                f"shin__{back}": t(f"shin.{back}", (X, 18)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
                "cloth__F": t("cloth.F", (X, -10 - 10 * front)),
                "cloth__B": t("cloth.B", (X, 10)),
                "bells": t("bells", (X, 14 * front), (Y, -10)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            hips=t("hips", (Z, -18)),
            spine=t("spine", (Z, -2), (X, 12)),
            hair=t("hair", (X, -12)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -36)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 60)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
                "cloth__F": t("cloth.F", (X, -14)),
                "cloth__B": t("cloth.B", (X, 14)),
                "bells": t("bells", (X, -10)),
            },
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, bounce, sway in ((0, 0, 0, 0), (6, 0.3, 1, 0.5), (12, 0.5, 0, 1), (18, 0.7, 1, 0.5), (24, 1, 0, 0), (30, 0.7, 1, -0.5), (36, 0.5, 0, -1), (42, 0.3, 1, -0.5), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, bounce, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    # The attack: the slash effect starts at 50% of the attack (`MELEE_IMPACT`
    # in fx.ts), so the cross lands at frame 15 of 30.
    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, windup(stand())).key(13, cross(stand(), 0.85)).key(15, cross(stand()))
    attack.key(19, cross(stand(), 0.95)).key(26, stand()).key(30, stand())
    clips.append(attack)

    # Hurt: the hit lands on her guard, then the counter-punch (Retaliate).
    hurt = Clip("hurt", 20)
    hurt.key(0, stand()).key(3, block(stand())).key(7, block(stand(), 0.6))
    hurt.key(11, cross(stand(), 0.9)).key(14, cross(stand(), 0.8)).key(20, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, block(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, block(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(40, clang(stand())).key(43, clang(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(9, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.03, -0.12))))
    summon.key(15, clang(stand())).key(18, clang(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "mesa-pit-fighter.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
