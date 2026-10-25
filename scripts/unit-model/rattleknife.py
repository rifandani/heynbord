"""
Rattleknife (`undead.rattleknife`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a wiry, cheeky skeleton with a
wide grin and small pale eyes, in a ragged brown hood with a teal scarf. He
has a ragged, layered tunic, a rope belt, a leather satchel with a brass coin
on it at his right hip, cloth wraps on the shins and bare bony feet. He has a
curved knife in each hand. Run it in Blender (see `unit_model_kit.py`). It
writes `apps/web/art/units/raw/rattleknife.glb`; then
`bun unit-model:pack rattleknife` packs it for the game.

He stays low in a lunge, the right foot forward. The right hand thrusts its
knife to the front, on the camera side, and the left hand holds its knife
high behind him. The satchel hangs on the camera side, and the flat of each
blade faces the camera. He is quick and jittery: in his idle the knives
twitch, the head jerks and the jaw clacks, and the satchel and the string of
bone charms on it rattle on their own bone. His walk is a quick scuttle. His
attack is a double cut: the left knife slashes down, then he lunges and
stabs with the right knife. In the death he falls on his back and his skull
rolls off. He has Swarm, a passive Keyword, so he has no cast clip.
"""

import math
import os
import sys

from mathutils import Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
HOOD = hex_color("#7a5a3c")
HOOD_DARK = hex_color("#54402c")
TEAL = hex_color("#5f837d")
TEAL_DARK = hex_color("#3f5a56")
TUNIC = hex_color("#8a7a62")
TUNIC_DARK = hex_color("#63574a")
RAG = hex_color("#6e5038")
LEATHER = hex_color("#6a4a2e")
LEATHER_DARK = hex_color("#45301e")
BRASS = hex_color("#c49448")
BRASS_DARK = hex_color("#8a6430")
ROPE = hex_color("#cdb98c")
WRAP = hex_color("#8c7458")
WRAP_DARK = hex_color("#66533c")
WOOD = hex_color("#5a3a22")
STEEL = hex_color("#b4b0a6")
STEEL_LIGHT = hex_color("#dcd8cc")

# --- Proportions ---------------------------------------------------------------

# A wiry skeleton: thin bones, narrow hips.
HIP_Z = 0.32
WAIST_Z = 0.38
CHEST_Z = 0.45
SHOULDER_Z = 0.52
NECK_Z = 0.54
HEAD_C = Vector((0, -0.02, 0.625))
KNEE_Z = 0.17
ANKLE_Z = 0.04
LEG_X = 0.042
THIGH = HIP_Z - KNEE_Z
SHIN = KNEE_Z - ANKLE_Z
UPPER_ARM = 0.1
FOREARM = 0.095


def bend(shoulder, wrist, out):
    """The elbow between `shoulder` and `wrist`, bent toward `out`."""
    d = wrist - shoulder
    length = d.length
    along = (UPPER_ARM**2 - FOREARM**2 + length**2) / (2 * length)
    height = math.sqrt(max(UPPER_ARM**2 - along**2, 0.0))
    side = Vector(out) - d.normalized() * Vector(out).dot(d.normalized())
    return shoulder + d.normalized() * along + side.normalized() * height


# The right arm thrusts its knife to the front; the left arm holds its knife
# high behind him. These are the rest (bind) positions.
SR = Vector((-0.08, 0, SHOULDER_Z))
WR = Vector((-0.1, -0.165, 0.44))
ER = bend(SR, WR, (-1, 0.2, -0.6))
TR = WR + (WR - ER).normalized() * 0.035
SL = Vector((0.08, 0, SHOULDER_Z))
WL = Vector((0.15, 0.07, 0.65))
EL = bend(SL, WL, (1, 0.2, -0.6))
TL = WL + (WL - EL).normalized() * 0.035

# Each knife: where the hand grips it, the direction of the blade, and the
# side to which the blade curves (the back of the blade). The flat of each
# blade faces the sides, so the camera sees it.
GRIP_R = WR + (WR - ER).normalized() * 0.02
BLADE_R = Vector((-0.05, -1, 0.3)).normalized()
CURVE_R = Z
GRIP_L = WL + (WL - EL).normalized() * 0.02
BLADE_L = Vector((0.05, 0.45, 1)).normalized()
CURVE_L = -Y

