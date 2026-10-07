import type { FxSlotName } from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import { FX_SLOTS } from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import type { Background } from "./slots.ts";
import { backgroundOf } from "./slots.ts";

/**
 * The first message of the ChatGPT conversation (#12), with the style
 * reference attached. The slot prompts follow in the same conversation, so
 * the style stays the same.
 */
export const SETUP_PROMPT = [
  "In this conversation, you will paint separate visual-effect images for a fantasy card battle game, one image in each message.",
  "Use the attached image only as a style reference: hand-painted fantasy game art with soft painterly brushwork, warm light and rich color, as in the meadow painting and the fire and ice spell cards. Do not copy any object, scene or composition from it.",
  "Rules for each image: a square image; ONE single isolated element, centered, that fills about 70% of the frame and touches no edge; no text, no letters, no numbers, no frame, no border, no ground, no cast shadow, no scenery and no characters.",
  'Reply to this message with "Ready" only. Do not make an image yet.',
].join("\n\n");

const ICON_STYLE =
  "This is a game status icon that must be readable at 24 px: one bold, simple silhouette with a thick dark outline, very few details, front view.";

const BACKGROUND_RULE: Readonly<Record<Background, string>> = {
  black:
    "Background: pure flat black (#000000) everywhere outside the element, with no gradient, no vignette and no texture. The element is pure emitted light: only bright glowing tones, no dark outlines, no dark shading and no black inside the element.",
  transparent:
    "Background: fully transparent (a PNG with a real alpha channel). No background color, no painted checkerboard, no glow or shadow around the element. Clean silhouette edges.",
};

const SUBJECT: Readonly<Record<FxSlotName, string>> = {
  glow: "a soft round radial glow of light: a bright center that fades smoothly to nothing at its edge. Perfectly round, no rays, no texture.",
  burst:
    "a round impact burst: a bright starburst of jagged painted energy streaks that radiate from the center, with a few small flecks.",
  slash:
    "a curved melee sword-slash arc: a thick crescent swoosh with a sharp bright leading edge and a tail that tapers and fades, seen flat from the front.",
  flare:
    "a holy flare: a radiant golden star of light with long thin rays and a soft glowing core.",
  "rune-ring":
    "a flat circle of glowing magic runes, seen straight from above: a thin outer ring and a thin inner ring with simple abstract rune marks between them (not real letters).",
  flame:
    "one single flame tongue: a tall curling tongue of fire, yellow-white at the base and orange-red at the tip.",
  vine: "a curled thorny vine with a few small leaves, in a loose open curl, as if it grabs upward from the ground.",
  chain:
    "a heavy iron chain loop: a few thick dark iron links in an open loop, with small worn highlights.",
  shield:
    "a sturdy steel kite shield, front view, with a pale blue metallic sheen and a simple rim, no emblem.",
  spark:
    "a small four-pointed star spark: a tiny sharp twinkle with a soft halo.",
  ember:
    "a small glowing ember: a tiny floating fleck of burning ash with a soft glow.",
  "frost-shard":
    "a single sharp ice shard: a slim faceted crystal splinter of clear pale-blue ice with white highlights.",
  "frost-mote":
    "a small frost mote: a tiny soft snowflake-like speck of frost in pale blue and white.",
  bubble:
    "a single poison bubble: a round glossy toxic bubble with one highlight and a darker rim.",
  drip: "a single drop of blood: a teardrop-shaped drip of dark red blood with a small glossy highlight.",
  dust: "a small puff of dust: a soft round cloud of earth-brown dust, denser at the bottom, with wispy edges.",
  heal: "a soft heal mote: a small plus-shaped cross of soft light with rounded arms and a gentle glow.",
  trail:
    "a soft horizontal streak of light: a long thin comet tail, brightest and widest at its right end and fading to nothing at its left end, with soft edges.",
  "icon-burn": "a flame.",
  "icon-freeze": "a snowflake.",
  "icon-poison": "a drop of poison with two small bubbles.",
  "icon-entangle": "a curled vine with two leaves.",
  "icon-hobble": "a shackle: an open iron ankle cuff with one chain link.",
  "icon-bleed":
    "a blood drop in front of a broken heal cross: a pale plus sign that is cracked in two.",
};

const colorRule = (name: FxSlotName): string => {
  const slot = FX_SLOTS[name];
  return slot.tint === "code"
    ? "Color: only white and light grey tones, with no color, so that the game can tint it."
    : `Color: ${slot.anchor} as the middle tone of the element, with lighter highlights and darker shades of the same hue.`;
};

/** The message for one slot, after the setup message. */
export const promptOf = (name: FxSlotName): string =>
  [
    `Image: ${SUBJECT[name]}`,
    name.startsWith("icon-") ? ICON_STYLE : "",
    colorRule(name),
    BACKGROUND_RULE[backgroundOf(name)],
    "Keep the style and the rules of this conversation: one centered element with wide empty margins, no text.",
  ]
    .filter(Boolean)
    .join("\n\n");
