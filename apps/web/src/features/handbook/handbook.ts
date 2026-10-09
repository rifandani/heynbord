import type {
  CardDefinition,
  ClassId,
  CoinDenomination,
  DamageType,
  RaceId,
  RankId,
  UnitRole,
} from "@workspace/rules";
import {
  CARDS,
  CAMPAIGN_WIN_XP,
  countdownLimit,
  HAND_LIMIT,
  keywordValue,
  LANE_LENGTH,
  MAX_COPIES,
  PLAYER_LEVEL_XP,
  RANKS,
  rankPips,
  ranksOf,
  recallChance,
  scaleForRank,
  SHARED_RANK_VALUES,
  STAGE_LANES,
  STARTING_HAND,
  STAR_FAST_WIN_TURN,
  SUDDEN_DEATH_DOUBLE_TURN,
  SUDDEN_DEATH_TURN,
  SUMMON_ZONE_DEPTH,
  TURN_LIMIT,
  WALL_SUMMON_DEPTH,
} from "@workspace/rules";

import type { Keyword, TextRef } from "@/features/battle/card-text";
import {
  FLAG_KEYWORDS,
  STATUS_TEXT,
  VALUE_KEYWORDS,
} from "@/features/battle/card-text";
import type { Glyph } from "@/features/battle/glyphs";
import { classGlyph, raceGlyph, roleGlyph } from "@/features/battle/glyphs";
import type { Status } from "@/features/battle/scene/status-visuals";
import { STATUS_ORDER } from "@/features/battle/scene/status-visuals";
import { CLASSES_WITH_CARDS, RACES_WITH_CARDS } from "@/features/deck/deck";
import type { DiagramId } from "@/features/handbook/handbook-diagrams";

/** The Chapters of the Handbook, in the order that a new Player learns them. */
export const CHAPTERS = [
  "battle",
  "cards",
  "units",
  "keywords",
  "statuses",
  "kinds",
  "ranks",
  "progress",
] as const;
export type ChapterId = (typeof CHAPTERS)[number];

const BATTLE_ENTRIES = [
  "board",
  "lane",
  "square",
  "column",
  "front",
  "summonZone",
  "closedLane",
  "side",
  "hero",
  "turn",
  "startStep",
  "playPhase",
  "resolutionPhase",
  "endStep",
  "suddenDeath",
  "routed",
  "defeated",
] as const;

const CARD_ENTRIES = [
  "creatureCard",
  "skillCard",
  "hand",
  "handLimit",
  "deck",
  "graveyard",
  "countdown",
  "ready",
  "recall",
  "countdownLimit",
] as const;

const UNIT_ENTRIES = [
  "unit",
  "attack",
  "hp",
  "speed",
  "range",
  "melee",
  "ranged",
  "movement",
] as const;

const PROGRESS_ENTRIES = ["stars", "playerLevel", "coin"] as const;

const DAMAGE_TYPES: readonly DamageType[] = [
  "physical",
  "fire",
  "frost",
  "holy",
];

const ROLES: readonly UnitRole[] = [
  "frontliner",
  "striker",
  "runner",
  "shooter",
  "support",
  "wall",
];

/**
 * One Entry of the Handbook. Each ID is one word, so that its Translation
 * Keys never nest in other keys (`handbook.entries.<id>`).
 */
export type EntryId =
  | (typeof BATTLE_ENTRIES)[number]
  | (typeof CARD_ENTRIES)[number]
  | (typeof UNIT_ENTRIES)[number]
  | (typeof PROGRESS_ENTRIES)[number]
  | `keyword${Capitalize<Keyword>}`
  | "status"
  | `status${Capitalize<Status>}`
  | "damageType"
  | `damage${Capitalize<DamageType>}`
  | "race"
  | `race${Capitalize<RaceId>}`
  | "class"
  | `class${Capitalize<ClassId>}`
  | "role"
  | `role${Capitalize<UnitRole>}`
  | "rank"
  | `rank${Capitalize<RankId>}`
  | "rankGems";

/** The icon of an Entry or a Chapter. Each one is an icon that the game already shows. */
export type EntryIcon =
  | { readonly kind: "glyph"; readonly glyph: Glyph }
  | { readonly kind: "damage"; readonly damageType: DamageType }
  | { readonly kind: "status"; readonly status: Status }
  | { readonly kind: "rank"; readonly rank: RankId }
  | { readonly kind: "star" }
  | { readonly kind: "coin" };

