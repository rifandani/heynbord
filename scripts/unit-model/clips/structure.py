"""
The base clips of structure: the walls and the heaps. These clips key only
`base`: a big piece has its own foot bone, so its fall is in the build script.
See `README.md`.
"""

from body_plans.structure import CLIP_SLOTS

from . import base
from .base import Beat, X, Y, base_clips

NAME = "structure"
SWAY_RATTLE = ((0, 0, 0), (12, 1, 1), (24, 0, 0), (36, -1, 1), (48, 0, 0))
HALF = (0, 4)
MOST = (0, 1, 3, 4)

CLIPS = base_clips(
    CLIP_SLOTS,
    {
        "idle": tuple(Beat(frame, "stance", (sway, rattle)) for frame, sway, rattle in SWAY_RATTLE),
        "lowHp": (Beat(0, "battered", (0,)), Beat(24, "battered", (1,)), Beat(48, "battered", (0,))),
        "walk": (Beat(0, "heave", (0, 0)), Beat(6, "heave", (1, 1)), Beat(12, "heave", (0, 0)), Beat(18, "heave", (1, -1)), Beat(24, "heave", (0, 0))),
        "attack": (Beat(0), Beat(10, "windup"), Beat(15, "smash"), Beat(19, "smash"), Beat(26), Beat(30)),
        "cast": (Beat(0), Beat(6, "jolt", (0.2,)), Beat(12, "jolt", (0.3,)), Beat(18, "jolt", (0.2,)), Beat(24)),
        "hurt": (Beat(0), Beat(3, "jolt"), Beat(8, "jolt", (0.4,)), Beat(16)),
        "death": (
            Beat(0),
            Beat(4, "jolt"),
            Beat(12, "falling", (HALF,)),
            Beat(18, "falling", (MOST,)),
            Beat(26, "fallen"),
            Beat(30, "fallen", (6,)),
            Beat(36, "fallen"),
        ),
        "rebirth": (
            Beat(0),
            Beat(4, "jolt"),
            Beat(12, "falling", (HALF,)),
            Beat(20, "fallen"),
            Beat(24, "fallen", (3,)),
            Beat(30, "fallen", (0, 0.35)),
            Beat(36, "fallen", (0, 0.7)),
            Beat(41, "jolt", (0.6,)),
            Beat(48),
        ),
        "summon": (Beat(0, "fallen"), Beat(8, "fallen", (0, 0.5)), Beat(14, "jolt", (0.7,)), Beat(24)),
    },
)


class Poses(base.Poses):
    def stance(self, sway=0.0, rattle=0.0):
        """A structure rocks a very small distance on `base`. A unit moves its own pieces."""
        return {"base@loc": self.at("base", (0, 0, 0.002 * rattle)), "base": self.t("base", (Y, sway))}

    def battered(self, base, breath=0.0):
        """Low HP: the structure sags."""
        return {**base, "base@loc": self.at("base", (0, 0, 0.014)), "base": self.t("base", (Y, -2), (X, 1 + breath))}

    def heave(self, base, lift, tilt):
        """A walk pose: the whole structure hops and rocks."""
        return {
            **base,
            "base@loc": self.at("base", (0, 0, 0.03 * lift)),
            "base": self.t("base", (X, 4 * tilt), (Y, 3 * tilt)),
        }

    def windup(self, base):
        return base

    def jolt(self, base, amount=1.0, forward=False):
        """A blow shakes the structure."""
        direction = -1 if forward else 1
        return {
            **base,
            "base@loc": self.at("base", (0, 0.02 * amount * direction, 0.016 * amount)),
            "base": self.t("base", (X, -4 * amount * direction)),
        }

    def smash(self, base):
        return {**self.jolt(base, 0.8, forward=True), "base@loc": self.at("base", (0, -0.04, 0.016))}

    def falling(self, base, down):
        """`down` lists the pieces that are down. The pieces are in the build script."""
        return base

    def fallen(self, base, bounce=0.0, rise=0.0):
        """The structure settles as its pieces fall. `rise` is 0 to 1, for a Rebirth."""
        down = 1 - rise
        return {**base, "base@loc": self.at("base", (0, 0, 0.012 * down)), "base": self.t("base", (X, 2 * down), (Y, -2 * down))}
