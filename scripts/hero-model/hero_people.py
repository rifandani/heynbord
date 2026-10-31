"""The people of the first Hero Model references: body, face, hair and clothing.

Both people use the same bone names and hierarchy. Their bone positions
differ a little for height and build (decision 17). The painted concept
images in `apps/web/art/heroes/source/` define each person.
"""
import math

from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

import hero_kit as hk
from hero_kit import mix, smoothstep

SIDES = (("L", 1), ("R", -1))


class Build:
    """The proportions of one person, in Blender units (the figure is about 1 tall)."""

    def __init__(self, **values):
        self.__dict__.update(values)


PEOPLE = {
    "standard": Build(
        scale=1.0, shoulder=.118, hip=.058, head=(.062, .073, .084), head_z=.91,
        skin="#c98d68", skin_shade="#9c5f45", lip="#a5584a", blush="#d98f78", iris="#4a3020",
        brow="#2f2019", hair="#3b2a20", hair_light="#6a4a33",
    ),
    "tent-rings": Build(
        scale=.94, shoulder=.124, hip=.068, head=(.066, .072, .081), head_z=.916,
        skin="#b8765a", skin_shade="#8a4e3a", lip="#b0473e", blush="#d27a66", iris="#3a2418",
        brow="#2a1c18", hair="#2c1f1b", hair_light="#5a3a2c", smile=True,
    ),
    # The six people after the first references (hero_cast.py). `wide`,
    # `deep`, `hips` and `belly` scale the torso of the Standard person.
    "dawn-gaze": Build(
        scale=.965, shoulder=.11, hip=.056, head=(.057, .07, .081), head_z=.912,
        skin="#dba57e", skin_shade="#ad7352", lip="#b86458", blush="#e39c82", iris="#b07a24",
        brow="#4a2e1c", hair="#5a3a22", hair_light="#a0703e", jaw_chin=(.86, .56), nose=.92,
        wide=.93, deep=.95, hips=.98, belly=0.0,
    ),
    "verdant-crest": Build(
        scale=1.045, shoulder=.122, hip=.058, head=(.059, .074, .088), head_z=.905,
        skin="#c48862", skin_shade="#93593e", lip="#9e5646", blush="#cf7d64", iris="#7a8c6a",
        brow="#3a281c", hair="#5a3e26", hair_light="#8e6842", jaw_chin=(.88, .64), nose=1.15,
        age=.4, brow_weight=1.2, wide=1.03, deep=1.0, hips=1.0, belly=0.0,
    ),
    "mesa-shade": Build(
        scale=1.0, shoulder=.118, hip=.058, head=(.06, .073, .083), head_z=.91,
        skin="#a86a46", skin_shade="#7a4630", lip="#8e4a3a", blush="#b8705a", iris="#2a1a12",
        brow="#1e1410", hair="#241812", hair_light="#4a3226", jaw_chin=(.9, .6), brow_weight=1.35,
        wide=1.0, deep=1.0, hips=1.02, belly=0.0,
    ),
    "salt-wind": Build(
        scale=.975, shoulder=.128, hip=.064, head=(.067, .074, .084), head_z=.908,
        skin="#c98c6a", skin_shade="#985a42", lip="#a85a4a", blush="#d88470", iris="#6c8794",
        brow="#a8a49c", hair="#a8a49c", hair_light="#e2ded6", jaw_chin=(.96, .72), smile=True,
        age=.85, brow_weight=1.35, wide=1.08, deep=1.08, hips=1.08, belly=.6,
    ),
    "lantern-keeper": Build(
        scale=.945, shoulder=.112, hip=.062, head=(.062, .071, .081), head_z=.912,
        skin="#7a4a30", skin_shade="#53301e", lip="#6e3628", blush="#94523a", iris="#4a2a16",
        brow="#8a8480", hair="#bdb8b0", hair_light="#eae6de", jaw_chin=(.9, .64), smile=True,
        age=.7, wide=.95, deep=1.0, hips=1.06, belly=.3,
    ),
    "gold-crest": Build(
        scale=1.05, shoulder=.127, hip=.06, head=(.064, .074, .087), head_z=.906,
        skin="#d2a07e", skin_shade="#a06c50", lip="#a8604e", blush="#d88c74", iris="#97a3ab",
        brow="#b8b4ae", hair="#c2beb6", hair_light="#eeeae2", jaw_chin=(.97, .76), nose=1.08,
        age=.55, brow_weight=1.25, wide=1.07, deep=1.04, hips=1.02, belly=.15,
    ),
}


def _marks():
    """The painted marks of the faces: freckles, scars and soot (hero_cast.py)."""
    import hero_cast

    PEOPLE["dawn-gaze"].marks = (hero_cast.freckles, hero_cast.scar(.016, .02, .005, 1.25))
    PEOPLE["gold-crest"].marks = (hero_cast.scar(-.022, .022, .009, 1.35),)
    PEOPLE["lantern-keeper"].marks = (hero_cast.soot(-.034, -.028, .016), hero_cast.scar(.006, -.075, .004, .3, "#9a5a42"))
    PEOPLE["verdant-crest"].marks = ()


def skeleton(person):
    """The shared bones, placed for one person: (name, head, tail, parent)."""
    b = PEOPLE[person]
    s = b.scale

    def p(x, y, z):
        return (x, y, z * s)

    bones = [
        ("root", (0, 0, 0), (0, 0, .1), None),
        ("hips", p(0, 0, .505), p(0, 0, .60), "root"),
        ("spine", p(0, 0, .60), p(0, 0, .70), "hips"),
        ("chest", p(0, 0, .70), p(0, 0, .80), "spine"),
        ("neck", p(0, 0, .80), p(0, 0, .855), "chest"),
        ("head", p(0, 0, .855), p(0, 0, 1.0), "neck"),
        ("banner", p(.07, .095, 1.02), p(.21, .095, 1.02), "chest"),
    ]
    for side, sign in SIDES:
        sh, hp = b.shoulder, b.hip
        bones += [
            (f"shoulder.{side}", p(.02 * sign, 0, .78), p((sh - .006) * sign, 0, .772), "chest"),
            (f"upperarm.{side}", p(sh * sign, 0, .772), p((sh + .03) * sign, .005, .60), f"shoulder.{side}"),
            (f"forearm.{side}", p((sh + .03) * sign, .005, .60), p((sh + .047) * sign, -.02, .45), f"upperarm.{side}"),
            (f"hand.{side}", p((sh + .047) * sign, -.02, .45), p((sh + .052) * sign, -.026, .385), f"forearm.{side}"),
            (f"thigh.{side}", p(hp * sign, 0, .505), p((hp + .006) * sign, 0, .285), "hips"),
            (f"shin.{side}", p((hp + .006) * sign, 0, .285), p((hp + .008) * sign, .008, .065), f"thigh.{side}"),
            (f"foot.{side}", p((hp + .008) * sign, .008, .065), p((hp + .01) * sign, -.075, .018), f"shin.{side}"),
        ]
    return bones


