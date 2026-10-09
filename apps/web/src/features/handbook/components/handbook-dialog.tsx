import { useAtom, useAtomSet } from "@effect/atom-react";
import { useMediaQuery } from "@reactuses/core";
import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { Key } from "react-aria-components";
import {
  Button,
  Dialog,
  Heading,
  Input,
  Modal,
  ModalOverlay,
  SearchField,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "react-aria-components";
import { HiArrowLeft, HiMagnifyingGlass, HiXMark } from "react-icons/hi2";

import { GameButton } from "@/features/battle/components/game-button";
import { useGameText } from "@/features/battle/use-game-text";
import { SmallIcon } from "@/features/handbook/components/entry-icon";
import {
  ChapterIndex,
  SearchResults,
} from "@/features/handbook/components/entry-index";
import { EntryPage } from "@/features/handbook/components/entry-page";
import { HandbookIcon } from "@/features/handbook/components/handbook-icon";
import type {
  ChapterId,
  EntryId,
  HandbookPlace,
  HandbookRequest,
} from "@/features/handbook/handbook";
import {
  aliasKey,
  ALIASED_ENTRIES,
  CHAPTER_ICONS,
  chapterEntries,
  CHAPTERS,
  ENTRIES,
  nameAliasKeys,
  openPlace,
  searchEntries,
  showChapter,
  showEntry,
  splitAliases,
} from "@/features/handbook/handbook";
import {
  handbookAtom,
  lastEntryAtom,
} from "@/features/handbook/handbook.atoms";

/**
 * The three forms of the Handbook (issue #25). `book`: two pages on desktop,
 * outside the Battle. `page`: one page at a time on a short screen. `side`:
 * one page at one side of the Board in the Battle, so that most of the Board
 * stays in view (Clear Board Rule).
 */
type Form = "book" | "page" | "side";

/** The cloth of the cover: a fine weave on a deep blue, not the leather of the Deck book. */
const CLOTH = {
  background: [
    "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)",
    "repeating-linear-gradient(-45deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 4px)",
    "linear-gradient(180deg, #33476b 0%, #283a5c 55%, #1d2b47 100%)",
  ].join(", "),
} as const;

const SHORT_SCREEN = "(max-height: 500px)";

const toChapter = (key: Key): ChapterId | null =>
  CHAPTERS.find((chapter) => chapter === key) ?? null;

/** The Entries for the search, in the current Locale: names and aliases. */
const useSearchItems = () => {
  const { tr, text } = useGameText();
  return ENTRIES.map((entry) => ({
    id: entry.id,
    name: text(entry.name),
    aliases: [
      ...(ALIASED_ENTRIES.has(entry.id)
        ? splitAliases(tr(aliasKey(entry.id)))
        : []),
      ...nameAliasKeys(entry.id).map((key) => tr(key)),
    ],
  }));
};

const SearchBox = ({
  query,
  onChange,
}: {
  readonly query: string;
  readonly onChange: (query: string) => void;
}) => {
  const { tr } = useGameText();
  return (
    <SearchField
      value={query}
      onChange={onChange}
      aria-label={tr("handbook.search")}
      className="group relative flex min-w-0 items-center"
      data-testid="handbook-search"
    >
      <HiMagnifyingGlass
        className="pointer-events-none absolute left-2.5 size-4 text-[#6b5238]"
        aria-hidden
      />
      <Input
        placeholder={tr("handbook.searchPlaceholder")}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border-2 border-[#121c30] bg-[#fff3d1] pr-9 pl-8 text-sm text-[#2a1d12] shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)] outline-none placeholder:text-[#6b5238]",
          "data-[focused]:ring-4 data-[focused]:ring-[#fff2a8] [&::-webkit-search-cancel-button]:hidden",
          "[@media(max-height:500px)]:h-8"
        )}
      />
      <Button
        aria-label={tr("handbook.clearSearch")}
        className="absolute right-1 grid size-8 cursor-pointer place-items-center rounded-md text-[#5b4632] outline-none group-data-[empty]:hidden data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:bg-[#ead9b4] [@media(max-height:500px)]:size-7"
      >
        <HiXMark className="size-4" aria-hidden />
      </Button>
    </SearchField>
  );
};

