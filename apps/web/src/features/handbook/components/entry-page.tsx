import { cn } from "cn";
import { useEffect, useRef } from "react";
import { Link } from "react-aria-components";

import { RankGems } from "@/features/battle/components/card-frame";
import { useGameText } from "@/features/battle/use-game-text";
import { CoinGuide } from "@/features/handbook/components/coin-guide";
import { LargeIcon } from "@/features/handbook/components/entry-icon";
import { LaneStrip } from "@/features/handbook/components/lane-strip";
import { PlayerLevelGuide } from "@/features/handbook/components/player-level-guide";
import { RankGuide } from "@/features/handbook/components/rank-guide";
import { StarsTable } from "@/features/handbook/components/stars-table";
import type { Entry, EntryId } from "@/features/handbook/handbook";
import { getEntry, RANK_TABLE } from "@/features/handbook/handbook";
import { DIAGRAMS } from "@/features/handbook/handbook-diagrams";

const LABEL =
  "text-[0.6875rem] font-bold tracking-[0.04em] text-[#5b4632] uppercase";

/** Each paragraph of a rule text: the Message Catalog keeps them apart with an empty line. */
const paragraphs = (text: string) => text.split("\n\n");

const Body = ({ entry }: { readonly entry: Entry }) => {
  const { text } = useGameText();
  return (
    <div className="space-y-2.5 text-[0.9375rem] leading-relaxed [@media(max-height:500px)]:space-y-1.5 [@media(max-height:500px)]:text-sm [@media(max-height:500px)]:leading-snug">
      {entry.body.flatMap((ref) =>
        paragraphs(text(ref)).map((paragraph) => (
          <p key={`${ref.key}:${paragraph}`}>{paragraph}</p>
        ))
      )}
    </div>
  );
};

/** N for each Rank, with the Rank Gems: Charge, Knockback and Bleed. */
const RankTable = () => {
  const { tr } = useGameText();
  return (
    <table
      className="w-full max-w-72 border-collapse text-sm"
      data-testid="handbook-rank-table"
    >
      <caption className={cn(LABEL, "pb-1 text-left")}>
        {tr("handbook.rankTable")}
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{tr("handbook.rankColumn")}</th>
          <th scope="col">{tr("handbook.valueColumn")}</th>
        </tr>
      </thead>
      <tbody>
        {RANK_TABLE.map(({ rank, value }) => (
          <tr key={rank} className="border-t border-[#c9b48c]/70">
            <th
              scope="row"
              className="flex items-center gap-2 py-1 text-left font-semibold"
            >
              <span className="w-20 text-[13px]" aria-hidden>
                <RankGems rank={rank} />
              </span>
              {tr(`ranks.${rank}`)}
            </th>
            <td className="py-1 text-right text-base font-black tabular-nums">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const KeywordValue = ({ entry }: { readonly entry: Entry }) => {
  const { tr } = useGameText();
  if (entry.value === "starsTable") {
    return <StarsTable />;
  }
  if (entry.value === "coinTable") {
    return <CoinGuide />;
  }
  if (entry.value === "playerLevelTable") {
    return <PlayerLevelGuide />;
  }
  if (entry.value === "rankTable") {
    return <RankTable />;
  }
  if (entry.value === "rankGuideTable") {
    return <RankGuide />;
  }
  if (entry.value === "card") {
    return (
      <p
        className="text-sm font-semibold text-[#5b4632]"
        data-testid="handbook-see-card"
      >
        {tr("handbook.seeCard")}
      </p>
    );
  }
  return null;
};

const Diagram = ({ entry }: { readonly entry: Entry }) =>
  entry.diagram ? (
    <figure className="rounded-xl border-2 border-[#c9b48c] bg-[#f1e2c2] p-2 shadow-[inset_0_2px_4px_rgba(91,58,30,0.18)]">
      <LaneStrip diagram={DIAGRAMS[entry.diagram]} />
    </figure>
  ) : null;

/** The links to the related Entries, after the rule text. */
const SeeAlso = ({
  entry,
  onOpen,
}: {
  readonly entry: Entry;
  readonly onOpen: (id: EntryId) => void;
}) => {
  const { tr, text } = useGameText();
  if (entry.seeAlso.length === 0) {
    return null;
  }
  return (
    <nav aria-label={tr("handbook.seeAlso")} data-testid="handbook-see-also">
      <h4 className={LABEL}>{tr("handbook.seeAlso")}</h4>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {entry.seeAlso.map((id) => (
          <li key={id}>
            <Link
              onPress={() => onOpen(id)}
              className="inline-flex min-h-8 cursor-pointer items-center rounded-sm text-sm font-bold text-[#b4521a] underline decoration-[#b4521a]/45 underline-offset-[3px] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:decoration-[#b4521a]"
              data-entry={id}
            >
              {text(getEntry(id).name)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/**
 * One Entry (issue #25): its large icon, its name in Cinzel, the rule text in
 * ink, a Rank table, a Lane strip, then "See also". The heading takes the
 * focus when the page opens on a single page.
 */
export const EntryPage = ({
  id,
  onOpen,
  focusOnShow,
}: {
  readonly id: EntryId;
  readonly onOpen: (id: EntryId) => void;
  /** On a single page, the heading takes the focus when the page shows. */
  readonly focusOnShow: boolean;
}) => {
  const { tr, text } = useGameText();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusOnShow) {
      heading.current?.focus();
    }
  }, [focusOnShow]);
  const entry = getEntry(id);
  return (
    <article
      key={id}
      className="fade-in animate-in space-y-4 duration-200 motion-reduce:animate-none [@media(max-height:500px)]:space-y-2.5"
      data-testid="handbook-entry"
      data-entry={id}
    >
      <header className="flex items-center gap-3">
        {entry.icon ? <LargeIcon icon={entry.icon} /> : null}
        <div className="min-w-0">
          <p className={LABEL}>
            {tr(`handbook.chapter.${entry.chapter}.name`)}
          </p>
          <h3
            ref={heading}
            tabIndex={-1}
            className="font-display text-[1.75rem] leading-tight font-black text-balance outline-none [@media(max-height:500px)]:text-xl"
            data-testid="handbook-entry-name"
          >
            {text(entry.name)}
          </h3>
        </div>
      </header>
      <Body entry={entry} />
      <KeywordValue entry={entry} />
      <Diagram entry={entry} />
      <SeeAlso entry={entry} onOpen={onOpen} />
    </article>
  );
};
