import type { DamageType } from "../content/schema";
import { rollBasisPoints } from "../random";
import { activateBossRules } from "./boss-rules";
import type { StepContext } from "./context";
import {
  activeHeroes,
  activateKeyword,
  activateKeywordFor,
  direction,
  findUnit,
  heroState,
  isInsideLane,
  isOver,
  ownerOf,
  unitAt,
  unitDealer,
} from "./context";
import { healedAmount, healUnit } from "./heal";
import type {
  BattleResult,
  DamageDealer,
  DamageSource,
  HeroRef,
  Side,
  TargetRef,
  UnitState,
} from "./types";
import { BattleEvent, otherSide } from "./types";

export interface Hit {
  readonly amount: number;
  readonly damageType: DamageType;
  readonly source: DamageSource;
  /** The Unit or the Hero that deals the hit. `null` for status damage. */
  readonly dealer: DamageDealer | null;
  /** Crit chance of the attacking side, in basis points. 0 for no Crit roll. */
  readonly crit: number;
  /**
   * True Damage (GDD 4.7): no Bulwark, Exposed, Crit, Block or Ward. The hit
   * keeps its Damage Type and its Status. Steadfast still holds.
   */
  readonly trueDamage?: boolean;
  /** A Unit that the hit kills does not come back with Rebirth (*Smite*). */
  readonly noRebirth?: boolean;
  /** The hit applies no Status, also with Fire, Frost or Lightning damage (Bolt). */
  readonly noStatus?: boolean;
}

/** Burn, Poison and Sudden Death are status damage: no Bulwark, no Crit, no Block, no new status. */
const isStatusDamage = (source: DamageSource): boolean =>
  source === "burn" || source === "poison" || source === "suddenDeath";

export const finishBattle = (ctx: StepContext, result: BattleResult): void => {
  ctx.state.status = "finished";
  ctx.state.result = result;
  ctx.events.push(BattleEvent.BattleEnded({ result }));
};

/**
 * Vampirism (ADR-0048): the Unit heals the HP that its Physical hit dealt.
 * Every Physical hit counts, also Retaliate and Trample. The heal stops at
 * its maximum HP.
 */
const vampirism = (ctx: StepContext, hit: Hit, amount: number): void => {
  if (
    hit.damageType !== "physical" ||
    isStatusDamage(hit.source) ||
    hit.dealer?._tag !== "Unit"
  ) {
    return;
  }
  const dealer = findUnit(ctx.state, hit.dealer.unitId);
  if (!dealer || !dealer.vampirism || healedAmount(dealer, amount) <= 0) {
    return;
  }
  activateKeyword(ctx, dealer, "vampirism");
  healUnit(ctx, dealer, amount);
};

/**
 * Soul Harvest (ADR-0048): each Unit of the other Side gets +1 Attack and +1
 * HP when an enemy Unit is killed. A kill by any source counts. A Rebirth is
 * not a kill, and a Unit that a Defeated Hero removes is not a kill.
 */
const soulHarvest = (ctx: StepContext, dead: UnitState): void => {
  const side = otherSide(dead.owner);
  for (const unit of ctx.state.units) {
    if (unit.owner !== side || !unit.soulHarvest) {
      continue;
    }
    unit.soulHarvestBonus += 1;
    unit.maxHp += 1;
    unit.hp += 1;
    activateKeyword(ctx, unit, "soulHarvest");
    ctx.events.push(
      BattleEvent.SoulHarvestGained({
        unitId: unit.id,
        soulHarvest: unit.soulHarvestBonus,
        hp: unit.hp,
      })
    );
  }
};

/**
 * The Unit leaves the Board. The Card of a Card Unit goes to the owner's
 * Graveyard. A Token has no Card: it just disappears (GDD 4.9).
 */
