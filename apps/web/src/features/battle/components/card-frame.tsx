import { getCard, rankPips, scaleForRank } from "@workspace/rules";
import type {
  CardDefinition,
  CreatureCardDefinition,
  RankId,
  SkillCardDefinition,
} from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";

import { cardIllustration } from "@/features/battle/card-art";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { cardGlyph, classGlyph, raceGlyph } from "@/features/battle/glyphs";
import {
  DAMAGE_COLORS,
  RACE_COLORS,
  RANK_COLORS,
} from "@/features/battle/palette";

/** The frame metal. It is the same for all cards, and for the Card Back. */
export const BRONZE =
  "linear-gradient(155deg, #f7dc9c 0%, #c99442 22%, #8a5a20 55%, #b47f36 80%, #e9c27a 100%)";

/** The emblem color of a Skill Card: one parchment for all Classes. */
const PARCHMENT = { main: "#f3e6c4", ink: "#3a2612" } as const;

const CREAM = "#fff6df";
const HEART_RED = "#ff6b6b";
/** The HP number of a damaged Unit: the color of a low Hero HP bar. */
const HP_LOW = "#ff7a6b";

/** The stats of a Unit on the Board, when they differ from its card. */
export interface LiveStats {
  readonly attack: number;
  readonly hp: number;
  readonly maxHp: number;
}

export const DAMAGE_GLYPH = {
  physical: "sword",
  fire: "flame",
  frost: "snow",
  holy: "sun",
} as const satisfies Record<keyof typeof DAMAGE_COLORS, Glyph>;

/** A badge with a thick bronze rim. */
const badgeClassName =
  "absolute z-10 flex items-center justify-center rounded-full border-[0.16em] border-[#e7bb6a] shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6)]";

const darkPlate = "bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)]";

/** The Rank as a row of Rank Gems: color and a count, never only the color. */
const RankGems = ({ rank }: { readonly rank: RankId }) => (
  <span className="inline-flex items-center gap-[0.18em]">
    {Array.from({ length: rankPips(rank) }, (_, index) => (
      <span
        key={index}
        className="size-[0.62em] rotate-45 border-[0.08em] border-[#2a1a08] shadow-[inset_0.08em_0.08em_0_rgba(255,255,255,0.6)]"
        style={{ backgroundColor: RANK_COLORS[rank] }}
      />
    ))}
  </span>
);

/**
 * The Countdown at the top left, on a faint hourglass. It has the same size as
 * the emblem, and it is gold when the card is Ready.
 */
const CountdownBadge = ({
  countdown,
  ready,
}: {
  readonly countdown: number;
  readonly ready: boolean;
}) => (
  <span
    className={cn(
      badgeClassName,
      "-top-[0.3em] -left-[0.3em] size-[2.1em]",
      ready
        ? "bg-[radial-gradient(circle_at_35%_30%,#fff1a8,#ffcf4a_55%,#d99a1c)] text-[#2a1a05]"
        : cn(darkPlate, "text-[#fff6df]")
    )}
  >
    <GlyphIcon
      glyph="hourglass"
      className="absolute size-[1.45em] opacity-30"
    />
    <span className="relative text-[1.3em] leading-none font-black tabular-nums [text-shadow:0_0.06em_0.12em_rgba(0,0,0,0.45)]">
      {countdown}
    </span>
  </span>
);

/** The Race emblem of a Creature Card, or the Class emblem of a Skill Card. */
const Emblem = ({ card }: { readonly card: CardDefinition }) => {
  const creature = card.kind === "creature";
  return (
    <span
      className={cn(badgeClassName, "-top-[0.3em] -right-[0.3em] size-[2.1em]")}
      style={{
        backgroundColor: creature
          ? RACE_COLORS[card.race].main
          : PARCHMENT.main,
        color: creature ? CREAM : PARCHMENT.ink,
      }}
    >
      <GlyphIcon
        glyph={creature ? raceGlyph(card.race) : classGlyph(card.class)}
        className="size-[1.15em]"
      />
    </span>
  );
};

/**
 * The Rank Gems at the top center, in line with the Countdown and the emblem.
 * The card name is not on the frame. Card Details shows it.
 */
const RankRow = ({ rank }: { readonly rank: RankId }) => (
  <span className="absolute inset-x-[1.7em] top-[0.44em] z-5 flex justify-center">
    <RankGems rank={rank} />
  </span>
);

