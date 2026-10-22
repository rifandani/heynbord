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
  return {
    name: "walk",
    phase: fraction(progress * squares * STEPS_PER_SQUARE),
  };
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
