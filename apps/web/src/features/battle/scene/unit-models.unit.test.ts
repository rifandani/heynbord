import type { UnitSnapshot } from "@workspace/rules";
import { BattleEvent, getStarterDeck } from "@workspace/rules";
import { describe, expect, it } from "vitest";

import { startSession } from "@/features/battle/battle-session";
import type { UnitView } from "@/features/battle/battle-view";
import type { Fx } from "@/features/battle/scene/fx";
import type { KeywordPlate } from "@/features/battle/scene/keyword-plates";
import type { UnitClipName } from "@/features/battle/scene/unit-clips";
import type { ClipInput } from "@/features/battle/scene/unit-models";
import {
  castPhase,
  fallbackClip,
  isLowHp,
  unitClipFor,
  unitModelOf,
} from "@/features/battle/scene/unit-models";
import { NEW_PLAYER } from "@/features/profile/profile";

const unit: UnitView = {
  id: 7,
  owner: "player",
  hero: 0,
  source: { _tag: "Card", cardId: "human.militiaRecruit" },
  rank: "common",
  lane: 0,
  position: 2,
  attack: 2,
  rallyBonus: 0,
  swarm: 0,
  swarmBonus: 0,
  reborn: false,
  hp: 4,
  maxHp: 4,
  bulwark: 0,
  bonusBulwark: 0,
  bonusBulwarkTurns: 0,
  bonusAttack: 0,
  bonusAttackTurns: 0,
  bonusRange: 0,
  bonusRangeTurns: 0,
  heroicBonus: 0,
  exposed: 0,
  exposedTurns: 0,
  range: 0,
  flying: false,
  damageType: "physical",
  burn: 0,
  poisoned: 0,
  hobbled: 0,
  bleeding: 0,
  grounded: 0,
  frozen: false,
  paralyzed: false,
  entangled: false,
  ward: 0,
  steadfast: false,
  wall: false,
};

const hit = (unitId: number) =>
  BattleEvent.DamageDealt({
    target: { _tag: "Unit", unitId },
    amount: 1,
    damageType: "physical",
    source: "attack",
    dealer: null,
    crit: false,
    blocked: false,
    trueDamage: false,
    absorbed: 0,
    ward: 0,
    hp: 1,
  });

const { rules } = startSession({
  stageId: "1-10",
  deck: getStarterDeck("vanguard"),
  player: NEW_PLAYER,
  seed: 1,
});

/** A summoned Unit with the ID `id`. */
const snapshot = (id: number): UnitSnapshot => {
  const [first] = rules.units;
  if (!first) {
    throw new Error("Stage 1-10 starts with a Unit on the Board");
  }
  return { ...first, id };
};

const input = (changes: Partial<ClipInput> = {}): ClipInput => ({
  event: null,
  progress: 0,
  time: 0,
  loops: { idle: 2, lowHp: 4 },
  cast: null,
  reducedMotion: false,
  ...changes,
});

const clipOf = (
  event: BattleEvent | null,
  progress: number,
  target: UnitView = unit
) => unitClipFor(target, input({ event, progress, time: 9 }));

const idleAt = (time: number) => unitClipFor(unit, input({ time }));

const plate = (
  changes: Partial<KeywordPlate> & Pick<KeywordPlate, "keyword">
): Fx => ({
  kind: "plate",
  unitId: unit.id,
  label: { key: "keywords.heal" },
  side: "player",
  follow: true,
  x: 0,
  z: 0,
  height: 1,
  start: 10,
  duration: 1,
  ...changes,
});

const move = (to: number) =>
  BattleEvent.UnitMoved({ unitId: unit.id, lane: 0, from: 2, to });

const all = () => true;

/** A model with only the base clips. */
const base = (name: UnitClipName) =>
  ["idle", "walk", "attack", "hurt", "death"].includes(name);

