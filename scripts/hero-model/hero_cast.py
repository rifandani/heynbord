"""The six Hero Models after the first references: hair, beards, hats and clothing.

Each person uses the shared skeleton, head sculpt, hands and boots of
`hero_people`. The painted portraits in `apps/web/public/hero-portraits/`
and the briefs in `docs/game/17-hero-portrait-concepts.md` define each
person. The breastplate covers the chest of every person, so the clothing
shows at the collar, the shoulders, the sleeves, the skirt and the legs.
"""
import math

import bmesh
from mathutils import Vector

import hero_kit as hk
import hero_people as hp
from hero_kit import mix, smoothstep
from hero_people import BACK, FRONT, SIDES

# The torso of the Standard person: (z, rx, front, back). The other people
# scale it for their build.
TORSO = [
    (.795, .058, .05, .052), (.778, .112, .066, .068), (.75, .126, .074, .07), (.71, .124, .078, .068),
    (.67, .115, .074, .064), (.63, .104, .066, .06), (.60, .099, .063, .059), (.56, .106, .066, .064),
    (.51, .116, .071, .072), (.47, .123, .077, .079), (.435, .128, .081, .083),
]
PLATE = [(.772, .1, .062, .064), (.745, .122, .072, .068), (.71, .122, .077, .067),
         (.67, .114, .073, .063), (.635, .104, .066, .059), (.612, .1, .064, .058)]


def torso(b):
    """The torso rings of one person: wider shoulders, a deeper chest or wider hips."""
    rows = []
    for z, rx, f, bk in TORSO:
        hipness = smoothstep(.62, .52, z)
        width = b.wide + (b.hips - b.wide) * hipness
        rows.append((z, rx * width, f * b.deep * (1 + b.belly * hipness * .4), bk * b.deep))
    return rows


def fit(b):
    """The breastplate and amulet fit for one person."""
    plate = [(z, rx * b.wide, f * b.deep, bk * b.deep, 0) for z, rx, f, bk in PLATE]
    return dict(plate=plate, amulet_z=.742, amulet_y=-(.072 * b.deep + .024))


def lerp(a, b, t):
    return a + (b - a) * t


def weights_by_height(*bands):
    """Weights that change with height: bands of (z, weights), from the top down."""

    def rule(co):
        for z, weights in bands:
            if co.z >= z:
                return weights
        return bands[-1][1]

    return rule


def solid(bm, thickness):
    """Give an open shell a thickness, so a hat brim or a hood has a clean edge."""
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=thickness)


def head_shell(fig, name):
    """A copy of the sculpted head surface, for a beard or a hood that fits the face."""
    source = next(piece for piece in fig.pieces if piece.name == "head")
    return source.bm.copy()


# --- Clothing --------------------------------------------------------------


def tunic(fig, b, color, hem=(), folds=.018, thigh=.25, name="tunic", cut=None, sides=24):
    """The torso garment down to the knee, or longer with `hem` rings (z, rx, front, back)."""
    s = b.scale
    rows = torso(b) + list(hem)
    bones = {"hips": 1.0, "spine": 1.0, "chest": 1.0, "shoulder.L": .3, "shoulder.R": .3, "thigh.L": thigh, "thigh.R": thigh}
    piece = fig.piece(name, color, bones, smooth=1)

    def wave(theta):
        return folds * math.sin(theta * 7 + .5) + folds * .55 * math.sin(theta * 3)

    loops = hk.loft(piece.bm, [
        {"c": (0, 0, z * s), "rx": rx, "front": f, "back": bk, "power": 2.0 if i == 0 else (2.6 if z > .7 else 2.2),
         **({"wave": wave} if z < .58 else {})}
        for i, (z, rx, f, bk) in enumerate(rows)
    ], sides=sides, caps=(True, False))
    if cut:
        cut(loops, sides)
    return loops


def belt(fig, b, color, buckle, z=.585, width=.022, name="belt"):
    s = b.scale
    rows = torso(b)
    rx = next(r for zz, r, f, bk in rows if zz <= .6) + .006
    f = next(f for zz, r, f, bk in rows if zz <= .6) + .006
    bk = next(bk for zz, r, f, bk in rows if zz <= .6) + .006
    band = fig.piece(name, color, {"hips": 1.0, "spine": 1.0}, smooth=1)
    hk.loft(band.bm, [
        {"c": (0, 0, (z - width / 2) * s), "rx": rx + .002, "front": f + .002, "back": bk + .002, "power": 2.2},
        {"c": (0, 0, (z + width / 2) * s), "rx": rx, "front": f, "back": bk, "power": 2.2},
    ], sides=24, caps=(False, False))
    if buckle:
        metal = fig.piece(name + "-buckle", buckle, {"hips": 1.0}, smooth=0, ao=.5, gloss=.9)
        hk.kit.box(metal.bm, (0, -f - .004, z * s), (.026, .006, .024))
        hk.kit.box(metal.bm, (0, -f - .0075, z * s), (.012, .003, .012))
    return rx, f, bk


def sleeve(fig, j, side, color, cuff, skin, rings=None, cuff_at=.84):
    """A full sleeve to the wrist, with a cuff, a bare wrist and a hand."""
    piece = fig.piece("sleeve" + side, color, hp.arm_bones(side) | {f"hand.{side}": .2}, smooth=1)
    hk.loft(piece.bm, hp.arm_rings(j, side, rings or [
        ("shoulder", .3, .046, .049),
        ("upperarm", 0.0, .047, .05),
        ("upperarm", .4, .043, .044),
        ("upperarm", .85, .039, .04),
        ("forearm", .3, .035, .035),
        ("forearm", .7, .033, .033),
        ("forearm", cuff_at + .02, .036, .036),
    ]), sides=14, caps=(True, False))
    band = fig.piece("cuff" + side, cuff, {f"forearm.{side}": 1.0, f"hand.{side}": .2}, smooth=1)
    hk.loft(band.bm, hp.arm_rings(j, side, [
        ("forearm", cuff_at - .06, .035, .035),
        ("forearm", cuff_at, .04, .04),
        ("forearm", cuff_at + .12, .038, .038),
        ("forearm", cuff_at + .15, .033, .033),
    ]), sides=14, caps=(False, False))
    wrist = fig.piece("wrist" + side, skin, {f"forearm.{side}": 1.0, f"hand.{side}": .4}, smooth=1)
    hk.loft(wrist.bm, hp.arm_rings(j, side, [
        ("forearm", .86, .024, .022),
        ("forearm", 1.04, .02, .017),
    ]), sides=10, caps=(False, False))
    hp.hand(fig, j, side, 1 if side == "L" else -1, skin, fist=side == "R")


def trousers(fig, j, b, side, color, loose=0.0):
    def creases(theta):
        return loose * math.sin(theta * 5 + 1)

    leg = fig.piece("leg" + side, color, hp.leg_bones(side), smooth=1)
    hk.loft(leg.bm, [
        {**ring, **({"wave": creases} if loose else {})} for ring in hp.leg_rings(j, side, [
            ("thigh", -.1, .058 + loose * .1, .062 + loose * .1),
            ("thigh", .3, .058 + loose * .12, .062 + loose * .12),
            ("thigh", .7, .052 + loose * .12, .056 + loose * .12),
            ("thigh", .98, .045 + loose * .14, .049 + loose * .14),
            ("shin", .2, .046 + loose * .14, .049 + loose * .14),
            ("shin", .5, .039 + loose * .1, .042 + loose * .1),
        ])
    ], sides=14)


