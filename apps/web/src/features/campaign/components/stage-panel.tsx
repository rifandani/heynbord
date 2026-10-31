import { useAtom, useAtomValue } from "@effect/atom-react";
import { deckProblems, getCard } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  Heading,
  Label,
  Modal,
  ModalOverlay,
  Radio,
  RadioGroup,
} from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GAME_SCRIM } from "@/core/components/game/game-dialog";
import { CloseIcon } from "@/core/components/game/icons";
import { randomSeed } from "@/core/utils/random";
import { preloadStageBattle } from "@/features/battle/battle-preload";
import type { BattleOptions } from "@/features/battle/battle-session";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { qaSeed } from "@/features/battle/qa";
import { useGameText } from "@/features/battle/use-game-text";
import {
  StageShield,
  StarRow,
} from "@/features/campaign/components/campaign-icons";
import {
  PEEK_BUTTON,
  useRewardPeek,
} from "@/features/campaign/components/reward-peek";
import type { TrailStage } from "@/features/campaign/region-map";
import {
  CAMPAIGN_DROP_SMALL,
  CAMPAIGN_PANEL_SHADOW,
  CAMPAIGN_PROBLEM_EDGE,
  CAMPAIGN_PROBLEM_FACE,
} from "@/features/campaign/tokens";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
import type { Peek } from "@/features/deck/components/use-card-peek";
import {
  classText,
  defaultSlotName,
  problemText,
  slotInput,
} from "@/features/deck/deck";
import {
  activeDeckIdAtom,
  collectionAtom,
  deckSlotsAtom,
} from "@/features/deck/deck.atoms";
import { useStagePanelHints } from "@/features/hint/use-hints";
import {
  battlePlayerAtom,
  playerLevelAtom,
} from "@/features/profile/profile.atoms";
import {
  SweepResult,
  SweepTickets,
  useSweep,
} from "@/features/sweep/components/sweep-parts";
import { isCampaignSweepable } from "@/features/sweep/sweep";
import {
  clearSheetOrigin,
  placeSheetOrigin,
  SHEET_MOTION,
  SHEET_PATH_MOTION,
  SHEET_SCRIM_MOTION,
} from "@/features/town/sheet-motion";

/**
 * The parts of the panel ink in from the top while the sheet comes up out of
 * the Stage Marker: the header, the enemy, the reward, the Deck, the Sweep,
 * then the buttons.
 */
const INK = [
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_140ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_190ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_240ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_290ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_340ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_390ms_both]",
] as const;

/** The reward card is dealt onto the page after its row inks in. */
const DEAL =
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-deal_440ms_cubic-bezier(0.2,0.8,0.2,1)_300ms_both]";

/** The text goes before the sheet goes back into the Stage Marker. */
const INK_OUT =
  "motion-safe:group-data-[exiting]/sheet:animate-[settings-sheet-ink_260ms_ease-out_reverse_both]";

/** One row of the panel: a Cinzel label at the left, its content at the right (as in Settings). */
const Row = ({
  label,
  children,
  className,
  anchor,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
  /** A Hint can point at the label (`data-hint-anchor`). */
  readonly anchor?: string;
}) => (
  <div
    className={cn(
      "grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:py-1.5",
      className
    )}
  >
    <p
      className="font-display text-ink pt-0.5 text-sm font-bold"
      data-hint-anchor={anchor}
    >
      {label}
    </p>
    <div className="min-w-0">{children}</div>
  </div>
);

const deckOption = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left transition-[transform,box-shadow] outline-none",
    "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4 data-[hovered]:-translate-y-0.5 motion-reduce:data-[hovered]:translate-y-0",
    "[@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:py-1",
    isSelected
      ? "border-gold bg-parchment-lit shadow-selected"
      : "border-parchment-rule bg-parchment"
  );

