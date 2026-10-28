//! Opening: the burning age, the Accord, Hearthvale, the Baron, your road.
use crate::fx::*;
use crate::{CARD_ARTS, CARD_SPOTS, CLIP_FRAMES, HALL, RIVER_GLINTS, STOPS, TRAIL};
use fframes::{
    Color, Duration, FFramesContext, FontQuery, Frame, Scene, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::TAU;

const FIRE_FLASH: (f32, f32, f32) = (1.0, 0.86, 0.62);
const GOLD: (f32, f32, f32) = (1.0, 0.83, 0.46);

/// A short push to `amount`, then a spring back to 1.
fn punch(at: f32, amount: f32) -> Anim {
    KeyFramesAnimation::new(vec![
        KeyFrame { start: at - 0.05, end: Some(at), from: 1.0, to: amount, easing: &Easing::Linear },
        KeyFrame { start: at, end: None, from: amount, to: 1.0, easing: &BOUNCY },
    ])
}

/// A flash that peaks fast and fades.
fn flash(at: f32, peak: f32, fade: f32) -> Anim {
    keys(&[(at, at + 0.06, 0., peak, Easing::Linear), (at + 0.06, at + fade, peak, 0., Easing::EaseOut)])
}

// ---------------------------------------------------------------- 1. Fire

/// Landmarks that burn in the old war: (x, y, radius) in map units.
const BURNING: [(f32, f32, f32); 8] = [
    (284., 436., 60.), (1069., 356., 48.), (953., 451., 52.), (756., 364., 44.),
    (182., 204., 40.), (516., 305., 38.), (1178., 102., 70.), (1084., 611., 56.),
];

/// One row of marching silhouettes, facing right. Orcs are mirrored when drawn.
fn army(orc: bool, seed: u32, ground: f32, scale: f32, count: u32) -> String {
    let dir = 1.0f32;
    let mut d = String::new();
    let mut x = 0.0f32;
    for i in 0..count {
        let s = scale * lerp(0.86, 1.08, rnd(i, seed));
        let gy = ground + lerp(-6., 6., rnd(i, seed + 1));
        let px = -dir * x;
        let f = |dx: f32| px + dir * dx * s;
        let y = |dy: f32| gy - dy * s;
        // legs, body, head
        d.push_str(&format!(
            "M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z ",
            f(-8.), y(0.), f(-3.), y(31.), f(4.), y(31.), f(9.), y(0.)
        ));
        d.push_str(&format!(
            "M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z ",
            f(-12.), y(28.), f(12.), y(28.), f(15.), y(60.), f(-12.), y(60.)
        ));
        let (hx, hy, r) = (f(2.), y(68.), 8. * s);
        d.push_str(&format!("M{:.1} {:.1} a{r:.1} {r:.1} 0 1 1 {:.1} 0 a{r:.1} {r:.1} 0 1 1 {:.1} 0Z ", hx - r, hy, 2. * r, -2. * r));
        if !orc {
            // crested helm, long spear, tall shield
            d.push_str(&format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z ", f(-8.), y(70.), f(-2.), y(86.), f(9.), y(71.)));
            let a = lerp(0.95, 1.2, rnd(i, seed + 2));
            let (bx, by) = (f(8.), y(44.));
            let (tx, ty) = (bx + dir * a.cos() * 130. * s, by - a.sin() * 130. * s);
            d.push_str(&format!("M{bx:.1} {by:.1} L{tx:.1} {ty:.1} L{:.1} {:.1} L{:.1} {:.1}Z ", tx + 2.2, ty + 1., bx + 2.2, by + 1.));
            d.push_str(&format!(
                "M{tx:.1} {ty:.1} L{:.1} {:.1} L{:.1} {:.1}Z ",
                tx - dir * 4. * s, ty + 13. * s, tx + dir * 5. * s, ty + 11. * s
            ));
            d.push_str(&format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z ", f(10.), y(16.), f(24.), y(18.), f(24.), y(58.), f(10.), y(60.)));
        } else {
            // horns, axe, round shield
            for side in [-1.0f32, 1.] {
                d.push_str(&format!(
                    "M{:.1} {:.1} Q{:.1} {:.1} {:.1} {:.1} Q{:.1} {:.1} {:.1} {:.1}Z ",
                    hx + side * 5. * s, y(72.), hx + side * 17. * s, y(76.), hx + side * 15. * s, y(92.), hx + side * 10. * s, y(80.), hx + side * 2. * s, y(74.)
                ));
            }
            let (bx, by) = (f(10.), y(46.));
            let (tx, ty) = (bx + dir * 26. * s, by - 58. * s);
            d.push_str(&format!("M{bx:.1} {by:.1} L{tx:.1} {ty:.1} L{:.1} {:.1} L{:.1} {:.1}Z ", tx + 2.5, ty + 1., bx + 2.5, by + 1.));
            d.push_str(&format!(
                "M{tx:.1} {ty:.1} Q{:.1} {:.1} {:.1} {:.1} Q{:.1} {:.1} {:.1} {:.1}Z ",
                tx + dir * 24. * s, ty + 4. * s, tx + dir * 14. * s, ty + 26. * s, tx + dir * 8. * s, ty + 12. * s, tx, ty + 14. * s
            ));
            let (cx, cy, r) = (f(16.), y(38.), 13. * s);
            d.push_str(&format!("M{:.1} {cy:.1} a{r:.1} {r:.1} 0 1 1 {:.1} 0 a{r:.1} {r:.1} 0 1 1 {:.1} 0Z ", cx - r, 2. * r, -2. * r));
        }
        if i % 6 == 3 {
            // a banner pole with a torn flag
            let (bx, top) = (f(-4.), y(190.));
            d.push_str(&format!("M{bx:.1} {:.1} L{bx:.1} {top:.1} L{:.1} {top:.1} L{:.1} {:.1}Z ", y(40.), bx + 3., bx + 3., y(40.)));
            let w = -dir * 50. * s;
            d.push_str(&format!(
                "M{bx:.1} {top:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{bx:.1} {:.1}Z ",
                bx + w, top + 4. * s, bx + w * 0.86, top + 22. * s, bx + w, top + 40. * s, bx + w * 0.6, top + 34. * s, bx + w * 0.3, top + 46. * s, top + 42. * s
            ));
        }
        x += lerp(22., 32., rnd(i, seed + 3)) * scale;
    }
    d
}

fn pieces(d: String) -> Vec<String> {
    d.split('M').filter(|p| !p.trim().is_empty()).map(|p| format!("M{p}")).collect()
}

#[derive(Debug)]
pub struct Fire {
    sh: Shaders,
    cam: Cam,
    dark: Anim,
    flash: Anim,
    left: Anim,
    right: Anim,
    ring: Anim,
    rows: [Vec<String>; 4],
}

impl Fire {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 5., (800., 520., 1.22), (800., 470., 1.36))]),
            dark: tw(0., 1.8, 1.0, 0.34, Easing::EaseOut),
            flash: flash(3.6, 0.95, 1.1),
            left: KeyFramesAnimation::new(vec![
                KeyFrame { start: 0.3, end: Some(3.6), from: -60., to: 700., easing: &Easing::EaseIn },
                KeyFrame { start: 3.6, end: None, from: 700., to: 676., easing: &BOUNCY },
            ]),
            right: KeyFramesAnimation::new(vec![
                KeyFrame { start: 0.3, end: Some(3.6), from: 1340., to: 580., easing: &Easing::EaseIn },
                KeyFrame { start: 3.6, end: None, from: 580., to: 604., easing: &BOUNCY },
            ]),
            ring: tw(3.6, 4.7, 0., 1., Easing::EaseOut),
            rows: [
                pieces(army(false, 11, 708., 1.2, 26)),
                pieces(army(true, 23, 708., 1.2, 26)),
                pieces(army(false, 37, 806., 1.8, 18)),
                pieces(army(true, 51, 806., 1.8, 18)),
            ],
        }
    }
}

