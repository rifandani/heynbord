import type {
  DeckEntry,
  FuseChance,
  FuseGroup,
  FuseRecipe,
  RankId,
} from "@workspace/rules";
import { fuseGroup, fuseRecipe, getCard } from "@workspace/rules";
import { cn } from "cn";
import type { KeyboardEvent, RefObject } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Label, Meter, Popover } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { RankGems } from "@/core/components/game/rank-gems";
import { RACE_COLORS } from "@/core/components/game/tokens";
import { cardIllustration, hasCardArt } from "@/features/battle/card-art";
import {
  CardBack,
  EmptyCardPlace,
} from "@/features/battle/components/card-back";
import { CardDetails } from "@/features/battle/components/card-details";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph, raceGlyph } from "@/features/battle/glyphs";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";
import { NewBadge, RankBurst } from "@/features/packs/components/pack-reveal";
import { RANK_LIGHT } from "@/features/packs/tokens";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import {
  Essence,
  panelClassName,
  rowsClassName,
} from "@/features/workshop/components/panel-parts";
import {
  WORKSHOP_SLOT_DROP,
  WORKSHOP_THUMB_BACK,
  WORKSHOP_THUMB_DROP,
  WORKSHOP_WELL_DROP,
} from "@/features/workshop/tokens";
import type { FuseState } from "@/features/workshop/workshop";
import { ESSENCE_FLY_MS, fuseTimeline } from "@/features/workshop/workshop";

/** The new card of the last Fuse, and the copies that went into it. */
export interface Fusion {
  readonly cardId: string;
  readonly rank: RankId;
  readonly inputs: readonly DeckEntry[];
  /** A new number for each Fuse, so that the reveal starts again. */
  readonly serial: number;
}

/**
 * True when the face of the new card of a Fuse shows (`fuseTimeline`): then
 * the panel names it. With reduced motion, at once.
 */
const useFaceShown = (result: Fusion | null): boolean => {
  const [faced, setFaced] = useState<number | null>(null);
  useEffect(() => {
    if (!result) {
      return;
    }
    const timer = window.setTimeout(
      () => setFaced(result.serial),
      fuseTimeline(result.rank, result.inputs.length).faceAt
    );
    return () => window.clearTimeout(timer);
  }, [result]);
  return result !== null && (prefersReducedMotion() || faced === result.serial);
};

/** The slots before the first copy: the fewest that a Fuse uses. */
const FIRST_SLOTS = 2;

/** True when a group is a Race: a Creature Card group. */
const isRace = (group: FuseGroup): group is keyof typeof RACE_COLORS =>
  group in RACE_COLORS;

/** The name of a Race or a Class. */
const useGroupName = () => {
  const { tr } = useGameText();
  return (group: FuseGroup) =>
    isRace(group) ? tr(`races.${group}`) : tr(`classes.${group}`);
};

/**
 * The Card Back in the middle of the crucible: the card that is to come. It
 * glows in the light of the Rank when the Fuse is ready. After a Fuse, the
 * Essence charges it, an Epic one trembles, and it turns over to the new card
 * with the Rank burst of the Pack reveal and the "New" ribbon. With reduced
 * motion, the new card shows at once.
 */
