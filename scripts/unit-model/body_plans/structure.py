"""
The structure Body Plan: the walls and the heaps. See `README.md`.

A structure stands on a `base` bone. Each big piece has a bone at its foot, so it
can rattle, lean out and fall out in the `death` clip. The pieces stand on an arc
round the front, so the Battle camera, which sees the side of a Unit, sees the
curve of the wall and not only its edge.

This module needs Blender only in `build_rig`, so the tests can read the plan
with plain Python. Axes are as in `unit_model_kit.py`: Z is up, the wall faces
-Y, and its left side is +X.
"""

from dataclasses import dataclass
import math

from unit_regions import region_name

from .shared import CLIP_SLOTS, checked_order, offset_point, stop_on_problems

NAME = "structure"

_FIXED_BONES = {"root", "base"}
# The most common length of a foot bone in the survey.
FOOT_HEIGHT = 0.12


@dataclass(frozen=True)
class Proportions:
    """Distances in scene units. A default is a value of the survey in `README.md`."""

    root_tip_z: float = 0.1
    base_z: float = 0.02
    base_tip_z: float = 0.14
    # The arc of the wall, and how far back its center is.
    radius: float = 0.3
    arc_y: float = 0.06


def arc_point(table, angle, radius=None):
    """A point on the ground, on the arc. Angle 0 is the front, and a positive angle goes to +X."""
    radius = table.radius if radius is None else radius
    return (radius * math.sin(angle), -radius * math.cos(angle) + table.arc_y, 0)


def outward(angle):
    """The direction out of the wall at `angle`."""
    return (math.sin(angle), -math.cos(angle), 0)


def foot_bone(name, foot, height=FOOT_HEIGHT, parent="base"):
    """The bone of one big piece. It starts at the foot of the piece and points up."""
    return (name, tuple(foot), offset_point(foot, (0, 0, height)), parent)


def skin_problems(parts, _parents):
    """
    Each bone that a `base` part must not use: a base part stays when the pieces
    fall. The Body Regions cannot separate the pieces, so this is the only rule.
    """
    return [
        f"{part.name}: base part must not use bone {bone!r}"
        for part in parts
        if region_name(part.region) == "base"
        for bone in sorted(part.bones - _FIXED_BONES)
    ]


check_skin = stop_on_problems(skin_problems)


def bones(table, trunk=(), props=()):
    """
    The bone list for `kit.build_armature`: (name, head, tail, parent). The core
    bones come from `table`. `trunk` adds a unit's pieces and figures after the
    base, and `props` adds its bones after them.
    """
    return checked_order(
        [
            ("root", (0, 0, 0), (0, 0, table.root_tip_z), None),
            ("base", (0, 0, table.base_z), (0, 0, table.base_tip_z), "root"),
            *trunk,
            *props,
        ]
    )


def build_rig(name, table, trunk=(), props=()):
    """Makes the armature in Blender, and returns it with its proportion table."""
    import unit_model_kit as kit

    return kit.build_armature(name, bones(table, trunk, props)), table
