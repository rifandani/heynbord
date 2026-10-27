import { useEffect, useRef } from "react";

import { focusables, nextFocusable } from "@/core/input/focus";
import type { PadDirection } from "@/core/input/gamepad";
import { nextFocusId } from "@/core/input/town-focus";
import { useGamepad } from "@/core/input/use-gamepad";
import { isTyping } from "@/features/battle/components/battle-input";
import type { GameScreen } from "@/features/town/town";
import { SELECTABLE_BUILDINGS } from "@/features/town/town";

const BUILDING_RECTS = SELECTABLE_BUILDINGS.map(({ id, rect }) => ({
  id,
  ...rect,
}));

const INPUT_CONTROL =
  'input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="reset"]';
const CLICKABLE =
  'button, a[href], summary, [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="menuitem"]';
const CLOSE_CONTROL =
  '[slot="close"], [data-dismiss], [data-testid$="-close"], [aria-label="Close" i], [aria-label="Tutup" i]';

interface PadFocus {
  pad: boolean;
  marked: readonly HTMLElement[];
  lastBuilding: string;
}

const clearMark = (focus: PadFocus) => {
  for (const element of focus.marked) {
    delete element.dataset.padFocus;
  }
  focus.marked = [];
};

const markFocus = (focus: PadFocus, element: HTMLElement) => {
  clearMark(focus);
  // React Aria puts radio, switch and slider inputs in a small hidden box.
  // Their visible label or thumb needs the ring too.
  const surface = element.matches(INPUT_CONTROL)
    ? element.closest<HTMLElement>("label, [data-rac]")
    : null;
  focus.marked =
    surface && surface !== element ? [element, surface] : [element];
  for (const marked of focus.marked) {
    marked.dataset.padFocus = "";
  }
};

const focusWithPad = (focus: PadFocus, element: HTMLElement | null) => {
  if (!element) {
    return;
  }
  focus.pad = true;
  element.focus();
  if (document.activeElement === element) {
    markFocus(focus, element);
  }
};

const horizontalCenter = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  return rect.left + rect.width / 2;
};

/** Use screen coordinates at the boundary between the painting and the shelf. */
const nearestHorizontal = (
  elements: readonly HTMLElement[],
  from: HTMLElement | null
): HTMLElement | null => {
  if (!from || from.getClientRects().length === 0) {
    return null;
  }
  const x = horizontalCenter(from);
  let best: HTMLElement | null = null;
  let distance = Number.POSITIVE_INFINITY;
  for (const element of elements) {
    const next = Math.abs(horizontalCenter(element) - x);
    if (next < distance) {
      best = element;
      distance = next;
    }
  }
  return best;
};

const focusTown = (
  focus: PadFocus,
  current: HTMLElement | null,
  direction: PadDirection
) => {
  const town = document.querySelector("[data-pad-town]");
  const bar = document.querySelector("[data-pad-town-bar]");
  const buildings = town
    ? focusables(town).filter(
        (element) => element.dataset.buildingId !== undefined
      )
    : [];
  if (bar && current && bar.contains(current)) {
    if (direction === "up") {
      focusWithPad(
        focus,
        nearestHorizontal(buildings, current) ??
          buildings.find(
            (element) => element.dataset.buildingId === focus.lastBuilding
          ) ??
          buildings[0] ??
          null
      );
    } else if (direction === "left" || direction === "right") {
      focusWithPad(
        focus,
        nextFocusable(bar, current, direction === "left" ? -1 : 1)
      );
    }
    return;
  }
  const rects = BUILDING_RECTS.filter((rect) =>
    buildings.some((element) => element.dataset.buildingId === rect.id)
  );
  const next = nextFocusId(
    rects,
    current?.dataset.buildingId ?? null,
    direction
  );
  if (next) {
    focusWithPad(
      focus,
      buildings.find((element) => element.dataset.buildingId === next) ?? null
    );
  } else if (direction === "down" && bar) {
    const controls = focusables(bar);
    const shortcuts = controls.filter((element) =>
      Object.hasOwn(element.dataset, "padShortcut")
    );
    focusWithPad(
      focus,
      nearestHorizontal(shortcuts, current) ?? controls[0] ?? null
    );
  }
};

const closeDialog = (dialog: HTMLElement, focus: PadFocus) => {
  const close = focusables(dialog).find((element) =>
    element.matches(CLOSE_CONTROL)
  );
  if (close) {
    focusWithPad(focus, close);
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

const clickFocused = (
  focus: PadFocus,
  current: HTMLElement | null,
  dialog: HTMLElement | undefined
) => {
  if (dialog && !dialog.contains(current)) {
    focusWithPad(focus, nextFocusable(dialog, null, 1));
    return;
  }
  if (
    current?.matches(`${CLICKABLE}, ${INPUT_CONTROL}`) &&
    !current.matches(':disabled, [aria-disabled="true"]') &&
    !current.closest('[inert], [aria-hidden="true"]')
  ) {
    focusWithPad(focus, current);
    current.click();
  }
};

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
  const focus = useRef<PadFocus>({
    pad: false,
    marked: [],
    lastBuilding: "townGate",
  });

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
      const current = document.activeElement;
      if (!(current instanceof HTMLElement)) {
        return;
      }
      if (current.dataset.buildingId) {
        state.lastBuilding = current.dataset.buildingId;
      }
      if (state.pad) {
        markFocus(state, current);
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
    onConnect: () => {
      // Only the Battle announces a connected controller.
    },
    onPress: ({ control }) => {
      if (!active) {
        return;
      }
      const current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      // The Battle guard treats every input as typing. These native inputs
      // are controls in Settings; they do not take text.
      if (isTyping(current) && !current?.matches(INPUT_CONTROL)) {
        return;
      }
      const state = focus.current;
      const dialog = [
        ...document.querySelectorAll<HTMLElement>('[role="dialog"]'),
      ].findLast(
        (element) => !element.closest('[aria-hidden="true"], [inert], [hidden]')
      );
      if (control === "east") {
        state.pad = true;
        if (dialog) {
          closeDialog(dialog, state);
        } else if (screen !== "town") {
          onOpen("town");
        }
        return;
      }
      if (control === "south") {
        clickFocused(state, current, dialog);
        return;
      }
      if (
        control !== "up" &&
        control !== "down" &&
        control !== "left" &&
        control !== "right"
      ) {
        return;
      }
      if (dialog) {
        focusWithPad(
          state,
          nextFocusable(
            dialog,
            current,
            control === "up" || control === "left" ? -1 : 1
          )
        );
      } else if (screen === "town") {
        focusTown(state, current, control);
      } else {
        focusWithPad(
          state,
          nextFocusable(
            document,
            current,
            control === "up" || control === "left" ? -1 : 1
          )
        );
      }
    },
  });
};
