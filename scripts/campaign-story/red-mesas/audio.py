"""Cut, level and compress the CC0 story audio (see SOURCES.md and CREDITS.md)."""
import json
import re
import subprocess

MUSIC = "audio-v1"
SFX = "sfx-v1"
# Effects shared with the Hearthvale scenes come from their source folder.
HEARTHVALE = "../../../hearthvale/story/source/audio-v2"
# (delivered file, source, start s, length s, fade in s, fade out s, peak dBFS)
EFFECTS = [
    ("wind.mp3", f"{HEARTHVALE}/short wind sound.wav", 0.0, 4.2, 0.1, 0.8, -5),
    ("boom.mp3", f"{HEARTHVALE}/NenadSimic - Muffled Distant Explosion.wav", 0.0, 3.5, 0.0, 1.2, -3),
    ("shimmer.mp3", f"{HEARTHVALE}/health_restore.wav", 0.0, 3.0, 0.0, 0.6, -5),
    ("magic.mp3", f"{HEARTHVALE}/teleport.wav", 0.0, 1.62, 0.0, 0.4, -5),
    ("coins.mp3", f"{HEARTHVALE}/gold_sack.wav", 0.0, 1.9, 0.0, 0.3, -5),
    ("coin.mp3", f"{HEARTHVALE}/coin_drop.wav", 0.0, 1.42, 0.0, 0.3, -6),
    ("drums.mp3", f"{HEARTHVALE}/horde_war_drums_by_william_hector.wav", 0.0, 2.4, 0.0, 0.5, -4),
    ("drum.mp3", f"{HEARTHVALE}/horde_war_drums_by_william_hector.wav", 0.0, 0.45, 0.0, 0.15, -4),
    ("thud.mp3", f"{HEARTHVALE}/impactSoft_heavy_000.ogg", 0.0, 0.51, 0.0, 0.1, -3),
    ("cannon.mp3", f"{HEARTHVALE}/cannon_fire_1.ogg", 0.0, 3.0, 0.0, 1.2, -3),
    ("paper.mp3", "../../../hearthvale/story/source/audio/paper-1.mp3", 0.0, 0.48, 0.025, 0.06, -8),
    # New for the Red Mesas
    ("explosion.mp3", f"{SFX}/Chunky Explosion.mp3", 0.0, 3.2, 0.0, 1.4, -3),
    ("fuse.mp3", f"{SFX}/fuse.ogg", 0.0, 0.54, 0.02, 0.1, -9),
    ("rumble.mp3", f"{SFX}/sfx100v2_loop_machine_01.ogg", 0.0, 2.6, 0.3, 0.8, -10),
    ("skid.mp3", f"{SFX}/bfh1_metal_falling_01.ogg", 0.0, 1.16, 0.0, 0.3, -6),
    ("clank.mp3", f"{SFX}/bfh1_metal_hit_03.ogg", 0.0, 0.46, 0.0, 0.1, -5),
    ("slam.mp3", f"{SFX}/slam_01.ogg", 0.0, 0.47, 0.0, 0.1, -4),
    ("ring.mp3", f"{SFX}/bong1.wav", 0.0, 2.1, 0.0, 0.8, -8),
    ("roar.mp3", f"{SFX}/giant2.wav", 0.0, 0.93, 0.0, 0.25, -3),
    ("growl.mp3", f"{SFX}/ogre2.wav", 0.0, 0.59, 0.0, 0.15, -6),
    ("crunch.mp3", f"{SFX}/bfh1_rock_breaking_02.ogg", 0.0, 0.86, 0.0, 0.2, -3),
    ("stones.mp3", f"{SFX}/bfh1_rock_falling_01.ogg", 0.0, 0.92, 0.0, 0.25, -7),
    ("splash.mp3", f"{SFX}/splash_01.ogg", 0.0, 0.74, 0.0, 0.2, -9),
    ("steam.mp3", f"{SFX}/sfx100v2_air_01.ogg", 0.0, 1.6, 0.05, 0.5, -10),
    ("lid.mp3", f"{SFX}/wooded_box_open.ogg", 0.0, 0.37, 0.0, 0.08, -5),
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

    march = source / MUSIC / "march_of_manganda.wav"
    imminent = source / MUSIC / "cinimatic - imminent battle.mp3"
    battle = source / MUSIC / "battleThemeA.mp3"
    investigation = source / MUSIC / "_investigation_with_trail.wav"
    level = "loudnorm=I=-22:TP=-2:LRA=11"
    music = {
        # Opening: the tribal march, twice, so that the game's loop repeats less often.
        "opening-music.mp3": (
            ["-i", march, "-i", march],
            f"[0:a]atrim=0:33,asetpts=N/SR/TB[a];[1:a]atrim=0:33,asetpts=N/SR/TB[b];"
            f"[a][b]acrossfade=d=2:c1=tri:c2=tri,{level},afade=t=in:d=0.6,afade=t=out:st=61:d=3[out]",
        ),
        # Boss: Imminent Battle, ominous dialogue before a fight, twice.
        "boss-music.mp3": (
            ["-i", imminent, "-i", imminent],
            f"[0:a]atrim=0:38.4,asetpts=N/SR/TB[a];[1:a]atrim=0:38.4,asetpts=N/SR/TB[b];"
            f"[a][b]acrossfade=d=2:c1=tri:c2=tri,{level},afade=t=out:st=71.5:d=3[out]",
        ),
        # Ending: a heroic phrase of Battle Theme A for the victory, then the
        # curious mood of Investigation for the clue.
        "ending-music.mp3": (
            ["-i", battle, "-i", investigation],
            "[0:a]atrim=30:42,asetpts=N/SR/TB,afade=t=in:d=0.3[a];"
            "[1:a]atrim=0:58,asetpts=N/SR/TB[b];"
            f"[a][b]acrossfade=d=2.5:c1=tri:c2=tri,{level},afade=t=out:st=64:d=3[out]",
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
