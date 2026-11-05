import { coinDenominations } from "@workspace/rules";
import type { CheckpointState, CheckpointView } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
import { Button, Meter, TooltipTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameTooltip } from "@/core/components/game/game-tooltip";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { ChestIcon } from "@/features/campaign/components/campaign-icons";
import { WaxSeal } from "@/features/objectives/components/claim-parts";
import type { ActivityBar as Bar } from "@/features/objectives/objectives";
import { resetCountdowns } from "@/features/objectives/objectives";
import {
  OBJECTIVES_AMBER_FILL,
  OBJECTIVES_AMBER_SHEEN,
  OBJECTIVES_CHEST_AURA,
  OBJECTIVES_CHEST_DROP,
  OBJECTIVES_GAUGE_SHADOW,
  OBJECTIVES_PLAQUE_FACE,
  OBJECTIVES_PLAQUE_SHADOW,
  OBJECTIVES_TEXT_DROP,
} from "@/features/objectives/tokens";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { useNow } from "@/features/seaport/use-seaport";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

/** Claims the reached chest of this Activity and the reached chests below it. */
type OnClaimCheckpoint = (activity: number) => void;

/** The time to the next Daily reset and Weekly reset, each minute (24 — Quests 3). */
const ResetTimes = ({ onPage = false }: { readonly onPage?: boolean }) => {
  const { tr } = useGameText();
  const { now } = useNow();
  const { daily, weekly } = resetCountdowns(now);
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-bold tabular-nums [@media(max-height:500px)]:text-[11px]",
        onPage ? "text-ink-soft" : "text-cream-dim"
      )}
      style={onPage ? undefined : { textShadow: OBJECTIVES_TEXT_DROP }}
    >
      <span className="flex items-center gap-1" data-testid="daily-reset">
        <GlyphIcon
          glyph="hourglass"
          className={cn(
            "size-3.5",
            onPage ? "text-gold-deep" : "text-gold-trim"
          )}
        />
        {tr("quests.tab.dailyReset", {
          hours: daily.days * 24 + daily.hours,
          minutes: daily.minutes,
        })}
      </span>
      <span className="flex items-center gap-1" data-testid="weekly-reset">
        <GlyphIcon
          glyph="clock"
          className={cn(
            "size-3.5",
            onPage ? "text-gold-deep" : "text-gold-trim"
          )}
        />
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
 * The Star chest of a checkpoint, above the gauge. A locked chest is grey with
 * a lock. A reached chest is larger, with a golden light that breathes (still
 * with reduced motion). A claimed chest is open, with the wax seal.
 */
const CheckpointChest = ({ state }: { readonly state: CheckpointState }) => (
  <span className="relative grid size-11 place-items-center [@media(max-height:500px)]:size-8">
    {state === "reached" ? (
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-full motion-safe:animate-[objectives-chest-aura_1600ms_ease-in-out_infinite]"
        style={{ background: OBJECTIVES_CHEST_AURA }}
        data-testid="activity-chest-aura"
      />
    ) : null}
    <span
      className={cn(
        "relative block",
        state === "reached" &&
          "scale-120 motion-safe:animate-[objectives-chest-pulse_1600ms_ease-in-out_infinite]"
      )}
      style={{ filter: OBJECTIVES_CHEST_DROP }}
    >
      <ChestIcon
        earned={state === "claimed"}
        unlocked={state === "reached"}
        className={cn(
          "size-11 [@media(max-height:500px)]:size-8",
          state === "notReached" && "opacity-75 grayscale"
        )}
      />
    </span>
    {state === "notReached" ? (
      <span
        aria-hidden
        className="bg-night-plate border-pewter text-cream-dim absolute -right-0.5 bottom-0 grid size-[18px] place-items-center rounded-full border [@media(max-height:500px)]:size-3.5"
      >
        <GlyphIcon
          glyph="lock"
          className="size-2.5 [@media(max-height:500px)]:size-2"
        />
      </span>
    ) : null}
    {state === "claimed" ? (
      <WaxSeal className="absolute -right-1 -bottom-0.5 size-5 [@media(max-height:500px)]:size-4" />
    ) : null}
  </span>
);

/**
 * The chest of a checkpoint as a button, with a tooltip for its reward. Hover
 * and focus show the tooltip. A press on a reached chest claims it and the
 * reached chests below it. On a locked or a claimed chest, a press shows the
 * tooltip.
 */
