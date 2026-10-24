import type { ActivatedKeyword, BattleEvent } from "@workspace/rules";

import type { UnitSourceView, UnitView } from "@/features/battle/battle-view";
import { sourceId } from "@/features/battle/card-art";
import type { Fx } from "@/features/battle/scene/fx";
import type { KeywordPlate } from "@/features/battle/scene/keyword-plates";
import type { UnitClipName } from "@/features/battle/scene/unit-clips";

/** A rigged 3D model for the Units of one card: its Unit Model. */
export interface UnitModelSpec {
  /** The path of the packed GLB under `public/`. */
  readonly url: string;
  /** The height of the figure on the Board, in scene units. */
  readonly height: number;
}

/**
 * The cards that have a Unit Model (art direction 2.2). A card that is not
 * here shows its Cut-out Figure (art direction 2.1).
 */
const UNIT_MODELS = new Map<string, UnitModelSpec>([
  [
    "elf.wardenSaelith",
    { url: "/models/units/warden-saelith.glb", height: 1.05 },
  ],
  [
    "human.serAldricStonewall",
    { url: "/models/units/ser-aldric-stonewall.glb", height: 1.05 },
  ],
  // The burning staff stands above his head, and the height includes it.
  [
    "orc.ashcallerGrosh",
    { url: "/models/units/ashcaller-grosh.glb", height: 1.25 },
  ],
  // A goblin is small.
  [
    "goblin.grixRatwhistle",
    { url: "/models/units/grix-ratwhistle.glb", height: 0.85 },
  ],
  // A long beast: lower, so that it stays on its Square.
  [
    "feral.gorehornRedMaw",
    { url: "/models/units/gorehorn-red-maw.glb", height: 0.85 },
  ],
  [
    "undead.paleCantorYsolde",
    { url: "/models/units/pale-cantor-ysolde.glb", height: 1.05 },
  ],
  [
    "human.ironBulwark",
    { url: "/models/units/iron-bulwark.glb", height: 1.05 },
  ],
  // The banner stands above his head, and the height includes it.
  [
    "human.marshalElianVoss",
    { url: "/models/units/marshal-elian-voss.glb", height: 1.38 },
  ],
  // A big orc: a little taller than a Human.
  [
    "orc.warchiefGrukka",
    { url: "/models/units/warchief-grukka.glb", height: 1.12 },
  ],
  // The war standard stands above his head, and the height includes it.
  [
    "orc.warbandStandardBearer",
    { url: "/models/units/warband-standard-bearer.glb", height: 1.4 },
  ],
  // A long war cart: lower, so that it stays on its Square.
  [
    "goblin.grandGearjammer",
    { url: "/models/units/grand-gearjammer.glb", height: 1 },
  ],
  // The burning torch stands above his crown, and the height includes it.
  ["goblin.bossSnikkit", { url: "/models/units/boss-snikkit.glb", height: 1 }],
  // A stone giant: the pine trees on its back are in the height.
  [
    "feral.mountainColossus",
    { url: "/models/units/mountain-colossus.glb", height: 1.3 },
  ],
  // A long beast: lower, so that it stays on its Square.
  [
    "feral.oldFrostmaw",
    { url: "/models/units/old-frostmaw.glb", height: 0.85 },
  ],
  [
    "elf.canopyVinewarden",
    { url: "/models/units/canopy-vinewarden.glb", height: 1.05 },
  ],
  // The orb of the staff is above his head, and the height includes it.
  [
    "elf.lethielFirstGardener",
    { url: "/models/units/lethiel-first-gardener.glb", height: 1.26 },
  ],
  [
    "undead.sirOdoLastTaxman",
    { url: "/models/units/sir-odo-last-taxman.glb", height: 1.05 },
  ],
  // A Wall: the banner stands above the shields, and the height includes it.
  [
    "undead.boneRampart",
    { url: "/models/units/bone-rampart.glb", height: 1.2 },
  ],
  [
    "human.kingsCourier",
    { url: "/models/units/kings-courier.glb", height: 1.05 },
  ],
  // He kneels behind his pavise at rest, so he looks lower than a Human who stands.
  [
    "human.paviseArbalist",
    { url: "/models/units/pavise-arbalist.glb", height: 1.05 },
  ],
  // A Wall: a large shrine, a little taller than a Human.
  [
    "human.dawnReliquary",
    { url: "/models/units/dawn-reliquary.glb", height: 1.1 },
  ],
  // The sun disc of the staff is above her head, and the height includes it.
  ["human.dawnCleric", { url: "/models/units/dawn-cleric.glb", height: 1.25 }],
  // A knight on a horse: the horse with the lance is about as long as Gorehorn Red Maw.
  [
    "human.riverKnight",
    { url: "/models/units/river-knight.glb", height: 1.15 },
  ],
  // A tall woman: a little taller than a Human.
  ["human.gateWarden", { url: "/models/units/gate-warden.glb", height: 1.08 }],
  [
    "human.bridgePikeman",
    { url: "/models/units/bridge-pikeman.glb", height: 1.05 },
  ],
  // The banner-staff stands above his head, and the height includes it.
  [
    "human.bannerChaplain",
    { url: "/models/units/banner-chaplain.glb", height: 1.46 },
  ],
  // The pitchfork stands above his pot helmet, and the height includes it.
  [
    "human.militiaRecruit",
    { url: "/models/units/militia-recruit.glb", height: 1.22 },
  ],
  [
    "human.shieldbearer",
    { url: "/models/units/shieldbearer.glb", height: 1.05 },
  ],
  [
    "human.crossbowGuard",
    { url: "/models/units/crossbow-guard.glb", height: 1.05 },
  ],
  // The halberd stands above his head, and the height includes it.
  ["human.halberdier", { url: "/models/units/halberdier.glb", height: 1.26 }],
  // A Wall: a heap of beams and sandbags, a little lower than a Human. The pot on the top beam is in the height.
  [
    "human.townBarricade",
    { url: "/models/units/town-barricade.glb", height: 0.9 },
  ],
  [
    "orc.ashspitHunter",
    { url: "/models/units/ashspit-hunter.glb", height: 1.05 },
  ],
  // A tall orc woman: a little taller than a Human.
  [
    "orc.mesaPitFighter",
    { url: "/models/units/mesa-pit-fighter.glb", height: 1.1 },
  ],
  // The flames of the axe go above her crest, and the height includes them.
  [
    "orc.pyreaxeRavager",
    { url: "/models/units/pyreaxe-ravager.glb", height: 1.22 },
  ],
  // A small flier: its vines reach the ground, and the wings go above its body.
  [
    "elf.amberwingDart",
    { url: "/models/units/amberwing-dart.glb", height: 0.85 },
  ],
  [
    "elf.elderreedDartmaster",
    { url: "/models/units/elderreed-dartmaster.glb", height: 1.05 },
  ],
  // The seed sail is above his head, and the height includes it.
  [
    "elf.seedwindShepherd",
    { url: "/models/units/seedwind-shepherd.glb", height: 1.4 },
  ],
  // A goblin: the stack of kegs on his back is above his head, and the height includes it.
  ["goblin.mineSapper", { url: "/models/units/mine-sapper.glb", height: 1.15 }],
  // A goblin is small.
  [
    "goblin.spyglassSniper",
    { url: "/models/units/spyglass-sniper.glb", height: 0.85 },
  ],
  // A walking machine with its driver on top: a little taller than a Human.
  ["goblin.junkWalker", { url: "/models/units/junk-walker.glb", height: 1.12 }],
  // A big yeti: taller than a Human.
  [
    "feral.avalancheYeti",
    { url: "/models/units/avalanche-yeti.glb", height: 1.15 },
  ],
  // A long beast: lower, so that it stays on its Square. The nest on its head is in the height.
  [
    "feral.woollyMammoth",
    { url: "/models/units/woolly-mammoth.glb", height: 1 },
  ],
  // A flier: its column of mist reaches the ground, and the height includes it.
  [
    "feral.rimebreathDrake",
    { url: "/models/units/rimebreath-drake.glb", height: 1.05 },
  ],
  // He kneels behind his coffin at rest, so he looks lower than a Human who stands.
  [
    "undead.coffinLancer",
    { url: "/models/units/coffin-lancer.glb", height: 1.05 },
  ],
  // A long hound with a pup behind it: lower, so that the pack stays on its Square.
  ["undead.winterMaw", { url: "/models/units/winter-maw.glb", height: 0.8 }],
  // The tall veil stands above her skull, and the height includes it.
  [
    "undead.lanternWidow",
    { url: "/models/units/lantern-widow.glb", height: 1.1 },
  ],
  // A big orc: the banner on his back stands above his head, and the height includes it.
  [
    "orc.howlingCharger",
    { url: "/models/units/howling-charger.glb", height: 1.52 },
  ],
  // A flier: the glider is above her head, and the height includes it.
  ["orc.skyreaver", { url: "/models/units/skyreaver.glb", height: 1.26 }],
  ["orc.packStalker", { url: "/models/units/pack-stalker.glb", height: 1.05 }],
  [
    "orc.cinderhornBreaker",
    { url: "/models/units/cinderhorn-breaker.glb", height: 1.05 },
  ],
  [
    "orc.warhowlerDrummer",
    { url: "/models/units/warhowler-drummer.glb", height: 1.05 },
  ],
  // A small orc boy: the big helmet and its spikes are in the height.
  ["orc.badlandRunt", { url: "/models/units/badland-runt.glb", height: 0.85 }],
  ["orc.scrapRaider", { url: "/models/units/scrap-raider.glb", height: 1.05 }],
  // A big orc woman: the fire of the ladle is above her head, and the height includes it.
  ["orc.emberShaman", { url: "/models/units/ember-shaman.glb", height: 1.2 }],
  // A very big orc woman: a little lower than Warchief Grukka.
  ["orc.tuskBrute", { url: "/models/units/tusk-brute.glb", height: 1.1 }],
  // A Wall: the horned totem stands above the stakes, and the height includes it.
  [
    "orc.bonestakePalisade",
    { url: "/models/units/bonestake-palisade.glb", height: 1.15 },
  ],
  // A goblin is small.
  [
    "goblin.sidestepShiv",
    { url: "/models/units/sidestep-shiv.glb", height: 0.85 },
  ],
  // A Wall: a heap of junk with a goblin on top. The sitting goblin has the size of the other goblins.
  [
    "goblin.junkBarricade",
    { url: "/models/units/junk-barricade.glb", height: 0.95 },
  ],
  ["goblin.bombLobber", { url: "/models/units/bomb-lobber.glb", height: 0.85 }],
  [
    "goblin.greaseTrapper",
    { url: "/models/units/grease-trapper.glb", height: 0.85 },
  ],
  // She sits on her barrel, so she is lower than a goblin who stands.
  [
    "goblin.rocketBarrelRider",
    { url: "/models/units/rocket-barrel-rider.glb", height: 0.76 },
  ],
  // A goblin is small.
  [
    "goblin.ankleSnatcher",
    { url: "/models/units/ankle-snatcher.glb", height: 0.85 },
  ],
  ["goblin.fuseRunner", { url: "/models/units/fuse-runner.glb", height: 0.85 }],
  [
    "goblin.junkSlinger",
    { url: "/models/units/junk-slinger.glb", height: 0.85 },
  ],
  // A goblin: the big helmet and the hourglass in his raised hand are in the height.
  [
    "goblin.tunnelSaboteur",
    { url: "/models/units/tunnel-saboteur.glb", height: 0.88 },
  ],
  // A goblin: the stove pipe on her helmet and its smoke are above her head, and the height includes them.
  [
    "goblin.scrapPlateGuard",
    { url: "/models/units/scrap-plate-guard.glb", height: 1.07 },
  ],
  // A Wall: a long tortoise, with a goat and pine trees on its shell. Lower, so that it stays on its Square.
  [
    "feral.boulderTortoise",
    { url: "/models/units/boulder-tortoise.glb", height: 0.88 },
  ],
  // A long, low lizard: its club tail curls up above its back, and the height includes it.
  [
    "feral.tailsweepBasilisk",
    { url: "/models/units/tailsweep-basilisk.glb", height: 0.68 },
  ],
  // A big troll, bent over: a little taller than a Human.
  ["feral.caveTroll", { url: "/models/units/cave-troll.glb", height: 1.08 }],
  // A long beast: lower, so that it stays on its Square. The horn is in the height.
  ["feral.cragRhino", { url: "/models/units/crag-rhino.glb", height: 0.75 }],
  // A tall elk: the ice antlers are above her head, and the height includes them.
  [
    "feral.frostElkMatriarch",
    { url: "/models/units/frost-elk-matriarch.glb", height: 1.4 },
  ],
  // A long beast: lower, so that it stays on its Square. The bristle ridge is in the height.
  [
    "feral.bristlebackBoar",
    { url: "/models/units/bristleback-boar.glb", height: 0.72 },
  ],
  // A long, low, wide lizard: the bird on its back is in the height.
  ["feral.cragLizard", { url: "/models/units/crag-lizard.glb", height: 0.5 }],
  // A long cat: lower, so that it stays on its Square. The ear tufts are in the height.
  [
    "feral.frostfangLynx",
    { url: "/models/units/frostfang-lynx.glb", height: 0.7 },
  ],
  // A huge bear on all fours: the hump is in the height.
  ["feral.caveBear", { url: "/models/units/cave-bear.glb", height: 0.85 }],
  // A wide spider: lower, so that its legs stay on its Square. The helmet on its back is in the height.
  ["feral.webSpitter", { url: "/models/units/web-spitter.glb", height: 0.6 }],
  [
    "elf.gladeTurnblade",
    { url: "/models/units/glade-turnblade.glb", height: 1.05 },
  ],
  // A flier: the leaf wings rise above her head, and the height includes them.
  [
    "elf.canopySkirmisher",
    { url: "/models/units/canopy-skirmisher.glb", height: 1.29 },
  ],
  [
    "elf.thornlineArcher",
    { url: "/models/units/thornline-archer.glb", height: 1.05 },
  ],
  // The curled top of the reed staff is above her head, and the height includes it.
  ["elf.dewkeeper", { url: "/models/units/dewkeeper.glb", height: 1.16 }],
  // A Wall: the arch of bramble is about as tall as a Human.
  ["elf.brambleNest", { url: "/models/units/bramble-nest.glb", height: 1.05 }],
  // The branch spear stands above his head, and the height includes it.
  [
    "elf.rootboundGuard",
    { url: "/models/units/rootbound-guard.glb", height: 1.2 },
  ],
  [
    "elf.brambleDuelist",
    { url: "/models/units/bramble-duelist.glb", height: 1.05 },
  ],
  // A small flier: the fern wings rise above her head, and the height includes them.
  [
    "elf.fernwingCourier",
    { url: "/models/units/fernwing-courier.glb", height: 1.18 },
  ],
  // A squat plant spirit: the bird on its leaf lid is in the height.
  [
    "elf.mosspitcherLookout",
    { url: "/models/units/mosspitcher-lookout.glb", height: 0.9 },
  ],
  // The raised acorn is above her head, and the height includes it.
  ["elf.acornTender", { url: "/models/units/acorn-tender.glb", height: 1.16 }],
  // A tall skeleton: a little taller than a Human.
  [
    "undead.backwatchBailiff",
    { url: "/models/units/backwatch-bailiff.glb", height: 1.08 },
  ],
  // Three skeletons in a line with a long sword: each is a little smaller than a Human.
  [
    "undead.chatteringCohort",
    { url: "/models/units/chattering-cohort.glb", height: 0.8 },
  ],
  // A small rider on a pony: lower than River Knight.
  [
    "undead.paleGalloper",
    { url: "/models/units/pale-galloper.glb", height: 1 },
  ],
  [
    "undead.rimeEyeReaper",
    { url: "/models/units/rime-eye-reaper.glb", height: 1.05 },
  ],
  // The fan of pipes is above his head, and the height includes it.
  [
    "undead.ossuaryPiper",
    { url: "/models/units/ossuary-piper.glb", height: 1.18 },
  ],
  // A big, broad skeleton (Heavy): a little taller than a Human.
  [
    "undead.graveyardDrudge",
    { url: "/models/units/graveyard-drudge.glb", height: 1.1 },
  ],
  // A wiry skeleton in a low lunge: the raised knife is above his head, and the height includes it.
  [
    "undead.rattleknife",
    { url: "/models/units/rattleknife.glb", height: 0.95 },
  ],
  // A skeleton that crouches low on a long coffin lid: lower than Pale Galloper.
  [
    "undead.coffinLidSkater",
    { url: "/models/units/coffin-lid-skater.glb", height: 0.88 },
  ],
  // The point of the hood and the bones in the quiver are above his skull, and the height includes them.
  ["undead.hushbow", { url: "/models/units/hushbow.glb", height: 1.08 }],
  // The bell in his raised right hand is above his head, and the height includes it.
  [
    "undead.graveBellTender",
    { url: "/models/units/grave-bell-tender.glb", height: 1.25 },
  ],
]);

