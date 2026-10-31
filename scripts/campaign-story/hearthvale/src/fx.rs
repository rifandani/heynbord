//! Shared motion helpers. Every ambient value repeats every LOOP seconds, so the
//! tail of each Story Moment (LOOP_START..CLIP) loops without a seam.
use fframes::{
    Color, Frame, Shader, ShaderUniforms, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::{PI, TAU};

pub const LOOP: f32 = 4.0;
pub const SOFT: Easing = Easing::Spring { mass: 1.0, stiffness: 150.0, damping: 18.0 };
pub const BOUNCY: Easing = Easing::Spring { mass: 1.0, stiffness: 220.0, damping: 12.0 };
pub const HEAVY: Easing = Easing::Spring { mass: 1.6, stiffness: 120.0, damping: 20.0 };

pub type Anim = KeyFramesAnimation<f32>;
pub type Cam = KeyFramesAnimation<(f32, f32, f32)>;

/// Tweens with explicit ends: (start, end, from, to, easing).
pub fn keys(list: &[(f32, f32, f32, f32, Easing)]) -> Anim {
    KeyFramesAnimation::new(
        list.iter()
            .map(|(start, end, from, to, easing)| KeyFrame {
                start: *start,
                end: Some(*end),
                from: *from,
                to: *to,
                easing,
            })
            .collect(),
    )
}

pub fn tw(start: f32, end: f32, from: f32, to: f32, easing: Easing) -> Anim {
    keys(&[(start, end, from, to, easing)])
}

/// A spring that settles on its own.
pub fn spring(start: f32, from: f32, to: f32, easing: Easing) -> Anim {
    KeyFramesAnimation::new(vec![KeyFrame { start, end: None, from, to, easing: &easing }])
}

/// Camera keys: (start, end, from, to) with ease-in-out, in map units and zoom.
pub fn camera(list: &[(f32, f32, (f32, f32, f32), (f32, f32, f32))]) -> Cam {
    KeyFramesAnimation::new(
        list.iter()
            .map(|(start, end, from, to)| KeyFrame {
                start: *start,
                end: Some(*end),
                from: *from,
                to: *to,
                easing: &Easing::EaseInOut,
            })
            .collect(),
    )
}

/// The map painting is 1600 x 900 map units; zoom 1 fills the 1280 x 720 frame.
pub fn cam_transform((x, y, z): (f32, f32, f32), shake: (f32, f32)) -> String {
    let s = 0.8 * z;
    format!("translate({} {}) scale({s}) translate({} {})", 640. + shake.0, 360. + shake.1, -x, -y)
}

/// A decaying camera shake that starts at `at`.
pub fn shake(t: f32, at: f32, amp: f32) -> (f32, f32) {
    let dt = t - at;
    if !(0.0..1.0).contains(&dt) {
        return (0., 0.);
    }
    let decay = (-dt * 6.5).exp() * amp;
    (decay * (dt * 57.).sin(), decay * (dt * 43.).cos())
}

pub fn rnd(i: u32, salt: u32) -> f32 {
    let mut h = i.wrapping_mul(0x9E37_79B9) ^ salt.wrapping_mul(0x85EB_CA6B);
    h ^= h >> 15;
    h = h.wrapping_mul(0x2C1B_3C6D);
    h ^= h >> 12;
    h = h.wrapping_mul(0x297A_2D39);
    h ^= h >> 15;
    (h & 0x00FF_FFFF) as f32 / 16_777_216.0
}

pub fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

/// `cycles` whole periods per LOOP; seamless by construction.
pub fn wave(t: f32, cycles: f32, phase: f32) -> f32 {
    (TAU * (t * cycles / LOOP + phase)).sin()
}

pub fn loop_phase(t: f32) -> f32 {
    (t / LOOP).rem_euclid(1.0)
}

/// Candle and fire flicker: a sum of whole-cycle waves in 0..1.
pub fn flicker(t: f32, seed: f32) -> f32 {
    0.5 + 0.22 * wave(t, 7., seed) + 0.16 * wave(t, 13., seed * 1.7) + 0.12 * wave(t, 23., seed * 2.3)
}

pub fn path(points: &[(f32, f32)], closed: bool) -> String {
    let mut d = String::with_capacity(points.len() * 16);
    for (i, (x, y)) in points.iter().enumerate() {
        d.push_str(&format!("{}{x:.1} {y:.1} ", if i == 0 { "M" } else { "L" }));
    }
    if closed {
        d.push('Z');
    }
    d
}

/// Catmull-Rom spline through the points, as cubic Beziers.
pub fn smooth(points: &[(f32, f32)]) -> String {
    let n = points.len();
    let mut d = format!("M{:.1} {:.1} ", points[0].0, points[0].1);
    for i in 0..n - 1 {
        let p0 = points[i.saturating_sub(1)];
        let p1 = points[i];
        let p2 = points[i + 1];
        let p3 = points[(i + 2).min(n - 1)];
        let c1 = (p1.0 + (p2.0 - p0.0) / 6., p1.1 + (p2.1 - p0.1) / 6.);
        let c2 = (p2.0 - (p3.0 - p1.0) / 6., p2.1 - (p3.1 - p1.1) / 6.);
        d.push_str(&format!("C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} ", c1.0, c1.1, c2.0, c2.1, p2.0, p2.1));
    }
    d
}

/// A polyline with its cumulative lengths, for points along a road.
#[derive(Debug)]
pub struct Track {
    pub points: Vec<(f32, f32)>,
    pub lengths: Vec<f32>,
}

impl Track {
    pub fn new(points: Vec<(f32, f32)>) -> Self {
        let mut lengths = vec![0.];
        for w in points.windows(2) {
            let l = lengths.last().copied().unwrap_or(0.);
            lengths.push(l + ((w[1].0 - w[0].0).powi(2) + (w[1].1 - w[0].1).powi(2)).sqrt());
        }
        Self { points, lengths }
    }
    pub fn total(&self) -> f32 {
        self.lengths.last().copied().unwrap_or(1.)
    }
    pub fn at(&self, fraction: f32) -> (f32, f32) {
        let target = fraction.clamp(0., 1.) * self.total();
        for i in 1..self.points.len() {
            if self.lengths[i] >= target {
                let span = (self.lengths[i] - self.lengths[i - 1]).max(0.001);
                let k = (target - self.lengths[i - 1]) / span;
                let (a, b) = (self.points[i - 1], self.points[i]);
                return (lerp(a.0, b.0, k), lerp(a.1, b.1, k));
            }
        }
        self.points.last().copied().unwrap_or((0., 0.))
    }
}

/// Particles that rise (or fall, with a negative `rise`) once per `period`.
/// `period` divides LOOP, so they loop seamlessly.
pub struct Motes {
    pub count: u32,
    pub seed: u32,
    pub area: (f32, f32, f32, f32),
    pub rise: f32,
    pub period: f32,
    pub size: (f32, f32),
    pub sway: f32,
    pub fill: &'static str,
}

impl Motes {
    pub fn draw<'a>(&self, t: f32, alpha: f32) -> Svgr<'a> {
        if alpha <= 0.001 {
            return Svgr::empty();
        }
        let (x, y, w, h) = self.area;
        let dots = (0..self.count)
            .map(|i| {
                let a = rnd(i, self.seed);
                let b = rnd(i, self.seed + 1);
                let c = rnd(i, self.seed + 2);
                // Some motes take two periods per LOOP, so the field has depth.
                let period = if c > 0.6 { self.period * 0.5 } else { self.period };
                let u = (t / period + a).rem_euclid(1.0);
                let px = x + b * w + self.sway * (TAU * (u + c)).sin();
                let py = y + h - u * self.rise - (1. - c) * h * 0.6;
                let r = lerp(self.size.0, self.size.1, c * c);
                let o = alpha * (PI * u).sin().powf(0.7) * (0.55 + 0.45 * wave(t, 6., a));
                fframes::svgr!(<circle cx={px} cy={py} r={r} fill={self.fill} opacity={o} />)
            })
            .collect::<Vec<_>>();
        fframes::svgr!(<g>{dots}</g>)
    }
}

/// The shaders, compiled once by the renderer.
#[derive(Clone, Debug)]
pub struct Shaders {
    pub grade: Shader,
    pub fog: Shader,
    pub rays: Shader,
    pub stone: Shader,
}

impl Shaders {
    pub fn new() -> Self {
        let noise = include_str!("shaders/noise.sksl");
        let with = |src: &str| Shader::sksl(format!("{noise}\n{src}"));
        Self {
            grade: with(include_str!("shaders/grade.sksl")),
            fog: with(include_str!("shaders/fog.sksl")),
            rays: with(include_str!("shaders/rays.sksl")),
            stone: with(include_str!("shaders/stone.sksl")),
        }
    }
}

/// The color treatment of a painting for one frame.
#[derive(Default, Clone, Copy)]
pub struct Grade {
    pub fire: f32,
    pub smoke: f32,
    pub heat: f32,
    pub storm: f32,
    pub red: f32,
    pub gold: f32,
    pub dusk: f32,
    pub dark: f32,
    pub flash: f32,
    pub flash_color: (f32, f32, f32),
}

pub fn painting<'a>(
    shaders: &Shaders,
    frame: &Frame,
    image: &fframes::media::ImageData<'_>,
    g: Grade,
) -> Svgr<'a> {
    let layer = shaders.grade.draw(
        frame,
        ShaderUniforms::new()
            .image("uImg", image)
            .float2("uImgSize", 1600., 900.)
            .float("uPhase", loop_phase(frame.seconds()))
            .float("uFire", g.fire)
            .float("uSmoke", g.smoke)
            .float("uHeat", g.heat)
            .float("uStorm", g.storm)
            .float("uRed", g.red)
            .float("uGold", g.gold)
            .float("uDusk", g.dusk)
            .float("uDark", g.dark)
            .float("uFlash", g.flash)
            .float3("uFlashColor", g.flash_color.0, g.flash_color.1, g.flash_color.2),
    );
    fframes::svgr!(<image href={layer.href()} x="0" y="0" width="1600" height="900" />)
}

