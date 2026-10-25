import { useAtomValue } from "@effect/atom-react";
import { coinDenominations, getCard } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import type { PressEvent } from "react-aria-components";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameTooltip } from "@/core/components/game/game-tooltip";
import type { BattleOptions } from "@/features/battle/battle-session";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { REWARD_PLATE_COMPACT as PLATE } from "@/features/battle/components/reward-plate";
import { qaSeed } from "@/features/battle/qa";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { PanelRow as Row } from "@/features/campaign/components/panel-row";
import {
  PEEK_BUTTON,
  useRewardPeek,
} from "@/features/campaign/components/reward-peek";
import {
  DeckRow,
  useDeckChoice,
} from "@/features/campaign/components/stage-panel";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
import type { Peek } from "@/features/deck/components/use-card-peek";
import { problemText } from "@/features/deck/deck";
import { BossDossier } from "@/features/dungeons/components/boss-dossier";
import type {
  Balances,
  DungeonSlot,
  StoneCount,
} from "@/features/dungeons/dungeons";
import { dungeonRewardPreview } from "@/features/dungeons/dungeons";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { useDungeonsHints } from "@/features/hint/use-hints";
import { useNumberFormat } from "@/features/i18n/use-number-format";
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

/** Coin on its Night Plate, with the full words for a screen reader. */
const CoinPlate = ({ coin }: { readonly coin: number }) => {
  const { tr } = useGameText();
  const format = useNumberFormat();
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

/** "+3 Epic" on its plate, with the full words for a screen reader. */
const StonePlate = ({ stones }: { readonly stones: StoneCount }) => {
  const { tr } = useGameText();
  const tier = tr(`forgeStones.tiers.${stones.tier}`);
  return (
    <p className={PLATE} data-testid="dungeon-reward-stones">
      <span className="sr-only">
        {tr("battle.forgeStonesEarned", { count: stones.count, tier })}
      </span>
      <ForgeStoneIcon tier={stones.tier} className="size-4" />
      <span aria-hidden>
        {tr("dungeons.rewards.stones", { count: stones.count, tier })}
      </span>
    </p>
  );
};

/**
 * One chance of a repeat win, short in ink: "25% Epic". Hover, keyboard focus
 * or a tap shows the full words in a tooltip, and a screen reader reads them.
 */
const Chance = ({
  icon,
  label,
  words,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly words: string;
}) => {
  const [open, setOpen] = useState(false);
  const onPress = (event: PressEvent) => {
    if (event.pointerType !== "mouse") {
      setOpen((value) => !value);
    }
  };
  return (
    <li>
      <TooltipTrigger
        isOpen={open}
        onOpenChange={setOpen}
        delay={200}
        shouldCloseOnPress={false}
      >
        <Button
          onPress={onPress}
          className="-mx-1 flex cursor-default items-center gap-1 rounded-md px-1 py-0.5 text-xs leading-none font-bold text-[#2a1d12] tabular-nums outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:bg-[#2a1d12]/8"
        >
          <span className="sr-only">{words}</span>
          <span aria-hidden className="grid size-4 shrink-0 place-items-center">
            {icon}
          </span>
          <span aria-hidden>{label}</span>
        </Button>
        <GameTooltip
          placement="top"
          offset={6}
          className="max-w-56 rounded-lg border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-2.5 py-1.5 text-xs text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        >
          {words}
        </GameTooltip>
      </TooltipTrigger>
    </li>
  );
};

/**
 * The first-win card as a small Card Frame, turned 2° and dealt onto the
 * page, as in the Stage Panel. Hover, keyboard focus or a long press shows
 * its Card Details. After the first win it is dim: it was claimed. The
 * reward of the next win (`children`) goes under its words.
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
            claimed && "saturate-[0.7]"
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
        <p className="mt-0.5 text-xs leading-snug font-bold text-[#5b4632]">
          {claimed
            ? `${tr("dungeons.rewards.claimed")} · ${tr("dungeons.rewards.eachWin")}`
            : tr("dungeons.rewards.firstWin")}
        </p>
        {children}
      </div>
    </div>
  );
};

/**
 * The rewards of the Dungeon (Economy 2.4). The row shows only what the next
 * win gives, as the Stage Panel does. Before the first win: the first-win
 * card, Coin, XP and Forge Stones. After it: the dim card, the Coin and XP of
 * each win, and one line with the chances of a Forge Stone and of a card.
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
      <FirstWinCard
        cardId={firstWin.card.cardId}
        rank={firstWin.card.rank}
        claimed={won}
      >
        {won ? (
          <div data-testid="dungeon-each-win">
            <div className="mt-2 flex flex-wrap gap-1.5 [@media(max-height:500px)]:mt-1.5">
              <CoinPlate coin={win.coin} />
              <XpPlate balances={win} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 [@media(max-height:500px)]:mt-1">
              <p className="text-xs font-bold text-[#5b4632]">
                {tr("dungeons.rewards.maybe")}
              </p>
              <ul className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {win.stones.map((chance) => {
                  const tier = tr(`forgeStones.tiers.${chance.tier}`);
                  return (
                    <Chance
                      key={chance.tier}
                      icon={
                        <ForgeStoneIcon tier={chance.tier} className="size-4" />
                      }
                      label={tr("dungeons.rewards.chance", {
                        percent: chance.percent,
                        tier,
                      })}
                      words={tr("dungeons.rewards.stoneChance", {
                        percent: chance.percent,
                        tier,
                      })}
                    />
                  );
                })}
                <Chance
                  icon={
                    <GlyphIcon
                      glyph="cards"
                      className="size-3.5 text-[#7a5310]"
                    />
                  }
                  label={tr("dungeons.rewards.cardChanceShort", {
                    percent: win.cardPercent,
                  })}
                  words={tr("dungeons.rewards.cardChance", {
                    percent: win.cardPercent,
                  })}
                />
              </ul>
            </div>
          </div>
        ) : (
          <div
            className="mt-2 flex flex-wrap gap-1.5 [@media(max-height:500px)]:mt-1.5"
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
    </Row>
  );
};

/** The Sweep row (GDD 4.12, ADR-0039): the Dungeon Sweep Tickets and the Ticket control. */
const SweepRow = ({
  owned,
  value,
  onChange,
}: {
  readonly owned: number;
  readonly value: number;
  readonly onChange: (tickets: number) => void;
}) => {
  const { tr } = useGameText();
  return (
    <Row label={tr("sweep.label")} anchor="dungeon-sweep-row">
      <SweepTickets
        kind="dungeon"
        owned={owned}
        value={value}
        onChange={onChange}
      />
    </Row>
  );
};

/** A small state chip in the header: never the color alone, its icon and its words say the state. */
const CHIP =
  "inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] leading-none font-bold tracking-[0.04em] uppercase";

/**
 * The header of the panel: the cave seal, the name of the Dungeon, its
 * number and its Recommended level, and its state: open and not won yet, the
 * wins, or locked.
 */
const PanelHeader = ({
  slot,
  titleId,
}: {
  readonly slot: DungeonSlot;
  readonly titleId: string;
}) => {
  const { tr } = useGameText();
  const { dungeon } = slot;
  return (
    <header className="flex items-start gap-3 border-b-2 border-[#c9b48c] px-5 pt-4 pb-3 [@media(max-height:500px)]:items-center [@media(max-height:500px)]:px-3.5 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-1.5">
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
          id={titleId}
          className="font-display text-2xl leading-tight font-black tracking-[0.02em] [@media(max-height:500px)]:text-lg"
        >
          {dungeon
            ? tr(`dungeons.${dungeon.id}.name`)
            : tr("battle.dungeonName", { number: slot.number })}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-[#5b4632] [@media(max-height:500px)]:mt-0.5">
          <span>
            {tr("battle.dungeonName", { number: slot.number })} ·{" "}
            {tr("campaign.panel.level", { level: slot.unlockLevel })}
          </span>
          {slot.state === "open" && slot.wins > 0 ? (
            <span
              className={cn(
                CHIP,
                "bg-[#7a5310] text-[#fff6df] tabular-nums shadow-[inset_0_0_0_1px_#e7bb6a]"
              )}
              data-testid="dungeon-wins"
              data-wins={slot.wins}
            >
              <GlyphIcon glyph="check" className="size-3 text-[#ffd75a]" />
              {tr("dungeons.wins", { count: slot.wins })}
            </span>
          ) : null}
          {slot.state === "open" && slot.wins === 0 ? (
            <span
              className={cn(
                CHIP,
                "bg-[#ffd75a]/45 text-[#2a1a05] shadow-[inset_0_0_0_1px_#7a5310]"
              )}
              data-testid="dungeon-state"
            >
              <GlyphIcon glyph="crossedSwords" className="size-3" />
              {tr("campaign.panel.notWon")}
            </span>
          ) : null}
          {slot.state === "open" ? null : (
            <span
              className={cn(
                CHIP,
                "bg-[#5d6166] text-[#fff6df] shadow-[inset_0_0_0_1px_#a9aeb3]"
              )}
              data-testid="dungeon-state"
            >
              <GlyphIcon glyph="lock" className="size-3" />
              {tr("dungeons.chip.locked")}
            </span>
          )}
        </p>
      </div>
    </header>
  );
};

/**
 * The Bosses of the Dungeon: one dossier for each Boss, in Boss order. The
 * dossier under the pointer or the focus lights its Boss on the painting.
 */
const BossesRow = ({
  slot,
  active,
  onActive,
}: {
  readonly slot: DungeonSlot;
  readonly active: number | null;
  readonly onActive: (boss: number | null) => void;
}) => {
  const { tr } = useGameText();
  const { dungeon } = slot;
  if (dungeon === null) {
    return null;
  }
  return (
    <Row label={tr("dungeons.dossier.bosses")}>
      <ul className="flex flex-col gap-1" data-testid="dungeon-bosses">
        {dungeon.bosses.map((boss, index) => (
          <li key={boss.id}>
            <BossDossier
              dungeonId={dungeon.id}
              boss={boss}
              index={index}
              active={active === index}
              onActive={(on) => {
                if (on) {
                  onActive(index);
                } else if (active === index) {
                  onActive(null);
                }
              }}
            />
          </li>
        ))}
      </ul>
    </Row>
  );
};

/** The large buttons of the panel, in Cinzel. */
const ACTION =
  "font-display w-full tracking-[0.04em] [@media(max-height:500px)]:min-h-10";

/**
 * The actions of the panel. On a won Dungeon, Sweep is the gold action at the
 * right, and Fight is wood at its left, as in the Stage Panel. When the
 * Player cannot Sweep, Fight is gold. Before the first win, Fight is the one
 * gold button across the full width. The gold action carries
 * `data-primary`: Enter on the stop gives it the focus.
 */
const PanelActions = ({
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
    <div className={cn("grid shrink-0 gap-2", sweepable && "grid-cols-2")}>
      <GameButton
        intent={sweepNow ? "wood" : "gold"}
        size="lg"
        className={ACTION}
        data-testid="dungeon-fight"
        data-primary={sweepNow ? undefined : true}
        isDisabled={!canFight}
        onPress={onFight}
      >
        {tr("campaign.panel.fight")}
      </GameButton>
      {sweepable ? (
        <GameButton
          intent={sweepNow ? "gold" : "wood"}
          size="lg"
          className={cn(ACTION, "px-3 whitespace-nowrap")}
          data-testid="dungeon-sweep"
          data-primary={sweepNow || undefined}
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
 * The Dungeon Panel (GDD 8.4, 11.1): a parchment sheet docked at the right of
 * the Dungeons screen, open at all times, as the Floor Panel. It shows the
 * selected Dungeon: its name, Recommended level and state, the dossier of
 * each Boss, and the reward. An open Dungeon also has the Deck choice and the
 * gold Fight; a won Dungeon also has the Dungeon Sweep (ADR-0039): the Sweep
 * row, the Sweep button (gold when the Player has Tickets) and the Sweep
 * Result, which turns the page of the same sheet. A locked Dungeon shows the
 * level that opens it in the place of the actions. When the selection
 * changes, the sheet inks in the new Dungeon.
 */
export const DungeonPanel = ({
  slot,
  active,
  onActive,
  onStart,
}: {
  /** The selected Dungeon. */
  readonly slot: DungeonSlot;
  /** The Boss whose dossier has the pointer or the focus. */
  readonly active: number | null;
  readonly onActive: (boss: number | null) => void;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr, text } = useGameText();
  const titleId = useId();
  const choice = useDeckChoice();
  const player = useAtomValue(battlePlayerAtom);
  const [editing, setEditing] = useState(false);
  const { chosen, problem } = choice;
  const { dungeon } = slot;
  const open = dungeon !== null && slot.state === "open";
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
      aria-labelledby={titleId}
      className={cn(
        "absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+4.25rem)] right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(var(--town-bar)+8px)] flex w-[min(440px,38vw)] flex-col overflow-hidden rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] text-[#2a1d12] shadow-[0_24px_48px_rgba(0,0,0,0.45)]",
        "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:right-[max(0.5rem,env(safe-area-inset-right))] [@media(max-height:500px)]:bottom-[calc(var(--town-bar)+4px)] [@media(max-height:500px)]:w-[min(460px,54vw)] [@media(max-height:500px)]:rounded-xl [@media(max-height:500px)]:border-[3px]"
      )}
      data-testid="dungeon-panel"
      data-dungeon={slot.number}
    >
      <div
        key={slot.number}
        className="flex min-h-0 flex-1 flex-col motion-safe:animate-[stage-panel-ink_220ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      >
        <PanelHeader slot={slot} titleId={titleId} />
        {/* Only the rows scroll: the actions stay at the foot of the sheet. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 [@media(max-height:500px)]:px-3.5">
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
              <BossesRow slot={slot} active={active} onActive={onActive} />
              <RewardRow slot={slot} />
              {open ? (
                <DeckRow choice={choice} onEdit={() => setEditing(true)} wide />
              ) : null}
              {sweepable ? (
                <SweepRow
                  owned={sweep.owned}
                  value={sweep.tickets}
                  onChange={sweep.handleTicketsChange}
                />
              ) : null}
            </div>
          )}
        </div>
        <footer
          className="flex flex-col gap-2 border-t-2 border-[#c9b48c] bg-[#ead9b4]/60 px-5 pt-3 pb-4 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-3.5 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-2"
          data-testid="dungeon-panel-footer"
        >
          {open && dungeon ? (
            sweep.result ? (
              <SweepResultActions
                shown={sweep.result}
                owned={sweep.owned}
                onAgain={() => sweepNow(sweep.result?.tickets ?? 0)}
                onClose={sweep.handleResultClose}
                // The panel is narrow: "Close" takes only its width, so that "Sweep Again ×10" fits.
                className="shrink-0 grid-cols-[auto_1fr]"
              />
            ) : (
              <>
                {problem && chosen ? (
                  <p
                    className="flex items-start justify-center gap-2 text-center text-xs leading-snug font-semibold text-[#5b2a0c]"
                    data-testid="dungeon-fight-problem"
                  >
                    <span
                      className="mt-[0.4em] size-2 shrink-0 rotate-45 border border-[#5b2a0c] bg-[#b4521a]"
                      aria-hidden
                    />
                    {text(problemText(problem))}
                  </p>
                ) : null}
                <PanelActions
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
              </>
            )
          ) : (
            <p
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#c9b48c] bg-[#ead9b4] px-3 py-2 text-center text-sm font-bold text-[#5b4632] [@media(max-height:500px)]:min-h-10 [@media(max-height:500px)]:text-xs"
              data-testid="dungeon-locked"
            >
              <GlyphIcon
                glyph="lock"
                className="size-4 shrink-0 text-[#5d6166]"
              />
              {slot.state === "locked"
                ? tr("town.opensAtLevel", { level: slot.unlockLevel })
                : tr("dungeons.shaft.later")}
            </p>
          )}
        </footer>
      </div>
      <DeckDialog isOpen={editing} onOpenChange={setEditing} />
    </aside>
  );
};
