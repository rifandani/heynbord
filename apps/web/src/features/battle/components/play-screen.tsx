import {
  RegistryContext,
  useAtom,
  useAtomSet,
  useAtomValue,
} from "@effect/atom-react";
import { cn } from "cn";
import { lazy, Suspense, useContext, useEffect, useMemo } from "react";

import {
  setSoundEnabled,
  setSoundVolume,
} from "@/features/battle/battle-audio";
import { battleStage } from "@/features/battle/battle-content";
import { battlePainting } from "@/features/battle/battle-painting";
import { heroOf } from "@/features/battle/battle-view";
import { soundOnAtom, soundVolumeAtom } from "@/features/battle/battle.atoms";
import type {
  BattleKeyAction,
  BattleKeyCommand,
} from "@/features/battle/components/battle-keys";
import {
  inspectDirection,
  keyCommand,
  logKeyAction,
  nextReadyCard,
} from "@/features/battle/components/battle-keys";
import {
  BattleLogBanner,
  BattleLogPanel,
} from "@/features/battle/components/battle-log-panel";
import { BattlePainting } from "@/features/battle/components/battle-painting";
import { CastCard } from "@/features/battle/components/cast-card";
import { HandBar } from "@/features/battle/components/hand-bar";
import {
  PortraitGuard,
  ResultOverlay,
  TurnBanner,
} from "@/features/battle/components/overlays";
import { TopBar } from "@/features/battle/components/top-bar";
import { TutorialPanel } from "@/features/battle/components/tutorial-panel";
import { UnitDetails } from "@/features/battle/components/unit-details";
import { qaEnabled, stateFromSearch } from "@/features/battle/qa";
import { installTestHooks } from "@/features/battle/test-hooks";
import { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";
import {
  campaignRegionAtom,
  chosenRegionAtom,
} from "@/features/campaign/campaign.atoms";
import { CampaignScreen } from "@/features/campaign/components/campaign-screen";
import { HandbookDialog } from "@/features/handbook/components/handbook-dialog";
import { useHandbook } from "@/features/handbook/use-handbook";
import { HeroScreen } from "@/features/hero/components/hero-screen";
import { HintBanner } from "@/features/hint/components/hint-banner";
import {
  useBattleHints,
  useHeroHints,
  usePacksHints,
  useTownHints,
} from "@/features/hint/use-hints";
import { PacksScreen } from "@/features/packs/components/packs-screen";
import { profileReadyAtom } from "@/features/profile/profile.atoms";
import { useProfileStore } from "@/features/profile/use-profile-store";
import { TownBar } from "@/features/town/components/town-bar";
import {
  TownScreen,
  useTownLeave,
} from "@/features/town/components/town-screen";
import type { GameScreen } from "@/features/town/town";
import { gameScreenAtom } from "@/features/town/town.atoms";
import { WorkshopScreen } from "@/features/workshop/components/workshop-screen";

const BattleCanvas = lazy(
  () => import("@/features/battle/scene/battle-canvas")
);

/** NFR-05: the game needs WebGL 2. */
const hasWebgl2 = (): boolean => {
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
};

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** A key in an open dialog (the Abandon confirm, the result) is for that dialog. */
const inDialog = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('[role="dialog"]') !== null;

type Battle = ReturnType<typeof useBattle>;

/** What a Battle key can act on: the Battle, and the Handbook over it. */
interface KeyContext {
  readonly battle: Battle;
  readonly openHandbook: () => void;
}

/** ArrowLeft and ArrowRight move the selection over the Ready cards. */
const moveSelection = (battle: Battle, event: KeyboardEvent, step: 1 | -1) => {
  const hand = battle.session ? heroOf(battle.session.view, "player").hand : [];
  const next = nextReadyCard(hand, battle.selected, step);
  if (next === null) {
    return;
  }
  event.preventDefault();
  battle.select(next);
  document
    .querySelector<HTMLButtonElement>(`[data-testid="hand-card-${next}"]`)
    ?.focus();
};

/** Enter plays the selected card on the focused target, but not on a focused button. */
const playFocusedTarget = (battle: Battle, event: KeyboardEvent) => {
  const onButton = event.target instanceof HTMLButtonElement;
  const target = battle.targets[battle.focused];
  if (!onButton && target) {
    event.preventDefault();
    battle.play(target);
  }
};

const KEY_HANDLERS: Readonly<
  Record<
    BattleKeyAction,
    (keys: KeyContext, event: KeyboardEvent, step: 1 | -1) => void
  >
> = {
  moveSelection: ({ battle }, event, step) =>
    moveSelection(battle, event, step),
  focusTarget: ({ battle }, event, step) => {
    event.preventDefault();
    battle.focusTarget(step);
  },
  play: ({ battle }, event) => playFocusedTarget(battle, event),
  endTurn: ({ battle }) => battle.endTurn(),
  skip: ({ battle }) => battle.skip(),
  inspect: ({ battle }, event) => {
    event.preventDefault();
    battle.toggleInspect();
  },
  // The Battle does not pause: the Handbook opens at one side of the Board.
  handbook: ({ openHandbook }, event) => {
    event.preventDefault();
    openHandbook();
  },
  // Live pauses while the Battle Log is open (GDD 11.2).
  battleLog: ({ battle }, event) => {
    event.preventDefault();
    battle.openLog();
  },
  cancel: ({ battle }) => battle.select(null),
};

/**
 * The keyboard Inspect mode takes the arrow keys and Esc. Returns true when it
 * used the key.
 */
const inspectKey = (
  battle: Battle,
  event: KeyboardEvent,
  command: BattleKeyCommand
): boolean => {
  if (!battle.inspecting) {
    return false;
  }
  const direction = inspectDirection(command);
  if (direction) {
    event.preventDefault();
    battle.inspectNext(direction);
    return true;
  }
  if (command.action === "cancel") {
    event.preventDefault();
    battle.stopInspect();
    return true;
  }
  return false;
};

/** The result dialog takes its own keys, but L opens the Battle Log from it. */
const inResult = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest('[data-testid="battle-result"]') !== null;

const commandFromKey = (event: KeyboardEvent) => {
  if (isTyping(event.target)) {
    return null;
  }
  const command = keyCommand(event);
  if (!inDialog(event.target)) {
    return command;
  }
  return command?.action === "battleLog" && inResult(event.target)
    ? command
    : null;
};

/**
 * The keys of the open Battle Log: ←/→ one Log Entry, Shift+←/→ one Turn, L
 * and Esc Back to Live. Inspect and the Handbook work as in Live, and the
 * other Live keys do nothing.
 */
const runLogKey = (
  keys: KeyContext,
  event: KeyboardEvent,
  command: BattleKeyCommand
) => {
  const action = logKeyAction(command, event.shiftKey);
  switch (action._tag) {
    case "step": {
      event.preventDefault();
      keys.battle.stepLog(action.step, action.byTurn);
      return;
    }
    case "close": {
      event.preventDefault();
      keys.battle.closeLog();
      return;
    }
    case "live": {
      KEY_HANDLERS[command.action](keys, event, command.step);
      break;
    }
    case "off": {
      // All Live input is off in the Battle Log.
      break;
    }
    default: {
      return action satisfies never;
    }
  }
};

const runKey = (
  keys: KeyContext,
  event: KeyboardEvent,
  command: BattleKeyCommand
) => {
  if (inspectKey(keys.battle, event, command)) {
    return;
  }
  if (keys.battle.log) {
    runLogKey(keys, event, command);
    return;
  }
  KEY_HANDLERS[command.action](keys, event, command.step);
};

const DETAILS = '[data-testid="unit-details"]';

/**
 * In the keyboard Inspect mode, Tab goes into the Card Details, to the links
 * of the Keyword, Status and Damage Type names (issue #25). Returns true when
 * it used the key.
 */
const tabIntoDetails = (battle: Battle, event: KeyboardEvent): boolean => {
  if (!battle.inspecting || event.key !== "Tab" || event.shiftKey) {
    return false;
  }
  const panel = document.querySelector(DETAILS);
  const inPanel = event.target instanceof Node && panel?.contains(event.target);
  const link = panel?.querySelector<HTMLElement>(
    '[data-testid="details-entry-link"]'
  );
  if (inPanel || inDialog(event.target) || !link) {
    return false;
  }
  event.preventDefault();
  link.focus();
  return true;
};

/** UI-02: a full Battle with only a keyboard. */
const useBattleKeys = (battle: Battle, openHandbook: () => void) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (tabIntoDetails(battle, event)) {
        return;
      }
      const command = commandFromKey(event);
      if (command) {
        runKey({ battle, openHandbook }, event, command);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [battle, openHandbook]);
};

