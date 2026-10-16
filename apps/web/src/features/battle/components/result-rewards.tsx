import { coinDenominations, getCard } from "@workspace/rules";
import type {
  ForgeStoneReward,
  StageRewardCard,
  StageRewards,
} from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useMemo, useRef } from "react";
import { Button } from "react-aria-components";

import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import {
  PEEK_BUTTON,
  useRewardPeek,
} from "@/features/campaign/components/reward-peek";
import type { Peek } from "@/features/deck/components/use-card-peek";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { levelProgress } from "@/features/profile/profile";
import type { SweepKind } from "@/features/sweep/sweep";
import { TICKET_GLYPH } from "@/features/sweep/sweep";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

/** The small Night Plate of a reward balance, as the Balance Plate shows Coin. */
const REWARD_PLATE =
  "flex w-fit items-center gap-2 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-3 py-1.5 text-sm leading-none font-black text-[#fff6df] tabular-nums shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:py-1";

/** The Coin of a result (Economy 2.1), on a small Night Plate, as the Balance Plate shows Coin. */
export const ResultCoin = ({ coin }: { readonly coin: number }) => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  if (coin === 0) {
    return null;
  }
  const words = coinWords(coin, format, (denomination) =>
    tr(`town.balances.denominations.${denomination}.name`)
  );
  return (
    <p className={REWARD_PLATE} data-testid="result-coin" data-copper={coin}>
      <span className="sr-only">
        {tr("battle.coinEarned", { amount: words })}
      </span>
      <span aria-hidden className="flex items-center gap-1">
        +
        <CoinAmount parts={coinDenominations(coin)} format={format} />
      </span>
    </p>
  );
};

/**
 * The Sweep Tickets that a win gave (GDD 4.12), on the same Night Plate as
 * the Coin: the Ticket in Ready Gold and its type, for example "Campaign Sweep
 * Tickets +2". A Stage win gives Campaign Sweep Tickets (ADR-0035) and a
 * Dungeon win gives Dungeon Sweep Tickets (ADR-0041). A loss gives none, so
 * it shows nothing.
 */
export const ResultTickets = ({
  kind,
  tickets,
}: {
  readonly kind: SweepKind;
  readonly tickets: number;
}) => {
  const { tr } = useGameText();
  if (tickets === 0) {
    return null;
  }
  return (
    <p
      className={REWARD_PLATE}
      data-testid="result-sweep-tickets"
      data-kind={kind}
      data-tickets={tickets}
    >
      <span className="sr-only">
        {tr(`sweep.${kind}.earnedLabel`, { count: tickets })}
      </span>
      <span aria-hidden className="flex items-center gap-1.5">
        <GlyphIcon
          glyph={TICKET_GLYPH[kind]}
          className="size-4.5 -rotate-8 text-[#ffd75a]"
        />
        {tr(`sweep.${kind}.earned`, { count: tickets })}
      </span>
    </p>
  );
};

/**
 * The Essence of a result: Dungeon 3 gives Essence in place of XP (Economy
 * 2.4), on the same Night Plate as the Coin. No Essence shows nothing.
 */
export const ResultEssence = ({ essence }: { readonly essence: number }) => {
  const { tr } = useGameText();
  if (essence === 0) {
    return null;
  }
  return (
    <p
      className={REWARD_PLATE}
      data-testid="result-essence"
      data-essence={essence}
    >
      <span className="sr-only">
        {tr("battle.essenceEarnedLabel", { amount: essence })}
      </span>
      <span aria-hidden className="flex items-center gap-1.5">
        <BalanceIcon kind="essence" className="size-4.5" />
        {tr("battle.essenceEarned", { amount: essence })}
      </span>
    </p>
  );
};

/**
 * The Heynstones of a result: only a Heynspire Boss Floor win gives them
 * (Economy 2.3), on the same Night Plate as the Coin. None shows nothing.
 */
export const ResultHeynstones = ({
  heynstones,
}: {
  readonly heynstones: number;
}) => {
  const { tr } = useGameText();
  if (heynstones === 0) {
    return null;
  }
  return (
    <p
      className={REWARD_PLATE}
      data-testid="result-heynstones"
      data-heynstones={heynstones}
    >
      <span className="sr-only">
        {tr("battle.heynstonesEarnedLabel", { amount: heynstones })}
      </span>
      <span aria-hidden className="flex items-center gap-1.5">
        <BalanceIcon kind="heynstones" className="size-4.5" />
        {tr("battle.heynstonesEarned", { amount: heynstones })}
      </span>
    </p>
  );
};