/// A drifting cloud, smoke or dust layer.
pub struct Fog {
    pub density: f32,
    pub soft: f32,
    pub light: Color,
    pub shade: Color,
    pub dir: (f32, f32),
    pub scale: f32,
    pub seed: f32,
}

impl Fog {
    pub fn draw<'a>(&self, shaders: &Shaders, frame: &Frame, opacity: f32, rect: (f32, f32, f32, f32)) -> Svgr<'a> {
        if opacity <= 0.001 {
            return Svgr::empty();
        }
        let c = |c: Color| (f32::from(c.r) / 255., f32::from(c.g) / 255., f32::from(c.b) / 255.);
        let (lr, lg, lb) = c(self.light);
        let (sr, sg, sb) = c(self.shade);
        let layer = shaders.fog.draw(
            frame,
            ShaderUniforms::new()
                .float("uPhase", loop_phase(frame.seconds()))
                .float("uDensity", self.density)
                .float("uSoft", self.soft)
                .float3("uLight", lr, lg, lb)
                .float3("uShade", sr, sg, sb)
                .float2("uDir", self.dir.0, self.dir.1)
                .float("uScale", self.scale)
                .float("uSeed", self.seed)
                .float("uOpacity", opacity.min(1.)),
        );
        let (x, y, w, h) = rect;
        fframes::svgr!(<image href={layer.href()} x={x} y={y} width={w} height={h} />)
    }
}

