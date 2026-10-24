"""
Lantern Widow (`undead.lanternWidow`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: an elegant skeletal widow with
glowing pale eyes, a tall lace veil on a comb with dusty blue roses, a faded
slate mourning dress with a torn lace overskirt and a gold skull brooch, an
ornate lantern with a pale teal glow, and an empty tea cup on a saucer. Run it
in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/lantern-widow.glb`; then
`bun unit-model:pack lantern-widow` packs it for the game.

The Battle camera sees the right side of a player Unit, so she raises the
lantern in her right hand and offers the cup with her left. The lantern and
the cup keep level with the `Hang` and `Level` constraints. Her cast (Summon)
opens the lantern door: a Restless Wisp comes out, and she offers it tea.
"""

import math
import os
import sys

import bpy
from mathutils import Quaternion, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
DRESS = hex_color("#3d4548")
DRESS_LIGHT = hex_color("#566166")
LACE = hex_color("#ddd3ba")
LACE_DARK = hex_color("#b5aa8e")
TEAL = hex_color("#4d6e6b")
ROSE = hex_color("#8fa8b8")
ROSE_DARK = hex_color("#61798a")
GOLD = hex_color("#c9a24a")
IRON = hex_color("#4a3e34")
BRASS = hex_color("#9c7a3c")
GLASS = hex_color("#a8f0ff")
CUP = hex_color("#f1ece0")
CUP_RIM = hex_color("#6f9fc0")
WISP = hex_color("#c4f6ff")
WISP_DARK = hex_color("#7fd4e6")
BOOT = hex_color("#2e3133")

# --- Proportions ---------------------------------------------------------------

HIP_Z = 0.47
WAIST_Z = 0.55
CHEST_Z = 0.64
SHOULDER_Z = 0.725
NECK_Z = 0.75
HEAD_C = Vector((0, -0.004, 0.875))
KNEE_Z = 0.27
ANKLE_Z = 0.05
LEG_X = 0.052

# The right arm hangs in an A-pose with the lantern; the clips raise it. The
# left hand holds the cup in front.
ARM_DIR = Vector((-math.sin(math.radians(16)), 0, -math.cos(math.radians(16))))
SR = Vector((-0.1, 0, SHOULDER_Z))
ER = SR + ARM_DIR * 0.15
WR = ER + ARM_DIR * 0.14
TR = WR + ARM_DIR * 0.05
SL = Vector((0.1, 0, SHOULDER_Z))
EL = Vector((0.145, 0.01, 0.585))
WL = Vector((0.11, -0.11, 0.565))
DL = (WL - EL).normalized()
TL = WL + DL * 0.05

# The lantern hangs from the right hand by its ring.
RING = WR + ARM_DIR * 0.035
LANTERN_TOP = RING - Z * 0.03
LANTERN_C = LANTERN_TOP - Z * 0.075
LANTERN_R = 0.04
# The door is the front face of the glass, hinged at its camera-side edge.
HINGE = LANTERN_C + Vector((math.cos(math.radians(240)), math.sin(math.radians(240)), 0)) * LANTERN_R

# The cup stands on its saucer on the left palm.
SAUCER = WL + DL * 0.03 + Vector((0, 0, 0.02))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0, HIP_Z), (0, 0, WAIST_Z), "root"),
    ("spine", (0, 0, WAIST_Z), (0, 0, CHEST_Z), "hips"),
    ("chest", (0, 0, CHEST_Z), (0, 0, NECK_Z), "spine"),
    ("neck", (0, 0, NECK_Z), (0, 0, 0.79), "chest"),
    ("head", (0, 0, 0.79), (0, 0, 0.97), "neck"),
    ("jaw", (0, -0.01, 0.84), (0, -0.065, 0.82), "head"),
    ("veil", (0, 0.08, 0.84), (0, 0.16, 0.2), "chest"),
    ("dress.B", (0, 0.07, 0.52), (0, 0.13, 0.12), "hips"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0, HIP_Z), (LEG_X * sign, 0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0, KNEE_Z), (LEG_X * sign, 0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0, ANKLE_Z), (LEG_X * sign, -0.08, 0.02), f"shin.{side}"),
    ]
