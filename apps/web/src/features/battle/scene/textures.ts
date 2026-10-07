import type {
  ClassId,
  DamageType,
  RaceId,
  RankId,
  Side,
} from "@workspace/rules";
import { getCard, rankPips } from "@workspace/rules";
import { CanvasTexture, SRGBColorSpace } from "three";

import { cardIllustration } from "@/features/battle/card-art";
import type { Glyph } from "@/features/battle/glyphs";
import {
  cardGlyph,
  classGlyph,
  FILLED_GLYPHS,
  GLYPHS,
} from "@/features/battle/glyphs";
import {
  DAMAGE_COLORS,
  FX_ANCHORS,
  RACE_COLORS,
  RANK_COLORS,
  SIDE_COLORS,
  STAT_DELTA,
  STAT_PIPE,
} from "@/features/battle/palette";
import type { FxCell, FxSlotName } from "@/features/battle/scene/fx-atlas";
import type { StatusBadge } from "@/features/battle/scene/status-visuals";
import { statTone } from "@/features/battle/scene/unit-stats";

/**
 * Procedural art for the slice (art direction 2): each texture is drawn once
 * on a 2D canvas and cached. Only the Unit art loads image files.
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
    context.fillStyle = "#fff6df";
    // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
    context.fill(path, "evenodd");
    return;
  }
  context.lineJoin = "round";
  context.lineCap = "round";
  context.lineWidth = 14;
  context.strokeStyle = "rgba(20, 14, 10, 0.85)";
  context.stroke(path);
  context.fillStyle = "#fff6df";
  // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
  context.fill(path, "evenodd");
  context.lineWidth = 6;
  context.strokeStyle = "#fff6df";
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

const drawPips = (
  context: CanvasRenderingContext2D,
  rank: RankId,
  y: number,
  width: number
) => {
  const count = rankPips(rank);
  const gap = 26;
  const start = width / 2 - ((count - 1) * gap) / 2;
  for (let index = 0; index < count; index += 1) {
    const x = start + index * gap;
    context.beginPath();
    context.moveTo(x, y - 11);
    context.lineTo(x + 9, y);
    context.lineTo(x, y + 11);
    context.lineTo(x - 9, y);
    context.closePath();
    context.fillStyle = RANK_COLORS[rank];
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = "rgba(20, 14, 10, 0.8)";
    context.stroke();
  }
};

const raceOf = (cardId: string): RaceId => {
  const card = getCard(cardId);
  return card.kind === "creature" ? card.race : "human";
};

/**
 * The painted standee of a Unit: Race colors, a role icon and the Rank pips.
 * The Unit shows it until its card art loads (`unitArtTexture`).
 */
export const unitFigureTexture = (
  cardId: string,
  rank: RankId
): CanvasTexture =>
  cached(`unit:${cardId}:${rank}`, 256, 320, (context) => {
    const card = getCard(cardId);
    const colors = RACE_COLORS[raceOf(cardId)];
    const standee = standeePath(256, 320, 10);
    const gradient = context.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, colors.light);
    gradient.addColorStop(0.55, colors.main);
    gradient.addColorStop(1, colors.dark);
    context.fillStyle = gradient;
    context.fill(standee);
    // Soft light from the upper left (art direction 5.4).
    const light = context.createRadialGradient(70, 60, 10, 70, 60, 200);
    light.addColorStop(0, "rgba(255, 250, 230, 0.45)");
    light.addColorStop(1, "rgba(255, 250, 230, 0)");
    context.fillStyle = light;
    context.fill(standee);
    context.lineWidth = 14;
    context.strokeStyle = colors.second;
    context.stroke(standee);
    context.lineWidth = 4;
    context.strokeStyle = "rgba(20, 14, 10, 0.7)";
    context.stroke(standeePath(256, 320, 3));
    const glyph = cardGlyph(card);
    context.save();
    context.translate(128, 132);
    context.scale(1.35, 1.35);
    drawGlyph(context, glyph);
    context.restore();
    drawPips(context, rank, 270, 256);
  });

/** The size of the Unit art, with the aspect of the figure plane. */
const ART_WIDTH = 320;
const ART_HEIGHT = 400;

const unitArtKey = (cardId: string): string => `unit-art:${cardId}`;

