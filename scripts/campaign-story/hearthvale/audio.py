"""Cut, level and compress the CC0 story audio (sources in source/audio-v2, see CREDITS.md)."""
import json
import re
import subprocess

V2 = "audio-v2"
MUSIC_SECONDS = 80
# (delivered file, source, start s, length s, fade in s, fade out s, peak dBFS)
EFFECTS = [
    ("fire.mp3", "fire.wav", 0.0, 9.0, 0.6, 1.2, -6),
    ("boom.mp3", "NenadSimic - Muffled Distant Explosion.wav", 0.0, 3.5, 0.0, 1.2, -3),
    ("shimmer.mp3", "health_restore.wav", 0.0, 3.0, 0.0, 0.6, -5),
    ("wind.mp3", "short wind sound.wav", 0.0, 4.2, 0.1, 0.8, -5),
    ("thunder.mp3", "sfx100v2_thunder_01.ogg", 0.0, 5.2, 0.0, 1.5, -3),
    ("drum.mp3", "horde_war_drums_by_william_hector.wav", 0.0, 0.45, 0.0, 0.15, -4),
    ("flap.mp3", "wings_flap_large.ogg", 0.0, 2.6, 0.0, 0.4, -5),
    ("coins.mp3", "gold_sack.wav", 0.0, 1.9, 0.0, 0.3, -5),
    ("coin-spin.mp3", "coin-spin-fall-01.wav", 0.0, 1.43, 0.0, 0.2, -4),
    ("crack.mp3", "bfh1_rock_breaking_01.ogg", 0.0, 1.15, 0.0, 0.2, -3),
    ("thud.mp3", "impactSoft_heavy_000.ogg", 0.0, 0.51, 0.0, 0.1, -3),
    ("paper.mp3", "../audio/paper-1.mp3", 0.0, 0.48, 0.025, 0.06, -8),
    # Boss scene
    ("torch.mp3", "fire-1.wav", 0.0, 1.6, 0.0, 0.5, -6),
    ("gate.mp3", "impactWood_heavy_000.ogg", 0.0, 0.31, 0.0, 0.08, -3),
    ("cloth.mp3", "cloth-heavy.wav", 0.0, 0.41, 0.0, 0.1, -5),
    ("coin.mp3", "coin_drop.wav", 0.0, 1.42, 0.0, 0.3, -6),
    ("magic.mp3", "teleport.wav", 0.0, 1.62, 0.0, 0.4, -5),
    ("cannon.mp3", "cannon_fire_1.ogg", 0.0, 3.0, 0.0, 1.2, -3),
    ("drums.mp3", "horde_war_drums_by_william_hector.wav", 0.0, 2.4, 0.0, 0.5, -4),
]


def run(*args):
    return subprocess.run([str(a) for a in args], check=True, text=True, capture_output=True)


def peak(path):
    out = run("ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-").stderr
    return float(re.search(r"max_volume: (-?[\d.]+) dB", out).group(1))


def prepare(media, raw):
    source = raw / "source"
    delivery = raw / "delivery/audio"
    delivery.mkdir(parents=True, exist_ok=True)
    for stale in delivery.glob("*.mp3"):
        stale.unlink()
    notes = []
    scratch = raw / "review/audio-scratch.wav"
    scratch.parent.mkdir(parents=True, exist_ok=True)

    # Opening: the dark intro of The Fire Dragon builds to its heroic theme.
    dragon = source / V2 / "the_fire_dragon_v2.wav"
    confrontation = source / V2 / "i_killed_your_brother_0.wav"
    relic = source / V2 / "the_relic_under_the_ice_0.wav"
    music = {
        "opening-music.mp3": (
            ["-i", dragon],
            f"[0:a]atrim=0:{MUSIC_SECONDS},asetpts=N/SR/TB,loudnorm=I=-22:TP=-2:LRA=11,"
            f"afade=t=out:st={MUSIC_SECONDS - 3}:d=3[out]",
        ),
        # Boss: The Confrontation, dark and tense, under the Baron's talk.
        "boss-music.mp3": (
            ["-i", confrontation],
            "[0:a]atrim=0:79,asetpts=N/SR/TB,loudnorm=I=-22:TP=-2:LRA=11,afade=t=out:st=76:d=3[out]",
        ),
        # Ending: a short heroic phrase for the victory, then the mystery of The Relic Under the Ice.
        "ending-music.mp3": (
            ["-i", dragon, "-i", relic],
            "[0:a]atrim=100:112,asetpts=N/SR/TB,afade=t=in:d=0.3[a];"
            f"[1:a]atrim=0:{MUSIC_SECONDS - 10},asetpts=N/SR/TB[b];"
            "[a][b]acrossfade=d=2.5:c1=tri:c2=tri,loudnorm=I=-22:TP=-2:LRA=11,"
            f"afade=t=out:st={MUSIC_SECONDS - 3}:d=3[out]",
        ),
    }
    for name, (inputs, graph) in music.items():
        target = delivery / name
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", graph,
            "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "56k", target)
        notes.append(dict(file=name, changes=graph, bytes=target.stat().st_size, listeningReview="pending"))

    for name, src, start, length, fade_in, fade_out, peak_db in EFFECTS:
        filters = f"silenceremove=start_periods=1:start_threshold=-50dB,atrim=0:{length},asetpts=N/SR/TB"
        if fade_in:
            filters += f",afade=t=in:d={fade_in}"
        filters += f",afade=t=out:st={max(0, length - fade_out)}:d={fade_out}"
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", start, "-i", source / V2 / src,
            "-af", filters, "-ar", "44100", "-ac", "1", scratch)
        gain = peak_db - peak(scratch)
        target = delivery / name
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", scratch, "-af", f"volume={gain:.2f}dB",
            "-c:a", "libmp3lame", "-b:a", "64k", target)
        notes.append(dict(file=name, source=src, changes=f"{filters},volume={gain:.2f}dB",
                          bytes=target.stat().st_size, listeningReview="pending"))
    scratch.unlink(missing_ok=True)
    # The review mix uses the exact delivered compressed files.
    for file in delivery.glob("*.mp3"):
        (media / file.name).write_bytes(file.read_bytes())
    (raw / "review/audio-preparation.json").write_text(json.dumps(notes, indent=2) + "\n")
