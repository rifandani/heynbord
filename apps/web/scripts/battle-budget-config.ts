import {
  ClassId,
  CosmeticId,
  DeckEntry,
  deckProblems,
  getCard,
  getStage,
  rankPips,
} from "@workspace/rules";
import { Schema } from "effect";

const cosmetic = (family: string) =>
  Schema.NullOr(
    CosmeticId.check(Schema.isPattern(new RegExp(`^${family}\\.`, "u")))
  );

const BattleBudgetConfig = Schema.Struct({
  id: Schema.NonEmptyString,
  stageId: Schema.NonEmptyString,
  level: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 50 })),
  deck: Schema.Struct({ classId: ClassId, deck: Schema.Array(DeckEntry) }),
  appearance: Schema.Struct({
    portrait: cosmetic("heroPortrait"),
    gearLook: cosmetic("gearLook"),
  }),
  cosmetics: Schema.Struct({
    boardSkin: cosmetic("boardSkin"),
    cardBack: cosmetic("cardBack"),
  }),
  features: Schema.Struct({ heroModel: Schema.Boolean }),
});
export type BattleBudgetConfig = Schema.Schema.Type<typeof BattleBudgetConfig>;

const decode = Schema.decodeUnknownSync(BattleBudgetConfig);

/** Decode explicit JSON input, then check the actual Deck rules. */
export const parseBattleBudgetConfig = (
  value: Schema.Json
): BattleBudgetConfig => {
  const config = decode(value);
  const { deck, classId } = config.deck;
  for (const entry of deck) {
    if (rankPips(entry.rank) < rankPips(getCard(entry.cardId).baseRank)) {
      throw new Error(`${entry.cardId} is below its Base Rank.`);
    }
  }
  const problems = deckProblems({
    deck,
    classId,
    level: config.level,
    collection: deck.map((entry) => ({
      ...entry,
      copies: deck.filter(
        (copy) => copy.cardId === entry.cardId && copy.rank === entry.rank
      ).length,
    })),
  });
  if (problems.length > 0) {
    throw new Error(`Invalid Player Deck: ${JSON.stringify(problems)}`);
  }
  getStage(config.stageId);
  return config;
};
