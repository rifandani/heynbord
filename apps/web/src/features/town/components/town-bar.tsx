import { useAtom, useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties, FocusEvent, RefObject } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, DialogTrigger, TooltipTrigger } from "react-aria-components";

import { GameTooltip } from "@/core/components/game/game-tooltip";
import { goldFace } from "@/core/components/game/surfaces";
import { useEverOpened } from "@/core/hooks/use-ever-opened";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { HandbookIcon } from "@/features/handbook/components/handbook-icon";
import { useHandbook } from "@/features/handbook/use-handbook";
import type { HintId } from "@/features/hint/hint";
import { HINT_PLACE } from "@/features/hint/hint";
import { shownHintAtom } from "@/features/hint/hint.atoms";
import { objectivesBadgeAtom } from "@/features/objectives/objectives.atoms";
import { useObjectivesDialog } from "@/features/objectives/use-objectives-dialog";
import { useShipBack } from "@/features/seaport/use-seaport";
import { SettingsDialog } from "@/features/town/components/settings-dialog";
import { useTownLockText } from "@/features/town/components/town-lock";
import {
  TOWN_BADGE_DROP,
  TOWN_COUNT_DROP,
  TOWN_CURRENT_GLOW,
  TOWN_CURRENT_MARK_DROP,
  TOWN_ICON_CONTACT,
  TOWN_PULL_DROP,
  TOWN_ROLLER_CAP,
  TOWN_ROLLER_CAP_DROP,
  TOWN_ROLLER_CLOTH,
  TOWN_ROLLER_DROP,
  TOWN_SASH_CLOTH,
  TOWN_SASH_DROP,
  TOWN_SASH_NAME_SHADOW,
  TOWN_SEAL_DROP,
} from "@/features/town/tokens";
import type { GameScreen, TownLock, TownShortcut } from "@/features/town/town";
import {
  isLocked,
  paintedIcon,
  TOWN_BAR_GROUP_STARTS,
  TOWN_SHORTCUTS,
  shortcutImage,
  townLock,
} from "@/features/town/town";
import {
  townBarCollapsedAtom,
  townProgressAtom,
} from "@/features/town/town.atoms";

const LONG_PRESS_MS = 450;

/**
 * The Deck builder loads in its own chunk (issue 139). The Deck shortcut asks
 * for the chunk when the Player goes to it, or after the Town is quiet, so a
 * press has no wait. A touch has no hover, and a tap is too late to help.
 */
const loadDeckDialog = () => import("@/features/deck/components/deck-dialog");

/** Asks for the chunk. After a failed load, a press asks for it again. */
const prepareDeckDialog = async (setReady: (ready: boolean) => void) => {
  try {
    await loadDeckDialog();
    setReady(true);
  } catch {
    setReady(false);
  }
};

/** After the first load (NFR-02), so its JavaScript budget has no change. */
const DECK_CHUNK_WAIT_MS = 5000;

const DeckDialog = lazy(async () => {
  const module = await loadDeckDialog();
  return { default: module.DeckDialog };
});

const pageCurrent = (current: boolean) => (current ? "page" : undefined);

const lockedAttr = (locked: boolean) => locked || undefined;

/** The curve of the sash and the roller. The two move as one piece of cloth. */
const SASH_MOTION = "duration-[460ms] ease-[cubic-bezier(0.33,0.9,0.28,1)]";

/** The cut end of the sash, as a swallowtail. */
const SASH_CUT = "[clip-path:polygon(0_0,100%_0,100%_100%,0_100%,14px_50%)]";

/**
 * The stow delay in ms of each place on the bar, from the left. Each value is
 * the time that the cut end of the sash takes to reach that place on the
 * `SASH_MOTION` curve, less 60ms, so a name never stands on the painting.
 */
const STOW_DELAYS_MS = [
  0, 0, 0, 0, 0, 10, 23, 37, 52, 70, 92, 125, 194,
] as const;

/**
 * A shortcut sinks when the cut end of the sash reaches it, from the left to
 * the right, and it stands up again in the opposite order. Each motion of the
 * bar waits for `data-town-bar-ready`, so a saved stowed bar shows at once.
 */