const loadingArt = new Map<string, Promise<CanvasTexture | undefined>>();

const loadUnitArt = async (
  cardId: string
): Promise<CanvasTexture | undefined> => {
  const image = new Image();
  image.decoding = "async";
  image.src = cardIllustration(cardId);
  try {
    await image.decode();
  } catch {
    // A failed load can try again on the next summon.
    loadingArt.delete(cardId);
    return undefined;
  }
  return cached(unitArtKey(cardId), ART_WIDTH, ART_HEIGHT, (context) => {
    const scale = Math.max(
      ART_WIDTH / image.naturalWidth,
      ART_HEIGHT / image.naturalHeight
    );
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.clip(standeePath(ART_WIDTH, ART_HEIGHT, 2));
    context.drawImage(
      image,
      (ART_WIDTH - width) / 2,
      (ART_HEIGHT - height) / 2,
      width,
      height
    );
  });
};

/**
 * The card art of a Unit, with its background, in the standee shape (art
 * direction 2: until the card has a cut-out). The 3:4 art fills the plane and
 * the extra height is cut equally at the top and the bottom. It is `undefined`
 * if the image does not load: then the Unit keeps its painted standee.
 */
export const unitArtTexture = (
  cardId: string
): Promise<CanvasTexture | undefined> => {
  const loading = loadingArt.get(cardId) ?? loadUnitArt(cardId);
  loadingArt.set(cardId, loading);
  return loading;
};

/** The Unit art of a card if it is loaded, else `undefined`. */
export const loadedUnitArt = (cardId: string): CanvasTexture | undefined =>
  cache.get(unitArtKey(cardId));

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
    context.strokeStyle = "#e9c46a";
    context.stroke(standee);
    context.save();
    context.translate(160, 190);
    context.scale(2, 2);
    drawGlyph(context, classGlyph(classId));
    context.restore();
  });

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
  context.strokeStyle = "rgba(15, 10, 8, 0.92)";
  context.strokeText(text, center, STAT_HEIGHT / 2);
  context.fillStyle = color;
  context.fillText(text, center, STAT_HEIGHT / 2);
};

/**
 * Attack and HP at the feet of a Unit (UI-04: always visible). `2 | 10`.
 * Each number is white, red, or green against its summon value.
 */
