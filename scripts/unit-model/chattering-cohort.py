"""
Chattering Cohort (`undead.chatteringCohort`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: three eager skeleton soldiers
crowded around one big rusty sword. Each has glowing pale eyes, a rusty
leather jerkin, a teal scarf, a ragged tunic, wrapped boots and a helmet that
does not match the others: a spiked cap, a helmet with a teal crest and a
kettle hat. They all lean forward, and each points the other way with his
free hand. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/chattering-cohort.glb`; then
`bun unit-model:pack chattering-cohort` packs it for the game.

The three stand in a line along the Lane, so the camera sees all three side
by side, and the sword is on the camera side, in front of them. Each holds
it with his right hand. A sword arm has no bone of its own: its weights blend
from the body to the sword, so it stretches from the shoulder to the hand on
the hilt. Each skeleton has a body, a head, a jaw, a pointing arm and two
legs, and the legs are children of the root, so a body can lean and bob
alone. They have Swarm, so they chatter all the time: the jaws clack in
each clip. Their attack is a thrust of the sword together. In the death they
fall apart into a heap of bones, and the sword drops. They have no Keyword
that they use by their own action, so they have no cast clip.
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

from unit_model_kit import X, Y, Z, Clip, Part, clamp01, faces_of, hex_color, lerp, turn  # noqa: E402

# --- Palette (the card painting) ----------------------------------------------

BONE = hex_color("#e6dcc4")
BONE_DARK = hex_color("#b3a684")
SOCKET = hex_color("#1c1f22")
GLOW = hex_color("#9fe8ff")
RUST = hex_color("#8f5f3a")
RUST_DARK = hex_color("#62402a")
STEEL = hex_color("#9d978b")
STEEL_DARK = hex_color("#6a655c")
TEAL = hex_color("#5f837d")
TEAL_DARK = hex_color("#3f5a56")
LEATHER = hex_color("#6a4a2e")
LEATHER_DARK = hex_color("#45301e")
TUNIC = hex_color("#8a7a62")
TUNIC_DARK = hex_color("#63574a")
BRASS = hex_color("#b08440")

# --- Proportions ---------------------------------------------------------------

# Each skeleton, in its own frame: its feet at the origin, facing -Y.
HIP_Z = 0.3
SHOULDER_Z = 0.47
NECK_Z = 0.5
HEAD_Z = 0.585
KNEE_Z = 0.165
ANKLE_Z = 0.04
LEG_X = 0.034
SHOULDER_X = 0.062

# The big sword lies along the Lane on the camera side (-X), at hip height,
# its point a little up. `GRIP` is the middle of the long grip.
SWORD = Vector((0, -1, 0.08)).normalized()
GRIP = Vector((-0.1, 0.2, 0.355))
POMMEL = -0.11
GUARD = 0.1
SWORD_TIP = 0.78


def on_sword(a, up=0.0):
    """A point on the sword at rest: `a` along it from the grip, `up` above it."""
    return GRIP + SWORD * a + Z * up


# The three skeletons, from the front of the line to the back: where each
# stands, his helmet, where his right hand holds the sword, and where his
# free hand points.
SKELETONS = {
    "a": (Vector((0.03, -0.18, 0)), "spike", 0.42, Vector((0.25, -0.75, 0.6))),
    "b": (Vector((0.05, 0.0, 0)), "crest", 0.22, Vector((0.35, 0.1, 1))),
    "c": (Vector((0.03, 0.18, 0)), "kettle", 0.0, Vector((0.3, 0.85, 0.45))),
}

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.12), None),
    ("sword", tuple(GRIP), tuple(GRIP + SWORD * 0.1), "root"),
]
for name, (origin, _helmet, _hold, aim) in SKELETONS.items():
    o = origin
    shoulder = o + Vector((SHOULDER_X, 0, SHOULDER_Z))
    BONES += [
        (f"body.{name}", tuple(o + Vector((0, 0, HIP_Z))), tuple(o + Vector((0, 0, NECK_Z))), "root"),
        (f"head.{name}", tuple(o + Vector((0, 0, NECK_Z))), tuple(o + Vector((0, 0, NECK_Z + 0.15))), f"body.{name}"),
        (f"jaw.{name}", tuple(o + Vector((0, -0.01, HEAD_Z - 0.03))), tuple(o + Vector((0, -0.06, HEAD_Z - 0.045))), f"head.{name}"),
        (f"point.{name}", tuple(shoulder), tuple(shoulder + aim.normalized() * 0.2), f"body.{name}"),
    ]
    for side, sign in (("L", 1), ("R", -1)):
        BONES += [
            (f"thigh.{side}.{name}", tuple(o + Vector((LEG_X * sign, 0, HIP_Z))), tuple(o + Vector((LEG_X * sign, 0, KNEE_Z))), "root"),
            (f"shin.{side}.{name}", tuple(o + Vector((LEG_X * sign, 0, KNEE_Z))), tuple(o + Vector((LEG_X * sign, 0, ANKLE_Z))), f"thigh.{side}.{name}"),
        ]

# --- Parts ---------------------------------------------------------------------


def moved(part, origin):
    """Moves a part built in a skeleton's frame to where the skeleton stands."""
    for vert in part.bm.verts:
        vert.co += origin
    return part