pub fn rays<'a>(
    shaders: &Shaders,
    frame: &Frame,
    origin: (f32, f32),
    strength: f32,
    reach: f32,
    color: (f32, f32, f32),
) -> Svgr<'a> {
    if strength <= 0.001 {
        return Svgr::empty();
    }
    let layer = shaders.rays.draw(
        frame,
        ShaderUniforms::new()
            .float2("uOrigin", origin.0, origin.1)
            .float("uPhase", loop_phase(frame.seconds()))
            .float("uStrength", strength)
            .float("uReach", reach)
            .float3("uColor", color.0, color.1, color.2),
    );
    fframes::svgr!(<image href={layer.href()} x="0" y="0" width="1280" height="720" />)
}

/// A four-point star glint.
pub fn glint<'a>(x: f32, y: f32, size: f32, opacity: f32) -> Svgr<'a> {
    if opacity <= 0.01 || size <= 0.05 {
        return Svgr::empty();
    }
    let s = size;
    let d = format!(
        "M{x} {} Q{x} {y} {} {y} Q{x} {y} {x} {} Q{x} {y} {} {y} Q{x} {y} {x} {}Z",
        y - s * 2.6,
        x + s * 2.6,
        y + s * 2.6,
        x - s * 2.6,
        y - s * 2.6
    );
    fframes::svgr!(
        <g opacity={opacity}>
            <circle cx={x} cy={y} r={s * 2.2} fill="url(#g-gold)" />
            <path d={d} fill="#fffbe8" />
        </g>
    )
}

