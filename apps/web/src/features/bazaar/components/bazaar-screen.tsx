/**
 * The Bazaar screen (Economy 3.5): the offers that the Player buys with
 * Heynstones. v1 sells only Cosmetics (ADR-0008), grouped by their family,
 * and the Player owns each one forever.
 */
import type { Cosmetic, CosmeticFamily } from "@workspace/rules";
import { cn } from "cn";
import { useMemo, useState } from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import {
  bazaarGroups,
  canBuyCosmetic,
  cosmeticItemKey,
} from "@/features/bazaar/bazaar";
import { useBazaar } from "@/features/bazaar/use-bazaar";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The glyph of each family on the item plates. */
const FAMILY_GLYPH: Readonly<Record<CosmeticFamily, Glyph>> = {
  cardBack: "cards",
  heroPortrait: "helmet",
  gearLook: "breastplate",
  boardSkin: "banner",
};

/** The warm wall of the market hall, with no Building inside in v1. */
const MarketScene = () => (
  <div
    aria-hidden
    className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#6a3f2a_0%,#4a2a1c_55%,#2a1824_100%)]"
  />
);

const ItemPlate = ({
  item,
  owned,
  affordable,
  onBuy,
}: {
  readonly item: Cosmetic;
  readonly owned: boolean;
  readonly affordable: boolean;
  readonly onBuy: (item: Cosmetic) => void;
}) => {
  const { tr } = useGameText();
  const price = item.price ?? 0;
  const name = tr(`bazaar.items.${cosmeticItemKey(item.id)}`);
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl p-2.5",
        "border-2 border-[#e9c46a]/50 bg-[#1c140e]/75 text-[#fff6df]",
        "shadow-[0_3px_0_rgba(0,0,0,0.45)]",
        owned && "opacity-90",
        !affordable && !owned && "opacity-60"
      )}
      data-testid="bazaar-item"
      data-cosmetic-id={item.id}
      data-owned={owned}
    >
      <GlyphIcon
        glyph={FAMILY_GLYPH[item.family]}
        className="size-9 shrink-0 text-[#e9c46a]"
        label={tr(`bazaar.families.${item.family}`)}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-[#cbbfa5]">
          {owned ? tr("bazaar.owned") : tr("bazaar.price", { amount: price })}
        </p>
      </div>
      {owned ? (
        <GlyphIcon
          glyph="check"
          label={tr("bazaar.ownedLabel")}
          className="size-6 shrink-0 text-[#8fd08f]"
        />
      ) : (
        <GameButton
          intent="gold"
          size="sm"
          isDisabled={!affordable}
          onPress={() => onBuy(item)}
          aria-label={tr("bazaar.buyLabel", { name, amount: price })}
        >
          {tr("bazaar.buy")}
        </GameButton>
      )}
    </li>
  );
};

/**
 * The Bazaar screen: one section for each family, in the order of the
 * Economy table. The Balance Plate shows the Heynstones next to the Coin and
 * the Essence, so the Player sees what the items cost.
 */
export const BazaarScreen = () => {
  const { tr } = useGameText();
  const { balances, heynstones, owned, buy } = useBazaar();
  const groups = useMemo(() => bazaarGroups(), []);
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const coin = useCountTo(balances.coin);
  const [said, setSaid] = useState("");

  const tryBuy = (item: Cosmetic) => {
    if (!buy(item.id, groups)) {
      setSaid(tr("bazaar.cannotBuy"));
      return;
    }
    unlockAudio();
    playSound("select");
    setSaid(
      tr("bazaar.bought", {
        name: tr(`bazaar.items.${cosmeticItemKey(item.id)}`),
      })
    );
  };

  return (
    <main
      aria-label={tr("bazaar.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="bazaar"
    >
      <MarketScene />
      <BalancePlate balances={{ ...balances, coin }} />
      {/* The page heading stays for screen readers only. */}
      <h1 className="sr-only">{tr("bazaar.title")}</h1>
      <div className="absolute inset-x-0 top-[calc(max(0.75rem,env(safe-area-inset-top))+5.25rem)] bottom-[80px] flex flex-col items-center gap-3 overflow-y-auto px-2 pb-4 [@media(max-height:500px)]:bottom-[56px]">
        <p className="text-center text-sm text-[#e9c46a]">
          {tr("bazaar.note")}
        </p>
        {groups.map((group) => (
          <section
            key={group.family}
            aria-label={tr(`bazaar.families.${group.family}`)}
            className="w-[min(100%,640px)] shrink-0"
            data-testid="bazaar-group"
            data-family={group.family}
          >
            <h2 className="mb-1.5 px-1 text-center text-base font-bold">
              {tr(`bazaar.families.${group.family}`)}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {group.items.map((item) => (
                <ItemPlate
                  key={item.id}
                  item={item}
                  owned={ownedSet.has(item.id)}
                  affordable={canBuyCosmetic(item, owned, heynstones)}
                  onBuy={tryBuy}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="sr-only" aria-live="polite" data-testid="bazaar-said">
        {said}
      </p>
    </main>
  );
};