def joints(bones):
    return {name: (Vector(head), Vector(tail)) for name, head, tail, _parent in bones}


def lerp3(a, b, t):
    return Vector(a).lerp(Vector(b), t)


# --- Head ------------------------------------------------------------------


def _surface(bm, x, z, depth=0.0):
    """The front surface of the head at (x, z), moved `depth` inside."""
    tree = BVHTree.FromBMesh(bm)
    hit = tree.ray_cast(Vector((x, -1, z)), Vector((0, 1, 0)))
    if hit[0] is None:
        raise ValueError(f"no head surface at {x}, {z}")
    return hit[0] + Vector((0, 1, 0)) * depth


def _profile(u, jaw, chin):
    """The width of the head at height u (-1 chin, 1 crown), as a factor."""
    if u > -.15:
        return 1.0 - .04 * smoothstep(.55, 1, u)
    if u > -.62:
        return 1.0 - (1 - jaw) * smoothstep(-.15, -.62, u)
    return jaw - (jaw - chin) * smoothstep(-.62, -1.0, u)


def _age_lines(color, co, b, hz, k, age):
    """Painted lines of age: the forehead, the corners of the eyes and the folds beside the mouth."""
    line = mix(b.skin_shade, "#3a2218", .25)
    # Two soft lines across the forehead.
    for z in (hz + .04 * k, hz + .05 * k):
        d = abs(co.z - z - .002 * k * math.cos(co.x / (.03 * k))) / (.0016 * k)
        color = mix(color, line, (1 - smoothstep(.2, 1, d)) * smoothstep(.04 * k, .02 * k, abs(co.x)) * .45 * age)
    for sign in (1, -1):
        # Crow's feet at the outer corners of the eyes.
        x = co.x * sign - .043 * k
        if 0 < x < .012 * k:
            for slope in (-.5, 0, .5):
                d = abs(co.z - (hz - .004 * k) - slope * x) / (.0011 * k)
                color = mix(color, line, (1 - smoothstep(.2, 1, d)) * .35 * age)
        # The fold from the nose wing to the corner of the mouth.
        t = (hz - .036 * k - co.z) / (.026 * k)
        if 0 < t < 1:
            fold_x = (.016 + .008 * t) * k
            d = abs(co.x * sign - fold_x) / (.0018 * k)
            color = mix(color, line, (1 - smoothstep(.2, 1, d)) * (1 - t * .5) * .5 * age)
    return color


