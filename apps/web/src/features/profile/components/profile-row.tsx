import { RegistryContext, useAtomValue } from "@effect/atom-react";
import type { ImportError, Profile } from "@workspace/rules";
import { exportProfile, importProfile } from "@workspace/rules";
import { Result } from "effect";
import { lazy, Suspense, useContext, useState } from "react";
import { FileTrigger } from "react-aria-components";

import { GameButton } from "@/core/components/game/game-button";
import { useEverOpened } from "@/core/hooks/use-ever-opened";
import { useGameText } from "@/features/battle/use-game-text";
import { exportFileName } from "@/features/profile/profile";
import { replaceProfileAtom } from "@/features/profile/profile-store.atoms";
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

const ReplaceProfileDialog = lazy(async () => {
  const module =
    await import("@/features/profile/components/replace-profile-dialog");
  return { default: module.ReplaceProfileDialog };
});

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
  // The confirmation stays after its first open, so it can close on its
  // parchment. Its chunk loads at that first open.
  const confirmShown = useEverOpened(pending !== null);
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
    registry.set(replaceProfileAtom, profile);
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
            className="border-danger/40 bg-danger-subtle text-danger-subtle-fg rounded-lg border-2 px-2.5 py-1.5 text-xs leading-snug font-semibold"
            data-testid="settings-import-error"
            data-reason={refused._tag}
          >
            {tr(`settings.profile.errors.${refused._tag}`)}
          </p>
        ) : null}
      </div>
      {confirmShown ? (
        <Suspense fallback={null}>
          <ReplaceProfileDialog
            profile={pending}
            onCancel={() => setPending(null)}
            onReplace={replace}
          />
        </Suspense>
      ) : null}
    </div>
  );
};
