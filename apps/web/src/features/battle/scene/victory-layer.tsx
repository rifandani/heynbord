import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { Mesh } from "three";
import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";

import { heroX, heroZ } from "@/features/battle/scene/layout";
import { playback, victoryTime } from "@/features/battle/scene/playback";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { flashAt, lightAt, VICTORY } from "@/features/battle/scene/victory";
import { VICTORY_CONFETTI, VICTORY_MOTE } from "@/features/battle/tokens";

/** The confetti of the raised sword, and the motes of the dissolving enemy Hero. */
const COUNT = { confetti: 96, motes: 56 } as const;

/** The tip of the raised sword, above the feet of the Player Hero. */
const SWORD_TIP = 2.05;

/** The same random numbers in each session, so a Replay looks the same. */
const seeds = (count: number, salt: number): Float32Array => {
  const values = new Float32Array(count * 4);
  for (let index = 0; index < values.length; index += 1) {
    const wave = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43_758.5453;
    values[index] = wave - Math.floor(wave);
  }
  return values;
};

const instanced = (count: number, salt: number): InstancedBufferGeometry => {
  const quad = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  geometry.setAttribute("uv", quad.getAttribute("uv"));
  geometry.setAttribute(
    "aSeed",
    new InstancedBufferAttribute(seeds(count, salt), 4)
  );
  geometry.instanceCount = count;
  return geometry;
};

/** Each flake flies up and out from the sword, tumbles, and floats down. */
const CONFETTI_VERTEX = /* glsl */ `
uniform float uAge;
uniform vec3 uOrigin;
uniform vec3 uColors[4];
attribute vec4 aSeed;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float age = uAge - aSeed.w * 0.12;
  float life = 2.2 + aSeed.z * 1.1;
  if (age < 0.0 || age > life) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float angle = aSeed.x * 6.2831853;
  float spread = 0.5 + aSeed.y * 1.7;
  // Up, and a little toward the Board and the camera.
  vec3 velocity = vec3(cos(angle) * spread * 1.6 + 1.1, 4.2 + aSeed.z * 3.2, sin(angle) * spread * 0.9 + 0.8);
  float drag = (1.0 - exp(-2.6 * age)) / 2.6;
  vec3 p = uOrigin + velocity * drag;
  // After the burst, each flake floats down past the Hero at its own speed.
  p.y -= (0.55 + aSeed.x * 0.5) * age + 0.18 * age * age;
  float settle = min(1.0, age);
  p.x += sin(age * (5.0 + aSeed.y * 4.0) + aSeed.x * 20.0) * 0.12 * settle;
  p.z += cos(age * (4.0 + aSeed.z * 3.0) + aSeed.y * 20.0) * 0.08 * settle;
  float spin = age * (5.0 + aSeed.x * 8.0) + aSeed.y * 6.2831853;
  float flip = cos(age * (7.0 + aSeed.z * 6.0) + aSeed.w * 6.2831853);
  vec2 size = vec2(0.075, 0.12) * (0.8 + aSeed.y * 0.5);
  vec2 corner = position.xy * size * vec2(abs(flip) * 0.85 + 0.15, 1.0);
  float c = cos(spin);
  float s = sin(spin);
  corner = mat2(c, s, -s, c) * corner;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  view.xy += corner;
  gl_Position = projectionMatrix * view;
  float pick = aSeed.x * 4.0;
  vec3 color = pick < 1.0 ? uColors[0] : pick < 2.0 ? uColors[1] : pick < 3.0 ? uColors[2] : uColors[3];
  // Gold comes up two times as often as the other colors.
  color = aSeed.y > 0.55 ? uColors[0] : color;
  vColor = color * (0.62 + 0.38 * abs(flip));
  vAlpha = 1.0 - smoothstep(life * 0.7, life, age);
}
`;

const CONFETTI_FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(vColor, vAlpha * uOpacity);
  if (gl_FragColor.a < 0.004) discard;
  #include <colorspace_fragment>
}
`;

/** Each mote leaves the body of the enemy Hero and rises as it fades. */
const MOTE_VERTEX = /* glsl */ `
uniform float uAge;
uniform vec3 uOrigin;
attribute vec4 aSeed;
varying vec2 vUv;
varying float vAlpha;
void main() {
  float age = uAge - aSeed.w * 0.7;
  float life = 0.8 + aSeed.z * 0.7;
  if (age < 0.0 || age > life) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float u = age / life;
  vec3 p = uOrigin + vec3((aSeed.x - 0.5) * 0.75, 0.25 + aSeed.y * 1.85, (aSeed.z - 0.5) * 0.4);
  p.y += age * (0.6 + aSeed.x * 0.7);
  p.x += sin(age * 3.0 + aSeed.y * 12.0) * 0.08 + age * 0.18;
  float size = (0.07 + aSeed.y * 0.09) * (1.0 - u * 0.5);
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  view.xy += position.xy * size;
  gl_Position = projectionMatrix * view;
  vUv = uv;
  vAlpha = sin(3.14159265 * u);
}
`;

const MOTE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
void main() {
  float glow = pow(max(0.0, 1.0 - length(vUv - 0.5) * 2.0), 1.6);
  gl_FragColor = vec4(uColor, glow * vAlpha * uOpacity);
  if (gl_FragColor.a < 0.004) discard;
  #include <colorspace_fragment>
}
`;

const confettiMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uAge: { value: -1 },
      uOrigin: { value: new Vector3() },
      uOpacity: { value: 1 },
      uColors: { value: VICTORY_CONFETTI.map((color) => new Color(color)) },
    },
    vertexShader: CONFETTI_VERTEX,
    fragmentShader: CONFETTI_FRAGMENT,
  });

const moteMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    blending: AdditiveBlending,
    uniforms: {
      uAge: { value: -1 },
      uOrigin: { value: new Vector3() },
      uOpacity: { value: 1 },
      uColor: { value: new Color(VICTORY_MOTE) },
    },
    vertexShader: MOTE_VERTEX,
    fragmentShader: MOTE_FRAGMENT,
  });

/** The light and the flash over the scene (`VictoryAtmosphere` in the Battle stage). */
const useAtmosphere = () => {
  const gl = useThree((state) => state.gl);
  const parts = useRef<{
    light: HTMLElement | null;
    flash: HTMLElement | null;
  }>({ light: null, flash: null });
  useLayoutEffect(() => {
    const layer = gl.domElement.closest("[data-testid='battle-board-layer']");
    const find = (selector: string) => {
      const found = layer?.querySelector(selector);
      return found instanceof HTMLElement ? found : null;
    };
    parts.current = {
      light: find("[data-victory-light]"),
      flash: find("[data-victory-flash]"),
    };
    return () => {
      for (const part of Object.values(parts.current)) {
        part?.style.removeProperty("opacity");
      }
    };
  }, [gl]);
  return parts;
};

/** Puts the age and the origin of an emitter on the shader of its mesh. */
const moveEmitter = (
  mesh: Mesh,
  age: number,
  x: number,
  y: number,
  z: number
) => {
  if (!(mesh.material instanceof ShaderMaterial)) {
    return;
  }
  const { uniforms } = mesh.material;
  if (uniforms.uAge) {
    uniforms.uAge.value = age;
  }
  if (uniforms.uOrigin?.value instanceof Vector3) {
    uniforms.uOrigin.value.set(x, y, z);
  }
};

const setOpacity = (element: HTMLElement | null, opacity: number) => {
  if (!element) {
    return;
  }
  const value = opacity < 0.002 ? "0" : opacity.toFixed(3);
  if (element.style.opacity !== value) {
    element.style.opacity = value;
  }
};

/**
 * The effects of a win (`scene/victory.ts`): the confetti of the raised
 * sword, the motes of the dissolving enemy Hero, the warm light that breaks
 * through, and the flash of the last hit. With reduced motion, only the
 * light and a softer flash show: they change color, not place.
 */
export const VictoryLayer = () => {
  const reduced = useReducedMotion();
  const confetti = useRef<Mesh>(null);
  const motes = useRef<Mesh>(null);
  const atmosphere = useAtmosphere();
  const light = useRef(0);
  const geometry = useMemo(
    () => ({
      confetti: instanced(COUNT.confetti, 1),
      motes: instanced(COUNT.motes, 2),
    }),
    []
  );
  const material = useMemo(
    () => ({ confetti: confettiMaterial(), motes: moteMaterial() }),
    []
  );
  useEffect(
    () => () => {
      geometry.confetti.dispose();
      geometry.motes.dispose();
      material.confetti.dispose();
      material.motes.dispose();
    },
    [geometry, material]
  );

  useFrame((_, delta) => {
    const t = victoryTime();
    const view = playback.session?.view;
    light.current = MathUtils.damp(
      light.current,
      t === null ? 0 : lightAt(t),
      6,
      Math.min(delta, 0.1)
    );
    const breath =
      t === null || reduced ? 1 : 0.9 + 0.1 * Math.sin(t * 0.7 - 1.2);
    setOpacity(atmosphere.current.light, light.current * breath);
    // The warm flash is for the last hit of a win only (`scene/defeat.ts`
    // has the pulse of a loss).
    const flash =
      playback.finalBlowTo === "enemy" ? flashAt(playback.finalBlow) : 0;
    setOpacity(atmosphere.current.flash, flash * (reduced ? 0.5 : 1));
    const shown = t !== null && !reduced && view !== undefined;
    const flakes = confetti.current;
    if (flakes) {
      flakes.visible = shown && t < VICTORY.apex + 3.6;
      if (shown) {
        moveEmitter(
          flakes,
          t - VICTORY.apex + 0.06,
          heroX("player") + 0.15,
          SWORD_TIP,
          heroZ(view, "player", 0)
        );
      }
    }
    const spirit = motes.current;
    if (spirit) {
      const alone = view?.sides.enemy.heroes.length === 1;
      spirit.visible = shown && alone && t < VICTORY.dissolve.end + 1.6;
      if (shown) {
        moveEmitter(
          spirit,
          t - VICTORY.dissolve.start - 0.1,
          heroX("enemy"),
          0,
          heroZ(view, "enemy", 0)
        );
      }
    }
  });

  return (
    <>
      <mesh
        ref={motes}
        geometry={geometry.motes}
        material={material.motes}
        frustumCulled={false}
        renderOrder={6}
        visible={false}
      />
      <mesh
        ref={confetti}
        geometry={geometry.confetti}
        material={material.confetti}
        frustumCulled={false}
        renderOrder={6}
        visible={false}
      />
    </>
  );
};
