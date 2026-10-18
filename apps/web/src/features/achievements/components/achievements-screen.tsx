import type { AchievementDefinition } from "@workspace/rules";
import { cn } from "cn";
import type { RefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Key } from "react-aria-components";
import { Button, TabList, TabPanel, Tabs } from "react-aria-components";

import type { AchievementGroup } from "@/features/achievements/achievements";
import {
  claimFocusAfter,
  openingCategory,
  rewardBalances,
  rewardText,
} from "@/features/achievements/achievements";
import { AchievementRow } from "@/features/achievements/components/achievement-row";
import { BannerFlag } from "@/features/achievements/components/banner-flag";
import { HallScene } from "@/features/achievements/components/hall-scene";
import type { RewardFlightPath } from "@/features/achievements/components/reward-flight";
import {
  measureRewardFlight,
  REWARD_FLY_MS,
  RewardFlight,
} from "@/features/achievements/components/reward-flight";
import { useAchievements } from "@/features/achievements/use-achievements";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { gameButtonStyles } from "@/features/battle/components/game-button";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import { useCoinFormat } from "@/features/packs/use-coin-format";
import { BalancePlate } from "@/features/town/components/balance-plate";
import { useCountTo } from "@/features/workshop/use-count-to";

/** The wait between the seals of a Claim all, row after row. */
const STAMP_STAGGER_MS = 60;

/** The wait between the flights of a Claim all, one for each balance. */
const FLIGHT_STAGGER_MS = 90;

/**
 * The sound of a Claim when the reward gets to its balance, or at once with
 * reduced motion, because then nothing flies. The timers stop when the
 * screen closes.
 */
const useClaimSound = () => {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  return (delay: number) => {
    unlockAudio();
    if (prefersReducedMotion()) {
      playSound("claim", 0);
      return;
    }
    timers.current.push(
      window.setTimeout(() => playSound("claim", 0), delay + REWARD_FLY_MS)
    );
  };
};

/**
 * The flights of the claimed rewards, and the seals that stamp on this
 * visit. A Claim measures its flight before the Profile changes, because the
 * row changes after it.
 */
const useClaimMotion = () => {
  const [flights, setFlights] = useState<readonly RewardFlightPath[]>([]);
  const [stamps, setStamps] = useState<Readonly<Record<string, number>>>({});
  const serial = useRef(0);
  const sound = useClaimSound();

  const launch = (
    from: Element | null,
    achievements: readonly AchievementDefinition[]
  ) => {
    const kinds = rewardBalances(achievements.map((item) => item.reward));
    const motion = !prefersReducedMotion();
    const next = motion
      ? kinds.flatMap((kind, index) => {
          serial.current += 1;
          const path = measureRewardFlight(
            from,
            kind,
            serial.current,
            index * FLIGHT_STAGGER_MS
          );
          return path ? [path] : [];
        })
      : [];
    if (next.length > 0) {
      setFlights((current) => [...current, ...next]);
    }
    sound(0);
  };

  const stamp = (ids: readonly string[]) =>
    setStamps((current) => ({
      ...current,
      ...Object.fromEntries(
        ids.map((id, index) => [id, index * STAMP_STAGGER_MS])
      ),
    }));

  const handleLanded = useCallback((done: number) => {
    setFlights((current) => current.filter((flight) => flight.serial !== done));
  }, []);

  return { flights, stamps, launch, stamp, handleLanded };
};

/**
 * The balances on the Balance Plate. Each one counts to its new value when
 * the flight of a reward gets to it.
 */
const useCountedBalances = (balances: {
  readonly coin: number;
  readonly essence: number;
  readonly heynstones: number;
}) => ({
  coin: useCountTo(balances.coin, REWARD_FLY_MS),
  essence: useCountTo(balances.essence, REWARD_FLY_MS),
  heynstones: useCountTo(balances.heynstones, REWARD_FLY_MS),
});

/**
 * One wooden roller of the roll: frame wood with the grain of the Town Bar,
 * a little wider than the parchment, with a bronze cap at each end. The
 * parchment hangs from the top roller and rolls onto the bottom one. When the
 * roll opens, the bottom roller drops from the top roller to its place. Its
 * drop has the time and curve of the unroll of the roll, so the parchment
 * ends at the roller.
 */
