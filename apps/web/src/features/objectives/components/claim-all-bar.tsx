import type { RefObject } from "react";

import { GameButton } from "@/core/components/game/game-button";
import { useGameText } from "@/features/battle/use-game-text";

/**
 * The footer of a tab with its Claim all: the one gold action of the tab (The
 * Gold Means Act Rule). It is off when nothing on its tab is ready.
 */
export const ClaimAllBar = ({
  count,
  button,
  testId,
  onClaimAll,
}: {
  /** The rewards that Claim all claims. */
  readonly count: number;
  readonly button: RefObject<HTMLButtonElement | null>;
  readonly testId: string;
  readonly onClaimAll: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <footer className="bg-parchment-deep border-parchment-rule flex shrink-0 items-center justify-end border-t-2 px-4 py-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1">
      <GameButton
        ref={button}
        intent="gold"
        isDisabled={count === 0}
        onPress={onClaimAll}
        aria-label={
          count > 0
            ? tr("objectives.claimAllLabel", { count })
            : `${tr("objectives.claimAll")}, ${tr("objectives.noneToClaim")}`
        }
        className="font-display [@media(max-height:500px)]:min-h-9"
        data-testid={testId}
      >
        {tr("objectives.claimAll")}
        {count > 0 ? (
          <span
            aria-hidden
            className="bg-ink-on-gold text-gold-light grid h-6 min-w-6 place-items-center rounded-full px-1 font-sans text-xs font-black tabular-nums"
          >
            {count}
          </span>
        ) : null}
      </GameButton>
    </footer>
  );
};
