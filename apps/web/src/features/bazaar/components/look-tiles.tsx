import type { ClassId, Cosmetic, CosmeticId } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode, Ref } from "react";
import { useMemo } from "react";
import { GridList, GridListItem } from "react-aria-components";

import { CardBack } from "@/features/battle/components/card-back";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type { LookFamily } from "@/features/bazaar/bazaar";
import {
  canBuyCosmetic,
  cosmeticItemKey,
  STANDARD_TILE,
} from "@/features/bazaar/bazaar";
import { BoardSkinThumb } from "@/features/bazaar/components/board-skin-look";
import { GearLookThumb } from "@/features/bazaar/components/gear-look-icons";
import { BAZAAR_COLORS, BAZAAR_CSS, cssVars } from "@/features/bazaar/tokens";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";
import { BalanceIcon } from "@/features/town/components/balance-icon";

/** The look of a family at the size of a tile, from the `--look` unit. */
const TileLook = ({
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
      <span className="block [font-size:var(--look)]" aria-hidden>
        <CardBack back={look} />
      </span>
    );
  }
  const square = "w-[calc(var(--look)*9.6)]";
  if (family === "gearLook") {
    return <GearLookThumb look={look} className={square} />;
  }
  if (family === "boardSkin") {
    return <BoardSkinThumb skin={look} className={square} />;
  }
  return (
    <HeroPortrait
      id={look}
      classId={classId}
      className="w-[calc(var(--look)*9.4)]"
    />
  );
};

/** One line under the name of a tile, with its mark at the left. */
const TileState = ({
  mark,
  text,
  className,
  stamped = false,
}: {
  readonly mark?: ReactNode;
  readonly text: ReactNode;
  readonly className?: string;
  readonly stamped?: boolean;
}) => (
  <span
    className={cn(
      "flex items-center gap-1 text-xs leading-none font-bold whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-[11px]",
      stamped &&
        "motion-safe:animate-[bazaar-stamp_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
      className
    )}
  >
    {mark}
    {text}
  </span>
);

/** The check of an owned look. The word next to it says the same. */
const CheckMark = ({ className }: { readonly className: string }) => (
  <GlyphIcon glyph="check" className={cn("size-3.5 shrink-0", className)} />
);

/**
 * One look on its tile: the art in a sunken well, the name and one state.
 * A press shows the look in the Inspector, and the Buy and the Use are there.
 * The tile in the Inspector has a gold frame, a glow and a 1.05 scale. The
 * Active look has a slow gold frame and "In use", so the 2 meanings stay
 * apart when the Player looks at another tile.
 */
const LookTile = ({
  id,
  family,
  name,
  active,
  look,
  premium,
  state,
  testId,
  cosmeticId,
  owned,
}: {
  readonly id: string;
  readonly family: LookFamily;
  readonly name: string;
  readonly active: boolean;
  readonly look: ReactNode;
  readonly premium: boolean;
  readonly state: ReactNode;
  readonly testId: string;
  readonly cosmeticId?: CosmeticId;
  readonly owned?: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <GridListItem
      id={id}
      textValue={name}
      className={({ isSelected }) =>
        cn(
          "bg-plate-socket text-cream relative flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-2.5 outline-none select-none",
          "transition-[scale,border-color,box-shadow] duration-150 ease-out",
          "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
          "[@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:rounded-lg [@media(max-height:500px)]:p-1.5",
          isSelected
            ? "border-ready-gold z-10 scale-105 shadow-(--bazaar-selected)"
            : "border-gold-trim/25 data-[hovered]:border-gold-trim/80 shadow-(--bazaar-tile)"
        )
      }
      style={cssVars({
        "--bazaar-selected": BAZAAR_CSS.selected,
        "--bazaar-tile": BAZAAR_CSS.tile,
      })}
      data-testid={testId}
      data-family={family}
      data-cosmetic-id={cosmeticId}
      data-owned={owned}
      data-active={active || undefined}
    >
      {active ? (
        <span
          className="border-gold-trim pointer-events-none absolute -inset-0.5 rounded-xl border-2 motion-safe:animate-[bazaar-in-use_2.8s_ease-in-out_infinite] [@media(max-height:500px)]:rounded-lg"
          style={{ boxShadow: BAZAAR_CSS.inUse }}
          data-testid="bazaar-in-use-frame"
          aria-hidden
        />
      ) : null}
      <span
        className="bg-night-plate flex h-[calc(var(--look)*13.6)] items-center justify-center rounded-lg"
        style={premium ? { backgroundImage: BAZAAR_CSS.stage } : undefined}
      >
        {look}
      </span>
      <span className="flex min-w-0 flex-col gap-1 px-0.5 pt-0.5">
        <span className="line-clamp-2 text-[13px] leading-tight font-semibold [@media(max-height:500px)]:line-clamp-1 [@media(max-height:500px)]:text-xs">
          {name}
        </span>
        <span className="flex flex-wrap items-center justify-between gap-1">
          {state}
          {premium ? (
            <span
              className="border-gold-deep from-gold-light to-gold text-ink-on-gold rounded-full border bg-gradient-to-b px-1.5 py-0.5 text-[10px] leading-none font-black"
              data-testid="bazaar-premium"
            >
              {tr("bazaar.premium")}
            </span>
          ) : null}
        </span>
      </span>
    </GridListItem>
  );
};