const killUnit = (ctx: StepContext, unit: UnitState): void => {
  const { state } = ctx;
  state.units = state.units.filter((candidate) => candidate.id !== unit.id);
  if (unit.source._tag === "Card") {
    heroState(state, ownerOf(unit)).graveyard.push(unit.source.card);
  }
  ctx.events.push(BattleEvent.UnitDied({ unitId: unit.id }));
  soulHarvest(ctx, unit);
  if (unit.lastBreath <= 0 || isOver(ctx)) {
    return;
  }
  const dir = direction(unit.owner);
  for (
    let position = unit.position + dir;
    isInsideLane(position);
    position += dir
  ) {
    const other = unitAt(state, unit.lane, position);
    if (other && other.owner !== unit.owner) {
      activateKeyword(ctx, unit, "lastBreath", unit.lastBreath);
      // oxlint-disable-next-line eslint/no-use-before-define -- Last Breath deals damage, and that damage can kill
      damageUnit(ctx, other, {
        amount: unit.lastBreath,
        damageType: unit.damageType,
        source: "lastBreath",
        dealer: unitDealer(unit),
        crit: 0,
      });
      return;
    }
  }
};

/**
 * Rebirth (GDD 4.9): the Unit does not leave the Board. It keeps its ID, its
 * Square and its source, and it comes back with 1 HP, without Rebirth and
 * without Statuses. It is not a summon, and its Last Breath does not occur.
 * When the Battle is over, its Hero is Defeated, and Rebirth does not occur
 * (GDD 4.10, ADR-0009).
 */
const rebirth = (ctx: StepContext, unit: UnitState): boolean => {
  if (!unit.rebirth || isOver(ctx)) {
    return false;
  }
  unit.rebirth = false;
  unit.hp = 1;
  unit.burn = 0;
  unit.poisoned = 0;
  unit.frozen = false;
  unit.paralyzed = false;
  unit.entangled = false;
  unit.hobbled = 0;
  unit.bleeding = 0;
  unit.grounded = 0;
  unit.exposed = 0;
  unit.exposedTurns = 0;
  unit.ward = 0;
  unit.rallied = 0;
  unit.heroicBonus = 0;
  // The Soul Harvest bonus raised both the current and the maximum HP, so
  // Rebirth takes the maximum HP back too (ADR-0048).
  unit.maxHp -= unit.soulHarvestBonus;
  unit.soulHarvestBonus = 0;
  unit.bonusBulwark = 0;
  unit.bonusBulwarkTurns = 0;
  unit.bonusAttack = 0;
  unit.bonusAttackTurns = 0;
  unit.bonusRange = 0;
  unit.bonusRangeTurns = 0;
  activateKeyword(ctx, unit, "rebirth");
  ctx.events.push(BattleEvent.UnitReborn({ unitId: unit.id, hp: unit.hp }));
  return true;
};

const applyStatus = (
  ctx: StepContext,
  unit: UnitState,
  damageType: DamageType
): void => {
  if (damageType === "fire") {
    unit.burn = 2;
    ctx.events.push(
      BattleEvent.StatusApplied({ unitId: unit.id, status: "burn" })
    );
  } else if (damageType === "frost") {
    unit.frozen = true;
    ctx.events.push(
      BattleEvent.StatusApplied({ unitId: unit.id, status: "freeze" })
    );
  } else if (damageType === "lightning" && !unit.paralyzed) {
    // A new Paralyzed on a Paralyzed Unit has no effect and no event, the
    // same as Entangle on an Entangled Unit.
    unit.paralyzed = true;
    ctx.events.push(
      BattleEvent.StatusApplied({ unitId: unit.id, status: "paralyze" })
    );
  }
};

/** Applies the Status of a hit, except for status damage and a hit with `noStatus` (Bolt). */
const applyHitStatus = (
  ctx: StepContext,
  unit: UnitState,
  hit: Hit,
  status: boolean
): void => {
  if (status || hit.noStatus === true) {
    return;
  }
  applyStatus(ctx, unit, hit.damageType);
};

/**
 * Iron Guard (ADR-0048): a Physical hit deals at most 3 damage. It comes after
 * Bulwark, Crit, Block and Exposed, and before Ward.
 */
const ironGuardCap = (
  ctx: StepContext,
  unit: UnitState,
  physical: boolean,
  amount: number
): number => {
  if (!physical || !unit.ironGuard || amount <= 3) {
    return amount;
  }
  activateKeyword(ctx, unit, "ironGuard");
  return 3;
};

interface HitResult {
  /** The damage that the Unit took. */
  readonly dealt: number;
  /**
   * The hit took the Unit to 0 HP. It left the Board, or it came back with
   * Rebirth. Either way, it did not survive the hit. A Unit that Steadfast
   * held at 1 HP survived it.
   */
  readonly killed: boolean;
}