/** The enemy Hero of the Stage, its HP and the Recommended level. */
const EnemyRow = ({ stop }: { readonly stop: TrailStage }) => {
  const { tr, text } = useGameText();
  const { stage } = stop;
  return (
    <Row label={tr("campaign.panel.enemy")} className={INK[1]}>
      <p className="flex items-center gap-2 font-bold">
        <span
          className="bg-enemy-deep text-cream grid size-7 shrink-0 place-items-center rounded-lg [@media(max-height:500px)]:size-6"
          aria-hidden
        >
          <GlyphIcon
            glyph={classGlyph(stage.enemy.classId)}
            className="size-4"
          />
        </span>
        <span className="min-w-0 leading-tight [@media(max-height:500px)]:text-sm">
          {tr("campaign.panel.enemyLine", {
            name: tr(`stages.${stage.id}.enemy`),
            className: text(classText(stage.enemy.classId)),
          })}
        </span>
      </p>
      <p className="text-ink-soft mt-1 text-xs">
        {tr("campaign.panel.heroHp", { hp: stage.enemy.heroHp })} ·{" "}
        {tr("campaign.panel.level", { level: stage.recommendedLevel })}
      </p>
    </Row>
  );
};

/**
 * The first-win card before the first win; the repeat-win reward after it (GDD 8.1).
 * Hover, keyboard focus or a long press on the card shows its Card Details, as
 * in the Deck builder.
 */
const RewardRow = ({ stop }: { readonly stop: TrailStage }) => {
  const { tr } = useGameText();
  const { cardId, rank } = stop.stage.firstWinCard;
  const card = getCard(cardId);
  const won = stop.state === "done";
  const { bind, details } = useRewardPeek({
    placement: "right",
    testId: "stage-reward-peek",
  });
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = { cardId, rank, from: "campaign" };
  return (
    <Row label={tr("campaign.panel.reward")} className={INK[2]}>
      <div className="flex items-center gap-3">
        <Button
          ref={trigger}
          {...bind(target)}
          aria-label={`${tr(`cards.${cardId}.name`)}, ${tr(`ranks.${rank}`)}`}
          className={cn("shrink-0", PEEK_BUTTON)}
          data-testid="stage-reward-frame"
        >
          <CardFrame
            cardId={cardId}
            rank={rank}
            countdown={card.countdown}
            className={cn(
              "-rotate-2 text-[6px] [@media(max-height:500px)]:text-[4.5px]",
              won && "saturate-[0.7]",
              DEAL
            )}
          />
        </Button>
        {details(target, trigger)}
        <div className="min-w-0">
          <p
            className="font-display leading-tight font-bold [@media(max-height:500px)]:text-sm"
            data-testid="stage-reward-card"
          >
            {tr(`cards.${cardId}.name`)}
          </p>
          <p className="text-ink-faded text-xs font-bold">
            {tr(`ranks.${rank}`)}
          </p>
          <p className="text-ink-soft mt-1 text-xs leading-snug">
            {won
              ? tr("campaign.panel.repeatWin")
              : tr("campaign.panel.firstWin")}
          </p>
        </div>
      </div>
    </Row>
  );
};

/**
 * The 3 Star conditions of the Stage (GDD 4.11). The Star Turn is in the Stage
 * data and differs from Stage to Stage, so the Player reads it here (ADR-0045).
 */
const StarsRow = ({ stop }: { readonly stop: TrailStage }) => {
  const { tr } = useGameText();
  return (
    <Row label={tr("campaign.panel.stars")} className={INK[2]}>
      <ul className="text-ink-soft grid gap-1 text-xs leading-snug [@media(max-height:500px)]:gap-0.5">
        {([1, 2, 3] as const).map((count) => (
          <li
            key={count}
            className="flex items-center gap-2"
            data-testid={`stage-star-rule-${count}`}
          >
            <StarRow
              stars={count}
              className="shrink-0 gap-0.5"
              tone="parchment"
              starClassName="size-3.5"
            />
            <span className="sr-only">
              {tr("battle.starsLabel", { count })}
            </span>
            <span className="min-w-0">
              {tr(`campaign.panel.starRule.${count}`, {
                turn: stop.stage.starTurn,
              })}
            </span>
          </li>
        ))}
      </ul>
    </Row>
  );
};