def seat(fig, b, color, size=(.09, .06, .062)):
    piece = fig.piece("seat", color, {"hips": 1.0, "thigh.L": .4, "thigh.R": .4}, smooth=0)
    hk.ellipsoid(piece.bm, (0, .006, .512 * b.scale), size, 16, 10)


def neck_roll(fig, b, name, color, z, rx, ry, tube, folds=.12, lift=0.0, back_drop=0.0, bones=None, steps=24, sides=10):
    """A thick roll of cloth around the neck or the shoulders: a cowl, a scarf or a fur collar."""
    s = b.scale
    piece = fig.piece(name, color, bones or {"chest": 1.0, "neck": .5, "shoulder.L": .3, "shoulder.R": .3}, smooth=1)
    path = []
    for k in range(steps + 1):
        # The ends of the roll meet at the back, out of sight.
        a = math.pi / 2 + 2 * math.pi * k / steps
        x, y = math.cos(a) * rx, math.sin(a) * ry
        back = max(0.0, math.sin(a))
        front = max(0.0, -math.sin(a))
        path.append({"c": (x, y + .006, z * s + lift * front - back_drop * back), "rx": tube, "ry": tube * .9, "dir": (0, 0, 1),
                     "wave": lambda th, k=k: folds * math.sin(th * 3 + k * 1.3) + folds * .4 * math.sin(th * 7 + k)})
    hk.loft(piece.bm, path, sides=sides, caps=(False, False))
    return piece


def fur(base, light, scale=420):
    def color(co, n):
        tuft = .5 + .5 * hk.noise.noise(co * scale)
        return mix(mix(base, light, smoothstep(-.2, .9, n.z) * .5), "#6a5a48", (1 - tuft) * .25)

    return color


def fur_roll(fig, b, name, base, light, z, rx, ry, tube, back_drop=0.0, lift=0.0):
    piece = neck_roll(fig, b, name, fur(base, light), z, rx, ry, tube, folds=.0, lift=lift, back_drop=back_drop, steps=32, sides=12)
    # Tufts: a rough, soft surface.
    for vert in piece.bm.verts:
        vert.co += (vert.co - Vector((0, 0, vert.co.z))).normalized() * .006 * hk.noise.noise(vert.co * 160)
        vert.co.z += .004 * hk.noise.noise(vert.co * 210 + Vector((3, 1, 2)))
    return piece


# --- Hair and beards -------------------------------------------------------


def hanging_lock(bm, center, radii, azimuth, start, drop, width, thickness, flare=.012, wave=0.0, tip=.35, below=-.35, phase=0.0):
    """A lock that lies on the hair volume from elevation `start` down to the
    side of the head, then hangs `drop` lower, out over the shoulders."""
    rings = []
    points = []
    for n in range(5):
        t = n / 4
        e = start + (below - start) * t
        unit = Vector((math.cos(azimuth) * math.cos(e), math.sin(azimuth) * math.cos(e), math.sin(e)))
        position = center + Vector((unit.x * radii.x, unit.y * radii.y, unit.z * radii.z)) + unit * (.004 + .004 * t)
        points.append((position, unit))
    last, out = points[-1]
    out = Vector((out.x, out.y, 0)).normalized()
    for n in range(1, 5):
        t = n / 4
        side = Vector((-out.y, out.x, 0)) * wave * math.sin(t * 5 + phase)
        points.append((last + out * flare * t * (2 - t) + Vector((0, 0, -drop * t)) + side, out))
    count = len(points)
    for index, (position, unit) in enumerate(points):
        t = index / (count - 1)
        taper = (1 - t * (1 - tip)) * min(1.0, .7 + 2 * t)
        rings.append({"c": position, "rx": width * taper, "ry": thickness * taper, "dir": unit})
    hk.loft(bm, rings, sides=6)


def hair_curtain(fig, b, hz, center, radii, color, bottom, start=FRONT + .95, end=FRONT + 2 * math.pi - .95,
                 top=1.0, columns=30, lift=.009, flare=.018, wave=.005, jag=.018, name="hair-curtain"):
    """One wavy sheet of hair from the crown, around the back, to the ends.

    `bottom(azimuth)` is the height of the ends. The sheet leaves the face
    open between `end` and `start`, and its lower edge is cut into locks.
    """
    k = b.head[2] / .077
    piece = fig.piece(name, color, head_weights(hz), smooth=1, ao=1.0)
    rows = 10
    widest = -.15
    grid = []
    for r in range(rows + 1):
        t = r / rows
        row = []
        for c in range(columns + 1):
            u = c / columns
            a = start + (end - start) * u
            if t <= .45:
                e = top + (widest - top) * (t / .45)
                unit = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e)))
                point = center + Vector((unit.x * radii.x, unit.y * radii.y, unit.z * radii.z)) + unit * lift * k
            else:
                unit = Vector((math.cos(a) * math.cos(widest), math.sin(a) * math.cos(widest), math.sin(widest)))
                base = center + Vector((unit.x * radii.x, unit.y * radii.y, unit.z * radii.z)) + unit * lift * k
                tt = (t - .45) / .55
                out = Vector((unit.x, unit.y, 0)).normalized()
                lock = .5 + .5 * math.sin(c * 2.3 + 1.1) * math.cos(c * 1.3)
                end_z = bottom(a) - jag * k * lock * tt ** 3
                point = base + out * (flare * k * tt * (2 - tt) + wave * k * math.sin(c * 1.7 + tt * 5) * tt)
                point.z = base.z + (end_z - base.z) * tt
            # Clumps of hair: ridges along the strands.
            normal = Vector((math.cos(a), math.sin(a), 0))
            point += normal * .0025 * k * math.sin(c * 2.6) * smoothstep(0, .3, t)
            row.append(point)
        grid.append(row)
    hk.sheet(piece.bm, grid)
    return piece


def head_weights(hz):
    """Hair that hangs below the jaw follows the neck a little."""
    return weights_by_height((hz - .07, {"head": 1.0}), (0, {"head": .7, "neck": .3}))


