import { useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { tutorialStageWonAtom } from "@/features/battle/battle.atoms";
import { useGameText } from "@/features/battle/use-game-text";
import { BalancePlate } from "@/features/town/components/balance-plate";
import type {
  GameScreen,
  Rect,
  SelectableBuilding,
} from "@/features/town/town";
import {
  GROUND_LINE,
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
  { x: 1414, y: 472, delay: 0 },
  { x: 1414, y: 472, delay: 1.1 },
  { x: 1414, y: 472, delay: 2.2 },
];

/** Light on the open sea, clear of the ships and piers, in painting coordinates. */
const SHIMMER = [
  { x: 1340, y: 226, width: 67 },
  { x: 1455, y: 247, width: 53 },
  { x: 1541, y: 218, width: 48 },
];

/** The Town Bar height. The ground line of the painting stays on its top edge. */
const TOWN_BAR =
  "[--town-bar:72px] [@media(max-height:500px)]:[--town-bar:56px]";

/**
 * The painting covers the screen with its ground line on the Town Bar. Its
 * width is the screen width, or the width that fills the height above the
 * Town Bar if that is larger. The extra crops from the sky (GDD 11.4).
 */
const paintingFrame: CSSProperties & Record<"--town-width", string> = {
  "--town-width": `max(100vw, calc((100dvh - var(--town-bar)) * ${PAINTING.width / GROUND_LINE}))`,
  width: "var(--town-width)",
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
        className="absolute aspect-square w-[1.6%] rounded-full bg-[#f1ece4]/80 opacity-0 blur-[1px] motion-safe:animate-[town-smoke_3.2s_ease-out_infinite]"
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

/** A Building that the Player can select: its cut-out layer and its label. */
const BuildingButton = ({
  building,
  pulse,
  onSelect,
}: {
  readonly building: SelectableBuilding;
  readonly pulse: boolean;
  readonly onSelect: (building: SelectableBuilding) => void;
}) => {
  const { tr } = useGameText();
  const box = buildingBox(building);
  const labelShare = (building.label.height / box.height) * 100;
  return (
    <Button
      onPress={() => onSelect(building)}
      className="group absolute flex flex-col items-center outline-none"
      style={percentBox(box)}
      data-testid={`building-${building.id}`}
    >
      <span
        className={cn(
          "font-display z-10 flex items-center rounded-full px-[0.6cqw] text-[max(16px,2cqw)] leading-none font-black text-[#ffd75a]",
          "[text-shadow:0_2px_0_#3b1d08,2px_0_0_#3b1d08,-2px_0_0_#3b1d08,0_-2px_0_#3b1d08,0_4px_6px_rgba(0,0,0,0.5)]",
          "transition-transform duration-150 group-data-[hovered]:-translate-y-0.5",
          "group-data-[focus-visible]:bg-[#1c140e]/60 group-data-[focus-visible]:ring-4 group-data-[focus-visible]:ring-[#fff2a8]"
        )}
        style={{ height: `${labelShare}%` }}
      >
        {tr(`town.buildings.${building.id}`)}
      </span>
      <span className="relative w-full flex-1">
        <span
          className={cn(
            "absolute inset-[-8%] rounded-full bg-[radial-gradient(closest-side,rgba(255,224,138,0.9),transparent)] opacity-0 transition-opacity",
            pulse &&
              "opacity-40 motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]",
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
            "group-data-[hovered]:scale-[1.04] group-data-[hovered]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)]",
            "group-data-[focus-visible]:scale-[1.04] group-data-[focus-visible]:drop-shadow-[0_0_14px_rgba(255,224,138,0.95)]",
            "group-data-[pressed]:scale-[1.01]"
          )}
        />
      </span>
    </Button>
  );
};

const preloadBattleCanvas = () =>
  import("@/features/battle/scene/battle-canvas");

/**
 * The Town (GDD 11.4, web ADR-0005): the master painting with one cut-out
 * layer for each Building that the Player can select. The painting covers the
 * screen and crops its edges.
 */
export const TownScreen = ({
  onOpen,
}: {
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const { tr } = useGameText();
  const tutorialWon = useAtomValue(tutorialStageWonAtom);
  const balances = useAtomValue(balancesAtom);
  const [leaving, setLeaving] = useState<SelectableBuilding | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // The Town has no Three.js, so the Battle chunk loads in the background.
    void preloadBattleCanvas();
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const select = (building: SelectableBuilding) => {
    if (leaving) {
      return;
    }
    unlockAudio();
    playSound("select");
    setLeaving(building);
    timer.current = setTimeout(() => onOpen(building.screen), LEAVE_MS);
  };

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
          "@container absolute left-1/2 aspect-video -translate-x-1/2",
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
            pulse={!tutorialWon}
            onSelect={select}
          />
        ))}
      </div>
      <BalancePlate
        balances={balances}
        className={cn(
          "transition-opacity duration-[450ms] ease-in",
          leaving && "opacity-0"
        )}
      />
    </main>
  );
};
