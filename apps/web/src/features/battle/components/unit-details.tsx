import { useAtomValue } from "@effect/atom-react";
import type { Side } from "@workspace/rules";
import { getCard } from "@workspace/rules";
import { cn } from "cn";

import type { BattleSession } from "@/features/battle/battle-session";
import { detailsUnitAtom } from "@/features/battle/battle.atoms";
import { CardDetails } from "@/features/battle/components/card-details";
import { openText } from "@/features/battle/tutorial";
import type { ScreenSide } from "@/features/battle/unit-inspect";
import { detailsSide } from "@/features/battle/unit-inspect";
import type { useBattle } from "@/features/battle/use-battle";
import { useHandbook } from "@/features/handbook/use-handbook";

type Battle = ReturnType<typeof useBattle>;

/**
 * The Card Details of the inspected Unit on the Board, of either Side (UI-05).
 * They open at the side of the screen of the Unit owner, between the Top Bar
 * and the Hand Bar: the player side at the left, the enemy side at the right.
 * The card is at the edge of the screen and the panel faces the Board. The
 * open Tutorial text has the right side, so then they go left.
 */
const tutorialIsOpen = (session: BattleSession | null) =>
  openText(session?.tutorial ?? null) !== null;

const dockSide = (owner: Side, tutorialOpen: boolean): ScreenSide =>
  tutorialOpen ? "left" : detailsSide(owner);

const edgeClass = (side: ScreenSide) =>
  side === "left"
    ? "left-[max(0.5rem,env(safe-area-inset-left))]"
    : "right-[max(0.5rem,env(safe-area-inset-right))]";

const facingPanel = (side: ScreenSide): "left" | "right" =>
  side === "left" ? "right" : "left";

/**
 * In the keyboard Inspect mode the panel stays while the Player reads it, so
 * Tab goes into it, and its rules terms are links to the Handbook (issue #25).
 * The Card Details of a hover or a long press have no links.
 */
export const UnitDetails = ({ battle }: { readonly battle: Battle }) => {
  const unit = useAtomValue(detailsUnitAtom);
  const handbook = useHandbook();
  if (!unit) {
    return null;
  }
  const side = dockSide(unit.owner, tutorialIsOpen(battle.session));
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
        onEntry={battle.inspecting ? handbook.openAt : undefined}
      />
    </div>
  );
};
