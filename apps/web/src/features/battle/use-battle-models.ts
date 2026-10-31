import { use } from "react";

import { modelProgress } from "@/features/battle/battle-model-progress";
import type { BattleSession } from "@/features/battle/battle-session";
import { battleUnitSources, sourceId } from "@/features/battle/card-art";
import { createModelLoader } from "@/features/battle/scene/gltf-loader";
import { requireUnitModel } from "@/features/battle/scene/unit-models";

/**
 * Unit Models are texture-free and use Meshopt. The Battle scene keeps its
 * own KTX2-capable loader; this one only warms the files before the Board
 * mounts.
 */
const loader = createModelLoader();

const loaded = new Map<string, Promise<boolean>>();

const loadModel = (url: string): Promise<boolean> => {
  const existing = loaded.get(url);
  if (existing) {
    return existing;
  }
  const pending = (async (): Promise<boolean> => {
    try {
      await loader.loadAsync(url);
      return true;
    } catch {
      // A failed file can try again on Retry.
      loaded.delete(url);
      return false;
    }
  })();
  loaded.set(url, pending);
  return pending;
};

/** Every Unit Model that can appear in one Battle: both Decks, start Units, Tokens and summons. */
const battleModelUrls = (session: BattleSession): readonly string[] =>
  [
    ...new Set(
      battleUnitSources(session.rules).map(
        (source) => requireUnitModel(sourceId(source)).url
      )
    ),
  ].toSorted();

const preloadBattleModels = async (
  urls: readonly string[]
): Promise<readonly string[]> => {
  // Do not publish progress during the render that starts the preload.
  await Promise.resolve();
  modelProgress.begin(urls.length);
  const results = await Promise.all(
    urls.map(async (url) => {
      const ok = await loadModel(url);
      modelProgress.step();
      return ok;
    })
  );
  modelProgress.end();
  return urls.filter((_, index) => !results[index]);
};

/**
 * One preload for one set of Unit Models. A Suspense retry can remount the
 * component that waits, so the promise lives outside React. A failed set
 * stays cached until `clearBattleModels`, so a retry does not request it in a
 * loop.
 */
const preloads = new Map<string, Promise<readonly string[]>>();

const preloadFor = (urls: readonly string[]): Promise<readonly string[]> => {
  const key = urls.join("\n");
  const existing = preloads.get(key);
  if (existing) {
    return existing;
  }
  const pending = preloadBattleModels(urls);
  preloads.set(key, pending);
  return pending;
};

/** Removes the cached result of a failed set, so Retry loads the files again. */
export const clearBattleModels = (session: BattleSession): void => {
  preloads.delete(battleModelUrls(session).join("\n"));
};

/**
 * Waits for every Unit Model of the Battle before the Board shows. A failed
 * file returns its URL. The caller remounts this hook to retry.
 */
export const useBattleModels = (session: BattleSession) =>
  use(preloadFor(battleModelUrls(session)));
