import { BrowserKeyValueStore, IndexedDb } from "@effect/platform-browser";
import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { Atom } from "effect/reactivity";

import { LoggerLayer } from "@/core/observability/logger";
import { CdnClient } from "@/features/cdn/cdn.service";
import { PROFILE_DATABASE } from "@/features/profile/profile";

/**
 * Services for effectful atoms. It also builds during SSR when a server render
 * reads one of its atoms, so it holds nothing that needs the browser.
 */
export const appRuntime = Atom.runtime(
  Layer.mergeAll(CdnClient.layer, LoggerLayer).pipe(
    Layer.provide(FetchHttpClient.layer)
  )
);

/**
 * `localStorage`, for `Atom.kvs` atoms. It is a separate runtime because the
 * server has no `localStorage`: those atoms give a server value with
 * `Atom.withServerValue`, so this runtime only builds in the browser.
 */
export const storageRuntime = Atom.runtime(
  BrowserKeyValueStore.layerLocalStorage
);

/**
 * IndexedDB, for the Profile (technical design 5). The Profile store runs its
 * reads and its ordered writes outside atoms, so this is a managed runtime. It
 * builds at the first read, so only in the browser.
 */
export const profileStoreRuntime = ManagedRuntime.make(
  BrowserKeyValueStore.layerIndexedDb({ database: PROFILE_DATABASE }).pipe(
    Layer.provide(IndexedDb.layerWindow)
  )
);
