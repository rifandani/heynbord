import { useAtomValue } from "@effect/atom-react";
import { getCard } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";

import type { BattleSession } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import { detailsUnitAtom } from "@/features/battle/battle.atoms";
import { CardDetails } from "@/features/battle/components/card-details";
import { openText } from "@/features/battle/tutorial";
import type { ScreenSide } from "@/features/battle/unit-inspect";
import { detailsSide } from "@/features/battle/unit-inspect";
import type { useBattle } from "@/features/battle/use-battle";

type Battle = ReturnType<typeof useBattle>;

/**
 * The screen side for the Card Details of a Unit. It is set when the Unit
 * opens, so the Card Details do not jump across the screen while the Unit
 * walks. The open Tutorial text has the right side, so then they go left.
 */
const useDockSide = (
  unitId: number | null,
  position: number,
  tutorialOpen: boolean
): ScreenSide => {
  const [dock, setDock] = useState<{
    readonly unitId: number | null;
    readonly side: ScreenSide;
  }>({ unitId: null, side: "left" });
  if (dock.unitId !== unitId) {
    const next = { unitId, side: detailsSide(position) };
    setDock(next);
    return tutorialOpen ? "left" : next.side;
  }
  return tutorialOpen ? "left" : dock.side;
};

/**
 * The Card Details of the inspected Unit on the Board, of either Side (UI-05).
 * They open at the side of the screen away from the Unit, between the Top Bar
 * and the Hand Bar, so they never cover the Unit (DESIGN.md, the Clear Board
 * Rule). The card is at the edge of the screen and the panel faces the Board.
 */
const tutorialIsOpen = (session: BattleSession | null) =>
  openText(session?.tutorial ?? null) !== null;

const unitIdOf = (unit: UnitView | null) => unit?.id ?? null;

const unitPositionOf = (unit: UnitView | null) => unit?.position ?? 0;

const edgeClass = (side: ScreenSide) =>
  side === "left"
    ? "left-[max(0.5rem,env(safe-area-inset-left))]"
    : "right-[max(0.5rem,env(safe-area-inset-right))]";

const facingPanel = (side: ScreenSide): "left" | "right" =>
  side === "left" ? "right" : "left";

export const UnitDetails = ({ battle }: { readonly battle: Battle }) => {
  const unit = useAtomValue(detailsUnitAtom);
  const side = useDockSide(
    unitIdOf(unit),
    unitPositionOf(unit),
    tutorialIsOpen(battle.session)
  );
  if (!unit) {
    return null;
  }
  return (
    <div
      className={cn(
        "fade-in zoom-in-95 animate-in pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 duration-150 motion-reduce:animate-none",
        edgeClass(side)
      )}
      data-testid="unit-details"
      data-unit-id={unit.id}
      data-side={side}
    >
      <CardDetails
        cardId={unit.cardId}
        rank={unit.rank}
        countdown={getCard(unit.cardId).countdown}
        unit={unit}
        panelSide={facingPanel(side)}
      />
    </div>
  );
};
