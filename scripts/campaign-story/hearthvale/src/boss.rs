//! Boss: the hall wakes, the Baron, the toll, the friend, the challenge.
use crate::fx::*;
use crate::{CLIP_FRAMES, TRAIL};
use fframes::{
    Color, Duration, FFramesContext, FontQuery, Frame, Scene, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::{PI, TAU};

const WARM: (f32, f32, f32) = (1.0, 0.78, 0.45);

fn flash(at: f32, peak: f32, fade: f32) -> Anim {
    keys(&[(at, at + 0.06, 0., peak, Easing::Linear), (at + 0.06, at + fade, peak, 0., Easing::EaseOut)])
}

/// A short push to `amount`, then a spring back to 1.
fn punch(at: f32, amount: f32) -> Anim {
    KeyFramesAnimation::new(vec![
        KeyFrame { start: at - 0.06, end: Some(at), from: 1.0, to: amount, easing: &Easing::Linear },
        KeyFrame { start: at, end: None, from: amount, to: 1.0, easing: &BOUNCY },
    ])
}

/// Map units to screen pixels for a camera pose.
fn project((cx, cy, z): (f32, f32, f32), (x, y): (f32, f32)) -> (f32, f32) {
    (640. + (x - cx) * 0.8 * z, 360. + (y - cy) * 0.8 * z)
}

/// A small flame, its base at the origin.
fn flame(h: f32, sway: f32) -> String {
    format!(
        "M0 0 C{:.1} {:.1} {:.1} {:.1} {sway:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} 0 0Z",
        -h * 0.42, -h * 0.12, -h * 0.4, -h * 0.6, -h, h * 0.4, -h * 0.6, h * 0.42, -h * 0.12
    )
}

/// Sparks thrown out by an impact, `dt` seconds after it.
fn burst<'a>(x: f32, y: f32, dt: f32, life: f32, count: u32, seed: u32, speed: f32, fill: &'static str) -> Svgr<'a> {
    if !(0.0..life).contains(&dt) {
        return Svgr::empty();
    }
    let sparks = (0..count)
        .map(|k| {
            let a = lerp(-PI * 0.95, -PI * 0.05, rnd(k, seed));
            let v = speed * lerp(0.4, 1.0, rnd(k, seed + 1));
            let px = x + a.cos() * v * dt;
            let py = y + a.sin() * v * dt + 260. * dt * dt;
            let r = lerp(1.2, 3.4, rnd(k, seed + 2)) * (1. - dt / life * 0.5);
            fframes::svgr!(<circle cx={px} cy={py} r={r} fill={fill} opacity={1. - dt / life} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{sparks}</g>)
}

/// A jagged lightning bolt from `top` going down, with one branch.
fn bolt(top: (f32, f32), seed: u32) -> String {
    let mut main = vec![top];
    let mut p = top;
    for i in 0..7u32 {
        p = (p.0 + lerp(-26., 30., rnd(i, seed)), p.1 + lerp(26., 40., rnd(i, seed + 1)));
        main.push(p);
    }
    let mut branch = vec![main[3]];
    let mut q = main[3];
    for i in 0..3u32 {
        q = (q.0 + lerp(16., 34., rnd(i, seed + 2)), q.1 + lerp(18., 30., rnd(i, seed + 3)));
        branch.push(q);
    }
    format!("{} {}", path(&main, false), path(&branch, false))
}

/// Rain streaks over the whole frame; the period divides LOOP.
fn rain<'a>(t: f32, alpha: f32, count: u32) -> Svgr<'a> {
    if alpha <= 0. {
        return Svgr::empty();
    }
    let drops = (0..count)
        .map(|i| {
            let u = (t / 0.8 + rnd(i, 581)).rem_euclid(1.0);
            let x = rnd(i, 582) * 1400. - 60. - u * 120.;
            let y = -60. + u * 840.;
            let l = 18. + 16. * rnd(i, 583);
            fframes::svgr!(<path d={format!("M{x:.1} {y:.1} l{:.1} {l:.1}", -l * 0.15)} stroke="#c9d4ee" stroke-width="1.2" opacity={alpha * (0.3 + 0.5 * rnd(i, 584))} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{drops}</g>)
}

/// A banner on a pole, its foot at the origin. `cloth` and `edge` are colors.
fn banner<'a>(t: f32, height: f32, cloth: &'static str, edge: &'static str, mark: Svgr<'a>, phase: f32) -> Svgr<'a> {
    let w = |k: f32| 7. * wave(t, 2., phase + k);
    let top = -height;
    let flag = format!(
        "M3 {top:.1} C40 {:.1} 80 {:.1} 118 {:.1} L118 {:.1} C80 {:.1} 40 {:.1} 3 {:.1}Z",
        top + w(0.), top + 6. + w(0.15), top + 2. + w(0.3),
        top + 150. + w(0.4), top + 158. + w(0.25), top + 152. + w(0.1), top + 156.
    );
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="2" rx="26" ry="7" fill="#000" opacity="0.45" />
            <rect x="-4" y={top - 8.} width="8" height={height + 10.} rx="3" fill="#4a2c12" />
            <path d={flag} fill={cloth} stroke={edge} stroke-width="3" />
            <g transform={format!("translate(60 {:.1})", top + 76. + w(0.25))}>{mark}</g>
            <circle cx="0" cy={top - 10.} r="7" fill={edge} />
        </g>
    )
}

// ---------------------------------------------------------------- 1. Hall

/// Torches on the palisade of Brassbelly Hall, left to right, in map units.
const TORCHES: [(f32, f32); 11] = [
    (1042., 150.), (1057., 98.), (1067., 145.), (1100., 150.), (1130., 160.),
    (1177., 165.), (1220., 157.), (1255., 150.), (1285., 150.), (1305., 104.), (1317., 145.),
];
/// Windows of the hall, (x, y, w, h).
const WINDOWS: [(f32, f32, f32, f32); 4] = [
    (1116., 135., 8., 10.), (1133., 132., 8., 10.), (1182., 134., 8., 11.), (1157., 95., 8., 9.),
];
const DOOR: (f32, f32) = (1162., 146.);
const TORCH_AT: f32 = 0.9;
const TORCH_STEP: f32 = 0.16;
const GATE_AT: f32 = 3.35;
const BOLT_AT: f32 = 2.0;

#[derive(Debug)]
pub struct Hall {
    sh: Shaders,
    cam: Cam,
    dark: Anim,
    torches: Vec<Anim>,
    windows: Anim,
    gate: Anim,
    spill: Anim,
    lightning: Anim,
    flash: Anim,
    rain: Anim,
    clouds: Anim,
    bolt: String,
}

