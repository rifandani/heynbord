import { useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { tutorialStageWonAtom } from "@/features/battle/battle.atoms";
import { GameTooltip } from "@/features/battle/components/game-tooltip";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import {
  playerLevelAtom,
  profileReadyAtom,
} from "@/features/profile/profile.atoms";
import { BalancePlate } from "@/features/town/components/balance-plate";
import type {
  GameScreen,
  Rect,
  SelectableBuilding,
} from "@/features/town/town";
import {
  GROUND_LINE,
  opensAtLevel,
  PAINTING,
  PAINTING_IMAGE,
  percentBox,
  SELECTABLE_BUILDINGS,
} from "@/features/town/town";
import { balancesAtom } from "@/features/town/town.atoms";

/** The zoom toward a selected Building, then the fade to its screen (GDD 11.4). */
const LEAVE_MS = 450;

/**
 * Smoke from the forge chimney of the Workshop: the top left of each puff in
 * painting coordinates. It continues the plume in the painting.
 */
const SMOKE = [
  { x: 1612, y: 472, delay: 0 },
  { x: 1612, y: 472, delay: 1.1 },
  { x: 1612, y: 472, delay: 2.2 },
];

/** Light on the open sea, clear of the ships and piers, in painting coordinates. */
const SHIMMER = [
  { x: 1515, y: 226, width: 87 },
  { x: 1670, y: 247, width: 80 },
  { x: 1803, y: 218, width: 79 },
];

/** The Town Bar height. The ground line of the painting stays on its top edge. */
const TOWN_BAR =
  "[--town-bar:80px] [@media(max-height:500px)]:[--town-bar:56px]";

/**
 * The painting covers the screen with its ground line on the Town Bar. Its
 * width is the screen width, or the width that fills the height above the
 * Town Bar if that is larger. The extra crops from the sky (GDD 11.4).
 */
const paintingFrame: CSSProperties & Record<"--town-width", string> = {
  "--town-width": `max(100vw, calc((100dvh - var(--town-bar)) * ${PAINTING.width / GROUND_LINE}))`,
  width: "var(--town-width)",
  aspectRatio: `${PAINTING.width} / ${PAINTING.height}`,
  bottom: `calc(var(--town-bar) - var(--town-width) * ${(PAINTING.height - GROUND_LINE) / PAINTING.width})`,
};

const percentX = (x: number) => `${(x / PAINTING.width) * 100}%`;
const percentY = (y: number) => `${(y / PAINTING.height) * 100}%`;

/** Small ambient motion on separate layers. Reduced motion stops all of it. */
const TownAmbient = () => (
  <div className="pointer-events-none absolute inset-0" aria-hidden>
    {SHIMMER.map((light) => (
      <div
        key={light.x}
        className="absolute h-[0.4%] rounded-full bg-white/70 opacity-30 motion-safe:animate-[town-shimmer_3.2s_ease-in-out_infinite]"
        style={{
          left: percentX(light.x),
          top: percentY(light.y),
          width: percentX(light.width),
          animationDelay: `${light.x / 400}s`,
        }}
      />
    ))}
    {SMOKE.map((puff) => (
      <div
        key={`${puff.x}-${puff.delay}`}
        className="absolute aspect-square w-[1.35%] rounded-full bg-[#f1ece4]/80 opacity-0 blur-[1px] motion-safe:animate-[town-smoke_3.2s_ease-out_infinite]"
        style={{
          left: percentX(puff.x),
          top: percentY(puff.y),
          animationDelay: `${puff.delay}s`,
        }}
      />
    ))}
  </div>
);

/** The box of a Building with its label above it. */
const buildingBox = (building: SelectableBuilding): Rect => ({
  x: building.rect.x,
  y: building.label.y,
  width: building.rect.width,
  height: building.rect.y + building.rect.height - building.label.y,
});

/** The name label above a Building. */
const NameLabel = ({
  name,
  height,
}: {
  readonly name: string;
  readonly height: string;
}) => (
  <span
    className={cn(
      "font-display z-10 flex items-center rounded-full px-[0.6cqw] text-[max(16px,2cqw)] leading-none font-black text-[#ffd75a]",
      "[text-shadow:0_2px_0_#3b1d08,2px_0_0_#3b1d08,-2px_0_0_#3b1d08,0_-2px_0_#3b1d08,0_4px_6px_rgba(0,0,0,0.5)]",
      "transition-transform duration-150 group-data-[hovered]:-translate-y-0.5",
      "group-data-[focus-visible]:bg-[#1c140e]/60 group-data-[focus-visible]:ring-4 group-data-[focus-visible]:ring-[#fff2a8]"
    )}
    style={{ height }}
  >
    {name}
  </span>
);

/**
 * The lock plate in the place of the name label of a Building that the
 * Player level has not unlocked (GDD 11.4): the lock seal of the Town Bar and
 * the level, on a small HUD plate.
 */
const LockPlate = ({
  level,
  height,
}: {
  readonly level: number;
  readonly height: string;
}) => {
  const { tr } = useGameText();
  return (
    <span className="z-10 flex items-center" style={{ height }}>
      <span
        className={cn(
          "flex items-center gap-1.5 rounded-full border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 py-0.5 pr-2.5 pl-1 text-[max(12px,1.1cqw)] leading-none font-bold whitespace-nowrap text-[#e8d9bb] shadow-[0_3px_0_rgba(0,0,0,0.45)]",
          "group-data-[focus-visible]:ring-4 group-data-[focus-visible]:ring-[#fff2a8]"
        )}
        data-testid="building-lock-plate"
      >
        <span className="grid size-[1.6em] place-items-center rounded-full border border-[#e9c46a]/70 bg-[#1c140e]">
          <GlyphIcon glyph="lock" className="size-[0.9em] text-[#e9c46a]" />
        </span>
        {tr("town.levelPlate", { level })}
      </span>
    </span>
  );
};

/**
 * A Building that the Player can select: its cut-out layer and its label. A
 * Building whose screen the Player level has not unlocked (`opensAt`) cannot
 * be selected: a lock plate replaces its label, and it keeps keyboard focus,
 * so that focus, hover and a tap show its tooltip (GDD 11.4).
 */
const BuildingButton = ({
  building,
  pulse,
  disabled,
  opensAt,
  onSelect,
}: {
  readonly building: SelectableBuilding;
  readonly pulse: boolean;
  /** True until the Profile loads. */
  readonly disabled: boolean;
  /** The level that opens the screen of the Building, or `null` when it is open. */
  readonly opensAt: number | null;
  readonly onSelect: (building: SelectableBuilding) => void;
}) => {
  const { tr } = useGameText();
  const [tip, setTip] = useState(false);
  const box = buildingBox(building);
  const labelHeight = `${(building.label.height / box.height) * 100}%`;
  // The label is over its own part of the Building: the full width for most
  // Buildings, the part in the safe area for the Workshop.
  const labelPlace = {
    marginLeft: `${((building.label.x - box.x) / box.width) * 100}%`,
    width: `${(building.label.width / box.width) * 100}%`,
    height: labelHeight,
  };
  const name = tr(`town.buildings.${building.id}`);
  const locked = opensAt !== null;
  const onPress = (event: PressEvent) => {
    if (!locked) {
      onSelect(building);
    } else if (event.pointerType !== "mouse") {
      setTip((open) => !open);
    }
  };
  const button = (
    <Button
      onPress={onPress}
      isDisabled={disabled}
      aria-label={
        locked ? tr("town.lockedAtLevel", { name, level: opensAt }) : undefined
      }
      className={cn(
        "group absolute flex flex-col items-center outline-none",
        locked && "cursor-default"
      )}
      style={{ ...percentBox(box), clipPath: building.clip }}
      data-testid={`building-${building.id}`}
      data-locked={locked || undefined}
    >
      <span className="z-10 flex justify-center self-start" style={labelPlace}>
        {locked ? (
          <LockPlate level={opensAt} height="100%" />
        ) : (
          <NameLabel name={name} height="100%" />
        )}
      </span>
      <span className="relative w-full flex-1">
        <span
          className={cn(
            "absolute inset-[-8%] rounded-full bg-[radial-gradient(closest-side,rgba(255,224,138,0.9),transparent)] opacity-0 transition-opacity",
            pulse &&
              "opacity-40 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]",
            !locked &&
              "group-data-[focus-visible]:opacity-80 group-data-[hovered]:opacity-80"
          )}
          aria-hidden
        />
        <img
          src={building.image}
          alt=""
          draggable={false}
          className={cn(
            // The layer is cut from the painting, so it grows from its base and
            // does not show the painted gate below it.
            "relative size-full origin-bottom object-contain transition-[scale,filter] duration-150",
            !locked && [
              "group-data-[hovered]:scale-[1.04] group-data-[hovered]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)]",
              "group-data-[focus-visible]:scale-[1.04] group-data-[focus-visible]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)]",
              "group-data-[pressed]:scale-[1.01]",
            ]
          )}
        />
      </span>
    </Button>
  );
  if (!locked) {
    return button;
  }
  return (
    <TooltipTrigger
      isOpen={tip}
      onOpenChange={setTip}
      delay={200}
      shouldCloseOnPress={false}
    >
      {button}
      <GameTooltip
        placement="top"
        offset={8}
        className="rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1 text-center text-xs font-semibold text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        data-testid={`building-tooltip-${building.id}`}
      >
        {name}
        <span className="block font-normal text-[#e9c46a]">
          {tr("town.opensAtLevel", { level: opensAt })}
        </span>
      </GameTooltip>
    </TooltipTrigger>
  );
};

const preloadBattleCanvas = () =>
  import("@/features/battle/scene/battle-canvas");

/**
 * The way out of the Town to a game screen. A screen that a selectable
 * Building opens plays the zoom toward that Building, then the fade (GDD
 * 11.4), from the Building and from the Town Bar alike. Other screens open at
 * once. A second request during the zoom does nothing.
 */
export const useTownLeave = (
  screen: GameScreen,
  onOpen: (screen: GameScreen) => void
) => {
  const [leaving, setLeaving] = useState<SelectableBuilding | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const open = (target: GameScreen) => {
    if (leaving) {
      return;
    }
    const building =
      screen === "town"
        ? SELECTABLE_BUILDINGS.find((item) => item.screen === target)
        : undefined;
    if (!building) {
      onOpen(target);
      return;
    }
    unlockAudio();
    playSound("select");
    setLeaving(building);
    timer.current = setTimeout(() => {
      timer.current = null;
      setLeaving(null);
      onOpen(building.screen);
    }, LEAVE_MS);
  };

  return { leaving, open };
};

/**
 * The Town (GDD 11.4, web ADR-0005): the master painting with one cut-out
 * layer for each Building that the Player can select. The painting covers the
 * screen and crops its edges. `leaving` is the Building that the Town zooms
 * toward on its way out (`useTownLeave`). Until the Profile loads, the Town
 * shows no balances and no Building opens, so that the values of a new Player
 * never show first.
 */
export const TownScreen = ({
  leaving,
  onOpen,
}: {
  readonly leaving: SelectableBuilding | null;
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const { tr } = useGameText();
  const ready = useAtomValue(profileReadyAtom);
  const tutorialWon = useAtomValue(tutorialStageWonAtom);
  const balances = useAtomValue(balancesAtom);
  const level = useAtomValue(playerLevelAtom);

  useEffect(() => {
    // The Town has no Three.js, so the Battle chunk loads in the background.
    void preloadBattleCanvas();
  }, []);

  const select = (building: SelectableBuilding) => onOpen(building.screen);

  const origin = leaving
    ? `${percentX(leaving.rect.x + leaving.rect.width / 2)} ${percentY(leaving.rect.y + leaving.rect.height / 2)}`
    : undefined;

  return (
    <main
      aria-label={tr("town.label")}
      className={cn(
        "fade-in animate-in fixed inset-0 overflow-hidden bg-[#8fd0f5] duration-300 motion-reduce:animate-none",
        TOWN_BAR
      )}
      data-testid="town"
    >
      <div
        className={cn(
          "@container absolute left-1/2 -translate-x-1/2",
          "transition-[scale,opacity] duration-[450ms] ease-in",
          leaving && "scale-[1.12] opacity-0 motion-reduce:scale-100"
        )}
        style={{ ...paintingFrame, transformOrigin: origin }}
      >
        <img
          src={PAINTING_IMAGE}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full select-none"
        />
        <TownAmbient />
        {SELECTABLE_BUILDINGS.map((building) => (
          <BuildingButton
            key={building.id}
            building={building}
            pulse={ready && !tutorialWon && building.id === "townGate"}
            disabled={!ready}
            opensAt={ready ? opensAtLevel(building, level) : null}
            onSelect={select}
          />
        ))}
      </div>
      {ready ? (
        <BalancePlate
          balances={balances}
          className={cn(
            "fade-in animate-in transition-opacity duration-[450ms] ease-in motion-reduce:animate-none",
            leaving && "opacity-0"
          )}
        />
      ) : null}
    </main>
  );
};
