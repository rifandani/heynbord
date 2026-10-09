import { useAtom, useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import { ToggleButton } from "react-aria-components";

import type { BattleSession } from "@/features/battle/battle-session";
import { isIdle } from "@/features/battle/battle-session";
import type { HandCardView } from "@/features/battle/battle-view";
import { battleSessionAtom, soundOnAtom } from "@/features/battle/battle.atoms";
import {
  GameButton,
  gameButtonStyles,
} from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { countdownLabel } from "@/features/battle/components/hand-card";
import { HeroPanel } from "@/features/battle/components/hero-panel";
import { KeyGuide } from "@/features/battle/components/key-guide";
import { LeaveBattle } from "@/features/battle/components/leave-battle";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { useHandbook } from "@/features/handbook/use-handbook";

type Battle = ReturnType<typeof useBattle>;

const TurnBadge = ({
  turnNumber,
  yourTurn,
}: {
  readonly turnNumber: number;
  readonly yourTurn: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 px-3 py-1 text-[#fff6df]">
      <span
        className="font-display text-sm font-bold tabular-nums"
        data-testid="turn-number"
      >
        {tr("battle.turn", { number: turnNumber })}
      </span>
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-xs font-semibold",
          yourTurn ? "bg-[#ffd75a] text-[#2a1a05]" : "bg-[#d9463b] text-white"
        )}
      >
        {yourTurn ? tr("battle.yourTurn") : tr("battle.enemyTurn")}
      </span>
    </div>
  );
};

/**
 * The Handbook button (issue #25), next to the Key Guide. The H key does the
 * same. The Battle does not pause while the Handbook is open.
 */
const HandbookButton = () => {
  const { tr } = useGameText();
  const handbook = useHandbook();
  return (
    <GameButton
      intent="ghost"
      size="sm"
      aria-label={tr("handbook.title")}
      onPress={() => handbook.open()}
      data-testid="handbook-button"
    >
      <GlyphIcon glyph="book" className="size-4" />
    </GameButton>
  );
};

/** Speed, Skip, sound (BAT-11), the Handbook and the Key Guide (UI-02). */
const BattleControls = ({
  battle,
  session,
}: {
  readonly battle: Battle;
  readonly session: BattleSession;
}) => {
  const { tr } = useGameText();
  const [soundOn, setSoundOn] = useAtom(soundOnAtom);
  return (
    <div className="flex items-center gap-1">
      <ToggleButton
        isSelected={battle.speed === 2}
        onChange={(selected) => battle.setSpeed(selected ? 2 : 1)}
        aria-label={`${tr("battle.speed")} ${tr("battle.speedValue", { value: battle.speed })}`}
        className={gameButtonStyles({
          intent: battle.speed === 2 ? "gold" : "ghost",
          size: "sm",
        })}
      >
        {tr("battle.speedValue", { value: battle.speed })}
      </ToggleButton>
      <GameButton
        intent="ghost"
        size="sm"
        isDisabled={isIdle(session) || battle.held}
        onPress={() => battle.skip()}
      >
        {tr("battle.skip")}
      </GameButton>
      <ToggleButton
        isSelected={soundOn}
        onChange={setSoundOn}
        aria-label={tr("battle.sound")}
        className={gameButtonStyles({ intent: "ghost", size: "sm" })}
      >
        <GlyphIcon glyph={soundOn ? "sound" : "mute"} className="size-4" />
      </ToggleButton>
      <HandbookButton />
      <KeyGuide />
    </div>
  );
};

/** The enemy's Hand: only the Countdowns show. */
const EnemyHand = ({ hand }: { readonly hand: readonly HandCardView[] }) => {
  const { tr } = useGameText();
  return (
    <ol
      aria-label={tr("battle.enemyHand")}
      className="flex gap-1"
      data-testid="enemy-hand"
    >
      {hand.map((card) => (
        <li
          key={card.instanceId}
          className={cn(
            "flex h-7 w-5 items-center justify-center rounded border text-[11px] font-bold",
            card.countdown === 0
              ? "border-[#ffd75a] bg-[#5b1f1a] text-[#ffd75a]"
              : "border-[#e8d9bb]/40 bg-[#3a2a1c] text-[#fff6df]"
          )}
          aria-label={countdownLabel(tr, card.countdown)}
        >
          {card.countdown}
        </li>
      ))}
    </ol>
  );
};

/** Heroes, the Turn number and the Battle controls (GDD 11.2, BAT-11). */
export const TopBar = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  const session = useAtomValue(battleSessionAtom);
  if (!session) {
    return null;
  }
  const { view } = session;
  const yourTurn = view.activeSide === "player";
  return (
    <header
      data-battle-hud="top"
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.5rem,env(safe-area-inset-left))]"
    >
      <div className="pointer-events-auto flex min-w-0 items-start gap-2">
        <LeaveBattle battle={battle} finished={view.result !== null} />
        <HeroPanel
          side="player"
          hero={view.sides.player.hero}
          name={tr("battle.player")}
          active={yourTurn}
        />
      </div>
      <div className="pointer-events-auto flex flex-col items-center gap-1">
        <TurnBadge turnNumber={view.turnNumber} yourTurn={yourTurn} />
        <BattleControls battle={battle} session={session} />
      </div>
      <div className="pointer-events-auto flex min-w-0 flex-col items-end gap-1">
        <HeroPanel
          side="enemy"
          hero={view.sides.enemy.hero}
          name={tr(`stages.${session.options.stageId}.enemy`)}
          active={!yourTurn}
        />
        <EnemyHand hand={view.sides.enemy.hand} />
      </div>
    </header>
  );
};
