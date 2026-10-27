#!/usr/bin/env bun
/**
 * The Design Token Guard (issue 146, DESIGN.md "The Token Guard Rule").
 *
 * Two checks:
 *   1. No file under `apps/web/src` holds a raw color, except the token files:
 *      `core/styles/globals.css`, `core/components/game/tokens.ts` and a
 *      feature `tokens.ts` that the 3D scene reads. Test files are skipped.
 *   2. The `@theme` block in `globals.css`, the `colorMeta` record in
 *      `.impeccable/design.json` and the colors in `DESIGN.md` name the same
 *      colors.
 *
 * Usage:
 *   bun check:tokens             fail on a raw color and on a record mismatch
 *   bun check:tokens --verbose   print every raw color, not only the first 40
 *
 * The command is strict: a raw color in the app fails it. Issue 146 added the
 * guard as a warning while the feature conversion ran, then made it an error.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const WEB_SRC = path.join(REPO_ROOT, "apps", "web", "src");
const GLOBALS_CSS = path.join(WEB_SRC, "core", "styles", "globals.css");
const DESIGN_JSON = path.join(REPO_ROOT, ".impeccable", "design.json");
const DESIGN_MD = path.join(REPO_ROOT, "DESIGN.md");

const ARGS = new Set(process.argv.slice(2));
const VERBOSE = ARGS.has("--verbose");

/** The only files that may hold a raw color. */
const tokenFile = (relative: string): boolean =>
  relative === "core/styles/globals.css" ||
  relative === "core/components/game/tokens.ts" ||
  /^features\/.+\/tokens\.ts$/u.test(relative);

/** Test files are not part of the app surface. */
const testFile = (relative: string): boolean =>
  /(?:^|\/)(?:__tests__|__mocks__)\//u.test(relative) ||
  /\.(?:test|spec|stories)\.[^.]+$/u.test(relative);

/** Generated route and type files are not hand-written surfaces. */
const generatedFile = (relative: string): boolean =>
  /\.gen\.[^.]+$/u.test(relative);

const SCANNABLE = new Set([".ts", ".tsx", ".css", ".js", ".jsx", ".mjs"]);

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  /** `hex` or `arbitrary` (a Tailwind arbitrary color class or property). */
  readonly kind: "hex" | "arbitrary";
  readonly value: string;
}

// `_` is a space in a Tailwind arbitrary value, so a hex can touch it.
const HEX = /(?<![&\\])#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/gu;
const HEX_IN_VALUE = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/u;
const COLOR_FUNCTION =
  /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/u;
const COLOR_UTILITY =
  /(?<![\w-])(?:bg|text|border(?:-[trblxyse])?|fill|stroke|from|via|to|ring|ring-offset|outline|shadow|drop-shadow|decoration|divide|accent|caret|placeholder)-\[(?<value>[^\]\n]*)\]/gu;
const COLOR_PROPERTY =
  /(?<![\w-])\[(?:color|background(?:-color)?|border(?:-[a-z]+)*-color|fill|stroke|outline-color|text-decoration-color|caret-color|accent-color|box-shadow|text-shadow)\s*:[^\]\n]*\]/gu;

/**
 * The CSS named colors. `bg-[rebeccapurple]` is as raw as `bg-[#663399]`.
 * Kept as a list so that a non-color arbitrary value (`bg-[url(...)]`) passes.
 */
