/**
 * The browser read of the controller (web ADR-0015). It polls
 * `navigator.getGamepads()` on each animation frame and offers the frames on a
 * `Queue`, which the Battle reads as a `Stream`. The module is a browser seam:
 * the feel rules are in `gamepad.ts`, and the e2e smoke test stubs the pad.
 */

import { Effect, Queue, Stream } from "effect";

import type { PadSnapshot } from "@/core/input/gamepad";

/** One animation frame of the pad, with the frame time in milliseconds. */
export interface PadFrame {
  readonly snapshot: PadSnapshot | null;
  readonly now: number;
}

/** The part of a browser `Gamepad` that the game reads. */
export interface BrowserPad {
  readonly index: number;
  readonly id: string;
  readonly mapping: string;
  readonly buttons: readonly {
    readonly pressed: boolean;
    readonly value: number;
  }[];
  readonly axes: readonly number[];
}

/** The first pad in standard mapping, copied from the live browser object. */
export const standardPad = (
  pads: readonly (BrowserPad | null)[]
): PadSnapshot | null => {
  const pad = pads.find((candidate) => candidate?.mapping === "standard");
  if (!pad) {
    return null;
  }
  return {
    index: pad.index,
    id: pad.id,
    mapping: pad.mapping,
    buttons: pad.buttons.map((button) => ({
      pressed: button.pressed,
      value: button.value,
    })),
    axes: [...pad.axes],
  };
};

/** The pad of this frame, or `null` when no pad in standard mapping is on. */
const readPad = (): PadSnapshot | null =>
  standardPad([...navigator.getGamepads()]);

/** Only the latest frame matters, so a slow consumer never builds a backlog. */
const FRAME_CAPACITY = 1;

/**
 * The pad frames, from the first animation frame until the stream stops. The
 * stream owns the polling loop: when it ends or is interrupted, the next frame
 * is cancelled.
 */
export const padFrames = (): Stream.Stream<PadFrame> => {
  const queue = Effect.runSync(Queue.sliding<PadFrame>(FRAME_CAPACITY));
  let next = 0;
  const poll = (now: number) => {
    Queue.offerUnsafe(queue, { snapshot: readPad(), now });
    next = requestAnimationFrame(poll);
  };
  next = requestAnimationFrame(poll);
  return Stream.fromQueue(queue).pipe(
    Stream.ensuring(
      Effect.sync(() => {
        cancelAnimationFrame(next);
      })
    )
  );
};