def skeleton_parts(name, origin, helmet_kind, hold, aim):
    """The parts of one skeleton, built in its own frame and then moved to `origin`."""

    def local(weights):
        return lambda co: weights(co - origin)

    def body_weights(co):
        return {f"body.{name}": 1.0}

    def tunic_weights(co):
        """The tunic follows the body at the top and the thighs lower down."""
        t = clamp01((HIP_Z - 0.01 - co.z) / 0.1)
        side = co.x / 0.05
        return {
            f"body.{name}": 1 - t,
            f"thigh.L.{name}": t * clamp01(side + 0.5),
            f"thigh.R.{name}": t * clamp01(-side + 0.5),
        }

    head_c = Vector((0, -0.006, HEAD_Z))
    parts = []

    skull = Part(f"skull.{name}", BONE, f"head.{name}", shade=0.12)
    kit.sphere(skull.bm, head_c, (0.05, 0.055, 0.056), 10, 8)
    for sign in (1, -1):
        kit.sphere(skull.bm, head_c + Vector((0.032 * sign, -0.04, -0.018)), (0.018, 0.016, 0.013), 6, 4)
    brow = kit.box(skull.bm, head_c + Vector((0, -0.048, 0.016)), (0.076, 0.012, 0.011))
    skull.paint(faces_of(brow), BONE_DARK)
    parts.append(skull)

    face = Part(f"face.{name}", SOCKET, f"head.{name}", shade=0)
    for sign in (1, -1):
        kit.sphere(face.bm, head_c + Vector((0.021 * sign, -0.047, 0.003)), (0.016, 0.01, 0.015), 8, 5)
        eye = kit.sphere(face.bm, head_c + Vector((0.021 * sign, -0.055, 0.003)), (0.007, 0.004, 0.007), 6, 4)
        face.paint(faces_of(eye), GLOW)
    kit.cone(face.bm, head_c + Vector((0, -0.053, -0.017)), head_c + Vector((0, -0.055, -0.004)), 0.008, 0.002, 4)
    teeth = kit.box(face.bm, head_c + Vector((0, -0.048, -0.03)), (0.046, 0.008, 0.01))
    face.paint(faces_of(teeth), BONE_DARK)
    parts.append(face)

    jaw = Part(f"jaw.{name}", BONE, f"jaw.{name}", shade=0.1)
    kit.sphere(jaw.bm, (0, -0.03, HEAD_Z - 0.044), (0.04, 0.032, 0.018), 8, 5)
    lower = kit.box(jaw.bm, (0, -0.056, HEAD_Z - 0.034), (0.044, 0.007, 0.01))
    jaw.paint(faces_of(lower), BONE_DARK)
    parts.append(jaw)

    # The helmets do not match.
    helmet = Part(f"helmet.{name}", RUST, f"head.{name}", shade=0.14)
    top = head_c + Vector((0, 0.004, 0.012))
    verts = kit.sphere(helmet.bm, top, (0.058, 0.062, 0.058), 12, 7)
    kit.bmesh.ops.delete(helmet.bm, geom=[v for v in verts if v.co.z < top.z - 0.004 or (v.co.y < -0.03 and v.co.z < top.z + 0.02)], context="VERTS")
    # The rim tips up at the front, so it stays above the eyes.
    rim = kit.torus(helmet.bm, top + Vector((0, 0.0, 0.004)), (0, 0.45, 1), 0.058, 0.006, 14, 3)
    helmet.paint(faces_of(rim), STEEL_DARK)
    if helmet_kind == "spike":
        spike = kit.cone(helmet.bm, top + Vector((0, 0, 0.05)), top + Vector((0, 0.01, 0.1)), 0.012, 0.001, 5)
        helmet.paint(faces_of(spike), STEEL)
        guard = kit.slab(helmet.bm, top + Vector((0, -0.06, -0.02)), (0.006, 0, 0), (0, 0.004, 0), (0, 0, 0.026))
        helmet.paint(faces_of(guard), STEEL_DARK)
    elif helmet_kind == "crest":
        for index in range(4):
            base = top + Vector((0, -0.02 + 0.026 * index, 0.056 - 0.006 * index))
            tip = base + Vector((0.006 * (index % 2), 0.06 + 0.012 * index, 0.03 - 0.028 * index))
            plume = kit.cone(helmet.bm, base, tip, 0.016, 0.003, 5, squash=0.45)
            helmet.paint(faces_of(plume), TEAL_DARK if index % 2 else TEAL)
        ridge = kit.tube(helmet.bm, [top + Vector((0, -0.058, 0.02)), top + Vector((0, -0.02, 0.058)), top + Vector((0, 0.04, 0.05))], [0.006] * 3, 4)
        helmet.paint(faces_of(ridge), STEEL)
    else:
        brim = kit.cone(helmet.bm, top + Vector((0, 0, -0.002)), top + Vector((0, 0, -0.016)), 0.06, 0.092, 14)
        helmet.paint(faces_of(brim), STEEL)
        for face_ in helmet.bm.faces:
            c = face_.calc_center_median()
            if c.x > 0.02 and c.z > top.z + 0.01:
                helmet.paint([face_], RUST_DARK)
    parts.append(helmet)

    neck = Part(f"neck.{name}", BONE_DARK, body_weights)
    kit.cone(neck.bm, (0, 0.004, NECK_Z - 0.03), (0, 0.004, HEAD_Z - 0.03), 0.012, 0.011, 5)
    parts.append(neck)

    # A rusty leather jerkin, with a rusty guard on the sword shoulder.
    jerkin = Part(f"jerkin.{name}", LEATHER, body_weights, shade=0.14)
    verts = kit.cone(jerkin.bm, (0, 0, HIP_Z + 0.01), (0, 0, NECK_Z - 0.01), 0.05, 0.06, 10, squash=0.78)
    for face_ in faces_of(verts):
        c = face_.calc_center_median()
        if int((c.x * 2 + c.z) * 40) % 4 == 0:
            jerkin.paint([face_], RUST)
    belt = kit.cone(jerkin.bm, (0, 0, HIP_Z + 0.01), (0, 0, HIP_Z + 0.03), 0.054, 0.054, 10, squash=0.8)
    jerkin.paint(faces_of(belt), LEATHER_DARK)
    pauldron = kit.sphere(jerkin.bm, (-SHOULDER_X, 0, SHOULDER_Z + 0.006), (0.034, 0.034, 0.026), 8, 5)
    jerkin.paint(faces_of(pauldron), RUST)
    parts.append(jerkin)

    scarf = Part(f"scarf.{name}", TEAL, body_weights, shade=0.08)
    kit.torus(scarf.bm, (0, 0.004, NECK_Z - 0.008), (0, 0.15, 1), 0.044, 0.013, 10, 4)
    tail = kit.cone(scarf.bm, (0.02, 0.04, NECK_Z - 0.01), (0.04, 0.11, NECK_Z - 0.06), 0.016, 0.004, 4, squash=0.3)
    scarf.paint(faces_of(tail), TEAL_DARK)
    parts.append(scarf)

    def tunic_color(row, column):
        if row >= 2:
            return TUNIC_DARK
        return TEAL if column % 4 == 1 else TUNIC

    tunic = Part(f"tunic.{name}", TUNIC, tunic_weights, shade=0.1)
    kit.ragged_cone(tunic, HIP_Z + 0.02, 0.17, 0.054, 0.08, 10, 3, 0.8, 0.04, tunic_color, TUNIC_DARK)
    parts.append(tunic)

    # The free left arm points; the right arm holds the sword.
    shoulder_l = Vector((SHOULDER_X, 0, SHOULDER_Z))
    d = aim.normalized()
    elbow = shoulder_l + (d * 0.1) + Vector((0, 0, -0.012))
    hand = shoulder_l + d * 0.2
    arm = Part(f"point.{name}", BONE, f"point.{name}")
    kit.tube(arm.bm, [shoulder_l, elbow, hand], [0.012, 0.011, 0.01], 5)
    bracer = kit.cone(arm.bm, elbow + d * 0.02, hand - d * 0.02, 0.016, 0.015, 6)
    arm.paint(faces_of(bracer), LEATHER)
    kit.sphere(arm.bm, hand + d * 0.012, (0.014, 0.014, 0.014), 6, 4)
    finger = kit.cone(arm.bm, hand + d * 0.02, hand + d * 0.055, 0.005, 0.003, 4)
    arm.paint(faces_of(finger), BONE_DARK)
    parts.append(arm)

    shoulder_r = origin + Vector((-SHOULDER_X, 0, SHOULDER_Z))
    grip = on_sword(hold)
    elbow_r = shoulder_r.lerp(grip, 0.5) + Vector((-0.03, 0.02, -0.02))

    def grab_weights(co):
        """The sword arm stretches from the body at the shoulder to the sword at the hand."""
        a = (co - shoulder_r).length
        b = (co - grip).length
        t = clamp01((a / max(a + b, 1e-4) - 0.25) / 0.6)
        return {f"body.{name}": 1 - t, "sword": t}

    grab = Part(f"grab.{name}", BONE, grab_weights)
    kit.tube(grab.bm, [shoulder_r, elbow_r, grip + Vector((0, 0, 0.012))], [0.012, 0.011, 0.01], 5)
    fist = kit.sphere(grab.bm, grip + Vector((0, 0, 0.004)), (0.02, 0.018, 0.018), 6, 4)
    grab.paint(faces_of(fist), BONE)
    knuckles = kit.box(grab.bm, grip + Vector((-0.016, 0, 0.004)), (0.008, 0.028, 0.014))
    grab.paint(faces_of(knuckles), BONE_DARK)
    parts.append(grab)

    for side, sign in (("L", 1), ("R", -1)):
        hip = Vector((LEG_X * sign, 0, HIP_Z))
        knee = Vector((LEG_X * sign, 0, KNEE_Z))
        ankle = Vector((LEG_X * sign, 0, ANKLE_Z))
        femur = Part(f"femur.{side}.{name}", BONE, f"thigh.{side}.{name}")
        kit.cone(femur.bm, hip, knee, 0.014, 0.012, 5)
        cap = kit.sphere(femur.bm, knee + Vector((0, -0.01, 0.004)), (0.018, 0.016, 0.018), 6, 4)
        femur.paint(faces_of(cap), BONE_DARK)
        parts.append(femur)

        boot = Part(f"boot.{side}.{name}", LEATHER, f"shin.{side}.{name}", shade=0.12)
        verts = kit.cone(boot.bm, knee - Vector((0, 0, 0.02)), ankle, 0.026, 0.024, 7)
        for face_ in faces_of(verts):
            if int(face_.calc_center_median().z * 70) % 2:
                boot.paint([face_], LEATHER_DARK)
        foot = kit.box(boot.bm, (LEG_X * sign, -0.022, 0.02), (0.042, 0.088, 0.04))
        boot.paint(faces_of(foot), LEATHER_DARK)
        parts.append(boot)

    for part in parts:
        if part.name.startswith("grab."):
            continue
        moved(part, origin)
        if callable(part.weights):
            part.weights = local(part.weights)
    return parts


