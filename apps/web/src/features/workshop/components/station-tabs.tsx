import { cn } from "cn";
import {
  SelectionIndicator,
  Tab,
  TabList,
  ToggleButton,
} from "react-aria-components";

import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { Glyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import type { Station } from "@/features/workshop/workshop";
import { STATIONS } from "@/features/workshop/workshop";

/**
 * The glyph of each station. The anvil of the smith for Combine, the forge
 * fire for Craft, and a card that melts into a drop for Extract. The Goblin
 * cog is not used: the Race filter shows it in the same plate.
 */
const STATION_GLYPH: Readonly<Record<Station, Glyph>> = {
  combine: "anvil",
  craft: "forge",
  extract: "melt",
};

/**
 * The gold plate of the selected station, as the gold plate of the filters.
 * It is one piece: when the station changes, it slides to the new tab.
 */
const PLATE = cn(
  "absolute inset-0 -z-10 rounded-lg border-2 border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] shadow-[0_2px_0_rgba(60,30,5,0.55)]",
  "motion-safe:transition-[translate,width,height] motion-safe:duration-[240ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
);

/** The number of a station, or its level lock. */
const CountChip = ({
  count,
  lock,
  selected,
}: {
  readonly count: number;
  readonly lock: number | null;
  readonly selected: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "flex h-6 min-w-6 shrink-0 items-center justify-center gap-0.5 rounded-full border px-1.5 text-xs leading-none font-black tabular-nums [@media(max-height:500px)]:h-[18px] [@media(max-height:500px)]:min-w-[18px] [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[10px]",
        selected
          ? "border-[#7a5310] bg-[#2a1a05]/85 text-[#ffe08a]"
          : "border-[#e9c46a]/40 bg-[#3a2a1c] text-[#fff6df]",
        !selected && count === 0 && lock === null && "text-[#e8d9bb]/60"
      )}
      aria-hidden
    >
      {lock === null ? (
        count
      ) : (
        <>
          <GlyphIcon glyph="lock" className="size-3 shrink-0" />
          {tr("workshop.station.craft.locked", { level: lock })}
        </>
      )}
    </span>
  );
};

/**
 * The station switch of the Workshop (GDD 7.4): one tab for each action, at
 * the top of the work area. Each tab has its glyph, its name in Cinzel, its
 * recipe in one line, and its number: the cards with a pair, the cards that
 * the Player can Craft now, or the spare copies. The selected station is the
 * gold plate, as the current Town Bar shortcut. The arrow keys move between
 * the stations. On a screen narrower than 1200px the recipe goes, and on a
 * short screen only the glyph and the number show; the name stays for screen
 * readers. Below the Craft level, the Craft tab shows its lock and level.
 */
export const StationTabs = ({
  counts,
  craftLock,
}: {
  readonly counts: Readonly<Record<Station, number>>;
  /** The Craft level while the Player level is below it, else `null`. */
  readonly craftLock: number | null;
}) => {
  const { tr } = useGameText();
  return (
    <TabList
      aria-label={tr("workshop.stations")}
      className="pointer-events-auto flex gap-1 rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/90 p-1 shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:gap-0.5 [@media(max-height:500px)]:rounded-lg [@media(max-height:500px)]:p-0.5"
      data-testid="workshop-stations"
    >
      {STATIONS.map((station) => {
        const lock = station === "craft" ? craftLock : null;
        const name = tr(`workshop.station.${station}.name`);
        return (
          <Tab
            key={station}
            id={station}
            className={({ isSelected }) =>
              cn(
                "relative isolate flex h-11 cursor-pointer items-center gap-2 rounded-lg px-2.5 transition-colors duration-200 outline-none select-none",
                "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
                "[@media(max-height:500px)]:h-8 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:px-1.5",
                isSelected
                  ? "text-[#2a1a05]"
                  : "text-[#fff6df] data-[hovered]:bg-[#fff6df]/10"
              )
            }
            data-testid={`workshop-station-${station}`}
            data-count={counts[station]}
            data-locked={lock === null ? undefined : true}
          >
            {({ isSelected }) => (
              <>
                <GlyphIcon
                  glyph={STATION_GLYPH[station]}
                  className={cn(
                    "size-6 shrink-0 [@media(max-height:500px)]:size-5",
                    !isSelected && "text-[#e9c46a]"
                  )}
                />
                <span className="flex flex-col items-start gap-1">
                  <span className="font-display text-[15px] leading-none font-bold [@media(max-height:500px)]:text-[13px]">
                    {name}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] leading-none font-semibold whitespace-nowrap max-[1199px]:hidden [@media(max-height:500px)]:hidden",
                      isSelected ? "text-[#2a1a05]/80" : "text-[#e8d9bb]"
                    )}
                  >
                    {tr(`workshop.station.${station}.recipe`)}
                  </span>
                </span>
                <CountChip
                  count={counts[station]}
                  lock={lock}
                  selected={isSelected}
                />
                <span className="sr-only">
                  {lock === null
                    ? tr(`workshop.station.${station}.count`, {
                        count: counts[station],
                      })
                    : tr("workshop.station.craft.lockedLabel", { level: lock })}
                </span>
                <SelectionIndicator isSelected={isSelected} className={PLATE} />
              </>
            )}
          </Tab>
        );
      })}
    </TabList>
  );
};

/**
 * The ready filter of a station, beside the station tabs: "Pairs only", "Can
 * Craft" or "Spare only". It is in the top bar, not in the filter row of the
 * grid, so that the filter row stays one line in all languages on a short
 * screen. When it is on, the grid keeps only the
 * cards that the station can act on now, and its strip is gold. Each station
 * keeps its own filter.
 */
export const ReadyToggle = ({
  station,
  isSelected,
  onChange,
}: {
  readonly station: Station;
  readonly isSelected: boolean;
  readonly onChange: (selected: boolean) => void;
}) => {
  const { tr } = useGameText();
  return (
    <ToggleButton
      isSelected={isSelected}
      onChange={onChange}
      className={({ isSelected: on }) =>
        cn(
          "pointer-events-auto flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border-2 px-2.5 text-xs font-bold whitespace-nowrap transition-colors duration-200 outline-none select-none",
          "data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8]",
          "[@media(max-height:500px)]:h-6 [@media(max-height:500px)]:gap-0.5 [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[11px]",
          on
            ? "border-[#7a5310] bg-gradient-to-b from-[#ffe08a] to-[#e2a93b] text-[#2a1a05]"
            : "border-[#e9c46a]/45 bg-[#1c140e]/70 text-[#fff6df]/85 data-[hovered]:bg-[#fff6df]/10 data-[hovered]:text-[#fff6df]"
        )
      }
      data-testid="workshop-ready"
      data-station={station}
    >
      <GlyphIcon
        glyph={STATION_GLYPH[station]}
        className="size-3.5 shrink-0 [@media(max-height:500px)]:size-3"
      />
      {tr(`workshop.station.${station}.ready`)}
    </ToggleButton>
  );
};
