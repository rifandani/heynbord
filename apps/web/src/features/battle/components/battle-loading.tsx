import { LANE_LENGTH } from "@workspace/rules";
import type { Side } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { goldFace } from "@/core/components/game/surfaces";
import { SIDE_COLORS } from "@/core/components/game/tokens";
import { enemyNameRef } from "@/features/battle/battle-content";
import { modelProgress } from "@/features/battle/battle-model-progress";
import { battlePainting } from "@/features/battle/battle-painting";
import type { BattleRead } from "@/features/battle/battle-session";
import { heroOf } from "@/features/battle/battle-view";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { classGlyph } from "@/features/battle/glyphs";
import type { LoadStep } from "@/features/battle/scene-load";
import { loadShare, loadStep, sceneLoad } from "@/features/battle/scene-load";
import { useGameText } from "@/features/battle/use-game-text";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";

/** The hold on "Ready" plus the fade, as in `.battle-cover` (globals.css). */
const EXIT_MS = 260 + 560;

/** How long one loading line stays. */
const TIP_MS = 2600;
const TIP_COUNT = 8;

const SQUARES = Array.from({ length: LANE_LENGTH }, (_, index) => index);

/** The four-point star of the Heynbord emblem. Decorative. */
const Star = ({ className }: { readonly className?: string }) => (
  <svg viewBox="-20 -28 40 50" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M0 -27 Q3 -9 18 -5 Q3 -1 0 20 Q-3 -1 -18 -5 Q-3 -9 0 -27 Z"
    />
  </svg>
);

/** One Hero of the match-up, on a night plate in its Side color. */
const HeroPlate = ({
  side,
  name,
  children,
}: {
  readonly side: Side;
  readonly name: string;
  readonly children: ReactNode;
}) => (
  <div
    className={cn(
      "flex min-w-0 animate-[cover-side_640ms_cubic-bezier(0.16,1,0.3,1)_both] flex-col items-center gap-3 [@media(max-height:500px)]:gap-1.5",
      side === "enemy" && "[animation-delay:80ms]"
    )}
    // SAFETY: a CSS custom property for the keyframes. React's
    // `CSSProperties` does not model custom properties.
    style={
      { "--cover-from": side === "player" ? "-45%" : "45%" } as CSSProperties
    }
  >
    <div
      className="bg-night-plate/85 shadow-lift rounded-2xl border-[3px] p-2 [@media(max-height:500px)]:p-1.5"
      style={{ borderColor: SIDE_COLORS[side].main }}
    >
      {children}
    </div>
    <p className="font-display text-cream max-w-full truncate px-1 text-center text-xl leading-tight font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] sm:text-2xl [@media(max-height:500px)]:text-base">
      {name}
    </p>
  </div>
);

/** The gold seal between the two Heroes. */
const VersusSeal = ({
  label,
  ready,
}: {
  readonly label: string;
  readonly ready: boolean;
}) => (
  <div className="relative grid animate-[cover-seal_560ms_cubic-bezier(0.34,1.56,0.64,1)_200ms_both] place-items-center">
    <div
      className={cn(
        "relative grid size-24 place-items-center sm:size-28 [@media(max-height:500px)]:size-16",
        ready
          ? "animate-[cover-ready_480ms_ease-out_both]"
          : "motion-safe:animate-[cover-seal-idle_2.4s_ease-in-out_800ms_infinite]"
      )}
    >
      <Star className="text-gold-light/70 absolute inset-[-30%] size-[160%] motion-safe:animate-[cover-glint_6s_linear_infinite]" />
      <span
        className={cn(
          goldFace,
          "shadow-bevel relative grid size-full place-items-center rounded-full border-4"
        )}
      >
        <span className="font-display text-3xl leading-none font-black tracking-[0.02em] sm:text-4xl [@media(max-height:500px)]:text-2xl">
          {label}
        </span>
      </span>
    </div>
  </div>
);

/**
 * The Lane bar: one Square for each Square of a Lane. Each Square lights up
 * gold as the Battle loads, and a star rides on the last lit Square.
 */
