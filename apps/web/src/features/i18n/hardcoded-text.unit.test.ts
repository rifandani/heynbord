import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import enUS from "@/core/libs/i18n/locales/en-US";
import idID from "@/core/libs/i18n/locales/id-ID";

const SRC = path.join(import.meta.dirname, "..", "..");

/**
 * Directories that do not hold Player text: the UI primitives keep their
 * library labels, the Component Catalog is an internal design tool, and the
 * game dev panel is a developer tool (web ADR-0009).
 */
const EXCLUDED = ["core/components/ui", "features/dev-panel", "master-design"];

/** Attributes whose value a Player can hear or read. */
const TEXT_ATTRIBUTES = [
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "label",
  "placeholder",
  "title",
];

const ATTRIBUTE = new RegExp(
  `\\b(?<attribute>${TEXT_ATTRIBUTES.join("|")})\\s*=\\s*(?:"(?<doubleQuoted>[^"]*)"|'(?<singleQuoted>[^']*)')`,
  "gu"
);

/** The text of a JSX element, such as `<p>Something went wrong</p>`. */
const JSX_TEXT =
  /<(?<tag>[A-Za-z][\w.]*)[^<>]*>\s*(?<text>[A-Za-z][^<>{}]*)</gu;

/** Key names on a keyboard, such as `Esc`, are not text in one language. */
const KEY_TAG = "kbd";

interface Finding {
  readonly column: number;
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

/** Replaces each character except a newline, so line numbers do not move. */
const blankOut = (text: string) => text.replaceAll(/[^\n]/gu, " ");

/**
 * Removes comments while it keeps their length and line breaks. A `//` in a
 * string is not a comment; a `//` in a comment is.
 */
const stripComments = (source: string) => {
  let result = "";
  let index = 0;
  let quote: string | null = null;
  while (index < source.length) {
    const char = source[index] ?? "";
    const next = source[index + 1] ?? "";
    if (quote !== null) {
      result += char;
      if (char === "\\") {
        result += next;
        index += 2;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      result += char;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      result += blankOut(source.slice(index, stop));
      index = stop;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      result += blankOut(source.slice(index, stop));
      index = stop;
      continue;
    }
    result += char;
    index += 1;
  }
  return result;
};

const findingAt = (
  file: string,
  source: string,
  index: number,
  text: string
): Finding => {
  const before = source.slice(0, index);
  return {
    column: index - before.lastIndexOf("\n"),
    file,
    line: before.split("\n").length,
    text,
  };
};

/** Finds a literal that a Player reads or hears, and that no Catalog holds. */
const findHardcodedText = (source: string, file: string): Finding[] => {
  const findings: Finding[] = [];
  for (const match of source.matchAll(ATTRIBUTE)) {
    const value = (
      match.groups?.doubleQuoted ??
      match.groups?.singleQuoted ??
      ""
    ).trim();
    if (!/[A-Za-z]/u.test(value)) {
      continue;
    }
    findings.push(
      findingAt(
        file,
        source,
        match.index ?? 0,
        `${match.groups?.attribute ?? ""}="${value}"`
      )
    );
  }
  for (const match of source.matchAll(JSX_TEXT)) {
    const text = (match.groups?.text ?? "").trim();
    if (match.groups?.tag !== KEY_TAG && text !== "") {
      findings.push(findingAt(file, source, match.index ?? 0, text));
    }
  }
  return findings;
};

const isExcluded = (file: string) => {
  const relative = path.relative(SRC, file).split(path.sep).join("/");
  return EXCLUDED.some(
    (directory) =>
      relative === directory || relative.startsWith(`${directory}/`)
  );
};

const checkedComponents = () =>
  readdirSync(SRC, { recursive: true, encoding: "utf-8" })
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => path.join(SRC, file))
    .filter((file) => !isExcluded(file))
    .toSorted((a, b) => a.localeCompare(b));

describe("user-facing text", () => {
  it("uses Translation Keys in the checked components", () => {
    const findings = checkedComponents().flatMap((file) => {
      const source = stripComments(readFileSync(file, "utf-8"));
      return findHardcodedText(source, path.relative(SRC, file));
    });
    expect(findings).toEqual([]);
  });
});

describe("the hardcoded text check", () => {
  it("finds literal attributes and JSX text", () => {
    const source = `<button aria-label="Battle Board">Play</button>`;
    expect(findHardcodedText(source, "fixture.tsx")).toHaveLength(2);
  });

  it("ignores Translation Keys, decorative images and comments", () => {
    const source = stripComments(`
      // <p>Something went wrong</p>
      /* aria-label="Battle Board" */
      <img alt="" />
      <button aria-label={tr("battle.boardLabel")} />
    `);
    expect(findHardcodedText(source, "fixture.tsx")).toEqual([]);
  });
});

describe("the Battle Board label", () => {
  it("is in both Message Catalogs", () => {
    expect(enUS.battle.boardLabel).toBe("Battle Board");
    expect(idID.battle.boardLabel).toBe("Papan Pertempuran");
  });
});
