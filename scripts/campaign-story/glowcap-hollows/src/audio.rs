//! The reference mix for reviews. The game plays the same files on its own Mix
//! channels: music per Story Scene, and these effect cues per Story Moment.
use crate::CLIP_FRAMES;
use fframes::{AudioMap, AudioTimestamp::*, AudioTrack};

/// (moment, file, seconds into the moment, gain dB). produce.py copies this table
/// into the delivery manifest, so the game and the review use the same timing.
pub const CUES: &[(usize, &str, f32, f32)] = &[
    (0, "rumble.mp3", 0.0, -8.0),
    (0, "wind.mp3", 1.2, -4.0),
    (0, "whoosh.mp3", 1.55, -4.0),
    (0, "shimmer.mp3", 2.0, -5.0),
    (0, "chime.mp3", 2.45, -8.0),
    (0, "chime-high.mp3", 2.95, -9.0),
    (0, "magic.mp3", 3.2, -6.0),
    (0, "boom.mp3", 3.95, -12.0),
    (1, "chime.mp3", 0.9, -10.0),
    (1, "chime-high.mp3", 1.6, -11.0),
    (1, "chime.mp3", 2.3, -12.0),
    (1, "shimmer.mp3", 3.4, -8.0),
    (1, "creak.mp3", 3.6, -6.0),
    (1, "drip.mp3", 5.7, -6.0),
    (2, "shimmer.mp3", 1.25, -6.0),
    (2, "slam.mp3", 1.9, -3.0),
    (2, "thud.mp3", 1.9, -6.0),
    (2, "slam.mp3", 2.25, -4.0),
    (2, "slam.mp3", 2.6, -4.0),
    (2, "snap.mp3", 3.75, -2.0),
    (3, "bow.mp3", 1.35, -4.0),
    (3, "whoosh.mp3", 1.95, -2.0),
    (3, "hit.mp3", 2.3, 0.0),
    (3, "drip.mp3", 5.8, -8.0),
    (4, "chime.mp3", 0.7, -10.0),
    (4, "chime-high.mp3", 1.5, -10.0),
    (4, "chime.mp3", 2.2, -9.0),
    (4, "chime-high.mp3", 2.9, -9.0),
    (4, "chime.mp3", 3.6, -8.0),
    (4, "shimmer.mp3", 4.4, -6.0),
    (5, "chime.mp3", 0.5, -10.0),
    (5, "chime-high.mp3", 1.3, -10.0),
    (5, "chime.mp3", 2.1, -9.0),
    (5, "creak.mp3", 2.8, -3.0),
    (5, "shimmer.mp3", 3.0, -5.0),
    (5, "magic.mp3", 4.0, -8.0),
    (6, "magic.mp3", 0.2, -5.0),
    (6, "shimmer.mp3", 1.0, -6.0),
    (6, "chime-high.mp3", 1.9, -4.0),
    (6, "boom.mp3", 2.0, -10.0),
    (6, "thud.mp3", 3.2, -4.0),
    (7, "paper.mp3", 0.75, -4.0),
    (7, "paper.mp3", 1.45, -6.0),
    (7, "chime.mp3", 1.85, -9.0),
    (7, "chime-high.mp3", 2.6, -9.0),
    (7, "whoosh.mp3", 3.2, -8.0),
    (7, "snap.mp3", 4.0, -4.0),
    (8, "creak.mp3", 0.25, -5.0),
    (8, "rumble.mp3", 2.0, -6.0),
    (8, "shimmer.mp3", 2.6, -4.0),
    (8, "drip.mp3", 3.7, -8.0),
    (8, "chime.mp3", 3.9, -10.0),
    (9, "drums.mp3", 0.1, -2.0),
    (9, "creak.mp3", 0.9, -3.0),
    (9, "slam.mp3", 1.9, -2.0),
    (9, "thud.mp3", 2.5, 0.0),
    (9, "magic.mp3", 2.9, -5.0),
    (9, "shimmer.mp3", 3.6, -4.0),
    (9, "boom.mp3", 3.6, -8.0),
    (10, "creak.mp3", 0.4, -3.0),
    (10, "wind.mp3", 1.0, -6.0),
    (10, "creak.mp3", 1.7, -6.0),
    (10, "shimmer.mp3", 2.3, -8.0),
    (10, "chime.mp3", 3.0, -10.0),
    (11, "coin.mp3", 0.75, -3.0),
    (11, "paper.mp3", 0.95, -4.0),
    (11, "paper.mp3", 1.65, -5.0),
    (11, "paper.mp3", 2.1, -6.0),
    (11, "magic.mp3", 2.8, -9.0),
    (11, "thud.mp3", 3.7, -2.0),
    (11, "boom.mp3", 3.7, -10.0),
    (12, "lid.mp3", 0.35, -3.0),
    (12, "shimmer.mp3", 0.7, -5.0),
    (12, "whoosh.mp3", 1.6, -10.0),
    (12, "boom.mp3", 3.2, -12.0),
    (12, "chime.mp3", 3.3, -12.0),
    (13, "wind.mp3", 0.0, -4.0),
    (13, "shimmer.mp3", 1.0, -5.0),
    (13, "chime-high.mp3", 2.0, -9.0),
    (13, "chime.mp3", 3.0, -10.0),
    (13, "magic.mp3", 3.1, -6.0),
    (14, "whoosh.mp3", 0.6, -6.0),
    (14, "wind.mp3", 0.8, -4.0),
    (14, "shimmer.mp3", 2.0, -4.0),
    (14, "boom.mp3", 3.4, -12.0),
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
