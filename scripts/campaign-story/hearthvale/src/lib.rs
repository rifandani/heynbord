//! Fifteen cinematic Hearthvale Story Moments. Localized text is drawn only for reviews.
use fframes::{
    AudioMap, BreakLinesOpts, Color, Duration, FFramesContext, FontQuery, Frame, Scene, Scenes, Svgr,
    TextAlign, Video,
};
use std::sync::LazyLock;

mod audio;
mod boss;
mod ending;
mod fx;
mod opening;
mod script;

pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
/// Each moment is 9 s. The action ends at LOOP_START; the rest loops while the Player reads.
pub const CLIP_FRAMES: usize = 270;
pub const LOOP_START: f32 = 5.0;
pub const NAMES: [&str; 15] = [
    "OpeningFire",
    "OpeningAccord",
    "OpeningValley",
    "OpeningBaron",
    "OpeningRoad",
    "BossHall",
    "BossBaron",
    "BossToll",
    "BossFriend",
    "BossChallenge",
    "EndingBanner",
    "EndingVault",
    "EndingStone",
    "EndingSeal",
    "EndingTrail",
];

/// The Trail from the Muddy Ford to Brassbelly Hall, measured on the Region Map
/// (`REGION_MAPS` in apps/web/src/features/campaign/region-map.ts), in 1600 x 900 units.
pub const TRAIL: &[(f32, f32)] = &[
    (357., 720.), (404., 694.), (442., 666.), (470., 630.), (486., 597.), (488., 560.),
    (484., 518.), (470., 482.), (446., 455.), (418., 438.), (446., 420.), (474., 404.),
    (512., 384.), (575., 360.), (632., 362.), (692., 376.), (748., 396.), (800., 428.),
    (818., 462.), (836., 500.), (849., 540.), (865., 575.), (916., 606.), (986., 646.),
    (1052., 684.), (1130., 718.), (1186., 706.), (1246., 694.), (1305., 685.), (1352., 670.),
    (1392., 638.), (1415., 594.), (1424., 545.), (1414., 498.), (1375., 447.), (1324., 434.),
    (1278., 412.), (1246., 376.), (1238., 338.), (1220., 302.), (1170., 276.), (1115., 250.),
];
pub const STOPS: [(f32, f32); 10] = [
    (357., 720.), (470., 630.), (418., 438.), (575., 360.), (800., 428.),
    (865., 575.), (1130., 718.), (1305., 685.), (1375., 447.), (1115., 250.),
];
pub const MESA_STOPS: &[(f32, f32)] = &[
    (286., 760.), (495., 672.), (385., 557.), (557., 467.), (764., 524.),
    (898., 667.), (1113., 764.), (1354., 667.), (1408., 494.), (1198., 252.),
];
/// Brassbelly Hall, under its hat roof.
pub const HALL: (f32, f32) = (1180., 140.);
/// Where the Baron's sellsword cards land: Two Bridges, Toll Gate, Outlaw Camp, the Watchtower.
pub const CARD_SPOTS: [(f32, f32); 4] = [(470., 630.), (575., 360.), (800., 428.), (865., 575.)];
pub const CARD_ARTS: [&str; 4] = [
    "card-tusk-brute.png",
    "card-scrap-raider.png",
    "card-warhowler-drummer.png",
    "card-howling-charger.png",
];

