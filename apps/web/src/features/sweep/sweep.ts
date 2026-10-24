import type { ClassId, Profile, SweepRewards } from "@workspace/rules";
import {
  applyCampaignSweep,
  applyDungeonSweep,
  MAX_SWEEP_TICKETS,
} from "@workspace/rules";

import type { Glyph } from "@/features/battle/glyphs";

/**
 * The 2 kinds of Sweep (GDD 4.12): a Campaign Sweep of a Stage (ADR-0039)
 * and a Dungeon Sweep of a Dungeon (ADR-0039). Each kind uses its own type
 * of Sweep Ticket.
 */
export type SweepKind = "campaign" | "dungeon";

/** The glyph of the Sweep Ticket of each kind: a star for a Stage, a cave mouth for a Dungeon. */
export const TICKET_GLYPH: Readonly<Record<SweepKind, Glyph>> = {
  campaign: "campaignTicket",
  dungeon: "dungeonTicket",
};

/** The best Stars of a Stage that shows the Campaign Sweep (ADR-0039). */
const CAMPAIGN_SWEEP_STARS = 3;

/** True when the Stage Panel shows the Campaign Sweep: the best Stars of the Stage are 3. */
export const isCampaignSweepable = (stars: number): boolean =>
  stars === CAMPAIGN_SWEEP_STARS;

/** True when the Dungeons screen shows the Dungeon Sweep: the Dungeon has 1 or more wins (ADR-0039). */
export const isDungeonSweepable = (wins: number): boolean => wins >= 1;

/** The Sweep Tickets of `kind` that the Player has. */
export const ownedTickets = (
  profile: Pick<Profile, "campaignSweepTickets" | "dungeonSweepTickets">,
  kind: SweepKind
): number =>
  kind === "campaign"
    ? profile.campaignSweepTickets
    : profile.dungeonSweepTickets;

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

/** A Sweep of `tickets` Tickets of `kind`, on the Stage or the Dungeon `targetId`. */
export interface SweepRequest {
  readonly kind: SweepKind;
  /** The Stage ID of a Campaign Sweep, or the Dungeon ID of a Dungeon Sweep. */
  readonly targetId: string;
  readonly tickets: number;
  /** The Class of the Active Deck. It sets the card pool. */
  readonly classId: ClassId;
}

/** What the Sweep Result shows, and the Sweep that gave it. */
export interface ShownSweep {
  readonly kind: SweepKind;
  readonly targetId: string;
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
 * never calculates a reward or checks a Sweep gate itself. It throws as
 * `applyCampaignSweep` and `applyDungeonSweep` do.
 */
export const recordSweep = <P extends Profile>(
  profile: P,
  request: SweepRequest
): RecordedSweep<P> => {
  const { kind, targetId, tickets, classId } = request;
  const applied =
    kind === "campaign"
      ? applyCampaignSweep(profile, { stageId: targetId, tickets, classId })
      : applyDungeonSweep(profile, { dungeonId: targetId, tickets, classId });
  return {
    profile: applied.profile,
    shown: {
      kind,
      targetId,
      tickets,
      rewards: applied.rewards,
      xp: applied.profile.xp,
    },
  };
};
