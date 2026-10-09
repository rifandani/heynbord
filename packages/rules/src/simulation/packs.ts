/**
 * Pack simulation (Economy 3.1, ADR-0027): the real rate of each Rank, how
 * often the Pack Guarantee gives a card, the value for each Coin and the
 * number of Packs to Discover all cards of each Base Rank. The seeds count up
 * from 1, so the same content always gives the same report.
 */
import { getPack } from "../content/packs";
import type { PackId } from "../content/packs";
import { isRankAtLeast, RANKS } from "../content/ranks";
import type { ClassId, DeckEntry, RaceId, RankId } from "../content/schema";
import { openPack, openTenPacks, packPool } from "../packs/open-pack";
import type { OpenPackInput } from "../packs/open-pack";

/** The value of a copy of each Rank on the Combine scale (ADR-0027). */
const COMBINE_VALUE: Readonly<Record<RankId, number>> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 16,
};

export interface PackSimulationOptions {
  /** The number of single Packs for the rates and the value. */
  readonly packs: number;
  /** The number of Players that open Packs until they Discover all cards. */
  readonly players: number;
  /** The Race of a Race Pack, or `null` for the Pack with all cards. */
  readonly race: RaceId | null;
  readonly classId: ClassId;
}

export interface PackReport {
  readonly packId: PackId;
  readonly race: RaceId | null;
  /** The share of the cards in each Rank, from 0 to 1. */
  readonly rankRates: Readonly<Record<RankId, number>>;
  /** The share of the single Packs whose Pack Guarantee gave a card, from 0 to 1. */
  readonly guaranteeRate: number;
  /** The mean Combine value of a single Pack. */
  readonly valuePerPack: number;
  /** The mean Combine value for each 100 Coin of single Packs. */
  readonly valuePer100Coin: number;
  /** The mean Combine value for each 100 Coin of Open ×10. */
  readonly tenPackValuePer100Coin: number;
  /**
   * The mean number of single Packs to Discover all cards of each Base Rank,
   * from no Discovered card. `null` when the Pack cannot give all of them, or
   * when no card has that Base Rank.
   */
  readonly packsToDiscover: Readonly<Record<RankId, number | null>>;
}

/** A Player that opens more Packs than this has a bug in the Pack rules. */
const MAX_PACKS_TO_DISCOVER = 100_000;

const valueOf = (cards: readonly DeckEntry[]): number =>
  cards.reduce((total, card) => total + COMBINE_VALUE[card.rank], 0);

const ranksRecord = <A>(value: (rank: RankId) => A): Record<RankId, A> => ({
  common: value("common"),
  uncommon: value("uncommon"),
  rare: value("rare"),
  epic: value("epic"),
  legendary: value("legendary"),
});

/** The IDs of the pool cards of each Base Rank. */
const poolByBaseRank = (
  race: RaceId | null,
  classId: ClassId
): Record<RankId, readonly string[]> => {
  const pool = packPool(race, classId);
  return ranksRecord((rank) =>
    pool.flatMap((card) => (card.baseRank === rank ? [card.id] : []))
  );
};

/** The input of the first Pack of a Player with no Discovered card. */
const firstInput = (
  packId: PackId,
  options: PackSimulationOptions,
  discovered: ReadonlySet<string> = new Set()
): OpenPackInput => ({
  pack: packId,
  race: options.race,
  classId: options.classId,
  discovered,
  guaranteeCounter: 0,
  randomState: 1,
});

const singlePacks = (packId: PackId, options: PackSimulationOptions) => {
  const counts = ranksRecord(() => 0);
  const start = firstInput(packId, options);
  let { guaranteeCounter, randomState } = start;
  let guarantees = 0;
  let value = 0;
  for (let index = 0; index < options.packs; index += 1) {
    const output = openPack({ ...start, guaranteeCounter, randomState });
    for (const card of output.opened.cards) {
      counts[card.rank] += 1;
    }
    guarantees += output.opened.guaranteedBy === "packGuarantee" ? 1 : 0;
    value += valueOf(output.opened.cards);
    ({ guaranteeCounter, randomState } = output);
  }
  const cards = RANKS.reduce((total, rank) => total + counts[rank], 0);
  return {
    rankRates: ranksRecord((rank) => counts[rank] / cards),
    guaranteeRate: guarantees / options.packs,
    valuePerPack: value / options.packs,
  };
};

