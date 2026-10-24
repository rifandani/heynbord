"""
Coffin-Lid Skater (`undead.coffinLidSkater`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a gleeful skeleton with a big
grin, in a ragged teal hood and a long teal scarf that streams far behind
him, and a ragged brown tunic over his ribs. His feet are wrapped in rags.
He crouches low on a long wooden coffin lid and surfs it through the mud.
His right hand holds a small spade as a pole, and his left arm reaches back
for balance. Mud sprays from the nose of the lid. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/coffin-lid-skater.glb`;
then `bun unit-model:pack coffin-lid-skater` packs it for the game.

The lid lies along the Lane, nose to the front (-Y), so the camera sees its
long side. The `lid` bone carries the lid. The skater is not a child of the
lid, so he can tumble off it: the clips move his `hips` with the lid, and
his feet stay on the lid with IK to the `ik_foot` bones, which are children
of the lid. The spade is in the right hand, on the camera side, with its
blade turned to the camera. The `mud` bone scales the spray at the nose.
His walk is a bumpy glide: he pushes the spade back through the mud as a
pole. His attack is the Charge: the lid surges forward nose first, and he
swipes the spade into the target, his scarf whipping. In the death the nose
of the lid digs in, the lid flips over onto its back, and he tumbles off
onto his back. He has no Keyword that he uses by his own action (Charge is
passive), so he has no cast clip.
"""

import math
import os
import sys

from mathutils import Quaternion, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, panel, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e8dcc0")
BONE_DARK = hex_color("#b8a682")
SOCKET = hex_color("#1e1a18")
GLINT = hex_color("#f4e6b8")
TEETH = hex_color("#f4ecd6")
MOUTH = hex_color("#2c2420")
CAVITY = hex_color("#2c2622")
HOOD = hex_color("#6f9a90")
HOOD_DARK = hex_color("#4a6a63")
HOOD_LIGHT = hex_color("#8cb4a8")
TUNIC = hex_color("#7a5a3c")
TUNIC_DARK = hex_color("#54402c")
WRAP = hex_color("#8a7258")
WRAP_DARK = hex_color("#62503c")
WOOD = hex_color("#9a6238")
WOOD_LIGHT = hex_color("#b47a4a")
WOOD_DARK = hex_color("#6a4226")
IRON = hex_color("#4a4440")
NAIL = hex_color("#8a8278")
HANDLE = hex_color("#8a5a34")
SPADE = hex_color("#6e6862")
SPADE_EDGE = hex_color("#a09a90")
MUD = hex_color("#6a4628")
MUD_DARK = hex_color("#4a2e1a")
MUD_LIGHT = hex_color("#8e6640")

# --- Proportions: the lid --------------------------------------------------------

# The lid lies along the Lane. Its nose (the head end of the coffin) is to
# the front (-Y) and curls up a little, as a sled does.
LID_BACK = 0.3
LID_FRONT = -0.36
LID_TOP = 0.055
LID_THICK = 0.04
LID_C = Vector((0, 0, LID_TOP - LID_THICK / 2))
# The outline of a coffin: (v, half width), v from the back (0) to the nose (1).
LID_OUTLINE = ((0.0, 0.075), (0.68, 0.122), (1.0, 0.082))
# The spray of mud at the nose.
MUD_C = Vector((0, LID_FRONT + 0.02, 0.0))


def lid_half(v):
    (v0, w0), (v1, w1), (v2, w2) = LID_OUTLINE
    if v <= v1:
        return lerp(w0, w1, (v - v0) / (v1 - v0))
    return lerp(w1, w2, (v - v1) / (v2 - v1))


def lid_curl(v):
    """The nose curls up in the last part of the lid."""
    return 0.045 * clamp01((v - 0.84) / 0.16) ** 2


def lid_point(u, v, depth=0.0):
    """A point on the top of the lid; `depth` goes down from the top."""
    return Vector((u * lid_half(v), lerp(LID_BACK, LID_FRONT, v), LID_TOP + lid_curl(v) - depth))


# --- Proportions: the skater -------------------------------------------------------

UPPER_ARM = 0.12
FOREARM = 0.11
THIGH = 0.16
SHIN = 0.15


def bend(start, end, first, second, out):
    """The middle joint between `start` and `end`, bent toward `out`."""
    d = end - start
    length = d.length
    along = (first**2 - second**2 + length**2) / (2 * length)
    height = math.sqrt(max(first**2 - along**2, 0.0))
    side = Vector(out) - d.normalized() * Vector(out).dot(d.normalized())
    return start + d.normalized() * along + side.normalized() * height


# He crouches low with his chest forward, the left foot in front and the
# right foot back on the lid.
HIP = Vector((0, 0.03, 0.265))
HEAD_C = Vector((0, -0.045, 0.525))
SHOULDER_Z = 0.425
ANKLE_Z = LID_TOP + 0.025

