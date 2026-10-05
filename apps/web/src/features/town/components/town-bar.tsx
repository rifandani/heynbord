import { useAtom } from "@effect/atom-react";
import { cn } from "cn";
import { useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import {
  Button,
  ToggleButton,
  Tooltip,
  TooltipTrigger,
} from "react-aria-components";

import { soundOnAtom } from "@/features/battle/battle.atoms";
import { gameButtonStyles } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { LanguageToggle } from "@/features/i18n/components/language-toggle";
import type { GameScreen, TownShortcut } from "@/features/town/town";
import { TOWN_SHORTCUTS } from "@/features/town/town";

const LONG_PRESS_MS = 450;

const shortcutName = (locked: boolean, name: string, lockedName: string) =>
  locked ? lockedName : name;

const pageCurrent = (current: boolean) => (current ? "page" : undefined);

const shortcutClass = (locked: boolean, current: boolean) =>
  cn(
    "relative flex min-h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1 py-1 text-[11px] leading-none font-bold outline-none select-none",
    "transition-[transform,filter] duration-100 data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
    // On a phone in landscape, a shortcut shows its icon only (GDD 11.4).
    "[@media(max-height:500px)]:min-h-11 [@media(max-height:500px)]:w-11",
    locked
      ? "cursor-default border-transparent text-[#d9c7a3]/60"
      : "border-[#2a1a0c] bg-gradient-to-b from-[#7a5233] to-[#563720] text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] data-[hovered]:brightness-110 data-[pressed]:translate-y-px",
    current && "border-[#7a5310] from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]"
  );

const lockedAttr = (locked: boolean) => locked || undefined;

const LockMark = ({ locked }: { readonly locked: boolean }) => {
  if (!locked) {
    return null;
  }
  return (
    <GlyphIcon
      glyph="lock"
      className="absolute -right-2 -bottom-1 size-3.5 text-[#e9c46a]"
    />
  );
};

const OpensLater = ({ locked }: { readonly locked: boolean }) => {
  const { tr } = useGameText();
  if (!locked) {
    return null;
  }
  return (
    <span className="block font-normal text-[#e9c46a]">
      {tr("town.opensLater")}
    </span>
  );
};

/**
 * One Town Bar shortcut. A shortcut to a screen that does not exist yet keeps
 * keyboard focus, and its accessible name says "opens later". Hover and focus
 * show its tooltip; on touch, a tap shows it. A long press shows the name of
 * any shortcut, because a phone shows the icons only.
 */
const Shortcut = ({
  shortcut,
  current,
  onOpen,
}: {
  readonly shortcut: TownShortcut;
  readonly current: boolean;
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const name = tr(`town.shortcuts.${shortcut.id}`);
  const { screen } = shortcut;
  const locked = screen === null;

  const onPressStart = (event: PressEvent) => {
    longPressed.current = false;
    if (event.pointerType === "touch") {
      timer.current = setTimeout(() => {
        longPressed.current = true;
        setOpen(true);
      }, LONG_PRESS_MS);
    }
  };
  const onPressEnd = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const onPress = (event: PressEvent) => {
    if (longPressed.current) {
      return;
    }
    if (screen) {
      setOpen(false);
      onOpen(screen);
    } else if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };

  return (
    // The Town shortcut stands apart, at the left end.
    <li className="first:mr-1 first:border-r-2 first:border-[#fff6df]/15 first:pr-2">
      <TooltipTrigger
        isOpen={open}
        // Hover and focus open the tooltip of a locked shortcut only: an open shortcut shows its label.
        onOpenChange={(next) =>
          setOpen(next && (locked || longPressed.current))
        }
        delay={200}
        shouldCloseOnPress={false}
      >
        <Button
          aria-label={shortcutName(locked, name, tr("town.locked", { name }))}
          aria-current={pageCurrent(current)}
          onPressStart={onPressStart}
          onPressEnd={onPressEnd}
          onPress={onPress}
          className={shortcutClass(locked, current)}
          data-testid={`town-shortcut-${shortcut.id}`}
          data-locked={lockedAttr(locked)}
        >
          <span className="relative">
            <GlyphIcon glyph={shortcut.glyph} className="size-6" />
            <LockMark locked={locked} />
          </span>
          <span
            className="max-w-full truncate [@media(max-height:500px)]:sr-only"
            aria-hidden
          >
            {name}
          </span>
        </Button>
        <Tooltip
          placement="top"
          offset={8}
          className="rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1 text-center text-xs font-semibold text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
          data-testid={`town-tooltip-${shortcut.id}`}
        >
          {name}
          <OpensLater locked={locked} />
        </Tooltip>
      </TooltipTrigger>
    </li>
  );
};

/**
 * The Town Bar (GDD 11.4): the shortcuts to the game screens, then the
 * language and sound controls. It shows on each screen except the Battle.
 */
export const TownBar = ({
  screen,
  onOpen,
}: {
  readonly screen: GameScreen;
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const { tr } = useGameText();
  const [soundOn, setSoundOn] = useAtom(soundOnAtom);
  return (
    <nav
      aria-label={tr("town.bar")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 border-t-4 border-[#2a1a0c] bg-gradient-to-b from-[#4a2f1b] to-[#2e1d10] px-2 py-1.5 shadow-[0_-4px_12px_rgba(0,0,0,0.35)]",
        "pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.375rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))]",
        "[@media(max-height:500px)]:py-1"
      )}
      data-testid="town-bar"
    >
      <ul className="flex min-w-0 items-center gap-1">
        {TOWN_SHORTCUTS.map((shortcut) => (
          <Shortcut
            key={shortcut.id}
            shortcut={shortcut}
            current={shortcut.screen === screen}
            onOpen={onOpen}
          />
        ))}
      </ul>
      <div className="flex shrink-0 items-center gap-1">
        <div className="light rounded-lg bg-white/95 text-[#2a1d12] [&_*]:text-[#2a1d12]">
          <LanguageToggle />
        </div>
        <ToggleButton
          isSelected={soundOn}
          onChange={setSoundOn}
          aria-label={tr("battle.sound")}
          className={gameButtonStyles({ intent: "ghost", size: "icon" })}
        >
          <GlyphIcon glyph={soundOn ? "sound" : "mute"} className="size-5" />
        </ToggleButton>
      </div>
    </nav>
  );
};