/// Water edges of the Region Map (traced on the 1672 x 941 source), for river glints.
const RIVER: [&[(f32, f32)]; 5] = [
    &[(109.,287.),(168.,294.),(265.,331.),(325.,367.),(397.,392.),(448.,416.),(445.,435.),(385.,408.),(315.,385.),(239.,352.),(164.,322.),(112.,317.)],
    &[(514.,440.),(574.,472.),(602.,507.),(631.,541.),(685.,551.),(682.,583.),(631.,616.),(555.,635.),(549.,612.),(606.,593.),(637.,568.),(592.,543.),(557.,503.),(526.,476.)],
    &[(96.,451.),(148.,471.),(182.,497.),(209.,531.),(265.,551.),(351.,566.),(458.,591.),(470.,615.),(410.,623.),(341.,600.),(265.,580.),(206.,565.),(159.,536.),(132.,501.),(96.,478.)],
    &[(195.,690.),(226.,702.),(259.,729.),(280.,754.),(331.,773.),(375.,797.),(421.,816.),(491.,837.),(546.,861.),(614.,891.),(698.,922.),(653.,941.),(585.,908.),(516.,883.),(454.,859.),(395.,845.),(341.,822.),(300.,801.),(253.,786.),(219.,755.),(203.,721.)],
    &[(562.,193.),(647.,187.),(730.,178.),(771.,191.),(821.,200.),(869.,206.),(925.,221.),(894.,245.),(837.,245.),(795.,266.),(811.,240.),(863.,226.),(815.,218.),(753.,207.),(714.,203.),(651.,210.),(562.,210.)],
];

pub static RIVER_GLINTS: LazyLock<Vec<(f32, f32)>> = LazyLock::new(|| {
    let k = 1600. / 1672.;
    RIVER
        .iter()
        .flat_map(|poly| {
            poly.windows(2).map(move |w| (((w[0].0 + w[1].0) / 2.) * k, ((w[0].1 + w[1].1) / 2.) * k))
        })
        .collect()
});

#[derive(Debug)]
pub struct HearthvaleStoryVideo {
    fire: opening::Fire,
    accord: opening::Accord,
    valley: opening::Valley,
    baron: opening::Baron,
    road: opening::Road,
    hall: boss::Hall,
    boss_baron: boss::Baron,
    toll: boss::Toll,
    friend: boss::Friend,
    challenge: boss::Challenge,
    banner: ending::Banner,
    vault: ending::Vault,
    stone: ending::Stone,
    seal: ending::Seal,
    trail: ending::Trail,
    locale: Option<usize>,
    review_audio: bool,
}

impl HearthvaleStoryVideo {
    pub fn new(locale: Option<usize>, review_audio: bool) -> Self {
        let sh = fx::Shaders::new();
        Self {
            fire: opening::Fire::new(sh.clone()),
            accord: opening::Accord::new(sh.clone()),
            valley: opening::Valley::new(sh.clone()),
            baron: opening::Baron::new(sh.clone()),
            road: opening::Road::new(sh.clone()),
            hall: boss::Hall::new(sh.clone()),
            boss_baron: boss::Baron::new(sh.clone()),
            toll: boss::Toll::new(sh.clone()),
            friend: boss::Friend::new(sh.clone()),
            challenge: boss::Challenge::new(sh.clone()),
            banner: ending::Banner::new(sh.clone()),
            vault: ending::Vault::new(),
            stone: ending::Stone::new(sh.clone()),
            seal: ending::Seal::new(),
            trail: ending::Trail::new(sh),
            locale,
            review_audio,
        }
    }
}

impl Video for HearthvaleStoryVideo {
    const FPS: usize = 30;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::BLACK;
    fn duration(&self) -> Duration<'_> {
        Duration::Auto
    }
    fn define_scenes(&self) -> Scenes<'_> {
        Scenes::from(vec![
            &self.fire as &dyn Scene,
            &self.accord,
            &self.valley,
            &self.baron,
            &self.road,
            &self.hall,
            &self.boss_baron,
            &self.toll,
            &self.friend,
            &self.challenge,
            &self.banner,
            &self.vault,
            &self.stone,
            &self.seal,
            &self.trail,
        ])
    }
    fn audio(&self) -> AudioMap<'_> {
        if self.review_audio { audio::review_mix() } else { AudioMap::none() }
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let index = (frame.global_index / CLIP_FRAMES).min(NAMES.len() - 1);
        // Review only: the Boss scene has several speaker lines, separated by " / ".
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
                {ctx.render_scenes(&frame)}
                {narration}
            </svg>
        )
    }
}
