import type {
  CardDefinition,
  CreatureCardDefinition,
  RankId,
  SkillCardDefinition,
} from "@workspace/rules";
import { getCard, scaleForRank } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";

import type { UnitView } from "@/features/battle/battle-view";
import { cardText } from "@/features/battle/card-text";
import type {
  CardText,
  CreatureCardText,
  SkillCardText,
} from "@/features/battle/card-text";
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

const quietUnit = (unit: UnitView) =>
  unit.bonusArmor <= 0 && unit.burn <= 0 && unit.poisoned <= 0 && !unit.frozen;

const BonusArmorStatus = ({ unit }: { readonly unit: UnitView }) => {
  const { tr } = useGameText();
  if (unit.bonusArmor <= 0) {
    return null;
  }
  return (
    <StatusLine
      glyph="shield"
      name={tr("battle.status.bonusArmor", { value: unit.bonusArmor })}
    >
      {tr("battle.status.bonusArmorRule", { turns: unit.bonusArmorTurns })}
    </StatusLine>
  );
};

const BurnStatus = ({ unit }: { readonly unit: UnitView }) => {
  const { tr } = useGameText();
  if (unit.burn <= 0) {
    return null;
  }
  return (
    <StatusLine glyph="flame" name={tr("battle.status.burn")}>
      {tr("battle.status.burnRule", { value: unit.burn })}
    </StatusLine>
  );
};

const FrozenStatus = ({ unit }: { readonly unit: UnitView }) => {
  const { tr } = useGameText();
  if (!unit.frozen) {
    return null;
  }
  return (
    <StatusLine glyph="snow" name={tr("battle.status.frozen")}>
      {tr("battle.status.frozenRule")}
    </StatusLine>
  );
};

const PoisonStatus = ({ unit }: { readonly unit: UnitView }) => {
  const { tr } = useGameText();
  if (unit.poisoned <= 0) {
    return null;
  }
  return (
    <StatusLine
      glyph="leaf"
      name={tr("battle.status.poisoned", { value: unit.poisoned })}
    >
      {tr("battle.status.poisonedRule")}
    </StatusLine>
  );
};

/**
 * How a Unit is different from its card now: the bonus Armor from a Skill
 * Card, Burn and Freeze. The current HP stays on the card.
 */
const UnitStatus = ({ unit }: { readonly unit: UnitView }) => {
  if (quietUnit(unit)) {
    return null;
  }
  return (
    <>
      <Divider />
      <ul className="space-y-1" data-testid="unit-details-status">
        <BonusArmorStatus unit={unit} />
        <BurnStatus unit={unit} />
        <FrozenStatus unit={unit} />
        <PoisonStatus unit={unit} />
      </ul>
    </>
  );
};

const unitOwner = (unit: UnitView | undefined) => unit?.owner;

const shownAttack = (
  unit: UnitView | undefined,
  card: CreatureCardDefinition,
  rank: RankId
) => unit?.attack ?? scaleForRank(card.attack, rank);

const hasKeywordRules = (content: CreatureCardText) =>
  content.keywords.length > 0 || content.damageRule;

const KeywordRules = ({ content }: { readonly content: CreatureCardText }) => {
  const { text } = useGameText();
  return (
    <>
      {hasKeywordRules(content) ? <Divider /> : null}
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
    </>
  );
};

const HpSr = ({
  unit,
  card,
  rank,
}: {
  readonly unit: UnitView | undefined;
  readonly card: CreatureCardDefinition;
  readonly rank: RankId;
}) => {
  const { tr } = useGameText();
  if (unit) {
    return null;
  }
  return (
    <>
      , {tr("battle.hp")} {scaleForRank(card.hp, rank)}
    </>
  );
};

const CreatureBody = ({
  card,
  rank,
  content,
  unit,
}: {
  readonly card: CreatureCardDefinition;
  readonly rank: RankId;
  readonly content: CreatureCardText;
  readonly unit?: UnitView;
}) => {
  const { tr, text } = useGameText();
  return (
    <>
      <KindLine glyph={raceGlyph(card.race)} owner={unitOwner(unit)}>
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
      <KeywordRules content={content} />
      <p className="sr-only">
        {tr("battle.attack")} {shownAttack(unit, card, rank)}
        <HpSr unit={unit} card={card} rank={rank} />
      </p>
    </>
  );
};

