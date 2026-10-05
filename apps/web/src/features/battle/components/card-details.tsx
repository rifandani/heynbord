import type { CardDefinition, RankId } from "@workspace/rules";
import { getCard, scaleForRank } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";

import type { UnitView } from "@/features/battle/battle-view";
import { cardText } from "@/features/battle/card-text";
import type { CardText } from "@/features/battle/card-text";
import {
  CardFrame,
  DAMAGE_GLYPH,
} from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { classGlyph, raceGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";

const INK_MUTED = "text-[#6b5238]";

/** One item in the stat row, with an icon when one exists. */
const Stat = ({
  glyph,
  children,
}: {
  readonly glyph?: Glyph;
  readonly children: ReactNode;
}) => (
  <li className="flex items-center gap-1 font-semibold whitespace-nowrap">
    {glyph ? (
      <GlyphIcon glyph={glyph} className="size-3.5 text-[#7a4c1a]" />
    ) : null}
    {children}
  </li>
);

const Divider = () => (
  <hr className="my-2 border-0 border-t border-[#c9a46a] [@media(max-height:500px)]:my-1.5" />
);

/**
 * The Side of a Unit as a chip, like the Turn chip: gold for the player and
 * red for the enemy, always with its name (never color alone).
 */
const SideChip = ({ owner }: { readonly owner: UnitView["owner"] }) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded border-2 px-1.5 py-px text-[0.6875rem] leading-tight font-bold whitespace-nowrap",
        owner === "enemy"
          ? "border-[#d9463b] bg-[#6b1610] text-[#fff6df]"
          : "border-[#7a5310] bg-[#f2c14e] text-[#2a1a05]"
      )}
      data-testid="unit-details-side"
    >
      {tr(owner === "enemy" ? "battle.enemy" : "battle.yours")}
    </span>
  );
};

/** The Race or Class line, with the Side chip of a Unit at its end. */
const KindLine = ({
  glyph,
  owner,
  children,
}: {
  readonly glyph: Glyph;
  readonly owner?: UnitView["owner"];
  readonly children: ReactNode;
}) => (
  <div className="flex items-center gap-1.5">
    <p className="flex min-w-0 items-center gap-1.5 font-semibold">
      <GlyphIcon glyph={glyph} className="size-4 shrink-0" />
      {children}
    </p>
    {owner ? <SideChip owner={owner} /> : null}
  </div>
);

/** One line of the Unit status: an icon, a name in Keyword rust, and its rule. */
const StatusLine = ({
  glyph,
  name,
  children,
}: {
  readonly glyph: Glyph;
  readonly name: string;
  readonly children?: ReactNode;
}) => (
  <li className="flex gap-1.5">
    <GlyphIcon
      glyph={glyph}
      className="mt-0.5 size-3.5 shrink-0 text-[#7a4c1a]"
    />
    <span>
      <span className="font-bold text-[#b4521a]">{name}</span>
      {children ? <> {children}</> : null}
    </span>
  </li>
);

/**
 * How a Unit is different from its card now: its HP of its maximum, the bonus
 * Armor from a Skill Card, Burn and Freeze.
 */
const UnitStatus = ({ unit }: { readonly unit: UnitView }) => {
  const { tr } = useGameText();
  return (
    <>
      <Divider />
      <ul className="space-y-1" data-testid="unit-details-status">
        <li className="flex items-center gap-1.5 font-semibold">
          <GlyphIcon
            glyph="heart"
            className="size-3.5 shrink-0 text-[#c0392b]"
          />
          {tr("battle.unitHp", { hp: unit.hp, maxHp: unit.maxHp })}
        </li>
        {unit.bonusArmor > 0 ? (
          <StatusLine
            glyph="shield"
            name={tr("battle.status.bonusArmor", { value: unit.bonusArmor })}
          >
            {tr("battle.status.bonusArmorRule", {
              turns: unit.bonusArmorTurns,
            })}
          </StatusLine>
        ) : null}
        {unit.burn > 0 ? (
          <StatusLine glyph="flame" name={tr("battle.status.burn")}>
            {tr("battle.status.burnRule", { value: unit.burn })}
          </StatusLine>
        ) : null}
        {unit.frozen ? (
          <StatusLine glyph="snow" name={tr("battle.status.frozen")}>
            {tr("battle.status.frozenRule")}
          </StatusLine>
        ) : null}
      </ul>
    </>
  );
};

