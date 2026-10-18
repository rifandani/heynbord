/**
 * The Seaport screen (Economy 2.8, ADR-0053): the harbour seen from the
 * water, with the Destination list and the berth plate over the calm water
 * at the left. The Player Dispatches the ship on one Expedition and Collects
 * its reward there. The rules own the reward math; the screen sends the
 * device time with each Command.
 */
import { useAtomValue } from "@effect/atom-react";
import type { ExpeditionId } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
import { Label, RadioGroup } from "react-aria-components";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { BerthPlate } from "@/features/seaport/components/berth-plate";
import type { LastCollect } from "@/features/seaport/components/berth-plate";
import { DestinationPlaque } from "@/features/seaport/components/destination-plaque";
import { HarbourScene } from "@/features/seaport/components/harbour-scene";
import type { Destination } from "@/features/seaport/seaport";
import { firstDestination } from "@/features/seaport/seaport";
import {
  destinationsAtom,
  seaportAtom,
} from "@/features/seaport/seaport.atoms";
import { useSeaport } from "@/features/seaport/use-seaport";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { balancesAtom } from "@/features/town/town.atoms";
import { useCountTo } from "@/features/workshop/use-count-to";

/**
 * The lock of the selected Expedition, under the Dispatch, or `null` when
 * the Player level opens it. While the ship is away, the berth plate title
 * says why the Dispatch is off.
 */
const useLockNote = (destination: Destination | null) => {
  const { tr } = useGameText();
  if (destination !== null && !destination.open) {
    return tr("town.opensAtLevel", {
      level: destination.expedition.unlockLevel,
    });
  }
  return null;
};

/** The element that tells why the Dispatch is off, if it is off. */
const dispatchDescription = (note: string | null, away: boolean) => {
  if (note !== null) {
    return "dispatch-note";
  }
  return away ? "berth-title" : undefined;
};

/**
 * The Seaport screen. The Balance Plate is at the top right, and the Coin and
 * the Essence count up after a Collect. At the left, over the calm water:
 * the Destination list with the one gold Dispatch under it, then the berth
 * plate. On a short screen, the list and the berth plate are side by side,
 * and the berth plate starts under the Balance Plate.
 * The screen fades in; with reduced motion, it shows at once.
 */
export const SeaportScreen = () => {
  const { tr } = useGameText();
  const list = useAtomValue(destinationsAtom);
  const seaport = useAtomValue(seaportAtom);
  const balances = useAtomValue(balancesAtom);
  const coin = useCountTo(balances.coin);
  const essence = useCountTo(balances.essence);
  const { dispatch } = useSeaport();
  const [selected, setSelected] = useState<ExpeditionId | null>(() =>
    firstDestination(list, seaport)
  );
  const [last, setLast] = useState<LastCollect | null>(null);
  const [said, setSaid] = useState("");
  const shown =
    list.find((destination) => destination.expedition.id === selected) ?? null;
  const away = seaport.expeditionId !== null;
  const note = useLockNote(shown);
  const name = shown ? tr(`seaport.expeditions.${shown.expedition.id}`) : "";

  const onDispatch = () => {
    if (shown === null || dispatch(shown.expedition.id) === null) {
      setSaid(tr("seaport.cannotDispatch"));
      return;
    }
    unlockAudio();
    playSound("select");
    setLast(null);
    setSaid(tr("seaport.dispatched", { name, hours: shown.expedition.hours }));
  };

  const onCollected = (collect: LastCollect | null) => {
    if (collect === null) {
      setSaid(tr("seaport.cannotCollect"));
      return;
    }
    setLast(collect);
    const collected = tr("seaport.berth.collected", {
      name: tr(`seaport.expeditions.${collect.expedition.id}`),
    });
    setSaid(
      collect.levelAfter > collect.levelBefore
        ? `${collected} ${tr("battle.levelUp", { level: collect.levelAfter })}`
        : collected
    );
  };

  return (
    <main
      aria-label={tr("seaport.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="seaport"
    >
      <HarbourScene />
      <BalancePlate balances={{ ...balances, coin, essence }} />
      {/* The page heading stays for screen readers only. */}
      <h1 className="sr-only">{tr("seaport.title")}</h1>
      <div
        className={cn(
          "absolute top-[max(0.75rem,env(safe-area-inset-top))] bottom-[92px] left-[max(1rem,env(safe-area-inset-left))] flex w-[min(30rem,calc(100vw-2rem))] flex-col gap-2.5",
          "[@media(max-height:500px)]:top-[max(0.5rem,env(safe-area-inset-top))] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:left-[max(0.5rem,env(safe-area-inset-left))] [@media(max-height:500px)]:grid [@media(max-height:500px)]:w-[min(calc(100vw-1rem),40rem)] [@media(max-height:500px)]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] [@media(max-height:500px)]:gap-2"
        )}
      >
        <section
          className="flex min-h-0 shrink flex-col gap-1.5"
          data-testid="destination-list"
        >
          <RadioGroup
            value={selected}
            onChange={(value) =>
              setSelected(
                list.find((destination) => destination.expedition.id === value)
                  ?.expedition.id ?? null
              )
            }
            className="flex min-h-0 flex-col gap-1.5"
          >
            <Label className="font-display flex w-fit items-center gap-2 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 px-3 py-0.5 text-[15px] font-black shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-sm">
              <GlyphIcon glyph="anchor" className="size-4 text-[#e9c46a]" />
              {tr("seaport.destinations")}
            </Label>
            <div className="-m-1 flex min-h-0 flex-col gap-1.5 overflow-y-auto overscroll-contain p-1">
              {list.map((destination) => (
                <DestinationPlaque
                  key={destination.expedition.id}
                  destination={destination}
                  atSea={seaport.expeditionId === destination.expedition.id}
                />
              ))}
            </div>
          </RadioGroup>
          <GameButton
            intent="gold"
            size="lg"
            isDisabled={away || note !== null || shown === null}
            onPress={onDispatch}
            aria-label={tr("seaport.dispatchLabel", { name })}
            aria-describedby={dispatchDescription(note, away)}
            className="font-display min-h-11 w-full shrink-0 tracking-[0.04em] [@media(max-height:500px)]:min-h-10"
            data-testid="seaport-dispatch"
          >
            {tr("seaport.dispatch")}
          </GameButton>
          {note === null ? null : (
            <p
              id="dispatch-note"
              className="-mt-0.5 flex w-fit items-center gap-1.5 self-center rounded-md bg-[#1c140e]/85 px-2 py-0.5 text-xs font-semibold text-[#e8d9bb]"
              data-testid="dispatch-note"
            >
              <GlyphIcon glyph="lock" className="size-3 text-[#e9c46a]" />
              {note}
            </p>
          )}
        </section>
        <BerthPlate
          key={seaport.startedAt ?? "atBerth"}
          last={last}
          onCollected={onCollected}
        />
      </div>
      <p className="sr-only" aria-live="polite" data-testid="seaport-said">
        {said}
      </p>
    </main>
  );
};
