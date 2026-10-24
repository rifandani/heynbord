import { cn } from "cn";

import { gameText } from "@/core/components/game/surfaces";

import { Variant, VariantGrid } from "../variant";

interface Token {
  readonly name: string;
  readonly className: string;
  /** A light metal needs an edge, or it disappears on a light catalog. */
  readonly edge?: boolean;
}

const GROUPS: readonly { label: string; tokens: readonly Token[] }[] = [
  {
    label: "Materials",
    tokens: [
      { name: "gold", className: "bg-gold" },
      { name: "gold-light", className: "bg-gold-light", edge: true },
      { name: "gold-deep", className: "bg-gold-deep" },
      { name: "ready-gold", className: "bg-ready-gold", edge: true },
      { name: "gold-trim", className: "bg-gold-trim" },
      { name: "bronze", className: "bg-bronze" },
      { name: "bronze-rim", className: "bg-bronze-rim" },
      { name: "wood", className: "bg-wood" },
      { name: "wood-light", className: "bg-wood-light" },
      { name: "wood-edge", className: "bg-wood-edge" },
      { name: "frame-wood", className: "bg-frame-wood" },
      { name: "tray", className: "bg-tray" },
      { name: "tray-light", className: "bg-tray-light" },
    ],
  },
  {
    label: "Paper and ink",
    tokens: [
      { name: "parchment", className: "bg-parchment", edge: true },
      { name: "parchment-deep", className: "bg-parchment-deep", edge: true },
      { name: "parchment-lit", className: "bg-parchment-lit", edge: true },
      { name: "parchment-rule", className: "bg-parchment-rule", edge: true },
      { name: "ink", className: "bg-ink" },
      { name: "ink-soft", className: "bg-ink-soft" },
      { name: "ink-faded", className: "bg-ink-faded" },
      { name: "ink-on-gold", className: "bg-ink-on-gold" },
    ],
  },
  {
    label: "Night plate and cream",
    tokens: [
      { name: "night-plate", className: "bg-night-plate" },
      { name: "plate-ember", className: "bg-plate-ember" },
      { name: "plate-socket", className: "bg-plate-socket" },
      { name: "cream", className: "bg-cream", edge: true },
      { name: "cream-dim", className: "bg-cream-dim", edge: true },
      { name: "focus-cream", className: "bg-focus-cream", edge: true },
    ],
  },
  {
    label: "States",
    tokens: [
      { name: "enemy-red", className: "bg-enemy-red" },
      { name: "enemy-deep", className: "bg-enemy-deep" },
      { name: "blood-banner", className: "bg-blood-banner" },
      { name: "keyword-rust", className: "bg-keyword-rust" },
      { name: "victory-amber", className: "bg-victory-amber" },
      { name: "tutorial-teal", className: "bg-tutorial-teal" },
      { name: "tutorial-glow", className: "bg-tutorial-glow", edge: true },
      { name: "hp-full", className: "bg-hp-full" },
      { name: "hp-low", className: "bg-hp-low" },
      { name: "heart-red", className: "bg-heart-red" },
    ],
  },
  {
    label: "Ranks",
    tokens: [
      { name: "rank-common", className: "bg-rank-common" },
      { name: "rank-uncommon", className: "bg-rank-uncommon" },
      { name: "rank-rare", className: "bg-rank-rare" },
      { name: "rank-epic", className: "bg-rank-epic" },
      { name: "rank-legendary", className: "bg-rank-legendary" },
    ],
  },
  {
    label: "Damage",
    tokens: [
      { name: "damage-physical", className: "bg-damage-physical", edge: true },
      { name: "damage-fire", className: "bg-damage-fire" },
      { name: "damage-frost", className: "bg-damage-frost" },
      { name: "damage-holy", className: "bg-damage-holy" },
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
  {
    label: "well",
    className: "shadow-well",
    surface: "bg-parchment-deep",
  },
  { label: "lift", className: "shadow-lift", surface: "bg-parchment" },
  { label: "ready", className: "shadow-ready", surface: "bg-ready-gold" },
  {
    label: "active",
    className: "shadow-active",
    surface: "bg-night-plate",
  },
  {
    label: "selected",
    className: "shadow-selected",
    surface: "bg-parchment-lit",
  },
];

/**
 * The Foundation of the Heynbord Design System: the tokens that every game
 * screen and every page outside `/play` reads. A component never writes a
 * hex value; it names one of these.
 */
export const GameFoundationShowcase = () => (
  <div className="flex flex-col gap-10">
    {GROUPS.map((group) => (
      <section key={group.label}>
        <h4 className="text-muted-fg mb-3 font-mono text-xs">{group.label}</h4>
        <div className="flex flex-wrap gap-3">
          {group.tokens.map((token) => (
            <div className="flex w-28 flex-col gap-1.5" key={token.name}>
              <span
                className={cn(
                  "h-14 w-full rounded-lg",
                  token.className,
                  token.edge && "border border-black/15"
                )}
              />
              <code className="text-muted-fg text-[11px]">{token.name}</code>
            </div>
          ))}
        </div>
      </section>
    ))}

    <section>
      <h4 className="text-muted-fg mb-3 font-mono text-xs">Elevation</h4>
      <VariantGrid>
        {SHADOWS.map((shadow) => (
          <Variant key={shadow.label} label={shadow.label}>
            <span
              className={cn(
                "block size-24 rounded-lg border border-black/20",
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