/** Each card with a Unit Model, and the path of its model. */
const MODEL_URLS: readonly (readonly [string, string])[] = [
  ["elf.wardenSaelith", "/models/units/warden-saelith.glb"],
  ["human.serAldricStonewall", "/models/units/ser-aldric-stonewall.glb"],
  ["orc.ashcallerGrosh", "/models/units/ashcaller-grosh.glb"],
  ["goblin.grixRatwhistle", "/models/units/grix-ratwhistle.glb"],
  ["feral.gorehornRedMaw", "/models/units/gorehorn-red-maw.glb"],
  ["undead.paleCantorYsolde", "/models/units/pale-cantor-ysolde.glb"],
  ["human.ironBulwark", "/models/units/iron-bulwark.glb"],
  ["human.marshalElianVoss", "/models/units/marshal-elian-voss.glb"],
  ["orc.warchiefGrukka", "/models/units/warchief-grukka.glb"],
  ["orc.warbandStandardBearer", "/models/units/warband-standard-bearer.glb"],
  ["goblin.grandGearjammer", "/models/units/grand-gearjammer.glb"],
  ["goblin.bossSnikkit", "/models/units/boss-snikkit.glb"],
  ["feral.mountainColossus", "/models/units/mountain-colossus.glb"],
  ["feral.oldFrostmaw", "/models/units/old-frostmaw.glb"],
  ["elf.canopyVinewarden", "/models/units/canopy-vinewarden.glb"],
  ["elf.lethielFirstGardener", "/models/units/lethiel-first-gardener.glb"],
  ["undead.sirOdoLastTaxman", "/models/units/sir-odo-last-taxman.glb"],
  ["undead.boneRampart", "/models/units/bone-rampart.glb"],
  ["human.kingsCourier", "/models/units/kings-courier.glb"],
  ["human.paviseArbalist", "/models/units/pavise-arbalist.glb"],
  ["human.dawnReliquary", "/models/units/dawn-reliquary.glb"],
  ["human.dawnCleric", "/models/units/dawn-cleric.glb"],
  ["human.riverKnight", "/models/units/river-knight.glb"],
  ["human.gateWarden", "/models/units/gate-warden.glb"],
  ["human.bridgePikeman", "/models/units/bridge-pikeman.glb"],
  ["human.bannerChaplain", "/models/units/banner-chaplain.glb"],
  ["human.militiaRecruit", "/models/units/militia-recruit.glb"],
  ["human.shieldbearer", "/models/units/shieldbearer.glb"],
  ["human.crossbowGuard", "/models/units/crossbow-guard.glb"],
  ["human.halberdier", "/models/units/halberdier.glb"],
  ["human.townBarricade", "/models/units/town-barricade.glb"],
  ["orc.ashspitHunter", "/models/units/ashspit-hunter.glb"],
  ["orc.mesaPitFighter", "/models/units/mesa-pit-fighter.glb"],
  ["orc.pyreaxeRavager", "/models/units/pyreaxe-ravager.glb"],
  ["elf.amberwingDart", "/models/units/amberwing-dart.glb"],
  ["elf.elderreedDartmaster", "/models/units/elderreed-dartmaster.glb"],
  ["elf.seedwindShepherd", "/models/units/seedwind-shepherd.glb"],
  ["goblin.mineSapper", "/models/units/mine-sapper.glb"],
  ["goblin.spyglassSniper", "/models/units/spyglass-sniper.glb"],
  ["goblin.junkWalker", "/models/units/junk-walker.glb"],
  ["feral.avalancheYeti", "/models/units/avalanche-yeti.glb"],
  ["feral.woollyMammoth", "/models/units/woolly-mammoth.glb"],
  ["feral.rimebreathDrake", "/models/units/rimebreath-drake.glb"],
  ["undead.coffinLancer", "/models/units/coffin-lancer.glb"],
  ["undead.winterMaw", "/models/units/winter-maw.glb"],
  ["undead.lanternWidow", "/models/units/lantern-widow.glb"],
  ["orc.howlingCharger", "/models/units/howling-charger.glb"],
  ["orc.skyreaver", "/models/units/skyreaver.glb"],
  ["orc.packStalker", "/models/units/pack-stalker.glb"],
  ["orc.cinderhornBreaker", "/models/units/cinderhorn-breaker.glb"],
  ["orc.warhowlerDrummer", "/models/units/warhowler-drummer.glb"],
  ["orc.badlandRunt", "/models/units/badland-runt.glb"],
  ["orc.scrapRaider", "/models/units/scrap-raider.glb"],
  ["orc.emberShaman", "/models/units/ember-shaman.glb"],
  ["orc.tuskBrute", "/models/units/tusk-brute.glb"],
  ["orc.bonestakePalisade", "/models/units/bonestake-palisade.glb"],
  ["goblin.sidestepShiv", "/models/units/sidestep-shiv.glb"],
  ["goblin.junkBarricade", "/models/units/junk-barricade.glb"],
  ["goblin.bombLobber", "/models/units/bomb-lobber.glb"],
  ["goblin.greaseTrapper", "/models/units/grease-trapper.glb"],
  ["goblin.rocketBarrelRider", "/models/units/rocket-barrel-rider.glb"],
  ["goblin.ankleSnatcher", "/models/units/ankle-snatcher.glb"],
  ["goblin.fuseRunner", "/models/units/fuse-runner.glb"],
  ["goblin.junkSlinger", "/models/units/junk-slinger.glb"],
  ["goblin.tunnelSaboteur", "/models/units/tunnel-saboteur.glb"],
  ["goblin.scrapPlateGuard", "/models/units/scrap-plate-guard.glb"],
  ["feral.boulderTortoise", "/models/units/boulder-tortoise.glb"],
  ["feral.tailsweepBasilisk", "/models/units/tailsweep-basilisk.glb"],
  ["feral.caveTroll", "/models/units/cave-troll.glb"],
  ["feral.cragRhino", "/models/units/crag-rhino.glb"],
  ["feral.frostElkMatriarch", "/models/units/frost-elk-matriarch.glb"],
  ["feral.bristlebackBoar", "/models/units/bristleback-boar.glb"],
  ["feral.cragLizard", "/models/units/crag-lizard.glb"],
  ["feral.frostfangLynx", "/models/units/frostfang-lynx.glb"],
  ["feral.caveBear", "/models/units/cave-bear.glb"],
  ["feral.webSpitter", "/models/units/web-spitter.glb"],
  ["elf.gladeTurnblade", "/models/units/glade-turnblade.glb"],
  ["elf.canopySkirmisher", "/models/units/canopy-skirmisher.glb"],
  ["elf.thornlineArcher", "/models/units/thornline-archer.glb"],
  ["elf.dewkeeper", "/models/units/dewkeeper.glb"],
  ["elf.brambleNest", "/models/units/bramble-nest.glb"],
  ["elf.rootboundGuard", "/models/units/rootbound-guard.glb"],
  ["elf.brambleDuelist", "/models/units/bramble-duelist.glb"],
  ["elf.fernwingCourier", "/models/units/fernwing-courier.glb"],
  ["elf.mosspitcherLookout", "/models/units/mosspitcher-lookout.glb"],
  ["elf.acornTender", "/models/units/acorn-tender.glb"],
  ["undead.backwatchBailiff", "/models/units/backwatch-bailiff.glb"],
  ["undead.chatteringCohort", "/models/units/chattering-cohort.glb"],
  ["undead.paleGalloper", "/models/units/pale-galloper.glb"],
  ["undead.rimeEyeReaper", "/models/units/rime-eye-reaper.glb"],
  ["undead.ossuaryPiper", "/models/units/ossuary-piper.glb"],
  ["undead.graveyardDrudge", "/models/units/graveyard-drudge.glb"],
  ["undead.rattleknife", "/models/units/rattleknife.glb"],
  ["undead.coffinLidSkater", "/models/units/coffin-lid-skater.glb"],
  ["undead.hushbow", "/models/units/hushbow.glb"],
  ["undead.graveBellTender", "/models/units/grave-bell-tender.glb"],
];

