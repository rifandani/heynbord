import { exportProfile, importProfile, newProfile } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import {
  availableStories,
  finishStory,
  pendingBossStory,
  pendingStory,
  STORY_LINES,
  storyLineKey,
} from "./story-scenes";

describe("Region Story Scenes", () => {
  it("starts the new Player opening only on its own Region visit", () => {
    const profile = newProfile(3);
    expect(pendingStory(profile, 1)).toBe("opening");
    expect(availableStories(profile, 2)).toEqual([]);
    expect(pendingStory(profile, 2)).toBeNull();
  });

  it("keeps an interrupted opening pending across a saved Profile round trip", () => {
    const profile = newProfile(3);
    // Entering or changing a Story Moment does not write a viewing record.
    expect(
      pendingStory(Result.getOrThrow(importProfile(exportProfile(profile))), 1)
    ).toBe("opening");
  });

  it("completion and Skip stop automatic playback, and allow replay", () => {
    const profile = finishStory(newProfile(3), 1, "opening");
    expect(pendingStory(profile, 1)).toBeNull();
    expect(availableStories(profile, 1)).toEqual(["opening"]);
    expect(finishStory(profile, 1, "opening")).toEqual(profile);
  });

  it("a one-Star Boss win makes the ending pending, with priority over the opening", () => {
    const profile = {
      ...newProfile(3),
      coin: 1234,
      stageResults: { "1-10": 1 },
    };
    expect(availableStories(profile, 1)).toEqual(["opening", "boss", "ending"]);
    expect(pendingStory(profile, 1)).toBe("ending");
    const finished = finishStory(profile, 1, "ending");
    expect(pendingStory(finished, 1)).toBeNull();
    expect(availableStories(finished, 1)).toEqual([
      "opening",
      "boss",
      "ending",
    ]);
    expect(finished).toEqual({
      ...profile,
      seenStoryScenes: ["region-1-ending", "region-1-opening", "region-1-boss"],
    });
  });

  it("a future Boss win still starts the ending after the old opening was suppressed", () => {
    const profile = {
      ...newProfile(3),
      seenStoryScenes: ["region-1-opening"],
      stageResults: { "1-10": 2 },
    };
    expect(pendingStory(profile, 1)).toBe("ending");
    expect(pendingStory(finishStory(profile, 1, "ending"), 1)).toBeNull();
  });

  it("a normal Stage win does not expose the ending, and a reset restores the opening", () => {
    expect(
      availableStories({ ...newProfile(3), stageResults: { "1-8": 3 } }, 1)
    ).toEqual(["opening"]);
    expect(newProfile(3).seenStoryScenes).toEqual([]);
  });

  it("the open Boss Stage plays its Boss scene once, from Fight and never on a visit", () => {
    const profile = {
      ...newProfile(3),
      seenStoryScenes: ["region-1-opening"],
      stageResults: { "1-9": 1 },
    };
    expect(availableStories(profile, 1)).toEqual(["opening", "boss"]);
    expect(pendingStory(profile, 1)).toBeNull();
    expect(pendingBossStory(profile, "1-10")).toBe(true);
    expect(pendingBossStory(profile, "1-9")).toBe(false);
    const seen = finishStory(profile, 1, "boss");
    expect(pendingBossStory(seen, "1-10")).toBe(false);
    expect(availableStories(seen, 1)).toEqual(["opening", "boss"]);
  });

  it("each Story line has a Translation Key in its moment", () => {
    expect(STORY_LINES.boss.flat()).toHaveLength(12);
    expect(storyLineKey("opening", 0, 0)).toBe("story.hearthvale.opening.1");
    expect(storyLineKey("boss", 2, 2)).toBe("story.hearthvale.boss.3c");
  });
});
