import type { Profile, StageDefinition } from "@workspace/rules";
import {
  isRegionUnlocked,
  regionStars,
  unlockingBossStage,
} from "@workspace/rules";

/** A point in Region Map coordinates: the 1600 × 900 box of the painting. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The Region Map painting coordinates: a 16:9 box (web ADR-0007). */
export const MAP = { width: 1600, height: 900 } as const;

/**
 * One Region Map (12 — Region Concepts). Each stop is the center of a painted
 * clearing, in Trail order. Leg `n` is the center line of the painted road
 * that goes to stop `n`: the first leg starts at the Trail entry, and each
 * other leg starts at the stop before it.
 */
export interface RegionMap {
  readonly region: number;
  /** The painting, or `null` for the placeholder of a Region with no painting yet. */
  readonly image: string | null;
  /**
   * The large landmark of the Boss behind the last stop. The screen keeps it
   * in view, so the Player sees where the Trail goes.
   */
  readonly bossLandmark: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  };
  readonly stops: readonly Point[];
  readonly legs: readonly (readonly Point[])[];
}

/**
 * Hearthvale (Region 1). The positions are measured on this painting, not
 * taken from 12 — Region Concepts 1.1: the painting puts its clearings higher,
 * with the Boss clearing in front of Brassbelly Hall.
 */
const HEARTHVALE: RegionMap = {
  region: 1,
  image: "/battle/hearthvale-region.webp",
  // Brassbelly Hall, from the top of its hat roof to its palisade.
  bossLandmark: { left: 1040, top: 60, right: 1320, bottom: 200 },
  stops: [
    { x: 357, y: 720 },
    { x: 470, y: 630 },
    { x: 418, y: 438 },
    { x: 575, y: 360 },
    { x: 800, y: 428 },
    { x: 865, y: 575 },
    { x: 1130, y: 718 },
    { x: 1305, y: 685 },
    { x: 1375, y: 447 },
    { x: 1115, y: 250 },
  ],
  legs: [
    [
      { x: 0, y: 772 },
      { x: 110, y: 766 },
      { x: 210, y: 754 },
      { x: 292, y: 734 },
      { x: 357, y: 720 },
    ],
    [
      { x: 357, y: 720 },
      { x: 404, y: 694 },
      { x: 442, y: 666 },
      { x: 470, y: 630 },
    ],
    [
      { x: 470, y: 630 },
      { x: 486, y: 597 },
      { x: 488, y: 560 },
      { x: 484, y: 518 },
      { x: 470, y: 482 },
      { x: 446, y: 455 },
      { x: 418, y: 438 },
    ],
    [
      { x: 418, y: 438 },
      { x: 446, y: 420 },
      { x: 474, y: 404 },
      { x: 512, y: 384 },
      { x: 575, y: 360 },
    ],
    [
      { x: 575, y: 360 },
      { x: 632, y: 362 },
      { x: 692, y: 376 },
      { x: 748, y: 396 },
      { x: 800, y: 428 },
    ],
    [
      { x: 800, y: 428 },
      { x: 818, y: 462 },
      { x: 836, y: 500 },
      { x: 849, y: 540 },
      { x: 865, y: 575 },
    ],
    [
      { x: 865, y: 575 },
      { x: 916, y: 606 },
      { x: 986, y: 646 },
      { x: 1052, y: 684 },
      { x: 1130, y: 718 },
    ],
    [
      { x: 1130, y: 718 },
      { x: 1186, y: 706 },
      { x: 1246, y: 694 },
      { x: 1305, y: 685 },
    ],
    [
      { x: 1305, y: 685 },
      { x: 1352, y: 670 },
      { x: 1392, y: 638 },
      { x: 1415, y: 594 },
      { x: 1424, y: 545 },
      { x: 1414, y: 498 },
      { x: 1375, y: 447 },
    ],
    [
      { x: 1375, y: 447 },
      { x: 1324, y: 434 },
      { x: 1278, y: 412 },
      { x: 1246, y: 376 },
      { x: 1238, y: 338 },
      { x: 1220, y: 302 },
      { x: 1170, y: 276 },
      { x: 1115, y: 250 },
    ],
  ],
};

