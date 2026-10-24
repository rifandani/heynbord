"""
Rocket Barrel Rider (`goblin.rocketBarrelRider`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a young pale goblin woman with
wild white hair, very large ears, a big grin and her eyes shut tight, a
leather cap with brass goggles and a long red scarf that streams back. A
brown leather jacket, gloves, brown trousers and boots. She rides a red
powder barrel with iron bands and a white star on its front, with a rocket
on the back that blows a long flame. A rope goes round the barrel, and a
brass canteen hangs from it. Run it in Blender (see `unit_model_kit.py`). It
writes `apps/web/art/units/raw/rocket-barrel-rider.glb`; then
`bun unit-model:pack rocket-barrel-rider` packs it for the game.

The barrel flies low and forward, and she holds on with both hands. The
`barrel` bone carries the barrel and the rocket, and the `flame` bone
scales the flame: it flickers at rest and roars in the walk. The rider is
not a child of the barrel, so the barrel can blow up under her: the clips
move the `hips` with the barrel. She has Swift, so her walk is a fast,
bumpy flight. Her attack rams the barrel nose first into the target. Her
death is her Last Breath: the barrel blows up (a fireball that is small
inside the barrel at rest scales up, and the `barrel` bone scales down to
almost 0), and she is thrown off onto her back. She has no Keyword that she
uses by her own action, so she has no cast clip.
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

SKIN = hex_color("#c4bfb4")
EAR = hex_color("#e8a08a")
CHEEK = hex_color("#dca898")
HAIR = hex_color("#f0eadc")
HAIR_DARK = hex_color("#d4ccb8")
SHUT = hex_color("#2a1a14")
MOUTH = hex_color("#5a2422")
TEETH = hex_color("#f4eedc")
CAP = hex_color("#7a5236")
CAP_DARK = hex_color("#55382a")
BRASS = hex_color("#d0a048")
BRASS_DARK = hex_color("#93692a")
LENS = hex_color("#c8a048")
SCARF = hex_color("#b8322a")
SCARF_DARK = hex_color("#86221c")
JACKET = hex_color("#6e4a30")
JACKET_DARK = hex_color("#4e3220")
SHIRT = hex_color("#d8ccb0")
GLOVE = hex_color("#7a4a2a")
TROUSERS = hex_color("#5a4434")
BOOT = hex_color("#5e3a22")
BARREL = hex_color("#b2402c")
BARREL_DARK = hex_color("#923424")
STAR = hex_color("#f0e4cc")
IRON = hex_color("#4a4440")
IRON_DARK = hex_color("#2e2a28")
RIVET = hex_color("#8a8278")
ROPE = hex_color("#c8a46a")
FLAME_OUT = hex_color("#ff6a1c")
FLAME_MID = hex_color("#ffa830")
FLAME_CORE = hex_color("#fff2b0")
BLAST = hex_color("#ffb838")
BLAST_DARK = hex_color("#e05418")
SMOKE = hex_color("#6a6058")

# --- Proportions ---------------------------------------------------------------

# The barrel lies along the Lane, with its front to the front (-Y).
BARREL_C = Vector((0, 0.02, 0.16))
BARREL_R = 0.11
BARREL_HALF = 0.155
NOZZLE = Vector((0, BARREL_C.y + BARREL_HALF + 0.1, BARREL_C.z))

# She sits astride the barrel, leans forward and holds the rope at the front.
HIP = Vector((0, 0.05, 0.3))
HEAD_C = Vector((0, -0.075, 0.575))
SHOULDER_Z = 0.45
SL = Vector((0.078, -0.02, SHOULDER_Z))
EL = Vector((0.118, -0.075, 0.37))
WL = Vector((0.062, -0.13, 0.3))
TL = WL + (WL - EL).normalized() * 0.03
SR = Vector((-SL.x, SL.y, SL.z))
ER = Vector((-EL.x, EL.y, EL.z))
WR = Vector((-WL.x, WL.y, WL.z))
TR = WR + (WR - ER).normalized() * 0.03
KNEE = Vector((0.098, -0.06, 0.26))
ANKLE = Vector((0.13, -0.035, 0.15))
TOE = Vector((0.135, -0.1, 0.135))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("barrel", tuple(BARREL_C), tuple(BARREL_C + Z * 0.1), "root"),
    ("flame", tuple(NOZZLE), tuple(NOZZLE + Y * 0.1), "barrel"),
    # The fireball of the Last Breath: small inside the barrel at rest.
    ("blast", tuple(BARREL_C), tuple(BARREL_C + Z * 0.05), "root"),
    ("hips", tuple(HIP), (0, 0.03, 0.36), "root"),
    ("spine", (0, 0.03, 0.36), (0, 0.0, 0.415), "hips"),
    ("chest", (0, 0.0, 0.415), (0, -0.035, 0.47), "spine"),
    ("neck", (0, -0.035, 0.47), (0, -0.05, 0.5), "chest"),
    ("head", (0, -0.05, 0.5), (0, -0.07, 0.66), "neck"),
    ("scarf", (0, -0.01, 0.48), (0, 0.15, 0.5), "chest"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    mirror = Vector((sign, 1, 1))
    hip = Vector((0.045 * sign, HIP.y, 0.29))
    knee = KNEE * mirror
    ankle = ANKLE * mirror
    toe = TOE * mirror
    BONES += [
        (f"shoulder.{side}", (0.02 * sign, -0.02, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", tuple(hip), tuple(knee), "hips"),
        (f"shin.{side}", tuple(knee), tuple(ankle), f"thigh.{side}"),
        (f"foot.{side}", tuple(ankle), tuple(toe), f"shin.{side}"),
    ]

# --- Weights -------------------------------------------------------------------


def torso_weights(co):
    if co.z < 0.36:
        return blend("hips", "spine", co.z, 0.33, 0.39)
    return blend("spine", "chest", co.z, 0.4, 0.45)


def scarf_weights(co):
    return blend("chest", "scarf", co.y, 0.02, 0.08)


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    head = Part("head", SKIN, "head", shade=0.1)
    kit.sphere(head.bm, HEAD_C, (0.07, 0.068, 0.07), 14, 10)
    for sign in (1, -1):
        cheek = kit.sphere(head.bm, HEAD_C + Vector((0.036 * sign, -0.044, -0.026)), (0.026, 0.022, 0.022), 8, 6)
        head.paint(faces_of(cheek), CHEEK)
    kit.sphere(head.bm, HEAD_C + Vector((0, -0.026, -0.048)), (0.042, 0.034, 0.03), 10, 6)
    nose = kit.sphere(head.bm, HEAD_C + Vector((0, -0.074, -0.006)), (0.015, 0.02, 0.016), 8, 6)
    head.paint(faces_of(nose), CHEEK)
    for sign in (1, -1):
        # Very large goblin ears, blown back by the wind.
        ear = kit.cone(head.bm, HEAD_C + Vector((0.062 * sign, 0.016, 0.006)), HEAD_C + Vector((0.17 * sign, 0.13, 0.04)), 0.04, 0.003, 7, squash=0.3)
        for face in faces_of(ear):
            if face.normal.y < 0.2 and face.normal.x * sign < 0.6:
                head.paint([face], EAR)
    parts.append(head)

    face = Part("face", MOUTH, "head", shade=0)
    # A big grin with clenched teeth.
    mouth_c = HEAD_C + Vector((0, -0.058, -0.034))
    kit.sphere(face.bm, mouth_c, (0.034, 0.012, 0.013), 10, 6)
    teeth = kit.box(face.bm, mouth_c + Vector((0, -0.008, 0)), (0.05, 0.008, 0.014))
    face.paint(faces_of(teeth), TEETH)
    # The eyes are shut tight: two arcs.
    for sign in (1, -1):
        eye = HEAD_C + Vector((0.03 * sign, -0.06, 0.014))
        shut = kit.tube(face.bm, [eye + Vector((0.014 * sign, 0.002, 0.004)), eye + Vector((0, -0.004, -0.004)), eye + Vector((-0.014 * sign, 0.002, 0.002))], [0.0035, 0.004, 0.0035], 4)
        face.paint(faces_of(shut), SHUT)
    parts.append(face)

    hair = Part("hair", HAIR, "head", shade=0.06)
    # Wild white hair blown back from under the cap.
    for index in range(9):
        a = math.radians(-100 + index * 25)
        root = HEAD_C + Vector((0.06 * math.sin(a), 0.03 + 0.03 * math.cos(a), 0.01))
        tip = root + Vector((0.035 * math.sin(a), 0.08 + 0.01 * (index % 3), -0.01 + 0.012 * (index % 2)))
        tuft = kit.cone(hair.bm, root, tip, 0.026, 0.005, 5)
        if index % 2:
            hair.paint(faces_of(tuft), HAIR_DARK)
    parts.append(hair)

    # A leather cap with ear flaps, and brass goggles up on the front.
    cap = Part("cap", CAP, "head", shade=0.06)
    kit.sphere(cap.bm, HEAD_C + Vector((0, 0.006, 0.026)), (0.076, 0.074, 0.06), 12, 8)
    seam = kit.torus(cap.bm, HEAD_C + Vector((0, 0.006, 0.026)), (1, 0, 0), 0.074, 0.004, 14, 3)
    cap.paint(faces_of(seam), CAP_DARK)
    for sign in (1, -1):
        center = HEAD_C + Vector((0.03 * sign, -0.064, 0.064))
        out = Vector((0.15 * sign, -1, 0.45)).normalized()
        goggle = kit.cone(cap.bm, center - out * 0.006, center + out * 0.022, 0.023, 0.021, 10)
        cap.paint(faces_of(goggle), BRASS)
        rim = kit.torus(cap.bm, center + out * 0.022, out, 0.02, 0.005, 10, 3)
        cap.paint(faces_of(rim), BRASS_DARK)
        lens = kit.cone(cap.bm, center + out * 0.02, center + out * 0.024, 0.017, 0.017, 10)
        cap.paint(faces_of(lens), LENS)
    band = kit.torus(cap.bm, HEAD_C + Vector((0, 0.006, 0.04)), (0, 0.2, 1), 0.075, 0.006, 16, 4)
    cap.paint(faces_of(band), CAP_DARK)
    parts.append(cap)

    neck = Part("neck", SKIN, "neck")
    kit.cone(neck.bm, (0, -0.03, 0.46), (0, -0.055, 0.53), 0.024, 0.022, 8)
    parts.append(neck)
    return parts


def body_parts():
    parts = []
    jacket = Part("jacket", JACKET, torso_weights)
    kit.tube(jacket.bm, [(0, 0.05, 0.29), (0, 0.035, 0.35), (0, 0.005, 0.41), (0, -0.03, 0.465)], [0.066, 0.064, 0.068, 0.06], 12)
    for z, y in ((0.36, -0.03), (0.41, -0.06)):
        buckle = kit.box(jacket.bm, (0, y, z), (0.02, 0.01, 0.016))
        jacket.paint(faces_of(buckle), BRASS)
    belt = kit.torus(jacket.bm, (0, 0.045, 0.305), (0, -0.25, 1), 0.066, 0.008, 12, 4)
    jacket.paint(faces_of(belt), JACKET_DARK)
    parts.append(jacket)

    # The red scarf: round the neck, with two long tails that stream back.
    scarf = Part("scarf", SCARF, scarf_weights, shade=0.08)
    kit.torus(scarf.bm, (0, -0.032, 0.475), (0, 0.4, 1), 0.044, 0.015, 12, 5)
    for x, z, length in ((0.015, 0.0, 0.26), (-0.02, -0.03, 0.2)):
        points = [Vector((x, 0.0, 0.48 + z))]
        for step in range(1, 5):
            v = step / 4
            points.append(Vector((x + 0.02 * math.sin(v * 5), length * v, 0.48 + z + 0.04 * v + 0.02 * math.sin(v * 7))))
        tail = kit.tube(scarf.bm, points, [0.018, 0.017, 0.015, 0.012, 0.006], 4)
        scarf.paint(faces_of(tail), SCARF if x > 0 else SCARF_DARK)
    parts.append(scarf)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w) in (("L", 1, (SL, EL, WL)), ("R", -1, (SR, ER, WR))):
        mirror = Vector((sign, 1, 1))
        d = (w - e).normalized()
        sleeve = Part(f"sleeve.{side}", JACKET, f"upperarm.{side}")
        kit.cone(sleeve.bm, s, e, 0.024, 0.02, 8)
        parts.append(sleeve)

        forearm = Part(f"forearm.{side}", SHIRT, f"forearm.{side}")
        kit.cone(forearm.bm, e, w, 0.018, 0.015, 8)
        glove = kit.cone(forearm.bm, e + (w - e) * 0.55, w - d * 0.004, 0.022, 0.02, 8)
        forearm.paint(faces_of(glove), GLOVE)
        parts.append(forearm)

        hand = Part(f"hand.{side}", GLOVE, f"hand.{side}")
        kit.sphere(hand.bm, w + d * 0.014, (0.018, 0.017, 0.016), 8, 6)
        parts.append(hand)

        hip = Vector((0.045 * sign, HIP.y, 0.29))
        knee = KNEE * mirror
        ankle = ANKLE * mirror
        toe = TOE * mirror
        thigh = Part(f"thigh.{side}", TROUSERS, f"thigh.{side}")
        kit.cone(thigh.bm, hip, knee, 0.036, 0.03, 8)
        parts.append(thigh)

        shin = Part(f"shin.{side}", BOOT, f"shin.{side}")
        kit.cone(shin.bm, knee, ankle, 0.029, 0.024, 8)
        cuff = kit.torus(shin.bm, knee.lerp(ankle, 0.25), (ankle - knee), 0.029, 0.006, 8, 3)
        shin.paint(faces_of(cuff), CAP_DARK)
        parts.append(shin)

        foot = Part(f"foot.{side}", BOOT, f"foot.{side}", shade=0.05)
        kit.sphere(foot.bm, ankle.lerp(toe, 0.55), (0.024, 0.05, 0.02), 8, 6)
        parts.append(foot)
    return parts


def barrel_parts():
    barrel = Part("barrel", BARREL, "barrel", shade=0.12)
    c = BARREL_C
    ys = [-1, -0.6, 0, 0.6, 1]
    radii = [BARREL_R * 0.86, BARREL_R * 0.96, BARREL_R, BARREL_R * 0.96, BARREL_R * 0.86]
    verts = kit.tube(barrel.bm, [c + Vector((0, BARREL_HALF * y, 0)) for y in ys], radii, 16)
    # Darker staves.
    for face in faces_of(verts):
        rel = face.calc_center_median() - c
        angle = math.atan2(rel.z, rel.x)
        if abs(rel.y) < BARREL_HALF * 0.98 and int((angle + math.pi) / (2 * math.pi) * 16) % 2:
            barrel.paint([face], BARREL_DARK)
    for y in (-0.82, -0.4, 0.4, 0.82):
        r = BARREL_R * (1 - 0.14 * abs(y) ** 1.5) + 0.005
        band = kit.torus(barrel.bm, c + Vector((0, BARREL_HALF * y, 0)), (0, 1, 0), r, 0.006, 16, 4)
        barrel.paint(faces_of(band), IRON)
    # The white star on the front.
    front = c + Vector((0, -BARREL_HALF - 0.002, 0))
    disc = kit.cone(barrel.bm, front + Vector((0, 0.004, 0)), front - Vector((0, 0.002, 0)), BARREL_R * 0.8, BARREL_R * 0.8, 16)
    barrel.paint(faces_of(disc), BARREL)
    for index in range(8):
        a = math.pi * index / 4
        length = 0.06 if index % 2 == 0 else 0.04
        ray = kit.cone(barrel.bm, front - Vector((0, 0.003, 0)), front - Vector((0, 0.003, 0)) + Vector((math.cos(a), 0, math.sin(a))) * length, 0.016, 0.002, 4, squash=0.3)
        barrel.paint(faces_of(ray), STAR)
    hub = kit.sphere(barrel.bm, front - Vector((0, 0.004, 0)), (0.018, 0.006, 0.018), 8, 4)
    barrel.paint(faces_of(hub), STAR)
    # The rope round the barrel and the brass canteen on it, at the right.
    rope = kit.torus(barrel.bm, c + Vector((0, -0.07, 0)), (0, 1, 0), BARREL_R * 0.98 + 0.008, 0.006, 16, 4)
    barrel.paint(faces_of(rope), ROPE)
    can = c + Vector((-BARREL_R - 0.03, -0.02, -0.01))
    body = kit.cone(barrel.bm, can + Vector((0, 0, -0.03)), can + Vector((0, 0, 0.03)), 0.02, 0.02, 10)
    barrel.paint(faces_of(body), BRASS)
    cap = kit.cone(barrel.bm, can + Vector((0, 0, 0.03)), can + Vector((0, 0, 0.042)), 0.009, 0.008, 6)
    barrel.paint(faces_of(cap), BRASS_DARK)
    strap = kit.tube(barrel.bm, [can + Vector((0, 0, 0.03)), c + Vector((-BARREL_R * 0.9, -0.05, 0.05))], [0.004, 0.004], 4)
    barrel.paint(faces_of(strap), ROPE)

    # The rocket on the back: a flange, a big nozzle and two small tubes.
    back = c + Vector((0, BARREL_HALF, 0))
    flange = kit.cone(barrel.bm, back - Y * 0.004, back + Y * 0.012, 0.075, 0.075, 12)
    barrel.paint(faces_of(flange), IRON)
    for index in range(6):
        a = 2 * math.pi * index / 6
        rivet = kit.sphere(barrel.bm, back + Y * 0.013 + Vector((math.cos(a), 0, math.sin(a))) * 0.062, (0.006, 0.004, 0.006), 4, 3)
        barrel.paint(faces_of(rivet), RIVET)
    nozzle = kit.cone(barrel.bm, back + Y * 0.012, NOZZLE - Y * 0.02, 0.05, 0.036, 12)
    barrel.paint(faces_of(nozzle), IRON_DARK)
    bell = kit.cone(barrel.bm, NOZZLE - Y * 0.024, NOZZLE, 0.036, 0.048, 12, caps=False)
    barrel.paint(faces_of(bell), IRON)
    for sign in (1, -1):
        start = back + Vector((0.07 * sign, 0.0, 0.04))
        tube = kit.cone(barrel.bm, start, start + Y * 0.07, 0.016, 0.014, 8)
        barrel.paint(faces_of(tube), BRASS_DARK)
    return [barrel]


def flame_parts():
    flame = Part("flame", FLAME_OUT, "flame", shade=0)
    d = Y
    # A flame that swells out of the bell and then thins to a long tail.
    kit.tube(flame.bm, [NOZZLE - d * 0.005, NOZZLE + d * 0.06, NOZZLE + d * 0.16 + Vector((0, 0, -0.012)), NOZZLE + d * 0.28 + Vector((0, 0, -0.03))], [0.046, 0.062, 0.045, 0.006], 10)
    mid = kit.tube(flame.bm, [NOZZLE + d * 0.0, NOZZLE + d * 0.07, NOZZLE + d * 0.2 + Vector((0, 0, -0.018))], [0.038, 0.046, 0.006], 8)
    flame.paint(faces_of(mid), FLAME_MID)
    core = kit.cone(flame.bm, NOZZLE + d * 0.005, NOZZLE + d * 0.1, 0.03, 0.004, 8)
    flame.paint(faces_of(core), FLAME_CORE)
    for offset, size in (((0.03, 0.24, 0.02), 0.012), ((-0.025, 0.2, -0.03), 0.01), ((0.0, 0.3, -0.05), 0.009), ((-0.02, 0.32, 0.01), 0.007)):
        ember = kit.sphere(flame.bm, NOZZLE + Vector(offset), (size, size, size), 5, 4)
        flame.paint(faces_of(ember), FLAME_MID)
    return [flame]


def blast_parts():
    """The fireball of the Last Breath, small inside the barrel at rest."""
    blast = Part("blast", BLAST, "blast", shade=0)
    c = BARREL_C
    kit.sphere(blast.bm, c, (0.022, 0.022, 0.02), 10, 7)
    for index in range(8):
        a = 2 * math.pi * index / 8
        lump = c + Vector((math.cos(a) * 0.018, math.sin(a) * 0.018, 0.004 * (index % 3)))
        verts = kit.sphere(blast.bm, lump, (0.011, 0.011, 0.011), 6, 4)
        blast.paint(faces_of(verts), BLAST_DARK if index % 2 else BLAST)
    smoke = kit.sphere(blast.bm, c + Vector((0, 0.004, 0.02)), (0.014, 0.014, 0.012), 6, 4)
    blast.paint(faces_of(smoke), SMOKE)
    return [blast]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("RocketBarrelRider", BONES)
    parts = head_parts() + body_parts() + limb_parts() + barrel_parts() + flame_parts() + blast_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "RocketBarrelRiderMesh")
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

    def ride(base, offset, pitch=0.0, roll=0.0):
        """Moves the barrel and turns it, and the rider with it: she is not its child."""
        offset = Vector(offset)
        # The seat is above and behind the middle of the barrel, so a pitch moves it.
        seat = HIP - BARREL_C
        a = math.radians(pitch)
        seat_shift = Vector((0, seat.y * math.cos(a) - seat.z * math.sin(a) - seat.y, seat.y * math.sin(a) + seat.z * math.cos(a) - seat.z))
        return pose(
            base,
            barrel_at_loc=at("barrel", offset),
            barrel=t("barrel", (X, pitch), (Y, roll)),
            hips_at_loc=at("hips", offset + seat_shift),
            hips=t("hips", (X, pitch * 0.8), (Y, roll * 0.8)),
        )

    def stand(bob=0.0, flame=1.0, flap=0.0):
        """
        The rest pose in flight: the barrel bobs, the flame flickers and the
        scarf flaps. She grins with her eyes shut and holds on.
        """
        base = {
            "spine": t("spine", (X, 2)),
            "chest": t("chest", (X, 2 - bob * 2)),
            "neck": t("neck", (X, -8)),
            "head": t("head", (X, -6 + bob * 3), (Z, -6), (Y, flap * 3)),
            "scarf": t("scarf", (Z, flap * 12), (X, -flap * 6)),
            "flame@scale": flame,
        }
        return ride(base, (0, 0, 0.012 * bob), pitch=-2 * bob, roll=flap * 2)

    def slump(breath=0.0, flame=0.5):
        """Low HP: the barrel sputters low with its nose down, and she hangs on, tired."""
        base = pose(
            stand(flame=flame),
            spine=t("spine", (X, 12 + breath * 2)),
            chest=t("chest", (X, 10 + breath * 2)),
            neck=t("neck", (X, 4)),
            head=t("head", (X, 12 + breath * 4), (Z, -10), (Y, -10)),
            scarf=t("scarf", (X, 30), (Z, -10)),
        )
        return ride(base, (0, 0, -0.035 - breath * 0.004), pitch=8 + breath * 2, roll=-6)

    def recoil(base, amount=1.0):
        """A hit knocks the barrel back, and she leans back with it."""
        base = pose(
            base,
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -8 * amount)),
            head=t("head", (X, -20 * amount), (Z, 10 * amount)),
            scarf=t("scarf", (X, -20 * amount), (Z, 16 * amount)),
            flame_at_scale=0.6,
        )
        return ride(base, (0, 0.04 * amount, 0.01 * amount), pitch=-12 * amount, roll=8 * amount)

    def thrown(base, rise=1.0):
        """Thrown off the barrel by the blast: up and back, arms and legs out."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.1 * rise, 0.12 * rise)),
            hips=t("hips", (X, -50 * rise)),
            spine=t("spine", (X, -10)),
            head=t("head", (X, -20), (Z, 20)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, -40)),
            upperarm__L=t("upperarm.L", (X, -60), (Y, 40)),
            thigh__L=t("thigh.L", (X, 20), (Y, -10)),
            thigh__R=t("thigh.R", (X, 30), (Y, 10)),
            shin__L=t("shin.L", (X, -20)),
            shin__R=t("shin.R", (X, -30)),
            scarf=t("scarf", (X, 30)),
        )

    def landed(base, bounce=0.0):
        """Flat on her back on the ground, where the barrel was."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.06, -0.24)),
            hips=t("hips", (X, -84 + bounce)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 6)),
            head=t("head", (X, 10), (Z, -30)),
            upperarm__R=t("upperarm.R", (X, 30), (Y, -50)),
            upperarm__L=t("upperarm.L", (X, 30), (Y, 50)),
            forearm__R=t("forearm.R", (X, 20)),
            forearm__L=t("forearm.L", (X, 20)),
            thigh__L=t("thigh.L", (X, 50), (Y, -10)),
            thigh__R=t("thigh.R", (X, 40), (Y, 10)),
            shin__L=t("shin.L", (X, -40)),
            shin__R=t("shin.R", (X, -30)),
            scarf=t("scarf", (X, 70), (Z, 30)),
        )

    def crashed(base, bounce=0.0):
        """The barrel and the rider tip over onto their left side, the flame out: a Rebirth falls."""
        return pose(
            base,
            root=t("root", (Y, 84 - bounce)),
            # Her left boot sticks out under the barrel, so the barrel lies on it.
            root_at_loc=at("root", (-0.11, 0, BARREL_R + 0.03)),
            head=t("head", (X, 6), (Z, -20)),
            scarf=t("scarf", (X, 30)),
            flame_at_scale=0.02,
        )

    def grounded(base, flame=0.2):
        """The barrel on the ground with a small flame, as a summon starts and a Rebirth gets up."""
        base = pose(
            base,
            spine=t("spine", (X, 14)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 10), (Z, -6)),
            scarf=t("scarf", (X, 40)),
            flame_at_scale=flame,
        )
        return ride(base, (0, 0, -0.045), pitch=-6)

    def launch(base):
        """The rocket roars and the barrel jumps up, nose high: the end of a summon and a Rebirth."""
        base = pose(
            base,
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -6)),
            head=t("head", (X, -16), (Z, -8)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, -50)),
            forearm__R=t("forearm.R", (X, -30)),
            scarf=t("scarf", (X, -20), (Z, 10)),
            flame_at_scale=1.6,
        )
        return ride(base, (0, -0.02, 0.05), pitch=-16)

    def fly(phase, flame):
        """The fast, bumpy flight of Swift: the barrel bucks and the flame roars."""
        a = 2 * math.pi * phase
        base = pose(
            stand(flame=flame, flap=math.sin(a * 2)),
            spine=t("spine", (X, 10)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, -2 + 4 * math.sin(a)), (Z, -6)),
            scarf=t("scarf", (Z, 16 * math.sin(a * 2)), (X, -14)),
        )
        return ride(base, (0, 0, 0.02 + 0.016 * math.sin(a)), pitch=3 + 5 * math.cos(a), roll=4 * math.sin(a))

    # The attack: she rams the barrel nose first into the target. The slash
    # effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts), so the
    # barrel hits at frame 15 of 30.
    def back_up(base):
        base = pose(
            base,
            spine=t("spine", (X, -6)),
            head=t("head", (X, -10), (Z, -6)),
            scarf=t("scarf", (X, 10)),
            flame_at_scale=0.5,
        )
        return ride(base, (0, 0.05, 0.03), pitch=-14)

    def ram(base, squash=0.0):
        base = pose(
            base,
            spine=t("spine", (X, 18)),
            chest=t("chest", (X, 14)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -12 + squash * 14), (Z, -6)),
            scarf=t("scarf", (X, -30), (Z, -16)),
            flame_at_scale=1.8 - squash * 0.6,
        )
        return ride(base, (0, -0.13, -0.01), pitch=10 + squash * 6, roll=-4)

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, bob, flame, flap in ((0, 0, 1, 0), (6, 0.5, 0.75, 1), (12, 1, 1.15, 0), (18, 0.5, 0.8, -1), (24, 0, 1.1, 0), (30, -0.5, 0.75, 1), (36, -1, 1.15, 0), (42, -0.5, 0.8, -1), (48, 0, 1, 0)):
        idle.key(frame, stand(bob, flame, flap))
    clips.append(idle)

    low = Clip("lowHp", 48, loop=True)
    for frame, breath, flame in ((0, 0, 0.5), (8, 0.3, 0.15), (12, 0.5, 0.6), (24, 1, 0.3), (30, 0.8, 0.7), (36, 0.5, 0.1), (40, 0.3, 0.55), (48, 0, 0.5)):
        low.key(frame, slump(breath, flame))
    clips.append(low)

    walk = Clip("walk", 16, loop=True)
    for frame in range(0, 17, 4):
        walk.key(frame, fly(frame / 16, 1.5 + 0.25 * ((frame // 4) % 2)))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(8, back_up(stand())).key(13, ram(stand())).key(15, ram(stand(), 1.0))
    attack.key(19, ram(stand(), 0.6)).key(25, stand(flame=1.2)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    # The death is the Last Breath: the barrel shakes, blows up under her,
    # and she lands on her back where it was.
    gone = {"barrel@scale": 0.02, "blast@scale": 0.01}
    death = Clip("death", 36)
    death.key(0, stand()).key(4, recoil(stand()))
    death.key(7, pose(ride(stand(flame=1.8), (0, 0.01, 0.02), roll=8), blast_at_scale=1.0)).key(9, pose(ride(stand(flame=0.4), (0, 0.01, 0.02), roll=-8), blast_at_scale=1.0))
    death.key(10, pose(thrown(stand(), 0.2), barrel_at_scale=1.0, blast_at_scale=3.0))
    death.key(12, pose(thrown(stand(), 0.7), barrel_at_scale=0.02, blast_at_scale=8.0))
    death.key(17, pose(thrown(stand()), barrel_at_scale=0.02, blast_at_scale=9.5))
    death.key(23, pose(landed(stand()), **gone)).key(27, pose(landed(stand(), 6), **gone)).key(36, pose(landed(stand()), **gone))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then gets up.
    # The barrel tips over with no blast, and the rocket starts again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, recoil(stand())).key(18, crashed(stand())).key(21, crashed(stand(), 4))
    rebirth.key(30, grounded(stand())).key(40, launch(stand())).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, grounded(stand(), 0.05)).key(8, grounded(stand(), 0.5)).key(15, launch(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "rocket-barrel-rider.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
