import { useAtomValue } from "@effect/atom-react";
import { starsFor } from "@workspace/rules";
import type { BattleResult, Side } from "@workspace/rules";
import { cn } from "cn";
import { Button } from "react-aria-components";

import type { BattleSession } from "@/features/battle/battle-session";
import { isIdle } from "@/features/battle/battle-session";
import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { GameButton } from "@/features/battle/components/game-button";
import { randomSeed } from "@/features/battle/use-battle";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { useHandbook } from "@/features/handbook/use-handbook";

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
