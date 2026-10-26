import { useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameTooltip } from "@/core/components/game/game-tooltip";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { tutorialStageWonAtom } from "@/features/battle/battle.atoms";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { profileReadyAtom } from "@/features/profile/profile.atoms";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { FittedPainting } from "@/features/town/components/fitted-painting";
import {
  LockPlateText,
  useTownLockText,
} from "@/features/town/components/town-lock";
import {
  TOWN_GATE_GLOW,
  TOWN_NAME_TEXT_SHADOW,
  TOWN_SMOKE,
} from "@/features/town/tokens";
import type {
  GameScreen,
  Rect,
  SelectableBuilding,
  TownLock,
} from "@/features/town/town";
import {
  glowBox,
  PAINTING,
  PAINTING_IMAGE,
  percentBox,
  SELECTABLE_BUILDINGS,
  townLock,
} from "@/features/town/town";
import { balancesAtom, townProgressAtom } from "@/features/town/town.atoms";

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
        className="absolute aspect-square w-[1.35%] rounded-full opacity-0 blur-[1px] motion-safe:animate-[town-smoke_3.2s_ease-out_infinite]"
        style={{
          left: percentX(puff.x),
          top: percentY(puff.y),
          backgroundColor: TOWN_SMOKE,
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
      "font-display text-ready-gold z-10 flex items-center rounded-full px-[0.9cqw] text-[max(16px,2cqw)] leading-none font-black",
      // Under the pointer or the focus, the label lifts onto a HUD plate.
      "border-gold-trim/70 bg-night-plate/90 border-2 transition-[translate,background-color,border-color,box-shadow] duration-150",
      "group-data-[hovered]:border-gold-trim/70 group-data-[hovered]:bg-night-plate/75 group-data-[hovered]:shadow-piece group-data-[hovered]:-translate-y-1",
      "group-data-[focus-visible]:bg-night-plate/75 group-data-[focus-visible]:shadow-piece group-data-[focus-visible]:ring-focus-cream group-data-[focus-visible]:-translate-y-1 group-data-[focus-visible]:ring-4",
      "group-data-[pressed]:shadow-piece-press group-data-[pressed]:translate-y-0"
    )}
    style={{ height, textShadow: TOWN_NAME_TEXT_SHADOW }}
    data-building-label
  >
    {name}
  </span>
);

/**
 * The lock plate in the place of the name label of a Building that the
 * Player has not unlocked (GDD 11.4): the lock seal of the Town Bar and the
 * level, or the ID of the Boss Stage to win first, on a small HUD plate.
 */
const LockPlate = ({
  lock,
  height,
}: {
  readonly lock: TownLock;
  readonly height: string;
}) => (
  <span className="z-10 flex items-center" style={{ height }}>
    <span
      className={cn(
        "border-gold-trim/70 bg-night-plate/90 text-cream-dim shadow-piece flex items-center gap-1.5 rounded-full border-2 py-0.5 pr-2.5 pl-1 text-[max(12px,1.1cqw)] leading-none font-bold whitespace-nowrap",
        "group-data-[focus-visible]:ring-focus-cream group-data-[focus-visible]:ring-4"
      )}
      data-testid="building-lock-plate"
      data-building-label
    >
      <span className="border-gold-trim/70 bg-night-plate grid size-[1.6em] place-items-center rounded-full border">
        <GlyphIcon glyph="lock" className="text-gold-trim size-[0.9em]" />
      </span>
      <LockPlateText lock={lock} />
    </span>
  </span>
);

/**
 * A Building that the Player can select: a button over the painted Building,
 * with its label. Hover and focus lift the label onto a plate and light the
 * Building. A Building whose screen the Player has not unlocked (`lock`)
 * cannot be selected: a lock plate replaces its label, and it keeps keyboard
 * focus, so that focus, hover and a tap show its tooltip (GDD 11.4).
 */
