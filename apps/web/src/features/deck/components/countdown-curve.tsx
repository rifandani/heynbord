import type { DeckEntry } from "@workspace/rules";
import { cn } from "cn";

import { BRONZE } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { countdownCurve } from "@/features/deck/deck";

/**
 * One card in a column: the edge of a card, seen from the side. A Creature
 * Card is the card metal; a Skill Card is the parchment of its emblem.
 */
const Slab = ({ skill }: { readonly skill: boolean }) => (
  <span
    className={cn(
      "block h-1.5 w-full shrink-0 rounded-[2px] motion-safe:animate-[deck-slab-drop_220ms_cubic-bezier(0.2,0.8,0.2,1)]",
      // A laptop screen of medium height gives the Deck list more room.
      "[@media(min-height:501px)_and_(max-height:820px)]:h-1",
      "[@media(max-height:500px)]:h-[3px]",
      skill
        ? "border border-[#7a5310] bg-[#f3e6c4]"
        : "shadow-[inset_0_1px_0_rgba(255,243,210,0.75),0_1px_0_rgba(0,0,0,0.35)]"
    )}
    style={skill ? undefined : { background: BRONZE }}
    aria-hidden
  />
);

/** One ID for each card edge in a column: the edges stack, so the Nth edge keeps its ID. */
const slabIds = (kind: "creature" | "skill", count: number) =>
  Array.from({ length: count }, (_, place) => `${kind}-${place + 1}`);

const LegendMark = ({ skill }: { readonly skill: boolean }) => (
  <span className="w-3.5">
    <Slab skill={skill} />
  </span>
);

/**
 * The Countdown curve (CRD-07): one column for each Countdown, with one card
 * edge for each card in the Deck. Creature Cards are at the bottom of a
 * column, Skill Cards on top of them.
 */
export const CountdownCurve = ({
  deck,
}: {
  readonly deck: readonly DeckEntry[];
}) => {
  const { tr } = useGameText();
  const columns = countdownCurve(deck);
  return (
    <figure>
      {/* A well cut into the page, as the groove of the volume slider. */}
      <div className="relative grid grid-cols-[auto_repeat(6,minmax(0,1fr))] items-end gap-x-2 rounded-xl border-2 border-[#c9b48c] bg-[#ead9b4] px-3 pt-2 pb-1.5 shadow-[inset_0_2px_4px_rgba(91,58,30,0.25)] [@media(max-height:500px)]:gap-x-1.5 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:pb-1">
        <span
          className="absolute top-1.5 right-2.5 z-10 flex items-center gap-3 text-xs text-[#5b4632] [@media(max-height:500px)]:top-1 [@media(max-height:500px)]:right-2 [@media(max-height:500px)]:gap-2"
          aria-hidden
        >
          <span className="flex items-center gap-1.5">
            <LegendMark skill={false} />
            {tr("deckBuilder.creature")}
          </span>
          <span className="flex items-center gap-1.5">
            <LegendMark skill />
            {tr("deckBuilder.skill")}
          </span>
        </span>
        <span aria-hidden />
        {columns.map((column) => {
          const total = column.creatures + column.skills;
          return (
            <div
              key={column.countdown}
              className="flex h-[92px] flex-col-reverse items-stretch gap-0.5 [@media(max-height:500px)]:h-[44px] [@media(max-height:500px)]:gap-px [@media(min-height:501px)_and_(max-height:820px)]:h-[72px]"
              data-testid={`curve-${column.countdown}`}
              data-count={total}
              aria-hidden
            >
              {slabIds("creature", column.creatures).map((id) => (
                <Slab key={id} skill={false} />
              ))}
              {slabIds("skill", column.skills).map((id) => (
                <Slab key={id} skill />
              ))}
              <span
                className={cn(
                  "pb-0.5 text-center text-xs leading-none font-black text-[#2a1d12] tabular-nums",
                  total === 0 && "invisible"
                )}
                aria-hidden
              >
                {total}
              </span>
            </div>
          );
        })}
        {/* The axis: an hourglass, then the Countdown under each column. */}
        <GlyphIcon
          glyph="hourglass"
          className="mt-1 size-3.5 text-[#6b5238] [@media(max-height:500px)]:size-3"
        />
        {columns.map((column) => (
          <span
            key={column.countdown}
            className="mt-1 border-t-2 border-[#c9b48c] pt-0.5 text-center text-sm leading-none font-black text-[#5b4632] tabular-nums [@media(max-height:500px)]:text-xs"
            aria-hidden
          >
            {column.countdown}
          </span>
        ))}
      </div>
      {/* The columns as text for a screen reader. */}
      <ul className="sr-only">
        {columns.map((column) => (
          <li key={column.countdown}>
            {tr("deckBuilder.curveColumn", {
              countdown: column.countdown,
              creatures: column.creatures,
              skills: column.skills,
            })}
          </li>
        ))}
      </ul>
    </figure>
  );
};
