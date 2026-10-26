import { Schema } from "effect";
import { Atom } from "effect/reactivity";

import { storageRuntime } from "@/core/runtime/client";

/** The storage key of the reduced motion choice. */
const REDUCED_MOTION_STORAGE_KEY = "heynbord.reduced-motion";

/** The storage key of the effects volume. */
const EFFECTS_VOLUME_STORAGE_KEY = "heynbord.effects-volume";

/** The storage key of the music volume. */
const MUSIC_VOLUME_STORAGE_KEY = "heynbord.music-volume";
const MUSIC_ON_STORAGE_KEY = "heynbord.music-on";

/** A volume from 0 to 100. */
const Volume = Schema.Int.check(Schema.isBetween({ maximum: 100, minimum: 0 }));

/**
 * The effects volume, 0 to 100, from the Settings dialog. The master Sound
 * switch stays apart from it.
 */
export const effectsVolumeAtom = Atom.kvs({
  defaultValue: () => 100,
  key: EFFECTS_VOLUME_STORAGE_KEY,
  runtime: storageRuntime,
  schema: Volume,
}).pipe(Atom.withServerValue(() => 100));

/**
 * True when the Player wants music.
 */
export const musicOnAtom = Atom.kvs({
  defaultValue: () => true,
  key: MUSIC_ON_STORAGE_KEY,
  runtime: storageRuntime,
  schema: Schema.Boolean,
}).pipe(Atom.withServerValue(() => true));

/**
 * The music volume, 0 to 100, from the Settings dialog.
 */
export const musicVolumeAtom = Atom.kvs({
  defaultValue: () => 100,
  key: MUSIC_VOLUME_STORAGE_KEY,
  runtime: storageRuntime,
  schema: Volume,
}).pipe(Atom.withServerValue(() => 100));

/**
 * True when the Player asks for reduced motion. The operating system setting
 * also applies: `useReducedMotion` combines the two.
 */
export const reducedMotionAtom = Atom.kvs({
  defaultValue: () => false,
  key: REDUCED_MOTION_STORAGE_KEY,
  runtime: storageRuntime,
  schema: Schema.Boolean,
}).pipe(Atom.withServerValue(() => false));