/** The 3D Board, which loads in its own chunk. */
const BoardLayer = ({
  battle,
  webgl2,
}: {
  readonly battle: Battle;
  readonly webgl2: boolean;
}) => {
  const { tr } = useGameText();
  if (!webgl2) {
    return null;
  }
  return (
    <Suspense
      fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display rounded-xl bg-[#1c140e]/85 px-6 py-3 text-xl">
            {tr("battle.loading")}
          </p>
        </div>
      }
    >
      <BattleCanvas onPick={(target) => battle.play(target)} />
    </Suspense>
  );
};

const BattleStage = ({ battle }: { readonly battle: Battle }) => {
  const { tr } = useGameText();
  const webgl2 = useMemo(() => hasWebgl2(), []);
  const options = battle.session?.options;
  const painting = useMemo(
    () => (options ? battlePainting(options) : null),
    [options]
  );
  const handbook = useHandbook();
  useBattleKeys(battle, handbook.open);
  useBattleHints(battle.liveSession);
  return (
    <div
      className="fixed inset-0 overflow-hidden overscroll-none text-[#fff6df]"
      data-testid="battle-stage"
    >
      {/*
       * In the Battle Log, the painting and the Board are grey and a little
       * warm, like an old picture, so that a past moment never looks like Live.
       */}
      <div
        className={cn(
          "absolute inset-0 transition-[filter] duration-300 ease-out motion-reduce:transition-none",
          battle.log && "[filter:saturate(0.28)_sepia(0.2)_brightness(0.95)]"
        )}
        data-testid="battle-board-layer"
        data-past={battle.log ? true : undefined}
      >
        {/* The painting loads before the 3D chunk, so it shows at once (web ADR-0007). */}
        <BattlePainting src={painting} />
        <BoardLayer battle={battle} webgl2={webgl2} />
      </div>
      {webgl2 ? null : (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-[#1c140e] p-8 text-center text-lg"
        >
          {tr("battle.noWebgl")}
        </div>
      )}
      <CastCard />
      <TutorialPanel battle={battle} />
      <UnitDetails battle={battle} />
      <TopBar battle={battle} />
      <TurnBanner />
      <BattleLogBanner battle={battle} />
      <HandBar battle={battle} />
      <BattleLogPanel battle={battle} />
      <ResultOverlay battle={battle} />
    </div>
  );
};

/** Esc on a screen other than the Town goes back to the Town (GDD 11.4). */
const useEscToTown = (active: boolean, toTown: () => void) => {
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        !isTyping(event.target)
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
const useCampaignRegion = (battle: Battle) => {
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

/**
 * The game in one route (web ADR-0006): the Town, the Campaign (the Region
 * Map), then the Battle, the Packs, the Workshop and the Hero screen. The Town Bar shows on each screen
 * except the Battle.
 */
export const PlayScreen = () => {
  const battle = useBattle();
  const registry = useContext(RegistryContext);
  const soundOn = useAtomValue(soundOnAtom);
  const soundVolume = useAtomValue(soundVolumeAtom);
  const [screen, setScreen] = useAtom(gameScreenAtom);
  const campaign = useCampaignRegion(battle);
  const { leaving, open: handleOpen } = useTownLeave(
    screen,
    campaign.withRegion(setScreen)
  );
  const ready = useAtomValue(profileReadyAtom);

  useProfileStore();
  useEscToTown(screen !== "town" && !battle.session, () => setScreen("town"));
  // A Hint waits for the Profile: the seen list is in it.
  useTownHints(ready && !battle.session, screen === "town");
  usePacksHints(ready && !battle.session && screen === "packs");
  useHeroHints(ready && !battle.session && screen === "hero");

  useEffect(() => setSoundEnabled(soundOn), [soundOn]);
  useEffect(() => setSoundVolume(soundVolume), [soundVolume]);
  // The QA states change the Profile, so the hooks wait for it to load.
  useEffect(
    () =>
      ready && qaEnabled()
        ? installTestHooks(registry, stateFromSearch(location.search))
        : undefined,
    [registry, ready]
  );

  return (
    <>
      {battle.session ? (
        <BattleStage battle={battle} />
      ) : (
        <>
          {screen === "town" ? (
            <TownScreen leaving={leaving} onOpen={handleOpen} />
          ) : null}
          {screen === "campaign" ? (
            <CampaignScreen
              region={campaign.region}
              onRegion={(region) => campaign.setRegion(region)}
              onStart={(options) => battle.start(options)}
            />
          ) : null}
          {screen === "packs" ? <PacksScreen /> : null}
          {screen === "workshop" ? <WorkshopScreen /> : null}
          {screen === "hero" ? <HeroScreen /> : null}
          <TownBar screen={screen} onOpen={handleOpen} />
        </>
      )}
      <HintBanner />
      <HandbookDialog inBattle={battle.session !== null} />
      <PortraitGuard />
    </>
  );
};