describe("unitModelOf", () => {
  it("gives each card with a Unit Model its model, and other cards none", () => {
    for (const [card, url] of MODEL_URLS) {
      expect(unitModelOf(card)?.url).toBe(url);
    }
    expect(unitModelOf("mage.fireball")).toBeUndefined();
  });
});

describe("isLowHp", () => {
  it("is true at 1/3 of the Max HP or less, and false at 0 HP", () => {
    expect(isLowHp({ hp: 1, maxHp: 4 })).toBe(true);
    expect(isLowHp({ hp: 2, maxHp: 4 })).toBe(false);
    expect(isLowHp({ hp: 2, maxHp: 6 })).toBe(true);
    expect(isLowHp({ hp: 3, maxHp: 6 })).toBe(false);
    expect(isLowHp({ hp: 0, maxHp: 4 })).toBe(false);
  });
});

describe("unitClipFor", () => {
  it("loops the idle clip on the scene clock, offset by the Unit ID", () => {
    expect(idleAt(0)).toEqual({ name: "idle", phase: ((7 * 0.37) % 2) / 2 });
    expect(idleAt(1).phase).toBeCloseTo(((1 + 7 * 0.37) % 2) / 2);
    expect(idleAt(2).phase).toBeCloseTo(idleAt(0).phase);
  });

  it("loops the Low HP clip on its own length when the Unit has Low HP", () => {
    const low = { ...unit, hp: 1 };
    expect(unitClipFor(low, input({ time: 1 }))).toEqual({
      name: "lowHp",
      phase: ((1 + 7 * 0.37) % 4) / 4,
    });
  });

  it("stops a loop clip on its first frame with reduced motion", () => {
    expect(unitClipFor(unit, input({ time: 1, reducedMotion: true }))).toEqual({
      name: "idle",
      phase: 0,
    });
    const attack = BattleEvent.UnitAttacked({
      unitId: unit.id,
      ranged: true,
      target: { _tag: "Hero", side: "enemy", hero: 0 },
    });
    expect(
      unitClipFor(
        unit,
        input({ event: attack, progress: 0.4, reducedMotion: true })
      )
    ).toEqual({ name: "attack", phase: 0.4 });
  });

  it("plays the event clip on the event progress", () => {
    const attack = BattleEvent.UnitAttacked({
      unitId: unit.id,
      ranged: false,
      target: { _tag: "Hero", side: "enemy", hero: 0 },
    });
    expect(clipOf(attack, 0.4)).toEqual({ name: "attack", phase: 0.4 });
    expect(clipOf(hit(unit.id), 0.25)).toEqual({ name: "hurt", phase: 0.25 });
    expect(clipOf(BattleEvent.UnitDied({ unitId: unit.id }), 1)).toEqual({
      name: "death",
      phase: 1,
    });
    expect(
      clipOf(BattleEvent.UnitReborn({ unitId: unit.id, hp: 4 }), 0.3)
    ).toEqual({ name: "rebirth", phase: 0.3 });
    expect(
      clipOf(BattleEvent.UnitSummoned({ unit: snapshot(unit.id) }), 0.5)
    ).toEqual({ name: "summon", phase: 0.5 });
  });

  it("plays an event clip before a cast, and a cast before the idle", () => {
    expect(unitClipFor(unit, input({ cast: 0.3 }))).toEqual({
      name: "cast",
      phase: 0.3,
    });
    expect(
      unitClipFor(
        unit,
        input({ event: hit(unit.id), progress: 0.5, cast: 0.3 })
      )
    ).toEqual({ name: "hurt", phase: 0.5 });
  });

  it("plays one walk cycle for each Square", () => {
    expect(clipOf(move(3), 0.5)).toEqual({ name: "walk", phase: 0.5 });
    expect(clipOf(move(4), 0.75).phase).toBeCloseTo(0.5);
  });

  it("keeps the idle clip when a Unit is Pushed", () => {
    const push = BattleEvent.UnitPushed({
      unitId: unit.id,
      lane: 0,
      from: 4,
      to: 2,
    });
    expect(unitClipFor(unit, input({ event: push, progress: 0.5 }))).toEqual(
      idleAt(0)
    );
  });

  it("idles in an event about another Unit or a Hero", () => {
    const idle = unitClipFor(unit, input({ time: 3 }));
    for (const event of [
      BattleEvent.UnitMoved({ unitId: 99, lane: 0, from: 1, to: 2 }),
      BattleEvent.UnitAttacked({
        unitId: 99,
        ranged: true,
        target: { _tag: "Unit", unitId: unit.id },
      }),
      hit(99),
      BattleEvent.DamageDealt({
        target: { _tag: "Hero", side: "enemy", hero: 0 },
        amount: 1,
        damageType: "fire",
        source: "attack",
        dealer: null,
        crit: false,
        blocked: false,
        trueDamage: false,
        absorbed: 0,
        ward: 0,
        hp: 1,
      }),
      BattleEvent.UnitDied({ unitId: 99 }),
      BattleEvent.UnitReborn({ unitId: 99, hp: 1 }),
      BattleEvent.UnitSummoned({ unit: snapshot(99) }),
      BattleEvent.TurnEnded({ side: "player" }),
    ]) {
      expect(
        unitClipFor(unit, input({ event, progress: 0.5, time: 3 }))
      ).toEqual(idle);
    }
  });
});