/** The Red Mesas (Region 2). The positions are measured on this painting. */
const RED_MESAS: RegionMap = {
  region: 2,
  image: "/battle/red-mesas-region.webp",
  // Snikkit's Throne Hall, from its bucket crown to its gate. The Boss
  // clearing is the end of the road, in front of the gate.
  bossLandmark: { left: 1080, top: 10, right: 1300, bottom: 200 },
  stops: [
    { x: 286, y: 760 },
    { x: 495, y: 672 },
    { x: 385, y: 557 },
    { x: 557, y: 467 },
    { x: 764, y: 524 },
    { x: 898, y: 667 },
    { x: 1113, y: 764 },
    { x: 1354, y: 667 },
    { x: 1408, y: 494 },
    { x: 1198, y: 252 },
  ],
  legs: [
    [
      { x: 0, y: 823 },
      { x: 94, y: 810 },
      { x: 198, y: 786 },
      { x: 286, y: 760 },
    ],
    [
      { x: 286, y: 760 },
      { x: 354, y: 748 },
      { x: 438, y: 710 },
      { x: 495, y: 672 },
    ],
    [
      { x: 495, y: 672 },
      { x: 458, y: 625 },
      { x: 422, y: 583 },
      { x: 385, y: 557 },
    ],
    [
      { x: 385, y: 557 },
      { x: 448, y: 526 },
      { x: 510, y: 484 },
      { x: 557, y: 467 },
    ],
    [
      { x: 557, y: 467 },
      { x: 625, y: 479 },
      { x: 688, y: 500 },
      { x: 764, y: 524 },
    ],
    [
      { x: 764, y: 524 },
      { x: 807, y: 573 },
      { x: 849, y: 625 },
      { x: 898, y: 667 },
    ],
    [
      { x: 898, y: 667 },
      { x: 969, y: 708 },
      { x: 1042, y: 748 },
      { x: 1113, y: 764 },
    ],
    [
      { x: 1113, y: 764 },
      { x: 1198, y: 740 },
      { x: 1286, y: 700 },
      { x: 1354, y: 667 },
    ],
    [
      { x: 1354, y: 667 },
      { x: 1401, y: 615 },
      { x: 1417, y: 552 },
      { x: 1408, y: 494 },
    ],
    [
      { x: 1408, y: 494 },
      { x: 1388, y: 462 },
      { x: 1362, y: 432 },
      { x: 1330, y: 402 },
      { x: 1304, y: 368 },
      { x: 1278, y: 330 },
      { x: 1248, y: 295 },
      { x: 1198, y: 252 },
    ],
  ],
};

