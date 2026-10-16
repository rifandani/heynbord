import { useAtomValue } from "@effect/atom-react";
import { coinDenominations, getFloor } from "@workspace/rules";
import type { ForgeStoneReward } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import type { BattleOptions } from "@/features/battle/battle-session";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { qaSeed } from "@/features/battle/qa";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import {
  DeckRow,
  useDeckChoice,
} from "@/features/campaign/components/stage-panel";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
import { classText } from "@/features/deck/deck";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import { FloorStone } from "@/features/heynspire/components/floor-stone";
import type { FloorState } from "@/features/heynspire/heynspire";
import {
  floorEnemyKey,
  floorRewardPreview,
} from "@/features/heynspire/heynspire";
import { battlePlayerAtom } from "@/features/profile/profile.atoms";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import {
  clearSheetOrigin,
  placeSheetOrigin,
  SHEET_MOTION,
  SHEET_PATH_MOTION,
  SHEET_SCRIM_MOTION,
} from "@/features/town/sheet-motion";
import { coinWords } from "@/features/town/town";

/**
 * The parts of the panel ink in from the top while the sheet comes up out of
 * its Floor stone, as in the Stage Panel: the header, the enemy, the reward,
 * the Deck, then Fight.
 */
const INK = [
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_140ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_190ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_240ms_both]",
  "motion-safe:group-data-[entering]/sheet:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_340ms_both]",
] as const;

/** The text goes before the sheet goes back into the Floor stone. */
const INK_OUT =
  "motion-safe:group-data-[exiting]/sheet:animate-[settings-sheet-ink_260ms_ease-out_reverse_both]";

/** The small Night Plate of a reward, as the Battle result shows it. */
const PLATE =
  "flex w-fit items-center gap-1.5 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 px-2.5 py-1 text-sm leading-none font-black whitespace-nowrap text-[#fff6df] tabular-nums shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:py-0.5 [@media(max-height:500px)]:text-xs";

const useFormat = () => {
  const { locale } = useGameText();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return (value: number) => number.format(value);
};

/** One row of the panel: a Cinzel label at the left, its content at the right (as the Stage Panel). */
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

/** The enemy Hero of the Floor, its HP and the Recommended level. */
const EnemyRow = ({ floor }: { readonly floor: number }) => {
  const { tr, text } = useGameText();
  const { enemy, recommendedLevel } = getFloor(floor);
  return (
    <Row label={tr("campaign.panel.enemy")} className={INK[1]}>
      <p className="flex items-center gap-2 font-bold">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#6b1610] text-[#fff6df] [@media(max-height:500px)]:size-6"
          aria-hidden
        >
          <GlyphIcon glyph={classGlyph(enemy.classId)} className="size-4" />
        </span>
        <span
          className="min-w-0 leading-tight [@media(max-height:500px)]:text-sm"
          data-testid="floor-enemy"
        >
          {tr("campaign.panel.enemyLine", {
            name: tr(floorEnemyKey(floor)),
            className: text(classText(enemy.classId)),
          })}
        </span>
      </p>
      <p className="mt-1 text-xs text-[#5b4632]">
        {tr("campaign.panel.heroHp", { hp: enemy.heroHp })} ·{" "}
        {tr("campaign.panel.level", { level: recommendedLevel })}
      </p>
    </Row>
  );
};

const StonePlate = ({ stones }: { readonly stones: ForgeStoneReward }) => {
  const { tr } = useGameText();
  return (
    <p
      className={PLATE}
      data-testid="floor-reward-stones"
      data-tier={stones.tier}
    >
      <ForgeStoneIcon tier={stones.tier} className="size-4" />
      {tr("battle.forgeStonesEarned", {
        count: stones.count,
        tier: tr(`forgeStones.tiers.${stones.tier}`),
      })}
    </p>
  );
};

/**
 * What the Floor gives (Economy 2.3): Coin, XP, the Forge Stones of a 5th
 * Floor or a Boss Floor, the Essence and the Heynstones of a Boss Floor,
 * and the Campaign Sweep Tickets. A won Floor shows them dim: each Floor
 * gives its reward one time.
 */