/** The top band of the cover: the icon or a back arrow, the title, the search and the close button. */
const CoverBand = ({
  form,
  query,
  onQuery,
  onBack,
  close,
}: {
  readonly form: Form;
  readonly query: string;
  readonly onQuery: (query: string) => void;
  /** Only on an Entry page of a single page. */
  readonly onBack: (() => void) | null;
  readonly close: () => void;
}) => {
  const { tr } = useGameText();
  const book = form === "book";
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2.5 px-2",
        book ? "h-16 gap-3 px-3" : "h-14",
        "[@media(max-height:500px)]:h-11 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:px-1"
      )}
    >
      {onBack ? (
        <GameButton
          intent="wood"
          size="icon"
          aria-label={tr("handbook.back")}
          onPress={onBack}
          className="shrink-0 [@media(max-height:500px)]:size-8"
          data-testid="handbook-back"
        >
          <HiArrowLeft className="size-5" aria-hidden />
        </GameButton>
      ) : (
        <HandbookIcon className="size-9 shrink-0 [@media(max-height:500px)]:size-7" />
      )}
      <Heading
        slot="title"
        className={cn(
          "font-display shrink-0 font-black text-[#fff6df] [text-shadow:0_2px_0_rgba(0,0,0,0.45)]",
          book ? "text-2xl" : "text-xl",
          "[@media(max-height:500px)]:text-base",
          !book && "max-[700px]:sr-only"
        )}
      >
        {tr("handbook.title")}
      </Heading>
      <div className={cn("ml-auto min-w-0 flex-1", book && "max-w-80")}>
        <SearchBox query={query} onChange={onQuery} />
      </div>
      <GameButton
        intent="wood"
        size="icon"
        aria-label={tr("handbook.close")}
        onPress={close}
        className="shrink-0 [@media(max-height:500px)]:size-8"
        data-testid="handbook-close"
      >
        <HiXMark className="size-5" aria-hidden />
      </GameButton>
    </header>
  );
};

/**
 * The width of a thumb-index tab of the book, and how far out of the cover it
 * goes. The tab starts under the edge of the pages, crosses the edge of the
 * cloth and stands out of the book.
 */
const BOOK_TAB = "w-32";
const BOOK_TAB_OUT = "7rem";

/** A thumb-index tab on the edge of the pages: the icon and the short name of a Chapter. */
const ThumbTab = ({
  chapter,
  form,
}: {
  readonly chapter: ChapterId;
  readonly form: Form;
}) => {
  const { tr } = useGameText();
  const book = form === "book";
  return (
    <Tab
      id={chapter}
      aria-label={tr(`handbook.chapter.${chapter}.name`)}
      className={cn(
        "group relative flex cursor-pointer items-center bg-[#d9c39a] font-bold text-[#4a3524] transition-[background-color,translate] duration-150 outline-none motion-reduce:transition-none",
        "data-[focus-visible]:z-10 data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:bg-[#ead9b4] data-[selected]:bg-[#f6ead0] data-[selected]:text-[#2a1d12]",
        book
          ? "min-h-11 gap-2 rounded-r-lg py-1.5 pr-2 pl-6 text-xs shadow-[2px_2px_0_rgba(0,0,0,0.35)] data-[selected]:translate-x-1.5 data-[selected]:shadow-[inset_-4px_0_0_#e2a93b,2px_2px_0_rgba(0,0,0,0.35)]"
          : "min-h-10 min-w-0 flex-1 justify-center rounded-t-lg px-1 pt-1 data-[selected]:shadow-[inset_0_4px_0_#e2a93b] [@media(max-height:500px)]:min-h-9"
      )}
      data-testid={`handbook-chapter-${chapter}`}
    >
      <SmallIcon
        icon={CHAPTER_ICONS[chapter]}
        className="size-5 text-[#7a4c1a] [@media(max-height:500px)]:size-[18px]"
      />
      {/* A single page has a strip of icons only. The tab label has the full name. */}
      {book ? (
        <span className="min-w-0 truncate" aria-hidden>
          {tr(`handbook.chapter.${chapter}.short`)}
        </span>
      ) : null}
    </Tab>
  );
};