/** The Glowcap Hollows (Region 3). The positions are measured on this painting. */
const GLOWCAP_HOLLOWS: RegionMap = {
  region: 3,
  image: "/battle/glowcap-hollows-region.webp",
  // The grove hall of Lady Glimmerbough, from its mushroom roof to its steps.
  bossLandmark: { left: 1040, top: 60, right: 1320, bottom: 270 },
  stops: [
    { x: 290, y: 748 },
    { x: 491, y: 649 },
    { x: 391, y: 526 },
    { x: 579, y: 414 },
    { x: 759, y: 489 },
    { x: 902, y: 641 },
    { x: 1126, y: 731 },
    { x: 1351, y: 634 },
    { x: 1358, y: 461 },
    { x: 1165, y: 306 },
  ],
  legs: [
    [
      { x: 0, y: 823 },
      { x: 115, y: 800 },
      { x: 208, y: 773 },
      { x: 290, y: 748 },
    ],
    [
      { x: 290, y: 748 },
      { x: 354, y: 724 },
      { x: 438, y: 688 },
      { x: 491, y: 649 },
    ],
    [
      { x: 491, y: 649 },
      { x: 458, y: 599 },
      { x: 427, y: 557 },
      { x: 391, y: 526 },
    ],
    [
      { x: 391, y: 526 },
      { x: 438, y: 484 },
      { x: 500, y: 443 },
      { x: 579, y: 414 },
    ],
    [
      { x: 579, y: 414 },
      { x: 656, y: 427 },
      { x: 708, y: 458 },
      { x: 759, y: 489 },
    ],
    [
      { x: 759, y: 489 },
      { x: 813, y: 542 },
      { x: 854, y: 594 },
      { x: 902, y: 641 },
    ],
    [
      { x: 902, y: 641 },
      { x: 969, y: 677 },
      { x: 1042, y: 714 },
      { x: 1126, y: 731 },
    ],
    [
      { x: 1126, y: 731 },
      { x: 1208, y: 714 },
      { x: 1292, y: 667 },
      { x: 1351, y: 634 },
    ],
    [
      { x: 1351, y: 634 },
      { x: 1365, y: 583 },
      { x: 1375, y: 516 },
      { x: 1358, y: 461 },
    ],
    [
      { x: 1358, y: 461 },
      { x: 1323, y: 417 },
      { x: 1260, y: 375 },
      { x: 1208, y: 333 },
      { x: 1165, y: 306 },
    ],
  ],
};

/** The Thornwood (Region 4). The positions are measured on this painting. */
const THORNWOOD: RegionMap = {
  region: 4,
  image: "/battle/thornwood-region.webp",
  // The Old Bramble, from its crown of leaves to its bramble hill.
  bossLandmark: { left: 1060, top: 60, right: 1380, bottom: 340 },
  stops: [
    { x: 292, y: 777 },
    { x: 471, y: 657 },
    { x: 368, y: 543 },
    { x: 540, y: 450 },
    { x: 732, y: 519 },
    { x: 863, y: 668 },
    { x: 1046, y: 757 },
    { x: 1265, y: 663 },
    { x: 1299, y: 516 },
    { x: 1125, y: 395 },
  ],
  legs: [
    [
      { x: 0, y: 792 },
      { x: 104, y: 783 },
      { x: 208, y: 779 },
      { x: 292, y: 777 },
    ],
    [
      { x: 292, y: 777 },
      { x: 375, y: 750 },
      { x: 438, y: 698 },
      { x: 471, y: 657 },
    ],
    [
      { x: 471, y: 657 },
      { x: 434, y: 630 },
      { x: 405, y: 603 },
      { x: 382, y: 578 },
      { x: 368, y: 543 },
    ],
    [
      { x: 368, y: 543 },
      { x: 438, y: 500 },
      { x: 490, y: 469 },
      { x: 540, y: 450 },
    ],
    [
      { x: 540, y: 450 },
      { x: 625, y: 458 },
      { x: 677, y: 484 },
      { x: 732, y: 519 },
    ],
    [
      { x: 732, y: 519 },
      { x: 792, y: 573 },
      { x: 823, y: 625 },
      { x: 863, y: 668 },
    ],
    [
      { x: 863, y: 668 },
      { x: 885, y: 692 },
      { x: 925, y: 710 },
      { x: 965, y: 729 },
      { x: 1000, y: 745 },
      { x: 1046, y: 757 },
    ],
    [
      { x: 1046, y: 757 },
      { x: 1135, y: 729 },
      { x: 1208, y: 693 },
      { x: 1265, y: 663 },
    ],
    [
      { x: 1265, y: 663 },
      { x: 1313, y: 604 },
      { x: 1313, y: 557 },
      { x: 1299, y: 516 },
    ],
    [
      { x: 1299, y: 516 },
      { x: 1262, y: 482 },
      { x: 1222, y: 462 },
      { x: 1182, y: 444 },
      { x: 1146, y: 423 },
      { x: 1125, y: 395 },
    ],
  ],
};

