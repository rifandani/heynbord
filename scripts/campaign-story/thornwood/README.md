# Thornwood Story Scenes, version 1

This macOS project uses fframes 1.3.0 with Skia on Metal. It produces fifteen 9-second Story Moments at 1280 × 720 and 30 fps: five each for the opening, the Boss scene and the ending of Region 4. The text, lore and shot plan are in the [storyboard](../../../docs/game/thornwood-storyboard.md). The game uses the delivery copy in `apps/web/public/story/thornwood/v1/`. See [integration checks](../../../docs/game/region-story-scenes.md#implementation-checks).

The project continues the [Glowcap Hollows scenes](../glowcap-hollows/README.md). `src/lib.rs` includes the motion toolkit `../hearthvale/src/fx.rs` with its shaders, the props `../red-mesas/src/mesa.rs` and the props `../glowcap-hollows/src/hollows.rs` with their shaders. A change in any of these files affects the earlier Regions too, so render them after it.

## How a moment plays

Each clip has its action from 0 to 5 s. From 5 to 9 s, every ambient motion repeats with a 4-second period: the giant's breath, falling leaves, light along the lanes and the vine, the song, the amber drops, the green lanterns, the mist, the sway of moss and the hops of the birds. When the clip ends, the game seeks back to 5 s, so the picture stays alive while the Player reads. The export puts a keyframe at frame 150, so the seek is fast. The poster is frame 269, which also continues into frame 150.

A seam test rendered each scene with one extra frame and compared frame 150 with frame 270. The RGB RMS difference was 0.99 or less for every moment, and 0.00 for eleven of them; the largest is one small anti-aliased spot on the vine of the road. Repeat the test after any motion change: set `CLIP_FRAMES` to 271 in `src/lib.rs`, render `Scene@150,Scene@270`, compare, and set it back. Tremors, roars and shakes must end by 5 s, and a shake in the hold must use whole cycles per 4 s (`rumble` in `src/boss.rs`).

The opening starts on the last frame of the Glowcap Hollows ending (inside the amber, over the Thornwood map). The difference between the two frames is 4.2 RGB RMS, mostly falling leaves and bubbles. The last ending moment starts on the coin of bone of the moment before it.

## Sources

- `src/opening.rs`, `src/boss.rs` and `src/ending.rs`: one `Scene` per moment.
  - Opening: the amber that melts off the frame and the bramble title, the sleeping giant with the Elves' song and the eyes in the Web Cave, the three cuts at night, the boar that tramples three stakes, and the vine of light along the Trail that wakes the giant's eye.
  - Boss: the giant wakes on the map, the drawn face with its name plate, the memory of the cutters and their green lanterns, the amber drop in front of the angry eye, and the lane challenge with the real Boss setup (a Bramble Nest in Lane 1, a Mountain Colossus in Lane 3).
  - Ending: the giant sits down, Lethiel's staff heals the cuts, the empty camp with the coins of bone, the Colossus card that assembles from rocks, and the dive through the coin into the Hollow Marches.
- `src/wood.rs`: Thornwood props (the face of the Old Bramble, its eyes, brows, cheeks and moss, the bark layer, beast eyes, the cutters, green lanterns, coins of bone, the purse, jars, knives, birds, falling leaves, brambles, sound rings and the thorny name plate) and the gradients.
- `src/shaders/bark.sksl`: the bark of the giant, irregular plates split by crevices.
- `src/audio.rs`: the review mix and the effect cue table. `produce.py` copies the cue table into `manifest.json`; `THORNWOOD` cues in `apps/web/src/features/campaign/story-scenes.ts` must match it.
- `prepare.py`: copies the paintings and card art, makes the static Cinzel Black font and copies the text from the storyboard. It then calls `audio.py`.
- `audio.py`: cuts, levels and compresses the CC0 audio. See [CREDITS.md](./CREDITS.md).

The Old Bramble has no card and no portrait. The close-ups draw its face in code with the bark shader, in `giant_face()`. A painted portrait can replace it later.

## Setup

Run these commands from the repository root. Use the Python environment of the [Hearthvale setup](../hearthvale/README.md#setup).

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/thornwood/prepare.py
rtk cargo build --release --locked --manifest-path scripts/campaign-story/thornwood/Cargo.toml
```

`prepare.py` expects the downloaded sources in `apps/web/art/campaign/raw/thornwood/story/source/` (listed in its `SOURCES.md`), and the Hearthvale, Red Mesas and Glowcap Hollows sources for the shared effects and the Cinzel font.

## Preview and review

```sh
rtk cargo run --release --manifest-path scripts/campaign-story/thornwood/Cargo.toml -- --locale en-us --review-audio preview 0s
```

`27s` starts the boar, `45s` starts the Boss scene, `54s` starts the face of the Old Bramble and `90s` starts the ending. Use `--locale id-id` for Indonesian, or leave out `--locale` for clean pixels. Space pauses; h/l seek one second; j/k step one frame; q closes the window.

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/thornwood/produce.py review
```

The review writes contact sheets, first, loop-start and last frames with SVGs, both language sheets, an audio waveform, and inspection and pop reports into `review/`.

## Export

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/thornwood/produce.py export
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/thornwood/produce.py publish
```

`export` renders each scene, compresses it (libx264 CRF 30, slow preset, yuv420p, keyframes at 0 and 5 s, fast start), makes WebP posters from the encoded frame 269, checks the format and writes `manifest.json`. `export --only boss` renders one Story Scene. `pack` re-compresses existing masters without a new render. `publish` replaces `apps/web/public/story/thornwood/v1/` with the clean delivery.

## Checks and limits

`inspect --fail-on warning` reports no problems in clean pixels or with either Locale's review text. `inspect --pops` reports the cuts between separate clips, fast actions (the knife flashes, the boar's horn rings, the falling cards, the rocks that assemble the Colossus card) and the flash of each impact; none of these is a still element that blinks by mistake. The reference mix measures −18.5 LUFS integrated and −1.0 dBTP, with no clipped samples.

Measured delivery sizes in bytes:

| Story Scene       | Video (5 clips) | Posters |     Audio |
| ----------------- | --------------: | ------: | --------: |
| Opening           |       3,888,250 | 384,722 |   782,530 |
| Boss              |       3,432,086 | 180,260 |   850,081 |
| Ending            |       2,809,685 | 181,348 |   808,357 |
| Version 1 targets |       4,000,000 | 400,000 | 1,000,000 |

All three Story Scenes are within the targets. The three busy map shots of the opening (`opening-01`, `opening-02` and `opening-05`) use CRF 32 and WebP quality 36; the other clips use CRF 30 and quality 40 (`TUNE` in `produce.py`). The game loads one clip at a time.

Nobody has listened to the audio or watched the encoded clips in the game yet. The music and effect choices rest on the creators' descriptions. Reading pace and story comprehension in both Locales still need the Player review.
