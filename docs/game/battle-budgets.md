# Battle budget measurement

Run from the repository root:

```sh
bun check:battle-budget
```

The command builds once and checks three explicit configuration files:

- `apps/web/scripts/battle-budget/stage-1-1.json`: Stage 1-1, level 1, Vanguard Starter Deck and Standard appearance/cosmetics.
- `apps/web/scripts/battle-budget/stage-5-10.json`: Stage 5-10, level 30, the 14-card Vanguard Archetype plus one Epic Iron Bulwark, Gold Crest portrait, Royal Plate Gear look, Hollow Moon Board skin and Gold Fleur Card Back. This is a declared valid 15-card late-game Deck. It is a budget fixture, not a win-rate claim.
- `apps/web/scripts/battle-budget/stage-5-10-hero.json`: the same Battle with the Hero Model feature on and the Dawn Gaze person in the Iron Vine look. This is the largest published appearance (536,656 bytes), so it is the highest asset-cost Hero check.

Hero Models are always enabled. The third fixture measures the whole-Battle
budget and the separate 10,000,000-byte Hero appearance ceiling with the
largest published Hero appearance. The first two fixtures use their
selected portraits but no Hero Model cost beyond the normal Battle set.

For a different configuration, supply a complete JSON file. Each file must state the Stage, level, Player Deck and Class, portrait, Gear look, Board skin, Card Back and enabled features. Use `null` for Standard. The command rejects an incomplete configuration or an invalid Player Deck.

```sh
bun web measure:battle-budget \
  --config apps/web/scripts/battle-budget/stage-1-1.json \
  --config apps/web/scripts/battle-budget/stage-5-10.json \
  --config apps/web/scripts/battle-budget/stage-5-10-hero.json \
  --report artifacts/battle-budget.json
```

Paths are relative to the repository root. The command writes the time, commit, dirty status, build versions and public feature flags, complete configuration, graph digest, included file URLs, per-file byte counts and SHA-256 values to the JSON record. A missing required asset or a failed budget exits unsuccessfully. CI runs the command on pushes to main and pull requests.

## Counting rules

Use decimal bytes. Assets must total less than 50,000,000 published bytes before HTTP compression. A warm cache gives no credit. Count each URL once across both Decks, each start Unit, possible Tokens and Boss Rule summons. Include original card paintings, every Unit Model that can appear, selected appearance and cosmetics, painting, FX and music. Read both result stings and count only the larger one.

Count all required additional Battle JavaScript once per emitted chunk at gzip level 9. The total must be less than 5,000,000 bytes. Read the production `/play` HTML and the emitted dependency graph from the same build. Exclude the entry, the Play route and their static imports. Follow static and lazy edges from the Battle entry. Stop at an initial chunk before following its lazy edges, because those can open unrelated screens. The graph uses module roles, not hashed filename patterns. Count mixed chunks conservatively, including any reachable optional code that the build retains. This is a conservative reachable-graph total, not a measured browser transfer.

The current Meshopt decoder is JavaScript inside the loader chunk. It has no external decoder download. Texture-free, vertex-colored models need no KTX2 decoder assets. Count external model images and buffers when present. Models with KTX2 images also require the local Basis transcoder JavaScript and WASM; count their published bytes as assets and the JavaScript at gzip level 9. Every Unit Model loads before the Board shows. Requesting Hero Models without a corresponding production chunk fails. The separate Hero appearance ceiling is at most 10,000,000 bytes and gives no extra whole-Battle allowance.

Exact whole-Battle thresholds fail. The first-load, frame-rate and draw-call requirements stay unchanged. Opening a Stage Panel preloads its painting and FX image; it does not prepare an offline Battle. See [ADR-0018](../../apps/web/docs/adr/0018-battle-budgets-allow-larger-unit-models.md), [performance records](./performance.md) and the [release checklist](./release-checklist.md).
