"""The four Gear items of a Gear look, fitted to one person.

Each Gear look is a set of colors and ornaments on the same parts, so every
look fits every person (decision 17). The breastplate follows the torso
measurements of the person; the sword, amulet and banner follow the bones.
"""
import math

from mathutils import Vector
from mathutils.bvhtree import BVHTree

import hero_kit as hk
from hero_kit import mix, smoothstep

LOOKS = {
    # Plain steel, brass trim, a leather grip and a blue field banner.
    "standard": dict(
        plate="#9aa3a8", plate_dark="#5d666d", trim="#c9a24f", strap="#5a3b28",
        blade="#c3cbcf", blade_dark="#7e888e", inlay="#9aa3a8", grip="#5a3b28", grip_wrap="#3a271b",
        stone="#e6dcc0", cloth="#2f5596", cloth_dark="#1f3a6b", emblem="#e9c46a", pole="#5a4030",
        ornate=False, style="plain",
    ),
    # Hammered copper with a bright rolled rim, oxblood leather, verdigris and an amber stone.
    "copper-rim": dict(
        plate="#c8743e", plate_dark="#86431f", trim="#ffb878", strap="#6a2a24",
        blade="#d08a56", blade_dark="#8e4a28", inlay="#f6c08a", grip="#6a2a24", grip_wrap="#4a1a16",
        stone="#e8a030", cloth="#6a2a24", cloth_dark="#40130f", emblem="#f0a868", pole="#3e2a1e",
        verdigris="#5f9a86", ornate=False, style="copper",
    ),
    # Dark wrought iron with vine scrolls, green enamel leaves and a moss green stone.
    "iron-vine": dict(
        plate="#4a4f52", plate_dark="#24282a", trim="#7d8589", strap="#4f7a3a",
        blade="#7a8287", blade_dark="#3c4246", inlay="#7d8589", grip="#4f7a3a", grip_wrap="#33521f",
        stone="#3f8a3a", cloth="#4f7a3a", cloth_dark="#2c4a1e", emblem="#7d8589", pole="#33383a",
        leaf="#5aa83c", ornate=False, style="vine",
    ),
    # Tan boiled leather, cream stitches, pale horn and brass rivets.
    "stag-leather": dict(
        plate="#9a6a3c", plate_dark="#5e3c1e", trim="#c9a24f", strap="#3e2716",
        blade="#c9d0d4", blade_dark="#808a90", inlay="#c9d0d4", grip="#e8dcc0", grip_wrap="#cbbd9c",
        stone="#ece0c2", cloth="#a87848", cloth_dark="#74502c", emblem="#efe0c0", pole="#6a4a30",
        stitch="#efe0c0", guard="#8a5a30", ornate=False, style="stitch",
    ),
    # Blackened steel with gold inlay, a teal stone and a black banner (Gear icons).
    "gold-inlay": dict(
        plate="#3a3a40", plate_dark="#1c1c21", trim="#e8b53e", strap="#2a2420",
        blade="#5a5c63", blade_dark="#2c2d33", inlay="#e8b53e", grip="#1d1b1d", grip_wrap="#e8b53e",
        stone="#1aa39a", cloth="#1c1c22", cloth_dark="#0e0e12", emblem="#e8b53e", pole="#2a2420",
        ornate=True, style="inlay",
    ),
    # Pale brushed silver, milky moonstones and pale lavender leather.
    "moonstone": dict(
        plate="#c9d0d8", plate_dark="#7e8796", trim="#eef2f6", strap="#a99cc9",
        blade="#dfe5ea", blade_dark="#9aa4ae", inlay="#eef2f6", grip="#a99cc9", grip_wrap="#857aa8",
        stone="#e6eef5", cloth="#b6aad4", cloth_dark="#8578ad", emblem="#eef2f6", pole="#d6c6a4",
        sheen="#a9c4ee", ornate=False, style="moon",
    ),
    # Polished white steel with gold fluting, crimson cloth with a white edge and a ruby.
    "royal-plate": dict(
        plate="#e9edf0", plate_dark="#9ea8b2", trim="#e9c46a", strap="#8c1c2c",
        blade="#eef2f5", blade_dark="#a2acb5", inlay="#e9c46a", grip="#8c1c2c", grip_wrap="#5e101c",
        stone="#c0122e", cloth="#8c1c2c", cloth_dark="#5a0f1a", emblem="#e9c46a", pole="#ece6da",
        edge="#f6f1e6", ornate=False, style="fluted",
    ),
}