LEGS = {}
for _side, _sign, _ankle, _out in (
    ("L", 1, Vector((0.075, -0.12, ANKLE_Z)), (0, -1, 0.2)),
    ("R", -1, Vector((-0.075, 0.16, ANKLE_Z)), (0, -1, -0.3)),
):
    _hip = Vector((0.055 * _sign, HIP.y, HIP.z))
    LEGS[_side] = (_hip, bend(_hip, _ankle, THIGH, SHIN, _out), _ankle, _ankle + Vector((0.004 * _sign, -0.06, -0.012)))

# The right hand holds the spade low at his right side; the shaft goes down
# and back to the mud. The left arm reaches back and out for balance.
SR = Vector((-0.08, -0.01, SHOULDER_Z))
WR = Vector((-0.17, -0.05, 0.25))
ER = bend(SR, WR, UPPER_ARM, FOREARM, (-1, 0.3, 0))
SL = Vector((0.08, -0.01, SHOULDER_Z))
WL = Vector((0.19, 0.13, 0.37))
EL = bend(SL, WL, UPPER_ARM, FOREARM, (0.2, 0, -1))
TR = WR + (WR - ER).normalized() * 0.04
TL = WL + (WL - EL).normalized() * 0.04
GRIP = WR + (WR - ER).normalized() * 0.018

