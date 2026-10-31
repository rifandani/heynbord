# Region Story Scenes

Status: agreed for the Hearthvale trial on 2026-10-27. Version 2 of the Hearthvale scenes (2026-10-28) replaces the first cut with a cinematic remake: new text and lore, five moments per Story Scene, and looping clips. Version 2 also adds a Boss scene, so each Region has an opening, a Boss scene and an ending. On 2026-10-28, the Red Mesas (Region 2) got its opening, Boss scene and ending in the same format; see the [Red Mesas storyboard](./red-mesas-storyboard.md). On 2026-10-29, the Glowcap Hollows (Region 3) followed; see the [Glowcap Hollows storyboard](./glowcap-hollows-storyboard.md). On the same day, the Thornwood (Region 4) followed; see the [Thornwood storyboard](./thornwood-storyboard.md). On 2026-10-30, the Hollow Marches (Region 5) completed the five Regions; see the [Hollow Marches storyboard](./hollow-marches-storyboard.md). The owner's review of the five Regions, audio auditions and Player tests are still required.

## Purpose

Give the Player a reason to enter each Region and show what the Hero's victory changes. Connect the local adventures through the investigation of who threatens the Accord ([GDD 3.1](./03-game-design.md#31-premise)).

## Agreed decisions

- Test the opening, Boss scene and ending of Hearthvale before committing to scenes for all 5 Regions.
- The Boss scene is a conversation between the Hero and the Boss before the Boss Battle. It shows the Boss's motive and plants the Region's mystery. In Hearthvale, the Baron's greed explains the closed roads, and his boast about "good, heavy gold" from a faceless patron prepares the painted-stone clue of the ending.
- The trial opening must explain the Accord, the Hero's immediate goal and why Baron Brassbelly stands in the way. The ending must show a consequence and give a reason to enter the Red Mesas. Check whether a Player can explain these points after watching.
- Use the Accord investigation as the main story. Each Region has a local problem. Its resolution reveals information that leads to the next Region.
- Each Region ending points to the next Region with one concrete clue, and the cut seal of the Accord stays unexplained. In each Region, the unknown enemy pays with something that comes from the next Region: painted red stone in Hearthvale, glowcaps in the Red Mesas, Thornwood amber with black thorns in the Glowcap Hollows, coins of bone from the Hollow Marches in the Thornwood, and a coin of tower stone from Heynspire in the Hollow Marches.
- Keep the Accord mystery open at the end of Region 5, the Hollow Marches. Future versions will add Regions that continue the story. The exact final reveal still needs a decision.
- Region 5 resolves the frost-beast misunderstanding and shows that the Hero earned Queen Marrow's respect. Its ending adds one concrete clue that points beyond the known Regions: a coin of pale tower stone with a small tower mark, in the cutters' purse. Queen Marrow knows the stone: Heynspire. The clue does not name the enemy or explain the seal. The story review can still replace it.
- Use a fixed story. The first version has no Player choices that change later events.
- Address the Hero as "you". Use the selected Hero portrait when needed. The story has no fixed Hero name, Class or full-body figure. Use narration and short character dialogue.
- Hearthvale's ending adds a new story connection: the Hero opens the road and finds payment records. Someone in the Red Mesas helped fund the Baron's sellswords. The Hero follows that lead to learn why. This does not establish Brassbelly as the main enemy behind the Accord threat.
- Play an opening automatically when the Player first enters its unlocked Region. Browsing a locked Region does not start a scene.
- Play the Boss scene when the Player selects Fight on the Boss Stage for the first time. Its last button is Fight, and Skip also starts the Battle. It becomes available through Story when the Boss Stage opens. It never plays automatically on a Region visit.
- Play an ending when the Player selects Back to Campaign after their first Boss Stage victory, after rewards are stored. Three Stars are not required. The next opening waits until the Player enters the next Region.
- Make Skip available immediately. Let the Player watch a scene again.
- Skipping preserves progress and rewards.
- Avoid one long sequence that joins a Region ending to the next Region opening.

