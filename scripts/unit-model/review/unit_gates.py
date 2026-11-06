"""The Review Gates that need more than a command of `vendor/`.

`gates.ts` starts this file with a Review Gate name and a request file:

    python3 unit_gates.py <turntable|interior|chirality|palette> <request.json>

Each Review Gate prints one JSON report. The exit code is 0 clean, 1 fail, 2
error. An error is not a pass. Python 3.11 standard library only.
"""

import json
import math
from pathlib import Path
import re
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent / "vendor"))

import chirality  # noqa: E402
from color_metrics import ciede2000, srgb_to_lab  # noqa: E402
from extract_pbr_evidence import load_image  # noqa: E402
import interior_difference  # noqa: E402
import turntable_gate  # noqa: E402

CLEAN, FAILED, ERROR = 0, 1, 2

# Pixels for each scene unit in the hole test of a part. This is about the scale
# of the Review Scene, which draws a figure of 0.985 at about 520 px.
HOLE_RASTER_SCALE = 512
HOLE_RASTER_MARGIN = 3
# A pixel center on a shared triangle edge must count for one of its triangles.
EDGE_TOLERANCE = 1e-6

# The band that the interior difference reads, as a share of the figure height.
# `interior_difference.py` gives 0.19 for the head of a standing figure.
INTERIOR_BANDS = {"head": (0.0, 0.19), "torso": (0.19, 0.55), "legs": (0.55, 1.0)}
# Fewer cells than this is not evidence. A small figure has about 1,000 in a band.
MIN_INTERIOR_CELLS = 100
# The largest mean luminance difference to the Turnaround, as a share of full
# range. Calibrated on 2026-11-06 on Warden Saelith. The current model is at 0.215
# to 0.273, and its worst band is the back torso. Seeds of the front view: a head
# with no face is at 0.282 in the head band. A figure in flat black, skin or white
# is at 0.308, 0.392 and 0.623 in its worst band. The margin is thin because the
# model is much darker than its Turnaround. Calibrate this limit again after the
# rebuild of the pilot.
MAX_INTERIOR_DIFFERENCE = 0.28

PALETTE_DELTA_E = 5.0
# The Lab cell size of the colors of a region, and of the card painting. The
# painting cells are small, so a color cannot pass on a distant neighbor.
REGION_CELL = 10
PAINTING_CELL = 6
# A color on less than this share of the vertices of a region is a small detail.
MIN_REGION_COLOR_SHARE = 0.1
# A color on less than this share of the painting is noise.
MIN_PAINTING_COLOR_SHARE = 0.001

# The record name of the hole test of the body. It is not a part name.
BODY = "body"
# The regions of the parts that are not the body.
RIGID_REGIONS = {"prop", "base", "effect"}

_SIDE = re.compile(r"^(?P<stem>.+)\.(?P<end>[FB]?)(?P<side>[LR])$")


def _load_meshes(path: str) -> list[dict[str, Any]]:
    return json.loads(Path(path).read_text(encoding="utf-8"))["meshes"]


def _rasterize(vertices: list[list[float]], triangles: list[list[int]], azimuth: float):
    """The silhouette of a part from one azimuth, as (width, height, mask)."""
    angle = math.radians(azimuth)
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    points = [
        ((x * cos_a + z * sin_a) * HOLE_RASTER_SCALE, -y * HOLE_RASTER_SCALE)
        for x, y, z in vertices
    ]
    left = min(x for x, _ in points) - HOLE_RASTER_MARGIN
    top = min(y for _, y in points) - HOLE_RASTER_MARGIN
    width = int(max(x for x, _ in points) - left) + HOLE_RASTER_MARGIN
    height = int(max(y for _, y in points) - top) + HOLE_RASTER_MARGIN
    mask = [False] * (width * height)
    for a, b, c in triangles:
        (ax, ay), (bx, by), (cx, cy) = points[a], points[b], points[c]
        area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
        if abs(area) < 1e-9:
            continue
        for row in range(int(min(ay, by, cy) - top), int(max(ay, by, cy) - top) + 2):
            for column in range(int(min(ax, bx, cx) - left), int(max(ax, bx, cx) - left) + 2):
                px, py = column + left + 0.5, row + top + 0.5
                one = ((bx - ax) * (py - ay) - (by - ay) * (px - ax)) / area
                two = ((cx - bx) * (py - by) - (cy - by) * (px - bx)) / area
                three = ((ax - cx) * (py - cy) - (ay - cy) * (px - cx)) / area
                if min(one, two, three) >= -EDGE_TOLERANCE and 0 <= row < height and 0 <= column < width:
                    mask[row * width + column] = True
    return width, height, mask


