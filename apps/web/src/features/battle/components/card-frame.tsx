import { getCard, getToken, scaleForRank } from "@workspace/rules";
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
import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { RankGems } from "@/core/components/game/rank-gems";
import {
  DAMAGE_COLORS,
  RACE_COLORS,
  RANK_COLORS,
} from "@/core/components/game/tokens";
import {
  cardIllustration,
  hasCardArt,
  hasTokenArt,
  tokenIllustration,
} from "@/features/battle/card-art";
import { AttackPlate } from "@/features/battle/components/attack-plate";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { HeynbordEmblem } from "@/features/battle/components/heynbord-emblem";
import type { Glyph } from "@/features/battle/glyphs";
import { cardGlyph, classGlyph, raceGlyph } from "@/features/battle/glyphs";

/** The frame metal. It is the same for all cards, and for the Card Back. */
export const BRONZE =
  "linear-gradient(155deg, #f7dc9c 0%, #c99442 22%, #8a5a20 55%, #b47f36 80%, #e9c27a 100%)";

/** The emblem color of a Skill Card: one parchment for all Classes. */
export const PARCHMENT = { main: "#f3e6c4", ink: "#3a2612" } as const;

const CREAM = "#fff6df";

/** A badge with a thick bronze rim. */
const badgeClassName =
  "absolute z-10 flex items-center justify-center rounded-full border-[0.16em] border-[#e7bb6a] shadow-[0_0.12em_0.25em_rgba(0,0,0,0.6)]";

const darkPlate = "bg-[radial-gradient(circle_at_35%_30%,#4a3524,#1c140e_70%)]";

/**
 * The glass of the Countdown hourglass: a wide top bulb, a narrow waist and a
 * wide bottom bulb, with the caps that hide its two ends.
 */
const COUNTDOWN_GLASS =
  "M20 12H60C60 25 53 34 44 39C43.6 39.4 43.6 40 44 40.4C53 45.6 60 54 60 67.5H20C20 54 27 45.6 36 40.4C36.4 40 36.4 39.4 36 39C27 34 20 25 20 12Z";

/** The metal of the hourglass caps, the same ramp as the card metal. */
const CAP_METAL = [
  ["0%", "#fff0c2"],
  ["18%", "#e9c27a"],
  ["45%", "#c99442"],
  ["70%", "#8a5a20"],
  ["88%", "#b47f36"],
  ["100%", "#f2d595"],
] as const;

/**
 * The Countdown at the top left, as a blue glass hourglass in the card metal.
 * The number sits on it with a thick ink edge and a bronze rim of its own, so
 * one digit runs over the glass and the waist, as it does on the Attack sword.
 * A Ready card drains the top bulb and turns the glass to gold, with dark text.
 * All sizes are in the `64 × 80` box, so the font size of the card sets the
 * size of the plate.
 */