BONES += [
    ("lantern", tuple(RING), tuple(RING + Z * 0.08), "hand.R"),
    ("door", tuple(HINGE), tuple(HINGE + Z * 0.06), "lantern"),
    ("wisp", tuple(LANTERN_C), tuple(LANTERN_C + Z * 0.06), "lantern"),
    ("cup", tuple(SAUCER), tuple(SAUCER + Z * 0.06), "hand.L"),
]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z:
        return blend("hips", "spine", co.z, 0.5, 0.58)
    return blend("spine", "chest", co.z, 0.6, 0.66)


def skirt_weights(co):
    """The dress follows the hips at the top, and the legs and the back of the skirt lower."""
    t = clamp01((0.53 - co.z) / 0.45)
    back = clamp01((co.y - 0.01) / 0.1)
    side = co.x / 0.12
    return {
        "hips": 1 - t,
        "dress.B": back * t,
        "thigh.L": (1 - back) * t * clamp01(side) * 0.9,
        "thigh.R": (1 - back) * t * clamp01(-side) * 0.9,
    }


def veil_weights(co):
    """The veil follows the head at the top, and hangs from the back lower."""
    if co.z > 0.86:
        return {"head": 1.0}
    return blend("veil", "head", co.z, 0.74, 0.86)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.058, 0.064, 0.07), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.036 * sign, -0.046, -0.022)), (0.018, 0.018, 0.014), 6, 4)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.058, 0.02)), (0.088, 0.012, 0.012))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    sockets = Part("sockets", SOCKET, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(sockets.bm, HEAD_C + Vector((0.024 * sign, -0.055, 0.004)), (0.018, 0.012, 0.017), 8, 5)
    kit.cone(sockets.bm, HEAD_C + Vector((0, -0.062, -0.02)), HEAD_C + Vector((0, -0.064, -0.005)), 0.009, 0.002, 4)
    parts.append(sockets)

    eyes = Part("eyes", GLOW, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.024 * sign, -0.064, 0.004)), (0.008, 0.005, 0.008), 6, 4)
    parts.append(eyes)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.036, 0.82), (0.044, 0.036, 0.022), 10, 6)
    teeth = kit.box(jaw.bm, (0, -0.064, 0.834), (0.052, 0.008, 0.012))
    jaw.paint(faces_of(teeth), BONE_DARK)
    parts.append(jaw)

    # A band of dusty blue roses round the crown, and the comb that holds the veil up.
    roses = Part("roses", ROSE, "head", shade=0.08)
    for index in range(7):
        a = math.radians(-100 + 200 * index / 6)
        at_ = HEAD_C + Vector((0.058 * math.sin(a), 0.064 * -math.cos(a) * -1 + 0.01, 0.045 + 0.012 * math.cos(a)))
        rose = kit.sphere(roses.bm, at_, (0.017, 0.017, 0.015), 6, 4)
        roses.paint(faces_of(rose), ROSE_DARK if index % 2 else ROSE)
    comb = kit.cone(roses.bm, HEAD_C + Vector((0, 0.045, 0.05)), HEAD_C + Vector((0, 0.04, 0.13)), 0.045, 0.022, 8, squash=0.4)
    roses.paint(faces_of(comb), LACE_DARK)
    parts.append(roses)

    neck = Part("neck", BONE, "neck")
    kit.cone(neck.bm, (0, 0, 0.74), (0, 0, 0.82), 0.016, 0.016, 6)
    parts.append(neck)
    return parts


def veil_parts():
    def veil_color(row, column):
        if row >= 5:
            return LACE_DARK if column % 2 else LACE
        return LACE_DARK if column % 4 == 1 else LACE

    # The tall lace veil: up over the comb, then down the back to the ground.
    veil = Part("veil", LACE, veil_weights, shade=0.12)
    kit.ragged_cone(veil, HEAD_C.z + 0.15, 0.06, 0.045, 0.21, 14, 7, 0.78, 0.12, veil_color, LACE_DARK, gap=math.radians(105), y_push=0.12)
    kit.bmesh.ops.translate(veil.bm, vec=Vector((0, 0.028, 0)), verts=list(veil.bm.verts))
    return [veil]