/** The list of the open Chapter, or the search results. */
const IndexPage = ({
  place,
  query,
  hits,
  onOpen,
  onToBattle,
  focusCurrent,
}: {
  readonly place: HandbookPlace;
  readonly query: string;
  readonly hits: ReturnType<typeof searchEntries>;
  readonly onOpen: (id: EntryId) => void;
  readonly onToBattle: () => void;
  readonly focusCurrent: boolean;
}) => {
  const { tr } = useGameText();
  const searching = query.trim().length > 0;
  return (
    <>
      <h3 className="font-display px-3 pb-2 text-xl font-bold [@media(max-height:500px)]:pb-1 [@media(max-height:500px)]:text-base">
        {searching
          ? tr("handbook.results")
          : tr(`handbook.chapter.${place.chapter}.name`)}
      </h3>
      {searching ? (
        <SearchResults
          query={query.trim()}
          hits={hits}
          current={place.entry}
          onOpen={onOpen}
          onToBattle={onToBattle}
          focusCurrent={focusCurrent}
        />
      ) : (
        <ChapterIndex
          chapter={place.chapter}
          current={place.entry}
          onOpen={onOpen}
          focusCurrent={focusCurrent}
        />
      )}
    </>
  );
};

const PAGE =
  "min-h-0 overflow-y-auto overscroll-contain bg-[#f6ead0] text-[#2a1d12]";

/** Two pages: the index at the left, the Entry at the right, with a spine between them. */
const Spread = ({
  index,
  entry,
}: {
  readonly index: ReactNode;
  readonly entry: ReactNode;
}) => (
  <>
    <span
      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-16 -translate-x-1/2 bg-[linear-gradient(90deg,rgba(91,58,30,0)_0%,rgba(91,58,30,0.1)_35%,rgba(91,58,30,0.3)_50%,rgba(91,58,30,0.1)_65%,rgba(91,58,30,0)_100%)]"
      aria-hidden
    />
    <div
      className={cn(PAGE, "rounded-l-[10px] py-5 pr-6 pl-3")}
      data-testid="handbook-left-page"
    >
      {index}
    </div>
    <div
      className={cn(PAGE, "rounded-r-[10px] py-5 pr-6 pl-8")}
      data-testid="handbook-right-page"
    >
      {entry}
    </div>
  </>
);

/**
 * The open Handbook: its place, the search and the pages of its form. It
 * remembers the last Entry that the Player read for this session.
 */
