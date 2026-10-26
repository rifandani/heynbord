import { cn } from "cn";
import { useLayoutEffect, useRef, useState } from "react";

import { gameText } from "@/core/components/game/surfaces";

import { Variant, VariantGrid } from "../variant";

interface Token {
  readonly name: string;
  /** Tailwind background utility from `@theme` in globals.css. */
  readonly bg: string;
  /** The material token that a semantic alias points to. */
  readonly source?: string;
}

interface TokenGroup {
  readonly label: string;
  readonly tokens: readonly Token[];
}

/**
 * The one Foundation of the Heynbord Design System. The materials are the
 * source; the semantic aliases below point to them. A component names a token
 * and never writes a hex value.
 */
const MATERIALS: readonly TokenGroup[] = [
  {
    label: "Materials",
    tokens: [
      { name: "gold", bg: "bg-gold" },
      { name: "gold-light", bg: "bg-gold-light" },
      { name: "gold-deep", bg: "bg-gold-deep" },
      { name: "ready-gold", bg: "bg-ready-gold" },
      { name: "gold-trim", bg: "bg-gold-trim" },
      { name: "bronze", bg: "bg-bronze" },
      { name: "bronze-rim", bg: "bg-bronze-rim" },
      { name: "wood", bg: "bg-wood" },
      { name: "wood-light", bg: "bg-wood-light" },
      { name: "wood-edge", bg: "bg-wood-edge" },
      { name: "frame-wood", bg: "bg-frame-wood" },
      { name: "tray", bg: "bg-tray" },
      { name: "tray-light", bg: "bg-tray-light" },
    ],
  },
  {
    label: "Paper and ink",
    tokens: [
      { name: "parchment", bg: "bg-parchment" },
      { name: "parchment-deep", bg: "bg-parchment-deep" },
      { name: "parchment-lit", bg: "bg-parchment-lit" },
      { name: "parchment-rule", bg: "bg-parchment-rule" },
      { name: "ink", bg: "bg-ink" },
      { name: "ink-soft", bg: "bg-ink-soft" },
      { name: "ink-faded", bg: "bg-ink-faded" },
      { name: "ink-on-gold", bg: "bg-ink-on-gold" },
    ],
  },
  {
    label: "Night Plate and cream",
    tokens: [
      { name: "night-plate", bg: "bg-night-plate" },
      { name: "plate-ember", bg: "bg-plate-ember" },
      { name: "plate-socket", bg: "bg-plate-socket" },
      { name: "cream", bg: "bg-cream" },
      { name: "cream-dim", bg: "bg-cream-dim" },
      { name: "focus-cream", bg: "bg-focus-cream" },
    ],
  },
  {
    label: "States",
    tokens: [
      { name: "enemy-red", bg: "bg-enemy-red" },
      { name: "enemy-deep", bg: "bg-enemy-deep" },
      { name: "blood-banner", bg: "bg-blood-banner" },
      { name: "keyword-rust", bg: "bg-keyword-rust" },
      { name: "victory-amber", bg: "bg-victory-amber" },
      { name: "tutorial-teal", bg: "bg-tutorial-teal" },
      { name: "tutorial-glow", bg: "bg-tutorial-glow" },
      { name: "hp-full", bg: "bg-hp-full" },
      { name: "hp-low", bg: "bg-hp-low" },
      { name: "heart-red", bg: "bg-heart-red" },
    ],
  },
  {
    label: "Ranks",
    tokens: [
      { name: "rank-common", bg: "bg-rank-common" },
      { name: "rank-uncommon", bg: "bg-rank-uncommon" },
      { name: "rank-rare", bg: "bg-rank-rare" },
      { name: "rank-epic", bg: "bg-rank-epic" },
      { name: "rank-legendary", bg: "bg-rank-legendary" },
    ],
  },
  {
    label: "Damage Types",
    tokens: [
      { name: "damage-physical", bg: "bg-damage-physical" },
      { name: "damage-fire", bg: "bg-damage-fire" },
      { name: "damage-frost", bg: "bg-damage-frost" },
      { name: "damage-holy", bg: "bg-damage-holy" },
    ],
  },
  {
    label: "Races",
    tokens: [
      { name: "human-blue", bg: "bg-human-blue" },
      { name: "elf-green", bg: "bg-elf-green" },
      { name: "undead-teal", bg: "bg-undead-teal" },
      { name: "orc-orange", bg: "bg-orc-orange" },
    ],
  },
];

