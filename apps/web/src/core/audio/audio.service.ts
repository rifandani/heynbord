import { Cache, Context, Effect, Layer, Schedule } from "effect";
import { HttpClient } from "effect/http";

import type { SoundName } from "@/core/audio/audio-sounds";
import { makeSounds } from "@/core/audio/audio-sounds";
import type { MusicTrack } from "@/core/audio/music-catalog";
import { STING_FILES, TRACK_FILES, musicUrl } from "@/core/audio/music-files";
import { AppConfig } from "@/core/config/app-config";
import { failOnErrorStatus } from "@/core/http/api-error";
import { toErrorMessage } from "@/core/utils/error";

/** The three volumes and the two switches of the Mix (GLOSSARY). */
export interface Mix {
  readonly effectsVolume: number;
  readonly musicOn: boolean;
  readonly musicVolume: number;
  readonly soundOn: boolean;
  readonly soundVolume: number;
}

export const DEFAULT_MIX: Mix = {
  effectsVolume: 100,
  musicOn: true,
  musicVolume: 100,
  soundOn: true,
  soundVolume: 100,
};

/** A file owned by a temporary presentation, on an existing Mix channel. */
export interface PresentationAudio {
  readonly url: string;
  readonly bus: "music" | "effects";
  readonly gain?: number;
  readonly delaySeconds?: number;
}

export interface AudioService {
  readonly presentation: (
    files: readonly PresentationAudio[] | null
  ) => Effect.Effect<void>;
  readonly cue: (
    files: readonly PresentationAudio[] | null
  ) => Effect.Effect<void>;
  readonly music: (track: MusicTrack) => Effect.Effect<void>;
  readonly play: (name: SoundName, minGap?: number) => Effect.Effect<void>;
  readonly setMix: (mix: Mix) => Effect.Effect<void>;
  readonly sting: (result: "victory" | "defeat") => Effect.Effect<void>;
  readonly unlock: () => Effect.Effect<void>;
}

interface ActiveLoop {
  readonly gain: GainNode;
  readonly source: AudioBufferSourceNode;
  readonly track: MusicTrack;
}

interface AudioOptions {
  readonly baseUrl: string;
  readonly context: AudioContext | null;
  readonly loadBuffer: (url: string) => Effect.Effect<AudioBuffer | null>;
}

/** The master gain at Sound volume 100. */
const FULL_GAIN = 0.35;
const FADE_SECONDS = 1.25;
const DUCK_SECONDS = 0.18;
const STING_GAIN = 0.72;
const CACHE_CAPACITY = 32;

/** A volume, from 0 to 100, as a part of 1. */
const partOf = (percent: number): number =>
  Math.min(Math.max(percent, 0), 100) / 100;

/** The ear hears loudness on a curve, so the gain follows the square of the volume. */
const gainOf = (value: number): number => value ** 2;

/** The master gain, with the Sound switch and volume. */
const masterGainOf = (mix: Mix): number =>
  mix.soundOn ? FULL_GAIN * gainOf(partOf(mix.soundVolume)) : 0;

const normalizeMix = (mix: Mix): Mix => ({
  effectsVolume: Math.min(Math.max(mix.effectsVolume, 0), 100),
  musicOn: mix.musicOn,
  musicVolume: Math.min(Math.max(mix.musicVolume, 0), 100),
  soundOn: mix.soundOn,
  soundVolume: Math.min(Math.max(mix.soundVolume, 0), 100),
});

/** A browser context, or `null` where Web Audio is absent. */
const browserContext = (): AudioContext | null => {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return null;
  }
  try {
    return new AudioContext();
  } catch {
    return null;
  }
};

/** The bytes of one music file, decoded, or `null` when it did not load. */
const loadAudio = (
  client: HttpClient.HttpClient,
  context: AudioContext,
  url: string
): Effect.Effect<AudioBuffer | null> =>
  client.get(url).pipe(
    Effect.flatMap(failOnErrorStatus),
    Effect.flatMap((response) => response.arrayBuffer),
    Effect.flatMap((buffer) =>
      Effect.tryPromise({
        try: () => context.decodeAudioData(buffer),
        catch: (cause) => new Error("Cannot decode an audio file", { cause }),
      })
    ),
    // oxlint-disable-next-line promise/prefer-await-to-callbacks, promise/prefer-await-to-then -- Effect.catch is a typed recovery, not a Promise
    Effect.catch((error) =>
      Effect.logWarning(`Cannot load audio: ${toErrorMessage(error)}`).pipe(
        Effect.as(null)
      )
    )
  );

const stopSource = (source: AudioBufferSourceNode | null): void => {
  if (!source) {
    return;
  }
  try {
    source.stop();
  } catch {
    // A finished source needs no further stop.
  }
  source.disconnect();
};

