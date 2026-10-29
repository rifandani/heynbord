import type { Profile } from "@workspace/rules";
import { isRegionUnlocked, STAGES } from "@workspace/rules";

export type StoryKind = "opening" | "boss" | "ending";

/** Who says a line. Narration has no name plate. */
export type StorySpeaker =
  | "narrator"
  | "baron"
  | "snikkit"
  | "grukka"
  | "glimmerbough"
  | "lethiel"
  | "hero";

/** Stable IDs belong to the Profile. Media and text stay in the web app. */
const storyId = (region: number, kind: StoryKind): string =>
  `region-${region}-${kind}`;

const bossStage = (region: number) =>
  STAGES.find((stage) => stage.region === region && stage.boss);

export interface StoryCue {
  readonly file: string;
  readonly at: number;
  readonly gainDb: number;
}

/** The produced Story Scenes of one Region: media, speakers and effect cues. */
interface StoryRegion {
  /** The Translation Key group under `story`. */
  readonly key: string;
  /** Versioned URLs prevent a later export from changing a cached Story Moment. */
  readonly root: string;
  /** The Region Map behind a poster that cannot load. */
  readonly map: string;
  /**
   * The speaker of each line, per Story Moment. Continue shows the next line;
   * the clip changes only at the next moment.
   */
  readonly lines: Record<StoryKind, readonly (readonly StorySpeaker[])[]>;
  /**
   * Effect cues per Story Moment, in seconds from the start of its clip. Each
   * table is `CUES` in `scripts/campaign-story/<region>/src/audio.rs`.
   */
  readonly cues: Record<StoryKind, readonly (readonly StoryCue[])[]>;
}

export const STORY_MOMENTS = 5;
/** Each clip finishes its action here; the rest loops while the Player reads. */
export const STORY_LOOP_START = 5;

const narration = Array.from({ length: STORY_MOMENTS }, () => [
  "narrator" as const,
]);

const HEARTHVALE: StoryRegion = {
  key: "hearthvale",
  root: "/story/hearthvale/v2",
  map: "/battle/hearthvale-region.webp",
  lines: {
    opening: narration,
    boss: [
      ["narrator", "baron"],
      ["baron", "hero"],
      ["baron", "baron", "hero"],
      ["hero", "baron", "baron"],
      ["baron", "hero"],
    ],
    ending: narration,
  },
  cues: {
    opening: [
      [
        { file: "fire", at: 0, gainDb: -4 },
        { file: "boom", at: 3.55, gainDb: 0 },
      ],
      [
        { file: "shimmer", at: 0.4, gainDb: -3 },
        { file: "boom", at: 3.35, gainDb: -2 },
      ],
      [{ file: "wind", at: 0, gainDb: -2 }],
      [
        { file: "thunder", at: 2.85, gainDb: 0 },
        { file: "drum", at: 3.05, gainDb: -2 },
      ],
      [
        { file: "boom", at: 0.55, gainDb: -9 },
        { file: "shimmer", at: 1, gainDb: -6 },
      ],
    ],
    boss: [
      [
        { file: "torch", at: 0.9, gainDb: -3 },
        { file: "thunder", at: 2, gainDb: 0 },
        { file: "gate", at: 3.35, gainDb: 0 },
        { file: "boom", at: 3.35, gainDb: -9 },
      ],
      [
        { file: "cloth", at: 0.3, gainDb: -2 },
        { file: "boom", at: 1.9, gainDb: -5 },
        { file: "drum", at: 2.3, gainDb: -3 },
        { file: "coin", at: 3.95, gainDb: -2 },
      ],
      [
        { file: "thud", at: 1, gainDb: 0 },
        { file: "thud", at: 1.38, gainDb: -1 },
        { file: "thud", at: 1.76, gainDb: -2 },
        { file: "thud", at: 2.14, gainDb: -3 },
        { file: "thud", at: 2.52, gainDb: -2 },
        { file: "coins", at: 3, gainDb: -5 },
      ],
      [
        { file: "magic", at: 0.5, gainDb: -3 },
        { file: "thud", at: 2.35, gainDb: 0 },
        { file: "coins", at: 2.65, gainDb: -2 },
      ],
      [
        { file: "drums", at: 0.1, gainDb: -2 },
        { file: "shimmer", at: 0.4, gainDb: -8 },
        { file: "cannon", at: 1.95, gainDb: -2.5 },
        { file: "boom", at: 3.4, gainDb: -5 },
      ],
    ],
    ending: [
      [
        { file: "flap", at: 1.1, gainDb: -2 },
        { file: "boom", at: 1.1, gainDb: -6 },
        { file: "shimmer", at: 1.3, gainDb: -5 },
      ],
      [
        { file: "coins", at: 0.3, gainDb: -2 },
        { file: "coin-spin", at: 3.8, gainDb: -1 },
      ],
      [
        { file: "crack", at: 0.5, gainDb: 0 },
        { file: "crack", at: 1.15, gainDb: -7 },
      ],
      [
        { file: "paper", at: 0.15, gainDb: -3 },
        { file: "thud", at: 3.33, gainDb: 0 },
      ],
      [{ file: "wind", at: 1.3, gainDb: -3 }],
    ],
  },
};

