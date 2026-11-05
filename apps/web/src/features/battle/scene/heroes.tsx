import { useAtomValue } from "@effect/atom-react";
import { useFrame } from "@react-three/fiber";
import type { ClassId, CosmeticId, HeroRef, Side } from "@workspace/rules";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { CanvasTexture, Group, Mesh, MeshBasicMaterial } from "three";
import { Color, ShaderMaterial } from "three";

import { SIDE_COLORS } from "@/core/components/game/tokens";
import { hasManyHeroes } from "@/features/battle/battle-view";
import { shownSessionAtom } from "@/features/battle/battle.atoms";
import { heroSlump, ringLightAt } from "@/features/battle/scene/defeat";
import {
  BRACKET_WIDTH,
  bracketSpot,
} from "@/features/battle/scene/front-brackets";
import type { HeroPose } from "@/features/battle/scene/hero-pose";
import { heroPose } from "@/features/battle/scene/hero-pose";
import {
  HERO_FIGURE_Y,
  heroScale,
  heroX,
} from "@/features/battle/scene/layout";
import {
  defeatTime,
  playback,
  victoryTime,
} from "@/features/battle/scene/playback";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import {
  blobShadowTexture,
  heroFigureTexture,
  heroPortraitTexture,
  loadedHeroPortrait,
} from "@/features/battle/scene/textures";
import {
  enemyHeroDissolve,
  heroFlourish,
} from "@/features/battle/scene/victory";
import {
  HIT_TINT,
  SCENE_WHITE,
  VICTORY_FADE_TINT,
} from "@/features/battle/tokens";
import { SceneHold, useSceneHold } from "@/features/battle/use-scene-hold";

const HeroModelBody = lazy(
  () => import("@/features/battle/scene/hero-model-body")
);

const WHITE = new Color(SCENE_WHITE);
const HIT = new Color(HIT_TINT);
const CAST = new Color();
const FADE = new Color(VICTORY_FADE_TINT);
const PLAYER_RING = new Color(SIDE_COLORS.player.main);

/** The opacity of the Hero ring in full view. */
const RING_OPACITY = 0.85;

interface FigureParts {
  readonly stand: Group | null;
  readonly pivot: Group | null;
  readonly figure: MeshBasicMaterial | null;
  readonly ring: MeshBasicMaterial | null;
  readonly shadow: MeshBasicMaterial | null;
}

/**
 * Places a Hero: its ground spot (shadow and ring) at the middle of its
 * Front, and the figure on a pivot at its feet, so that a Defeated Hero falls
 * back from its feet.
 */
const placeHero = (
  parts: FigureParts,
  pose: HeroPose,
  x: number,
  turn: number,
  scale: number
) => {
  const { stand, pivot } = parts;
  if (stand) {
    stand.position.z = pose.z;
    stand.scale.setScalar(scale);
    stand.visible = pose.opacity > 0;
  }
  if (pivot) {
    pivot.position.x = (pose.x - x) / scale;
    pivot.position.y = pose.y - HERO_FIGURE_Y;
    pivot.rotation.x = 0;
    pivot.rotation.y = turn;
    pivot.rotation.z = pose.lean;
  }
};

const tintHero = (parts: FigureParts, pose: HeroPose) => {
  const { figure, ring, shadow } = parts;
  if (ring) {
    ring.opacity = RING_OPACITY * pose.opacity;
  }
  if (shadow) {
    shadow.opacity = pose.opacity;
  }
  if (!figure) {
    return;
  }
  figure.opacity = pose.opacity;
  figure.color.copy(WHITE);
  if (pose.cast) {
    figure.color.lerp(CAST.set(pose.cast.color), pose.cast.amount);
  }
  if (pose.hitTint !== null) {
    figure.color.lerp(HIT, pose.hitTint);
  }
};

/**
 * The victory sequence on a Hero (`scene/victory.ts`), on top of its pose: the
 * Player Hero celebrates in the way of its Class, and a lone enemy Hero
 * greys, tips back and dissolves. The Bosses of a Dungeon already fell, one
 * by one, in `HeroDefeated`.
 */
const celebrate = (
  parts: FigureParts,
  side: Side,
  classId: ClassId,
  alone: boolean,
  scale: number,
  reducedMotion: boolean
) => {
  const t = victoryTime();
  const { stand, pivot, figure, ring, shadow } = parts;
  if (t === null || !pivot) {
    return;
  }
  if (side === "player") {
    const flourish = heroFlourish(classId, t, reducedMotion);
    pivot.position.y += flourish.lift / scale;
    pivot.rotation.y += flourish.spin;
    pivot.rotation.z += flourish.lean;
    return;
  }
  if (!alone) {
    return;
  }
  const gone = enemyHeroDissolve(t, reducedMotion);
  pivot.position.y -= gone.sink;
  // The enemy falls back to the right, away from the Board.
  pivot.rotation.z -= gone.lean;
  if (figure) {
    figure.opacity *= gone.opacity;
    figure.color.lerp(FADE, gone.grey * 0.8);
  }
  if (ring) {
    ring.opacity *= gone.opacity;
  }
  if (shadow) {
    shadow.opacity *= gone.opacity;
  }
  if (stand) {
    stand.visible = gone.opacity > 0.001;
  }
};

