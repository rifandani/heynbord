/**
 * The Battle palette (DESIGN.md, "The Token Guard Rule").
 *
 * A raw color of the Battle lives here: the painted art of the Card Frame and
 * the Card Back, the 3D materials and lights of the Board, and the effect
 * colors that the scene tints. The HUD uses the Tailwind token utilities, so
 * this file holds a color value and no class name.
 *
 * The shape follows `core/components/game/tokens.ts`: one named export for one
 * purpose, with the reason in the comment.
 */

// ------------------------------------------------------------ The card metal

/** The frame metal of a card and the Card Back: the diagonal bronze ramp. */
export const CARD_METAL =
  "linear-gradient(155deg, #f7dc9c 0%, #c99442 22%, #8a5a20 55%, #b47f36 80%, #e9c27a 100%)";

/** The metal of the Countdown caps: the same ramp, in SVG stops. */
export const CARD_METAL_RAMP = [
  ["0%", "#fff0c2"],
  ["18%", "#e9c27a"],
  ["45%", "#c99442"],
  ["70%", "#8a5a20"],
  ["88%", "#b47f36"],
  ["100%", "#f2d595"],
] as const;

/** The emblem of a Skill Card: one parchment for all Classes. */
export const CARD_EMBLEM = { main: "#f3e6c4", ink: "#3a2612" } as const;

/** The dark Well behind card art while it loads. */
export const CARD_ART_WELL = "#1f140b";

/** The backdrop of a Skill Card that has no art: the parchment on a dark brown. */
export const SKILL_CARD_BACKDROP = {
  light: "#7a5a3a",
  dark: "#2a1d12",
} as const;

/**
 * The Countdown hourglass (card frame): a cool blue glass when the card is
 * counting down, and the gold of a Ready card. Each pair is a stop offset and
 * its color.
 */
export const COUNTDOWN_BODY = {
  ready: [
    ["0", "#fff7cd"],
    ["0.22", "#ffe287"],
    ["0.5", "#f2b93a"],
    ["0.78", "#b8750f"],
    ["1", "#8a5a20"],
  ],
  glass: [
    ["0", "#b6f0ff"],
    ["0.2", "#5fbdf2"],
    ["0.48", "#2a74cc"],
    ["0.74", "#16428f"],
    ["0.9", "#1d5cb8"],
    ["1", "#63c7f2"],
  ],
} as const;

/** The sheen in the bulbs of the hourglass. */
export const COUNTDOWN_SHEEN = { light: "#ffffff", tint: "#dff7ff" } as const;

/** The shadow in the lower part of the hourglass. */
export const COUNTDOWN_DEPTH = "#04122e";

/** The sand of the hourglass: gold when the card is Ready. */
export const COUNTDOWN_SAND = {
  ready: [
    ["0", "#ffe9a8"],
    ["1", "#d99a1c"],
  ],
  glass: [
    ["0", "#fff3c4"],
    ["0.55", "#ffd75a"],
    ["1", "#d99a1c"],
  ],
  top: [
    ["0", "#ffeeb0"],
    ["1", "#efb648"],
  ],
} as const;

/** The ink of the hourglass waist, and the pale light on its walls. */
export const COUNTDOWN_INK = "#081a3f";
export const COUNTDOWN_LIGHT = "#cdefff";

/** The rivet of the hourglass caps. */
export const COUNTDOWN_RIVET = "#5b3d16";

/** The pale light on the hourglass caps. */
export const COUNTDOWN_CAP_LIGHT = "#fff4d2";

/** The pale sand light on the Ready glass. */
export const COUNTDOWN_READY_LIGHT = "#ffe9a8";

/** The HP heart (card frame): the red body, its sheen, its depth and its edge. */
export const HEART_BODY = [
  ["0", "#ff8a6e"],
  ["0.24", "#f04d38"],
  ["0.55", "#cf2a20"],
  ["0.82", "#a31514"],
  ["1", "#7c0e10"],
] as const;

export const HEART_SHEEN = {
  light: "#ffe3cf",
  tint: "#ffb391",
  edge: "#ff8f6e",
} as const;

export const HEART_DEPTH = "#3d0505";
export const HEART_EDGE = {
  light: "#ffe6c8",
  tint: "#ffc7a2",
  edge: "#ffb28c",
} as const;

/** The dark edge of the heart, and the cool gloss on its top. */
export const HEART_OUTLINE = "#3a0a08";
export const HEART_GLOSS = "#ffd9c2";

/** The steel of the Attack sword: a cool ramp, so the sword reads as iron. */
export const SWORD_STEEL = [
  ["0%", "#ffffff"],
  ["18%", "#e9eff4"],
  ["45%", "#c3ccd5"],
  ["70%", "#8b96a2"],
  ["88%", "#b6c0ca"],
  ["100%", "#f5f8fb"],
] as const;

