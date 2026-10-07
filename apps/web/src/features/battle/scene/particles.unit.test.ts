import { describe, expect, it } from "vitest";

import type { BurstName, Emitter } from "@/features/battle/scene/particles";
import {
  billboardParticle,
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

const burst = (
  start: number,
  preset: BurstName = "freeze"
): Extract<Emitter, { readonly kind: "burst" }> => ({
  kind: "burst",
  preset,
  x: 2,
  y: 0.7,
  z: 1,
  start,
  duration: BURST_DURATION,
  scale: 1,
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

const hit = (preset: BurstName, scale = 1): Emitter => ({
  ...burst(1, preset),
  scale,
});

/** The sum of the particle sizes of a Fire hit. */
const fireSize = (scale: number) =>
  spawnParticles([hit("hit:fire", scale)], 1.2, 200)
    .map((particle) => particle.size)
    .reduce((total, value) => total + value, 0);

describe("hit bursts (web ADR-0009)", () => {
  it("makes a Crit hit larger", () => {
    expect(fireSize(1.4)).toBeCloseTo(fireSize(1) * 1.4);
  });

  it.each([
    ["hit:physical", "burst"],
    ["hit:fire", "flame"],
    ["hit:frost", "frost-shard"],
    ["hit:holy", "flare"],
    ["hit:blocked", "spark"],
  ] as const)(
    "shows %s as a fade of its main image with reduced motion",
    (preset, slot) => {
      const [first, ...rest] = spawnParticles([hit(preset)], 1.1, 200, true);
      expect(rest).toEqual([]);
      expect(first?.slot).toBe(slot);
    }
  );
});

const dust = (preset: "move" | "push", mirror = false): Emitter => ({
  ...burst(1, preset),
  mirror,
});

describe("dust bursts", () => {
  it("shows a push as more dust than a Movement", () => {
    expect(burstParticleCount("push")).toBeGreaterThan(
      burstParticleCount("move")
    );
    const [movePuff] = spawnParticles([dust("move")], 1.2, 200);
    const [pushPuff] = spawnParticles([dust("push")], 1.2, 200);
    expect(movePuff?.slot).toBe("dust");
    expect(pushPuff?.size).toBeGreaterThan(movePuff?.size ?? 0);
  });

  it("leaves a streak of dust behind a Pushed Unit, on the side it came from", () => {
    // The emitter is at x = 2. The Unit goes to the right, so the streak is to the left.
    const right = spawnParticles([dust("push")], 1.2, 200);
    const behind = right.filter((particle) => particle.x < 2 - 0.3);
    const ahead = right.filter((particle) => particle.x > 2 + 0.3);
    expect(behind.length).toBeGreaterThan(ahead.length + 2);
    // A Unit that goes to the left gets the same dust, mirrored.
    const left = spawnParticles([dust("push", true)], 1.2, 200);
    expect(left.map((particle) => particle.x - 2)).toEqual(
      right.map((particle) => expect.closeTo(2 - particle.x))
    );
  });

  it("shows no dust with reduced motion", () => {
    expect(
      spawnParticles([dust("move"), dust("push")], 1.2, 200, true)
    ).toEqual([]);
  });
});

describe("billboardParticle", () => {
  const slash = {
    slot: "slash",
    color: "#ff6a33",
    size: 1,
    mirror: false,
    x: 3,
    z: 1,
    height: 0.8,
    start: 2,
    duration: 0.5,
  } as const;

  it("shows the image only from its start until it ends", () => {
    expect(billboardParticle(slash, 1.9)).toBeNull();
    expect(billboardParticle(slash, 2.1)).toMatchObject({
      slot: "slash",
      color: "#ff6a33",
      x: 3,
    });
    expect(billboardParticle(slash, 2.5)).toBeNull();
  });

  it("sweeps the other way for an attacker that faces left", () => {
    const right = billboardParticle(slash, 2.2);
    const left = billboardParticle({ ...slash, mirror: true }, 2.2);
    expect(left?.rotation).toBeCloseTo(-(right?.rotation ?? 0));
    expect(left?.stretch).toBe(-1);
  });

  it("only fades in its place with reduced motion", () => {
    const early = billboardParticle(slash, 2.1, true);
    const late = billboardParticle(slash, 2.4, true);
    expect(late).toMatchObject({
      size: early?.size,
      rotation: early?.rotation,
    });
    expect(late?.opacity).toBeLessThan(early?.opacity ?? 0);
  });
});
