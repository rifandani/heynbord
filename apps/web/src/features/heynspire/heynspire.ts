import type { FloorReward } from "@workspace/rules";
import {
  BOSS_FLOOR_TEMPLATES,
  CAMPAIGN_LOSS_XP_FRACTION,
  CAMPAIGN_SWEEP_TICKETS_PER_WIN,
  FLOOR_LOSS_COIN_FRACTION,
  floorFirstWinReward,
  getFloor,
  HEYNSPIRE_BOSS_FLOOR_EVERY,
  HEYNSPIRE_FIFTH_FLOOR_EVERY,
  HEYNSPIRE_FLOORS,
  isBossFloor,
} from "@workspace/rules";

/**
 * The state of a Floor on the Floor rail (GDD 8.2): `won`, `current` for
 * the lowest Floor that is not won, and `locked` above it.
 */
export type FloorState = "won" | "current" | "locked";

/** One Floor on the Floor rail. */
export interface FloorStop {
  readonly number: number;
  readonly state: FloorState;
  /** Each 10th Floor: its enemy is a Campaign Boss. */
  readonly boss: boolean;
  /** Each 5th Floor that is not a Boss Floor: it gives Rare Forge Stones. */
  readonly fifth: boolean;
}

/**
 * A Flight (web glossary): a group of 10 Floors that ends on a Boss Floor.
 * Heynspire has 5 Flights. The Floor rail shows the Flight of the Current
 * Floor open, and the other Flights folded.
 */
export interface Flight {
  /** 0 for Floors 1 to 10, 4 for Floors 41 to 50. */
  readonly index: number;
  readonly first: number;
  readonly last: number;
  readonly floors: readonly FloorStop[];
  /** `won` when all its Floors are won, `current` when it holds the Current Floor. */
  readonly state: FloorState;
  /** The won Floors of the Flight, 0 to 10. */
  readonly won: number;
}

/** The Floors in one Flight: the Boss Floor is the last one. */
export const FLIGHT_FLOORS = HEYNSPIRE_BOSS_FLOOR_EVERY;

/** The Flights of Heynspire, from the bottom of the tower. */
export const FLIGHT_COUNT = HEYNSPIRE_FLOORS / FLIGHT_FLOORS;

/** The state of Floor `floor` when the Player won `floorsWon` Floors (the Profile field). */
export const floorState = (floor: number, floorsWon: number): FloorState => {
  if (floor <= floorsWon) {
    return "won";
  }
  return floor === floorsWon + 1 ? "current" : "locked";
};

/** The Flight of Floor `floor` (1 to 50): 0 to 4. */
export const flightOf = (floor: number): number =>
  Math.floor((floor - 1) / FLIGHT_FLOORS);

/** The climb that the Heynspire screen shows. */
export interface Climb {
  readonly flights: readonly Flight[];
  /** The Current Floor, or `null` after the win of Floor 50. */
  readonly current: number | null;
  /** True after the win of Floor 50: "Heynspire climbed". */
  readonly climbed: boolean;
  /** The Flight that the rail opens: the Flight of the Current Floor, or the last Flight. */
  readonly openFlight: number;
}

/**
 * The Floor rail for `floorsWon` won Floors (0 to 50): 5 Flights of 10
 * Floors, from Floor 1 at the bottom of the tower.
 */
export const climb = (floorsWon: number): Climb => {
  const won = Math.min(Math.max(Math.trunc(floorsWon), 0), HEYNSPIRE_FLOORS);
  const current = won < HEYNSPIRE_FLOORS ? won + 1 : null;
  const flights = Array.from({ length: FLIGHT_COUNT }, (_, index): Flight => {
    const first = index * FLIGHT_FLOORS + 1;
    const last = first + FLIGHT_FLOORS - 1;
    const floors = Array.from({ length: FLIGHT_FLOORS }, (__, step) => {
      const number = first + step;
      const boss = isBossFloor(number);
      return {
        number,
        state: floorState(number, won),
        boss,
        fifth: !boss && number % HEYNSPIRE_FIFTH_FLOOR_EVERY === 0,
      };
    });
    const wonInFlight = floors.filter((floor) => floor.state === "won").length;
    let state: FloorState = "locked";
    if (wonInFlight === FLIGHT_FLOORS) {
      state = "won";
    } else if (floors.some((floor) => floor.state === "current")) {
      state = "current";
    }
    return { index, first, last, floors, state, won: wonInFlight };
  });
  return {
    flights,
    current,
    climbed: current === null,
    openFlight: current === null ? FLIGHT_COUNT - 1 : flightOf(current),
  };
};

/**
 * The Translation Key of the enemy name of Floor `floor`: the Boss of its
 * Boss Stage on a Boss Floor, or the enemy of its Floor template (draft
 * names).
 */
export const floorEnemyKey = (floor: number): string => {
  if (isBossFloor(floor)) {
    const boss = BOSS_FLOOR_TEMPLATES[floor / HEYNSPIRE_BOSS_FLOOR_EVERY - 1];
    if (boss) {
      return `stages.${boss.stageId}.enemy`;
    }
  }
  return `heynspire.enemies.${getFloor(floor).enemy.id}`;
};

/**
 * What a Floor gives (Economy 2.3), for the Floor Panel. It comes from the
 * rules, so the panel never differs from the result. A Floor win is always a
 * first win: a won Floor cannot be played again.
 */
export interface FloorRewardPreview {
  readonly win: FloorReward & {
    /** The Campaign Sweep Tickets of a win (ADR-0039). */
    readonly campaignSweepTickets: number;
  };
  /** The Coin and the XP of a loss when the enemy Hero lost all its HP: the most that a loss gives. */
  readonly loss: { readonly coin: number; readonly xp: number };
}

export const floorRewardPreview = (floor: number): FloorRewardPreview => {
  const win = floorFirstWinReward(floor);
  return {
    win: { ...win, campaignSweepTickets: CAMPAIGN_SWEEP_TICKETS_PER_WIN },
    loss: {
      coin: Math.floor(win.coin * FLOOR_LOSS_COIN_FRACTION),
      xp: Math.floor(win.xp * CAMPAIGN_LOSS_XP_FRACTION),
    },
  };
};

/** A button of the result of a Floor Battle (GDD 11.4). */
export type FloorResultAction = "nextFloor" | "tryAgain" | "backToHeynspire";

/**
 * The buttons of the result of a Floor Battle, gold first. After a win:
 * "Next Floor" and "Back to Heynspire", or only "Back to Heynspire" after
 * the win of Floor 50. After a loss: "Try Again" and "Back to Heynspire".
 */
export const floorResultActions = (
  floor: number,
  won: boolean
): readonly FloorResultAction[] => {
  if (!won) {
    return ["tryAgain", "backToHeynspire"];
  }
  return floor < HEYNSPIRE_FLOORS
    ? ["nextFloor", "backToHeynspire"]
    : ["backToHeynspire"];
};

/** The motion of new wins on the Floor rail. */
export interface NewWins {
  /** The Floor that the Player just won: its stone stamps its check. */
  readonly stamped: number | null;
  /** The new Current Floor: its stone wakes up one time. */
  readonly awaken: number | null;
}

/**
 * The wins since the Heynspire screen last showed `seen` won Floors, or
 * `null` before its first show in the session, which shows no motion.
 */
export const newWins = (floorsWon: number, seen: number | null): NewWins => {
  if (seen === null || floorsWon <= seen) {
    return { stamped: null, awaken: null };
  }
  return {
    stamped: floorsWon,
    awaken: floorsWon < HEYNSPIRE_FLOORS ? floorsWon + 1 : null,
  };
};
