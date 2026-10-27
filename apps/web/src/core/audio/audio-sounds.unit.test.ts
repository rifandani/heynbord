import { describe, expect, it } from "vitest";

import type { SoundName } from "@/core/audio/audio-sounds";
import { makeSounds } from "@/core/audio/audio-sounds";
import { makeFakeAudio } from "@/core/audio/testing";

describe("makeSounds", () => {
  it("makes every sound", () => {
    const fake = makeFakeAudio();
    const destination = fake.context.createGain();
    const sounds = makeSounds({ context: fake.context, destination });
    // SAFETY: makeSounds fills every SoundName key of its record.
    const names = Object.keys(sounds) as SoundName[];

    expect(names).toHaveLength(32);
    for (const name of names) {
      expect(() => sounds[name]()).not.toThrow();
    }
  });
});