const BuildingButton = ({
  building,
  pulse,
  disabled,
  lock,
  onSelect,
}: {
  readonly building: SelectableBuilding;
  readonly pulse: boolean;
  /** True until the Profile loads. */
  readonly disabled: boolean;
  /** What still locks the screen of the Building, or `null` when it is open. */
  readonly lock: TownLock | null;
  readonly onSelect: (building: SelectableBuilding) => void;
}) => {
  const { tr } = useGameText();
  const lockText = useTownLockText();
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
  const glow = glowBox(building);
  const glowPlace = {
    left: `${((glow.x - box.x) / box.width) * 100}%`,
    top: `${((glow.y - box.y) / box.height) * 100}%`,
    width: `${(glow.width / box.width) * 100}%`,
    height: `${(glow.height / box.height) * 100}%`,
  };
  const name = tr(`town.buildings.${building.id}`);
  const locked = lock !== null;
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
      aria-label={lock ? lockText.named(name, lock) : undefined}
      className={cn(
        "group absolute flex flex-col items-center outline-none",
        locked && "cursor-default"
      )}
      style={{ ...percentBox(box), clipPath: building.clip }}
      data-testid={`building-${building.id}`}
      data-locked={locked || undefined}
    >
      <span className="z-10 flex justify-center self-start" style={labelPlace}>
        {lock ? (
          <LockPlate lock={lock} height="100%" />
        ) : (
          <NameLabel name={name} height="100%" />
        )}
      </span>
      <span
        className={cn(
          // A soft light on the painted Building: the screen blend makes it
          // brighter and does not cover it. It does not take the pointer:
          // the light can go past the Building box.
          "pointer-events-none absolute rounded-full opacity-0 mix-blend-screen transition-opacity duration-150",
          pulse &&
            "opacity-40 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]",
          !locked &&
            "group-data-[focus-visible]:opacity-50 group-data-[hovered]:opacity-50"
        )}
        style={{ ...glowPlace, background: TOWN_GATE_GLOW }}
        aria-hidden
      />
    </Button>
  );
  if (!lock) {
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
        className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece rounded-lg border-2 px-2.5 py-1 text-center text-xs font-semibold"
        data-testid={`building-tooltip-${building.id}`}
      >
        {name}
        <span className="text-gold-trim block font-normal">
          {lockText.reason(lock)}
        </span>
      </GameTooltip>
    </TooltipTrigger>
  );
};

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
 * The Town (GDD 11.4, web ADR-0004): the master painting with one button for
 * each Building that the Player can select. The full painting shows above
 * the Town Bar, on a soft backdrop of itself (`FittedPainting`). `leaving` is
 * the Building that the Town zooms toward on its way out (`useTownLeave`). Until the Profile loads, the Town
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
  const progress = useAtomValue(townProgressAtom);

  const select = (building: SelectableBuilding) => onOpen(building.screen);

  const origin = leaving
    ? `${percentX(leaving.rect.x + leaving.rect.width / 2)} ${percentY(leaving.rect.y + leaving.rect.height / 2)}`
    : undefined;

  return (
    <main
      aria-label={tr("town.label")}
      className="fade-in animate-in bg-town-sky fixed inset-0 overflow-hidden duration-300 motion-reduce:animate-none"
      data-testid="town"
    >
      <FittedPainting
        src={PAINTING_IMAGE}
        width={PAINTING.width}
        height={PAINTING.height}
        className={cn(
          "@container transition-[scale,opacity] duration-[450ms] ease-in",
          leaving && "scale-[1.12] opacity-0 motion-reduce:scale-100"
        )}
        style={{ transformOrigin: origin }}
        backdropClassName={cn(
          "transition-opacity duration-[450ms] ease-in",
          leaving && "opacity-0"
        )}
      >
        <TownAmbient />
        {SELECTABLE_BUILDINGS.map((building) => (
          <BuildingButton
            key={building.id}
            building={building}
            pulse={ready && !tutorialWon && building.id === "townGate"}
            disabled={!ready}
            lock={ready ? townLock(building, progress) : null}
            onSelect={select}
          />
        ))}
      </FittedPainting>
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
