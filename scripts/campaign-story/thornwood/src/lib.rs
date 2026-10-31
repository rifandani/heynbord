//! Fifteen Thornwood Story Moments. Localized text is drawn only for reviews.
use fframes::{
    AudioMap, BreakLinesOpts, Color, Duration, FFramesContext, FontQuery, Frame, Scene, Scenes, Svgr,
    TextAlign, Video,
};

mod audio;
mod boss;
mod ending;
/// The motion toolkit is shared with the Hearthvale scenes, with its shaders.
#[path = "../../hearthvale/src/fx.rs"]
#[allow(dead_code)]
mod fx;
/// The Glowcap Hollows props: roots, leaves, thorns, amber, letters and the caustic light.
#[path = "../../glowcap-hollows/src/hollows.rs"]
#[allow(dead_code)]
mod hollows;
/// The Red Mesas props: impacts, the cut seal, cards and banners.
#[path = "../../red-mesas/src/mesa.rs"]
#[allow(dead_code)]
mod mesa;
mod opening;
mod script;
mod wood;

pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
/// Each moment is 9 s. The action ends at LOOP_START; the rest loops while the Player reads.
pub const CLIP_FRAMES: usize = 270;
pub const LOOP_START: f32 = 5.0;
pub const NAMES: [&str; 15] = [
    "OpeningForest",
    "OpeningGiant",
    "OpeningCuts",
    "OpeningAmbush",
    "OpeningRoad",
    "BossWakes",
    "BossBramble",
    "BossCutters",
    "BossThorn",
    "BossChallenge",
    "EndingRest",
    "EndingGardener",
    "EndingCamp",
    "EndingColossus",
    "EndingMarches",
];

/// The Trail of the Thornwood Region Map (`legs` of THORNWOOD in
/// apps/web/src/features/campaign/region-map.ts), in 1600 x 900 map units.
pub const TRAIL: &[(f32, f32)] = &[
    (0., 792.), (104., 783.), (208., 779.), (292., 777.), (375., 750.), (438., 698.), (471., 657.),
    (434., 630.), (405., 603.), (382., 578.), (368., 543.), (438., 500.), (490., 469.), (540., 450.),
    (625., 458.), (677., 484.), (732., 519.), (792., 573.), (823., 625.), (863., 668.), (885., 692.),
    (925., 710.), (965., 729.), (1000., 745.), (1046., 757.), (1135., 729.), (1208., 693.), (1265., 663.),
    (1313., 604.), (1313., 557.), (1299., 516.), (1262., 482.), (1222., 462.), (1182., 444.), (1146., 423.),
    (1125., 395.),
];
pub const STOPS: [(f32, f32); 10] = [
    (292., 777.), (471., 657.), (368., 543.), (540., 450.), (732., 519.),
    (863., 668.), (1046., 757.), (1265., 663.), (1299., 516.), (1125., 395.),
];

#[derive(Debug)]
pub struct ThornwoodStoryVideo {
    forest: opening::Forest,
    giant: opening::Giant,
    cuts: opening::Cuts,
    ambush: opening::Ambush,
    road: opening::Road,
    wakes: boss::Wakes,
    bramble: boss::Bramble,
    cutters: boss::Cutters,
    thorn: boss::Thorn,
    challenge: boss::Challenge,
    rest: ending::Rest,
    gardener: ending::Gardener,
    camp: ending::Camp,
    colossus: ending::Colossus,
    marches: ending::Marches,
    locale: Option<usize>,
    review_audio: bool,
}

impl ThornwoodStoryVideo {
    pub fn new(locale: Option<usize>, review_audio: bool) -> Self {
        let sh = fx::Shaders::new();
        Self {
            forest: opening::Forest::new(sh.clone()),
            giant: opening::Giant::new(sh.clone()),
            cuts: opening::Cuts::new(sh.clone()),
            ambush: opening::Ambush::new(sh.clone()),
            road: opening::Road::new(sh.clone()),
            wakes: boss::Wakes::new(sh.clone()),
            bramble: boss::Bramble::new(sh.clone()),
            cutters: boss::Cutters::new(sh.clone()),
            thorn: boss::Thorn::new(sh.clone()),
            challenge: boss::Challenge::new(sh.clone()),
            rest: ending::Rest::new(sh.clone()),
            gardener: ending::Gardener::new(sh.clone()),
            camp: ending::Camp::new(sh.clone()),
            colossus: ending::Colossus::new(sh.clone()),
            marches: ending::Marches::new(sh),
            locale,
            review_audio,
        }
    }
}

impl Video for ThornwoodStoryVideo {
    const FPS: usize = 30;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::BLACK;
    fn duration(&self) -> Duration<'_> {
        Duration::Auto
    }
    fn define_scenes(&self) -> Scenes<'_> {
        Scenes::from(vec![
            &self.forest as &dyn Scene,
            &self.giant,
            &self.cuts,
            &self.ambush,
            &self.road,
            &self.wakes,
            &self.bramble,
            &self.cutters,
            &self.thorn,
            &self.challenge,
            &self.rest,
            &self.gardener,
            &self.camp,
            &self.colossus,
            &self.marches,
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
                {ctx.render_scenes(&frame)}
                {narration}
            </svg>
        )
    }
}