def beard(fig, b, hz, color, thickness=.006, top=-.74, sides=-.12, moustache=True, chin=1.6, name="beard"):
    """A beard that grows from the sculpted jaw: short on the cheeks, fuller on the chin."""
    rx, ry, rz = b.head
    k = rz / .077
    piece = fig.piece(name, color, "head", smooth=1, ao=.9)
    piece.bm.free()
    piece.bm = bm = head_shell(fig, "head")
    bm.normal_update()
    mouth_z = hz - .052 * k
    kill = []
    for vert in bm.verts:
        local = vert.co - Vector((0, .003, hz))
        u = local.z / rz
        ax = abs(local.x) / rx
        # The top of the beard rises from under the lip to the sideburn, along the cheek.
        line = top + (sides - top) * smoothstep(.3, .92, ax) ** 1.4
        behind = local.y > .22 * ry - .3 * ry * smoothstep(-.5, -1.0, u)
        mouth = ((local.x / (.026 * k)) ** 2 + ((vert.co.z - mouth_z) / (.011 * k)) ** 2) < 1 and local.y < 0
        if u > line or behind or mouth:
            kill.append(vert)
    keep = [v for v in bm.verts if v not in set(kill)]
    for vert in keep:
        local = vert.co - Vector((0, .003, hz))
        u = local.z / rz
        full = 1 + chin * smoothstep(-.7, -1.0, u) * smoothstep(.7, .1, abs(local.x) / rx)
        tuft = .75 + .5 * (.5 + .5 * hk.noise.noise(vert.co * 300))
        # Thin at the edge, so the beard grows out of the skin.
        local_line = top + (sides - top) * smoothstep(.3, .92, abs(local.x) / rx) ** 1.4
        edge = smoothstep(local_line, local_line - .12, u)
        vert.co += vert.normal * (thickness * k * full * tuft * edge - .0012 * (1 - edge))
    bmesh.ops.delete(bm, geom=kill, context="VERTS")
    if moustache:
        brush = fig.piece(name + "-moustache", color, "head", smooth=1, ao=.7)
        source = next(piece for piece in fig.pieces if piece.name == "head").bm
        for sign in (1, -1):
            points = []
            for x, dz, r in ((.0, .0085, .0038), (.01, .0082, .0042), (.019, .004, .0038), (.025, -.003, .003), (.028, -.009, .0018)):
                surface = _near_surface(source, x * k * sign, mouth_z + dz * k)
                points.append((surface + Vector((0, -.0035 * k, 0)), r * k))
            hk.loft(brush.bm, [{"c": c, "rx": r * 1.2, "ry": r * .8, "dir": (0, -1, .3)} for c, r in points], sides=6)


def _near_surface(bm, x, z):
    """The front of the head at (x, z), or at the nearest x inward where the head is."""
    for factor in (1.0, .9, .8, .7, .6, .5):
        try:
            return hp._surface(bm, x * factor, z)
        except ValueError:
            continue
    return hp._surface(bm, 0, z)


def streaked(base, light, pale=None, amount=0.0, scale=34):
    """Hair color with strands: dark grooves, light on top and a few pale strands."""

    def color(co, n):
        streak = .5 + .5 * math.sin(math.atan2(co.y, co.x) * scale + co.z * 140)
        value = mix(base, light, smoothstep(-.3, .9, n.z) * .45 + streak * .22 + .1 * hk.noise.noise(co * 160))
        if pale and amount:
            value = mix(value, pale, smoothstep(.55, .9, .5 + .5 * hk.noise.noise(Vector((co.x * 220, co.y * 220, co.z * 40)))) * amount)
        return value

    return color


# --- The people ------------------------------------------------------------


def dawn_gaze(fig, j, b, hz):
    """A young scout: wavy hair with a thin braid, a cream hood pushed back, an orange tunic."""
    s = b.scale
    rx, ry, rz = b.head
    k = rz / .077
    hair = streaked(b.hair, b.hair_light)
    center, radii = hp.hair_mass(fig, b, hz, (.06 * k, -.004 * k, -.06 * k), .004 * k, hair, ridges=.004)
    # Wavy hair to the shoulders: to the jaw at the sides of the face, onto the hood at the back.
    hair_curtain(fig, b, hz, center, radii, hair, lambda a: lerp(hz - .1 * k, .79 * s, smoothstep(-.3, .6, math.sin(a))),
                 lift=.007, flare=.02, wave=.006, jag=.03)
    locks = fig.piece("hair-locks", hair, head_weights(hz), smooth=1, ao=1.0)
    # Loose waves on the curtain, and locks from a side parting over the crown.
    for n in range(4):
        a = (FRONT + 1.0, FRONT + 1.4, FRONT - 1.0, FRONT - 1.4)[n]
        hanging_lock(locks.bm, center, radii, a, .9, .07 * k, .02 * k, .006 * k, flare=.02 * k, wave=.007 * k, phase=n, tip=.2)
    for n in range(7):
        a = FRONT + (n - 3) * .34
        side = 1 if n >= 2 else -1
        hp.surface_lock(locks.bm, center, radii, (FRONT + .55, 1.3), (a + .5 * side, .5), .026 * k, (.006 * k, .01 * k), .006 * k, .3, thickness=.005 * k)
    # The thin braid at the temple, on the figure's right, down past the jaw.
    braid = fig.piece("braid", hair, head_weights(hz), smooth=1, ao=.9)
    top = Vector((-(rx + .004), -.03 * k, hz + .014 * k))
    for n in range(12):
        t = n / 11
        p = top + Vector((-.006 * k * math.sin(t * 2), .004 * k * t, -.13 * k * t))
        side = Vector((.004 * k * (1 if n % 2 else -1), 0, 0))
        r = .0062 * k * (1 - .3 * t)
        verts = hk.ellipsoid(braid.bm, p + side, (r * .9, r * .8, r * 1.3), 8, 6)
        hk.rotate_about(braid.bm, verts, p + side, (0, 1, 0), 25 if n % 2 else -25)
    tie = fig.piece("braid-tie", "#c9a24f", head_weights(hz), smooth=0, ao=.5, gloss=.6)
    end = top + Vector((-.006 * k * math.sin(2), .004 * k, -.138 * k))
    hk.kit.torus(tie.bm, end, (0, 0, 1), .0052 * k, .0016 * k, 10, 4)

    orange, orange_dark, cream, cream_dark = "#cc6a30", "#8a3a1a", "#efe0c0", "#c4ae86"

    def tunic_color(co, n):
        return mix(orange, orange_dark, smoothstep(.62, .42, co.z) * .35 + smoothstep(-.2, .8, n.y) * .15)

    tunic(fig, b, tunic_color, hem=[(.40, .132 * b.hips, .085, .087)], folds=.022)
    hp.stand_collar(fig, s, orange_dark, .054, .051)
    belt(fig, b, "#5a3a24", "#c9a24f")
    pouch = fig.piece("pouch", "#6a4428", {"hips": 1.0, "thigh.L": .3}, smooth=1, ao=.8)
    hk.ellipsoid(pouch.bm, (.1 * b.hips, -.05, .555 * s), (.024, .014, .028), 10, 8)

    # The hood, pushed back: a thick cream roll at the neck and the hood on the upper back.
    cloth = lambda co, n: mix(cream, cream_dark, smoothstep(.5, -.6, n.z) * .6 + (.5 + .5 * hk.noise.noise(co * 140)) * .15)
    neck_roll(fig, b, "hood-roll", cloth, .8, .085, .072, .028, folds=.14, lift=.004, back_drop=.008)
    hood = fig.piece("hood", cloth, {"chest": 1.0, "neck": .3}, smooth=1, ao=1.0)
    verts = hk.ellipsoid(hood.bm, (-.012, .075, .745 * s), (.062, .032, .062), 16, 12)
    for v in verts:
        v.co.y += .006 * math.sin(v.co.x * 120) * smoothstep(.75 * s, .69 * s, v.co.z)
    hk.push(verts, (-.012, .1, .7 * s), .05, (0, .01, -.012))

    for side, sign in SIDES:
        sleeve(fig, j, side, tunic_color, cream, b.skin)
        # Leather bracers with a lace.
        bracer = fig.piece("bracer" + side, "#7a4e2c", {f"forearm.{side}": 1.0}, smooth=1, ao=.8)
        hk.loft(bracer.bm, hp.arm_rings(j, side, [
            ("forearm", .3, .037, .037), ("forearm", .35, .039, .039), ("forearm", .74, .038, .038), ("forearm", .78, .036, .036),
        ]), sides=12)
        trousers(fig, j, b, side, lambda co, n: mix("#4a3626", "#33251a", smoothstep(.36, .2, co.z) * .3))
        hp.boot(fig, j, side, sign, "#8a5a34", "#3a2416", .25 * s, cuff="#a06a3e")
    seat(fig, b, "#4a3626")


