"""Find the Body Region of a Unit Model part, without Blender."""

import json
from pathlib import Path
import re

# `region.ts` reads the same file. An id is a position in the list + 1, so an id
# of 0 means that a vertex has no region.
REGIONS = tuple(
    json.loads((Path(__file__).resolve().parent / "regions.json").read_text(encoding="utf-8"))
)
REGION_ATTRIBUTE = "_region"

# The words of a part name or a bone name that give a region. The first group
# with a match gives the region. "arm" and "leg" get a side from `part_region`.
# Any other part gets the torso, and a part can set `region` itself.
_REGION_WORDS = {
    "effect": set(
        "blast breath clod cracks cut dew ember embers fire flame flames flash "
        "frost glow leak light motes notes regrow seeds smoke spark sparks spit "
        "spray steam toss wisp wisps wound"
        .split()
    ),
    "base": set(
        "base ground hole mound mud platform plinth puddle smear stand"
        .split()
    ),
    "prop": set(
        "acorn arrow arrows axe bag banner barrel basket baton bell bells bird "
        "bolt bomb bombs book bow bowl bucket bud buddy calf can candle cannon "
        "chain chains charms cleaver club coffin crate crossbow crow cup drum "
        "flag fork frog glaive glider halberd hook hose hourglass kegs kettle "
        "keys knife ladder ladle lance lantern lever lid log mace meat mop "
        "mossball orb paper parcel pavise permit pick pike pillow pipe pipes "
        "pitcher pliers pole polearm pot pup quill quiver racket ram rapier rat "
        "rifle sack sail satchel sausage scroll scythe shield sickle sign sling "
        "spade spear staff stick stone stool string sword tendril torch totem "
        "trap tube vine"
        .split()
    ),
    "head": set(
        "antlers beard braid bridle brows cap circlet crest crown ear earrings "
        "eye eyes face fangs goggles hair hat head helmet hood horns jaw locks "
        "moustache mouth neck pony rface rhead rjaw rneck rskull scalp skull "
        "snout sockets teeth tiara tusks veil"
        .split()
    ),
    "arm": set(
        "arm arms claw fist forearm hand point rforearm rupper shoulder upperarm "
        "wing wingtip"
        .split()
    ),
    "leg": set(
        "boot femur foot hoof leg legs paw rshin rthigh shin thigh tibia toes "
        "wheel"
        .split()
    ),
}


def region_id(region):
    """The id of a region name from `REGIONS`."""
    if region not in REGIONS:
        raise ValueError(f"unknown Body Region: {region}")
    return REGIONS.index(region) + 1



def region_name(region):
    """The name of a region id. It is the reverse of `region_id`."""
    return REGIONS[region - 1]


def _name_tokens(name):
    """The tokens of "cloth.F", "leaf-vest" or "sashEnd", with no case change."""
    spaced = re.sub(r"(?<=[a-z])(?=[A-Z])", ".", name)
    return re.split(r"[.\-_]", spaced)


def _side_of(name):
    for token in _name_tokens(name):
        match = re.fullmatch(r"[FB]?([LR])\d*", token)
        if match:
            return match.group(1)
    return None


def _region_group(name):
    words = {re.sub(r"\d+$", "", token).lower() for token in _name_tokens(name)}
    for group, vocabulary in _REGION_WORDS.items():
        if words & vocabulary:
            return group
    # "upper.FL" is a leg of a beast, but "upper" alone is the top of a coat.
    if words & {"upper", "lower"} and _side_of(name):
        return "leg"
    return None


def part_region(name, bone, center_x):
    """
    The region of a part with this name, main bone and mean X position. The
    name decides first: a sword on the hand bone is a prop, not an arm. The
    left side of the figure is +X, for a limb with no side in its name.
    """
    group = _region_group(name) or _region_group(bone) or "torso"
    if group not in ("arm", "leg"):
        return group
    side = _side_of(name) or _side_of(bone) or ("L" if center_x >= 0 else "R")
    return f"{group}.{side}"
