import { useAtom, useAtomValue } from "@effect/atom-react";
import { useEffect, useRef, useState } from "react";

import type { BattleOptions } from "@/features/battle/battle-session";
import { useGameText } from "@/features/battle/use-game-text";
import { DungeonPanel } from "@/features/dungeons/components/dungeon-panel";
import { MineShaft } from "@/features/dungeons/components/mine-shaft";
import type { DungeonNews, DungeonSlot } from "@/features/dungeons/dungeons";
import {
  dungeonNews,
  dungeonSlots,
  firstShownDungeon,
  seenDungeons,
} from "@/features/dungeons/dungeons";
import { seenDungeonsAtom } from "@/features/dungeons/dungeons.atoms";
import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { balancesAtom } from "@/features/town/town.atoms";

/**
 * What changed since the screen last showed (`dungeonNews`). It is found in
 * the render, so the stops wake and the stamps land on their first paint.
 * It changes with the Dungeons, not with the seen state. The screen keeps
 * what it saw now for its next show.
 */
const useNews = (slots: readonly DungeonSlot[]): DungeonNews => {
  const [seen, setSeen] = useAtom(seenDungeonsAtom);
  const now = seenDungeons(slots);
  const key = JSON.stringify(now);
  const [news, setNews] = useState(() => ({
    key,
    ...dungeonNews(slots, seen),
  }));
  if (news.key !== key) {
    setNews({ key, ...dungeonNews(slots, seen) });
  }
  useEffect(() => {
    setSeen(now);
    // `key` holds `now`: the screen keeps it when it changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setSeen]);
  return news;
};

/**
 * The Dungeons screen (GDD 8.4, 11.1): the mine. The Player rides the lift
 * down to one stop for each Dungeon, deeper with each number: the painted
 * lair fills the screen, with the same lift cut-out over its empty well, and
 * the shaft rock goes past between 2 stops. The Depth Gauge at the left
 * selects the stop, and the Dungeon Panel, docked at the right and open at
 * all times, shows the selected Dungeon: the Boss dossiers, the reward, the
 * Deck, the Sweep and the one gold action. The selected stop has the focus
 * when the screen opens, and Enter on it goes to that action, so a repeat win
 * is Town, cave, Enter, Enter.
 */
export const DungeonsScreen = ({
  onStart,
}: {
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const level = useAtomValue(playerLevelAtom);
  const results = useAtomValue(profileAtom).dungeonResults;
  const balances = useAtomValue(balancesAtom);
  const slots = dungeonSlots(level, results);
  const news = useNews(slots);
  // The screen opens on the Dungeon of a new win, else on the deepest open Dungeon.
  const [selected, setSelected] = useState(
    () => news.won[0] ?? firstShownDungeon(slots)
  );
  const [active, setActive] = useState<number | null>(null);
  const screen = useRef<HTMLElement>(null);
  const shown =
    slots.find((slot) => slot.number === selected) ?? slots[0] ?? null;
  return (
    <main
      ref={screen}
      aria-label={tr("dungeons.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden bg-[#241d18] text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="dungeons"
    >
      <div className="[container-type:size] absolute inset-0">
        <MineShaft
          slots={slots}
          selected={selected}
          active={active}
          news={news}
          onSelect={(number) => {
            if (number !== selected) {
              setActive(null);
            }
            setSelected(number);
          }}
          onEnter={() => {
            // The gold action, or Edit Decks while the Deck cannot fight.
            const action = screen.current?.querySelector<HTMLElement>(
              "[data-testid='dungeon-panel'] [data-primary]:not([disabled])"
            );
            (
              action ??
              screen.current?.querySelector<HTMLElement>(
                "[data-testid='edit-decks']"
              )
            )?.focus();
          }}
        />
      </div>
      {/* The plate keeps the right edge of the Dungeon Panel under it. */}
      <BalancePlate
        balances={balances}
        className="right-[max(1rem,env(safe-area-inset-right))] [@media(max-height:500px)]:right-[max(0.5rem,env(safe-area-inset-right))]"
      />
      {shown ? (
        <DungeonPanel
          slot={shown}
          active={active}
          onActive={setActive}
          onStart={onStart}
        />
      ) : null}
    </main>
  );
};
