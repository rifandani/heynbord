import { useEffect, useState } from "react";
import { TooltipTrigger } from "react-aria-components";

import { KEY_GUIDE } from "@/features/battle/components/battle-keys";
import { GameButton } from "@/features/battle/components/game-button";
import { GameTooltip } from "@/features/battle/components/game-tooltip";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";

const TRIGGER_ID = "key-guide-button";

/**
 * The Key Guide button in the Top Bar (UI-02). The guide opens on hover and on
 * keyboard focus, like a tooltip. A touch or keyboard press also opens and
 * closes it, because a tooltip does not open on a tap. A press out of the
 * button closes it.
 */
export const KeyGuide = () => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(`[data-testid="${TRIGGER_ID}"]`)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

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
            setOpen((value) => !value);
          }
        }}
        data-testid={TRIGGER_ID}
      >
        <GlyphIcon glyph="info" className="size-4" />
      </GameButton>
      <GameTooltip
        placement="bottom"
        offset={8}
        className="rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-3 py-2 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        data-testid="key-guide"
      >
        <p className="font-display mb-1 text-sm font-bold">
          {tr("battle.keyGuide.title")}
        </p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 text-xs">
          {KEY_GUIDE.map(({ keys, action }) => (
            <div key={action} className="contents">
              <dt className="flex gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="min-w-6 rounded border border-[#e8d9bb]/50 bg-[#3a2a1c] px-1 text-center font-sans font-semibold"
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
