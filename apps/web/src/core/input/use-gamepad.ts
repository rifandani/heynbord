/**
 * The controller of the Battle: the pad frames become presses for the screen,
 * and the pad state resets when the pad goes, when the window loses focus and
 * when the tab hides (web ADR-0015). Unmount stops the polling.
 */

import { Effect, Stream } from "effect";
import { useEffect } from "react";

import { useLatest } from "@/core/hooks/use-latest";
import type { PadPress, PadSnapshot, PadState } from "@/core/input/gamepad";
import { INITIAL_PAD_STATE, stepPad } from "@/core/input/gamepad";
import type { PadFrame } from "@/core/input/gamepad-source";
import { padFrames } from "@/core/input/gamepad-source";

export interface GamepadHandlers {
  /** A press of the pad, in the order that `stepPad` gives. */
  readonly onPress: (press: PadPress) => void;
  /** A pad in standard mapping connected, or connected again. */
  readonly onConnect: (pad: PadSnapshot) => void;
  /** No pad in standard mapping is on anymore. */
  readonly onDisconnect?: () => void;
}

/** The mutable state of the pad while the component is mounted. */
interface PadSession {
  state: PadState;
  connected: number | null;
  /** False while the window is blurred or the tab is hidden. */
  active: boolean;
}

const resetPad = (session: PadSession) => {
  session.state = INITIAL_PAD_STATE;
};

/** Forget the pad and its held controls. */
const disconnectPad = (
  session: PadSession,
  onDisconnect: (() => void) | undefined
) => {
  if (session.connected === null) {
    return;
  }
  session.connected = null;
  onDisconnect?.();
  resetPad(session);
};

/** Tell the screen about a new pad, with no held control from before. */
const connectPad = (
  session: PadSession,
  pad: PadSnapshot,
  onConnect: (pad: PadSnapshot) => void
) => {
  session.connected = pad.index;
  resetPad(session);
  onConnect(pad);
};

/** The presses of one frame, from the state of the previous frame. */
const applyFrame = (
  session: PadSession,
  snapshot: PadSnapshot,
  now: number,
  onPress: (press: PadPress) => void
) => {
  const step = stepPad(session.state, snapshot, now);
  session.state = step.state;
  for (const press of step.presses) {
    onPress(press);
  }
};

/** One frame, after the guards for a blurred window and a new pad. */
const handleFrame = (
  session: PadSession,
  frame: PadFrame,
  handlers: GamepadHandlers
) => {
  if (!session.active) {
    return;
  }
  if (!frame.snapshot) {
    disconnectPad(session, handlers.onDisconnect);
    return;
  }
  if (frame.snapshot.index !== session.connected) {
    connectPad(session, frame.snapshot, handlers.onConnect);
  }
  applyFrame(session, frame.snapshot, frame.now, handlers.onPress);
};

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
    const session: PadSession = {
      state: INITIAL_PAD_STATE,
      connected: null,
      active: true,
    };
    const onBlur = () => {
      session.active = false;
      resetPad(session);
    };
    const onFocus = () => {
      session.active = true;
    };
    const onVisibility = () => {
      session.active = !document.hidden;
      if (document.hidden) {
        resetPad(session);
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const fiber = Effect.runFork(
      padFrames().pipe(
        Stream.runForEach((frame) =>
          Effect.sync(() => {
            const { current: emit } = press;
            const { current: reader } = connect;
            const { current: gone } = disconnect;
            handleFrame(session, frame, {
              onPress: emit,
              onConnect: reader,
              onDisconnect: gone,
            });
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
