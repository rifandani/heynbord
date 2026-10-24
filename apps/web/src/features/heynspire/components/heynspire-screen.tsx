import { useAtom, useAtomValue } from "@effect/atom-react";
import { HEYNSPIRE_FLOORS } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useRef, useState } from "react";

import { GameScreen } from "@/core/components/game/game-screen";
import type { BattleOptions } from "@/features/battle/battle-session";
import { useGameText } from "@/features/battle/use-game-text";
import { FloorPanel } from "@/features/heynspire/components/floor-panel";
import { TowerColumn } from "@/features/heynspire/components/tower-column";
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

/**
 * The wins that came since the screen last showed (`newWins`). They are
 * found in the render, so the storeys stamp and wake on their first paint.
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
 * The selected Floor: the Floor that "Next Floor" asked for, else the
 * Current Floor, else Floor 50 after the climb. The request is read one
 * time, so the next visit opens on the Current Floor again.
 */
const useSelectedFloor = (current: number | null) => {
  const [asked, setAsked] = useAtom(floorPanelAtom);
  const [selected, setSelected] = useState(
    () => asked ?? current ?? HEYNSPIRE_FLOORS
  );
  useEffect(() => {
    if (asked !== null) {
      setAsked(null);
    }
  }, [asked, setAsked]);
  return [selected, setSelected] as const;
};

/**
 * The Heynspire screen (GDD 8.2, 11.1): the tower. At the left, the tower
 * column: 50 storeys from Floor 1 over the clouds to the summit, each with
 * its door and its status ribbon. At the right, the Floor Panel, docked and
 * open at all times, shows the selected Floor. The Current storey has the
 * focus when the screen opens, and Enter on it goes to Fight, so a climb is
 * Town, tower, Enter, Enter. "Next Floor" on a result opens the screen on
 * the next Floor.
 */
export const HeynspireScreen = ({
  onStart,
}: {
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const floorsWon = useAtomValue(profileAtom).heynspireFloorsWon;
  const balances = useAtomValue(balancesAtom);
  const shown = climb(floorsWon);
  const wins = useNewWins(floorsWon);
  const [selected, setSelected] = useSelectedFloor(shown.current);
  const screen = useRef<HTMLElement>(null);
  return (
    <GameScreen
      ref={screen}
      label={tr("heynspire.label")}
      data-testid="heynspire"
      data-floors-won={floorsWon}
    >
      <TowerScene />
      <div
        className={cn(
          "absolute top-0 right-[calc(min(440px,38vw)+max(1rem,env(safe-area-inset-right))+1rem)] bottom-[calc(var(--town-bar)+8px)] left-0",
          "[--ribbon-h:clamp(28px,calc(var(--tower-w)*0.15),40px)] [--ribbon-w:clamp(124px,calc(var(--tower-w)*0.72),196px)] [--spine-w:36px] [--storey-h:calc(var(--tower-w)*2/3)] [--tower-w:clamp(120px,min(19vw,30vh),280px)]",
          "[@media(max-height:500px)]:right-[calc(min(460px,54vw)+max(0.5rem,env(safe-area-inset-right))+0.5rem)] [@media(max-height:500px)]:bottom-[calc(var(--town-bar)+4px)] [@media(max-height:500px)]:[--spine-w:30px]"
        )}
      >
        <TowerColumn
          climb={shown}
          selected={selected}
          awaken={wins.awaken}
          stamped={wins.stamped}
          onSelect={setSelected}
          onEnterCurrent={() => {
            // Fight, or Edit Decks while the Deck cannot fight.
            const fight = screen.current?.querySelector<HTMLElement>(
              "[data-testid='floor-fight']:not([disabled])"
            );
            (
              fight ??
              screen.current?.querySelector<HTMLElement>(
                "[data-testid='edit-decks']"
              )
            )?.focus();
          }}
        />
      </div>
      {/* The plate keeps the right edge of the Floor Panel under it. */}
      <BalancePlate
        balances={balances}
        className="right-[max(1rem,env(safe-area-inset-right))] [@media(max-height:500px)]:right-[max(0.5rem,env(safe-area-inset-right))]"
      />
      <FloorPanel
        floor={selected}
        state={floorState(selected, floorsWon)}
        climbed={shown.climbed}
        onStart={onStart}
      />
    </GameScreen>
  );
};
