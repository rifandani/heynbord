import type { DeckInput } from "@workspace/rules";
import { copiesLeft, getCard } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import {
  Button,
  Label,
  Radio,
  RadioGroup,
  SelectionIndicator,
} from "react-aria-components";

import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph, raceGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek } from "@/features/deck/components/use-card-peek";
import type {
  KindFilter,
  OwnershipFilter,
  PoolBlock,
  PoolFilter,
  PoolTile,
} from "@/features/deck/deck";
import {
  CLASSES_WITH_CARDS,
  classText,
  DEFAULT_POOL_FILTER,
  emptyPoolText,
  poolBlock,
  poolEntries,
  RACES_WITH_CARDS,
} from "@/features/deck/deck";

const OWNERSHIP: readonly OwnershipFilter[] = ["all", "owned", "notOwned"];
const KINDS: readonly KindFilter[] = ["all", "creature", "skill"];

type PeekBind = (target: Peek) => object;

/** The Card Details of a card, when they show; they come right after the card. */
type PeekAt = (target: Peek) => ReactNode;

const segment = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "relative isolate flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-bold whitespace-nowrap transition-colors duration-200 outline-none select-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
    "[@media(max-height:500px)]:h-6 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-[11px]",
    isSelected
      ? "text-[#2a1a05]"
      : "text-[#5b4632] data-[hovered]:bg-[#f6ead0] data-[hovered]:text-[#2a1d12]"
  );

/**
 * The gold plate of the selected segment. It is one piece: when the
 * selection changes, it slides along the strip to the new segment.
 */
const segmentPlate = cn(
  "absolute top-0 left-0 -z-10 size-full rounded-md bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[0_1px_2px_rgba(60,30,5,0.45)]",
  "motion-safe:transition-[translate,width,height] motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
);

/**
 * One filter of the pool: a row of segments on a parchment strip. The
 * selected segment is gold, as the ribbon of the open Deck, and the gold
 * plate slides to the new segment.
 */
const Segments = <Value extends string>({
  label,
  value,
  options,
  onChange,
  testId,
  render,
}: {
  readonly label: string;
  readonly value: Value;
  readonly options: readonly Value[];
  readonly onChange: (value: Value) => void;
  readonly testId: string;
  readonly render: (value: Value) => ReactNode;
}) => (
  <RadioGroup
    value={value}
    onChange={(next) => {
      const option = options.find((candidate) => candidate === next);
      if (option) {
        onChange(option);
      }
    }}
    orientation="horizontal"
    className="flex max-w-full flex-wrap items-center gap-0.5 rounded-lg border-2 border-[#c9b48c] bg-[#ead9b4] p-0.5"
    data-testid={testId}
  >
    <Label className="sr-only">{label}</Label>
    {options.map((id) => (
      <Radio
        key={id}
        value={id}
        className={segment}
        data-testid={`${testId}-${id}`}
      >
        {({ isSelected }) => (
          <>
            {render(id)}
            <SelectionIndicator
              isSelected={isSelected}
              className={segmentPlate}
            />
          </>
        )}
      </Radio>
    ))}
  </RadioGroup>
);

const plate =
  "flex h-6 max-w-full items-center rounded-lg border-2 px-2 text-xs leading-none font-bold [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[10px]";

/** The plate under a card: the free copies, or why the card cannot go in now. */
const CopiesPlate = ({
  left,
  block,
  classLabel,
}: {
  readonly left: number;
  readonly block: PoolBlock | null;
  readonly classLabel: string;
}) => {
  const { tr } = useGameText();
  if (block === null) {
    return (
      <span className="flex h-6 min-w-9 items-center justify-center rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-2 text-sm leading-none font-black text-[#fff6df] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.35)] [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:text-xs">
        {tr("deckBuilder.left", { count: left })}
      </span>
    );
  }
  if (block === "notOwned") {
    return (
      <span
        className={cn(
          plate,
          "border-dashed border-[#a8916a] bg-transparent text-[#5b4632]"
        )}
      >
        <span className="truncate">{tr("deckBuilder.notOwned")}</span>
      </span>
    );
  }
  return (
    <span className={cn(plate, "border-[#c9b48c] bg-[#ead9b4] text-[#5b4632]")}>
      <span className="truncate">
        {block === "class"
          ? tr("deckBuilder.blocked.class", { className: classLabel })
          : tr(`deckBuilder.blocked.${block}`)}
      </span>
    </span>
  );
};