const HandbookBody = ({
  request,
  form,
  close,
}: {
  readonly request: HandbookRequest;
  readonly form: Form;
  readonly close: () => void;
}) => {
  const { tr, text, locale } = useGameText();
  const setLast = useAtomSet(lastEntryAtom);
  const [place, setPlace] = useState(() => openPlace(request));
  const [query, setQuery] = useState("");
  const items = useSearchItems();
  const hits = searchEntries(query, items);
  // After "Back to the list", the open Entry in the list takes the focus.
  const [focusList, setFocusList] = useState(false);
  const tabList = useRef<HTMLDivElement>(null);
  const single = form !== "book";
  const entryShows = !single || place.page === "entry";

  // The Player read the Entry that shows: the bars open the Handbook at it next time.
  useEffect(() => {
    if (entryShows) {
      setLast(place.entry);
    }
  }, [entryShows, place.entry, setLast]);

  const go = (next: HandbookPlace, focus = false) => {
    setFocusList(focus);
    setPlace(next);
  };
  const firstOf = (chapter: ChapterId) =>
    chapterEntries(chapter, (entry) => text(entry.name), locale)[0]?.id ??
    place.entry;
  const onChapter = (key: Key) => {
    const chapter = toChapter(key);
    if (chapter) {
      setQuery("");
      go(showChapter(place, chapter, firstOf(chapter)));
    }
  };
  const onQuery = (next: string) => {
    setQuery(next);
    if (single && place.page === "entry") {
      go({ ...place, page: "list" });
    }
  };
  const onToBattle = () => {
    setQuery("");
    go(showChapter(place, "battle", firstOf("battle")));
  };
  const index = (
    <IndexPage
      place={place}
      query={query}
      hits={hits}
      onOpen={(id) => go(showEntry(id))}
      onToBattle={onToBattle}
      focusCurrent={focusList}
    />
  );
  const entry = (
    <EntryPage
      key={place.entry}
      id={place.entry}
      onOpen={(id) => go(showEntry(id))}
      focusOnShow={single}
    />
  );

  return (
    <>
      <CoverBand
        form={form}
        query={query}
        onQuery={onQuery}
        onBack={
          single && place.page === "entry"
            ? () => {
                // The Back button goes away with the page. The selected tab
                // holds the focus first, so that the dialog does not move it.
                tabList.current
                  ?.querySelector<HTMLElement>('[aria-selected="true"]')
                  ?.focus();
                go({ ...place, page: "list" }, true);
              }
            : null
        }
        close={close}
      />
      <Tabs
        selectedKey={place.chapter}
        onSelectionChange={onChapter}
        orientation={single ? "horizontal" : "vertical"}
        className={cn("relative flex min-h-0 flex-1", single && "flex-col")}
      >
        <TabList
          ref={tabList}
          aria-label={tr("handbook.chapters")}
          className={cn(
            "flex shrink-0",
            single
              ? "gap-1 px-1"
              : // Out of the cover, at the right. The pages come later and lie over its left end.
                cn(
                  BOOK_TAB,
                  "absolute top-4 left-[calc(100%-0.5rem)] flex-col gap-1.5"
                )
          )}
        >
          {CHAPTERS.map((chapter) => (
            <ThumbTab key={chapter} chapter={chapter} form={form} />
          ))}
        </TabList>
        {CHAPTERS.map((chapter) => (
          <TabPanel
            key={chapter}
            id={chapter}
            className={cn(
              "relative min-h-0 flex-1 outline-none",
              single
                ? cn(
                    PAGE,
                    "rounded-[10px] p-4 [@media(max-height:500px)]:p-2.5"
                  )
                : "grid grid-cols-2 rounded-[10px] bg-[#f6ead0] shadow-[0_2px_0_#e6d6b0,0_4px_0_#cfba8f,0_5px_0_#8a6a40]"
            )}
            data-testid="handbook-page"
          >
            {single ? (
              place.page === "entry" ? (
                entry
              ) : (
                index
              )
            ) : (
              <Spread index={index} entry={entry} />
            )}
          </TabPanel>
        ))}
      </Tabs>
    </>
  );
};

const overlayClass = (form: Form) =>
  cn(
    "fixed inset-0 z-50 flex p-4 duration-200 motion-reduce:animate-none [@media(max-height:500px)]:p-2",
    form === "side"
      ? "items-stretch justify-end pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      : "fade-in animate-in items-center justify-center bg-black/55 backdrop-blur-[2px] motion-safe:data-[exiting]:animate-[deck-scrim-out_500ms_linear_both]"
  );

/** Out of the Battle, the Handbook opens and closes on its spine, as the Deck book does. */
const BOOK_MOTION =
  "[perspective:3200px] motion-safe:data-[entering]:animate-[deck-book_720ms_linear_both] motion-safe:data-[exiting]:animate-[deck-book_500ms_linear_reverse_both]";

const modalClass = (form: Form) =>
  cn(
    "group/book relative motion-reduce:animate-none",
    form === "book" &&
      cn(
        BOOK_MOTION,
        // The tabs stand out of the cover: the book keeps room for them, and the two together are at the center.
        "mr-[var(--tab-out)] h-[min(760px,100%)] w-[min(1180px,calc(100%-var(--tab-out)))]"
      ),
    form === "page" && cn(BOOK_MOTION, "size-full max-w-3xl"),
    form === "side" &&
      cn(
        "h-full w-[min(26rem,42vw)] min-w-64 [perspective:2400px]",
        "motion-safe:data-[entering]:animate-[handbook-side_440ms_linear_both] motion-safe:data-[exiting]:animate-[handbook-side_280ms_linear_reverse_both]"
      )
  );

