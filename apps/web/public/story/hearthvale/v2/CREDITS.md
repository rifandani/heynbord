# Hearthvale Story Scene media credits, version 2

Source pages and licences were checked on 2026-10-27 and 2026-10-28. Listening review is pending. The scenes have no voice and no generated recording.

## Audio

All recordings are [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Credit is voluntary; it does not imply creator approval of the game. Every delivered file is mono, 44.1 kHz MP3. `audio.py` gives the exact cut, fade and level of each file.

| Delivered file | Creator and source | Changes |
| --- | --- | --- |
| `opening-music.mp3` | Umplix, [The Fire Dragon](https://opengameart.org/content/the-fire-dragon) | Source 0–80 s; level adjustment; 3 s exit fade; 56 kbit/s. |
| `ending-music.mp3` | Umplix, [The Fire Dragon](https://opengameart.org/content/the-fire-dragon) and [The Relic Under the Ice](https://opengameart.org/content/the-relic-under-the-ice) | Fire Dragon 100–112 s, 2.5 s cross-fade into Relic 0–70 s; level adjustment; 3 s exit fade; 56 kbit/s. |
| `fire.mp3` | PagDev, [Fireplace sound loop](https://opengameart.org/content/fireplace-sound-loop) | First 9 s; fades; peak level. |
| `boom.mp3` | NenadSimic, [Muffled Distant Explosion](https://opengameart.org/content/muffled-distant-explosion) | First 3.5 s; exit fade; peak level. |
| `shimmer.mp3` | Spring Spring, [Magic words healing sound effect](https://opengameart.org/content/magic-words-healing-sound-effect) | First 3 s; exit fade; peak level. |
| `wind.mp3` | remaxim, [Short wind sound](https://opengameart.org/content/short-wind-sound) | Fades; peak level. |
| `thunder.mp3` | rubberduck, [100 CC0 SFX #2](https://opengameart.org/content/100-cc0-sfx-2), `sfx100v2_thunder_01.ogg` | Exit fade; peak level. |
| `drum.mp3` | William Hector, [Horde war drums loop](https://opengameart.org/content/horde-war-drums-loop) | One 0.45 s hit; exit fade; peak level. |
| `flap.mp3` | AntumDeluge, [Large wings flap](https://opengameart.org/content/large-wings-flap) | Used as a falling banner; exit fade; peak level. |
| `coins.mp3` | Amarikah, [Sack of gold](https://opengameart.org/content/sack-of-gold) | Exit fade; peak level. |
| `coin-spin.mp3` | Vehicle (Jan Schupke), [Fantasy accessory SFX library](https://opengameart.org/content/fantasy-accessory-sfx-library), `coin-spin-fall-01.wav` | Exit fade; peak level. |
| `crack.mp3` | rubberduck, [75 CC0 breaking, falling and hit SFX](https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx), `bfh1_rock_breaking_01.ogg` | Exit fade; peak level. |
| `thud.mp3` | Kenney, [Impact Sounds](https://kenney.nl/assets/impact-sounds), `impactSoft_heavy_000.ogg` | Exit fade; peak level. |
| `boss-music.mp3` | Umplix, [The Confrontation](https://opengameart.org/content/the-confrontation), `i_killed_your_brother_0.wav` | Source 0–79 s; level adjustment; 3 s exit fade; 56 kbit/s. |
| `torch.mp3` | AntumDeluge, [Fire crackling](https://opengameart.org/content/fire-crackling) | First 1.6 s; exit fade; peak level. |
| `gate.mp3` | Kenney, [Impact Sounds](https://kenney.nl/assets/impact-sounds), `impactWood_heavy_000.ogg` | Exit fade; peak level. |
| `cloth.mp3` | artisticdude, [RPG Sound Pack](https://opengameart.org/content/rpg-sound-pack), `cloth-heavy.wav` | Exit fade; peak level. |
| `coin.mp3` | Vinrax, [Coin drop](https://opengameart.org/content/coin-drop) | Exit fade; peak level. |
| `magic.mp3` | Ogrebane, [Teleport spell](https://opengameart.org/content/teleport-spell) | Exit fade; peak level. |
| `cannon.mp3` | Thimras, [Battle at sea](https://opengameart.org/content/battle-at-sea), `cannon_fire_1.ogg` | First 3 s; exit fade; peak level. |
| `drums.mp3` | William Hector, [Horde war drums loop](https://opengameart.org/content/horde-war-drums-loop) | First 2.4 s; exit fade; peak level. |
| `paper.mp3` | Luckius, [Various Paper Sound Effects](https://opengameart.org/content/various-paper-sound-effects), `paper_sound_-_1.mp3` | First 0.48 s; fades; peak level. Luckius asks for credit where possible. |

The source list with file URLs is `apps/web/art/campaign/raw/hearthvale/story/source/audio-v2/SOURCES.md`.

## Images and fonts

- Battle Painting: the existing `apps/web/public/battle/hearthvale.webp`, re-lit by a shader, behind the Boss challenge.
- Shieldbearer card: the existing Human card art `apps/web/public/creature/human/shieldbearer.webp`.
- Region Maps: the existing `apps/web/public/battle/hearthvale-region.webp` and `red-mesas-region.webp`, unchanged, re-lit by shaders.
- The Baron: a cut-out of the existing Dungeon 3 painting, `apps/web/public/dungeons/stop-3.webp`. Its provenance is in `stop-3.webp.json`.
- Vault background: the same painting, blurred and darkened so that no figure is readable.
- Cards: the existing Orc card art `tusk-brute`, `scrap-raider`, `warhowler-drummer` and `howling-charger` in `apps/web/public/creature/orc/`.
- Armies, Accord Seal, coins, banners, letter, wax seals, candle, curtains, torches, carts, sack, lanes and the hooded figure are drawn in code.
- The title font is [Cinzel](https://github.com/NDISCOVER/Cinzel) (the game's display face), SIL Open Font License 1.1, as a static weight-900 instance. The review text uses the repository's Lato.

## Software

The runtime and renderer are [fframes 1.3.0](https://github.com/dmtrKovalenko/fframes), under its [MIT license](https://github.com/dmtrKovalenko/fframes/blob/main/LICENSE.txt). The export uses H.264 through the GPL-enabled FFmpeg build selected by the fframes dependency. This project does not redistribute the renderer binary.
