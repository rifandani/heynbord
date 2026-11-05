import type { AchievementReward, AchievementState } from "@workspace/rules";
import { coinDenominations } from "@workspace/rules";
import { cn } from "cn";

import type { AchievementRow as Row } from "@/features/achievements/achievements";
import {
  achievementFrame,
  rewardText,
} from "@/features/achievements/achievements";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import {
  ClaimedBadge,
  ClaimToken,
  FloorFull,
  FloorProgress,
  objectiveCard,
  objectiveCardStyle,
  RewardTray,
  STATE_SLOT,
} from "@/features/objectives/components/claim-parts";
import {
  OBJECTIVES_MEDALLION_FACE,
  OBJECTIVES_MEDALLION_SHADOW,
  OBJECTIVES_TEXT_DROP,
  OBJECTIVES_TITLE_LIFT,
} from "@/features/objectives/tokens";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";

/** The four-point star of the Heynbord emblem, for a corner of a frame. */
const CORNER_STAR = "M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z";

const TOP_CORNERS = ["top-1 left-1", "top-1 right-1"];
const BOTTOM_CORNERS = ["bottom-1 left-1", "bottom-1 right-1"];

/**
 * The stars at the corners of a silver or gold frame. It is decoration. A card
 * with a floor has them only at the top: the floor holds the count.
 */
const FrameCorners = ({
  frame,
  floor,
}: {
  readonly frame: "silver" | "gold";
  readonly floor: boolean;
}) => (
  <>
    {[...TOP_CORNERS, ...(floor ? [] : BOTTOM_CORNERS)].map((corner) => (
      <svg
        key={corner}
        aria-hidden
        viewBox="-10 -10 20 20"
        className={cn(
          "pointer-events-none absolute size-2.5 [@media(max-height:500px)]:hidden",
          corner,
          frame === "gold" ? "text-gold-trim" : "text-stone"
        )}
      >
        <path d={CORNER_STAR} fill="currentColor" />
      </svg>
    ))}
  </>
);

/**
 * The reward of a card (Achievements 1.6). Heynstones, Coin and Essence sit in
 * the Reward Tray with the icons of the Balance Plate, so the Player sees where
 * the reward goes. A Cosmetic has no balance: it gets a badge with the crown
 * medallion and "Earn-only Cosmetic", and after its Claim, "Comes in a later
 * update". The screen reader reads the reward in words.
 */
const RewardChip = ({
  reward,
  state,
  surface,
}: {
  readonly reward: AchievementReward;
  readonly state: AchievementState;
  readonly surface: "paper" | "plate";
}) => {
  const { tr, text } = useGameText();
  const coin = useCoinFormat();
  const claimed = state === "claimed";
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
          "flex shrink-0 items-center gap-2 text-[13px] leading-tight font-bold [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:text-[11px]",
          claimed ? "text-cream-dim" : "text-cream"
        )}
      >
        <span
          className={cn(
            "border-gold-trim grid size-11 shrink-0 place-items-center rounded-full border-2 [@media(max-height:500px)]:size-7",
            claimed && "opacity-60 saturate-50"
          )}
          style={{
            background: OBJECTIVES_MEDALLION_FACE,
            boxShadow: OBJECTIVES_MEDALLION_SHADOW,
          }}
          data-testid="achievement-cosmetic-badge"
        >
          <GlyphIcon
            glyph="crown"
            className="text-ready-gold size-6 [@media(max-height:500px)]:size-4"
          />
        </span>
        <span aria-hidden className="max-w-20">
          {words}
        </span>
        {spoken}
      </span>
    );
  }
  return (
    <RewardTray claimed={claimed} surface={surface}>
      <span aria-hidden className="flex items-center gap-1">
        {reward.kind === "coin" ? (
          <CoinAmount
            parts={coinDenominations(reward.amount)}
            format={coin.format}
            tone={claimed && surface === "paper" ? "light" : "dark"}
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
    </RewardTray>
  );
};

/**
 * One card of the list (Achievements 4): the name and the goal, the state, the
 * reward at the right edge, and the progress in the floor of the card. An In
 * progress Feat shows "Not done" and has no floor. The frame says what the
 * Achievement is worth: gold for an earn-only Cosmetic, silver for a Feat.
 * `stamp` is the wait of the stamp of a card that the Player claimed while the
 * dialog is open. Each card is its own grid, so the reward column has a fixed
 * width that holds the Cosmetic badge: the states of all cards stay in line.
 */
export const AchievementRow = ({
  row,
  index,
  stamp,
  onClaim,
}: {
  readonly row: Row;
  /** The place of the card in the list, for the cascade. */
  readonly index: number;
  readonly stamp: number | null;
  readonly onClaim: (id: string) => void;
}) => {
  const { tr, text } = useGameText();
  const coin = useCoinFormat();
  const { achievement, state, progress } = row;
  const { id } = achievement;
  const name = tr(`achievements.${id}.name`);
  const frame = achievementFrame(achievement);
  const dark = frame === "gold";
  const claimed = state === "claimed";
  const feat = achievement.goal.kind === "feat";
  let titleTone = "text-ink";
  if (dark) {
    titleTone = claimed ? "text-cream-dim" : "text-cream";
  } else if (claimed) {
    titleTone = "text-ink-soft";
  }
  return (
    <li
      className={objectiveCard({ state, frame })}
      style={objectiveCardStyle(index, state, frame)}
      data-testid="achievement-row"
      data-achievement={id}
      data-state={state}
      data-frame={frame}
    >
      {frame === "plain" ? null : <FrameCorners frame={frame} floor={!feat} />}
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto_8.5rem] items-center gap-x-3 px-4 py-2",
          "[@media(max-height:500px)]:grid-cols-[minmax(0,1fr)_auto_7.5rem] [@media(max-height:500px)]:gap-x-2 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-1"
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "font-display leading-tight font-bold",
              dark
                ? "text-xl [@media(max-height:500px)]:text-sm"
                : "text-[17px] [@media(max-height:500px)]:text-[13px]",
              titleTone
            )}
            style={{
              textShadow: dark ? OBJECTIVES_TEXT_DROP : OBJECTIVES_TITLE_LIFT,
            }}
          >
            {name}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[13px] leading-snug text-pretty [@media(max-height:500px)]:line-clamp-2 [@media(max-height:500px)]:text-[11px] [@media(max-height:500px)]:leading-tight",
              dark ? "text-cream-dim" : "text-ink-faded"
            )}
          >
            {tr(`achievements.${id}.goal`)}
          </p>
        </div>
        <div className="flex justify-end">
          {state === "inProgress" && feat ? (
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
              className={STATE_SLOT}
            />
          ) : null}
          {claimed ? (
            <ClaimedBadge
              stamp={stamp}
              testId="achievement-claimed"
              className={cn(
                STATE_SLOT,
                dark ? "text-cream-dim" : "text-ink-soft"
              )}
            />
          ) : null}
        </div>
        <span className="flex justify-end">
          <RewardChip
            reward={achievement.reward}
            state={state}
            surface={dark ? "plate" : "paper"}
          />
        </span>
      </div>
      {progress === null ? null : (
        <FloorProgress
          current={progress.current}
          target={progress.target}
          testId="achievement-progress"
        />
      )}
      {state !== "inProgress" && !feat ? <FloorFull dimmed={claimed} /> : null}
    </li>
  );
};
