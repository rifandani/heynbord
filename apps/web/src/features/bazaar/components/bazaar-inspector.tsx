import type { ClassId, Cosmetic, CosmeticId } from "@workspace/rules";
import { cn } from "cn";
import { lazy, Suspense } from "react";

import { GameButton } from "@/core/components/game/game-button";
import { CardBack } from "@/features/battle/components/card-back";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import type {
  InspectorAction,
  LookFamily,
  ShelfLook,
} from "@/features/bazaar/bazaar";
import { cosmeticItemKey } from "@/features/bazaar/bazaar";
import { BoardSkinShelfLook } from "@/features/bazaar/components/board-skin-look";
import { GearLookShelfLook } from "@/features/bazaar/components/gear-look-icons";
import { BAZAAR_COLORS, BAZAAR_CSS, cssVars } from "@/features/bazaar/tokens";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";
import { BalanceIcon } from "@/features/town/components/balance-icon";

const HeroModelPreview = lazy(
  () => import("@/features/hero/components/hero-model-preview")
);

/**
 * The Hero Model on the stage (Hero Models, decision 12): a candidate portrait
 * wears the active Gear, and a candidate Gear goes on the active person. The
 * painted portrait stands in while the model loads or fails, so the stage
 * never loses its look.
 */
const StageModel = ({
  look,
  classId,
}: {
  readonly look: ShelfLook;
  readonly classId: ClassId;
}) => (
  <div
    className="size-full p-2 [@media(max-height:500px)]:p-1"
    data-testid="bazaar-inspector-preview"
    data-family={look.family}
  >
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <HeroPortrait
            id={look.portrait}
            classId={classId}
            className="h-full w-auto max-w-full"
          />
        </div>
      }
    >
      <HeroModelPreview
        classId={classId}
        appearance={{ portrait: look.portrait, gearLook: look.gearLook }}
      />
    </Suspense>
  </div>
);

/** The flat look on the stage. Each new look comes to rest in 180ms. */
const StageLook = ({
  family,
  look,
}: {
  readonly family: LookFamily;
  readonly look: CosmeticId | null;
}) => (
  <span
    key={look ?? "standard"}
    className="flex size-full items-center justify-center motion-safe:animate-[bazaar-look-in_180ms_cubic-bezier(0.2,0.8,0.2,1)]"
  >
    {family === "cardBack" ? (
      <span className="block [font-size:min(7cqh,9.8cqw)]" aria-hidden>
        <CardBack back={look} />
      </span>
    ) : (
      <BoardSkinShelfLook skin={look} />
    )}
  </span>
);

/** The chips at the top left of the stage. They never move the text. */
const CHIP =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-none font-black";
const GOLD_CHIP = `${CHIP} border-gold-deep from-gold-light to-gold text-ink-on-gold bg-gradient-to-b shadow-(--bazaar-chip)`;

/** The one action of the Inspector, or the "In use" plate in its place. */
const InspectorActionBar = ({
  action,
  name,
  useLabel,
  onBuy,
  onUse,
}: {
  readonly action: InspectorAction;
  readonly name: string;
  readonly useLabel: string;
  readonly onBuy: () => void;
  readonly onUse: () => void;
}) => {
  const { tr } = useGameText();
  if (action.kind === "inUse") {
    return (
      <p
        className="bg-plate-socket/60 text-ready-gold flex min-h-12 items-center justify-center gap-2 rounded-lg text-lg font-bold [@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:text-sm"
        data-testid="bazaar-inspector-in-use"
      >
        <GlyphIcon glyph="check" className="size-5 shrink-0" />
        {tr("bazaar.inUse")}
      </p>
    );
  }
  const buttonClass =
    "w-full [@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:text-sm";
  if (action.kind === "use") {
    return (
      <GameButton
        intent="gold"
        size="lg"
        className={buttonClass}
        onPress={onUse}
        aria-label={useLabel}
        data-testid="bazaar-inspector-action"
      >
        {tr("bazaar.use")}
      </GameButton>
    );
  }
  return (
    <>
      {action.kind === "needMore" ? (
        <p
          className="text-cream-dim mb-1.5 text-center text-xs font-semibold [@media(max-height:500px)]:mb-1 [@media(max-height:500px)]:text-[11px]"
          data-testid="bazaar-inspector-need"
        >
          {tr("bazaar.needMore", { amount: action.missing })}
        </p>
      ) : null}
      <GameButton
        intent="gold"
        size="lg"
        className={buttonClass}
        isDisabled={action.kind === "needMore"}
        onPress={onBuy}
        aria-label={tr("bazaar.buyLabel", { name, amount: action.price })}
        data-testid="bazaar-inspector-action"
      >
        {tr("bazaar.buy")}
        <span className="inline-flex items-center gap-1 tabular-nums">
          <BalanceIcon
            kind="heynstones"
            className="size-5 shrink-0 [@media(max-height:500px)]:size-4"
          />
          {action.price}
        </span>
      </GameButton>
    </>
  );
};

