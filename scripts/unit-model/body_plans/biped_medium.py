"""
The biped-medium Body Plan: one skeleton, one proportion table, one IK setup
and one skinning rule for the human, elf and undead figures. See `README.md`.

This module needs Blender only in `build_rig` and `add_arm_ik`, so the tests
can read the plan with plain Python. Axes are as in `unit_model_kit.py`: Z is
up, the figure faces -Y, and its left side is +X.
"""

from dataclasses import dataclass
import math
import struct
from typing import NamedTuple

from unit_regions import region_name

NAME = "biped-medium"
SIDES = (("L", 1), ("R", -1))

# The core bones that a part of each Body Region may use. A prop, a base and
# an effect have no entry, because they may use any bone.
SKIN_RULES = {
    "head": {"chest", "neck", "head"},
    "torso": {"hips", "spine", "chest", "thigh.L", "thigh.R"},
    **{
        f"arm.{side}": {"chest", f"shoulder.{side}", f"upperarm.{side}", f"forearm.{side}", f"hand.{side}"}
        for side, _ in SIDES
    },
    **{f"leg.{side}": {"hips", f"thigh.{side}", f"shin.{side}", f"foot.{side}"} for side, _ in SIDES},
}
CORE_BONES = {"root"}.union(*SKIN_RULES.values())

# The pole angle that bends each elbow toward its pole, and the poles of the
# archers, the only scripts of the survey with poles that are empties.
ARM_POLE_ANGLE = -90
ARM_POLES = {"L": (0.25, -0.15, 0.7), "R": (-0.05, 0.45, 0.85)}


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

# The landmarks from the ground up. Each one must be below the next one.
_RISING = (
    "ankle_z",
    "knee_z",
    "hip_z",
    "waist_z",
    "chest_z",
    "shoulder_z",
    "neck_z",
    "head_base_z",
    "head_top_z",
)


@dataclass(frozen=True)
class Proportions:
    """
    Distances in scene units and angles in degrees. A default is the most common
    value of the survey. `README.md` gives the survey and its two exceptions.
    """

    # The heights of the body.
    ankle_z: float = 0.05
    knee_z: float = 0.27
    hip_z: float = 0.47
    waist_z: float = 0.55
    chest_z: float = 0.64
    shoulder_z: float = 0.725
    neck_z: float = 0.75
    head_base_z: float = 0.79
    head_top_z: float = 0.97
    # The arms hang in an A-pose, `arm_angle` degrees from the body.
    shoulder_width: float = 0.2
    shoulder_root_x: float = 0.03
    arm_angle: float = 20
    upper_arm: float = 0.15
    forearm: float = 0.14
    hand: float = 0.055
    # The legs.
    hip_x: float = 0.05
    knee_x: float = 0.052
    foot_tip_y: float = -0.08
    foot_tip_z: float = 0.02
    root_tip_z: float = 0.12

    def __post_init__(self):
        for low, high in zip(_RISING, _RISING[1:]):
            if getattr(self, low) >= getattr(self, high):
                raise ValueError(f"{low} must be below {high}")

    @property
    def head_units(self):
        """The height of the body, measured in heads."""
        return self.head_top_z / (self.head_top_z - self.head_base_z)

    @property
    def arm_length(self):
        return self.upper_arm + self.forearm + self.hand

    @property
    def leg_length(self):
        return self.hip_z - self.ankle_z


def _float32(value):
    """`value` as a 32-bit float, as a Blender Vector stores it."""
    return struct.unpack("f", struct.pack("f", value))[0]


def arm_points(table, sign):
    """The shoulder, elbow, wrist, fingertip and direction of one arm. `sign` is 1 for the left."""
    angle = math.radians(table.arm_angle)
    direction = (math.sin(angle) * sign, 0, -math.cos(angle))

    def along(point, length):
        # Round after each step, as a Blender Vector does. A different last bit
        # changes the keyframe digest of a Source Contract.
        step = _float32(length)
        return tuple(_float32(_float32(p) + _float32(_float32(d) * step)) for p, d in zip(point, direction))

    shoulder = (table.shoulder_width / 2 * sign, 0, table.shoulder_z)
    elbow = along(shoulder, table.upper_arm)
    wrist = along(elbow, table.forearm)
    return shoulder, elbow, wrist, along(wrist, table.hand), direction


def leg_points(table, sign):
    """The hip, knee and ankle of one leg. `sign` is 1 for the left."""
    return (
        (table.hip_x * sign, 0, table.hip_z),
        (table.knee_x * sign, 0, table.knee_z),
        (table.knee_x * sign, 0, table.ankle_z),
    )


