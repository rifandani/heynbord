import { keywordValue } from "../content/keywords";
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
    armor: keywordValue(definition.keywords.armor, card.rank),
    charge: definition.keywords.charge ?? false,
    flying: definition.keywords.flying ?? false,
    heroic: keywordValue(definition.keywords.heroic, card.rank),
    lastBreath: keywordValue(definition.keywords.lastBreath, card.rank),
    pivot: definition.keywords.pivot ?? false,
    poison: definition.keywords.poison ?? false,
    hobble: keywordValue(definition.keywords.hobble, card.rank),
    regeneration: keywordValue(definition.keywords.regeneration, card.rank),
    retaliation: definition.keywords.retaliation ?? false,
    summonedTurn: options.turnNumber,
    burn: 0,
    poisoned: 0,
    hobbled: 0,
    frozen: false,
    bonusArmor: 0,
    bonusArmorTurns: 0,
  };
};
