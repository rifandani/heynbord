/**
 * The controller of the Battle: the pad frames become presses for the screen,
 * and the pad state resets when the pad goes, when the window loses focus and
 * when the tab hides (web ADR-0015). Unmount stops the polling.
 */

import { Effect, Stream } from "effect";
import { useEffect } from "react";

import { useLatest } from "@/core/hooks/use-latest";
import type { PadPress, PadSnapshot } from "@/core/input/gamepad";
import { INITIAL_PAD_STATE, stepPad } from "@/core/input/gamepad";
import { padFrames } from "@/core/input/gamepad-source";

export interface GamepadHandlers {
  /** A press of the pad, in the order that `stepPad` gives. */
  readonly onPress: (press: PadPress) => void;
  /** A pad in standard mapping connected, or connected again. */
  readonly onConnect: (pad: PadSnapshot) => void;
  /** No pad in standard mapping is on anymore. */
  readonly onDisconnect?: () => void;
}

/**
 * Subscribes to the pad presses while the component is mounted. A held
 * direction repeats (see `stepPad`), and a face button does not.
 */
export const useGamepad = ({
  onPress,
  onConnect,
  onDisconnect,
}: GamepadHandlers) => {
  const press = useLatest(onPress);
  const connect = useLatest(onConnect);
  const disconnect = useLatest(onDisconnect);

  useEffect(() => {
    let state = INITIAL_PAD_STATE;
    let connected: number | null = null;
    let active = true;
    const reset = () => {
      state = INITIAL_PAD_STATE;
    };
    const onBlur = () => {
      active = false;
      reset();
    };
    const onFocus = () => {
      active = true;
    };
    const onVisibility = () => {
      active = !document.hidden;
      if (document.hidden) {
        reset();
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const fiber = Effect.runFork(
      padFrames().pipe(
        Stream.runForEach((frame) =>
          Effect.sync(() => {
            // A blurred window or a hidden tab takes no input until it is back.
            if (!active) {
              return;
            }
            if (!frame.snapshot) {
              if (connected !== null) {
                connected = null;
                const { current } = disconnect;
                current?.();
              }
              reset();
              return;
            }
            if (frame.snapshot.index !== connected) {
              connected = frame.snapshot.index;
              reset();
              const { current } = connect;
              current(frame.snapshot);
            }
            const step = stepPad(state, frame.snapshot, frame.now);
            const { state: nextState } = step;
            state = nextState;
            const { current: emit } = press;
            for (const item of step.presses) {
              emit(item);
            }
          })
        )
      )
    );
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      fiber.interruptUnsafe();
    };
  }, [connect, disconnect, press]);
};
