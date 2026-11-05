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
import { AchievementsTab } from "@/features/objectives/components/achievements-tab";
import { DailyQuestsTab } from "@/features/objectives/components/daily-quests-tab";
import {
  LEDGER_LEATHER,
  LedgerCorner,
  LedgerCover,
  LedgerSpine,
  useSpread,
} from "@/features/objectives/components/objectives-book";
import { useClaimFeedback } from "@/features/objectives/components/use-claim-feedback";
import type { ObjectivesTab } from "@/features/objectives/objectives";
import { defaultTab, OBJECTIVES_TABS } from "@/features/objectives/objectives";
import {
  objectivesOpenAtom,
  objectivesViewAtom,
} from "@/features/objectives/objectives.atoms";
import { OBJECTIVES_LEDGER_CSS } from "@/features/objectives/tokens";
import type { QuestDestination } from "@/features/quests/quests";
import { shortcutImage } from "@/features/town/town";

/**
 * One tab of the dialog, as a ribbon bookmark on the top edge of the ledger:
 * its name and its gold count. The open tab is gold, because it is the current
 * place. A locked tab has a Lock Plate in the place of the count, and it cannot
 * be selected (24 — Quests 3).
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
        "group data-[focus-visible]:ring-focus-cream relative flex h-full w-56 min-w-0 shrink items-end rounded-t-md outline-none data-[focus-visible]:ring-4",
        locked ? "cursor-default" : "cursor-pointer"
      )}
      data-testid={`objectives-tab-${tab}`}
      data-locked={locked || undefined}
    >
      <span
        className={cn(
          "relative flex w-full items-center gap-1.5 px-3 pt-2.5 pb-2 transition-[height,filter] duration-150 ease-out motion-reduce:transition-none",
          // The swallowtail end of the ribbon.
          "[clip-path:polygon(0_0,50%_7px,100%_0,100%_100%,0_100%)]",
          "from-wood-light to-wood text-cream h-10 bg-gradient-to-b",
          "group-data-[selected]:from-gold-light group-data-[selected]:to-gold group-data-[selected]:text-ink-on-gold group-data-[selected]:h-12",
          !locked && "group-data-[hovered]:brightness-110",
          "[@media(max-height:500px)]:h-7 [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-1 [@media(max-height:500px)]:group-data-[selected]:h-8"
        )}
      >
        <span className="font-display truncate text-sm font-bold [@media(max-height:500px)]:font-sans [@media(max-height:500px)]:text-[11px]">
          {name}
        </span>
        {locked ? (
          <span
            className="border-gold-trim/70 bg-night-plate/90 text-cream-dim ml-auto flex shrink-0 items-center gap-1 rounded-full border-2 py-0.5 pr-2 pl-1 font-sans text-xs leading-none font-bold whitespace-nowrap"
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
            className="border-gold-deep from-gold-light to-gold text-ink-on-gold ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full border bg-gradient-to-b px-1 font-sans text-xs font-black tabular-nums motion-safe:animate-[workshop-count_420ms_cubic-bezier(0.2,0.8,0.2,1)]"
            data-testid={`objectives-count-${tab}`}
          >
            {count}
          </span>
        ) : null}
      </span>
    </Tab>
  );
};

/** The trophy, the title and the ribbons on the cover, and the pages of the open tab. */
const ObjectivesBody = ({
  close,
  onOpen,
}: {
  readonly close: () => void;
  readonly onOpen: (screen: QuestDestination) => void;
}) => {
  const { tr } = useGameText();
  const view = useAtomValue(objectivesViewAtom);
  const [selected, setSelected] = useState<Key>(() => defaultTab(view));
  const { said, onClaimed } = useClaimFeedback();
  const spread = useSpread();
  const goTo = (screen: QuestDestination) => {
    close();
    onOpen(screen);
  };
  return (
    <Tabs
      selectedKey={selected}
      onSelectionChange={setSelected}
      disabledKeys={view.dailyLocked ? ["daily"] : []}
      className="flex size-full min-h-0 flex-col"
    >
      <header className="flex h-14 shrink-0 items-end gap-3 px-4 [@media(max-height:500px)]:h-9 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:px-2">
        <div className="flex shrink-0 items-center gap-2 self-center">
          <img
            src={shortcutImage("objectives")}
            alt=""
            width={128}
            height={128}
            draggable={false}
            className="-my-2 size-12 select-none [@media(max-height:500px)]:size-8"
            style={{ filter: OBJECTIVES_LEDGER_CSS.iconDrop }}
          />
          <Heading
            slot="title"
            className="font-display text-cream text-2xl font-black [@media(max-height:500px)]:text-base"
          >
            {tr("objectives.title")}
          </Heading>
        </div>
        <TabList
          aria-label={tr("objectives.title")}
          className="flex h-full min-w-0 flex-1 items-end gap-1.5 [@media(max-height:500px)]:gap-1"
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
        <GameButton
          intent="wood"
          size="icon"
          aria-label={tr("objectives.close")}
          onPress={close}
          className="shrink-0 self-center [@media(max-height:500px)]:size-8"
          data-testid="objectives-close"
        >
          <CloseIcon className="size-5" />
        </GameButton>
      </header>
      <div
        className="bg-parchment text-ink relative min-h-0 flex-1 rounded-[10px] [@media(max-height:500px)]:rounded-md"
        style={{ boxShadow: OBJECTIVES_LEDGER_CSS.pageStack }}
      >
        {spread ? <LedgerSpine /> : null}
        <TabPanel
          id="daily"
          className="size-full outline-none"
          data-testid="objectives-daily"
        >
          <DailyQuestsTab onClaimed={onClaimed} onGoTo={goTo} />
        </TabPanel>
        <TabPanel
          id="achievements"
          className="size-full outline-none"
          data-testid="objectives-achievements"
        >
          <AchievementsTab onClaimed={onClaimed} />
        </TabPanel>
      </div>
      <p className="sr-only" aria-live="polite" data-testid="objectives-said">
        {said}
      </p>
    </Tabs>
  );
};

