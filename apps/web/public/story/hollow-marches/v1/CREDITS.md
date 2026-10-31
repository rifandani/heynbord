# Hollow Marches Story Scene media credits, version 1

Source pages and licences were checked on 2026-10-30. Listening review is pending: nobody has listened to these files, and the mood notes come from the creators' descriptions. The scenes have no voice and no generated recording.

## Audio

All recordings are [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Credit is voluntary; it does not imply creator approval of the game. Every delivered file is mono, 44.1 kHz MP3. `audio.py` gives the exact cut, fade and level of each file. No new source was downloaded for this Region: all files come from the source folders of the earlier Regions or from packs that they downloaded.

| Delivered file | Creator and source | Changes |
| --- | --- | --- |
| `opening-music.mp3` | sperrylion, [Ancient Mysteries](https://opengameart.org/content/ancient-mysteries), `ancient_mysteries_-_with_tail.mp3` | Source 0–70 s; level adjustment; fades; 56 kbit/s. |
| `boss-music.mp3` | Kistol, [Majesty](https://opengameart.org/content/majesty), `Majesty.ogg` | Source 0–72 s; level adjustment; fades; 56 kbit/s. |
| `ending-music.mp3` | Kistol, [Majesty](https://opengameart.org/content/majesty), `Majesty.ogg`, and isaiah658, [Unsolved Investigation](https://opengameart.org/content/unsolved-investigation), `Unsolved-Investigation-isaiah658.wav` | Majesty 96–126 s, 3 s cross-fade into Unsolved Investigation 0–48 s; level adjustment; 4 s exit fade; 56 kbit/s. |
| `ice.mp3`, `frost.mp3`, `clink.mp3`, `glass.mp3`, `links.mp3` | rubberduck, [75 CC0 breaking/falling/hit SFX](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx), `bfh1_glass_breaking_01.ogg`, `bfh1_glass_hit_02.ogg`, `bfh1_glass_hit_01.ogg`, `bfh1_metal_falling_02.ogg` | Breaking glass and glass hits played at half or one-third speed become cracking ice and frost; the metal fall at half speed is the chain rattle. Cuts; fades; peak level. |
| `clank.mp3`, `melt.mp3`, `creak.mp3` | vehicle, [Fantasy Sound Effects (Tinysized SFX)](https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx), `handcuffs-metal-lock-01.wav`, `water-drop-02.wav`, `floor-creak-01.wav` | The lock and the creak at half speed; cuts; fades; peak level. |
| `bell.mp3`, `toll.mp3` | rubberduck, [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx), `bell_03.ogg`, `bell_01.ogg` | Half and one-third speed, for grave bells; fades; peak level. |
| `splash.mp3` | rubberduck, [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx), `splash_01.ogg`, from the Red Mesas sources | Exit fade; peak level. |
| `quake.mp3`, `growl.mp3`, `pouch.mp3`, `coins.mp3`, `rattle.mp3`, `blade.mp3` | The Thornwood sources: mieki256 ([Earthquake and Open sesame](https://opengameart.org/content/earthquake-and-open-sesame)), AntumDeluge ([Bear Growls](https://opengameart.org/content/bear-growls), at half speed) and vehicle ([Tinysized SFX](https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx): `cloth-pouch-shake-01.wav`, `coins-shake-01.wav`, `chimes-wood-rattle.wav`, `seax-unsheathe-01.wav`). See [its credits](../thornwood/CREDITS.md). | Cuts; fades; peak level. |
| `chime.mp3`, `whoosh.mp3`, `slam.mp3`, `gate.mp3` | The Glowcap Hollows sources: pwl ([Bell dings/chimes](https://opengameart.org/content/bell-dingschimes)), vehicle ([Tinysized SFX](https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx)) and rubberduck ([100 CC0 metal and wood SFX](https://opengameart.org/content/100-cc0-metal-and-wood-sfx), `wood_slam_03.ogg` and `door_open_01.ogg`, the door at half speed). See [its credits](../glowcap-hollows/CREDITS.md). | Cuts; fades; peak level. |
| `wind.mp3`, `gust.mp3`, `boom.mp3`, `shimmer.mp3`, `magic.mp3`, `thud.mp3`, `drums.mp3`, `coin.mp3`, `flare.mp3`, `cloth.mp3` | The Hearthvale sources: short wind sound, SketchMan3's [Wind whoosh loop](https://opengameart.org/content/wind-whoosh-loop), NenadSimic's muffled explosion, the healing and teleport spells, Kenney's soft impact, the horde war drums, Vehicle's coin spin, PagDev's [Fireplace sound loop](https://opengameart.org/content/fireplace-sound-loop) and artisticdude's [RPG Sound Pack](https://opengameart.org/content/rpg-sound-pack) cloth. See [its credits](../hearthvale/CREDITS.md). | Cuts; fades; peak level. |

The source list with page URLs is `apps/web/art/campaign/raw/hollow-marches/story/source/SOURCES.md`.

## Images and fonts

- Region Map: the existing `apps/web/public/battle/hollow-marches-region.webp`, unchanged, re-lit by shaders.
- Battle Painting: the existing `apps/web/public/battle/hollow-marches.webp`, re-lit by a shader, behind the challenge.
- Cards: the existing card art `bone-rampart` and `hushbow` in `apps/web/public/creature/undead/`, and `blizzard` in `apps/web/public/skills/mage/`.
- Cut-outs of the existing card art: the court (Lantern Widow, Hushbow, Coffin Lancer, Chattering Cohort), the dead of the marsh (Graveyard Drudge, Rattleknife), the frost beasts (Woolly Mammoth, Avalanche Yeti, Frost Elk Matriarch, Frostfang Lynx, Old Frostmaw) and the Mountain Colossus, made with [rembg](https://github.com/danielgatis/rembg) and its `birefnet-general-lite` model by `cutout.py`, then cleaned by `prepare.py`. They are re-lit in code.
- Queen Marrow, her throne, the hall, the ribs, the Bone Ferry and its ferryman, the frost, the ice, the reeds, the chains, the wisp, the coin of tower stone and Heynspire are drawn in code. The coins of bone and the purse come from the Thornwood toolkit, and other props from the Hearthvale, Red Mesas and Glowcap Hollows toolkits.
- The title font is [Cinzel](https://github.com/NDISCOVER/Cinzel) (the game's display face), SIL Open Font License 1.1, as a static weight-900 instance. The review text uses the repository's Lato.

## Software

The runtime and renderer are [fframes 1.3.0](https://github.com/dmtrKovalenko/fframes), under its [MIT license](https://github.com/dmtrKovalenko/fframes/blob/main/LICENSE.txt). The cut-outs use [rembg](https://github.com/danielgatis/rembg) (MIT) with the BiRefNet model (MIT). The export uses H.264 through the GPL-enabled FFmpeg build selected by the fframes dependency. This project does not redistribute the renderer binary.
