"""Re-encode existing Battle tracks and verify their decoded audio contract.

Use a separate, unchanged source directory; never repeatedly transcode published files.
python3 scripts/music/optimize-battle-music.py --source /path/to/original/music
"""
from __future__ import annotations

import argparse
from array import array
import json
import hashlib
import zlib
import math
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
FILES = [f"region-{number}.ogg" for number in range(1, 4)] + [
    "region-4.mp3", "region-5.mp3", "boss.ogg", "heynspire.ogg", "dungeons.ogg"
]


def run(*args: str) -> bytes:
    try:
        return subprocess.check_output(args, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as error:
        raise RuntimeError(error.stderr.decode()) from error


def probe(file: Path) -> dict:
    return json.loads(run("ffprobe", "-v", "error", "-show_entries",
        "stream=codec_name,sample_rate,channels:format=duration,size", "-of", "json", str(file)))


def decode(file: Path) -> array:
    pcm = array("f")
    pcm.frombytes(run("ffmpeg", "-v", "error", "-i", str(file), "-f", "f32le", "-acodec", "pcm_f32le", "-"))
    return pcm


def verify(source: Path, output: Path) -> dict:
    before, after = probe(source), probe(output)
    original, encoded = decode(source), decode(output)
    if before["streams"][0] != after["streams"][0] or len(original) != len(encoded):
        raise ValueError(f"{source.name}: codec, sample rate, stereo or decoded duration changed")
    signal = sum(float(x) * x for x in original)
    noise = sum((float(x) - y) ** 2 for x, y in zip(original, encoded))
    snr = 10 * math.log10(signal / max(noise, 1e-30))
    if snr < 18:
        raise ValueError(f"{source.name}: signal-to-error ratio {snr:.2f} dB is below 18 dB")
    channels = before["streams"][0]["channels"]
    if channels != 2:
        raise ValueError(f"{source.name}: source must remain stereo")
    # Compare the change at the existing loop seam; do not trim or add a crossfade.
    seam_before = max(abs(original[channel] - original[-channels + channel]) for channel in range(channels))
    seam_after = max(abs(encoded[channel] - encoded[-channels + channel]) for channel in range(channels))
    if seam_after - seam_before > 0.03:
        raise ValueError(f"{source.name}: loop seam increased by more than 0.03 full scale")
    if output.stat().st_size >= source.stat().st_size:
        raise ValueError(f"{source.name}: no byte reduction")
    return {
        "file": source.name, "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "publishedSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "beforeBytes": source.stat().st_size,
        "afterBytes": output.stat().st_size,
        "sampleRate": int(before["streams"][0]["sample_rate"]),
        "channels": channels, "codec": before["streams"][0]["codec_name"],
        "decodedFrames": len(encoded) // channels,
        "durationSeconds": len(encoded) / channels / int(before["streams"][0]["sample_rate"]),
        "signalToErrorDb": round(snr, 3),
        "loopSeamBefore": round(seam_before, 6),
        "loopSeamAfter": round(seam_after, 6),
        "peakBefore": round(max(abs(x) for x in original), 6),
        "peakAfter": round(max(abs(x) for x in encoded), 6),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=ROOT / "apps/web/public/music")
    parser.add_argument("--report", type=Path, default=ROOT / "scripts/music/battle-music-2026-10-30.json")
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        raise ValueError("Use unchanged originals in a separate source directory")
    args.output.mkdir(parents=True, exist_ok=True)
    rows = []
    with tempfile.TemporaryDirectory(prefix="heynbord-music-") as temporary:
        for name in FILES:
            source, target = args.source / name, Path(temporary) / name
            if source.suffix == ".ogg":
                wav = Path(temporary) / "source.wav"
                run("ffmpeg", "-v", "error", "-y", "-i", str(source), "-map", "0:a:0", "-c:a", "pcm_f32le", str(wav))
                run("oggenc", "--quiet", "--quality", "4", "--serial", str(zlib.crc32(name.encode())), "--output", str(target), str(wav))
            else:
                run("ffmpeg", "-v", "error", "-y", "-i", str(source), "-map", "0:a:0", "-map_metadata", "0", "-c:a", "libmp3lame", "-b:a", "160k", str(target))
            row = verify(source, target)
            (args.output / name).write_bytes(target.read_bytes())
            rows.append(row)
            print(f"{name}: {row['beforeBytes']} -> {row['afterBytes']} bytes; {row['signalToErrorDb']} dB")
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps({
        "date": "2026-10-30", "ffmpeg": run("ffmpeg", "-version").decode().splitlines()[0],
        "encoding": {"ogg": "oggenc/libvorbis quality 4", "mp3": "libmp3lame 160 kbit/s stereo"},
        "tracks": rows,
    }, indent=2) + "\n")


if __name__ == "__main__":
    main()
