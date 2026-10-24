import { cn } from "cn";

import { useGameText } from "@/features/battle/use-game-text";

/** The "Replay" badge: the Battle on the screen is a Replay, not a Live Battle. */
export const ReplayBadge = ({ className }: { readonly className?: string }) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "shrink-0 rounded border border-[#2a1d12] bg-[#2a1d12] px-1.5 py-0.5 font-sans text-xs leading-none font-bold tracking-wide text-[#ffd75a] uppercase",
        className
      )}
      data-testid="replay-badge"
    >
      {tr("replay.badge")}
    </span>
  );
};
