"""Cut, level and compress the CC0 story audio (see SOURCES.md and CREDITS.md)."""
import json
import re
import subprocess

MUSIC = "audio-v1"
SFX = "sfx-v1"
# Effects shared with the earlier Regions come from their source folders.
HEARTHVALE = "../../../hearthvale/story/source/audio-v2"
MESAS = "../../../red-mesas/story/source/sfx-v1"
HOLLOWS = "../../../glowcap-hollows/story/source/sfx-v1"
# Half speed lowers a sound by an octave: a small tree creak becomes a giant's groan.
DEEP = "asetrate=22050,aresample=44100"
# (delivered file, source, start s, length s, fade in s, fade out s, peak dBFS, extra filter)
EFFECTS = [
    ("wind.mp3", f"{HEARTHVALE}/short wind sound.wav", 0.0, 4.2, 0.1, 0.8, -5, ""),
    ("boom.mp3", f"{HEARTHVALE}/NenadSimic - Muffled Distant Explosion.wav", 0.0, 3.5, 0.0, 1.2, -3, ""),
    ("shimmer.mp3", f"{HEARTHVALE}/health_restore.wav", 0.0, 3.0, 0.0, 0.6, -5, ""),
    ("magic.mp3", f"{HEARTHVALE}/teleport.wav", 0.0, 1.62, 0.0, 0.4, -5, ""),
    ("thud.mp3", f"{HEARTHVALE}/impactSoft_heavy_000.ogg", 0.0, 0.51, 0.0, 0.1, -3, ""),
    ("drums.mp3", f"{HEARTHVALE}/horde_war_drums_by_william_hector.wav", 0.0, 2.4, 0.0, 0.5, -4, ""),
    ("wings.mp3", f"{HEARTHVALE}/wings_flap_large.ogg", 0.0, 2.6, 0.0, 0.5, -5, ""),
    ("coin.mp3", f"{HEARTHVALE}/coin-spin-fall-01.wav", 0.0, 1.43, 0.0, 0.3, -6, ""),
    ("rocks.mp3", f"{MESAS}/bfh1_rock_falling_01.ogg", 0.0, 0.9, 0.0, 0.25, -4, ""),
    ("chime.mp3", f"{HOLLOWS}/bell_ding2.wav", 0.0, 1.4, 0.0, 0.6, -6, ""),
    ("chime-high.mp3", f"{HOLLOWS}/bell_ding3.wav", 0.0, 1.6, 0.0, 0.7, -6, ""),
    ("creak.mp3", f"{HOLLOWS}/tree_creak.flac", 0.0, 2.4, 0.15, 0.6, -5, ""),
    ("whoosh.mp3", f"{HOLLOWS}/tin-whistle-whoosh-01.wav", 0.0, 0.48, 0.0, 0.1, -4, ""),
    ("slam.mp3", f"{HOLLOWS}/wood_slam_03.ogg", 0.0, 0.44, 0.0, 0.1, -3, ""),
    ("drip.mp3", f"{HOLLOWS}/water-drop-01.wav", 0.0, 0.35, 0.0, 0.08, -9, ""),
    # New for the Thornwood
    ("groan.mp3", f"{HOLLOWS}/tree_creak.flac", 0.0, 2.4, 0.2, 1.0, -4, DEEP),
    ("quake.mp3", f"{SFX}/shake.flac", 0.0, 4.0, 0.05, 1.4, -5, ""),
    ("roar.mp3", f"{SFX}/monster_roar.wav", 0.0, 4.6, 0.0, 1.6, -3, ""),
    ("horn.mp3", f"{SFX}/theircoming_0.ogg", 0.0, 3.4, 0.02, 1.2, -4, ""),
    ("boar.mp3", f"{SFX}/boar_0.ogg", 0.0, 0.52, 0.0, 0.12, -4, ""),
    ("growl.mp3", f"{SFX}/bear_01.flac", 0.0, 1.07, 0.0, 0.3, -6, ""),
    ("crash.mp3", f"{SFX}/wood_breaking_01.ogg", 0.0, 0.56, 0.0, 0.15, -3, ""),
    ("crack.mp3", f"{SFX}/wood_cracking_03.ogg", 0.0, 0.31, 0.0, 0.08, -4, ""),
    ("leaves.mp3", f"{SFX}/rustle04.flac", 0.0, 2.5, 0.1, 0.7, -8, ""),
    ("knife.mp3", f"{SFX}/handsaw-knife-scrape-01.wav", 0.0, 0.76, 0.0, 0.15, -6, ""),
    ("pouch.mp3", f"{SFX}/cloth-pouch-shake-01.wav", 0.0, 0.48, 0.0, 0.1, -6, ""),
    ("rattle.mp3", f"{SFX}/chimes-wood-rattle.wav", 1.6, 1.6, 0.02, 0.6, -7, ""),
    ("birds.mp3", f"{SFX}/birds-isaiah658_0.ogg", 2.0, 4.0, 0.4, 1.0, -12, ""),
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

    legend = source / MUSIC / "the_ancient_legend_2.mp3"
    serpents = source / MUSIC / "Ancient Power Of Serpents.mp3"
    ending = source / MUSIC / "ending_scene_orchestral.wav"
    sanctuary = source / MUSIC / "strange_sanctuary_2025_-_remaster_0.mp3"
    level = "loudnorm=I=-22:TP=-2:LRA=11"
    music = {
        # Opening: The Ancient Legend, an orchestral fantasy piece that starts soft and grows.
        "opening-music.mp3": (
            ["-i", legend],
            f"[0:a]atrim=0:68,asetpts=N/SR/TB,{level},afade=t=in:d=0.4,afade=t=out:st=64:d=4[out]",
        ),
        # Boss: Ancient Power of Serpents, slow cinematic music of an old, strong beast.
        "boss-music.mp3": (
            ["-i", serpents],
            f"[0:a]atrim=0:78,asetpts=N/SR/TB,{level},afade=t=in:d=0.3,afade=t=out:st=74:d=4[out]",
        ),
        # Ending: the calm start of Ending Scene for the rest and the healing, then
        # Strange Sanctuary, a melancholic montage theme, for the coins and the trail.
        "ending-music.mp3": (
            ["-i", ending, "-i", sanctuary],
            "[0:a]atrim=0:30,asetpts=N/SR/TB,afade=t=in:d=0.3[a];"
            "[1:a]atrim=0:46,asetpts=N/SR/TB[b];"
            f"[a][b]acrossfade=d=3:c1=tri:c2=tri,{level},afade=t=out:st=69:d=4[out]",
        ),
    }
    for name, (inputs, graph) in music.items():
        target = delivery / name
        run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", graph,
            "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "56k", target)
        notes.append(dict(file=name, changes=graph, bytes=target.stat().st_size, listeningReview="pending"))

    for name, src, start, length, fade_in, fade_out, peak_db, extra in EFFECTS:
        filters = f"silenceremove=start_periods=1:start_threshold=-50dB,{extra + ',' if extra else ''}atrim=0:{length},asetpts=N/SR/TB"
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