const ALIASES: readonly TokenGroup[] = [
  {
    label: "Surface",
    tokens: [
      { name: "bg", bg: "bg-bg", source: "night-plate" },
      { name: "fg", bg: "bg-fg", source: "cream" },
      { name: "card", bg: "bg-card", source: "plate-socket" },
      { name: "card-fg", bg: "bg-card-fg", source: "cream" },
      {
        name: "muted",
        bg: "bg-muted",
        source: "night-plate + plate-ember",
      },
      { name: "muted-fg", bg: "bg-muted-fg", source: "cream-dim" },
      { name: "overlay", bg: "bg-overlay", source: "parchment" },
      { name: "overlay-fg", bg: "bg-overlay-fg", source: "ink" },
    ],
  },
  {
    label: "Brand",
    tokens: [
      { name: "primary", bg: "bg-primary", source: "gold" },
      { name: "primary-fg", bg: "bg-primary-fg", source: "ink-on-gold" },
      { name: "primary-subtle", bg: "bg-primary-subtle", source: "gold 18%" },
      {
        name: "primary-subtle-fg",
        bg: "bg-primary-subtle-fg",
        source: "gold-light",
      },
      { name: "secondary", bg: "bg-secondary", source: "wood" },
      { name: "secondary-fg", bg: "bg-secondary-fg", source: "cream" },
      { name: "accent", bg: "bg-accent", source: "plate-ember" },
      { name: "accent-fg", bg: "bg-accent-fg", source: "cream" },
    ],
  },
  {
    label: "Status",
    tokens: [
      { name: "success", bg: "bg-success", source: "hp-full" },
      { name: "success-fg", bg: "bg-success-fg", source: "ink-on-gold" },
      {
        name: "success-subtle",
        bg: "bg-success-subtle",
        source: "hp-full 18%",
      },
      {
        name: "success-subtle-fg",
        bg: "bg-success-subtle-fg",
        source: "hp-full",
      },
      { name: "danger", bg: "bg-danger", source: "enemy-deep" },
      { name: "danger-fg", bg: "bg-danger-fg", source: "cream" },
      {
        name: "danger-subtle",
        bg: "bg-danger-subtle",
        source: "enemy-red 18%",
      },
      {
        name: "danger-subtle-fg",
        bg: "bg-danger-subtle-fg",
        source: "heart-red",
      },
      { name: "warning", bg: "bg-warning", source: "victory-amber" },
      { name: "warning-fg", bg: "bg-warning-fg", source: "cream" },
      {
        name: "warning-subtle",
        bg: "bg-warning-subtle",
        source: "victory-amber 22%",
      },
      {
        name: "warning-subtle-fg",
        bg: "bg-warning-subtle-fg",
        source: "ready-gold",
      },
      {
        name: "info-subtle",
        bg: "bg-info-subtle",
        source: "tutorial-teal 22%",
      },
      {
        name: "info-subtle-fg",
        bg: "bg-info-subtle-fg",
        source: "tutorial-glow",
      },
    ],
  },
  {
    label: "Chrome",
    tokens: [
      { name: "border", bg: "bg-border", source: "plate-ember" },
      { name: "input", bg: "bg-input", source: "wood-light" },
      { name: "ring", bg: "bg-ring", source: "focus-cream" },
      { name: "navbar", bg: "bg-navbar", source: "night-plate" },
      { name: "navbar-fg", bg: "bg-navbar-fg", source: "cream" },
      { name: "sidebar", bg: "bg-sidebar", source: "night-plate" },
      { name: "sidebar-fg", bg: "bg-sidebar-fg", source: "cream" },
      { name: "sidebar-primary", bg: "bg-sidebar-primary", source: "gold" },
      {
        name: "sidebar-primary-fg",
        bg: "bg-sidebar-primary-fg",
        source: "ink-on-gold",
      },
      {
        name: "sidebar-accent",
        bg: "bg-sidebar-accent",
        source: "plate-ember",
      },
      {
        name: "sidebar-accent-fg",
        bg: "bg-sidebar-accent-fg",
        source: "cream",
      },
      {
        name: "sidebar-border",
        bg: "bg-sidebar-border",
        source: "plate-ember",
      },
      { name: "sidebar-ring", bg: "bg-sidebar-ring", source: "focus-cream" },
    ],
  },
  {
    label: "Charts",
    tokens: [
      { name: "chart-1", bg: "bg-chart-1", source: "gold" },
      { name: "chart-2", bg: "bg-chart-2", source: "tutorial-teal" },
      { name: "chart-3", bg: "bg-chart-3", source: "rank-rare" },
      { name: "chart-4", bg: "bg-chart-4", source: "rank-epic" },
      { name: "chart-5", bg: "bg-chart-5", source: "hp-full" },
    ],
  },
];

const SHADOWS: readonly {
  label: string;
  className: string;
  surface: string;
}[] = [
  { label: "piece", className: "shadow-piece", surface: "bg-wood" },
  { label: "bevel", className: "shadow-bevel", surface: "bg-bronze" },
  { label: "well", className: "shadow-well", surface: "bg-parchment-deep" },
  { label: "lift", className: "shadow-lift", surface: "bg-parchment" },
  { label: "ready", className: "shadow-ready", surface: "bg-ready-gold" },
  { label: "active", className: "shadow-active", surface: "bg-night-plate" },
  {
    label: "selected",
    className: "shadow-selected",
    surface: "bg-parchment-lit",
  },
];