def _parts(meshes: list[dict[str, Any]]) -> dict[str, dict[str, list]]:
    """All islands of each part, in one list of vertices."""
    parts: dict[str, dict[str, list]] = {}
    for mesh in meshes:
        part = parts.setdefault(mesh["part"], {"vertices": [], "triangles": []})
        offset = len(part["vertices"])
        part["vertices"].extend(mesh["vertices"])
        part["triangles"].extend([a + offset, b + offset, c + offset] for a, b, c in mesh["indices"])
    return parts


def _body(meshes: list[dict[str, Any]]) -> dict[str, list]:
    """All parts of the body as one shape, with no prop, base or effect."""
    return _parts([
        {**mesh, "part": BODY} for mesh in meshes if mesh["region"] not in RIGID_REGIONS
    ]).get(BODY, {"vertices": [], "triangles": []})


def part_holes(meshes: list[dict[str, Any]], allowed: list[str], azimuths: list[float]):
    """
    The holes through one part, and the holes through the body.

    The full silhouette has correct holes: a bow and its string can enclose
    background, and so can an arm, a skirt and a bow. A hole in the silhouette of
    one part goes through that part. A hole in the silhouette of the body, with no
    props, is a gap between 2 body parts. The thresholds are those of
    `turntable_gate.py`.
    """
    shapes = {**_parts(meshes), BODY: _body(meshes)}
    holes = []
    for name, shape in shapes.items():
        if not shape["vertices"]:
            continue
        for azimuth in azimuths:
            width, height, mask = _rasterize(shape["vertices"], shape["triangles"], azimuth)
            found = turntable_gate._analyze_holes(width, height, mask)
            if (
                found["largestHolePixelCount"] > turntable_gate.INTERIOR_HOLE_PIXEL_FLOOR
                and found["interiorHoleFraction"] > turntable_gate.INTERIOR_HOLE_FRACTION_THRESHOLD
            ):
                holes.append({
                    "part": name,
                    "azimuth": azimuth,
                    "allowed": name in allowed,
                    "pixels": found["largestHolePixelCount"],
                    "fraction": round(found["interiorHoleFraction"], 4),
                })
    return holes


