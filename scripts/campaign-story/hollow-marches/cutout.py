"""Cut the court, the dead, the frost beasts and the Colossus out of their card art
with rembg (birefnet-general-lite).

Run it once in its own environment; prepare.py then cleans the alpha. The result
goes to the raw source folder, so a rebuild does not need rembg again.
"""
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "apps/web/art/campaign/raw/hollow-marches/story/source/cutouts"
ARTS = {
    # The court of Queen Marrow.
    "lantern-widow": "undead/lantern-widow",
    "hushbow": "undead/hushbow",
    "coffin-lancer": "undead/coffin-lancer",
    "chattering-cohort": "undead/chattering-cohort",
    # The dead of the marsh, who flee from the beasts.
    "graveyard-drudge": "undead/graveyard-drudge",
    "rattleknife": "undead/rattleknife",
    # The frost beasts and the Colossus.
    "woolly-mammoth": "feral/woolly-mammoth",
    "avalanche-yeti": "feral/avalanche-yeti",
    "frost-elk-matriarch": "feral/frost-elk-matriarch",
    "frostfang-lynx": "feral/frostfang-lynx",
    "old-frostmaw": "feral/old-frostmaw",
    "mountain-colossus": "feral/mountain-colossus",
}

if __name__ == "__main__":
    SOURCE.mkdir(parents=True, exist_ok=True)
    session = new_session("birefnet-general-lite")
    for name, path in ARTS.items():
        art = Image.open(ROOT / f"apps/web/public/creature/{path}.webp").convert("RGB")
        remove(art, session=session).save(SOURCE / f"{name}.png")
        print(f"Cut out {name}")
