import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { RankId } from "@workspace/rules";
import { EXTRACT_ESSENCE, getCard } from "@workspace/rules";
import { cn } from "cn";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TabPanel, Tabs } from "react-aria-components";

import type { SoundName } from "@/features/battle/battle-audio";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import { PoolFilters } from "@/features/deck/components/pool-filters";
import type { PoolFilter } from "@/features/deck/deck";
import { DEFAULT_POOL_FILTER } from "@/features/deck/deck";
import { deckSlotsAtom } from "@/features/deck/deck.atoms";
import { shownHintAtom } from "@/features/hint/hint.atoms";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { CombinePanel } from "@/features/workshop/components/combine-panel";
import { CraftPanel } from "@/features/workshop/components/craft-panel";
import type { Flight } from "@/features/workshop/components/essence-flight";
import {
  EssenceFlight,
  measureFlight,
} from "@/features/workshop/components/essence-flight";
import type { ExtractRequest } from "@/features/workshop/components/extract-dialog";
import { ExtractDialog } from "@/features/workshop/components/extract-dialog";
import { ExtractPanel } from "@/features/workshop/components/extract-panel";
import type {
  Burst,
  Extraction,
  Forming,
} from "@/features/workshop/components/panel-parts";
import {
  ReadyToggle,
  StationTabs,
} from "@/features/workshop/components/station-tabs";
import { WorkshopGrid } from "@/features/workshop/components/workshop-grid";
import { WorkshopScene } from "@/features/workshop/components/workshop-scene";
import { useCountTo } from "@/features/workshop/use-count-to";
import { useWorkshop } from "@/features/workshop/use-workshop";
import type {
  Station,
  StationContext,
  WorkshopTile,
} from "@/features/workshop/workshop";
import {
  craftLock,
  craftTimeline,
  emptyGridText,
  extractNeedsConfirm,
  extractTimeline,
  isTileReady,
  nextRank,
  selectedTile,
  STATIONS,
  stationCounts,
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

/** At most this many Extracts fly at one time; an older one stops. */
const MAX_FLIGHTS = 4;

/**
 * The sounds of the Workshop. A Combine: the anvil, then the chime of a
 * Rare+ copy. A Craft: the glass note when the Essence leaves the balance,
 * then the anvil and the chime of a Rare+ copy when the copy is complete. An
 * Extract: the melt, the chime of a Rare+ copy when the melt starts, and the
 * glass note when the first Essence drop gets to the balance. With reduced
 * motion, they all play at the press.
 */
const useWorkshopSounds = () => {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  const later = (ms: number, sound: SoundName) => {
    if (ms <= 0 || prefersReducedMotion()) {
      playSound(sound, 0);
      return;
    }
    timers.current.push(window.setTimeout(() => playSound(sound, 0), ms));
  };
  return {
    anvil: (rank: RankId) => {
      unlockAudio();
      playSound("anvil", 0);
      const chime = RANK_CHIME[rank];
      if (chime) {
        later(FACE_MS, chime);
      }
    },
    craft: (rank: RankId) => {
      unlockAudio();
      playSound("essenceIn", 0);
      const { formed } = craftTimeline(rank);
      later(formed, "anvil");
      const chime = RANK_CHIME[rank];
      if (chime) {
        later(formed, chime);
      }
    },
    extract: (rank: RankId) => {
      unlockAudio();
      playSound("extract", 0);
      const { meltAt, firstArrival } = extractTimeline(rank);
      const chime = RANK_CHIME[rank];
      if (chime) {
        later(meltAt, chime);
      }
      later(firstArrival, "essenceIn");
    },
  };
};

/** No station keeps its cards only at the start. */
const NO_READY_FILTER: Readonly<Record<Station, boolean>> = {
  combine: false,
  craft: false,
  extract: false,
};

/** The width of the work area: the tabs, the grid and the panel. */
const WORK_WIDTH = cn(
  "left-1/2 w-[min(calc(100vw-1.5rem),max(72vw,108dvh,1000px))] -translate-x-1/2",
  "[@media(max-height:500px)]:w-[calc(100vw-max(0.5rem,env(safe-area-inset-left))-max(0.5rem,env(safe-area-inset-right)))]"
);

/** The grid plate: the filters and the grid. */
const GridPlate = ({
  station,
  filter,
  onFilter,
  tiles,
  context,
  selected,
  onSelect,
  emptyText,
  onShowAll,
}: {
  readonly station: Station;
  readonly filter: PoolFilter;
  readonly onFilter: (filter: PoolFilter) => void;
  readonly tiles: readonly WorkshopTile[];
  readonly context: StationContext;
  readonly selected: string | null;
  readonly onSelect: (cardId: string) => void;
  readonly emptyText: string;
  readonly onShowAll: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <section
      aria-labelledby="workshop-grid-title"
      className={cn(
        PLATE,
        "max-h-full min-h-0 min-w-0 flex-1 flex-col gap-2 p-3 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-1.5"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 [@media(max-height:500px)]:gap-x-2 [@media(max-height:500px)]:gap-y-1">
        {/* The title stays for screen readers: it names the section. */}
        <h2 id="workshop-grid-title" className="sr-only">
          {tr("workshop.grid")}
        </h2>
        <PoolFilters
          filter={filter}
          onFilter={onFilter}
          tone="night"
          ownershipText={(ownership) => tr(`workshop.ownership.${ownership}`)}
        />
      </div>
      <WorkshopGrid
        tiles={tiles}
        station={station}
        context={context}
        selected={selected}
        onSelect={onSelect}
        filter={filter}
        emptyText={emptyText}
        onShowAll={onShowAll}
      />
    </section>
  );
};

/** The panel of the selected station for the selected card. */
const StationPanel = ({
  station,
  tile,
  coin,
  essence,
  level,
  burst,
  extraction,
  forming,
  onCombine,
  onCraft,
  onExtract,
}: {
  readonly station: Station;
  readonly tile: WorkshopTile;
  readonly coin: number;
  readonly essence: number;
  readonly level: number;
  readonly burst: Burst | null;
  readonly extraction: Extraction | null;
  readonly forming: Forming | null;
  readonly onCombine: (rank: RankId) => boolean;
  readonly onCraft: () => void;
  readonly onExtract: (rank: RankId) => void;
}) => {
  if (station === "craft") {
    return (
      <CraftPanel
        tile={tile}
        essence={essence}
        level={level}
        forming={forming}
        onCraft={onCraft}
      />
    );
  }
  if (station === "extract") {
    return (
      <ExtractPanel tile={tile} extraction={extraction} onExtract={onExtract} />
    );
  }
  return (
    <CombinePanel tile={tile} coin={coin} burst={burst} onCombine={onCombine} />
  );
};

/**
 * The Workshop screen (GDD 7.4): three stations, one for each action. The
 * station tabs are at the top of the work area: Combine, Craft and Extract.
 * Under them, the grid of Discovered cards with the filters of the Deck
 * builder at the left, and the panel of the station for the selected card at
 * the right. The grid keeps its order in all the stations; the station marks
 * the cards that it can act on and darkens the others, and its ready filter
 * keeps only them. The selected card stays when the station changes. The
 * Workshop opens on Combine, or on Craft while the Craft Hint shows.
 *
 * Each station has its own direction. A Combine turns the panel card over to
 * the new copy with the Rank burst and the anvil sound, and the Coin counts
 * down. A Craft sends Essence drops from the balance into the panel card,
 * where the copy forms from the bottom up. An Extract lifts the copy off the
 * panel card and melts it into Essence drops that fly to the Essence balance.
 * An Extract of a copy that a saved Deck uses, or of an Epic or Legendary
 * copy, asks first.
 */
export const WorkshopScreen = () => {
  const { tr, text } = useGameText();
  const registry = useContext(RegistryContext);
  const workshop = useWorkshop();
  const slots = useAtomValue(deckSlotsAtom);
  // The Craft Hint points at the Workshop: then the Workshop opens on Craft.
  const [station, setStation] = useState<Station>(() =>
    registry.get(shownHintAtom) === "craft" ? "craft" : "combine"
  );
  const [readyOnly, setReadyOnly] = useState(NO_READY_FILTER);
  const [filter, setFilter] = useState<PoolFilter>(DEFAULT_POOL_FILTER);
  const [selected, setSelected] = useState<string | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [forming, setForming] = useState<Forming | null>(null);
  const [flights, setFlights] = useState<readonly Flight[]>([]);
  // The number of Extracts and Crafts in this visit: each one has its own
  // drops and its own melt or form.
  const serials = useRef(0);
  // The Essence counts up when the first drop of an Extract gets to it, and
  // down at once when a Craft takes it.
  const [essenceDelay, setEssenceDelay] = useState(0);
  const [request, setRequest] = useState<ExtractRequest | null>(null);
  const [said, setSaid] = useState("");
  const sounds = useWorkshopSounds();
  const coin = useCountTo(workshop.coin);
  const essence = useCountTo(workshop.essence, essenceDelay);
  const landed = useCallback((serial: number) => {
    setFlights((current) => current.filter((item) => item.serial !== serial));
  }, []);

  const context: StationContext = useMemo(
    () => ({
      coin: workshop.coin,
      essence: workshop.essence,
      level: workshop.level,
    }),
    [workshop.coin, workshop.essence, workshop.level]
  );
  const found = useMemo(
    () => workshopTiles(workshop.collection, filter, slots),
    [workshop.collection, filter, slots]
  );
  const ready = readyOnly[station];
  // The selected card stays in the grid while its station acts on it, so
  // that the panel does not change to another card after its last pair.
  const tiles = useMemo(
    () =>
      ready
        ? found.filter(
            (item) =>
              item.cardId === selected || isTileReady(item, station, context)
          )
        : found,
    [found, ready, station, context, selected]
  );
  const counts = useMemo(
    () =>
      stationCounts(
        workshopTiles(workshop.collection, DEFAULT_POOL_FILTER, slots),
        context
      ),
    [workshop.collection, slots, context]
  );
  const tile = selectedTile(tiles, selected);

  const quiet = () => {
    setBurst(null);
    setExtraction(null);
    setForming(null);
  };

  const select = (cardId: string) => {
    setSelected(cardId);
    quiet();
  };

  const changeStation = (next: Station) => {
    setStation(next);
    quiet();
  };

  const name = (cardId: string) => tr(`cards.${cardId}.name`);

  const nextSerial = () => {
    serials.current += 1;
    return serials.current;
  };

  const onCombine = (rank: RankId): boolean => {
    const to = nextRank(rank);
    if (!tile || to === null || !workshop.combine(tile.cardId, rank)) {
      return false;
    }
    setSelected(tile.cardId);
    sounds.anvil(to);
    setExtraction(null);
    setBurst((current) => ({
      cardId: tile.cardId,
      rank: to,
      serial: (current?.serial ?? 0) + 1,
    }));
    setSaid(
      tr("workshop.done.combine", {
        name: name(tile.cardId),
        rank: tr(`ranks.${to}`),
      })
    );
    return true;
  };

  const onCraft = () => {
    if (!tile) {
      return;
    }
    const { baseRank } = getCard(tile.cardId);
    const serial = nextSerial();
    // Read the places of the drops before the panel changes.
    const flight = prefersReducedMotion()
      ? null
      : measureFlight(baseRank, serial, "in");
    setEssenceDelay(0);
    if (!workshop.craft(tile.cardId)) {
      return;
    }
    sounds.craft(baseRank);
    setSelected(tile.cardId);
    setForming({ cardId: tile.cardId, rank: baseRank, serial });
    if (flight) {
      setFlights((current) => [...current.slice(1 - MAX_FLIGHTS), flight]);
    }
    setSaid(
      tr("workshop.done.craft", {
        name: name(tile.cardId),
        rank: tr(`ranks.${baseRank}`),
      })
    );
  };

  const extractNow = ({ cardId, rank }: ExtractRequest) => {
    const serial = nextSerial();
    // Read the places of the drops before the panel changes.
    const flight = prefersReducedMotion()
      ? null
      : measureFlight(rank, serial, "out");
    setEssenceDelay(flight ? extractTimeline(rank).firstArrival : 0);
    if (!workshop.extract(cardId, rank)) {
      return;
    }
    sounds.extract(rank);
    setExtraction({ cardId, rank, serial });
    if (flight) {
      setFlights((current) => [...current.slice(1 - MAX_FLIGHTS), flight]);
    }
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
      data-station={station}
    >
      {/* The Workshop inside (Town Concepts, section 10). */}
      <WorkshopScene />
      <BalancePlate
        balances={{ coin, essence, heynstones: workshop.balances.heynstones }}
      />
      <Tabs
        selectedKey={station}
        onSelectionChange={(key) => {
          const next = STATIONS.find((id) => id === key);
          if (next) {
            changeStation(next);
          }
        }}
      >
        {/* The tabs sit on the top edge of the work area, at its left, as
            folder tabs above the grid. The Balance Plate keeps the right. */}
        <div
          className={cn(
            "pointer-events-none absolute top-[max(0.5rem,env(safe-area-inset-top))] flex items-center gap-2 [@media(max-height:500px)]:gap-1.5",
            WORK_WIDTH
          )}
        >
          <StationTabs counts={counts} craftLock={craftLock(workshop.level)} />
          <ReadyToggle
            station={station}
            isSelected={ready}
            onChange={(on) =>
              setReadyOnly((current) => ({ ...current, [station]: on }))
            }
          />
        </div>
        {/* The grid and the panel stand in front of the calm wall of the
            painting (Town Concepts 10.2): about 72% of the painting width,
            centered, so that a wide screen shows the smith and the goblin
            tinker. A phone in landscape uses the full width. The work area
            is the panel of the selected tab; it stays mounted when the
            station changes, so the grid keeps its scroll. */}
        <TabPanel
          key="work"
          id={station}
          className={cn(
            "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+4rem)] bottom-[92px] flex items-start gap-3 outline-none",
            WORK_WIDTH,
            "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:gap-2"
          )}
        >
          <GridPlate
            station={station}
            filter={filter}
            onFilter={setFilter}
            tiles={tiles}
            context={context}
            selected={tile?.cardId ?? null}
            onSelect={select}
            emptyText={text(
              emptyGridText(workshop.collection, filter, ready ? station : null)
            )}
            onShowAll={() => {
              setFilter(DEFAULT_POOL_FILTER);
              setReadyOnly((current) => ({ ...current, [station]: false }));
            }}
          />
          {tile ? (
            <StationPanel
              key={`${station}:${tile.cardId}`}
              station={station}
              tile={tile}
              coin={workshop.coin}
              essence={workshop.essence}
              level={workshop.level}
              burst={burst}
              extraction={extraction}
              forming={forming}
              onCombine={onCombine}
              onCraft={onCraft}
              onExtract={onExtract}
            />
          ) : null}
        </TabPanel>
      </Tabs>
      {flights.map((flight) => (
        <EssenceFlight key={flight.serial} flight={flight} onDone={landed} />
      ))}
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
