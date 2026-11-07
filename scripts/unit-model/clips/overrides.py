"""
The override layer. A unit keeps its pose values in a subclass of the `Poses` of
its plan. A `Patch` names a base clip and records what the unit changes in it.
See `README.md`.
"""

from typing import NamedTuple

from .base import Clip


class Fall(NamedTuple):
    """
    The fall of `death`: `degrees` about `axis` for the root, and `lift`, the
    root offset that keeps the body on the ground.
    """

    axis: tuple
    degrees: float
    lift: tuple


class Patch(NamedTuple):
    """
    `clip` is the base clip and `name` is the `override` of the Unit Spec. With no
    `beats`, the unit uses the base timing with its own poses. `beats` and
    `frames` replace the timing of a unit whose action does not fit it.
    """

    clip: str
    name: str
    beats: tuple | None = None
    frames: int | None = None


def _patched(base, patch):
    slot = base.slot if patch.frames is None else base.slot._replace(frames=patch.frames)
    return base._replace(slot=slot, beats=base.beats if patch.beats is None else tuple(patch.beats))


def build(base_clips, poses, patches=(), without=()):
    """
    The clips of a unit, in slot order: for `kit.bake_clip`. `without` names the
    optional clips that the unit does not have.
    """
    patched = {patch.clip: patch for patch in patches}
    unknown = (set(patched) | set(without)) - set(base_clips)
    if unknown:
        raise ValueError(f"no base clip {sorted(unknown)}")
    clips = []
    for name, base in base_clips.items():
        if name in without:
            continue
        clip = _patched(base, patched[name]) if name in patched else base
        result = Clip(*clip.slot)
        for beat in clip.beats:
            result.key(beat.frame, poses.at_beat(beat))
        clips.append(result)
    return clips
