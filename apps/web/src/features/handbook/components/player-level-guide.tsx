import { countdownLimit, deckSizeLimits, playerHeroHp } from "@workspace/rules";
import { cn } from "cn";
import { useMemo } from "react";

import { useGameText } from "@/features/battle/use-game-text";
import {
  PLAYER_LEVEL_STAT_SAMPLES,
  PLAYER_LEVEL_UNLOCK_TABLE,
  PLAYER_LEVEL_XP_TABLE,
} from "@/features/handbook/handbook";
import { HANDBOOK_VALUE_INK } from "@/features/handbook/tokens";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-ink-soft uppercase";

const ROW = "border-t border-parchment-rule/70";

/** XP, growth samples and unlocks for the Player level Entry (GDD 7.1, Economy 2.1). */
export const PlayerLevelGuide = () => {
  const { tr, text, locale } = useGameText();
  const format = useMemo(() => {
    const number = new Intl.NumberFormat(locale);
    return (value: number) => number.format(value);
  }, [locale]);

  const statRows = useMemo(
    () =>
      PLAYER_LEVEL_STAT_SAMPLES.map((level) => {
        const deck = deckSizeLimits(level);
        return {
          level,
          heroHp: playerHeroHp(level),
          deckMax: deck.max,
          countdown: countdownLimit(level),
        };
      }),
    []
  );

  return (
    <div className="space-y-4" data-testid="handbook-player-level-guide">
      <table className="w-full max-w-lg table-fixed border-collapse text-sm">
        <caption className={cn(LABEL, "pb-1 text-left")}>
          {tr("handbook.playerXpTable")}
        </caption>
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[22%]" />
          <col className="w-[24%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead>
          <tr className="border-parchment-rule/70 text-ink-soft border-b text-[0.6875rem] font-bold tracking-[0.04em] uppercase">
            <th scope="col" className="py-1 pr-2 text-left font-bold">
              {tr("handbook.playerXpRegionColumn")}
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-bold">
              {tr("handbook.playerXpWinColumn")}
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-bold">
              {tr("handbook.playerXpFirstColumn")}
            </th>
            <th scope="col" className="py-1 text-right font-bold">
              {tr("handbook.playerXpLossColumn")}
            </th>
          </tr>
        </thead>
        <tbody>
          {PLAYER_LEVEL_XP_TABLE.map(
            ({ region, repeatWin, firstWin, loss }) => (
              <tr key={region} className={ROW}>
                <th scope="row" className="py-1.5 pr-3 text-left font-semibold">
                  {tr(`campaign.regions.${region}`)}
                </th>
                <td
                  className="py-1.5 pr-2 text-right font-medium tabular-nums"
                  style={{ color: HANDBOOK_VALUE_INK }}
                >
                  {format(repeatWin)}
                </td>
                <td
                  className="py-1.5 pr-2 text-right font-medium tabular-nums"
                  style={{ color: HANDBOOK_VALUE_INK }}
                >
                  {format(firstWin)}
                </td>
                <td
                  className="py-1.5 text-right font-medium tabular-nums"
                  style={{ color: HANDBOOK_VALUE_INK }}
                >
                  {format(loss)}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      <p className="text-ink-soft max-w-lg text-xs leading-snug">
        {tr("handbook.playerXpNote")}
      </p>

      <table className="w-full max-w-lg table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[22%]" />
          <col className="w-[22%]" />
          <col className="w-[38%]" />
        </colgroup>
        <thead>
          <tr className="border-parchment-rule/70 text-ink-soft border-b text-[0.6875rem] font-bold tracking-[0.04em] uppercase">
            <th scope="col" className="py-1 pr-2 text-left font-bold">
              {tr("handbook.playerGrowthLevelColumn")}
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-bold">
              {tr("handbook.playerGrowthHeroColumn")}
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-bold">
              {tr("handbook.playerGrowthDeckColumn")}
            </th>
            <th scope="col" className="py-1 text-right font-bold">
              {tr("handbook.playerGrowthCountdownColumn")}
            </th>
          </tr>
        </thead>
        <tbody>
          {statRows.map(({ level, heroHp, deckMax, countdown }) => (
            <tr key={level} className={ROW}>
              <th
                scope="row"
                className="py-1.5 pr-2 text-left font-semibold tabular-nums"
              >
                {format(level)}
              </th>
              <td
                className="py-1.5 pr-2 text-right font-medium tabular-nums"
                style={{ color: HANDBOOK_VALUE_INK }}
              >
                {format(heroHp)}
              </td>
              <td
                className="py-1.5 pr-2 text-right font-medium tabular-nums"
                style={{ color: HANDBOOK_VALUE_INK }}
              >
                {format(deckMax)}
              </td>
              <td
                className="py-1.5 text-right font-medium tabular-nums"
                style={{ color: HANDBOOK_VALUE_INK }}
              >
                {format(countdown)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-ink-soft max-w-lg text-xs leading-snug">
        {tr("handbook.playerGrowthNote")}
      </p>

      <table className="w-full max-w-lg border-collapse text-sm">
        <caption className={cn(LABEL, "pb-1 text-left")}>
          {tr("handbook.playerUnlockTable")}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{tr("handbook.playerUnlockLevelColumn")}</th>
            <th scope="col">{tr("handbook.playerUnlockWhatColumn")}</th>
          </tr>
        </thead>
        <tbody>
          {PLAYER_LEVEL_UNLOCK_TABLE.map(({ level, rule }) => (
            <tr key={level} className={ROW}>
              <th
                scope="row"
                className="w-14 py-1.5 pr-3 text-left font-semibold tabular-nums"
              >
                {format(level)}
              </th>
              <td
                className="py-1.5 leading-snug font-medium"
                style={{ color: HANDBOOK_VALUE_INK }}
              >
                {text(rule)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
