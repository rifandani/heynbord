//! Hollow Marches props, on top of the shared fx toolkit and the props of the
//! earlier Regions. Ambient motion repeats every LOOP seconds, like the rest of
//! the toolkit. Queen Marrow is drawn here: she has no card and no portrait.
use crate::fx::*;
use crate::hollows::{bloom, letters, spline, taper};
use fframes::{FFramesContext, Frame, Shader, ShaderUniforms, Svgr};
use std::f32::consts::{PI, TAU};

/// Landmarks of the Hollow Marches Region Map, in map units.
pub const GATE: (f32, f32) = (1142., 247.);
pub const WINDOWS: [(f32, f32); 5] = [(1146., 160.), (1124., 99.), (1176., 132.), (1084., 150.), (1254., 160.)];
pub const BOWLS: [(f32, f32); 2] = [(1059., 375.), (1173., 377.)];
pub const FERRY_LAMP: (f32, f32) = (1188., 703.);
pub const CAVE: (f32, f32) = (1415., 612.);

/// The cold colors of the Region, as shader colors.
pub const SUN: (f32, f32, f32) = (1.0, 0.86, 0.6);
pub const ICE: (f32, f32, f32) = (0.62, 0.84, 1.0);
pub const DAWN: (f32, f32, f32) = (1.0, 0.78, 0.45);

/// The shaders of the Region, compiled once.
#[derive(Clone, Debug)]
pub struct MarshShaders {
    pub ice: Shader,
    pub wall: Shader,
    pub caustic: Shader,
}

impl MarshShaders {
    pub fn new() -> Self {
        let noise = include_str!("../../hearthvale/src/shaders/noise.sksl");
        let with = |src: &str| Shader::sksl(format!("{noise}\n{src}"));
        Self {
            ice: with(include_str!("shaders/ice.sksl")),
            wall: with(include_str!("shaders/bonewall.sksl")),
            caustic: crate::hollows::caustic_shader(),
        }
    }
}

/// Ice and frost over a rect: cracked cells, ferns and a melt line from the edges.
pub struct Ice {
    pub frost: f32,
    pub crack: f32,
    pub melt: f32,
    pub scale: f32,
    pub offset: (f32, f32),
    pub tint: (f32, f32, f32),
}

impl Ice {
    pub fn draw<'a>(&self, sh: &MarshShaders, frame: &Frame, phase: f32, opacity: f32, rect: (f32, f32, f32, f32)) -> Svgr<'a> {
        if opacity <= 0.001 {
            return Svgr::empty();
        }
        let layer = sh.ice.draw(
            frame,
            ShaderUniforms::new()
                .float("uPhase", phase.rem_euclid(1.))
                .float("uScale", self.scale)
                .float2("uOffset", self.offset.0, self.offset.1)
                .float("uFrost", self.frost)
                .float("uCrack", self.crack)
                .float("uMelt", self.melt)
                .float3("uTint", self.tint.0, self.tint.1, self.tint.2)
                .float("uOpacity", opacity.min(1.)),
        );
        let (x, y, w, h) = rect;
        fframes::svgr!(<image href={layer.href()} x={x} y={y} width={w} height={h} />)
    }
}

/// The bone-white stone of Marrow Castle over the frame; `offset` and `scale`
/// move it with the camera.
pub fn bone_wall<'a>(sh: &MarshShaders, frame: &Frame, offset: (f32, f32), scale: f32, light: (f32, f32, f32), shade: (f32, f32, f32), glow: f32) -> Svgr<'a> {
    let layer = sh.wall.draw(
        frame,
        ShaderUniforms::new()
            .float2("uOffset", offset.0, offset.1)
            .float("uScale", scale)
            .float3("uLight", light.0, light.1, light.2)
            .float3("uShade", shade.0, shade.1, shade.2)
            .float("uGlow", glow),
    );
    fframes::svgr!(<image href={layer.href()} x="0" y="0" width="1280" height="720" />)
}

/// The fog layer of the toolkit, on an explicit clock: a moment that continues
/// another one draws the fog of that moment's last frame.
pub fn fog_at<'a>(sh: &Shaders, frame: &Frame, fog: &Fog, phase: f32, opacity: f32, rect: (f32, f32, f32, f32)) -> Svgr<'a> {
    if opacity <= 0.001 {
        return Svgr::empty();
    }
    let c = |c: fframes::Color| (f32::from(c.r) / 255., f32::from(c.g) / 255., f32::from(c.b) / 255.);
    let (lr, lg, lb) = c(fog.light);
    let (sr, sg, sb) = c(fog.shade);
    let layer = sh.fog.draw(
        frame,
        ShaderUniforms::new()
            .float("uPhase", phase.rem_euclid(1.))
            .float("uDensity", fog.density)
            .float("uSoft", fog.soft)
            .float3("uLight", lr, lg, lb)
            .float3("uShade", sr, sg, sb)
            .float2("uDir", fog.dir.0, fog.dir.1)
            .float("uScale", fog.scale)
            .float("uSeed", fog.seed)
            .float("uOpacity", opacity.min(1.)),
    );
    let (x, y, w, h) = rect;
    fframes::svgr!(<image href={layer.href()} x={x} y={y} width={w} height={h} />)
}

pub fn smoothstep(a: f32, b: f32, x: f32) -> f32 {
    let k = ((x - a) / (b - a)).clamp(0., 1.);
    k * k * (3. - 2. * k)
}

/// A soft puff of mist.
pub fn puff<'a>(x: f32, y: f32, rx: f32, ry: f32, opacity: f32, fill: &'static str) -> Svgr<'a> {
    if opacity <= 0.005 {
        return Svgr::empty();
    }
    fframes::svgr!(<ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} opacity={opacity.min(1.)} />)
}

