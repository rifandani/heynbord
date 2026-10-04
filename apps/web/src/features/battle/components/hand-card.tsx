import type { RankId } from "@workspace/rules";
import { cn } from "cn";
import type { ComponentProps } from "react";

import { cardText } from "@/features/battle/card-text";
import { CardFrame } from "@/features/battle/components/card-frame";
import { useGameText } from "@/features/battle/use-game-text";

const handCardClassName = (
  ready: boolean,
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
    selected && "-translate-y-3 ring-4 ring-[#fff2a8]",
    className
  );

/**
 * A Hand Card (GDD 11.2): the Card Frame with a large Countdown, a gold glow
 * when Ready, the Rank Gems, and Attack and HP for a Creature Card.
 */
export const HandCard = ({
  cardId,
  rank,
  countdown,
  selected,
  className,
  ...props
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly countdown: number;
  readonly selected: boolean;
} & ComponentProps<"button">) => {
  const { tr, text } = useGameText();
  const ready = countdown === 0;
  const name = text(cardText(cardId, rank).name);
  return (
    <button
      type="button"
      {...props}
      aria-pressed={selected}
      aria-label={`${name}, ${tr(`ranks.${rank}`)}, ${ready ? tr("battle.ready") : tr("battle.countdown", { value: countdown })}`}
      data-ready={ready || undefined}
      data-selected={selected || undefined}
      className={handCardClassName(ready, selected, className)}
    >
      <CardFrame cardId={cardId} rank={rank} countdown={countdown} />
    </button>
  );
};
