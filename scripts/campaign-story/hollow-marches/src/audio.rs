//! The reference mix for reviews. The game plays the same files on its own Mix
//! channels: music per Story Scene, and these effect cues per Story Moment.
use crate::CLIP_FRAMES;
use fframes::{AudioMap, AudioTimestamp::*, AudioTrack};

/// (moment, file, seconds into the moment, gain dB). produce.py copies this table
/// into the delivery manifest, so the game and the review use the same timing.
pub const CUES: &[(usize, &str, f32, f32)] = &[
    (0, "wind.mp3", 0.30, -6.0),
    (0, "gust.mp3", 1.00, -6.0),
    (0, "frost.mp3", 1.60, -8.0),
    (0, "chime.mp3", 2.80, -9.0),
    (1, "ice.mp3", 1.50, -4.0),
    (1, "ice.mp3", 2.35, -2.0),
    (1, "growl.mp3", 3.00, -6.0),
    (1, "quake.mp3", 3.85, -4.0),
    (1, "boom.mp3", 3.85, -8.0),
    (2, "thud.mp3", 0.90, -2.0),
    (2, "splash.mp3", 0.95, -6.0),
    (2, "whoosh.mp3", 1.70, -5.0),
    (2, "thud.mp3", 2.50, -3.0),
    (2, "bell.mp3", 3.70, -6.0),
    (3, "splash.mp3", 1.40, -6.0),
    (3, "flare.mp3", 2.50, -6.0),
    (3, "flare.mp3", 2.75, -7.0),
    (3, "links.mp3", 3.05, -3.0),
    (3, "clank.mp3", 3.40, -4.0),
    (4, "flare.mp3", 0.40, -8.0),
    (4, "magic.mp3", 1.60, -10.0),
    (4, "flare.mp3", 2.60, -9.0),
    (4, "gate.mp3", 4.00, -4.0),
    (4, "toll.mp3", 4.30, -8.0),
    (5, "gust.mp3", 0.30, -8.0),
    (5, "toll.mp3", 1.40, -8.0),
    (5, "rattle.mp3", 2.60, -10.0),
    (5, "boom.mp3", 3.40, -10.0),
    (5, "chime.mp3", 3.45, -10.0),
    (6, "gust.mp3", 0.40, -10.0),
    (6, "cloth.mp3", 0.70, -6.0),
    (6, "magic.mp3", 1.50, -6.0),
    (6, "rattle.mp3", 2.20, -12.0),
    (7, "coins.mp3", 0.85, -3.0),
    (7, "coin.mp3", 1.00, -8.0),
    (7, "rattle.mp3", 1.50, -8.0),
    (7, "gust.mp3", 1.55, -12.0),
    (8, "glass.mp3", 0.30, -8.0),
    (8, "frost.mp3", 1.65, -10.0),
    (8, "shimmer.mp3", 3.00, -7.0),
    (9, "drums.mp3", 0.10, -2.0),
    (9, "rattle.mp3", 1.40, -3.0),
    (9, "boom.mp3", 1.40, -8.0),
    (9, "slam.mp3", 2.10, -3.0),
    (9, "gust.mp3", 3.30, -3.0),
    (10, "melt.mp3", 0.90, -6.0),
    (10, "melt.mp3", 1.60, -8.0),
    (10, "glass.mp3", 2.40, -8.0),
    (10, "gust.mp3", 2.80, -10.0),
    (10, "thud.mp3", 3.60, -12.0),
    (11, "blade.mp3", 0.70, -8.0),
    (11, "blade.mp3", 1.20, -9.0),
    (11, "rattle.mp3", 2.00, -12.0),
    (11, "chime.mp3", 3.40, -10.0),
    (12, "pouch.mp3", 0.35, -4.0),
    (12, "coins.mp3", 0.45, -4.0),
    (12, "clink.mp3", 1.65, -6.0),
    (12, "boom.mp3", 1.80, -12.0),
    (12, "magic.mp3", 2.20, -10.0),
    (13, "creak.mp3", 0.60, -6.0),
    (13, "creak.mp3", 1.40, -8.0),
    (13, "thud.mp3", 3.25, -3.0),
    (13, "shimmer.mp3", 3.45, -5.0),
    (14, "gust.mp3", 0.40, -6.0),
    (14, "whoosh.mp3", 1.60, -6.0),
    (14, "toll.mp3", 2.60, -8.0),
    (14, "shimmer.mp3", 3.50, -8.0),
];

pub fn review_mix<'a>() -> AudioMap<'a> {
    let clip = CLIP_FRAMES as f32 / 30.;
    let part = clip * 5.;
    let mut tracks = ["opening-music.mp3", "boss-music.mp3", "ending-music.mp3"]
        .iter()
        .enumerate()
        .map(|(i, file)| {
            let start = part * i as f32;
            AudioTrack::new(file, Second(start)..Second(start + part)).fade_in(0.02).fade_out(0.5)
        })
        .collect::<Vec<_>>();
    for (moment, file, at, gain) in CUES {
        let start = *moment as f32 * clip + at;
        let end = (*moment as f32 + 1.) * clip;
        tracks.push(AudioTrack::new(file, Second(start)..Second(end)).gain_db(*gain).fade_out(0.08));
    }
    AudioMap::from(tracks)
}