const PoolCard = ({
  tile,
  input,
  onAdd,
  bind,
  wasLongPress,
  peekAt,
}: {
  readonly tile: PoolTile;
  readonly input: DeckInput;
  readonly onAdd: (tile: PoolTile) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
  readonly peekAt: PeekAt;
}) => {
  const { tr, text } = useGameText();
  const card = getCard(tile.cardId);
  const block = poolBlock(input, tile.cardId, tile.rank);
  const left = copiesLeft(input, tile.cardId, tile.rank);
  const classLabel = card.kind === "skill" ? text(classText(card.class)) : "";
  const label = {
    name: tr(`cards.${tile.cardId}.name`),
    rank: tr(`ranks.${tile.rank}`),
    countdown: card.countdown,
  };
  return (
    <li className="flex justify-center">
      <Button
        {...bind({ cardId: tile.cardId, rank: tile.rank, from: "pool" })}
        onPress={() => {
          if (!wasLongPress() && block === null) {
            onAdd(tile);
          }
        }}
        aria-label={
          block === "notOwned"
            ? tr("deckBuilder.notOwnedCard", label)
            : tr("deckBuilder.add", { ...label, left: Math.max(left, 0) })
        }
        aria-disabled={block === null ? undefined : true}
        className={cn(
          "group flex flex-col items-center gap-1.5 rounded-xl p-1 outline-none select-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          block === null ? "cursor-pointer" : "cursor-default"
        )}
        data-testid={`pool-${tile.cardId}-${tile.rank}`}
        data-blocked={block ?? undefined}
      >
        <CardFrame
          cardId={tile.cardId}
          rank={tile.rank}
          countdown={card.countdown}
          className={cn(
            "transition-[transform,filter,opacity] duration-150 ease-out",
            block === null &&
              "group-data-[hovered]:-translate-y-1.5 group-data-[pressed]:translate-y-0 motion-reduce:group-data-[hovered]:translate-y-0",
            block === "notOwned" &&
              "opacity-60 grayscale group-data-[hovered]:opacity-80",
            block !== null &&
              block !== "notOwned" &&
              "brightness-[0.82] saturate-[0.55]"
          )}
        />
        <CopiesPlate left={left} block={block} classLabel={classLabel} />
      </Button>
      {peekAt({ cardId: tile.cardId, rank: tile.rank, from: "pool" })}
    </li>
  );
};

const grid = cn(
  "-mx-2 grid auto-rows-max grid-cols-[repeat(auto-fill,minmax(10em,1fr))] gap-x-1 gap-y-3 px-2",
  "[@media(max-height:500px)]:gap-y-1.5"
);

/** The pool with no cards: the Player owns all the cards of the filters, or none. */
const EmptyPool = ({
  filter,
  onShowAll,
}: {
  readonly filter: PoolFilter;
  readonly onShowAll: () => void;
}) => {
  const { tr, text } = useGameText();
  const ownsAll = filter.ownership === "notOwned";
  return (
    <div
      className="flex flex-col items-center gap-3 px-6 py-12 text-center [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:py-4"
      data-testid="pool-empty"
    >
      {ownsAll ? (
        <span
          className="grid size-10 place-items-center rounded-full border-2 border-[#e9c46a]/80 bg-[#1c140e]/90 text-[#ffd75a] [@media(max-height:500px)]:size-7"
          aria-hidden
        >
          <GlyphIcon
            glyph="check"
            className="size-5 [@media(max-height:500px)]:size-3.5"
          />
        </span>
      ) : null}
      <p className="max-w-[32ch] text-sm font-semibold text-balance text-[#2a1d12] [@media(max-height:500px)]:text-xs">
        {text(emptyPoolText(filter))}
      </p>
      <GameButton
        intent="wood"
        size="sm"
        onPress={onShowAll}
        data-testid="pool-show-all"
      >
        {tr("deckBuilder.showAll")}
      </GameButton>
    </div>
  );
};

/**
 * The left page: all the cards of the game (GDD 6). The cards that the
 * Player owns come first, one for each card and Rank; a press adds one copy
 * to the Deck. Then the cards that the Player does not own, in grey.
 */
