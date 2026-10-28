import { useAtomValue } from "@effect/atom-react";
import { useEffect, useRef, useState } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import type { StoryKind, StorySpeaker } from "@/features/campaign/story-scenes";
import {
  STORY_LINES,
  STORY_LOOP_START,
  STORY_MOMENTS as MOMENTS,
  storyLineKey,
  storyMedia,
} from "@/features/campaign/story-scenes";
import { useStoryAudio } from "@/features/campaign/use-story-audio";
import { activeDeckClassAtom } from "@/features/deck/deck.atoms";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";

/** The clip plays its action once, then loops its calm tail while the Player reads. */
const holdLoop = async (element: HTMLVideoElement): Promise<void> => {
  element.currentTime = STORY_LOOP_START;
  try {
    await element.play();
  } catch {
    // A blocked restart keeps the last frame, like the poster.
    element.pause();
  }
};

/** Each mounted clip owns its media request, also after a motion-setting change. */
const StoryMotion = ({
  media,
  onHold,
}: {
  readonly media: string;
  readonly onHold: () => void;
}) => {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) {
      return;
    }
    element.src = `${media}.mp4`;
    return () => {
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [media]);
  return (
    <video
      ref={video}
      poster={`${media}.webp`}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={(event) => holdLoop(event.currentTarget)}
      onError={onHold}
      className="absolute inset-0 size-full object-cover"
    />
  );
};

/** A poster remains behind the silent video; a failed load keeps the poster. */
const StoryPainting = ({
  kind,
  moment,
}: {
  readonly kind: StoryKind;
  readonly moment: number;
}) => {
  const still = useReducedMotion();
  const [held, setHeld] = useState(false);
  const media = storyMedia(kind, moment);
  return (
    <div
      className="bg-night-plate absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <img
        src="/battle/hearthvale-region.webp"
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <img
        src={`${media}.webp`}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      {still || held ? null : (
        <StoryMotion media={media} onHold={() => setHeld(true)} />
      )}
    </div>
  );
};

/** The name plate over a spoken line; narration has none. */
const SpeakerPlate = ({ speaker }: { readonly speaker: StorySpeaker }) => {
  const { tr } = useGameText();
  const classId = useAtomValue(activeDeckClassAtom);
  if (speaker === "narrator") {
    return null;
  }
  return (
    <span
      className="mb-2 flex items-center gap-2 [@media(max-height:500px)]:mb-1"
      data-testid="story-speaker"
    >
      {speaker === "hero" ? (
        <HeroPortrait
          classId={classId}
          className="w-9 shrink-0 [@media(max-height:500px)]:w-7"
        />
      ) : null}
      <span
        className={
          speaker === "baron"
            ? "font-display text-shadow-night-plate text-damage-fire text-lg font-bold text-shadow-md [@media(max-height:500px)]:text-base"
            : "font-display text-shadow-night-plate text-gold text-lg font-bold text-shadow-md [@media(max-height:500px)]:text-base"
        }
      >
        {tr(`story.speaker.${speaker}`)}
      </span>
    </span>
  );
};

/**
 * Player-paced Story Moments. The scene fills the screen; the title, Skip,
 * text and controls float over it on dark scrims. Closing or Esc is Skip;
 * media never gates text. A moment can have several lines: Continue shows the
 * next line over the same looping clip. With `toBattle`, the last Continue is
 * Fight.
 */
export const StoryPlayer = ({
  kind,
  onFinish,
  toBattle = false,
}: {
  readonly kind: StoryKind;
  readonly onFinish: () => void;
  readonly toBattle?: boolean;
}) => {
  const { tr } = useGameText();
  const [place, setPlace] = useState({ moment: 0, line: 0 });
  const { moment, line } = place;
  useStoryAudio(kind, moment);
  const lines = STORY_LINES[kind][moment] ?? ["narrator"];
  const speaker = lines[line] ?? "narrator";
  const last = moment === MOMENTS - 1 && line === lines.length - 1;
  const back = () =>
    setPlace(
      line > 0
        ? { moment, line: line - 1 }
        : {
            moment: moment - 1,
            line: (STORY_LINES[kind][moment - 1]?.length ?? 1) - 1,
          }
    );
  const next = () =>
    setPlace(
      line < lines.length - 1
        ? { moment, line: line + 1 }
        : { moment: moment + 1, line: 0 }
    );
  return (
    <ModalOverlay
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onFinish();
        }
      }}
      className="bg-night-plate fixed inset-0 z-90"
    >
      <Modal className="size-full">
        <Dialog
          aria-label={`${tr("campaign.regions.1")} · ${tr(`story.${kind}`)}`}
          data-testid="story-player"
          className="text-cream relative h-dvh w-full overflow-hidden outline-none"
        >
          <StoryPainting key={moment} kind={kind} moment={moment} />
          <header className="from-night-plate/85 absolute inset-x-0 top-0 flex items-center justify-end gap-4 bg-linear-to-b to-transparent px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] pb-10 [@media(max-height:500px)]:pt-[max(0.375rem,env(safe-area-inset-top))] [@media(max-height:500px)]:pb-6">
            <Heading
              slot="title"
              className="font-display text-shadow-night-plate mr-auto text-lg font-bold text-shadow-md [@media(max-height:500px)]:sr-only"
            >
              {tr("campaign.regions.1")} · {tr(`story.${kind}`)}
            </Heading>
            <GameButton onPress={onFinish} data-testid="story-skip">
              {tr("story.skip")}
            </GameButton>
          </header>
          <section className="from-night-plate via-night-plate/85 absolute inset-x-0 bottom-0 bg-linear-to-t to-transparent px-[max(1.5rem,env(safe-area-inset-left))] pt-24 pb-[max(1.25rem,env(safe-area-inset-bottom))] [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-16 [@media(max-height:500px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-3xl">
              <div aria-live="polite" aria-atomic="true">
                <span className="sr-only">
                  {tr("story.moment", { current: moment + 1, total: MOMENTS })}
                </span>
                <SpeakerPlate speaker={speaker} />
                <p
                  className="text-shadow-night-plate min-h-16 text-xl leading-relaxed text-shadow-md [@media(max-height:500px)]:min-h-12 [@media(max-height:500px)]:text-base [@media(max-height:500px)]:leading-snug"
                  data-testid="story-text"
                  data-speaker={speaker}
                >
                  {tr(storyLineKey(kind, moment, line))}
                </p>
              </div>
              <footer className="mt-4 flex items-center justify-between gap-3 [@media(max-height:500px)]:mt-2">
                <GameButton
                  isDisabled={moment === 0 && line === 0}
                  onPress={back}
                >
                  {tr("story.back")}
                </GameButton>
                <span className="flex items-center gap-2" aria-hidden>
                  {Array.from({ length: MOMENTS }, (_, index) => (
                    <span
                      key={index}
                      className={
                        index === moment
                          ? "bg-cream h-2 w-6 rounded-full"
                          : "bg-cream-dim/40 size-2 rounded-full"
                      }
                    />
                  ))}
                </span>
                <GameButton
                  intent="gold"
                  autoFocus
                  onPress={last ? onFinish : next}
                  data-testid="story-continue"
                >
                  {tr(
                    last
                      ? toBattle
                        ? "story.fight"
                        : "story.return"
                      : "story.continue"
                  )}
                </GameButton>
              </footer>
            </div>
          </section>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
