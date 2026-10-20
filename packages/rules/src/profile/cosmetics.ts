/**
 * The Cosmetic actions of the Profile (Economy 3.5, ADR-0008). They are
 * pure, as the other Profile actions.
 */
import {
  ACHIEVEMENT_COSMETICS,
  getBazaarCosmetic,
  BOSS_FLOOR_COSMETICS,
} from "../content/cosmetics";
import type {
  Cosmetic,
  CosmeticFamily,
  CosmeticId,
} from "../content/cosmetics";
import { HEYNSPIRE_BOSS_FLOOR_EVERY } from "../content/heynspire";
import type { ActiveCosmetics, Profile } from "./schema";

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

/** The Profile fields that an Active Cosmetic action reads and changes. */
type ActiveCosmeticProfile = Pick<Profile, "cosmetics" | "activeCosmetics">;

/** A copy of the Active Cosmetics that the actions can change. */
type MutableActiveCosmetics = {
  -readonly [Family in keyof ActiveCosmetics]: ActiveCosmetics[Family];
};

/**
 * Sets the Active Cosmetic of its family (Economy 3.5): the look that the
 * Player uses now. `null` when the Player does not own the Cosmetic, or when
 * the ID is not a Bazaar item. An Earn-only Cosmetic has no family in the
 * catalog yet, so it cannot be Active.
 */
export const selectCosmetic = <P extends ActiveCosmeticProfile>(
  profile: P,
  id: CosmeticId
): P | null => {
  const cosmetic = getBazaarCosmetic(id);
  if (!cosmetic || !profile.cosmetics.includes(id)) {
    return null;
  }
  const activeCosmetics: MutableActiveCosmetics = {
    ...profile.activeCosmetics,
  };
  activeCosmetics[cosmetic.family] = id;
  return { ...profile, activeCosmetics };
};

/**
 * Shows the Standard look of a family again (Economy 3.5). The same Profile
 * comes back when the family has no Active Cosmetic.
 */
export const selectStandardLook = <P extends Pick<Profile, "activeCosmetics">>(
  profile: P,
  family: CosmeticFamily
): P => {
  if (profile.activeCosmetics[family] === undefined) {
    return profile;
  }
  // SAFETY: the entries come from `ActiveCosmetics`, and the stored IDs stay
  // under the keys of their family.
  const activeCosmetics = Object.fromEntries(
    Object.entries(profile.activeCosmetics).filter(([key]) => key !== family)
  ) as ActiveCosmetics;
  return { ...profile, activeCosmetics };
};

/** The Active Cosmetic of a family, or `null` for its Standard look. */
export const activeCosmetic = (
  profile: Pick<Profile, "activeCosmetics">,
  family: CosmeticFamily
): CosmeticId | null => profile.activeCosmetics[family] ?? null;

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
