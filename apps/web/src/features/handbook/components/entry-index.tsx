import { cn } from "cn";
import { useLayoutEffect, useRef } from "react";
import type { Key } from "react-aria-components";
import {
  Header,
  Link,
  ListBox,
  ListBoxItem,
  ListBoxSection,
} from "react-aria-components";

import { useGameText } from "@/features/battle/use-game-text";
import { SmallIcon } from "@/features/handbook/components/entry-icon";
import type {
  ChapterId,
  Entry,
  EntryGroup,
  EntryId,
  SearchHit,
} from "@/features/handbook/handbook";
import {
  chapterEntries,
  getEntry,
  toEntryId,
} from "@/features/handbook/handbook";

/**
 * A row of the index, ruled like the index of a book. The open Entry is the
 * current place, so it has a gold mark (DESIGN.md, The Gold Means Act Rule).
 */
const rowClass = (current: boolean) =>
  cn(
    "relative flex min-h-10 cursor-pointer items-center gap-2.5 border-b border-[#c9b48c]/70 py-1.5 pr-2 pl-3 text-[0.9375rem] text-[#2a1d12] outline-none",
    "data-[focus-visible]:z-10 data-[focus-visible]:rounded-md data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:bg-[#fff3d1]",
    "[@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:text-sm",
    current &&
      "bg-[#ffe08a]/45 font-bold before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:bg-[#e2a93b]"
  );

/**
 * Keeps the open Entry in view when the list shows. After "Back to the list"
 * on a single page, it also takes the focus.
 */
const useCurrentInView = (current: EntryId, focus: boolean) => {
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    // React Aria puts the rows into the list after its first render, so the
    // row is there in the next frame.
    const frame = requestAnimationFrame(() => {
      const row = list.current?.querySelector<HTMLElement>(
        `[data-entry="${current}"]`
      );
      row?.scrollIntoView({ block: "nearest" });
      if (focus) {
        row?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [current, focus]);
  return list;
};

const onKey =
  (onOpen: (id: EntryId) => void) =>
  (key: Key): void => {
    const id = toEntryId(key);
    if (id) {
      onOpen(id);
    }
  };

/** A run of Entries in the list: with a group, it has a heading. */
interface EntryRun {
  readonly group: EntryGroup | undefined;
  readonly entries: readonly Entry[];
}

/** Splits the Entries into runs of the same group, in their order. */
const entryRuns = (entries: readonly Entry[]): EntryRun[] => {
  const runs: { group: EntryGroup | undefined; entries: Entry[] }[] = [];
  for (const entry of entries) {
    const last = runs.at(-1);
    if (last && last.group === entry.group) {
      last.entries.push(entry);
    } else {
      runs.push({ group: entry.group, entries: [entry] });
    }
  }
  return runs;
};

/**
 * The Entries of one Chapter: an index with the icon of each Entry at its
 * left. A group of Entries, for example the Buffs, has a heading.
 */
export const ChapterIndex = ({
  chapter,
  current,
  onOpen,
  focusCurrent,
}: {
  readonly chapter: ChapterId;
  readonly current: EntryId;
  readonly onOpen: (id: EntryId) => void;
  readonly focusCurrent: boolean;
}) => {
  const { tr, text, locale } = useGameText();
  const list = useCurrentInView(current, focusCurrent);
  const nameOf = (id: EntryId) => text(getEntry(id).name);
  const entries = chapterEntries(chapter, (entry) => text(entry.name), locale);
  const item = (entry: Entry) => (
    <ListBoxItem
      key={entry.id}
      id={entry.id}
      textValue={nameOf(entry.id)}
      className={rowClass(entry.id === current)}
      data-entry={entry.id}
      data-current={entry.id === current || undefined}
    >
      {entry.icon ? (
        <SmallIcon icon={entry.icon} className="size-[18px] text-[#7a4c1a]" />
      ) : (
        <span className="size-[18px] shrink-0" aria-hidden />
      )}
      <span className="min-w-0 truncate">{nameOf(entry.id)}</span>
    </ListBoxItem>
  );
  return (
    <ListBox
      ref={list}
      aria-label={tr("handbook.entryList", {
        chapter: tr(`handbook.chapter.${chapter}.name`),
      })}
      selectionMode="none"
      onAction={onKey(onOpen)}
      className="outline-none"
      data-testid="handbook-index"
    >
      {entryRuns(entries).map((run) =>
        run.group ? (
          <ListBoxSection
            // A section ID must not be an Entry ID: "damageType" is both.
            key={`group-${run.group}`}
            id={`group-${run.group}`}
            data-testid={`handbook-group-${run.group}`}
          >
            <Header className="px-3 pt-3 pb-1 text-xs font-bold tracking-wider text-[#7a4c1a] uppercase">
              {tr(`handbook.groups.${run.group}`)}
            </Header>
            {run.entries.map(item)}
          </ListBoxSection>
        ) : (
          run.entries.map(item)
        )
      )}
    </ListBox>
  );
};

/** No result: one line, and a link to the Battle Chapter. */
const NoResult = ({
  query,
  onToBattle,
}: {
  readonly query: string;
  readonly onToBattle: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <div className="space-y-2 px-3 py-4" data-testid="handbook-no-result">
      <p className="text-[0.9375rem]">{tr("handbook.noResult", { query })}</p>
      <Link
        onPress={onToBattle}
        className="text-keyword-rust decoration-keyword-rust/45 cursor-pointer text-sm font-bold underline underline-offset-[3px] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
      >
        {tr("handbook.toBattle")}
      </Link>
    </div>
  );
};

/**
 * The search results: each one with its Chapter, and an alias match as
 * "mana → Countdown". A screen reader hears the number of results.
 */
export const SearchResults = ({
  query,
  hits,
  current,
  onOpen,
  onToBattle,
  focusCurrent,
}: {
  readonly query: string;
  readonly hits: readonly SearchHit[];
  readonly current: EntryId;
  readonly onOpen: (id: EntryId) => void;
  readonly onToBattle: () => void;
  readonly focusCurrent: boolean;
}) => {
  const { tr, text } = useGameText();
  const list = useCurrentInView(current, focusCurrent);
  const count = (
    <p className="sr-only" aria-live="polite">
      {tr("handbook.resultCount", { count: hits.length })}
    </p>
  );
  if (hits.length === 0) {
    return (
      <>
        {count}
        <NoResult query={query} onToBattle={onToBattle} />
      </>
    );
  }
  return (
    <>
      {count}
      <ListBox
        ref={list}
        aria-label={tr("handbook.results")}
        selectionMode="none"
        onAction={onKey(onOpen)}
        className="outline-none"
        data-testid="handbook-results"
      >
        {hits.map((hit) => {
          const entry = getEntry(hit.id);
          const name = text(entry.name);
          const title = hit.alias
            ? tr("handbook.alias", { alias: hit.alias, name })
            : name;
          return (
            <ListBoxItem
              key={hit.id}
              id={hit.id}
              textValue={title}
              className={rowClass(hit.id === current)}
              data-entry={hit.id}
              data-current={hit.id === current || undefined}
            >
              {entry.icon ? (
                <SmallIcon
                  icon={entry.icon}
                  className="size-[18px] text-[#7a4c1a]"
                />
              ) : (
                <span className="size-[18px] shrink-0" aria-hidden />
              )}
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate">{title}</span>
                <span className="truncate text-xs font-normal text-[#5b4632]">
                  {tr(`handbook.chapter.${entry.chapter}.name`)}
                </span>
              </span>
            </ListBoxItem>
          );
        })}
      </ListBox>
    </>
  );
};