const byteHex = (n: number) =>
  Math.round(n).toString(16).padStart(2, "0").toUpperCase();

const formatHex = (r: number, g: number, b: number, a = 1): string => {
  const rgb = `#${byteHex(r)}${byteHex(g)}${byteHex(b)}`;
  return a < 1 ? `${rgb}${byteHex(a * 255)}` : rgb;
};

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Resolve any CSS color to RGBA by painting one pixel (handles oklch/oklab). */
const cssColorToRgba = (color: string): Rgba | null => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  // Sentinel: if `color` is rejected, fillStyle stays on this value.
  ctx.fillStyle = "rgba(1, 2, 3, 1)";
  const sentinel = ctx.fillStyle;
  ctx.fillStyle = color;
  if (ctx.fillStyle === sentinel) {
    return null;
  }

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const pixel = ctx.getImageData(0, 0, 1, 1).data;
  return {
    r: pixel[0] ?? 0,
    g: pixel[1] ?? 0,
    b: pixel[2] ?? 0,
    a: (pixel[3] ?? 0) / 255,
  };
};

const toLinearChannel = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const contrastInk = ({ r, g, b }: Rgba): string => {
  const luminance =
    0.2126 * toLinearChannel(r) +
    0.7152 * toLinearChannel(g) +
    0.0722 * toLinearChannel(b);
  return luminance > 0.4 ? "#111111" : "#FFFFFF";
};

const SwatchTile = ({ bg }: { bg: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState("");
  const [ink, setInk] = useState("#FFFFFF");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const rgba = cssColorToRgba(getComputedStyle(el).backgroundColor);
    if (!rgba) {
      setHex("");
      return;
    }
    setHex(formatHex(rgba.r, rgba.g, rgba.b, rgba.a));
    setInk(contrastInk(rgba));
  }, []);

  return (
    <div
      className={cn(
        "flex h-16 min-w-28 items-center justify-center rounded-lg border px-1.5 font-mono text-[10px]",
        bg,
        ink === "#111111" ? "border-black/25" : "border-cream/20"
      )}
      ref={ref}
      style={{ color: ink }}
    >
      {hex || "…"}
    </div>
  );
};

const TokenSection = ({ group }: { group: TokenGroup }) => (
  <section>
    <h4 className="text-muted-fg mb-3 font-mono text-xs">{group.label}</h4>
    <VariantGrid>
      {group.tokens.map((token) => (
        <Variant
          key={token.name}
          label={token.source ? `${token.name} → ${token.source}` : token.name}
        >
          <SwatchTile bg={token.bg} />
        </Variant>
      ))}
    </VariantGrid>
  </section>
);

export const DesignFoundationShowcase = () => (
  <div className="flex flex-col gap-10">
    {MATERIALS.map((group) => (
      <TokenSection group={group} key={group.label} />
    ))}

    <div className="border-border border-t pt-8">
      <h3 className="font-display mb-1 text-lg font-semibold">
        Semantic aliases
      </h3>
      <p className="text-muted-fg mb-6 max-w-prose text-sm">
        The names that the base components read. Each one is an alias of a
        material token, so the base components and the game pieces share one
        palette.
      </p>
      <div className="flex flex-col gap-8">
        {ALIASES.map((group) => (
          <TokenSection group={group} key={group.label} />
        ))}
      </div>
    </div>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Elevation</h4>
      <VariantGrid>
        {SHADOWS.map((shadow) => (
          <Variant key={shadow.label} label={shadow.label}>
            <span
              className={cn(
                "border-cream/20 block size-24 rounded-lg border",
                shadow.surface,
                shadow.className
              )}
            />
          </Variant>
        ))}
      </VariantGrid>
    </section>

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Type ramp</h4>
      <div className="bg-parchment text-ink border-frame-wood flex flex-col gap-3 rounded-2xl border-4 p-5">
        <p className={gameText({ role: "display" })}>Display · Cinzel 900</p>
        <p className={gameText({ role: "headline" })}>Headline · Cinzel 900</p>
        <p className={gameText({ role: "title" })}>Title · Cinzel 700</p>
        <p className={gameText({ role: "body" })}>
          Body · Inter 400. Rules text sits on parchment, never on a gradient.
        </p>
        <p className={gameText({ role: "small" })}>
          Body small · Inter 400. Reminder and flavor text.
        </p>
        <p className={gameText({ role: "label" })}>Label · Inter 700</p>
        <p className={gameText({ role: "number" })}>1 234 · Inter 900</p>
      </div>
    </section>
  </div>
);
