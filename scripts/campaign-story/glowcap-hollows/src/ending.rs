//! Ending: the roots let go, two seals, the amber, the First Gardener, the Thornwood.
use crate::fx::*;
use crate::hollows::*;
use crate::mesa::{after, burst, cut_seal, flash, glowcap};
use crate::CLIP_FRAMES;
use fframes::{Duration, FFramesContext, Frame, Scene, Shader, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const SUN: (f32, f32, f32) = (1.0, 0.88, 0.62);
const AMBER_DEEP: (f32, f32, f32) = (0.42, 0.14, 0.02);
const AMBER_LIGHT: (f32, f32, f32) = (1.0, 0.82, 0.42);

/// Leaves (or petals) that fall and turn, once per LOOP; seamless by construction.
fn falling<'a>(t: f32, alpha: f32, count: u32, seed: u32, fill: &'static str, size: f32) -> Svgr<'a> {
    if alpha <= 0. {
        return Svgr::empty();
    }
    let leaves = (0..count)
        .map(|k| {
            let u = (t / LOOP + rnd(k, seed)).rem_euclid(1.);
            let x = lerp(-40., 1320., rnd(k, seed + 1)) + 50. * (TAU * (u * 2. + rnd(k, seed + 2))).sin();
            let y = lerp(-40., 760., u);
            let spin = 360. * u * if rnd(k, seed + 3) > 0.5 { 1. } else { -1. } + 180. * rnd(k, seed + 4);
            let flip = (TAU * (u * 2. + rnd(k, seed + 5))).cos();
            let s = size * lerp(0.6, 1.2, rnd(k, seed + 6));
            let o = alpha * (PI * u).sin().powf(0.4);
            fframes::svgr!(<path d={leaf(s)} transform={format!("translate({x:.1} {y:.1}) rotate({spin:.0}) scale({flip:.2} 1)")} fill={fill} opacity={o} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{leaves}</g>)
}

// ---------------------------------------------------------------- 1. Roots

/// The roots that hold the field, in screen units: center line, width at the base and the tip.
const ROOTS: [(&[(f32, f32)], f32, f32); 5] = [
    (&[(-60., 600.), (200., 520.), (420., 590.), (640., 500.), (880., 560.)], 78., 14.),
    (&[(1340., 170.), (1080., 250.), (900., 190.), (700., 280.), (520., 220.)], 70., 12.),
    (&[(300., -60.), (350., 140.), (250., 300.), (390., 430.)], 62., 10.),
    (&[(1040., 780.), (990., 600.), (1110., 470.), (1030., 350.)], 66., 12.),
    (&[(-60., 160.), (170., 250.), (280., 150.)], 54., 10.),
];
const LET_GO: [f32; 5] = [0.4, 0.85, 1.3, 1.7, 2.1];
const LADY_AT: f32 = 3.0;

#[derive(Debug)]
pub struct Roots {
    sh: Shaders,
    sun: Anim,
    lower: Anim,
}

impl Roots {
    pub fn new(sh: Shaders) -> Self {
        Self { sh, sun: tw(2.2, 3.6, 0., 1., Easing::EaseOut), lower: tw(LADY_AT + 0.2, LADY_AT + 1.4, 0., 1., Easing::EaseInOut) }
    }
}

impl Scene for Roots {
    fn name(&self) -> &'static str {
        "EndingRoots"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(field) = ctx.get_image("glowcap-hollows.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let sun = frame.animate(&self.sun);
        let p = painting(&self.sh, &frame, field, Grade { gold: 0.2 + 0.3 * sun, dusk: 0.35 * (1. - sun), dark: 0.25 * (1. - sun), ..Default::default() });
        // Each root uncurls toward a straight line, then sinks back into the moss.
        let roots = ROOTS
            .iter()
            .zip(LET_GO)
            .enumerate()
            .map(|(k, ((pts, w0, w1), at))| {
                let rel = after(t, at, 1.1);
                let rel = rel * rel;
                let (a, b) = (pts[0], pts[pts.len() - 1]);
                let tremble = if t < at { 2. * (t * 23. + k as f32).sin() } else { 0. };
                let moved = pts
                    .iter()
                    .enumerate()
                    .map(|(i, &(x, y))| {
                        let u = i as f32 / (pts.len() - 1) as f32;
                        let (sx, sy) = (lerp(a.0, b.0, u), lerp(a.1, b.1, u));
                        (lerp(x, sx, rel * 0.7), lerp(y, sy, rel * 0.7) + tremble + 30. * rel)
                    })
                    .collect::<Vec<_>>();
                let center = spline(&moved, 8);
                let grow = 1. - rel;
                let dust = burst(b.0, b.1, t - at, 0.8, 10, 210 + k as u32, 180., "#8a9a5a");
                let leaves = (0..8u32)
                    .map(|j| {
                        let dt = t - at - 0.1 * rnd(j, k as u32 + 30);
                        if !(0.0..2.2).contains(&dt) {
                            return Svgr::empty();
                        }
                        let p0 = center[(center.len() - 1) * (j as usize + 1) / 9];
                        let x = p0.0 + 40. * (dt * 3. + j as f32).sin() + 20. * dt;
                        let y = p0.1 + 60. * dt + 40. * dt * dt;
                        fframes::svgr!(<path d={leaf(18.)} transform={format!("translate({x:.1} {y:.1}) rotate({:.0})", 200. * dt + 50. * j as f32)} fill="url(#g-leaf)" opacity={1. - dt / 2.2} />)
                    })
                    .collect::<Vec<_>>();
                if grow <= 0.01 {
                    return fframes::svgr!(<g>{leaves}</g>);
                }
                fframes::svgr!(
                    <g>
                        <path d={taper(&center, *w0, *w1, grow)} fill="#000" opacity="0.35" transform="translate(10 18)" filter="url(#blur8)" />
                        {root(&center, *w0, *w1, grow, 0.25)}
                        {dust}
                        {leaves}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let caps = [(50., 58., 46., false), (1208., 533., 90., true), (1216., 25., 30., false), (167., 550., 30., true), (1233., 225., 30., true), (36., 210., 40., false)]
            .iter()
            .enumerate()
            .map(|(i, &(x, y, r, v))| cap_glow(x, y, r * 0.6, v, bloom(t - 3.0 - 0.15 * i as f32).min(1.) * 0.8, t, 400 + i as u32))
            .collect::<Vec<_>>();
        let lower = frame.animate(&self.lower);
        let lady = if t > LADY_AT - 0.6 {
            fframes::svgr!(
                <g opacity={after(t, LADY_AT - 0.6, 0.6)}>
                    <g transform="translate(1150 742) scale(0.66)">{glimmerbough(t, 1. - 0.4 * lower, -30. * lower, 1. - 0.75 * lower)}</g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let motes = Motes { count: 40, seed: 911, area: (0., 0., 1280., 760.), rise: 180., period: LOOP, size: (1., 2.6), sway: 40., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <g transform="scale(0.8)">{p}</g>
                {caps}
                {rays(&self.sh, &frame, (80., -40.), 0.45 * sun, 1.1, SUN)}
                {lady}
                {roots}
                {falling(t, 0.85 * after(t, 1.0, 1.0), 14, 921, "url(#g-leaf)", 16.)}
                {motes.draw(t, 0.6 * sun)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.6" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Seals

const COIN_AT: f32 = 0.75;
/// (from x, x, y, rotation, slide start) of each letter: Snikkit's, then two of hers.
const LETTERS: [(f32, f32, f32, f32, f32); 3] = [(-300., 360., 330., -7., 0.9), (1600., 905., 300., 6., 1.6), (1600., 1010., 470., -3., 2.05)];
const SEAL_AT: [f32; 3] = [2.8, 3.05, 3.3];
const MATCH_AT: f32 = 3.7;
const LW: f32 = 220.;
const LH: f32 = 280.;

#[derive(Debug)]
pub struct Seals {
    drop: Anim,
    slides: Vec<Anim>,
    flash: Anim,
    grain: String,
}

impl Seals {
    pub fn new(_sh: Shaders) -> Self {
        let mut grain = String::new();
        for k in 0..16u32 {
            let y0 = 40. + k as f32 * 46. + lerp(-10., 10., rnd(k, 3));
            let pts = (0..=16).map(|i| (i as f32 * 84. - 20., y0 + 8. * (i as f32 * 0.7 + k as f32).sin())).collect::<Vec<_>>();
            grain.push_str(&smooth(&pts));
        }
        Self {
            drop: tw(COIN_AT - 0.35, COIN_AT, 0., 1., Easing::EaseIn),
            slides: LETTERS.iter().map(|l| tw(l.4, l.4 + 0.5, 0., 1., Easing::EaseOut)).collect(),
            flash: flash(MATCH_AT, 0.16, 0.5),
            grain,
        }
    }
}

impl Scene for Seals {
    fn name(&self) -> &'static str {
        "EndingSeals"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let lamp = 0.85 + 0.15 * wave(t, 1., 0.);
        // The coin drops and rocks.
        let d = frame.animate(&self.drop);
        let dt = t - COIN_AT;
        let rock = if dt > 0. { 12. * (-dt * 3.).exp() * (dt * 14.).sin() } else { 0. };
        let coin = if d > 0. {
            let s = lerp(2.2, 1., d);
            fframes::svgr!(
                <g>
                    <ellipse cx="640" cy="600" rx={56. * s} ry={14. * s} fill="#000" opacity={0.5 * d} filter="url(#blur8)" />
                    <g transform={format!("translate(640 {:.1}) rotate({rock:.1}) scale({s:.3})", lerp(500., 570., d))}>{cracked_coin(52.)}</g>
                    {burst(640., 600., dt, 0.5, 10, 931, 160., "#ffd890")}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Three letters slide in; their seals light in turn and match.
        let mut seal_points = vec![];
        let letters = LETTERS
            .iter()
            .enumerate()
            .map(|(i, &(from, x, y, rot, _))| {
                let k = frame.animate(&self.slides[i]);
                let lx = lerp(from, x, k);
                let a = rot.to_radians();
                let (sx, sy) = (lx - a.sin() * LH * 0.22, y + a.cos() * LH * 0.22);
                seal_points.push((sx, sy));
                // In the hold, the seals glow in turn.
                let turn = 0.75 + 0.25 * wave(t, 1., i as f32 / 3.);
                let seal = bloom(t - SEAL_AT[i]).min(1.2) * turn;
                fframes::svgr!(<g transform={format!("translate({lx:.1} {y}) rotate({rot})")}>{letter(LW, LH, seal, t)}</g>)
            })
            .collect::<Vec<_>>();
        let link_k = after(t, MATCH_AT - 0.15, 0.3);
        let mut chain = seal_points.clone();
        chain.push(seal_points[0]);
        let link = if link_k > 0. {
            let pts = spline(&chain, 10);
            let n = ((pts.len() - 1) as f32 * link_k) as usize;
            let d = path(&pts[..=n.max(1)], false);
            let glow = 0.6 + 0.4 * wave(t, 2., 0.);
            fframes::svgr!(
                <g opacity={glow}>
                    <path d={d.clone()} fill="none" stroke="#b46aff" stroke-width="10" opacity="0.5" filter="url(#blur8)" />
                    <path d={d} fill="none" stroke="#f0dcff" stroke-width="2" opacity="0.8" stroke-dasharray="10 12" stroke-dashoffset={-t * 33.} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let rings = seal_points
            .iter()
            .map(|&(x, y)| {
                let a = (t - MATCH_AT) / 0.8;
                if (0.0..1.0).contains(&a) {
                    fframes::svgr!(<circle cx={x} cy={y} r={20. + 120. * a} fill="none" stroke="#e4c8ff" stroke-width={6. * (1. - a)} opacity={1. - a} />)
                } else {
                    Svgr::empty()
                }
            })
            .collect::<Vec<_>>();
        let smoke = Motes { count: 30, seed: 941, area: (300., 150., 760., 380.), rise: 200., period: LOOP, size: (2., 6.), sway: 20., fill: "url(#g-violet)" };
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="url(#g-table)" />
                <path d={self.grain.as_str()} fill="none" stroke="#120804" stroke-width="2.5" opacity="0.55" />
                <path d={self.grain.as_str()} fill="none" stroke="#8a5a30" stroke-width="1" opacity="0.25" transform="translate(0 3)" />
                <circle cx="150" cy="130" r="760" fill="url(#g-cyan)" opacity={0.22 * lamp} />
                <circle cx="150" cy="130" r="520" fill="url(#g-candle)" opacity={0.5 * lamp} />
                <g transform="translate(150 150)">{glowcap(54., lamp, 0)}</g>
                {coin}
                {letters}
                {link}
                {rings}
                {smoke.draw(t, 0.5 * after(t, SEAL_AT[0], 1.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
                <rect width="1280" height="720" fill="#f0dcff" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Amber

const BOX: (f32, f32) = (640., 470.);
const PUSH_AT: f32 = 1.4;
const MACRO_AT: f32 = 2.4;
const TURN_AT: f32 = 3.2;
/// The amber drop that the camera pushes in on, inside the box.
const PICK: (f32, f32) = (640., 470.);

#[derive(Debug)]
pub struct Amber {
    caustic: Shader,
    lid: Anim,
    push: Anim,
    macro_in: Anim,
    turn: Anim,
}

impl Amber {
    pub fn new(_sh: Shaders) -> Self {
        Self {
            caustic: caustic_shader(),
            lid: tw(0.35, 1.1, 1., -0.4, Easing::EaseInOut),
            push: tw(PUSH_AT, 3.0, 1., 6., Easing::EaseIn),
            macro_in: tw(MACRO_AT, 3.0, 0., 1., Easing::EaseInOut),
            turn: tw(TURN_AT, TURN_AT + 1.2, 0.06, 1., Easing::EaseInOut),
        }
    }
}

/// The big amber drop of the close-up, with slow light moving inside it.
pub fn macro_drop<'a>(caustic_sh: &Shader, frame: &Frame, t: f32, r: f32, turn: f32) -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <defs><clipPath id="gh-drop"><circle cx="640" cy="360" r={r * 0.92} /></clipPath></defs>
            <g transform="translate(640 360)">{amber(r, turn, t, 970)}</g>
            <g clip-path="url(#gh-drop)" opacity="0.3">{caustic(caustic_sh, frame, 2.0, AMBER_DEEP, AMBER_LIGHT, 0.7, (640. - r, 360. - r, 2. * r, 2. * r))}</g>
            <g transform="translate(640 360)" opacity="0.9">
                <ellipse cx={-r * 0.36} cy={-r * 0.42} rx={r * 0.26} ry={r * 0.12} transform={format!("rotate(-32 {:.1} {:.1})", -r * 0.36, -r * 0.42)} fill="#fffbe8" opacity="0.45" />
            </g>
        </g>
    )
}

impl Scene for Amber {
    fn name(&self) -> &'static str {
        "EndingAmber"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let lid = frame.animate(&self.lid);
        let open = (1. - lid).clamp(0., 1.4) / 1.4;
        let push = frame.animate(&self.push);
        let macro_in = frame.animate(&self.macro_in);
        let (bx, by) = BOX;
        let drops = (0..9u32)
            .map(|k| {
                let (i, j) = ((k % 3) as f32 - 1., (k / 3) as f32 - 1.);
                let (x, y) = (bx + i * 104. + lerp(-8., 8., rnd(k, 51)), by + j * 70. + lerp(-6., 6., rnd(k, 52)));
                fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1})")}>{amber(36., 0.4, t, 980 + k)}</g>)
            })
            .collect::<Vec<_>>();
        let carving = (0..6)
            .map(|k| {
                let x = bx - 180. + k as f32 * 72.;
                fframes::svgr!(<path d={leaf(40.)} transform={format!("translate({x:.1} {}) rotate(90)", by + 152.)} fill="none" stroke="#c8925a" stroke-width="2" opacity="0.4" />)
            })
            .collect::<Vec<_>>();
        let lid_h = 260. * lid;
        let lid_layer = fframes::svgr!(
            <g>
                <path d={format!("M{} {} L{} {} L{} {:.1} L{} {:.1}Z", bx - 230., by - 130., bx + 230., by - 130., bx + 230., by - 130. + lid_h, bx - 230., by - 130. + lid_h)} fill={if lid > 0. { "url(#g-log)" } else { "#2a180c" }} stroke="#0e0804" stroke-width="3" />
                <path d={format!("M{} {:.1} L{} {:.1}", bx - 200., by - 130. + lid_h * 0.5, bx + 200., by - 130. + lid_h * 0.5)} stroke="#c8925a" stroke-width="2" opacity={0.4 * lid.abs()} />
            </g>
        );
        let boxed = fframes::svgr!(
            <g transform={format!("translate({} {}) scale({push:.3}) translate({} {})", PICK.0, PICK.1, -PICK.0, -PICK.1)} opacity={1. - macro_in}>
                <rect x={bx - 260.} y={by - 150.} width="520" height="330" rx="14" fill="#000" opacity="0.5" filter="url(#blur18)" transform="translate(12 24)" />
                <rect x={bx - 250.} y={by - 150.} width="500" height="320" rx="12" fill="url(#g-log)" stroke="#0e0804" stroke-width="4" />
                {carving}
                <rect x={bx - 220.} y={by - 122.} width="440" height="250" rx="8" fill="#1e2e16" />
                <rect x={bx - 220.} y={by - 122.} width="440" height="250" rx="8" fill="url(#g-amber-halo)" opacity={0.7 * open} />
                {drops}
                {lid_layer}
            </g>
        );
        let backdrop = fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="#120a04" />
                <circle cx="640" cy="420" r="700" fill="url(#g-candle)" opacity={0.35 + 0.4 * open} />
            </g>
        );
        let close = if macro_in > 0. {
            let bokeh = (0..14u32)
                .map(|k| {
                    let x = lerp(0., 1280., rnd(k, 61)) + 20. * wave(t, 1., rnd(k, 62));
                    let y = lerp(0., 720., rnd(k, 63));
                    fframes::svgr!(<circle cx={x} cy={y} r={lerp(30., 90., rnd(k, 64))} fill="url(#g-amber-halo)" opacity={0.3 * (0.8 + 0.2 * wave(t, 1., rnd(k, 65)))} />)
                })
                .collect::<Vec<_>>();
            let r = lerp(120., 250., macro_in);
            fframes::svgr!(
                <g opacity={macro_in}>
                    <rect width="1280" height="720" fill="#1a0c02" />
                    {bokeh}
                    {macro_drop(&self.caustic, &frame, t, r, frame.animate(&self.turn))}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let motes = Motes { count: 36, seed: 961, area: (300., 100., 680., 600.), rise: 260., period: LOOP, size: (1., 3.), sway: 30., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                {backdrop}
                {boxed}
                {close}
                {motes.draw(t, 0.4 + 0.5 * open)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Lethiel

const CARD: (f32, f32) = (640., 352.);
const CW: f32 = 330.;
const CH: f32 = 440.;
const GROW_AT: f32 = 1.0;
const VINE_AT: f32 = 2.0;
const FLOWERS_AT: f32 = 3.0;

#[derive(Debug)]
pub struct Lethiel {
    sh: Shaders,
    grow: Anim,
    vine: Anim,
    frame_glow: Anim,
    flash: Anim,
    perimeter: [Vec<(f32, f32)>; 2],
}

impl Lethiel {
    pub fn new(sh: Shaders) -> Self {
        let (x0, x1, y0, y1) = (CARD.0 - CW / 2. - 14., CARD.0 + CW / 2. + 14., CARD.1 - CH / 2. - 14., CARD.1 + CH / 2. + 14.);
        // Two vines start at the bottom middle and meet at the top middle.
        let side = |s: f32| {
            let pts = [
                (CARD.0, y1),
                (CARD.0 + s * CW * 0.3, y1 + 6.),
                (lerp(CARD.0, if s < 0. { x0 } else { x1 }, 0.95), y1 - 10.),
                (if s < 0. { x0 } else { x1 }, CARD.1 + CH * 0.2),
                (if s < 0. { x0 - 6. } else { x1 + 6. }, CARD.1 - CH * 0.2),
                (lerp(CARD.0, if s < 0. { x0 } else { x1 }, 0.95), y0 + 10.),
                (CARD.0 + s * CW * 0.3, y0 - 6.),
                (CARD.0, y0),
            ];
            spline(&pts, 8)
        };
        Self {
            sh,
            grow: tw(GROW_AT, GROW_AT + 0.8, 0., 1., Easing::EaseOut),
            vine: tw(VINE_AT, VINE_AT + 1.1, 0., 1., Easing::EaseInOut),
            frame_glow: tw(VINE_AT + 1.0, VINE_AT + 1.6, 0., 1., Easing::EaseOut),
            flash: flash(VINE_AT + 1.1, 0.18, 0.5),
            perimeter: [side(-1.), side(1.)],
        }
    }
}

/// A flower with five petals, `open` 0..1.
fn flower<'a>(x: f32, y: f32, size: f32, open: f32, rot: f32) -> Svgr<'a> {
    if open <= 0.01 {
        return Svgr::empty();
    }
    let petals = (0..5)
        .map(|k| fframes::svgr!(<path d={leaf(size * open)} transform={format!("rotate({:.1})", k as f32 * 72. + rot)} fill="#fbeaff" stroke="#c88ad8" stroke-width="0.8" />))
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g transform={format!("translate({x:.1} {y:.1})")}>
            <circle r={size * 1.6 * open} fill="url(#g-gold)" opacity="0.45" />
            {petals}
            <circle r={size * 0.22 * open} fill="#ffd860" />
        </g>
    )
}

impl Scene for Lethiel {
    fn name(&self) -> &'static str {
        "EndingLethiel"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(field), Some(art)) = (ctx.get_image("glowcap-hollows.png"), ctx.get_image("card-lethiel-first-gardener.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let p = painting(&self.sh, &frame, field, Grade { gold: 0.6, ..Default::default() });
        // Seeds and petals spiral in.
        let spiral = (0..70u32)
            .filter_map(|i| {
                let born = 0.05 + 0.6 * rnd(i, 71);
                let k = (t - born) / 1.3;
                if !(0.0..1.0).contains(&k) {
                    return None;
                }
                let a = TAU * (rnd(i, 72) + 1.4 * k);
                let r = 640. * (1. - k).powf(1.3);
                let (x, y) = (CARD.0 + a.cos() * r, CARD.1 + a.sin() * r * 0.7);
                let petal = i % 3 == 0;
                Some(if petal {
                    fframes::svgr!(<path d={leaf(12.)} transform={format!("translate({x:.1} {y:.1}) rotate({:.0})", a.to_degrees() + 90.)} fill="#fbeaff" opacity={0.9 * (1. - k * 0.6)} />)
                } else {
                    fframes::svgr!(<circle cx={x} cy={y} r="2.6" fill="#fff2c8" opacity={1. - k * 0.5} />)
                })
            })
            .collect::<Vec<_>>();
        let g = frame.animate(&self.grow);
        let s = bloom((t - GROW_AT) * 0.9).min(1.12) * g.min(1.);
        let tilt = lerp(-14., 0., g) + 1.2 * wave(t, 1., 0.1);
        let card = if g > 0. {
            fframes::svgr!(
                <g transform={format!("translate({} {}) rotate({tilt:.2}) scale({s:.3})", CARD.0, CARD.1)}>
                    <rect x={-CW / 2. + 10.} y={-CH / 2. + 18.} width={CW} height={CH} rx="18" fill="#000" opacity="0.5" filter="url(#blur18)" />
                    <rect x={-CW / 2. - 8.} y={-CH / 2. - 8.} width={CW + 16.} height={CH + 16.} rx="20" fill="#14301e" stroke="#e0b250" stroke-width="3" />
                    <image href={art.href()} x={-CW / 2.} y={-CH / 2.} width={CW} height={CH} preserveAspectRatio="xMidYMid slice" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Vines draw the Epic frame, leaves open along them, then flowers.
        let vine = frame.animate(&self.vine);
        let sway = 1.5 * wave(t, 1., 0.3);
        let vines = self
            .perimeter
            .iter()
            .enumerate()
            .map(|(side, pts)| {
                let body = taper(pts, 9., 4., vine);
                let leaves = (1..14)
                    .map(|j| {
                        let u = j as f32 / 14.;
                        let open = ((vine - u) * 5.).clamp(0., 1.);
                        let p = pts[((pts.len() - 1) as f32 * u) as usize];
                        let out = if side == 0 { -1. } else { 1. };
                        let a = out * (60. + 40. * (j % 2) as f32) + 8. * wave(t, 1., u + side as f32 * 0.5);
                        fframes::svgr!(<path d={leaf(18. * open)} transform={format!("translate({:.1} {:.1}) rotate({a:.1})", p.0 + sway, p.1)} fill="url(#g-leaf)" opacity={open} />)
                    })
                    .collect::<Vec<_>>();
                if vine <= 0. {
                    return Svgr::empty();
                }
                fframes::svgr!(
                    <g>
                        <path d={body.clone()} fill="none" stroke="#5ff2a8" stroke-width="10" opacity="0.35" filter="url(#blur8u)" />
                        <path d={body} fill="#2a7a3e" stroke="#0e2a14" stroke-width="1.2" />
                        {leaves}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let fg = frame.animate(&self.frame_glow);
        let (fx, fy, fw, fh) = (CARD.0 - CW / 2. - 14., CARD.1 - CH / 2. - 14., CW + 28., CH + 28.);
        let epic = fframes::svgr!(
            <g opacity={fg}>
                <rect x={fx} y={fy} width={fw} height={fh} rx="22" fill="none" stroke="#5ff2a8" stroke-width="18" opacity={0.3 + 0.15 * wave(t, 2., 0.)} filter="url(#blur8)" />
                <rect x={fx} y={fy} width={fw} height={fh} rx="22" fill="none" stroke="url(#g-epic)" stroke-width="4" />
            </g>
        );
        let spots = [(fx, fy), (fx + fw, fy), (fx, fy + fh), (fx + fw, fy + fh), (CARD.0, fy - 2.), (fx - 2., CARD.1), (fx + fw + 2., CARD.1)];
        let flowers = spots
            .iter()
            .enumerate()
            .map(|(k, &(x, y))| flower(x, y, if k < 4 { 28. } else { 21. }, bloom(t - FLOWERS_AT - 0.1 * k as f32).min(1.1), 12. * wave(t, 1., k as f32 * 0.17)))
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g>
                <g transform="scale(0.8)" filter="url(#blur8)">{p}</g>
                <rect width="1280" height="720" fill="#2a1a04" opacity="0.35" />
                {rays(&self.sh, &frame, (80., -40.), 0.4, 1.1, SUN)}
                <circle cx={CARD.0} cy={CARD.1} r="460" fill="url(#g-gold)" opacity={0.35 * g} />
                {spiral}
                {card}
                {vines}
                {epic}
                {flowers}
                {falling(t, 0.8 * after(t, 1.2, 1.), 18, 991, "#fbeaff", 11.)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.6" />
                <rect width="1280" height="720" fill="#fff6dc" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Thornwood

const DIVE_AT: f32 = 0.4;
const INSIDE_AT: f32 = 2.0;
const THORN_AT: f32 = 2.4;
const SEAL_IN: f32 = 3.4;

#[derive(Debug)]
pub struct Thornwood {
    sh: Shaders,
    caustic: Shader,
    dive: Anim,
    cam: Cam,
    thorn: Anim,
}

impl Thornwood {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            caustic: caustic_shader(),
            dive: tw(DIVE_AT, INSIDE_AT, 0., 1., Easing::EaseIn),
            cam: camera(&[(DIVE_AT, 4.8, (950., 350., 1.25), (962., 346., 1.32))]),
            thorn: tw(THORN_AT, THORN_AT + 0.9, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Thornwood {
    fn name(&self) -> &'static str {
        "EndingThornwood"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("thornwood-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let dive = frame.animate(&self.dive);
        let cam = frame.animate(&self.cam);
        // The amber drop of the last moment grows until the camera is inside it.
        let r = 250. * (1. + 4.5 * dive * dive);
        let world = || fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>{painting(&self.sh, &frame, map, Grade { gold: 0.55, dusk: 0.15, ..Default::default() })}</g>
                <rect width="1280" height="720" fill="#ff9a2a" opacity="0.16" />
                {caustic(&self.caustic, &frame, 1.4, AMBER_DEEP, AMBER_LIGHT, 0.14, (0., 0., 1280., 720.))}
            </g>
        );
        let lens = if t < INSIDE_AT + 0.1 {
            let before = 1. - dive;
            let s = r / 250.;
            let bokeh = (0..14u32)
                .map(|k| {
                    let x = lerp(0., 1280., rnd(k, 61)) + 20. * wave(t, 1., rnd(k, 62));
                    let y = lerp(0., 720., rnd(k, 63));
                    fframes::svgr!(<circle cx={x} cy={y} r={lerp(30., 90., rnd(k, 64))} fill="url(#g-amber-halo)" opacity={0.3 * (0.8 + 0.2 * wave(t, 1., rnd(k, 65)))} />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g>
                    <rect width="1280" height="720" fill="#1a0c02" />
                    <g opacity={before}>{bokeh}</g>
                    <g transform={format!("translate(640 360) scale({s:.3}) translate(-640 -360)")} opacity={before.powf(0.7)}>
                        {macro_drop(&self.caustic, &frame, t, 250., 1.)}
                    </g>
                    <defs><clipPath id="gh-lens"><circle cx="640" cy="360" r={r * 0.92} /></clipPath></defs>
                    <g clip-path="url(#gh-lens)" opacity={dive.powf(0.6)}>
                        {world()}
                        <rect width="1280" height="720" fill="#c8640a" opacity={0.5 * before} />
                    </g>
                    <circle cx="640" cy="360" r={r * 0.92} fill="none" stroke="#ffd890" stroke-width={3. + 30. * dive} opacity={0.6 * before * dive.min(0.3) / 0.3} filter="url(#blur8)" />
                </g>
            )
        } else {
            world()
        };
        // Inside: the warm edge of the amber stays around the view.
        let edge = after(t, INSIDE_AT - 0.2, 0.6);
        let tk = frame.animate(&self.thorn);
        let thorn_layer = if tk > 0. {
            let bob = 8. * wave(t, 1., 0.2);
            let spin = -20. + 10. * wave(t, 1., 0.5);
            fframes::svgr!(
                <g transform={format!("translate(470 {:.1}) rotate({spin:.1}) scale({:.3})", 330. + bob, 0.5 + 0.3 * tk)} opacity={tk}>
                    <path d={thorn(150.)} fill="none" stroke="#b46aff" stroke-width="10" opacity="0.4" filter="url(#blur8)" />
                    <path d={thorn(150.)} fill="#120806" stroke="#e4c8ff" stroke-width="1.5" stroke-opacity="0.6" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let seal = after(t, SEAL_IN, 1.0) * (0.42 + 0.12 * wave(t, 1., 0.));
        // The old giant's half-open eye catches the light once in each loop.
        let eye = {
            let (ex, ey) = (640. + (1218. - cam.0) * 0.8 * cam.2, 360. + (205. - cam.1) * 0.8 * cam.2);
            let u = (loop_phase(t) - 0.7).rem_euclid(1.);
            let k = (1. - (u - 0.06).abs() * 12.).max(0.) * after(t, 4.0, 0.5);
            glint(ex, ey, 5., k)
        };
        let bubbles = Motes { count: 34, seed: 981, area: (0., 0., 1280., 760.), rise: 320., period: LOOP, size: (1.5, 4.), sway: 16., fill: "url(#g-amber-core)" };
        fframes::svgr!(
            <g>
                {lens}
                <g opacity={edge}>
                    <rect width="1280" height="720" fill="url(#gh-amber-edge)" />
                    {eye}
                    {thorn_layer}
                    <circle cx="640" cy="170" r="140" fill="#14061e" opacity={0.35 * seal} filter="url(#blur18)" />
                    {cut_seal(640., 170., 72., seal)}
                    {falling(t, 0.7, 12, 1001, "url(#g-leaf)", 14.)}
                    {bubbles.draw(t, 0.7)}
                </g>
                <defs>
                    <radialGradient id="gh-amber-edge" cx="0.5" cy="0.5" r="0.72">
                        <stop offset="0.55" stop-color="#ffb43a" stop-opacity="0" />
                        <stop offset="0.85" stop-color="#d8700a" stop-opacity="0.55" />
                        <stop offset="1" stop-color="#5a2402" stop-opacity="0.95" />
                    </radialGradient>
                </defs>
            </g>
        )
    }
}
