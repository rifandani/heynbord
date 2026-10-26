import { BATTLE_MEADOW_LAYERS } from "@/features/battle/tokens";

/**
 * The meadow that shows under the Battle Painting: while the image loads, and
 * in place of a painting that does not exist yet. A forest clearing in light
 * from the upper left, with dark forest at the edges (art direction 5.4).
 */
const MEADOW = BATTLE_MEADOW_LAYERS;

/**
 * The Battle Painting behind the transparent 3D canvas (web ADR-0006). It
 * covers the screen and crops its edges. It is decoration, so screen readers
 * skip it.
 */
export const BattlePainting = ({ src }: { readonly src: string | null }) => (
  <div
    aria-hidden
    data-battle-painting
    className="bg-battle-meadow absolute inset-0 bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: (src ? [`url("${src}")`, ...MEADOW] : MEADOW).join(","),
    }}
  />
);
