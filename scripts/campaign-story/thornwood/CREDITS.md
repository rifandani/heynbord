# Thornwood Story Scene media credits, version 1

Source pages and licences were checked on 2026-10-29. Listening review is pending: nobody has listened to these files, and the mood notes come from the creators' descriptions. The scenes have no voice and no generated recording.

## Audio

All recordings are [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Credit is voluntary; it does not imply creator approval of the game. Every delivered file is mono, 44.1 kHz MP3. `audio.py` gives the exact cut, fade and level of each file.

| Delivered file | Creator and source | Changes |
| --- | --- | --- |
| `opening-music.mp3` | vitalezzz, [The Ancient Legend](https://opengameart.org/content/the-ancient-legend), `the_ancient_legend_2.mp3` | Source 0–68 s; level adjustment; fades; 56 kbit/s. |
| `boss-music.mp3` | Kevin MacLeod (FreePD), uploaded by josepharaoh99, [Ancient Power Of Serpents](https://opengameart.org/content/ancient-power-of-serpents), `Ancient Power Of Serpents.mp3` | Source 0–78 s; level adjustment; fades; 56 kbit/s. |
| `ending-music.mp3` | nene, [Ending Scene](https://opengameart.org/content/ending-scene), `ending_scene_orchestral.wav`, and Bobjt, [Strange Sanctuary](https://opengameart.org/content/strange-sanctuary), `strange_sanctuary_2025_-_remaster_0.mp3` | Ending Scene 0–30 s, 3 s cross-fade into Strange Sanctuary 0–46 s; level adjustment; 4 s exit fade; 56 kbit/s. |
| `quake.mp3` | mieki256, [Earthquake and Open sesame](https://opengameart.org/content/earthquake-and-open-sesame), `shake.flac` | First 4 s; fades; peak level. |
| `roar.mp3` | trazzz123, [CC0 Deep Monster Roar](https://opengameart.org/content/cc0-deep-monster-roar), `monster_roar.wav` | First 4.6 s; exit fade; peak level. |
| `horn.mp3` | StumpyStrust, [Their Coming (generic horn sound)](https://opengameart.org/content/their-coming-generic-horn-sound), `theircoming_0.ogg` | First 3.4 s; fades; peak level. |
| `boar.mp3` | fvcalderan, [Boar](https://opengameart.org/content/boar-0), `boar_0.ogg` | Exit fade; peak level. |
| `growl.mp3` | AntumDeluge, [Bear Growls](https://opengameart.org/content/bear-growls), `bear_01.flac` | Exit fade; peak level. |
| `leaves.mp3` | qubodup, [20 Rustles of dry leaves](https://opengameart.org/content/20-rustles-dry-leaves), `rustle04.flac` | First 2.5 s; fades; peak level. |
| `birds.mp3` | isaiah658, [Ambient Bird Sounds](https://opengameart.org/content/ambient-bird-sounds), `birds-isaiah658_0.ogg` | Source 2–6 s; fades; peak level. |
| `groan.mp3` | antumdeluge, [Tree Creaking](https://opengameart.org/content/tree-creaking), `tree_creak.flac` (by Department64) | Played at half speed, one octave lower; first 2.4 s; fades; peak level. |
| `knife.mp3`, `pouch.mp3`, `rattle.mp3` | vehicle, [Fantasy Sound Effects (Tinysized SFX)](https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx), `handsaw-knife-scrape-01.wav`, `cloth-pouch-shake-01.wav`, `chimes-wood-rattle.wav` | Cuts (the rattle is source 1.6–3.2 s); fades; peak level. |
| `crash.mp3`, `crack.mp3` | rubberduck, [100 CC0 metal and wood SFX](https://opengameart.org/content/100-cc0-metal-and-wood-sfx), `wood_breaking_01.ogg`, `wood_cracking_03.ogg` | Fades; peak level. |
| `rocks.mp3` | rubberduck, [75 CC0 breaking/falling/hit SFX](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx), `bfh1_rock_falling_01.ogg` | Fades; peak level. |
| `chime.mp3`, `chime-high.mp3`, `creak.mp3`, `whoosh.mp3`, `slam.mp3`, `drip.mp3` | The same sources and cuts as the Glowcap Hollows scenes; see [its credits](../glowcap-hollows/CREDITS.md). | As in the Glowcap Hollows scenes. |
| `wind.mp3`, `boom.mp3`, `shimmer.mp3`, `magic.mp3`, `thud.mp3`, `drums.mp3` | The same sources and cuts as the Hearthvale scenes; see [its credits](../hearthvale/CREDITS.md). | As in the Hearthvale scenes. |
| `wings.mp3` | AntumDeluge, [Large wings flap](https://opengameart.org/content/large-wings-flap), `wings_flap_large.ogg`, from the Hearthvale sources | First 2.6 s; exit fade; peak level. |
| `coin.mp3` | Vehicle (Jan Schupke), [Fantasy accessory SFX library](https://opengameart.org/content/fantasy-accessory-sfx-library), `coin-spin-fall-01.wav`, from the Hearthvale sources | Exit fade; peak level. |

The source list with file URLs is `apps/web/art/campaign/raw/thornwood/story/source/SOURCES.md`.

## Images and fonts

- Region Maps: the existing `apps/web/public/battle/thornwood-region.webp` and, for the last moment, `hollow-marches-region.webp`, unchanged, re-lit by shaders.
- Battle Painting: the existing `apps/web/public/battle/thornwood.webp`, re-lit by a shader, behind the ambush, the challenge and the Colossus.
- Cards: the existing card art `bristleback-boar` and `mountain-colossus` in `apps/web/public/creature/feral/`, and `bramble-nest` in `apps/web/public/creature/elf/`. The charging boar is the Bristleback Boar card art in a soft mask.
- The face of the Old Bramble, its bark, the brambles, the song, the cuts, the amber, the cutters and their lanterns, the stakes, the roots, the jars, the knives, the purse, the coins of bone, Lethiel's staff, the stone frame and the birds are drawn in code. Some props come from the Glowcap Hollows, Red Mesas and Hearthvale toolkits.
- The title font is [Cinzel](https://github.com/NDISCOVER/Cinzel) (the game's display face), SIL Open Font License 1.1, as a static weight-900 instance. The review text uses the repository's Lato.

## Software

The runtime and renderer are [fframes 1.3.0](https://github.com/dmtrKovalenko/fframes), under its [MIT license](https://github.com/dmtrKovalenko/fframes/blob/main/LICENSE.txt). The export uses H.264 through the GPL-enabled FFmpeg build selected by the fframes dependency. This project does not redistribute the renderer binary.
