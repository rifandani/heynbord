/**
 * The Star chest action of the Profile (Economy 2.2). It is pure, as the other
 * Profile actions.
 */
import type { StageDefinition } from "../content/schema";
import { STAGES } from "../content/stages";
import { STAR_CHESTS } from "../content/star-chests";
import type { StarChestDefinition } from "../content/star-chests";
import type { Profile } from "./schema";

/** The Stars of a Region: the sum of the best Stars of its Stages. */
export const regionStars = (
  stageResults: Profile["stageResults"],
  region: number,
  stages: readonly StageDefinition[] = STAGES
): number =>
  stages
    .filter((stage) => stage.region === region)
    .reduce((sum, stage) => sum + (stageResults[stage.id] ?? 0), 0);

/** The Profile fields that `claimStarChest` reads and changes. */
type StarChestProfile = Pick<
  Profile,
  | "coin"
  | "essence"
  | "heynstones"
  | "stageResults"
  | "claimedStarChests"
  | "unopenedPacks"
>;

export interface StarChestClaim<P> {
  readonly profile: P;
  readonly reward: StarChestDefinition;
}

/**
 * Claims the Star chest of `region` that opens at `stars` (Economy 2.2): adds
 * its Coin, Essence and Heynstones to the balances and its Pack to the
 * Unopened Packs. `null` when the chest is already claimed, or when the Stars
 * of the Region are fewer than `stars`. `stars` must be the Stars of a chest.
 */
export const claimStarChest = <P extends StarChestProfile>(
  profile: P,
  region: number,
  stars: number
): StarChestClaim<P> | null => {
  const chest = STAR_CHESTS.find((candidate) => candidate.stars === stars);
  if (chest === undefined) {
    throw new RangeError(`No Star chest opens at ${stars} Stars`);
  }
  const key = String(region);
  const claimed = profile.claimedStarChests[key] ?? [];
  if (
    claimed.includes(stars) ||
    regionStars(profile.stageResults, region) < stars
  ) {
    return null;
  }
  return {
    profile: {
      ...profile,
      coin: profile.coin + chest.coin,
      essence: profile.essence + chest.essence,
      heynstones: profile.heynstones + chest.heynstones,
      claimedStarChests: {
        ...profile.claimedStarChests,
        [key]: [...claimed, stars],
      },
      unopenedPacks: chest.pack
        ? [...profile.unopenedPacks, chest.pack]
        : profile.unopenedPacks,
    },
    reward: chest,
  };
};