const SINK_CLASS = cn(
  "in-data-[town-bar-ready]:transition-[translate,opacity] in-data-[town-bar-ready]:duration-[260ms]",
  "ease-out motion-reduce:transition-none",
  "[transition-delay:calc(var(--town-bar-after)*20ms+90ms)]",
  "group-data-[collapsed]/town-bar:translate-y-[38px] group-data-[collapsed]/town-bar:opacity-0",
  "group-data-[collapsed]/town-bar:[transition-delay:var(--town-bar-before)] group-data-[collapsed]/town-bar:duration-200"
);

/** The place of a shortcut in the sink order. */
const sinkStyle = (index: number) =>
  // SAFETY: both keys are custom properties, which `CSSProperties` does not list.
  ({
    "--town-bar-before": `${STOW_DELAYS_MS[index]}ms`,
    "--town-bar-after": TOWN_SHORTCUTS.length - index,
  }) as CSSProperties;

/**
 * The painted icon stands above its label (11 — Town Concepts 7). The current one stands a
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
    "drop-shadow-icon relative size-full object-contain transition-[filter] duration-200 select-none",
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
    "relative mb-px flex h-[18px] max-w-full items-center rounded-[4px] border px-1.5 text-[11px] leading-none font-bold transition-[color,transform] duration-100 max-[1199px]:px-1 max-[1199px]:text-[10px] max-[1199px]:tracking-[-0.02em]",
    "[@media(max-height:500px)]:sr-only",
    current ? cn(goldFace, TOWN_BADGE_DROP) : "border-transparent",
    !current && locked && "text-cream-dim font-semibold",
    !current &&
      !locked &&
      "text-cream group-data-[hovered]:text-gold-light group-data-[pressed]:translate-y-px",
    lifted && "text-gold-light"
  );

/** The button of a shortcut: no fill, because the painted icon is the piece. */
const shortcutButtonClass = (locked: boolean) =>
  cn(
    "group data-[focus-visible]:ring-focus-cream relative flex h-[66px] w-full flex-col items-center justify-end rounded-lg outline-none select-none data-[focus-visible]:ring-4",
    SINK_CLASS,
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
        "border-gold-trim/70 bg-night-plate/90 absolute right-0.5 bottom-0.5 grid size-[18px] place-items-center rounded-full border",
        TOWN_SEAL_DROP,
        "[@media(max-height:500px)]:right-0 [@media(max-height:500px)]:bottom-0 [@media(max-height:500px)]:size-4"
      )}
    >
      <GlyphIcon glyph="lock" className="text-gold-trim size-2.5" />
    </span>
  );
};

/**
 * The count of a shortcut, on a small gold token at the top right of the
 * icon: for the Achievements shortcut, the Completed Achievements that the
 * Player has not claimed (Achievements 4); for the Seaport shortcut, 1 while
 * the ship is back and waits for a Collect. It shows nothing at 0. The number
 * hops when it changes. Decorative: the accessible name of the shortcut says
 * the count.
 */
const CountBadge = ({
  count,
  testId,
}: {
  readonly count: number;
  readonly testId?: string;
}) => {
  if (count === 0) {
    return null;
  }
  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 px-1 text-[11px] leading-none font-black tabular-nums",
        goldFace,
        TOWN_COUNT_DROP,
        "[@media(max-height:500px)]:-top-1 [@media(max-height:500px)]:-right-1 [@media(max-height:500px)]:h-4 [@media(max-height:500px)]:min-w-4 [@media(max-height:500px)]:border [@media(max-height:500px)]:text-[10px]"
      )}
      data-testid={testId}
      data-count={count}
    >
      <span
        key={count}
        className="inline-block motion-safe:animate-[workshop-count_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        {count}
      </span>
    </span>
  );
};

/**
 * The icon of a shortcut: its painted icon, or a temporary icon in the same
 * slot until a person paints it (11 — Town Concepts 7).
 */
const ShortcutIcon = ({
  image,
  className,
}: {
  readonly image: string | null;
  readonly className: string;
}) =>
  image ? (
    <img
      src={image}
      alt=""
      width={128}
      height={128}
      draggable={false}
      decoding="async"
      className={className}
    />
  ) : (
    <HandbookIcon className={cn(className, "p-2")} />
  );

