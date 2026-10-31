"""
Restless Wisp (`token.restlessWisp`), a Token Unit Model (art direction 2.2).

A tabletop miniature of the Token painting: a small, teardrop-shaped spirit
of pale teal light with a friendly face like a skull, big glowing eyes and an
open grin. Its tail of light curls back and up, and frost motes turn round
it. A short rusted chain hangs from under its chin to a tiny rusted helmet
with a barred visor, which sits on a patch of ice: the helmet is all that
stays of its old body, and it pulls it everywhere. Run it in Blender (see
`unit_model_kit.py`). It writes `apps/web/art/units/raw/restless-wisp.glb`;
then `bun unit-model:pack restless-wisp` packs it for the game.

It is Flying. The chain and the helmet are the flight stand of the
miniature: the game puts the rest pose on the ground, so the helmet keeps the
spirit in the air. The helmet bone has no parent, so it stays on the ground
when the root moves, and the weights of the chain blend from the spirit to the
helmet, so the chain stretches between them. The face turns 25 degrees to
the camera side. Its walk is a fast glide that drags the helmet in hops. Its
attack (melee, Frost) is a lunge with a wide, icy bite. In the death the
spirit shrinks back into its helmet (its bone scales down), and the helmet
tips over. It has no Keyword that it uses by its own action, so it has no
cast clip.
"""

import math
import os
import sys

from mathutils import Matrix, Vector

REPO = os.environ.get("HEYNBORD_REPO") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(REPO, "scripts", "unit-model"))

import importlib  # noqa: E402

import unit_model_kit as kit  # noqa: E402

importlib.reload(kit)

from unit_model_kit import X, Y, Z, Clip, Part, blend, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the Token painting) ---------------------------------------------

SKULL = hex_color("#eef8f4")
SKULL_SHADE = hex_color("#b8dcd8")
WISP = hex_color("#c4f6ff")
WISP_DARK = hex_color("#7fd4e6")
WISP_DEEP = hex_color("#4fa8bf")
SOCKET = hex_color("#163038")
EYE = hex_color("#e6ffff")
ICE = hex_color("#e8fbff")
ICE_BLUE = hex_color("#a8dcec")
RUST = hex_color("#8a5a34")
RUST_DARK = hex_color("#5c3a22")
RUST_LIGHT = hex_color("#b07a48")
IRON = hex_color("#4e4a46")

# --- Proportions ---------------------------------------------------------------

HEAD_C = Vector((0, 0, 0.46))
HEAD_R = (0.1, 0.1, 0.105)
# The face turns 25 degrees to the camera side (-X).
FACE_ROT = Matrix.Rotation(math.radians(-25), 3, "Z")
FACE_SIDE = FACE_ROT @ X


def face_at(x, y, z):
    """A point in the frame of the face, which looks along -Y before its turn."""
    return HEAD_C + FACE_ROT @ Vector((x, y, z))


# The tail of light: back from the head, then up in a wavy curl.
TAIL = [
    (Vector((0, 0.04, 0.47)), 0.094),
    (Vector((0.01, 0.12, 0.5)), 0.074),
    (Vector((-0.01, 0.2, 0.55)), 0.055),
    (Vector((0.015, 0.27, 0.62)), 0.038),
    (Vector((0.0, 0.31, 0.7)), 0.022),
    (Vector((-0.02, 0.32, 0.77)), 0.007),
]

# The tiny helmet sits on its patch of ice behind and below the spirit.
HELMET_C = Vector((0, 0.15, 0.05))
CHAIN_TOP = Vector((0, 0.03, 0.37))
CHAIN_FOOT = HELMET_C + Vector((0, -0.005, 0.05))

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("body", (0, 0, 0.38), (0, 0, 0.56), "root"),
    ("jaw", tuple(face_at(0, -0.04, -0.03)), tuple(face_at(0, -0.1, -0.06)), "body"),
    ("tail1", (0, 0.06, 0.48), (0, 0.15, 0.52), "body"),
    ("tail2", (0, 0.15, 0.52), (0, 0.24, 0.58), "tail1"),
    ("tail3", (0, 0.24, 0.58), (0, 0.3, 0.72), "tail2"),
    ("motes", tuple(HEAD_C), tuple(HEAD_C + Z * 0.1), "root"),
    # The helmet has no parent: it stays on the ground when the root moves.
    ("helmet", tuple(HELMET_C - Z * 0.04), tuple(HELMET_C + Z * 0.04), None),
]