const FusePreview = ({
  result,
  glow,
  dim,
}: {
  readonly result: Fusion | null;
  readonly glow: RankId | null;
  readonly dim: boolean;
}) => {
  const box =
    "relative isolate h-[12.6em] w-[9em] shrink-0 text-[11px] [@media(max-height:500px)]:text-[6px] [@media(min-height:860px)]:text-[13px]";
  if (result === null) {
    const light = glow === null ? null : RANK_LIGHT[glow];
    return (
      // oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the Card Back size (em)
      <div
        className={box}
        data-testid="workshop-preview"
        data-ready={glow !== null || undefined}
      >
        {light ? (
          <span
            className="absolute inset-0 rounded-[0.85em] opacity-0 motion-safe:animate-[pack-glow_1.8s_ease-in-out_infinite] motion-reduce:opacity-60"
            style={{
              boxShadow: `0 0 1em 0.35em ${light}, 0 0 2.6em 0.9em ${light}99`,
            }}
            aria-hidden
          />
        ) : null}
        <CardBack
          className={cn(
            "transition-[filter,opacity] duration-300",
            dim && "saturate-50"
          )}
        />
      </div>
    );
  }
  const instant = prefersReducedMotion();
  const timeline = fuseTimeline(result.rank, result.inputs.length);
  const light = RANK_LIGHT[result.rank];
  const face =
    "absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";
  return (
    // oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the Card Frame size (em); the text in the frame has its own size
    <div
      // A new element for each Fuse, so that the reveal plays again.
      key={result.serial}
      className={cn(box, "[perspective:60em]")}
      style={
        instant || timeline.trembleMs === 0
          ? undefined
          : {
              animation: `workshop-extract-tremble ${timeline.trembleMs}ms linear ${timeline.turnAt - timeline.trembleMs}ms both`,
            }
      }
      data-testid="workshop-preview"
      data-card={result.cardId}
      data-rank={result.rank}
    >
      {instant ? null : (
        <RankBurst rank={result.rank} delay={timeline.faceAt - 200} />
      )}
      <span
        className="relative block size-full [transform-style:preserve-3d]"
        style={
          instant
            ? { transform: "rotateY(180deg)" }
            : {
                animation: `fuse-turn ${timeline.turnMs}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${timeline.turnAt}ms both`,
              }
        }
      >
        <span className={face}>
          <CardBack />
          {/* The Essence goes into the Card Back: it charges with the Rank light. */}
          <span
            className="absolute inset-0 rounded-[0.85em] opacity-0"
            style={{
              animation: `fuse-charge ${timeline.turnAt - ESSENCE_FLY_MS}ms ease-in ${ESSENCE_FLY_MS}ms both`,
              boxShadow: `inset 0 0 1.4em 0.4em ${light}, 0 0 1.6em 0.5em ${light}aa`,
            }}
            aria-hidden
          />
        </span>
        <span className={cn(face, "[transform:rotateY(180deg)]")}>
          <CardFrame
            cardId={result.cardId}
            rank={result.rank}
            countdown={getCard(result.cardId).countdown}
          />
          <NewBadge stamp={instant ? undefined : timeline.faceAt + 260} />
        </span>
      </span>
    </div>
  );
};

/**
 * The size of a slot card: the font size sets the Card Frame size (em). 4
 * slots and their gaps must fit the column at the right of the Card Back,
 * which is narrower on a tall screen, where the Card Back is larger.
 */
const SLOT_FONT =
  "text-[6px] max-[1100px]:text-[5.4px] [@media(max-height:500px)]:text-[4.2px] [@media(min-height:860px)]:text-[5.8px]";

/**
 * One filled Fuse slot: the copy and a remove mark. A press, Delete or Backspace takes the copy out.
 */
