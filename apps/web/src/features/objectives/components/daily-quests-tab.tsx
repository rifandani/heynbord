import { useAtomValue } from "@effect/atom-react";
import { coinDenominations } from "@workspace/rules";
import type { DailyQuestReward } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";

import { GameButton } from "@/core/components/game/game-button";
import { DAMAGE_COLORS } from "@/core/components/game/tokens";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import {
  ActivityBar,
  ActivityLadder,
} from "@/features/objectives/components/activity-bar";
import { ClaimAllBar } from "@/features/objectives/components/claim-all-bar";
import {
  ClaimedBadge,
  ClaimToken,
  objectiveCard,
  objectiveCardStyle,
  RewardTray,
  RowProgress,
} from "@/features/objectives/components/claim-parts";
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
  OBJECTIVES_TITLE_LIFT,
} from "@/features/objectives/tokens";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { questFocusAfter } from "@/features/quests/quests";
import type { QuestDestination, QuestRow } from "@/features/quests/quests";
import { useQuests } from "@/features/quests/use-quests";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

/** The wait between the seals of a Claim all, row after row. */
const STAMP_STAGGER_MS = 60;

/** The Coin, the Essence and the Activity of a Daily Quest, in one Reward Tray. */
const RewardChip = ({
  reward,
  claimed,
}: {
  readonly reward: DailyQuestReward;
  readonly claimed: boolean;
}) => {
  const { tr } = useGameText();
  const coin = useCoinFormat();
  return (
    <RewardTray claimed={claimed}>
      <span aria-hidden className="contents">
        <CoinAmount
          parts={coinDenominations(reward.coin)}
          format={coin.format}
          tone={claimed ? "light" : "dark"}
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
            className={cn(
              "size-4 shrink-0 [@media(max-height:500px)]:size-3.5",
              claimed ? "text-ink-soft" : "text-gold-light"
            )}
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
    </RewardTray>
  );
};

/** One Daily Quest card: its medallion, its name, its goal, its bar, its reward and its action. */
const QuestRowView = ({
  row,
  index,
  stamp,
  onClaim,
  onGoTo,
}: {
  readonly row: QuestRow;
  /** The place of the card in the list, for the cascade. */
  readonly index: number;
  readonly stamp: number | null;
  readonly onClaim: (row: QuestRow) => void;
  readonly onGoTo: (screen: QuestDestination) => void;
}) => {
  const { tr, text } = useGameText();
  const { quest, damageType, destination } = row;
  const { state } = quest;
  const name = text(row.name);
  const claimed = state === "claimed";
  return (
    <li
      className={cn(
        objectiveCard({ state }),
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-3.5 py-2 [grid-template-areas:'icon_text_action'_'icon_bar_reward']",
        "[@media(max-height:500px)]:grid-cols-[auto_minmax(0,1fr)_5.5rem_auto_7.5rem] [@media(max-height:500px)]:gap-x-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:[grid-template-areas:'icon_text_bar_reward_action']"
      )}
      style={objectiveCardStyle(index, state)}
      data-testid="quest-row"
      data-quest={quest.id}
      data-state={state}
    >
      <span
        className={cn(
          "border-bronze-rim grid size-12 shrink-0 place-items-center rounded-full border-2 [grid-area:icon] [@media(max-height:500px)]:size-8",
          claimed && "opacity-60 saturate-50"
        )}
        style={{
          background: OBJECTIVES_MEDALLION_FACE,
          boxShadow: OBJECTIVES_MEDALLION_SHADOW,
        }}
      >
        <GlyphIcon
          glyph={row.glyph}
          className="text-gold-light size-7 shrink-0 [@media(max-height:500px)]:size-5"
          style={
            damageType === null
              ? undefined
              : { color: DAMAGE_COLORS[damageType] }
          }
        />
      </span>
      <div className="min-w-0 [grid-area:text]">
        <p
          className={cn(
            "font-display text-[17px] leading-tight font-bold [@media(max-height:500px)]:text-[13px]",
            claimed ? "text-ink-soft" : "text-ink"
          )}
          style={{ textShadow: OBJECTIVES_TITLE_LIFT }}
        >
          {name}
        </p>
        <p className="text-ink-faded mt-0.5 text-[13px] leading-snug text-pretty [@media(max-height:500px)]:line-clamp-2 [@media(max-height:500px)]:text-[11px] [@media(max-height:500px)]:leading-tight">
          {text(row.goal)}
        </p>
      </div>
      <div className="min-w-0 [grid-area:bar]">
        <RowProgress
          current={quest.progress.current}
          target={quest.progress.target}
          testId="quest-progress"
          dimmed={claimed}
        />
      </div>
      <div className="flex justify-end [grid-area:reward]">
        <RewardChip reward={quest.reward} claimed={claimed} />
      </div>
      <div className="flex justify-end [grid-area:action]">
        {state === "inProgress" ? (
          <GameButton
            size="sm"
            onPress={() => onGoTo(destination)}
            aria-label={tr("quests.tab.goToLabel", {
              name,
              place: tr(`town.shortcuts.${destination}`),
            })}
            className="min-h-9 px-1.5 text-[13px] whitespace-nowrap [@media(max-height:500px)]:min-h-7 [@media(max-height:500px)]:text-xs"
            data-testid="quest-go-to"
            data-destination={destination}
          >
            {tr("quests.tab.goTo", {
              place: tr(`town.shortcuts.${destination}`),
            })}
          </GameButton>
        ) : null}
        {state === "completed" ? (
          <ClaimToken
            label={tr("quests.tab.claimLabel", { name })}
            claimId={quest.id}
            testId="quest-claim"
            onClaim={() => onClaim(row)}
          />
        ) : null}
        {claimed ? (
          <ClaimedBadge
            stamp={stamp}
            testId="quest-claimed"
            className="justify-center"
          />
        ) : null}
      </div>
    </li>
  );
};

