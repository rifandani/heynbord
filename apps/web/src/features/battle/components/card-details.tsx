import type {
  CardDefinition,
  CreatureCardDefinition,
  RankId,
  SkillCardDefinition,
} from "@workspace/rules";
import { getCard, scaleForRank } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode } from "react";
import { createContext, use } from "react";
import { Button } from "react-aria-components";

import type { UnitView } from "@/features/battle/battle-view";
import { cardText, unitStatusText } from "@/features/battle/card-text";
import type {
  CardText,
  CreatureCardText,
  SkillCardText,
  StatusText,
} from "@/features/battle/card-text";
import { CardFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { StatusIcon } from "@/features/battle/components/status-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { classGlyph, DAMAGE_GLYPH, raceGlyph } from "@/features/battle/glyphs";
import type { Status } from "@/features/battle/scene/status-visuals";
import { STATUS_ORDER } from "@/features/battle/scene/status-visuals";
import { useGameText } from "@/features/battle/use-game-text";
import type { EntryId } from "@/features/handbook/handbook";
import {
  damageEntryId,
  keywordEntryId,
  statusEntryId,
} from "@/features/handbook/handbook";

/**
 * Opens the Handbook at an Entry. Only a Details Panel that can take focus
 * gets it (issue #25): then the Keyword, Status and Damage Type names are
 * links. A hover-only panel has no link.
 */
type OnEntry = ((entry: EntryId) => void) | undefined;

const EntryLinks = createContext<OnEntry>(undefined);

const INK_MUTED = "text-[#6b5238]";

/**
 * A rules term in the Details Panel: plain text, or a link to its Handbook
 * Entry. The link is a button, so that Enter in the Battle never plays a card.
 */
const TermName = ({
  entry,
  className,
  children,
}: {
  readonly entry: EntryId;
  readonly className?: string;
  readonly children: ReactNode;
}) => {
  const onEntry = use(EntryLinks);
  return onEntry ? (
    <Button
      onPress={() => onEntry(entry)}
      className={cn(
        "pointer-events-auto cursor-pointer rounded-sm text-left underline decoration-[#b4521a]/50 decoration-dotted underline-offset-2 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-solid",
        className
      )}
      data-entry={entry}
      data-testid="details-entry-link"
    >
      {children}
    </Button>
  ) : (
    <span className={className}>{children}</span>
  );
};

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

const isStatus = (icon: Status | Glyph): icon is Status =>
  STATUS_ORDER.some((status) => status === icon);

/**
 * One line of the Unit status: an icon, a name in Keyword rust, and its rule.
 * A Status uses its badge icon from the effects atlas, the same as above the
 * Unit; bonus Armor has no badge, so it uses a glyph.
 */
const StatusLine = ({
  icon,
  name,
  entry,
  children,
}: {
  readonly icon: Status | Glyph;
  readonly name: string;
  readonly entry: EntryId;
  readonly children?: ReactNode;
}) => (
  <li className="flex gap-1.5">
    <span className="mt-px flex size-4 shrink-0 items-center justify-center">
      {isStatus(icon) ? (
        <StatusIcon status={icon} className="size-4" />
      ) : (
        <GlyphIcon glyph={icon} className="size-3.5 text-[#7a4c1a]" />
      )}
    </span>
    <span>
      <TermName entry={entry} className="font-bold text-[#b4521a]">
        {name}
      </TermName>
      {children ? <> {children}</> : null}
    </span>
  </li>
);

/** Bonus Armor has no Status icon and no Entry of its own: it links to Armor. */
const statusIcon = (line: StatusText): Status | Glyph =>
  line.status === "bonusArmor" ? "shield" : line.status;

const statusEntry = (line: StatusText): EntryId =>
  line.status === "bonusArmor"
    ? keywordEntryId("armor")
    : statusEntryId(line.status);

/**
 * How a Unit is different from its card now: bonus Armor, Burn, Freeze,
 * Entangled, Hobbled, Bleeding and Poison. The current HP stays on the card.
 */
const UnitStatus = ({ unit }: { readonly unit: UnitView }) => {
  const { text } = useGameText();
  const lines = unitStatusText(unit);
  if (lines.length === 0) {
    return null;
  }
  return (
    <>
      <Divider />
      <ul className="space-y-1" data-testid="unit-details-status">
        {lines.map((line) => (
          <StatusLine
            key={line.status}
            icon={statusIcon(line)}
            name={text(line.name)}
            entry={statusEntry(line)}
          >
            {text(line.rule)}
            {line.left ? <> {text(line.left)}</> : null}
          </StatusLine>
        ))}
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
            <TermName
              entry={keywordEntryId(keyword.keyword)}
              className="font-bold text-[#b4521a]"
            >
              {text(keyword.name)}
            </TermName>{" "}
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
      {/* A Wall does not move or attack, so it shows no attack stats. */}
      {card.keywords.wall ? null : (
        <>
          <Divider />
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            <Stat glyph={DAMAGE_GLYPH[card.damageType]}>
              <TermName entry={damageEntryId(card.damageType)}>
                {tr(`damageTypes.${card.damageType}`)}
              </TermName>
            </Stat>
            <Stat glyph="range">{text(content.attackType)}</Stat>
            <Stat glyph="speed">
              {tr("battle.speedStat")} {card.speed}
            </Stat>
          </ul>
        </>
      )}
      <KeywordRules content={content} />
      {unit ? <UnitStatus unit={unit} /> : null}
      <p className="sr-only">
        {card.keywords.wall ? null : (
          <>
            {tr("battle.attack")} {shownAttack(unit, card, rank)}
          </>
        )}
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
            <TermName entry={damageEntryId(damageType)}>
              {tr(`damageTypes.${damageType}`)}
            </TermName>
          </Stat>
        ) : null}
        <Stat glyph="recall">{text(content.recall)}</Stat>
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

/** The kind line, the stat row, the rules of the card and the Unit status. */
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
    "flex w-[min(300px,53vw)] flex-col border-[3px] border-[#b47f36] bg-[#f6ead0] py-3 text-sm leading-snug text-[#2a1d12] [@media(max-height:500px)]:w-[min(276px,48vw)] [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-xs [@media(max-height:500px)]:leading-tight",
    left
      ? "-mr-2 rounded-l-xl border-r-0 pr-5 pl-3"
      : "-ml-2 rounded-r-xl border-l-0 pr-3 pl-5"
  );

