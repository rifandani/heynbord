import { useAtomValue } from "@effect/atom-react";
import type { AchievementCategory, AchievementState } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";

import type { AchievementGroup } from "@/features/achievements/achievements";
import {
  claimFocusAfter,
  openingCategory,
  rewardText,
} from "@/features/achievements/achievements";
import { AchievementRow } from "@/features/achievements/components/achievement-row";
import { useAchievements } from "@/features/achievements/use-achievements";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { HANDBOOK_THUMB } from "@/features/handbook/tokens";
import { ClaimAllBar } from "@/features/objectives/components/claim-all-bar";
import { WaxSeal } from "@/features/objectives/components/claim-parts";
import {
  LeftPage,
  useSpread,
} from "@/features/objectives/components/objectives-book";
import type { OnClaimed } from "@/features/objectives/components/use-claim-feedback";
import { useClaimFocus } from "@/features/objectives/components/use-claim-focus";
import { objectivesViewAtom } from "@/features/objectives/objectives.atoms";
import {
  OBJECTIVES_MEDALLION_FACE,
  OBJECTIVES_MEDALLION_SHADOW,
} from "@/features/objectives/tokens";
import { useCoinFormat } from "@/features/packs/use-coin-format";

/** The wait between the seals of a Claim all, row after row. */
const STAMP_STAGGER_MS = 60;

/** The glyph of each category tab (DESIGN.md, Objectives dialog). */
const CATEGORY_GLYPH: Readonly<Record<AchievementCategory, Glyph>> = {
  campaign: "gate",
  dungeons: "cave",
  heynspire: "tower",
  progress: "levelUp",
  feats: "medal",
};

/**
 * One category tab, as a bookmark on the edge of the ledger: its glyph, its
 * name, its done count and its gold count. The open bookmark stands out
 * further, in the paper of the page, with a gold edge. On one page, the
 * bookmarks are a row above the list.
 */
const CategoryTab = ({
  group,
  spread,
}: {
  readonly group: AchievementGroup;
  readonly spread: boolean;
}) => {
  const { tr } = useGameText();
  const name = tr(`achievements.tab.categories.${group.category}`);
  return (
    <Tab
      id={group.category}
      aria-label={
        group.claimable > 0
          ? `${name}, ${tr("achievements.tab.toClaim", { count: group.claimable })}`
          : name
      }
      className={cn(
        "group/mark text-plate-ember relative flex shrink-0 cursor-pointer items-center gap-2 bg-(--mark) text-left transition-[background-color,translate] duration-150 outline-none motion-reduce:transition-none",
        "data-[focus-visible]:ring-focus-cream data-[hovered]:bg-parchment-deep data-[selected]:bg-parchment data-[selected]:text-ink data-[focus-visible]:z-10 data-[focus-visible]:ring-4",
        spread
          ? "min-h-14 rounded-r-lg py-1.5 pr-2 pl-5 shadow-[2px_2px_0_rgb(0_0_0/35%)] data-[selected]:translate-x-1.5 data-[selected]:shadow-[inset_-4px_0_0_var(--color-gold),2px_2px_0_rgb(0_0_0/35%)]"
          : "min-w-max rounded-lg px-2.5 py-1.5 data-[selected]:shadow-[inset_0_-3px_0_var(--color-gold)] [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1"
      )}
      // SAFETY: a CSS custom property for the paper of the bookmark. React's
      // `CSSProperties` does not model custom properties.
      style={{ "--mark": HANDBOOK_THUMB } as CSSProperties}
      data-testid={`achievements-category-${group.category}`}
    >
      <GlyphIcon
        glyph={CATEGORY_GLYPH[group.category]}
        className="size-5 shrink-0 [@media(max-height:500px)]:size-4"
      />
      <span className="min-w-0 flex-1">
        <span className="font-display block text-[13px] leading-tight font-bold whitespace-nowrap [@media(max-height:500px)]:text-xs">
          {name}
        </span>
        <span
          className="block text-[11px] font-semibold whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-[10px]"
          data-testid="achievements-category-count"
        >
          {tr("achievements.tab.countLabel", {
            done: group.done,
            total: group.rows.length,
          })}
        </span>
      </span>
      {group.claimable > 0 ? (
        <span
          aria-hidden
          className={cn(
            "border-gold-deep from-gold-light to-gold text-ink-on-gold grid h-5 min-w-5 place-items-center rounded-full border bg-gradient-to-b px-1 text-xs font-black tabular-nums",
            spread && "absolute -top-1.5 -right-1.5"
          )}
          data-testid="achievements-category-badge"
        >
          {group.claimable}
        </span>
      ) : null}
    </Tab>
  );
};

