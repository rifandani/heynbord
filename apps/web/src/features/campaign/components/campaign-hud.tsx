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
import { useContext, useEffect, useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import {
  Button,
  Dialog,
  Heading,
  Popover,
  TooltipTrigger,
} from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameTooltip } from "@/core/components/game/game-tooltip";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/core/components/game/icons";
import { playSound, unlockAudio } from "@/features/battle/battle-audio";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { REWARD_PLATE_COMPACT } from "@/features/battle/components/reward-plate";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import { stageResultsAtom } from "@/features/campaign/campaign.atoms";
import {
  ChestIcon,
  StarIcon,
} from "@/features/campaign/components/campaign-icons";
import type { ChestState, RegionStatus } from "@/features/campaign/region-map";
import { chestState, regionStatus } from "@/features/campaign/region-map";
import {
  CAMPAIGN_BADGE_SHADOW,
  CAMPAIGN_CHEST_FILTER,
  CAMPAIGN_CHEST_FILTER_DIM,
  CAMPAIGN_CHEST_PANEL_SHADOW,
  CAMPAIGN_GATE_GLOW,
  CAMPAIGN_TITLE_SHADOW,
  CAMPAIGN_TRACK_SHADOW,
} from "@/features/campaign/tokens";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { useNumberFormat } from "@/features/i18n/use-number-format";
import { profileAtom } from "@/features/profile/profile.atoms";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

/** The HUD plate of the top band (DESIGN.md, HUD plate). */
const PLATE =
  "flex h-16 items-center rounded-xl border-2 border-gold-trim/70 bg-night-plate/85 text-cream shadow-piece [@media(max-height:500px)]:h-10";

const TOOLTIP =
  "max-w-60 rounded-lg border-2 border-gold-trim/70 bg-night-plate/95 px-2.5 py-1.5 text-xs text-cream shadow-piece";

/**
 * A piece with a tooltip on hover and focus. With touch, a tap shows it, as on
 * the Balance Plate.
 */
