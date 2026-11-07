"""The base clips of biped-medium: the human, elf and undead figures. See `README.md`."""

from . import base
from .base import X, Y, Z
from .biped import PASSING_WALK, biped_clips
from .overrides import Fall

NAME = "biped-medium"
CLIPS = biped_clips(PASSING_WALK, death_bounce=6)


class Poses(base.Poses):
    fall = Fall(X, -86, (0, 0, 0.1))

    def stance(self, breath=0.0, sway=0.0):
        t, at = self.t, self.at
        return {
            "hips@loc": at("hips", (0, 0, -0.006 - breath * 0.004)),
            "hips": t("hips", (Z, -12)),
            "spine": t("spine", (X, 2 + breath * 0.5)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (X, 2)),
            "head": t("head", (X, 2 + breath), (Z, 6 + sway * 4)),
            "upperarm.L": t("upperarm.L", (X, -4 - breath * 2)),
            "upperarm.R": t("upperarm.R", (X, -36 - breath * 2)),
            "forearm.R": t("forearm.R", (X, -14)),
            "thigh.L": t("thigh.L", (X, -6), (Y, -3)),
            "shin.L": t("shin.L", (X, 6)),
            "foot.L": t("foot.L", (X, 2)),
            "thigh.R": t("thigh.R", (X, 4), (Y, 3)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -10)),
        }

    def slump(self, base, breath=0.0):
        """Low HP: bent over and low on the knees."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.02)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 12 + breath * 3)),
            chest=t("chest", (X, 10 + breath * 3)),
            neck=t("neck", (X, 8)),
            head=t("head", (X, 4 + breath * 4), (Y, -6)),
            upperarm__L=t("upperarm.L", (Y, 16), (X, 6)),
            forearm__L=t("forearm.L", (X, -8)),
            upperarm__R=t("upperarm.R", (X, -12), (Y, -22)),
            thigh__L=t("thigh.L", (X, -14), (Y, -4)),
            shin__L=t("shin.L", (X, 26)),
            foot__L=t("foot.L", (X, -12)),
            thigh__R=t("thigh.R", (X, -8), (Y, 4)),
            shin__R=t("shin.R", (X, 18)),
            foot__R=t("foot.R", (X, -10)),
        )

    def step(self, base, front):
        """A heel touches the ground. `front` is 1 for the left foot, -1 for the right."""
        t, at = self.t, self.at
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.012)),
            spine=t("spine", (X, 6)),
            chest=t("chest", (Z, -4 * front)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -24)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 4)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -6)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 10)),
            },
        )

    def passing(self, base, lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        t, at = self.t, self.at
        planted = "R" if lifted == "L" else "L"
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.004)),
            spine=t("spine", (X, 6)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -10)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 40)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 0)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
            },
        )

    def windup(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.02, -0.02)),
            hips=t("hips", (Z, -24)),
            spine=t("spine", (X, 8)),
            chest=t("chest", (Z, -8)),
            head=t("head", (X, -8), (Z, 14)),
            upperarm__L=t("upperarm.L", (X, -14)),
            upperarm__R=t("upperarm.R", (X, 18), (Y, -10)),
            thigh__L=t("thigh.L", (X, -20), (Y, -6)),
            shin__L=t("shin.L", (X, 16)),
            thigh__R=t("thigh.R", (X, 10), (Y, 4)),
            shin__R=t("shin.R", (X, 22)),
            foot__R=t("foot.R", (X, -30)),
        )

    def strike(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.1, -0.07)),
            hips=t("hips", (Z, -6)),
            spine=t("spine", (Z, 4), (X, 20)),
            chest=t("chest", (Z, 4), (X, 6)),
            head=t("head", (Z, 4), (X, -20)),
            upperarm__L=t("upperarm.L", (X, 30), (Y, -40)),
            upperarm__R=t("upperarm.R", (X, -50), (Y, -6)),
            forearm__R=t("forearm.R", (X, -6)),
            thigh__L=t("thigh.L", (X, 20)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 30)),
            shin__R=t("shin.R", (X, 12)),
            foot__R=t("foot.R", (X, -14)),
        )

    def call(self, base, rise=0.006):
        """One arm up. `rise` lifts the figure at the top of the cast."""
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
            hips_at_loc=at("hips", (0, 0.015 * amount, -0.005 * amount)),
            spine=t("spine", (X, -10 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (X, -14 * amount), (Z, 8 * amount)),
            upperarm__L=t("upperarm.L", (Y, -10 * amount), (X, 10 * amount)),
            upperarm__R=t("upperarm.R", (Y, 18 * amount), (X, 10 * amount)),
        )

    def stagger(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.02, -0.05)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, 22)),
            upperarm__L=t("upperarm.L", (Y, 10)),
            upperarm__R=t("upperarm.R", (Y, -14), (X, 6)),
            thigh__L=t("thigh.L", (X, -26)),
            shin__L=t("shin.L", (X, 40)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, -8)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
        )

    def fallen(self, base, bounce=0.0):
        """Flat on the ground. `fall` gives the side."""
        t, at = self.t, self.at
        return self.pose(
            {**base, **self.fall_keys(bounce)},
            hips_at_loc=at("hips", (0, 0, -0.01)),
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, 0)),
            neck=t("neck", (Z, 0)),
            head=t("head", (X, -12), (Z, -25)),
            upperarm__L=t("upperarm.L", (Y, -50), (X, 10)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (Y, 30), (X, -10)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -14), (Y, -8)),
            shin__L=t("shin.L", (X, 20)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 8)),
            shin__R=t("shin.R", (X, 40)),
            foot__R=t("foot.R", (X, 0)),
        )

    def crouch(self, base):
        """Low on both knees, as a summon starts and a Rebirth gets up."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.17)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, 22)),
            thigh__L=t("thigh.L", (X, -72), (Y, -4)),
            shin__L=t("shin.L", (X, 92)),
            foot__L=t("foot.L", (X, -20)),
            thigh__R=t("thigh.R", (X, -4), (Y, 4)),
            shin__R=t("shin.R", (X, 100)),
            foot__R=t("foot.R", (X, -50)),
        )

    def rising(self, base):
        """The crouch, part of the way up."""
        return self.pose(self.crouch(base), hips_at_loc=self.at("hips", (0, 0.03, -0.19)))

    def heroic(self, base):
        """Up again: the end of a summon and a Rebirth."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.004)),
            spine=t("spine", (X, -2)),
            chest=t("chest", (X, -10)),
            head=t("head", (Z, 8), (X, -14)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, 6)),
            upperarm__R=t("upperarm.R", (Y, -20)),
        )
