import { useAtom, useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import { useEffect, useState } from "react";

import type { BattleOptions } from "@/features/battle/battle-session";
import { useGameText } from "@/features/battle/use-game-text";
import { FloorPanel } from "@/features/heynspire/components/floor-panel";
import { FloorRail } from "@/features/heynspire/components/floor-rail";
import { TowerScene } from "@/features/heynspire/components/tower-scene";
import type { NewWins } from "@/features/heynspire/heynspire";
import { climb, floorState, newWins } from "@/features/heynspire/heynspire";
import {
  floorPanelAtom,
  seenFloorsWonAtom,
} from "@/features/heynspire/heynspire.atoms";
import { profileAtom } from "@/features/profile/profile.atoms";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { balancesAtom } from "@/features/town/town.atoms";

/** The Floor stone of `floor` on the screen, where its Floor Panel comes out. */
const stoneOf = (floor: number) =>
  document.querySelector(
    `[data-flight] [data-open='true'] [data-floor='${floor}']`
  );

/**
 * The wins that came since the screen last showed (`newWins`). They are
 * found in the render, so the stones stamp and wake on their first paint.
 * They change with the won Floors, not with the seen count.
 */
const useNewWins = (floorsWon: number): NewWins => {
  const [seen, setSeen] = useAtom(seenFloorsWonAtom);
  const [wins, setWins] = useState(() => ({
    floorsWon,
    ...newWins(floorsWon, seen),
  }));
  if (wins.floorsWon !== floorsWon) {
    setWins({ floorsWon, ...newWins(floorsWon, seen) });
  }
  useEffect(() => {
    setSeen(floorsWon);
  }, [floorsWon, setSeen]);
  return wins;
};

/**
 * The Heynspire screen (GDD 8.2, 11.1): the tower. The Balance Plate is at
 * the top. Under it, the Floor rail: 5 Flights of 10 Floors, with the Flight
 * of the Current Floor open as a stair to its Boss
 * landing. A press on the Current Floor or on a won Floor opens its Floor
 * Panel. The Current stone has the focus when the screen opens, so a climb
 * is Town, tower, Enter, Enter. "Next Floor" on a result opens the screen
 * with the Floor Panel of the next Floor.
 */
export const HeynspireScreen = ({
  onStart,
}: {
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const floorsWon = useAtomValue(profileAtom).heynspireFloorsWon;
  const balances = useAtomValue(balancesAtom);
  const [panel, setPanel] = useAtom(floorPanelAtom);
  const shown = climb(floorsWon);
  const wins = useNewWins(floorsWon);
  // A locked Floor has no panel.
  const open =
    panel !== null && floorState(panel, floorsWon) !== "locked" ? panel : null;
  return (
    <main
      aria-label={tr("heynspire.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="heynspire"
      data-floors-won={floorsWon}
    >
      <TowerScene />
      <BalancePlate balances={balances} />
      <div
        className={cn(
          "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+4.25rem)] bottom-[88px] left-1/2 flex w-[min(calc(100vw-1.5rem),960px)] -translate-x-1/2 flex-col justify-center",
          "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[60px] [@media(max-height:500px)]:w-[calc(100vw-max(0.75rem,env(safe-area-inset-left))-max(0.75rem,env(safe-area-inset-right)))]"
        )}
      >
        <FloorRail
          climb={shown}
          awaken={wins.awaken}
          stamped={wins.stamped}
          selected={open}
          focusCurrent={open === null}
          onOpen={(floor) => setPanel(floor)}
        />
      </div>
      <FloorPanel
        floor={open}
        state={(floor) => floorState(floor, floorsWon)}
        from={stoneOf}
        onClose={() => setPanel(null)}
        onStart={(options) => {
          setPanel(null);
          onStart(options);
        }}
      />
    </main>
  );
};
