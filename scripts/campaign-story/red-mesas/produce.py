"""Run the fframes review or the final export, then record delivery measurements."""
import argparse
import hashlib
import json
import math
import re
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

from prepare import CLIP_FRAMES, KINDS, MOMENTS, PER_SCENE, PROJECT, RAW, ROOT, SCENES

BINARY = ROOT / "out/story-scenes/target/release/red-mesas-story"
REVIEW = RAW / "review"
DELIVERY = RAW / "delivery"
PUBLIC = ROOT / "apps/web/public/story/red-mesas/v1"
FPS = 30
LOOP_START = 5.0
LOOP_FRAME = int(LOOP_START * FPS)
POSTER_FRAME = CLIP_FRAMES - 1


def command(args, report=None):
    print(" ".join(map(str, args)), flush=True)
    result = subprocess.run(list(map(str, args)), cwd=ROOT, capture_output=True, text=True)
    if report:
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(result.stdout)
        report.with_suffix(report.suffix + ".log").write_text(result.stderr)
    if result.returncode:
        raise RuntimeError(f"Command failed ({result.returncode}): {result.stdout}\n{result.stderr}")
    return result.stdout


def cli(*args, report=None):
    return command([BINARY, *args], report)


def kind(i):
    return KINDS[i // PER_SCENE]


def stem(i):
    return f"{kind(i)}-{i % PER_SCENE + 1:02}"


def chosen(only):
    """The moment indexes of the selected Story Scenes, or all of them."""
    return [i for i in range(MOMENTS) if only is None or kind(i) == only]


def cues():
    """The effect cue table from src/audio.rs, the single source of cue timing."""
    source = (PROJECT / "src/audio.rs").read_text()
    rows = re.findall(r'\((\d+), "([\w.-]+)", ([\d.]+), (-?[\d.]+)\)', source)
    return [dict(moment=int(m), file=f"audio/{f}", atSeconds=float(a), gainDb=float(g)) for m, f, a, g in rows]


def review():
    cli("--review-audio", "--json", "timeline", report=REVIEW / "timeline.json")
    cli("--json", "inspect", "--fail-on", "warning", report=REVIEW / "inspect-clean.json")
    for locale in ["en-us", "id-id"]:
        cli("--locale", locale, "--json", "inspect", "--fail-on", "warning", report=REVIEW / f"inspect-{locale}.json")
    for scene in SCENES:
        cli("strip", scene, "-n", "12", "--width", "400", "-o", REVIEW / f"{scene}.png", report=REVIEW / f"strip-{scene}.json")
        cli("frame", f"{scene}@0,{scene}@{LOOP_FRAME},{scene}@end", "--svg", "-o", REVIEW / "frames",
            report=REVIEW / f"frames-{scene}.json")
    for locale in ["en-us", "id-id"]:
        cli("--locale", locale, "strip", ",".join(f"{s}@{LOOP_FRAME}" for s in SCENES), "--width", "640", "--columns", "2",
            "-o", REVIEW / f"text-{locale}.png", report=REVIEW / f"text-{locale}.json")
    cli("--review-audio", "--json", "audio", "analyze", "--waveform", REVIEW / "waveform.png", report=REVIEW / "audio.json")
    cli("--json", "inspect", "--pops", report=REVIEW / "pops.json")


def export(only=None):
    # Inspection and contact sheets are reviewed before this separate stage.
    (RAW / "masters").mkdir(parents=True, exist_ok=True)
    for i in chosen(only):
        cli("render", SCENES[i], "-o", RAW / "masters" / f"{stem(i)}.mp4", report=REVIEW / f"render-{stem(i)}.json")
    pack(only)
    part = CLIP_FRAMES * PER_SCENE / FPS
    for locale in ["en-us", "id-id"]:
        for k, name in enumerate(KINDS):
            if only is None or name == only:
                cli("--locale", locale, "--review-audio", "render", f"{k * part}s..{(k + 1) * part}s",
                    "-o", REVIEW / f"review-{name}-{locale}.mp4", report=REVIEW / f"render-review-{name}-{locale}.json")


def pack(only=None):
    # One GOP per moment, with a second keyframe where the hold loop restarts.
    for i in chosen(only):
        master = RAW / "masters" / f"{stem(i)}.mp4"
        video = DELIVERY / f"{stem(i)}.mp4"
        command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", master,
                 "-map", "0:v:0", "-an", "-c:v", "libx264", "-crf", "30", "-preset", "slow",
                 "-pix_fmt", "yuv420p", "-g", CLIP_FRAMES, "-sc_threshold", "0",
                 "-force_key_frames", f"expr:eq(n,0)+eq(n,{LOOP_FRAME})", "-movflags", "+faststart", video])
        final = REVIEW / f"{stem(i)}-encoded-final.png"
        command(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", video,
                 "-vf", f"select=eq(n\\,{POSTER_FRAME})", "-frames:v", "1", final])
        Image.open(final).save(DELIVERY / f"{stem(i)}.webp", quality=40, method=6)
    report()