/**
 * The grid of a Cosmetic family: the Standard look first, then the Bazaar
 * items. It is a React Aria grid: the arrow keys move and show the next look
 * in the Inspector, and a press shows the look. A tile has no button. The one
 * Buy or Use is in the Inspector.
 */
export const LookTiles = ({
  family,
  items,
  shownId,
  activeId,
  owned,
  heynstones,
  classId,
  sold,
  onShow,
  ref,
}: {
  readonly family: LookFamily;
  readonly items: readonly Cosmetic[];
  readonly shownId: CosmeticId | null;
  readonly activeId: CosmeticId | null;
  readonly owned: readonly CosmeticId[];
  readonly heynstones: number;
  readonly classId: ClassId;
  /** The look that the Player bought last, for the stamp on its tile. */
  readonly sold: CosmeticId | null;
  readonly onShow: (look: CosmeticId | null) => void;
  readonly ref?: Ref<HTMLDivElement>;
}) => {
  const { tr } = useGameText();
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const ownedText = tr("bazaar.owned");
  const inUseState = (
    <TileState
      mark={<CheckMark className="text-ready-gold" />}
      text={tr("bazaar.inUse")}
      className="text-ready-gold"
    />
  );
  return (
    <GridList
      ref={ref}
      aria-label={tr(`bazaar.families.${family}`)}
      layout="grid"
      selectionMode="single"
      selectionBehavior="replace"
      disallowEmptySelection
      selectedKeys={[shownId ?? STANDARD_TILE]}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          return;
        }
        const [key] = keys;
        if (key === STANDARD_TILE) {
          onShow(null);
          return;
        }
        const item = items.find((entry) => entry.id === key);
        if (item) {
          onShow(item.id);
        }
      }}
      className={cn(
        "grid min-h-0 flex-1 auto-rows-max grid-cols-3 gap-2.5 overflow-y-auto overscroll-contain p-3 outline-none",
        "[scrollbar-width:thin] [scrollbar-color:var(--color-wood-light)_transparent]",
        "[--look:6.8px] min-[1600px]:[--look:9.5px] [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:p-2 [@media(max-height:500px)]:[--look:4.6px]"
      )}
      data-testid="bazaar-tiles"
      data-family={family}
      style={cssVars({ "--bazaar-owned": BAZAAR_COLORS.ownedGreen })}
    >
      <LookTile
        id={STANDARD_TILE}
        family={family}
        name={tr(`bazaar.standard.${family}`)}
        active={activeId === null}
        premium={false}
        look={<TileLook family={family} look={null} classId={classId} />}
        state={
          activeId === null ? (
            inUseState
          ) : (
            <TileState
              text={tr("bazaar.alwaysYours")}
              className="text-cream-dim"
            />
          )
        }
        testId="cosmetic-standard"
      />
      {items.map((item) => {
        const isOwned = ownedSet.has(item.id);
        const active = item.id === activeId;
        const canPay = canBuyCosmetic(item, owned, heynstones);
        const isSold = item.id === sold;
        return (
          <LookTile
            key={item.id}
            id={item.id}
            family={family}
            name={tr(`bazaar.items.${cosmeticItemKey(item.id)}`)}
            active={active}
            premium={item.premium === true}
            look={<TileLook family={family} look={item.id} classId={classId} />}
            state={
              active ? (
                inUseState
              ) : isOwned ? (
                <TileState
                  mark={<CheckMark className="text-(--bazaar-owned)" />}
                  text={ownedText}
                  className="text-(--bazaar-owned)"
                  stamped={isSold}
                />
              ) : (
                <TileState
                  mark={
                    <BalanceIcon
                      kind="heynstones"
                      className="size-3.5 shrink-0"
                    />
                  }
                  text={
                    <>
                      <span aria-hidden>{item.price}</span>
                      <span className="sr-only">
                        {tr("bazaar.price", { amount: item.price ?? 0 })}
                      </span>
                    </>
                  }
                  className={canPay ? "text-gold-light" : "text-cream-dim"}
                />
              )
            }
            testId="bazaar-item"
            cosmeticId={item.id}
            owned={isOwned}
          />
        );
      })}
    </GridList>
  );
};
