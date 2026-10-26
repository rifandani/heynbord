import { useAtomValue } from "@effect/atom-react";
import type { BattleEvent, RankId, Target } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useState } from "react";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameTooltip } from "@/core/components/game/game-tooltip";
import { SIDE_COLORS } from "@/core/components/game/tokens";
import { enemyNameRef } from "@/features/battle/battle-content";
import type {
  BossRuleEffectView,
  BossRuleView,
  HandCardView,
  HeroView,
} from "@/features/battle/battle-view";
import { isDefeated } from "@/features/battle/battle-view";
import { shownSessionAtom } from "@/features/battle/battle.atoms";
import { cardText } from "@/features/battle/card-text";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { countdownLabel } from "@/features/battle/components/hand-card";
import { classGlyph } from "@/features/battle/glyphs";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";

type Battle = ReturnType<typeof useBattle>;
type Translate = ReturnType<typeof useGameText>["tr"];
type CardName = (cardId: string, rank: RankId) => string;

const ENEMY = SIDE_COLORS.enemy;

/** "1, 2" from Lane indexes. */
const laneNumbers = (front: readonly number[]): string =>
  front.map((lane) => lane + 1).join(", ");

/** "Holds Lanes 1, 2", "Holds Lane 3", or "Holds no Lane". */
const holdsText = (tr: Translate, front: readonly number[]): string => {
  if (front.length === 0) {
    return tr("battle.bossPlate.holdsNoLane");
  }
  return front.length === 1
    ? tr("battle.bossPlate.holdsLane", { lane: (front[0] ?? 0) + 1 })
    : tr("battle.bossPlate.holdsLanes", { lanes: laneNumbers(front) });
};

/** The short name of a Boss Rule effect, for its label: "Draw 2". */
const effectShort = (
  effect: BossRuleEffectView,
  tr: Translate,
  cardName: CardName
): string => {
  switch (effect.type) {
    case "countdown": {
      return tr("battle.bossRule.countdown", { amount: effect.amount });
    }
    case "summon": {
      return tr("battle.bossRule.summon", {
        name: cardName(effect.cardId, effect.rank),
      });
    }
    case "draw": {
      return tr("battle.bossRule.draw", { cards: effect.cards });
    }
    default: {
      return effect satisfies never;
    }
  }
};

/** The full text of a Boss Rule effect, for the Boss details. */
const effectDetail = (
  effect: BossRuleEffectView,
  tr: Translate,
  cardName: CardName
): string => {
  switch (effect.type) {
    case "countdown": {
      return tr("battle.bossRule.countdownDetail", {
        amount: effect.amount,
        cards: effect.cards,
      });
    }
    case "draw": {
      return tr("battle.bossRule.drawDetail", { cards: effect.cards });
    }
    default: {
      return effectShort(effect, tr, cardName);
    }
  }
};

const useCardName = (): CardName => {
  const { text } = useGameText();
  return (cardId, rank) => text(cardText(cardId, rank).name);
};

/**
 * The 4-row Lane strip of a Boss plate: one cell for each Lane of the Board,
 * from Lane 1 (the far Lane, at the top) down. The cells of the Front of the
 * Boss are full. So the plate points to its Lanes by shape, as the Board
 * shows them, and not by color only.
 */
const LaneStrip = ({
  front,
  lanes,
}: {
  readonly front: readonly number[];
  readonly lanes: number;
}) => (
  <span
    className="flex w-2 shrink-0 flex-col gap-[3px] self-stretch py-0.5 [@media(max-height:500px)]:w-1.5 [@media(max-height:500px)]:gap-[2px]"
    aria-hidden
    data-testid="lane-strip"
  >
    {Array.from({ length: lanes }, (_, lane) => {
      const held = front.includes(lane);
      return (
        <span
          key={lane}
          className={cn(
            "min-h-1 flex-1 rounded-[2px] transition-colors duration-300",
            held
              ? "bg-[#d9463b] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
              : "bg-[#3a2a1c] ring-1 ring-[#e8d9bb]/25 ring-inset"
          )}
          data-held={held || undefined}
        />
      );
    })}
  </span>
);

/** One threshold notch on the HP bar. It breaks when its Boss Rule activates. */
const Notch = ({
  rule,
  breaking,
}: {
  readonly rule: BossRuleView;
  readonly breaking: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "absolute top-[-3px] bottom-[-3px] w-[3px] -translate-x-1/2 rounded-[1px]",
        rule.activated
          ? "bg-[#e8d9bb]/40"
          : "bg-[#fff6df] shadow-[0_0_0_1px_rgba(28,20,14,0.85)]",
        breaking &&
          "animate-[boss-notch_var(--event-ms)_ease-out_both] motion-reduce:animate-none"
      )}
      style={{ left: `${rule.threshold}%` }}
      title={tr("battle.bossPlate.notch", { threshold: rule.threshold })}
      data-testid="boss-notch"
      data-used={rule.activated || undefined}
    />
  );
};