/** The Unit Model of a card, or `undefined` if the card has only a Cut-out Figure. */
export const unitModelOf = (cardId: string): UnitModelSpec | undefined =>
  UNIT_MODELS.get(cardId);

/** The height of a Cut-out Figure. A Unit Model has its own height. */
const CUT_OUT_HEIGHT = 1.03;

/** The Status Badge sits this far above the head of the figure. */
const BADGE_GAP = 0.3;

/**
 * The height of the middle of the Status Badge of a Unit, above the head of
 * its figure. A Keyword Plate sits above it.
 */
export const badgeHeight = (source: UnitSourceView): number =>
  (unitModelOf(sourceId(source))?.height ?? CUT_OUT_HEIGHT) + BADGE_GAP;

/** The cards that have a Unit Model, for the Component Catalog. */
export const unitModelCards = (): readonly string[] => [...UNIT_MODELS.keys()];

/** All Unit Models, to load them before the first Unit is summoned. */
export const allUnitModels = (): readonly UnitModelSpec[] => [
  ...UNIT_MODELS.values(),
];

/** The clip that a Unit plays in one frame. */
export interface UnitClip {
  readonly name: UnitClipName;
  /** The play position, 0 to 1 of the clip. */
  readonly phase: number;
}

/** Low HP: HP at 1/3 of the Max HP or less (web glossary). */
export const isLowHp = (unit: Pick<UnitView, "hp" | "maxHp">): boolean =>
  unit.hp > 0 && unit.hp * 3 <= unit.maxHp;

