import {
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { GameButton } from "@/features/battle/components/game-button";
import type { useBattle } from "@/features/battle/use-battle";
import { useGameText } from "@/features/battle/use-game-text";

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
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      >
        <Modal className="fade-in zoom-in-95 animate-in w-[min(400px,94vw)] rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] p-5 text-center text-[#2a1d12] shadow-2xl duration-200 motion-reduce:animate-none [@media(max-height:500px)]:p-3">
          <Dialog className="outline-none" data-testid="abandon-dialog">
            {({ close }) => (
              <>
                <Heading
                  slot="title"
                  className="font-display text-2xl font-black [@media(max-height:500px)]:text-xl"
                >
                  {tr("battle.abandon.title")}
                </Heading>
                <p className="mt-2 text-sm text-[#5b4632]">
                  {tr("battle.abandon.text")}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:500px)]:mt-2">
                  <GameButton intent="gold" autoFocus onPress={close}>
                    {tr("battle.abandon.stay")}
                  </GameButton>
                  <GameButton
                    intent="wood"
                    onPress={() => {
                      close();
                      battle.leave();
                    }}
                    data-testid="abandon-confirm"
                  >
                    {tr("battle.abandon.confirm")}
                  </GameButton>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
