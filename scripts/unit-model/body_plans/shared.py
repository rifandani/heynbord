"""
The code that every Body Plan shares: the clip slots, the point math of a Blender
Vector, the bone order check and the skinning checks. See `README.md`. This
module does not need Blender.
"""

import struct
from typing import NamedTuple

from unit_regions import region_name


class ClipSlot(NamedTuple):
    """The arguments of `kit.Clip`."""

    name: str
    frames: int
    loop: bool


CLIP_SLOTS = {
    slot.name: slot
    for slot in (
        ClipSlot("idle", 48, True),
        ClipSlot("lowHp", 48, True),
        ClipSlot("walk", 24, True),
        ClipSlot("attack", 30, False),
        ClipSlot("cast", 24, False),
        ClipSlot("hurt", 16, False),
        ClipSlot("death", 36, False),
        ClipSlot("rebirth", 48, False),
        ClipSlot("summon", 24, False),
    )
}


def float32(value):
    """`value` as a 32-bit float, as a Blender Vector stores it."""
    return struct.unpack("f", struct.pack("f", value))[0]


def offset_point(point, offset):
    """
    `point` + `offset`, rounded as a Blender Vector does. A different last bit
    changes the keyframe digest of a Source Contract.
    """
    return tuple(float32(float32(p) + float32(d)) for p, d in zip(point, offset))


def checked_order(bones):
    """Returns `bones` if each name is unique and each parent comes before its child."""
    seen = set()
    for name, _, _, parent in bones:
        if name in seen:
            raise ValueError(f"duplicate bone {name!r}")
        if parent is not None and parent not in seen:
            raise ValueError(f"bone {name!r} has no parent {parent!r} before it")
        seen.add(name)
    return bones


def _core_owner(bone, parents, core_bones):
    """The nearest core bone at or above `bone`, or None for a separate chain."""
    while bone is not None and bone not in core_bones:
        bone = parents[bone]
    return bone


def skin_checks(rules):
    """
    The `skin_problems` and `check_skin` functions of a plan. `rules` gives the
    core bones that a part of each Body Region may use. A prop, a base and an
    effect have no entry, because they may use any bone.
    """
    core_bones = {"root"}.union(*rules.values())

    def skin_problems(parts, parents):
        """
        Each use of a bone that the skinning rule refuses. `parts` have `name`,
        `region` and `bones`, as `kit.part_object` leaves them. `parents` maps
        each bone to its parent. A unit's bone belongs to the core bone that
        holds it.
        """
        problems = []
        for part in parts:
            region = region_name(part.region)
            allowed = rules.get(region)
            if allowed is None:
                continue
            for bone in sorted(part.bones):
                owner = _core_owner(bone, parents, core_bones)
                if owner is not None and owner not in allowed:
                    problems.append(f"{part.name}: {region} part must not use bone {bone!r}")
        return problems

    return skin_problems, stop_on_problems(skin_problems)


def stop_on_problems(skin_problems):
    """The `check_skin` function of a plan: it stops a build that breaks the rule."""

    def check_skin(parts, rig):
        parents = {bone.name: bone.parent.name if bone.parent else None for bone in rig.data.bones}
        problems = skin_problems(parts, parents)
        if problems:
            raise ValueError("; ".join(problems))

    return check_skin
