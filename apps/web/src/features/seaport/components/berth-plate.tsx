import { useAtomValue } from "@effect/atom-react";
import type {
  Expedition,
  ExpeditionCargo,
  ExpeditionCollect,
  ExpeditionReward,
  ForgeStoneTier,
  Profile,
} from "@workspace/rules";
import { coinDenominations, getCargo } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useState } from "react";

import { GameButton } from "@/core/components/game/game-button";
import { RANK_COLORS } from "@/core/components/game/tokens";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { useNumberFormat } from "@/features/i18n/use-number-format";
import { CargoIcon } from "@/features/seaport/components/cargo-icon";
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
import { useVoyageName } from "@/features/seaport/use-voyage-name";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";
import { useCountTo } from "@/features/workshop/use-count-to";

/** A small label in Inter 700, as the labels of the Dungeon Panel. */
const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

/** The Collect of the last voyage, which the plate shows at the berth. */
export type LastCollect = ExpeditionCollect<Profile>;

/** The parchment of the berth plate, with its frame-wood border. */
const PARCHMENT =
  "flex min-h-0 shrink-0 flex-col gap-2.5 overflow-y-auto overscroll-contain rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] px-4 py-3 text-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.45),0_14px_30px_rgba(0,0,0,0.4)] [@media(max-height:500px)]:gap-1.5 [@media(max-height:500px)]:self-start [@media(max-height:500px)]:rounded-xl [@media(max-height:500px)]:border-[3px] [@media(max-height:500px)]:p-2.5";

/** The big number of the plate, as the one of the Manifest (The Big Number Rule). */
const BIG =
  "text-[1.75rem] leading-none font-black tabular-nums [@media(max-height:500px)]:text-xl";

/** The tier color of the Forge Stone groove, from light at the top to the tier. */
const stoneGroove = (tier: ForgeStoneTier) =>
  `linear-gradient(to bottom, color-mix(in srgb, ${RANK_COLORS[tier]} 45%, white), ${RANK_COLORS[tier]})`;

/** The groove of the clock fills in the color of the Cargo at sea. */
const GROOVE: Readonly<
  Record<Exclude<ExpeditionCargo, "forgeStones">, string>
> = {
  coin: "linear-gradient(to bottom, #ffe08a, #c98f22)",
  xp: "linear-gradient(to bottom, #9fe7f5, #0e6f86)",
  essence: "linear-gradient(to bottom, #ffc2d8, #c2477a)",
};

/** The Forge Stone tier of a voyage, or `null` for the other Cargoes. */
const voyageStones = (expedition: Expedition) =>
  getCargo(expedition.cargo).forgeStones?.[expedition.hours] ?? null;

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
  const { expedition } = berth.active;
  const stones = voyageStones(expedition);
  const fill =
    expedition.cargo === "forgeStones"
      ? stoneGroove(stones?.tier ?? "epic")
      : GROOVE[expedition.cargo];
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-baseline justify-between gap-2">
        <span className={LABEL}>{tr("seaport.berth.timeLeft")}</span>
        <span
          role="timer"
          className="font-display text-[1.75rem] leading-none font-black tabular-nums [@media(max-height:500px)]:text-lg"
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
          className="absolute inset-y-0 left-0 rounded-full motion-safe:transition-[width] motion-safe:duration-1000 motion-safe:ease-linear"
          style={{ width: `${share * 100}%`, backgroundImage: fill }}
          data-testid="berth-groove"
        />
      </span>
    </div>
  );
};

/** The unit of a big number in the color of its Cargo, dark for parchment (AA). */
const Unit = ({
  className,
  children,
}: {
  readonly className: string;
  readonly children: ReactNode;
}) => (
  <span
    className={cn(
      "text-base font-bold [@media(max-height:500px)]:text-sm",
      className
    )}
  >
    {children}
  </span>
);

/**
 * The cargo on the quay: the reward of a full voyage, or of the last Collect,
 * as one big number with the Cargo icon, as the Manifest shows it. A Cargo
 * gives only its own resource; a reward with nothing in it shows its Coin, 0.
 * With `countIn`, the icon stamps and the number counts up when it shows.
 */
