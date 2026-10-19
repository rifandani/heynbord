import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { StarChestClaim } from "@workspace/rules";
import {
  CAMPAIGN_REGIONS,
  claimStarChest,
  coinDenominations,
  regionForgeStoneTier,
  STAGES,
  STAR_CHESTS,
} from "@workspace/rules";
import { cn } from "cn";
import type { ReactElement, ReactNode, RefObject } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  TooltipTrigger,
} from "react-aria-components";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GameButton } from "@/features/battle/components/game-button";
import { GameTooltip } from "@/features/battle/components/game-tooltip";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";
import {
  ChestIcon,
  StarIcon,
} from "@/features/campaign/components/campaign-icons";
import type { ChestState, RegionStatus } from "@/features/campaign/region-map";
import { chestState, regionStatus } from "@/features/campaign/region-map";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { profileAtom } from "@/features/profile/profile.atoms";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

/** The HUD plate of the top band (DESIGN.md, HUD plate). */
const PLATE =
  "flex h-16 items-center rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:h-10";

const TOOLTIP =
  "max-w-60 rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1.5 text-xs text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

/**
 * A piece with a tooltip on hover and focus. With touch, a tap shows it, as on
 * the Balance Plate.
 */
const TipPiece = ({
  tip,
  children,
}: {
  readonly tip: string;
  readonly children: (onPress: (event: PressEvent) => void) => ReactElement;
}) => {
  const [open, setOpen] = useState(false);
  const onPress = (event: PressEvent) => {
    if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };
  return (
    <TooltipTrigger
      isOpen={open}
      onOpenChange={setOpen}
      delay={200}
      shouldCloseOnPress={false}
    >
      {children(onPress)}
      <GameTooltip placement="bottom" offset={8} className={TOOLTIP}>
        {tip}
      </GameTooltip>
    </TooltipTrigger>
  );
};

/** The line about a Region that is not open, or `null` for an open Region. */
const useRegionLine = () => {
  const { tr } = useGameText();
  return (region: number, status: RegionStatus): string | null => {
    const name = tr(`campaign.regions.${region}`);
    if (status.kind === "later") {
      return tr("campaign.regionLater", { name });
    }
    if (status.kind === "locked") {
      return tr("campaign.regionLocked", {
        id: status.boss.id,
        stage: tr(`stages.${status.boss.id}.name`),
        name,
      });
    }
    return null;
  };
};

/**
 * The arrow to the previous or the next Region. It opens that Region, also a
 * locked one. While that Region is not open, the arrow shows a lock seal, and
 * its tooltip says why.
 */
const RegionArrow = ({
  region,
  direction,
  onRegion,
  ref,
}: {
  /** The Region that the arrow opens. */
  readonly region: number;
  readonly direction: "previous" | "next";
  readonly onRegion: (region: number) => void;
  readonly ref: RefObject<HTMLButtonElement | null>;
}) => {
  const { tr } = useGameText();
  const results = useAtomValue(stageResultsAtom);
  const line = useRegionLine();
  const name = tr(`campaign.regions.${region}`);
  const label = tr(
    direction === "next" ? "campaign.nextRegion" : "campaign.previousRegion",
    { name }
  );
  const status = regionStatus(STAGES, region, results);
  const why = line(region, status);
  const Chevron = direction === "next" ? HiChevronRight : HiChevronLeft;
  return (
    <TipPiece tip={why ? `${label}. ${why}` : label}>
      {() => (
        <Button
          ref={ref}
          onPress={() => {
            unlockAudio();
            playSound("select");
            onRegion(region);
          }}
          aria-label={label}
          className={cn(
            "relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-[#fff6df]/70 outline-none",
            "transition-colors duration-100 data-[hovered]:bg-[#fff6df]/10 data-[hovered]:text-[#fff6df]",
            "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
            "[@media(max-height:500px)]:size-8"
          )}
          data-testid={`${direction}-region`}
          data-region={region}
        >
          <Chevron className="size-6" aria-hidden />
          {status.kind === "open" ? null : (
            <span
              className={cn(
                "absolute bottom-0 grid size-4 place-items-center rounded-full border border-[#e9c46a]/70 bg-[#1c140e]",
                direction === "next" ? "right-0" : "left-0"
              )}
            >
              <GlyphIcon glyph="lock" className="size-2.5 text-[#e9c46a]" />
            </span>
          )}
        </Button>
      )}
    </TipPiece>
  );
};