def verdant_crest(fig, j, b, hz):
    """A weathered ranger: shoulder-length hair, a short beard, a moss scarf and a leaf crest."""
    s = b.scale
    rx, ry, rz = b.head
    k = rz / .077
    hair = streaked(b.hair, b.hair_light)
    center, radii = hp.hair_mass(fig, b, hz, (.058 * k, -.006 * k, -.06 * k), .005 * k, hair, ridges=.005)
    # Shoulder-length hair, swept back from the brow: past the jaw at the sides, to the scarf at the back.
    hair_curtain(fig, b, hz, center, radii, hair, lambda a: lerp(hz - .115 * k, .815 * s, smoothstep(-.3, .6, math.sin(a))),
                 start=FRONT + 1.05, end=FRONT + 2 * math.pi - 1.05, lift=.008, flare=.024, wave=.007, jag=.035)
    locks = fig.piece("hair-locks", hair, head_weights(hz), smooth=1, ao=1.0)
    # Locks swept back from the brow over the crown, and one loose over the forehead.
    for n in range(7):
        a = FRONT + (n - 3) * .3
        hp.surface_lock(locks.bm, center, radii, (a, .62), (a + (n - 3) * .22, 1.35), .026 * k, (.006 * k, .01 * k), .006 * k, .45, thickness=.005 * k)
    hp.surface_lock(locks.bm, center, radii, (FRONT - .35, 1.05), (FRONT - .12, .5), .014 * k, (.01 * k, .014 * k), .006 * k, .2, thickness=.004 * k)
    beard(fig, b, hz, streaked("#4e3a28", "#7a5a3c", "#b8ac98", .55), thickness=.0055, chin=1.4)

    leather, leather_dark, shirt = "#6e4a2e", "#4a3020", "#5e6a52"

    def jerkin(co, n):
        return mix(leather, leather_dark, smoothstep(.62, .42, co.z) * .3 + (.5 + .5 * hk.noise.noise(co * 120)) * .18)

    def split(loops, sides):
        # The skirt of the jerkin opens in 4 panels.
        for index, loop in enumerate(loops[-3:]):
            for n, vert in enumerate(loop):
                theta = 2 * math.pi * n / sides
                vert.co.z += .02 * (index + 1) / 3 * abs(math.sin(theta * 2))

    tunic(fig, b, jerkin, hem=[(.40, .136 * b.hips, .088, .09)], folds=.014, cut=split)
    hp.stand_collar(fig, s, shirt, .056, .053)
    belt(fig, b, "#3e2a1c", "#a87c3e")

    # The moss scarf: a thick wrap and one end down the figure's right.
    moss, moss_dark = "#4c6b3c", "#2e4424"
    knit = lambda co, n: mix(moss, moss_dark, (.5 + .5 * math.sin(co.z * 520 + math.sin(co.x * 300) * 2)) * .3 + smoothstep(.4, -.7, n.z) * .3)
    neck_roll(fig, b, "scarf-wrap", knit, .792, .1, .084, .03, folds=.16, lift=.002)
    drape = fig.piece("scarf-drape", knit, {"chest": 1.0, "spine": .6}, smooth=1)
    grid = []
    for r in range(8):
        t = r / 7
        c = Vector((-.07 - .008 * t, -.09 - .02 * math.sin(t * 2.6) * b.deep, (.78 - .2 * t) * s))
        w = .028 + .006 * t
        grid.append([c + Vector((-w, .004, 0)), c + Vector((0, -.003, 0)), c + Vector((w, .004, 0))])
    hk.sheet(drape.bm, grid, .008, (0, 1, 0))
    fringe = fig.piece("scarf-fringe", moss_dark, {"spine": 1.0}, smooth=0, ao=.6)
    for n in range(6):
        p = grid[-1][0].lerp(grid[-1][2], n / 5)
        hk.loft(fringe.bm, [{"c": p, "rx": .002, "ry": .002}, {"c": p + Vector((0, -.002, -.018)), "rx": .0014, "ry": .0014}], sides=4)

    # The shoulder crest on the figure's left: 3 bronze leaves and 2 long cream feathers.
    crest = fig.piece("crest-leaves", lambda co, n: mix("#a87c3e", "#6e4a22", smoothstep(.5, -.5, n.z) * .5), {"shoulder.L": 1.0, "chest": .6}, smooth=1, ao=.6, gloss=.5)
    base = Vector((.112 * b.wide, -.035, .79 * s))
    for n, (yaw, pitch, length) in enumerate(((-30, 35, .055), (10, 55, .065), (45, 30, .05))):
        direction = Vector((math.sin(math.radians(yaw)) * math.cos(math.radians(pitch)) * .7 + .3, -.15, math.sin(math.radians(pitch)))).normalized()
        hk.loft(crest.bm, [
            {"c": base, "rx": .003, "ry": .0016},
            {"c": base + direction * length * .35, "rx": .014, "ry": .0024},
            {"c": base + direction * length * .7, "rx": .011, "ry": .002},
            {"c": base + direction * length, "rx": .0008, "ry": .0008},
        ], sides=6, front=Vector((0, -1, 0)))
    feathers = fig.piece("crest-feathers", lambda co, n: mix("#f2e6c8", "#5a4632", smoothstep(.9 * s, 1.0 * s, co.z)), {"shoulder.L": 1.0, "chest": .6}, smooth=1, ao=.5)
    for n, (dx, dy, length) in enumerate(((.035, .03, .17), (.06, .05, .15))):
        direction = Vector((dx, dy, 1)).normalized()
        start = base + Vector((.005 * n, .012, .006))
        bend = Vector((.02, .025, 0))
        hk.loft(feathers.bm, [
            {"c": start, "rx": .0025, "ry": .0015},
            {"c": start + direction * length * .25, "rx": .009, "ry": .0018},
            {"c": start + direction * length * .6 + bend * .4, "rx": .0105, "ry": .0018},
            {"c": start + direction * length * .9 + bend, "rx": .006, "ry": .0015},
            {"c": start + direction * length + bend * 1.2, "rx": .0008, "ry": .0008},
        ], sides=6, front=Vector((0, -1, 0)))
    pin = fig.piece("crest-pin", "#c9953e", {"shoulder.L": 1.0, "chest": .6}, smooth=0, ao=.4, gloss=1.0)
    hk.ellipsoid(pin.bm, base + Vector((0, -.006, 0)), (.011, .006, .011), 10, 6)

    for side, sign in SIDES:
        sleeve(fig, j, side, lambda co, n: mix(shirt, "#3e4836", smoothstep(-.2, .8, n.y) * .3), leather, b.skin)
        trousers(fig, j, b, side, lambda co, n: mix("#3e3a2a", "#2a271c", smoothstep(.36, .2, co.z) * .3))
        hp.boot(fig, j, side, sign, "#4a3020", "#241810", .26 * s, cuff="#5e3e28", slouch=.003)
    seat(fig, b, "#3e3a2a")


