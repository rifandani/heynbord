import { useEffect } from "react";

import { playPresentation, playPresentationCue } from "@/core/audio/audio";
import type { StoryKind } from "@/features/campaign/story-scenes";
import { STORY_CUES, STORY_ROOT } from "@/features/campaign/story-scenes";

/** Scene files stay in the lazy Campaign chunk; the Audio service owns the Mix. */
export const useStoryAudio = (kind: StoryKind, moment: number): void => {
  useEffect(() => {
    playPresentation([
      { url: `${STORY_ROOT}/audio/${kind}-music.mp3`, bus: "music" },
    ]);
    return () => playPresentation(null);
  }, [kind]);

  useEffect(() => {
    const cues = STORY_CUES[kind][moment] ?? [];
    playPresentationCue(
      cues.map((cue) => ({
        url: `${STORY_ROOT}/audio/${cue.file}.mp3`,
        bus: "effects",
        gain: 10 ** (cue.gainDb / 20),
        delaySeconds: cue.at,
      }))
    );
    return () => playPresentationCue(null);
  }, [kind, moment]);
};
