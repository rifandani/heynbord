# Design tokens

- One theme. Use a token utility or a semantic alias. Do not write a hex value or an arbitrary color class (`bg-[#123456]`, `text-[rgb(...)]`).
- Raw colors are allowed only in `src/core/styles/globals.css`, `src/core/components/game/tokens.ts` (3D game data) and `src/features/<name>/tokens.ts` (3D feature data). Tests are skipped.
- A new color needs a `--color-*` token in the `@theme` block, a `colorMeta` entry in `.impeccable/design.json`, and a line in the `colors` front matter of `DESIGN.md`.
- `bun check:tokens` fails on a raw color or a record mismatch. CI runs it with `--warn` until the feature conversion ends.