const RED_MESAS: StoryRegion = {
  key: "redMesas",
  root: "/story/red-mesas/v1",
  map: "/battle/red-mesas-region.webp",
  lines: {
    opening: narration,
    boss: [
      ["narrator", "snikkit"],
      ["snikkit", "hero", "snikkit"],
      ["snikkit", "hero", "snikkit"],
      ["hero", "snikkit", "snikkit"],
      ["snikkit", "grukka", "hero"],
    ],
    ending: [
      ["narrator"],
      ["narrator"],
      ["narrator", "grukka"],
      ["narrator"],
      ["narrator"],
    ],
  },
  cues: {
    opening: [
      [
        { file: "wind", at: 0.6, gainDb: -4 },
        { file: "boom", at: 3.12, gainDb: -1 },
      ],
      [
        { file: "rumble", at: 0.2, gainDb: -6 },
        { file: "fuse", at: 1.25, gainDb: -3 },
        { file: "fuse", at: 1.8, gainDb: -4 },
        { file: "fuse", at: 2.35, gainDb: -4 },
        { file: "fuse", at: 2.9, gainDb: -3 },
        { file: "explosion", at: 3.3, gainDb: 0 },
      ],
      [
        { file: "rumble", at: 0.3, gainDb: -2 },
        { file: "skid", at: 1.5, gainDb: -2 },
        { file: "thud", at: 1.9, gainDb: -2 },
        { file: "coins", at: 2.4, gainDb: -3 },
        { file: "drum", at: 3.1, gainDb: -3 },
      ],
      [
        { file: "magic", at: 0.6, gainDb: -6 },
        { file: "shimmer", at: 3, gainDb: -8 },
      ],
      [
        { file: "fuse", at: 0.35, gainDb: -4 },
        { file: "fuse", at: 1.6, gainDb: -6 },
        { file: "fuse", at: 2.8, gainDb: -6 },
        { file: "cannon", at: 4, gainDb: -6 },
        { file: "shimmer", at: 4.05, gainDb: -6 },
      ],
    ],
    boss: [
      [
        { file: "clank", at: 0.55, gainDb: -6 },
        { file: "clank", at: 0.85, gainDb: -8 },
        { file: "clank", at: 1.15, gainDb: -8 },
        { file: "slam", at: 1.5, gainDb: -4 },
        { file: "steam", at: 3.15, gainDb: -6 },
        { file: "cannon", at: 3.85, gainDb: -6 },
        { file: "shimmer", at: 3.9, gainDb: -8 },
      ],
      [
        { file: "rumble", at: 0.3, gainDb: -3 },
        { file: "skid", at: 1.45, gainDb: -2 },
        { file: "thud", at: 1.9, gainDb: 0 },
        { file: "drum", at: 2.67, gainDb: -5 },
        { file: "drum", at: 2.89, gainDb: -7 },
        { file: "drum", at: 3.11, gainDb: -7 },
        { file: "drum", at: 3.33, gainDb: -4 },
      ],
      [
        { file: "steam", at: 0.25, gainDb: -4 },
        { file: "rumble", at: 0.4, gainDb: -9 },
        { file: "coin", at: 2.79, gainDb: -6 },
        { file: "splash", at: 2.99, gainDb: -4 },
        { file: "coin", at: 4.79, gainDb: -6 },
      ],
      [
        { file: "rumble", at: 0.3, gainDb: -4 },
        { file: "magic", at: 2, gainDb: -4 },
        { file: "rumble", at: 2.8, gainDb: -4 },
        { file: "shimmer", at: 3.4, gainDb: -6 },
        { file: "thud", at: 4, gainDb: -6 },
      ],
      [
        { file: "drums", at: 0.1, gainDb: -2 },
        { file: "slam", at: 1.3, gainDb: -2 },
        { file: "slam", at: 1.6, gainDb: -3 },
        { file: "cannon", at: 2.3, gainDb: -3 },
        { file: "roar", at: 2.45, gainDb: -3 },
        { file: "boom", at: 3.6, gainDb: -6 },
      ],
    ],
    ending: [
      [
        { file: "clank", at: 0.85, gainDb: 0 },
        { file: "ring", at: 0.9, gainDb: -6 },
        { file: "clank", at: 1.35, gainDb: -6 },
        { file: "skid", at: 1.9, gainDb: -8 },
        { file: "clank", at: 3.9, gainDb: -10 },
      ],
      [
        { file: "coin", at: 0.5, gainDb: -8 },
        { file: "crunch", at: 1.95, gainDb: 0 },
        { file: "stones", at: 2.05, gainDb: -4 },
        { file: "growl", at: 2.3, gainDb: -2 },
      ],
      [
        { file: "roar", at: 0.35, gainDb: 0 },
        { file: "drums", at: 0.7, gainDb: -4 },
        { file: "clank", at: 2.25, gainDb: -2 },
        { file: "ring", at: 2.3, gainDb: -8 },
        { file: "shimmer", at: 3, gainDb: -4 },
      ],
      [
        { file: "lid", at: 0.55, gainDb: -2 },
        { file: "magic", at: 0.6, gainDb: -4 },
        { file: "shimmer", at: 0.9, gainDb: -8 },
        { file: "paper", at: 2.2, gainDb: -3 },
        { file: "thud", at: 3.25, gainDb: -2 },
        { file: "magic", at: 3.3, gainDb: -8 },
      ],
      [
        { file: "rumble", at: 0, gainDb: -4 },
        { file: "rumble", at: 1.3, gainDb: -2 },
        { file: "wind", at: 2.4, gainDb: -3 },
        { file: "shimmer", at: 3.1, gainDb: -4 },
      ],
    ],
  },
};

