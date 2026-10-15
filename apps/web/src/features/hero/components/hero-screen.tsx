import type { ClassId, GearSlot } from "@workspace/rules";
import { MAX_GEAR_LEVEL } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { PARCHMENT } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { GearPlate } from "@/features/hero/components/gear-item";
import { HeroScene } from "@/features/hero/components/hero-scene";
import type { ForgeStoneCount, HeroHpParts } from "@/features/hero/hero";
import { upgradeFocusAfter } from "@/features/hero/hero";
import { useHero } from "@/features/hero/use-hero";
import { useStatFormat } from "@/features/hero/use-stat-format";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "flex rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/** The chime of a Gear item at level 25 comes this long after the strike. */
const MAX_CHIME_MS = 180;

/**
 * The Class seal of the Hero: the Class glyph in ink on the radial parchment
 * plate of the Skill Card emblem, with a bronze rim. There are no Class
 * colors.
 */
const ClassSeal = ({ classId }: { readonly classId: ClassId }) => (
  <span
    className="grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-[#e7bb6a] shadow-[0_3px_0_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,255,255,0.35)] [@media(max-height:500px)]:size-9 [@media(max-height:500px)]:border-2"
    style={{
      background: `radial-gradient(circle at 35% 30%, #fffaf0, ${PARCHMENT.main} 55%, #d8c494)`,
      color: PARCHMENT.ink,
    }}
    aria-hidden
    data-testid="hero-class-seal"
  >
    <GlyphIcon glyph={classGlyph(classId)} className="size-[58%]" />
  </span>
);

/**
 * The Hero HP and its parts (GDD 4.10, 7.3): the total as the big number, and
 * the sum next to it, "= 30 base + 6 level + 10 × 1 Armor". The total counts to
 * its new value after an Armor upgrade.
 */
