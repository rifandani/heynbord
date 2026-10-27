import { BrowserKeyValueStore, IndexedDb } from "@effect/platform-browser";
import { Layer } from "effect";
import { Atom } from "effect/reactivity";

import { PROFILE_DATABASE } from "@/features/profile/profile";
import { ProfileStore } from "@/features/profile/profile-store.service";

/**
 * The browser services that effect atoms need (technical design 5). The layer
 * holds IndexedDB and the Profile store. It builds only in the browser: the
 * Play route is `ssr: false`, and no server render reads these atoms.
 */
const BrowserServicesLayer = ProfileStore.layer.pipe(
  Layer.provide(
    BrowserKeyValueStore.layerIndexedDb({ database: PROFILE_DATABASE })
  ),
  Layer.provide(IndexedDb.layerWindow)
);

/**
 * The browser Atom runtime. A feature builds its effect atoms on this runtime,
 * or on a test runtime with the same service layer. The registry owns the
 * fibers, so a component mounts them with the atom hooks and does not call
 * `Effect.runPromise` or `Effect.runFork`.
 */
export const browserRuntime = Atom.runtime(BrowserServicesLayer);
