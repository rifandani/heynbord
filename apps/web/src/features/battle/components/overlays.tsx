import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { getStage, starsFor } from "@workspace/rules";
import type { BattleResult, Side } from "@workspace/rules";
import { cn } from "cn";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GAME_SCRIM } from "@/core/components/game/game-dialog";
import { randomSeed } from "@/core/utils/random";
import { battleNameRef } from "@/features/battle/battle-content";
import type { BattleLogState } from "@/features/battle/battle-log-session";
import { atLastEntry } from "@/features/battle/battle-log-session";
import type { ShownRewards } from "@/features/battle/battle-rewards";
import type { BattleSession } from "@/features/battle/battle-session";
import { isIdle } from "@/features/battle/battle-session";
import {
  battleLogAtom,
  battleRewardsAtom,
  battleSessionAtom,
  defeatPanelAtom,
} from "@/features/battle/battle.atoms";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import {
  ResultAchievements,
  ResultQuests,
  ResultCard,
  ResultCoin,
  ResultEssence,
  ResultForgeStones,
  ResultHeynstones,
  ResultTickets,
  ResultXp,
} from "@/features/battle/components/result-rewards";
import { DEFEAT } from "@/features/battle/scene/defeat";
import {
  DEFEAT_SCRIM,
  DROP_SEAL,
  SHADOW_RESULT_WELL,
  VICTORY_SCRIM,
  VICTORY_TITLE_BURST,
} from "@/features/battle/tokens";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { StarIcon } from "@/features/campaign/components/campaign-icons";
import type { FloorResultAction } from "@/features/heynspire/heynspire";
import { floorResultActions } from "@/features/heynspire/heynspire";
import { floorPanelAtom } from "@/features/heynspire/heynspire.atoms";
import { useResultHints } from "@/features/hint/use-hints";
import { ReplayBadge } from "@/features/replay/components/replay-badge";
import { ShareReplay } from "@/features/replay/components/share-replay";

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
          ? "border-gold-deep bg-ready-gold/95 text-ink-on-gold"
          : "bg-blood-banner border-enemy-deep text-white"
      )}
    >
      {side === "player" ? tr("battle.yourTurn") : tr("battle.enemyTurn")}
    </p>
  );
};

/**
 * "Your Turn" / "Enemy Turn" while the TurnStarted event plays. Screen readers
 * hear it too. It never shows in the Battle Log: Live pauses, and the Play of
 * the Battle Log must not look like Live.
 */
export const TurnBanner = () => {
  const session = useAtomValue(battleSessionAtom);
  const logOpen = useAtomValue(battleLogAtom) !== null;
  const side = logOpen ? null : startingSide(session);
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

/**
 * "Victory" or "Defeat", and the name of the Battle. In a Live win, `stamp`
 * stamps the word onto the parchment with a ring of light, at the moment that
 * the Hero raises its sword (`scene/victory.ts`), and the rules draw out from
 * the name. In a Live loss, `ink` brings "Defeat" up out of the parchment,
 * slow, a little after the panel settles (`scene/defeat.ts`).
 */
const ResultTitle = ({
  won,
  name,
  stamp = false,
  ink = false,
}: {
  readonly won: boolean;
  readonly name: string;
  readonly stamp?: boolean;
  readonly ink?: boolean;
}) => {
  const { tr } = useGameText();
  const rule = "bg-parchment-rule h-px flex-1";
  const draw =
    stamp &&
    "motion-safe:animate-[result-rule-draw_560ms_cubic-bezier(0.16,1,0.3,1)_320ms_both]";
  return (
    <header className="relative">
      {stamp ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-[1.35rem] left-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 motion-safe:animate-[result-title-burst_900ms_cubic-bezier(0.16,1,0.3,1)_140ms_both] [@media(max-height:500px)]:top-[0.9rem] [@media(max-height:500px)]:size-32"
          style={{ backgroundImage: VICTORY_TITLE_BURST }}
        />
      ) : null}
      <h2
        id="battle-result-title"
        className={cn(
          "font-display relative text-4xl leading-tight font-black [@media(max-height:500px)]:text-2xl",
          won ? "text-victory-amber" : "text-blood-banner",
          stamp &&
            "motion-safe:animate-[result-victory-stamp_560ms_cubic-bezier(0.16,1,0.3,1)_120ms_both]",
          ink &&
            "motion-safe:animate-[result-defeat-ink_900ms_cubic-bezier(0.16,1,0.3,1)_260ms_both] motion-reduce:animate-[result-scrim-in_400ms_ease-out_260ms_both]"
        )}
      >
        {won ? tr("battle.victory") : tr("battle.defeat")}
      </h2>
      <p className="text-ink-soft relative mt-1 flex items-center gap-3 text-sm">
        <span aria-hidden className={cn(rule, "origin-right", draw)} />
        <span className="max-w-[75%] truncate">{name}</span>
        <span aria-hidden className={cn(rule, "origin-left", draw)} />
      </p>
    </header>
  );
};

