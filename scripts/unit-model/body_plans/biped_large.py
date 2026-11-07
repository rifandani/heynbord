"""The biped-large Body Plan: the big orcs and the trolls. See `README.md`."""

from dataclasses import dataclass

from . import biped
from .biped import *  # noqa: F403

NAME = "biped-large"


@dataclass(frozen=True)
class Proportions(biped.Proportions):
    """A default is the most common value of the survey in `README.md`, with two exceptions."""

    ankle_z: float = 0.055
    knee_z: float = 0.26
    hip_z: float = 0.46
    waist_z: float = 0.54
    chest_z: float = 0.63
    shoulder_z: float = 0.715
    neck_z: float = 0.745
    head_base_z: float = 0.78
    head_top_z: float = 0.94
    neck_y: float = -0.01
    head_base_y: float = -0.02
    head_top_y: float = -0.03
    shoulder_width: float = 0.31
    shoulder_root_x: float = 0.03
    arm_angle: float = 25
    upper_arm: float = 0.159
    forearm: float = 0.135
    hand: float = 0.05
    hip_x: float = 0.062
    knee_x: float = 0.062
    foot_tip_y: float = -0.09
    foot_tip_z: float = 0.02
    root_tip_z: float = 0.12