/** The Hollow Marches (Region 5). The positions are measured on this painting. */
const HOLLOW_MARCHES: RegionMap = {
  region: 5,
  image: "/battle/hollow-marches-region.webp",
  // The castle of Queen Marrow, from its towers to its gate.
  bossLandmark: { left: 1020, top: 55, right: 1310, bottom: 280 },
  stops: [
    { x: 318, y: 761 },
    { x: 477, y: 654 },
    { x: 370, y: 548 },
    { x: 546, y: 446 },
    { x: 749, y: 510 },
    { x: 873, y: 661 },
    { x: 1093, y: 769 },
    { x: 1376, y: 706 },
    { x: 1313, y: 495 },
    { x: 1117, y: 372 },
  ],
  legs: [
    [
      { x: 0, y: 818 },
      { x: 104, y: 792 },
      { x: 208, y: 771 },
      { x: 318, y: 761 },
    ],
    [
      { x: 318, y: 761 },
      { x: 385, y: 729 },
      { x: 427, y: 693 },
      { x: 477, y: 654 },
    ],
    [
      { x: 477, y: 654 },
      { x: 417, y: 604 },
      { x: 396, y: 578 },
      { x: 370, y: 548 },
    ],
    [
      { x: 370, y: 548 },
      { x: 364, y: 514 },
      { x: 361, y: 488 },
      { x: 368, y: 471 },
      { x: 392, y: 466 },
      { x: 420, y: 467 },
      { x: 450, y: 464 },
      { x: 482, y: 457 },
      { x: 546, y: 446 },
    ],
    [
      { x: 546, y: 446 },
      { x: 625, y: 458 },
      { x: 688, y: 484 },
      { x: 749, y: 510 },
    ],
    [
      { x: 749, y: 510 },
      { x: 792, y: 563 },
      { x: 833, y: 615 },
      { x: 873, y: 661 },
    ],
    [
      { x: 873, y: 661 },
      { x: 938, y: 708 },
      { x: 1010, y: 745 },
      { x: 1093, y: 769 },
    ],
    [
      { x: 1093, y: 769 },
      { x: 1198, y: 750 },
      { x: 1292, y: 729 },
      { x: 1376, y: 706 },
    ],
    [
      { x: 1376, y: 706 },
      { x: 1408, y: 690 },
      { x: 1432, y: 666 },
      { x: 1446, y: 630 },
      { x: 1452, y: 597 },
      { x: 1434, y: 566 },
      { x: 1400, y: 541 },
      { x: 1360, y: 521 },
      { x: 1313, y: 495 },
    ],
    [
      { x: 1313, y: 495 },
      { x: 1229, y: 448 },
      { x: 1167, y: 417 },
      { x: 1117, y: 372 },
    ],
  ],
};

/**
 * The Region Map of each Region, or `null` while its painting does not exist.
 * To add one, follow 12 — Region Concepts, step 6.
 */
type RegionMaps = Readonly<Record<number, RegionMap | null>>;

const REGION_MAPS = {
  1: HEARTHVALE,
  2: RED_MESAS,
  3: GLOWCAP_HOLLOWS,
  4: THORNWOOD,
  5: HOLLOW_MARCHES,
} as const satisfies RegionMaps;

/** The Region Map of a Region, or `null` while its painting does not exist. */
export const regionMap = (
  region: number,
  maps: RegionMaps = REGION_MAPS
): RegionMap | null => maps[region] ?? null;

/**
 * The Region Map that the Campaign screen shows: the painting of the Region,
 * or a placeholder while the painting does not exist. The placeholder uses
 * the stops and the legs of Hearthvale with no image, so that the Trail and
 * the Stage Markers show on a plain backdrop with no wrong landmarks.
 */
export const shownRegionMap = (
  region: number,
  maps: RegionMaps = REGION_MAPS
): RegionMap =>
  regionMap(region, maps) ?? { ...HEARTHVALE, region, image: null };

/** The best Stars (1 to 3) of each won Stage, by Stage ID. */
export type StageResults = Readonly<Record<string, number>>;

