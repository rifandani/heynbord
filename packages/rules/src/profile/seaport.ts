import {
  expeditionDurationMs,
  expeditionReward,
  getCargo,
  getDuration,
} from "../content/expeditions";
import type { Expedition, ExpeditionReward } from "../content/expeditions";
/**
 * The Seaport actions of the Profile (Economy 2.8, ADR-0051): Dispatch the
 * ship on an Expedition, then Collect its reward. They are pure, as the other
 * Profile actions: the web sends `now`, the device time in milliseconds since
 * the epoch, so the same Profile and the same `now` always give the same
 * reward.
 */
import { addForgeStones } from "../content/forge-stones";
import { playerLevelForXp } from "../content/player-levels";
import { isUnlocked } from "../content/unlocks";
import type { Profile, SeaportState } from "./schema";

/** The Seaport of a new Player: the ship is at the berth. */
export const AT_BERTH: SeaportState = {
  cargo: null,
  hours: null,
  startedAt: null,
};

/** The Expedition that the ship is on, at `now`. */
export interface ActiveExpedition {
  readonly expedition: Expedition;
  /** The device time of the Dispatch. */
  readonly startedAt: number;
  /** The device time when the voyage is full. */
  readonly returnsAt: number;
  /** The reward of a Collect at `now`. */
  readonly reward: ExpeditionReward;
}

/**
 * The Expedition that the ship is on, with the reward of a Collect at `now`,
 * or `null` when the ship is at the berth. When `now` is before the Dispatch
 * (the clock moved back), the reward is 0.
 */
export const activeExpedition = (
  profile: Pick<Profile, "seaport">,
  now: number
): ActiveExpedition | null => {
  const { cargo, hours, startedAt } = profile.seaport;
  if (cargo === null) {
    return null;
  }
  const expedition = { cargo, hours };
  return {
    expedition,
    startedAt,
    returnsAt: startedAt + expeditionDurationMs(expedition),
    reward: expeditionReward(expedition, now - startedAt),
  };
};

/**
 * Dispatches the ship on `expedition` at `now` (Economy 2.8). `null` when
 * the ship is not at the berth, or when the Player level is below the
 * Seaport unlock, or below the unlock level of the Cargo or of the duration.
 * It throws for an unknown Cargo or duration, and when `now`
 * is not a whole number of milliseconds. It costs nothing.
 */
export const startExpedition = <P extends Pick<Profile, "xp" | "seaport">>(
  profile: P,
  expedition: Expedition,
  now: number
): P | null => {
  const cargo = getCargo(expedition.cargo);
  const duration = getDuration(expedition.hours);
  if (!Number.isSafeInteger(now)) {
    throw new RangeError(`A Dispatch time is whole milliseconds, not ${now}`);
  }
  const level = playerLevelForXp(profile.xp);
  if (
    profile.seaport.cargo !== null ||
    !isUnlocked(level, "seaport") ||
    level < cargo.unlockLevel ||
    level < duration.unlockLevel
  ) {
    return null;
  }
  return {
    ...profile,
    seaport: { cargo: cargo.id, hours: duration.hours, startedAt: now },
  };
};

/** The Profile fields that `collectExpedition` reads and changes. */
type CollectProfile = Pick<
  Profile,
  "xp" | "coin" | "essence" | "forgeStones" | "seaport"
>;

export interface ExpeditionCollect<P> {
  readonly profile: P;
  readonly expedition: Expedition;
  readonly reward: ExpeditionReward;
  readonly levelBefore: number;
  readonly levelAfter: number;
}

/**
 * Collects the reward of the Expedition at `now` (Economy 2.8): its Coin, XP
 * or Essence for the time away, up to the duration, or its Forge Stones only
 * after the full voyage. The ship is then at the berth again. An early
 * Collect gives the share of the time away, and an early Collect of the
 * Forge Stone Cargo gives nothing. `null` when the ship is at the berth, or
 * when `now` is before the Dispatch: the clock moved back, so the reward is
 * 0 and the ship stays.
 */
export const collectExpedition = <P extends CollectProfile>(
  profile: P,
  now: number
): ExpeditionCollect<P> | null => {
  const active = activeExpedition(profile, now);
  if (active === null || now < active.startedAt) {
    return null;
  }
  const { expedition, reward } = active;
  return {
    profile: {
      ...profile,
      xp: profile.xp + reward.xp,
      coin: profile.coin + reward.coin,
      essence: profile.essence + reward.essence,
      forgeStones: addForgeStones(profile.forgeStones, reward.forgeStones),
      seaport: AT_BERTH,
    },
    expedition,
    reward,
    levelBefore: playerLevelForXp(profile.xp),
    levelAfter: playerLevelForXp(profile.xp + reward.xp),
  };
};