def turntable(request: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    """Are all four views present, and is there a hole through a part?"""
    captures = [(capture["azimuth"], Path(capture["path"])) for capture in request["captures"]]
    # `allow_holes` removes only the hole test of the full silhouette. `part_holes`
    # asks the same question without the correct gaps of the props.
    report = turntable_gate.analyze_turntable(captures, allow_holes=True)
    holes = part_holes(
        _load_meshes(request["meshes"]),
        request["holedParts"],
        list(turntable_gate.REQUIRED_AZIMUTHS),
    )
    report["partHoles"] = holes
    blocked = [hole for hole in holes if not hole["allowed"]]
    report["passed"] = report["passed"] and not blocked
    return (CLEAN if report["passed"] else FAILED), report


def interior(request: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    """What differs from the Turnaround inside the silhouette, banded by height?"""
    records = []
    code = CLEAN
    for pair in request["pairs"]:
        for band, (start, end) in INTERIOR_BANDS.items():
            result = interior_difference.compare(
                Path(pair["baseline"]), Path(pair["render"]), start, end
            )
            difference = result["interiorDifference"]
            cells = result["cellsCompared"]
            if difference is None or cells < MIN_INTERIOR_CELLS:
                code = ERROR
                status = "error"
            elif difference > MAX_INTERIOR_DIFFERENCE:
                code = max(code, FAILED)
                status = "fail"
            else:
                status = "pass"
            records.append({
                "view": pair["view"],
                "band": band,
                "status": status,
                "difference": difference,
                "cellsCompared": cells,
                "detail": result["status"],
            })
    report = {"limit": MAX_INTERIOR_DIFFERENCE, "bands": records}
    return code, report


def _pair_name(name: str) -> str | None:
    """`sleeve.L` as `sleeve-l` and `upper.FR` as `upper.F-r`, or None for no side."""
    match = _SIDE.match(name)
    if match is None:
        return None
    return f"{match['stem']}.{match['end']}-{match['side'].lower()}".replace(".-", "-")


def _centroid(points: list[list[float]]) -> list[float]:
    return [sum(point[axis] for point in points) / len(points) for axis in range(3)]


def _worst_points(left: list[list[float]], right: list[list[float]]):
    """The left vertex that is furthest from a mirror vertex, and that right vertex."""
    best = None
    for point in left:
        mirrored = chirality.mirror_point(point)
        nearest = min(right, key=lambda other: math.dist(mirrored, other))
        distance = math.dist(mirrored, nearest)
        if best is None or distance > best[0]:
            best = (distance, nearest, point)
    return best[1], best[2]


def _check_pairs(kind: str, points: dict[str, list[list[float]]]) -> tuple[list[dict], list[str]]:
    named = {_pair_name(name): name for name in points if _pair_name(name)}
    pairs = chirality.find_pairs(named)
    paired = {name for pair in pairs for name in pair}
    records = []
    for right_name, left_name in pairs:
        right, left = points[named[right_name]], points[named[left_name]]
        ok, message = chirality.check_pair(left_name[:-2], _centroid(right), _centroid(left))
        if ok:
            # A rotation and a mirror agree at a centroid with z = 0. They do not
            # agree at each vertex.
            ok, message = chirality.check_pair(left_name[:-2], *_worst_points(left, right))
        records.append({"kind": kind, "left": named[left_name], "ok": ok, "detail": message})
    return records, sorted(named[name] for name in named if name not in paired)


def mirror_pairs(request: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    """Is each left and right pair a reflection, not a rotation?"""
    parts = {name: part["vertices"] for name, part in _parts(_load_meshes(request["meshes"])).items()}
    bones = {bone["id"]: [bone["jointPos"]] for bone in request["bones"]}
    part_pairs, lone_parts = _check_pairs("part", parts)
    bone_pairs, lone_bones = _check_pairs("bone", bones)
    pairs = part_pairs + bone_pairs
    failures = [record["detail"] for record in pairs if not record["ok"]]
    report = {
        "pairCount": len(pairs),
        "failures": failures,
        "pairs": pairs,
        "unpaired": lone_parts + lone_bones,
        "note": "A pair that is wrong the same way on both sides is still a mirror of itself.",
    }
    return (FAILED if failures else CLEAN), report


def _srgb_byte(linear: float) -> int:
    value = min(1.0, max(0.0, linear))
    encoded = 12.92 * value if value <= 0.0031308 else 1.055 * value ** (1 / 2.4) - 0.055
    return round(encoded * 255)


def _color_cells(labs: list[tuple[float, float, float]], size: int, min_share: float):
    """The mean color and the share of each Lab cell with enough of the colors."""
    cells: dict[tuple[int, ...], list[tuple[float, float, float]]] = {}
    for lab in labs:
        cells.setdefault(tuple(round(channel / size) for channel in lab), []).append(lab)
    return [
        (tuple(sum(lab[axis] for lab in members) / len(members) for axis in range(3)), len(members) / len(labs))
        for members in cells.values()
        if len(members) >= len(labs) * min_share
    ]


def palette(request: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    """
    Is each region within delta-E 5 of the card painting?

    The painting has a full scene behind the figure, and no region masks. So the
    gate asks if each main color of a region is a color of the painting. It finds
    a coat of the wrong color. It does not find a correct color in the wrong place.
    """
    width, height, pixels, warnings = load_image(Path(request["painting"]))
    painting = _color_cells(
        [srgb_to_lab(pixel[:3]) for pixel in pixels], PAINTING_CELL, MIN_PAINTING_COLOR_SHARE
    )
    regions: dict[str, list[tuple[float, float, float]]] = {}
    for mesh in _load_meshes(request["meshes"]):
        regions.setdefault(mesh["region"], []).extend(
            srgb_to_lab(tuple(_srgb_byte(channel) for channel in color)) for color in mesh["colors"]
        )
    records = []
    for region, labs in regions.items():
        colors = []
        for color, share in _color_cells(labs, REGION_CELL, MIN_REGION_COLOR_SHARE):
            delta = min(ciede2000(color, reference) for reference, _ in painting)
            colors.append({"lab": [round(channel, 1) for channel in color], "share": round(share, 3), "deltaE": round(delta, 2)})
        worst = max((color["deltaE"] for color in colors), default=None)
        if worst is None:
            return ERROR, {"error": f"region {region} has no main color", "regions": records}
        records.append({"region": region, "worstDeltaE": worst, "passes": worst <= PALETTE_DELTA_E, "colors": colors})
    failures = [record["region"] for record in records if not record["passes"]]
    report = {
        "limit": PALETTE_DELTA_E,
        "paintingColors": len(painting),
        "paintingSize": [width, height],
        "warnings": warnings,
        "regions": records,
        "failures": failures,
    }
    return (FAILED if failures else CLEAN), report


GATES = {
    "turntable": turntable,
    "interior": interior,
    "chirality": mirror_pairs,
    "palette": palette,
}


def main(argv: list[str]) -> int:
    try:
        code, report = GATES[argv[0]](json.loads(Path(argv[1]).read_text(encoding="utf-8")))
    except Exception as error:  # noqa: BLE001 -- a crash of a Review Gate is an error, not a pass.
        print(f"error: {error}", file=sys.stderr)
        return ERROR
    print(json.dumps(report, indent=2))
    return code


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
