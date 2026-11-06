"""The Body Plans that the build scripts use. A Unit Spec names one in `bodyPlan`."""

from . import biped_large, biped_medium, biped_small

BODY_PLANS = {plan.NAME: plan for plan in (biped_small, biped_medium, biped_large)}
