import { useAtomValue } from "@effect/atom-react";
import { coinDenominations, getCard, starsFor } from "@workspace/rules";
import type { BattleResult, Side, StageRewardCard } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import { Button } from "react-aria-components";

import type { ShownRewards } from "@/features/battle/battle-rewards";
import type { BattleSession } from "@/features/battle/battle-session";
import { isIdle } from "@/features/battle/battle-session";
import {
  battleRewardsAtom,
  battleSessionAtom,
} from "@/features/battle/battle.atoms";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { randomSeed } from "@/features/battle/use-battle";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { useHandbook } from "@/features/handbook/use-handbook";
import { levelProgress } from "@/features/profile/profile";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

/** The side whose Turn starts in the current event, or `null`. */
const startingSide = (session: BattleSession | null): Side | null => {
  const event = session?.current?.event;
  return event?._tag === "TurnStarted" ? event.side : null;
};

const TurnBannerText = ({ side }: { readonly side: Side }) => {
  const { tr } = useGameText();
  return (
    <p
      className={cn(
        "fade-in zoom-in-95 animate-in font-display rounded-xl border-2 px-6 py-2 text-2xl font-black tracking-wide shadow-xl duration-200 motion-reduce:animate-none [@media(max-height:500px)]:text-lg",
        side === "player"
          ? "border-[#7a5310] bg-[#ffd75a]/95 text-[#2a1a05]"
          : "border-[#6b1610] bg-[#d9463b]/95 text-white"
      )}
    >
      {side === "player" ? tr("battle.yourTurn") : tr("battle.enemyTurn")}
    </p>
  );
};

/** "Your Turn" / "Enemy Turn" while the TurnStarted event plays. Screen readers hear it too. */
export const TurnBanner = () => {
  const session = useAtomValue(battleSessionAtom);
  const side = startingSide(session);
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[38%] z-10 flex justify-center"
      aria-live="polite"
    >
      {side ? (
        <TurnBannerText
          key={`${side}-${session?.view.turnNumber}`}
          side={side}
        />
      ) : null}
    </div>
  );
};

const ResultTitle = ({ won }: { readonly won: boolean }) => {
  const { tr } = useGameText();
  return (
    <h2
      id="battle-result-title"
      className={cn(
        "font-display text-4xl font-black [@media(max-height:500px)]:text-2xl",
        won ? "text-[#8a5a12]" : "text-[#8e1f1f]"
      )}
    >
      {won ? tr("battle.victory") : tr("battle.defeat")}
    </h2>
  );
};

const ResultStars = ({ stars }: { readonly stars: number }) => {
  const { tr } = useGameText();
  return (
    <p
      className="mt-3 text-4xl tracking-widest [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-3xl"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the Stars are a row of glyph elements; `<img>` cannot hold children, so the row is one labelled image
      role="img"
      aria-label={tr("battle.starsLabel", { count: stars })}
      data-testid="battle-stars"
      data-stars={stars}
    >
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          className={
            star <= stars
              ? "text-[#e2a93b] drop-shadow-[0_2px_0_#7a5310]"
              : "text-[#cbbfa5]"
          }
        >
          ★
        </span>
      ))}
    </p>
  );
};

/** The line that explains a result that is not a Hero at 0 HP. Routed links to its Handbook Entry (ADR-0012). */
const ResultReason = ({ result }: { readonly result: BattleResult }) => {
  const { tr } = useGameText();
  const handbook = useHandbook();
  if (result.reason === "turnLimit") {
    return <p className="mt-2 text-sm">{tr("battle.turnLimit")}</p>;
  }
  if (result.reason === "routed") {
    return (
      <p className="mt-2 text-sm">
        <Button
          onPress={() => handbook.openAt("routed")}
          className="cursor-pointer rounded-sm underline decoration-[#b4521a]/50 decoration-dotted underline-offset-2 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#b4521a]/40 data-[hovered]:decoration-solid"
          data-testid="result-routed"
        >
          {result.winner === "player"
            ? tr("battle.routedWin")
            : tr("battle.routedLoss")}
        </Button>
      </p>
    );
  }
  return null;
};

/** The Coin of the result (Economy 2.1), on a small Night Plate, as the Balance Plate shows Coin. */
const ResultCoin = ({ coin }: { readonly coin: number }) => {
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
    <p
      className="flex w-fit items-center gap-2 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-3 py-1.5 text-sm leading-none font-black text-[#fff6df] tabular-nums shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:py-1"
      data-testid="result-coin"
      data-copper={coin}
    >
      <span className="sr-only">
        {tr("battle.coinEarned", { amount: words })}
      </span>
      <span aria-hidden className="flex items-center gap-2">
        +
        <CoinAmount parts={coinDenominations(coin)} format={format} />
      </span>
    </p>
  );
};

/** The fill of the XP bar before and after the result, as CSS values. */
const xpFill = (
  shown: ShownRewards
): CSSProperties & Record<"--xp-from", number> => ({
  "--xp-from":
    shown.rewards.levelAfter > shown.rewards.levelBefore
      ? 0
      : levelProgress(shown.xp - shown.rewards.xp),
  scale: `${levelProgress(shown.xp)} 1`,
});

/**
 * The XP of the result (GDD 11.4): "+N XP", and a bar from the start of the
 * current level to the next level that fills from the XP before the result.
 * "Level up! Level N" stamps on when the Player gets a level. With reduced
 * motion, the bar shows its end at once.
 */
