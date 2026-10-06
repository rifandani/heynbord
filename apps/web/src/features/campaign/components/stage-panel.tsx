import { useAtom, useAtomValue } from "@effect/atom-react";
import { deckProblems, getCard } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Dialog,
  Heading,
  Label,
  Modal,
  ModalOverlay,
  Radio,
  RadioGroup,
} from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import type { BattleOptions } from "@/features/battle/battle-session";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { qaSeed } from "@/features/battle/qa";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import {
  StageShield,
  StarRow,
} from "@/features/campaign/components/campaign-icons";
import type { TrailStage } from "@/features/campaign/region-map";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
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

/** One row of the panel: a Cinzel label at the left, its content at the right (as in Settings). */
const Row = ({
  label,
  children,
  className,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn(
      "grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:py-1.5",
      className
    )}
  >
    <p className="font-display pt-0.5 text-sm font-bold text-[#2a1d12]">
      {label}
    </p>
    <div className="min-w-0">{children}</div>
  </div>
);

const deckOption = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left transition-[transform,box-shadow] outline-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:-translate-y-0.5 motion-reduce:data-[hovered]:translate-y-0",
    "[@media(max-height:500px)]:min-h-9 [@media(max-height:500px)]:py-1",
    isSelected
      ? "border-[#e2a93b] bg-[#fff3d1] shadow-[0_0_0_3px_rgba(226,169,59,0.45)]"
      : "border-[#c9b48c] bg-[#f6ead0]"
  );

/** The enemy Hero of the Stage, its HP and the Recommended level. */
const EnemyRow = ({ stop }: { readonly stop: TrailStage }) => {
  const { tr, text } = useGameText();
  const { stage } = stop;
  return (
    <Row label={tr("campaign.panel.enemy")}>
      <p className="flex items-center gap-2 font-bold">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#6b1610] text-[#fff6df] [@media(max-height:500px)]:size-6"
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
      <p className="mt-1 text-xs text-[#5b4632]">
        {tr("campaign.panel.heroHp", { hp: stage.enemy.heroHp })} ·{" "}
        {tr("campaign.panel.level", { level: stage.recommendedLevel })}
      </p>
    </Row>
  );
};

