import { useAtomValue } from "@effect/atom-react";
import {
  coinDenominations,
  getFloor,
  HEYNSPIRE_FLOORS,
} from "@workspace/rules";
import type { ForgeStoneReward } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useId, useState } from "react";

import { GameButton } from "@/core/components/game/game-button";
import type { BattleOptions } from "@/features/battle/battle-session";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { REWARD_PLATE_COMPACT as PLATE } from "@/features/battle/components/reward-plate";
import { classGlyph } from "@/features/battle/glyphs";
import { qaSeed } from "@/features/battle/qa";
import { randomSeed } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import { PanelRow as Row } from "@/features/campaign/components/panel-row";
import {
  DeckRow,
  useDeckChoice,
} from "@/features/campaign/components/stage-panel";
import { DeckDialog } from "@/features/deck/components/deck-dialog";
import { classText } from "@/features/deck/deck";
import { ForgeStoneIcon } from "@/features/hero/components/forge-stone-icon";
import type { FloorState } from "@/features/heynspire/heynspire";
import {
  floorEnemyKey,
  floorRewardPreview,
} from "@/features/heynspire/heynspire";
import {
  cssVars,
  HEYNSPIRE_CSS,
  HEYNSPIRE_LOCK_CHIP,
} from "@/features/heynspire/tokens";
import { useNumberFormat } from "@/features/i18n/use-number-format";
import {
  battlePlayerAtom,
  playerLevelAtom,
} from "@/features/profile/profile.atoms";
import { BalanceIcon } from "@/features/town/components/balance-icon";
import { CoinAmount } from "@/features/town/components/balance-plate";
import { coinWords } from "@/features/town/town";

/** A small state chip in the header: never the color alone, its icon and its words say the state. */
const CHIP =
  "inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] leading-none font-bold tracking-[0.04em] uppercase";

/** The enemy Hero of the Floor: its Class seal, its name, its Class and its HP. */
const EnemyRow = ({ floor }: { readonly floor: number }) => {
  const { tr, text } = useGameText();
  const { enemy } = getFloor(floor);
  return (
    <Row label={tr("campaign.panel.enemy")}>
      <p className="flex items-center gap-2 font-bold">
        <span
          className="bg-enemy-deep text-cream grid size-7 shrink-0 place-items-center rounded-lg [@media(max-height:500px)]:size-6"
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
      <p className="text-ink-soft mt-1 text-xs">
        {tr("campaign.panel.heroHp", { hp: enemy.heroHp })}
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
 * What the first win of the Floor gives (Economy 2.3): Coin, XP, the Forge
 * Stones of a 5th Floor or a Boss Floor, the Essence and the Heynstones of a
 * Boss Floor, and the Campaign Sweep Tickets. A won Floor shows them dim,
 * with "Received": each Floor gives its reward one time.
 */
const RewardRow = ({
  floor,
  won,
}: {
  readonly floor: number;
  readonly won: boolean;
}) => {
  const { tr } = useGameText();
  const format = useNumberFormat();
  const { win } = floorRewardPreview(floor);
  const words = (copper: number) =>
    coinWords(copper, format, (denomination) =>
      tr(`town.balances.denominations.${denomination}.name`)
    );
  return (
    <Row label={tr("campaign.panel.reward")}>
      {won ? (
        <p
          className="text-ink-faded mb-1.5 flex items-center gap-1 text-xs font-bold"
          data-testid="floor-reward-received"
        >
          <GlyphIcon glyph="check" className="text-gold-deep size-3.5" />
          {tr("heynspire.panel.received")}
        </p>
      ) : null}
      <div
        className={cn("flex flex-wrap gap-1.5", won && "saturate-[0.7]")}
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
          className={cn(PLATE, "text-harbour-sky")}
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
            className="text-ready-gold size-4 -rotate-8"
          />
          {tr("sweep.campaign.earned", { count: win.campaignSweepTickets })}
        </p>
      </div>
    </Row>
  );
};

/** The icon of each Floor state, as the ribbons of the tower. */
const STATE_GLYPH = {
  current: "crossedSwords",
  won: "check",
  locked: "lock",
} as const satisfies Record<FloorState, string>;

/** The state chip of the header. */
const StateChip = ({ state }: { readonly state: FloorState }) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        CHIP,
        state === "current" &&
          "bg-ready-gold/45 text-ink-on-gold ring-gold-deep ring-1 ring-inset",
        state === "won" &&
          "bg-gold-deep text-cream ring-bronze-rim ring-1 ring-inset",
        state === "locked" && "text-cream"
      )}
      style={state === "locked" ? HEYNSPIRE_LOCK_CHIP : undefined}
      data-testid="floor-panel-state"
      data-state={state}
    >
      <GlyphIcon
        glyph={STATE_GLYPH[state]}
        className={cn("size-3", state === "won" && "text-ready-gold")}
      />
      {tr(`heynspire.panel.${state}`)}
    </span>
  );
};