/// The Accord Seal: three lanes inside two rings. With `cut`, one slash breaks it.
pub fn seal_lanes(r: f32, cut: bool) -> String {
    let mut d = String::new();
    for k in [-1.0f32, 0., 1.] {
        let y = k * r * 0.34;
        let half = (r * r - y * y).max(0.).sqrt() * 0.78;
        d.push_str(&format!("M{:.1} {:.1} L{:.1} {:.1} ", -half, y, half, y));
    }
    if cut {
        d.push_str(&format!("M{:.1} {:.1} L{:.1} {:.1} ", -r * 0.42, r * 0.7, r * 0.46, -r * 0.72));
    }
    d
}

/// A short rune made of strokes in a 14 x 20 box, centered at the origin.
pub fn rune(seed: u32) -> String {
    let mut d = format!("M0 -10 L0 10 ");
    let strokes = 1 + (rnd(seed, 3) * 3.) as u32;
    for s in 0..strokes {
        let y0 = lerp(-9., 7., rnd(seed, 10 + s));
        let dir = if rnd(seed, 20 + s) > 0.5 { 1. } else { -1. };
        let y1 = y0 + lerp(-7., 7., rnd(seed, 30 + s));
        d.push_str(&format!("M0 {y0:.1} L{:.1} {y1:.1} ", dir * 7.));
    }
    d
}

/// A coin seen from above: `ratio` 1 is face-on, smaller is tilted away.
pub fn coin<'a>(x: f32, y: f32, r: f32, ratio: f32, rot: f32, emblem: bool) -> Svgr<'a> {
    let thick = r * 0.2 * (1. - ratio).max(0.15);
    let mark = if emblem {
        fframes::svgr!(<path d={HAT} transform={format!("scale({:.3})", r / 52.)} fill="#c98a24" stroke="#fff0b0" stroke-width="1.2" opacity="0.85" />)
    } else {
        Svgr::empty()
    };
    fframes::svgr!(
        <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1})")}>
            <g transform={format!("scale(1 {ratio:.3})")}>
                <circle cy={thick / ratio.max(0.05)} r={r} fill="url(#g-coin-edge)" />
                <circle r={r} fill="url(#g-coin)" stroke="#7a4a10" stroke-width={r * 0.05} />
                <circle r={r * 0.74} fill="none" stroke="#ffe9a6" stroke-width={r * 0.05} opacity="0.55" />
                {mark}
            </g>
        </g>
    )
}

/// The Baron's mark: a very large hat with a feather.
pub const HAT: &str = "M-34 8 C-30 2 -18 0 -14 -2 C-14 -16 -8 -24 0 -24 C8 -24 14 -16 14 -2 C18 0 30 2 34 8 C20 14 -20 14 -34 8Z M6 -22 C14 -36 30 -40 38 -34 C28 -32 18 -26 10 -18Z";

/// A playing card in the game's style, centered on the origin, 100 x 134 units.
pub fn card_back<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <rect x="-50" y="-67" width="100" height="134" rx="9" fill="#3a0a0c" stroke="#d9a441" stroke-width="3" />
            <rect x="-41" y="-58" width="82" height="116" rx="5" fill="none" stroke="#8c2a1c" stroke-width="2" />
            <circle cx="0" cy="0" r="30" fill="#5c1214" stroke="#d9a441" stroke-width="2" />
            <path d={HAT} transform="scale(0.72)" fill="#e8b24f" />
        </g>
    )
}

pub fn card_front<'a>(art: &fframes::media::ImageData<'_>) -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <rect x="-50" y="-67" width="100" height="134" rx="9" fill="#24110a" stroke="#e0b250" stroke-width="3" />
            <image href={art.href()} x="-44" y="-61" width="88" height="117" preserveAspectRatio="xMidYMid slice" />
            <rect x="-44" y="-61" width="88" height="117" fill="url(#g-card-shade)" />
        </g>
    )
}