# The plate highlight: white on bright metal, muted on dark metal.
SHINE = {"plain": "#ffffff", "inlay": "#8a8a96", "copper": "#ffe0c0", "vine": "#9aa2a6",
         "stitch": "#c89a68", "moon": "#ffffff", "fluted": "#ffffff"}
GLOSS = {"stitch": .25}


def _scroll(x0, z0, sign, radius, turns=1.55, start=1.05, shrink=.62, steps=13):
    """The (x, z) points of a spiral scroll that opens toward the middle of the chest."""
    points = []
    for n in range(steps):
        t = n / (steps - 1)
        a = math.pi * (start - turns * t)
        r = radius * (1 - shrink * t)
        points.append((sign * (x0 - r * math.cos(a)), z0 + r * math.sin(a)))
    return points


def breastplate(fig, look, fit):
    """A cuirass shaped on the torso, with a ridge, rims and shoulder straps."""
    g = LOOKS[look]
    style = g["style"]
    s = fit["scale"]
    rings = fit["plate"]
    top_z, bottom_z = rings[0][0] * s, rings[-1][0] * s

    def plate_color(co, n):
        color = mix(g["plate"], g["plate_dark"], smoothstep(.2, -.6, n.z) * .5 + smoothstep(-.4, .9, n.y) * .35)
        if style == "copper":
            # Hammer marks: small bright and dark dents, and verdigris low in the seams.
            dent = hk.noise.noise(co * 260, noise_basis="VORONOI_F1")
            color = mix(color, g["plate_dark"], smoothstep(.22, .04, dent) * .6)
            color = mix(color, g["trim"], smoothstep(.45, .75, dent) * .35)
            seam = max(smoothstep(bottom_z + .028, bottom_z + .004, co.z), smoothstep(top_z - .022, top_z - .004, co.z))
            color = mix(color, g["verdigris"], smoothstep(-.1, .5, hk.noise.noise(co * 90)) * seam * .85)
        elif style == "stitch":
            grain = .5 + .5 * hk.noise.noise(co * 180)
            color = mix(color, g["plate_dark"], grain * .22)
        elif style == "moon":
            # Brushed silver: fine vertical streaks.
            color = mix(color, "#ffffff", (.5 + .5 * math.sin(co.x * 900 + hk.noise.noise(co * 40) * 3)) * .08)
        # A bright band where the polished front turns to the light.
        shine = .35 if style != "stitch" else .2
        return mix(color, SHINE[style], smoothstep(.55, .9, n.dot(Vector((-.35, -.75, .55)).normalized())) * shine)

    gloss = GLOSS.get(style, .9)
    plate = fig.piece("breastplate", plate_color, {"chest": 1.0, "spine": .55}, smooth=1, ao=.8, gloss=gloss)
    count = len(rings)
    loops = hk.loft(plate.bm, [
        {"c": (0, dy, z * s), "rx": rx + .012 + .006 * (i == count - 1), "front": f + .016 + .005 * (i == count - 1), "back": bk + .012, "power": 2.3}
        for i, (z, rx, f, bk, dy) in enumerate(rings)
    ], sides=28, caps=(False, False))
    # A raised ridge down the front, full chest plates and a narrower waist.
    flat = [v for loop in loops for v in loop]
    for vert in flat:
        if vert.co.y < 0:
            ridge = 1 - smoothstep(0, .028, abs(vert.co.x))
            height = smoothstep(bottom_z, bottom_z + .03, vert.co.z) * smoothstep(top_z, top_z - .02, vert.co.z)
            vert.co.y -= ridge * (.003 if style == "stitch" else .007) * height
    for sign in (1, -1):
        hk.push(flat, (.048 * sign, -.11, top_z - .055), .055, (.002 * sign, -.009, .002))
        hk.push(flat, (.11 * sign, 0, bottom_z + .045), .05, (-.008 * sign, 0, 0))
    tree = BVHTree.FromBMesh(plate.bm)

    def on_plate(x, z, lift=.0018):
        hit = tree.ray_cast(Vector((x, -1, z)), Vector((0, 1, 0)))
        return hit[0] + Vector((0, -lift, 0)) if hit[0] is not None else None

    def line(piece, xz, radius, depth=.0016, taper=.0):
        points = [on_plate(x, z) for x, z in xz]
        points = [p for p in points if p]
        if len(points) > 1:
            hk.loft(piece.bm, [{"c": p, "rx": radius * (1 - taper * n / len(points)), "ry": depth, "dir": (0, -1, 0)} for n, p in enumerate(points)], sides=6)

    inlay = fig.piece("plate-inlay", g["inlay"] if style == "vine" else g["trim"], {"chest": 1.0, "spine": .55}, smooth=0, ao=.5, gloss=1.0 if style != "stitch" else .7)
    if style in ("plain", "inlay", "copper"):
        # The ridge line, gold for Gold Inlay and plain for the others.
        line(inlay, [(0, z) for z in (top_z - .03, top_z - .07, bottom_z + .045, bottom_z + .012)], .0026 if g["ornate"] else .0018)
    if style == "inlay":
        for sign in (1, -1):
            line(inlay, _scroll(.03, top_z - .056, sign, .024), .0026, taper=.4)
            line(inlay, [(sign * (.004 + .03 * u), bottom_z + .035 + .02 * math.sin(u * 3.2)) for u in (0, .3, .6, .85, 1.0)], .002, .0015)
    elif style == "plain":
        for sign in (1, -1):
            for z in (top_z - .03, bottom_z + .02):
                p = on_plate(sign * .07, z)
                if p:
                    hk.ellipsoid(inlay.bm, p, (.0035, .0025, .0035), 8, 6)
    elif style == "copper":
        # Copper rivets along the sides of the chest.
        for sign in (1, -1):
            for z in (top_z - .025, top_z - .065, bottom_z + .045, bottom_z + .018):
                p = on_plate(sign * .082, z)
                if p:
                    hk.ellipsoid(inlay.bm, p, (.0042, .003, .0042), 8, 6)
    elif style == "vine":
        # Raised iron vines that curl across the chest, with green enamel leaves.
        leaves = fig.piece("plate-leaves", g["leaf"], {"chest": 1.0, "spine": .55}, smooth=0, ao=.4, gloss=.9)
        stem = [(0, bottom_z + .016), (.006, bottom_z + .05), (-.004, top_z - .08), (0, top_z - .03)]
        line(inlay, stem, .0034, .0024)
        for sign in (1, -1):
            line(inlay, _scroll(.034, top_z - .058, sign, .028, turns=1.7), .0034, .0024, taper=.5)
            line(inlay, _scroll(.04, bottom_z + .04, sign, .02, turns=1.4, start=.9), .003, .0022, taper=.5)
            for x, z, turn in ((.016, top_z - .03, 40), (.06, top_z - .085, -30), (.022, bottom_z + .062, 50), (.07, bottom_z + .028, -20)):
                p = on_plate(sign * x, z, .003)
                if p:
                    verts = hk.ellipsoid(leaves.bm, p, (.0095, .0028, .0048), 10, 6)
                    hk.rotate_about(leaves.bm, verts, p, (0, 1, 0), turn * sign)
    elif style == "stitch":
        # Cream stitches along the edges and brass rivets at the corners.
        stitches = fig.piece("plate-stitches", g["stitch"], {"chest": 1.0, "spine": .55}, smooth=0, ao=.3)
        for z_edge in (top_z - .014, bottom_z + .012):
            for n in range(-9, 10):
                x = n * .0125
                p = on_plate(x, z_edge, .0016)
                if p:
                    hk.kit.box(stitches.bm, p, (.0065, .002, .0022))
        for n in range(1, 8):
            for sign in (1, -1):
                p = on_plate(sign * .007, top_z - .012 - n * .016, .0016)
                if p:
                    hk.kit.box(stitches.bm, p, (.0022, .002, .0065))
        for sign in (1, -1):
            for z in (top_z - .03, bottom_z + .03):
                p = on_plate(sign * .085, z)
                if p:
                    hk.ellipsoid(inlay.bm, p, (.0045, .003, .0045), 8, 6)
    elif style == "moon":
        # One large moonstone at the center of the chest, in a silver bezel,
        # under the amulet, with silver lines that sweep out to the sides.
        middle = (top_z + bottom_z) / 2 - .008
        center = on_plate(0, middle, .004)
        if center:
            hk.kit.torus(inlay.bm, center, (0, -1, .1), .0165, .0036, 20, 6)
            stone = fig.piece("plate-moonstone", _moon_color(g), {"chest": 1.0}, smooth=0, ao=.25, gloss=1.0)
            hk.ellipsoid(stone.bm, center + Vector((0, -.002, 0)), (.0145, .0068, .0145), 16, 10)
        for sign in (1, -1):
            line(inlay, [(sign * (.024 + .056 * u), middle + .012 * u + .014 * u * u) for u in (0, .25, .5, .75, 1.0)], .002, taper=.6)
            line(inlay, [(sign * (.024 + .05 * u), middle - .01 * u - .008 * u * u) for u in (0, .3, .65, 1.0)], .0017, taper=.6)
    elif style == "fluted":
        # Gold fluting: parallel lines down the chest, closer at the waist.
        for n in (-2, -1, 0, 1, 2):
            line(inlay, [(n * .022 * mix_t, z) for mix_t, z in ((1.0, top_z - .022), (.9, top_z - .06), (.62, bottom_z + .03), (.5, bottom_z + .012))], .0024 if n == 0 else .0019)
        gem = fig.piece("plate-ruby", g["stone"], {"chest": 1.0}, smooth=0, ao=.3, gloss=1.0)
        p = on_plate(0, bottom_z + .028, .003)
        if p:
            hk.ellipsoid(gem.bm, p, (.0075, .004, .009), 10, 6)
            hk.kit.torus(inlay.bm, p, (0, -1, 0), .009, .0022, 16, 5)

    # Rims at the neck and the waist. Copper Rim has a thick rolled rim.
    rim_width = .0085 if style == "copper" else .0055
    for name, z_index in (("rim-top", 0), ("rim-bottom", -1)):
        z, rx, f, bk, dy = rings[z_index]
        rim = fig.piece(name, g["trim"] if style != "stitch" else g["plate_dark"], {"chest": 1.0, "spine": .55}, smooth=0, ao=.6, gloss=gloss)
        ring = {"rx": rx + .013, "front": f + .017, "back": bk + .013, "power": 2.5}
        path = []
        for k in range(25):
            theta = 2 * math.pi * k / 24
            radius_x, radius_y = hk.ring_radius(ring, theta)
            path.append(Vector((math.copysign(radius_x, math.cos(theta)), dy - math.copysign(radius_y, math.sin(theta)), z * s)))
        hk.loft(rim.bm, [{"c": p, "rx": rim_width, "ry": rim_width * .82, "dir": (0, 0, 1)} for p in path], sides=8, caps=(False, False))
    # Shoulder straps with buckles.
    for sign in (1, -1):
        strap = fig.piece("strap", g["strap"], {"chest": 1.0, f"shoulder.{'L' if sign > 0 else 'R'}": .4}, smooth=1, ao=.7)
        x = .085 * sign
        z = top_z
        points = [Vector((x, -.075, z - .01)), Vector((x, -.04, z + .03)), Vector((x, .02, z + .034)), Vector((x, .07, z - .01))]
        hk.loft(strap.bm, [{"c": p, "rx": .014, "ry": .004, "dir": (0, 0, 1) if i in (1, 2) else (0, -1, 0)} for i, p in enumerate(points)], sides=8)
        buckle = fig.piece("buckle", g["trim"], "chest", smooth=0, ao=.5, gloss=1.0)
        hk.kit.box(buckle.bm, points[0] + Vector((0, -.005, -.004)), (.022, .006, .016))
        if style == "stitch":
            stitches = fig.piece("strap-stitches", g["stitch"], "chest", smooth=0, ao=.3)
            for t in (.2, .45, .7):
                p = points[1].lerp(points[2], t) + Vector((0, 0, .0045))
                hk.kit.box(stitches.bm, p, (.0022, .006, .0016))


