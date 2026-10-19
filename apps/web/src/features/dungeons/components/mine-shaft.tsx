import { useMediaQuery } from "@reactuses/core";
import { cn } from "cn";
import type { CSSProperties, KeyboardEvent } from "react";
import { Fragment, useState } from "react";
import { ListBox, ListBoxItem } from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { ClaimedStamp } from "@/features/dungeons/components/boss-dossier";
import type { BossMark } from "@/features/dungeons/dungeon-art";
import {
  DUNGEON_ART_FILE,
  DUNGEON_ART_SIZE,
  dungeonArt,
  LIFT_BOX,
  LIFT_ROPE_FILE,
  LIFT_ROPE_WIDTH,
  stopArtId,
  stopBosses,
} from "@/features/dungeons/dungeon-art";
import type { DungeonNews, DungeonSlot } from "@/features/dungeons/dungeons";

/** The phone in landscape (DESIGN.md, The Short Screen Rule). */
const SHORT_SCREEN = "(max-height: 500px)";

/**
 * How many tiles of the lift rope fill the well above the lift. The well is
 * about 3.9 tiles tall, so 4 tiles stretch the tile 2 percent and put a tile
 * edge at the top of the lift, where its painted rope starts.
 */
const ROPE_TILES = 4;

/** The accessible name of a stop: the Dungeon, its name and its state. */
const useStopLabel = () => {
  const { tr } = useGameText();
  return (slot: DungeonSlot) => {
    let state = tr("dungeons.shaft.state.later");
    if (slot.state === "locked") {
      state = tr("dungeons.shaft.state.locked", { level: slot.unlockLevel });
    } else if (slot.state === "open") {
      state =
        slot.wins > 0
          ? tr("dungeons.shaft.state.won", { count: slot.wins })
          : tr("dungeons.shaft.state.open");
    }
    return tr("dungeons.shaft.stop", {
      number: slot.number,
      name: slot.dungeon
        ? tr(`dungeons.${slot.dungeon.id}.name`)
        : tr("battle.dungeonName", { number: slot.number }),
      state,
    });
  };
};

/**
 * The light of a Boss: a soft warm glow over the Boss of a stop, when the
 * Player hovers or focuses its dossier in the Dungeon Panel. The glow follows
 * the box that a person measured on the painting (13.2), so the light lands on
 * the figure and not beside it.
 */
const BossLight = ({
  mark,
  index,
}: {
  readonly mark: BossMark;
  readonly index: number;
}) => {
  const height = mark.bottom - mark.top;
  const width = (height * 0.78) / 1.5;
  return (
    <span
      className="pointer-events-none absolute rounded-full bg-[radial-gradient(closest-side,rgba(255,226,168,0.85),rgba(255,176,74,0.4)_52%,transparent_78%)] mix-blend-screen motion-safe:animate-[stage-panel-ink_200ms_ease-out_both]"
      style={{
        left: `${mark.x - width / 2}%`,
        top: `${mark.top - 6}%`,
        width: `${width}%`,
        height: `${height + 12}%`,
      }}
      data-testid={`boss-light-${index}`}
      aria-hidden
    />
  );
};

/**
 * One stop of the mine (GDD 8.4, Town Concepts 13): the painted lair of one
 * Dungeon, seen from the lift. The Bosses stand on the floor line in the order
 * of their Fronts, from the left. A stop that is not selected is dim, and a
 * locked stop is dimmer: the lift over it is locked and the Player cannot ride
 * there. Decorative: the Depth Gauge says the Dungeon and its state, and the
 * Dungeon Panel says the Bosses and the reward.
 *
 * `active` is the Boss whose dossier has the pointer or the focus: its light
 * comes up. `awaken` is true one time, when the Player level opened the stop.
 */