/** Done: won at least once. Open: the next Stage to win. Locked: not yet. */
export type StageState = "done" | "open" | "locked";

/** A Stage on the Trail, with its state and its best Stars. */
export interface TrailStage {
  readonly stage: StageDefinition;
  readonly state: StageState;
  readonly stars: number;
  /** The Stage to win first, for a Locked Stage. */
  readonly after: StageDefinition | null;
}

/**
 * The Stages of a Region in Trail order. The Stages in a Region unlock in
 * order (GDD 8.1): a Stage is Open when the Stage before it is Done. The
 * first Stage of a locked Region stays Locked, and its Boss Stage to win
 * first is the Boss Stage of the previous Region.
 */
export const trailStages = (
  stages: readonly StageDefinition[],
  region: number,
  results: StageResults
): readonly TrailStage[] => {
  const inRegion = stages
    .filter((stage) => stage.region === region)
    .toSorted((a, b) => a.number - b.number);
  const regionOpen = isRegionUnlocked(results, region, stages);
  return inRegion.map((stage, index) => {
    const stars = results[stage.id] ?? 0;
    // The first Stage waits for the Boss Stage of the previous Region.
    const before =
      index === 0
        ? unlockingBossStage(region, stages)
        : (inRegion[index - 1] ?? null);
    const unlocked =
      index === 0 ? regionOpen : (results[before?.id ?? ""] ?? 0) > 0;
    const state: StageState = stars > 0 ? "done" : unlocked ? "open" : "locked";
    return { stage, state, stars, after: unlocked ? null : before };
  });
};

/** The ID of the Open Stage on a Trail, or `null` when it has none. */
const openStageId = (trail: readonly TrailStage[]): string | null =>
  trail.find((stop) => stop.state === "open")?.stage.id ?? null;

/** The wake-up of the Region that the Campaign shows now. */
export interface StageWakeUp {
  /** The ID of the Stage whose marker wakes up now, or `null`. */
  readonly awaken: string | null;
  /** The Open Stages that the Campaign knows of after this show. */
  readonly seen: ReadonlySet<string>;
}

/**
 * When a win opens a Stage, its marker wakes up one time: the first time that
 * the Campaign shows it Open. `seen` holds the Open Stages that the Campaign
 * knows of, or `null` before its first show. At the first show, the Open
 * Stages of all Regions are known and none wakes up. Thus Stage 1 of a Region
 * that was locked then wakes up when the Player first opens that Region, and
 * a Stage that the Player saw does not wake up again in another Region.
 */
export const wakeUpStage = (
  stages: readonly StageDefinition[],
  region: number,
  results: StageResults,
  seen: ReadonlySet<string> | null
): StageWakeUp => {
  if (seen === null) {
    const regions = new Set(stages.map((stage) => stage.region));
    const open = [...regions].flatMap((item) =>
      trailStages(stages, item, results).flatMap((stop) =>
        stop.state === "open" ? [stop.stage.id] : []
      )
    );
    return { awaken: null, seen: new Set(open) };
  }
  const open = openStageId(trailStages(stages, region, results));
  if (open === null || seen.has(open)) {
    return { awaken: null, seen };
  }
  return { awaken: open, seen: new Set([...seen, open]) };
};

/**
 * What the Region banner says about a Region (GDD 11.5). Open: the Player can
 * play its Stages. Locked: the Player must win `boss` first. Later: the Region
 * has no Stages in the game yet, or the Region before it has no Boss Stage.
 */
export type RegionStatus =
  | { readonly kind: "open" }
  | { readonly kind: "locked"; readonly boss: StageDefinition }
  | { readonly kind: "later" };

export const regionStatus = (
  stages: readonly StageDefinition[],
  region: number,
  results: StageResults
): RegionStatus => {
  if (!stages.some((stage) => stage.region === region)) {
    return { kind: "later" };
  }
  if (isRegionUnlocked(results, region, stages)) {
    return { kind: "open" };
  }
  const boss = unlockingBossStage(region, stages);
  return boss ? { kind: "locked", boss } : { kind: "later" };
};

