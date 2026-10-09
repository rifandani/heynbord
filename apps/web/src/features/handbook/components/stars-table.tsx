import { cn } from "cn";

import { useGameText } from "@/features/battle/use-game-text";
import { StarRow } from "@/features/campaign/components/campaign-icons";
import { STARS_TABLE } from "@/features/handbook/handbook";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

/** Each Star count and its win condition (GDD 4.11). */
export const StarsTable = () => {
  const { tr, text } = useGameText();
  return (
    <table
      className="w-full max-w-md border-collapse text-sm"
      data-testid="handbook-stars-table"
    >
      <caption className={cn(LABEL, "pb-1 text-left")}>
        {tr("handbook.starsTable")}
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{tr("handbook.starsColumn")}</th>
          <th scope="col">{tr("handbook.starsConditionColumn")}</th>
        </tr>
      </thead>
      <tbody>
        {STARS_TABLE.map(({ count, rule }) => (
          <tr key={count} className="border-t border-[#c9b48c]/70">
            <th scope="row" className="py-1.5 pr-3 align-top">
              <StarRow stars={count} tone="parchment" starClassName="size-4" />
              <span className="sr-only">
                {tr("battle.starsLabel", { count })}
              </span>
            </th>
            <td className="py-1.5 leading-snug font-medium text-[#3d2e1f]">
              {text(rule)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
