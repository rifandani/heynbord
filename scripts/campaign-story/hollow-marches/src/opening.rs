//! Opening: the marsh that should not freeze, the frost beasts, the stone giant,
//! the crossings close, the road to Marrow Castle.
use crate::cutouts::*;
use crate::fx::*;
use crate::marsh::*;
use crate::mesa::{after, burst, cut_seal, dust_burst, ease_out, project, shock_ring};
use crate::{CLIP_FRAMES, STOPS, TRAIL};
use fframes::{Color, Duration, FFramesContext, Frame, Scene, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const MAP: &str = "hollow-marches-region.png";

/// A flare that rises fast, overshoots and settles at 1 (the Thornwood bowls).
fn bloom_flare(dt: f32) -> f32 {
    if dt <= 0. {
        return 0.;
    }
    let raw = (1. - (-dt * 8.).exp()) * (1. + 0.8 * (-dt * 3.).exp());
    lerp(raw, 1., (dt / 1.6).clamp(0., 1.).powi(3))
}

/// A cold green flame, its base at the origin.
fn green_flame<'a>(h: f32, t: f32, seed: f32) -> Svgr<'a> {
    let f = flicker(t, seed);
    let hh = h * (0.85 + 0.3 * f);
    let sway = h * 0.12 * wave(t, 5., seed);
    let d = format!(
        "M0 0 C{:.1} {:.1} {:.1} {:.1} {sway:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} 0 0Z",
        -h * 0.32, -hh * 0.2, -h * 0.28, -hh * 0.6, -hh, h * 0.28, -hh * 0.6, h * 0.32, -hh * 0.2
    );
    fframes::svgr!(
        <g>
            <path d={d.clone()} fill="#3aff7a" opacity="0.85" />
            <path d={d} fill="#eafff0" transform="scale(0.45 0.55)" />
        </g>
    )
}

// ---------------------------------------------------------------- 1. Frost

const TITLE: &str = "HOLLOW MARCHES";
/// The Thornwood ending stops on frame 269 of its Hollow Marches shot.
const TW_END: f32 = 269. / 30.;
const TW_CAM: (f32, f32, f32) = (975., 470., 1.3);
const TW_BOWLS: [((f32, f32), f32); 2] = [((1058., 373.), 3.0), ((1173., 380.), 3.3)];
const PULL_AT: f32 = 0.8;
const WAVE_AT: f32 = 1.0;
const REEDS_AT: f32 = 1.1;
const SUN_AT: f32 = 1.8;
const TITLE_AT: f32 = 2.7;

#[derive(Debug)]
pub struct Frost {
    sh: Shaders,
    cam: Cam,
    grade: Anim,
    seal: Anim,
    wave: Anim,
    reeds: Anim,
    frost: Anim,
    sun: Anim,
}

impl Frost {
    pub fn new(sh: Shaders, _ms: MarshShaders) -> Self {
        Self {
            sh,
            cam: camera(&[(PULL_AT, 4.7, TW_CAM, (800., 450., 1.0))]),
            grade: tw(1.2, 3.6, 0., 1., Easing::EaseInOut),
            seal: tw(0.5, 1.7, 1., 0., Easing::EaseIn),
            wave: tw(WAVE_AT, 3.9, -500., 1900., Easing::EaseInOut),
            reeds: spring(REEDS_AT, 0., 1., SOFT),
            frost: tw(1.5, 3.4, 0., 1., Easing::EaseOut),
            sun: tw(SUN_AT, 3.2, 0., 1., Easing::EaseInOut),
        }
    }
}

impl Scene for Frost {
    fn name(&self) -> &'static str {
        "OpeningFrost"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image(MAP) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        // Time on the clock of the Thornwood ending, for continuity.
        let ta = t + TW_END;
        let cam = frame.animate(&self.cam);
        let g = frame.animate(&self.grade);
        let grade = Grade { dusk: lerp(0.2, 0.04, g), gold: lerp(0.05, 0.2, g), dark: lerp(0.1, 0., g), ..Default::default() };
        // The props of the Thornwood ending: the ferry lamp, the bowls and frost on the hills.
        let bowls = TW_BOWLS
            .iter()
            .map(|&((x, y), at)| {
                let k = bloom_flare(ta - at);
                let f = flicker(ta, x * 0.01);
                fframes::svgr!(
                    <g>
                        <circle cx={x} cy={y - 8.} r={16. + 22. * k + 4. * f} fill="url(#g-witch)" opacity={(0.3 + 0.5 * k.min(1.)) * (0.8 + 0.2 * f)} />
                        <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {x:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}Z", x - 7., y, x - 8., y - 10., x - 2., y - 16., y - 24. - 10. * k - 3. * f, x + 2., y - 16., x + 8., y - 10., x + 7., y)} fill="#8aff9a" opacity={0.4 + 0.6 * k.min(1.)} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let lamp = 0.6 + 0.4 * flicker(ta, 0.5);
        let ferry = fframes::svgr!(<circle cx={FERRY_LAMP.0} cy={FERRY_LAMP.1} r={26. + 6. * lamp} fill="url(#g-witch)" opacity={0.55 * lamp} />);
        let frost_glints = (0..18u32)
            .map(|k| {
                let (x, y) = (lerp(900., 1560., rnd(k, 21)), lerp(40., 260., rnd(k, 22)));
                let u = (loop_phase(ta) * 2. + rnd(k, 23)).rem_euclid(1.);
                glint(x, y, 3., (PI * u).sin().powi(6))
            })
            .collect::<Vec<_>>();
        // New frost over the whole marsh, where no frost should be.
        let marsh_frost = (0..26u32)
            .map(|k| {
                let (x, y) = (lerp(120., 1480., rnd(k, 31)), lerp(320., 860., rnd(k, 32)));
                let born = 1.6 + 1.8 * rnd(k, 33);
                let u = (loop_phase(t) + rnd(k, 34)).rem_euclid(1.);
                crystal(x, y, 5., after(t, born, 0.6) * (0.25 + 0.75 * (PI * u).sin().powi(6)))
            })
            .collect::<Vec<_>>();
        // The cut seal of the last moment sinks into the mist.
        let seal_k = frame.animate(&self.seal);
        let seal = seal_k * (0.4 + 0.12 * wave(ta, 1., 0.));
        let sink = 40. * (1. - seal_k);
        let tide = 0.45 + 0.18 * after(t, 2.4, 1.4) + 0.06 * wave(t, 1., 0.) * after(t, 1., 1.);
        let fog = Fog { density: 0.45, soft: 0.3, light: Color::hex("#e8f0f8"), shade: Color::hex("#8aa0b8"), dir: (0.5, -0.05), scale: 1.3, seed: 41.0 };
        let snow = Motes { count: 40, seed: 3501, area: (0., 0., 1280., 760.), rise: -300., period: LOOP, size: (1., 2.4), sway: 30., fill: "#f4f8ff" };
        let front = frame.animate(&self.wave);
        let wave_alpha = 0.95 * (1. - after(t, 3.5, 0.6));
        // Reeds rise into the corners, and frost runs up their stems.
        let rise = frame.animate(&self.reeds);
        let frost = frame.animate(&self.frost);
        let pull = after(t, PULL_AT, 3.9);
        let reed_l = fframes::svgr!(<g transform={format!("translate({:.1} {:.1})", 70. - 50. * pull, 770. + 520. * (1. - rise))}>{reeds(t, 51, 430., frost, 1.)}</g>);
        let reed_r = fframes::svgr!(<g transform={format!("translate({:.1} {:.1})", 1220. + 50. * pull, 780. + 520. * (1. - rise))}>{reeds(t, 71, 380., frost * 0.9, -1.)}</g>);
        let sun = frame.animate(&self.sun);
        let title = frost_title(&mut frame, ctx, TITLE, 640., 158., 70, t, TITLE_AT, 0.07);
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {painting(&self.sh, &frame, map, grade)}
                    {ferry}
                    {bowls}
                    {frost_glints}
                    {marsh_frost}
                </g>
                <rect width="1280" height="720" fill="#9ab8d8" opacity="0.08" />
                {rays(&self.sh, &frame, (-160., -140.), 0.75 * sun, 1.2, SUN)}
                <rect width="1280" height="720" fill="url(#g-sun-left)" opacity={0.5 * sun} />
                {fog_at(&self.sh, &frame, &fog, loop_phase(ta), tide, (-40., 380., 1360., 360.))}
                {mist_wave(front, (300., 760.), t, wave_alpha, 611)}
                {snow.draw(ta, 0.5)}
                <circle cx="640" cy={150. + sink} r="140" fill="#14061e" opacity={0.3 * seal} filter="url(#blur18)" />
                {cut_seal(640., 150. + sink, 70., seal)}
                <rect width="1280" height="300" fill="url(#hm-top-calm)" opacity={0.9 * after(t, TITLE_AT - 0.5, 0.8)} />
                {title}
                {reed_l}
                {reed_r}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity={lerp(0.75, 0.55, g)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Beasts

const CRACK_AT: f32 = 1.5;
const RISE_AT: f32 = 2.3;
const RISE_END: f32 = 3.3;
const TREMOR_AT: f32 = 3.85;
const CAVE_CAM: (f32, f32, f32) = (1185., 605., 2.1);
/// The walk of the beasts out of the Ice Cave and down to the marsh, in map units.
const BEAST_PATH: [(f32, f32); 7] = [(1412., 626.), (1360., 648.), (1300., 664.), (1236., 672.), (1170., 674.), (1100., 668.), (1030., 656.)];
/// (cut-out, height in pixels) of each beast, in walking order.
const BEASTS: [(&str, f32); 5] = [("woolly-mammoth", 140.), ("frostfang-lynx", 88.), ("avalanche-yeti", 122.), ("frost-elk-matriarch", 140.), ("old-frostmaw", 132.)];

fn beast_size(name: &str) -> (f32, f32) {
    match name {
        "woolly-mammoth" => WOOLLY_MAMMOTH,
        "frostfang-lynx" => FROSTFANG_LYNX,
        "avalanche-yeti" => AVALANCHE_YETI,
        "frost-elk-matriarch" => FROST_ELK_MATRIARCH,
        _ => OLD_FROSTMAW,
    }
}

/// The place of beast `i` on the walk, 0..1, one walk per LOOP; `back` walks home.
fn beast_u(t: f32, i: usize, back: bool) -> f32 {
    let u = (t / LOOP + i as f32 / BEASTS.len() as f32).rem_euclid(1.);
    if back { 1. - u } else { u }
}

/// The frost beasts on the map, walking down from the Ice Cave (or back up).
pub fn beast_line<'a>(ctx: &FFramesContext<'a, '_>, cam: (f32, f32, f32), t: f32, flinch: f32, back: bool, filter: &'static str) -> Svgr<'a> {
    let track = Track::new(BEAST_PATH.to_vec());
    let mut list = (0..BEASTS.len()).map(|i| (i, beast_u(t, i, back))).collect::<Vec<_>>();
    // Nearer the camera (lower on the map) draws later.
    list.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
    let beasts = list
        .iter()
        .map(|&(i, u)| {
            let (name, h) = BEASTS[i];
            let Some(img) = ctx.get_image(&format!("cut-{name}.png")) else {
                return Svgr::empty();
            };
            let (x, y) = project(cam, track.at(u));
            let fade = smoothstep(0.0, 0.14, u) * (1. - smoothstep(0.82, 1.0, u));
            let step = t * 2. / LOOP * 4. + i as f32 * 0.37;
            let bob = 2.5 * (TAU * step).sin().abs() + flinch * 6. * (TAU * (t * 3.)).sin();
            let breath = (loop_phase(t * 2. + i as f32 * 0.31) * 1.).rem_euclid(1.);
            let head = if back { x + h * 0.4 } else { x - h * 0.45 };
            let size = beast_size(name);
            fframes::svgr!(
                <g opacity={fade}>
                    <ellipse cx={x} cy={y} rx={h * 0.38} ry={h * 0.07} fill="#08121c" opacity="0.25" filter="url(#blur3)" />
                    <g transform={format!("translate(0 {:.1})", -bob)}>{figure(img, size, x, y + 4., h, !back, filter, 1.)}</g>
                    {puff(head - 10. * breath * if back { -1. } else { 1. }, y - h * 0.62 - 8. * breath, 14. + 22. * breath, 7. + 10. * breath, 0.5 * (PI * breath).sin(), "url(#hm-mist)")}
                </g>
            )
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{beasts}</g>)
}

#[derive(Debug)]
pub struct Beasts {
    sh: Shaders,
    ms: MarshShaders,
    rise: Anim,
}

impl Beasts {
    pub fn new(sh: Shaders, ms: MarshShaders) -> Self {
        Self { sh, ms, rise: tw(RISE_AT, RISE_END, 0., 1., Easing::EaseInOut) }
    }
}

impl Scene for Beasts {
    fn name(&self) -> &'static str {
        "OpeningBeasts"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image(MAP) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let r = frame.animate(&self.rise);
        let off = r * 760.;
        // ---- Under the ice: the shapes of the beasts cross over the ice ceiling.
        let under = if r < 0.999 {
            let track = Track::new(vec![(1360., 0.), (-200., 0.)]);
            let shadows = (0..BEASTS.len())
                .map(|i| {
                    let (name, h) = BEASTS[i];
                    let Some(img) = ctx.get_image(&format!("cut-{name}.png")) else {
                        return Svgr::empty();
                    };
                    let u = (t / LOOP * 0.5 + i as f32 / BEASTS.len() as f32).rem_euclid(1.);
                    let (x, _) = track.at(u);
                    let bob = 3. * (TAU * (t * 1.6 + i as f32 * 0.3)).sin().abs();
                    figure(img, beast_size(name), x, 290. - bob, h * 1.7, true, "url(#hm-shadow)", 0.82)
                })
                .collect::<Vec<_>>();
            // The dead of the marsh run away along the bottom of the pool.
            let dead = [("graveyard-drudge", GRAVEYARD_DRUDGE, 330., 0.), ("rattleknife", RATTLEKNIFE, 640., 0.2), ("graveyard-drudge", GRAVEYARD_DRUDGE, 960., 0.45)]
                .iter()
                .map(|&(name, size, x0, delay)| {
                    let Some(img) = ctx.get_image(&format!("cut-{name}.png")) else {
                        return Svgr::empty();
                    };
                    let run = (t - 0.3 - delay).max(0.);
                    let x = x0 - 60. * run * run - 150. * run;
                    let hop = 10. * (TAU * run * 2.4).sin().abs();
                    let y = 700. - hop;
                    fframes::svgr!(
                        <g transform={format!("rotate({:.1} {x:.1} {y:.1})", -8. * (run * 3.).min(1.))}>
                            {figure(img, size, x, y, 160., true, "url(#hm-ghost)", 0.95)}
                            <circle cx={x + 18.} cy={y - 136.} r="9" fill="url(#hm-eye)" opacity="0.8" />
                        </g>
                    )
                })
                .collect::<Vec<_>>();
            let bubbles = Motes { count: 34, seed: 2201, area: (0., 260., 1280., 480.), rise: 420., period: LOOP, size: (1.5, 4.5), sway: 10., fill: "url(#hm-ice-glow)" };
            let crack = after(t, CRACK_AT, 0.6);
            let ice = Ice { frost: 0.32, crack: 0.35 + 0.65 * crack, melt: 0., scale: 1.5, offset: (0., 0.), tint: (0.7, 0.88, 1.0) };
            let icicles = (0..26u32)
                .map(|k| {
                    let x = k as f32 * 52. + 20. * rnd(k, 61);
                    let l = lerp(14., 60., rnd(k, 62));
                    format!("M{:.1} 300 L{:.1} {:.1} L{:.1} 300Z", x - 9., x, 300. + l, x + 9.)
                })
                .collect::<String>();
            fframes::svgr!(
                <g transform={format!("translate(0 {off:.1})")}>
                    <rect width="1280" height="720" fill="url(#hm-under)" />
                    {crate::hollows::caustic(&self.ms.caustic, &frame, 1.3, (0.02, 0.1, 0.14), (0.35, 0.72, 0.78), 0.1, (0., 300., 1280., 420.))}
                    {rays(&self.sh, &frame, (180., -60.), 0.65, 1.1, ICE)}
                    <rect width="1280" height="306" fill="url(#hm-ice-sheet)" opacity="0.95" />
                    <ellipse cx="300" cy="120" rx="420" ry="140" fill="url(#hm-ice-glow)" opacity="0.55" />
                    {shadows}
                    {ice.draw(&self.ms, &frame, loop_phase(t), 0.95, (0., 0., 1280., 306.))}
                    <path d={icicles} fill="#cfeaff" opacity="0.85" />
                    <rect y="294" width="1280" height="14" fill="#f4fbff" opacity="0.55" />
                    {dead}
                    {bubbles.draw(t, 0.7)}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // ---- Above: the beasts walk out of the Ice Cave; a tremor comes from the west.
        let (sx, sy) = shake(t, TREMOR_AT, 12.);
        let cam = CAVE_CAM;
        let flinch = (1. - after(t, TREMOR_AT, 0.8)) * after(t, TREMOR_AT, 0.05);
        let above = if r > 0.001 {
            let cave = project(cam, CAVE);
            let fog = Fog { density: 0.4, soft: 0.32, light: Color::hex("#eef6ff"), shade: Color::hex("#9ab4cc"), dir: (-0.5, 0.08), scale: 1.4, seed: 17.0 };
            let snow_trees = (0..6u32)
                .map(|k| dust_burst(lerp(80., 1200., rnd(k, 71)), lerp(60., 200., rnd(k, 72)), t - TREMOR_AT - 0.1 - 0.08 * k as f32, 1.4, 6, 720 + k, 120., "url(#hm-mist)"))
                .collect::<Vec<_>>();
            let rocks_frost = (0..14u32)
                .map(|k| {
                    let (x, y) = (cave.0 + lerp(-200., 120., rnd(k, 81)), cave.1 + lerp(-90., 80., rnd(k, 82)));
                    let u = (loop_phase(t) * 2. + rnd(k, 83)).rem_euclid(1.);
                    crystal(x, y, 4.5, (PI * u).sin().powi(6))
                })
                .collect::<Vec<_>>();
            let flash = (1. - after(t, TREMOR_AT, 1.2)) * after(t, TREMOR_AT - 0.05, 0.08);
            fframes::svgr!(
                <g transform={format!("translate({sx:.1} {:.1})", off - 760. + sy)}>
                    <g transform={cam_transform(cam, (0., 0.))}>
                        {painting(&self.sh, &frame, map, Grade { gold: 0.12, dusk: 0.06, ..Default::default() })}
                    </g>
                    <rect width="1280" height="720" fill="#9ab8d8" opacity="0.1" />
                    <circle cx={cave.0} cy={cave.1 - 10.} r={130. + 10. * wave(t, 1., 0.)} fill="url(#hm-ice-glow)" opacity="0.4" />
                    {fog.draw(&self.sh, &frame, 0.5 + 0.08 * wave(t, 1., 0.1), (-40., 430., 1360., 330.))}
                    {beast_line(ctx, cam, t, flinch, false, "url(#hm-frost)")}
                    {rocks_frost}
                    <ellipse cx="40" cy="300" rx="560" ry="380" fill="url(#hm-gold-glow)" opacity={flash} />
                    {rays(&self.sh, &frame, (-120., 300.), 0.8 * flash, 1.0, DAWN)}
                    <g filter="url(#blur8u)">{shock_ring(60., 380., t - TREMOR_AT, 1.6, 1200., 260., "#ffd890")}</g>
                    {snow_trees}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The ice cracks, and its shards fly past as the camera breaks through.
        let shards = (0..22u32)
            .filter_map(|k| {
                let dt = t - RISE_AT + 0.05 - 0.03 * rnd(k, 91);
                if !(0.0..0.9).contains(&dt) {
                    return None;
                }
                let a = TAU * rnd(k, 92);
                let d = 60. + 900. * dt * dt * lerp(0.6, 1.4, rnd(k, 93));
                let s = lerp(18., 60., rnd(k, 94)) * (1. + 3. * dt);
                let (x, y) = (640. + a.cos() * d * 1.4, 300. + a.sin() * d);
                let pts = (0..4u32).map(|j| { let b = TAU * j as f32 / 4. + rnd(j + k * 4, 95); (b.cos() * s * lerp(0.5, 1., rnd(j + k * 4, 96)), b.sin() * s * lerp(0.4, 1., rnd(j + k * 4, 97))) }).collect::<Vec<_>>();
                Some(fframes::svgr!(
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({:.0})", 400. * dt * lerp(-1., 1., rnd(k, 98)))} opacity={1. - dt / 0.9}>
                        <path d={path(&pts, true)} fill="#dff2ff" opacity="0.75" stroke="#ffffff" stroke-width="2" />
                    </g>
                ))
            })
            .collect::<Vec<_>>();
        let snow = Motes { count: 46, seed: 2301, area: (0., 0., 1280., 760.), rise: -320., period: LOOP, size: (1., 2.6), sway: 30., fill: "#f4f8ff" };
        fframes::svgr!(
            <g>
                {above}
                {under}
                {shards}
                {snow.draw(t, 0.7 * r)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Giant

const STEPS: [f32; 2] = [0.9, 2.5];
const STRIDE: [(f32, f32); 3] = [(470., 520.), (575., 500.), (680., 485.)];
const WISP_AT: f32 = 1.4;
const WISP_END: f32 = 3.6;
const WISP_PATH: [(f32, f32); 4] = [(720., 450.), (820., 290.), (1000., 360.), (1146., 160.)];

fn bezier(p: &[(f32, f32); 4], u: f32) -> (f32, f32) {
    let v = 1. - u;
    let (a, b, c, d) = (v * v * v, 3. * v * v * u, 3. * v * u * u, u * u * u);
    (a * p[0].0 + b * p[1].0 + c * p[2].0 + d * p[3].0, a * p[0].1 + b * p[1].1 + c * p[2].1 + d * p[3].1)
}

#[derive(Debug)]
pub struct Giant {
    sh: Shaders,
    cam: Cam,
    wisp: Anim,
}

impl Giant {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0.5, 4.7, (640., 520., 1.55), (1062., 312., 1.55))]),
            wisp: tw(WISP_AT + 0.25, WISP_END, 0., 1., Easing::EaseInOut),
        }
    }
}

/// The feet of the Colossus on the map: they move only during a step.
fn stride(t: f32) -> (f32, f32) {
    let k0 = ease_out(after(t, STEPS[0] - 0.5, 0.55));
    let k1 = ease_out(after(t, STEPS[1] - 0.5, 0.55));
    let a = (lerp(STRIDE[0].0, STRIDE[1].0, k0), lerp(STRIDE[0].1, STRIDE[1].1, k0));
    (lerp(a.0, STRIDE[2].0, k1), lerp(a.1, STRIDE[2].1, k1))
}

impl Scene for Giant {
    fn name(&self) -> &'static str {
        "OpeningGiant"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(map), Some(colossus)) = (ctx.get_image(MAP), ctx.get_image("cut-mountain-colossus.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let (kx, ky) = shake(t, STEPS[0], 7.);
        let (kx2, ky2) = shake(t, STEPS[1], 7.);
        let feet = stride(t);
        // The shadow of the Colossus falls to the lower right of the light.
        let breathe = 1. + 0.015 * wave(t, 1., 0.);
        let shadow = fframes::svgr!(
            <g transform={format!("matrix(1 0 {:.3} {:.3} {:.1} {:.1})", -0.75, -0.42 * breathe, feet.0, feet.1)} opacity={0.66 + 0.04 * wave(t, 1., 0.2)}>
                <image href={colossus.href()} x="-165" y="-420" width="327" height="420" filter="url(#hm-shadow)" />
            </g>
        );
        let rings = STEPS
            .iter()
            .enumerate()
            .map(|(i, &at)| {
                let (x, y) = STRIDE[i + 1];
                let dt = t - at;
                let hold = (loop_phase(t * 2. + i as f32 * 0.5) * 1.).rem_euclid(1.);
                fframes::svgr!(
                    <g>
                        <g opacity="0.45">{shock_ring(x, y, dt, 1.4, 120., 34., "#cfeaf0")}</g>
                        <g opacity="0.3">{shock_ring(x, y, dt - 0.2, 1.4, 80., 22., "#bfe6ff")}</g>
                        {puff(x + 40. * ease_out(after(dt, 0., 1.5)), y - 10., 60. + 60. * after(dt, 0., 1.5), 18. + 14. * after(dt, 0., 1.5), 0.6 * (1. - after(dt, 0.3, 1.4)) * after(dt, 0., 0.1), "url(#hm-mist)")}
                        <g opacity={after(t, at, 0.5) * 0.5}>
                            <ellipse cx={x} cy={y} rx={10. + 60. * hold} ry={3. + 16. * hold} fill="none" stroke="#e8f6ff" stroke-width="2" opacity={1. - hold} />
                        </g>
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // A wisp of ice-blue light wakes in the reeds and flies to Marrow Castle.
        let w = frame.animate(&self.wisp);
        let born = after(t, WISP_AT, 0.4);
        let head = bezier(&WISP_PATH, w);
        let trail = (1..14).map(|k| bezier(&WISP_PATH, (w - k as f32 * 0.018).max(0.))).collect::<Vec<_>>();
        let arrived = after(t, WISP_END - 0.1, 0.2);
        let wisp_glow = fframes::svgr!(<circle cx={head.0} cy={head.1} r="70" fill="url(#hm-wisp)" opacity={0.5 * born * (1. - arrived)} />);
        let wisp_layer = wisp(head.0, head.1 + 6. * wave(t, 2., 0.), 22. + 12. * (1. - born), t, &trail, born * (1. - arrived));
        let windows = WINDOWS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let k = bloom_flare(t - WISP_END - 0.12 * i as f32);
                let f = 0.85 + 0.15 * wave(t, 2., i as f32 * 0.2);
                fframes::svgr!(<circle cx={x} cy={y} r={10. + 16. * k} fill="url(#hm-eye)" opacity={0.3 + 0.55 * k.min(1.) * f} />)
            })
            .collect::<Vec<_>>();
        let alarm = after(t, WISP_END, 0.3) * (1. - after(t, WISP_END + 0.3, 1.2));
        let bell = fframes::svgr!(<circle cx="1146" cy="140" r={60. + 220. * after(t, WISP_END, 1.5)} fill="url(#hm-eye)" opacity={0.6 * alarm} />);
        let fog = Fog { density: 0.42, soft: 0.32, light: Color::hex("#eef6ff"), shade: Color::hex("#9ab4cc"), dir: (0.4, -0.05), scale: 1.4, seed: 23.0 };
        // A stone foot of the Colossus steps through the foreground, out of focus.
        let (fx_, _) = project(cam, (640., 520.));
        let foot_x = 1.8 * (fx_ - 640.) - 40.;
        let foot_y = 40. * (1. - ease_out(after(t, STEPS[0] - 0.4, 0.45)));
        let foot = fframes::svgr!(
            <g transform={format!("translate({foot_x:.1} {foot_y:.1})")} filter="url(#blur8)">
                <image href={colossus.href()} x="-420" y="-40" width="700" height="900" filter="url(#hm-fg)" />
            </g>
        );
        let dust = Motes { count: 36, seed: 2401, area: (0., 60., 1280., 700.), rise: 120., period: LOOP, size: (1., 2.4), sway: 30., fill: "url(#hm-ice-glow)" };
        fframes::svgr!(
            <g>
                <g transform={format!("translate({:.1} {:.1})", kx + kx2, ky + ky2)}>
                    <g transform={cam_transform(cam, (0., 0.))}>
                        {painting(&self.sh, &frame, map, Grade { gold: 0.25, dusk: 0.12, ..Default::default() })}
                        {shadow}
                        {rings}
                        {windows}
                        {bell}
                        {wisp_glow}
                        {wisp_layer}
                    </g>
                    <rect width="1280" height="720" fill="#9ab8d8" opacity="0.06" />
                    {fog.draw(&self.sh, &frame, 0.38 + 0.06 * wave(t, 1., 0.3), (-40., 420., 1360., 320.))}
                    {foot}
                </g>
                {rays(&self.sh, &frame, (-160., -140.), 0.55, 1.2, SUN)}
                {dust.draw(t, 0.6)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Crossings

const BRIDGE_CAM: (f32, f32, f32) = (1116., 402., 2.4);
const REFUSE_AT: f32 = 0.85;
const TURN_AT: f32 = 1.4;
const FOCUS_AT: f32 = 1.9;
const FLARE_AT: [f32; 2] = [2.5, 2.75];
const CHAIN_AT: f32 = 3.05;
const WATER: f32 = 440.;

#[derive(Debug)]
pub struct Crossings {
    sh: Shaders,
    refuse: Anim,
    turn: Anim,
    focus: Anim,
    chains: Anim,
}

impl Crossings {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            refuse: spring(REFUSE_AT, 0., 1., SOFT),
            turn: tw(TURN_AT, 4.6, 0., 1., Easing::EaseInOut),
            focus: tw(FOCUS_AT, 2.7, 0., 1., Easing::EaseInOut),
            chains: spring(CHAIN_AT, 0., 1., HEAVY),
        }
    }
}

/// A hanging chain between two posts, with sag, `lift` pixels above its rest.
fn hang(a: (f32, f32), b: (f32, f32), sag: f32, drop: f32, sway: f32) -> Vec<(f32, f32)> {
    (0..=16)
        .map(|k| {
            let u = k as f32 / 16.;
            (lerp(a.0, b.0, u) + sway * (PI * u).sin(), lerp(a.1, b.1, u) + sag * 4. * u * (1. - u) + drop)
        })
        .collect()
}

impl Scene for Crossings {
    fn name(&self) -> &'static str {
        "OpeningCrossings"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image(MAP) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let focus = frame.animate(&self.focus);
        let drift = 0.04 * wave(t, 1., 0.);
        let cam = (BRIDGE_CAM.0, BRIDGE_CAM.1, BRIDGE_CAM.2 + drift * 0.2);
        // The green bowls flare one after another.
        let bowls = BOWLS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let k = bloom_flare(t - FLARE_AT[i]);
                let f = flicker(t, x * 0.01);
                let flames = fframes::svgr!(
                    <g transform={format!("translate({x:.1} {:.1})", y - 2.)}>
                        <g filter="url(#blur3)" opacity="0.8">{green_flame(16. + 26. * k, t, x * 0.01)}</g>
                        {green_flame(12. + 20. * k, t, x * 0.01 + 0.3)}
                    </g>
                );
                fframes::svgr!(
                    <g>
                        <circle cx={x} cy={y - 10.} r={18. + 34. * k + 5. * f} fill="url(#g-witch)" opacity={0.45 + 0.45 * k.min(1.)} />
                        {flames}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // Heavy chains rise out of the water across the bridge, dripping.
        let rise = frame.animate(&self.chains);
        let drop = 80. * (1. - rise);
        let sway = 2. * wave(t, 1., 0.4);
        let c1 = hang((1062., 392.), (1170., 394.), 22., drop, sway);
        let c2 = hang((1052., 410.), (1180., 412.), 30., drop * 1.1, -sway);
        let drips = (0..8u32)
            .map(|k| {
                let u = (loop_phase(t) * 2. + rnd(k, 51)).rem_euclid(1.);
                let x = lerp(1068., 1164., rnd(k, 52));
                let y0 = 412. + 22. * (1. - ((x - 1116.) / 60.).powi(2)).max(0.) + drop;
                let y = y0 + 40. * u * u;
                let o = (1. - u) * after(t, CHAIN_AT + 0.3, 0.4);
                fframes::svgr!(<circle cx={x} cy={y} r="1.3" fill="#dff2ff" opacity={o} />)
            })
            .collect::<Vec<_>>();
        let splash = (0..2)
            .map(|k| burst(1116. + (k as f32 - 0.5) * 70., WATER - 6., t - CHAIN_AT - 0.12, 0.9, 14, 530 + k as u32, 140., "#e8f6ff"))
            .collect::<Vec<_>>();
        let chains = fframes::svgr!(
            <g>
                <defs><clipPath id="hm-above-water"><rect x="900" y="0" width="500" height={WATER} /></clipPath></defs>
                <g clip-path="url(#hm-above-water)">
                    {chain(&c2, 10., 0.7)}
                    {chain(&c1, 10., 0.7)}
                </g>
                {drips}
                {splash}
                {shock_ring(1116., WATER, t - CHAIN_AT - 0.1, 1.2, 90., 16., "#e8f6ff")}
            </g>
        );
        let motes = Motes { count: 26, seed: 2601, area: (980., 250., 280., 150.), rise: 110., period: LOOP, size: (0.8, 1.8), sway: 8., fill: "#9affb8" };
        let fog = Fog { density: 0.5, soft: 0.3, light: Color::hex("#e6f6f0"), shade: Color::hex("#88a8a8"), dir: (0.3, -0.25), scale: 1.6, seed: 61.0 };
        let curtain = after(t, CHAIN_AT, 1.4);
        let _ = &fog;
        let curtain_puffs = (0..12u32)
            .map(|k| {
                let x = 990. + 22. * k as f32 + 6. * wave(t, 1., rnd(k, 71));
                let y = lerp(400., 335., ease_out(curtain)) - 18. * rnd(k, 72) + 4. * wave(t, 1., rnd(k, 73));
                puff(x, y, 46., 24., 0.55 * curtain * lerp(0.6, 1., rnd(k, 74)), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let bg_blur = lerp(7., 0., focus);
        let back = fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {painting(&self.sh, &frame, map, Grade { gold: 0.15, dusk: 0.22, dark: 0.08, ..Default::default() })}
                    {curtain_puffs}
                    {bowls}
                    {chains}
                    {motes.draw(t, 0.8)}
                </g>
                <rect width="1280" height="720" fill="#0a1a20" opacity="0.12" />
            </g>
        );
        let back = if bg_blur > 0.15 {
            fframes::svgr!(
                <g>
                    <defs><filter id="hm-rack-bg" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1480" height="920"><feGaussianBlur stdDeviation={bg_blur} /></filter></defs>
                    <g filter="url(#hm-rack-bg)">{back}</g>
                </g>
            )
        } else {
            back
        };
        // The Bone Ferry turns away from you.
        let refuse = frame.animate(&self.refuse);
        let turn = frame.animate(&self.turn);
        let fg_blur = lerp(0., 6., focus);
        let ferry_g = fframes::svgr!(
            <g transform={format!("translate({:.1} {:.1}) scale({:.3} {:.3}) rotate({:.2})", 340. - 190. * turn, 712. + 6. * wave(t, 1., 0.3), 0.82 - 0.16 * turn, 0.82 - 0.06 * turn, -2. * turn)}>
                {ferry(t, refuse * (1. - 0.4 * turn), 0.9)}
            </g>
        );
        let front = if fg_blur > 0.15 {
            fframes::svgr!(
                <g>
                    <defs><filter id="hm-rack-fg" filterUnits="userSpaceOnUse" x="-200" y="-100" width="1680" height="920"><feGaussianBlur stdDeviation={fg_blur} /></filter></defs>
                    <g filter="url(#hm-rack-fg)">{ferry_g}</g>
                </g>
            )
        } else {
            ferry_g
        };
        let wake = (0..3)
            .map(|k| {
                let u = (loop_phase(t) + k as f32 / 3.).rem_euclid(1.);
                fframes::svgr!(<ellipse cx={300. - 160. * turn} cy="712" rx={160. + 260. * u} ry={14. + 22. * u} fill="none" stroke="#cfeaf0" stroke-width="2" opacity={0.4 * (1. - u)} />)
            })
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g>
                {back}
                <rect y="420" width="1280" height="300" fill="url(#g-bottom-shade)" opacity="0.7" />
                {wake}
                {front}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Road

const FIRE_AT: f32 = 0.35;
const FIRE_END: f32 = 3.9;
const GATE_AT: f32 = 4.0;

#[derive(Debug)]
pub struct Road {
    sh: Shaders,
    head: Anim,
    zoom: Anim,
    doors: Anim,
}

impl Road {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            head: tw(FIRE_AT, FIRE_END, 0., 1., Easing::EaseInOut),
            zoom: keys(&[(0., 3.4, 1.45, 1.45, Easing::Linear), (3.4, 4.8, 1.45, 2.3, Easing::EaseInOut)]),
            doors: tw(GATE_AT, GATE_AT + 0.7, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Road {
    fn name(&self) -> &'static str {
        "OpeningRoad"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image(MAP) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let track = Track::new(TRAIL.to_vec());
        let u = frame.animate(&self.head);
        let z = frame.animate(&self.zoom);
        // The camera tracks a point just behind the fire, inside the painting.
        let lead = track.at((u - 0.03).max(0.));
        let gate_k = after(t, 3.4, 1.4);
        let target = (lerp(lead.0, GATE.0, gate_k * gate_k), lerp(lead.1, GATE.1 + 40., gate_k * gate_k));
        let (hw, hh) = (800. / z, 450. / z);
        let cam = (target.0.clamp(hw, 1600. - hw), target.1.clamp(hh, 900. - hh), z);
        let samples = 240;
        let pts = (0..=samples)
            .map(|i| i as f32 / samples as f32)
            .take_while(|&v| v <= u)
            .map(|v| track.at(v))
            .collect::<Vec<_>>();
        let line = if pts.len() > 1 {
            let d = path(&pts, false);
            let flow = loop_phase(t);
            fframes::svgr!(
                <g>
                    <path d={d.clone()} stroke="#3aff7a" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.35" filter="url(#blur8)" />
                    <path d={d.clone()} stroke="#5aff8a" stroke-width="4" fill="none" stroke-linecap="round" />
                    <path d={d} stroke="#eafff0" stroke-width="2" fill="none" stroke-dasharray="6 40" stroke-dashoffset={-46. * flow * 2.} opacity="0.8" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let head = track.at(u);
        let head_glow = if u < 0.999 && t > FIRE_AT {
            fframes::svgr!(<g><circle cx={head.0} cy={head.1} r="40" fill="url(#g-witch)" /><circle cx={head.0} cy={head.1} r="5" fill="#ffffff" /></g>)
        } else {
            Svgr::empty()
        };
        // Each clearing lights with a ring of green flames as the fire passes.
        let fraction = |p: (f32, f32)| {
            let mut best = (0, f32::MAX);
            for (i, q) in TRAIL.iter().enumerate() {
                let d = (q.0 - p.0).powi(2) + (q.1 - p.1).powi(2);
                if d < best.1 {
                    best = (i, d);
                }
            }
            track.lengths[best.0] / track.total()
        };
        let rings = STOPS
            .iter()
            .enumerate()
            .map(|(k, &(x, y))| {
                let at = FIRE_AT + (FIRE_END - FIRE_AT) * {
                    // Invert the ease of the head: the time at which it reaches the stop.
                    let f = fraction((x, y));
                    let mut lo = 0f32;
                    let mut hi = 1f32;
                    for _ in 0..20 {
                        let mid = (lo + hi) / 2.;
                        let e = if mid < 0.5 { 2. * mid * mid } else { 1. - (-2. * mid + 2.).powi(2) / 2. };
                        if e < f { lo = mid } else { hi = mid }
                    }
                    lo
                };
                let k_on = bloom_flare(t - at);
                if k_on <= 0. {
                    return Svgr::empty();
                }
                let breath = 0.9 + 0.1 * wave(t, 1., k as f32 * 0.17);
                let flames = (0..12)
                    .map(|j| {
                        let a = TAU * j as f32 / 12.;
                        let (fx, fy) = (x + a.cos() * 44., y + a.sin() * 19.);
                        fframes::svgr!(<g transform={format!("translate({fx:.1} {fy:.1})")}>{green_flame(9. * k_on.min(1.2) * breath, t, k as f32 + j as f32 * 0.3)}</g>)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g>
                        <ellipse cx={x} cy={y} rx={60. * k_on.min(1.1)} ry={28. * k_on.min(1.1)} fill="url(#g-witch)" opacity={0.5 * breath} />
                        {shock_ring(x, y, t - at, 0.8, 70., 30., "#9affb8")}
                        {flames}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The mist pulls back from the road in front of the fire.
        let mist = (0..34u32)
            .map(|k| {
                let v = (k as f32 + 0.5) / 34.;
                let p = track.at(v);
                let q = track.at((v + 0.01).min(1.));
                let (dx, dy) = (q.0 - p.0, q.1 - p.1);
                let l = (dx * dx + dy * dy).sqrt().max(0.01);
                let side = if k % 2 == 0 { 1. } else { -1. };
                let gone = ease_out(((u - v + 0.04) / 0.12).clamp(0., 1.));
                let (nx, ny) = (-dy / l * side, dx / l * side);
                let drift = 6. * wave(t, 1., rnd(k, 41));
                puff(p.0 + nx * (20. + 90. * gone) + drift, p.1 + ny * (12. + 50. * gone), 70., 26., lerp(0.55, 0.12, gone), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        // The gate of Marrow Castle opens; light spills down, and a tall shadow waits.
        let doors = frame.animate(&self.doors);
        let gate = {
            let (x, y) = GATE;
            let glow = after(t, GATE_AT, 0.6) * (0.9 + 0.1 * wave(t, 1., 0.2));
            let leaf = |side: f32| {
                let w = 15. * (1. - 0.82 * doors);
                let x0 = x + side * 15.;
                let d = format!("M{x0:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{x0:.1} {:.1}Z", y + 20., x0 - side * w, y + 20., x0 - side * w, y - 16. + 4. * (1. - doors), y - 22.);
                fframes::svgr!(<path d={d} fill="#2a1a14" stroke="#0a0604" stroke-width="1.2" />)
            };
            let queen_k = after(t, GATE_AT + 0.4, 0.6);
            fframes::svgr!(
                <g>
                    <path d={format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z", x - 14., y + 20., x + 14., y + 20., x + 34., y + 70., x - 34., y + 70.)} fill="#9affc0" opacity={0.3 * glow} filter="url(#blur3)" />
                    <rect x={x - 15.} y={y - 22.} width="30" height="42" fill="#bfffd8" opacity={0.8 * glow} />
                    <circle cx={x} cy={y} r={40. + 6. * wave(t, 1., 0.)} fill="url(#hm-eye)" opacity={0.6 * glow} />
                    <g opacity={queen_k}>
                        <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {x:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}Z", x - 6., y + 20., x - 4., y, x - 3., y - 10., y - 17., x + 3., y - 10., x + 4., y, x + 6., y + 20.)} fill="#1a0a24" />
                        <circle cx={x - 1.1} cy={y - 13.} r="0.8" fill="#bfffd0" />
                        <circle cx={x + 1.1} cy={y - 13.} r="0.8" fill="#bfffd0" />
                        <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", x + 2., y + 20., x + 14., y + 66.)} stroke="#1a0a24" stroke-width="5" opacity="0.4" filter="url(#blur3)" />
                    </g>
                    {leaf(-1.)}
                    {leaf(1.)}
                </g>
            )
        };
        let windows = WINDOWS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| fframes::svgr!(<circle cx={x} cy={y} r="18" fill="url(#hm-eye)" opacity={0.45 + 0.1 * wave(t, 1., i as f32 * 0.21)} />))
            .collect::<Vec<_>>();
        let motes = Motes { count: 34, seed: 2701, area: (0., 100., 1280., 620.), rise: 160., period: LOOP, size: (0.8, 2.), sway: 20., fill: "#9affb8" };
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {painting(&self.sh, &frame, map, Grade { gold: 0.1, dusk: 0.32, dark: 0.12, ..Default::default() })}
                    {mist}
                    {line}
                    {rings}
                    {windows}
                    {gate}
                    {head_glow}
                </g>
                <rect width="1280" height="720" fill="#1a2a3a" opacity="0.08" />
                {motes.draw(t, 0.6)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.75" />
            </g>
        )
    }
}
