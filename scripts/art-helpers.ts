import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

export const promptBlock = (text: string): string =>
  `\`\`\`text\n${text}\n\`\`\``;

export const promptDocument = ({
  title,
  introduction,
  instructions,
  setup,
  items,
  fixes,
  exportSteps,
}: {
  readonly title: string;
  readonly introduction: string;
  readonly instructions: readonly string[];
  readonly setup: string;
  readonly items: readonly {
    readonly title: string;
    readonly prompt: string;
  }[];
  readonly fixes?: readonly string[];
  readonly exportSteps: readonly string[];
}): string => {
  const lines = [
    `# ${title}`,
    "",
    introduction,
    "",
    ...instructions,
    "",
    "## Setup message",
    "",
    promptBlock(setup),
    "",
  ];
  for (const item of items) {
    lines.push(`## ${item.title}`, "", promptBlock(item.prompt), "");
  }
  if (fixes) {
    lines.push("## Fixes", "", ...fixes.map((fix) => `- ${fix}`), "");
  }
  lines.push("## Export", "", ...exportSteps, "");
  return lines.join("\n");
};

export const writeImageGrid = async ({
  root,
  images,
  output,
  tile,
  columns = images.length,
}: {
  readonly root: string;
  readonly images: readonly string[];
  readonly output: string;
  readonly tile: { readonly width: number; readonly height: number };
  readonly columns?: number;
}) => {
  const tiles = await Promise.all(
    images.map((image) =>
      sharp(path.join(root, image))
        .resize(tile.width, tile.height, { fit: "cover" })
        .png()
        .toBuffer()
    )
  );
  await sharp({
    create: {
      width: tile.width * columns,
      height: tile.height * Math.ceil(tiles.length / columns),
      channels: 3,
      background: "#000",
    },
  })
    .composite(
      tiles.map((input, index) => ({
        input,
        left: (index % columns) * tile.width,
        top: Math.floor(index / columns) * tile.height,
      }))
    )
    .png()
    .toFile(output);
};

const writeSetReference = async ({
  source,
  output,
  size,
}: {
  readonly source: string | undefined;
  readonly output: string;
  readonly size: { readonly width: number; readonly height: number };
}): Promise<boolean> => {
  if (source === undefined || !existsSync(source)) {
    return false;
  }
  await sharp(source)
    .resize(size.width, size.height, { fit: "cover" })
    .png()
    .toFile(output);
  return true;
};

const writePromptFile = (directory: string, contents: string): void => {
  writeFileSync(path.join(directory, "prompts.md"), contents);
};

export const writeArtPromptSet = async ({
  root,
  directory,
  images,
  tile,
  columns,
  setReferenceSource,
  setReferenceSize,
  prompts,
}: {
  readonly root: string;
  readonly directory: string;
  readonly images: readonly string[];
  readonly tile: { readonly width: number; readonly height: number };
  readonly columns: number;
  readonly setReferenceSource: string | undefined;
  readonly setReferenceSize: {
    readonly width: number;
    readonly height: number;
  };
  readonly prompts: (hasSetReference: boolean) => string;
}): Promise<boolean> => {
  mkdirSync(directory, { recursive: true });
  await writeImageGrid({
    root,
    images,
    output: path.join(directory, "style-reference.png"),
    tile,
    columns,
  });
  const hasSetReference = await writeSetReference({
    source: setReferenceSource,
    output: path.join(directory, "set-reference.png"),
    size: setReferenceSize,
  });
  writePromptFile(directory, prompts(hasSetReference));
  return hasSetReference;
};