const Stop = ({
  slot,
  selected,
  active,
  awaken,
  stamped,
}: {
  readonly slot: DungeonSlot;
  readonly selected: boolean;
  readonly active: number | null;
  /** True one time, when the Player level opened this Dungeon. */
  readonly awaken: boolean;
  /** True one time, after a new win of this Dungeon. */
  readonly stamped: boolean;
}) => {
  const artId = stopArtId(slot.number);
  const art = artId === null ? null : dungeonArt(artId);
  const size = DUNGEON_ART_SIZE[artId ?? "caveInside"];
  const marks = stopBosses(slot.number);
  const light = selected && active !== null ? active : null;
  const mark = light === null ? undefined : marks[light];
  const open = slot.state === "open";
  return (
    <div
      className={cn(
        "[container-type:inline-size] relative shrink-0 overflow-hidden",
        "h-[var(--stage-h)] w-[var(--stage-w)]"
      )}
      data-testid={`dungeon-stop-${slot.number}`}
      data-state={slot.state}
      data-wins={slot.wins}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 transition-[filter] duration-200 motion-reduce:transition-none",
          !selected && "brightness-[0.6] saturate-[0.78]",
          !open && "brightness-[0.5] saturate-[0.5]",
          awaken && "motion-safe:animate-[mine-wake_900ms_ease-out_300ms_both]"
        )}
      >
        {art ? (
          <img
            src={art}
            alt=""
            width={size.width}
            height={size.height}
            draggable={false}
            decoding="async"
            className="absolute inset-0 size-full select-none"
          />
        ) : (
          <img
            src={DUNGEON_ART_FILE.caveInside}
            alt=""
            width={DUNGEON_ART_SIZE.caveInside.width}
            height={DUNGEON_ART_SIZE.caveInside.height}
            draggable={false}
            decoding="async"
            className="absolute inset-0 size-full scale-105 blur-[3px] brightness-[0.85] select-none"
          />
        )}
        {mark && light !== null ? (
          <BossLight mark={mark} index={light} />
        ) : null}
      </div>
      {/* The claimed stamps land at the feet of the Bosses of a won Dungeon. */}
      {open && slot.wins > 0
        ? marks.map((boss, index) => (
            <span
              key={`${boss.x}:${boss.top}`}
              className="absolute -translate-x-1/2 -rotate-3"
              style={{ left: `${boss.x}%`, top: `${boss.bottom - 3}%` }}
            >
              <ClaimedStamp
                stamped={stamped}
                className="text-[max(8px,0.8cqw)]"
                style={{ animationDelay: `${420 + index * 120}ms` }}
              />
            </span>
          ))
        : null}
    </div>
  );
};

/**
 * The mine shaft (GDD 8.4, 11.1, Town Concepts 13): the 3 stops of the
 * Dungeons, one under the other, deeper with each number, in a column of shaft
 * rock. The selected stop fills the height of the screen, and the lift stands
 * in the well at its left: when the Player selects another Dungeon, the lift
 * stays and the world moves, so the stop slides away, the rock goes past and
 * the new stop comes in. A deeper ride takes more time. It is a list box of
 * the Dungeons: a press, a tap or the arrow keys select one, and the Dungeon
 * Panel shows it. Enter on an open stop goes to the action of the panel.
 */