/**
 * The rules of a hit that the Damage calculation uses: which steps of GDD 4.7
 * apply, and the 2 new Keywords of ADR-0054.
 */
interface HitRules {
  /** The hit is status damage or True Damage: no Bulwark, Exposed, Crit or Block. */
  readonly fixed: boolean;
  /** The hit is True Damage: no Ward, no Bulwark, no Exposed, no Crit and no Block. */
  readonly trueDamage: boolean;
  /** The hit is Physical, so Bulwark and Exposed apply. */
  readonly physical: boolean;
  /** The damage cannot be reduced: Piercing (ADR-0054). */
  readonly piercing: boolean;
  /** The value of the hit is doubled against a Unit with Wall: Wallbreaker. */
  readonly wallbreaker: boolean;
}

/** The damage of a hit before the Ward (GDD 4.7, steps 1 to 7). */
interface HitAmount {
  /** The damage of the hit. */
  readonly amount: number;
  /** True when the hit rolled a Crit. */
  readonly crit: boolean;
  /** True when the hit rolled a Block. */
  readonly blocked: boolean;
}

/** The damage of a hit after the Ward (GDD 4.7, step 8). */
interface WardAmount {
  /** The damage that the Unit takes. */
  readonly amount: number;
  /** The damage that the Ward absorbed. */
  readonly absorbed: number;
}

/**
 * The damage of a hit before the Ward (GDD 4.7, steps 1 to 7): the value, minus
 * Bulwark for a Physical hit and Resistance for the other Damage Types, plus
 * Exposed for a Physical hit, then Crit ×2 and Block ÷2 rounded up (not for
 * Holy), then the Iron Guard cap. The minimum damage is 0.
 */
const hitAmount = (
  ctx: StepContext,
  unit: UnitState,
  hit: Hit,
  rules: HitRules
): HitAmount => {
  const value = rules.wallbreaker ? hit.amount * 2 : hit.amount;
  // Bulwark (step 3) reduces only Physical damage (ADR-0030).
  const bulwark =
    rules.physical && !rules.piercing ? unit.bulwark + unit.bonusBulwark : 0;
  // Resistance (ADR-0054) reduces the other Damage Types, like Bulwark does
  // for Physical damage.
  const resistance =
    !rules.fixed && !rules.physical && !rules.piercing ? unit.resistance : 0;
  // Exposed (step 4): after Bulwark, so it also hurts a Unit with high Bulwark.
  // Poison damage is Physical, but it is status damage: no Exposed.
  const exposed = rules.physical ? unit.exposed : 0;
  let amount = Math.max(0, value - bulwark - resistance) + exposed;
  const crit = !rules.fixed && rollBasisPoints(ctx.random, hit.crit);
  if (crit) {
    amount *= 2;
  }
  const blockChance = heroState(ctx.state, ownerOf(unit)).unitBlock;
  // Holy damage cannot be Blocked (ADR-0030).
  const blocked =
    !rules.fixed &&
    !rules.piercing &&
    hit.damageType !== "holy" &&
    rollBasisPoints(ctx.random, blockChance);
  if (blocked) {
    amount = Math.ceil(amount / 2);
  }
  // Iron Guard (ADR-0048): a Physical hit deals at most 3 damage.
  return {
    amount: rules.piercing
      ? amount
      : ironGuardCap(ctx, unit, rules.physical, amount),
    crit,
    blocked,
  };
};

/**
 * The Ward of the target (GDD 4.7, step 8): it absorbs the damage, up to its
 * value. The damage that it absorbs is not dealt. True Damage and Piercing
 * ignore the Ward.
 */
const applyWard = (
  unit: UnitState,
  amount: number,
  rules: HitRules
): WardAmount => {
  if (rules.trueDamage || rules.piercing) {
    return { amount, absorbed: 0 };
  }
  const absorbed = Math.min(unit.ward, amount);
  unit.ward -= absorbed;
  return { amount: amount - absorbed, absorbed };
};

/**
 * Sends the Keyword events of a hit: Wallbreaker and Piercing (ADR-0054). Each
 * event comes before the event of its result.
 */
