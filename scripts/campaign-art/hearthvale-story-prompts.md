# Hearthvale animated Story Scene prompt

Status: version 1. Version 2 replaces it; its shot plan is in `docs/game/scenes/hearthvale-storyboard.md` and its production notes are in `scripts/campaign-story/hearthvale/README.md`.

Use this prompt with `/fframes-video` in this repository. All paths below start at the repository root. The generated copy includes the approved English and Indonesian storyboard at the end.

## Task

Create the Hearthvale opening and ending with fframes. Produce 8 animated clips: one clip for each illustrated moment of the approved storyboard. Each group of 4 clips is one Story Scene. The result must explain the world, give the Hero a local goal, show the result of the victory and give a reason to enter the Red Mesas.

Generate the animation project and its review material. When this prompt is invoked to produce the final assets, also render the delivery clips after the checks below pass. Game screen integration is a separate task.

### 1. Read the brief

Read these files before creating the project:

- `AGENTS.md` and any guidance for the output folders.
- `.agents/skills/fframes-video/SKILL.md`, then its `references/design.md`, `references/api.md` and `references/audio.md`.
- `docs/game/23-region-story-scenes.md`: agreed story, controls, progress and delivery rules.
- `docs/game/scenes/hearthvale-storyboard.md`: the canonical text for both Locales.
- `docs/game/05-art-direction.md`: brush, light, materials, humor and audio direction.
- `docs/research/region-story-audio.md`: source and license checks for audio candidates.

