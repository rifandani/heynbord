import { getCard } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useState } from "react";

import { RankGems } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { RANK_COLORS } from "@/features/battle/palette";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import type { Forming } from "@/features/workshop/components/panel-parts";
import {
  CardPreview,
  Essence,
  PanelHeader,
  panelClassName,
  StationEdge,
} from "@/features/workshop/components/panel-parts";
import type { CraftState, WorkshopTile } from "@/features/workshop/workshop";
import { craftState, craftTimeline } from "@/features/workshop/workshop";

/**
 * The direction of the Craft: three chevrons from the Essence to the copy.
 * They are lit when the Essence is enough.
 */
const Flow = ({ lit }: { readonly lit: boolean }) => (
  <svg
    viewBox="0 0 36 16"
    className={cn(
      "h-4 w-9 shrink-0 [@media(max-height:500px)]:h-3 [@media(max-height:500px)]:w-6",
      lit ? "text-[#ffe08a]" : "text-[#e8d9bb]/40"
    )}
    aria-hidden
  >
    {[2, 13, 24].map((x, index) => (
      <path
        key={x}
        d={`M${x} 2 L${x + 7} 8 L${x} 14`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45 + index * 0.275}
      />
    ))}
  </svg>
);

/**
 * The recipe of a Craft, read from left to right: the Essence, the direction,
 * and the 1 Base Rank copy. The Essence number is the largest text: the
 * Player plans with it (The Big Number Rule).
 */
const CraftRecipe = ({
  cost,
  rank,
  lit,
  label,
}: {
  readonly cost: number | null;
  readonly rank: WorkshopTile["rank"];
  readonly lit: boolean;
  readonly label: string | null;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- an image of a recipe: the label says it, the parts are hidden
      role="img"
      aria-label={label ?? undefined}
      aria-hidden={label === null}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 border-[#e9c46a]/35 bg-[#3a2a1c] px-3 py-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.55)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:py-1",
        !lit && "opacity-80"
      )}
      data-testid="workshop-craft-recipe"
    >
      <span className="flex items-center gap-1 text-2xl leading-none font-black text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-sm">
        <BalanceIcon
          kind="essence"
          className="size-7 shrink-0 [@media(max-height:500px)]:size-4"
        />
        {cost === null ? null : format(cost)}
      </span>
      <Flow lit={lit} />
      <span className="ml-auto flex min-w-0 items-center gap-1.5">
        {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the gem size (em); the gems have no text */}
        <span className="text-[10px] [@media(max-height:500px)]:text-[7px]">
          <RankGems rank={rank} />
        </span>
        <span
          className="text-sm leading-tight font-bold [@media(max-height:500px)]:text-[10px]"
          style={{ color: RANK_COLORS[rank] }}
        >
          {tr("workshop.craftPanel.gives", { rank: tr(`ranks.${rank}`) })}
        </span>
      </span>
    </div>
  );
};

/**
 * The action part of the Craft panel: the Essence now and after the Craft, and
 * the gold Craft, or the lock chip below the Craft level.
 */
