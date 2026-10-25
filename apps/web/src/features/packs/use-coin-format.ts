import { coinDenominations } from "@workspace/rules";
import { useMemo } from "react";

import { useGameText } from "@/features/battle/use-game-text";
import { coinWords } from "@/features/town/town";

/**
 * Coin amounts in the current language: `format` for a number, `words` for a
 * screen reader ("1 Silver 50 Copper") and `short` for a button ("1s 50c").
 */
export const useCoinFormat = () => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const words = (copper: number) =>
    coinWords(copper, format, (denomination) =>
      tr(`town.balances.denominations.${denomination}.name`)
    );
  const short = (copper: number) =>
    coinDenominations(copper)
      .map(
        (part) =>
          `${format(part.amount)}${tr(`town.balances.denominations.${part.denomination}.short`)}`
      )
      .join(" ");
  return { format, words, short };
};
