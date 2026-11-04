import { useAtomValue } from "@effect/atom-react";
import { coinDenominations } from "@workspace/rules";
import type { DailyQuestReward } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";

import { DAMAGE_COLORS } from "@/core/components/game/tokens";
import { ACHIEVEMENTS_CHIP_SHADOW } from "@/features/achievements/tokens";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { ActivityBar } from "@/features/objectives/components/activity-bar";
import { ClaimAllBar } from "@/features/objectives/components/claim-all-bar";
import {
  ClaimedBadge,
  ClaimToken,
  RowProgress,
} from "@/features/objectives/components/claim-parts";
import type { OnClaimed } from "@/features/objectives/components/use-claim-feedback";
import { useClaimFocus } from "@/features/objectives/components/use-claim-focus";
import { QUEST_BALANCES } from "@/features/objectives/objectives";
import { objectivesViewAtom } from "@/features/objectives/objectives.atoms";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { questFocusAfter } from "@/features/quests/quests";
import type { QuestRow } from "@/features/quests/quests";
import { useQuests } from "@/features/quests/use-quests";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

/** The wait between the seals of a Claim all, row after row. */
const STAMP_STAGGER_MS = 60;

/** The Coin, the Essence and the Activity of a Daily Quest, on one chip. */
const RewardChip = ({
  id,
  reward,
}: {
  readonly id: string;
  readonly reward: DailyQuestReward;
}) => {
  const { tr } = useGameText();
  const coin = useCoinFormat();
  return (
    <span
      className="border-gold-trim/50 bg-night-plate/90 text-cream flex h-8 shrink-0 items-center gap-2 rounded-full border px-2.5 text-[14px] leading-none font-black tabular-nums [@media(max-height:500px)]:h-6 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs"
      style={{ boxShadow: ACHIEVEMENTS_CHIP_SHADOW }}
      data-reward-of={id}
    >
      <span aria-hidden className="contents">
        <CoinAmount
          parts={coinDenominations(reward.coin)}
          format={coin.format}
        />
        <span className="flex items-center gap-1">
          <BalanceIcon
            kind="essence"
            className="size-[18px] shrink-0 [@media(max-height:500px)]:size-3.5"
          />
          {coin.format(reward.essence)}
        </span>
        <span className="flex items-center gap-1">
          <GlyphIcon
            glyph="sparkles"
            className="text-gold-light size-4 shrink-0 [@media(max-height:500px)]:size-3.5"
          />
          {coin.format(reward.activity)}
        </span>
      </span>
      <span className="sr-only">
        {tr("quests.tab.reward", {
          coin: coin.words(reward.coin),
          essence: reward.essence,
          activity: reward.activity,
        })}
      </span>
    </span>
  );
};

/** One Daily Quest row: its goal icon, its name, its goal, its reward and its state. */
const QuestRowView = ({
  row,
  stamp,
  onClaim,
}: {
  readonly row: QuestRow;
  readonly stamp: number | null;
  readonly onClaim: (row: QuestRow) => void;
}) => {
  const { tr, text } = useGameText();
  const { quest, damageType } = row;
  const { state } = quest;
  const name = text(row.name);
  return (
    <li
      className={cn(
        "border-parchment-rule/70 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 border-b px-5 py-2.5 last:border-b-0",
        "[@media(max-height:500px)]:gap-x-2 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-1.5",
        state === "completed" && "bg-parchment-lit"
      )}
      data-testid="quest-row"
      data-quest={quest.id}
      data-state={state}
    >
      <GlyphIcon
        glyph={row.glyph}
        className="text-ink-soft size-6 shrink-0 [@media(max-height:500px)]:size-5"
        style={
          damageType === null ? undefined : { color: DAMAGE_COLORS[damageType] }
        }
      />
      <div className="min-w-0">
        <p
          className={cn(
            "font-display text-[15px] leading-tight font-bold [@media(max-height:500px)]:text-[13px]",
            state === "claimed" ? "text-ink-soft" : "text-ink"
          )}
        >
          {name}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[13px] leading-snug text-pretty [@media(max-height:500px)]:line-clamp-2 [@media(max-height:500px)]:text-[11px] [@media(max-height:500px)]:leading-tight",
            state === "claimed" ? "text-ink-faded" : "text-ink-soft"
          )}
        >
          {text(row.goal)}
        </p>
      </div>
      <RewardChip id={quest.id} reward={quest.reward} />
      {state === "inProgress" ? (
        <RowProgress
          current={quest.progress.current}
          target={quest.progress.target}
          testId="quest-progress"
        />
      ) : null}
      {state === "completed" ? (
        <ClaimToken
          label={tr("quests.tab.claimLabel", { name })}
          claimId={quest.id}
          testId="quest-claim"
          onClaim={() => onClaim(row)}
        />
      ) : null}
      {state === "claimed" ? (
        <ClaimedBadge stamp={stamp} testId="quest-claimed" />
      ) : null}
    </li>
  );
};

