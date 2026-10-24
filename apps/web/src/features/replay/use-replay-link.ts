import { RegistryContext } from "@effect/atom-react";
import { Effect } from "effect";
import { useContext, useEffect } from "react";
import { toast } from "sonner";

import { useLatest } from "@/core/hooks/use-latest";
import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { useGameText } from "@/features/battle/use-game-text";
import type { ReplayRefused, ReplayRun } from "@/features/replay/replay";
import { openReplay, replayDataOf } from "@/features/replay/replay-link";
import { gameScreenAtom } from "@/features/town/town.atoms";

/** What the game does with a Replay Link. */
interface ReplayLinkActions {
  /** Starts Watching a Replay in place of the screen. */
  readonly show: (run: ReplayRun) => void;
  /** Leaves the Replay that the Player watches now. */
  readonly leave: () => void;
}

/**
 * Opens a Replay Link (web ADR-0011). The game reads the URL fragment at the
 * start and on each fragment change, then removes it, so a reload opens the
 * Town (web ADR-0005). A Live Battle has no save, so during a Live Battle the
 * game ignores the link and shows a toast. A broken link, or a link of other
 * rules, opens the Town with a toast.
 */
export const useReplayLink = (actions: ReplayLinkActions) => {
  const registry = useContext(RegistryContext);
  const { tr } = useGameText();
  const latest = useLatest({ actions, tr });

  useEffect(() => {
    /** True when a Live Battle is on the screen: the link must not end it. */
    const inLiveBattle = () => {
      const session = registry.get(battleSessionAtom);
      if (session && !session.watching) {
        toast(latest.current.tr("replay.inBattle"), { id: "replay-link" });
        return true;
      }
      return false;
    };
    /** Leaves the Replay that shows, and opens the Town with a toast. */
    const refuse = (reason: ReplayRefused["reason"]) => {
      if (registry.get(battleSessionAtom)?.watching) {
        latest.current.actions.leave();
      }
      registry.set(gameScreenAtom, "town");
      toast.error(
        latest.current.tr(
          reason === "otherVersion" ? "replay.otherVersion" : "replay.broken"
        ),
        { id: "replay-link" }
      );
    };
    /** Opens the Replay, or the Town with a toast when the game cannot show it. */
    const open = async (data: string) => {
      const opened = await Effect.runPromise(
        openReplay(data).pipe(
          Effect.match({
            onSuccess: (run) => ({ _tag: "Run", run }) as const,
            onFailure: (failure) => ({ _tag: "Refused", failure }) as const,
          })
        )
      );
      // A Battle can start while the link decodes. The read removed the
      // fragment, so the result applies also after a StrictMode remount.
      if (inLiveBattle()) {
        return;
      }
      if (opened._tag === "Run") {
        latest.current.actions.show(opened.run);
        return;
      }
      refuse(opened.failure.reason);
    };
    const read = () => {
      const data = replayDataOf(location.hash);
      if (data === null) {
        return;
      }
      history.replaceState(
        history.state,
        "",
        `${location.pathname}${location.search}`
      );
      if (!inLiveBattle()) {
        void open(data);
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [registry, latest]);
};
