import { cn } from "cn";
import type { ReactNode } from "react";
import {
  Label,
  Radio,
  RadioGroup,
  SelectionIndicator,
} from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph, raceGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import type {
  KindFilter,
  OwnershipFilter,
  PoolFilter,
} from "@/features/deck/deck";
import {
  CLASSES_WITH_CARDS,
  classText,
  RACES_WITH_CARDS,
} from "@/features/deck/deck";

const OWNERSHIP: readonly OwnershipFilter[] = ["all", "owned", "notOwned"];
const KINDS: readonly KindFilter[] = ["all", "creature", "skill"];

/**
 * The surface under the filters: the parchment page of the Deck builder, or a
 * Night Plate of a screen over a painting (the Workshop).
 */
export type FilterTone = "parchment" | "night";

const segment =
  (tone: FilterTone) =>
  ({ isSelected }: { readonly isSelected: boolean }) =>
    cn(
      "relative isolate flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-bold whitespace-nowrap transition-colors duration-200 outline-none select-none",
      "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
      "[@media(max-height:500px)]:h-6 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:text-[11px]",
      isSelected && "text-[#2a1a05]",
      !isSelected &&
        (tone === "parchment"
          ? "text-[#5b4632] data-[hovered]:bg-[#f6ead0] data-[hovered]:text-[#2a1d12]"
          : "text-[#fff6df]/85 data-[hovered]:bg-[#fff6df]/10 data-[hovered]:text-[#fff6df]")
    );

const STRIP: Readonly<Record<FilterTone, string>> = {
  parchment: "border-[#c9b48c] bg-[#ead9b4]",
  night: "border-[#e9c46a]/45 bg-[#1c140e]/70",
};

/**
 * The gold plate of the selected segment. It is one piece: when the
 * selection changes, it slides along the strip to the new segment.
 */
const segmentPlate = cn(
  "absolute top-0 left-0 -z-10 size-full rounded-md bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[0_1px_2px_rgba(60,30,5,0.45)]",
  "motion-safe:transition-[translate,width,height] motion-safe:duration-[220ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
);

/**
 * One filter of the pool: a row of segments on a strip. The selected segment
 * is gold, as the ribbon of the open Deck, and the gold plate slides to the
 * new segment.
 */
const Segments = <Value extends string>({
  label,
  value,
  options,
  onChange,
  testId,
  tone,
  render,
}: {
  readonly label: string;
  readonly value: Value;
  readonly options: readonly Value[];
  readonly onChange: (value: Value) => void;
  readonly testId: string;
  readonly tone: FilterTone;
  readonly render: (value: Value) => ReactNode;
}) => (
  <RadioGroup
    value={value}
    onChange={(next) => {
      const option = options.find((candidate) => candidate === next);
      if (option) {
        onChange(option);
      }
    }}
    orientation="horizontal"
    className={cn(
      "flex max-w-full flex-wrap items-center gap-0.5 rounded-lg border-2 p-0.5",
      STRIP[tone]
    )}
    data-testid={testId}
  >
    <Label className="sr-only">{label}</Label>
    {options.map((id) => (
      <Radio
        key={id}
        value={id}
        className={segment(tone)}
        data-testid={`${testId}-${id}`}
      >
        {({ isSelected }) => (
          <>
            {render(id)}
            <SelectionIndicator
              isSelected={isSelected}
              className={segmentPlate}
            />
          </>
        )}
      </Radio>
    ))}
  </RadioGroup>
);

/**
 * The filters of the card pool (GDD 6): the card kind and the Ownership in
 * one row, then the Race of a Creature Card or the Class of a Skill Card. The
 * Deck builder and the Workshop use them. `ownershipText` names the
 * Ownership segments: the Workshop says "0 copies" for "notOwned".
 */
export const PoolFilters = ({
  filter,
  onFilter,
  tone = "parchment",
  ownershipText,
}: {
  readonly filter: PoolFilter;
  readonly onFilter: (filter: PoolFilter) => void;
  readonly tone?: FilterTone;
  readonly ownershipText?: (ownership: OwnershipFilter) => string;
}) => {
  const { tr, text } = useGameText();
  const change = (next: Partial<PoolFilter>) =>
    onFilter({ ...filter, ...next });
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 [@media(max-height:500px)]:gap-y-1">
        <Segments
          label={tr("deckBuilder.filters.kind")}
          value={filter.kind}
          options={KINDS}
          onChange={(kind) => change({ kind })}
          testId="pool-filter"
          tone={tone}
          render={(id) => tr(`deckBuilder.filters.${id}`)}
        />
        <Segments
          label={tr("deckBuilder.filters.ownership")}
          value={filter.ownership}
          options={OWNERSHIP}
          onChange={(ownership) => change({ ownership })}
          testId="pool-own"
          tone={tone}
          render={(id) =>
            ownershipText ? ownershipText(id) : tr(`deckBuilder.filters.${id}`)
          }
        />
      </div>
      <div className="flex flex-col items-start gap-1.5 [@media(max-height:500px)]:gap-1">
        {filter.kind === "creature" ? (
          <Segments
            label={tr("deckBuilder.filters.race")}
            value={filter.race}
            options={["all", ...RACES_WITH_CARDS]}
            onChange={(race) => change({ race })}
            testId="pool-race"
            tone={tone}
            render={(id) =>
              id === "all" ? (
                tr("deckBuilder.filters.allRaces")
              ) : (
                <>
                  <GlyphIcon
                    glyph={raceGlyph(id)}
                    className="size-3.5 shrink-0 [@media(max-height:500px)]:size-3"
                  />
                  {tr(`races.${id}`)}
                </>
              )
            }
          />
        ) : null}
        {filter.kind === "skill" ? (
          <Segments
            label={tr("deckBuilder.filters.class")}
            value={filter.classId}
            options={["all", ...CLASSES_WITH_CARDS]}
            onChange={(classId) => change({ classId })}
            testId="pool-class"
            tone={tone}
            render={(id) =>
              id === "all" ? (
                tr("deckBuilder.filters.allClasses")
              ) : (
                <>
                  <GlyphIcon
                    glyph={classGlyph(id)}
                    className="size-3.5 shrink-0 [@media(max-height:500px)]:size-3"
                  />
                  {text(classText(id))}
                </>
              )
            }
          />
        ) : null}
      </div>
    </>
  );
};
