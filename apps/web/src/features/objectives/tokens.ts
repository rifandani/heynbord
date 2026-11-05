/**
 * The Objectives palette (DESIGN.md, "The Token Guard Rule"): the card, the
 * Reward Tray, the Activity gauge and the wax seal of the Objectives dialog.
 * The shared materials stay in `globals.css`.
 */

/** The grey tint of a Claimed card: it goes flat on the paper. */
export const OBJECTIVES_CLAIMED_TINT =
  "color-mix(in srgb,var(--color-stone) 22%,var(--color-parchment))";

/** The cool tint of a Feat card. */
export const OBJECTIVES_SILVER_TINT =
  "color-mix(in srgb,var(--color-pewter) 10%,var(--color-parchment-deep))";

/** A letterpress light under the ink of a card title. */
export const OBJECTIVES_TITLE_LIFT = "0 1px 0 rgba(255,250,235,0.8)";

/** The drop under cream text on a dark card or on the Activity plaque. */
export const OBJECTIVES_TEXT_DROP = "0 1px 2px rgba(0,0,0,0.65)";

/** The dark round plate of a goal icon, as the seal of a Hint. */
export const OBJECTIVES_MEDALLION_FACE =
  "radial-gradient(circle at 35% 30%,var(--color-plate-ember),var(--color-night-plate) 78%)";
export const OBJECTIVES_MEDALLION_SHADOW =
  "0 2px 3px rgba(42,26,12,0.45), inset 0 1px 0 rgba(255,240,200,0.2)";

/** The carved edges of the wood frame of a Reward Tray. */
export const OBJECTIVES_TRAY_CARVE =
  "inset 0 1px 0 rgba(255,236,190,0.35), inset 0 -1px 0 rgba(0,0,0,0.4), 0 2px 2px rgba(42,26,12,0.4)";

/** The velvet well in a Reward Tray. */
export const OBJECTIVES_TRAY_WELL = "inset 0 1px 3px rgba(0,0,0,0.8)";

/** The emerald of all row progress, so gold stays the color of an action. */
export const OBJECTIVES_EMERALD_FILL =
  "linear-gradient(180deg,#8ff5c3 0%,#32cc84 42%,#149a5b 100%)";
export const OBJECTIVES_EMERALD_GLOW = "0 0 7px rgba(70,225,150,0.6)";

/** The wax of the Claimed stamp, in the emerald of a finished bar. */
export const OBJECTIVES_WAX = {
  face: "#1c8a56",
  edge: "#0f5c38",
  light: "rgba(255,255,255,0.32)",
} as const;
export const OBJECTIVES_WAX_SHADOW =
  "drop-shadow(0 1px 1px rgba(42,26,12,0.5))";

/** The wood of the Activity plaque, with a lit top edge. */
export const OBJECTIVES_PLAQUE_FACE =
  "linear-gradient(180deg,var(--color-tray-light),var(--color-tray) 70%)";
export const OBJECTIVES_PLAQUE_SHADOW =
  "inset 0 1px 0 rgba(255,236,190,0.28), 0 3px 0 rgba(42,26,12,0.55), 0 8px 16px rgba(42,26,12,0.3)";

/** The liquid amber of the Activity gauge. */
export const OBJECTIVES_AMBER_FILL =
  "linear-gradient(180deg,#fff3b8 0%,#ffd75a 24%,#f2a51f 62%,#b8690c 100%)";

/** The light that travels along the amber. */
export const OBJECTIVES_AMBER_SHEEN =
  "linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)";

/** The groove of the Activity gauge. */
export const OBJECTIVES_GAUGE_SHADOW =
  "inset 0 3px 5px rgba(0,0,0,0.75), 0 1px 0 rgba(255,236,190,0.25)";

/** The golden light behind a reached checkpoint. */
export const OBJECTIVES_CHEST_AURA =
  "radial-gradient(circle,rgba(255,224,120,0.95) 0%,rgba(255,190,70,0.5) 42%,transparent 70%)";

/** The drop of a chest above the gauge. */
export const OBJECTIVES_CHEST_DROP = "drop-shadow(0 3px 2px rgba(0,0,0,0.55))";

/**
 * The guild ledger: the third book of the game box, after the leather Deck
 * book and the cloth Handbook. Its green leather echoes the emerald of a
 * finished goal.
 */
export const OBJECTIVES_LEDGER = {
  edge: "#0d2a20",
  hinge: "rgba(13,42,32,0.7)",
} as const;

/** The exact CSS values of the ledger: gradients and shadows. */
export const OBJECTIVES_LEDGER_CSS = {
  leather: "linear-gradient(180deg,#245644 0%,#1c4636 55%,#143428 100%)",
  hingeLight: "1px 0 0 rgba(190,240,215,0.14)",
  coverWell: "inset 0 2px 6px rgba(0,0,0,0.35)",
  iconDrop: "drop-shadow(0 2px 0 rgba(0,0,0,0.45))",
  pageStack: "0 2px 0 #e6d6b0, 0 4px 0 #cfba8f, 0 5px 0 #8a6a40",
  spine:
    "linear-gradient(90deg, rgba(91,58,30,0) 0%, rgba(91,58,30,0.1) 35%, rgba(91,58,30,0.34) 50%, rgba(91,58,30,0.1) 65%, rgba(91,58,30,0) 100%)",
  coverShadow:
    "linear-gradient(90deg, rgba(6,24,18,0.7), rgba(6,24,18,0.35) 55%, rgba(6,24,18,0.15))",
  coverLift: "0 24px 48px rgba(0,0,0,0.55)",
  coverPage:
    "linear-gradient(90deg, rgba(91,58,30,0) calc(100% - 40px), rgba(91,58,30,0.1) calc(100% - 26px), rgba(91,58,30,0.34) 100%)",
} as const;