/** The mean Combine value of one Open ×10, the bonus included. */
const tenPacksValue = (
  packId: PackId,
  options: PackSimulationOptions
): number => {
  const batches = Math.max(1, Math.floor(options.packs / 10));
  const start = firstInput(packId, options);
  let { guaranteeCounter, randomState } = start;
  let value = 0;
  for (let index = 0; index < batches; index += 1) {
    const output = openTenPacks({ ...start, guaranteeCounter, randomState });
    value += output.packs.reduce(
      (total, opened) => total + valueOf(opened.cards),
      0
    );
    ({ guaranteeCounter, randomState } = output);
  }
  return value / batches;
};

/**
 * One Player opens single Packs from no Discovered card. Returns the number
 * of Packs when the Player has Discovered all cards of each Base Rank.
 */
const discoverAll = (
  packId: PackId,
  options: PackSimulationOptions,
  seed: number,
  targets: Readonly<Record<RankId, readonly string[]>>
): Partial<Record<RankId, number>> => {
  const done: Partial<Record<RankId, number>> = {};
  const open = RANKS.filter((rank) => targets[rank].length > 0);
  const discovered = new Set<string>();
  const start = firstInput(packId, options, discovered);
  let guaranteeCounter = 0;
  let randomState = seed;
  for (
    let packs = 1;
    open.some((rank) => done[rank] === undefined);
    packs += 1
  ) {
    if (packs > MAX_PACKS_TO_DISCOVER) {
      throw new Error(
        `Pack ${packId} does not Discover all cards in ${MAX_PACKS_TO_DISCOVER} Packs`
      );
    }
    const output = openPack({ ...start, guaranteeCounter, randomState });
    for (const card of output.opened.cards) {
      discovered.add(card.cardId);
    }
    for (const rank of open) {
      if (
        done[rank] === undefined &&
        targets[rank].every((cardId) => discovered.has(cardId))
      ) {
        done[rank] = packs;
      }
    }
    ({ guaranteeCounter, randomState } = output);
  }
  return done;
};

/** The mean number of Packs to Discover all cards of each Base Rank. */
const packsToDiscover = (
  packId: PackId,
  options: PackSimulationOptions
): Record<RankId, number | null> => {
  const pack = getPack(packId);
  const pool = poolByBaseRank(options.race, options.classId);
  // A Base Rank is in reach when the Pack can roll that Rank or higher.
  const targets = ranksRecord((rank) =>
    RANKS.some(
      (rolled) => pack.dropRates[rolled] > 0 && isRankAtLeast(rolled, rank)
    )
      ? pool[rank]
      : []
  );
  const totals = ranksRecord(() => 0);
  for (let seed = 1; seed <= options.players; seed += 1) {
    const done = discoverAll(packId, options, seed, targets);
    for (const rank of RANKS) {
      totals[rank] += done[rank] ?? 0;
    }
  }
  return ranksRecord((rank) =>
    targets[rank].length > 0 ? totals[rank] / options.players : null
  );
};

/** Opens Packs of one kind and reports the Economy 3.1 values. */
export const simulatePack = (
  packId: PackId,
  options: PackSimulationOptions
): PackReport => {
  const pack = getPack(packId);
  const price = options.race === null ? pack.price : pack.racePackPrice;
  const single = singlePacks(packId, options);
  return {
    packId,
    race: options.race,
    ...single,
    valuePer100Coin: (single.valuePerPack * 100) / price,
    tenPackValuePer100Coin:
      (tenPacksValue(packId, options) * 100) / (price * 10),
    packsToDiscover: packsToDiscover(packId, options),
  };
};
