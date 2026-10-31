"""Build the Hero Models: 8 people, each in 7 Gear looks.

Run Blender in background mode with this file. All people use the same
skeleton and Gear builders. Set `HEYNBORD_HERO_PEOPLE` and
`HEYNBORD_HERO_LOOKS` to comma lists to build a part of the 56 appearances,
for example to run several Blender processes at once.

In a running Blender, `build(person, look)` makes one figure in its own
scene (`HeroBuild`) and leaves the other scenes as they are.
"""
import importlib
import os
import sys

ROOT = os.environ.get("HEYNBORD_REPO") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.dont_write_bytecode = True
for folder in ("unit-model", "hero-model"):
    path = os.path.join(ROOT, "scripts", folder)
    if path not in sys.path:
        sys.path.insert(0, path)

import unit_model_kit as kit  # noqa: E402
import hero_kit  # noqa: E402
import hero_people  # noqa: E402
import hero_gear  # noqa: E402
import hero_clips  # noqa: E402
import hero_cast  # noqa: E402

PEOPLE = ("standard", "dawn-gaze", "verdant-crest", "mesa-shade", "salt-wind", "lantern-keeper", "tent-rings", "gold-crest")
LOOKS = ("standard", "copper-rim", "iron-vine", "stag-leather", "gold-inlay", "moonstone", "royal-plate")


def selected(name, default):
    value = os.environ.get(name)
    return tuple(item for item in value.split(",") if item) if value else default


def reload():
    """For a running Blender: use the current source of each module."""
    for module in (kit, hero_kit, hero_people, hero_cast, hero_gear, hero_clips):
        importlib.reload(module)


def build(person, look, clips=True):
    hero_kit.build_scene()
    bones = hero_people.skeleton(person)
    rig = hero_kit.tag(kit.build_armature("Hero", bones))
    hero_kit.tag(rig.data)
    figure = hero_kit.Figure(bones)
    joints, fit = hero_people.body(figure, person)
    hero_gear.gear(figure, look, joints, fit)
    mesh = hero_kit.join(hero_kit.realize(figure), "HeroModel")
    mesh["piece_vertices"] = str(sorted(figure.counts.items(), key=lambda item: -item[1])[:24])
    hero_kit.paint(mesh)
    kit.skin(mesh, rig)
    if clips:
        actions = hero_clips.bake(rig)
        kit.push_to_nla(rig, actions)
        # The glTF clip names come from the tracks. Another file can hold
        # actions with the same names, so the tracks keep the clip names.
        for track, action in zip(rig.animation_data.nla_tracks, actions):
            track.name = action["heynbord_clip"]
    return rig, mesh


def export(rig, mesh, out, person, look):
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, f"{person}-{look}.glb")
    kit.export_glb(rig, mesh, path)
    print("HERO_REFERENCE", path, os.path.getsize(path), "triangles", sum(len(p.vertices) - 2 for p in mesh.data.polygons))
    return path


if __name__ == "__main__":
    destination = os.environ.get("HEYNBORD_HERO_REFERENCE_OUT", os.path.join(ROOT, "apps", "web", "art", "heroes", "raw"))
    for person in selected("HEYNBORD_HERO_PEOPLE", PEOPLE):
        for look in selected("HEYNBORD_HERO_LOOKS", LOOKS):
            rig, mesh = build(person, look)
            export(rig, mesh, destination, person, look)
