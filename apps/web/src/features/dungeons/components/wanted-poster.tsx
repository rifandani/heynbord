import type { DungeonBoss } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";
import { useId } from "react";
import { mergeProps, useFocusWithin, useHover } from "react-aria";

import { cardText } from "@/features/battle/card-text";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { classText } from "@/features/deck/deck";

type Translate = ReturnType<typeof useGameText>["tr"];
type BossRule = DungeonBoss["bossRules"][number];

/**
 * The pin of a Boss: its number in the Boss order, on a round red tack. The
 * poster and its Front Bracket carry the same pin, so the eye joins them by
 * the number, not by the color.
 */
export const BossPin = ({
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
        detail = tr("dungeons.poster.summon", {
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
    return tr("dungeons.poster.rule", {
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
 * The Lanes of a Boss as the Boss plate of the Battle draws them: one cell
 * for each Lane, Lane 1 at the top, the cells of its Front in the enemy red.
 */
const LaneCells = ({
  front,
  lanes,
}: {
  readonly front: readonly number[];
  readonly lanes: number;
}) => (
  <span
    className="flex w-2 shrink-0 flex-col gap-[2px] self-stretch"
    aria-hidden
    data-testid="poster-lane-cells"
  >
    {Array.from({ length: lanes }, (_, lane) => {
      const held = front.includes(lane);
      return (
        <span
          key={lane}
          className={cn(
            "min-h-1 flex-1 rounded-[2px]",
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
      <span className="flex items-center gap-1 text-base leading-none font-black text-[#2a1d12] tabular-nums [@media(max-height:500px)]:text-sm">
        <GlyphIcon glyph="heart" className="size-4 text-[#c2362f]" />
        {boss.heroHp}
      </span>
      <span className="relative h-2.5 min-w-10 flex-1" aria-hidden>
        <span className="absolute inset-0 overflow-hidden rounded-full bg-[#3a2a1c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
          <span className="block h-full w-full rounded-full bg-gradient-to-b from-[#7ee6a0] to-[#2f9e5b]" />
        </span>
        {boss.bossRules.map((rule) => (
          <span
            key={`${rule.threshold}:${rule.effect.type}`}
            className="absolute top-[-3px] bottom-[-3px] w-[3px] -translate-x-1/2 rounded-[1px] bg-[#fff6df] shadow-[0_0_0_1px_rgba(28,20,14,0.9)]"
            style={{ left: `${rule.threshold}%` }}
            title={tr("battle.bossPlate.notch", { threshold: rule.threshold })}
            data-testid="poster-notch"
          />
        ))}
      </span>
    </div>
  );
};

/** The stamp of a won Dungeon: the bounty of the poster is claimed. */
const ClaimedStamp = ({
  className,
  style,
}: {
  readonly className?: string;
  readonly style?: CSSProperties;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "pointer-events-none inline-flex items-center gap-1 rounded-[4px] border-2 border-[#5c1010] bg-[#8e1f1f] px-1.5 py-0.5 text-[11px] leading-none font-bold tracking-[0.04em] whitespace-nowrap text-white uppercase shadow-[0_2px_0_rgba(0,0,0,0.35)]",
        "motion-safe:animate-[pack-stamp_380ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
        className
      )}
      style={style}
      data-testid="poster-claimed"
    >
      <GlyphIcon glyph="check" className="size-3" />
      {tr("dungeons.poster.claimed")}
    </span>
  );
};

/** Bronze tacks at the top corners of a poster, as on the card metal. */
const Tack = ({ className }: { readonly className: string }) => (
  <span
    className={cn(
      "absolute top-1.5 size-2.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#f7dc9c,#c99442_55%,#8a5a20)] shadow-[0_1px_0_rgba(0,0,0,0.45)]",
      className
    )}
    aria-hidden
  />
);

export interface PosterProps {
  readonly dungeonId: string;
  readonly boss: DungeonBoss;
  /** The place of the Boss in the Boss order, from 0. */
  readonly index: number;
  readonly lanes: number;
  /** The Player won this Dungeon: the poster carries the claimed stamp. */
  readonly claimed: boolean;
  /** The short form: one slip with the same facts (on a short screen). */
  readonly folded: boolean;
  readonly active: boolean;
  readonly onActive: (active: boolean) => void;
}

/**
 * A wanted poster of one Boss (GDD 8.4): parchment pinned on the notice
 * board with two bronze tacks. It shows the pin of the Boss, its Class seal
 * in the place of a portrait, its name, Class, Hero HP with the Boss Rule
 * notch, its Boss Rules, and the Lanes of its Front. The folded form is one
 * slip with the same facts. The poster takes the focus, so that the keyboard
 * also lights its Front Bracket; it has no action.
 */
export const WantedPoster = ({
  dungeonId,
  boss,
  index,
  lanes,
  claimed,
  folded,
  active,
  onActive,
}: PosterProps) => {
  const { tr, text } = useGameText();
  const ruleText = useRuleText();
  const nameId = useId();
  const name = tr(`dungeons.${dungeonId}.bosses.${boss.id}`);
  const className = text(classText(boss.classId));
  const holds = holdsText(tr, boss.front);
  const tilt = index % 2 === 0 ? "-rotate-[1.2deg]" : "rotate-[0.9deg]";
  const delay = { animationDelay: `${140 + index * 70}ms` };
  const { hoverProps } = useHover({ onHoverChange: onActive });
  const { focusWithinProps } = useFocusWithin({
    onFocusWithinChange: onActive,
  });
  return (
    <article
      {...mergeProps(hoverProps, focusWithinProps)}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the poster takes the focus so that the keyboard lights its Front Bracket, as a Balance takes the focus for its tooltip
      tabIndex={0}
      aria-labelledby={nameId}
      aria-describedby={`${nameId}-facts`}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col rounded-[6px] border border-[#b89a68] bg-[linear-gradient(180deg,#fbf1da,#f1e0bb)] text-[#2a1d12] shadow-[0_3px_0_rgba(0,0,0,0.35),0_10px_18px_rgba(0,0,0,0.3)] outline-none",
        "transition-[transform,box-shadow] duration-200 motion-safe:animate-[stage-panel-ink_320ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
        "focus-visible:ring-4 focus-visible:ring-[#fff2a8]",
        folded ? "max-w-80 px-3 pt-2.5 pb-2" : "max-w-85 px-4 pt-5 pb-3",
        !folded && tilt,
        active &&
          "-translate-y-0.5 rotate-0 shadow-[0_0_0_3px_rgba(226,169,59,0.55),0_3px_0_rgba(0,0,0,0.35),0_12px_20px_rgba(0,0,0,0.32)] motion-reduce:translate-y-0"
      )}
      style={delay}
      data-testid={`poster-${index}`}
      data-active={active || undefined}
      data-folded={folded || undefined}
      data-lanes={boss.front.map((lane) => lane + 1).join(",")}
    >
      <Tack className="left-2" />
      <Tack className="right-2" />
      {folded ? null : (
        <p
          className="font-display text-center text-xl leading-none font-black tracking-[0.12em] text-[#5b2a0c] uppercase"
          aria-hidden
        >
          {tr("dungeons.poster.wanted")}
        </p>
      )}
      <div
        className={cn(
          "flex min-w-0 items-center gap-2.5",
          folded ? "" : "mt-3 flex-col text-center"
        )}
      >
        <span className="relative shrink-0">
          <span
            className={cn(
              "grid place-items-center rounded-full border-[3px] border-[#e7bb6a] bg-[radial-gradient(circle_at_35%_30%,#fff3d1,#e3cfa6_70%)] text-[#2a1d12] shadow-[0_2px_0_rgba(0,0,0,0.35)]",
              folded ? "size-9" : "size-16"
            )}
            aria-hidden
          >
            <GlyphIcon
              glyph={classGlyph(boss.classId)}
              className={folded ? "size-5" : "size-8"}
            />
          </span>
          <BossPin
            number={index + 1}
            className={cn(
              "absolute",
              folded
                ? "-top-1.5 -left-1.5 size-4.5 text-[10px]"
                : "-top-1 -right-1.5 size-6 text-xs"
            )}
          />
        </span>
        <div className="min-w-0">
          <h3
            id={nameId}
            className={cn(
              "font-display leading-tight font-bold",
              folded ? "truncate text-sm" : "text-lg"
            )}
          >
            {name}
          </h3>
          <p className="text-xs font-semibold text-[#5b4632]">{className}</p>
        </div>
        {folded && claimed ? (
          <ClaimedStamp
            className="absolute right-3 -bottom-2 -rotate-6 text-[10px]"
            style={delay}
          />
        ) : null}
      </div>
      {folded ? null : (
        <p className="mt-1.5 text-center text-xs leading-snug text-[#6b5238] italic">
          {tr(`dungeons.${dungeonId}.wanted.${boss.id}`)}
        </p>
      )}
      <div
        id={`${nameId}-facts`}
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          folded ? "mt-1.5" : "mt-3 border-t border-[#c9b48c]/80 pt-2.5"
        )}
      >
        <span className="sr-only">
          {tr("dungeons.poster.hp", { hp: boss.heroHp })}
        </span>
        <HpBar boss={boss} />
        <ul className="flex flex-col gap-1">
          {boss.bossRules.map((rule) => (
            <li
              key={`${rule.threshold}:${rule.effect.type}`}
              className={cn(
                "flex items-start gap-1.5 text-xs leading-snug",
                folded && "line-clamp-2"
              )}
              data-testid="poster-rule"
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
          data-testid="poster-lanes"
        >
          <span className="flex h-4 items-stretch">
            <LaneCells front={boss.front} lanes={lanes} />
          </span>
          {holds}
        </p>
      </div>
      {!folded && claimed ? (
        <ClaimedStamp
          className="absolute top-14 -right-2 rotate-[-10deg] text-xs"
          style={{ animationDelay: `${420 + index * 90}ms` }}
        />
      ) : null}
    </article>
  );
};
