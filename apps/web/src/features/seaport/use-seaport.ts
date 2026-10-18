import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type {
  ExpeditionCollect,
  ExpeditionId,
  Profile,
} from "@workspace/rules";
import { collectExpedition, startExpedition } from "@workspace/rules";
import { useContext, useEffect, useState } from "react";

import { profileAtom } from "@/features/profile/profile.atoms";
import { returnsAt } from "@/features/seaport/seaport";
import { seaportAtom } from "@/features/seaport/seaport.atoms";

/** The ticker of the berth plate: one redraw each second. */
const TICK_MS = 1000;

/**
 * The device time, in milliseconds since the epoch, that changes each second
 * while the component is on the screen. `sync` sets it at once, for example
 * to the time of a Dispatch, so that the plate never shows a time before it.
 */
export const useNow = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return { now, sync: setNow };
};

/**
 * The Seaport actions (Economy 2.8). Each one is one Profile change with the
 * device time `now` of the press, so a reload never changes a reward. The
 * actions read the registry, not a render: two fast presses act two times on
 * the newest Profile. `dispatch` returns the time of the Dispatch, or `null`
 * when the ship cannot go now. `collect` returns the Collect, or `null` when
 * there is nothing to collect now.
 */
export const useSeaport = () => {
  const registry = useContext(RegistryContext);

  const dispatch = (id: ExpeditionId): number | null => {
    const now = Date.now();
    const next = startExpedition(registry.get(profileAtom), id, now);
    if (next === null) {
      return null;
    }
    registry.set(profileAtom, next);
    return now;
  };

  const collect = (): {
    readonly at: number;
    readonly result: ExpeditionCollect<Profile>;
  } | null => {
    const now = Date.now();
    const result = collectExpedition(registry.get(profileAtom), now);
    if (result === null) {
      return null;
    }
    registry.set(profileAtom, result.profile);
    return { at: now, result };
  };

  return { dispatch, collect };
};

/**
 * True while the ship is back and waits for a Collect: the Town Bar shows the
 * badge of the Seaport shortcut. It has no ticker: one timer marks the return
 * time of the ship, at once when that time is already past.
 */
export const useShipBack = (): boolean => {
  const seaport = useAtomValue(seaportAtom);
  const back = returnsAt(seaport);
  const [arrived, setArrived] = useState<number | null>(null);
  useEffect(() => {
    if (back === null) {
      return;
    }
    const timer = setTimeout(
      () => setArrived(back),
      Math.max(back - Date.now(), 0)
    );
    return () => clearTimeout(timer);
  }, [back]);
  return back !== null && arrived === back;
};