/**
 * The Daily Quests tab of the Objectives dialog (24 — Quests 3): the Activity of
 * the week on the left page, or on a plaque when the ledger shows one page, the
 * 5 cards of the day, and Claim all. Claim all claims the Completed
 * Daily Quests. Activity rewards are claimed from their chests. The rules own
 * the state; the tab
 * only sends the Claims.
 */
export const DailyQuestsTab = ({
  onClaimed,
  onGoTo,
}: {
  readonly onClaimed: OnClaimed;
  readonly onGoTo: (screen: QuestDestination) => void;
}) => {
  const { tr, text } = useGameText();
  const { rows, bar } = useAtomValue(objectivesViewAtom);
  const spread = useSpread();
  const quests = useQuests();
  const { list, claimAllButton, focusAfterClaim } = useClaimFocus();
  const [stamps, setStamps] = useState<Readonly<Record<string, number>>>({});

  const claim = (row: QuestRow) => {
    if (quests.claim(row.quest.index) === 0) {
      return;
    }
    focusAfterClaim(questFocusAfter(rows, row.quest.index));
    setStamps((current) => ({ ...current, [row.quest.id]: 0 }));
    onClaimed(tr("quests.tab.said.one", { name: text(row.name) }));
  };

  /** The focus stays on the chest: it stays on the page after its Claim. */
  const claimCheckpoint = (activity: number) => {
    const count = quests.claimCheckpointsUpTo(activity);
    if (count === 1) {
      onClaimed(
        tr("quests.tab.said.one", {
          name: tr("quests.tab.checkpointName", { activity }),
        })
      );
    } else if (count > 1) {
      onClaimed(tr("quests.tab.said.many", { count }));
    }
  };

  const claimAll = () => {
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
    onClaimed(tr("quests.tab.said.many", { count }));
  };

  return (
    <div
      className={cn(
        "size-full min-h-0",
        spread ? "grid grid-cols-2" : "flex flex-col"
      )}
    >
      {spread ? (
        <LeftPage>
          <ActivityLadder bar={bar} onClaimCheckpoint={claimCheckpoint} />
        </LeftPage>
      ) : (
        <ActivityBar bar={bar} onClaimCheckpoint={claimCheckpoint} />
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ul
          ref={list}
          tabIndex={-1}
          aria-label={tr("objectives.tabs.daily")}
          className={cn(
            "m-0 flex min-h-0 flex-1 list-none flex-col gap-2 overflow-y-auto overscroll-contain p-3 outline-none [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-1.5",
            spread && "pt-4 pr-4 pl-7"
          )}
          data-testid="quest-list"
        >
          {rows.map((row, index) => (
            <QuestRowView
              key={row.quest.id}
              row={row}
              index={index}
              stamp={stamps[row.quest.id] ?? null}
              onClaim={claim}
              onGoTo={onGoTo}
            />
          ))}
        </ul>
        <ClaimAllBar
          count={rows.filter((row) => row.quest.state === "completed").length}
          button={claimAllButton}
          testId="quests-claim-all"
          onClaimAll={claimAll}
        />
      </div>
    </div>
  );
};