const CheckpointButton = ({
  checkpoint,
  className,
  left,
  onClaimCheckpoint,
}: {
  readonly checkpoint: CheckpointView;
  readonly className?: string;
  readonly onClaimCheckpoint: OnClaimCheckpoint;
  /** The place on the plaque gauge. */
  readonly left?: string;
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
        onPress={() => {
          if (state === "reached") {
            onClaimCheckpoint(activity);
          } else {
            setOpen((value) => !value);
          }
        }}
        aria-label={
          state === "reached"
            ? tr("quests.tab.claimCheckpointLabel", {
                activity,
                coin: coin.words(reward.coin),
                essence: reward.essence,
              })
            : tr("quests.tab.checkpointLabel", {
                activity,
                state: tr(`quests.tab.checkpointStates.${state}`),
                coin: coin.words(reward.coin),
                essence: reward.essence,
              })
        }
        className={cn(
          "data-[focus-visible]:ring-focus-cream cursor-pointer rounded-lg outline-none data-[focus-visible]:ring-4",
          className
        )}
        style={left === undefined ? undefined : { left }}
        data-testid={`activity-checkpoint-${activity}`}
        data-state={state}
      >
        <CheckpointChest state={state} />
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

/** One Activity checkpoint on the plaque gauge: its chest, a bronze pin, and its Activity under the groove. */
const Checkpoint = ({
  checkpoint,
  max,
  onClaimCheckpoint,
}: {
  readonly checkpoint: CheckpointView;
  readonly max: number;
  readonly onClaimCheckpoint: OnClaimCheckpoint;
}) => {
  const { activity, state } = checkpoint;
  const left = `${(activity / max) * 100}%`;
  return (
    <>
      <span
        aria-hidden
        className="bg-bronze-rim absolute top-[calc(100%-2.25rem)] z-10 h-[26px] w-0.5 -translate-x-1/2 [@media(max-height:500px)]:top-[calc(100%-1.625rem)] [@media(max-height:500px)]:h-[18px]"
        style={{ left }}
      />
      <span
        aria-hidden
        className={cn(
          "absolute bottom-0 -translate-x-1/2 text-[11px] leading-none font-black tabular-nums [@media(max-height:500px)]:text-[10px]",
          state === "notReached" ? "text-cream-dim" : "text-gold-light"
        )}
        style={{ left, textShadow: OBJECTIVES_TEXT_DROP }}
      >
        {activity}
      </span>
      <CheckpointButton
        checkpoint={checkpoint}
        left={left}
        className="absolute top-0 -translate-x-1/2"
        onClaimCheckpoint={onClaimCheckpoint}
      />
    </>
  );
};

/** One step of the ladder: the chest on the gauge, its Activity and its reward in words. */
const LadderStep = ({
  checkpoint,
  max,
  onClaimCheckpoint,
}: {
  readonly checkpoint: CheckpointView;
  readonly max: number;
  readonly onClaimCheckpoint: OnClaimCheckpoint;
}) => {
  const { tr } = useGameText();
  const coin = useCoinFormat();
  const { activity, reward, state } = checkpoint;
  return (
    <li
      className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-4"
      style={{ top: `${(1 - activity / max) * 100}%` }}
    >
      <CheckpointButton
        checkpoint={checkpoint}
        className="relative shrink-0"
        onClaimCheckpoint={onClaimCheckpoint}
      />
      <span className="border-parchment-rule flex min-w-0 flex-1 items-center justify-between gap-3 border-b pb-1">
        <span
          className={cn(
            "font-display text-base font-bold",
            state === "notReached" ? "text-ink-soft" : "text-ink"
          )}
        >
          {tr("quests.tab.checkpointName", { activity })}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex shrink-0 items-center gap-2 text-sm font-black tabular-nums",
            state === "claimed" ? "text-ink-soft" : "text-ink"
          )}
        >
          <CoinAmount
            parts={coinDenominations(reward.coin)}
            format={coin.format}
            tone="light"
          />
          <span className="flex items-center gap-1">
            <BalanceIcon kind="essence" className="size-4" />
            {coin.format(reward.essence)}
          </span>
        </span>
      </span>
    </li>
  );
};

/**
 * The Activity of the week on the left page of the ledger: the count, the time
 * to the next resets, and a gauge that fills up the page with its 5 chests.
 * Each chest has its reward beside it, so the Player reads the week at one
 * look. One Claim button claims all reached checkpoints, and a reached chest
 * claims itself and the reached chests below it.
 */