const ResultXp = ({ shown }: { readonly shown: ShownRewards }) => {
  const { tr, locale } = useGameText();
  const { rewards } = shown;
  const levelUp = rewards.levelAfter > rewards.levelBefore;
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { style: "percent" }),
    [locale]
  ).format(levelProgress(shown.xp));
  return (
    <div
      className="w-full max-w-56 text-left"
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

/** The card that the result gave, as a small Card Frame, with a "New" ribbon when it is not Discovered. */
const ResultCard = ({ card }: { readonly card: StageRewardCard }) => {
  const { tr } = useGameText();
  const name = tr(`cards.${card.cardId}.name`);
  const rank = tr(`ranks.${card.rank}`);
  return (
    <div
      className="flex shrink-0 flex-col items-center"
      data-testid="result-card"
      data-card={card.cardId}
      data-new={card.isNew || undefined}
    >
      <p className="sr-only">
        {card.isNew
          ? tr("battle.newCardWon", { name, rank })
          : tr("battle.cardWon", { name, rank })}
      </p>
      <span className="relative" aria-hidden>
        <CardFrame
          cardId={card.cardId}
          rank={card.rank}
          countdown={getCard(card.cardId).countdown}
          className="-rotate-2 text-[6px] motion-safe:animate-[stage-panel-deal_440ms_cubic-bezier(0.2,0.8,0.2,1)_300ms_both] [@media(max-height:500px)]:text-[4.5px]"
        />
        {card.isNew ? (
          <span
            className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-[4px] border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-1.5 py-px text-[10px] leading-tight font-black tracking-wide text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.45)] motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_740ms_both]"
            data-testid="result-card-new"
          >
            {tr("packs.reveal.new")}
          </span>
        ) : null}
      </span>
      <span
        className="mt-1 max-w-24 truncate text-xs font-bold text-[#2a1d12]"
        aria-hidden
      >
        {name}
      </span>
    </div>
  );
};

/**
 * The rewards of the result (GDD 11.4): the card won at the left, and the
 * Coin and the XP at the right. They are already in the Profile.
 */
const ResultRewards = ({ shown }: { readonly shown: ShownRewards }) => {
  const { rewards } = shown;
  return (
    <div
      className="mt-3 flex items-center justify-center gap-4 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:gap-3"
      data-testid="result-rewards"
    >
      {rewards.card ? <ResultCard card={rewards.card} /> : null}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 [@media(max-height:500px)]:gap-1.5">
        <ResultCoin coin={rewards.coin} />
        <ResultXp shown={shown} />
      </div>
    </div>
  );
};

/** The rewards of this Battle, when its result is in the Profile. */
const useShownRewards = (session: BattleSession): ShownRewards | null => {
  const shown = useAtomValue(battleRewardsAtom);
  return shown?.options === session.options ? shown : null;
};

const ResultDialog = ({
  battle,
  session,
  result,
}: {
  readonly battle: ReturnType<typeof useBattle>;
  readonly session: BattleSession;
  readonly result: BattleResult;
}) => {
  const { tr } = useGameText();
  const won = result.winner === "player";
  const stars = starsFor(session.rules);
  const shown = useShownRewards(session);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <section
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role react-doctor/prefer-html-dialog -- a native modal `<dialog>` changes Escape and top-layer behavior; the Retry button takes focus on open
        role="dialog"
        aria-modal="true"
        aria-labelledby="battle-result-title"
        className="fade-in zoom-in-95 animate-in w-[min(420px,94vw)] rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] p-5 text-center text-[#2a1d12] shadow-2xl duration-300 motion-reduce:animate-none [@media(max-height:500px)]:p-3"
        data-testid="battle-result"
      >
        <ResultTitle won={won} />
        <p className="mt-1 text-sm text-[#5b4632]">
          {tr(`stages.${session.options.stageId}.name`)}
        </p>
        {won ? <ResultStars stars={stars} /> : null}
        {shown ? <ResultRewards shown={shown} /> : null}
        <ResultReason result={result} />
        <div className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:500px)]:mt-2">
          <GameButton
            intent="gold"
            autoFocus
            onPress={() =>
              battle.start({ ...session.options, seed: randomSeed() })
            }
            data-testid="retry"
          >
            {tr("battle.retry")}
          </GameButton>
          <GameButton
            intent="wood"
            onPress={() => battle.leave()}
            data-testid="back-to-campaign"
          >
            {tr("battle.backToCampaign")}
          </GameButton>
        </div>
      </section>
    </div>
  );
};

/** Victory or defeat, the Stars (GDD 4.11), and what to do next. */
export const ResultOverlay = ({
  battle,
}: {
  readonly battle: ReturnType<typeof useBattle>;
}) => {
  const session = useAtomValue(battleSessionAtom);
  if (!session?.view.result || !isIdle(session)) {
    return null;
  }
  return (
    <ResultDialog
      battle={battle}
      session={session}
      result={session.view.result}
    />
  );
};

/** UI-03: on a phone in portrait, ask the player to turn the phone. */
export const PortraitGuard = () => {
  const { tr } = useGameText();
  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] hidden items-center justify-center bg-[#1c140e] p-8 text-center text-[#fff6df] [@media(orientation:portrait)_and_(pointer:coarse)]:flex">
      <p className="font-display max-w-xs text-xl">
        <span className="mb-4 block text-5xl" aria-hidden>
          ⟳
        </span>
        {tr("battle.rotate")}
      </p>
    </div>
  );
};