const CountdownBadge = ({
  countdown,
  ready,
}: {
  readonly countdown: number;
  readonly ready: boolean;
}) => {
  // The gradients are per plate, because a page shows many cards.
  const uid = useId().replaceAll(/[^a-zA-Z0-9_-]/gu, "");
  const id = `cd-glass-${uid}`;
  const number = String(countdown);

  return (
    <svg
      viewBox="8 0 64 80"
      aria-hidden
      className="absolute -top-[0.37em] -left-[0.12em] z-10 h-auto w-[1.85em] drop-shadow-[0_0.12em_0.26em_rgba(0,0,0,0.62)]"
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0.18" x2="0.82" y1="0" y2="1">
          {ready ? (
            <>
              <stop offset="0" stopColor="#fff7cd" />
              <stop offset="0.22" stopColor="#ffe287" />
              <stop offset="0.5" stopColor="#f2b93a" />
              <stop offset="0.78" stopColor="#b8750f" />
              <stop offset="1" stopColor="#8a5a20" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#b6f0ff" />
              <stop offset="0.2" stopColor="#5fbdf2" />
              <stop offset="0.48" stopColor="#2a74cc" />
              <stop offset="0.74" stopColor="#16428f" />
              <stop offset="0.9" stopColor="#1d5cb8" />
              <stop offset="1" stopColor="#63c7f2" />
            </>
          )}
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="0.34" cy="0.18" r="0.58">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="0.5" stopColor="#dff7ff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#dff7ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-depth`} x1="0" x2="0" y1="0.35" y2="1">
          <stop offset="0" stopColor="#04122e" stopOpacity="0" />
          <stop offset="1" stopColor="#04122e" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={`${id}-sand`} x1="0" x2="0" y1="0" y2="1">
          {ready ? (
            <>
              <stop offset="0" stopColor="#ffe9a8" />
              <stop offset="1" stopColor="#d99a1c" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#fff3c4" />
              <stop offset="0.55" stopColor="#ffd75a" />
              <stop offset="1" stopColor="#d99a1c" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" x2="0.25" y1="0" y2="1">
          {CAP_METAL.map(([offset, stop]) => (
            <stop key={offset} offset={offset} stopColor={stop} />
          ))}
        </linearGradient>
        <linearGradient id={`${id}-sand-top`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffeeb0" />
          <stop offset="1" stopColor="#efb648" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={COUNTDOWN_GLASS} />
        </clipPath>
      </defs>

      {/* The glass: a bronze rim, an ink edge, then the blue face. */}
      <path
        d={COUNTDOWN_GLASS}
        fill="none"
        stroke="#e7bb6a"
        strokeLinejoin="round"
        strokeWidth="6"
      />
      <path
        d={COUNTDOWN_GLASS}
        fill="none"
        stroke="#2a1a08"
        strokeLinejoin="round"
        strokeWidth="4.2"
      />
      <path d={COUNTDOWN_GLASS} fill={`url(#${id}-body)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* The sheen in the top bulb, and a cooler one in the bottom bulb. */}
        <ellipse cx="31" cy="19" fill={`url(#${id}-sheen)`} rx="17" ry="10" />
        <ellipse
          cx="50"
          cy="62"
          fill={`url(#${id}-sheen)`}
          opacity="0.45"
          rx="12"
          ry="7"
        />
        <path d={COUNTDOWN_GLASS} fill={`url(#${id}-depth)`} />

        {/* The sand: a funnel in the top bulb and a mound in the bottom. */}
        {ready ? null : (
          <path
            d="M25 27.4C31.5 26.4 35 28.6 40 28.8C45 28.6 48.5 26.4 55 27.4C53.8 30.8 51.2 33.4 47.4 36C45 37.6 43 39.2 42.2 40.6H37.8C37 39.2 35 37.6 32.6 36C28.8 33.4 26.2 30.8 25 27.4Z"
            fill={`url(#${id}-sand-top)`}
          />
        )}
        <path
          d={
            ready
              ? "M20.5 67.5C22 56.5 30 49.5 40 49.5C50 49.5 58 56.5 59.5 67.5Z"
              : "M22 67.5C25 60.5 30.5 57.2 40 57.2C49.5 57.2 55 60.5 58 67.5Z"
          }
          fill={`url(#${id}-sand)`}
        />
        {ready ? null : (
          <path
            d="M25 65C28 60 33 58 40 58"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeOpacity="0.6"
            strokeWidth="1.2"
          />
        )}
        {ready ? null : (
          <path
            d="M40 41V57"
            stroke="#ffe9a8"
            strokeLinecap="round"
            strokeOpacity="0.9"
            strokeWidth="1.4"
          />
        )}

        {/* The light on the walls, which makes the glass read as round. */}
        <path
          d="M23 15.5C23.2 20.4 25 25.2 28.8 29.8"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />
        <path
          d="M57 15.5C56.8 19.4 55.4 23.2 52.8 26.6"
          fill="none"
          stroke="#cdefff"
          strokeLinecap="round"
          strokeOpacity="0.32"
          strokeWidth="1.2"
        />
        <path
          d="M23.4 64C24 56.6 28 51 33.4 46.8"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeOpacity="0.24"
          strokeWidth="1.2"
        />
        <path
          d="M56.6 64C56 57 52.4 51.6 47 47.4"
          fill="none"
          stroke="#cdefff"
          strokeLinecap="round"
          strokeOpacity="0.2"
          strokeWidth="1.1"
        />
        <path
          d="M36.4 40.4H43.6"
          stroke="#081a3f"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
      </g>

      {/* The caps: the card metal over the ends of the glass. */}
      {[4, 67.5].map((y) => (
        <g key={y}>
          <rect
            x="10"
            y={y}
            width="60"
            height="8.5"
            rx="3.2"
            fill={`url(#${id}-metal)`}
            stroke="#2a1a08"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
          <path
            d={`M15 ${y + 2.8}H65`}
            stroke="#fff4d2"
            strokeLinecap="round"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />
          <circle cx="16.5" cy={y + 4.2} fill="#5b3d16" r="1.4" />
          <circle cx="63.5" cy={y + 4.2} fill="#5b3d16" r="1.4" />
        </g>
      ))}

      {/* The number: a bronze rim, an ink edge, then the cream or ink face. */}
      {ready ? (
        <text
          x="40"
          y="41.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
          fontSize="38"
          fontWeight="900"
          fill="#2a1a08"
          stroke="#ffe9a8"
          strokeLinejoin="round"
          strokeWidth="3.2"
          paintOrder="stroke"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {number}
        </text>
      ) : (
        <>
          <text
            x="40"
            y="41.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            fontSize="38"
            fontWeight="900"
            fill="none"
            stroke="#e7bb6a"
            strokeLinejoin="round"
            strokeWidth="8"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {number}
          </text>
          <text
            x="40"
            y="41.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            fontSize="38"
            fontWeight="900"
            fill="none"
            stroke="#2a1a08"
            strokeLinejoin="round"
            strokeWidth="6"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {number}
          </text>
          <text
            x="40"
            y="41.5"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            fontSize="38"
            fontWeight="900"
            fill="#fff6df"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {number}
          </text>
        </>
      )}
    </svg>
  );
};

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

/**
 * The HP plate: a red heart with the number in it. The number is large on
 * purpose, so two digits can touch the lower rim. All sizes are in the `88 × 80`
 * box, so the font size of the card sets the size of the plate.
 */
const HEART_PATH =
  "M44 75C36 68 5 48.5 5 26.5C5 13.5 14 5 24.5 5C33.5 5 40.5 10 44 17C47.5 10 54.5 5 63.5 5C74 5 83 13.5 83 26.5C83 48.5 52 68 44 75Z";

const HealthPlate = ({ value }: { readonly value: number }) => {
  const uid = useId().replaceAll(/[^a-zA-Z0-9_-]/gu, "");
  const id = `hp-heart-${uid}`;
  return (
    <span className="absolute -right-[0.36em] -bottom-[0.32em] z-10 w-[2.43em] drop-shadow-[0_0.1em_0.14em_rgba(0,0,0,0.55)]">
      <svg viewBox="0 0 88 80" className="block h-auto w-full overflow-visible">
        <defs>
          <linearGradient id={`${id}-body`} x1="0.18" x2="0.82" y1="0" y2="1">
            <stop offset="0" stopColor="#ff8a6e" />
            <stop offset="0.24" stopColor="#f04d38" />
            <stop offset="0.55" stopColor="#cf2a20" />
            <stop offset="0.82" stopColor="#a31514" />
            <stop offset="1" stopColor="#7c0e10" />
          </linearGradient>
          <radialGradient id={`${id}-sheen`} cx="0.34" cy="0.2" r="0.52">
            <stop offset="0" stopColor="#ffe3cf" stopOpacity="0.75" />
            <stop offset="0.55" stopColor="#ffb391" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ff8f6e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-depth`} x1="0" x2="0" y1="0.45" y2="1">
            <stop offset="0" stopColor="#3d0505" stopOpacity="0" />
            <stop offset="1" stopColor="#3d0505" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`${id}-edge`} x1="0" x2="0.7" y1="0" y2="0.7">
            <stop offset="0" stopColor="#ffe6c8" stopOpacity="0.65" />
            <stop offset="0.5" stopColor="#ffc7a2" stopOpacity="0.18" />
            <stop offset="1" stopColor="#ffb28c" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <path d={HEART_PATH} />
          </clipPath>
        </defs>
        <path
          d={HEART_PATH}
          fill="none"
          stroke="#e7bb6a"
          strokeLinejoin="round"
          strokeWidth="7.4"
        />
        <path
          d={HEART_PATH}
          fill="none"
          stroke="#3a0a08"
          strokeLinejoin="round"
          strokeWidth="5.2"
        />
        <path d={HEART_PATH} fill={`url(#${id}-body)`} />
        <g clipPath={`url(#${id}-clip)`}>
          <ellipse cx="31" cy="21" fill={`url(#${id}-sheen)`} rx="27" ry="17" />
          <ellipse cx="44" cy="78" fill={`url(#${id}-depth)`} rx="40" ry="26" />
          <path
            d="M10.5 26C10.5 15.5 17 9.5 25.5 9.2"
            fill="none"
            stroke={`url(#${id}-edge)`}
            strokeLinecap="round"
            strokeWidth="2.6"
          />
          <path
            d="M77.5 26C77.5 15.5 71 9.5 62.5 9.2"
            fill="none"
            stroke={`url(#${id}-edge)`}
            strokeLinecap="round"
            strokeWidth="2.6"
          />
        </g>
        <ellipse
          cx="26"
          cy="17.5"
          fill="#ffd9c2"
          opacity="0.28"
          rx="9"
          ry="4.6"
          transform="rotate(-18 26 17.5)"
        />
        <text
          dominantBaseline="central"
          fill={CREAM}
          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
          fontSize={value > 99 ? 30 : 40}
          fontWeight={900}
          paintOrder="stroke"
          stroke="#3a0a08"
          strokeLinejoin="round"
          strokeWidth="3.8"
          style={{ fontVariantNumeric: "tabular-nums" }}
          textAnchor="middle"
          x="44"
          y="39"
        >
          {value}
        </text>
      </svg>
    </span>
  );
};

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
      <AttackPlate
        damageType={plates.damageType}
        value={plates.attack}
        className="-bottom-[0.45em] -left-[0.45em]"
      />
    )}
    <HealthPlate value={plates.hp} />
  </>
);

const effectColor = (card: SkillCardDefinition) => {
  if (card.effect.type === "damageHero") {
    return CREAM;
  }
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

/**
 * The art window. It has the same shape on all cards: the bottom plates show
 * the kind of card.
 */
const artWindowStyle = (rank: RankId): CSSProperties => ({
  border: `0.14em solid ${RANK_COLORS[rank]}`,
  borderRadius: "0.55em",
});

/** The art that loaded in this page session. A new frame shows it at once, with no placeholder. */
const loadedArt = new Set<string>();

/**
 * The placeholder while the art loads for the first time: the dark Well of an
 * empty Hand Slot with the faded Heynbord emblem, which pulses slowly.
 */
const ArtPlaceholder = () => (
  <span className="absolute inset-0 grid place-items-center bg-[#1f140b] shadow-[inset_0_0.35em_0.8em_rgba(0,0,0,0.7)]">
    <HeynbordEmblem className="w-[3.6em] opacity-[0.16] grayscale motion-safe:animate-pulse" />
  </span>
);

/**
 * The art of a card or a Token. One with no art yet shows its Race or Class
 * emblem on the color of the Race.
 */
const CardArt = ({ face }: { readonly face: FrameFace }) => {
  const [missing, setMissing] = useState(() => !face.hasArt);
  const [loaded, setLoaded] = useState(() => loadedArt.has(face.art));
  const { backdrop } = face;
  const markLoaded = () => {
    loadedArt.add(face.art);
    setLoaded(true);
  };
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
    <>
      {loaded ? null : <ArtPlaceholder />}
      <img
        // The image can load before hydration, and then `onLoad` does not fire.
        ref={(img) => {
          if (!loaded && img?.complete && img.naturalWidth > 0) {
            markLoaded();
          }
        }}
        src={face.art}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        onLoad={markLoaded}
        onError={() => setMissing(true)}
        className={cn(
          "relative size-full object-cover transition-opacity duration-200 motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </>
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
      style={artWindowStyle(rank)}
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
