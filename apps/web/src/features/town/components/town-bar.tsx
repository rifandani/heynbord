import { cn } from "cn";
import { useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import {
  Button,
  DialogTrigger,
  Tooltip,
  TooltipTrigger,
} from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
import { SettingsDialog } from "@/features/town/components/settings-dialog";
import type { GameScreen, TownShortcut } from "@/features/town/town";
import { isLocked, TOWN_SHORTCUTS, shortcutImage } from "@/features/town/town";

const LONG_PRESS_MS = 450;

const shortcutName = (locked: boolean, name: string, lockedName: string) =>
  locked ? lockedName : name;

const pageCurrent = (current: boolean) => (current ? "page" : undefined);

const lockedAttr = (locked: boolean) => locked || undefined;

/**
 * The painted icon stands on the shelf of the bar, and its top stands out of
 * the top edge of the bar (11 — Town Concepts 7). The current one stands a
 * little higher in a warm light; an open one lifts under the pointer. The
 * Settings icon stays lifted while its dialog is open.
 */
const iconStandClass = (locked: boolean, current: boolean, lifted: boolean) =>
  cn(
    "pointer-events-none absolute inset-x-0 bottom-[19px] mx-auto size-[66px] transition-transform duration-150 ease-out motion-reduce:transition-none",
    "[@media(max-height:500px)]:-bottom-0.5 [@media(max-height:500px)]:size-12",
    !locked &&
      "group-data-[hovered]:-translate-y-[3px] group-data-[pressed]:translate-y-0",
    current && "-translate-y-1 group-data-[hovered]:-translate-y-1.5",
    lifted && "-translate-y-[3px] group-data-[pressed]:-translate-y-[3px]"
  );

const iconClass = (locked: boolean, current: boolean, lifted: boolean) =>
  cn(
    "relative size-full object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] transition-[filter] duration-200 select-none",
    // A locked screen shows its icon with less color, warmed toward the wood.
    // Under the pointer the color comes back: a look at what comes later.
    locked &&
      "brightness-[0.82] grayscale-[0.5] sepia-[0.2] group-data-[focus-visible]:brightness-100 group-data-[focus-visible]:grayscale-0 group-data-[focus-visible]:sepia-0 group-data-[hovered]:brightness-100 group-data-[hovered]:grayscale-0 group-data-[hovered]:sepia-0",
    !locked && "group-data-[hovered]:brightness-110",
    lifted && "brightness-110",
    current && "motion-safe:animate-[town-bar-hop_420ms_ease-out]"
  );

const labelClass = (locked: boolean, current: boolean, lifted: boolean) =>
  cn(
    "relative mb-px flex h-[18px] max-w-full items-center rounded-[4px] border px-1.5 text-[11px] leading-none font-bold transition-[color,transform] duration-100 max-[1199px]:px-1 max-[1199px]:text-[10px]",
    "[@media(max-height:500px)]:sr-only",
    current
      ? "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05] shadow-[0_2px_0_rgba(0,0,0,0.45)]"
      : "border-transparent",
    !current && locked && "font-semibold text-[#d9c7a3]/70",
    !current &&
      !locked &&
      "text-[#fff6df] group-data-[hovered]:text-[#ffe08a] group-data-[pressed]:translate-y-px",
    lifted && "text-[#ffe08a]"
  );

/** The button of a shortcut: no fill, because the painted icon is the piece. */
const shortcutButtonClass = (locked: boolean) =>
  cn(
    "group relative flex h-[66px] w-full flex-col items-center justify-end rounded-lg outline-none select-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
    "[@media(max-height:500px)]:h-11",
    locked && "cursor-default"
  );

/** The small seal at the foot of a locked icon. */
const LockSeal = ({ locked }: { readonly locked: boolean }) => {
  if (!locked) {
    return null;
  }
  return (
    <span
      className={cn(
        "absolute right-0.5 bottom-0.5 grid size-[18px] place-items-center rounded-full border border-[#e9c46a]/70 bg-[#1c140e]/90 shadow-[0_1px_0_rgba(0,0,0,0.5)]",
        "[@media(max-height:500px)]:right-0 [@media(max-height:500px)]:bottom-0 [@media(max-height:500px)]:size-4"
      )}
    >
      <GlyphIcon glyph="lock" className="size-2.5 text-[#e9c46a]" />
    </span>
  );
};

/**
 * The face of a shortcut: its light, its contact shadow, its painted icon and
 * its name on the lip of the shelf.
 */
const ShortcutFace = ({
  image,
  name,
  locked,
  current,
  lifted = false,
}: {
  readonly image: string;
  readonly name: string;
  readonly locked: boolean;
  readonly current: boolean;
  readonly lifted?: boolean;
}) => (
  <>
    {/* The light of the current place, and the shadow under each icon. */}
    <span
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-3 mx-auto h-[70px] w-[76px] bg-[radial-gradient(closest-side,rgba(255,215,90,0.5),rgba(255,215,90,0))] opacity-0 transition-opacity duration-300",
        "[@media(max-height:500px)]:-bottom-2 [@media(max-height:500px)]:h-14 [@media(max-height:500px)]:w-14",
        current && "opacity-100"
      )}
      aria-hidden
    />
    <span
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-[17px] mx-auto h-2 w-12 bg-[radial-gradient(closest-side,rgba(0,0,0,0.55),rgba(0,0,0,0))]",
        "[@media(max-height:500px)]:-bottom-1 [@media(max-height:500px)]:w-9"
      )}
      aria-hidden
    />
    <span className={iconStandClass(locked, current, lifted)} aria-hidden>
      <img
        src={image}
        alt=""
        width={128}
        height={128}
        draggable={false}
        decoding="async"
        className={iconClass(locked, current, lifted)}
      />
      <LockSeal locked={locked} />
    </span>
    <span className={labelClass(locked, current, lifted)} aria-hidden>
      <span className="truncate">{name}</span>
    </span>
    {/* On a phone the name is hidden, so a gold mark under the icon shows the current place. */}
    <span
      className={cn(
        "pointer-events-none absolute -bottom-0.5 hidden h-[3px] w-5 rounded-full bg-[#ffd75a] shadow-[0_0_6px_rgba(255,215,90,0.8)]",
        current && "[@media(max-height:500px)]:block"
      )}
      aria-hidden
    />
  </>
);

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
 * any shortcut, because a phone shows the icons only. The Deck shortcut opens
 * the Deck dialog over the current screen, and its icon stays lifted while
 * the dialog is open.
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const name = tr(`town.shortcuts.${shortcut.id}`);
  const { screen, dialog } = shortcut;
  const locked = isLocked(shortcut);

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
    } else if (dialog) {
      setOpen(false);
      setDialogOpen(true);
    } else if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };

  return (
    // The Town shortcut stands apart, at the left end, after a carved groove.
    <li
      className={cn(
        "max-w-24 min-w-0 flex-1 basis-0",
        "[@media(max-height:500px)]:max-w-11",
        "first:mr-1.5 first:border-r-2 first:border-r-[#1f130a] first:pr-1.5 first:shadow-[2px_0_0_rgba(255,226,170,0.1)]"
      )}
    >
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
          className={shortcutButtonClass(locked)}
          data-testid={`town-shortcut-${shortcut.id}`}
          data-locked={lockedAttr(locked)}
        >
          <ShortcutFace
            image={shortcutImage(shortcut.id)}
            name={name}
            locked={locked}
            current={current}
            lifted={dialogOpen}
          />
        </Button>
        <Tooltip
          placement="top"
          offset={14}
          className="rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1 text-center text-xs font-semibold text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
          data-testid={`town-tooltip-${shortcut.id}`}
        >
          {name}
          <OpensLater locked={locked} />
        </Tooltip>
      </TooltipTrigger>
      {dialog === "deck" ? (
        <DeckDialog isOpen={dialogOpen} onOpenChange={setDialogOpen} />
      ) : null}
    </li>
  );
};

