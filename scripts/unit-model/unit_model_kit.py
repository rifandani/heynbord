"""
Helpers to build a Unit Model in Blender with code (art direction 2.2).

A build script (for example `warden-saelith.py`) uses this kit to make the
parts of a tabletop-miniature figure, skin them to an armature, author the
clips, bake them and export one GLB. Run a build script in Blender:

    exec(open("<repo>/scripts/unit-model/warden-saelith.py").read())

Axes: Blender Z is up, and the figure faces -Y. The glTF export changes this
to Y up and +Z forward, which `unit-rig.ts` expects. The left side of the
figure is +X.
"""

import math

import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector

FPS = 24

X = Vector((1, 0, 0))
Y = Vector((0, 1, 0))
Z = Vector((0, 0, 1))


def hex_color(value):
    """An sRGB hex color as a 0..1 RGB tuple."""
    return tuple(int(value[i : i + 2], 16) / 255 for i in (1, 3, 5))


def to_linear(channel):
    """An sRGB channel in linear light, as a float color attribute stores it."""
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def clamp01(value):
    return max(0.0, min(1.0, value))


def lerp(a, b, t):
    return a + (b - a) * t


# --- Scene -----------------------------------------------------------------


def reset_scene():
    """Removes every object, action and mesh, so a build starts clean."""
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for collection in (
        bpy.data.meshes,
        bpy.data.armatures,
        bpy.data.actions,
        bpy.data.materials,
    ):
        for block in list(collection):
            collection.remove(block)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_set(0)


# --- Geometry --------------------------------------------------------------


def _frame(direction):
    """A rotation that turns +Z to `direction`."""
    return direction.normalized().to_track_quat("Z", "Y").to_matrix().to_4x4()


def sphere(bm, center, radii, segments=12, rings=8):
    geom = bmesh.ops.create_uvsphere(
        bm, u_segments=segments, v_segments=rings, radius=1.0
    )
    scale = Matrix.Diagonal((*radii, 1.0))
    bmesh.ops.transform(
        bm, matrix=Matrix.Translation(center) @ scale, verts=geom["verts"]
    )
    return geom["verts"]


def cone(bm, start, end, r_start, r_end, segments=8, caps=True, squash=1.0):
    """A tapered cylinder from `start` to `end`. `squash` scales its depth (Y)."""
    start, end = Vector(start), Vector(end)
    axis = end - start
    geom = bmesh.ops.create_cone(
        bm,
        cap_ends=caps,
        cap_tris=False,
        segments=segments,
        radius1=r_start,
        radius2=r_end,
        depth=axis.length,
    )
    squash_m = Matrix.Diagonal((1.0, squash, 1.0, 1.0))
    place = Matrix.Translation((start + end) / 2) @ _frame(axis)
    bmesh.ops.transform(bm, matrix=place @ squash_m, verts=geom["verts"])
    return geom["verts"]


def box(bm, center, size):
    geom = bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.transform(
        bm,
        matrix=Matrix.Translation(center) @ Matrix.Diagonal((*size, 1.0)),
        verts=geom["verts"],
    )
    return geom["verts"]


def slab(bm, center, x_axis, y_axis, z_axis):
    """A box turned to three axes. The length of each axis is half the size of the box on it."""
    geom = bmesh.ops.create_cube(bm, size=2.0)
    x_axis, y_axis, z_axis = Vector(x_axis), Vector(y_axis), Vector(z_axis)
    axes = Matrix((x_axis, y_axis, z_axis)).transposed().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ axes, verts=geom["verts"])
    return geom["verts"]


def tube(bm, points, radii, sides=6, caps=True):
    """A tube along a polyline, with one radius for each point."""
    points = [Vector(p) for p in points]
    rings = []
    for index, point in enumerate(points):
        ahead = points[min(index + 1, len(points) - 1)]
        behind = points[max(index - 1, 0)]
        direction = (ahead - behind).normalized()
        side = direction.cross(Z if abs(direction.z) < 0.95 else X).normalized()
        up = side.cross(direction).normalized()
        ring = []
        for step in range(sides):
            angle = 2 * math.pi * step / sides
            offset = (side * math.cos(angle) + up * math.sin(angle)) * radii[index]
            ring.append(bm.verts.new(point + offset))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for step in range(sides):
            n = (step + 1) % sides
            bm.faces.new((a[step], a[n], b[n], b[step]))
    if caps:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    return [vert for ring in rings for vert in ring]


