import { describe, expect, it } from "vitest";

import type { BurstName, Emitter } from "@/features/battle/scene/particles";
import {
  BURST_DURATION,
  burstParticleCount,
  loopParticleCount,
  spawnParticles,
} from "@/features/battle/scene/particles";
import type { Status } from "@/features/battle/scene/status-visuals";
import { STATUS_ORDER } from "@/features/battle/scene/status-visuals";

const loop = (seed: number, status: Status = "burn"): Emitter => ({
  kind: "loop",
  preset: status,
  x: seed,
  y: 0,
  z: 0,
  seed,
});

const burst = (start: number, preset: BurstName = "freeze"): Emitter => ({
  kind: "burst",
  preset,
  x: 2,
  y: 0.7,
  z: 1,
  start,
  seed: 9,
});

const slots = (status: Status) =>
  new Set(spawnParticles([loop(3, status)], 5, 200).map((p) => p.slot));

describe("spawnParticles", () => {
  it("gives the same particles for the same time", () => {
    const emitters = [loop(1), loop(2, "poison"), burst(0.9)];
    expect(spawnParticles(emitters, 1.2, 200)).toEqual(
      spawnParticles(emitters, 1.2, 200)
    );
    expect(spawnParticles(emitters, 1.2, 200)).not.toEqual(
      spawnParticles(emitters, 1.3, 200)
    );
  });

  it("gives each Status loop its particles, with the slot of the Status", () => {
    for (const status of STATUS_ORDER) {
      const particles = spawnParticles([loop(3, status)], 5, 200);
      expect(particles, status).toHaveLength(loopParticleCount(status));
      expect(particles.length, status).toBeGreaterThan(0);
    }
    expect(slots("burn")).toEqual(new Set(["ember"]));
    expect(slots("freeze")).toEqual(new Set(["frost-mote"]));
    expect(slots("poison")).toEqual(new Set(["bubble"]));
    expect(slots("entangle")).toEqual(new Set(["vine"]));
    expect(slots("hobble")).toEqual(new Set(["chain"]));
    expect(slots("bleed")).toEqual(new Set(["drip"]));
  });

  it("puts each particle in the mesh for the blend mode of its slot", () => {
    const particles = spawnParticles([loop(1), loop(2, "poison")], 5, 200);
    expect(particles.find((particle) => particle.slot === "ember")?.blend).toBe(
      "additive"
    );
    expect(
      particles.find((particle) => particle.slot === "bubble")?.blend
    ).toBe("alpha");
  });

  it("shows a burst only from its start until it ends", () => {
    expect(spawnParticles([burst(2)], 1.9, 200)).toEqual([]);
    expect(spawnParticles([burst(2)], 2.1, 200)).toHaveLength(
      burstParticleCount("freeze")
    );
    expect(spawnParticles([burst(2)], 2 + BURST_DURATION, 200)).toEqual([]);
  });

  it("drops loop particles before burst particles when the pool is full", () => {
    const bursts = [burst(1), burst(1, "burn-tick")];
    const burstCount =
      burstParticleCount("freeze") + burstParticleCount("burn-tick");
    const loops = Array.from({ length: 10 }, (_, index) => loop(index));
    const capacity = burstCount + 7;
    const particles = spawnParticles([...loops, ...bursts], 1.2, capacity);
    expect(particles.length).toBeLessThanOrEqual(capacity);
    const fromBursts = particles.filter((particle) => particle.burst);
    expect(fromBursts).toHaveLength(burstCount);
    expect(particles.length - fromBursts.length).toBeGreaterThan(0);
  });

  it("keeps all burst particles when they fill the pool alone", () => {
    const particles = spawnParticles([loop(1), burst(1)], 1.2, 2);
    expect(particles.every((particle) => particle.burst)).toBe(true);
    expect(particles).toHaveLength(burstParticleCount("freeze"));
  });
});

describe("spawnParticles with reduced motion", () => {
  it("shows no loop particles", () => {
    expect(spawnParticles([loop(1)], 5, 200, true)).toEqual([]);
  });

  it("shows a burst as one atlas image that fades and does not move", () => {
    const early = spawnParticles([burst(1)], 1.1, 200, true);
    const late = spawnParticles([burst(1)], 1.4, 200, true);
    expect(early).toHaveLength(1);
    expect(late).toHaveLength(1);
    const [first] = early;
    const [second] = late;
    expect(first?.x).toBeCloseTo(2, 0);
    expect(first?.y).toBeCloseTo(0.7, 0);
    expect(second).toMatchObject({
      x: first?.x,
      y: first?.y,
      z: first?.z,
      size: first?.size,
      rotation: first?.rotation,
    });
    expect(second?.opacity).toBeLessThan(first?.opacity ?? 0);
  });
});
