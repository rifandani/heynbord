import type { ClassId } from "@workspace/rules";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "react-aria-components";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

import type { HeroAppearance } from "@/features/battle/battle-session";
import { GlyphIcon } from "@/features/battle/components/glyph-icon";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { useGameText } from "@/features/battle/use-game-text";
import { HeroPortrait } from "@/features/hero/components/hero-portrait";
import { ModelErrorBoundary } from "@/features/hero/components/model-error-boundary";
import { heroModelUrl } from "@/features/hero/hero-model-assets";
import { loadHeroAppearance } from "@/features/hero/hero-model-loader";

const Canvas = lazy(
  () => import("@/features/hero/components/hero-model-canvas")
);
const INITIAL_ANGLE = 0.25;
const ROTATE_STEP = Math.PI / 6;
const CONTROL =
  "border-gold-trim/70 bg-night-plate text-cream rounded-md border px-2 py-1 text-xs font-bold outline-none data-[focus-visible]:ring-focus-cream data-[focus-visible]:ring-2";

interface LoadResult {
  readonly key: string;
  readonly model: GLTF | null;
}

/** The same appearance preview for the Hero screen and the Bazaar. */
export const HeroModelPreview = ({
  appearance,
  classId,
}: {
  readonly appearance: HeroAppearance;
  readonly classId: ClassId;
}) => {
  const { tr } = useGameText();
  const reducedMotion = useReducedMotion();
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [angle, setAngle] = useState(INITIAL_ANGLE);
  const pointerX = useRef<number | null>(null);
  const key = heroModelUrl(appearance);
  const requestKey = `${key}:${attempt}`;
  const { portrait, gearLook } = appearance;
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const model = await loadHeroAppearance({ portrait, gearLook });
        if (active) {
          setResult({ key: requestKey, model });
        }
      } catch {
        if (active) {
          setResult({ key: requestKey, model: null });
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [portrait, gearLook, requestKey]);
  const ready = result?.key === requestKey ? result : null;
  const fallback = (
    <HeroPortrait
      id={portrait}
      classId={classId}
      className="h-full w-auto max-w-full"
    />
  );
  return (
    <section
      aria-label={tr("hero.label")}
      className="flex h-full min-h-0 flex-col gap-2"
      data-testid="hero-model-preview"
      data-model={ready?.model ? key : undefined}
    >
      <div
        className="bg-night-plate/70 relative flex min-h-0 flex-1 touch-pan-y items-center justify-center overflow-hidden rounded-xl"
        onPointerDown={(event) => {
          pointerX.current = event.clientX;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (pointerX.current !== null) {
            const change = (event.clientX - pointerX.current) * 0.01;
            setAngle((value) => value + change);
            pointerX.current = event.clientX;
          }
        }}
        onPointerUp={() => {
          pointerX.current = null;
        }}
        onPointerCancel={() => {
          pointerX.current = null;
        }}
      >
        {ready?.model ? (
          <ModelErrorBoundary
            key={requestKey}
            fallback={fallback}
            onError={() => setResult({ key: requestKey, model: null })}
          >
            <Suspense fallback={fallback}>
              <Canvas
                model={ready.model}
                angle={angle}
                reducedMotion={reducedMotion}
              />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          fallback
        )}
      </div>
      {ready?.model ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            className={CONTROL}
            aria-label={tr("hero.rotateLeft")}
            onPress={() => setAngle((value) => value - ROTATE_STEP)}
          >
            <GlyphIcon glyph="chevron" className="size-4 rotate-90" />
          </Button>
          <Button
            className={CONTROL}
            aria-label={tr("hero.rotateRight")}
            onPress={() => setAngle((value) => value + ROTATE_STEP)}
          >
            <GlyphIcon glyph="chevron" className="size-4 -rotate-90" />
          </Button>
          <Button className={CONTROL} onPress={() => setAngle(INITIAL_ANGLE)}>
            {tr("hero.resetView")}
          </Button>
        </div>
      ) : ready ? (
        <div>
          <output>{tr("hero.modelFailed")}</output>{" "}
          <Button
            className={CONTROL}
            onPress={() => {
              setAttempt((value) => value + 1);
            }}
          >
            {tr("hero.modelRetry")}
          </Button>
        </div>
      ) : (
        <output>{tr("hero.modelLoading")}</output>
      )}
    </section>
  );
};

export default HeroModelPreview;
