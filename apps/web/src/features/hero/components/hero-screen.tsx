import type { ForgeStoneTier, GearSlot } from "@workspace/rules";
import { gearUpgradeForgeStone, MAX_GEAR_LEVEL } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import type { GearStrike } from "@/features/hero/components/gear-item";
import {
  GEAR_STRIKE_MS,
  GearPlate,
} from "@/features/hero/components/gear-item";
import { HeroScene } from "@/features/hero/components/hero-scene";
import type { ForgeStoneCount, HeroHpParts } from "@/features/hero/hero";
import { upgradeFocusAfter } from "@/features/hero/hero";
import { GEAR_GLYPH } from "@/features/hero/hero-art";
import { useHero } from "@/features/hero/use-hero";
import { useStatFormat } from "@/features/hero/use-stat-format";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "flex rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/** The chime of a Gear item at level 25 comes this long after the strike. */
const MAX_CHIME_MS = 180;

/** A label of the Status Bar: Inter 700, small capitals, `cream-dim`. */
const BAR_LABEL =
  "text-[11px] leading-none font-bold tracking-[0.06em] text-[#e8d9bb] uppercase [@media(max-height:500px)]:text-[9px]";

/**
 * One part of the Hero HP: its label above its number. The Armor part has the
 * breastplate glyph, so it points to the Armor plate of the Gear Rack.
 */
const HpPart = ({
  label,
  value,
  testId,
  armor = false,
}: {
  readonly label: string;
  readonly value: number;
  readonly testId: string;
  readonly armor?: boolean;
}) => (
  <div className="flex flex-col items-start gap-1.5 [@media(max-height:500px)]:gap-1">
    <dt className={cn(BAR_LABEL, "flex items-center gap-1")}>
      {armor ? (
        <GlyphIcon
          glyph={GEAR_GLYPH.armor}
          className="size-3 text-[#e9c46a] [@media(max-height:500px)]:size-2.5"
        />
      ) : null}
      {label}
    </dt>
    <dd
      className="text-lg leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-[13px]"
      data-testid={testId}
    >
      {value}
    </dd>
  </div>
);

/** The "+" between two parts of the Hero HP, on the line of the numbers. */
const Plus = () => (
  <span className="self-end pb-px text-sm leading-none font-bold text-[#e9c46a]/80 [@media(max-height:500px)]:text-[11px]">
    +
  </span>
);

/**
 * The Hero HP and its parts (GDD 4.10, 7.3): the total as the big number, and
 * after it the 3 parts, each with its label: Base, Player (the Player level)
 * and Armor. The total and the Armor part count to their new values after an
 * Armor upgrade.
 */
const HeroHp = ({ hp }: { readonly hp: HeroHpParts }) => {
  const { tr } = useGameText();
  const total = useCountTo(hp.total);
  const armor = useCountTo(hp.armor);
  return (
    <div
      className="flex min-w-0 flex-1 flex-col gap-1.5"
      data-testid="hero-hp"
      data-total={hp.total}
    >
      {/* On the line of the "Forge Stones" heading. */}
      <span
        className={cn(BAR_LABEL, "[@media(max-height:500px)]:hidden")}
        aria-hidden
      >
        {tr("hero.hp")}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3 [@media(max-height:500px)]:gap-2">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-7"
          aria-hidden
        >
          <GlyphIcon
            glyph="heart"
            className="size-5 text-[#ff6b6b] [@media(max-height:500px)]:size-3.5"
          />
        </span>
        <span
          className="shrink-0 text-[32px] leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-lg"
          aria-hidden
        >
          {total}
        </span>
        {/* The parts stand after a dotted rule, as the terms of a sum. */}
        <dl
          className="ml-1 flex min-w-0 items-stretch gap-2.5 border-l-2 border-dotted border-[#e7bb6a]/45 pl-4 [@media(max-height:500px)]:ml-0 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:pl-2.5"
          aria-hidden
          data-testid="hero-hp-parts"
        >
          <HpPart
            label={tr("hero.hpParts.base")}
            value={hp.base}
            testId="hero-hp-base"
          />
          <Plus />
          <HpPart
            label={tr("hero.hpParts.level")}
            value={hp.level}
            testId="hero-hp-level"
          />
          <Plus />
          <HpPart
            label={tr("hero.hpParts.armor")}
            value={armor}
            testId="hero-hp-armor"
            armor
          />
        </dl>
      </div>
      <span className="sr-only">
        {tr("hero.hpLabel", {
          total: hp.total,
          base: hp.base,
          level: hp.level,
          armor: hp.armor,
        })}
      </span>
    </div>
  );
};

/**
 * The 5 Forge Stone counts (GDD 7.2, ADR-0038, ADR-0039) in a tray: each tier
 * in its own cell, with its stone in the Card Rank color, its count and its
 * name. A count of 0 is dimmer. The Forge Stones show only here: there is no
 * Inventory screen.
 */