def sword_parts():
    """One big rusty sword: a long grip, a wide guard and a long blade."""
    sword = Part("sword", STEEL, "sword", shade=0.06)
    side = SWORD.cross(Z).normalized()
    up = side.cross(SWORD).normalized()
    if up.z < 0:
        up = -up
    pommel = kit.sphere(sword.bm, on_sword(POMMEL), (0.022, 0.022, 0.022), 8, 5)
    sword.paint(faces_of(pommel), BRASS)
    grip = kit.cone(sword.bm, on_sword(POMMEL), on_sword(GUARD - 0.02), 0.012, 0.012, 6)
    sword.paint(faces_of(grip), LEATHER_DARK)
    for along in (-0.06, 0.03):
        wrap = kit.cone(sword.bm, on_sword(along), on_sword(along + 0.012), 0.014, 0.014, 6)
        sword.paint(faces_of(wrap), LEATHER)
    guard = kit.slab(sword.bm, on_sword(GUARD), SWORD * 0.012, side * 0.012, up * 0.07)
    sword.paint(faces_of(guard), BRASS)
    # The blade: wide and flat, its face up to the sky and to the camera side,
    # with rust patches and a notch.
    face_n = (side + up * 0.6).normalized()
    width_axis = face_n.cross(SWORD).normalized()
    steps = 6
    for index in range(steps):
        a0 = lerp(GUARD + 0.01, SWORD_TIP - 0.1, index / steps)
        a1 = lerp(GUARD + 0.01, SWORD_TIP - 0.1, (index + 1) / steps)
        center = on_sword((a0 + a1) / 2)
        width = lerp(0.042, 0.034, index / steps)
        kit.slab(sword.bm, center, SWORD * ((a1 - a0) / 2 + 0.001), width_axis * width, face_n * 0.005)
    # Rust patches on the face of the blade.
    for along, across, size in ((0.22, 0.012, 0.04), (0.4, -0.016, 0.03), (0.55, 0.01, 0.05)):
        patch = kit.slab(sword.bm, on_sword(along) + width_axis * across + face_n * 0.005, SWORD * size, width_axis * 0.016, face_n * 0.001)
        sword.paint(faces_of(patch), RUST)

    def tip_row(along, width):
        base = on_sword(along)
        return [base - width_axis * width, base, base + width_axis * width]

    def tip_color(face_side, row, column):
        return STEEL

    rows = [tip_row(SWORD_TIP - 0.1, 0.034), tip_row(SWORD_TIP - 0.04, 0.02), tip_row(SWORD_TIP, 0.002)]
    kit.panel(sword, [[p + face_n * 0.005 for p in row] for row in rows], [[p - face_n * 0.005 for p in row] for row in rows], tip_color)
    fuller = kit.slab(sword.bm, on_sword(0.35) + face_n * 0.005, SWORD * 0.2, width_axis * 0.006, face_n * 0.001)
    sword.paint(faces_of(fuller), STEEL_DARK)
    return [sword]


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("ChatteringCohort", BONES)
    parts = sword_parts()
    for name, (origin, helmet, hold, aim) in SKELETONS.items():
        parts += skeleton_parts(name, origin, helmet, hold, aim)
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "ChatteringCohortMesh")
    kit.skin(mesh, rig)
    return rig, mesh


