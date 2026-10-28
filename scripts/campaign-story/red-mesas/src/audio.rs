//! The reference mix for reviews. The game plays the same files on its own Mix
//! channels: music per Story Scene, and these effect cues per Story Moment.
use crate::CLIP_FRAMES;
use fframes::{AudioMap, AudioTimestamp::*, AudioTrack};

/// (moment, file, seconds into the moment, gain dB). produce.py copies this table
/// into the delivery manifest, so the game and the review use the same timing.
pub const CUES: &[(usize, &str, f32, f32)] = &[
    (0, "wind.mp3", 0.6, -4.),
    (0, "boom.mp3", 3.12, -1.),
    (1, "rumble.mp3", 0.2, -6.),
    (1, "fuse.mp3", 1.25, -3.),
    (1, "fuse.mp3", 1.8, -4.),
    (1, "fuse.mp3", 2.35, -4.),
    (1, "fuse.mp3", 2.9, -3.),
    (1, "explosion.mp3", 3.3, 0.),
    (2, "rumble.mp3", 0.3, -2.),
    (2, "skid.mp3", 1.5, -2.),
    (2, "thud.mp3", 1.9, -2.),
    (2, "coins.mp3", 2.4, -3.),
    (2, "drum.mp3", 3.1, -3.),
    (3, "magic.mp3", 0.6, -6.),
    (3, "shimmer.mp3", 3.0, -8.),
    (4, "fuse.mp3", 0.35, -4.),
    (4, "fuse.mp3", 1.6, -6.),
    (4, "fuse.mp3", 2.8, -6.),
    (4, "cannon.mp3", 4.0, -6.),
    (4, "shimmer.mp3", 4.05, -6.),
    (5, "clank.mp3", 0.55, -6.),
    (5, "clank.mp3", 0.85, -8.),
    (5, "clank.mp3", 1.15, -8.),
    (5, "slam.mp3", 1.5, -4.),
    (5, "steam.mp3", 3.15, -6.),
    (5, "cannon.mp3", 3.85, -6.),
    (5, "shimmer.mp3", 3.9, -8.),
    (6, "rumble.mp3", 0.3, -3.),
    (6, "skid.mp3", 1.45, -2.),
    (6, "thud.mp3", 1.9, 0.),
    (6, "drum.mp3", 2.67, -5.),
    (6, "drum.mp3", 2.89, -7.),
    (6, "drum.mp3", 3.11, -7.),
    (6, "drum.mp3", 3.33, -4.),
    (7, "steam.mp3", 0.25, -4.),
    (7, "rumble.mp3", 0.4, -9.),
    (7, "coin.mp3", 2.79, -6.),
    (7, "splash.mp3", 2.99, -4.),
    (7, "coin.mp3", 4.79, -6.),
    (8, "rumble.mp3", 0.3, -4.),
    (8, "magic.mp3", 2.0, -4.),
    (8, "rumble.mp3", 2.8, -4.),
    (8, "shimmer.mp3", 3.4, -6.),
    (8, "thud.mp3", 4.0, -6.),
    (9, "drums.mp3", 0.1, -2.),
    (9, "slam.mp3", 1.3, -2.),
    (9, "slam.mp3", 1.6, -3.),
    (9, "cannon.mp3", 2.3, -3.),
    (9, "roar.mp3", 2.45, -3.),
    (9, "boom.mp3", 3.6, -6.),
    (10, "clank.mp3", 0.85, 0.),
    (10, "ring.mp3", 0.9, -6.),
    (10, "clank.mp3", 1.35, -6.),
    (10, "skid.mp3", 1.9, -8.),
    (10, "clank.mp3", 3.9, -10.),
    (11, "coin.mp3", 0.5, -8.),
    (11, "crunch.mp3", 1.95, 0.),
    (11, "stones.mp3", 2.05, -4.),
    (11, "growl.mp3", 2.3, -2.),
    (12, "roar.mp3", 0.35, 0.),
    (12, "drums.mp3", 0.7, -4.),
    (12, "clank.mp3", 2.25, -2.),
    (12, "ring.mp3", 2.3, -8.),
    (12, "shimmer.mp3", 3.0, -4.),
    (13, "lid.mp3", 0.55, -2.),
    (13, "magic.mp3", 0.6, -4.),
    (13, "shimmer.mp3", 0.9, -8.),
    (13, "paper.mp3", 2.2, -3.),
    (13, "thud.mp3", 3.25, -2.),
    (13, "magic.mp3", 3.3, -8.),
    (14, "rumble.mp3", 0.0, -4.),
    (14, "rumble.mp3", 1.3, -2.),
    (14, "wind.mp3", 2.4, -3.),
    (14, "shimmer.mp3", 3.1, -4.),
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
