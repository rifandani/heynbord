"""Check the four first-reference GLBs. This does not approve or publish art.

Run after reference.py: python3 scripts/hero-model/check_references.py
"""
import json
import os
from pathlib import Path
import struct
import sys
import argparse

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DIR = ROOT / "apps/web/art/heroes/raw"
MAX_BYTES = 10_000_000
CLIPS = frozenset(("idle", "lowHp", "summon", "castWarrior", "castRanger", "castMage", "castPriest", "hurt", "victory", "defeat"))
REFERENCES = tuple(f"{person}-{look}" for person in ("standard", "tent-rings") for look in ("standard", "gold-inlay"))
PEOPLE = ("standard", "dawn-gaze", "verdant-crest", "mesa-shade", "salt-wind", "lantern-keeper", "tent-rings", "gold-crest")
GEAR = ("standard", "copper-rim", "iron-vine", "stag-leather", "gold-inlay", "moonstone", "royal-plate")
ALL_APPEARANCES = tuple(f"{person}-{look}" for person in PEOPLE for look in GEAR)


def check(path):
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError("GLB header is incomplete")
    magic, version, length, chunk_length, chunk_type = struct.unpack_from("<4sIIII", data)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise ValueError("invalid GLB header or length")
    if chunk_type != 0x4E4F534A or chunk_length > len(data) - 20:
        raise ValueError("invalid GLB JSON chunk")
    gltf = json.loads(data[20:20 + chunk_length])
    errors = []
    if len(data) > MAX_BYTES:
        errors.append(f"{len(data)} bytes exceeds {MAX_BYTES}")
    for resource in (*gltf.get("buffers", []), *gltf.get("images", [])):
        if "uri" in resource:
            errors.append("external or data URI resource is not counted in the GLB")
    animations = [clip.get("name", "") for clip in gltf.get("animations", [])]
    for clip in sorted(CLIPS - set(animations)):
        errors.append(f"missing clip: {clip}")
    for clip in sorted(set(animations) - CLIPS):
        errors.append(f"unknown clip: {clip}")
    if len(animations) != len(set(animations)):
        errors.append("duplicate clip names")
    if not any(skin.get("joints") for skin in gltf.get("skins", [])):
        errors.append("no skeleton")
    return len(data), errors


def main():
    parser = argparse.ArgumentParser(description="Check complete Hero GLBs and report their bytes.")
    parser.add_argument("--all", action="store_true", help="Check all 56 appearances instead of the first four references.")
    parser.add_argument("--json", action="store_true", help="Print the report as JSON.")
    args = parser.parse_args()
    directory = Path(os.environ.get("HEYNBORD_HERO_REFERENCE_OUT", DEFAULT_DIR))
    failed = False
    report = []
    for name in ALL_APPEARANCES if args.all else REFERENCES:
        try:
            size, errors = check(directory / f"{name}.glb")
        except (OSError, ValueError, json.JSONDecodeError) as error:
            size, errors = 0, [str(error)]
        detail = "; ".join(errors) if errors else "structural checks passed"
        report.append({"appearance": name, "bytes": size, "errors": errors})
        if not args.json:
            print(f"{name}: {size} bytes; {detail}")
        failed |= bool(errors)
    if args.json:
        print(json.dumps({"appearances": report, "art_and_battle_checks": "not checked"}, indent=2))
    else:
        print("Art review and whole-Battle performance checks are not covered.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
