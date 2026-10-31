"""Render each required pose of the Hero GLBs in Blender.

Run reference.py first. Images are drafts for art review, not approval.
"""
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
OUT = RAW / "review"
NAMES = ("idle", "lowHp", "summon", "castWarrior", "castRanger", "castMage", "castPriest", "hurt", "victory", "defeat")
# The part of each clip that shows its pose best, from 0 (start) to 1 (end).
SHOW = {"idle": .25, "lowHp": .5, "summon": .45, "castWarrior": .3, "castRanger": .5, "castMage": .6, "castPriest": .62, "hurt": .2, "victory": 1.0, "defeat": 1.0}


def render_one(person, gear):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(RAW / f"{person}-{gear}.glb"))
    rig = next(obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE")
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "VERTEX"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.background_type = "WORLD"
    scene.world = bpy.data.worlds.new("World")
    scene.world.color = (.12, .12, .12)
    bpy.ops.object.camera_add(location=(1.4, -4, 1.5))
    camera = bpy.context.object
    camera.rotation_euler = (Vector((0, 0, .56)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 1.4
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = 450, 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    for name in NAMES:
        action = bpy.data.actions.get(name)
        if action is None:
            raise RuntimeError(f"{person}-{gear}: no {name} action")
        rig.animation_data.action = action
        rig.animation_data.action_slot = action.slots[0]
        start, end = action.frame_range
        scene.frame_set(round(start + (end - start) * SHOW[name]))
        scene.render.filepath = str(OUT / f"{person}-{gear}-{name}.png")
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for person in selected("HEYNBORD_HERO_PEOPLE", PEOPLE):
        for gear in selected("HEYNBORD_HERO_LOOKS", LOOKS):
            render_one(person, gear)
