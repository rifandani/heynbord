//! Ending: the giant rests, the First Gardener, the empty camp, the Colossus, the Hollow Marches.
use crate::fx::*;
use crate::hollows::{leaf, spline, taper};
use crate::mesa::{after, burst, cut_seal, dust_burst, ease_out, flash, shock_ring, stone};
use crate::opening::gash;
use crate::wood::*;
use crate::CLIP_FRAMES;
use fframes::{Color, Duration, FFramesContext, Frame, Scene, Shader, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const SUN: (f32, f32, f32) = (1.0, 0.84, 0.55);

// ---------------------------------------------------------------- 1. Rest

const SIT_AT: f32 = 0.5;
const BREATH_AT: f32 = 2.9;
/// Cave mouths under the beard, in face space, and the time their eyes go out.
const CAVES: [(f32, f32, f32); 4] = [(120., 840., 1.9), (360., 880., 2.4), (930., 880., 2.9), (1170., 840., 3.4)];

#[derive(Debug)]
pub struct Rest {
    sh: Shaders,
    bark: Shader,
    sink: Anim,
    lids: Anim,
    glow: Anim,
}

impl Rest {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            bark: bark_shader(),
            sink: spring(SIT_AT, 0., 46., HEAVY),
            lids: keys(&[(0., SIT_AT, 0.9, 0.85, Easing::EaseOut), (SIT_AT + 0.6, 4.6, 0.85, 0.3, Easing::EaseInOut)]),
            glow: tw(SIT_AT + 0.6, 4.6, 1., 0.4, Easing::EaseInOut),
        }
    }
}

/// A big root over the ground in face space.
fn root_arch<'a>(pts: &[(f32, f32)], w0: f32, w1: f32) -> Svgr<'a> {
    let center = spline(pts, 6);
    let d = taper(&center, w0, w1, 1.);
    fframes::svgr!(
        <g>
            <path d={d.clone()} fill="#000" opacity="0.5" transform="translate(6 14)" filter="url(#blur8)" />
            <path d={d.clone()} fill="url(#tw-root-dark)" />
            <path d={d} fill="none" stroke="#e8c088" stroke-width="2" opacity="0.18" />
        </g>
    )
}