/**
 * How an Entry of a value Keyword shows N: a table for each Rank, or a line
 * that sends the Player to the card.
 */
export type KeywordValueKind =
  | "rankTable"
  | "rankGuideTable"
  | "commonRankGuide"
  | "starsTable"
  | "coinTable"
  | "playerLevelTable"
  | "card";

/** Attack and HP on a sample card face for the Common Rank guide. */
export const COMMON_RANK_FACE_EXAMPLE = {
  attack: 4,
  hp: 5,
} as const;

export interface Entry {
  readonly id: EntryId;
  readonly chapter: ChapterId;
  readonly name: TextRef;
  /** The rule text, one paragraph for each item. */
  readonly body: readonly TextRef[];
  readonly icon?: EntryIcon;
  readonly value?: KeywordValueKind;
  readonly diagram?: DiagramId;
  readonly seeAlso: readonly EntryId[];
}

const capitalize = <S extends string>(word: S): Capitalize<S> =>
  // SAFETY: the first letter in upper case is the definition of `Capitalize`.
  (word.charAt(0).toUpperCase() + word.slice(1)) as Capitalize<S>;

/** The Entry of a Keyword, for a link from the Details Panel. */
export const keywordEntryId = (keyword: Keyword): EntryId =>
  `keyword${capitalize(keyword)}`;

/** The Entry of a Status, for a link from the Details Panel. */
export const statusEntryId = (status: Status): EntryId =>
  `status${capitalize(status)}`;

/** The Entry of a Damage Type, for a link from the Details Panel. */
export const damageEntryId = (damageType: DamageType): EntryId =>
  `damage${capitalize(damageType)}`;

/** The letter for the value of a value Keyword in its Entry, for example "Charge N". */
const N = { key: "handbook.n" } as const;

/** The value Keywords whose value on each card follows the shared Rank table. */
export const rankTableKeywords = (
  cards: readonly CardDefinition[]
): ReadonlySet<Keyword> =>
  new Set(
    VALUE_KEYWORDS.filter((keyword) => {
      const users = cards.flatMap((card) =>
        card.kind === "creature" && card.keywords[keyword] !== undefined
          ? [card]
          : []
      );
      return (
        users.length > 0 &&
        users.every((card) =>
          ranksOf(card).every(
            (rank) =>
              keywordValue(card.keywords[keyword], rank) ===
              SHARED_RANK_VALUES[rank]
          )
        )
      );
    })
  );

/** The rows of the shared Rank table: N at each Rank. */
export const RANK_TABLE: readonly {
  readonly rank: RankId;
  readonly value: number;
}[] = RANKS.map((rank) => ({ rank, value: SHARED_RANK_VALUES[rank] }));

/** Stat scale, Recall and shared Keyword N for the Ranks chapter guide (GDD 5.3–5.4). */
export const RANK_GUIDE_TABLE: readonly {
  readonly rank: RankId;
  readonly scale: number;
  readonly recall: number;
  readonly keywordN: number;
}[] = RANKS.map((rank) => ({
  rank,
  scale: scaleForRank(100, rank) / 100,
  recall: recallChance(rank) / 100,
  keywordN: SHARED_RANK_VALUES[rank],
}));

/** Each Star count and the Translation Key of its win condition (GDD 4.11). */
export const STARS_TABLE: readonly {
  readonly count: 1 | 2 | 3;
  readonly rule: TextRef;
}[] = [
  { count: 1, rule: { key: "handbook.starsRow.1" } },
  { count: 2, rule: { key: "handbook.starsRow.2" } },
  {
    count: 3,
    rule: {
      key: "handbook.starsRow.3",
      args: { fastTurn: STAR_FAST_WIN_TURN },
    },
  },
];

/** Example Coin on the Town balance plate: 1 Gold, 54 Silver, 20 Copper (Economy 1.1). */
export const COIN_EXAMPLE_COPPER = 15_420;