/// The mist tide as a rolling wave front at `front` (x), over a band of the frame.
pub fn mist_wave<'a>(front: f32, band: (f32, f32), t: f32, alpha: f32, seed: u32) -> Svgr<'a> {
    if alpha <= 0.005 {
        return Svgr::empty();
    }
    let puffs = (0..26u32)
        .map(|k| {
            let v = rnd(k, seed);
            let y = lerp(band.0, band.1, v);
            let lag = 260. * rnd(k, seed + 1) + 60. * (y / 720. * TAU + t).sin();
            let x = front - lag;
            let r = lerp(90., 220., rnd(k, seed + 2));
            let roll = 10. * wave(t, 2., rnd(k, seed + 3));
            puff(x, y + roll, r * 2.2, r * 0.42, alpha * lerp(0.18, 0.4, rnd(k, seed + 4)), "url(#hm-mist)")
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{puffs}</g>)
}

/// A six-armed frost crystal.
pub fn crystal<'a>(x: f32, y: f32, s: f32, opacity: f32) -> Svgr<'a> {
    if opacity <= 0.01 || s <= 0.1 {
        return Svgr::empty();
    }
    let d = (0..3)
        .map(|k| {
            let a = PI / 3. * k as f32;
            let (c, sn) = (a.cos() * s, a.sin() * s);
            let b = s * 0.45;
            let (bc, bs) = ((a + 0.6).cos() * b * 0.6, (a + 0.6).sin() * b * 0.6);
            format!(
                "M{:.1} {:.1} L{:.1} {:.1} M{:.1} {:.1} L{:.1} {:.1} M{:.1} {:.1} L{:.1} {:.1} ",
                x - c, y - sn, x + c, y + sn,
                x + c * 0.55, y + sn * 0.55, x + c * 0.55 + bc, y + sn * 0.55 + bs,
                x - c * 0.55, y - sn * 0.55, x - c * 0.55 - bc, y - sn * 0.55 - bs
            )
        })
        .collect::<String>();
    fframes::svgr!(
        <g opacity={opacity.min(1.)}>
            <circle cx={x} cy={y} r={s * 1.4} fill="url(#hm-ice-glow)" />
            <path d={d} fill="none" stroke="#f4fbff" stroke-width={(s * 0.16).max(0.8)} stroke-linecap="round" />
        </g>
    )
}

/// A cluster of reeds with cattails, rooted at the origin, in silhouette with a
/// warm rim. `frost` 0..1 runs frost up the stems.
pub fn reeds<'a>(t: f32, seed: u32, size: f32, frost: f32, flip: f32) -> Svgr<'a> {
    let stems = (0..9u32)
        .map(|k| {
            let base = lerp(-0.5, 0.5, rnd(k, seed)) * size * 0.5;
            let h = size * lerp(0.6, 1.0, rnd(k, seed + 1));
            let lean = lerp(-0.25, 0.35, rnd(k, seed + 2)) * flip;
            let sway = 0.035 * wave(t, 1., rnd(k, seed + 3));
            let pts = (0..=6)
                .map(|j| {
                    let u = j as f32 / 6.;
                    let a = (lean + sway * u) * u;
                    (base * flip + h * a.sin() * u, -h * u)
                })
                .collect::<Vec<_>>();
            let center = spline(&pts, 3);
            let w = size * 0.028;
            let tip = *center.last().unwrap_or(&(0., 0.));
            let cat = if rnd(k, seed + 4) > 0.45 {
                let a = (lean + sway).to_degrees();
                fframes::svgr!(<ellipse cx="0" cy="0" rx={w * 1.5} ry={size * 0.07} fill="#2a1408" transform={format!("translate({:.1} {:.1}) rotate({a:.1})", tip.0, tip.1 + size * 0.09)} />)
            } else {
                Svgr::empty()
            };
            let reach = (frost * 1.25 - 0.25 * rnd(k, seed + 5)).clamp(0., 1.);
            let ice = if reach > 0.01 {
                let front = center[((center.len() - 1) as f32 * reach) as usize];
                let sparks = (0..4u32)
                    .map(|i| {
                        let p = center[((center.len() - 1) as f32 * reach * rnd(i, seed + 20 + k)) as usize];
                        let u = (loop_phase(t) * 2. + rnd(i + 9 * k, seed + 7)).rem_euclid(1.);
                        crystal(p.0 + 3., p.1, size * 0.022, (PI * u).sin().powi(8))
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g>
                        <path d={taper(&center, w * 0.9, w * 0.3, reach)} fill="#9ad8ff" opacity="0.35" filter="url(#blur3)" transform={format!("translate({:.1} 0)", -w * 0.4)} />
                        <path d={taper(&center, w * 0.45, w * 0.15, reach)} fill="#f0faff" opacity="0.9" transform={format!("translate({:.1} 0)", -w * 0.45)} />
                        {sparks}
                        {crystal(front.0, front.1, size * 0.04, 0.9 * (1. - reach * reach))}
                    </g>
                )
            } else {
                Svgr::empty()
            };
            fframes::svgr!(
                <g>
                    <path d={taper(&center, w, w * 0.25, 1.)} fill="url(#hm-reed)" />
                    <path d={taper(&center, w * 0.35, w * 0.1, 1.)} fill="#e0a860" opacity="0.45" transform={format!("translate({:.1} 0)", -w * 0.45)} />
                    {cat}
                    {ice}
                </g>
            )
        })
        .collect::<Vec<_>>();
    let blades = (0..7u32)
        .map(|k| {
            let base = lerp(-0.6, 0.6, rnd(k, seed + 40)) * size * 0.45 * flip;
            let h = size * lerp(0.35, 0.7, rnd(k, seed + 41));
            let bend = lerp(-0.6, 0.6, rnd(k, seed + 42)) + 0.05 * wave(t, 1., rnd(k, seed + 43));
            let pts = (0..=6).map(|j| { let u = j as f32 / 6.; (base + h * bend * u * u, -h * u) }).collect::<Vec<_>>();
            fframes::svgr!(<path d={taper(&pts, size * 0.03, 0.5, 1.)} fill="url(#hm-reed)" opacity="0.95" />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{blades}{stems}</g>)
}

/// Letters of a title that grow out of frost, one by one from `at`.
pub fn frost_title<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, text: &'a str, cx: f32, y: f32, size: usize, t: f32, at: f32, stagger: f32) -> Svgr<'a> {
    let (glyphs, total) = letters(frame, ctx, text, size, size as f32 * 0.1, cx);
    let fs = size as f32;
    let face = glyphs
        .iter()
        .enumerate()
        .map(|(i, (c, gx, w))| {
            let dt = t - at - stagger * i as f32;
            if dt <= 0. || c == " " {
                return Svgr::empty();
            }
            // Everything lands on its rest value by the loop start (4.3 to 5 s).
            let settle = ((t - 4.3) / 0.7).clamp(0., 1.);
            let k = lerp((dt / 0.5).min(1.), 1., settle);
            let s = lerp(lerp(0.82, 1., bloom(dt * 0.8).min(1.1)), 1., settle);
            let gcx = gx + w / 2.;
            let blur = (1. - k) * 0.9;
            let shine = (-dt * 2.5).exp() * (1. - settle);
            let sparks = (0..3u32)
                .map(|j| {
                    let u = (loop_phase(t) + rnd(j + 7 * i as u32, 77)).rem_euclid(1.);
                    crystal(gx + w * rnd(j, 31 + i as u32), y - fs * lerp(0.1, 0.7, rnd(j, 41 + i as u32)), fs * 0.06, (PI * u).sin().powi(10) * k)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g transform={format!("translate({gcx:.1} {:.1}) scale({s:.3}) translate({:.1} {:.1})", y - fs * 0.35, -gcx, fs * 0.35 - y)} opacity={k}>
                    <text x={*gx} y={y} font-family="Cinzel" font-weight="900" font-size={size} fill="#9ad8ff" opacity={0.35 + 0.5 * shine} filter="url(#blur8)">{c.clone()}</text>
                    <text x={*gx + 3.} y={y + 4.} font-family="Cinzel" font-weight="900" font-size={size} fill="#06101a" opacity="0.7">{c.clone()}</text>
                    <text x={*gx} y={y} font-family="Cinzel" font-weight="900" font-size={size} fill="url(#hm-title)" stroke="#16304a" stroke-width="1.6" opacity={1. - blur * 0.5}>{c.clone()}</text>
                    {sparks}
                </g>
            )
        })
        .collect::<Vec<_>>();
    let calm = (t - at).clamp(0., 1.);
    fframes::svgr!(
        <g>
            <ellipse cx={cx} cy={y - fs * 0.32} rx={total * 0.62} ry={fs * 0.95} fill="#06121c" opacity={0.45 * calm} filter="url(#blur18)" />
            {face}
        </g>
    )
}

/// A name plate in bone-white letters under a violet glow, on a thin rib of bone.
pub fn bone_plate<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, cx: f32, y: f32, name: &'a str, grow: f32, t: f32) -> Svgr<'a> {
    let (glyphs, total) = letters(frame, ctx, name, 60, 6., cx);
    let n = glyphs.len() as f32;
    let face = glyphs
        .iter()
        .enumerate()
        .map(|(i, (c, gx, w))| {
            let k = ((grow * (n + 4.) - i as f32) / 4.).clamp(0., 1.);
            if k <= 0.01 || c == " " {
                return Svgr::empty();
            }
            let rise = 14. * (1. - k).powi(2);
            let _ = w;
            fframes::svgr!(
                <g opacity={k} transform={format!("translate(0 {rise:.1})")}>
                    <text x={*gx} y={y} font-family="Cinzel" font-weight="900" font-size="60" fill="#b46aff" opacity="0.55" filter="url(#blur8)">{c.clone()}</text>
                    <text x={*gx + 3.} y={y + 4.} font-family="Cinzel" font-weight="900" font-size="60" fill="#08040e" opacity="0.7">{c.clone()}</text>
                    <text x={*gx} y={y} font-family="Cinzel" font-weight="900" font-size="60" fill="url(#hm-ivory-title)" stroke="#2a1838" stroke-width="1.4">{c.clone()}</text>
                </g>
            )
        })
        .collect::<Vec<_>>();
    // The rib under the name grows from the middle, with small knuckles.
    let half = (total / 2. + 30.) * grow.min(1.);
    let knobs = (0..9)
        .map(|k| {
            let u = (k as f32 - 4.) / 4.;
            let x = cx + u * half;
            fframes::svgr!(<circle cx={x} cy={y + 24.} r={3.2 + 1.2 * (1. - u.abs())} fill="#efe4cc" opacity={grow.min(1.)} />)
        })
        .collect::<Vec<_>>();
    let shimmer = 0.5 + 0.2 * wave(t, 1., 0.);
    fframes::svgr!(
        <g>
            <ellipse cx={cx} cy={y - 18.} rx={total * 0.62} ry="66" fill="#0a0410" opacity={0.6 * grow.min(1.)} filter="url(#blur18)" />
            <path d={format!("M{:.1} {:.1} Q{cx:.1} {:.1} {:.1} {:.1}", cx - half, y + 26., y + 18., cx + half, y + 26.)} stroke="#b46aff" stroke-width="8" fill="none" opacity={shimmer * grow.min(1.)} filter="url(#blur8)" />
            <path d={format!("M{:.1} {:.1} Q{cx:.1} {:.1} {:.1} {:.1}", cx - half, y + 26., y + 18., cx + half, y + 26.)} stroke="#efe4cc" stroke-width="3" fill="none" stroke-linecap="round" opacity={grow.min(1.)} />
            {knobs}
            {face}
        </g>
    )
}

/// A cut-out figure from card art, its feet at (x, y) and `h` pixels tall.
/// `filter` re-lights it for the shot.
pub fn figure<'a>(img: &fframes::media::ImageData<'_>, size: (f32, f32), x: f32, y: f32, h: f32, flip: bool, filter: &'static str, opacity: f32) -> Svgr<'a> {
    if opacity <= 0.005 {
        return Svgr::empty();
    }
    let w = size.0 * h / size.1;
    let flip_t = if flip { format!("translate({:.1} 0) scale(-1 1) translate({:.1} 0)", x, -x) } else { String::new() };
    fframes::svgr!(
        <g transform={flip_t} opacity={opacity.min(1.)}>
            <image href={img.href()} x={x - w / 2.} y={y - h} width={w} height={h} filter={filter} />
        </g>
    )
}

/// A long bone, from a to b, with knuckles at both ends.
pub fn bone<'a>(a: (f32, f32), b: (f32, f32), w: f32) -> Svgr<'a> {
    let d = format!("M{:.1} {:.1} L{:.1} {:.1}", a.0, a.1, b.0, b.1);
    fframes::svgr!(
        <g>
            <path d={d.clone()} stroke="#5a4a3a" stroke-width={w + 3.} stroke-linecap="round" />
            <path d={d} stroke="url(#hm-ivory-h)" stroke-width={w} stroke-linecap="round" />
            <circle cx={a.0 - w * 0.35} cy={a.1} r={w * 0.62} fill="#efe4cc" stroke="#5a4a3a" stroke-width="1.5" />
            <circle cx={a.0 + w * 0.35} cy={a.1} r={w * 0.62} fill="#efe4cc" stroke="#5a4a3a" stroke-width="1.5" />
            <circle cx={b.0 - w * 0.35} cy={b.1} r={w * 0.62} fill="#e2d6bc" stroke="#5a4a3a" stroke-width="1.5" />
            <circle cx={b.0 + w * 0.35} cy={b.1} r={w * 0.62} fill="#e2d6bc" stroke="#5a4a3a" stroke-width="1.5" />
        </g>
    )
}

/// A hand of bone at the wrist (origin), fingers along +x, rotated by `angle`
/// degrees. `curl` 0 is open, 1 is a fist; `spread` fans the fingers.
pub fn bone_hand<'a>(x: f32, y: f32, angle: f32, curl: f32, spread: f32, scale: f32) -> Svgr<'a> {
    let fingers = [(-7.5, 20.), (-2.5, 24.), (2.5, 22.), (7., 17.)]
        .iter()
        .enumerate()
        .map(|(i, &(fy, len))| {
            let fan = (i as f32 - 1.5) * 0.12 * spread;
            let a1 = fan + curl * 0.6;
            let a2 = a1 + curl * 0.9;
            let a3 = a2 + curl * 0.8;
            let p0 = (16., fy);
            let p1 = (p0.0 + a1.cos() * len * 0.45, p0.1 + a1.sin() * len * 0.45);
            let p2 = (p1.0 + a2.cos() * len * 0.33, p1.1 + a2.sin() * len * 0.33);
            let p3 = (p2.0 + a3.cos() * len * 0.25, p2.1 + a3.sin() * len * 0.25);
            let d = format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}", p0.0, p0.1, p1.0, p1.1, p2.0, p2.1, p3.0, p3.1);
            fframes::svgr!(
                <g>
                    <path d={d.clone()} stroke="#3e3024" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <path d={d} stroke="#f0e6cf" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    <circle cx={p1.0} cy={p1.1} r="2.3" fill="#fffaf0" />
                    <circle cx={p2.0} cy={p2.1} r="1.9" fill="#fffaf0" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    let ta = -1.0 + curl * 0.9;
    let thumb = format!("M5 -8 L{:.1} {:.1} L{:.1} {:.1}", 5. + ta.cos() * 10., -8. + ta.sin() * 10., 5. + ta.cos() * 10. + (ta + 0.5).cos() * 8., -8. + ta.sin() * 10. + (ta + 0.5).sin() * 8.);
    fframes::svgr!(
        <g transform={format!("translate({x:.1} {y:.1}) rotate({angle:.1}) scale({scale:.3})")}>
            <path d="M-2 -6 C4 -10 14 -10 17 -8 L17 8 C12 10 4 9 -2 6Z" fill="#e8dcc0" stroke="#3e3024" stroke-width="1.8" />
            <path d="M3 -5 L15 -6 M3 0 L15 -1 M3 5 L15 5" stroke="#9a8a6a" stroke-width="1" />
            <path d={thumb.clone()} stroke="#3e3024" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            <path d={thumb} stroke="#f0e6cf" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            {fingers}
        </g>
    )
}

/// One arm of the Queen: the elbow and the wrist relative to her mask, the
/// hand angle in degrees and the curl of the fingers.
#[derive(Clone, Copy)]
pub struct Arm {
    pub elbow: (f32, f32),
    pub wrist: (f32, f32),
    pub hand: f32,
    pub curl: f32,
}

/// The pose of Queen Marrow, in units around the center of her mask.
#[derive(Clone, Copy)]
pub struct Queen {
    pub tilt: f32,
    pub head: (f32, f32),
    pub eyes: f32,
    pub smile: f32,
    pub glow: f32,
    pub arms: [Arm; 2],
    pub seated: bool,
    pub billow: f32,
}

impl Queen {
    /// Bored on the throne: chin on her right hand, the left hand on the armrest.
    pub fn bored(t: f32) -> Self {
        let tap = (wave(t, 4., 0.).max(0.)).powi(3);
        Self {
            tilt: -9.,
            head: (6., 4.),
            eyes: 0.6,
            smile: 0.,
            glow: 0.8,
            arms: [
                Arm { elbow: (-84., 236.), wrist: (-16., 74.), hand: -78., curl: 0.55 },
                Arm { elbow: (96., 214.), wrist: (152., 232.), hand: 20. + 14. * tap, curl: 0.35 },
            ],
            seated: true,
            billow: 0.,
        }
    }
    /// Both hands on the armrests.
    pub fn throne(t: f32) -> Self {
        Self {
            tilt: 0.,
            head: (0., 0.),
            eyes: 1.,
            smile: 0.,
            glow: 1.,
            arms: [
                Arm { elbow: (-96., 214.), wrist: (-152., 232.), hand: 160. - 6. * wave(t, 1., 0.3), curl: 0.4 },
                Arm { elbow: (96., 214.), wrist: (152., 232.), hand: 20. + 6. * wave(t, 1., 0.6), curl: 0.4 },
            ],
            seated: true,
            billow: 0.,
        }
    }
}

/// The mask of bone with green light in the eye sockets, and the crown.
fn queen_head<'a>(p: &Queen, t: f32) -> Svgr<'a> {
    let h = 6.5 * p.eyes.max(0.08);
    let lift = p.smile * 5.;
    let socket = |cx: f32, dir: f32| {
        let (x0, x1) = (cx - 11. * dir, cx + 9. * dir);
        let d = format!(
            "M{x0:.1} {:.1} Q{cx:.1} {:.1} {x1:.1} {:.1} Q{cx:.1} {:.1} {x0:.1} {:.1}Z",
            -2. + lift * 0.3, -4. - h - lift, -6. + lift * 0.3, -2. + h - lift * 1.8, -2. + lift * 0.3
        );
        let glow = p.glow * (0.88 + 0.12 * wave(t, 1., cx * 0.01));
        fframes::svgr!(
            <g>
                <path d={d} fill="#0e0616" stroke="#4a3a2e" stroke-width="1" />
                <circle cx={cx} cy={-3. - lift * 0.4} r={8. + 6. * glow.min(2.)} fill="url(#hm-eye)" opacity={(0.55 * glow).min(0.9)} />
                <ellipse cx={cx} cy={-3. - lift * 0.4} rx={2.8 * p.eyes.max(0.4)} ry={2.2 * p.eyes.max(0.3)} fill="#f0fff4" opacity={glow.min(1.)} />
            </g>
        )
    };
    let tines = [(-26., 26.), (-18., 40.), (-9., 54.), (0., 74.), (9., 54.), (18., 40.), (26., 26.)]
        .iter()
        .map(|&(x, l)| {
            let lean = x * 0.3;
            let d = format!("M{:.1} -54 Q{:.1} {:.1} {:.1} {:.1} Q{:.1} {:.1} {:.1} -54Z", x - 4., x - 3. + lean * 0.4, -54. - l * 0.5, x + lean, -54. - l, x + 3. + lean * 0.4, -54. - l * 0.5, x + 4.);
            fframes::svgr!(<path d={d} fill="url(#hm-ivory-h)" stroke="#4a3a2e" stroke-width="1.2" stroke-linejoin="round" />)
        })
        .collect::<Vec<_>>();
    let mouth = format!("M-7 33 Q0 {:.1} 7 33", 33. + 3.5 * p.smile);
    fframes::svgr!(
        <g>
            <path d="M0 -58 C30 -58 38 -30 36 -2 C34 26 20 50 0 62 C-20 50 -34 26 -36 -2 C-38 -30 -30 -58 0 -58Z" fill="url(#hm-mask)" stroke="#5a4a38" stroke-width="1.4" />
            <path d="M0 -58 C30 -58 38 -30 36 -2 C34 26 20 50 0 62 C14 40 22 10 18 -20 C14 -44 8 -56 0 -58Z" fill="#3a2a48" opacity="0.32" />
            <path d="M-27 -16 Q-15 -24 -3 -17 M27 -16 Q15 -24 3 -17" stroke="#8a7a5a" stroke-width="1.4" fill="none" />
            <path d="M0 -8 L-2 16 Q0 20 3 16" stroke="#8a7a5a" stroke-width="1.2" fill="none" />
            <path d="M-24 18 Q-20 32 -10 44 M24 18 Q20 32 10 44" stroke="#b8a888" stroke-width="1" fill="none" opacity="0.7" />
            <path d={mouth} stroke="#5a4a38" stroke-width="1.5" fill="none" stroke-linecap="round" />
            {socket(-15., 1.)}
            {socket(15., -1.)}
            <path d="M-32 -50 Q0 -64 32 -50 L30 -56 Q0 -70 -30 -56Z" fill="url(#hm-ivory-h)" stroke="#4a3a2e" stroke-width="1.2" />
            {tines}
            <circle cx="0" cy="-60" r={3.5 + 1.2 * p.glow.min(2.)} fill="#a8ffc0" stroke="#1a5a2a" stroke-width="1" />
            <circle cx="0" cy="-60" r="10" fill="url(#hm-eye)" opacity={(0.5 * p.glow).min(0.8)} />
        </g>
    )
}

/// One sleeve and hand of the Queen, with a cool rim from the window behind her.
fn queen_arm<'a>(shoulder: (f32, f32), a: &Arm) -> Svgr<'a> {
    let pts = spline(&[shoulder, a.elbow, a.wrist], 6);
    let sleeve = taper(&pts, 20., 38., 1.);
    fframes::svgr!(
        <g>
            <path d={sleeve.clone()} fill="#bfe6ff" opacity="0.55" transform="translate(2.5 -2.5)" />
            <path d={sleeve} fill="url(#hm-robe-dark)" stroke="#0c0414" stroke-width="1.5" />
            <path d={taper(&pts, 6., 4., 1.)} fill="#9a6ad0" opacity="0.25" />
            <circle cx={a.wrist.0} cy={a.wrist.1} r="15" fill="none" stroke="#e8dcc4" stroke-width="2.5" opacity="0.8" />
            {bone_hand(a.wrist.0, a.wrist.1, a.hand, a.curl, 1., 1.4)}
        </g>
    )
}

/// Queen Marrow: tall and thin, a crown of bone, violet robes, a calm mask of
/// bone. The origin is the center of her mask; she is about 800 units tall.
pub fn queen<'a>(p: &Queen, t: f32) -> Svgr<'a> {
    let b = p.billow;
    let sway = 3. * wave(t, 1., 0.15) + 14. * b * wave(t, 2., 0.4);
    // A halo of thin bone spines rises behind her head.
    let collar = (0..15)
        .map(|k| {
            let a = lerp(-PI * 0.96, -PI * 0.04, k as f32 / 14.);
            let l = 150. + 50. * (1. - (k as f32 - 7.).abs() / 7.);
            let pts = [(a.cos() * 30., 60. + a.sin() * 30.), (a.cos() * l * 0.55, 60. + a.sin() * l * 0.55), (a.cos() * l, 60. + a.sin() * l)];
            fframes::svgr!(<path d={taper(&pts, 4.5, 1., 1.)} fill="url(#hm-ivory-h)" stroke="#4a3a2e" stroke-width="0.8" opacity={0.65 + 0.3 * (1. - (k as f32 - 7.).abs() / 7.)} />)
        })
        .collect::<Vec<_>>();
    let skirt = if p.seated {
        "M-34 250 C-60 270 -88 300 -96 336 C-114 400 -122 470 -136 548 L136 548 C122 470 114 400 96 336 C88 300 60 270 34 250Z".to_string()
    } else {
        format!(
            "M-34 250 C-74 360 -{:.1} 560 -{:.1} 760 C-70 776 70 776 {:.1} 760 C{:.1} 560 74 360 34 250Z",
            124. + 20. * b, 176. + 40. * b - sway, 176. + 30. * b + sway, 124. + 14. * b
        )
    };
    let folds = if p.seated {
        "M-62 330 C-72 420 -78 480 -88 544 M-22 300 C-26 400 -24 470 -30 546 M22 300 C26 400 24 470 30 546 M62 330 C72 420 78 480 88 544"
    } else {
        "M-56 340 C-84 480 -104 620 -124 756 M-18 300 C-24 480 -22 620 -30 766 M18 300 C24 480 22 620 30 766 M56 340 C84 480 104 620 124 756"
    };
    let bodice = "M-62 96 C-56 160 -40 210 -34 252 L34 252 C40 210 56 160 62 96 C40 82 -40 82 -62 96Z";
    let ribs = (0..5)
        .map(|k| {
            let y = 128. + 24. * k as f32;
            let w = 40. - 3. * k as f32;
            fframes::svgr!(<path d={format!("M-4 {y:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} M4 {y:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", -w * 0.5, y - 6., -w, y, -w * 0.9, y + 12., w * 0.5, y - 6., w, y, w * 0.9, y + 12.)} stroke="#e8dcc4" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0.85" />)
        })
        .collect::<Vec<_>>();
    let veil = format!(
        "M-34 -56 C-62 -20 -70 60 -84 140 C-96 220 -{:.1} 300 -{:.1} 380 L{:.1} 380 C{:.1} 300 96 220 84 140 C70 60 62 -20 34 -56Z",
        104. + 6. * b, 116. + 10. * b + sway * 0.5, 116. + 10. * b - sway * 0.5, 104. + 6. * b
    );
    fframes::svgr!(
        <g>
            <path d={veil.clone()} fill="#bfe6ff" opacity="0.3" transform="translate(3 -2)" />
            <path d={veil} fill="#24103a" opacity="0.82" />
            {collar}
            <path d={skirt.clone()} fill="#bfe6ff" opacity="0.5" transform="translate(3 -3)" />
            <path d={skirt.clone()} fill="url(#hm-robe)" stroke="#0c0414" stroke-width="2" />
            <path d={skirt} fill="url(#hm-robe-shade)" />
            <path d={folds} stroke="#0c0414" stroke-width="3" fill="none" opacity="0.45" />
            <path d={bodice} fill="#bfe6ff" opacity="0.5" transform="translate(3 -3)" />
            <path d={bodice} fill="url(#hm-robe)" stroke="#0c0414" stroke-width="2" />
            <path d={bodice} fill="url(#hm-robe-shade)" />
            <path d="M0 98 L0 250" stroke="#e8dcc4" stroke-width="3" opacity="0.8" />
            {ribs}
            <path d="M-34 252 C-12 262 12 262 34 252" stroke="#e8dcc4" stroke-width="3" fill="none" />
            <circle cx="0" cy="104" r="6" fill="#7aff9e" stroke="#e8dcc4" stroke-width="2" />
            <circle cx="0" cy="104" r="16" fill="url(#hm-eye)" opacity={(0.35 * p.glow).min(0.6)} />
            <path d="M-9 50 L-9 96 L9 96 L9 50Z" fill="#1a0e22" />
            {queen_arm((-58., 104.), &p.arms[0])}
            <g transform={format!("translate({:.1} {:.1}) rotate({:.1} 0 64)", p.head.0, p.head.1, p.tilt)}>{queen_head(p, t)}</g>
            {queen_arm((58., 104.), &p.arms[1])}
        </g>
    )
}

/// The throne of bone behind a seated Queen, in her units: a fan of curved ribs
/// on a spine of bone, backlit by the window.
pub fn throne<'a>() -> Svgr<'a> {
    let ribs = (0..7)
        .flat_map(|k| [(k, -1.), (k, 1.)])
        .map(|(k, side)| {
            let y0 = 330. - 82. * k as f32;
            let reach = 150. - 9. * k as f32;
            let pts = [(side * 6., y0), (side * reach * 0.7, y0 - 26.), (side * reach, y0 - 80.), (side * reach * 0.84, y0 - 150.)];
            let c = spline(&pts, 5);
            fframes::svgr!(
                <g>
                    <path d={taper(&c, 16., 6., 1.)} fill="#0c0814" opacity="0.6" transform="translate(4 6)" />
                    <path d={taper(&c, 14., 5., 1.)} fill="url(#hm-ivory-v)" stroke="#3a2e26" stroke-width="1.4" />
                    <path d={taper(&c, 4., 1.5, 1.)} fill="#fffaf0" opacity="0.6" transform={format!("translate({:.1} -2)", -side * 2.)} />
                </g>
            )
        })
        .collect::<Vec<_>>();
    let spine = (0..13)
        .map(|k| {
            let y = 340. - 50. * k as f32;
            let w = 15. - 0.4 * k as f32;
            fframes::svgr!(<rect x={-w} y={y - 20.} width={w * 2.} height="38" rx="10" fill="url(#hm-ivory-h)" stroke="#3a2e26" stroke-width="1.6" />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <path d="M-210 360 C-220 0 -140 -300 0 -330 C140 -300 220 0 210 360Z" fill="#0c0814" opacity="0.55" filter="url(#blur8)" />
            {spine}
            {ribs}
            <path d="M-60 -300 Q0 -380 60 -300 Q0 -334 -60 -300Z" fill="url(#hm-ivory-h)" stroke="#3a2e26" stroke-width="1.6" />
            <circle cx="0" cy="-322" r="9" fill="#7aff9e" stroke="#e8dcc4" stroke-width="2" />
            <circle cx="0" cy="-322" r="30" fill="url(#hm-eye)" opacity="0.5" />
            {bone((-186., 236.), (-96., 236.), 22.)}
            {bone((96., 236.), (186., 236.), 22.)}
            <path d="M-160 300 L160 300 L180 446 L-180 446Z" fill="url(#hm-ivory-v)" stroke="#3a2e26" stroke-width="2.5" />
            <path d="M-160 300 L160 300 L180 446 L-180 446Z" fill="url(#hm-seat-shade)" />
            <path d="M-160 300 L160 300" stroke="#fff8e8" stroke-width="2" opacity="0.7" />
        </g>
    )
}

/// A pointed rib arch on the floor at `floor`, centered on `cx`: a dark, backlit
/// band of vertebrae with a pale rim on its inner edge.
pub fn rib<'a>(cx: f32, floor: f32, w: f32, h: f32, thick: f32, shade: f32) -> Svgr<'a> {
    let arch = |w: f32, h: f32| {
        format!(
            "M{:.1} {floor:.1} C{:.1} {:.1} {:.1} {:.1} {cx:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {floor:.1}",
            cx - w, cx - w, floor - h * 0.7, cx - w * 0.45, floor - h * 0.98, floor - h, cx + w * 0.45, floor - h * 0.98, cx + w, floor - h * 0.7, cx + w
        )
    };
    let mid = arch(w, h);
    let inner = arch(w - thick * 0.38, h - thick * 0.38);
    let lit = 1. - 0.6 * shade.min(1.);
    fframes::svgr!(
        <g>
            <path d={mid.clone()} stroke="#0a0610" stroke-width={thick * 1.1} fill="none" opacity="0.5" transform={format!("translate({:.1} {:.1})", thick * 0.15, thick * 0.2)} />
            <path d={mid.clone()} stroke="url(#hm-rib)" stroke-width={thick} fill="none" />
            <path d={mid} stroke="#0a0610" stroke-width={thick * 1.02} fill="none" stroke-dasharray={format!("{:.1} {:.1}", thick * 0.08, thick * 0.62)} opacity="0.75" />
            <path d={inner} stroke="#f4ead2" stroke-width={thick * 0.16} fill="none" opacity={0.8 * lit} />
        </g>
    )
}

/// A tall lancet window, its bottom center at (x, y).
pub fn lancet(x: f32, y: f32, w: f32, h: f32) -> String {
    format!(
        "M{:.1} {y:.1} L{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {x:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} L{:.1} {y:.1}Z",
        x - w / 2., x - w / 2., y - h + w * 0.7, x - w / 2., y - h + w * 0.2, x - w * 0.15, y - h, y - h,
        x + w * 0.15, y - h, x + w / 2., y - h + w * 0.2, x + w / 2., y - h + w * 0.7, x + w / 2.
    )
}

/// A wisp of ice-blue light with a trail; `trail` lists older positions.
pub fn wisp<'a>(x: f32, y: f32, r: f32, t: f32, trail: &[(f32, f32)], alpha: f32) -> Svgr<'a> {
    if alpha <= 0.01 {
        return Svgr::empty();
    }
    let n = trail.len().max(1) as f32;
    let tail = trail
        .iter()
        .enumerate()
        .map(|(i, &(tx, ty))| {
            let k = 1. - i as f32 / n;
            fframes::svgr!(<circle cx={tx} cy={ty} r={r * (0.25 + 0.6 * k)} fill="url(#hm-wisp)" opacity={alpha * 0.55 * k} />)
        })
        .collect::<Vec<_>>();
    let f = 0.85 + 0.15 * wave(t, 6., 0.2);
    fframes::svgr!(
        <g>
            {tail}
            <circle cx={x} cy={y} r={r * 3. * f} fill="url(#hm-wisp)" opacity={alpha * 0.7} />
            <circle cx={x} cy={y} r={r * 0.55} fill="#f4fdff" opacity={alpha} />
        </g>
    )
}

/// An iron chain along a curve of points, with links that turn.
pub fn chain<'a>(pts: &[(f32, f32)], link: f32, shine: f32) -> Svgr<'a> {
    let track = Track::new(pts.to_vec());
    let count = (track.total() / (link * 0.85)).max(1.) as usize;
    let links = (0..count)
        .map(|i| {
            let u = (i as f32 + 0.5) / count as f32;
            let p = track.at(u);
            let q = track.at((u + 0.01).min(1.));
            let a = (q.1 - p.1).atan2(q.0 - p.0).to_degrees();
            if i % 2 == 0 {
                fframes::svgr!(
                    <g transform={format!("translate({:.1} {:.1}) rotate({a:.1})", p.0, p.1)}>
                        <ellipse rx={link * 0.62} ry={link * 0.36} fill="none" stroke="#0e0c10" stroke-width={link * 0.3} />
                        <ellipse rx={link * 0.62} ry={link * 0.36} fill="none" stroke="url(#hm-iron)" stroke-width={link * 0.18} />
                        <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", -link * 0.3, -link * 0.36, link * 0.2, -link * 0.36)} stroke="#c8f0d0" stroke-width={link * 0.07} opacity={shine} />
                    </g>
                )
            } else {
                fframes::svgr!(
                    <g transform={format!("translate({:.1} {:.1}) rotate({a:.1})", p.0, p.1)}>
                        <rect x={-link * 0.62} y={-link * 0.11} width={link * 1.24} height={link * 0.22} rx={link * 0.1} fill="#2a262e" stroke="#0e0c10" stroke-width={link * 0.06} />
                    </g>
                )
            }
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{links}</g>)
}

/// The Bone Ferry with its ferryman, the bottom of the hull at the origin,
/// about 600 units long, facing left. `refuse` raises the open hand of bone.
pub fn ferry<'a>(t: f32, refuse: f32, lamp: f32) -> Svgr<'a> {
    let rock = 2. * wave(t, 1., 0.1);
    let f = flicker(t, 0.4);
    let raise = refuse.clamp(0., 1.2);
    let hand = (lerp(-40., -120., raise), lerp(-150., -250., raise));
    fframes::svgr!(
        <g transform={format!("rotate({rock:.2})")}>
            <ellipse cx="0" cy="10" rx="330" ry="26" fill="#02060a" opacity="0.5" filter="url(#blur8)" />
            <path d="M-300 -60 C-250 -10 -150 0 0 0 C150 0 250 -14 300 -70 L290 -90 C200 -50 100 -46 0 -46 C-120 -46 -220 -50 -290 -86Z" fill="url(#hm-boat)" stroke="#06080a" stroke-width="3" />
            <path d="M-290 -86 C-220 -50 -120 -46 0 -46 C100 -46 200 -50 290 -90" stroke="#8a7a62" stroke-width="2.5" fill="none" opacity="0.7" />
            <path d="M-300 -60 C-250 -10 -150 0 0 0" stroke="#7aff9e" stroke-width="2" fill="none" opacity={0.4 * lamp} />
            <path d="M-296 -70 C-330 -110 -340 -170 -312 -230 C-322 -170 -312 -120 -280 -86Z" fill="url(#hm-ivory-h)" stroke="#4a3a2e" stroke-width="2" />
            <path d="M-310 -228 C-300 -250 -280 -256 -262 -248" stroke="#e8dcc0" stroke-width="7" fill="none" stroke-linecap="round" />
            <g transform="translate(-262 -246)">{crate::wood::lantern(t, 0.7, lamp, 1.1)}</g>
            <circle cx="-262" cy="-216" r={120. + 30. * f} fill="url(#g-witch)" opacity={0.35 * lamp} />
            <path d="M150 -46 L210 -420" stroke="#2a1e14" stroke-width="7" stroke-linecap="round" />
            <path d="M40 -46 C20 -140 30 -230 60 -300 C70 -330 110 -350 140 -330 C170 -300 176 -230 160 -140 C156 -100 150 -70 150 -46Z" fill="url(#hm-hood)" stroke="#06040a" stroke-width="2.5" />
            <path d="M40 -46 C20 -140 30 -230 60 -300 C70 -330 110 -350 140 -330" stroke="#ffd8a0" stroke-width="2.5" fill="none" opacity="0.55" />
            <path d="M44 -60 C30 -140 34 -200 50 -250" stroke="#7aff9e" stroke-width="3" fill="none" opacity={0.5 * lamp} />
            <path d="M68 -296 C80 -330 128 -338 146 -306 C150 -290 146 -262 136 -248 C120 -236 88 -238 76 -250 C66 -264 64 -282 68 -296Z" fill="url(#hm-mask)" stroke="#4a3a2e" stroke-width="1.6" />
            <path d="M80 -286 Q92 -294 103 -284 Q96 -272 82 -276Z" fill="#120a1a" />
            <path d="M134 -286 Q122 -294 111 -284 Q118 -272 132 -276Z" fill="#120a1a" />
            <circle cx="93" cy="-281" r="2.4" fill="#b8ffd0" />
            <circle cx="121" cy="-281" r="2.4" fill="#b8ffd0" />
            <path d="M107 -270 L103 -262 L111 -262Z" fill="#2a1e18" />
            <path d="M92 -250 Q107 -244 122 -250 M98 -254 L98 -247 M104 -255 L104 -246 M110 -255 L110 -246 M116 -254 L116 -247" stroke="#4a3a2e" stroke-width="1.3" fill="none" />
            <path d="M66 -300 C80 -326 132 -332 148 -300 L146 -284 C120 -296 92 -296 70 -282Z" fill="#06040a" opacity="0.55" />
            <path d="M58 -300 C66 -350 150 -356 160 -296 C150 -240 140 -236 140 -236" stroke="#06040a" stroke-width="10" fill="none" />
            <path d={format!("M130 -200 Q{:.1} {:.1} {:.1} {:.1}", 60., -200., hand.0 + 40., hand.1 + 30.)} stroke="url(#hm-hood)" stroke-width="22" fill="none" stroke-linecap="round" />
            {bone_hand(hand.0 + 30., hand.1 + 20., -100. + 20. * (1. - raise), 0.05, 1.6, 2.2)}
            <path d="M170 -200 Q196 -200 206 -260" stroke="url(#hm-hood)" stroke-width="20" fill="none" stroke-linecap="round" />
            {bone_hand(204., -262., -80., 0.9, 0., 1.6)}
        </g>
    )
}

/// The coin of pale tower stone with a small tower cut into it; `ratio` 1 is
/// face-on. The clue of the Region.
pub fn stone_coin<'a>(r: f32, ratio: f32, rot: f32, shine: f32) -> Svgr<'a> {
    let s = r / 60.;
    let edge = (0..24)
        .map(|k| {
            let a = TAU * k as f32 / 24.;
            let rr = r * (1. + 0.025 * (rnd(k, 811) - 0.5));
            (a.cos() * rr, a.sin() * rr)
        })
        .collect::<Vec<_>>();
    let tower = format!(
        "M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L0 {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z",
        -7. * s, 34. * s, -5. * s, -16. * s, -10. * s, -16. * s, -40. * s, 10. * s, -16. * s, 5. * s, -16. * s, 7. * s, 34. * s
    );
    let thick = r * 0.16 * (1. - ratio).max(0.1);
    fframes::svgr!(
        <g transform={format!("rotate({rot:.1}) scale(1 {ratio:.3})")}>
            <path d={path(&edge, true)} fill="#8a8a92" transform={format!("translate(0 {:.1})", thick / ratio.max(0.05))} />
            <path d={path(&edge, true)} fill="url(#hm-stone)" stroke="#5a5a64" stroke-width={(r * 0.035).max(1.)} />
            <circle r={r * 0.82} fill="none" stroke="#9a9aa6" stroke-width={(r * 0.03).max(0.8)} />
            <path d={tower.clone()} fill="#6a6a78" transform={format!("translate({:.1} {:.1})", r * 0.02, r * 0.03)} />
            <path d={tower} fill="#f8f8ff" stroke="#7a7a88" stroke-width={(r * 0.02).max(0.6)} />
            <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", -18. * s, 38. * s, 18. * s, 38. * s)} stroke="#7a7a88" stroke-width={(r * 0.03).max(0.6)} />
            <circle cx={-r * 0.4} cy={-r * 0.45} r={r * 0.3} fill="url(#hm-ice-glow)" opacity={0.5 * shine} />
        </g>
    )
}

/// Heynspire: a tall, thin white stone tower with blue roofs that rises into the
/// clouds, on a white castle. Its base is at the origin; it is `h` units tall.
pub fn heynspire<'a>(t: f32, h: f32, glow: f32) -> Svgr<'a> {
    let w0 = h * 0.036;
    let w1 = h * 0.022;
    let shaft = format!("M{:.1} 0 L{:.1} {:.1} L{:.1} {:.1} L{:.1} 0Z", -w0, -w1, -h, w1, -h, w0);
    let ledges = [0.32, 0.6, 0.84]
        .iter()
        .map(|&u| {
            let y = -h * u;
            let w = lerp(w0, w1, u) * 1.5;
            fframes::svgr!(
                <g>
                    <path d={format!("M{:.1} {y:.1} L{:.1} {y:.1} L{:.1} {:.1} L{:.1} {:.1}Z", -w, w, w * 0.8, y - w * 0.9, -w * 0.8, y - w * 0.9)} fill="url(#hm-roof)" stroke="#0e2448" stroke-width="1" />
                    <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", -w * 0.95, y + 1.5, w * 0.95, y + 1.5)} stroke="#f4f6ff" stroke-width="1.2" opacity="0.7" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    // A long stair winds around the tower.
    let stair = (0..42)
        .map(|k| {
            let u = k as f32 / 42.;
            let y = -h * u * 0.95;
            let w = lerp(w0, w1, u);
            let a = u * TAU * 5.5;
            if a.sin() < 0. {
                return Svgr::empty();
            }
            let x = a.cos() * w;
            fframes::svgr!(<rect x={x - 2.} y={y} width="4" height="1.8" fill="#8a94b0" opacity="0.8" />)
        })
        .collect::<Vec<_>>();
    let windows = (0..14)
        .map(|k| {
            let u = (k as f32 + 0.5) / 14.;
            let y = -h * u;
            let x = lerp(w0, w1, u) * lerp(-0.4, 0.4, rnd(k, 901));
            let on = 0.6 + 0.4 * wave(t, 1., rnd(k, 902));
            fframes::svgr!(<rect x={x - 1.6} y={y - 3.} width="3.2" height="5" rx="1.4" fill="#ffe2a0" opacity={glow * on} />)
        })
        .collect::<Vec<_>>();
    let stones = (0..7)
        .map(|k| {
            let a = TAU * (k as f32 / 7. + loop_phase(t) * 0.25);
            let r = w1 * lerp(2.4, 4.0, rnd(k, 911));
            let y = -h * lerp(0.86, 0.98, rnd(k, 912)) + 4. * wave(t, 1., rnd(k, 913));
            let x = a.cos() * r;
            let front = a.sin() > 0.;
            let s = lerp(3., 6., rnd(k, 914));
            fframes::svgr!(<path d={crate::mesa::stone(k + 920, s)} transform={format!("translate({x:.1} {y:.1})")} fill={if front { "#eef0fa" } else { "#9aa2c0" }} stroke="#4a5070" stroke-width="0.8" />)
        })
        .collect::<Vec<_>>();
    let turret = |x: f32, hh: f32, ww: f32| {
        fframes::svgr!(
            <g>
                <rect x={x - ww / 2.} y={-hh} width={ww} height={hh} fill="url(#hm-tower)" stroke="#6a7090" stroke-width="1" />
                <path d={format!("M{:.1} {:.1} L{x:.1} {:.1} L{:.1} {:.1}Z", x - ww * 0.65, -hh, -hh - ww * 1.5, x + ww * 0.65, -hh)} fill="url(#hm-roof)" stroke="#0e2448" stroke-width="1" />
                <rect x={x - 1.5} y={-hh * 0.6} width="3" height="5" fill="#ffe2a0" opacity={glow} />
            </g>
        )
    };
    fframes::svgr!(
        <g>
            <circle cx="0" cy={-h * 0.5} r={h * 0.5} fill="url(#hm-tower-halo)" opacity={0.55 * glow} />
            <path d={shaft} fill="url(#hm-tower)" stroke="#6a7090" stroke-width="1.2" />
            {stair}
            {ledges}
            {windows}
            {stones}
            <path d={format!("M{:.1} 0 L{:.1} {:.1} L{:.1} {:.1} L{:.1} 0Z", -w0 * 3.4, -w0 * 3.4, -h * 0.045, w0 * 3.4, -h * 0.045, w0 * 3.4)} fill="url(#hm-tower)" stroke="#6a7090" stroke-width="1" />
            {turret(-w0 * 2.9, h * 0.075, w0 * 0.9)}
            {turret(w0 * 2.9, h * 0.07, w0 * 0.9)}
        </g>
    )
}

/// Snow that spirals in toward a center: the Blizzard of Queen Marrow.
pub fn snow_spiral<'a>(cx: f32, cy: f32, t: f32, alpha: f32, count: u32, seed: u32, reach: f32) -> Svgr<'a> {
    if alpha <= 0.01 {
        return Svgr::empty();
    }
    let flakes = (0..count)
        .map(|k| {
            let u = (t / LOOP * if k % 3 == 0 { 2. } else { 1. } + rnd(k, seed)).rem_euclid(1.);
            let r = reach * (1. - u) * lerp(0.4, 1.0, rnd(k, seed + 1)) + 20.;
            let a = TAU * (rnd(k, seed + 2) + u * 0.6);
            let (x, y) = (cx + a.cos() * r, cy + a.sin() * r * 0.62);
            let (px, py) = (cx + (a - 0.12).cos() * (r + 18.), cy + (a - 0.12).sin() * (r + 18.) * 0.62);
            let o = alpha * (PI * u).sin().powf(0.6);
            let s = lerp(1., 3.2, rnd(k, seed + 3));
            fframes::svgr!(<path d={format!("M{px:.1} {py:.1} L{x:.1} {y:.1}")} stroke="#f4fbff" stroke-width={s} stroke-linecap="round" opacity={o} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{flakes}</g>)
}

/// Shared static definitions of the Hollow Marches scenes.
pub fn defs<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <defs>
            <radialGradient id="hm-mist">
                <stop offset="0" stop-color="#f2f8ff" stop-opacity="0.95" />
                <stop offset="0.5" stop-color="#d4e6f2" stop-opacity="0.5" />
                <stop offset="1" stop-color="#b8cce0" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hm-mist-teal">
                <stop offset="0" stop-color="#cfeee8" stop-opacity="0.85" />
                <stop offset="0.5" stop-color="#8ac4c0" stop-opacity="0.4" />
                <stop offset="1" stop-color="#5a9a9a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hm-ice-glow">
                <stop offset="0" stop-color="#ffffff" stop-opacity="0.9" />
                <stop offset="0.4" stop-color="#bfe6ff" stop-opacity="0.45" />
                <stop offset="1" stop-color="#6ab0ff" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hm-wisp">
                <stop offset="0" stop-color="#ffffff" stop-opacity="1" />
                <stop offset="0.3" stop-color="#a8e8ff" stop-opacity="0.6" />
                <stop offset="1" stop-color="#3a8aff" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hm-eye">
                <stop offset="0" stop-color="#f0fff4" stop-opacity="1" />
                <stop offset="0.3" stop-color="#6aff96" stop-opacity="0.6" />
                <stop offset="1" stop-color="#0a8a3a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hm-gold-glow">
                <stop offset="0" stop-color="#fff4d0" stop-opacity="1" />
                <stop offset="0.35" stop-color="#ffc060" stop-opacity="0.55" />
                <stop offset="1" stop-color="#ff8a20" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hm-mask" cx="0.36" cy="0.3" r="0.85">
                <stop offset="0" stop-color="#fffdf6" />
                <stop offset="0.5" stop-color="#ece2cc" />
                <stop offset="1" stop-color="#a8987c" />
            </radialGradient>
            <linearGradient id="hm-ivory-h" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#fffaf0" />
                <stop offset="0.5" stop-color="#e6dbc2" />
                <stop offset="1" stop-color="#a8987a" />
            </linearGradient>
            <linearGradient id="hm-ivory-v" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#f6eedc" />
                <stop offset="1" stop-color="#9a8a6e" />
            </linearGradient>
            <linearGradient id="hm-robe" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#7a44b0" />
                <stop offset="0.45" stop-color="#4a2276" />
                <stop offset="1" stop-color="#1e0a32" />
            </linearGradient>
            <linearGradient id="hm-robe-dark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#5a3088" />
                <stop offset="1" stop-color="#1a0828" />
            </linearGradient>
            <linearGradient id="hm-hood" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#3a3448" />
                <stop offset="0.6" stop-color="#1a1624" />
                <stop offset="1" stop-color="#08060c" />
            </linearGradient>
            <linearGradient id="hm-boat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3a3028" />
                <stop offset="1" stop-color="#0c0a08" />
            </linearGradient>
            <linearGradient id="hm-iron" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#9aa0a8" />
                <stop offset="1" stop-color="#2a2a30" />
            </linearGradient>
            <radialGradient id="hm-stone" cx="0.36" cy="0.3" r="0.85">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset="0.5" stop-color="#d8d8e2" />
                <stop offset="1" stop-color="#9a9aa8" />
            </radialGradient>
            <linearGradient id="hm-tower" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset="0.45" stop-color="#e8ecf8" />
                <stop offset="1" stop-color="#9aa2c4" />
            </linearGradient>
            <linearGradient id="hm-roof" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#6aa8ff" />
                <stop offset="0.5" stop-color="#2a64c8" />
                <stop offset="1" stop-color="#143a80" />
            </linearGradient>
            <radialGradient id="hm-tower-halo">
                <stop offset="0" stop-color="#fff6e0" stop-opacity="0.5" />
                <stop offset="0.5" stop-color="#ffd8a0" stop-opacity="0.15" />
                <stop offset="1" stop-color="#ffb860" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="hm-title" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset="0.5" stop-color="#d6f0ff" />
                <stop offset="1" stop-color="#6aa8d8" />
            </linearGradient>
            <linearGradient id="hm-ivory-title" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fffdf4" />
                <stop offset="0.55" stop-color="#ece0c4" />
                <stop offset="1" stop-color="#a8946e" />
            </linearGradient>
            <linearGradient id="hm-under" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2a6a80" />
                <stop offset="0.5" stop-color="#0e3444" />
                <stop offset="1" stop-color="#04121a" />
            </linearGradient>
            <linearGradient id="hm-ice-sheet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#e8f6ff" />
                <stop offset="0.6" stop-color="#9ccbe8" />
                <stop offset="1" stop-color="#4a8aa8" />
            </linearGradient>
            <linearGradient id="hm-glass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffe6b0" />
                <stop offset="0.5" stop-color="#bfe0d8" />
                <stop offset="1" stop-color="#5a8a98" />
            </linearGradient>
            <linearGradient id="hm-floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#8a8090" />
                <stop offset="1" stop-color="#2a2232" />
            </linearGradient>
            <linearGradient id="hm-reed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#5a5a32" />
                <stop offset="0.5" stop-color="#2e3018" />
                <stop offset="1" stop-color="#121408" />
            </linearGradient>
            <linearGradient id="hm-top-calm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#06101a" stop-opacity="0.7" />
                <stop offset="1" stop-color="#06101a" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="hm-dawn-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3a4a7a" />
                <stop offset="0.5" stop-color="#b08aa8" />
                <stop offset="0.85" stop-color="#ffc890" />
                <stop offset="1" stop-color="#ffe0b0" />
            </linearGradient>
            <linearGradient id="hm-window-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#5a7a9a" />
                <stop offset="0.6" stop-color="#a8c8d0" />
                <stop offset="1" stop-color="#d8ece4" />
            </linearGradient>
            <linearGradient id="hm-side-glass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2a6a4a" stop-opacity="0.2" />
                <stop offset="1" stop-color="#0a2a1a" stop-opacity="0.6" />
            </linearGradient>
            <radialGradient id="hm-hall-vignette" cx="0.5" cy="0.45" r="0.75">
                <stop offset="0.5" stop-color="#05030a" stop-opacity="0" />
                <stop offset="1" stop-color="#05030a" stop-opacity="0.8" />
            </radialGradient>
            <radialGradient id="hm-violet-bokeh">
                <stop offset="0" stop-color="#d8b8ff" stop-opacity="0.9" />
                <stop offset="0.5" stop-color="#8a4aff" stop-opacity="0.35" />
                <stop offset="1" stop-color="#4a1a9a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="hm-dark-hall" cx="0.65" cy="0.4" r="0.8">
                <stop offset="0" stop-color="#2a2a3a" />
                <stop offset="0.6" stop-color="#140e20" />
                <stop offset="1" stop-color="#06040a" />
            </radialGradient>
            <linearGradient id="hm-robe-shade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#05020a" stop-opacity="0.55" />
                <stop offset="0.3" stop-color="#05020a" stop-opacity="0" />
                <stop offset="0.55" stop-color="#d8b0ff" stop-opacity="0.12" />
                <stop offset="1" stop-color="#05020a" stop-opacity="0.65" />
            </linearGradient>
            <linearGradient id="hm-seat-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#05020a" stop-opacity="0" />
                <stop offset="1" stop-color="#05020a" stop-opacity="0.7" />
            </linearGradient>
            <linearGradient id="hm-rib" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#4a3e48" />
                <stop offset="0.5" stop-color="#2a2030" />
                <stop offset="1" stop-color="#140e1a" />
            </linearGradient>
            <radialGradient id="hm-hall-light" cx="0.5" cy="0.42" r="0.3">
                <stop offset="0" stop-color="#05030a" stop-opacity="0" />
                <stop offset="0.45" stop-color="#05030a" stop-opacity="0.35" />
                <stop offset="1" stop-color="#05030a" stop-opacity="0.85" />
            </radialGradient>
            <linearGradient id="hm-rampart-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#6a7a98" />
                <stop offset="0.55" stop-color="#3a3a5a" />
                <stop offset="1" stop-color="#14101e" />
            </linearGradient>
            <filter id="hm-cool" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="0.74 0.08 0.06 0 0  0.06 0.80 0.14 0 0.01  0.10 0.16 0.92 0 0.04  0 0 0 1 0" />
            </filter>
            <filter id="hm-dawn" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="1.04 0.08 0 0 0.04  0.05 0.94 0.02 0 0.02  0.02 0.06 0.8 0 0  0 0 0 1 0" />
            </filter>
            <filter id="hm-frost" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="0.8 0.1 0.1 0 0  0.08 0.86 0.1 0 0.02  0.1 0.14 0.95 0 0.06  0 0 0 1 0" />
            </filter>
            <filter id="hm-ghost" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="0.18 0.1 0 0 0.01  0.2 0.42 0.1 0 0.05  0.2 0.32 0.3 0 0.07  0 0 0 1 0" />
            </filter>
            <filter id="hm-shadow" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="0 0 0 0 0.03  0 0 0 0 0.07  0 0 0 0 0.1  0 0 0 1 0" />
                <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id="hm-fg" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="0.16 0.04 0 0 0.01  0.03 0.17 0.02 0 0.02  0.02 0.05 0.22 0 0.04  0 0 0 1 0" />
            </filter>
            <filter id="hm-dark" color-interpolation-filters="sRGB">
                <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.07  0 0 0 0 0.1  0 0 0 1 0" />
            </filter>
        </defs>
    )
}
