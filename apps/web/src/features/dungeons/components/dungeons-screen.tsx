import { useAtomValue } from "@effect/atom-react";
import { DUNGEON_LANES } from "@workspace/rules";
import { cn } from "cn";
import type { RefObject } from "react";
import { useRef, useState, useSyncExternalStore } from "react";
import type { Key } from "react-aria-components";
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";

import type { BattleOptions } from "@/features/battle/battle-session";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { CaveScene } from "@/features/dungeons/components/cave-scene";
import { DungeonPanel } from "@/features/dungeons/components/dungeon-panel";
import { FrontStrip } from "@/features/dungeons/components/front-strip";
import { WantedPoster } from "@/features/dungeons/components/wanted-poster";
import type { DungeonSlot } from "@/features/dungeons/dungeons";
import { dungeonSlots, firstShownDungeon } from "@/features/dungeons/dungeons";
import { playerLevelAtom, profileAtom } from "@/features/profile/profile.atoms";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { balancesAtom } from "@/features/town/town.atoms";

/** The phone-in-landscape layout (DESIGN.md, The Short Screen Rule). */
const SHORT_SCREEN = "(max-height: 500px)";

const subscribeShort = (change: () => void) => {
  const query = window.matchMedia(SHORT_SCREEN);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
};

/** True on a short screen: the posters are always folded there. */
const useShortScreen = () =>
  useSyncExternalStore(
    subscribeShort,
    () => window.matchMedia(SHORT_SCREEN).matches,
    () => false
  );

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/**
 * One Dungeon tab: the number on a small socket, then the name of an open
 * Dungeon, the lock and the level of a locked one, or "Coming later". The
 * selected tab is the gold plate of the current place, as the Town Bar.
 */
const DungeonTab = ({ slot }: { readonly slot: DungeonSlot }) => {
  const { tr } = useGameText();
  const { dungeon } = slot;
  let label = tr("dungeons.tabs.later");
  if (slot.state === "locked") {
    label = tr("town.levelPlate", { level: slot.unlockLevel });
  } else if (dungeon !== null) {
    label = tr(`dungeons.${dungeon.id}.name`);
  }
  return (
    <Tab
      id={String(slot.number)}
      className={({ isSelected, isDisabled }) =>
        cn(
          "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-2 py-1 pr-3 pl-1.5 text-sm font-bold whitespace-nowrap outline-none",
          "transition-[background-color,filter] duration-150 data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          "[@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:pr-2 [@media(max-height:500px)]:text-xs",
          isSelected
            ? "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.35)]"
            : "border-transparent text-[#fff6df] data-[hovered]:bg-[#fff6df]/10",
          isDisabled && "cursor-default text-[#e8d9bb]/75"
        )
      }
      data-testid={`dungeon-tab-${slot.number}`}
      data-state={slot.state}
    >
      {({ isSelected }) => (
        <>
          <span
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full text-xs font-black tabular-nums [@media(max-height:500px)]:size-5",
              isSelected
                ? "bg-[#2a1a05] text-[#ffe08a]"
                : "bg-[#3a2a1c] text-[#fff6df] ring-1 ring-[#e9c46a]/50"
            )}
            aria-hidden
          >
            {slot.state === "open" ? (
              slot.number
            ) : (
              <GlyphIcon glyph="lock" className="size-3 text-[#e9c46a]" />
            )}
          </span>
          <span className="sr-only">
            {tr("battle.dungeonName", { number: slot.number })}:{" "}
          </span>
          <span
            className={cn(
              slot.state === "open" && "font-display",
              "[@media(max-width:760px)]:max-w-28 [@media(max-width:760px)]:truncate"
            )}
          >
            {label}
          </span>
        </>
      )}
    </Tab>
  );
};

/**
 * The notice board of the mine (GDD 8.4): one wanted poster for each Boss in
 * Boss order, and the Front strip under them. After a win, each poster
 * carries the claimed stamp. A short screen always shows slips. The board is
 * only as wide as its posters, so that the cave shows around it.
 */
const NoticeBoard = ({ slot }: { readonly slot: DungeonSlot }) => {
  const { tr } = useGameText();
  const folded = useShortScreen();
  const [active, setActive] = useState<number | null>(null);
  const { dungeon } = slot;
  if (dungeon === null) {
    return null;
  }
  const won = slot.wins > 0;
  return (
    <section
      aria-label={tr("dungeons.board.label")}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain rounded-2xl border-4 border-[#3a2412] p-5",
        "bg-[linear-gradient(180deg,#6b4426,#553520_55%,#45291a)] shadow-[inset_0_2px_0_rgba(255,214,150,0.18),inset_0_-6px_14px_rgba(0,0,0,0.4),0_3px_0_rgba(0,0,0,0.45),0_18px_36px_rgba(0,0,0,0.45)]",
        "[@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-2.5"
      )}
      data-testid="notice-board"
      data-folded={folded || undefined}
    >
      <ul
        className={cn(
          "m-0 flex list-none justify-center p-0",
          folded ? "gap-2 [@media(max-height:500px)]:gap-1.5" : "gap-5 pt-1"
        )}
      >
        {dungeon.bosses.map((boss, index) => (
          <li key={boss.id} className="flex min-w-0 flex-1 justify-center">
            <WantedPoster
              dungeonId={dungeon.id}
              boss={boss}
              index={index}
              lanes={DUNGEON_LANES}
              claimed={won}
              folded={folded}
              active={active === index}
              onActive={(on) =>
                setActive((current) =>
                  on ? index : current === index ? null : current
                )
              }
            />
          </li>
        ))}
      </ul>
      <FrontStrip dungeon={dungeon} active={active} onActive={setActive} />
    </section>
  );
};

