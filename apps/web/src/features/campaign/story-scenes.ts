import type { Profile } from "@workspace/rules";
import { isRegionUnlocked, STAGES } from "@workspace/rules";

export type StoryKind = "opening" | "boss" | "ending";

/** Who says a line. Narration has no name plate. */
export type StorySpeaker = "narrator" | "baron" | "hero";

/** Stable IDs belong to the Profile. Media and text stay in the web app. */
const storyId = (region: number, kind: StoryKind): string =>
  `region-${region}-${kind}`;

const bossStage = (region: number) =>
  STAGES.find((stage) => stage.region === region && stage.boss);

/**
 * Only Hearthvale has production Story Scenes in this trial. The Boss scene
 * becomes available when the Boss Stage opens: its previous Stage is won.
 */
export const availableStories = (
  profile: Profile,
  region: number
): readonly StoryKind[] => {
  if (region !== 1 || !isRegionUnlocked(profile.stageResults, region)) {
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

/** Versioned URLs prevent a later export from changing a cached Story Moment. */
export const STORY_ROOT = "/story/hearthvale/v2";
export const STORY_MOMENTS = 5;
/** Each clip finishes its action here; the rest loops while the Player reads. */
export const STORY_LOOP_START = 5;
export const storyMedia = (kind: StoryKind, moment: number) =>
  `${STORY_ROOT}/${kind}-0${moment + 1}`;

/**
 * The speaker of each line, per Story Moment. Continue shows the next line;
 * the clip changes only at the next moment.
 */
export const STORY_LINES: Record<
  StoryKind,
  readonly (readonly StorySpeaker[])[]
> = {
  opening: Array.from({ length: STORY_MOMENTS }, () => ["narrator"]),
  boss: [
    ["narrator", "baron"],
    ["baron", "hero"],
    ["baron", "baron", "hero"],
    ["hero", "baron", "baron"],
    ["baron", "hero"],
  ],
  ending: Array.from({ length: STORY_MOMENTS }, () => ["narrator"]),
};

/** `story.hearthvale.boss.3b`: a moment with several lines adds a letter. */
export const storyLineKey = (
  kind: StoryKind,
  moment: number,
  line: number
): string => {
  const several = (STORY_LINES[kind][moment]?.length ?? 1) > 1;
  return `story.hearthvale.${kind}.${moment + 1}${several ? "abc".charAt(line) : ""}`;
};

export interface StoryCue {
  readonly file: string;
  readonly at: number;
  readonly gainDb: number;
}

/**
 * Effect cues per Story Moment, in seconds from the start of its clip. The
 * same table is `CUES` in scripts/campaign-story/hearthvale/src/audio.rs.
 */
export const STORY_CUES: Record<StoryKind, readonly (readonly StoryCue[])[]> = {
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
};