def _moon_color(g):
    """A milky stone with a soft blue sheen on the side away from the light."""

    def color(co, n):
        sheen = smoothstep(.1, .8, n.dot(Vector((.5, -.6, -.4)).normalized()))
        light = smoothstep(.5, 1, n.dot(Vector((-.3, -.8, .5)).normalized()))
        return mix(mix(g["stone"], g["sheen"], sheen * .7), "#ffffff", light * .8)

    return color


def _stone_color(g):
    if g["style"] == "moon":
        return _moon_color(g)
    return lambda co, n: mix(g["stone"], "#ffffff", smoothstep(.5, 1, n.dot(Vector((-.3, -.8, .5)).normalized())) * .7)


def amulet(fig, look, fit):
    """A pendant on a short chain, on the top of the breastplate below the chin."""
    g = LOOKS[look]
    style = g["style"]
    s = fit["scale"]
    z = fit["amulet_z"] * s
    y = fit["amulet_y"]
    # Stag Leather hangs on a leather cord; Royal Plate on a heavy gold chain.
    chain_color = {"stitch": g["strap"], "moon": g["trim"]}.get(style, g["trim"])
    thick = {"stitch": .0024, "fluted": .0028}.get(style, .0018)
    chain = fig.piece("amulet-chain", chain_color, {"chest": 1.0, "neck": .3}, smooth=0, ao=.5, gloss=.8 if style != "stitch" else .1)
    path = []
    for k in range(9):
        t = k / 8
        a = math.pi * (.15 + .7 * t)
        path.append(Vector((math.cos(a) * .045, y + .03 - math.sin(a) * .03, z + .045 - math.sin(a) * .045)))
    hk.loft(chain.bm, [{"c": p, "rx": thick, "ry": thick} for p in path], sides=4 if style != "fluted" else 6)
    if style == "fluted":
        for p in path[1:-1]:
            hk.ellipsoid(chain.bm, p, (.0042, .0042, .0042), 6, 4)
    rim_color = {"stitch": g["plate"], "vine": g["trim"]}.get(style, g["trim"])
    rim = fig.piece("amulet-rim", rim_color, "chest", smooth=0, ao=.5, gloss=1.0 if style != "stitch" else .2)
    radius = {"copper": .016, "fluted": .016}.get(style, .015)
    hk.kit.torus(rim.bm, (0, y, z), (0, -1, .25), radius, .0045 if style in ("copper", "stitch") else .0035, 20, 6)
    if g["ornate"]:
        for k in range(4):
            a = math.pi / 4 + k * math.pi / 2
            hk.ellipsoid(rim.bm, (math.cos(a) * .02, y, z + math.sin(a) * .02), (.004, .003, .004), 8, 6)
    elif style == "vine":
        leaves = fig.piece("amulet-leaves", g["leaf"], "chest", smooth=0, ao=.4, gloss=.9)
        for k in range(3):
            a = math.pi * (.75 + .5 * k)
            p = Vector((math.cos(a) * .021, y - .001, z + math.sin(a) * .021))
            verts = hk.ellipsoid(leaves.bm, p, (.0065, .0024, .0034), 8, 5)
            hk.rotate_about(leaves.bm, verts, p, (0, 1, 0), math.degrees(a) + 90)
    elif style == "stitch":
        brass = fig.piece("amulet-ring", g["trim"], "chest", smooth=0, ao=.4, gloss=1.0)
        hk.kit.torus(brass.bm, (0, y - .002, z + .022), (1, 0, 0), .005, .0015, 12, 4)
        stitches = fig.piece("amulet-stitches", g["stitch"], "chest", smooth=0, ao=.3)
        for k in range(10):
            a = 2 * math.pi * k / 10
            hk.kit.box(stitches.bm, (math.cos(a) * .0165, y - .004, z + math.sin(a) * .0165), (.0016, .0015, .0016))
    elif style == "fluted":
        for k in range(8):
            a = 2 * math.pi * k / 8
            hk.ellipsoid(rim.bm, (math.cos(a) * .0205, y, z + math.sin(a) * .0205), (.0028, .0028, .0028), 6, 4)
    size = {"copper": (.0135, .007, .0145), "moon": (.0135, .0068, .0145), "fluted": (.0125, .0066, .0135)}.get(style, (.012, .006, .013))
    stone = fig.piece("amulet-stone", _stone_color(g), "chest", smooth=0, ao=.3, gloss=1.0 if style != "stitch" else .3)
    hk.ellipsoid(stone.bm, (0, y - .002, z), size, 16, 10)