/** The gold diamond on the sash, between two groups of shortcuts. */
const GroupDiamond = () => (
  <span
    className={cn(
      "bg-gold-trim pointer-events-none absolute bottom-1.5 -left-2.5 size-2 rotate-45 transition-opacity duration-200 motion-reduce:transition-none",
      "group-data-[collapsed]/town-bar:opacity-0 [@media(max-height:500px)]:hidden"
    )}
    aria-hidden
  />
);

/** The small gold token of a reward that waits behind the stowed bar. */
const PULL_BADGE = cn(
  "grid h-4 min-w-4 place-items-center rounded-full border px-1 text-[10px] leading-none font-black tabular-nums",
  goldFace,
  TOWN_SEAL_DROP
);

/**
 * The roller at the right corner, and its brass pull. It is the one control
 * of the stowed bar: it opens and closes the bar, and it carries the gold
 * tokens of the rewards that wait behind it (Achievements, Seaport). It stays
 * in one place, and it grows when the sash winds onto it.
 */
const BarPull = ({
  collapsed,
  label,
  tooltip,
  claimable,
  shipBack,
  onPress,
  buttonRef,
}: {
  readonly collapsed: boolean;
  readonly label: string;
  readonly tooltip: string;
  readonly claimable: number;
  readonly shipBack: boolean;
  readonly onPress: () => void;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
}) => (
  <TooltipTrigger delay={200}>
    <Button
      ref={buttonRef}
      aria-label={label}
      aria-expanded={!collapsed}
      aria-controls="town-bar-content"
      onPress={onPress}
      data-testid="town-bar-pull"
      className={cn(
        "group/bar-pull absolute right-[max(0.375rem,env(safe-area-inset-right))] bottom-0 z-40 flex h-[calc(2.75rem+env(safe-area-inset-bottom))] min-w-11 items-end justify-end gap-1 rounded-lg pr-1.5 outline-none select-none",
        "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4"
      )}
    >
      {collapsed && (claimable > 0 || shipBack) ? (
        <span
          className="mb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-1 motion-safe:animate-[town-bar-seal-in_200ms_ease-out_340ms_backwards]"
          aria-hidden
        >
          {claimable > 0 ? (
            <span className={PULL_BADGE}>{claimable}</span>
          ) : null}
          {shipBack ? (
            <span className={cn(PULL_BADGE, "w-4 px-0")}>
              <GlyphIcon glyph="anchor" className="size-2.5" />
            </span>
          ) : null}
        </span>
      ) : null}
      <span
        className={cn(
          "relative block h-[calc(37px+env(safe-area-inset-bottom))] shrink-0 rounded-[3px]",
          TOWN_ROLLER_DROP,
          "in-data-[town-bar-ready]:transition-[width]",
          SASH_MOTION,
          "motion-reduce:transition-none",
          collapsed ? "w-10" : "w-[30px]"
        )}
        style={{ background: TOWN_ROLLER_CLOTH }}
      >
        <span
          className={cn(
            "absolute inset-x-[-2px] -top-[3px] h-1.5 rounded-[2px]",
            TOWN_ROLLER_CAP_DROP
          )}
          style={{ background: TOWN_ROLLER_CAP }}
          aria-hidden
        />
        <span
          className={cn(
            "absolute inset-x-[-2px] bottom-0 h-1.5 rounded-[2px]",
            TOWN_ROLLER_CAP_DROP
          )}
          style={{ background: TOWN_ROLLER_CAP }}
          aria-hidden
        />
        <span
          className={cn(
            "border-frame-wood absolute inset-x-0 bottom-[calc(9px+env(safe-area-inset-bottom))] mx-auto grid size-[22px] place-items-center rounded-[3px] border",
            "from-bronze-light via-bronze-mid to-bronze-deep bg-gradient-to-b",
            TOWN_PULL_DROP,
            "transition-[filter,transform,box-shadow] duration-100 group-hover/bar-pull:brightness-110",
            "group-data-[pressed]/bar-pull:shadow-piece-press group-data-[pressed]/bar-pull:translate-y-px",
            "motion-reduce:transition-none"
          )}
        >
          <GlyphIcon
            glyph="chevron"
            className={cn(
              "text-ink-on-gold size-2.5 transition-transform duration-200 motion-reduce:transition-none",
              collapsed && "rotate-180"
            )}
          />
        </span>
      </span>
    </Button>
    <GameTooltip
      placement="top"
      offset={12}
      className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece rounded-lg border-2 px-2.5 py-1 text-center text-xs font-semibold"
    >
      {tooltip}
    </GameTooltip>
  </TooltipTrigger>
);

