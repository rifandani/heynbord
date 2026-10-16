import type { DungeonDefinition } from "@workspace/rules";
import { DUNGEON_LANES, getCard, LANE_LENGTH } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useRef } from "react";
import { Button } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph, iconGlyph, unitIcon } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import {
  PEEK_BUTTON,
  useRewardPeek,
} from "@/features/campaign/components/reward-peek";
import type { Peek } from "@/features/deck/components/use-card-peek";
import { BossPin } from "@/features/dungeons/components/wanted-poster";
import { frontSpans } from "@/features/dungeons/dungeons";

/** The Columns of each Side's Summon Zone (GDD 4.1, ADR-0011). */
const SUMMON_ZONE = 3;

const LANES = Array.from({ length: DUNGEON_LANES }, (_, lane) => lane);
const COLUMNS = Array.from({ length: LANE_LENGTH }, (_, column) => column);

/** The grid: the player Hero, the Squares of each Lane, then the Bosses. */
const GRID: CSSProperties = {
  gridTemplateColumns: `var(--strip-hero) repeat(${LANE_LENGTH}, minmax(0, 1fr)) var(--strip-boss)`,
  gridTemplateRows: `repeat(${DUNGEON_LANES}, var(--strip-lane))`,
};

const isClosed = (dungeon: DungeonDefinition, lane: number) =>
  dungeon.closedLanes.some((closed) => closed.lane === lane);

/** The icon of a Unit at the start, from its card, as the Handbook Lane strip draws it. */
const startUnitGlyph = (cardId: string) => {
  const card = getCard(cardId);
  return iconGlyph(
    card.kind === "creature" ? unitIcon(card.keywords) : "melee"
  );
};

type StartUnitDefinition =
  DungeonDefinition["bosses"][number]["startUnits"][number];

/**
 * A Unit at the start in its Square. Hover, keyboard focus or a long press
 * shows its Card Details, as the reward card of the rail does. The Square is
 * narrower than the Lane is tall, so the token fits the smaller of the two.
 */
const StartUnit = ({
  unit,
  details,
  bind,
}: {
  readonly unit: StartUnitDefinition;
  readonly details: ReturnType<typeof useRewardPeek>["details"];
  readonly bind: ReturnType<typeof useRewardPeek>["bind"];
}) => {
  const { tr } = useGameText();
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = {
    cardId: unit.cardId,
    rank: unit.rank,
    from: "dungeons",
    place: `${unit.lane}:${unit.position}`,
  };
  return (
    <span
      className="[container-type:size] grid place-items-center"
      style={{ gridRow: unit.lane + 1, gridColumn: unit.position + 2 }}
    >
      <Button
        ref={trigger}
        {...bind(target)}
        aria-label={tr("dungeons.strip.startUnit", {
          name: tr(`cards.${unit.cardId}.name`),
          rank: tr(`ranks.${unit.rank}`),
          lane: unit.lane + 1,
        })}
        className={cn(
          PEEK_BUTTON,
          "grid size-[min(85cqh,100cqw)] place-items-center rounded-full border-2 border-[#6b1610] bg-[#d9463b] text-[#fff6df] data-[focus-visible]:ring-2"
        )}
        data-testid="strip-start-unit"
      >
        <GlyphIcon glyph={startUnitGlyph(unit.cardId)} className="size-[60%]" />
      </Button>
      {details(target, trigger)}
    </span>
  );
};

/**
 * The Front strip of the notice board (GDD 8.4): the Board of a Dungeon from
 * above, in the order that the Battle shows it (Lane 1 at the top). Your Hero
 * is the gold plate at the left. At the right, each Boss stands on a Front
 * Bracket in the enemy red across the Lanes of its Front, with the pin of its
 * poster, so the strip points to the posters by number and by shape, never
 * by color only. A Closed Lane has a hatch and a lock, and a Unit at the
 * start stands in its Square and shows its Card Details. The strip has no
 * other text: the posters and the label say it.
 *
 * `active` is the Boss whose poster has the pointer or the focus: its
 * Bracket and its Lanes light up. The pointer on a Bracket makes its Boss
 * active.
 */
