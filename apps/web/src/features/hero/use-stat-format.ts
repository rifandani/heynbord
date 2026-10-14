import type { GearStat } from "@workspace/rules";
import { useMemo } from "react";

import { useGameText } from "@/features/battle/use-game-text";
import { isChance } from "@/features/hero/hero";

/**
 * A Gear stat in the current language: a chance as a percent ("0.75%", or
 * "0,75%" in id-ID) from basis points, and the Hero HP of the Armor as a bonus
 * ("+10").
 */
export const useStatFormat = () => {
  const { locale } = useGameText();
  return useMemo(() => {
    const percent = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 2,
    });
    const number = new Intl.NumberFormat(locale, { signDisplay: "always" });
    return (stat: GearStat, value: number): string =>
      isChance(stat) ? percent.format(value / 10_000) : number.format(value);
  }, [locale]);
};