/**
 * The Region name in the top band (GDD 11.5), with the arrows to the other
 * Regions. There is no arrow before Region 1 or after the last Region. Under
 * the name, a line tells which Region of all it is, or why it is not open.
 */
export const RegionBanner = ({
  region,
  onRegion,
}: {
  readonly region: number;
  readonly onRegion: (region: number) => void;
}) => {
  const { tr } = useGameText();
  const results = useAtomValue(stageResultsAtom);
  const line = useRegionLine();
  const name = tr(`campaign.regions.${region}`);
  const why = line(region, regionStatus(STAGES, region, results));
  const previous = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  // When an arrow goes away at the first or the last Region, the focus goes
  // to the other arrow after the render, so that it does not go to the page.
  const go = (target: number) => {
    onRegion(target);
    const other =
      target === 1 ? next : target === CAMPAIGN_REGIONS ? previous : null;
    if (other) {
      requestAnimationFrame(() => other.current?.focus());
    }
  };
  return (
    <header
      className={cn(
        PLATE,
        "absolute top-[max(0.5rem,env(safe-area-inset-top))] left-[max(0.5rem,env(safe-area-inset-left))] z-20 gap-1 pr-1.5",
        region > 1 ? "pl-1.5" : "pl-4 [@media(max-height:500px)]:pl-3"
      )}
      data-testid="region-banner"
      data-region={region}
      data-campaign-hud
    >
      {region > 1 ? (
        <>
          <RegionArrow
            ref={previous}
            region={region - 1}
            direction="previous"
            onRegion={go}
          />
          <span
            className="h-7 w-0.5 rounded-full bg-[#e9c46a]/25"
            aria-hidden
          />
        </>
      ) : null}
      <div
        className={cn(
          "flex min-w-0 flex-col justify-center pr-2",
          region > 1 && "pl-2"
        )}
      >
        <h1 className="font-display truncate text-3xl leading-none font-black tracking-[0.025em] text-[#ffe08a] [text-shadow:0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:text-2xl">
          {name}
        </h1>
        <p
          className="mt-1.5 flex items-center gap-1 text-xs leading-none font-semibold text-[#e8d9bb] [@media(max-height:500px)]:sr-only"
          data-testid="region-line"
        >
          {why ? (
            <>
              <GlyphIcon glyph="lock" className="size-3 text-[#e9c46a]" />
              {why}
            </>
          ) : (
            tr("campaign.regionOf", {
              number: region,
              count: CAMPAIGN_REGIONS,
            })
          )}
        </p>
      </div>
      {region < CAMPAIGN_REGIONS ? (
        <>
          <span
            className="h-7 w-0.5 rounded-full bg-[#e9c46a]/25"
            aria-hidden
          />
          <RegionArrow
            ref={next}
            region={region + 1}
            direction="next"
            onRegion={go}
          />
        </>
      ) : null}
    </header>
  );
};

/** What a claimed chest gave: its rewards and its Forge Stones of the Region. */
type ChestClaim = Pick<StarChestClaim<unknown>, "reward" | "forgeStones">;

/** One reward in the chest, with its icon and text. */
const RewardLine = ({
  icon,
  children,
  testId,
  index,
  revealed,
}: {
  readonly icon: ReactNode;
  readonly children: ReactNode;
  readonly testId: string;
  readonly index: number;
  readonly revealed: boolean;
}) => (
  <li
    className={cn(
      "grid min-h-16 translate-y-2 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2 rounded-xl border border-[#c9b48c] bg-[#fff3d1] px-3 py-2 text-left text-sm font-semibold text-[#2a1d12] opacity-0 transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none [@media(max-height:500px)]:min-h-14 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-1",
      revealed && "translate-y-0 opacity-100"
    )}
    style={{ transitionDelay: revealed ? `${index * 90}ms` : "0ms" }}
    data-testid={testId}
  >
    <span className="grid size-8 shrink-0 place-items-center" aria-hidden>
      {icon}
    </span>
    <span className="min-w-0 leading-snug">{children}</span>
  </li>
);