# The satchel hangs at the right hip, on the camera side.
SATCHEL = Vector((-0.078, -0.012, 0.29))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.005, 0.57), "chest"),
    ("head", (0, -0.005, 0.57), (0, -0.01, 0.72), "neck"),
    ("jaw", (0, -0.012, 0.6), (0, -0.065, 0.582), "head"),
    ("scarf", (0, 0.05, 0.53), (0, 0.1, 0.38), "chest"),
    ("satchel", tuple(SATCHEL + Vector((0.01, 0, 0.06))), tuple(SATCHEL), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.014), f"shin.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.34, 0.41)
    return blend("spine", "chest", co.z, 0.42, 0.48)


def hood_weights(co):
    """The hood follows the head, and its drape follows the chest."""
    return blend("chest", "head", co.z, NECK_Z - 0.01, NECK_Z + 0.04)


def scarf_weights(co):
    return blend("scarf", "chest", co.z, 0.44, 0.51)


def skirt_weights(co):
    """The tunic follows the hips at the top and the thighs lower down."""
    t = clamp01((HIP_Z + 0.02 - co.z) / 0.12)
    side = co.x / 0.06
    return {
        "hips": 1 - t,
        "thigh.L": t * clamp01(side + 0.5),
        "thigh.R": t * clamp01(-side + 0.5),
    }


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.054, 0.06, 0.06), 12, 9)
    for sign in (1, -1):
        # Sharp cheek bones.
        kit.sphere(skull.bm, HEAD_C + Vector((0.036 * sign, -0.042, -0.02)), (0.02, 0.017, 0.014), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.052, 0.018)), (0.084, 0.012, 0.012))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    face = Part("face", SOCKET, "head", shade=0)
    for sign in (1, -1):
        # Narrow sockets that tilt up at the outside: a cheeky look.
        kit.sphere(face.bm, HEAD_C + Vector((0.022 * sign, -0.05, 0.002)), (0.018, 0.01, 0.014), 8, 5)
    kit.cone(face.bm, HEAD_C + Vector((0, -0.057, -0.02)), HEAD_C + Vector((0, -0.059, -0.006)), 0.009, 0.002, 4)
    # A wide grin: a row of teeth that curves up at the ends.
    grin = [HEAD_C + Vector((0.034, -0.044, -0.026)), HEAD_C + Vector((0, -0.056, -0.036)), HEAD_C + Vector((-0.034, -0.044, -0.026))]
    teeth = kit.tube(face.bm, grin, [0.006, 0.008, 0.006], 5)
    face.paint(faces_of(teeth), BONE_DARK)
    parts.append(face)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.022 * sign, -0.058, 0.003)), (0.006, 0.004, 0.006), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.036, 0.578), (0.042, 0.034, 0.018), 10, 6)
    lower = kit.tube(jaw.bm, [(0.03, -0.054, 0.588), (0, -0.066, 0.584), (-0.03, -0.054, 0.588)], [0.006, 0.007, 0.006], 5)
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    # The ragged brown hood: a shell round the back of the skull, open at the
    # face, a drape on the shoulders, and a point that hangs at the back.
    hood = Part("hood", HOOD, hood_weights, shade=0.14)
    center = HEAD_C + Vector((0, 0.01, 0.01))
    radius = 0.072
    verts = kit.sphere(hood.bm, center, (0.068, radius, 0.074), 14, 10)
    # The opening faces the front and a little down, so the hood frames the face.
    opening = Vector((0, -1, -0.15)).normalized()
    kit.bmesh.ops.delete(hood.bm, geom=[v for v in verts if (v.co - center).normalized().dot(opening) > 0.5], context="VERTS")
    rim = kit.torus(hood.bm, center + opening * radius * 0.5, opening, radius * 0.86, 0.009, 14, 4)
    hood.paint(faces_of(rim), HOOD_DARK)
    point = kit.cone(hood.bm, center + Vector((0, 0.05, 0.03)), center + Vector((0, 0.1, -0.045)), 0.034, 0.005, 6)
    hood.paint(faces_of(point), HOOD_DARK)
    # A ragged drape that hangs on the shoulders and the back.
    for index in range(7):
        a = math.radians(-120 + index * 40)
        top = Vector((0.066 * math.sin(a), 0.05 * math.cos(a) + 0.015, NECK_Z + 0.012))
        flap = kit.cone(hood.bm, top, top + Vector((0.016 * math.sin(a), 0.012 * math.cos(a), -0.068 - 0.018 * (index % 2))), 0.034, 0.016, 5, squash=0.3)
        hood.paint(faces_of(flap), HOOD_DARK if index % 2 else HOOD)
    parts.append(hood)

    neck = Part("neck", BONE_DARK, "neck")
    kit.cone(neck.bm, (0, 0.006, NECK_Z - 0.02), (0, 0.0, 0.6), 0.012, 0.011, 6)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The tunic: a narrow, ragged top over the ribs.
    top = Part("tunic.top", TUNIC, torso_weights, shade=0.12)
    verts = kit.cone(top.bm, (0, 0.004, 0.33), (0, 0.004, SHOULDER_Z + 0.005), 0.052, 0.06, 10, squash=0.78)
    for face in faces_of(verts):
        c = face.calc_center_median()
        if int((c.x * 3 + c.z) * 40) % 4 == 0:
            top.paint([face], TUNIC_DARK)
    # Ribs show through a tear on the chest, on the camera side.
    for index in range(3):
        z = 0.46 - index * 0.022
        rib = kit.tube(top.bm, [(-0.006, -0.052, z + 0.004), (-0.028, -0.05, z), (-0.044, -0.036, z - 0.004)], [0.005, 0.005, 0.005], 4)
        top.paint(faces_of(rib), BONE)
    parts.append(top)

    # The teal scarf: round the neck, an end that hangs on the chest, and a
    # torn tail behind on its own bone.
    scarf = Part("scarf", TEAL, scarf_weights, shade=0.08)
    kit.torus(scarf.bm, (0, 0.002, NECK_Z - 0.008), (0, 0.2, 1), 0.05, 0.016, 12, 5)
    front = kit.cone(scarf.bm, (-0.022, -0.05, 0.53), (-0.03, -0.062, 0.45), 0.024, 0.012, 5, squash=0.35)
    scarf.paint(faces_of(front), TEAL_DARK)
    for x, length in ((0.018, 0.15), (-0.02, 0.11)):
        tail = kit.cone(scarf.bm, (x, 0.05, 0.53), (x * 1.8, 0.1, 0.53 - length), 0.022, 0.006, 5, squash=0.35)
        scarf.paint(faces_of(tail), TEAL_DARK if x > 0 else TEAL)
    parts.append(scarf)

    # A rope belt with a knot at the front.
    belt = Part("belt", ROPE, "hips", shade=0.05)
    kit.torus(belt.bm, (0, 0.002, 0.33), (0, 0.15, 1), 0.056, 0.008, 12, 4)
    knot = kit.sphere(belt.bm, (-0.012, -0.05, 0.328), (0.012, 0.01, 0.012), 6, 4)
    belt.paint(faces_of(knot), ROPE)
    for x in (-0.006, -0.02):
        end = kit.cone(belt.bm, (x, -0.052, 0.322), (x - 0.006, -0.056, 0.27), 0.004, 0.003, 4)
        belt.paint(faces_of(end), ROPE)
    # A strap from the left shoulder down across the chest to the satchel.
    strap = kit.tube(belt.bm, [(0.05, -0.02, 0.52), (0.02, -0.056, 0.46), (-0.04, -0.054, 0.39), (-0.074, -0.03, 0.35)], [0.006] * 4, 4)
    belt.paint(faces_of(strap), LEATHER_DARK)
    parts.append(belt)

    def tunic_color(row, column):
        if row >= 2:
            return TUNIC_DARK
        return RAG if column % 4 == 1 else (TUNIC_DARK if column % 3 == 2 else TUNIC)

    # Two ragged layers: a long tunic and a short brown rag over it.
    skirt = Part("tunic.skirt", TUNIC, skirt_weights, shade=0.1)
    kit.ragged_cone(skirt, 0.34, 0.17, 0.054, 0.082, 12, 3, 0.8, 0.05, tunic_color, TUNIC_DARK)
    parts.append(skirt)
    rag = Part("rag", RAG, skirt_weights, shade=0.1)
    kit.ragged_cone(rag, 0.35, 0.25, 0.058, 0.074, 10, 2, 0.8, 0.04, lambda row, column: HOOD_DARK if column % 3 == 0 else RAG, HOOD_DARK)
    parts.append(rag)

    # The satchel: a flat leather bag with a flap and a brass coin on it, and
    # a string of bone charms that rattle.
    satchel = Part("satchel", LEATHER, "satchel", shade=0.1)
    kit.box(satchel.bm, SATCHEL, (0.03, 0.078, 0.07))
    flap = kit.box(satchel.bm, SATCHEL + Vector((-0.004, 0, 0.022)), (0.026, 0.082, 0.032))
    satchel.paint(faces_of(flap), LEATHER_DARK)
    coin = kit.cone(satchel.bm, SATCHEL + Vector((-0.017, 0, 0.012)), SATCHEL + Vector((-0.024, 0, 0.012)), 0.019, 0.019, 10)
    satchel.paint(faces_of(coin), BRASS)
    ring = kit.torus(satchel.bm, SATCHEL + Vector((-0.024, 0, 0.012)), (1, 0, 0), 0.013, 0.003, 10, 3)
    satchel.paint(faces_of(ring), BRASS_DARK)
    for index in range(4):
        y = -0.03 + index * 0.02
        charm = kit.cone(satchel.bm, SATCHEL + Vector((-0.018, y, -0.034)), SATCHEL + Vector((-0.02, y + 0.004, -0.06 - 0.008 * (index % 2))), 0.006, 0.004, 4)
        satchel.paint(faces_of(charm), BONE if index % 2 else BONE_DARK)
        knob = kit.sphere(satchel.bm, SATCHEL + Vector((-0.02, y + 0.004, -0.064 - 0.008 * (index % 2))), (0.007, 0.007, 0.007), 5, 3)
        satchel.paint(faces_of(knob), BONE)
    parts.append(satchel)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"humerus.{side}", BONE, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.013, 0.011, 6)
        knob = kit.sphere(upper.bm, e, (0.015, 0.015, 0.015), 6, 4)
        upper.paint(faces_of(knob), BONE_DARK)
        # A ragged short sleeve.
        sleeve = kit.cone(upper.bm, s + (s - e).normalized() * 0.01, s + (e - s) * 0.5, 0.03, 0.026, 7)
        upper.paint(faces_of(sleeve), HOOD)
        parts.append(upper)

        forearm = Part(f"radius.{side}", BONE, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.011, 0.009, 6)
        wrap = kit.cone(forearm.bm, w - d * 0.04, w - d * 0.006, 0.015, 0.014, 6)
        forearm.paint(faces_of(wrap), WRAP)
        parts.append(forearm)

        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.016, (0.016, 0.015, 0.018), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.006 * index, 0.004 * index, 0.0))
            finger = kit.cone(hand.bm, w + d * 0.026 + offset, w + d * 0.042 + offset, 0.005, 0.004, 4)
            hand.paint(faces_of(finger), BONE_DARK)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}", BONE, f"thigh.{side}")
        kit.cone(femur.bm, hip, knee, 0.014, 0.012, 6)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.01, 0.004)), (0.019, 0.017, 0.019), 6, 4)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        # Cloth wraps from below the knee to the ankle.
        shin = Part(f"shin.{side}", WRAP, f"shin.{side}", shade=0.12)
        verts = kit.cone(shin.bm, knee - Vector((0, 0, 0.022)), ankle + Vector((0, 0, 0.004)), 0.019, 0.016, 7)
        for face in faces_of(verts):
            if int(face.calc_center_median().z * 80) % 2:
                shin.paint([face], WRAP_DARK)
        bone = kit.cone(shin.bm, knee, knee - Vector((0, 0, 0.03)), 0.011, 0.011, 5)
        shin.paint(faces_of(bone), BONE)
        parts.append(shin)

        # Bare bony feet: a heel, a long instep and three toe bones.
        foot = Part(f"foot.{side}", BONE, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, 0.004, 0.02), (0.015, 0.018, 0.016), 6, 4)
        kit.cone(foot.bm, (LEG_X * sign, 0.0, 0.02), (LEG_X * sign, -0.05, 0.01), 0.013, 0.01, 5)
        for toe in (-1, 0, 1):
            bone = kit.cone(foot.bm, (LEG_X * sign + toe * 0.009, -0.045, 0.01), (LEG_X * sign + toe * 0.012, -0.075, 0.006), 0.005, 0.004, 4)
            foot.paint(faces_of(bone), BONE_DARK)
        parts.append(foot)
    return parts