def mesa_shade(fig, j, b, hz):
    """A desert traveler: a wide straw hat, a sand veil over the lower face and a dark red shawl."""
    s = b.scale
    rx, ry, rz = b.head
    k = rz / .077
    hair = streaked(b.hair, b.hair_light)
    center = Vector((0, .006, hz + .006 * k))
    radii = Vector((rx + .006 * k, ry + .009 * k, rz + .008 * k))
    hair_curtain(fig, b, hz, center, radii, hair, lambda a: lerp(.83 * s, .8 * s, smoothstep(-.3, .6, math.sin(a))),
                 start=FRONT + .85, end=FRONT + 2 * math.pi - .85, top=.75, lift=.004, flare=.03, wave=.008, jag=.04)
    locks = fig.piece("hair-locks", hair, head_weights(hz), smooth=1, ao=1.0)
    for n, a in enumerate((FRONT + .9, FRONT + 1.3, FRONT - .9, FRONT - 1.3)):
        hanging_lock(locks.bm, center, radii, a, .55, .07 * k, .018 * k, .006 * k, flare=.026 * k, wave=.008 * k, phase=n * 2, tip=.2)
    # The wide straw hat, with a red band. The brim is shorter at the back,
    # clear of the banner pole.
    straw, straw_dark, band_red = "#e2c78e", "#a8884e", "#b5533a"

    def weave(co, n):
        a = math.atan2(co.y, co.x)
        r = math.hypot(co.x, co.y)
        cross = math.sin(a * 90) * math.sin(r * 700 + co.z * 500)
        return mix(mix(straw, straw_dark, smoothstep(-.2, .9, cross) * .3), straw_dark, smoothstep(.3, -.8, n.z) * .4)

    base_z = hz + .03 * k
    crown = fig.piece("hat-crown", weave, "head", smooth=1, ao=.8)
    hk.loft(crown.bm, [
        {"c": (0, .004, base_z - .004), "rx": rx + .013, "ry": ry + .012},
        {"c": (0, .004, base_z + .03 * k), "rx": rx + .009, "ry": ry + .008},
        {"c": (0, .004, base_z + .058 * k), "rx": rx * .82, "ry": ry * .8},
        {"c": (0, .004, base_z + .07 * k), "rx": rx * .55, "ry": ry * .52},
    ], sides=24, caps=(False, True))
    for vert in crown.bm.verts:
        # A pinch at the front of the crown.
        if vert.co.z > base_z + .05 * k:
            vert.co.z -= .01 * k * smoothstep(.0, -1, vert.co.y / ry)
    brim = fig.piece("hat-brim", weave, "head", smooth=1, ao=.7)
    rows = []
    for r in range(5):
        t = r / 4
        row = []
        for c in range(33):
            a = 2 * math.pi * c / 32
            back = max(0.0, math.sin(a))
            reach = (.1 - .068 * back ** .7) * t
            radius = Vector((math.cos(a) * (rx + .01 + reach), math.sin(a) * (ry + .009 + reach) + .004, 0))
            droop = -.014 * t * t * (1 - back) + .016 * t * t * back
            row.append(radius + Vector((0, 0, base_z + droop - .003)))
        rows.append(row)
    hk.sheet(brim.bm, rows)
    solid(brim.bm, .005)
    band = fig.piece("hat-band", band_red, "head", smooth=1, ao=.7)
    hk.loft(band.bm, [
        {"c": (0, .004, base_z + .001), "rx": rx + .015, "ry": ry + .014},
        {"c": (0, .004, base_z + .016 * k), "rx": rx + .0125, "ry": ry + .0115},
    ], sides=24, caps=(False, False))

    # The sand veil covers the face below the eyes and falls over the neck.
    sand, sand_dark = "#e6d3a8", "#b89a68"
    veil_color = lambda co, n: mix(sand, sand_dark, smoothstep(.4, -.7, n.z) * .5 + (.5 + .5 * math.sin(co.z * 300 + co.x * 90)) * .12)
    veil = fig.piece("veil", veil_color, weights_by_height((hz - .055 * k, {"head": 1.0}), (.82 * s, {"head": .5, "neck": .5}), (0, {"neck": .4, "chest": .6})), smooth=1, ao=.35)

    def folds(theta):
        return .05 * math.sin(theta * 5 + .4)

    veil_rows = [
        (hz - .016 * k, rx * 1.02 + .006, ry * 1.02 + .016, ry * .9),
        (hz - .04 * k, rx * .98 + .008, ry * .98 + .014, ry * .85),
        (hz - .068 * k, rx * .86 + .01, ry * .9 + .012, ry * .8),
        (hz - .095 * k, .06, ry * .76, .058),
        (.84 * s, .064, .066, .06),
        (.805 * s, .088, .082, .072),
    ]
    hk.loft(veil.bm, [{"c": (0, .006, z), "rx": a, "front": f, "back": bk, **({"wave": folds} if i > 2 else {})} for i, (z, a, f, bk) in enumerate(veil_rows)], sides=24, caps=(False, False))
    for vert in veil.bm.verts:
        # The top edge dips under the eyes and rises at the ears.
        if abs(vert.co.z - veil_rows[0][0]) < 1e-5:
            vert.co.z -= .006 * k * smoothstep(.5, 1, -vert.co.y / (ry + .02))

    # The dark red shawl: a heavy roll over the shoulders and one end down the back.
    red, red_dark = "#8a2e24", "#561812"
    wool = lambda co, n: mix(red, red_dark, smoothstep(.5, -.6, n.z) * .5 + (.5 + .5 * hk.noise.noise(co * 120)) * .2)
    neck_roll(fig, b, "shawl", wool, .79, .118 * b.wide, .09 * b.deep, .032, folds=.18, lift=.0, back_drop=.022, steps=28, sides=12)
    tail = fig.piece("shawl-tail", wool, {"chest": 1.0, "spine": .7}, smooth=1)
    grid = []
    for r in range(8):
        t = r / 7
        c = Vector((-.05 - .01 * t, .085 * b.deep + .015 * math.sin(t * 2), (.77 - .22 * t) * s))
        w = .032 + .01 * t
        grid.append([c + Vector((-w, 0, 0)), c + Vector((0, .004, 0)), c + Vector((w, 0, 0))])
    hk.sheet(tail.bm, grid, .007, (0, -1, 0))

    def robe(co, n):
        return mix("#c9a272", "#93714a", smoothstep(.6, .38, co.z) * .4 + smoothstep(-.2, .8, n.y) * .15)

    tunic(fig, b, robe, hem=[(.40, .134 * b.hips, .086, .088), (.36, .14 * b.hips, .09, .092)], folds=.026, thigh=.3)
    hp.stand_collar(fig, s, "#93714a", .054, .051)
    sash = fig.piece("sash", band_red, {"hips": 1.0, "spine": 1.0}, smooth=1)
    rows = torso(b)
    hk.loft(sash.bm, [
        {"c": (0, 0, z * s), "rx": next(r for zz, r, f, bk in rows if zz <= .6) + .008 + d, "front": .072 + d, "back": .068 + d, "power": 2.2}
        for z, d in ((.565, .002), (.59, .004), (.615, .002))
    ], sides=24, caps=(False, False))
    for side, sign in SIDES:
        sleeve(fig, j, side, robe, "#93714a", b.skin, rings=[
            ("shoulder", .3, .047, .05), ("upperarm", 0.0, .049, .052), ("upperarm", .45, .047, .048),
            ("upperarm", .9, .043, .044), ("forearm", .35, .041, .041), ("forearm", .75, .042, .042), ("forearm", .86, .044, .044),
        ])
        trousers(fig, j, b, side, lambda co, n: mix("#e8dcc0", "#b8a888", smoothstep(.36, .15, co.z) * .4), loose=.018)
        # Cloth wraps over the boots.
        hp.boot(fig, j, side, sign, "#6a4428", "#2e1c12", .19 * s, cuff="#c9b48c")
    seat(fig, b, "#c9a272", (.1, .066, .066))