/** The most Stars of a Region: 3 for each Stage on its Trail (GDD 8.1). */
export const regionStarTotal = (trail: readonly TrailStage[]): number =>
  trail.length * 3;

/**
 * A Star chest (GDD 11.5): `closed` while the Region has fewer Stars than
 * the chest, `claimable` when it has the Stars (it glows), and `claimed`
 * after the Player claimed it (it stays open).
 */
export type ChestState = "closed" | "claimable" | "claimed";

export const chestState = (
  profile: Pick<Profile, "stageResults" | "claimedStarChests">,
  region: number,
  stars: number
): ChestState => {
  if (profile.claimedStarChests[String(region)]?.includes(stars)) {
    return "claimed";
  }
  return regionStars(profile.stageResults, region) >= stars
    ? "claimable"
    : "closed";
};

/** The number of legs to draw solid: from the Trail entry to the last Done Stage. */
export const walkedLegs = (trail: readonly TrailStage[]): number =>
  trail.findLastIndex((stop) => stop.state === "done") + 1;

/**
 * A smooth SVG path through the points (a Catmull-Rom spline as cubic Bézier
 * segments). It goes through each point, so it stays on the traced road.
 */
const round = (value: number) => Math.round(value * 10) / 10;

export const smoothPath = (points: readonly Point[]): string => {
  const [first] = points;
  if (!first) {
    return "";
  }
  const at = (index: number): Point =>
    points[Math.max(0, Math.min(points.length - 1, index))] ?? first;
  const segments = points.slice(1).map((end, offset) => {
    const index = offset + 1;
    const p0 = at(index - 2);
    const p1 = at(index - 1);
    const p3 = at(index + 1);
    const c1 = { x: p1.x + (end.x - p0.x) / 6, y: p1.y + (end.y - p0.y) / 6 };
    const c2 = { x: end.x - (p3.x - p1.x) / 6, y: end.y - (p3.y - p1.y) / 6 };
    return `C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${end.x} ${end.y}`;
  });
  return [`M${first.x} ${first.y}`, ...segments].join(" ");
};

/** The size of a Stage Marker shield in screen pixels. */
export interface MarkerSize {
  /** The shield width. A Boss shield is larger. */
  readonly width: number;
  /** The part of the marker above the clearing center: the shield (and the crown). */
  readonly above: number;
  /** The part below the clearing center: the base of the shield and the ID plate. */
  readonly below: number;
}

/** A Boss Stage Marker is larger (GDD 11.5). */
const BOSS_SCALE = 1.3;

/**
 * The shield width for a map scale, in pixels. With its ID plate, the marker
 * is more than 44 px high and its plate about 44 px wide, so a finger can
 * touch it on a phone. It is never larger than a Town Bar icon.
 */
const shieldWidth = (scale: number): number =>
  Math.round(Math.min(64, Math.max(34, 66 * scale)));

/**
 * The marker stands on its clearing: the shield rises above the center, and
 * the ID plate sits on the clearing below it.
 */
export const markerSize = (scale: number, boss: boolean): MarkerSize => {
  const width = shieldWidth(scale) * (boss ? BOSS_SCALE : 1);
  const height = width * 1.15;
  return {
    width,
    above: height * 0.82 + (boss ? width * 0.32 : 0),
    below: height * 0.18 + 22,
  };
};

/** A box on the screen, in pixels. */
export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export const boxesOverlap = (a: Box, b: Box): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** The screen size, its edges, and the HUD pieces that a Stage Marker must not go under. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
  /** The space at the top edge of the screen. */
  readonly top: number;
  /** The Town Bar. */
  readonly bottom: number;
  /** The Region banner and the Star chest plate. */
  readonly obstacles: readonly Box[];
}

/**
 * The painting on the screen: its top-left corner and pixels per map unit.
 * A map x is `scale * stretch` pixels wide, so the painting can fill the
 * width of a screen that is a little wider or narrower than 16:9.
 */
