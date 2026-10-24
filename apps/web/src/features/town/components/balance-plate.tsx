import type { CoinPart } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";
import { useMemo } from "react";

import {
  RESOURCE_ICON_CLASS,
  ResourcePlate,
} from "@/core/components/game/resource-plate";
import type { ResourceItem } from "@/core/components/game/resource-plate";
import { useGameText } from "@/features/battle/use-game-text";
import type { CoinTone } from "@/features/town/components/balance-icon";
import {
  BalanceIcon,
  DENOMINATION_TEXT,
} from "@/features/town/components/balance-icon";
import type { BalanceKind, Balances } from "@/features/town/town";
import { coinWords } from "@/features/town/town";

const ICON = RESOURCE_ICON_CLASS;

/** A Coin balance: each denomination that is not zero, with its coin and letter. */
export const CoinAmount = ({
  parts,
  format,
  tone = "dark",
}: {
  readonly parts: readonly CoinPart[];
  readonly format: (value: number) => string;
  /** The surface under the letters: a dark plate, or a light one (parchment). */
  readonly tone?: CoinTone;
}) => {
  const { tr } = useGameText();
  return (
    <span className="flex items-center gap-2 [@media(max-height:500px)]:gap-1.5">
      {parts.map((part) => (
        <span key={part.denomination} className="flex items-center gap-1">
          <BalanceIcon
            kind="coin"
            denomination={part.denomination}
            className={ICON}
          />
          {/* The trim centers the coin on the number, not on the letter. */}
          <span className="[text-box:trim-both_cap_alphabetic]">
            {format(part.amount)}
            <span
              className="ml-px text-[0.875em] font-bold"
              style={{ color: DENOMINATION_TEXT[tone][part.denomination] }}
            >
              {tr(`town.balances.denominations.${part.denomination}.short`)}
            </span>
          </span>
        </span>
      ))}
    </span>
  );
};

/**
 * The Balance Plate (GDD 11.4): the Coin, Essence and Heynstone balances of
 * the Player, in the top-right corner of the Town. It shows information only.
 * The shopkeeper bubble of the Packs screen hangs under it (`data-shop-avoid`).
 * A balance in `bumps` plays one short bump each time its count goes up, for
 * example after a Collect at the Seaport; with reduced motion, it does not.
 *
 * The plate itself is the design-system `ResourcePlate`; this adapter maps the
 * game resources and their text onto it.
 */
export const BalancePlate = ({
  balances,
  bumps,
  className,
}: {
  readonly balances: Balances;
  readonly bumps?: Readonly<Partial<Record<BalanceKind, number>>>;
  readonly className?: string;
}) => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const coin = coinDenominations(balances.coin);
  const coinSpoken = coinWords(balances.coin, format, (denomination) =>
    tr(`town.balances.denominations.${denomination}.name`)
  );

  const resource = (
    kind: BalanceKind,
    spoken: string,
    icon: ResourceItem["icon"] | undefined,
    content: ResourceItem["value"]
  ): ResourceItem => {
    const name = tr(`town.balances.${kind}.name`);
    return {
      id: kind,
      name,
      use: tr(`town.balances.${kind}.use`),
      icon,
      value: content,
      spoken: tr("town.balances.balance", { name, amount: spoken }),
      bump: bumps?.[kind],
      testId: `balance-${kind}`,
      tooltipTestId: `balance-tooltip-${kind}`,
    };
  };

  return (
    <ResourcePlate
      label={tr("town.balances.label")}
      className={className}
      testId="town-balances"
      items={[
        resource(
          "coin",
          coinSpoken,
          undefined,
          <CoinAmount parts={coin} format={format} />
        ),
        resource(
          "essence",
          format(balances.essence),
          <BalanceIcon kind="essence" className={ICON} />,
          format(balances.essence)
        ),
        resource(
          "heynstones",
          format(balances.heynstones),
          <BalanceIcon kind="heynstones" className={ICON} />,
          format(balances.heynstones)
        ),
      ]}
    />
  );
};
