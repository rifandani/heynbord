import {
  RegistryContext,
  useAtom,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import { lazy, Suspense, useContext, useEffect, useRef } from "react";

import { useEverOpened } from "@/core/hooks/use-ever-opened";
import { useAchievementNotices } from "@/features/achievements/use-achievement-notices";
import {
  setEffectsVolume,
  setMusicEnabled,
  setMusicVolume,
  setSoundEnabled,
  setSoundVolume,
  unlockAudio,
} from "@/features/battle/battle-audio";
import { battleStage } from "@/features/battle/battle-content";
import { soundOnAtom, soundVolumeAtom } from "@/features/battle/battle.atoms";
import {
  dialogOpen,
  isTyping,
} from "@/features/battle/components/battle-input";
import { PortraitGuard } from "@/features/battle/components/portrait-guard";
import { musicTrackFor } from "@/features/battle/music-catalog";
import type { MusicFeature } from "@/features/battle/music-catalog";
import { playMusicSting, playMusicTrack } from "@/features/battle/music-player";
import { qaEnabled, stateFromSearch } from "@/features/battle/qa";
import { installQaHooks } from "@/features/battle/qa-hooks";
import {
  setReducedMotionPreference,
  useReducedMotion,
} from "@/features/battle/scene/reduced-motion";
import { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import {
  campaignRegionAtom,
  chosenRegionAtom,
} from "@/features/campaign/campaign.atoms";
import { useHandbook } from "@/features/handbook/use-handbook";
import { HintBanner } from "@/features/hint/components/hint-banner";
import {
  useHeroHints,
  usePacksHints,
  useTownHints,
} from "@/features/hint/use-hints";
import { profileReadyAtom } from "@/features/profile/profile.atoms";
import { useProfileStore } from "@/features/profile/use-profile-store";
import { useReplayLink } from "@/features/replay/use-replay-link";
import {
  effectsVolumeAtom,
  musicOnAtom,
  musicVolumeAtom,
} from "@/features/settings/settings.atoms";
import { TownBar } from "@/features/town/components/town-bar";
import {
  TownScreen,
  useTownLeave,
} from "@/features/town/components/town-screen";
import type { GameScreen } from "@/features/town/town";
import { gameScreenAtom, townProgressAtom } from "@/features/town/town.atoms";

/*
 * Every screen except the Town loads in its own chunk on first open. The Town,
 * the Town Bar and the Settings dialog stay in the first bundle (issue #139).
 */
const AchievementsScreen = lazy(async () => {
  const module =
    await import("@/features/achievements/components/achievements-screen");
  return { default: module.AchievementsScreen };
});
const BazaarScreen = lazy(async () => {
  const module = await import("@/features/bazaar/components/bazaar-screen");
  return { default: module.BazaarScreen };
});
const CampaignScreen = lazy(async () => {
  const module = await import("@/features/campaign/components/campaign-screen");
  return { default: module.CampaignScreen };
});
const DungeonsScreen = lazy(async () => {
  const module = await import("@/features/dungeons/components/dungeons-screen");
  return { default: module.DungeonsScreen };
});
const HeroScreen = lazy(async () => {
  const module = await import("@/features/hero/components/hero-screen");
  return { default: module.HeroScreen };
});
const HeynspireScreen = lazy(async () => {
  const module =
    await import("@/features/heynspire/components/heynspire-screen");
  return { default: module.HeynspireScreen };
});
const PacksScreen = lazy(async () => {
  const module = await import("@/features/packs/components/packs-screen");
  return { default: module.PacksScreen };
});
const SeaportScreen = lazy(async () => {
  const module = await import("@/features/seaport/components/seaport-screen");
  return { default: module.SeaportScreen };
});
const WorkshopScreen = lazy(async () => {
  const module = await import("@/features/workshop/components/workshop-screen");
  return { default: module.WorkshopScreen };
});
const BattleStage = lazy(async () => {
  const module = await import("@/features/battle/components/battle-stage");
  return { default: module.BattleStage };
});
const HandbookDialog = lazy(async () => {
  const module = await import("@/features/handbook/components/handbook-dialog");
  return { default: module.HandbookDialog };
});

const SCREEN_MUSIC: Partial<Record<GameScreen, MusicFeature>> = {
  heynspire: "heynspire",
  dungeons: "dungeons",
  workshop: "workshop",
  packs: "packs",
  bazaar: "bazaar",
  seaport: "seaport",
  hero: "hero",
  achievements: "achievements",
};

/** The backdrop while a screen chunk loads. The Town Bar stays on top. */
const ScreenLoading = () => (
  <div
    aria-hidden
    className="fixed inset-0 bg-[#1c140e]"
    data-testid="screen-loading"
  />
);

/** The backdrop while the Battle UI chunk loads. */
const BattleLoading = () => {
  const { tr } = useGameText();
  return (
    <div className="fixed inset-0 grid place-items-center bg-[#1c140e] text-[#fff6df]">
      <p className="font-display text-xl">{tr("battle.loading")}</p>
    </div>
  );
};

/**
 * Esc on a screen other than the Town goes back to the Town (GDD 11.4). While
 * a dialog is open, Esc is for the dialog: also when the focus left it, for
 * example after Auto-fill turns itself off, Esc never closes the screen under
 * the dialog.
 */
const useEscToTown = (active: boolean, toTown: () => void) => {
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        !isTyping(event.target) &&
        !dialogOpen()
      ) {
        toTown();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, toTown]);
};

