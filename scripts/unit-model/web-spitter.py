"""
Web Spitter (`feral.webSpitter`), a Unit Model (art direction 2.2).

A tabletop miniature of the card painting: a giant cave spider with friendly
cartoon shapes, not scary. It has a big round furry abdomen with cream
patches, a furry front body with two big shiny black eyes and four small
ones, short hairy fangs, and eight long arched legs with dark and tan bands.
A knight's helmet that it caught, wrapped in web, sits on its back, and it
looks proud of it. Run it in Blender (see `unit_model_kit.py`). It writes
`apps/web/art/units/raw/web-spitter.glb`; then
`bun unit-model:pack web-spitter` packs it for the game.

The figure faces -Y like the other Unit Models. The legs are named L1 to L4
on its left (+X) and R1 to R4 on its right, front to back; each leg has an
upper and a lower bone. It is Long-range: its attack rears up and spits a
web line forward. The `spit` bone scales the line out of its mouth at 20% of
the clip, when the projectile leaves. It has Regenerate: in the cast clip it
rubs its front legs and its round abdomen puffs up (the `abdomen` bone
scales). In the death clip it falls on its back with its legs curled up.
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

FUR = hex_color("#7a5636")
FUR_DARK = hex_color("#4a321e")
FUR_LIGHT = hex_color("#a47a50")
PATCH = hex_color("#d6b486")
BAND = hex_color("#c9a272")
EYE = hex_color("#141216")
SHINE = hex_color("#f4f6fa")
FANG = hex_color("#2a1c14")
MOUTH = hex_color("#5a2a26")
WEB = hex_color("#eef1f4")
WEB_SHADE = hex_color("#c9d6e2")
STEEL = hex_color("#a3a9b1")
STEEL_DARK = hex_color("#5e646c")
VISOR = hex_color("#18181c")
PLUME = hex_color("#b8343a")

# --- Proportions ---------------------------------------------------------------

BODY = Vector((0, -0.06, 0.3))
ABDOMEN = Vector((0, 0.19, 0.37))
ABDOMEN_R = Vector((0.2, 0.22, 0.19))
FACE = Vector((0, -0.19, 0.31))
MOUTH_AT = Vector((0, -0.21, 0.24))
# The web line of the spit: a long thin strand straight out of the mouth.
SPIT_END = MOUTH_AT + Vector((0, -0.55, 0.04))
HELMET = Vector((-0.02, 0.17, 0.58))

# The legs: (yaw from the side to the front in degrees, reach of the knee,
# height of the knee, reach of the foot). The front legs reach forward and
# the back legs back.
LEG_LAYOUT = [(58, 0.22, 0.58, 0.5), (22, 0.24, 0.62, 0.55), (-14, 0.24, 0.61, 0.54), (-50, 0.22, 0.56, 0.5)]


def leg_points(side, index):
    yaw, knee_reach, knee_z, foot_reach = LEG_LAYOUT[index]
    sign = 1 if side == "L" else -1
    direction = Vector((sign * math.cos(math.radians(yaw)), -math.sin(math.radians(yaw)), 0))
    base = BODY + direction * 0.09 + Vector((0, 0, -0.01))
    knee = Vector((BODY.x, BODY.y, 0)) + direction * knee_reach + Vector((0, 0, knee_z))
    foot = Vector((BODY.x, BODY.y, 0)) + direction * foot_reach + Vector((0, 0, 0.015))
    return direction, base, knee, foot


LEGS = {f"{side}{index + 1}": (side, index) for side in ("L", "R") for index in range(4)}

BONES = [
    ("root", (0, 0, 0), (0, 0, 0.1), None),
    ("body", tuple(BODY + Vector((0, 0.08, 0))), tuple(FACE), "root"),
    ("abdomen", tuple(BODY + Vector((0, 0.08, 0.02))), tuple(ABDOMEN + Vector((0, 0.18, 0.04))), "body"),
    ("fangs", tuple(FACE + Vector((0, 0.0, -0.04))), tuple(MOUTH_AT + Vector((0, -0.02, -0.04))), "body"),
    ("spit", tuple(MOUTH_AT), tuple(MOUTH_AT + Vector((0, -0.06, 0.0))), "body"),
]
for name, (side, index) in LEGS.items():
    _direction, base, knee, foot = leg_points(side, index)
    BONES += [
        (f"upper.{name}", tuple(base), tuple(knee), "body"),
        (f"lower.{name}", tuple(knee), tuple(foot), f"upper.{name}"),
    ]

# --- Weights -------------------------------------------------------------------


def leg_weights(name):
    side, index = LEGS[name]
    _direction, base, _knee, _foot = leg_points(side, index)

    def weights(co):
        # The top of the leg goes into the body, so it follows the body there.
        t = clamp01(((co - base).length - 0.02) / 0.05)
        return {f"upper.{name}": t, "body": 1 - t}

    return weights


# --- Parts ---------------------------------------------------------------------


def fur_color(face, center):
    """Brown fur in tufts, darker underneath."""
    if face.normal.z < -0.4:
        return FUR_DARK
    tone = (int(center.x * 67) * 7 + int(center.y * 61) * 11 + int(center.z * 59) * 5) % 6
    if tone == 0:
        return FUR_DARK
    if tone == 1:
        return FUR_LIGHT
    return FUR


def abdomen_color(face, center):
    """The round abdomen: brown, with cream patches down the back in a chevron."""
    local = center - ABDOMEN
    if face.normal.z < -0.4:
        return FUR_DARK
    if local.z > 0.05:
        stripe = abs(local.x) - 0.35 * (local.y + 0.1)
        if -0.03 < stripe < 0.03 or (abs(local.x) < 0.035 and local.y > -0.12):
            return PATCH
    return fur_color(face, center)


def tufts(part, center, radii, count, length, seed=0, only=None, colors=(FUR, FUR_LIGHT, FUR_DARK)):
    """Soft tufts of fur that stand out from an ellipsoid, a little down and back."""
    center = Vector(center)
    golden = math.pi * (3 - math.sqrt(5))
    for index in range(count):
        z = 1 - 2 * (index + 0.5) / count
        r = math.sqrt(max(0.0, 1 - z * z))
        angle = golden * (index + seed)
        direction = Vector((math.cos(angle) * r, math.sin(angle) * r, z))
        if only and not only(direction):
            continue
        normal = Vector((direction.x / radii[0], direction.y / radii[1], direction.z / radii[2])).normalized()
        base = center + Vector((direction.x * radii[0], direction.y * radii[1], direction.z * radii[2])) * 0.95
        out = (normal * 0.6 + Vector((0, 0.35, -0.45))).normalized()
        reach = length * (0.7 + 0.6 * ((index * 7) % 5) / 4)
        verts = kit.cone(part.bm, base, base + out * reach, length * 0.6, 0.004, 4)
        part.paint(faces_of(verts), colors[1] if index % 4 == 1 else (colors[0] if index % 3 else colors[2]))


def body_parts():
    parts = []
    body = Part("body", fur_color, "body", shade=0.2)
    kit.sphere(body.bm, BODY, (0.13, 0.15, 0.11), 12, 8)
    tufts(body, BODY, (0.13, 0.15, 0.11), 40, 0.03, 0, lambda d: d.y > -0.6)
    # The face: two big shiny eyes, four small ones over them, and fuzzy cheeks.
    for sign in (1, -1):
        eye_c = FACE + Vector((0.046 * sign, -0.012, 0.035))
        eye = kit.sphere(body.bm, eye_c, (0.04, 0.034, 0.04), 10, 7)
        body.paint(faces_of(eye), EYE)
        shine = kit.sphere(body.bm, eye_c + Vector((-0.014, -0.03, 0.016)), (0.011, 0.007, 0.011), 5, 4)
        body.paint(faces_of(shine), SHINE)
        for x, z, size in ((0.022, 0.085, 0.014), (0.07, 0.072, 0.012)):
            small_c = FACE + Vector((x * sign, 0.012, z))
            small = kit.sphere(body.bm, small_c, (size, size, size), 6, 4)
            body.paint(faces_of(small), EYE)
            dot = kit.sphere(body.bm, small_c + Vector((-0.004, -size * 0.85, 0.004)), (0.004, 0.003, 0.004), 4, 3)
            body.paint(faces_of(dot), SHINE)
        cheek = kit.sphere(body.bm, FACE + Vector((0.07 * sign, 0.01, -0.01)), (0.04, 0.035, 0.035), 7, 5)
        body.paint(faces_of(cheek), FUR_LIGHT)
        # A short furry palp each side of the fangs.
        palp = kit.tube(body.bm, [FACE + Vector((0.06 * sign, 0.0, -0.03)), FACE + Vector((0.075 * sign, -0.04, -0.08)), FACE + Vector((0.07 * sign, -0.06, -0.15))], [0.02, 0.017, 0.015], 6)
        body.paint(faces_of(palp), FUR_DARK)
        tip = kit.sphere(body.bm, FACE + Vector((0.07 * sign, -0.062, -0.155)), (0.02, 0.02, 0.016), 6, 4)
        body.paint(faces_of(tip), BAND)
    brow = kit.sphere(body.bm, FACE + Vector((0, 0.02, 0.06)), (0.08, 0.04, 0.035), 8, 5)
    body.paint(faces_of(brow), FUR_LIGHT)
    parts.append(body)

    abdomen = Part("abdomen", abdomen_color, "abdomen", shade=0.2)
    kit.sphere(abdomen.bm, ABDOMEN, tuple(ABDOMEN_R), 16, 12)
    tufts(abdomen, ABDOMEN, tuple(ABDOMEN_R), 90, 0.032, 2, lambda d: d.y > -0.7, (FUR, FUR_LIGHT, FUR_DARK))
    # A little spinneret at the back.
    spinneret = kit.cone(abdomen.bm, ABDOMEN + Vector((0, 0.2, -0.04)), ABDOMEN + Vector((0, 0.25, -0.06)), 0.03, 0.012, 6)
    abdomen.paint(faces_of(spinneret), FUR_DARK)
    parts.append(abdomen)

    # The caught helmet on its back, wrapped in web: a round steel helm with a
    # visor slit and a red plume, tipped toward the camera.
    helmet = Part("helmet", STEEL, "abdomen", smooth=False, shade=0.12)
    tilt = Vector((-0.45, -0.25, 1.0)).normalized()
    kit.sphere(helmet.bm, HELMET, (0.08, 0.08, 0.085), 10, 7)
    rest = kit.Matrix.Translation(HELMET) @ tilt.to_track_quat("Z", "Y").to_matrix().to_4x4() @ kit.Matrix.Translation(-HELMET)
    kit.bmesh.ops.transform(helmet.bm, matrix=rest, verts=list(helmet.bm.verts))
    face_dir = Vector((-0.75, -0.6, -0.1)).normalized()
    slit_c = HELMET + face_dir * 0.078 + tilt * 0.005
    side = face_dir.cross(tilt).normalized()
    slit = kit.slab(helmet.bm, slit_c, side * 0.04, tilt * 0.008, face_dir * 0.008)
    helmet.paint(faces_of(slit), VISOR)
    ridge = kit.torus(helmet.bm, HELMET, side, 0.081, 0.008, 12, 4)
    helmet.paint(faces_of(ridge), STEEL_DARK)
    rim = kit.torus(helmet.bm, HELMET - tilt * 0.04, tilt, 0.077, 0.008, 12, 4)
    helmet.paint(faces_of(rim), STEEL_DARK)
    plume = kit.tube(helmet.bm, [HELMET + tilt * 0.08, HELMET + tilt * 0.125 - face_dir * 0.03, HELMET + tilt * 0.115 - face_dir * 0.1], [0.02, 0.022, 0.006], 6)
    helmet.paint(faces_of(plume), PLUME)
    parts.append(helmet)

    web = Part("web", WEB, "abdomen", shade=0.05)
    # Loops of web round the helmet, and strands down to the abdomen.
    for index, normal in enumerate((Vector((1, 0.3, 0.4)), Vector((0.2, 1, 0.2)), Vector((-0.6, 0.4, 0.7)))):
        loop = kit.torus(web.bm, HELMET - tilt * 0.01, normal.normalized(), 0.084, 0.004, 14, 3)
        web.paint(faces_of(loop), WEB if index % 2 == 0 else WEB_SHADE)
    for angle in (0.4, 2.0, 3.4, 5.0):
        top = HELMET + Vector((math.cos(angle) * 0.06, math.sin(angle) * 0.06, -0.03))
        foot = ABDOMEN + Vector((math.cos(angle) * 0.12, math.sin(angle) * 0.1, 0.13))
        kit.tube(web.bm, [top, top.lerp(foot, 0.5) + Vector((0, 0, -0.01)), foot], [0.004, 0.003, 0.004], 4)
    parts.append(web)

    fangs = Part("fangs", FUR_DARK, "fangs", shade=0.12)
    mouth = kit.sphere(fangs.bm, MOUTH_AT + Vector((0, 0.01, 0.01)), (0.03, 0.012, 0.012), 6, 4)
    fangs.paint(faces_of(mouth), MOUTH)
    for sign in (1, -1):
        root = FACE + Vector((0.022 * sign, -0.0, -0.04))
        kit.tube(fangs.bm, [root, root + Vector((0.004 * sign, -0.03, -0.04))], [0.022, 0.016], 6)
        tip = kit.cone(fangs.bm, root + Vector((0.004 * sign, -0.03, -0.04)), root + Vector((-0.004 * sign, -0.035, -0.075)), 0.012, 0.002, 5)
        fangs.paint(faces_of(tip), FANG)
    parts.append(fangs)

    # The web line of the spit: hidden (scaled down) except in the attack.
    spit = Part("spit", WEB, "spit", shade=0.04)
    kit.tube(spit.bm, [MOUTH_AT, MOUTH_AT.lerp(SPIT_END, 0.5) + Vector((0, 0, 0.01)), SPIT_END], [0.012, 0.009, 0.006], 5)
    blob = kit.sphere(spit.bm, SPIT_END, (0.028, 0.03, 0.026), 7, 5)
    spit.paint(faces_of(blob), WEB_SHADE)
    parts.append(spit)
    return parts


def leg_parts():
    parts = []
    for name, (side, index) in LEGS.items():
        direction, base, knee, foot = leg_points(side, index)
        upper = Part(f"upper.{name}", FUR, leg_weights(name), shade=0.12)
        verts = kit.tube(upper.bm, [base, base.lerp(knee, 0.55) + Vector((0, 0, 0.03)), knee], [0.04, 0.038, 0.032], 7)
        for face in faces_of(verts):
            upper.paint([face], FUR_DARK if face.normal.z < -0.3 else FUR)
        band = kit.torus(upper.bm, knee, (knee - base).normalized(), 0.033, 0.01, 8, 3)
        upper.paint(faces_of(band), BAND)
        tufts(upper, base.lerp(knee, 0.5) + Vector((0, 0, 0.02)), (0.026, 0.026, 0.026), 10, 0.022, index, lambda d: d.z > -0.2)
        parts.append(upper)

        lower = Part(f"lower.{name}", FUR_DARK, f"lower.{name}", shade=0.12)
        bend = knee.lerp(foot, 0.45) + direction * 0.03
        kit.tube(lower.bm, [knee, bend, foot + Vector((0, 0, 0.012))], [0.032, 0.027, 0.016], 7)
        middle = kit.torus(lower.bm, bend, (foot - knee).normalized(), 0.028, 0.009, 8, 3)
        lower.paint(faces_of(middle), BAND)
        kit.sphere(lower.bm, knee, (0.035, 0.035, 0.035), 6, 4)
        tufts(lower, knee.lerp(bend, 0.5), (0.02, 0.02, 0.02), 6, 0.018, index + 2, lambda d: d.z > -0.2, (FUR_DARK, FUR, FUR_DARK))
        parts.append(lower)
    return parts


def build_figure():
    kit.reset_scene()
    rig = kit.build_armature("WebSpitter", BONES)
    parts = body_parts() + leg_parts()
    objects = [kit.part_object(part) for part in parts]
    mesh = kit.join_parts(objects, "WebSpitterMesh")
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

    def leg(name, swing=0.0, lift=0.0, curl=0.0):
        """
        One leg: `swing` > 0 moves the foot forward, `lift` > 0 raises the
        knee, `curl` > 0 folds the lower leg in under the knee.
        """
        side, index = LEGS[name]
        sign = 1 if side == "L" else -1
        direction = leg_points(side, index)[0]
        lift_axis = direction.cross(Z).normalized()
        return {
            f"upper.{name}": t(f"upper.{name}", (Z, -sign * swing), (lift_axis, lift)),
            f"lower.{name}": t(f"lower.{name}", (lift_axis, -curl)),
        }

    def legs(**moves):
        """`L1=(swing, lift, curl)` for each leg that moves."""
        result = {}
        for name, move in moves.items():
            result.update(leg(name, *move))
        return result

    def every(swing=0.0, lift=0.0, curl=0.0):
        return legs(**{name: (swing, lift, curl) for name in LEGS})

    def stand(breath=0.0, tap=0.0, sway=0.0):
        """
        The idle stance: proud, the front up a little and turned to the camera,
        the abdomen breathes and the front legs tap the ground in turn.
        """
        return {
            "root": t("root", (Z, -8)),
            "body@loc": at("body", (0, 0, 0.006 * breath)),
            "body": t("body", (X, -4 - breath * 2), (Y, sway * 3)),
            "abdomen": t("abdomen", (X, 4 + breath * 3)),
            "abdomen@scale": 1.0 + 0.025 * breath,
            "fangs": t("fangs", (X, 6 * breath)),
            "spit@scale": 0.01,
            **legs(L1=(0, 14 * max(0.0, tap), 10 * max(0.0, tap)), R1=(0, 14 * max(0.0, -tap), 10 * max(0.0, -tap))),
        }

    def gasp(breath=0.0):
        """Low HP: the legs splay and the body sinks low; the abdomen heaves."""
        return pose(
            stand(),
            body_at_loc=at("body", (0, 0, -0.05 - 0.006 * breath)),
            body=t("body", (X, 6)),
            abdomen=t("abdomen", (X, -6 + breath * 3)),
            abdomen_at_scale=1.0 + 0.04 * breath,
            fangs=t("fangs", (X, 10)),
            **every(0, 12, 0),
        )

    def flinch(base, amount=1.0):
        """The hit: the body bounces back and the legs pull in."""
        return pose(
            base,
            body_at_loc=at("body", (0, 0.03 * amount, -0.02 * amount)),
            body=t("body", (X, -14 * amount)),
            abdomen=t("abdomen", (X, 10 * amount)),
            abdomen_at_scale=1.0 - 0.06 * amount,
            fangs=t("fangs", (X, 16 * amount)),
            **every(0, 12 * amount, 0),
        )

    def topple(base):
        """It tips onto its side as it dies."""
        return pose(
            base,
            root=t("root", (Z, -8), (Y, 70)),
            root_at_loc=at("root", (-0.1, 0, 0.36)),
            body=t("body", (X, -10)),
            fangs=t("fangs", (X, 18)),
            **every(0, 30, 50),
        )

    def on_back(base, bounce=0.0):
        """On its back, the legs curled up: the classic spider end. It rests on the caught helmet."""
        return pose(
            base,
            root=t("root", (Z, -8), (Y, 178 - bounce)),
            root_at_loc=at("root", (0, 0, 0.7 + 0.01 * bounce)),
            body=t("body", (X, -6)),
            abdomen=t("abdomen", (X, 4)),
            fangs=t("fangs", (X, 20)),
            # The body is upside down, so a lift down in the figure raises the knees.
            **every(0, -60, 70),
        )

    def rolling(base):
        """Half way over, high on its side, so the legs stay out of the ground."""
        return pose(
            base,
            root=t("root", (Z, -8), (Y, 125)),
            root_at_loc=at("root", (-0.05, 0, 0.62)),
            body=t("body", (X, -8)),
            fangs=t("fangs", (X, 20)),
            **every(0, -20, 40),
        )

    def dropped(base):
        """Up in the air with the legs folded in, as a summon starts: it drops down from the cave roof."""
        return pose(
            base,
            root_at_loc=at("root", (0, 0, 0.5)),
            root_at_scale=0.6,
            body=t("body", (X, 10)),
            **every(0, 30, 70),
        )

    def land(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0, -0.05)),
            abdomen_at_scale=1.06,
            **every(0, 10, 6),
        )

    def proud(base):
        """The front up and the front legs raised: here I am."""
        return pose(
            base,
            body=t("body", (X, -10)),
            abdomen=t("abdomen", (X, 10)),
            fangs=t("fangs", (X, 12)),
            **legs(L1=(10, 40, 30), R1=(10, 40, 30), L2=(4, 10, 6), R2=(4, 10, 6), L3=(0, 8, 0), R3=(0, 8, 0), L4=(0, 14, 0), R4=(0, 14, 0)),
        )

    def stride(phase):
        """
        The scuttle: two groups of four legs, L1 R2 L3 R4 and R1 L2 R3 L4,
        step in turn. The body bobs a little at each step.
        """
        result = pose(stand(), body_at_loc=at("body", (0, 0, 0.008 * abs(math.sin(phase * 4 * math.pi)))))
        moves = {}
        for name, (side, index) in LEGS.items():
            group = (index + (0 if side == "L" else 1)) % 2
            local = (phase + 0.5 * group) % 1.0
            if local < 0.5:
                u = local / 0.5
                moves[name] = (lerp(-12, 12, u), 22 * math.sin(u * math.pi), 10 * math.sin(u * math.pi))
            else:
                u = (local - 0.5) / 0.5
                moves[name] = (lerp(12, -12, u), 0.0, 0.0)
        return pose(result, **legs(**moves))

    # The attack (Long-range): it rears up and spits the web line forward at
    # frame 6 of 30 (20%, when the projectile leaves), then the line goes
    # back in and it drops back down.
    def rear(base):
        return pose(
            base,
            body_at_loc=at("body", (0, 0.03, 0.03)),
            body=t("body", (X, -20)),
            abdomen=t("abdomen", (X, 16)),
            abdomen_at_scale=1.05,
            fangs=t("fangs", (X, 18)),
            **legs(L1=(14, 50, 40), R1=(14, 50, 40), L3=(0, 8, 0), R3=(0, 8, 0), L4=(0, 16, 0), R4=(0, 16, 0)),
        )

    def spit(base, out=1.0):
        return pose(
            base,
            body_at_loc=at("body", (0, -0.02, 0.0)),
            body=t("body", (X, -8)),
            abdomen=t("abdomen", (X, 4)),
            abdomen_at_scale=0.94,
            fangs=t("fangs", (X, -10)),
            spit_at_scale=max(0.01, out),
            **legs(L1=(6, 24, 16), R1=(6, 24, 16)),
        )

    # The cast (Regenerate): it rubs its front legs together and the round
    # abdomen puffs up and settles.
    def rub(base, side=1.0, puff=1.0):
        return pose(
            base,
            body=t("body", (X, -10), (Y, 4 * side)),
            abdomen=t("abdomen", (X, 6)),
            abdomen_at_scale=1.0 + 0.14 * puff,
            fangs=t("fangs", (X, 8)),
            **legs(L1=(-4 + 10 * side, 34, 50), R1=(-4 - 10 * side, 34, 50), L3=(0, 6, 0), R3=(0, 6, 0), L4=(0, 12, 0), R4=(0, 12, 0)),
        )

    clips = []
    idle = Clip("idle", 48, loop=True)
    for frame, breath, tap, sway in ((0, 0, 0, 0), (6, 0.25, 1, 0.5), (12, 0.5, 0, 1), (24, 1, 0, 0), (30, 0.75, -1, -0.5), (36, 0.5, 0, -1), (48, 0, 0, 0)):
        idle.key(frame, stand(breath, tap, sway))
    clips.append(idle)

    low_hp = Clip("lowHp", 48, loop=True)
    for frame, breath in ((0, 0), (24, 1), (48, 0)):
        low_hp.key(frame, gasp(breath))
    clips.append(low_hp)

    walk = Clip("walk", 16, loop=True)
    for frame in range(0, 17, 2):
        walk.key(frame, stride(frame / 16))
    clips.append(walk)

    attack = Clip("attack", 30)
    attack.key(0, stand()).key(4, rear(stand())).key(6, spit(stand(), 0.4)).key(8, spit(stand(), 1.0))
    attack.key(14, spit(stand(), 1.0)).key(19, spit(stand(), 0.05)).key(26, stand()).key(30, stand())
    clips.append(attack)

    cast = Clip("cast", 30)
    cast.key(0, stand()).key(6, rub(stand(), 1, 0.3)).key(10, rub(stand(), -1, 0.6)).key(14, rub(stand(), 1, 1.0))
    cast.key(18, rub(stand(), -1, 1.0)).key(23, pose(proud(stand()), abdomen_at_scale=1.05)).key(30, stand())
    clips.append(cast)

    hurt = Clip("hurt", 16)
    hurt.key(0, stand()).key(3, flinch(stand())).key(8, flinch(stand(), 0.4)).key(16, stand())
    clips.append(hurt)

    death = Clip("death", 36)
    death.key(0, stand()).key(5, flinch(stand())).key(14, topple(stand())).key(19, rolling(stand()))
    death.key(24, on_back(stand())).key(29, on_back(stand(), 6)).key(36, on_back(stand()))
    clips.append(death)

    summon = Clip("summon", 24)
    summon.key(0, dropped(stand())).key(7, pose(dropped(stand()), root_at_scale=1.0, root_at_loc=at("root", (0, 0, 0.15))))
    summon.key(10, land(stand())).key(16, proud(stand())).key(20, proud(stand())).key(24, stand())
    clips.append(summon)
    return clips


def build(export=True):
    rig, mesh = build_figure()
    baked = [kit.bake_clip(rig, {}, clip) for clip in build_clips(rig)]
    kit.remove_controls(rig, {})
    if export:
        os.makedirs(os.path.join(REPO, "apps", "web", "art", "units", "raw"), exist_ok=True)
        kit.push_to_nla(rig, baked)
        kit.export_glb(rig, mesh, os.path.join(REPO, "apps", "web", "art", "units", "raw", "web-spitter.glb"))
    return rig, mesh, baked


if __name__ == "__main__":
    import time

    started = time.time()
    rig, mesh, baked = build(export=globals().get("EXPORT", True))
    triangles = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
    print("bones", len(rig.data.bones), "triangles", triangles, "clips", [a.name for a in baked], "seconds", round(time.time() - started, 1))
