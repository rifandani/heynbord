import { useAtom, useAtomValue } from "@effect/atom-react";
import { UNLOCK_LEVELS } from "@workspace/rules";
import { cn } from "cn";
import { useState } from "react";
import type { Key } from "react-aria-components";
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GAME_SCRIM } from "@/core/components/game/game-dialog";
import { CloseIcon } from "@/core/components/game/icons";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { DECK_COLORS, DECK_CSS } from "@/features/deck/tokens";
import { AchievementsTab } from "@/features/objectives/components/achievements-tab";
import { DailyQuestsTab } from "@/features/objectives/components/daily-quests-tab";
import { RewardFlight } from "@/features/objectives/components/reward-flight";
import { useClaimFeedback } from "@/features/objectives/components/use-claim-feedback";
import type { ObjectivesTab } from "@/features/objectives/objectives";
import { defaultTab, OBJECTIVES_TABS } from "@/features/objectives/objectives";
import {
  objectivesOpenAtom,
  objectivesViewAtom,
} from "@/features/objectives/objectives.atoms";

/**
 * One tab of the dialog: its name and its gold count. A locked tab has a Lock
 * Plate in the place of the count, and it cannot be selected (24 — Quests 3).
 */
const ObjectivesTabButton = ({
  tab,
  count,
  locked,
}: {
  readonly tab: ObjectivesTab;
  readonly count: number;
  readonly locked: boolean;
}) => {
  const { tr } = useGameText();
  const name = tr(`objectives.tabs.${tab}`);
  const level = tr("town.levelPlate", { level: UNLOCK_LEVELS.quests });
  let label = name;
  if (locked) {
    label = `${name}, ${level}`;
  } else if (count > 0) {
    label = `${name}, ${tr("achievements.tab.toClaim", { count })}`;
  }
  return (
    <Tab
      id={tab}
      aria-label={label}
      className={cn(
        "data-[focus-visible]:ring-focus-cream flex h-full min-w-0 items-center gap-2 rounded-t-lg px-4 outline-none data-[focus-visible]:ring-4",
        "font-display text-cream-dim text-base font-bold",
        "data-[selected]:bg-parchment data-[selected]:text-ink",
        locked ? "cursor-default" : "data-[hovered]:text-cream cursor-pointer",
        "[@media(max-height:500px)]:px-2.5 [@media(max-height:500px)]:text-sm"
      )}
      data-testid={`objectives-tab-${tab}`}
      data-locked={locked || undefined}
    >
      <span className="truncate">{name}</span>
      {locked ? (
        <span
          className="border-gold-trim/70 bg-night-plate/90 text-cream-dim flex shrink-0 items-center gap-1 rounded-full border-2 py-0.5 pr-2 pl-1 font-sans text-xs leading-none font-bold whitespace-nowrap"
          data-testid="objectives-lock-plate"
        >
          <GlyphIcon glyph="lock" className="text-gold-trim size-3" />
          {level}
        </span>
      ) : null}
      {!locked && count > 0 ? (
        <span
          key={count}
          aria-hidden
          className="border-gold-deep from-gold-light to-gold text-ink-on-gold grid h-5 min-w-5 shrink-0 place-items-center rounded-full border bg-gradient-to-b px-1 font-sans text-xs font-black tabular-nums motion-safe:animate-[workshop-count_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
          data-testid={`objectives-count-${tab}`}
        >
          {count}
        </span>
      ) : null}
    </Tab>
  );
};

/** The title, the 2 tabs under it, and the parchment of the open tab. */
const ObjectivesBody = ({ close }: { readonly close: () => void }) => {
  const { tr } = useGameText();
  const view = useAtomValue(objectivesViewAtom);
  const [selected, setSelected] = useState<Key>(() => defaultTab(view));
  const { flights, said, onClaimed, onLanded } = useClaimFeedback();
  return (
    <Tabs
      selectedKey={selected}
      onSelectionChange={setSelected}
      disabledKeys={view.dailyLocked ? ["daily"] : []}
      className="flex size-full min-h-0 flex-col"
    >
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 px-4 [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:px-2">
        <Heading
          slot="title"
          className="font-display text-cream text-2xl font-black [@media(max-height:500px)]:text-base"
        >
          {tr("objectives.title")}
        </Heading>
        <GameButton
          intent="wood"
          size="icon"
          aria-label={tr("objectives.close")}
          onPress={close}
          className="shrink-0 [@media(max-height:500px)]:size-7"
          data-testid="objectives-close"
        >
          <CloseIcon className="size-5" />
        </GameButton>
      </header>
      <TabList
        aria-label={tr("objectives.title")}
        className="flex h-10 shrink-0 items-end gap-1 px-2 [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:px-1"
      >
        {OBJECTIVES_TABS.map((tab) => (
          <ObjectivesTabButton
            key={tab}
            tab={tab}
            count={view.counts[tab]}
            locked={tab === "daily" && view.dailyLocked}
          />
        ))}
      </TabList>
      <div className="bg-parchment text-ink min-h-0 flex-1 overflow-hidden rounded-[10px] [@media(max-height:500px)]:rounded-md">
        <TabPanel
          id="daily"
          className="size-full outline-none"
          data-testid="objectives-daily"
        >
          <DailyQuestsTab onClaimed={onClaimed} />
        </TabPanel>
        <TabPanel
          id="achievements"
          className="size-full outline-none"
          data-testid="objectives-achievements"
        >
          <AchievementsTab onClaimed={onClaimed} />
        </TabPanel>
      </div>
      {flights.map((flight) => (
        <RewardFlight key={flight.serial} flight={flight} onDone={onLanded} />
      ))}
      <p className="sr-only" aria-live="polite" data-testid="objectives-said">
        {said}
      </p>
    </Tabs>
  );
};

/**
 * The Objectives dialog (24 — Quests 3): a large dialog at the size of the Deck
 * dialog that opens over the current screen, with the title "Objectives", the
 * Daily Quests and Achievements tabs, and a parchment list. It has no painted
 * background and no portraits. Esc, the close button and a click outside close
 * it. A new open starts again on the default tab.
 */
export const ObjectivesDialog = () => {
  const [isOpen, setOpen] = useAtom(objectivesOpenAtom);
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={setOpen}
      isDismissable
      className={cn(
        GAME_SCRIM,
        "fade-in animate-in z-50 duration-200 motion-reduce:animate-none"
      )}
    >
      <Modal
        className="relative h-[min(780px,100%)] w-[min(1200px,100%)] rounded-[18px] border-2 p-2.5 pt-0 [@media(max-height:500px)]:rounded-xl [@media(max-height:500px)]:p-1.5 [@media(max-height:500px)]:pt-0"
        style={{
          borderColor: DECK_COLORS.leatherEdge,
          backgroundColor: DECK_COLORS.leather,
          boxShadow: DECK_CSS.coverLift,
        }}
      >
        <Dialog
          className="relative size-full outline-none"
          data-testid="objectives-dialog"
        >
          {({ close }) => <ObjectivesBody close={close} />}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};
