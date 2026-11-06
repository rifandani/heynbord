"""The biped-medium Body Plan: the human, elf and undead figures. See `README.md`."""

from dataclasses import dataclass

from . import biped
from .biped import *  # noqa: F403

NAME = "biped-medium"


@dataclass(frozen=True)
class Proportions(biped.Proportions):
    """A default is the most common value of the survey in `README.md`, with two exceptions."""

    ankle_z: float = 0.05
    knee_z: float = 0.27
    hip_z: float = 0.47
    waist_z: float = 0.55
    chest_z: float = 0.64
    shoulder_z: float = 0.725
    neck_z: float = 0.75
    head_base_z: float = 0.79
    head_top_z: float = 0.97
    neck_y: float = 0.0
    head_base_y: float = 0.0
    head_top_y: float = 0.0
    shoulder_width: float = 0.2
    shoulder_root_x: float = 0.03
    arm_angle: float = 20
    upper_arm: float = 0.15
    forearm: float = 0.14
    hand: float = 0.055
    hip_x: float = 0.05
    knee_x: float = 0.052
    foot_tip_y: float = -0.08
    foot_tip_z: float = 0.02
    root_tip_z: float = 0.12