def report():
    moments = json.loads((RAW / "prepared/script.json").read_text())
    cue_table = cues()
    manifest = {"region": "red-mesas", "version": 1, "width": 1280, "height": 720, "fps": FPS,
                "frameCount": CLIP_FRAMES * MOMENTS, "locales": ["en-us", "id-id"],
                "playback": {"autoAdvance": False, "continueBeforeEnd": True,
                             "readingHold": "loop-from-loopStartSeconds-until-player-action",
                             "loopStartSeconds": LOOP_START, "back": "restart-moment",
                             "reducedMotion": "poster", "videoFailure": "poster",
                             "audioFailure": "silent", "textAndControls": "external",
                             "stopEffectsOnLeave": True, "profileMutations": False},
                "listeningReview": "pending", "moments": [], "audio": [], "budgets": {}}
    evidence = []
    for i, moment in enumerate(moments):
        video = DELIVERY / f"{stem(i)}.mp4"
        poster = DELIVERY / f"{stem(i)}.webp"
        probe = json.loads(command(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", video]))
        stream = probe["streams"][0]
        expected = {"codec_name": "h264", "pix_fmt": "yuv420p", "width": 1280, "height": 720,
                    "r_frame_rate": "30/1", "nb_frames": str(CLIP_FRAMES)}
        if len(probe["streams"]) != 1 or any(stream.get(k) != v for k, v in expected.items()):
            raise ValueError(f"Wrong delivery format: {video}")
        keyframes = command(["ffprobe", "-v", "error", "-select_streams", "v", "-skip_frame", "nokey",
                             "-show_entries", "frame=pts_time", "-of", "csv=p=0", video]).replace(",", " ").split()
        if not any(abs(float(k) - LOOP_START) < 0.02 for k in keyframes):
            raise ValueError(f"No keyframe at the loop start: {video}")
        encoded = REVIEW / f"{stem(i)}-encoded-final.png"
        difference = ImageChops.difference(Image.open(encoded).convert("RGB"), Image.open(poster).convert("RGB"))
        rms = math.sqrt(sum(ImageStat.Stat(difference).sum2) / (1280 * 720 * 3))
        if rms > 20:
            raise ValueError(f"Poster compression needs review: {poster}, RGB RMSE {rms}")
        data = video.read_bytes()
        if data.find(b"moov") > data.find(b"mdat"):
            raise ValueError(f"Fast start missing: {video}")
        manifest["moments"].append({**moment, "sceneKind": kind(i), "momentOrder": i % PER_SCENE + 1,
            "clip": video.name, "poster": poster.name, "frameCount": CLIP_FRAMES,
            "durationSeconds": CLIP_FRAMES / FPS, "loopStartSeconds": LOOP_START, "posterFrame": POSTER_FRAME,
            "clipBytes": video.stat().st_size, "posterBytes": poster.stat().st_size,
            "clipSha256": hashlib.sha256(data).hexdigest(), "posterRgbRmse": round(rms, 3),
            "effectCues": [{k: v for k, v in c.items() if k != "moment"} for c in cue_table if c["moment"] == i]})
        evidence.append(dict(file=video.name, keyframes=keyframes, probe=probe))
    for file in sorted((DELIVERY / "audio").glob("*.mp3")):
        name = f"audio/{file.name}"
        used = {kind(c["moment"]) for c in cue_table if c["file"] == name}
        if file.name.endswith("-music.mp3"):
            used = {file.name.split("-")[0]}
        probe = json.loads(command(["ffprobe", "-v", "error", "-show_streams", "-of", "json", file]))
        manifest["audio"].append(dict(path=name, bytes=file.stat().st_size, scenes=sorted(used),
            sha256=hashlib.sha256(file.read_bytes()).hexdigest(),
            settingsBus="music" if "music" in file.name else "effects",
            durationSeconds=float(probe["streams"][0]["duration"]),
            licenseUrl="https://creativecommons.org/publicdomain/zero/1.0/"))
    for name in KINDS:
        manifest["budgets"][name] = {
            "videoBytes": sum(m["clipBytes"] for m in manifest["moments"] if m["sceneKind"] == name),
            "posterBytes": sum(m["posterBytes"] for m in manifest["moments"] if m["sceneKind"] == name),
            "audioBytes": sum(a["bytes"] for a in manifest["audio"] if name in a["scenes"])}
    (DELIVERY / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    (REVIEW / "delivery-probes.json").write_text(json.dumps(evidence, indent=2) + "\n")
    (REVIEW / "sizes.json").write_text(json.dumps(manifest["budgets"], indent=2) + "\n")
    for name in ["CREDITS.md", "README.md"]:
        shutil.copyfile(PROJECT / name, RAW / name)
    print(json.dumps(manifest["budgets"], indent=2))


def publish():
    """Copy the clean delivery into the versioned public folder of the game."""
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    (PUBLIC / "audio").mkdir(parents=True)
    for file in [*DELIVERY.glob("*.mp4"), *DELIVERY.glob("*.webp"), DELIVERY / "manifest.json"]:
        shutil.copyfile(file, PUBLIC / file.name)
    for file in (DELIVERY / "audio").glob("*.mp3"):
        shutil.copyfile(file, PUBLIC / "audio" / file.name)
    shutil.copyfile(PROJECT / "CREDITS.md", PUBLIC / "CREDITS.md")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=["review", "export", "pack", "report", "publish"])
    parser.add_argument("--only", choices=KINDS, help="export or pack one Story Scene and keep the other clips")
    args = parser.parse_args()
    stage = args.stage
    if stage in ["review", "export"]:
        cargo = shutil.which("cargo") or str(Path.home() / ".cargo/bin/cargo")
        command([cargo, "build", "--release", "--locked", "--manifest-path", PROJECT / "Cargo.toml"])
    if stage in ["export", "pack"]:
        {"export": export, "pack": pack}[stage](args.only)
    else:
        {"review": review, "report": report, "publish": publish}[stage]()
