"""Prepare the paintings, cards, cut-outs, fonts, script and licensed audio of the Hollow Marches scenes."""
from pathlib import Path
import hashlib
import json
import re

from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

PROJECT = Path(__file__).resolve().parent
ROOT = PROJECT.parents[2]
RAW = ROOT / "apps/web/art/campaign/raw/hollow-marches/story"
MEDIA = RAW / "prepared"
# The Cinzel source is shared with the Hearthvale scenes.
FONT_SOURCE = ROOT / "apps/web/art/campaign/raw/hearthvale/story/source/fonts/Cinzel[wght].ttf"
SCENES = ["OpeningFrost", "OpeningBeasts", "OpeningGiant", "OpeningCrossings", "OpeningRoad",
          "BossHall", "BossAccusation", "BossProof", "BossReversal", "BossChallenge",
          "EndingThaw", "EndingLoud", "EndingStone", "EndingRampart", "EndingHeynspire"]
KINDS = ["opening", "boss", "ending"]
PER_SCENE = 5
MOMENTS = len(SCENES)
CLIP_FRAMES = 270
# (folder, card, size): the Bone Rampart of the gift fills half the frame.
CARDS = [("undead", "bone-rampart", (600, 800)), ("undead", "hushbow", (300, 400)),
         ("skills/mage", "blizzard", (300, 400))]
# (cut-out, height, alpha low, alpha high): the court and the Colossus stand tall,
# the beasts and the dead of the marsh are small.
CUTOUTS = [("lantern-widow", 520, 60, 200), ("hushbow", 520, 60, 200), ("coffin-lancer", 520, 60, 200),
           ("chattering-cohort", 400, 60, 200), ("graveyard-drudge", 260, 60, 200),
           ("rattleknife", 260, 60, 200), ("woolly-mammoth", 300, 60, 200),
           ("avalanche-yeti", 260, 60, 200), ("frost-elk-matriarch", 300, 60, 200),
           ("frostfang-lynx", 220, 60, 200), ("old-frostmaw", 300, 60, 200),
           ("mountain-colossus", 720, 60, 200)]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def cover(image, size):
    """Scale and center-crop to fill `size`."""
    w, h = image.size
    k = max(size[0] / w, size[1] / h)
    image = image.resize((round(w * k), round(h * k)), Image.LANCZOS)
    x, y = (image.width - size[0]) // 2, (image.height - size[1]) // 2
    return image.crop((x, y, x + size[0], y + size[1]))


def clean_alpha(image, low, high):
    """Remove the faint haze that the matting leaves around a figure."""
    alpha = image.getchannel("A").point(lambda a: max(0, min(255, round((a - low) * 255 / (high - low)))))
    image.putalpha(alpha)
    return image


def paintings(hashes):
    for name in ["hollow-marches-region", "hollow-marches"]:
        source = ROOT / f"apps/web/public/battle/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        cover(Image.open(source).convert("RGB"), (1600, 900)).save(MEDIA / f"{name}.png")
    for folder, name, size in CARDS:
        source = ROOT / f"apps/web/public/{'creature/' if '/' not in folder else ''}{folder}/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        Image.open(source).convert("RGB").resize(size, Image.LANCZOS).save(MEDIA / f"card-{name}.png")


def cutouts(hashes):
    """Each cut-out is cropped to its figure and scaled to its height."""
    source = RAW / "source/cutouts"
    sizes = {}
    for name, height, low, high in CUTOUTS:
        figure = clean_alpha(Image.open(source / f"{name}.png").convert("RGBA"), low, high)
        figure = figure.crop(figure.getchannel("A").getbbox())
        width = round(figure.width * height / figure.height)
        figure.resize((width, height), Image.LANCZOS).save(MEDIA / f"cut-{name}.png")
        hashes[f"source/cutouts/{name}.png"] = digest(source / f"{name}.png")
        sizes[name] = [width, height]
    # The drawing code reads the sizes from src/cutouts.rs.
    rust = "// Written by prepare.py: the pixel size of each prepared cut-out.\n"
    rust += "".join(f"pub const {n.upper().replace('-', '_')}: (f32, f32) = ({w}., {h}.);\n" for n, (w, h) in sizes.items())
    (PROJECT / "src/cutouts.rs").write_text(rust)


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
    text = (ROOT / "docs/game/scenes/hollow-marches-storyboard.md").read_text()
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
    cutouts(hashes)
    script(fonts())
    (RAW / "review/source-hashes.json").write_text(json.dumps(hashes, indent=2) + "\n")
    import audio
    audio.prepare(MEDIA, RAW)
    print(f"Prepared {MOMENTS} moments, paintings, cards, cut-outs, fonts and audio in {MEDIA}")


if __name__ == "__main__":
    prepare()