/** Each Coin denomination and how it converts (Economy 1.1). */
export const COIN_DENOM_TABLE: readonly {
  readonly denomination: CoinDenomination;
  readonly rule: TextRef;
}[] = [
  { denomination: "gold", rule: { key: "handbook.coinRow.gold" } },
  { denomination: "silver", rule: { key: "handbook.coinRow.silver" } },
  { denomination: "copper", rule: { key: "handbook.coinRow.copper" } },
];

/** What Coin pays for in the Handbook Coin Entry. */
export const COIN_USES_TABLE: readonly {
  readonly id: "deckSlots" | "later";
  readonly rule: TextRef;
}[] = [
  { id: "deckSlots", rule: { key: "handbook.coinUse.deckSlots" } },
  { id: "later", rule: { key: "handbook.coinUse.later" } },
];

/** Campaign win XP by Region, for the Player level Entry (Economy 2.1). */
export const PLAYER_LEVEL_XP_TABLE: readonly {
  readonly region: 1 | 2 | 3;
  readonly win: number;
}[] = ([1, 2, 3] as const).map((region) => ({
  region,
  win: CAMPAIGN_WIN_XP[region - 1] ?? 0,
}));

/** Sample levels for Hero HP, Deck size and Countdown Limit in the Handbook. */
export const PLAYER_LEVEL_STAT_SAMPLES = [1, 5, 10, 21, 30] as const;

/** Town and mode unlocks that a Player level opens (GDD 7.1). */
export const PLAYER_LEVEL_UNLOCK_TABLE: readonly {
  readonly level: number;
  readonly rule: TextRef;
}[] = [
  { level: 2, rule: { key: "handbook.playerUnlock.packs" } },
  { level: 3, rule: { key: "handbook.playerUnlock.workshop" } },
  { level: 5, rule: { key: "handbook.playerUnlock.gear" } },
  { level: 6, rule: { key: "handbook.playerUnlock.craft" } },
  { level: 10, rule: { key: "handbook.playerUnlock.dungeon1" } },
  { level: 20, rule: { key: "handbook.playerUnlock.dungeon2" } },
  { level: 30, rule: { key: "handbook.playerUnlock.dungeon3" } },
];

const RANK_TABLE_KEYWORDS = rankTableKeywords(CARDS);

const keywordEntry = (keyword: Keyword): Entry => {
  const valued = VALUE_KEYWORDS.some((name) => name === keyword);
  const args = valued ? { value: N } : undefined;
  return {
    id: keywordEntryId(keyword),
    chapter: "keywords",
    name: { key: `keywords.${keyword}`, args },
    body: [{ key: `keywordRules.${keyword}`, args }],
    value: valued
      ? RANK_TABLE_KEYWORDS.has(keyword)
        ? "rankTable"
        : "card"
      : undefined,
    seeAlso: [],
  };
};

const statusEntry = (status: Status): Entry => ({
  id: statusEntryId(status),
  chapter: "statuses",
  name: { key: STATUS_TEXT[status].name, args: { value: N } },
  body: [{ key: STATUS_TEXT[status].rule }],
  icon: { kind: "status", status },
  seeAlso: [],
});

/** Physical damage has no rule on a card, so its Entry has its own text. */
const damageRule = (damageType: DamageType): TextRef =>
  damageType === "physical"
    ? { key: "handbook.entries.damagePhysical" }
    : { key: `keywordRules.${damageType}` };

const damageEntry = (damageType: DamageType): Entry => ({
  id: damageEntryId(damageType),
  chapter: "statuses",
  name: { key: `damageTypes.${damageType}` },
  body: [damageRule(damageType)],
  icon: { kind: "damage", damageType },
  seeAlso: [],
});

/** An Entry with a name and a text of its own in the `handbook` keys. */
const termEntry = (
  id: EntryId,
  chapter: ChapterId,
  args?: TextRef["args"]
): Entry => ({
  id,
  chapter,
  name: { key: `handbook.names.${id}` },
  body: [{ key: `handbook.entries.${id}`, args }],
  seeAlso: [],
});

/** An Entry whose name is a term that the game shows already, for example `races.elf`. */
const namedEntry = (
  id: EntryId,
  chapter: ChapterId,
  name: string,
  icon?: EntryIcon
): Entry => ({
  ...termEntry(id, chapter),
  name: { key: name },
  icon,
});

