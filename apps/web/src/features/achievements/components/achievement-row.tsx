import type { AchievementReward, AchievementState } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { Button, Meter } from "react-aria-components";

import type { AchievementRow as Row } from "@/features/achievements/achievements";
import { rewardText } from "@/features/achievements/achievements";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

/** The width of the state slot at the right of each row: the bar, Claim or the seal. */
const SLOT =
  "w-40 [@media(max-height:500px)]:w-[7.5rem] max-[720px]:w-[7.5rem]";

/**
 * The reward of a row (Achievements 1.6). Heynstones, Coin and Essence sit on
 * a small Night Plate chip with the icons of the Balance Plate, so the
 * Player sees where the reward goes. A Cosmetic has no balance: it says
 * "Earn-only Cosmetic", and after its Claim, "Comes in a later update".
 * The screen reader reads the reward in words.
 */
const RewardChip = ({
  id,
  reward,
  state,
}: {
  readonly id: string;
  readonly reward: AchievementReward;
  readonly state: AchievementState;
}) => {
  const { tr, text } = useGameText();
  const coin = useCoinFormat();
  const words = text(rewardText(reward, state, coin.words));
  const spoken = (
    <span className="sr-only">
      {tr("achievements.screen.reward", { reward: words })}
    </span>
  );
  if (reward.kind === "cosmetic") {
    return (
      <span
        className={cn(
          "flex items-center gap-1.5 text-[13px] leading-tight font-semibold [@media(max-height:500px)]:text-[11px]",
          state === "claimed" ? "text-[#6b5238]" : "text-[#7a5310]"
        )}
        data-reward-of={id}
        data-reward="cosmetic"
      >
        <GlyphIcon
          glyph="crown"
          className="size-4 shrink-0 [@media(max-height:500px)]:size-3.5"
        />
        <span
          aria-hidden
          className="max-w-32 [@media(max-height:500px)]:max-w-24"
        >
          {words}
        </span>
        {spoken}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#e9c46a]/50 bg-[#1c140e]/90 px-2.5 text-[14px] leading-none font-black text-[#fff6df] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.3)]",
        "[@media(max-height:500px)]:h-6 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs",
        state === "claimed" && "bg-[#1c140e]/70"
      )}
      data-reward-of={id}
      data-reward={reward.kind}
    >
      <span aria-hidden className="flex items-center gap-1">
        {reward.kind === "coin" ? (
          <CoinAmount
            parts={coinDenominations(reward.amount)}
            format={coin.format}
          />
        ) : (
          <>
            <BalanceIcon
              kind={reward.kind}
              className="size-[18px] shrink-0 [@media(max-height:500px)]:size-3.5"
            />
            {coin.format(reward.amount)}
          </>
        )}
      </span>
      {spoken}
    </span>
  );
};

/** The progress bar of an In progress row: a socket with a gold fill, and "41 / 65". */
const ProgressBar = ({
  current,
  target,
}: {
  readonly current: number;
  readonly target: number;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  return (
    <Meter
      value={current}
      maxValue={target}
      aria-label={tr("achievements.screen.progress")}
      valueLabel={tr("achievements.screen.progressLabel", {
        current: format(current),
        target: format(target),
      })}
      className={cn("flex items-center gap-2", SLOT)}
      data-testid="achievement-progress"
      data-current={current}
      data-target={target}
    >
      {({ percentage }) => (
        <>
          <span className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] [@media(max-height:500px)]:h-2">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#e2a93b] to-[#ffe08a]"
              style={{ width: `${percentage}%` }}
            />
          </span>
          <span
            aria-hidden
            className="shrink-0 text-[13px] font-black whitespace-nowrap text-[#2a1d12] tabular-nums [@media(max-height:500px)]:text-[11px]"
          >
            {tr("achievements.screen.count", {
              done: format(current),
              total: format(target),
            })}
          </span>
        </>
      )}
    </Meter>
  );
};

/**
 * The check seal of a Claimed row: a gold seal with the check mark, and
 * "Claimed". It stamps onto the parchment when the Player claims the row on
 * this visit (`stamp` is its wait in ms), and it is still when the row was
 * Claimed before. With reduced motion, it shows at once.
 */
