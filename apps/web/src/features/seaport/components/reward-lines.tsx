import type { ExpeditionReward, ForgeStoneReward } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";

import { useGameText } from "@/features/battle/use-game-text";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { useNumberFormat } from "@/features/i18n/use-number-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import type { CoinTone } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

/** The colors of the text on each surface (AA contrast). */
const TONE: Readonly<
  Record<CoinTone, { readonly text: string; readonly xp: string }>
> = {
  dark: { text: "text-[#fff6df]", xp: "text-[#9fe7f5]" },
  light: { text: "text-[#2a1d12]", xp: "text-xp-ink" },
};

/**
 * The reward of an Expedition on one line that can wrap: the Coin in its
 * denominations, the XP, the Essence and the Forge Stones, each with the
 * icon that the Balance Plate and the Hero screen show. A part that is 0
 * does not show, but a reward with no other part shows its Coin, also 0.
 * With `stonesLater`, the Forge Stone row says that it comes only when the
 * ship is back.
 */
export const RewardLines = ({
  reward,
  stones,
  stonesLater = false,
  tone = "dark",
  className,
}: {
  readonly reward: Pick<
    ExpeditionReward,
    "coin" | "xp" | "essence" | "forgeStones"
  >;
  /** The Forge Stones to show in place of those of `reward`. */
  readonly stones?: ForgeStoneReward | null;
  readonly stonesLater?: boolean;
  readonly tone?: CoinTone;
  readonly className?: string;
}) => {
  const { tr } = useGameText();
  const format = useNumberFormat();
  const colors = TONE[tone];
  const shownStones = stones === undefined ? reward.forgeStones : stones;
  const showCoin =
    reward.coin > 0 ||
    (reward.xp === 0 && reward.essence === 0 && !shownStones);
  return (
    <ul
      className={cn(
        "m-0 flex list-none flex-wrap items-center gap-x-3 gap-y-0.5 p-0 text-[13px] font-black tabular-nums [@media(max-height:500px)]:gap-x-2 [@media(max-height:500px)]:text-xs",
        colors.text,
        className
      )}
      data-testid="expedition-reward"
    >
      {showCoin ? (
        <li
          className="flex items-center"
          data-testid="reward-coin"
          data-copper={reward.coin}
        >
          <span className="sr-only">
            {coinWords(reward.coin, format, (denomination) =>
              tr(`town.balances.denominations.${denomination}.name`)
            )}
          </span>
          <span aria-hidden className="flex items-center">
            <CoinAmount
              parts={coinDenominations(reward.coin)}
              format={format}
              tone={tone}
            />
          </span>
        </li>
      ) : null}
      {reward.xp > 0 ? (
        <li className={colors.xp} data-testid="reward-xp" data-xp={reward.xp}>
          {tr("battle.xpEarned", { amount: format(reward.xp) })}
        </li>
      ) : null}
      {reward.essence > 0 ? (
        <li
          className="flex items-center gap-1"
          data-testid="reward-essence"
          data-essence={reward.essence}
        >
          <BalanceIcon kind="essence" className="size-4 shrink-0" />
          {tr("seaport.essence", { amount: format(reward.essence) })}
        </li>
      ) : null}
      {shownStones ? (
        <li
          className={cn(
            "flex items-center gap-1",
            stonesLater && "font-semibold opacity-80"
          )}
          data-testid="reward-stones"
          data-later={stonesLater || undefined}
        >
          <ForgeStoneIcon tier={shownStones.tier} className="size-4 shrink-0" />
          <span>
            {tr("battle.forgeStonesEarned", {
              count: shownStones.count,
              tier: tr(`forgeStones.tiers.${shownStones.tier}`),
            })}
            {stonesLater ? ` ${tr("seaport.stonesLater")}` : null}
          </span>
        </li>
      ) : null}
    </ul>
  );
};
