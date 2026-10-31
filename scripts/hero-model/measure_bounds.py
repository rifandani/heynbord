"""Measure every frame of the Hero clips in Blender.

The report uses the Battle renderer's 1.6-unit bind-pose height. It reports
horizontal radius and height; a visual check in the Battle is still needed.
"""
import json
import math
import os
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
PEOPLE = ("standard", "dawn-gaze", "verdant-crest", "mesa-shade", "salt-wind", "lantern-keeper", "tent-rings", "gold-crest")
LOOKS = ("standard", "copper-rim", "iron-vine", "stag-leather", "gold-inlay", "moonstone", "royal-plate")


def selected(name, default):
    value = os.environ.get(name)
    return tuple(item for item in value.split(",") if item) if value else default
RAW = Path(os.environ.get("HEYNBORD_HERO_REFERENCE_OUT", ROOT / "apps/web/art/heroes/raw"))
NAMES = ("idle", "lowHp", "summon", "castWarrior", "castRanger", "castMage", "castPriest", "hurt", "victory", "defeat")


def points(mesh, depsgraph):
    evaluated = mesh.evaluated_get(depsgraph)
    geometry = evaluated.to_mesh()
    try:
        return [evaluated.matrix_world @ vertex.co for vertex in geometry.vertices]
    finally:
        evaluated.to_mesh_clear()


def measure(person, gear):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(RAW / f"{person}-{gear}.glb"))
    rig = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
    mesh = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.parent == rig)
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    rig.animation_data.action = None
    scene = bpy.context.scene
    scene.frame_set(0)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bind = points(mesh, depsgraph)
    minimum = Vector(tuple(min(point[index] for point in bind) for index in range(3)))
    maximum = Vector(tuple(max(point[index] for point in bind) for index in range(3)))
    scale = 1.6 / (maximum.z - minimum.z)
    center = (minimum + maximum) / 2
    report = {}
    for name in NAMES:
        action = bpy.data.actions[name]
        rig.animation_data.action = action
        rig.animation_data.action_slot = action.slots[0]
        radius = height = 0.0
        start, end = (int(value) for value in action.frame_range)
        for frame in range(start, end + 1):
            scene.frame_set(frame)
            for point in points(mesh, depsgraph):
                radius = max(radius, math.hypot(point.x - center.x, point.y - center.y) * scale)
                height = max(height, (point.z - minimum.z) * scale)
        report[name] = {"max_horizontal_radius": round(radius, 4), "max_height": round(height, 4)}
    return report


if __name__ == "__main__":
    people = selected("HEYNBORD_HERO_PEOPLE", PEOPLE)
    looks = selected("HEYNBORD_HERO_LOOKS", LOOKS)
    output = {f"{person}-{gear}": measure(person, gear) for person in people for gear in looks}
    path = RAW / os.environ.get("HEYNBORD_HERO_BOUNDS_FILE", "reference-bounds.json")
    path.write_text(json.dumps(output, indent=2) + "\n")
    print("HERO_REFERENCE_BOUNDS", path)
