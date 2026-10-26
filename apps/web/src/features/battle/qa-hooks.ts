import type { AtomRegistry } from "effect/reactivity";

import { qaEnabled } from "@/features/battle/qa";

/**
 * The QA hooks load in their own chunk, so a production first load does not
 * carry them. The import starts when this module loads, not when the Profile
 * is ready: a test can press a control as soon as the Town opens.
 */
const hooks = qaEnabled()
  ? import("@/features/battle/test-hooks")
  : Promise.resolve(null);

/** Installs the QA hooks for `search`, or returns undefined outside a QA build. */
export const installQaHooks = async (
  registry: AtomRegistry.AtomRegistry,
  search: string | null
): Promise<(() => void) | undefined> => {
  const module = await hooks;
  return module?.installTestHooks(registry, search);
};