const activateHitKeywords = (
  ctx: StepContext,
  dealer: DamageDealer | null,
  rules: HitRules
): void => {
  if (dealer?._tag !== "Unit") {
    return;
  }
  if (rules.wallbreaker) {
    activateKeywordFor(ctx, dealer.unitId, dealer.hero, "wallbreaker");
  }
  if (rules.piercing) {
    activateKeywordFor(ctx, dealer.unitId, dealer.hero, "piercing");
  }
};

/**
 * The rules that the steps of one hit use (GDD 4.7, ADR-0054). Status damage
 * and True Damage get no Bulwark, Exposed, Crit or Block. Piercing skips every
 * step that reduces the damage. Wallbreaker doubles a hit against a Unit with
 * Wall, before the steps that reduce it.
 */
const hitRulesOf = (unit: UnitState, hit: Hit): HitRules => {
  const status = isStatusDamage(hit.source);
  const trueDamage = hit.trueDamage === true;
  const fixed = status || trueDamage;
  const dealer = hit.dealer?._tag === "Unit" ? hit.dealer : undefined;
  return {
    fixed,
    trueDamage,
    physical: !fixed && hit.damageType === "physical",
    piercing: !fixed && dealer?.piercing === true,
    wallbreaker: dealer?.wallbreaker === true && unit.wall,
  };
};

/**
 * The Rebirth of a Unit that the hit killed, or its death. A `noRebirth` hit
 * stops Rebirth.
 */
const resolveDeath = (ctx: StepContext, unit: UnitState, hit: Hit): void => {
  const saved = hit.noRebirth !== true && rebirth(ctx, unit);
  if (!saved) {
    killUnit(ctx, unit);
  }
};

/**
 * Damage calculation (GDD 4.7): the value, minus Bulwark for a Physical hit, plus
 * Exposed for a Physical hit, Crit ×2, Block ÷2 rounded up (not for Holy),
 * minimum 0 (ADR-0030). Then a
 * Ward absorbs damage, also status damage. Absorbed damage is not dealt: `dealt` is the damage after
 * the Ward. True Damage skips all of these steps. Then Steadfast keeps the
 * Unit at 1 HP. A `noRebirth` hit that kills stops Rebirth. Fire gives Burn,
 * Frost gives Freeze and Lightning gives Paralyzed, also at 0 damage.
 *
 * The new Keywords of ADR-0054 change the steps: Wallbreaker doubles the value
 * of the hit against a Unit with Wall, Resistance reduces the damage of the
 * other Damage Types, and Piercing skips every step that reduces the damage.
 */
export const damageUnit = (
  ctx: StepContext,
  unit: UnitState,
  hit: Hit
): HitResult => {
  const status = isStatusDamage(hit.source);
  const rules = hitRulesOf(unit, hit);
  const { trueDamage } = rules;
  activateHitKeywords(ctx, hit.dealer, rules);
  const hit1 = hitAmount(ctx, unit, hit, rules);
  const ward = applyWard(unit, hit1.amount, rules);
  const { amount } = ward;
  unit.hp -= amount;
  // Steadfast (step 9): it comes before Rebirth, so a Unit with Rebirth keeps
  // its Rebirth.
  const held = unit.hp <= 0 && unit.steadfast;
  if (held) {
    unit.hp = 1;
    unit.steadfast = false;
  }
  const target: TargetRef = { _tag: "Unit", unitId: unit.id };
  ctx.events.push(
    BattleEvent.DamageDealt({
      target,
      amount,
      damageType: hit.damageType,
      source: hit.source,
      dealer: hit.dealer,
      crit: hit1.crit,
      blocked: hit1.blocked,
      trueDamage,
      absorbed: ward.absorbed,
      ward: unit.ward,
      hp: Math.max(0, unit.hp),
    })
  );
  if (held) {
    ctx.events.push(BattleEvent.SteadfastHeld({ unitId: unit.id }));
  }
  vampirism(ctx, hit, amount);
  if (unit.hp <= 0) {
    resolveDeath(ctx, unit, hit);
    return { dealt: amount, killed: true };
  }
  applyHitStatus(ctx, unit, hit, status);
  return { dealt: amount, killed: false };
};