def head(fig, person):
    """A sculpted head with a separate nose, lips, eyes, lids, brows and ears."""
    b = PEOPLE[person]
    s = b.scale
    rx, ry, rz = b.head
    hz = b.head_z * s
    k = rz / .077
    smile = getattr(b, "smile", False)
    age = getattr(b, "age", 0.0)

    def skin_color(co, _n):
        color = hk.rgb(b.skin)
        for sign in (1, -1):
            cheek = math.hypot((co.x - .036 * k * sign) / (.022 * k), (co.z - (hz - .028 * k)) / (.017 * k))
            color = mix(color, b.blush, (1 - smoothstep(.1, 1.0, cheek)) * (.6 if smile else .32) * (co.y < -.02))
        color = mix(color, b.skin_shade, smoothstep(hz - .055 * k, hz - .1 * k, co.z) * .55)
        # A soft shade over the eyes, under the brow.
        for sign in (1, -1):
            lid = math.hypot((co.x - .025 * k * sign) / (.015 * k), (co.z - (hz + .002 * k)) / (.008 * k))
            color = mix(color, b.skin_shade, (1 - smoothstep(.3, 1, lid)) * .3 * (co.y < -.03))
        if age and co.y < -.02:
            color = _age_lines(color, co, b, hz, k, age)
        for mark in getattr(b, "marks", ()):
            color = mark(co, color, hz, k)
        return color

    piece = fig.piece("head", skin_color, {"head": 1.0, "neck": .2}, smooth=1)
    bm = piece.bm
    verts = hk.ellipsoid(bm, (0, .003, hz), (rx, ry, rz), 34, 26)
    jaw, chin = getattr(b, "jaw_chin", None) or ((.93, .66) if smile else (.9, .6))
    for v in verts:
        u = (v.co.z - hz) / rz
        v.co.x *= _profile(u, jaw, chin)
        if v.co.y > 0:
            # The back of the skull is full; under it, the head meets the neck.
            v.co.y *= 1 - .45 * smoothstep(-.1, -.85, u)
        else:
            v.co.y *= 1 - .1 * smoothstep(-.3, -.95, u)
    hk.push(verts, (0, .06 * k, hz + .02 * k), .06 * k, (0, .006 * k, .004 * k))
    eye_z = hz - .004 * k
    mouth_z = hz - .052 * k
    for sign in (1, -1):
        hk.push(verts, _surface(bm, .036 * k * sign, hz - .025 * k), .028 * k, (.003 * sign, -.004 * k if smile else -.002 * k, .001))
        hk.push(verts, _surface(bm, .025 * k * sign, eye_z), .02 * k, (0, .006 * k, 0))
        hk.push(verts, _surface(bm, .025 * k * sign, eye_z + .018 * k), .02 * k, (0, -.004 * k, .001))
        hk.push(verts, _surface(bm, .034 * k * sign, hz - .05 * k), .025 * k, (.003 * sign, 0, 0))
    hk.push(verts, _surface(bm, 0, hz - .072 * k), .026 * k, (0, -.006 * k, -.003 * k))
    hk.push(verts, _surface(bm, 0, mouth_z), .022 * k, (0, -.004 * k, 0))
    hk.push(verts, _surface(bm, 0, hz - .062 * k), .012 * k, (0, .003 * k, 0))

    # The nose: a clear ridge from the brow to a rounded tip, with wings.
    nose = fig.piece("nose", skin_color, "head", smooth=1)
    bridge = _surface(bm, 0, eye_z + .006 * k)
    tip_base = _surface(bm, 0, hz - .03 * k)
    tip_out = (.0085 * k if not smile else .0078 * k) * getattr(b, "nose", 1.0)
    rings = [
        (bridge + Vector((0, .004, -.002 * k)), .0042 * k, .0026 * k),
        (bridge.lerp(tip_base, .5) + Vector((0, -.0022 * k, 0)), .0046 * k, .0034 * k),
        (tip_base + Vector((0, -tip_out * .85, .0025 * k)), .006 * k, .0052 * k),
        (tip_base + Vector((0, -tip_out * .7, -.0028 * k)), .0058 * k, .0048 * k),
        (tip_base + Vector((0, -.003 * k, -.005 * k)), .004 * k, .003 * k),
    ]
    hk.loft(nose.bm, [{"c": c, "rx": a, "ry": d} for c, a, d in rings], sides=8)
    for sign in (1, -1):
        hk.ellipsoid(nose.bm, tip_base + Vector((.0058 * k * sign, -tip_out * .45, -.003 * k)), (.0038 * k, .004 * k, .0034 * k), 8, 6)

    # The lips: a firm line, or a warm smile with lifted corners.
    lips = fig.piece("lips", b.lip, "head", smooth=1, ao=.6)
    width = (.0185 if smile else .0165) * k
    lift = .0045 * k if smile else -.0005 * k
    for row, (dz, depth, thick, factor) in enumerate(((.0026, .0012, .0017, 1.0), (-.0034, .0012, .0024, .8))):
        points = []
        for step in range(7):
            t = step / 6 * 2 - 1
            x = t * width * factor
            surface = _surface(bm, x, mouth_z + dz * k)
            curve = lift * t * t
            points.append((surface + Vector((0, -depth * k * (1 - t * t * .7), curve)), thick * k * (1 - .55 * t * t)))
        hk.loft(lips.bm, [{"c": c, "rx": r, "ry": r * .8, "dir": (0, 0, 1)} for c, r in points], sides=6)
    line = fig.piece("mouth-line", "#4a1f1a", "head", smooth=1, ao=.3)
    points = []
    for step in range(7):
        t = step / 6 * 2 - 1
        x = t * width * 1.02
        surface = _surface(bm, x, mouth_z)
        points.append((surface + Vector((0, -.0022 * k * (1 - t * t * .8), lift * t * t * 1.1)), .001 * k))
    hk.loft(line.bm, [{"c": c, "rx": r, "ry": r} for c, r in points], sides=5)

    for side, sign in SIDES:
        socket = _surface(bm, .025 * k * sign, eye_z)
        radius = .0125 * k
        center = socket + Vector((0, radius * .55, 0))

        def eye_color(co, _n, center=center):
            d = (co - center).normalized()
            angle = math.acos(max(-1, min(1, d.dot(Vector((.1 if co.x > 0 else -.1, -1, .02)).normalized()))))
            light = math.acos(max(-1, min(1, d.dot(Vector((.4, -1, .5)).normalized()))))
            if light < .17:
                return "#fff8ec"
            if angle < .26:
                return "#100a08"
            if angle < .6:
                return mix(b.iris, "#100a08", smoothstep(.58, .4, angle) * .25)
            if angle < .66:
                return "#2a1a12"
            return mix("#f0e6d6", "#cdbba6", smoothstep(-.3, .7, d.z))

        eye = fig.piece("eye" + side, eye_color, "head", smooth=0, ao=.25)
        hk.ellipsoid(eye.bm, center, (radius, radius * .8, radius * .86), 20, 16)
        lid = fig.piece("lid" + side, "#22140e", "head", smooth=1, ao=.2)
        upper = [
            (center + Vector((-.0128 * k * sign, -radius * .45, .0015 * k)), .0009 * k),
            (center + Vector((-.006 * k * sign, -radius * .85, .0082 * k)), .0021 * k),
            (center + Vector((.0045 * k * sign, -radius * .88, .0088 * k)), .0022 * k),
            (center + Vector((.0125 * k * sign, -radius * .52, .0035 * k)), .0016 * k),
            (center + Vector((.0158 * k * sign, -radius * .2, .0026 * k)), .0006 * k),
        ]
        hk.loft(lid.bm, [{"c": c, "rx": r, "ry": r * 1.5, "dir": (0, 0, 1)} for c, r in upper], sides=6)
        cover = fig.piece("lid-skin" + side, mix(b.skin, b.skin_shade, .25), "head", smooth=1, ao=.5)
        dome = hk.ellipsoid(cover.bm, center + Vector((0, .0008, .0035 * k)), (radius * 1.12, radius * .92, radius * .7), 14, 10)
        hk.bmesh.ops.delete(cover.bm, geom=[v for v in dome if v.co.z < center.z + .0042 * k - abs(v.co.x - center.x) * .25], context="VERTS")
        lower = fig.piece("lower-lid" + side, mix(b.skin, b.skin_shade, .4), "head", smooth=1, ao=.4)
        bottom = [
            (center + Vector((-.0115 * k * sign, -radius * .5, -.003 * k)), .0007 * k),
            (center + Vector((0, -radius * .86, -.0078 * k)), .0012 * k),
            (center + Vector((.012 * k * sign, -radius * .5, -.003 * k)), .0007 * k),
        ]
        hk.loft(lower.bm, [{"c": c, "rx": r, "ry": r} for c, r in bottom], sides=5)
        brow = fig.piece("brow" + side, b.brow, "head", smooth=1, ao=.2)
        inner = .001 * k if smile else -.004 * k
        arch = .004 * k if smile else .0012 * k
        heavy = getattr(b, "brow_weight", 1.0)
        points = [
            (_surface(bm, .008 * k * sign, eye_z + .018 * k + inner, -.0015), .0034 * k * heavy),
            (_surface(bm, .02 * k * sign, eye_z + .022 * k + arch, -.0015), .0038 * k * heavy),
            (_surface(bm, .033 * k * sign, eye_z + .021 * k + arch * .6, -.0015), .003 * k * heavy),
            (_surface(bm, .043 * k * sign, eye_z + .013 * k, -.0015), .0013 * k * heavy),
        ]
        hk.loft(brow.bm, [{"c": c, "rx": r, "ry": r * .6, "dir": (0, -1, .25)} for c, r in points], sides=6)
        ear = fig.piece("ear" + side, mix(b.skin, b.blush, .25), "head", smooth=1)
        ear_center = Vector(((rx * _profile(-.15, jaw, chin) - .004) * sign, .008 * k, hz - .014 * k))
        shape = hk.ellipsoid(ear.bm, ear_center, (.006 * k, .0115 * k, .017 * k), 10, 8)
        hk.rotate_about(ear.bm, shape, ear_center, (0, 0, 1), -20 * sign)
        hk.rotate_about(ear.bm, shape, ear_center, (1, 0, 0), -8)
        hk.push(shape, ear_center + Vector((.006 * k * sign, -.002 * k, .002 * k)), .011 * k, (-.004 * k * sign, 0, 0))
    return hz


def neck(fig, person, color):
    b = PEOPLE[person]
    s = b.scale
    hz = b.head_z * s
    piece = fig.piece("neck", color, {"neck": 1.0, "chest": .5, "head": .35}, smooth=1)
    hk.loft(piece.bm, [
        {"c": (0, .006, .775 * s), "rx": .046, "ry": .041},
        {"c": (0, .008, .805 * s), "rx": .04, "front": .035, "back": .039},
        {"c": (0, .012, hz - .045), "rx": .037, "front": .032, "back": .037},
        {"c": (0, .018, hz - .01), "rx": .033, "ry": .032},
    ], sides=14, caps=(False, False))


# --- Hair ------------------------------------------------------------------