export const CardPool = ({
  input,
  filter,
  onFilter,
  onAdd,
  bind,
  wasLongPress,
  peekAt,
}: {
  readonly input: DeckInput;
  readonly filter: PoolFilter;
  readonly onFilter: (filter: PoolFilter) => void;
  readonly onAdd: (tile: PoolTile) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
  readonly peekAt: PeekAt;
}) => {
  const { tr, text } = useGameText();
  const pool = poolEntries(input.collection, filter);
  const both = pool.owned.length > 0 && pool.notOwned.length > 0;
  const card = (tile: PoolTile) => (
    <PoolCard
      key={`${tile.cardId}:${tile.rank}`}
      tile={tile}
      input={input}
      onAdd={onAdd}
      bind={bind}
      wasLongPress={wasLongPress}
      peekAt={peekAt}
    />
  );
  const change = (next: Partial<PoolFilter>) =>
    onFilter({ ...filter, ...next });
  return (
    <section
      aria-labelledby="deck-pool-title"
      className="flex min-h-0 flex-col gap-3 py-4 pr-9 pl-5 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:pr-6 [@media(max-height:500px)]:pl-3"
    >
      <header className="flex flex-col gap-2 [@media(max-height:500px)]:gap-1">
        <h3
          id="deck-pool-title"
          className="font-display flex items-baseline gap-2 text-lg font-bold [@media(max-height:500px)]:text-sm"
        >
          {tr("deckBuilder.cards")}
          <span
            className="font-sans text-xs font-semibold text-[#5b4632] tabular-nums"
            data-testid="pool-count"
          >
            {tr("deckBuilder.ownedOf", {
              owned: pool.ownedCards,
              total: pool.totalCards,
            })}
          </span>
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 [@media(max-height:500px)]:gap-y-1">
          <Segments
            label={tr("deckBuilder.filters.kind")}
            value={filter.kind}
            options={KINDS}
            onChange={(kind) => change({ kind })}
            testId="pool-filter"
            render={(id) => tr(`deckBuilder.filters.${id}`)}
          />
          <Segments
            label={tr("deckBuilder.filters.ownership")}
            value={filter.ownership}
            options={OWNERSHIP}
            onChange={(ownership) => change({ ownership })}
            testId="pool-own"
            render={(id) => tr(`deckBuilder.filters.${id}`)}
          />
        </div>
        <div className="flex flex-col items-start gap-1.5 [@media(max-height:500px)]:gap-1">
          {filter.kind === "creature" ? (
            <Segments
              label={tr("deckBuilder.filters.race")}
              value={filter.race}
              options={["all", ...RACES_WITH_CARDS]}
              onChange={(race) => change({ race })}
              testId="pool-race"
              render={(id) =>
                id === "all" ? (
                  tr("deckBuilder.filters.allRaces")
                ) : (
                  <>
                    <GlyphIcon
                      glyph={raceGlyph(id)}
                      className="size-3.5 shrink-0 [@media(max-height:500px)]:size-3"
                    />
                    {tr(`races.${id}`)}
                  </>
                )
              }
            />
          ) : null}
          {filter.kind === "skill" ? (
            <Segments
              label={tr("deckBuilder.filters.class")}
              value={filter.classId}
              options={["all", ...CLASSES_WITH_CARDS]}
              onChange={(classId) => change({ classId })}
              testId="pool-class"
              render={(id) =>
                id === "all" ? (
                  tr("deckBuilder.filters.allClasses")
                ) : (
                  <>
                    <GlyphIcon
                      glyph={classGlyph(id)}
                      className="size-3.5 shrink-0 [@media(max-height:500px)]:size-3"
                    />
                    {text(classText(id))}
                  </>
                )
              }
            />
          ) : null}
        </div>
      </header>
      {/* A new key for each filter, so that the list starts at the top. */}
      <div
        key={`${filter.ownership}:${filter.kind}:${filter.race}:${filter.classId}`}
        className={cn(
          "-mx-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-2 pt-2 pb-4 text-[11px]",
          "[scrollbar-width:thin] [scrollbar-color:#b9a175_transparent]",
          "max-[1100px]:text-[10px] [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:text-[7px]"
        )}
        data-testid="deck-pool"
      >
        {pool.owned.length > 0 ? (
          <ul
            className={grid}
            aria-label={tr("deckBuilder.filters.owned")}
            data-testid="pool-owned"
          >
            {pool.owned.map(card)}
          </ul>
        ) : null}
        {both ? (
          <h4
            id="deck-pool-not-owned"
            className="flex items-center gap-3 pt-1 font-sans text-xs font-bold text-[#5b4632] [@media(max-height:500px)]:text-[10px]"
          >
            <span className="h-px flex-1 bg-[#c9b48c]" aria-hidden />
            {tr("deckBuilder.notOwnedGroup", { count: pool.notOwned.length })}
            <span className="h-px flex-1 bg-[#c9b48c]" aria-hidden />
          </h4>
        ) : null}
        {pool.notOwned.length > 0 ? (
          <ul
            className={grid}
            aria-labelledby={both ? "deck-pool-not-owned" : undefined}
            aria-label={both ? undefined : tr("deckBuilder.filters.notOwned")}
            data-testid="pool-not-owned"
          >
            {pool.notOwned.map(card)}
          </ul>
        ) : null}
        {pool.owned.length === 0 && pool.notOwned.length === 0 ? (
          <EmptyPool
            filter={filter}
            onShowAll={() =>
              onFilter({ ...DEFAULT_POOL_FILTER, classId: filter.classId })
            }
          />
        ) : null}
      </div>
    </section>
  );
};
