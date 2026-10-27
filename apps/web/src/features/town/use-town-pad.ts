import { useEffect, useRef } from "react";

import { focusables, nextFocusable } from "@/core/input/focus";
import type { PadControl, PadDirection } from "@/core/input/gamepad";
import { useGamepad } from "@/core/input/use-gamepad";
import { isTyping } from "@/features/battle/components/battle-input";
import type { GameScreen } from "@/features/town/town";
import { SELECTABLE_BUILDINGS } from "@/features/town/town";
import type {
  TownPadBuilding,
  TownPadCurrent,
  TownPadTarget,
} from "@/features/town/town-pad";
import { townPadTarget } from "@/features/town/town-pad";

const INPUT_CONTROL =
  'input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="reset"]';
const CLICKABLE =
  'button, a[href], summary, [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"]';
const CLOSE_CONTROL =
  '[slot="close"], [data-dismiss], [data-testid$="-close"], [aria-label="Close" i], [aria-label="Tutup" i]';

interface PadFocus {
  pad: boolean;
  marked: readonly HTMLElement[];
}

interface PadContext {
  readonly current: HTMLElement | null;
  readonly dialog: HTMLElement | undefined;
  readonly screen: GameScreen;
  readonly onOpen: (screen: GameScreen) => void;
}

/** The Buildings and the Town Bar of the screen, with the elements to focus. */
interface TownPadView {
  readonly layout: {
    readonly buildings: readonly TownPadBuilding[];
    readonly bar: readonly number[];
    readonly current: TownPadCurrent | null;
  };
  readonly buildings: readonly HTMLElement[];
  readonly bar: readonly HTMLElement[];
}

const clearMark = (state: PadFocus) => {
  for (const element of state.marked) {
    delete element.dataset.padFocus;
  }
  state.marked = [];
};

/** React Aria puts radio, switch and slider inputs in a small hidden box. */
const ringSurface = (element: HTMLElement): HTMLElement | null =>
  element.matches(INPUT_CONTROL)
    ? element.closest<HTMLElement>("label, [data-rac]")
    : null;

const markFocus = (state: PadFocus, element: HTMLElement) => {
  clearMark(state);
  const surface = ringSurface(element);
  state.marked =
    surface && surface !== element ? [element, surface] : [element];
  for (const marked of state.marked) {
    marked.dataset.padFocus = "";
  }
};

const focusWithPad = (state: PadFocus, element: HTMLElement | null) => {
  if (!element) {
    return;
  }
  state.pad = true;
  element.focus();
  if (document.activeElement === element) {
    markFocus(state, element);
  }
};

const screenCenter = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

const buildingElements = (): readonly HTMLElement[] => {
  const town = document.querySelector("[data-pad-town]");
  return town
    ? focusables(town).filter(
        (element) => element.dataset.buildingId !== undefined
      )
    : [];
};

const barElements = (): readonly HTMLElement[] => {
  const bar = document.querySelector("[data-pad-town-bar]");
  return bar
    ? focusables(bar).filter((element) =>
        Object.hasOwn(element.dataset, "padShortcut")
      )
    : [];
};

const buildingLayout = (
  elements: readonly HTMLElement[]
): readonly TownPadBuilding[] =>
  SELECTABLE_BUILDINGS.flatMap(({ id, rect }) => {
    const element = elements.find((item) => item.dataset.buildingId === id);
    return element
      ? [{ rect: { id, ...rect }, centerX: screenCenter(element) }]
      : [];
  });

const townPadCurrent = (bar: readonly HTMLElement[]): TownPadCurrent | null => {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return null;
  }
  if (active.dataset.buildingId) {
    return { zone: "building", id: active.dataset.buildingId };
  }
  const index = bar.indexOf(active);
  return index === -1 ? null : { zone: "bar", index };
};

const readTownPad = (): TownPadView | null => {
  const buildings = buildingElements();
  if (buildings.length === 0) {
    return null;
  }
  const bar = barElements();
  return {
    layout: {
      buildings: buildingLayout(buildings),
      bar: bar.map(screenCenter),
      current: townPadCurrent(bar),
    },
    buildings,
    bar,
  };
};

const focusBuilding = (state: PadFocus, view: TownPadView, id: string) => {
  focusWithPad(
    state,
    view.buildings.find((element) => element.dataset.buildingId === id) ?? null
  );
};

const focusBar = (state: PadFocus, view: TownPadView, index: number) => {
  focusWithPad(state, view.bar[index] ?? null);
};

const focusTarget = (
  state: PadFocus,
  view: TownPadView,
  target: TownPadTarget | null
) => {
  if (!target) {
    return;
  }
  if (target.zone === "bar") {
    focusBar(state, view, target.index);
    return;
  }
  focusBuilding(state, view, target.id);
};

const handleTownDirection = (state: PadFocus, direction: PadDirection) => {
  const view = readTownPad();
  if (view) {
    focusTarget(state, view, townPadTarget(view.layout, direction));
  }
};

const activeDialog = (): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].findLast(
    (element) => !element.closest('[aria-hidden="true"], [inert], [hidden]')
  );

