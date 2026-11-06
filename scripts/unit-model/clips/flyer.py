"""
The base clips of flyer: the creatures that float. These clips key only `root`
and `body`, the 2 bones that each creature has. See `README.md`.
"""

import math

from body_plans.flyer import CLIP_SLOTS, STAND_LIFT

from . import base
from .base import Beat, X, Y, base_clips
from .overrides import Fall

NAME = "flyer"
LOOP = CLIP_SLOTS["idle"].frames
WALK = CLIP_SLOTS["walk"].frames
# A wing beat in each clip, in frames.
IDLE_STEP = 3
LOW_STEP = 4
WALK_STEP = 2


def _beat(frame, step):
    """1 and -1 in turn: the wings up and down."""
    return 1 if (frame // step) % 2 == 0 else -1


def _idle(frame):
    angle = frame / LOOP * 2 * math.pi
    return Beat(frame, "stance", (_beat(frame, IDLE_STEP), math.sin(angle), math.sin(angle * 2) * 0.6))


def _low(frame):
    return Beat(frame, "droop", (_beat(frame, LOW_STEP), math.sin(frame / LOOP * 2 * math.pi)))


def _walk(frame):
    angle = frame / WALK * 2 * math.pi
    return Beat(frame, "dart", (_beat(frame, WALK_STEP), math.sin(angle * 2), math.sin(angle)))


UP = Beat(0, "stance", (1,))
CLIPS = base_clips(
    CLIP_SLOTS,
    {
        "idle": tuple(_idle(frame) for frame in range(0, LOOP + 1, IDLE_STEP)),
        "lowHp": tuple(_low(frame) for frame in range(0, LOOP + 1, LOW_STEP)),
        "walk": tuple(_walk(frame) for frame in range(0, WALK + 1, WALK_STEP)),
        "attack": (
            UP,
            Beat(3, "rear"),
            Beat(5, "rear", (), (-1,)),
            Beat(8, "dive"),
            Beat(11, "dive", (0.9,)),
            Beat(14, "recover"),
            Beat(18, "stance", (-1,)),
            Beat(21, "stance", (1,)),
            Beat(24, "stance", (-1,)),
            Beat(27, "stance", (1,)),
            Beat(30, "stance", (1,)),
        ),
        "cast": (UP, Beat(6, "rear"), Beat(12, "rear", (), (-1,)), Beat(18, "stance", (-1,)), Beat(24, "stance", (1,))),
        "hurt": (
            UP,
            Beat(3, "knocked"),
            Beat(6, "knocked", (0.6,), (-1,)),
            Beat(9, "knocked", (0.3,), (1,)),
            Beat(12, "stance", (-1,)),
            Beat(16, "stance", (1,)),
        ),
        "death": (
            UP,
            Beat(4, "knocked"),
            Beat(8, "knocked", (0.6,), (-1,)),
            Beat(14, "falling"),
            Beat(24, "fallen"),
            Beat(28, "fallen", (8,)),
            Beat(36, "fallen"),
        ),
        "rebirth": (
            UP,
            Beat(4, "knocked"),
            Beat(16, "fallen"),
            Beat(21, "fallen", (3,)),
            Beat(32, "folded"),
            Beat(41, "unfold"),
            Beat(48, "stance", (1,)),
        ),
        "summon": (
            Beat(0, "folded"),
            Beat(9, "folded"),
            Beat(13, "unfold"),
            Beat(15, "stance", (-1,)),
            Beat(18, "stance", (1,)),
            Beat(21, "stance", (-1,)),
            Beat(24, "stance", (1,)),
        ),
    },
)


class Poses(base.Poses):
    fall = Fall(Y, 84, (-0.5, 0, 0.05))
    lift = STAND_LIFT

    def stance(self, flap=0.0, bob=0.0, sway=0.0):
        """The hover: the body a little nose-up. `flap` is -1 to 1, for a unit with wings."""
        return {
            "root@loc": self.at("root", (0, 0, self.lift.height(bob))),
            "body": self.t("body", (X, -4 + 2 * bob), (Y, 3 * sway)),
        }

    def droop(self, base, flap=0.0, bob=0.0):
        """Low HP: it hangs lower and tilts."""
        return self.pose(
            self.stance(0, bob, 0),
            root_at_loc=self.at("root", (0, 0, -0.05 + 0.01 * bob)),
            body=self.t("body", (X, 10 + 3 * bob), (Y, -14)),
        )

    def dart(self, base, flap=0.0, bob=0.0, sway=0.0):
        """The walk: a fast dart, nose down."""
        return self.pose(
            self.stance(flap, bob, sway),
            root_at_loc=self.at("root", (0, 0, 0.015 * bob)),
            body=self.t("body", (X, 12), (Y, 6 * sway)),
        )

    def rear(self, base):
        return self.pose(base, root_at_loc=self.at("root", (0, 0.06, 0.05)), body=self.t("body", (X, -26)))

    def dive(self, base, depth=1.0):
        return self.pose(
            base,
            root_at_loc=self.at("root", (0, -0.24 * depth, -0.1 * depth)),
            body=self.t("body", (X, 34 * depth)),
        )

    def recover(self, base):
        return self.stance(1)

    def knocked(self, base, amount=1.0):
        """The hit knocks it back and up."""
        return self.pose(
            base,
            root_at_loc=self.at("root", (0, 0.06 * amount, 0.03 * amount)),
            body=self.t("body", (X, -20 * amount), (Y, 12 * amount)),
        )

    def falling(self, base):
        return self.pose(base, root_at_loc=self.at("root", (0, 0.02, -0.18)), body=self.t("body", (X, 26), (Y, 30)))

    def fallen(self, base, bounce=0.0):
        """On the left side on the ground."""
        return self.pose({**base, **self.fall_keys(bounce)}, body=self.t("body", (X, 0)))

    def folded(self, base):
        """Low, as a summon starts."""
        return self.pose(base, root_at_loc=self.at("root", (0, 0, -0.06)), body=self.t("body", (X, -10)))

    def unfold(self, base):
        return self.stance(1)