impl Hall {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 4.6, (980., 430., 1.3), (1175., 225., 2.05))]),
            dark: tw(0.8, 3.4, 0.42, 0.22, Easing::EaseInOut),
            torches: (0..TORCHES.len()).map(|i| spring(TORCH_AT + TORCH_STEP * i as f32, 0., 1., BOUNCY)).collect(),
            windows: tw(2.5, 3.1, 0., 1., Easing::EaseOut),
            gate: tw(GATE_AT, GATE_AT + 0.85, 0., 1., Easing::EaseInOut),
            spill: tw(GATE_AT + 0.1, GATE_AT + 1.2, 0., 1., Easing::EaseOut),
            lightning: keys(&[(BOLT_AT, BOLT_AT + 0.05, 0., 1., Easing::Linear), (BOLT_AT + 0.05, BOLT_AT + 0.45, 1., 0., Easing::EaseIn)]),
            flash: keys(&[
                (BOLT_AT, BOLT_AT + 0.05, 0., 0.7, Easing::Linear),
                (BOLT_AT + 0.05, BOLT_AT + 0.14, 0.7, 0.15, Easing::EaseOut),
                (BOLT_AT + 0.14, BOLT_AT + 0.19, 0.15, 0.5, Easing::Linear),
                (BOLT_AT + 0.19, BOLT_AT + 0.8, 0.5, 0., Easing::EaseOut),
            ]),
            rain: tw(0., 0.6, 0.25, 0.55, Easing::EaseOut),
            clouds: tw(0., 1.0, 0.6, 0.85, Easing::EaseOut),
            bolt: bolt((1010., -20.), 17),
        }
    }
}

