import { useAtomValue } from "@effect/atom-react";
import type { ExpeditionCollect, Profile } from "@workspace/rules";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { RewardLines } from "@/features/seaport/components/reward-lines";
import type { Berth } from "@/features/seaport/seaport";
import {
  berthAt,
  clockParts,
  clockText,
  voyageShare,
} from "@/features/seaport/seaport";
import { seaportAtom } from "@/features/seaport/seaport.atoms";
import { useNow, useSeaport } from "@/features/seaport/use-seaport";

/** A small label in Inter 700, as the labels of the Dungeon Panel. */
const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

/** The Collect of the last voyage, which the plate shows at the berth. */
export type LastCollect = ExpeditionCollect<Profile>;

/** The parchment of the berth plate, with its frame-wood border. */
const PARCHMENT =
  "flex min-h-0 shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] px-4 py-3 text-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.45),0_14px_30px_rgba(0,0,0,0.4)] [@media(max-height:500px)]:mt-10 [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:self-start [@media(max-height:500px)]:rounded-xl [@media(max-height:500px)]:border-[3px] [@media(max-height:500px)]:p-2.5";

/** The time left of the voyage: a clock and a groove that fills to the return. */
const VoyageClock = ({
  berth,
  now,
}: {
  readonly berth: Extract<Berth, { kind: "away" }>;
  readonly now: number;
}) => {
  const { tr } = useGameText();
  const { hours, minutes } = clockParts(berth.leftMs);
  const share = voyageShare(berth.active, now);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-baseline justify-between gap-2">
        <span className={LABEL}>{tr("seaport.berth.timeLeft")}</span>
        <span
          role="timer"
          className="font-display text-2xl leading-none font-black tabular-nums [@media(max-height:500px)]:text-lg"
          data-testid="berth-time-left"
        >
          <span className="sr-only">
            {tr("seaport.berth.timeLeftLabel", { hours, minutes })}
          </span>
          <span aria-hidden>{clockText(berth.leftMs)}</span>
        </span>
      </p>
      <span
        aria-hidden
        className="relative h-2.5 overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-b from-[#9fe7f5] to-[#0e6f86] motion-safe:transition-[width] motion-safe:duration-1000 motion-safe:ease-linear"
          style={{ width: `${share * 100}%` }}
        />
      </span>
    </div>
  );
};

/** The plate at the berth: the last Collect, or what to do first. */
const AtBerth = ({ last }: { readonly last: LastCollect | null }) => {
  const { tr } = useGameText();
  if (last === null) {
    return (
      <p className="text-sm leading-snug text-[#5b4632] [@media(max-height:500px)]:text-xs">
        {tr("seaport.berth.atBerthHint")}
      </p>
    );
  }
  const levelUp = last.levelAfter > last.levelBefore;
  return (
    <div className="flex flex-col gap-1.5" data-testid="berth-last-collect">
      <p className={LABEL}>
        {tr("seaport.berth.collected", {
          name: tr(`seaport.expeditions.${last.expedition.id}`),
        })}
      </p>
      <RewardLines reward={last.reward} tone="light" />
      {levelUp ? (
        <p
          className="w-fit rounded-md border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-2 py-0.5 text-xs font-black text-[#2a1a05]"
          data-testid="berth-level-up"
        >
          {tr("battle.levelUp", { level: last.levelAfter })}
        </p>
      ) : null}
    </div>
  );
};

/**
 * The berth plate (Economy 2.8): the state of the ship. At the berth, it
 * shows the last Collect. While the ship is away, it shows the time left and
 * the reward that a Collect gives now (pro rata), and the Forge Stone row
 * says that it comes when the ship is back. When the ship is back, it shows
 * the full reward. Collect takes the reward at once, also early: the Player
 * loses nothing. It is gold only when the ship is back (The Gold Means Act
 * Rule).
 *
 * The ticker is here: the plate redraws each second while the screen is
 * open, and nothing else redraws. The reward of a Collect comes from the
 * rules with the time of the press, so a reload never changes it. Give the
 * plate a `key` with the Dispatch time, so that a new voyage starts a new
 * ticker at a time after the Dispatch.
 */
export const BerthPlate = ({
  last,
  onCollected,
}: {
  readonly last: LastCollect | null;
  readonly onCollected: (collect: LastCollect | null) => void;
}) => {
  const { tr } = useGameText();
  const seaport = useAtomValue(seaportAtom);
  const { now, sync } = useNow();
  const { collect } = useSeaport();
  const berth = berthAt({ seaport }, now);

  const onCollect = () => {
    const done = collect();
    if (done !== null) {
      sync(done.at);
      unlockAudio();
      playSound("claim");
    }
    onCollected(done?.result ?? null);
  };

  // At the berth, the plate names no Expedition.
  const name =
    berth.kind === "atBerth"
      ? ""
      : tr(`seaport.expeditions.${berth.active.expedition.id}`);
  let title = tr("seaport.berth.atBerth");
  if (berth.kind === "away") {
    title = tr("seaport.berth.away", { name });
  } else if (berth.kind === "back") {
    title = tr("seaport.berth.back", { name });
  }

  return (
    <section
      aria-labelledby="berth-title"
      className={PARCHMENT}
      data-testid="berth-plate"
      data-state={berth.kind}
    >
      <header className="flex items-center gap-2 border-b-2 border-[#c9b48c] pb-2 [@media(max-height:500px)]:pb-1">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-[#fff6df] [@media(max-height:500px)]:size-6"
        >
          <GlyphIcon
            glyph="anchor"
            className="size-4 [@media(max-height:500px)]:size-3"
          />
        </span>
        <div className="min-w-0">
          <p className={LABEL}>{tr("seaport.berth.label")}</p>
          <h2
            id="berth-title"
            className="font-display truncate text-lg leading-tight font-black [@media(max-height:500px)]:text-sm"
            data-testid="berth-title"
          >
            {title}
          </h2>
        </div>
      </header>
      {berth.kind === "atBerth" ? <AtBerth last={last} /> : null}
      {berth.kind === "away" ? (
        <>
          <VoyageClock berth={berth} now={now} />
          <div className="flex flex-col gap-1">
            <p className={LABEL}>{tr("seaport.berth.collectNow")}</p>
            <RewardLines
              reward={berth.active.reward}
              stones={berth.active.expedition.forgeStones}
              stonesLater
              tone="light"
            />
          </div>
          {berth.canCollect ? null : (
            <p
              className="text-xs leading-snug text-[#8f2a2a]"
              data-testid="berth-clock-back"
            >
              {tr("seaport.berth.clockBack")}
            </p>
          )}
        </>
      ) : null}
      {berth.kind === "back" ? (
        <div className="flex flex-col gap-1">
          <p className={LABEL}>{tr("seaport.berth.fullReward")}</p>
          <RewardLines reward={berth.active.reward} tone="light" />
        </div>
      ) : null}
      {berth.kind === "atBerth" ? null : (
        <GameButton
          intent={berth.kind === "back" ? "gold" : "wood"}
          size="lg"
          isDisabled={berth.kind === "away" && !berth.canCollect}
          onPress={onCollect}
          aria-label={tr("seaport.berth.collectLabel", { name })}
          className="font-display w-full shrink-0 tracking-[0.04em] [@media(max-height:500px)]:min-h-10"
          data-testid="seaport-collect"
        >
          {tr("seaport.berth.collect")}
        </GameButton>
      )}
    </section>
  );
};
