import { BrowserKeyValueStore, IndexedDb } from "@effect/platform-browser";
import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { Atom } from "effect/reactivity";

import { Audio } from "@/core/audio/audio.service";
import { AppConfigLayer } from "@/core/config/env";
import { LoggerLayer } from "@/core/observability/logger";
import { PROFILE_DATABASE } from "@/features/profile/profile";
import { ProfileStore } from "@/features/profile/profile-store.service";

/**
 * Services for effectful atoms. It also builds during SSR when a server render
 * reads one of its atoms, so it holds nothing that needs the browser.
 */
export const appRuntime = Atom.runtime(LoggerLayer);

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
  ProfileStore.layer.pipe(
    Layer.provide(
      BrowserKeyValueStore.layerIndexedDb({ database: PROFILE_DATABASE })
    ),
    Layer.provide(IndexedDb.layerWindow)
  )
);

/**
 * The Player's audio. It needs the browser's Web Audio, so it is a managed
 * runtime that builds at the first sound, not during a server render.
 */
export const audioRuntime = ManagedRuntime.make(
  Audio.layer.pipe(
    Layer.provide(
      Layer.mergeAll(AppConfigLayer, FetchHttpClient.layer, LoggerLayer)
    )
  )
);