const glyph = (name: Glyph): EntryIcon => ({ kind: "glyph", glyph: name });

const rankEntry = (rank: RankId): Entry => {
  const entry: Entry = {
    id: `rank${capitalize(rank)}`,
    chapter: "ranks",
    name: { key: `ranks.${rank}` },
    body: [
      { key: `handbook.rankTierIntro.${rank}` },
      {
        key: "handbook.rankTierStats",
        args: {
          gems: rankPips(rank),
          scale: scaleForRank(100, rank) / 100,
          recall: recallChance(rank) / 100,
        },
      },
    ],
    icon: { kind: "rank", rank },
    seeAlso: [],
  };
  if (rank === "common") {
    return {
      ...entry,
      value: "commonRankGuide",
      seeAlso: ["rank", "rankGems", "recall"],
    };
  }
  return entry;
};

/** The values in the text of the Entries, from the rules, so the text never differs. */
const TEXT_ARGS: Partial<Record<EntryId, TextRef["args"]>> = {
  board: { lanes: STAGE_LANES },
  lane: { squares: LANE_LENGTH },
  column: { squares: LANE_LENGTH },
  summonZone: {
    columns: SUMMON_ZONE_DEPTH,
    next: SUMMON_ZONE_DEPTH + 1,
    wall: WALL_SUMMON_DEPTH,
  },
  startStep: { turn: SUDDEN_DEATH_TURN, limit: HAND_LIMIT },
  suddenDeath: {
    turn: SUDDEN_DEATH_TURN,
    double: SUDDEN_DEATH_DOUBLE_TURN,
    limit: TURN_LIMIT,
  },
  hand: { start: STARTING_HAND },
  handLimit: { limit: HAND_LIMIT },
  deck: { copies: MAX_COPIES },
  recall: {
    low: recallChance("common") / 100,
    high: recallChance("legendary") / 100,
  },
  countdownLimit: { first: countdownLimit(1) },
  stars: { fastTurn: STAR_FAST_WIN_TURN },
  playerLevel: { maxLevel: PLAYER_LEVEL_XP.length },
};

const term = (id: EntryId, chapter: ChapterId) =>
  termEntry(id, chapter, TEXT_ARGS[id]);

const rankOverviewEntry = (): Entry => ({
  ...term("rank", "ranks"),
  value: "rankGuideTable",
});

/** The terms that the game already names, with their Translation Key. */
const SHOWN_NAMES: Partial<Record<EntryId, string>> = {
  hand: "battle.hand",
  deck: "battle.deck",
  graveyard: "battle.graveyard",
  ready: "battle.ready",
  attack: "battle.attack",
  hp: "battle.hp",
  speed: "battle.speedStat",
  range: "battle.range",
  melee: "keywords.melee",
  coin: "town.balances.coin.name",
};

const ICONS: Partial<Record<EntryId, EntryIcon>> = {
  closedLane: glyph("lock"),
  hero: glyph("helmet"),
  deck: glyph("cards"),
  countdown: glyph("hourglass"),
  recall: glyph("recall"),
  attack: glyph("sword"),
  hp: glyph("heart"),
  speed: glyph("speed"),
  range: glyph("range"),
  ranged: glyph("bow"),
  stars: { kind: "star" },
  coin: { kind: "coin" },
  rankGems: { kind: "rank", rank: "rare" },
};

/** An Entry of the Battle, Cards, Units or Progress Chapters. */
const plainEntry = (id: EntryId, chapter: ChapterId): Entry => {
  const entry = term(id, chapter);
  const name = SHOWN_NAMES[id];
  return {
    ...entry,
    name: name ? { key: name } : entry.name,
    icon: ICONS[id],
    value:
      id === "stars"
        ? "starsTable"
        : id === "coin"
          ? "coinTable"
          : id === "playerLevel"
            ? "playerLevelTable"
            : undefined,
  };
};

/** The Lane strip diagrams (issue #25): about 10 Entries. */
const DIAGRAMS: Partial<Record<EntryId, DiagramId>> = {
  summonZone: "summonZone",
  front: "front",
  movement: "movement",
  keywordFlying: "flying",
  keywordKnockback: "knockback",
  keywordTrample: "trample",
  keywordPivot: "pivot",
  keywordWall: "wall",
  ranged: "ranged",
  keywordFirstStrike: "firstStrike",
};