/**
 * The outside of the front cover: the cloth with its stitches, the hinge
 * groove next to the spine at the left, and the Handbook icon and title.
 */
const CoverFace = ({ className }: { readonly className: string }) => {
  const { tr } = useGameText();
  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-l-[4px] rounded-r-[16px] border-2 border-l-0 border-[#121c30] [backface-visibility:hidden] [@media(max-height:500px)]:rounded-r-xl",
        className
      )}
      style={CLOTH}
      aria-hidden
    >
      <span className="absolute inset-1 left-0 rounded-r-[12px] border border-l-0 border-dashed border-[#e7bb6a]/35 [@media(max-height:500px)]:rounded-r-lg" />
      {/* The hinge groove next to the spine. */}
      <span className="absolute inset-y-0 left-3 w-[3px] bg-[#121c30]/70 shadow-[1px_0_0_rgba(200,220,255,0.12)] [@media(max-height:500px)]:left-2" />
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#e7bb6a]/40 px-8 py-6 shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-3">
        <HandbookIcon className="size-32 [@media(max-height:500px)]:size-16" />
        <span className="font-display text-center text-3xl font-black tracking-wide text-[#fff6df] [@media(max-height:500px)]:text-lg">
          {tr("handbook.title")}
        </span>
      </div>
    </div>
  );
};

/**
 * The cover of the Handbook in the Battle. The closed book comes in at the
 * edge of the screen, and the cover swings open on the spine toward the Board
 * until it is edge-on and gone; at rest it is hidden. The shadow of the cover
 * on the page goes as the cover stands up.
 */
const SideCover = () => (
  <>
    <span
      className="pointer-events-none absolute inset-0 z-10 rounded-[16px] bg-[linear-gradient(90deg,rgba(8,12,24,0.75),rgba(8,12,24,0.4)_45%,rgba(8,12,24,0.15))] opacity-0 motion-safe:group-data-[entering]/book:animate-[handbook-side-shadow_440ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[handbook-side-shadow_280ms_linear_reverse_both] [@media(max-height:500px)]:rounded-xl"
      aria-hidden
    />
    {/* A child of the Modal, so that the perspective of the Modal applies. */}
    <CoverFace className="pointer-events-none invisible absolute inset-0 z-20 origin-left motion-safe:group-data-[entering]/book:animate-[handbook-side-cover_440ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[handbook-side-cover_280ms_linear_reverse_both]" />
  </>
);

/**
 * The front cover of the closed Handbook. It turns over on the spine when the
 * book opens, and back when it closes; at rest it is hidden. The outside has
 * the Handbook icon and title; the inside is the blank left page, which gives
 * way to the real page when the cover lies down.
 */
const Cover = ({ form }: { readonly form: Form }) => {
  const book = form === "book";
  return (
    <div
      className="pointer-events-none invisible absolute inset-y-0 right-0 left-1/2 z-20 origin-left [transform-style:preserve-3d] motion-safe:group-data-[entering]/book:animate-[deck-cover_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover_500ms_linear_reverse_both]"
      aria-hidden
    >
      <CoverFace className="absolute inset-0 motion-safe:group-data-[entering]/book:animate-[deck-cover-front_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover-front_500ms_linear_reverse_both]" />
      {/* The inside of the cover: the left half of the open book, with a blank page. */}
      <div
        className="absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-l-[16px] rounded-r-[4px] border-2 border-r-0 border-[#121c30] [backface-visibility:hidden] motion-safe:group-data-[entering]/book:animate-[deck-cover-back_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-cover-back_500ms_linear_reverse_both] [@media(max-height:500px)]:rounded-l-xl"
        style={CLOTH}
      >
        <span className="absolute inset-1 right-0 rounded-l-[12px] border border-r-0 border-dashed border-[#e7bb6a]/35 [@media(max-height:500px)]:rounded-l-lg" />
        <span
          className={cn(
            "absolute right-0 rounded-l-[10px] bg-[#f6ead0] bg-[linear-gradient(90deg,rgba(91,58,30,0)_calc(100%-40px),rgba(91,58,30,0.1)_calc(100%-26px),rgba(91,58,30,0.3)_100%)]",
            // The page sits under the band of the cover, and on a single page under the strip of tabs too.
            book
              ? "top-16 bottom-2.5 left-2.5 shadow-[0_2px_0_#e6d6b0,0_4px_0_#cfba8f,0_5px_0_#8a6a40]"
              : "top-24 bottom-1.5 left-1.5",
            "[@media(max-height:500px)]:top-20 [@media(max-height:500px)]:bottom-1.5 [@media(max-height:500px)]:left-1.5"
          )}
        />
      </div>
    </div>
  );
};