const Roller = ({ edge }: { readonly edge: "top" | "bottom" }) => (
  <span
    aria-hidden
    className={cn(
      "pointer-events-none absolute -inset-x-3.5 z-10 h-4 rounded-full border-2 border-[#2a1a0c] shadow-[inset_0_2px_0_rgba(255,214,150,0.3),0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:-inset-x-2.5 [@media(max-height:500px)]:h-3",
      edge === "top"
        ? "-top-2.5 [@media(max-height:500px)]:-top-2"
        : "-bottom-2.5 motion-safe:animate-[achievements-roller-drop_420ms_cubic-bezier(0.2,0.8,0.2,1)] [@media(max-height:500px)]:-bottom-2"
    )}
    style={{
      background: [
        "repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 15px)",
        "linear-gradient(180deg, #7a5233 0%, #5b3a1e 50%, #2e1d10 100%)",
      ].join(", "),
    }}
  >
    <span className="absolute top-1/2 -left-1.5 size-5 -translate-y-1/2 rounded-full border-2 border-[#8a5a20] bg-[radial-gradient(circle_at_35%_30%,#f7dc9c,#b47f36_70%)] [@media(max-height:500px)]:size-4" />
    <span className="absolute top-1/2 -right-1.5 size-5 -translate-y-1/2 rounded-full border-2 border-[#8a5a20] bg-[radial-gradient(circle_at_35%_30%,#f7dc9c,#b47f36_70%)] [@media(max-height:500px)]:size-4" />
  </span>
);

/**
 * The roll of one category: its name and count, its rows, and Claim all.
 * Claim all claims the Completed Achievements of all categories, so its
 * count and the text next to it are for all of them.
 */
const Roll = ({
  group,
  claimable,
  list,
  claimAll,
  stamps,
  onClaim,
  onClaimAll,
}: {
  readonly group: AchievementGroup;
  /** The rewards to claim in all categories. */
  readonly claimable: number;
  readonly list: RefObject<HTMLUListElement | null>;
  readonly claimAll: RefObject<HTMLButtonElement | null>;
  readonly stamps: Readonly<Record<string, number>>;
  readonly onClaim: (id: string) => void;
  readonly onClaimAll: () => void;
}) => {
  const { tr } = useGameText();
  const name = tr(`achievements.screen.categories.${group.category}`);
  return (
    <TabPanel
      id={group.category}
      className={cn(
        // The roll keeps one height for each category, so the flags do not
        // move when the Player selects another one. It is at the left of the
        // pole.
        "relative z-10 col-start-1 row-start-1 my-2.5 flex h-[calc(100%-1.25rem)] max-h-[46rem] min-h-0 flex-col self-center rounded-sm border-x-4 border-[#5b3a1e] bg-[#f6ead0] text-[#2a1d12] outline-none",
        "shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_3px_0_rgba(0,0,0,0.45),0_18px_36px_rgba(0,0,0,0.45)]",
        "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
        "motion-safe:animate-[achievements-unroll_420ms_cubic-bezier(0.2,0.8,0.2,1)]",
        // React Aria keeps a deselected roll while its unroll still runs. It
        // then is a second roll in the grid and pushes the open roll. Hidden,
        // its unroll stops and it goes at once.
        "data-[exiting]:hidden"
      )}
      data-testid={`achievements-roll-${group.category}`}
    >
      <Roller edge="top" />
      <Roller edge="bottom" />
      <header className="flex items-baseline justify-between gap-3 border-b-2 border-[#c9b48c] px-5 pt-4 pb-2.5 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-1">
        <h2 className="font-display text-[22px] leading-tight font-black [@media(max-height:500px)]:text-base">
          {name}
        </h2>
        <p
          className="shrink-0 text-[13px] font-semibold text-[#5b4632] tabular-nums [@media(max-height:500px)]:text-[11px]"
          data-testid="achievements-roll-count"
        >
          {tr("achievements.screen.countLabel", {
            done: group.done,
            total: group.rows.length,
          })}
        </p>
      </header>
      <ul
        ref={list}
        tabIndex={-1}
        aria-label={name}
        className={cn(
          "m-0 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain py-0.5 outline-none",
          "[scrollbar-width:thin] [scrollbar-color:#b39a70_transparent]"
        )}
        data-testid="achievements-list"
      >
        {group.rows.map((row) => (
          <AchievementRow
            key={row.achievement.id}
            row={row}
            stamp={stamps[row.achievement.id] ?? null}
            onClaim={onClaim}
          />
        ))}
      </ul>
      <footer className="flex items-center justify-between gap-3 bg-[#ead9b4] px-5 pt-2.5 pb-3.5 shadow-[inset_0_2px_0_#c9b48c] [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:pb-2">
        <p
          className="text-[13px] font-semibold text-[#5b4632] [@media(max-height:500px)]:text-[11px]"
          aria-hidden
        >
          {claimable > 0
            ? tr("achievements.screen.toClaim", { count: claimable })
            : tr("achievements.screen.noneToClaim")}
        </p>
        <Button
          ref={claimAll}
          isDisabled={claimable === 0}
          onPress={onClaimAll}
          aria-label={
            claimable > 0
              ? tr("achievements.screen.claimAllLabel", { count: claimable })
              : `${tr("achievements.screen.claimAll")}, ${tr("achievements.screen.noneToClaim")}`
          }
          className={gameButtonStyles({
            intent: "gold",
            size: "lg",
            className:
              "font-display font-bold [@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:text-sm",
          })}
          data-testid="achievements-claim-all"
        >
          {tr("achievements.screen.claimAll")}
          {claimable > 0 ? (
            <span
              aria-hidden
              className="grid h-6 min-w-6 place-items-center rounded-full bg-[#2a1a05] px-1 font-sans text-xs font-black text-[#ffe08a] tabular-nums [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:min-w-5"
            >
              {claimable}
            </span>
          ) : null}
        </Button>
      </footer>
    </TabPanel>
  );
};