export const FrontStrip = ({
  dungeon,
  active,
  onActive,
}: {
  readonly dungeon: DungeonDefinition;
  readonly active: number | null;
  readonly onActive: (boss: number | null) => void;
}) => {
  const { tr } = useGameText();
  const { bind, details } = useRewardPeek({
    placement: "top",
    testId: "strip-unit-peek",
  });
  const spans = frontSpans(dungeon);
  const activeSpan = active === null ? null : spans[active];
  return (
    <figure
      className={cn(
        "relative m-0 rounded-xl border-2 border-[#c9b48c] bg-[#f1e2c2] p-2 shadow-[inset_0_2px_6px_rgba(60,30,5,0.25)]",
        "[--strip-boss:3rem] [--strip-hero:1.75rem] [--strip-lane:1.6rem]",
        "[@media(max-height:500px)]:p-1.5 [@media(max-height:500px)]:[--strip-boss:2.25rem] [@media(max-height:500px)]:[--strip-hero:1.25rem] [@media(max-height:500px)]:[--strip-lane:0.95rem]"
      )}
      data-testid="front-strip"
    >
      <figcaption className="sr-only">{tr("dungeons.strip.label")}</figcaption>
      {/* Only the Units at the start are in the accessibility tree. */}
      <div className="grid gap-x-[3px] gap-y-1" style={GRID}>
        {/* Your Hero, behind all the Lanes. */}
        <span
          className="col-start-1 row-span-full row-start-1 mr-1 grid place-items-center rounded-lg border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#f2c14e] text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.3)]"
          data-testid="strip-player-hero"
          aria-hidden
        >
          <GlyphIcon glyph="crown" className="size-4" />
        </span>
        {LANES.map((lane) => {
          const closed = isClosed(dungeon, lane);
          const lit =
            activeSpan !== null &&
            activeSpan !== undefined &&
            lane >= activeSpan.first &&
            lane <= activeSpan.last;
          return COLUMNS.map((column) => (
            <span
              key={`${lane}:${column}`}
              className={cn(
                "rounded-[3px] transition-colors duration-200",
                column < SUMMON_ZONE
                  ? "bg-[#f3d98a]"
                  : column >= LANE_LENGTH - SUMMON_ZONE
                    ? "bg-[#e9b7a6]"
                    : "bg-[#e3cfa6]",
                lit && "bg-[#e88a7e]",
                closed &&
                  "bg-[repeating-linear-gradient(135deg,#c9b48c_0_3px,#e3cfa6_3px_7px)]"
              )}
              style={{ gridRow: lane + 1, gridColumn: column + 2 }}
              data-closed={closed || undefined}
              aria-hidden
            />
          ));
        })}
        {dungeon.closedLanes.map((closed) => (
          <span
            key={`closed-${closed.lane}`}
            className="grid place-items-center text-[#5b4632]"
            style={{
              gridRow: closed.lane + 1,
              gridColumn: `${2 + LANE_LENGTH / 2 - 1} / span 2`,
            }}
            aria-hidden
          >
            <GlyphIcon glyph="lock" className="size-3.5" />
          </span>
        ))}
        {dungeon.bosses.flatMap((boss) =>
          boss.startUnits.map((unit) => (
            <StartUnit
              key={`${boss.id}:${unit.lane}:${unit.position}`}
              unit={unit}
              details={details}
              bind={bind}
            />
          ))
        )}
        {dungeon.bosses.map((boss, index) => {
          const span = spans[index];
          if (span === undefined) {
            return null;
          }
          const lit = active === index;
          return (
            <span
              key={boss.id}
              className={cn(
                "ml-1 flex items-center justify-center gap-1 rounded-lg border-2 border-[#6b1610] bg-[radial-gradient(ellipse_at_30%_50%,#e8675c,#b8322a_75%)] text-[#fff6df] shadow-[0_2px_0_rgba(0,0,0,0.3)] transition-[transform,box-shadow] duration-200",
                "[@media(max-height:500px)]:ml-0.5 [@media(max-height:500px)]:gap-0.5",
                lit &&
                  "-translate-x-0.5 shadow-[0_0_0_3px_rgba(255,215,90,0.85),0_2px_0_rgba(0,0,0,0.3)] motion-reduce:translate-x-0"
              )}
              style={{
                gridColumn: LANE_LENGTH + 2,
                gridRow: `${span.first + 1} / ${span.last + 2}`,
              }}
              onPointerEnter={() => onActive(index)}
              onPointerLeave={() => onActive(null)}
              data-testid={`strip-bracket-${index}`}
              data-active={lit || undefined}
              data-lanes={boss.front.map((lane) => lane + 1).join(",")}
              aria-hidden
            >
              <BossPin number={index + 1} className="size-5 text-[11px]" />
              <GlyphIcon
                glyph={classGlyph(boss.classId)}
                className="size-4 [@media(max-height:500px)]:hidden"
              />
            </span>
          );
        })}
      </div>
    </figure>
  );
};
