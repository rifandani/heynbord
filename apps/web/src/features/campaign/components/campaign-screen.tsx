import { useAtom, useAtomValue } from "@effect/atom-react";
import { STAGES } from "@workspace/rules";
import type { CSSProperties, RefObject } from "react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import type { BattleOptions } from "@/features/battle/battle-session";
import { useGameText } from "@/features/battle/use-game-text";
import {
  seenOpenStageAtom,
  stageResultsAtom,
} from "@/features/campaign/campaign.atoms";
import {
  RegionBanner,
  StarChests,
} from "@/features/campaign/components/campaign-hud";
import { StageMarker } from "@/features/campaign/components/stage-marker";
import { StagePanel } from "@/features/campaign/components/stage-panel";
import { TrailLine } from "@/features/campaign/components/trail-line";
import type {
  Box,
  MapFrame,
  RegionMap,
  TrailStage,
  Viewport,
} from "@/features/campaign/region-map";
import {
  MAP,
  mapFrame,
  regionMap,
  regionStars,
  trailStages,
  walkedLegs,
} from "@/features/campaign/region-map";

/** The phone-in-landscape layout (DESIGN.md, The Short Screen Rule). */
const SHORT_SCREEN = "(max-height: 500px)";

/** The Town Bar height in pixels (DESIGN.md, Town Bar). */
const TOWN_BAR = { regular: 80, short: 56 } as const;

/** The space between a Stage Marker and the top edge of the screen. */
const TOP_EDGE = 8;

const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};

const readViewport = () =>
  `${window.innerWidth}x${window.innerHeight}x${window.matchMedia(SHORT_SCREEN).matches ? 1 : 0}`;

const toBox = (element: Element): Box => {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
};

/**
 * The screen size, the Town Bar, and the boxes of the HUD pieces in `root`
 * (`data-campaign-hud`). The `/play` route renders on the client only.
 */
