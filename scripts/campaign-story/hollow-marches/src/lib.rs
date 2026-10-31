//! Fifteen Hollow Marches Story Moments. Localized text is drawn only for reviews.
use fframes::{
    AudioMap, BreakLinesOpts, Color, Duration, FFramesContext, FontQuery, Frame, Scene, Scenes, Svgr,
    TextAlign, Video,
};

mod audio;
mod boss;
mod cutouts;
mod ending;
/// The motion toolkit is shared with the Hearthvale scenes, with its shaders.
#[path = "../../hearthvale/src/fx.rs"]
#[allow(dead_code)]
mod fx;
/// The Glowcap Hollows props: roots, leaves, thorns, amber, letters and the caustic light.
#[path = "../../glowcap-hollows/src/hollows.rs"]
#[allow(dead_code)]
mod hollows;
mod marsh;
/// The Red Mesas props: impacts, the cut seal, cards and banners.
#[path = "../../red-mesas/src/mesa.rs"]
#[allow(dead_code)]
mod mesa;
mod opening;
mod script;
/// The Thornwood props: the coins of bone, the purse, green lanterns and the green fire.
#[path = "../../thornwood/src/wood.rs"]
#[allow(dead_code)]
mod wood;

pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
/// Each moment is 9 s. The action ends at LOOP_START; the rest loops while the Player reads.
pub const CLIP_FRAMES: usize = 270;
pub const LOOP_START: f32 = 5.0;
pub const NAMES: [&str; 15] = [
    "OpeningFrost",
    "OpeningBeasts",
    "OpeningGiant",
    "OpeningCrossings",
    "OpeningRoad",
    "BossHall",
    "BossAccusation",
    "BossProof",
    "BossReversal",
    "BossChallenge",
    "EndingThaw",
    "EndingLoud",
    "EndingStone",
    "EndingRampart",
    "EndingHeynspire",
];

/// The Trail of the Hollow Marches Region Map (`legs` of HOLLOW_MARCHES in
/// apps/web/src/features/campaign/region-map.ts), in 1600 x 900 map units, then
/// the causeway from clearing 10 up to the gate of Marrow Castle.
pub const TRAIL: &[(f32, f32)] = &[
    (0., 818.), (104., 792.), (208., 771.), (318., 761.), (385., 729.), (427., 693.), (477., 654.),
    (417., 604.), (396., 578.), (370., 548.), (364., 514.), (361., 488.), (368., 471.), (392., 466.),
    (420., 467.), (450., 464.), (482., 457.), (546., 446.), (625., 458.), (688., 484.), (749., 510.),
    (792., 563.), (833., 615.), (873., 661.), (938., 708.), (1010., 745.), (1093., 769.), (1198., 750.),
    (1292., 729.), (1376., 706.), (1408., 690.), (1432., 666.), (1446., 630.), (1452., 597.), (1434., 566.),
    (1400., 541.), (1360., 521.), (1313., 495.), (1229., 448.), (1167., 417.), (1117., 372.),
    (1128., 330.), (1138., 290.), (1142., 262.),
];
pub const STOPS: [(f32, f32); 10] = [
    (318., 761.), (477., 654.), (370., 548.), (546., 446.), (749., 510.),
    (873., 661.), (1093., 769.), (1376., 706.), (1313., 495.), (1117., 372.),
];

#[derive(Debug)]
pub struct HollowMarchesStoryVideo {
    frost: opening::Frost,
    beasts: opening::Beasts,
    giant: opening::Giant,
    crossings: opening::Crossings,
    road: opening::Road,
    hall: boss::Hall,
    accusation: boss::Accusation,
    proof: boss::Proof,
    reversal: boss::Reversal,
    challenge: boss::Challenge,
    thaw: ending::Thaw,
    loud: ending::Loud,
    stone: ending::Stone,
    rampart: ending::Rampart,
    heynspire: ending::Heynspire,
    locale: Option<usize>,
    review_audio: bool,
}