const HeroHp = ({ hp }: { readonly hp: HeroHpParts }) => {
  const { tr } = useGameText();
  const total = useCountTo(hp.total);
  return (
    <div
      className="flex items-center gap-3 [@media(max-height:500px)]:gap-2"
      data-testid="hero-hp"
      data-total={hp.total}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-7"
        aria-hidden
      >
        <GlyphIcon
          glyph="heart"
          className="size-5 text-[#ff6b6b] [@media(max-height:500px)]:size-3.5"
        />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-bold text-[#e8d9bb] [@media(max-height:500px)]:sr-only">
          {tr("hero.hp")}
        </span>
        <span className="flex items-baseline gap-2" aria-hidden>
          <span className="text-[28px] leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-lg">
            {total}
          </span>
          <span
            className="text-[13px] font-semibold whitespace-nowrap text-[#e8d9bb] tabular-nums [@media(max-height:500px)]:text-[11px]"
            data-testid="hero-hp-sum"
          >
            {tr("hero.hpSum", {
              base: hp.base,
              level: hp.level,
              armorLevel: hp.armorLevel,
              perLevel: hp.armorPerLevel,
            })}
          </span>
        </span>
        <span className="sr-only">
          {tr("hero.hpLabel", {
            total: hp.total,
            base: hp.base,
            level: hp.level,
            armor: hp.armor,
          })}
        </span>
      </div>
    </div>
  );
};

/**
 * The 5 Forge Stone counts (GDD 7.2, ADR-0038, ADR-0039) on a slim HUD
 * plate: each tier with its stone in the Card Rank color, its name and its
 * count. A count of 0 is dimmer. The Forge Stones show only here: there is no Inventory screen.
 */
const ForgeStonePlate = ({
  counts,
}: {
  readonly counts: readonly ForgeStoneCount[];
}) => {
  const { tr } = useGameText();
  return (
    <section
      aria-labelledby="hero-forge-stones"
      className={cn(
        PLATE,
        "w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 [@media(max-height:500px)]:gap-x-3 [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:py-1"
      )}
      data-testid="hero-forge-stones"
    >
      <h2
        id="hero-forge-stones"
        className="text-xs font-bold text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]"
      >
        {tr("hero.forgeStones")}
      </h2>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 [@media(max-height:500px)]:gap-x-3">
        {counts.map(({ tier, count }) => {
          const name = tr(`forgeStones.tiers.${tier}`);
          return (
            <li
              key={tier}
              className={cn(
                "flex items-center gap-1.5 text-[13px] whitespace-nowrap [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:text-[11px]",
                count === 0 && "opacity-60"
              )}
              data-testid={`hero-forge-stone-${tier}`}
              data-count={count}
            >
              <ForgeStoneIcon
                tier={tier}
                className="size-5 shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-3.5"
              />
              <span className="sr-only">
                {tr("hero.forgeStoneCount", { tier: name, count })}
              </span>
              <span aria-hidden className="flex items-baseline gap-1">
                <span className="font-semibold text-[#e8d9bb]">{name}</span>
                <span className="text-base font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-xs">
                  {count}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/**
 * The sounds of a Gear upgrade: the strike, and at level 25 the chime of a
 * Rare card. The timers stop when the screen closes.
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
  return (maxed: boolean) => {
    unlockAudio();
    playSound("gearUp", 0);
    if (maxed) {
      timers.current.push(
        window.setTimeout(() => playSound("revealRare", 0), MAX_CHIME_MS)
      );
    }
  };
};

/**
 * The Hero screen (GDD 7.3, issue #77, "Gear Rack"): the inside of the
 * Barracks, the Hero plate with the Class of the Active Deck (ADR-0033), its
 * Deck and the Hero HP with its parts, the 5 Forge Stone counts (ADR-0038),
 * and the 4 Gear items side by side.
 * Each press of an upgrade adds 1 level at once: the notch fills, the stat
 * rolls to its new value, a sound plays and the Coin counts down. After an
 * upgrade, the focus stays on that upgrade while it is on, else it goes to
 * the next one that is on. "Change Deck" opens the Deck dialog.
 */
export const HeroScreen = () => {
  const { tr, text } = useGameText();
  const hero = useHero();
  const stat = useStatFormat();
  const sounds = useUpgradeSounds();
  const coin = useCountTo(hero.coin);
  const [deckOpen, setDeckOpen] = useState(false);
  const [flash, setFlash] = useState<
    Readonly<Partial<Record<GearSlot, number>>>
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
    pendingFocus.current = slot;
    setFlash((current) => ({ ...current, [slot]: (current[slot] ?? 0) + 1 }));
    sounds(level >= MAX_GEAR_LEVEL);
    if (item !== undefined && item.next !== null) {
      setSaid(
        tr("hero.done", {
          name: tr(`hero.slots.${slot}`),
          level,
          stat: tr(`hero.stats.${item.stat}`),
          value: stat(item.stat, item.next),
        })
      );
    }
  };

  const { deck } = hero;

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
      {/* The Hero plate and the Gear Rack stand in front of the calm wall of
          the Barracks (Town Concepts 11.2), centered in the height between
          the top plates and the Town Bar. */}
      <div
        className={cn(
          "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+3.5rem)] bottom-[92px] left-1/2 flex w-[min(calc(100vw-1.5rem),1080px)] -translate-x-1/2 flex-col justify-center gap-3",
          "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:w-[calc(100vw-max(0.5rem,env(safe-area-inset-left))-max(0.5rem,env(safe-area-inset-right)))] [@media(max-height:500px)]:gap-2"
        )}
      >
        {deck ? (
          <section
            aria-labelledby="hero-class"
            className={cn(
              PLATE,
              "items-center gap-4 px-4 py-3 [@media(max-height:500px)]:gap-2.5 [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:py-1.5"
            )}
            data-testid="hero-plate"
          >
            <ClassSeal classId={deck.classId} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2
                id="hero-class"
                className="font-display text-xl leading-tight font-bold text-[#ffe08a] [@media(max-height:500px)]:text-sm"
                data-testid="hero-class"
                data-class={deck.classId}
              >
                {tr(`classes.${deck.classId}`)}
              </h2>
              <p
                className="truncate text-[13px] text-[#e8d9bb] [@media(max-height:500px)]:text-[11px]"
                data-testid="hero-deck"
              >
                {tr("hero.deck", {
                  name:
                    deck.deckName._tag === "Given"
                      ? deck.deckName.name
                      : text(deck.deckName.name),
                })}
              </p>
            </div>
            <GameButton
              intent="wood"
              size="sm"
              onPress={() => setDeckOpen(true)}
              aria-label={tr("hero.changeDeckLabel")}
              className="shrink-0 whitespace-nowrap [@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-xs"
              data-testid="hero-change-deck"
            >
              <GlyphIcon glyph="cards" className="size-4 shrink-0" />
              {tr("hero.changeDeck")}
            </GameButton>
            <span
              className="h-10 w-0.5 shrink-0 rounded-full bg-[#e9c46a]/25 [@media(max-height:500px)]:h-7"
              aria-hidden
            />
            <HeroHp hp={hero.hp} />
          </section>
        ) : null}
        <ForgeStonePlate counts={hero.forgeStones} />
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
              flash={flash[item.slot] ?? 0}
              onUpgrade={() => upgrade(item.slot)}
            />
          ))}
        </ul>
      </div>
      <DeckDialog isOpen={deckOpen} onOpenChange={setDeckOpen} />
      <p className="sr-only" aria-live="polite" data-testid="hero-said">
        {said}
      </p>
    </main>
  );
};