export const ActivityLadder = ({
  bar,
  onClaim,
  onClaimCheckpoint,
}: {
  readonly bar: Bar;
  readonly onClaim: () => void;
  readonly onClaimCheckpoint: OnClaimCheckpoint;
}) => {
  const { tr } = useGameText();
  const { activity, max, checkpoints, claimable } = bar;
  return (
    <section
      aria-label={tr("quests.tab.activity")}
      className="flex min-h-0 flex-1 flex-col"
      data-testid="activity-bar"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-ink text-3xl font-black">
          {tr("quests.tab.activity")}{" "}
          <span
            className="font-sans text-2xl tabular-nums"
            data-testid="activity-count"
          >
            {tr("objectives.count", { current: activity, target: max })}
          </span>
        </h3>
        <GameButton
          size="sm"
          intent="gold"
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
      <div className="mt-1">
        <ResetTimes onPage />
      </div>
      <div className="relative mt-9 mb-5 min-h-0 flex-1">
        <Meter
          value={activity}
          maxValue={max}
          aria-label={tr("quests.tab.activity")}
          valueLabel={tr("objectives.progressLabel", {
            current: activity,
            target: max,
          })}
          className="absolute inset-y-0 left-[13px] w-[18px]"
        >
          {({ percentage }) => (
            <span
              className="bg-night-plate border-bronze-deep flex size-full flex-col justify-end overflow-hidden rounded-full border-2"
              style={{ boxShadow: OBJECTIVES_GAUGE_SHADOW }}
            >
              <span
                className="block w-full rounded-full"
                style={{
                  height: `${percentage}%`,
                  background: OBJECTIVES_AMBER_FILL,
                }}
              />
            </span>
          )}
        </Meter>
        <ol className="m-0 list-none p-0">
          {/* The highest step is first, so the focus goes down the page. */}
          {checkpoints.toReversed().map((checkpoint) => (
            <LadderStep
              key={checkpoint.activity}
              checkpoint={checkpoint}
              max={max}
              onClaimCheckpoint={onClaimCheckpoint}
            />
          ))}
        </ol>
      </div>
    </section>
  );
};

/**
 * The Activity plaque at the top of the Daily Quests tab (24 — Quests 3): a
 * dark wood plaque on the parchment with the Activity of the week, the gauge
 * with its 5 chests, the time to the next resets, and one Claim button for all
 * reached checkpoints. The button is off when no checkpoint is ready. A reached
 * chest claims itself and the reached chests below it.
 */
export const ActivityBar = ({
  bar,
  onClaim,
  onClaimCheckpoint,
}: {
  readonly bar: Bar;
  readonly onClaim: () => void;
  readonly onClaimCheckpoint: OnClaimCheckpoint;
}) => {
  const { tr } = useGameText();
  const { activity, max, checkpoints, claimable } = bar;
  return (
    <section
      aria-label={tr("quests.tab.activity")}
      className="border-wood-edge text-cream mx-3 mt-3 flex shrink-0 flex-col gap-0.5 rounded-xl border-2 px-4 pt-2 pb-2 [@media(max-height:500px)]:mx-1.5 [@media(max-height:500px)]:mt-1.5 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1"
      style={{
        background: OBJECTIVES_PLAQUE_FACE,
        boxShadow: OBJECTIVES_PLAQUE_SHADOW,
      }}
      data-testid="activity-bar"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p
          className="font-display text-cream text-lg font-black [@media(max-height:500px)]:text-sm"
          style={{ textShadow: OBJECTIVES_TEXT_DROP }}
        >
          {tr("quests.tab.activity")}{" "}
          <span
            className="text-gold-light font-sans tabular-nums"
            data-testid="activity-count"
          >
            {tr("objectives.count", { current: activity, target: max })}
          </span>
        </p>
        <ResetTimes />
      </div>
      <div className="flex items-center gap-4 [@media(max-height:500px)]:gap-2">
        {/* The space at the right keeps the last chest in the plaque. */}
        <div className="min-w-0 flex-1 pr-6 [@media(max-height:500px)]:pr-4">
          <div className="relative h-[78px] [@media(max-height:500px)]:h-[56px]">
            <Meter
              value={activity}
              maxValue={max}
              aria-label={tr("quests.tab.activity")}
              valueLabel={tr("objectives.progressLabel", {
                current: activity,
                target: max,
              })}
              className="absolute inset-x-0 top-[calc(100%-2.25rem)] [@media(max-height:500px)]:top-[calc(100%-1.625rem)]"
            >
              {({ percentage }) => (
                <span
                  className="bg-night-plate border-bronze-deep block h-[22px] overflow-hidden rounded-full border-2 [@media(max-height:500px)]:h-3.5"
                  style={{ boxShadow: OBJECTIVES_GAUGE_SHADOW }}
                >
                  <span
                    className="relative block h-full overflow-hidden rounded-full"
                    style={{
                      width: `${percentage}%`,
                      background: OBJECTIVES_AMBER_FILL,
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 hidden w-1/3 motion-safe:block motion-safe:animate-[objectives-gauge-flow_3200ms_linear_infinite]"
                      style={{ background: OBJECTIVES_AMBER_SHEEN }}
                    />
                  </span>
                </span>
              )}
            </Meter>
            {checkpoints.map((checkpoint) => (
              <Checkpoint
                key={checkpoint.activity}
                checkpoint={checkpoint}
                max={max}
                onClaimCheckpoint={onClaimCheckpoint}
              />
            ))}
          </div>
        </div>
        <GameButton
          size="sm"
          intent="gold"
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