/**
 * The Inspector of the Bazaar: the right column of the shop panel. It shows
 * the look of the selected tile large on a lantern-lit stage: the Card Back or
 * the Board skin itself, or the Hero Model for a portrait and a Gear look.
 * Under the stage are the name, the flavor text and what the look changes.
 * The foot holds the one main action, so it stays in the same place for each
 * look. To show a look never changes the Active Cosmetic: only Use does.
 */
export const BazaarInspector = ({
  family,
  item,
  action,
  heroLook,
  classId,
  sold,
  onBuy,
  onUse,
}: {
  readonly family: LookFamily;
  /** The Bazaar item to show, or `null` for the Standard look of the family. */
  readonly item: Cosmetic | null;
  readonly action: InspectorAction;
  /** The Hero Model look, for the 2 families that a Hero Model shows. */
  readonly heroLook: ShelfLook | null;
  readonly classId: ClassId;
  /** True for one Buy: the sheen plays across the stage. */
  readonly sold: boolean;
  readonly onBuy: () => void;
  readonly onUse: () => void;
}) => {
  const { tr } = useGameText();
  const look = item?.id ?? null;
  const key = item === null ? null : cosmeticItemKey(item.id);
  const name =
    key === null ? tr(`bazaar.standard.${family}`) : tr(`bazaar.items.${key}`);
  const flavor =
    key === null
      ? tr(`bazaar.standardFlavor.${family}`)
      : tr(`bazaar.flavor.${key}`);
  const inUse = action.kind === "inUse";
  return (
    <section
      aria-label={tr(`bazaar.shelf.${family}`)}
      className="border-gold-trim/30 flex min-h-0 min-w-0 flex-col border-l p-3 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-2"
      style={cssVars({
        "--bazaar-dim": BAZAAR_COLORS.dim,
        "--bazaar-chip": BAZAAR_CSS.chip,
      })}
      data-testid="bazaar-inspector"
      data-family={family}
      data-look={look ?? "standard"}
      data-in-use={inUse || undefined}
    >
      <div
        className="bg-plate-socket/60 [container-type:size] relative min-h-[46%] flex-1 overflow-hidden rounded-xl [@media(max-height:500px)]:min-h-[60%]"
        style={{ backgroundImage: BAZAAR_CSS.stage }}
        data-testid="bazaar-stage"
      >
        {heroLook === null ? (
          <StageLook family={family} look={look} />
        ) : (
          <StageModel look={heroLook} classId={classId} />
        )}
        <span className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1">
          {item?.premium ? (
            <span className={GOLD_CHIP} data-testid="bazaar-inspector-premium">
              {tr("bazaar.premium")}
            </span>
          ) : null}
        </span>
        {sold ? (
          <span
            className="pointer-events-none absolute inset-0 opacity-0 motion-safe:animate-[bazaar-sold_640ms_ease-out]"
            style={{ backgroundImage: BAZAAR_CSS.sheen }}
            data-testid="bazaar-sold"
            aria-hidden
          />
        ) : null}
      </div>
      {family === "gearLook" ? (
        <div className="shrink-0 pt-2 [@media(max-height:500px)]:pt-0">
          <GearLookShelfLook look={look} />
        </div>
      ) : null}
      <div
        className={cn(
          "min-h-0 shrink overflow-y-auto overscroll-contain px-0.5 pt-3 [@media(max-height:500px)]:pt-0.5",
          "[scrollbar-width:thin] [scrollbar-color:var(--color-wood-light)_transparent]"
        )}
      >
        <h2
          className="font-display text-gold-light text-xl leading-tight font-bold text-balance [@media(max-height:500px)]:text-sm"
          data-testid="bazaar-inspector-name"
        >
          {name}
        </h2>
        <p className="text-cream mt-1.5 text-sm leading-snug text-pretty [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:text-[11px]">
          {flavor}
        </p>
        <p className="mt-1.5 text-xs leading-snug text-pretty text-(--bazaar-dim) [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:text-[11px]">
          {key === null
            ? tr("bazaar.alwaysYours")
            : tr(`bazaar.effect.${family}`)}
        </p>
      </div>
      <div
        className="shrink-0 pt-3 [@media(max-height:500px)]:pt-0.5"
        data-testid="bazaar-inspector-foot"
      >
        <InspectorActionBar
          action={action}
          name={name}
          useLabel={
            key === null
              ? tr(`bazaar.useStandard.${family}`)
              : tr("bazaar.useLabel", { name })
          }
          onBuy={onBuy}
          onUse={onUse}
        />
      </div>
    </section>
  );
};
