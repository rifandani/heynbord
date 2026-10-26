import type { DungeonBoss } from "@workspace/rules";
import { DUNGEON_LANES } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useId, useRef } from "react";
import { mergeProps, useFocusWithin, useHover } from "react-aria";
import { Button } from "react-aria-components";

import { cardText } from "@/features/battle/card-text";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import {
  PEEK_BUTTON,
  useRewardPeek,
} from "@/features/campaign/components/reward-peek";
import type { Peek } from "@/features/deck/components/use-card-peek";
import { classText } from "@/features/deck/deck";
import {
  cssVars,
  DUNGEON_COLORS,
  DUNGEON_CSS,
} from "@/features/dungeons/tokens";

type Translate = ReturnType<typeof useGameText>["tr"];
type BossRule = DungeonBoss["bossRules"][number];
type StartUnitDefinition = DungeonBoss["startUnits"][number];

/**
 * The pin of a Boss: its number in the Boss order, on a round red tack. The
 * Dungeon Panel numbers the Bosses in the order in which they stand on the
 * painting, from the left, so the dossier joins the Boss by the number.
 */
const BossPin = ({
  number,
  className,
}: {
  readonly number: number;
  readonly className?: string;
}) => (
  <span
    className={cn(
      "bg-enemy-deep text-cream grid shrink-0 place-items-center rounded-full border-2 leading-none font-black tabular-nums",
      className
    )}
    style={{
      borderColor: DUNGEON_COLORS.pinEdge,
      boxShadow: DUNGEON_CSS.pinDrop,
    }}
    aria-hidden
    data-testid="boss-pin"
  >
    {number}
  </span>
);

/** "At 50% HP: Summon Mesa Pit Fighter (Rare) in Lane 2." */
const useRuleText = () => {
  const { tr, text } = useGameText();
  return (rule: BossRule): string => {
    const { effect } = rule;
    let detail: string;
    switch (effect.type) {
      case "countdown": {
        detail = tr("battle.bossRule.countdownDetail", {
          amount: effect.amount,
          cards: effect.cards,
        });
        break;
      }
      case "draw": {
        detail = tr("battle.bossRule.drawDetail", { cards: effect.cards });
        break;
      }
      case "summon": {
        detail = tr("dungeons.boss.summon", {
          name: text(cardText(effect.cardId, effect.rank).name),
          rank: tr(`ranks.${effect.rank}`),
          lane: effect.lane + 1,
        });
        break;
      }
      default: {
        return effect satisfies never;
      }
    }
    return tr("dungeons.boss.rule", {
      at: tr("battle.bossPlate.ruleAt", { threshold: rule.threshold }),
      effect: detail,
    });
  };
};

/** "Holds Lanes 1, 2" or "Holds Lane 3", as the Boss plate of the Battle says it. */
const holdsText = (tr: Translate, front: readonly number[]): string =>
  front.length === 1
    ? tr("battle.bossPlate.holdsLane", { lane: (front[0] ?? 0) + 1 })
    : tr("battle.bossPlate.holdsLanes", {
        lanes: front.map((lane) => lane + 1).join(", "),
      });

/**
 * The Lanes of a Boss, in the order of the board: one cell for each Lane, Lane
 * 1 at the left, the cells of its Front in the enemy red.
 */
const LaneCells = ({ front }: { readonly front: readonly number[] }) => (
  <span
    className="flex h-2.5 w-11 shrink-0 gap-[2px]"
    aria-hidden
    data-testid="dossier-lane-cells"
  >
    {Array.from({ length: DUNGEON_LANES }, (_, lane) => {
      const held = front.includes(lane);
      return (
        <span
          key={lane}
          className={cn("flex-1 rounded-t-full", held && "bg-enemy-red")}
          style={
            held
              ? { boxShadow: DUNGEON_CSS.laneHeld }
              : {
                  backgroundColor: DUNGEON_COLORS.laneEmpty,
                  boxShadow: DUNGEON_CSS.laneEmpty,
                }
          }
          data-held={held || undefined}
        />
      );
    })}
  </span>
);

/**
 * The HP of a Boss at the start, with a notch at each Boss Rule threshold, as
 * the Boss plate of the Battle shows it (ADR-0038). The Player learns the
 * notch here and sees it again in the Battle.
 */
