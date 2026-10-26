import { useAtom } from "@effect/atom-react";
import { cn } from "cn";
import { useEffect } from "react";
import { TooltipTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameTooltip } from "@/core/components/game/game-tooltip";
import { keyGuideAtom } from "@/features/battle/battle.atoms";
import { KEY_GUIDE } from "@/features/battle/components/battle-keys";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";

const TRIGGER_ID = "key-guide-button";

/**
 * The Key Guide button in the Top Bar (UI-02). The guide opens on hover and on
 * keyboard focus, like a tooltip. A touch or keyboard press also opens and
 * closes it, because a tooltip does not open on a tap. A press out of the
 * button closes it. "Read more" on a Hint opens it at the line of a key, and
 * that line is marked.
 */
export const KeyGuide = () => {
  const { tr } = useGameText();
  const [guide, setGuide] = useAtom(keyGuideAtom);
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
        aria-label={tr("battle.keyGuide.label")}
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
        className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece rounded-xl border-2 px-3 py-2"
        data-testid="key-guide"
      >
        <p className="font-display mb-1 text-sm font-bold">
          {tr("battle.keyGuide.title")}
        </p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-xs">
          {KEY_GUIDE.map(({ keys, action }) => (
            <div
              key={action}
              className={cn(
                "col-span-2 -mx-1 grid grid-cols-subgrid items-center rounded-md px-1",
                guide?.line === action &&
                  "bg-gold-trim/25 ring-gold-trim ring-2"
              )}
              data-testid={`key-guide-${action}`}
              data-marked={guide?.line === action || undefined}
            >
              <dt className="flex gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="border-cream-dim/50 bg-plate-socket min-w-6 rounded border px-1 text-center font-sans font-semibold"
                  >
                    {key}
                  </kbd>
                ))}
              </dt>
              <dd>{tr(`battle.keyGuide.${action}`)}</dd>
            </div>
          ))}
        </dl>
      </GameTooltip>
    </TooltipTrigger>
  );
};
