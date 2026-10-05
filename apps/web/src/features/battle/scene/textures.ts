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
  RACE_COLORS,
  RANK_COLORS,
  SIDE_COLORS,
  STAT_DELTA,
  STAT_PIPE,
} from "@/features/battle/palette";
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
