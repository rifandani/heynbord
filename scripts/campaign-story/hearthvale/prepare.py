"""Prepare the paintings, cut-outs, fonts, script, and licensed audio for version 2."""
from pathlib import Path
import hashlib
import json
import re
import subprocess

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

PROJECT = Path(__file__).resolve().parent
ROOT = PROJECT.parents[2]
RAW = ROOT / "apps/web/art/campaign/raw/hearthvale/story"
MEDIA = RAW / "prepared"
FONT_SOURCE = RAW / "source/fonts/Cinzel[wght].ttf"
SCENES = ["OpeningFire", "OpeningAccord", "OpeningValley", "OpeningBaron", "OpeningRoad",
          "BossHall", "BossBaron", "BossToll", "BossFriend", "BossChallenge",
          "EndingBanner", "EndingVault", "EndingStone", "EndingSeal", "EndingTrail"]
KINDS = ["opening", "boss", "ending"]
PER_SCENE = 5
MOMENTS = len(SCENES)
CLIP_FRAMES = 270
CARDS = ["tusk-brute", "scrap-raider", "warhowler-drummer", "howling-charger"]

# The Baron's outline in the 1536 x 1024 Dungeon 3 painting. It leaves out the
# Elf warden at the right and the tree giant behind his hat.
BARON = [(541, 390), (586, 350), (636, 337), (676, 355), (721, 395), (733, 427),
         (701, 437), (726, 475), (761, 520), (776, 555), (771, 590), (766, 630),
         (776, 680), (796, 730), (791, 770), (761, 810), (736, 838), (601, 830),
         (526, 834), (496, 812), (476, 760), (476, 700), (491, 640), (506, 590),
         (476, 565), (476, 530), (496, 495), (396, 482), (406, 468), (476, 420),
         (541, 415)]


def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def paintings(hashes):
    # The Region Maps, and the Battle Painting behind the Boss challenge.
    for name in ["hearthvale-region", "red-mesas-region", "hearthvale"]:
        source = ROOT / f"apps/web/public/battle/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        Image.open(source).convert("RGB").resize((1600, 900), Image.LANCZOS).save(MEDIA / f"{name}.png")

    vault = ROOT / "apps/web/public/dungeons/stop-3.webp"
    hashes[str(vault.relative_to(ROOT))] = digest(vault)
    painting = Image.open(vault).convert("RGB")
    mask = Image.new("L", painting.size)
    ImageDraw.Draw(mask).polygon(BARON, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    cut = painting.copy()
    cut.putalpha(mask)
    cut.crop((376, 330, 806, 862)).save(MEDIA / "baron.png")
    # Out-of-focus vault light for the desk shots: warm and dark, no readable figures.
    bokeh = painting.resize((1280, 853), Image.LANCZOS).crop((0, 66, 1280, 786))
    bokeh = bokeh.filter(ImageFilter.GaussianBlur(26))
    bokeh = ImageEnhance.Brightness(bokeh).enhance(0.42)
    bokeh.save(MEDIA / "vault-bokeh.png")

    for name in CARDS:
        source = ROOT / f"apps/web/public/creature/orc/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        Image.open(source).convert("RGB").resize((240, 320), Image.LANCZOS).save(MEDIA / f"card-{name}.png")

    # The Baron's bodyguard in the Boss scene, shown larger than the Orc cards.
    shield = ROOT / "apps/web/public/creature/human/shieldbearer.webp"
    hashes[str(shield.relative_to(ROOT))] = digest(shield)
    Image.open(shield).convert("RGB").resize((360, 480), Image.LANCZOS).save(MEDIA / "card-shieldbearer.png")


def fonts():
    lato = TTFont(ROOT / "apps/web/src/core/assets/fonts/lato-v24-latin-regular.woff2")
    lato.flavor = None
    lato.save(MEDIA / "Lato-Regular.ttf")
    # The game's display face (OFL). A static weight-900 instance, renamed so that
    # the renderer finds it by its family name.
    cinzel = instancer.instantiateVariableFont(TTFont(FONT_SOURCE), {"wght": 900})
    names = cinzel["name"]
    for record in names.names:
        if record.nameID in (1, 16):
            record.string = "Cinzel"
        elif record.nameID in (2, 17):
            record.string = "Black"
    cinzel["OS/2"].usWeightClass = 900
    cinzel.save(MEDIA / "Cinzel-Black.ttf")
    return lato


def script(lato):
    text = (ROOT / "docs/game/scenes/hearthvale-storyboard.md").read_text()
    en = re.findall(r"\*\*English:\*\* (.+)", text)
    ind = re.findall(r"\*\*Indonesian:\*\* (.+)", text)
    if len(en) != MOMENTS or len(ind) != MOMENTS:
        raise ValueError(f"The storyboard must contain {MOMENTS} moments in both Locales")
    glyphs = lato.getBestCmap()
    missing = {c for line in en + ind for c in line if ord(c) not in glyphs}
    if missing:
        raise ValueError(f"Missing Lato glyphs: {missing}")
    moments = [dict(id=name, text={"en-us": en[i], "id-id": ind[i]},
                    startFrame=i * CLIP_FRAMES, endFrame=(i + 1) * CLIP_FRAMES)
               for i, name in enumerate(SCENES)]
    (MEDIA / "script.json").write_text(json.dumps(moments, ensure_ascii=False, indent=2) + "\n")
    rust = "// Copied from the canonical storyboard by prepare.py.\n"
    rust += f"pub const SCRIPT: [[&str; 2]; {MOMENTS}] = [\n"
    rust += "".join(f"    [{json.dumps(a, ensure_ascii=False)}, {json.dumps(b, ensure_ascii=False)}],\n"
                    for a, b in zip(en, ind))
    (PROJECT / "src/script.rs").write_text(rust + "];\n")


def prepare():
    for folder in [MEDIA, RAW / "delivery/audio", RAW / "review", RAW / "masters"]:
        folder.mkdir(parents=True, exist_ok=True)
    for stale in MEDIA.iterdir():
        stale.unlink()
    hashes = {}
    paintings(hashes)
    script(fonts())
    (RAW / "review/source-hashes.json").write_text(json.dumps(hashes, indent=2) + "\n")
    import audio
    audio.prepare(MEDIA, RAW)
    print(f"Prepared {MOMENTS} moments, paintings, cut-outs, fonts and audio in {MEDIA}")


if __name__ == "__main__":
    prepare()