/** The related Entries that each Entry links to. */
const SEE_ALSO: Partial<Record<EntryId, readonly EntryId[]>> = {
  board: ["lane", "square", "column", "side"],
  lane: ["square", "front", "closedLane"],
  square: ["lane", "column"],
  column: ["summonZone", "lane"],
  front: ["hero", "lane"],
  summonZone: ["column", "keywordWall", "creatureCard"],
  closedLane: ["lane", "summonZone"],
  side: ["hero", "routed"],
  hero: ["front", "defeated", "class"],
  turn: ["startStep", "playPhase", "resolutionPhase", "endStep"],
  startStep: ["countdown", "suddenDeath", "keywordRegeneration"],
  playPhase: ["ready", "summonZone", "skillCard"],
  resolutionPhase: ["movement", "attack", "keywordRetaliation"],
  endStep: ["statusBurn", "statusPoison"],
  suddenDeath: ["startStep", "defeated"],
  routed: ["side", "deck", "hand"],
  defeated: ["hero", "routed"],
  creatureCard: ["unit", "race", "role"],
  skillCard: ["recall", "class"],
  hand: ["handLimit", "countdown"],
  handLimit: ["hand", "deck"],
  deck: ["countdownLimit", "graveyard", "class"],
  graveyard: ["deck", "recall"],
  countdown: ["ready", "countdownLimit"],
  ready: ["countdown", "playPhase"],
  recall: ["skillCard", "rank", "graveyard"],
  countdownLimit: ["countdown", "deck", "playerLevel"],
  unit: ["creatureCard", "attack", "hp", "movement"],
  attack: ["damageType", "keywordArmor", "melee", "ranged"],
  hp: ["attack", "defeated"],
  speed: ["movement", "keywordCharge", "statusHobble"],
  range: ["ranged", "roleShooter"],
  melee: ["ranged", "attack"],
  ranged: ["range", "melee"],
  movement: ["speed", "keywordFlying", "statusEntangle"],
  keywordArmor: ["damageHoly"],
  keywordBleed: ["statusBleed", "keywordRegeneration"],
  keywordCharge: ["speed"],
  keywordEntangle: ["statusEntangle", "ranged"],
  keywordFirstStrike: ["keywordRetaliation", "melee"],
  keywordFlying: ["movement"],
  keywordHeroic: ["hero"],
  keywordHobble: ["statusHobble", "speed"],
  keywordKnockback: ["keywordWall", "melee"],
  keywordLastBreath: ["defeated"],
  keywordPivot: ["melee"],
  keywordPoison: ["statusPoison", "endStep"],
  keywordRally: ["startStep", "attack"],
  keywordRegeneration: ["startStep", "statusBleed"],
  keywordRetaliation: ["keywordFirstStrike", "melee"],
  keywordSabotage: ["countdown"],
  keywordTrample: ["melee"],
  keywordUnique: ["creatureCard"],
  keywordWall: ["roleWall", "summonZone"],
  status: ["damageType", "statusBurn", "statusFreeze"],
  statusBurn: ["damageFire", "endStep"],
  statusFreeze: ["damageFrost"],
  statusPoison: ["keywordPoison", "endStep"],
  statusEntangle: ["keywordEntangle", "movement"],
  statusBleed: ["keywordBleed", "keywordRegeneration"],
  statusHobble: ["keywordHobble", "speed"],
  damageType: ["status", "attack"],
  damagePhysical: ["keywordArmor"],
  damageFire: ["statusBurn"],
  damageFrost: ["statusFreeze"],
  damageHoly: ["keywordArmor"],
  race: ["creatureCard"],
  class: ["skillCard", "hero"],
  role: ["creatureCard", "range"],
  roleShooter: ["ranged", "range"],
  roleSupport: ["keywordRally", "keywordRegeneration"],
  roleWall: ["keywordWall"],
  rank: ["rankGems", "recall"],
  rankGems: ["rank"],
  stars: ["hp", "turn"],
  playerLevel: ["countdownLimit", "hero"],
  coin: ["deck"],
};

const withLinks = (entry: Entry): Entry => ({
  ...entry,
  diagram: DIAGRAMS[entry.id],
  seeAlso: SEE_ALSO[entry.id] ?? [],
});

