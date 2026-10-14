import { useAtomValue } from "@effect/atom-react";
import type { RankId } from "@workspace/rules";
import { EXTRACT_ESSENCE, getCard } from "@workspace/rules";
import { cn } from "cn";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SoundName } from "@/features/battle/battle-audio";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { useGameText } from "@/features/battle/use-game-text";
import { PoolFilters } from "@/features/deck/components/pool-filters";
import type { PoolFilter } from "@/features/deck/deck";
import { DEFAULT_POOL_FILTER } from "@/features/deck/deck";
import { deckSlotsAtom } from "@/features/deck/deck.atoms";
import { BalancePlate } from "@/features/town/components/balance-plate";
import type { ExtractRequest } from "@/features/workshop/components/extract-dialog";
import { ExtractDialog } from "@/features/workshop/components/extract-dialog";
import type { Burst } from "@/features/workshop/components/rank-panel";
import { RankPanel } from "@/features/workshop/components/rank-panel";
import { WorkshopGrid } from "@/features/workshop/components/workshop-grid";
import { WorkshopScene } from "@/features/workshop/components/workshop-scene";
import { useCountTo } from "@/features/workshop/use-count-to";
import { useWorkshop } from "@/features/workshop/use-workshop";
import {
  emptyGridText,
  extractNeedsConfirm,
  nextRank,
  selectedTile,
  workshopTiles,
} from "@/features/workshop/workshop";

/** The HUD plate (DESIGN.md, HUD plate). */
const PLATE =
  "flex rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/** The chime of a new Rare, Epic or Legendary copy, as in the Pack reveal. */
const RANK_CHIME: Readonly<Partial<Record<RankId, SoundName>>> = {
  rare: "revealRare",
  epic: "revealEpic",
  legendary: "revealLegendary",
};

/** The face of the card shows at this time of its turn: the chime plays then. */
const FACE_MS = 200;

/** The sounds of a new copy: the anvil, then the chime of a Rare+ copy. */
const useAnvilSounds = () => {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  return (rank: RankId) => {
    unlockAudio();
    playSound("anvil", 0);
    const chime = RANK_CHIME[rank];
    if (chime) {
      timers.current.push(
        window.setTimeout(() => playSound(chime, 0), FACE_MS)
      );
    }
  };
};

/**
 * The Workshop screen (GDD 7.4, "Anvil Ladder"): the grid of Discovered
 * cards with the filters of the Deck builder at the left, and the Rank panel
 * of the selected card at the right. Combine, Extract and Craft are single
 * actions. A Combine or a Craft turns the panel card over to the new copy with
 * the Rank burst and the anvil sound, and the Coin counts down; an Extract
 * makes the Essence count up. An Extract of a copy that a saved Deck uses, or
 * of an Epic or Legendary copy, asks first.
 */
