import type { CSSProperties } from "react";

/** A set of CSS custom properties for a piece, passed to the `style` prop. */
export const cssVars = (
  properties: Readonly<Record<`--${string}`, string>>
): CSSProperties =>
  // SAFETY: React writes a custom property in `style` through to the element.
  properties as CSSProperties;

/**
 * The painted tower palette (11 — Town Concepts 14). The tower art has its own
 * stone, slate and glass colors; they live here so that the components stay on
 * the token rule. The shared materials keep their `--color-*` values.
 */
export const HEYNSPIRE_COLORS = {
  outline: "#2a1a0c",
  flagGold: "#ffd75a",
  flagGrey: "#8d9297",
  goldTrim: "#e7bb6a",
  goldLight: "#ffe08a",
  gold: "#e2a93b",
  pole: "#b8bcc0",
  roofLit: "#5f80cf",
  roofShade: "#2a4590",
  roofLine: "#1c2f66",
  roofHighlight: "#a9c1f2",
  stoneLight: "#fbf3e1",
  stoneMid: "#e3d4b3",
  stoneDark: "#b9a47c",
  stoneEdge: "#8a7552",
  slitEdge: "#d9c9a6",
  slitTop: "#28303b",
  slitBottom: "#3c4654",
  bannerLit: "#a52a22",
  corniceDeep: "#d8c7a3",
  corbelLit: "#cdb991",
  corbelDeep: "#b29d76",
  frameLit: "#f7efdc",
  frameDeep: "#cbb893",
  keystoneDeep: "#c7b28a",
  doorLight: "#fff6d0",
  doorWonTop: "#3b3631",
  doorWonBottom: "#26221e",
  spineLit: "#f0d08c",
  spineDeep: "#a3722f",
  chipLocked: "#5d6166",
  chipLockedLine: "#a9aeb3",
  mask: "#000",
  white: "#ffffff",
} as const;

/** The exact gradients, masks and shadows of the tower. */
export const HEYNSPIRE_CSS = {
  scene:
    "linear-gradient(90deg, rgba(225,238,248,0.38) 0%, rgba(225,238,248,0.12) 48%, transparent 62%)",
  sceneFoot:
    "linear-gradient(180deg, transparent 72%, rgba(18,12,8,0.42) 100%)",
  baseStone:
    "linear-gradient(90deg, rgba(255,250,235,0.3), transparent 45%, rgba(60,40,22,0.35))",
  cloud:
    "radial-gradient(ellipse 50% 70% at 50% 100%, #ffffff 0%, rgba(255,255,255,0.92) 45%, rgba(255,255,255,0) 100%)",
  stoneDrop: "0 3px 5px rgba(60,40,20,0.35)",
  spineLit: "linear-gradient(to right, #f0d08c, #a3722f)",
  railInset: "inset 0 1px 3px rgba(0,0,0,0.6)",
  markGlow: "0 0 8px rgba(255,215,90,0.9)",
  plateDrop: "0 2px 0 rgba(0,0,0,0.45)",
  panelLift: "0 24px 48px rgba(0,0,0,0.45)",
  round:
    "linear-gradient(90deg, rgba(255,250,235,0.32) 0%, rgba(255,250,235,0.06) 30%, transparent 55%, rgba(74,52,30,0.18) 78%, rgba(60,40,22,0.42) 100%)",
  crenels:
    "linear-gradient(#000 0 0) bottom / 100% 55% no-repeat, repeating-linear-gradient(90deg, #000 0 11%, transparent 11% 16.5%) top left / 100% 45% no-repeat",
  corbels: "repeating-linear-gradient(90deg, #000 0 5%, transparent 5% 10%)",
  slit: "inset 1px 2px 3px rgba(0,0,0,0.6)",
  bannerLit: "linear-gradient(to bottom, #a52a22, #6b1610)",
  bannerDrop: "drop-shadow(0 2px 2px rgba(42,26,12,0.45))",
  sealDrop: "drop-shadow(0 2px 2px rgba(42,26,12,0.55))",
  cornice: "linear-gradient(to bottom, #fbf3e1, #d8c7a3)",
  corbelFace: "linear-gradient(to bottom, #cdb991, #b29d76)",
  doorGlow:
    "radial-gradient(closest-side, rgba(255,215,90,0.9), rgba(255,215,90,0))",
  doorInset: "inset 0 3px 6px rgba(0,0,0,0.35)",
  doorFocus: "0 0 0 3px #1c140e, 0 0 0 7px #fff2a8",
  keystone: "linear-gradient(to bottom, #fbf3e1, #c7b28a)",
  ribbonGlow: "drop-shadow(0 0 10px rgba(255,224,138,0.85))",
  ribbonDrop: "drop-shadow(0 3px 0 rgba(0,0,0,0.45))",
  ribbonStroke: "rgba(233,196,106,0.7)",
  iconDrop: "drop-shadow(0 2px 0 rgba(0,0,0,0.45))",
  textDrop: "drop-shadow(0 1px 0 rgba(0,0,0,0.55))",
  wonFill: "rgba(28,20,14,0.9)",
  lockedFill: "rgba(28,20,14,0.78)",
  flagDrop: "drop-shadow(0 2px 1px rgba(42,26,12,0.35))",
  climbFade:
    "linear-gradient(180deg,transparent 0,#000 7%,#000 93%,transparent 100%)",
} as const;

/** The face of the door of a storey, in the paint of its Floor state. */
export const HEYNSPIRE_DOOR: Readonly<
  Record<
    "current" | "won" | "locked",
    { readonly tone: string; readonly style: CSSProperties }
  >
> = {
  current: {
    tone: "text-ink-on-gold",
    style: {
      backgroundImage:
        "radial-gradient(ellipse at 50% 38%, #fff6d0 0%, #ffe08a 42%, #e2a93b 100%)",
    },
  },
  won: {
    tone: "text-cream",
    style: {
      backgroundImage:
        "linear-gradient(90deg,transparent 0 32%,rgba(0,0,0,0.14) 32% 33.5%,transparent 33.5% 66%,rgba(0,0,0,0.14) 66% 67.5%,transparent 67.5%),linear-gradient(180deg,#6b4423,#4a2d16)",
    },
  },
  locked: {
    tone: "text-cream-dim",
    style: {
      backgroundImage:
        "linear-gradient(180deg,transparent 0 34%,rgba(141,146,151,0.45) 34% 37%,transparent 37% 74%,rgba(141,146,151,0.45) 74% 77%,transparent 77%),linear-gradient(180deg,#3b3631,#26221e)",
    },
  },
};

/** The lock seal of a locked state chip: a neutral that has no material token. */
export const HEYNSPIRE_LOCK_CHIP: CSSProperties = {
  backgroundColor: "#5d6166",
  boxShadow: "inset 0 0 0 1px #a9aeb3",
};

/** The paint of the status ribbon of each Floor state. */
export const HEYNSPIRE_RIBBON: Readonly<
  Record<
    "won" | "current" | "locked",
    { readonly fill: string; readonly tone: string }
  >
> = {
  won: { fill: "rgba(28,20,14,0.9)", tone: "text-cream" },
  current: { fill: "gold", tone: "text-ink-on-gold" },
  locked: { fill: "rgba(28,20,14,0.78)", tone: "text-cream-dim" },
};
