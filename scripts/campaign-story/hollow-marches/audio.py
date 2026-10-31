"""Cut, level and compress the CC0 story audio (see SOURCES.md and CREDITS.md)."""
import json
import re
import subprocess

SFX = "sfx-v1"
# Music and effects shared with the earlier Regions come from their source folders.
HEARTHVALE = "../../../hearthvale/story/source/audio-v2"
MESAS = "../../../red-mesas/story/source/sfx-v1"
HOLLOWS = "../../../glowcap-hollows/story/source/sfx-v1"
THORNWOOD = "../../../thornwood/story/source/sfx-v1"
THORNWOOD_MUSIC = "../../../thornwood/story/source/audio-v1"
# Half speed lowers a sound by an octave: breaking glass becomes cracking ice.
DEEP = "asetrate=22050,aresample=44100"
DEEPER = "asetrate=14700,aresample=44100"
# (delivered file, source, start s, length s, fade in s, fade out s, peak dBFS, extra filter)
EFFECTS = [
    ("wind.mp3", f"{HEARTHVALE}/short wind sound.wav", 0.0, 4.2, 0.1, 0.8, -5, ""),
    ("gust.mp3", f"{HEARTHVALE}/wind woosh loop.ogg", 0.0, 3.2, 0.4, 1.2, -6, ""),
    ("boom.mp3", f"{HEARTHVALE}/NenadSimic - Muffled Distant Explosion.wav", 0.0, 3.5, 0.0, 1.2, -3, ""),
    ("shimmer.mp3", f"{HEARTHVALE}/health_restore.wav", 0.0, 3.0, 0.0, 0.6, -5, ""),
    ("magic.mp3", f"{HEARTHVALE}/teleport.wav", 0.0, 1.62, 0.0, 0.4, -5, ""),
    ("thud.mp3", f"{HEARTHVALE}/impactSoft_heavy_000.ogg", 0.0, 0.51, 0.0, 0.1, -3, ""),
    ("drums.mp3", f"{HEARTHVALE}/horde_war_drums_by_william_hector.wav", 0.0, 2.4, 0.0, 0.5, -4, ""),
    ("coin.mp3", f"{HEARTHVALE}/coin-spin-fall-01.wav", 0.0, 1.43, 0.0, 0.3, -6, ""),
    ("flare.mp3", f"{HEARTHVALE}/fire.wav", 2.0, 1.6, 0.05, 0.9, -6, ""),
    ("cloth.mp3", f"{HEARTHVALE}/cloth-heavy.wav", 0.0, 0.41, 0.0, 0.1, -6, ""),
    ("splash.mp3", f"{MESAS}/splash_01.ogg", 0.0, 0.74, 0.0, 0.2, -4, ""),
    ("chime.mp3", f"{HOLLOWS}/bell_ding2.wav", 0.0, 1.4, 0.0, 0.6, -6, ""),
    ("whoosh.mp3", f"{HOLLOWS}/tin-whistle-whoosh-01.wav", 0.0, 0.48, 0.0, 0.1, -4, ""),
    ("gate.mp3", f"{HOLLOWS}/door_open_01.ogg", 0.0, 1.5, 0.0, 0.4, -5, DEEP),
    ("slam.mp3", f"{HOLLOWS}/wood_slam_03.ogg", 0.0, 0.44, 0.0, 0.1, -3, ""),
    ("quake.mp3", f"{THORNWOOD}/shake.flac", 0.0, 4.0, 0.05, 1.4, -5, ""),
    ("growl.mp3", f"{THORNWOOD}/bear_01.flac", 0.0, 1.07, 0.0, 0.3, -6, DEEP),
    ("pouch.mp3", f"{THORNWOOD}/cloth-pouch-shake-01.wav", 0.0, 0.48, 0.0, 0.1, -6, ""),
    ("coins.mp3", f"{THORNWOOD}/coins-shake-01.wav", 0.0, 1.19, 0.0, 0.3, -6, ""),
    ("rattle.mp3", f"{THORNWOOD}/chimes-wood-rattle.wav", 1.6, 1.6, 0.02, 0.6, -7, ""),
    ("blade.mp3", f"{THORNWOOD}/seax-unsheathe-01.wav", 0.0, 0.5, 0.0, 0.15, -8, ""),
    # New for the Hollow Marches
    ("ice.mp3", f"{SFX}/bfh1_glass_breaking_01.ogg", 0.0, 1.5, 0.0, 0.5, -3, DEEP),
    ("frost.mp3", f"{SFX}/bfh1_glass_hit_02.ogg", 0.0, 0.9, 0.0, 0.4, -8, DEEPER),
    ("clink.mp3", f"{SFX}/bfh1_glass_hit_01.ogg", 0.0, 0.3, 0.0, 0.1, -7, ""),
    ("glass.mp3", f"{SFX}/bfh1_glass_hit_01.ogg", 0.0, 0.9, 0.0, 0.5, -8, DEEP),
    ("clank.mp3", f"{SFX}/handcuffs-metal-lock-01.wav", 0.0, 0.6, 0.0, 0.15, -5, DEEP),
    ("links.mp3", f"{SFX}/bfh1_metal_falling_02.ogg", 0.0, 1.48, 0.0, 0.4, -6, DEEP),
    ("bell.mp3", f"{SFX}/bell_03.ogg", 0.0, 3.5, 0.0, 1.6, -6, DEEP),
    ("toll.mp3", f"{SFX}/bell_01.ogg", 0.0, 2.6, 0.0, 1.2, -7, DEEPER),
    ("melt.mp3", f"{SFX}/water-drop-02.wav", 0.0, 0.4, 0.0, 0.1, -9, ""),
    ("creak.mp3", f"{SFX}/floor-creak-01.wav", 0.0, 1.3, 0.0, 0.4, -7, DEEP),
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

    mysteries = source / HEARTHVALE / "ancient_mysteries_-_with_tail.mp3"
    majesty = source / THORNWOOD_MUSIC / "Majesty.ogg"
    unsolved = source / HEARTHVALE / "Unsolved-Investigation-isaiah658.wav"
    level = "loudnorm=I=-19.95:TP=-2:LRA=11"
    music = {
        # Opening: Ancient Mysteries, a slow mysterious melody with echoes, for the cold mist.
        "opening-music.mp3": (
            ["-i", mysteries],
            f"[0:a]atrim=0:70,asetpts=N/SR/TB,{level},afade=t=in:d=0.4,afade=t=out:st=66:d=4[out]",
        ),
        # Boss: Majesty, a stately orchestral piece: the theme of Queen Marrow.
        "boss-music.mp3": (
            ["-i", majesty],
            f"[0:a]atrim=0:72,asetpts=N/SR/TB,{level},afade=t=in:d=0.3,afade=t=out:st=68:d=4[out]",
        ),
        # Ending: the Queen's theme again for the thaw and her respect, then
        # Unsolved Investigation, dark and quiet, for the stone coin and Heynspire.
        "ending-music.mp3": (
            ["-i", majesty, "-i", unsolved],
            "[0:a]atrim=96:126,asetpts=N/SR/TB,afade=t=in:d=0.5[a];"
            "[1:a]atrim=0:48,asetpts=N/SR/TB[b];"
            f"[a][b]acrossfade=d=3:c1=tri:c2=tri,{level},afade=t=out:st=71:d=4[out]",
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
