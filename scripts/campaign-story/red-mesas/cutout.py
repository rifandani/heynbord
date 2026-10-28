"""Cut Snikkit and Grukka out of their card art with rembg (isnet-general-use).

Run it once in its own environment; prepare.py then cleans the alpha. The result
goes to the raw source folder, so a rebuild does not need rembg again.
"""
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "apps/web/art/campaign/raw/red-mesas/story/source/cutouts"
ARTS = {
    "snikkit": "apps/web/public/creature/goblin/boss-snikkit.webp",
    "grukka": "apps/web/public/creature/orc/warchief-grukka.webp",
}

if __name__ == "__main__":
    SOURCE.mkdir(parents=True, exist_ok=True)
    session = new_session("isnet-general-use")
    for name, path in ARTS.items():
        remove(Image.open(ROOT / path).convert("RGB"), session=session).save(SOURCE / f"{name}.png")
        print(f"Cut out {name}")