/** The darker steel of the guard, the pommel and the collar. */
export const SWORD_STEEL_DARK = [
  ["0%", "#f4f8fb"],
  ["35%", "#bcc6cf"],
  ["70%", "#7d8893"],
  ["100%", "#d2dae1"],
] as const;

/** The leather of the grip. */
export const SWORD_LEATHER = [
  "#2a1608",
  "#5a3517",
  "#6b4320",
  "#241206",
] as const;

/** The fuller of the blade, and the thread of the grip. */
export const SWORD_FULLER = "#4b555f";
export const SWORD_THREAD = "#c9a46a";

/** The gold of the Heynbord emblem: the logo ramp and its ink edge. */
export const EMBLEM_GOLD = ["#fff0b8", "#e3b55a", "#9a6421"] as const;
export const EMBLEM_EDGE = "#3a2208";

/** The white of a painted highlight: the sword fuller and the glass light. */
export const ART_WHITE = "#ffffff";

/** The Standard Card Back: dark leather with a fine diamond tooling. */
export const CARD_BACK_LEATHER = [
  "radial-gradient(ellipse at 50% 42%, rgba(120,62,28,0.85) 0%, transparent 62%)",
  "repeating-linear-gradient(45deg, rgba(231,187,106,0.09) 0 0.08em, transparent 0.08em 1.1em)",
  "repeating-linear-gradient(-45deg, rgba(231,187,106,0.09) 0 0.08em, transparent 0.08em 1.1em)",
  "linear-gradient(180deg, #3a2014, #1b0e08)",
].join(", ");

/** The faded edge and fill of an empty card place. */
export const EMPTY_CARD_EDGE_FADE = "rgba(122, 85, 48, 0.7)";
export const CARD_ART_WELL_FADE = "rgba(31, 20, 11, 0.75)";

/** The warm parchment rule of a divider inside the Card Details. */
export const PARCHMENT_RULE_WARM = "#c9a46a";

// ------------------------------------------------------------ The HUD art

/**
 * The dark round plate under an emblem or a Badge: a night plate with a warm
 * ember at the upper left. A Tailwind class cannot hold it without a raw color.
 */
export const DARK_PLATE =
  "radial-gradient(circle at 35% 30%, #4a3524, #1c140e 70%)";

/** The Damage Type glyph on a parchment panel: a dark bronze ink. */
export const DAMAGE_GLYPH_INK = "#7a4c1a";

/** The heart glyph of the damage total in the Battle Log. */
export const LOG_DAMAGE_INK = "#c2302a";

/** The Night Plate of a Boss Countdown that is Ready: a dark blood red. */
export const BOSS_CHIP_READY = "#5b1f1a";

/** The gold of a target marker, and the cream of the focused one. */
export const TARGET_MARKER = "#ffd24a";

// ------------------------------------------------------- The Battle painting

/** The meadow under the Battle Painting, while the image loads. */
export const BATTLE_MEADOW_LAYERS = [
  "radial-gradient(ellipse 55% 45% at 36% 38%, rgba(255, 233, 160, 0.32), transparent 70%)",
  "linear-gradient(to bottom, rgba(18, 38, 14, 0.6), transparent 24%, transparent 72%, rgba(18, 38, 14, 0.55))",
  "radial-gradient(ellipse 80% 70% at 50% 48%, #86bd55 0%, #679f40 42%, #44772c 72%, #24451b 100%)",
] as const;

// ------------------------------------------------------------ The XP bar

/** The XP fill of the result: a teal light at the top, a deep teal at the bottom. */
export const XP_BAR_FILL = "linear-gradient(to bottom, #7fe0f0, #0e8aa6)";

// ------------------------------------------------------------ The Hand Bar

/** The near-black edge of the Hand Bar. */
export const TRAY_EDGE = "#2a170a";

/** The pale metal of the Graveyard glyph on the tray. */
export const TRAY_GLYPH = "#e3b55a";

/** The wood tray of the Hand Bar. */
export const HAND_BAR_TRAY =
  "linear-gradient(180deg, #6b4423 0%, #4a2d16 45%, #2f1c0d 100%)";

/** The bronze rule between two parts of the Hand Bar. */
export const HAND_BAR_RULE =
  "linear-gradient(180deg, transparent, rgba(231,187,106,0.55) 20%, rgba(231,187,106,0.55) 80%, transparent)";

/** The grain of the Hand Bar tray: one dark line each 1.1em. */
export const HAND_BAR_GRAIN =
  "repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 0.15em, transparent 0.15em 1.1em)";

