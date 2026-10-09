import { useMediaQuery } from "@reactuses/core";
import type { CreatureCardDefinition, RankId } from "@workspace/rules";
import { getToken, RANKS } from "@workspace/rules";
import { cn } from "cn";
import type { ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import {
  Button,
  Label,
  Link,
  Popover,
  Radio,
  RadioGroup,
  SelectionIndicator,
} from "react-aria-components";

import { cardText, tokenText } from "@/features/battle/card-text";
import { CardDetails } from "@/features/battle/components/card-details";
import { RankGems, TokenFrame } from "@/features/battle/components/card-frame";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { DAMAGE_GLYPH, raceGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import type { Peek } from "@/features/deck/components/use-card-peek";
import {
  isSamePeek,
  useCardPeek,
} from "@/features/deck/components/use-card-peek";
import type { EntryId, GalleryToken } from "@/features/handbook/handbook";
import {
  damageEntryId,
  firstTokenRank,
  keywordEntryId,
  summonersAt,
  TOKEN_GALLERY,
} from "@/features/handbook/handbook";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

const INK_MUTED = "text-[#5b4632]";

const SHORT_SCREEN = "(max-height: 500px)";

type Anchor = RefObject<HTMLElement | null>;

/**
 * The Card Details of a summoner, when they show. They open beside the row of
 * the Token, so that they never cover the values that the Player reads. On a
 * short screen, the page has no room at its side: they open over the name.
 */
type ShowDetails = (target: Peek, name: Anchor, row: Anchor) => ReactNode;

/** A link to an Entry in the text of a Token, as the "See also" links. */
const TERM_LINK =
  "cursor-pointer rounded-sm font-bold text-[#b4521a] underline decoration-[#b4521a]/45 underline-offset-[3px] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-[#b4521a]";

/**
 * A Rank segment. The selected one is gold, as the filters of the Deck
 * builder, and the gold plate slides to the new segment.
 */
const segment = ({ isSelected }: { readonly isSelected: boolean }) =>
  cn(
    "relative isolate flex h-8 min-w-9 cursor-pointer items-center justify-center rounded-md px-2 text-[13px] transition-colors duration-200 outline-none select-none",
    "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
    "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:px-1.5 [@media(max-height:500px)]:text-[11px]",
    isSelected ? "" : "data-[hovered]:bg-[#f6ead0]"
  );

const segmentPlate = cn(
  "absolute top-0 left-0 -z-10 size-full rounded-md bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[0_1px_2px_rgba(60,30,5,0.45)]",
  "motion-safe:transition-[translate,width,height] motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
);

const toRank = (key: string): RankId | null =>
  RANKS.find((rank) => rank === key) ?? null;

/** The Rank of all the Tokens on the page: a row of Rank Gems. */
const RankSwitch = ({
  rank,
  onChange,
}: {
  readonly rank: RankId;
  readonly onChange: (rank: RankId) => void;
}) => {
  const { tr } = useGameText();
  return (
    <RadioGroup
      value={rank}
      onChange={(key) => {
        const next = toRank(key);
        if (next) {
          onChange(next);
        }
      }}
      orientation="horizontal"
      className="flex flex-wrap items-center gap-x-2.5 gap-y-1"
      data-testid="token-gallery-rank"
    >
      <Label className={LABEL}>{tr("handbook.tokenRank")}</Label>
      <div className="flex items-center gap-0.5 rounded-lg border-2 border-[#c9b48c] bg-[#ead9b4] p-0.5">
        {RANKS.map((id) => (
          <Radio
            key={id}
            value={id}
            aria-label={tr(`ranks.${id}`)}
            className={segment}
            data-testid={`token-gallery-rank-${id}`}
          >
            {({ isSelected }) => (
              <>
                <RankGems rank={id} />
                <SelectionIndicator
                  isSelected={isSelected}
                  className={segmentPlate}
                />
              </>
            )}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
};

/**
 * A value that changes with the Rank. A new value rises into its place, so
 * that the eye sees which values the Rank changed.
 */
const RankValue = ({ value }: { readonly value: number }) => (
  <span
    key={value}
    className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1.5 inline-block font-black tabular-nums motion-safe:duration-300"
  >
    {value}
  </span>
);

const Stat = ({
  glyph,
  label,
  value,
}: {
  readonly glyph: Glyph;
  readonly label: string;
  readonly value: number;
}) => (
  <li className="flex items-center gap-1 whitespace-nowrap">
    <GlyphIcon glyph={glyph} className="size-3.5 text-[#7a4c1a]" />
    <span className="font-semibold">{label}</span>
    <RankValue value={value} />
  </li>
);

/** A summoner name. Hover, keyboard focus or a long press shows its card, as in the Deck builder. */
const Summoner = ({
  card,
  rank,
  row,
  bind,
  details,
}: {
  readonly card: CreatureCardDefinition;
  readonly rank: RankId;
  readonly row: Anchor;
  readonly bind: (target: Peek) => object;
  readonly details: ShowDetails;
}) => {
  const { text } = useGameText();
  const trigger = useRef<HTMLButtonElement>(null);
  const target: Peek = { cardId: card.id, rank, from: "handbook" };
  return (
    <li>
      <Button
        ref={trigger}
        {...bind(target)}
        className="cursor-default rounded-sm font-semibold text-[#2a1d12] underline decoration-[#b4521a]/50 decoration-dotted underline-offset-[3px] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-solid"
        data-testid="token-summoner"
        data-card={card.id}
      >
        {text(cardText(card.id, rank).name)}
      </Button>
      {details(target, trigger, row)}
    </li>
  );
};

/** The Rank, the Damage Type, Melee or Ranged, and the Keywords: each one is a link to its Entry. */
const Traits = ({
  token,
  rank,
  onOpen,
}: {
  readonly token: GalleryToken;
  readonly rank: RankId;
  readonly onOpen: (id: EntryId) => void;
}) => {
  const { tr, text } = useGameText();
  const definition = getToken(token.tokenId);
  const content = tokenText(token.tokenId, rank);
  const links: {
    readonly id: EntryId;
    readonly name: string;
    readonly glyph?: Glyph;
  }[] = [
    {
      id: damageEntryId(definition.damageType),
      name: tr(`damageTypes.${definition.damageType}`),
      glyph: DAMAGE_GLYPH[definition.damageType],
    },
    {
      id: definition.range > 0 ? "ranged" : "melee",
      name: text(content.attackType),
      glyph: "range",
    },
    ...content.keywords.map((keyword) => ({
      id: keywordEntryId(keyword.keyword),
      name: text(keyword.name),
    })),
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
      {links.map((link) => (
        <li key={link.id} className="flex items-center gap-1">
          {link.glyph ? (
            <GlyphIcon glyph={link.glyph} className="size-3.5 text-[#7a4c1a]" />
          ) : null}
          <Link
            onPress={() => onOpen(link.id)}
            className={TERM_LINK}
            data-entry={link.id}
          >
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  );
};

/** One Token: its frame at the Rank, its values, its Keywords and the cards that summon it. */
const TokenRow = ({
  token,
  rank,
  onRank,
  onOpen,
  bind,
  details,
}: {
  readonly token: GalleryToken;
  readonly rank: RankId;
  readonly onRank: (rank: RankId) => void;
  readonly onOpen: (id: EntryId) => void;
  readonly bind: (target: Peek) => object;
  readonly details: ShowDetails;
}) => {
  const { tr, text } = useGameText();
  const definition = getToken(token.tokenId);
  const values = definition.ranks[rank];
  const summoners = summonersAt(token, rank);
  const absent = summoners.length === 0;
  const first = firstTokenRank(token);
  const row = useRef<HTMLLIElement>(null);
  return (
    <li
      ref={row}
      className="flex gap-4 border-t border-[#c9b48c]/70 py-3.5 first:border-t-0 first:pt-1 [@media(max-height:500px)]:gap-3 [@media(max-height:500px)]:py-2"
      data-testid="token-gallery-row"
      data-token={token.tokenId}
      data-absent={absent || undefined}
    >
      {/* 90 × 126 px, and 72 × 101 px on a short screen. */}
      <TokenFrame
        tokenId={token.tokenId}
        rank={rank}
        className={cn(
          "mt-1 shrink-0 text-[10px] transition-[filter,opacity] duration-300 [@media(max-height:500px)]:text-[8px]",
          absent && "opacity-55 grayscale-[0.85]"
        )}
      />
      <div className="min-w-0 flex-1 space-y-1.5 text-sm leading-snug [@media(max-height:500px)]:space-y-1 [@media(max-height:500px)]:text-xs">
        <div>
          <h5 className="font-display text-lg leading-tight font-bold text-balance [@media(max-height:500px)]:text-base">
            {text(tokenText(token.tokenId, rank).name)}
            <span className="sr-only">, {tr(`ranks.${rank}`)}</span>
          </h5>
          <p
            className={cn("flex items-center gap-1.5 font-semibold", INK_MUTED)}
          >
            <GlyphIcon
              glyph={raceGlyph(definition.race)}
              className="size-4 shrink-0"
            />
            {tr(`races.${definition.race}`)} · {tr("handbook.names.token")}
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
          <Stat
            glyph="sword"
            label={tr("battle.attack")}
            value={values.attack}
          />
          <Stat glyph="heart" label={tr("battle.hp")} value={values.hp} />
          <Stat
            glyph="speed"
            label={tr("battle.speedStat")}
            value={values.speed}
          />
        </ul>
        <Traits token={token} rank={rank} onOpen={onOpen} />
        {absent ? (
          <p
            className={cn("font-semibold", INK_MUTED)}
            data-testid="token-not-at-rank"
          >
            {tr("handbook.tokenNotAtRank")}{" "}
            <Button
              onPress={() => onRank(first)}
              className={TERM_LINK}
              data-testid="token-first-rank"
            >
              {tr("handbook.tokenFirstRank", { rank: tr(`ranks.${first}`) })}
            </Button>
          </p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={LABEL}>{tr("handbook.summonedBy")}</span>
            <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
              {summoners.map((card) => (
                <Summoner
                  key={card.id}
                  card={card}
                  rank={rank}
                  row={row}
                  bind={bind}
                  details={details}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
};

/**
 * The Tokens in the game, in the Token Entry: each Token that a card summons,
 * at one Rank for all of them, with the cards that summon it at that Rank. A
 * summoner name shows its Card Details out of the page, so that the scroll of
 * the page never cuts them.
 */
export const TokenGallery = ({
  onOpen,
}: {
  readonly onOpen: (id: EntryId) => void;
}) => {
  const { tr } = useGameText();
  const [rank, setRank] = useState<RankId>("common");
  const { peek, bind, hide } = useCardPeek();
  const short = useMediaQuery(SHORT_SCREEN);
  const details: ShowDetails = (target, name, row) =>
    peek && isSamePeek(peek, target) ? (
      <Popover
        triggerRef={short ? name : row}
        isOpen
        isNonModal
        onOpenChange={(open) => {
          if (!open) {
            hide();
          }
        }}
        placement={short ? "top" : "left"}
        offset={12}
        className="fade-in animate-in pointer-events-none duration-150 motion-reduce:animate-none"
        data-testid="token-summoner-peek"
      >
        <CardDetails cardId={target.cardId} rank={target.rank} />
      </Popover>
    ) : null;
  return (
    <section
      aria-labelledby="token-gallery-title"
      className="space-y-2.5 rounded-xl border-2 border-[#c9b48c] bg-[#f1e2c2] px-3.5 pt-3 pb-1.5 shadow-[inset_0_2px_4px_rgba(91,58,30,0.18)] [@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:pt-2"
      data-testid="token-gallery"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h4
          id="token-gallery-title"
          className="font-display text-base leading-tight font-bold"
        >
          {tr("handbook.tokenGallery")}
        </h4>
        {/* The name of the selected Rank. Each Rank segment has its name for a screen reader. */}
        <span
          className="font-display shrink-0 text-sm font-bold text-[#7a4c1a]"
          aria-hidden
          data-testid="token-gallery-rank-name"
        >
          {tr(`ranks.${rank}`)}
        </span>
      </div>
      <RankSwitch rank={rank} onChange={setRank} />
      <ul>
        {TOKEN_GALLERY.map((token) => (
          <TokenRow
            key={token.tokenId}
            token={token}
            rank={rank}
            onRank={setRank}
            onOpen={onOpen}
            bind={bind}
            details={details}
          />
        ))}
      </ul>
    </section>
  );
};