def body_parts():
    parts = []
    # The ribs show above the neckline.
    ribs = Part("ribs", BONE, "chest", shade=0.1)
    verts = kit.sphere(ribs.bm, (0, -0.012, 0.69), (0.06, 0.05, 0.055), 10, 7)
    for face in faces_of(verts):
        if face.normal.y < -0.2 and int(face.calc_center_median().z * 120) % 2:
            ribs.paint([face], SOCKET)
    for sign in (1, -1):
        clavicle = kit.cone(ribs.bm, (0.01 * sign, -0.04, 0.73), (0.09 * sign, -0.01, 0.725), 0.008, 0.006, 5)
        ribs.paint(faces_of(clavicle), BONE)
    parts.append(ribs)

    bodice = Part("bodice", DRESS, torso_weights)
    kit.cone(bodice.bm, (0, 0, 0.5), (0, 0, 0.67), 0.064, 0.074, 12, squash=0.74)
    # A lace edge at the neckline.
    edge = kit.torus(bodice.bm, (0, -0.004, 0.668), (0, 0, 1), 0.07, 0.008, 14, 4)
    bodice.paint(faces_of(edge), LACE)
    parts.append(bodice)

    belt = Part("sash", TEAL, "hips", shade=0.05)
    kit.cone(belt.bm, (0, 0, 0.515), (0, 0, 0.55), 0.069, 0.067, 12, squash=0.78)
    # The gold skull brooch at the front, with a short chain of pearls.
    brooch = kit.cone(belt.bm, (0, -0.052, 0.532), (0, -0.064, 0.532), 0.026, 0.024, 10)
    belt.paint(faces_of(brooch), GOLD)
    cameo = kit.sphere(belt.bm, (0, -0.066, 0.534), (0.012, 0.006, 0.014), 6, 4)
    belt.paint(faces_of(cameo), BONE)
    for index in range(4):
        pearl = kit.sphere(belt.bm, (0.02 + 0.014 * index, -0.06 + 0.004 * index, 0.51 - 0.014 * index), (0.006, 0.006, 0.006), 4, 3)
        belt.paint(faces_of(pearl), LACE)
    parts.append(belt)

    def dress_color(row, column):
        return DRESS_LIGHT if column % 4 == 0 else DRESS

    dress = Part("dress", DRESS, skirt_weights)
    kit.ragged_cone(dress, 0.54, 0.015, 0.068, 0.17, 16, 6, 0.85, 0.02, dress_color, DRESS)
    parts.append(dress)

    def lace_color(row, column):
        return LACE_DARK if column % 3 == 1 or row >= 4 else LACE

    # The torn lace overskirt, open at the front.
    overskirt = Part("overskirt", LACE, skirt_weights, shade=0.12)
    kit.ragged_cone(overskirt, 0.53, 0.14, 0.074, 0.18, 16, 5, 0.85, 0.16, lace_color, LACE_DARK, gap=math.radians(40), y_push=0.04)
    parts.append(overskirt)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        d = (w - e).normalized()
        puff = Part(f"puff.{side}", DRESS, f"upperarm.{side}", shade=0.1)
        verts = kit.sphere(puff.bm, s + Vector((0.006 * sign, 0, 0.004)), (0.036, 0.036, 0.032), 10, 7)
        puff.paint({f for v in verts if v.co.z < s.z - 0.012 for f in v.link_faces}, LACE)
        parts.append(puff)

        upper = Part(f"sleeve.{side}", DRESS, f"upperarm.{side}")
        kit.cone(upper.bm, s, e, 0.024, 0.02, 8)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", DRESS, f"forearm.{side}")
        kit.cone(forearm.bm, e, w - d * 0.02, 0.02, 0.017, 8)
        parts.append(forearm)

        # A torn lace cuff at the wrist.
        cuff = Part(f"cuff.{side}", LACE, f"forearm.{side}", shade=0.06)
        kit.cone(cuff.bm, w - d * 0.045, w + d * 0.005, 0.02, 0.036, 8, caps=False)
        parts.append(cuff)

        # A bony hand: a palm and three long finger bones.
        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.05)
        kit.sphere(hand.bm, w + d * 0.018, (0.015, 0.012, 0.018), 6, 5)
        for index in (-1, 0, 1):
            offset = Vector((0.006 * index, -0.004, 0))
            kit.cone(hand.bm, w + d * 0.024 + offset, w + d * 0.05 + offset, 0.004, 0.0025, 4)
        parts.append(hand)

        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        boot = Part(f"boot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.cone(boot.bm, ankle + Vector((0, 0, 0.08)), ankle - Vector((0, 0, 0.02)), 0.03, 0.032, 8)
        kit.cone(boot.bm, (LEG_X * sign, 0.01, 0.022), (LEG_X * sign, -0.09, 0.012), 0.028, 0.006, 8, squash=0.7)
        parts.append(boot)

        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        leg = Part(f"leg.{side}", BONE, f"thigh.{side}")
        kit.cone(leg.bm, hip, knee, 0.018, 0.016, 6)
        parts.append(leg)
        shin = Part(f"shin.{side}", BONE, f"shin.{side}")
        kit.cone(shin.bm, knee, ankle + Vector((0, 0, 0.05)), 0.016, 0.014, 6)
        parts.append(shin)
    return parts


def lantern_parts():
    lantern = Part("lantern", IRON, "lantern", shade=0.05)
    ring = kit.torus(lantern.bm, RING, Y, 0.016, 0.004, 10, 3)
    lantern.paint(faces_of(ring), BRASS)
    # The domed cap with a finial, the glowing glass and the base.
    top = LANTERN_C + Z * 0.06
    bottom = LANTERN_C - Z * 0.06
    kit.cone(lantern.bm, top, LANTERN_TOP, LANTERN_R + 0.012, 0.008, 6)
    finial = kit.cone(lantern.bm, LANTERN_TOP - Z * 0.004, RING - Z * 0.012, 0.008, 0.003, 4)
    lantern.paint(faces_of(finial), BRASS)
    for z, r in ((top, LANTERN_R + 0.014), (bottom, LANTERN_R + 0.014)):
        band = kit.cone(lantern.bm, z - Z * 0.006, z + Z * 0.006, r, r, 6)
        lantern.paint(faces_of(band), BRASS)
    glass = kit.cone(lantern.bm, bottom, top, LANTERN_R, LANTERN_R, 6)
    lantern.paint(faces_of(glass), GLASS)
    # The frame bars at the corners of the glass.
    for index in range(6):
        a = math.radians(60 * index)
        corner = Vector((math.cos(a), math.sin(a), 0)) * (LANTERN_R + 0.002)
        kit.cone(lantern.bm, bottom + corner, top + corner, 0.004, 0.004, 4)
    base = kit.cone(lantern.bm, bottom, bottom - Z * 0.035, LANTERN_R + 0.01, 0.006, 6)
    lantern.paint(faces_of(base), IRON)
    drop = kit.cone(lantern.bm, bottom - Z * 0.03, bottom - Z * 0.065, 0.008, 0.001, 4)
    lantern.paint(faces_of(drop), BRASS)

    # The door: the front face of the glass in its own frame.
    door = Part("door", GLASS, "door", shade=0.03)
    a0, a1 = math.radians(240), math.radians(300)
    c0 = LANTERN_C + Vector((math.cos(a0), math.sin(a0), 0)) * (LANTERN_R + 0.004)
    c1 = LANTERN_C + Vector((math.cos(a1), math.sin(a1), 0)) * (LANTERN_R + 0.004)
    mid = (c0 + c1) / 2
    out = Vector((0, -1, 0))
    kit.slab(door.bm, mid, (c1 - c0) / 2, Z * 0.056, out * 0.002)
    for edge_at in (c0, c1):
        bar = kit.cone(door.bm, edge_at - Z * 0.058, edge_at + Z * 0.058, 0.004, 0.004, 4)
        door.paint(faces_of(bar), BRASS)
    cross = kit.slab(door.bm, mid + out * 0.002, (c1 - c0) / 2, Z * 0.004, out * 0.002)
    door.paint(faces_of(cross), BRASS)

    # The Restless Wisp inside: a small round ghost with a curled tail.
    wisp = Part("wisp", WISP, "wisp", shade=0.15)
    kit.sphere(wisp.bm, LANTERN_C + Z * 0.012, (0.026, 0.024, 0.026), 8, 6)
    tail = kit.tube(wisp.bm, [LANTERN_C - Z * 0.005, LANTERN_C + Vector((0.006, 0.01, -0.03)), LANTERN_C + Vector((-0.004, 0.026, -0.045)), LANTERN_C + Vector((-0.012, 0.04, -0.04))], [0.022, 0.014, 0.007, 0.002], 6)
    wisp.paint(faces_of(tail), WISP_DARK)
    for sign in (1, -1):
        eye = kit.sphere(wisp.bm, LANTERN_C + Vector((0.01 * sign, -0.022, 0.016)), (0.005, 0.004, 0.007), 4, 3)
        wisp.paint(faces_of(eye), SOCKET)
    return [lantern, door, wisp]


def cup_parts():
    """The empty tea cup that she offers the Wisp: the humor note of the card."""
    cup = Part("cup", CUP, "cup", shade=0.06)
    kit.cone(cup.bm, SAUCER, SAUCER + Z * 0.005, 0.03, 0.032, 12)
    rim = kit.torus(cup.bm, SAUCER + Z * 0.005, Z, 0.031, 0.002, 12, 3)
    cup.paint(faces_of(rim), CUP_RIM)
    kit.cone(cup.bm, SAUCER + Z * 0.005, SAUCER + Z * 0.036, 0.014, 0.022, 10, caps=False)
    inside = kit.cone(cup.bm, SAUCER + Z * 0.007, SAUCER + Z * 0.008, 0.014, 0.014, 10)
    cup.paint(faces_of(inside), CUP_RIM)
    lip = kit.torus(cup.bm, SAUCER + Z * 0.036, Z, 0.022, 0.0025, 12, 3)
    cup.paint(faces_of(lip), CUP_RIM)
    handle = kit.torus(cup.bm, SAUCER + Vector((0.026, 0, 0.022)), Y, 0.008, 0.0025, 8, 3)
    cup.paint(faces_of(handle), CUP)
    return [cup]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("LanternWidow", BONES)
    parts = head_parts() + veil_parts() + body_parts() + limb_parts() + lantern_parts() + cup_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "LanternWidowMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Controls --------------------------------------------------------------------


def add_controls(rig):
    """The lantern hangs and the cup stays level: each copies the rotation of an empty at its rest turn."""
    empties = {}
    for bone, name, constraint in (("lantern", "lantern_hang", "Hang"), ("cup", "cup_level", "Level")):
        empty = kit.add_empty(name)
        empty.rotation_quaternion = rig.data.bones[bone].matrix_local.to_quaternion()
        copy = rig.pose.bones[bone].constraints.new("COPY_ROTATION")
        copy.name = constraint
        copy.target = empty
        empties[name] = empty
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

    lantern_rest = rig.data.bones["lantern"].matrix_local.to_quaternion()

    def hang(swing=0.0, side=0.0):
        """The turn of the lantern: `swing` moves its bottom forward, `side` to her left, in degrees."""
        return Quaternion(Y, math.radians(-side)) @ Quaternion(X, math.radians(-swing)) @ lantern_rest

    def stand(breath=0.0, sway=0.0):
        """
        The idle: turned a little to her right, the lantern raised high and
        swaying, the cup held out. The dead do not breathe, so she sways.
        """
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.003)),
            "hips": t("hips", (Z, -12)),
            "spine": t("spine", (Z, -2), (X, 1), (Y, sway * 1.5)),
            "chest": t("chest", (X, -3), (Y, -2)),
            "neck": t("neck", (Z, 6), (X, -2)),
            "head": t("head", (Z, 4 + sway * 4), (X, -6 + breath * 2), (Y, -10)),
            "jaw": t("jaw", (X, -4 - breath * 6)),
            "upperarm.R": t("upperarm.R", (X, -116 - breath * 3), (Y, -6)),
            "forearm.R": t("forearm.R", (X, -14)),
            "hand.R": t("hand.R", (X, -10)),
            "upperarm.L": t("upperarm.L", (X, -6 - breath * 2)),
            "thigh.L": t("thigh.L", (X, -8), (Y, -2)),
            "shin.L": t("shin.L", (X, 8)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 2)),
            "shin.R": t("shin.R", (X, 4)),
            "foot.R": t("foot.R", (X, -10)),
            "dress.B": t("dress.B", (X, -2 - breath * 2), (Y, sway * 3)),
            "veil": t("veil", (X, 3 - breath * 2), (Y, sway * 4)),
            "lantern/Hang": 1.0,
            "lantern_hang@rot": hang(sway * 6),
            "cup/Level": 1.0,
            "wisp@scale": 0.0,
        }

    def wilt(breath=0.0):
        """Low HP: bent over, the lantern low and dim at her side, the cup held close."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.01, -0.03)),
            spine=t("spine", (X, 16 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2), (Z, -6)),
            neck=t("neck", (X, 2)),
            head=t("head", (X, 4 + breath * 4), (Y, 14)),
            jaw=t("jaw", (X, -16 - breath * 6)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, -8)),
            forearm__R=t("forearm.R", (X, -20)),
            hand__R=t("hand.R", (X, 0)),
            upperarm__L=t("upperarm.L", (X, 6), (Y, 10)),
            forearm__L=t("forearm.L", (X, 20)),
            thigh__L=t("thigh.L", (X, -16), (Y, -3)),
            shin__L=t("shin.L", (X, 28)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -6), (Y, 3)),
            shin__R=t("shin.R", (X, 20)),
            foot__R=t("foot.R", (X, -14)),
            dress__B=t("dress.B", (X, 6)),
            veil=t("veil", (X, -20 - breath * 3)),
            lantern_hang_at_rot=hang(4 * breath),
        )

    def recoil(base, amount=1.0):
        """The hit pushes the upper body back; the lantern swings."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount), (Z, 8 * amount)),
            head=t("head", (X, -18 * amount), (Z, 8 * amount)),
            jaw=t("jaw", (X, -24 * amount)),
            upperarm__L=t("upperarm.L", (X, 12 * amount), (Y, 10 * amount)),
            veil=t("veil", (X, 18 * amount)),
            dress__B=t("dress.B", (X, 10 * amount)),
            lantern_hang_at_rot=hang(-26 * amount),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.01, -0.04)),
            spine=t("spine", (X, 18)),
            head=t("head", (X, 22)),
            jaw=t("jaw", (X, -24)),
            thigh__L=t("thigh.L", (X, -18)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -12)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, -20)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 16)),
            veil=t("veil", (X, -14)),
            lantern_hang_at_rot=hang(20),
        )

    def fallen(base, bounce=0.0):
        """Flat on the back and straight; the lantern and the cup lie beside her."""
        return pose(
            base,
            root=t("root", (X, -86 + bounce)),
            root_at_loc=at("root", (0, 0, 0.045)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -8), (Z, -20)),
            jaw=t("jaw", (X, -22)),
            upperarm__R=t("upperarm.R", (Y, -30), (X, 0)),
            forearm__R=t("forearm.R", (X, 0)),
            hand__R=t("hand.R", (X, 0)),
            upperarm__L=t("upperarm.L", (Y, 30), (X, 10)),
            forearm__L=t("forearm.L", (X, 30)),
            thigh__L=t("thigh.L", (X, 0)),
            shin__L=t("shin.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 0)),
            shin__R=t("shin.R", (X, 0)),
            foot__R=t("foot.R", (X, 0)),
            dress__B=t("dress.B", (X, -24)),
            veil=t("veil", (X, -12)),
            lantern_slash_Hang=0.0,
            lantern=t("lantern", (Y, -80)),
            cup_slash_Level=0.0,
        )

    def crouch(base):
        """Low on both knees, the head bowed and the lantern on the ground, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.17)),
            thigh__L=t("thigh.L", (X, -60), (Y, -4)),
            shin__L=t("shin.L", (X, 110)),
            foot__L=t("foot.L", (X, -50)),
            thigh__R=t("thigh.R", (X, -60), (Y, 4)),
            shin__R=t("shin.R", (X, 110)),
            foot__R=t("foot.R", (X, -50)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 30)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            veil=t("veil", (X, -28)),
            dress__B=t("dress.B", (X, 40)),
        )

    def raise_(base):
        """Up again with the lantern high over her head: the end of a summon."""
        return pose(
            base,
            chest=t("chest", (X, -8)),
            head=t("head", (Z, 6), (X, -14), (Y, -6)),
            jaw=t("jaw", (X, -20)),
            upperarm__R=t("upperarm.R", (X, -165), (Y, -6)),
            forearm__R=t("forearm.R", (X, -6)),
            veil=t("veil", (X, 8)),
            lantern_hang_at_rot=hang(-14),
        )

    def offer(base, open_=1.0, out=1.0, grow=1.0):
        """
        The cast (Summon): the lantern door opens and the Wisp floats out and
        up; she lowers the lantern a little and holds the cup out to it.
        """
        return pose(
            base,
            head=t("head", (Z, 2), (X, -12), (Y, -14)),
            jaw=t("jaw", (X, -14)),
            upperarm__R=t("upperarm.R", (X, -105), (Y, -14)),
            forearm__R=t("forearm.R", (X, -30)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 6)),
            forearm__L=t("forearm.L", (X, -10)),
            door=t("door", (Z, -110 * open_)),
            wisp_at_loc=at("wisp", (0.02 * out, -0.13 * out, 0.06 * out)),
            wisp_at_scale=grow,
            lantern_hang_at_rot=hang(-6),
        )

    def step(front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.01)),
            spine=t("spine", (X, 3)),
            chest=t("chest", (Z, -4 * front)),
            lantern_hang_at_rot=hang(8 * front),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -20)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14)),
                f"shin__{back}": t(f"shin.{back}", (X, 12)),
                f"foot__{back}": t(f"foot.{back}", (X, 12)),
                "dress__B": t("dress.B", (X, 8), (Y, 3 * front)),
                "veil": t("veil", (X, 2), (Y, 3 * front)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, 3)),
            lantern_hang_at_rot=hang(0),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 34)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                "dress__B": t("dress.B", (X, 4)),
                "veil": t("veil", (X, 0)),
            },
        )

    # The attack: she draws the lantern back, then swings it forward into the
    # enemy in a burst of cold. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the lantern lands at frame 15 of 30.
    def draw(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.01)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (Z, -8), (X, -6)),
            chest=t("chest", (X, -8)),
            head=t("head", (Z, 16), (X, -6)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, -30)),
            forearm__R=t("forearm.R", (X, -30)),
            thigh__L=t("thigh.L", (X, -16), (Y, -3)),
            shin__L=t("shin.L", (X, 16)),
            thigh__R=t("thigh.R", (X, 12), (Y, 3)),
            shin__R=t("shin.R", (X, 14)),
            veil=t("veil", (X, 12)),
            lantern_hang_at_rot=hang(-40),
        )

    def swing(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.04, -0.03)),
            hips=t("hips", (Z, -4)),
            spine=t("spine", (Z, 6), (X, 18)),
            chest=t("chest", (Z, 4), (X, 8)),
            head=t("head", (Z, 4), (X, -14)),
            jaw=t("jaw", (X, -26)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -36), (Y, -3)),
            shin__L=t("shin.L", (X, 36)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 20), (Y, 3)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -24)),
            veil=t("veil", (X, -16)),
            dress__B=t("dress.B", (X, 14)),
            lantern_slash_Hang=0.3,
            lantern_hang_at_rot=hang(70),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway in ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low.key(frame, wilt(breath))
    clips.append(low)

    walk = Clip("walk", 24, loop=True)
    walk.key(0, step(1)).key(6, passing("R")).key(12, step(-1)).key(18, passing("L")).key(24, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, draw(stand())).key(15, swing(stand())).key(19, swing(stand()))
    attack.key(26, stand()).key(30, stand())
    clips.append(attack)

    # The cast keeps time with the Keyword Plate: the door opens, the Wisp
    # floats out and grows, she offers the cup, and the Wisp is gone.
    cast = Clip("cast", 24)
    cast.key(0, stand()).key(4, offer(stand(), 1.0, 0.0, 0.3)).key(10, offer(stand(), 1.0, 0.7, 1.3))
    cast.key(16, offer(stand(), 1.0, 1.0, 1.5)).key(19, offer(stand(), 0.6, 1.2, 0.0)).key(24, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(12, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(10, pose(crouch(stand()), hips_at_loc=at("hips", (0, 0, -0.1))))
    summon.key(17, raise_(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "lantern-widow.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