/** The halo of a Tutorial mark: the tutorial glow at 75%. */
export const TUTORIAL_HALO = "0 0 24px rgba(127,227,255,0.75)";

/** The wood tray shadow of the Hand Bar. */
export const HAND_BAR_SHADOW =
  "inset 0 0.15em 0 rgba(255,214,150,0.3), inset 0 -0.3em 0.6em rgba(0,0,0,0.45), 0 0.6em 1.6em rgba(0,0,0,0.55)";

/**
 * The shadows that a Tailwind token does not cover. Each is the exact value of
 * the piece that it belongs to, kept here so that the component writes no
 * color.
 */
export const SHADOW_LANE_HELD = "inset 0 1px 0 rgba(255,255,255,0.35)";
export const SHADOW_NOTCH = "0 0 0 1px rgba(28,20,14,0.85)";
export const SHADOW_LOG_ENTRY = "0 0 0 3px rgba(226,169,59,0.25)";
export const SHADOW_LOG_PANEL =
  "0 3px 0 rgba(0,0,0,0.35), 0 14px 32px rgba(0,0,0,0.45)";
export const SHADOW_LOG_BANNER = "0 3px 0 rgba(0,0,0,0.35)";
export const SHADOW_RESULT_WELL =
  "inset 0 2px 6px rgba(60,30,5,0.2), 0 1px 0 rgba(255,243,209,0.8)";
export const SHADOW_STAMP = "0 2px 0 rgba(0,0,0,0.45)";
export const SHADOW_STAMP_SOFT = "0 2px 0 rgba(0,0,0,0.35)";
export const SHADOW_XP_TRACK = "inset 0 2px 3px rgba(0,0,0,0.6)";
export const SHADOW_ART_WELL = "inset 0 0.35em 0.8em rgba(0,0,0,0.7)";
export const SHADOW_PILE = "0 0.12em 0.3em rgba(0,0,0,0.7)";

/** The drop shadows that a Tailwind token does not cover. */
export const DROP_COUNTDOWN = "drop-shadow(0 0.12em 0.26em rgba(0,0,0,0.62))";
export const DROP_HEART = "drop-shadow(0 0.1em 0.14em rgba(0,0,0,0.55))";
export const DROP_ART_GLYPH = "drop-shadow(0 0.12em 0.2em rgba(0,0,0,0.45))";
export const DROP_ATTACK = "drop-shadow(0 0.14em 0.28em rgba(0,0,0,0.65))";
export const DROP_EMBLEM = "drop-shadow(0 0.15em 0.2em rgba(0,0,0,0.7))";
export const DROP_SEAL = "drop-shadow(0 2px 0 rgba(122,83,16,0.6))";
export const DROP_ICON_1 = "drop-shadow(0 1px 0 rgba(0,0,0,0.5))";
export const DROP_ICON_1_SOFT = "drop-shadow(0 1px 0 rgba(0,0,0,0.4))";
export const DROP_LIFT = "drop-shadow(0 10px 24px rgba(0,0,0,0.55))";

/** The ink edge of a Status glyph on the atlas. */
export const DROP_STATUS_EDGE = "drop-shadow(0 0 1px #2a1d12)";

// ------------------------------------------------------ The Status and effects

/**
 * The tint of each Status. Frozen and Burning always tint the Unit. With
 * reduced motion, each loop Status gives a static tint in place of its
 * particles.
 */
export const STATUS_TINT = {
  freeze: "#a9dcff",
  paralyze: "#b5fbf3",
  burn: "#ffb070",
  poison: "#b6e05a",
  entangle: "#7fcf6a",
  bleed: "#e0605a",
  hobble: "#b8bec6",
  ward: "#ffe7a3",
  steadfast: "#f7cf86",
  exposed: "#ffa3c2",
  grounded: "#e8bd8c",
} as const;

/** The hit flash of a Unit and a Hero. */
export const HIT_TINT = "#ff5a4a";

/** The green of a heal, and the pale spirit light of a Rebirth. */
export const HEAL_TINT = "#9dffb4";
export const REBORN_TINT = "#c4fbef";

/** The war gold of a Rally bonus, and the ring that a Cleanse leaves. */
export const RALLY_TINT = "#ffd75a";
export const CLEANSE_RING = "#fff6df";

/** The ring of a summoned Unit: the player gold, or the enemy red. */
export const SUMMON_RING = { player: "#ffd56b", enemy: "#ff7a6b" } as const;

/** Bulwark is a frost blue, not a Damage Type of the rules. */
export const BULWARK_COLOR = "#9cc8ff";

// ------------------------------------------------------------ The 3D scene

/** The ink outline of a Unit Model: the dark brown of the card art lines. */
export const SCENE_INK = "#24170f";

