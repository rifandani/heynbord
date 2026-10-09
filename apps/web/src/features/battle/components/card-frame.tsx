import { getCard, getToken, rankPips, scaleForRank } from "@workspace/rules";
import type {
  CardDefinition,
  CreatureCardDefinition,
  DamageType,
  RaceId,
  RankId,
  SkillCardDefinition,
  TokenDefinition,
  TokenId,
} from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import {
  cardIllustration,
  hasCardArt,
  hasTokenArt,
  tokenIllustration,
} from "@/features/battle/card-art";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import {
  cardGlyph,
  classGlyph,
  DAMAGE_GLYPH,
  raceGlyph,
} from "@/features/battle/glyphs";
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

/** A badge with a thick bronze rim. */
const badgeClassName =
  "absolute z-10 flex items-center justify-center rounded-full border-[0.16em] border-[#e7bb6a] shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6)]";

const darkPlate = "bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)]";

/** The Rank as a row of Rank Gems: color and a count, never only the color. */
export const RankGems = ({ rank }: { readonly rank: RankId }) => (
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

/** The Race emblem of a Creature Card or a Token, or the Class emblem of a Skill Card. */
const Emblem = ({ face }: { readonly face: FrameFace }) => (
  <span
    className={cn(badgeClassName, "-top-[0.3em] -right-[0.3em] size-[2.1em]")}
    style={{ backgroundColor: face.emblem.background, color: face.emblem.ink }}
  >
    <GlyphIcon glyph={face.emblem.glyph} className="size-[1.15em]" />
  </span>
);

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
  className,
}: {
  readonly glyph: Glyph;
  readonly color: string;
  readonly value: number;
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
      style={{ color: CREAM }}
    >
      {value}
    </span>
  </span>
);

/**
 * Attack (with its Damage Type icon) and HP, or the effect icon of a Skill
 * Card. They are the base values at the Rank, also for a Unit on the Board.
 * A Wall does not attack, so it shows no Attack.
 */
const CreaturePlates = ({
  plates,
}: {
  readonly plates: CreaturePlateValues;
}) => (
  <>
    {plates.wall ? null : (
      <StatPlate
        glyph={DAMAGE_GLYPH[plates.damageType]}
        color={DAMAGE_COLORS[plates.damageType]}
        value={plates.attack}
        className="-left-[0.35em]"
      />
    )}
    <StatPlate
      glyph="heart"
      color={HEART_RED}
      value={plates.hp}
      className="-right-[0.35em]"
    />
  </>
);

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

const BottomPlates = ({ face }: { readonly face: FrameFace }): ReactNode =>
  face.plates.kind === "creature" ? (
    <CreaturePlates plates={face.plates} />
  ) : (
    <SkillPlate card={face.plates.card} />
  );

/** The art window. A Skill Card has an arched top, so its shape differs from a Creature Card. */
const artWindowStyle = (face: FrameFace, rank: RankId): CSSProperties => ({
  border: `0.14em solid ${RANK_COLORS[rank]}`,
  borderRadius:
    face.plates.kind === "skill"
      ? "50% 50% 0.55em 0.55em / 4.6em 4.6em 0.55em 0.55em"
      : "0.55em",
});

/**
 * The art of a card or a Token. One with no art yet shows its Race or Class
 * emblem on the color of the Race.
 */
