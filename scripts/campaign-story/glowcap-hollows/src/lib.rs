//! Fifteen Glowcap Hollows Story Moments. Localized text is drawn only for reviews.
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
mod hollows;
/// The Red Mesas props: glowcaps, impacts, the cut seal, cards and banners.
#[path = "../../red-mesas/src/mesa.rs"]
#[allow(dead_code)]
mod mesa;
mod opening;
mod script;

pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
/// Each moment is 9 s. The action ends at LOOP_START; the rest loops while the Player reads.
pub const CLIP_FRAMES: usize = 270;
pub const LOOP_START: f32 = 5.0;
pub const NAMES: [&str; 15] = [
    "OpeningExit",
    "OpeningGrove",
    "OpeningWalls",
    "OpeningArrow",
    "OpeningRoad",
    "BossHall",
    "BossGlimmerbough",
    "BossWarning",
    "BossTrade",
    "BossChallenge",
    "EndingRoots",
    "EndingSeals",
    "EndingAmber",
    "EndingLethiel",
    "EndingThornwood",
];

/// The Trail of the Glowcap Hollows Region Map (`legs` of GLOWCAP_HOLLOWS in
/// apps/web/src/features/campaign/region-map.ts), in 1600 x 900 map units.
pub const TRAIL: &[(f32, f32)] = &[
    (0., 823.), (115., 800.), (208., 773.), (290., 748.), (354., 724.), (438., 688.), (491., 649.),
    (458., 599.), (427., 557.), (391., 526.), (438., 484.), (500., 443.), (579., 414.), (656., 427.),
    (708., 458.), (759., 489.), (813., 542.), (854., 594.), (902., 641.), (969., 677.), (1042., 714.),
    (1126., 731.), (1208., 714.), (1292., 667.), (1351., 634.), (1365., 583.), (1375., 516.),
    (1358., 461.), (1323., 417.), (1260., 375.), (1208., 333.), (1165., 306.),
];
pub const STOPS: [(f32, f32); 10] = [
    (290., 748.), (491., 649.), (391., 526.), (579., 414.), (759., 489.),
    (902., 641.), (1126., 731.), (1351., 634.), (1358., 461.), (1165., 306.),
];

#[derive(Debug)]
pub struct GlowcapHollowsStoryVideo {
    exit: opening::Exit,
    grove: opening::Grove,
    walls: opening::Walls,
    arrow: opening::Arrow,
    road: opening::Road,
    hall: boss::Hall,
    lady: boss::Lady,
    warning: boss::Warning,
    trade: boss::Trade,
    challenge: boss::Challenge,
    roots: ending::Roots,
    seals: ending::Seals,
    amber: ending::Amber,
    lethiel: ending::Lethiel,
    thornwood: ending::Thornwood,
    locale: Option<usize>,
    review_audio: bool,
}

impl GlowcapHollowsStoryVideo {
    pub fn new(locale: Option<usize>, review_audio: bool) -> Self {
        let sh = fx::Shaders::new();
        Self {
            exit: opening::Exit::new(sh.clone()),
            grove: opening::Grove::new(sh.clone()),
            walls: opening::Walls::new(sh.clone()),
            arrow: opening::Arrow::new(sh.clone()),
            road: opening::Road::new(sh.clone()),
            hall: boss::Hall::new(sh.clone()),
            lady: boss::Lady::new(sh.clone()),
            warning: boss::Warning::new(sh.clone()),
            trade: boss::Trade::new(sh.clone()),
            challenge: boss::Challenge::new(sh.clone()),
            roots: ending::Roots::new(sh.clone()),
            seals: ending::Seals::new(sh.clone()),
            amber: ending::Amber::new(sh.clone()),
            lethiel: ending::Lethiel::new(sh.clone()),
            thornwood: ending::Thornwood::new(sh),
            locale,
            review_audio,
        }
    }
}

impl Video for GlowcapHollowsStoryVideo {
    const FPS: usize = 30;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::BLACK;
    fn duration(&self) -> Duration<'_> {
        Duration::Auto
    }
    fn define_scenes(&self) -> Scenes<'_> {
        Scenes::from(vec![
            &self.exit as &dyn Scene,
            &self.grove,
            &self.walls,
            &self.arrow,
            &self.road,
            &self.hall,
            &self.lady,
            &self.warning,
            &self.trade,
            &self.challenge,
            &self.roots,
            &self.seals,
            &self.amber,
            &self.lethiel,
            &self.thornwood,
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
                {ctx.render_scenes(&frame)}
                {narration}
            </svg>
        )
    }
}