/** The HP bar of a Boss, with a notch at each Boss Rule threshold (ADR-0038). */
const BossHp = ({
  hero,
  breaking,
}: {
  readonly hero: HeroView;
  readonly breaking: number | null;
}) => {
  const percent = Math.max(0, Math.min(100, (hero.hp / hero.maxHp) * 100));
  return (
    <div className="flex items-center gap-1.5 [@media(max-height:500px)]:gap-1">
      <div className="relative h-2.5 min-w-6 flex-1 [@media(max-height:500px)]:h-2">
        <div className="absolute inset-0 overflow-hidden rounded-full bg-black/60 ring-1 ring-white/20">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              percent <= 30 ? "bg-[#ef4444]" : "bg-[#4ade80]"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        {hero.bossRules.map((rule, index) => (
          <Notch
            // oxlint-disable-next-line react/no-array-index-key react-doctor/no-array-index-as-key -- the Boss Rules of a Boss never change order; the index is the rule index of `BossRuleActivated`.
            key={index}
            rule={rule}
            breaking={breaking === index}
          />
        ))}
      </div>
      <span className="text-sm leading-none font-black whitespace-nowrap text-[#fff6df] tabular-nums [@media(max-height:500px)]:text-xs">
        {hero.hp}
        <span className="text-xs font-medium text-[#e8d9bb] [@media(max-height:500px)]:text-[10px]">
          /{hero.maxHp}
        </span>
      </span>
    </div>
  );
};

/** The Hand of one Boss: only the Countdowns show (GDD 11.2). */
const BossHand = ({ hand }: { readonly hand: readonly HandCardView[] }) => {
  const { tr } = useGameText();
  return (
    <ol
      aria-label={tr("battle.enemyHand")}
      className="flex flex-wrap justify-end gap-[3px]"
      data-testid="boss-hand"
    >
      {hand.map((card) => (
        <li
          key={card.instanceId}
          className={cn(
            "flex h-6 w-[18px] items-center justify-center rounded-[3px] border text-[11px] leading-none font-bold tabular-nums [@media(max-height:500px)]:h-5 [@media(max-height:500px)]:w-4 [@media(max-height:500px)]:text-[10px]",
            card.countdown === 0
              ? "border-[#ffd75a] bg-[#5b1f1a] text-[#ffd75a]"
              : "border-[#e8d9bb]/40 bg-[#3a2a1c] text-[#fff6df]"
          )}
          aria-label={countdownLabel(tr, card.countdown)}
        >
          {card.countdown}
        </li>
      ))}
    </ol>
  );
};

/** The Defeated seal: it takes the place of the Hand of a Defeated Boss. */
const DefeatedSeal = () => {
  const { tr } = useGameText();
  return (
    <span className="inline-flex items-center gap-1 self-end rounded-[4px] bg-[#8e1f1f] px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-[0.04em] text-white uppercase">
      <GlyphIcon glyph="skull" className="size-3" />
      {tr("battle.bossPlate.defeated")}
    </span>
  );
};

/**
 * The label of a Boss Rule that activates now. It comes out of the bottom of
 * the plate, holds while the Player reads it, and goes before the effect
 * plays. It shows over the top edge of the Board for the time of one event.
 */
const RuleLabel = ({
  rule,
  name,
}: {
  readonly rule: BossRuleView;
  readonly name: string;
}) => {
  const { tr } = useGameText();
  const cardName = useCardName();
  return (
    <span
      className="pointer-events-none absolute top-full right-1 z-10 mt-2 flex animate-[boss-rule-label_var(--event-ms)_cubic-bezier(0.2,0.8,0.2,1)_both] items-center gap-1.5 rounded-lg border-2 border-[#e9c46a] bg-[#1c140e]/95 py-1 pr-2.5 pl-1.5 text-xs leading-tight font-bold whitespace-nowrap text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] motion-reduce:animate-[cast-fade-in_var(--event-ms)_linear_both]"
      aria-hidden
      data-testid="boss-rule-label"
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]">
        <GlyphIcon glyph="crown" className="size-3" />
      </span>
      <span>
        <span className="sr-only">{name}: </span>
        {effectShort(rule.effect, tr, cardName)}
      </span>
      <span className="font-medium text-[#e8d9bb] tabular-nums">
        {rule.threshold}%
      </span>
    </span>
  );
};