/**
 * The Daily Quests tab of the Objectives dialog (24 — Quests 3): the Activity
 * bar, the 5 rows of the day, and Claim all. Claim all claims the Completed
 * Daily Quests and the reached checkpoints. The rules own the state; the tab
 * only sends the Claims.
 */
export const DailyQuestsTab = ({
  onClaimed,
}: {
  readonly onClaimed: OnClaimed;
}) => {
  const { tr, text } = useGameText();
  const { rows, bar, counts } = useAtomValue(objectivesViewAtom);
  const quests = useQuests();
  const { list, claimAllButton, focusAfterClaim } = useClaimFocus();
  const [stamps, setStamps] = useState<Readonly<Record<string, number>>>({});

  const claim = (row: QuestRow) => {
    const from = document.querySelector(`[data-reward-of="${row.quest.id}"]`);
    if (quests.claim(row.quest.index) === 0) {
      return;
    }
    focusAfterClaim(questFocusAfter(rows, row.quest.index));
    setStamps((current) => ({ ...current, [row.quest.id]: 0 }));
    onClaimed(
      from,
      QUEST_BALANCES,
      tr("quests.tab.said.one", { name: text(row.name) })
    );
  };

  const claimCheckpoints = () => {
    const from = document.querySelector('[data-testid="activity-claim"]');
    const count = quests.claimCheckpoints();
    if (count > 0) {
      focusAfterClaim(null);
      onClaimed(from, QUEST_BALANCES, tr("quests.tab.said.many", { count }));
    }
  };

  const claimAll = () => {
    const from = claimAllButton.current;
    const completed = rows.filter((row) => row.quest.state === "completed");
    const count = quests.claimAll();
    if (count === 0) {
      return;
    }
    focusAfterClaim(null);
    setStamps((current) => ({
      ...current,
      ...Object.fromEntries(
        completed.map((row, index) => [row.quest.id, index * STAMP_STAGGER_MS])
      ),
    }));
    onClaimed(from, QUEST_BALANCES, tr("quests.tab.said.many", { count }));
  };

  return (
    <div className="flex size-full min-h-0 flex-col">
      <ActivityBar bar={bar} onClaim={claimCheckpoints} />
      <ul
        ref={list}
        tabIndex={-1}
        aria-label={tr("objectives.tabs.daily")}
        className="m-0 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain py-0.5 outline-none"
        data-testid="quest-list"
      >
        {rows.map((row) => (
          <QuestRowView
            key={row.quest.id}
            row={row}
            stamp={stamps[row.quest.id] ?? null}
            onClaim={claim}
          />
        ))}
      </ul>
      <ClaimAllBar
        count={counts.daily}
        button={claimAllButton}
        testId="quests-claim-all"
        onClaimAll={claimAll}
      />
    </div>
  );
};
