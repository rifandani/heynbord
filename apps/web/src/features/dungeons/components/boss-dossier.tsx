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
      "grid shrink-0 place-items-center rounded-full border-2 border-[#4a0f0b] bg-[radial-gradient(circle_at_35%_30%,#f07a6f,#b8322a_70%)] leading-none font-black text-[#fff6df] tabular-nums shadow-[0_2px_0_rgba(0,0,0,0.4)]",
      className
    )}
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
          className={cn(
            "flex-1 rounded-t-full",
            held
              ? "bg-[#d9463b] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
              : "bg-[#d8c49c] ring-1 ring-[#8a6a44]/40 ring-inset"
          )}
          data-held={held || undefined}
        />
      );
    })}
  </span>
);

/**
 * The HP of a Boss at the start, with a notch at each Boss Rule threshold, as
 * the Boss plate of the Battle shows it (ADR-0040). The Player learns the
 * notch here and sees it again in the Battle.
 */
const HpBar = ({ boss }: { readonly boss: DungeonBoss }) => {
  const { tr } = useGameText();
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-sm leading-none font-black text-[#2a1d12] tabular-nums">
        <GlyphIcon glyph="heart" className="size-3.5 text-[#c2362f]" />
        {boss.heroHp}
      </span>
      <span className="relative h-2 min-w-10 flex-1" aria-hidden>
        <span className="absolute inset-0 overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
          <span className="block h-full w-full rounded-full bg-gradient-to-b from-[#7ee6a0] to-[#2f9e5b]" />
        </span>
        {boss.bossRules.map((rule) => (
          <span
            key={`${rule.threshold}:${rule.effect.type}`}
            className="absolute top-[-3px] bottom-[-3px] w-[3px] -translate-x-1/2 rounded-[1px] bg-[#fff6df] shadow-[0_0_0_1px_rgba(28,20,14,0.9)]"
            style={{ left: `${rule.threshold}%` }}
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
        "pointer-events-none inline-flex items-center gap-1 rounded-[4px] border-2 border-[#5c1010] bg-[#8e1f1f] px-1.5 py-0.5 leading-none font-bold tracking-[0.04em] whitespace-nowrap text-white uppercase shadow-[0_2px_0_rgba(0,0,0,0.35)]",
        stamped &&
          "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
        className
      )}
      style={style}
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
          "-mx-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-xs leading-snug font-bold text-[#2a1d12] data-[hovered]:bg-[#2a1d12]/8"
        )}
        data-testid="dossier-start-unit"
      >
        <span
          className="size-2.5 shrink-0 rounded-full border border-[#6b1610] bg-[#d9463b]"
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
        "focus-visible:ring-4 focus-visible:ring-[#fff2a8]",
        active && "bg-[#fff3d1] shadow-[0_0_0_2px_rgba(226,169,59,0.6)]"
      )}
      data-testid={`dossier-${index}`}
      data-active={active || undefined}
      data-lanes={boss.front.map((lane) => lane + 1).join(",")}
    >
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 shrink-0">
          <span
            className="grid size-9 place-items-center rounded-full border-2 border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#fff3d1,#e3cfa6_70%)] text-[#2a1d12] shadow-[0_2px_0_rgba(0,0,0,0.3)] [@media(max-height:500px)]:size-7"
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
          <p className="text-xs font-semibold text-[#5b4632]">
            {text(classText(boss.classId))}
            <span className="font-normal text-[#6b5238] italic [@media(max-height:500px)]:hidden">
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
                className="mt-px size-3.5 shrink-0 text-[#a8741a]"
              />
              <span>{ruleText(rule)}</span>
            </li>
          ))}
        </ul>
        <p
          className="flex items-center gap-2 text-xs font-bold text-[#5b4632]"
          data-testid="dossier-lanes"
        >
          <LaneCells front={boss.front} />
          {holdsText(tr, boss.front)}
        </p>
        {boss.startUnits.length > 0 ? (
          <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <p className="font-bold text-[#5b4632]">
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
