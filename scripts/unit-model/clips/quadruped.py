"""The base clips of quadruped: the beasts with four legs on the ground. See `README.md`."""

import math

from body_plans.quadruped import CLIP_SLOTS

from . import base
from .base import BREATH_SWAY, Beat, X, Y, Z, base_clips
from .overrides import Fall

NAME = "quadruped"
WALK_STEP = 2
# The legs move in diagonal pairs: (leg, share of the cycle).
TROT = (("FL", 0.0), ("BR", 0.0), ("FR", 0.5), ("BL", 0.5))
# The share of the cycle with the foot in the air.
AIR_SHARE = 0.4


def walk_beats(frames):
    """The beats of a trot of `frames`. Each beat gives the share of the cycle."""
    return tuple(Beat(frame, "stride", (frame / frames,)) for frame in range(0, frames + 1, WALK_STEP))


CLIPS = base_clips(
    CLIP_SLOTS,
    {
        "idle": tuple(Beat(frame, "stance", (breath, sway)) for frame, breath, sway in BREATH_SWAY),
        "lowHp": (Beat(0, "gasp", (0,)), Beat(24, "gasp", (1,)), Beat(48, "gasp", (0,))),
        "walk": walk_beats(CLIP_SLOTS["walk"].frames),
        "attack": (Beat(0), Beat(5, "paw"), Beat(10, "charge"), Beat(15, "toss"), Beat(19, "toss", (1,)), Beat(26), Beat(30)),
        "cast": (Beat(0), Beat(6, "call", (0.6,)), Beat(10, "call"), Beat(18, "call"), Beat(24, "call", (0.5,)), Beat(30)),
        "hurt": (Beat(0), Beat(3, "recoil"), Beat(8, "recoil", (0.4,)), Beat(16)),
        "death": (Beat(0), Beat(5, "recoil"), Beat(14, "buckle"), Beat(26, "fallen"), Beat(30, "fallen", (5,)), Beat(36, "fallen")),
        "rebirth": (Beat(0), Beat(4, "recoil"), Beat(20, "fallen"), Beat(22, "fallen", (3,)), Beat(32, "low"), Beat(41, "snort"), Beat(48)),
        "summon": (Beat(0, "low"), Beat(8, "low"), Beat(15, "snort"), Beat(19, "snort", (0.6,)), Beat(24)),
    },
)