const GLOWCAP_HOLLOWS: StoryRegion = {
  key: "glowcapHollows",
  root: "/story/glowcap-hollows/v1",
  map: "/battle/glowcap-hollows-region.webp",
  lines: {
    opening: narration,
    boss: [
      ["narrator", "glimmerbough"],
      ["hero", "glimmerbough"],
      ["glimmerbough", "glimmerbough", "hero"],
      ["hero", "glimmerbough", "hero"],
      ["glimmerbough", "hero"],
    ],
    ending: [
      ["narrator"],
      ["narrator"],
      ["narrator"],
      ["narrator", "glimmerbough", "lethiel"],
      ["narrator"],
    ],
  },
  cues: {
    opening: [
      [
        { file: "rumble", at: 0, gainDb: -8 },
        { file: "wind", at: 1.2, gainDb: -4 },
        { file: "whoosh", at: 1.55, gainDb: -4 },
        { file: "shimmer", at: 2, gainDb: -5 },
        { file: "chime", at: 2.45, gainDb: -8 },
        { file: "chime-high", at: 2.95, gainDb: -9 },
        { file: "magic", at: 3.2, gainDb: -6 },
        { file: "boom", at: 3.95, gainDb: -12 },
      ],
      [
        { file: "chime", at: 0.9, gainDb: -10 },
        { file: "chime-high", at: 1.6, gainDb: -11 },
        { file: "chime", at: 2.3, gainDb: -12 },
        { file: "shimmer", at: 3.4, gainDb: -8 },
        { file: "creak", at: 3.6, gainDb: -6 },
        { file: "drip", at: 5.7, gainDb: -6 },
      ],
      [
        { file: "shimmer", at: 1.25, gainDb: -6 },
        { file: "slam", at: 1.9, gainDb: -3 },
        { file: "thud", at: 1.9, gainDb: -6 },
        { file: "slam", at: 2.25, gainDb: -4 },
        { file: "slam", at: 2.6, gainDb: -4 },
        { file: "snap", at: 3.75, gainDb: -2 },
      ],
      [
        { file: "bow", at: 1.35, gainDb: -4 },
        { file: "whoosh", at: 1.95, gainDb: -2 },
        { file: "hit", at: 2.3, gainDb: 0 },
        { file: "drip", at: 5.8, gainDb: -8 },
      ],
      [
        { file: "chime", at: 0.7, gainDb: -10 },
        { file: "chime-high", at: 1.5, gainDb: -10 },
        { file: "chime", at: 2.2, gainDb: -9 },
        { file: "chime-high", at: 2.9, gainDb: -9 },
        { file: "chime", at: 3.6, gainDb: -8 },
        { file: "shimmer", at: 4.4, gainDb: -6 },
      ],
    ],
    boss: [
      [
        { file: "chime", at: 0.5, gainDb: -10 },
        { file: "chime-high", at: 1.3, gainDb: -10 },
        { file: "chime", at: 2.1, gainDb: -9 },
        { file: "creak", at: 2.8, gainDb: -3 },
        { file: "shimmer", at: 3, gainDb: -5 },
        { file: "magic", at: 4, gainDb: -8 },
      ],
      [
        { file: "magic", at: 0.2, gainDb: -5 },
        { file: "shimmer", at: 1, gainDb: -6 },
        { file: "chime-high", at: 1.9, gainDb: -4 },
        { file: "boom", at: 2, gainDb: -10 },
        { file: "thud", at: 3.2, gainDb: -4 },
      ],
      [
        { file: "paper", at: 0.75, gainDb: -4 },
        { file: "paper", at: 1.45, gainDb: -6 },
        { file: "chime", at: 1.85, gainDb: -9 },
        { file: "chime-high", at: 2.6, gainDb: -9 },
        { file: "whoosh", at: 3.2, gainDb: -8 },
        { file: "snap", at: 4, gainDb: -4 },
      ],
      [
        { file: "creak", at: 0.25, gainDb: -5 },
        { file: "rumble", at: 2, gainDb: -6 },
        { file: "shimmer", at: 2.6, gainDb: -4 },
        { file: "drip", at: 3.7, gainDb: -8 },
        { file: "chime", at: 3.9, gainDb: -10 },
      ],
      [
        { file: "drums", at: 0.1, gainDb: -2 },
        { file: "creak", at: 0.9, gainDb: -3 },
        { file: "slam", at: 1.9, gainDb: -2 },
        { file: "thud", at: 2.5, gainDb: 0 },
        { file: "magic", at: 2.9, gainDb: -5 },
        { file: "shimmer", at: 3.6, gainDb: -4 },
        { file: "boom", at: 3.6, gainDb: -8 },
      ],
    ],
    ending: [
      [
        { file: "creak", at: 0.4, gainDb: -3 },
        { file: "wind", at: 1, gainDb: -6 },
        { file: "creak", at: 1.7, gainDb: -6 },
        { file: "shimmer", at: 2.3, gainDb: -8 },
        { file: "chime", at: 3, gainDb: -10 },
      ],
      [
        { file: "coin", at: 0.75, gainDb: -3 },
        { file: "paper", at: 0.95, gainDb: -4 },
        { file: "paper", at: 1.65, gainDb: -5 },
        { file: "paper", at: 2.1, gainDb: -6 },
        { file: "magic", at: 2.8, gainDb: -9 },
        { file: "thud", at: 3.7, gainDb: -2 },
        { file: "boom", at: 3.7, gainDb: -10 },
      ],
      [
        { file: "lid", at: 0.35, gainDb: -3 },
        { file: "shimmer", at: 0.7, gainDb: -5 },
        { file: "whoosh", at: 1.6, gainDb: -10 },
        { file: "boom", at: 3.2, gainDb: -12 },
        { file: "chime", at: 3.3, gainDb: -12 },
      ],
      [
        { file: "wind", at: 0, gainDb: -4 },
        { file: "shimmer", at: 1, gainDb: -5 },
        { file: "chime-high", at: 2, gainDb: -9 },
        { file: "chime", at: 3, gainDb: -10 },
        { file: "magic", at: 3.1, gainDb: -6 },
      ],
      [
        { file: "whoosh", at: 0.6, gainDb: -6 },
        { file: "wind", at: 0.8, gainDb: -4 },
        { file: "shimmer", at: 2, gainDb: -4 },
        { file: "boom", at: 3.4, gainDb: -12 },
      ],
    ],
  },
};

