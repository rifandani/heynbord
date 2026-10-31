//! Fifteen Red Mesas Story Moments. Localized text is drawn only for reviews.
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
mod mesa;
mod opening;
mod script;

pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
/// Each moment is 9 s. The action ends at LOOP_START; the rest loops while the Player reads.
pub const CLIP_FRAMES: usize = 270;
pub const LOOP_START: f32 = 5.0;
pub const NAMES: [&str; 15] = [
    "OpeningLand",
    "OpeningMines",
    "OpeningSnikkit",
    "OpeningStone",
    "OpeningRoad",
    "BossHall",
    "BossSnikkit",
    "BossTrick",
    "BossBuyer",
    "BossChallenge",
    "EndingCrown",
    "EndingBite",
    "EndingWarchief",
    "EndingPayment",
    "EndingTunnel",
];

/// The Trail of the Red Mesas Region Map (`legs` of RED_MESAS in
/// apps/web/src/features/campaign/region-map.ts), in 1600 x 900 map units.
pub const TRAIL: &[(f32, f32)] = &[
    (0., 823.), (94., 810.), (198., 786.), (286., 760.), (354., 748.), (438., 710.), (495., 672.),
    (458., 625.), (422., 583.), (385., 557.), (448., 526.), (510., 484.), (557., 467.), (625., 479.),
    (688., 500.), (764., 524.), (807., 573.), (849., 625.), (898., 667.), (969., 708.), (1042., 748.),
    (1113., 764.), (1198., 740.), (1286., 700.), (1354., 667.), (1401., 615.), (1417., 552.),
    (1408., 494.), (1388., 462.), (1362., 432.), (1330., 402.), (1304., 368.), (1278., 330.),
    (1248., 295.), (1198., 252.),
];
pub const STOPS: [(f32, f32); 10] = [
    (286., 760.), (495., 672.), (385., 557.), (557., 467.), (764., 524.),
    (898., 667.), (1113., 764.), (1354., 667.), (1408., 494.), (1198., 252.),
];
/// The bucket crown on top of Snikkit's Throne Hall, and the door of its scrap gate.
pub const CROWN: (f32, f32) = (1186., 42.);
pub const GATE: (f32, f32) = (1166., 172.);

#[derive(Debug)]
pub struct RedMesasStoryVideo {
    land: opening::Land,
    mines: opening::Mines,
    snikkit: opening::Snikkit,
    stone: opening::Stone,
    road: opening::Road,
    hall: boss::Hall,
    boss_snikkit: boss::Snikkit,
    trick: boss::Trick,
    buyer: boss::Buyer,
    challenge: boss::Challenge,
    crown: ending::Crown,
    bite: ending::Bite,
    warchief: ending::Warchief,
    payment: ending::Payment,
    tunnel: ending::Tunnel,
    locale: Option<usize>,
    review_audio: bool,
}

impl RedMesasStoryVideo {
    pub fn new(locale: Option<usize>, review_audio: bool) -> Self {
        let sh = fx::Shaders::new();
        Self {
            land: opening::Land::new(sh.clone()),
            mines: opening::Mines::new(sh.clone()),
            snikkit: opening::Snikkit::new(sh.clone()),
            stone: opening::Stone::new(sh.clone()),
            road: opening::Road::new(sh.clone()),
            hall: boss::Hall::new(sh.clone()),
            boss_snikkit: boss::Snikkit::new(sh.clone()),
            trick: boss::Trick::new(sh.clone()),
            buyer: boss::Buyer::new(sh.clone()),
            challenge: boss::Challenge::new(sh.clone()),
            crown: ending::Crown::new(sh.clone()),
            bite: ending::Bite::new(sh.clone()),
            warchief: ending::Warchief::new(sh.clone()),
            payment: ending::Payment::new(sh.clone()),
            tunnel: ending::Tunnel::new(sh),
            locale,
            review_audio,
        }
    }
}

impl Video for RedMesasStoryVideo {
    const FPS: usize = 30;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::BLACK;
    fn duration(&self) -> Duration<'_> {
        Duration::Auto
    }
    fn define_scenes(&self) -> Scenes<'_> {
        Scenes::from(vec![
            &self.land as &dyn Scene,
            &self.mines,
            &self.snikkit,
            &self.stone,
            &self.road,
            &self.hall,
            &self.boss_snikkit,
            &self.trick,
            &self.buyer,
            &self.challenge,
            &self.crown,
            &self.bite,
            &self.warchief,
            &self.payment,
            &self.tunnel,
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
                    .map(|part| (frame.text_width(ctx, font, part).unwrap_or(1120) as f32 / 1120.).ceil().max(1.))
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
                                fill: "#fff3d7",
                                ..Default::default()
                            })
                            .unwrap_or_default();
                        y += rows * line + 8.;
                        block
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g id="review-only-text">
                        <rect x="0" y={720. - height} width="1280" height={height} fill="#120a06" opacity="0.92" />
                        {text}
                    </g>
                )
            })
            .unwrap_or_default();
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={WIDTH} height={HEIGHT} viewBox="0 0 1280 720">
                {fx::defs()}
                {mesa::defs()}
                {ctx.render_scenes(&frame)}
                {narration}
            </svg>
        )
    }
}
