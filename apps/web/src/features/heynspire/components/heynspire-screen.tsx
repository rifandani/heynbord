import { useAtom, useAtomValue } from "@effect/atom-react";
import { HEYNSPIRE_FLOORS } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useState } from "react";

import type { BattleOptions } from "@/features/battle/battle-session";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
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

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

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

/** The title plate: the tower glyph, "Heynspire" and where the Player is on the climb. */
const TitlePlate = ({ current }: { readonly current: number | null }) => {
  const { tr } = useGameText();
  return (
    <header
      className={cn(
        PLATE,
        "absolute top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-20 flex h-14 items-center gap-2.5 pr-4 pl-2",
        "[@media(max-height:500px)]:h-10 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pr-3"
      )}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-7"
        aria-hidden
      >
        <GlyphIcon
          glyph="tower"
          className="size-6 text-[#ffd75a] [@media(max-height:500px)]:size-4"
        />
      </span>
      <div className="min-w-0">
        <h1 className="font-display text-xl leading-none font-bold text-[#ffe08a] [text-shadow:0_2px_0_rgba(0,0,0,0.6)] [@media(max-height:500px)]:text-base">
          {tr("heynspire.title")}
        </h1>
        <p
          className="mt-1 text-xs font-semibold text-[#e8d9bb] tabular-nums [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:text-[11px]"
          data-testid="heynspire-progress"
        >
          {current === null
            ? tr("heynspire.climbed")
            : tr("heynspire.progress", {
                number: current,
                total: HEYNSPIRE_FLOORS,
              })}
        </p>
      </div>
    </header>
  );
};

/**
 * The Heynspire screen (GDD 8.2, 11.1): the tower. The title plate and the
 * Balance Plate are at the top. Under them, the Floor rail: 5 Flights of 10
 * Floors, with the Flight of the Current Floor open as a stair to its Boss
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
      <TitlePlate current={shown.current} />
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