/**
 * The rewards of a Star chest (GDD 11.5). The chest opens first, then its
 * Coin, Essence, Forge Stones and Pack appear. The rewards are already in the
 * Profile when this dialog opens. Esc, OK and a click outside close it.
 */
const ChestRewards = ({
  claim,
  revealed,
  onClose,
}: {
  readonly claim: ChestClaim;
  readonly revealed: boolean;
  readonly onClose: () => void;
}) => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const ICON = "size-6";
  const { reward: chest, forgeStones } = claim;
  const lines: ReactElement[] = [];
  const addLine = (
    key: string,
    testId: string,
    icon: ReactNode,
    children: ReactNode
  ) => {
    lines.push(
      <RewardLine
        key={key}
        index={lines.length}
        revealed={revealed}
        testId={testId}
        icon={icon}
      >
        {children}
      </RewardLine>
    );
  };
  if (chest.coin > 0) {
    addLine(
      "coin",
      "chest-reward-coin",
      <BalanceIcon kind="coin" className={ICON} />,
      <>
        <span className="sr-only">
          {tr("battle.coinEarned", {
            amount: coinWords(chest.coin, format, (denomination) =>
              tr(`town.balances.denominations.${denomination}.name`)
            ),
          })}
        </span>
        <span className="flex items-center gap-1" aria-hidden>
          +
          <CoinAmount parts={coinDenominations(chest.coin)} format={format} />
        </span>
      </>
    );
  }
  if (chest.essence > 0) {
    addLine(
      "essence",
      "chest-reward-essence",
      <BalanceIcon kind="essence" className={ICON} />,
      tr("campaign.chest.essence", { amount: format(chest.essence) })
    );
  }
  if (forgeStones) {
    addLine(
      "forge-stones",
      "chest-reward-forge-stones",
      <ForgeStoneIcon tier={forgeStones.tier} className={ICON} />,
      tr("battle.forgeStonesEarned", {
        count: forgeStones.count,
        tier: tr(`forgeStones.tiers.${forgeStones.tier}`),
      })
    );
  }
  if (chest.pack) {
    addLine(
      "pack",
      "chest-reward-pack",
      <GlyphIcon glyph="pack" className={ICON} />,
      tr(
        chest.pack.version === "race"
          ? "campaign.chest.racePack"
          : "campaign.chest.pack",
        { pack: tr(`packs.names.${chest.pack.pack}`) }
      )
    );
  }

  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      isDismissable
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px] [@media(max-height:500px)]:p-2"
      data-testid="chest-rewards"
    >
      <Modal className="fade-in zoom-in-95 animate-in w-[min(560px,96vw)] overflow-hidden rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] shadow-[0_24px_48px_rgba(0,0,0,0.55)] duration-200 motion-reduce:animate-none">
        <Dialog className="max-h-[92dvh] overflow-y-auto px-5 pt-4 pb-5 outline-none [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-3">
          <Heading
            slot="title"
            className="font-display text-center text-xl leading-tight font-black text-[#2a1d12] [@media(max-height:500px)]:text-lg"
          >
            {tr("campaign.chest.claimedTitle", { stars: chest.stars })}
          </Heading>
          <div
            className="relative mx-auto mt-3 grid size-24 place-items-center rounded-full border-2 border-[#b47f36] bg-[#ead9b4] shadow-[0_4px_0_rgba(42,26,12,0.25)] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:size-16"
            aria-hidden
          >
            <span
              className={cn(
                "absolute inset-0 scale-50 rounded-full bg-[radial-gradient(circle,rgba(255,215,90,0.8)_0%,rgba(255,215,90,0)_72%)] opacity-0 transition-[opacity,scale] duration-500 ease-out motion-reduce:transition-none",
                revealed && "scale-100 opacity-100"
              )}
            />
            <ChestIcon
              earned={revealed}
              unlocked
              className={cn(
                "relative size-16 drop-shadow-[0_4px_2px_rgba(42,26,12,0.35)] transition-transform duration-500 ease-out motion-reduce:transition-none [@media(max-height:500px)]:size-12",
                revealed ? "scale-110" : "scale-90"
              )}
            />
          </div>
          <ul
            className="mt-4 grid grid-cols-1 gap-2 min-[520px]:grid-cols-2 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:gap-1.5"
            aria-hidden={!revealed}
          >
            {lines}
          </ul>
          {revealed ? (
            <GameButton
              intent="gold"
              size="sm"
              autoFocus
              onPress={onClose}
              className="mt-4 w-full [@media(max-height:500px)]:mt-2"
              data-testid="chest-rewards-close"
            >
              {tr("campaign.chest.ok")}
            </GameButton>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

/** The tooltip and the accessible name of a chest: its Stars, then its state. */
const useChestTip = (stars: number, count: number, state: ChestState) => {
  const { tr } = useGameText();
  const status = {
    closed: tr("campaign.chest.needed", { count: stars - count }),
    claimable: tr("campaign.chest.claimable"),
    claimed: tr("campaign.chest.claimed"),
  }[state];
  return `${tr("campaign.chest.label", { stars })}. ${status}`;
};

/** The fixed reward contents of a chest that the Player has already claimed. */
const chestRewardDetails = (
  region: number,
  stars: number
): ChestClaim | null => {
  const reward = STAR_CHESTS.find((chest) => chest.stars === stars);
  if (!reward) {
    return null;
  }
  return {
    reward,
    forgeStones:
      reward.forgeStones > 0
        ? {
            tier: regionForgeStoneTier(region),
            count: reward.forgeStones,
          }
        : null,
  };
};

/**
 * One chest on the Star track, at its Star count (GDD 11.5). A closed chest
 * says how many Stars it still needs. A ready chest glows. A claimed chest
 * opens to show its rewards again.
 */
const Chest = ({
  stars,
  count,
  state,
  rewards,
  revealed,
  onClaim,
  onInspect,
  onCloseRewards,
}: {
  readonly stars: number;
  readonly count: number;
  readonly state: ChestState;
  /** The claim whose rewards panel shows now, or `null`. */
  readonly rewards: ChestClaim | null;
  readonly revealed: boolean;
  readonly onClaim: () => void;
  readonly onInspect: () => void;
  readonly onCloseRewards: () => void;
}) => {
  const tip = useChestTip(stars, count, state);
  const { tr } = useGameText();
  const name =
    state === "claimed" ? `${tip} ${tr("campaign.chest.viewRewards")}` : tip;
  const button = useRef<HTMLButtonElement>(null);
  const claimable = state === "claimable";
  const claimed = state === "claimed";
  return (
    <>
      <TipPiece tip={name}>
        {(onPress) => (
          <Button
            ref={button}
            onPress={(event) =>
              claimable ? onClaim() : claimed ? onInspect() : onPress(event)
            }
            aria-label={name}
            className={cn(
              "group relative grid size-10 shrink-0 place-items-center rounded-lg outline-none",
              "transition-colors duration-100 data-[hovered]:bg-[#fff6df]/10",
              "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
              "[@media(max-height:500px)]:size-8",
              claimable || claimed ? "cursor-pointer" : "cursor-default"
            )}
            data-testid={`star-chest-${stars}`}
            data-state={state}
          >
            {claimable ? (
              <span
                className="absolute inset-[-6px] rounded-full bg-[radial-gradient(closest-side,rgba(255,215,90,0.85),rgba(255,215,90,0))] motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]"
                aria-hidden
              />
            ) : null}
            <ChestIcon
              earned={claimed}
              unlocked={claimable}
              className={cn(
                "relative size-9 drop-shadow-[0_2px_0_rgba(0,0,0,0.55)] transition-transform duration-150 [@media(max-height:500px)]:size-7",
                state === "closed" && "brightness-90 saturate-[0.7]",
                (claimable || claimed) &&
                  "group-data-[hovered]:-translate-y-0.5 group-data-[pressed]:translate-y-0"
              )}
            />
            <span
              className={cn(
                "absolute -right-1 -bottom-1 min-w-4 rounded-[4px] border px-0.5 text-center text-xs leading-3.5 font-black tabular-nums shadow-[0_1px_0_rgba(0,0,0,0.5)]",
                state === "closed"
                  ? "border-[#e9c46a]/50 bg-[#1c140e] text-[#e8d9bb]"
                  : "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]",
                "[@media(max-height:500px)]:-right-1.5 [@media(max-height:500px)]:-bottom-1.5"
              )}
              aria-hidden
            >
              {stars}
            </span>
          </Button>
        )}
      </TipPiece>
      {rewards ? (
        <ChestRewards
          claim={rewards}
          revealed={revealed}
          onClose={onCloseRewards}
        />
      ) : null}
    </>
  );
};

/**
 * The Star chest plate (GDD 11.5) in the top-right corner: the Stars of the
 * Region on a bronze track, and the chests at 10, 20 and 30 Stars. A claim
 * saves the Profile at once.
 */
export const StarChests = ({
  region,
  count,
  total,
}: {
  readonly region: number;
  readonly count: number;
  readonly total: number;
}) => {
  const { tr, locale } = useGameText();
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const [opened, setOpened] = useState<{
    readonly region: number;
    readonly claim: ChestClaim;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  // A Region with no Stages yet keeps its chests on a full track.
  const track = Math.max(total, STAR_CHESTS.at(-1)?.stars ?? 1);
  const share = Math.min(1, count / track);
  const openRewards = (claim: ChestClaim) => {
    if (revealTimer.current !== null) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    setOpened({ region, claim });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    revealTimer.current = window.setTimeout(() => {
      setRevealed(true);
      revealTimer.current = null;
    }, 480);
  };
  const closeRewards = () => {
    if (revealTimer.current !== null) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    setOpened(null);
    setRevealed(false);
  };
  useEffect(
    () => () => {
      if (revealTimer.current !== null) {
        window.clearTimeout(revealTimer.current);
      }
    },
    []
  );
  const claim = (stars: number) => {
    const claimed = claimStarChest(registry.get(profileAtom), region, stars);
    if (claimed) {
      unlockAudio();
      playSound("revealRare");
      registry.set(profileAtom, claimed.profile);
      openRewards(claimed);
    }
  };
  const inspect = (stars: number) => {
    const details = chestRewardDetails(region, stars);
    if (details) {
      unlockAudio();
      playSound("select");
      openRewards(details);
    }
  };
  return (
    <section
      aria-label={tr("campaign.stars.label", {
        name: tr(`campaign.regions.${region}`),
      })}
      className={cn(
        PLATE,
        "absolute top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-20 gap-3 pr-1.5 pl-3 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:pl-2"
      )}
      data-testid="star-chests"
      data-campaign-hud
    >
      <p
        className="flex items-center gap-1.5 text-lg leading-none font-black whitespace-nowrap tabular-nums [@media(max-height:500px)]:text-base"
        data-testid="region-stars"
        data-stars={count}
      >
        <span className="sr-only">
          {tr("campaign.stars.value", { count, total })}
        </span>
        <StarIcon earned className="size-6 [@media(max-height:500px)]:size-5" />
        <span aria-hidden>
          {number.format(count)}
          <span className="text-sm font-bold text-[#e8d9bb]">
            {" "}
            / {number.format(total)}
          </span>
        </span>
      </p>
      {/* The track: a groove in the plate, gold to the Stars, a chest at each step. */}
      <div className="relative mr-5 ml-1 h-10 w-44 [@media(max-height:500px)]:mr-4 [@media(max-height:500px)]:ml-0 [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:w-24">
        <span
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_2px_3px_rgba(0,0,0,0.7),0_1px_0_rgba(255,226,170,0.18)] [@media(max-height:500px)]:h-1.5"
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${share * 100}%` }}
          />
        </span>
        {STAR_CHESTS.map((chest) => {
          const state = chestState(profile, region, chest.stars);
          const isOpen =
            opened?.region === region &&
            opened.claim.reward.stars === chest.stars;
          return (
            <span
              key={chest.stars}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${(chest.stars / track) * 100}%` }}
            >
              <Chest
                stars={chest.stars}
                count={count}
                state={state}
                rewards={isOpen && opened ? opened.claim : null}
                revealed={revealed}
                onClaim={() => claim(chest.stars)}
                onInspect={() => inspect(chest.stars)}
                onCloseRewards={closeRewards}
              />
            </span>
          );
        })}
      </div>
    </section>
  );
};
