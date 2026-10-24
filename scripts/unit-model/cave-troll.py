"""
Cave Troll (`feral.caveTroll`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a large grey cave troll with a
bent back, a small head low between huge shoulders, very long arms with big
fists, short thick legs, moss on its back and patches of coarse hair. It is
wild: no armor and no tribe marks. It holds a broken stalactite as a club and
chews on a lost shield. Run it in Blender (see `unit_model_kit.py`). It
writes `apps/web/art/units/raw/cave-troll.glb`; then
`bun unit-model:pack cave-troll` packs it for the game.

The Battle camera sees the right side of a player Unit, so the troll turns a
little to its right at rest. The stalactite is in its right hand, and the
shield is in the right side of its mouth with its face to the camera. Its
left fist rests on its knuckles on the ground. The cut on its right arm, on
the camera side, has a bone that scales: it closes in the cast clip
(Regenerate). It is Heavy, so its walk is a slow knuckle walk. Its attack
swings the stalactite over its head and down.
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

SKIN = hex_color("#959790")
SKIN_SHADE = hex_color("#74766e")
SKIN_DEEP = hex_color("#55574f")
HAIR = hex_color("#6e6658")
HAIR_LIGHT = hex_color("#9a907e")
MOSS = hex_color("#7f8c3c")
MOSS_DARK = hex_color("#5a6a2c")
EYE = hex_color("#e8d890")
PUPIL = hex_color("#1c1a14")
MOUTH = hex_color("#5a2a26")
TUSK = hex_color("#ece2c8")
NAIL = hex_color("#4a463e")
WOUND = hex_color("#b42c2c")
WOUND_DARK = hex_color("#6e1a1a")
STALACTITE = hex_color("#c1b8a4")
STALACTITE_DARK = hex_color("#8c8372")
WOOD = hex_color("#8a6440")
WOOD_DARK = hex_color("#5a3e26")
IRON = hex_color("#6e6a62")
BRASS = hex_color("#b8913e")

# --- Proportions ---------------------------------------------------------------

# A hunched giant: the back is bent, the shoulders are high and wide, the
# small head sits low and forward between them, the legs are short and the
# arms reach the ground.
HIP_Z = 0.36
WAIST_Z = 0.46
CHEST_Z = 0.6
NECK_Z = 0.7
HEAD_C = Vector((0, -0.23, 0.73))
# The head is small, but it must read on the Board: the parts are made at a
# small size and then scaled about the base of the neck.
HEAD_BASE = Vector((0, -0.17, 0.72))
HEAD_SCALE = 1.25


def grown(point):
    return HEAD_BASE + (Vector(point) - HEAD_BASE) * HEAD_SCALE

KNEE_Z = 0.2
ANKLE_Z = 0.06
LEG_X = 0.12

SL = Vector((0.24, -0.06, 0.7))
EL = Vector((0.33, -0.1, 0.45))
WL = Vector((0.34, -0.15, 0.17))
TL = Vector((0.34, -0.19, 0.05))
SR, ER = (Vector((-v.x, v.y, v.z)) for v in (SL, EL))
WR = Vector((-0.34, -0.16, 0.2))
TR = Vector((-0.35, -0.21, 0.1))

# The stalactite: the narrow end in the right fist, the thick broken end up
# and back, behind the arm.
GRIP = Vector((-0.355, -0.19, 0.15))
CLUB_END = Vector((-0.43, 0.2, 0.56))

# The cut on the outside of the right upper arm.
CUT = SR.lerp(ER, 0.5) + Vector((-0.085, 0, 0))

# The chewed shield, in the right side of the mouth.
SHIELD_C = Vector((-0.07, -0.3, 0.66))
SHIELD_N = Vector((-1.0, -0.45, 0.1)).normalized()

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0.02, HIP_Z), (0, 0.02, WAIST_Z), "root"),
    ("spine", (0, 0.02, WAIST_Z), (0, -0.01, CHEST_Z), "hips"),
    ("chest", (0, -0.01, CHEST_Z), (0, -0.1, NECK_Z), "spine"),
    ("neck", (0, -0.1, NECK_Z), tuple(HEAD_BASE), "chest"),
    ("head", tuple(HEAD_BASE), tuple(grown((0, -0.26, 0.84))), "neck"),
    ("jaw", tuple(grown((0, -0.21, 0.7))), tuple(grown((0, -0.31, 0.66))), "head"),
    ("club", tuple(GRIP), tuple(CLUB_END), "hand.R"),
    ("wound", tuple(CUT), tuple(CUT + Vector((-0.04, 0, 0))), "upperarm.R"),
]
ARM_BONES = []
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    ARM_BONES += [
        (f"shoulder.{side}", (0.06 * sign, -0.04, 0.68), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0.02, HIP_Z), (LEG_X * sign, -0.03, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, -0.03, KNEE_Z), (LEG_X * sign, 0.02, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0.02, ANKLE_Z), (LEG_X * sign, -0.11, 0.02), f"shin.{side}"),
    ]
# The parents come before their children: the club and the wound go last.
BONES = BONES[:7] + ARM_BONES + BONES[7:]

# How far the right hand turns the stalactite down at the end of the smash,
# and how far the stalactite turns forward in the fist.
HAND_SMASH = 0
CLUB_SMASH = 165
CLUB_FALLEN = 40

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < WAIST_Z + 0.02:
        return blend("hips", "spine", co.z, 0.4, 0.52)
    if co.z < NECK_Z - 0.02:
        return blend("spine", "chest", co.z, 0.52, 0.62)
    return blend("chest", "neck", co.z, 0.72, 0.78) if co.y < -0.12 else {"chest": 1.0}


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


def arm_weights(side, s, e, w, t):
    sign = 1 if side == "L" else -1
    chain = chain_weights([Vector((0.06 * sign, -0.04, 0.68)), s, e, w, t], [f"shoulder.{side}", f"upperarm.{side}", f"forearm.{side}", f"hand.{side}"])

    def weights(co):
        # The top of the shoulder goes into the hump, so it follows the chest there.
        result = chain(co)
        inside = clamp01((abs(co.x) - (abs(s.x) - 0.1)) / 0.08)
        if inside < 1:
            result = {bone: weight * inside for bone, weight in result.items()}
            result["chest"] = result.get("chest", 0) + 1 - inside
        return result

    return weights


def leg_weights(side):
    sign = 1 if side == "L" else -1
    chain = chain_weights([Vector((LEG_X * sign, 0.02, HIP_Z)), Vector((LEG_X * sign, -0.03, KNEE_Z)), Vector((LEG_X * sign, 0.02, ANKLE_Z))], [f"thigh.{side}", f"shin.{side}"])

    def weights(co):
        if co.z > HIP_Z - 0.02:
            return blend(f"thigh.{side}", "hips", co.z, HIP_Z - 0.02, HIP_Z + 0.05)
        return chain(co)

    return weights


# --- Parts ---------------------------------------------------------------------


def skin_color(face, center):
    """Large shapes of grey skin: light on the top, darker on the sides and underneath."""
    if face.normal.z < -0.4:
        return SKIN_DEEP
    if face.normal.z < 0.1:
        return SKIN_SHADE
    return SKIN


def tufts(part, center, radii, count, length, seed=0, only=None, colors=(HAIR, HAIR_LIGHT)):
    """Coarse hair or moss on an ellipsoid: cones that lie along the surface and hang down."""
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
        out = (direction * 0.8 + down.normalized()).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.45, 0.003, 4)
        part.paint(faces_of(verts), colors[index % 2])


def moss_patch(part, center, normal, size):
    """A flat cushion of moss that lies on the skin."""
    normal = Vector(normal).normalized()
    verts = kit.cone(part.bm, Vector(center) - normal * 0.01, Vector(center) + normal * size * 0.35, size, size * 0.6, 7)
    part.paint(faces_of(verts), MOSS)
    tufts(part, Vector(center) + normal * size * 0.2, (size * 0.8, size * 0.8, size * 0.3), 6, size * 0.5, 1, None, (MOSS, MOSS_DARK))


def body_parts():
    parts = []
    body = Part("body", skin_color, torso_weights, shade=0.2)
    # The hump of the bent back, the deep chest, the belly and the hips.
    kit.sphere(body.bm, (0, 0.02, 0.68), (0.25, 0.18, 0.12), 14, 8)
    kit.sphere(body.bm, (0, -0.06, 0.6), (0.22, 0.18, 0.15), 14, 10)
    kit.sphere(body.bm, (0, -0.06, 0.47), (0.18, 0.16, 0.12), 12, 8)
    kit.sphere(body.bm, (0, 0.0, 0.38), (0.16, 0.14, 0.08), 12, 6)
    # The neck goes forward and down from the hump.
    kit.cone(body.bm, (0, -0.07, 0.69), (0, -0.19, 0.72), 0.1, 0.08, 10)
    # The pecs and the round belly.
    for sign in (1, -1):
        pec = kit.sphere(body.bm, (0.09 * sign, -0.19, 0.6), (0.09, 0.05, 0.07), 8, 6)
        body.paint(faces_of(pec), SKIN)
    belly = kit.sphere(body.bm, (0, -0.17, 0.46), (0.12, 0.06, 0.09), 10, 6)
    body.paint(faces_of(belly), SKIN_SHADE)
    # A loincloth of matted hair, the only thing it wears.
    tufts(body, (0, -0.02, 0.37), (0.16, 0.14, 0.06), 26, 0.09, 2, lambda d: d.z < 0.4)
    # Coarse hair down the spine, and moss on the hump.
    tufts(body, (0, 0.06, 0.7), (0.18, 0.15, 0.12), 26, 0.06, 4, lambda d: d.y > 0.2 and d.z > 0.0)
    moss_patch(body, (0.05, 0.08, 0.79), (0.1, 0.4, 1), 0.07)
    moss_patch(body, (-0.14, 0.04, 0.77), (-0.4, 0.3, 1), 0.06)
    moss_patch(body, (0.17, -0.02, 0.74), (0.6, 0.1, 1), 0.05)
    parts.append(body)
    return parts


def head_parts():
    parts = []
    head = Part("head", skin_color, "head", shade=0.15)
    # A small cranium with a heavy brow and a big lumpy nose.
    kit.sphere(head.bm, HEAD_C + Vector((0, 0.02, 0.02)), (0.07, 0.075, 0.07), 10, 8)
    brow = kit.sphere(head.bm, HEAD_C + Vector((0, -0.05, 0.035)), (0.068, 0.03, 0.022), 10, 5)
    head.paint(faces_of(brow), SKIN_SHADE)
    nose = kit.sphere(head.bm, HEAD_C + Vector((0, -0.085, 0.0)), (0.026, 0.03, 0.03), 8, 6)
    head.paint(faces_of(nose), SKIN_SHADE)
    for sign in (1, -1):
        eye = kit.sphere(head.bm, HEAD_C + Vector((0.033 * sign, -0.068, 0.02)), (0.012, 0.008, 0.009), 6, 4)
        head.paint(faces_of(eye), EYE)
        pupil = kit.sphere(head.bm, HEAD_C + Vector((0.033 * sign, -0.075, 0.02)), (0.005, 0.004, 0.005), 4, 3)
        head.paint(faces_of(pupil), PUPIL)
        # Long pointed ears.
        ear = kit.cone(head.bm, HEAD_C + Vector((0.06 * sign, 0.01, 0.01)), HEAD_C + Vector((0.12 * sign, 0.04, 0.04)), 0.025, 0.003, 6, squash=0.4)
        head.paint(faces_of(ear), SKIN_SHADE)
        nostril = kit.sphere(head.bm, HEAD_C + Vector((0.012 * sign, -0.108, -0.01)), (0.007, 0.005, 0.006), 4, 3)
        head.paint(faces_of(nostril), SKIN_DEEP)
    # The upper lip and teeth, and a tuft of hair on the crown.
    lip = kit.sphere(head.bm, HEAD_C + Vector((0, -0.07, -0.035)), (0.05, 0.035, 0.018), 8, 4)
    head.paint(faces_of(lip), SKIN_SHADE)
    tufts(head, HEAD_C + Vector((0, 0.03, 0.05)), (0.05, 0.05, 0.04), 12, 0.05, 3, lambda d: d.z > 0.1)
    parts.append(head)

    jaw = Part("jaw", skin_color, "jaw", shade=0.12)
    # A big underbite with two tusks that point up.
    kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.06, -0.06)), (0.065, 0.05, 0.035), 10, 6)
    mouth = kit.sphere(jaw.bm, HEAD_C + Vector((0, -0.075, -0.045)), (0.05, 0.035, 0.01), 8, 4)
    jaw.paint(faces_of(mouth), MOUTH)
    for sign in (1, -1):
        tusk = kit.cone(jaw.bm, HEAD_C + Vector((0.032 * sign, -0.09, -0.05)), HEAD_C + Vector((0.036 * sign, -0.1, -0.005)), 0.01, 0.002, 5)
        jaw.paint(faces_of(tusk), TUSK)
    parts.append(jaw)

    # The lost shield, bitten in the right side of the mouth: a round board
    # of planks with an iron rim and a brass boss, a big bite out of it.
    shield = Part("shield", WOOD, "jaw", smooth=False, shade=0.08)
    face_dir = SHIELD_N
    up = (Z - face_dir * face_dir.dot(Z)).normalized()
    side = up.cross(face_dir).normalized()
    radius = 0.068
    segments = 12
    front, back = [], []
    for step in range(segments):
        angle = 2 * math.pi * step / segments
        # The bite: the rim near the mouth is gone.
        bite = 0.5 if step in (0, 1, 11) else 1.0
        offset = (side * math.cos(angle) + up * math.sin(angle)) * radius * bite
        front.append(shield.bm.verts.new(SHIELD_C + offset + face_dir * 0.007))
        back.append(shield.bm.verts.new(SHIELD_C + offset - face_dir * 0.007))
    center_front = shield.bm.verts.new(SHIELD_C + face_dir * 0.012)
    center_back = shield.bm.verts.new(SHIELD_C - face_dir * 0.007)
    for step in range(segments):
        n = (step + 1) % segments
        face = shield.bm.faces.new((center_front, front[step], front[n]))
        shield.paint([face], WOOD if step % 2 else WOOD_DARK)
        shield.bm.faces.new((center_back, back[n], back[step]))
        rim = shield.bm.faces.new((front[n], front[step], back[step], back[n]))
        shield.paint([rim], IRON)
    kit.bmesh.ops.recalc_face_normals(shield.bm, faces=list(shield.bm.faces))
    boss = kit.sphere(shield.bm, SHIELD_C + face_dir * 0.014 - side * 0.015, (0.022, 0.022, 0.022), 7, 5)
    shield.paint(faces_of(boss), BRASS)
    for angle in (-0.4, 0.0, 0.4):
        tip = SHIELD_C + (side * math.cos(angle) + up * math.sin(angle)) * radius * 0.45
        splinter = kit.cone(shield.bm, tip, tip + (side * math.cos(angle) + up * math.sin(angle)) * 0.035, 0.01, 0.002, 4, squash=0.4)
        shield.paint(faces_of(splinter), WOOD_DARK)
    parts.append(shield)
    grow = kit.Matrix.Translation(HEAD_BASE) @ kit.Matrix.Scale(HEAD_SCALE, 4) @ kit.Matrix.Translation(-HEAD_BASE)
    for part in parts:
        kit.bmesh.ops.transform(part.bm, matrix=grow, verts=list(part.bm.verts))
    return parts


def arm_parts():
    parts = []
    for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
        arm = Part(f"arm.{side}", skin_color, arm_weights(side, s, e, w, t), shade=0.18)
        kit.sphere(arm.bm, s + Vector((0.01 * sign, 0.01, 0.0)), (0.11, 0.1, 0.1), 10, 8)
        kit.cone(arm.bm, s, e, 0.095, 0.075, 10)
        kit.sphere(arm.bm, e, (0.072, 0.072, 0.072), 8, 6)
        kit.cone(arm.bm, e, w + (w - e).normalized() * 0.01, 0.085, 0.065, 10)
        # Coarse hair on the forearm, and moss on the shoulder.
        tufts(arm, e.lerp(w, 0.4), (0.08, 0.08, 0.07), 10, 0.04, 5, lambda d, sign=sign: d.x * sign > 0.2)
        moss_patch(arm, s + Vector((0.05 * sign, 0.0, 0.08)), (0.5 * sign, 0, 1), 0.045)
        parts.append(arm)

        hand = Part(f"hand.{side}", skin_color, f"hand.{side}", shade=0.15)
        down = (t - w).normalized()
        fist = w + down * 0.05
        kit.sphere(hand.bm, fist, (0.065, 0.06, 0.06), 9, 6)
        # Four thick knuckles at the front of the fist, with dark nails.
        for spread in (-1.5, -0.5, 0.5, 1.5):
            knuckle = fist + Vector((spread * 0.025, -0.045, -0.035 if side == "L" else -0.01))
            kit.sphere(hand.bm, knuckle, (0.017, 0.02, 0.02), 6, 4)
            nail = kit.sphere(hand.bm, knuckle + Vector((0, -0.012, -0.012)), (0.009, 0.006, 0.008), 4, 3)
            hand.paint(faces_of(nail), NAIL)
        thumb = fist + Vector((-0.045 * sign, -0.03, 0.0))
        kit.cone(hand.bm, fist, thumb, 0.022, 0.016, 6)
        parts.append(hand)

    # The cut on the right arm (Regenerate): a red gash with dark edges.
    cut = Part("wound", WOUND, "wound", smooth=False, shade=0.05)
    along = (ER - SR).normalized()
    for offset, color, width in ((0.0, WOUND, 0.012), (0.014, WOUND_DARK, 0.006), (-0.014, WOUND_DARK, 0.006)):
        center = CUT + Vector((0, offset, 0))
        kit.slab(cut.bm, center, along * 0.065, Vector((0, 1, 0)) * width, Vector((-1, 0, 0)) * 0.01)
    cut.color = lambda face, center: WOUND if abs(center.y - CUT.y) < 0.008 else WOUND_DARK
    parts.append(cut)

    # The broken stalactite: a long tapered stone with ridges, narrow in the
    # fist and thick at the broken end.
    club = Part("club", STALACTITE, "club", smooth=False, shade=0.2)
    axis = (CLUB_END - GRIP).normalized()
    start = GRIP - axis * 0.06
    verts = kit.cone(club.bm, start, CLUB_END, 0.026, 0.085, 7)
    for face in faces_of(verts):
        if (face.calc_center_median() - CLUB_END).length < 0.02:
            club.paint([face], STALACTITE_DARK)
    for index, along_t in enumerate((0.3, 0.55, 0.8)):
        ridge_c = start.lerp(CLUB_END, along_t)
        radius = lerp(0.026, 0.085, along_t)
        ridge = kit.torus(club.bm, ridge_c, axis, radius * 0.95, 0.012, 7, 3)
        club.paint(faces_of(ridge), STALACTITE_DARK if index % 2 else STALACTITE)
    # The jagged broken end.
    side_a = axis.cross(Z).normalized()
    side_b = axis.cross(side_a).normalized()
    for step in range(5):
        angle = 2 * math.pi * step / 5
        base = CLUB_END + (side_a * math.cos(angle) + side_b * math.sin(angle)) * 0.05
        shard = kit.cone(club.bm, base - axis * 0.02, base + axis * (0.03 + 0.02 * (step % 2)), 0.022, 0.002, 4)
        club.paint(faces_of(shard), STALACTITE_DARK)
    parts.append(club)
    return parts


def leg_parts():
    parts = []
    for side, sign in (("L", 1), ("R", -1)):
        hip = Vector((LEG_X * sign, 0.02, HIP_Z))
        knee = Vector((LEG_X * sign, -0.03, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0.02, ANKLE_Z))
        leg = Part(f"leg.{side}", skin_color, leg_weights(side), shade=0.2)
        kit.cone(leg.bm, hip + Vector((0, 0, 0.04)), knee, 0.105, 0.08, 10)
        kit.sphere(leg.bm, knee, (0.075, 0.075, 0.075), 8, 6)
        kit.cone(leg.bm, knee, ankle + Vector((0, 0, 0.01)), 0.075, 0.065, 10)
        parts.append(leg)

        foot = Part(f"foot.{side}", SKIN_SHADE, f"foot.{side}", shade=0.1)
        kit.sphere(foot.bm, (LEG_X * sign, -0.04, 0.035), (0.065, 0.1, 0.04), 10, 6)
        for spread in (-1, 0, 1):
            base = Vector((LEG_X * sign + spread * 0.03, -0.13, 0.03))
            kit.sphere(foot.bm, base, (0.016, 0.02, 0.018), 6, 4)
            nail = kit.sphere(foot.bm, base + Vector((0, -0.016, 0.004)), (0.009, 0.006, 0.007), 4, 3)
            foot.paint(faces_of(nail), NAIL)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("CaveTroll", BONES)
    parts = body_parts() + head_parts() + arm_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "CaveTrollMesh")
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

    def arms(left=(0, 0, 0), right=(0, 0, 0), elbows=(0, 0), hands=(0, 0)):
        """
        The arms: `left` and `right` are (out, forward, twist) for the upper
        arm in degrees, `elbows` bend each forearm forward and `hands` curl
        each hand.
        """
        result = {}
        for side, sign, (out, forward, twist), elbow, hand in (("L", 1, left, elbows[0], hands[0]), ("R", -1, right, elbows[1], hands[1])):
            result[f"upperarm.{side}"] = t(f"upperarm.{side}", (Z, twist * sign), (X, -forward), (Y, -out * sign))
            result[f"forearm.{side}"] = t(f"forearm.{side}", (X, -elbow))
            result[f"hand.{side}"] = t(f"hand.{side}", (X, -hand))
        return result

    def legs(left=(0, 0, 0), right=(0, 0, 0)):
        """Leg swings: (thigh, shin, foot) in degrees about X. A negative thigh swings forward."""
        result = {}
        for side, (thigh, shin, foot) in (("L", left), ("R", right)):
            result[f"thigh.{side}"] = t(f"thigh.{side}", (X, thigh))
            result[f"shin.{side}"] = t(f"shin.{side}", (X, shin))
            result[f"foot.{side}"] = t(f"foot.{side}", (X, foot))
        return result

    def flat(thigh, shin, toe=0.0):
        """A leg with the sole flat on the ground, or the toe `toe` degrees down."""
        return (thigh, shin, toe - thigh - shin)

    def stand(breath=0.0, sway=0.0, chew=0.0):
        """
        The idle stance: hunched, the knees bent, turned a little to its
        right, the left fist on its knuckles and the stalactite low in the
        right fist. It chews on the shield.
        """
        return {
            "hips@loc": at("hips", (0, 0, -0.015 - breath * 0.005)),
            "hips": t("hips", (Z, -14), (Y, sway * 2)),
            "spine": t("spine", (X, 6 - breath * 2)),
            "chest": t("chest", (X, 2 - breath * 3), (Z, sway * 3)),
            "neck": t("neck", (X, -6), (Z, 4)),
            "head": t("head", (X, -2 + breath * 2), (Z, -6 + sway * 8)),
            "jaw": t("jaw", (X, 4 + 10 * chew)),
            **arms((6, 6 + breath * 2, 0), (8, 4, 0), (4, 6), (-6, 0)),
            **legs(flat(-16, 26), flat(-6, 20)),
        }

    def slump(breath=0.0):
        """Low HP: bent low on both fists, it pants with the shield hanging from its jaw."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.035 - breath * 0.006)),
            spine=t("spine", (X, 16 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 3), (Y, -6)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -4 + breath * 4), (Z, 4), (Y, -8)),
            jaw=t("jaw", (X, 14 + breath * 8)),
            **arms((4, 14, 0), (6, 10, 0), (26, 36), (-20, -6)),
            **legs(flat(-34, 46), flat(-24, 40)),
        )

    def stride(phase):
        """
        The Heavy knuckle walk: slow, heavy steps; the left fist plants like a
        third foot, and the stalactite drags in the right fist. `phase` 0 has
        the left foot forward, 0.5 the right.
        """
        swing = math.cos(phase * 2 * math.pi)
        lift_l = max(0.0, -math.sin(phase * 2 * math.pi))
        lift_r = max(0.0, math.sin(phase * 2 * math.pi))
        bob = abs(math.sin(phase * 2 * math.pi))
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, -0.03 + 0.015 * bob)),
            hips=t("hips", (Z, -10 + 6 * swing), (Y, 4 * swing)),
            spine=t("spine", (X, 14)),
            chest=t("chest", (X, 6), (Z, -6 * swing), (Y, -4 * swing)),
            neck=t("neck", (X, -12)),
            head=t("head", (X, 0), (Z, 2 * swing)),
            jaw=t("jaw", (X, 6)),
            **arms((6, 14 - 24 * swing, 0), (8, 10 + 10 * swing, 0), (6, 8), (-10 + 10 * swing, 0)),
            **legs(flat(-24 * swing - 10, 22 + 40 * lift_l, 8 * lift_l), flat(24 * swing - 10, 22 + 40 * lift_r, 8 * lift_r)),
        )

    def recoil(base, amount=1.0):
        """A hit knocks the chest and the head back."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, -0.012 - 0.004 * amount)),
            spine=t("spine", (X, 6 - 14 * amount)),
            chest=t("chest", (X, 2 - 12 * amount), (Z, 10 * amount)),
            head=t("head", (X, -2 - 20 * amount), (Z, 12 * amount)),
            jaw=t("jaw", (X, 4 + 16 * amount)),
            **arms((6 + 26 * amount, 6 - 16 * amount, 0), (8 + 24 * amount, 4 - 10 * amount, 0), (4, 6 + 20 * amount), (-6, 0)),
        )

    def stagger(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.05)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, -10)),
            chest=t("chest", (X, -10), (Y, 8)),
            head=t("head", (X, -24), (Z, 10)),
            jaw=t("jaw", (X, 26)),
            **arms((50, -10, 0), (56, -24, 0), (30, 30), (10, 10)),
            **legs(flat(-34, 40), flat(6, 30)),
        )

    def fallen(base, bounce=0.0):
        """Flat on its back, the long arms out wide, the stalactite still in its fist."""
        return pose(
            base,
            root=t("root", (X, -84 + bounce)),
            root_at_loc=at("root", (0, -0.34, 0.2)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 4)),
            head=t("head", (X, -10), (Z, -34)),
            jaw=t("jaw", (X, 24)),
            **arms((80, 4, 0), (76, -6, 0), (20, 10), (20, 20)),
            **legs((-36, 30, 0), (-20, 16, 0)),
            club=t("club", (X, CLUB_FALLEN)),
        )

    def crouch(base):
        """Down low on the fists, as a summon starts."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.08)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, -18)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, 0)),
            **arms((4, -12, 0), (6, -14, 0), (64, 64), (-20, -10)),
            **legs((-60, 90, -30), (-50, 90, -40)),
        )

    def roar(base):
        """Up tall with the stalactite raised and the jaw open: the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.005)),
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -12)),
            neck=t("neck", (X, -6)),
            head=t("head", (X, -16), (Z, -6)),
            jaw=t("jaw", (X, 30)),
            **arms((50, 10, 0), (30, 130, 0), (40, 40), (20, 0)),
        )

    # The attack: the stalactite goes up over its head, then it lunges and
    # swings it down. The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the stalactite comes down at frame 15 of 30.
    def wind_up(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.05, 0.0)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -10), (Z, -10)),
            neck=t("neck", (X, -4)),
            head=t("head", (X, -10)),
            jaw=t("jaw", (X, 24)),
            **arms((10, 14, 0), (24, 160, 0), (20, 50), (-10, 30)),
            **legs(flat(-10, 20), flat(4, 20, -10)),
        )

    def smash(base, follow=0.0):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.14 - 0.02 * follow, -0.06)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 16 + 4 * follow), (Z, 10)),
            neck=t("neck", (X, -18)),
            head=t("head", (X, -8)),
            jaw=t("jaw", (X, 20)),
            **arms((8, 8, 0), (12, 64 + 4 * follow, 0), (60, 10), (-10, HAND_SMASH)),
            club=t("club", (X, CLUB_SMASH)),
            **legs(flat(-50, 46), flat(24, 26, 10)),
        )

    def mend(base, amount=1.0):
        """Regenerate: it looks down at the cut on its right arm and flexes; the cut closes."""
        return pose(
            base,
            chest=t("chest", (X, 2), (Z, -10 * amount)),
            neck=t("neck", (X, 4 * amount), (Z, -10 * amount)),
            head=t("head", (X, 16 * amount), (Z, -30 * amount)),
            jaw=t("jaw", (X, 4 + 6 * amount)),
            **arms((6, 6, 0), (8 + 30 * amount, 30 * amount, -20 * amount), (4, 6 + 70 * amount), (-6, 20 * amount)),
        )

    def thump(base):
        """It beats its chest with the left fist and grunts: healed."""
        return pose(
            base,
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -8)),
            head=t("head", (X, -14)),
            jaw=t("jaw", (X, 28)),
            **arms((10, 50, -40), (20, 20, 0), (110, 10), (0, 0)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, sway, chew in ((0, 0, 0, 0), (6, 0.25, 0.5, 1), (12, 0.5, 1, 0), (18, 0.75, 0.5, 1), (24, 1, 0, 0), (36, 0.5, -1, 0), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, sway, chew))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low_hp.key(frame, slump(breath))
    clips.append(low_hp)

    walk = Clip("walk", 32, loop=True)
    for frame in (0, 8, 16, 24, 32):
        walk.key(frame, stride(frame / 32))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, wind_up(stand())).key(12, wind_up(stand()))
    attack.key(15, smash(stand())).key(19, smash(stand(), 1)).key(26, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 30)
    cast.key(0, stand()).key(7, mend(stand()))
    cast.key(16, pose(mend(stand()), wound_at_scale=0.05)).key(22, pose(thump(stand()), wound_at_scale=0.05))
    cast.key(26, pose(thump(stand()), wound_at_scale=0.3)).key(30, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(13, stagger(stand()))
    death.key(25, fallen(stand())).key(29, fallen(stand(), 5)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, crouch(stand())).key(8, crouch(stand())).key(15, roar(stand())).key(19, roar(stand()))
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
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "cave-troll.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
