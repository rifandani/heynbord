import { Effect } from "effect";
import { toast } from "sonner";

import { useGameText } from "@/features/battle/use-game-text";
import type { Replay } from "@/features/replay/replay";
import { encodeReplay, replayLink } from "@/features/replay/replay-link";

/** On a phone or a tablet, the native share sheet opens (Web Share API). */
const canShareNatively = (link: string): boolean =>
  "share" in navigator &&
  matchMedia("(pointer: coarse)").matches &&
  (navigator.canShare?.({ url: link }) ?? true);

/**
 * "Share Replay" (web ADR-0011): makes the Replay Link of a finished Battle.
 * On mobile, the native share sheet opens. Else, the link goes to the
 * clipboard and a toast tells the Player.
 */
export const useShareReplay = () => {
  const { tr } = useGameText();
  const copy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(tr("replay.copied"), { id: "replay-share" });
    } catch {
      toast.error(tr("replay.copyFailed"), { id: "replay-share" });
    }
  };
  return async (replay: Replay, name: string) => {
    const link = replayLink(
      location.origin,
      await Effect.runPromise(encodeReplay(replay))
    );
    if (!canShareNatively(link)) {
      await copy(link);
      return;
    }
    try {
      await navigator.share({
        title: tr("replay.shareTitle", { name }),
        url: link,
      });
    } catch (error) {
      // The Player closed the share sheet: that is not a failure.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        await copy(link);
      }
    }
  };
};