def salt_wind(fig, j, b, hz):
    """An old sailor: cropped grey hair, a short grey beard, a wool cap pushed back and a navy coat."""
    s = b.scale
    rx, ry, rz = b.head
    k = rz / .077
    hair = streaked(b.hair, b.hair_light)
    center, radii = hp.hair_mass(fig, b, hz, (.05 * k, -.012 * k, -.055 * k), .002 * k, hair, sides=.004, ridges=.004)
    locks = fig.piece("hair-locks", hair, "head", smooth=1, ao=1.0)
    for side, sign in SIDES:
        a = 0 if sign > 0 else math.pi
        for offset in (-.6, -.25, .1):
            hp.surface_lock(locks.bm, center, radii, (a + (offset - .1) * sign, .7), (a + (offset + .2) * sign, -.08), .02 * k, (.004 * k, .005 * k), .003 * k, .4)
    beard(fig, b, hz, streaked(b.hair, "#f2efe8"), thickness=.0065, chin=1.2)

    # The wool cap, pushed back on the head, with a rolled brim.
    navy_cap, navy_cap_dark = "#2a3a58", "#18233a"
    rib = lambda co, n: mix(navy_cap, navy_cap_dark, (.5 + .5 * math.sin(math.atan2(co.y, co.x) * 40)) * .4 + smoothstep(.3, -.6, n.z) * .3)
    cap = fig.piece("cap", rib, "head", smooth=1, ao=.8)
    # The cap covers the crown and the back of the head; the front hair shows.
    cap_center = center + Vector((0, .006, .002 * k))
    cap_radii = radii + Vector((.006, .007, .007))
    verts = hk.ellipsoid(cap.bm, cap_center, cap_radii, 28, 20)

    def cap_edge(y):
        return hz + .075 * k - .1 * k * smoothstep(-ry * .8, ry, y)

    hk.push(verts, cap_center + Vector((0, cap_radii.y * .8, cap_radii.z * .6)), .045, (0, .008, .004))
    bmesh.ops.delete(cap.bm, geom=[v for v in verts if v.co.z < cap_edge(v.co.y)], context="VERTS")
    solid(cap.bm, .004)
    roll = fig.piece("cap-roll", rib, "head", smooth=1, ao=.7)
    path = []
    for n in range(33):
        a = 2 * math.pi * n / 32
        unit = Vector((math.cos(a), math.sin(a), 0))
        # The roll sits on the cap surface at the height of its edge.
        y = cap_center.y + math.sin(a) * cap_radii.y
        z = cap_edge(y)
        height = max(0.0, 1 - ((z - cap_center.z) / cap_radii.z) ** 2) ** .5
        point = cap_center + Vector((math.cos(a) * cap_radii.x * height, math.sin(a) * cap_radii.y * height, z - cap_center.z))
        path.append({"c": point + unit * .004, "rx": .0085, "ry": .007, "dir": (0, 0, 1)})
    hk.loft(roll.bm, path, sides=8, caps=(False, False))

    navy, navy_dark, sea = "#22384e", "#142233", "#2f5d73"

    def coat(co, n):
        color = mix(navy, navy_dark, smoothstep(.6, .36, co.z) * .3 + smoothstep(-.2, .8, n.y) * .2)
        color = mix(color, sea, smoothstep(.4, .9, n.dot(Vector((-.4, -.7, .5)).normalized())) * .25)
        if co.y < 0 and abs(co.x + .004) < .003 and co.z < .56 * s:
            return navy_dark
        return color

    tunic(fig, b, coat, hem=[(.40, .14 * b.hips, .092, .094), (.37, .146 * b.hips, .096, .098)], folds=.016, thigh=.32)
    buttons = fig.piece("coat-buttons", "#c9a24f", {"hips": 1.0, "spine": .6}, smooth=0, ao=.5, gloss=.8)
    for z in (.42, .47, .52):
        hk.ellipsoid(buttons.bm, (.016, -.083 * b.deep * b.hips - .006, z * s), (.0055, .003, .0055), 8, 6)
    belt(fig, b, "#1e1a18", "#9aa3a8", z=.58)
    # The salt-crusted shearling collar.
    fur_roll(fig, b, "collar", "#efe6d2", "#fffaf0", .79, .1 * b.wide, .084 * b.deep, .03, back_drop=-.012)
    for side, sign in SIDES:
        sleeve(fig, j, side, coat, "#efe6d2", b.skin, rings=[
            ("shoulder", .3, .048, .051), ("upperarm", 0.0, .05, .053), ("upperarm", .45, .046, .047),
            ("upperarm", .9, .042, .043), ("forearm", .35, .039, .039), ("forearm", .75, .039, .039), ("forearm", .86, .041, .041),
        ])
        trousers(fig, j, b, side, lambda co, n: mix("#3e4a56", "#2a333c", smoothstep(.36, .2, co.z) * .3))
        hp.boot(fig, j, side, sign, "#2a2420", "#141010", .23 * s, cuff="#3a322c")
    seat(fig, b, navy, (.1, .066, .066))


