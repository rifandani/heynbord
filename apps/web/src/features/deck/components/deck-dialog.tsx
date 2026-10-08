import { useAtom, useAtomValue } from "@effect/atom-react";
import {
  addCopy,
  autoFill,
  deckProblems,
  getCard,
  removeCopy,
} from "@workspace/rules";
import { cn } from "cn";
import type { FocusEvent } from "react";
import { useState } from "react";
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { CardDetails } from "@/features/battle/components/card-details";
import { BRONZE } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { BuyDeckSlot } from "@/features/deck/components/buy-deck-slot";
import { CardPool } from "@/features/deck/components/card-pool";
import { DeckPage } from "@/features/deck/components/deck-page";
import type { Peek, ShownPeek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";
import type {
  ClassPick,
  DeckSlot,
  PoolFilter,
  PoolTile,
} from "@/features/deck/deck";
import {
  DEFAULT_POOL_FILTER,
  defaultSlotName,
  poolClass,
  slotInput,
  updateSlot,
} from "@/features/deck/deck";
import {
  activeDeckIdAtom,
  collectionAtom,
  deckSlotsAtom,
} from "@/features/deck/deck.atoms";
import { useHandbook } from "@/features/handbook/use-handbook";
import { shortcutImage } from "@/features/town/town";

/** A gold corner of the cover, as on the painted book of the Deck icon. */
const Corner = ({ className }: { readonly className: string }) => (
  <span
    className={cn(
      "pointer-events-none absolute size-6 border-[#7a5310] [@media(max-height:500px)]:size-4",
      className
    )}
    style={{ background: BRONZE }}
    aria-hidden
  />
);

/**
 * A Deck slot as a ribbon bookmark on the top edge of the book. The open
 * Deck is gold, because it is the current place; the active Deck has a seal.
 */
const Ribbon = ({
  slot,
  name,
  active,
}: {
  readonly slot: DeckSlot;
  readonly name: string;
  readonly active: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <Tab
      id={slot.id}
      aria-label={active ? `${name}, ${tr("deckBuilder.active")}` : name}
      className="group relative flex h-full w-44 min-w-0 shrink cursor-pointer items-end rounded-t-md outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
      data-testid={`deck-slot-${slot.id}`}
    >
      <span
        className={cn(
          "relative flex w-full items-center gap-1.5 px-3 pt-2.5 pb-2 transition-[height,filter] duration-150 ease-out motion-reduce:transition-none",
          // The swallowtail end of the ribbon.
          "[clip-path:polygon(0_0,50%_7px,100%_0,100%_100%,0_100%)]",
          "[@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-1",
          "group-data-[selected]:h-12 group-data-[selected]:bg-gradient-to-b group-data-[selected]:from-[#ffe08a] group-data-[selected]:to-[#e2a93b] group-data-[selected]:text-[#2a1a05]",
          "h-10 bg-gradient-to-b from-[#7a5233] to-[#563720] text-[#fff6df] group-data-[hovered]:brightness-110",
          "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:group-data-[selected]:h-8"
        )}
      >
        <GlyphIcon
          glyph={classGlyph(slot.classId)}
          className="size-4 shrink-0 [@media(max-height:500px)]:size-3"
        />
        <span
          className={cn(
            "font-display truncate text-sm font-bold [@media(max-height:500px)]:font-sans [@media(max-height:500px)]:text-[11px]",
            slot.deck.length === 0 && "opacity-75"
          )}
        >
          {name}
        </span>
        {active ? (
          <span
            className="ml-auto grid size-[18px] shrink-0 place-items-center rounded-full border border-[#e9c46a]/80 bg-[#1c140e]/90 text-[#ffd75a] [@media(max-height:500px)]:size-3.5"
            aria-hidden
          >
            <GlyphIcon
              glyph="check"
              className="size-2.5 [@media(max-height:500px)]:size-2"
            />
          </span>
        ) : null}
      </span>
    </Tab>
  );
};

/**
 * The Card Details over the other page, so it never covers the card under
 * the pointer. A card of the pool shows them on the right page, a line of
 * the Deck on the left page. The card stands at the spine of the book. They
 * are next to their card in the DOM, so that Tab goes from the card into
 * their links; their place on the screen comes from the page of the book.
 */
const PeekDetails = ({
  peek,
  onBlur,
}: {
  readonly peek: ShownPeek;
  readonly onBlur: (event: FocusEvent<Element>) => void;
}) => {
  const handbook = useHandbook();
  const fromPool = peek.from === "pool";
  return (
    <div
      className={cn(
        "fade-in animate-in pointer-events-none absolute top-4 z-20 duration-150 motion-reduce:animate-none [@media(max-height:500px)]:top-2",
        fromPool ? "left-1/2 ml-6" : "right-1/2 mr-6"
      )}
      onBlur={onBlur}
      data-testid="deck-peek"
    >
      <CardDetails
        cardId={peek.cardId}
        rank={peek.rank}
        countdown={getCard(peek.cardId).countdown}
        panelSide={fromPool ? "right" : "left"}
        onEntry={peek.byKeyboard ? handbook.openAt : undefined}
      />
    </div>
  );
};

/**
 * The filters of the card pool, for all the Deck slots of the open book. The
 * Class filter is for one slot and Hero Class (see `poolClass`).
 */
interface PoolFilterState {
  readonly filter: PoolFilter;
  readonly setFilter: (filter: PoolFilter) => void;
  readonly classPick: ClassPick | null;
  readonly setClassPick: (pick: ClassPick) => void;
}

/** The open book: the two pages of one Deck slot. */
const DeckSpread = ({
  slot,
  index,
  poolFilter,
}: {
  readonly slot: DeckSlot;
  readonly index: number;
  readonly poolFilter: PoolFilterState;
}) => {
  const { text } = useGameText();
  const [slots, setSlots] = useAtom(deckSlotsAtom);
  const [activeId, setActiveId] = useAtom(activeDeckIdAtom);
  const collection = useAtomValue(collectionAtom);
  const { peek, bind, hide, wasLongPress, onPanelBlur } = useCardPeek();

  const input = slotInput(slot, collection);
  const problems = deckProblems(input);
  const filled = autoFill(input);
  const change = (next: (current: DeckSlot) => DeckSlot) =>
    setSlots(updateSlot(slots, slot.id, next));
  const setDeck = (deck: DeckSlot["deck"]) =>
    change((current) => ({ ...current, deck }));

  const filter: PoolFilter = {
    ...poolFilter.filter,
    classId: poolClass(poolFilter.classPick, slot),
  };
  const onFilter = (next: PoolFilter) => {
    poolFilter.setFilter(next);
    if (next.classId !== filter.classId) {
      poolFilter.setClassPick({
        classId: next.classId,
        slotId: slot.id,
        heroClass: slot.classId,
      });
    }
  };

  const onAdd = (tile: PoolTile) => {
    setDeck(addCopy(slot.deck, tile.cardId, tile.rank));
    unlockAudio();
    playSound("select", 0);
  };
  // A line that goes away takes its Card Details with it.
  const peekAt = (target: Peek) =>
    peek && isSamePeek(peek, target) ? (
      <PeekDetails peek={peek} onBlur={onPanelBlur} />
    ) : null;

  return (
    <>
      <CardPool
        input={input}
        filter={filter}
        onFilter={onFilter}
        onAdd={onAdd}
        bind={bind}
        wasLongPress={wasLongPress}
        peekAt={peekAt}
      />
      <DeckPage
        slot={slot}
        input={input}
        fallbackName={text(defaultSlotName(slot, index))}
        problems={problems}
        active={slot.id === activeId}
        canFill={filled.length > slot.deck.length}
        onRename={(name) => change((current) => ({ ...current, name }))}
        onClass={(classId) => change((current) => ({ ...current, classId }))}
        onRemove={(row) => setDeck(removeCopy(slot.deck, row.cardId, row.rank))}
        onClear={() => {
          hide();
          setDeck([]);
        }}
        onFill={() => setDeck(filled)}
        onUse={() => setActiveId(slot.id)}
        bind={bind}
        wasLongPress={wasLongPress}
        peekAt={peekAt}
      />
    </>
  );
};

const DeckBook = ({ close }: { readonly close: () => void }) => {
  const { tr, text } = useGameText();
  const slots = useAtomValue(deckSlotsAtom);
  const activeId = useAtomValue(activeDeckIdAtom);
  const [openId, setOpenId] = useState(() =>
    slots.some((slot) => slot.id === activeId) ? activeId : slots[0]?.id
  );
  // The filters stay while the book is open, and reset when it closes.
  const [filter, setFilter] = useState(DEFAULT_POOL_FILTER);
  const [classPick, setClassPick] = useState<ClassPick | null>(null);
  const poolFilter = { filter, setFilter, classPick, setClassPick };
  const nameOf = (slot: DeckSlot, index: number) =>
    slot.name || text(defaultSlotName(slot, index));

  return (
    <Tabs
      selectedKey={openId}
      onSelectionChange={(key) => setOpenId(String(key))}
      className="flex size-full flex-col"
    >
      <header className="flex h-14 shrink-0 items-end gap-3 px-4 [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:px-2">
        <div className="flex shrink-0 items-center gap-2 self-center">
          <img
            src={shortcutImage("deck")}
            alt=""
            width={128}
            height={128}
            draggable={false}
            className="-my-2 size-12 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] select-none [@media(max-height:500px)]:size-8"
          />
          <Heading
            slot="title"
            className="font-display text-2xl font-black text-[#fff6df] [@media(max-height:500px)]:text-base"
          >
            {tr("deckBuilder.title")}
          </Heading>
        </div>
        {/* The ribbons, then the locked ribbon of the next Deck Slot right after the last one. */}
        <div className="flex h-full min-w-0 flex-1 items-end gap-1.5 [@media(max-height:500px)]:gap-1">
          <TabList
            aria-label={tr("deckBuilder.slots")}
            className="flex h-full min-w-0 flex-initial items-end gap-1.5 [@media(max-height:500px)]:gap-1"
          >
            {slots.map((slot, index) => (
              <Ribbon
                key={slot.id}
                slot={slot}
                name={nameOf(slot, index)}
                active={slot.id === activeId}
              />
            ))}
          </TabList>
          <BuyDeckSlot onBought={setOpenId} />
        </div>
        <GameButton
          intent="wood"
          size="icon"
          aria-label={tr("deckBuilder.close")}
          onPress={close}
          className="shrink-0 self-center [@media(max-height:500px)]:size-8"
          data-testid="deck-close"
        >
          <HiXMark className="size-5" aria-hidden />
        </GameButton>
      </header>
      {slots.map((slot, index) => (
        <TabPanel
          key={slot.id}
          id={slot.id}
          className={cn(
            "relative grid min-h-0 flex-1 grid-cols-2 rounded-[10px] bg-[#f6ead0] text-[#2a1d12] outline-none",
            // The edges of the pages under the top page, then the drop of the book.
            "shadow-[0_2px_0_#e6d6b0,0_4px_0_#cfba8f,0_5px_0_#8a6a40]"
          )}
        >
          {/* The spine: the pages curve down into it. */}
          <span
            className="pointer-events-none absolute inset-y-0 left-1/2 w-20 -translate-x-1/2 bg-[linear-gradient(90deg,rgba(91,58,30,0)_0%,rgba(91,58,30,0.1)_35%,rgba(91,58,30,0.34)_50%,rgba(91,58,30,0.1)_65%,rgba(91,58,30,0)_100%)] [@media(max-height:500px)]:w-12"
            aria-hidden
          />
          <DeckSpread slot={slot} index={index} poolFilter={poolFilter} />
        </TabPanel>
      ))}
    </Tabs>
  );
};

/**
 * The front cover of the closed book. It turns over on the spine when the
 * book opens, and back when it closes; at rest it is hidden. The outside has
 * the Deck icon and title; the inside is the blank left page, which gives way
 * to the real page when the cover lies down.
 */
const Cover = () => {
  const { tr } = useGameText();
  return (
    <div
      className="pointer-events-none invisible absolute inset-y-0 right-0 left-1/2 z-20 origin-left [transform-style:preserve-3d] motion-safe:group-data-[entering]/book:animate-[deck-cover_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover_500ms_linear_reverse_both]"
      aria-hidden
    >
      {/* The outside of the cover. */}
      <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-l-[4px] rounded-r-[18px] border-2 border-l-0 border-[#2a1408] bg-[#55301a] [backface-visibility:hidden] motion-safe:group-data-[entering]/book:animate-[deck-cover-front_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover-front_500ms_linear_reverse_both] [@media(max-height:500px)]:rounded-r-xl">
        <span className="absolute inset-1 left-0 rounded-r-[14px] border border-l-0 border-[#e7bb6a]/30 [@media(max-height:500px)]:rounded-r-lg" />
        {/* The hinge groove next to the spine. */}
        <span className="absolute inset-y-0 left-3 w-[3px] bg-[#2a1408]/70 shadow-[1px_0_0_rgba(255,226,170,0.12)] [@media(max-height:500px)]:left-2" />
        <Corner className="-top-px -right-px rounded-tr-[18px] rounded-bl-lg border-b-2 border-l-2" />
        <Corner className="-right-px -bottom-px rounded-tl-lg rounded-br-[18px] border-t-2 border-l-2" />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#e7bb6a]/40 px-8 py-6 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-3">
          <img
            src={shortcutImage("deck")}
            alt=""
            width={128}
            height={128}
            draggable={false}
            className="size-32 drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] select-none [@media(max-height:500px)]:size-16"
          />
          <span className="font-display text-3xl font-black tracking-wide text-[#fff6df] [@media(max-height:500px)]:text-lg">
            {tr("deckBuilder.title")}
          </span>
        </div>
      </div>
      {/* The inside of the cover: the left half of the open book, with a blank page. */}
      <div className="absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-l-[18px] rounded-r-[4px] border-2 border-r-0 border-[#2a1408] bg-[#55301a] [backface-visibility:hidden] motion-safe:group-data-[entering]/book:animate-[deck-cover-back_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover-back_500ms_linear_reverse_both] [@media(max-height:500px)]:rounded-l-xl">
        <span className="absolute inset-1 right-0 rounded-l-[14px] border border-r-0 border-[#e7bb6a]/30 [@media(max-height:500px)]:rounded-l-lg" />
        <span className="absolute top-14 right-0 bottom-2.5 left-2.5 rounded-l-[10px] bg-[#f6ead0] bg-[linear-gradient(90deg,rgba(91,58,30,0)_calc(100%-40px),rgba(91,58,30,0.1)_calc(100%-26px),rgba(91,58,30,0.34)_100%)] shadow-[0_2px_0_#e6d6b0,0_4px_0_#cfba8f,0_5px_0_#8a6a40] [@media(max-height:500px)]:top-9 [@media(max-height:500px)]:bottom-1.5 [@media(max-height:500px)]:left-1.5" />
      </div>
    </div>
  );
};

/**
 * The Deck dialog (GDD 6, CRD-04 to CRD-07): a big book at the center of the
 * screen, over the current screen. The ribbons are the Deck slots. The left
 * page holds all the cards of the game, the right page the open Deck. A
 * change applies at once, so it has no Save button. Esc, the close button and
 * a click outside close it. The book opens and closes on its spine; with
 * reduced motion it shows and goes at once.
 */
export const DeckDialog = ({
  isOpen,
  onOpenChange,
}: {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) => (
  <ModalOverlay
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    isDismissable
    className="fade-in animate-in fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] duration-200 motion-safe:data-[exiting]:animate-[deck-scrim-out_500ms_linear_both] motion-reduce:animate-none [@media(max-height:500px)]:p-2"
  >
    <Modal className="group/book relative h-[min(780px,100%)] w-[min(1200px,100%)] [perspective:3200px] motion-safe:data-[entering]:animate-[deck-book_720ms_linear_both] motion-safe:data-[exiting]:animate-[deck-book_500ms_linear_reverse_both]">
      <div
        className={cn(
          // The leather cover of the book: flat, so the title on it stays sharp.
          "absolute inset-0 rounded-[18px] border-2 border-[#2a1408] bg-[#55301a] p-2.5 pt-0 shadow-[0_24px_48px_rgba(0,0,0,0.55)]",
          "motion-safe:group-data-[entering]/book:animate-[deck-book-body_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-book-body_500ms_linear_reverse_both]",
          "[@media(max-height:500px)]:rounded-xl [@media(max-height:500px)]:p-1.5 [@media(max-height:500px)]:pt-0"
        )}
      >
        {/* A tooled line on the leather, and the gold corners. */}
        <span
          className="pointer-events-none absolute inset-1 rounded-[14px] border border-[#e7bb6a]/30 [@media(max-height:500px)]:rounded-lg"
          aria-hidden
        />
        <Corner className="-top-px -left-px rounded-tl-[18px] rounded-br-lg border-r-2 border-b-2" />
        <Corner className="-top-px -right-px rounded-tr-[18px] rounded-bl-lg border-b-2 border-l-2" />
        <Corner className="-bottom-px -left-px rounded-tr-lg rounded-bl-[18px] border-t-2 border-r-2" />
        <Corner className="-right-px -bottom-px rounded-tl-lg rounded-br-[18px] border-t-2 border-l-2" />
        <Dialog
          className="relative size-full outline-none"
          data-testid="deck-dialog"
        >
          {({ close }) => <DeckBook close={close} />}
        </Dialog>
      </div>
      {/* The shadow of the cover on the right page while the cover moves. */}
      <span
        className="pointer-events-none absolute inset-y-0 right-0 left-1/2 z-10 rounded-r-[18px] bg-[linear-gradient(90deg,rgba(24,12,4,0.7),rgba(24,12,4,0.35)_55%,rgba(24,12,4,0.15))] opacity-0 motion-safe:group-data-[entering]/book:animate-[deck-page-shadow_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-page-shadow_500ms_linear_reverse_both]"
        aria-hidden
      />
      <Cover />
    </Modal>
  </ModalOverlay>
);