impl Scene for Rest {
    fn name(&self) -> &'static str {
        "EndingRest"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let sink = frame.animate(&self.sink);
        let cam = (640., 470. - sink, 0.82);
        let glow = frame.animate(&self.glow) * (0.9 + 0.1 * wave(t, 1., 0.));
        let pose = Pose { open: frame.animate(&self.lids), anger: 0., mouth: 0.12 + 0.08 * after(t, BREATH_AT, 0.5) * (1. - after(t, BREATH_AT + 1.2, 0.8)), glow, look: 0. };
        let face = giant_face(&self.bark, &frame, t, pose, cam, 0.95);
        // Roots and dark cave mouths under the beard; beast eyes go out one by one.
        let caves = CAVES
            .iter()
            .enumerate()
            .map(|(i, &(x, y, out))| {
                let open = 1. - ((t - out) / 0.3).clamp(0., 1.);
                let blink = if t < out { 0.4 + 0.6 * ((loop_phase(t + i as f32 * 0.3) - 0.5).abs() * 20.).min(1.) } else { 1. };
                fframes::svgr!(
                    <g>
                        <ellipse cx={x} cy={y} rx="130" ry="70" fill="#030201" opacity="0.95" filter="url(#blur8)" />
                        {beast_eyes(x, y - 8., 19., open * blink, i == 1)}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let ground = fframes::svgr!(
            <g transform={view(cam)}>
                <rect x="-300" y="790" width="1880" height="400" fill="#1a1008" />
                {caves}
                {root_arch(&[(-260., 980.), (-60., 800.), (180., 760.), (300., 820.), (420., 980.)], 120., 60.)}
                {root_arch(&[(240., 1000.), (480., 840.), (640., 820.), (820., 860.), (980., 1000.)], 110., 60.)}
                {root_arch(&[(860., 1000.), (1060., 800.), (1260., 780.), (1420., 860.), (1560., 1000.)], 120., 60.)}
            </g>
        );
        // The heavy jolt throws dust and leaves; a long breath blows leaves out of the beard.
        let (sx, sy) = shake(t, SIT_AT + 0.08, 16.);
        let (mx, my) = (640. + (640. - cam.0) * cam.2, 360. + (600. - cam.1) * cam.2);
        let breath_leaves = (0..24u32)
            .filter_map(|k| {
                let dt = t - BREATH_AT - 0.3 * rnd(k, 3);
                if !(0.0..1.6).contains(&dt) {
                    return None;
                }
                let a = lerp(-0.4, 0.4, rnd(k, 4)) + PI / 2.;
                let d = 300. * (1. - (-dt * 1.5).exp()) * lerp(0.6, 1.3, rnd(k, 5));
                let (x, y) = (mx + a.cos() * d * 2.2 * lerp(-1., 1., rnd(k, 6)), my + a.sin() * d * 0.6 + 60. * dt * dt);
                let fill = LEAF_FILLS[k as usize % 4];
                Some(fframes::svgr!(<path d={leaf(14.)} transform={format!("translate({x:.1} {y:.1}) rotate({:.0})", 400. * dt + 90. * rnd(k, 7))} fill={fill} opacity={1. - dt / 1.6} />))
            })
            .collect::<Vec<_>>();
        let motes = Motes { count: 40, seed: 3101, area: (0., 60., 1280., 700.), rise: 160., period: LOOP, size: (1., 2.6), sway: 30., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <g transform={format!("translate({sx:.1} {sy:.1})")}>
                    {face}
                    {ground}
                </g>
                <rect width="1280" height="720" fill="#ff9a3a" opacity="0.1" />
                {rays(&self.sh, &frame, (-160., -140.), 0.5, 1.1, SUN)}
                {dust_burst(640., 700., t - SIT_AT - 0.08, 1.8, 18, 3111, 900., "url(#g-moss-dust)")}
                {falling(t, 0.55 + 0.45 * (1. - after(t, SIT_AT + 0.2, 2.)), 22, 3121, 16., (0., -40., 1280., 760.))}
                {breath_leaves}
                {motes.draw(t, 0.55)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <defs>
                    <linearGradient id="tw-root-dark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#5a3a1e" />
                        <stop offset="0.5" stop-color="#2e1c0c" />
                        <stop offset="1" stop-color="#120a04" />
                    </linearGradient>
                </defs>
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Gardener

/// The same cuts as in the opening, in face space.
const HEAL_CUTS: [((f32, f32), (f32, f32)); 3] = [((170., 470.), (270., 560.)), ((300., 450.), (410., 572.)), ((440., 482.), (520., 556.))];
const HEAL_AT: [f32; 3] = [1.0, 2.0, 3.0];
const HEAL_LEN: f32 = 0.55;
const GARDEN_CAM: (f32, f32, f32) = (330., 515., 1.8);

#[derive(Debug)]
pub struct Gardener {
    sh: Shaders,
    bark: Shader,
    cam: Cam,
}

impl Gardener {
    pub fn new(sh: Shaders) -> Self {
        Self { sh, bark: bark_shader(), cam: camera(&[(0., 5.0, (350., 525., 1.86), GARDEN_CAM)]) }
    }
    /// Where the staff tip is, in screen space, and how bright.
    fn tip(&self, t: f32) -> ((f32, f32), f32) {
        let to_screen = |(x, y): (f32, f32)| (640. + (x - GARDEN_CAM.0) * GARDEN_CAM.2, 360. + (y - GARDEN_CAM.1) * GARDEN_CAM.2);
        let rest = (1180., 120.);
        let mut keys: Vec<(f32, (f32, f32))> = vec![(0.3, (1420., -120.)), (0.85, to_screen(HEAL_CUTS[0].0))];
        for (i, &(a, b)) in HEAL_CUTS.iter().enumerate() {
            keys.push((HEAL_AT[i], to_screen(a)));
            keys.push((HEAL_AT[i] + HEAL_LEN, to_screen(b)));
        }
        keys.push((4.1, rest));
        keys.push((9.0, rest));
        if t <= keys[0].0 {
            return (keys[0].1, 0.);
        }
        for w in keys.windows(2) {
            let ((t0, p0), (t1, p1)) = (w[0], w[1]);
            if t < t1 {
                let u = (t - t0) / (t1 - t0);
                let e = u * u * (3. - 2. * u);
                return ((lerp(p0.0, p1.0, e), lerp(p0.1, p1.1, e)), after(t, 0.3, 0.4));
            }
        }
        (rest, 1.)
    }
}

/// The glowing tip of Lethiel's staff: a twisted head of wood that holds a light.
fn staff<'a>((x, y): (f32, f32), glow: f32, t: f32) -> Svgr<'a> {
    let pulse = 0.85 + 0.15 * wave(t, 2., 0.2);
    let shaft = format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", x + 14., y + 10., x + 120., y - 60., x + 260., y - 200., x + 460., y - 420.);
    fframes::svgr!(
        <g>
            <path d={shaft.clone()} fill="none" stroke="#000" stroke-width="40" stroke-linecap="round" opacity="0.4" transform="translate(16 22)" filter="url(#blur8)" />
            <path d={shaft.clone()} fill="none" stroke="#2a180a" stroke-width="34" stroke-linecap="round" />
            <path d={shaft} fill="none" stroke="#b8885a" stroke-width="9" opacity="0.6" stroke-linecap="round" transform="translate(-6 -4)" />
            <circle cx={x} cy={y} r={(240. * glow).max(1.)} fill="url(#g-gold)" opacity={0.7 * glow * pulse} />
            <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", x + 26., y + 20., x - 44., y + 14., x - 50., y - 50., x + 6., y - 56., x + 32., y + 6., x + 58., y - 44., x + 30., y - 72., x - 8., y - 58.)} fill="none" stroke="#3a220e" stroke-width="10" stroke-linecap="round" />
            <circle cx={x} cy={y - 14.} r="60" fill="url(#g-gold)" opacity={glow} />
            <circle cx={x} cy={y - 14.} r={22. * pulse} fill="#fffbe0" opacity={glow} />
            {glint(x, y - 14., 11. * pulse, glow)}
        </g>
    )
}

impl Scene for Gardener {
    fn name(&self) -> &'static str {
        "EndingGardener"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let layer = bark_layer(&self.bark, &frame, cam, (0.8, 0.6, 0.38), (0.07, 0.04, 0.02), 0.7);
        let pose = Pose { open: 0.16 + 0.04 * wave(t, 1., 0.2), anger: 0., mouth: 0., glow: 0.35, look: 0. };
        let tf = view(cam);
        // Each cut closes behind a seam of golden light; small leaves sprout from it.
        let cuts = HEAL_CUTS
            .iter()
            .enumerate()
            .map(|(i, &(a, b))| {
                let k = ((t - HEAL_AT[i]) / HEAL_LEN).clamp(0., 1.);
                let close = ((t - HEAL_AT[i] - 0.15) / 0.7).clamp(0., 1.);
                let wound = gash(a, b, 1. - ease_out(close), 0.75 * (1. - close), t, i as u32 + 3);
                let reach = (lerp(a.0, b.0, k), lerp(a.1, b.1, k));
                let breathe = 0.7 + 0.3 * wave(t, 1., i as f32 * 0.2);
                let seam = if k > 0. {
                    let d = format!("M{:.1} {:.1} L{:.1} {:.1}", a.0, a.1, reach.0, reach.1);
                    let o = lerp(1., 0.45 * breathe, close);
                    fframes::svgr!(
                        <g>
                            <path d={d.clone()} stroke="#ffd060" stroke-width="16" stroke-linecap="round" opacity={0.5 * o} filter="url(#blur8u)" />
                            <path d={d} stroke="#fff8d8" stroke-width="3.5" stroke-linecap="round" opacity={o} />
                        </g>
                    )
                } else {
                    Svgr::empty()
                };
                let sprouts = (0..4)
                    .map(|j| {
                        let u = 0.2 + 0.2 * j as f32;
                        let grow = ease_out(((t - HEAL_AT[i] - 0.4 - 0.12 * j as f32) / 0.6).clamp(0., 1.));
                        let (x, y) = (lerp(a.0, b.0, u), lerp(a.1, b.1, u));
                        let sway = 8. * wave(t, 1., u + i as f32 * 0.3);
                        let side = if j % 2 == 0 { -50. } else { 50. };
                        fframes::svgr!(<path d={leaf(22. * grow + 0.1)} transform={format!("translate({x:.1} {y:.1}) rotate({:.1})", side + sway)} fill="url(#g-leaf-green)" stroke="#1a3a0a" stroke-width="1" opacity={grow} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(<g>{wound}{seam}{sprouts}</g>)
            })
            .collect::<Vec<_>>();
        let (tip, glow) = self.tip(t);
        let sparks = HEAL_AT
            .iter()
            .enumerate()
            .map(|(i, &at)| burst(tip.0, tip.1, t - at - 0.2, 0.9, 10, 60 + i as u32, 200., "#fff2c0"))
            .collect::<Vec<_>>();
        let motes = Motes { count: 46, seed: 3201, area: (0., 60., 1280., 700.), rise: 260., period: LOOP, size: (1., 3.), sway: 26., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <image href={layer.href()} x="0" y="0" width="1280" height="720" />
                <g transform={tf.clone()}>
                    <rect x="-300" y="-300" width="1880" height="1320" fill="url(#g-face-light)" opacity="0.7" />
                    <ellipse cx={F_EYE_L.0} cy={F_EYE_L.1 + 10.} rx="190" ry="120" fill="#080302" opacity="0.7" filter="url(#blur18)" />
                    {giant_eye(F_EYE_L, -1., pose, t)}
                </g>
                {carved(&layer, cam, &brow_shape(-1., 0.), "tw-heal-brow", (60., -40.), "url(#g-brow-shade)", (8., 30.))}
                <g transform={tf}>{cuts}</g>
                {rays(&self.sh, &frame, (-160., -140.), 0.45, 1.1, SUN)}
                {staff(tip, glow, t)}
                {sparks}
                {motes.draw(t, 0.7)}
                {falling(t, 0.4, 8, 3211, 14., (0., 0., 1280., 720.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.75" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Camp

const GUTTER_AT: f32 = 0.4;
const DAY_AT: f32 = 1.0;
const TIP_AT: f32 = 2.0;
const SPILL_AT: f32 = 2.3;
const STOP_AT: f32 = 3.7;
const FROST_AT: f32 = 3.8;
const PURSE: (f32, f32) = (900., 520.);
/// Where each spilled coin comes to rest: (x, y, r, ratio, rot), and when.
const COINS: [(f32, f32, f32, f32, f32, f32); 7] = [
    (980., 560., 22., 0.42, 12., 2.6),
    (1040., 540., 18., 0.4, -20., 2.75),
    (930., 580., 20., 0.45, 40., 2.5),
    (1100., 585., 22., 0.44, 5., 2.9),
    (860., 590., 19., 0.42, -30., 2.65),
    (1010., 610., 24., 0.46, 70., 3.0),
    (790., 560., 18., 0.4, 15., 2.85),
];

#[derive(Debug)]
pub struct Camp {
    sh: Shaders,
    day: Anim,
    tip: Anim,
    seal: Anim,
}

impl Camp {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            day: tw(DAY_AT, DAY_AT + 1.2, 0., 1., Easing::EaseInOut),
            tip: keys(&[(TIP_AT, TIP_AT + 0.3, 0., 1., Easing::EaseIn)]),
            seal: tw(4.0, 4.6, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Camp {
    fn name(&self) -> &'static str {
        "EndingCamp"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let day = frame.animate(&self.day);
        // The fallen lantern's cold flame gutters out.
        let flame = (1. - ((t - GUTTER_AT) / 1.0).clamp(0., 1.)) * (0.7 + 0.3 * flicker(t, 0.7));
        let lantern_fallen = fframes::svgr!(
            <g transform="translate(400 606) rotate(-78)">
                <circle cx="0" cy="26" r={(420. * flame).max(1.)} fill="url(#g-witch)" opacity={0.75 * flame} />
                {lantern(t, 0.7, flame, 2.0)}
            </g>
        );
        let tip = frame.animate(&self.tip);
        let seal = frame.animate(&self.seal);
        let purse_layer = fframes::svgr!(<g transform={format!("translate({:.1} {:.1}) rotate({:.1}) scale(1.4)", PURSE.0, PURSE.1 + 20. * tip, 70. * tip)}>{purse(t, seal)}</g>);
        // Coins of bone spill out of the purse and roll; one rolls to the camera.
        let spilled = COINS
            .iter()
            .enumerate()
            .map(|(i, &(x, y, r, ratio, rot, at))| {
                let k = ((t - SPILL_AT) / (at - SPILL_AT)).clamp(0., 1.);
                if t < SPILL_AT {
                    return Svgr::empty();
                }
                let e = ease_out(k);
                let (sx, sy) = (PURSE.0 + 30., PURSE.1 - 20.);
                let hop = 50. * (PI * k).sin() * (1. - k);
                let px = lerp(sx, x, e);
                let py = lerp(sy, y, e) - hop;
                let spin = lerp(rot + 400. * (1. - e), rot, e);
                let rat = lerp(0.9, ratio, e);
                let frost = after(t, FROST_AT + 0.06 * i as f32, 0.8);
                fframes::svgr!(<g transform={format!("translate({px:.1} {py:.1})")}>{bone_coin(r, rat, spin, frost)}</g>)
            })
            .collect::<Vec<_>>();
        let hero = if t > SPILL_AT {
            let k = ((t - SPILL_AT) / (STOP_AT - SPILL_AT)).clamp(0., 1.);
            let e = ease_out(k);
            let (x, y) = (lerp(PURSE.0 + 20., 640., e), lerp(PURSE.1, 600., e) - 60. * (PI * k).sin() * (1. - k));
            let r = lerp(20., 104., e * e);
            // It rolls on its edge, then wobbles down flat.
            let wob = ((t - STOP_AT) * 2.).max(0.);
            let ratio = if t < STOP_AT { lerp(0.08, 0.36, k) } else { lerp(0.36, 0.64, (wob / 1.).min(1.)) + 0.06 * (-wob * 3.).exp() * (wob * 14.).sin() };
            let rot = if t < STOP_AT { 360. * k * 2. } else { 0. };
            let frost = after(t, FROST_AT, 0.9);
            let mist = if frost > 0. {
                let puffs = (0..6u32)
                    .map(|j| {
                        let u = (loop_phase(t) + j as f32 / 6.).rem_euclid(1.);
                        fframes::svgr!(<circle cx={x + lerp(-60., 60., rnd(j, 3)) + 20. * u} cy={y - 10. - 120. * u} r={20. + 40. * u} fill="url(#g-steam)" opacity={0.35 * frost * (PI * u).sin()} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(<g>{puffs}</g>)
            } else {
                Svgr::empty()
            };
            let glitter = (0..5u32)
                .map(|j| {
                    let u = (loop_phase(t) * 2. + j as f32 / 5.).rem_euclid(1.);
                    glint(x + lerp(-r, r, rnd(j, 7)) * 0.8, y + lerp(-r, r, rnd(j, 8)) * ratio * 0.8, 3., frost * (PI * u).sin().powi(4))
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g>
                    <ellipse cx={x} cy={y + r * ratio * 0.9} rx={r * 1.1} ry={r * 0.22} fill="#000" opacity="0.5" filter="url(#blur8)" />
                    <circle cx={x} cy={y} r={r * 1.8} fill="url(#g-frost)" opacity={0.5 * frost} />
                    <g transform={format!("translate({x:.1} {y:.1})")}>{bone_coin(r, ratio.max(0.05), rot, frost)}</g>
                    {glitter}
                    {mist}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let jars = [(560., 560., 0.), (640., 548., 1.), (1160., 560., 2.)]
            .iter()
            .map(|&(x, y, s)| fframes::svgr!(<g transform={format!("translate({x} {y})")}>{jar(lerp(70., 90., s / 2.), 1., t, s as u32 + 5)}</g>))
            .collect::<Vec<_>>();
        let knives = fframes::svgr!(
            <g>
                <g transform="translate(470 640) rotate(-12)">{knife(110., 0.3 + 0.7 * day)}</g>
                <g transform="translate(1180 630) rotate(196)">{knife(100., 0.3 + 0.7 * day)}</g>
            </g>
        );
        let dust = Motes { count: 50, seed: 3301, area: (0., 0., 900., 620.), rise: 90., period: LOOP, size: (0.8, 2.4), sway: 30., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <g transform="translate(640 400) scale(1.22) translate(-660 -470)">
                <rect x="-200" y="-200" width="1680" height="1120" fill="#0c0806" />
                <ellipse cx="420" cy="140" rx="560" ry="300" fill="#4a3018" opacity={0.5 * day} filter="url(#blur18)" />
                <rect width="1280" height="720" fill="url(#tw-hollow)" />
                <rect x="-20" y="560" width="1320" height="200" fill="url(#tw-floor)" />
                {root_arch(&[(-120., 520.), (120., 300.), (420., 160.), (760., 110.), (1100., 170.), (1400., 360.)], 140., 90.)}
                {root_arch(&[(1380., 760.), (1220., 520.), (1240., 300.), (1400., 120.)], 120., 70.)}
                {root_arch(&[(-120., 760.), (60., 600.), (120., 380.), (40., 200.)], 110., 60.)}
                {rays(&self.sh, &frame, (60., -120.), 0.65 * day, 1.0, SUN)}
                <ellipse cx="640" cy="600" rx="560" ry="90" fill="#ffd890" opacity={0.18 * day} filter="url(#blur18)" />
                {jars}
                {knives}
                {lantern_fallen}
                {purse_layer}
                {spilled}
                {hero}
                </g>
                {dust.draw(t, 0.7 * day)}
                <rect width="1280" height="720" fill="#0a0604" opacity={0.45 * (1. - day)} />
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.9" />
                <defs>
                    <radialGradient id="tw-hollow" cx="0.4" cy="0.3" r="0.8">
                        <stop offset="0" stop-color="#6a4a28" stop-opacity="0.35" />
                        <stop offset="1" stop-color="#050302" stop-opacity="0.9" />
                    </radialGradient>
                    <linearGradient id="tw-floor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#3a2614" />
                        <stop offset="1" stop-color="#140a04" />
                    </linearGradient>
                </defs>
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Colossus

const CARD: (f32, f32) = (640., 360.);
const CW: f32 = 330.;
const CH: f32 = 440.;
const COLS: usize = 5;
const ROWS: usize = 6;
const STACK_AT: f32 = 0.25;
const FRAME_AT: f32 = 2.4;
const BIRDS_IN: f32 = 3.1;

#[derive(Debug)]
pub struct Colossus {
    sh: Shaders,
    frame_draw: Anim,
    flash: Anim,
}

impl Colossus {
    pub fn new(sh: Shaders) -> Self {
        Self { sh, frame_draw: tw(FRAME_AT, FRAME_AT + 0.9, 0., 1., Easing::EaseInOut), flash: flash(FRAME_AT - 0.1, 0.22, 0.5) }
    }
}

impl Scene for Colossus {
    fn name(&self) -> &'static str {
        "EndingColossus"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(field), Some(art)) = (ctx.get_image("thornwood.png"), ctx.get_image("card-mountain-colossus.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let backdrop = painting(&self.sh, &frame, field, Grade { gold: 0.45, dusk: 0.3, dark: 0.35, ..Default::default() });
        let (tw_, th) = (CW / COLS as f32, CH / ROWS as f32);
        let (x0, y0) = (CARD.0 - CW / 2., CARD.1 - CH / 2.);
        // Each tile of the card starts as a rock on the ground, rolls in and flies to its place.
        let mut landed = 0;
        let tiles = (0..COLS * ROWS)
            .map(|k| {
                let (c, r) = (k % COLS, k / COLS);
                let seed = k as u32;
                let land = STACK_AT + 0.6 + 0.05 * (ROWS - 1 - r) as f32 * COLS as f32 * 0.2 + 0.9 * rnd(seed, 1) + 0.12 * r as f32;
                let start = STACK_AT + 0.35 * rnd(seed, 2);
                let k_fly = ((t - start) / (land - start)).clamp(0., 1.);
                if k_fly >= 1. {
                    landed += 1;
                }
                let side = if rnd(seed, 3) > 0.5 { 1. } else { -1. };
                let from = (CARD.0 + side * lerp(520., 760., rnd(seed, 4)), 640. + 40. * rnd(seed, 5));
                let to = (x0 + tw_ * (c as f32 + 0.5), y0 + th * (r as f32 + 0.5));
                // Roll along the ground, then leap up into place.
                let roll = (k_fly / 0.45).min(1.);
                let leap = ((k_fly - 0.45) / 0.55).clamp(0., 1.);
                let gx = lerp(from.0, lerp(from.0, to.0, 0.6), ease_out(roll));
                let px = lerp(gx, to.0, ease_out(leap));
                let py = lerp(from.1, to.1, leap * leap * (3. - 2. * leap)) - 120. * (PI * leap).sin();
                let rot = lerp(side * -540. * (1. - roll), 0., leap) + if leap < 1. { 30. * (1. - leap) * side } else { 0. };
                let morph = ((leap - 0.65) / 0.35).clamp(0., 1.);
                let s = lerp(0.8, 1., morph);
                let id = format!("tw-tile-{k}");
                let (cx0, cy0) = (tw_ * c as f32, th * r as f32);
                fframes::svgr!(
                    <g transform={format!("translate({px:.1} {py:.1}) rotate({rot:.1}) scale({s:.3})")}>
                        <defs><clipPath id={id.clone()}><rect x={-tw_ / 2. - 0.6} y={-th / 2. - 0.6} width={tw_ + 1.2} height={th + 1.2} /></clipPath></defs>
                        <g clip-path={format!("url(#{id})")} opacity={morph}>
                            <image href={art.href()} x={-cx0 - tw_ / 2.} y={-cy0 - th / 2.} width={CW} height={CH} />
                        </g>
                        <g opacity={1. - morph}>
                            <path d={stone(seed + 40, tw_ * 0.62)} fill="url(#tw-rock)" stroke="#2a241c" stroke-width="2" />
                            <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", -tw_ * 0.3, -th * 0.2, tw_ * 0.2, -th * 0.28)} stroke="#c8c0b0" stroke-width="2" opacity="0.5" />
                            <circle cx={tw_ * 0.1} cy={th * 0.12} r={tw_ * 0.12} fill="#4a6a2a" opacity="0.7" />
                        </g>
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // A frame of stone and moss draws itself around the card, with the Epic glow.
        let fk = frame.animate(&self.frame_draw);
        let perim = 2. * (CW + CH) + 40.;
        let frame_layer = if fk > 0. {
            let moss_pts = (0..18)
                .map(|k| {
                    let u = k as f32 / 17.;
                    (x0 - 6. + (CW + 12.) * u, y0 - 8., lerp(18., 46., rnd(k, 61)) * fk)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g>
                    <rect x={x0 - 14.} y={y0 - 14.} width={CW + 28.} height={CH + 28.} rx="18" fill="none" stroke="url(#g-epic)" stroke-width="22" opacity={0.45 * fk * (0.8 + 0.2 * wave(t, 2., 0.))} filter="url(#blur8)" />
                    <rect x={x0 - 10.} y={y0 - 10.} width={CW + 20.} height={CH + 20.} rx="14" fill="none" stroke="#6a6458" stroke-width="16" stroke-dasharray={format!("{:.1} {perim:.1}", perim * fk)} />
                    <rect x={x0 - 10.} y={y0 - 10.} width={CW + 20.} height={CH + 20.} rx="14" fill="none" stroke="url(#g-epic)" stroke-width="4" stroke-dasharray={format!("{:.1} {perim:.1}", perim * fk)} />
                    <rect x={x0 - 18.} y={y0 - 18.} width={CW + 36.} height={CH + 36.} rx="20" fill="none" stroke="#2a241c" stroke-width="3" stroke-dasharray={format!("{:.1} {perim:.1}", perim * fk)} opacity="0.8" />
                    {moss(t, &moss_pts, 3401, 0.)}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Small birds fly in and land on the top edge of the card, then hop.
        let birds = (0..5u32)
            .map(|k| {
                let at = BIRDS_IN + 0.15 * k as f32;
                let land = (x0 + 52. + 56. * k as f32, y0 - 20.);
                let from = (if k % 2 == 0 { -60. } else { 1340. }, lerp(80., 260., rnd(k, 3)));
                let u = ((t - at) / 0.9).clamp(0., 1.);
                if t < at {
                    return Svgr::empty();
                }
                let e = ease_out(u);
                let (x, y) = (lerp(from.0, land.0, e), lerp(from.1, land.1, e) - 60. * (PI * u).sin());
                let hop = if u >= 1. { 6. * (wave(t, 2., rnd(k, 5)).max(0.)).powi(6) } else { 0. };
                let flap = if u < 1. { wave(t, 12., rnd(k, 6)) } else { 0.15 };
                let facing = if from.0 < land.0 { 1. } else { -1. };
                let body = if u < 1. {
                    fframes::svgr!(<path d={bird(12., flap)} fill="#3a2a1a" />)
                } else {
                    fframes::svgr!(
                        <g transform={format!("scale({facing} 1)")}>
                            <ellipse cx="0" cy="-8" rx="10" ry="7" fill="#6a4a2a" />
                            <circle cx="8" cy="-15" r="5" fill="#7a5a34" />
                            <path d="M12 -15 L17 -14 L12 -13Z" fill="#e8a83a" />
                            <circle cx="9" cy="-16" r="1.2" fill="#120804" />
                            <path d="M-9 -8 L-18 -12 L-16 -6Z" fill="#4a3018" />
                            <ellipse cx="2" cy="-6" rx="5" ry="4" fill="#e8c890" />
                        </g>
                    )
                };
                fframes::svgr!(<g transform={format!("translate({x:.1} {:.1}) scale(1.7)", y - hop)}>{body}</g>)
            })
            .collect::<Vec<_>>();
        let rumble = if landed < COLS * ROWS { 2.0 } else { 0. };
        let (sx, sy) = (rumble * (t * 47.).sin(), rumble * (t * 39.).cos());
        let dust = Motes { count: 46, seed: 3411, area: (0., 200., 1280., 520.), rise: 140., period: LOOP, size: (1., 3.), sway: 30., fill: "url(#g-moss-dust)" };
        fframes::svgr!(
            <g>
                <g transform="scale(0.8)" filter="url(#blur3)">{backdrop}</g>
                <rect width="1280" height="720" fill="#120a04" opacity="0.4" />
                {rays(&self.sh, &frame, (-160., -140.), 0.5, 1.1, SUN)}
                <ellipse cx={CARD.0} cy={CARD.1} rx="320" ry="380" fill="url(#g-gold)" opacity={0.35 * after(t, FRAME_AT, 0.8) * (0.8 + 0.2 * wave(t, 2., 0.3))} />
                <ellipse cx={CARD.0} cy="640" rx="420" ry="40" fill="#000" opacity="0.45" filter="url(#blur18)" />
                <g transform={format!("translate({sx:.1} {sy:.1})")}>
                    {tiles}
                    {frame_layer}
                </g>
                {dust_burst(CARD.0, 600., t - FRAME_AT + 0.1, 1.4, 16, 3421, 520., "url(#g-moss-dust)")}
                {shock_ring(CARD.0, 610., t - FRAME_AT + 0.1, 0.8, 520., 60., "#ffe2a0")}
                {birds}
                {dust.draw(t, 0.6)}
                {falling(t, 0.45, 8, 3431, 14., (0., 0., 1280., 720.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#fff4dc" opacity={frame.animate(&self.flash)} />
                <defs>
                    <linearGradient id="tw-rock" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#b8b0a0" />
                        <stop offset="0.5" stop-color="#7a7262" />
                        <stop offset="1" stop-color="#3a342a" />
                    </linearGradient>
                </defs>
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Marches

const SPIN_END: f32 = 1.4;
const DIVE_AT: f32 = 1.5;
const THROUGH_AT: f32 = 2.4;
const BOWLS: [((f32, f32), f32); 2] = [((1058., 373.), 3.0), ((1173., 380.), 3.3)];
const FERRY_LAMP: (f32, f32) = (1188., 703.);
const MARCH_CAM: (f32, f32, f32) = (975., 470., 1.3);

#[derive(Debug)]
pub struct Marches {
    sh: Shaders,
    rise: Anim,
    dive: Anim,
    cam: Cam,
}

impl Marches {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            rise: spring(0.1, 260., 0., SOFT),
            dive: tw(DIVE_AT, THROUGH_AT, 0., 1., Easing::EaseIn),
            cam: camera(&[(DIVE_AT, 4.9, (1100., 640., 1.9), MARCH_CAM)]),
        }
    }
}

impl Scene for Marches {
    fn name(&self) -> &'static str {
        "EndingMarches"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("hollow-marches-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let dive = frame.animate(&self.dive);
        // The green fire bowls of the bridge flare one after another.
        let bowls = BOWLS
            .iter()
            .map(|&((x, y), at)| {
                let k = bloom_flare(t - at);
                let f = flicker(t, x * 0.01);
                fframes::svgr!(
                    <g>
                        <circle cx={x} cy={y - 8.} r={16. + 22. * k + 4. * f} fill="url(#g-witch)" opacity={(0.3 + 0.5 * k.min(1.)) * (0.8 + 0.2 * f)} />
                        <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {x:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}Z", x - 7., y, x - 8., y - 10., x - 2., y - 16., y - 24. - 10. * k - 3. * f, x + 2., y - 16., x + 8., y - 10., x + 7., y)} fill="#8aff9a" opacity={0.4 + 0.6 * k.min(1.)} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let lamp = 0.6 + 0.4 * flicker(t, 0.5);
        let ferry = fframes::svgr!(<circle cx={FERRY_LAMP.0} cy={FERRY_LAMP.1} r={26. + 6. * lamp} fill="url(#g-witch)" opacity={0.55 * lamp} />);
        let frost = (0..18u32)
            .map(|k| {
                let (x, y) = (lerp(900., 1560., rnd(k, 21)), lerp(40., 260., rnd(k, 22)));
                let u = (loop_phase(t) * 2. + rnd(k, 23)).rem_euclid(1.);
                glint(x, y, 3., (PI * u).sin().powi(6) * after(t, THROUGH_AT, 1.))
            })
            .collect::<Vec<_>>();
        let marches = || fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {painting(&self.sh, &frame, map, Grade { dusk: 0.2, gold: 0.05, dark: 0.1, ..Default::default() })}
                    {ferry}
                    {bowls}
                    {frost}
                </g>
                <rect width="1280" height="720" fill="#9ab8d8" opacity="0.08" />
            </g>
        );
        // A coin of bone spins up in front of the camera; the camera flies through its hole.
        let rise = frame.animate(&self.rise);
        let spin = (t / SPIN_END).min(1.);
        let turns = 2.5 * (1. - (1. - spin).powi(2));
        let ratio = (TAU * turns).cos().abs().max(0.05);
        let r = 180. * (1. + 17. * dive * dive * dive);
        let hole = r * 0.26;
        let coin_layer = if t < THROUGH_AT + 0.05 {
            let bokeh = (0..14u32)
                .map(|k| {
                    let x = lerp(0., 1280., rnd(k, 61)) + 20. * wave(t, 1., rnd(k, 62));
                    let y = lerp(0., 720., rnd(k, 63));
                    fframes::svgr!(<circle cx={x} cy={y} r={lerp(30., 90., rnd(k, 64))} fill="url(#g-witch)" opacity={0.18 * (0.8 + 0.2 * wave(t, 1., rnd(k, 65)))} />)
                })
                .collect::<Vec<_>>();
            let open = if t > DIVE_AT - 0.2 { 1. } else { 0. };
            fframes::svgr!(
                <g>
                    <rect width="1280" height="720" fill="#0a0c10" />
                    <g opacity={1. - dive}>{bokeh}</g>
                    <defs><clipPath id="tw-hole"><circle cx="640" cy={360. + rise} r={hole * ratio.max(0.3)} /></clipPath></defs>
                    <g clip-path="url(#tw-hole)" opacity={open * after(t, DIVE_AT - 0.2, 0.3)}>{marches()}</g>
                    <circle cx="640" cy={360. + rise} r={r * 1.6} fill="url(#g-frost)" opacity={0.35 * (1. - dive)} />
                    <g transform={format!("translate(640 {:.1})", 360. + rise)}>{bone_coin(r, ratio, 0., 0.6)}</g>
                    {glint(640. - r * 0.5, 360. + rise - r * 0.4 * ratio, 6., (1. - dive) * (0.5 + 0.5 * (TAU * turns).sin().abs()))}
                </g>
            )
        } else {
            marches()
        };
        // Inside: mist drifts, and the cut seal burns faintly over the castle.
        let inside = after(t, THROUGH_AT - 0.1, 0.5);
        let seal = after(t, 3.6, 1.0) * (0.4 + 0.12 * wave(t, 1., 0.));
        let fog = Fog { density: 0.45, soft: 0.3, light: Color::hex("#e8f0f8"), shade: Color::hex("#8aa0b8"), dir: (0.5, -0.05), scale: 1.3, seed: 41.0 };
        let snow = Motes { count: 40, seed: 3501, area: (0., 0., 1280., 760.), rise: -300., period: LOOP, size: (1., 2.4), sway: 30., fill: "#f4f8ff" };
        fframes::svgr!(
            <g>
                {coin_layer}
                <g opacity={inside}>
                    {fog.draw(&self.sh, &frame, 0.45, (-40., 380., 1360., 360.))}
                    {snow.draw(t, 0.5)}
                    <circle cx="640" cy="150" r="140" fill="#14061e" opacity={0.3 * seal} filter="url(#blur18)" />
                    {cut_seal(640., 150., 70., seal)}
                </g>
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.75" />
            </g>
        )
    }
}

/// A flare that rises fast, overshoots and settles at 1 by the loop start.
fn bloom_flare(dt: f32) -> f32 {
    if dt <= 0. {
        return 0.;
    }
    let raw = (1. - (-dt * 8.).exp()) * (1. + 0.8 * (-dt * 3.).exp());
    lerp(raw, 1., (dt / 1.6).clamp(0., 1.).powi(3))
}
