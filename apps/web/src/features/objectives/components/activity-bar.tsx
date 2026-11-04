import { coinDenominations } from "@workspace/rules";
import type { CheckpointView } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
import { Button, Meter, TooltipTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameTooltip } from "@/core/components/game/game-tooltip";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { ChestIcon } from "@/features/campaign/components/campaign-icons";
import type { ActivityBar as Bar } from "@/features/objectives/objectives";
import { resetCountdowns } from "@/features/objectives/objectives";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { useNow } from "@/features/seaport/use-seaport";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

/** The time to the next Daily reset and Weekly reset, each minute (24 — Quests 3). */
const ResetTimes = () => {
  const { tr } = useGameText();
  const { now } = useNow();
  const { daily, weekly } = resetCountdowns(now);
  return (
    <p className="text-ink-soft flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-bold tabular-nums [@media(max-height:500px)]:text-[11px]">
      <span className="flex items-center gap-1" data-testid="daily-reset">
        <GlyphIcon glyph="hourglass" className="size-3.5" />
        {tr("quests.tab.dailyReset", {
          hours: daily.days * 24 + daily.hours,
          minutes: daily.minutes,
        })}
      </span>
      <span data-testid="weekly-reset">
        {weekly.days > 0
          ? tr("quests.tab.weeklyResetDays", {
              days: weekly.days,
              hours: weekly.hours,
            })
          : tr("quests.tab.weeklyResetHours", {
              hours: weekly.hours,
              minutes: weekly.minutes,
            })}
      </span>
    </p>
  );
};

/**
 * One Activity checkpoint on the bar: the Star chest icon at its place, and a
 * tooltip with its reward. Hover, focus and a tap show the tooltip. It is not
 * a Claim: the Claim button beside the bar claims all reached checkpoints.
 */
const Checkpoint = ({
  checkpoint,
  max,
}: {
  readonly checkpoint: CheckpointView;
  readonly max: number;
}) => {
  const { tr } = useGameText();
  const coin = useCoinFormat();
  const [open, setOpen] = useState(false);
  const { activity, reward, state } = checkpoint;
  return (
    <TooltipTrigger
      isOpen={open}
      onOpenChange={setOpen}
      delay={200}
      shouldCloseOnPress={false}
    >
      <Button
        onPress={() => setOpen((value) => !value)}
        aria-label={tr("quests.tab.checkpointLabel", {
          activity,
          state: tr(`quests.tab.checkpointStates.${state}`),
          coin: coin.words(reward.coin),
          essence: reward.essence,
        })}
        className="data-[focus-visible]:ring-focus-cream absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-lg outline-none data-[focus-visible]:ring-4 [@media(max-height:500px)]:size-8"
        style={{ left: `${(activity / max) * 100}%` }}
        data-testid={`activity-checkpoint-${activity}`}
        data-state={state}
      >
        <ChestIcon
          earned={state === "claimed"}
          unlocked={state === "reached"}
          className={cn(
            "size-9 [@media(max-height:500px)]:size-7",
            state === "notReached" && "opacity-70"
          )}
        />
      </Button>
      <GameTooltip
        placement="bottom"
        className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece rounded-lg border-2 px-2.5 py-1 text-center text-xs font-semibold"
        data-testid={`activity-tooltip-${activity}`}
      >
        <span className="block font-bold">
          {tr("quests.tab.checkpointName", { activity })}
        </span>
        <span aria-hidden className="flex items-center justify-center gap-2">
          <CoinAmount
            parts={coinDenominations(reward.coin)}
            format={coin.format}
          />
          <span className="flex items-center gap-1">
            <BalanceIcon kind="essence" className="size-3.5" />
            {coin.format(reward.essence)}
          </span>
        </span>
      </GameTooltip>
    </TooltipTrigger>
  );
};

/**
 * The Activity bar at the top of the Daily Quests tab (24 — Quests 3): the
 * Activity of the week, the 5 checkpoints, the time to the next resets, and
 * one Claim button for all reached checkpoints. The button is off when no
 * checkpoint is ready.
 */
export const ActivityBar = ({
  bar,
  onClaim,
}: {
  readonly bar: Bar;
  readonly onClaim: () => void;
}) => {
  const { tr } = useGameText();
  const { activity, max, checkpoints, claimable } = bar;
  return (
    <section
      aria-label={tr("quests.tab.activity")}
      className="border-parchment-rule flex shrink-0 flex-col gap-1 border-b-2 px-4 pt-2.5 pb-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1"
      data-testid="activity-bar"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-display text-ink text-base font-black [@media(max-height:500px)]:text-sm">
          {tr("quests.tab.activity")}{" "}
          <span className="tabular-nums" data-testid="activity-count">
            {tr("objectives.count", { current: activity, target: max })}
          </span>
        </p>
        <ResetTimes />
      </div>
      <div className="flex items-center gap-4 [@media(max-height:500px)]:gap-2">
        {/* The space at the left and at the right keeps the last checkpoint in the row. */}
        <div className="relative h-11 min-w-0 flex-1 pr-5 [@media(max-height:500px)]:h-8">
          <div className="relative size-full">
            <Meter
              value={activity}
              maxValue={max}
              aria-label={tr("quests.tab.activity")}
              valueLabel={tr("objectives.progressLabel", {
                current: activity,
                target: max,
              })}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2"
            >
              {({ percentage }) => (
                <span className="bg-plate-socket block h-2.5 overflow-hidden rounded-full [@media(max-height:500px)]:h-2">
                  <span
                    className="from-gold to-gold-light block h-full rounded-full bg-gradient-to-r"
                    style={{ width: `${percentage}%` }}
                  />
                </span>
              )}
            </Meter>
            {checkpoints.map((checkpoint) => (
              <Checkpoint
                key={checkpoint.activity}
                checkpoint={checkpoint}
                max={max}
              />
            ))}
          </div>
        </div>
        <GameButton
          size="sm"
          isDisabled={claimable === 0}
          onPress={onClaim}
          aria-label={
            claimable > 0
              ? tr("quests.tab.claimCheckpointsLabel", { count: claimable })
              : `${tr("objectives.claim")}, ${tr("objectives.noneToClaim")}`
          }
          className="shrink-0"
          data-testid="activity-claim"
        >
          {tr("objectives.claim")}
        </GameButton>
      </div>
    </section>
  );
};
