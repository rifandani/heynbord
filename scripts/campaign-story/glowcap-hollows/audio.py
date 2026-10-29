"""Cut, level and compress the CC0 story audio (see SOURCES.md and CREDITS.md)."""
import json
import re
import subprocess

MUSIC = "audio-v1"
SFX = "sfx-v1"
# Effects shared with the earlier Regions come from their source folders.
HEARTHVALE = "../../../hearthvale/story/source/audio-v2"
MESAS = "../../../red-mesas/story/source/sfx-v1"
# (delivered file, source, start s, length s, fade in s, fade out s, peak dBFS)
EFFECTS = [
    ("wind.mp3", f"{HEARTHVALE}/short wind sound.wav", 0.0, 4.2, 0.1, 0.8, -5),
    ("boom.mp3", f"{HEARTHVALE}/NenadSimic - Muffled Distant Explosion.wav", 0.0, 3.5, 0.0, 1.2, -3),
    ("shimmer.mp3", f"{HEARTHVALE}/health_restore.wav", 0.0, 3.0, 0.0, 0.6, -5),
    ("magic.mp3", f"{HEARTHVALE}/teleport.wav", 0.0, 1.62, 0.0, 0.4, -5),
    ("coin.mp3", f"{HEARTHVALE}/coin_drop.wav", 0.0, 1.42, 0.0, 0.3, -6),
    ("drums.mp3", f"{HEARTHVALE}/horde_war_drums_by_william_hector.wav", 0.0, 2.4, 0.0, 0.5, -4),
    ("thud.mp3", f"{HEARTHVALE}/impactSoft_heavy_000.ogg", 0.0, 0.51, 0.0, 0.1, -3),
    ("rumble.mp3", f"{MESAS}/sfx100v2_loop_machine_01.ogg", 0.0, 2.6, 0.3, 0.8, -10),
    # New for the Glowcap Hollows
    ("chime.mp3", f"{SFX}/bell_ding2.wav", 0.0, 1.4, 0.0, 0.6, -6),
    ("chime-high.mp3", f"{SFX}/bell_ding3.wav", 0.0, 1.6, 0.0, 0.7, -6),
    ("creak.mp3", f"{SFX}/tree_creak.flac", 0.0, 2.4, 0.15, 0.6, -5),
    ("whoosh.mp3", f"{SFX}/tin-whistle-whoosh-01.wav", 0.0, 0.48, 0.0, 0.1, -4),
    ("hit.mp3", f"{SFX}/wood_hit_07.ogg", 0.0, 0.29, 0.0, 0.08, -2),
    ("slam.mp3", f"{SFX}/wood_slam_03.ogg", 0.0, 0.44, 0.0, 0.1, -3),
    ("bow.mp3", f"{SFX}/wood_squeak_01.ogg", 0.0, 0.48, 0.05, 0.1, -7),
    ("snap.mp3", f"{SFX}/metal_slam_01.ogg", 0.0, 0.57, 0.0, 0.15, -4),
    ("drip.mp3", f"{SFX}/water-drop-01.wav", 0.0, 0.35, 0.0, 0.08, -9),
    ("paper.mp3", f"{SFX}/book-page-01.wav", 0.0, 0.7, 0.02, 0.2, -7),
    ("lid.mp3", f"{SFX}/door_open_01.ogg", 0.0, 0.43, 0.0, 0.1, -5),
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

    forest = source / MUSIC / "beautiful_forest_16bit_44.1khz_1.wav"
    encounter = source / MUSIC / "Heavy Concept A Bass Master.wav"
    reprise = source / MUSIC / "hero_reprise_0.wav"
    cathedral = source / MUSIC / "forest_2_0.ogg"
    level = "loudnorm=I=-22:TP=-2:LRA=11"
    music = {
        # Opening: the orchestral forest piece, once; it is long enough for the scene.
        "opening-music.mp3": (
            ["-i", forest],
            f"[0:a]atrim=0:66,asetpts=N/SR/TB,{level},afade=t=in:d=0.4,afade=t=out:st=62:d=4[out]",
        ),
        # Boss: Dramatic Boss Encounter, an introduction for a boss, twice.
        "boss-music.mp3": (
            ["-i", encounter, "-i", encounter],
            f"[0:a]atrim=0:39.5,asetpts=N/SR/TB[a];[1:a]atrim=0:39.5,asetpts=N/SR/TB[b];"
            f"[a][b]acrossfade=d=2:c1=tri:c2=tri,{level},afade=t=out:st=73:d=4[out]",
        ),
        # Ending: the warm phrase of Hero's Reprise for the peace, then the pads
        # and bells of Cathedral in the Forest for the amber clue.
        "ending-music.mp3": (
            ["-i", reprise, "-i", cathedral],
            "[0:a]atrim=0:16,asetpts=N/SR/TB,afade=t=in:d=0.3[a];"
            "[1:a]atrim=0:56,asetpts=N/SR/TB[b];"
            f"[a][b]acrossfade=d=3:c1=tri:c2=tri,{level},afade=t=out:st=65:d=4[out]",
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
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", start, "-i", source / src,
            "-af", filters, "-ar", "44100", "-ac", "1", scratch)
        gain = peak_db - peak(scratch)
        target = delivery / name
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", scratch, "-af", f"volume={gain:.2f}dB",
            "-c:a", "libmp3lame", "-b:a", "64k", target)
        notes.append(dict(file=name, source=src.split("/")[-1], changes=f"{filters},volume={gain:.2f}dB",
                          bytes=target.stat().st_size, listeningReview="pending"))
    scratch.unlink(missing_ok=True)
    # The review mix uses the exact delivered compressed files.
    for file in delivery.glob("*.mp3"):
        (media / file.name).write_bytes(file.read_bytes())
    (raw / "review/audio-preparation.json").write_text(json.dumps(notes, indent=2) + "\n")