const CargoHaul = ({
  reward,
  countIn = false,
}: {
  readonly reward: Pick<
    ExpeditionReward,
    "coin" | "xp" | "essence" | "forgeStones"
  >;
  readonly countIn?: boolean;
}) => {
  const { tr } = useGameText();
  const format = useNumberFormat();
  const stones = reward.forgeStones;
  let cargo: ExpeditionCargo = "coin";
  if (stones) {
    cargo = "forgeStones";
  } else if (reward.xp > 0) {
    cargo = "xp";
  } else if (reward.essence > 0) {
    cargo = "essence";
  }
  const amount = reward.coin + reward.xp + reward.essence;
  // With `countIn`, the number counts up from 0 after the stamp starts.
  const shown = useCountTo(amount, countIn ? 200 : 0, countIn ? 0 : amount);

  let value: ReactNode = null;
  if (stones) {
    value = (
      <span
        className={cn(BIG, "flex items-baseline gap-1.5")}
        data-testid="reward-stones"
        data-count={stones.count}
        data-tier={stones.tier}
      >
        <span>{stones.count}</span>
        <Unit className="text-[#5b4632]">
          {tr("seaport.manifest.stones", {
            tier: tr(`forgeStones.tiers.${stones.tier}`),
          })}
        </Unit>
      </span>
    );
  } else if (cargo === "coin") {
    value = (
      <span
        className={cn(BIG, "flex items-center")}
        data-testid="reward-coin"
        data-copper={reward.coin}
      >
        <span className="sr-only">
          {coinWords(reward.coin, format, (denomination) =>
            tr(`town.balances.denominations.${denomination}.name`)
          )}
        </span>
        <span aria-hidden className="flex items-center">
          <CoinAmount
            parts={coinDenominations(shown)}
            format={format}
            tone="light"
          />
        </span>
      </span>
    );
  } else {
    value = (
      <span
        className={cn(BIG, "flex items-baseline gap-1.5")}
        data-testid={`reward-${cargo}`}
        {...(cargo === "xp"
          ? { "data-xp": reward.xp }
          : { "data-essence": reward.essence })}
      >
        <span aria-hidden>{format(shown)}</span>
        <span className="sr-only">{format(amount)}</span>
        <Unit className={cargo === "xp" ? "text-xp-ink" : "text-[#8f2a55]"}>
          {tr(`seaport.units.${cargo}`)}
        </Unit>
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-3 py-1 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:py-0"
      data-testid="cargo-haul"
    >
      <span
        className={cn(
          "flex shrink-0",
          countIn &&
            "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
        )}
      >
        <CargoIcon
          cargo={cargo}
          tier={stones?.tier}
          className="size-9 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] [@media(max-height:500px)]:size-6"
        />
      </span>
      {value}
    </div>
  );
};

/** The plate at the berth with the last Collect: the receipt of the voyage. */
const Receipt = ({ last }: { readonly last: LastCollect }) => {
  const { tr } = useGameText();
  const levelUp = last.levelAfter > last.levelBefore;
  return (
    <div
      className="flex flex-col items-start gap-2 [@media(max-height:500px)]:gap-1.5"
      data-testid="berth-last-collect"
    >
      <CargoHaul reward={last.reward} />
      {levelUp ? (
        <p
          className="rounded-lg border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] px-3 py-1 text-sm font-black text-[#2a1a05] shadow-[0_3px_0_rgba(0,0,0,0.35)] motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_200ms_both] [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:text-xs"
          data-testid="berth-level-up"
        >
          {tr("battle.levelUp", { level: last.levelAfter })}
        </p>
      ) : null}
    </div>
  );
};

/** The voyage of the plate in a small chip under its title: the Cargo icon and its name. */
const VoyageChip = ({ expedition }: { readonly expedition: Expedition }) => {
  const voyageName = useVoyageName();
  return (
    <p
      id="berth-voyage"
      className="mt-1 flex w-fit items-center gap-1 rounded-md bg-[#ead9b4] py-0.5 pr-2 pl-1 text-xs leading-tight font-bold text-[#2a1d12] [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:text-[11px]"
      data-testid="berth-voyage"
    >
      <CargoIcon
        cargo={expedition.cargo}
        tier={voyageStones(expedition)?.tier}
        className="size-3.5 shrink-0"
      />
      {voyageName(expedition)}
    </p>
  );
};

/** The plate while the ship is away: the clock, the reward of a Collect now, and the warnings. */
const AtSea = ({
  berth,
  now,
  confirming,
}: {
  readonly berth: Extract<Berth, { kind: "away" }>;
  readonly now: number;
  readonly confirming: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <>
      <VoyageClock berth={berth} now={now} />
      <div className="flex flex-col gap-1">
        <p className={LABEL}>{tr("seaport.berth.collectNow")}</p>
        <RewardLines
          reward={berth.active.reward}
          stones={voyageStones(berth.active.expedition)}
          stonesLater
          tone="light"
        />
      </div>
      {confirming ? (
        <p
          role="alert"
          className="text-xs leading-snug font-semibold text-[#8f2a2a]"
          data-testid="berth-call-back"
        >
          {tr("seaport.berth.callBackWarning")}
        </p>
      ) : null}
      {berth.canCollect ? null : (
        <p
          className="text-xs leading-snug text-[#8f2a2a]"
          data-testid="berth-clock-back"
        >
          {tr("seaport.berth.clockBack")}
        </p>
      )}
    </>
  );
};

/** The key of the plate title: the state of the ship, or the receipt of a Collect. */
const titleKey = (kind: Berth["kind"], collected: boolean) => {
  if (kind === "away") {
    return "seaport.berth.away";
  }
  if (kind === "back") {
    return "seaport.berth.back";
  }
  return collected ? "seaport.berth.collectedTitle" : "seaport.berth.atBerth";
};

/**
 * The berth plate (Economy 2.8): the state of the ship. The title gives only
 * the state, and a chip under it names the voyage. While the ship is away,
 * the plate shows the time left over a groove in the color of the Cargo, and
 * the reward that a Collect gives now (pro rata); the Forge Stone row says
 * that it comes when the ship is back. When the ship is back, the full
 * reward is one big number: the Cargo icon stamps and the number counts up.
 * After a Collect, the plate is the receipt of the voyage, with the Level up
 * chip. At the berth with no Collect, it says what to do first.
 *
 * Collect takes the reward at once, also early: the Player keeps the share
 * of the time away. It is gold only when the ship is back (The Gold Means Act
 * Rule). An early Collect of the Forge Stone Cargo gives nothing, so it is
 * "Call back early" and needs a second press: the first press says that no
 * Forge Stone comes.
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
  const voyageName = useVoyageName();
  const seaport = useAtomValue(seaportAtom);
  const { now, sync } = useNow();
  const { collect } = useSeaport();
  const [confirming, setConfirming] = useState(false);
  const berth = berthAt({ seaport }, now);
  // The Forge Stone Cargo gives nothing before the ship is back.
  const callBack =
    berth.kind === "away" && berth.active.expedition.cargo === "forgeStones";

  const onCollect = () => {
    if (callBack && !confirming) {
      setConfirming(true);
      return;
    }
    const done = collect();
    if (done !== null) {
      sync(done.at);
      unlockAudio();
      playSound("claim");
    }
    onCollected(done?.result ?? null);
  };

  // The voyage that the chip names: the one at sea, or the last Collect.
  let voyage = last?.expedition ?? null;
  if (berth.kind !== "atBerth") {
    voyage = berth.active.expedition;
  }
  const name = voyage === null ? "" : voyageName(voyage);
  let collectText = tr("seaport.berth.collect");
  if (callBack) {
    collectText = confirming
      ? tr("seaport.berth.callBackConfirm")
      : tr("seaport.berth.callBack");
  }
  const title = tr(titleKey(berth.kind, last !== null));

  return (
    <section
      aria-labelledby={
        voyage === null ? "berth-title" : "berth-title berth-voyage"
      }
      className={PARCHMENT}
      data-testid="berth-plate"
      data-state={berth.kind}
    >
      <header className="flex items-center gap-2.5 border-b-2 border-[#c9b48c] pb-2.5 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pb-1.5">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-[#fff6df] shadow-[0_2px_0_rgba(0,0,0,0.35)] [@media(max-height:500px)]:size-6"
        >
          <GlyphIcon
            glyph="anchor"
            className="size-4.5 [@media(max-height:500px)]:size-3"
          />
        </span>
        <div className="min-w-0">
          <h2
            id="berth-title"
            className="font-display truncate text-xl leading-tight font-black [@media(max-height:500px)]:text-sm"
            data-testid="berth-title"
          >
            {title}
          </h2>
          {voyage === null ? null : <VoyageChip expedition={voyage} />}
        </div>
      </header>
      {berth.kind === "atBerth" && last === null ? (
        <p className="text-sm leading-snug text-[#5b4632] [@media(max-height:500px)]:text-xs">
          {tr("seaport.berth.atBerthHint")}
        </p>
      ) : null}
      {berth.kind === "atBerth" && last !== null ? (
        <Receipt last={last} />
      ) : null}
      {berth.kind === "away" ? (
        <AtSea berth={berth} now={now} confirming={confirming} />
      ) : null}
      {berth.kind === "back" ? (
        <CargoHaul reward={berth.active.reward} countIn />
      ) : null}
      {berth.kind === "atBerth" ? null : (
        <GameButton
          intent={berth.kind === "back" ? "gold" : "wood"}
          size="lg"
          isDisabled={berth.kind === "away" && !berth.canCollect}
          onPress={onCollect}
          aria-label={
            callBack
              ? `${collectText}: ${name}`
              : tr("seaport.berth.collectLabel", { name })
          }
          className="font-display w-full shrink-0 tracking-[0.04em] [@media(max-height:500px)]:min-h-10 [@media(max-height:500px)]:text-base"
          data-testid="seaport-collect"
        >
          {collectText}
        </GameButton>
      )}
    </section>
  );
};