def bones(table, trunk=(), props=()):
    """
    The bone list for `kit.build_armature`: (name, head, tail, parent). The core
    bones come from `table`. `trunk` adds a unit's bones after the head, and
    `props` adds its bones after the limbs.
    """
    result = [
        ("root", (0, 0, 0), (0, 0, table.root_tip_z), None),
        ("hips", (0, 0, table.hip_z), (0, 0, table.waist_z), "root"),
        ("spine", (0, 0, table.waist_z), (0, 0, table.chest_z), "hips"),
        ("chest", (0, 0, table.chest_z), (0, 0, table.neck_z), "spine"),
        ("neck", (0, 0, table.neck_z), (0, 0, table.head_base_z), "chest"),
        ("head", (0, 0, table.head_base_z), (0, 0, table.head_top_z), "neck"),
        *trunk,
    ]
    for side, sign in SIDES:
        shoulder, elbow, wrist, tip, _ = arm_points(table, sign)
        hip, knee, ankle = leg_points(table, sign)
        foot_tip = (table.knee_x * sign, table.foot_tip_y, table.foot_tip_z)
        result += [
            (f"shoulder.{side}", (table.shoulder_root_x * sign, 0, table.shoulder_z), shoulder, "chest"),
            (f"upperarm.{side}", shoulder, elbow, f"shoulder.{side}"),
            (f"forearm.{side}", elbow, wrist, f"upperarm.{side}"),
            (f"hand.{side}", wrist, tip, f"forearm.{side}"),
            (f"thigh.{side}", hip, knee, "hips"),
            (f"shin.{side}", knee, ankle, f"thigh.{side}"),
            (f"foot.{side}", ankle, foot_tip, f"shin.{side}"),
        ]
    result += props
    seen = set()
    for name, _, _, parent in result:
        if name in seen:
            raise ValueError(f"duplicate bone {name!r}")
        if parent is not None and parent not in seen:
            raise ValueError(f"bone {name!r} has no parent {parent!r} before it")
        seen.add(name)
    return result


def build_rig(name, table=None, trunk=(), props=()):
    """Makes the armature in Blender, and returns it with its proportion table."""
    import unit_model_kit as kit

    table = table or Proportions()
    return kit.build_armature(name, bones(table, trunk, props)), table


def add_arm_ik(rig, table):
    """
    Two-bone IK on each arm, off until a clip keys `forearm.<side>/IK`. Returns
    the `ik_hand.<side>` and `pole.<side>` empties that `kit.bake_clip` needs.
    """
    import unit_model_kit as kit

    wrists = {side: arm_points(table, sign)[2] for side, sign in SIDES}
    empties = {f"ik_hand.{side}": kit.add_empty(f"ik_hand.{side}", wrists[side]) for side, _ in SIDES}
    empties |= {f"pole.{side}": kit.add_empty(f"pole.{side}", ARM_POLES[side]) for side, _ in SIDES}
    for side, _ in SIDES:
        ik = rig.pose.bones[f"forearm.{side}"].constraints.new("IK")
        ik.name = "IK"
        ik.target = empties[f"ik_hand.{side}"]
        ik.pole_target = empties[f"pole.{side}"]
        ik.pole_angle = math.radians(ARM_POLE_ANGLE)
        ik.chain_count = 2
    return empties


def _core_owner(bone, parents):
    """The nearest core bone at or above `bone`, or None for a separate chain."""
    while bone is not None and bone not in CORE_BONES:
        bone = parents[bone]
    return bone


def skin_problems(parts, parents):
    """
    Each use of a bone that the skinning rule refuses. `parts` have `name`,
    `region` and `bones`, as `kit.part_object` leaves them. `parents` maps each
    bone to its parent. A unit's bone belongs to the core bone that holds it.
    """
    problems = []
    for part in parts:
        region = region_name(part.region)
        allowed = SKIN_RULES.get(region)
        if allowed is None:
            continue
        for bone in sorted(part.bones):
            owner = _core_owner(bone, parents)
            if owner is not None and owner not in allowed:
                problems.append(f"{part.name}: {region} part must not use bone {bone!r}")
    return problems


def check_skin(parts, rig):
    """Stops the build if a part breaks the skinning rule."""
    parents = {bone.name: bone.parent.name if bone.parent else None for bone in rig.data.bones}
    problems = skin_problems(parts, parents)
    if problems:
        raise ValueError("; ".join(problems))