SPADE_FOOT = Vector((-0.235, 0.15, 0.08))
SHAFT = (SPADE_FOOT - GRIP).normalized()
SPADE_TOP = GRIP - SHAFT * 0.06

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("lid", tuple(LID_C), tuple(LID_C + Z * 0.1), "root"),
    ("mud", tuple(MUD_C), tuple(MUD_C + Z * 0.08), "root"),
    ("hips", tuple(HIP), (0, 0.02, 0.33), "root"),
    ("spine", (0, 0.02, 0.33), (0, 0.0, 0.39), "hips"),
    ("chest", (0, 0.0, 0.39), (0, -0.02, 0.44), "spine"),
    ("neck", (0, -0.02, 0.44), (0, -0.035, 0.47), "chest"),
    ("head", (0, -0.035, 0.47), (0, -0.05, 0.6), "neck"),
    ("jaw", (0, -0.03, 0.49), (0, -0.09, 0.47), "head"),
    ("scarf", (0, 0.03, 0.465), (0, 0.17, 0.5), "chest"),
    ("scarf.tip", (0, 0.17, 0.5), (0, 0.36, 0.58), "scarf"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    hip, knee, ankle, toe = LEGS[side]
    BONES += [
        (f"upperarm.{side}", tuple(s), tuple(e), "chest"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", tuple(hip), tuple(knee), "hips"),
        (f"shin.{side}", tuple(knee), tuple(ankle), f"thigh.{side}"),
        (f"foot.{side}", tuple(ankle), tuple(toe), f"shin.{side}"),
        # The IK target of the foot rides on the lid.
        (f"ik_foot.{side}", tuple(ankle), tuple(toe), "lid"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < 0.36:
        return blend("hips", "spine", co.z, 0.31, 0.35)
    return blend("spine", "chest", co.z, 0.38, 0.42)


def scarf_weights(co):
    """The scarf goes from the chest to its tip, along its length (Y)."""
    if co.y < 0.12:
        return blend("chest", "scarf", co.y, 0.03, 0.09)
    return blend("scarf", "scarf.tip", co.y, 0.15, 0.24)


# --- Parts ---------------------------------------------------------------------


def ribbon(part, points, widths, tilt, color_of, thickness=0.006):
    """
    A flat ragged ribbon along `points`. `tilt` (degrees for each point) turns
    the width from level (across X) up to the side.
    """
    points = [Vector(p) for p in points]
    front, back = [], []
    for index, point in enumerate(points):
        ahead = points[min(index + 1, len(points) - 1)]
        behind = points[max(index - 1, 0)]
        tangent = (ahead - behind).normalized()
        a = math.radians(tilt[index])
        across = Vector((math.cos(a), 0, math.sin(a)))
        across = (across - tangent * across.dot(tangent)).normalized()
        normal = tangent.cross(across).normalized()
        row = [point + across * widths[index] * u for u in (-1, 0, 1)]
        front.append([p + normal * thickness / 2 for p in row])
        back.append([p - normal * thickness / 2 for p in row])
    edges = panel(part, front, back, color_of)
    part.paint(edges, color_of("edge", 0, 0))


def head_parts():
    parts = []
    skull = Part("skull", BONE, "head", shade=0.12)
    kit.sphere(skull.bm, HEAD_C, (0.056, 0.06, 0.06), 12, 9)
    for sign in (1, -1):
        kit.sphere(skull.bm, HEAD_C + Vector((0.036 * sign, -0.044, -0.02)), (0.019, 0.017, 0.014), 6, 4)
    # The upper jaw with its wide grin.
    kit.sphere(skull.bm, HEAD_C + Vector((0, -0.036, -0.03)), (0.044, 0.03, 0.022), 10, 6)
    brow = kit.box(skull.bm, HEAD_C + Vector((0, -0.054, 0.018)), (0.088, 0.012, 0.012))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    # Big round sockets with small pale glints, a nose hole and the grin.
    face = Part("face", SOCKET, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, HEAD_C + Vector((0.023 * sign, -0.052, 0.0)), (0.019, 0.012, 0.018), 8, 5)
        glint = kit.sphere(face.bm, HEAD_C + Vector((0.021 * sign, -0.062, 0.004)), (0.005, 0.003, 0.005), 5, 3)
        face.paint(faces_of(glint), GLINT)
    kit.cone(face.bm, HEAD_C + Vector((0, -0.06, -0.022)), HEAD_C + Vector((0, -0.063, -0.008)), 0.009, 0.002, 4)
    mouth = kit.sphere(face.bm, HEAD_C + Vector((0, -0.05, -0.046)), (0.04, 0.016, 0.012), 10, 5)
    face.paint(faces_of(mouth), MOUTH)
    for index in range(7):
        a = math.radians(-54 + index * 18)
        tooth = HEAD_C + Vector((0.044 * math.sin(a), -0.034 - 0.032 * math.cos(a), -0.042))
        verts = kit.box(face.bm, tooth, (0.011, 0.008, 0.014))
        face.paint(faces_of(verts), TEETH)
    parts.append(face)

    jaw = Part("jaw", BONE, "jaw", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.05, 0.474), (0.042, 0.034, 0.016), 10, 6)
    for index in range(6):
        a = math.radians(-45 + index * 18)
        tooth = Vector((0.038 * math.sin(a), -0.05 - 0.03 * math.cos(a), 0.484))
        verts = kit.box(jaw.bm, tooth, (0.01, 0.008, 0.012))
        jaw.paint(faces_of(verts), TEETH)
    parts.append(jaw)

    # The ragged teal hood: open at the face, with a peak that trails back.
    hood = Part("hood", HOOD, "head", shade=0.14)
    top = HEAD_C + Vector((0, 0.012, 0.01))
    verts = kit.sphere(hood.bm, top, (0.07, 0.072, 0.068), 12, 8)
    kit.bmesh.ops.delete(hood.bm, geom=[v for v in verts if v.co.y < top.y - 0.03 and v.co.z < top.z + 0.03], context="VERTS")
    for face in list(hood.bm.faces):
        c = face.calc_center_median()
        if c.x < -0.03 and c.z < top.z:
            hood.paint([face], HOOD_LIGHT)
        elif c.x > 0.03 and c.y > top.y:
            hood.paint([face], HOOD_DARK)
    peak = kit.cone(hood.bm, top + Vector((0, 0.05, 0.0)), top + Vector((0.005, 0.12, -0.05)), 0.03, 0.004, 6, squash=0.6)
    hood.paint(faces_of(peak), HOOD_DARK)
    parts.append(hood)

    neck = Part("neck", BONE_DARK, "neck")
    kit.cone(neck.bm, (0, -0.015, 0.43), (0, -0.04, 0.5), 0.012, 0.011, 6)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    # The ragged brown tunic over the ribs, torn open at the front.
    tunic = Part("tunic", TUNIC, torso_weights, shade=0.14)
    kit.tube(tunic.bm, [(0, 0.035, 0.255), (0, 0.025, 0.32), (0, 0.006, 0.38), (0, -0.016, 0.43)], [0.056, 0.054, 0.062, 0.05], 10)
    hollow = kit.sphere(tunic.bm, (0, -0.032, 0.385), (0.034, 0.024, 0.04), 8, 6)
    tunic.paint(faces_of(hollow), CAVITY)
    for z, w in ((0.36, 0.024), (0.385, 0.03), (0.41, 0.028)):
        rib = kit.tube(tunic.bm, [(-w, -0.04, z - 0.006), (0, -0.056, z + 0.004), (w, -0.04, z - 0.006)], [0.0045] * 3, 4)
        tunic.paint(faces_of(rib), BONE)
    sternum = kit.cone(tunic.bm, (0, -0.056, 0.355), (0, -0.05, 0.42), 0.006, 0.006, 4)
    tunic.paint(faces_of(sternum), BONE)
    belt = kit.torus(tunic.bm, (0, 0.03, 0.29), (0, -0.15, 1), 0.056, 0.006, 10, 3)
    tunic.paint(faces_of(belt), TUNIC_DARK)
    parts.append(tunic)

    def skirt_color(row, column):
        return TUNIC_DARK if column % 3 == 1 or row >= 2 else TUNIC

    skirt = Part("skirt", TUNIC, "hips", shade=0.1)
    kit.ragged_cone(skirt, 0.3, 0.2, 0.054, 0.08, 12, 3, 0.85, 0.03, skirt_color, TUNIC_DARK, gap=math.radians(26), y_push=0.04)
    kit.bmesh.ops.translate(skirt.bm, vec=Vector((0, HIP.y, 0)), verts=list(skirt.bm.verts))
    parts.append(skirt)

    # The teal scarf: round the neck, with two long ragged tails that
    # stream far back and up.
    scarf = Part("scarf", HOOD, scarf_weights, shade=0.06)
    kit.torus(scarf.bm, (0, -0.012, 0.448), (0, 0.25, 1), 0.04, 0.014, 10, 5)

    def tail_color(main):
        def color_of(side, row, column):
            if side == "edge":
                return HOOD_DARK
            light = HOOD if main else HOOD_DARK
            return HOOD_LIGHT if (side == "front" and main and row % 3 == 1) else light

        return color_of

    main = [(0.0, 0.03, 0.46), (0.01, 0.1, 0.48), (-0.01, 0.18, 0.5), (0.015, 0.26, 0.54), (-0.005, 0.33, 0.57), (0.02, 0.4, 0.61)]
    ribbon(scarf, main, [0.026, 0.032, 0.034, 0.03, 0.022, 0.006], [10, 25, 40, 30, 15, 20], tail_color(True))
    second = [(0.01, 0.03, 0.445), (0.03, 0.09, 0.45), (0.02, 0.16, 0.46), (0.04, 0.23, 0.49), (0.03, 0.28, 0.5)]
    ribbon(scarf, second, [0.018, 0.022, 0.02, 0.014, 0.004], [60, 50, 40, 55, 50], tail_color(False))
    parts.append(scarf)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
        d = (w - e).normalized()
        upper = Part(f"upperarm.{side}", BONE, f"upperarm.{side}", shade=0.08)
        kit.cone(upper.bm, s, e, 0.011, 0.009, 6)
        rag = kit.cone(upper.bm, s - (e - s).normalized() * 0.008, s + (e - s) * 0.4, 0.02, 0.017, 7)
        upper.paint(faces_of(rag), TUNIC)
        parts.append(upper)

        forearm = Part(f"forearm.{side}", BONE, f"forearm.{side}", shade=0.08)
        kit.cone(forearm.bm, e, w, 0.009, 0.008, 5)
        knob = kit.sphere(forearm.bm, e, (0.013, 0.013, 0.013), 6, 4)
        forearm.paint(faces_of(knob), BONE_DARK)
        parts.append(forearm)

        hand = Part(f"hand.{side}", BONE, f"hand.{side}", shade=0.06)
        kit.sphere(hand.bm, w + d * 0.012, (0.015, 0.014, 0.015), 6, 4)
        if side == "L":
            # The open hand of the balance arm: long bony fingers.
            for spread in (-0.5, 0.0, 0.5):
                side_dir = d.cross(Z).normalized()
                tip = w + d * 0.05 + side_dir * 0.012 * spread * 2 - Z * 0.008
                kit.cone(hand.bm, w + d * 0.018 + side_dir * 0.008 * spread, tip, 0.005, 0.003, 4)
        parts.append(hand)

        hip, knee, ankle, toe = LEGS[side]
        thigh = Part(f"thigh.{side}", BONE, f"thigh.{side}", shade=0.1)
        kit.cone(thigh.bm, hip, knee, 0.014, 0.012, 6)
        cap = kit.sphere(thigh.bm, knee, (0.018, 0.018, 0.018), 6, 4)
        thigh.paint(faces_of(cap), BONE_DARK)
        parts.append(thigh)

        shin = Part(f"shin.{side}", BONE, f"shin.{side}", shade=0.1)
        kit.cone(shin.bm, knee, ankle, 0.011, 0.01, 6)
        wrap = kit.cone(shin.bm, knee.lerp(ankle, 0.62), ankle, 0.019, 0.02, 7)
        shin.paint(faces_of(wrap), WRAP)
        parts.append(shin)

        # The foot is wrapped in rags.
        foot = Part(f"foot.{side}", WRAP, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, ankle.lerp(toe, 0.5) + Vector((0, 0, -0.004)), (0.024, 0.046, 0.016), 8, 5)
        strip = kit.torus(foot.bm, ankle.lerp(toe, 0.4), (toe - ankle), 0.022, 0.004, 8, 3)
        foot.paint(faces_of(strip), WRAP_DARK)
        parts.append(foot)
    return parts


def spade_parts():
    """The small spade in the right hand: a wooden shaft with a D grip and an iron blade."""
    spade = Part("spade", HANDLE, "hand.R", shade=0.08)
    blade_top = SPADE_FOOT - SHAFT * 0.07
    kit.cone(spade.bm, SPADE_TOP, blade_top, 0.008, 0.008, 6)
    # The D grip at the top of the shaft.
    grip = kit.torus(spade.bm, SPADE_TOP - SHAFT * 0.02, Vector((1, 0, 0)), 0.018, 0.004, 8, 3)
    spade.paint(faces_of(grip), HANDLE)
    # The blade lies in the plane of the shaft and the Lane, so its face
    # turns to the camera side.
    across = SHAFT.cross(X).normalized()
    centre = SPADE_FOOT - SHAFT * 0.02
    blade = kit.slab(spade.bm, centre, across * 0.034, SHAFT * 0.05, Vector((1, 0, 0)) * 0.004)
    spade.paint(faces_of(blade), SPADE)
    edge = kit.slab(spade.bm, SPADE_FOOT + SHAFT * 0.032, across * 0.026, SHAFT * 0.006, Vector((1, 0, 0)) * 0.005)
    spade.paint(faces_of(edge), SPADE_EDGE)
    socket = kit.cone(spade.bm, blade_top - SHAFT * 0.01, blade_top + SHAFT * 0.03, 0.011, 0.014, 6)
    spade.paint(faces_of(socket), SPADE)
    return [spade]


def lid_parts():
    lid = Part("lid", WOOD, "lid", shade=0.04)
    vs = [0.0, 0.18, 0.4, 0.68, 0.84, 0.93, 1.0]
    us = [-1, -0.5, 0, 0.5, 1]

    def grid(depth):
        return [[lid_point(u, v, depth) for u in us] for v in vs]

    def lid_color(side, row, column):
        if side == "back":
            return WOOD_DARK
        # Three planks along the lid.
        return WOOD_LIGHT if column in (1, 2) and row % 2 == 0 else WOOD if column in (1, 2) else WOOD_DARK if column == 0 else WOOD

    edges = panel(lid, grid(0.0), grid(LID_THICK), lid_color)
    lid.paint(edges, WOOD_DARK)
    # A raised rim along each long edge.
    for sign in (1, -1):
        rim = kit.tube(lid.bm, [lid_point(sign * 0.94, v, -0.004) for v in (0.02, 0.4, 0.68, 0.9, 0.98)], [0.009] * 5, 4)
        lid.paint(faces_of(rim), WOOD_DARK)
    # Iron bands across the lid, with nails.
    for v in (0.22, 0.6, 0.92):
        half = lid_half(v) + 0.004
        y = lerp(LID_BACK, LID_FRONT, v)
        z = LID_TOP + lid_curl(v)
        band = kit.box(lid.bm, (0, y, z - LID_THICK / 2 + 0.002), (half * 2, 0.02, LID_THICK + 0.008))
        lid.paint(faces_of(band), IRON)
        for u in (-0.6, 0.6):
            nail = kit.sphere(lid.bm, (u * half, y, z + 0.006), (0.006, 0.006, 0.004), 5, 3)
            lid.paint(faces_of(nail), NAIL)
    # Mud on the lid and a wake of clods along the sides.
    for index, (u, v) in enumerate(((0.7, 0.05), (-0.5, 0.12), (0.2, 0.3), (-0.85, 0.5), (0.85, 0.75))):
        clod = kit.sphere(lid.bm, lid_point(u, v, -0.002), (0.016, 0.022, 0.006), 6, 3)
        lid.paint(faces_of(clod), MUD if index % 2 else MUD_DARK)
    for index, (x, y) in enumerate(((-0.13, 0.22), (0.12, 0.26), (-0.15, 0.32), (0.1, 0.36))):
        clod = kit.sphere(lid.bm, (x, y, 0.025 + 0.012 * (index % 2)), (0.018, 0.022, 0.014), 6, 4)
        lid.paint(faces_of(clod), MUD_LIGHT if index % 2 else MUD)
    return [lid]


def mud_parts():
    """The spray of mud at the nose: wet sheets that fan out and clods above them."""
    mud = Part("mud", MUD, "mud", shade=0)
    c = MUD_C
    for index in range(5):
        a = math.radians(-160 + index * 35)
        side = Vector((math.cos(a), math.sin(a) * 0.6 - 0.1, 0))
        base = c + side * 0.06
        out = (side * 1.3 + Vector((0, 0.3, 0.8))).normalized()
        sheet = kit.cone(mud.bm, base, base + out * (0.06 + 0.02 * (index % 2)), 0.045, 0.012, 6, squash=0.3)
        mud.paint(faces_of(sheet), MUD_LIGHT if index % 2 else MUD)
    for sign in (1, -1):
        # A wide wing of mud off each side of the nose.
        wing = kit.cone(mud.bm, c + Vector((0.09 * sign, 0.05, 0.0)), c + Vector((0.2 * sign, 0.14, 0.09)), 0.035, 0.008, 6, squash=0.45)
        mud.paint(faces_of(wing), MUD if sign > 0 else MUD_LIGHT)
    for index, offset in enumerate(((0.12, 0.0, 0.13), (-0.15, 0.04, 0.12), (0.04, -0.04, 0.16), (-0.06, -0.02, 0.18), (0.2, 0.12, 0.1), (-0.21, 0.1, 0.08))):
        size = 0.012 + 0.004 * (index % 2)
        clod = kit.sphere(mud.bm, c + Vector(offset), (size, size, size), 5, 4)
        mud.paint(faces_of(clod), MUD_DARK if index % 2 else MUD)
    pool = kit.cone(mud.bm, c + Vector((0, 0.04, -0.004)), c + Vector((0, 0.04, 0.012)), 0.13, 0.11, 10)
    mud.paint(faces_of(pool), MUD_DARK)
    return [mud]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CoffinLidSkater", BONES)
    parts = head_parts() + body_parts() + limb_parts() + spade_parts() + lid_parts() + mud_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CoffinLidSkaterMesh")
    kit.skin(mesh, rig)
    return rig, mesh


def add_controls(rig):
    """IK for the legs: each foot stays on its `ik_foot` bone on the lid, and turns with it (`Grip`)."""
    bones = rig.pose.bones
    for side in ("L", "R"):
        ik = bones[f"shin.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = rig
        ik.subtarget = f"ik_foot.{side}"
        ik.chain_count = 2
        grip = bones[f"foot.{side}"].constraints.new("COPY_ROTATION")
        grip.name = "Grip"
        grip.target = rig
        grip.subtarget = f"ik_foot.{side}"
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
            result[key.replace("__", ".").replace("_at_", "@").replace("_slash_", "/")] = value
        return result

    def ride(base, offset=(0, 0, 0), pitch=0.0, roll=0.0, crouch=0.0, lean=0.0, twist=0.0, mud=0.6):
        """
        Moves the lid and turns it (`pitch` about X, nose down for a positive
        value; `roll` about Y), and moves the skater with it: he is not its
        child. `crouch` lowers his hips on the lid, and `lean` bends them
        forward. `mud` scales the spray at the nose.
        """
        offset = Vector(offset)
        spin = Quaternion(Y, math.radians(roll)) @ Quaternion(X, math.radians(pitch))
        seat = LID_C + offset + spin @ (HIP - LID_C) - HIP
        return pose(
            base,
            lid_at_loc=at("lid", offset),
            lid=t("lid", (X, pitch), (Y, roll)),
            hips_at_loc=at("hips", seat + Vector((0, 0, -crouch))),
            hips=t("hips", (X, lean + pitch * 0.6), (Z, twist), (Y, roll * 0.6)),
            mud_at_loc=at("mud", (offset.x, offset.y, 0)),
            mud_at_scale=mud,
        )

    def stand(bob=0.0, flap=0.0, chatter=0.0, sway=0.0):
        """
        At rest: he glides on the lid in the mud. The lid bobs and rocks, the
        scarf flaps, his jaw chatters in a grin, and the balance arm sways.
        """
        base = {
            "shin.L/IK": 1.0,
            "shin.R/IK": 1.0,
            "foot.L/Grip": 1.0,
            "foot.R/Grip": 1.0,
            "spine": t("spine", (X, 14 + bob * 2)),
            "chest": t("chest", (X, 6)),
            "neck": t("neck", (X, -14)),
            "head": t("head", (X, -12 - bob * 3), (Z, -14), (Y, sway * 4)),
            "jaw": t("jaw", (X, 10 + chatter * 12)),
            "scarf": t("scarf", (Z, flap * 10), (X, -12)),
            "scarf.tip": t("scarf.tip", (Z, flap * 18), (X, -flap * 6)),
            "upperarm.L": t("upperarm.L", (X, sway * 8), (Y, -sway * 6)),
            "forearm.L": t("forearm.L", (X, -sway * 6)),
            "upperarm.R": t("upperarm.R", (X, -bob * 3)),
        }
        return ride(base, (0, 0, 0.006 * bob), pitch=-1.5 * bob, roll=2 * sway, crouch=0.045 + 0.008 * bob, mud=0.55 + 0.1 * bob)

    def slump(breath=0.0):
        """Low HP: the lid sinks nose down in the mud, and he hunches, the skull and the scarf low."""
        base = pose(
            stand(),
            spine=t("spine", (X, 12 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 2)),
            neck=t("neck", (X, 6)),
            head=t("head", (X, -12 + breath * 4), (Z, -16), (Y, -12)),
            jaw=t("jaw", (X, 22 + breath * 4)),
            scarf=t("scarf", (X, -60), (Z, -8)),
            scarf__tip=t("scarf.tip", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -60), (Y, 10)),
            forearm__L=t("forearm.L", (X, 20)),
            upperarm__R=t("upperarm.R", (X, 14)),
        )
        return ride(base, (0, 0, -0.014 - breath * 0.004), pitch=5 + breath, roll=-4, crouch=0.03 + breath * 0.006, mud=0.3)

    def recoil(base, amount=1.0):
        """A hit knocks the lid back, and he leans back with his arms up."""
        base = pose(
            base,
            spine=t("spine", (X, -12 * amount)),
            chest=t("chest", (X, -8 * amount)),
            head=t("head", (X, -22 * amount), (Z, 12 * amount)),
            jaw=t("jaw", (X, 30 * amount)),
            scarf=t("scarf", (X, 24 * amount), (Z, 14 * amount)),
            scarf__tip=t("scarf.tip", (X, 20 * amount)),
            upperarm__L=t("upperarm.L", (X, -40 * amount), (Y, -30 * amount)),
            upperarm__R=t("upperarm.R", (X, -30 * amount), (Y, 20 * amount)),
        )
        return ride(base, (0, 0.05 * amount, 0.012 * amount), pitch=-10 * amount, roll=6 * amount, mud=0.4)

    def dig(base):
        """The nose of the lid digs into the mud, and he pitches forward."""
        base = pose(
            base,
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 14)),
            head=t("head", (X, -16), (Z, -10)),
            jaw=t("jaw", (X, 34)),
            scarf=t("scarf", (X, 40)),
            scarf__tip=t("scarf.tip", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -50), (Y, -40)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, 30)),
        )
        return ride(base, (0, -0.03, 0.03), pitch=16, mud=1.6)

    def thrown(base, rise=1.0):
        """Thrown off the lid, up and to his right (the camera side), arms and legs out."""
        return pose(
            base,
            shin__L_slash_IK=0.0,
            shin__R_slash_IK=0.0,
            foot__L_slash_Grip=0.0,
            foot__R_slash_Grip=0.0,
            hips_at_loc=at("hips", (-0.14 * rise, -0.1 * rise, 0.1 * rise)),
            hips=t("hips", (X, -30 * rise), (Y, -60 * rise)),
            spine=t("spine", (X, -10)),
            chest=t("chest", (X, -6)),
            head=t("head", (X, -20), (Z, -20)),
            jaw=t("jaw", (X, 34)),
            scarf=t("scarf", (X, 50), (Z, 20)),
            scarf__tip=t("scarf.tip", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -80), (Y, -60)),
            upperarm__R=t("upperarm.R", (X, -90), (Y, 60)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -20), (Y, -20)),
            thigh__R=t("thigh.R", (X, 30), (Y, 20)),
            shin__L=t("shin.L", (X, 30)),
            shin__R=t("shin.R", (X, 20)),
        )

    def landed(base, bounce=0.0):
        """On his back on the ground at his right, the lid upside down at his left."""
        return pose(
            base,
            shin__L_slash_IK=0.0,
            shin__R_slash_IK=0.0,
            foot__L_slash_Grip=0.0,
            foot__R_slash_Grip=0.0,
            hips_at_loc=at("hips", (-0.22, -0.12, -0.15)),
            hips=t("hips", (X, -84 + bounce), (Z, -30)),
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 8)),
            head=t("head", (X, 14), (Z, -40)),
            jaw=t("jaw", (X, 30)),
            scarf=t("scarf", (X, 30), (Z, 60)),
            scarf__tip=t("scarf.tip", (X, 10)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, -40)),
            # The spade lies flat on the ground beside him.
            upperarm__R=t("upperarm.R", (Z, 70), (Y, 40)),
            forearm__L=t("forearm.L", (X, 20)),
            thigh__L=t("thigh.L", (X, -40), (Y, -10)),
            thigh__R=t("thigh.R", (X, -50), (Y, 14)),
            shin__L=t("shin.L", (X, 50)),
            shin__R=t("shin.R", (X, 60)),
        )

    def lid_flip(base, roll, lift=0.0, slide=0.0, pitch=0.0, mud=0.9):
        """The lid flips over onto its left side and its back, away from the camera."""
        return pose(
            base,
            lid_at_loc=at("lid", (0.15 * slide, -0.05 * slide, lift)),
            lid=t("lid", (X, pitch), (Y, roll)),
            mud_at_scale=mud,
        )

    def tumbled(base, bounce=0.0):
        """Upside down, the curled nose of the lid points down, so the lid lies a little higher."""
        return lid_flip(landed(base, bounce), 180 - bounce * 0.5, 0.03, 1.0, mud=0.3)

    def sit_up(base):
        """A Rebirth gets up: he sits up and the lid flips back onto its edge."""
        base = pose(
            landed(base),
            hips_at_loc=at("hips", (-0.14, -0.08, -0.17)),
            hips=t("hips", (X, -30), (Z, -20)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, -10), (Z, -20)),
            jaw=t("jaw", (X, 26)),
            upperarm__R=t("upperarm.R", (X, -10), (Y, 30)),
            thigh__L=t("thigh.L", (X, -60)),
            thigh__R=t("thigh.R", (X, -50)),
            shin__L=t("shin.L", (X, 80)),
            shin__R=t("shin.R", (X, 70)),
        )
        return lid_flip(base, 90, 0.08, 0.6)

    def hop(base):
        """He jumps back onto the lid, which lands flat: the end of a Rebirth."""
        base = pose(
            base,
            shin__L_slash_IK=0.3,
            shin__R_slash_IK=0.3,
            spine=t("spine", (X, -6)),
            head=t("head", (X, -16), (Z, -10)),
            jaw=t("jaw", (X, 30)),
            scarf=t("scarf", (X, 30)),
            upperarm__L=t("upperarm.L", (X, -60), (Y, -50)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 30)),
        )
        return ride(base, (0, 0, 0.01), crouch=-0.06, mud=1.0)

    def curled(base, depth=1.0):
        """Curled low on the sunken lid, the skull down: a summon starts."""
        base = pose(
            base,
            spine=t("spine", (X, 40 * depth)),
            chest=t("chest", (X, 20 * depth)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 26 * depth)),
            jaw=t("jaw", (X, 4)),
            scarf=t("scarf", (X, -30)),
            scarf__tip=t("scarf.tip", (X, -30)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, 20)),
            upperarm__R=t("upperarm.R", (X, -20), (Y, -10)),
        )
        return ride(base, (0, 0, -0.03 * depth), pitch=4 * depth, crouch=0.07 * depth, mud=0.1)

    def pop(base):
        """He pops up with his arms wide and laughs, and the lid jumps nose up."""
        base = pose(
            base,
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -6)),
            head=t("head", (X, -24), (Z, -10)),
            jaw=t("jaw", (X, 36)),
            scarf=t("scarf", (X, 30), (Z, 14)),
            scarf__tip=t("scarf.tip", (X, 20)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, -60)),
            upperarm__R=t("upperarm.R", (X, -50), (Y, 40)),
        )
        return ride(base, (0, -0.02, 0.025), pitch=-10, crouch=-0.02, mud=1.3)

    def glide(phase):
        """
        The walk: a bumpy glide. He plants the spade in front and pushes it
        back through the mud as a pole, and his body pumps with each push.
        """
        a = 2 * math.pi * phase
        push = math.sin(a)
        bump = abs(math.sin(2 * a))
        base = pose(
            stand(flap=math.sin(a * 2), chatter=bump, sway=-push),
            spine=t("spine", (X, 12 + 6 * push)),
            chest=t("chest", (X, 6)),
            head=t("head", (X, -14 - 4 * push), (Z, -14)),
            jaw=t("jaw", (X, 14 + 10 * bump)),
            scarf=t("scarf", (Z, 14 * math.sin(a * 2)), (X, -18)),
            scarf__tip=t("scarf.tip", (Z, 22 * math.sin(a * 2 + 1)), (X, -12)),
            # The spade arm: forward at the plant (phase 0.75), back at the end of the push (phase 0.25).
            upperarm__R=t("upperarm.R", (X, 26 * push + 4), (Y, 10)),
            forearm__R=t("forearm.R", (X, -50 * max(0.0, -push))),
            upperarm__L=t("upperarm.L", (X, -14 * push), (Y, -10)),
        )
        return ride(base, (0, 0, 0.014 * bump), pitch=-4 * math.sin(2 * a), roll=3 * push, crouch=0.06 + 0.02 * push, twist=-6 * push, mud=0.7 + 0.6 * bump)

    # The attack is the Charge: the lid draws back, then surges forward nose
    # first, and he swipes the spade into the target. The slash effect
    # starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the lid hits
    # at frame 15 of 30.
    def wind_up(base):
        base = pose(
            base,
            spine=t("spine", (X, 20)),
            chest=t("chest", (X, 6), (Z, -16)),
            head=t("head", (X, -18), (Z, -6)),
            jaw=t("jaw", (X, 8)),
            scarf=t("scarf", (X, 4)),
            upperarm__R=t("upperarm.R", (X, 50), (Y, 40)),
            forearm__R=t("forearm.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, -20), (Y, -20)),
        )
        return ride(base, (0, 0.06, 0.0), pitch=-4, crouch=0.04, twist=-10, mud=0.4)

    def surge(base, swipe=1.0):
        base = pose(
            base,
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 10), (Z, 20 * swipe)),
            head=t("head", (X, -22), (Z, -10)),
            jaw=t("jaw", (X, 34)),
            scarf=t("scarf", (X, 30), (Z, -20 * swipe)),
            scarf__tip=t("scarf.tip", (X, 26), (Z, -26 * swipe)),
            # An underhand swipe: the spade scoops forward through the mud, up to the target.
            upperarm__R=t("upperarm.R", (X, -60 - 70 * swipe), (Y, 24)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (X, 30), (Y, -40)),
        )
        return ride(base, (0, -0.16, 0.02), pitch=-8 + 10 * swipe, crouch=0.02, twist=10 * swipe, mud=1.0 + 0.8 * swipe)

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, bob, flap, chatter, sway in (
        (0, 0, 0, 0, 0),
        (6, 0.5, 1, 1, 0.5),
        (12, 1, 0, 0, 1),
        (18, 0.5, -1, 1, 0.5),
        (24, 0, 0, 0, 0),
        (30, -0.5, 1, 1, -0.5),
        (36, -1, 0, 0, -1),
        (42, -0.5, -1, 1, -0.5),
        (48, 0, 0, 0, 0),
    ):
        idle.key(frame, stand(bob, flap, chatter, sway))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, slump(breath))
    clips.append(low_hp)

    walk = Clip("walk", 16, loop=True)
    for frame in range(0, 17, 2):
        walk.key(frame, glide(frame / 16))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(8, wind_up(stand())).key(13, surge(stand(), 0.4)).key(15, surge(stand()))
    attack.key(20, surge(stand(), 0.8)).key(26, stand(bob=0.5)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    # The death: the nose digs in, the lid flips over away from the camera,
    # and he tumbles off onto his back on the camera side.
    death = Clip("death", 36)
    death.key(0, stand()).key(4, recoil(stand(), 0.6)).key(9, dig(stand()))
    death.key(14, lid_flip(thrown(stand(), 0.6), 80, 0.12, 0.5, 10)).key(19, lid_flip(thrown(stand()), 150, 0.06, 0.9))
    death.key(25, tumbled(stand())).key(29, tumbled(stand(), 6)).key(36, tumbled(stand()))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up:
    # the lid flips back, and he hops on again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand(), 0.6)).key(9, dig(stand()))
    rebirth.key(14, lid_flip(thrown(stand(), 0.6), 80, 0.12, 0.5, 10)).key(19, tumbled(stand())).key(22, tumbled(stand(), 4))
    rebirth.key(31, sit_up(stand())).key(40, hop(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, curled(stand())).key(8, curled(stand(), 0.8)).key(15, pop(stand())).key(24, stand())
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "coffin-lid-skater.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
