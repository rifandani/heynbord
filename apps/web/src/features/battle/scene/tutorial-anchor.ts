import type { TutorialStep } from "@/features/battle/tutorial";
import type { ScreenBox } from "@/features/battle/tutorial-placement";

/**
 * Finds where a Tutorial Step points on the screen, so its text shows next to
 * the Board area that it tells about. The Tutorial marks in the scene set it.
 * Before the scene mounts, or with no WebGL 2, it finds nothing.
 */
interface TutorialAnchor {
  box: (step: TutorialStep) => ScreenBox | null;
}

export const tutorialAnchor: TutorialAnchor = {
  box: () => null,
};