const HpBar = ({ boss }: { readonly boss: DungeonBoss }) => {
  const { tr } = useGameText();
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-ink flex items-center gap-1 text-sm leading-none font-black tabular-nums"
        style={cssVars({ "--heart": DUNGEON_COLORS.heart })}
      >
        <GlyphIcon glyph="heart" className="size-3.5 text-(--heart)" />
        {boss.heroHp}
      </span>
      <span className="relative h-2 min-w-10 flex-1" aria-hidden>
        <span
          className="bg-plate-socket absolute inset-0 overflow-hidden rounded-full"
          style={{ boxShadow: DUNGEON_CSS.grooveInset }}
        >
          <span
            className="block h-full w-full rounded-full"
            style={{ backgroundImage: DUNGEON_CSS.hp }}
          />
        </span>
        {boss.bossRules.map((rule) => (
          <span
            key={`${rule.threshold}:${rule.effect.type}`}
            className="bg-cream absolute top-[-3px] bottom-[-3px] w-[3px] -translate-x-1/2 rounded-[1px]"
            style={{
              left: `${rule.threshold}%`,
              boxShadow: DUNGEON_CSS.notch,
            }}
            title={tr("battle.bossPlate.notch", { threshold: rule.threshold })}
            data-testid="dossier-notch"
          />
        ))}
      </span>
    </div>
  );
};

/** The stamp of a won Dungeon: the bounty of the Boss is claimed. */
export const ClaimedStamp = ({
  stamped,
  className,
  style,
}: {
  /** True one time, after a new win: the stamp lands at the feet of the Boss. */
  readonly stamped: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "bg-blood-banner pointer-events-none inline-flex items-center gap-1 rounded-[4px] border-2 border-(--claimed-edge) px-1.5 py-0.5 leading-none font-bold tracking-[0.04em] whitespace-nowrap text-white uppercase",
        stamped &&
          "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
        className
      )}
      style={{
        boxShadow: DUNGEON_CSS.plate2Faint,
        ...cssVars({ "--claimed-edge": DUNGEON_COLORS.claimedEdge }),
        ...style,
      }}
      data-testid="boss-claimed"
    >
      <GlyphIcon glyph="check" className="size-[1.1em] shrink-0" />
      <span className="truncate">{tr("dungeons.boss.claimed")}</span>
    </span>
  );
};

/**
 * A Unit at the start of the Battle, as a small red token with its name.
 * Hover, keyboard focus or a long press shows its Card Details.
 */
const StartUnit = ({
  unit,
  details,
  bind,
}: {
  readonly unit: StartUnitDefinition;
  readonly details: ReturnType<typeof useRewardPeek>["details"];
  readonly bind: ReturnType<typeof useRewardPeek>["bind"];
}) => {
  const { tr } = useGameText();
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = {
    cardId: unit.cardId,
    rank: unit.rank,
    from: "dungeons",
    place: `${unit.lane}:${unit.position}`,
  };
  const words = {
    name: tr(`cards.${unit.cardId}.name`),
    rank: tr(`ranks.${unit.rank}`),
    lane: unit.lane + 1,
  };
  return (
    <li>
      <Button
        ref={trigger}
        {...bind(target)}
        aria-label={tr("dungeons.dossier.startUnitLabel", words)}
        className={cn(
          PEEK_BUTTON,
          "text-ink data-[hovered]:bg-ink/8 -mx-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs leading-snug font-bold"
        )}
        data-testid="dossier-start-unit"
      >
        <span
          className="border-enemy-deep bg-enemy-red size-2.5 shrink-0 rounded-full border"
          aria-hidden
        />
        {tr("dungeons.dossier.startUnit", words)}
      </Button>
      {details(target, trigger)}
    </li>
  );
};

/**
 * The dossier of one Boss in the Dungeon Panel (GDD 8.4): the pin of the
 * Boss, its Class seal in the place of a portrait, its name, Class and wanted
 * line, its Hero HP with the Boss Rule notch, its Boss Rules, the Lanes of its
 * Front, and its Units at the start. The dossier takes the focus, so that the
 * keyboard also lights the Boss on the painting.
 */