const makeAudio = (options: AudioOptions): AudioService => {
  const { context } = options;
  const master = context?.createGain() ?? null;
  const effectsChannel = context?.createGain() ?? null;
  const musicChannel = context?.createGain() ?? null;
  const sounds =
    context && effectsChannel
      ? makeSounds({ context, destination: effectsChannel })
      : null;

  if (context && master && effectsChannel && musicChannel) {
    master.gain.value = masterGainOf(DEFAULT_MIX);
    effectsChannel.gain.value = gainOf(partOf(DEFAULT_MIX.effectsVolume));
    musicChannel.gain.value = gainOf(partOf(DEFAULT_MIX.musicVolume));
    effectsChannel.connect(master);
    musicChannel.connect(master);
    master.connect(context.destination);
  }

  let mix = DEFAULT_MIX;
  let active: ActiveLoop | null = null;
  let desiredTrack: MusicTrack | null = null;
  let activeSting: AudioBufferSourceNode | null = null;
  let stingPlaying = false;
  let presentationFiles: readonly PresentationAudio[] | null = null;
  let presentationRevision = 0;
  let startingPresentation = -1;
  let cueRevision = 0;
  const cueSources = new Set<AudioBufferSourceNode>();
  const presentationSources = new Set<AudioBufferSourceNode>();
  const lastPlayed = new Map<SoundName, number>();

  const setChannel = (channel: GainNode | null, target: number): void => {
    if (context && channel) {
      channel.gain.setTargetAtTime(target, context.currentTime, 0.02);
    }
  };

  /** Applies the Mix to the three gains. A change applies to sounds that play now too. */
  const applyMix = (): void => {
    setChannel(master, masterGainOf(mix));
    setChannel(effectsChannel, gainOf(partOf(mix.effectsVolume)));
    setChannel(musicChannel, mix.musicOn ? gainOf(partOf(mix.musicVolume)) : 0);
  };

  const fadeOut = (loop: ActiveLoop, now: number): void => {
    loop.gain.gain.cancelScheduledValues(now);
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, now);
    loop.gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    loop.source.stop(now + FADE_SECONDS + 0.05);
  };

  const startTrack = (track: MusicTrack): Effect.Effect<void> =>
    Effect.gen(function* () {
      if (
        !context ||
        presentationFiles !== null ||
        !musicChannel ||
        context.state !== "running" ||
        active?.track === track
      ) {
        return;
      }
      const buffer = yield* options.loadBuffer(
        musicUrl(options.baseUrl, TRACK_FILES[track])
      );
      if (
        !buffer ||
        desiredTrack !== track ||
        presentationFiles !== null ||
        context.state !== "running" ||
        active?.track === track
      ) {
        return;
      }

      const now = context.currentTime;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(
        stingPlaying ? 0 : 1,
        now + FADE_SECONDS
      );
      source.connect(gain).connect(musicChannel);
      source.start(now);

      const previous = active;
      active = { gain, source, track };
      if (previous) {
        fadeOut(previous, now);
      }
    });

  const startFile = Effect.fn("Audio.startFile")(function* (
    file: PresentationAudio,
    current: () => boolean
  ) {
    if (!context || context.state !== "running") {
      return null;
    }
    const buffer = yield* options.loadBuffer(file.url);
    const channel = file.bus === "music" ? musicChannel : effectsChannel;
    if (!buffer || !channel || !current() || context.state !== "running") {
      return null;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = file.gain ?? 1;
    source.connect(gain).connect(channel);
    source.start(context.currentTime + (file.delaySeconds ?? 0));
    return source;
  });

  const startPresentation = Effect.fn("Audio.startPresentation")(function* () {
    const revision = presentationRevision;
    if (
      !presentationFiles ||
      presentationSources.size > 0 ||
      startingPresentation === revision
    ) {
      return;
    }
    startingPresentation = revision;
    try {
      yield* Effect.forEach(
        presentationFiles,
        (file) =>
          startFile(file, () => revision === presentationRevision).pipe(
            Effect.map((source) => {
              if (source) {
                presentationSources.add(source);
              }
              return source;
            })
          ),
        { concurrency: "unbounded" }
      );
    } finally {
      if (startingPresentation === revision) {
        startingPresentation = -1;
      }
    }
  });

  const cue = Effect.fn("Audio.cue")(function* (
    files: readonly PresentationAudio[] | null
  ) {
    cueRevision += 1;
    const revision = cueRevision;
    for (const source of cueSources) {
      stopSource(source);
    }
    cueSources.clear();
    if (files && presentationFiles !== null) {
      yield* Effect.forEach(
        files,
        (file) =>
          startFile(
            file,
            () => revision === cueRevision && presentationFiles !== null
          ).pipe(
            Effect.map((source) => {
              if (revision !== cueRevision) {
                stopSource(source);
                return null;
              }
              if (source) {
                cueSources.add(source);
              }
              return source;
            })
          ),
        { concurrency: "unbounded" }
      );
    }
  });

  const presentation = Effect.fn("Audio.presentation")(function* (
    files: readonly PresentationAudio[] | null
  ) {
    presentationRevision += 1;
    presentationFiles = files;
    yield* cue(null);
    for (const source of presentationSources) {
      stopSource(source);
    }
    presentationSources.clear();
    if (files) {
      stopSource(active?.source ?? null);
      active = null;
      stopSource(activeSting);
      activeSting = null;
      stingPlaying = false;
      yield* startPresentation();
    } else if (desiredTrack) {
      yield* startTrack(desiredTrack);
    }
  });

  const unlock = Effect.fn("Audio.unlock")(function* () {
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      yield* Effect.tryPromise({
        try: () => context.resume(),
        catch: () => null,
      }).pipe(Effect.ignore);
    }
    if (presentationFiles !== null) {
      yield* startPresentation();
    } else if (desiredTrack) {
      yield* startTrack(desiredTrack);
    }
  });

  const music = Effect.fn("Audio.music")(function* (track: MusicTrack) {
    desiredTrack = track;
    yield* startTrack(track);
  });

  const play = Effect.fn("Audio.play")((name: SoundName, minGap = 50) =>
    Effect.sync(() => {
      if (
        !context ||
        !sounds ||
        context.state !== "running" ||
        !mix.soundOn ||
        mix.soundVolume === 0 ||
        mix.effectsVolume === 0
      ) {
        return;
      }
      const now = context.currentTime * 1000;
      if (now - (lastPlayed.get(name) ?? -Infinity) < minGap) {
        return;
      }
      lastPlayed.set(name, now);
      sounds[name]();
    })
  );

  const sting = Effect.fn("Audio.sting")(function* (
    result: "victory" | "defeat"
  ) {
    if (
      !context ||
      presentationFiles !== null ||
      !musicChannel ||
      context.state !== "running"
    ) {
      return;
    }
    const revision = presentationRevision;
    const buffer = yield* options.loadBuffer(
      musicUrl(options.baseUrl, STING_FILES[result])
    );
    if (
      !buffer ||
      revision !== presentationRevision ||
      presentationFiles !== null ||
      context.state !== "running"
    ) {
      return;
    }

    const now = context.currentTime;
    const loop = active;
    stingPlaying = true;
    if (loop) {
      loop.gain.gain.cancelScheduledValues(now);
      loop.gain.gain.setValueAtTime(loop.gain.gain.value, now);
      loop.gain.gain.linearRampToValueAtTime(0, now + DUCK_SECONDS);
    }

    if (activeSting) {
      try {
        activeSting.stop(now);
      } catch {
        // A finished sting can no longer stop.
      }
    }

    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(STING_GAIN, now);
    source.connect(gain).connect(musicChannel);
    activeSting = source;
    source.addEventListener("ended", () => {
      if (activeSting !== source) {
        return;
      }
      activeSting = null;
      stingPlaying = false;
      if (active) {
        const endedAt = context.currentTime;
        active.gain.gain.cancelScheduledValues(endedAt);
        active.gain.gain.setValueAtTime(0, endedAt);
        active.gain.gain.linearRampToValueAtTime(1, endedAt + DUCK_SECONDS);
      }
    });
    source.start(now + DUCK_SECONDS);
  });

  const setMix = Effect.fn("Audio.setMix")((next: Mix) =>
    Effect.sync(() => {
      mix = normalizeMix(next);
      applyMix();
    })
  );

  return { music, play, setMix, sting, unlock, presentation, cue };
};

