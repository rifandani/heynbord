import type { ClassId, CosmeticId, DamageType, Side } from "@workspace/rules";
import { LANE_LENGTH } from "@workspace/rules";
import { CanvasTexture, SRGBColorSpace } from "three";

import {
  DAMAGE_COLORS,
  FX_ANCHORS,
  HEAL_COLOR,
  SIDE_COLORS,
  STAT_DELTA,
  STAT_PIPE,
  WARD_COLOR,
} from "@/core/components/game/tokens";
import {
  boardSkinArt,
  laneRunnerTiles,
  SQUARE_SHEET,
  sheetTile,
} from "@/features/battle/board-skin-art";
import type { Glyph } from "@/features/battle/glyphs";
import { classGlyph, FILLED_GLYPHS, GLYPHS } from "@/features/battle/glyphs";
import type { FxCell, FxSlotName } from "@/features/battle/scene/fx-atlas";
import type { StatusBadge } from "@/features/battle/scene/status-visuals";
import { statTone } from "@/features/battle/scene/unit-stats";
import {
  FX_FLAME_END,
  FX_FLAME_TOP,
  FX_FROST_WHITE,
  FX_SHIELD_STEEL,
  FX_WHITE,
  TEXTURE_BAND,
  TEXTURE_BAND_END,
  TEXTURE_CREAM,
  TEXTURE_CREAM_DIM,
  TEXTURE_DROP,
  TEXTURE_DROP_END,
  TEXTURE_FIRE_ASH,
  TEXTURE_GLOW,
  TEXTURE_GLOW_END,
  TEXTURE_GLOW_SOFT,
  TEXTURE_HIGHLIGHT,
  TEXTURE_HIGHLIGHT_STRONG,
  TEXTURE_HOLY_FILL,
  TEXTURE_HOLY_FILL_EDGE,
  TEXTURE_INK,
  TEXTURE_INK_DEEP,
  TEXTURE_INK_DEEPER,
  TEXTURE_INK_FILL,
  TEXTURE_INK_LIGHT,
  TEXTURE_INK_SHADE,
  TEXTURE_INK_SHADOW,
  TEXTURE_MASK,
  TEXTURE_PALE,
  TEXTURE_PLATE,
  TEXTURE_PLATE_SHADE,
  TEXTURE_RIM,
  TEXTURE_SNOW,
  textureGlow,
} from "@/features/battle/tokens";
import {
  heroPortraitArt,
  STANDARD_HERO_PORTRAIT,
} from "@/features/hero/hero-portrait-art";

/**
 * Procedural art for the slice (art direction 2): each texture is drawn once
 * on a 2D canvas and cached.
 */
const cache = new Map<string, CanvasTexture>();

const cached = (
  key: string,
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void
): CanvasTexture => {
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    draw(context);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
};

const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

/** Draws a glyph centered on (0, 0) in a 100 px box: a dark outline, then a light fill. */
const drawGlyph = (context: CanvasRenderingContext2D, glyph: Glyph): void => {
  const path = new Path2D(GLYPHS[glyph]);
  if (FILLED_GLYPHS.has(glyph)) {
    context.fillStyle = TEXTURE_CREAM;
    // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
    context.fill(path, "evenodd");
    return;
  }
  context.lineJoin = "round";
  context.lineCap = "round";
  context.lineWidth = 14;
  context.strokeStyle = TEXTURE_INK;
  context.stroke(path);
  context.fillStyle = TEXTURE_CREAM;
  // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
  context.fill(path, "evenodd");
  context.lineWidth = 6;
  context.strokeStyle = TEXTURE_CREAM;
  context.stroke(path);
};

/** A standee shape with an arched top. */
const standeePath = (width: number, height: number, inset: number): Path2D => {
  const path = new Path2D();
  const radius = (width - inset * 2) / 2;
  path.moveTo(inset, height - inset - 16);
  path.lineTo(inset, radius + inset);
  path.arc(width / 2, radius + inset, radius, Math.PI, 0);
  path.lineTo(width - inset, height - inset - 16);
  path.quadraticCurveTo(
    width - inset,
    height - inset,
    width - inset - 16,
    height - inset
  );
  path.lineTo(inset + 16, height - inset);
  path.quadraticCurveTo(inset, height - inset, inset, height - inset - 16);
  path.closePath();
  return path;
};

/** The banner standee of a Hero, with the Class icon and the side color. */
export const heroFigureTexture = (
  side: Side,
  classId: ClassId
): CanvasTexture =>
  cached(`hero:${side}:${classId}`, 320, 448, (context) => {
    const color = SIDE_COLORS[side];
    const standee = standeePath(320, 448, 12);
    const gradient = context.createLinearGradient(0, 0, 0, 448);
    gradient.addColorStop(0, color.light);
    gradient.addColorStop(1, color.dark);
    context.fillStyle = gradient;
    context.fill(standee);
    context.lineWidth = 18;
    context.strokeStyle = TEXTURE_RIM;
    context.stroke(standee);
    context.save();
    context.translate(160, 190);
    context.scale(2, 2);
    drawGlyph(context, classGlyph(classId));
    context.restore();
  });

