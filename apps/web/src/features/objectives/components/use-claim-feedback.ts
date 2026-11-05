import { useState } from "react";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";

/** Tells the Player about a Claim. Call it after the Claim. */
export type OnClaimed = (said: string) => void;

/**
 * The feedback of a Claim in the Objectives dialog: the short bell sound, and
 * the words for a screen reader. The dialog owns it, so the words stay when
 * the tab changes.
 */
export const useClaimFeedback = () => {
  const [said, setSaid] = useState("");

  const onClaimed: OnClaimed = (words) => {
    unlockAudio();
    playSound("claim", 0);
    setSaid(words);
  };

  return { said, onClaimed };
};