/**
 * The Player's audio: the Mix, the sounds made with Web Audio, and the music
 * loops. The service owns the context and the Mix; components never do.
 */
export class Audio extends Context.Service<Audio, AudioService>()(
  "@heynbord/web/Audio"
) {
  static readonly layer = Layer.effect(
    Audio,
    Effect.gen(function* () {
      const client = (yield* HttpClient.HttpClient).pipe(
        // A GET of a static file is idempotent: retry network errors and 5xx.
        HttpClient.retryTransient({
          schedule: Schedule.exponential("100 millis"),
          times: 2,
        })
      );
      const config = yield* AppConfig;
      const context = browserContext();
      if (!context) {
        return makeAudio({
          baseUrl: config.assetBaseUrl,
          context,
          loadBuffer: () => Effect.succeed(null),
        });
      }
      const cache = yield* Cache.make({
        capacity: CACHE_CAPACITY,
        lookup: (url: string) => loadAudio(client, context, url),
      });
      return makeAudio({
        baseUrl: config.assetBaseUrl,
        context,
        loadBuffer: (url) => Cache.get(cache, url),
      });
    })
  );

  /** A layer over a context and a loader that a test gives. */
  static layerWith(options: {
    readonly context: AudioContext | null;
    readonly load: (url: string) => Effect.Effect<AudioBuffer | null>;
  }) {
    return Layer.effect(
      Audio,
      Effect.gen(function* () {
        const cache = yield* Cache.make({
          capacity: CACHE_CAPACITY,
          lookup: options.load,
        });
        return makeAudio({
          baseUrl: "/",
          context: options.context,
          loadBuffer: (url) => Cache.get(cache, url),
        });
      })
    );
  }
}
