import { useAtom, useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import { useEffect } from "react";
import { TooltipTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameTooltip } from "@/core/components/game/game-tooltip";
import { padFamily, padLabels } from "@/core/input/pad-family";
import { controlsGuideAtom, padIdAtom } from "@/features/battle/battle.atoms";
import {
  CONTROLS_GUIDE,
  controlsGuideButtons,
  controlsGuidePadLabels,
} from "@/features/battle/components/battle-keys";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";

const TRIGGER_ID = "controls-guide-button";

/**
 * The Controls Guide button in the Top Bar (UI-02). It opens on hover and on
 * keyboard focus, like a tooltip. A touch or keyboard press also opens and
 * closes it, because a tooltip does not open on a tap. A press out of the
 * button closes it. "Read more" on a Hint opens it at the line of an input, and
 * that line is marked.
 */
export const ControlsGuide = () => {
  const { tr } = useGameText();
  const [guide, setGuide] = useAtom(controlsGuideAtom);
  const padId = useAtomValue(padIdAtom);
  const labels = padId === null ? null : padLabels(padFamily(padId));
  const open = guide !== null;
  const setOpen = (value: boolean) => setGuide(value ? { line: null } : null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(`[data-testid="${TRIGGER_ID}"]`)) {
        setGuide(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, setGuide]);

  return (
    <TooltipTrigger
      isOpen={open}
      onOpenChange={setOpen}
      delay={200}
      shouldCloseOnPress={false}
    >
      <GameButton
        intent="ghost"
        size="sm"
        aria-label={tr("battle.controlsGuide.label")}
        onPress={(event) => {
          if (event.pointerType !== "mouse") {
            setOpen(!open);
          }
        }}
        data-testid={TRIGGER_ID}
      >
        <GlyphIcon glyph="info" className="size-4" />
      </GameButton>
      <GameTooltip
        placement="bottom"
        offset={8}
        className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border-2 px-3 py-2"
        data-testid="controls-guide"
      >
        <p className="font-display mb-1 text-sm font-bold">
          {tr("battle.controlsGuide.title")}
        </p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-xs">
          {CONTROLS_GUIDE.map(({ keys, action, padControls }) => {
            if (keys.length === 0 && labels === null) {
              return null;
            }
            return (
              <div
                key={action}
                className={cn(
                  "col-span-2 -mx-1 grid grid-cols-subgrid items-center rounded-md px-1",
                  guide?.line === action &&
                    "bg-gold-trim/25 ring-gold-trim ring-2"
                )}
                data-testid={`controls-guide-${action}`}
                data-marked={guide?.line === action || undefined}
              >
                <dt className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {keys.length > 0 ? (
                    <span className="flex gap-1">
                      {keys.map((key) => (
                        <kbd
                          key={key}
                          className="border-cream-dim/50 bg-plate-socket min-w-6 rounded border px-1 text-center font-sans font-semibold"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  ) : null}
                  {labels ? (
                    <span className="text-cream-dim font-semibold">
                      {controlsGuidePadLabels(padControls, labels).join(" / ")}
                    </span>
                  ) : null}
                </dt>
                <dd>{tr(`battle.controlsGuide.${action}`)}</dd>
              </div>
            );
          })}
        </dl>
        {labels ? (
          <div
            className="border-cream-dim/50 mt-2 border-t pt-2 text-xs"
            data-testid="controls-guide-controller"
          >
            <p className="mb-1 font-semibold">
              {tr("battle.controlsGuide.controller")}
            </p>
            <ul className="flex flex-wrap gap-x-2 gap-y-1 font-semibold">
              {controlsGuideButtons(labels).map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </GameTooltip>
    </TooltipTrigger>
  );
};
