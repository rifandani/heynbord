import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

from check_references import ALL_APPEARANCES, CLIPS, check


def glb(payload):
    chunk = json.dumps(payload).encode()
    chunk += b" " * (-len(chunk) % 4)
    return struct.pack("<4sIIII", b"glTF", 2, 20 + len(chunk), len(chunk), 0x4E4F534A) + chunk


class ReferenceChecks(unittest.TestCase):
    def test_all_appearances_are_unique(self):
        self.assertEqual(len(ALL_APPEARANCES), 56)
        self.assertEqual(len(set(ALL_APPEARANCES)), 56)

    def check_payload(self, payload):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "model.glb"
            path.write_bytes(glb(payload))
            return check(path)[1]

    def test_required_clips_and_embedded_resources(self):
        valid = {"animations": [{"name": name} for name in CLIPS], "skins": [{"joints": [1]}]}
        self.assertEqual(self.check_payload(valid), [])
        broken = {**valid, "animations": [{"name": "idle"}], "images": [{"uri": "outside.png"}]}
        errors = self.check_payload(broken)
        self.assertIn("missing clip: defeat", errors)
        self.assertIn("external or data URI resource is not counted in the GLB", errors)

    def test_bad_header_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "model.glb"
            path.write_bytes(b"broken")
            with self.assertRaises(ValueError):
                check(path)

    def test_complete_file_size_uses_the_inclusive_limit(self):
        payload = {"animations": [{"name": name} for name in CLIPS], "skins": [{"joints": [1]}]}
        size = len(glb(payload))
        with patch("check_references.MAX_BYTES", size):
            self.assertEqual(self.check_payload(payload), [])
        with patch("check_references.MAX_BYTES", size - 1):
            self.assertTrue(any("exceeds" in error for error in self.check_payload(payload)))


if __name__ == "__main__":
    unittest.main()