describe("castPhase", () => {
  it("follows the Keyword Plate of a Keyword that the Unit uses itself", () => {
    const fxs = [plate({ keyword: "heal" })];
    expect(castPhase(unit.id, fxs, 9.9)).toBeNull();
    expect(castPhase(unit.id, fxs, 10.25)).toBeCloseTo(0.25);
    expect(castPhase(unit.id, fxs, 11)).toBeNull();
    expect(castPhase(99, fxs, 10.25)).toBeNull();
    expect(
      castPhase(unit.id, [plate({ keyword: "spawnbane" })], 10.5)
    ).toBeCloseTo(0.5);
  });

  it("does not cast for a Keyword of an attack, a hit or a death", () => {
    for (const keyword of ["rebirth", "lastBreath", "poison"] as const) {
      expect(castPhase(unit.id, [plate({ keyword })], 10.5)).toBeNull();
    }
  });

  it("follows the newest plate", () => {
    const fxs = [
      plate({ keyword: "heal" }),
      plate({ keyword: "spawnbane", start: 10.5 }),
    ];
    expect(castPhase(unit.id, fxs, 10.75)).toBeCloseTo(0.25);
  });
});

describe("fallbackClip", () => {
  it("plays a clip that the model has", () => {
    expect(fallbackClip({ name: "lowHp", phase: 0.4 }, all)).toEqual({
      name: "lowHp",
      phase: 0.4,
      cutOutPose: false,
    });
  });

  it("idles in place of Low HP, a cast and a summon", () => {
    expect(fallbackClip({ name: "lowHp", phase: 0.4 }, base)).toEqual({
      name: "idle",
      phase: 0.4,
      cutOutPose: false,
    });
    for (const name of ["cast", "summon"] as const) {
      expect(fallbackClip({ name, phase: 0.4 }, base)).toEqual({
        name: "idle",
        phase: 0,
        cutOutPose: false,
      });
    }
  });

  it("plays the death and then the same clip back in place of a rebirth", () => {
    expect(fallbackClip({ name: "rebirth", phase: 0.25 }, base)).toEqual({
      name: "death",
      phase: 0.5,
      cutOutPose: false,
    });
    expect(fallbackClip({ name: "rebirth", phase: 0.75 }, base).phase).toBe(
      0.5
    );
  });

  it("idles with the cut-out pose in place of a base clip that is missing", () => {
    expect(fallbackClip({ name: "death", phase: 0.5 }, () => false)).toEqual({
      name: "idle",
      phase: 0,
      cutOutPose: true,
    });
  });
});
