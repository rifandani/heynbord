"""
The parts of a base clip: a `Beat` is one key of a clip, and a `Poses` class has
the pose of each role. This module does not need Blender, so `t` and `at` are
given to `Poses`. In a build script they come from `kit.pose_tools(rig)`.
"""

import math
from typing import NamedTuple

from body_plans.shared import ClipSlot

X = (1, 0, 0)
Y = (0, 1, 0)
Z = (0, 0, 1)
# (frame, breath, sway) of an `idle`.
BREATH_SWAY = ((0, 0, 0), (12, 0.5, 1), (24, 1, 0), (36, 0.5, -1), (48, 0, 0))


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


class Beat(NamedTuple):
    """
    One key of a base clip: `role` is a method of `Poses`. `args` go to the role,
    and `stance` goes to the stance under it. The role `stance` is the stance.
    """

    frame: int
    role: str = "stance"
    args: tuple = ()
    stance: tuple = ()


class BaseClip(NamedTuple):
    """A clip slot and its beats. These own the timing and the weight."""

    slot: ClipSlot
    beats: tuple


def base_clips(slots, beats):
    """The base clips of a plan, in slot order. `beats` has one tuple of `Beat` for each slot."""
    return {name: BaseClip(slot, tuple(beats[name])) for name, slot in slots.items()}


class Poses:
    """
    The poses of a plan. A role gets the stance as `base` and returns a full
    pose, and each role reads other roles through `self`. So a build script
    subclasses the `Poses` of its plan and overrides only what it changes.
    """

    def __init__(self, t, at):
        self.t = t
        self.at = at

    def pose(self, base, **changes):
        """A copy of `base` with `changes`. A name has `__` for `.`, `_at_` for `@` and `_slash_` for `/`."""
        result = dict(base)
        for key, value in changes.items():
            result[key.replace("__", ".").replace("_at_", "@").replace("_slash_", "/")] = value
        return result

    def unchanged(self, posed, base, *keys):
        """A copy of `posed` where each key has its value of `base`, or no value."""
        result = dict(posed)
        for key in keys:
            if key in base:
                result[key] = base[key]
            else:
                result.pop(key, None)
        return result

    def fall_keys(self, bounce=0.0):
        """The root keys of `fall`. A bounce turns the body back toward upright, on either side."""
        fall = self.fall
        return {
            "root": self.t("root", (fall.axis, fall.degrees - math.copysign(bounce, fall.degrees))),
            "root@loc": self.at("root", fall.lift),
        }

    def at_beat(self, beat):
        if beat.role == "stance":
            return self.stance(*beat.args)
        return getattr(self, beat.role)(self.stance(*beat.stance), *beat.args)
