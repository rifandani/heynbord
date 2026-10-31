"""Prepare the paintings, cut-outs, cards, fonts, script and licensed audio of the Red Mesas scenes."""
from pathlib import Path
import hashlib
import json
import re

from PIL import Image, ImageChops, ImageEnhance, ImageFilter
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

PROJECT = Path(__file__).resolve().parent
ROOT = PROJECT.parents[2]
RAW = ROOT / "apps/web/art/campaign/raw/red-mesas/story"
MEDIA = RAW / "prepared"
# The Cinzel source is shared with the Hearthvale scenes.
FONT_SOURCE = ROOT / "apps/web/art/campaign/raw/hearthvale/story/source/fonts/Cinzel[wght].ttf"
SCENES = ["OpeningLand", "OpeningMines", "OpeningSnikkit", "OpeningStone", "OpeningRoad",
          "BossHall", "BossSnikkit", "BossTrick", "BossBuyer", "BossChallenge",
          "EndingCrown", "EndingBite", "EndingWarchief", "EndingPayment", "EndingTunnel"]
KINDS = ["opening", "boss", "ending"]
PER_SCENE = 5
MOMENTS = len(SCENES)
CLIP_FRAMES = 270
CARDS = {
    "tusk-brute": "orc", "pyreaxe-ravager": "orc", "mesa-pit-fighter": "orc",
    "warchief-grukka": "orc", "junk-barricade": "goblin",
}


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
    for name in ["red-mesas-region", "red-mesas", "glowcap-hollows-region"]:
        source = ROOT / f"apps/web/public/battle/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        cover(Image.open(source).convert("RGB"), (1600, 900)).save(MEDIA / f"{name}.png")

    # The Dungeons cave: the inside of Snikkit's mine, sharp and out of focus.
    cave = ROOT / "apps/web/public/town/cave-inside.webp"
    hashes[str(cave.relative_to(ROOT))] = digest(cave)
    painting = cover(Image.open(cave).convert("RGB"), (1600, 900))
    painting.save(MEDIA / "cave.png")
    bokeh = cover(painting, (1280, 720)).filter(ImageFilter.GaussianBlur(22))
    ImageEnhance.Brightness(bokeh).enhance(0.5).save(MEDIA / "cave-bokeh.png")

    for name, race in CARDS.items():
        source = ROOT / f"apps/web/public/creature/{race}/{name}.webp"
        hashes[str(source.relative_to(ROOT))] = digest(source)
        Image.open(source).convert("RGB").resize((300, 400), Image.LANCZOS).save(MEDIA / f"card-{name}.png")


def cutouts(hashes):
    source = RAW / "source/cutouts"
    snikkit = clean_alpha(Image.open(source / "snikkit.png").convert("RGBA"), 70, 190)
    # Snikkit and his cart, without the empty margin of the card art.
    snikkit.crop((40, 40, 600, 720)).save(MEDIA / "snikkit.png")
    grukka = clean_alpha(Image.open(source / "grukka.png").convert("RGBA"), 80, 200)
    # Grukka from the waist up: the matting loses his legs, so they fade out.
    grukka = grukka.crop((80, 0, 600, 560))
    fade = Image.linear_gradient("L").resize(grukka.size).point(lambda v: 255 if v < 150 else max(0, 255 - (v - 150) * 255 // 105))
    grukka.putalpha(ImageChops.multiply(grukka.getchannel("A"), fade))
    grukka.save(MEDIA / "grukka.png")
    for name in ["snikkit", "grukka"]:
        hashes[f"source/cutouts/{name}.png"] = digest(source / f"{name}.png")


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
    text = (ROOT / "docs/game/scenes/red-mesas-storyboard.md").read_text()
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
    print(f"Prepared {MOMENTS} moments, paintings, cut-outs, fonts and audio in {MEDIA}")


if __name__ == "__main__":
    prepare()
