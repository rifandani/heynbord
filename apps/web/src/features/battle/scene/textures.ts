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
import { cardGlyph, classGlyph, GLYPHS } from "@/features/battle/glyphs";
import {
  DAMAGE_COLORS,
  RACE_COLORS,
  RANK_COLORS,
  SIDE_COLORS,
} from "@/features/battle/palette";

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

const roundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
};

/**
 * Attack and HP above a Unit (UI-04: always visible). Damaged HP is red. A
 * shield shows Armor. The owner color is the badge border.
 */
export const statBadgeTexture = (options: {
  readonly attack: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly armor: number;
  readonly owner: Side;
}): CanvasTexture =>
  cached(
    `stat:${options.attack}:${options.hp}:${options.maxHp}:${options.armor}:${options.owner}`,
    256,
    96,
    (context) => {
      roundRect(context, 4, 8, 248, 80, 36);
      context.fillStyle = "rgba(18, 14, 12, 0.88)";
      context.fill();
      context.lineWidth = 6;
      context.strokeStyle = SIDE_COLORS[options.owner].main;
      context.stroke();
      context.font = `800 54px ${FONT}`;
      context.textBaseline = "middle";
      context.textAlign = "center";
      // Attack: a small sword, then the value.
      context.save();
      context.translate(42, 48);
      context.rotate(Math.PI / 4);
      context.scale(0.5, 0.5);
      drawGlyph(context, "sword");
      context.restore();
      context.fillStyle = "#ffb347";
      context.fillText(String(options.attack), 92, 51);
      // HP: a heart, then the value.
      context.save();
      context.translate(150, 48);
      context.scale(0.36, 0.36);
      context.fillStyle = "#ef4444";
      // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- this is `CanvasRenderingContext2D#fill` with a `Path2D`, not `Array#fill`
      context.fill(new Path2D(GLYPHS.heart));
      context.restore();
      context.fillStyle = options.hp < options.maxHp ? "#ff7b7b" : "#8ef0a4";
      context.fillText(String(options.hp), 206, 51);
      if (options.armor > 0) {
        context.save();
        context.translate(128, 14);
        context.scale(0.22, 0.22);
        drawGlyph(context, "shield");
        context.restore();
        context.font = `800 22px ${FONT}`;
        context.fillStyle = "#14100c";
        context.fillText(String(options.armor), 128, 16);
      }
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

/** Painted sky: a vertical gradient with soft clouds (art direction 2: panorama). */
export const skyTexture = (): CanvasTexture =>
  cached("sky", 512, 256, (context) => {
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#5b8fd6");
    gradient.addColorStop(0.55, "#a9cdee");
    gradient.addColorStop(0.8, "#f6dcb0");
    gradient.addColorStop(1, "#f2c89a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = "rgba(255, 255, 255, 0.55)";
    for (const [x, y, size] of [
      [80, 70, 34],
      [130, 64, 26],
      [300, 50, 30],
      [350, 58, 22],
      [440, 92, 26],
      [210, 110, 20],
    ] as const) {
      context.beginPath();
      context.ellipse(x, y, size * 2.2, size * 0.7, 0, 0, Math.PI * 2);
      context.fill();
    }
  });
