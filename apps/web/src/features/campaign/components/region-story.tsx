import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { ReactNode } from "react";
import { useContext, useRef, useState } from "react";

import { unlockAudio } from "@/core/audio/audio";
import { GameButton } from "@/core/components/game/game-button";
import { GameDialog } from "@/core/components/game/game-dialog";
import type { BattleOptions } from "@/features/battle/battle-session";
import { useGameText } from "@/features/battle/use-game-text";
import { StoryPlayer } from "@/features/campaign/components/story-player";
import type { StoryKind } from "@/features/campaign/story-scenes";
import {
  availableStories,
  finishStory,
  pendingBossStory,
  pendingStory,
} from "@/features/campaign/story-scenes";
import { profileAtom } from "@/features/profile/profile.atoms";

/** Mount once per Region visit. Profile writes cannot start a second automatic scene. */
export const RegionStory = ({ region }: { readonly region: number }) => {
  const { tr } = useGameText();
  const registry = useContext(RegistryContext);
  const profile = useAtomValue(profileAtom);
  const [kind, setKind] = useState<StoryKind | null>(() =>
    pendingStory(profile, region)
  );
  const [choosing, setChoosing] = useState(false);
  const control = useRef<HTMLButtonElement>(null);
  const available = availableStories(profile, region);
  const finish = () => {
    if (kind) {
      registry.set(
        profileAtom,
        finishStory(registry.get(profileAtom), region, kind)
      );
    }
    setKind(null);
    control.current?.focus();
  };
  if (available.length === 0) {
    return null;
  }
  return (
    <>
      <GameButton
        ref={control}
        data-campaign-hud
        data-testid="region-story"
        className="fixed top-24 left-4 [@media(max-height:500px)]:top-16 [@media(max-height:500px)]:left-3"
        onPress={() => {
          unlockAudio();
          setChoosing(true);
        }}
      >
        {tr("story.label")}
      </GameButton>
      <GameDialog
        isOpen={choosing}
        onOpenChange={setChoosing}
        title={tr("story.label")}
        closeLabel={tr("story.close")}
      >
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {available.map((scene) => (
            <GameButton
              key={scene}
              onPress={() => {
                unlockAudio();
                setChoosing(false);
                setKind(scene);
              }}
            >
              {tr(`story.${scene}`)}
            </GameButton>
          ))}
        </div>
      </GameDialog>
      {kind ? <StoryPlayer kind={kind} onFinish={finish} /> : null}
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
