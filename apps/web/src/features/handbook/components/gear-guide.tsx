import {
  coinDenominations,
  GEAR_SLOTS,
  GEAR_STATS,
  gearStatValue,
  gearUpgradeCoin,
  gearUpgradePathCoin,
  MAX_GEAR_LEVEL,
} from "@workspace/rules";
import { cn } from "cn";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { GEAR_GLYPH, GEAR_GLYPH_TURN } from "@/features/hero/hero-art";
import { useStatFormat } from "@/features/hero/use-stat-format";
import { CoinPrice } from "@/features/packs/components/pack-art";
import { useCoinFormat } from "@/features/packs/use-coin-format";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

const ROW = "border-t border-[#c9b48c]/70";

const LEVELS = Array.from({ length: MAX_GEAR_LEVEL }, (_, index) => index + 1);

/**
 * The Gear Entry (GDD 7.3, Economy 3.4): what each of the 4 items gives at
 * the highest level, and the Coin of each level. The numbers come from the
 * rules, so the Entry follows a balance change.
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
          <tr className="text-left text-xs text-[#5b4632]">
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
                    "size-4 shrink-0 text-[#5b3a1e]",
                    GEAR_GLYPH_TURN[slot]
                  )}
                />
                {tr(`hero.slots.${slot}`)}
              </th>
              <td className="py-1.5 pr-3 font-medium text-[#3d2e1f]">
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

      <figure className="max-w-md rounded-xl border-2 border-[#c9b48c] bg-[#f1e2c2] px-3 py-2.5 shadow-[inset_0_2px_4px_rgba(91,58,30,0.18)]">
        <figcaption className={cn(LABEL, "pb-1.5")}>
          {tr("handbook.gearCostTable")}
        </figcaption>
        <ol className="grid grid-cols-5 gap-x-2 gap-y-1.5 text-xs">
          {LEVELS.map((level) => (
            <li key={level} className="flex flex-col">
              <span className="font-semibold text-[#5b4632]">
                {tr("handbook.gearCostLevel", { level })}
              </span>
              <CoinPrice
                parts={coinDenominations(gearUpgradeCoin(level))}
                format={format}
                className="font-black text-[#2a1a05]"
              />
              <span className="sr-only">{words(gearUpgradeCoin(level))}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs leading-snug text-[#5b4632]">
          {tr("handbook.gearCostTotal", {
            max: MAX_GEAR_LEVEL,
            coin: words(gearUpgradePathCoin(0, MAX_GEAR_LEVEL)),
          })}
        </p>
      </figure>
    </div>
  );
};
