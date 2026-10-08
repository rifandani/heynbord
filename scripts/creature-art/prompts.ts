import type { CreatureConcept, RaceArt, TokenConcept } from "./concepts.ts";
import { SUBJECT } from "./subjects.ts";

const STYLE_REFERENCE_RULE =
  "Use the attached image only as a style reference: hand-painted fantasy card illustration with soft painterly brushwork, bright warm light, rich color and clean silhouettes. Do not copy any figure, object, scene or composition from it.";

/** The look of a Race: its identity, the art notes, the setting and the palette. */
const raceBlockOf = (race: RaceArt): string =>
  [
    `Race: ${race.name}. ${race.identity.charAt(0).toUpperCase()}${race.identity.slice(1)}`,
    ...race.artNotes,
    `Setting: ${race.setting}.`,
    `Palette: ${race.palette}.`,
  ].join("\n");

const IMAGE_RULES = [
  "Rules for each image:",
  "- A portrait image with a 3:4 aspect.",
  "- One main figure, full body, centered, with a clean silhouette that is easy to read at 128 px tall. Add other figures only when the brief names them.",
  "- The figure advances to the right of the image, in a three-quarter view: the chest and the lead foot point right. The face and the weapon may turn. A fortification shows its blocking face to the right.",
  "- Light from the upper left.",
  "- A simple, low-contrast background, so that the figure separates cleanly from it.",
  "- No text, no letters, no logo, no signature, no frame, no border and no gore.",
].join("\n");

/**
 * The first message of the ChatGPT conversation for one Race, with the style
 * reference attached. The card prompts of that Race follow in the same
 * conversation, so the style stays the same. The rules come from art
 * direction 5.1 to 5.4 and from section 1 of the Card Concepts.
 */
export const setupPromptOf = (race: RaceArt): string =>
  [
    `In this conversation, you will paint the card art for the ${race.name} Creature Cards of a fantasy card battle game, one image in each message.`,
    STYLE_REFERENCE_RULE,
    raceBlockOf(race),
    IMAGE_RULES,
    "Each message gives one card: a short image description, then the brief of the card. Show the subject, the pose, the props and the humor note. The image must agree with the flavor text.",
    'Reply to this message with "Ready" only. Do not make an image yet.',
  ].join("\n\n");

/** The detail level of each Base Rank (Card Concepts, section 1). */
export const RANK_DETAIL = new Map(
  Object.entries({
    Common: "plain, worn gear and a simple scene.",
    Uncommon: "some trim and one extra detail.",
    Rare: "ornate gear with gold or metal trim.",
    Epic: "a heroic scene with a dramatic composition and more detail.",
  })
);

/** The accent of a Damage Type (art direction 4.3). Physical has no accent. */
const DAMAGE_ACCENT = new Map(
  Object.entries({
    Fire: "orange-red fire accents.",
    Frost: "light blue frost accents.",
    Holy: "gold-yellow holy light accents.",
  })
);

export const articleOf = (word: string): string =>
  /^[AEIOU]/u.test(word) ? "an" : "a";

/** The brief rows. A link to a section of the document has no use in a prompt. */
const rowsOf = (rows: CreatureConcept["brief"]): string =>
  rows
    .map(
      ([field, text]) =>
        `${field}: ${text.replace(/ See the character sheet in [\d.]+\./u, "")}`
    )
    .join("\n");

const subjectOf = (id: string): string => {
  const subject = SUBJECT.get(id);
  if (!subject) {
    throw new Error(`${id}: no line in scripts/creature-art/subjects.ts`);
  }
  return subject;
};

/** The message for one card, after the setup message of its Race. */
export const promptOf = (concept: CreatureConcept, race: RaceArt): string => {
  const detail = RANK_DETAIL.get(concept.rank);
  if (!detail) {
    throw new Error(`${concept.id}: no detail level for ${concept.rank}`);
  }
  const subject = subjectOf(concept.id);
  const accent = DAMAGE_ACCENT.get(concept.damageType);
  return [
    `Card: ${concept.name}, ${articleOf(concept.rank)} ${concept.rank} ${race.name} ${concept.role} with ${concept.damageType} damage.\nFlavor text: ${concept.flavor}`,
    `Image: ${subject}.`,
    rowsOf(concept.brief),
    concept.characterSheet.length > 0
      ? `Character sheet of ${concept.name}:\n${rowsOf(concept.characterSheet)}`
      : "",
    [
      `Detail for ${articleOf(concept.rank)} ${concept.rank} card: ${detail}`,
      accent ? `Damage Type: ${accent}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    "Keep the style and the rules of this conversation: one full-body figure that advances to the right, light from the upper left, a portrait 3:4 image, no text.",
    "This card is a new character. Do not use the face, body, clothes, pose, camera angle or scene of an earlier image in this conversation again.",
  ]
    .filter(Boolean)
    .join("\n\n");
};

/**
 * The first message of the ChatGPT conversation for the Tokens, with the
 * style reference attached. It gives the look of each Race that has Tokens.
 * A Token has no Base Rank, so it uses the Common detail (Card Concepts,
 * section 8).
 */
export const tokenSetupPromptOf = (races: readonly RaceArt[]): string =>
  [
    "In this conversation, you will paint the art for the Tokens of a fantasy card battle game, one image in each message. A Token is a small Unit that a card summons onto the battlefield.",
    STYLE_REFERENCE_RULE,
    ...races.map(raceBlockOf),
    IMAGE_RULES,
    `Each message gives one Token: its Race, a short image description, then its brief. Use the setting and the palette of its Race. Show the subject, the pose, the props and the humor note. A Token is cheap and plain: ${RANK_DETAIL.get("Common")}`,
    'Reply to this message with "Ready" only. Do not make an image yet.',
  ].join("\n\n");

/** The message for one Token, after the setup message of the Tokens. */
export const tokenPromptOf = (token: TokenConcept, race: RaceArt): string => {
  const accent = DAMAGE_ACCENT.get(token.damageType);
  return [
    `Token: ${token.name}, ${articleOf(race.name)} ${race.name} Token with ${token.damageType} damage.${token.keywords.length > 0 ? `\nKeywords: ${token.keywords.join(", ")}.` : ""}`,
    `Image: ${subjectOf(token.id)}.`,
    rowsOf(token.brief),
    accent ? `Damage Type: ${accent}` : "",
    `Keep the style and the rules of this conversation: one full-body figure that advances to the right, light from the upper left, the setting and the palette of the ${race.name} Race, a portrait 3:4 image, no text.`,
    "This Token is a new character. Do not use the face, body, clothes, pose, camera angle or scene of an earlier image in this conversation again.",
  ]
    .filter(Boolean)
    .join("\n\n");
};