const RewardRow = ({
  floor,
  won,
}: {
  readonly floor: number;
  readonly won: boolean;
}) => {
  const { tr } = useGameText();
  const format = useFormat();
  const { win } = floorRewardPreview(floor);
  const words = (copper: number) =>
    coinWords(copper, format, (denomination) =>
      tr(`town.balances.denominations.${denomination}.name`)
    );
  return (
    <Row label={tr("campaign.panel.reward")} className={INK[2]}>
      <div
        className={cn(
          "flex flex-wrap gap-1.5",
          won && "opacity-70 saturate-[0.7]"
        )}
        data-testid="floor-reward"
      >
        <p
          className={PLATE}
          data-testid="floor-reward-coin"
          data-copper={win.coin}
        >
          <span className="sr-only">{words(win.coin)}</span>
          <span aria-hidden className="flex items-center gap-1.5">
            <CoinAmount parts={coinDenominations(win.coin)} format={format} />
          </span>
        </p>
        <p
          className={cn(PLATE, "text-[#9fe7f5]")}
          data-testid="floor-reward-xp"
        >
          {tr("battle.xpEarned", { amount: win.xp })}
        </p>
        {win.essence > 0 ? (
          <p className={PLATE} data-testid="floor-reward-essence">
            <BalanceIcon kind="essence" className="size-4" />
            {tr("battle.essenceEarned", { amount: win.essence })}
          </p>
        ) : null}
        {win.heynstones > 0 ? (
          <p className={PLATE} data-testid="floor-reward-heynstones">
            <BalanceIcon kind="heynstones" className="size-4" />
            {tr("battle.heynstonesEarned", { amount: win.heynstones })}
          </p>
        ) : null}
        {win.forgeStones.map((stones) => (
          <StonePlate key={stones.tier} stones={stones} />
        ))}
        <p className={PLATE}>
          <GlyphIcon
            glyph="campaignTicket"
            className="size-4 -rotate-8 text-[#ffd75a]"
          />
          {tr("sweep.campaign.earned", { count: win.campaignSweepTickets })}
        </p>
      </div>
    </Row>
  );
};

