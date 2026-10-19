import { cn } from "cn";

import {
  HEYNSPIRE_ART_FILE,
  heynspireArt,
} from "@/features/heynspire/heynspire-art";

/**
 * The light over the sky, so that the tower column, the ribbons and the Floor
 * Panel stay easy to read: a soft sky haze at the left behind the tower, and
 * a darker band at the bottom above the Town Bar.
 */
const SHADE = [
  "linear-gradient(90deg, rgba(225,238,248,0.38) 0%, rgba(225,238,248,0.12) 48%, transparent 62%)",
  "linear-gradient(180deg, transparent 72%, rgba(18,12,8,0.42) 100%)",
].join(", ");

/**
 * The sky behind the Heynspire tower (11 — Town Concepts 14): floating
 * stones, the far Town and the clouds, which cover the screen. Until the sky
 * painting exists, the tower inside painting holds its place, softened, so
 * that its painted wall does not compete with the tower column. It is calm:
 * it has no ambient motion.
 */
export const TowerScene = () => {
  const sky = heynspireArt("sky");
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#9fcbe8]"
      aria-hidden
      data-testid="tower-scene"
    >
      <img
        src={sky ?? HEYNSPIRE_ART_FILE.towerInside}
        alt=""
        width={1536}
        height={1024}
        draggable={false}
        decoding="async"
        className={cn(
          "absolute inset-0 size-full object-cover select-none",
          // The fallback: the wall of the old painting goes soft and pale.
          !sky && "scale-105 blur-[6px] brightness-[1.04] saturate-[0.85]"
        )}
        data-testid={sky ? undefined : "tower-scene-fallback"}
      />
      <div className="absolute inset-0" style={{ background: SHADE }} />
    </div>
  );
};