/**
 * All Entries, in Chapter order. An Entry exists only for a feature that is in
 * the game: the Races and the Classes are those that have cards, as in the
 * Deck builder. The Player can read all Entries from the start.
 */
export const ENTRIES: readonly Entry[] = [
  ...BATTLE_ENTRIES.map((id) => plainEntry(id, "battle")),
  ...CARD_ENTRIES.map((id) => plainEntry(id, "cards")),
  ...UNIT_ENTRIES.map((id) => plainEntry(id, "units")),
  ...[...VALUE_KEYWORDS, ...FLAG_KEYWORDS].map(keywordEntry),
  term("status", "statuses"),
  ...STATUS_ORDER.map(statusEntry),
  term("damageType", "statuses"),
  ...DAMAGE_TYPES.map(damageEntry),
  term("race", "kinds"),
  ...RACES_WITH_CARDS.map((race) =>
    namedEntry(`race${capitalize(race)}`, "kinds", `races.${race}`, {
      kind: "glyph",
      glyph: raceGlyph(race),
    })
  ),
  term("class", "kinds"),
  ...CLASSES_WITH_CARDS.map((classId) =>
    namedEntry(`class${capitalize(classId)}`, "kinds", `classes.${classId}`, {
      kind: "glyph",
      glyph: classGlyph(classId),
    })
  ),
  term("role", "kinds"),
  ...ROLES.map((role) =>
    namedEntry(`role${capitalize(role)}`, "kinds", `roles.${role}`, {
      kind: "glyph",
      glyph: roleGlyph(role),
    })
  ),
  rankOverviewEntry(),
  ...RANKS.map(rankEntry),
  plainEntry("rankGems", "ranks"),
  ...PROGRESS_ENTRIES.map((id) => plainEntry(id, "progress")),
].map(withLinks);

const ENTRY_BY_ID: ReadonlyMap<EntryId, Entry> = new Map(
  ENTRIES.map((entry) => [entry.id, entry])
);

export const getEntry = (id: EntryId): Entry => {
  const entry = ENTRY_BY_ID.get(id);
  if (!entry) {
    throw new Error(`Unknown Handbook Entry: ${id}`);
  }
  return entry;
};

/** The Entry ID of a list item key, or `null` for a key that is not an Entry. */
export const toEntryId = (key: string | number): EntryId | null =>
  ENTRIES.find((entry) => entry.id === String(key))?.id ?? null;

/** The icon of each Chapter tab. */
export const CHAPTER_ICONS: Readonly<Record<ChapterId, EntryIcon>> = {
  battle: glyph("horn"),
  cards: glyph("cards"),
  units: glyph("shield"),
  keywords: glyph("banner"),
  statuses: glyph("flame"),
  kinds: glyph("crown"),
  ranks: { kind: "rank", rank: "epic" },
  progress: { kind: "star" },
};

/**
 * The Entries of a Chapter, in their list order. The Keywords are an index in
 * the order of their names in the current Locale; the other Chapters keep the
 * order in which a new Player learns them.
 */
export const chapterEntries = (
  chapter: ChapterId,
  nameOf: (entry: Entry) => string,
  locale: string
): readonly Entry[] => {
  const entries = ENTRIES.filter((entry) => entry.chapter === chapter);
  if (chapter !== "keywords") {
    return entries;
  }
  const { compare } = new Intl.Collator(locale, { sensitivity: "base" });
  return entries.toSorted((a, b) => compare(nameOf(a), nameOf(b)));
};

/** The Entry that the Handbook opens the first time: Chapter Battle, Entry Board. */
export const FIRST_ENTRY: EntryId = "board";

/** The Entries that players can also find by words from other games. */
export const ALIASED_ENTRIES: ReadonlySet<EntryId> = new Set<EntryId>([
  "board",
  "lane",
  "square",
  "side",
  "hero",
  "turn",
  "resolutionPhase",
  "suddenDeath",
  "routed",
  "defeated",
  "creatureCard",
  "skillCard",
  "handLimit",
  "deck",
  "graveyard",
  "countdown",
  "ready",
  "recall",
  "countdownLimit",
  "unit",
  "hp",
  "range",
  "movement",
  "keywordCharge",
  "keywordKnockback",
  "keywordLastBreath",
  "keywordTrample",
  "keywordWall",
  "keywordEntangle",
  "keywordPoison",
  "keywordSabotage",
  "keywordUnique",
  "keywordRetaliation",
  "status",
  "statusFreeze",
  "statusBleed",
  "statusHobble",
  "damageType",
  "race",
  "class",
  "role",
  "rank",
  "rankGems",
  "stars",
  "playerLevel",
  "coin",
]);

