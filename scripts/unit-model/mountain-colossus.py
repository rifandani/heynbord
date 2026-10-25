"""
Mountain Colossus (`feral.mountainColossus`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a hunched giant of grey-tan
boulders with moss on every top face, small pine trees on its back, a low
stone head with a moss beard, long arms and huge boulder fists. Run it in
Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/mountain-colossus.glb`; then
`bun unit-model:pack mountain-colossus` packs it for the game.

Each boulder is rigid and follows one bone, as a stone body does. It uses
Regenerate by its own action, so it has a cast clip: it opens its arms and
the stones pull in again. Its summon is the card flavor: the mountain stands up.
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

from unit_model_kit import X, Y, Z, Clip, Part, faces_of, hex_color, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

STONE = hex_color("#a89c86")
STONE_DARK = hex_color("#756b5a")
STONE_LIGHT = hex_color("#c9bc9f")
MOSS = hex_color("#6f7a35")
MOSS_LIGHT = hex_color("#8c9543")
PINE = hex_color("#2f4d2c")
PINE_LIGHT = hex_color("#45683a")
TRUNK = hex_color("#5a4030")
EYE = hex_color("#ffcf6a")
WATER = hex_color("#d8eef2")

# --- Proportions ---------------------------------------------------------------

# A hunched giant: short legs, a huge back and long arms with the fists low.
HIP_Z = 0.3
WAIST_Z = 0.42
CHEST_Z = 0.56
SHOULDER_Z = 0.7
NECK = Vector((0, -0.14, 0.72))
HEAD_C = Vector((0, -0.23, 0.77))
KNEE_Z = 0.16
ANKLE_Z = 0.05
LEG_X = 0.13

SL = Vector((0.27, -0.02, SHOULDER_Z))
EL = Vector((0.34, -0.06, 0.45))
WL = Vector((0.33, -0.1, 0.23))
TL = Vector((0.33, -0.11, 0.12))
SR, ER, WR, TR = (Vector((-p.x, p.y, p.z)) for p in (SL, EL, WL, TL))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("hips", (0, 0.02, HIP_Z), (0, 0.02, WAIST_Z), "root"),
    ("spine", (0, 0.02, WAIST_Z), (0, 0.02, CHEST_Z), "hips"),
    ("chest", (0, 0.02, CHEST_Z), (0, -0.04, SHOULDER_Z), "spine"),
    ("neck", (0, -0.04, SHOULDER_Z - 0.02), tuple(NECK), "chest"),
    ("head", tuple(NECK), (0, -0.28, 0.86), "neck"),
]
for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
    BONES += [
        (f"shoulder.{side}", (0.06 * sign, 0, SHOULDER_Z), tuple(s), "chest"),
        (f"upperarm.{side}", tuple(s), tuple(e), f"shoulder.{side}"),
        (f"forearm.{side}", tuple(e), tuple(w), f"upperarm.{side}"),
        (f"hand.{side}", tuple(w), tuple(t), f"forearm.{side}"),
        (f"thigh.{side}", (LEG_X * sign, 0.02, HIP_Z), (LEG_X * sign, 0.0, KNEE_Z), "hips"),
        (f"shin.{side}", (LEG_X * sign, 0.0, KNEE_Z), (LEG_X * sign, 0.0, ANKLE_Z), f"thigh.{side}"),
        (f"foot.{side}", (LEG_X * sign, 0.0, ANKLE_Z), (LEG_X * sign, -0.1, 0.02), f"shin.{side}"),
    ]

# --- Parts ---------------------------------------------------------------------


def stone_color(face, center):
    """Moss on the top faces, and a lighter or darker stone on the others."""
    if face.normal.z > 0.72:
        return MOSS_LIGHT if face.normal.z > 0.92 else MOSS
    tone = int(abs(center.x * 31 + center.y * 17 + center.z * 23) * 10) % 4
    if face.normal.z < -0.4 or tone == 0:
        return STONE_DARK
    return STONE_LIGHT if tone == 3 else STONE


def rock(part, center, radii, seed, segments=8, rings=6, rough=0.22):
    """A boulder: a low sphere with its points pushed in and out."""
    center = Vector(center)
    verts = kit.sphere(part.bm, center, radii, segments, rings)
    for index, vert in enumerate(verts):
        n = ((index * 7 + seed * 13) % 11) / 10
        vert.co = center + (vert.co - center) * (1 - rough / 2 + rough * n)
    return verts


def stone(name, bone):
    return Part(name, stone_color, bone, smooth=False, shade=0.2)


def pine(part, base, height, lean=(0, 0, 1)):
    """A small pine tree: a trunk and three stacked cones."""
    base = Vector(base)
    up = Vector(lean).normalized()
    trunk = kit.cone(part.bm, base - up * 0.01, base + up * height * 0.3, 0.012, 0.008, 5)
    part.paint(faces_of(trunk), TRUNK)
    for level, (low, high, radius) in enumerate(((0.2, 0.6, 0.06), (0.45, 0.82, 0.045), (0.68, 1.0, 0.03))):
        layer = kit.cone(part.bm, base + up * height * low, base + up * height * high, radius, 0.002, 7)
        part.paint(faces_of(layer), PINE_LIGHT if level == 1 else PINE)


def body_parts():
    parts = []
    hips = stone("hips", "hips")
    rock(hips, (0, 0.03, 0.34), (0.19, 0.15, 0.1), 1)
    parts.append(hips)

    belly = stone("belly", "spine")
    rock(belly, (0, -0.01, 0.47), (0.2, 0.16, 0.11), 2)
    parts.append(belly)

    # The huge back and shoulders, with the boulders of the hump on top.
    chest = stone("chest", "chest")
    rock(chest, (0, 0.03, 0.62), (0.27, 0.2, 0.15), 3, 10, 7)
    rock(chest, (0, 0.07, 0.75), (0.2, 0.16, 0.1), 4)
    rock(chest, (0.12, 0.1, 0.84), (0.09, 0.08, 0.07), 5)
    rock(chest, (-0.1, 0.12, 0.82), (0.08, 0.08, 0.06), 6)
    rock(chest, (0, -0.1, 0.6), (0.17, 0.08, 0.12), 7)
    # A thin stream of water runs down the right side of the back.
    for index, z in enumerate((0.78, 0.71, 0.64, 0.57)):
        drop = kit.cone(chest.bm, (-0.18 - index * 0.012, 0.15, z + 0.04), (-0.19 - index * 0.012, 0.17, z - 0.03), 0.012, 0.016, 5)
        chest.paint(faces_of(drop), WATER)
    parts.append(chest)

    trees = Part("trees", PINE, "chest", smooth=False, shade=0.25)
    pine(trees, (0.12, 0.1, 0.89), 0.17, (0.15, 0.1, 1))
    pine(trees, (-0.1, 0.12, 0.86), 0.13, (-0.2, 0.15, 1))
    pine(trees, (0.0, 0.16, 0.82), 0.1, (0, 0.4, 1))
    pine(trees, (0.24, 0.0, 0.78), 0.09, (0.5, 0, 1))
    parts.append(trees)
    return parts


def head_parts():
    parts = []
    head = stone("head", "head")
    rock(head, HEAD_C, (0.09, 0.085, 0.085), 8)
    # The neck stones that join the head to the hump.
    rock(head, (NECK + HEAD_C) / 2 + Vector((0, 0.03, 0)), (0.08, 0.07, 0.07), 11)
    # The heavy brow over the eyes, and the jaw under them.
    rock(head, HEAD_C + Vector((0, -0.05, 0.035)), (0.08, 0.035, 0.03), 9, 8, 4, 0.15)
    rock(head, HEAD_C + Vector((0, -0.035, -0.06)), (0.06, 0.05, 0.035), 10, 8, 4, 0.15)
    parts.append(head)

    beard = Part("beard", MOSS, "head", smooth=False, shade=0.2)
    kit.cone(beard.bm, HEAD_C + Vector((0, -0.06, -0.06)), HEAD_C + Vector((0, -0.08, -0.17)), 0.05, 0.008, 6, squash=0.6)
    for sign in (1, -1):
        strand = kit.cone(beard.bm, HEAD_C + Vector((0.035 * sign, -0.06, -0.05)), HEAD_C + Vector((0.04 * sign, -0.07, -0.14)), 0.025, 0.005, 5, squash=0.6)
        beard.paint(faces_of(strand), MOSS_LIGHT)
    parts.append(beard)

    eyes = Part("eyes", EYE, "head", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, HEAD_C + Vector((0.032 * sign, -0.074, 0.008)), (0.014, 0.008, 0.009), 6, 4)
    parts.append(eyes)
    return parts


def limb_parts():
    parts = []
    for side, sign, (s, e, w, t) in (("L", 1, (SL, EL, WL, TL)), ("R", -1, (SR, ER, WR, TR))):
        seed = 20 if sign == 1 else 40
        shoulder = stone(f"shoulder.{side}", f"upperarm.{side}")
        rock(shoulder, s + Vector((0.02 * sign, 0.01, 0.03)), (0.12, 0.12, 0.1), seed)
        parts.append(shoulder)

        upper = stone(f"upperarm.{side}", f"upperarm.{side}")
        rock(upper, (s + e) / 2 + Vector((0.01 * sign, 0, -0.02)), (0.095, 0.095, 0.12), seed + 1)
        parts.append(upper)

        # The elbow stone is on the forearm, so it fills the joint when the arm bends.
        fore = stone(f"forearm.{side}", f"forearm.{side}")
        rock(fore, e + Vector((0, 0, 0.02)), (0.085, 0.085, 0.085), seed + 2)
        rock(fore, (e + w) / 2, (0.09, 0.09, 0.1), seed + 3)
        rock(fore, w + Vector((0, 0, 0.02)), (0.07, 0.07, 0.06), seed + 12)
        parts.append(fore)

        # The fist: one big boulder with knuckle stones at the front.
        fist = stone(f"fist.{side}", f"hand.{side}")
        rock(fist, t + Vector((0, 0, 0.01)), (0.1, 0.1, 0.095), seed + 4, 10, 7)
        for index, x in enumerate((-0.05, 0.0, 0.05)):
            rock(fist, t + Vector((x, -0.085, -0.02)), (0.03, 0.03, 0.035), seed + 5 + index, 6, 4, 0.15)
        parts.append(fist)

        hip = Vector((LEG_X * sign, 0.02, HIP_Z))
        knee = Vector((LEG_X * sign, 0.0, KNEE_Z))
        thigh = stone(f"thigh.{side}", f"thigh.{side}")
        rock(thigh, (hip + knee) / 2 + Vector((0, 0, 0.02)), (0.1, 0.1, 0.1), seed + 9)
        parts.append(thigh)

        shin = stone(f"shin.{side}", f"shin.{side}")
        rock(shin, (LEG_X * sign, 0.0, 0.11), (0.085, 0.085, 0.08), seed + 10)
        parts.append(shin)

        foot = stone(f"foot.{side}", f"foot.{side}")
        rock(foot, (LEG_X * sign, -0.04, 0.05), (0.1, 0.12, 0.045), seed + 11, 8, 5, 0.15)
        parts.append(foot)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("MountainColossus", BONES)
    parts = body_parts() + head_parts() + limb_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "MountainColossusMesh")
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

    def stand(breath=0.0, sway=0.0):
        """The idle stance: hunched, the knees bent and the fists hanging low. The back heaves as it breathes."""
        return {
            "hips@loc": at("hips", (0, 0.01, -0.004 - breath * 0.004)),
            "hips": t("hips", (X, 6)),
            "spine": t("spine", (X, 12 - breath * 2)),
            "chest": t("chest", (X, 14 - breath * 3), (Y, sway * 2)),
            "neck": t("neck", (X, -16)),
            "head": t("head", (X, -18 + breath * 2), (Z, sway * 5)),
            "upperarm.L": t("upperarm.L", (Y, 4 + breath * 3), (X, -24)),
            "upperarm.R": t("upperarm.R", (Y, -4 - breath * 3), (X, -24)),
            "forearm.L": t("forearm.L", (X, -22)),
            "forearm.R": t("forearm.R", (X, -22)),
            "thigh.L": t("thigh.L", (X, -10)),
            "shin.L": t("shin.L", (X, 14)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, -10)),
            "shin.R": t("shin.R", (X, 14)),
            "foot.R": t("foot.R", (X, -4)),
        }

    def sag(breath=0.0):
        """Low HP: down on the right knee, the right fist on the ground and the head low."""
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0.02, -0.04 - breath * 0.006)),
            spine=t("spine", (X, 16 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 3), (Y, -6)),
            neck=t("neck", (X, 6)),
            head=t("head", (X, 6 + breath * 4), (Y, -6)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, -6)),
            forearm__R=t("forearm.R", (X, -40)),
            upperarm__L=t("upperarm.L", (X, 6), (Y, 4)),
            thigh__L=t("thigh.L", (X, -40)),
            shin__L=t("shin.L", (X, 50)),
            foot__L=t("foot.L", (X, -10)),
            thigh__R=t("thigh.R", (X, 10)),
            shin__R=t("shin.R", (X, 90)),
            foot__R=t("foot.R", (X, -30)),
        )

    def recoil(base, amount=1.0):
        """A hit rocks the stone body back, but the feet stay."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.016)),
            spine=t("spine", (X, -4 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (X, -16 * amount), (Z, 10 * amount)),
            upperarm__L=t("upperarm.L", (Y, -18 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, 18 * amount), (X, 10 * amount)),
        )

    def stagger(base):
        """The knees give way."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.07)),
            spine=t("spine", (X, 20)),
            chest=t("chest", (X, 14)),
            head=t("head", (X, 10)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, 10)),
            upperarm__R=t("upperarm.R", (X, 10), (Y, -10)),
            thigh__L=t("thigh.L", (X, -40)),
            shin__L=t("shin.L", (X, 60)),
            thigh__R=t("thigh.R", (X, -34)),
            shin__R=t("shin.R", (X, 56)),
        )

    def fallen(base, bounce=0.0):
        """Face down like a fallen cliff, the arms beside it."""
        return pose(
            base,
            root=t("root", (X, 84 - bounce)),
            root_at_loc=at("root", (0, -0.04, 0.17)),
            hips_at_loc=at("hips", (0, 0, 0)),
            spine=t("spine", (X, 0)),
            chest=t("chest", (X, -10)),
            neck=t("neck", (X, -24)),
            head=t("head", (X, -40), (Z, -30)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, -24)),
            forearm__L=t("forearm.L", (X, 10)),
            upperarm__R=t("upperarm.R", (X, 4), (Y, 30)),
            forearm__R=t("forearm.R", (X, 16)),
            thigh__L=t("thigh.L", (X, 0)),
            shin__L=t("shin.L", (X, 6)),
            foot__L=t("foot.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 6)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, 30)),
        )

    def curled(base):
        """Curled up like a hill, the arms round the knees: the start of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.145)),
            spine=t("spine", (X, 34)),
            chest=t("chest", (X, 26)),
            neck=t("neck", (X, 20)),
            head=t("head", (X, 20)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, -10)),
            forearm__L=t("forearm.L", (X, -70)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, 10)),
            forearm__R=t("forearm.R", (X, -70)),
            thigh__L=t("thigh.L", (X, -80)),
            shin__L=t("shin.L", (X, 110)),
            foot__L=t("foot.L", (X, -30)),
            thigh__R=t("thigh.R", (X, -80)),
            shin__R=t("shin.R", (X, 110)),
            foot__R=t("foot.R", (X, -30)),
        )

    def roar(base):
        """Up tall, the head back and the fists high: the end of a summon."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (X, -6)),
            chest=t("chest", (X, -12)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -20)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, -50)),
            forearm__L=t("forearm.L", (X, -60)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 50)),
            forearm__R=t("forearm.R", (X, -60)),
            thigh__L=t("thigh.L", (X, -4)),
            shin__L=t("shin.L", (X, 6)),
            thigh__R=t("thigh.R", (X, -4)),
            shin__R=t("shin.R", (X, 6)),
        )

    def mend(base, pull=1.0):
        """Regenerate: the arms open wide and the chest lifts, then the stones pull in."""
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.006 + 0.01 * pull)),
            spine=t("spine", (X, 2 - 4 * pull)),
            chest=t("chest", (X, -8 * pull)),
            head=t("head", (X, -16 * pull)),
            upperarm__L=t("upperarm.L", (X, -30 * pull), (Y, -40 * pull)),
            forearm__L=t("forearm.L", (X, -40 * pull)),
            upperarm__R=t("upperarm.R", (X, -30 * pull), (Y, 40 * pull)),
            forearm__R=t("forearm.R", (X, -40 * pull)),
        )

    def step(front):
        """A slow, heavy step (Heavy). `front` is 1 for the left foot, -1 for the right."""
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.02)),
            chest=t("chest", (X, 4), (Y, 5 * front), (Z, -5 * front)),
            head=t("head", (X, -8), (Z, 5 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -30)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 10)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 14)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 6)),
                # The arms swing against the legs, the fists near the ground.
                f"upperarm__{lead}": t(f"upperarm.{lead}", (X, 14)),
                f"upperarm__{back}": t(f"upperarm.{back}", (X, -18)),
            },
        )

    def passing(lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        planted = "R" if lifted == "L" else "L"
        sign = 1 if lifted == "L" else -1
        return pose(
            stand(),
            hips_at_loc=at("hips", (0, 0, 0.0)),
            chest=t("chest", (X, 4), (Y, -4 * sign)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -30)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 50)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, -4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 6)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -2)),
            },
        )

    # The attack: both fists go up over the head, then a smash down in front
    # of it (Trample). The slash effect starts at 50% of the attack
    # (`MELEE_IMPACT` in fx.ts), so the fists land at frame 15 of 30.
    def lift(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.01)),
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -14)),
            head=t("head", (X, -10)),
            upperarm__L=t("upperarm.L", (X, -165), (Y, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (X, -165), (Y, -10)),
            forearm__R=t("forearm.R", (X, -30)),
        )

    def smash(base):
        return pose(
            base,
            hips_at_loc=at("hips", (0, -0.04, -0.02)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 18)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -16)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, 6)),
            forearm__L=t("forearm.L", (X, -10)),
            upperarm__R=t("upperarm.R", (X, -70), (Y, -6)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 34)),
            thigh__R=t("thigh.R", (X, -24)),
            shin__R=t("shin.R", (X, 34)),
        )

    clips = []
    idle = Clip("idle", 56, loop=True)
    for frame, breath, sway in ((0, 0, 0), (14, 0.5, 1), (28, 1, 0), (42, 0.5, -1), (56, 0, 0)):
        idle.key(frame, stand(breath, sway))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, sag(breath))
    clips.append(low_hp)

    # A slow, heavy walk (Heavy).
    walk = Clip("walk", 32, loop=True)
    walk.key(0, step(1)).key(8, passing("R")).key(16, step(-1)).key(24, passing("L")).key(32, step(1))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(10, lift(stand())).key(15, smash(stand())).key(20, smash(stand()))
    attack.key(27, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 24)
    cast.key(0, stand()).key(7, mend(stand())).key(12, mend(stand(), 1.15)).key(17, mend(stand(), 0.3)).key(24, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, recoil(stand())).key(8, recoil(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, recoil(stand())).key(13, stagger(stand()))
    death.key(26, fallen(stand())).key(30, fallen(stand(), 4)).key(36, fallen(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, curled(stand())).key(8, pose(curled(stand()), hips_at_loc=at("hips", (0, 0.04, -0.125))))
    summon.key(17, roar(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "mountain-colossus.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
