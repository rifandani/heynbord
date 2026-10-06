import { useAtomValue } from "@effect/atom-react";
import { cn } from "cn";
import type { CSSProperties } from "react";

import { battleSessionAtom } from "@/features/battle/battle.atoms";
import { cardText } from "@/features/battle/card-text";
import type { Cast } from "@/features/battle/cast";
import { currentCast, effectColor } from "@/features/battle/cast";
import { CardBack } from "@/features/battle/components/card-back";
import { CardFrame } from "@/features/battle/components/card-frame";
import { SIDE_COLORS } from "@/features/battle/palette";
import { useGameText } from "@/features/battle/use-game-text";

/**
 * Where the card comes from, as an offset from its place: the enemy Hand
 * under the enemy Hero panel, or the middle of the Player's Hand Bar. A
 * Recall sends the card back the same way.
 */
const FROM: Readonly<Record<Cast["side"], { x: string; y: string }>> = {
  enemy: { x: "0px", y: "-3rem" },
  player: { x: "calc(50vw - 5rem)", y: "calc(100svh - 14rem)" },
};

const revealMotion = (revealMs: number) =>
  revealMs > 0 &&
  "animate-[cast-reveal_var(--reveal-ms)_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-[cast-fade-in_var(--reveal-ms)_linear_both]";

const settleMotion = (cast: Cast) => {
  if (cast.phase !== "settle") {
    return false;
  }
  return cast.recalled
    ? "animate-[cast-recall_var(--settle-ms)_cubic-bezier(0.5,0,0.75,0)_both] motion-reduce:animate-[cast-fade-out_var(--settle-ms)_linear_both]"
    : "animate-[cast-discard_var(--settle-ms)_cubic-bezier(0.5,0,0.75,0)_both] motion-reduce:animate-[cast-fade-out_var(--settle-ms)_linear_both]";
};

/** "Back to the Hand" or "Graveyard": where the card goes after its effect (Recall, GDD 4.8). */
const SettleChip = ({ recalled }: { readonly recalled: boolean }) => {
  const { tr } = useGameText();
  return (
    <span
      className={cn(
        "absolute inset-x-0 bottom-[2.4em] mx-auto w-max max-w-[11rem] animate-[cast-chip_160ms_ease-out_both] rounded border-2 px-1.5 py-0.5 text-center text-xs leading-tight font-bold shadow-[0_3px_0_rgba(0,0,0,0.45)] motion-reduce:animate-none",
        recalled
          ? "border-[#7a5310] bg-[#ffd75a] text-[#2a1a05]"
          : "border-[#e8d9bb]/40 bg-[#1c140e] text-[#fff6df]"
      )}
    >
      {recalled ? tr("battle.cast.recalled") : tr("battle.graveyard")}
    </span>
  );
};

/**
 * The cast card at the side of its caster. It plays the 3 beats of a cast:
 * the card comes out of the Hand (an enemy card turns face up) with a flare
 * of the effect color, it stays while the effect hits, and then it goes back
 * to the Hand or falls away to the Graveyard.
 */
const CastPiece = ({
  cast,
  duration,
}: {
  readonly cast: Cast;
  /** The time of the current event, in ms. */
  readonly duration: number;
}) => {
  const { text } = useGameText();
  // The reveal motion runs only in the reveal. Its end state is the rest
  // state, so the card does not jump when the motion class goes.
  const revealMs = cast.phase === "reveal" ? duration : 0;
  const enemy = cast.side === "enemy";
  const color = effectColor(cast.skill.effect);
  const from = FROM[cast.side];
  // SAFETY: CSS custom properties for the keyframes. React's `CSSProperties`
  // does not model custom properties.
  const style = {
    "--reveal-ms": `${revealMs}ms`,
    "--settle-ms": `${duration}ms`,
    "--cast-from-x": from.x,
    "--cast-from-y": from.y,
    "--cast-turn": enemy ? "180deg" : "0deg",
    "--cast-tilt": enemy ? "8deg" : "-8deg",
  } as CSSProperties;
  return (
    <div
      className={cn(
        "absolute top-[6.75rem] flex w-[9em] flex-col items-center text-[13px] [@media(max-height:500px)]:top-[6rem] [@media(max-height:500px)]:text-[8px]",
        enemy
          ? "right-[max(0.75rem,env(safe-area-inset-right))]"
          : "left-[max(0.75rem,env(safe-area-inset-left))]",
        settleMotion(cast)
      )}
      style={style}
      data-testid="cast-card"
      data-side={cast.side}
      data-card={cast.card.cardId}
      data-phase={cast.phase}
      aria-hidden
    >
      <div className="relative [perspective:40em]">
        {/* The flare: the cast is active while it glows (The Glow Is State Rule). */}
        <span
          className={cn(
            "absolute -inset-[2em] rounded-full",
            revealMs > 0
              ? "animate-[cast-flare_var(--reveal-ms)_ease-out_both]"
              : "opacity-50"
          )}
          style={{
            background: `radial-gradient(closest-side, ${color} 0%, ${color}99 35%, transparent 100%)`,
          }}
        />
        <div
          className={cn(
            "relative [transform-style:preserve-3d]",
            revealMotion(revealMs)
          )}
        >
          <CardFrame
            cardId={cast.card.cardId}
            rank={cast.card.rank}
            countdown={cast.skill.countdown}
            className="[backface-visibility:hidden]"
          />
          {enemy ? (
            <CardBack className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]" />
          ) : null}
        </div>
        {cast.phase === "settle" && cast.recalled !== null ? (
          <SettleChip recalled={cast.recalled} />
        ) : null}
      </div>
      <p
        className={cn(
          "font-display mt-2 max-w-[11rem] rounded-lg border-2 bg-[#1c140e]/90 px-2.5 py-1 text-center text-sm leading-tight font-bold text-balance text-[#fff6df] shadow-[0_3px_0_rgba(0,0,0,0.45)] [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:py-0.5",
          revealMs > 0 &&
            "animate-[cast-plate_var(--reveal-ms)_ease-out_both] motion-reduce:animate-[cast-fade-in_var(--reveal-ms)_linear_both]"
        )}
        style={{ borderColor: SIDE_COLORS[cast.side].main }}
      >
        {text(cardText(cast.card.cardId, cast.card.rank).name)}
      </p>
    </div>
  );
};

/**
 * Shows each Skill Card cast, of both Sides, next to its caster: which card,
 * and where it goes after its effect. A screen reader hears "The enemy casts
 * Fireball". The scene shows the target Squares and the spell bolt.
 */
export const CastCard = () => {
  const { tr, text } = useGameText();
  const session = useAtomValue(battleSessionAtom);
  const cast = session
    ? currentCast(session.log, session.current !== null)
    : null;
  const name = cast
    ? text(cardText(cast.card.cardId, cast.card.rank).name)
    : "";
  return (
    <div className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
      <p className="sr-only" aria-live="polite">
        {cast ? tr(`battle.cast.${cast.side}`, { name }) : null}
      </p>
      {cast && session?.current ? (
        <CastPiece
          key={cast.id}
          cast={cast}
          duration={session.current.duration}
        />
      ) : null}
    </div>
  );
};
