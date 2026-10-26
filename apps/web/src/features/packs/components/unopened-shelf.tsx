import type { RaceId, UnopenedPackPool } from "@workspace/rules";
import { cn } from "cn";
import { useMemo, useState } from "react";
import { Button, TooltipTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog } from "@/core/components/game/game-dialog";
import { GameTooltip } from "@/core/components/game/game-tooltip";
import { nightPlateStyles } from "@/core/components/game/surfaces";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { raceGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { RACES_WITH_CARDS } from "@/features/deck/deck";
import { PackArt } from "@/features/packs/components/pack-art";
import type { UnopenedGroup } from "@/features/packs/packs";
import {
  SHELF_FREE_SHADOW,
  SHELF_LAMP,
  SHELF_LAMP_ARRIVAL,
  SHELF_LIP_SHADOW,
  SHELF_TAG_SHADOW,
} from "@/features/packs/tokens";

/** The HUD plate of the top band (DESIGN.md, HUD plate). */
const PLATE = cn(nightPlateStyles({ padding: "none" }), "flex items-end");

/**
 * The tag of the shelf: a parchment label that names the gift. It hangs at
 * the left of the packs, turned a little, with the total in the gift.
 */
const TAG = cn(
  "border-frame-wood bg-parchment text-ink relative z-10 mb-1.5 flex shrink-0 -rotate-2 flex-col items-start rounded-[6px] border-2 px-2 py-1 max-[1099px]:sr-only [@media(max-height:699px)]:flex-row [@media(max-height:699px)]:items-baseline [@media(max-height:699px)]:gap-1 [@media(max-height:699px)]:px-1.5 [@media(max-height:699px)]:py-0.5",
  SHELF_TAG_SHADOW
);

/**
 * The gold Free tag that hangs on the corner of an owned Pack. A Race version
 * Pack adds its kind under the price, so the two labels never fight for room.
 */
const FREE_TAG = cn(
  "border-gold-deep from-gold-light to-gold text-ink-on-gold absolute -top-1 right-0 z-20 -rotate-6 rounded-[3px] border-2 bg-gradient-to-b px-1.5 py-0.5 text-[9px] leading-none font-black tracking-[0.02em] [@media(max-height:500px)]:px-1 [@media(max-height:500px)]:text-[8px]",
  SHELF_FREE_SHADOW
);

/** The Night Plate of the count, as the `×N` plate of the Open ×10 grid. */
const COUNT = cn(
  "border-gold-trim/70 bg-night-plate/95 text-gold-light absolute right-0 bottom-0 z-20 rounded-[4px] border px-1 py-0.5 text-[10px] leading-none font-black tabular-nums [@media(max-height:500px)]:px-0.5 [@media(max-height:500px)]:text-[9px]",
  SHELF_TAG_SHADOW
);

/**
 * The Race choice of a `race` Unopened Pack: a parchment dialog with one
 * button for each Race, as the Race group of the pool plate. A Race opens the
 * Pack at once.
 */
const RaceDialog = ({
  group,
  onClose,
  onRace,
}: {
  readonly group: UnopenedGroup | null;
  readonly onClose: () => void;
  readonly onRace: (group: UnopenedGroup, race: RaceId) => void;
}) => {
  const { tr } = useGameText();
  return (
    <GameDialog
      isOpen={group !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={tr("packs.unopened.raceTitle")}
      closeLabel={tr("packs.unopened.raceClose")}
      className="text-left"
      testId="unopened-race-dialog"
    >
      {group ? (
        <>
          <p className="text-ink-soft mt-3 text-sm leading-snug [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-xs">
            {tr("packs.unopened.raceText", {
              pack: tr(`packs.names.${group.pack}`),
            })}
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2 [@media(max-height:500px)]:mt-2">
            {RACES_WITH_CARDS.map((race) => (
              <li key={race}>
                <GameButton
                  intent="wood"
                  className="w-full flex-col gap-1 py-2 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:py-1"
                  onPress={() => onRace(group, race)}
                  data-testid={`unopened-race-${race}`}
                >
                  <GlyphIcon glyph={raceGlyph(race)} className="size-5" />
                  <span className="text-sm font-bold">
                    {tr(`races.${race}`)}
                  </span>
                </GameButton>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </GameDialog>
  );
};

/**
 * The Unopened Packs (Economy 3.1): the Packs that the Player got as a reward,
 * standing on a small shelf. The painted Pack is the button, not a label on a
 * button: a gold Free tag, a stack of Pack edges and a `×N` plate tell the
 * price and the count. A press opens the first Pack of the group for free. A
 * `race` Pack asks for the Race first, as a bought Race Pack does. With no
 * Unopened Pack, the shelf is not there.
 */
export const UnopenedShelf = ({
  groups,
  onOpen,
}: {
  readonly groups: readonly UnopenedGroup[];
  readonly onOpen: (index: number, pool: UnopenedPackPool) => void;
}) => {
  const { tr, locale } = useGameText();
  const [picking, setPicking] = useState<UnopenedGroup | null>(null);
  const count = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const total = useMemo(
    () => groups.reduce((sum, group) => sum + group.count, 0),
    [groups]
  );
  if (groups.length === 0 && picking === null) {
    return null;
  }
  return (
    <section
      aria-label={tr("packs.unopened.label")}
      className={cn(PLATE, "relative max-w-full min-w-0 gap-2 py-1 pr-2 pl-1")}
      data-testid="unopened-shelf"
      data-shop-avoid="right"
    >
      {/* The warm lamp light of the shelf: a soft tint, and one glow on arrival. */}
      <span
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: SHELF_LAMP }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-xl motion-safe:animate-[gift-shelf-glow_1500ms_ease-out_both] motion-reduce:opacity-0"
        style={{ background: SHELF_LAMP_ARRIVAL }}
        aria-hidden
      />
      <span className={TAG} aria-hidden>
        <span className="font-display text-[11px] leading-none font-bold [@media(max-height:699px)]:text-[9px]">
          {tr("packs.unopened.label")}
        </span>
        {total > 1 ? (
          <span className="mt-0.5 text-[13px] leading-none font-black tabular-nums [@media(max-height:699px)]:mt-0 [@media(max-height:699px)]:text-[10px]">
            {tr("packs.unopened.count", { count: count.format(total) })}
          </span>
        ) : null}
      </span>
      <div className="relative z-10 min-w-0">
        <ul className="flex items-end gap-2.5 pb-[6px]">
          {groups.map((group, index) => {
            const name = tr(`packs.names.${group.pack}`);
            const left = tr("packs.unopened.left", {
              count: count.format(group.count),
            });
            const leftId = `unopened-left-${group.pack}-${group.version}`;
            return (
              <li
                key={`${group.pack}-${group.version}`}
                className="shrink-0 motion-safe:animate-[gift-shelf-in_420ms_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <TooltipTrigger delay={350}>
                  <Button
                    aria-label={tr(
                      group.version === "race"
                        ? "packs.unopened.openRaceLabel"
                        : "packs.openFreeLabel",
                      { pack: name }
                    )}
                    aria-describedby={group.count > 1 ? leftId : undefined}
                    onPress={() => {
                      if (group.version === "race") {
                        setPicking(group);
                      } else {
                        onOpen(group.firstIndex, { kind: "all" });
                      }
                    }}
                    className="group/pack group/stand data-[focus-visible]:ring-focus-cream relative flex cursor-pointer flex-col items-center rounded-lg outline-none select-none data-[focus-visible]:ring-4 data-[hovered]:-translate-y-0.5 data-[pressed]:translate-y-0 data-[pressed]:brightness-95 motion-safe:transition-transform motion-safe:duration-150"
                    data-testid={`unopened-open-${group.pack}-${group.version}`}
                    data-count={group.count}
                  >
                    <span className="relative block h-12 pr-1.5 [@media(max-height:500px)]:h-11 [@media(min-height:700px)]:h-16">
                      {/* The Pack edges behind the front Pack: one for a second
                          Pack, two for three or more. */}
                      {group.count >= 3 ? (
                        <PackArt
                          pack={group.pack}
                          pool={{ kind: "all" }}
                          className="absolute right-0 bottom-[5%] h-[78%] opacity-50 brightness-[0.55] saturate-[0.7]"
                        />
                      ) : null}
                      {group.count > 1 ? (
                        <PackArt
                          pack={group.pack}
                          pool={{ kind: "all" }}
                          className={cn(
                            "absolute bottom-[2%] h-[87%] opacity-65 brightness-[0.65] saturate-[0.8]",
                            group.count >= 3 ? "right-[3px]" : "right-0"
                          )}
                        />
                      ) : null}
                      <PackArt
                        pack={group.pack}
                        pool={{ kind: "all" }}
                        sheen
                        className="relative z-10 h-full"
                      />
                      <span className={FREE_TAG}>
                        <span className="block">
                          {tr("packs.unopened.free")}
                        </span>
                        {group.version === "race" ? (
                          <span className="border-gold-deep/35 mt-0.5 block border-t pt-0.5 text-[8px] leading-none tracking-[0.02em] [@media(max-height:699px)]:mt-0 [@media(max-height:699px)]:pt-0.5 [@media(max-height:699px)]:text-[6px]">
                            {tr("packs.pool.race")}
                          </span>
                        ) : null}
                      </span>
                      {group.count > 1 ? (
                        <span className={COUNT} aria-hidden>
                          {tr("packs.unopened.count", {
                            count: count.format(group.count),
                          })}
                        </span>
                      ) : null}
                    </span>
                  </Button>
                  <GameTooltip
                    placement="bottom"
                    offset={10}
                    className="border-gold-trim/70 bg-night-plate/95 text-cream shadow-piece rounded-lg border-2 px-2.5 py-1 text-xs font-semibold"
                  >
                    {name}
                    <span className="text-gold-light">
                      {" · "}
                      {tr("packs.unopened.free")}
                    </span>
                    {group.count > 1 ? (
                      <span className="text-cream-dim">
                        {" · "}
                        {tr("packs.unopened.count", {
                          count: count.format(group.count),
                        })}
                      </span>
                    ) : null}
                  </GameTooltip>
                </TooltipTrigger>
                {group.count > 1 ? (
                  <span id={leftId} className="sr-only">
                    {left}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {/* The wood lip that the Packs stand on. */}
        <span
          className="border-wood-edge from-wood-light to-wood pointer-events-none absolute inset-x-0 bottom-0 h-2 rounded-[3px] border-2 bg-gradient-to-b"
          style={{ boxShadow: SHELF_LIP_SHADOW }}
          aria-hidden
        />
      </div>
      <RaceDialog
        group={picking}
        onClose={() => setPicking(null)}
        onRace={(group, race) => {
          setPicking(null);
          onOpen(group.firstIndex, { kind: "race", race });
        }}
      />
    </section>
  );
};
