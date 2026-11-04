import { useAtomValue } from "@effect/atom-react";
import { useMediaQuery } from "@reactuses/core";
import { cn } from "cn";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";

import type { AchievementGroup } from "@/features/achievements/achievements";
import {
  claimFocusAfter,
  openingCategory,
  rewardBalances,
  rewardText,
} from "@/features/achievements/achievements";
import { AchievementRow } from "@/features/achievements/components/achievement-row";
import { useAchievements } from "@/features/achievements/use-achievements";
import { useGameText } from "@/features/battle/use-game-text";
import { ClaimAllBar } from "@/features/objectives/components/claim-all-bar";
import type { OnClaimed } from "@/features/objectives/components/use-claim-feedback";
import { useClaimFocus } from "@/features/objectives/components/use-claim-focus";
import { objectivesViewAtom } from "@/features/objectives/objectives.atoms";
import { useCoinFormat } from "@/features/packs/use-coin-format";

/** The wait between the seals of a Claim all, row after row. */
const STAMP_STAGGER_MS = 60;

const SHORT_SCREEN = "(max-height: 500px)";

/** One category tab of the slim column: its name, its done count and its gold count. */
const CategoryTab = ({ group }: { readonly group: AchievementGroup }) => {
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
        "data-[focus-visible]:ring-focus-cream relative flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left outline-none data-[focus-visible]:ring-4",
        "text-ink-soft data-[hovered]:bg-parchment-lit data-[selected]:bg-parchment-lit data-[selected]:text-ink",
        "[@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1"
      )}
      data-testid={`achievements-category-${group.category}`}
    >
      <span className="min-w-0 flex-1">
        <span className="font-display block text-sm leading-tight font-bold [@media(max-height:500px)]:text-xs">
          {name}
        </span>
        <span
          className="block text-xs font-semibold tabular-nums [@media(max-height:500px)]:text-[10px]"
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
          className="border-gold-deep from-gold-light to-gold text-ink-on-gold grid h-5 min-w-5 place-items-center rounded-full border bg-gradient-to-b px-1 text-xs font-black tabular-nums"
          data-testid="achievements-category-badge"
        >
          {group.claimable}
        </span>
      ) : null}
    </Tab>
  );
};

/**
 * The Achievements tab of the Objectives dialog (Achievements 4): a slim
 * column of 4 category tabs and the list of the selected category. It opens on
 * the first category with a reward to claim. Claim all claims the Completed
 * Achievements of all categories. On a short screen, the category tabs are a
 * row above the list, so the dialog has one column.
 */
export const AchievementsTab = ({
  onClaimed,
}: {
  readonly onClaimed: OnClaimed;
}) => {
  const { tr, text } = useGameText();
  const coin = useCoinFormat();
  const short = useMediaQuery(SHORT_SCREEN, false);
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
    const from = document.querySelector(`[data-reward-of="${id}"]`);
    const [first] = achievements.claim(id);
    if (first === undefined) {
      return;
    }
    focusAfterClaim(claimFocusAfter(rows, id));
    setStamps((current) => ({ ...current, [id]: 0 }));
    // A Cosmetic has no balance, so it does not fly.
    onClaimed(
      from,
      rewardBalances([first.reward]),
      tr("achievements.tab.said.one", {
        name: tr(`achievements.${id}.name`),
        reward: text(rewardText(first.reward, "claimed", coin.words)),
      })
    );
  };

  const claimAll = () => {
    const from = claimAllButton.current;
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
    onClaimed(
      from,
      rewardBalances(done.map((item) => item.reward)),
      tr("achievements.tab.said.many", { count: done.length })
    );
  };

  return (
    <div className="flex size-full min-h-0 flex-col">
      <Tabs
        orientation={short ? "horizontal" : "vertical"}
        selectedKey={selected}
        onSelectionChange={setSelected}
        className="flex min-h-0 flex-1 flex-row [@media(max-height:500px)]:flex-col"
      >
        <TabList
          aria-label={tr("achievements.tab.categories.label")}
          className="border-parchment-rule bg-parchment-deep flex w-52 shrink-0 flex-col gap-1 overflow-y-auto border-r-2 p-2 [@media(max-height:500px)]:w-full [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:overflow-x-auto [@media(max-height:500px)]:border-r-0 [@media(max-height:500px)]:border-b-2 [@media(max-height:500px)]:p-1"
        >
          {groups.map((group) => (
            <CategoryTab key={group.category} group={group} />
          ))}
        </TabList>
        {groups.map((group) => (
          <TabPanel
            key={group.category}
            id={group.category}
            className="data-[focus-visible]:ring-focus-cream min-h-0 min-w-0 flex-1 outline-none data-[focus-visible]:ring-4"
            data-testid={`achievements-list-${group.category}`}
          >
            <ul
              ref={list}
              tabIndex={-1}
              aria-label={tr(`achievements.tab.categories.${group.category}`)}
              className="m-0 size-full list-none overflow-y-auto overscroll-contain py-0.5 outline-none"
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
      />
    </div>
  );
};
