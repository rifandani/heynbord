import type { CardDefinition, RankId } from "@workspace/rules";
import { getCard, scaleForRank } from "@workspace/rules";
import type { ReactNode } from "react";

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

/** The kind line, the stat row and the rules of the card. */
const PanelBody = ({
  card,
  rank,
  content,
}: {
  readonly card: CardDefinition;
  readonly rank: RankId;
  readonly content: CardText;
}) => {
  const { tr, text } = useGameText();
  if (card.kind === "creature" && content.kind === "creature") {
    return (
      <>
        <p className="flex items-center gap-1.5 font-semibold">
          <GlyphIcon glyph={raceGlyph(card.race)} className="size-4" />
          {tr(`races.${card.race}`)} · {tr(`roles.${card.role}`)}
        </p>
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
          {tr("battle.attack")} {scaleForRank(card.attack, rank)},{" "}
          {tr("battle.hp")} {scaleForRank(card.hp, rank)}
        </p>
      </>
    );
  }
  if (card.kind === "skill" && content.kind === "skill") {
    const damageType =
      "damageType" in card.effect ? card.effect.damageType : undefined;
    return (
      <>
        <p className="flex items-center gap-1.5 font-semibold">
          <GlyphIcon glyph={classGlyph(card.class)} className="size-4" />
          {tr(`classes.${card.class}`)} · {tr("battle.skill")}
        </p>
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
 * The Card Details (UI-05): a larger copy of the Hand Card, with the Details
 * Panel on its right side. It shows on hover, long press or keyboard focus.
 */
export const CardDetails = ({
  cardId,
  rank,
  countdown,
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly countdown: number;
}) => {
  const { tr, text } = useGameText();
  const card = getCard(cardId);
  const content = cardText(cardId, rank);
  return (
    <section
      aria-live="polite"
      className="pointer-events-none flex items-stretch drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
    >
      {/* The font size sets the size of the card: 180 × 252 px, and 108 × 151 px on a short screen. */}
      <CardFrame
        cardId={cardId}
        rank={rank}
        countdown={countdown}
        className="z-10 shrink-0 text-[20px] [@media(max-height:500px)]:text-[12px]"
      />
      <div className="-ml-2 flex w-[min(250px,44vw)] flex-col rounded-r-xl border-[3px] border-l-0 border-[#b47f36] bg-[#f6ead0] py-3 pr-3 pl-5 text-sm leading-snug text-[#2a1d12] [@media(max-height:500px)]:w-[min(230px,40vw)] [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs [@media(max-height:500px)]:leading-tight">
        <h3 className="sr-only">
          {text(content.name)}, {tr(`ranks.${rank}`)},{" "}
          {tr("battle.countdown", { value: countdown })}
        </h3>
        <PanelBody card={card} rank={rank} content={content} />
        <div className="mt-auto pt-2">
          <Divider />
          <p className={`text-xs italic ${INK_MUTED}`}>
            {text(content.flavor)}
          </p>
        </div>
      </div>
    </section>
  );
};