const NAMED_COLORS = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond
  blue blueviolet brown burlywood cadetblue chartreuse chocolate coral
  cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
  darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
  darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
  darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
  firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod
  gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon
  lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue
  lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
  mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod
  palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
  powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon
  sandybrown seagreen seashell sienna silver skyblue slateblue slategray
  slategrey snow springgreen steelblue tan teal thistle tomato transparent
  turquoise violet wheat white whitesmoke yellow yellowgreen currentcolor`.split(
    /\s+/u
  )
);

const isColorValue = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase();
  return (
    HEX_IN_VALUE.test(trimmed) ||
    COLOR_FUNCTION.test(trimmed) ||
    NAMED_COLORS.has(trimmed)
  );
};

const collectFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
};

/** A comment line is prose: a color there is not painted. */
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/u;

const scanFile = (full: string): Violation[] => {
  const relative = path.relative(WEB_SRC, full).split(path.sep).join("/");
  const violations: Violation[] = [];
  const lines = readFileSync(full, "utf-8").split("\n");

  for (const [index, line] of lines.entries()) {
    if (COMMENT_LINE.test(line)) {
      continue;
    }
    // Find arbitrary color classes and properties first, then blank them so
    // that a hex inside `bg-[#123456]` is reported once, as the class.
    const spans: [number, number][] = [];
    for (const match of line.matchAll(COLOR_UTILITY)) {
      if (!isColorValue(match.groups?.value ?? "")) {
        continue;
      }
      spans.push([match.index ?? 0, (match.index ?? 0) + match[0].length]);
      violations.push({
        file: relative,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        kind: "arbitrary",
        value: match[0],
      });
    }
    for (const match of line.matchAll(COLOR_PROPERTY)) {
      const value = match[0].slice(match[0].indexOf(":") + 1);
      if (!isColorValue(value)) {
        continue;
      }
      spans.push([match.index ?? 0, (match.index ?? 0) + match[0].length]);
      violations.push({
        file: relative,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        kind: "arbitrary",
        value: match[0],
      });
    }

    let masked = line;
    if (spans.length > 0) {
      const chars = [...line];
      for (const [start, end] of spans) {
        for (let at = start; at < end; at += 1) {
          chars[at] = " ";
        }
      }
      masked = chars.join("");
    }

    for (const match of masked.matchAll(HEX)) {
      violations.push({
        file: relative,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        kind: "hex",
        value: match[0],
      });
    }
  }

  return violations;
};

const byPosition = (a: Violation, b: Violation): number =>
  a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column;

const printRawColors = (violations: readonly Violation[]): void => {
  const files = new Set(violations.map((violation) => violation.file));
  console.log(
    `\nRaw colors: ${violations.length} in ${files.size} ${
      files.size === 1 ? "file" : "files"
    }.`
  );
  if (violations.length === 0) {
    return;
  }

  const limit = VERBOSE ? violations.length : 40;
  for (const violation of violations.slice(0, limit)) {
    const at = `${violation.file}:${violation.line}:${violation.column}`;
    console.log(`  ${at}  ${violation.kind}  ${violation.value}`);
  }
  if (limit < violations.length) {
    console.log(
      `  … ${violations.length - limit} more. Run \`bun check:tokens --verbose\` for all.`
    );
  }
  console.log(
    `
A raw color belongs in a token file:
  apps/web/src/core/styles/globals.css
  apps/web/src/core/components/game/tokens.ts
  apps/web/src/features/<name>/tokens.ts
Use a token utility (bg-night-plate, text-gold) or a semantic alias in a
component. A new color adds a token and a line in DESIGN.md.`
  );
};

/** Remove CSS comments, so a commented token is not a definition. */
const stripComments = (css: string): string =>
  css.replaceAll(/\/\*[\s\S]*?\*\//gu, (comment) =>
    comment.replaceAll(/[^\n]/gu, " ")
  );

/** The `--color-*` names in the non-inline `@theme` block of a stylesheet. */
const themeColors = (css: string): Set<string> => {
  const clean = stripComments(css);
  const names = new Set<string>();
  let at = clean.indexOf("@theme");
  while (at !== -1) {
    let cursor = at + "@theme".length;
    while (/\s/u.test(clean[cursor] ?? "")) {
      cursor += 1;
    }
    if (clean.startsWith("inline", cursor)) {
      at = clean.indexOf("@theme", cursor + "inline".length);
      continue;
    }
    if (clean[cursor] !== "{") {
      at = clean.indexOf("@theme", cursor);
      continue;
    }

    const bodyStart = cursor + 1;
    let depth = 1;
    cursor = bodyStart;
    while (cursor < clean.length && depth > 0) {
      if (clean[cursor] === "{") {
        depth += 1;
      } else if (clean[cursor] === "}") {
        depth -= 1;
      }
      cursor += 1;
    }
    for (const match of clean
      .slice(bodyStart, cursor - 1)
      .matchAll(/--color-(?<name>[a-z0-9-]+)\s*:/gu)) {
      names.add(match.groups?.name ?? "");
    }
    at = clean.indexOf("@theme", cursor);
  }
  return names;
};

