# Glowcap Hollows Story Scene media credits, version 1

Source pages and licences were checked on 2026-10-28. Listening review is pending: nobody has listened to these files, and the mood notes come from the creators' descriptions. The scenes have no voice and no generated recording.

## Audio

All recordings are [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Credit is voluntary; it does not imply creator approval of the game. Every delivered file is mono, 44.1 kHz MP3. `audio.py` gives the exact cut, fade and level of each file.

| Delivered file | Creator and source | Changes |
| --- | --- | --- |
| `opening-music.mp3` | nene, [Beautiful Forest [Orchestra]](https://opengameart.org/content/beautiful-forest-orchestra), `beautiful_forest_16bit_44.1khz_1.wav` | Source 0–66 s; level adjustment; fades; 56 kbit/s. |
| `boss-music.mp3` | cynicmusic, [Dramatic Boss Encounter](https://opengameart.org/content/dramatic-boss-encounter), `Heavy Concept A Bass Master.wav` | Source 0–39.5 s twice, 2 s cross-fade; level adjustment; 4 s exit fade; 56 kbit/s. |
| `ending-music.mp3` | nene, [Hero's Reprise](https://opengameart.org/content/heros-reprise), `hero_reprise_0.wav`, and congusbongus, [Cathedral in the forest (ambient loop)](https://opengameart.org/content/cathedral-in-the-forest-ambient-loop), `forest_2_0.ogg` | Hero's Reprise 0–16 s, 3 s cross-fade into Cathedral in the Forest 0–56 s; level adjustment; 4 s exit fade; 56 kbit/s. |
| `chime.mp3`, `chime-high.mp3` | pwl, [Bell dings/chimes](https://opengameart.org/content/bell-dingschimes), `bell_ding2.wav`, `bell_ding3.wav` | Exit fade; peak level. |
| `creak.mp3` | antumdeluge, [Tree Creaking](https://opengameart.org/content/tree-creaking), `tree_creak.flac` (by Department64) | First 2.4 s; fades; peak level. |
| `whoosh.mp3`, `drip.mp3`, `paper.mp3` | vehicle, [Fantasy Sound Effects (Tinysized SFX)](https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx), `tin-whistle-whoosh-01.wav`, `water-drop-01.wav`, `book-page-01.wav` | Fades; peak level. |
| `hit.mp3`, `slam.mp3`, `bow.mp3`, `snap.mp3`, `lid.mp3` | rubberduck, [100 CC0 metal and wood SFX](https://opengameart.org/content/100-cc0-metal-and-wood-sfx), `wood_hit_07.ogg`, `wood_slam_03.ogg`, `wood_squeak_01.ogg`, `metal_slam_01.ogg`, `door_open_01.ogg` | Fades; peak level. |
| `rumble.mp3` | rubberduck, [100 CC0 SFX #2](https://opengameart.org/content/100-cc0-sfx-2), `sfx100v2_loop_machine_01.ogg` | The same cut as the Red Mesas scenes. |
| `wind.mp3`, `boom.mp3`, `shimmer.mp3`, `magic.mp3`, `coin.mp3`, `drums.mp3`, `thud.mp3` | The same sources and cuts as the Hearthvale scenes; see [its credits](../hearthvale/CREDITS.md). | As in the Hearthvale scenes. |

The source list with file URLs is `apps/web/art/campaign/raw/glowcap-hollows/story/source/SOURCES.md`.

## Images and fonts

- Region Maps: the existing `apps/web/public/battle/glowcap-hollows-region.webp` and, for the last moment, `thornwood-region.webp`, unchanged, re-lit by shaders.
- Battle Painting: the existing `apps/web/public/battle/glowcap-hollows.webp`, re-lit by a shader, behind the challenge, the roots and the First Gardener.
- Cards: the existing card art `bramble-nest`, `canopy-vinewarden` and `lethiel-first-gardener` in `apps/web/public/creature/elf/`.
- Lady Glimmerbough, the dusk forest of mushrooms, the tunnel timbers, the arrow, the walls, the trap, the vision, the shaft and basket, the roots, the letters, the coin, the amber, the thorns, the vines and the cut Accord Seal are drawn in code. Some props come from the Red Mesas and Hearthvale toolkits.
- The title font is [Cinzel](https://github.com/NDISCOVER/Cinzel) (the game's display face), SIL Open Font License 1.1, as a static weight-900 instance. The review text uses the repository's Lato.

## Software

The runtime and renderer are [fframes 1.3.0](https://github.com/dmtrKovalenko/fframes), under its [MIT license](https://github.com/dmtrKovalenko/fframes/blob/main/LICENSE.txt). The export uses H.264 through the GPL-enabled FFmpeg build selected by the fframes dependency. This project does not redistribute the renderer binary.