impl HollowMarchesStoryVideo {
    pub fn new(locale: Option<usize>, review_audio: bool) -> Self {
        let sh = fx::Shaders::new();
        let ms = marsh::MarshShaders::new();
        Self {
            frost: opening::Frost::new(sh.clone(), ms.clone()),
            beasts: opening::Beasts::new(sh.clone(), ms.clone()),
            giant: opening::Giant::new(sh.clone()),
            crossings: opening::Crossings::new(sh.clone()),
            road: opening::Road::new(sh.clone()),
            hall: boss::Hall::new(sh.clone(), ms.clone()),
            accusation: boss::Accusation::new(sh.clone(), ms.clone()),
            proof: boss::Proof::new(sh.clone(), ms.clone()),
            reversal: boss::Reversal::new(sh.clone(), ms.clone()),
            challenge: boss::Challenge::new(sh.clone()),
            thaw: ending::Thaw::new(sh.clone(), ms.clone()),
            loud: ending::Loud::new(sh.clone(), ms.clone()),
            stone: ending::Stone::new(sh.clone(), ms.clone()),
            rampart: ending::Rampart::new(sh.clone(), ms.clone()),
            heynspire: ending::Heynspire::new(sh, ms),
            locale,
            review_audio,
        }
    }
}

impl Video for HollowMarchesStoryVideo {
    const FPS: usize = 30;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::BLACK;
    fn duration(&self) -> Duration<'_> {
        Duration::Auto
    }
    fn define_scenes(&self) -> Scenes<'_> {
        Scenes::from(vec![
            &self.frost as &dyn Scene,
            &self.beasts,
            &self.giant,
            &self.crossings,
            &self.road,
            &self.hall,
            &self.accusation,
            &self.proof,
            &self.reversal,
            &self.challenge,
            &self.thaw,
            &self.loud,
            &self.stone,
            &self.rampart,
            &self.heynspire,
        ])
    }
    fn audio(&self) -> AudioMap<'_> {
        if self.review_audio { audio::review_mix() } else { AudioMap::none() }
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let index = (frame.global_index / CLIP_FRAMES).min(NAMES.len() - 1);
        // Review only: a moment with several speaker lines separates them with " / ".
        let narration = self
            .locale
            .map(|locale| {
                let parts = script::SCRIPT[index][locale].split(" / ").collect::<Vec<_>>();
                let size = if parts.len() > 1 { 22 } else { 30 };
                let font = FontQuery { family: "Lato", size, weight: 400, ..Default::default() };
                let rows = parts
                    .iter()
                    .map(|part| (frame.text_width(ctx, font, part).unwrap_or(1120) as f32 / 1040.).ceil().max(1.))
                    .collect::<Vec<_>>();
                let line = size as f32 * 1.3;
                let height = rows.iter().sum::<f32>() * line + (parts.len() as f32 - 1.) * 8. + 44.;
                let mut y = 720. - height + 22. + size as f32;
                let text = parts
                    .iter()
                    .zip(&rows)
                    .map(|(part, rows)| {
                        let block = frame
                            .text_break_lines(ctx, part, BreakLinesOpts {
                                font,
                                width: 1120,
                                x: 80,
                                y: y as usize,
                                align: TextAlign::Left,
                                fill: "#f0fff8",
                                ..Default::default()
                            })
                            .unwrap_or_default();
                        y += rows * line + 8.;
                        block
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g id="review-only-text">
                        <rect x="0" y={720. - height} width="1280" height={height} fill="#060a10" opacity="0.92" />
                        {text}
                    </g>
                )
            })
            .unwrap_or_default();
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={WIDTH} height={HEIGHT} viewBox="0 0 1280 720">
                {fx::defs()}
                {mesa::defs()}
                {hollows::defs()}
                {wood::defs()}
                {marsh::defs()}
                {ctx.render_scenes(&frame)}
                {narration}
            </svg>
        )
    }
}