const ResultStars = ({ stars }: { readonly stars: number }) => {
  const { tr } = useGameText();
  return (
    <p
      className="mt-3 flex items-center justify-center gap-1 [@media(max-height:500px)]:mt-1.5"
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- the Stars are a row of glyph elements; `<img>` cannot hold children, so the row is one labelled image
      role="img"
      aria-label={tr("battle.starsLabel", { count: stars })}
      data-testid="battle-stars"
      data-stars={stars}
    >
      {[1, 2, 3].map((star) => (
        <span
          key={star}
          className={cn(
            "block",
            star <= stars &&
              "motion-safe:animate-[hint-seal_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          )}
          style={{
            animationDelay: `${200 + star * 140}ms`,
            filter: star <= stars ? DROP_SEAL : undefined,
          }}
        >
          <StarIcon
            earned={star <= stars}
            tone="parchment"
            className={cn(
              "size-10 [@media(max-height:500px)]:size-8",
              star === 2 && "size-12 [@media(max-height:500px)]:size-9"
            )}
          />
        </span>
      ))}
    </p>
  );
};

/** The line that explains a result that is not a Hero at 0 HP. */
const ResultReason = ({ result }: { readonly result: BattleResult }) => {
  const { tr } = useGameText();
  if (result.reason === "turnLimit") {
    return (
      <p className="text-ink mt-2 text-sm text-balance">
        {tr("battle.turnLimit")}
      </p>
    );
  }
  return null;
};

/**
 * The rewards of the result (GDD 11.4): the card won at the left, and the
 * Coin, the Essence of a Dungeon 3 result or a Boss Floor win, the
 * Heynstones of a Boss Floor win, the Sweep Tickets, the Forge Stones of a
 * win and the XP at the right. They are already in the Profile. The
 * Achievements of the result show under them (`ResultAchievements`).
 */
const ResultRewards = ({ shown }: { readonly shown: ShownRewards }) => {
  const { rewards } = shown;
  return (
    <div
      className="border-parchment-rule bg-parchment-deep mt-4 flex items-center gap-4 rounded-xl border-2 px-4 py-3 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:gap-3 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-2"
      style={{ boxShadow: SHADOW_RESULT_WELL }}
      data-testid="result-rewards"
    >
      {"card" in rewards && rewards.card ? (
        <ResultCard card={rewards.card} />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3 [@media(max-height:500px)]:gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <ResultCoin coin={rewards.coin} />
          {"essence" in rewards ? (
            <ResultEssence essence={rewards.essence} />
          ) : null}
          {"heynstones" in rewards ? (
            <ResultHeynstones heynstones={rewards.heynstones} />
          ) : null}
          {"campaignSweepTickets" in rewards ? (
            <ResultTickets
              kind="campaign"
              tickets={rewards.campaignSweepTickets}
            />
          ) : (
            <ResultTickets
              kind="dungeon"
              tickets={rewards.dungeonSweepTickets}
            />
          )}
          <ResultForgeStones stones={rewards.forgeStones} />
        </div>
        <ResultXp shown={shown} className="max-w-none" />
      </div>
    </div>
  );
};

/** The rewards of this Battle, when its result is in the Profile. */
const useShownRewards = (session: BattleSession): ShownRewards | null => {
  const shown = useAtomValue(battleRewardsAtom);
  return shown?.options === session.options ? shown : null;
};

/** The exit of the result panel, in milliseconds: faster than its entrance. */
const RESULT_EXIT_MS = 200;

/**
 * The exit of the result panel: a button first lets the panel go, then
 * runs its action, so the next screen does not cut in. A second press while
 * the panel goes does nothing.
 */
const useResultExit = () => {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    },
    []
  );
  const exit = useCallback((action: () => void) => {
    if (timer.current !== null) {
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setLeaving(false);
      action();
    }, RESULT_EXIT_MS);
  }, []);
  return { leaving, exit };
};

/** The words and the test ID of each button of a Floor result. */
const FLOOR_ACTION: Readonly<
  Record<FloorResultAction, { readonly key: string; readonly testId: string }>
> = {
  nextFloor: { key: "heynspire.result.nextFloor", testId: "next-floor" },
  tryAgain: { key: "heynspire.result.tryAgain", testId: "retry" },
  backToHeynspire: {
    key: "heynspire.result.back",
    testId: "back-to-heynspire",
  },
};

/**
 * The buttons of a Floor result (GDD 11.4), gold first: "Next Floor" opens
 * the Floor Panel of the next Floor on the Heynspire screen, so the Player
 * sees the next enemy before the Battle. "Try Again" starts the same Floor.
 * After the win of Floor 50, "Back to Heynspire" is the one gold button.
 */
const FloorResultButtons = ({
  battle,
  session,
  actions,
  exit,
}: {
  readonly battle: ReturnType<typeof useBattle>;
  readonly session: BattleSession;
  readonly actions: readonly FloorResultAction[];
  readonly exit: (action: () => void) => void;
}) => {
  const { tr } = useGameText();
  const openPanel = useAtomSet(floorPanelAtom);
  const floor = session.options.floor?.number ?? 1;
  const run = (action: FloorResultAction) => {
    if (action === "tryAgain") {
      battle.start({ ...session.options, seed: randomSeed() });
      return;
    }
    openPanel(action === "nextFloor" ? floor + 1 : null);
    battle.leave();
  };
  return actions.map((action, index) => (
    <GameButton
      key={action}
      intent={index === 0 ? "gold" : "wood"}
      autoFocus={index === 0}
      className={cn(
        "py-1.5 leading-tight text-balance",
        actions.length === 1 && "col-span-2"
      )}
      onPress={() => exit(() => run(action))}
      data-testid={FLOOR_ACTION[action].testId}
    >
      {tr(FLOOR_ACTION[action].key)}
    </GameButton>
  ));
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
  const { tr, text } = useGameText();
  const won = result.winner === "player";
  // A Dungeon gives no Stars, and its result goes back to the Dungeons (GDD 8.4).
  const inDungeon = session.options.dungeon !== undefined;
  // A Floor gives no Stars, and its result goes back to Heynspire (GDD 8.2).
  const { floor } = session.options;
  const stage = inDungeon || floor ? null : getStage(session.options.stageId);
  const shown = useShownRewards(session);
  const { leaving, exit } = useResultExit();
  useResultHints(result, session.tutorial !== null);
  return (
    <div
      className={cn(
        GAME_SCRIM,
        "absolute z-40",
        // A win and a loss leave the Hero clear at the left (`scene/victory.ts`,
        // `scene/defeat.ts`): the panel stands at the right, over a scrim that
        // is dark only there. A loss fades its scrim in slower.
        "bg-transparent backdrop-blur-none sm:justify-end sm:pr-[max(1.5rem,5vw)]",
        won
          ? "motion-safe:animate-[result-scrim-in_480ms_ease-out_both]"
          : "animate-[result-scrim-in_900ms_ease-out_both]",
        leaving && "animate-[result-scrim-out_200ms_ease-in_forwards]"
      )}
      style={{ backgroundImage: won ? VICTORY_SCRIM : DEFEAT_SCRIM }}
      data-victory-result={won ? true : undefined}
      data-defeat-result={won ? undefined : true}
    >
      <section
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role react-doctor/prefer-html-dialog -- a native modal `<dialog>` changes Escape and top-layer behavior; the Retry button takes focus on open
        role="dialog"
        aria-modal="true"
        aria-labelledby="battle-result-title"
        className={cn(
          "border-frame-wood bg-parchment text-ink max-h-full w-[min(460px,94vw)] overflow-y-auto rounded-2xl border-4 px-6 pt-5 pb-3 text-center shadow-2xl [@media(max-height:500px)]:w-[min(560px,94vw)] [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-3 [@media(max-height:500px)]:pb-2",
          won
            ? "motion-safe:animate-[result-victory-rise_560ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-[result-scrim-in_200ms_ease-out_both]"
            : "motion-safe:animate-[result-defeat-settle_720ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-[result-scrim-in_400ms_ease-out_both]",
          leaving &&
            "animate-[result-exit_200ms_cubic-bezier(0.4,0,1,1)_forwards] motion-reduce:animate-[result-scrim-out_200ms_ease-in_forwards]"
        )}
        data-testid="battle-result"
      >
        <ResultTitle
          won={won}
          name={text(battleNameRef(session.options))}
          stamp={won}
          ink={!won}
        />
        <ResultReason result={result} />
        {won && stage ? (
          <ResultStars stars={starsFor(session.rules, stage)} />
        ) : null}
        {shown ? <ResultRewards shown={shown} /> : null}
        {shown ? <ResultAchievements ids={shown.achievements} /> : null}
        {shown ? <ResultQuests lines={shown.quests} /> : null}
        <div className="mt-4 grid grid-cols-2 gap-2 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:grid-cols-[1fr_1fr_auto]">
          {floor ? (
            <FloorResultButtons
              battle={battle}
              session={session}
              actions={floorResultActions(floor.number, won)}
              exit={exit}
            />
          ) : (
            <>
              <GameButton
                intent="gold"
                autoFocus
                className="py-1.5 leading-tight text-balance"
                onPress={() =>
                  exit(() =>
                    battle.start({ ...session.options, seed: randomSeed() })
                  )
                }
                data-testid="retry"
              >
                {tr("battle.retry")}
              </GameButton>
              <GameButton
                intent="wood"
                className="py-1.5 leading-tight text-balance"
                onPress={() => exit(() => battle.leave())}
                data-testid={
                  inDungeon ? "back-to-dungeons" : "back-to-campaign"
                }
              >
                {inDungeon
                  ? tr("battle.backToDungeons")
                  : tr("battle.backToCampaign")}
              </GameButton>
            </>
          )}
          {/* On a short screen, the Battle Log and Share Replay join the row of the two buttons. */}
          {battle.hasBattleLog ? (
            <div className="border-parchment-rule col-span-2 mt-1 flex flex-wrap justify-center gap-1 border-t pt-2 [@media(max-height:500px)]:col-span-1 [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:flex-nowrap [@media(max-height:500px)]:border-0 [@media(max-height:500px)]:pt-0">
              <Button
                onPress={() => battle.openLog()}
                className="data-[focus-visible]:ring-focus-cream text-ink-soft data-[hovered]:bg-parchment-deep data-[hovered]:text-ink inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors duration-100 outline-none data-[focus-visible]:ring-4 data-[pressed]:translate-y-px"
                data-testid="result-battle-log"
              >
                <GlyphIcon glyph="scroll" className="size-4" />
                {tr("battleLog.open")}
              </Button>
              <ShareReplay session={session} look="text" />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};

/**
 * The end of a Replay (web ADR-0011): Victory or Defeat with no rewards, as
 * the exporting Player saw it, then "Watch again" or "Leave" to the Town.
 */
const ReplayResultDialog = ({
  battle,
  session,
  result,
}: {
  readonly battle: ReturnType<typeof useBattle>;
  readonly session: BattleSession;
  readonly result: BattleResult;
}) => {
  const { tr, text } = useGameText();
  return (
    <div className={cn(GAME_SCRIM, "absolute z-40")}>
      <section
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role react-doctor/prefer-html-dialog -- a native modal `<dialog>` changes Escape and top-layer behavior; "Watch again" takes focus on open
        role="dialog"
        aria-modal="true"
        aria-labelledby="battle-result-title"
        className="fade-in zoom-in-95 animate-in border-frame-wood bg-parchment text-ink max-h-full w-[min(460px,94vw)] overflow-y-auto rounded-2xl border-4 px-6 pt-5 pb-4 text-center shadow-2xl duration-300 motion-reduce:animate-none [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-3 [@media(max-height:500px)]:pb-3"
        data-testid="battle-result"
        data-replay
      >
        <ReplayBadge className="mb-2 inline-block" />
        <ResultTitle
          won={result.winner === "player"}
          name={text(battleNameRef(session.options))}
        />
        <ResultReason result={result} />
        <div className="mt-4 grid grid-cols-2 gap-2 [@media(max-height:500px)]:mt-2">
          <GameButton
            intent="gold"
            autoFocus
            className="py-1.5 leading-tight text-balance"
            onPress={() => battle.watchAgain()}
            data-testid="watch-again"
          >
            {tr("replay.watchAgain")}
          </GameButton>
          <GameButton
            intent="wood"
            className="py-1.5 leading-tight text-balance"
            onPress={() => battle.leave()}
            data-testid="leave-replay-result"
          >
            {tr("replay.leave")}
          </GameButton>
        </div>
      </section>
    </div>
  );
};

/** A Replay shows its result at the last Log Entry, when no Play runs. */
const replayEnded = (log: BattleLogState | null): boolean =>
  log !== null && !log.playing && atLastEntry(log);

/** The longest wait for the panel of a loss, if the scene never asks for it (no WebGL). */
const DEFEAT_PANEL_LATEST_MS = (DEFEAT.panel + 1.2) * 1000;

/** The keys that do not open the panel of a loss early: a modifier alone. */
const MODIFIER_KEYS = new Set(["Alt", "Control", "Meta", "Shift"]);

/**
 * True while the panel of a Live loss waits for the defeat sequence
 * (`scene/defeat.ts`). The scene opens it at `DEFEAT.panel`. A key or a click
 * opens it at once, so a Player who wants to go on never waits. If the scene
 * does not run, it opens a little later by itself.
 */
const useDefeatHold = (session: BattleSession | null): boolean => {
  const opened = useAtomValue(defeatPanelAtom);
  const open = useAtomSet(defeatPanelAtom);
  const options = session?.options ?? null;
  const waiting =
    session !== null &&
    !session.watching &&
    session.view.result?.winner === "enemy" &&
    opened !== options;
  useEffect(() => {
    if (!waiting || !options) {
      return;
    }
    const openNow = () => open(options);
    const onKey = (event: KeyboardEvent) => {
      if (!MODIFIER_KEYS.has(event.key)) {
        openNow();
      }
    };
    const timer = window.setTimeout(openNow, DEFEAT_PANEL_LATEST_MS);
    window.addEventListener("pointerdown", openNow);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", openNow);
      window.removeEventListener("keydown", onKey);
    };
  }, [waiting, options, open]);
  return waiting;
};

/**
 * Victory or defeat, the Stars of a Stage (GDD 4.11), and what to do next.
 * The Battle Log opens from it, and "Back to Live" shows it again. A Replay
 * shows its own result at its last Log Entry. The panel of a loss waits for
 * the defeat sequence (`useDefeatHold`).
 */
export const ResultOverlay = ({
  battle,
}: {
  readonly battle: ReturnType<typeof useBattle>;
}) => {
  const session = useAtomValue(battleSessionAtom);
  const holding = useDefeatHold(session);
  if (session?.watching) {
    const { result } = session.rules;
    return result && replayEnded(battle.log) ? (
      <ReplayResultDialog battle={battle} session={session} result={result} />
    ) : null;
  }
  if (!session?.view.result || !isIdle(session) || battle.log || holding) {
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