const LaneBar = ({ share }: { readonly share: number }) => {
  const lit = Math.floor(share * LANE_LENGTH + 1e-6);
  return (
    <div
      aria-hidden
      className="bg-plate-socket/90 shadow-well border-wood-edge flex w-full gap-1 rounded-xl border-2 p-1.5 sm:gap-1.5"
    >
      {SQUARES.map((index) => {
        const on = index < lit;
        const next = index === lit;
        return (
          <span
            key={index}
            className={cn(
              "relative h-8 min-w-0 flex-1 rounded-md border-2 sm:h-10 [@media(max-height:500px)]:h-6",
              on
                ? cn(
                    goldFace,
                    "shadow-piece animate-[cover-square_380ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
                  )
                : "border-plate-ember bg-night-plate"
            )}
          >
            {next ? (
              <span className="bg-gold/40 absolute inset-0.5 rounded-sm motion-safe:animate-[cover-next_1.1s_ease-in-out_infinite]" />
            ) : null}
            {on && index === lit - 1 ? (
              <Star className="text-cream absolute top-1/2 left-1/2 h-[80%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_4px_rgba(255,224,138,0.9)]" />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

const STEP_KEYS: Readonly<Record<LoadStep, string>> = {
  units: "battle.loadingCover.units",
  board: "battle.loadingCover.board",
  ready: "battle.loadingCover.ready",
};

/** A new loading line every few seconds, from a start that the seed picks. */
const useTip = (seed: number, running: boolean): number => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = window.setInterval(
      () => setStep((value) => value + 1),
      TIP_MS
    );
    return () => window.clearInterval(timer);
  }, [running]);
  return (Math.abs(seed) + step) % TIP_COUNT;
};

const CoverContent = ({
  session,
  leaving,
}: {
  readonly session: BattleRead;
  readonly leaving: boolean;
}) => {
  const { tr, text } = useGameText();
  const scene = useSyncExternalStore(
    sceneLoad.subscribe,
    sceneLoad.get,
    sceneLoad.get
  );
  const models = useSyncExternalStore(
    modelProgress.subscribe,
    modelProgress.get,
    modelProgress.get
  );
  // The bar never moves back when a new load starts.
  const computed = leaving ? 1 : loadShare(models, scene);
  const [share, setShare] = useState(computed);
  if (computed > share) {
    setShare(computed);
  }
  const step = leaving ? "ready" : loadStep(scene);
  const tip = useTip(session.options.seed, step !== "ready");
  const { options, view } = session;
  const painting = battlePainting(options);
  const player = heroOf(view, "player");
  const enemy = heroOf(view, "enemy");
  return (
    <>
      {painting ? (
        <div
          aria-hidden
          className="battle-cover-art absolute inset-0"
          style={{ backgroundImage: `url("${painting}")` }}
        />
      ) : null}
      <div aria-hidden className="battle-cover-shade absolute inset-0" />
      <div className="battle-cover-body relative grid h-full place-items-center overflow-y-auto px-4 py-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] [@media(max-height:500px)]:py-3">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10 [@media(max-height:500px)]:gap-4">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-8">
            <HeroPlate side="player" name={tr("battle.player")}>
              <span className="block w-20 sm:w-24 [@media(max-height:500px)]:w-14">
                <HeroPortrait
                  id={options.appearance?.portrait ?? null}
                  classId={player.classId}
                />
              </span>
            </HeroPlate>
            <VersusSeal
              label={tr("battle.loadingCover.versus")}
              ready={step === "ready"}
            />
            <HeroPlate side="enemy" name={text(enemyNameRef(options))}>
              <span
                className="grid aspect-[3/4] w-20 place-items-center rounded-[12%] sm:w-24 [@media(max-height:500px)]:w-14"
                style={{
                  background: `linear-gradient(180deg, ${SIDE_COLORS.enemy.main}, ${SIDE_COLORS.enemy.dark})`,
                }}
              >
                <GlyphIcon
                  glyph={classGlyph(enemy.classId)}
                  className="text-cream size-1/2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]"
                />
              </span>
            </HeroPlate>
          </div>
          <div className="flex w-full max-w-xl flex-col items-center gap-3 [@media(max-height:500px)]:gap-2">
            <div className="flex w-full items-baseline justify-between gap-4 px-1">
              <p
                key={step}
                className="font-display text-cream animate-[cover-line_320ms_cubic-bezier(0.16,1,0.3,1)_both] text-lg leading-tight font-bold sm:text-xl [@media(max-height:500px)]:text-base"
              >
                {tr(STEP_KEYS[step])}
              </p>
              <p className="text-gold-light text-sm font-black tabular-nums">
                {step === "units" && models
                  ? `${models.done} / ${models.total}`
                  : `${Math.round(share * 100)}%`}
              </p>
            </div>
            <LaneBar share={share} />
            <p
              key={tip}
              className="text-cream-dim min-h-[1.4em] animate-[cover-line_420ms_cubic-bezier(0.16,1,0.3,1)_both] text-center text-sm italic sm:text-base [@media(max-height:500px)]:text-xs"
            >
              {tr(`battle.loadingCover.tip${tip + 1}`)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * The loading cover of the Battle. It stays over the Battle from Fight until
 * every part of the Board has loaded and drawn, so no Unit, Hero or Lane
 * appears late. Then the painting comes into focus and the cover fades.
 */
export const BattleLoading = ({
  session,
}: {
  readonly session: BattleRead | null;
}) => {
  const { tr } = useGameText();
  const { ready, reveal } = useSyncExternalStore(
    sceneLoad.subscribe,
    sceneLoad.get,
    sceneLoad.get
  );
  // The last reveal whose fade ended. A new reveal fades the cover out once.
  const [faded, setFaded] = useState(reveal);
  const leaving = ready && reveal !== faded;
  useEffect(() => {
    if (!leaving) {
      return;
    }
    const timer = window.setTimeout(() => setFaded(reveal), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, reveal]);
  // Leaving the Battle closes the cover at once.
  if (!session || (ready && !leaving)) {
    return null;
  }
  return (
    <output
      aria-label={tr("battle.loading")}
      data-testid="battle-loading"
      data-state={leaving ? "leaving" : "loading"}
      className="battle-cover text-cream fixed inset-0 z-40 block overflow-hidden"
    >
      <CoverContent session={session} leaving={leaving} />
    </output>
  );
};
