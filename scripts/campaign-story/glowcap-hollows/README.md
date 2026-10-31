# Glowcap Hollows Story Scenes, version 1

This macOS project uses fframes 1.3.0 with Skia on Metal. It produces fifteen 9-second Story Moments at 1280 × 720 and 30 fps: five each for the opening, the Boss scene and the ending of Region 3. The text, lore and shot plan are in the [storyboard](../../../docs/game/scenes/glowcap-hollows-storyboard.md). The game uses the delivery copy in `apps/web/public/story/glowcap-hollows/v1/`. See [integration checks](../../../docs/game/23-region-story-scenes.md#implementation-checks).

The project continues the [Red Mesas scenes](../red-mesas/README.md). `src/lib.rs` includes the motion toolkit `../hearthvale/src/fx.rs` with its shaders, and the props `../red-mesas/src/mesa.rs` with its shader. A change in either file affects the earlier Regions too, so render them after it.

## How a moment plays

Each clip has its action from 0 to 5 s. From 5 to 9 s, every ambient motion repeats with a 4-second period: spores, fireflies, glow, falling leaves, light along the lines, the poison drop, the amber drops and the sway of figures. When the clip ends, the game seeks back to 5 s, so the picture stays alive while the Player reads. The export puts a keyframe at frame 150, so the seek is fast. The poster is frame 269, which also continues into frame 150.

A seam test rendered each scene with one extra frame and compared frame 150 with frame 270. The RGB RMS difference was 0.39 or less for every moment, and 0.00 for ten of them. Repeat the test after any motion change: set `CLIP_FRAMES` to 271 in `src/lib.rs`, render `Scene@150,Scene@270`, compare, and set it back. `bloom_rest` in `src/hollows.rs` lands a late spring exactly at 5 s, so that it does not break the seam.

The opening starts on the last frame of the Red Mesas ending (the tunnel, the round glimpse and the faint cut seal). The difference between the two frames is 13.5 RGB RMS, mostly spore positions. The last ending moment starts on the last frame of the amber close-up before it.

## Sources

- `src/opening.rs`, `src/boss.rs` and `src/ending.rs`: one `Scene` per moment.
  - Opening: the rush out of the deep tunnel and the ring of light that wakes the glowcaps, the grove at dusk with the three Elf signs (a wound that closes, poison, a root), the walls and the jaw trap, the arrow from the dark at the tunnel mouth, and the wisp along the Trail to the Grove Hall.
  - Boss: the steps and the woven door of the Grove Hall, Lady Glimmerbough's reveal, the vision in lines of light, the shaft where glowcaps go down and amber comes up, and the lane challenge with the real Boss setup (a Bramble Nest and the Canopy Vinewarden in the middle Lane).
  - Ending: the roots let go, the three seals that match, the amber with its black thorn, Lethiel's card in a frame of vines, and the dive through the amber into the Thornwood.
- `src/hollows.rs`: Glowcap Hollows props (Lady Glimmerbough, roots, leaves, thorns, the arrow, eyes, the goblin wall, the trap, letters, the cracked coin, amber, the vine name plate, cap glows), the caustic shader and the gradients.
- `src/shaders/caustic.sksl`: slow light inside amber and the vision.
- `src/audio.rs`: the review mix and the effect cue table. `produce.py` copies the cue table into `manifest.json`; `GLOWCAP_HOLLOWS` cues in `apps/web/src/features/campaign/story-scenes.ts` must match it.
- `prepare.py`: copies the paintings and card art, makes the static Cinzel Black font and copies the text from the storyboard. It then calls `audio.py`.
- `audio.py`: cuts, levels and compresses the CC0 audio. See [CREDITS.md](./CREDITS.md).

Lady Glimmerbough has no card and no painting. She is drawn in code, backlit, in `glimmerbough()`. A painted portrait can replace her later.

## Setup

Run these commands from the repository root. Use the Python environment of the [Hearthvale setup](../hearthvale/README.md#setup).

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/glowcap-hollows/prepare.py
rtk cargo build --release --locked --manifest-path scripts/campaign-story/glowcap-hollows/Cargo.toml
```

`prepare.py` expects the downloaded sources in `apps/web/art/campaign/raw/glowcap-hollows/story/source/` (listed in its `SOURCES.md`), and the Hearthvale and Red Mesas sources for the shared effects and the Cinzel font.

## Preview and review

```sh
rtk cargo run --release --manifest-path scripts/campaign-story/glowcap-hollows/Cargo.toml -- --locale en-us --review-audio preview 0s
```

`27s` starts the arrow, `45s` starts the Boss scene, `54s` starts Lady Glimmerbough and `90s` starts the ending. Use `--locale id-id` for Indonesian, or leave out `--locale` for clean pixels. Space pauses; h/l seek one second; j/k step one frame; q closes the window.

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/glowcap-hollows/produce.py review
```

The review writes contact sheets, first, loop-start and last frames with SVGs, both language sheets, an audio waveform, and inspection and pop reports into `review/`.

## Export

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/glowcap-hollows/produce.py export
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/glowcap-hollows/produce.py publish
```

`export` renders each scene, compresses it (libx264 CRF 30, slow preset, yuv420p, keyframes at 0 and 5 s, fast start), makes WebP posters from the encoded frame 269, checks the format and writes `manifest.json`. `export --only boss` renders one Story Scene. `pack` re-compresses existing masters without a new render. `publish` replaces `apps/web/public/story/glowcap-hollows/v1/` with the clean delivery.

## Checks and limits

`inspect --fail-on warning` reports no problems in clean pixels or with either Locale's review text. `inspect --pops` reports the cuts between separate clips, fast particles (the spore column, the spiral of seeds), the eyes that open and blink, and the poison drop; none of these is a still element that blinks by mistake. The reference mix measures −21.2 LUFS integrated and −2.4 dBTP, with no clipped samples.

Measured delivery sizes in bytes:

| Story Scene       | Video (5 clips) | Posters |     Audio |
| ----------------- | --------------: | ------: | --------: |
| Opening           |       3,328,302 | 211,620 |   655,494 |
| Boss              |       2,569,205 | 117,136 |   717,598 |
| Ending            |       2,935,363 | 232,758 |   654,279 |
| Version 1 targets |       4,000,000 | 400,000 | 1,000,000 |

All three Story Scenes are within the targets. The game loads one clip at a time.

Nobody has listened to the audio or watched the encoded clips in the game yet. The music and effect choices rest on the creators' descriptions. Reading pace and story comprehension in both Locales still need the Player review.
