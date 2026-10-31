import { Effect } from "effect";

import type { SoundName } from "@/core/audio/audio-sounds";
import { Audio } from "@/core/audio/audio.service";
import type {
  AudioService,
  PresentationAudio,
} from "@/core/audio/audio.service";
import type { MusicTrack } from "@/core/audio/music-catalog";
import { audioRuntime } from "@/core/runtime/client";

/**
 * The plain functions that event handlers call. The Audio service owns the
 * state; this module is the only bridge from React and the scene to it.
 */
const withAudio = <A>(run: (audio: AudioService) => Effect.Effect<A>) =>
  Effect.gen(function* () {
    const audio = yield* Audio;
    return yield* run(audio);
  });

/** A synchronous call, for a gesture or a settings change. */
const sync = <A>(run: (audio: AudioService) => Effect.Effect<A>): A =>
  audioRuntime.runSync(withAudio(run));

/** A call that loads a file, so it must not block the caller. */
const fork = (run: (audio: AudioService) => Effect.Effect<void>): void => {
  audioRuntime.runFork(withAudio(run));
};

/** Plays one sound. The same sound plays at most once in `minGap` ms. */
export const playSound = (name: SoundName, minGap = 50): void => {
  sync((audio) => audio.play(name, minGap));
};

/** Resumes the Audio context, and starts the track that waits for it. */
export const unlockAudio = (): void => {
  fork((audio) => audio.unlock());
};

/** Requests a music loop. Playback waits for the first Player gesture. */
export const playMusicTrack = (track: MusicTrack): void => {
  fork((audio) => audio.music(track));
};

/** Plays one result sting, ducking the loop, then restores it. */
export const playMusicSting = (result: "victory" | "defeat"): void => {
  fork((audio) => audio.sting(result));
};

/** Temporarily owns music playback; null restores the requested screen loop. */
export const playPresentation = (
  files: readonly PresentationAudio[] | null
): void => {
  fork((audio) => audio.presentation(files));
};

/** Replaces or cancels the cues of the current presentation moment. */
export const playPresentationCue = (
  files: readonly PresentationAudio[] | null
): void => {
  fork((audio) => audio.cue(files));
};