const FilledSlot = ({
  input,
  isDisabled,
  onRemove,
  slotRef,
}: {
  readonly input: DeckEntry;
  readonly isDisabled: boolean;
  readonly onRemove: () => void;
  readonly slotRef: (element: HTMLElement | null) => void;
}) => {
  const { tr } = useGameText();
  const args = {
    name: tr(`cards.${input.cardId}.name`),
    rank: tr(`ranks.${input.rank}`),
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onRemove();
    }
  };
  return (
    <Button
      ref={slotRef}
      onPress={onRemove}
      onKeyDown={onKeyDown}
      isDisabled={isDisabled}
      aria-label={tr("workshop.fusePanel.slotLabel", args)}
      className={cn(
        "group relative block cursor-pointer rounded-[0.85em] outline-none select-none",
        "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
        "motion-safe:animate-[fuse-slot-in_260ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      )}
      data-testid="workshop-fuse-slot"
      data-card={input.cardId}
      data-rank={input.rank}
    >
      <CardFrame
        cardId={input.cardId}
        rank={input.rank}
        countdown={getCard(input.cardId).countdown}
        className="transition-[translate,filter] duration-150 group-data-[hovered]:-translate-y-[0.5em] group-data-[hovered]:brightness-90"
      />
      {/* The remove mark: always there on touch, larger on hover. It stays
          inside the gap, so the next slot never covers it. */}
      <span
        className={cn(
          "border-wood-edge bg-frame-wood text-cream group-data-[hovered]:bg-blood-banner absolute -top-[1.1em] -right-[0.6em] z-10 flex size-[3.6em] items-center justify-center rounded-full border-[0.4em] transition-[scale,background-color] duration-150 group-data-[hovered]:scale-110",
          WORKSHOP_SLOT_DROP
        )}
        aria-hidden
      >
        <svg viewBox="-10 -10 20 20" className="size-[1.6em]">
          <path
            d="M-5 -5 L5 5 M5 -5 L-5 5"
            stroke="currentColor"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
        </svg>
      </span>
    </Button>
  );
};

/**
 * The copies of the last Fuse after the press: each one leaves its slot one
 * after the other and goes into the Card Back. Their places are read from the
 * screen and written to them before the paint, so they never show in the
 * wrong place. With reduced motion, they do not show.
 */
const GatherGhosts = ({
  result,
  slots,
  preview,
  panel,
}: {
  readonly result: Fusion;
  readonly slots: RefObject<(HTMLElement | null)[]>;
  readonly preview: RefObject<HTMLElement | null>;
  readonly panel: RefObject<HTMLElement | null>;
}) => {
  const ghosts = useRef<(HTMLElement | null)[]>([]);
  useLayoutEffect(() => {
    const origin = panel.current?.getBoundingClientRect();
    const target = preview.current?.getBoundingClientRect();
    if (!origin || !target || prefersReducedMotion()) {
      return;
    }
    const { gatherAt, gatherMs } = fuseTimeline(
      result.rank,
      result.inputs.length
    );
    const center = {
      x: target.left + target.width / 2,
      y: target.top + target.height / 2,
    };
    // All the reads first, then all the writes: one layout.
    const boxes = ghosts.current.map(
      (_, index) => slots.current[index]?.getBoundingClientRect() ?? null
    );
    for (const [index, ghost] of ghosts.current.entries()) {
      const box = boxes[index];
      if (ghost && box) {
        ghost.style.cssText = [
          `left: ${box.left - origin.left}px`,
          `top: ${box.top - origin.top}px`,
          `--gx: ${center.x - (box.left + box.width / 2)}px`,
          `--gy: ${center.y - (box.top + box.height / 2)}px`,
          `animation: fuse-gather ${gatherMs}ms cubic-bezier(0.5, 0, 0.75, 0) ${gatherAt[index] ?? 0}ms both`,
          `filter: drop-shadow(0 0 0.8em ${RANK_LIGHT[result.inputs[index]?.rank ?? "common"]})`,
          "visibility: visible",
        ].join("; ");
      }
    }
  }, [result, slots, preview, panel]);
  return (
    <span
      className="pointer-events-none absolute inset-0 z-20 motion-reduce:hidden"
      aria-hidden
      data-testid="workshop-fuse-ghosts"
    >
      {result.inputs.map((input, index) => (
        <span
          // oxlint-disable-next-line react/no-array-index-key -- the slots have no other key; two slots can hold the same card
          key={`${result.serial}-${index}`}
          ref={(element) => {
            ghosts.current[index] = element;
          }}
          className={cn("invisible absolute", SLOT_FONT)}
        >
          <CardFrame
            cardId={input.cardId}
            rank={input.rank}
            countdown={getCard(input.cardId).countdown}
          />
        </span>
      ))}
    </span>
  );
};

/** A card that the Fuse can give: its art and its name. Hover, focus or a long press shows its Card Details. */
const PoolCard = ({
  cardId,
  bind,
  shown,
  onHide,
}: {
  readonly cardId: string;
  readonly bind: (target: Peek) => object;
  readonly shown: boolean;
  readonly onHide: () => void;
}) => {
  const { tr } = useGameText();
  const trigger = useRef<HTMLButtonElement>(null);
  const card = getCard(cardId);
  const target: Peek = {
    cardId,
    rank: card.baseRank,
    from: "workshop",
    place: "pool",
  };
  const name = tr(`cards.${cardId}.name`);
  return (
    <li className="min-w-0">
      <Button
        ref={trigger}
        {...bind(target)}
        aria-label={name}
        className="data-[focus-visible]:ring-focus-cream data-[hovered]:bg-cream/8 flex w-full min-w-0 cursor-default items-center gap-1.5 rounded-md p-0.5 text-left outline-none data-[focus-visible]:ring-2 [@media(max-height:500px)]:w-auto [@media(max-height:500px)]:p-0"
        data-testid="workshop-fuse-pool-card"
        data-card={cardId}
      >
        <span
          className={cn(
            "border-bronze relative h-9 w-[27px] shrink-0 overflow-hidden rounded-[4px] border-[1.5px] [@media(max-height:500px)]:h-7 [@media(max-height:500px)]:w-[21px]",
            WORKSHOP_THUMB_DROP
          )}
          style={{ backgroundColor: WORKSHOP_THUMB_BACK }}
          aria-hidden
        >
          {hasCardArt(cardId) ? (
            <img
              src={cardIllustration(cardId)}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-cream/70 grid size-full place-items-center">
              <GlyphIcon
                glyph={
                  card.kind === "creature"
                    ? raceGlyph(card.race)
                    : classGlyph(card.class)
                }
                className="size-4"
              />
            </span>
          )}
        </span>
        <span
          className="text-cream line-clamp-2 min-w-0 text-[11px] leading-tight font-semibold [@media(max-height:500px)]:sr-only"
          aria-hidden
        >
          {name}
        </span>
      </Button>
      {shown ? (
        <Popover
          triggerRef={trigger}
          isOpen
          isNonModal
          onOpenChange={(open) => {
            if (!open) {
              onHide();
            }
          }}
          placement="left"
          offset={12}
          className="fade-in animate-in pointer-events-none duration-150 motion-reduce:animate-none"
          data-testid="workshop-peek"
        >
          <CardDetails cardId={cardId} rank={card.baseRank} />
        </Popover>
      ) : null}
    </li>
  );
};

/** The emblem of a Race or a Class: its glyph on the Race color, or on bronze for a Class. */
const GroupEmblem = ({ group }: { readonly group: FuseGroup }) => (
  <span
    className={cn(
      "border-bronze-rim text-cream flex size-6 shrink-0 items-center justify-center rounded-full border-2 [@media(max-height:500px)]:size-4 [@media(max-height:500px)]:border",
      WORKSHOP_THUMB_DROP
    )}
    style={{
      background: isRace(group)
        ? `radial-gradient(circle at 50% 35%, ${RACE_COLORS[group].light}, ${RACE_COLORS[group].dark})`
        : "radial-gradient(circle at 50% 35%, var(--color-wood-light), var(--color-wood-edge))",
    }}
    aria-hidden
  >
    <GlyphIcon
      glyph={isRace(group) ? raceGlyph(group) : classGlyph(group)}
      className="size-3.5 [@media(max-height:500px)]:size-2.5"
    />
  </span>
);

/**
 * The chance of one Race or Class (Pillar 1: the game shows all drop
 * chances): its emblem and name, "2 in 3 · 67%", a share bar, and the cards
 * that it can give. A Race or Class with no card left to give stays in the
 * list, crossed out, so the Player sees why the other shares grew.
 */
const ChanceRow = ({
  chance,
  rank,
  bind,
  isShown,
  onHide,
}: {
  readonly chance: FuseChance;
  readonly rank: RankId;
  readonly bind: (target: Peek) => object;
  readonly isShown: (cardId: string) => boolean;
  readonly onHide: () => void;
}) => {
  const { tr } = useGameText();
  const groupName = useGroupName();
  const group = groupName(chance.group);
  const empty = chance.shares === 0;
  const percent =
    chance.total === 0 ? 0 : Math.round((chance.shares * 100) / chance.total);
  return (
    <li
      className="border-gold-trim/20 flex flex-col gap-1.5 border-t pt-2 first:border-t-0 first:pt-0 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:pt-1"
      data-testid="workshop-fuse-chance"
      data-group={chance.group}
      data-shares={chance.shares}
      data-total={chance.total}
    >
      <Meter
        value={chance.shares}
        minValue={0}
        maxValue={Math.max(chance.total, 1)}
        valueLabel={
          empty
            ? tr("workshop.fusePanel.noShareLabel", {
                group,
                rank: tr(`ranks.${rank}`),
              })
            : tr("workshop.fusePanel.chanceLabel", {
                group,
                shares: chance.shares,
                total: chance.total,
                percent,
              })
        }
        className={cn("flex flex-col gap-1", empty && "grayscale")}
      >
        {({ percentage }) => (
          <>
            <span className="flex items-center gap-1.5">
              <GroupEmblem group={chance.group} />
              <Label
                className={cn(
                  "font-display text-cream text-sm font-bold [@media(max-height:500px)]:text-[11px]",
                  empty && "line-through decoration-2"
                )}
              >
                {group}
              </Label>
              <span
                className="text-gold-light ml-auto text-xs font-black whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-[10px]"
                aria-hidden
              >
                {empty
                  ? tr("workshop.fusePanel.allFound")
                  : tr("workshop.fusePanel.chance", {
                      shares: chance.shares,
                      total: chance.total,
                      percent,
                    })}
              </span>
            </span>
            {empty ? null : (
              <span
                className={cn(
                  "bg-plate-socket relative h-2 w-full overflow-hidden rounded-full [@media(max-height:500px)]:h-1",
                  WORKSHOP_WELL_DROP
                )}
              >
                <span
                  className="from-gold-light to-gold absolute inset-0 origin-left rounded-full bg-gradient-to-r motion-safe:transition-[scale] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  style={{ scale: `${percentage / 100} 1` }}
                />
              </span>
            )}
          </>
        )}
      </Meter>
      {empty ? null : (
        <ul
          aria-label={tr("workshop.fusePanel.poolLabel", { group })}
          className="grid grid-cols-2 gap-x-1.5 gap-y-1 [@media(max-height:500px)]:flex [@media(max-height:500px)]:flex-wrap [@media(max-height:500px)]:gap-1"
          data-testid="workshop-fuse-pool"
        >
          {chance.cards.map((cardId) => (
            <PoolCard
              key={cardId}
              cardId={cardId}
              bind={bind}
              shown={isShown(cardId)}
              onHide={onHide}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

/** The line above the Fuse button: what the Player still needs, or the Essence after the Fuse. */
const useStatusLine = () => {
  const { tr, locale } = useGameText();
  const { format } = useCoinFormat();
  const groupName = useGroupName();
  const list = useMemo(
    () => new Intl.ListFormat(locale, { type: "conjunction" }),
    [locale]
  );
  return (state: FuseState, essence: number): string | null => {
    switch (state.kind) {
      case "filling": {
        const rank = tr(`ranks.${state.recipe.rank}`);
        return state.missing === 1
          ? tr("workshop.fusePanel.moreOne", { rank })
          : tr("workshop.fusePanel.moreOther", { rank, count: state.missing });
      }
      case "pool": {
        const rank = tr(`ranks.${state.recipe.rank}`);
        const [only] = state.groups;
        return state.groups.length === 1 && only !== undefined
          ? tr("workshop.fusePanel.poolOne", { rank, group: groupName(only) })
          : tr("workshop.fusePanel.poolMany", {
              rank,
              groups: list.format(state.groups.map(groupName)),
            });
      }
      case "essence": {
        return tr("workshop.fusePanel.short", {
          now: format(essence),
          missing: format(state.missing),
        });
      }
      case "ready": {
        return tr("workshop.fusePanel.after", {
          now: format(essence),
          after: format(essence - state.cost),
        });
      }
      default: {
        // Locked and empty: the lock chip or the start text says it.
        return null;
      }
    }
  };
};

/**
 * The action part of the Fuse panel: the status line and the one gold Fuse,
 * or the lock chip below the Fuse level.
 */
const FuseAction = ({
  state,
  essence,
  count,
  onFuse,
}: {
  readonly state: FuseState;
  readonly essence: number;
  readonly count: number;
  readonly onFuse: () => void;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  const status = useStatusLine()(state, essence);
  if (state.kind === "locked") {
    return (
      <span
        className="border-gold-trim/50 bg-night-plate text-cream-dim flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-bold [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:text-[11px]"
        data-testid="workshop-fuse-locked"
      >
        <GlyphIcon glyph="lock" className="text-gold-trim size-4" />
        {tr("town.opensAtLevel", { level: state.level })}
      </span>
    );
  }
  const cost = state.kind === "empty" ? null : state.cost;
  const rank = state.kind === "empty" ? null : tr(`ranks.${state.recipe.rank}`);
  const label = (() => {
    if (state.kind === "ready" && rank !== null) {
      return tr("workshop.fuseLabel", {
        count,
        rank,
        essence: format(state.cost),
      });
    }
    if (state.kind === "essence" && rank !== null) {
      return tr("workshop.fuseNeedLabel", {
        count,
        rank,
        essence: format(state.missing),
      });
    }
    return tr("workshop.fuseNotReadyLabel", {
      reason: status ?? tr("workshop.fusePanel.empty"),
    });
  })();
  return (
    <div className="flex flex-col gap-1.5 [@media(max-height:500px)]:gap-1">
      {status ? (
        <p
          className={cn(
            "text-xs leading-snug font-semibold tabular-nums [@media(max-height:500px)]:text-[10px]",
            state.kind === "pool" ? "text-cream font-bold" : "text-cream-dim"
          )}
          data-testid="workshop-fuse-status"
          data-state={state.kind}
        >
          {status}
        </p>
      ) : null}
      <GameButton
        intent="gold"
        isDisabled={state.kind !== "ready"}
        onPress={onFuse}
        aria-label={label}
        className="w-full gap-2 leading-none [@media(max-height:500px)]:min-h-7 [@media(max-height:500px)]:text-xs"
        data-testid="workshop-fuse"
        data-state={state.kind}
      >
        <GlyphIcon glyph="crucible" className="size-5 shrink-0" />
        <span className="font-display font-bold">
          {state.kind === "essence" ? tr("workshop.need") : tr("workshop.fuse")}
        </span>
        {cost === null ? null : (
          <Essence
            amount={format(state.kind === "essence" ? state.missing : cost)}
          />
        )}
      </GameButton>
    </div>
  );
};

/**
 * The row of Fuse slots. Each slot has the full width of its card, so a copy
 * never covers the copy before it: 4 slots fit the panel at each size.
 */
const FuseSlots = ({
  count,
  inputs,
  locked,
  shake,
  onRemove,
  register,
}: {
  readonly count: number;
  readonly inputs: readonly DeckEntry[];
  readonly locked: boolean;
  readonly shake: number;
  readonly onRemove: (index: number) => void;
  readonly register: (index: number, element: HTMLElement | null) => void;
}) => {
  const { tr } = useGameText();
  return (
    <div className="flex items-end">
      <ul
        // A new element for each shake, so that it plays again.
        key={shake}
        aria-label={tr("workshop.fusePanel.slots")}
        className={cn(
          "flex min-w-0 gap-1.5 [@media(max-height:500px)]:gap-1",
          SLOT_FONT,
          shake > 0 && "motion-safe:animate-[pack-shake_360ms_ease-in-out]"
        )}
        data-testid="workshop-fuse-slots"
        data-count={count}
      >
        {Array.from({ length: count }, (_, index) => {
          const input = inputs[index];
          return (
            // oxlint-disable-next-line react/no-array-index-key -- a slot is its place; two slots can hold the same card
            <li key={index} className="w-[9em] shrink-0">
              {input ? (
                <FilledSlot
                  input={input}
                  isDisabled={locked}
                  onRemove={() => onRemove(index)}
                  slotRef={(element) => register(index, element)}
                />
              ) : (
                <span
                  ref={(element) => register(index, element)}
                  className="block"
                  data-testid="workshop-fuse-slot-free"
                >
                  <EmptyCardPlace
                    mark={
                      <GlyphIcon
                        glyph="crucible"
                        className="text-gold-trim w-[3.4em] opacity-25"
                      />
                    }
                  />
                  <span className="sr-only">
                    {tr("workshop.fusePanel.freeSlot")}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * The name of the panel and its recipe line: "Fuse" and the copies that the
 * slots take, or after a Fuse the name of the new card, "New card" and its
 * Rank. Before the first copy, the number of copies of each Rank.
 */
const FuseHeader = ({
  shown,
  recipe,
  onClear,
}: {
  readonly shown: Fusion | null;
  readonly recipe: FuseRecipe | null;
  /** "Take all out", when a slot has a copy. */
  readonly onClear: (() => void) | null;
}) => {
  const { tr } = useGameText();
  const rank = shown?.rank ?? recipe?.rank ?? null;
  const line = (() => {
    if (shown) {
      return `${tr("workshop.fusePanel.newCard")} · ${tr(`ranks.${shown.rank}`)}`;
    }
    return recipe
      ? tr(`workshop.fusePanel.recipe.${recipe.kind}`, {
          count: recipe.copies,
          rank: tr(`ranks.${recipe.rank}`),
        })
      : null;
  })();
  return (
    <div className="flex min-w-0 flex-col gap-1 self-start [grid-area:head] [@media(max-height:500px)]:gap-0.5">
      <h2
        id="workshop-fuse-title"
        className="font-display text-gold-light text-lg leading-tight font-bold [@media(max-height:500px)]:text-sm"
        data-testid="workshop-fuse-title"
      >
        {shown
          ? tr(`cards.${shown.cardId}.name`)
          : tr("workshop.fusePanel.title")}
      </h2>
      {rank !== null && line !== null ? (
        <p
          className="text-cream flex items-center gap-1.5 text-xs font-bold [@media(max-height:500px)]:text-[10px]"
          data-testid="workshop-fuse-recipe"
        >
          {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the gem size (em); the gems have no text */}
          <span className="text-[9px] [@media(max-height:500px)]:text-[7px]">
            <RankGems rank={rank} />
          </span>
          {line}
        </p>
      ) : (
        <p className="text-cream-dim text-xs font-semibold whitespace-pre-line [@media(max-height:500px)]:text-[10px]">
          {tr("workshop.fusePanel.slotsGuide")}
        </p>
      )}
      {onClear ? (
        <GameButton
          intent="ghost"
          size="sm"
          onPress={onClear}
          className="mt-0.5 self-start px-2 text-xs [@media(max-height:500px)]:min-h-5 [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[10px]"
          data-testid="workshop-fuse-clear"
        >
          {tr("workshop.fusePanel.clear")}
        </GameButton>
      ) : null}
    </div>
  );
};

/** The line under the new card of a Fuse, when its face shows: its Race or Class, and that it is Discovered now. */
const FuseResultLine = ({ cardId }: { readonly cardId: string }) => {
  const { tr } = useGameText();
  const card = getCard(cardId);
  return (
    <p
      className="border-gold-trim/45 bg-plate-socket/80 text-cream flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm leading-snug font-semibold text-pretty motion-safe:animate-[pack-name_320ms_ease-out_both] [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:text-[10px]"
      data-testid="workshop-fuse-discovered"
    >
      <GroupEmblem group={fuseGroup(card)} />
      {tr("workshop.fusePanel.discovered", {
        name: tr(`cards.${cardId}.name`),
      })}
    </p>
  );
};

/**
 * The chances of the slots, or how to start when no copy is in a slot. While
 * the Card Back of a Fuse turns, it is empty; when the face shows, it tells
 * that the new card is Discovered.
 */
const FuseBody = ({
  chances,
  rank,
  revealed,
  turning,
}: {
  readonly chances: readonly FuseChance[];
  readonly rank: RankId;
  /** The new card, when its face shows. */
  readonly revealed: string | null;
  readonly turning: boolean;
}) => {
  const { tr } = useGameText();
  const { peek, bind, hide } = useCardPeek();
  if (turning) {
    return null;
  }
  if (revealed !== null) {
    return <FuseResultLine cardId={revealed} />;
  }
  if (chances.length === 0) {
    return (
      <p
        className="border-gold-trim/30 text-cream-dim rounded-lg border-2 border-dashed px-3 py-2.5 text-sm leading-snug font-semibold text-pretty [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:text-[10px]"
        data-testid="workshop-fuse-empty"
      >
        {tr("workshop.fusePanel.empty")}
      </p>
    );
  }
  return (
    <section
      aria-labelledby="workshop-fuse-chances"
      className="flex flex-col gap-1.5"
    >
      <h3 id="workshop-fuse-chances" className="sr-only">
        {tr("workshop.fusePanel.chances")}
      </h3>
      <ul
        className="flex flex-col gap-2 [@media(max-height:500px)]:gap-1"
        data-testid="workshop-fuse-chances"
      >
        {chances.map((chance) => (
          <ChanceRow
            key={chance.group}
            chance={chance}
            rank={rank}
            bind={bind}
            isShown={(cardId) =>
              peek !== null &&
              isSamePeek(peek, {
                cardId,
                rank: getCard(cardId).baseRank,
                from: "workshop",
                place: "pool",
              })
            }
            onHide={hide}
          />
        ))}
      </ul>
    </section>
  );
};

/**
 * The places of the parts of the Fuse panel. On a tall screen: the Card Back
 * at the left of the name and the slots, then the chances and the action. On
 * a short screen: the Card Back and the name are a column at the left, and
 * the slots, the chances and the action are at the right.
 */
const FUSE_GRID = cn(
  "grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2 [grid-template-areas:'preview_head'_'preview_slots'_'body_body'_'action_action']",
  "[@media(max-height:500px)]:grid-cols-[118px_minmax(0,1fr)] [@media(max-height:500px)]:grid-rows-[auto_minmax(0,1fr)_auto] [@media(max-height:500px)]:gap-x-2 [@media(max-height:500px)]:gap-y-1 [@media(max-height:500px)]:[grid-template-areas:'preview_slots'_'head_body'_'head_action']"
);

/**
 * What the Fuse panel shows now: the recipe of the slots, the new card of the
 * last Fuse until the next copy goes in, and the number of slots. After a
 * Fuse the slots keep the number of that Fuse, so the copies leave the
 * places where they were. Until the face shows, the panel keeps the recipe of
 * the Fuse (`turning`), so the new card is not named before the Card Back
 * turns over.
 */
const usePanelPhase = (
  state: FuseState,
  inputs: readonly DeckEntry[],
  result: Fusion | null
) => {
  const recipe =
    state.kind === "locked" || state.kind === "empty" ? null : state.recipe;
  const shown = result && inputs.length === 0 ? result : null;
  const faceShown = useFaceShown(shown);
  return {
    recipe,
    shown,
    slotCount: recipe?.copies ?? shown?.inputs.length ?? FIRST_SLOTS,
    faceShown,
    turning: shown && !faceShown ? fuseRecipe(shown.inputs) : null,
  };
};

/**
 * The Fuse station panel (GDD 7.4, ADR-0049). It is a crucible, not a card:
 * the Card Back of the card that is to come, the slots, and the chances. A
 * press on a grid tile puts a copy in a slot; the first copy sets the Rank,
 * the card type and the number of slots. A press on a slot takes its copy
 * out. Under the slots: the chance of each Race or Class with the cards that
 * it can give, then the Essence and the one gold Fuse. After a Fuse, the
 * copies go into the Card Back, the Essence drops fly in, and it turns over
 * to the new card. On a short screen, the pool cards show only their art.
 */
export const FusePanel = ({
  state,
  inputs,
  chances,
  essence,
  result,
  shake,
  onRemove,
  onClear,
  onFuse,
}: {
  readonly state: FuseState;
  readonly inputs: readonly DeckEntry[];
  readonly chances: readonly FuseChance[];
  readonly essence: number;
  readonly result: Fusion | null;
  /** A new number when a press on a full set of slots shakes them. */
  readonly shake: number;
  readonly onRemove: (index: number) => void;
  readonly onClear: () => void;
  readonly onFuse: () => void;
}) => {
  const panel = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const slots = useRef<(HTMLElement | null)[]>([]);
  const { recipe, shown, slotCount, faceShown, turning } = usePanelPhase(
    state,
    inputs,
    result
  );
  const locked = state.kind === "locked";
  const revealed = faceShown && shown ? shown.cardId : null;

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-labelledby="workshop-fuse-title"
      className={cn(panelClassName, FUSE_GRID)}
      data-testid="workshop-panel"
      data-station="fuse"
      data-state={state.kind}
    >
      <div ref={preview} className="self-start [grid-area:preview]">
        <FusePreview
          result={shown}
          glow={state.kind === "ready" ? state.recipe.rank : null}
          dim={inputs.length === 0 && shown === null}
        />
      </div>
      <FuseHeader
        shown={faceShown ? shown : null}
        recipe={recipe ?? turning}
        onClear={inputs.length > 0 && !locked ? onClear : null}
      />
      <div className="self-end [grid-area:slots]">
        <FuseSlots
          count={slotCount}
          inputs={inputs}
          locked={locked}
          shake={shake}
          onRemove={onRemove}
          register={(index, element) => {
            slots.current[index] = element;
          }}
        />
      </div>
      <div className={cn(rowsClassName, "[grid-area:body]")}>
        <FuseBody
          chances={chances}
          rank={recipe?.rank ?? "common"}
          revealed={revealed}
          turning={turning !== null}
        />
      </div>
      <div className="[grid-area:action]">
        <FuseAction
          state={state}
          essence={essence}
          count={recipe?.copies ?? inputs.length}
          onFuse={onFuse}
        />
      </div>
      {shown ? (
        <GatherGhosts
          result={shown}
          slots={slots}
          preview={preview}
          panel={panel}
        />
      ) : null}
    </section>
  );
};