def torus(bm, center, normal, major, minor, segments=16, sides=5):
    """A ring around `normal` through `center`."""
    frame = _frame(Vector(normal)).to_3x3()
    rings = []
    for step in range(segments):
        angle = 2 * math.pi * step / segments
        radial = Vector((math.cos(angle), math.sin(angle), 0))
        ring = []
        for side in range(sides):
            beta = 2 * math.pi * side / sides
            local = radial * (major + minor * math.cos(beta)) + Z * (
                minor * math.sin(beta)
            )
            ring.append(bm.verts.new(Vector(center) + frame @ local))
        rings.append(ring)
    for index, ring in enumerate(rings):
        following = rings[(index + 1) % segments]
        for side in range(sides):
            n = (side + 1) % sides
            bm.faces.new((ring[side], following[side], following[n], ring[n]))
    return [vert for ring in rings for vert in ring]


def sheet(bm, grid):
    """A surface from a grid of points (rows of columns). Faces get tags (row, col)."""
    verts = [[bm.verts.new(Vector(p)) for p in row] for row in grid]
    faces = []
    for r in range(len(verts) - 1):
        for c in range(len(verts[r]) - 1):
            face = bm.faces.new(
                (verts[r][c], verts[r][c + 1], verts[r + 1][c + 1], verts[r + 1][c])
            )
            faces.append((face, r, c))
    return [v for row in verts for v in row], faces


def faces_of(verts):
    return {f for v in verts for f in v.link_faces}


def blend(low_bone, high_bone, z, low, high):
    """Weights that go from `low_bone` below `low` to `high_bone` above `high`."""
    t = clamp01((z - low) / (high - low))
    return {low_bone: 1 - t, high_bone: t}


def panel(part, grid_front, grid_back, color_of):
    """
    A closed panel from two grids of points (rows of columns) with the same
    shape: the front, the back, and the edges between them. `color_of(side,
    row, column)` gives the color of each front and back face.
    """
    bm = part.bm
    front = [[bm.verts.new(Vector(p)) for p in row] for row in grid_front]
    back = [[bm.verts.new(Vector(p)) for p in row] for row in grid_back]
    rows, columns = len(front) - 1, len(front[0]) - 1
    for r in range(rows):
        for c in range(columns):
            face = bm.faces.new((front[r][c], front[r][c + 1], front[r + 1][c + 1], front[r + 1][c]))
            part.paint([face], color_of("front", r, c))
            face = bm.faces.new((back[r][c], back[r + 1][c], back[r + 1][c + 1], back[r][c + 1]))
            part.paint([face], color_of("back", r, c))
    ring = (
        [(0, c) for c in range(columns + 1)]
        + [(r, columns) for r in range(1, rows + 1)]
        + [(rows, c) for c in range(columns - 1, -1, -1)]
        + [(r, 0) for r in range(rows - 1, 0, -1)]
    )
    edges = []
    for (r0, c0), (r1, c1) in zip(ring, ring[1:] + ring[:1]):
        edges.append(bm.faces.new((front[r1][c1], front[r0][c0], back[r0][c0], back[r1][c1])))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return edges


def ragged_cone(part, top_z, bottom_z, top_r, bottom_r, columns, rows, squash, ragged, color_of, lining, gap=0.0, y_push=0.0):
    """
    A cloth cone with a ragged hem, one side thick. `gap` opens the front
    (radians on each side). `color_of(row, column)` gives the color of each
    face of the outside, and `lining` the color of the inside. `y_push`
    moves the hem at the back further back.
    """

    def grid(inset):
        result = []
        for row in range(rows + 1):
            v = row / rows
            line = []
            for column in range(columns + 1):
                theta = lerp(gap, 2 * math.pi - gap, column / columns)
                tear = ragged * v * (((column * 7) % 5) / 4)
                z = lerp(top_z, bottom_z + tear, v)
                radius = lerp(top_r, bottom_r, v) - inset
                back = (1 - math.cos(theta)) / 2
                line.append((radius * math.sin(theta), -radius * math.cos(theta) * squash + y_push * v * back, z))
            result.append(line)
        return result

    _, outer = sheet(part.bm, grid(0.0))
    _, inner = sheet(part.bm, grid(0.006))
    for face, row, column in outer:
        part.paint([face], color_of(row, column))
    for face, _row, _column in inner:
        part.paint([face], lining)


# --- Parts -----------------------------------------------------------------


class Part:
    """
    One piece of the figure. `color` is an RGB tuple or a function
    (face, center) -> RGB. `weights` is a bone name or a function
    (co) -> {bone: weight}.
    """

    def __init__(self, name, color, weights, smooth=True, shade=0.18):
        self.name = name
        self.bm = bmesh.new()
        self.color = color
        self.weights = weights
        self.smooth = smooth
        self.shade = shade
        self.face_colors = {}

    def paint(self, faces, color):
        """Gives some faces their own color, for a trim."""
        for face in faces:
            self.face_colors[face] = color


