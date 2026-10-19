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
  /** The press of the wax seal: it changes with each Claim. */
  const [seal, setSeal] = useState(0);
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
    setSeal((current) => current + 1);
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

  return { flights, stamps, seal, launch, stamp, handleLanded };
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
 * One roller of the royal scroll: a turned wood cylinder with the grain of
 * the Town Bar along its length, a lit top edge, a shaded bottom edge, a
 * bronze collar near each end and a bronze cap outside each end. The
 * parchment hangs from the top roller and rolls onto the bottom one. When the
 * scroll opens, the bottom roller drops from the top roller to its place; its
 * drop has the time and the curve of the unroll, so its lower edge is the
 * reveal: no paper ever shows below it. It goes when the decree of its
 * category pulls away, so two bottom rollers never show at once.
 */
const COLLAR =
  "absolute inset-y-[3px] w-[3px] rounded-full bg-[linear-gradient(90deg,#8a5a20,#f7dc9c)] opacity-80 [@media(max-height:500px)]:inset-y-0.5";

const CAP =
  "absolute top-1/2 size-[30px] -translate-y-1/2 rounded-full border-2 border-[#8a5a20] bg-[radial-gradient(circle_at_35%_30%,#f7dc9c,#b47f36_70%)] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-[22px]";

const Roller = ({ edge }: { readonly edge: "top" | "bottom" }) => (
  <span
    aria-hidden
    className={cn(
      "pointer-events-none absolute -inset-x-3.5 h-[26px] [@media(max-height:500px)]:-inset-x-2.5 [@media(max-height:500px)]:h-5",
      edge === "top"
        ? "-top-[13px] z-20 [@media(max-height:500px)]:-top-[10px]"
        : "-bottom-[13px] z-10 group-data-[exiting]/roll:hidden motion-safe:animate-[achievements-roller-drop_460ms_cubic-bezier(0.33,0.9,0.28,1)_both] [@media(max-height:500px)]:-bottom-[10px]"
    )}
  >
    <span
      className="absolute inset-0 rounded-full border-2 border-[#2a1a0c] shadow-[0_3px_0_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,214,150,0.45),inset_0_-4px_0_rgba(0,0,0,0.5)]"
      style={{
        background: [
          "repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0 2px, transparent 2px 17px)",
          "linear-gradient(90deg, #2a1a0c, #563720 14%, #7a5233 50%, #563720 86%, #2a1a0c)",
          "linear-gradient(180deg, rgba(255,224,170,0.6) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.6) 100%)",
        ].join(", "),
      }}
    />
    <span className={cn(COLLAR, "left-[20%]")} />
    <span className={cn(COLLAR, "right-[20%]")} />
    <span
      className={cn(CAP, "-left-[13px] [@media(max-height:500px)]:-left-2.5")}
    />
    <span
      className={cn(CAP, "-right-[13px] [@media(max-height:500px)]:-right-2.5")}
    />
  </span>
);

/** The blob of the wax seal: a ring with a small drip at its lower right. */
const SEAL_BLOB =
  "M20 1.6C24.4 1.6 27.4 3.3 29.6 6.4C33.4 5.8 37.6 9.2 35.9 13.3C39.3 16.3 38.5 21.7 34.3 23.9C36.2 28.7 31.8 33.9 26.6 32.9C24.6 37 17.5 37.7 14.9 34.2C10.2 36.5 4.9 32.2 6 27.3C2 25.3 1 19.5 4.5 16.3C2.3 12.1 6.1 7.3 10.5 8.3C12.1 4.3 16 1.6 20 1.6Z";

/**
 * The wax seal of the decree: the four-point star of the Heynbord emblem
 * pressed into blood-banner wax. It is ornament, so it carries no action and
 * no label. It presses into the parchment when the scroll unrolls, and again
 * when a Claim lands: `tick` remounts it, so the press plays each time.
 */