/** The white of a scene material: the light, and the fixed particle color. */
export const SCENE_WHITE = "#ffffff";

/** The ring of the inspected Unit, of the fallen Unit and of the Battle Log. */
export const FOCUS_RING = { halo: "#fff2a8", edge: "#1c140e" } as const;
export const FALLEN_RING = { halo: "#fff2a8", edge: "#2a1d12" } as const;
export const LOG_RING = { halo: "#fff3d1", edge: "#2a1d12" } as const;

/** The Marching tutorial marks: the Tutorial color, and the red of a Block. */
export const TUTORIAL_COLOR = "#7fe3ff";
export const BLOCK_COLOR = "#ff5a3c";

/** The light of the Battle scene: sky, ground, key light and fill light. */
export const SCENE_LIGHT = {
  sky: "#fff3dc",
  ground: "#55703f",
  key: "#fff1d6",
  fill: "#b9d4ff",
} as const;

/** The white of the FX atlas, and the cool white of its frost and shield. */
export const FX_WHITE = "#ffffff";
export const FX_FROST_WHITE = "#e9eef2";
export const FX_SHIELD_STEEL = "#d7dde5";

/** The top of the flame: the hot light before the Damage Type gold. */
export const FX_FLAME_TOP = "#fff1b0";

/** The last stop of the flame gradient: fire with no alpha. */
export const FX_FLAME_END = "rgba(255, 70, 20, 0)";

// ------------------------------------------------------------ The textures

/** The ink outline of a painted texture. */
export const TEXTURE_INK = "rgba(20, 14, 10, 0.85)";
export const TEXTURE_INK_LIGHT = "rgba(20, 14, 10, 0.7)";
export const TEXTURE_INK_DEEP = "rgba(15, 10, 8, 0.92)";
export const TEXTURE_INK_DEEPER = "rgba(15, 10, 8, 0.9)";
export const TEXTURE_INK_FILL = "rgba(20, 14, 10, 0.82)";
export const TEXTURE_INK_SHADOW = "rgba(18, 12, 6, 0.55)";
export const TEXTURE_INK_SHADE = "rgba(18, 12, 6, 0.35)";

/** The cream of a painted glyph, and its faint rim on a dark plate. */
export const TEXTURE_CREAM = "#fff6df";
export const TEXTURE_CREAM_DIM = "rgba(255, 246, 223, 0.35)";

/** The gold rule of a standee. */
export const TEXTURE_RIM = "#e9c46a";

/** The drop shadow under a standee: its alpha, and the fade to nothing. */
export const TEXTURE_DROP = "rgba(0, 0, 0, 0.55)";
export const TEXTURE_DROP_END = "rgba(0, 0, 0, 0)";

/** The inner highlight of a rounded standee. */
export const TEXTURE_HIGHLIGHT = "rgba(255, 255, 255, 0.35)";
export const TEXTURE_HIGHLIGHT_STRONG = "rgba(255, 255, 255, 0.75)";

/** The white light of the rune ring, the heal and the bolt. */
export const TEXTURE_GLOW = "rgba(255, 255, 255, 1)";
export const TEXTURE_GLOW_SOFT = "rgba(255, 255, 255, 0.8)";
export const TEXTURE_GLOW_END = "rgba(255, 255, 255, 0)";

/** The channels of the glow white, for a light with its own alpha. */
const TEXTURE_GLOW_RGB = "255, 255, 255";

/** A white glow with its own alpha, for the rune ring. */
export const textureGlow = (alpha: number): string =>
  `rgba(${TEXTURE_GLOW_RGB}, ${alpha})`;

/** The dark band of the Lane, and its fade at the two ends. */
export const TEXTURE_BAND = "rgba(28, 20, 14, 0.38)";
export const TEXTURE_BAND_END = "rgba(28, 20, 14, 0)";

/** The black mask of a ground patch. */
export const TEXTURE_MASK = "rgba(0, 0, 0, 1)";

/** The pale fill of the heal cross, and the light of the Steadfast seal. */
export const TEXTURE_PALE = "rgba(255, 255, 240, 0.8)";
export const TEXTURE_HOLY_FILL = "rgba(255, 215, 90, 0.08)";
export const TEXTURE_HOLY_FILL_EDGE = "rgba(255, 215, 90, 0.45)";

/** The ground patches of a Field Effect: fire ash, and snow. */
export const TEXTURE_FIRE_ASH = "rgba(40, 22, 14, 0.85)";
export const TEXTURE_SNOW = "rgba(240, 248, 255, 0.9)";

/** The dark plate of a keyword plate, and its cream label. */
export const TEXTURE_PLATE = "rgba(28, 20, 14, 0.92)";
export const TEXTURE_PLATE_SHADE = "rgba(0, 0, 0, 0.45)";