If a vendored fframes repository exists under `repos/`, read its agent guidance and use it as read-only reference. Otherwise use the [official fframes source and examples](https://github.com/dmtrKovalenko/fframes). Check the installed version and CLI help before using a command that differs from the skill. Prefix terminal commands with `rtk` as required by the repository.

Complete this step with an asset list, the selected audio sources and a timeline of all 8 moments. Report missing assets or tools accurately. Select music before arranging a transition around its phrases; do not invent a BPM or claim to hear a recording from its tags.

### 2. Create the animation project

Use a Rust fframes project at `scripts/campaign-story/hearthvale/`. Keep compiled output under `out/story-scenes/`, outside the source tree. Use the Skia GPU backend when available. Prepare image and audio assets before rendering frames. Follow the skill's cached animation patterns instead of constructing animation data or reading files for each frame.

Use one fframes `Scene` per illustrated moment, with these names:

| Scene | Story moment | Full timeline, end exclusive | Frames, end exclusive |
| --- | --- | --- | --- |
| `OpeningAccord` | Opening 1 | 0–8 s | 0–240 |
| `OpeningLanes` | Opening 2 | 8–16 s | 240–480 |
| `OpeningRoads` | Opening 3 | 16–24 s | 480–720 |
| `OpeningTask` | Opening 4 | 24–32 s | 720–960 |
| `EndingRoad` | Ending 1 | 32–40 s | 960–1200 |
| `EndingRecords` | Ending 2 | 40–48 s | 1200–1440 |
| `EndingQuestion` | Ending 3 | 48–56 s | 1440–1680 |
| `EndingLead` | Ending 4 | 56–64 s | 1680–1920 |

Use 1280 × 720, 30 fps, 8 seconds and exactly 240 frames for each delivery clip. The full source timeline is 64 seconds and 1920 frames. Opening and ending are separate 32-second groups. Treat these timings as production defaults; they do not force the Player to read at that speed.

Keep the 8 moment ranges exact. Do not add scene overlap that changes their export boundaries. Each moment starts with a meaningful image and ends in a stable composition. Keep the final 0.5 seconds still. Export its last frame, local frame 239, as its poster.

### 3. Animate the moments

Use the shot directions below and the exact script at the end. Times within a shot are local, from 0 to 8 seconds. Keep one clear focal movement at a time. Use ease-in-out for the camera and ease-out for an arriving prop. Preserve the painted landscape and the existing landmarks.

The motion must come from the story: river light, lane marks, the road to the hall, the revealed payment and the return to the open road. Give each shot its specified action. A repeated full-image zoom is not a substitute for these actions.

### 4. Prepare audio and text

Use music, ambience and sparse effects from the audio plan below. Keep voices out of this trial. Export clean delivery video without an audio track. Deliver music, ambience and effects separately so the game can respect its existing music and effect settings. Use fframes audio maps for the review mix and cue inspection.

Keep narration, buttons and localized labels outside the delivery pixels. One set of clean clips serves both Locales. Add the exact English or Indonesian text only to clearly named review reels or review frames. Use the repository's fonts and verify their glyphs when rendering those review assets.

### 5. Inspect and export

Follow the inspection and delivery checklists below. Inspect and review contact sheets before a full final render. Use the native GPU preview during iteration when available. When offering a preview, give a complete command with the actual project path and a useful start time. Do not ask for another export confirmation when the invocation already requests final exports.

Validate with fframes inspection, rendered frames, contact sheets and audio analysis. Do not create a unit, integration, snapshot or visual-regression test suite for this animation project.

## Source images and visual direction

Use these source files:

- `apps/web/public/battle/hearthvale-region.webp`: the valley, ford, road, sellsword camp and Brassbelly Hall.
- `apps/web/public/battle/hearthvale.webp`: the forest clearing used for a Battle. It is not the Muddy Ford.
- `apps/web/public/hero-portraits/`: use the selected portrait only in a review that explicitly shows a Hero. The clean clips keep the Hero outside the frame.

Keep the bright painted high-fantasy style, warm fields, cool distance and restrained humor. The large hat-shaped roof identifies Brassbelly without a separate portrait. A fixed Hero name, face or Class outfit would conflict with Player choice.

Use the existing images as the landscape. Derived masks and code-drawn overlays are permitted. Keep the source files unchanged. The trial adds no new painting. Derive masks from the actual river, sky, road and hall positions; inspect them over the source before animating them. Keep exposed edges covered throughout a move. If a painted object cannot be isolated cleanly, keep it in the background and animate light or atmosphere around it.

Keep the main action within the center 80% of the frame. Preserve room for narration beneath the image or in the lower safe area of a review reel. Do not put critical evidence behind that area. Limit camera scale to about 1.00–1.20 unless a full-size frame shows that a closer crop is sharp enough. Use the available source pixels; a larger render does not create more painting detail.

## Opening: local shot directions

### OpeningAccord: the world survives

**Story:** Opening 1 in the approved script. Establish Heynbord and the Accord. The present landscape represents the world; this is not a new historical war scene.

- **0.0–0.8 s:** Start on the complete painted valley. Give the viewer a clear image immediately. Bring a soft patch of sunlight over the fields without changing the painting's palette.
- **0.8–3.0 s:** Move the view about 8–12 output pixels toward the valley. Use the actual river mask for a slow, low-contrast water highlight. It must stay inside the water.
- **3.0–7.5 s:** Let the river and a small amount of sky atmosphere carry the motion. The hall and roads stay readable. Use small changes, not a moving screen-sized glow.
- **7.5–8.0 s:** Settle into the final still pose.

**Audio:** Gentle exploration music and quiet river or bird ambience. The music is an invitation to explore. No war impacts or dramatic opening hit.

### OpeningLanes: the Accord has a visible form

**Story:** Opening 2. Show that disputes have rules. Leave countdown and Battle instructions to the Tutorial.

- **0.0–0.4 s:** Start on the Battle Painting's forest clearing, at the same daylight level as the previous shot.
- **0.4–1.8 s:** Draw 3 parallel horizontal lane guides across the clear center, with about 0.1 seconds between their starts. Place their ends around x 24% and 76%, and their centers around y 40%, 52% and 64%; adjust these positions after inspecting the painting.
- **1.8–3.0 s:** Let the guides settle to a restrained, warm light. They should read as marked ground, not a new game interface.
- **3.0–7.5 s:** Keep the camera almost still. Let existing daylight move slightly at the edge of the clearing. The guides remain in place.
- **7.5–8.0 s:** Hold the final pose.

**Audio:** Continue the quiet music. A soft marking sound is optional. Add no countdown, alarm or combat effect.

### OpeningRoads: the Baron controls the route

**Story:** Opening 3. Connect the outlaws and paid Orc sellswords to Brassbelly Hall.

- **0.0–1.0 s:** Show the existing sellsword-camp area and its relation to the road on the Region Map. Keep enough of the valley visible to locate it.
- **1.0–4.5 s:** Carry one restrained highlight along the actual painted road toward the hall. Move the camera focus toward the upper-right hall at the same time, with less motion than the highlight.
- **4.5–6.5 s:** Let the hat-shaped roof become the visual joke. Hold on it without a comic shake or an added face.
- **6.5–7.5 s:** Let the route highlight settle. Keep the landscape intact.
- **7.5–8.0 s:** Hold the final pose.

**Audio:** One small musical accent can land when the hall becomes the focus. Use no crowd or character voice.

### OpeningTask: the Hero starts at the ford

**Story:** Opening 4. Give the Player one immediate goal: open the road.

- **0.0–1.0 s:** Start on the lower-left ford area of the Region Map. Keep the stepping stones and road clear.
- **1.0–3.0 s:** Reveal a short warm trace on the existing road from the ford toward the next stop. This is visual direction, not an added Stage Marker.
- **3.0–5.5 s:** Settle the camera into the ford composition. Keep water motion low enough that the Player can read comfortably.
- **5.5–7.5 s:** Let the route cue become quiet. Keep the image ready to return to the Region Map.
- **7.5–8.0 s:** Hold the final pose.

**Audio:** Return to the calm musical phrase. On leaving the scene, let the game resume its normal Campaign music. The clip does not start a Battle.

## Ending: local shot directions

### EndingRoad: a local victory

**Story:** Ending 1. Travelers can use the road again. The Baron is briefly silent.

- **0.0–1.0 s:** Start with the hall and its road in view. Match the daylight and painted materials used in the opening.
- **1.0–4.0 s:** Release the framing into a wider view of the road. Let light reach the route rather than showing new damage, a new crowd or a changed building.
- **4.0–7.5 s:** Hold the peaceful route with a small river or daylight movement. The text can carry the banner action without requiring an invented Baron figure.
- **7.5–8.0 s:** Hold the final pose.

**Audio:** A brief warm phrase follows the Battle result. Keep it quieter than a second reward fanfare. Battle rewards have already been stored.

### EndingRecords: the unexpected payment

**Story:** Ending 2. The payment records reveal support from the Red Mesas.

- **0.0–0.5 s:** Start with the map in view and a clear central area.
- **0.5–1.2 s:** Bring a parchment record in from the lower-right, over about 60 output pixels. Settle from roughly -3 degrees to -1 degree. Use one small ease-out movement.
- **1.2–2.5 s:** Reveal a second entry in the record with a drawn ink stroke. Use simple ledger rules and marks. Keep names, numbers and region labels out of the clean video; the localized narration supplies the evidence.
- **2.5–7.5 s:** Keep the record legible as a prop. A small warm highlight can distinguish the second entry. The map is still visible around it.
- **7.5–8.0 s:** Hold the final pose, with exact prop coordinates saved for the next shot.

**Audio:** One soft paper sound begins when the prop arrives. Lower the music slightly at the discovery. Repeated UI clicks do not belong in the encoded scene.

### EndingQuestion: the sender stays unknown

**Story:** Ending 3. The source Region is known; the sender is not.

- **0.0 s:** Match the previous shot's final paper position, scale, rotation and ink exactly. Do not play the paper entrance again.
- **0.0–2.0 s:** Direct attention toward the part of the record where a sender would be identified. Keep that area blank. Use a small shift in light rather than a flashing question mark.
- **2.0–6.5 s:** Let the map behind the record move by only a few pixels. Keep the record stable. The mystery comes from the missing name and the text, not a new villain silhouette.
- **6.5–7.5 s:** Let the light settle.
- **7.5–8.0 s:** Hold the final pose for the next shot.

**Audio:** A quiet unresolved musical phrase. Keep the tone curious rather than frightening. Play no repeated discovery effect.

### EndingLead: a reason to continue

**Story:** Ending 4. The road is open and the payment trail leads onward.

- **0.0 s:** Start from the previous shot's final paper pose.
- **0.0–0.5 s:** Move the record out toward its entry edge, with a small ease-in movement.
- **0.5–2.5 s:** Open the framing back to the Hearthvale Region Map.
- **2.5–5.0 s:** Give the outgoing road a restrained directional highlight. Stay in Hearthvale. A new landscape would falsely start the Red Mesas opening.
- **5.0–7.5 s:** Let the cue settle into the wide map view.
- **7.5–8.0 s:** Hold the final pose. The Player decides when to return to the Region Map.

**Audio:** Resolve the local victory, with a small unanswered phrase. Fade scene audio when the Player leaves. The next Region's music starts only when that Region opens.

## Playback and localization contract

- The game controls Continue, Back, Skip and Return to Region. Keep all of these outside the video pixels.
- The Player can Continue before a clip finishes. At its end, hold the matching poster indefinitely until the Player acts. A clip ending does not automatically advance the story.
- Play each visual movement once. Avoid a repeated 8-second loop that restarts the paper entrance or a discovery cue.
- A move Back starts that moment from its beginning. A scene replay starts at its first moment.
- Keep music and ambience independent of reading time. They may continue quietly during a reading hold. Effects play once when their moment starts, and stop on leaving it.
- Use each exported final-frame poster for reduced motion. If video fails, show the poster and preserve the text and controls. If the poster also fails, use the plain scene surface and text. An audio failure remains silent.
- Use the same clean clips for `en-us` and `id-id`. The canonical text is in the appended storyboard. Keep text and all visible labels outside delivery pixels.
- Preserve the agreed first-visit, pending-ending, save and reward behavior in `docs/game/23-region-story-scenes.md`. This media task adds no rules or Profile mutations.

## Audio selection and delivery

Start auditions with these creator uploads and their stated licenses:

- RandomMind, [Medieval: Exploration](https://opengameart.org/content/medieval-exploration), CC0: gentle adventure music.
- Thimras, [Park ambiences](https://opengameart.org/content/park-ambiences), CC0: river and birds. Select a quiet, short section after listening review.
- Luckius, [Various Paper Sound Effects](https://opengameart.org/content/various-paper-sound-effects), CC0: the record arrival and departure.
- Kenney, [Interface Sounds](https://kenney.nl/assets/interface-sounds), CC0: optional UI sounds for later integration, separate from the clean motion clips.

Existing music under `apps/web/public/music/` is another option. Verify its source record before copying it into this project. Read the audio research note for credit details and alternatives. Preserve the exact source URL, creator, license link and changes in `CREDITS.md` for every delivered recording. A free download label alone is not a license.

Use no voice for the trial. Optional later narration must support both Locales and have verified rights for the selected voice, model and output. It is not part of these exports.

Time effects from the same constants as the relevant motion. Keep a quiet game mix that fits the existing music. Use measured levels to prevent a jump on entering the scene; the skill's web-video loudness target is a review reference, not a reason to make the game louder. Keep true peak at or below -1 dBTP and clipped samples at 0. Check fades and clip boundaries with `audio analyze` and `audio at`. Mark listening choices as unreviewed until a person hears them.

## Outputs and size targets

Keep the source project reproducible in `scripts/campaign-story/hearthvale/`. Put generated reviews, masters and browser files under `apps/web/art/campaign/raw/hearthvale/story/`. That raw folder is ignored by Git. Keep delivery assets out of `public/` until the game-integration task selects them.

Produce:

- `delivery/opening-01.mp4` to `opening-04.mp4` and `ending-01.mp4` to `ending-04.mp4`: clean H.264, yuv420p, 1280 × 720, 30 fps, 240 frames, with fast-start metadata and no audio track.
- `delivery/opening-01.webp` to `opening-04.webp` and the 4 matching ending posters: the exact final composition of each clip, with no narration or control text.
- Separate compressed music, ambience and effect files under `delivery/audio/`.
- `delivery/manifest.json`: Region, scene kind, moment order and ID, clip and poster paths, dimensions, fps, frame count, duration, effect cue times, reading-hold behavior and the text for both Locales. Copy text from the canonical storyboard. Include the actual bytes of each delivered file.
- `review/`: a contact sheet for each moment, critical full-size frames, a timeline report, inspection reports and audio reports. If final exports were requested, include opening and ending review reels with separately rendered English and Indonesian text. Review reels may have a reference mix; their filenames must identify them as reviews.
- `CREDITS.md` and a project README with exact commands to reproduce the preview and exports.

The agreed new-audio limit is **1,000,000 bytes per Story Scene**, across its 4 moments, music, ambience and effects together. Count unique delivered audio files, including any format alternatives. Do not treat it as a limit for each individual moment. Count a shared file's full size against each Story Scene that uses it.

For the new rendered-video route, use these initial trial targets: **4,000,000 video bytes and 400,000 poster bytes per Story Scene**. Count all 4 clips or all 4 posters together. Adjust compression before changing resolution. If the art cannot meet these targets cleanly, report the measured result and the trade-off. Do not silently remove a moment, increase the agreed audio limit or add media to the Town's initial load.

## Inspection and completion

Use the actual generated project path in all commands. From the repository root, the command prefix is:

```sh
rtk cargo run --release --manifest-path scripts/campaign-story/hearthvale/Cargo.toml -- timeline
```

Run the same CLI with:

1. `timeline`: verify all 8 names, exact ranges and audio cues.
2. `inspect`: fix missing assets, invalid SVG, panics, bad transforms and text errors in reviews.
3. `strip <scene> -n 12`: open the resulting PNG for every moment. Each shot must have its planned action, a clear focal point and a stable end.
4. `frame <scene>@end,<scene>@50%`: inspect sharp frames. For paper continuity, compare local frame 239 with the next shot's frame 0.
5. `onion <range> -n 6`: inspect the paper entrance and the route movement where their spacing needs review.
6. `audio analyze` and `audio at <cue times>`: verify levels, effects, silence and fades.
7. `inspect --pops`: examine every unexpected appearance, disappearance or jump.

Show the full native preview command for the relevant section, such as:

```sh
rtk cargo run --release --manifest-path scripts/campaign-story/hearthvale/Cargo.toml -- preview 40s
```

This starts at the payment-record discovery. Offer to run the preview when the user is reviewing it. Continue within any existing authorization to open it.

For final exports, render each named scene separately. Confirm the CLI's scene-range syntax with its help. Check every final encoded file with `ffprobe`: codec, pixel format, width, height, fps, frame count, duration, absence of audio and file size. Verify that posters match the final encoded composition. Record results and unresolved limitations in the README. Report the output paths and what was visually inspected; do not claim that a generated file was watched or heard.

Complete only when all 8 requested moments are accounted for, visual errors are fixed, the text for both Locales is preserved, audio sources are documented and measured delivery sizes are reported.

## Approved storyboard and exact text

{{STORYBOARD}}
