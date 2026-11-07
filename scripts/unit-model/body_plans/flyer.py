"""
The flyer Body Plan: the creatures that float, and the root-lift rule of each
flyer. See `README.md`.

The game puts the rest pose on the ground, so a flyer gets its height in one of
two ways. A flight stand reaches from the body to the ground, and it keeps the
body in the air in the rest pose: this is `STAND_LIFT`. Or the figure stands on
the ground in the rest pose, and its clips lift the `root`: this is `ROOT_LIFT`.

A figure with `ROOT_LIFT` has the 20 biped core bones, so its Body Plan is a
biped plan. It reads only `ROOT_LIFT` from this module, and its Unit Spec sets
`flying`, so that the `ground-contact` Review Gate reads it.

This module needs Blender only in `build_rig`, so the tests can read the plan
with plain Python. Axes are as in `unit_model_kit.py`: Z is up, the figure
faces -Y, and its left side is +X.
"""

from dataclasses import dataclass
from typing import NamedTuple

from .shared import CLIP_SLOTS, checked_order, skin_checks

NAME = "flyer"

SKIN_RULES = {
    "head": {"body"},
    "torso": {"body"},
    **{f"arm.{side}": {"body", f"wing.{side}", f"wing.F{side}", f"wing.B{side}"} for side in "LR"},
    **{f"leg.{side}": {"body"} for side in "LR"},
}
skin_problems, check_skin = skin_checks(SKIN_RULES)


class Lift(NamedTuple):
    """How high the clips of one flyer put its `root`, in scene units."""

    float_z: float
    bob_z: float

    def height(self, bob=0.0):
        """The `root` height of a hover pose. `bob` is -1 to 1."""
        return self.float_z + self.bob_z * bob


STAND_LIFT = Lift(0.0, 0.015)
ROOT_LIFT = Lift(0.14, 0.025)


@dataclass(frozen=True)
class Proportions:
    """
    Distances in scene units. The survey in `README.md` has three scripts and
    almost no common value, so the defaults are those of Amberwing Dart.
    """

    root_tip_z: float = 0.12
    # The body bone, from its back to its front.
    body_back_y: float = 0.04
    body_back_z: float = 0.55
    body_front_y: float = -0.05
    body_front_z: float = 0.55


def wing_pair(position, root, tip):
    """The left wing bone and its mirror. `position` is F or B. `root` and `tip` are on the left wing."""
    root, tip = tuple(root), tuple(tip)
    return [
        (f"wing.{position}L", root, tip, "body"),
        (f"wing.{position}R", (-root[0], *root[1:]), (-tip[0], *tip[1:]), "body"),
    ]


def bones(table, trunk=(), props=()):
    """
    The bone list for `kit.build_armature`: (name, head, tail, parent). The core
    bones come from `table`. `trunk` adds a unit's bones after the body, and
    `props` adds its bones after them. A flight stand goes in `props`.
    """
    return checked_order(
        [
            ("root", (0, 0, 0), (0, 0, table.root_tip_z), None),
            ("body", (0, table.body_back_y, table.body_back_z), (0, table.body_front_y, table.body_front_z), "root"),
            *trunk,
            *props,
        ]
    )


def build_rig(name, table, trunk=(), props=()):
    """Makes the armature in Blender, and returns it with its proportion table."""
    import unit_model_kit as kit

    return kit.build_armature(name, bones(table, trunk, props)), table
