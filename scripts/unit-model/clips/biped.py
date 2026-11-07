"""The beats that the three biped plans share. See `README.md`."""

from body_plans.shared import CLIP_SLOTS

from .base import BREATH_SWAY, Beat, base_clips

# 2 feet on the ground, then 1 foot passes the other.
PASSING_WALK = (
    Beat(0, "step", (1,)),
    Beat(6, "passing", ("R",)),
    Beat(12, "step", (-1,)),
    Beat(18, "passing", ("L",)),
    Beat(24, "step", (1,)),
)
LIFTED_WALK = (
    Beat(0, "step", (1,)),
    Beat(6, "step", (1, 1)),
    Beat(12, "step", (-1,)),
    Beat(18, "step", (-1, 1)),
    Beat(24, "step", (1,)),
)


def biped_clips(walk, death_landing=26, death_bounce=5):
    """`death_landing` is the frame where the body gets to the ground."""
    return base_clips(
        CLIP_SLOTS,
        {
            "idle": tuple(Beat(frame, "stance", (breath, sway)) for frame, breath, sway in BREATH_SWAY),
            "lowHp": (Beat(0, "slump", (0,)), Beat(24, "slump", (1,)), Beat(48, "slump", (0,))),
            "walk": walk,
            "attack": (Beat(0), Beat(9, "windup"), Beat(15, "strike"), Beat(19, "strike"), Beat(26), Beat(30)),
            "cast": (Beat(0), Beat(6, "call"), Beat(10, "call", (0.014,)), Beat(16, "call"), Beat(24)),
            "hurt": (Beat(0), Beat(3, "recoil"), Beat(8, "recoil", (0.4,)), Beat(16)),
            "death": (
                Beat(0),
                Beat(5, "recoil"),
                Beat(12, "stagger"),
                Beat(death_landing, "fallen"),
                Beat(death_landing + 4, "fallen", (death_bounce,)),
                Beat(36, "fallen"),
            ),
            "rebirth": (
                Beat(0),
                Beat(4, "recoil"),
                Beat(20, "fallen"),
                Beat(22, "fallen", (3,)),
                Beat(32, "crouch"),
                Beat(41, "heroic"),
                Beat(48),
            ),
            "summon": (Beat(0, "crouch"), Beat(10, "rising"), Beat(17, "heroic"), Beat(24)),
        },
    )
