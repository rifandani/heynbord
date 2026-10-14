import type { StageDefinition } from "../content/schema";
import { STAGES } from "../content/stages";
/**
 * The Region unlock rule of the Campaign (GDD 8.1). It is pure, as the other
 * Profile actions. The Profile keeps no Region field: the won Stages give it.
 */
import { CAMPAIGN_REGIONS } from "../content/star-chests";
import type { Profile } from "./schema";

/**
 * True when the Player can play the Stages of `region`: Region 1, or a Region
 * whose previous Region has a won Boss Stage. A Region after a Region with no
 * Boss Stage yet stays locked.
 */
export const isRegionUnlocked = (
  stageResults: Profile["stageResults"],
  region: number,
  stages: readonly StageDefinition[] = STAGES
): boolean => {
  if (region === 1) {
    return true;
  }
  const boss = stages.find(
    (stage) => stage.region === region - 1 && stage.boss
  );
  return boss !== undefined && stageResults[boss.id] !== undefined;
};

/** The highest Region that the Player can play: the Campaign screen opens it. */
export const newestUnlockedRegion = (
  stageResults: Profile["stageResults"],
  stages: readonly StageDefinition[] = STAGES
): number => {
  let region = 1;
  while (
    region < CAMPAIGN_REGIONS &&
    isRegionUnlocked(stageResults, region + 1, stages)
  ) {
    region += 1;
  }
  return region;
};

/** The Boss Stage whose first win unlocks `region`, or `null` for Region 1 or a Region whose previous Region has no Boss Stage yet. */
export const unlockingBossStage = (
  region: number,
  stages: readonly StageDefinition[] = STAGES
): StageDefinition | null =>
  region === 1
    ? null
    : (stages.find((stage) => stage.region === region - 1 && stage.boss) ??
      null);
