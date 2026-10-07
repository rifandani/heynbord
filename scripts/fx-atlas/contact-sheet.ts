/**
 * Writes the contact sheet for the review of the masters (#12):
 *
 *   bun fx:sheet
 *
 * Each slot shows on a shaded and on a sunny crop of the Battle Painting,
 * with its blend mode and a sample tint for a `code` slot. Each icon shows on
 * the Status Badge plate at 24 px and at 48 px. Mark a slot to reject it, and
 * copy the list of rejected slots from the bottom of the page.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import type { FxSlotName } from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import {
  FX_SLOTS,
  fxSlotNames,
} from "../../apps/web/src/features/battle/scene/fx-atlas.ts";
import { hexToRgb, masterPath, RAW_DIR, ROOT } from "./slots.ts";

const SHEET = path.join(RAW_DIR, "contact-sheet.html");
const TINTED_DIR = path.join(RAW_DIR, "tinted");

/** The sample tint of each `code` slot: a color that the code can give it. */
const SAMPLE_TINT: Partial<Record<FxSlotName, string>> = {
  glow: "#ffd75a",
  burst: "#ff6a33",
  slash: "#ffffff",
  "rune-ring": "#8fd8ff",
  spark: "#ffffff",
  heal: "#9dffb4",
  trail: "#ff6a33",
};

const PAINTING = path.join(ROOT, "apps/web/public/battle/hearthvale.webp");
const CROPS = {
  shade: { left: 0, top: 600, width: 320, height: 320 },
  sun: { left: 760, top: 330, width: 320, height: 320 },
} as const;

/** The same plate as `statusBadgeTexture`: radius 46, icon 1.7 × radius. */
const ICON_IN_PLATE = 1.7 / 2;

const writeCrops = () =>
  Promise.all(
    Object.entries(CROPS).map(([name, region]) =>
      sharp(PAINTING)
        .extract(region)
        .png()
        .toFile(path.join(RAW_DIR, `${name}.png`))
    )
  );

/** The master multiplied by the tint, as the material color does it. */
const writeTinted = async (name: FxSlotName, tint: string): Promise<string> => {
  const { data, info } = await sharp(masterPath(name))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgb = hexToRgb(tint);
  for (let index = 0; index < data.length; index += 4) {
    for (const [channel, value] of rgb.entries()) {
      data[index + channel] = Math.round(
        ((data[index + channel] ?? 0) * value) / 255
      );
    }
  }
  const file = path.join(TINTED_DIR, `${name}.png`);
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(file);
  return file;
};

const fromSheet = (file: string): string => path.relative(RAW_DIR, file);

const effectCard = (
  name: FxSlotName,
  image: string,
  tint: string | undefined
) => {
  const slot = FX_SLOTS[name];
  const blend = slot.blend === "additive" ? "plus-lighter" : "normal";
  const tiles = Object.keys(CROPS)
    .map(
      (crop) =>
        `<div class="tile" style="background-image:url(${crop}.png)"><img src="${image}" style="mix-blend-mode:${blend}" alt=""></div>`
    )
    .join("");
  const color = tint ?? slot.anchor ?? "";
  return `${tiles}<p>${slot.blend} · ${slot.tint} <span class="swatch" style="background:${color}"></span> ${color}</p>`;
};

const iconCard = (image: string) =>
  Object.keys(CROPS)
    .map((crop) => {
      const plates = [24, 48]
        .map((size) => {
          const plate = Math.round(size / ICON_IN_PLATE);
          return `<span class="plate" style="width:${plate}px;height:${plate}px"><img src="${image}" width="${size}" height="${size}" alt=""></span>`;
        })
        .join("");
      return `<div class="tile icons" style="background-image:url(${crop}.png)">${plates}</div>`;
    })
    .join("");

const card = async (name: FxSlotName): Promise<string> => {
  if (!existsSync(masterPath(name))) {
    return `<section><h2>${name}</h2><p class="missing">No master yet.</p></section>`;
  }
  const tint = SAMPLE_TINT[name];
  const image = fromSheet(
    tint ? await writeTinted(name, tint) : masterPath(name)
  );
  const body = name.startsWith("icon-")
    ? iconCard(image)
    : effectCard(name, image, tint);
  return `<section><h2><label><input type="checkbox" value="${name}"> ${name}</label></h2>${body}</section>`;
};

mkdirSync(TINTED_DIR, { recursive: true });
await writeCrops();
const cards = await Promise.all(fxSlotNames().map(card));

writeFileSync(
  SHEET,
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FX atlas review</title>
<style>
  body { margin: 0; padding: 16px; background: #1b1714; color: #efe6d6; font: 14px/1.4 system-ui, sans-serif; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
  section { background: #26201b; border-radius: 8px; padding: 12px; }
  h2 { margin: 0 0 8px; font-size: 15px; }
  .tile { display: inline-flex; align-items: center; justify-content: center; gap: 16px; width: 160px; height: 160px; margin-right: 4px; background-size: cover; vertical-align: top; }
  .tile img { max-width: 100%; max-height: 100%; }
  .plate { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(20, 14, 10, 0.82); box-shadow: inset 0 0 0 1px rgba(255, 246, 223, 0.35); }
  .swatch { display: inline-block; width: 12px; height: 12px; border-radius: 2px; vertical-align: middle; }
  .missing { color: #c9a; }
  footer { position: sticky; bottom: 0; margin-top: 16px; padding: 12px; background: #2f2721; border-radius: 8px; }
  output { font-family: ui-monospace, monospace; }
</style>
</head>
<body>
<main>${cards.join("\n")}</main>
<footer>Rejected: <output id="rejected">none</output></footer>
<script>
  const out = document.getElementById("rejected");
  document.addEventListener("change", () => {
    const names = [...document.querySelectorAll("input:checked")].map((box) => box.value);
    out.textContent = names.length ? names.join(" ") : "none";
  });
</script>
</body>
</html>
`
);
console.log(`Contact sheet: ${SHEET}`);