/** The Regions with produced Story Scenes, by Region number. */
const STORY_REGIONS = new Map([
  [1, HEARTHVALE],
  [2, RED_MESAS],
  [3, GLOWCAP_HOLLOWS],
]);

/** The Story Scenes of a Region; a Region without them falls back to Hearthvale. */
const storyRegion = (region: number): StoryRegion =>
  STORY_REGIONS.get(region) ?? HEARTHVALE;

/**
 * Only Regions with produced Story Scenes have them. The Boss scene becomes
 * available when the Boss Stage opens: its previous Stage is won.
 */
export const availableStories = (
  profile: Profile,
  region: number
): readonly StoryKind[] => {
  if (
    !STORY_REGIONS.has(region) ||
    !isRegionUnlocked(profile.stageResults, region)
  ) {
    return [];
  }
  const boss = bossStage(region);
  if (!boss) {
    return ["opening"];
  }
  const before = STAGES.find(
    (stage) => stage.region === region && stage.number === boss.number - 1
  );
  const won = profile.stageResults[boss.id] !== undefined;
  const open = won || (before && (profile.stageResults[before.id] ?? 0) > 0);
  return won
    ? ["opening", "boss", "ending"]
    : open
      ? ["opening", "boss"]
      : ["opening"];
};

/**
 * One automatic scene per Region visit. A saved Boss win takes priority. The
 * Boss scene never starts on a visit: it starts from Fight on the Boss Stage.
 */
