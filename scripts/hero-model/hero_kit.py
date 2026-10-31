"""Shared modelling, painting and skinning tools for the Hero Models.

A Hero Model is one skinned mesh with painted vertex colors. Each piece is a
small bmesh with a color rule and a weight rule. The build smooths the
organic pieces, paints them, bakes ambient occlusion into the colors and
weights each vertex to the nearest bones of its piece.

Axes are those of `unit_model_kit`: Blender Z is up, the figure faces -Y and
the figure's left side is +X.
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector, noise
from mathutils.bvhtree import BVHTree

import unit_model_kit as kit

X, Y, Z = kit.X, kit.Y, kit.Z
SCENE = "HeroBuild"
TAG = "heynbord_hero"


def rgb(value):
    return kit.hex_color(value) if isinstance(value, str) else tuple(value)


def mix(a, b, t):
    a, b = rgb(a), rgb(b)
    t = kit.clamp01(t)
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def smoothstep(edge0, edge1, value):
    t = kit.clamp01((value - edge0) / (edge1 - edge0))
    return t * t * (3 - 2 * t)


# --- Scene -----------------------------------------------------------------


def build_scene():
    """A clean scene for one build. Other scenes and their data stay as they are."""
    scene = bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
    window = getattr(bpy.context, "window", None)
    if window is not None:
        window.scene = scene
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for obj in list(scene.objects):
        if obj.get(TAG) or obj.users_scene == (scene,):
            bpy.data.objects.remove(obj, do_unlink=True)
    for collection in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials):
        for block in list(collection):
            if block.get(TAG) or (block.users == 0 and block.name.startswith(("Hero", "piece:"))):
                collection.remove(block)
    for action in list(bpy.data.actions):
        if action.get(TAG):
            bpy.data.actions.remove(action)
    scene.render.fps = kit.FPS
    scene.frame_set(0)
    return scene


def tag(block):
    block[TAG] = True
    return block


# --- Geometry --------------------------------------------------------------


def frame(tangent, front=-Y):
    """The side and front axes of a ring that runs along `tangent`."""
    t = Vector(tangent).normalized()
    f = Vector(front) - t * Vector(front).dot(t)
    if f.length < 1e-6:
        f = Z - t * Z.dot(t)
    f.normalize()
    return t.cross(f).normalized(), f


def ring_radius(ring, theta):
    """The radius of one ring at angle `theta` (0 = side, pi/2 = front)."""
    rx = ring["rx"]
    front = ring["front"] if "front" in ring else ring["ry"]
    back = ring["back"] if "back" in ring else ring["ry"]
    ry = front if math.sin(theta) >= 0 else back
    power = ring.get("power", 2.0)
    c, s = abs(math.cos(theta)), abs(math.sin(theta))
    unit = (c ** power + s ** power) ** (-1 / power)
    radius_x, radius_y = rx * c * unit, ry * s * unit
    scale = 1.0
    wave = ring.get("wave")
    if wave:
        scale += wave(theta)
    return radius_x * scale, radius_y * scale


def loft(bm, rings, sides=16, caps=(True, True), front=-Y):
    """
    A smooth tube through `rings`. Each ring is a dict with `c` (center), `rx`
    (side radius), `ry` or `front`/`back` (depth radii), and optional `power`
    (2 is an ellipse, more is boxier), `wave(theta)` (a radial change for
    folds) and `front` direction overrides through `dir`.
    """
    centers = [Vector(ring["c"]) for ring in rings]
    loops = []
    for index, ring in enumerate(rings):
        ahead = centers[min(index + 1, len(centers) - 1)]
        behind = centers[max(index - 1, 0)]
        tangent = ring.get("t") or (ahead - behind)
        side, ahead_axis = frame(tangent, ring.get("dir", front))
        verts = []
        for step in range(sides):
            theta = 2 * math.pi * step / sides
            radius_x, radius_y = ring_radius(ring, theta)
            x = math.copysign(radius_x, math.cos(theta))
            y = math.copysign(radius_y, math.sin(theta))
            verts.append(bm.verts.new(centers[index] + side * x + ahead_axis * y))
        loops.append(verts)
    faces = []
    for a, b in zip(loops, loops[1:]):
        for step in range(sides):
            n = (step + 1) % sides
            faces.append(bm.faces.new((a[step], a[n], b[n], b[step])))
    if caps[0]:
        faces.append(bm.faces.new(list(reversed(loops[0]))))
    if caps[1]:
        faces.append(bm.faces.new(loops[-1]))
    return loops


def ellipsoid(bm, center, radii, segments=16, rings=12):
    return kit.sphere(bm, center, radii, segments, rings)


def sheet(bm, grid, thickness=0.0, normal_hint=None):
    """A cloth sheet from rows of points. With a thickness, the sheet is closed."""
    rows = [[Vector(p) for p in row] for row in grid]
    front = [[bm.verts.new(p) for p in row] for row in rows]
    for r in range(len(front) - 1):
        for c in range(len(front[r]) - 1):
            bm.faces.new((front[r][c], front[r][c + 1], front[r + 1][c + 1], front[r + 1][c]))
    if thickness <= 0:
        return front
    hint = Vector(normal_hint or (0, 1, 0))
    back = []
    for r, row in enumerate(rows):
        line = []
        for c, point in enumerate(row):
            du = row[min(c + 1, len(row) - 1)] - row[max(c - 1, 0)]
            dv = rows[min(r + 1, len(rows) - 1)][c] - rows[max(r - 1, 0)][c]
            n = du.cross(dv)
            n = n.normalized() if n.length > 1e-9 else hint
            if n.dot(hint) < 0:
                n = -n
            line.append(bm.verts.new(point + n * thickness))
        back.append(line)
    for r in range(len(back) - 1):
        for c in range(len(back[r]) - 1):
            bm.faces.new((back[r][c], back[r + 1][c], back[r + 1][c + 1], back[r][c + 1]))
    last_r, last_c = len(front) - 1, len(front[0]) - 1
    edge = [(0, c) for c in range(last_c + 1)] + [(r, last_c) for r in range(1, last_r + 1)]
    edge += [(last_r, c) for c in range(last_c - 1, -1, -1)] + [(r, 0) for r in range(last_r - 1, 0, -1)]
    for (r0, c0), (r1, c1) in zip(edge, edge[1:] + edge[:1]):
        bm.faces.new((front[r1][c1], front[r0][c0], back[r0][c0], back[r1][c1]))
    return front


def push(verts, center, radius, offset):
    """A sculpt brush: moves the verts near `center` by `offset`, with a soft falloff."""
    center, offset = Vector(center), Vector(offset)
    for vert in verts:
        d = (vert.co - center).length / radius
        if d < 1:
            vert.co += offset * (1 - d * d) ** 2


def inflate(verts, center, radius, amount, origin):
    """A sculpt brush that moves the verts near `center` away from `origin`."""
    center, origin = Vector(center), Vector(origin)
    for vert in verts:
        d = (vert.co - center).length / radius
        if d < 1:
            vert.co += (vert.co - origin).normalized() * amount * (1 - d * d) ** 2


def relax(bm, verts, factor=0.5, passes=1):
    verts = list(verts)
    for _ in range(passes):
        bmesh.ops.smooth_vert(bm, verts=verts, factor=factor, use_axis_x=True, use_axis_y=True, use_axis_z=True)


def transform(bm, verts, matrix):
    bmesh.ops.transform(bm, matrix=matrix, verts=list(verts))


def rotate_about(bm, verts, pivot, axis, degrees):
    pivot = Vector(pivot)
    turn = Matrix.Rotation(math.radians(degrees), 4, Vector(axis))
    transform(bm, verts, Matrix.Translation(pivot) @ turn @ Matrix.Translation(-pivot))


# --- Pieces ----------------------------------------------------------------


class Piece:
    """
    One piece of the figure.

    `color` is a hex color or a function (co, normal) -> color. `bones` is a
    bone name (rigid), or a dict {bone: strength} for soft weights from the
    distance to each bone. `smooth` is the number of subdivision levels; a
    negative number keeps flat faces.
    """

    def __init__(self, name, color, bones, smooth=1, flat=False, ao=1.0, gloss=0.0):
        self.name = name
        self.bm = bmesh.new()
        self.color = color
        self.bones = bones
        self.smooth = smooth
        self.flat = flat
        self.ao = ao
        self.gloss = gloss


class Figure:
    """The pieces and bone segments of one Hero Model."""

    def __init__(self, bones):
        self.pieces = []
        self.counts = {}
        self.segments = {name: (Vector(head), Vector(tail)) for name, head, tail, _parent in bones}

    def piece(self, name, color, bones, **options):
        piece = Piece(name, color, bones, **options)
        self.pieces.append(piece)
        return piece


def _segment_distance(point, head, tail):
    axis = tail - head
    t = kit.clamp01((point - head).dot(axis) / max(axis.length_squared, 1e-12))
    return (point - (head + axis * t)).length


def _weights(figure, rule, co):
    if isinstance(rule, str):
        return {rule: 1.0}
    if callable(rule):
        return rule(co)
    scores = []
    for bone, strength in rule.items():
        head, tail = figure.segments[bone]
        d = _segment_distance(co, head, tail) + 0.004
        scores.append((strength / d ** 5, bone))
    scores.sort(reverse=True)
    scores = scores[:3]
    total = sum(score for score, _ in scores)
    result = {bone: score / total for score, bone in scores if score / total > 0.03}
    total = sum(result.values())
    return {bone: value / total for bone, value in result.items()}


def _mesh_object(piece):
    bm = piece.bm
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    mesh = tag(bpy.data.meshes.new("piece:" + piece.name))
    bm.to_mesh(mesh)
    bm.free()
    obj = tag(bpy.data.objects.new("piece:" + piece.name, mesh))
    bpy.context.scene.collection.objects.link(obj)
    if piece.smooth > 0:
        modifier = obj.modifiers.new("Smooth", "SUBSURF")
        modifier.levels = piece.smooth
        modifier.render_levels = piece.smooth
        modifier.boundary_smooth = "PRESERVE_CORNERS"
        depsgraph = bpy.context.evaluated_depsgraph_get()
        evaluated = obj.evaluated_get(depsgraph)
        smoothed = tag(bpy.data.meshes.new_from_object(evaluated))
        obj.modifiers.clear()
        obj.data = smoothed
        bpy.data.meshes.remove(mesh)
    for polygon in obj.data.polygons:
        polygon.use_smooth = not piece.flat
    return obj


def realize(figure):
    """Makes one object for each piece, with colors and vertex groups."""
    objects = []
    for piece in figure.pieces:
        obj = _mesh_object(piece)
        mesh = obj.data
        figure.counts[piece.name] = figure.counts.get(piece.name, 0) + len(mesh.vertices)
        layer = mesh.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
        base = mesh.attributes.new("hero_base", "FLOAT_COLOR", "CORNER")
        ao_scale = mesh.attributes.new("hero_ao", "FLOAT", "POINT")
        gloss = mesh.attributes.new("hero_gloss", "FLOAT", "POINT")
        for vertex in mesh.vertices:
            ao_scale.data[vertex.index].value = piece.ao
            gloss.data[vertex.index].value = piece.gloss
        colors = {}
        for loop in mesh.loops:
            vertex = mesh.vertices[loop.vertex_index]
            if callable(piece.color):
                key = loop.vertex_index if not piece.flat else loop.index
                if key not in colors:
                    colors[key] = rgb(piece.color(vertex.co.copy(), vertex.normal.copy()))
                color = colors[key]
            else:
                color = rgb(piece.color)
            base.data[loop.index].color = (*color, 1.0)
            layer.data[loop.index].color = (*color, 1.0)
        for vertex in mesh.vertices:
            for bone, weight in _weights(figure, piece.bones, vertex.co).items():
                if weight <= 0:
                    continue
                group = obj.vertex_groups.get(bone) or obj.vertex_groups.new(name=bone)
                group.add([vertex.index], weight, "REPLACE")
        objects.append(obj)
    return objects


def join(objects, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = name
    joined.data.name = name
    tag(joined)
    tag(joined.data)
    material = tag(kit.figure_material())
    joined.data.materials.clear()
    joined.data.materials.append(material)
    return joined


# --- Paint -----------------------------------------------------------------


def _hemisphere(count):
    """Cosine-weighted directions around +Z, from a fixed spiral."""
    golden = math.pi * (3 - math.sqrt(5))
    result = []
    for index in range(count):
        u = (index + 0.5) / count
        r = math.sqrt(u)
        a = golden * index
        result.append(Vector((r * math.cos(a), r * math.sin(a), math.sqrt(max(0.0, 1 - u)))))
    return result


def paint(mesh_object, light=(-0.35, -0.55, 1.0), rays=14, reach=0.09):
    """
    Bakes the painted light into the vertex colors: ambient occlusion, a warm
    key light from above, cool shade below and a little brush noise. The
    game lights the figure as well, so this stays soft.
    """
    mesh = mesh_object.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    tree = BVHTree.FromBMesh(bm)
    directions = _hemisphere(rays)
    key = Vector(light).normalized()
    occlusion = []
    for vert in bm.verts:
        n = vert.normal
        if n.length < 0.5:
            occlusion.append(1.0)
            continue
        basis = n.to_track_quat("Z", "Y").to_matrix()
        origin = vert.co + n * 0.0008
        hits = 0.0
        for direction in directions:
            world = basis @ direction
            hit = tree.ray_cast(origin, world, reach)
            if hit[0] is not None:
                hits += 1 - (hit[3] / reach) ** 0.5 * 0.6
        occlusion.append(1 - hits / rays)
    bm.free()

    ao_scale = mesh.attributes["hero_ao"]
    gloss = mesh.attributes["hero_gloss"]
    base = mesh.attributes["hero_base"]
    layer = mesh.color_attributes["Col"]
    for loop in mesh.loops:
        index = loop.vertex_index
        vertex = mesh.vertices[index]
        n = vertex.normal
        ao = occlusion[index]
        strength = ao_scale.data[index].value
        shade = 1 - (1 - ao ** 1.4) * 0.78 * strength
        lit = kit.clamp01(n.dot(key))
        top = 0.9 + 0.1 * kit.clamp01(vertex.co.z / 1.0)
        brush = 1 + 0.045 * noise.noise(vertex.co * 38.0) + 0.025 * noise.noise(vertex.co * 110.0)
        warm = 0.94 + 0.12 * lit
        sheen = gloss.data[index].value * lit ** 6 * 0.55
        r, g, b, _a = base.data[loop.index].color
        value = shade * top * brush
        # Warm light, cool shade, as in the painted card art.
        color = (
            r * value * warm * 1.02 + sheen,
            g * value * warm + sheen,
            b * value * (2 - warm) * 0.98 + sheen * 0.9 + (1 - shade) * 0.012,
        )
        layer.data[loop.index].color = (*(kit.to_linear(kit.clamp01(c)) for c in color), 1.0)
    for name in ("hero_base", "hero_ao", "hero_gloss"):
        mesh.attributes.remove(mesh.attributes[name])
