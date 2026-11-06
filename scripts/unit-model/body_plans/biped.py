"""
The code that the biped Body Plans share: the skeleton, the IK setup, the
skinning rule and the clip slots. Each plan gives its own proportion table.
See `README.md`.

This module needs Blender only in `build_rig` and `add_arm_ik`, so the tests
can read the plans with plain Python. Axes are as in `unit_model_kit.py`: Z is
up, the figure faces -Y, and its left side is +X.
"""

from dataclasses import dataclass
import math
from .shared import CLIP_SLOTS, ClipSlot, checked_order, float32, skin_checks

__all__ = [
    "ARM_POLES",
    "ARM_POLE_ANGLE",
    "CLIP_SLOTS",
    "SIDES",
    "SKIN_RULES",
    "ClipSlot",
    "add_arm_ik",
    "arm_points",
    "bones",
    "build_rig",
    "check_skin",
    "leg_points",
    "shoulder_point",
    "skin_problems",
]

SIDES = (("L", 1), ("R", -1))

SKIN_RULES = {
    "head": {"chest", "neck", "head"},
    "torso": {"hips", "spine", "chest", "thigh.L", "thigh.R"},
    **{
        f"arm.{side}": {"chest", f"shoulder.{side}", f"upperarm.{side}", f"forearm.{side}", f"hand.{side}"}
        for side, _ in SIDES
    },
    **{f"leg.{side}": {"hips", f"thigh.{side}", f"shin.{side}", f"foot.{side}"} for side, _ in SIDES},
}

# The pole angle that bends each elbow toward its pole, and the poles of the
# archers, the only scripts of the survey with poles that are empties.
ARM_POLE_ANGLE = -90
ARM_POLES = {"L": (0.25, -0.15, 0.7), "R": (-0.05, 0.45, 0.85)}


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
    Distances in scene units and angles in degrees. Each plan subclasses this
    with the defaults of its survey. `README.md` gives the surveys.
    """

    # The heights of the body.
    ankle_z: float
    knee_z: float
    hip_z: float
    waist_z: float
    chest_z: float
    shoulder_z: float
    neck_z: float
    head_base_z: float
    head_top_z: float
    # The forward lean of the neck and the head. The figure faces -Y.
    neck_y: float
    head_base_y: float
    head_top_y: float
    # The arms hang in an A-pose, `arm_angle` degrees from the body.
    shoulder_width: float
    shoulder_root_x: float
    arm_angle: float
    upper_arm: float
    forearm: float
    hand: float
    # The legs.
    hip_x: float
    knee_x: float
    foot_tip_y: float
    foot_tip_z: float
    root_tip_z: float

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


def shoulder_point(table, sign):
    """The joint where one arm starts. `sign` is 1 for the left."""
    return (table.shoulder_width / 2 * sign, 0, table.shoulder_z)


def arm_points(table, sign):
    """The shoulder, elbow, wrist, fingertip and direction of one arm. `sign` is 1 for the left."""
    angle = math.radians(table.arm_angle)
    direction = (math.sin(angle) * sign, 0, -math.cos(angle))

    def along(point, length):
        # Round after each step, as a Blender Vector does. A different last bit
        # changes the keyframe digest of a Source Contract.
        step = float32(length)
        return tuple(float32(float32(p) + float32(float32(d) * step)) for p, d in zip(point, direction))

    shoulder = shoulder_point(table, sign)
    elbow = along(shoulder, table.upper_arm)
    wrist = along(elbow, table.forearm)
    return shoulder, elbow, wrist, along(wrist, table.hand), direction


def _arm_joints(table, side, sign, arms):
    """
    The shoulder, elbow, wrist and fingertip of one arm. `arms` maps a side to
    the (elbow, wrist, fingertip) of a bent arm, or it is None for a straight arm.
    """
    if arms is None:
        return arm_points(table, sign)[:4]
    return (shoulder_point(table, sign), *(tuple(point) for point in arms[side]))


def leg_points(table, sign):
    """The hip, knee and ankle of one leg. `sign` is 1 for the left."""
    return (
        (table.hip_x * sign, 0, table.hip_z),
        (table.knee_x * sign, 0, table.knee_z),
        (table.knee_x * sign, 0, table.ankle_z),
    )


def bones(table, trunk=(), props=(), arms=None):
    """
    The bone list for `kit.build_armature`: (name, head, tail, parent). The core
    bones come from `table`. `trunk` adds a unit's bones after the head, and
    `props` adds its bones after the limbs. `arms` is as in `_arm_joints`.
    """
    result = [
        ("root", (0, 0, 0), (0, 0, table.root_tip_z), None),
        ("hips", (0, 0, table.hip_z), (0, 0, table.waist_z), "root"),
        ("spine", (0, 0, table.waist_z), (0, 0, table.chest_z), "hips"),
        ("chest", (0, 0, table.chest_z), (0, 0, table.neck_z), "spine"),
        ("neck", (0, table.neck_y, table.neck_z), (0, table.head_base_y, table.head_base_z), "chest"),
        ("head", (0, table.head_base_y, table.head_base_z), (0, table.head_top_y, table.head_top_z), "neck"),
        *trunk,
    ]
    for side, sign in SIDES:
        shoulder, elbow, wrist, tip = _arm_joints(table, side, sign, arms)
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
    return checked_order([*result, *props])


def build_rig(name, table, trunk=(), props=(), arms=None):
    """Makes the armature in Blender, and returns it with its proportion table."""
    import unit_model_kit as kit

    return kit.build_armature(name, bones(table, trunk, props, arms)), table


def add_arm_ik(rig, table, arms=None):
    """
    Two-bone IK on each arm, off until a clip keys `forearm.<side>/IK`. Returns
    the `ik_hand.<side>` and `pole.<side>` empties that `kit.bake_clip` needs.
    """
    import unit_model_kit as kit

    wrists = {side: _arm_joints(table, side, sign, arms)[2] for side, sign in SIDES}
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


skin_problems, check_skin = skin_checks(SKIN_RULES)
