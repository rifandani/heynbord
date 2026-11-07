"""The base clips of biped-small: the goblins. See `README.md`."""

from . import base
from .base import X, Y, Z
from .biped import LIFTED_WALK, biped_clips
from .overrides import Fall

NAME = "biped-small"
CLIPS = biped_clips(LIFTED_WALK, death_landing=24, death_bounce=6)


class Poses(base.Poses):
    fall = Fall(X, -86, (0, 0, 0.1))

    def stance(self, breath=0.0, sway=0.0):
        t, at = self.t, self.at
        return {
            "hips@loc": at("hips", (0, 0, -0.012 - breath * 0.003)),
            "hips": t("hips", (Z, -14)),
            "spine": t("spine", (X, 6 + breath)),
            "chest": t("chest", (X, 2 - breath * 2), (Z, -4)),
            "neck": t("neck", (X, -10)),
            "head": t("head", (Z, 8 + sway * 5), (X, -4 + breath * 2), (Y, -6)),
            "upperarm.R": t("upperarm.R", (X, -breath * 3)),
            "thigh.L": t("thigh.L", (X, -22), (Y, -6)),
            "shin.L": t("shin.L", (X, 18)),
            "foot.L": t("foot.L", (X, -4)),
            "thigh.R": t("thigh.R", (X, 6), (Y, 6)),
            "shin.R": t("shin.R", (X, 24)),
            "foot.R": t("foot.R", (X, -18)),
        }

    def slump(self, base, breath=0.0):
        """Low HP: down on one knee."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.04, -0.15 - breath * 0.004)),
            spine=t("spine", (X, 26 + breath * 3)),
            chest=t("chest", (X, 12 + breath * 2)),
            head=t("head", (Z, 4), (X, 14 + breath * 4), (Y, -10)),
            upperarm__L=t("upperarm.L", (X, -10), (Y, 6)),
            upperarm__R=t("upperarm.R", (X, -30)),
            forearm__R=t("forearm.R", (X, -20)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 76)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 10), (Y, 6)),
            shin__R=t("shin.R", (X, 90)),
            foot__R=t("foot.R", (X, -40)),
        )

    def step(self, base, front, lift=0.0):
        """A fast step. `front` is 1 for the left foot, -1 for the right. `lift` is the foot in the air."""
        t, at = self.t, self.at
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return self.pose(
            base,
            hips_at_loc=at("hips", (0.012 * front, 0, -0.01 + lift * 0.012)),
            hips=t("hips", (Z, -10), (Y, 7 * front)),
            spine=t("spine", (X, 6), (Y, -4 * front)),
            chest=t("chest", (Z, -5 * front)),
            upperarm__L=t("upperarm.L", (X, -10 * front), (Y, 8)),
            upperarm__R=t("upperarm.R", (X, -6 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -34)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 16 + lift * 30)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 16)),
                f"shin__{back}": t(f"shin.{back}", (X, 26)),
                f"foot__{back}": t(f"foot.{back}", (X, 8)),
            },
        )

    def windup(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.03, -0.02)),
            hips=t("hips", (Z, -20)),
            spine=t("spine", (X, -8)),
            chest=t("chest", (X, -16)),
            head=t("head", (X, -6)),
            upperarm__R=t("upperarm.R", (X, -120), (Y, -20)),
            forearm__R=t("forearm.R", (X, -40)),
            thigh__L=t("thigh.L", (X, -30), (Y, -6)),
            shin__L=t("shin.L", (X, 30)),
            thigh__R=t("thigh.R", (X, 12), (Y, 8)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -30)),
        )

    def strike(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.07, -0.06)),
            hips=t("hips", (Z, 6)),
            spine=t("spine", (X, 30)),
            chest=t("chest", (X, 6)),
            neck=t("neck", (X, -10)),
            head=t("head", (X, -10)),
            upperarm__R=t("upperarm.R", (X, -60), (Y, 20)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -76), (Y, -6)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -30)),
        )

    def call(self, base, rise=0.006):
        """No goblin script has a cast, so this is the pose of biped-medium."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, rise)),
            chest=t("chest", (X, -10)),
            head=t("head", (X, -18)),
            upperarm__R=t("upperarm.R", (X, -160), (Y, -8)),
            forearm__R=t("forearm.R", (X, -10)),
            upperarm__L=t("upperarm.L", (Y, -20)),
        )

    def recoil(self, base, amount=1.0):
        """The hit pushes the upper body back."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -18 * amount)),
            upperarm__R=t("upperarm.R", (X, 14 * amount), (Y, 10 * amount)),
        )

    def stagger(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.03)),
            spine=t("spine", (X, 22)),
            head=t("head", (X, 22)),
            upperarm__L=t("upperarm.L", (X, 16), (Y, 30)),
            upperarm__R=t("upperarm.R", (X, 16), (Y, -24)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -10)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -20)),
        )

    def fallen(self, base, bounce=0.0):
        """Flat on the ground. `fall` gives the side."""
        t = self.t
        return self.pose(
            {**base, **self.fall_keys(bounce)},
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, 4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (X, 10)),
            head=t("head", (X, 20), (Z, 30)),
            upperarm__L=t("upperarm.L", (Y, 60), (X, -10)),
            upperarm__R=t("upperarm.R", (Y, -70), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -20), (Y, -10)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -30), (Y, 10)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
        )

    def crouch(self, base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.1)),
            spine=t("spine", (X, 26)),
            head=t("head", (X, 16)),
            thigh__L=t("thigh.L", (X, -60), (Y, -6)),
            shin__L=t("shin.L", (X, 100)),
            foot__L=t("foot.L", (X, -40)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
        )

    def rising(self, base):
        """The crouch, part of the way up."""
        return self.pose(self.crouch(base), hips_at_loc=self.at("hips", (0, 0.01, -0.07)))

    def heroic(self, base):
        """Up again: the end of a summon and a Rebirth."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 4), (X, -14)),
            upperarm__R=t("upperarm.R", (X, -120), (Y, 20)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -6), (Y, -6)),
            shin__L=t("shin.L", (X, 6)),
            thigh__R=t("thigh.R", (X, 4), (Y, 6)),
            shin__R=t("shin.R", (X, 6)),
            foot__R=t("foot.R", (X, -10)),
        )
