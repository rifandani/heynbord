//! Boss: the bored queen, the accusation, the proof that makes it worse,
//! someone spent her coin, the challenge.
use crate::cutouts::*;
use crate::fx::*;
use crate::marsh::*;
use crate::mesa::{after, debris, dust_burst, ease_out, flash, punch, shock_ring};
use crate::wood::bone_coin;
use crate::CLIP_FRAMES;
use fframes::{Duration, FFramesContext, Frame, Scene, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

/// The hall of Marrow Castle in hall space (1280 x 720 at scale 1), seen from
/// the door: scale `s` about the throne and a sideways shift `dx`.
pub fn hall_t(s: f32, dx: f32) -> String {
    format!("translate({:.1} 330) scale({s:.4}) translate(-640 -330)", 640. + dx)
}

/// The back of the hall: bone walls, the tall window with the Colossus outside,
/// two green side windows, violet banners and the floor. `curtain` slides a
/// curtain of mist across the window; `dawn` warms the light after the Battle.
pub fn hall<'a>(sh: &Shaders, ms: &MarshShaders, frame: &Frame, ctx: &FFramesContext<'a, '_>, t: f32, s: f32, dx: f32, curtain: f32, dawn: f32) -> Svgr<'a> {
    let light = (lerp(0.86, 1.0, dawn), lerp(0.86, 0.9, dawn), lerp(0.92, 0.8, dawn));
    let shade = (0.22, 0.18, 0.3);
    let wall = bone_wall(ms, frame, (-dx / s, 0.), s, light, shade, 0.06);
    let win = (640. + dx, 330. + (240. - 330.) * s);
    let colossus = ctx
        .get_image("cut-mountain-colossus.png")
        .map(|img| figure(img, MOUNTAIN_COLOSSUS, 700., 690. + 3. * wave(t, 1., 0.1), 560., false, "url(#hm-dark)", 0.85))
        .unwrap_or_default();
    let mist = (0..8u32)
        .map(|k| {
            let base = lerp(400., 900., rnd(k, 11));
            let x = base + lerp(-520., 520., curtain) + 30. * wave(t, 1., rnd(k, 12));
            let y = lerp(80., 460., rnd(k, 13));
            puff(x, y, 120., 60., 0.55, "url(#hm-mist)")
        })
        .collect::<Vec<_>>();
    let sky = if dawn > 0.5 { "url(#hm-glass)" } else { "url(#hm-window-sky)" };
    let banner = |x: f32, seed: f32| {
        let sway = 6. * wave(t, 1., seed);
        let d = format!("M{:.1} 70 L{:.1} 70 L{:.1} 300 L{x:.1} {:.1} L{:.1} 300Z", x - 38., x + 38., x + 38. + sway, 270. + sway * 0.3, x - 38. + sway);
        fframes::svgr!(
            <g>
                <path d={d} fill="url(#hm-robe)" stroke="#12061c" stroke-width="2" />
                <path d={format!("M{x:.1} 300 L{:.1} 270 L{x:.1} 300 L{:.1} 270Z", x - 38. + sway, x + 38. + sway)} fill="#05020a" opacity="0.3" />
                <path d={format!("M{:.1} 170 L{:.1} 132 L{:.1} 156 L{x:.1} 118 L{:.1} 156 L{:.1} 132 L{:.1} 170Z", x - 20., x - 20., x - 10., x + 10., x + 20., x + 20.)} fill="#e8dcc4" opacity="0.85" />
                <circle cx={x} cy="186" r="5" fill="#7aff9e" opacity="0.8" />
                {bone((x - 48., 66.), (x + 48., 66.), 9.)}
            </g>
        )
    };
    let side = |x: f32, k: f32| {
        let glow = 0.75 + 0.25 * wave(t, 1., k);
        fframes::svgr!(
            <g>
                <path d={lancet(x, 430., 110., 300.)} fill="#9affc0" opacity={0.55 * glow} />
                <path d={lancet(x, 430., 110., 300.)} fill="url(#hm-side-glass)" />
                <path d={format!("M{x:.1} 140 L{x:.1} 430 M{:.1} 300 L{:.1} 300", x - 55., x + 55.)} stroke="#1a1424" stroke-width="5" />
                <path d={lancet(x, 430., 110., 300.)} fill="none" stroke="#efe4cc" stroke-width="7" />
                <ellipse cx={x} cy="300" rx="150" ry="190" fill="url(#hm-eye)" opacity={0.18 * glow} />
            </g>
        )
    };
    let window = lancet(640., 480., 240., 470.);
    fframes::svgr!(
        <g>
            {wall}
            <g transform={hall_t(s, dx)}>
                <defs><clipPath id="hm-window"><path d={window.clone()} /></clipPath></defs>
                <g clip-path="url(#hm-window)">
                    <rect x="500" y="0" width="280" height="500" fill={sky} />
                    <ellipse cx="560" cy="120" rx="160" ry="120" fill="url(#hm-gold-glow)" opacity={0.25 + 0.6 * dawn} />
                    <g filter="url(#blur3)">{colossus}</g>
                    {mist}
                </g>
                <path d="M640 10 L640 480 M520 200 L760 200 M520 340 L760 340" stroke="#1a1424" stroke-width="6" />
                <path d={window} fill="none" stroke="#efe4cc" stroke-width="10" />
                {side(330., 0.1)}
                {side(950., 0.6)}
                {banner(470., 0.2)}
                {banner(810., 0.7)}
                <rect x="-1400" y="520" width="4080" height="900" fill="url(#hm-floor)" />
                <ellipse cx="640" cy="560" rx="260" ry="40" fill="#e8f6ff" opacity={0.12 + 0.1 * dawn} />
                <path d="M600 520 L680 520 L760 900 L520 900Z" fill="#dff2ff" opacity={0.1 + 0.08 * dawn} filter="url(#blur8u)" />
                <rect x="-640" y="-360" width="2560" height="1440" fill="url(#hm-hall-light)" />
            </g>
            {rays(sh, frame, win, 0.4 + 0.25 * dawn, 0.85, if dawn > 0.5 { DAWN } else { (0.78, 0.92, 1.0) })}
        </g>
    )
}

/// The Queen on her throne in hall space: her mask at (640, 300), scale 0.55.
fn seated<'a>(p: &Queen, t: f32, x: f32, y: f32, s: f32) -> Svgr<'a> {
    fframes::svgr!(
        <g transform={format!("translate({x:.1} {y:.1}) scale({s:.3})")}>
            <ellipse cx="0" cy="430" rx="260" ry="40" fill="#08040e" opacity="0.5" filter="url(#blur8)" />
            {throne()}
            {queen(p, t)}
        </g>
    )
}

/// The floor mist of the hall that flows toward the camera.
fn floor_mist<'a>(t: f32, y: f32, alpha: f32, seed: u32) -> Svgr<'a> {
    let puffs = (0..16u32)
        .map(|k| {
            let u = (loop_phase(t) + rnd(k, seed)).rem_euclid(1.);
            let x = lerp(-100., 1380., rnd(k, seed + 1)) + 40. * (TAU * u).sin();
            let yy = y + 140. * u;
            puff(x, yy, 160. + 160. * u, 30. + 30. * u, alpha * (PI * u).sin(), "url(#hm-mist)")
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{puffs}</g>)
}

// ---------------------------------------------------------------- 1. Hall

const NAME: &str = "QUEEN MARROW";
const FLY_AT: f32 = 0.6;
const FLY_END: f32 = 4.2;
const PLATE_AT: f32 = 3.4;
/// The depths of the ribs; the back wall is at depth 4.6.
const RIBS: [f32; 7] = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.6];
const WALL: f32 = 4.6;

#[derive(Debug)]
pub struct Hall {
    sh: Shaders,
    ms: MarshShaders,
    fly: Anim,
    plate: Anim,
}

impl Hall {
    pub fn new(_sh: Shaders, ms: MarshShaders) -> Self {
        Self { sh: _sh, ms, fly: tw(FLY_AT, FLY_END, 0., 3.0, Easing::EaseInOut), plate: tw(PLATE_AT, PLATE_AT + 1.2, 0., 1., Easing::EaseOut) }
    }
}

impl Scene for Hall {
    fn name(&self) -> &'static str {
        "BossHall"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let z = frame.animate(&self.fly) + 0.012 * wave(t, 1., 0.);
        let f = (WALL - 3.0) * 1.55;
        let scale = |d: f32| f / (d - z);
        let s_wall = scale(WALL);
        let back = hall(&self.sh, &self.ms, &frame, ctx, t, s_wall, 0., 0.5 + 0.08 * wave(t, 1., 0.3), 0.);
        let queen_k = Queen::bored(t);
        let throne_q = fframes::svgr!(<g transform={hall_t(s_wall, 0.)}>{seated(&queen_k, t, 640., 300., 0.55)}</g>);
        // The ribs of the hall pass the camera one after another.
        let ribs = RIBS
            .iter()
            .rev()
            .filter_map(|&d| {
                let gap = d - z;
                if gap < 0.12 {
                    return None;
                }
                let s = f / gap;
                let near = smoothstep(4.5, 2.6, s);
                let shade = smoothstep(0.6, 2.5, s);
                Some(fframes::svgr!(
                    <g transform={format!("translate(640 330) scale({s:.4}) translate(-640 -330)")} opacity={near}>
                        {rib(640., 560., 560., 700., 90., shade)}
                    </g>
                ))
            })
            .collect::<Vec<_>>();
        let floor_y = 330. + 230. * s_wall;
        let motes = Motes { count: 34, seed: 3101, area: (420., 60., 440., 520.), rise: 140., period: LOOP, size: (0.8, 2.), sway: 20., fill: "url(#hm-ice-glow)" };
        let plate_k = frame.animate(&self.plate);
        let plate = if plate_k > 0. { bone_plate(&mut frame, ctx, 640., 96., NAME, plate_k, t) } else { Svgr::empty() };
        fframes::svgr!(
            <g>
                {back}
                {throne_q}
                <rect x="0" y={floor_y} width="1280" height={(720. - floor_y).max(0.)} fill="#0a0612" opacity="0.25" />
                {floor_mist(t, floor_y - 10., 0.5, 3111)}
                {motes.draw(t, 0.6)}
                {ribs}
                <rect width="1280" height="720" fill="url(#hm-hall-vignette)" />
                <rect width="1280" height="260" fill="url(#hm-top-calm)" opacity={0.8 * plate_k} />
                {plate}
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Accusation

const LEAN_AT: f32 = 0.7;
const FLARE_AT: f32 = 1.5;

#[derive(Debug)]
pub struct Accusation {
    sh: Shaders,
    ms: MarshShaders,
    arc: Anim,
    lean: Anim,
    flare: Anim,
    curtain: Anim,
}

impl Accusation {
    pub fn new(_sh: Shaders, ms: MarshShaders) -> Self {
        Self {
            sh: _sh,
            ms,
            arc: tw(0.5, 4.8, -1., 1., Easing::EaseInOut),
            lean: spring(LEAN_AT, 0., 1., HEAVY),
            flare: keys(&[(FLARE_AT, FLARE_AT + 0.2, 0., 1., Easing::EaseOut), (FLARE_AT + 0.2, 3.4, 1., 0.45, Easing::EaseInOut)]),
            curtain: tw(1.0, 4.4, 0., 1., Easing::EaseInOut),
        }
    }
}

impl Scene for Accusation {
    fn name(&self) -> &'static str {
        "BossAccusation"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let arc = frame.animate(&self.arc) + 0.03 * wave(t, 1., 0.);
        let lean = frame.animate(&self.lean);
        let flare = frame.animate(&self.flare);
        // The curtain crosses the window, then breathes: the Colossus shows again.
        let curtain = frame.animate(&self.curtain) * 0.85 + 0.08 * wave(t, 1., 0.2);
        let back = hall(&self.sh, &self.ms, &frame, ctx, t, 1.9, 380. - 160. * arc, curtain, 0.);
        let mut p = Queen::throne(t);
        p.head = (0., 14. * lean);
        p.tilt = 4. * lean;
        p.glow = 0.9 + 1.2 * flare;
        p.eyes = 1. - 0.2 * flare;
        let qx = 760. + 70. * arc;
        let qs = 1.05 + 0.08 * lean;
        let flare_ring = fframes::svgr!(
            <g transform={format!("translate({qx:.1} {:.1}) scale({qs:.3})", 230. + 10. * lean)}>
                <circle cx="-17" cy="-4" r={30. + 160. * after(t, FLARE_AT, 0.6)} fill="url(#hm-eye)" opacity={0.6 * (1. - after(t, FLARE_AT, 0.6))} />
                <circle cx="17" cy="-4" r={30. + 160. * after(t, FLARE_AT, 0.6)} fill="url(#hm-eye)" opacity={0.6 * (1. - after(t, FLARE_AT, 0.6))} />
            </g>
        );
        let frost = Motes { count: 40, seed: 3201, area: (0., 0., 1280., 720.), rise: -140., period: LOOP, size: (0.8, 2.2), sway: 30., fill: "url(#hm-ice-glow)" };
        let fg_rib = fframes::svgr!(
            <g transform={format!("translate({:.1} 0)", -260. * arc)} filter="url(#blur8)" opacity="0.92">
                {rib(-120., 900., 380., 1200., 90., 1.)}
            </g>
        );
        fframes::svgr!(
            <g>
                {back}
                <g transform={format!("translate({qx:.1} {:.1}) scale({qs:.3})", 230. + 10. * lean)}>
                    <ellipse cx="0" cy="430" rx="260" ry="40" fill="#08040e" opacity="0.5" filter="url(#blur8)" />
                    {throne()}
                    {queen(&p, t)}
                </g>
                {flare_ring}
                <rect width="1280" height="720" fill="#14301c" opacity={0.12 * flare} />
                {frost.draw(t, 0.6)}
                {fg_rib}
                <rect width="1280" height="720" fill="url(#hm-hall-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Proof

const DROP_AT: f32 = 0.25;
const LAND_AT: f32 = 0.85;
const RECOIL_AT: f32 = 1.5;
const LAUGH_AT: f32 = 2.4;
/// (x, y) of each coin of bone on the floor, in hall space.
const COINS: [(f32, f32); 7] = [(600., 650.), (680., 640.), (640., 672.), (560., 676.), (724., 678.), (650., 628.), (520., 650.)];
/// (cut-out, x, height) of the court in a row behind the coins.
const COURT: [(&str, f32, f32); 4] = [("lantern-widow", 210., 330.), ("hushbow", 430., 320.), ("coffin-lancer", 850., 320.), ("chattering-cohort", 1080., 270.)];

fn court_size(name: &str) -> (f32, f32) {
    match name {
        "lantern-widow" => LANTERN_WIDOW,
        "hushbow" => HUSHBOW,
        "coffin-lancer" => COFFIN_LANCER,
        _ => CHATTERING_COHORT,
    }
}

/// The court in a row on the floor of the hall at `floor`; `recoil` steps back,
/// `bow` bows and lowers the weapons. `filter` re-lights them.
pub fn court<'a>(ctx: &FFramesContext<'a, '_>, t: f32, floor: f32, recoil: &[f32; 4], bow: &[f32; 4], filter: &'static str) -> Svgr<'a> {
    let figures = COURT
        .iter()
        .enumerate()
        .map(|(i, &(name, x, h))| {
            let Some(img) = ctx.get_image(&format!("cut-{name}.png")) else {
                return Svgr::empty();
            };
            let r = recoil[i];
            let b = bow[i];
            let side = if x < 640. { -1. } else { 1. };
            let sway = 1.5 * wave(t, 1., i as f32 * 0.23);
            let lift = 6. * r;
            let lean = -5. * r * side + 8. * b * -side + sway * 0.3;
            let flip = x > 640.;
            let lantern = if name == "lantern-widow" {
                let f = 0.8 + 0.2 * flicker(t, 0.3);
                fframes::svgr!(<circle cx={x + h * 0.27} cy={floor - h * 0.8} r={70. * f} fill="url(#hm-wisp)" opacity={0.55 * f} />)
            } else {
                Svgr::empty()
            };
            fframes::svgr!(
                <g transform={format!("translate({:.1} {:.1}) rotate({lean:.2} {x:.1} {floor:.1})", 10. * r * side, -lift + 6. * b)}>
                    <ellipse cx={x} cy={floor} rx={h * 0.3} ry={h * 0.05} fill="#05030a" opacity="0.5" filter="url(#blur3)" />
                    {figure(img, court_size(name), x, floor, h * (1. - 0.04 * r), flip, filter, 1.)}
                    {lantern}
                </g>
            )
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{figures}</g>)
}

#[derive(Debug)]
pub struct Proof {
    sh: Shaders,
    ms: MarshShaders,
    pull: Anim,
    laugh: Anim,
}

impl Proof {
    pub fn new(_sh: Shaders, ms: MarshShaders) -> Self {
        Self {
            sh: _sh,
            ms,
            pull: tw(0.6, 4.4, 2.5, 1., Easing::EaseInOut),
            laugh: keys(&[(LAUGH_AT, LAUGH_AT + 0.3, 0., 1., Easing::EaseOut), (LAUGH_AT + 1.4, 4.8, 1., 0.55, Easing::EaseInOut)]),
        }
    }
}

impl Scene for Proof {
    fn name(&self) -> &'static str {
        "BossProof"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let k = frame.animate(&self.pull);
        let focus = (640., 650.);
        let layer = |depth: f32| {
            let s = 1. + (k - 1.) * depth;
            format!("translate({:.1} {:.1}) scale({s:.4}) translate({:.1} {:.1})", focus.0, focus.1, -focus.0, -focus.1)
        };
        let back = hall(&self.sh, &self.ms, &frame, ctx, t, 1.0 + (k - 1.) * 0.25, 0., 0.45 + 0.06 * wave(t, 1., 0.), 0.);
        // The Queen laughs on her throne: her shoulders shake, her eyes curve.
        let laugh = frame.animate(&self.laugh);
        let shake_y = 5. * laugh * (TAU * t * 5.).sin() * (1. - after(t, 4.2, 0.6));
        let mut p = Queen::throne(t);
        p.smile = laugh;
        p.tilt = 8. * laugh;
        p.head = (0., -8. * laugh + shake_y);
        p.eyes = lerp(1., 0.7, laugh);
        p.glow = 1. + 0.3 * laugh;
        p.arms[1] = Arm { elbow: (70., 200.), wrist: (14., 150.), hand: 200., curl: 0.5 };
        let queen_layer = fframes::svgr!(<g transform={layer(0.25)}>{seated(&p, t, 640., 250. + shake_y * 0.4, 0.5)}</g>);
        let recoil: [f32; 4] = std::array::from_fn(|i| ease_out(after(t, RECOIL_AT + 0.12 * i as f32, 0.5)) * (1. - 0.3 * after(t, 3.6, 1.2)));
        let court_layer = fframes::svgr!(<g transform={layer(0.55)}>{court(ctx, t, 560., &recoil, &[0.; 4], "url(#hm-cool)")}</g>);
        // Coins of bone fall onto the floor, bounce and spin; one keeps wobbling.
        let coins = COINS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let at = DROP_AT + 0.08 * i as f32;
                let dt = t - at;
                if dt < 0. {
                    return Svgr::empty();
                }
                let fall = LAND_AT - DROP_AT;
                let (cy, ratio) = if dt < fall {
                    let u = dt / fall;
                    (lerp(-140., y, u * u), (TAU * u * 2.).cos().abs().max(0.1))
                } else {
                    let b = dt - fall;
                    let hop = 26. * (-b * 5.).exp() * (b * 14.).sin().abs();
                    let settle = if i == 2 { 0.62 + 0.16 * wave(t, 2., 0.1) } else { lerp(0.3, 0.42, rnd(i as u32, 5)) };
                    (y - hop, lerp((b * 18.).cos().abs().max(0.15), settle, (b / 0.8).min(1.)))
                };
                let rot = 40. * rnd(i as u32, 6) + if i == 2 { 20. * wave(t, 2., 0.) } else { 0. };
                fframes::svgr!(<g transform={format!("translate({:.1} {cy:.1})", x + 10. * wave(t, 1., 0.) * if i == 2 { 1. } else { 0. })}>{bone_coin(30., ratio, rot, 0.4)}</g>)
            })
            .collect::<Vec<_>>();
        let ring_dt = t - LAND_AT - 0.1;
        let ring = (0..12u32)
            .map(|j| {
                let a = TAU * j as f32 / 12.;
                let d = 40. + 220. * ease_out(after(ring_dt, 0., 1.4));
                puff(640. + a.cos() * d, 660. + a.sin() * d * 0.25, 70., 22., 0.6 * (1. - after(ring_dt, 0.2, 1.4)) * after(ring_dt, 0., 0.1), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let hold_breath = (0..3u32)
            .map(|j| {
                let u = (loop_phase(t) + j as f32 / 3.).rem_euclid(1.);
                puff(640. + 30. * (j as f32 - 1.), 650. - 70. * u, 30. + 40. * u, 12. + 14. * u, 0.35 * (PI * u).sin() * after(t, 2.0, 1.), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let frost = Motes { count: 30, seed: 3301, area: (0., 0., 1280., 720.), rise: -120., period: LOOP, size: (0.8, 2.), sway: 30., fill: "url(#hm-ice-glow)" };
        fframes::svgr!(
            <g>
                {back}
                {queen_layer}
                {floor_mist(t, 520., 0.35, 3311)}
                {court_layer}
                <g transform={layer(1.)}>
                    {ring}
                    {coins}
                    {hold_breath}
                </g>
                {frost.draw(t, 0.5)}
                <rect width="1280" height="720" fill="url(#hm-hall-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Reversal

const STOP_AT: f32 = 1.6;
const FOCUS_AT: f32 = 1.9;
const DELIGHT_AT: f32 = 3.0;

#[derive(Debug)]
pub struct Reversal {
    focus: Anim,
    stop: Anim,
    delight: Anim,
    lift: Anim,
}

impl Reversal {
    pub fn new(_sh: Shaders, _ms: MarshShaders) -> Self {
        Self {
            focus: tw(FOCUS_AT, 2.7, 0., 1., Easing::EaseInOut),
            stop: tw(STOP_AT, STOP_AT + 0.35, 0., 1., Easing::EaseOut),
            delight: tw(DELIGHT_AT, 4.6, 0., 1., Easing::EaseInOut),
            lift: spring(0.2, 60., 0., SOFT),
        }
    }
}

impl Scene for Reversal {
    fn name(&self) -> &'static str {
        "BossReversal"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let focus = frame.animate(&self.focus);
        let stop = frame.animate(&self.stop);
        let delight = frame.animate(&self.delight);
        // The face behind the coin: still laughing, then still, then delighted.
        let laugh_shake = 3. * (TAU * t * 5.).sin() * (1. - stop);
        let mut p = Queen::throne(t);
        p.smile = lerp(1., 0., stop) + 0.25 * delight;
        p.eyes = lerp(0.7, 1.1, stop) - 0.25 * delight;
        p.glow = lerp(1.2, 0.6, stop) + 1.3 * delight + 0.05 * wave(t, 1., 0.);
        p.tilt = lerp(6., 0., stop) - 11. * delight;
        p.head = (0., laugh_shake);
        let bokeh = (0..14u32)
            .map(|k| {
                let x = lerp(0., 1280., rnd(k, 41)) + 14. * wave(t, 1., rnd(k, 42));
                let y = lerp(0., 720., rnd(k, 43));
                fframes::svgr!(<circle cx={x} cy={y} r={lerp(30., 80., rnd(k, 44))} fill={if k % 3 == 0 { "url(#hm-violet-bokeh)" } else { "url(#hm-eye)" }} opacity={0.22 * (0.8 + 0.2 * wave(t, 1., rnd(k, 45)))} />)
            })
            .collect::<Vec<_>>();
        let bg_blur = lerp(9., 0., focus);
        let face = fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="url(#hm-dark-hall)" />
                {bokeh}
                <g transform="translate(860 300) scale(2.3)">{queen(&p, t)}</g>
                <circle cx="860" cy="290" r="260" fill="url(#hm-eye)" opacity={0.12 * delight} />
            </g>
        );
        let face = if bg_blur > 0.15 {
            fframes::svgr!(
                <g>
                    <defs><filter id="hm-rack-face" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1480" height="920"><feGaussianBlur stdDeviation={bg_blur} /></filter></defs>
                    <g filter="url(#hm-rack-face)">{face}</g>
                </g>
            )
        } else {
            face
        };
        // One coin of bone between two long fingers, with cold breath rising.
        let lift = frame.animate(&self.lift);
        let turn = 8. * wave(t, 1., 0.2);
        let ratio = 0.9 + 0.06 * wave(t, 1., 0.5);
        let breath = (0..4u32)
            .map(|j| {
                let u = (loop_phase(t) * 1. + j as f32 / 4.).rem_euclid(1.);
                puff(380. + 20. * (TAU * (u + j as f32 * 0.3)).sin(), 330. - 200. * u, 40. + 60. * u, 18. + 26. * u, 0.4 * (PI * u).sin(), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let fg_blur = lerp(0., 5., focus);
        let hand = fframes::svgr!(
            <g transform={format!("translate(0 {lift:.1})")}>
                <circle cx="380" cy="420" r="230" fill="url(#hm-ice-glow)" opacity="0.18" />
                <g transform={format!("translate(380 420) rotate({turn:.1})")}>{bone_coin(120., ratio, 10., 0.7)}</g>
                {bone_hand(640., 560., 200., 0.25, 0.3, 5.4)}
                <path d="M640 560 C700 600 760 660 820 760" stroke="url(#hm-robe-dark)" stroke-width="120" fill="none" stroke-linecap="round" />
                <circle cx="640" cy="560" r="62" fill="none" stroke="#e8dcc4" stroke-width="9" opacity="0.85" />
                {breath}
            </g>
        );
        let hand = if fg_blur > 0.15 {
            fframes::svgr!(
                <g>
                    <defs><filter id="hm-rack-hand" filterUnits="userSpaceOnUse" x="-200" y="-200" width="1680" height="1120"><feGaussianBlur stdDeviation={fg_blur} /></filter></defs>
                    <g filter="url(#hm-rack-hand)">{hand}</g>
                </g>
            )
        } else {
            hand
        };
        let frost = Motes { count: 34, seed: 3401, area: (0., 0., 1280., 720.), rise: -110., period: LOOP, size: (0.8, 2.2), sway: 30., fill: "url(#hm-ice-glow)" };
        fframes::svgr!(
            <g>
                {face}
                {hand}
                {frost.draw(t, 0.6)}
                <rect width="1280" height="720" fill="url(#hm-hall-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Challenge

/// The three lanes recede from your side (left) toward the Queen (right).
const NEAR: [(f32, f32); 3] = [(270., 92.), (410., 106.), (560., 120.)];
const FAR: [(f32, f32); 3] = [(232., 58.), (356., 66.), (482., 74.)];
const LANE_L: f32 = 140.;
const LANE_R: f32 = 900.;
const RAMPART_U: f32 = 0.78;
const HUSHBOW_U: f32 = 0.87;
const RAMPART_AT: f32 = 1.4;
const HUSHBOW_AT: f32 = 2.1;
const RISE_AT: f32 = 2.6;
const STORM_AT: f32 = 3.3;

fn lane_at(i: usize, u: f32) -> (f32, f32, f32) {
    (lerp(LANE_L, LANE_R, u), lerp(NEAR[i].0, FAR[i].0, u), lerp(NEAR[i].1, FAR[i].1, u))
}

#[derive(Debug)]
pub struct Challenge {
    sh: Shaders,
    lanes: Vec<Anim>,
    rampart: Anim,
    hushbow: Anim,
    rise: Anim,
    roll: Anim,
    storm: Anim,
    punch: Anim,
    flash: Anim,
}

impl Challenge {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            lanes: (0..3).map(|i| tw(0.25 + 0.12 * i as f32, 1.0 + 0.12 * i as f32, 0., 1., Easing::EaseInOut)).collect(),
            rampart: spring(RAMPART_AT, 0., 1., HEAVY),
            hushbow: tw(HUSHBOW_AT - 0.35, HUSHBOW_AT, 0., 1., Easing::EaseIn),
            rise: spring(RISE_AT, 0., 1., HEAVY),
            roll: tw(1.0, 4.8, 0., 1., Easing::EaseInOut),
            storm: tw(STORM_AT, 4.6, 0., 1., Easing::EaseOut),
            punch: punch(RAMPART_AT, 1.03),
            flash: flash(STORM_AT, 0.25, 0.6),
        }
    }
}

impl Scene for Challenge {
    fn name(&self) -> &'static str {
        "BossChallenge"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(field), Some(rampart), Some(hushbow), Some(blizzard)) = (
            ctx.get_image("hollow-marches.png"),
            ctx.get_image("card-bone-rampart.png"),
            ctx.get_image("card-hushbow.png"),
            ctx.get_image("card-blizzard.png"),
        ) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let storm = frame.animate(&self.storm);
        let painting = painting(&self.sh, &frame, field, Grade { gold: 0.15, dusk: 0.3, dark: 0.2 + 0.1 * storm, storm: 0.25 * storm, ..Default::default() });
        let flow = (t / LOOP * 2.).rem_euclid(1.0);
        let lanes = (0..3)
            .map(|i| {
                let p = frame.animate(&self.lanes[i]);
                if p <= 0. {
                    return Svgr::empty();
                }
                let (nx, ny, nh) = lane_at(i, 0.);
                let (fx, fy, fh) = lane_at(i, 1.);
                let (hx, hy, hh) = lane_at(i, p.min(1.));
                let shape = format!("M{nx} {:.1} L{fx} {:.1} L{fx} {:.1} L{nx} {:.1}Z", ny - nh / 2., fy - fh / 2., fy + fh / 2., ny + nh / 2.);
                let edges = format!("M{nx} {:.1} L{fx} {:.1} M{nx} {:.1} L{fx} {:.1}", ny - nh / 2., fy - fh / 2., ny + nh / 2., fy + fh / 2.);
                let body = 0.1 + 0.04 * wave(t, 2., i as f32 * 0.3) + if i == 1 { 0.06 } else { 0. };
                let head = if p < 1. {
                    fframes::svgr!(<g><circle cx={hx} cy={hy} r={hh} fill="url(#hm-ice-glow)" /><circle cx={hx} cy={hy} r="5" fill="#ffffff" /></g>)
                } else {
                    Svgr::empty()
                };
                let pulses = (0..4)
                    .flat_map(|k| {
                        let u = 0.5 * ((flow + k as f32 / 4.).rem_euclid(1.0));
                        [(u, "#f4fbff"), (1. - u, "#b46aff")]
                    })
                    .map(|(u, fill)| {
                        let (x, y, h) = lane_at(i, u);
                        let o = (PI * (u - 0.5).abs() * 2.).sin().max(0.).powf(0.6);
                        fframes::svgr!(<ellipse cx={x} cy={y} rx={h * 0.42} ry={h * 0.06} fill={fill} opacity={0.85 * o} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g>
                        <defs>
                            <clipPath id={format!("hm-lane-{i}")}><rect x={LANE_L - 10.} y="0" width={(hx - LANE_L + 10.).max(0.1)} height="720" /></clipPath>
                        </defs>
                        <g clip-path={format!("url(#hm-lane-{i})")}>
                            <path d={shape} fill="url(#hm-lane)" opacity={body} />
                            <path d={edges.clone()} stroke="url(#hm-lane)" stroke-width="10" opacity="0.4" filter="url(#blur8u)" />
                            <path d={edges} stroke="url(#hm-lane)" stroke-width="2.5" />
                            {pulses}
                        </g>
                        {head}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // A wall of bones bursts out of the middle Lane; the Bone Rampart card rises in it.
        let (rx, ry, _) = lane_at(1, RAMPART_U);
        let up = frame.animate(&self.rampart);
        let bones = (0..9)
            .map(|k| {
                let grow = ease_out(((t - RAMPART_AT - 0.04 * k as f32) / 0.4).clamp(0., 1.));
                let x = rx - 100. + 25. * k as f32;
                let h = (40. + 30. * rnd(k, 71)) * grow;
                let lean = lerp(-0.3, 0.3, rnd(k, 72));
                bone((x, ry + 64.), (x + lean * h, ry + 64. - h), 9.)
            })
            .collect::<Vec<_>>();
        let rampart_card = if up > 0.001 {
            let y = ry + 70. - 82. * up.min(1.2);
            fframes::svgr!(
                <g>
                    <defs><clipPath id="hm-ground"><rect x={rx - 130.} y={ry - 230.} width="260" height="300" /></clipPath></defs>
                    <ellipse cx={rx} cy={ry} rx="120" ry="140" fill="url(#hm-ice-glow)" opacity={0.4 * up.min(1.) * (0.75 + 0.25 * wave(t, 2., 0.4))} />
                    <g clip-path="url(#hm-ground)">
                        <g transform={format!("translate({rx:.1} {y:.1}) scale(1.05)")}>
                            <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.45" />
                            {card_front(rampart)}
                            <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="url(#g-epic)" stroke-width="4" opacity={up.min(1.)} />
                            <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="#efe4cc" stroke-width="10" opacity={(0.3 + 0.15 * wave(t, 2., 0.)) * up.min(1.)} filter="url(#blur8)" />
                        </g>
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let rubble = fframes::svgr!(
            <g>
                {debris(rx, ry + 60., t - RAMPART_AT, 1.4, 18, 971, 480., (-PI * 0.9, -PI * 0.1), 10.)}
                {dust_burst(rx, ry + 70., t - RAMPART_AT, 1.4, 12, 977, 280., "url(#hm-mist)")}
                {shock_ring(rx, ry + 70., t - RAMPART_AT, 0.8, 260., 50., "#efe4cc")}
            </g>
        );
        // The Hushbow card drops into the same Lane behind it.
        let (hx, hy, _) = lane_at(1, HUSHBOW_U);
        let fall = frame.animate(&self.hushbow);
        let hush_card = if fall > 0. {
            let x = lerp(hx + 80., hx, fall);
            let y = lerp(-180., hy - 10., fall);
            let dt = t - HUSHBOW_AT;
            fframes::svgr!(
                <g>
                    {shock_ring(hx, hy + 50., dt, 0.8, 160., 30., "#bfe6ff")}
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({:.1}) scale(0.8)", lerp(20., -3., fall))}>
                        <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.45" />
                        {card_front(hushbow)}
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Queen Marrow rises to her full height at the right: she stands for you.
        let rise = frame.animate(&self.rise);
        let billow = 0.4 * storm + 0.15 * wave(t, 2., 0.1);
        let raise = ease_out(after(t, RISE_AT + 0.3, 0.9));
        let p = Queen {
            tilt: -4. * raise,
            head: (0., 0.),
            eyes: 1.,
            smile: 0.15,
            glow: 1. + 1.2 * storm + 0.1 * wave(t, 1., 0.),
            arms: [
                Arm { elbow: (lerp(-90., -130., raise), lerp(210., 60., raise)), wrist: (lerp(-110., -170., raise), lerp(260., -60., raise)), hand: lerp(110., -100., raise), curl: lerp(0.4, 0.1, raise) },
                Arm { elbow: (lerp(90., 120., raise), lerp(210., 100., raise)), wrist: (lerp(110., 190., raise), lerp(260., 40., raise)), hand: lerp(70., -30., raise), curl: lerp(0.4, 0.05, raise) },
            ],
            seated: false,
            billow,
        };
        let qy = lerp(600., 215., rise);
        let card_k = after(t, STORM_AT - 0.2, 0.4);
        let queen_layer = fframes::svgr!(
            <g transform={format!("translate(1110 {qy:.1}) scale(0.82)")}>
                <ellipse cx="0" cy="-20" rx="320" ry="420" fill="#06030c" opacity={0.55 * rise.min(1.)} filter="url(#blur18)" />
                {queen(&p, t)}
                <g transform={format!("translate(-196 -120) rotate(-12) scale({:.3})", 0.7 * card_k)} opacity={card_k}>
                    <circle r="110" fill="url(#hm-ice-glow)" opacity="0.6" />
                    {card_front(blizzard)}
                </g>
            </g>
        );
        let spiral_mist = (0..14u32)
            .map(|k| {
                let u = (t / LOOP + k as f32 / 14.).rem_euclid(1.);
                let a = TAU * (k as f32 / 14. + u * 0.8);
                let r = 620. * (1. - u) + 60.;
                puff(1060. + a.cos() * r, 320. + a.sin() * r * 0.55, 150. * (1. - u * 0.5), 46., 0.35 * storm * (PI * u).sin(), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let spiral = fframes::svgr!(<g>{spiral_mist}{snow_spiral(1060., 320., t, storm, 220, 3501, 820.)}</g>);
        let roll_k = frame.animate(&self.roll);
        let roll = lerp(-2.5, 3., roll_k) + 0.4 * wave(t, 1., 0.) * after(t, 4.0, 1.0);
        let zoom = frame.animate(&self.punch) * lerp(1.02, 1.08, roll_k);
        let (kx, ky) = shake(t, RAMPART_AT, 9.);
        let snow = Motes { count: 50, seed: 3511, area: (0., 0., 1280., 760.), rise: -340., period: LOOP, size: (1., 3.), sway: 50., fill: "#f4fbff" };
        fframes::svgr!(
            <g>
                <defs>
                    <linearGradient id="hm-lane" gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="900" y2="0">
                        <stop offset="0" stop-color="#f4fbff" />
                        <stop offset="0.48" stop-color="#bfe6ff" />
                        <stop offset="0.52" stop-color="#d8b8ff" />
                        <stop offset="1" stop-color="#9a5aff" />
                    </linearGradient>
                </defs>
                <g transform={format!("translate(640 360) rotate({roll:.3}) scale({zoom:.4}) translate(-640 -360)")}>
                    <g transform={format!("translate({kx:.1} {ky:.1})")}>
                        <g transform="translate(-40 -30) scale(0.85)">{painting}</g>
                        <rect x="-100" y="-100" width="1480" height="920" fill="#0a1424" opacity={0.15 + 0.15 * storm} />
                        {lanes}
                        {bones}
                        {rampart_card}
                        {hush_card}
                        {rubble}
                        {queen_layer}
                    </g>
                </g>
                {spiral}
                {snow.draw(t, 0.4 + 0.4 * storm)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#eaf6ff" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