def strand(bm, points, width, thickness, up=(0, 0, 1), tip=.3):
    """A lock of hair along `points`, flat across `up`, with a blunt or sharp tip."""
    count = len(points)
    rings = []
    for index, point in enumerate(points):
        t = index / (count - 1)
        taper = (1 - t * (1 - tip)) * min(1.0, .7 + 2 * t)
        rings.append({"c": point, "rx": max(width * taper, .0006), "ry": max(thickness * taper, .0005), "dir": up})
    hk.loft(bm, rings, sides=8)


def _hairline(front, top, side, back):
    """The height of the hairline above the head center at a front factor (-1 back, 1 front)."""
    if front >= 0:
        return side + (top - side) * smoothstep(0, 1, front)
    return side + (back - side) * smoothstep(0, 1, -front)


def hair_mass(fig, b, hz, line, volume, color, name="hair", sides=.006, ridges=.008):
    """A solid hair volume over the skull, with clumped ridges, tucked under the scalp at the hairline."""
    rx, ry, rz = b.head
    k = rz / .077
    center = Vector((0, .006, hz + .006 * k))
    radii = Vector((rx + sides * k, ry + .009 * k, rz + .008 * k))
    piece = fig.piece(name, color, "head", smooth=1, ao=1.1)
    verts = hk.ellipsoid(piece.bm, center, radii, 32, 22)
    for v in verts:
        local = v.co - center
        unit = Vector((local.x / radii.x, local.y / radii.y, local.z / radii.z))
        top = smoothstep(.1, .95, unit.z)
        azimuth = math.atan2(unit.y, unit.x)
        ridge = abs(math.sin(azimuth * 9 + unit.z * 6 + unit.x * 3)) ** .5
        lump = .5 + .5 * hk.noise.noise(v.co * 60)
        out = volume * top + (ridges * ridge + .004 * lump) * k * smoothstep(-.5, .5, unit.z)
        v.co += local.normalized() * out
    kill = []
    skull = Vector((0, .003, hz))
    for v in verts:
        local = v.co - center
        front = -local.y / radii.y
        depth = _hairline(front, *line) - local.z
        if depth > .03 * k:
            kill.append(v)
        elif depth > -.006 * k:
            tuck = smoothstep(-.006 * k, .008 * k, depth)
            v.co = skull + (v.co - skull) * (1 - .32 * tuck)
    hk.bmesh.ops.delete(piece.bm, geom=kill, context="VERTS")
    return center, radii


def hair_streaks(b, hz, k):
    """Painted strands: darker grooves and warm light on the top."""

    def color(co, _n):
        streak = .5 + .5 * math.sin(math.atan2(co.y, co.x) * 34 + co.z * 120)
        light = smoothstep(hz + .03 * k, hz + .1 * k, co.z) * .45 + streak * .22
        return mix(b.hair, b.hair_light, light + .1 * hk.noise.noise(co * 160))

    return color


def surface_lock(bm, center, radii, start, end, width, lift=(.004, .01), bulge=.006, tip=.3, thickness=.0065, points=5):
    """A flat lock that lies on the hair volume from `start` to `end` (azimuth, elevation)."""
    rings = []
    for index in range(points):
        t = index / (points - 1)
        a = start[0] + (end[0] - start[0]) * t
        e = start[1] + (end[1] - start[1]) * t
        unit = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e)))
        position = center + Vector((unit.x * radii.x, unit.y * radii.y, unit.z * radii.z))
        position += unit * (lift[0] + (lift[1] - lift[0]) * t + bulge * math.sin(math.pi * t))
        taper = (1 - t * (1 - tip)) * min(1.0, .75 + 2 * t)
        rings.append({"c": position, "rx": width * taper, "ry": thickness * taper, "dir": unit})
    hk.loft(bm, rings, sides=6)


FRONT = -math.pi / 2
BACK = math.pi / 2


def hair_standard(fig, b, hz):
    """Short, thick, tousled hair with a fringe to the figure's right, as in the concept."""
    rx, ry, rz = b.head
    k = rz / .077
    hair_color = hair_streaks(b, hz, k)
    center, radii = hair_mass(fig, b, hz, (.062 * k, -.002 * k, -.05 * k), .004 * k, hair_color, ridges=.003)
    locks = fig.piece("hair-locks", hair_color, "head", smooth=1, ao=1.1)
    bm = locks.bm
    # The crown: locks from the whorl at the back of the top, down the back and sides.
    for n in range(12):
        a = BACK + (n - 5.5) * .36
        side = math.cos(a)
        end_e = (-.18 + .07 * ((n * 7) % 3)) if math.sin(a) > .3 else .02
        surface_lock(bm, center, radii, (BACK + (n - 5.5) * .08, 1.25), (a - .25, end_e), .024 * k, (.006 * k, .006 * k), .007 * k, .35)
    # The top: layered locks that sweep forward and to the figure's right.
    for n in range(7):
        a = FRONT + (n - 3) * .42
        surface_lock(bm, center, radii, (a + .9, 1.2), (a - .2, .55), .026 * k, (.008 * k, .012 * k), .01 * k, .3)
    # The fringe falls over the brow toward the figure's right.
    for n, (offset, end_e, width) in enumerate(((.42, .42, .02), (.18, .32, .024), (-.06, .3, .025), (-.3, .34, .023), (-.55, .4, .02))):
        a = FRONT + offset
        surface_lock(bm, center, radii, (a + .25, .95), (a - .32, end_e), width * k, (.01 * k, .016 * k), .01 * k, .25)
    # Short locks over the ears.
    for side, sign in SIDES:
        a = 0 if sign > 0 else math.pi
        for offset in (-.55, -.2, .15):
            start = (a + (offset - .1) * sign, .85)
            end = (a + (offset + .22) * sign, -.06 if offset > -.4 else .04)
            surface_lock(bm, center, radii, start, end, .022 * k, (.005 * k, .006 * k), .004 * k, .4)


def curly(piece, center, radii, size, segments=20, rings=14, turn=0.0):
    """A hair mass with a cellular surface: each cell bulges into one curl."""
    verts = hk.ellipsoid(piece.bm, center, radii, segments, rings)
    if turn:
        hk.rotate_about(piece.bm, verts, center, (0, 0, 1), turn)
    for v in verts:
        normal = (v.co - Vector(center)).normalized()
        cell = hk.noise.noise(v.co / size, noise_basis="VORONOI_F1")
        v.co += normal * size * (.55 - .9 * min(cell, 1.0))
    return verts


def ringlet(bm, top, drop, coil, radius, turns, phase=0.0, sway=(0, 0, 0)):
    """A corkscrew curl that hangs from `top` by `drop`."""
    points = []
    steps = max(8, int(turns * 8))
    for n in range(steps + 1):
        t = n / steps
        a = phase + 2 * math.pi * turns * t
        r = coil * (.75 + .25 * t)
        points.append(Vector(top) + Vector((r * math.cos(a), r * math.sin(a), -drop * t)) + Vector(sway) * t * t)
    hk.loft(bm, [{"c": p, "rx": radius * (1 - .35 * (i / steps)), "ry": radius * (1 - .35 * (i / steps))} for i, p in enumerate(points)], sides=6)