def sword(fig, look, j):
    """A sword in the right hand. In the bind pose its blade points down and forward."""
    g = LOOKS[look]
    style = g["style"]
    head, tail = j["hand.R"]
    center = head.lerp(tail, .45)
    axis = Vector((0, -.5, -.866)).normalized()
    side = Vector((1, 0, 0))
    face = axis.cross(side).normalized()
    pommel_end = center - axis * .05
    guard = center + axis * .042
    blade_length = .29
    tip = guard + axis * blade_length

    grip = fig.piece("sword-grip", lambda co, n: g["grip_wrap"] if int(((co - center).dot(axis) + .1) * 220) % 2 else g["grip"], "hand.R", smooth=0, ao=.5, gloss=.3 if g["ornate"] else 0)
    hk.loft(grip.bm, [
        {"c": center - axis * .044, "rx": .0065, "ry": .0065, "t": axis},
        {"c": center, "rx": .0072, "ry": .0072, "t": axis},
        {"c": guard, "rx": .0068, "ry": .0068, "t": axis},
    ], sides=8)
    pommel_color = {"stitch": g["grip"], "vine": g["trim"]}.get(style, g["trim"])
    pommel = fig.piece("sword-pommel", pommel_color, "hand.R", smooth=0, ao=.5, gloss=1.0)
    hk.ellipsoid(pommel.bm, pommel_end, (.011, .011, .011), 12, 8)
    if g["ornate"] or style in ("fluted", "copper", "moon", "vine"):
        gem = fig.piece("pommel-gem", _stone_color(g), "hand.R", smooth=0, ao=.2, gloss=1.0)
        hk.ellipsoid(gem.bm, pommel_end + face * .009, (.0065, .0065, .0065), 10, 6)
    guard_color = g["guard"] if style == "stitch" else g["trim"]
    cross = fig.piece("sword-guard", guard_color, "hand.R", smooth=1, ao=.5, gloss=1.0 if style != "stitch" else .2)
    curl = {"inlay": .012, "vine": .02, "fluted": .006}.get(style, .004)
    reach = .05 if style == "vine" else .042
    hk.loft(cross.bm, [
        {"c": guard + side * -reach + axis * curl, "rx": .004, "ry": .004, "t": side},
        {"c": guard + side * -.022, "rx": .006, "ry": .007, "t": side},
        {"c": guard, "rx": .008, "ry": .009, "t": side},
        {"c": guard + side * .022, "rx": .006, "ry": .007, "t": side},
        {"c": guard + side * reach + axis * curl, "rx": .004, "ry": .004, "t": side},
    ], sides=8)
    if g["ornate"] or style == "fluted":
        hk.ellipsoid(cross.bm, guard + axis * .006, (.012, .008, .012), 10, 6)
    if style == "vine":
        # Each arm of the guard ends in a curl of iron vine with a leaf.
        leaves = fig.piece("guard-leaves", g["leaf"], "hand.R", smooth=0, ao=.4, gloss=.9)
        for sign in (1, -1):
            end = guard + side * reach * sign + axis * curl
            hk.kit.torus(cross.bm, end + axis * .006, side, .006, .0022, 12, 4)
            hk.ellipsoid(leaves.bm, guard + side * .02 * sign - axis * .006, (.007, .003, .0045), 8, 5)
    elif style == "stitch":
        brass = fig.piece("guard-rivets", g["trim"], "hand.R", smooth=0, ao=.4, gloss=1.0)
        for sign in (1, -1):
            for offset in (.014, .032):
                hk.ellipsoid(brass.bm, guard + side * offset * sign + face * .008, (.0032, .0024, .0032), 6, 4)
                hk.ellipsoid(brass.bm, guard + side * offset * sign - face * .008, (.0032, .0024, .0032), 6, 4)
    elif style == "moon":
        stones = fig.piece("guard-moonstones", _moon_color(g), "hand.R", smooth=0, ao=.2, gloss=1.0)
        for sign in (1, -1):
            hk.ellipsoid(stones.bm, guard + side * .024 * sign + face * .006, (.0055, .0045, .0055), 10, 6)
            hk.ellipsoid(stones.bm, guard + side * .024 * sign - face * .006, (.0055, .0045, .0055), 10, 6)

    def blade_color(co, n):
        across = abs((co - guard).dot(side))
        color = mix(g["blade_dark"], g["blade"], smoothstep(.0, .012, across))
        if style == "copper":
            # A bright rolled rim along the edges, and hammer marks in the middle.
            color = mix(color, g["inlay"], smoothstep(.012, .016, across))
            color = mix(color, g["blade_dark"], smoothstep(.3, .1, hk.noise.noise(co * 300, noise_basis="VORONOI_F1")) * .3)
        return color

    blade = fig.piece("sword-blade", blade_color, "hand.R", smooth=0, flat=True, ao=.4, gloss=1.0)
    bm = blade.bm
    stations = [(0.0, .017), (.12, .018), (.55, .016), (.82, .013), (1.0, .0)]
    rows = []
    for t, width in stations:
        base = guard + axis * (blade_length * t)
        thick = .0045 * (1 - t * .6)
        if width == 0:
            rows.append([bm.verts.new(base)])
            continue
        rows.append([
            bm.verts.new(base - side * width),
            bm.verts.new(base + face * thick),
            bm.verts.new(base + side * width),
            bm.verts.new(base - face * thick),
        ])
    for a, b in zip(rows, rows[1:]):
        if len(b) == 1:
            for k in range(4):
                bm.faces.new((a[k], a[(k + 1) % 4], b[0]))
        else:
            for k in range(4):
                bm.faces.new((a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]))
    bm.faces.new(list(reversed(rows[0])))
    # The fuller: a gold line for Gold Inlay and Royal Plate, a dark groove for the others.
    fuller_color = g["inlay"] if g["ornate"] or style == "fluted" else g["blade_dark"]
    fuller = fig.piece("sword-fuller", fuller_color, "hand.R", smooth=0, ao=.3, gloss=1.0)
    hk.loft(fuller.bm, [
        {"c": guard + axis * (blade_length * t), "rx": w, "ry": .0045 * (1 - t * .6) + .0004, "t": axis, "dir": face}
        for t, w in ((.02, .0028), (.5, .0026), (.74, .0012))
    ], sides=4)


