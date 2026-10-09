import type { RankId } from "@workspace/rules";
import { RANKS } from "@workspace/rules";

import { useGameText } from "@/features/battle/use-game-text";

/**
 * The text of a Pack Guarantee, for example "Rare or higher in 8 Packs". The
 * highest Rank has no "or higher", and Pack 1 is "the next Pack".
 */
export const useGuaranteeText = () => {
  const { tr } = useGameText();
  return (rank: RankId, packs: number): string => {
    const top = rank === RANKS.at(-1);
    const next = packs <= 1;
    const key = top
      ? next
        ? "packs.guarantee.topNext"
        : "packs.guarantee.top"
      : next
        ? "packs.guarantee.next"
        : "packs.guarantee.inPacks";
    return tr(key, { rank: tr(`ranks.${rank}`), count: packs });
  };
};
