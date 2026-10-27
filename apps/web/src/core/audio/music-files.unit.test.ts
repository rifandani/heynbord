import { describe, expect, it } from "vitest";

import { STING_FILES, TRACK_FILES, musicUrl } from "@/core/audio/music-files";

describe("musicUrl", () => {
  it("puts the music folder under a base that ends with a slash", () => {
    expect(musicUrl("/", TRACK_FILES.town)).toBe("/music/town.ogg");
    expect(musicUrl("/game/", TRACK_FILES.boss)).toBe("/game/music/boss.ogg");
  });

  it("adds the slash when the base has none", () => {
    expect(musicUrl("/game", TRACK_FILES.town)).toBe("/game/music/town.ogg");
  });

  it("names a file for every track and sting", () => {
    expect(Object.values(TRACK_FILES)).toHaveLength(15);
    expect(STING_FILES).toEqual({
      defeat: "defeat.ogg",
      victory: "victory.ogg",
    });
  });
});
