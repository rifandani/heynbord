"""Run with python3 -m unittest discover -s scripts/unit-model -p 'test_*.py'."""

from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from unit_spec import load_spec, validate_spec


DIRECTORY = Path(__file__).resolve().parent


class UnitSpecChecks(unittest.TestCase):
    def test_loads_the_three_pilot_specs(self):
        specs = [load_spec(DIRECTORY / "specs" / f"{name}.json") for name in (
            "warden-saelith", "crag-rhino", "bone-rampart",
        )]
        self.assertEqual(
            [(spec["id"], spec["bodyPlan"], spec["height"]) for spec in specs],
            [("warden-saelith", "biped-medium", 0.985),
             ("crag-rhino", "quadruped", 0.7280354),
             ("bone-rampart", "structure", 1.13)],
        )
        self.assertEqual(specs[0]["palette"]["coat"], "#2f6a35")
        self.assertEqual(specs[0]["clips"]["attack"], {"override": "bow-draw"})
        self.assertEqual(specs[0]["props"], [
            {"id": "bow", "hand": "left", "cameraSide": False},
            {"id": "arrow", "hand": "right", "cameraSide": True},
            {"id": "quiver", "hand": "none", "cameraSide": True},
        ])

    def test_rejects_unknown_names_and_malformed_fields(self):
        valid = load_spec(DIRECTORY / "specs/warden-saelith.json")
        cases = [
            ({"bodyPlan": "unknown"}, "spec.bodyPlan: unknown value"),
            ({"parts": ["unknown"]}, "spec.parts[0]: unknown value"),
            ({"palette": {"coat": "#abc"}}, "spec.palette.coat: expected pattern"),
            ({"palette": {"coat": "#1234567"}}, "spec.palette.coat: expected pattern"),
            ({"palette": {"coat": "#12345g"}}, "spec.palette.coat: expected pattern"),
            ({"palette": {"coat": "123456"}}, "spec.palette.coat: expected pattern"),
            ({"height": True}, "spec.height: expected number"),
            ({"height": 0}, "spec.height: expected a finite number"),
            ({"height": -1}, "spec.height: expected a finite number"),
            ({"height": float("inf")}, "spec.height: expected a finite number"),
            ({"height": float("nan")}, "spec.height: expected a finite number"),
            ({"parts": []}, "spec.parts: must not be empty"),
            ({"parts": ["head", "head"]}, "spec.parts[1]: duplicate item"),
            ({"palette": []}, "spec.palette: expected object"),
            ({"palette": {}}, "spec.palette: must not be empty"),
            ({"palette": {"": "#123456"}}, "spec.palette.: expected pattern"),
            ({"clips": {**valid["clips"], "typo": {}}}, "spec.clips.typo: unknown field"),
            ({"clips": {**valid["clips"], "attack": None}}, "spec.clips.attack: expected object"),
            ({"clips": {**valid["clips"], "attack": {"override": ""}}}, "spec.clips.attack.override: expected pattern"),
            ({"props": [{"id": "head", "hand": "left", "cameraSide": "true"}]}, "spec.props[0].cameraSide: expected boolean"),
            ({"props": [{"id": "head", "hand": "middle", "cameraSide": True}]}, "spec.props[0].hand: unknown value"),
            ({"parts": ["head"]}, "spec.props[0].id: prop must be listed in parts"),
            ({"props": [valid["props"][0], valid["props"][0]]}, "spec.props[1].id: duplicate prop"),
            ({"details": [2]}, "spec.details[0]: expected string"),
            ({"details": [""]}, "spec.details[0]: must not be blank"),
            ({"extra": True}, "spec.extra: unknown field"),
        ]
        for changes, message in cases:
            with self.subTest(changes=changes):
                errors = validate_spec({**valid, **changes})
                self.assertTrue(any(message in error for error in errors), errors)

    def test_requires_each_top_level_field_and_each_base_clip(self):
        valid = load_spec(DIRECTORY / "specs/warden-saelith.json")
        for field in ("id", "bodyPlan", "height", "palette", "parts", "props", "clips", "details"):
            with self.subTest(field=field):
                broken = {name: value for name, value in valid.items() if name != field}
                self.assertIn(f"spec.{field}: required", validate_spec(broken))
        for clip in ("idle", "walk", "attack", "hurt", "death"):
            with self.subTest(clip=clip):
                broken = deepcopy(valid)
                del broken["clips"][clip]
                self.assertIn(f"spec.clips.{clip}: required", validate_spec(broken))

    def test_optional_clips_can_be_absent(self):
        spec = load_spec(DIRECTORY / "specs/warden-saelith.json")
        spec["clips"] = {name: {} for name in ("idle", "walk", "attack", "hurt", "death")}
        self.assertEqual(validate_spec(spec), [])

    def test_loader_rejects_invalid_data_before_returning_a_record(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "broken.json"
            for content, message in (
                ("{", "Expecting property name"),
                ('{"id": "a", "id": "b"}', "duplicate JSON member 'id'"),
                ("[]", "spec: expected object"),
                (json.dumps({"id": "test"}), "spec.bodyPlan: required"),
            ):
                with self.subTest(content=content):
                    path.write_text(content, encoding="utf-8")
                    with self.assertRaisesRegex(ValueError, message):
                        load_spec(path)

    def test_default_command_checks_all_three_pilots(self):
        result = subprocess.run(
            [sys.executable, str(DIRECTORY / "unit_spec.py")],
            cwd=tempfile.gettempdir(), capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.splitlines(), [
            "PASS bone-rampart.json: bone-rampart (structure)",
            "PASS crag-rhino.json: crag-rhino (quadruped)",
            "PASS warden-saelith.json: warden-saelith (biped-medium)",
        ])

    def test_command_reports_all_input_errors(self):
        result = subprocess.run(
            [sys.executable, str(DIRECTORY / "unit_spec.py"),
             str(DIRECTORY / "fixtures/missing-clip.json"),
             str(DIRECTORY / "fixtures/does-not-exist.json"),
             str(DIRECTORY / "specs/crag-rhino.json")],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("clips.attack: required", result.stdout)
        self.assertIn("does-not-exist.json", result.stdout)
        self.assertIn("PASS crag-rhino.json", result.stdout)

    def test_command_rejects_a_missing_clip(self):
        result = subprocess.run(
            [sys.executable, str(DIRECTORY / "unit_spec.py"),
             str(DIRECTORY / "fixtures/missing-clip.json")],
            capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("clips.attack: required", result.stdout)


if __name__ == "__main__":
    unittest.main()
