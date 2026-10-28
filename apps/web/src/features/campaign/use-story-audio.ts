import { useEffect } from "react";

import { playPresentation, playPresentationCue } from "@/core/audio/audio";
import type { StoryKind } from "@/features/campaign/story-scenes";
import { storyCues, storyRoot } from "@/features/campaign/story-scenes";

/** Scene files stay in the lazy Campaign chunk; the Audio service owns the Mix. */
export const useStoryAudio = (
  region: number,
  kind: StoryKind,
  moment: number
): void => {
  useEffect(() => {
    playPresentation([
      { url: `${storyRoot(region)}/audio/${kind}-music.mp3`, bus: "music" },
    ]);
    return () => playPresentation(null);
  }, [region, kind]);

  useEffect(() => {
    playPresentationCue(
      storyCues(region, kind, moment).map((cue) => ({
        url: `${storyRoot(region)}/audio/${cue.file}.mp3`,
        bus: "effects",
        gain: 10 ** (cue.gainDb / 20),
        delaySeconds: cue.at,
      }))
    );
    return () => playPresentationCue(null);
  }, [region, kind, moment]);
};
