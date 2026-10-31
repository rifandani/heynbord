# Red Mesas Story Scene media credits, version 1

Source pages and licences were checked on 2026-10-28. Listening review is pending: nobody has listened to these files, and the mood notes come from the creators' descriptions. The scenes have no voice and no generated recording.

## Audio

All recordings are [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Credit is voluntary; it does not imply creator approval of the game. Every delivered file is mono, 44.1 kHz MP3. `audio.py` gives the exact cut, fade and level of each file.

| Delivered file | Creator and source | Changes |
| --- | --- | --- |
| `opening-music.mp3` | eldritch-grim, [March of Manganda](https://opengameart.org/content/march-of-manganda), `march_of_manganda.wav` | Source 0–33 s twice, 2 s cross-fade; level adjustment; fades; 56 kbit/s. |
| `boss-music.mp3` | bobjt, [Imminent Battle](https://opengameart.org/content/imminent-battle), `cinimatic - imminent battle.mp3` | Source 0–38.4 s twice, 2 s cross-fade; level adjustment; 3 s exit fade; 56 kbit/s. |
| `ending-music.mp3` | cynicmusic, [Battle Theme A](https://opengameart.org/content/battle-theme-a), and Umplix, [Investigation](https://opengameart.org/content/investigation-0), `_investigation_with_trail.wav` | Battle Theme A 30–42 s, 2.5 s cross-fade into Investigation 0–58 s; level adjustment; 3 s exit fade; 56 kbit/s. |
| `explosion.mp3` | joth, [Chunky Explosion](https://opengameart.org/content/chunky-explosion) | First 3.2 s; exit fade; peak level. |
| `fuse.mp3` | themightyglider, [Simple fuse sound](https://opengameart.org/content/simple-fuse-sound), `fuse.ogg` | Fades; peak level. The page says that it derives from freesound sound 111325. |
| `rumble.mp3` | rubberduck, [100 CC0 SFX #2](https://opengameart.org/content/100-cc0-sfx-2), `sfx100v2_loop_machine_01.ogg` | First 2.6 s; fades; peak level. |
| `steam.mp3` | rubberduck, [100 CC0 SFX #2](https://opengameart.org/content/100-cc0-sfx-2), `sfx100v2_air_01.ogg` | First 1.6 s; fades; peak level. |
| `skid.mp3` | rubberduck, [75 CC0 breaking, falling and hit SFX](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx), `bfh1_metal_falling_01.ogg` | Exit fade; peak level. |
| `clank.mp3` | rubberduck, [75 CC0 breaking, falling and hit SFX](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx), `bfh1_metal_hit_03.ogg` | Exit fade; peak level. |
| `crunch.mp3` | rubberduck, [75 CC0 breaking, falling and hit SFX](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx), `bfh1_rock_breaking_02.ogg` | Exit fade; peak level. |
| `stones.mp3` | rubberduck, [75 CC0 breaking, falling and hit SFX](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx), `bfh1_rock_falling_01.ogg` | Exit fade; peak level. |
| `slam.mp3` | rubberduck, [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx), `slam_01.ogg` | Exit fade; peak level. |
| `splash.mp3` | rubberduck, [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx), `splash_01.ogg` | Exit fade; peak level. |
| `lid.mp3` | rubberduck, [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx), `wooded_box_open.ogg` | Exit fade; peak level. |
| `ring.mp3` | bmaczero, [Metal impact sounds](https://opengameart.org/content/metal-impact-sounds), `bong1.wav` | Exit fade; peak level. |
| `roar.mp3` | artisticdude, [RPG Sound Pack](https://opengameart.org/content/rpg-sound-pack), `NPC/giant/giant2.wav` | Exit fade; peak level. |
| `growl.mp3` | artisticdude, [RPG Sound Pack](https://opengameart.org/content/rpg-sound-pack), `NPC/ogre/ogre2.wav` | Exit fade; peak level. |
| `wind.mp3`, `boom.mp3`, `shimmer.mp3`, `magic.mp3`, `coins.mp3`, `coin.mp3`, `drums.mp3`, `drum.mp3`, `thud.mp3`, `cannon.mp3`, `paper.mp3` | The same sources and cuts as the Hearthvale scenes; see [its credits](../hearthvale/CREDITS.md). | As in the Hearthvale scenes. |

The source list with file URLs is `apps/web/art/campaign/raw/red-mesas/story/source/SOURCES.md`.

## Images and fonts

- Region Maps: the existing `apps/web/public/battle/red-mesas-region.webp` and, for the last glimpse, `glowcap-hollows-region.webp`, unchanged, re-lit by shaders.
- Battle Painting: the existing `apps/web/public/battle/red-mesas.webp`, re-lit by a shader, behind the challenge and the falling crown.
- Mine hall: the existing Dungeons cave painting `apps/web/public/town/cave-inside.webp`, re-lit, and a blurred, darkened copy for the paint works, the coin pile and the vault.
- Snikkit and Grukka: cut-outs of the existing card art `apps/web/public/creature/goblin/boss-snikkit.webp` and `apps/web/public/creature/orc/warchief-grukka.webp`, made with [rembg](https://github.com/danielgatis/rembg) and its `isnet-general-use` model by `cutout.py`, then cleaned by `prepare.py`. Grukka is shown from the waist up.
- Cards: the existing card art `tusk-brute`, `pyreaxe-ravager`, `mesa-pit-fighter` and `warchief-grukka` in `apps/web/public/creature/orc/`, and `junk-barricade` in `apps/web/public/creature/goblin/`.
- The cut-away rock, tunnels, carts, goblins, coins, stones, lens, paint works, bucket crown, banners, glowcaps, crate, letter, wax seal and the cut Accord Seal are drawn in code.
- The title font is [Cinzel](https://github.com/NDISCOVER/Cinzel) (the game's display face), SIL Open Font License 1.1, as a static weight-900 instance. The review text uses the repository's Lato.

## Software

The runtime and renderer are [fframes 1.3.0](https://github.com/dmtrKovalenko/fframes), under its [MIT license](https://github.com/dmtrKovalenko/fframes/blob/main/LICENSE.txt). The export uses H.264 through the GPL-enabled FFmpeg build selected by the fframes dependency. This project does not redistribute the renderer binary.
