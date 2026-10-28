//! Opening: the red land, under the mesas, Boss Snikkit, painted stone, your road.
use crate::fx::*;
use crate::mesa::*;
use crate::{CLIP_FRAMES, CROWN, GATE, STOPS, TRAIL};
use fframes::{
    Color, Duration, FFramesContext, FontQuery, Frame, Scene, Shader, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::{PI, TAU};

const SUN: (f32, f32, f32) = (1.0, 0.88, 0.62);

/// Letters of a Cinzel line, centered on `cx`: (letter, x) and the total width.
fn letters<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, text: &'a str, size: usize, spacing: f32, cx: f32) -> (Vec<(String, f32)>, f32) {
    let font = FontQuery { family: "Cinzel", size, weight: 900, ..Default::default() };
    let widths = text
        .char_indices()
        .map(|(i, c)| if c == ' ' { size as f32 * 0.32 } else { frame.text_width(ctx, font, &text[i..i + c.len_utf8()]).unwrap_or(60) as f32 })
        .collect::<Vec<_>>();
    let total = widths.iter().sum::<f32>() + spacing * (widths.len() as f32 - 1.);
    let mut x = cx - total / 2.;
    let mut out = vec![];
    for (i, c) in text.chars().enumerate() {
        out.push((c.to_string(), x));
        x += widths[i] + spacing;
    }
    (out, total)
}

// ---------------------------------------------------------------- 1. Land

const TITLE: &str = "RED MESAS";
const TITLE_AT: f32 = 3.0;
const LAND_AT: f32 = 3.16;
/// The Hearthvale ending stops on this camera, with the cut seal at (640, 150).
const HEARTHVALE_END: (f32, f32, f32) = (880., 480., 1.14);

#[derive(Debug)]
pub struct Land {
    sh: Shaders,
    cam: Cam,
    dusk: Anim,
    dawn: Anim,
    band: Anim,
    seal: Anim,
    burn: Anim,
    glints: Anim,
    dust: Anim,
    sweep: Anim,
    sun: Anim,
    birds: Anim,
    slam: Anim,
    title_in: Anim,
    rule: Anim,
    flash: Anim,
    trail: String,
}

impl Land {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0.2, 3.2, HEARTHVALE_END, (730., 520., 1.42)), (3.2, 4.8, (730., 520., 1.42), (760., 500., 1.32))]),
            dusk: tw(0.6, 3.0, 0.55, 0., Easing::EaseInOut),
            dawn: tw(0.8, 3.0, 0., 1., Easing::EaseInOut),
            band: tw(0.5, 2.2, 1., 0., Easing::EaseInOut),
            seal: keys(&[(0., 0.3, 0.8, 1.3, Easing::EaseOut), (0.3, 1.5, 1.3, 0., Easing::EaseIn)]),
            burn: tw(0.3, 1.5, 0., 1., Easing::EaseIn),
            glints: tw(0.2, 1.2, 1., 0., Easing::EaseIn),
            dust: tw(0.4, 2.6, 0.3, 0., Easing::EaseOut),
            sweep: tw(1.0, 2.9, -900., 1500., Easing::EaseInOut),
            sun: tw(0.8, 2.6, 0., 1., Easing::EaseOut),
            birds: tw(1.4, 2.4, 0., 1., Easing::EaseOut),
            slam: tw(TITLE_AT, LAND_AT, 1.9, 1., Easing::EaseIn),
            title_in: tw(TITLE_AT, TITLE_AT + 0.08, 0., 1., Easing::Linear),
            rule: tw(LAND_AT + 0.1, LAND_AT + 0.8, 0., 1., Easing::EaseOut),
            flash: flash(LAND_AT, 0.32, 0.6),
            trail: smooth(&STOPS),
        }
    }
}

