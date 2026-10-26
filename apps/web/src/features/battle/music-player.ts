import { musicOutput, onAudioUnlocked } from "@/features/battle/battle-audio";
import type { MusicTrack } from "@/features/battle/music-catalog";

const FADE_SECONDS = 1.25;
const DUCK_SECONDS = 0.18;
const STING_GAIN = 0.72;

const TRACK_FILES: Readonly<Record<MusicTrack, string>> = {
  town: "town.ogg",
  "region-1": "region-1.ogg",
  "region-2": "region-2.ogg",
  "region-3": "region-3.ogg",
  "region-4": "region-4.mp3",
  "region-5": "region-5.mp3",
  boss: "boss.ogg",
  heynspire: "heynspire.ogg",
  dungeons: "dungeons.ogg",
  workshop: "workshop.mp3",
  packs: "packs.ogg",
  bazaar: "bazaar.mp3",
  seaport: "seaport.ogg",
  hero: "hero.mp3",
  achievements: "achievements.mp3",
};

const STING_FILES = {
  victory: "victory.ogg",
  defeat: "defeat.ogg",
} as const;

interface ActiveLoop {
  readonly source: AudioBufferSourceNode;
  readonly gain: GainNode;
  readonly track: MusicTrack;
}

let active: ActiveLoop | null = null;
let desiredTrack: MusicTrack | null = null;
let activeSting: AudioBufferSourceNode | null = null;
let stingPlaying = false;
const audioBuffers = new Map<string, Promise<AudioBuffer | null>>();

const musicUrl = (file: string): string =>
  `${import.meta.env.BASE_URL}music/${file}`;

const fetchBuffer = async (
  context: AudioContext,
  file: string,
  url: string
): Promise<AudioBuffer | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Music file request failed: ${file}`);
    }
    return await context.decodeAudioData(await response.arrayBuffer());
  } catch {
    return null;
  }
};

const loadBuffer = (
  context: AudioContext,
  file: string
): Promise<AudioBuffer | null> => {
  const url = musicUrl(file);
  const cached = audioBuffers.get(url);
  if (cached) {
    return cached;
  }

  const pending = fetchBuffer(context, file, url);
  audioBuffers.set(url, pending);
  return pending;
};

const fadeOut = (loop: ActiveLoop, now: number): void => {
  loop.gain.gain.cancelScheduledValues(now);
  loop.gain.gain.setValueAtTime(loop.gain.gain.value, now);
  loop.gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
  loop.source.stop(now + FADE_SECONDS + 0.05);
};

const startMusicTrack = async (track: MusicTrack): Promise<void> => {
  const output = musicOutput();
  if (!output || output.context.state !== "running") {
    return;
  }
  if (active?.track === track) {
    return;
  }

  const { context, destination } = output;
  const buffer = await loadBuffer(context, TRACK_FILES[track]);
  if (
    !buffer ||
    desiredTrack !== track ||
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
  gain.gain.linearRampToValueAtTime(stingPlaying ? 0 : 1, now + FADE_SECONDS);
  source.connect(gain).connect(destination);
  source.start(now);

  const previous = active;
  active = { source, gain, track };
  if (previous) {
    fadeOut(previous, now);
  }
};

/** Requests a loop. Playback waits for the first Player gesture. */
export const playMusicTrack = (track: MusicTrack): void => {
  desiredTrack = track;
  void startMusicTrack(track);
};

/** Plays one open-license result sting and restores the current loop. */
export const playMusicSting = async (
  result: "victory" | "defeat"
): Promise<void> => {
  const output = musicOutput();
  if (!output || output.context.state !== "running") {
    return;
  }

  const { context, destination } = output;
  const buffer = await loadBuffer(context, STING_FILES[result]);
  if (!buffer || context.state !== "running") {
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
  source.connect(gain).connect(destination);
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
};

onAudioUnlocked(() => {
  if (desiredTrack) {
    void startMusicTrack(desiredTrack);
  }
});
