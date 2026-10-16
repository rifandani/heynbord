/**
 * The Pack actions of the Profile (Economy 3.1). They are pure: the same
 * Profile and order always give the same cards, so v2 can run them on a
 * server (technical design 5).
 */
import type { Collection } from "../collection/deck-building";
import { getPack, TEN_PACKS } from "../content/packs";
import type { PackId } from "../content/packs";
import type { ClassId, DeckEntry } from "../content/schema";
import { openPack, openTenPacks } from "../packs/open-pack";
import type {
  GuaranteeSource,
  OpenedPack,
  OpenPackInput,
  OpenTenPacksOutput,
  PackPool,
} from "../packs/open-pack";
import { seedState } from "../random";
import type { PackState, Profile } from "./schema";

/** The Pack state of a new Player: all counters at 0, the random state from the seed. */
export const newPackState = (seed: number): PackState => ({
  guaranteeCounters: { peddler: 0, merchant: 0, royal: 0 },
  randomState: seedState(seed),
});

/** Open (1 Pack) or Open ×10. */
export type OpenCount = 1 | typeof TEN_PACKS;

/** The Packs that the Player buys in one action. */
export interface PackOrder {
  readonly pack: PackId;
  /** All cards, the Creature Cards of one Race or the Skill Cards of one Class. */
  readonly pool: PackPool;
  readonly count: OpenCount;
}

/**
 * The price of an order, in Copper: the Pack price × the count. A Race Pack
 * and a Class Pack cost more.
 */
export const orderPrice = (order: PackOrder): number => {
  const pack = getPack(order.pack);
  return (
    (order.pool.kind === "all" ? pack.price : pack.versionPrice) * order.count
  );
};

/** The IDs of the cards that the Player has Discovered: each card in the Collection. */
export const discoveredCards = (collection: Collection): ReadonlySet<string> =>
  new Set(collection.map((entry) => entry.cardId));

/** The Collection with one more copy of each card. A new card and Rank goes at the end. */
export const addCopies = (
  collection: Collection,
  copies: readonly DeckEntry[]
): Collection => {
  const entries = new Map(
    collection.map((entry) => [`${entry.cardId}:${entry.rank}`, entry])
  );
  for (const copy of copies) {
    const key = `${copy.cardId}:${copy.rank}`;
    const entry = entries.get(key);
    entries.set(
      key,
      entry
        ? { ...entry, copies: entry.copies + 1 }
        : { cardId: copy.cardId, rank: copy.rank, copies: 1 }
    );
  }
  return [...entries.values()];
};

/** One card of an opened Pack. `isNew`: the Player had not Discovered it before the Pack. */
export interface RevealedCard extends DeckEntry {
  readonly isNew: boolean;
}

export interface RevealedPack {
  /** The 5 cards, from the lowest Rank to the highest: the best card is last. */
  readonly cards: readonly RevealedCard[];
  readonly guaranteedBy: GuaranteeSource | null;
}

/**
 * Marks the cards that were not Discovered before their Pack. In Open ×10, a
 * card from an earlier Pack counts as Discovered.
 */
export const markNew = (
  packs: readonly OpenedPack[],
  discovered: ReadonlySet<string>
): readonly RevealedPack[] => {
  const seen = new Set(discovered);
  return packs.map((pack) => {
    const cards = pack.cards.map((card) => ({
      ...card,
      isNew: !seen.has(card.cardId),
    }));
    for (const card of cards) {
      seen.add(card.cardId);
    }
    return { cards, guaranteedBy: pack.guaranteedBy };
  });
};

/** A Profile after a Pack action, and the Packs that the reveal shows. */
export interface PackOpening<P> {
  readonly profile: P;
  /** 1 Pack, 10 Packs, or 11 for a Royal Open ×10, in the order that they open. */
  readonly opened: readonly RevealedPack[];
}

const openCount = (
  count: OpenCount,
  input: OpenPackInput
): OpenTenPacksOutput => {
  if (count === TEN_PACKS) {
    return openTenPacks(input);
  }
  const one = openPack(input);
  return { ...one, packs: [one.opened] };
};

/**
 * Opens the Packs of an order at no cost: adds the copies to the Collection,
 * moves the Pack Guarantee counter and the random state forward, and adds
 * each opened Pack to the `packsOpened` Tally.
 */
const openOrder = <
  P extends Pick<Profile, "collection" | "packState" | "tallies">,
>(
  profile: P,
  order: PackOrder,
  classId: ClassId
): PackOpening<P> => {
  const discovered = discoveredCards(profile.collection);
  const input: OpenPackInput = {
    pack: order.pack,
    pool: order.pool,
    classId,
    discovered,
    guaranteeCounter: profile.packState.guaranteeCounters[order.pack],
    randomState: profile.packState.randomState,
  };
  const result = openCount(order.count, input);
  return {
    profile: {
      ...profile,
      collection: addCopies(
        profile.collection,
        result.packs.flatMap((pack) => pack.cards)
      ),
      packState: {
        guaranteeCounters: {
          ...profile.packState.guaranteeCounters,
          [order.pack]: result.guaranteeCounter,
        },
        randomState: result.randomState,
      },
      tallies: {
        ...profile.tallies,
        packsOpened: profile.tallies.packsOpened + result.packs.length,
      },
    },
    opened: markNew(result.packs, discovered),
  };
};

/**
 * Buys an order (Economy 3.1): takes the Coin and opens the Packs. `null` when
 * the Coin is not enough. `classId` is the current Hero Class: "All cards"
 * has only its Skill Cards. It reads and changes only the Coin, the
 * Collection, the Pack state and the Tallies of the Profile.
 */
export const buyPacks = <
  P extends Pick<Profile, "coin" | "collection" | "packState" | "tallies">,
>(
  profile: P,
  order: PackOrder,
  classId: ClassId
): PackOpening<P> | null => {
  const price = orderPrice(order);
  if (profile.coin < price) {
    return null;
  }
  return openOrder({ ...profile, coin: profile.coin - price }, order, classId);
};

/** The pool of an Unopened Pack: all cards, or the Race that the Player selects for the `race` version. */
export type UnopenedPackPool = Extract<PackPool, { kind: "all" | "race" }>;

/**
 * Opens the Unopened Pack at `index` at no cost (Economy 3.1): removes it from
 * the list and opens it as a bought Pack. `null` when there is no Unopened
 * Pack at `index`, for example after a second fast press. The pool must fit
 * the version of the Pack.
 */
export const openUnopenedPack = <
  P extends Pick<
    Profile,
    "collection" | "packState" | "unopenedPacks" | "tallies"
  >,
>(
  profile: P,
  index: number,
  pool: UnopenedPackPool,
  classId: ClassId
): PackOpening<P> | null => {
  const unopened = profile.unopenedPacks[index];
  if (unopened === undefined) {
    return null;
  }
  if (pool.kind !== unopened.version) {
    throw new RangeError(
      `An Unopened Pack of the ${unopened.version} version cannot open with a ${pool.kind} pool`
    );
  }
  return openOrder(
    { ...profile, unopenedPacks: profile.unopenedPacks.toSpliced(index, 1) },
    { pack: unopened.pack, pool, count: 1 },
    classId
  );
};