def hair_tent_rings(fig, b, hz):
    """Dark ringlets under the headscarf: at the brow, framing the face to the jaw and at the nape."""
    rx, ry, rz = b.head
    k = rz / .077

    def hair_color(co, n):
        return mix(b.hair, b.hair_light, smoothstep(-.4, .9, n.z) * .55 + .2 * hk.noise.noise(co * 260))

    under = fig.piece("hair-under", b.hair, {"head": 1.0}, smooth=1, ao=1.0)
    for side, sign in SIDES:
        verts = hk.ellipsoid(under.bm, ((rx - .008) * sign, .006 * k, hz - .004 * k), (.014 * k, .034 * k, .042 * k), 12, 10)
        hk.rotate_about(under.bm, verts, ((rx - .008) * sign, .006 * k, hz), (0, 0, 1), -10 * sign)
    hk.ellipsoid(under.bm, (0, .05 * k, hz - .02 * k), (.048 * k, .02 * k, .03 * k), 14, 10)

    curls = fig.piece("curls", hair_color, {"head": 1.0, "neck": .1}, smooth=0, ao=1.0)
    bm = curls.bm
    coil, thick = .0062 * k, .0042 * k
    for side, sign in SIDES:
        # Ringlets frame the face from the temple down to the jaw.
        for n, (y, z, drop) in enumerate(((-.034, .03, .062), (-.018, .034, .072), (0, .03, .07), (.018, .022, .06), (.034, .008, .05))):
            top = ((rx + .002 - abs(y) * .05) * sign, y * k, hz + z * k)
            ringlet(bm, top, drop * k, coil, thick, 2.6 + .3 * (n % 2), phase=n * 1.3, sway=(.008 * sign * k, 0, 0))
    for n in range(6):
        x = (-.04 + .016 * n) * k
        top = (x, (-.058 + abs(x) * .45 / k) * k, hz + (.038 - abs(x) * .2 / k) * k)
        ringlet(bm, top, .02 * k, coil * .8, thick * .9, 1.2, phase=n * 2.1)
    for n in range(6):
        a = math.pi * (.12 + .76 * n / 5)
        top = (math.cos(a) * .045 * k, (.05 + math.sin(a) * .018) * k, hz - .012 * k)
        ringlet(bm, top, .05 * k, coil, thick, 2.2, phase=n * 1.7)


def kit_noise(co):
    from mathutils import noise
    return .5 + .5 * noise.noise(co * 90)


# --- Clothing --------------------------------------------------------------


def arm_rings(j, side, profile):
    """Rings along an arm. `profile` is a list of (bone, t, rx, ry)."""
    rings = []
    for bone, t, rx, ry in profile:
        head, tail = j[f"{bone}.{side}"]
        rings.append({"c": lerp3(head, tail, t), "rx": rx, "ry": ry})
    return rings


def leg_rings(j, side, profile):
    rings = []
    for bone, t, rx, ry in profile:
        head, tail = j[f"{bone}.{side}"]
        rings.append({"c": lerp3(head, tail, t), "rx": rx, "ry": ry})
    return rings


def arm_bones(side):
    return {f"shoulder.{side}": .5, f"upperarm.{side}": 1.0, f"forearm.{side}": 1.0, "chest": .25}


def leg_bones(side):
    return {"hips": .6, f"thigh.{side}": 1.0, f"shin.{side}": 1.0}


def hand(fig, j, side, sign, skin, fist):
    """A clear hand silhouette: a fist around the grip, or a relaxed open hand."""
    head, tail = j[f"hand.{side}"]
    axis = (tail - head).normalized()
    if fist:
        piece = fig.piece("fist" + side, skin, {f"hand.{side}": 1.0, f"forearm.{side}": .15}, smooth=1)
        center = head.lerp(tail, .45)
        verts = hk.ellipsoid(piece.bm, center, (.019, .024, .026), 12, 10)
        for k in range(4):
            knuckle = center + Vector((-.012 * sign, -.016 + .011 * k, -.004))
            hk.push(verts, knuckle, .008, (-.003 * sign, 0, 0))
        thumb = fig.piece("thumb" + side, skin, f"hand.{side}", smooth=1)
        hk.loft(thumb.bm, [
            {"c": center + Vector((.004 * sign, -.018, .012)), "rx": .0075, "ry": .007},
            {"c": center + Vector((-.006 * sign, -.024, .0)), "rx": .0065, "ry": .006},
            {"c": center + Vector((-.012 * sign, -.022, -.008)), "rx": .005, "ry": .005},
        ], sides=8)
        for part in (piece, thumb):
            grow(part, head)
        return center
    piece = fig.piece("hand" + side, skin, {f"hand.{side}": 1.0, f"forearm.{side}": .2}, smooth=1)
    hk.loft(piece.bm, [
        {"c": head + axis * .002, "rx": .011, "ry": .017},
        {"c": head + axis * .03, "rx": .0105, "ry": .021},
        {"c": head + axis * .048, "rx": .009, "ry": .02},
    ], sides=10)
    base = head + axis * .048
    for k in range(4):
        y = -.0135 + .009 * k
        length = (.026, .03, .028, .022)[k]
        root = base + Vector((0, y, 0))
        curl = Vector((-.006 * sign, -.004, 0))
        points = [root, root + axis * length * .55 + curl * .4, root + axis * length + curl]
        hk.loft(piece.bm, [{"c": p, "rx": r, "ry": r} for p, r in zip(points, (.0042, .0038, .003))], sides=6)
    thumb_root = head + axis * .018 + Vector((-.004 * sign, -.017, 0))
    points = [thumb_root, thumb_root + Vector((-.006 * sign, -.01, -.012)), thumb_root + Vector((-.01 * sign, -.012, -.024))]
    hk.loft(piece.bm, [{"c": p, "rx": r, "ry": r} for p, r in zip(points, (.0055, .0048, .0036))], sides=6)
    grow(piece, head)
    return head.lerp(tail, .45)


def grow(piece, pivot, factor=1.2):
    """Hands are a little large, so their gestures read at Battle size."""
    hk.transform(piece.bm, piece.bm.verts, Matrix.Translation(pivot) @ Matrix.Scale(factor, 4) @ Matrix.Translation(-pivot))


