import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { ImportError, Profile } from "@workspace/rules";
import { exportProfile, importProfile } from "@workspace/rules";
import { Result } from "effect";
import { useContext, useState } from "react";
import {
  Dialog,
  FileTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from "react-aria-components";

import { GameButton } from "@/features/battle/components/game-button";
import { useGameText } from "@/features/battle/use-game-text";
import { exportFileName } from "@/features/profile/profile";
import { profileStateAtom } from "@/features/profile/profile.atoms";
import { gameScreenAtom } from "@/features/town/town.atoms";

/** Gives the Player a text file to save. */
const download = (name: string, text: string) => {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // The download starts after the click event, so the URL stays a moment.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * The replace confirmation of an import: a small parchment dialog over the
 * Settings dialog. Cancel keeps the progress.
 */
const ReplaceDialog = ({
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
    <ModalOverlay
      isOpen={profile !== null}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      isDismissable
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
    >
      <Modal className="fade-in zoom-in-95 animate-in w-[min(400px,92vw)] rounded-2xl border-4 border-[#5b3a1e] bg-[#f6ead0] text-[#2a1d12] shadow-[0_24px_48px_rgba(0,0,0,0.55)] duration-200 motion-reduce:animate-none">
        <Dialog
          role="alertdialog"
          className="px-5 pt-4 pb-5 outline-none [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:pt-3 [@media(max-height:500px)]:pb-3"
          data-testid="import-confirm-dialog"
        >
          <Heading
            slot="title"
            className="font-display text-xl font-black [@media(max-height:500px)]:text-lg"
          >
            {tr("settings.profile.confirmTitle")}
          </Heading>
          <p className="mt-2 text-sm leading-snug">
            {tr("settings.profile.confirmText")}
          </p>
          <div className="mt-4 flex justify-end gap-2 [@media(max-height:500px)]:mt-3">
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
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

/**
 * Export and Import of the Profile (technical design 5), a row of the
 * Settings dialog. Export downloads the saved Profile; the values of the Game
 * Dev Panel are not in it. Import reads a file: a file that the game refuses
 * shows the reason, and a good file asks for a confirmation. After it, the
 * Profile replaces the progress, and the Town opens. `onReplaced` closes the
 * Settings dialog.
 */
export const ProfileRow = ({
  className,
  labelClassName,
  onReplaced,
}: {
  readonly className: string;
  readonly labelClassName: string;
  readonly onReplaced: () => void;
}) => {
  const { tr } = useGameText();
  const registry = useContext(RegistryContext);
  const state = useAtomValue(profileStateAtom);
  const [refused, setRefused] = useState<ImportError | null>(null);
  const [pending, setPending] = useState<Profile | null>(null);
  const saved = state.status === "ready" ? state.profile : null;

  const read = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    const imported = importProfile(await file.text());
    if (Result.isFailure(imported)) {
      setRefused(imported.failure);
      return;
    }
    setRefused(null);
    setPending(imported.success);
  };

  const replace = (profile: Profile) => {
    setPending(null);
    registry.set(profileStateAtom, { status: "ready", profile });
    registry.set(gameScreenAtom, "town");
    onReplaced();
  };

  return (
    <div className={className} data-testid="settings-profile">
      <span className={labelClassName}>{tr("settings.profile.label")}</span>
      <div className="grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <GameButton
            intent="wood"
            size="sm"
            isDisabled={saved === null}
            aria-label={tr("settings.profile.exportLabel")}
            onPress={() => {
              if (saved) {
                download(exportFileName(new Date()), exportProfile(saved));
              }
            }}
            data-testid="settings-export"
          >
            {tr("settings.profile.export")}
          </GameButton>
          <FileTrigger
            acceptedFileTypes={["application/json", ".json"]}
            onSelect={(files) => {
              void read(files);
            }}
          >
            <GameButton
              intent="wood"
              size="sm"
              isDisabled={saved === null}
              aria-label={tr("settings.profile.importLabel")}
              data-testid="settings-import"
            >
              {tr("settings.profile.import")}
            </GameButton>
          </FileTrigger>
        </div>
        {refused ? (
          <p
            role="alert"
            className="rounded-lg border-2 border-[#9b2c1f]/40 bg-[#fbe3d8] px-2.5 py-1.5 text-xs leading-snug font-semibold text-[#7a1f14]"
            data-testid="settings-import-error"
            data-reason={refused._tag}
          >
            {tr(`settings.profile.errors.${refused._tag}`)}
          </p>
        ) : null}
      </div>
      <ReplaceDialog
        profile={pending}
        onCancel={() => setPending(null)}
        onReplace={replace}
      />
    </div>
  );
};
