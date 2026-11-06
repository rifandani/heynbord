"""
The quadruped Body Plan: the beasts with four legs on the ground. See
`README.md`.

This module needs Blender only in `build_rig`, so the tests can read the plan
with plain Python. Axes are as in `unit_model_kit.py`: Z is up, the beast faces
-Y, so its body lies along Y, and its left side is +X.
"""

from dataclasses import dataclass

from .shared import CLIP_SLOTS as SHARED_SLOTS
from .shared import ClipSlot, checked_order, skin_checks

NAME = "quadruped"
LEGS = ("FL", "FR", "BL", "BR")

_NECK = {"neck", "neck.2"}
SKIN_RULES = {
    "head": {"chest", "head"} | _NECK,
    "torso": {"hips", "spine", "chest", "head"} | _NECK,
    **{
        f"leg.{side}": {"hips", "chest"}
        | {f"{bone}.{end}{side}" for bone in ("upper", "lower", "foot", "hoof", "paw") for end in "FB"}
        for side in "LR"
    },
}
skin_problems, check_skin = skin_checks(SKIN_RULES)

# The two beasts of the survey with a cast clip agree. The other slots are shared.
CLIP_SLOTS = {**SHARED_SLOTS, "cast": ClipSlot("cast", 30, False)}

# The spine from the back to the front. Each one must be in front of the last.
_FORWARD = ("hip_y", "mid_y", "chest_y", "neck_y")
# The joints of each leg from the body to the ground. Each one must be below the last.
_LEG_JOINTS = ("top", "knee", "ankle", "toe")
_FALLING = tuple(tuple(f"{end}_{joint}_z" for joint in _LEG_JOINTS) for end in ("front", "back"))


@dataclass(frozen=True)
class Proportions:
    """
    Distances in scene units. A default is the most common value of the survey
    in `README.md`, with the exceptions that it lists.
    """

    root_tip_z: float = 0.1
    # The spine, from the hips to the base of the neck.
    hip_y: float = 0.24
    hip_z: float = 0.4
    mid_y: float = 0.05
    mid_z: float = 0.42
    chest_y: float = -0.12
    chest_z: float = 0.45
    neck_y: float = -0.26
    neck_z: float = 0.44
    # The (y, z) at the end of each neck bone, so the last one is the base of
    # the head. With no neck bones, the head starts at the base of the neck.
    necks: tuple = ((-0.33, 0.39),)
    head_tip_y: float = -0.52
    head_tip_z: float = 0.34
    # The left legs. The right legs are their mirrors.
    front_top_x: float = 0.08
    front_top_y: float = -0.13
    front_top_z: float = 0.38
    front_knee_x: float = 0.12
    front_knee_y: float = -0.14
    front_knee_z: float = 0.23
    front_ankle_x: float = 0.12
    front_ankle_y: float = -0.14
    front_ankle_z: float = 0.07
    front_toe_x: float = 0.12
    front_toe_y: float = -0.2
    front_toe_z: float = 0.02
    back_top_x: float = 0.08
    back_top_y: float = 0.25
    back_top_z: float = 0.38
    back_knee_x: float = 0.11
    back_knee_y: float = 0.27
    back_knee_z: float = 0.2
    back_ankle_x: float = 0.11
    back_ankle_y: float = 0.24
    back_ankle_z: float = 0.07
    back_toe_x: float = 0.11
    back_toe_y: float = 0.19
    back_toe_z: float = 0.02

    def __post_init__(self):
        for back, front in zip(_FORWARD, _FORWARD[1:]):
            if getattr(self, front) >= getattr(self, back):
                raise ValueError(f"{front} must be in front of {back}")
        for leg in _FALLING:
            for high, low in zip(leg, leg[1:]):
                if getattr(self, low) >= getattr(self, high):
                    raise ValueError(f"{low} must be below {high}")


def leg_parent(leg):
    """The body bone that holds one leg. `leg` is FL, FR, BL or BR."""
    return "chest" if leg[0] == "F" else "hips"


def leg_points(table, leg):
    """The top, knee, ankle and toe of one leg. `leg` is FL, FR, BL or BR."""
    end = "front" if leg[0] == "F" else "back"
    sign = 1 if leg[1] == "L" else -1
    return tuple(
        (
            getattr(table, f"{end}_{joint}_x") * sign,
            getattr(table, f"{end}_{joint}_y"),
            getattr(table, f"{end}_{joint}_z"),
        )
        for joint in _LEG_JOINTS
    )


def _head_and_neck(table):
    """The neck bones and the head bone, from the base of the neck."""
    start, parent = (table.neck_y, table.neck_z), "chest"
    result = []
    for index, joint in enumerate(table.necks):
        name = "neck" if index == 0 else f"neck.{index + 1}"
        result.append((name, (0, *start), (0, *joint), parent))
        start, parent = joint, name
    return [*result, ("head", (0, *start), (0, table.head_tip_y, table.head_tip_z), parent)]


def bones(table, trunk=(), props=(), foot="foot"):
    """
    The bone list for `kit.build_armature`: (name, head, tail, parent). The core
    bones come from `table`. `trunk` adds a unit's bones after the head, and
    `props` adds its bones after the legs. `foot` names the last bone of a leg.
    """
    result = [
        ("root", (0, 0, 0), (0, 0, table.root_tip_z), None),
        ("hips", (0, table.hip_y, table.hip_z), (0, table.mid_y, table.mid_z), "root"),
        ("spine", (0, table.mid_y, table.mid_z), (0, table.chest_y, table.chest_z), "hips"),
        ("chest", (0, table.chest_y, table.chest_z), (0, table.neck_y, table.neck_z), "spine"),
        *_head_and_neck(table),
        *trunk,
    ]
    for leg in LEGS:
        top, knee, ankle, toe = leg_points(table, leg)
        result += [
            (f"upper.{leg}", top, knee, leg_parent(leg)),
            (f"lower.{leg}", knee, ankle, f"upper.{leg}"),
            (f"{foot}.{leg}", ankle, toe, f"lower.{leg}"),
        ]
    return checked_order([*result, *props])


def build_rig(name, table, trunk=(), props=(), foot="foot"):
    """Makes the armature in Blender, and returns it with its proportion table."""
    import unit_model_kit as kit

    return kit.build_armature(name, bones(table, trunk, props, foot)), table