def boot(fig, j, side, sign, leather, sole, top_z, cuff=None, slouch=0.0):
    head, tail = j[f"shin.{side}"]
    foot = j[f"foot.{side}"][0]
    x = foot.x

    def boot_color(co, _n):
        if co.z < .009:
            return sole
        if cuff and co.z > top_z - .03:
            return cuff
        return mix(leather, sole, smoothstep(.04, .0, co.z) * .4)

    shaft = fig.piece("boot-shaft" + side, boot_color, {f"shin.{side}": 1.0, f"foot.{side}": .3}, smooth=1)
    rings = []
    for z, r in ((.03, .033), (.075, .034), (.12, .036), (.17, .039), (top_z - .03, .042 + slouch), (top_z, .046 + slouch)):
        t = (head.z - z) / (head.z - tail.z)
        c = head.lerp(tail, min(t, 1.0))
        c.z = z
        wave = (lambda th, z=z: slouch * .25 * math.sin(th * 5 + z * 40)) if slouch else None
        ring = {"c": c, "rx": r, "ry": r * 1.05}
        if wave:
            ring["wave"] = wave
        rings.append(ring)
    hk.loft(shaft.bm, rings, sides=14, caps=(True, False))
    if cuff:
        band = fig.piece("boot-cuff" + side, cuff, {f"shin.{side}": 1.0}, smooth=1)
        c = head.lerp(tail, (head.z - top_z) / (head.z - tail.z))
        hk.loft(band.bm, [
            {"c": c + Vector((0, 0, -.042)), "rx": .046, "ry": .048},
            {"c": c + Vector((0, 0, -.036)), "rx": .052, "ry": .054},
            {"c": c + Vector((0, 0, .002)), "rx": .053, "ry": .055},
            {"c": c + Vector((0, 0, .008)), "rx": .047, "ry": .049},
        ], sides=16)
    toe = fig.piece("boot-foot" + side, boot_color, {f"foot.{side}": 1.0, f"shin.{side}": .4}, smooth=1)
    hk.loft(toe.bm, [
        {"c": (x, .038, .032), "rx": .028, "ry": .032, "dir": (0, 0, 1)},
        {"c": (x, .012, .036), "rx": .033, "ry": .036, "dir": (0, 0, 1)},
        {"c": (x, -.03, .031), "rx": .035, "ry": .031, "dir": (0, 0, 1)},
        {"c": (x + .002 * sign, -.075, .025), "rx": .035, "ry": .025, "dir": (0, 0, 1)},
        {"c": (x + .003 * sign, -.106, .021), "rx": .03, "ry": .021, "dir": (0, 0, 1)},
        {"c": (x + .004 * sign, -.118, .018), "rx": .018, "ry": .014, "dir": (0, 0, 1)},
    ], sides=12)


def stand_collar(fig, s, color, rx, ry):
    collar = fig.piece("collar", color, {"chest": 1.0, "neck": .5}, smooth=1)
    hk.loft(collar.bm, [
        {"c": (0, .004, .79 * s), "rx": rx, "ry": ry},
        {"c": (0, .007, .822 * s), "rx": rx - .007, "ry": ry - .006},
    ], sides=16, caps=(False, False))


def dress_standard(fig, j, b):
    """A plain linen tunic with rolled sleeves, a tied sash, trousers and tall boots."""
    s = b.scale
    linen, linen_shade, trim = "#b9ad8c", "#8e8467", "#d6ccae"
    trousers, trousers_shade = "#5a4a38", "#3e3226"

    def tunic_color(co, n):
        color = mix(linen, linen_shade, smoothstep(.6, .44, co.z) * .35)
        # A dark undershirt in the V of the neck, with a stitched edge.
        v = co.z - .748
        if co.y < 0 and v > 0 and abs(co.x) < v * .9:
            return "#3a2e29"
        if co.y < 0 and v > -.004 and abs(abs(co.x) - v * .9) < .006:
            return trim
        if co.z < .452:
            return mix(color, linen_shade, .5)
        return color

    tunic = fig.piece("tunic", tunic_color, {"hips": 1.0, "spine": 1.0, "chest": 1.0, "shoulder.L": .3, "shoulder.R": .3, "thigh.L": .25, "thigh.R": .25}, smooth=1)

    def folds(theta):
        return .018 * math.sin(theta * 7 + .5) + .01 * math.sin(theta * 3)

    rings = [
        (.795, .058, .05, .052, 2.0, None),
        (.778, .112, .066, .068, 2.6, None),
        (.75, .126, .074, .07, 2.6, None),
        (.71, .124, .078, .068, 2.4, None),
        (.67, .115, .074, .064, 2.2, None),
        (.63, .104, .066, .06, 2.2, None),
        (.60, .099, .063, .059, 2.2, None),
        (.56, .106, .066, .064, 2.2, folds),
        (.51, .116, .071, .072, 2.2, folds),
        (.47, .123, .077, .079, 2.2, folds),
        (.435, .128, .081, .083, 2.2, folds),
    ]
    hk.loft(tunic.bm, [
        {"c": (0, 0, z * s), "rx": rx, "front": f, "back": bk, "power": pw, **({"wave": wave} if wave else {})}
        for z, rx, f, bk, pw, wave in rings
    ], sides=24, caps=(True, False))
    stand_collar(fig, s, linen, .054, .051)

    # The sash: a band at the waist, a knot on the figure's left and two tails.
    sash = "#5b3a2a"
    band = fig.piece("sash", sash, {"hips": 1.0, "spine": 1.0}, smooth=1)
    hk.loft(band.bm, [
        {"c": (0, 0, .575 * s), "rx": .108, "front": .07, "back": .066, "power": 2.2},
        {"c": (0, 0, .595 * s), "rx": .105, "front": .068, "back": .064, "power": 2.2},
        {"c": (0, 0, .615 * s), "rx": .102, "front": .067, "back": .062, "power": 2.2},
    ], sides=24, caps=(False, False))
    knot = fig.piece("sash-knot", "#6a4431", {"hips": 1.0, "spine": .6}, smooth=1)
    hk.ellipsoid(knot.bm, (.052, -.066, .595 * s), (.02, .014, .017), 12, 8)
    tails = fig.piece("sash-tails", sash, {"hips": 1.0, "thigh.L": .35}, smooth=1)
    for k, (dx, length, swing) in enumerate(((-.006, .15, .01), (.012, .12, .022))):
        top = Vector((.052 + dx, -.07, .59 * s))
        grid = []
        for r in range(6):
            t = r / 5
            center = top + Vector((swing * t, -.006 * math.sin(t * 3), -length * t))
            width = .012 + .004 * t
            grid.append([center + Vector((-width, 0, 0)), center + Vector((width, 0, 0))])
        hk.sheet(tails.bm, grid, .004, (0, 1, 0))

    for side, sign in SIDES:
        sleeve = fig.piece("sleeve" + side, lambda co, n: linen, arm_bones(side), smooth=1)
        hk.loft(sleeve.bm, arm_rings(j, side, [
            ("shoulder", .35, .044, .048),
            ("upperarm", 0.0, .047, .05),
            ("upperarm", .35, .044, .045),
            ("upperarm", .75, .039, .04),
            ("forearm", .08, .036, .036),
        ]), sides=14, caps=(True, False))
        cuff = fig.piece("rolled-cuff" + side, trim, {f"forearm.{side}": 1.0, f"upperarm.{side}": .3}, smooth=1)

        def roll(theta):
            return .08 * math.sin(theta * 4)

        hk.loft(cuff.bm, arm_rings(j, side, [
            ("forearm", .0, .036, .037),
            ("forearm", .06, .043, .043),
            ("forearm", .2, .042, .042),
            ("forearm", .26, .035, .035),
        ]), sides=14)
        arm = fig.piece("forearm" + side, b.skin, {f"forearm.{side}": 1.0, f"hand.{side}": .4}, smooth=1)
        hk.loft(arm.bm, arm_rings(j, side, [
            ("forearm", .12, .031, .03),
            ("forearm", .4, .03, .027),
            ("forearm", .8, .022, .02),
            ("forearm", 1.02, .02, .017),
        ]), sides=12)
        hand(fig, j, side, sign, b.skin, fist=side == "R")

        def trouser_color(co, n):
            return mix(trousers, trousers_shade, smoothstep(.36, .2, co.z) * .3)

        leg = fig.piece("leg" + side, trouser_color, leg_bones(side), smooth=1)

        hk.loft(leg.bm, leg_rings(j, side, [
            ("thigh", -.05, .056, .06),
            ("thigh", .25, .058, .062),
            ("thigh", .65, .051, .055),
            ("thigh", .98, .044, .048),
            ("shin", .2, .045, .048),
            ("shin", .5, .038, .041),
        ]), sides=14)
        boot(fig, j, side, sign, "#5e3b26", "#2c1d15", .24 * s, cuff="#734a30")
    seat = fig.piece("seat", trousers, {"hips": 1.0, "thigh.L": .4, "thigh.R": .4}, smooth=0)
    hk.ellipsoid(seat.bm, (0, .006, .515 * s), (.088, .058, .06), 16, 10)