/** The footer note of a Floor that has no Fight: won, climbed, or locked. */
const Note = ({
  glyph,
  children,
}: {
  readonly glyph: "check" | "lock" | "crown";
  readonly children: ReactNode;
}) => (
  <p
    className="border-parchment-rule bg-parchment-deep text-ink-soft flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-center text-sm font-bold [@media(max-height:500px)]:min-h-10 [@media(max-height:500px)]:text-xs"
    style={
      glyph === "lock"
        ? cssVars({ "--note-icon": HEYNSPIRE_LOCK_CHIP.backgroundColor ?? "" })
        : undefined
    }
    data-testid="floor-panel-note"
  >
    <GlyphIcon
      glyph={glyph}
      className={cn(
        "size-4 shrink-0",
        glyph === "lock" ? "text-(--note-icon)" : "text-gold-deep"
      )}
    />
    {children}
  </p>
);

/**
 * The Floor Panel (GDD 11.1): a parchment sheet docked at the right of the
 * Heynspire screen, open at all times. It shows the selected Floor: its
 * enemy Hero, its first win reward, and the Recommended level next to the
 * Player level. The Current Floor also has the Deck choice and one gold
 * Fight. A won Floor shows its reward as received, with no Fight: a won
 * Floor cannot be played again. A locked Floor shows which Floor to win
 * first. When the selection changes, the sheet inks in the new Floor.
 */
export const FloorPanel = ({
  floor,
  state,
  climbed,
  onStart,
}: {
  /** The selected Floor. */
  readonly floor: number;
  readonly state: FloorState;
  /** True after the win of Floor 50. */
  readonly climbed: boolean;
  readonly onStart: (options: BattleOptions) => void;
}) => {
  const { tr } = useGameText();
  const titleId = useId();
  const choice = useDeckChoice();
  const player = useAtomValue(battlePlayerAtom);
  const level = useAtomValue(playerLevelAtom);
  const [editing, setEditing] = useState(false);
  const definition = getFloor(floor);
  const { chosen, problem } = choice;
  // The top Floor after the climb: the panel says that the climb is done.
  const summit = climbed && floor === HEYNSPIRE_FLOORS;
  return (
    <aside
      aria-labelledby={titleId}
      className={cn(
        "border-frame-wood bg-parchment text-ink absolute top-[calc(max(0.5rem,env(safe-area-inset-top))+4.25rem)] right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(var(--town-bar)+8px)] flex w-[min(440px,38vw)] flex-col overflow-hidden rounded-2xl border-4",
        "[@media(max-height:500px)]:top-[calc(max(0.5rem,env(safe-area-inset-top))+2.75rem)] [@media(max-height:500px)]:right-[max(0.5rem,env(safe-area-inset-right))] [@media(max-height:500px)]:bottom-[calc(var(--town-bar)+4px)] [@media(max-height:500px)]:w-[min(460px,54vw)] [@media(max-height:500px)]:rounded-xl [@media(max-height:500px)]:border-[3px]"
      )}
      style={{ boxShadow: HEYNSPIRE_CSS.panelLift }}
      data-testid="floor-panel"
      data-floor={floor}
    >
      <div
        key={floor}
        className="flex min-h-0 flex-1 flex-col motion-safe:animate-[stage-panel-ink_220ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
      >
        <header className="border-parchment-rule border-b-2 px-5 pt-4 pb-3 [@media(max-height:500px)]:flex [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-3 [@media(max-height:500px)]:px-3.5 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-1.5">
          <h2
            id={titleId}
            className="font-display flex items-center gap-2 text-[1.875rem] leading-tight font-black tracking-[0.025em] [@media(max-height:500px)]:text-xl"
          >
            {tr("heynspire.floor", { number: floor })}
            {definition.boss ? (
              <span className="bg-blood-banner rounded-[4px] px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-[0.04em] text-white uppercase">
                {tr("battle.boss")}
              </span>
            ) : null}
          </h2>
          <p className="mt-1 [@media(max-height:500px)]:mt-0">
            <StateChip state={state} />
          </p>
        </header>
        <div className="divide-parchment-rule/70 min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain px-5 [@media(max-height:500px)]:px-3.5">
          <EnemyRow floor={floor} />
          <RewardRow floor={floor} won={state === "won"} />
          {state === "current" ? (
            <DeckRow choice={choice} onEdit={() => setEditing(true)} />
          ) : null}
        </div>
        <footer className="border-parchment-rule bg-parchment-deep/60 flex flex-col gap-2 border-t-2 px-5 pt-3 pb-4 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-3.5 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-2">
          <p
            className="text-ink-soft text-center text-xs font-semibold tabular-nums"
            data-testid="floor-level"
          >
            {tr("campaign.panel.level", {
              level: definition.recommendedLevel,
            })}
            {" · "}
            <span
              className={cn(
                level < definition.recommendedLevel && "text-blood-banner"
              )}
            >
              {tr("heynspire.panel.yourLevel", { level })}
            </span>
          </p>
          {state === "current" ? (
            <GameButton
              intent="gold"
              size="lg"
              className="font-display w-full tracking-[0.04em] [@media(max-height:500px)]:min-h-10"
              data-testid="floor-fight"
              isDisabled={chosen === undefined || problem !== undefined}
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
          ) : null}
          {state === "won" ? (
            <Note glyph={summit ? "crown" : "check"}>
              {tr(summit ? "heynspire.climbed" : "heynspire.panel.wonNote")}
            </Note>
          ) : null}
          {state === "locked" ? (
            <Note glyph="lock">
              {tr("heynspire.winFirst", { number: floor - 1 })}
            </Note>
          ) : null}
        </footer>
      </div>
      <DeckDialog isOpen={editing} onOpenChange={setEditing} />
    </aside>
  );
};
