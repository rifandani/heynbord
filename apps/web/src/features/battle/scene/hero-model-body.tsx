import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

import type { HeroAppearance } from "@/features/battle/battle-session";
import {
  battleLogAtom,
  shownSessionAtom,
} from "@/features/battle/battle.atoms";
import { heroAnimation } from "@/features/battle/scene/hero-animation";
import { buildHeroRig } from "@/features/battle/scene/hero-rig";
import { playback } from "@/features/battle/scene/playback";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { ModelErrorBoundary } from "@/features/hero/components/model-error-boundary";
import { heroModelUrl } from "@/features/hero/hero-model-assets";
import { loadHeroAppearance } from "@/features/hero/hero-model-loader";
import {
  heroModelFailureAtom,
  heroModelRetryAtom,
} from "@/features/hero/hero-model.atoms";

const Figure = ({ model }: { readonly model: GLTF }) => {
  const session = useAtomValue(shownSessionAtom);
  const log = useAtomValue(battleLogAtom);
  const reduced = useReducedMotion();
  const rig = useMemo(() => buildHeroRig(model), [model]);
  const clock = useRef(0);
  useFrame((_, delta) => {
    const shown = playback.session ?? session;
    if (shown) {
      if (!playback.paused && (!log || log.playing)) {
        clock.current += Math.min(delta, 0.1) * shown.speed;
      }
      rig.update(
        heroAnimation(
          shown,
          playback.progress,
          clock.current,
          rig.loopSeconds,
          reduced
        )
      );
    }
  });
  return <primitive object={rig.root} />;
};

/** A complete appearance replaces the portrait only after it loads. */
export default function HeroModelBody({
  appearance,
  fallback,
}: {
  readonly appearance: HeroAppearance;
  readonly fallback: ReactNode;
}) {
  const retry = useAtomValue(heroModelRetryAtom);
  const setFailure = useAtomSet(heroModelFailureAtom);
  const { portrait, gearLook } = appearance;
  const key = heroModelUrl(appearance);
  const requestKey = `${key}:${retry}`;
  const [loaded, setLoaded] = useState<{
    readonly key: string;
    readonly model: GLTF;
  } | null>(null);
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const model = await loadHeroAppearance({ portrait, gearLook });
        if (active) {
          setLoaded({ key: requestKey, model });
          setFailure(null);
        }
      } catch {
        if (active) {
          setFailure(key);
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [portrait, gearLook, key, requestKey, setFailure]);
  return loaded?.key === requestKey ? (
    <ModelErrorBoundary
      key={requestKey}
      fallback={fallback}
      onError={() => setFailure(key)}
    >
      <Figure model={loaded.model} />
    </ModelErrorBoundary>
  ) : (
    fallback
  );
}
