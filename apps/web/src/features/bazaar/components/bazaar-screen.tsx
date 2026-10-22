/**
 * The Bazaar screen (Economy 3.5): the offers that the Player buys with
 * Heynstones. v1 sells only Cosmetics (ADR-0008), grouped by their family,
 * and the Player owns each one forever. A Card Back, a Hero portrait, a Gear
 * look or a Board skin that the Player owns is a look that they can use: the section
 * shows it on the shelf and makes it the Active Cosmetic of its family.
 */
import type {
  ClassId,
  Cosmetic,
  CosmeticFamily,
  CosmeticId,
} from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Button } from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { CardBack } from "@/features/battle/components/card-back";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import type { LookFamily } from "@/features/bazaar/bazaar";
import {
  bazaarGroups,
  canBuyCosmetic,
  cosmeticItemKey,
  isLookFamily,
} from "@/features/bazaar/bazaar";
import { BazaarScene } from "@/features/bazaar/components/bazaar-scene";
import { BoardSkinThumb } from "@/features/bazaar/components/board-skin-look";
import { CosmeticShelf } from "@/features/bazaar/components/cosmetic-shelf";
import { GearLookThumb } from "@/features/bazaar/components/gear-look-icons";
import { useBazaar } from "@/features/bazaar/use-bazaar";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The glyph of each family on the item plates. A look shows its face. */
const FAMILY_GLYPH: Readonly<Record<CosmeticFamily, Glyph>> = {
  cardBack: "cards",
  heroPortrait: "helmet",
  gearLook: "breastplate",
  boardSkin: "banner",
};

/** The look of a family at the size of a plate thumbnail. */
const PlateLook = ({
  family,
  look,
  classId,
}: {
  readonly family: LookFamily;
  readonly look: CosmeticId | null;
  readonly classId: ClassId;
}) => {
  if (family === "cardBack") {
    return (
      <span
        className="block [font-size:4.4px] [@media(max-height:500px)]:[font-size:3.6px]"
        aria-hidden
      >
        <CardBack back={look} />
      </span>
    );
  }
  if (family === "gearLook") {
    return (
      <GearLookThumb
        look={look}
        className="w-10 [@media(max-height:500px)]:w-8"
      />
    );
  }
  if (family === "boardSkin") {
    return (
      <BoardSkinThumb
        skin={look}
        className="w-10 [@media(max-height:500px)]:w-8"
      />
    );
  }
  return (
    <HeroPortrait
      id={look}
      classId={classId}
      className="w-10 [@media(max-height:500px)]:w-8"
    />
  );
};

/**
 * The thumbnail of a look on its plate, as a button: a press, the pointer or
 * the keyboard focus puts the look on the shelf. It is the way to see a look
 * that the Player does not own yet.
 */
const LookThumb = ({
  family,
  look,
  classId,
  name,
  onPreview,
}: {
  readonly family: LookFamily;
  readonly look: CosmeticId | null;
  readonly classId: ClassId;
  readonly name: string;
  readonly onPreview: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <Button
      aria-label={tr("bazaar.previewLabel", { name })}
      onPointerEnter={onPreview}
      onFocus={onPreview}
      onPress={onPreview}
      className="shrink-0 rounded-lg outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
      data-testid="bazaar-preview"
    >
      <PlateLook family={family} look={look} classId={classId} />
    </Button>
  );
};

/**
 * One Bazaar item on its plate: its look or its family glyph, its name, and
 * its price or its state. A look that the Player owns has **Use**; the Active
 * one has a gold check. An item of a family that the game cannot draw has a
 * green check when the Player owns it.
 */
