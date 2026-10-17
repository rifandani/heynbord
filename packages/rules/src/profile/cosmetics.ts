/**
 * The Cosmetic actions of the Profile (Economy 3.5, ADR-0008). They are
 * pure, as the other Profile actions.
 */
import {
  ACHIEVEMENT_COSMETICS,
  getBazaarCosmetic,
  BOSS_FLOOR_COSMETICS,
} from "../content/cosmetics";
import type { Cosmetic, CosmeticId } from "../content/cosmetics";
import { HEYNSPIRE_BOSS_FLOOR_EVERY } from "../content/heynspire";
import type { Profile } from "./schema";

/** The Profile fields that a Cosmetic action reads and changes. */
type CosmeticProfile = Pick<Profile, "cosmetics" | "heynstones">;

/**
 * Adds one owned Cosmetic when the Player does not own it already. The same
 * Profile comes back otherwise: ownership never doubles (Economy 3.5).
 */
export const grantCosmetic = <P extends Pick<Profile, "cosmetics">>(
  profile: P,
  id: CosmeticId
): P =>
  profile.cosmetics.includes(id)
    ? profile
    : { ...profile, cosmetics: [...profile.cosmetics, id] };

/**
 * Buys one Bazaar item (Economy 3.5): takes its Heynstones and grants it.
 * `null` when the ID is not a Bazaar item, the Player owns it already, or
 * cannot afford it. A purchase is permanent: the Player never sells an
 * owned Cosmetic, as a Deck Slot (Economy 3.6).
 */
export const buyCosmetic = <P extends CosmeticProfile>(
  profile: P,
  id: CosmeticId
): { readonly profile: P; readonly cosmetic: Cosmetic } | null => {
  const cosmetic = getBazaarCosmetic(id);
  const price = cosmetic?.price;
  if (
    !cosmetic ||
    price === undefined ||
    profile.heynstones < price ||
    profile.cosmetics.includes(id)
  ) {
    return null;
  }
  return {
    profile: {
      ...grantCosmetic(profile, id),
      heynstones: profile.heynstones - price,
    },
    cosmetic,
  };
};

/**
 * The Earn-only Cosmetics that an old Profile owes (Achievements 1.6,
 * Economy 2.3): one for each won Boss Floor, in Floor order, and one for
 * each claimed Achievement with a Cosmetic reward. The version 10 migration
 * adds them once, so the Player loses nothing.
 */
export const owedCosmetics = (
  claimedAchievements: readonly string[],
  heynspireFloorsWon: number
): readonly CosmeticId[] => {
  const bossFloors = Math.floor(
    heynspireFloorsWon / HEYNSPIRE_BOSS_FLOOR_EVERY
  );
  const owed: CosmeticId[] = BOSS_FLOOR_COSMETICS.slice(
    0,
    Math.max(0, bossFloors)
  );
  const granted = new Set(owed);
  for (const achievement of claimedAchievements) {
    const cosmetic = ACHIEVEMENT_COSMETICS[achievement];
    if (cosmetic !== undefined && !granted.has(cosmetic)) {
      granted.add(cosmetic);
      owed.push(cosmetic);
    }
  }
  return owed;
};
