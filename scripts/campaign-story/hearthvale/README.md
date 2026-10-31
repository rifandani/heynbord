# Hearthvale Story Scenes, version 2

This macOS project uses fframes 1.3.0 with Skia on Metal. It produces fifteen 9-second Story Moments at 1280 × 720 and 30 fps: five each for the opening, the Boss scene and the ending. The text, lore and shot plan are in the [storyboard](../../../docs/game/scenes/hearthvale-storyboard.md). The game uses the delivery copy in `apps/web/public/story/hearthvale/v2/`. See [integration checks](../../../docs/game/23-region-story-scenes.md#implementation-checks).

## How a moment plays

Each clip has its action from 0 to 5 s. From 5 to 9 s, every ambient motion repeats with a 4-second period: particles, fog, light rays, flicker, rotation and pulses. When the clip ends, the game seeks back to 5 s, so the picture stays alive while the Player reads. The export puts a keyframe at frame 150, so the seek is fast. The poster is frame 269, which also continues into frame 150.

A seam test rendered each scene with one extra frame and compared frame 150 with frame 270. The RGB RMS difference was 0.34 or less for every moment, and 0.03 or less for the Boss moments. Two neighbouring frames differ by 0.24 to 4.9. Repeat the test after any motion change: set `CLIP_FRAMES` to 271 in `src/lib.rs`, render `Scene@150,Scene@270`, compare, and set it back.

## Sources

- `src/opening.rs`, `src/boss.rs` and `src/ending.rs`: one `Scene` per moment. The Boss scene is the hall at night, the Baron's entrance, the toll stamps, the faceless patron and the lane challenge. Animations are fframes timelines and springs, built once per scene.
- `src/fx.rs`: camera, particles, shader layers, coins, cards, candle, the Accord Seal and shared gradients.
- `src/shaders/`: SkSL shaders. `grade` re-lights the Region Maps (fire, storm, gold, dusk), `fog` draws clouds, smoke and dust, `rays` draws light shafts, `stone` draws the red stone under the coin paint. `noise.sksl` is shared; its `flow()` loops seamlessly every 4 s.
- `src/audio.rs`: the review mix and the effect cue table. `produce.py` copies the cue table into `manifest.json`; `STORY_CUES` in `apps/web/src/features/campaign/story-scenes.ts` must match it.
- `prepare.py`: copies the paintings (the two Region Maps and the Hearthvale Battle Painting), cuts the Baron out of the Dungeon 3 painting, makes the blurred vault background, copies four Orc card arts and the Shieldbearer card art, makes a static Cinzel Black font and copies the text from the storyboard. It then calls `audio.py`.
- `audio.py`: cuts, levels and compresses the CC0 audio in `source/audio-v2/`. See [CREDITS.md](./CREDITS.md).

## Setup

Run these commands from the repository root. Cargo output and the Python environment stay under the ignored `out/story-scenes/`.

```sh
rtk proxy brew install pkg-config ffmpeg x264 x265 opus nasm ninja
rtk proxy python3 -m venv out/story-scenes/venv
rtk proxy out/story-scenes/venv/bin/pip install -r scripts/campaign-story/hearthvale/requirements.txt
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hearthvale/prepare.py
rtk cargo build --release --locked --manifest-path scripts/campaign-story/hearthvale/Cargo.toml
```

`prepare.py` expects the downloaded sources in `apps/web/art/campaign/raw/hearthvale/story/source/`: `audio-v2/` (listed in its `SOURCES.md`), `audio/paper-1.mp3` and `fonts/Cinzel[wght].ttf` from [google/fonts](https://github.com/google/fonts/tree/main/ofl/cinzel).

## Preview and review

```sh
rtk cargo run --release --manifest-path scripts/campaign-story/hearthvale/Cargo.toml -- --locale en-us --review-audio preview 27s
```

`27s` starts at the Baron of the opening; `45s` starts the Boss scene. Use `--locale id-id` for Indonesian, or leave out `--locale` for clean pixels. Space pauses; h/l seek one second; j/k step one frame; q closes the window.

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hearthvale/produce.py review
```

The review writes contact sheets, first, loop-start and last frames with SVGs, both language sheets, an audio waveform, and inspection and pop reports into `review/`.

## Export

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hearthvale/produce.py export
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hearthvale/produce.py publish
```

`export --only boss` renders, packs and reviews one Story Scene and keeps the clips of the others. `export` renders each scene, compresses it (libx264 CRF 30, slow preset, yuv420p, keyframes at 0 and 5 s, fast start), makes WebP posters from the encoded frame 269, checks the format and writes `manifest.json`. `pack` re-compresses existing masters without a new render. `publish` replaces `apps/web/public/story/hearthvale/v2/` with the clean delivery.

## Checks and limits

`inspect` reports no problems. `inspect --pops` reports only fast falling coins, flying flakes, the wax drop and the cuts between separate clips; none is in a loop range. The reference mix measures −19.2 LUFS integrated and −2.0 dBTP, with no clipped samples. The Boss scene alone measures −19.2 LUFS integrated, with its highest true peak, the cannon, below −1 dBTP.

Measured delivery sizes in bytes:

| Story Scene       | Video (5 clips) | Posters |     Audio |
| ----------------- | --------------: | ------: | --------: |
| Opening           |       4,548,640 | 320,862 |   765,587 |
| Boss              |       3,206,832 | 179,792 |   757,339 |
| Ending            |       3,221,822 | 207,004 |   710,212 |
| Version 1 targets |       4,000,000 | 400,000 | 1,000,000 |

The opening video is 0.55 MB over the version 1 target. Version 2 has five moments instead of four and much more motion. The game loads one clip at a time, about 0.9 MB.

Nobody has listened to the audio or watched the encoded clips in the game yet. The music and effect choices rest on the creators' descriptions. Reading pace and story comprehension in both Locales still need the Player review.