/**
 * The Deck choice: the Deck slots that have cards, with the active Deck
 * selected (GDD 11.5). "Edit Decks" opens the Deck builder. A Deck that is not
 * valid cannot start a Battle, and its first reason shows (CRD-04).
 */
export const useDeckChoice = () => {
  const [deckId, setDeckId] = useAtom(activeDeckIdAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const collection = useAtomValue(collectionAtom);
  const level = useAtomValue(playerLevelAtom);
  const decks = slots.filter((slot) => slot.deck.length > 0);
  const chosen = decks.find((slot) => slot.id === deckId) ?? decks[0];
  const problems = chosen
    ? deckProblems(slotInput(chosen, collection, level))
    : [];
  return { slots, decks, chosen, setDeckId, problem: problems[0] };
};

export const DeckRow = ({
  choice,
  onEdit,
  wide = false,
}: {
  readonly choice: ReturnType<typeof useDeckChoice>;
  readonly onEdit: () => void;
  /**
   * Two columns of Decks when the row has the space (the Dungeon Panel). Edit
   * Decks then takes the next cell, so an odd count of Decks adds no row.
   */
  readonly wide?: boolean;
}) => {
  const { tr, text } = useGameText();
  const { slots, decks, chosen, setDeckId, problem } = choice;
  const edit = (
    <GameButton
      intent="wood"
      size="sm"
      onPress={onEdit}
      className={cn(
        "whitespace-nowrap [@media(max-height:500px)]:min-h-8",
        wide ? "self-center justify-self-start" : "self-start"
      )}
      data-testid="edit-decks"
    >
      {tr("battle.editDecks")}
    </GameButton>
  );
  return (
    <RadioGroup
      value={chosen?.id ?? null}
      onChange={setDeckId}
      className={cn(
        "grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:py-1.5",
        INK[3]
      )}
    >
      <Label className="font-display text-ink pt-0.5 text-sm font-bold">
        {tr("campaign.panel.deck")}
      </Label>
      <div className="@container flex min-w-0 flex-col gap-1.5">
        <div className={cn("grid gap-1.5", wide && "@[20rem]:grid-cols-2")}>
          {decks.map((slot) => (
            <Radio
              key={slot.id}
              value={slot.id}
              className={deckOption}
              data-testid={`deck-${slot.id}`}
            >
              <span
                className="bg-frame-wood text-cream grid size-7 shrink-0 place-items-center rounded-lg"
                aria-hidden
              >
                <GlyphIcon
                  glyph={classGlyph(slot.classId)}
                  className="size-4"
                />
              </span>
              <span className="min-w-0">
                <span className="font-display block truncate text-sm leading-tight font-bold">
                  {slot.name ||
                    text(defaultSlotName(slot, slots.indexOf(slot)))}
                </span>
                <span className="text-ink-soft block truncate text-xs [@media(max-height:500px)]:sr-only">
                  {tr("battle.deckLine", {
                    className: text(classText(slot.classId)),
                    count: slot.deck.length,
                  })}
                </span>
              </span>
            </Radio>
          ))}
          {wide ? edit : null}
        </div>
        {wide ? null : edit}
        {problem ? (
          <output
            className="flex items-start gap-2 text-xs leading-snug"
            data-testid="deck-problem"
          >
            <span
              className="mt-[0.4em] size-2 shrink-0 rotate-45 border"
              style={{
                borderColor: CAMPAIGN_PROBLEM_EDGE,
                background: CAMPAIGN_PROBLEM_FACE,
              }}
              aria-hidden
            />
            {text(problemText(problem))}
          </output>
        ) : null}
      </div>
    </RadioGroup>
  );
};

/**
 * The Sweep row (GDD 4.12): only on a Stage with 3 best Stars. It shows the
 * Campaign Sweep Tickets of the Player and the Ticket control.
 */
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
    <Row
      label={tr("sweep.label")}
      className={cn("border-parchment-rule/70 border-t", INK[4])}
      anchor="sweep-row"
    >
      <SweepTickets
        kind="campaign"
        owned={owned}
        value={value}
        onChange={onChange}
      />
    </Row>
  );
};