/** The `colors:` names in the DESIGN.md front matter. */
const designColors = (markdown: string): Set<string> => {
  const frontMatter = /^---\r?\n(?<frontMatter>[\s\S]*?)\r?\n---/u.exec(
    markdown
  )?.groups?.frontMatter;
  if (!frontMatter) {
    throw new Error("DESIGN.md has no front matter");
  }
  const names = new Set<string>();
  let inColors = false;
  for (const line of frontMatter.split(/\r?\n/u)) {
    if (/^colors:\s*$/u.test(line)) {
      inColors = true;
      continue;
    }
    if (inColors && /^\S/u.test(line)) {
      break;
    }
    const name = /^ {2}(?<name>[a-z0-9-]+):/u.exec(line)?.groups?.name;
    if (inColors && name) {
      names.add(name);
    }
  }
  return names;
};

interface ColorMeta {
  readonly role?: string;
  readonly displayName?: string;
  readonly canonical?: string;
  readonly tonalRamp?: readonly string[];
}

interface DesignRecord {
  readonly extensions?: { readonly colorMeta?: Record<string, ColorMeta> };
}

const recordErrors = (): string[] => {
  const theme = themeColors(readFileSync(GLOBALS_CSS, "utf-8"));
  // SAFETY: `.impeccable/design.json` is a repo-owned file. The check reads
  // only the keys of `extensions.colorMeta`; a missing field is an error here.
  const record = JSON.parse(readFileSync(DESIGN_JSON, "utf-8")) as DesignRecord;
  const meta = new Set(Object.keys(record.extensions?.colorMeta ?? {}));
  const design = designColors(readFileSync(DESIGN_MD, "utf-8"));
  const errors: string[] = [];

  for (const name of [...theme].toSorted()) {
    if (!meta.has(name)) {
      errors.push(
        `--color-${name} is in the @theme block but has no colorMeta entry in .impeccable/design.json`
      );
    }
    if (!design.has(name)) {
      errors.push(
        `--color-${name} is in the @theme block but has no line in DESIGN.md`
      );
    }
  }
  for (const name of [...meta].toSorted()) {
    if (!theme.has(name)) {
      errors.push(
        `colorMeta.${name} in .impeccable/design.json has no --color-${name} in the @theme block`
      );
    }
  }
  for (const name of [...design].toSorted()) {
    if (!theme.has(name)) {
      errors.push(
        `DESIGN.md names the color ${name} but the @theme block has no --color-${name}`
      );
    }
    if (!meta.has(name)) {
      errors.push(
        `DESIGN.md names the color ${name} but .impeccable/design.json has no colorMeta.${name}`
      );
    }
  }
  return errors;
};

const files = collectFiles(WEB_SRC)
  .filter((full) => SCANNABLE.has(path.extname(full)))
  .map((full) => path.relative(WEB_SRC, full).split(path.sep).join("/"))
  .filter(
    (relative) =>
      !tokenFile(relative) && !testFile(relative) && !generatedFile(relative)
  )
  .toSorted();

const violations = files
  .flatMap((relative) => scanFile(path.join(WEB_SRC, relative)))
  .toSorted(byPosition);

const errors = recordErrors();

printRawColors(violations);
console.log("\nDesign record:");
if (errors.length === 0) {
  console.log("  The @theme block, colorMeta and DESIGN.md agree.");
} else {
  for (const error of errors) {
    console.log(`  ${error}`);
  }
}

if (errors.length > 0) {
  console.error(
    `\ncheck:tokens failed: ${errors.length} design-record ${
      errors.length === 1 ? "error" : "errors"
    }.`
  );
  process.exit(1);
}

if (violations.length > 0) {
  console.error(
    `\ncheck:tokens failed: ${violations.length} raw ${
      violations.length === 1 ? "color" : "colors"
    }.`
  );
  process.exit(1);
}