const ForgeStoneTray = ({
  counts,
  spent,
}: {
  readonly counts: readonly ForgeStoneCount[];
  /** The serial of the last upgrade that used a stone of each tier, in this visit. */
  readonly spent: Readonly<Partial<Record<ForgeStoneTier, number>>>;
}) => {
  const { tr } = useGameText();
  return (
    <section
      aria-labelledby="hero-forge-stones"
      className="flex min-w-0 flex-col gap-1.5 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-2"
      data-testid="hero-forge-stones"
    >
      <h2
        id="hero-forge-stones"
        className={cn(BAR_LABEL, "[@media(max-height:500px)]:shrink-0")}
      >
        {tr("hero.forgeStones")}
      </h2>
      <ul className="grid min-w-0 flex-1 grid-cols-5 divide-x divide-[#e9c46a]/15 rounded-lg border-2 border-[#e9c46a]/35 bg-[#3a2a1c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.55)] [@media(max-height:500px)]:rounded-md">
        {counts.map(({ tier, count }) => {
          const name = tr(`forgeStones.tiers.${tier}`);
          return (
            <li
              key={tier}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 px-1 py-1.5 [@media(max-height:500px)]:py-0.5",
                count === 0 && "opacity-60"
              )}
              data-testid={`hero-forge-stone-${tier}`}
              data-count={count}
            >
              <span className="sr-only">
                {tr("hero.forgeStoneCount", { tier: name, count })}
              </span>
              <span aria-hidden className="flex items-center gap-1.5">
                <ForgeStoneIcon
                  tier={tier}
                  className="size-5 shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-3.5"
                />
                {/* The count hops when an upgrade takes a stone of this tier. */}
                <span
                  key={spent[tier] ?? 0}
                  className={cn(
                    "inline-block text-base leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-xs",
                    spent[tier] !== undefined &&
                      "motion-safe:animate-[workshop-count_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
                  )}
                >
                  {count}
                </span>
              </span>
              <span
                aria-hidden
                className="max-w-full truncate text-[11px] leading-tight font-semibold text-[#e8d9bb] [@media(max-height:500px)]:text-[9px]"
              >
                {name}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/**
 * The Status Bar: one HUD plate as wide as the Gear Rack, on the same 4
 * columns. The Hero HP fills the left 2 columns, and the Forge Stone tray the
 * right 2. When the bar is too narrow for one row, the tray goes under the Hero
 * HP, with a groove between them.
 */
const StatusBar = ({
  hp,
  counts,
  spent,
}: {
  readonly hp: HeroHpParts;
  readonly counts: readonly ForgeStoneCount[];
  readonly spent: Readonly<Partial<Record<ForgeStoneTier, number>>>;
}) => (
  <div className="@container" data-testid="hero-plate">
    <div
      className={cn(
        PLATE,
        "grid grid-cols-4 gap-3 px-3 py-3 @max-[44rem]:grid-cols-1 @max-[44rem]:gap-2.5",
        "[@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1.5"
      )}
    >
      <div className="col-span-2 flex min-w-0 flex-col @max-[44rem]:col-span-1">
        <HeroHp hp={hp} />
      </div>
      <div
        className={cn(
          "relative col-span-2 min-w-0 @max-[44rem]:col-span-1",
          // The groove over the tray when it goes under the Hero HP: a dark cut
          // with a lit edge.
          "@max-[44rem]:pt-2.5 @max-[44rem]:before:absolute @max-[44rem]:before:inset-x-0 @max-[44rem]:before:top-0 @max-[44rem]:before:h-0.5 @max-[44rem]:before:rounded-full @max-[44rem]:before:bg-[#0c0805]/70 @max-[44rem]:before:shadow-[0_1px_0_rgba(231,187,106,0.3)]",
          "[@media(max-height:500px)]:@max-[44rem]:pt-2"
        )}
      >
        <ForgeStoneTray counts={counts} spent={spent} />
      </div>
    </div>
  </div>
);

/**
 * The sounds of a Gear upgrade: the strike, and at level 25 the chime of a
 * Rare card. The strike sounds when the Forge Stone strikes its Gear item, or
 * at once with reduced motion, because then the stone does not fly. The
 * timers stop when the screen closes.
 */
const useUpgradeSounds = () => {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  const later = (ms: number, play: () => void) => {
    timers.current.push(window.setTimeout(play, ms));
  };
  return (maxed: boolean) => {
    unlockAudio();
    const strike = prefersReducedMotion() ? 0 : GEAR_STRIKE_MS;
    if (strike === 0) {
      playSound("gearUp", 0);
    } else {
      later(strike, () => playSound("gearUp", 0));
    }
    if (maxed) {
      later(strike + MAX_CHIME_MS, () => playSound("revealRare", 0));
    }
  };
};

/**
 * The Hero screen (GDD 7.3, issue #77, "Gear Rack"): the inside of the
 * Barracks, the Status Bar with the Hero HP and its parts and the 5 Forge Stone
 * counts (ADR-0038), and the 4 Gear items side by side.
 * Each press of an upgrade adds 1 level at once: its Forge Stone leaps from
 * the upgrade into the item and strikes it, the level hops, the stat rolls to
 * its new value, a sound plays and the Coin counts down. After an
 * upgrade, the focus stays on that upgrade while it is on, else it goes to
 * the next one that is on.
 */
export const HeroScreen = () => {
  const { tr } = useGameText();
  const hero = useHero();
  const stat = useStatFormat();
  const sounds = useUpgradeSounds();
  const coin = useCountTo(hero.coin);
  const [strikes, setStrikes] = useState<
    Readonly<Partial<Record<GearSlot, GearStrike>>>
  >({});
  const [spent, setSpent] = useState<
    Readonly<Partial<Record<ForgeStoneTier, number>>>
  >({});
  const [said, setSaid] = useState("");
  const rack = useRef<HTMLUListElement>(null);
  const pendingFocus = useRef<GearSlot | null>(null);

  // After an upgrade: the focus stays on it while it is on, else it goes to
  // the next upgrade that is on, else to the rack.
  useLayoutEffect(() => {
    const from = pendingFocus.current;
    if (from === null) {
      return;
    }
    pendingFocus.current = null;
    const target = upgradeFocusAfter(hero.items, from);
    const node = rack.current;
    const button =
      target === null
        ? null
        : node?.querySelector<HTMLElement>(`[data-gear-upgrade="${target}"]`);
    if (button) {
      button.focus();
    } else if (node && !node.contains(document.activeElement)) {
      node.focus();
    }
  }, [hero.items]);

  const upgrade = (slot: GearSlot) => {
    if (!hero.upgrade(slot)) {
      return;
    }
    const level = hero.gear[slot] + 1;
    const item = hero.items.find((entry) => entry.slot === slot);
    const tier = gearUpgradeForgeStone(level);
    const nextTier =
      level < MAX_GEAR_LEVEL ? gearUpgradeForgeStone(level + 1) : tier;
    pendingFocus.current = slot;
    setStrikes((current) => ({
      ...current,
      [slot]: {
        serial: (current[slot]?.serial ?? 0) + 1,
        tier,
        newTier: nextTier !== tier,
      },
    }));
    setSpent((current) => ({ ...current, [tier]: (current[tier] ?? 0) + 1 }));
    sounds(level >= MAX_GEAR_LEVEL);
    if (item !== undefined && item.next !== null) {
      const done = tr("hero.done", {
        name: tr(`hero.slots.${slot}`),
        level,
        stat: tr(`hero.stats.${item.stat}`),
        value: stat(item.stat, item.next),
      });
      setSaid(
        nextTier === tier
          ? done
          : `${done} ${tr("hero.nextTier", { tier: tr(`forgeStones.tiers.${nextTier}`) })}`
      );
    }
  };

  return (
    <main
      aria-label={tr("hero.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="hero"
    >
      {/* The Barracks inside (Town Concepts 11). */}
      <HeroScene />
      <BalancePlate
        balances={{
          coin,
          essence: hero.balances.essence,
          heynstones: hero.balances.heynstones,
        }}
      />
      {/* The Status Bar and the Gear Rack stand in front of the calm wall of
          the Barracks (Town Concepts 11.2), centered in the height between
          the top plates and the Town Bar. */}
      <div
        className={cn(
          "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+3.5rem)] bottom-[calc(var(--town-bar)+12px)] left-1/2 flex w-[min(calc(100vw-1.5rem),1080px)] -translate-x-1/2 flex-col justify-center gap-3",
          "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[calc(var(--town-bar)+6px)] [@media(max-height:500px)]:w-[calc(100vw-max(0.5rem,env(safe-area-inset-left))-max(0.5rem,env(safe-area-inset-right)))] [@media(max-height:500px)]:gap-2"
        )}
      >
        <StatusBar hp={hero.hp} counts={hero.forgeStones} spent={spent} />
        <ul
          ref={rack}
          tabIndex={-1}
          aria-label={tr("hero.gear")}
          className="grid min-h-0 grid-cols-4 gap-3 outline-none [@media(max-height:500px)]:gap-2"
          data-testid="gear-rack"
        >
          {hero.items.map((item) => (
            <GearPlate
              key={item.slot}
              item={item}
              strike={strikes[item.slot] ?? null}
              onUpgrade={() => upgrade(item.slot)}
            />
          ))}
        </ul>
      </div>
      <p className="sr-only" aria-live="polite" data-testid="hero-said">
        {said}
      </p>
    </main>
  );
};
