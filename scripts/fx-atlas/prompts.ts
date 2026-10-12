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
  "icon-ward":
    "a rounded heater shield made of gold light, with a small sun mark at its center. It is light, not metal: no rivets, no rim and no steel. It is not round and not a kite shield.",
  "icon-steadfast":
    "an anchor of warm gold light: a simple anchor with a ring at the top, a crossbar and two curved arms. It is light, not iron: no chain, no rope and no rust.",
  "icon-exposed":
    "a broken heater shield of rose-red metal: a zigzag crack splits it into two halves with a small gap between them. No sword, no blood and no figure.",
  "icon-paralyze":
    "a jagged lightning bolt with three sharp zigzags, and two tiny sparks next to it. It is not a sword and not an arrow.",
  ward: "a protective dome of gold holy light, seen from the front: a clear half-sphere with a bright rim and a faint glow inside, standing on a thin bright ring at its base. Light only: no steel, no shield shape and no figure inside.",
  steadfast:
    "a round holy seal of warm gold light, seen straight from above: one thick bright ring, with twelve short, even sun rays that point out from its outer edge, and a thin second ring inside it. The center is empty. Light only: no runes, no letters, no anchor, no metal and no figure.",
  "field-fire":
    "a square patch of burning ground, seen straight from above, as a flat decal: black scorched grass with glowing orange cracks, small low tongues of fire and a few bright embers. This is the only image with ground: the patch is the element. It is a soft square with rounded corners and a ragged, burnt edge that fades out, and it fills about 85% of the frame. Flat and even: no perspective, no horizon, no single big flame and no smoke column.",
  "field-snow":
    "a square patch of fresh snow, seen straight from above, as a flat decal: soft white snow drifts with a thin crust of pale-blue ice, small frost crystals and a few blue shadows in the dips. This is the only image with ground: the patch is the element. It is a soft square with rounded corners and a ragged edge that fades out, and it fills about 85% of the frame. Flat and even: no perspective, no horizon, no footprints and no snowman.",
  bolt: "one jagged bolt of lightning that strikes from the top of the frame to the bottom: a bright, sharp zigzag core with one short fork to the side and a soft glow around it. Vertical, thin and tall, with empty space at its left and right.",
};

/**
 * The color of a ground image (#66). Its anchor is the color of the fire or
 * of the ice in it, not of the full patch.
 */
const GROUND_COLOR: Partial<Readonly<Record<FxSlotName, string>>> = {
  "field-fire": `Color: dark charcoal and black scorched ground, with ${FX_SLOTS["field-fire"].anchor} as the middle tone of the fire and of the glowing cracks.`,
  "field-snow": `Color: mostly clean white snow, with ${FX_SLOTS["field-snow"].anchor} only in the ice crust, the crystals and the shadows.`,
};

const colorRule = (name: FxSlotName): string => {
  const slot = FX_SLOTS[name];
  const ground = GROUND_COLOR[name];
  if (ground) {
    return ground;
  }
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
