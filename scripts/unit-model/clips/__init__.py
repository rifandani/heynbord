"""The Clip Library: one set of base clips for each Body Plan. See `README.md`."""

from . import biped_large, biped_medium, biped_small, flyer, machine, quadruped, structure

CLIP_LIBRARY = {plan.NAME: plan for plan in (biped_small, biped_medium, biped_large, quadruped, flyer, machine, structure)}
