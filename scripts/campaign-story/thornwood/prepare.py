"""Prepare the paintings, cards, fonts, script and licensed audio of the Thornwood scenes."""
from pathlib import Path
import hashlib
import json
import re

from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

PROJECT = Path(__file__).resolve().parent
ROOT = PROJECT.parents[2]
RAW = ROOT / "apps/web/art/campaign/raw/thornwood/story"
MEDIA = RAW / "prepared"
# The Cinzel source is shared with the Hearthvale scenes.
FONT_SOURCE = ROOT / "apps/web/art/campaign/raw/hearthvale/story/source/fonts/Cinzel[wght].ttf"
SCENES = ["OpeningForest", "OpeningGiant", "OpeningCuts", "OpeningAmbush", "OpeningRoad",
          "BossWakes", "BossBramble", "BossCutters", "BossThorn", "BossChallenge",
          "EndingRest", "EndingGardener", "EndingCamp", "EndingColossus", "EndingMarches"]
KINDS = ["opening", "boss", "ending"]
PER_SCENE = 5
MOMENTS = len(SCENES)
CLIP_FRAMES = 270
# (race, card, size): the boar charges out of the dark at full size.
CARDS = [("feral", "bristleback-boar", (600, 800)), ("elf", "bramble-nest", (300, 400)),
         ("feral", "mountain-colossus", (450, 600))]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cover(image, size):
    """Scale and center-crop to fill `size`."""
    w, h = image.size
    k = max(size[0] / w, size[1] / h)
    image = image.resize((round(w * k), round(h * k)), Image.LANCZOS)
    x, y = (image.width - size[0]) // 2, (image.height - size[1]) // 2
    return image.crop((x, y, x + size[0], y + size[1]))


def paintings(hashes):
    for name in ["thornwood-region", "thornwood", "hollow-marches-region"]:
        source = ROOT / f"apps/web/public/battle/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        cover(Image.open(source).convert("RGB"), (1600, 900)).save(MEDIA / f"{name}.png")
    for race, name, size in CARDS:
        source = ROOT / f"apps/web/public/creature/{race}/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        Image.open(source).convert("RGB").resize(size, Image.LANCZOS).save(MEDIA / f"card-{name}.png")


def fonts():
    lato = TTFont(ROOT / "apps/web/src/core/assets/fonts/lato-v24-latin-regular.woff2")
    lato.flavor = None
    lato.save(MEDIA / "Lato-Regular.ttf")
    # The game's display face (OFL), as a static weight-900 instance.
    cinzel = instancer.instantiateVariableFont(TTFont(FONT_SOURCE), {"wght": 900})
    for record in cinzel["name"].names:
        if record.nameID in (1, 16):
            record.string = "Cinzel"
        elif record.nameID in (2, 17):
            record.string = "Black"
    cinzel["OS/2"].usWeightClass = 900
    cinzel.save(MEDIA / "Cinzel-Black.ttf")
    return lato


def script(lato):
    text = (ROOT / "docs/game/scenes/thornwood-storyboard.md").read_text()
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
    print(f"Prepared {MOMENTS} moments, paintings, cards, fonts and audio in {MEDIA}")


if __name__ == "__main__":
    prepare()