export const WorkshopScreen = () => {
  const { tr, text } = useGameText();
  const workshop = useWorkshop();
  const slots = useAtomValue(deckSlotsAtom);
  const [filter, setFilter] = useState<PoolFilter>(DEFAULT_POOL_FILTER);
  const [selected, setSelected] = useState<string | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [request, setRequest] = useState<ExtractRequest | null>(null);
  const [said, setSaid] = useState("");
  const anvil = useAnvilSounds();
  const coin = useCountTo(workshop.coin);
  const essence = useCountTo(workshop.essence);

  const tiles = useMemo(
    () => workshopTiles(workshop.collection, filter),
    [workshop.collection, filter]
  );
  const tile = selectedTile(tiles, selected);

  const select = (cardId: string) => {
    setSelected(cardId);
    setBurst(null);
  };

  const showNewCopy = (cardId: string, rank: RankId) => {
    anvil(rank);
    setBurst((current) => ({
      cardId,
      rank,
      serial: (current?.serial ?? 0) + 1,
    }));
  };

  const name = (cardId: string) => tr(`cards.${cardId}.name`);

  const onCombine = (rank: RankId): boolean => {
    const to = nextRank(rank);
    if (!tile || to === null || !workshop.combine(tile.cardId, rank)) {
      return false;
    }
    setSelected(tile.cardId);
    showNewCopy(tile.cardId, to);
    setSaid(
      tr("workshop.done.combine", {
        name: name(tile.cardId),
        rank: tr(`ranks.${to}`),
      })
    );
    return true;
  };

  const onCraft = (): boolean => {
    if (!tile || !workshop.craft(tile.cardId)) {
      return false;
    }
    const { baseRank } = getCard(tile.cardId);
    setSelected(tile.cardId);
    showNewCopy(tile.cardId, baseRank);
    setSaid(
      tr("workshop.done.craft", {
        name: name(tile.cardId),
        rank: tr(`ranks.${baseRank}`),
      })
    );
    return true;
  };

  const extractNow = ({ cardId, rank }: ExtractRequest) => {
    if (!workshop.extract(cardId, rank)) {
      return;
    }
    unlockAudio();
    playSound("select", 0);
    setSelected(cardId);
    setSaid(
      tr("workshop.done.extract", {
        name: name(cardId),
        rank: tr(`ranks.${rank}`),
        essence: EXTRACT_ESSENCE[rank],
      })
    );
  };

  const onExtract = (rank: RankId) => {
    if (!tile) {
      return;
    }
    const decks = workshop.decksUsing(tile.cardId, rank);
    const next = { cardId: tile.cardId, rank, decks };
    if (extractNeedsConfirm(rank, decks)) {
      setRequest(next);
    } else {
      extractNow(next);
    }
  };

  return (
    <main
      aria-label={tr("workshop.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="workshop"
    >
      {/* The Workshop inside (Town Concepts, section 10). */}
      <WorkshopScene />
      <BalancePlate
        balances={{ coin, essence, heynstones: workshop.balances.heynstones }}
      />
      {/* The grid and the panel stand in front of the calm wall of the
          painting (Town Concepts 10.2): about 72% of the painting width,
          centered, so that a wide screen shows the smith and the goblin
          tinker. A phone in landscape uses the full width. */}
      <div
        className={cn(
          "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+3.5rem)] bottom-[92px] left-1/2 flex w-[min(calc(100vw-1.5rem),max(72vw,108dvh,1000px))] -translate-x-1/2 items-start gap-3",
          "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:w-[calc(100vw-max(0.5rem,env(safe-area-inset-left))-max(0.5rem,env(safe-area-inset-right)))] [@media(max-height:500px)]:gap-2"
        )}
      >
        <section
          aria-labelledby="workshop-grid-title"
          className={cn(
            PLATE,
            "max-h-full min-h-0 min-w-0 flex-1 flex-col gap-2 p-3 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-1.5"
          )}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 [@media(max-height:500px)]:gap-x-2 [@media(max-height:500px)]:gap-y-1">
            <h2
              id="workshop-grid-title"
              className="font-display flex items-baseline gap-2 text-base font-bold text-[#ffe08a] [@media(max-height:500px)]:sr-only"
            >
              {tr("workshop.grid")}
              <span
                className="font-sans text-xs font-semibold text-[#e8d9bb] tabular-nums"
                data-testid="workshop-count"
              >
                {tr("workshop.count", { count: tiles.length })}
              </span>
            </h2>
            <PoolFilters
              filter={filter}
              onFilter={setFilter}
              tone="night"
              ownershipText={(ownership) =>
                tr(`workshop.ownership.${ownership}`)
              }
            />
          </div>
          <WorkshopGrid
            tiles={tiles}
            selected={tile?.cardId ?? null}
            onSelect={select}
            filter={filter}
            emptyText={text(emptyGridText(workshop.collection, filter))}
            onShowAll={() => setFilter(DEFAULT_POOL_FILTER)}
          />
        </section>
        {tile ? (
          <RankPanel
            key={tile.cardId}
            tile={tile}
            coin={workshop.coin}
            essence={workshop.essence}
            level={workshop.level}
            burst={burst}
            onCombine={onCombine}
            onExtract={onExtract}
            onCraft={onCraft}
          />
        ) : null}
      </div>
      <ExtractDialog
        request={request}
        slots={slots}
        onKeep={() => setRequest(null)}
        onExtract={(confirmed) => {
          setRequest(null);
          extractNow(confirmed);
        }}
      />
      <p className="sr-only" aria-live="polite" data-testid="workshop-said">
        {said}
      </p>
    </main>
  );
};
