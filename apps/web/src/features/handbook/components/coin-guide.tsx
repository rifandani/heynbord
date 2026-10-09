import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";
import { useMemo } from "react";

import { useGameText } from "@/features/battle/use-game-text";
import {
  COIN_DENOM_TABLE,
  COIN_EXAMPLE_COPPER,
  COIN_USES_TABLE,
} from "@/features/handbook/handbook";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

const ROW = "border-t border-[#c9b48c]/70";

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
              <td className="py-1.5 leading-snug font-medium text-[#3d2e1f]">
                {text(rule)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <figure
        className="max-w-md rounded-xl border-2 border-[#c9b48c] bg-[#f1e2c2] px-3 py-2.5 shadow-[inset_0_2px_4px_rgba(91,58,30,0.18)]"
        data-testid="handbook-coin-example"
      >
        <figcaption className={cn(LABEL, "pb-1.5")}>
          {tr("handbook.coinExampleCaption")}
        </figcaption>
        <CoinAmount parts={exampleParts} format={format} />
        <p className="mt-1.5 text-xs leading-snug text-[#5b4632]">
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
              <td className="py-1.5 leading-snug font-medium text-[#3d2e1f]">
                {text(rule)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
