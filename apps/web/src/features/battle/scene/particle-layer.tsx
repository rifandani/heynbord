import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { Blending } from "three";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
} from "three";

import { currentCast } from "@/features/battle/cast";
import {
  fxList,
  projectileParticles,
  spellBoltParticles,
} from "@/features/battle/scene/fx";
import type { FxSlot } from "@/features/battle/scene/fx-atlas";
import { fxAtlas, fxSlotUv } from "@/features/battle/scene/fx-atlas";
import type { Emitter, Particle } from "@/features/battle/scene/particles";
import {
  billboardParticle,
  PARTICLE_POOL,
  spawnParticles,
} from "@/features/battle/scene/particles";
import { playback } from "@/features/battle/scene/playback";
import { prefersReducedMotion } from "@/features/battle/scene/reduced-motion";
import { loopStatuses } from "@/features/battle/scene/status-visuals";
import { unitAnchors } from "@/features/battle/scene/unit-anchors";

/**
 * A camera-facing quad: the center, the size, the spin and the stretch come
 * from each instance. The stretch makes the quad wider, for the trail. A
 * ground quad lies flat on the ground, and the spin turns it around the
 * vertical axis, for a rune ring.
 */
const VERTEX = /* glsl */ `
attribute vec3 aCenter;
attribute vec3 aSizeSpinStretch;
attribute vec4 aColor;
attribute vec4 aUv;
attribute float aGround;
varying vec2 vUv;
varying vec4 vColor;
void main() {
  float c = cos(aSizeSpinStretch.y);
  float s = sin(aSizeSpinStretch.y);
  vec2 corner = mat2(c, s, -s, c) * (position.xy * vec2(aSizeSpinStretch.z, 1.0)) * aSizeSpinStretch.x;
  vec4 view;
  if (aGround > 0.5) {
    // The top of the image is far from the camera.
    view = modelViewMatrix * vec4(aCenter + vec3(corner.x, 0.0, -corner.y), 1.0);
  } else {
    view = modelViewMatrix * vec4(aCenter, 1.0);
    view.xy += corner;
  }
  gl_Position = projectionMatrix * view;
  vUv = aUv.xy + uv * aUv.zw;
  vColor = aColor;
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D map;
varying vec2 vUv;
varying vec4 vColor;
void main() {
  vec4 texel = texture2D(map, vUv);
  gl_FragColor = vec4(texel.rgb * vColor.rgb, texel.a * vColor.a);
  if (gl_FragColor.a < 0.004) discard;
  #include <colorspace_fragment>
}
`;

const QUAD = new PlaneGeometry(1, 1);

/** The per-instance data of one mesh. */
interface Batch {
  readonly mesh: InstancedMesh<BufferGeometry, ShaderMaterial>;
  readonly center: InstancedBufferAttribute;
  readonly sizeSpinStretch: InstancedBufferAttribute;
  readonly color: InstancedBufferAttribute;
  readonly uv: InstancedBufferAttribute;
  readonly ground: InstancedBufferAttribute;
}

const dynamic = (size: number) =>
  new InstancedBufferAttribute(
    new Float32Array(PARTICLE_POOL * size),
    size
  ).setUsage(DynamicDrawUsage);

/**
 * One mesh for one blend mode. The effects test the depth but do not write
 * it, so a front-Lane Unit hides an effect behind it (web ADR-0009).
 */
const makeBatch = (blending: Blending): Batch => {
  const geometry = new BufferGeometry();
  geometry.setIndex(QUAD.getIndex());
  geometry.setAttribute("position", QUAD.getAttribute("position"));
  geometry.setAttribute("uv", QUAD.getAttribute("uv"));
  const center = dynamic(3);
  const sizeSpinStretch = dynamic(3);
  const color = dynamic(4);
  const uv = dynamic(4);
  const ground = dynamic(1);
  geometry.setAttribute("aCenter", center);
  geometry.setAttribute("aSizeSpinStretch", sizeSpinStretch);
  geometry.setAttribute("aColor", color);
  geometry.setAttribute("aUv", uv);
  geometry.setAttribute("aGround", ground);
  const material = new ShaderMaterial({
    uniforms: { map: { value: null } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending,
  });
  const mesh = new InstancedMesh(geometry, material, PARTICLE_POOL);
  mesh.count = 0;
  // The instances are not in the instance matrices, so the bounds do not apply.
  mesh.frustumCulled = false;
  // After the Units, so that the depth of their figures is in the buffer.
  mesh.renderOrder = 4;
  return { mesh, center, sizeSpinStretch, color, uv, ground };
};

const colors = new Map<string, Color>();

const colorOf = (hex: string): Color => {
  const hit = colors.get(hex);
  if (hit) {
    return hit;
  }
  const color = new Color(hex);
  colors.set(hex, color);
  return color;
};

/** Writes the particles of one blend mode to its mesh. */
const writeBatch = (
  batch: Batch,
  particles: readonly Particle[],
  blend: FxSlot["blend"]
) => {
  let count = 0;
  for (const particle of particles) {
    if (particle.blend !== blend || count >= PARTICLE_POOL) {
      continue;
    }
    const color = colorOf(particle.color);
    const uv = fxSlotUv(particle.slot);
    batch.center.setXYZ(count, particle.x, particle.y, particle.z);
    batch.sizeSpinStretch.setXYZ(
      count,
      particle.size,
      particle.rotation,
      particle.stretch
    );
    batch.color.setXYZW(count, color.r, color.g, color.b, particle.opacity);
    batch.uv.setXYZW(count, uv.u, uv.v, uv.width, uv.height);
    batch.ground.setX(count, particle.ground ? 1 : 0);
    count += 1;
  }
  batch.mesh.count = count;
  for (const attribute of [
    batch.center,
    batch.sizeSpinStretch,
    batch.color,
    batch.uv,
    batch.ground,
  ]) {
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, count * attribute.itemSize);
    attribute.needsUpdate = true;
  }
};