def lantern_keeper(fig, j, b, hz):
    """An older keeper: a dark leather hood up, a cream cowl, a brown robe and a brass lantern."""
    s = b.scale
    rx, ry, rz = b.head
    k = rz / .077
    hair = streaked(b.hair, b.hair_light)
    center, radii = hp.hair_mass(fig, b, hz, (.056 * k, -.01 * k, -.05 * k), .004 * k, hair, ridges=.004)
    locks = fig.piece("hair-locks", hair, "head", smooth=1, ao=1.0)
    # Grey hair parted in the middle and swept to both sides, under the hood.
    for n in range(6):
        side = -1 if n < 3 else 1
        a = FRONT + side * (.1 + .16 * (n % 3))
        hp.surface_lock(locks.bm, center, radii, (FRONT + side * .04, .78), (a + .5 * side, .3), .022 * k, (.002 * k, .003 * k), .003 * k, .45, thickness=.005 * k)

    # The hood: a thick leather shell around the head with an opening for
    # the face, and a short mantle over the shoulders.
    leather, leather_dark = "#4e3422", "#2c1c12"
    hide = lambda co, n: mix(leather, leather_dark, smoothstep(.4, -.6, n.z) * .45 + (.5 + .5 * hk.noise.noise(co * 110)) * .2)
    hood = fig.piece("hood", hide, weights_by_height((hz - .05 * k, {"head": 1.0}), (0, {"head": .6, "neck": .4})), smooth=1, ao=1.0)
    hood_center = Vector((0, .022, hz + .004 * k))
    hood_radii = Vector((rx + .02, ry + .02, rz + .024))
    # A sphere with its pole at the front: the face opening is a clean ring.
    geom = bmesh.ops.create_uvsphere(hood.bm, u_segments=28, v_segments=22, radius=1.0)
    verts = geom["verts"]
    opening = .74
    for v in verts:
        x, y, z = v.co.x, v.co.y, v.co.z
        v.co = Vector((x, z, -y))  # The +Z pole turns to -Y, the front.
    bmesh.ops.delete(hood.bm, geom=[v for v in verts if -v.co.y > math.cos(opening)], context="VERTS")
    verts = list(hood.bm.verts)
    for v in verts:
        local = Vector((v.co.x * hood_radii.x, v.co.y * hood_radii.y, v.co.z * hood_radii.z))
        # The opening is taller than wide, and lower, so the brow shows.
        local.z -= .012 * k * smoothstep(-.5, -1, v.co.y)
        local.x *= 1 - .08 * smoothstep(-.2, -.8, v.co.y)
        v.co = hood_center + local
    # A soft peak at the back of the crown, and folds down the back.
    hk.push(verts, hood_center + Vector((0, hood_radii.y * .7, hood_radii.z * .75)), .06, (0, .02, .016))
    for v in verts:
        if v.co.y > hood_center.y:
            v.co.x += .004 * math.sin(v.co.z * 160) * smoothstep(hz, hz - .08, v.co.z)
    solid(hood.bm, .006)
    hem = fig.piece("hood-hem", mix(leather, leather_dark, .5), "head", smooth=1, ao=.6)
    ring = []
    for n in range(29):
        phi = 2 * math.pi * n / 28
        unit = Vector((math.sin(opening) * math.cos(phi), -math.cos(opening), math.sin(opening) * math.sin(phi)))
        local = Vector((unit.x * hood_radii.x, unit.y * hood_radii.y, unit.z * hood_radii.z))
        local.z -= .012 * k * smoothstep(-.5, -1, unit.y)
        local.x *= 1 - .08 * smoothstep(-.2, -.8, unit.y)
        ring.append({"c": hood_center + local + Vector((0, -.001, 0)), "rx": .0045, "ry": .004, "dir": (0, -1, 0)})
    hk.loft(hem.bm, ring, sides=8, caps=(False, False))

    mantle = fig.piece("hood-mantle", hide, {"chest": 1.0, "neck": .6, "shoulder.L": .3, "shoulder.R": .3}, smooth=1, ao=1.0)

    def folds(theta):
        return .06 * math.sin(theta * 6 + .3)

    loops = hk.loft(mantle.bm, [
        {"c": (0, .03, hz - .07 * k), "rx": rx * .9 + .016, "front": ry * .55, "back": ry * .9 + .02},
        {"c": (0, .016, .835 * s), "rx": .094, "front": .07, "back": .088},
        {"c": (0, .01, .805 * s), "rx": .13 * b.wide, "front": .094, "back": .096, "wave": folds},
        {"c": (0, .008, .782 * s), "rx": .146 * b.wide, "front": .104, "back": .104, "wave": folds},
    ], sides=28, caps=(False, False))
    for vert in loops[-1] + loops[-2]:
        vert.co.z -= .034 * smoothstep(0, .1, vert.co.y)
    # The mantle opens at the front, under the chin, where the cowl shows.
    bmesh.ops.delete(mantle.bm, geom=[v for v in mantle.bm.verts if v.co.y < -.035 and abs(v.co.x) < .05 + (.835 * s - v.co.z) * .6], context="VERTS")
    solid(mantle.bm, .004)
    cowl = lambda co, n: mix("#ece2cc", "#c2b394", smoothstep(.5, -.6, n.z) * .5 + (.5 + .5 * math.sin(co.z * 400)) * .1)
    neck_roll(fig, b, "cowl", cowl, .812, .066, .07, .03, folds=.28, lift=.012, bones={"neck": .8, "chest": 1.0})

    def robe(co, n):
        return mix("#4a3626", "#2e2018", smoothstep(.6, .36, co.z) * .35 + smoothstep(-.2, .8, n.y) * .2)

    tunic(fig, b, robe, hem=[(.40, .138 * b.hips, .09, .092), (.35, .146 * b.hips, .096, .098)], folds=.024, thigh=.32)
    rx_belt, f_belt, _bk = belt(fig, b, "#2a1a10", "#c9953e", z=.575)

    # A small brass lantern on the belt at the figure's left hip. Its glass is
    # a warm amber, the color of the portrait's light.
    lantern_bones = {"hips": 1.0, "thigh.L": .25}
    brass = fig.piece("lantern-brass", "#c9953e", lantern_bones, smooth=0, ao=.6, gloss=1.0)
    glass = fig.piece("lantern-glass", lambda co, n: mix("#ffd76a", "#ff9a2a", smoothstep(.5 * s, .43 * s, co.z)), lantern_bones, smooth=0, ao=.0, gloss=1.0)
    lx, ly, top = rx_belt + .012, -.035, .555 * s
    hk.kit.torus(brass.bm, (lx, ly, top + .012), (0, 1, 0), .008, .0018, 10, 4)
    hk.loft(brass.bm, [{"c": (lx, ly, top), "rx": .006, "ry": .006}, {"c": (lx, ly, top - .012), "rx": .019, "ry": .019}], sides=8)
    hk.loft(glass.bm, [{"c": (lx, ly, top - .012), "rx": .015, "ry": .015}, {"c": (lx, ly, top - .05), "rx": .015, "ry": .015}], sides=8)
    for n in range(4):
        a = math.pi / 4 + n * math.pi / 2
        x, y = lx + math.cos(a) * .0165, ly + math.sin(a) * .0165
        hk.loft(brass.bm, [{"c": (x, y, top - .012), "rx": .0022, "ry": .0022}, {"c": (x, y, top - .05), "rx": .0022, "ry": .0022}], sides=4)
    hk.loft(brass.bm, [{"c": (lx, ly, top - .05), "rx": .019, "ry": .019}, {"c": (lx, ly, top - .058), "rx": .016, "ry": .016}], sides=8)

    for side, sign in SIDES:
        sleeve(fig, j, side, robe, "#2e2018", b.skin, rings=[
            ("shoulder", .3, .047, .05), ("upperarm", 0.0, .049, .052), ("upperarm", .45, .046, .047),
            ("upperarm", .9, .042, .043), ("forearm", .35, .04, .04), ("forearm", .75, .041, .041), ("forearm", .86, .043, .043),
        ])
        trousers(fig, j, b, side, lambda co, n: mix("#3a3028", "#241e18", smoothstep(.36, .2, co.z) * .3))
        hp.boot(fig, j, side, sign, "#3a2618", "#1a120c", .2 * s, slouch=.004)
    seat(fig, b, "#4a3626", (.1, .066, .066))


