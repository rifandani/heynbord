import { useAtomValue } from "@effect/atom-react";
import { coinDenominations, getCard } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useMemo, useRef } from "react";
import { Button } from "react-aria-components";

import type { BattleOptions } from "@/features/battle/battle-session";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { qaSeed } from "@/features/battle/qa";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import {
  PEEK_BUTTON,
  useRewardPeek,
} from "@/features/campaign/components/reward-peek";
import {
  DeckRow,
  useDeckChoice,
} from "@/features/campaign/components/stage-panel";
import type { Peek } from "@/features/deck/components/use-card-peek";
import type {
  Balances,
  DungeonSlot,
  StoneChance,
  StoneCount,
} from "@/features/dungeons/dungeons";
import { dungeonRewardPreview } from "@/features/dungeons/dungeons";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { useDungeonsHints } from "@/features/hint/use-hints";
import { battlePlayerAtom } from "@/features/profile/profile.atoms";
import {
  SweepResult,
  SweepResultActions,
  SweepTickets,
  useSweep,
} from "@/features/sweep/components/sweep-parts";
import { isDungeonSweepable } from "@/features/sweep/sweep";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

/** The small Night Plate of a reward, as the Battle result shows it. */
const PLATE =
  "flex w-fit items-center gap-1.5 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-2.5 py-1 text-sm leading-none font-black whitespace-nowrap text-[#fff6df] tabular-nums shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:text-xs";

