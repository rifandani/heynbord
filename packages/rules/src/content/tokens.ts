import type { TokenDefinition, TokenId } from "./schema";

/**
 * The v1 Tokens (Card Concepts 8). The values are provisional. A Token has no
 * budget of its own: only the cards that summon it have a budget (GDD 13).
 */
export const TOKENS: Readonly<Record<TokenId, TokenDefinition>> = {
  "token.skeleton": {
    id: "token.skeleton",
    race: "undead",
    range: 0,
    damageType: "physical",
    keywords: { swarm: 1 },
    ranks: {
      common: { attack: 1, hp: 1, speed: 2 },
      uncommon: { attack: 1, hp: 2, speed: 2 },
      rare: { attack: 2, hp: 2, speed: 2 },
      epic: { attack: 2, hp: 3, speed: 2 },
      legendary: { attack: 3, hp: 4, speed: 2 },
    },
  },
  "token.restlessWisp": {
    id: "token.restlessWisp",
    race: "undead",
    range: 0,
    damageType: "frost",
    keywords: { flying: true },
    ranks: {
      common: { attack: 1, hp: 1, speed: 1 },
      uncommon: { attack: 1, hp: 2, speed: 1 },
      rare: { attack: 2, hp: 2, speed: 1 },
      epic: { attack: 2, hp: 3, speed: 2 },
      legendary: { attack: 3, hp: 4, speed: 2 },
    },
  },
};

export const getToken = (tokenId: TokenId): TokenDefinition => TOKENS[tokenId];
