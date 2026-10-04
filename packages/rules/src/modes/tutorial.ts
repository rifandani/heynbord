/** The Stage of the Tutorial (GDD 8.3). */
export const TUTORIAL_STAGE_ID = "1-1";

/**
 * True when this play of a Stage is the Tutorial (GDD 8.3, web ADR-0004): each
 * play of Stage 1-1 until its first win. A loss or an Abandon records no win,
 * so the next play is the Tutorial again. The Stage results of the Profile
 * give `wonTutorialStage`.
 */
export const isTutorial = (
  stageId: string,
  wonTutorialStage: boolean
): boolean => stageId === TUTORIAL_STAGE_ID && !wonTutorialStage;
