import { DialogTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog, GameDialogText } from "@/core/components/game/game-dialog";
import type { BattleOptions } from "@/features/battle/battle-session";
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
      size="icon"
      aria-label={tr("battle.quit")}
      onPress={onPress}
      data-testid="leave-battle"
    >
      <span aria-hidden>✕</span>
    </GameButton>
  );
};

/**
 * The leave control in the Top Bar. Before a result, to leave is an Abandon:
 * it records no result, so the Player confirms it first (GDD 11.4). After a
 * result, it leaves at once.
 */
export const LeaveBattle = ({
  battle,
  finished,
}: {
  readonly battle: ReturnType<typeof useBattle>;
  readonly finished: boolean;
}) => {
  const { tr } = useGameText();
  if (finished) {
    return <LeaveButton onPress={() => battle.leave()} />;
  }
  return (
    <DialogTrigger>
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