impl Scene for Fire {
    fn name(&self) -> &'static str {
        "OpeningFire"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("hearthvale-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let flash = frame.animate(&self.flash);
        let cam = frame.animate(&self.cam);
        let painting = painting(&self.sh, &frame, map, Grade {
            fire: 1.,
            smoke: 1.,
            heat: 1.,
            dark: frame.animate(&self.dark),
            flash: flash * 0.6,
            flash_color: FIRE_FLASH,
            ..Default::default()
        });
        let shake = shake(t, 3.6, 16.);
        let sway = 5. * wave(t, 2., 0.);
        let lx = frame.animate(&self.left) + sway;
        let rx = frame.animate(&self.right) - sway;
        let ring = frame.animate(&self.ring);
        let rings = if ring > 0. && ring < 1. {
            fframes::svgr!(
                <g>
                    <ellipse cx="640" cy="690" rx={20. + ring * 900.} ry={8. + ring * 260.} fill="none" stroke="#ffe6b0" stroke-width={2. + 26. * (1. - ring)} opacity={(1. - ring) * 0.85} />
                    <ellipse cx="640" cy="690" rx={10. + ring * 560.} ry={4. + ring * 150.} fill="none" stroke="#ff9c3a" stroke-width={1. + 14. * (1. - ring)} opacity={(1. - ring) * 0.7} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Sparks from the clash, gone before the loop starts.
        let sparks = (0..56u32)
            .filter_map(|i| {
                let dt = t - 3.6 - rnd(i, 5) * 0.12;
                let life = lerp(0.6, 1.3, rnd(i, 6));
                if !(0.0..life).contains(&dt) {
                    return None;
                }
                let a = lerp(-2.9, -0.24, rnd(i, 7));
                let v = lerp(320., 980., rnd(i, 8));
                let (vx, vy) = (a.cos() * v, a.sin() * v);
                let x = 640. + vx * dt;
                let y = 640. + vy * dt + 0.5 * 1100. * dt * dt;
                let (px, py) = (x - vx * 0.035, y - (vy + 1100. * dt) * 0.035);
                let o = 1. - dt / life;
                Some(fframes::svgr!(<path d={format!("M{px:.1} {py:.1} L{x:.1} {y:.1}")} stroke="#ffd98a" stroke-width={1.2 + 1.8 * o} stroke-linecap="round" opacity={o} />))
            })
            .collect::<Vec<_>>();
        let embers = Motes { count: 90, seed: 3, area: (0., 0., 1280., 720.), rise: 920., period: LOOP, size: (1.4, 4.2), sway: 28., fill: "url(#g-ember)" };
        let ash = Motes { count: 34, seed: 9, area: (0., -820., 1280., 720.), rise: -900., period: LOOP, size: (1.2, 2.6), sway: 40., fill: "url(#g-ash)" };
        let glow = 0.55 + 0.25 * flicker(t, 0.4);
        let row = |i: usize| self.rows[i].iter().map(|d| fframes::svgr!(<path d={d.as_str()} />)).collect::<Vec<_>>();
        let reveal = 1. - frame.animate(&self.dark);
        let fires = BURNING
            .iter()
            .enumerate()
            .map(|(i, (x, y, r))| {
                let f = flicker(t, i as f32 * 0.37);
                fframes::svgr!(
                    <g>
                        <ellipse cx={*x} cy={*y} rx={r * (1.6 + 0.2 * f)} ry={r * (1.1 + 0.15 * f)} fill="url(#g-ember)" opacity={reveal * (0.45 + 0.35 * f)} />
                        <ellipse cx={*x} cy={y - r * 0.2} rx={r * 0.5} ry={r * (0.6 + 0.2 * f)} fill="#fff1c0" opacity={reveal * 0.35 * f} filter="url(#blur8)" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, shake)}>{painting}{fires}</g>
                <rect width="1280" height="320" fill="url(#g-top-shade)" />
                <rect y="380" width="1280" height="340" fill="url(#g-fire-horizon)" opacity={glow} />
                {ash.draw(t, 0.8)}
                <g transform={format!("translate({} {})", shake.0 * 0.6, shake.1 * 0.6)}>
                    <g transform={format!("translate({lx} 0) skewX(-6)")}><g fill="#2a0806" opacity="0.92" filter="url(#blur3)">{row(0)}</g></g>
                    <g transform={format!("translate({rx} 0) scale(-1 1) skewX(-6)")}><g fill="#2a0806" opacity="0.92" filter="url(#blur3)">{row(1)}</g></g>
                    {rings}
                    <g transform={format!("translate({} 0) skewX(-8)", lx - 10.)}><g transform="translate(0 -2.5)" fill="#ff8a30" opacity="0.55">{row(2)}</g><g fill="#060202">{row(2)}</g></g>
                    <g transform={format!("translate({} 0) scale(-1 1) skewX(-8)", rx + 10.)}><g transform="translate(0 -2.5)" fill="#ff8a30" opacity="0.55">{row(3)}</g><g fill="#060202">{row(3)}</g></g>
                    {sparks}
                </g>
                {embers.draw(t, 1.)}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
                <rect width="1280" height="720" fill="#fff2d6" opacity={flash} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Accord

#[derive(Debug)]
pub struct Accord {
    sh: Shaders,
    lanes: [Anim; 3],
    outer: Anim,
    inner: Anim,
    flash: Anim,
    punch: Anim,
    rays: Anim,
    dark: Anim,
    fire: Anim,
    embers: Anim,
    motes: Anim,
    runes: Vec<String>,
}

impl Accord {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            lanes: std::array::from_fn(|i| tw(0.45 + 0.3 * i as f32, 1.65 + 0.3 * i as f32, 0., 1., Easing::EaseInOut)),
            outer: tw(1.75, 2.85, 0., 1., Easing::EaseInOut),
            inner: tw(1.95, 3.0, 0., 1., Easing::EaseInOut),
            flash: flash(3.4, 0.92, 1.0),
            punch: punch(3.4, 1.12),
            rays: keys(&[(3.4, 3.55, 0., 1.4, Easing::EaseOut), (3.55, 4.9, 1.4, 0.45, Easing::EaseInOut)]),
            dark: keys(&[(0., 1.2, 0.8, 0.97, Easing::EaseOut), (3.4, 4.6, 0.97, 0.8, Easing::EaseOut)]),
            fire: tw(3.4, 3.5, 1., 0., Easing::Linear),
            embers: tw(3.3, 3.9, 1., 0., Easing::EaseOut),
            motes: tw(3.4, 4.4, 0., 1., Easing::EaseOut),
            runes: (0..16).map(|i| rune(100 + i)).collect(),
        }
    }
}

impl Scene for Accord {
    fn name(&self) -> &'static str {
        "OpeningAccord"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("hearthvale-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let fire = frame.animate(&self.fire);
        let painting = painting(&self.sh, &frame, map, Grade {
            fire,
            smoke: 0.9,
            gold: 1. - fire,
            dark: frame.animate(&self.dark),
            ..Default::default()
        });
        let lanes = self
            .lanes
            .iter()
            .enumerate()
            .map(|(i, anim)| {
                let p = frame.animate(anim);
                let y = 290. + 70. * i as f32;
                let x1 = 150. + 980. * p;
                if p <= 0.0 {
                    return Svgr::empty();
                }
                let pulse = 0.85 + 0.15 * wave(t, 2., i as f32 * 0.2);
                let head = if p < 1.0 {
                    let trail = (0..10u32)
                        .map(|k| {
                            let k = k as f32;
                            let jitter = 6. * (rnd(k as u32, i as u32 * 7 + (t * 30.) as u32) - 0.5);
                            fframes::svgr!(<circle cx={x1 - k * 13.} cy={y + jitter} r={2.4 - k * 0.18} fill="#ffe7a8" opacity={1. - k / 10.} />)
                        })
                        .collect::<Vec<_>>();
                    fframes::svgr!(
                        <g>
                            {trail}
                            <circle cx={x1} cy={y} r="40" fill="url(#g-gold)" />
                            <circle cx={x1} cy={y} r="5" fill="#ffffff" />
                        </g>
                    )
                } else {
                    Svgr::empty()
                };
                fframes::svgr!(
                    <g>
                        <path d={format!("M150 {y} L{x1:.1} {y}")} stroke="#ffbf3c" stroke-width="16" stroke-linecap="round" filter="url(#blur8u)" opacity={0.85 * pulse} />
                        <path d={format!("M150 {y} L{x1:.1} {y}")} stroke="#fff8de" stroke-width="3.4" stroke-linecap="round" opacity={pulse} />
                        {head}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let outer = frame.animate(&self.outer);
        let inner = frame.animate(&self.inner);
        let c_outer = TAU * 262.;
        let c_inner = TAU * 222.;
        let spin = 7.5 * t / LOOP;
        let ticks = (0..48u32)
            .map(|i| {
                let o = ((t - 2.0 - i as f32 * 0.02) / 0.25).clamp(0., 1.);
                let a = i as f32 * 7.5;
                fframes::svgr!(<path d="M0 -213 L0 -201" transform={format!("rotate({a})")} stroke="#ffe3a0" stroke-width="2" opacity={o} />)
            })
            .collect::<Vec<_>>();
        let runes = self
            .runes
            .iter()
            .enumerate()
            .map(|(i, d)| {
                let o = ((t - 2.2 - i as f32 * 0.05) / 0.3).clamp(0., 1.);
                let a = i as f32 * 22.5;
                fframes::svgr!(<path d={d.as_str()} transform={format!("rotate({a}) translate(0 -242) scale({})", 0.7 + 0.3 * o)} stroke="#ffd98a" stroke-width="2.2" fill="none" stroke-linecap="round" opacity={o} />)
            })
            .collect::<Vec<_>>();
        let scale = frame.animate(&self.punch);
        let rays_layer = rays(&self.sh, &frame, (640., 360.), frame.animate(&self.rays), 0.95, GOLD);
        let embers = Motes { count: 70, seed: 3, area: (0., 0., 1280., 720.), rise: 920., period: LOOP, size: (1.4, 4.), sway: 28., fill: "url(#g-ember)" };
        let motes = Motes { count: 60, seed: 41, area: (60., 0., 1160., 760.), rise: 700., period: LOOP, size: (1.2, 3.4), sway: 18., fill: "url(#g-gold)" };
        let disc = frame.animate(&self.motes) * (0.32 + 0.08 * wave(t, 1., 0.));
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="#080403" />
                <g transform={cam_transform((800., 450., 1.1), (0., 0.))}>{painting}</g>
                {rays_layer}
                <circle cx="640" cy="360" r="300" fill="url(#g-gold)" opacity={disc} />
                {embers.draw(t, frame.animate(&self.embers))}
                <g transform={format!("translate(640 360) scale({scale})")}>
                    <circle r="262" fill="none" stroke="#ffbf3c" stroke-width="10" filter="url(#blur8)" stroke-dasharray={c_outer} stroke-dashoffset={c_outer * (1. - outer)} transform="rotate(-90)" opacity="0.7" />
                    <circle r="262" fill="none" stroke="#fff3cf" stroke-width="2.6" stroke-dasharray={c_outer} stroke-dashoffset={c_outer * (1. - outer)} transform="rotate(-90)" />
                    <circle r="222" fill="none" stroke="#ffe7a8" stroke-width="1.8" stroke-dasharray={c_inner} stroke-dashoffset={c_inner * (1. - inner)} transform="rotate(90)" />
                    <g transform={format!("rotate({spin})")}>{ticks}</g>
                    <g transform={format!("rotate({})", 3. * wave(t, 1., 0.))}>{runes}</g>
                </g>
                <g transform="translate(0 0)">{lanes}</g>
                {motes.draw(t, frame.animate(&self.motes))}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
                <rect width="1280" height="720" fill="#fff6dc" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Valley

#[derive(Debug)]
pub struct Valley {
    sh: Shaders,
    cam: Cam,
    gold: Anim,
    white: Anim,
    cloud_a: Anim,
    cloud_b: Anim,
    cloud_fade_a: Anim,
    cloud_fade_b: Anim,
    edges: Anim,
    rays: Anim,
    flock: Anim,
    glints: Anim,
    band: Anim,
    letters: Vec<(Anim, Anim)>,
    line: Anim,
    diamond: Anim,
    sweep: Anim,
}

const TITLE: &str = "HEARTHVALE";
fn title_font() -> FontQuery<'static> {
    FontQuery { family: "Cinzel", size: 86, weight: 900, ..Default::default() }
}

impl Valley {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 5., (800., 470., 1.0), (830., 430., 1.16))]),
            gold: tw(0., 4.5, 0.75, 0.3, Easing::EaseOut),
            white: tw(0., 1.0, 0.75, 0., Easing::EaseOut),
            cloud_a: tw(0., 2.6, 1.0, 3.4, Easing::EaseIn),
            cloud_b: tw(0., 2.0, 1.0, 2.4, Easing::EaseIn),
            cloud_fade_a: tw(0.9, 2.6, 1., 0., Easing::EaseIn),
            cloud_fade_b: tw(0.2, 2.0, 1., 0., Easing::EaseIn),
            edges: tw(1.4, 3.2, 0., 0.85, Easing::EaseInOut),
            rays: tw(1.0, 3.4, 0., 0.55, Easing::EaseInOut),
            flock: tw(0.6, 5.0, 0., 1., Easing::Linear),
            glints: tw(1.2, 2.4, 0., 1., Easing::EaseOut),
            band: tw(1.6, 2.6, 0., 1., Easing::EaseOut),
            letters: (0..TITLE.len())
                .map(|i| {
                    let at = 2.0 + i as f32 * 0.055;
                    (spring(at, 34., 0., SOFT), tw(at, at + 0.35, 0., 1., Easing::EaseOut))
                })
                .collect(),
            line: tw(2.6, 3.4, 0., 1., Easing::EaseOut),
            diamond: spring(3.0, 0.01, 1., BOUNCY),
            sweep: tw(3.3, 4.3, -260., 1500., Easing::EaseInOut),
        }
    }
}

impl Scene for Valley {
    fn name(&self) -> &'static str {
        "OpeningValley"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("hearthvale-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let painting = painting(&self.sh, &frame, map, Grade {
            gold: frame.animate(&self.gold),
            flash: frame.animate(&self.white),
            flash_color: (1.0, 0.95, 0.82),
            ..Default::default()
        });
        let cloud = Fog { density: 0.78, soft: 0.26, light: Color::hex("#fffaf0"), shade: Color::hex("#d8c7ab"), dir: (0.25, 0.1), scale: 2.2, seed: 3.0 };
        let cloud2 = Fog { density: 0.74, soft: 0.26, light: Color::hex("#fff6e2"), shade: Color::hex("#e1c7a0"), dir: (-0.2, 0.15), scale: 1.4, seed: 8.0 };
        let edge = Fog { density: 0.62, soft: 0.18, light: Color::hex("#fffdf6"), shade: Color::hex("#d2d8e4"), dir: (0.3, 0.0), scale: 1.6, seed: 5.0 };
        let sa = frame.animate(&self.cloud_a);
        let sb = frame.animate(&self.cloud_b);
        let layer_a = cloud.draw(&self.sh, &frame, frame.animate(&self.cloud_fade_a), (0., 0., 1280., 720.));
        let layer_b = cloud2.draw(&self.sh, &frame, frame.animate(&self.cloud_fade_b), (0., 0., 1280., 720.));
        let edges = edge.draw(&self.sh, &frame, frame.animate(&self.edges), (0., 0., 1280., 720.));
        let p = frame.animate(&self.flock);
        let birds = if p > 0. && p < 1. {
            let (fx, fy) = (lerp(-140., 1420., p), lerp(300., 170., p) + 14. * (p * 9.).sin());
            (0..9u32)
                .map(|i| {
                    let row = (i as f32 / 2.).ceil();
                    let side = if i % 2 == 0 { 1. } else { -1. };
                    let (x, y) = (fx - row * 26. + rnd(i, 61) * 8., fy + side * row * 14. + rnd(i, 62) * 6.);
                    let flap = (TAU * (t * 2.4 + rnd(i, 63))).sin();
                    let w = -2. - 6. * flap;
                    fframes::svgr!(<path d={format!("M{} {} Q{} {} {x} {} Q{} {} {} {}", x - 11., y, x - 5., y + w, y + 2., x + 5., y + w, x + 11., y)} stroke="#2c2016" stroke-width="1.8" fill="none" stroke-linecap="round" />)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        let glint_alpha = frame.animate(&self.glints);
        let glints = RIVER_GLINTS
            .iter()
            .enumerate()
            .map(|(i, p)| {
                let o = glint_alpha * wave(t, 2., rnd(i as u32, 71)).max(0.).powi(8);
                let size = 1.6 + 1.2 * rnd(i as u32, 72);
                glint(p.0, p.1, size, o)
            })
            .collect::<Vec<_>>();
        // Title, one letter at a time.
        let widths = TITLE
            .char_indices()
            .map(|(i, c)| frame.text_width(ctx, title_font(), &TITLE[i..i + c.len_utf8()]).unwrap_or(60) as f32)
            .collect::<Vec<_>>();
        let spacing = 10.;
        let total = widths.iter().sum::<f32>() + spacing * (widths.len() as f32 - 1.);
        let mut x = 640. - total / 2.;
        let mut glyphs = vec![];
        let mut shine = vec![];
        let mut shadows = vec![];
        for (i, c) in TITLE.chars().enumerate() {
            let rise = frame.animate(&self.letters[i].0);
            let o = frame.animate(&self.letters[i].1);
            let s = c.to_string();
            shadows.push(fframes::svgr!(<text x={x + 2.} y={146. + rise} font-family="Cinzel" font-weight="900" font-size="86" fill="#140802" opacity={o * 0.8}>{s.clone()}</text>));
            glyphs.push(fframes::svgr!(<text x={x} y={140. + rise} font-family="Cinzel" font-weight="900" font-size="86" fill="url(#g-title)" stroke="#3b1c06" stroke-width="2" opacity={o}>{s.clone()}</text>));
            shine.push(fframes::svgr!(<text x={x} y={140. + rise} font-family="Cinzel" font-weight="900" font-size="86" fill="#fffdf2">{s}</text>));
            x += widths[i] + spacing;
        }
        let line = frame.animate(&self.line) * (total / 2. + 40.);
        let sweep = frame.animate(&self.sweep);
        fframes::svgr!(
            <g>
                <defs>
                    <radialGradient id="edge-fade" cx="0.5" cy="0.55" r="0.72">
                        <stop offset="0.42" stop-color="#000" />
                        <stop offset="1" stop-color="#fff" />
                    </radialGradient>
                    <mask id="edge-mask"><rect width="1280" height="720" fill="url(#edge-fade)" /></mask>
                    <clipPath id="title-sweep"><rect x={sweep} y="40" width="120" height="140" transform={format!("skewX(-24) translate({} 0)", 0.)} /></clipPath>
                </defs>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {painting}
                    <g>{glints}</g>
                </g>
                {rays(&self.sh, &frame, (-80., -140.), frame.animate(&self.rays), 1.15, (1.0, 0.9, 0.62))}
                <g>{birds}</g>
                <g mask="url(#edge-mask)">{edges}</g>
                <g transform={format!("translate(640 360) scale({sb}) translate(-640 -360)")}>{layer_b}</g>
                <g transform={format!("translate(640 360) scale({sa}) translate(-640 -360)")}>{layer_a}</g>
                <rect width="1280" height="250" fill="url(#g-top-shade)" opacity={frame.animate(&self.band) * 0.85} />
                <g filter="url(#blur3)">{shadows}</g>
                {glyphs}
                <g clip-path="url(#title-sweep)" opacity="0.75">{shine}</g>
                <path d={format!("M{} 170 L{} 170", 640. - line, 640. + line)} stroke="#f3c25a" stroke-width="2" opacity="0.9" />
                <path d="M640 162 L648 170 L640 178 L632 170Z" fill="#fff0c0" stroke="#a8641a" stroke-width="1.5" transform={format!("translate(640 170) scale({}) translate(-640 -170)", frame.animate(&self.diamond))} />
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.6" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Baron

#[derive(Debug)]
pub struct Baron {
    sh: Shaders,
    cam: Cam,
    storm: Anim,
    red: Anim,
    gold: Anim,
    clouds: Anim,
    rain: Anim,
    lightning: Anim,
    flash: Anim,
    cards: Vec<(Anim, Anim, Anim)>,
    roads: Anim,
    baron: Anim,
    baron_in: Anim,
    plate: Anim,
    plate_line: Anim,
    letters: Vec<Anim>,
    bolt: String,
    trail: String,
}

const NAME: &str = "BRASSBELLY";
fn name_font() -> FontQuery<'static> {
    FontQuery { family: "Cinzel", size: 58, weight: 900, ..Default::default() }
}

/// A jagged lightning bolt with one branch.
fn bolt(seed: u32) -> String {
    let mut main = vec![(330.0f32, -10.0f32)];
    let mut p = main[0];
    for i in 0..9u32 {
        p = (p.0 + lerp(-10., 34., rnd(i, seed)), p.1 + lerp(28., 46., rnd(i, seed + 1)));
        main.push(p);
    }
    let fork = main[4];
    let mut branch = vec![fork];
    let mut q = fork;
    for i in 0..4u32 {
        q = (q.0 - lerp(14., 32., rnd(i, seed + 2)), q.1 + lerp(20., 34., rnd(i, seed + 3)));
        branch.push(q);
    }
    format!("{} {}", path(&main, false), path(&branch, false))
}

impl Baron {
    pub fn new(sh: Shaders) -> Self {
        let trail = smooth(TRAIL);
        Self {
            sh,
            cam: camera(&[(0., 5., (780., 450., 1.0), (760., 470., 1.06))]),
            storm: tw(0.1, 1.4, 0.05, 0.86, Easing::EaseInOut),
            red: tw(2.9, 3.8, 0.0, 0.55, Easing::EaseOut),
            gold: tw(0., 1.0, 0.3, 0., Easing::EaseOut),
            clouds: tw(0.1, 1.5, 0., 0.9, Easing::EaseInOut),
            rain: tw(0.8, 2.0, 0., 0.55, Easing::EaseIn),
            lightning: keys(&[(2.9, 2.95, 0., 1., Easing::Linear), (2.95, 3.35, 1., 0., Easing::EaseIn)]),
            flash: keys(&[
                (2.9, 2.95, 0., 0.75, Easing::Linear),
                (2.95, 3.05, 0.75, 0.2, Easing::EaseOut),
                (3.05, 3.1, 0.2, 0.55, Easing::Linear),
                (3.1, 3.7, 0.55, 0., Easing::EaseOut),
            ]),
            cards: (0..4)
                .map(|i| {
                    let at = 0.95 + 0.3 * i as f32;
                    (
                        tw(at, at + 0.85, 0., 1., Easing::EaseOut),
                        tw(at + 0.45, at + 0.85, 0., 1., Easing::EaseInOut),
                        tw(at + 0.85, at + 1.5, 0., 1., Easing::EaseOut),
                    )
                })
                .collect(),
            roads: tw(2.0, 3.0, 0., 1., Easing::EaseInOut),
            baron: spring(3.05, 460., 0., HEAVY),
            baron_in: tw(3.05, 3.4, 0., 1., Easing::EaseOut),
            plate: spring(3.7, 40., 0., SOFT),
            plate_line: tw(3.7, 4.4, 0., 1., Easing::EaseOut),
            letters: (0..NAME.len()).map(|i| tw(3.8 + i as f32 * 0.045, 4.15 + i as f32 * 0.045, 0., 1., Easing::EaseOut)).collect(),
            bolt: bolt(5),
            trail,
        }
    }
}

impl Scene for Baron {
    fn name(&self) -> &'static str {
        "OpeningBaron"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(map), Some(baron)) = (ctx.get_image("hearthvale-region.png"), ctx.get_image("baron.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let flash = frame.animate(&self.flash);
        // A far flicker once per loop keeps the storm alive.
        let far = if t > 5. { 0.18 * (-(((t - 5.) % LOOP) - 2.2).powi(2) * 60.).exp() } else { 0. };
        let painting = painting(&self.sh, &frame, map, Grade {
            storm: frame.animate(&self.storm),
            red: frame.animate(&self.red),
            gold: frame.animate(&self.gold),
            flash: flash * 0.5 + far,
            flash_color: (0.75, 0.82, 1.0),
            ..Default::default()
        });
        let storm = Fog { density: 0.58, soft: 0.22, light: Color::hex("#4a4f63"), shade: Color::hex("#14141e"), dir: (-0.45, 0.05), scale: 1.7, seed: 11.0 };
        let clouds = storm.draw(&self.sh, &frame, frame.animate(&self.clouds), (-40., -60., 1360., 420.));
        let rain_alpha = frame.animate(&self.rain);
        let rain = if rain_alpha > 0. {
            (0..150u32)
                .map(|i| {
                    let u = (t / 0.8 + rnd(i, 81)).rem_euclid(1.0);
                    let x = rnd(i, 82) * 1400. - 60. - u * 120.;
                    let y = -60. + u * 840.;
                    let l = 18. + 16. * rnd(i, 83);
                    fframes::svgr!(<path d={format!("M{x:.1} {y:.1} l{:.1} {l:.1}", -l * 0.15)} stroke="#c9d4ee" stroke-width="1.2" opacity={rain_alpha * (0.35 + 0.5 * rnd(i, 84))} />)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        let roads = frame.animate(&self.roads);
        let dash = 34.;
        let flow = -t * dash * 2. / LOOP;
        let road = if roads > 0. {
            fframes::svgr!(
                <g opacity={roads}>
                    <path d={self.trail.as_str()} fill="none" stroke="#ff2a12" stroke-width="16" stroke-linecap="round" filter="url(#blur8)" opacity="0.55" />
                    <path d={self.trail.as_str()} fill="none" stroke="#ff7a52" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="20 14" stroke-dashoffset={flow} opacity="0.85" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let cards = self
            .cards
            .iter()
            .enumerate()
            .map(|(i, (fly, flip, land))| {
                let p = frame.animate(fly);
                if p <= 0. {
                    return Svgr::empty();
                }
                let target = CARD_SPOTS[i];
                let ctrl = ((HALL.0 + target.0) / 2., HALL.1.min(target.1) - 220.);
                let q = 1. - p;
                let x = q * q * HALL.0 + 2. * q * p * ctrl.0 + p * p * target.0;
                let y = q * q * HALL.1 + 2. * q * p * ctrl.1 + p * p * target.1;
                let tilt = lerp(-9., 9., rnd(i as u32, 91));
                let rot = tilt + 540. * (1. - p);
                let s = lerp(0.35, 1., p);
                let f = frame.animate(flip);
                let sx = (std::f32::consts::PI * f).cos();
                let face = if sx >= 0. {
                    card_back()
                } else {
                    ctx.get_image(CARD_ARTS[i]).map(card_front).unwrap_or_default()
                };
                let l = frame.animate(land);
                let pulse = if l > 0. { 0.55 + 0.25 * wave(t, 2., i as f32 * 0.25) } else { 0. };
                let burst = if l > 0. && l < 1. {
                    fframes::svgr!(<circle cx={target.0} cy={target.1} r={20. + 90. * l} fill="none" stroke="#ff5a2a" stroke-width={10. * (1. - l)} opacity={1. - l} />)
                } else {
                    Svgr::empty()
                };
                fframes::svgr!(
                    <g>
                        {burst}
                        <ellipse cx={target.0} cy={target.1 + 6.} rx="80" ry="40" fill="url(#g-red)" opacity={pulse} />
                        <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale({:.3} {s:.3})", s * sx.abs().max(0.02))}>
                            <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.4" />
                            {face}
                        </g>
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let lightning = frame.animate(&self.lightning);
        let bolt = if lightning > 0. {
            fframes::svgr!(
                <g opacity={lightning}>
                    <path d={self.bolt.as_str()} stroke="#b9c8ff" stroke-width="12" fill="none" filter="url(#blur8)" />
                    <path d={self.bolt.as_str()} stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linejoin="round" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let rise = frame.animate(&self.baron);
        let breathe = 1. + 0.006 * wave(t, 1., 0.);
        let bin = frame.animate(&self.baron_in);
        let baron_layer = if bin > 0. {
            fframes::svgr!(
                <g transform={format!("translate(0 {rise:.1})")} opacity={bin}>
                    <ellipse cx="1010" cy="420" rx="300" ry="340" fill="url(#g-red)" opacity={0.35 + 0.1 * wave(t, 1., 0.3)} />
                    <g transform={format!("translate(1010 735) scale({breathe}) translate(-1010 -735)")}>
                        <image href={baron.href()} x="752" y="62" width="516" height="638" filter="url(#aura)" opacity="0.7" />
                        <image href={baron.href()} x="752" y="62" width="516" height="638" />
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Name plate, bottom left.
        let widths = NAME
            .char_indices()
            .map(|(i, c)| frame.text_width(ctx, name_font(), &NAME[i..i + c.len_utf8()]).unwrap_or(40) as f32)
            .collect::<Vec<_>>();
        let mut x = 84.;
        let letters = NAME
            .chars()
            .enumerate()
            .map(|(i, c)| {
                let o = frame.animate(&self.letters[i]);
                let g = fframes::svgr!(<text x={x} y={658. + 16. * (1. - o)} font-family="Cinzel" font-weight="900" font-size="58" fill="url(#g-blood)" stroke="#1a0503" stroke-width="2" opacity={o}>{c.to_string()}</text>);
                x += widths[i] + 4.;
                g
            })
            .collect::<Vec<_>>();
        let plate = frame.animate(&self.plate);
        let plate_line = frame.animate(&self.plate_line);
        fframes::svgr!(
            <g>
                <defs>
                    <linearGradient id="g-storm-fade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0.45" stop-color="#fff" />
                        <stop offset="1" stop-color="#000" />
                    </linearGradient>
                    <mask id="storm-fade"><rect x="-40" y="-60" width="1360" height="420" fill="url(#g-storm-fade)" /></mask>
                </defs>
                <g transform={cam_transform(cam, shake(t, 2.9, 7.))}>
                    {painting}
                    {road}
                    {cards}
                </g>
                <g mask="url(#storm-fade)">{clouds}</g>
                {bolt}
                <g>{rain}</g>
                <rect y="420" width="1280" height="300" fill="url(#g-bottom-shade)" opacity={bin} />
                {baron_layer}
                <g transform={format!("translate({plate:.1} 0)")} opacity={plate_line}>
                    <text x="88" y="590" font-family="Cinzel" font-weight="900" font-size="26" letter-spacing="10" fill="#f0c86a">"BARON"</text>
                    <path d={format!("M88 606 L{} 606", 88. + 380. * plate_line)} stroke="#c23a22" stroke-width="2.5" />
                </g>
                {letters}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
                <rect width="1280" height="720" fill="#e8eeff" opacity={flash * 0.6} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Road

#[derive(Debug)]
pub struct Road {
    sh: Shaders,
    cam: Cam,
    storm: Anim,
    gold: Anim,
    drop: Anim,
    dust: Anim,
    trace: Anim,
    lit: Vec<Anim>,
    trail: Track,
    trail_d: String,
    stop_at: Vec<f32>,
}

const TRACE: (f32, f32) = (1.0, 4.2);

impl Road {
    pub fn new(sh: Shaders) -> Self {
        let trail = Track::new(TRAIL.to_vec());
        // Each clearing lights when the linear trace reaches it.
        let stop_at = STOPS
            .iter()
            .map(|s| {
                let mut best = (f32::MAX, 0.);
                for (i, p) in trail.points.iter().enumerate() {
                    let d = (p.0 - s.0).powi(2) + (p.1 - s.1).powi(2);
                    if d < best.0 {
                        best = (d, trail.lengths[i] / trail.total());
                    }
                }
                TRACE.0 + best.1 * (TRACE.1 - TRACE.0)
            })
            .collect::<Vec<_>>();
        Self {
            sh,
            cam: camera(&[(1.0, 4.7, (440., 640., 1.85), (830., 445., 1.04))]),
            storm: tw(0., 3.2, 0.55, 0.18, Easing::EaseInOut),
            gold: tw(0.6, 3.6, 0., 0.3, Easing::EaseInOut),
            drop: tw(0.25, 0.6, -300., 0., Easing::EaseIn),
            dust: tw(0.6, 1.5, 0., 1., Easing::EaseOut),
            trace: tw(TRACE.0, TRACE.1, 0., 1., Easing::Linear),
            lit: stop_at.iter().map(|at| spring(*at, 0.01, 1., BOUNCY)).collect(),
            trail_d: smooth(TRAIL),
            trail,
            stop_at,
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
        let Some(map) = ctx.get_image("hearthvale-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let painting = painting(&self.sh, &frame, map, Grade {
            storm: frame.animate(&self.storm),
            red: 0.2,
            gold: frame.animate(&self.gold),
            ..Default::default()
        });
        let ford = STOPS[0];
        let drop = frame.animate(&self.drop);
        let wave_flag = |k: f32| 5. * wave(t, 2., k);
        let flag = format!(
            "M0 -120 C14 {:.1} 30 {:.1} 46 {:.1} L46 {:.1} C30 {:.1} 14 {:.1} 0 -72Z",
            -122. + wave_flag(0.), -118. + wave_flag(0.2), -122. + wave_flag(0.4),
            -78. + wave_flag(0.45), -74. + wave_flag(0.25), -76. + wave_flag(0.05)
        );
        let dust = frame.animate(&self.dust);
        let ring = if dust > 0. && dust < 1. {
            fframes::svgr!(
                <g>
                    <ellipse cx={ford.0} cy={ford.1} rx={10. + 70. * dust} ry={4. + 22. * dust} fill="none" stroke="#f3dfb0" stroke-width={8. * (1. - dust)} opacity={1. - dust} />
                    <ellipse cx={ford.0} cy={ford.1} rx={6. + 110. * dust} ry={3. + 36. * dust} fill="url(#g-gold)" opacity={(1. - dust) * 0.6} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let p = frame.animate(&self.trace);
        let len = self.trail.total();
        let flow = -t * 30. * 2. / LOOP;
        let head = if p > 0. && p < 1. {
            let (hx, hy) = self.trail.at(p);
            fframes::svgr!(
                <g>
                    <circle cx={hx} cy={hy} r="46" fill="url(#g-gold)" />
                    <circle cx={hx} cy={hy} r="6" fill="#fffef4" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let stops = STOPS
            .iter()
            .enumerate()
            .map(|(i, s)| {
                let k = frame.animate(&self.lit[i]);
                if t < self.stop_at[i] {
                    return Svgr::empty();
                }
                let boss = i == STOPS.len() - 1;
                let pulse = 0.5 + 0.5 * wave(t, 2., i as f32 * 0.1);
                let age = t - self.stop_at[i];
                let ring = if age < 0.8 {
                    let a = age / 0.8;
                    fframes::svgr!(<circle cx={s.0} cy={s.1} r={16. + 60. * a} fill="none" stroke={if boss { "#ff4a2a" } else { "#ffe08a" }} stroke-width={6. * (1. - a)} opacity={1. - a} />)
                } else {
                    Svgr::empty()
                };
                fframes::svgr!(
                    <g>
                        {ring}
                        <circle cx={s.0} cy={s.1} r={34. + 10. * pulse} fill={if boss { "url(#g-red)" } else { "url(#g-gold)" }} opacity={0.75 * k.min(1.)} />
                        <circle cx={s.0} cy={s.1} r={13. * k} fill={if boss { "#ff6a3a" } else { "#fff0b8" }} stroke={if boss { "#5a0a04" } else { "#8a5a10" }} stroke-width="3" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let hall = if t > self.stop_at[9] {
            fframes::svgr!(<ellipse cx={HALL.0} cy={HALL.1 + 20.} rx="150" ry="80" fill="url(#g-red)" opacity={0.32 + 0.14 * wave(t, 1., 0.)} />)
        } else {
            Svgr::empty()
        };
        let motes = Motes { count: 40, seed: 77, area: (0., 0., 1280., 760.), rise: 520., period: LOOP, size: (1.2, 3.), sway: 20., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, shake(t, 0.6, 6.))}>
                    {painting}
                    {hall}
                    <path d={self.trail_d.as_str()} fill="none" stroke="#ffb43a" stroke-width="18" stroke-linecap="round" stroke-dasharray={len * 1.1} stroke-dashoffset={len * 1.1 * (1. - p)} filter="url(#blur8)" opacity="0.8" />
                    <path d={self.trail_d.as_str()} fill="none" stroke="#fff3c4" stroke-width="4" stroke-linecap="round" stroke-dasharray={len * 1.1} stroke-dashoffset={len * 1.1 * (1. - p)} />
                    <g opacity={(p * 3.).min(1.)}>
                        <path d={self.trail_d.as_str()} fill="none" stroke="#fffbe6" stroke-width="2" stroke-dasharray="6 24" stroke-dashoffset={flow} opacity={if p >= 1. { 0.9 } else { 0. }} />
                    </g>
                    {stops}
                    {head}
                    {ring}
                    <g transform={format!("translate({} {}) ", ford.0, ford.1 + drop)}>
                        <ellipse cx="0" cy="2" rx="20" ry="6" fill="#000" opacity="0.4" />
                        <rect x="-2.5" y="-128" width="5" height="130" fill="#5a3a18" />
                        <path d={flag} fill="#f0b83c" stroke="#7a4a0c" stroke-width="2" />
                        <circle cx="22" cy="-98" r="9" fill="#fff4cc" />
                        <circle cx="0" cy="-130" r="5" fill="#ffe08a" />
                    </g>
                </g>
                {motes.draw(t, 0.8)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
            </g>
        )
    }
}
