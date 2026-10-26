import type { ForgeStoneTier } from "@workspace/rules";
import {
  coinDenominations,
  GEAR_SLOTS,
  GEAR_STATS,
  gearStatValue,
  gearUpgradeCoin,
  gearUpgradeForgeStone,
  gearUpgradePathCoin,
  gearUpgradePathForgeStones,
  MAX_GEAR_LEVEL,
} from "@workspace/rules";
import { cn } from "cn";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import {
  HANDBOOK_VALUE_INK,
  HANDBOOK_WELL_SHADOW,
} from "@/features/handbook/tokens";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { GEAR_GLYPH, GEAR_GLYPH_TURN } from "@/features/hero/hero-art";
import { useStatFormat } from "@/features/hero/use-stat-format";
import { CoinPrice } from "@/features/packs/components/pack-art";
import { useCoinFormat } from "@/features/packs/use-coin-format";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-ink-soft uppercase";

const ROW = "border-t border-parchment-rule/70";

const LEVELS = Array.from({ length: MAX_GEAR_LEVEL }, (_, index) => index + 1);

/** The Forge Stone tiers with their first and last Gear level, from level 1. */
const TIER_BANDS = LEVELS.reduce<
  { readonly tier: ForgeStoneTier; readonly from: number; to: number }[]
>((bands, level) => {
  const tier = gearUpgradeForgeStone(level);
  const last = bands.at(-1);
  if (last?.tier === tier) {
    last.to = level;
  } else {
    bands.push({ tier, from: level, to: level });
  }
  return bands;
}, []);

/**
 * The Gear Entry (GDD 7.3, Economy 3.4): what each of the 4 items gives at
 * the highest level, and the Coin and the Forge Stone tier of each level
 * (ADR-0036). The numbers come from the rules, so the Entry follows a balance
 * change.
 */
export const GearGuide = () => {
  const { tr } = useGameText();
  const stat = useStatFormat();
  const { format, words } = useCoinFormat();
  return (
    <div className="space-y-4" data-testid="handbook-gear-guide">
      <table className="w-full max-w-md border-collapse text-sm">
        <caption className={cn(LABEL, "pb-1 text-left")}>
          {tr("handbook.gearItemsTable")}
        </caption>
        <thead>
          <tr className="text-ink-soft text-left text-xs">
            <th scope="col" className="pb-1 font-semibold">
              {tr("handbook.gearItemColumn")}
            </th>
            <th scope="col" className="pb-1 font-semibold">
              {tr("handbook.gearStatColumn")}
            </th>
            <th scope="col" className="pb-1 text-right font-semibold">
              {tr("handbook.gearMaxColumn", { max: MAX_GEAR_LEVEL })}
            </th>
          </tr>
        </thead>
        <tbody>
          {GEAR_SLOTS.map((slot) => (
            <tr key={slot} className={ROW}>
              <th
                scope="row"
                className="flex items-center gap-2 py-1.5 pr-3 font-semibold"
              >
                <GlyphIcon
                  glyph={GEAR_GLYPH[slot]}
                  className={cn(
                    "text-frame-wood size-4 shrink-0",
                    GEAR_GLYPH_TURN[slot]
                  )}
                />
                {tr(`hero.slots.${slot}`)}
              </th>
              <td
                className="py-1.5 pr-3 font-medium"
                style={{ color: HANDBOOK_VALUE_INK }}
              >
                {tr(`hero.stats.${GEAR_STATS[slot].stat}`)}
              </td>
              <td className="py-1.5 text-right font-black tabular-nums">
                {stat(
                  GEAR_STATS[slot].stat,
                  gearStatValue(slot, MAX_GEAR_LEVEL)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <figure
        className="border-parchment-rule bg-parchment-well max-w-md rounded-xl border-2 px-3 py-2.5"
        style={{ boxShadow: HANDBOOK_WELL_SHADOW }}
      >
        <figcaption className={cn(LABEL, "pb-1.5")}>
          {tr("handbook.gearCostTable")}
        </figcaption>
        <ol className="grid grid-cols-5 gap-x-2 gap-y-1.5 text-xs">
          {LEVELS.map((level) => {
            const tier = gearUpgradeForgeStone(level);
            return (
              <li key={level} className="flex flex-col" data-tier={tier}>
                <span className="text-ink-soft flex items-center gap-1 font-semibold">
                  <ForgeStoneIcon tier={tier} className="size-3 shrink-0" />
                  {tr("handbook.gearCostLevel", { level })}
                </span>
                <CoinPrice
                  parts={coinDenominations(gearUpgradeCoin(level))}
                  format={format}
                  tone="light"
                  className="text-ink-on-gold font-black"
                />
                <span className="sr-only">
                  {words(gearUpgradeCoin(level))},{" "}
                  {tr("handbook.gearCostStone", {
                    tier: tr(`forgeStones.tiers.${tier}`),
                  })}
                </span>
              </li>
            );
          })}
        </ol>
        <ul
          className="text-ink-soft mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold"
          data-testid="handbook-gear-stone-tiers"
        >
          {TIER_BANDS.map(({ tier, from, to }) => (
            <li key={tier} className="flex items-center gap-1">
              <ForgeStoneIcon tier={tier} className="size-3 shrink-0" />
              {tr("handbook.gearCostTier", {
                tier: tr(`forgeStones.tiers.${tier}`),
                from,
                to,
              })}
            </li>
          ))}
        </ul>
        <p className="text-ink-soft mt-2 text-xs leading-snug">
          {tr("handbook.gearCostTotal", {
            max: MAX_GEAR_LEVEL,
            coin: words(gearUpgradePathCoin(0, MAX_GEAR_LEVEL)),
            stones: gearUpgradePathForgeStones(0, MAX_GEAR_LEVEL).common,
          })}
        </p>
      </figure>
    </div>
  );
};