/**
 * The face of a shortcut: its light, its contact shadow, its painted icon and
 * its name over the painting.
 */
const ShortcutFace = ({
  image,
  name,
  locked,
  current,
  lifted = false,
  count = 0,
  badgeTestId,
  labelTestId,
}: {
  readonly image: string | null;
  readonly name: string;
  readonly locked: boolean;
  readonly current: boolean;
  readonly lifted?: boolean;
  /** The count on the badge of the icon, for the Achievements and Seaport shortcuts. */
  readonly count?: number;
  readonly badgeTestId?: string;
  /** The name below the icon. */
  readonly labelTestId?: string;
}) => (
  <>
    {/* The light of the current place, and the shadow under each icon. */}
    <span
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-3 mx-auto h-[70px] w-[76px] opacity-0 transition-opacity duration-300",
        "[@media(max-height:500px)]:-bottom-2 [@media(max-height:500px)]:h-14 [@media(max-height:500px)]:w-14",
        current && "opacity-100"
      )}
      style={{ background: TOWN_CURRENT_GLOW }}
      aria-hidden
    />
    <span
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-[17px] mx-auto h-2 w-12",
        "[@media(max-height:500px)]:-bottom-1 [@media(max-height:500px)]:w-9"
      )}
      style={{ background: TOWN_ICON_CONTACT }}
      aria-hidden
    />
    <span className={iconStandClass(locked, current, lifted)} aria-hidden>
      <ShortcutIcon
        image={image}
        className={iconClass(locked, current, lifted)}
      />
      <LockSeal locked={locked} />
      <CountBadge count={count} testId={badgeTestId} />
    </span>
    <span
      className={labelClass(locked, current, lifted)}
      style={{ textShadow: current ? undefined : TOWN_SASH_NAME_SHADOW }}
      aria-hidden
    >
      <span className="truncate" data-testid={labelTestId}>
        {name}
      </span>
    </span>
    {/* On a phone the name is hidden, so a gold mark under the icon shows the current place. */}
    <span
      className={cn(
        "bg-ready-gold pointer-events-none absolute -bottom-0.5 hidden h-[3px] w-5 rounded-full",
        TOWN_CURRENT_MARK_DROP,
        current && "[@media(max-height:500px)]:block"
      )}
      aria-hidden
    />
  </>
);

/**
 * The text of a lock: "Opens at level N" or "Win Marrow Castle (5-10) to
 * open" for a screen that the Player has not unlocked, else "Opens later".
 * `null` for an open shortcut.
 */
const useLockText = (locked: boolean, lock: TownLock | null) => {
  const { tr } = useGameText();
  const text = useTownLockText();
  if (!locked) {
    return null;
  }
  return lock === null ? tr("town.opensLater") : text.reason(lock);
};

/**
 * The accessible name of a shortcut: its name, and its lock, or what its
 * badge says ("Achievements, 2 to claim", "Seaport, the ship is back").
 */
const useShortcutName = (
  shortcut: TownShortcut["id"],
  name: string,
  locked: boolean,
  lock: TownLock | null,
  count: number
) => {
  const { tr } = useGameText();
  const text = useTownLockText();
  if (!locked) {
    if (count === 0) {
      return name;
    }
    return shortcut === "seaport"
      ? tr("town.shipBack", { name })
      : tr("town.shortcutBadge", { name, count });
  }
  return lock === null ? tr("town.locked", { name }) : text.named(name, lock);
};

/**
 * One Town Bar shortcut. A shortcut to a screen that does not exist yet, or
 * that the Player level has not unlocked (GDD 11.4), keeps keyboard focus,
 * and its accessible name says "opens later" or "opens at level N". Hover and focus
 * show its tooltip; on touch, a tap shows it. A long press shows the name of
 * any shortcut, because a phone shows the icons only. The Deck shortcut opens
 * the Deck dialog over the current screen, and the Handbook shortcut opens
 * the Handbook. Their icons stay lifted while their dialogs are open.
 */