/** The Boss details: its Front, its HP and its Boss Rules (hover, focus or a tap). */
const BossDetails = ({
  hero,
  name,
}: {
  readonly hero: HeroView;
  readonly name: string;
}) => {
  const { tr } = useGameText();
  const cardName = useCardName();
  return (
    <>
      <p className="font-display text-sm leading-tight font-bold">{name}</p>
      <p className="mt-0.5 text-xs text-[#e8d9bb]">
        {tr(`classes.${hero.classId}`)} ·{" "}
        {isDefeated(hero)
          ? tr("battle.bossPlate.defeated")
          : holdsText(tr, hero.front)}
      </p>
      <p className="mt-2 text-[11px] font-bold tracking-[0.04em] text-[#e9c46a] uppercase">
        {tr("battle.bossPlate.rules")}
      </p>
      {hero.bossRules.length === 0 ? (
        <p className="text-xs text-[#e8d9bb]">
          {tr("battle.bossPlate.noRules")}
        </p>
      ) : (
        <ul className="mt-0.5 flex flex-col gap-1 text-xs">
          {hero.bossRules.map((rule, index) => (
            <li
              // oxlint-disable-next-line react/no-array-index-key react-doctor/no-array-index-as-key -- the Boss Rules of a Boss never change order.
              key={index}
              className={cn(
                "flex items-baseline gap-2",
                rule.activated && "text-[#e8d9bb]/70"
              )}
            >
              <span className="w-[4.5rem] shrink-0 font-bold tabular-nums">
                {tr("battle.bossPlate.ruleAt", { threshold: rule.threshold })}
              </span>
              <span className={cn(rule.activated && "line-through")}>
                {effectDetail(rule.effect, tr, cardName)}
              </span>
              {rule.activated ? (
                <span className="ml-auto inline-flex items-center gap-0.5 font-semibold text-[#e9c46a] no-underline">
                  <GlyphIcon glyph="check" className="size-3" />
                  {tr("battle.bossPlate.ruleUsed")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/** The Boss Rule that activates now for the Boss `hero`, or `null`. */
const activatingRule = (
  event: BattleEvent | null | undefined,
  hero: number
): number | null =>
  event?._tag === "BossRuleActivated" &&
  event.hero.side === "enemy" &&
  event.hero.hero === hero
    ? event.rule
    : null;

interface BossPlateProps {
  readonly battle: Battle;
  readonly hero: HeroView;
  readonly index: number;
  readonly lanes: number;
  readonly name: string;
  /** True in the enemy Turn: the plate of a Boss that is not Defeated glows. */
  readonly active: boolean;
  /** The Hero target of this Boss while a card is selected, or `undefined`. */
  readonly target: Target | undefined;
  /** True when the keyboard focuses the Hero target of this Boss. */
  readonly focused: boolean;
  readonly event: BattleEvent | null | undefined;
}

/**
 * One Boss in the Top Bar (GDD 11.2): its Lane strip, name, HP with the Boss
 * Rule notches, and its Hand of Countdowns. A Defeated Boss keeps its place,
 * so that the row does not move. While a Skill Card that targets an enemy
 * Hero is selected, a press on the plate plays the card at this Boss, as the
 * marker at its Front does.
 */
const BossPlate = ({
  battle,
  hero,
  index,
  lanes,
  name,
  active,
  target,
  focused,
  event,
}: BossPlateProps) => {
  const { tr } = useGameText();
  const [open, setOpen] = useState(false);
  const defeated = isDefeated(hero);
  const breaking = activatingRule(event, index);
  const rule = breaking === null ? undefined : hero.bossRules[breaking];
  const label = defeated
    ? tr("battle.bossPlate.labelDefeated", { name })
    : tr("battle.bossPlate.label", {
        name,
        className: tr(`classes.${hero.classId}`),
        hp: hero.hp,
        maxHp: hero.maxHp,
        lanes: holdsText(tr, hero.front),
      });
  return (
    <TooltipTrigger
      isOpen={open && target === undefined}
      onOpenChange={setOpen}
      delay={250}
      shouldCloseOnPress={false}
    >
      <Button
        aria-label={
          target
            ? `${tr("battle.bossPlate.target", { name })}. ${label}`
            : label
        }
        onPress={(press) => {
          if (target) {
            battle.play(target);
          } else if (press.pointerType !== "mouse") {
            setOpen(!open);
          }
        }}
        className={cn(
          "group/boss relative flex w-full min-w-0 items-stretch gap-1.5 rounded-xl border-2 bg-[#1c140e]/85 p-1.5 text-left backdrop-blur-sm transition-[box-shadow,opacity,filter] duration-300 outline-none [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:p-1",
          "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          active && !defeated
            ? "shadow-[0_0_14px_2px_rgba(255,215,90,0.6)]"
            : "shadow-[0_3px_0_rgba(0,0,0,0.45)]",
          defeated && "saturate-[0.35]",
          target &&
            "cursor-pointer ring-2 ring-[#ffd24a] motion-safe:animate-[boss-target_1.2s_ease-in-out_infinite]",
          focused && "ring-4 ring-[#fff2a8]",
          rule && "animate-[boss-rule-flash_var(--event-ms)_ease-out_both]"
        )}
        style={{ borderColor: ENEMY.main }}
        data-testid={`boss-${index}`}
        data-defeated={defeated || undefined}
        data-targetable={target ? true : undefined}
        data-focused={focused || undefined}
      >
        <LaneStrip front={defeated ? [] : hero.front} lanes={lanes} />
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <span className="truncate text-right text-sm leading-tight font-semibold text-[#fff6df] [@media(max-height:500px)]:text-xs">
            {name}
          </span>
          {defeated ? null : <BossHp hero={hero} breaking={breaking} />}
          {defeated ? <DefeatedSeal /> : <BossHand hand={hero.hand} />}
        </span>
        <span
          className="flex size-10 shrink-0 items-center justify-center self-start rounded-lg text-[#fff6df] [@media(max-height:500px)]:size-7"
          style={{
            background: ENEMY.dark,
          }}
          aria-hidden
        >
          <GlyphIcon
            glyph={classGlyph(hero.classId)}
            className="size-6 [@media(max-height:500px)]:size-4"
          />
        </span>
        {rule ? <RuleLabel rule={rule} name={name} /> : null}
      </Button>
      <GameTooltip
        placement="left"
        offset={8}
        className="w-[min(18rem,80vw)] rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/95 px-3 py-2 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]"
        data-testid="boss-details"
      >
        <BossDetails hero={hero} name={name} />
      </GameTooltip>
    </TooltipTrigger>
  );
};

/** The Hero target of the Boss `hero` among the legal targets, or `undefined`. */
const heroTarget = (
  targets: readonly Target[],
  hero: number
): Target | undefined =>
  targets.find(
    (target) =>
      target._tag === "Hero" && target.side === "enemy" && target.hero === hero
  );

/**
 * The enemy Bosses of a Dungeon in the Top Bar, in Lane order (GDD 11.2): one
 * plate for each Boss. A screen reader hears each Boss Rule when it activates.
 */
export const BossPlates = ({ battle }: { readonly battle: Battle }) => {
  const { tr, text } = useGameText();
  const cardName = useCardName();
  const session = useAtomValue(shownSessionAtom);
  if (!session) {
    return null;
  }
  const { view, current, options } = session;
  const { heroes } = view.sides.enemy;
  const event = current?.event;
  const focusedTarget = battle.targets[battle.focused];
  const names = heroes.map((_, hero) => text(enemyNameRef(options, hero)));
  const activated =
    event?._tag === "BossRuleActivated"
      ? heroes[event.hero.hero]?.bossRules[event.rule]
      : undefined;
  // SAFETY: a CSS custom property for the keyframes of the current event.
  // React's `CSSProperties` does not model custom properties.
  const style = {
    "--event-ms": `${current?.duration ?? 0}ms`,
  } as CSSProperties;
  return (
    <div className="min-w-0" style={style}>
      <ol
        aria-label={tr("battle.bosses")}
        className="flex min-w-0 flex-col items-end gap-1"
        data-testid="boss-plates"
        data-count={heroes.length}
      >
        {heroes.map((hero, index) => {
          const target = heroTarget(battle.targets, index);
          return (
            <li
              // oxlint-disable-next-line react/no-array-index-key react-doctor/no-array-index-as-key -- a Boss is its index in the Side; the list never changes order.
              key={index}
              className="relative w-[clamp(9rem,18vw,14rem)] min-w-0 [@media(max-height:500px)]:w-[clamp(9.5rem,18vw,11rem)]"
              // A Boss Rule label comes out of the bottom of its plate: it
              // shows over the plates below it.
              style={{ zIndex: heroes.length - index }}
            >
              <BossPlate
                battle={battle}
                hero={hero}
                index={index}
                lanes={view.lanes}
                name={names[index] ?? ""}
                active={view.activeSide === "enemy"}
                target={target}
                focused={target !== undefined && focusedTarget === target}
                event={event}
              />
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {activated && event?._tag === "BossRuleActivated"
          ? tr("battle.bossPlate.activated", {
              name: names[event.hero.hero] ?? "",
              effect: effectShort(activated.effect, tr, cardName),
            })
          : null}
      </p>
    </div>
  );
};