/**
 * The Achievements screen (Achievements 4, issue #103, "Banner Tabs"): the
 * inside of the Hall of banners and the Balance Plate. One
 * flag for each category hangs on the pole at the right of the roll of the
 * selected category, and flies to the right. The screen opens on the first
 * category with a reward to claim. A Claim adds the reward at once: its icon
 * flies into its balance, the balance counts up and the row stamps its
 * check seal. After a Claim, the focus goes to the next Claim, else to Claim
 * all, else to the list.
 */
export const AchievementsScreen = () => {
  const { tr, text } = useGameText();
  const coin = useCoinFormat();
  const achievements = useAchievements();
  const { groups } = achievements;
  const balances = useCountedBalances(achievements.balances);
  const motion = useClaimMotion();
  const [selected, setSelected] = useState<Key>(() => openingCategory(groups));
  const [said, setSaid] = useState("");
  const list = useRef<HTMLUListElement>(null);
  const claimAllButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<{ readonly target: string | null } | null>(null);
  const claimable = groups.reduce((sum, group) => sum + group.claimable, 0);

  // After a Claim: the focus goes to the next Claim of the open category,
  // else to Claim all while it is on, else to the list.
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (pending === null) {
      return;
    }
    pendingFocus.current = null;
    const { target } = pending;
    const open =
      target !== null &&
      groups.some((group) =>
        group.rows.some(
          (row) => row.achievement.id === target && row.state === "completed"
        )
      );
    const next = open
      ? document.querySelector<HTMLElement>(`[data-claim="${target}"]`)
      : null;
    const all = claimAllButton.current;
    if (next) {
      next.focus();
    } else if (all && !all.disabled) {
      all.focus();
    } else {
      list.current?.focus();
    }
  }, [groups]);

  const claim = (id: string) => {
    const open = groups.find((group) =>
      group.rows.some((row) => row.achievement.id === id)
    );
    const from = document.querySelector(`[data-reward-of="${id}"]`);
    const before = open?.rows ?? [];
    const claimed = achievements.claim(id);
    const [first] = claimed;
    if (first === undefined) {
      return;
    }
    pendingFocus.current = { target: claimFocusAfter(before, id) };
    // A Cosmetic has no balance, so it does not fly.
    motion.launch(from, claimed);
    motion.stamp([id]);
    setSaid(
      tr("achievements.screen.said.one", {
        name: tr(`achievements.${id}.name`),
        reward: text(rewardText(first.reward, "claimed", coin.words)),
      })
    );
  };

  const claimAll = () => {
    const from = claimAllButton.current;
    const claimed = achievements.claimAll();
    if (claimed.length === 0) {
      return;
    }
    pendingFocus.current = { target: null };
    motion.launch(from, claimed);
    // The rows of the open category stamp one after the other.
    const shown = new Set(
      groups
        .find((group) => group.category === selected)
        ?.rows.map((row) => row.achievement.id)
    );
    motion.stamp(
      claimed.flatMap((item) => (shown.has(item.id) ? [item.id] : []))
    );
    setSaid(tr("achievements.screen.said.many", { count: claimed.length }));
  };

  return (
    <main
      aria-label={tr("achievements.screen.label")}
      className="fade-in animate-in fixed inset-0 overflow-hidden text-[#fff6df] duration-300 motion-reduce:animate-none"
      data-testid="achievements"
    >
      {/* The Hall inside (Town Concepts 15). */}
      <HallScene />
      <BalancePlate balances={balances} />
      <Tabs
        orientation="vertical"
        selectedKey={selected}
        onSelectionChange={setSelected}
        className={cn(
          "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+3.75rem)] bottom-[92px] left-1/2 grid w-[min(calc(100vw-1.5rem),1080px)] -translate-x-1/2 grid-cols-[minmax(0,1fr)_19.5rem] grid-rows-[minmax(0,1fr)] gap-x-3",
          "max-[860px]:grid-cols-[minmax(0,1fr)_14rem]",
          "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:w-[calc(100vw-max(0.5rem,env(safe-area-inset-left))-max(0.5rem,env(safe-area-inset-right)))] [@media(max-height:500px)]:grid-cols-[minmax(0,1fr)_6.25rem] [@media(max-height:500px)]:gap-x-2"
        )}
      >
        {/* The pole of the Hall, at the right of the roll: frame wood with a
            bronze finial at each end. The flags hang from it and fly to the
            right, and the space at the right of the list is for the selected
            flag, which flies longer. It is first in the DOM, so the flags
            come before the roll in the tab order. */}
        <div className="relative col-start-2 row-start-1 self-center py-6 pr-6 pl-7 [@media(max-height:500px)]:py-4 [@media(max-height:500px)]:pl-5">
          <span
            aria-hidden
            className="absolute top-0 bottom-0 left-0.5 w-5 rounded-full border-2 border-[#2a1a0c] shadow-[0_3px_0_rgba(0,0,0,0.35)] [@media(max-height:500px)]:w-3.5"
            style={{
              background: [
                "repeating-linear-gradient(180deg, rgba(0,0,0,0.1) 0 2px, transparent 2px 19px)",
                "linear-gradient(90deg, #2a1a0c, #563720 25%, #7a5233 50%, #563720 75%, #2a1a0c)",
              ].join(", "),
            }}
          >
            {/* The finials are in the pole, so they stay on its center line
                at each size of the pole. The 2px of the pole border is in
                their top and bottom. The pole is lit at its center and its
                drop is straight down, so its center line is also where the
                eye sees it. */}
            <span className="absolute -top-3.5 left-1/2 size-7 -translate-x-1/2 rounded-full border-2 border-[#8a5a20] bg-[radial-gradient(circle_at_35%_30%,#f7dc9c,#b47f36_70%)] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-5" />
            <span className="absolute -bottom-3.5 left-1/2 size-7 -translate-x-1/2 rounded-full border-2 border-[#8a5a20] bg-[radial-gradient(circle_at_35%_30%,#f7dc9c,#b47f36_70%)] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-5" />
          </span>
          <TabList
            aria-label={tr("achievements.screen.categories.label")}
            className="flex flex-col gap-2.5 [@media(max-height:500px)]:gap-1.5"
          >
            {groups.map((group) => (
              <BannerFlag key={group.category} group={group} />
            ))}
          </TabList>
        </div>
        {groups.map((group) => (
          <Roll
            key={group.category}
            group={group}
            claimable={claimable}
            list={list}
            claimAll={claimAllButton}
            stamps={motion.stamps}
            onClaim={claim}
            onClaimAll={claimAll}
          />
        ))}
      </Tabs>
      {motion.flights.map((flight) => (
        <RewardFlight
          key={flight.serial}
          flight={flight}
          onDone={motion.handleLanded}
        />
      ))}
      <p className="sr-only" aria-live="polite" data-testid="achievements-said">
        {said}
      </p>
    </main>
  );
};