const TipPiece = ({
  tip,
  suppress = false,
  children,
}: {
  readonly tip: string;
  /** Keeps the tooltip shut, for a piece whose own panel shows over it. */
  readonly suppress?: boolean;
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
      isOpen={open && !suppress}
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
  const Chevron = direction === "next" ? ChevronRightIcon : ChevronLeftIcon;
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
            "text-cream/70 relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg outline-none",
            "data-[hovered]:bg-cream/10 data-[hovered]:text-cream transition-colors duration-100",
            "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
            "[@media(max-height:500px)]:size-8"
          )}
          data-testid={`${direction}-region`}
          data-region={region}
        >
          <Chevron className="size-6" aria-hidden />
          {status.kind === "open" ? null : (
            <span
              className={cn(
                "border-gold-trim/70 bg-night-plate absolute bottom-0 grid size-4 place-items-center rounded-full border",
                direction === "next" ? "right-0" : "left-0"
              )}
            >
              <GlyphIcon glyph="lock" className="text-gold-trim size-2.5" />
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
            className="bg-gold-trim/25 h-7 w-0.5 rounded-full"
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
        <h1
          className="font-display text-gold-light truncate text-3xl leading-none font-black tracking-[0.025em] [@media(max-height:500px)]:text-2xl"
          style={{ textShadow: CAMPAIGN_TITLE_SHADOW }}
        >
          {name}
        </h1>
        <p
          className="text-cream-dim mt-1.5 flex items-center gap-1 text-xs leading-none font-semibold [@media(max-height:500px)]:sr-only"
          data-testid="region-line"
        >
          {why ? (
            <>
              <GlyphIcon glyph="lock" className="text-gold-trim size-3" />
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
            className="bg-gold-trim/25 h-7 w-0.5 rounded-full"
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

/** One reward of the chest, on the compact Night Plate of the reward rows. */
const RewardLine = ({
  children,
  testId,
  index,
  revealed,
}: {
  readonly children: ReactNode;
  readonly testId: string;
  readonly index: number;
  readonly revealed: boolean;
}) => (
  <li
    className={cn(
      REWARD_PLATE_COMPACT,
      "translate-y-1 opacity-0 transition-[opacity,translate] duration-300 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
      revealed && "translate-y-0 opacity-100"
    )}
    style={{ transitionDelay: revealed ? `${90 + index * 70}ms` : "0ms" }}
    data-testid={testId}
  >
    {children}
  </li>
);

/**
 * The rewards of a Star chest (GDD 11.5): a small parchment plaque that hangs
 * under its chest. Its title names the Stars, and each reward sits on the
 * compact Night Plate of the Floor Panel and the Dungeon Panel. The rewards
 * are already in the Profile when it opens. Esc, the one gold button and a
 * press outside close it.
 */
const ChestRewards = ({
  claim,
  revealed,
  triggerRef,
  onClose,
}: {
  readonly claim: ChestClaim;
  readonly revealed: boolean;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
  readonly onClose: () => void;
}) => {
  const { tr } = useGameText();
  const format = useNumberFormat();
  const ICON = "size-4";
  const { reward: chest, forgeStones } = claim;
  const lines: ReactElement[] = [];
  const addLine = (key: string, testId: string, children: ReactNode) => {
    lines.push(
      <RewardLine
        key={key}
        index={lines.length}
        revealed={revealed}
        testId={testId}
      >
        {children}
      </RewardLine>
    );
  };
  if (chest.coin > 0) {
    addLine(
      "coin",
      "chest-reward-coin",
      <>
        <span className="sr-only">
          {tr("battle.coinEarned", {
            amount: coinWords(chest.coin, format, (denomination) =>
              tr(`town.balances.denominations.${denomination}.name`)
            ),
          })}
        </span>
        <span aria-hidden className="flex items-center gap-1.5">
          <CoinAmount parts={coinDenominations(chest.coin)} format={format} />
        </span>
      </>
    );
  }
  if (chest.essence > 0) {
    addLine(
      "essence",
      "chest-reward-essence",
      <>
        <BalanceIcon kind="essence" className={ICON} />
        {tr("campaign.chest.essence", { amount: format(chest.essence) })}
      </>
    );
  }
  if (forgeStones) {
    addLine(
      "forge-stones",
      "chest-reward-forge-stones",
      <>
        <ForgeStoneIcon tier={forgeStones.tier} className={ICON} />
        {tr("battle.forgeStonesEarned", {
          count: forgeStones.count,
          tier: tr(`forgeStones.tiers.${forgeStones.tier}`),
        })}
      </>
    );
  }
  if (chest.pack) {
    addLine(
      "pack",
      "chest-reward-pack",
      <>
        <GlyphIcon glyph="pack" className={cn(ICON, "text-ready-gold")} />
        {tr(
          chest.pack.version === "race"
            ? "campaign.chest.racePack"
            : "campaign.chest.pack",
          { pack: tr(`packs.names.${chest.pack.pack}`) }
        )}
      </>
    );
  }

  return (
    <Popover
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      triggerRef={triggerRef}
      placement="bottom end"
      offset={10}
      className="z-[70]"
    >
      <Dialog
        className="border-frame-wood bg-parchment text-ink w-72 overflow-hidden rounded-2xl border-4 p-4 outline-none motion-safe:origin-top motion-safe:animate-[chest-panel-in_200ms_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:animate-none"
        style={{ boxShadow: CAMPAIGN_CHEST_PANEL_SHADOW }}
        data-testid="chest-rewards"
      >
        <Heading
          slot="title"
          className="font-display text-center text-base leading-tight font-black text-balance [@media(max-height:500px)]:text-sm"
        >
          {tr("campaign.chest.claimedTitle", { stars: chest.stars })}
        </Heading>
        <span className="mt-2 flex items-center gap-2" aria-hidden>
          <span className="to-parchment-rule h-px flex-1 bg-gradient-to-r from-transparent" />
          <span className="bg-bronze size-1 rotate-45" />
          <span className="to-parchment-rule h-px flex-1 bg-gradient-to-l from-transparent" />
        </span>
        <ul className="mt-3 flex flex-wrap gap-1.5">{lines}</ul>
        <div className="border-parchment-rule/70 mt-4 border-t pt-3">
          <GameButton
            intent="gold"
            size="sm"
            autoFocus
            onPress={onClose}
            className="w-full text-[13px] [@media(max-height:500px)]:min-h-8 [@media(max-height:500px)]:text-xs"
            data-testid="chest-rewards-close"
          >
            {tr("campaign.chest.ok")}
          </GameButton>
        </div>
      </Dialog>
    </Popover>
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
  /** Closes the plaque and gives the focus back to its chest, as a popover does. */
  const closeRewards = () => {
    const active = document.activeElement;
    const inside =
      active === document.body ||
      (active instanceof Element &&
        active.closest('[data-testid="chest-rewards"]') !== null);
    onCloseRewards();
    if (inside) {
      button.current?.focus({ preventScroll: true });
    }
  };
  return (
    <>
      <TipPiece tip={name} suppress={rewards !== null}>
        {(onPress) => (
          <Button
            ref={button}
            onPress={(event) =>
              claimable ? onClaim() : claimed ? onInspect() : onPress(event)
            }
            aria-label={name}
            className={cn(
              "group relative grid size-10 shrink-0 place-items-center rounded-lg outline-none",
              "data-[hovered]:bg-cream/10 transition-colors duration-100",
              "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
              "[@media(max-height:500px)]:size-8",
              claimable || claimed ? "cursor-pointer" : "cursor-default"
            )}
            data-testid={`star-chest-${stars}`}
            data-state={state}
          >
            {claimable ? (
              <span
                className="absolute inset-[-6px] rounded-full motion-safe:animate-[town-gate-pulse_2.4s_ease-in-out_infinite]"
                style={{ background: CAMPAIGN_GATE_GLOW }}
                aria-hidden
              />
            ) : null}
            <ChestIcon
              earned={claimed}
              unlocked={claimable}
              className={cn(
                "relative size-9 transition-transform duration-150 [@media(max-height:500px)]:size-7",
                claimable &&
                  "[transform-origin:50%_100%] group-data-[hovered]:animate-none motion-safe:animate-[chest-wiggle_3.4s_ease-in-out_infinite]",
                (claimable || claimed) &&
                  "group-data-[hovered]:-translate-y-0.5 group-data-[pressed]:translate-y-0"
              )}
              style={{
                filter:
                  state === "closed"
                    ? CAMPAIGN_CHEST_FILTER_DIM
                    : CAMPAIGN_CHEST_FILTER,
              }}
            />
            <span
              className={cn(
                "absolute -right-1 -bottom-1 min-w-4 rounded-[4px] border px-0.5 text-center text-xs leading-3.5 font-black tabular-nums",
                state === "closed"
                  ? "border-gold-trim/50 bg-night-plate text-cream-dim"
                  : "border-gold-deep from-gold-light to-gold text-ink-on-gold bg-gradient-to-b",
                "[@media(max-height:500px)]:-right-1.5 [@media(max-height:500px)]:-bottom-1.5"
              )}
              style={{ boxShadow: CAMPAIGN_BADGE_SHADOW }}
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
          triggerRef={button}
          onClose={closeRewards}
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
  const { tr } = useGameText();
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const [opened, setOpened] = useState<{
    readonly region: number;
    readonly claim: ChestClaim;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const format = useNumberFormat();
  // A Region with no Stages yet keeps its chests on a full track.
  const track = Math.max(total, STAR_CHESTS.at(-1)?.stars ?? 1);
  const share = Math.min(1, count / track);
  const openRewards = (claim: ChestClaim) => {
    if (revealTimer.current !== null) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    setOpened({ region, claim });
    if (prefersReducedMotion()) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    revealTimer.current = window.setTimeout(() => {
      setRevealed(true);
      revealTimer.current = null;
    }, 240);
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
          {format(count)}
          <span className="text-cream-dim text-sm font-bold">
            {" "}
            / {format(total)}
          </span>
        </span>
      </p>
      {/* The track: a groove in the plate, gold to the Stars, a chest at each step. */}
      <div className="relative mr-5 ml-1 h-10 w-44 [@media(max-height:500px)]:mr-4 [@media(max-height:500px)]:ml-0 [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:w-24">
        <span
          className="bg-plate-socket absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full [@media(max-height:500px)]:h-1.5"
          style={{ boxShadow: CAMPAIGN_TRACK_SHADOW }}
          aria-hidden
        >
          <span
            className="from-gold-light to-gold block h-full rounded-full bg-gradient-to-b transition-[width] duration-700 ease-out motion-reduce:transition-none"
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
