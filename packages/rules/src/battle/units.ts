import { keywordValue } from "../content/keywords";
import { scaleForRank } from "../content/ranks";
import type {
  CreatureCardDefinition,
  DamageType,
  RankId,
  TokenDefinition,
  TokenKeywords,
} from "../content/schema";
import type { CardInstance, Side, UnitSource, UnitState } from "./types";

/** The values of a Unit at its Rank, from a card or from a Token. */
interface UnitBody {
  readonly attack: number;
  readonly hp: number;
  readonly speed: number;
  readonly range: number;
  readonly damageType: DamageType;
  readonly keywords: TokenKeywords;
}

const makeUnit = (options: {
  readonly id: number;
  readonly owner: Side;
  readonly source: UnitSource;
  readonly rank: RankId;
  readonly body: UnitBody;
  readonly lane: number;
  readonly position: number;
  readonly turnNumber: number;
}): UnitState => {
  const { body, rank } = options;
  const { keywords } = body;
  return {
    id: options.id,
    owner: options.owner,
    source: options.source,
    lane: options.lane,
    position: options.position,
    attack: body.attack,
    hp: body.hp,
    maxHp: body.hp,
    speed: body.speed,
    range: body.range,
    damageType: body.damageType,
    armor: keywordValue(keywords.armor, rank),
    charge: keywordValue(keywords.charge, rank),
    entangle: keywords.entangle ?? false,
    firstStrike: keywords.firstStrike ?? false,
    flying: keywords.flying ?? false,
    heroic: keywordValue(keywords.heroic, rank),
    lastBreath: keywordValue(keywords.lastBreath, rank),
    pivot: keywords.pivot ?? false,
    poison: keywords.poison ?? false,
    hobble: keywordValue(keywords.hobble, rank),
    bleed: keywordValue(keywords.bleed, rank),
    knockback: keywordValue(keywords.knockback, rank),
    rally: keywordValue(keywords.rally, rank),
    rebirth: keywords.rebirth ?? false,
    regenerate: keywordValue(keywords.regenerate, rank),
    retaliate: keywords.retaliate ?? false,
    swarm: keywordValue(keywords.swarm, rank),
    trample: keywords.trample ?? false,
    wall: keywords.wall ?? false,
    summonedTurn: options.turnNumber,
    burn: 0,
    poisoned: 0,
    hobbled: 0,
    bleeding: 0,
    frozen: false,
    entangled: false,
    rallied: 0,
    bonusArmor: 0,
    bonusArmorTurns: 0,
  };
};

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
  return makeUnit({
    ...options,
    source: { _tag: "Card", card },
    rank: card.rank,
    body: {
      ...definition,
      attack: scaleForRank(definition.attack, card.rank),
      hp: scaleForRank(definition.hp, card.rank),
    },
  });
};

/**
 * Makes a Token Unit (GDD 4.9). Its Rank table gives Attack, HP and Speed:
 * they do not scale (Card Concepts 8).
 */
export const createToken = (options: {
  readonly id: number;
  readonly owner: Side;
  readonly token: TokenDefinition;
  readonly rank: RankId;
  readonly lane: number;
  readonly position: number;
  readonly turnNumber: number;
}): UnitState => {
  const { token, rank } = options;
  return makeUnit({
    ...options,
    source: { _tag: "Token", tokenId: token.id, rank },
    body: { ...token, ...token.ranks[rank] },
  });
};
