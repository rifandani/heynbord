import type { RankId } from "@workspace/rules";
import { cn } from "cn";
import type { ComponentProps } from "react";

import type { CountdownState } from "@/features/battle/battle-view";
import { cardText } from "@/features/battle/card-text";
import { CardFrame } from "@/features/battle/components/card-frame";
import { useGameText } from "@/features/battle/use-game-text";

const handCardClassName = (
  ready: boolean,
  waiting: boolean,
  selected: boolean,
  className: string | undefined
) =>
  cn(
    // The font size sets the size of the Card Frame: 90 × 126 px, and 63 × 88 px on a short screen.
    // The Hand Bar can make it smaller with `--hand-card-size`, so that the bar fits the screen.
    "group relative block shrink-0 touch-none rounded-[0.85em] text-left text-[length:var(--hand-card-size,10px)] transition-transform duration-150 outline-none select-none [@media(max-height:500px)]:text-[length:var(--hand-card-size,7px)]",
    "focus-visible:ring-4 focus-visible:ring-[#fff2a8]",
    ready
      ? "cursor-grab shadow-[0_0_18px_4px_rgba(255,210,90,0.75)] hover:-translate-y-2"
      : "cursor-help brightness-[0.82] saturate-[0.7]",
    // A Waiting Card (ADR-0021) is dimmer than a Ticking Card.
    waiting && "brightness-[0.6] saturate-[0.45]",
    selected && "-translate-y-3 ring-4 ring-[#fff2a8]",
    className
  );

/**
 * A Hand Card (GDD 11.2): the Card Frame with a large Countdown, a gold glow
 * when Ready, the Rank Gems, and Attack and HP for a Creature Card.
 */
/** The reason that a Ready card cannot be played, for its accessible name. */
const blockedLabel = (blocked: boolean, reason: string) =>
  blocked ? `. ${reason}` : "";

/** "Countdown 3, ticking" or "Countdown 4, waiting" (ADR-0021), or "Ready". */
export const countdownLabel = (
  tr: ReturnType<typeof useGameText>["tr"],
  countdown: number,
  state: CountdownState | undefined
) => {
  if (countdown === 0) {
    return tr("battle.ready");
  }
  const value = tr("battle.countdown", { value: countdown });
  return state ? `${value}, ${tr(`battle.${state}`)}` : value;
};

export const HandCard = ({
  cardId,
  rank,
  countdown,
  countdownState,
  selected,
  blocked = false,
  className,
  ...props
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly countdown: number;
  /** Ticking or Waiting (ADR-0021). Without it, the card shows no such state. */
  readonly countdownState?: CountdownState;
  readonly selected: boolean;
  /** Unique (GDD 5.4): the card is Ready, but it cannot be played now. */
  readonly blocked?: boolean;
} & ComponentProps<"button">) => {
  const { tr, text } = useGameText();
  // A blocked card shows its Ready badge, but it looks and acts like a card that is not Ready.
  const playable = countdown === 0 && !blocked;
  const name = text(cardText(cardId, rank).name);
  return (
    <button
      type="button"
      {...props}
      aria-pressed={selected}
      aria-label={`${name}, ${tr(`ranks.${rank}`)}, ${countdownLabel(tr, countdown, countdownState)}${blockedLabel(blocked, tr("battle.uniqueBlocked", { name }))}`}
      data-ready={playable || undefined}
      data-blocked={blocked || undefined}
      data-countdown-state={countdownState}
      data-selected={selected || undefined}
      className={handCardClassName(
        playable,
        countdownState === "waiting",
        selected,
        className
      )}
    >
      <CardFrame
        cardId={cardId}
        rank={rank}
        countdown={countdown}
        countdownState={countdownState}
      />
    </button>
  );
};