export const MineShaft = ({
  slots,
  selected,
  active,
  news,
  onSelect,
  onEnter,
}: {
  readonly slots: readonly DungeonSlot[];
  /** The Dungeon that the Dungeon Panel shows. */
  readonly selected: number;
  /** The Boss of the selected Dungeon whose dossier has the pointer or the focus. */
  readonly active: number | null;
  readonly news: DungeonNews;
  readonly onSelect: (number: number) => void;
  /** Enter on an open stop: the focus goes to the action of the panel. */
  readonly onEnter: () => void;
}) => {
  const { tr } = useGameText();
  const label = useStopLabel();
  const short = useMediaQuery(SHORT_SCREEN, false);
  const still = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const index = Math.max(
    0,
    slots.findIndex((slot) => slot.number === selected)
  );
  // The steps of the ride that is playing: the lift stays, so the column
  // slides. A longer ride takes more time.
  const [shown, setShown] = useState(() => index);
  const [ride, setRide] = useState(0);
  if (shown !== index) {
    setRide(Math.abs(index - shown));
    setShown(index);
  }
  const open = slots[index]?.state === "open";
  const lift = dungeonArt(open ? "lift" : "liftLocked");
  const opened = new Set(news.opened);
  const won = new Set(news.won);
  const at = (place: number) => `${((place + 1) / (slots.length + 1)) * 100}%`;
  const onKeyDownCapture = (event: KeyboardEvent) => {
    const number =
      event.target instanceof HTMLElement
        ? Number(event.target.dataset.dungeon)
        : Number.NaN;
    const slot = slots.find((candidate) => candidate.number === number);
    if (event.key === "Enter" && slot?.state === "open") {
      event.preventDefault();
      event.stopPropagation();
      onSelect(number);
      onEnter();
    }
  };
  return (
    <section
      aria-label={tr("dungeons.shaft.label")}
      className={cn(
        "relative size-full overflow-hidden",
        "[--gauge-w:40px] [--rock-h:calc(var(--stage-h)*0.5)] [--stage-h:100cqh] [--stage-w:calc(var(--stage-h)*1.5)] [--step:calc(var(--stage-h)+var(--rock-h))]",
        "[@media(max-height:500px)]:[--gauge-w:32px]"
      )}
      data-testid="mine-shaft"
      data-stop={selected}
    >
      {/* The world: the shaft rock, the 3 stops and the rock between them. */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          backgroundImage: `url(${DUNGEON_ART_FILE.shaftRock})`,
          backgroundRepeat: "repeat",
          backgroundSize: "calc(var(--stage-w) * 0.42) auto",
          transform: `translate3d(0, calc(var(--rock-h) * -1 - ${index} * var(--step)), 0)`,
          transitionProperty: "transform",
          transitionTimingFunction: "cubic-bezier(0.33, 0.9, 0.28, 1)",
          transitionDuration: still
            ? "0ms"
            : `${380 + 220 * Math.max(0, ride - 1)}ms`,
        }}
        data-testid="mine-world"
      >
        <div className="h-[var(--rock-h)]" />
        {slots.map((slot) => (
          <Fragment key={slot.number}>
            <Stop
              slot={slot}
              selected={slot.number === selected}
              active={slot.number === selected ? active : null}
              awaken={opened.has(slot.number)}
              stamped={won.has(slot.number)}
            />
            <div className="h-[var(--rock-h)]" />
          </Fragment>
        ))}
      </div>
      {/* The rope from the sheave at the top of the shaft, down the well. It
          repeats a crop of the rope of the lift cut-out, so the 2 ropes look
          the same and meet without a step at the top of the lift. */}
      <span
        className="pointer-events-none absolute top-0 -translate-x-1/2 bg-repeat-y"
        style={{
          left: `calc(var(--stage-w) * ${LIFT_BOX.rope / 100})`,
          width: `calc(var(--stage-w) * ${LIFT_ROPE_WIDTH / 100})`,
          height: `calc(var(--stage-h) * ${LIFT_BOX.top / 100})`,
          backgroundImage: `url(${LIFT_ROPE_FILE})`,
          backgroundSize: `100% calc(var(--stage-h) * ${LIFT_BOX.top / 100 / ROPE_TILES})`,
        }}
        aria-hidden
      />
      {/* The lift: it stands in the well of the selected stop and stays there. */}
      {lift ? (
        <img
          src={lift}
          alt=""
          width={DUNGEON_ART_SIZE.lift.width}
          height={DUNGEON_ART_SIZE.lift.height}
          draggable={false}
          decoding="async"
          className="pointer-events-none absolute select-none"
          style={{
            left: `calc(var(--stage-w) * ${LIFT_BOX.left / 100})`,
            top: `calc(var(--stage-h) * ${LIFT_BOX.top / 100})`,
            width: `calc(var(--stage-w) * ${LIFT_BOX.width / 100})`,
          }}
          data-testid="mine-lift"
          data-locked={open ? undefined : true}
        />
      ) : null}
      {/* The shade that ties the foot of the painting into the Town Bar. */}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[12%] bg-[linear-gradient(180deg,transparent,rgba(14,10,8,0.5))]"
        aria-hidden
      />
      {/* The Depth Gauge: the rope of the shaft at the left, with one marker
          for each stop and the lift cage around the selected one. The marker
          of a won Dungeon is gold, the rest stay dark, and the selected one
          wears a pale ring. */}
      <div
        className="absolute top-1/2 left-[max(1rem,env(safe-area-inset-left))] flex h-[min(56%,380px)] w-[var(--gauge-w)] -translate-y-1/2 flex-col items-center [@media(max-height:500px)]:left-[max(0.5rem,env(safe-area-inset-left))] [@media(max-height:500px)]:h-[74%]"
        onKeyDownCapture={onKeyDownCapture}
      >
        <span
          className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-[#1c140e] bg-[#55504a] shadow-[0_2px_0_rgba(0,0,0,0.45)]"
          aria-hidden
        >
          <span className="size-1.5 rounded-full bg-[#9aa0a6]" />
        </span>
        <div className="relative w-1.5 flex-1">
          <span
            className="absolute inset-0 rounded-full bg-[repeating-linear-gradient(160deg,#c49a5e_0_3px,#8a6638_3px_6px)] shadow-[0_0_0_1px_rgba(28,20,14,0.7)]"
            aria-hidden
          />
          {index === -1 ? null : (
            <span
              className="pointer-events-none absolute left-1/2 h-11 w-10 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-[420ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:w-8"
              style={{ top: at(index) }}
              aria-hidden
              data-testid="mine-cage"
            >
              <svg
                viewBox="0 0 40 44"
                className="size-full overflow-visible drop-shadow-[0_3px_0_rgba(0,0,0,0.45)]"
              >
                <path
                  d="M4 6 H36 V42 H4 Z"
                  fill="rgba(28,20,14,0.35)"
                  stroke="#1c140e"
                  strokeWidth={4}
                />
                <path
                  d="M4 6 H36 V42 H4 Z M12 6 V42 M28 6 V42"
                  fill="none"
                  stroke="#8d9297"
                  strokeWidth={2}
                />
                <path
                  d="M14 6 L20 1 L26 6"
                  fill="none"
                  stroke="#8d9297"
                  strokeWidth={2}
                />
              </svg>
            </span>
          )}
          <ListBox
            aria-label={tr("dungeons.shaft.gauge")}
            items={slots}
            selectionMode="single"
            selectionBehavior="replace"
            disallowEmptySelection
            selectedKeys={[selected]}
            disabledKeys={slots.flatMap((slot) =>
              slot.state === "later" ? [slot.number] : []
            )}
            onSelectionChange={(keys) => {
              const [key] = keys === "all" ? [] : [...keys];
              if (key !== undefined && Number(key) !== selected) {
                onSelect(Number(key));
              }
            }}
            autoFocus
            // The options read these values: the list box renders them again when they change.
            dependencies={[short, tr]}
            className="absolute inset-0 outline-none"
            data-testid="mine-gauge"
          >
            {(slot) => {
              const place = slots.findIndex(
                (candidate) => candidate.number === slot.number
              );
              const current = slot.number === selected;
              // A won Dungeon keeps a gold marker: the Player has cleared it.
              const cleared = slot.wins > 0;
              return (
                <ListBoxItem
                  id={slot.number}
                  textValue={label(slot)}
                  aria-label={label(slot)}
                  style={{ top: at(place) } satisfies CSSProperties}
                  className={cn(
                    "absolute left-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-2 text-xs font-black tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.45)] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[pressed]:translate-y-[calc(-50%+1px)] [@media(max-height:500px)]:size-6",
                    slot.state === "later" && "cursor-default",
                    cleared
                      ? "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05] data-[hovered]:brightness-110"
                      : "border-[#e9c46a]/70 bg-[#1c140e] text-[#fff6df] data-[disabled]:opacity-60 data-[hovered]:border-[#ffe08a]",
                    current && "ring-2 ring-[#fff2a8]"
                  )}
                  data-dungeon={slot.number}
                  data-state={slot.state}
                  data-cleared={cleared || undefined}
                  data-testid={`gauge-dungeon-${slot.number}`}
                >
                  {slot.state === "open" ? (
                    slot.number
                  ) : (
                    <GlyphIcon
                      glyph="lock"
                      className="size-3.5 text-[#e9c46a]"
                    />
                  )}
                </ListBoxItem>
              );
            }}
          </ListBox>
        </div>
      </div>
    </section>
  );
};
