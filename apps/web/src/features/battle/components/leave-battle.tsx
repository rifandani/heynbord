import { useAtom } from "@effect/atom-react";
import { DialogTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog, GameDialogText } from "@/core/components/game/game-dialog";
import type { BattleOptions } from "@/features/battle/battle-session";
import { leaveConfirmAtom } from "@/features/battle/battle.atoms";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";

/** The line of the Leave dialog: the Player can play the Stage, the Dungeon or the Floor again. */
const abandonTextKey = (options: BattleOptions | undefined) => {
  if (options?.floor) {
    return "battle.abandon.textFloor";
  }
  return options?.dungeon
    ? "battle.abandon.textDungeon"
    : "battle.abandon.text";
};

const LeaveButton = ({ onPress }: { readonly onPress?: () => void }) => {
  const { tr } = useGameText();
  return (
    <GameButton
      intent="ghost"
      size="sm"
      aria-label={tr("battle.quit")}
      onPress={onPress}
      data-testid="leave-battle"
    >
      <GlyphIcon glyph="door" className="size-4" />
    </GameButton>
  );
};

/**
 * The Leave control in the Top Bar, at the left of the Speed toggle. Before a
 * result, to leave is an Abandon: it records no result, so the Player confirms
 * it first (GDD 11.4). After a result, it leaves at once. Esc opens the same
 * confirm when there is nothing else to cancel, so the confirm is controlled.
 */
export const LeaveBattle = ({
  battle,
  finished,
}: {
  readonly battle: ReturnType<typeof useBattle>;
  readonly finished: boolean;
}) => {
  const { tr } = useGameText();
  const [open, setOpen] = useAtom(leaveConfirmAtom);
  if (finished) {
    return <LeaveButton onPress={() => battle.leave()} />;
  }
  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      <LeaveButton />
      <GameDialog
        title={tr("battle.abandon.title")}
        testId="abandon-dialog"
        footer={
          <>
            <GameButton intent="gold" slot="close" autoFocus>
              {tr("battle.abandon.stay")}
            </GameButton>
            <GameButton
              intent="wood"
              slot="close"
              onPress={() => battle.leave()}
              data-testid="abandon-confirm"
            >
              {tr("battle.abandon.confirm")}
            </GameButton>
          </>
        }
      >
        <GameDialogText className="mt-2">
          {tr(abandonTextKey(battle.session?.options))}
        </GameDialogText>
      </GameDialog>
    </DialogTrigger>
  );
};
