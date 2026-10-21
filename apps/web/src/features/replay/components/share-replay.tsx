import { cn } from "cn";
import { Button } from "react-aria-components";

import { battleNameRef } from "@/features/battle/battle-content";
import type { BattleSession } from "@/features/battle/battle-session";
import { GameButton } from "@/features/battle/components/game-button";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useGameText } from "@/features/battle/use-game-text";
import { replayOf } from "@/features/replay/replay";
import { useShareReplay } from "@/features/replay/use-share-replay";

/**
 * "Share Replay" (web ADR-0011), for a Stage Battle, a Dungeon Battle or a
 * Floor Battle with a win or a loss. Nothing shows for a Battle that has no Replay.
 * `text`: a text button on the parchment of the result. `wood`: a wood
 * button in the Battle Log. `icon`: a square wood button with only the glyph.
 */
export const ShareReplay = ({
  session,
  look,
  className,
}: {
  readonly session: BattleSession | null;
  readonly look: "text" | "wood" | "icon";
  readonly className?: string;
}) => {
  const { tr, text } = useGameText();
  const share = useShareReplay();
  const replay = session ? replayOf(session) : null;
  if (!session || !replay) {
    return null;
  }
  const onPress = () => {
    void share(replay, text(battleNameRef(session.options)));
  };
  const label = tr("replay.share");
  if (look === "text") {
    return (
      <Button
        onPress={onPress}
        className={cn(
          "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-bold text-[#5b4632] transition-colors duration-100 outline-none data-[focus-visible]:ring-4 data-[focus-visible]:ring-[#b4521a]/40 data-[hovered]:bg-[#ead9b4] data-[hovered]:text-[#2a1d12] data-[pressed]:translate-y-px",
          className
        )}
        data-testid="share-replay"
      >
        <GlyphIcon glyph="share" className="size-4" />
        {label}
      </Button>
    );
  }
  return (
    <GameButton
      intent="wood"
      size="sm"
      onPress={onPress}
      aria-label={look === "icon" ? label : undefined}
      className={cn(
        look === "icon"
          ? "size-9 min-h-9 px-0 [@media(max-height:500px)]:size-8 [@media(max-height:500px)]:min-h-8"
          : "w-full",
        className
      )}
      data-testid="share-replay"
    >
      <GlyphIcon glyph="share" className="size-3.5" />
      {look === "icon" ? null : label}
    </GameButton>
  );
};
