import { useAtomValue } from "@effect/atom-react";
import type { ForgeStoneTier } from "@workspace/rules";
import { coinDenominations, MAX_GEAR_LEVEL } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, RefObject } from "react";
import { useLayoutEffect, useRef } from "react";
import { Label, Meter } from "react-aria-components";

import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { RANK_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { gearIconArt } from "@/features/hero/gear-look-art";
import type { GearItem, GearUpgrade } from "@/features/hero/hero";
import { GEAR_GLYPH, GEAR_GLYPH_TURN } from "@/features/hero/hero-art";
import { useStatFormat } from "@/features/hero/use-stat-format";
import { CoinPrice } from "@/features/packs/components/pack-art";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { activeGearLookAtom } from "@/features/profile/profile.atoms";

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/** A small label on a dark plate. */
const SMALL_LABEL =
  "text-xs font-bold text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]";

/**
 * The time that the Forge Stone of an upgrade takes to leap from the upgrade
 * into its Gear item. The strike of the stone is the beat of the upgrade: the
 * sparks, the level hop, the stat roll, the glow and the sound start then.
 */
export const GEAR_STRIKE_MS = 200;

/**
 * The last upgrade of a Gear item in this visit: its serial (from 1), the
 * Forge Stone tier that it used, and `newTier` when the next level needs a
 * stone of the next tier.
 */
export interface GearStrike {
  readonly serial: number;
  readonly tier: ForgeStoneTier;
  readonly newTier: boolean;
}

/** The animation delay that puts a beat of the upgrade on the strike. */
const ON_STRIKE: CSSProperties = { animationDelay: `${GEAR_STRIKE_MS}ms` };

/**
 * The sparks of a strike: the angle of each one and how far it flies, in
 * percent of the icon. They are a little uneven, as from a real hammer.
 */
const SPARKS: readonly { readonly angle: number; readonly reach: number }[] = [
  { angle: -96, reach: 58 },
  { angle: -58, reach: 50 },
  { angle: -22, reach: 60 },
  { angle: 14, reach: 48 },
  { angle: 52, reach: 56 },
  { angle: 128, reach: 54 },
  { angle: 166, reach: 60 },
  { angle: 204, reach: 50 },
  { angle: 238, reach: 57 },
];

/**
 * The strike of a Forge Stone on its Gear item: a short flash and sparks in
 * the color of its tier, which scale with the icon. A new element for each
 * strike, so that it plays again.
 */
const StrikeSparks = ({ tier }: { readonly tier: ForgeStoneTier }) => {
  const color = RANK_COLORS[tier];
  return (
    <span
      className="[container-type:size] pointer-events-none absolute inset-0 motion-reduce:hidden"
      data-testid="gear-strike"
      data-tier={tier}
    >
      <span
        className="absolute inset-[12%] animate-[pack-burst_420ms_ease-out_both] rounded-full"
        style={{
          ...ON_STRIKE,
          background: `radial-gradient(circle, rgba(255,246,223,0.95) 0%, ${color} 34%, transparent 68%)`,
        }}
      />
      {SPARKS.map(({ angle, reach }) => (
        <span
          key={angle}
          className="absolute top-1/2 left-1/2 size-0"
          style={{ rotate: `${angle}deg` }}
        >
          <span
            className="absolute top-[-1.5px] left-0 h-[3px] w-[14cqw] origin-left animate-[gear-spark_480ms_cubic-bezier(0.16,1,0.3,1)_both] rounded-full"
            // SAFETY: a CSS custom property for the keyframes. React's
            // `CSSProperties` does not model custom properties.
            style={
              {
                ...ON_STRIKE,
                "--spark-reach": `${reach}cqw`,
                background: `linear-gradient(90deg, transparent, ${color} 45%, #fff6df)`,
              } as CSSProperties
            }
          />
        </span>
      ))}
    </span>
  );
};

/**
 * The line of light that goes across a painted Gear icon, as across a Pack on
 * the Pack Stand. The painted icon is its mask, so the light only touches the
 * item. It plays when the upgrade is under the pointer or has the keyboard
 * focus, and one time when the item gets to level 25.
 */
const GearSheen = ({
  painted,
  maxed,
}: {
  readonly painted: string;
  readonly maxed: boolean;
}) => (
  <span
    className="pointer-events-none absolute inset-0 overflow-hidden"
    style={{
      mask: `url("${painted}") center / contain no-repeat`,
      WebkitMask: `url("${painted}") center / contain no-repeat`,
    }}
  >
    <span
      className={cn(
        "absolute inset-y-0 left-0 w-1/2 translate-x-[-130%] bg-[linear-gradient(105deg,transparent_15%,rgba(255,246,220,0.6)_50%,transparent_85%)]",
        maxed
          ? "motion-safe:animate-[shop-sheen_900ms_cubic-bezier(0.2,0.8,0.2,1)_520ms]"
          : "motion-safe:group-has-[[data-gear-upgrade][data-focus-visible]]/gear:animate-[shop-sheen_900ms_cubic-bezier(0.2,0.8,0.2,1)] motion-safe:group-has-[[data-gear-upgrade][data-hovered]]/gear:animate-[shop-sheen_900ms_cubic-bezier(0.2,0.8,0.2,1)]"
      )}
    />
  </span>
);

/**
 * The icon of a Gear item: its icon in the Active Gear look or the Standard
 * kit (web ADR-0013), or its glyph on a round dark badge with a bronze rim
 * until a person paints it (11 — Town Concepts 12).
 * When its upgrade is ready and under the pointer or the focus, the item lifts
 * off the plate and the light goes across it. A strike makes it give a little
 * and throws sparks in the tier color. At level 25 the "Max" seal sits on its
 * lower right; it stamps on when the item gets there.
 */
const GearIcon = ({
  item,
  strike,
  ref,
}: {
  readonly item: GearItem;
  readonly strike: GearStrike | null;
  readonly ref: RefObject<HTMLSpanElement | null>;
}) => {
  const { tr } = useGameText();
  const look = useAtomValue(activeGearLookAtom);
  const painted = gearIconArt(look, item.slot);
  const maxed = item.upgrade.kind === "max";
  return (
    <span
      ref={ref}
      className={cn(
        "relative grid size-24 shrink-0 place-items-center transition-[translate,filter] duration-200 ease-out [@media(max-height:500px)]:size-11",
        // A disabled upgrade gets no hover and no focus, so only a ready item lifts.
        "group-has-[[data-gear-upgrade][data-hovered]]/gear:brightness-110 motion-safe:group-has-[[data-gear-upgrade][data-hovered]]/gear:-translate-y-1",
        "group-has-[[data-gear-upgrade][data-focus-visible]]/gear:brightness-110 motion-safe:group-has-[[data-gear-upgrade][data-focus-visible]]/gear:-translate-y-1"
      )}
      aria-hidden
    >
      <span
        key={`struck-${strike?.serial ?? 0}`}
        className={cn(
          "relative grid size-full place-items-center",
          strike !== null &&
            "motion-safe:animate-[gear-struck_340ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
        style={ON_STRIKE}
      >
        {painted ? (
          <>
            <img
              src={painted}
              alt=""
              width={256}
              height={256}
              draggable={false}
              className="size-full object-contain drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] select-none"
            />
            <GearSheen painted={painted} maxed={maxed && strike !== null} />
          </>
        ) : (
          <span className="grid size-[84%] place-items-center rounded-full border-[3px] border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] shadow-[0_3px_0_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,226,170,0.18)] [@media(max-height:500px)]:border-2">
            <GlyphIcon
              glyph={GEAR_GLYPH[item.slot]}
              className={cn(
                "size-[54%] text-[#f3e6c4] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]",
                GEAR_GLYPH_TURN[item.slot]
              )}
            />
          </span>
        )}
      </span>
      {strike === null ? null : (
        <StrikeSparks key={`sparks-${strike.serial}`} tier={strike.tier} />
      )}
      {maxed ? (
        <span
          className={cn(
            "absolute -right-1 -bottom-1 grid place-items-center rounded-full border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-1.5 py-0.5 text-[11px] leading-none font-black tracking-[0.04em] text-[#2a1a05] uppercase shadow-[0_2px_0_rgba(0,0,0,0.45)]",
            "[@media(max-height:500px)]:-right-2 [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[9px]",
            strike !== null &&
              "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          )}
          style={ON_STRIKE}
          data-testid={`gear-max-${item.slot}`}
        >
          {tr("hero.maxSeal")}
        </span>
      ) : null}
    </span>
  );
};

/**
 * The level of a Gear item: "Level 7 / 25". The level number pops when it
 * changes.
 */
const GearLevel = ({
  level,
  flash,
}: {
  readonly level: number;
  /** The serial of the last upgrade of this item in this visit, or 0. */
  readonly flash: number;
}) => {
  const { tr } = useGameText();
  return (
    <Meter
      value={level}
      minValue={0}
      maxValue={MAX_GEAR_LEVEL}
      valueLabel={tr("hero.levelLabel", { level, max: MAX_GEAR_LEVEL })}
      className="flex w-full flex-col gap-1"
    >
      <span className="flex items-baseline justify-between gap-2">
        <Label className={SMALL_LABEL}>{tr("hero.levelName")}</Label>
        <span className="font-black tabular-nums" aria-hidden>
          <span
            key={flash}
            className={cn(
              "inline-block text-xl text-[#fff6df] [@media(max-height:500px)]:text-sm",
              flash > 0 &&
                "motion-safe:animate-[workshop-count_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
            )}
            style={ON_STRIKE}
            data-testid="gear-level"
          >
            {level}
          </span>
          <span className="text-sm text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]">
            {" / "}
            {MAX_GEAR_LEVEL}
          </span>
        </span>
      </span>
    </Meter>
  );
};

/** A requirement of the upgrade that is missing: a warm red. */
const MISSING = "text-[#ff9b85]";

/**
 * All that the next level needs, in the upgrade: its Coin, and 1 Forge Stone
 * in its tier color (ADR-0038). When the upgrade is off, each requirement that
 * is missing shows in a warm red. The accessible name of the upgrade gives the
 * tier. When an upgrade makes the next level need a new tier (`turn`), the
 * stone turns over into its new color after the strike.
 */
const UpgradeCost = ({
  upgrade,
  turn,
  stoneRef,
}: {
  readonly upgrade: Exclude<GearUpgrade, { kind: "max" }>;
  readonly turn: boolean;
  /** The stone of the cost: the Forge Stone of an upgrade leaps from here. */
  readonly stoneRef: RefObject<SVGSVGElement | null>;
}) => {
  const { format } = useCoinFormat();
  const short = upgrade.kind === "short";
  /**
   * The surface under the Coin letter: the gold button of a Ready upgrade is
   * light and the engraved plate of one that is off is dark. A Coin that is
   * missing keeps the warm red of the requirement, so the price reads as one.
   */
  const tone = short ? (upgrade.missingCoin > 0 ? null : "dark") : "light";
  return (
    <>
      <CoinPrice
        parts={coinDenominations(upgrade.coin)}
        format={format}
        tone={tone}
        className={cn("font-bold", short && upgrade.missingCoin > 0 && MISSING)}
      />
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-bold tabular-nums",
          short && !upgrade.hasStone && MISSING
        )}
        aria-hidden
        data-testid="gear-upgrade-stone"
        data-tier={upgrade.tier}
        data-stones={upgrade.stones}
      >
        <ForgeStoneIcon
          key={upgrade.tier}
          ref={stoneRef}
          tier={upgrade.tier}
          className={cn(
            "size-[1.15em] shrink-0 drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]",
            turn &&
              "motion-safe:animate-[gear-tier-turn_460ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          )}
          style={
            turn ? { animationDelay: `${GEAR_STRIKE_MS + 80}ms` } : undefined
          }
        />
        ×1
      </span>
    </>
  );
};

/**
 * The Forge Stone of an upgrade on its way: it leaps out of the cost in the
 * upgrade, on an arc, into the Gear icon, and goes into it at the strike.
 * The plate measures the way before the paint, so the stone starts on the
 * stone of the cost at all screen sizes. Reduced motion shows no flight.
 */
const useStoneFlight = (strike: GearStrike | null) => {
  const plate = useRef<HTMLLIElement>(null);
  const icon = useRef<HTMLSpanElement>(null);
  const cost = useRef<SVGSVGElement>(null);
  const button = useRef<HTMLDivElement>(null);
  const flight = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const stone = flight.current;
    const box = plate.current?.getBoundingClientRect();
    const to = icon.current?.getBoundingClientRect();
    // At level 25 the cost is gone: the stone leaps from the button.
    const from = (cost.current ?? button.current)?.getBoundingClientRect();
    if (!(strike && stone && box && to && from)) {
      return;
    }
    const x = from.left + from.width / 2 - box.left;
    const y = from.top + from.height / 2 - box.top;
    stone.style.left = `${x}px`;
    stone.style.top = `${y}px`;
    stone.style.setProperty(
      "--gear-fly-x",
      `${to.left + to.width / 2 - box.left - x}px`
    );
    stone.style.setProperty(
      "--gear-fly-y",
      `${to.top + to.height / 2 - box.top - y}px`
    );
  }, [strike]);

  return { plate, icon, cost, button, flight };
};

/** The accessible name of the upgrade: what it costs, or what is missing. */
const useUpgradeLabel = (item: GearItem, name: string): string => {
  const { tr } = useGameText();
  const { words } = useCoinFormat();
  const { upgrade } = item;
  if (upgrade.kind === "max") {
    return tr("hero.maxLabel", { name });
  }
  const tier = tr(`forgeStones.tiers.${upgrade.tier}`);
  if (upgrade.kind === "ready") {
    return tr("hero.upgradeLabel", {
      name,
      level: item.level + 1,
      price: words(upgrade.coin),
      tier,
    });
  }
  if (upgrade.missingCoin > 0 && !upgrade.hasStone) {
    return tr("hero.needBothLabel", {
      name,
      amount: words(upgrade.missingCoin),
      tier,
    });
  }
  return upgrade.missingCoin > 0
    ? tr("hero.needLabel", { name, amount: words(upgrade.missingCoin) })
    : tr("hero.needStoneLabel", { name, tier });
};

/**
 * One Gear item on the Gear Rack (GDD 7.3): its icon, its name, its level,
 * its stat now and at the next level, and one gold upgrade with all
 * that the next level needs: its Coin and 1 Forge Stone. Each press upgrades 1
 * level at once, with no confirmation. Off at level 25 ("Max level"), and when
 * the Coin is not enough or the Forge Stone is missing (that requirement in a
 * warm red).
 * An upgrade is one beat: its Forge Stone leaps from the cost into the item
 * and strikes it, and then the sparks, the level hop, the stat roll and the
 * glow play together.
 */
export const GearPlate = ({
  item,
  strike,
  onUpgrade,
}: {
  readonly item: GearItem;
  /** The last upgrade of this item in this visit, or `null`. */
  readonly strike: GearStrike | null;
  readonly onUpgrade: () => void;
}) => {
  const { tr } = useGameText();
  const stat = useStatFormat();
  const name = tr(`hero.slots.${item.slot}`);
  const { upgrade } = item;
  const label = useUpgradeLabel(item, name);
  const titleId = `gear-${item.slot}-name`;
  const flash = strike?.serial ?? 0;
  const { plate, icon, cost, button, flight } = useStoneFlight(strike);

  return (
    <li
      ref={plate}
      aria-labelledby={titleId}
      className={cn(
        PLATE,
        "group/gear relative flex min-w-0 flex-col items-center gap-2.5 px-3 pt-3 pb-3",
        "[@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-2"
      )}
      data-testid={`gear-${item.slot}`}
      data-level={item.level}
      data-state={upgrade.kind}
    >
      {/* The short glow of an upgrade: a new element for each one, so that it
          plays again. The plate itself stays, so its button keeps the focus. */}
      {flash > 0 ? (
        <span
          key={flash}
          className="pointer-events-none absolute -inset-0.5 rounded-xl motion-safe:animate-[gear-glow_900ms_ease-out_both]"
          style={ON_STRIKE}
          aria-hidden
        />
      ) : null}
      {strike === null ? null : (
        <span
          key={`flight-${strike.serial}`}
          ref={flight}
          className="pointer-events-none absolute z-10 -mt-2.5 -ml-2.5 size-5 opacity-0 motion-safe:animate-[gear-stone-fly_200ms_linear_both] motion-reduce:hidden [@media(max-height:500px)]:-mt-2 [@media(max-height:500px)]:-ml-2 [@media(max-height:500px)]:size-4"
          aria-hidden
          data-testid="gear-stone-flight"
        >
          <ForgeStoneIcon
            tier={strike.tier}
            className="size-full drop-shadow-[0_0_6px_rgba(255,246,223,0.75)]"
          />
        </span>
      )}
      <span className="flex w-full flex-col items-center gap-1.5 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-2">
        <GearIcon ref={icon} item={item} strike={strike} />
        <h3
          id={titleId}
          className="font-display text-lg leading-tight font-bold text-[#ffe08a] [@media(max-height:500px)]:text-sm"
        >
          {name}
        </h3>
      </span>
      <GearLevel level={item.level} flash={flash} />
      <div className="flex w-full flex-col gap-0.5">
        {/* On a narrow plate the value goes under its name, at the right,
            so the name never breaks. */}
        <span className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className={cn(SMALL_LABEL, "whitespace-nowrap")}>
            {tr(`hero.stats.${item.stat}`)}
          </span>
          <span
            className="ml-auto flex items-baseline gap-1 font-black whitespace-nowrap tabular-nums"
            data-testid="gear-stat"
          >
            <span
              key={flash}
              className={cn(
                "inline-block text-base text-[#fff6df] [@media(max-height:500px)]:text-xs",
                flash > 0 &&
                  "motion-safe:animate-[gear-roll_320ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
              )}
              style={ON_STRIKE}
            >
              {stat(item.stat, item.now)}
            </span>
            {item.next === null ? null : (
              <>
                <span
                  className="text-xs text-[#e9c46a]/80 [@media(max-height:500px)]:text-[10px]"
                  aria-hidden
                >
                  →
                </span>
                <span className="text-base text-[#ffe08a] [@media(max-height:500px)]:text-xs">
                  {stat(item.stat, item.next)}
                </span>
              </>
            )}
          </span>
        </span>
        <p className="text-left text-xs leading-snug text-[#e8d9bb] [@media(max-height:500px)]:sr-only">
          {tr(`hero.statHelp.${item.stat}`)}
        </p>
      </div>
      <div ref={button} className="mt-auto flex w-full flex-col">
        <GameButton
          intent={upgrade.kind === "ready" ? "gold" : "ghost"}
          size="md"
          isDisabled={upgrade.kind !== "ready"}
          onPress={onUpgrade}
          aria-label={label}
          className={cn(
            "w-full px-2.5 text-sm whitespace-nowrap [@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs",
            // An upgrade that is off is an engraved plate with no drop, because
            // it cannot be pressed. Its text stays at full contrast: at level 25
            // the gold "Max level", else the requirements, with the missing
            // ones in a warm red.
            upgrade.kind !== "ready" &&
              "border-[#e9c46a]/50 bg-[#120c08]/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.75)] data-[disabled]:cursor-default data-[disabled]:opacity-100 data-[disabled]:grayscale-0",
            upgrade.kind === "max" && "text-[#ffe08a]",
            upgrade.kind === "short" && "text-[#e8d9bb]"
          )}
          data-testid={`gear-upgrade-${item.slot}`}
          data-gear-upgrade={item.slot}
          data-state={upgrade.kind}
        >
          {upgrade.kind === "max" ? (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <GlyphIcon glyph="check" className="size-3.5 shrink-0" />
              {tr("hero.max")}
            </span>
          ) : (
            // One line. When the plate is too narrow for all of it, the word
            // "Upgrade" wraps to a second line that is cut off, so the cost
            // always shows. The row is reversed and the word is ordered last,
            // so it is the piece that wraps, but it stays first in the text.
            // The accessible name keeps the word.
            <span className="flex h-[1.5em] w-full min-w-0 flex-row-reverse flex-wrap content-start items-center justify-center gap-x-2 overflow-hidden">
              <span className="order-1 flex h-full items-center font-bold">
                {tr("hero.upgrade")}
              </span>
              <span className="flex h-full items-center gap-x-1.5">
                <UpgradeCost
                  upgrade={upgrade}
                  turn={strike?.newTier ?? false}
                  stoneRef={cost}
                />
              </span>
            </span>
          )}
        </GameButton>
      </div>
    </li>
  );
};
