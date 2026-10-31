import { exportProfile, importProfile, newProfile } from "@workspace/rules";
import { Result } from "effect";
import { describe, expect, it } from "vitest";

import {
  availableStories,
  finishStory,
  pendingBossStory,
  pendingStory,
  seenStory,
  STORY_MOMENTS,
  storyCues,
  storyLineKey,
  storyLines,
  storyMedia,
} from "./story-scenes";

/** Every line of a Story Scene, over its moments. */
const lines = (region: number, kind: "opening" | "boss" | "ending") =>
  Array.from({ length: STORY_MOMENTS }, (_, moment) =>
    storyLines(region, kind, moment)
  ).flat();

describe("Region Story Scenes", () => {
  it("starts the new Player opening only on its own Region visit", () => {
    const profile = newProfile(3);
    expect(pendingStory(profile, 1)).toBe("opening");
    expect(availableStories(profile, 2)).toEqual([]);
    expect(pendingStory(profile, 2)).toBeNull();
  });

  it("the first Hearthvale Boss win opens the Red Mesas opening for its next visit", () => {
    const profile = {
      ...newProfile(3),
      seenStoryScenes: ["region-1-opening", "region-1-boss"],
      stageResults: { "1-10": 1 },
    };
    // Each Region keeps its own pending scene: the Hearthvale ending, and the Red Mesas opening.
    expect(pendingStory(profile, 1)).toBe("ending");
    expect(availableStories(profile, 2)).toEqual(["opening"]);
    expect(pendingStory(profile, 2)).toBe("opening");
    expect(pendingStory(finishStory(profile, 2, "opening"), 2)).toBeNull();
    // The Hollow Marches opening needs the Thornwood Boss win; a Region with
    // no produced Story Scenes has none.
    const allWon = {
      ...profile,
      stageResults: { "1-10": 1, "2-10": 1, "3-10": 1, "4-10": 1 },
    };
    expect(availableStories(profile, 5)).toEqual([]);
    expect(availableStories(allWon, 5)).toEqual(["opening"]);
    expect(availableStories(allWon, 6)).toEqual([]);
  });

  it("the Red Mesas Boss scene plays from its own Boss Stage, and its win makes the ending pending", () => {
    const profile = {
      ...newProfile(3),
      seenStoryScenes: [
        "region-1-opening",
        "region-1-boss",
        "region-1-ending",
        "region-2-opening",
      ],
      stageResults: { "1-10": 1, "2-9": 2 },
    };
    expect(availableStories(profile, 2)).toEqual(["opening", "boss"]);
    expect(pendingBossStory(profile, "2-10")).toBe(true);
    expect(pendingBossStory(profile, "1-10")).toBe(false);
    const won = {
      ...finishStory(profile, 2, "boss"),
      stageResults: { ...profile.stageResults, "2-10": 1 },
    };
    expect(pendingStory(won, 2)).toBe("ending");
    expect(finishStory(won, 2, "ending").seenStoryScenes).toContain(
      "region-2-ending"
    );
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
    expect(seenStory(profile, 1, "opening")).toBe(true);
    expect(seenStory(profile, 1, "ending")).toBe(false);
    expect(seenStory(profile, 2, "opening")).toBe(false);
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
    expect(lines(1, "boss")).toHaveLength(12);
    expect(storyLineKey(1, "opening", 0, 0)).toBe("story.hearthvale.opening.1");
    expect(storyLineKey(1, "boss", 2, 2)).toBe("story.hearthvale.boss.3c");
    expect(lines(2, "boss")).toHaveLength(14);
    expect(lines(2, "ending")).toHaveLength(6);
    expect(storyLineKey(2, "boss", 4, 1)).toBe("story.redMesas.boss.5b");
    expect(storyLines(2, "boss", 4)[1]).toBe("grukka");
    expect(storyLineKey(2, "ending", 2, 1)).toBe("story.redMesas.ending.3b");
    expect(storyLineKey(2, "ending", 3, 0)).toBe("story.redMesas.ending.4");
    expect(lines(4, "boss")).toHaveLength(11);
    expect(lines(4, "ending")).toHaveLength(7);
    expect(storyLines(4, "boss", 2)).toEqual(["bramble", "bramble", "hero"]);
    expect(storyLineKey(4, "ending", 1, 1)).toBe("story.thornwood.ending.2b");
    expect(storyLines(4, "ending", 1)[1]).toBe("lethiel");
    expect(lines(5, "boss")).toHaveLength(14);
    expect(lines(5, "ending")).toHaveLength(9);
    expect(storyLines(5, "boss", 1)).toEqual(["marrow", "marrow", "hero"]);
    expect(storyLineKey(5, "boss", 0, 1)).toBe("story.hollowMarches.boss.1b");
    expect(storyLineKey(5, "ending", 2, 2)).toBe(
      "story.hollowMarches.ending.3c"
    );
    expect(storyLineKey(5, "ending", 4, 0)).toBe(
      "story.hollowMarches.ending.5"
    );
  });

  it("the Hollow Marches scenes follow the Thornwood Boss win", () => {
    const profile = {
      ...newProfile(3),
      stageResults: { "1-10": 1, "2-10": 1, "3-10": 1, "4-10": 1, "5-9": 1 },
    };
    expect(availableStories(profile, 5)).toEqual(["opening", "boss"]);
    expect(pendingStory(profile, 5)).toBe("opening");
    expect(pendingBossStory(profile, "5-10")).toBe(true);
    expect(pendingBossStory(finishStory(profile, 5, "boss"), "5-10")).toBe(
      false
    );
    const won = {
      ...profile,
      stageResults: { ...profile.stageResults, "5-10": 1 },
    };
    expect(pendingStory(won, 5)).toBe("ending");
    expect(pendingStory(finishStory(won, 5, "ending"), 5)).toBeNull();
  });

  it("the Thornwood scenes follow the Glowcap Hollows Boss win", () => {
    const profile = {
      ...newProfile(3),
      stageResults: { "1-10": 1, "2-10": 1, "3-10": 1, "4-9": 1 },
    };
    expect(availableStories(profile, 4)).toEqual(["opening", "boss"]);
    expect(pendingStory(profile, 4)).toBe("opening");
    expect(pendingBossStory(profile, "4-10")).toBe(true);
    const won = {
      ...profile,
      stageResults: { ...profile.stageResults, "4-10": 1 },
    };
    expect(pendingStory(won, 4)).toBe("ending");
  });

  it("each Region requests its own versioned media", () => {
    expect(storyMedia(1, "boss", 0)).toBe("/story/hearthvale/v2/boss-01");
    expect(storyMedia(2, "ending", 4)).toBe("/story/red-mesas/v1/ending-05");
    expect(storyMedia(4, "boss", 1)).toBe("/story/thornwood/v1/boss-02");
    expect(storyMedia(5, "ending", 4)).toBe(
      "/story/hollow-marches/v1/ending-05"
    );
    expect(storyCues(5, "boss", 4)).toHaveLength(5);
    expect(storyCues(5, "boss", 4)[0]).toEqual({
      file: "drums",
      at: 0.1,
      gainDb: -2,
    });
    expect(storyCues(2, "opening", 1).at(-1)).toEqual({
      file: "explosion",
      at: 3.3,
      gainDb: 0,
    });
  });
});