export const pendingStory = (
  profile: Profile,
  region: number
): StoryKind | null => {
  const seen = new Set(profile.seenStoryScenes);
  return (
    availableStories(profile, region).findLast(
      (kind) => kind !== "boss" && !seen.has(storyId(region, kind))
    ) ?? null
  );
};

/** True when Fight on `stageId` must first play the unseen Boss scene. */
export const pendingBossStory = (
  profile: Profile,
  stageId: string
): boolean => {
  const stage = STAGES.find((candidate) => candidate.id === stageId);
  return (
    stage?.boss === true &&
    availableStories(profile, stage.region).includes("boss") &&
    !profile.seenStoryScenes.includes(storyId(stage.region, "boss"))
  );
};

/** Completing and skipping have the same persistence rule; replay gives no reward. */
export const finishStory = (
  profile: Profile,
  region: number,
  kind: StoryKind
): Profile => {
  const seen = new Set(profile.seenStoryScenes);
  seen.add(storyId(region, kind));
  if (kind === "ending") {
    seen.add(storyId(region, "opening"));
    seen.add(storyId(region, "boss"));
  }
  return { ...profile, seenStoryScenes: [...seen] };
};

export const storyRoot = (region: number): string => storyRegion(region).root;

export const storyMap = (region: number): string => storyRegion(region).map;

export const storyMedia = (region: number, kind: StoryKind, moment: number) =>
  `${storyRoot(region)}/${kind}-0${moment + 1}`;

/** The speakers of each line of a Story Moment. */
export const storyLines = (
  region: number,
  kind: StoryKind,
  moment: number
): readonly StorySpeaker[] =>
  storyRegion(region).lines[kind][moment] ?? ["narrator"];

/** `story.hearthvale.boss.3b`: a moment with several lines adds a letter. */
export const storyLineKey = (
  region: number,
  kind: StoryKind,
  moment: number,
  line: number
): string => {
  const several = storyLines(region, kind, moment).length > 1;
  return `story.${storyRegion(region).key}.${kind}.${moment + 1}${several ? "abc".charAt(line) : ""}`;
};

export const storyCues = (
  region: number,
  kind: StoryKind,
  moment: number
): readonly StoryCue[] => storyRegion(region).cues[kind][moment] ?? [];