/**
 * The Region that the Campaign shows (GDD 11.5): the Region of the last
 * Battle, so "Back to Campaign" opens it, and the newest unlocked Region when
 * the Player opens the Campaign from another screen.
 */
const useCampaignRegion = (battle: ReturnType<typeof useBattle>) => {
  const region = useAtomValue(campaignRegionAtom);
  const setRegion = useAtomSet(chosenRegionAtom);
  const options = battle.session?.options;
  const stageRegion = options ? battleStage(options)?.region : undefined;
  useEffect(() => {
    if (stageRegion !== undefined) {
      setRegion(stageRegion);
    }
  }, [stageRegion, setRegion]);
  /** Opens a screen. The Campaign then opens at the newest unlocked Region. */
  const withRegion =
    (open: (screen: GameScreen) => void) => (screen: GameScreen) => {
      if (screen === "campaign") {
        setRegion(null);
      }
      open(screen);
    };
  return { region, setRegion, withRegion };
};

/** Unlocks the Web Audio context on the first Player gesture. */
const useAudioUnlock = () => {
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, {
      once: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);
};

/** Picks the music loop for the screen and plays the result sting. */
const useBattleMusic = (
  battle: ReturnType<typeof useBattle>,
  screen: GameScreen
) => {
  const playedResult = useRef<string | null>(null);
  const options = battle.session?.options ?? null;
  const musicFeature = options?.floor
    ? "heynspire"
    : options?.dungeon
      ? "dungeons"
      : (SCREEN_MUSIC[screen] ?? null);
  const track = musicTrackFor(
    options ? battleStage(options) : null,
    battle.session !== null,
    musicFeature
  );
  useEffect(() => playMusicTrack(track), [track]);
  const result = battle.session?.view.result;
  const resultKey =
    result && options
      ? `${options.seed}:${options.stageId}:${result.winner}`
      : null;
  useEffect(() => {
    if (
      result &&
      resultKey &&
      !battle.session?.watching &&
      resultKey !== playedResult.current
    ) {
      playedResult.current = resultKey;
      playMusicSting(result.winner === "player" ? "victory" : "defeat");
    }
  }, [battle.session?.watching, result, resultKey]);
};

/**
 * The game in one route (web ADR-0005): the Town, the Campaign (the Region
 * Map), then the Battle, Heynspire, the Dungeons, the Packs, the Workshop,
 * the Hero screen, the Achievements screen, the Bazaar and the Seaport. The Town Bar shows on each screen except the Battle.
 * A Battle goes back to the screen that started it: the Campaign, Heynspire
 * or the Dungeons.
 */