const ItemPlate = ({
  item,
  owned,
  active,
  affordable,
  thumb,
  onBuy,
  onUse,
}: {
  readonly item: Cosmetic;
  readonly owned: boolean;
  readonly active: boolean;
  readonly affordable: boolean;
  readonly thumb: ReactNode;
  readonly onBuy: (item: Cosmetic) => void;
  readonly onUse?: (item: Cosmetic) => void;
}) => {
  const { tr } = useGameText();
  const price = item.price ?? 0;
  const name = tr(`bazaar.items.${cosmeticItemKey(item.id)}`);
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl p-2.5",
        "border-2 border-[#e9c46a]/50 bg-[#1c140e]/85 text-[#fff6df]",
        "shadow-[0_3px_0_rgba(0,0,0,0.45)]",
        active &&
          "border-[#ffd75a] shadow-[0_0_0_1px_#ffd75a,0_3px_0_rgba(0,0,0,0.45)]",
        !affordable && !owned && "opacity-60"
      )}
      data-testid="bazaar-item"
      data-cosmetic-id={item.id}
      data-owned={owned}
      data-active={active || undefined}
    >
      {thumb}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-[#cbbfa5]">
          {active || owned
            ? tr("bazaar.owned")
            : tr("bazaar.price", { amount: price })}
        </p>
      </div>
      {active ? (
        <GlyphIcon
          glyph="check"
          label={tr("bazaar.inUse")}
          className="size-6 shrink-0 text-[#ffd75a]"
        />
      ) : owned && onUse === undefined ? (
        <GlyphIcon
          glyph="check"
          label={tr("bazaar.ownedLabel")}
          className="size-6 shrink-0 text-[#8fd08f]"
        />
      ) : owned ? (
        <GameButton
          intent="wood"
          size="sm"
          onPress={() => onUse?.(item)}
          aria-label={tr("bazaar.useLabel", { name })}
        >
          {tr("bazaar.use")}
        </GameButton>
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
 * The Standard look of a look family on its plate (Economy 3.5): the free
 * look that every Player has, first in its section. It is not a Bazaar item:
 * it has no price and no Buy. Its **Use** shows the Standard look again, so
 * the Player never loses the way back.
 */
const StandardPlate = ({
  family,
  classId,
  active,
  onUse,
  onPreview,
}: {
  readonly family: LookFamily;
  readonly classId: ClassId;
  readonly active: boolean;
  readonly onUse: () => void;
  readonly onPreview: () => void;
}) => {
  const { tr } = useGameText();
  const name = tr(`bazaar.standard.${family}`);
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl p-2.5",
        "border-2 border-[#e9c46a]/50 bg-[#1c140e]/85 text-[#fff6df]",
        "shadow-[0_3px_0_rgba(0,0,0,0.45)]",
        active &&
          "border-[#ffd75a] shadow-[0_0_0_1px_#ffd75a,0_3px_0_rgba(0,0,0,0.45)]"
      )}
      data-testid="cosmetic-standard"
      data-family={family}
      data-active={active || undefined}
    >
      <Button
        aria-label={tr("bazaar.previewLabel", { name })}
        onPointerEnter={onPreview}
        onFocus={onPreview}
        onPress={onPreview}
        className="shrink-0 rounded-lg outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]"
        data-testid="bazaar-preview"
      >
        <PlateLook family={family} look={null} classId={classId} />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="text-xs text-[#cbbfa5]">
          {active ? tr("bazaar.owned") : tr("bazaar.alwaysYours")}
        </p>
      </div>
      {active ? (
        <GlyphIcon
          glyph="check"
          label={tr("bazaar.inUse")}
          className="size-6 shrink-0 text-[#ffd75a]"
        />
      ) : (
        <GameButton
          intent="wood"
          size="sm"
          onPress={onUse}
          aria-label={tr(`bazaar.useStandard.${family}`)}
        >
          {tr("bazaar.use")}
        </GameButton>
      )}
    </li>
  );
};

/** The look on the shelf of one section. */
interface Preview {
  readonly family: LookFamily;
  readonly look: CosmeticId | null;
}

/**
 * The Bazaar screen: one section for each family, in the order of the Economy
 * table. The Balance Plate shows the Heynstones next to the Coin and the
 * Essence, so the Player sees what the items cost. Each look family has the
 * shelf that shows the look, so the
 * Player sees it before the purchase and before the Use.
 */
