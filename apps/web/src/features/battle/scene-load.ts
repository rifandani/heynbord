import { useLayoutEffect } from "react";

/**
 * The loads that must end before the Battle shows: the Battle Painting, the
 * 3D chunk and each file that a Board part or a Unit waits for. The loading
 * cover stays over the Battle until the scene says `ready`, so no part of the
 * Board appears late.
 */
export interface SceneLoad {
  /** The Battle stage is in the page and its loads can start. */
  readonly started: boolean;
  /** The loads that started since `start`. */
  readonly opened: number;
  /** The loads that did not end yet. */
  readonly pending: number;
  /** The scene drew its first frames with every load done. */
  readonly ready: boolean;
  /**
   * Counts each change to `ready`. It never goes back, so the cover can tell
   * a new reveal from one that it already showed.
   */
  readonly reveal: number;
}

const EMPTY = {
  started: false,
  opened: 0,
  pending: 0,
  ready: false,
} as const;

let snapshot: SceneLoad = { ...EMPTY, reveal: 0 };
const holds = new Set<symbol>();
const listeners = new Set<() => void>();

const publish = (next: SceneLoad) => {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
};

export const sceneLoad = {
  /** The Battle stage mounted. */
  start() {
    if (!snapshot.started) {
      publish({ ...snapshot, started: true });
    }
  },
  /**
   * Marks one load. The returned release ends it; a second call does nothing,
   * and a release after `reset` does nothing.
   */
  hold(): () => void {
    const token = Symbol("scene-load");
    holds.add(token);
    publish({
      ...snapshot,
      opened: snapshot.opened + 1,
      pending: holds.size,
    });
    return () => {
      if (holds.delete(token)) {
        publish({ ...snapshot, pending: holds.size });
      }
    };
  },
  ready() {
    if (!snapshot.ready) {
      publish({ ...snapshot, ready: true, reveal: snapshot.reveal + 1 });
    }
  },
  /** The Battle stage left the page: the next Battle loads from the start. */
  reset() {
    holds.clear();
    publish({ ...EMPTY, reveal: snapshot.reveal });
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: (): SceneLoad => snapshot,
};

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

/** The part of the load bar for each step. */
const CODE_SHARE = 0.06;
const MODELS_END = 0.68;
const SCENE_END = 0.96;

/**
 * The part of the load that is done, from 0 to 1: the Battle code, then the
 * Unit Model files, then the scene loads. The cover shows the largest value
 * so far, so the bar never moves back when a new load starts.
 */
export const loadShare = (
  models: { readonly done: number; readonly total: number } | null,
  scene: SceneLoad
): number => {
  if (scene.ready) {
    return 1;
  }
  if (scene.started) {
    const done =
      scene.opened === 0 ? 0 : (scene.opened - scene.pending) / scene.opened;
    return MODELS_END + (SCENE_END - MODELS_END) * done;
  }
  if (models && models.total > 0) {
    return (
      CODE_SHARE + (MODELS_END - CODE_SHARE) * (models.done / models.total)
    );
  }
  return CODE_SHARE;
};

/** The step that the cover names. */
export type LoadStep = "units" | "board" | "ready";

export const loadStep = (scene: SceneLoad): LoadStep => {
  if (scene.ready) {
    return "ready";
  }
  return scene.started ? "board" : "units";
};
