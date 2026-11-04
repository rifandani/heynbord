import { useCallback, useRef, useState } from "react";

import { useTimeouts } from "@/core/hooks/use-timeouts";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import type { RewardFlightPath } from "@/features/objectives/components/reward-flight";
import {
  measureRewardFlight,
  REWARD_FLY_MS,
} from "@/features/objectives/components/reward-flight";
import type { RewardBalance } from "@/features/objectives/objectives";

/** The wait between the flights of one Claim, one for each balance. */
const FLIGHT_STAGGER_MS = 90;

/** Tells the Player about a Claim. Call it after the Claim. */
export type OnClaimed = (
  from: Element | null,
  kinds: readonly RewardBalance[],
  said: string
) => void;

/**
 * The feedback of a Claim in the Objectives dialog: the flights of the rewards
 * to the Balance Plate, the sound when the rewards get there (at once with
 * reduced motion, because then nothing flies), and the words for a screen
 * reader. The dialog owns it, so a flight stays when the tab changes.
 */
export const useClaimFeedback = () => {
  const [flights, setFlights] = useState<readonly RewardFlightPath[]>([]);
  const [said, setSaid] = useState("");
  const serial = useRef(0);
  const schedule = useTimeouts();

  const onClaimed: OnClaimed = (from, kinds, words) => {
    unlockAudio();
    setSaid(words);
    if (prefersReducedMotion()) {
      playSound("claim", 0);
      return;
    }
    const next = kinds.flatMap((kind, index) => {
      serial.current += 1;
      const path = measureRewardFlight(
        from,
        kind,
        serial.current,
        index * FLIGHT_STAGGER_MS
      );
      return path ? [path] : [];
    });
    setFlights((current) => [...current, ...next]);
    schedule(() => playSound("claim", 0), REWARD_FLY_MS);
  };

  const onLanded = useCallback((done: number) => {
    setFlights((current) => current.filter((flight) => flight.serial !== done));
  }, []);

  return { flights, said, onClaimed, onLanded };
};
