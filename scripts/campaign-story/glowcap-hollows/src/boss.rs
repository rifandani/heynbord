//! Boss: the Grove Hall, Glimmerbough, the warning, the trade, the challenge.
use crate::fx::*;
use crate::hollows::*;
use crate::mesa::{after, banner, burst, flash, glowcap, project, punch};
use crate::CLIP_FRAMES;
use fframes::{Color, Duration, FFramesContext, Frame, Scene, Shader, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const WARM: (f32, f32, f32) = (1.0, 0.86, 0.6);
const GREEN: (f32, f32, f32) = (0.6, 1.0, 0.82);

fn motes<'a>(t: f32, alpha: f32, seed: u32) -> Svgr<'a> {
    let spores = Motes { count: 44, seed, area: (0., 40., 1280., 720.), rise: 300., period: LOOP, size: (0.8, 2.4), sway: 34., fill: "url(#g-cyan)" };
    let flies = Motes { count: 18, seed: seed + 7, area: (0., 200., 1280., 560.), rise: 160., period: LOOP, size: (1.6, 3.4), sway: 60., fill: "url(#g-firefly)" };
    fframes::svgr!(<g>{spores.draw(t, alpha)}{flies.draw(t, alpha * 0.9)}</g>)
}

// ---------------------------------------------------------------- 1. Hall

const OPEN_AT: f32 = 2.8;
const LIGHT_AT: f32 = 3.0;
const FIGURE_AT: f32 = 4.0;
/// The roots woven over the door, in map units around the door.
const WEAVE: [[(f32, f32); 3]; 8] = [
    [(-26., -24.), (0., -10.), (26., -26.)], [(-26., -6.), (0., 6.), (26., -8.)], [(-26., 12.), (0., 22.), (26., 10.)],
    [(-24., 28.), (0., 18.), (24., 30.)], [(-18., -30.), (-6., 0.), (-16., 30.)], [(18., -30.), (6., 0.), (16., 30.)],
    [(-24., -30.), (0., 0.), (24., 30.)], [(24., -30.), (0., 0.), (-24., 30.)],
];

#[derive(Debug)]
pub struct Hall {
    sh: Shaders,
    cam: Cam,
    open: Anim,
    light: Anim,
    figure: Anim,
}

impl Hall {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 2.6, (1230., 520., 2.2), (1196., 262., 2.6)), (2.6, 4.6, (1196., 262., 2.6), (1190., 236., 2.25))]),
            open: tw(OPEN_AT, OPEN_AT + 1.0, 0., 1., Easing::EaseInOut),
            light: tw(LIGHT_AT, LIGHT_AT + 0.7, 0., 1., Easing::EaseOut),
            figure: tw(FIGURE_AT, FIGURE_AT + 0.6, 0., 1., Easing::EaseInOut),
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
        let Some(map) = ctx.get_image("glowcap-hollows-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let open = frame.animate(&self.open);
        let light = frame.animate(&self.light);
        let p = painting(&self.sh, &frame, map, Grade { dusk: 0.85, dark: 0.5, ..Default::default() });
        // Each shelf-fungus step lights as the camera climbs past it.
        let steps = STEPS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let k = bloom_rest(t, 0.3 + i as f32 * 0.2).min(1.2);
                let b = 0.85 + 0.15 * wave(t, 1., i as f32 * 0.09);
                fframes::svgr!(
                    <g opacity={k.min(1.) * b}>
                        <ellipse cx={x} cy={y} rx={(36. * k).max(0.1)} ry={(16. * k).max(0.1)} fill="url(#g-cyan)" opacity="0.8" />
                        <ellipse cx={x} cy={y - 2.} rx={(16. * k).max(0.1)} ry="3" fill="#e8fffb" opacity="0.8" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The woven roots pull apart, strand by strand, and the door light pours out.
        let strands = WEAVE
            .iter()
            .enumerate()
            .map(|(k, pts)| {
                let own = ((open * 1.6 - k as f32 * 0.08).clamp(0., 1.)).powf(1.4);
                let side = if pts[1].0 + pts[0].0 < 0. || k % 2 == 0 { -1. } else { 1. };
                let dx = side * 22. * own;
                let center = spline(&pts.iter().map(|&(x, y)| (DOOR.0 + x + dx, DOOR.1 + y)).collect::<Vec<_>>(), 6);
                let d = taper(&center, 5.5, 3.5, 1. - own);
                fframes::svgr!(
                    <g>
                        <path d={d.clone()} fill="#1e120a" stroke="#0a0604" stroke-width="0.8" />
                        <path d={d} fill="none" stroke="#ffd890" stroke-width="0.8" opacity={0.6 * light} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let breathe = 0.88 + 0.12 * wave(t, 1., 0.);
        let door_light = fframes::svgr!(
            <g opacity={light * breathe}>
                <path d={format!("M{} {} L{} {} L{} {} L{} {}Z", DOOR.0 - 18., DOOR.1 + 28., DOOR.0 + 18., DOOR.1 + 28., DOOR.0 + 50., DOOR.1 + 110., DOOR.0 - 46., DOOR.1 + 110.)} fill="url(#g-hall-light)" opacity="0.55" filter="url(#blur8u)" />
                <ellipse cx={DOOR.0} cy={DOOR.1} rx="22" ry="30" fill="#fff2c8" opacity="0.9" />
                <circle cx={DOOR.0} cy={DOOR.1} r="80" fill="url(#g-hall-light)" opacity="0.8" />
            </g>
        );
        let windows = WINDOWS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let k = bloom_rest(t, 3.35 + 0.15 * i as f32).min(1.);
                fframes::svgr!(<circle cx={x} cy={y} r={(30. * k).max(0.1)} fill="url(#g-hall-light)" opacity={0.9 * k * (0.8 + 0.2 * flicker(t, i as f32 * 0.4))} />)
            })
            .collect::<Vec<_>>();
        let roof = [(1160., 96., 64., true), (1050., 82., 60., false), (1300., 66., 36., false), (1360., 186., 40., true), (1032., 180., 38., true)]
            .iter()
            .enumerate()
            .map(|(i, &(x, y, r, v))| cap_glow(x, y, r, v, bloom_rest(t, 3.8 + 0.12 * i as f32), t, 300 + i as u32))
            .collect::<Vec<_>>();
        // Her small figure waits in the bright door.
        let fig = frame.animate(&self.figure);
        let figure = if fig > 0. {
            fframes::svgr!(<g transform={format!("translate({} {}) scale(0.075)", DOOR.0, DOOR.1 + 30.)} opacity={fig}>{glimmerbough(t, fig, 0., 0.6)}</g>)
        } else {
            Svgr::empty()
        };
        let door = project(cam, DOOR);
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {p}
                    {roof}
                    {windows}
                    {steps}
                    {door_light}
                    {figure}
                    {strands}
                </g>
                {rays(&self.sh, &frame, door, 0.45 * light * breathe, 0.75, WARM)}
                {motes(t, 0.8, 801)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.75" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Glimmerbough

const LADY_X: f32 = 830.;
const FEET: f32 = 692.;
const FORM_AT: f32 = 1.0;
const BLOOM_AT: f32 = 1.9;
const EYES_AT: f32 = 2.35;
const NAME_AT: f32 = 2.6;

#[derive(Debug)]
pub struct Lady {
    sh: Shaders,
    caustic: Shader,
    form: Anim,
    eyes: Anim,
    name: Anim,
    flash: Anim,
    arch: String,
    pillars: [String; 3],
}

impl Lady {
    pub fn new(sh: Shaders) -> Self {
        let pillar = |pts: &[(f32, f32)], w0: f32, w1: f32| taper(&spline(pts, 8), w0, w1, 1.);
        Self {
            sh,
            caustic: caustic_shader(),
            form: tw(FORM_AT, FORM_AT + 0.9, 0., 1., Easing::EaseInOut),
            eyes: tw(EYES_AT, EYES_AT + 0.25, 0., 1., Easing::EaseOut),
            name: tw(NAME_AT, NAME_AT + 1.2, 0., 1., Easing::EaseOut),
            flash: flash(BLOOM_AT, 0.3, 0.6),
            arch: format!("M{} 560 L{} 230 A170 170 0 0 1 {} 230 L{} 560Z", LADY_X - 170., LADY_X - 170., LADY_X + 170., LADY_X + 170.),
            pillars: [
                pillar(&[(40., 760.), (110., 520.), (70., 260.), (170., 40.), (300., -40.)], 170., 60.),
                pillar(&[(1260., 760.), (1180., 500.), (1230., 240.), (1120., 30.), (980., -40.)], 160., 60.),
                pillar(&[(-40., 120.), (260., 60.), (640., 40.), (1000., 70.), (1320., 20.)], 70., 50.),
            ],
        }
    }
}

impl Scene for Lady {
    fn name(&self) -> &'static str {
        "BossGlimmerbough"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let form = frame.animate(&self.form);
        let window = fframes::svgr!(
            <g>
                <defs><clipPath id="gh-arch"><path d={self.arch.as_str()} /></clipPath></defs>
                <path d={self.arch.as_str()} fill="url(#g-window)" opacity="0.85" />
                <g clip-path="url(#gh-arch)">
                    {caustic(&self.caustic, &frame, 2.4, (0.05, 0.25, 0.2), (0.8, 1.0, 0.9), 0.35, (LADY_X - 170., 60., 340., 500.))}
                    <path d={format!("M{0} 60 L{0} 560 M{1} 60 L{1} 560 M{2} 60 L{2} 560 M{3} 330 L{4} 330", LADY_X - 60., LADY_X, LADY_X + 60., LADY_X - 170., LADY_X + 170.)} stroke="#0a1a14" stroke-width="9" />
                    <circle cx={LADY_X} cy="190" r="70" fill="none" stroke="#0a1a14" stroke-width="9" />
                    <path d={leaf(110.)} transform={format!("translate({LADY_X} 250)")} fill="none" stroke="#0a1a14" stroke-width="7" />
                </g>
                <path d={self.arch.as_str()} fill="none" stroke="#0a1a14" stroke-width="14" />
            </g>
        );
        // A column of spores spins, tightens and becomes her.
        let column = (0..110u32)
            .filter_map(|i| {
                let k = ((t - 0.15) / (FORM_AT + 0.9 - 0.15)).clamp(0., 1.);
                if k >= 1. || t < 0.15 {
                    return None;
                }
                let a = TAU * (rnd(i, 1) + t * lerp(0.6, 1.2, rnd(i, 2)));
                let y = lerp(FEET, 100., (rnd(i, 3) + t * 0.25).rem_euclid(1.));
                let r = lerp(200., 30., k) * lerp(0.4, 1., rnd(i, 4)) * (1. - (y - 400.).abs() / 700.);
                let x = LADY_X + a.cos() * r;
                let front = a.sin() > 0.;
                let fill = if rnd(i, 5) > 0.4 { "#c8fff4" } else { "#e4c8ff" };
                Some(fframes::svgr!(<circle cx={x} cy={y + a.sin() * r * 0.15} r={if front { 2.6 } else { 1.6 }} fill={fill} opacity={(0.4 + 0.6 * k) * if front { 1. } else { 0.5 }} />))
            })
            .collect::<Vec<_>>();
        let top = lerp(FEET + 20., 0., form);
        let bloom_k = bloom(t - BLOOM_AT);
        let lady = if form > 0. {
            fframes::svgr!(
                <g>
                    <defs><clipPath id="gh-form"><rect x="0" y={top} width="1280" height="760" /></clipPath></defs>
                    <g clip-path="url(#gh-form)">
                        <g transform={format!("translate({LADY_X} {FEET}) scale(0.84)")}>{glimmerbough(t, frame.animate(&self.eyes), 0., 0.3 + 0.7 * bloom_k)}</g>
                    </g>
                    <path d={format!("M{} {top:.1} L{} {top:.1}", LADY_X - 230., LADY_X + 230.)} stroke="#e8fffb" stroke-width="3" opacity={if form < 1. { 0.9 } else { 0. }} filter="url(#blur3u)" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The staff blooms: a ring of light runs out over the floor and lights a ring of glowcaps.
        let ring_r = 700. * (t - BLOOM_AT).max(0.);
        let ring = if t > BLOOM_AT && ring_r < 700. {
            fframes::svgr!(<ellipse cx={LADY_X} cy={FEET} rx={ring_r} ry={ring_r * 0.13} fill="none" stroke="#bffcf2" stroke-width={6. * (1. - ring_r / 700.)} opacity={1. - ring_r / 700.} />)
        } else {
            Svgr::empty()
        };
        let floor_caps = (0..11)
            .map(|k| {
                let a = PI * (0.05 + 0.9 * k as f32 / 10.);
                let (x, y) = (LADY_X - a.cos() * 470., FEET + 10. + a.sin() * 36.);
                let lit = bloom(t - BLOOM_AT - (a.cos().abs() * 470.) / 700.).min(1.);
                let s = lerp(20., 34., rnd(k, 41));
                fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1})")}>{glowcap(s, 0.15 + 0.85 * lit * (0.85 + 0.15 * wave(t, 1., k as f32 * 0.1)), k)}</g>)
            })
            .collect::<Vec<_>>();
        let orbit = (0..40u32)
            .map(|i| {
                let a = TAU * (rnd(i, 21) + t / LOOP);
                let y = lerp(FEET - 40., 150., rnd(i, 22)) + 10. * wave(t, 1., rnd(i, 23));
                let r = lerp(160., 260., rnd(i, 24));
                let front = a.sin() > 0.;
                fframes::svgr!(<circle cx={LADY_X + a.cos() * r} cy={y + a.sin() * 16.} r={if front { 2.2 } else { 1.4 }} fill="#c8fff4" opacity={after(t, BLOOM_AT, 0.8) * if front { 0.8 } else { 0.35 }} />)
            })
            .collect::<Vec<_>>();
        // Vines hang from the roots above, with small lights along them.
        let vines = [(150., 40., 300.), (250., 70., 200.), (1040., 60., 260.), (1150., 30., 360.), (560., 45., 120.)]
            .iter()
            .enumerate()
            .map(|(i, &(x, y, len))| {
                let sw = 8. * wave(t, 1., i as f32 * 0.21);
                let pts = (0..=6).map(|j| { let u = j as f32 / 6.; (x + sw * u * u + 6. * (u * 7.).sin(), y + len * u) }).collect::<Vec<_>>();
                let center = spline(&pts, 4);
                let lights = (1..5)
                    .map(|j| {
                        let p = center[(center.len() - 1) * j / 5];
                        fframes::svgr!(<circle cx={p.0} cy={p.1} r="9" fill="url(#g-cyan)" opacity={0.6 + 0.4 * wave(t, 2., (i * 5 + j) as f32 * 0.13)} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(<g><path d={taper(&center, 5., 1.5, 1.)} fill="#16301e" />{lights}</g>)
            })
            .collect::<Vec<_>>();
        let name = frame.animate(&self.name);
        let plate = if name > 0. { vine_plate(&mut frame, ctx, 330., 470., "LADY", "GLIMMERBOUGH", name, t) } else { Svgr::empty() };
        let (kx, ky) = shake(t, NAME_AT + 0.6, 4.);
        fframes::svgr!(
            <g transform={format!("translate({kx:.1} {ky:.1})")}>
                <rect x="-20" y="-20" width="1320" height="760" fill="url(#g-hall-bg)" />
                {window}
                {rays(&self.sh, &frame, (LADY_X, 200.), 0.42, 0.85, GREEN)}
                <path d={self.pillars[0].as_str()} fill="url(#g-root-night)" />
                <path d={self.pillars[1].as_str()} fill="url(#g-root-night)" />
                <path d={self.pillars[2].as_str()} fill="#07040c" />
                {vines}
                <ellipse cx={LADY_X} cy={FEET + 20.} rx="620" ry="80" fill="url(#g-cyan)" opacity={0.15 + 0.25 * bloom_k.min(1.)} />
                {floor_caps}
                {ring}
                {column}
                {lady}
                {orbit}
                <rect x="-20" y="-20" width="1320" height="760" fill="url(#g-vignette)" opacity="0.7" />
                {plate}
                <rect x="-20" y="-20" width="1320" height="760" fill="#e8fffb" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Warning

/// The first part of a polyline, `k` 0..1, as path data.
fn partial(points: &[(f32, f32)], k: f32) -> String {
    if k <= 0.001 || points.len() < 2 {
        return String::new();
    }
    let n = points.len() - 1;
    let f = n as f32 * k.min(1.);
    let whole = f.floor() as usize;
    let mut pts = points[..=whole.min(n)].to_vec();
    if whole < n {
        let u = f - whole as f32;
        let (a, b) = (points[whole], points[whole + 1]);
        pts.push((lerp(a.0, b.0, u), lerp(a.1, b.1, u)));
    }
    path(&pts, false)
}

/// A line of Elf light: a soft glow under a bright core.
fn light_line<'a>(d: String, width: f32, alpha: f32) -> Svgr<'a> {
    if d.is_empty() || alpha <= 0. {
        return Svgr::empty();
    }
    fframes::svgr!(
        <g opacity={alpha}>
            <path d={d.clone()} fill="none" stroke="#5ff2dc" stroke-width={width * 4.} stroke-linecap="round" stroke-linejoin="round" opacity="0.4" filter="url(#blur3u)" />
            <path d={d} fill="none" stroke="#e8fffb" stroke-width={width} stroke-linecap="round" stroke-linejoin="round" />
        </g>
    )
}

fn arc_points(cx: f32, cy: f32, rx: f32, ry: f32, a0: f32, a1: f32, n: usize) -> Vec<(f32, f32)> {
    (0..=n).map(|i| {
        let a = lerp(a0, a1, i as f32 / n as f32);
        (cx + a.cos() * rx, cy + a.sin() * ry)
    }).collect()
}

const RING: (f32, f32) = (880., 470.);
const RUN_AT: f32 = 3.2;
const TRAP: (f32, f32) = (742., 618.);
const TRAP_AT: f32 = 4.0;

#[derive(Debug)]
pub struct Warning {
    caustic: Shader,
    flight: Anim,
    unfold: Anim,
    run: Anim,
    flash: Anim,
}

impl Warning {
    pub fn new(_sh: Shaders) -> Self {
        Self {
            caustic: caustic_shader(),
            flight: tw(0.7, 1.4, 0., 1., Easing::EaseInOut),
            unfold: tw(1.4, 1.75, 0., 1., Easing::EaseOut),
            run: tw(RUN_AT, TRAP_AT - 0.1, 0., 1., Easing::EaseInOut),
            flash: flash(TRAP_AT, 0.18, 0.4),
        }
    }
}

impl Scene for Warning {
    fn name(&self) -> &'static str {
        "BossWarning"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let pulse = 0.9 + 0.1 * wave(t, 2., 0.);
        // The tunnel mouth.
        let mut mouth = vec![(170., 610.), (170., 500.)];
        mouth.extend(arc_points(270., 500., 100., 90., PI, TAU, 16));
        mouth.push((370., 610.));
        let inner = arc_points(270., 520., 60., 54., PI, TAU, 12);
        let tunnel = fframes::svgr!(
            <g>
                {light_line(partial(&mouth, after(t, 0.15, 0.6)), 2.4, 1.)}
                {light_line(partial(&inner, after(t, 0.4, 0.5)), 1.6, 0.7)}
                {light_line(partial(&[(120., 610.), (420., 610.)], after(t, 0.1, 0.5)), 2., 0.8)}
            </g>
        );
        // The letter flies up out of the tunnel, then opens.
        let fl = frame.animate(&self.flight);
        let unfold = frame.animate(&self.unfold);
        let letter = if fl > 0. {
            let (x, y) = (lerp(270., 450., fl) - 120. * (PI * fl).sin(), lerp(560., 250., fl));
            let rot = lerp(-30., -6., fl) + 3. * wave(t, 1., 0.2);
            let (w, h) = (lerp(70., 150., unfold), lerp(44., 180., unfold));
            let rows = (0..4)
                .map(|k| {
                    let ry = -h * 0.32 + k as f32 * h * 0.14;
                    let pts = (0..=10).map(|j| (-w * 0.36 + w * 0.7 * j as f32 / 10., ry + 2. * (j as f32 * 1.3 + k as f32).sin())).collect::<Vec<_>>();
                    light_line(partial(&pts, ((unfold - 0.2 - k as f32 * 0.12) * 2.5).clamp(0., 1.)), 1.3, 0.8)
                })
                .collect::<Vec<_>>();
            let fold = format!("M{:.1} {:.1} L0 {:.1} L{:.1} {:.1}", -w / 2., -h / 2., -h / 2. + h * 0.3 * (1. - unfold), w / 2., -h / 2.);
            fframes::svgr!(
                <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1})")}>
                    <rect x={-w / 2.} y={-h / 2.} width={w} height={h} rx="4" fill="#1a1036" opacity="0.6" />
                    {light_line(format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z", -w / 2., -h / 2., w / 2., -h / 2., w / 2., h / 2., -w / 2., h / 2.), 2., 1.)}
                    {light_line(fold, 1.4, 1. - unfold * 0.8)}
                    {rows}
                    <circle cx="0" cy={h * 0.3} r={(14. * unfold).max(0.1)} fill="url(#g-violet)" opacity={0.8 * unfold * pulse} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // A ring of mushrooms, then a wall of stakes around it.
        let shrooms = (0..7)
            .map(|k| {
                let a = PI * (1.1 + 0.8 * k as f32 / 6.) + if k % 2 == 0 { 0. } else { PI };
                let (x, y) = (RING.0 + a.cos() * 150., RING.1 + a.sin() * 44.);
                let s = 34. + 8. * a.sin();
                let at = 1.8 + 0.1 * k as f32;
                let cap = arc_points(x, y - s * 0.9, s * 0.7, s * 0.5, PI, TAU, 8);
                let mut cap_closed = cap.clone();
                cap_closed.push((x - s * 0.7, y - s * 0.9));
                fframes::svgr!(
                    <g>
                        {light_line(partial(&[(x, y), (x, y - s * 0.9)], after(t, at, 0.25)), 1.8, 0.9)}
                        {light_line(partial(&cap_closed, after(t, at + 0.1, 0.35)), 2., 1.)}
                        <circle cx={x} cy={y - s * 1.1} r={s * 0.9} fill="url(#g-cyan)" opacity={0.35 * after(t, at + 0.3, 0.3) * (0.8 + 0.2 * wave(t, 1., k as f32 * 0.15))} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let wall_ring = arc_points(RING.0, RING.1 + 30., 250., 92., PI, PI * 3., 48);
        let stakes = (0..22)
            .map(|k| {
                let a = PI * (0.05 + 0.9 * k as f32 / 21.);
                let (x, y) = (RING.0 - a.cos() * 250., RING.1 + 30. + a.sin() * 92.);
                let h = 40. + 26. * a.sin();
                let up = bloom(t - 2.6 - 0.03 * k as f32).min(1.1);
                light_line(path(&[(x - 7., y), (x - 7., y - h * up), (x, y - h * up - 12.), (x + 7., y - h * up), (x + 7., y)], false), 1.8, up.min(1.))
            })
            .collect::<Vec<_>>();
        // A goblin with a shovel runs along the wall, then digs.
        let run = frame.animate(&self.run);
        let goblin = if t > RUN_AT - 0.2 {
            let a = PI * lerp(0.9, 0.3, run);
            let (x, y) = (RING.0 - a.cos() * 290., RING.1 + 40. + a.sin() * 120.);
            let stride = if run < 1. { 14. * (t * 18.).sin() } else { 0. };
            let dig = if t > TRAP_AT + 0.4 { 10. * wave(t, 4., 0.).max(0.) } else { 0. };
            let pts_body = [(x, y - 70.), (x, y - 34.)];
            fframes::svgr!(
                <g opacity={after(t, RUN_AT - 0.2, 0.25)}>
                    {light_line(format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} M{x:.1} {:.1} L{:.1} {:.1} M{x:.1} {:.1} L{:.1} {:.1}", pts_body[0].0, pts_body[0].1, pts_body[1].0, pts_body[1].1, x - 10. + stride * 0.5, y, y - 34., x + 10. - stride * 0.5, y, y - 60., x + 22., y - 50. + dig), 2.2, 1.)}
                    {light_line(format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}", x + 10., y - 76. + dig, x + 34., y - 26. + dig, x + 44., y - 18. + dig), 2., 1.)}
                    {light_line(format!("M{:.1} {:.1} A12 12 0 1 1 {:.1} {:.1} M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}", x - 0.1, y - 96., x + 0.1, y - 96., x - 10., y - 88., x - 30., y - 96., x - 11., y - 80., x + 10., y - 88., x + 30., y - 96., x + 11., y - 80.), 2., 1.)}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The trap at the foot of the wall snaps shut.
        let shut = after(t, TRAP_AT - 0.08, 0.08);
        let trap_k = after(t, 3.4, 0.3);
        let jaw = |side: f32| {
            let pts = (0..=12)
                .map(|j| {
                    let u = j as f32 / 12.;
                    let a = PI * u;
                    let tooth = if j % 2 == 1 { 10. } else { 0. };
                    (TRAP.0 - a.cos() * (40. - tooth), TRAP.1 - side * a.sin() * (lerp(8., 34., shut) - tooth * 0.6))
                })
                .collect::<Vec<_>>();
            light_line(path(&pts, false), 2., trap_k)
        };
        let sparks = burst(TRAP.0, TRAP.1 - 10., t - TRAP_AT, 0.6, 18, 151, 260., "#e8fffb");
        let bg = fframes::svgr!(
            <g>
                <defs>
                    <radialGradient id="gh-vision" cx="0.5" cy="0.45" r="0.75">
                        <stop offset="0" stop-color="#2a1a52" />
                        <stop offset="0.6" stop-color="#140c2e" />
                        <stop offset="1" stop-color="#05030c" />
                    </radialGradient>
                </defs>
                <rect width="1280" height="720" fill="url(#gh-vision)" />
            </g>
        );
        fframes::svgr!(
            <g>
                {bg}
                {caustic(&self.caustic, &frame, 0.8, (0.06, 0.03, 0.14), (0.22, 0.14, 0.4), 0.28, (0., 0., 1280., 720.))}
                {Motes { count: 50, seed: 831, area: (0., 0., 1280., 760.), rise: 260., period: LOOP, size: (0.8, 2.2), sway: 30., fill: "url(#g-cyan)" }.draw(t, 0.7)}
                <g transform="translate(640 400) scale(1.14) translate(-640 -400)">
                {tunnel}
                {shrooms}
                {light_line(partial(&wall_ring, after(t, 2.3, 0.8)), 2., 0.85)}
                {stakes}
                {jaw(1.)}
                {jaw(-1.)}
                {sparks}
                {goblin}
                {letter}
                </g>
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#e8fffb" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Trade

const SHAFT: (f32, f32) = (640., 380.);
const ANSWER_AT: f32 = 2.0;
const RISE_AT: f32 = 2.5;
const SPILL_AT: f32 = 3.6;

#[derive(Debug)]
pub struct Trade {
    /// The basket goes down, waits, and comes back up.
    depth: Anim,
    answer: Anim,
    rings: Vec<(f32, String)>,
    roots: Vec<String>,
}

impl Trade {
    pub fn new(_sh: Shaders) -> Self {
        // Rough rings of rock and root, from far to near; each one is an annulus.
        let rings = (0..14)
            .rev()
            .map(|k| {
                let z = 0.7 + k as f32 * 0.75;
                let r = 430. / z;
                let ring = |rr: f32, seed: u32| {
                    let pts = (0..28)
                        .map(|i| {
                            let a = TAU * i as f32 / 28.;
                            let w = lerp(0.9, 1.1, rnd(i, seed));
                            (SHAFT.0 + a.cos() * rr * w * 1.25, SHAFT.1 + a.sin() * rr * w)
                        })
                        .collect::<Vec<_>>();
                    path(&pts, true)
                };
                (z, format!("{} {}", ring(r * 2.2, 500 + k), ring(r, 600 + k)))
            })
            .collect();
        let roots = (0..9u32)
            .map(|k| {
                let a = TAU * (k as f32 / 9. + 0.03 * rnd(k, 71));
                let pts = (0..8)
                    .map(|j| {
                        let z = 0.8 + j as f32 * 0.9;
                        let aa = a + 0.18 * (j as f32 * 0.9 + k as f32).sin();
                        (SHAFT.0 + aa.cos() * 520. / z * 1.25, SHAFT.1 + aa.sin() * 520. / z)
                    })
                    .collect::<Vec<_>>();
                taper(&spline(&pts, 4), 46., 3., 1.)
            })
            .collect();
        Self {
            depth: keys(&[(0.2, 1.9, 0.95, 9., Easing::EaseIn), (1.9, RISE_AT, 9., 9., Easing::Linear), (RISE_AT, 3.7, 9., 1.15, Easing::EaseOut)]),
            answer: tw(ANSWER_AT, ANSWER_AT + 0.8, 0., 1., Easing::EaseOut),
            rings,
            roots,
        }
    }
}

/// A woven basket seen from above, its center at the origin, `r` its radius.
fn basket<'a>(r: f32, amber_load: bool, t: f32) -> Svgr<'a> {
    let load = (0..14u32)
        .map(|k| {
            let a = TAU * rnd(k, 61);
            let d = r * 0.62 * rnd(k, 62).sqrt();
            let (x, y) = (a.cos() * d, a.sin() * d);
            let s = r * lerp(0.16, 0.24, rnd(k, 63));
            if amber_load {
                fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1})")}>{amber(s, 0.5, t, 700 + k)}</g>)
            } else {
                fframes::svgr!(
                    <g>
                        <circle cx={x} cy={y} r={s * 1.4} fill="url(#g-cyan)" opacity="0.6" />
                        <ellipse cx={x} cy={y} rx={s} ry={s * 0.8} fill="url(#g-glowcap)" />
                    </g>
                )
            }
        })
        .collect::<Vec<_>>();
    let weave = (0..16)
        .map(|k| {
            let a = TAU * k as f32 / 16.;
            fframes::svgr!(<path d={format!("M{:.1} {:.1} L{:.1} {:.1}", a.cos() * r * 0.78, a.sin() * r * 0.78, a.cos() * r, a.sin() * r)} stroke="#2a1a0c" stroke-width={r * 0.04} />)
        })
        .collect::<Vec<_>>();
    let glow = if amber_load { "url(#g-amber-halo)" } else { "url(#g-cyan)" };
    fframes::svgr!(
        <g>
            <circle r={r * 2.2} fill={glow} opacity="0.55" />
            <circle r={r} fill="#6a4a24" stroke="#2a1a0c" stroke-width={r * 0.05} />
            <circle r={r * 0.89} fill="none" stroke="#a87a40" stroke-width={r * 0.16} stroke-dasharray={format!("{:.1} {:.1}", r * 0.12, r * 0.06)} />
            {weave}
            <circle r={r * 0.78} fill="#2a1a0c" />
            {load}
        </g>
    )
}

impl Scene for Trade {
    fn name(&self) -> &'static str {
        "BossTrade"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let z = frame.animate(&self.depth);
        let answer = frame.animate(&self.answer);
        let amber_load = t > ANSWER_AT + 0.3;
        // The basket sways on its rope once it is back.
        let sway = (8. * wave(t, 1., 0.), 5. * wave(t, 1., 0.25));
        let settle = after(t, 3.7, 0.6);
        let bx = SHAFT.0 + 30. / z + sway.0 * settle;
        let by = SHAFT.1 + 20. / z + sway.1 * settle;
        let r = 150. / z;
        let rings = self
            .rings
            .iter()
            .map(|(rz, d)| {
                let shade = (1.2 / rz).min(1.);
                let c = (shade * 46.) as u8;
                let fill = format!("#{:02x}{:02x}{:02x}", c / 2 + 4, c + 6, c / 2 + 6);
                let lit = (answer * (1. - (rz - 9.).abs() / 6.).max(0.)).min(1.);
                fframes::svgr!(
                    <g>
                        <path d={d.clone()} fill={fill} fill-rule="evenodd" />
                        <path d={d.clone()} fill="none" stroke="#3a5a40" stroke-width={(3. / rz).max(0.5)} opacity={0.6 * shade} />
                        <path d={d.clone()} fill="none" stroke="#ffb43a" stroke-width="2" opacity={0.5 * lit} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let roots = self
            .roots
            .iter()
            .map(|d| fframes::svgr!(<path d={d.as_str()} fill="#1a120a" stroke="#8ff6e6" stroke-width="1" stroke-opacity="0.35" />))
            .collect::<Vec<_>>();
        let fungus = (0..30u32)
            .map(|k| {
                let a = TAU * rnd(k, 81);
                let zz = lerp(0.9, 6., rnd(k, 82));
                let (x, y) = (SHAFT.0 + a.cos() * 430. / zz * 1.25 * 1.05, SHAFT.1 + a.sin() * 430. / zz * 1.05);
                fframes::svgr!(<circle cx={x} cy={y} r={14. / zz} fill="url(#g-cyan)" opacity={0.7 * (0.75 + 0.25 * wave(t, 1., rnd(k, 83)))} />)
            })
            .collect::<Vec<_>>();
        // Far below, a warm light answers.
        let deep = fframes::svgr!(
            <g>
                <circle cx={SHAFT.0} cy={SHAFT.1} r={60. + 120. * answer} fill="url(#g-amber-halo)" opacity={answer * (0.85 + 0.15 * wave(t, 2., 0.))} />
                <circle cx={SHAFT.0} cy={SHAFT.1} r={70.} fill="url(#g-cyan)" opacity={0.6 * (1. - answer) * after(t, 0.6, 1.2)} />
            </g>
        );
        let rope = fframes::svgr!(
            <g>
                <path d={format!("M700 -30 Q{:.1} {:.1} {bx:.1} {by:.1}", lerp(700., bx, 0.6), lerp(-30., by, 0.4) + 20.)} fill="none" stroke="#1e1208" stroke-width={(10. / z.sqrt()).max(1.)} />
                <path d={format!("M700 -30 Q{:.1} {:.1} {bx:.1} {by:.1}", lerp(700., bx, 0.6), lerp(-30., by, 0.4) + 20.)} fill="none" stroke="#5a8a4a" stroke-width={(3. / z.sqrt()).max(0.6)} stroke-dasharray="6 8" opacity="0.7" />
            </g>
        );
        // Drops of amber spill over the rim and fall slowly into the dark.
        let drops = if t > SPILL_AT {
            (0..12u32)
                .map(|k| {
                    let u = ((t - SPILL_AT) / LOOP * 2. + rnd(k, 91)).rem_euclid(1.);
                    let a = TAU * rnd(k, 92);
                    let zz = lerp(1.2, 9., u * u);
                    let (x, y) = (SHAFT.0 + (bx - SHAFT.0 + a.cos() * 160.) * 1.2 / zz, SHAFT.1 + (by - SHAFT.1 + a.sin() * 130.) * 1.2 / zz);
                    let o = (u * 8.).min(1.) * (1. - u);
                    fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1})")} opacity={o}>{amber(30. / zz, 0.4, t, 720 + k)}</g>)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        let warm = Motes { count: 30, seed: 851, area: (0., 0., 1280., 760.), rise: 220., period: LOOP, size: (1., 2.6), sway: 30., fill: "url(#g-amber-halo)" };
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="#020403" />
                {deep}
                {rings}
                {roots}
                {fungus}
                {drops}
                {rope}
                <g transform={format!("translate({bx:.1} {by:.1})")}>{basket(r, amber_load, t)}</g>
                {Motes { count: 40, seed: 841, area: (0., 0., 1280., 760.), rise: 260., period: LOOP, size: (0.8, 2.2), sway: 30., fill: "url(#g-cyan)" }.draw(t, 0.6)}
                {warm.draw(t, 0.7 * answer)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Challenge

/// The three lanes recede from your side (left) toward Glimmerbough (right).
const NEAR: [(f32, f32); 3] = [(250., 84.), (362., 98.), (486., 112.)];
const FAR: [(f32, f32); 3] = [(214., 54.), (334., 62.), (454., 70.)];
const LANE_L: f32 = 150.;
const LANE_R: f32 = 880.;
const NEST_U: f32 = 0.74;
const WARDEN_U: f32 = 0.9;
const ROOTS_AT: f32 = 0.9;
const NEST_AT: f32 = 1.9;
const WARDEN_AT: f32 = 2.5;
const BOSS_AT: f32 = 2.9;
const SURGE_AT: f32 = 3.6;

fn lane_at(i: usize, u: f32) -> (f32, f32, f32) {
    (lerp(LANE_L, LANE_R, u), lerp(NEAR[i].0, FAR[i].0, u), lerp(NEAR[i].1, FAR[i].1, u))
}

#[derive(Debug)]
pub struct Challenge {
    sh: Shaders,
    lanes: Vec<Anim>,
    hero_drop: Anim,
    nest: Anim,
    warden: Anim,
    flash: Anim,
    rise: Anim,
    rise_in: Anim,
    surge: Anim,
    punch: Anim,
    roots: Anim,
}

impl Challenge {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            lanes: (0..3).map(|i| tw(0.3 + 0.12 * i as f32, 1.1 + 0.12 * i as f32, 0., 1., Easing::EaseInOut)).collect(),
            hero_drop: tw(0.05, 0.35, -420., 0., Easing::EaseIn),
            nest: tw(NEST_AT - 0.35, NEST_AT, 0., 1., Easing::EaseIn),
            warden: tw(WARDEN_AT - 0.42, WARDEN_AT, 0., 1., Easing::EaseIn),
            flash: flash(WARDEN_AT, 0.2, 0.45),
            rise: spring(BOSS_AT, 90., 0., HEAVY),
            rise_in: tw(BOSS_AT, BOSS_AT + 0.45, 0., 1., Easing::EaseOut),
            surge: keys(&[(SURGE_AT - 0.1, SURGE_AT, 0., 1., Easing::Linear), (SURGE_AT, SURGE_AT + 1.0, 1., 0.35, Easing::EaseOut)]),
            punch: punch(SURGE_AT, 1.04),
            roots: tw(ROOTS_AT, ROOTS_AT + 0.9, 0., 1., Easing::EaseOut),
        }
    }
}

/// A card that falls into its lane, lands and throws a ring of leaves.
fn land_card<'a>(art: &fframes::media::ImageData<'_>, t: f32, at: f32, fall: f32, (cx, cy): (f32, f32), scale: f32, epic: bool) -> Svgr<'a> {
    if fall <= 0. {
        return Svgr::empty();
    }
    let x = lerp(cx + 100., cx, fall);
    let y = lerp(-200., cy, fall);
    let rot = lerp(24., -3., fall);
    let s = lerp(scale * 1.5, scale, fall);
    let ground = cy + 70. * scale / 1.2;
    let dt = t - at;
    let ring = if (0.0..0.9).contains(&dt) {
        let a = dt / 0.9;
        let leaves = (0..16u32)
            .map(|k| {
                let ang = TAU * k as f32 / 16. + rnd(k, 5);
                let d = (60. + 260. * ease(a)) * scale;
                let (lx, ly) = (cx + ang.cos() * d, ground + ang.sin() * d * 0.25 - 40. * (PI * a).sin());
                fframes::svgr!(<path d={leaf(16.)} transform={format!("translate({lx:.1} {ly:.1}) rotate({:.0})", ang.to_degrees() + 720. * a)} fill="url(#g-leaf)" opacity={1. - a} />)
            })
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g>
                <ellipse cx={cx} cy={ground} rx={50. + 240. * a * scale} ry={12. + 46. * a * scale} fill="none" stroke="#bffcf2" stroke-width={12. * (1. - a)} opacity={1. - a} />
                {leaves}
            </g>
        )
    } else {
        Svgr::empty()
    };
    let pulse = if t > at { 0.5 * (0.75 + 0.25 * wave(t, 2., cx * 0.001)) } else { 0. };
    let frame = if epic && t > at {
        fframes::svgr!(
            <g opacity={after(t, at, 0.6)}>
                <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="url(#g-epic)" stroke-width="4" />
                <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="#5ff2a8" stroke-width="10" opacity={0.35 + 0.15 * wave(t, 2., 0.)} filter="url(#blur8)" />
            </g>
        )
    } else {
        Svgr::empty()
    };
    fframes::svgr!(
        <g>
            <ellipse cx={cx} cy={cy} rx={110. * scale} ry={130. * scale} fill="url(#g-cyan)" opacity={pulse} />
            {ring}
            <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale({s:.3})")}>
                <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.45" />
                {card_front(art)}
                {frame}
            </g>
        </g>
    )
}

fn ease(k: f32) -> f32 {
    1. - (1. - k).powi(3)
}

impl Scene for Challenge {
    fn name(&self) -> &'static str {
        "BossChallenge"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(field), Some(nest), Some(warden)) = (
            ctx.get_image("glowcap-hollows.png"),
            ctx.get_image("card-bramble-nest.png"),
            ctx.get_image("card-canopy-vinewarden.png"),
        ) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let surge = frame.animate(&self.surge);
        let painting = painting(&self.sh, &frame, field, Grade { dusk: 0.9, dark: 0.45, ..Default::default() });
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
                let body = 0.1 + 0.2 * surge + 0.04 * wave(t, 2., i as f32 * 0.3);
                let head = if p < 1. {
                    fframes::svgr!(<g><circle cx={hx} cy={hy} r={hh} fill="url(#g-cyan)" /><circle cx={hx} cy={hy} r="5" fill="#fffef4" /></g>)
                } else {
                    Svgr::empty()
                };
                let pulses = (0..4)
                    .flat_map(|k| {
                        let u = 0.5 * ((flow + k as f32 / 4.).rem_euclid(1.0));
                        [(u, "#e8fffb"), (1. - u, "#e4c8ff")]
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
                            <clipPath id={format!("gh-lane-{i}")}><rect x={LANE_L - 10.} y="0" width={(hx - LANE_L + 10.).max(0.1)} height="720" /></clipPath>
                        </defs>
                        <g clip-path={format!("url(#gh-lane-{i})")}>
                            <path d={shape} fill="url(#g-lane-cyan)" opacity={body} />
                            <path d={edges.clone()} stroke="url(#g-lane-cyan)" stroke-width="10" opacity={0.35 + 0.4 * surge} filter="url(#blur8u)" />
                            <path d={edges} stroke="url(#g-lane-cyan)" stroke-width="2.5" />
                            {pulses}
                        </g>
                        {head}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // Roots burst out of the moss along the lanes, from her side toward yours.
        let grow = frame.animate(&self.roots);
        let roots = (0..4)
            .map(|e| {
                let (lane, side) = match e {
                    0 => (0, -1.),
                    1 => (0, 1.),
                    2 => (2, -1.),
                    _ => (2, 1.),
                };
                let sway = 4. * wave(t, 1., e as f32 * 0.2);
                let pts = (0..=12)
                    .map(|j| {
                        let u = 1. - j as f32 / 12. * 0.85;
                        let (x, y, h) = lane_at(lane, u);
                        (x, y + side * h / 2. + 8. * (j as f32 * 1.4 + e as f32).sin() + sway)
                    })
                    .collect::<Vec<_>>();
                let center = spline(&pts, 3);
                let d = taper(&center, 9., 2., grow);
                let thorns = (1..10)
                    .filter(|j| (*j as f32) / 10. < grow)
                    .map(|j| {
                        let p = center[(center.len() - 1) * j / 10];
                        fframes::svgr!(<path d={thorn(9.)} transform={format!("translate({:.1} {:.1}) rotate({:.0})", p.0, p.1, if j % 2 == 0 { 0. } else { 180. })} fill="#120c08" />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g>
                        <path d={d.clone()} fill="none" stroke="#5ff2a8" stroke-width="6" opacity="0.3" filter="url(#blur3u)" />
                        <path d={d.clone()} fill="#120c08" stroke="#5ff2a8" stroke-width="1" stroke-opacity="0.8" />
                        {thorns}
                        {burst(center[((center.len() - 1) as f32 * grow) as usize].0, center[((center.len() - 1) as f32 * grow) as usize].1, if grow < 1. { 0.1 } else { 9. }, 0.5, 6, 170 + e as u32, 120., "#8a9a5a")}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let hero_flag = fframes::svgr!(<circle r="18" fill="#fff4cc" stroke="#a8641a" stroke-width="3" />);
        let hero_drop = frame.animate(&self.hero_drop);
        let hero_banner = fframes::svgr!(<g transform={format!("translate(84 {:.1})", 560. + hero_drop)}>{banner(t, 380., "#f0b83c", "#7a4a0c", hero_flag, 0.)}</g>);
        // The Bramble Nest slams into the middle Lane; the Vinewarden lands behind it.
        let (nx, ny, _) = lane_at(1, NEST_U);
        let (wx, wy, _) = lane_at(1, WARDEN_U);
        let wall = land_card(nest, t, NEST_AT, frame.animate(&self.nest), (nx, ny), 0.9, false);
        let guard = land_card(warden, t, WARDEN_AT, frame.animate(&self.warden), (wx, wy - 8.), 1.08, true);
        // Glimmerbough rises at the far end, and her staff flares.
        let rise_in = frame.animate(&self.rise_in);
        let rise = frame.animate(&self.rise);
        let boss = if rise_in > 0. {
            fframes::svgr!(
                <g>
                    <circle cx="1110" cy="300" r={240. + 120. * surge} fill="url(#g-cyan)" opacity={0.35 + 0.3 * surge} />
                    <g transform={format!("translate(1120 {:.1}) scale(0.78)", 716. + rise)} opacity={rise_in}>{glimmerbough(t, rise_in, -8. * surge, 0.6 + 0.7 * surge)}</g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let flash = frame.animate(&self.flash);
        let zoom = frame.animate(&self.punch);
        let (kx, ky) = shake(t, WARDEN_AT, 12.);
        let (nkx, nky) = shake(t, NEST_AT, 8.);
        let fog = Fog { density: 0.4, soft: 0.25, light: Color::hex("#3a6a6a"), shade: Color::hex("#0a1418"), dir: (-0.35, 0.05), scale: 1.6, seed: 17.0 };
        fframes::svgr!(
            <g>
                <defs>
                    <linearGradient id="g-lane-cyan" gradientUnits="userSpaceOnUse" x1="150" y1="0" x2="880" y2="0">
                        <stop offset="0" stop-color="#bffcf2" />
                        <stop offset="0.48" stop-color="#e8fffb" />
                        <stop offset="0.52" stop-color="#e4c8ff" />
                        <stop offset="1" stop-color="#9a4aff" />
                    </linearGradient>
                </defs>
                <g transform={format!("translate(640 360) scale({zoom:.4}) translate(-640 -360)")}>
                    <g transform={format!("translate({:.1} {:.1})", kx + nkx, ky + nky)}>
                        <g transform="scale(0.8)">{painting}</g>
                        <rect width="1280" height="720" fill="url(#g-top-shade)" />
                        {boss}
                        {lanes}
                        {roots}
                        {guard}
                        {wall}
                        {hero_banner}
                    </g>
                </g>
                {fog.draw(&self.sh, &frame, 0.5, (-40., -60., 1360., 300.))}
                {motes(t, 0.5 + 0.5 * surge, 861)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#e8fffb" opacity={flash} />
            </g>
        )
    }
}