# --- Weights -------------------------------------------------------------------


def tail_weights(co):
    """The tail follows the body near the head and its three bones further back."""
    if co.y < 0.1:
        return blend("body", "tail1", co.y, 0.03, 0.1)
    if co.y < 0.2:
        return blend("tail1", "tail2", co.y, 0.14, 0.2)
    return blend("tail2", "tail3", co.y, 0.23, 0.29)


def chain_weights(co):
    """The chain stretches from the spirit at the top to the helmet at the foot."""
    axis = CHAIN_FOOT - CHAIN_TOP
    s = clamp01((Vector(co) - CHAIN_TOP).dot(axis) / axis.length_squared)
    return {"body": 1 - s, "helmet": s}


# --- Parts ---------------------------------------------------------------------


def head_parts():
    parts = []
    face_dir = FACE_ROT @ -Y

    def head_color(face, center):
        d = (center - HEAD_C).normalized()
        front = d.dot(face_dir)
        if front > 0.35 and d.z > -0.75:
            return SKULL
        if front > 0.05:
            return SKULL_SHADE
        return WISP if d.z > -0.2 else WISP_DARK

    head = Part("head", head_color, "body", shade=0.1)
    kit.sphere(head.bm, HEAD_C, HEAD_R, 14, 10)
    # Cheek bones of the skull face.
    for sign in (1, -1):
        cheek = kit.sphere(head.bm, face_at(0.05 * sign, -0.07, -0.02), (0.026, 0.02, 0.018), 6, 4)
        head.paint(faces_of(cheek), SKULL)
    parts.append(head)

    face = Part("face", SOCKET, "body", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, face_at(0.037 * sign, -0.082, 0.018), (0.028, 0.018, 0.031), 8, 6)
    kit.cone(face.bm, face_at(0, -0.1, -0.02), face_at(0, -0.103, -0.004), 0.011, 0.002, 4)
    kit.sphere(face.bm, face_at(0, -0.078, -0.045), (0.036, 0.022, 0.022), 8, 5)
    teeth = kit.tube(face.bm, [face_at(-0.028, -0.09, -0.032), face_at(0, -0.099, -0.035), face_at(0.028, -0.09, -0.032)], [0.006, 0.007, 0.006], 5)
    face.paint(faces_of(teeth), SKULL)
    parts.append(face)

    eyes = Part("eyes", EYE, "body", shade=0)
    for sign in (1, -1):
        kit.sphere(eyes.bm, face_at(0.037 * sign, -0.094, 0.016), (0.013, 0.009, 0.014), 7, 5)
    parts.append(eyes)

    jaw = Part("jaw", SKULL, "jaw", shade=0.08)
    kit.tube(jaw.bm, [face_at(-0.042, -0.078, -0.06), face_at(0, -0.098, -0.072), face_at(0.042, -0.078, -0.06)], [0.012, 0.014, 0.012], 6)
    for x in (-0.022, 0.0, 0.022):
        tooth = kit.cone(jaw.bm, face_at(x, -0.096 + abs(x) * 0.3, -0.064), face_at(x, -0.096 + abs(x) * 0.3, -0.052), 0.005, 0.003, 4)
        jaw.paint(faces_of(tooth), SKULL_SHADE)
    parts.append(jaw)
    return parts


def tail_parts():
    def tail_color(face, center):
        t = clamp01((center.y + center.z - 0.5) / 0.55)
        if t < 0.5:
            return tuple(lerp(a, b, t * 2) for a, b in zip(WISP, WISP_DARK))
        return tuple(lerp(a, b, t * 2 - 1) for a, b in zip(WISP_DARK, WISP_DEEP))

    tail = Part("tail", tail_color, tail_weights, shade=0.06)
    kit.tube(tail.bm, [p for p, _ in TAIL], [r for _, r in TAIL], 8)
    # Two thin curls of light off the sides of the tail.
    kit.tube(tail.bm, [(0.04, 0.08, 0.52), (0.07, 0.15, 0.58), (0.06, 0.21, 0.65), (0.03, 0.24, 0.69)], [0.024, 0.016, 0.009, 0.003], 6)
    kit.tube(tail.bm, [(-0.04, 0.1, 0.47), (-0.07, 0.17, 0.5), (-0.07, 0.23, 0.56), (-0.04, 0.27, 0.6)], [0.022, 0.014, 0.008, 0.003], 6)
    return [tail]