The trial does not select a release version for the full feature. MOD-07 remains in v2 in the [PRD](./04-prd.md#4-non-goals-for-v1) and the [Roadmap](./09-roadmap.md).

## Agreed presentation

Use the existing paintings, re-lit and animated, with drawn props, particles and camera moves. Each scene has 3 to 5 illustrated moments; Hearthvale version 2 uses 5. The Player advances the text with Continue. Aim for about 30 to 50 seconds at a normal reading pace. Keep Skip visible. With reduced motion, show still compositions and the same text.

Use the fframes-video skill to render the motion. Hearthvale version 2 uses 5 clips of 9 seconds for each Story Scene, at 1280 × 720 and 30 fps. In the Boss scene, a Story Moment has one to three lines; Continue shows the next line over the same looping clip, with a name plate for each speaker and the Hero portrait for the Player's lines. A clip finishes its action at 5 seconds; seconds 5 to 9 are a seamless 4-second loop that repeats until the Player selects Continue. The Player can also Continue before the clip finishes. Keep text and controls outside the video so both Locales use the same clips. The only words in the video are proper names that both Locales share.

The storyboards ([Hearthvale](./hearthvale-storyboard.md), [Red Mesas](./red-mesas-storyboard.md), [Glowcap Hollows](./glowcap-hollows-storyboard.md), [Thornwood](./thornwood-storyboard.md), [Hollow Marches](./hollow-marches-storyboard.md)) specify each shot and its loop. The production READMEs ([Hearthvale](../../scripts/campaign-story/hearthvale/README.md), [Red Mesas](../../scripts/campaign-story/red-mesas/README.md), [Glowcap Hollows](../../scripts/campaign-story/glowcap-hollows/README.md), [Thornwood](../../scripts/campaign-story/thornwood/README.md), [Hollow Marches](../../scripts/campaign-story/hollow-marches/README.md)) specify the build, checks and outputs. The earlier [production prompt source](../../scripts/campaign-art/hearthvale-story-prompts.md) describes version 1.

The scene fills the screen. The text, Back, Continue, the moment dots and Skip float over it on dark gradient scrims, so the text stays readable on bright paintings. On short screens the title is visually hidden; screen readers still get it. Provide Back, Continue and Skip. Back returns to an earlier illustrated moment. Esc performs Skip without a confirmation dialog. After the last moment, Return to Region closes the scene. All controls support keyboard and touch.

The trial uses text, music and timed effect cues. It has no spoken narration or character voices. The story must be clear with sound off. Test the writing and visual sequence in English and Indonesian before adding voices.

Search online for suitable free or open-source music, effects, environmental sound and optional voice tools. Check each asset's license and credit terms. Use the research to select trial audio. The search includes voice options for later review; it does not add voices to the trial.

The [audio research](../research/region-story-audio.md) lists CC0 music, ambience and effect candidates, plus conditional voice options. Version 2 uses more dramatic CC0 music and effects, listed in [its credits](../../scripts/campaign-story/hearthvale/CREDITS.md). Human listening review remains open.

Build the Hearthvale trial with existing paintings and character art: the two Region Maps, Orc card art and the Baron's figure from the Dungeon 3 painting. Review the sequence before commissioning additional paintings. The current limit of 2 paintings per Region still applies.

The presentation must meet [Pillar 5](./01-design-pillars.md#pillar-5--light-and-readable-on-the-web). Load scene assets when needed. They must not delay the Town or block progress.

## Delivery limits

- Load Story Scene code with the Campaign. Add no Story Scene media to the Town's initial load.
- Reuse the existing Region paintings. The trial adds rendered motion clips and final-frame posters, with no new painting. Version 2 also shows a glimpse of the Red Mesas Region Map in the last ending moment.
- Limit new compressed audio to 1,000,000 bytes in total for each Story Scene, across its 4 moments. Cut and compress selected recordings before delivery; do not send full source WAV files to the browser.
- Use 4,000,000 video bytes and 400,000 poster bytes per Story Scene as initial targets for the fframes route. Verify the visual quality and measured sizes in the trial before extending it to other Regions. The version 2 opening uses 4,548,640 video bytes for five clips; the game requests one clip, about 0.9 MB, at a time. Decide whether to accept this or compress more after the owner's review.
- Deliver clean video and separate audio files, so music and effects retain their separate Player settings. Sound and video are not a condition for reading the story.
- Preserve the existing bundle and frame-time budgets in [Technical Design 6](./06-technical-design.md#6-performance-budgets). Record the added code and media sizes during the trial.
- Test text fit and reading pace in both Locales, including landscape phones. Sound and motion follow the existing Player settings.

## Scene access and interruption

- Completing or skipping a scene stops its automatic playback.
- A scene interrupted by a reload stays pending. It starts again on the next relevant Region visit.
- Each Region Map has a Story control for its available scenes. Unavailable endings stay hidden.
- When the feature first reads an existing save, openings for reached Regions and endings for defeated Bosses become available through Story without automatic playback. A future first Boss victory still starts its ending normally. Newly reached Regions start their openings normally.
- If a Boss ending is pending after Retry or a reload, show it on the next visit to that Region.
- Show at most one automatic scene per Region visit. If an opening and an ending are both pending, show the ending. Keep the older opening available through Story without automatic playback afterward.
- Keep scene-viewing records with saved progress. Export and import preserve them. A full reset clears them.
- If art or sound fails to load, keep the text, Continue and Skip usable. Use a still background if motion assets fail. Continue silently if sound fails.

## Trial review

Review the Hearthvale opening and ending as a storyboard before building the interactive trial. The storyboard specifies the text, composition, motion and sound of each illustrated moment.

The [Hearthvale storyboard](./hearthvale-storyboard.md) contains the approved trial text in both Locales and the composition of each moment. Validate its wording, fit and reading pace with Players. The production prompt expands its motion directions into exact shot timings.

Then build the trial and test it with 3 Players. Ask each Player why the Hero is in Hearthvale, what the victory changed and why they would enter the Red Mesas. Also check whether the scenes feel worth watching and whether Skip is easy to find.

The trial passes this first review when:

- At least 2 Players can explain the local goal, the victory's consequence and the reason to continue.
- All 3 Players can find Skip without help.
- At least 2 Players say that the scenes improve the journey.

If it misses these goals, revise Hearthvale before expanding to other Regions.

## Existing design and behavior

- The Campaign has 5 Regions with 10 Stages each. A first Boss Stage win opens the next Region. Stars and Star chests do not control that opening ([GDD 8.1](./03-game-design.md#81-campaign)).
- The Player can view a locked Region Map. Viewing a map is therefore different from starting its adventure ([GDD 11.5](./03-game-design.md#115-campaign)).
- Battle rewards enter the Profile when the result appears. Story viewing must preserve this protection ([GDD 11.4](./03-game-design.md#114-town)).
- The documented Region 5 ending resolves the misunderstanding about the frost beasts and points to Heynspire. It does not explain who threatens the Accord ([Campaign Stages 6](./14-campaign-stages.md#6-region-5-the-hollow-marches)). The new ending will keep the investigation open for future Regions; the review must define what the Player learns in Region 5.
- The current art plan permits 2 paintings per Region ([Region Concepts](./12-region-concepts.md)). The trial uses existing art within that limit.
- The Player has no fixed story name or Class. The selected Hero portrait stays the same across Classes ([Hero Portrait Concepts](./17-hero-portrait-concepts.md)). Story Scenes follow that identity.
- Hearthvale's existing plot is about Brassbelly's outlaws and paid Orc sellswords holding the roads. The Red Mesas plot is about Snikkit paying Orcs with rocks painted gold ([Campaign Stages](./14-campaign-stages.md)). The payment records are an agreed addition for Story Scenes, not an existing scene or item in the game.
- Existing assets include the Hearthvale Region Map, its Battle Painting, Human and Orc card art, Hero portraits and suitable music. There is no separate Baron portrait or environmental sound file. His figure is in the Dungeon 3 painting. These limits affect the storyboard.
- The established entry flow is Town, Town Gate, Region Map, Stage Panel, then Fight. With the agreed opening at Region entry, it occurs before Stage 1-1's Battle Tutorial. Skipping the Story Scene does not skip that Tutorial ([GDD 8.3](./03-game-design.md#83-tutorial-and-hints)).

## Later work

- Complete human listening review of the selected trial audio.
- Test the integrated Hearthvale trial with 3 Players in both Locales.
- Confirm the Region 5 clue (the coin of tower stone from Heynspire) during the later full-Campaign review.

The trial does not move the full MOD-07 feature into v1. Review that scope after the trial results.

## Implementation checks

The Campaign uses the clean delivery in `apps/web/public/story/hearthvale/v2/`, `apps/web/public/story/red-mesas/v1/`, `apps/web/public/story/glowcap-hollows/v1/`, `apps/web/public/story/thornwood/v1/` and `apps/web/public/story/hollow-marches/v1/`. `STORY_REGIONS` in `apps/web/src/features/campaign/story-scenes.ts` lists the Regions with Story Scenes: their media folder, speakers and effect cues. A Region without an entry has no Story control. Source recordings, masters and review reels stay outside the public folder. Credits and the delivery manifest are kept with the production media. The approved text is in the English and Indonesian Message Catalogs.

Profile version 15 adds `seenStoryScenes`. Version 14 and older Profiles receive replay-only records for unlocked Region openings, and for the Boss scene and ending of each won Boss. A new Profile starts with no records. A pending scene comes from saved Stage results and a missing viewing record; entering a scene or changing its Story Moment writes no viewing record. Skip and Return to Region write the record. Finishing an ending also makes an older opening replay-only. Story playback gives no reward.

The Story control is on the Region Maps of all five Regions. The Red Mesas follow the same rules: the opening plays on the first visit after the Hearthvale Boss win, the Boss scene plays on the first Fight on Stage 2-10, and the ending plays after the first win of Stage 2-10. The Red Mesas conversation adds two speakers, Boss Snikkit and Warchief Grukka; their name plates use the enemy color of the Baron's plate. The Glowcap Hollows follow the same rules with Stage 3-10. Their conversation adds Lady Glimmerbough, and their ending adds one line by Lethiel, with the same name plate color. The Thornwood follows the same rules with Stage 4-10. Its conversation adds the Old Bramble, which also speaks once in the ending, and the ending adds one more line by Lethiel. The Hollow Marches follow the same rules with Stage 5-10. Their conversation adds Queen Marrow, who also speaks four lines in the ending, with the same name plate color.

In Hearthvale, an existing Player can select Opening, an available Boss scene or an available Ending on the Region Map. The first Fight on Stage 1-10 plays the Boss scene, then starts the Battle; Fight or Skip writes its viewing record. Finishing the ending also makes the Boss scene replay-only. A new Player gets the opening at the first Region visit. A first Boss win stores its rewards on the result screen, then Back to Campaign starts the ending. Retry and reload keep an unseen ending pending for the next Hearthvale visit. The Town Gate still opens the newest unlocked Region.

The player loads with the Campaign. It requests only the current clip and poster, plus the scene's music and the current moment's effect cues. When a clip ends, the player seeks back to 5 seconds and plays the loop again. Reduced motion requests posters without video. A failed clip keeps the poster and map fallback; all media can fail without blocking text or controls. Story audio uses the existing Mix channels and temporarily owns the music. Exit stops its sounds and restores the requested screen loop. Update and offline notifications stay hidden while a Story Scene is open, so they cannot cover Continue.

Measured production media sizes remain those in the [delivery README](../../scripts/campaign-story/hearthvale/README.md#checks-and-limits). The built Campaign chunk, including Story controls, is about 40 kB, or 15 kB gzip. The Story media is excluded from the service-worker precache. Browser checks confirm that Town requests no Story media.

Repeat the automatic checks from the repository root:

```sh
rtk bun test:unit
rtk bun web:typecheck
rtk bun rules:typecheck
rtk bun lint
rtk bun check:tokens
rtk bun web build
rtk proxy env PW_PORT=4001 apps/web/node_modules/.bin/playwright test --config apps/web/playwright.config.ts e2e/story-scenes.spec.ts --project chromium --workers 1 --reporter=list
```

The browser suite checks both Locales, desktop and 667 × 375 landscape phones, keyboard controls, the reading hold, early Continue, interruption, Skip, replay, old saves, Boss-return rewards, Retry, and failed media. The unit checks cover migration, import/export, viewing records, audio ownership and several effect cues in one moment. These checks do not replace the human listening and 3-Player review above.