def dress_tent_rings(fig, j, b):
    """A plum tunic dress with a pointed hem, wide trousers, boots and her striped scarves."""
    s = b.scale
    plum, plum_shade, plum_light = "#6b2a4f", "#43172f", "#8a4068"
    orange, magenta = "#e8822e", "#b8326a"

    def tunic_color(co, n):
        color = mix(plum, plum_shade, smoothstep(.55, .3, co.z) * .4)
        return mix(color, plum_light, smoothstep(.72, .79, co.z) * .3)

    tunic = fig.piece("tunic", tunic_color, {"hips": 1.0, "spine": 1.0, "chest": 1.0, "shoulder.L": .3, "shoulder.R": .3, "thigh.L": .35, "thigh.R": .35}, smooth=1)

    def folds(theta):
        return .03 * math.sin(theta * 6 + .3) + .012 * math.sin(theta * 11)

    rings = [
        (.795, .062, .054, .056, 2.0, None),
        (.778, .118, .074, .074, 2.6, None),
        (.75, .132, .085, .078, 2.5, None),
        (.71, .133, .093, .078, 2.3, None),
        (.67, .13, .094, .076, 2.2, None),
        (.63, .126, .09, .074, 2.2, None),
        (.60, .124, .088, .074, 2.2, None),
        (.56, .132, .088, .078, 2.2, folds),
        (.50, .142, .092, .088, 2.2, folds),
        (.44, .152, .1, .098, 2.2, folds),
        (.38, .16, .108, .106, 2.2, folds),
    ]
    sides = 28
    loops = hk.loft(tunic.bm, [
        {"c": (0, 0, z * s), "rx": rx, "front": f, "back": bk, "power": pw, **({"wave": wave} if wave else {})}
        for z, rx, f, bk, pw, wave in rings
    ], sides=sides, caps=(True, False))
    # The handkerchief hem: points at the sides, front and back.
    for k, vert in enumerate(loops[-1]):
        theta = 2 * math.pi * k / sides
        vert.co.z -= .075 * max(0.0, math.cos(theta * 2 + .35)) ** 3
    for k, vert in enumerate(loops[-2]):
        theta = 2 * math.pi * k / sides
        vert.co.z -= .03 * max(0.0, math.cos(theta * 2 + .35)) ** 3
    stand_collar(fig, s, plum, .057, .054)
    belt = fig.piece("belt", plum_shade, {"hips": 1.0, "spine": 1.0}, smooth=1)
    hk.loft(belt.bm, [
        {"c": (0, 0, .57 * s), "rx": .13, "front": .092, "back": .078, "power": 2.2},
        {"c": (0, 0, .585 * s), "rx": .127, "front": .091, "back": .077, "power": 2.2},
    ], sides=24, caps=(False, False))
    knot = fig.piece("belt-knot", plum_shade, {"hips": 1.0}, smooth=1)
    hk.ellipsoid(knot.bm, (-.03, -.093, .578 * s), (.016, .01, .012), 10, 6)

    for side, sign in SIDES:
        sleeve = fig.piece("sleeve" + side, tunic_color, arm_bones(side) | {f"hand.{side}": .2}, smooth=1)
        hk.loft(sleeve.bm, arm_rings(j, side, [
            ("shoulder", .3, .047, .05),
            ("upperarm", 0.0, .048, .051),
            ("upperarm", .4, .044, .045),
            ("upperarm", .85, .04, .041),
            ("forearm", .3, .036, .036),
            ("forearm", .7, .036, .036),
            ("forearm", .86, .039, .039),
        ]), sides=14, caps=(True, False))
        cuff = fig.piece("cuff" + side, plum_shade, {f"forearm.{side}": 1.0, f"hand.{side}": .2}, smooth=1)
        hk.loft(cuff.bm, arm_rings(j, side, [
            ("forearm", .8, .036, .036),
            ("forearm", .88, .04, .04),
            ("forearm", .97, .036, .036),
        ]), sides=14, caps=(False, False))
        wrist = fig.piece("wrist" + side, b.skin, {f"forearm.{side}": 1.0, f"hand.{side}": .4}, smooth=1)
        hk.loft(wrist.bm, arm_rings(j, side, [
            ("forearm", .82, .024, .022),
            ("forearm", 1.04, .02, .017),
        ]), sides=10, caps=(False, False))
        hand(fig, j, side, sign, b.skin, fist=side == "R")

        def creases(theta):
            return .06 * math.sin(theta * 5 + 1)

        leg = fig.piece("leg" + side, lambda co, n: mix(plum, plum_shade, smoothstep(.3, .15, co.z) * .3), leg_bones(side), smooth=1)
        hk.loft(leg.bm, [
            {**ring, "wave": creases} for ring in leg_rings(j, side, [
                ("thigh", -.15, .066, .07),
                ("thigh", .3, .063, .067),
                ("thigh", .75, .06, .063),
                ("shin", .1, .062, .064),
                ("shin", .38, .055, .057),
                ("shin", .58, .04, .042),
            ])
        ], sides=14)
        boot(fig, j, side, sign, "#7a4a2a", "#3a2416", .2 * s, slouch=.006)
    seat = fig.piece("seat", plum, {"hips": 1.0, "thigh.L": .4, "thigh.R": .4}, smooth=0)
    hk.ellipsoid(seat.bm, (0, .006, .5 * s), (.12, .08, .075), 16, 10)

    # The neck scarf: a thick striped wrap and one end down the figure's left.
    def stripes(co, n):
        band = math.sin((co.x * .9 + co.z * 1.2 - co.y * .5) * 150)
        return mix(orange, magenta, smoothstep(-.25, .25, band))

    wrap = fig.piece("scarf-wrap", stripes, {"chest": 1.0, "neck": .5, "shoulder.L": .3, "shoulder.R": .3}, smooth=1)
    path = []
    for k in range(17):
        a = -math.pi / 2 + 2 * math.pi * k / 16 * .97
        x, y = math.cos(a) * .112, math.sin(a) * .092
        z = (.79 - .03 * max(0.0, -math.sin(a))) * s
        path.append({"c": (x, y + .004, z), "rx": .03, "ry": .03, "dir": (0, 0, 1),
                     "wave": lambda th, k=k: .12 * math.sin(th * 3 + k)})
    hk.loft(wrap.bm, path, sides=10)
    drape = fig.piece("scarf-drape", lambda co, n: mix(orange, magenta, smoothstep(-.3, .3, math.sin(co.z * 160 + co.x * 40))), {"chest": 1.0, "spine": .8, "hips": .3}, smooth=1)
    grid = []
    for r in range(9):
        t = r / 8
        center = Vector((.072 + .01 * t, -.088 - .03 * math.sin(t * 2.4), (.775 - .27 * t) * s))
        width = .034 + .006 * t
        wobble = .006 * math.sin(t * 9)
        grid.append([center + Vector((-width, wobble, 0)), center + Vector((0, -.004, 0)), center + Vector((width, -wobble, 0))])
    hk.sheet(drape.bm, grid, .008, (0, 1, 0))
    fringe = fig.piece("scarf-fringe", orange, {"spine": 1.0, "hips": .6}, smooth=0, ao=.6)
    end = grid[-1]
    for k in range(7):
        top = end[0].lerp(end[2], k / 6) if k < 7 else end[2]
        hk.loft(fringe.bm, [
            {"c": top, "rx": .0022, "ry": .0022},
            {"c": top + Vector((0, -.002, -.022)), "rx": .0016, "ry": .0016},
        ], sides=4)

    # The headscarf: a striped wrap over the crown, a rolled band and a tail.
    hz = b.head_z * s
    rx, ry, rz = b.head

    def head_stripes(co, n):
        band = math.sin((co.x * 1.1 - co.z * .8 + co.y * .6) * 140)
        return mix(orange, magenta, smoothstep(-.2, .2, band))

    cap = fig.piece("headscarf", head_stripes, "head", smooth=1)
    verts = hk.ellipsoid(cap.bm, (0, .01, hz + .02), (rx + .012, ry + .014, rz), 28, 20)
    hk.push(verts, (0, .055, hz + .065), .075, (0, .02, .026))
    hk.push(verts, (.03, .03, hz + .08), .045, (.008, 0, .014))
    for v in verts:
        v.co += (v.co - Vector((0, 0, hz))).normalized() * .004 * math.sin(math.atan2(v.co.y, v.co.x) * 6 + v.co.z * 90)
    def band_z(y):
        # The band runs over the brow at the front and under the skull at the back.
        return hz + .036 - .05 * smoothstep(-ry, ry, y)

    kill = [v for v in verts if v.co.z < band_z(v.co.y) - .004]
    hk.bmesh.ops.delete(cap.bm, geom=kill, context="VERTS")
    roll = fig.piece("headscarf-roll", magenta, "head", smooth=1)
    band = []
    for n in range(25):
        a = math.pi / 2 + 2 * math.pi * n / 24
        x, y = math.cos(a) * (rx + .011), math.sin(a) * (ry + (.012 if math.sin(a) < 0 else .006)) + .008
        band.append({"c": (x, y, band_z(y)), "rx": .0085, "ry": .008, "dir": (0, 0, 1)})
    hk.loft(roll.bm, band, sides=8, caps=(False, False))
    tail = fig.piece("headscarf-tail", head_stripes, {"head": .7, "neck": .6, "chest": .3}, smooth=1)
    grid = []
    for r in range(7):
        t = r / 6
        center = Vector((.052 + .02 * t, .052 + .012 * t, hz - .02 - .13 * t * s))
        width = .016 + .008 * t
        grid.append([center + Vector((0, -width, 0)), center + Vector((0, width, 0))])
    hk.sheet(tail.bm, grid, .006, (1, 0, 0))
    knot = fig.piece("headscarf-knot", magenta, "head", smooth=1)
    hk.ellipsoid(knot.bm, (.045, .058, hz - .012), (.018, .016, .016), 10, 8)

    # Gold hoops.
    for side, sign in SIDES:
        hoop = fig.piece("hoop" + side, "#e9b949", "head", smooth=0, ao=.4, gloss=.6)
        hk.kit.torus(hoop.bm, ((rx - .002) * sign, -.004, hz - .045), (1, 0, 0), .011, .0022, 18, 6)


