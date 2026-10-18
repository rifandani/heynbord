import type { Expedition } from "@workspace/rules";
import {
  coinDenominations,
  fullExpeditionReward,
  getDuration,
} from "@workspace/rules";
import { cn } from "cn";
import { useMemo, useState } from "react";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { CargoIcon } from "@/features/seaport/components/cargo-icon";
import { useNow } from "@/features/seaport/use-seaport";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The big number of the Manifest (The Big Number Rule). */
const BIG =
  "text-[1.75rem] leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-xl";

/**
 * The amount of a Coin, XP or Essence voyage. It counts to the new value
 * when the duration changes; give it a `key` with the Cargo, so that a new
 * Cargo shows its amount at once and never counts from another resource.
 */
const Amount = ({
  voyage,
  amount,
}: {
  readonly voyage: Expedition;
  readonly amount: number;
}) => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const shown = useCountTo(amount);
  if (voyage.cargo === "coin") {
    return (
      <span className={cn(BIG, "flex items-center")} data-copper={amount}>
        <span className="sr-only">
          {coinWords(amount, format, (denomination) =>
            tr(`town.balances.denominations.${denomination}.name`)
          )}
        </span>
        <span aria-hidden className="flex items-center">
          <CoinAmount parts={coinDenominations(shown)} format={format} />
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(BIG, "flex items-baseline gap-1.5")}
      data-amount={amount}
    >
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(amount)}</span>
      <span
        className={cn(
          "text-base font-bold [@media(max-height:500px)]:text-sm",
          voyage.cargo === "xp" ? "text-[#9fe7f5]" : "text-[#ffb8d2]"
        )}
      >
        {tr(`seaport.units.${voyage.cargo}`)}
      </span>
    </span>
  );
};

/**
 * The Manifest (Economy 2.8): what the selected voyage brings and when. The
 * focal piece of the Seaport: the full reward of the Cargo and the duration
 * as one big number, the device time of the return ("Back Tue 09:40"), and
 * the bonus of the duration. The Forge Stone tier gem stamps when a new
 * duration changes the tier. A locked voyage shows its lock in place of the
 * return time; the Dispatch names it as its description. While the ship is
 * away, the return line gives the hours, not a clock time.
 */
export const ManifestPlate = ({
  voyage,
  lock,
  away,
}: {
  readonly voyage: Expedition;
  /** The level that opens the voyage, or `null` when it is open. */
  readonly lock: number | null;
  readonly away: boolean;
}) => {
  const { tr, locale } = useGameText();
  const { now } = useNow();
  const reward = fullExpeditionReward(voyage);
  const { bonusPercent } = getDuration(voyage.hours);
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  );
  const stones = reward.forgeStones;
  // The gem stamps only after a change of the tier, not when the screen opens.
  const [shownTier, setShownTier] = useState(stones?.tier);
  const [stamped, setStamped] = useState(false);
  if (stones?.tier !== shownTier) {
    setShownTier(stones?.tier);
    setStamped(true);
  }
  const stamp = stamped && stones !== null;

  return (
    <section
      aria-labelledby="manifest-label"
      aria-live="polite"
      className="flex shrink-0 flex-col gap-1.5 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-3 py-2 shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:py-1.5"
      data-testid="manifest"
      data-cargo={voyage.cargo}
      data-hours={voyage.hours}
    >
      <p
        id="manifest-label"
        className="text-[0.6875rem] font-bold tracking-[0.04em] text-[#e8d9bb] uppercase [@media(max-height:500px)]:sr-only"
      >
        {tr("seaport.manifest.label")}
      </p>
      <div
        className={cn(
          "flex items-center gap-2.5",
          lock !== null && "opacity-60"
        )}
      >
        {stones === null ? (
          <>
            <CargoIcon
              cargo={voyage.cargo}
              className="size-8 shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-6"
            />
            <Amount
              key={voyage.cargo}
              voyage={voyage}
              amount={reward.coin + reward.xp + reward.essence}
            />
          </>
        ) : (
          <>
            <span
              key={stones.tier}
              className={cn(
                "flex shrink-0",
                stamp &&
                  "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
              )}
              data-testid="manifest-tier"
              data-tier={stones.tier}
            >
              <CargoIcon
                cargo="forgeStones"
                tier={stones.tier}
                className="size-8 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-6"
              />
            </span>
            <span className={cn(BIG, "flex items-baseline gap-1.5")}>
              <span>{stones.count}</span>
              <span className="text-base font-bold [@media(max-height:500px)]:text-sm">
                {tr("seaport.manifest.stones", {
                  tier: tr(`forgeStones.tiers.${stones.tier}`),
                })}
              </span>
            </span>
          </>
        )}
      </div>
      {/* The row keeps the height of the bonus pill, also when there is no
          pill (Forge Stones, 6 h), so that the Manifest does not change height. */}
      <p className="flex min-h-4.5 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#e8d9bb] tabular-nums">
        {lock === null ? (
          <span
            className="flex items-center gap-1"
            data-testid="manifest-return"
          >
            <GlyphIcon glyph="hourglass" className="size-3 text-[#e9c46a]" />
            {away
              ? tr("seaport.hoursLabel", { hours: voyage.hours })
              : tr("seaport.manifest.back", {
                  time: time.format(now + voyage.hours * 3_600_000),
                })}
          </span>
        ) : (
          <span
            id="dispatch-note"
            className="flex items-center gap-1 font-bold"
            data-testid="dispatch-note"
          >
            <GlyphIcon glyph="lock" className="size-3 text-[#e9c46a]" />
            {tr("town.opensAtLevel", { level: lock })}
          </span>
        )}
        {bonusPercent > 0 && stones === null ? (
          <span className="rounded-full bg-[#ead9b4] px-1.5 py-px text-xs font-bold text-[#2a1d12]">
            {tr("seaport.manifest.bonus", { percent: bonusPercent })}
          </span>
        ) : null}
        {stones === null ? null : (
          <span className="text-[#e8d9bb]/85">
            {tr("seaport.manifest.stonesFull")}
          </span>
        )}
      </p>
    </section>
  );
};