const skillDamageType = (card: SkillCardDefinition) =>
  "damageType" in card.effect ? card.effect.damageType : undefined;

const SkillBody = ({
  card,
  content,
}: {
  readonly card: SkillCardDefinition;
  readonly content: SkillCardText;
}) => {
  const { tr, text } = useGameText();
  const damageType = skillDamageType(card);
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
};

const CreaturePanel = ({
  card,
  rank,
  content,
  unit,
}: {
  readonly card: CreatureCardDefinition;
  readonly rank: RankId;
  readonly content: CardText;
  readonly unit?: UnitView;
}) => {
  if (content.kind !== "creature") {
    return null;
  }
  return <CreatureBody card={card} rank={rank} content={content} unit={unit} />;
};

const SkillPanel = ({
  card,
  content,
}: {
  readonly card: SkillCardDefinition;
  readonly content: CardText;
}) => {
  if (content.kind !== "skill") {
    return null;
  }
  return <SkillBody card={card} content={content} />;
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
  if (card.kind === "creature") {
    return (
      <CreaturePanel card={card} rank={rank} content={content} unit={unit} />
    );
  }
  return <SkillPanel card={card} content={content} />;
};

/**
 * The Card Details (UI-05): a larger copy of the card, with the Details Panel
 * next to it. The panel starts with the card name. It shows on hover, long
 * press or keyboard focus.
 *
 * With `unit`, it is the card of a Unit on the Board: the card shows the
 * current Attack and HP, and the panel shows the Side and the Unit status. On
 * a short screen, the flavor text of a Unit goes away to keep the panel short.
 * `panelSide` puts the panel at the left of the card, for Card Details at the
 * right edge of the screen.
 */
const rowClass = (left: boolean) =>
  cn(
    "pointer-events-none flex items-stretch drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]",
    left && "flex-row-reverse"
  );

const panelClass = (left: boolean) =>
  cn(
    "flex w-[min(250px,44vw)] flex-col border-[3px] border-[#b47f36] bg-[#f6ead0] py-3 text-sm leading-snug text-[#2a1d12] [@media(max-height:500px)]:w-[min(230px,40vw)] [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs [@media(max-height:500px)]:leading-tight",
    left
      ? "-mr-2 rounded-l-xl border-r-0 pr-5 pl-3"
      : "-ml-2 rounded-r-xl border-l-0 pr-3 pl-5"
  );

const flavorClass = (unit: UnitView | undefined) =>
  cn("mt-auto pt-2", unit && "[@media(max-height:500px)]:hidden");

const placeLabel = (unit: UnitView | undefined) =>
  unit?.owner === "enemy" ? "battle.enemyUnit" : "battle.yourUnit";

const NameSr = ({
  unit,
  rank,
  countdown,
}: {
  readonly unit: UnitView | undefined;
  readonly rank: RankId;
  readonly countdown: number;
}) => {
  const { tr } = useGameText();
  const place = unit
    ? tr(placeLabel(unit))
    : tr("battle.countdown", { value: countdown });
  return (
    <span className="sr-only">
      , {tr(`ranks.${rank}`)}, {place}
    </span>
  );
};

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
  const { text } = useGameText();
  const card = getCard(cardId);
  const content = cardText(cardId, rank);
  const left = panelSide === "left";
  return (
    <section aria-live="polite" className={rowClass(left)}>
      {/* The font size sets the size of the card: 180 × 252 px, and 108 × 151 px on a short screen. */}
      <CardFrame
        cardId={cardId}
        rank={rank}
        countdown={countdown}
        live={unit}
        className="z-10 shrink-0 text-[20px] [@media(max-height:500px)]:text-[12px]"
      />
      <div className={panelClass(left)}>
        <h3
          className="font-display mb-1.5 text-base leading-tight font-bold text-balance [@media(max-height:500px)]:mb-1 [@media(max-height:500px)]:text-sm"
          data-testid="card-details-name"
        >
          {text(content.name)}
          <NameSr unit={unit} rank={rank} countdown={countdown} />
        </h3>
        <PanelBody card={card} rank={rank} content={content} unit={unit} />
        <div className={flavorClass(unit)}>
          <Divider />
          <p className={`text-xs italic ${INK_MUTED}`}>
            {text(content.flavor)}
          </p>
        </div>
      </div>
    </section>
  );
};
