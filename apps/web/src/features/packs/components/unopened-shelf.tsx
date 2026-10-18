import type { RaceId, UnopenedPackPool } from "@workspace/rules";
import { cn } from "cn";
import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";
import { HiXMark } from "react-icons/hi2";

import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { raceGlyph } from "@/features/battle/glyphs";
import { useGameText } from "@/features/battle/use-game-text";
import { RACES_WITH_CARDS } from "@/features/deck/deck";
import { PackArt } from "@/features/packs/components/pack-art";
import type { UnopenedGroup } from "@/features/packs/packs";

/** The HUD plate of the top band (DESIGN.md, HUD plate). */
const PLATE =
  "flex items-center rounded-xl border-2 border-[#e9c46a]/70 bg-[#1c140e]/85 text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)]";

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
    <ModalOverlay
      isOpen={group !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      isDismissable
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] [@media(max-height:500px)]:p-2"
    >
      <Modal className="fade-in zoom-in-95 animate-in w-[min(440px,94vw)] rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] text-[#2a1d12] shadow-[0_24px_48px_rgba(0,0,0,0.55)] duration-200 motion-reduce:animate-none">
        <Dialog
          className="px-5 pt-4 pb-5 outline-none [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:pt-2 [@media(max-height:500px)]:pb-3"
          data-testid="unopened-race-dialog"
        >
          {({ close }) =>
            group ? (
              <>
                <div className="flex items-center gap-3 border-b-2 border-[#c9b48c] pb-3 [@media(max-height:500px)]:pb-2">
                  <Heading
                    slot="title"
                    className="font-display flex-1 text-2xl font-black [@media(max-height:500px)]:text-lg"
                  >
                    {tr("packs.unopened.raceTitle")}
                  </Heading>
                  <Button
                    onPress={close}
                    aria-label={tr("packs.unopened.raceClose")}
                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border-2 border-[#2a1a0c] bg-gradient-to-b from-[#7a5233] to-[#563720] text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#fff2a8] data-[hovered]:brightness-110 data-[pressed]:translate-y-px [@media(max-height:500px)]:size-8"
                  >
                    <HiXMark className="size-5" aria-hidden />
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-snug text-[#5b4632] [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-xs">
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
            ) : null
          }
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

/**
 * The Unopened Packs (Economy 3.1): one gold button for each Pack and version,
 * with its painted Pack, the Free tag and the count. A press opens the first
 * Pack of the group for free. A `race` Pack asks for the Race first, as a
 * bought Race Pack does. With no Unopened Pack, the shelf is not there.
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
  if (groups.length === 0 && picking === null) {
    return null;
  }
  return (
    <section
      aria-label={tr("packs.unopened.label")}
      className={cn(PLATE, "gap-1.5 p-1 pr-1.5")}
      data-testid="unopened-shelf"
      data-shop-avoid="right"
    >
      <span className="px-1.5 text-xs leading-tight font-bold text-[#ffe08a] max-[1099px]:sr-only">
        {tr("packs.unopened.label")}
      </span>
      <ul className="flex gap-1.5">
        {groups.map((group) => {
          const name = tr(`packs.names.${group.pack}`);
          return (
            <li key={`${group.pack}-${group.version}`}>
              <GameButton
                intent="gold"
                size="sm"
                className="h-12 gap-1.5 pr-3 pl-1 [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:min-h-9"
                aria-label={tr(
                  group.version === "race"
                    ? "packs.unopened.openRaceLabel"
                    : "packs.openFreeLabel",
                  { pack: name }
                )}
                onPress={() => {
                  if (group.version === "race") {
                    setPicking(group);
                  } else {
                    onOpen(group.firstIndex, { kind: "all" });
                  }
                }}
                data-testid={`unopened-open-${group.pack}-${group.version}`}
                data-count={group.count}
              >
                <PackArt
                  pack={group.pack}
                  pool={{ kind: "all" }}
                  className="h-11 [@media(max-height:500px)]:h-8"
                />
                <span className="text-sm font-black whitespace-nowrap [@media(max-height:500px)]:text-xs">
                  {tr("packs.open")}
                </span>
                {group.count > 1 ? (
                  <span
                    className="rounded-full bg-[#2a1a05] px-1.5 text-xs leading-5 font-black text-[#ffe08a] tabular-nums"
                    aria-hidden
                  >
                    {tr("packs.unopened.count", {
                      count: count.format(group.count),
                    })}
                  </span>
                ) : null}
              </GameButton>
            </li>
          );
        })}
      </ul>
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
