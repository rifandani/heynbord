# Battle budgets

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

Exact whole-Battle thresholds fail. The first-load, frame-rate and draw-call requirements stay unchanged. Opening a Stage Panel preloads its painting and FX image; it does not prepare an offline Battle. See [ADR-0018](../../apps/web/docs/adr/0018-battle-budgets-allow-larger-unit-models.md) and [performance records](./22-performance.md).

## Battle music optimization

### Record: 2026-10-30

Issue [#169](https://github.com/rifandani/heynbord/issues/169) requires smaller
published Battle tracks with the same compositions, duration, loop behavior,
stereo mix and supported formats.

The source files are the music files at commit
`810b384b767f1bc7aefc1a5e7c6f28bd0e04aefe`. The workspace was dirty. No source
music file had an existing local change. The published URLs and the music
catalog did not change. The result stings did not change.

| Track | Original bytes | Published bytes | Reduction |
| --- | ---: | ---: | ---: |
| Region 1 | 780,203 | 530,737 | 31.98% |
| Region 2 | 2,850,291 | 1,979,381 | 30.56% |
| Region 3 | 2,192,846 | 1,064,431 | 51.46% |
| Region 4 | 1,037,918 | 862,888 | 16.86% |
| Region 5 | 1,848,968 | 1,154,414 | 37.56% |
| Boss | 4,630,302 | 1,894,505 | 59.08% |
| Heynspire | 4,657,629 | 2,205,438 | 52.65% |
| Dungeons | 3,927,574 | 2,023,400 | 48.48% |
| Total | 21,925,731 | 11,715,194 | 46.57% |

Vorbis tracks use `oggenc` 1.4.3 with libvorbis 1.3.7 at quality 4. MP3 tracks
use FFmpeg 9.0.2 with libmp3lame at 160 kbit/s. Both channels and the original
44,100 Hz sample rate remain. No trim, resample, fade, crossfade, remix or
composition change is applied. Ogg stream serials are fixed per filename for
repeatable output.

The [machine record](../../scripts/music/battle-music-2026-10-30.json) contains
source and published SHA-256 hashes, exact byte counts, codec, sample rate,
stereo channel count, decoded frame count, duration, signal-to-error ratio,
loop seam difference and decoded peaks for every file.

### Repeat the conversion and checks

Install FFmpeg with libmp3lame and `oggenc` from vorbis-tools. Extract the
unchanged source files into a separate directory. Do not re-encode the
already optimized published files.

```sh
rtk proxy python3 - <<'PY'
from pathlib import Path
import subprocess

source = Path('/tmp/heynbord-battle-music-source')
source.mkdir(exist_ok=True)
commit = '810b384b767f1bc7aefc1a5e7c6f28bd0e04aefe'
files = [f'region-{n}.ogg' for n in range(1, 4)] + [
    'region-4.mp3', 'region-5.mp3', 'boss.ogg', 'heynspire.ogg', 'dungeons.ogg'
]
for name in files:
    data = subprocess.check_output([
        'git', 'show', f'{commit}:apps/web/public/music/{name}'
    ])
    (source / name).write_bytes(data)
PY
rtk proxy python3 scripts/music/optimize-battle-music.py \
  --source /tmp/heynbord-battle-music-source
```

The script decodes the source and output through FFmpeg. It fails if the
codec, sample rate, channel count or exact decoded frame count changes. It
also fails if the file does not become smaller, its signal-to-error ratio
falls below 18 dB, or the existing loop seam grows by more than 0.03 full
scale. All eight tracks passed. Their signal-to-error ratios range from
18.079 to 25.233 dB. These objective checks detect timing, large audio errors
and new seam discontinuities. They are not a human listening test.

The decoded Boss peak is 1.031462. Floating-point Web Audio retains this value;
the existing master gain of 0.35 keeps this track below full scale at maximum
music volume. The conversion adds no gain or normalization. Human listening
was not performed in this command-line pass.
