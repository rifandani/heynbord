import type { CosmeticId } from "@workspace/rules";
import { cn } from "cn";
import type { CSSProperties } from "react";

import { battlePaintingFor } from "@/features/battle/battle-painting";
import {
  boardSkinArt,
  laneRunnerTiles,
  SQUARE_SHEET,
  sheetTile,
} from "@/features/battle/board-skin-art";
import { BAZAAR_COLORS, BAZAAR_CSS, cssVars } from "@/features/bazaar/tokens";

/** The shelf shows 3 Lanes, as a Stage, and the player half of each Lane. */
const SHELF_LANES = 3;
const SHELF_SQUARES = 6;

/** The Hearthvale painting: the ground under the preview (Battlefield Concepts 1.1). */
const PREVIEW_GROUND = battlePaintingFor(1);

/** The ground of the preview: a crop of the open meadow of the Battle Painting. */
const groundStyle: CSSProperties =
  PREVIEW_GROUND === null
    ? { backgroundColor: BAZAAR_COLORS.meadow }
    : {
        backgroundColor: BAZAAR_COLORS.meadow,
        backgroundImage: `url("${PREVIEW_GROUND}")`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      };

/** One tile of the Square sheet as a CSS background. */
const tileStyle = (sheet: string, tile: number): CSSProperties => {
  const { column, row } = sheetTile(tile);
  return {
    backgroundImage: `url("${sheet}")`,
    backgroundSize: `${SQUARE_SHEET.columns * 100}% ${SQUARE_SHEET.rows * 100}%`,
    backgroundPosition: `${(column / (SQUARE_SHEET.columns - 1)) * 100}% ${
      (row / (SQUARE_SHEET.rows - 1)) * 100
    }%`,
  };
};

/**
 * The thumbnail of a Board skin on its plate: 2 × 2 tiles of its Square
 * sheet. The Standard ground shows the meadow of the Battle Painting.
 */
export const BoardSkinThumb = ({
  skin,
  className,
}: {
  readonly skin: CosmeticId | null;
  readonly className?: string;
}) => {
  const sheet = skin === null ? null : boardSkinArt(skin);
  return (
    <span
      aria-hidden
      className={cn(
        "border-gold-trim/70 block aspect-square overflow-hidden rounded-md border-2 shadow-(--skin-drop)",
        className
      )}
      style={{
        ...(sheet === null
          ? groundStyle
          : {
              backgroundImage: `url("${sheet}")`,
              backgroundSize: `${(SQUARE_SHEET.columns / 2) * 100}% ${
                (SQUARE_SHEET.rows / 2) * 100
              }%`,
              backgroundPosition: "0 0",
            }),
        ...cssVars({ "--skin-drop": BAZAAR_CSS.plate2 }),
      }}
      data-testid="board-skin-thumb"
      data-look={skin ?? "standard"}
    />
  );
};

/**
 * The Board skin on the shelf (web ADR-0012): the Lane runners of 3 Lanes on
 * the meadow of the Battle Painting, at the angle of the Battle camera. The
 * Standard ground shows the meadow with no runner.
 */
export const BoardSkinShelfLook = ({
  skin,
}: {
  readonly skin: CosmeticId | null;
}) => {
  const sheet = skin === null ? null : boardSkinArt(skin);
  return (
    <span
      aria-hidden
      className="border-gold-trim/70 relative block h-[112px] w-[168px] overflow-hidden rounded-lg border-2 [perspective:320px] [@media(max-height:500px)]:h-[78px] [@media(max-height:500px)]:w-[116px]"
      style={groundStyle}
      data-testid="board-skin-shelf-look"
      data-look={skin ?? "standard"}
    >
      {sheet === null ? null : (
        <span className="absolute inset-x-[10%] top-[14%] bottom-[10%] flex [transform-origin:50%_100%] [transform:rotateX(45deg)] flex-col justify-between">
          {Array.from({ length: SHELF_LANES }, (_, lane) => (
            <span
              key={lane}
              className="flex h-[28%]"
              style={{ boxShadow: BAZAAR_CSS.lane }}
            >
              {laneRunnerTiles(lane)
                .slice(0, SHELF_SQUARES)
                .map((tile, position) => (
                  <span
                    // The tiles of a Lane never move, so the Square is the key.
                    // oxlint-disable-next-line react/no-array-index-key -- the position is the identity of a Square
                    key={position}
                    className="h-full flex-1"
                    style={tileStyle(sheet, tile)}
                  />
                ))}
            </span>
          ))}
        </span>
      )}
    </span>
  );
};