def curved_knife(part, grip, blade, curve, length):
    """
    A curved knife: a wooden grip, a brass guard and a wide steel blade that
    curves toward `curve`, with a light cutting edge on the other side.
    """
    curve = (curve - blade * curve.dot(blade)).normalized()
    flat = blade.cross(curve).normalized()
    handle = kit.cone(part.bm, grip - blade * 0.032, grip + blade * 0.012, 0.007, 0.008, 6)
    part.paint(faces_of(handle), WOOD)
    pommel = kit.sphere(part.bm, grip - blade * 0.034, (0.008, 0.008, 0.008), 5, 4)
    part.paint(faces_of(pommel), BRASS)
    guard = kit.slab(part.bm, grip + blade * 0.015, blade * 0.004, curve * 0.016, flat * 0.006)
    part.paint(faces_of(guard), BRASS)

    rows_front, rows_back = [], []
    steps = 5
    for index in range(steps + 1):
        s = index / steps
        center = grip + blade * (0.018 + s * length) + curve * (0.3 * s * s * length)
        # The width is at its widest near the middle, and goes to a point.
        width = 0.024 * (1 - s**2) + 0.002
        spine = center + curve * width * 0.4
        edge = center - curve * width * 0.6
        row = [spine, center, edge]
        rows_front.append([p + flat * 0.003 for p in row])
        rows_back.append([p - flat * 0.003 for p in row])

    def blade_color(face_side, row, column):
        return STEEL_LIGHT if column == 1 else STEEL

    kit.panel(part, rows_front, rows_back, blade_color)


