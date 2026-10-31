# Hollow Marches Story Scenes, version 1

This macOS project uses fframes 1.3.0 with Skia on Metal. It produces fifteen 9-second Story Moments at 1280 × 720 and 30 fps: five each for the opening, the Boss scene and the ending of Region 5, the last Region of the Campaign. The text, lore and shot plan are in the [storyboard](../../../docs/game/scenes/hollow-marches-storyboard.md). The game uses the delivery copy in `apps/web/public/story/hollow-marches/v1/`. See [integration checks](../../../docs/game/23-region-story-scenes.md#implementation-checks).

The project continues the [Thornwood scenes](../thornwood/README.md). `src/lib.rs` includes the motion toolkit `../hearthvale/src/fx.rs` with its shaders, the props `../red-mesas/src/mesa.rs`, `../glowcap-hollows/src/hollows.rs` and `../thornwood/src/wood.rs` (the coins of bone, the purse and the green fire). This project changes none of these files. A change in any of them affects the earlier Regions too, so render them after it.

## How a moment plays

Each clip has its action from 0 to 5 s. From 5 to 9 s, every ambient motion repeats with a 4-second period: the mist tide, snow and frost dust, the walk of the beasts, the green fires, the lanterns of the court, the Queen's eye lights and the floating stones of Heynspire. When the clip ends, the game seeks back to 5 s, so the picture stays alive while the Player reads. The export puts a keyframe at frame 150, so the seek is fast. The poster is frame 269, which also continues into frame 150.

A seam test rendered each scene with one extra frame and compared frame 150 with frame 270. The RGB RMS difference was 0.00 for fourteen moments and 0.20 for the challenge (a few streaks of the blizzard). Repeat the test after any motion change: set `CLIP_FRAMES` to 271 in `src/lib.rs`, render `Scene@150` and `Scene@270`, compare, and set it back. Impacts and shakes must end by 5 s; titles and plates land on their rest values between 4.3 and 5 s (`frost_title` in `src/marsh.rs`).

The opening starts on the last frame of the Thornwood ending (the Hollow Marches map in cold mist, with the cut seal). It draws the same props on the clock of that frame (`TW_END` in `src/opening.rs`), and `fog_at` draws the fog on that clock too. The difference between the two frames is 0.00 RGB RMS.

## Sources

- `src/opening.rs`, `src/boss.rs` and `src/ending.rs`: one `Scene` per moment.
  - Opening: the pull-back over the frozen marsh with the frost title, the rise up through the ice to the frost beasts and the tremor from the west, the shadow of the Colossus and the wisp of the alarm, the Bone Ferry and the chains of the Witchfire Bridge (a rack focus), and the line of green fire to the gate of Marrow Castle.
  - Boss: the fly-through the ribs of the hall to the bored Queen with her name plate, the accusation in an arc, the coins on the floor and the court, the coin of bone in a rack focus to her delighted face, and the challenge with the real Boss setup (a Bone Rampart in Lane 2, Column 10, a Hushbow behind it, and Blizzard).
  - Ending: the camera through the melting window to the beasts that walk home, the court that bows, the coin of tower stone that rises to the Queen's fingers, the castle wall that folds into the Bone Rampart card, and the crane up to Heynspire.
- `src/marsh.rs`: Hollow Marches props (Queen Marrow, her throne, the ribs of the hall, cut-out figures, frost titles and the bone plate, reeds, crystals, mist, the ferry, chains, the wisp, the coin of tower stone, Heynspire and the blizzard spiral) and the gradients and filters.
- `src/shaders/ice.sksl`: ice and frost: cracked cells, frost ferns and a melt line from the edges. `src/shaders/bonewall.sksl`: the bone-white stone of Marrow Castle.
- `src/cutouts.rs`: the pixel size of each prepared cut-out, written by `prepare.py`.
- `src/audio.rs`: the review mix and the effect cue table. `produce.py` copies the cue table into `manifest.json`; `HOLLOW_MARCHES` cues in `apps/web/src/features/campaign/story-scenes.ts` must match it.
- `cutout.py`: cuts the court, the dead of the marsh, the frost beasts and the Colossus out of their card art with rembg. Run it once; it writes to the raw `source/cutouts/` folder.
- `prepare.py`: copies the paintings and card art, cleans and scales the cut-outs, makes the static Cinzel Black font and copies the text from the storyboard. It then calls `audio.py`.
- `audio.py`: cuts, levels and compresses the CC0 audio. See [CREDITS.md](./CREDITS.md).

Queen Marrow has no card and no portrait. `queen()` draws her in code: tall and thin, a crown of bone, violet robes with a bodice of bone ribs, a calm mask of bone and green light in the eye sockets. A painted portrait can replace her later.

## Setup

Run these commands from the repository root. Use the Python environment of the [Hearthvale setup](../hearthvale/README.md#setup). The cut-outs need the separate rembg environment of the [Red Mesas setup](../red-mesas/README.md).

```sh
rtk proxy out/story-scenes/cutout-venv/bin/python scripts/campaign-story/hollow-marches/cutout.py
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hollow-marches/prepare.py
rtk cargo build --release --locked --manifest-path scripts/campaign-story/hollow-marches/Cargo.toml
```

`prepare.py` expects the cut-outs in `apps/web/art/campaign/raw/hollow-marches/story/source/` (listed in its `SOURCES.md`), and the Hearthvale, Red Mesas, Glowcap Hollows and Thornwood sources for the shared effects, the music and the Cinzel font.

## Preview and review

```sh
rtk cargo run --release --manifest-path scripts/campaign-story/hollow-marches/Cargo.toml -- --locale en-us --review-audio preview 0s
```

`9s` starts the rise through the ice, `45s` starts the Boss scene, `81s` starts the challenge and `90s` starts the ending. Use `--locale id-id` for Indonesian, or leave out `--locale` for clean pixels. Space pauses; h/l seek one second; j/k step one frame; q closes the window.

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hollow-marches/produce.py review
```

The review writes contact sheets, first, loop-start and last frames with SVGs, both language sheets, an audio waveform, and inspection and pop reports into `review/`.

## Export

```sh
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hollow-marches/produce.py export
rtk proxy out/story-scenes/venv/bin/python scripts/campaign-story/hollow-marches/produce.py publish
```

`export` renders each scene, compresses it (libx264 CRF 30, slow preset, yuv420p, keyframes at 0 and 5 s, fast start), makes WebP posters from the encoded frame 269, checks the format and writes `manifest.json`. `export --only boss` renders one Story Scene. `pack` re-compresses existing masters without a new render. `publish` replaces `apps/web/public/story/hollow-marches/v1/` with the clean delivery.

## Checks and limits

`inspect --fail-on warning` reports no problems in clean pixels or with either Locale's review text (533 frames each). `inspect --pops` reports the cuts between separate clips and fast actions: the reeds that spring up, the tremor, the fire that starts at the edge of the map, the coins that fall and spin, the Epic frame that draws itself and the dust of the kneeling Colossus. It also reports the streaks of the blizzard in the hold of the challenge: each streak moves far in one frame, which is the intended speed of a blizzard. None of these is a still element that blinks by mistake. The reference mix measures −18.5 LUFS integrated and −3.6 dBTP, with no clipped samples.

Measured delivery sizes in bytes:

| Story Scene       | Video (5 clips) | Posters |     Audio |
| ----------------- | --------------: | ------: | --------: |
| Opening           |       3,458,992 | 268,964 |   769,023 |
| Boss              |       3,732,251 | 139,902 |   703,865 |
| Ending            |       3,329,683 | 193,718 |   711,555 |
| Version 1 targets |       4,000,000 | 400,000 | 1,000,000 |

All three Story Scenes are within the targets. The busy map shots of the opening (`opening-01`, `opening-02` and `opening-05`) and the blizzard of the challenge (`boss-05`) use CRF 32 and WebP quality 36; the other clips use CRF 30 and quality 40 (`TUNE` in `produce.py`). The game loads one clip at a time.

Nobody has listened to the audio or watched the encoded clips in the game yet. The music and effect choices rest on the creators' descriptions. Reading pace and story comprehension in both Locales still need the Player review.