def banner(fig, look, j, fit):
    """A small banner on a pole at the back, high and to the figure's left."""
    g = LOOKS[look]
    style = g["style"]
    s = fit["scale"]
    head, tail = j["banner"]
    x, y = head.x, head.y
    bottom = Vector((x, y - .01, .6 * s))
    top = Vector((x, y, head.z + .075))
    pole = fig.piece("banner-pole", g["pole"], "chest", smooth=0, ao=.6)
    hk.loft(pole.bm, [
        {"c": bottom, "rx": .0055, "ry": .0055},
        {"c": top, "rx": .0055, "ry": .0055},
    ], sides=8)
    tip_color = {"stitch": g["stone"], "vine": g.get("leaf")}.get(style, g["trim"])
    finial = fig.piece("banner-finial", tip_color, "chest", smooth=0, ao=.4, gloss=1.0 if style != "stitch" else .3)
    if style == "vine":
        # A leaf-shaped tip.
        hk.loft(finial.bm, [
            {"c": top - Vector((0, 0, .004)), "rx": .004, "ry": .003},
            {"c": top + Vector((0, 0, .012)), "rx": .011, "ry": .004},
            {"c": top + Vector((0, 0, .026)), "rx": .008, "ry": .003},
            {"c": top + Vector((0, 0, .04)), "rx": .0006, "ry": .0006},
        ], sides=8)
    elif style == "stitch":
        # A curved horn tip.
        hk.loft(finial.bm, [
            {"c": top - Vector((0, 0, .004)), "rx": .008, "ry": .008},
            {"c": top + Vector((.002, 0, .014)), "rx": .006, "ry": .006},
            {"c": top + Vector((.008, 0, .028)), "rx": .0035, "ry": .0035},
            {"c": top + Vector((.016, 0, .036)), "rx": .0008, "ry": .0008},
        ], sides=6)
    else:
        hk.loft(finial.bm, [
            {"c": top - Vector((0, 0, .006)), "rx": .009, "ry": .009},
            {"c": top + Vector((0, 0, .004)), "rx": .009, "ry": .009},
            {"c": top + Vector((0, 0, .012)), "rx": .006, "ry": .006},
            {"c": top + Vector((0, 0, .034)), "rx": .0006, "ry": .0006},
        ], sides=6)
    if style == "moon":
        stone = fig.piece("finial-moonstone", _moon_color(g), "chest", smooth=0, ao=.2, gloss=1.0)
        hk.ellipsoid(stone.bm, top + Vector((0, 0, .006)), (.0075, .0075, .0075), 10, 6)
    cap_color = g["stone"] if style == "stitch" else g["trim"]
    cap = fig.piece("banner-cap", cap_color, "chest", smooth=0, ao=.4, gloss=1.0)
    hk.loft(cap.bm, [
        {"c": bottom + Vector((0, 0, .012)), "rx": .008, "ry": .008},
        {"c": bottom, "rx": .008, "ry": .008},
    ], sides=6)

    flag_top, flag_bottom = head.z + .06, head.z - .075
    length = tail.x - head.x + .02

    def flag_weights(co):
        w = smoothstep(x, x + length, co.x)
        return {"banner": w, "chest": 1 - w} if w > .02 else {"chest": 1.0}

    def flag_color(co, n):
        u = (co.x - x) / length
        color = mix(g["cloth"], g["cloth_dark"], smoothstep(.0, 1, u) * .55)
        if style == "stitch":
            color = mix(color, g["cloth_dark"], (.5 + .5 * hk.noise.noise(co * 220)) * .25)
        return color

    columns, count = 12, 9

    def cloth_point(u, v, notch=True):
        z = flag_top + (flag_bottom - flag_top) * v
        cut = .3 * (1 - abs(v - .5) * 2) if notch and u > .99 else 0
        px = x + .004 + length * (u - cut * u)
        wave = .014 * math.sin(u * 5.5 + v * .8) * u
        sag = -.012 * u * u * (v - .2)
        return Vector((px, y + wave, z + sag))

    flag = fig.piece("banner-cloth", flag_color, flag_weights, smooth=1, ao=.6)
    rows = [[cloth_point(c / columns, r / (count - 1)) for c in range(columns + 1)] for r in range(count)]
    hk.sheet(flag.bm, rows, .004, (0, 1, 0))
    # The emblem is its own shape, so it stays crisp.
    emblem = fig.piece("banner-emblem", g["emblem"], flag_weights, smooth=0, ao=.4, gloss=.6)
    steps = 16

    def emblem_radius(n, a):
        if g["ornate"]:
            return .032 / (abs(math.cos(a)) + abs(math.sin(a)))  # A diamond.
        if style == "copper":
            return .027  # A round copper boss.
        if style == "vine":
            return .034 * abs(math.sin(a)) ** .6 + .006  # A leaf, upright.
        if style == "stitch":
            return .024  # A horn disc.
        if style == "moon":
            return .022  # A silver setting for the moonstone.
        if style == "fluted":
            return .03 / (abs(math.cos(a)) + abs(math.sin(a))) * (1 + .35 * (n % 2))  # A gold star of eight points.
        return .026 * (1 + .25 * (n % 2))  # A sun.

    for face in (-1, 1):
        ring = []
        for n in range(steps):
            a = 2 * math.pi * n / steps
            r = emblem_radius(n, a)
            u = .42 + r * math.cos(a) / length
            v = .5 - r * math.sin(a) / (flag_top - flag_bottom)
            ring.append(cloth_point(u, v, False) + Vector((0, .0035 * face, 0)))
        middle = cloth_point(.42, .5, False) + Vector((0, .0035 * face, 0))
        mid = emblem.bm.verts.new(middle)
        verts = [emblem.bm.verts.new(p) for p in ring]
        for n in range(steps):
            emblem.bm.faces.new((mid, verts[n], verts[(n + 1) % steps]) if face < 0 else (mid, verts[(n + 1) % steps], verts[n]))
        if g["ornate"] or style in ("copper", "moon", "fluted"):
            gem = fig.piece("banner-gem", _stone_color(g), flag_weights, smooth=0, ao=.3, gloss=1.0)
            size = (.014, .003, .016) if style == "moon" else (.011, .003, .013)
            hk.ellipsoid(gem.bm, middle + Vector((0, .002 * face, 0)), size, 10, 6)
    # The border: a solid trim, or cream stitches on Stag Leather.
    outline = [rows[0][c] for c in range(columns + 1)] + [rows[r][-1] for r in range(1, count)]
    outline += [rows[-1][c] for c in range(columns - 1, -1, -1)]
    if style == "stitch":
        stitches = fig.piece("banner-stitches", g["stitch"], flag_weights, smooth=0, ao=.3)
        inset = []
        for r in (1, count - 2):
            inset += [(rows[r][c], rows[r][c + 1]) for c in range(0, columns - 1)]
        for a, b in inset:
            p = a.lerp(b, .5)
            for face in (-1, 1):
                hk.kit.box(stitches.bm, p + Vector((0, .0035 * face, 0)), (.006, .0016, .0022))
        trim_color = g["cloth_dark"]
    elif style == "vine":
        trim_color = g["trim"]
    else:
        trim_color = g["trim"]
    trim = fig.piece("banner-trim", trim_color, flag_weights, smooth=0, ao=.5, gloss=.8)
    hk.loft(trim.bm, [{"c": p + Vector((0, -.0015, 0)), "rx": .0026, "ry": .0026} for p in outline], sides=5)
    if style == "fluted":
        # A thin white edge inside the gold border.
        edge = fig.piece("banner-edge", g["edge"], flag_weights, smooth=0, ao=.5)
        inner = [rows[1][c] for c in range(1, columns)] + [rows[r][columns - 1] for r in range(2, count - 1)]
        inner += [rows[count - 2][c] for c in range(columns - 2, 0, -1)]
        for face in (-1, 1):
            hk.loft(edge.bm, [{"c": p + Vector((0, .0032 * face, 0)), "rx": .0015, "ry": .0012} for p in inner], sides=4)


def gear(fig, look, j, fit):
    breastplate(fig, look, fit)
    amulet(fig, look, fit)
    sword(fig, look, j)
    banner(fig, look, j, fit)