/**
 * The Objectives dialog (24 — Quests 3): a guild ledger, the third book of the
 * game box after the Deck book and the Handbook. It opens over the current
 * screen. Its ribbons are the Daily Quests and Achievements tabs, and its side
 * bookmarks are the Achievement categories. It has no painted background and
 * no portraits. Esc, the close button and a click outside close it. A new open
 * starts again on the default tab. The book opens and closes on its spine;
 * with reduced motion it shows and goes at once.
 */
export const ObjectivesDialog = ({
  onOpen,
}: {
  /** Opens the screen of a Go to button, behind the closed dialog. */
  readonly onOpen: (screen: QuestDestination) => void;
}) => {
  const [isOpen, setOpen] = useAtom(objectivesOpenAtom);
  const spread = useSpread();
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={setOpen}
      isDismissable
      className={cn(
        GAME_SCRIM,
        "fade-in animate-in z-50 duration-200 motion-safe:data-[exiting]:animate-[deck-scrim-out_500ms_linear_both] motion-reduce:animate-none"
      )}
    >
      {/* The bookmarks stand out of the cover. Room for them at both sides keeps the book at the center on each tab. */}
      <Modal
        className={cn(
          "group/book relative h-[min(780px,100%)] outline-none [perspective:3200px] motion-safe:data-[entering]:animate-[deck-book_720ms_linear_both] motion-safe:data-[exiting]:animate-[deck-book_500ms_linear_reverse_both]",
          spread ? "w-[min(1180px,calc(100%-15rem))]" : "w-[min(1200px,100%)]"
        )}
      >
        <div
          className="absolute inset-0 rounded-[18px] border-2 p-2.5 pt-0 motion-safe:group-data-[entering]/book:animate-[deck-book-body_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-book-body_500ms_linear_reverse_both] [@media(max-height:500px)]:rounded-xl [@media(max-height:500px)]:p-1.5 [@media(max-height:500px)]:pt-0"
          style={{
            ...LEDGER_LEATHER,
            boxShadow: OBJECTIVES_LEDGER_CSS.coverLift,
          }}
        >
          {/* A gilt line on the leather, and the bronze corners. */}
          <span
            className="border-gold-trim/35 pointer-events-none absolute inset-1 rounded-[14px] border [@media(max-height:500px)]:rounded-lg"
            aria-hidden
          />
          <LedgerCorner className="-top-px -left-px rounded-tl-[18px] rounded-br-lg border-r-2 border-b-2" />
          <LedgerCorner className="-top-px -right-px rounded-tr-[18px] rounded-bl-lg border-b-2 border-l-2" />
          <LedgerCorner className="-bottom-px -left-px rounded-tr-lg rounded-bl-[18px] border-t-2 border-r-2" />
          <LedgerCorner className="-right-px -bottom-px rounded-tl-lg rounded-br-[18px] border-t-2 border-l-2" />
          <Dialog
            className="relative size-full outline-none"
            data-testid="objectives-dialog"
          >
            {({ close }) => <ObjectivesBody close={close} onOpen={onOpen} />}
          </Dialog>
        </div>
        {/* The shadow of the cover on the right page while the cover moves. */}
        <span
          className="pointer-events-none absolute inset-y-0 right-0 left-1/2 z-10 rounded-r-[18px] opacity-0 motion-safe:group-data-[entering]/book:animate-[deck-page-shadow_720ms_linear_both] motion-safe:group-data-[exiting]/book:animate-[deck-page-shadow_500ms_linear_reverse_both]"
          style={{ backgroundImage: OBJECTIVES_LEDGER_CSS.coverShadow }}
          aria-hidden
        />
        <LedgerCover />
      </Modal>
    </ModalOverlay>
  );
};
