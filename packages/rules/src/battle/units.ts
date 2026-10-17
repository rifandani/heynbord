import { keywordRange, keywordSpeed, keywordValue } from "../content/keywords";
import { scaleForRank } from "../content/ranks";
import type {
  CreatureCardDefinition,
  DamageType,
  RankId,
  TokenDefinition,
  TokenKeywords,
} from "../content/schema";
import type { StepContext } from "./context";
import type { CardInstance, HeroRef, UnitSource, UnitState } from "./types";
import { BattleEvent } from "./types";

/** The values of a Unit at its Rank, from a card or from a Token. */
interface UnitBody {
  readonly attack: number;
  readonly hp: number;
  readonly damageType: DamageType;
  readonly keywords: TokenKeywords;
}

const makeUnit = (options: {
  readonly id: number;
  readonly owner: HeroRef;
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
    owner: options.owner.side,
    hero: options.owner.hero,
    source: options.source,
    lane: options.lane,
    position: options.position,
    attack: body.attack,
    hp: body.hp,
    maxHp: body.hp,
    speed: keywordSpeed(keywords),
    range: keywordRange(keywords),
    damageType: body.damageType,
    bulwark: keywordValue(keywords.bulwark, rank),
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
    bolt: keywordValue(keywords.bolt, rank),
    ironGuard: keywords.ironGuard ?? false,
    soulHarvest: keywords.soulHarvest ?? false,
    soulHarvestBonus: 0,
    herosBane: keywords.herosBane ?? false,
    spawnbane: keywordValue(keywords.spawnbane, rank),
    vampirism: keywords.vampirism ?? false,
    summonedTurn: options.turnNumber,
    burn: 0,
    poisoned: 0,
    hobbled: 0,
    bleeding: 0,
    grounded: 0,
    exposed: 0,
    exposedTurns: 0,
    frozen: false,
    paralyzed: false,
    entangled: false,
    ward: 0,
    steadfast: false,
    rallied: 0,
    heroicBonus: 0,
    bonusBulwark: 0,
    bonusBulwarkTurns: 0,
    bonusAttack: 0,
    bonusAttackTurns: 0,
    bonusRange: 0,
    bonusRangeTurns: 0,
  };
};

/** Makes a Unit of the Hero `owner` from a Creature Card copy. Attack and HP scale with the Rank (GDD 5.3). */
export const createUnit = (options: {
  readonly id: number;
  readonly owner: HeroRef;
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
 * Makes a Token Unit (GDD 4.9). Its Rank table gives Attack and HP:
 * they do not scale (Card Concepts 8).
 */
export const createToken = (options: {
  readonly id: number;
  readonly owner: HeroRef;
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

/**
 * Puts a Unit on the Board. Only `playCard` applies the effects of a Unit that
 * comes from its Creature Card, such as Sabotage and Summon: a Start Unit and
 * the Unit of a Boss Rule do not.
 */
export const summon = (
  ctx: StepContext,
  owner: HeroRef,
  card: CardInstance,
  definition: CreatureCardDefinition,
  lane: number,
  position: number
): UnitState => {
  const { state } = ctx;
  const unit = createUnit({
    id: state.nextId,
    owner,
    card,
    definition,
    lane,
    position,
    turnNumber: state.turnNumber,
  });
  state.nextId += 1;
  state.units.push(unit);
  ctx.events.push(BattleEvent.UnitSummoned({ unit: { ...unit } }));
  return unit;
};