export const BazaarScreen = () => {
  const { tr } = useGameText();
  const {
    balances,
    heynstones,
    owned,
    classId,
    activeLooks,
    buy,
    select,
    selectStandard,
  } = useBazaar();
  const groups = useMemo(() => bazaarGroups(), []);
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const coin = useCountTo(balances.coin);
  const [said, setSaid] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);

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

  const applyLook = (family: LookFamily, item: Cosmetic | null) => {
    const name =
      item === null
        ? tr(`bazaar.standard.${family}`)
        : tr(`bazaar.items.${cosmeticItemKey(item.id)}`);
    if (item === null) {
      selectStandard(family);
    } else if (!select(item.id)) {
      setSaid(tr("bazaar.cannotUse"));
      return;
    }
    unlockAudio();
    playSound("select");
    setSaid(tr("bazaar.used", { name }));
  };

  const previewLook = (family: LookFamily, look: CosmeticId | null) => {
    setPreview({ family, look });
  };

  return (
    <main
      aria-label={tr("bazaar.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="bazaar"
    >
      <BazaarScene />
      <BalancePlate balances={{ ...balances, coin }} />
      {/* The page heading stays for screen readers only. */}
      <h1 className="sr-only">{tr("bazaar.title")}</h1>
      <div className="absolute inset-x-0 top-[calc(max(0.75rem,env(safe-area-inset-top))+5.25rem)] bottom-[var(--town-bar)] flex flex-col items-center gap-3 overflow-y-auto px-2 pb-4">
        {groups.map(({ family, items }) => {
          const lookFamily = isLookFamily(family) ? family : null;
          const activeId = lookFamily === null ? null : activeLooks[lookFamily];
          const shownId =
            lookFamily !== null && preview?.family === lookFamily
              ? preview.look
              : activeId;
          const shownItem =
            shownId === null
              ? null
              : (items.find((item) => item.id === shownId) ?? null);
          const shownName =
            shownItem === null
              ? lookFamily === null
                ? ""
                : tr(`bazaar.standard.${lookFamily}`)
              : tr(`bazaar.items.${cosmeticItemKey(shownItem.id)}`);
          const shownStatus =
            shownItem === null
              ? tr("bazaar.alwaysYours")
              : ownedSet.has(shownItem.id)
                ? tr("bazaar.owned")
                : tr("bazaar.price", { amount: shownItem.price ?? 0 });
          const shownActive =
            shownItem === null ? activeId === null : shownItem.id === activeId;
          return (
            <section
              key={family}
              aria-label={tr(`bazaar.families.${family}`)}
              className="w-[min(100%,640px)] shrink-0"
              data-testid="bazaar-group"
              data-family={family}
            >
              <h2 className="mb-1.5 px-1 text-center text-base font-bold [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                {tr(`bazaar.families.${family}`)}
              </h2>
              {lookFamily === null ? null : (
                <div className="mb-2">
                  <CosmeticShelf
                    family={lookFamily}
                    look={shownItem?.id ?? null}
                    classId={classId}
                    name={shownName}
                    status={shownStatus}
                    inUse={shownActive}
                  />
                </div>
              )}
              <ul className="grid gap-2 sm:grid-cols-2">
                {lookFamily === null ? null : (
                  <StandardPlate
                    family={lookFamily}
                    classId={classId}
                    active={activeId === null}
                    onUse={() => applyLook(lookFamily, null)}
                    onPreview={() => previewLook(lookFamily, null)}
                  />
                )}
                {items.map((item) => {
                  const name = tr(`bazaar.items.${cosmeticItemKey(item.id)}`);
                  return (
                    <ItemPlate
                      key={item.id}
                      item={item}
                      owned={ownedSet.has(item.id)}
                      active={lookFamily !== null && item.id === activeId}
                      affordable={canBuyCosmetic(item, owned, heynstones)}
                      thumb={
                        lookFamily === null ? (
                          <GlyphIcon
                            glyph={FAMILY_GLYPH[family]}
                            className="size-9 shrink-0 text-[#e9c46a]"
                            label={tr(`bazaar.families.${family}`)}
                          />
                        ) : (
                          <LookThumb
                            family={lookFamily}
                            look={item.id}
                            classId={classId}
                            name={name}
                            onPreview={() => previewLook(lookFamily, item.id)}
                          />
                        )
                      }
                      onBuy={tryBuy}
                      onUse={
                        lookFamily === null
                          ? undefined
                          : (chosen) => applyLook(lookFamily, chosen)
                      }
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite" data-testid="bazaar-said">
        {said}
      </p>
    </main>
  );
};