/** A fixed seed for a burst, from its start and its place. */
const burstSeed = (start: number, x: number, z: number): number =>
  Math.round(start * 997 + x * 31 + z * 17);

/**
 * The emitters now: the loops of each Unit on the Board, and the bursts of
 * the effects list. With reduced motion, the loops show no particles.
 */
const emittersNow = (reducedMotion: boolean): Emitter[] => {
  const emitters: Emitter[] = [];
  const units = reducedMotion ? [] : (playback.session?.view.units ?? []);
  for (const unit of units) {
    const anchor = unitAnchors.get(unit.id);
    if (!anchor) {
      continue;
    }
    for (const [index, status] of loopStatuses(unit).entries()) {
      emitters.push({
        kind: "loop",
        preset: status,
        x: anchor.position.x,
        y: anchor.position.y,
        z: anchor.position.z,
        seed: unit.id * 8 + index,
      });
    }
  }
  // The effects layer removes a burst from the list when it ends.
  for (const fx of fxList) {
    if (fx.kind === "particles") {
      emitters.push({
        kind: "burst",
        preset: fx.burst,
        x: fx.x,
        y: fx.height,
        z: fx.z,
        start: fx.start,
        duration: fx.duration,
        scale: fx.scale,
        mirror: fx.mirror,
        seed: burstSeed(fx.start, fx.x, fx.z),
      });
    }
  }
  return emitters;
};

/**
 * The quads that are not from an emitter: the billboards of the effects
 * list, the projectile of a ranged attack, and the spell bolt of a cast.
 */
const singlesNow = (reducedMotion: boolean): Particle[] => {
  const { session } = playback;
  const singles = [
    ...projectileParticles(session?.current, playback.progress, reducedMotion),
    ...(session
      ? spellBoltParticles(
          currentCast(session.log, session.current !== null),
          session.view.lanes,
          playback.progress,
          reducedMotion
        )
      : []),
  ];
  for (const fx of fxList) {
    const quad =
      fx.kind === "billboard"
        ? billboardParticle(fx, playback.time, reducedMotion)
        : null;
    if (quad) {
      singles.push(quad);
    }
  }
  return singles;
};

/**
 * The Status loops on the Units, the Status, hit, dust, heal and Armor
 * bursts, the cast wind-ups, the melee slashes, the ranged projectiles and the
 * spell bolts, from one particle pool with the effects atlas (web ADR-0009).
 * All motion uses `playback.time`.
 */
export const ParticleLayer = () => {
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const additive = useMemo(() => makeBatch(AdditiveBlending), []);
  const alpha = useMemo(() => makeBatch(NormalBlending), []);

  useEffect(
    () => () => {
      for (const batch of [additive, alpha]) {
        batch.mesh.geometry.dispose();
        batch.mesh.material.dispose();
        batch.mesh.dispose();
      }
    },
    [additive, alpha]
  );

  useFrame(() => {
    const { texture } = fxAtlas();
    for (const batch of [additive, alpha]) {
      const { uniforms } = batch.mesh.material;
      if (uniforms.map && uniforms.map.value !== texture) {
        uniforms.map.value = texture;
      }
    }
    const singles = singlesNow(reducedMotion);
    const particles = [
      ...singles,
      ...spawnParticles(
        emittersNow(reducedMotion),
        playback.time,
        Math.max(PARTICLE_POOL - singles.length, 0),
        reducedMotion
      ),
    ];
    writeBatch(additive, particles, "additive");
    writeBatch(alpha, particles, "alpha");
  });

  return (
    <group name="atlas-effects">
      <primitive object={alpha.mesh} />
      <primitive object={additive.mesh} />
    </group>
  );
};