/**
 * The Keywords that a Unit uses by its own action, so its Unit Model plays the
 * cast clip. The other Keywords occur in an attack, a hit or a death, which
 * have their own clips.
 */
const CAST_KEYWORDS: ReadonlySet<ActivatedKeyword> = new Set<ActivatedKeyword>([
  "heal",
  "spawnbane",
  "rally",
  "regenerate",
  "summon",
  "bolt",
  "dispel",
]);

const isCastPlate = (fx: Fx): fx is KeywordPlate =>
  fx.kind === "plate" && CAST_KEYWORDS.has(fx.keyword);

/**
 * The play position of the cast clip of a Unit at `time`, or `null` when it
 * does not cast. A Keyword has no time in the Battle (`KeywordActivated` is
 * 0 ms), so the cast keeps time with the Keyword Plate of the Keyword.
 */
export const castPhase = (
  unitId: number,
  fxs: readonly Fx[],
  time: number
): number | null => {
  let phase: number | null = null;
  for (const fx of fxs) {
    if (!isCastPlate(fx) || fx.unitId !== unitId) {
      continue;
    }
    const at = (time - fx.start) / fx.duration;
    if (at >= 0 && at < 1) {
      // The newest plate wins.
      phase = at;
    }
  }
  return phase;
};

/** Walk cycles for each Square that a Unit moves. */
const STEPS_PER_SQUARE = 1;

