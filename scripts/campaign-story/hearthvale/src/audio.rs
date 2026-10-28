//! The reference mix for reviews. The game plays the same files on its own Mix
//! channels: music per Story Scene, and these effect cues per Story Moment.
use crate::CLIP_FRAMES;
use fframes::{AudioMap, AudioTimestamp::*, AudioTrack};

/// (moment, file, seconds into the moment, gain dB). produce.py copies this table
/// into the delivery manifest, so the game and the review use the same timing.
pub const CUES: &[(usize, &str, f32, f32)] = &[
    (0, "fire.mp3", 0.0, -4.),
    (0, "boom.mp3", 3.55, 0.),
    (1, "shimmer.mp3", 0.4, -3.),
    (1, "boom.mp3", 3.35, -2.),
    (2, "wind.mp3", 0.0, -2.),
    (3, "thunder.mp3", 2.85, 0.),
    (3, "drum.mp3", 3.05, -2.),
    (4, "boom.mp3", 0.55, -9.),
    (4, "shimmer.mp3", 1.0, -6.),
    (5, "torch.mp3", 0.9, -3.),
    (5, "thunder.mp3", 2.0, 0.),
    (5, "gate.mp3", 3.35, 0.),
    (5, "boom.mp3", 3.35, -9.),
    (6, "cloth.mp3", 0.3, -2.),
    (6, "boom.mp3", 1.9, -5.),
    (6, "drum.mp3", 2.3, -3.),
    (6, "coin.mp3", 3.95, -2.),
    (7, "thud.mp3", 1.0, 0.),
    (7, "thud.mp3", 1.38, -1.),
    (7, "thud.mp3", 1.76, -2.),
    (7, "thud.mp3", 2.14, -3.),
    (7, "thud.mp3", 2.52, -2.),
    (7, "coins.mp3", 3.0, -5.),
    (8, "magic.mp3", 0.5, -3.),
    (8, "thud.mp3", 2.35, 0.),
    (8, "coins.mp3", 2.65, -2.),
    (9, "drums.mp3", 0.1, -2.),
    (9, "shimmer.mp3", 0.4, -8.),
    (9, "cannon.mp3", 1.95, -2.5),
    (9, "boom.mp3", 3.4, -5.),
    (10, "flap.mp3", 1.1, -2.),
    (10, "boom.mp3", 1.1, -6.),
    (10, "shimmer.mp3", 1.3, -5.),
    (11, "coins.mp3", 0.3, -2.),
    (11, "coin-spin.mp3", 3.8, -1.),
    (12, "crack.mp3", 0.5, 0.),
    (12, "crack.mp3", 1.15, -7.),
    (13, "paper.mp3", 0.15, -3.),
    (13, "thud.mp3", 3.33, 0.),
    (14, "wind.mp3", 1.3, -3.),
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