def knife_parts():
    right = Part("knife.R", STEEL, "hand.R", shade=0.02)
    curved_knife(right, GRIP_R, BLADE_R, CURVE_R, 0.12)
    left = Part("knife.L", STEEL, "hand.L", shade=0.02)
    curved_knife(left, GRIP_L, BLADE_L, CURVE_L, 0.11)
    return [right, left]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("Rattleknife", BONES)
    parts = head_parts() + body_parts() + limb_parts() + knife_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "RattleknifeMesh")
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

    def leg(side, swing, drop, tilt=0.0, splay=0.0):
        """
        One leg with its foot flat on the ground. `swing` is the angle of the
        thigh (negative: the knee goes forward), `drop` is how far the hips
        go down, and `tilt` is the forward tilt of the hips. The knee bends so
        the foot stays at the ground.
        """
        a = math.radians(swing)
        reach = clamp01((THIGH + SHIN - drop - THIGH * math.cos(a)) / SHIN)
        c = max(math.acos(reach), a)
        shin = math.degrees(c - a)
        return {
            f"thigh.{side}": t(f"thigh.{side}", (X, swing - tilt), (Y, splay)),
            f"shin.{side}": t(f"shin.{side}", (X, shin)),
            f"foot.{side}": t(f"foot.{side}", (X, -math.degrees(c))),
        }

    def lunge_legs(drop, front=-38.0, back=16.0, tilt=8.0):
        """The right foot forward and the left foot back, both flat."""
        return {**leg("R", front, drop, tilt, -4), **leg("L", back, drop, tilt, 4)}

    def stand(breath=0.0, jitter=0.0, chat=0.0, twitch=0.0):
        """
        The idle lunge: low, the chest forward, the right knife to the front
        and the left knife high. `jitter` (-1 to 1) jerks the head, `chat`
        opens the jaw and `twitch` (-1 to 1) flicks the knives.
        """
        drop = 0.05 + breath * 0.006
        return {
            "hips@loc": at("hips", (0, 0.012, -drop)),
            "hips": t("hips", (X, 8), (Z, -6)),
            "spine": t("spine", (X, 12 + breath * 2)),
            "chest": t("chest", (X, 8 - breath * 2), (Z, -6)),
            "neck": t("neck", (X, -12), (Z, -6)),
            "head": t("head", (X, -8 + 4 * abs(jitter)), (Y, 14 * jitter), (Z, -14 + 6 * jitter)),
            "jaw": t("jaw", (X, 4 + chat * 24)),
            "upperarm.R": t("upperarm.R", (X, -6 - breath * 3)),
            "forearm.R": t("forearm.R", (X, -4 * twitch)),
            "hand.R": t("hand.R", (X, 10 * twitch), (Y, -8 * twitch)),
            "upperarm.L": t("upperarm.L", (X, 4 * twitch), (Y, 6 * breath)),
            "hand.L": t("hand.L", (X, -14 * twitch)),
            "scarf": t("scarf", (X, -10 - breath * 4), (Y, 6 * jitter)),
            "satchel": t("satchel", (X, 10 * twitch), (Y, 8 * jitter)),
            **lunge_legs(drop),
        }

    def slump(breath=0.0):
        """Low HP: down on the left knee, the head low, the jaw open, the right knife still up."""
        drop = 0.13 + breath * 0.006
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.03, -drop)),
            hips=t("hips", (X, 10)),
            spine=t("spine", (X, 26 + breath * 4)),
            chest=t("chest", (X, 12 + breath * 3)),
            neck=t("neck", (X, 6)),
            head=t("head", (X, 10 + breath * 6), (Y, 18), (Z, -10)),
            jaw=t("jaw", (X, 20 + breath * 8)),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -6)),
            forearm__R=t("forearm.R", (X, 10)),
            upperarm__L=t("upperarm.L", (X, 60), (Y, -10)),
            forearm__L=t("forearm.L", (X, 40)),
            scarf=t("scarf", (X, -40)),
            satchel=t("satchel", (X, -10)),
            **leg("R", -64, drop, 10, -6),
            thigh__L=t("thigh.L", (X, 0), (Y, 6)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -30)),
        )

    def recoil(base, amount=1.0):
        """A hit jolts him back: the jaw drops, the head snaps back and the knives fly out."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, -0.05)),
            spine=t("spine", (X, 2)),
            chest=t("chest", (X, -12 * amount), (Z, 10 * amount)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -24 * amount), (Y, 16 * amount)),
            jaw=t("jaw", (X, 30 * amount)),
            upperarm__R=t("upperarm.R", (X, -40 * amount), (Y, -30 * amount)),
            upperarm__L=t("upperarm.L", (X, -20 * amount), (Y, 20 * amount)),
            scarf=t("scarf", (X, -34 * amount)),
            satchel=t("satchel", (X, -30 * amount), (Y, -20 * amount)),
        )

    def stagger(base):
        """He totters, the bones loose."""
        drop = 0.07
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -drop)),
            hips=t("hips", (Z, -12), (Y, 8)),
            spine=t("spine", (X, -8), (Y, -10)),
            chest=t("chest", (X, -6)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20), (Y, -26)),
            jaw=t("jaw", (X, 34)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, -40)),
            forearm__R=t("forearm.R", (X, 20)),
            upperarm__L=t("upperarm.L", (X, 40), (Y, 30)),
            satchel=t("satchel", (X, 30)),
            **leg("R", -20, drop, 0, -8),
            **leg("L", 20, drop, 0, 8),
        )

    def fallen(base, bounce=0.0, roll=1.0):
        """
        Flat on the back, the knives out to the sides. `roll` moves the skull
        off the neck and rolls it on the ground, to the camera side.
        """
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.05)),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (X, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -20 * roll), (Y, -60 * roll)),
            head_at_loc=at("head", (-0.12 * roll, 0.03 * roll, 0.04 * roll)),
            jaw=t("jaw", (X, 30)),
            upperarm__R=t("upperarm.R", (X, 60), (Y, -50)),
            forearm__R=t("forearm.R", (X, 0)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, 40)),
            forearm__L=t("forearm.L", (X, 0)),
            thigh__L=t("thigh.L", (X, -10), (Y, 8)),
            shin__L=t("shin.L", (X, 14)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -30), (Y, -8)),
            shin__R=t("shin.R", (X, 44)),
            foot__R=t("foot.R", (X, 0)),
            scarf=t("scarf", (X, -50)),
            satchel=t("satchel", (X, -50)),
        )

    def crouch(base):
        """Very low, on the toes, as a summon starts and a Rebirth gets up."""
        drop = 0.15
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -drop)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, -16)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, 4)),
            upperarm__R=t("upperarm.R", (X, 20), (Y, -10)),
            forearm__R=t("forearm.R", (X, 10)),
            upperarm__L=t("upperarm.L", (X, 50), (Y, 10)),
            forearm__L=t("forearm.L", (X, 30)),
            scarf=t("scarf", (X, 20)),
            **lunge_legs(drop, -60, 20, 8),
        )

    def spread(base):
        """Up again with a rattle: both knives high and the jaw wide in a grin."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            spine=t("spine", (X, 2)),
            chest=t("chest", (X, -8)),
            head=t("head", (X, -16), (Y, 14)),
            jaw=t("jaw", (X, 28)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, -20)),
            forearm__R=t("forearm.R", (X, -20)),
            upperarm__L=t("upperarm.L", (Y, 30), (X, -10)),
            satchel=t("satchel", (Y, 30)),
            **lunge_legs(0.03, -24, 14, 8),
        )

    def step(front, lift=0.0):
        """A quick scuttle. `front` is 1 for the right foot, -1 for the left; `lift` is in the air."""
        lead, back = ("R", "L") if front == 1 else ("L", "R")
        drop = 0.06 - lift * 0.012
        result = pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.012, -drop)),
            hips=t("hips", (X, 10), (Z, -6 + 6 * front)),
            spine=t("spine", (X, 16), (Y, 4 * front)),
            chest=t("chest", (X, 8), (Z, -6 - 6 * front)),
            head=t("head", (X, -8), (Y, 8 * front), (Z, -14)),
            jaw=t("jaw", (X, 4 + 16 * lift)),
            upperarm__R=t("upperarm.R", (X, -6 - 10 * front)),
            upperarm__L=t("upperarm.L", (X, 8 * front)),
            scarf=t("scarf", (X, -24), (Y, 8 * front)),
            satchel=t("satchel", (X, 20 * front), (Y, -14 * front)),
            **leg(back, 22, drop, 10),
            **leg(lead, -34, drop, 10),
        )
        if lift:
            result.update(
                {
                    f"thigh.{lead}": t(f"thigh.{lead}", (X, -44 - 10)),
                    f"shin.{lead}": t(f"shin.{lead}", (X, 70)),
                    f"foot.{lead}": t(f"foot.{lead}", (X, -10)),
                }
            )
        return result

    # The attack: a double cut. The left knife slashes down at frame 10, then
    # he lunges and stabs with the right knife. The slash effect starts at
    # 50% of the attack (`MELEE_IMPACT` in fx.ts), so the stab lands at frame
    # 15 of 30.
    def wind(base):
        """He pulls the right knife back, lifts the left knife high and turns to his right."""
        drop = 0.07
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -drop)),
            hips=t("hips", (X, 8), (Z, -20)),
            spine=t("spine", (X, 10), (Z, -8)),
            chest=t("chest", (X, 4), (Z, -14)),
            neck=t("neck", (X, -10), (Z, 10)),
            head=t("head", (X, -10), (Z, 6)),
            jaw=t("jaw", (X, 22)),
            upperarm__R=t("upperarm.R", (X, 40), (Y, -20)),
            forearm__R=t("forearm.R", (X, -60)),
            hand__R=t("hand.R", (X, 20)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, 10)),
            forearm__L=t("forearm.L", (X, -20)),
            scarf=t("scarf", (X, -20), (Y, 20)),
            satchel=t("satchel", (Y, -24)),
            **lunge_legs(drop, -30, 20, 8),
        )

    def slash(base):
        """The left knife slashes down across his front."""
        drop = 0.07
        return pose(
            wind(base),
            hips=t("hips", (X, 8), (Z, 4)),
            spine=t("spine", (X, 18), (Z, 6)),
            chest=t("chest", (X, 10), (Z, 12)),
            neck=t("neck", (X, -14), (Z, -6)),
            head=t("head", (X, -8), (Z, -10)),
            upperarm__L=t("upperarm.L", (X, 110), (Z, -30)),
            forearm__L=t("forearm.L", (X, 30)),
            hand__L=t("hand.L", (X, 40)),
            satchel=t("satchel", (Y, 20)),
            **lunge_legs(drop, -34, 18, 8),
        )

    def stab(base):
        """He lunges deep and drives the right knife straight to the front."""
        drop = 0.1
        return pose(
            slash(base),
            hips_at_loc=at("hips", (0, -0.07, -drop)),
            hips=t("hips", (X, 10), (Z, 12)),
            spine=t("spine", (X, 18), (Z, 6)),
            chest=t("chest", (X, 8), (Z, 10)),
            neck=t("neck", (X, -18), (Z, -14)),
            head=t("head", (X, -10), (Z, -12), (Y, 8)),
            jaw=t("jaw", (X, 28)),
            upperarm__R=t("upperarm.R", (X, -50), (Y, -6)),
            forearm__R=t("forearm.R", (X, -6)),
            hand__R=t("hand.R", (X, -10)),
            upperarm__L=t("upperarm.L", (X, 70), (Y, 30)),
            forearm__L=t("forearm.L", (X, 10)),
            hand__L=t("hand.L", (X, 0)),
            scarf=t("scarf", (X, -24), (Y, -10)),
            satchel=t("satchel", (X, -40), (Y, 30)),
            **lunge_legs(drop, -62, 30, 10),
        )

    clips = []
    # The idle: jittery. The head jerks, the jaw clacks, the knives twitch
    # and the satchel rattles, on an uneven beat.
    idle = Clip("idle", 36, loop=True)
    for frame, breath, jitter, chat, twitch in (
        (0, 0, 0, 0, 0),
        (3, 0.2, 0.8, 1, 0.6),
        (5, 0.3, -0.4, 0, -0.6),
        (8, 0.4, 0, 0.6, 0.2),
        (12, 0.7, 0, 0, 0),
        (15, 0.8, -1, 1, 1),
        (17, 0.9, 0.6, 0, -0.8),
        (19, 1, -0.2, 0.8, 0.4),
        (24, 0.7, 0, 0, 0),
        (28, 0.4, 0.5, 0.5, -0.3),
        (30, 0.3, -0.5, 0, 0.5),
        (36, 0, 0, 0, 0),
    ):
        idle.key(frame, stand(breath, jitter, chat, twitch))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    walk = Clip("walk", 20, loop=True)
    walk.key(0, step(1)).key(5, step(1, 1)).key(10, step(-1)).key(15, step(-1, 1)).key(20, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(6, wind(stand())).key(10, slash(stand())).key(15, stab(stand())).key(19, stab(stand()))
    attack.key(26, stand(0.4, 0.4, 0.6)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(24, fallen(stand(), 0, 0.2)).key(28, fallen(stand(), 5, 0.7)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then the
    # skull goes back on and he gets up with a rattle.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(16, fallen(stand(), 0, 0.5)).key(21, fallen(stand()))
    rebirth.key(32, crouch(stand())).key(41, spread(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), jaw=t("jaw", (X, 24))))
    summon.key(17, spread(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "rattleknife.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