const fraction = (value: number): number => value - Math.floor(value);

/** A walk of more Squares plays more steps. */
const walkClip = (
  unit: UnitView,
  event: Extract<BattleEvent, { readonly _tag: "UnitMoved" }>,
  progress: number
): UnitClip | null => {
  if (event.unitId !== unit.id) {
    return null;
  }
  const squares = Math.max(1, Math.abs(event.to - event.from));
  const steps = progress * squares * STEPS_PER_SQUARE;
  return { name: "walk", phase: Number.isFinite(steps) ? fraction(steps) : 0 };
};

const ownClip = (
  name: UnitClipName,
  own: boolean,
  progress: number
): UnitClip | null => (own ? { name, phase: progress } : null);

/** The event clip of a Unit, or `null` if the event does not change its clip. */
const eventClip = (
  unit: UnitView,
  event: BattleEvent,
  progress: number
): UnitClip | null => {
  switch (event._tag) {
    case "UnitMoved": {
      return walkClip(unit, event, progress);
    }
    case "UnitAttacked": {
      return ownClip("attack", event.unitId === unit.id, progress);
    }
    case "DamageDealt": {
      return ownClip(
        "hurt",
        event.target._tag === "Unit" && event.target.unitId === unit.id,
        progress
      );
    }
    case "UnitDied": {
      return ownClip("death", event.unitId === unit.id, progress);
    }
    case "UnitReborn": {
      // The rebirth clip has the fall and the rise, as the event has.
      return ownClip("rebirth", event.unitId === unit.id, progress);
    }
    case "UnitSummoned": {
      return ownClip("summon", event.unit.id === unit.id, progress);
    }
    default: {
      return null;
    }
  }
};

