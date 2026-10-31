# Red Mesas Story Scenes, version 1

This macOS project uses fframes 1.3.0 with Skia on Metal. It produces fifteen 9-second Story Moments at 1280 × 720 and 30 fps: five each for the opening, the Boss scene and the ending of Region 2. The text, lore and shot plan are in the [storyboard](../../../docs/game/scenes/red-mesas-storyboard.md). The game uses the delivery copy in `apps/web/public/story/red-mesas/v1/`. See [integration checks](../../../docs/game/23-region-story-scenes.md#implementation-checks).

The project continues the [Hearthvale scenes](../hearthvale/README.md) and shares their motion toolkit: `src/lib.rs` includes `../hearthvale/src/fx.rs` and its shaders. A change there affects both Regions, so render both after it.

## How a moment plays

Each clip has its action from 0 to 5 s. From 5 to 9 s, every ambient motion repeats with a 4-second period: particles, smoke, light rays, flicker, carts, gears, the paint belt and pulses. When the clip ends, the game seeks back to 5 s, so the picture stays alive while the Player reads. The export puts a keyframe at frame 150, so the seek is fast. The poster is frame 269, which also continues into frame 150.

A seam test rendered each scene with one extra frame and compared frame 150 with frame 270. The RGB RMS difference was 0.37 or less for every moment, and 0.00 for eleven of them. Repeat the test after any motion change: set `CLIP_FRAMES` to 271 in `src/lib.rs`, render `Scene@150,Scene@270`, compare, and set it back.

## Sources

- `src/opening.rs`, `src/boss.rs` and `src/ending.rs`: one `Scene` per moment.
  - Opening: the red land at dawn (it starts on the last frame of the Hearthvale ending), a cut-away of the goblin mines with a powder blast, Snikkit's cart entrance, the brass lens that shows painted stone, and the fuse that runs the Trail to the Throne Hall.
  - Boss: the Throne Hall's scrap gate and rocket, Snikkit's cart out of the mine tunnel, the paint works, the deep tunnel and the glowcap cart, and the lane challenge with the real Boss setup (Junk Barricades in Lanes 1 and 3, Grukka in Lane 2).
  - Ending: the bucket crown falls and rolls, Grukka bites a coin, Grukka wears the crown in his Epic frame, the glowcap crate and the sealed letter, and the deep tunnel that opens on the Glowcap Hollows.
- `src/mesa.rs`: Red Mesas props (mine cart, coin heap, glowcaps, bucket crown, vultures, dust devil, cut seal, name plate, the perspective tunnel), impacts and gradients.
- `src/shaders/strata.sksl`: the red rock of the cut-away. The other shaders come from the Hearthvale project.
- `src/audio.rs`: the review mix and the effect cue table. `produce.py` copies the cue table into `manifest.json`; `STORY_CUES` for `red-mesas` in `apps/web/src/features/campaign/story-scenes.ts` must match it.
- `cutout.py`: cuts Snikkit and Grukka out of their card art with rembg. Run it once; it writes to the raw `source/cutouts/` folder.
- `prepare.py`: copies the paintings and card art, cleans the cut-outs, makes the static Cinzel Black font and copies the text from the storyboard. It then calls `audio.py`.
- `audio.py`: cuts, levels and compresses the CC0 audio. See [CREDITS.md](./CREDITS.md).

## Setup

Run these commands from the repository root. Use the Python environment of the [Hearthvale setup](../hearthvale/README.md#setup). The cut-outs need a separate environment with rembg, because rembg needs other package versions.

```sh
rtk proxy python3 -m venv out/story-scenes/cutout-venv
rtk proxy out/story-scenes/cutout-venv/bin/pip install "rembg[cpu]" pillow coverage
rtk proxy out/story-scenes/cutout-venv/bin/python scripts/campaign-story/red-mesas/cutout.py
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/red-mesas/prepare.py
rtk cargo build --release --locked --manifest-path scripts/campaign-story/red-mesas/Cargo.toml
```

`prepare.py` expects the downloaded sources in `apps/web/art/campaign/raw/red-mesas/story/source/` (listed in its `SOURCES.md`), the cut-outs from `cutout.py`, and the Hearthvale sources for the shared effects and the Cinzel font.

## Preview and review

```sh
rtk cargo run --release --manifest-path scripts/campaign-story/red-mesas/Cargo.toml -- --locale en-us --review-audio preview 0s
```

`9s` starts the mine blast, `45s` starts the Boss scene and `90s` starts the ending. Use `--locale id-id` for Indonesian, or leave out `--locale` for clean pixels. Space pauses; h/l seek one second; j/k step one frame; q closes the window.

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/red-mesas/produce.py review
```

The review writes contact sheets, first, loop-start and last frames with SVGs, both language sheets, an audio waveform, and inspection and pop reports into `review/`.

## Export

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/red-mesas/produce.py export
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/red-mesas/produce.py publish
```

`export` renders each scene, compresses it (libx264 CRF 30, slow preset, yuv420p, keyframes at 0 and 5 s, fast start), makes WebP posters from the encoded frame 269, checks the format and writes `manifest.json`. `export --only boss` renders one Story Scene. `pack` re-compresses existing masters without a new render. `publish` replaces `apps/web/public/story/red-mesas/v1/` with the clean delivery.

## Checks and limits

`inspect` reports no problems in clean pixels or with either Locale's review text. `inspect --pops` reports the cuts between separate clips, impact shakes, fast strokes (the rail, the fuse, the sweep over Grukka's frame) and the coin that jumps out of the paint; none of these is a still element that blinks. The reference mix measures −19.6 LUFS integrated and −1.5 dBTP, with no clipped samples.

Measured delivery sizes in bytes:

| Story Scene       | Video (5 clips) | Posters |     Audio |
| ----------------- | --------------: | ------: | --------: |
| Opening           |       4,608,476 | 255,880 |   657,902 |
| Boss              |       2,697,027 | 126,888 |   718,536 |
| Ending            |       2,522,850 | 154,470 |   665,070 |
| Version 1 targets |       4,000,000 | 400,000 | 1,000,000 |

The opening video is 0.61 MB over the target, like the Hearthvale opening: the mine blast and the fuse along the Trail change most of the frame. The game loads one clip at a time, at most 1.3 MB.

Nobody has listened to the audio or watched the encoded clips in the game yet. The music and effect choices rest on the creators' descriptions. Reading pace and story comprehension in both Locales still need the Player review.