def gold_crest(fig, j, b, hz):
    """A noble veteran: silver hair swept back, a silver beard, a gold circlet and a fur-edged blue coat."""
    s = b.scale
    rx, ry, rz = b.head
    k = rz / .077
    hair = streaked(b.hair, b.hair_light)
    center, radii = hp.hair_mass(fig, b, hz, (.062 * k, -.006 * k, -.06 * k), .004 * k, hair, ridges=.007)
    hair_curtain(fig, b, hz, center, radii, hair, lambda a: lerp(hz - .06 * k, .85 * s, smoothstep(-.1, .7, math.sin(a))),
                 start=FRONT + 1.45, end=FRONT + 2 * math.pi - 1.45, lift=.008, flare=.026, wave=.006, jag=.025)
    locks = fig.piece("hair-locks", hair, head_weights(hz), smooth=1, ao=1.0)
    # Two waves at the temples, swept back over the ears.
    for side in (1, -1):
        a = FRONT + side * .75
        hp.surface_lock(locks.bm, center, radii, (a, .45), (a + side * .7, .25), .03 * k, (.004 * k, .008 * k), .004 * k, .35, thickness=.006 * k)
    beard(fig, b, hz, streaked(b.hair, "#f6f3ee"), thickness=.0065, chin=1.5)

    # The gold circlet, with one dark stone over the brow.
    circlet = fig.piece("circlet", lambda co, n: mix("#e9c46a", "#a8822e", smoothstep(.3, -.6, n.z) * .5), "head", smooth=0, ao=.5, gloss=1.0)
    path = []
    for n in range(33):
        a = 2 * math.pi * n / 32
        # On the skin of the brow at the front, on the hair at the sides and the back.
        depth = (ry + .005) if math.sin(a) < 0 else (ry + .022)
        x, y = math.cos(a) * (rx + .005), math.sin(a) * depth + .004
        z = hz + .036 * k + .02 * k * smoothstep(-ry, ry, y)
        path.append({"c": (x, y, z), "rx": .0085, "ry": .0028, "dir": (0, 0, 1)})
    hk.loft(circlet.bm, path, sides=6, caps=(False, False))
    stone = fig.piece("circlet-stone", lambda co, n: mix("#1a2a4a", "#7aa0d8", smoothstep(.6, 1, n.dot(Vector((-.3, -.8, .5)).normalized()))), "head", smooth=0, ao=.2, gloss=1.0)
    front = Vector((0, -(ry + .005) + .004 - .003, hz + .036 * k))
    hk.ellipsoid(stone.bm, front, (.008, .004, .0095), 12, 8)
    hk.kit.torus(circlet.bm, front + Vector((0, .001, 0)), (0, -1, 0), .0095, .0018, 14, 4)

    blue, blue_dark, blue_light = "#1d2b4a", "#0f172a", "#34507e"

    def coat(co, n):
        color = mix(blue, blue_dark, smoothstep(.6, .36, co.z) * .3 + smoothstep(-.2, .8, n.y) * .2)
        color = mix(color, blue_light, smoothstep(.45, .9, n.dot(Vector((-.4, -.7, .5)).normalized())) * .3)
        # Gold trim down the front opening and at the hem.
        if co.y < 0 and abs(co.x) < .005 and co.z < .57 * b.scale:
            return "#d8b45a"
        if co.z < .352 * b.scale:
            return "#d8b45a"
        return color

    tunic(fig, b, coat, hem=[(.40, .14 * b.hips, .09, .092), (.345, .148 * b.hips, .096, .098)], folds=.014, thigh=.32)
    belt(fig, b, "#1a1410", "#e9c46a")
    # A high blue collar, open at the front, with a fur edge over the shoulders.
    collar = fig.piece("collar", blue, {"chest": 1.0, "neck": .5}, smooth=1, ao=.8)
    loops = hk.loft(collar.bm, [
        {"c": (0, .014, .795 * s), "rx": .1, "front": .08, "back": .086},
        {"c": (0, .022, .845 * s), "rx": .088, "front": .07, "back": .082},
        {"c": (0, .03, .875 * s), "rx": .09, "front": .066, "back": .084},
    ], sides=24, caps=(False, False))
    bmesh.ops.delete(collar.bm, geom=[v for v in collar.bm.verts if v.co.y < -.02 and abs(v.co.x) < .06 - (v.co.z - .795 * s) * .4], context="VERTS")
    solid(collar.bm, .005)
    fur_roll(fig, b, "fur", "#efe1bc", "#fff8e6", .795, .112 * b.wide, .09 * b.deep, .028, back_drop=-.006)
    for side, sign in SIDES:
        sleeve(fig, j, side, coat, "#efe1bc", b.skin, rings=[
            ("shoulder", .3, .048, .051), ("upperarm", 0.0, .05, .053), ("upperarm", .45, .046, .047),
            ("upperarm", .9, .042, .043), ("forearm", .35, .039, .039), ("forearm", .75, .039, .039), ("forearm", .86, .041, .041),
        ])
        trousers(fig, j, b, side, lambda co, n: mix("#2a3044", "#1a1e2c", smoothstep(.36, .2, co.z) * .3))
        hp.boot(fig, j, side, sign, "#1e1a1a", "#0e0c0c", .27 * s, cuff="#c9a24f")
    seat(fig, b, blue, (.1, .066, .066))


DRESS = {
    "dawn-gaze": dawn_gaze,
    "verdant-crest": verdant_crest,
    "mesa-shade": mesa_shade,
    "salt-wind": salt_wind,
    "lantern-keeper": lantern_keeper,
    "gold-crest": gold_crest,
}


# --- Face marks ------------------------------------------------------------


def freckles(co, color, hz, k):
    if co.y > -.03:
        return color
    spot = hk.noise.noise(co * 900, noise_basis="VORONOI_F1")
    band = smoothstep(.03 * k, .012 * k, abs(co.z - (hz - .022 * k))) * smoothstep(.006 * k, .014 * k, abs(co.x))
    return mix(color, "#9a5a38", smoothstep(.12, .04, spot) * band * .55)


def scar(x, z, length, angle, tone="#e2b8a0"):
    """A thin pale scar line on the face at (x, z), in units of the head factor k."""

    def mark(co, color, hz, k):
        if co.y > -.02:
            return color
        dx, dz = co.x - x * k, co.z - (hz + z * k)
        along = dx * math.cos(angle) + dz * math.sin(angle)
        across = -dx * math.sin(angle) + dz * math.cos(angle)
        if abs(along) > length * k:
            return color
        return mix(color, tone, smoothstep(.0012 * k, .0004 * k, abs(across)) * .9)

    return mark


def soot(x, z, radius):
    def mark(co, color, hz, k):
        if co.y > -.02:
            return color
        d = math.hypot(co.x - x * k, (co.z - (hz + z * k)) * 1.4) / (radius * k)
        smear = .5 + .5 * hk.noise.noise(co * 500)
        return mix(color, "#2a1e1a", (1 - smoothstep(.3, 1, d)) * (.45 + .3 * smear))

    return mark