class Poses(base.Poses):
    fall = Fall(Y, 84, (-0.36, 0, 0.2))
    # The last bone of a leg: `foot`, `paw` or `hoof`.
    foot = "foot"

    def legs(self, **angles):
        """Leg swings: `FL=(upper, lower, foot)` in degrees about X. A negative upper swings forward."""
        result = {}
        for leg, (upper, lower, foot) in angles.items():
            result[f"upper.{leg}"] = self.t(f"upper.{leg}", (X, upper))
            result[f"lower.{leg}"] = self.t(f"lower.{leg}", (X, lower))
            result[f"{self.foot}.{leg}"] = self.t(f"{self.foot}.{leg}", (X, foot))
        return result

    def stance(self, breath=0.0, sway=0.0):
        t, at = self.t, self.at
        return {
            "hips@loc": at("hips", (0, 0, -breath * 0.004)),
            "hips": t("hips", (Z, -8)),
            "spine": t("spine", (X, -breath * 1.5)),
            "chest": t("chest", (X, breath * 1.5), (Z, sway * 2)),
            "head": t("head", (Z, -6 + sway * 5), (X, -2 + breath * 4), (Y, sway * 3)),
        }

    def gasp(self, base, breath=0.0):
        """Low HP: the legs give a little, and the head hangs low."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.003 - breath * 0.003)),
            spine=t("spine", (X, 3)),
            chest=t("chest", (X, 4 + breath * 2)),
            head=t("head", (X, 8 + breath * 3), (Y, -6)),
            **self.legs(FL=(-4, 14, -10), FR=(4, 12, -16), BL=(-6, 12, -6), BR=(-6, 12, -6)),
        )

    def recoil(self, base, amount=1.0):
        """The hit throws the head up and the body back."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03 * amount, 0.0)),
            chest=t("chest", (X, -6 * amount), (Z, 6 * amount)),
            head=t("head", (X, -16 * amount), (Z, 10 * amount)),
        )

    def buckle(self, base):
        """The front legs give way first."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.005)),
            chest=t("chest", (X, 10)),
            head=t("head", (X, 6)),
            **self.legs(FL=(-20, 50, -30), FR=(-10, 44, -30), BL=(-24, 36, -10), BR=(-20, 36, -10)),
        )

    def fallen(self, base, bounce=0.0):
        """
        On the left side, the legs stiff and out. The Battle camera sees the
        right side of a player Unit (-X), so it sees the legs and the belly.
        """
        t = self.t
        return self.pose(
            {**base, **self.fall_keys(bounce)},
            chest=t("chest", (X, 4)),
            head=t("head", (X, 8), (Y, 10)),
            **self.legs(FL=(-30, 10, -10), FR=(-12, 8, -10), BL=(30, 6, 0), BR=(8, 8, 0)),
        )

    def low(self, base):
        """Down low with the legs folded, as a summon starts."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.06)),
            chest=t("chest", (X, 6)),
            head=t("head", (X, 16)),
            **self.legs(FL=(-50, 100, -50), FR=(-50, 100, -50), BL=(-60, 90, -30), BR=(-60, 90, -30)),
        )

    def snort(self, base, rear=1.0):
        """The head tossed up. The front lifts a little with `rear`."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips=t("hips", (Z, -8), (X, -8 * rear)),
            hips_at_loc=at("hips", (0, 0.02 * rear, 0.0)),
            chest=t("chest", (X, -4 * rear)),
            head=t("head", (Z, -4), (X, -24)),
            **self.legs(FL=(-20 * rear, 36 * rear, -14 * rear), FR=(-6 * rear, 20 * rear, -14 * rear), BL=(6 * rear, 0, 0), BR=(8 * rear, 0, 0)),
        )

    def call(self, base, power=1.0):
        """The head up: only 2 scripts have a cast, so this is the head of `snort`."""
        t = self.t
        return self.pose(base, chest=t("chest", (X, -4 * power)), head=t("head", (Z, -4), (X, -24 * power)))

    def stride(self, base, phase):
        """The trot. `phase` 0 to 1 is one cycle. The body bobs at each step."""
        t, at = self.t, self.at
        result = self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.012 * abs(math.sin(phase * 2 * math.pi)) - 0.006)),
            chest=t("chest", (Y, 2 * math.sin(phase * 2 * math.pi))),
            head=t("head", (Z, -6), (X, 2 + 4 * math.sin(phase * 4 * math.pi))),
        )
        for leg, offset in TROT:
            local = (phase - offset) % 1.0
            # The foot in the air, then on the ground, pushed back.
            if local < AIR_SHARE:
                u = local / AIR_SHARE
                swing = 20 - 40 * u
                lift = math.sin(u * math.pi)
            else:
                u = (local - AIR_SHARE) / (1 - AIR_SHARE)
                swing = -20 + 40 * u
                lift = 0.0
            bend = (36 if leg.startswith("B") else 48) * lift
            result = self.pose(result, **self.legs(**{leg: (swing - 10 * lift, bend, 10 * lift - swing - bend)}))
        return result

    def paw(self, base):
        """The attack starts: the weight goes back, and one front foot paws."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, 0.0)),
            chest=t("chest", (X, 4)),
            head=t("head", (Z, -4), (X, 10)),
            **self.legs(FL=(-10, 16, -6), FR=(-30, 60, -10), BL=(-12, 18, -6), BR=(-10, 16, -6)),
        )

    def charge(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.1, 0.02)),
            hips=t("hips", (Z, -8), (X, 2)),
            chest=t("chest", (X, 4)),
            head=t("head", (Z, -4), (X, 12)),
            **self.legs(FL=(-34, 30, 0), FR=(-20, 24, -4), BL=(30, 0, -26), BR=(24, -4, -24)),
        )

    def toss(self, base, follow=0.0):
        """The slash effect starts at 50% of the attack (`MELEE_IMPACT` in fx.ts): frame 15 of 30."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.17 - 0.02 * follow, 0.04)),
            hips=t("hips", (Z, -8), (X, -6)),
            chest=t("chest", (X, -6)),
            head=t("head", (Z, -4), (X, -28 - 6 * follow)),
            **self.legs(FL=(-30, 30, 0), FR=(-16, 20, -4), BL=(24, 0, -24), BR=(30, -4, -26)),
        )
