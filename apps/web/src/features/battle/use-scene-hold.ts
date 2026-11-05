import { useLayoutEffect } from "react";

import { sceneLoad } from "@/features/battle/scene-load";

/**
 * Holds the cover while `active`. It is a layout effect, so the hold is in
 * place in the same commit as the part that waits, before the first frame.
 */
export const useSceneHold = (active: boolean): void => {
  useLayoutEffect(() => (active ? sceneLoad.hold() : undefined), [active]);
};

/** A Suspense fallback that holds the cover until its content mounts. */
export const SceneHold = () => {
  useSceneHold(true);
  return null;
};