const Shortcut = ({
  shortcut,
  index,
  current,
  onOpen,
}: {
  readonly shortcut: TownShortcut;
  readonly index: number;
  readonly current: boolean;
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  // The dialog stays in the page after its first open, so it can close on its
  // spine. `dialogOpen` alone would remove it before the exit animation.
  const deckOpened = useEverOpened(dialogOpen);
  // A closed dialog mounts when its chunk is ready, so that a press does not
  // suspend: React holds the reveal after a Suspense fallback for 300 ms.
  const [deckReady, setDeckReady] = useState(false);
  const handbook = useHandbook();
  const name = tr(`town.shortcuts.${shortcut.id}`);
  const { screen, dialog } = shortcut;
  const progress = useAtomValue(townProgressAtom);
  const locked = isLocked(shortcut, progress);
  const lock = townLock(shortcut, progress);
  const lockText = useLockText(locked, lock);
  const objectivesBadge = useAtomValue(objectivesBadgeAtom);
  const objectives = useObjectivesDialog();
  const shipBack = useShipBack();
  let count = 0;
  if (shortcut.id === "objectives") {
    count = objectivesBadge;
  } else if (shortcut.id === "seaport" && !locked && shipBack) {
    count = 1;
  }
  let dialogLifted = dialogOpen;
  if (dialog === "handbook") {
    dialogLifted = handbook.isOpen;
  } else if (dialog === "objectives") {
    dialogLifted = objectives.isOpen;
  }
  const accessibleName = useShortcutName(
    shortcut.id,
    name,
    locked,
    lock,
    count
  );

  const prepare = () => {
    if (dialog === "deck") {
      prepareDeckDialog(setDeckReady);
    }
  };
  useEffect(() => {
    if (dialog !== "deck") {
      return;
    }
    const wait = setTimeout(
      prepareDeckDialog,
      DECK_CHUNK_WAIT_MS,
      setDeckReady
    );
    return () => clearTimeout(wait);
  }, [dialog]);
  const onPressStart = (event: PressEvent) => {
    prepare();
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
    if (screen && !locked) {
      setOpen(false);
      onOpen(screen);
    } else if (dialog === "handbook") {
      setOpen(false);
      handbook.open();
    } else if (dialog === "objectives") {
      setOpen(false);
      objectives.open();
    } else if (dialog) {
      setOpen(false);
      setDialogOpen(true);
    } else if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };

  const groupStart = TOWN_BAR_GROUP_STARTS.has(shortcut.id);

  return (
    // The Town shortcut stands apart at the left end.
    <li
      className={cn(
        "relative max-w-38 min-w-0 flex-1 basis-0",
        "first:mr-1.5 first:pr-1.5",
        groupStart && "ml-3.5 [@media(max-height:500px)]:ml-0"
      )}
      style={sinkStyle(index)}
    >
      {groupStart ? <GroupDiamond /> : null}
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
          aria-label={accessibleName}
          aria-current={pageCurrent(current)}
          onHoverStart={prepare}
          onFocus={prepare}
          onPressStart={onPressStart}
          onPressEnd={onPressEnd}
          onPress={onPress}
          className={shortcutButtonClass(locked)}
          data-testid={`town-shortcut-${shortcut.id}`}
          data-pad-shortcut
          data-locked={lockedAttr(locked)}
        >
          <ShortcutFace
            image={paintedIcon(shortcut.id)}
            name={name}
            locked={locked}
            current={current}
            lifted={dialogLifted}
            count={count}
            badgeTestId={`${shortcut.id}-badge`}
            labelTestId={`town-shortcut-name-${shortcut.id}`}
          />
        </Button>
        <GameTooltip
          placement="top"
          offset={14}
          className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece rounded-lg border-2 px-2.5 py-1 text-center text-xs font-semibold"
          data-testid={`town-tooltip-${shortcut.id}`}
        >
          {name}
          {lockText === null ? null : (
            <span className="text-gold-trim block font-normal">{lockText}</span>
          )}
        </GameTooltip>
      </TooltipTrigger>
      {dialog === "deck" && (deckOpened || deckReady) ? (
        <Suspense fallback={null}>
          <DeckDialog isOpen={dialogOpen} onOpenChange={setDialogOpen} />
        </Suspense>
      ) : null}
    </li>
  );
};

/**
 * The Settings button at the right end of the Town Bar
 * (GDD 11.4). It opens the Settings dialog over the current screen. It is not
 * a screen, so it never shows the current state or the lock.
 */
const SettingsButton = () => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const name = tr("settings.title");
  return (
    <div
      className="relative w-[calc(var(--town-bar-settings-w)-0.5rem)] shrink-0 pl-1.5"
      style={sinkStyle(TOWN_SHORTCUTS.length)}
    >
      <GroupDiamond />
      <DialogTrigger isOpen={open} onOpenChange={setOpen}>
        <Button
          ref={button}
          aria-label={name}
          className={shortcutButtonClass(false)}
          data-testid="town-settings"
          data-pad-shortcut
        >
          <ShortcutFace
            image={shortcutImage("settings")}
            name={name}
            locked={false}
            current={false}
            lifted={open}
            labelTestId="town-settings-name"
          />
        </Button>
        <SettingsDialog from={button} />
      </DialogTrigger>
    </div>
  );
};