/** What the clip of a Unit in one frame comes from. */
export interface ClipInput {
  readonly event: BattleEvent | null;
  /** The progress of the current event, 0 to 1. */
  readonly progress: number;
  /** Scene seconds, for the idle loop. */
  readonly time: number;
  /** The length of each loop clip, in seconds. */
  readonly loops: Readonly<Record<"idle" | "lowHp", number>>;
  /** The play position of a cast now (`castPhase`), or `null`. */
  readonly cast: number | null;
  /** With reduced motion, a loop clip stops on its first frame. */
  readonly reducedMotion: boolean;
}

/**
 * The clip of a Unit in one frame. An event clip follows the event progress,
 * so it keeps time with the Battle speed and with a QA pause. With no event
 * clip, the Unit plays its cast, or else it idles: the Low HP idle when it has
 * Low HP.
 */
export const unitClipFor = (unit: UnitView, input: ClipInput): UnitClip => {
  const clip = input.event
    ? eventClip(unit, input.event, input.progress)
    : null;
  if (clip) {
    return clip;
  }
  if (input.cast !== null) {
    return { name: "cast", phase: input.cast };
  }
  const name = isLowHp(unit) ? "lowHp" : "idle";
  if (input.reducedMotion) {
    return { name, phase: 0 };
  }
  // Each Unit starts its loop at a different time, so they do not breathe together.
  return {
    name,
    phase: fraction((input.time + unit.id * 0.37) / input.loops[name]),
  };
};