# --- Clips -----------------------------------------------------------------------


def build_clips(rig):
    def t(bone, *rotations):
        return turn(rig, bone, *rotations)

    def at(bone, offset):
        return kit.shift(rig, bone, offset)

    NAMES = ("a", "b", "c")

    def one(name, lean=12.0, bob=0.0, chat=0.0, look=0.0, wave=0.0, step=0.0, crouch=0.0):
        """
        The pose of one skeleton. `lean` bends the body forward, `bob` lifts
        it, `chat` opens the jaw, `look` turns the head to his left (+) or
        right (-), `wave` swings the pointing arm, `step` swings the legs (1:
        left foot forward) and `crouch` bends the knees.
        """
        return {
            f"body.{name}": t(f"body.{name}", (X, lean)),
            f"body.{name}@loc": at(f"body.{name}", (0, 0, bob - 0.06 * crouch)),
            f"head.{name}": t(f"head.{name}", (X, -lean * 0.8), (Z, look * 30), (Y, look * 6)),
            f"jaw.{name}": t(f"jaw.{name}", (X, 4 + chat * 26)),
            f"point.{name}": t(f"point.{name}", (X, -wave * 18), (Y, wave * 10)),
            f"thigh.L.{name}": t(f"thigh.L.{name}", (X, -14 - 24 * step - 40 * crouch)),
            f"shin.L.{name}": t(f"shin.L.{name}", (X, 12 + 20 * max(0.0, step) + 60 * crouch)),
            f"thigh.R.{name}": t(f"thigh.R.{name}", (X, 10 + 24 * step - 40 * crouch)),
            f"shin.R.{name}": t(f"shin.R.{name}", (X, 8 + 20 * max(0.0, -step) + 60 * crouch)),
        }

    def group(sword=None, **each):
        """The three skeletons and the sword. `each` maps a name to the keyword arguments of `one`."""
        result = {}
        for name in NAMES:
            result.update(one(name, **each.get(name, {})))
        sword = sword or {}
        result["sword"] = t("sword", (X, sword.get("tilt", 0.0)), (Z, sword.get("turn", 0.0)))
        result["sword@loc"] = at("sword", sword.get("loc", (0, 0, 0)))
        return result

    def stand(phase=0.0, chat=(0.0, 0.0, 0.0), look=(0.0, 0.0, 0.0)):
        """At rest, eager: each body bobs on its own beat. `phase` 0 to 1 is the beat."""
        bobs = [0.006 * math.sin(2 * math.pi * (phase + offset)) for offset in (0.0, 0.33, 0.66)]
        return group(
            sword={"tilt": -2 + 2 * math.sin(2 * math.pi * phase), "loc": (0, 0, 0.004 * math.sin(2 * math.pi * phase))},
            **{
                name: {"bob": bobs[index], "chat": chat[index], "look": look[index], "wave": math.sin(2 * math.pi * (phase + 0.25 * index))}
                for index, name in enumerate(NAMES)
            },
        )

    def tired(breath=0.0):
        """Low HP: they sag, the sword point on the ground, and they lean on each other."""
        return group(
            sword={"tilt": 14, "loc": (0, 0, -0.05)},
            a={"lean": 30, "chat": 0.2 * breath, "look": 0.4, "wave": -1.4, "crouch": 0.5},
            b={"lean": 24 + 4 * breath, "chat": 0.6 * breath, "look": -0.2, "wave": -1.2, "crouch": 0.3},
            c={"lean": 28, "chat": 0.3, "look": -0.6, "wave": -1.6, "crouch": 0.4 + 0.1 * breath},
        )

    def march(phase):
        """A quick march: the front and the back skeleton step together, and the middle one on the other foot."""
        swing = math.sin(2 * math.pi * phase)
        bob = 0.012 * abs(math.cos(2 * math.pi * phase))
        return group(
            sword={"tilt": -3 + 3 * swing, "loc": (0, 0, bob * 0.5)},
            a={"lean": 18, "bob": bob, "step": swing, "chat": 0.5 + 0.5 * swing, "wave": 0.8 * swing},
            b={"lean": 16, "bob": bob, "step": -swing, "chat": 0.5 - 0.5 * swing, "wave": -0.8 * swing},
            c={"lean": 18, "bob": bob, "step": swing, "chat": 0.3, "wave": 0.6 * swing},
        )

    def drawn():
        """The thrust starts: they pull the sword back and lean back, the jaws wide."""
        return group(
            sword={"tilt": -6, "loc": (0, 0.07, 0.02)},
            a={"lean": -4, "chat": 1, "wave": 1.2, "step": 0.4},
            b={"lean": -6, "chat": 1, "wave": 1.2, "step": -0.3},
            c={"lean": -2, "chat": 1, "wave": 1.0, "step": 0.4},
        )

    def lunge(depth=1.0):
        """They drive the sword forward together."""
        return group(
            sword={"tilt": 4 * depth, "loc": (0, -0.16 * depth, -0.01)},
            a={"lean": 34 * depth, "bob": -0.01, "chat": 0.8, "wave": -1.0, "step": 0.9 * depth},
            b={"lean": 30 * depth, "bob": -0.01, "chat": 1.0, "wave": -1.4, "step": -0.6 * depth},
            c={"lean": 32 * depth, "bob": -0.01, "chat": 0.9, "wave": -1.0, "step": 0.9 * depth},
        )

    def jolt(amount=1.0):
        """The hit: they all jump back, the jaws wide, and look round."""
        return group(
            sword={"tilt": -10 * amount, "loc": (0, 0.03 * amount, 0.01 * amount)},
            a={"lean": 12 - 22 * amount, "chat": amount, "look": -0.6 * amount, "wave": 1.6 * amount},
            b={"lean": 12 - 26 * amount, "chat": amount, "look": 0.6 * amount, "wave": 1.8 * amount},
            c={"lean": 12 - 18 * amount, "chat": amount, "look": -0.4 * amount, "wave": 1.4 * amount},
        )

    def heap(bounce=0.0):
        """They fall apart into a heap of bones: the bodies fall, the heads drop and roll, and the sword drops."""
        result = group(
            sword={"tilt": 0, "turn": 18, "loc": (0, 0.02, -0.32)},
            a={"lean": 80 - bounce, "chat": 1, "look": 1.2, "wave": -3, "crouch": 1},
            b={"lean": -70 + bounce, "chat": 1, "look": -1.4, "wave": 3, "crouch": 1},
            c={"lean": 76 - bounce, "chat": 1, "look": -1.0, "wave": -2.5, "crouch": 1},
        )
        result.update(
            {
                "body.a@loc": at("body.a", (0, 0, -0.12)),
                "body.b@loc": at("body.b", (0, 0, -0.12)),
                "body.c@loc": at("body.c", (0, 0, -0.12)),
                "body.b": t("body.b", (X, -70 + bounce), (Y, -30)),
                "body.c": t("body.c", (X, 60 - bounce), (Y, 40)),
                "head.a@loc": at("head.a", (-0.06, -0.04, -0.06)),
                "head.b@loc": at("head.b", (-0.08, 0.04, -0.04)),
                "head.c@loc": at("head.c", (-0.1, -0.02, -0.08)),
                "thigh.L.a": t("thigh.L.a", (X, -80), (Y, 20)),
                "thigh.R.b": t("thigh.R.b", (X, 70), (Y, -30)),
                "thigh.L.c": t("thigh.L.c", (X, -60), (Y, -40)),
            }
        )
        return result

    def stagger():
        return group(
            sword={"tilt": 20, "loc": (0, 0.02, -0.08)},
            a={"lean": 34, "chat": 1, "look": 0.8, "wave": -2, "crouch": 0.4},
            b={"lean": -20, "chat": 1, "look": -0.8, "wave": 2, "crouch": 0.3},
            c={"lean": 30, "chat": 1, "look": -0.8, "wave": -2, "crouch": 0.5},
        )

    def low():
        """Crouched low, as a summon starts and a Rebirth stands them up."""
        return group(
            sword={"tilt": 8, "loc": (0, 0, -0.12)},
            a={"lean": 30, "crouch": 1, "wave": -1.5},
            b={"lean": 30, "crouch": 1, "wave": -1.5},
            c={"lean": 30, "crouch": 1, "wave": -1.5},
        )

    def cheer():
        """Up again: they raise the sword and cheer, the jaws wide."""
        return group(
            sword={"tilt": -18, "loc": (0, 0, 0.05)},
            a={"lean": -4, "chat": 1, "wave": 2.0, "look": -0.3},
            b={"lean": -6, "chat": 1, "wave": 2.0},
            c={"lean": -4, "chat": 1, "wave": 2.0, "look": 0.3},
        )

    clips = []
    # The idle: they bob on their own beats and chatter, and now and then
    # turn to each other to agree, very loudly.
    idle = Clip("idle", 48, loop=True)
    for frame, chat, look in (
        (0, (0, 0, 0), (0, 0, 0)),
        (4, (1, 0, 0.6), (0, 0, 0)),
        (8, (0, 1, 0), (0, 0, 0)),
        (12, (0.8, 0, 1), (0, 0, 0)),
        (16, (0, 0.6, 0), (0, 0, 0)),
        (22, (1, 1, 0), (-0.8, 0.8, 0)),
        (26, (0, 0, 1), (-0.8, -0.8, 0.8)),
        (30, (1, 1, 1), (-0.8, -0.8, 0.8)),
        (36, (0, 0.5, 0), (0, 0, 0)),
        (42, (0.6, 0, 0.6), (0, 0, 0)),
        (48, (0, 0, 0), (0, 0, 0)),
    ):
        idle.key(frame, stand(frame / 48, chat, look))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (12, 1), (24, 0), (36, 1), (48, 0)):
        low_hp.key(frame, tired(breath))
    clips.append(low_hp)

    walk = Clip("walk", 20, loop=True)
    for frame in (0, 5, 10, 15, 20):
        walk.key(frame, march(frame / 20))
    clips.append(walk)

    # The attack: a thrust together. The slash effect starts at 50% of the
    # attack (`MELEE_IMPACT` in fx.ts), so the point strikes at frame 15 of 30.
    attack = Clip("attack", 30)
    attack.key(0, stand()).key(9, drawn()).key(15, lunge()).key(20, lunge(0.9)).key(27, stand(0.5)).key(30, stand())
    clips.append(attack)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, jolt()).key(8, jolt(0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, jolt()).key(12, stagger()).key(24, heap()).key(29, heap(8)).key(36, heap())
    clips.append(death)

    # Rebirth: the Unit falls (45% of the event, `REBORN_FALL`), then the
    # bones put themselves together again.
    rebirth = Clip("rebirth", 48)
    rebirth.key(0, stand()).key(4, jolt()).key(20, heap()).key(24, heap(4)).key(33, low()).key(41, cheer()).key(48, stand())
    clips.append(rebirth)

    summon = Clip("summon", 24)
    summon.key(0, low()).key(9, low()).key(17, cheer()).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "chattering-cohort.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