/// A candle flame with its glow; `bend` leans the flame (degrees).
pub fn candle<'a>(x: f32, y: f32, t: f32, bend: f32, dim: f32) -> Svgr<'a> {
    let f = flicker(t, 0.13);
    let glow = (0.6 + 0.4 * f) * (1. - dim);
    let h = 34. + 7. * f;
    let sway = 2.5 * wave(t, 5., 0.2) + bend * 0.4;
    let flame = format!(
        "M0 0 C-11 -6 -10 {:.1} {:.1} {:.1} C10 {:.1} 11 -6 0 0Z",
        -h * 0.55,
        sway,
        -h,
        -h * 0.55
    );
    let core = format!("M0 -2 C-5 -5 -4 {:.1} {:.1} {:.1} C4 {:.1} 5 -5 0 -2Z", -h * 0.35, sway * 0.6, -h * 0.62, -h * 0.35);
    fframes::svgr!(
        <g>
            <circle cx={x} cy={y - 40.} r="420" fill="url(#g-candle)" opacity={glow} />
            <rect x={x - 24.} y={y} width="48" height="210" rx="6" fill="url(#g-wax)" />
            <path d={format!("M{} {} q 6 18 0 34 q -4 -16 0 -34Z", x + 14., y + 2.)} fill="#f6e3bf" opacity="0.8" />
            <ellipse cx={x} cy={y} rx="24" ry="6" fill="#f3dcae" />
            <path d={format!("M{x} {y} L{x} {}", y - 10.)} stroke="#2b1a10" stroke-width="2.5" />
            <g transform={format!("translate({x} {}) skewX({})", y - 8., -bend)}>
                <circle cx="0" cy={-h * 0.45} r={h * 0.9} fill="url(#g-ember)" opacity={0.55 * (1. - dim)} />
                <path d={flame} fill="#ffb347" opacity={1. - dim * 0.5} />
                <path d={core} fill="#fff6d6" opacity={1. - dim * 0.6} />
            </g>
        </g>
    )
}

