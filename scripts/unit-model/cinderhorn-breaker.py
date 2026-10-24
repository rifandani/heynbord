"""
Cinderhorn Breaker (`orc.cinderhornBreaker`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a muscular orc woman with a roar,
a wild black mane with braids, gold earrings, red war paint, a charred
leather harness with iron rings, a dark leather top, a ragged red and leather
skirt, red leg wraps and heavy boots. She holds a short battering ram low in
front of her: a log of black wood with glowing cracks, iron bands with
spikes, two iron handles on top and an iron cap with two curled horns that
glow ember-red at the tips. Run it in Blender (see `unit_model_kit.py`). It
writes `apps/web/art/units/raw/cinderhorn-breaker.glb`; then
`bun unit-model:pack cinderhorn-breaker` packs it for the game.

The ram points to the front. The right hand holds the back handle, and the
left hand always holds the front handle (IK to the `grip.L` bone). The
thrust uses IK for the right hand and the `Aim` constraint for the ram. The
`ember` bone carries the embers at the cap: they glow at rest, flare in the
attack and the summon, and go out in the death. She has Swift and Charge, so
her walk is a run with the ram low, and her attack is a charge that drives
the ram forward. She has no Keyword that she uses by her own action, so she
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

SKIN = hex_color("#9ea648")
SKIN_DARK = hex_color("#757c32")
HAIR = hex_color("#241a16")
HAIR_LIGHT = hex_color("#3e2e26")
EYES = hex_color("#1a120c")
MOUTH = hex_color("#4e1a16")
TUSK = hex_color("#f0e6c8")
PAINT = hex_color("#b8342a")
GOLD = hex_color("#d8a846")
LEATHER = hex_color("#4e3222")
LEATHER_DARK = hex_color("#2e1e16")
SCORCH = hex_color("#1e1612")
CLOTH = hex_color("#9e2a22")
CLOTH_DARK = hex_color("#601a16")
IRON = hex_color("#6a6660")
IRON_DARK = hex_color("#3f3c38")
STEEL = hex_color("#aaa69c")
LOG = hex_color("#2e221c")
LOG_DARK = hex_color("#1c1512")
EMBER = hex_color("#ff6a22")
FLAME = hex_color("#ffae34")
FLAME_HOT = hex_color("#fff0a0")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.46
WAIST_Z = 0.54
CHEST_Z = 0.63
SHOULDER_Z = 0.715
NECK_Z = 0.745
HEAD_C = Vector((0, -0.02, 0.835))
KNEE_Z = 0.26
ANKLE_Z = 0.055
LEG_X = 0.075

# The ram points to the front and a little down. The hands hold two handles
# on top of it: the right hand at the back, the left hand in front. These
# are the rest (bind) positions.
RAM = Vector((0, -1, -0.06)).normalized()
SL = Vector((0.15, 0, SHOULDER_Z))
SR = Vector((-0.15, 0, SHOULDER_Z))
ER = Vector((-0.2, 0.03, 0.57))
WR = Vector((-0.075, -0.06, 0.48))
GRIP_R = WR + (WR - ER).normalized() * 0.025
TR = WR + (WR - ER).normalized() * 0.05
GRIP_L = GRIP_R + RAM * 0.085 + Vector((0.06, 0, 0))
WL = GRIP_L
EL = Vector((0.15, -0.05, 0.58))
TL = WL + (WL - EL).normalized() * 0.05

# The axis of the log is under the handles.
LOG_DROP = 0.07
LOG_R = 0.06
LOG_BACK = -0.08
LOG_FRONT = 0.3
CAP_AT = LOG_FRONT + 0.05


def on_log(along, offset=(0, 0, 0)):
    """A point on the axis of the log, `along` from the right hand."""
    return GRIP_R + Vector((0.03, 0, -LOG_DROP)) + RAM * along + Vector(offset)


CAP = on_log(CAP_AT)

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, -0.006, NECK_Z), (0, -0.01, 0.78), "chest"),
    ("head", (0, -0.01, 0.78), (0, -0.02, 0.94), "neck"),
    ("hair", (0, 0.07, 0.85), (0, 0.12, 0.6), "head"),
    ("cloth.F", (0, -0.1, 0.45), (0, -0.11, 0.26), "hips"),
    # The poles that the elbows point to: out and back.
    ("pole.L", (0.35, 0.25, 0.5), (0.35, 0.25, 0.55), "chest"),
    ("pole.R", (-0.35, 0.25, 0.5), (-0.35, 0.25, 0.55), "chest"),
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
BONES += [
    ("ram", tuple(GRIP_R), tuple(GRIP_R + RAM * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + RAM * 0.05), "ram"),
    ("ember", tuple(CAP), tuple(CAP + RAM * 0.06), "ram"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z + 0.01:
        return blend("hips", "spine", co.z, 0.5, 0.6)
    return blend("spine", "chest", co.z, 0.62, 0.69)


def hair_weights(co):
    return blend("hair", "head", co.z, 0.74, 0.82)


def cloth_weights(co):
    return blend("cloth.F", "hips", co.z, 0.4, 0.45)


def skirt_weights(co):
    """The skirt follows the hips at the top, and the thighs lower."""
    t = clamp01((0.45 - co.z) / 0.16)
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
    kit.sphere(head.bm, HEAD_C, (0.064, 0.068, 0.07), 12, 9)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.042)), (0.058, 0.047, 0.037), 12, 6)
    kit.cone(head.bm, HEAD_C + Vector((0, -0.064, 0.002)), HEAD_C + Vector((0, -0.08, -0.016)), 0.016, 0.007, 5)
    for sign in (1, -1):
        kit.cone(head.bm, HEAD_C + Vector((0.06 * sign, 0.008, 0.004)), HEAD_C + Vector((0.125 * sign, 0.036, 0.04)), 0.02, 0.002, 5, squash=0.4)
        ring = kit.torus(head.bm, HEAD_C + Vector((0.074 * sign, 0.014, -0.03)), (0, 1, 0), 0.013, 0.003, 8, 3)
        head.paint(faces_of(ring), GOLD)
    parts.append(head)

    face = Part("face", EYES, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.026 * sign, -0.062, 0.014)), (0.009, 0.006, 0.007), 6, 4)
        # Angry brows, down at the middle.
        brow = kit.slab(face.bm, HEAD_C + Vector((0.026 * sign, -0.066, 0.03)), (0.016, 0.0, -0.007 * sign), (0, 0.006, 0), (0.0, 0.0, 0.005))
        face.paint(faces_of(brow), HAIR)
        # Two red stripes down each cheek.
        for dz in (0.0, -0.016):
            stripe = kit.slab(face.bm, HEAD_C + Vector((0.044 * sign, -0.052, -0.004 + dz)), (0.013, 0.004 * sign, 0), (0, 0.004, 0), (0, 0, 0.004))
            face.paint(faces_of(stripe), PAINT)
    # She roars: an open mouth.
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.066, -0.04)), (0.03, 0.014, 0.022), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    parts.append(face)

    tusks = Part("tusks", TUSK, "head", shade=0.05)
    for sign in (1, -1):
        kit.cone(tusks.bm, HEAD_C + Vector((0.028 * sign, -0.07, -0.056)), HEAD_C + Vector((0.035 * sign, -0.078, -0.016)), 0.009, 0.001, 5)
    parts.append(tusks)

    # A wild black mane that flies back, with two braids.
    hair = Part("hair", HAIR, hair_weights, shade=0.1)
    verts = kit.sphere(hair.bm, HEAD_C + Vector((0, 0.01, 0.012)), (0.07, 0.074, 0.076), 12, 8)
    kit.bmesh.ops.delete(hair.bm, geom=[v for v in verts if v.co.z < HEAD_C.z - 0.02 or (v.co.y < -0.035 and v.co.z < HEAD_C.z + 0.05)], context="VERTS")
    for index, angle in enumerate(range(-140, 141, 35)):
        a = math.radians(angle)
        top = HEAD_C + Vector((0.064 * math.sin(a), 0.064 * math.cos(a) + 0.01, 0.04))
        length = 0.2 if abs(angle) < 80 else 0.14
        bottom = top + Vector((0.04 * math.sin(a), 0.09 + 0.02 * math.cos(a), -length))
        middle = (top + bottom) / 2 + Vector((0.02 * math.sin(a), 0.035, 0.03))
        lock = kit.tube(hair.bm, [top, middle, bottom], [0.024, 0.02, 0.005], 5)
        if index % 2:
            hair.paint(faces_of(lock), HAIR_LIGHT)
    for sign in (1, -1):
        braid = kit.tube(hair.bm, [HEAD_C + Vector((0.055 * sign, -0.01, 0.0)), HEAD_C + Vector((0.07 * sign, -0.02, -0.08)), HEAD_C + Vector((0.07 * sign, -0.01, -0.15))], [0.014, 0.012, 0.004], 5)
        hair.paint(faces_of(braid), HAIR_LIGHT)
        bead = kit.sphere(hair.bm, HEAD_C + Vector((0.07 * sign, -0.016, -0.12)), (0.01, 0.01, 0.012), 6, 4)
        hair.paint(faces_of(bead), GOLD)
    parts.append(hair)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.006, 0.7), (0, -0.01, 0.79), 0.048, 0.042, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    torso = Part("torso", SKIN, torso_weights, shade=0.14)
    kit.cone(torso.bm, (0, 0.0, 0.46), (0, -0.004, 0.62), 0.108, 0.104, 12, squash=0.76)
    kit.sphere(torso.bm, (0, 0.0, 0.66), (0.145, 0.088, 0.09), 12, 8)
    # Red war paint stripes on the belly.
    for z in (0.52, 0.56):
        stripe = kit.slab(torso.bm, (0.03, -0.083, z), (0.03, 0, -0.008), (0, 0.004, 0), (0, 0, 0.005))
        torso.paint(faces_of(stripe), PAINT)
    parts.append(torso)

    # A dark leather top, and a charred harness with iron rings.
    top = Part("top", LEATHER_DARK, "chest", shade=0.1)
    kit.sphere(top.bm, (0, -0.01, 0.66), (0.135, 0.088, 0.058), 12, 6)
    for sign in (1, -1):
        strap = kit.tube(top.bm, [(0.1 * sign, 0.05, 0.71), (0.09 * sign, -0.05, 0.73), (0.06 * sign, -0.085, 0.67)], [0.012] * 3, 4)
        top.paint(faces_of(strap), LEATHER)
    harness = kit.tube(top.bm, [(0.12, -0.04, 0.74), (0.02, -0.1, 0.62), (-0.1, -0.08, 0.52)], [0.013] * 3, 4)
    top.paint(faces_of(harness), SCORCH)
    for point in ((0.06, -0.085, 0.67), (-0.045, -0.096, 0.57)):
        ring = kit.torus(top.bm, point, (0, 1, 0), 0.018, 0.005, 10, 4)
        top.paint(faces_of(ring), IRON)
    parts.append(top)

    belt = Part("belt", LEATHER_DARK, "hips", shade=0.05)
    kit.cone(belt.bm, (0, -0.004, 0.44), (0, -0.004, 0.49), 0.116, 0.112, 14, squash=0.86)
    ring = kit.torus(belt.bm, (0, -0.104, 0.465), (0, 1, 0), 0.022, 0.006, 10, 4)
    belt.paint(faces_of(ring), IRON)
    parts.append(belt)

    def skirt_color(row, column):
        if column % 3 == 1:
            return CLOTH if row < 2 else CLOTH_DARK
        return LEATHER if row < 2 else SCORCH

    skirt = Part("skirt", LEATHER, skirt_weights)
    kit.ragged_cone(skirt, 0.46, 0.29, 0.116, 0.155, 16, 3, 0.85, 0.05, skirt_color, LEATHER_DARK, gap=math.radians(26))
    parts.append(skirt)

    cloth = Part("cloth.F", CLOTH, cloth_weights)

    def grid(inset):
        result = []
        for row in range(5):
            v = row / 4
            result.append([(lerp(-1, 1, c / 4) * lerp(0.05, 0.062, v), -(lerp(0.104, 0.12, v) - inset), lerp(0.45, 0.24 + 0.04 * (c % 2), v)) for c in range(5)])
        return result

    def cloth_color(face_side, row, column):
        return CLOTH_DARK if face_side == "back" or row == 3 else CLOTH

    kit.panel(cloth, grid(0.0), grid(0.007), cloth_color)
    parts.append(cloth)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"arm.{side}", SKIN, f"upperarm.{side}")
        kit.sphere(upper.bm, s + Vector((0.01 * sign, 0, -0.01)), (0.054, 0.052, 0.052), 10, 7)
        kit.cone(upper.bm, s, e, 0.05, 0.042, 8)
        stripe = kit.cone(upper.bm, s + (e - s) * 0.45, s + (e - s) * 0.58, 0.051, 0.05, 8)
        upper.paint(faces_of(stripe), PAINT)
        parts.append(upper)

        # A charred iron shoulder plate with a ring.
        plate = Part(f"plate.{side}", IRON_DARK, f"upperarm.{side}", shade=0.08)
        kit.sphere(plate.bm, s + Vector((0.016 * sign, 0, 0.026)), (0.06, 0.056, 0.036), 10, 6)
        ring = kit.torus(plate.bm, s + Vector((0.05 * sign, 0, 0.0)), (1, 0, 0), 0.016, 0.005, 8, 3)
        plate.paint(faces_of(ring), IRON)
        parts.append(plate)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.042, 0.034, 8)
        parts.append(forearm)

        bracer = Part(f"bracer.{side}", LEATHER, f"forearm.{side}", shade=0.05)
        verts = kit.cone(bracer.bm, e + d * 0.05, w - d * 0.005, 0.046, 0.04, 8)
        for face in faces_of(verts):
            if int(((face.calc_center_median() - e).dot(d)) * 80) % 3 == 0:
                bracer.paint([face], SCORCH)
        parts.append(bracer)

        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.026, (0.032, 0.03, 0.033), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", SKIN, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.02)), knee, 0.068, 0.05, 8)
        parts.append(thigh)

        # Red cloth wraps on the shins, with leather straps.
        shin = Part(f"shin.{side}", CLOTH, f"shin.{side}", shade=0.1)
        verts = kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.04)), 0.052, 0.046, 8)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 45) % 3 == 0:
                shin.paint([face], LEATHER_DARK)
        guard = kit.sphere(shin.bm, knee + Vector((0, -0.026, 0.004)), (0.042, 0.026, 0.04), 8, 6)
        shin.paint(faces_of(guard), IRON)
        parts.append(shin)

        boot = Part(f"boot.{side}", LEATHER_DARK, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.05)), ankle - Vector((0, 0, 0.02)), 0.054, 0.056, 8)
        kit.box(boot.bm, (LEG_X * sign, -0.036, 0.026), (0.08, 0.15, 0.052))
        parts.append(boot)
    return parts


def ram_parts():
    ram = Part("ram", LOG, "ram", shade=0.04)
    side = RAM.cross(Z).normalized()
    up = side.cross(RAM).normalized()
    log = kit.cone(ram.bm, on_log(LOG_BACK), on_log(LOG_FRONT), LOG_R * 0.92, LOG_R, 10)
    # Glowing cracks in the black wood.
    for face in faces_of(log):
        center = face.calc_center_median()
        along = (center - on_log(0)).dot(RAM)
        if int(along * 70) % 4 == 1 and (center - on_log(along)).dot(up) < 0.03:
            ram.paint([face], LOG_DARK)
    for along, sideways in ((0.06, 0.6), (0.17, -0.4), (0.24, 0.9)):
        out = (side * sideways + up * (1 - abs(sideways))).normalized()
        crack = kit.cone(ram.bm, on_log(along) + out * LOG_R * 0.97, on_log(along + 0.05) + out * LOG_R * 0.99, 0.006, 0.003, 3)
        ram.paint(faces_of(crack), EMBER)
    # Iron bands with spikes.
    for along in (LOG_BACK + 0.02, 0.12, LOG_FRONT - 0.02):
        band = kit.torus(ram.bm, on_log(along), RAM, LOG_R + 0.004, 0.009, 12, 4)
        ram.paint(faces_of(band), IRON)
        for index in range(3):
            a = math.radians(-90 + index * 90)
            out = side * math.cos(a) - up * math.sin(a)
            if index == 1:
                continue
            spike = kit.cone(ram.bm, on_log(along) + out * LOG_R, on_log(along) + out * (LOG_R + 0.04), 0.012, 0.001, 4)
            ram.paint(faces_of(spike), STEEL)
    # Two iron handles on top, where the hands hold it.
    for grip in (GRIP_R, GRIP_L):
        handle = kit.tube(ram.bm, [grip - RAM * 0.035 - up * 0.04, grip - RAM * 0.03, grip + RAM * 0.03, grip + RAM * 0.035 - up * 0.04], [0.008] * 4, 4, caps=False)
        ram.paint(faces_of(handle), IRON_DARK)

    # The iron cap: a dome over the front, with two curled horns.
    cap = set(kit.cone(ram.bm, on_log(LOG_FRONT - 0.03), on_log(LOG_FRONT + 0.03), LOG_R + 0.01, LOG_R + 0.004, 10))
    cap |= set(kit.sphere(ram.bm, on_log(LOG_FRONT + 0.03), (LOG_R * 0.9, LOG_R * 0.9, LOG_R * 0.9), 10, 6))
    ram.paint(faces_of(cap), IRON)
    knob = kit.cone(ram.bm, on_log(LOG_FRONT + 0.07), on_log(LOG_FRONT + 0.12), 0.024, 0.004, 6)
    ram.paint(faces_of(knob), STEEL)
    # The two curled horns: each leaves the top of the cap, curls back, down
    # and round to the front beside the cap, and turns out a little.
    for sign in (1, -1):
        center = on_log(LOG_FRONT - 0.02) + side * sign * (LOG_R + 0.035)
        points = []
        radii = []
        for index in range(11):
            v = index / 10
            a = math.radians(-20 + index * 36)
            r = lerp(0.1, 0.03, v)
            points.append(center + up * (r * math.cos(a)) - RAM * (r * math.sin(a)) + side * sign * 0.04 * v)
            radii.append(lerp(0.036, 0.01, v))
        horn = kit.tube(ram.bm, points, radii, 7)
        for face in faces_of(horn):
            index = min(range(len(points)), key=lambda i: (points[i] - face.calc_center_median()).length)
            ram.paint([face], FLAME if index == 10 else (EMBER if index >= 8 else (LOG_DARK if index % 2 else IRON_DARK)))

    # The embers at the cap: small tongues of fire round the horn tips and the
    # knob, orange at the foot and pale yellow at the tip.
    embers = Part("embers", FLAME, "ember", shade=0.0)
    for offset, height in (((0, 0, 0.02), 0.06), ((-0.05, 0, -0.01), 0.04), ((0.05, 0, -0.01), 0.04), ((0, 0.0, 0.0), 0.05)):
        base = CAP + side * offset[0] + up * offset[2] + RAM * 0.01
        tongue = kit.tube(embers.bm, [base, base + Z * height * 0.5 + RAM * 0.01, base + Z * height], [0.02, 0.014, 0.002], 5)
        for face in faces_of(tongue):
            rise = (face.calc_center_median() - base).dot(Z) / height
            embers.paint([face], EMBER if rise < 0.35 else (FLAME if rise < 0.7 else FLAME_HOT))
    return [ram, embers]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CinderhornBreaker", BONES)
    parts = head_parts() + body_parts() + limb_parts() + ram_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CinderhornBreakerMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends each elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the arms: the left hand on the front handle, the right hand to thrust. The ram aims with `Aim`."""
    empties = {
        "ik_hand.R": kit.add_empty("ik_hand.R", WR),
        "ram_aim": kit.add_empty("ram_aim"),
    }
    bones = rig.pose.bones
    for side, target, subtarget in (("L", rig, "grip.L"), ("R", empties["ik_hand.R"], "")):
        ik = bones[f"forearm.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = target
        if subtarget:
            ik.subtarget = subtarget
        ik.pole_target = rig
        ik.pole_subtarget = f"pole.{side}"
        ik.pole_angle = math.radians(POLE_ANGLE)
        ik.chain_count = 2
    aim = bones["ram"].constraints.new("COPY_ROTATION")
    aim.name = "Aim"
    aim.target = empties["ram_aim"]
    return empties


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    def pose(base, **changes):
        result = dict(base)
        for key, value in changes.items():
            result[key.replace("__", ".").replace("_at_", "@").replace("_slash_", "/")] = value
        return result

    ram_rest = rig.data.bones["ram"].matrix_local.to_quaternion()

    def aimed(direction):
        """The world rotation of the ram that points it along `direction`."""
        direction = Vector(direction).normalized()
        return RAM.rotation_difference(direction) @ ram_rest

    def hold(base, hand, direction):
        """The right hand and the ram by IK and `Aim`."""
        return pose(
            base,
            **{
                "forearm__R_slash_IK": 1.0,
                "ram_slash_Aim": 1.0,
                "ik_hand__R_at_pos": Vector(hand),
                "ram_aim_at_rot": aimed(direction),
            },
        )

    def stand(breath=0.0, sway=0.0, flicker=0.0):
        """
        The idle stance: low on wide feet, the left foot in front, the ram
        low and ready. She leans in, as before a charge.
        """
        return hold(
            {
                "hips@loc": at("hips", (0, 0, -0.03 - breath * 0.005)),
                "hips": t("hips", (Z, -6), (Y, sway * 2)),
                "spine": t("spine", (X, 10 + breath)),
                "chest": t("chest", (X, 2 - breath * 2)),
                "neck": t("neck", (X, -8)),
                "head": t("head", (Z, 4 + sway * 3), (X, -6 + breath * 2)),
                "hair": t("hair", (X, -4 - breath * 4), (Y, sway * 4)),
                "thigh.L": t("thigh.L", (X, -26), (Y, -8)),
                "shin.L": t("shin.L", (X, 26)),
                "foot.L": t("foot.L", (X, 0)),
                "thigh.R": t("thigh.R", (X, 14), (Y, 8)),
                "shin.R": t("shin.R", (X, 14)),
                "foot.R": t("foot.R", (X, -28)),
                "cloth.F": t("cloth.F", (X, -10)),
                "ember@scale": 1.0 + flicker * 0.18,
                "forearm.L/IK": 1.0,
            },
            WR + Vector((0, -0.03, -0.02 - breath * 0.006)),
            RAM + Vector((0, 0, -0.04)),
        )

    def slump(breath=0.0):
        """Low HP: down on one knee, she leans on the ram, its cap on the ground. The embers are low."""
        return hold(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0.02, -0.16 - breath * 0.005)),
                spine=t("spine", (X, 22 + breath * 3)),
                chest=t("chest", (X, 8 + breath * 3)),
                neck=t("neck", (X, -10)),
                head=t("head", (Z, 4), (X, -4 - breath * 3)),
                hair=t("hair", (X, 10)),
                thigh__L=t("thigh.L", (X, -76), (Y, -8)),
                shin__L=t("shin.L", (X, 78)),
                foot__L=t("foot.L", (X, -2)),
                thigh__R=t("thigh.R", (X, 14), (Y, 8)),
                shin__R=t("shin.R", (X, 100)),
                foot__R=t("foot.R", (X, -50)),
                cloth__F=t("cloth.F", (X, -30)),
                ember_at_scale=0.55 + breath * 0.1,
            ),
            (-0.06, -0.14, 0.36 - breath * 0.006),
            (0.0, -1, -0.75),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back, and the ram lifts."""
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03 * amount, -0.03 - 0.008 * amount)),
                spine=t("spine", (X, -6 * amount)),
                chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
                head=t("head", (Z, 6), (X, -18 * amount)),
                hair=t("hair", (X, 16 * amount)),
                ember_at_scale=1.0 - 0.3 * amount,
            ),
            WR + Vector((0, 0.02 * amount, 0.04 * amount)),
            RAM + Vector((0, 0, 0.3 * amount)),
        )

    def stagger(base):
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.04, -0.06)),
                hips=t("hips", (Z, -10)),
                spine=t("spine", (X, -12)),
                head=t("head", (X, -22)),
                hair=t("hair", (X, 24)),
                thigh__L=t("thigh.L", (X, -30)),
                shin__L=t("shin.L", (X, 34)),
                foot__L=t("foot.L", (X, -14)),
                thigh__R=t("thigh.R", (X, 12)),
                shin__R=t("shin.R", (X, 30)),
                foot__R=t("foot.R", (X, -22)),
                ember_at_scale=0.5,
            ),
            WR + Vector((0, 0.04, 0.02)),
            RAM + Vector((0, 0, 0.5)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back, the ram across her. The embers are out."""
        return pose(
            base,
            **{
                "root": t("root", (X, -84 + bounce)),
                "root_at_loc": at("root", (0, 0, 0.1)),
                "hips": t("hips", (Z, 0)),
                "spine": t("spine", (X, -4)),
                "chest": t("chest", (X, -4)),
                "neck": t("neck", (X, 0)),
                "head": t("head", (X, -10), (Z, 30)),
                "hair": t("hair", (X, -50)),
                "thigh__L": t("thigh.L", (X, -30), (Y, -12)),
                "shin__L": t("shin.L", (X, 40)),
                "foot__L": t("foot.L", (X, 0)),
                "thigh__R": t("thigh.R", (X, -10), (Y, 12)),
                "shin__R": t("shin.R", (X, 16)),
                "foot__R": t("foot.R", (X, 0)),
                "cloth__F": t("cloth.F", (X, -60)),
                "ember_at_scale": 0.0,
            },
        )

    def crouch(base, ember=0.3):
        """Low on bent knees, as a summon starts and a Rebirth gets up."""
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.03, -0.14)),
                spine=t("spine", (X, 28)),
                chest=t("chest", (X, 8)),
                head=t("head", (X, -8)),
                thigh__L=t("thigh.L", (X, -62), (Y, -8)),
                shin__L=t("shin.L", (X, 84)),
                foot__L=t("foot.L", (X, -20)),
                thigh__R=t("thigh.R", (X, -50), (Y, 8)),
                shin__R=t("shin.R", (X, 96)),
                foot__R=t("foot.R", (X, -46)),
                cloth__F=t("cloth.F", (X, -40)),
                ember_at_scale=ember,
            ),
            (-0.07, -0.1, 0.34),
            (0, -1, -0.4),
        )

    def roar(base):
        """Up again, the ram held high over her head, the embers big: the end of a summon and a Rebirth."""
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0, -0.005)),
                hips=t("hips", (Z, -8)),
                spine=t("spine", (X, -8)),
                chest=t("chest", (X, -12)),
                head=t("head", (Z, 4), (X, -22)),
                hair=t("hair", (X, -16)),
                ember_at_scale=1.5,
            ),
            (-0.1, -0.06, 0.98),
            (0.25, -1, 0.35),
        )

    def run(front, lift=0.0):
        """A charge with the ram low. `front` is 1 for the left foot, -1 for the right; `lift` is in the air."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return hold(
            pose(
                stand(),
                hips_at_loc=at("hips", (0, 0, -0.04 + lift * 0.05)),
                hips=t("hips", (Z, -4 * front)),
                spine=t("spine", (X, 22), (Y, -3 * front)),
                chest=t("chest", (Z, -4 * front)),
                head=t("head", (X, -18)),
                hair=t("hair", (X, 22)),
                **{
                    f"thigh__{lead}": t(f"thigh.{lead}", (X, -50 + lift * 10)),
                    f"shin__{lead}": t(f"shin.{lead}", (X, 30 + lift * 30)),
                    f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                    f"thigh__{back}": t(f"thigh.{back}", (X, 30 - lift * 10)),
                    f"shin__{back}": t(f"shin.{back}", (X, 30 + lift * 40)),
                    f"foot__{back}": t(f"foot.{back}", (X, 20)),
                    "cloth__F": t("cloth.F", (X, -30)),
                    "ember_at_scale": 1.15 + 0.1 * front,
                },
            ),
            WR + Vector((0, -0.07, -0.03 + lift * 0.015)),
            RAM + Vector((0, 0, -0.08 + 0.04 * front)),
        )

    # The attack: she pulls the ram back, then charges and drives it forward.
    # The slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts),
    # so the ram hits at frame 15 of 30.
    def pull(base):
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, 0.04, -0.06)),
                hips=t("hips", (Z, -14)),
                spine=t("spine", (Z, -6), (X, 2)),
                chest=t("chest", (X, -6)),
                head=t("head", (Z, 10), (X, -8)),
                hair=t("hair", (X, -4)),
                thigh__L=t("thigh.L", (X, -36), (Y, -8)),
                shin__L=t("shin.L", (X, 40)),
                thigh__R=t("thigh.R", (X, 4), (Y, 8)),
                shin__R=t("shin.R", (X, 40)),
                foot__R=t("foot.R", (X, -30)),
                ember_at_scale=1.3,
            ),
            WR + Vector((-0.04, 0.08, 0.02)),
            RAM + Vector((0, 0, 0.1)),
        )

    def drive(base):
        return hold(
            pose(
                base,
                hips_at_loc=at("hips", (0, -0.12, -0.05)),
                hips=t("hips", (Z, -2)),
                spine=t("spine", (X, 26)),
                chest=t("chest", (X, 6)),
                neck=t("neck", (X, -14)),
                head=t("head", (X, -16)),
                hair=t("hair", (X, 30)),
                thigh__L=t("thigh.L", (X, -62), (Y, -8)),
                shin__L=t("shin.L", (X, 50)),
                foot__L=t("foot.L", (X, 10)),
                thigh__R=t("thigh.R", (X, 38), (Y, 8)),
                shin__R=t("shin.R", (X, 10)),
                foot__R=t("foot.R", (X, -10)),
                cloth__F=t("cloth.F", (X, -36)),
                ember_at_scale=1.7,
            ),
            WR + Vector((0, -0.28, 0.0)),
            RAM + Vector((0, 0, 0.02)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, flicker in ((0, 0, 0, 0), (6, 0.2, 0.4, 1), (12, 0.5, 1, -0.6), (18, 0.7, 0.6, 0.8), (24, 1, 0, -1), (30, 0.7, -0.6, 0.6), (36, 0.5, -1, -0.4), (42, 0.2, -0.4, 1), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, flicker))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    # Swift: a fast run, one stride in each half of the clip.
    walk = Clip("walk", 16, loop=True)
    walk.key(0, run(1)).key(4, run(1, 1)).key(8, run(-1)).key(12, run(-1, 1)).key(16, run(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, pull(stand())).key(15, drive(stand())).key(19, drive(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stagger(stand()))).key(30, fallen(stagger(stand()), 6)).key(36, fallen(stagger(stand())))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up,
    # and the embers light again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stagger(stand()))).key(22, fallen(stagger(stand()), 3))
    rebirth.key(32, crouch(stand(), 0.2)).key(41, roar(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand(), 0.0)).key(10, pose(crouch(stand(), 0.4), hips_at_loc=at("hips", (0, 0.03, -0.12))))
    summon.key(17, roar(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    empties = add_controls(rig)
    baked = [kit.bake_clip(rig, empties, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, empties)
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "cinderhorn-breaker.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