/** The number of Lanes between two Fronts: 1 for Fronts next to each other. */
const frontDistance = (a: readonly number[], b: readonly number[]): number =>
  Math.min(...a.flatMap((lane) => b.map((other) => Math.abs(lane - other))));

/**
 * The Front of the Defeated Hero `ref` goes to the nearest Hero of its Side
 * that is not Defeated. For the same distance, the Hero with the lower Lane
 * number gets it (ADR-0009).
 */
const moveFront = (ctx: StepContext, ref: HeroRef): void => {
  const { state } = ctx;
  const fallen = heroState(state, ref);
  const lanes = fallen.front;
  let nearest: HeroRef | undefined;
  for (const candidate of activeHeroes(state, ref.side)) {
    if (!nearest) {
      nearest = candidate;
      continue;
    }
    const { front } = heroState(state, candidate);
    const best = heroState(state, nearest).front;
    const distance = frontDistance(lanes, front);
    const bestDistance = frontDistance(lanes, best);
    if (
      distance < bestDistance ||
      (distance === bestDistance && Math.min(...front) < Math.min(...best))
    ) {
      nearest = candidate;
    }
  }
  if (!nearest || lanes.length === 0) {
    return;
  }
  const receiver = heroState(state, nearest);
  receiver.front = [...receiver.front, ...lanes].toSorted((a, b) => a - b);
  fallen.front = [];
  ctx.events.push(BattleEvent.FrontMoved({ from: ref, to: nearest, lanes }));
};

/**
 * The Hero `ref` is Defeated (ADR-0009). The Battle ends when its Side has no
 * other Hero that is not Defeated.
 */
const defeatHero = (ctx: StepContext, ref: HeroRef): void => {
  const { state } = ctx;
  ctx.events.push(BattleEvent.HeroDefeated({ hero: ref }));
  if (activeHeroes(state, ref.side).length === 0) {
    finishBattle(ctx, { winner: otherSide(ref.side), reason: "heroDefeated" });
    return;
  }
  const owns = (owned: { readonly owner: Side; readonly hero: number }) =>
    owned.owner === ref.side && owned.hero === ref.hero;
  // Its Units leave with no death: no Graveyard, Last Breath or Rebirth.
  for (const unit of state.units.filter(owns)) {
    ctx.events.push(BattleEvent.UnitRemoved({ unitId: unit.id }));
  }
  state.units = state.units.filter((unit) => !owns(unit));
  for (const field of state.fieldEffects.filter(owns)) {
    ctx.events.push(BattleEvent.FieldEffectEnded({ fieldId: field.id }));
  }
  state.fieldEffects = state.fieldEffects.filter((field) => !owns(field));
  moveFront(ctx, ref);
};

/**
 * Heroes have no Bulwark and cannot Block (GDD 4.7). True Damage has no Crit.
 * The Hero is Defeated at 0 HP. Else its Boss Rules can activate (ADR-0038).
 */
export const damageHero = (ctx: StepContext, ref: HeroRef, hit: Hit): void => {
  if (isOver(ctx)) {
    return;
  }
  const hero = heroState(ctx.state, ref);
  const trueDamage = hit.trueDamage ?? false;
  const crit =
    !isStatusDamage(hit.source) &&
    !trueDamage &&
    rollBasisPoints(ctx.random, hit.crit);
  const amount = Math.max(0, crit ? hit.amount * 2 : hit.amount);
  hero.hp = Math.max(0, hero.hp - amount);
  ctx.events.push(
    BattleEvent.DamageDealt({
      target: { _tag: "Hero", side: ref.side, hero: ref.hero },
      amount,
      damageType: hit.damageType,
      source: hit.source,
      dealer: hit.dealer,
      crit,
      blocked: false,
      trueDamage,
      absorbed: 0,
      ward: 0,
      hp: hero.hp,
    })
  );
  vampirism(ctx, hit, amount);
  // A Hero target is also a valid `ref`: keep only the Side and the index.
  const owner = { side: ref.side, hero: ref.hero };
  if (hero.hp === 0) {
    // A Defeated Boss gets no Boss Rules (ADR-0038).
    defeatHero(ctx, owner);
    return;
  }
  activateBossRules(ctx, owner);
};