const useViewport = (root: RefObject<HTMLElement | null>): Viewport => {
  const key = useSyncExternalStore(subscribe, readViewport);
  const [obstacles, setObstacles] = useState<readonly Box[]>([]);
  useLayoutEffect(() => {
    const pieces = [
      ...(root.current?.querySelectorAll("[data-campaign-hud]") ?? []),
    ];
    const measure = () => setObstacles(pieces.map(toBox));
    measure();
    // A size change of a piece, or of the screen, moves the pieces.
    const observer = new ResizeObserver(measure);
    for (const piece of pieces) {
      observer.observe(piece);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [root]);
  return useMemo(() => {
    const [width = 0, height = 0, short = 0] = key.split("x").map(Number);
    const bottom = short ? TOWN_BAR.short : TOWN_BAR.regular;
    return { width, height, top: TOP_EDGE, bottom, obstacles };
  }, [key, obstacles]);
};

/**
 * The edges of the painting fade into the backdrop on a side where the
 * painting does not reach the screen edge.
 */
const fade = (side: boolean) => (side ? "transparent" : "black");

const paintingMask = (
  frame: MapFrame,
  viewport: Viewport
): CSSProperties | undefined => {
  const width = MAP.width * frame.scale;
  const height = MAP.height * frame.scale;
  const left = frame.x > 0.5;
  const right = frame.x + width < viewport.width - 0.5;
  const top = frame.y > 0.5;
  const bottom = frame.y + height < viewport.height - 0.5;
  if (!(left || right || top || bottom)) {
    return undefined;
  }
  const mask = [
    `linear-gradient(to right, ${fade(left)}, black 6%, black 94%, ${fade(right)})`,
    `linear-gradient(to bottom, ${fade(top)}, black 6%, black 94%, ${fade(bottom)})`,
  ].join(", ");
  return {
    maskImage: mask,
    WebkitMaskImage: mask,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  };
};

/** The wake-up of a newly opened Stage Marker, with its delay. */
const AWAKEN_MS = 1700;

/**
 * The Open Stage wakes up once when the Campaign first shows it after a win.
 * Returns the ID of the Stage that wakes up now.
 */
const useAwakenedStage = (trail: readonly TrailStage[]) => {
  const open = trail.find((stop) => stop.state === "open")?.stage.id ?? null;
  const [seen, setSeen] = useAtom(seenOpenStageAtom);
  const [awaken, setAwaken] = useState(() =>
    seen !== null && open !== seen ? open : null
  );
  useEffect(() => {
    setSeen(open);
  }, [open, setSeen]);
  useEffect(() => {
    if (awaken === null) {
      return;
    }
    const timer = setTimeout(() => setAwaken(null), AWAKEN_MS);
    return () => clearTimeout(timer);
  }, [awaken]);
  return awaken;
};

const preloadBattleCanvas = () =>
  import("@/features/battle/scene/battle-canvas");

/** The painted map, the Trail and the Stage Markers. */
const RegionCanvas = ({
  map,
  trail,
  selected,
  awaken,
  onOpen,
  root,
}: {
  readonly map: RegionMap;
  readonly trail: readonly TrailStage[];
  readonly selected: string | null;
  readonly awaken: string | null;
  readonly onOpen: (stop: TrailStage, from: Element) => void;
  readonly root: RefObject<HTMLElement | null>;
}) => {
  const { tr } = useGameText();
  const viewport = useViewport(root);
  const frame = mapFrame(map, viewport);
  const { scale } = frame;
  return (
    <>
      {/* The backdrop: the same painting, soft, behind any side that the map does not cover. */}
      <img
        src={map.image}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-[0.72] saturate-[0.9] select-none"
        aria-hidden
      />
      <div
        className="absolute"
        style={{
          left: frame.x,
          top: frame.y,
          width: MAP.width * scale,
          height: MAP.height * scale,
          ...paintingMask(frame, viewport),
        }}
      >
        <img
          src={map.image}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full select-none"
        />
        <TrailLine map={map} walked={walkedLegs(trail)} />
      </div>
      <nav
        aria-label={tr("campaign.trail")}
        className="absolute"
        style={{ left: frame.x, top: frame.y }}
      >
        {trail.map((stop, index) => {
          const point = map.stops[index];
          return point ? (
            <StageMarker
              key={stop.stage.id}
              stop={stop}
              index={index}
              left={point.x * scale}
              top={point.y * scale}
              scale={scale}
              selected={selected === stop.stage.id}
              awaken={awaken === stop.stage.id}
              onOpen={onOpen}
            />
          ) : null;
        })}
      </nav>
    </>
  );
};

/**
 * The Campaign screen (GDD 11.5, web ADR-0008): the Region Map painting with
 * the Trail, a Stage Marker on each clearing, the Region name and the Star
 * chests. A Done or Open Stage Marker opens the Stage Panel.
 */
export const CampaignScreen = ({
  region = 1,
  onStart,
}: {
  readonly region?: number;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const results = useAtomValue(stageResultsAtom);
  const trail = useMemo(
    () => trailStages(STAGES, region, results),
    [region, results]
  );
  const stars = regionStars(trail);
  const awaken = useAwakenedStage(trail);
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const marker = useRef<Element | null>(null);
  const map = regionMap(region);
  const panelStop = trail.find((stop) => stop.stage.id === selected) ?? null;

  useEffect(() => {
    // The Battle scene chunk loads in the background, so a Battle starts fast (NFR-03).
    void preloadBattleCanvas();
  }, []);

  const open = (stop: TrailStage, from: Element) => {
    unlockAudio();
    playSound("select");
    marker.current = from;
    setSelected(stop.stage.id);
  };

  return (
    <main
      ref={root}
      aria-label={tr("campaign.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden bg-[#9fcbe8] duration-300 motion-reduce:animate-none"
      data-testid="campaign"
    >
      {map ? (
        <RegionCanvas
          map={map}
          trail={trail}
          selected={selected}
          awaken={awaken}
          onOpen={open}
          root={root}
        />
      ) : null}
      <RegionBanner region={region} />
      <StarChests region={region} count={stars.count} total={stars.total} />
      <StagePanel
        stop={panelStop}
        from={marker}
        onClose={() => setSelected(null)}
        onStart={onStart}
      />
    </main>
  );
};
