import type { Profile } from "@workspace/rules";

import { GameButton } from "@/core/components/game/game-button";
import { GameDialog, GameDialogText } from "@/core/components/game/game-dialog";
import { useGameText } from "@/features/battle/use-game-text";

/**
 * The replace confirmation of an import: a small parchment dialog over the
 * Settings dialog. Cancel keeps the progress. It loads in its own chunk, so
 * that the Settings dialog, which is in the first bundle, does not carry the
 * parchment dialog (issue #139).
 */
export const ReplaceProfileDialog = ({
  profile,
  onCancel,
  onReplace,
}: {
  readonly profile: Profile | null;
  readonly onCancel: () => void;
  readonly onReplace: (profile: Profile) => void;
}) => {
  const { tr } = useGameText();
  return (
    <GameDialog
      isOpen={profile !== null}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      title={tr("settings.profile.confirmTitle")}
      role="alertdialog"
      testId="import-confirm-dialog"
      className="text-left"
      footer={
        <div className="flex w-full justify-end gap-2">
          <GameButton
            intent="wood"
            size="sm"
            autoFocus
            onPress={onCancel}
            data-testid="import-cancel"
          >
            {tr("settings.profile.cancel")}
          </GameButton>
          <GameButton
            intent="gold"
            size="sm"
            onPress={() => {
              if (profile) {
                onReplace(profile);
              }
            }}
            data-testid="import-confirm"
          >
            {tr("settings.profile.replace")}
          </GameButton>
        </div>
      }
    >
      <GameDialogText className="mt-2 leading-snug">
        {tr("settings.profile.confirmText")}
      </GameDialogText>
    </GameDialog>
  );
};
