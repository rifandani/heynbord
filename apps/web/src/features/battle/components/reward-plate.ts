/**
 * The small Night Plate of a reward balance, as the Balance Plate shows Coin.
 * The Battle result, the Sweep result and the Star chest use the same plate.
 */
export const REWARD_PLATE =
  "flex w-fit items-center gap-2 rounded-xl border-2 border-gold-trim/70 bg-night-plate/90 px-3 py-1.5 text-sm leading-none font-black text-cream tabular-nums shadow-piece [@media(max-height:500px)]:py-1";

/**
 * The compact Night Plate of a reward, as the Floor Panel and the Dungeon
 * Panel show it: the Coin without a plus, the other rewards with their icons.
 */
export const REWARD_PLATE_COMPACT =
  "flex w-fit items-center gap-1.5 rounded-xl border-2 border-gold-trim/70 bg-night-plate/90 px-2.5 py-1 text-sm leading-none font-black whitespace-nowrap text-cream tabular-nums shadow-piece [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:text-xs";
