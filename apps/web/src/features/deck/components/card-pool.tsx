import type { CollectionEntry, DeckInput } from "@workspace/rules";
import { copiesLeft, getCard } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
import { Button, Label, Radio, RadioGroup } from "react-aria-components";

import { CardFrame } from "@/features/battle/components/card-frame";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek } from "@/features/deck/components/use-card-peek";
import type { PoolBlock, PoolFilter } from "@/features/deck/deck";
import { classText, poolBlock, poolEntries } from "@/features/deck/deck";

const FILTERS: readonly PoolFilter[] = ["all", "creature", "skill"];

type PeekBind = (target: Peek) => object;

const filterChip = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "flex h-8 cursor-pointer items-center rounded-lg border-2 px-2.5 text-xs font-bold text-[#2a1d12] transition-[transform,box-shadow] duration-100 outline-none select-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:-translate-y-px motion-reduce:data-[hovered]:translate-y-0",
    "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-[11px]",
    isSelected
      ? "border-[#e2a93b] bg-[#fff3d1] shadow-[0_0_0_3px_rgba(226,169,59,0.45)]"
      : "border-[#c9b48c] bg-[#f6ead0]"
  );

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
  return (
    <span className="flex h-6 max-w-full items-center rounded-lg border-2 border-[#c9b48c] bg-[#ead9b4] px-2 text-xs leading-none font-bold text-[#5b4632] [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[10px]">
      <span className="truncate">
        {block === "class"
          ? tr("deckBuilder.blocked.class", { className: classLabel })
          : tr(`deckBuilder.blocked.${block}`)}
      </span>
    </span>
  );
};

const PoolCard = ({
  entry,
  input,
  onAdd,
  bind,
  wasLongPress,
}: {
  readonly entry: CollectionEntry;
  readonly input: DeckInput;
  readonly onAdd: (entry: CollectionEntry) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
}) => {
  const { tr, text } = useGameText();
  const card = getCard(entry.cardId);
  const block = poolBlock(input, entry.cardId, entry.rank);
  const left = copiesLeft(input, entry.cardId, entry.rank);
  const classLabel = card.kind === "skill" ? text(classText(card.class)) : "";
  return (
    <li className="flex justify-center">
      <Button
        {...bind({ cardId: entry.cardId, rank: entry.rank, from: "pool" })}
        onPress={() => {
          if (!wasLongPress() && block === null) {
            onAdd(entry);
          }
        }}
        aria-label={tr("deckBuilder.add", {
          name: tr(`cards.${entry.cardId}.name`),
          rank: tr(`ranks.${entry.rank}`),
          countdown: card.countdown,
          left: Math.max(left, 0),
        })}
        aria-disabled={block === null ? undefined : true}
        className={cn(
          "group flex flex-col items-center gap-1.5 rounded-xl p-1 outline-none select-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          block === null ? "cursor-pointer" : "cursor-default"
        )}
        data-testid={`pool-${entry.cardId}-${entry.rank}`}
        data-blocked={block ?? undefined}
      >
        <CardFrame
          cardId={entry.cardId}
          rank={entry.rank}
          countdown={card.countdown}
          className={cn(
            "transition-[transform,filter] duration-150 ease-out",
            block === null
              ? "group-data-[hovered]:-translate-y-1.5 group-data-[pressed]:translate-y-0 motion-reduce:group-data-[hovered]:translate-y-0"
              : "brightness-[0.82] saturate-[0.55]"
          )}
        />
        <CopiesPlate left={left} block={block} classLabel={classLabel} />
      </Button>
    </li>
  );
};

/**
 * The left page: the cards that the Player owns, one for each card and Rank.
 * A press adds one copy to the Deck.
 */
export const CardPool = ({
  input,
  pool,
  onAdd,
  bind,
  wasLongPress,
}: {
  readonly input: DeckInput;
  readonly pool: readonly CollectionEntry[];
  readonly onAdd: (entry: CollectionEntry) => void;
  readonly bind: PeekBind;
  readonly wasLongPress: () => boolean;
}) => {
  const { tr } = useGameText();
  const [filter, setFilter] = useState<PoolFilter>("all");
  const shown = poolEntries(pool, filter);
  const owned = pool.reduce((total, entry) => total + entry.copies, 0);
  return (
    <section
      aria-labelledby="deck-pool-title"
      className="flex min-h-0 flex-col gap-3 py-4 pr-9 pl-5 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:py-2 [@media(max-height:500px)]:pr-6 [@media(max-height:500px)]:pl-3"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3
          id="deck-pool-title"
          className="font-display flex items-baseline gap-2 text-lg font-bold [@media(max-height:500px)]:text-sm"
        >
          {tr("deckBuilder.yourCards")}
          <span className="font-sans text-xs font-semibold text-[#5b4632]">
            {tr("deckBuilder.owned", { count: owned })}
          </span>
        </h3>
        <RadioGroup
          value={filter}
          onChange={(value) => {
            const next = FILTERS.find((candidate) => candidate === value);
            if (next) {
              setFilter(next);
            }
          }}
          orientation="horizontal"
          className="flex items-center gap-2"
        >
          <Label className="sr-only">{tr("deckBuilder.show")}</Label>
          {FILTERS.map((id) => (
            <Radio
              key={id}
              value={id}
              className={filterChip}
              data-testid={`pool-filter-${id}`}
            >
              {tr(`deckBuilder.filters.${id}`)}
            </Radio>
          ))}
        </RadioGroup>
      </header>
      <ul
        className={cn(
          "-mx-2 grid min-h-0 flex-1 auto-rows-max grid-cols-[repeat(auto-fill,minmax(10em,1fr))] gap-x-1 gap-y-3 overflow-y-auto overscroll-contain px-2 pt-2 pb-4 text-[11px]",
          "[scrollbar-width:thin] [scrollbar-color:#b9a175_transparent]",
          "max-[1100px]:text-[10px] [@media(max-height:500px)]:gap-y-1.5 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:text-[7px]"
        )}
        data-testid="deck-pool"
      >
        {shown.map((entry) => (
          <PoolCard
            key={`${entry.cardId}:${entry.rank}`}
            entry={entry}
            input={input}
            onAdd={onAdd}
            bind={bind}
            wasLongPress={wasLongPress}
          />
        ))}
      </ul>
    </section>
  );
};