/**
 * The action under the notice board. An open Dungeon has the one gold Fight
 * across the board, which opens the Dungeon Panel (DESIGN.md, The Gold Means
 * Act Rule). It takes the focus when the screen opens, so a repeat win is
 * Town, cave, Enter, Enter. A locked Dungeon shows its level in its place.
 */
const BoardActions = ({
  slot,
  barRef,
  onOpen,
}: {
  readonly slot: DungeonSlot;
  /** The Fight bar: the Dungeon Panel comes up out of it. */
  readonly barRef: RefObject<HTMLButtonElement | null>;
  readonly onOpen: () => void;
}) => {
  const { tr } = useGameText();
  const { dungeon } = slot;
  if (dungeon === null) {
    return null;
  }
  if (slot.state !== "open") {
    return (
      <p
        className="flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[#c9b48c] bg-[#efe0bd] px-3 py-2.5 text-sm font-bold text-[#5b4632]"
        data-testid="dungeon-locked"
      >
        <GlyphIcon glyph="lock" className="size-4 text-[#7a5310]" />
        {tr("town.opensAtLevel", { level: slot.unlockLevel })}
      </p>
    );
  }
  const name = tr(`dungeons.${dungeon.id}.name`);
  return (
    <GameButton
      ref={barRef}
      intent="gold"
      size="lg"
      autoFocus
      aria-label={tr("dungeons.fightLabel", { name })}
      className="font-display w-full shrink-0 tracking-[0.04em] [@media(max-height:500px)]:min-h-11"
      data-testid="dungeon-fight-bar"
      onPress={onOpen}
    >
      {tr("campaign.panel.fight")}
    </GameButton>
  );
};

/**
 * The Dungeons screen (GDD 8.4, 11.1): the inside of the cave. The Dungeon
 * tabs and the Balance Plate are at the top. Under them, the notice board
 * with the wanted posters of the Bosses and the Front strip, and the one gold
 * Fight under it, which opens the Dungeon Panel: the rewards, the Deck and
 * the Fight of the Battle. The Fight bar has the focus when the screen opens,
 * so a repeat win is Town, cave, Enter (the panel), Enter (Fight).
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
  const [selected, setSelected] = useState<Key>(() =>
    String(firstShownDungeon(slots))
  );
  const [preparing, setPreparing] = useState(false);
  const bar = useRef<HTMLButtonElement | null>(null);
  const disabled = slots.flatMap((slot) =>
    slot.state === "later" ? [String(slot.number)] : []
  );
  const shown =
    slots.find((slot) => String(slot.number) === selected) ?? undefined;
  return (
    <main
      aria-label={tr("dungeons.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="dungeons"
    >
      <CaveScene />
      <BalancePlate balances={balances} />
      <Tabs
        selectedKey={selected}
        onSelectionChange={(key) => {
          // The panel belongs to the Dungeon that opened it.
          setPreparing(false);
          setSelected(key);
        }}
        disabledKeys={disabled}
      >
        <TabList
          aria-label={tr("dungeons.tabs.label")}
          className={cn(
            PLATE,
            "absolute top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-20 flex gap-1 p-1",
            "max-w-[calc(100vw-1rem-env(safe-area-inset-left)-env(safe-area-inset-right)-15rem)] overflow-x-auto"
          )}
        >
          {slots.map((slot) => (
            <DungeonTab key={slot.number} slot={slot} />
          ))}
        </TabList>
        {slots.map((slot) => (
          <TabPanel
            key={slot.number}
            id={String(slot.number)}
            className={cn(
              "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+3.75rem)] bottom-[92px] left-1/2 flex w-[min(calc(100vw-1.5rem),1180px)] -translate-x-1/2 flex-col items-center outline-none",
              "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:w-[calc(100vw-max(0.5rem,env(safe-area-inset-left))-max(0.5rem,env(safe-area-inset-right)))]"
            )}
            data-testid={`dungeon-place-${slot.number}`}
          >
            {/* The board and its Fight take only the width of the posters, so that the cave shows around them. */}
            <div className="flex min-h-0 w-fit max-w-full flex-1 flex-col gap-3 [@media(max-height:500px)]:gap-2">
              <NoticeBoard slot={slot} />
              <BoardActions
                slot={slot}
                barRef={bar}
                onOpen={() => setPreparing(true)}
              />
            </div>
          </TabPanel>
        ))}
      </Tabs>
      <DungeonPanel
        slot={preparing ? (shown ?? null) : null}
        from={bar}
        onClose={() => setPreparing(false)}
        onStart={onStart}
      />
    </main>
  );
};