impl Scene for Hall {
    fn name(&self) -> &'static str {
        "BossHall"
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
        let flash = frame.animate(&self.flash);
        // A far flicker once per loop keeps the storm alive.
        let far = if t > 5. { 0.16 * (-(((t - 5.) % LOOP) - 1.4).powi(2) * 70.).exp() } else { 0. };
        let lit = self.torches.iter().map(|a| frame.animate(a).clamp(0., 1.)).sum::<f32>() / TORCHES.len() as f32;
        let painting = painting(&self.sh, &frame, map, Grade {
            storm: 0.82,
            red: 0.12 + 0.18 * lit,
            dark: frame.animate(&self.dark),
            flash: flash * 0.45 + far,
            flash_color: (0.75, 0.82, 1.0),
            ..Default::default()
        });
        let torches = TORCHES
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let at = TORCH_AT + TORCH_STEP * i as f32;
                if t < at {
                    return fframes::svgr!(<circle cx={x} cy={y} r="1.6" fill="#2a1a10" />);
                }
                let k = frame.animate(&self.torches[i]).max(0.);
                let f = flicker(t, 0.3 + i as f32 * 0.17);
                let h = (8. + 3.5 * f) * k;
                let sway = 1.2 * wave(t, 3., i as f32 * 0.13);
                fframes::svgr!(
                    <g>
                        <circle cx={x} cy={y - 3.} r={(22. + 6. * f) * k.min(1.2)} fill="url(#g-ember)" opacity={0.5 * k.min(1.)} />
                        <g transform={format!("translate({x:.1} {y:.1})")}>
                            <path d={flame(h, sway)} fill="#ffb347" />
                            <path d={flame(h * 0.55, sway * 0.6)} fill="#fff6d6" />
                        </g>
                        {burst(x, y - 4., t - at, 0.55, 8, 600 + i as u32 * 7, 34., "#ffd28a")}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let win = frame.animate(&self.windows);
        let windows = WINDOWS
            .iter()
            .enumerate()
            .map(|(i, &(x, y, w, h))| {
                let f = 0.75 + 0.25 * flicker(t, 0.9 + i as f32 * 0.31);
                fframes::svgr!(
                    <g opacity={win * f}>
                        <circle cx={x + w / 2.} cy={y + h / 2.} r="16" fill="url(#g-candle)" />
                        <rect x={x} y={y} width={w} height={h} rx="3" fill="#ffc46a" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let gate = frame.animate(&self.gate);
        let spill = frame.animate(&self.spill);
        let breathe = if t > GATE_AT + 1.2 { 0.88 + 0.12 * wave(t, 2., 0.1) } else { 1. };
        let (dx, dy) = DOOR;
        let door = if gate > 0. {
            fframes::svgr!(
                <g>
                    <ellipse cx={dx + 4.} cy={dy + 30.} rx={(34. * spill).max(0.5)} ry={(26. * spill).max(0.5)} fill="url(#g-candle)" opacity={0.9 * breathe} />
                    <ellipse cx={dx} cy={dy} rx={(30. * spill).max(0.5)} ry={(22. * spill).max(0.5)} fill="url(#g-ember)" opacity={0.5 * spill * breathe} />
                    <path d={format!("M{} {} L{} {} L{} {} Q{dx} {} {} {}Z", dx - 9. * gate, dy + 11., dx + 9. * gate, dy + 11., dx + 9. * gate, dy - 4., dy - 13., dx - 9. * gate, dy - 4.)} fill="#ffe2a0" opacity={gate.min(1.)} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let warm = fframes::svgr!(<ellipse cx="1180" cy="150" rx="190" ry="90" fill="url(#g-candle)" opacity={0.75 * lit} />);
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
        let storm = Fog { density: 0.56, soft: 0.22, light: Color::hex("#4a4f63"), shade: Color::hex("#14141e"), dir: (-0.45, 0.05), scale: 1.7, seed: 23.0 };
        let (gx, gy) = project(cam, DOOR);
        let embers = Motes { count: 34, seed: 611, area: (gx - 380., gy - 300., 760., 360.), rise: 240., period: LOOP, size: (0.9, 2.4), sway: 14., fill: "url(#g-ember)" };
        fframes::svgr!(
            <g>
                <defs>
                    <linearGradient id="g-hall-storm-fade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0.4" stop-color="#fff" />
                        <stop offset="1" stop-color="#000" />
                    </linearGradient>
                    <mask id="hall-storm-fade"><rect x="-40" y="-60" width="1360" height="360" fill="url(#g-hall-storm-fade)" /></mask>
                </defs>
                <g transform={cam_transform(cam, shake(t, GATE_AT + 0.05, 4.))}>
                    {painting}
                    {warm}
                    {windows}
                    {door}
                    {torches}
                </g>
                <g mask="url(#hall-storm-fade)">{storm.draw(&self.sh, &frame, frame.animate(&self.clouds), (-40., -60., 1360., 360.))}</g>
                {bolt}
                {rays(&self.sh, &frame, (gx, gy - 10.), spill * 0.28 * breathe, 0.32, WARM)}
                {embers.draw(t, lit)}
                {rain(t, frame.animate(&self.rain), 140)}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
                <rect width="1280" height="720" fill="#e8eeff" opacity={flash * 0.5} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Baron

const BARON_X: f32 = 565.;
const BARON_Y: f32 = 139.;
const BARON_W: f32 = 470.;
const BARON_H: f32 = 581.;
/// The Baron's free hand in the cut-out, as fractions of its size.
const HAND: (f32, f32) = (0.9, 0.46);
const LAND_AT: f32 = 1.9;
const FLICK_AT: f32 = 3.0;
const FLICK_TIME: f32 = 1.0;
const CREST: (f32, f32) = (800., 300.);
const NAME: &str = "BRASSBELLY";

fn name_font() -> FontQuery<'static> {
    FontQuery { family: "Cinzel", size: 58, weight: 900, ..Default::default() }
}

#[derive(Debug)]
pub struct Baron {
    sh: Shaders,
    curtain: Anim,
    slit: Anim,
    shaft: Anim,
    step: Anim,
    lit: Anim,
    crest: Anim,
    crest_fill: Anim,
    slam: Anim,
    slam_in: Anim,
    underline: Anim,
    push: Anim,
}

impl Baron {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            curtain: tw(0.3, 1.55, 0., 600., Easing::EaseInOut),
            slit: keys(&[(0., 0.3, 0.4, 1., Easing::EaseIn), (0.3, 0.9, 1., 0., Easing::EaseOut)]),
            shaft: tw(0.7, 1.9, 0., 0.8, Easing::EaseInOut),
            step: KeyFramesAnimation::new(vec![
                KeyFrame { start: 1.35, end: Some(LAND_AT), from: 0.86, to: 1.02, easing: &Easing::EaseIn },
                KeyFrame { start: LAND_AT, end: None, from: 1.02, to: 1.0, easing: &HEAVY },
            ]),
            lit: tw(1.5, 2.4, 0., 1., Easing::EaseInOut),
            crest: tw(2.0, 3.2, 0., 1., Easing::EaseInOut),
            crest_fill: tw(2.9, 3.6, 0., 1., Easing::EaseOut),
            slam: KeyFramesAnimation::new(vec![
                KeyFrame { start: 2.3, end: Some(2.46), from: 1.7, to: 1.0, easing: &Easing::EaseIn },
            ]),
            slam_in: tw(2.3, 2.42, 0., 1., Easing::EaseIn),
            underline: tw(2.5, 3.1, 0., 1., Easing::EaseOut),
            push: tw(0., 5., 1.0, 1.05, Easing::EaseInOut),
        }
    }
}

impl Scene for Baron {
    fn name(&self) -> &'static str {
        "BossBaron"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(bokeh), Some(baron)) = (ctx.get_image("vault-bokeh.png"), ctx.get_image("baron.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let push = frame.animate(&self.push);
        let open = frame.animate(&self.curtain);
        // The hem keeps swinging after the curtains stop, then settles into a slow sway.
        let swing = if t > 1.55 { 5. * (-(t - 1.55) * 2.2).exp() * ((t - 1.55) * 9.).sin() } else { 4. * (t * 4.).sin() * (open / 600.) };
        let sway = swing + 1.2 * wave(t, 1., 0.1);
        let curtain = |side: f32| {
            let x0 = if side < 0. { -20. } else { 620. };
            let inner = if side < 0. { 660. } else { 620. };
            let d = format!(
                "M{x0} -20 L{} -20 L{} 740 L{x0} 740Z",
                x0 + 680., x0 + 680. + sway * side
            );
            fframes::svgr!(
                <g transform={format!("translate({:.1} 0)", side * open)}>
                    <path d={d} fill="url(#g-velvet)" />
                    <rect x={x0} y="-20" width="680" height="760" fill="url(#g-top-shade)" opacity="0.6" />
                    <path d={format!("M{inner} -20 L{:.1} 740", inner + sway * side)} stroke="#e0b250" stroke-width="10" />
                    <path d={format!("M{inner} -20 L{:.1} 740", inner + sway * side)} stroke="#fff0b0" stroke-width="2" opacity="0.7" />
                </g>
            )
        };
        let slit = frame.animate(&self.slit);
        let shaft = frame.animate(&self.shaft);
        let step = frame.animate(&self.step);
        let lit = frame.animate(&self.lit);
        let breathe = 1. + 0.006 * wave(t, 1., 0.);
        let feet = (BARON_X + BARON_W / 2., 716.);
        let baron_layer = if t >= 1.35 {
            let scale = step * breathe;
            fframes::svgr!(
                <g transform={format!("translate({} {}) scale({scale:.4}) translate({} {})", feet.0, feet.1, -feet.0, -feet.1)}>
                    <image href={baron.href()} x={BARON_X} y={BARON_Y} width={BARON_W} height={BARON_H} filter="url(#aura)" opacity={0.55 * lit} />
                    <image href={baron.href()} x={BARON_X} y={BARON_Y} width={BARON_W} height={BARON_H} filter="url(#silhouette)" opacity={(t - 1.35).min(0.35) / 0.35} />
                    <image href={baron.href()} x={BARON_X} y={BARON_Y} width={BARON_W} height={BARON_H} opacity={lit} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The dust puff where he lands.
        let dust = if (LAND_AT..LAND_AT + 1.1).contains(&t) {
            let dt = t - LAND_AT;
            let puffs = (0..16u32)
                .map(|k| {
                    let dir = if k % 2 == 0 { 1. } else { -1. };
                    let v = lerp(120., 320., rnd(k, 640));
                    let x = feet.0 + dir * (40. + v * (1. - (-dt * 3.).exp()) / 3.);
                    let y = feet.1 - 6. - lerp(0., 40., rnd(k, 641)) * dt;
                    let r = lerp(14., 34., rnd(k, 642)) * (0.6 + dt);
                    fframes::svgr!(<circle cx={x} cy={y} r={r} fill="url(#g-ash)" opacity={0.55 * (1. - dt / 1.1)} />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(<g>{puffs}</g>)
        } else {
            Svgr::empty()
        };
        // The crest of the very large hat draws itself behind him.
        let crest = frame.animate(&self.crest);
        let fill = frame.animate(&self.crest_fill);
        let ticks = (0..24)
            .map(|i| {
                let a = i as f32 * 15. + 15. * t / LOOP;
                fframes::svgr!(<path d="M0 -332 L0 -316" stroke="#e0b250" stroke-width="3" transform={format!("rotate({a:.2})")} />)
            })
            .collect::<Vec<_>>();
        // A halo of his coins orbits the ring: one coin step per loop, so it repeats.
        let orbit = (0..12)
            .map(|i| {
                let pop = ((crest * 1.2 - i as f32 / 12.) * 6.).clamp(0., 1.);
                if pop <= 0. {
                    return Svgr::empty();
                }
                let a = (i as f32 * 30. - 90. + 30. * t / LOOP).to_radians();
                let (x, y) = (a.cos() * 286., a.sin() * 286.);
                let ratio = 0.45 + 0.55 * (a + TAU * t / LOOP).cos().abs();
                fframes::svgr!(<g opacity={pop}>{coin(x, y, 13. * pop, ratio, 0., true)}</g>)
            })
            .collect::<Vec<_>>();
        let crest_layer = if crest > 0. {
            fframes::svgr!(
                <g transform={format!("translate({} {})", CREST.0, CREST.1)}>
                    <circle r="300" fill="url(#g-candle)" opacity={0.6 * fill} />
                    <circle r="270" fill="none" stroke="#e0b250" stroke-width="2" stroke-dasharray="1700" stroke-dashoffset={1700. * (1. - crest)} opacity="0.7" />
                    <circle r="302" fill="none" stroke="#a8641a" stroke-width="5" stroke-dasharray="1900" stroke-dashoffset={-1900. * (1. - crest)} opacity="0.5" />
                    <g opacity={fill}>{ticks}</g>
                    {orbit}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // He flicks one coin high into the light and catches it.
        let hand = (BARON_X + BARON_W * HAND.0, BARON_Y + BARON_H * HAND.1);
        let coin_layer = if (FLICK_AT..FLICK_AT + FLICK_TIME).contains(&t) {
            let dt = t - FLICK_AT;
            let g = 8. * 300. / (FLICK_TIME * FLICK_TIME);
            let y = hand.1 - g * FLICK_TIME / 2. * dt + g / 2. * dt * dt;
            let x = hand.0 - 30. * (dt / FLICK_TIME);
            let ratio = 0.12 + 0.88 * (dt * TAU * 3.).cos().abs();
            let apex = (-((dt - 0.5) * 9.).powi(2)).exp();
            fframes::svgr!(
                <g>
                    {coin(x, y, 22., ratio, 0., true)}
                    {glint(x + 8., y - 8., 9., apex)}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let catch = glint(hand.0 - 30., hand.1, 7., if t > FLICK_AT + FLICK_TIME { (1. - (t - FLICK_AT - FLICK_TIME) / 0.35).max(0.) } else { 0. });
        // The name plate slams in at the left.
        let slam = frame.animate(&self.slam);
        let slam_in = frame.animate(&self.slam_in);
        let underline = frame.animate(&self.underline);
        let name_w = frame.text_width(ctx, name_font(), NAME).unwrap_or(420) as f32;
        let plate = if slam_in > 0. {
            fframes::svgr!(
                <g transform={format!("translate(84 330) scale({slam:.3}) translate(-84 -330)")} opacity={slam_in}>
                    <text x="88" y="262" font-family="Cinzel" font-weight="900" font-size="26" letter-spacing="10" fill="#f0c86a">"BARON"</text>
                    <text x="84" y="330" font-family="Cinzel" font-weight="900" font-size="58" fill="url(#g-blood)" stroke="#1a0503" stroke-width="2">{NAME}</text>
                    <path d={format!("M86 352 L{:.1} 352", 86. + name_w * underline)} stroke="#c23a22" stroke-width="3" />
                    <path d={format!("M86 360 L{:.1} 360", 86. + name_w * 0.6 * underline)} stroke="#e0b250" stroke-width="1.5" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let chandeliers = [(210., 90.), (1080., 70.)]
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let f = flicker(t, 0.21 + i as f32 * 0.4);
                fframes::svgr!(<circle cx={x} cy={y} r={170. + 30. * f} fill="url(#g-candle)" opacity={0.55 + 0.35 * f} />)
            })
            .collect::<Vec<_>>();
        let motes = Motes { count: 44, seed: 661, area: (CREST.0 - 240., 0., 480., 720.), rise: 300., period: LOOP, size: (0.8, 2.2), sway: 18., fill: "#fff1c8" };
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="#0b0604" />
                <g transform={format!("translate(640 360) scale({:.4}) translate(-640 -360)", 1.12 - (push - 1.) * 0.6)}>
                    <image href={bokeh.href()} x="0" y="0" width="1280" height="720" opacity="0.8" />
                </g>
                {chandeliers}
                <g transform={format!("translate(800 700) scale({push:.4}) translate(-800 -700)")}>
                    {crest_layer}
                    {rays(&self.sh, &frame, (CREST.0, -160.), shaft, 1.0, (1.0, 0.9, 0.66))}
                    <ellipse cx={feet.0} cy="712" rx="290" ry="46" fill="url(#g-gold)" opacity={0.55 * shaft} />
                    {baron_layer}
                    {dust}
                    {coin_layer}
                    {catch}
                </g>
                {motes.draw(t, shaft)}
                {plate}
                <rect x="636" y="-20" width="8" height="760" fill="#ffe2a0" opacity={slit} filter="url(#blur8)" />
                {curtain(-1.)}
                {curtain(1.)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Toll

/// Where the toll stamps land, as fractions of the Trail.
const TOLLS: [f32; 5] = [0.1, 0.28, 0.46, 0.64, 0.83];
const STAMP_AT: f32 = 1.0;
const STAMP_STEP: f32 = 0.38;
const STAMP_FALL: f32 = 0.16;
const PAY_AT: f32 = 3.0;
/// Coins arrive at the hall door.
const PURSE: (f32, f32) = (1162., 160.);

#[derive(Debug)]
pub struct Toll {
    sh: Shaders,
    zoom: Anim,
    turn: Anim,
    carts: Vec<Anim>,
    red: Anim,
    track: Track,
    trail: String,
}

impl Toll {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            zoom: tw(0., 5., 1.36, 1.16, Easing::EaseInOut),
            turn: tw(0., 5., -1.5, 0., Easing::EaseInOut),
            carts: (0..TOLLS.len())
                .map(|i| tw(0.1, STAMP_AT + STAMP_STEP * i as f32 - 0.05, 0., 1., Easing::EaseOut))
                .collect(),
            red: tw(STAMP_AT, STAMP_AT + STAMP_STEP * 4. + 0.3, 0., 1., Easing::EaseInOut),
            track: Track::new(TRAIL.to_vec()),
            trail: smooth(TRAIL),
        }
    }
}

/// A red wax toll stamp with the hat, centered on the origin.
fn stamp<'a>(glow: f32) -> Svgr<'a> {
    let blob = (0..14u32)
        .map(|i| {
            let a = i as f32 / 14. * TAU;
            let r = 30. + 7. * rnd(i, 700);
            (a.cos() * r, a.sin() * r * 0.92)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <circle r="56" fill="url(#g-red)" opacity={glow} />
            <path d={smooth(&[&blob[..], &blob[..2]].concat())} fill="#7a0610" />
            <circle r="26" fill="url(#g-wax-red)" stroke="#5a0208" stroke-width="2" />
            <circle r="20" fill="none" stroke="#ff8a70" stroke-width="1.2" opacity="0.5" />
            <path d={HAT} transform="translate(0 4) scale(0.5)" fill="#5a0208" />
            <path d="M-12 -14 Q-4 -20 6 -18" stroke="#ffd0c0" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round" />
        </g>
    )
}

/// A cart of bread loaves, facing right, its wheels on the origin.
fn cart<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="3" rx="22" ry="5" fill="#000" opacity="0.4" />
            <ellipse cx="-6" cy="-24" rx="9" ry="6" fill="#c98a3a" stroke="#6a3a10" stroke-width="1.2" />
            <ellipse cx="6" cy="-25" rx="9" ry="6" fill="#d89a48" stroke="#6a3a10" stroke-width="1.2" />
            <ellipse cx="0" cy="-30" rx="8" ry="5.5" fill="#e8b060" stroke="#6a3a10" stroke-width="1.2" />
            <rect x="-18" y="-22" width="36" height="15" rx="2" fill="#8a5a2a" stroke="#3a2008" stroke-width="1.5" />
            <path d="M18 -14 L28 -12" stroke="#3a2008" stroke-width="2.5" />
            <circle cx="-10" cy="-4" r="5.5" fill="#3a2008" />
            <circle cx="10" cy="-4" r="5.5" fill="#3a2008" />
        </g>
    )
}

impl Scene for Toll {
    fn name(&self) -> &'static str {
        "BossToll"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("hearthvale-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let zoom = frame.animate(&self.zoom);
        let turn = frame.animate(&self.turn);
        let painting = painting(&self.sh, &frame, map, Grade { dusk: 0.78, red: 0.1, gold: 0.15, dark: 0.08, ..Default::default() });
        let mut kick = (0., 0.);
        for i in 0..TOLLS.len() {
            let s = shake(t, STAMP_AT + STAMP_STEP * i as f32, 6.);
            kick = (kick.0 + s.0, kick.1 + s.1);
        }
        let len = self.track.total();
        let red = frame.animate(&self.red);
        let flow = -t * 34. * 2. / LOOP;
        let road = fframes::svgr!(
            <g>
                <path d={self.trail.as_str()} fill="none" stroke="#ffcf6a" stroke-width="14" stroke-linecap="round" filter="url(#blur8)" opacity={0.5 * (1. - red)} />
                <path d={self.trail.as_str()} fill="none" stroke="#ff2a12" stroke-width="16" stroke-linecap="round" filter="url(#blur8)" opacity="0.55" stroke-dasharray={len * 1.1} stroke-dashoffset={len * 1.1 * (1. - red)} />
                <path d={self.trail.as_str()} fill="none" stroke="#ff7a52" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="20 14" stroke-dashoffset={flow} opacity={0.85 * red} />
            </g>
        );
        let carts = TOLLS
            .iter()
            .enumerate()
            .map(|(i, &f)| {
                let p = frame.animate(&self.carts[i]);
                let (x, y) = self.track.at(f - 0.075 + 0.06 * p);
                let stamped = STAMP_AT + STAMP_STEP * i as f32;
                let rock = if t > stamped { 9. * (-(t - stamped) * 4.).exp() * ((t - stamped) * 18.).sin() } else { 0. };
                let bob = 0.8 * wave(t, 4., i as f32 * 0.2);
                fframes::svgr!(
                    <g transform={format!("translate({x:.1} {:.1}) rotate({rock:.1}) scale(2)", y + bob)} opacity={(p * 4.).min(1.)}>
                        {cart()}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let stamps = TOLLS
            .iter()
            .enumerate()
            .map(|(i, &f)| {
                let at = STAMP_AT + STAMP_STEP * i as f32;
                if t < at - STAMP_FALL {
                    return Svgr::empty();
                }
                let (x, y) = self.track.at(f);
                let fall = ((t - (at - STAMP_FALL)) / STAMP_FALL).min(1.);
                let s = lerp(1.9, 1.0, fall * fall);
                let dt = t - at;
                let glow = if dt > 0. { 0.35 + 0.25 * wave(t, 2., i as f32 * 0.2) + 0.6 * (-dt * 3.).exp() } else { 0. };
                let ring = if (0.0..0.7).contains(&dt) {
                    let a = dt / 0.7;
                    fframes::svgr!(
                        <g>
                            <ellipse cx={x} cy={y} rx={30. + 90. * a} ry={18. + 50. * a} fill="none" stroke="#ff5a3a" stroke-width={9. * (1. - a)} opacity={1. - a} />
                            <ellipse cx={x} cy={y} rx={40. + 120. * a} ry={22. + 60. * a} fill="url(#g-dust)" opacity={0.5 * (1. - a)} />
                        </g>
                    )
                } else {
                    Svgr::empty()
                };
                fframes::svgr!(
                    <g>
                        {ring}
                        <g transform={format!("translate({x:.1} {:.1}) scale({s:.3})", y - 40. * (1. - fall))} opacity={(fall * 3.).min(1.)}>{stamp(glow)}</g>
                        {burst(x, y - 6., dt, 0.6, 10, 720 + i as u32 * 5, 120., "#ff8a5a")}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // Each stopped cart pays the hall: two coins per second per cart, a seamless stream.
        let coins = TOLLS
            .iter()
            .enumerate()
            .flat_map(|(i, &f)| {
                let from = self.track.at(f - 0.015);
                (0..2u32).map(move |k| (i, from, k))
            })
            .filter_map(|(i, from, k)| {
                let u = (t + k as f32 * 0.5 + i as f32 * 0.13).rem_euclid(1.0);
                if t - u < PAY_AT {
                    return None;
                }
                let ctrl = ((from.0 + PURSE.0) / 2., from.1.min(PURSE.1) - 170.);
                let q = 1. - u;
                let x = q * q * from.0 + 2. * q * u * ctrl.0 + u * u * PURSE.0;
                let y = q * q * from.1 + 2. * q * u * ctrl.1 + u * u * PURSE.1;
                let ratio = 0.2 + 0.8 * (u * TAU * 2. + i as f32).cos().abs();
                let o = (u / 0.1).min(1.) * ((1. - u) / 0.15).min(1.);
                Some(fframes::svgr!(
                    <g opacity={o}>
                        <circle cx={x} cy={y} r="20" fill="url(#g-gold)" opacity="0.55" />
                        {coin(x, y, 12., ratio, 0., false)}
                    </g>
                ))
            })
            .collect::<Vec<_>>();
        let paid = if t > PAY_AT + 0.8 { 0.45 + 0.3 * wave(t, 4., 0.) } else { 0. };
        let hall = fframes::svgr!(
            <g>
                <ellipse cx={PURSE.0 + 10.} cy={PURSE.1 - 10.} rx="130" ry="80" fill="url(#g-gold)" opacity={paid} />
                {glint(PURSE.0, PURSE.1 - 4., 5., paid)}
            </g>
        );
        let clouds = Fog { density: 0.45, soft: 0.25, light: Color::hex("#e89a6a"), shade: Color::hex("#3a1c3a"), dir: (-0.3, 0.05), scale: 1.5, seed: 31.0 };
        let motes = Motes { count: 30, seed: 741, area: (0., 0., 1280., 760.), rise: 520., period: LOOP, size: (1.0, 2.6), sway: 18., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <g transform={format!("rotate({turn:.3} 640 360)")}>
                    <g transform={cam_transform((800., 420., zoom), kick)}>
                        {painting}
                        {road}
                        {carts}
                        {stamps}
                        {hall}
                        {coins}
                    </g>
                </g>
                {clouds.draw(&self.sh, &frame, 0.7, (-40., -60., 1360., 300.))}
                {motes.draw(t, 0.6)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Friend

const FIGURE: &str = "M640 70 C560 80 505 170 498 262 C492 322 470 362 420 402 C376 436 344 476 332 620 L948 620 C936 476 904 436 860 402 C810 362 788 322 782 262 C775 170 720 80 640 70Z";
const HOOD: &str = "M640 136 C602 168 568 214 568 272 C570 322 600 350 640 354 C680 350 710 322 712 272 C712 214 678 168 640 136Z";
const SACK_AT: f32 = 2.35;
const SPILL_AT: f32 = 2.65;
const FADE_AT: f32 = 3.6;
/// Where the sack lands on the desk, and its mouth after it tips.
const SACK: (f32, f32) = (520., 565.);
const MOUTH: (f32, f32) = (714., 494.);

struct Spill {
    to: (f32, f32),
    r: f32,
    rot: f32,
    start: f32,
}

pub struct SpillBox(Spill);
impl std::fmt::Debug for SpillBox {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Spill")
    }
}

#[derive(Debug)]
pub struct Friend {
    sh: Shaders,
    smoke: Anim,
    figure: Anim,
    rise: Anim,
    bend: Anim,
    dim: Anim,
    slide: Anim,
    squash: Anim,
    tip: Anim,
    coins: Vec<SpillBox>,
}

impl Friend {
    pub fn new(sh: Shaders) -> Self {
        let coins = (0..26u32)
            .map(|i| {
                let a = lerp(-0.35, 1.25, rnd(i, 800));
                let d = lerp(80., 330., rnd(i, 801).sqrt());
                SpillBox(Spill {
                    to: (MOUTH.0 + a.cos() * d * 1.1, (MOUTH.1 + 40. + a.sin() * d * 0.42).min(705.)),
                    r: lerp(13., 22., rnd(i, 802)),
                    rot: lerp(-30., 30., rnd(i, 803)),
                    start: SPILL_AT + i as f32 * 0.024,
                })
            })
            .collect();
        Self {
            sh,
            smoke: keys(&[(0.1, 1.5, 0., 0.95, Easing::EaseInOut), (FADE_AT, FADE_AT + 1.0, 0.95, 0.7, Easing::EaseInOut)]),
            figure: keys(&[(0.5, 1.7, 0., 1., Easing::EaseInOut), (FADE_AT, FADE_AT + 1.0, 1., 0.16, Easing::EaseInOut)]),
            rise: tw(0.5, 1.9, 40., 0., Easing::EaseOut),
            bend: KeyFramesAnimation::new(vec![
                KeyFrame { start: 0.8, end: Some(1.7), from: 0., to: -20., easing: &Easing::EaseOut },
                KeyFrame { start: FADE_AT + 0.2, end: None, from: -20., to: 0., easing: &BOUNCY },
            ]),
            dim: keys(&[(0.8, 1.7, 0., 0.5, Easing::EaseOut), (FADE_AT + 0.2, FADE_AT + 1.0, 0.5, 0., Easing::EaseInOut)]),
            slide: tw(1.75, SACK_AT, 0., 1., Easing::EaseIn),
            squash: spring(SACK_AT, 0.78, 1., BOUNCY),
            tip: tw(2.5, 2.85, 0., 1., Easing::EaseIn),
            coins,
        }
    }
}

/// A burlap sack, its bottom center at the origin.
fn sack<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="2" rx="80" ry="14" fill="#000" opacity="0.5" />
            <path d="M-70 0 C-92 -40 -84 -96 -44 -122 C-30 -130 -24 -136 -26 -146 L26 -146 C24 -136 30 -130 44 -122 C84 -96 92 -40 70 0Z" fill="url(#g-burlap)" stroke="#2e1e0a" stroke-width="3" />
            <path d="M-46 -60 C-30 -50 -10 -54 6 -40 M20 -96 C30 -80 46 -78 58 -60" stroke="#5a3e1a" stroke-width="2" fill="none" opacity="0.7" />
            <path d="M-30 -138 Q0 -128 30 -138" stroke="#c9a46a" stroke-width="6" fill="none" />
            <path d="M-24 -146 C-30 -164 -12 -170 0 -160 C12 -170 30 -164 24 -146Z" fill="#8a6a3a" stroke="#2e1e0a" stroke-width="2.5" />
        </g>
    )
}

impl Scene for Friend {
    fn name(&self) -> &'static str {
        "BossFriend"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(bokeh) = ctx.get_image("vault-bokeh.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let smoke = frame.animate(&self.smoke);
        let fig = frame.animate(&self.figure);
        let fig = if t > FADE_AT + 1.0 { fig + 0.05 * wave(t, 1., 0.) } else { fig };
        let rise = frame.animate(&self.rise);
        let fog = Fog { density: 0.52, soft: 0.24, light: Color::hex("#9a5ae0"), shade: Color::hex("#1a0830"), dir: (0.12, -0.5), scale: 2.2, seed: 7.0 };
        let figure = if fig > 0. {
            fframes::svgr!(
                <g opacity={fig} transform={format!("translate(0 {rise:.1})")}>
                    <path d={FIGURE} fill="#9a50ff" filter="url(#violet-aura)" opacity="0.8" />
                    <path d={FIGURE} fill="#0a0612" />
                    <path d={FIGURE} fill="none" stroke="#b169ff" stroke-width="2" opacity="0.6" />
                    <path d={HOOD} fill="#000" />
                    <path d={HOOD} fill="none" stroke="#5a2a9a" stroke-width="5" opacity="0.5" filter="url(#blur3)" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let slide = frame.animate(&self.slide);
        let tip = frame.animate(&self.tip);
        let sack_layer = if t >= 1.75 {
            let x = lerp(640., SACK.0, slide);
            let y = lerp(390., SACK.1, slide * slide);
            let s = lerp(0.6, 1.25, slide);
            let sq = if t > SACK_AT { frame.animate(&self.squash) } else { 1. };
            let rot = 95. * tip;
            fframes::svgr!(
                <g transform={format!("translate({x:.1} {y:.1}) scale({:.3} {:.3}) rotate({rot:.1} 70 0)", s * (2. - sq), s * sq)} opacity={(slide * 3.).min(1.)}>
                    {sack()}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let land = if (SACK_AT..SACK_AT + 0.9).contains(&t) {
            let dt = (t - SACK_AT) / 0.9;
            fframes::svgr!(<ellipse cx={SACK.0} cy={SACK.1} rx={60. + 160. * dt} ry={10. + 26. * dt} fill="url(#g-ash)" opacity={0.6 * (1. - dt)} />)
        } else {
            Svgr::empty()
        };
        let coins = self
            .coins
            .iter()
            .enumerate()
            .filter_map(|(i, SpillBox(c))| {
                if t < c.start {
                    return None;
                }
                let p = ((t - c.start) / 0.55).min(1.);
                let e = 1. - (1. - p).powi(3);
                let x = lerp(MOUTH.0, c.to.0, e);
                let y = lerp(MOUTH.1, c.to.1, e) - 50. * (PI * p).sin() * (1. - p);
                let r = lerp(c.r * 0.6, c.r, e);
                let ratio = if p < 1. { 0.2 + 0.8 * ((t - c.start) * 20. + i as f32).cos().abs() } else { 0.4 };
                let twinkle = if t > 4. { wave(t, 2., rnd(i as u32, 810)).max(0.).powi(12) } else { 0. };
                Some(fframes::svgr!(<g>{coin(x, y, r, ratio, c.rot, i % 4 == 0)}{glint(x + r * 0.4, y - r * 0.3, 3.6, twinkle)}</g>))
            })
            .collect::<Vec<_>>();
        let bend = frame.animate(&self.bend);
        let dim = frame.animate(&self.dim);
        let moon_glow = 0.85 + 0.15 * wave(t, 1., 0.3);
        let motes = Motes { count: 36, seed: 821, area: (360., 80., 560., 520.), rise: 280., period: LOOP, size: (1., 2.8), sway: 22., fill: "url(#g-violet)" };
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="url(#g-night)" />
                <image href={bokeh.href()} x="0" y="0" width="1280" height="720" opacity="0.18" />
                <g>
                    <path d="M150 380 L150 150 Q150 60 290 60 Q430 60 430 150 L430 380Z" fill="url(#g-moon-sky)" />
                    <circle cx="330" cy="150" r="38" fill="#f4eed8" opacity={moon_glow} />
                    <circle cx="346" cy="140" r="34" fill="#1f2c56" />
                    <circle cx="330" cy="150" r="90" fill="#9ab4ff" opacity={0.12 * moon_glow} filter="url(#blur18)" />
                    <path d="M290 64 L290 380 M152 220 L428 220" stroke="#140c20" stroke-width="12" />
                    <path d="M150 380 L150 150 Q150 60 290 60 Q430 60 430 150 L430 380Z" fill="none" stroke="#140c20" stroke-width="18" />
                </g>
                <defs>
                    <linearGradient id="g-moonbeam" gradientUnits="userSpaceOnUse" x1="290" y1="120" x2="760" y2="720">
                        <stop offset="0" stop-color="#b8ccff" stop-opacity="0.9" />
                        <stop offset="1" stop-color="#b8ccff" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <path d="M160 140 L430 80 L1010 720 L470 720Z" fill="url(#g-moonbeam)" opacity={0.16 * moon_glow} filter="url(#blur18)" />
                <defs>
                    <radialGradient id="g-smoke-fade" cx="0.5" cy="0.42" r="0.5">
                        <stop offset="0.5" stop-color="#fff" />
                        <stop offset="1" stop-color="#000" />
                    </radialGradient>
                    <mask id="smoke-fade"><rect x="140" y="-40" width="1000" height="720" fill="url(#g-smoke-fade)" /></mask>
                </defs>
                <g mask="url(#smoke-fade)">{fog.draw(&self.sh, &frame, smoke, (140., -40., 1000., 720.))}</g>
                {figure}
                {motes.draw(t, fig.max(0.3) * smoke)}
                <rect y="500" width="1280" height="240" fill="url(#g-desk)" />
                <path d="M0 528 L1280 520" stroke="#6a4020" stroke-width="2" opacity="0.5" />
                {candle(1080., 420., t, bend, dim)}
                {land}
                {sack_layer}
                {coins}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Challenge

/// The three lanes recede from your side (left) toward the Baron (right):
/// (center y, height) at the near end and at the far end.
const NEAR: [(f32, f32); 3] = [(250., 84.), (362., 98.), (486., 112.)];
const FAR: [(f32, f32); 3] = [(262., 38.), (318., 44.), (376., 50.)];
const LANE_L: f32 = 150.;
const LANE_R: f32 = 880.;
/// The Shieldbearer's place in the center Lane, as a fraction of its length.
const GUARD: f32 = 0.86;
const SLAM_AT: f32 = 1.95;
const RISE_AT: f32 = 2.6;
const SURGE_AT: f32 = 3.4;

/// A point and the height of lane `i` at fraction `u` of its length.
fn lane_at(i: usize, u: f32) -> (f32, f32, f32) {
    (lerp(LANE_L, LANE_R, u), lerp(NEAR[i].0, FAR[i].0, u), lerp(NEAR[i].1, FAR[i].1, u))
}

#[derive(Debug)]
pub struct Challenge {
    sh: Shaders,
    lanes: Vec<Anim>,
    hero_drop: Anim,
    fall: Anim,
    flip: Anim,
    flash: Anim,
    rise: Anim,
    rise_in: Anim,
    surge: Anim,
    punch: Anim,
    ticks: Anim,
}

impl Challenge {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            lanes: (0..3).map(|i| tw(0.35 + 0.12 * i as f32, 1.2 + 0.12 * i as f32, 0., 1., Easing::EaseInOut)).collect(),
            hero_drop: tw(0.05, 0.35, -420., 0., Easing::EaseIn),
            fall: tw(SLAM_AT - 0.4, SLAM_AT, 0., 1., Easing::EaseIn),
            flip: tw(2.15, 2.55, 0., 1., Easing::EaseInOut),
            flash: flash(SLAM_AT, 0.55, 0.5),
            rise: spring(RISE_AT, 90., 0., HEAVY),
            rise_in: tw(RISE_AT, RISE_AT + 0.45, 0., 1., Easing::EaseOut),
            surge: keys(&[(SURGE_AT - 0.1, SURGE_AT, 0., 1., Easing::Linear), (SURGE_AT, SURGE_AT + 1.0, 1., 0.35, Easing::EaseOut)]),
            punch: punch(SURGE_AT, 1.04),
            ticks: tw(1.4, 2.0, 0., 1., Easing::EaseOut),
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
        let (Some(field), Some(baron)) = (ctx.get_image("hearthvale.png"), ctx.get_image("baron.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let surge = frame.animate(&self.surge);
        let painting = painting(&self.sh, &frame, field, Grade { storm: 0.7, red: 0.4, dark: 0.32, ..Default::default() });
        let ticks = frame.animate(&self.ticks);
        // Gold flows from your side, red from the Baron's; they meet in the middle.
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
                let shape = format!(
                    "M{nx} {:.1} L{fx} {:.1} L{fx} {:.1} L{nx} {:.1}Z",
                    ny - nh / 2., fy - fh / 2., fy + fh / 2., ny + nh / 2.
                );
                let edges = format!(
                    "M{nx} {:.1} L{fx} {:.1} M{nx} {:.1} L{fx} {:.1}",
                    ny - nh / 2., fy - fh / 2., ny + nh / 2., fy + fh / 2.
                );
                let body = 0.1 + 0.2 * surge + 0.04 * wave(t, 2., i as f32 * 0.3);
                let head = if p < 1. {
                    fframes::svgr!(
                        <g>
                            <circle cx={hx} cy={hy} r={hh} fill="url(#g-gold)" />
                            <circle cx={hx} cy={hy} r="5" fill="#fffef4" />
                        </g>
                    )
                } else {
                    Svgr::empty()
                };
                let cols = (1..11)
                    .map(|c| {
                        let (x, y, h) = lane_at(i, c as f32 / 11.);
                        fframes::svgr!(<path d={format!("M{x:.1} {:.1} L{x:.1} {:.1}", y - h / 2. + 4., y + h / 2. - 4.)} stroke="#fff2c8" stroke-width="1.5" opacity={0.25 * ticks} />)
                    })
                    .collect::<Vec<_>>();
                // Pulses run along the lane from each end to the middle.
                let pulses = (0..4)
                    .flat_map(|k| {
                        let u = 0.5 * ((flow + k as f32 / 4.).rem_euclid(1.0));
                        [(u, "#fff6d2"), (1. - u, "#ffb09a")]
                    })
                    .map(|(u, fill)| {
                        let (x, y, h) = lane_at(i, u);
                        let o = ticks * (PI * (u - 0.5).abs() * 2.).sin().max(0.).powf(0.6);
                        fframes::svgr!(<ellipse cx={x} cy={y} rx={h * 0.42} ry={h * 0.06} fill={fill} opacity={0.85 * o} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g>
                        <defs>
                            <clipPath id={format!("lane-{i}")}><rect x={LANE_L - 10.} y="0" width={(hx - LANE_L + 10.).max(0.1)} height="720" /></clipPath>
                        </defs>
                        <g clip-path={format!("url(#lane-{i})")}>
                            <path d={shape.clone()} fill="url(#g-lane)" opacity={body} />
                            <path d={edges.clone()} stroke="url(#g-lane)" stroke-width="10" opacity={0.35 + 0.4 * surge} filter="url(#blur8u)" />
                            <path d={edges} stroke="url(#g-lane)" stroke-width="2.5" />
                            {cols}
                            {pulses}
                        </g>
                        {head}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let clash = if ticks > 0. {
            let pulse = 0.6 + 0.4 * wave(t, 4., 0.);
            (0..3)
                .map(|i| {
                    let (x, y, h) = lane_at(i, 0.5);
                    fframes::svgr!(<circle cx={x} cy={y} r={h * (0.35 + 0.15 * pulse)} fill="url(#g-gold)" opacity={ticks * (0.45 + 0.4 * surge) * pulse} />)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        let hero_flag = fframes::svgr!(<circle r="18" fill="#fff4cc" stroke="#a8641a" stroke-width="3" />);
        let hero_drop = frame.animate(&self.hero_drop);
        let hero_banner = fframes::svgr!(<g transform={format!("translate(84 {:.1})", 560. + hero_drop)}>{banner(t, 380., "#f0b83c", "#7a4a0c", hero_flag, 0.)}</g>);
        let thud = if (0.35..1.05).contains(&t) {
            let a = (t - 0.35) / 0.7;
            fframes::svgr!(<ellipse cx="84" cy="562" rx={20. + 90. * a} ry={5. + 18. * a} fill="none" stroke="#f3dfb0" stroke-width={6. * (1. - a)} opacity={1. - a} />)
        } else {
            Svgr::empty()
        };
        // The Baron rises at the far end of the lanes, in a red rim light.
        let rise_in = frame.animate(&self.rise_in);
        let rise = frame.animate(&self.rise);
        let breathe = 1. + 0.006 * wave(t, 1., 0.2);
        let baron_layer = if rise_in > 0. {
            let fire = ((t - RISE_AT) / 0.9).clamp(0., 1.);
            fframes::svgr!(
                <g>
                    <circle cx="1070" cy="330" r={120. + 320. * fire} fill="url(#g-red)" opacity={0.75 * (1. - fire) + 0.35} />
                    <g transform={format!("translate(0 {rise:.1}) translate(1070 716) scale({breathe:.4}) translate(-1070 -716)")} opacity={rise_in}>
                        <image href={baron.href()} x="850" y="172" width="440" height="544" filter="url(#aura)" opacity="0.8" />
                        <image href={baron.href()} x="850" y="172" width="440" height="544" />
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The Shieldbearer card falls into the center Lane, slams and flips.
        let (cx, cy, _) = lane_at(1, GUARD);
        let fall = frame.animate(&self.fall);
        let card_layer = if fall > 0. {
            let x = lerp(cx + 120., cx, fall);
            let y = lerp(-180., cy, fall);
            let rot = lerp(28., -4., fall);
            let s = lerp(1.8, 1.2, fall);
            let f = frame.animate(&self.flip);
            let sx = (PI * f).cos();
            let face = if sx >= 0. {
                card_back()
            } else {
                ctx.get_image("card-shieldbearer.png").map(card_front).unwrap_or_default()
            };
            let glow = if t > 2.55 { 0.55 + 0.25 * wave(t, 2., 0.1) } else { 0. };
            let ground = cy + 70.;
            let ring = if (SLAM_AT..SLAM_AT + 0.8).contains(&t) {
                let a = (t - SLAM_AT) / 0.8;
                fframes::svgr!(
                    <g>
                        <ellipse cx={cx} cy={ground} rx={50. + 240. * a} ry={12. + 46. * a} fill="none" stroke="#ffe2a0" stroke-width={12. * (1. - a)} opacity={1. - a} />
                        <ellipse cx={cx} cy={ground} rx={70. + 280. * a} ry={18. + 56. * a} fill="url(#g-ash)" opacity={0.7 * (1. - a)} />
                    </g>
                )
            } else {
                Svgr::empty()
            };
            fframes::svgr!(
                <g>
                    <ellipse cx={cx} cy={cy} rx="130" ry="150" fill="url(#g-violet)" opacity={glow} />
                    {ring}
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale({:.3} {s:.3})", s * sx.abs().max(0.02))}>
                        <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.45" />
                        {face}
                        <rect x="-50" y="-67" width="100" height="134" rx="9" fill="none" stroke="#c58cff" stroke-width="2" opacity={glow} />
                    </g>
                    {burst(cx, ground - 10., t - SLAM_AT, 0.9, 22, 900, 300., "url(#g-ember)")}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let flash = frame.animate(&self.flash);
        let zoom = frame.animate(&self.punch);
        let (kx, ky) = shake(t, SLAM_AT, 12.);
        let sparks = Motes { count: 50, seed: 951, area: (0., 60., 1280., 700.), rise: 560., period: LOOP, size: (1.2, 3.2), sway: 20., fill: "url(#g-ember)" };
        let smoke = Fog { density: 0.4, soft: 0.25, light: Color::hex("#5a2a2a"), shade: Color::hex("#1a0c10"), dir: (-0.35, 0.05), scale: 1.6, seed: 13.0 };
        fframes::svgr!(
            <g>
                <g transform={format!("translate(640 360) scale({zoom:.4}) translate(-640 -360)")}>
                    <g transform={format!("translate({kx:.1} {ky:.1})")}>
                        <g transform="scale(0.8)">{painting}</g>
                        <rect width="1280" height="720" fill="url(#g-top-shade)" />
                        {baron_layer}
                        {lanes}
                        {clash}
                        {card_layer}
                        {hero_banner}
                        {thud}
                    </g>
                </g>
                {smoke.draw(&self.sh, &frame, 0.55, (-40., -60., 1360., 300.))}
                {sparks.draw(t, 0.4 + 0.5 * surge)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#fff4d0" opacity={flash} />
            </g>
        )
    }
}