const useFormat = () => {
  const { locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return (value: number) => number.format(value);
};

/** One row of the rail: a Cinzel label at the left, its content at the right (as the Stage Panel). */
const Row = ({
  label,
  children,
  anchor,
}: {
  readonly label: string;
  readonly children: ReactNode;
  /** A Hint can point at the label (`data-hint-anchor`). */
  readonly anchor?: string;
}) => (
  <div className="grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:grid-cols-[4rem_1fr] [@media(max-height:500px)]:py-1.5">
    <p
      className="font-display pt-0.5 text-sm font-bold text-[#2a1d12]"
      data-hint-anchor={anchor}
    >
      {label}
    </p>
    <div className="min-w-0">{children}</div>
  </div>
);

/** Coin on its Night Plate, with the full words for a screen reader. */
const CoinPlate = ({ coin }: { readonly coin: number }) => {
  const { tr } = useGameText();
  const format = useFormat();
  const words = coinWords(coin, format, (denomination) =>
    tr(`town.balances.denominations.${denomination}.name`)
  );
  return (
    <p className={PLATE} data-testid="dungeon-reward-coin" data-copper={coin}>
      <span className="sr-only">{words}</span>
      <span aria-hidden className="flex items-center gap-1.5">
        <CoinAmount parts={coinDenominations(coin)} format={format} />
      </span>
    </p>
  );
};

/** The XP or the Essence of an outcome, on the same plate. */
const XpPlate = ({ balances }: { readonly balances: Balances }) => {
  const { tr } = useGameText();
  if (balances.essence > 0) {
    return (
      <p className={PLATE} data-testid="dungeon-reward-essence">
        <BalanceIcon kind="essence" className="size-4" />
        {tr("dungeons.rewards.essence", { amount: balances.essence })}
      </p>
    );
  }
  return (
    <p
      className={cn(PLATE, "text-[#9fe7f5]")}
      data-testid="dungeon-reward-xp"
      data-xp={balances.xp}
    >
      {tr("battle.xpEarned", { amount: balances.xp })}
    </p>
  );
};

const StonePlate = ({ stones }: { readonly stones: StoneCount }) => {
  const { tr } = useGameText();
  const tier = tr(`forgeStones.tiers.${stones.tier}`);
  return (
    <p
      className={cn(PLATE, "max-w-full whitespace-normal")}
      data-testid="dungeon-reward-stones"
    >
      <ForgeStoneIcon tier={stones.tier} className="size-4" />
      {tr("battle.forgeStonesEarned", { count: stones.count, tier })}
    </p>
  );
};

/** "25% chance: 1 Uncommon Forge Stone", in ink on the page. */
const ChanceLine = ({
  icon,
  children,
}: {
  readonly icon: ReactNode;
  readonly children: ReactNode;
}) => (
  <li className="flex items-center gap-1.5 text-xs leading-snug font-semibold text-[#2a1d12]">
    <span className="grid size-4 shrink-0 place-items-center">{icon}</span>
    {children}
  </li>
);

const StoneChanceLine = ({ chance }: { readonly chance: StoneChance }) => {
  const { tr } = useGameText();
  return (
    <ChanceLine icon={<ForgeStoneIcon tier={chance.tier} className="size-4" />}>
      {tr("dungeons.rewards.stoneChance", {
        percent: chance.percent,
        tier: tr(`forgeStones.tiers.${chance.tier}`),
      })}
    </ChanceLine>
  );
};

/**
 * The first-win card as a small Card Frame, turned 2° and dealt onto the
 * page, as in the Stage Panel. Hover, keyboard focus or a long press shows
 * its Card Details. After the first win it is dim: it was claimed. The
 * other first-win plates (`children`) go under its words.
 */
const FirstWinCard = ({
  cardId,
  rank,
  claimed,
  children,
}: {
  readonly cardId: string;
  readonly rank: Peek["rank"];
  readonly claimed: boolean;
  readonly children?: ReactNode;
}) => {
  const { tr } = useGameText();
  const { bind, details } = useRewardPeek({
    placement: "top",
    testId: "dungeon-reward-peek",
  });
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = { cardId, rank, from: "dungeons" };
  return (
    <div className="flex items-center gap-3">
      <Button
        ref={trigger}
        {...bind(target)}
        aria-label={`${tr(`cards.${cardId}.name`)}, ${tr(`ranks.${rank}`)}`}
        className={cn("shrink-0", PEEK_BUTTON)}
        data-testid="dungeon-reward-frame"
      >
        <CardFrame
          cardId={cardId}
          rank={rank}
          countdown={getCard(cardId).countdown}
          className={cn(
            "-rotate-2 text-[6px] motion-safe:animate-[stage-panel-deal_440ms_cubic-bezier(0.2,0.8,0.2,1)_300ms_both] [@media(max-height:500px)]:text-[4.5px]",
            claimed && "opacity-70 saturate-[0.7]"
          )}
        />
      </Button>
      {details(target, trigger)}
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span
            className="font-display leading-tight font-bold [@media(max-height:500px)]:text-sm"
            data-testid="dungeon-reward-card"
          >
            {tr(`cards.${cardId}.name`)}
          </span>
          <span className="text-xs font-bold text-[#6b5238]">
            {tr(`ranks.${rank}`)}
          </span>
        </p>
        <p className="mt-1 text-xs leading-snug text-[#5b4632]">
          {claimed
            ? tr("dungeons.rewards.firstWinClaimed")
            : tr("dungeons.rewards.firstWin")}
        </p>
        {children}
      </div>
    </div>
  );
};

/**
 * The rewards of the Dungeon (Economy 2.4). Before the first win, the first
 * win leads: its card, Coin, XP and Forge Stones. After it, the repeat win
 * leads: its Coin and XP, and the chances of a Forge Stone and of a card.
 */
const RewardRow = ({ slot }: { readonly slot: DungeonSlot }) => {
  const { tr } = useGameText();
  if (slot.dungeon === null) {
    return null;
  }
  const preview = dungeonRewardPreview(slot.dungeon);
  const won = slot.wins > 0;
  const { firstWin, win } = preview;
  return (
    <Row label={tr("campaign.panel.reward")}>
      <div className="flex flex-col gap-2 [@media(max-height:500px)]:gap-1.5">
        <FirstWinCard
          cardId={firstWin.card.cardId}
          rank={firstWin.card.rank}
          claimed={won}
        >
          {won ? null : (
            <div
              className="mt-2 flex flex-wrap gap-1.5"
              data-testid="dungeon-first-win"
            >
              <CoinPlate coin={firstWin.coin} />
              <XpPlate balances={firstWin} />
              {firstWin.stones.map((stones) => (
                <StonePlate key={stones.tier} stones={stones} />
              ))}
            </div>
          )}
        </FirstWinCard>
        <div data-testid="dungeon-each-win">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="mr-1 text-xs font-bold text-[#5b4632]">
              {tr("dungeons.rewards.repeatWin")}
            </p>
            <CoinPlate coin={win.coin} />
            <XpPlate balances={win} />
          </div>
          <ul className="mt-1.5 flex flex-col gap-1">
            {win.stones.map((chance) => (
              <StoneChanceLine key={chance.tier} chance={chance} />
            ))}
            <ChanceLine
              icon={
                <GlyphIcon glyph="cards" className="size-3.5 text-[#7a5310]" />
              }
            >
              {tr("dungeons.rewards.cardChance", { percent: win.cardPercent })}
            </ChanceLine>
          </ul>
        </div>
      </div>
    </Row>
  );
};

/** The header: the name of the Dungeon, its number, the Recommended level and the wins. */
const RailHeader = ({ slot }: { readonly slot: DungeonSlot }) => {
  const { tr } = useGameText();
  const { dungeon } = slot;
  return (
    <header className="flex items-start gap-3 border-b-2 border-[#c9b48c] pb-3 [@media(max-height:500px)]:pb-2">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)] text-[#fff6df] shadow-[0_2px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:size-8"
        aria-hidden
      >
        <GlyphIcon
          glyph="cave"
          className="size-6 [@media(max-height:500px)]:size-4.5"
        />
      </span>
      <div className="min-w-0">
        <h2
          id="dungeon-title"
          className="font-display text-2xl leading-tight font-black [@media(max-height:500px)]:text-lg"
        >
          {dungeon
            ? tr(`dungeons.${dungeon.id}.name`)
            : tr("battle.dungeonName", { number: slot.number })}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-[#5b4632]">
          <span>
            {tr("battle.dungeonName", { number: slot.number })} ·{" "}
            {tr("campaign.panel.level", { level: slot.unlockLevel })}
          </span>
          {slot.wins > 0 ? (
            <span
              className="rounded-[4px] border-2 border-[#e2a93b] bg-[#fff3d1] px-1.5 py-px font-black text-[#7a5310] tabular-nums"
              data-testid="dungeon-wins"
              data-wins={slot.wins}
            >
              {tr("dungeons.wins", { count: slot.wins })}
            </span>
          ) : (
            <span className="font-semibold text-[#6b5238]">
              {tr("campaign.panel.notWon")}
            </span>
          )}
        </p>
      </div>
    </header>
  );
};

/** The large buttons of the rail, in Cinzel. */
const ACTION =
  "font-display w-full tracking-[0.04em] [@media(max-height:500px)]:min-h-11";

/**
 * The actions of the rail. On a won Dungeon, Sweep is the gold action at the
 * right and takes the focus, and Fight is wood at its left, as in the Stage
 * Panel. When the Player cannot Sweep, Fight is gold and takes the focus.
 * Before the first win, Fight is the one gold button across the full width.
 */
const RailActions = ({
  sweepable,
  tickets,
  canFight,
  onFight,
  onSweep,
}: {
  readonly sweepable: boolean;
  readonly tickets: number;
  readonly canFight: boolean;
  readonly onFight: () => void;
  readonly onSweep: () => void;
}) => {
  const { tr } = useGameText();
  const sweepNow = sweepable && tickets > 0;
  return (
    <div className={cn("grid shrink-0 gap-2 pt-2", sweepable && "grid-cols-2")}>
      <GameButton
        intent={sweepNow ? "wood" : "gold"}
        size="lg"
        autoFocus={!sweepNow}
        className={ACTION}
        data-testid="dungeon-fight"
        isDisabled={!canFight}
        onPress={onFight}
      >
        {tr("campaign.panel.fight")}
      </GameButton>
      {sweepable ? (
        <GameButton
          intent={sweepNow ? "gold" : "wood"}
          size="lg"
          autoFocus={sweepNow}
          className={cn(ACTION, "px-3 whitespace-nowrap")}
          data-testid="dungeon-sweep"
          isDisabled={!sweepNow}
          onPress={onSweep}
        >
          <GlyphIcon
            glyph="dungeonTicket"
            className="size-5 shrink-0 -rotate-8"
          />
          {sweepNow
            ? tr("sweep.button", { count: tickets })
            : tr("sweep.label")}
        </GameButton>
      ) : null}
    </div>
  );
};

/**
 * The rail of the Dungeons screen: a parchment panel with the rows of the
 * Stage Panel. It has the name, the rewards, the Deck choice (the Active
 * Deck, as the Stage Panel) and Fight, which takes the focus, so Enter starts
 * the Battle. A won Dungeon also has the Dungeon Sweep (ADR-0041): the Sweep
 * row with the Dungeon Sweep Tickets, the Sweep button, which then takes the
 * focus, and the Sweep Result, which shows in the place of the rows. A locked
 * Dungeon shows its level in the place of Fight.
 */
export const DungeonRail = ({
  slot,
  onStart,
  onEditDecks,
}: {
  readonly slot: DungeonSlot;
  readonly onStart: (options: BattleOptions) => void;
  readonly onEditDecks: () => void;
}) => {
  const { tr } = useGameText();
  const choice = useDeckChoice();
  const player = useAtomValue(battlePlayerAtom);
  const { chosen, problem } = choice;
  const { dungeon } = slot;
  const open = slot.state === "open" && dungeon !== null;
  const sweep = useSweep("dungeon", open ? dungeon.id : null, open);
  const sweepable = open && isDungeonSweepable(slot.wins);
  useDungeonsHints(open && sweep.result === null ? slot.wins : null);
  const sweepNow = (tickets: number) => {
    if (chosen) {
      sweep.sweep(tickets, chosen.classId);
    }
  };
  return (
    <aside
      aria-labelledby="dungeon-title"
      className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] px-5 pt-4 pb-4 text-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.45),0_18px_36px_rgba(0,0,0,0.45)] [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-3"
      data-testid="dungeon-rail"
    >
      {/* Only the rows scroll (a short screen): Fight and Sweep, or the actions of the Sweep Result, stay under them, at the bottom of the rail. */}
      <div className="-mx-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 [@media(max-height:500px)]:-mx-3 [@media(max-height:500px)]:px-3">
        <RailHeader slot={slot} />
        {sweep.result ? (
          <SweepResult
            key={sweep.resultKey}
            shown={sweep.result}
            owned={sweep.owned}
            stacked
            onAgain={() => sweepNow(sweep.result?.tickets ?? 0)}
            onClose={sweep.handleResultClose}
          />
        ) : (
          <div className="divide-y divide-[#c9b48c]/70">
            <RewardRow slot={slot} />
            {open ? (
              <DeckRow choice={choice} onEdit={onEditDecks} wide />
            ) : null}
            {sweepable ? (
              <Row label={tr("sweep.label")} anchor="dungeon-sweep-row">
                <SweepTickets
                  kind="dungeon"
                  owned={sweep.owned}
                  value={sweep.tickets}
                  onChange={sweep.handleTicketsChange}
                />
              </Row>
            ) : null}
          </div>
        )}
      </div>
      {sweep.result ? (
        <SweepResultActions
          shown={sweep.result}
          owned={sweep.owned}
          onAgain={() => sweepNow(sweep.result?.tickets ?? 0)}
          onClose={sweep.handleResultClose}
          // The rail is narrow: "Close" takes only its width, so that "Sweep Again" fits.
          className="shrink-0 grid-cols-[auto_1fr] pt-2"
        />
      ) : null}
      {open && sweep.result === null ? (
        <RailActions
          sweepable={sweepable}
          tickets={chosen ? sweep.tickets : 0}
          canFight={chosen !== undefined && problem === undefined}
          onFight={() => {
            if (chosen) {
              onStart({
                stageId: dungeon.id,
                dungeon,
                deck: chosen,
                player,
                seed: qaSeed() ?? randomSeed(),
              });
            }
          }}
          onSweep={() => sweepNow(sweep.tickets)}
        />
      ) : null}
      {open ? null : (
        <p
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-[#c9b48c] bg-[#efe0bd] px-3 py-2.5 text-sm font-bold text-[#5b4632]"
          data-testid="dungeon-locked"
        >
          <GlyphIcon glyph="lock" className="size-4 text-[#7a5310]" />
          {tr("town.opensAtLevel", { level: slot.unlockLevel })}
        </p>
      )}
    </aside>
  );
};