const stepFocus = (
  scope: Document | HTMLElement,
  current: HTMLElement | null,
  direction: PadDirection
): HTMLElement | null =>
  nextFocusable(
    scope,
    current,
    direction === "up" || direction === "left" ? -1 : 1
  );

const handleDialogDirection = (
  state: PadFocus,
  context: PadContext,
  direction: PadDirection
) => {
  if (!context.dialog) {
    return;
  }
  focusWithPad(state, stepFocus(context.dialog, context.current, direction));
};

const handleScreenDirection = (
  state: PadFocus,
  context: PadContext,
  direction: PadDirection
) => {
  if (context.screen === "town") {
    handleTownDirection(state, direction);
    return;
  }
  focusWithPad(state, stepFocus(document, context.current, direction));
};

const handleDirection = (
  state: PadFocus,
  context: PadContext,
  direction: PadDirection
) => {
  if (context.dialog) {
    handleDialogDirection(state, context, direction);
    return;
  }
  handleScreenDirection(state, context, direction);
};

const closeControl = (dialog: HTMLElement): HTMLElement | undefined =>
  focusables(dialog).find((element) => element.matches(CLOSE_CONTROL));

const closeDialog = (dialog: HTMLElement, state: PadFocus) => {
  const close = closeControl(dialog);
  if (close) {
    focusWithPad(state, close);
    close.click();
    return;
  }
  // React Aria owns dismissal. Escape is only the fallback for a dialog
  // with no close control, and must never become a screen command.
  const target = dialog.contains(document.activeElement)
    ? document.activeElement
    : dialog;
  target?.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    })
  );
};

const isClickable = (element: HTMLElement | null): element is HTMLElement =>
  element !== null &&
  element.matches(`${CLICKABLE}, ${INPUT_CONTROL}`) &&
  !element.matches(':disabled, [aria-disabled="true"]') &&
  !element.closest('[inert], [aria-hidden="true"]');

const firstFocusable = (scope: HTMLElement): HTMLElement | null =>
  focusables(scope)[0] ?? null;

const outsideDialog = (
  context: PadContext
): context is PadContext & { readonly dialog: HTMLElement } =>
  context.dialog !== undefined && !context.dialog.contains(context.current);

const clickFocused = (state: PadFocus, context: PadContext) => {
  if (outsideDialog(context)) {
    focusWithPad(state, firstFocusable(context.dialog));
    return;
  }
  if (!isClickable(context.current)) {
    return;
  }
  focusWithPad(state, context.current);
  context.current.click();
};

const handleEast = (state: PadFocus, context: PadContext) => {
  if (context.dialog) {
    closeDialog(context.dialog, state);
    return;
  }
  if (context.screen !== "town") {
    context.onOpen("town");
  }
};

const direction =
  (value: PadDirection) => (state: PadFocus, context: PadContext) =>
    handleDirection(state, context, value);

const noop = () => {
  // The other controls belong to the Battle and do nothing on a screen.
};

/** The handler of each pad control outside the Battle. */
const HANDLERS: Readonly<
  Record<PadControl, (state: PadFocus, context: PadContext) => void>
> = {
  up: direction("up"),
  down: direction("down"),
  left: direction("left"),
  right: direction("right"),
  south: clickFocused,
  east: handleEast,
  west: noop,
  north: noop,
  l1: noop,
  r1: noop,
  l2: noop,
  r2: noop,
  start: noop,
  select: noop,
};

const handlePadPress = (
  state: PadFocus,
  control: PadControl,
  context: PadContext
) => {
  HANDLERS[control](state, context);
};

/** The Battle guard treats every input as typing. A native control does not take text. */
const canHandle = (current: HTMLElement | null): boolean =>
  !(isTyping(current) && !current?.matches(INPUT_CONTROL));

/** DOM focus outside the Battle. The Battle keeps its own pad command path. */
export const useTownPad = ({
  active,
  screen,
  onOpen,
}: {
  readonly active: boolean;
  readonly screen: GameScreen;
  readonly onOpen: (screen: GameScreen) => void;
}) => {
  const focus = useRef<PadFocus>({ pad: false, marked: [] });

  useEffect(() => {
    if (!active) {
      return;
    }
    const state = focus.current;
    const onOtherInput = (event: Event) => {
      if (event.isTrusted) {
        state.pad = false;
        clearMark(state);
      }
    };
    const onFocus = () => {
      if (state.pad && document.activeElement instanceof HTMLElement) {
        markFocus(state, document.activeElement);
      }
    };
    const onBlur = () => clearMark(state);
    document.addEventListener("pointerdown", onOtherInput, true);
    document.addEventListener("keydown", onOtherInput, true);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("pointerdown", onOtherInput, true);
      document.removeEventListener("keydown", onOtherInput, true);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
      state.pad = false;
      clearMark(state);
    };
  }, [active]);

  useGamepad({
    onConnect: noop,
    onPress: ({ control }) => {
      if (!active) {
        return;
      }
      const current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      if (!canHandle(current)) {
        return;
      }
      handlePadPress(focus.current, control, {
        current,
        dialog: activeDialog(),
        screen,
        onOpen,
      });
    },
  });
};