/** The header of the panel: the shield, the Stage ID, the best Stars and the close button. */
const PanelHeader = ({
  shown,
  close,
}: {
  readonly shown: TrailStage;
  readonly close: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <header
      className={cn(
        "border-parchment-rule flex items-center gap-3 border-b-2 pb-3 [@media(max-height:500px)]:pb-2",
        INK[0]
      )}
    >
      <StageShield
        state={shown.state}
        className="-my-1 h-12 w-[42px] shrink-0 [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:w-8"
        style={{ filter: CAMPAIGN_DROP_SMALL }}
      />
      <div className="min-w-0">
        <Heading
          slot="title"
          className="font-display flex items-center gap-2 text-2xl leading-none font-black [@media(max-height:500px)]:text-xl"
        >
          {tr("battle.stageLabel", { id: shown.stage.id })}
          {shown.stage.boss ? (
            <span className="bg-blood-banner rounded-[4px] px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.04em] text-white uppercase">
              {tr("battle.boss")}
            </span>
          ) : null}
        </Heading>
        <p
          className="text-ink-soft mt-1.5 flex items-center gap-1.5 text-xs font-bold"
          data-testid="stage-best-stars"
          data-stars={shown.stars}
        >
          <span>{tr("campaign.panel.bestStars")}</span>
          {shown.stars > 0 ? (
            <>
              <StarRow
                stars={shown.stars}
                className="gap-0.5"
                tone="parchment"
                starClassName="size-4"
              />
              <span className="sr-only">
                {tr("battle.starsLabel", { count: shown.stars })}
              </span>
            </>
          ) : (
            <span className="text-ink-faded font-semibold">
              {tr("campaign.panel.notWon")}
            </span>
          )}
        </p>
      </div>
      <GameButton
        intent="wood"
        size="icon"
        aria-label={tr("campaign.panel.close")}
        onPress={close}
        className="ml-auto shrink-0 self-start [@media(max-height:500px)]:size-9"
        data-testid="stage-panel-close"
      >
        <CloseIcon className="size-5" />
      </GameButton>
    </header>
  );
};

/** The large buttons of the panel, in Cinzel. */
const ACTION =
  "font-display w-full tracking-[0.04em] [@media(max-height:500px)]:min-h-11";

/**
 * The actions of the panel. On a Stage with 3 best Stars, Sweep is the gold
 * action at the right and takes the focus, and Fight is wood at its left.
 * When the Player cannot Sweep, Fight is gold and takes the focus again.
 * On any other Stage, Fight is the one gold button across the full width.
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
    <div
      className={cn(
        "mt-1 grid gap-2 [@media(max-height:500px)]:mt-auto",
        sweepable && "grid-cols-2",
        INK[5]
      )}
    >
      <GameButton
        intent={sweepNow ? "wood" : "gold"}
        size="lg"
        autoFocus={!sweepNow}
        className={ACTION}
        data-testid="start-battle"
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
          data-testid="sweep"
          isDisabled={!sweepNow}
          onPress={onSweep}
        >
          <GlyphIcon
            glyph="campaignTicket"
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
 * The Stage Panel (GDD 11.5): a parchment dialog in the center of the screen,
 * over the dim map. It shows the Stage ID, the enemy Hero, the reward, the
 * best Stars, the Star conditions and the Deck, and the Fight button. Esc, the close button and a
 * click outside close it. Fight takes the focus, so Enter starts the Battle.
 * On a Stage with 3 best Stars, it also has the Sweep (GDD 4.12): the Sweep
 * row, the Sweep button, which then takes the focus, and the Sweep Result,
 * which turns the page of the same sheet.
 *
 * The panel comes up out of the Stage Marker `from` and goes back into it,
 * as the Settings dialog does with its button. It keeps the last Stage while
 * it closes. On the way to the Deck builder and back, it only zooms and
 * fades at the center, because the Deck book opens over it.
 */