/**
 * The defeat sequence on the Player Hero (`scene/defeat.ts`), on top of its
 * pose: the weight of the body as it staggers, drops and sags, its slow
 * breath, and its Side ring that goes out to grey. The ring dims with
 * reduced motion too: it is a change of light, not of place.
 */
const mourn = (
  parts: FigureParts,
  side: Side,
  scale: number,
  reducedMotion: boolean
) => {
  const { pivot, ring } = parts;
  if (side !== "player") {
    return;
  }
  const t = defeatTime();
  if (ring) {
    const light = t === null ? 1 : ringLightAt(t);
    ring.color.copy(PLAYER_RING).lerp(FADE, (1 - light) * 0.85);
    ring.opacity *= 0.35 + 0.65 * light;
  }
  if (t === null || !pivot) {
    return;
  }
  const slump = heroSlump(t, reducedMotion);
  pivot.position.y += slump.lift / scale;
  // A positive Z turn tips the player Hero back, away from the Board (as a
  // fall does in `heroPose`). A positive X turn bows it to the camera.
  pivot.rotation.z -= slump.sway;
  pivot.rotation.x += slump.bow;
};

const HeroFigure = ({ side, hero }: HeroRef) => {
  const session = useAtomValue(shownSessionAtom);
  const classId = session?.view.sides[side].heroes[hero]?.classId ?? "warrior";
  const portrait = session?.options.appearance?.portrait ?? null;
  // Only the Player Hero shows the Player's model and portrait; the enemy keeps its Class glyph.
  const shownPortrait = side === "player" ? portrait : null;
  const showPortrait = side === "player";
  const standee = useMemo(
    () => heroFigureTexture(side, classId),
    [side, classId]
  );
  const [art, setArt] = useState<{
    readonly id: CosmeticId | null;
    readonly texture: CanvasTexture;
  } | null>(() => {
    const loaded = showPortrait
      ? loadedHeroPortrait(side, shownPortrait)
      : undefined;
    return loaded ? { id: shownPortrait, texture: loaded } : null;
  });
  // A missing portrait keeps the Class standee; it ends the hold.
  const [missing, setMissing] = useState<CosmeticId | null | undefined>();
  useSceneHold(
    showPortrait && art?.id !== shownPortrait && missing !== shownPortrait
  );
  useEffect(() => {
    const id = shownPortrait;
    if (!showPortrait || art?.id === id) {
      return;
    }
    let mounted = true;
    const load = async () => {
      const texture = await heroPortraitTexture(side, id);
      if (!mounted) {
        return;
      }
      if (texture) {
        setArt({ id, texture });
      } else {
        setMissing(id);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [side, shownPortrait, showPortrait, art]);
  const texture =
    !showPortrait || art === null || art.id !== shownPortrait
      ? undefined
      : art.texture;
  const shadowTexture = useMemo(() => blobShadowTexture(), []);
  const stand = useRef<Group>(null);
  const pivot = useRef<Group>(null);
  const figure = useRef<MeshBasicMaterial>(null);
  const ring = useRef<MeshBasicMaterial>(null);
  const shadow = useRef<MeshBasicMaterial>(null);
  const reducedMotion = useReducedMotion();
  const x = heroX(side);
  const fallback = (
    <mesh position={[0, HERO_FIGURE_Y, 0]}>
      <planeGeometry args={[1.45, 2.03]} />
      <meshBasicMaterial
        ref={figure}
        map={texture ?? standee}
        transparent
        alphaTest={0.05}
        toneMapped={false}
      />
    </mesh>
  );

  useFrame(({ camera }) => {
    const shown = playback.session ?? session;
    if (!shown) {
      return;
    }
    const pose = heroPose(
      { side, hero },
      shown.current,
      shown.view,
      playback.progress,
      playback.time,
      reducedMotion
    );
    const parts = {
      stand: stand.current,
      pivot: pivot.current,
      figure: figure.current,
      ring: ring.current,
      shadow: shadow.current,
    };
    const scale = heroScale(shown.view, side);
    placeHero(
      parts,
      pose,
      x,
      Math.atan2(camera.position.x - x, camera.position.z - pose.z),
      scale
    );
    tintHero(parts, pose);
    celebrate(
      parts,
      side,
      classId,
      shown.view.sides[side].heroes.length === 1,
      scale,
      reducedMotion
    );
    mourn(parts, side, scale, reducedMotion);
  });

  return (
    <group ref={stand} name={`hero-${side}-${hero}`} position={[x, 0, 0]}>
      {/* The Hero stands on the Battle Painting: a shadow and a ring in its Side color (web ADR-0006). */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} renderOrder={1}>
        <circleGeometry args={[1.05, 24]} />
        <meshBasicMaterial
          ref={shadow}
          map={shadowTexture}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} renderOrder={2}>
        <ringGeometry args={[0.8, 0.94, 48]} />
        <meshBasicMaterial
          ref={ring}
          color={SIDE_COLORS[side].main}
          transparent
          opacity={RING_OPACITY}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={pivot}>
        {side === "player" ? (
          <Suspense
            fallback={
              <>
                {fallback}
                <SceneHold />
              </>
            }
          >
            <HeroModelBody
              appearance={
                session?.options.appearance ?? {
                  portrait: null,
                  gearLook: null,
                }
              }
              fallback={fallback}
            />
          </Suspense>
        ) : (
          fallback
        )}
      </group>
    </group>
  );
};

/**
 * A rounded frame with a soft fill, drawn from its distance field, so that the
 * line keeps its width when the Bracket grows over more Lanes.
 */
const bracketMaterial = (color: string) =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uSize: { value: [BRACKET_WIDTH, 1] },
      uColor: { value: new Color(color) },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 uSize;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      float roundBox(vec2 p, vec2 halfSize, float radius) {
        vec2 q = abs(p) - halfSize + radius;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
      }
      void main() {
        vec2 p = (vUv - 0.5) * uSize;
        float d = roundBox(p, uSize * 0.5 - 0.02, 0.42);
        float aa = fwidth(d);
        float inside = 1.0 - smoothstep(-aa, aa, d);
        float line = inside * smoothstep(-0.075 - aa, -0.075 + aa, d);
        // The fill is strongest at the edge and soft in the middle.
        float fill = inside * mix(0.1, 0.22, smoothstep(-0.5, 0.0, d));
        float alpha = max(line * 0.9, fill) * uOpacity;
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });

/**
 * The Front Bracket of one Boss: a mark on the ground under the Boss across
 * the Lanes that it holds (GDD 11.2). It is drawn in code, as the Stage
 * Markers are (web ADR-0007), and it does not cover a Square.
 */
const FrontBracket = ({ side, hero }: HeroRef) => {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () => bracketMaterial(SIDE_COLORS[side].main),
    [side]
  );
  const reducedMotion = useReducedMotion();

  useFrame(() => {
    const shown = playback.session;
    const node = mesh.current;
    if (!node) {
      return;
    }
    const spot = shown
      ? bracketSpot(
          { side, hero },
          shown.current,
          shown.view,
          playback.progress,
          reducedMotion
        )
      : null;
    node.visible = spot !== null;
    if (!spot) {
      return;
    }
    node.position.z = spot.z;
    node.scale.y = spot.depth;
    if (!(node.material instanceof ShaderMaterial)) {
      return;
    }
    const { uniforms } = node.material;
    if (uniforms.uSize) {
      uniforms.uSize.value = [BRACKET_WIDTH, spot.depth];
    }
    if (uniforms.uOpacity) {
      uniforms.uOpacity.value = spot.opacity;
    }
  });

  return (
    <mesh
      ref={mesh}
      name={`front-${side}-${hero}`}
      rotation-x={-Math.PI / 2}
      position={[heroX(side), 0.015, 0]}
      renderOrder={1}
      material={material}
    >
      <planeGeometry args={[BRACKET_WIDTH, 1]} />
    </mesh>
  );
};

const SIDES: readonly Side[] = ["player", "enemy"];

const indexes = (count: number): readonly number[] =>
  Array.from({ length: count }, (_, index) => index);

/**
 * The Heroes at the ends of the Lanes, outside the Board (GDD 4.1). In a
 * Dungeon, each Boss stands at the middle of its Front, on its Front Bracket
 * (GDD 11.2). A Stage shows no Bracket.
 */
export const Heroes = () => {
  const session = useAtomValue(shownSessionAtom);
  const view = session?.view;
  return (
    <>
      {SIDES.map((side) => {
        const count = view?.sides[side].heroes.length ?? 1;
        const brackets = view ? hasManyHeroes(view, side) : false;
        return indexes(count).map((hero) => (
          <group key={`${side}-${hero}`}>
            {brackets ? <FrontBracket side={side} hero={hero} /> : null}
            <HeroFigure side={side} hero={hero} />
          </group>
        ));
      })}
    </>
  );
};