const CardArt = ({ face }: { readonly face: FrameFace }) => {
  const [missing, setMissing] = useState(() => !face.hasArt);
  const { backdrop } = face;
  if (missing) {
    return (
      <span
        className="absolute inset-0 grid place-items-center"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${backdrop.light} 0%, ${backdrop.dark} 78%)`,
          color: backdrop.ink,
        }}
      >
        <GlyphIcon
          glyph={face.emblem.glyph}
          className="size-[4.4em] opacity-70 drop-shadow-[0_0.12em_0.2em_rgba(0,0,0,0.45)]"
        />
      </span>
    );
  }
  return (
    <img
      src={face.art}
      alt=""
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className="size-full object-cover"
    />
  );
};

/** Attack and HP at a Rank, as the stat plates show them. */
interface CreaturePlateValues {
  readonly kind: "creature";
  readonly damageType: DamageType;
  readonly wall: boolean;
  readonly attack: number;
  readonly hp: number;
}

/**
 * What the frame shows of a card or a Token: its art, its emblem and its
 * stat plates. A Token is not a card, but its Unit shows in the same frame.
 */
interface FrameFace {
  /** The card ID or the Token ID: a new ID loads new art. */
  readonly id: string;
  readonly art: string;
  readonly hasArt: boolean;
  readonly emblem: {
    readonly glyph: Glyph;
    readonly background: string;
    readonly ink: string;
  };
  /** The colors behind the emblem when there is no art. */
  readonly backdrop: {
    readonly light: string;
    readonly dark: string;
    readonly ink: string;
  };
  readonly plates:
    | CreaturePlateValues
    | { readonly kind: "skill"; readonly card: SkillCardDefinition };
}

/** The face of a Race: its emblem and its backdrop. */
const raceFace = (race: RaceId, glyph: Glyph) => ({
  emblem: { glyph, background: RACE_COLORS[race].main, ink: CREAM },
  backdrop: {
    light: RACE_COLORS[race].light,
    dark: RACE_COLORS[race].dark,
    ink: CREAM,
  },
});

const creaturePlates = (
  card: CreatureCardDefinition,
  rank: RankId
): CreaturePlateValues => ({
  kind: "creature",
  damageType: card.damageType,
  wall: card.keywords.wall ?? false,
  attack: scaleForRank(card.attack, rank),
  hp: scaleForRank(card.hp, rank),
});

const cardFace = (card: CardDefinition, rank: RankId): FrameFace => {
  const base = {
    id: card.id,
    art: cardIllustration(card.id),
    hasArt: hasCardArt(card.id),
  };
  if (card.kind === "skill") {
    return {
      ...base,
      emblem: {
        glyph: classGlyph(card.class),
        background: PARCHMENT.main,
        ink: PARCHMENT.ink,
      },
      backdrop: { light: "#7a5a3a", dark: "#2a1d12", ink: PARCHMENT.main },
      plates: { kind: "skill", card },
    };
  }
  return {
    ...base,
    ...raceFace(card.race, raceGlyph(card.race)),
    plates: creaturePlates(card, rank),
  };
};

/** A Token has no Rank scale: its Rank table gives Attack and HP (Card Concepts 8). */
const tokenFace = (token: TokenDefinition, rank: RankId): FrameFace => ({
  id: token.id,
  art: tokenIllustration(token.id),
  hasArt: hasTokenArt(token.id),
  ...raceFace(token.race, raceGlyph(token.race)),
  plates: {
    kind: "creature",
    damageType: token.damageType,
    wall: token.keywords.wall ?? false,
    attack: token.ranks[rank].attack,
    hp: token.ranks[rank].hp,
  },
});

/** The bronze frame around a face, with the Rank Gems and the emblem. */
const FrameShell = ({
  face,
  rank,
  className,
  children,
}: {
  readonly face: FrameFace;
  readonly rank: RankId;
  readonly className?: string;
  /** The Countdown badge of a card. A Token has none. */
  readonly children?: ReactNode;
}) => (
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
      style={artWindowStyle(face, rank)}
    >
      <CardArt key={face.id} face={face} />
    </span>
    <RankRow rank={rank} />
    {children}
    <Emblem face={face} />
    <BottomPlates face={face} />
  </span>
);

/**
 * The Card Frame: the card art in a bronze frame, with the Countdown, the Rank
 * Gems, the emblem, and Attack and HP. The name is not on the frame. All sizes
 * are in `em`, so the font size of the parent sets the size of the card
 * (9em × 12.6em). The frame is decorative: the caller gives the accessible text.
 */
export const CardFrame = ({
  cardId,
  rank,
  countdown,
  className,
}: {
  readonly cardId: string;
  readonly rank: RankId;
  readonly countdown: number;
  readonly className?: string;
}) => (
  <FrameShell
    face={cardFace(getCard(cardId), rank)}
    rank={rank}
    className={className}
  >
    <CountdownBadge countdown={countdown} ready={countdown === 0} />
  </FrameShell>
);

/**
 * The frame of a Token Unit (GDD 4.9): the Card Frame with the Token art and
 * its values at the Rank, and no Countdown, because a Token is not a card.
 */
export const TokenFrame = ({
  tokenId,
  rank,
  className,
}: {
  readonly tokenId: TokenId;
  readonly rank: RankId;
  readonly className?: string;
}) => (
  <FrameShell
    face={tokenFace(getToken(tokenId), rank)}
    rank={rank}
    className={className}
  />
);