def mote_parts():
    """Frost motes that turn round the spirit: small, six-pointed ice stars."""
    motes = Part("motes", ICE, "motes", shade=0)
    spots = [(0, 0.17, 0.08), (55, 0.19, -0.04), (110, 0.16, 0.12), (165, 0.2, 0.0), (215, 0.17, -0.08), (270, 0.18, 0.1), (320, 0.2, -0.02)]
    for degrees, radius, dz in spots:
        a = math.radians(degrees)
        center = HEAD_C + Vector((radius * math.cos(a), radius * math.sin(a), dz))
        for spoke in range(3):
            b = math.radians(spoke * 60)
            arm = Vector((math.cos(b), 0, math.sin(b))) * 0.013
            arm = Matrix.Rotation(a, 3, "Z") @ arm
            kit.cone(motes.bm, center - arm, center + arm, 0.003, 0.003, 4)
        kit.sphere(motes.bm, center, (0.006, 0.006, 0.006), 4, 3)
    return [motes]


def chain_part():
    """A short rusted chain: links that turn in turn, from under the chin to the helmet."""
    chain = Part("chain", RUST, chain_weights, shade=0.05)
    count = 12
    sag = Vector((0, 0.05, -0.02))
    points = []
    for index in range(count + 1):
        s = index / count
        points.append(CHAIN_TOP.lerp(CHAIN_FOOT, s) + sag * (4 * s * (1 - s)))
    for index in range(count):
        a, b = points[index], points[index + 1]
        direction = (b - a).normalized()
        side = direction.cross(X if index % 2 else Y).normalized()
        verts = kit.torus(chain.bm, (a + b) / 2, side, 0.011, 0.0034, 8, 3)
        # The links are long: stretch each along the chain.
        for vert in verts:
            offset = vert.co - (a + b) / 2
            vert.co = (a + b) / 2 + offset + direction * offset.dot(direction) * 0.5
        if index % 3 == 1:
            chain.paint(faces_of(verts), RUST_DARK)
    return chain