/**
 * The Achievements that a result completed (Achievements 4), under the
 * rewards: its Feats, and the Profile goals and Tally goals that its rewards
 * met. Each shows on the same Night Plate as the Coin, with the banner of the
 * Hall of banners. No Achievement shows nothing.
 */
export const ResultAchievements = ({
  ids,
}: {
  readonly ids: readonly string[];
}) => {
  const { tr } = useGameText();
  if (ids.length === 0) {
    return null;
  }
  return (
    <ul
      className="mt-2 flex flex-col gap-1.5 [@media(max-height:500px)]:mt-1.5 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:flex-wrap"
      aria-label={tr("achievements.result.label")}
      data-testid="result-achievements"
    >
      {ids.map((id) => {
        const name = tr(`achievements.${id}.name`);
        return (
          <li
            key={id}
            className={cn(
              REWARD_PLATE,
              "gap-2.5 motion-safe:animate-[result-level-up_420ms_cubic-bezier(0.2,0.8,0.2,1)_1250ms_both] [@media(min-height:501px)]:w-full"
            )}
            data-testid="result-achievement"
            data-achievement={id}
          >
            <GlyphIcon
              glyph="banner"
              className="size-5 shrink-0 text-[#ffd75a]"
            />
            <span className="sr-only">
              {tr("achievements.notice.one", { name })}
            </span>
            <span
              aria-hidden
              className="flex min-w-0 flex-col items-start gap-0.5 text-left"
            >
              <span className="text-[10px] tracking-wide text-[#e9c46a] uppercase">
                {tr("achievements.result.completed")}
              </span>
              <span className="truncate">{name}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
};

/** One Forge Stone tier of a result, on its Night Plate. */
const ForgeStonePlate = ({ stones }: { readonly stones: ForgeStoneReward }) => {
  const { tr } = useGameText();
  if (stones.count === 0) {
    return null;
  }
  const tier = tr(`forgeStones.tiers.${stones.tier}`);
  return (
    <p
      className={REWARD_PLATE}
      data-testid="result-forge-stones"
      data-tier={stones.tier}
      data-count={stones.count}
    >
      <span className="sr-only">
        {tr("battle.forgeStonesEarnedLabel", { count: stones.count, tier })}
      </span>
      <span aria-hidden className="flex items-center gap-1.5">
        <ForgeStoneIcon
          tier={stones.tier}
          className="size-4.5 drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]"
        />
        {tr("battle.forgeStonesEarned", { count: stones.count, tier })}
      </span>
    </p>
  );
};

/**
 * The Forge Stones of a result (ADR-0038), on the same Night Plate as the
 * Coin: the stone in its tier color and "+1 Common Forge Stone". A Stage
 * gives 0 or 1 tier, and a Dungeon 0 to 2 tiers (ADR-0039): one plate for
 * each tier. No Forge Stone shows nothing.
 */
export const ResultForgeStones = ({
  stones,
}: {
  readonly stones: ForgeStoneReward | readonly ForgeStoneReward[] | null;
}) => {
  if (stones === null) {
    return null;
  }
  const list: readonly ForgeStoneReward[] =
    "tier" in stones ? [stones] : stones;
  return (
    <>
      {list.map((reward) => (
        <ForgeStonePlate key={reward.tier} stones={reward} />
      ))}
    </>
  );
};

/** The XP of a result: the XP that it gave, and the Player levels before and after it. */
export interface XpReward {
  readonly rewards: Pick<StageRewards, "xp" | "levelBefore" | "levelAfter">;
  /** The Profile XP after the result. */
  readonly xp: number;
}

/** The fill of the XP bar before and after the result, as CSS values. */
const xpFill = (
  shown: XpReward
): CSSProperties & Record<"--xp-from", number> => ({
  "--xp-from":
    shown.rewards.levelAfter > shown.rewards.levelBefore
      ? 0
      : levelProgress(shown.xp - shown.rewards.xp),
  scale: `${levelProgress(shown.xp)} 1`,
});

/**
 * The XP of a result (GDD 11.4): "+N XP", and a bar from the start of the
 * current level to the next level that fills from the XP before the result.
 * "Level up! Level N" stamps on when the Player gets a level. With reduced
 * motion, the bar shows its end at once.
 */
export const ResultXp = ({
  shown,
  className,
}: {
  readonly shown: XpReward;
  readonly className?: string;
}) => {
  const { tr, locale } = useGameText();
  const { rewards } = shown;
  const levelUp = rewards.levelAfter > rewards.levelBefore;
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { style: "percent" }),
    [locale]
  ).format(levelProgress(shown.xp));
  return (
    <div
      className={cn("w-full max-w-56 text-left", className)}
      data-testid="result-xp"
      data-xp={rewards.xp}
      data-level={rewards.levelAfter}
    >
      <p className="sr-only">
        {tr("battle.xpEarnedLabel", { amount: rewards.xp })}{" "}
        {tr("battle.xpBar", {
          level: rewards.levelAfter,
          percent,
          next: rewards.levelAfter + 1,
        })}
      </p>
      <div
        className="flex items-baseline justify-between gap-2 text-xs font-bold text-[#5b4632]"
        aria-hidden
      >
        <span>{tr("battle.levelShort", { level: rewards.levelAfter })}</span>
        <span className="font-black text-[#0e6f86] tabular-nums">
          {tr("battle.xpEarned", { amount: rewards.xp })}
        </span>
      </div>
      <span
        className="mt-1 block h-2.5 overflow-hidden rounded-full border border-[#5b3a1e]/60 bg-[#3a2a1c] shadow-[inset_0_2px_3px_rgba(0,0,0,0.6)] [@media(max-height:500px)]:h-2"
        aria-hidden
      >
        <span
          className="block h-full origin-left rounded-full bg-gradient-to-b from-[#7fe0f0] to-[#0e8aa6] motion-safe:animate-[result-xp-fill_900ms_cubic-bezier(0.2,0.8,0.2,1)_350ms_both]"
          style={xpFill(shown)}
          data-testid="result-xp-fill"
        />
      </span>
      {levelUp ? (
        <p
          className="font-display mt-1.5 w-fit rounded-[4px] border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-2 py-0.5 text-sm leading-tight font-black text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.35)] motion-safe:animate-[result-level-up_420ms_cubic-bezier(0.2,0.8,0.2,1)_1250ms_both] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-xs"
          data-testid="result-level-up"
        >
          {tr("battle.levelUp", { level: rewards.levelAfter })}
        </p>
      ) : null}
    </div>
  );
};

/** The gold "New" chip of the Reveal, stamped on at the top of a card. */
export const NewChip = ({
  className,
  style,
}: {
  readonly className?: string;
  /** For example a later stamp: `animationDelay`. */
  readonly style?: CSSProperties;
}) => {
  const { tr } = useGameText();
  return (
    <span
      style={style}
      className={cn(
        "absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-[4px] border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-1.5 py-px text-[10px] leading-tight font-black tracking-wide text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.45)] motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_740ms_both]",
        className
      )}
      data-testid="result-card-new"
    >
      {tr("packs.reveal.new")}
    </span>
  );
};

/**
 * The card that a result gave, as a small Card Frame, with a "New" ribbon when
 * it is not Discovered. Hover, keyboard focus or a long press shows its Card
 * Details at the left of the result, out of the dialog.
 */
export const ResultCard = ({ card }: { readonly card: StageRewardCard }) => {
  const { tr } = useGameText();
  const { bind, details } = useRewardPeek({
    placement: "left",
    testId: "result-card-peek",
    // Out past the frame of the dialog: the card is inside the reward well.
    offset: 66,
  });
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = { cardId: card.cardId, rank: card.rank, from: "result" };
  const name = tr(`cards.${card.cardId}.name`);
  const rank = tr(`ranks.${card.rank}`);
  return (
    <div
      className="flex shrink-0 flex-col items-center"
      data-testid="result-card"
      data-card={card.cardId}
      data-new={card.isNew || undefined}
    >
      <Button
        ref={trigger}
        {...bind(target)}
        aria-label={
          card.isNew
            ? tr("battle.newCardWon", { name, rank })
            : tr("battle.cardWon", { name, rank })
        }
        className={cn(
          "relative -rotate-2 text-[6px] motion-safe:animate-[stage-panel-deal_440ms_cubic-bezier(0.2,0.8,0.2,1)_300ms_both] [@media(max-height:500px)]:text-[4.5px]",
          PEEK_BUTTON
        )}
        data-testid="result-card-frame"
      >
        <CardFrame
          cardId={card.cardId}
          rank={card.rank}
          countdown={getCard(card.cardId).countdown}
        />
        {card.isNew ? <NewChip /> : null}
      </Button>
      {details(target, trigger)}
      <span
        className="mt-1 max-w-24 truncate text-xs font-bold text-[#2a1d12]"
        aria-hidden
      >
        {name}
      </span>
    </div>
  );
};