/// Shared static definitions: gradients and filters referenced by id.
pub fn defs<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <defs>
            <radialGradient id="g-ember">
                <stop offset="0" stop-color="#fff4c8" stop-opacity="1" />
                <stop offset="0.3" stop-color="#ffa531" stop-opacity="0.9" />
                <stop offset="1" stop-color="#ff4a08" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-gold">
                <stop offset="0" stop-color="#fffbe6" stop-opacity="1" />
                <stop offset="0.35" stop-color="#ffd772" stop-opacity="0.8" />
                <stop offset="1" stop-color="#e6a020" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-dust">
                <stop offset="0" stop-color="#e88a5a" stop-opacity="0.9" />
                <stop offset="1" stop-color="#a03a18" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-violet">
                <stop offset="0" stop-color="#f1dcff" stop-opacity="1" />
                <stop offset="0.35" stop-color="#b169ff" stop-opacity="0.75" />
                <stop offset="1" stop-color="#5a12b0" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-red">
                <stop offset="0" stop-color="#ffb08a" stop-opacity="1" />
                <stop offset="0.35" stop-color="#ff3a1c" stop-opacity="0.75" />
                <stop offset="1" stop-color="#9e0a04" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-ash">
                <stop offset="0" stop-color="#cfc6bd" stop-opacity="0.9" />
                <stop offset="1" stop-color="#6d625b" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-candle">
                <stop offset="0" stop-color="#ffc56b" stop-opacity="0.55" />
                <stop offset="0.4" stop-color="#ff9b3d" stop-opacity="0.18" />
                <stop offset="1" stop-color="#ff7a20" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="g-wax" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#b98f5f" />
                <stop offset="0.45" stop-color="#f5e2bd" />
                <stop offset="1" stop-color="#8d6640" />
            </linearGradient>
            <radialGradient id="g-vignette" cx="0.5" cy="0.5" r="0.75">
                <stop offset="0.55" stop-color="#000" stop-opacity="0" />
                <stop offset="1" stop-color="#000" stop-opacity="0.78" />
            </radialGradient>
            <linearGradient id="g-card-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0.55" stop-color="#000" stop-opacity="0" />
                <stop offset="1" stop-color="#000" stop-opacity="0.55" />
            </linearGradient>
            <linearGradient id="g-title" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fff6d2" />
                <stop offset="0.5" stop-color="#f3c25a" />
                <stop offset="1" stop-color="#a8641a" />
            </linearGradient>
            <linearGradient id="g-blood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffd2a0" />
                <stop offset="0.45" stop-color="#e2452a" />
                <stop offset="1" stop-color="#7a0f0a" />
            </linearGradient>
            <radialGradient id="g-coin" cx="0.38" cy="0.32" r="0.8">
                <stop offset="0" stop-color="#fff2b8" />
                <stop offset="0.35" stop-color="#f2c04e" />
                <stop offset="0.75" stop-color="#b97a1e" />
                <stop offset="1" stop-color="#7a4a10" />
            </radialGradient>
            <linearGradient id="g-coin-edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#5c360c" />
                <stop offset="0.5" stop-color="#a26c1e" />
                <stop offset="1" stop-color="#4a2a08" />
            </linearGradient>
            <linearGradient id="g-parchment" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#f1d9a6" />
                <stop offset="0.55" stop-color="#e2c084" />
                <stop offset="1" stop-color="#b98d54" />
            </linearGradient>
            <radialGradient id="g-wax-seal" cx="0.4" cy="0.35" r="0.75">
                <stop offset="0" stop-color="#9a2a3c" />
                <stop offset="0.55" stop-color="#5a0e22" />
                <stop offset="1" stop-color="#2a0412" />
            </radialGradient>
            <linearGradient id="g-desk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#1c0f08" stop-opacity="0" />
                <stop offset="0.25" stop-color="#2a170c" stop-opacity="0.92" />
                <stop offset="1" stop-color="#0d0603" stop-opacity="1" />
            </linearGradient>
            <linearGradient id="g-top-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#0a0604" stop-opacity="0.75" />
                <stop offset="1" stop-color="#0a0604" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="g-bottom-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#070305" stop-opacity="0" />
                <stop offset="1" stop-color="#070305" stop-opacity="0.85" />
            </linearGradient>
            <linearGradient id="g-fire-horizon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ff5a12" stop-opacity="0" />
                <stop offset="0.6" stop-color="#ff7a20" stop-opacity="0.45" />
                <stop offset="1" stop-color="#ffb347" stop-opacity="0.75" />
            </linearGradient>
            <radialGradient id="g-softdisc">
                <stop offset="0.72" stop-color="#fff" />
                <stop offset="1" stop-color="#000" />
            </radialGradient>
            <linearGradient id="g-sunset" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3a1c3a" />
                <stop offset="0.5" stop-color="#c0584a" />
                <stop offset="1" stop-color="#f2a65a" />
            </linearGradient>
            <linearGradient id="g-velvet" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="86" y2="0" spreadMethod="repeat">
                <stop offset="0" stop-color="#3a0408" />
                <stop offset="0.35" stop-color="#9a1420" />
                <stop offset="0.55" stop-color="#c22a30" />
                <stop offset="1" stop-color="#3a0408" />
            </linearGradient>
            <radialGradient id="g-wax-red" cx="0.4" cy="0.35" r="0.75">
                <stop offset="0" stop-color="#ff5a48" />
                <stop offset="0.5" stop-color="#b8121c" />
                <stop offset="1" stop-color="#4a0206" />
            </radialGradient>
            <linearGradient id="g-burlap" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#a88250" />
                <stop offset="0.5" stop-color="#7a5a30" />
                <stop offset="1" stop-color="#3e2a12" />
            </linearGradient>
            <linearGradient id="g-night" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#0d0718" />
                <stop offset="1" stop-color="#05030a" />
            </linearGradient>
            <linearGradient id="g-moon-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#1c2a52" />
                <stop offset="1" stop-color="#3a3060" />
            </linearGradient>
            <linearGradient id="g-lane" gradientUnits="userSpaceOnUse" x1="150" y1="0" x2="880" y2="0">
                <stop offset="0" stop-color="#ffd772" />
                <stop offset="0.48" stop-color="#fff2c8" />
                <stop offset="0.52" stop-color="#ffd0b8" />
                <stop offset="1" stop-color="#ff3a1c" />
            </linearGradient>
            <filter id="silhouette" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
                <feComponentTransfer>
                    <feFuncR type="linear" slope="0" intercept="0.03" />
                    <feFuncG type="linear" slope="0" intercept="0.012" />
                    <feFuncB type="linear" slope="0" intercept="0.02" />
                </feComponentTransfer>
            </filter>
            <filter id="violet-aura" x="-25%" y="-25%" width="150%" height="150%">
                <feColorMatrix type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.3  0 0 0 0 1  0 0 0 1 0" />
                <feGaussianBlur stdDeviation="14" />
            </filter>
            <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
            <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" /></filter>
            <filter id="blur8u" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="8" /></filter>
            <filter id="blur18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" /></filter>
            <filter id="aura" x="-25%" y="-25%" width="150%" height="150%">
                <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.18  0 0 0 0 0.06  0 0 0 1 0" />
                <feGaussianBlur stdDeviation="16" />
            </filter>
        </defs>
    )
}