/** The Translation Key of the aliases of an Entry: a list with commas. */
export const aliasKey = (id: EntryId): string => `handbook.aliases.${id}`;

/** The aliases in one Message Catalog string: "mana, cost" is two aliases. */
export const splitAliases = (text: string): readonly string[] =>
  text
    .split(",")
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);

/** One Entry as the search sees it, in the current Locale. */
export interface SearchItem {
  readonly id: EntryId;
  readonly name: string;
  readonly aliases: readonly string[];
}

/** One search result. `alias` is the alias that matched, for "mana → Countdown". */
export interface SearchHit {
  readonly id: EntryId;
  readonly alias: string | null;
}

/** Lower case, with no accents and single spaces, so that "Énergie" finds "energie". */
const fold = (text: string): string =>
  text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll(/\s+/gu, " ")
    .trim();

/** 0 for a match at the start of a word, 1 for a match in a word, `null` for none. */
const matchRank = (text: string, query: string): number | null => {
  const folded = fold(text);
  const at = folded.indexOf(query);
  if (at === -1) {
    return null;
  }
  return at === 0 || folded.charAt(at - 1) === " " ? 0 : 1;
};

interface Scored {
  readonly hit: SearchHit;
  readonly score: number;
  readonly order: number;
}

const scoreItem = (
  item: SearchItem,
  order: number,
  query: string
): Scored | null => {
  const byName = matchRank(item.name, query);
  if (byName !== null) {
    return { hit: { id: item.id, alias: null }, score: byName, order };
  }
  for (const rank of [0, 1]) {
    const alias = item.aliases.find((word) => matchRank(word, query) === rank);
    if (alias !== undefined) {
      return { hit: { id: item.id, alias }, score: 2 + rank, order };
    }
  }
  return null;
};

/**
 * The Entries that match a search, by name or by alias, in the current Locale.
 * A name match comes before an alias match, and a match at the start of a
 * word before a match in a word. Then the Entries keep the Handbook order.
 */
export const searchEntries = (
  query: string,
  items: readonly SearchItem[]
): readonly SearchHit[] => {
  const folded = fold(query);
  if (folded.length === 0) {
    return [];
  }
  return items
    .flatMap((item, order) => scoreItem(item, order, folded) ?? [])
    .toSorted((a, b) => a.score - b.score || a.order - b.order)
    .map((scored) => scored.hit);
};

/** Where an opened Handbook starts: the last Entry that the Player read, or a linked Entry. */
export interface HandbookRequest {
  readonly entry: EntryId;
  /** `link` opens the Entry page. `bar` opens the list on a single page. */
  readonly from: "bar" | "link";
}

/** The page that shows when the Handbook has room for only one page. */
export type HandbookPage = "list" | "entry";

/** The place in an open Handbook. */
export interface HandbookPlace {
  readonly chapter: ChapterId;
  readonly entry: EntryId;
  readonly page: HandbookPage;
}

/** The place where a Handbook opens. */
export const openPlace = (request: HandbookRequest): HandbookPlace => ({
  chapter: getEntry(request.entry).chapter,
  entry: request.entry,
  page: request.from === "link" ? "entry" : "list",
});

/** An Entry from the list, a search result or a "See also" link opens its page. */
export const showEntry = (id: EntryId): HandbookPlace => ({
  chapter: getEntry(id).chapter,
  entry: id,
  page: "entry",
});

/**
 * A Chapter tab shows the list of the Chapter. The open Entry stays when it is
 * in the Chapter. Else the first Entry of the list opens on the second page.
 */
export const showChapter = (
  place: HandbookPlace,
  chapter: ChapterId,
  first: EntryId
): HandbookPlace => ({
  chapter,
  entry: getEntry(place.entry).chapter === chapter ? place.entry : first,
  page: "list",
});