/** A dark plate at a bottom corner: an icon in its color and a number. */
const StatPlate = ({
  glyph,
  color,
  value,
  valueColor = CREAM,
  className,
}: {
  readonly glyph: Glyph;
  readonly color: string;
  readonly value: number;
  readonly valueColor?: string;
  readonly className: string;
}) => (
  <span
    className={cn(
      badgeClassName,
      darkPlate,
      "-bottom-[0.35em] h-[2.05em] min-w-[2.05em] gap-[0.1em] px-[0.3em]",
      className
    )}
    style={{ color }}
  >
    <GlyphIcon glyph={glyph} className="size-[1.05em]" />
    <span
      className="text-[1.2em] leading-none font-black tabular-nums"
      style={{ color: valueColor }}
    >
      {value}
    </span>
  </span>
);

/**
 * Attack (with its Damage Type icon) and HP, or the effect icon of a Skill
 * Card. `live` gives the current stats of a Unit. The HP of a damaged Unit has
 * the low HP color.
 */
const shownAttack = (
  card: CreatureCardDefinition,
  rank: RankId,
  live: LiveStats | undefined
) => live?.attack ?? scaleForRank(card.attack, rank);

const shownHp = (
  card: CreatureCardDefinition,
  rank: RankId,
  live: LiveStats | undefined
) => live?.hp ?? scaleForRank(card.hp, rank);

const hpColor = (live: LiveStats | undefined, hp: number) =>
  live && hp < live.maxHp ? HP_LOW : CREAM;

const CreaturePlates = ({
  card,
  rank,
  live,
}: {
  readonly card: CreatureCardDefinition;
  readonly rank: RankId;
  readonly live?: LiveStats;
}) => {
  const hp = shownHp(card, rank, live);
  return (
    <>
      <StatPlate
        glyph={DAMAGE_GLYPH[card.damageType]}
        color={DAMAGE_COLORS[card.damageType]}
        value={shownAttack(card, rank, live)}
        className="-left-[0.35em]"
      />
      <StatPlate
        glyph="heart"
        color={HEART_RED}
        value={hp}
        valueColor={hpColor(live, hp)}
        className="-right-[0.35em]"
      />
    </>
  );
};

const effectColor = (card: SkillCardDefinition) => {
  const damageType =
    "damageType" in card.effect ? card.effect.damageType : undefined;
  return damageType ? DAMAGE_COLORS[damageType] : CREAM;
};

const SkillPlate = ({ card }: { readonly card: SkillCardDefinition }) => (
  <span
    className={cn(
      badgeClassName,
      darkPlate,
      "-bottom-[0.4em] left-1/2 size-[2.3em] -translate-x-1/2"
    )}
    style={{ color: effectColor(card) }}
  >
    <GlyphIcon glyph={cardGlyph(card)} className="size-[1.25em]" />
  </span>
);

const BottomPlates = ({
  card,
  rank,
  live,
}: {
  readonly card: CardDefinition;
  readonly rank: RankId;
  readonly live?: LiveStats;
}): ReactNode => {
  if (card.kind === "creature") {
    return <CreaturePlates card={card} rank={rank} live={live} />;
  }
  return <SkillPlate card={card} />;
};

/** The art window. A Skill Card has an arched top, so its shape differs from a Creature Card. */
const artWindowStyle = (card: CardDefinition, rank: RankId): CSSProperties => ({
  border: `0.14em solid ${RANK_COLORS[rank]}`,
  borderRadius:
    card.kind === "skill"
      ? "50% 50% 0.55em 0.55em / 4.6em 4.6em 0.55em 0.55em"
      : "0.55em",
});

/**
 * The Card Frame: the card art in a bronze frame, with the Countdown, the Rank
 * Gems, the emblem, and Attack and HP. The name is not on the frame. All sizes
 * are in `em`, so the font size of the parent sets the size of the card
 * (9em × 12.6em). The frame is decorative: the caller gives the accessible text.
 *
 * With `live`, the card is a Unit on the Board: the plates show its current
 * Attack and HP, and the Countdown is never Ready gold, because the card is
 * not in a Hand.
 */
export const CardFrame = ({
  cardId,
  rank,
  countdown,
  live,
  className,
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly countdown: number;
  readonly live?: LiveStats;
  readonly className?: string;
}) => {
  const card = getCard(cardId);
  return (
    <span
      className={cn(
        "relative block h-[12.6em] w-[9em] rounded-[0.85em] p-[0.36em] shadow-[inset_0_0.1em_0_rgba(255,243,210,0.85),inset_0_-0.12em_0_rgba(60,30,5,0.75),0_0.3em_0.7em_rgba(0,0,0,0.55)]",
        className
      )}
      style={{ background: BRONZE }}
      aria-hidden
    >
      <span
        className="relative block size-full overflow-hidden bg-[#2a1d12]"
        style={artWindowStyle(card, rank)}
      >
        <img
          src={cardIllustration(cardId)}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </span>
      <RankRow rank={rank} />
      <CountdownBadge countdown={countdown} ready={!live && countdown === 0} />
      <Emblem card={card} />
      <BottomPlates card={card} rank={rank} live={live} />
    </span>
  );
};