/** The Hero portrait on its banner: the face, inside the gold rim of the standee. */
const heroPortraitKey = (side: Side, id: CosmeticId | null): string =>
  `hero-portrait:${side}:${id ?? "standard"}`;

const loadingHeroPortrait = new Map<
  string,
  Promise<CanvasTexture | undefined>
>();

const loadHeroPortrait = async (
  side: Side,
  id: CosmeticId | null
): Promise<CanvasTexture | undefined> => {
  const art = id === null ? STANDARD_HERO_PORTRAIT : heroPortraitArt(id);
  if (art === null) {
    return undefined;
  }
  const image = new Image();
  image.decoding = "async";
  image.src = art;
  try {
    await image.decode();
  } catch {
    // A failed load can try again on the next Battle.
    loadingHeroPortrait.delete(heroPortraitKey(side, id));
    return undefined;
  }
  return cached(heroPortraitKey(side, id), 320, 448, (context) => {
    const standee = standeePath(320, 448, 12);
    const scale = Math.max(320 / image.naturalWidth, 448 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.save();
    context.clip(standee);
    context.drawImage(
      image,
      (320 - width) / 2,
      (448 - height) / 2,
      width,
      height
    );
    context.restore();
    context.lineWidth = 18;
    context.strokeStyle = TEXTURE_RIM;
    context.stroke(standee);
    context.lineWidth = 4;
    context.strokeStyle = TEXTURE_INK_LIGHT;
    context.stroke(standeePath(320, 448, 3));
  });
};

/** The Hero portrait of a Side on its banner, if its image is loaded. */
export const loadedHeroPortrait = (
  side: Side,
  id: CosmeticId | null
): CanvasTexture | undefined => cache.get(heroPortraitKey(side, id));

/**
 * The Hero portrait of a Side on its banner (Hero Portrait Concepts). The
 * Player Hero shows it while the image loads, and if the file is missing the
 * banner keeps the Class glyph.
 */
export const heroPortraitTexture = (
  side: Side,
  id: CosmeticId | null
): Promise<CanvasTexture | undefined> => {
  const key = heroPortraitKey(side, id);
  const loading = loadingHeroPortrait.get(key) ?? loadHeroPortrait(side, id);
  loadingHeroPortrait.set(key, loading);
  return loading;
};

const STAT_WIDTH = 512;
const STAT_HEIGHT = 160;

/** One part of `Attack | HP`, centered on `x`, with a dark outline. */
const drawStatPart = (
  context: CanvasRenderingContext2D,
  text: string,
  color: string,
  x: number,
  width: number
) => {
  const center = x + width / 2;
  context.strokeStyle = TEXTURE_INK_DEEP;
  context.strokeText(text, center, STAT_HEIGHT / 2);
  context.fillStyle = color;
  context.fillText(text, center, STAT_HEIGHT / 2);
};

/**
 * Attack and HP at the feet of a Unit (UI-04: always visible). `2 | 10`.
 * Each number is white, red, or green against its summon value. A Wall has
 * no Attack, so it shows only its HP.
 */
export const unitStatTexture = (options: {
  readonly attack: number | undefined;
  readonly startAttack: number;
  readonly hp: number;
  readonly maxHp: number;
}): CanvasTexture =>
  cached(
    `stat:${options.attack}:${options.startAttack}:${options.hp}:${options.maxHp}`,
    STAT_WIDTH,
    STAT_HEIGHT,
    (context) => {
      const attack = options.attack === undefined ? "" : String(options.attack);
      const hp = String(options.hp);
      const pipe = options.attack === undefined ? "" : " | ";
      context.font = `800 112px ${FONT}`;
      context.textBaseline = "middle";
      context.textAlign = "center";
      context.lineJoin = "round";
      context.lineWidth = 16;
      const attackWidth = context.measureText(attack).width;
      const pipeWidth = context.measureText(pipe).width;
      const hpWidth = context.measureText(hp).width;
      let x = (STAT_WIDTH - (attackWidth + pipeWidth + hpWidth)) / 2;
      drawStatPart(
        context,
        attack,
        STAT_DELTA[statTone(options.attack ?? 0, options.startAttack)],
        x,
        attackWidth
      );
      x += attackWidth;
      drawStatPart(context, pipe, STAT_PIPE, x, pipeWidth);
      x += pipeWidth;
      drawStatPart(
        context,
        hp,
        STAT_DELTA[statTone(options.hp, options.maxHp)],
        x,
        hpWidth
      );
    }
  );

/** A floating damage or heal number. A Crit is larger. The color shows the Damage Type, with an icon letter. */
export const numberTexture = (options: {
  readonly text: string;
  readonly damageType: DamageType | "heal" | "block" | "ward";
  readonly crit: boolean;
}): CanvasTexture =>
  cached(
    `number:${options.text}:${options.damageType}:${options.crit}`,
    192,
    96,
    (context) => {
      const color =
        options.damageType === "heal"
          ? HEAL_COLOR
          : options.damageType === "block"
            ? FX_SHIELD_STEEL
            : options.damageType === "ward"
              ? WARD_COLOR
              : DAMAGE_COLORS[options.damageType];
      context.font = `900 ${options.crit ? 76 : 60}px ${FONT}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineWidth = 12;
      context.lineJoin = "round";
      context.strokeStyle = TEXTURE_INK_DEEPER;
      context.strokeText(options.text, 96, 50);
      context.fillStyle = color;
      context.fillText(options.text, 96, 50);
    }
  );

/** A soft round shadow for the Unit bases and the Heroes. */
export const blobShadowTexture = (): CanvasTexture =>
  cached("shadow", 128, 128, (context) => {
    const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 62);
    gradient.addColorStop(0, TEXTURE_DROP);
    gradient.addColorStop(1, TEXTURE_DROP_END);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  });

/**
 * One target Square of a Skill Card cast: a rounded square with a bright rim
 * and a soft inner light. It is white, so the material color gives the
 * color of the effect.
 */
export const castTileTexture = (): CanvasTexture =>
  cached("cast-tile", 128, 128, (context) => {
    // The Unit on the Square hides the middle, so the light is at the edges.
    const inner = context.createRadialGradient(64, 64, 10, 64, 64, 70);
    inner.addColorStop(0, TEXTURE_HIGHLIGHT);
    inner.addColorStop(1, TEXTURE_HIGHLIGHT_STRONG);
    context.fillStyle = inner;
    context.beginPath();
    context.roundRect(10, 10, 108, 108, 18);
    context.fill();
    context.shadowColor = TEXTURE_GLOW;
    context.shadowBlur = 10;
    context.lineWidth = 7;
    context.strokeStyle = TEXTURE_GLOW;
    context.stroke();
    // A fine inner line, as a rune border.
    context.shadowBlur = 0;
    context.lineWidth = 2;
    context.strokeStyle = TEXTURE_GLOW_SOFT;
    context.beginPath();
    context.roundRect(24, 24, 80, 80, 10);
    context.stroke();
  });

/**
 * A Closed Lane: a band of night plate at 38%, with soft ends and soft edges,
 * so it looks like shade on the Battle Painting.
 */
export const closedLaneTexture = (): CanvasTexture =>
  cached("closed-lane", 256, 64, (context) => {
    const along = context.createLinearGradient(0, 0, 256, 0);
    along.addColorStop(0, TEXTURE_BAND_END);
    along.addColorStop(0.08, TEXTURE_BAND);
    along.addColorStop(0.92, TEXTURE_BAND);
    along.addColorStop(1, TEXTURE_BAND_END);
    context.fillStyle = along;
    context.fillRect(0, 0, 256, 64);
    const across = context.createLinearGradient(0, 0, 0, 64);
    across.addColorStop(0, TEXTURE_DROP_END);
    across.addColorStop(0.25, TEXTURE_MASK);
    across.addColorStop(0.75, TEXTURE_MASK);
    across.addColorStop(1, TEXTURE_DROP_END);
    context.globalCompositeOperation = "destination-in";
    context.fillStyle = across;
    context.fillRect(0, 0, 256, 64);
  });

/** The size of one Square on a Lane runner texture, in pixels. */
export const RUNNER_SQUARE_PX = 128;

/** The empty margin around a Lane runner for its contact shade, in pixels. */
export const RUNNER_MARGIN_PX = 16;

/** The width of the soft edge of a Lane runner, in pixels. */
const RUNNER_FEATHER_PX = 5;

const runnerKey = (id: CosmeticId, lane: number): string =>
  `lane-runner:${id}:${lane}`;

const loadingSheet = new Map<CosmeticId, Promise<HTMLImageElement | null>>();

const loadSquareSheet = (id: CosmeticId): Promise<HTMLImageElement | null> => {
  const loading =
    loadingSheet.get(id) ??
    (async () => {
      const art = boardSkinArt(id);
      if (art === null) {
        return null;
      }
      const image = new Image();
      image.decoding = "async";
      image.src = art;
      try {
        await image.decode();
      } catch {
        // A failed load can try again on the next Battle.
        loadingSheet.delete(id);
        return null;
      }
      return image;
    })();
  loadingSheet.set(id, loading);
  return loading;
};

/** Makes 2 opposite edges of the canvas soft, along the direction of `gradient`. */
const featherMask = (
  context: CanvasRenderingContext2D,
  gradient: CanvasGradient,
  length: number
) => {
  const edge = RUNNER_FEATHER_PX / length;
  gradient.addColorStop(0, TEXTURE_DROP_END);
  gradient.addColorStop(edge, TEXTURE_MASK);
  gradient.addColorStop(1 - edge, TEXTURE_MASK);
  gradient.addColorStop(1, TEXTURE_DROP_END);
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = gradient;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.globalCompositeOperation = "source-over";
};

/**
 * The Lane runner of one Lane (web ADR-0012): one tile of the Square sheet on
 * each Square, in the order of `laneRunnerTiles`, with a soft edge and a
 * contact shade in the margin around it.
 */
const drawLaneRunner = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  lane: number
) => {
  const tiles = laneRunnerTiles(lane);
  const width = tiles.length * RUNNER_SQUARE_PX;
  const strip = document.createElement("canvas");
  strip.width = width;
  strip.height = RUNNER_SQUARE_PX;
  const stripContext = strip.getContext("2d");
  if (!stripContext) {
    return;
  }
  // The sheet can be a little larger or smaller than 1536 × 1024: a cell is a
  // share of the image, not a fixed pixel size.
  const cellWidth = image.naturalWidth / SQUARE_SHEET.columns;
  const cellHeight = image.naturalHeight / SQUARE_SHEET.rows;
  for (const [position, tile] of tiles.entries()) {
    const { column, row } = sheetTile(tile);
    stripContext.drawImage(
      image,
      column * cellWidth,
      row * cellHeight,
      cellWidth,
      cellHeight,
      position * RUNNER_SQUARE_PX,
      0,
      RUNNER_SQUARE_PX,
      RUNNER_SQUARE_PX
    );
  }
  featherMask(
    stripContext,
    stripContext.createLinearGradient(0, 0, width, 0),
    width
  );
  featherMask(
    stripContext,
    stripContext.createLinearGradient(0, 0, 0, RUNNER_SQUARE_PX),
    RUNNER_SQUARE_PX
  );
  // The contact shade: the runner lies on the ground of the Battle Painting.
  context.save();
  context.shadowColor = TEXTURE_INK_SHADOW;
  context.shadowBlur = 10;
  context.shadowOffsetY = 3;
  context.fillStyle = TEXTURE_INK_SHADE;
  context.fillRect(
    RUNNER_MARGIN_PX + RUNNER_FEATHER_PX,
    RUNNER_MARGIN_PX + RUNNER_FEATHER_PX,
    width - RUNNER_FEATHER_PX * 2,
    RUNNER_SQUARE_PX - RUNNER_FEATHER_PX * 2
  );
  context.restore();
  context.drawImage(strip, RUNNER_MARGIN_PX, RUNNER_MARGIN_PX);
};

/** The Lane runner of a Board skin on one Lane, if its Square sheet is loaded. */
export const loadedLaneRunner = (
  id: CosmeticId,
  lane: number
): CanvasTexture | undefined => cache.get(runnerKey(id, lane));

/**
 * The Lane runner of a Board skin on one Lane (Board Skin Concepts 2). It is
 * `undefined` if the Square sheet does not exist or does not load: then the
 * Lane keeps the Standard ground.
 */
export const laneRunnerTexture = async (
  id: CosmeticId,
  lane: number
): Promise<CanvasTexture | undefined> => {
  const image = await loadSquareSheet(id);
  if (image === null) {
    return undefined;
  }
  return cached(
    runnerKey(id, lane),
    LANE_LENGTH * RUNNER_SQUARE_PX + RUNNER_MARGIN_PX * 2,
    RUNNER_SQUARE_PX + RUNNER_MARGIN_PX * 2,
    (context) => drawLaneRunner(context, image, lane)
  );
};

/** Draws one placeholder key image in a `width` × `height` box at (0, 0). */
type FxDraw = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) => void;

/** An outline for the `alpha` images. The `additive` images are light only. */
const OUTLINE = TEXTURE_INK;

const softDot =
  (color: string, core = 0.15): FxDraw =>
  (context, width, height) => {
    const radius = Math.min(width, height) * (7 / 16);
    const gradient = context.createRadialGradient(
      width / 2,
      height / 2,
      radius * core,
      width / 2,
      height / 2,
      radius
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, TEXTURE_DROP_END);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  };

/** A star with `points` rays, from `inner` to `outer` × the half size. */
const starPath = (
  size: number,
  points: number,
  inner: number,
  outer: number
): Path2D => {
  const path = new Path2D();
  const half = size / 2;
  for (let index = 0; index < points * 2; index += 1) {
    const angle = (index * Math.PI) / points - Math.PI / 2;
    const radius = half * (index % 2 === 0 ? outer : inner);
    const x = half + Math.cos(angle) * radius;
    const y = half + Math.sin(angle) * radius;
    if (index === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
  path.closePath();
  return path;
};

const glowStar =
  (color: string, points: number, inner: number): FxDraw =>
  (context, width) => {
    context.shadowColor = color;
    context.shadowBlur = width / 12;
    context.fillStyle = color;
    context.fill(starPath(width, points, inner, 0.8));
  };

/** A drop shape that points up, with its round end at the bottom. */
const dropPath = (width: number, height: number): Path2D => {
  const path = new Path2D();
  const radius = width * 0.26;
  const bottom = height * 0.66;
  path.moveTo(width / 2, height * 0.12);
  path.bezierCurveTo(
    width / 2 + radius * 0.4,
    height * 0.35,
    width / 2 + radius,
    bottom - radius * 0.6,
    width / 2 + radius,
    bottom
  );
  path.arc(width / 2, bottom, radius, 0, Math.PI);
  path.bezierCurveTo(
    width / 2 - radius,
    bottom - radius * 0.6,
    width / 2 - radius * 0.4,
    height * 0.35,
    width / 2,
    height * 0.12
  );
  path.closePath();
  return path;
};

const outlined = (
  context: CanvasRenderingContext2D,
  path: Path2D,
  color: string,
  line: number
) => {
  context.lineJoin = "round";
  context.lineWidth = line;
  context.strokeStyle = OUTLINE;
  context.stroke(path);
  context.fillStyle = color;
  // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
  context.fill(path, "evenodd");
};

/** A glyph in a Status color, with a dark outline, for a badge icon. */
const glyphIcon =
  (glyph: Glyph, color: string): FxDraw =>
  (context, width) => {
    context.translate(width / 2, width / 2);
    context.scale(width / 128, width / 128);
    const path = new Path2D(GLYPHS[glyph]);
    context.lineJoin = "round";
    context.lineCap = "round";
    context.lineWidth = 22;
    context.strokeStyle = OUTLINE;
    context.stroke(path);
    context.fillStyle = color;
    // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
    context.fill(path, "evenodd");
    context.lineWidth = 10;
    context.strokeStyle = color;
    context.stroke(path);
  };

const drawSlash: FxDraw = (context, width) => {
  context.lineCap = "round";
  for (const [line, alpha] of [
    [width / 9, 0.35],
    [width / 18, 1],
  ] as const) {
    context.lineWidth = line;
    context.strokeStyle = textureGlow(alpha);
    context.beginPath();
    context.arc(width / 2, width / 2, width * 0.34, -2.4, 0.4);
    context.stroke();
  }
};

const drawRuneRing: FxDraw = (context, width) => {
  const center = width / 2;
  context.strokeStyle = FX_WHITE;
  context.shadowColor = FX_WHITE;
  context.shadowBlur = width / 32;
  for (const radius of [0.4, 0.3]) {
    context.lineWidth = width / 64;
    context.beginPath();
    context.arc(center, center, width * radius, 0, Math.PI * 2);
    context.stroke();
  }
  // Rune ticks between the two circles.
  context.lineWidth = width / 48;
  for (let index = 0; index < 16; index += 1) {
    const angle = (index * Math.PI) / 8;
    const tilt = index % 2 === 0 ? 0.08 : -0.08;
    context.beginPath();
    context.moveTo(
      center + Math.cos(angle) * width * 0.32,
      center + Math.sin(angle) * width * 0.32
    );
    context.lineTo(
      center + Math.cos(angle + tilt) * width * 0.38,
      center + Math.sin(angle + tilt) * width * 0.38
    );
    context.stroke();
  }
};

const drawFlame: FxDraw = (context, width, height) => {
  const path = dropPath(width, height);
  const gradient = context.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, FX_FLAME_TOP);
  gradient.addColorStop(0.45, FX_ANCHORS.fire);
  gradient.addColorStop(1, FX_FLAME_END);
  context.shadowColor = FX_ANCHORS.fire;
  context.shadowBlur = width / 16;
  context.fillStyle = gradient;
  context.fill(path);
};

const drawVine: FxDraw = (context, width) => {
  const path = new Path2D();
  path.moveTo(width * 0.12, width * 0.82);
  path.bezierCurveTo(
    width * 0.3,
    width * 0.4,
    width * 0.8,
    width * 0.9,
    width * 0.78,
    width * 0.45
  );
  path.bezierCurveTo(
    width * 0.76,
    width * 0.2,
    width * 0.45,
    width * 0.22,
    width * 0.5,
    width * 0.42
  );
  context.lineCap = "round";
  context.lineWidth = width / 14;
  context.strokeStyle = OUTLINE;
  context.stroke(path);
  context.lineWidth = width / 22;
  context.strokeStyle = FX_ANCHORS.vine;
  context.stroke(path);
  for (const [x, y, angle] of [
    [0.3, 0.6, -0.6],
    [0.62, 0.72, 0.8],
    [0.86, 0.3, -1.2],
  ] as const) {
    const leaf = new Path2D();
    leaf.ellipse(
      x * width,
      y * width,
      width / 12,
      width / 24,
      angle,
      0,
      Math.PI * 2
    );
    outlined(context, leaf, FX_ANCHORS.iconEntangle, width / 64);
  }
};

const drawChain: FxDraw = (context, width) => {
  for (let index = 0; index < 3; index += 1) {
    const link = new Path2D();
    link.ellipse(
      width * (0.28 + index * 0.22),
      width / 2,
      width * 0.15,
      width * 0.09,
      index % 2 === 0 ? 0 : 0.3,
      0,
      Math.PI * 2
    );
    context.strokeStyle = OUTLINE;
    context.lineWidth = width / 14;
    context.stroke(link);
    context.strokeStyle = FX_ANCHORS.chain;
    context.lineWidth = width / 22;
    context.stroke(link);
  }
};

const drawShield: FxDraw = (context, width) => {
  context.translate(width / 2, width / 2);
  context.scale(width / 120, width / 120);
  outlined(context, new Path2D(GLYPHS.shield), FX_ANCHORS.shield, 6);
};

const drawShard: FxDraw = (context, width) => {
  const path = new Path2D();
  path.moveTo(width / 2, width * 0.1);
  path.lineTo(width * 0.68, width / 2);
  path.lineTo(width / 2, width * 0.9);
  path.lineTo(width * 0.32, width / 2);
  path.closePath();
  outlined(context, path, FX_ANCHORS.frost, width / 24);
};

const drawMote: FxDraw = (context, width) => {
  const path = new Path2D();
  path.arc(width / 2, width / 2, width * 0.2, 0, Math.PI * 2);
  context.globalAlpha = 0.9;
  outlined(context, path, FX_ANCHORS.frost, width / 32);
};

const drawBubble: FxDraw = (context, width) => {
  const path = new Path2D();
  path.arc(width / 2, width / 2, width * 0.3, 0, Math.PI * 2);
  outlined(context, path, FX_ANCHORS.poison, width / 24);
  context.fillStyle = TEXTURE_PALE;
  context.beginPath();
  context.arc(width * 0.42, width * 0.4, width * 0.07, 0, Math.PI * 2);
  context.fill();
};

const drawDrip: FxDraw = (context, width, height) => {
  outlined(context, dropPath(width, height), FX_ANCHORS.blood, width / 24);
};

const drawHeal: FxDraw = (context, width) => {
  context.shadowColor = FX_WHITE;
  context.shadowBlur = width / 10;
  context.fillStyle = FX_WHITE;
  const arm = width * 0.12;
  context.fillRect(width / 2 - arm, width * 0.2, arm * 2, width * 0.6);
  context.fillRect(width * 0.2, width / 2 - arm, width * 0.6, arm * 2);
};

/** The Ward dome: a half-sphere of gold light on a thin ring of light. */
const drawDome: FxDraw = (context, width) => {
  const base = width * 0.72;
  const radius = width * 0.38;
  context.shadowColor = FX_ANCHORS.holy;
  context.shadowBlur = width / 16;
  const fill = context.createRadialGradient(
    width / 2,
    base,
    radius * 0.4,
    width / 2,
    base,
    radius
  );
  fill.addColorStop(0, TEXTURE_HOLY_FILL);
  fill.addColorStop(1, TEXTURE_HOLY_FILL_EDGE);
  context.fillStyle = fill;
  context.beginPath();
  context.arc(width / 2, base, radius, Math.PI, 0);
  context.closePath();
  context.fill();
  context.strokeStyle = FX_ANCHORS.holy;
  context.lineWidth = width / 40;
  context.stroke();
  context.beginPath();
  context.ellipse(width / 2, base, radius, radius * 0.18, 0, 0, Math.PI * 2);
  context.stroke();
};

/** The Steadfast seal: a ring of gold light with short sun rays, seen from above. */
const drawSeal: FxDraw = (context, width) => {
  const center = width / 2;
  context.strokeStyle = FX_ANCHORS.iconSteadfast;
  context.shadowColor = FX_ANCHORS.iconSteadfast;
  context.shadowBlur = width / 24;
  context.lineCap = "round";
  for (const [radius, line] of [
    [0.3, width / 24],
    [0.22, width / 64],
  ] as const) {
    context.lineWidth = line;
    context.beginPath();
    context.arc(center, center, width * radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.lineWidth = width / 40;
  for (let index = 0; index < 12; index += 1) {
    const angle = (index * Math.PI) / 6;
    context.beginPath();
    context.moveTo(
      center + Math.cos(angle) * width * 0.34,
      center + Math.sin(angle) * width * 0.34
    );
    context.lineTo(
      center + Math.cos(angle) * width * 0.42,
      center + Math.sin(angle) * width * 0.42
    );
    context.stroke();
  }
};

/**
 * The ground of a Field Effect Square, seen from above: a soft patch in
 * `ground` with `spots` in `color` on it, which fades at its edges.
 */
const groundPatch =
  (ground: string, color: string): FxDraw =>
  (context, width) => {
    const center = width / 2;
    const patch = context.createRadialGradient(
      center,
      center,
      width * 0.1,
      center,
      center,
      width * 0.44
    );
    patch.addColorStop(0, ground);
    patch.addColorStop(0.7, ground);
    patch.addColorStop(1, TEXTURE_DROP_END);
    context.fillStyle = patch;
    context.fillRect(0, 0, width, width);
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = width / 24;
    for (const [x, y, radius] of [
      [0.32, 0.36, 0.07],
      [0.62, 0.3, 0.05],
      [0.5, 0.56, 0.08],
      [0.3, 0.66, 0.05],
      [0.7, 0.64, 0.06],
    ] as const) {
      context.beginPath();
      context.arc(x * width, y * width, radius * width, 0, Math.PI * 2);
      context.fill();
    }
  };

/** A jagged lightning bolt from the top to the bottom, with one fork. */
const drawBolt: FxDraw = (context, width) => {
  context.strokeStyle = FX_WHITE;
  context.shadowColor = FX_WHITE;
  context.shadowBlur = width / 14;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = width / 22;
  const points = [
    [0.46, 0.08],
    [0.56, 0.3],
    [0.42, 0.46],
    [0.58, 0.66],
    [0.5, 0.92],
  ] as const;
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    if (index === 0) {
      context.moveTo(x * width, y * width);
    } else {
      context.lineTo(x * width, y * width);
    }
  }
  context.stroke();
  context.lineWidth = width / 40;
  context.beginPath();
  context.moveTo(0.42 * width, 0.46 * width);
  context.lineTo(0.3 * width, 0.6 * width);
  context.lineTo(0.34 * width, 0.74 * width);
  context.stroke();
};

const drawTrail: FxDraw = (context, width, height) => {
  const along = context.createLinearGradient(
    width / 16,
    0,
    width * (15 / 16),
    0
  );
  along.addColorStop(0, TEXTURE_GLOW_END);
  along.addColorStop(1, TEXTURE_GLOW);
  context.fillStyle = along;
  context.beginPath();
  context.ellipse(
    width / 2,
    height / 2,
    width * (7 / 16),
    height * (6 / 16),
    0,
    0,
    Math.PI * 2
  );
  context.fill();
};

/** A drop on a broken heal cross: Bleeding makes heals smaller. */
const drawBleedIcon: FxDraw = (context, width) => {
  context.lineCap = "round";
  context.lineWidth = width / 10;
  context.strokeStyle = OUTLINE;
  context.beginPath();
  context.moveTo(width * 0.22, width * 0.5);
  context.lineTo(width * 0.4, width * 0.5);
  context.moveTo(width * 0.6, width * 0.5);
  context.lineTo(width * 0.78, width * 0.5);
  context.stroke();
  context.lineWidth = width / 18;
  context.strokeStyle = FX_FROST_WHITE;
  context.stroke();
  context.translate(width * 0.2, width * 0.12);
  outlined(
    context,
    dropPath(width * 0.6, width * 0.8),
    FX_ANCHORS.iconBleed,
    width / 20
  );
};

const FX_PLACEHOLDERS: Readonly<Record<FxSlotName, FxDraw>> = {
  glow: softDot(TEXTURE_GLOW, 0),
  burst: glowStar(FX_WHITE, 10, 0.35),
  slash: drawSlash,
  flare: glowStar(FX_ANCHORS.holy, 8, 0.2),
  "rune-ring": drawRuneRing,
  flame: drawFlame,
  vine: drawVine,
  chain: drawChain,
  shield: drawShield,
  spark: glowStar(FX_WHITE, 4, 0.25),
  ember: softDot(FX_ANCHORS.fire, 0.2),
  "frost-shard": drawShard,
  "frost-mote": drawMote,
  bubble: drawBubble,
  drip: drawDrip,
  dust: softDot(FX_ANCHORS.dust, 0.3),
  heal: drawHeal,
  trail: drawTrail,
  "icon-burn": glyphIcon("flame", FX_ANCHORS.iconBurn),
  "icon-freeze": glyphIcon("snow", FX_ANCHORS.iconFreeze),
  "icon-poison": glyphIcon("leaf", FX_ANCHORS.iconPoison),
  "icon-entangle": glyphIcon("vine", FX_ANCHORS.iconEntangle),
  "icon-hobble": glyphIcon("speed", FX_ANCHORS.iconHobble),
  "icon-bleed": drawBleedIcon,
  "icon-ward": glyphIcon("shield", FX_ANCHORS.iconWard),
  "icon-steadfast": glyphIcon("anchor", FX_ANCHORS.iconSteadfast),
  "icon-exposed": glyphIcon("brokenShield", FX_ANCHORS.iconExposed),
  "icon-paralyze": glyphIcon("bolt", FX_ANCHORS.iconParalyze),
  "icon-grounded": glyphIcon("grounded", FX_ANCHORS.iconGrounded),
  ward: drawDome,
  steadfast: drawSeal,
  "field-fire": groundPatch(TEXTURE_FIRE_ASH, FX_ANCHORS.fire),
  "field-snow": groundPatch(TEXTURE_SNOW, FX_ANCHORS.frost),
  bolt: drawBolt,
};

/** The placeholder atlas is half size: the UV rectangles do not change. */
const PLACEHOLDER_SCALE = 0.5;

/**
 * The canvas placeholders of the effects atlas (until #12): one key image for
 * each slot, in its cell, with an empty band of 1/16 of the cell on each side.
 */
export const fxPlaceholderAtlas = (
  slots: readonly { readonly name: FxSlotName; readonly cell: FxCell }[],
  size: number
): CanvasTexture =>
  cached(
    "fx-atlas",
    size * PLACEHOLDER_SCALE,
    size * PLACEHOLDER_SCALE,
    (context) => {
      for (const { name, cell } of slots) {
        context.save();
        context.scale(PLACEHOLDER_SCALE, PLACEHOLDER_SCALE);
        context.translate(cell.x, cell.y);
        context.beginPath();
        context.rect(0, 0, cell.w, cell.h);
        context.clip();
        FX_PLACEHOLDERS[name](context, cell.w, cell.h);
        context.restore();
      }
    }
  );

const BADGE_WIDTH = 512;
const BADGE_HEIGHT = 128;
/** The dark round plate behind each icon. */
const PLATE_RADIUS = 46;
const BADGE_GAP = 12;

/** An icon of the effects atlas: its source image and its cell, in px of that image. */
export interface BadgeIcon {
  readonly image: CanvasImageSource;
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

const drawBadgeText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number
) => {
  context.strokeStyle = TEXTURE_INK_DEEP;
  context.strokeText(text, x, BADGE_HEIGHT / 2 + 4);
  context.fillStyle = STAT_PIPE;
  context.fillText(text, x, BADGE_HEIGHT / 2 + 4);
};

/**
 * The Status Badge above a Unit: a dark round plate with the icon of each
 * Status and its count next to it, then "+N". The icon art has no numbers. A
 * Buff has a gold ring, and a Debuff a pale ring. `version` changes when the
 * atlas changes, so the badge draws again.
 */
export const statusBadgeTexture = (options: {
  readonly badges: readonly (StatusBadge & { readonly icon: BadgeIcon })[];
  readonly more: number;
  readonly version: number;
}): CanvasTexture =>
  cached(
    `badge:${options.version}:${options.badges
      .map((badge) => `${badge.status}${badge.count ?? ""}`)
      .join(",")}:${options.more}`,
    BADGE_WIDTH,
    BADGE_HEIGHT,
    (context) => {
      context.font = `900 64px ${FONT}`;
      context.textBaseline = "middle";
      context.textAlign = "left";
      context.lineJoin = "round";
      context.lineWidth = 12;
      const counts = options.badges.map((badge) =>
        badge.count === null ? "" : String(badge.count)
      );
      const more = options.more > 0 ? `+${options.more}` : "";
      const textWidth = (text: string) =>
        text ? context.measureText(text).width + 4 : 0;
      const total =
        counts.reduce(
          (sum, count) => sum + PLATE_RADIUS * 2 + textWidth(count),
          0
        ) +
        BADGE_GAP * Math.max(options.badges.length - 1, 0) +
        (more ? BADGE_GAP + textWidth(more) : 0);
      let x = (BADGE_WIDTH - total) / 2;
      for (const [index, badge] of options.badges.entries()) {
        const center = x + PLATE_RADIUS;
        context.fillStyle = TEXTURE_INK_FILL;
        context.beginPath();
        context.arc(center, BADGE_HEIGHT / 2, PLATE_RADIUS, 0, Math.PI * 2);
        context.fill();
        if (badge.buff) {
          context.lineWidth = 7;
          context.strokeStyle = WARD_COLOR;
        } else {
          context.lineWidth = 4;
          context.strokeStyle = TEXTURE_CREAM_DIM;
        }
        context.stroke();
        context.lineWidth = 12;
        const { icon } = badge;
        const size = PLATE_RADIUS * 1.7;
        context.drawImage(
          icon.image,
          icon.x,
          icon.y,
          icon.size,
          icon.size,
          center - size / 2,
          BADGE_HEIGHT / 2 - size / 2,
          size,
          size
        );
        x += PLATE_RADIUS * 2;
        const count = counts[index] ?? "";
        if (count) {
          drawBadgeText(context, count, x + 2);
          x += textWidth(count);
        }
        x += BADGE_GAP;
      }
      if (more) {
        drawBadgeText(context, more, x);
      }
    }
  );

/** The canvas of a Keyword Plate: 6 to 1, as its sprite (`keyword-plate-layer.tsx`). */
const KEYWORD_PLATE_WIDTH = 768;
const KEYWORD_PLATE_HEIGHT = 128;
const KEYWORD_PLATE_BODY = 96;
const KEYWORD_PLATE_BORDER = 6;
const KEYWORD_PLATE_PADDING = 30;
const KEYWORD_PLATE_FONT = 56;

/** The rounded body of a Keyword Plate, `width` px wide, in the middle of the canvas. */
const keywordPlatePath = (width: number): Path2D => {
  const path = new Path2D();
  const top = (KEYWORD_PLATE_HEIGHT - KEYWORD_PLATE_BODY) / 2;
  path.roundRect(
    (KEYWORD_PLATE_WIDTH - width) / 2,
    top,
    width,
    KEYWORD_PLATE_BODY,
    22
  );
  return path;
};

/**
 * A Keyword Plate (web ADR-0008): a Night Plate with a border in the Side
 * color, and the Keyword name with its value in Inter 700 `cream`, for
 * example "Swarm 2". The plate is as wide as its text. The canvas is wide
 * enough for the longest label in id-ID; a longer label gets a smaller font.
 */
export const keywordPlateTexture = (options: {
  readonly label: string;
  readonly side: Side;
}): CanvasTexture =>
  cached(
    `keyword-plate:${options.side}:${options.label}`,
    KEYWORD_PLATE_WIDTH,
    KEYWORD_PLATE_HEIGHT,
    (context) => {
      const room =
        KEYWORD_PLATE_WIDTH -
        2 * (KEYWORD_PLATE_PADDING + KEYWORD_PLATE_BORDER * 2);
      context.font = `700 ${KEYWORD_PLATE_FONT}px ${FONT}`;
      const measured = context.measureText(options.label).width;
      if (measured > room) {
        const size = Math.floor((KEYWORD_PLATE_FONT * room) / measured);
        context.font = `700 ${size}px ${FONT}`;
      }
      const textWidth = Math.min(measured, room);
      const plate = keywordPlatePath(
        textWidth + 2 * (KEYWORD_PLATE_PADDING + KEYWORD_PLATE_BORDER)
      );
      // The hard shadow of the Night Plate chips of the HUD.
      context.save();
      context.translate(0, 5);
      context.fillStyle = TEXTURE_PLATE_SHADE;
      // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
      context.fill(plate);
      context.restore();
      context.fillStyle = TEXTURE_PLATE;
      // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
      context.fill(plate);
      context.lineWidth = KEYWORD_PLATE_BORDER;
      context.strokeStyle = SIDE_COLORS[options.side].main;
      context.stroke(plate);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = TEXTURE_CREAM;
      context.fillText(
        options.label,
        KEYWORD_PLATE_WIDTH / 2,
        KEYWORD_PLATE_HEIGHT / 2 + 3
      );
    }
  );
