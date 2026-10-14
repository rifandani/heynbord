import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { StarChestDefinition } from "@workspace/rules";
import {
  CAMPAIGN_REGIONS,
  claimStarChest,
  coinDenominations,
  STAGES,
  STAR_CHESTS,
} from "@workspace/rules";
import { cn } from "cn";
import type { ReactElement, ReactNode, RefObject } from "react";
import { useContext, useMemo, useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import {
  Button,
  Dialog,
  Heading,
  Popover,
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

/** One line of the chest rewards: an icon, then its text. */
const RewardLine = ({
  icon,
  children,
  testId,
}: {
  readonly icon: ReactNode;
  readonly children: ReactNode;
  readonly testId: string;
}) => (
  <li className="flex items-center gap-2" data-testid={testId}>
    <span className="grid size-6 shrink-0 place-items-center" aria-hidden>
      {icon}
    </span>
    <span className="min-w-0">{children}</span>
  </li>
);

/**
 * The rewards of a claimed Star chest (GDD 11.5): a small panel under the
 * chest with its Coin, Essence, Heynstones and Pack. The rewards are already
 * in the Profile. Esc, OK and a click outside close it.
 */
const ChestRewards = ({
  chest,
  anchor,
  onClose,
}: {
  readonly chest: StarChestDefinition;
  readonly anchor: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
}) => {
  const { tr, locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const format = (value: number) => number.format(value);
  const ICON = "size-5";
  return (
    <Popover
      triggerRef={anchor}
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      placement="bottom end"
      offset={10}
      className="fade-in zoom-in-95 animate-in w-64 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 p-3 text-[#fff6df] shadow-[0_6px_0_rgba(0,0,0,0.45)] duration-200 motion-reduce:animate-none"
      data-testid="chest-rewards"
    >
      <Dialog className="outline-none">
        <Heading
          slot="title"
          className="font-display text-base font-black text-[#ffe08a]"
        >
          {tr("campaign.chest.claimedTitle", { stars: chest.stars })}
        </Heading>
        <ul className="mt-2 grid gap-1.5 text-sm font-semibold">
          {chest.coin > 0 ? (
            <RewardLine
              testId="chest-reward-coin"
              icon={<BalanceIcon kind="coin" className={ICON} />}
            >
              <span className="sr-only">
                {tr("battle.coinEarned", {
                  amount: coinWords(chest.coin, format, (denomination) =>
                    tr(`town.balances.denominations.${denomination}.name`)
                  ),
                })}
              </span>
              <span className="flex items-center gap-1" aria-hidden>
                +
                <CoinAmount
                  parts={coinDenominations(chest.coin)}
                  format={format}
                />
              </span>
            </RewardLine>
          ) : null}
          {chest.essence > 0 ? (
            <RewardLine
              testId="chest-reward-essence"
              icon={<BalanceIcon kind="essence" className={ICON} />}
            >
              {tr("campaign.chest.essence", {
                amount: format(chest.essence),
              })}
            </RewardLine>
          ) : null}
          {chest.heynstones > 0 ? (
            <RewardLine
              testId="chest-reward-heynstones"
              icon={<BalanceIcon kind="heynstones" className={ICON} />}
            >
              {tr("campaign.chest.heynstones", {
                amount: format(chest.heynstones),
              })}
            </RewardLine>
          ) : null}
          {chest.pack ? (
            <RewardLine
              testId="chest-reward-pack"
              icon={<GlyphIcon glyph="pack" className="size-5" />}
            >
              {tr(
                chest.pack.version === "race"
                  ? "campaign.chest.racePack"
                  : "campaign.chest.pack",
                { pack: tr(`packs.names.${chest.pack.pack}`) }
              )}
            </RewardLine>
          ) : null}
        </ul>
        <GameButton
          intent="gold"
          size="sm"
          autoFocus
          onPress={onClose}
          className="mt-3 w-full"
          data-testid="chest-rewards-close"
        >
          {tr("campaign.chest.ok")}
        </GameButton>
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

/**
 * One chest on the Star track, at its Star count (GDD 11.5). A closed chest
 * says how many Stars it still needs. A claimable chest glows, and a tap or
 * Enter claims it and shows its rewards. A claimed chest stays open.
 */
const Chest = ({
  stars,
  count,
  state,
  rewards,
  onClaim,
  onCloseRewards,
}: {
  readonly stars: number;
  readonly count: number;
  readonly state: ChestState;
  /** The chest whose rewards panel shows now, or `null`. */
  readonly rewards: StarChestDefinition | null;
  readonly onClaim: () => void;
  readonly onCloseRewards: () => void;
}) => {
  const tip = useChestTip(stars, count, state);
  const button = useRef<HTMLButtonElement>(null);
  const claimable = state === "claimable";
  const claimed = state === "claimed";
  return (
    <>
      <TipPiece tip={tip}>
        {(onPress) => (
          <Button
            ref={button}
            onPress={(event) => (claimable ? onClaim() : onPress(event))}
            aria-label={tip}
            className={cn(
              "group relative grid size-10 shrink-0 place-items-center rounded-lg outline-none",
              "transition-colors duration-100 data-[hovered]:bg-[#fff6df]/10",
              "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
              "[@media(max-height:500px)]:size-8",
              claimable ? "cursor-pointer" : "cursor-default"
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
              className={cn(
                "relative size-9 drop-shadow-[0_2px_0_rgba(0,0,0,0.55)] transition-transform duration-150 [@media(max-height:500px)]:size-7",
                state === "closed" && "brightness-90 saturate-[0.7]",
                claimable &&
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
          chest={rewards}
          anchor={button}
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
  const [opened, setOpened] = useState<StarChestDefinition | null>(null);
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  // A Region with no Stages yet keeps its chests on a full track.
  const track = Math.max(total, STAR_CHESTS.at(-1)?.stars ?? 1);
  const share = Math.min(1, count / track);
  const claim = (stars: number) => {
    const claimed = claimStarChest(registry.get(profileAtom), region, stars);
    if (claimed) {
      unlockAudio();
      playSound("revealRare");
      registry.set(profileAtom, claimed.profile);
      setOpened(claimed.reward);
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
        {STAR_CHESTS.map((chest) => (
          <span
            key={chest.stars}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${(chest.stars / track) * 100}%` }}
          >
            <Chest
              stars={chest.stars}
              count={count}
              state={chestState(profile, region, chest.stars)}
              rewards={opened?.stars === chest.stars ? opened : null}
              onClaim={() => claim(chest.stars)}
              onCloseRewards={() => setOpened(null)}
            />
          </span>
        ))}
      </div>
    </section>
  );
};