const ClaimedSeal = ({ stamp }: { readonly stamp: number | null }) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn("flex items-center gap-2", SLOT)}
      data-testid="achievement-claimed"
    >
      <span
        aria-hidden
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full border-2 border-[#7a5310] bg-[radial-gradient(circle_at_35%_30%,#ffe08a,#e2a93b_70%)] text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.35)] [@media(max-height:500px)]:size-6",
          stamp !== null &&
            "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
        style={
          stamp === null
            ? undefined
            : ({ animationDelay: `${stamp}ms` } satisfies CSSProperties)
        }
      >
        <GlyphIcon
          glyph="check"
          className="size-4 [@media(max-height:500px)]:size-3"
        />
      </span>
      <span className="text-[13px] font-bold text-[#5b4632] [@media(max-height:500px)]:text-[11px]">
        {tr("achievements.screen.claimed")}
      </span>
    </span>
  );
};

/**
 * One row of the roll (Achievements 4): the name and the goal, the reward,
 * and the state: the progress bar ("Not done" for a Feat), Claim, or the
 * check seal. A Completed row is lit, so the rewards to claim stand out on
 * the roll. `stamp` is the wait of the seal of a row that this visit claimed.
 */
export const AchievementRow = ({
  row,
  stamp,
  onClaim,
}: {
  readonly row: Row;
  readonly stamp: number | null;
  readonly onClaim: (id: string) => void;
}) => {
  const { tr, text } = useGameText();
  const coin = useCoinFormat();
  const { achievement, state, progress } = row;
  const { id } = achievement;
  const name = tr(`achievements.${id}.name`);
  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 border-b border-[#c9b48c]/70 px-5 py-2.5 last:border-b-0",
        "[@media(max-height:500px)]:gap-x-2.5 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-1.5",
        // A Completed row is a lit band across the roll.
        state === "completed" && "bg-[#fff3d1]"
      )}
      data-testid="achievement-row"
      data-achievement={id}
      data-state={state}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "font-display text-[15px] leading-tight font-bold [@media(max-height:500px)]:text-[13px]",
            state === "claimed" ? "text-[#5b4632]" : "text-[#2a1d12]"
          )}
        >
          {name}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[13px] leading-snug text-pretty [@media(max-height:500px)]:line-clamp-2 [@media(max-height:500px)]:text-[11px] [@media(max-height:500px)]:leading-tight",
            state === "claimed" ? "text-[#6b5238]" : "text-[#5b4632]"
          )}
        >
          {tr(`achievements.${id}.goal`)}
        </p>
      </div>
      <RewardChip id={id} reward={achievement.reward} state={state} />
      {state === "inProgress" && progress !== null ? (
        <ProgressBar current={progress.current} target={progress.target} />
      ) : null}
      {state === "inProgress" && progress === null ? (
        <span
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-semibold text-[#6b5238] [@media(max-height:500px)]:text-[11px]",
            SLOT
          )}
          data-testid="achievement-not-done"
        >
          <GlyphIcon glyph="hourglass" className="size-4 shrink-0" />
          {tr("achievements.screen.notDone")}
        </span>
      ) : null}
      {state === "completed" ? (
        <span className={cn("flex", SLOT)}>
          <Button
            onPress={() => onClaim(id)}
            aria-label={tr("achievements.screen.claimLabel", {
              name,
              reward: text(rewardText(achievement.reward, state, coin.words)),
            })}
            className={cn(
              "flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] py-0 pr-3.5 pl-1.5 text-[13px] font-bold text-[#2a1a05] outline-none select-none",
              "shadow-[0_2px_0_rgba(0,0,0,0.4)] transition-[transform,filter] duration-100",
              "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:brightness-110 data-[pressed]:translate-y-px data-[pressed]:shadow-[0_1px_0_rgba(0,0,0,0.4)]",
              "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:pr-2.5 [@media(max-height:500px)]:text-xs"
            )}
            data-testid="achievement-claim"
            data-claim={id}
          >
            {/* The four-point star of the Heynbord emblem, struck on the token. */}
            <span
              aria-hidden
              className="grid size-5 place-items-center rounded-full bg-[#2a1a05] text-[#ffe08a] [@media(max-height:500px)]:size-4"
            >
              <svg
                viewBox="-10 -10 20 20"
                className="size-3 [@media(max-height:500px)]:size-2.5"
              >
                <path
                  d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            {tr("achievements.screen.claim")}
          </Button>
        </span>
      ) : null}
      {state === "claimed" ? <ClaimedSeal stamp={stamp} /> : null}
    </li>
  );
};