/** The header of the panel: the stone, the Floor, its state and the close button. */
const PanelHeader = ({
  floor,
  state,
  boss,
  close,
}: {
  readonly floor: number;
  readonly state: FloorState;
  readonly boss: boolean;
  readonly close: () => void;
}) => {
  const { tr } = useGameText();
  return (
    <header
      className={cn(
        "flex items-center gap-3 border-b-2 border-[#c9b48c] pb-3 [@media(max-height:500px)]:pb-2",
        INK[0]
      )}
    >
      <FloorStone
        state={state}
        className="w-12 shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)] [@media(max-height:500px)]:w-9"
      />
      <div className="min-w-0">
        <Heading
          slot="title"
          className="font-display flex items-center gap-2 text-2xl leading-none font-black [@media(max-height:500px)]:text-xl"
        >
          {tr("heynspire.floor", { number: floor })}
          {boss ? (
            <span className="rounded-[4px] bg-[#8e1f1f] px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.04em] text-white uppercase">
              {tr("battle.boss")}
            </span>
          ) : null}
        </Heading>
        <p
          className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#5b4632]"
          data-testid="floor-panel-state"
          data-state={state}
        >
          {state === "won" ? (
            <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#7a5310] px-1.5 py-0.5 text-[11px] leading-none font-bold tracking-[0.04em] text-[#fff6df] uppercase shadow-[inset_0_0_0_1px_#e7bb6a]">
              <GlyphIcon glyph="check" className="size-3 text-[#ffd75a]" />
              {tr("heynspire.panel.won")}
            </span>
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
        aria-label={tr("heynspire.panel.close")}
        onPress={close}
        autoFocus={state === "won"}
        className="ml-auto shrink-0 self-start [@media(max-height:500px)]:size-9"
        data-testid="floor-panel-close"
      >
        <HiXMark className="size-5" aria-hidden />
      </GameButton>
    </header>
  );
};

/**
 * The Floor Panel (GDD 11.1): a parchment dialog like the Stage Panel. It
 * shows the Floor, the enemy Hero, the Recommended level and the reward. The
 * Current Floor also has the Deck choice and Fight, which takes the focus,
 * so Enter starts the Battle. A won Floor shows its reward, with no Fight:
 * a won Floor cannot be played again. Esc, the close button and a click
 * outside close it.
 *
 * It comes up out of its Floor stone (`from`) and goes back into it, as the
 * Stage Panel does with its Stage Marker. It keeps the last Floor while it
 * closes. On the way to the Deck builder and back, it only zooms and fades
 * at the center.
 */
export const FloorPanel = ({
  floor,
  state,
  from,
  onClose,
  onStart,
}: {
  /** The Floor of the open panel, or `null` when it is closed. */
  readonly floor: number | null;
  readonly state: (floor: number) => FloorState;
  /** The Floor stone that the panel comes out of. */
  readonly from: (floor: number) => Element | null;
  readonly onClose: () => void;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const choice = useDeckChoice();
  const player = useAtomValue(battlePlayerAtom);
  const [editing, setEditing] = useState(false);
  const [last, setLast] = useState(floor);
  if (floor !== null && floor !== last) {
    setLast(floor);
  }
  const shown = floor ?? last;
  const overlay = useRef<HTMLDivElement | null>(null);
  // True from "Edit Decks" until the panel closes: the panel stays at the center.
  const atCenter = useRef(false);
  const { chosen, problem } = choice;
  const shownState = shown === null ? "locked" : state(shown);
  const definition = shown === null ? null : getFloor(shown);
  return (
    <>
      <ModalOverlay
        isOpen={floor !== null && !editing}
        onOpenChange={(open) => {
          if (!open) {
            atCenter.current = false;
            placeSheetOrigin(
              overlay.current,
              shown === null ? null : from(shown)
            );
            onClose();
          }
        }}
        isDismissable
        // The ref runs before the first paint, so the sheet starts on the stone.
        ref={(element) => {
          overlay.current = element;
          if (!atCenter.current && shown !== null) {
            placeSheetOrigin(element, from(shown));
          }
        }}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] [@media(max-height:500px)]:p-2",
          SHEET_SCRIM_MOTION
        )}
      >
        <Modal
          className={cn(
            "group/sheet flex max-h-full w-[min(460px,94vw)] [@media(max-height:500px)]:w-[min(720px,96vw)]",
            SHEET_PATH_MOTION
          )}
        >
          <Dialog
            className={cn(
              "max-h-full w-full overflow-y-auto overscroll-contain rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] px-5 pt-4 pb-5 text-[#2a1d12] shadow-[0_24px_48px_rgba(0,0,0,0.55)] outline-none [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-3",
              SHEET_MOTION
            )}
            data-testid="floor-panel"
          >
            {({ close }) =>
              shown !== null && definition ? (
                <div className={INK_OUT}>
                  <PanelHeader
                    floor={shown}
                    state={shownState}
                    boss={definition.boss}
                    close={close}
                  />
                  <div className="[@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:gap-x-5">
                    <div className="divide-y divide-[#c9b48c]/70">
                      <EnemyRow floor={shown} />
                      <RewardRow floor={shown} won={shownState === "won"} />
                    </div>
                    {shownState === "current" ? (
                      <div className="flex flex-col border-t border-[#c9b48c]/70 [@media(max-height:500px)]:border-t-0">
                        <DeckRow
                          choice={choice}
                          onEdit={() => {
                            atCenter.current = true;
                            clearSheetOrigin(overlay.current);
                            setEditing(true);
                          }}
                        />
                        <GameButton
                          intent="gold"
                          size="lg"
                          autoFocus
                          className={cn(
                            "font-display mt-1 w-full tracking-[0.04em] [@media(max-height:500px)]:mt-auto [@media(max-height:500px)]:min-h-11",
                            INK[3]
                          )}
                          data-testid="floor-fight"
                          isDisabled={
                            chosen === undefined || problem !== undefined
                          }
                          onPress={() => {
                            if (chosen) {
                              onStart({
                                stageId: definition.id,
                                floor: definition,
                                deck: chosen,
                                player,
                                seed: qaSeed() ?? randomSeed(),
                              });
                            }
                          }}
                        >
                          {tr("campaign.panel.fight")}
                        </GameButton>
                      </div>
                    ) : null}
                  </div>
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
