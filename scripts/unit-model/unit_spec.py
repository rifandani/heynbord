"""Load and check Unit Specs without Blender or third-party Python packages."""

import argparse
import json
import math
from pathlib import Path
import re
import sys
from typing import Any, NotRequired, TypedDict, cast


DIRECTORY = Path(__file__).resolve().parent
SCHEMA = json.loads((DIRECTORY / "unit-spec.schema.json").read_text(encoding="utf-8"))


class PropSpec(TypedDict):
    id: str
    hand: str
    cameraSide: bool
    bone: str


class ClipSpec(TypedDict):
    override: NotRequired[str]


class IdentitySpec(TypedDict):
    feature: str
    azimuthDegrees: float


class RegionBox(TypedDict):
    x0: float
    x1: float
    y0: float
    y1: float


class UnitSpec(TypedDict):
    id: str
    bodyPlan: str
    height: float
    palette: dict[str, str]
    parts: list[str]
    props: list[PropSpec]
    clips: dict[str, ClipSpec]
    details: list[str]
    identity: IdentitySpec
    regions: NotRequired[dict[str, RegionBox]]
    flying: NotRequired[bool]
    footBones: NotRequired[list[str]]
    holedParts: NotRequired[list[str]]


def _validate(value: Any, rule: dict[str, Any], path: str, errors: list[str]) -> None:
    """Check the schema's keywords. This is not a general JSON Schema engine."""
    if "$ref" in rule:
        rule = SCHEMA["$defs"][rule["$ref"].removeprefix("#/$defs/")]
    kind = rule["type"]
    matches = {
        "object": isinstance(value, dict),
        "array": isinstance(value, list),
        "string": isinstance(value, str),
        "number": type(value) in (int, float),
        "boolean": isinstance(value, bool),
    }
    if not matches[kind]:
        errors.append(f"{path}: expected {kind}")
        return
    if "enum" in rule and value not in rule["enum"]:
        errors.append(f"{path}: unknown value {value!r}; expected one of {rule['enum']}")
    if kind == "object":
        for name in rule.get("required", []):
            if name not in value:
                errors.append(f"{path}.{name}: required")
        if len(value) < rule.get("minProperties", 0):
            errors.append(f"{path}: must not be empty")
        properties = rule.get("properties", {})
        additional = rule.get("additionalProperties", True)
        for name, item in value.items():
            location = f"{path}.{name}"
            if "propertyNames" in rule:
                _validate(name, rule["propertyNames"], location, errors)
            if name in properties:
                _validate(item, properties[name], location, errors)
            elif additional is False:
                errors.append(f"{location}: unknown field")
            elif isinstance(additional, dict):
                _validate(item, additional, location, errors)
    elif kind == "array":
        if len(value) < rule.get("minItems", 0):
            errors.append(f"{path}: must not be empty")
        for index, item in enumerate(value):
            if rule.get("uniqueItems") and item in value[:index]:
                errors.append(f"{path}[{index}]: duplicate item {item!r}")
            _validate(item, rule["items"], f"{path}[{index}]", errors)
    elif kind == "string":
        if len(value) < rule.get("minLength", 0):
            errors.append(f"{path}: must not be blank")
        if "pattern" in rule and re.fullmatch(rule["pattern"], value) is None:
            errors.append(f"{path}: expected pattern {rule['pattern']}")
    elif kind == "number":
        if (isinstance(value, float) and not math.isfinite(value)) or value <= rule["exclusiveMinimum"]:
            errors.append(f"{path}: expected a finite number greater than {rule['exclusiveMinimum']}")


def _region_errors(name: str, box: RegionBox) -> list[str]:
    errors = []
    if not all(0 <= value <= 1 for value in box.values()):
        errors.append(f"spec.regions.{name}: expected values from 0 to 1")
    if box["x0"] >= box["x1"]:
        errors.append(f"spec.regions.{name}: expected x0 below x1")
    if box["y0"] >= box["y1"]:
        errors.append(f"spec.regions.{name}: expected y0 below y1")
    return errors


def validate_spec(value: object) -> list[str]:
    """Return field errors. An empty list means that the spec is valid."""
    errors: list[str] = []
    _validate(value, SCHEMA, "spec", errors)
    if not errors:
        spec = cast(UnitSpec, value)
        seen: set[str] = set()
        for index, prop in enumerate(spec["props"]):
            if prop["id"] not in spec["parts"]:
                errors.append(f"spec.props[{index}].id: prop must be listed in parts")
            if prop["id"] in seen:
                errors.append(f"spec.props[{index}].id: duplicate prop {prop['id']!r}")
            seen.add(prop["id"])
        if not 0 <= spec["identity"]["azimuthDegrees"] < 360:
            errors.append("spec.identity.azimuthDegrees: expected 0 to below 360")
        for name, box in spec.get("regions", {}).items():
            errors.extend(_region_errors(name, box))
        for index, part in enumerate(spec.get("holedParts", [])):
            if part not in spec["parts"]:
                errors.append(f"spec.holedParts[{index}]: part must be listed in parts")
        if spec["bodyPlan"] == "structure" and "footBones" not in spec:
            errors.append("spec.footBones: required for a structure")
        if spec["bodyPlan"] != "structure" and "footBones" in spec:
            errors.append("spec.footBones: only a structure has foot bones")
    return errors


def _unique_members(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for name, value in pairs:
        if name in result:
            raise ValueError(f"duplicate JSON member {name!r}")
        result[name] = value
    return result


def load_spec(path: str | Path) -> UnitSpec:
    """Read a UTF-8 spec. Reject invalid data before a generator can use it."""
    with Path(path).open(encoding="utf-8") as source:
        value = json.load(source, object_pairs_hook=_unique_members)
    errors = validate_spec(value)
    if errors:
        raise ValueError("; ".join(errors))
    return cast(UnitSpec, value)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("specs", nargs="*", type=Path, help="Spec files; defaults to specs/*.json")
    args = parser.parse_args(argv)
    paths = args.specs or sorted((DIRECTORY / "specs").glob("*.json"))
    if not paths:
        print("FAIL: no Unit Specs found")
        return 1
    failed = False
    for path in paths:
        try:
            spec = load_spec(path)
            print(f"PASS {path.name}: {spec['id']} ({spec['bodyPlan']})")
        except (OSError, UnicodeError, ValueError) as error:
            print(f"FAIL {path}: {error}")
            failed = True
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())