def body(fig, person):
    """All the person's own pieces. Returns the bone joints for the Gear builders."""
    b = PEOPLE[person]
    if person not in ("standard", "tent-rings") and not hasattr(b, "marks"):
        _marks()
    bones = skeleton(person)
    j = joints(bones)
    hz = head(fig, person)
    neck(fig, person, b.skin)
    if person == "standard":
        hair_standard(fig, b, hz)
        dress_standard(fig, j, b)
    elif person == "tent-rings":
        hair_tent_rings(fig, b, hz)
        dress_tent_rings(fig, j, b)
    else:
        import hero_cast

        hero_cast.DRESS[person](fig, j, b, hz)
        return j, dict(hero_cast.fit(b), scale=b.scale)
    return j, dict(FIT[person], scale=b.scale)


# The torso under the breastplate (z, rx, front, back, y offset), and the
# place of the amulet, so each Gear look fits each person.
FIT = {
    "standard": dict(
        plate=[(.772, .1, .062, .064, 0), (.745, .122, .072, .068, 0), (.71, .122, .077, .067, 0),
               (.67, .114, .073, .063, 0), (.635, .104, .066, .059, 0), (.612, .1, .064, .058, 0)],
        amulet_z=.742, amulet_y=-.096,
    ),
    "tent-rings": dict(
        plate=[(.772, .108, .07, .07, 0), (.745, .128, .083, .076, 0), (.71, .13, .092, .076, 0),
               (.67, .128, .093, .075, 0), (.635, .124, .089, .073, 0), (.612, .122, .088, .073, 0)],
        amulet_z=.712, amulet_y=-.118,
    ),
}
