"""
The machine Body Plan: the carts and the walkers. See `README.md`.

A machine has one carrier bone below the root. A cart bone carries the body of a
cart, and all its other bones hang from it. The wheels turn in `walk`. A walker
has a `body` bone, and its feet hang from the root, so they stay on the ground.

This module needs Blender only in `build_rig`, so the tests can read the plan
with plain Python. Axes are as in `unit_model_kit.py`: Z is up, the machine
faces -Y, and its left side is +X.
"""

from dataclasses import dataclass

from .shared import CLIP_SLOTS, checked_order, offset_point, skin_checks

NAME = "machine"
WHEELS = ("FL", "FR", "BL", "BR")
# +X is the axle of a wheel, and a turn about it rolls the wheel forward.
WHEEL_AXIS = (1, 0, 0)

_CARRIERS = {"root", "cart", "body", "barrel"}
SKIN_RULES = {
    "head": _CARRIERS,
    "torso": _CARRIERS,
    "arm.L": _CARRIERS,
    "arm.R": _CARRIERS,
    **{
        f"leg.{side}": _CARRIERS
        | {f"wheel.F{side}", f"wheel.B{side}", f"thigh.{side}", f"shin.{side}", f"foot.{side}"}
        for side in "LR"
    },
}
skin_problems, check_skin = skin_checks(SKIN_RULES)


@dataclass(frozen=True)
class Proportions:
    """
    Distances are in scene units. The survey in `README.md` has few scripts and
    almost no common value, so the defaults are those of Grand Gearjammer.
    `carrier` is the name of the carrier bone. A machine with no wheels sets
    `wheels` to False, and the wheel values then do not apply.
    """

    root_tip_z: float = 0.12
    # The bone that carries the machine, from its pivot to its tip.
    carrier: str = "cart"
    carrier_y: float = 0.22
    carrier_z: float = 0.13
    carrier_tip_y: float = -0.24
    carrier_tip_z: float = 0.13
    wheels: bool = True
    axle_z: float = 0.13
    wheel_x: float = 0.21
    front_y: float = -0.24
    back_y: float = 0.22
    wheel_tip_z: float = 0.06
    # The full turns of each wheel in one `walk` clip.
    wheel_turns: int = 1


@dataclass(frozen=True)
class WalkerLegs:
    """The legs of a walker. Only Junk Walker has them, so these are its values."""

    x: float = 0.13
    hip_z: float = 0.38
    knee_y: float = -0.075
    knee_z: float = 0.21
    ankle_z: float = 0.065
    foot_tip_y: float = -0.1
    pole_y: float = -0.5
    pole_tip_z: float = 0.26


def wheel_centers(table):
    """The center of each wheel. The geometry and the bones use the same points."""
    return {
        wheel: (table.wheel_x * (1 if wheel[1] == "L" else -1), table.front_y if wheel[0] == "F" else table.back_y, table.axle_z)
        for wheel in WHEELS
    }


def wheel_pose(turn, angle):
    """The pose of all the wheels, `angle` degrees forward. `turn` is `kit.turn` for one rig."""
    return {f"wheel.{wheel}": turn(f"wheel.{wheel}", (WHEEL_AXIS, angle)) for wheel in WHEELS}


def rolling_angle(table, frame, frames):
    """The wheel angle at one frame of a `walk` clip. A full loop ends with the wheels where they started."""
    return frame / frames * (360 * table.wheel_turns)


def walker_poles(legs, parent):
    """The bones that the knees point to, in front of the legs."""
    return [
        (f"pole.{side}", (legs.x * sign, legs.pole_y, legs.knee_z), (legs.x * sign, legs.pole_y, legs.pole_tip_z), parent)
        for side, sign in (("L", 1), ("R", -1))
    ]


def walker_leg(legs, side, parent):
    """
    One leg, with the hip on the `parent` bone. The foot is not a child of the
    shin. It hangs from the root and it stays on the ground, and the shin reaches
    it with IK.
    """
    x = legs.x * (1 if side == "L" else -1)
    hip, knee = (x, 0, legs.hip_z), (x, legs.knee_y, legs.knee_z)
    ankle = (x, 0, legs.ankle_z)
    return [
        (f"thigh.{side}", hip, knee, parent),
        (f"shin.{side}", knee, ankle, f"thigh.{side}"),
        (f"foot.{side}", ankle, offset_point(ankle, (0, legs.foot_tip_y, 0)), "root"),
    ]


def crew_neck(base, size):
    """The neck of a crew member that sits at `base`."""
    return offset_point(base, (0, 0, 0.11 * size))


def crew_shoulder(base, size, sign):
    """A shoulder of a crew member. `sign` is 1 for the left."""
    return offset_point(base, (0.05 * sign * size, 0, 0.095 * size))


def crew_bones(name, base, size, parent):
    """A small figure from the waist up: a body, a head and two arms."""
    neck = crew_neck(base, size)
    bones = [
        (f"{name}.body", tuple(base), neck, parent),
        (f"{name}.head", neck, offset_point(neck, (0, 0, 0.1 * size)), f"{name}.body"),
    ]
    for side, sign in (("L", 1), ("R", -1)):
        shoulder = crew_shoulder(base, size, sign)
        tip = offset_point(shoulder, (0.02 * sign, -0.03, -0.07))
        bones.append((f"{name}.arm.{side}", shoulder, tip, f"{name}.body"))
    return bones


def _wheel_bones(table):
    return [
        (f"wheel.{wheel}", center, offset_point(center, (0, 0, table.wheel_tip_z)), table.carrier)
        for wheel, center in wheel_centers(table).items()
    ]


def _check_carried(bones, carrier):
    """Stops a bone of a cart that does not hang from the cart bone."""
    carried = {carrier}
    for name, _, _, parent in bones[2:]:
        if parent not in carried:
            raise ValueError(f"bone {name!r} must hang from {carrier!r}")
        carried.add(name)


def bones(table, trunk=(), props=()):
    """
    The bone list for `kit.build_armature`: (name, head, tail, parent). The core
    bones come from `table`. `trunk` adds a unit's bones before the wheels, and
    `props` adds its bones after them.
    """
    result = checked_order(
        [
            ("root", (0, 0, 0), (0, 0, table.root_tip_z), None),
            (table.carrier, (0, table.carrier_y, table.carrier_z), (0, table.carrier_tip_y, table.carrier_tip_z), "root"),
            *trunk,
            *(_wheel_bones(table) if table.wheels else ()),
            *props,
        ]
    )
    if table.wheels:
        _check_carried(result, table.carrier)
    return result


def build_rig(name, table, trunk=(), props=()):
    """Makes the armature in Blender, and returns it with its proportion table."""
    import unit_model_kit as kit

    return kit.build_armature(name, bones(table, trunk, props)), table