const WaxSeal = ({
  tick,
  category,
}: {
  readonly tick: number;
  readonly category: string;
}) => {
  const wax = `wax-seal-face-${category}`;
  return (
    <span
      key={tick}
      aria-hidden
      className="relative grid size-[34px] shrink-0 place-items-center motion-safe:animate-[achievements-seal_360ms_cubic-bezier(0.2,0.8,0.2,1)_both] [@media(max-height:500px)]:size-[26px]"
      style={{ animationDelay: tick === 0 ? "280ms" : "0ms" }}
      data-testid="achievements-seal"
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <radialGradient id={wax} cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#c9483d" />
            <stop offset="55%" stopColor="#9c2320" />
            <stop offset="100%" stopColor="#571010" />
          </radialGradient>
        </defs>
        <path
          d={SEAL_BLOB}
          fill={`url(#${wax})`}
          stroke="#4a0d0d"
          strokeWidth="1.2"
        />
        <circle
          cx="20"
          cy="20"
          r="14.2"
          fill="none"
          stroke="#ffd9a0"
          strokeOpacity="0.32"
          strokeWidth="1"
        />
        <path
          d="M0 -9L2.5 -2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5 -2.5Z"
          transform="translate(20 20) scale(0.8)"
          fill="#ffd9a0"
        />
      </svg>
    </span>
  );
};

/**
 * The uneven warm tone of the parchment: a light from the upper left and a
 * soft shadow at the lower right, so the paper does not read as a flat fill.
 */
const PAPER_TONE = [
  "radial-gradient(ellipse 70% 55% at 14% 0%, rgba(255,248,226,0.85), transparent 68%)",
  "radial-gradient(ellipse 55% 45% at 92% 100%, rgba(190,158,104,0.24), transparent 70%)",
].join(", ");

/**
 * The roll of one category: its name and count, its rows, and Claim all.
 * Claim all claims the Completed Achievements of all categories, so its
 * count and the text next to it are for all of them.
 */