def _face_color(part, face):
    if face in part.face_colors:
        return part.face_colors[face]
    if callable(part.color):
        return part.color(face, face.calc_center_median())
    return part.color


def part_object(part):
    """Makes a mesh object of a part, with its vertex groups and colors."""
    bm = part.bm
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.verts.ensure_lookup_table()
    zs = [v.co.z for v in bm.verts]
    low, high = min(zs), max(zs)
    height = max(high - low, 1e-4)

    layer = bm.loops.layers.float_color.new("Col")
    for face in bm.faces:
        base = _face_color(part, face)
        face.smooth = part.smooth
        for loop in face.loops:
            # Painted look: a little darker at the bottom of each part.
            t = (loop.vert.co.z - low) / height
            light = 1.0 - part.shade + part.shade * t
            # A soft contact shade near the ground.
            light *= 0.72 + 0.28 * clamp01(loop.vert.co.z / 0.12)
            loop[layer] = (*(to_linear(channel * light) for channel in base), 1.0)

    mesh = bpy.data.meshes.new(part.name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(part.name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    for vertex in mesh.vertices:
        rule = part.weights
        weights = rule(vertex.co) if callable(rule) else {rule: 1.0}
        total = sum(weights.values()) or 1.0
        for bone, weight in weights.items():
            if weight <= 0:
                continue
            group = obj.vertex_groups.get(bone) or obj.vertex_groups.new(name=bone)
            group.add([vertex.index], weight / total, "REPLACE")
    return obj


def figure_material():
    """One material that shows the vertex colors. The game swaps it for a toon material."""
    material = bpy.data.materials.new("Figure")
    material.use_backface_culling = False
    tree = material.node_tree if material.use_nodes else None
    if tree is None:
        material.use_nodes = True
        tree = material.node_tree
    bsdf = next(n for n in tree.nodes if n.type == "BSDF_PRINCIPLED")
    attribute = tree.nodes.new("ShaderNodeVertexColor")
    attribute.layer_name = "Col"
    tree.links.new(attribute.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    return material


def join_parts(objects, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = name
    joined.data.name = name
    material = figure_material()
    joined.data.materials.clear()
    joined.data.materials.append(material)
    return joined


# --- Rig -------------------------------------------------------------------


def build_armature(name, bones):
    """
    `bones` is a list of (name, head, tail, parent). Poses use `turn`, which
    works in the axes of the figure, so the roll is only for the IK poles.
    """
    data = bpy.data.armatures.new(name)
    rig = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    for bone_name, head, tail, parent in bones:
        bone = data.edit_bones.new(bone_name)
        bone.head = head
        bone.tail = tail
        direction = (Vector(tail) - Vector(head)).normalized()
        # The local Z axis points forward (-Y), or up for a bone along Y.
        bone.align_roll(-Y if abs(direction.dot(Y)) < 0.9 else Z)
        if parent:
            bone.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "QUATERNION"
    return rig


def skin(mesh, rig):
    mesh.parent = rig
    modifier = mesh.modifiers.new("Armature", "ARMATURE")
    modifier.object = rig


# --- Poses -----------------------------------------------------------------


def turn(rig, bone, *rotations):
    """
    A local rotation of `bone` from rotations about the rest axes of the
    figure: (axis, degrees) pairs, applied in order. With the figure facing
    -Y: +X bends forward, +Z turns to the figure's left, +Y leans to its left.
    """
    rest = rig.data.bones[bone].matrix_local.to_3x3()
    inverse = rest.inverted()
    result = Quaternion()
    for axis, degrees in rotations:
        result = Quaternion(inverse @ Vector(axis), math.radians(degrees)) @ result
    return result


def shift(rig, bone, offset):
    """A pose location of `bone` from an offset in the axes of the figure."""
    rest = rig.data.bones[bone].matrix_local.to_3x3()
    return rest.inverted() @ Vector(offset)


def add_empty(name, location=(0, 0, 0)):
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_size = 0.03
    empty.location = location
    empty.rotation_mode = "QUATERNION"
    bpy.context.scene.collection.objects.link(empty)
    return empty


class Clip:
    """
    The keys of one clip. Each key is a frame and a pose: a dict of
    bone -> quaternion, plus `"<bone>@loc"` -> Vector, plus `"<empty>@pos"` ->
    Vector for an IK target, plus `"<bone>/<constraint>"` -> influence, plus
    `"<bone>@scale"` -> float.
    """

    def __init__(self, name, frames, loop=False):
        self.name = name
        self.frames = frames
        self.loop = loop
        self.keys = []

    def key(self, frame, pose):
        self.keys.append((frame, pose))
        return self


def _key_pose(rig, empties, frame, pose):
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_quaternion = pose.get(pose_bone.name, Quaternion())
        pose_bone.location = pose.get(f"{pose_bone.name}@loc", Vector())
        scale = pose.get(f"{pose_bone.name}@scale", 1.0)
        pose_bone.scale = (scale, scale, scale)
        pose_bone.keyframe_insert("rotation_quaternion", frame=frame)
        pose_bone.keyframe_insert("location", frame=frame)
        pose_bone.keyframe_insert("scale", frame=frame)
        for constraint in pose_bone.constraints:
            constraint.influence = pose.get(
                f"{pose_bone.name}/{constraint.name}", 0.0
            )
            constraint.keyframe_insert("influence", frame=frame)
    for name, empty in empties.items():
        position = pose.get(f"{name}@pos")
        if position is not None:
            empty.location = position
        rotation = pose.get(f"{name}@rot")
        if rotation is not None:
            empty.rotation_mode = "QUATERNION"
            empty.rotation_quaternion = rotation
        empty.keyframe_insert("location", frame=frame)
        empty.keyframe_insert("rotation_quaternion", frame=frame)


def _ordered(rig):
    """The pose bones, each parent before its children."""
    order = []

    def visit(bone):
        order.append(rig.pose.bones[bone.name])
        for child in bone.children:
            visit(child)

    for bone in rig.data.bones:
        if bone.parent is None:
            visit(bone)
    return order


def bake_clip(rig, empties, clip):
    """
    Authors `clip` with its IK and constraints, samples each frame, and writes
    an action with plain keys only, as the glTF export needs.
    """
    scene = bpy.context.scene
    rig.animation_data_create()
    authoring = bpy.data.actions.new(f"{clip.name}.authoring")
    rig.animation_data.action = authoring
    for empty in empties.values():
        empty.animation_data_create()
        empty.animation_data.action = bpy.data.actions.new(
            f"{clip.name}.{empty.name}"
        )
    for frame, pose in clip.keys:
        _key_pose(rig, empties, frame, pose)

    bones = _ordered(rig)
    samples = []
    for frame in range(0, clip.frames + 1):
        scene.frame_set(frame)
        samples.append({pb.name: pb.matrix.copy() for pb in bones})

    for pb in bones:
        for constraint in pb.constraints:
            constraint.mute = True
    baked = bpy.data.actions.new(clip.name)
    baked.use_fake_user = True
    rig.animation_data.action = baked
    for frame, matrices in enumerate(samples):
        for pb in bones:
            rest = pb.bone.matrix_local
            if pb.parent:
                parent_rest = pb.parent.bone.matrix_local
                relative = parent_rest.inverted() @ rest
                basis = relative.inverted() @ matrices[pb.parent.name].inverted() @ matrices[pb.name]
            else:
                basis = rest.inverted() @ matrices[pb.name]
            location, rotation, scale = basis.decompose()
            pb.location = location
            pb.rotation_quaternion = rotation
            pb.scale = scale
            pb.keyframe_insert("location", frame=frame)
            pb.keyframe_insert("rotation_quaternion", frame=frame)
            pb.keyframe_insert("scale", frame=frame)
    for pb in bones:
        for constraint in pb.constraints:
            constraint.mute = False

    bpy.data.actions.remove(authoring)
    for empty in empties.values():
        action = empty.animation_data.action
        empty.animation_data.action = None
        bpy.data.actions.remove(action)
    rig.animation_data.action = None
    return baked


def remove_controls(rig, empties):
    """After the bake, the clips have plain keys: the constraints and their targets go."""
    for pose_bone in rig.pose.bones:
        for constraint in list(pose_bone.constraints):
            pose_bone.constraints.remove(constraint)
    for empty in empties.values():
        bpy.data.objects.remove(empty, do_unlink=True)


def show_clip(rig, name):
    """Puts a baked clip on the armature, to look at it."""
    action = bpy.data.actions[name]
    rig.animation_data_create()
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]


# --- Export ----------------------------------------------------------------


def push_to_nla(rig, actions):
    """One NLA track for each clip, so the export writes each clip once."""
    rig.animation_data_create()
    rig.animation_data.action = None
    for track in list(rig.animation_data.nla_tracks):
        rig.animation_data.nla_tracks.remove(track)
    for action in actions:
        track = rig.animation_data.nla_tracks.new()
        track.name = action.name
        start = int(action.frame_range[0])
        track.strips.new(action.name, start, action)
        track.mute = True


def export_glb(rig, mesh, path):
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=True,
        export_frame_step=1,
        export_skins=True,
        export_all_influences=False,
        export_def_bones=False,
        export_apply=True,
        export_yup=True,
        export_vertex_color="MATERIAL",
        export_normals=True,
        export_texcoords=False,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
