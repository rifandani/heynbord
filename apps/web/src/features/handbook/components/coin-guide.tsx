import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";
import { useMemo } from "react";

import { useGameText } from "@/features/battle/use-game-text";
import {
  COIN_DENOM_TABLE,
  COIN_EXAMPLE_COPPER,
  COIN_USES_TABLE,
} from "@/features/handbook/handbook";
import {
  HANDBOOK_VALUE_INK,
  HANDBOOK_WELL_SHADOW,
} from "@/features/handbook/tokens";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-ink-soft uppercase";

const ROW = "border-t border-parchment-rule/70";

/** Gold, Silver and Copper: one balance, with a Town-plate example (Economy 1.1). */
export const CoinGuide = () => {
  const { tr, text, locale } = useGameText();
  const format = useMemo(() => {
    const number = new Intl.NumberFormat(locale);
    return (value: number) => number.format(value);
  }, [locale]);
  const exampleParts = useMemo(
    () => coinDenominations(COIN_EXAMPLE_COPPER),
    []
  );
  const exampleSpoken = coinWords(COIN_EXAMPLE_COPPER, format, (denomination) =>
    tr(`town.balances.denominations.${denomination}.name`)
  );

  return (
    <div className="space-y-4" data-testid="handbook-coin-guide">
      <table className="w-full max-w-md border-collapse text-sm">
        <caption className={cn(LABEL, "pb-1 text-left")}>
          {tr("handbook.coinDenomTable")}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{tr("handbook.coinDenomColumn")}</th>
            <th scope="col">{tr("handbook.coinWorthColumn")}</th>
          </tr>
        </thead>
        <tbody>
          {COIN_DENOM_TABLE.map(({ denomination, rule }) => (
            <tr key={denomination} className={ROW}>
              <th
                scope="row"
                className="flex items-center gap-2 py-1.5 pr-3 font-semibold"
              >
                <BalanceIcon
                  kind="coin"
                  denomination={denomination}
                  className="size-5 shrink-0"
                />
                {tr(`town.balances.denominations.${denomination}.name`)}
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

      <figure
        className="border-parchment-rule bg-parchment-well max-w-md rounded-xl border-2 px-3 py-2.5"
        style={{ boxShadow: HANDBOOK_WELL_SHADOW }}
        data-testid="handbook-coin-example"
      >
        <figcaption className={cn(LABEL, "pb-1.5")}>
          {tr("handbook.coinExampleCaption")}
        </figcaption>
        <CoinAmount parts={exampleParts} format={format} tone="light" />
        <p className="text-ink-soft mt-1.5 text-xs leading-snug">
          {tr("handbook.coinExampleNote", {
            copper: format(COIN_EXAMPLE_COPPER),
          })}
        </p>
        <span className="sr-only">{exampleSpoken}</span>
      </figure>

      <table className="w-full max-w-md border-collapse text-sm">
        <caption className={cn(LABEL, "pb-1 text-left")}>
          {tr("handbook.coinUsesTable")}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{tr("handbook.coinUsesColumn")}</th>
          </tr>
        </thead>
        <tbody>
          {COIN_USES_TABLE.map(({ id, rule }) => (
            <tr key={id} className={ROW}>
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