export interface MapFrame {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly stretch: number;
}

/** A margin between two Stage Markers, or a marker and the screen edge or the HUD. */
const EDGE = 6;

/**
 * The box of each Stage Marker at a scale and a stretch, in pixels from the
 * painting origin, with a margin. The last stop is the Boss Stage.
 */
export const markerBoxes = (
  stops: readonly Point[],
  scale: number,
  stretch = 1
): readonly Box[] =>
  stops.map((stop, index) => {
    const size = markerSize(scale, index === stops.length - 1);
    const x = stop.x * scale * stretch;
    return {
      left: x - size.width / 2 - EDGE,
      right: x + size.width / 2 + EDGE,
      top: stop.y * scale - size.above - EDGE,
      bottom: stop.y * scale + size.below + EDGE,
    };
  });

const boundsOf = (boxes: readonly Box[]): Box => ({
  left: Math.min(...boxes.map((box) => box.left)),
  right: Math.max(...boxes.map((box) => box.right)),
  top: Math.min(...boxes.map((box) => box.top)),
  bottom: Math.max(...boxes.map((box) => box.bottom)),
});

/** The parts of a Region Map that the frame keeps in view. */
type FramedMap = Pick<RegionMap, "stops" | "bossLandmark">;

/** The size of the painting on the screen. */
type Size = Pick<MapFrame, "scale" | "stretch">;

/**
 * The box that the frame keeps on the screen at a scale, in pixels from the
 * painting origin: each Stage Marker, and the Boss landmark from its middle
 * line down, so that the Player sees at least half of it.
 */
const framedBounds = (map: FramedMap, { scale, stretch }: Size): Box => {
  const { left, top, right, bottom } = map.bossLandmark;
  const middle = ((top + bottom) / 2) * scale;
  return boundsOf([
    ...markerBoxes(map.stops, scale, stretch),
    {
      left: left * scale * stretch,
      right: right * scale * stretch,
      top: middle,
      bottom: middle,
    },
  ]);
};

const fits = (map: FramedMap, viewport: Viewport, size: Size) => {
  const bounds = framedBounds(map, size);
  return (
    bounds.right - bounds.left <= viewport.width &&
    bounds.bottom - bounds.top <=
      viewport.height - viewport.top - viewport.bottom
  );
};

/** `value` in `[low, high]`. When the range is empty, its middle. */
const clampTo = (value: number, low: number, high: number) =>
  low > high ? (low + high) / 2 : Math.min(high, Math.max(low, value));

/**
 * The position of the painting at a size where no Stage Marker goes under a
 * HUD piece, or `null`. It covers the screen above the Town Bar when it can.
 * If a marker goes under the top HUD there, the painting moves down as far as
 * the Town Bar lets it.
 */
const place = (
  map: FramedMap,
  viewport: Viewport,
  size: Size
): MapFrame | null => {
  const { scale, stretch } = size;
  const width = MAP.width * scale * stretch;
  const height = MAP.height * scale;
  const boxes = markerBoxes(map.stops, scale, stretch);
  const bounds = framedBounds(map, size);
  const floor = viewport.height - viewport.bottom;
  const left = -bounds.left;
  const right = viewport.width - bounds.right;
  const coverX = clampTo(
    (viewport.width - width) / 2,
    viewport.width - width,
    0
  );
  const low = viewport.top - bounds.top;
  const high = floor - bounds.bottom;
  // The painting covers the screen above the Town Bar and moves down as far
  // as it can, so that the Player sees as much of the Boss landmark as the
  // Stage Markers let.
  const coverY = clampTo(
    viewport.top - map.bossLandmark.top * scale,
    floor - height,
    0
  );
  // That position first; then the painting moves down, then sideways.
  const positions = [clampTo(coverY, low, high), high].flatMap((y) =>
    [clampTo(coverX, left, right), Math.max(left, right), left].map((x) => ({
      x,
      y,
    }))
  );
  const clear = ({ x, y }: { readonly x: number; readonly y: number }) =>
    boxes.every((box) =>
      viewport.obstacles.every(
        (obstacle) =>
          !boxesOverlap(
            {
              left: box.left + x,
              right: box.right + x,
              top: box.top + y,
              bottom: box.bottom + y,
            },
            obstacle
          )
      )
    );
  const position = positions.find(clear);
  return position ? { ...position, ...size } : null;
};