/**
 * The Settings button at the right end of the Town Bar, after a carved groove
 * (GDD 11.4). It opens the Settings dialog over the current screen. It is not
 * a screen, so it never shows the current state or the lock.
 */
const SettingsButton = () => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);
  const name = tr("settings.title");
  return (
    <div
      className={cn(
        "relative w-24 shrink-0 border-l-2 border-l-[#1f130a] pl-1.5 shadow-[inset_2px_0_0_rgba(255,226,170,0.1)] max-[1199px]:w-20",
        "[@media(max-height:500px)]:w-[52px]"
      )}
    >
      <DialogTrigger isOpen={open} onOpenChange={setOpen}>
        <Button
          aria-label={name}
          className={shortcutButtonClass(false)}
          data-testid="town-settings"
        >
          <ShortcutFace
            image={shortcutImage("settings")}
            name={name}
            locked={false}
            current={false}
            lifted={open}
          />
        </Button>
        <SettingsDialog />
      </DialogTrigger>
    </div>
  );
};

/**
 * The Town Bar (GDD 11.4): a wood shelf with the shortcuts to the game
 * screens, then the Settings button. The names sit on the flat front lip of
 * the shelf. It shows on each screen except the Battle.
 */
export const TownBar = ({
  screen,
  onOpen,
}: {
  readonly screen: GameScreen;
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const { tr } = useGameText();
  return (
    <nav
      aria-label={tr("town.bar")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex h-[calc(76px+max(4px,env(safe-area-inset-bottom)))] items-end justify-between gap-3 border-t-4 border-[#2a1a0c] px-2 pt-1.5",
        "shadow-[inset_0_2px_0_rgba(231,187,106,0.3),0_-4px_12px_rgba(0,0,0,0.35)]",
        "pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(4px,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))]",
        "[@media(max-height:500px)]:h-[calc(52px+max(4px,env(safe-area-inset-bottom)))] [@media(max-height:500px)]:border-t-[3px] [@media(max-height:500px)]:pt-1"
      )}
      style={{
        // Dark wood with a faint grain, as the Hand Bar.
        background: [
          "repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 15px)",
          "linear-gradient(180deg, #5a3a20 0%, #4a2f1b 40%, #2e1d10 100%)",
        ].join(", "),
      }}
      data-testid="town-bar"
    >
      {/* The flat front lip of the shelf, under the names. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[calc(22px+max(4px,env(safe-area-inset-bottom)))] border-t border-[#e7bb6a]/20 bg-[#24170c] shadow-[0_-1px_0_rgba(0,0,0,0.45)]",
          "[@media(max-height:500px)]:hidden"
        )}
        aria-hidden
      />
      <ul className="relative flex min-w-0 flex-1 items-end gap-1">
        {TOWN_SHORTCUTS.map((shortcut) => (
          <Shortcut
            key={shortcut.id}
            shortcut={shortcut}
            current={shortcut.screen === screen}
            onOpen={onOpen}
          />
        ))}
      </ul>
      <SettingsButton />
    </nav>
  );
};
