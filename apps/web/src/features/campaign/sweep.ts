import type { ClassId, Profile, SweepRewards } from "@workspace/rules";
import { applySweep, MAX_SWEEP_TICKETS } from "@workspace/rules";

/** The best Stars of a Stage that shows the Sweep (GDD 4.12, ADR-0035). */
const SWEEP_STARS = 3;

/** True when the Stage Panel shows the Sweep: the best Stars of the Stage are 3. */
export const isSweepable = (stars: number): boolean => stars === SWEEP_STARS;

/**
 * The most Tickets that the Ticket control permits: 10, and not more than
 * the Player has. It is 0 when the Player has no Tickets.
 */
export const maxTickets = (owned: number): number =>
  Math.max(0, Math.min(MAX_SWEEP_TICKETS, Math.floor(owned)));

/**
 * The Tickets that the control shows: the wanted number, from 1 to
 * `maxTickets`. It is 0 when the Player has no Tickets.
 */
export const clampTickets = (wanted: number, owned: number): number => {
  const max = maxTickets(owned);
  return max === 0 ? 0 : Math.min(max, Math.max(1, Math.round(wanted)));
};

/**
 * The Tickets after a key press on the Ticket control (WAI-ARIA spinbutton):
 * the arrows and the page keys add or remove 1, Home goes to 1 and End to the
 * most. Another key gives `null`.
 */
export const stepTickets = (
  key: string,
  value: number,
  owned: number
): number | null => {
  switch (key) {
    case "ArrowUp":
    case "ArrowRight":
    case "PageUp": {
      return clampTickets(value + 1, owned);
    }
    case "ArrowDown":
    case "ArrowLeft":
    case "PageDown": {
      return clampTickets(value - 1, owned);
    }
    case "Home": {
      return clampTickets(1, owned);
    }
    case "End": {
      return maxTickets(owned);
    }
    default: {
      return null;
    }
  }
};

/** True when the Player has the Tickets for a Sweep of `tickets`. */
export const canSweep = (tickets: number, owned: number): boolean =>
  tickets >= 1 && tickets <= maxTickets(owned);

/** What the Sweep Result shows, and the Sweep that gave it. */
export interface ShownSweep {
  readonly stageId: string;
  /** The Tickets that the Sweep used. "Sweep Again" uses the same number. */
  readonly tickets: number;
  readonly rewards: SweepRewards;
  /** The Profile XP after the Sweep, for the XP bar. */
  readonly xp: number;
}

/** The Profile after a Sweep, and what its Sweep Result shows. */
export interface RecordedSweep<P> {
  readonly profile: P;
  readonly shown: ShownSweep;
}

/**
 * Applies a Sweep to the Profile with the rules action (ADR-0006): the web
 * never calculates a reward or checks the 3-Star gate itself. The Class of
 * the Active Deck sets the Stage card pool. It throws as `applySweep` does.
 */
export const recordSweep = <P extends Profile>(
  profile: P,
  input: {
    readonly stageId: string;
    readonly tickets: number;
    readonly classId: ClassId;
  }
): RecordedSweep<P> => {
  const applied = applySweep(profile, input);
  return {
    profile: applied.profile,
    shown: {
      stageId: input.stageId,
      tickets: input.tickets,
      rewards: applied.rewards,
      xp: applied.profile.xp,
    },
  };
};
