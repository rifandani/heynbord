import type { AchievementReward, AchievementState } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";

import type { AchievementRow as Row } from "@/features/achievements/achievements";
import { rewardText } from "@/features/achievements/achievements";
import { ACHIEVEMENTS_CHIP_SHADOW } from "@/features/achievements/tokens";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import {
  ClaimedBadge,
  ClaimToken,
  RowProgress,
  STATE_SLOT,
} from "@/features/objectives/components/claim-parts";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

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
      {tr("achievements.tab.reward", { reward: words })}
    </span>
  );
  if (reward.kind === "cosmetic") {
    return (
      <span
        className={cn(
          "flex items-center gap-1.5 text-[13px] leading-tight font-semibold [@media(max-height:500px)]:text-[11px]",
          state === "claimed" ? "text-ink-faded" : "text-gold-deep"
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
        "border-gold-trim/50 bg-night-plate/90 text-cream flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[14px] leading-none font-black tabular-nums",
        "[@media(max-height:500px)]:h-6 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs",
        state === "claimed" && "bg-night-plate/70"
      )}
      style={{ boxShadow: ACHIEVEMENTS_CHIP_SHADOW }}
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

/**
 * One row of the list (Achievements 4): the name and the goal, the reward,
 * and the state: the progress bar ("Not done" for a Feat), Claim, or the
 * Claimed badge. A Completed row is lit, so the rewards to claim stand out
 * in the list. `stamp` is the wait of the badge of a row that the Player
 * claimed while the dialog is open.
 */
export const AchievementRow = ({
  row,
  index,
  stamp,
  onClaim,
}: {
  readonly row: Row;
  /** The place of the row in the list: it inks in 18ms after the row above. */
  readonly index: number;
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
        "border-parchment-rule/70 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 border-b px-5 py-2.5 last:border-b-0",
        "[@media(max-height:500px)]:gap-x-2.5 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-1.5",
        // A Completed row is a lit band across the list.
        state === "completed" && "bg-parchment-lit",
        // The row inks in when the list shows.
        "motion-safe:animate-[achievements-row-ink_260ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
      data-testid="achievement-row"
      data-achievement={id}
      data-state={state}
    >
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
          {tr(`achievements.${id}.goal`)}
        </p>
      </div>
      <RewardChip id={id} reward={achievement.reward} state={state} />
      {state === "inProgress" && progress !== null ? (
        <RowProgress
          current={progress.current}
          target={progress.target}
          testId="achievement-progress"
        />
      ) : null}
      {state === "inProgress" && progress === null ? (
        <span
          className={cn(
            "text-ink-faded flex items-center gap-1.5 text-[13px] font-semibold [@media(max-height:500px)]:text-[11px]",
            STATE_SLOT
          )}
          data-testid="achievement-not-done"
        >
          <GlyphIcon glyph="hourglass" className="size-4 shrink-0" />
          {tr("achievements.tab.notDone")}
        </span>
      ) : null}
      {state === "completed" ? (
        <ClaimToken
          label={tr("achievements.tab.claimLabel", {
            name,
            reward: text(rewardText(achievement.reward, state, coin.words)),
          })}
          claimId={id}
          testId="achievement-claim"
          onClaim={() => onClaim(id)}
        />
      ) : null}
      {state === "claimed" ? (
        <ClaimedBadge stamp={stamp} testId="achievement-claimed" />
      ) : null}
    </li>
  );
};