/**
 * The Town Bar (GDD 11.4), the Royal Sash: a thin blue cloth holds the names
 * of the shortcuts and of Settings, and the painted icons stand on it, over
 * the painting. It shows on each screen except the Battle.
 *
 * The bar can stow away from any screen. The choice is saved per device. The
 * cloth winds onto its roller, and each shortcut sinks when the cut end of the
 * cloth passes it. The roller is the only control that stays: it opens the
 * bar, carries the tokens of the rewards that wait behind it, and takes the
 * focus when the shortcuts go away. The docked panels follow the live
 * `--town-bar` height.
 */
export const TownBar = ({
  screen,
  onOpen,
}: {
  readonly screen: GameScreen;
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const { tr } = useGameText();
  const [savedCollapsed, setSavedCollapsed] = useAtom(townBarCollapsedAtom);
  const [dismissedHint, setDismissedHint] = useState<HintId | null>(null);
  const shownHint = useAtomValue(shownHintAtom);
  // The pull carries the rewards to claim of the Objectives dialog.
  const claimable = useAtomValue(objectivesBadgeAtom);
  const progress = useAtomValue(townProgressAtom);
  const shipBack = useShipBack();
  const pull = useRef<HTMLButtonElement>(null);
  const focusInBar = useRef(false);
  const seaport = TOWN_SHORTCUTS.find((shortcut) => shortcut.id === "seaport");
  const seaportBack =
    shipBack && seaport !== undefined && !isLocked(seaport, progress);

  // The Hints that point at a Town Bar shortcut. A stowed menu cannot show
  // it, so the menu comes back for the Hint, unless the Player put it away
  // again while the same Hint was open.
  const hintPlace = shownHint === null ? null : HINT_PLACE[shownHint];
  const hintWantsBar =
    hintPlace === "deckShortcut" ||
    hintPlace === "objectivesShortcut" ||
    hintPlace === "cave" ||
    hintPlace === "quay";
  const effectiveCollapsed =
    savedCollapsed && !(hintWantsBar && dismissedHint !== shownHint);

  // One source of truth for every screen's floor. `--town-bar` transitions
  // from this attribute (globals.css), so the docked panels follow.
  // The ready flag waits one frame: a saved stowed rail appears at once, and
  // only later toggles animate.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.townBar = effectiveCollapsed ? "collapsed" : "expanded";
    const frame = requestAnimationFrame(() => {
      root.dataset.townBarReady = "";
    });
    return () => cancelAnimationFrame(frame);
  }, [effectiveCollapsed]);

  // The shortcuts are about to leave the focus order. Move the focus to the
  // pull when the Player was using them, also when a Hint closes the menu.
  useLayoutEffect(() => {
    if (!effectiveCollapsed || !focusInBar.current) {
      return;
    }
    focusInBar.current = false;
    pull.current?.focus();
  }, [effectiveCollapsed]);

  useEffect(
    () => () => {
      delete document.documentElement.dataset.townBar;
      delete document.documentElement.dataset.townBarReady;
    },
    []
  );

  const onContentFocus = () => {
    focusInBar.current = true;
  };
  const onContentBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      focusInBar.current = false;
    }
  };

  const toggle = () => {
    if (effectiveCollapsed) {
      setSavedCollapsed(false);
    } else {
      if (shownHint !== null) {
        setDismissedHint(shownHint);
      }
      setSavedCollapsed(true);
    }
    unlockAudio();
    playSound("select");
  };

  const baseLabel = effectiveCollapsed
    ? tr("town.showBar")
    : tr("town.hideBar");
  const attention = [
    claimable > 0
      ? tr("town.shortcutBadge", {
          name: tr("town.shortcuts.objectives"),
          count: claimable,
        })
      : null,
    seaportBack
      ? tr("town.shipBack", { name: tr("town.shortcuts.seaport") })
      : null,
  ]
    .filter((line): line is string => line !== null)
    .join(". ");
  const pullLabel = attention === "" ? baseLabel : `${baseLabel}. ${attention}`;

  return (
    <nav
      aria-label={tr("town.bar")}
      className="group/town-bar fixed inset-x-0 bottom-0 z-30 h-[var(--town-bar)]"
      data-testid="town-bar"
      data-pad-town-bar
      data-collapsed={effectiveCollapsed || undefined}
    >
      {/* The box keeps its height when the bar stows, so the shortcuts sink
          and the cloth winds away on the screen. */}
      <div
        id="town-bar-content"
        inert={effectiveCollapsed}
        onFocus={onContentFocus}
        onBlur={onContentBlur}
        className={cn(
          // The icons extend above the top edge of the bar.
          "absolute inset-x-0 bottom-0 h-[calc(var(--town-bar-shelf)+2rem)] overflow-hidden",
          effectiveCollapsed && "pointer-events-none"
        )}
      >
        {/* The cloth stops at the center of the roller, and it goes under it. */}
        <div
          className={cn(
            "absolute bottom-0 left-0 h-[calc(34px+env(safe-area-inset-bottom))] overflow-hidden",
            "right-[calc(max(0.375rem,env(safe-area-inset-right))+1.25rem)]",
            "[@media(max-height:500px)]:h-[calc(16px+env(safe-area-inset-bottom))]"
          )}
          aria-hidden
        >
          <div
            className={cn(
              "absolute right-0 bottom-0 -left-6 h-[calc(27px+env(safe-area-inset-bottom))]",
              "[@media(max-height:500px)]:h-[calc(11px+env(safe-area-inset-bottom))]",
              TOWN_SASH_DROP,
              "in-data-[town-bar-ready]:transition-transform",
              SASH_MOTION,
              "motion-reduce:transition-none",
              effectiveCollapsed && "translate-x-full"
            )}
          >
            <div className={cn("bg-gold-trim absolute inset-0", SASH_CUT)} />
            <div
              className={cn("absolute inset-0 top-0.5 left-1", SASH_CUT)}
              style={{ background: TOWN_SASH_CLOTH }}
            />
          </div>
        </div>
        <div
          className={cn(
            "absolute inset-x-0 bottom-[max(4px,env(safe-area-inset-bottom))] flex h-[66px] items-end justify-between gap-3",
            "pr-[calc(max(0.375rem,env(safe-area-inset-right))+2.75rem)] pl-[max(0.5rem,env(safe-area-inset-left))]",
            "[@media(max-height:500px)]:h-11"
          )}
        >
          <ul className="relative flex min-w-0 flex-1 items-end justify-center gap-1">
            {TOWN_SHORTCUTS.map((shortcut, index) => (
              <Shortcut
                key={shortcut.id}
                shortcut={shortcut}
                index={index}
                current={shortcut.screen === screen}
                onOpen={onOpen}
              />
            ))}
          </ul>
          <SettingsButton />
        </div>
      </div>
      <BarPull
        collapsed={effectiveCollapsed}
        label={pullLabel}
        tooltip={baseLabel}
        claimable={claimable}
        shipBack={seaportBack}
        onPress={toggle}
        buttonRef={pull}
      />
    </nav>
  );
};