/**
 * The place of one Achievement on the page of seals. A Claimed Achievement has
 * its wax seal. A Completed one has a gold ring that waits for its seal. An
 * In progress one has an empty ring. `stamp` is the wait of a seal that the
 * Player claimed while the dialog is open.
 */
const SealPlace = ({
  state,
  stamp,
}: {
  readonly state: AchievementState;
  readonly stamp: number | null;
}) => {
  if (state === "claimed") {
    return (
      <span
        className={cn(
          "block size-14",
          stamp !== null &&
            "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
        style={stamp === null ? undefined : { animationDelay: `${stamp}ms` }}
        data-seal="claimed"
      >
        <WaxSeal className="size-full" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid size-14 place-items-center rounded-full border-2",
        state === "completed"
          ? "border-gold bg-parchment-lit text-gold-deep"
          : "border-parchment-rule text-parchment-rule border-dashed"
      )}
      data-seal={state}
    >
      <svg viewBox="-10 -10 20 20" className="size-5">
        <path
          d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
};

/**
 * The left page of a category: its glyph, its name and one place for each of
 * its Achievements. A Claim presses a wax seal on this page, so the page fills
 * up as the Player goes. The list at the right gives the same facts in words,
 * so the seals are decoration.
 */
const ChapterPage = ({
  group,
  stamps,
}: {
  readonly group: AchievementGroup;
  readonly stamps: Readonly<Record<string, number>>;
}) => {
  const { tr } = useGameText();
  return (
    <LeftPage>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span
          className="border-bronze-rim grid size-24 place-items-center rounded-full border-2"
          style={{
            background: OBJECTIVES_MEDALLION_FACE,
            boxShadow: OBJECTIVES_MEDALLION_SHADOW,
          }}
        >
          <GlyphIcon
            glyph={CATEGORY_GLYPH[group.category]}
            className="text-gold-light size-14"
          />
        </span>
        <h3 className="font-display text-ink text-3xl font-black text-balance">
          {tr(`achievements.tab.categories.${group.category}`)}
        </h3>
        <p className="text-ink-soft text-sm font-semibold tabular-nums">
          {tr("achievements.tab.countLabel", {
            done: group.done,
            total: group.rows.length,
          })}
        </p>
        <ul
          aria-hidden
          className="m-0 mt-3 flex list-none flex-wrap justify-center gap-3 p-0"
          data-testid="achievements-seals"
        >
          {group.rows.map((row) => (
            <li key={row.achievement.id}>
              <SealPlace
                state={row.state}
                stamp={stamps[row.achievement.id] ?? null}
              />
            </li>
          ))}
        </ul>
      </div>
    </LeftPage>
  );
};

/**
 * The Achievements tab of the Objectives dialog (Achievements 4): a slim
 * page of seals at the left, the list of the selected category at the right, and
 * 5 bookmarks on the edge of the ledger. It opens on
 * the first category with a reward to claim. Claim all claims the Completed
 * Achievements of all categories. When the ledger shows one page, the bookmarks
 * are a row above the list.
 */
export const AchievementsTab = ({
  onClaimed,
}: {
  readonly onClaimed: OnClaimed;
}) => {
  const { tr, text } = useGameText();
  const coin = useCoinFormat();
  const spread = useSpread();
  const { groups, counts } = useAtomValue(objectivesViewAtom);
  const achievements = useAchievements();
  const { list, claimAllButton, focusAfterClaim } = useClaimFocus();
  const [selected, setSelected] = useState<Key>(() => openingCategory(groups));
  const [stamps, setStamps] = useState<Readonly<Record<string, number>>>({});

  const claim = (id: string) => {
    const rows =
      groups.find((group) =>
        group.rows.some((row) => row.achievement.id === id)
      )?.rows ?? [];
    const [first] = achievements.claim(id);
    if (first === undefined) {
      return;
    }
    focusAfterClaim(claimFocusAfter(rows, id));
    setStamps((current) => ({ ...current, [id]: 0 }));
    onClaimed(
      tr("achievements.tab.said.one", {
        name: tr(`achievements.${id}.name`),
        reward: text(rewardText(first.reward, "claimed", coin.words)),
      })
    );
  };

  const claimAll = () => {
    const done = achievements.claimAll();
    if (done.length === 0) {
      return;
    }
    focusAfterClaim(null);
    // The rows of the open category stamp one after the other.
    const shown = new Set(
      groups
        .find((group) => group.category === selected)
        ?.rows.map((row) => row.achievement.id)
    );
    const stamped = done.filter((item) => shown.has(item.id));
    setStamps((current) => ({
      ...current,
      ...Object.fromEntries(
        stamped.map((item, index) => [item.id, index * STAMP_STAGGER_MS])
      ),
    }));
    onClaimed(tr("achievements.tab.said.many", { count: done.length }));
  };

  return (
    <div className="relative flex size-full min-h-0 flex-col">
      <Tabs
        orientation={spread ? "vertical" : "horizontal"}
        selectedKey={selected}
        onSelectionChange={setSelected}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabList
          aria-label={tr("achievements.tab.categories.label")}
          className={cn(
            "flex shrink-0",
            spread
              ? // Out of the cover, at the right. The right page comes later and lies over its left end.
                "absolute top-4 left-[calc(100%-0.5rem)] w-44 flex-col gap-1.5"
              : "border-parchment-rule bg-parchment-deep w-full gap-1 overflow-x-auto rounded-t-[10px] border-b-2 p-1.5 [@media(max-height:500px)]:rounded-t-md [@media(max-height:500px)]:p-1"
          )}
        >
          {groups.map((group) => (
            <CategoryTab key={group.category} group={group} spread={spread} />
          ))}
        </TabList>
        {groups.map((group) => (
          <TabPanel
            key={group.category}
            id={group.category}
            className={cn(
              "data-[focus-visible]:ring-focus-cream min-h-0 min-w-0 flex-1 outline-none data-[focus-visible]:ring-4",
              spread && "grid grid-cols-2"
            )}
            data-testid={`achievements-list-${group.category}`}
          >
            {spread ? <ChapterPage group={group} stamps={stamps} /> : null}
            <ul
              ref={list}
              tabIndex={-1}
              aria-label={tr(`achievements.tab.categories.${group.category}`)}
              className={cn(
                "bg-parchment relative m-0 flex size-full list-none flex-col gap-2 overflow-y-auto overscroll-contain p-3 pb-2 outline-none [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-1.5 [@media(max-height:500px)]:pb-1",
                // On 2 pages the Claim all bar (62px) lies over the list, so the
                // padding clears it and adds the gap between 2 rows (8px).
                spread && "rounded-r-[10px] pt-4 pr-4 pb-[70px] pl-7"
              )}
              data-testid="achievements-list"
            >
              {group.rows.map((row, index) => (
                <AchievementRow
                  key={row.achievement.id}
                  row={row}
                  index={index}
                  stamp={stamps[row.achievement.id] ?? null}
                  onClaim={claim}
                />
              ))}
            </ul>
          </TabPanel>
        ))}
      </Tabs>
      <ClaimAllBar
        count={counts.achievements}
        button={claimAllButton}
        testId="achievements-claim-all"
        onClaimAll={claimAll}
        className={
          spread ? "absolute right-0 bottom-0 z-10 w-1/2 rounded-br-[10px]" : ""
        }
      />
    </div>
  );
};