def helmet_parts():
    """The tiny rusted helmet with a barred visor, on a patch of ice."""
    helmet = Part("helmet", RUST, "helmet", shade=0.18)
    # It sits a little tipped back, the visor turned to the front and the camera side.
    facing = (FACE_ROT @ Vector((0, -1, 0.25))).normalized()
    dome = kit.sphere(helmet.bm, HELMET_C, (0.052, 0.05, 0.05), 12, 8)
    for face in faces_of(dome):
        c = face.calc_center_median()
        if int((c.x * 9 + c.z * 7) * 80) % 4 == 0:
            helmet.paint([face], RUST_LIGHT)
    rim = kit.torus(helmet.bm, HELMET_C - Z * 0.02, Z, 0.05, 0.007, 12, 4)
    helmet.paint(faces_of(rim), RUST_DARK)
    crest = kit.tube(helmet.bm, [HELMET_C + Vector((0, 0.05, 0.0)), HELMET_C + Vector((0, 0.03, 0.045)), HELMET_C + Vector((0, -0.02, 0.05)), HELMET_C + Vector((0, -0.05, 0.015))], [0.007] * 4, 4)
    helmet.paint(faces_of(crest), RUST_DARK)
    # The ring on the top, for the chain.
    ring = kit.torus(helmet.bm, CHAIN_FOOT - Z * 0.002, X, 0.009, 0.003, 8, 3)
    helmet.paint(faces_of(ring), IRON)
    # The visor: a dark opening with bars, on the face of the helmet.
    across = facing.cross(Z).normalized()
    visor_c = HELMET_C + facing * 0.046 - Z * 0.004
    opening = kit.slab(helmet.bm, visor_c, across * 0.03, facing * 0.008, Z * 0.022)
    helmet.paint(faces_of(opening), kit.hex_color("#1a1410"))
    for step in (-2, -1, 0, 1, 2):
        bar = kit.slab(helmet.bm, visor_c + across * step * 0.013 + facing * 0.006, across * 0.003, facing * 0.004, Z * 0.024)
        helmet.paint(faces_of(bar), IRON)
    for sign in (1, -1):
        rivet = kit.sphere(helmet.bm, HELMET_C + across * 0.047 * sign + facing * 0.012, (0.006, 0.006, 0.006), 4, 3)
        helmet.paint(faces_of(rivet), IRON)

    # The patch of ice: the base of the miniature, with shards of ice in it.
    ice = Part("ice", ICE_BLUE, "helmet", shade=0.05)
    patch = kit.cone(ice.bm, (0, 0.13, 0.0), (0, 0.13, 0.008), 0.095, 0.088, 14)
    for face in faces_of(patch):
        if face.normal.z > 0.5:
            ice.paint([face], ICE)
    for x, y, tilt in ((0.07, 0.1, 0.4), (-0.07, 0.18, -0.3), (0.04, 0.22, 0.2), (-0.075, 0.08, -0.5)):
        base = Vector((x, y, 0.004))
        shard = kit.cone(ice.bm, base, base + Vector((tilt * 0.03, 0.0, 0.05)), 0.012, 0.001, 4)
        ice.paint(faces_of(shard), ICE)
    return [helmet, ice]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("RestlessWisp", BONES)
    parts = head_parts() + tail_parts() + mote_parts() + [chain_part()] + helmet_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "RestlessWispMesh")
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

    def tail(curl=0.0, stream=0.0):
        """The tail of light: `curl` (-1 to 1) waves it, `stream` (0 to 1) blows it straight back."""
        return {
            "tail1": t("tail1", (Z, 12 * curl), (X, -6 * stream)),
            "tail2": t("tail2", (Z, -16 * curl), (X, -14 * stream)),
            "tail3": t("tail3", (Z, 22 * curl), (X, -26 * stream)),
        }

    def float_(bob=0.0, sway=0.0, curl=0.0, chat=0.0, spin=0.0):
        """It floats over its helmet. `spin` turns the frost motes, in degrees."""
        return {
            "root@loc": at("root", (0, 0, 0.018 * bob)),
            "body": t("body", (X, 3 * bob), (Y, 6 * sway)),
            "jaw": t("jaw", (FACE_SIDE, 6 + 16 * chat)),
            "motes": t("motes", (Z, spin)),
            **tail(curl),
        }

    def flicker(bob=0.0, dim=0.0, spin=0.0):
        """Low HP: low and weak, the tail limp; it flickers (its bone scales) and the motes grow few."""
        return pose(
            float_(bob, 0, 0.3 * bob, 0.3, spin),
            root_at_loc=at("root", (0, 0.02, -0.06 + 0.01 * bob)),
            body=t("body", (X, 14), (Y, -6)),
            body_at_scale=1.0 - 0.1 * dim,
            jaw=t("jaw", (FACE_SIDE, 18)),
            motes_at_scale=0.55,
            tail1=t("tail1", (X, 16), (Z, 10 * bob)),
            tail2=t("tail2", (X, 22)),
            tail3=t("tail3", (X, 20), (Z, -10 * bob)),
        )

    def glide(phase, hop=0.0):
        """The walk: it leans in and glides, the tail streams back, and the helmet hops after it."""
        return pose(
            float_(math.sin(phase), 0, math.cos(phase), 0.2, -math.degrees(phase)),
            root_at_loc=at("root", (0, -0.02, 0.025 + 0.012 * math.sin(2 * phase))),
            body=t("body", (X, 16), (Y, 5 * math.sin(phase))),
            helmet=t("helmet", (X, -18 * hop)),
            helmet_at_loc=at("helmet", (0, -0.03 * hop, 0.025 * hop)),
            **tail(0.6 * math.cos(phase), 1.0),
        )

    def recoil(base, amount=1.0):
        """A hit pushes it back and squashes it: the jaw drops and the motes scatter."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.06 * amount, 0.02 * amount)),
            body=t("body", (X, -20 * amount), (Y, 12 * amount)),
            body_at_scale=1.0 - 0.12 * amount,
            jaw=t("jaw", (FACE_SIDE, 6 + 26 * amount)),
            motes_at_scale=1.0 + 0.3 * amount,
            **tail(-0.6 * amount, -0.4 * amount),
        )

    def wind(base):
        """It draws back and up, the jaw a little open and the tail curled forward."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0.08, 0.035)),
            body=t("body", (X, -16)),
            jaw=t("jaw", (FACE_SIDE, 14)),
            motes=t("motes", (Z, -60)),
            tail1=t("tail1", (X, 18)),
            tail2=t("tail2", (X, 24)),
            tail3=t("tail3", (X, 28)),
        )

    def bite(base):
        """It lunges to the front with a wide, icy bite. The chain yanks the helmet after it."""
        return pose(
            base,
            root_at_loc=at("root", (0, -0.14, -0.03)),
            body=t("body", (X, 22)),
            body_at_scale=1.08,
            jaw=t("jaw", (FACE_SIDE, 44)),
            motes=t("motes", (Z, -200)),
            motes_at_loc=at("motes", (0, -0.1, -0.02)),
            helmet=t("helmet", (X, -24)),
            helmet_at_loc=at("helmet", (0, -0.04, 0.02)),
            **tail(0.2, 1.0),
        )

    def sunk(base, tip=0.0):
        """Shrunk back into its helmet: the root goes down to it and the body bone scales down. `tip` tips the helmet over."""
        return pose(
            base,
            root_at_loc=at("root", HELMET_C - HEAD_C + Vector((0, -0.01, 0.02))),
            body=t("body", (X, 30)),
            body_at_scale=0.04,
            motes_at_scale=0.0,
            helmet=t("helmet", (Y, -70 * tip), (X, 10 * tip)),
            helmet_at_loc=at("helmet", (-0.02 * tip, 0, -0.008 * tip)),
            **tail(0, 0),
        )

    def puff(base, grow=1.1, spin=0.0):
        """Out of the helmet in a puff of frost: it rises, a little too big, and the motes spin."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, 0.03)),
            body=t("body", (X, -8)),
            body_at_scale=grow,
            jaw=t("jaw", (FACE_SIDE, 30)),
            motes=t("motes", (Z, spin)),
            motes_at_scale=1.2,
            **tail(-0.5, 0),
        )

    clips = []
    # The idle: it bobs over its helmet, the tail waves, the jaw chatters and
    # the frost motes turn round it once.
    idle = Clip("idle", 48, loop=True)
    for frame in range(0, 49, 6):
        phase = 2 * math.pi * frame / 48
        chat = 1.0 if frame in (18, 30) else 0.0
        idle.key(frame, float_(math.sin(phase), 0.6 * math.sin(phase * 2), math.cos(phase), chat, -360 * frame / 48))
    clips.append(idle)

    low = Clip("lowHp", 40, loop=True)
    for frame, bob, dim in ((0, 0, 0), (4, 0.2, 1), (7, 0.3, 0), (10, 0.5, 1), (20, 1, 0), (26, 0.6, 1), (29, 0.5, 0), (40, 0, 0)):
        low.key(frame, flicker(bob, dim, -180 * frame / 40))
    clips.append(low)

    walk = Clip("walk", 20, loop=True)
    for frame in range(0, 21, 5):
        hop = 1.0 if frame in (5, 15) else 0.0
        walk.key(frame, glide(2 * math.pi * frame / 20, hop))
    clips.append(walk)

    # The bite lands at 50% of the attack (`MELEE_IMPACT` in fx.ts): frame 15 of 30.
    attack = Clip("attack", 30)
    attack.key(0, float_()).key(8, wind(float_())).key(15, bite(float_())).key(19, bite(float_()))
    attack.key(25, float_(0.5, 0, -0.4, 0.5, -300)).key(30, float_(0, 0, 0, 0, -360))
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, float_()).key(3, recoil(float_())).key(8, recoil(float_(), 0.4)).key(16, float_())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, float_()).key(5, recoil(float_())).key(12, pose(recoil(float_(), 0.6), body_at_scale=0.7))
    death.key(26, sunk(float_())).key(31, sunk(float_(), 1.15)).key(36, sunk(float_(), 1.0))
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`): it sinks into
    # its helmet, then it puffs out again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, float_()).key(4, recoil(float_())).key(16, sunk(float_())).key(21, sunk(float_()))
    rebirth.key(32, puff(float_(), 0.7, -120)).key(41, puff(float_(), 1.12, -300)).key(48, float_(0, 0, 0, 0, -360))
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, sunk(float_())).key(10, puff(float_(), 0.6, -90)).key(17, puff(float_(), 1.12, -240))
    summon.key(24, float_(0, 0, 0, 0, -360))
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "restless-wisp.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