/**
 * The Handbook dialog (issue #25): a cloth-bound field manual from the same
 * game box as the Deck book, with thumb-index tabs for the Chapters. One
 * dialog serves all openers. Esc, the close button and a click outside close
 * it, and the focus goes back to the control that opened it. The Battle does
 * not pause under it. Out of the Battle, it opens and closes on its spine as
 * the Deck book does. In the Battle, the closed book comes in at the edge of
 * the screen and its cover swings open toward the Board. With reduced motion
 * it shows and goes at once.
 */
export const HandbookDialog = ({
  inBattle,
}: {
  readonly inBattle: boolean;
}) => {
  const [request, setRequest] = useAtom(handbookAtom);
  // The pages stay in the book while it closes.
  const [shown, setShown] = useState(request);
  if (request !== null && request !== shown) {
    setShown(request);
  }
  const shortScreen = useMediaQuery(SHORT_SCREEN, false);
  const form: Form = inBattle ? "side" : shortScreen ? "page" : "book";
  return (
    <ModalOverlay
      isOpen={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          setRequest(null);
        }
      }}
      isDismissable
      className={overlayClass(form)}
    >
      <Modal
        className={modalClass(form)}
        // SAFETY: a CSS custom property for the book tabs. React's
        // `CSSProperties` does not model custom properties.
        style={{ "--tab-out": BOOK_TAB_OUT } as CSSProperties}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-[16px] border-2 border-[#121c30] p-2.5 pt-0 shadow-[0_24px_48px_rgba(0,0,0,0.55)]",
            form !== "book" && "p-1.5 pt-0",
            form !== "side" &&
              "motion-safe:group-data-[entering]/book:animate-[deck-book-body_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-book-body_500ms_linear_reverse_both]",
            "[@media(max-height:500px)]:rounded-xl"
          )}
          style={CLOTH}
        >
          {/* The stitches along the edge of the cloth. */}
          <span
            className="pointer-events-none absolute inset-1 rounded-[12px] border border-dashed border-[#e7bb6a]/35 [@media(max-height:500px)]:rounded-lg"
            aria-hidden
          />
          <Dialog
            className="relative flex size-full flex-col outline-none"
            data-testid="handbook-dialog"
            data-form={form}
          >
            {({ close }) =>
              shown ? (
                <HandbookBody request={shown} form={form} close={close} />
              ) : null
            }
          </Dialog>
        </div>
        {form === "side" ? (
          <SideCover />
        ) : (
          <>
            {/* The shadow of the cover on the right page while the cover moves. */}
            <span
              className="pointer-events-none absolute inset-y-0 right-0 left-1/2 z-10 rounded-r-[16px] bg-[linear-gradient(90deg,rgba(8,12,24,0.7),rgba(8,12,24,0.35)_55%,rgba(8,12,24,0.15))] opacity-0 motion-safe:group-data-[entering]/book:animate-[deck-page-shadow_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-page-shadow_500ms_linear_reverse_both] [@media(max-height:500px)]:rounded-r-xl"
              aria-hidden
            />
            <Cover form={form} />
          </>
        )}
      </Modal>
    </ModalOverlay>
  );
};
