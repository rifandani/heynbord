import { useMemo } from "react";

import { RankGems } from "@/features/battle/components/card-frame";
import { useGameText } from "@/features/battle/use-game-text";
import { RANK_GUIDE_TABLE } from "@/features/handbook/handbook";

const ROW = "border-t border-[#c9b48c]/70";

/** All five Ranks on one page: gems, stat scale, Recall and shared Keyword N (GDD 5.3–5.4). */
export const RankGuide = () => {
  const { tr, locale } = useGameText();
  const formatScale = useMemo(() => {
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return (scale: number) => `×${number.format(scale)}`;
  }, [locale]);
  const formatRecall = useMemo(() => {
    const number = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    });
    return (recall: number) => `${number.format(recall)}%`;
  }, [locale]);

  return (
    <div className="space-y-4" data-testid="handbook-rank-guide">
      <table className="w-full max-w-xl table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[22%]" />
          <col className="w-[22%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-[#c9b48c]/70 text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase">
            <th scope="col" className="py-1 pr-2 text-left font-bold">
              {tr("handbook.rankGuideRankColumn")}
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-bold">
              {tr("handbook.rankGuideScaleColumn")}
            </th>
            <th scope="col" className="py-1 pr-2 text-right font-bold">
              {tr("handbook.rankGuideRecallColumn")}
            </th>
            <th scope="col" className="py-1 text-right font-bold">
              {tr("handbook.rankGuideKeywordColumn")}
            </th>
          </tr>
        </thead>
        <tbody>
          {RANK_GUIDE_TABLE.map(({ rank, scale, recall, keywordN }) => (
            <tr key={rank} className={ROW}>
              <th
                scope="row"
                className="py-1.5 pr-2 text-left font-semibold"
                aria-label={tr(`ranks.${rank}`)}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-[4.5rem] shrink-0 text-sm leading-none"
                    aria-hidden
                  >
                    <RankGems rank={rank} />
                  </span>
                  <span className="min-w-0">{tr(`ranks.${rank}`)}</span>
                </span>
              </th>
              <td className="py-1.5 pr-2 text-right font-medium text-[#3d2e1f] tabular-nums">
                {formatScale(scale)}
              </td>
              <td className="py-1.5 pr-2 text-right font-medium text-[#3d2e1f] tabular-nums">
                {formatRecall(recall)}
              </td>
              <td className="py-1.5 text-right font-medium text-[#3d2e1f] tabular-nums">
                {keywordN}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="max-w-xl text-xs leading-snug text-[#5b4632]">
        {tr("handbook.rankGuideScaleNote")}
      </p>
      <p className="max-w-xl text-xs leading-snug text-[#5b4632]">
        {tr("handbook.rankGuideKeywordNote")}
      </p>
    </div>
  );
};
