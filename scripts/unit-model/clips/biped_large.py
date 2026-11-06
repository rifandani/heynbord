"""The base clips of biped-large: the big orcs and the trolls. See `README.md`."""

from . import base
from .base import X, Y, Z
from .biped import PASSING_WALK, biped_clips
from .overrides import Fall

NAME = "biped-large"
CLIPS = biped_clips(PASSING_WALK)


class Poses(base.Poses):
    fall = Fall(X, -84, (0, 0, 0.1))

    def stance(self, breath=0.0, sway=0.0):
        t, at = self.t, self.at
        return {
            "hips@loc": at("hips", (0, 0, -0.016 - breath * 0.004)),
            "hips": t("hips", (Z, -16), (Y, sway * 2)),
            "spine": t("spine", (Z, -2), (X, 6 + breath)),
            "chest": t("chest", (X, -2 - breath * 2)),
            "neck": t("neck", (Z, 8)),
            "head": t("head", (X, -6 + breath * 2), (Z, -6 + sway * 3)),
            "upperarm.R": t("upperarm.R", (X, -breath * 2)),
            "forearm.R": t("forearm.R", (X, -30)),
            "thigh.L": t("thigh.L", (X, -20), (Y, -8)),
            "shin.L": t("shin.L", (X, 16)),
            "foot.L": t("foot.L", (X, -2)),
            "thigh.R": t("thigh.R", (X, 14), (Y, 8)),
            "shin.R": t("shin.R", (X, 8)),
            "foot.R": t("foot.R", (X, -30)),
        }

    def slump(self, base, breath=0.0):
        """Low HP: down on one knee."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.17 - breath * 0.004)),
            spine=t("spine", (X, 30 + breath * 3)),
            chest=t("chest", (X, 8 + breath * 2)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, 0 + breath * 3), (Z, -10)),
            upperarm__L=t("upperarm.L", (X, -10), (Y, -6)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 10)),
            forearm__R=t("forearm.R", (X, -50)),
            thigh__L=t("thigh.L", (X, -76), (Y, -8)),
            shin__L=t("shin.L", (X, 80)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, 6), (Y, 8)),
            shin__R=t("shin.R", (X, 96)),
            foot__R=t("foot.R", (X, -40)),
        )

    def step(self, base, front):
        """A heavy step. `front` is 1 for the left foot, -1 for the right."""
        t, at = self.t, self.at
        lead, back = ("L", "R") if front == 1 else ("R", "L")
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, -0.018)),
            hips=t("hips", (Z, -8 * front), (Y, 5 * front)),
            spine=t("spine", (X, 14), (Y, -5 * front)),
            chest=t("chest", (Z, -5 * front)),
            upperarm__L=t("upperarm.L", (X, -24 - 24 * front), (Y, -14)),
            **{
                f"thigh__{lead}": t(f"thigh.{lead}", (X, -32), (Y, 4 * front)),
                f"shin__{lead}": t(f"shin.{lead}", (X, 6)),
                f"foot__{lead}": t(f"foot.{lead}", (X, -8)),
                f"thigh__{back}": t(f"thigh.{back}", (X, 18)),
                f"shin__{back}": t(f"shin.{back}", (X, 14)),
                f"foot__{back}": t(f"foot.{back}", (X, 14)),
            },
        )

    def passing(self, base, lifted):
        """One foot passes the other. `lifted` is the side of the foot in the air."""
        t, at = self.t, self.at
        planted = "R" if lifted == "L" else "L"
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.0)),
            spine=t("spine", (Z, -2), (X, 10)),
            **{
                f"thigh__{lifted}": t(f"thigh.{lifted}", (X, -14)),
                f"shin__{lifted}": t(f"shin.{lifted}", (X, 60)),
                f"foot__{lifted}": t(f"foot.{lifted}", (X, -10)),
                f"thigh__{planted}": t(f"thigh.{planted}", (X, 4)),
                f"shin__{planted}": t(f"shin.{planted}", (X, 4)),
                f"foot__{planted}": t(f"foot.{planted}", (X, -8)),
            },
        )

    def windup(self, base):
        """The weapon goes up over the head."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.012, -0.01)),
            hips=t("hips", (Z, -22)),
            spine=t("spine", (Z, -6), (X, -8)),
            chest=t("chest", (X, -10), (Z, -8)),
            head=t("head", (Z, 10), (X, -8)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, 20)),
            upperarm__R=t("upperarm.R", (X, -170), (Y, 16)),
            forearm__R=t("forearm.R", (X, -60)),
            hand__R=t("hand.R", (X, -30)),
            thigh__L=t("thigh.L", (X, -22), (Y, -4)),
            shin__L=t("shin.L", (X, 22)),
            thigh__R=t("thigh.R", (X, 14), (Y, 8)),
            shin__R=t("shin.R", (X, 16)),
            foot__R=t("foot.R", (X, -30)),
        )

    def strike(self, base):
        """The weapon comes down, and the weight goes onto the front foot."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, -0.08, -0.1)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, 26)),
            chest=t("chest", (X, 12), (Z, 8)),
            neck=t("neck", (X, -14)),
            head=t("head", (X, -16)),
            upperarm__L=t("upperarm.L", (X, 10), (Y, -30)),
            upperarm__R=t("upperarm.R", (X, -64), (Y, 6)),
            forearm__R=t("forearm.R", (X, -8)),
            hand__R=t("hand.R", (X, 4)),
            thigh__L=t("thigh.L", (X, -62), (Y, -8)),
            shin__L=t("shin.L", (X, 30)),
            foot__L=t("foot.L", (X, 4)),
            thigh__R=t("thigh.R", (X, 26), (Y, 8)),
            shin__R=t("shin.R", (X, 10)),
            foot__R=t("foot.R", (X, -30)),
        )

    def call(self, base, rise=0.006):
        """Both arms up. `rise` lifts the figure at the top of the cast."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, rise)),
            hips=t("hips", (Z, -8)),
            chest=t("chest", (X, -12)),
            head=t("head", (Z, 4), (X, -20)),
            upperarm__L=t("upperarm.L", (X, -70), (Y, -10)),
            forearm__L=t("forearm.L", (X, -10)),
            hand__L=t("hand.L", (X, 78)),
            upperarm__R=t("upperarm.R", (X, -150), (Y, 14)),
            forearm__R=t("forearm.R", (X, -14)),
        )

    def recoil(self, base, amount=1.0):
        """The hit pushes the upper body back."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.02 * amount, -0.012 - 0.006 * amount)),
            spine=t("spine", (X, -6 * amount)),
            chest=t("chest", (X, -10 * amount), (Z, 8 * amount)),
            head=t("head", (Z, 8), (X, -16 * amount)),
            upperarm__L=t("upperarm.L", (X, -40 * amount), (Y, -30 * amount)),
            upperarm__R=t("upperarm.R", (X, 10 * amount), (Y, 30 * amount)),
        )

    def stagger(self, base):
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.05)),
            hips=t("hips", (Z, -10)),
            spine=t("spine", (X, 20)),
            head=t("head", (X, -22)),
            upperarm__L=t("upperarm.L", (X, -30), (Y, -40)),
            upperarm__R=t("upperarm.R", (X, -30), (Y, 40)),
            thigh__L=t("thigh.L", (X, -30)),
            shin__L=t("shin.L", (X, 34)),
            foot__L=t("foot.L", (X, -14)),
            thigh__R=t("thigh.R", (X, 12)),
            shin__R=t("shin.R", (X, 30)),
            foot__R=t("foot.R", (X, -22)),
        )

    def fallen(self, base, bounce=0.0):
        """Flat on the ground. `fall` gives the side."""
        t = self.t
        return self.pose(
            {**base, **self.fall_keys(bounce)},
            hips=t("hips", (Z, 0)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -4)),
            neck=t("neck", (X, 0)),
            head=t("head", (X, -10), (Z, 30)),
            upperarm__L=t("upperarm.L", (Y, -60), (X, 10)),
            upperarm__R=t("upperarm.R", (Y, -60), (X, 10)),
            forearm__R=t("forearm.R", (X, -10)),
            thigh__L=t("thigh.L", (X, -10), (Y, -6)),
            shin__L=t("shin.L", (X, 12)),
            foot__L=t("foot.L", (X, 0)),
            thigh__R=t("thigh.R", (X, -24), (Y, 6)),
            shin__R=t("shin.R", (X, 36)),
            foot__R=t("foot.R", (X, 0)),
        )

    def crouch(self, base):
        """Low on bent knees, as a summon starts and a Rebirth gets up."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0.03, -0.14)),
            spine=t("spine", (X, 24)),
            chest=t("chest", (X, 8)),
            head=t("head", (X, -10)),
            thigh__L=t("thigh.L", (X, -70), (Y, -6)),
            shin__L=t("shin.L", (X, 96)),
            foot__L=t("foot.L", (X, -24)),
            thigh__R=t("thigh.R", (X, -50), (Y, 8)),
            shin__R=t("shin.R", (X, 106)),
            foot__R=t("foot.R", (X, -52)),
        )

    def rising(self, base):
        """The crouch, part of the way up."""
        return self.pose(self.crouch(base), hips_at_loc=self.at("hips", (0, 0.03, -0.12)))

    def heroic(self, base):
        """Up again with a roar: the end of a summon and a Rebirth."""
        t, at = self.t, self.at
        return self.pose(
            base,
            hips_at_loc=at("hips", (0, 0, 0.0)),
            hips=t("hips", (Z, -8)),
            spine=t("spine", (X, -4)),
            chest=t("chest", (X, -12)),
            head=t("head", (Z, 6), (X, -24)),
            upperarm__L=t("upperarm.L", (X, -40), (Y, -80)),
            forearm__L=t("forearm.L", (X, -30)),
            upperarm__R=t("upperarm.R", (X, -40), (Y, 80)),
            forearm__R=t("forearm.R", (X, -20)),
        )
