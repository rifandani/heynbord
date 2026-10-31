import { RegistryContext, useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import type { ReactNode } from "react";
import { useCallback, useContext, useRef, useState } from "react";
import {
  Button,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { unlockAudio } from "@/core/audio/audio";
import { GameCloseButton } from "@/core/components/game/game-button";
import { GAME_SCRIM } from "@/core/components/game/game-scrim";
import { ChevronRightIcon, CloseIcon } from "@/core/components/game/icons";
import type { BattleOptions } from "@/features/battle/battle-session";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { StoryPlayer } from "@/features/campaign/components/story-player";
import type { StoryKind } from "@/features/campaign/story-scenes";
import {
  availableStories,
  finishStory,
  pendingBossStory,
  pendingStory,
  seenStory,
  storyMedia,
} from "@/features/campaign/story-scenes";
import { profileAtom } from "@/features/profile/profile.atoms";

/**
 * The moment of each scene that the Story menu shows as its still: the Region
 * reveal, the confrontation, and the reward or clue at the end.
 */
const MENU_STILL: Readonly<Record<StoryKind, number>> = {
  opening: 2,
  boss: 2,
  ending: 3,
};

/**
 * The Story controls of one Region visit. The trigger sits in the Region
 * banner; the menu and the player open over the map. An unseen scene starts by
 * itself, and its own save clears it.
 */
export interface RegionStoryControls {
  readonly available: readonly StoryKind[];
  readonly seen: ReadonlySet<StoryKind>;
  readonly choosing: boolean;
  readonly kind: StoryKind | null;
  readonly setTrigger: (element: HTMLButtonElement | null) => void;
  readonly open: () => void;
  readonly close: (open: boolean) => void;
  readonly play: (scene: StoryKind) => void;
  readonly finish: () => void;
}

export const useRegionStory = (
  region: number,
  ready: boolean
): RegionStoryControls => {
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const [choosing, setChoosing] = useState(false);
  const [picked, setPicked] = useState<StoryKind | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const setTrigger = useCallback((element: HTMLButtonElement | null) => {
    trigger.current = element;
  }, []);
  const available = ready ? availableStories(profile, region) : [];
  // A scene that the Player has not watched yet starts by itself. The finish
  // records it in the Profile, so the next render has no pending scene.
  const kind = picked ?? (ready ? pendingStory(profile, region) : null);
  const finish = () => {
    if (kind) {
      registry.set(
        profileAtom,
        finishStory(registry.get(profileAtom), region, kind)
      );
    }
    setPicked(null);
    trigger.current?.focus();
  };
  return {
    available,
    seen: new Set(
      available.filter((scene) => seenStory(profile, region, scene))
    ),
    choosing,
    kind,
    setTrigger,
    open: () => {
      unlockAudio();
      setChoosing(true);
    },
    close: setChoosing,
    play: (scene) => {
      unlockAudio();
      setChoosing(false);
      setPicked(scene);
    },
    finish,
  };
};

/**
 * The Story menu: one folio of the Region's scenes. Each scene shows the still
 * of its key moment, its name and a small line that tells what it holds. A
 * scene that the Player has not watched yet carries the gold New chip. A press
 * plays the scene over the map.
 */
export const RegionStory = ({
  region,
  story,
}: {
  readonly region: number;
  readonly story: RegionStoryControls;
}) => {
  const { tr } = useGameText();
  const { available, seen, choosing, kind, close, play, finish } = story;
  return (
    <>
      {choosing ? (
        <ModalOverlay isOpen onOpenChange={close} className={GAME_SCRIM}>
          <Modal className="border-frame-wood bg-parchment text-ink fade-in zoom-in-95 animate-in max-h-[calc(100dvh-2rem)] w-[min(500px,94vw)] overflow-y-auto rounded-2xl border-4 p-5 shadow-2xl duration-200 motion-reduce:animate-none [@media(max-height:500px)]:max-h-[calc(100dvh-1rem)] [@media(max-height:500px)]:p-3">
            <Dialog className="outline-none" data-testid="story-menu">
              {({ close: closeMenu }) => (
                <>
                  <header className="flex items-center gap-3 text-left">
                    <span
                      className="border-bronze-rim bg-night-plate shadow-piece grid size-11 shrink-0 place-items-center rounded-full border-2 [@media(max-height:500px)]:size-9"
                      aria-hidden
                    >
                      <GlyphIcon
                        glyph="book"
                        className="text-ready-gold size-5 [@media(max-height:500px)]:size-4"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Heading
                        slot="title"
                        className="font-display text-ink text-2xl leading-none font-black [@media(max-height:500px)]:text-xl"
                      >
                        {tr("story.label")}
                      </Heading>
                      <p className="text-ink-soft mt-1 truncate text-xs font-semibold">
                        {tr(`campaign.regions.${region}`)}
                      </p>
                    </div>
                    <GameCloseButton
                      label={tr("story.close")}
                      onPress={closeMenu}
                      className="size-10 shrink-0 [@media(max-height:500px)]:size-9"
                      data-testid="story-menu-close"
                    >
                      <CloseIcon className="size-5" />
                    </GameCloseButton>
                  </header>
                  <span className="mt-3 flex items-center gap-2" aria-hidden>
                    <span className="to-parchment-rule h-px flex-1 bg-gradient-to-r from-transparent" />
                    <span className="bg-bronze size-1 rotate-45" />
                    <span className="to-parchment-rule h-px flex-1 bg-gradient-to-l from-transparent" />
                  </span>
                  <ul className="mt-3 flex flex-col gap-2">
                    {available.map((scene, index) => (
                      <li key={scene}>
                        <Button
                          autoFocus={index === 0}
                          onPress={() => play(scene)}
                          aria-label={tr(`story.${scene}`)}
                          aria-describedby={`story-summary-${scene}`}
                          className={cn(
                            "group border-parchment-rule bg-parchment flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 p-2 text-left outline-none",
                            "transition-[background-color,border-color,translate,box-shadow] duration-150",
                            "data-[hovered]:border-gold data-[hovered]:bg-parchment-lit data-[hovered]:-translate-y-0.5",
                            "data-[focus-visible]:ring-gold-deep data-[focus-visible]:ring-4 data-[pressed]:translate-y-px",
                            "motion-reduce:transition-none motion-reduce:data-[hovered]:translate-y-0",
                            "[@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-1.5"
                          )}
                          data-testid={`story-choice-${scene}`}
                        >
                          <span className="border-frame-wood bg-night-plate shadow-piece relative block w-28 shrink-0 overflow-hidden rounded-lg border-2 [@media(max-height:500px)]:w-20">
                            <img
                              src={`${storyMedia(region, scene, MENU_STILL[scene])}.webp`}
                              alt=""
                              draggable={false}
                              className="aspect-video w-full object-cover transition-[filter] duration-150 group-data-[hovered]:brightness-105"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="font-display text-ink text-lg leading-tight font-bold [@media(max-height:500px)]:text-base">
                                {tr(`story.${scene}`)}
                              </span>
                              {seen.has(scene) ? null : (
                                <span
                                  className="border-gold-deep from-gold-light to-gold text-ink-on-gold rounded-sm border-2 bg-gradient-to-b px-1 py-0.5 text-[10px] leading-none font-black tracking-[0.04em] uppercase"
                                  aria-hidden
                                >
                                  {tr("story.new")}
                                </span>
                              )}
                            </span>
                            <span
                              id={`story-summary-${scene}`}
                              className="text-ink-soft mt-0.5 block truncate text-xs font-medium [@media(max-height:500px)]:text-[11px]"
                            >
                              {tr(`story.summary.${scene}`)}
                              {seen.has(scene) ? null : (
                                <span className="sr-only">
                                  {`. ${tr("story.new")}`}
                                </span>
                              )}
                            </span>
                          </span>
                          <ChevronRightIcon className="text-ink-faded group-data-[hovered]:text-gold-deep size-4 shrink-0 transition-colors duration-150" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Dialog>
          </Modal>
        </ModalOverlay>
      ) : null}
      {kind ? (
        <StoryPlayer region={region} kind={kind} onFinish={finish} />
      ) : null}
    </>
  );
};

/**
 * Fight on a Boss Stage first plays its unseen Boss scene. Fight or Skip at
 * its end records the viewing and starts the Battle; a later Fight starts the
 * Battle directly.
 */
export const useBossStory = (
  region: number,
  onStart: (options: BattleOptions) => void
) => {
  const registry = useContext(RegistryContext);
  const [fight, setFight] = useState<BattleOptions | null>(null);
  const handleStart = (options: BattleOptions) => {
    if (pendingBossStory(registry.get(profileAtom), options.stageId)) {
      setFight(options);
    } else {
      onStart(options);
    }
  };
  const scene: ReactNode = fight ? (
    <StoryPlayer
      region={region}
      kind="boss"
      toBattle
      onFinish={() => {
        registry.set(
          profileAtom,
          finishStory(registry.get(profileAtom), region, "boss")
        );
        setFight(null);
        onStart(fight);
      }}
    />
  ) : null;
  return { handleStart, scene };
};
