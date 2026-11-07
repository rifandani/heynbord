"""
The base clips of machine: the carts and the walkers. These clips key only
`root`, the carrier bone and the wheels. See `README.md`.
"""

import math

from body_plans.machine import CLIP_SLOTS, Proportions, rolling_angle, wheel_pose

from . import base
from .base import Beat, X, Y, base_clips
from .overrides import Fall

NAME = "machine"
LOOP = CLIP_SLOTS["idle"].frames
WALK = CLIP_SLOTS["walk"].frames
IDLE_STEP = 4
LOW_STEP = 6
WALK_STEP = 3


def _idle(frame):
    rumble = 1 if (frame // IDLE_STEP) % 2 else -1
    wave = math.sin(frame / LOOP * 2 * math.pi)
    return Beat(frame, "stance", (rumble if frame not in (0, LOOP) else 0, frame / LOOP * 360, wave, wave))


CLIPS = base_clips(
    CLIP_SLOTS,
    {
        "idle": tuple(_idle(frame) for frame in range(0, LOOP + 1, IDLE_STEP)),
        "lowHp": tuple(Beat(frame, "broken", (math.sin(frame / LOOP * 2 * math.pi),)) for frame in range(0, LOOP + 1, LOW_STEP)),
        # One turn of the wheels for each Square (`STEPS_PER_SQUARE`), with four bumps.
        "walk": tuple(Beat(frame, "rolling", (frame, math.sin(frame / WALK * 4 * math.pi))) for frame in range(0, WALK + 1, WALK_STEP)),
        # The shot leaves at 20% of the attack (`FLIGHT_START` in fx.ts): frame 6 of 30.
        "attack": (
            Beat(0),
            Beat(4, "aim"),
            Beat(5, "aim"),
            Beat(6, "fire", (0.3, 1.4)),
            Beat(8, "fire", (1.0, 0.8)),
            Beat(11, "fire", (0.7, 0.0)),
            Beat(18, "fire", (0.2, 0.0)),
            Beat(24),
            Beat(30),
        ),
        "cast": (Beat(0), Beat(6, "jolt", (0.4,)), Beat(12, "jolt", (0.6,)), Beat(18, "jolt", (0.4,)), Beat(24)),
        "hurt": (Beat(0), Beat(3, "jolt"), Beat(8, "jolt", (0.4,)), Beat(16)),
        "death": (Beat(0), Beat(5, "jolt"), Beat(14, "tilting"), Beat(24, "tipped"), Beat(28, "tipped", (6,)), Beat(36, "tipped")),
        "rebirth": (
            Beat(0),
            Beat(4, "jolt"),
            Beat(12, "tilting"),
            Beat(20, "tipped"),
            Beat(22, "tipped", (3,)),
            Beat(32, "tilting"),
            Beat(38, "landing", (0.0, 1.0)),
            Beat(42, "cheer"),
            Beat(48),
        ),
        "summon": (
            Beat(0, "landing", (0.16,)),
            Beat(8, "landing", (0.0, 1.0)),
            Beat(12, "landing", (0.03,)),
            Beat(15, "landing", (0.0, 0.5)),
            Beat(19, "cheer"),
            Beat(24),
        ),
    },
)


class Poses(base.Poses):
    fall = Fall(Y, -84, (-0.04, 0, 0.33))
    table = Proportions()

    @property
    def carrier(self):
        return self.table.carrier

    def wheels(self, angle):
        return wheel_pose(self.t, angle) if self.table.wheels else {}

    def stance(self, rumble=0.0, gear=0.0, bob=0.0, look=0.0):
        """The machine at rest: the engine rumbles. `gear`, `bob` and `look` are for a unit with a crew."""
        carrier = self.carrier
        return {
            f"{carrier}@loc": self.at(carrier, (0, 0, 0.003 * rumble)),
            carrier: self.t(carrier, (X, 0.6 * rumble)),
            **self.wheels(0),
        }

    def broken(self, base, rumble=0.0):
        """Low HP: the machine sags to one side."""
        return {**self.stance(rumble), self.carrier: self.t(self.carrier, (Y, -6), (X, 2))}

    def rolling(self, base, frame, bump=0.0):
        """The wheels turn and the machine bumps."""
        angle = rolling_angle(self.table, frame, WALK)
        carrier = self.carrier
        return {
            **self.stance(0, angle, bump, 0),
            **self.wheels(angle),
            f"{carrier}@loc": self.at(carrier, (0, 0, 0.012 * abs(bump))),
            carrier: self.t(carrier, (X, 2 * bump)),
        }

    def aim(self, base):
        return base

    def fire(self, base, kick=0.0, flash=0.0):
        """The shot kicks the machine back. `flash` is for a unit with a flash bone."""
        return {**base, self.carrier: self.t(self.carrier, (X, -4 * kick))}

    def jolt(self, base, amount=1.0):
        """A hit shakes the machine."""
        carrier = self.carrier
        return {
            **base,
            carrier: self.t(carrier, (Y, 6 * amount), (X, -3 * amount)),
            f"{carrier}@loc": self.at(carrier, (0, 0.02 * amount, 0.01 * amount)),
        }

    def tipped(self, base, bounce=0.0):
        """The machine falls on its right side, toward the camera."""
        return {**base, **self.fall_keys(bounce)}

    def tilting(self, base):
        """Halfway over, on two wheels."""
        return {**base, "root": self.t("root", (Y, -30)), "root@loc": self.at("root", (-0.06, 0, 0.12))}

    def landing(self, base, height=0.0, squash=0.0):
        """A summon: the machine drops onto the Square and bounces."""
        carrier = self.carrier
        return {
            **base,
            "root@loc": self.at("root", (0, 0, height)),
            f"{carrier}@loc": self.at(carrier, (0, 0, -0.02 * squash)),
            carrier: self.t(carrier, (X, 3 * squash)),
        }

    def cheer(self, base):
        return base
