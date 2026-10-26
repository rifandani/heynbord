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
import { WORKSHOP_PLATE_DROP } from "@/features/workshop/tokens";
import type { Station } from "@/features/workshop/workshop";
import { STATIONS, stationLock } from "@/features/workshop/workshop";

/**
 * The glyph of each station. The anvil of the smith for Combine, the forge
 * fire for Craft, the crucible of the goblin tinker for Fuse, and a card that
 * melts into a drop for Extract. The Goblin cog is not used: the Race filter
 * shows it in the same plate.
 */
const STATION_GLYPH: Readonly<Record<Station, Glyph>> = {
  combine: "anvil",
  craft: "forge",
  fuse: "crucible",
  extract: "melt",
};

/**
 * The gold plate of the selected station, as the gold plate of the filters.
 * It is one piece: when the station changes, it slides to the new tab.
 */
const PLATE = cn(
  "border-gold-deep from-gold-light to-gold absolute inset-0 -z-10 rounded-lg border-2 bg-gradient-to-b",
  WORKSHOP_PLATE_DROP,
  "motion-safe:transition-[translate,width,height] motion-safe:duration-[240ms] motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]"
);

/** The number of a station, or its level lock. */
const CountChip = ({
  station,
  count,
  lock,
  selected,
}: {
  readonly station: Station;
  readonly count: number;
  readonly lock: number | null;
  readonly selected: boolean;
}) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "flex h-6 min-w-6 shrink-0 items-center justify-center gap-0.5 justify-self-end rounded-full border px-1.5 text-xs leading-none font-black tabular-nums [grid-area:chip] [@media(max-height:500px)]:h-[18px] [@media(max-height:500px)]:min-w-[18px] [@media(max-height:500px)]:justify-self-start [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[10px]",
        selected
          ? "border-gold-deep bg-ink-on-gold/85 text-gold-light"
          : "border-gold-trim/40 bg-plate-socket text-cream",
        !selected && count === 0 && lock === null && "text-cream-dim"
      )}
      aria-hidden
    >
      {lock === null ? (
        count
      ) : (
        <>
          <GlyphIcon glyph="lock" className="size-3 shrink-0" />
          {/* On a short screen the rail is narrow: the lock and the level
              number only. */}
          <span className="[@media(max-height:500px)]:hidden">
            {tr(`workshop.station.${station}.locked`, { level: lock })}
          </span>
          <span className="hidden [@media(max-height:500px)]:inline">
            {lock}
          </span>
        </>
      )}
    </span>
  );
};

/**
 * The station switch of the Workshop (GDD 7.4): one tab for each action, as a
 * column in the station rail at the left of the grid. Each tab has its glyph,
 * its name in Cinzel with its number at the right, and its recipe under the
 * name: the number is the cards with a pair, the cards that the Player can
 * Craft now, the cards that can go into a Fuse now, or the spare copies. The
 * selected station is the gold plate, as the current Town Bar shortcut; it
 * slides up and down to the new tab. The up and down arrow keys move between
 * the stations. On a short screen the rail is narrow: the glyph and the
 * number, with the name in small Inter under them, and no recipe. Below the
 * Craft and Fuse level, the Craft and Fuse tabs show their lock and level.
 */
export const StationTabs = ({
  counts,
  level,
}: {
  readonly counts: Readonly<Record<Station, number>>;
  /** The Player level, for the lock of a station (`stationLock`). */
  readonly level: number;
}) => {
  const { tr } = useGameText();
  return (
    <TabList
      aria-label={tr("workshop.stations")}
      className="flex flex-col gap-1 [@media(max-height:500px)]:gap-0.5"
      data-testid="workshop-stations"
    >
      {STATIONS.map((station) => {
        const lock = stationLock(station, level);
        const name = tr(`workshop.station.${station}.name`);
        return (
          <Tab
            key={station}
            id={station}
            className={({ isSelected }) =>
              cn(
                "relative isolate grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-lg px-2.5 py-2 transition-colors duration-200 outline-none select-none [grid-template-areas:'glyph_name_chip'_'glyph_recipe_recipe']",
                "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
                "[@media(max-height:500px)]:grid-cols-[auto_auto] [@media(max-height:500px)]:justify-center [@media(max-height:500px)]:gap-x-1 [@media(max-height:500px)]:gap-y-0.5 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:[grid-template-areas:'glyph_chip'_'name_name']",
                isSelected
                  ? "text-ink-on-gold"
                  : "text-cream data-[hovered]:bg-cream/10"
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
                    "size-6 shrink-0 self-start [grid-area:glyph] [@media(max-height:500px)]:size-5 [@media(max-height:500px)]:self-center",
                    !isSelected && "text-gold-trim"
                  )}
                />
                <span className="font-display truncate text-[15px] leading-tight font-bold [grid-area:name] [@media(max-height:500px)]:justify-self-center [@media(max-height:500px)]:font-sans [@media(max-height:500px)]:text-[10px] [@media(max-height:500px)]:leading-none">
                  {name}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-snug font-semibold text-balance [grid-area:recipe] [@media(max-height:500px)]:hidden",
                    isSelected ? "text-ink-on-gold/80" : "text-cream-dim"
                  )}
                >
                  {tr(`workshop.station.${station}.recipe`)}
                </span>
                <CountChip
                  station={station}
                  count={counts[station]}
                  lock={lock}
                  selected={isSelected}
                />
                <span className="sr-only">
                  {lock === null
                    ? tr(`workshop.station.${station}.count`, {
                        count: counts[station],
                      })
                    : tr(`workshop.station.${station}.lockedLabel`, {
                        level: lock,
                      })}
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
 * The ready filter of a station, at the foot of the station rail: "Pairs
 * only", "Can Craft", "Can Fuse" or "Spare only". It is in the rail, not in
 * the filter row of the grid, so that the filter row stays one line in all
 * languages on a short screen, and it stays next to the station that it
 * filters. When it is on, the grid keeps only the cards that the station can
 * act on now, and its strip is gold. Each station keeps its own filter.
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
          "flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-left text-xs leading-tight font-bold transition-colors duration-200 outline-none select-none",
          "data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-4",
          "[@media(max-height:500px)]:min-h-0 [@media(max-height:500px)]:flex-col [@media(max-height:500px)]:gap-0.5 [@media(max-height:500px)]:rounded-md [@media(max-height:500px)]:px-0.5 [@media(max-height:500px)]:py-1 [@media(max-height:500px)]:text-center [@media(max-height:500px)]:text-[10px] [@media(max-height:500px)]:leading-none",
          on
            ? cn(
                "border-gold-deep from-gold-light to-gold text-ink-on-gold bg-gradient-to-b",
                WORKSHOP_PLATE_DROP
              )
            : "border-gold-trim/45 bg-night-plate/70 text-cream/85 data-[hovered]:bg-cream/10 data-[hovered]:text-cream"
        )
      }
      data-testid="workshop-ready"
      data-station={station}
    >
      <GlyphIcon
        glyph={STATION_GLYPH[station]}
        className="size-4 shrink-0 [@media(max-height:500px)]:size-3.5"
      />
      <span className="text-balance">
        {tr(`workshop.station.${station}.ready`)}
      </span>
    </ToggleButton>
  );
};
