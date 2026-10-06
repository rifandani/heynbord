import type { CoinPart } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, Tooltip, TooltipTrigger } from "react-aria-components";

import { useGameText } from "@/features/battle/use-game-text";
import {
  BalanceIcon,
  DENOMINATION_TEXT,
} from "@/features/town/components/balance-icon";
import type { BalanceKind, Balances } from "@/features/town/town";
import { coinWords } from "@/features/town/town";

const ICON = "size-5 shrink-0 [@media(max-height:500px)]:size-4";

const Divider = () => (
  <span
    className="h-5 w-0.5 shrink-0 rounded-full bg-[#e9c46a]/25"
    aria-hidden
  />
);

/**
 * One balance on the plate. Hover and focus show what it pays for; on touch,
 * a tap shows it. The accessible name says the amount in words. It has no
 * action, so it has no drop and no press (DESIGN.md, Balance Plate).
 */
const Balance = ({
  kind,
  spoken,
  children,
}: {
  readonly kind: BalanceKind;
  readonly spoken: string;
  readonly children: ReactNode;
}) => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);
  const name = tr(`town.balances.${kind}.name`);
  const onPress = (event: PressEvent) => {
    if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };
  return (
    <TooltipTrigger
      isOpen={open}
      onOpenChange={setOpen}
      delay={200}
      shouldCloseOnPress={false}
    >
      <Button
        aria-label={tr("town.balances.balance", { name, amount: spoken })}
        onPress={onPress}
        className={cn(
          "flex h-10 cursor-default items-center gap-1.5 rounded-[10px] px-3 outline-none",
          "text-base leading-none font-black tabular-nums",
          "transition-colors duration-100 data-[hovered]:bg-[#fff6df]/10",
          "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          "[@media(max-height:500px)]:h-8 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-sm"
        )}
        data-testid={`balance-${kind}`}
      >
        {children}
      </Button>
      <Tooltip
        placement="bottom end"
        offset={8}
        className="max-w-56 rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1.5 text-xs text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        data-testid={`balance-tooltip-${kind}`}
      >
        <span className="block font-bold">{name}</span>
        <span className="block text-[#fff6df]/85">
          {tr(`town.balances.${kind}.use`)}
        </span>
      </Tooltip>
    </TooltipTrigger>
  );
};

/** A Coin balance: each denomination that is not zero, with its coin and letter. */
const CoinAmount = ({
  parts,
  format,
}: {
  readonly parts: readonly CoinPart[];
  readonly format: (value: number) => string;
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
          <span>
            {format(part.amount)}
            <span
              className="ml-px text-[0.875em] font-bold"
              style={{ color: DENOMINATION_TEXT[part.denomination] }}
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
 */
export const BalancePlate = ({
  balances,
  className,
}: {
  readonly balances: Balances;
  readonly className?: string;
}) => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const coin = coinDenominations(balances.coin);
  const coinSpoken = coinWords(balances.coin, format, (denomination) =>
    tr(`town.balances.denominations.${denomination}.name`)
  );

  return (
    <fieldset
      aria-label={tr("town.balances.label")}
      className={cn(
        "absolute top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-20 m-0 min-w-0 p-0",
        "flex items-center rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]",
        className
      )}
      data-testid="town-balances"
    >
      <Balance kind="coin" spoken={coinSpoken}>
        <CoinAmount parts={coin} format={format} />
      </Balance>
      <Divider />
      <Balance kind="essence" spoken={format(balances.essence)}>
        <BalanceIcon kind="essence" className={ICON} />
        {format(balances.essence)}
      </Balance>
      <Divider />
      <Balance kind="heynstones" spoken={format(balances.heynstones)}>
        <BalanceIcon kind="heynstones" className={ICON} />
        {format(balances.heynstones)}
      </Balance>
    </fieldset>
  );
};