impl Scene for Land {
    fn name(&self) -> &'static str {
        "OpeningLand"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("red-mesas-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let dawn = frame.animate(&self.dawn);
        let painting = painting(&self.sh, &frame, map, Grade {
            dusk: frame.animate(&self.dusk),
            gold: 0.22 * dawn,
            heat: 0.4 * dawn,
            ..Default::default()
        });
        // The painted-gold trail of the Hearthvale ending, still glinting at the start.
        let g = frame.animate(&self.glints);
        let glints = if g > 0. {
            let marks = STOPS
                .iter()
                .enumerate()
                .map(|(i, s)| {
                    let twinkle = 0.55 + 0.45 * wave(t, 2., i as f32 * 0.13).max(0.);
                    fframes::svgr!(
                        <g>
                            <circle cx={s.0} cy={s.1} r="58" fill="url(#g-gold)" opacity={0.8 * twinkle} />
                            <ellipse cx={s.0} cy={s.1} rx="9" ry="5" fill="#f6c84e" stroke="#7a4a10" stroke-width="1.5" />
                        </g>
                    )
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g opacity={g}>
                    <path d={self.trail.as_str()} fill="none" stroke="#ffd36a" stroke-width="2.4" stroke-dasharray="6 24" stroke-dashoffset={-t * 15.} opacity="0.8" />
                    {marks}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The cut seal burns away from its rim, and its embers rise.
        let seal_alpha = frame.animate(&self.seal);
        let burn = frame.animate(&self.burn);
        let ring = TAU * 132.;
        let seal = if seal_alpha > 0.01 {
            let mark = seal_lanes(118., true);
            fframes::svgr!(
                <g transform="translate(640 150)" opacity={seal_alpha.min(1.)}>
                    <circle r="170" fill="url(#g-violet)" opacity={0.35 * (1. - burn)} />
                    <circle r="132" fill="none" stroke="#b46aff" stroke-width="10" filter="url(#blur8)" stroke-dasharray={ring} stroke-dashoffset={ring * burn} transform="rotate(-90)" />
                    <circle r="132" fill="none" stroke="#f0dcff" stroke-width="1.8" stroke-dasharray={ring} stroke-dashoffset={ring * burn} transform="rotate(-90)" />
                    <g opacity={1. - burn}>
                        <path d={mark.clone()} fill="none" stroke="#a24cff" stroke-width="10" stroke-linecap="round" filter="url(#blur8)" />
                        <path d={mark} fill="none" stroke="#f6eaff" stroke-width="2.2" stroke-linecap="round" />
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let embers = (0..54u32)
            .filter_map(|i| {
                let born = 0.3 + 1.2 * (i as f32 / 54.);
                let dt = t - born;
                if !(0.0..1.4).contains(&dt) {
                    return None;
                }
                let a = -PI / 2. + TAU * (i as f32 / 54.);
                let (x0, y0) = (640. + a.cos() * 132., 150. + a.sin() * 132.);
                let x = x0 + lerp(-30., 30., rnd(i, 11)) * dt + 14. * (dt * 5. + i as f32).sin();
                let y = y0 - lerp(50., 150., rnd(i, 12)) * dt;
                let k = dt / 1.4;
                let fill = if k < 0.35 { "#e4c8ff" } else { "#ffb46a" };
                Some(fframes::svgr!(<circle cx={x} cy={y} r={lerp(3.4, 0.8, k)} fill={fill} opacity={1. - k} />))
            })
            .collect::<Vec<_>>();
        // Dawn: the sun at the upper left and a wave of light over the mesas.
        let sun = frame.animate(&self.sun);
        let sweep = frame.animate(&self.sweep);
        let sweep_layer = if sweep > -800. && sweep < 1400. {
            fframes::svgr!(<rect x={sweep} y="-100" width="760" height="920" fill="url(#g-sweep)" transform="skewX(-22)" opacity="0.8" />)
        } else {
            Svgr::empty()
        };
        let dust = Fog { density: 0.74, soft: 0.22, light: Color::hex("#e8955c"), shade: Color::hex("#7a2a14"), dir: (-0.7, 0.05), scale: 1.5, seed: 21.0 };
        // The title slams down into the dust.
        let (glyphs, total) = letters(&mut frame, ctx, TITLE, 104, 8., 640.);
        let slam = frame.animate(&self.slam);
        let title_in = frame.animate(&self.title_in);
        let title = if title_in > 0. {
            let shadow = glyphs.iter().map(|(c, x)| fframes::svgr!(<text x={x + 3.} y="174" font-family="Cinzel" font-weight="900" font-size="104" fill="#1a0602">{c.clone()}</text>)).collect::<Vec<_>>();
            let face = glyphs.iter().map(|(c, x)| fframes::svgr!(<text x={*x} y="168" font-family="Cinzel" font-weight="900" font-size="104" fill="url(#g-mesa-title)" stroke="#2a0904" stroke-width="2.5">{c.clone()}</text>)).collect::<Vec<_>>();
            // One glint crosses the title in every loop.
            let sweep_x = lerp(640. - total / 2. - 60., 640. + total / 2. + 60., loop_phase(t - 1.0).powf(0.6));
            let shine = if t > LAND_AT + 0.4 { glint(sweep_x, 108. + 40. * loop_phase(t - 1.0), 7., (PI * loop_phase(t - 1.0)).sin() * 0.9) } else { Svgr::empty() };
            fframes::svgr!(
                <g transform={format!("translate(640 140) scale({slam:.3}) translate(-640 -140)")} opacity={title_in}>
                    <g filter="url(#blur3)" opacity="0.8">{shadow}</g>
                    {face}
                    {shine}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let rule = frame.animate(&self.rule) * (total / 2. + 30.);
        let puff = dust_burst(640., 186., t - LAND_AT, 1.4, 22, 31, 520., "url(#g-dust)");
        let devil = project(cam, (985., 335.));
        let shake = shake(t, LAND_AT, 7.);
        let motes = Motes { count: 40, seed: 77, area: (0., 0., 1280., 760.), rise: 220., period: LOOP, size: (1., 2.6), sway: 50., fill: "url(#g-dust)" };
        fframes::svgr!(
            <g>
                <defs>
                    <linearGradient id="g-night-band-rm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#14061e" stop-opacity="0.85" />
                        <stop offset="1" stop-color="#14061e" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <g transform={cam_transform(cam, shake)}>
                    {painting}
                    {glints}
                </g>
                {sweep_layer}
                {dust_devil(t, devil.0, devil.1, 150., after(t, 2.0, 1.0) * 0.9)}
                <circle cx="70" cy="-40" r="560" fill="url(#g-sun)" opacity={0.75 * sun} />
                {rays(&self.sh, &frame, (60., -50.), 0.42 * sun, 1.15, SUN)}
                {vultures(t, frame.animate(&self.birds), &[((420., 330.), (170., 50.), 30., 0.0), ((900., 270.), (130., 40.), 22., 0.4), ((660., 420.), (110., 34.), 36., 0.72)])}
                <rect width="1280" height="320" fill="url(#g-night-band-rm)" opacity={frame.animate(&self.band)} />
                {seal}
                {embers}
                {dust.draw(&self.sh, &frame, frame.animate(&self.dust), (0., 0., 1280., 720.))}
                <rect width="1280" height="260" fill="url(#g-top-shade)" opacity={0.7 * after(t, TITLE_AT - 0.4, 0.5)} />
                {title}
                {puff}
                <path d={format!("M{} 200 L{} 200", 640. - rule, 640. + rule)} stroke="#f6a050" stroke-width="2.5" opacity="0.9" />
                <path d={format!("M{} 207 L{} 207", 640. - rule * 0.6, 640. + rule * 0.6)} stroke="#fff0c8" stroke-width="1.2" opacity="0.7" />
                {motes.draw(t, 0.55 * dawn)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.65" />
                <rect width="1280" height="720" fill="#fff2d6" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Mines

/// The camera drops this far below the surface. The world is the surface view
/// (y 0..720) and the rock under it; final screen y = world y - DROP.
const DROP: f32 = 585.;
const BLAST_AT: f32 = 3.3;
const FUSE_AT: f32 = 1.25;
const UPPER_Y: f32 = 300.;
const LOWER_Y: f32 = 566.;
const CHAMBER: (f32, f32) = (1112., 292.);
const SHAFT_X: f32 = 196.;
const LIFT_X: f32 = 880.;
/// The fuse, from the goblin's torch to the powder barrels, in screen units.
const FUSE: &[(f32, f32)] = &[(800., 338.), (860., 342.), (930., 337.), (1000., 343.), (1060., 338.)];

/// The ground line between the surface view and the rock, in world units.
fn ground() -> Vec<(f32, f32)> {
    (0..=33)
        .map(|i| {
            let x = i as f32 * 40. - 20.;
            (x, 712. + 12. * (x * 0.011).sin() + 9. * rnd(i, 51))
        })
        .collect()
}

/// A rough bore around a centerline: (x, y) points, `h` tall, in screen units.
fn bore(points: &[(f32, f32)], h: f32, seed: u32) -> String {
    let top = points.iter().enumerate().map(|(i, &(x, y))| (x, y - h / 2. + lerp(-7., 7., rnd(i as u32, seed))));
    let bottom = points.iter().enumerate().rev().map(|(i, &(x, y))| (x, y + h / 2. + lerp(-4., 4., rnd(i as u32, seed + 1))));
    path(&top.chain(bottom).collect::<Vec<_>>(), true)
}

fn line_points(x0: f32, x1: f32, y: f32, amp: f32, seed: u32) -> Vec<(f32, f32)> {
    let n = ((x1 - x0) / 60.).ceil() as u32;
    (0..=n).map(|i| (x0 + (x1 - x0) * i as f32 / n as f32, y + amp * (i as f32 * 0.9 + seed as f32).sin())).collect()
}

#[derive(Debug)]
pub struct Mines {
    sh: Shaders,
    strata: Shader,
    drop: Anim,
    blast: Anim,
    flash: Anim,
    crack: Anim,
    jet: Anim,
    runner: Anim,
    lower: Track,
    upper_floor: Track,
    fuse: Track,
    bores: Vec<String>,
    upper_rail: String,
    lower_rail: String,
    ground: String,
    ground_fill: String,
}

impl Mines {
    pub fn new(sh: Shaders) -> Self {
        let line = ground();
        let mut above = line.clone();
        above.extend([(1320., -20.), (-40., -20.)]);
        let upper = line_points(-60., 1010., UPPER_Y, 6., 1);
        let lower = line_points(-60., 1340., LOWER_Y, 9., 4);
        let chamber = (0..16)
            .map(|i| {
                let a = TAU * i as f32 / 16.;
                let r = lerp(0.92, 1.08, rnd(i, 57));
                (CHAMBER.0 + a.cos() * 128. * r, CHAMBER.1 + 8. + a.sin() * 92. * r)
            })
            .collect::<Vec<_>>();
        let floor = |pts: &[(f32, f32)], dy: f32| pts.iter().map(|p| (p.0, p.1 + dy)).collect::<Vec<_>>();
        Self {
            sh,
            strata: strata_shader(),
            drop: tw(0.0, 1.5, 0., DROP, Easing::EaseInOut),
            blast: tw(BLAST_AT, BLAST_AT + 1.0, 0., 1., Easing::EaseOut),
            flash: flash(BLAST_AT, 0.32, 0.5),
            crack: tw(BLAST_AT + 0.05, BLAST_AT + 0.3, 0., 1., Easing::EaseOut),
            jet: tw(BLAST_AT + 0.12, BLAST_AT + 1.6, 0., 1., Easing::EaseOut),
            runner: tw(FUSE_AT + 0.1, 3.05, 0., 1., Easing::EaseIn),
            lower: Track::new(floor(&lower, 40.)),
            upper_floor: Track::new(floor(&upper, 44.)),
            fuse: Track::new(FUSE.to_vec()),
            bores: vec![
                bore(&upper, 118., 61),
                bore(&lower, 112., 63),
                bore(&[(SHAFT_X, 120.), (SHAFT_X, 330.), (SHAFT_X, 600.)], 76., 65).replace("Z", "") + "Z",
                bore(&[(LIFT_X, UPPER_Y), (LIFT_X, 440.), (LIFT_X, LOWER_Y)], 64., 67),
                path(&chamber, true),
            ],
            upper_rail: smooth(&floor(&upper, 44.)),
            lower_rail: smooth(&floor(&lower, 40.)),
            ground: path(&line, false),
            ground_fill: path(&above, true),
        }
    }
}

/// A small goblin seen from the side: big ears, a lamp hat. `step` swings its legs.
fn goblin<'a>(step: f32, facing: f32) -> Svgr<'a> {
    let leg = 6. * step;
    fframes::svgr!(
        <g transform={format!("scale({facing} 1)")}>
            <path d={format!("M-3 -14 L{:.1} 0 M3 -14 L{:.1} 0", -3. + leg, 3. - leg)} stroke="#2a4a14" stroke-width="3.6" stroke-linecap="round" />
            <path d="M-7 -27 L7 -27 L6 -12 L-6 -12Z" fill="#6a4220" stroke="#2a1608" stroke-width="1.2" />
            <circle cx="1" cy="-34" r="7.5" fill="#7ab846" stroke="#2a4a14" stroke-width="1.2" />
            <path d="M-6 -35 L-21 -41 L-7 -30Z M7 -35 L21 -41 L8 -30Z" fill="#7ab846" stroke="#2a4a14" stroke-width="1" />
            <circle cx="5" cy="-35" r="1.6" fill="#1a0a04" />
            <path d="M-8 -39 L9 -39 L6 -45 L-5 -45Z" fill="#8a6a3a" stroke="#2a1608" stroke-width="1" />
            <circle cx="5" cy="-45" r="2.6" fill="#ffe08a" />
        </g>
    )
}

/// Timber supports: a post on each side and a cap beam, every `step` units.
fn timbers<'a>(x0: f32, x1: f32, y: f32, h: f32, step: f32) -> Svgr<'a> {
    let n = ((x1 - x0) / step) as u32;
    let frames = (0..=n)
        .map(|i| {
            let x = x0 + i as f32 * step;
            fframes::svgr!(
                <g>
                    <rect x={x - 5.} y={y - h / 2. + 4.} width="10" height={h - 8.} fill="url(#g-wood)" />
                    <rect x={x - 26.} y={y - h / 2. + 2.} width="52" height="9" rx="2" fill="#6a4220" stroke="#2a1608" stroke-width="1.5" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g opacity="0.9">{frames}</g>)
}

fn rail<'a>(d: &str) -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <path d={d.to_string()} fill="none" stroke="#4a3020" stroke-width="10" stroke-dasharray="4 12" />
            <path d={d.to_string()} fill="none" stroke="#c8b49a" stroke-width="2" transform="translate(0 -4)" />
            <path d={d.to_string()} fill="none" stroke="#8a7a68" stroke-width="2" transform="translate(0 3)" />
        </g>
    )
}

impl Scene for Mines {
    fn name(&self) -> &'static str {
        "OpeningMines"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("red-mesas-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let drop = frame.animate(&self.drop);
        let shake = shake(t, BLAST_AT, 14.);
        let flash = frame.animate(&self.flash);
        let blast = frame.animate(&self.blast);
        let surface = painting(&self.sh, &frame, map, Grade { gold: 0.22, heat: 0.4, ..Default::default() });
        let rock = strata(&self.strata, &frame, 700., 0.25 * flash);
        // Lanterns hang from the roofs and swing; their light pools on the walls.
        let lamps = [(70., UPPER_Y), (330., UPPER_Y), (600., UPPER_Y), (60., LOWER_Y), (420., LOWER_Y), (760., LOWER_Y), (1110., LOWER_Y)];
        let pools = lamps
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let f = flicker(t, i as f32 * 0.29);
                fframes::svgr!(<circle cx={x} cy={y} r={150. + 20. * f} fill="url(#g-candle)" opacity={0.9 + 0.1 * f} />)
            })
            .collect::<Vec<_>>();
        let lanterns = lamps
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let swing = 10. * wave(t, 2., i as f32 * 0.17);
                fframes::svgr!(
                    <g transform={format!("translate({x} {}) rotate({swing:.1})", y - 52.)}>
                        <path d="M0 0 L0 16" stroke="#2a1a10" stroke-width="1.6" />
                        <circle cx="0" cy="24" r="16" fill="url(#g-ember)" opacity="0.8" />
                        <rect x="-6" y="16" width="12" height="15" rx="3" fill="#ffd27a" stroke="#4a2a10" stroke-width="1.6" />
                        <path d="M-7 16 L7 16 L4 12 L-4 12Z" fill="#4a2a10" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // Two carts run along the lower tunnel, half a loop apart; a goblin rides one.
        let carts = (0..2)
            .map(|k| {
                let u = (t / LOOP + k as f32 * 0.5).rem_euclid(1.);
                let (x, y) = self.lower.at(u);
                let (x2, y2) = self.lower.at((u + 0.01).min(1.));
                let tilt = (y2 - y).atan2(x2 - x).to_degrees();
                let load = if k == 0 {
                    coin_heap(0.5 + 0.5 * wave(t, 2., 0.))
                } else {
                    fframes::svgr!(<g><ellipse cx="0" cy="-56" rx="56" ry="12" fill="#5a3a20" /><g transform="translate(-6 -50) scale(1.4)">{goblin(0., 1.)}</g></g>)
                };
                fframes::svgr!(<g transform={format!("translate({x:.1} {:.1}) rotate({tilt:.1}) scale(0.78)", y - 12.)}>{cart(u * 1440., load)}</g>)
            })
            .collect::<Vec<_>>();
        // A bucket lift rides the right shaft up and down.
        let lift_y = lerp(UPPER_Y + 10., LOWER_Y - 10., 0.5 - 0.5 * wave(t, 1., 0.25));
        // The goblin with the torch lights the fuse, then runs for it.
        let run = frame.animate(&self.runner);
        let rx = lerp(780., SHAFT_X + 10., run);
        let (_, ry) = self.upper_floor.at(((rx + 60.) / 1070.).clamp(0., 1.));
        let running = t > FUSE_AT + 0.1;
        // He dives into the shaft: he fades out there instead of vanishing.
        let gone = 1. - after(t, 2.85, 0.3);
        let runner = if t < 3.15 {
            let step = if running { wave(t, 18., 0.) } else { 0. };
            let face = if running { -1. } else { 1. };
            fframes::svgr!(
                <g transform={format!("translate({rx:.1} {:.1}) scale(2.1)", ry - 4. + if running { -2. * wave(t, 18., 0.25).abs() } else { 0. })} opacity={gone}>
                    {goblin(step, face)}
                    <path d={format!("M{} -24 L{} -36", 6. * face, 13. * face)} stroke="#5a3a1c" stroke-width="2.4" />
                    <circle cx={13. * face} cy="-39" r={6. + flicker(t, 0.7)} fill="url(#g-ember)" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The fuse burns toward the powder barrels.
        let fuse_k = after(t, FUSE_AT, BLAST_AT - FUSE_AT);
        let (sx, sy) = self.fuse.at(fuse_k);
        let len = self.fuse.total();
        let spark = if (FUSE_AT..BLAST_AT).contains(&t) {
            let sparks = (0..12u32)
                .map(|k| {
                    let seed = (t * 30.) as u32 * 17 + k;
                    let a = -PI * rnd(seed, 7);
                    let r = 6. + 16. * rnd(seed, 8);
                    fframes::svgr!(<path d={format!("M{sx:.1} {sy:.1} l{:.1} {:.1}", a.cos() * r, a.sin() * r)} stroke="#ffe08a" stroke-width="1.5" />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g>
                    <circle cx={sx} cy={sy} r="34" fill="url(#g-ember)" />
                    <circle cx={sx} cy={sy} r="4" fill="#fffbe0" />
                    {sparks}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let barrels = if t < BLAST_AT + 0.04 {
            [(1080., 362.), (1124., 362.), (1102., 318.), (1160., 362.)]
                .iter()
                .map(|&(x, y)| {
                    fframes::svgr!(
                        <g transform={format!("translate({x} {y})")}>
                            <rect x="-20" y="-42" width="40" height="42" rx="8" fill="#8a4018" stroke="#2a1006" stroke-width="2.4" />
                            <path d="M-20 -32 L20 -32 M-20 -10 L20 -10" stroke="#3a2a20" stroke-width="4" />
                            <path d="M-12 -24 L12 -24 M-12 -18 L12 -18" stroke="#f0d0a0" stroke-width="2" opacity="0.6" />
                        </g>
                    )
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        // The blast fills the chamber, runs down the tunnel and cracks the rock to the top.
        let fire = if blast > 0. && blast < 1. {
            let jet_x = lerp(CHAMBER.0, 280., ease_out(blast));
            fframes::svgr!(
                <g>
                    <ellipse cx={(CHAMBER.0 + jet_x) / 2.} cy={UPPER_Y} rx={(CHAMBER.0 - jet_x) / 2. + 40.} ry="56" fill="url(#g-fireball)" opacity={(1. - blast) * 0.9} />
                    <circle cx={CHAMBER.0} cy={CHAMBER.1} r={40. + 220. * ease_out(blast)} fill="url(#g-fireball)" opacity={1. - blast} />
                    <circle cx={CHAMBER.0} cy={CHAMBER.1} r={30. + 120. * blast} fill="#fff6d6" opacity={(1. - blast * 2.5).max(0.)} />
                    <circle cx={CHAMBER.0} cy={CHAMBER.1} r={60. + 420. * ease_out(blast)} fill="none" stroke="#fff0c8" stroke-width={2. + 26. * (1. - blast)} opacity={0.8 * (1. - blast)} />
                    {burst(CHAMBER.0, CHAMBER.1, t - BLAST_AT, 1.0, 40, 91, 760., "#ffe08a")}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let crack = frame.animate(&self.crack);
        let crack_pts: [(f32, f32); 5] = [(1104., 206.), (1118., 186.), (1102., 168.), (1116., 150.), (1108., 120.)];
        let crack_len: f32 = crack_pts.windows(2).map(|p| ((p[1].0 - p[0].0).powi(2) + (p[1].1 - p[0].1).powi(2)).sqrt()).sum();
        let jet = frame.animate(&self.jet);
        let plume = if jet > 0. {
            let puffs = (0..22u32)
                .map(|k| {
                    let d = (jet * 1.4 - k as f32 * 0.035).clamp(0., 1.);
                    let x = 1110. + lerp(-50., 50., rnd(k, 61)) * d;
                    let y = 130. - d * lerp(120., 300., rnd(k, 62));
                    let r = lerp(30., 96., rnd(k, 63)) * (0.4 + d);
                    fframes::svgr!(<circle cx={x} cy={y} r={r} fill="url(#g-dust)" opacity={(1.3 * (1. - jet).powf(0.5) * (d * 3.).min(1.)).clamp(0., 1.)} />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(<g>{puffs}</g>)
        } else {
            Svgr::empty()
        };
        // After the blast: embers glow in the chamber, smoke curls, dust trickles everywhere.
        let embers = Motes { count: 26, seed: 171, area: (1010., 240., 200., 130.), rise: 120., period: LOOP, size: (1., 2.6), sway: 10., fill: "url(#g-ember)" };
        let smoke = (0..10u32)
            .map(|k| {
                let u = (t / LOOP + rnd(k, 181)).rem_euclid(1.);
                let x = CHAMBER.0 + lerp(-90., 90., rnd(k, 182)) + 20. * u;
                let y = CHAMBER.1 + 30. - u * 110.;
                fframes::svgr!(<circle cx={x} cy={y} r={lerp(20., 46., u)} fill="url(#g-smoke)" opacity={0.75 * (PI * u).sin()} />)
            })
            .collect::<Vec<_>>();
        let trickle = (0..30u32)
            .map(|k| {
                let x = lerp(-20., 1300., rnd(k, 71));
                let y0 = if k % 2 == 0 { UPPER_Y - 56. } else { LOWER_Y - 52. };
                let u = (t / (LOOP / 2.) + rnd(k, 72)).rem_euclid(1.);
                fframes::svgr!(<circle cx={x} cy={y0 + u * 70.} r="1.4" fill="#e0a070" opacity={0.75 * (PI * u).sin()} />)
            })
            .collect::<Vec<_>>();
        let rubble = (0..18u32)
            .map(|k| {
                let x = CHAMBER.0 + lerp(-110., 110., rnd(k, 191));
                let y = CHAMBER.1 + 82. - (1. - ((x - CHAMBER.0) / 120.).powi(2)).max(0.) * lerp(10., 40., rnd(k, 192));
                let r = lerp(9., 20., rnd(k, 193));
                let hot = 0.4 + 0.3 * wave(t, 2., rnd(k, 194));
                fframes::svgr!(
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({:.0})", rnd(k, 195) * 360.)}>
                        <path d={stone(k + 400, r)} fill="#4a1a0c" stroke="#1a0602" stroke-width="1.5" />
                        <path d={stone(k + 400, r * 0.45)} fill="#ff7a2a" opacity={hot * rnd(k, 196)} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let ladder = (0..13)
            .map(|k| {
                let y = 150. + k as f32 * 36.;
                fframes::svgr!(<path d={format!("M{} {y} L{} {y}", SHAFT_X - 16., SHAFT_X + 16.)} stroke="#7a5230" stroke-width="4" />)
            })
            .collect::<Vec<_>>();
        let bores = self.bores.iter().map(|d| fframes::svgr!(<path d={d.as_str()} />)).collect::<Vec<_>>();
        let rims = self
            .bores
            .iter()
            .map(|d| {
                fframes::svgr!(
                    <g>
                        <path d={d.as_str()} fill="none" stroke="#2a0a02" stroke-width="9" opacity="0.7" />
                        <path d={d.as_str()} fill="none" stroke="#f0965a" stroke-width="2" opacity="0.55" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let blast_glow = (1. - blast).max(0.) * if blast > 0. { 1. } else { 0. };
        // Screen-space content below the ground, offset with the camera drop.
        let under = fframes::svgr!(
            <g>
                <defs>
                    <clipPath id="bores">{bores}</clipPath>
                </defs>
                <g clip-path="url(#bores)">
                    <rect x="-40" y="0" width="1360" height="760" fill="#1e0a04" />
                    <g opacity="0.35">{rock.clone()}</g>
                    <rect x="-40" y="0" width="1360" height="760" fill="url(#g-tunnel)" opacity="0.55" />
                    {pools}
                    <circle cx={CHAMBER.0} cy={CHAMBER.1} r="260" fill="url(#g-fireball)" opacity={0.85 * blast_glow} />
                    {timbers(40., 980., UPPER_Y, 118., 230.)}
                    {timbers(120., 1300., LOWER_Y, 112., 300.)}
                    {ladder}
                    {smoke}
                    <circle cx={CHAMBER.0} cy={CHAMBER.1 + 40.} r="150" fill="url(#g-fireball)" opacity={after(t, BLAST_AT + 0.6, 0.8) * (0.32 + 0.1 * wave(t, 2., 0.) + 0.06 * wave(t, 5., 0.3))} />
                </g>
                <g opacity={after(t, BLAST_AT + 0.2, 0.4)}>{rubble}</g>
                {rims}
                {rail(&self.upper_rail)}
                {rail(&self.lower_rail)}
                <path d={path(&crack_pts, false)} fill="none" stroke="#1a0602" stroke-width="6" stroke-dasharray={crack_len} stroke-dashoffset={crack_len * (1. - crack)} />
                <path d={path(&crack_pts, false)} fill="none" stroke="#ffb05a" stroke-width="2" stroke-dasharray={crack_len} stroke-dashoffset={crack_len * (1. - crack)} opacity={1. - after(t, BLAST_AT + 0.4, 1.2)} />
                {lanterns}
                <g transform={format!("translate({LIFT_X} {lift_y:.1})")}>
                    <path d={format!("M0 {:.1} L0 -18", UPPER_Y - 60. - lift_y)} stroke="#6a5a4a" stroke-width="2" />
                    <path d="M-20 -18 L20 -18 L16 10 L-16 10Z" fill="url(#g-cart)" stroke="#1e1008" stroke-width="2" />
                    <ellipse cx="0" cy="-18" rx="20" ry="5" fill="#c0582a" />
                </g>
                {carts}
                <path d={path(FUSE, false)} fill="none" stroke="#2a1a10" stroke-width="2.6" stroke-dasharray={len} stroke-dashoffset={-len * fuse_k} />
                {barrels}
                {runner}
                {spark}
                {embers.draw(t, after(t, BLAST_AT + 0.4, 0.8))}
                {debris(CHAMBER.0, CHAMBER.1, t - BLAST_AT, 1.5, 44, 81, 900., (-PI * 1.1, PI * 0.1), 17.)}
                {fire}
                {trickle}
            </g>
        );
        fframes::svgr!(
            <g transform={format!("translate({} {})", shake.0, shake.1)}>
                <rect x="-40" y="-40" width="1360" height="800" fill="#2a0e06" />
                <g transform={format!("translate(0 {:.1})", DROP - drop)}>
                    {rock}
                    {under}
                </g>
                <g transform={format!("translate(0 {:.1})", -drop)}>
                    <defs>
                        <clipPath id="above-ground"><path d={self.ground_fill.as_str()} /></clipPath>
                    </defs>
                    <g clip-path="url(#above-ground)">
                        <g transform={cam_transform((760., 500., 1.32), (0., 0.))}>{surface}</g>
                    </g>
                    <path d={self.ground.as_str()} fill="none" stroke="#3a1206" stroke-width="6" />
                    <path d={self.ground.as_str()} fill="none" stroke="#f0a060" stroke-width="1.5" transform="translate(0 4)" opacity="0.6" />
                </g>
                <g transform={format!("translate(0 {:.1})", DROP - drop)}>{plume}{debris(1110., 128., t - BLAST_AT - 0.15, 1.3, 16, 141, 700., (-PI * 0.7, -PI * 0.3), 10.)}</g>
                <rect x="-40" y="-40" width="1360" height="800" fill="url(#g-vignette)" opacity="0.75" />
                <rect x="-40" y="-40" width="1360" height="800" fill="#ffe2b0" opacity={flash} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Snikkit

const BRAKE_AT: f32 = 1.5;
const STOP_AT: f32 = 1.9;
const SNIKKIT_W: f32 = 476.;
const SNIKKIT_H: f32 = 578.;
/// Where the rail meets the cart floor at rest, in screen pixels.
const REST: (f32, f32) = (860., 654.);
/// The Orc cards that catch the coins, with their arrival times.
const ORC_CARDS: [(&str, f32, f32, f32, f32); 3] = [
    ("card-tusk-brute.png", 170., 210., -8., 2.55),
    ("card-pyreaxe-ravager.png", 340., 170., 0., 2.72),
    ("card-mesa-pit-fighter.png", 510., 210., 8., 2.89),
];

#[derive(Debug)]
pub struct Snikkit {
    sh: Shaders,
    rail: Anim,
    ride: Anim,
    tilt: Anim,
    plate: Anim,
    plate_in: Anim,
    underline: Anim,
    torch: Anim,
    flips: Vec<Anim>,
}

impl Snikkit {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            rail: tw(0.0, 0.6, 0., 1., Easing::EaseOut),
            ride: KeyFramesAnimation::new(vec![
                KeyFrame { start: 0.35, end: Some(BRAKE_AT), from: 1700., to: 960., easing: &Easing::Linear },
                KeyFrame { start: BRAKE_AT, end: Some(STOP_AT), from: 960., to: REST.0, easing: &Easing::EaseOut },
            ]),
            tilt: KeyFramesAnimation::new(vec![
                KeyFrame { start: BRAKE_AT, end: Some(STOP_AT), from: 0., to: -9., easing: &Easing::EaseOut },
                KeyFrame { start: STOP_AT, end: None, from: -9., to: 0., easing: &BOUNCY },
            ]),
            plate: tw(3.1, 3.26, 1.7, 1., Easing::EaseIn),
            plate_in: tw(3.1, 3.2, 0., 1., Easing::EaseIn),
            underline: tw(3.3, 3.9, 0., 1., Easing::EaseOut),
            torch: keys(&[(STOP_AT, STOP_AT + 0.15, 1., 1.8, Easing::EaseOut), (STOP_AT + 0.15, STOP_AT + 1.2, 1.8, 1., Easing::EaseInOut)]),
            flips: ORC_CARDS.iter().map(|c| tw(c.4, c.4 + 0.4, 0., 1., Easing::EaseInOut)).collect(),
        }
    }
}

impl Scene for Snikkit {
    fn name(&self) -> &'static str {
        "OpeningSnikkit"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(map), Some(snikkit)) = (ctx.get_image("red-mesas-region.png"), ctx.get_image("snikkit.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        // The Orc war-drum camp at dusk, out of focus behind him.
        let bg = painting(&self.sh, &frame, map, Grade { dusk: 0.8, heat: 0.5, dark: 0.3, ..Default::default() });
        let cam = (lerp(1060., 1110., ease_out(after(t, 0., 5.))), 640., 1.9);
        // The rail draws itself across the frame, right to left.
        let rail = frame.animate(&self.rail);
        let rail_d = "M1340 650 C1000 652 640 668 -60 706";
        let x = frame.animate(&self.ride);
        let moving = t < STOP_AT + 0.05 && t > 0.3;
        let rock = if t > STOP_AT { 1.2 * wave(t, 2., 0.) } else { 0. };
        let tilt = frame.animate(&self.tilt) + rock;
        let bob = if moving { 3. * (t * 40.).sin() } else { 1.5 * wave(t, 2., 0.3) };
        let feet_y = REST.1 + (x - REST.0) * 0.004;
        let (ox, oy) = (x - SNIKKIT_W * 0.6, feet_y - SNIKKIT_H * 0.94 + bob);
        // Sparks from the wheels while it rides, a shower while it brakes.
        let wheel = (x - 60., feet_y - 6.);
        let streaks = if moving {
            let heavy = t > BRAKE_AT;
            let n = if heavy { 26 } else { 10 };
            (0..n)
                .map(|k| {
                    let seed = (t * 30.) as u32 * 31 + k;
                    let len = lerp(20., if heavy { 120. } else { 50. }, rnd(seed, 1));
                    let a = lerp(-0.5, -0.05, rnd(seed, 2));
                    let (sx, sy) = (wheel.0 + lerp(-10., 140., rnd(seed, 3)), wheel.1 + lerp(-4., 6., rnd(seed, 4)));
                    fframes::svgr!(<path d={format!("M{sx:.1} {sy:.1} l{:.1} {:.1}", a.cos() * len, a.sin() * len)} stroke="#ffd98a" stroke-width={lerp(1., 2.4, rnd(seed, 5))} stroke-linecap="round" opacity={lerp(0.5, 1., rnd(seed, 6))} />)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        let stop_dust = dust_burst(x - 40., feet_y + 4., t - STOP_AT, 1.3, 20, 13, 340., "url(#g-dust)");
        // The torch at the top of his staff.
        let torch = (ox + 500. * SNIKKIT_W / 560., oy + 32. * SNIKKIT_H / 680.);
        let flare = frame.animate(&self.torch);
        let f = flicker(t, 0.21);
        // Coins fly from the cart to the three Orc cards.
        let coins = (0..18u32)
            .filter_map(|k| {
                let card = &ORC_CARDS[(k % 3) as usize];
                let arrive = card.4 + lerp(-0.1, 0.05, rnd(k, 91));
                let leave = arrive - lerp(0.42, 0.6, rnd(k, 92));
                let dt = t - leave;
                let dur = arrive - leave;
                if !(0.0..dur).contains(&dt) {
                    return None;
                }
                let u = dt / dur;
                let from = (REST.0 - 40. + lerp(-30., 30., rnd(k, 93)), REST.1 - 300.);
                let to = (card.1 + lerp(-20., 20., rnd(k, 94)), card.2 + lerp(-30., 30., rnd(k, 95)));
                let px = lerp(from.0, to.0, u);
                let py = lerp(from.1, to.1, u) - 210. * (PI * u).sin();
                let ratio = 0.15 + 0.85 * (u * TAU * 2. + k as f32).cos().abs();
                Some(coin(px, py, 11., ratio, 0., false))
            })
            .collect::<Vec<_>>();
        let cards = ORC_CARDS
            .iter()
            .enumerate()
            .map(|(i, &(art, cx, cy, rot, at))| {
                let Some(image) = ctx.get_image(art) else {
                    return Svgr::empty();
                };
                let flip = frame.animate(&self.flips[i]);
                let pop = after(t, 0.2 + i as f32 * 0.12, 0.5);
                let paid = after(t, at, 0.4);
                let hover = 4. * wave(t, 1., i as f32 * 0.3);
                let pulse = 0.7 + 0.3 * wave(t, 2., i as f32 * 0.2);
                fframes::svgr!(
                    <g transform={format!("translate({cx} {:.1}) rotate({rot}) scale({:.3})", cy + hover, 1.38 * ease_out(pop))} opacity={pop}>
                        <circle r="110" fill="url(#g-gold)" opacity={0.6 * paid * pulse} />
                        {card(image, flip, mesa_card_back())}
                        {glint(30., -50., 5., paid * wave(t, 2., i as f32 * 0.33).max(0.))}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let plate_in = frame.animate(&self.plate_in);
        let plate = if plate_in > 0. {
            let s = frame.animate(&self.plate);
            let reveal = frame.animate(&self.underline);
            let p = name_plate(&mut frame, ctx, 84., 470., "BOSS", "SNIKKIT", reveal);
            fframes::svgr!(<g transform={format!("translate(84 450) scale({s:.3}) translate(-84 -450)")} opacity={plate_in}>{p}</g>)
        } else {
            Svgr::empty()
        };
        // Fuse sparks on two of his bombs, in the loop.
        let fuses = [(318., 352.), (396., 362.)]
            .iter()
            .enumerate()
            .map(|(i, &(fx, fy))| {
                let (px, py) = (ox + fx * SNIKKIT_W / 560., oy + fy * SNIKKIT_H / 680.);
                let u = loop_phase(t * 2. + i as f32 * 0.37);
                burst(px, py, u * 0.5, 0.5, 6, 300 + i as u32 * 7, 90., "#ffe08a")
            })
            .collect::<Vec<_>>();
        let embers = Motes { count: 40, seed: 121, area: (560., 100., 640., 620.), rise: 420., period: LOOP, size: (1., 3.), sway: 24., fill: "url(#g-ember)" };
        let shake = shake(t, STOP_AT, 6.);
        fframes::svgr!(
            <g>
                <g transform={format!("translate({} {})", shake.0 * 0.5, shake.1 * 0.5)}><g transform={cam_transform(cam, (0., 0.))} filter="url(#blur8u)">{bg}</g></g>
                <rect width="1280" height="720" fill="url(#g-red-sky)" opacity="0.3" />
                <circle cx={REST.0} cy="380" r={360. + 30. * f} fill="url(#g-ember)" opacity={0.35 * after(t, 0.6, 1.2)} />
                <g transform={format!("translate({} {})", shake.0, shake.1)}>
                    <path d={rail_d} fill="none" stroke="#1a0a04" stroke-width="40" stroke-dasharray="14 22" stroke-dashoffset={0.} opacity={0.85 * rail} transform="translate(0 6)" />
                    <path d={rail_d} fill="none" stroke="#1a0a04" stroke-width="16" stroke-dasharray="1400" stroke-dashoffset={1400. * (1. - rail)} />
                    <path d={rail_d} fill="none" stroke="#a89880" stroke-width="3" stroke-dasharray="1400" stroke-dashoffset={1400. * (1. - rail)} transform="translate(0 -6)" />
                    <path d={rail_d} fill="none" stroke="#6a5a4a" stroke-width="3" stroke-dasharray="1400" stroke-dashoffset={1400. * (1. - rail)} transform="translate(0 5)" />
                    {cards}
                    {coins}
                    <g transform={format!("rotate({tilt:.2} {} {})", wheel.0, feet_y)}>
                        <image href={snikkit.href()} x={ox} y={oy} width={SNIKKIT_W} height={SNIKKIT_H} filter="url(#aura)" opacity={0.45 * after(t, STOP_AT, 0.8)} />
                        <image href={snikkit.href()} x={ox} y={oy} width={SNIKKIT_W} height={SNIKKIT_H} />
                        <circle cx={torch.0} cy={torch.1} r={(60. + 20. * f) * flare} fill="url(#g-ember)" opacity="0.8" />
                        {fuses}
                    </g>
                    {streaks}
                    {stop_dust}
                </g>
                {embers.draw(t, after(t, 1.0, 1.0))}
                {plate}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Stone

const LENS_R: f32 = 128.;
const PILE: (f32, f32) = (640., 560.);

#[derive(Debug)]
pub struct Stone {
    sh: Shaders,
    lens_x: Anim,
    lens_y: Anim,
    lens_in: Anim,
    pile_in: Anim,
    coins: Vec<(f32, f32, f32, f32, f32)>,
}

impl Stone {
    pub fn new(sh: Shaders) -> Self {
        // A mound of coins, back to front.
        let mut coins = (0..240u32)
            .map(|i| {
                let u = rnd(i, 501) * 2. - 1.;
                let surface = PILE.1 - 200. * (1. - u * u).max(0.).powf(0.9);
                let base = PILE.1 + 70. - 30. * u * u;
                let y = lerp(surface, base, rnd(i, 502).powi(3));
                let x = PILE.0 + u * 400.;
                let near = ((y - surface) / (base - surface + 1.)).clamp(0., 1.);
                (x, y, lerp(17., 24., rnd(i, 504)) + 4. * near, lerp(0.34, 0.52, rnd(i, 505)), lerp(-25., 25., rnd(i, 506)))
            })
            .collect::<Vec<_>>();
        // A few coins spill around the foot of the pile.
        coins.extend((0..34u32).map(|i| {
            let side = if i % 2 == 0 { 1. } else { -1. };
            let x = PILE.0 + side * lerp(330., 520., rnd(i, 521));
            let y = PILE.1 + lerp(40., 95., rnd(i, 522));
            (x, y, lerp(15., 22., rnd(i, 523)), lerp(0.3, 0.45, rnd(i, 524)), lerp(-30., 30., rnd(i, 525)))
        }));
        coins.sort_by(|a, b| a.1.total_cmp(&b.1));
        Self {
            sh,
            lens_x: KeyFramesAnimation::new(vec![
                KeyFrame { start: 0.5, end: Some(2.6), from: 160., to: 930., easing: &Easing::EaseInOut },
                KeyFrame { start: 2.6, end: None, from: 930., to: 640., easing: &SOFT },
            ]),
            lens_y: tw(0.5, 3.2, 540., 470., Easing::EaseInOut),
            lens_in: tw(0.5, 0.9, 0., 1., Easing::EaseOut),
            pile_in: tw(0.0, 0.8, 0., 1., Easing::EaseOut),
            coins,
        }
    }
}

impl Scene for Stone {
    fn name(&self) -> &'static str {
        "OpeningStone"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(bokeh) = ctx.get_image("cave-bokeh.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let lx = frame.animate(&self.lens_x) + 4. * wave(t, 1., 0.1);
        let ly = frame.animate(&self.lens_y) + 3. * wave(t, 1., 0.35);
        let lens_in = frame.animate(&self.lens_in);
        let gold = self
            .coins
            .iter()
            .map(|&(x, y, r, ratio, rot)| coin(x, y, r, ratio, rot, false))
            .collect::<Vec<_>>();
        // The same pile seen through the lens: red stones with runny gold paint.
        let stones = self
            .coins
            .iter()
            .enumerate()
            .map(|(i, &(x, y, r, ratio, rot))| {
                let i = i as u32;
                let rock = stone(i + 700, r * 1.05);
                let h = r * lerp(0.4, 0.9, rnd(i, 507));
                let top = -r * 0.3;
                let paint = path(&[
                    (-r * 0.8, top), (-r * 0.5, -r * 0.75), (0., -r * 0.85), (r * 0.5, -r * 0.75), (r * 0.8, top),
                    (r * 0.6, top + h * 0.4), (r * 0.35, top + h), (r * 0.15, top + h * 0.5), (-r * 0.2, top + h * 0.7),
                    (-r * 0.3, top + h * 1.1), (-r * 0.45, top + h * 0.4), (-r * 0.6, top + h * 0.6),
                ], true);
                fframes::svgr!(
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale(1 {:.3})", 0.55 + ratio)}>
                        <path d={rock.clone()} fill="url(#g-rock)" stroke="#3a0c04" stroke-width="1.2" />
                        <path d={paint.clone()} fill="url(#g-paint)" opacity="0.92" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let twinkles = (0..14u32)
            .map(|k| {
                let c = self.coins[(rnd(k, 511) * self.coins.len() as f32) as usize % self.coins.len()];
                glint(c.0 + 3., c.1 - 4., 3.5, wave(t, 2., rnd(k, 512)).max(0.).powi(6) * after(t, 0.4, 0.6))
            })
            .collect::<Vec<_>>();
        // A drop of paint forms under the lens and falls, once per loop.
        let u = loop_phase(t - 3.4);
        let grow = (u / 0.6).min(1.);
        let drop = if t > 3.4 && grow > 0.02 {
            let (dx, dy) = (lx + 6., ly + 30.);
            let fall = ((u - 0.6) / 0.4).max(0.);
            let y = dy + 6. * grow + 160. * fall * fall;
            let o = if fall > 0.85 { (1. - fall) / 0.15 } else { 1. };
            fframes::svgr!(
                <g opacity={o}>
                    <path d={format!("M{dx:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {dx:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {dx:.1} {:.1}Z", y - 10. * grow, dx - 6. * grow, y, dx - 4. * grow, y + 7. * grow, y + 8. * grow, dx + 4. * grow, y + 7. * grow, dx + 6. * grow, y, y - 10. * grow)} fill="url(#g-paint)" />
                    <circle cx={dx - 1.5} cy={y + 1.} r={1.6 * grow} fill="#fffbe0" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let pile_in = frame.animate(&self.pile_in);
        let mound = path(&(0..=40).map(|k| { let u = k as f32 / 20. - 1.; (PILE.0 + u * 400., PILE.1 + 40. - 200. * (1. - u * u).max(0.).powf(0.9)) }).chain([(PILE.0 + 400., PILE.1 + 60.), (PILE.0 - 400., PILE.1 + 60.)]).collect::<Vec<_>>(), true);
        let truth = after(t, 3.0, 0.6);
        let motes = Motes { count: 46, seed: 151, area: (320., 0., 640., 720.), rise: 240., period: LOOP, size: (0.8, 2.2), sway: 16., fill: "#fff1c8" };
        let handle = (lx + LENS_R * 0.72, ly + LENS_R * 0.72);
        fframes::svgr!(
            <g>
                <defs>
                    <clipPath id="lens-view"><circle cx={lx} cy={ly} r={LENS_R} /></clipPath>
                    <radialGradient id="g-lens-glass" cx="0.4" cy="0.35" r="0.7">
                        <stop offset="0" stop-color="#fff6e0" stop-opacity="0.18" />
                        <stop offset="0.7" stop-color="#fff6e0" stop-opacity="0.02" />
                        <stop offset="1" stop-color="#2a1004" stop-opacity="0.35" />
                    </radialGradient>
                </defs>
                <rect width="1280" height="720" fill="#0b0503" />
                <image href={bokeh.href()} x="0" y="0" width="1280" height="720" opacity="0.7" />
                {rays(&self.sh, &frame, (640., -120.), 0.55, 1.0, (1.0, 0.86, 0.56))}
                <ellipse cx={PILE.0} cy={PILE.1 + 60.} rx="460" ry="90" fill="url(#g-gold)" opacity={0.35 * pile_in} />
                <g opacity={pile_in}>
                    <path d={mound.clone()} fill="#8a5414" />
                    {gold}
                    {twinkles}
                </g>
                <g opacity={lens_in}>
                    <circle cx={lx} cy={ly} r={LENS_R + 26.} fill="url(#g-ember)" opacity={0.18 + 0.2 * truth} />
                    <g clip-path="url(#lens-view)">
                        <rect x={lx - LENS_R} y={ly - LENS_R} width={LENS_R * 2.} height={LENS_R * 2.} fill="#1a0804" />
                        <g transform={format!("translate({lx:.1} {ly:.1}) scale(1.22) translate({:.1} {:.1})", -lx, -ly)}><path d={mound} fill="#4a1408" />{stones}</g>
                        <circle cx={lx} cy={ly} r={LENS_R} fill="#ff4a1a" opacity={0.12 * truth * (0.7 + 0.3 * wave(t, 1., 0.))} />
                        <circle cx={lx} cy={ly} r={LENS_R} fill="url(#g-lens-glass)" />
                        <path d={format!("M{:.1} {:.1} A{r} {r} 0 0 1 {:.1} {:.1}", lx - LENS_R * 0.62, ly - LENS_R * 0.45, lx - LENS_R * 0.1, ly - LENS_R * 0.78, r = LENS_R * 0.8)} stroke="#fffaf0" stroke-width="5" fill="none" opacity="0.45" stroke-linecap="round" />
                    </g>
                    <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", handle.0, handle.1, handle.0 + 120., handle.1 + 120.)} stroke="#3a1e08" stroke-width="30" stroke-linecap="round" />
                    <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", handle.0, handle.1, handle.0 + 120., handle.1 + 120.)} stroke="url(#g-crown-body)" stroke-width="22" stroke-linecap="round" />
                    <circle cx={lx} cy={ly} r={LENS_R + 8.} fill="none" stroke="#3a1e08" stroke-width="24" />
                    <circle cx={lx} cy={ly} r={LENS_R + 8.} fill="none" stroke="url(#g-crown)" stroke-width="16" />
                    <circle cx={lx} cy={ly} r={LENS_R + 1.} fill="none" stroke="#fff0c0" stroke-width="1.5" opacity="0.7" />
                    {glint(lx - LENS_R * 0.66, ly - LENS_R * 0.74, 6., (0.5 + 0.5 * wave(t, 1., 0.2)) * lens_in)}
                </g>
                {drop}
                {motes.draw(t, 0.8)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.9" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Road

const FUSE_START: f32 = 0.35;
const FUSE_END: f32 = 4.0;
const PULL_BACK: f32 = 4.15;

#[derive(Debug)]
pub struct Road {
    sh: Shaders,
    track: Track,
    trail: String,
    progress: Anim,
    pull: Anim,
    crown: Anim,
    flash: Anim,
    stop_at: Vec<f32>,
}

impl Road {
    pub fn new(sh: Shaders) -> Self {
        let track = Track::new(TRAIL.to_vec());
        let progress = tw(FUSE_START, FUSE_END, 0., 1., Easing::EaseInOut);
        // When the spark passes each clearing: invert the eased progress numerically.
        let stop_at = STOPS
            .iter()
            .map(|s| {
                let target = (0..=400)
                    .map(|k| k as f32 / 400.)
                    .min_by(|a, b| {
                        let pa = track.at(*a);
                        let pb = track.at(*b);
                        ((pa.0 - s.0).powi(2) + (pa.1 - s.1).powi(2)).total_cmp(&((pb.0 - s.0).powi(2) + (pb.1 - s.1).powi(2)))
                    })
                    .unwrap_or(0.);
                let mut lo = FUSE_START;
                let mut hi = FUSE_END;
                for _ in 0..30 {
                    let mid = (lo + hi) / 2.;
                    let k = ((mid - FUSE_START) / (FUSE_END - FUSE_START)).clamp(0., 1.);
                    let eased = if k < 0.5 { 2. * k * k } else { 1. - (-2. * k + 2.).powi(2) / 2. };
                    if eased < target { lo = mid } else { hi = mid }
                }
                lo
            })
            .collect();
        Self {
            sh,
            trail: smooth(TRAIL),
            track,
            progress,
            pull: tw(PULL_BACK, PULL_BACK + 0.85, 0., 1., Easing::EaseInOut),
            crown: spring(FUSE_END, 0., 1., BOUNCY),
            flash: flash(FUSE_END, 0.3, 0.6),
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
        let Some(map) = ctx.get_image("red-mesas-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let k = frame.animate(&self.progress);
        let spark = self.track.at(k);
        let pull = frame.animate(&self.pull);
        // The camera rides with the spark, then pulls back to the whole Region.
        let zoom = lerp(1.75, 1.0, pull);
        let half = (800. / zoom, 450. / zoom);
        let follow = (spark.0.clamp(half.0, 1600. - half.0), spark.1.clamp(half.1, 900. - half.1));
        let cam = (lerp(follow.0, 800., pull), lerp(follow.1, 450., pull), zoom);
        let painting = painting(&self.sh, &frame, map, Grade { gold: 0.12, heat: 0.3, ..Default::default() });
        let total = self.track.total();
        // Burnt fuse behind the spark, a dark cord ahead of it.
        let cord = fframes::svgr!(
            <g>
                <path d={self.trail.as_str()} fill="none" stroke="#2a1006" stroke-width="3" opacity={0.7 * after(t, 0., 0.3)} stroke-dasharray="10 6" />
                <path d={self.trail.as_str()} fill="none" stroke="#ff7a2a" stroke-width="16" stroke-dasharray={total} stroke-dashoffset={total * (1. - k)} opacity={0.5 + 0.12 * wave(t, 2., 0.)} filter="url(#blur8)" />
                <path d={self.trail.as_str()} fill="none" stroke="#ffd36a" stroke-width="5" stroke-dasharray={total} stroke-dashoffset={total * (1. - k)} />
                <path d={self.trail.as_str()} fill="none" stroke="#fff6d6" stroke-width="1.6" stroke-dasharray="10 30" stroke-dashoffset={-t * 40.} opacity={after(t, FUSE_END, 0.6)} />
            </g>
        );
        let stops = STOPS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let at = self.stop_at[i];
                let lit = after(t, at, 0.25);
                let pulse = 0.75 + 0.25 * wave(t, 2., i as f32 * 0.1);
                fframes::svgr!(
                    <g>
                        <circle cx={x} cy={y} r={(80. * lit).max(0.1)} fill="url(#g-gold)" opacity={0.8 * lit * pulse} />
                        <ellipse cx={x} cy={y} rx={(22. * lit).max(0.1)} ry={(12. * lit).max(0.1)} fill="#ffe08a" stroke="#8a4a10" stroke-width="2" opacity={lit} />
                        {shock_ring(x, y, t - at, 0.7, 60., 26., "#ffd36a")}
                        {dust_burst(x, y + 4., t - at, 0.9, 10, 200 + i as u32, 90., "url(#g-dust)")}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The spark: a white core, sparks and a trail of smoke puffs.
        let spark_layer = if (FUSE_START..FUSE_END).contains(&t) {
            let sparks = (0..12u32)
                .map(|j| {
                    let seed = (t * 30.) as u32 * 13 + j;
                    let a = TAU * rnd(seed, 1);
                    let r = lerp(8., 30., rnd(seed, 2));
                    fframes::svgr!(<path d={format!("M{:.1} {:.1} l{:.1} {:.1}", spark.0, spark.1, a.cos() * r, a.sin() * r)} stroke="#fff0b0" stroke-width="1.2" />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g>
                    <circle cx={spark.0} cy={spark.1} r="70" fill="url(#g-ember)" />
                    <circle cx={spark.0} cy={spark.1} r="26" fill="url(#g-gold)" />
                    <circle cx={spark.0} cy={spark.1} r="6" fill="#ffffff" />
                    {sparks}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let smoke = (0..36u32)
            .filter_map(|j| {
                let born = FUSE_START + j as f32 * (FUSE_END - FUSE_START) / 36.;
                let dt = t - born;
                if !(0.0..0.9).contains(&dt) {
                    return None;
                }
                let kk = ((born - FUSE_START) / (FUSE_END - FUSE_START)).clamp(0., 1.);
                let eased = if kk < 0.5 { 2. * kk * kk } else { 1. - (-2. * kk + 2.).powi(2) / 2. };
                let (x, y) = self.track.at(eased);
                let u = dt / 0.9;
                Some(fframes::svgr!(<circle cx={x + 10. * u} cy={y - 40. * u} r={4. + 14. * u} fill="url(#g-smoke)" opacity={0.8 * (1. - u)} />))
            })
            .collect::<Vec<_>>();
        // The bucket crown flashes when the spark arrives, and glints in each loop.
        let c = frame.animate(&self.crown).max(0.);
        let ping = (-(loop_phase(t - FUSE_END) * 4.).powi(2) * 3.).exp();
        let crown = if t > FUSE_END {
            fframes::svgr!(
                <g>
                    <circle cx={CROWN.0} cy={CROWN.1} r={120. * c} fill="url(#g-gold)" opacity={0.6 + 0.3 * ping} />
                    {glint(CROWN.0 + 30., CROWN.1 - 10., 10. * c, 0.6 + 0.4 * ping)}
                    {burst(CROWN.0, CROWN.1, t - FUSE_END, 0.9, 26, 77, 260., "#ffe08a")}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let chimney = Fog { density: 0.55, soft: 0.25, light: Color::hex("#d8c4b4"), shade: Color::hex("#6a4a3a"), dir: (0.2, -0.9), scale: 2.4, seed: 12.0 };
        let (gx, gy) = project(cam, GATE);
        let (sx, sy) = project(cam, (1250., 90.));
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {painting}
                    <ellipse cx={GATE.0} cy={GATE.1 + 6.} rx="40" ry="26" fill="url(#g-candle)" opacity={0.6 + 0.3 * flicker(t, 0.5)} />
                    {cord}
                    {stops}
                    {smoke}
                    {spark_layer}
                    {crown}
                </g>
                <g opacity={0.5 * after(t, 0.5, 1.)}>{chimney.draw(&self.sh, &frame, 0.6, (sx - 90., sy - 190., 180., 200.))}</g>
                <circle cx={gx} cy={gy} r="1" fill="none" />
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.55" />
                <rect width="1280" height="720" fill="#fff2d6" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}