/** The clip that a Unit Model shows: a clip that it has. */
export interface ShownClip extends UnitClip {
  /**
   * True when the model shows its idle clip in place of an event clip that
   * it does not have. Then the figure also takes the tilt of the Cut-out
   * Figure (art direction 2.1), for example to fall in a death.
   */
  readonly cutOutPose: boolean;
}

/**
 * The clip of `clip` that a model with the clips `has` can play. Each model
 * has the base clips (`BASE_UNIT_CLIPS`). A model without Low HP or cast
 * idles. A model without rebirth plays its death and then the same clip
 * back, so that the Unit gets up again.
 */
export const fallbackClip = (
  clip: UnitClip,
  has: (name: UnitClipName) => boolean
): ShownClip => {
  if (has(clip.name)) {
    return { ...clip, cutOutPose: false };
  }
  switch (clip.name) {
    case "lowHp": {
      return { name: "idle", phase: clip.phase, cutOutPose: false };
    }
    case "cast":
    case "summon": {
      return { name: "idle", phase: 0, cutOutPose: false };
    }
    case "rebirth": {
      if (has("death")) {
        return {
          name: "death",
          phase: 1 - Math.abs(1 - clip.phase * 2),
          cutOutPose: false,
        };
      }
      return { name: "idle", phase: 0, cutOutPose: true };
    }
    default: {
      return { name: "idle", phase: 0, cutOutPose: true };
    }
  }
};