/** The kind line, the Unit status, the stat row and the rules of the card. */
const PanelBody = ({
  card,
  rank,
  content,
  unit,
}: {
  readonly card: CardDefinition;
  readonly rank: RankId;
  readonly content: CardText;
  readonly unit?: UnitView;
}) => {
  const { tr, text } = useGameText();
  if (card.kind === "creature" && content.kind === "creature") {
    return (
      <>
        <KindLine glyph={raceGlyph(card.race)} owner={unit?.owner}>
          {tr(`races.${card.race}`)} · {tr(`roles.${card.role}`)}
        </KindLine>
        {unit ? <UnitStatus unit={unit} /> : null}
        <Divider />
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          <Stat glyph={DAMAGE_GLYPH[card.damageType]}>
            {tr(`damageTypes.${card.damageType}`)}
          </Stat>
          <Stat glyph="range">{text(content.attackType)}</Stat>
          <Stat glyph="speed">
            {tr("battle.speedStat")} {card.speed}
          </Stat>
        </ul>
        {content.keywords.length > 0 || content.damageRule ? <Divider /> : null}
        <ul className="space-y-1.5">
          {content.keywords.map((keyword) => (
            <li key={keyword.name.key}>
              <span className="font-bold text-[#b4521a]">
                {text(keyword.name)}
              </span>{" "}
              {text(keyword.rule)}
            </li>
          ))}
          {content.damageRule ? <li>{text(content.damageRule)}</li> : null}
        </ul>
        <p className="sr-only">
          {tr("battle.attack")}{" "}
          {unit?.attack ?? scaleForRank(card.attack, rank)}
          {unit ? null : (
            <>
              , {tr("battle.hp")} {scaleForRank(card.hp, rank)}
            </>
          )}
        </p>
      </>
    );
  }
  if (card.kind === "skill" && content.kind === "skill") {
    const damageType =
      "damageType" in card.effect ? card.effect.damageType : undefined;
    return (
      <>
        <KindLine glyph={classGlyph(card.class)}>
          {tr(`classes.${card.class}`)} · {tr("battle.skill")}
        </KindLine>
        <Divider />
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {damageType ? (
            <Stat glyph={DAMAGE_GLYPH[damageType]}>
              {tr(`damageTypes.${damageType}`)}
            </Stat>
          ) : null}
          <Stat>{text(content.recall)}</Stat>
        </ul>
        <Divider />
        <p>{text(content.effect)}</p>
        <p className={`mt-1 text-xs leading-snug ${INK_MUTED}`}>
          {text(content.reminder)}
        </p>
      </>
    );
  }
  return null;
};

/**
 * The Card Details (UI-05): a larger copy of the card, with the Details Panel
 * next to it. It shows on hover, long press or keyboard focus.
 *
 * With `unit`, it is the card of a Unit on the Board: the card shows the
 * current Attack and HP, and the panel shows the Side and the Unit status. On
 * a short screen, the flavor text of a Unit goes away to keep the panel short.
 * `panelSide` puts the panel at the left of the card, for Card Details at the
 * right edge of the screen.
 */
export const CardDetails = ({
  cardId,
  rank,
  countdown,
  unit,
  panelSide = "right",
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly countdown: number;
  readonly unit?: UnitView;
  readonly panelSide?: "left" | "right";
}) => {
  const { tr, text } = useGameText();
  const card = getCard(cardId);
  const content = cardText(cardId, rank);
  const left = panelSide === "left";
  return (
    <section
      aria-live="polite"
      className={cn(
        "pointer-events-none flex items-stretch drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]",
        left && "flex-row-reverse"
      )}
    >
      {/* The font size sets the size of the card: 180 × 252 px, and 108 × 151 px on a short screen. */}
      <CardFrame
        cardId={cardId}
        rank={rank}
        countdown={countdown}
        live={unit}
        className="z-10 shrink-0 text-[20px] [@media(max-height:500px)]:text-[12px]"
      />
      <div
        className={cn(
          "flex w-[min(250px,44vw)] flex-col border-[3px] border-[#b47f36] bg-[#f6ead0] py-3 text-sm leading-snug text-[#2a1d12] [@media(max-height:500px)]:w-[min(230px,40vw)] [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs [@media(max-height:500px)]:leading-tight",
          left
            ? "-mr-2 rounded-l-xl border-r-0 pr-5 pl-3"
            : "-ml-2 rounded-r-xl border-l-0 pr-3 pl-5"
        )}
      >
        <h3 className="sr-only">
          {text(content.name)}, {tr(`ranks.${rank}`)},{" "}
          {unit
            ? tr(
                unit.owner === "enemy" ? "battle.enemyUnit" : "battle.yourUnit"
              )
            : tr("battle.countdown", { value: countdown })}
        </h3>
        <PanelBody card={card} rank={rank} content={content} unit={unit} />
        <div
          className={cn(
            "mt-auto pt-2",
            unit && "[@media(max-height:500px)]:hidden"
          )}
        >
          <Divider />
          <p className={`text-xs italic ${INK_MUTED}`}>
            {text(content.flavor)}
          </p>
        </div>
      </div>
    </section>
  );
};