const Roll = ({
  group,
  claimable,
  seal,
  list,
  claimAll,
  stamps,
  onClaim,
  onClaimAll,
}: {
  readonly group: AchievementGroup;
  /** The rewards to claim in all categories. */
  readonly claimable: number;
  /** The press of the wax seal: it changes with each Claim. */
  readonly seal: number;
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
        // The scroll keeps one height for each category, so the flags do not
        // move when the Player selects another one. It is at the left of the
        // pole, in the column between the mirror and the flag rail.
        "group/roll relative z-10 col-start-2 row-start-1 my-4 flex h-[calc(100%-2rem)] max-h-[46rem] min-h-0 flex-col self-center rounded-[3px] outline-none",
        "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
        "motion-safe:animate-[achievements-unroll_460ms_cubic-bezier(0.33,0.9,0.28,1)_both]",
        // The old decree pulls away to the top under the new one, and its
        // bottom roller goes with it, so two rollers never show at once.
        "data-[exiting]:pointer-events-none data-[exiting]:z-0 data-[exiting]:motion-safe:animate-[achievements-roll-away_160ms_cubic-bezier(0.45,0,0.7,1)_both]"
      )}
      data-testid={`achievements-roll-${group.category}`}
    >
      {/* The parchment. The scroll clips it, so it unrolls down from the top
          roller while the bottom roller drops with the reveal edge. */}
      <div
        className={cn(
          "relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-[3px] border border-[#d9c39a] bg-[#f6ead0] text-[#2a1d12]",
          "shadow-[inset_0_3px_0_rgba(255,250,235,0.75),inset_0_2px_0_rgba(255,255,255,0.55),0_3px_0_rgba(0,0,0,0.4),0_20px_42px_rgba(0,0,0,0.5)]"
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: PAPER_TONE }}
        />
        {/* The shade that the top roller makes on the paper, and the curled
            shade near the bottom roller. The paper bends a little around the
            roller, so a dark line sits right at the edge under a soft band.
            Neither reaches the text. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-[linear-gradient(180deg,rgba(107,74,38,0.62)_0,rgba(107,74,38,0.3)_38%,transparent_100%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#fffaf0]/80"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-[linear-gradient(0deg,rgba(107,74,38,0.55)_0,rgba(107,74,38,0.26)_38%,transparent_100%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#fffaf0]/60"
        />
        {/* The line of light at the lower edge of the unrolling paper. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-[linear-gradient(180deg,transparent,rgba(255,246,214,0.8),transparent)] motion-safe:animate-[achievements-curl_460ms_cubic-bezier(0.33,0.9,0.28,1)_both]"
        />
        <header className="relative flex items-center gap-3 border-b-2 border-[#c9b48c] px-5 pt-5 pb-2.5 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:pt-4 [@media(max-height:500px)]:pb-1">
          <WaxSeal tick={seal} category={group.category} />
          <h2 className="font-display min-w-0 flex-1 text-[22px] leading-tight font-black [@media(max-height:500px)]:text-base">
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
          {/* The illuminated rule: a thin gold hairline under the rule, with a
              small gold diamond at its center. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-5 -bottom-px h-px bg-[#e2a93b]/45 [@media(max-height:500px)]:hidden"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-[3px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 border border-[#7a5310] bg-[#e2a93b] [@media(max-height:500px)]:hidden"
          />
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
          {group.rows.map((row, index) => (
            <AchievementRow
              key={row.achievement.id}
              row={row}
              index={index}
              stamp={stamps[row.achievement.id] ?? null}
              onClaim={onClaim}
            />
          ))}
        </ul>
        <footer className="relative flex items-center justify-between gap-3 bg-[#ead9b4] px-5 pt-2.5 pb-4 shadow-[inset_0_2px_0_#c9b48c] [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:pt-1 [@media(max-height:500px)]:pb-3.5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-5 top-[3px] h-px bg-[#e2a93b]/35 [@media(max-height:500px)]:hidden"
          />
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
      </div>
      <Roller edge="top" />
      <Roller edge="bottom" />
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
          // The scroll of the open category stands at the middle of the
          // screen, so its center is on the center of the screen. The flag
          // rail that hangs at its right is then balanced by a mirror of its
          // width at its left: `--mirror`. The grid is the width of the
          // content box (1080px) plus that mirror and one gap, so the scroll
          // keeps the width it had (1080px, less the flag rail and one gap).
          "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+3.75rem)] bottom-[92px] left-1/2 grid -translate-x-1/2",
          "[--flag:19.5rem] [--gap:0.75rem] [--mirror:19.5rem]",
          "w-[min(calc(100vw-1.5rem),calc(1080px+var(--mirror)+var(--gap)))] grid-cols-[var(--mirror)_minmax(0,1fr)_var(--flag)] grid-rows-[minmax(0,1fr)] gap-x-[var(--gap)]",
          // A screen that is too narrow for a mirror at the left of the
          // scroll has none: the scroll goes back to the left of the pole.
          "[@media(max-width:1240px)_and_(min-height:501px)]:[--mirror:0rem]",
          "max-[860px]:[--flag:14rem]",
          "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:bottom-[62px] [@media(max-height:500px)]:w-[min(calc(100vw-max(0.5rem,env(safe-area-inset-left))-max(0.5rem,env(safe-area-inset-right))),calc(1080px+var(--mirror)+var(--gap)))] [@media(max-height:500px)]:[--flag:6.25rem] [@media(max-height:500px)]:[--gap:0.5rem] [@media(max-height:500px)]:[--mirror:6.25rem]"
        )}
      >
        {/* The pole of the Hall, at the right of the scroll: frame wood with a
            bronze finial at each end. It is the last column of the grid, and
            the mirror of its width at the left of the scroll keeps the scroll
            at the middle of the screen. The flags hang from it and fly to the
            right, and the space at the right of the list is for the selected
            flag, which flies longer. It is first in the DOM, so the flags
            come before the scroll in the tab order. */}
        <div className="relative col-start-3 row-start-1 self-center py-6 pr-6 pl-7 [@media(max-height:500px)]:py-4 [@media(max-height:500px)]:pl-5">
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
            seal={motion.seal}
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