export const StagePanel = ({
  stop,
  from,
  onClose,
  onStart,
}: {
  readonly stop: TrailStage | null;
  readonly from?: RefObject<Element | null>;
  readonly onClose: () => void;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const choice = useDeckChoice();
  const player = useAtomValue(battlePlayerAtom);
  const [editing, setEditing] = useState(false);
  const [last, setLast] = useState(stop);
  if (stop !== null && stop !== last) {
    setLast(stop);
  }
  const shown = stop ?? last;
  const overlay = useRef<HTMLDivElement | null>(null);
  // True from "Edit Decks" until the panel closes: the panel stays at the center.
  const atCenter = useRef(false);
  const { chosen, problem } = choice;
  const isOpen = stop !== null && !editing;
  const preloadRegion = stop?.stage.region;
  useEffect(() => {
    if (isOpen && preloadRegion !== undefined) {
      preloadStageBattle(preloadRegion);
    }
  }, [isOpen, preloadRegion]);
  const sweep = useSweep("campaign", shown?.stage.id ?? null, stop !== null);
  const sweepable = shown !== null && isCampaignSweepable(shown.stars);
  useStagePanelHints(
    isOpen && shown !== null && sweep.result === null ? shown.stars : null
  );
  const sweepNow = (tickets: number) => {
    if (chosen) {
      sweep.sweep(tickets, chosen.classId);
    }
  };
  return (
    <>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            atCenter.current = false;
            placeSheetOrigin(overlay.current, from?.current ?? null);
            onClose();
          }
        }}
        isDismissable
        // The ref runs before the first paint, so the sheet starts on the marker.
        ref={(element) => {
          overlay.current = element;
          if (!atCenter.current) {
            placeSheetOrigin(element, from?.current ?? null);
          }
        }}
        className={cn(GAME_SCRIM, "z-50", SHEET_SCRIM_MOTION)}
      >
        <Modal
          className={cn(
            "group/sheet flex max-h-full w-[min(460px,94vw)] [@media(max-height:500px)]:w-[min(720px,96vw)]",
            SHEET_PATH_MOTION
          )}
        >
          <Dialog
            className={cn(
              "border-frame-wood bg-parchment text-ink max-h-full w-full overflow-y-auto overscroll-contain rounded-2xl border-4 px-5 pt-4 pb-5 outline-none [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-3",
              SHEET_MOTION
            )}
            style={{ boxShadow: CAMPAIGN_PANEL_SHADOW }}
            data-testid="stage-panel"
          >
            {({ close }) =>
              shown ? (
                <div className={INK_OUT}>
                  <PanelHeader shown={shown} close={close} />
                  {sweep.result ? (
                    <SweepResult
                      key={sweep.resultKey}
                      shown={sweep.result}
                      owned={sweep.owned}
                      onAgain={() => sweepNow(sweep.result?.tickets ?? 0)}
                      onClose={sweep.handleResultClose}
                    />
                  ) : (
                    <div className="[@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-x-5">
                      <div className="divide-parchment-rule/70 divide-y">
                        <EnemyRow stop={shown} />
                        <RewardRow stop={shown} />
                        <StarsRow stop={shown} />
                      </div>
                      <div className="border-parchment-rule/70 flex flex-col border-t [@media(max-height:500px)]:border-t-0">
                        <DeckRow
                          choice={choice}
                          onEdit={() => {
                            atCenter.current = true;
                            clearSheetOrigin(overlay.current);
                            setEditing(true);
                          }}
                        />
                        {sweepable ? (
                          <SweepRow
                            owned={sweep.owned}
                            value={sweep.tickets}
                            onChange={sweep.handleTicketsChange}
                          />
                        ) : null}
                        <PanelActions
                          sweepable={sweepable}
                          tickets={chosen ? sweep.tickets : 0}
                          canFight={
                            chosen !== undefined && problem === undefined
                          }
                          onFight={() => {
                            if (chosen) {
                              onStart({
                                stageId: shown.stage.id,
                                deck: chosen,
                                player,
                                seed: qaSeed() ?? randomSeed(),
                              });
                            }
                          }}
                          onSweep={() => sweepNow(sweep.tickets)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : null
            }
          </Dialog>
        </Modal>
      </ModalOverlay>
      <DeckDialog isOpen={editing} onOpenChange={setEditing} />
    </>
  );
};
