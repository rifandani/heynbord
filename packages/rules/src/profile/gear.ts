/**
 * The Gear upgrade of the Profile (GDD 7.3, PRG-05): 1 level more on one Gear
 * item, for Coin. It is a separate rule, so that the game and the economy
 * simulation use the same costs (Economy 3.4).
 */
import type { GearSlot } from "../content/gear";
import { gearUpgradeCoin, MAX_GEAR_LEVEL } from "../content/gear";
import type { Profile } from "./schema";

/**
 * A Gear upgrade (GDD 7.3, Economy 3.4): the item in `slot` gets 1 level, and
 * the Profile pays the Coin of the new level. `null` when the item is at
 * level 20 or the Coin is not enough. It never fails in another way (PRG-04):
 * there is no refund, no downgrade and no upgrade of more than 1 level.
 */
export const upgradeGear = <P extends Pick<Profile, "coin" | "gear">>(
  profile: P,
  slot: GearSlot
): P | null => {
  const level = profile.gear[slot] + 1;
  if (level > MAX_GEAR_LEVEL) {
    return null;
  }
  const coin = gearUpgradeCoin(level);
  if (profile.coin < coin) {
    return null;
  }
  return {
    ...profile,
    coin: profile.coin - coin,
    gear: { ...profile.gear, [slot]: level },
  };
};