export const unitStatTexture = (options: {
  readonly attack: number;
  readonly startAttack: number;
  readonly hp: number;
  readonly maxHp: number;
}): CanvasTexture =>
  cached(
    `stat:${options.attack}:${options.startAttack}:${options.hp}:${options.maxHp}`,
    STAT_WIDTH,
    STAT_HEIGHT,
    (context) => {
      const attack = String(options.attack);
      const hp = String(options.hp);
      const pipe = " | ";
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
        STAT_DELTA[statTone(options.attack, options.startAttack)],
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
  readonly damageType: DamageType | "heal" | "block";
  readonly crit: boolean;
}): CanvasTexture =>
  cached(
    `number:${options.text}:${options.damageType}:${options.crit}`,
    192,
    96,
    (context) => {
      const color =
        options.damageType === "heal"
          ? "#7ef29a"
          : options.damageType === "block"
            ? "#d7dde5"
            : DAMAGE_COLORS[options.damageType];
      context.font = `900 ${options.crit ? 76 : 60}px ${FONT}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineWidth = 12;
      context.lineJoin = "round";
      context.strokeStyle = "rgba(15, 10, 8, 0.9)";
      context.strokeText(options.text, 96, 50);
      context.fillStyle = color;
      context.fillText(options.text, 96, 50);
    }
  );

/** A soft round shadow for the Unit bases and the Heroes. */
export const blobShadowTexture = (): CanvasTexture =>
  cached("shadow", 128, 128, (context) => {
    const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 62);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.55)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
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
    inner.addColorStop(0, "rgba(255, 255, 255, 0.35)");
    inner.addColorStop(1, "rgba(255, 255, 255, 0.75)");
    context.fillStyle = inner;
    context.beginPath();
    context.roundRect(10, 10, 108, 108, 18);
    context.fill();
    context.shadowColor = "rgba(255, 255, 255, 1)";
    context.shadowBlur = 10;
    context.lineWidth = 7;
    context.strokeStyle = "rgba(255, 255, 255, 1)";
    context.stroke();
    // A fine inner line, as a rune border.
    context.shadowBlur = 0;
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255, 255, 255, 0.8)";
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
    along.addColorStop(0, "rgba(28, 20, 14, 0)");
    along.addColorStop(0.08, "rgba(28, 20, 14, 0.38)");
    along.addColorStop(0.92, "rgba(28, 20, 14, 0.38)");
    along.addColorStop(1, "rgba(28, 20, 14, 0)");
    context.fillStyle = along;
    context.fillRect(0, 0, 256, 64);
    const across = context.createLinearGradient(0, 0, 0, 64);
    across.addColorStop(0, "rgba(0, 0, 0, 0)");
    across.addColorStop(0.25, "rgba(0, 0, 0, 1)");
    across.addColorStop(0.75, "rgba(0, 0, 0, 1)");
    across.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.globalCompositeOperation = "destination-in";
    context.fillStyle = across;
    context.fillRect(0, 0, 256, 64);
  });

/** Draws one placeholder key image in a `width` × `height` box at (0, 0). */
type FxDraw = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) => void;

/** An outline for the `alpha` images. The `additive` images are light only. */
const OUTLINE = "rgba(20, 14, 10, 0.85)";

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
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
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
    context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    context.beginPath();
    context.arc(width / 2, width / 2, width * 0.34, -2.4, 0.4);
    context.stroke();
  }
};

const drawRuneRing: FxDraw = (context, width) => {
  const center = width / 2;
  context.strokeStyle = "#ffffff";
  context.shadowColor = "#ffffff";
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
  gradient.addColorStop(0, "#fff1b0");
  gradient.addColorStop(0.45, FX_ANCHORS.fire);
  gradient.addColorStop(1, "rgba(255, 70, 20, 0)");
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
  context.fillStyle = "rgba(255, 255, 240, 0.8)";
  context.beginPath();
  context.arc(width * 0.42, width * 0.4, width * 0.07, 0, Math.PI * 2);
  context.fill();
};

const drawDrip: FxDraw = (context, width, height) => {
  outlined(context, dropPath(width, height), FX_ANCHORS.blood, width / 24);
};

const drawHeal: FxDraw = (context, width) => {
  context.shadowColor = "#ffffff";
  context.shadowBlur = width / 10;
  context.fillStyle = "#ffffff";
  const arm = width * 0.12;
  context.fillRect(width / 2 - arm, width * 0.2, arm * 2, width * 0.6);
  context.fillRect(width * 0.2, width / 2 - arm, width * 0.6, arm * 2);
};

const drawTrail: FxDraw = (context, width, height) => {
  const along = context.createLinearGradient(
    width / 16,
    0,
    width * (15 / 16),
    0
  );
  along.addColorStop(0, "rgba(255, 255, 255, 0)");
  along.addColorStop(1, "rgba(255, 255, 255, 1)");
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
  context.strokeStyle = "#e9eef2";
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
  glow: softDot("rgba(255, 255, 255, 1)", 0),
  burst: glowStar("#ffffff", 10, 0.35),
  slash: drawSlash,
  flare: glowStar(FX_ANCHORS.holy, 8, 0.2),
  "rune-ring": drawRuneRing,
  flame: drawFlame,
  vine: drawVine,
  chain: drawChain,
  shield: drawShield,
  spark: glowStar("#ffffff", 4, 0.25),
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
  context.strokeStyle = "rgba(15, 10, 8, 0.92)";
  context.strokeText(text, x, BADGE_HEIGHT / 2 + 4);
  context.fillStyle = STAT_PIPE;
  context.fillText(text, x, BADGE_HEIGHT / 2 + 4);
};

/**
 * The Status Badge above a Unit: a dark round plate with the icon of each
 * Status and its count next to it, then "+N". The icon art has no numbers.
 * `version` changes when the atlas changes, so the badge draws again.
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
        context.fillStyle = "rgba(20, 14, 10, 0.82)";
        context.beginPath();
        context.arc(center, BADGE_HEIGHT / 2, PLATE_RADIUS, 0, Math.PI * 2);
        context.fill();
        context.lineWidth = 4;
        context.strokeStyle = "rgba(255, 246, 223, 0.35)";
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
