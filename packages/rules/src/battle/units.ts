import { scaleForRank } from "../content/ranks";
import type { CreatureCardDefinition } from "../content/schema";
import type { CardInstance, Side, UnitState } from "./types";

/** Makes a Unit from a Creature Card copy. Attack and HP scale with the Rank (GDD 5.3). */
export const createUnit = (options: {
  readonly id: number;
  readonly owner: Side;
  readonly card: CardInstance;
  readonly definition: CreatureCardDefinition;
  readonly lane: number;
  readonly position: number;
  readonly turnNumber: number;
}): UnitState => {
  const { definition, card } = options;
  const hp = scaleForRank(definition.hp, card.rank);
  return {
    id: options.id,
    owner: options.owner,
    card,
    lane: options.lane,
    position: options.position,
    attack: scaleForRank(definition.attack, card.rank),
    hp,
    maxHp: hp,
    speed: definition.speed,
    range: definition.range,
    damageType: definition.damageType,
    armor: definition.keywords.armor ?? 0,
    charge: definition.keywords.charge ?? false,
    flying: definition.keywords.flying ?? false,
    heroic: definition.keywords.heroic ?? 0,
    pivot: definition.keywords.pivot ?? false,
    regeneration: definition.keywords.regeneration ?? 0,
    retaliation: definition.keywords.retaliation ?? false,
    summonedTurn: options.turnNumber,
    burn: 0,
    frozen: false,
    bonusArmor: 0,
    bonusArmorTurns: 0,
  };
};
