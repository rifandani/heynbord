"""
Ankle Snatcher (`goblin.ankleSnatcher`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a small, thin pale goblin girl
with wild white hair, very large ears that stream back, big amber eyes, a
long pointed nose and a wide grin, brass goggles on her forehead, a blue
neckerchief, a cream tunic with leather straps, torn brown trousers, leather
wraps at the ankles and bare feet. A coil of rope hangs at her left hip and a
small green lantern at her right hip. She holds a long hook made from a bent
copper pipe in both hands, and a stolen boot hangs from the hook. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/ankle-snatcher.glb`; then
`bun unit-model:pack ankle-snatcher` packs it for the game.

The right hand holds the back of the pipe at her right hip, and the left
hand holds it further forward (IK to the `grip.L` bone of the pipe). The
hook is low in front of her, at ankle height (Hobble). The `boot` bone lets
the boot swing on the hook. At rest she crouches low and bounces on her
toes. She has Swift, so her walk is a fast run, low and leaned forward. Her
attack is a low lunge: the hook sweeps forward at ankle height, then she
yanks it back. She has no Keyword that she uses by her own action, so she has
no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, blend, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

SKIN = hex_color("#c4c0b8")
SKIN_DARK = hex_color("#8c8880")
EAR = hex_color("#eaa48c")
NOSE = hex_color("#e09484")
HAIR = hex_color("#f2ead8")
HAIR_DARK = hex_color("#d6caa8")
EYES = hex_color("#f2a838")
PUPIL = hex_color("#1d140e")
MOUTH = hex_color("#4a1e1a")
TEETH = hex_color("#f4eedc")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
LENS = hex_color("#c88a2a")
NECKERCHIEF = hex_color("#3e5470")
TUNIC = hex_color("#e2d6ba")
TUNIC_DARK = hex_color("#b8a888")
LEATHER = hex_color("#7a4a2a")
LEATHER_DARK = hex_color("#4a2c1a")
TROUSERS = hex_color("#6a5040")
TROUSERS_DARK = hex_color("#4a3628")
WRAP = hex_color("#8a6038")
COPPER = hex_color("#b06a38")
COPPER_DARK = hex_color("#7a4422")
STEEL = hex_color("#c4c2bc")
STEEL_DARK = hex_color("#7c7a74")
BOOT = hex_color("#6a4026")
BOOT_DARK = hex_color("#42261a")
ROPE = hex_color("#c8a062")
ROPE_DARK = hex_color("#94723e")
LAMP = hex_color("#b4ec58")
LAMP_DARK = hex_color("#4a6a2a")

# --- Proportions ---------------------------------------------------------------

# She is small and thin: narrow hips and long, thin arms.
HIP_Z = 0.3
WAIST_Z = 0.36
CHEST_Z = 0.42
SHOULDER_Z = 0.48
NECK_Z = 0.5
HEAD_C = Vector((0, -0.025, 0.6))
KNEE_Z = 0.17
ANKLE_Z = 0.04
LEG_X = 0.045

# The hook: a copper pipe from the right hip forward and down. The right hand
# holds the back of the pipe, and the left hand holds it further forward.
PIPE = Vector((0.1, -0.85, -0.42)).normalized()
GRIP_R = Vector((-0.08, 0.02, 0.36))
GRIP_L = GRIP_R + PIPE * 0.12
PIPE_BACK = GRIP_R - PIPE * 0.05
PIPE_END = GRIP_R + PIPE * 0.44
# The hook bends up and back over the end of the pipe; the boot hangs on its top.
FORWARD = Vector((PIPE.x, PIPE.y, 0)).normalized()
HOOK = [
    PIPE_END,
    PIPE_END + FORWARD * 0.035 + Z * 0.025,
    PIPE_END + FORWARD * 0.045 + Z * 0.065,
    PIPE_END + FORWARD * 0.022 + Z * 0.092,
    PIPE_END - FORWARD * 0.008 + Z * 0.082,
    PIPE_END - FORWARD * 0.016 + Z * 0.055,
]
BOOT_TOP = PIPE_END + FORWARD * 0.03 + Z * 0.088

SR = Vector((-0.085, 0, SHOULDER_Z))
ER = Vector((-0.125, 0.03, 0.4))
WR = GRIP_R + Vector((0, 0.006, 0.012))
TR = WR + (WR - ER).normalized() * 0.035
SL = Vector((0.085, 0, SHOULDER_Z))
EL = Vector((0.11, -0.05, 0.38))
WL = GRIP_L + Vector((0.008, 0.004, 0.012))
TL = WL + (WL - EL).normalized() * 0.035

LANTERN_C = Vector((-0.085, -0.03, 0.235))
ROPE_C = Vector((0.085, 0.02, 0.27))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, -0.006, 0.51), "chest"),
    ("head", (0, -0.006, 0.51), (0, -0.012, 0.69), "neck"),
    # The pole that the left elbow points to: out, down and back.
    ("pole.L", (0.3, 0.2, 0.3), (0.3, 0.2, 0.35), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.016), f"shin.{side}"),
    ]
BONES += [
    ("pipe", tuple(GRIP_R), tuple(GRIP_R + PIPE * 0.1), "hand.R"),
    ("grip.L", tuple(GRIP_L), tuple(GRIP_L + PIPE * 0.05), "pipe"),
    ("boot", tuple(BOOT_TOP), tuple(BOOT_TOP - Z * 0.05), "pipe"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.3, 0.37)
    return blend("spine", "chest", co.z, 0.38, 0.44)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.072, 0.07, 0.072), 14, 10)
    # A narrow chin and a long, pointed nose.
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.05)), (0.042, 0.036, 0.03), 10, 6)
    nose = kit.tube(head.bm, [HEAD_C + Vector((0, -0.064, 0.0)), HEAD_C + Vector((0, -0.1, -0.008)), HEAD_C + Vector((0, -0.124, -0.022))], [0.016, 0.011, 0.005], 6)
    head.paint(faces_of(nose), NOSE)
    for sign in (1, -1):
        # Very large goblin ears that stream back as she runs. Each ear is a
        # flat leaf with its face to the side, so the camera sees it.
        base = HEAD_C + Vector((0.058 * sign, 0.02, 0.008))
        tip = HEAD_C + Vector((0.13 * sign, 0.19, 0.03))
        ear = kit.cone(head.bm, base, tip, 0.05, 0.003, 8)
        axis = (tip - base).normalized()
        thin = Z.cross(axis).normalized()
        for vert in ear:
            offset = vert.co - base
            vert.co -= thin * offset.dot(thin) * 0.7
        for face in faces_of(ear):
            face.normal_update()
            if face.normal.x * sign > 0.3:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A wide open grin with a row of top teeth.
    mouth_c = HEAD_C + Vector((0, -0.056, -0.036))
    kit.sphere(face.bm, mouth_c, (0.032, 0.016, 0.014), 10, 6)
    teeth = kit.box(face.bm, mouth_c + Vector((0, -0.01, 0.007)), (0.044, 0.008, 0.008))
    face.paint(faces_of(teeth), TEETH)
    # Big round amber eyes.
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.058, 0.016))
        eye = kit.sphere(face.bm, center, (0.021, 0.014, 0.022), 10, 6)
        face.paint(faces_of(eye), EYES)
        pupil = kit.sphere(face.bm, center + Vector((-0.004 * sign, -0.012, 0)), (0.008, 0.004, 0.01), 6, 4)
        face.paint(faces_of(pupil), PUPIL)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.08)
    # Wild white hair, with tufts that blow back.
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.02, 0.04)), (0.08, 0.08, 0.052), 12, 7)
    kit.sphere(hair.bm, HEAD_C + Vector((0, 0.05, -0.01)), (0.072, 0.05, 0.064), 10, 6)
    for index in range(9):
        a = math.radians(-120 + index * 30)
        root = HEAD_C + Vector((0.05 * math.sin(a), 0.03 + 0.04 * math.cos(a), 0.05))
        reach = 0.05 + 0.02 * ((index * 5) % 3)
        tip = root + Vector((reach * 0.6 * math.sin(a), 0.06 + reach * 0.5, 0.03 - 0.02 * (index % 3)))
        tuft = kit.cone(hair.bm, root, tip, 0.03, 0.005, 5)
        if index % 2:
            hair.paint(faces_of(tuft), HAIR_DARK)
    parts.append(hair)

    # Brass goggles up on the forehead, on a leather band.
    goggles = Part("goggles", BRASS, "head", shade=0.05)
    band = kit.torus(goggles.bm, HEAD_C + Vector((0, 0.004, 0.036)), (0, 0.25, 1), 0.077, 0.007, 16, 4)
    goggles.paint(faces_of(band), LEATHER_DARK)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.029 * sign, -0.068, 0.054))
        out = Vector((0.15 * sign, -1, 0.35)).normalized()
        kit.cone(goggles.bm, center - out * 0.006, center + out * 0.02, 0.022, 0.02, 12)
        rim = kit.torus(goggles.bm, center + out * 0.02, out, 0.019, 0.005, 12, 3)
        goggles.paint(faces_of(rim), BRASS_DARK)
        lens = kit.cone(goggles.bm, center + out * 0.018, center + out * 0.022, 0.016, 0.016, 12)
        goggles.paint(faces_of(lens), LENS)
    parts.append(goggles)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, 0, 0.48), (0, -0.004, 0.56), 0.022, 0.02, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    tunic = Part("tunic", TUNIC, torso_weights)
    kit.cone(tunic.bm, (0, 0, 0.25), (0, 0, 0.49), 0.07, 0.062, 12, squash=0.8)
    # A torn hem.
    for index in range(10):
        a = math.radians(index * 36 + 10)
        top = Vector((0.07 * math.sin(a), -0.056 * math.cos(a), 0.27))
        rag = kit.cone(tunic.bm, top, top + Vector((0.008 * math.sin(a), -0.008 * math.cos(a), -0.035 - 0.012 * (index % 3))), 0.018, 0.004, 4, squash=0.5)
        tunic.paint(faces_of(rag), TUNIC_DARK if index % 2 else TUNIC)
    # Leather straps that cross the chest.
    for sign in (1, -1):
        strap = kit.tube(tunic.bm, [Vector((0.05 * sign, -0.04, 0.48)), Vector((0.0, -0.062, 0.4)), Vector((-0.06 * sign, -0.05, 0.31))], [0.006, 0.006, 0.006], 4)
        tunic.paint(faces_of(strap), LEATHER)
    parts.append(tunic)

    kerchief = Part("kerchief", NECKERCHIEF, "chest", shade=0.06)
    kit.torus(kerchief.bm, (0, -0.004, 0.485), (0, 0.2, 1), 0.044, 0.014, 12, 5)
    kit.cone(kerchief.bm, (0, -0.048, 0.48), (0.004, -0.062, 0.44), 0.018, 0.004, 5, squash=0.4)
    parts.append(kerchief)

    belt = Part("belt", LEATHER, "hips", shade=0.04)
    kit.cone(belt.bm, (0, -0.004, 0.285), (0, -0.004, 0.31), 0.074, 0.074, 12, squash=0.82)
    buckle = kit.box(belt.bm, (0, -0.064, 0.297), (0.022, 0.008, 0.02))
    belt.paint(faces_of(buckle), BRASS)
    parts.append(belt)

    # A small lamp at the right hip, with green glass, on the camera side.
    lantern = Part("lantern", BRASS, "hips", shade=0.04)
    c = LANTERN_C
    glass = kit.cone(lantern.bm, c - Z * 0.022, c + Z * 0.022, 0.017, 0.017, 8)
    lantern.paint(faces_of(glass), LAMP)
    for z in (-0.026, 0.026):
        kit.cone(lantern.bm, c + Z * (z - 0.004), c + Z * (z + 0.004), 0.021, 0.019, 8)
    kit.cone(lantern.bm, c + Z * 0.03, c + Z * 0.042, 0.014, 0.004, 8)
    for a in range(4):
        angle = math.radians(45 + a * 90)
        bar = kit.cone(lantern.bm, c + Vector((math.cos(angle) * 0.018, math.sin(angle) * 0.018, -0.022)), c + Vector((math.cos(angle) * 0.018, math.sin(angle) * 0.018, 0.022)), 0.003, 0.003, 4)
        lantern.paint(faces_of(bar), BRASS_DARK)
    hook = kit.tube(lantern.bm, [c + Z * 0.042, Vector((-0.07, -0.03, 0.297))], [0.0035, 0.0035], 4)
    lantern.paint(faces_of(hook), LEATHER_DARK)
    parts.append(lantern)

    # A coil of rope at the left hip.
    rope = Part("rope", ROPE, "hips", shade=0.05)
    for index, offset in enumerate((-0.012, 0.0, 0.012)):
        loop = kit.torus(rope.bm, ROPE_C + Vector((offset, 0.004 * index, -0.004 * index)), (1, 0.1, 0), 0.042, 0.007, 14, 4)
        if index == 1:
            rope.paint(faces_of(loop), ROPE_DARK)
    tie = kit.torus(rope.bm, ROPE_C + Vector((0, 0, 0.04)), (0, 0, 1), 0.012, 0.004, 8, 3)
    rope.paint(faces_of(tie), LEATHER_DARK)
    parts.append(rope)

    hips = Part("hips", TROUSERS, "hips")
    kit.cone(hips.bm, (0, 0, 0.22), (0, 0, 0.29), 0.068, 0.068, 12, squash=0.82)
    parts.append(hips)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        upper = Part(f"upperarm.{side}", SKIN, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.022, 0.018, 8)
        sleeve = kit.cone(upper.bm, s - (e - s) * 0.1, s + (e - s) * 0.55, 0.03, 0.026, 8)
        upper.paint(faces_of(sleeve), TUNIC)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", SKIN, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.017, 0.014, 8)
        bracer = kit.cone(forearm.bm, e + (w - e) * 0.55, w - d * 0.004, 0.018, 0.017, 8)
        forearm.paint(faces_of(bracer), LEATHER)
        parts.append(forearm)

        # Long goblin fingers round the pipe.
        hand = Part(f"hand.{side}", SKIN, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.014, (0.016, 0.015, 0.02), 8, 6)
        parts.append(hand)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip + Vector((0, 0, 0.015)), knee, 0.038, 0.032, 8)
        patch = kit.sphere(thigh.bm, knee + Vector((-0.006 * sign, -0.028, 0.03)), (0.016, 0.008, 0.016), 6, 4)
        thigh.paint(faces_of(patch), TROUSERS_DARK)
        parts.append(thigh)

        # The trousers end in a torn hem below the knee, and leather wraps the ankle.
        shin = Part(f"shin.{side}", SKIN, f"shin.{side}")
        hem = kit.cone(shin.bm, knee + Vector((0, 0, 0.01)), knee - Vector((0, 0, 0.05)), 0.033, 0.035, 8)
        for face in faces_of(hem):
            shin.paint([face], TROUSERS_DARK if face.calc_center_median().y < 0 else TROUSERS)
        kit.cone(shin.bm, knee - Vector((0, 0, 0.045)), ankle, 0.02, 0.017, 8)
        for z in (0.012, 0.03, 0.048):
            wrap = kit.torus(shin.bm, ankle + Vector((0, 0, z)), (0, 0, 1), 0.02, 0.0045, 8, 3)
            shin.paint(faces_of(wrap), WRAP)
        parts.append(shin)

        # Big bare goblin feet.
        foot = Part(f"foot.{side}", SKIN, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, (LEG_X * sign, -0.03, 0.016), (0.025, 0.054, 0.016), 8, 6)
        for toe in (-1, 0, 1):
            kit.sphere(foot.bm, (LEG_X * sign + toe * 0.012, -0.078, 0.01), (0.008, 0.01, 0.008), 5, 4)
        parts.append(foot)
    return parts


def hook_parts():
    pipe = Part("pipe", COPPER, "pipe", shade=0.03)
    kit.cone(pipe.bm, PIPE_BACK, PIPE_END, 0.009, 0.009, 8)
    # Brass joints along the pipe, and a leather wrap at each hand.
    for along in (0.2, 0.33):
        joint = kit.cone(pipe.bm, GRIP_R + PIPE * (along - 0.012), GRIP_R + PIPE * (along + 0.012), 0.012, 0.012, 8)
        pipe.paint(faces_of(joint), BRASS)
    cap = kit.cone(pipe.bm, PIPE_BACK - PIPE * 0.012, PIPE_BACK + PIPE * 0.006, 0.012, 0.012, 8)
    pipe.paint(faces_of(cap), COPPER_DARK)
    for grip in (GRIP_R, GRIP_L):
        wrap = kit.cone(pipe.bm, grip - PIPE * 0.024, grip + PIPE * 0.024, 0.0105, 0.0105, 8)
        pipe.paint(faces_of(wrap), LEATHER_DARK)
    # The steel hook at the end, with a brass collar.
    collar = kit.cone(pipe.bm, PIPE_END - PIPE * 0.02, PIPE_END + PIPE * 0.006, 0.013, 0.012, 8)
    pipe.paint(faces_of(collar), BRASS_DARK)
    hook = kit.tube(pipe.bm, HOOK, [0.009, 0.009, 0.008, 0.007, 0.006, 0.003], 6)
    pipe.paint(faces_of(hook), STEEL)
    return [pipe]


def boot_parts():
    """The stolen boot hangs from the top of the hook by its strap."""
    boot = Part("boot", BOOT, "boot", shade=0.08)
    top = BOOT_TOP - Z * 0.022
    side = FORWARD.cross(Z).normalized()
    strap = kit.torus(boot.bm, BOOT_TOP - Z * 0.006, side, 0.014, 0.003, 8, 3)
    boot.paint(faces_of(strap), BOOT_DARK)
    # The leg of the boot hangs down, and the foot points forward.
    # A knight's boot: much bigger than her own foot.
    kit.cone(boot.bm, top + Z * 0.004, top - Z * 0.07, 0.027, 0.024, 8)
    cuff = kit.cone(boot.bm, top + Z * 0.004, top - Z * 0.012, 0.031, 0.029, 8)
    boot.paint(faces_of(cuff), BOOT_DARK)
    kit.sphere(boot.bm, top - Z * 0.076 + FORWARD * 0.022, (0.026, 0.026, 0.018), 8, 5)
    toe = kit.sphere(boot.bm, top - Z * 0.078 + FORWARD * 0.05, (0.02, 0.02, 0.015), 6, 4)
    boot.paint(faces_of(toe), BOOT_DARK)
    sole = kit.box(boot.bm, top - Z * 0.094 + FORWARD * 0.026, (0.036, 0.074, 0.008))
    boot.paint(faces_of(sole), BOOT_DARK)
    for z in (0.03, 0.054):
        buckle = kit.torus(boot.bm, top - Z * z, (0, 0, 1), 0.027, 0.0035, 8, 3)
        boot.paint(faces_of(buckle), BRASS)
    return [boot]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("AnkleSnatcher", BONES)
    parts = head_parts() + body_parts() + limb_parts() + hook_parts() + boot_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "AnkleSnatcherMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------

# The pole angle that bends the left elbow toward its pole bone.
POLE_ANGLE = -90


def add_controls(rig):
    """IK for the left arm: the left hand stays on the pipe."""
    ik = rig.pose.bones["forearm.L"].constraints.new("IK")
    ik.name = "IK"
    ik.target = rig
    ik.subtarget = "grip.L"
    ik.pole_target = rig
    ik.pole_subtarget = "pole.L"
    ik.pole_angle = math.radians(POLE_ANGLE)
    ik.chain_count = 2
    return {}


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

    def stand(bounce=0.0, sway=0.0):
        """
        The idle stance: low and ready, the hook in front at ankle height.
        `bounce` lifts her on her toes, and `sway` swings the boot.
        """
        return {
            "hips@loc": at("hips", (0, 0.01, -0.035 + bounce * 0.012)),
            "hips": t("hips", (Z, -10)),
            "spine": t("spine", (X, 14 - bounce * 2)),
            "chest": t("chest", (X, 4), (Z, -6)),
            "neck": t("neck", (X, -10)),
            "head": t("head", (X, -8 + bounce * 3), (Z, 6), (Y, sway * 4)),
            "upperarm.R": t("upperarm.R", (X, -10 - bounce * 3)),
            "forearm.R": t("forearm.R", (X, 4)),
            "thigh.L": t("thigh.L", (X, -34), (Y, -6)),
            "shin.L": t("shin.L", (X, 40)),
            "foot.L": t("foot.L", (X, -6 - bounce * 10)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 6)),
            "shin.R": t("shin.R", (X, 38)),
            "foot.R": t("foot.R", (X, -40 - bounce * 10)),
            "boot": t("boot", (X, sway * 14)),
            "forearm.L/IK": 1.0,
        }

    def slump(breath=0.0):
        """Low HP: down on one knee, leaning on the pipe, with the hook on the ground."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.11 - breath * 0.004)),
            spine=t("spine", (X, 24 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2), (Z, -6)),
            head=t("head", (Z, -4), (X, 16 + breath * 4), (Y, -10)),
            upperarm__R=t("upperarm.R", (X, -40)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 8)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 10), (Y, 6)),
            shin__R=t("shin.R", (X, 110)),
            foot__R=t("foot.R", (X, -20)),
            boot=t("boot", (X, -6 + breath * 4)),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.035)),
            spine=t("spine", (X, -4 * amount)),
            chest=t("chest", (X, -14 * amount), (Z, 6 * amount)),
            head=t("head", (Z, 8), (X, -20 * amount)),
            upperarm__R=t("upperarm.R", (X, 6 * amount), (Y, -10 * amount)),
            boot=t("boot", (X, -30 * amount)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.02)),
            spine=t("spine", (X, 22)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 44)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 34)),
            foot__R=t("foot.R", (X, -20)),
            upperarm__R=t("upperarm.R", (X, 14), (Y, -20)),
            hand__R=t("hand.R", (X, -50)),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back. The left hand lets go, and the pipe lies along her side."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.07)),
            hips_at_loc=at("hips", (0, 0, 0)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20), (Z, 30)),
            upperarm__R=t("upperarm.R", (Y, -70), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            hand__R=t("hand.R", (X, 45), (Y, 90)),
            upperarm__L=t("upperarm.L", (Y, 70), (X, -10)),
            thigh__L=t("thigh.L", (X, -20), (Y, -10)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -30), (Y, 10)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
            boot=t("boot", (X, 40)),
            **{"forearm.L/IK": 0.0},
        )

    def crouch(base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.1)),
            spine=t("spine", (X, 28)),
            head=t("head", (X, 16)),
            upperarm__R=t("upperarm.R", (X, -30)),
            hand__R=t("hand.R", (X, -50)),
            thigh__L=t("thigh.L", (X, -64), (Y, -8)),
            shin__L=t("shin.L", (X, 104)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -54), (Y, 8)),
            shin__R=t("shin.R", (X, 104)),
            foot__R=t("foot.R", (X, -50)),
        )

    def proud(base):
        """Up again, the hook raised high with its boot: the end of a summon and a Rebirth."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -80), (Y, -20)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, 30)),
            thigh__L=t("thigh.L", (X, -10)),
            shin__L=t("shin.L", (X, 10)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 4)),
            shin__R=t("shin.R", (X, 8)),
            foot__R=t("foot.R", (X, -10)),
            boot=t("boot", (X, 30)),
        )

    def stride(front, lift=0.0):
        """
        A run, low and leaned forward. `front` is 1 for the left foot, -1 for
        the right; `lift` is 1 as the back foot passes.
        """
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, -0.01, -0.04 + lift * 0.02)),
            hips=t("hips", (X, 16), (Z, -8 + 6 * front)),
            spine=t("spine", (X, 22)),
            chest=t("chest", (X, 10), (Z, -6 - 6 * front)),
            neck=t("neck", (X, -20)),
            head=t("head", (X, -28), (Z, 6)),
            upperarm__R=t("upperarm.R", (X, -14 + 6 * front)),
            hand__R=t("hand.R", (X, -26)),
            boot=t("boot", (X, -20 - 10 * lift)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -70 + lift * 30)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 30 + lift * 50)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -4)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14 - lift * 40)),
                f"shin__{back}": t(f"shin.{back}", (X, 40 + lift * 60)),
                f"foot__{back}": t(f"foot.{back}", (X, 20)),
            },
        )

    # The attack: she rears back, then lunges low and sweeps the hook forward
    # at ankle height. The hit lands at 50% of the clip (frame 15), and then
    # she yanks the hook back.
    def rear(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.03)),
            hips=t("hips", (Z, -18)),
            spine=t("spine", (X, 2)),
            chest=t("chest", (X, -8), (Z, -12)),
            head=t("head", (X, -10), (Z, 10)),
            upperarm__R=t("upperarm.R", (X, 16), (Y, -10)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 20), (Y, 6)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, -40)),
            boot=t("boot", (X, 30)),
        )

    def lunge(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.07, -0.06)),
            hips=t("hips", (X, 18), (Z, 0)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 10), (Z, 0)),
            neck=t("neck", (X, -24)),
            head=t("head", (X, -30), (Z, 4)),
            upperarm__R=t("upperarm.R", (X, -24), (Y, -6)),
            forearm__R=t("forearm.R", (X, -6)),
            hand__R=t("hand.R", (X, -15)),
            thigh__L=t("thigh.L", (X, -100), (Y, -6)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 16), (Y, 6)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, 10)),
            boot=t("boot", (X, -40)),
        )

    def yank(base):
        return pose(
            lunge(base),
            hips_at_loc=at("hips", (0, -0.02, -0.04)),
            spine=t("spine", (X, 10)),
            chest=t("chest", (X, -12), (Z, -16)),
            head=t("head", (X, -12), (Z, 14)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, -14)),
            forearm__R=t("forearm.R", (X, -40)),
            hand__R=t("hand.R", (X, -30)),
            boot=t("boot", (X, 50)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, bounce, sway in ((0, 0, 0), (6, 1, 0.6), (12, 0, 1), (18, 1, 0.6), (24, 0, 0), (30, 1, -0.6), (36, 0, -1), (42, 1, -0.6), (48, 0, 0)):
        idle.key(frame, stand(bounce, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 0.5), (24, 1), (36, 0.5), (48, 0)):
        low.key(frame, slump(breath))
    clips.append(low)

    # Swift: two fast strides in each cycle.
    walk = Clip("walk", 24, loop=True)
    for start in (0, 12):
        walk.key(start, stride(1)).key(start + 3, stride(1, 1)).key(start + 6, stride(-1)).key(start + 9, stride(-1, 1))
    walk.key(24, stride(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(8, rear(stand())).key(13, lunge(stand())).key(16, lunge(stand()))
    attack.key(21, yank(stand())).key(26, pose(stand(), boot=t("boot", (X, -20)))).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(24, fallen(stand())).key(28, fallen(stand(), 6)).key(36, fallen(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(20, fallen(stand())).key(22, fallen(stand(), 3))
    rebirth.key(32, crouch(stand())).key(41, proud(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0.01, -0.08))))
    summon.key(17, proud(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "ankle-snatcher.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