/**
 * The most that the painting squashes on the x axis, so that it fills the
 * width of a screen that is narrower than 16:9. More than this bends the art,
 * so the screen then cuts the sides of the painting instead.
 */
export const MAX_STRETCH = 0.1;

/**
 * The most that the painting stretches on the x axis, so that it fills the
 * width of a screen that is wider than 16:9. The painting then fills the
 * screen width on most screens, with no soft backdrop at its sides.
 */
export const FIT_STRETCH = 0.2;

/** No two Stage Markers touch at a size (their margins can touch). */
const apart = (map: FramedMap, { scale, stretch }: Size) => {
  const boxes = markerBoxes(map.stops, scale, stretch).map((box) => ({
    left: box.left + EDGE,
    right: box.right - EDGE,
    top: box.top + EDGE,
    bottom: box.bottom - EDGE,
  }));
  return boxes.every((box, index) =>
    boxes.slice(index + 1).every((other) => !boxesOverlap(box, other))
  );
};

/**
 * Places the painting on the screen. The full height of the painting fits
 * above the Town Bar, so the screen does not cut its top or its bottom. To
 * fill the screen width, the painting stretches on the x axis by at most
 * `FIT_STRETCH`, or squashes by at most `MAX_STRETCH`. A soft backdrop fills
 * each side of a wider screen that the painting then does not cover, and a
 * narrower screen cuts the sides. On a small screen (a phone), the Stage
 * Markers can touch at that size: the painting then gets larger, until they
 * do not. All Stage Markers always stay on the screen, above the Town Bar and
 * clear of the HUD, with at least half of the Boss landmark: when the screen
 * cannot hold them (a short screen), the painting gets smaller.
 */
export const mapFrame = (map: FramedMap, viewport: Viewport): MapFrame => {
  const across = viewport.width / MAP.width;
  const down = (viewport.height - viewport.bottom) / MAP.height;
  const sizeAt = (scale: number): Size => ({
    scale,
    // At the cover size and larger, `across / scale` is never more than
    // `1 + MAX_STRETCH`. Only a smaller painting stretches more.
    stretch: Math.min(
      1 + FIT_STRETCH,
      Math.max(1 / (1 + MAX_STRETCH), across / scale)
    ),
  });
  const cover = Math.max(across, down);
  // The full height of the painting fits above the Town Bar. The stretch
  // fills the width of a screen that is wider than the painting.
  let scale = down;
  if (!apart(map, sizeAt(scale)) && apart(map, sizeAt(cover))) {
    let low = scale;
    let high = cover;
    for (let step = 0; step < 24; step += 1) {
      const middle = (low + high) / 2;
      if (apart(map, sizeAt(middle))) {
        high = middle;
      } else {
        low = middle;
      }
    }
    scale = high;
  }
  if (!fits(map, viewport, sizeAt(scale))) {
    let low = 0.05;
    let high = scale;
    for (let step = 0; step < 24; step += 1) {
      const middle = (low + high) / 2;
      if (fits(map, viewport, sizeAt(middle))) {
        low = middle;
      } else {
        high = middle;
      }
    }
    scale = low;
  }
  for (let step = 0; step < 40; step += 1) {
    const frame = place(map, viewport, sizeAt(scale));
    if (frame) {
      return frame;
    }
    scale *= 0.97;
  }
  return (
    place(map, { ...viewport, obstacles: [] }, sizeAt(scale)) ?? {
      x: 0,
      y: 0,
      ...sizeAt(scale),
    }
  );
};
