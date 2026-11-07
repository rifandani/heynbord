"""The biped-small Body Plan: the goblins. See `README.md`."""

from dataclasses import dataclass

from . import biped
from .biped import *  # noqa: F403

NAME = "biped-small"


@dataclass(frozen=True)
class Proportions(biped.Proportions):
    """A default is the most common value of the survey in `README.md`, with two exceptions."""

    ankle_z: float = 0.04
    knee_z: float = 0.17
    hip_z: float = 0.3
    waist_z: float = 0.36
    chest_z: float = 0.42
    shoulder_z: float = 0.48
    neck_z: float = 0.5
    head_base_z: float = 0.51
    head_top_z: float = 0.69
    neck_y: float = 0.0
    head_base_y: float = -0.006
    head_top_y: float = -0.01
    shoulder_width: float = 0.184
    shoulder_root_x: float = 0.02
    arm_angle: float = 25
    upper_arm: float = 0.105
    forearm: float = 0.09
    hand: float = 0.035
    hip_x: float = 0.048
    knee_x: float = 0.048
    foot_tip_y: float = -0.08
    foot_tip_z: float = 0.016
    root_tip_z: float = 0.1
