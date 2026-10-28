import { useAtom, useAtomValue } from "@effect/atom-react";
import { regionStars, STAGES } from "@workspace/rules";
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
  seenOpenStagesAtom,
  stageResultsAtom,
} from "@/features/campaign/campaign.atoms";
import {
  RegionBanner,
  StarChests,
} from "@/features/campaign/components/campaign-hud";
import {
  RegionStory,
  useBossStory,
} from "@/features/campaign/components/region-story";
import { StageMarker } from "@/features/campaign/components/stage-marker";
import { StagePanel } from "@/features/campaign/components/stage-panel";
import { TrailLine } from "@/features/campaign/components/trail-line";
import type {
  Box,
  MapFrame,
  RegionMap,
  StageResults,
  TrailStage,
  Viewport,
} from "@/features/campaign/region-map";
import {
  MAP,
  mapFrame,
  regionStarTotal,
  shownRegionMap,
  smoothPath,
  trailStages,
  walkedLegs,
  wakeUpStage,
} from "@/features/campaign/region-map";
import { CAMPAIGN_GROUND, CAMPAIGN_ROAD } from "@/features/campaign/tokens";
import { profileReadyAtom } from "@/features/profile/profile.atoms";
import { useTownBarHeight } from "@/features/town/use-town-bar-height";

/** The phone-in-landscape layout (DESIGN.md, The Short Screen Rule). */
const SHORT_SCREEN = "(max-height: 500px)";

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
  const bar = useTownBarHeight();
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
    const [width = 0, height = 0] = key.split("x").map(Number);
    return { width, height, top: TOP_EDGE, bottom: bar, obstacles };
  }, [key, bar, obstacles]);
};

/**
 * The edges of the painting fade into the backdrop on a side where the
 * painting does not reach the screen edge, or the Town Bar at the bottom.
 */
const fade = (side: boolean) => (side ? "transparent" : "black");

const paintingMask = (
  frame: MapFrame,
  viewport: Viewport
): CSSProperties | undefined => {
  const width = MAP.width * frame.scale * frame.stretch;
  const height = MAP.height * frame.scale;
  const left = frame.x > 0.5;
  const right = frame.x + width < viewport.width - 0.5;
  const top = frame.y > 0.5;
  const bottom = frame.y + height < viewport.height - viewport.bottom - 0.5;
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
 * The Open Stage wakes up once when the Campaign first shows it after a win,
 * also after a change of Region (`wakeUpStage`). Returns the ID of the Stage
 * that wakes up now.
 */
const useAwakenedStage = (region: number, results: StageResults) => {
  const [seen, setSeen] = useAtom(seenOpenStagesAtom);
  // The wake-up is found in the render, so the marker wakes up on its first
  // paint. It changes with the Region and the results, not with `seen`.
  const [wake, setWake] = useState(() => ({
    region,
    results,
    ...wakeUpStage(STAGES, region, results, seen),
  }));
  if (wake.region !== region || wake.results !== results) {
    setWake({ region, results, ...wakeUpStage(STAGES, region, results, seen) });
  }
  useEffect(() => {
    setSeen(wake.seen);
  }, [wake.seen, setSeen]);
  useEffect(() => {
    if (wake.awaken === null) {
      return;
    }
    const timer = setTimeout(
      () => setWake((current) => ({ ...current, awaken: null })),
      AWAKEN_MS
    );
    return () => clearTimeout(timer);
  }, [wake.awaken]);
  return wake.awaken;
};

/**
 * The placeholder of a Region Map with no painting: a soft road under the
 * Trail, so that the progress line does not float on the plain ground.
 */
const PlaceholderRoad = ({ map }: { readonly map: RegionMap }) => (
  <svg
    viewBox={`0 0 ${MAP.width} ${MAP.height}`}
    preserveAspectRatio="none"
    className="pointer-events-none absolute inset-0 size-full"
    aria-hidden
  >
    <path
      d={map.legs.map((leg) => smoothPath(leg)).join(" ")}
      fill="none"
      stroke={CAMPAIGN_ROAD}
      strokeWidth={44}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The painted map, the Trail and the Stage Markers. A Region with no
 * painting yet shows the placeholder: a plain ground with the Trail. A Region
 * with no Stages yet shows only the ground.
 */
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
  const { scale, stretch } = frame;
  // The backdrop: the same painting, soft, behind any side that the map does
  // not cover. A Region with no painting has the plain ground there.
  const backdrop =
    map.image === null ? (
      <div
        className="absolute inset-0"
        style={{ background: CAMPAIGN_GROUND }}
        data-testid="region-placeholder"
        aria-hidden
      />
    ) : (
      <img
        src={map.image}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-[0.72] saturate-[0.9] select-none"
        aria-hidden
      />
    );
  if (trail.length === 0) {
    return backdrop;
  }
  return (
    <>
      {backdrop}
      <div
        className="absolute"
        style={{
          left: frame.x,
          top: frame.y,
          width: MAP.width * scale * stretch,
          height: MAP.height * scale,
          ...paintingMask(frame, viewport),
        }}
      >
        {map.image === null ? (
          <PlaceholderRoad map={map} />
        ) : (
          <img
            src={map.image}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full select-none"
          />
        )}
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
              left={point.x * scale * stretch}
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
 * The Campaign screen (GDD 11.5, web ADR-0007): the Region Map painting with
 * the Trail, a Stage Marker on each clearing, the Region name and the Star
 * chests. A Done or Open Stage Marker opens the Stage Panel. The Region
 * arrows open the other Regions.
 */
export const CampaignScreen = ({
  region,
  onRegion,
  onStart,
}: {
  readonly region: number;
  readonly onRegion: (region: number) => void;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const ready = useAtomValue(profileReadyAtom);
  const results = useAtomValue(stageResultsAtom);
  const boss = useBossStory(region, onStart);
  const trail = useMemo(
    () => trailStages(STAGES, region, results),
    [region, results]
  );
  const stars = regionStars(results, region);
  const awaken = useAwakenedStage(region, results);
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const marker = useRef<Element | null>(null);
  const map = shownRegionMap(region);
  const panelStop = trail.find((stop) => stop.stage.id === selected) ?? null;

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
      className="fade-in animate-in bg-region-sky fixed inset-0 overflow-hidden duration-300 motion-reduce:animate-none"
      data-testid="campaign"
    >
      {/* A new Region mounts a new canvas, so its Stage Markers rise again. */}
      <RegionCanvas
        key={region}
        map={map}
        trail={trail}
        selected={selected}
        awaken={awaken}
        onOpen={open}
        root={root}
      />
      <RegionBanner
        region={region}
        onRegion={(next) => {
          setSelected(null);
          onRegion(next);
        }}
      />
      <StarChests
        region={region}
        count={stars}
        total={regionStarTotal(trail)}
      />
      {ready ? <RegionStory key={`story-${region}`} region={region} /> : null}
      <StagePanel
        stop={panelStop}
        from={marker}
        onClose={() => setSelected(null)}
        onStart={boss.handleStart}
      />
      {boss.scene}
    </main>
  );
};
