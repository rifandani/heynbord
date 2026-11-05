import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { Mesh } from "three";
import {
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MathUtils,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";

import { DEFEAT, dimAt, pulseAt } from "@/features/battle/scene/defeat";
import { heroX, heroZ } from "@/features/battle/scene/layout";
import { defeatTime, playback } from "@/features/battle/scene/playback";
import { useReducedMotion } from "@/features/battle/scene/reduced-motion";
import { DEFEAT_DUST } from "@/features/battle/tokens";

/** The puffs of dust that the knee puts up. */
const COUNT = 40;

/** The seconds that the dust stays in the air. */
const DUST_LIFE = 1.6;

/** The same random numbers in each session, so a Replay looks the same. */
const seeds = (count: number): Float32Array => {
  const values = new Float32Array(count * 4);
  for (let index = 0; index < values.length; index += 1) {
    const wave = Math.sin((index + 1) * 12.9898 + 3 * 78.233) * 43_758.5453;
    values[index] = wave - Math.floor(wave);
  }
  return values;
};

const instanced = (count: number): InstancedBufferGeometry => {
  const quad = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  geometry.setAttribute("uv", quad.getAttribute("uv"));
  geometry.setAttribute("aSeed", new InstancedBufferAttribute(seeds(count), 4));
  geometry.instanceCount = count;
  return geometry;
};

/**
 * Each puff leaves the ground at the knee, rolls out low along the ground
 * (more to the sides than up), grows, slows and thins out.
 */
const DUST_VERTEX = /* glsl */ `
uniform float uAge;
uniform vec3 uOrigin;
attribute vec4 aSeed;
varying vec2 vUv;
varying float vAlpha;
void main() {
  float age = uAge - aSeed.w * 0.06;
  float life = 0.9 + aSeed.z * 0.7;
  if (age < 0.0 || age > life) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float u = age / life;
  float angle = aSeed.x * 6.2831853;
  float speed = 0.9 + aSeed.y * 1.3;
  // Out along the ground, flat: the camera looks down, so depth reads as up.
  vec3 velocity = vec3(cos(angle) * speed, 0.25 + aSeed.z * 0.45, sin(angle) * speed * 0.55);
  float drag = (1.0 - exp(-4.0 * age)) / 4.0;
  vec3 p = uOrigin + velocity * drag;
  p.y += 0.04 + age * 0.12;
  float size = (0.16 + aSeed.y * 0.2) * (0.6 + 1.1 * sqrt(u));
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  view.xy += position.xy * size;
  gl_Position = projectionMatrix * view;
  vUv = uv;
  // In fast, out slow.
  vAlpha = smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.25, 1.0, u));
}
`;

const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float puff = pow(max(0.0, 1.0 - d), 1.8);
  gl_FragColor = vec4(uColor, puff * vAlpha * uOpacity * 0.55);
  if (gl_FragColor.a < 0.004) discard;
  #include <colorspace_fragment>
}
`;

const dustMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uAge: { value: -1 },
      uOrigin: { value: new Vector3() },
      uOpacity: { value: 1 },
      uColor: { value: new Color(DEFEAT_DUST) },
    },
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
  });

interface Atmosphere {
  shade: HTMLElement | null;
  grey: HTMLElement | null;
  pulse: HTMLElement | null;
}

/** The shade, the grey and the pulse over the scene (`DefeatAtmosphere` in the Battle stage). */
const useAtmosphere = () => {
  const gl = useThree((state) => state.gl);
  const parts = useRef<Atmosphere>({ shade: null, grey: null, pulse: null });
  useLayoutEffect(() => {
    const layer = gl.domElement.closest("[data-testid='battle-board-layer']");
    const find = (selector: string) => {
      const found = layer?.querySelector(selector);
      return found instanceof HTMLElement ? found : null;
    };
    parts.current = {
      shade: find("[data-defeat-shade]"),
      grey: find("[data-defeat-grey]"),
      pulse: find("[data-defeat-pulse]"),
    };
    return () => {
      for (const part of Object.values(parts.current)) {
        part?.style.removeProperty("opacity");
      }
    };
  }, [gl]);
  return parts;
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
 * The effects of a loss (`scene/defeat.ts`): the pulse at the edges of the
 * screen at the last hit, the dust that the knee puts up, and the shade and
 * the grey that come over the Board while the loss sinks in. With reduced
 * motion, the dust does not show, and the pulse is softer: the rest changes
 * color, not place.
 */
export const DefeatLayer = () => {
  const reduced = useReducedMotion();
  const dust = useRef<Mesh>(null);
  const atmosphere = useAtmosphere();
  const dim = useRef(0);
  const geometry = useMemo(() => instanced(COUNT), []);
  const material = useMemo(() => dustMaterial(), []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame((_, delta) => {
    const t = defeatTime();
    const view = playback.session?.view;
    // Damped, so the Board comes back softly when the Battle Log opens.
    dim.current = MathUtils.damp(
      dim.current,
      t === null ? 0 : dimAt(t),
      6,
      Math.min(delta, 0.1)
    );
    // Dusk, not night: the Board stays bright enough to read (brand tone).
    setOpacity(atmosphere.current.shade, dim.current * 0.68);
    setOpacity(atmosphere.current.grey, dim.current * 0.42);
    const hit =
      playback.finalBlowTo === "player" ? pulseAt(playback.finalBlow) : 0;
    setOpacity(atmosphere.current.pulse, hit * (reduced ? 0.6 : 1));
    const puffs = dust.current;
    if (!puffs) {
      return;
    }
    const age = t === null ? -1 : t - DEFEAT.impact;
    puffs.visible =
      !reduced && view !== undefined && age >= 0 && age < DUST_LIFE;
    if (puffs.visible && view && puffs.material instanceof ShaderMaterial) {
      const { uniforms } = puffs.material;
      if (uniforms.uAge) {
        uniforms.uAge.value = age;
      }
      if (uniforms.uOrigin?.value instanceof Vector3) {
        // At the knee: a little in front of the Hero, toward the Board.
        uniforms.uOrigin.value.set(
          heroX("player") + 0.2,
          0,
          heroZ(view, "player", 0) + 0.15
        );
      }
    }
  });

  return (
    <mesh
      ref={dust}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={5}
      visible={false}
    />
  );
};
