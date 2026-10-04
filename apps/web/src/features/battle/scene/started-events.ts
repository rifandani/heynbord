import type { SoundName } from "@/features/battle/battle-audio";
import { eventSound } from "@/features/battle/battle-audio";
import type { BattleSession } from "@/features/battle/battle-session";
import { applyEvent } from "@/features/battle/battle-view";
import type { Fx } from "@/features/battle/scene/fx";
import { fxForEvent } from "@/features/battle/scene/fx";

/** What the events that started in one frame show and play. */
interface StartedEvents {
  readonly fx: readonly Fx[];
  /** The sounds, in event order. */
  readonly sounds: readonly SoundName[];
  /** The shortest time between two plays of one sound, in ms. It is longer at speed ×2. */
  readonly soundGap: number;
  /** True when a critical hit shakes the camera. */
  readonly shake: boolean;
}

/**
 * The effects and sounds of the events that started between `before` and
 * `next`. Each effect starts at `time`, in scene seconds.
 */
export const startedEvents = (
  before: BattleSession,
  next: BattleSession,
  time: number
): StartedEvents => {
  const fx: Fx[] = [];
  const sounds: SoundName[] = [];
  let shake = false;
  let { view } = before;
  for (const event of next.log.slice(before.log.length)) {
    const after = applyEvent(view, event);
    fx.push(...fxForEvent(event, view, after, time));
    const sound = eventSound(event);
    if (sound) {
      sounds.push(sound);
    }
    shake ||= event._tag === "DamageDealt" && event.crit;
    view = after;
  }
  return { fx, sounds, soundGap: next.speed === 2 ? 90 : 50, shake };
};

/**
 * The HUD sees a new session only when an event starts or ends, the queue
 * changes, or the Tutorial changes.
 */
export const shouldPublish = (
  before: BattleSession,
  next: BattleSession
): boolean =>
  next.current !== before.current ||
  next.queue.length !== before.queue.length ||
  next.tutorial !== before.tutorial;