const flavorClass = (unit: UnitView | undefined) =>
  cn("mt-auto pt-1", unit && "[@media(max-height:500px)]:hidden");

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

/** Unique (GDD 5.4): why a Ready card in the Hand cannot be played now. */
const BlockedLine = ({
  blocked,
  name,
}: {
  readonly blocked: boolean;
  readonly name: string;
}) => {
  const { tr } = useGameText();
  return blocked ? (
    <p
      className="mb-1.5 text-xs font-semibold text-[#5b4632]"
      data-testid="card-details-blocked"
    >
      {tr("battle.uniqueBlocked", { name })}
    </p>
  ) : null;
};

export const CardDetails = ({
  cardId,
  rank,
  countdown,
  unit,
  blocked = false,
  panelSide = "right",
  onEntry,
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly countdown: number;
  readonly unit?: UnitView;
  /** Unique (GDD 5.4): a Hand card that cannot be played now. */
  readonly blocked?: boolean;
  readonly panelSide?: "left" | "right";
  /** Makes the rules terms links to their Handbook Entries (issue #25). */
  readonly onEntry?: (entry: EntryId) => void;
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
        <BlockedLine blocked={blocked} name={text(content.name)} />
        <EntryLinks value={onEntry}>
          <PanelBody card={card} rank={rank} content={content} unit={unit} />
        </EntryLinks>
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