/** The first-win card before the first win; the repeat-win reward after it (GDD 8.1). */
const RewardRow = ({ stop }: { readonly stop: TrailStage }) => {
  const { tr } = useGameText();
  const { cardId, rank } = stop.stage.firstWinCard;
  const card = getCard(cardId);
  const won = stop.state === "done";
  return (
    <Row label={tr("campaign.panel.reward")}>
      <div className="flex items-center gap-3">
        <CardFrame
          cardId={cardId}
          rank={rank}
          countdown={card.countdown}
          className={cn(
            "shrink-0 -rotate-2 text-[6px] [@media(max-height:500px)]:text-[4.5px]",
            won && "opacity-70 saturate-[0.7]"
          )}
        />
        <div className="min-w-0">
          <p
            className="font-display leading-tight font-bold [@media(max-height:500px)]:text-sm"
            data-testid="stage-reward-card"
          >
            {tr(`cards.${cardId}.name`)}
          </p>
          <p className="text-xs font-bold text-[#6b5238]">
            {tr(`ranks.${rank}`)}
          </p>
          <p className="mt-1 text-xs leading-snug text-[#5b4632]">
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
 * The Deck choice: the Deck slots that have cards, with the active Deck
 * selected (GDD 11.5). "Edit Decks" opens the Deck builder. A Deck that is not
 * valid cannot start a Battle, and its first reason shows (CRD-04).
 */
const useDeckChoice = () => {
  const [deckId, setDeckId] = useAtom(activeDeckIdAtom);
  const slots = useAtomValue(deckSlotsAtom);
  const collection = useAtomValue(collectionAtom);
  const decks = slots.filter((slot) => slot.deck.length > 0);
  const chosen = decks.find((slot) => slot.id === deckId) ?? decks[0];
  const problems = chosen ? deckProblems(slotInput(chosen, collection)) : [];
  return { slots, decks, chosen, setDeckId, problem: problems[0] };
};

const DeckRow = ({
  choice,
  onEdit,
}: {
  readonly choice: ReturnType<typeof useDeckChoice>;
  readonly onEdit: () => void;
}) => {
  const { tr, text } = useGameText();
  const { slots, decks, chosen, setDeckId, problem } = choice;
  return (
    <RadioGroup
      value={chosen?.id ?? null}
      onChange={setDeckId}
      className="grid grid-cols-[4.75rem_1fr] items-start gap-x-3 py-3 [@media(max-height:500px)]:py-1.5"
    >
      <Label className="font-display pt-0.5 text-sm font-bold text-[#2a1d12]">
        {tr("campaign.panel.deck")}
      </Label>
      <div className="flex min-w-0 flex-col gap-1.5">
        {decks.map((slot) => (
          <Radio
            key={slot.id}
            value={slot.id}
            className={deckOption}
            data-testid={`deck-${slot.id}`}
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#5b3a1e] text-[#fff6df]"
              aria-hidden
            >
              <GlyphIcon glyph={classGlyph(slot.classId)} className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="font-display block truncate text-sm leading-tight font-bold">
                {slot.name || text(defaultSlotName(slot, slots.indexOf(slot)))}
              </span>
              <span className="block text-xs text-[#5b4632] [@media(max-height:500px)]:sr-only">
                {tr("battle.deckLine", {
                  className: text(classText(slot.classId)),
                  count: slot.deck.length,
                })}
              </span>
            </span>
          </Radio>
        ))}
        <GameButton
          intent="wood"
          size="sm"
          onPress={onEdit}
          className="self-start whitespace-nowrap [@media(max-height:500px)]:min-h-8"
          data-testid="edit-decks"
        >
          {tr("battle.editDecks")}
        </GameButton>
        {problem ? (
          <output
            className="flex items-start gap-2 text-xs leading-snug"
            data-testid="deck-problem"
          >
            <span
              className="mt-[0.4em] size-2 shrink-0 rotate-45 border border-[#5b2a0c] bg-[#b4521a]"
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
 * The Stage Panel (GDD 11.5): a parchment dialog in the center of the screen,
 * over the dim map. It shows the Stage ID, the enemy Hero, the reward, the
 * best Stars and the Deck, and the Fight button. Esc, the close button and a
 * click outside close it. Fight takes the focus, so Enter starts the Battle.
 */
export const StagePanel = ({
  stop,
  onClose,
  onStart,
}: {
  readonly stop: TrailStage | null;
  readonly onClose: () => void;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const choice = useDeckChoice();
  const [editing, setEditing] = useState(false);
  const { chosen, problem } = choice;
  return (
    <>
      <ModalOverlay
        isOpen={stop !== null && !editing}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        isDismissable
        className="fade-in animate-in fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] duration-200 motion-reduce:animate-none [@media(max-height:500px)]:p-2"
      >
        <Modal className="fade-in zoom-in-95 animate-in max-h-full w-[min(460px,94vw)] overflow-y-auto overscroll-contain rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] px-5 pt-4 pb-5 text-[#2a1d12] shadow-[0_24px_48px_rgba(0,0,0,0.55)] duration-200 motion-reduce:animate-none [@media(max-height:500px)]:w-[min(720px,96vw)] [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-3">
          <Dialog className="outline-none" data-testid="stage-panel">
            {({ close }) =>
              stop ? (
                <>
                  <header className="flex items-center gap-3 border-b-2 border-[#c9b48c] pb-3 [@media(max-height:500px)]:pb-2">
                    <StageShield
                      state={stop.state}
                      className="-my-1 h-12 w-[42px] shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:w-8"
                    />
                    <div className="min-w-0">
                      <Heading
                        slot="title"
                        className="font-display flex items-center gap-2 text-2xl leading-none font-black [@media(max-height:500px)]:text-xl"
                      >
                        {tr("battle.stageLabel", { id: stop.stage.id })}
                        {stop.stage.boss ? (
                          <span className="rounded-[4px] bg-[#8e1f1f] px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.04em] text-white uppercase">
                            {tr("battle.boss")}
                          </span>
                        ) : null}
                      </Heading>
                      <p
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#5b4632]"
                        data-testid="stage-best-stars"
                        data-stars={stop.stars}
                      >
                        <span>{tr("campaign.panel.bestStars")}</span>
                        {stop.stars > 0 ? (
                          <>
                            <StarRow
                              stars={stop.stars}
                              className="gap-0.5"
                              tone="parchment"
                              starClassName="size-4"
                            />
                            <span className="sr-only">
                              {tr("battle.starsLabel", { count: stop.stars })}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-[#6b5238]">
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
                      <HiXMark className="size-5" aria-hidden />
                    </GameButton>
                  </header>
                  <div className="[@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-x-5">
                    <div className="divide-y divide-[#c9b48c]/70">
                      <EnemyRow stop={stop} />
                      <RewardRow stop={stop} />
                    </div>
                    <div className="flex flex-col border-t border-[#c9b48c]/70 [@media(max-height:500px)]:border-t-0">
                      <DeckRow
                        choice={choice}
                        onEdit={() => setEditing(true)}
                      />
                      <GameButton
                        intent="gold"
                        size="lg"
                        autoFocus
                        className="font-display mt-1 w-full tracking-[0.04em] [@media(max-height:500px)]:mt-auto [@media(max-height:500px)]:min-h-11"
                        data-testid="start-battle"
                        isDisabled={!chosen || problem !== undefined}
                        onPress={() => {
                          if (chosen) {
                            onStart({
                              stageId: stop.stage.id,
                              deck: chosen,
                              seed: qaSeed() ?? randomSeed(),
                            });
                          }
                        }}
                      >
                        {tr("campaign.panel.fight")}
                      </GameButton>
                    </div>
                  </div>
                </>
              ) : null
            }
          </Dialog>
        </Modal>
      </ModalOverlay>
      <DeckDialog isOpen={editing} onOpenChange={setEditing} />
    </>
  );
};