export const PlayScreen = () => {
  const battle = useBattle();
  const registry = useContext(RegistryContext);
  const soundOn = useAtomValue(soundOnAtom);
  const soundVolume = useAtomValue(soundVolumeAtom);
  const effectsVolume = useAtomValue(effectsVolumeAtom);
  const musicOn = useAtomValue(musicOnAtom);
  const musicVolume = useAtomValue(musicVolumeAtom);
  const reducedMotion = useReducedMotion();
  const [screen, setScreen] = useAtom(gameScreenAtom);
  const campaign = useCampaignRegion(battle);
  const { leaving, open: handleOpen } = useTownLeave(
    screen,
    campaign.withRegion(setScreen)
  );
  const ready = useAtomValue(profileReadyAtom);
  const handbook = useHandbook();
  // A dialog that the Player opened stays in the page, so it can close on its
  // spine. Its chunk loads at the first open.
  const handbookShown = useEverOpened(handbook.isOpen);

  useProfileStore();
  useAchievementNotices();
  // A Replay Link opens Watching a Replay in place of the screen (web ADR-0011).
  useReplayLink({ show: battle.watch, leave: battle.leave });
  useEscToTown(screen !== "town" && !battle.session, () => setScreen("town"));
  // Heynspire opens with the first win of the last Boss Stage. When it is
  // not open (for example after a change in the dev panel), its screen goes
  // back to the Town.
  const { heynspireOpen } = useAtomValue(townProgressAtom);
  useEffect(() => {
    if (ready && screen === "heynspire" && !heynspireOpen) {
      setScreen("town");
    }
  }, [ready, screen, heynspireOpen, setScreen]);
  // A Hint waits for the Profile: the seen list is in it.
  useTownHints(ready && !battle.session, screen === "town");
  usePacksHints(ready && !battle.session && screen === "packs");
  useHeroHints(ready && !battle.session && screen === "hero");

  useEffect(() => setSoundEnabled(soundOn), [soundOn]);
  useEffect(() => setSoundVolume(soundVolume), [soundVolume]);
  useEffect(() => setEffectsVolume(effectsVolume), [effectsVolume]);
  useEffect(() => setMusicEnabled(musicOn), [musicOn]);
  useEffect(() => setMusicVolume(musicVolume), [musicVolume]);
  useAudioUnlock();
  useBattleMusic(battle, screen);
  // The modules outside React, and the CSS, follow the same choice.
  useEffect(() => {
    setReducedMotionPreference(reducedMotion);
    document.documentElement.dataset.reducedMotion = reducedMotion
      ? "true"
      : "false";
  }, [reducedMotion]);
  // The QA states change the Profile, so the hooks wait for it to load. The
  // chunk starts at once, when this module loads, so a test can press a
  // control as soon as the Town opens.
  useEffect(() => {
    if (!(ready && qaEnabled())) {
      return;
    }
    let cancelled = false;
    let uninstall: (() => void) | undefined;
    const install = async () => {
      const cleanup = await installQaHooks(
        registry,
        stateFromSearch(location.search)
      );
      if (cleanup) {
        if (cancelled) {
          cleanup();
        } else {
          uninstall = cleanup;
        }
      }
    };
    void install();
    return () => {
      cancelled = true;
      uninstall?.();
    };
  }, [registry, ready]);

  return (
    <>
      {battle.session ? (
        <Suspense fallback={<BattleLoading />}>
          <BattleStage battle={battle} />
        </Suspense>
      ) : (
        <>
          {screen === "town" ? (
            <TownScreen leaving={leaving} onOpen={handleOpen} />
          ) : (
            <Suspense fallback={<ScreenLoading />}>
              {screen === "campaign" ? (
                <CampaignScreen
                  region={campaign.region}
                  onRegion={(region) => campaign.setRegion(region)}
                  onStart={(next) => battle.start(next)}
                />
              ) : null}
              {screen === "dungeons" ? (
                <DungeonsScreen onStart={(next) => battle.start(next)} />
              ) : null}
              {screen === "heynspire" ? (
                <HeynspireScreen onStart={(next) => battle.start(next)} />
              ) : null}
              {screen === "packs" ? <PacksScreen /> : null}
              {screen === "workshop" ? <WorkshopScreen /> : null}
              {screen === "hero" ? <HeroScreen /> : null}
              {screen === "achievements" ? <AchievementsScreen /> : null}
              {screen === "bazaar" ? <BazaarScreen /> : null}
              {screen === "seaport" ? <SeaportScreen /> : null}
            </Suspense>
          )}
          <TownBar screen={screen} onOpen={handleOpen} />
        </>
      )}
      <HintBanner />
      {handbookShown ? (
        <Suspense fallback={null}>
          <HandbookDialog inBattle={battle.session !== null} />
        </Suspense>
      ) : null}
      <PortraitGuard />
    </>
  );
};