const CraftAction = ({
  state,
  essence,
  rankName,
  onCraft,
}: {
  readonly state: CraftState;
  readonly essence: number;
  readonly rankName: string;
  readonly onCraft: () => void;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  if (state.kind === "none") {
    return null;
  }
  return (
    <>
      {state.kind === "ready" || state.kind === "essence" ? (
        <p
          className="text-xs font-semibold text-[#e8d9bb] tabular-nums [@media(max-height:500px)]:text-[10px]"
          data-testid="workshop-craft-balance"
        >
          {state.kind === "ready"
            ? tr("workshop.craftPanel.after", {
                now: format(essence),
                after: format(essence - state.cost),
              })
            : tr("workshop.craftPanel.short", {
                now: format(essence),
                missing: format(state.missing),
              })}
        </p>
      ) : null}
      {state.kind === "locked" ? (
        <span
          className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#e9c46a]/50 bg-[#1c140e] px-3 py-2 text-sm font-bold text-[#e8d9bb] [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:text-[11px]"
          data-testid="workshop-craft-locked"
        >
          <GlyphIcon glyph="lock" className="size-4 text-[#e9c46a]" />
          {tr("town.opensAtLevel", { level: state.level })}
        </span>
      ) : null}
      {state.kind === "ready" || state.kind === "essence" ? (
        <GameButton
          intent="gold"
          isDisabled={state.kind !== "ready"}
          onPress={onCraft}
          aria-label={
            state.kind === "ready"
              ? tr("workshop.craftLabel", {
                  rank: rankName,
                  essence: format(state.cost),
                })
              : tr("workshop.craftNeedLabel", {
                  rank: rankName,
                  essence: format(state.missing),
                })
          }
          className="w-full gap-2 leading-none [@media(max-height:500px)]:min-h-7 [@media(max-height:500px)]:text-xs"
          data-testid="workshop-craft"
          data-state={state.kind}
        >
          <GlyphIcon glyph="forge" className="size-5 shrink-0" />
          <span className="font-display font-bold">
            {state.kind === "ready"
              ? tr("workshop.craft")
              : tr("workshop.need")}
          </span>
          <Essence
            amount={format(state.kind === "ready" ? state.cost : state.missing)}
          />
        </GameButton>
      ) : null}
    </>
  );
};

/**
 * True from a Craft until its copy is complete (`craftTimeline`): the panel
 * then counts the copy, with a hop. With reduced motion, the copy counts at
 * once.
 */
const useStillForming = (forming: Forming | null): boolean => {
  const [formed, setFormed] = useState<number | null>(null);
  useEffect(() => {
    if (!forming) {
      return;
    }
    const timer = window.setTimeout(
      () => setFormed(forming.serial),
      craftTimeline(forming.rank).formed
    );
    return () => window.clearTimeout(timer);
  }, [forming]);
  return (
    forming !== null && !prefersReducedMotion() && formed !== forming.serial
  );
};

/**
 * The Craft station panel (GDD 7.4): the card at its Base Rank, the copies
 * that the Player owns of it, and the recipe: the Essence, the direction, and
 * the 1 Base Rank copy that it makes. Under it, the Essence now and after the
 * Craft, and the one gold Craft. Below the Craft level, the recipe shows and
 * a lock chip takes the place of the Craft. A Craft sends the Essence drops
 * from the balance into the card, where the copy forms (`Forming`).
 */
export const CraftPanel = ({
  tile,
  essence,
  level,
  forming,
  onCraft,
}: {
  readonly tile: WorkshopTile;
  readonly essence: number;
  readonly level: number;
  readonly forming: Forming | null;
  readonly onCraft: () => void;
}) => {
  const { tr } = useGameText();
  const { format } = useCoinFormat();
  const card = getCard(tile.cardId);
  const base = card.baseRank;
  const state = craftState(card, level, essence);
  const owned = tile.copies[0]?.copies ?? 0;
  const rankName = tr(`ranks.${base}`);
  const formingHere = forming?.cardId === tile.cardId ? forming : null;
  // The new copy counts when it is complete, after the form.
  const shownOwned = useStillForming(formingHere) ? owned - 1 : owned;
  const cost =
    state.kind === "ready" || state.kind === "essence" ? state.cost : null;

  return (
    <section
      tabIndex={-1}
      aria-labelledby="workshop-card-name"
      className={panelClassName}
      data-testid="workshop-panel"
      data-station="craft"
      data-card={tile.cardId}
    >
      <StationEdge station="craft" />
      <PanelHeader
        cardId={tile.cardId}
        rank={base}
        preview={
          <CardPreview cardId={tile.cardId} rank={base} forming={formingHere} />
        }
      >
        <p
          className="flex items-center gap-1.5 rounded-lg border-2 border-[#e9c46a]/35 bg-[#3a2a1c]/80 px-2 py-1.5 text-sm font-bold [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:text-[11px]"
          aria-label={tr("workshop.rankCopies", {
            rank: rankName,
            count: owned,
          })}
          data-testid="workshop-craft-owned"
        >
          <span className="font-semibold text-[#e8d9bb]" aria-hidden>
            {tr("workshop.craftPanel.own")}
          </span>
          {/* oxlint-disable-next-line react-doctor/no-tiny-text -- the font size sets the gem size (em); the gems have no text */}
          <span className="ml-auto text-[10px] [@media(max-height:500px)]:text-[7px]">
            <RankGems rank={base} />
          </span>
          <span
            // A new element for each count, so that a change hops once, when
            // the copy is complete.
            key={shownOwned}
            className={cn(
              "font-black tabular-nums",
              shownOwned > 0 ? "text-[#fff6df]" : "text-[#e8d9bb]/55",
              "motion-safe:animate-[workshop-count_320ms_cubic-bezier(0.2,0.8,0.2,1)]"
            )}
            aria-hidden
            data-testid="workshop-copies-craft"
          >
            {tr("workshop.copies", { count: shownOwned })}
          </span>
        </p>
      </PanelHeader>
      <div className="flex min-w-0 flex-col gap-2 [@media(max-height:500px)]:flex-1 [@media(max-height:500px)]:justify-center [@media(max-height:500px)]:gap-1">
        {cost === null && state.kind !== "locked" ? (
          <p className="text-sm font-semibold text-[#e8d9bb]">
            {tr("workshop.craftPanel.none")}
          </p>
        ) : (
          <CraftRecipe
            cost={cost}
            rank={base}
            lit={state.kind === "ready"}
            label={
              cost === null
                ? null
                : tr("workshop.craftPanel.recipe", {
                    essence: format(cost),
                    rank: rankName,
                    name: tr(`cards.${tile.cardId}.name`),
                  })
            }
          />
        )}
        <CraftAction
          state={state}
          essence={essence}
          rankName={rankName}
          onCraft={onCraft}
        />
      </div>
    </section>
  );
};