export const BossDossier = ({
  dungeonId,
  boss,
  index,
  active,
  onActive,
}: {
  readonly dungeonId: string;
  readonly boss: DungeonBoss;
  /** The place of the Boss in the Boss order, from 0. */
  readonly index: number;
  readonly active: boolean;
  readonly onActive: (active: boolean) => void;
}) => {
  const { tr, text } = useGameText();
  const ruleText = useRuleText();
  const nameId = useId();
  const { bind, details } = useRewardPeek({
    placement: "left",
    testId: "dossier-unit-peek",
  });
  const { hoverProps } = useHover({ onHoverChange: onActive });
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: onActive,
  });
  return (
    <article
      {...mergeProps(hoverProps, focusWithinProps)}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the dossier takes the focus so that the keyboard lights the Boss on the painting, as a Balance takes the focus for its tooltip
      tabIndex={0}
      aria-labelledby={nameId}
      aria-describedby={`${nameId}-facts`}
      className={cn(
        "-mx-2 rounded-lg px-2 py-2 transition-[background-color,box-shadow] duration-150 outline-none",
        "focus-visible:ring-focus-cream focus-visible:ring-4",
        active && "bg-parchment-lit"
      )}
      style={active ? { boxShadow: DUNGEON_CSS.dossierActive } : undefined}
      data-testid={`dossier-${index}`}
      data-active={active || undefined}
      data-lanes={boss.front.map((lane) => lane + 1).join(",")}
    >
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 shrink-0">
          <span
            className="border-bronze-rim text-ink grid size-9 place-items-center rounded-full border-2 [@media(max-height:500px)]:size-7"
            style={{
              backgroundImage: DUNGEON_CSS.sealBone,
              boxShadow: DUNGEON_CSS.plate2Soft,
            }}
            aria-hidden
          >
            <GlyphIcon
              glyph={classGlyph(boss.classId)}
              className="size-5 [@media(max-height:500px)]:size-4"
            />
          </span>
          <BossPin
            number={index + 1}
            className="absolute -top-1.5 -left-1.5 size-4.5 text-[10px]"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id={nameId}
            className="font-display text-base leading-tight font-bold [@media(max-height:500px)]:text-sm"
          >
            {tr(`dungeons.${dungeonId}.bosses.${boss.id}`)}
          </h3>
          <p className="text-ink-soft text-xs font-semibold">
            {text(classText(boss.classId))}
            <span className="text-ink-faded font-normal italic [@media(max-height:500px)]:hidden">
              {" · "}
              {tr(`dungeons.${dungeonId}.wanted.${boss.id}`)}
            </span>
          </p>
        </div>
      </div>
      <div
        id={`${nameId}-facts`}
        className="mt-1.5 flex min-w-0 flex-col gap-1.5 pl-[2.875rem] [@media(max-height:500px)]:pl-0"
      >
        <span className="sr-only">
          {tr("dungeons.boss.hp", { hp: boss.heroHp })}
        </span>
        <HpBar boss={boss} />
        <ul className="flex flex-col gap-1">
          {boss.bossRules.map((rule) => (
            <li
              key={`${rule.threshold}:${rule.effect.type}`}
              className="flex items-start gap-1.5 text-xs leading-snug"
              data-testid="dossier-rule"
            >
              <GlyphIcon
                glyph="crown"
                className="mt-px size-3.5 shrink-0 text-(--boss-glyph)"
              />
              <span>{ruleText(rule)}</span>
            </li>
          ))}
        </ul>
        <p
          className="text-ink-soft flex items-center gap-2 text-xs font-bold"
          style={cssVars({ "--boss-glyph": DUNGEON_COLORS.bossGlyph })}
          data-testid="dossier-lanes"
        >
          <LaneCells front={boss.front} />
          {holdsText(tr, boss.front)}
        </p>
        {boss.startUnits.length > 0 ? (
          <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <p className="text-ink-soft font-bold">
              {tr("dungeons.dossier.atStart")}
            </p>
            <ul className="flex flex-col">
              {boss.startUnits.map((unit) => (
                <StartUnit
                  key={`${unit.lane}:${unit.position}`}
                  unit={unit}
                  details={details}
                  bind={bind}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
};
